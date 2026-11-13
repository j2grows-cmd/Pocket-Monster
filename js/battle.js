'use strict';
/* Turn-based battles: wild encounters, tamer battles, charming, XP and level-ups. */
const BATTLE_BG = {
  '-1': ['#4a3f5e', '#8a7a9a', '#8c8a98', '#74727e'], 0: ['#8fd3f0', '#dff2d0', '#7cc45c', '#63a84a'], 1: ['#9cc4e4', '#ece0c4', '#b9ad8c', '#9c9072'],
  2: ['#3c2838', '#b0553a', '#5e5458', '#463c40'], 3: ['#2f3d5e', '#6a8a7a', '#4f7a52', '#3c6240'], 4: ['#b8d8f0', '#f4fafd', '#eaf2f6', '#c8dce8'], 5: ['#7fd0f0', '#fbeec4', '#ecd9a0', '#d6c080'],
};
const STATUS_IMMUNE = { burn: 'Ember', frost: 'Frost', poison: 'Venom', stun: 'Spark' };
const stageMult = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
const accMult = n => n >= 0 ? (3 + n) / 3 : 3 / (3 - n);
const AUTO = 620;
const tell = s => say(s, AUTO);

function xpFrac(m) { const a = xpFor(m.lvl), b = xpFor(m.lvl + 1); return m.lvl >= 100 ? 1 : clamp((m.xp - a) / (b - a), 0, 1); }

/* Shared with the evolution scene: teach a move, asking what to forget if needed. */
async function learnMove(m, name) {
  if (m.moves.some(mv => mv.n === name)) return;
  const who = monName(m);
  if (m.moves.length < 4) { m.moves.push({ n: name, pp: MOVES[name].pp }); await tell(who + ' learned ' + name + '!'); return; }
  await say(who + ' wants to learn ' + name + ', but it already knows four moves.');
  Msg.set('Forget a move to make room for ' + name + '? (' + MOVES[name].type + (MOVES[name].pow ? ', power ' + MOVES[name].pow : ', status') + ')');
  const opts = m.moves.map(mv => ({ label: mv.n, right: MOVES[mv.n].type + (MOVES[mv.n].pow ? ' ' + MOVES[mv.n].pow : '') }));
  opts.push({ label: 'Keep the old moves' });
  const r = await choose(opts, { w: 250 });
  if (r >= 0 && r < 4) { const old = m.moves[r].n; m.moves[r] = { n: name, pp: MOVES[name].pp }; await tell(who + ' forgot ' + old + ' and learned ' + name + '!'); }
  else await tell(who + ' did not learn ' + name + '.');
}
/* Grant XP outside or inside battle. Returns true if the monster can now evolve. */
async function grantXp(m, amount, onLevel) {
  if (m.lvl >= 100) return false;
  m.xp += amount;
  let evolve = false;
  while (m.lvl < 100 && m.xp >= xpFor(m.lvl + 1)) {
    const before = statOf(m, 'hp'); m.lvl++;
    m.hp += statOf(m, 'hp') - before;
    if (onLevel) onLevel();
    await tell(monName(m) + ' grew to level ' + m.lvl + '!');
    for (const [l, mv] of DEX[m.id].learn) if (l === m.lvl) await learnMove(m, mv);
  }
  const evo = DEX[m.id].evo;
  if (evo && m.lvl >= evo.lvl) evolve = true;
  return evolve;
}

const Battle = {
  v: null,

  async start(opts) {
    const foes = opts.wild ? [opts.wild] : opts.party;
    const cell = World.map.cellAt(World.x, World.y);
    const mk = (mon, side) => ({ mon, side, st: { atk: 0, def: 0, foc: 0, wil: 0, spd: 0, acc: 0 }, flinch: false });
    const v = this.v = {
      opts, foes, fi: 0, wild: !!opts.wild, biome: World.map.interior ? -1 : cell.biome,
      me: mk(S.party[firstAlive()], 'me'), foe: mk(foes[0], 'foe'),
      meShow: 0, foeShow: 0, meDX: 0, foeDX: 0, meBlink: 0, foeBlink: 0, charm: null, turn: 0, runTries: 0, lastAct: 0,
      party: new Set(), evolve: new Set(),
    };
    v.meHp = v.me.mon.hp; v.foeHp = v.foe.mon.hp; v.meXp = xpFrac(v.me.mon); v.party.add(v.me.mon);
    const T_ = opts.trainer;
    const label = b => (b.side === 'foe' ? (v.wild ? 'The wild ' : 'The foe\'s ') : '') + monName(b.mon);
    const bstat = (b, k) => statOf(b.mon, k) * stageMult(b.st[k]) * (k === 'spd' && b.mon.status === 'stun' ? 0.5 : 1);
    const syncHp = b => tween(v, b.side + 'Hp', b.mon.hp, 320);
    const other = b => b === v.me ? v.foe : v.me;

    Game.scene = 'battle'; Msg.set(''); S.seen[v.foe.mon.id] = 1;
    await fadeIn(200);
    if (v.wild) { await tween(v, 'foeShow', 1, 260); await tell('A wild ' + monName(v.foe.mon) + ' appeared!'); }
    else { await tell(T_.name + ' wants to battle!'); tween(v, 'foeShow', 1, 260); await tell(T_.name + ' sent out ' + monName(v.foe.mon) + '!'); }
    tween(v, 'meShow', 1, 260); await tell('Go, ' + monName(v.me.mon) + '!');

    const inflict = async (b, st, loud) => {
      const d = DEX[b.mon.id];
      if (b.mon.status) { if (loud) await tell('But it failed!'); return; }
      if (d.types.includes(STATUS_IMMUNE[st])) { if (loud) await tell('It doesn\'t affect ' + label(b) + '...'); return; }
      b.mon.status = st; if (st === 'sleep') b.mon.sleep = R.int(2, 4);
      await tell(label(b) + { burn: ' was burned!', frost: ' got frostbite!', poison: ' was poisoned!', sleep: ' fell asleep!', stun: ' is stunned! It may be unable to move.' }[st]);
    };
    const stage = async (b, stat, delta) => {
      const cur = b.st[stat];
      if ((delta > 0 && cur >= 6) || (delta < 0 && cur <= -6)) { await tell(label(b) + '\'s ' + STAT_NAME[stat] + ' won\'t go any ' + (delta > 0 ? 'higher' : 'lower') + '!'); return; }
      b.st[stat] = clamp(cur + delta, -6, 6);
      await tell(label(b) + '\'s ' + STAT_NAME[stat] + (delta > 1 ? ' rose sharply!' : delta > 0 ? ' rose!' : delta < -1 ? ' fell sharply!' : ' fell!'));
    };
    const effects = async (user, target, mv, primary) => {
      if (mv.heal) {
        const max = statOf(user.mon, 'hp');
        if (user.mon.hp >= max) await tell('But ' + label(user) + ' is already at full HP!');
        else { user.mon.hp = Math.min(max, user.mon.hp + Math.floor(max * mv.heal)); await syncHp(user); await tell(label(user) + ' regained HP!'); }
      }
      if (mv.st && target.mon.hp > 0 && R.int(1, 100) <= mv.st[1]) await inflict(target, mv.st[0], primary);
      for (const [who, stat, delta, chance] of (mv.sg || [])) {
        const b = who === 's' ? user : target;
        if (b.mon.hp > 0 && R.int(1, 100) <= chance) await stage(b, stat, delta);
      }
    };
    const useMove = async (user, target, slot) => {
      const mon = user.mon, name = label(user);
      if (mon.status === 'sleep') { mon.sleep--; if (mon.sleep > 0) { await tell(name + ' is fast asleep.'); return; } mon.status = null; await tell(name + ' woke up!'); }
      if (user.flinch) { user.flinch = false; await tell(name + ' flinched!'); return; }
      if (mon.status === 'stun' && R.chance(0.25)) { await tell(name + ' is stunned and can\'t move!'); return; }
      const mv = MOVES[slot.n]; if (slot.pp > 0) slot.pp--;
      await tell(name + ' used ' + mv.name + '!');
      const selfOnly = mv.cat === 'S' && !mv.st && (!mv.sg || mv.sg.every(s => s[0] === 's'));
      if (!mv.sure && !selfOnly && R.int(1, 100) > mv.acc * accMult(user.st.acc)) { await tell(name + '\'s move missed!'); return; }
      if (mv.cat === 'S') { await effects(user, target, mv, true); return; }
      const hits = mv.multi ? R.int(mv.multi[0], mv.multi[1]) : 1, td = DEX[target.mon.id], ud = DEX[mon.id];
      const eff = typeMult(mv.type, td.types);
      let total = 0, n = 0;
      for (let h = 0; h < hits && target.mon.hp > 0; h++) {
        let A = bstat(user, mv.cat === 'P' ? 'atk' : 'foc'); const D = bstat(target, mv.cat === 'P' ? 'def' : 'wil');
        if ((mon.status === 'burn' && mv.cat === 'P') || (mon.status === 'frost' && mv.cat === 'F')) A *= 0.6;
        const crit = R.chance(mv.crit ? 0.25 : 0.06);
        let dmg = Math.floor((mv.pow * A / D * (mon.lvl + 5) / 125 + 2) * (ud.types.includes(mv.type) ? 1.3 : 1) * eff * (crit ? 1.5 : 1) * (0.88 + Math.random() * 0.12));
        dmg = Math.max(1, dmg);
        const dxk = user.side + 'DX', dir = user.side === 'me' ? 1 : -1;
        await tween(v, dxk, 16 * dir, 70); tween(v, dxk, 0, 110);
        v[target.side + 'Blink'] = Game.t + 280;
        dmg = Math.min(dmg, target.mon.hp); target.mon.hp -= dmg; total += dmg; n++;
        await syncHp(target);
        if (crit) await tell('A critical hit!');
      }
      if (eff > 1) await tell('It\'s super effective!'); else if (eff < 1) await tell('It\'s not very effective...');
      if (hits > 1) await tell('Hit ' + n + (n === 1 ? ' time!' : ' times!'));
      if (mv.drain && total && mon.hp > 0) { mon.hp = Math.min(statOf(mon, 'hp'), mon.hp + Math.max(1, Math.floor(total * mv.drain))); await syncHp(user); await tell(name + ' drained some energy!'); }
      if (mv.recoil && total && mon.hp > 0) { mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(total * mv.recoil))); await syncHp(user); await tell(name + ' is hurt by the recoil!'); }
      await effects(user, target, mv, false);
      if (mv.flinch && target.mon.hp > 0 && R.int(1, 100) <= mv.flinch) target.flinch = true;
    };
    const aiMove = () => {
      const b = v.foe, opts = b.mon.moves.filter(m => m.pp > 0);
      if (!opts.length) return { n: 'Last Gasp', pp: 1 };
      if (R.chance(0.2)) return R.pick(opts);
      let best = opts[0], bs = -1;
      for (const s of opts) {
        const mv = MOVES[s.n]; let sc;
        if (mv.cat === 'S') sc = mv.st ? (v.me.mon.status ? 1 : 48) : mv.heal ? (b.mon.hp < statOf(b.mon, 'hp') * 0.4 ? 75 : 2) : (v.turn < 2 ? 40 : 8);
        else sc = mv.pow * (mv.multi ? 3 : 1) * (DEX[b.mon.id].types.includes(mv.type) ? 1.3 : 1) * typeMult(mv.type, DEX[v.me.mon.id].types) * mv.acc / 100;
        sc *= 0.85 + Math.random() * 0.3;
        if (sc > bs) { bs = sc; best = s; }
      }
      return best;
    };
    const sendMe = async (i) => {
      v.me = mk(S.party[i], 'me'); v.meHp = v.me.mon.hp; v.meXp = xpFrac(v.me.mon); v.party.add(v.me.mon); v.meShow = 0;
      tween(v, 'meShow', 1, 240); await tell('Go, ' + monName(v.me.mon) + '!');
    };
    const foeFainted = async () => {
      const fm = v.foe.mon;
      await tween(v, 'foeShow', 0, 300);
      await tell(label(v.foe) + ' fainted!');
      // everyone who fought gets full XP; the rest of the team watches and learns a little less
      const fought = S.party.filter(m => m.hp > 0 && v.party.has(m)), rest = S.party.filter(m => m.hp > 0 && !v.party.has(m));
      const total = Math.max(1, Math.floor(DEX[fm.id].yield * fm.lvl / 5 * (v.wild ? 1 : 1.5))), part = Math.max(1, Math.floor(total * 0.6));
      if (fought.length) await tell(fought.map(monName).join(' and ') + ' gained ' + total + ' XP.' + (rest.length ? ' The rest of the team gained ' + part + '.' : ''));
      for (const m of fought.concat(rest)) {
        const amt = v.party.has(m) ? total : part;
        const active = m === v.me.mon;
        const evo = await grantXp(m, amt, () => { if (active) { v.meHp = m.hp; v.meXp = 0; } });
        if (active) { v.meHp = m.hp; await tween(v, 'meXp', xpFrac(m), 300); }
        if (evo) v.evolve.add(m);
      }
      v.fi++;
      if (v.fi < foes.length) {
        v.foe = mk(foes[v.fi], 'foe'); v.foeHp = v.foe.mon.hp; S.seen[v.foe.mon.id] = 1; v.party = new Set([v.me.mon]);
        tween(v, 'foeShow', 1, 260); await tell(T_.name + ' sent out ' + monName(v.foe.mon) + '!');
        return null;
      }
      if (T_) {
        await tell(S.name + ' defeated ' + T_.name + '!');
        if (!opts.friendly) {
          if (T_.post) await say(T_.name + ': ' + T_.post);
          const top = Math.max(...foes.map(f => f.lvl)), coins = top * (T_.warden ? 90 : T_.council !== undefined ? 140 : 32);
          S.coins += coins; await tell(S.name + ' received ' + coins + ' coins.');
        }
      }
      return 'win';
    };
    const meFainted = async () => {
      await tween(v, 'meShow', 0, 300);
      await tell(monName(v.me.mon) + ' fainted!');
      if (firstAlive() < 0) { if (!opts.friendly) await tell(S.name + ' has no monsters left to fight!'); return 'lose'; }
      Msg.set('Choose your next monster.');
      const i = await teamScreen({ mode: 'battle', forced: true, active: S.party.indexOf(v.me.mon) });
      await sendMe(i);
      return null;
    };
    const checkFaints = async () => {
      if (v.foe.mon.hp <= 0) { const r = await foeFainted(); if (v.me.mon.hp <= 0 && r === null) { const r2 = await meFainted(); if (r2) return r2; } return r || 'next'; }
      if (v.me.mon.hp <= 0) { const r = await meFainted(); return r || 'next'; }
      return null;
    };
    const throwCharm = async (itemName) => {
      const fm = v.foe.mon, d = DEX[fm.id];
      addItem(itemName, -1);
      await tell(S.name + ' threw a ' + itemName + '!');
      v.charm = { x: 110, y: 170, rock: 0 };
      tween(v.charm, 'y', 92, 340, x => 1 - (1 - x) * (1 - x)); await tween(v.charm, 'x', 386, 340);
      await tween(v, 'foeShow', 0, 160);
      const max = statOf(fm, 'hp');
      const p = clamp((3 * max - 2 * fm.hp) / (3 * max) * d.catchRate * ITEMS[itemName].bonus * (fm.status === 'sleep' ? 2 : fm.status ? 1.5 : 1) / 255, 0, 1);
      const each = Math.cbrt(p); let shakes = 0;
      for (let i = 0; i < 3; i++) { await wait(380); if (!R.chance(each)) break; shakes++; await tween(v.charm, 'rock', 1, 110); await tween(v.charm, 'rock', -1, 180); await tween(v.charm, 'rock', 0, 110); }
      if (shakes === 3) {
        await wait(300);
        await say(monName(fm) + ' was charmed!');
        const where = addMon(fm);
        await tell(where === 'team' ? monName(fm) + ' joined your team.' : monName(fm) + ' was sent to the Paddock.');
        return true;
      }
      v.charm = null; await tween(v, 'foeShow', 1, 160);
      await tell(['It shrugged the charm straight off!', 'It broke free!', 'So close! It slipped loose!'][shakes]);
      return false;
    };
    const chooseAction = async () => {
      for (;;) {
        Msg.set('What will ' + monName(v.me.mon) + ' do?');
        const r = await choose(['Fight', 'Bag', 'Team', 'Run'], { cols: 2, x: VW - 204, y: VH - 86, w: 198, rowH: 28, cancel: false, start: v.lastAct });
        v.lastAct = r;
        if (r === 0) {
          const ms = v.me.mon.moves;
          if (!ms.some(m => m.pp > 0)) return { type: 'move', slot: { n: 'Last Gasp', pp: 1 } };
          const i = await choose(ms.map(m => ({ label: m.n, right: MOVES[m.n].type + ' ' + m.pp + '/' + MOVES[m.n].pp, disabled: m.pp <= 0 })), { cols: 2, x: 6, y: VH - 88, w: VW - 12, rowH: 30, start: ms[Math.min(v.lastMove || 0, ms.length - 1)].pp > 0 ? Math.min(v.lastMove || 0, ms.length - 1) : ms.findIndex(m => m.pp > 0) });
          if (i < 0) continue;
          v.lastMove = i; return { type: 'move', slot: ms[i] };
        }
        if (r === 1) {
          const it = await bagScreen({ mode: 'battle' });
          if (!it || it === 'close') continue;
          if (ITEMS[it.item].kind === 'charm') {
            if (!v.wild) { await tell('You can\'t charm another tamer\'s monster!'); continue; }
            return { type: 'charm', item: it.item };
          }
          return { type: 'item', item: it.item, msg: it.msg };
        }
        if (r === 2) {
          const i = await teamScreen({ mode: 'battle', active: S.party.indexOf(v.me.mon) });
          if (i < 0) continue;
          return { type: 'switch', i };
        }
        if (r === 3) {
          if (!v.wild) { await tell('There\'s no running from a tamer battle!'); continue; }
          return { type: 'run' };
        }
      }
    };
    const loop = async () => {
      for (;;) {
        v.turn++;
        const act = await chooseAction();
        Msg.set('');
        if (act.type === 'run') {
          v.runTries++;
          const ch = clamp(0.55 + (bstat(v.me, 'spd') - bstat(v.foe, 'spd')) / 120 + 0.2 * (v.runTries - 1) - (opts.legend ? 0.2 : 0), 0.25, 1);
          if (R.chance(ch)) { await tell('Got away safely!'); return 'run'; }
          await tell('Couldn\'t get away!');
        } else if (act.type === 'charm') {
          if (await throwCharm(act.item)) return 'caught';
        } else if (act.type === 'item') {
          await tween(v, 'meHp', v.me.mon.hp, 300); await tell(act.msg); // the bag screen already applied the item
        } else if (act.type === 'switch') {
          await tell('Come back, ' + monName(v.me.mon) + '!'); await tween(v, 'meShow', 0, 200); await sendMe(act.i);
        }
        const fslot = aiMove();
        let order;
        if (act.type === 'move') {
          const pm = MOVES[act.slot.n].pri || 0, fmv = MOVES[fslot.n].pri || 0, ps = bstat(v.me, 'spd'), fs = bstat(v.foe, 'spd');
          const first = pm !== fmv ? pm > fmv : ps !== fs ? ps > fs : R.chance(0.5);
          order = first ? [[v.me, act.slot], [v.foe, fslot]] : [[v.foe, fslot], [v.me, act.slot]];
        } else order = [[v.foe, fslot]];
        let broke = null;
        for (const [b, slot] of order) {
          if (b.mon.hp <= 0 || (b !== v.me && b !== v.foe)) continue;
          await useMove(b, other(b), slot);
          broke = await checkFaints();
          if (broke) break;
        }
        if (broke && broke !== 'next') return broke;
        if (!broke) {
          for (const b of [v.me, v.foe]) {
            const st = b.mon.status;
            if (b.mon.hp > 0 && (st === 'burn' || st === 'frost' || st === 'poison')) {
              b.mon.hp = Math.max(0, b.mon.hp - Math.max(1, Math.floor(statOf(b.mon, 'hp') / (st === 'poison' ? 8 : 12))));
              v[b.side + 'Blink'] = Game.t + 250; await syncHp(b);
              await tell(label(b) + { burn: ' is hurt by its burn!', frost: ' is hurt by frostbite!', poison: ' is hurt by poison!' }[st]);
              const r = await checkFaints(); if (r && r !== 'next') return r; if (r) break;
            }
          }
        }
        v.me.flinch = false; v.foe.flinch = false;
      }
    };

    const result = await loop();
    await fadeOut(220);
    Game.scene = 'world'; this.v = null; Msg.hide();
    await fadeIn(220);
    if (result === 'win' || result === 'caught' || result === 'run') for (const m of v.evolve) if (S.party.includes(m) && m.hp > 0) await evolveScene(m);
    // a win where recoil or a condition took your last monster down with the foe still counts, but you can't walk on
    if (result !== 'lose' && !opts.friendly && firstAlive() < 0) await blackout();
    Msg.hide();
    return result;
  },

  draw(g) {
    const v = this.v; if (!v) return;
    const bg = BATTLE_BG[v.biome] || BATTLE_BG[0];
    const gr = g.createLinearGradient(0, 0, 0, 150); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
    g.fillStyle = gr; g.fillRect(0, 0, VW, 150);
    g.fillStyle = bg[2]; g.fillRect(0, 150, VW, VH - 150);
    g.fillStyle = bg[3]; for (let i = 0; i < 6; i++) g.fillRect(0, 150 + i * i * 3, VW, 2);
    g.fillStyle = bg[3]; g.beginPath(); g.ellipse(394, 134, 84, 16, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(104, 216, 96, 18, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(394, 131, 76, 11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(104, 213, 88, 13, 0, 0, 7); g.fill();
    const blink = k => v[k] > Game.t && Math.floor(Game.t / 55) % 2;
    if (v.foeShow > 0.02 && !blink('foeBlink')) { g.globalAlpha = v.foeShow; drawMon(g, v.foe.mon.id, 330 + v.foeDX, 14 + (1 - v.foeShow) * 14, 128); g.globalAlpha = 1; }
    if (v.meShow > 0.02 && !blink('meBlink')) { g.globalAlpha = v.meShow; drawMon(g, v.me.mon.id, 40 + v.meDX, 96 + (1 - v.meShow) * 14, 128, true); g.globalAlpha = 1; }
    if (v.charm) { g.save(); g.translate(v.charm.x + 16, v.charm.y + 32); g.rotate(v.charm.rock * 0.35); g.drawImage(objSprite('orb'), -16, -32, 32, 32); g.restore(); }
    // foe panel
    const hud = (b, x, y, mine) => {
      const m = b.mon, max = statOf(m, 'hp'), shown = mine ? v.meHp : v.foeHp;
      box(g, x, y, 200, mine ? 62 : 46);
      text(g, monName(m), x + 12, y + 8, { bold: true });
      text(g, 'Lv ' + m.lvl, x + 188, y + 9, { align: 'right', size: 14 });
      bar(g, x + 12, y + 28, 176, 9, shown / max, hpColor(shown / max));
      if (m.status) { g.fillStyle = STATUS_COLOR[m.status]; g.fillRect(x + 118, y + 9, 30, 14); text(g, STATUS_NAME[m.status], x + 133, y + 10, { size: 11, bold: true, color: '#fff', align: 'center' }); }
      if (mine) { text(g, Math.round(shown) + ' / ' + max, x + 188, y + 39, { align: 'right', size: 13 }); bar(g, x + 12, y + 44, 96, 6, v.meXp, '#4a9be8'); }
    };
    hud(v.foe, 10, 10, false); hud(v.me, 270, 140, true);
    if (!v.wild) { // remaining foes
      for (let i = 0; i < v.foes.length; i++) { g.fillStyle = UIC.ink; g.fillRect(14 + i * 12, 60, 9, 9); g.fillStyle = v.foes[i].hp > 0 ? UIC.accent : '#8a8498'; g.fillRect(15 + i * 12, 61, 7, 7); }
    }
  },
};
