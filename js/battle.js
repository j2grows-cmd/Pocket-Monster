'use strict';
/* Turn-based battles: wild encounters, tamer battles, charming, XP and level-ups.
   The rules live in Battle.start; everything visual (fx, plates, menus) is layered on without touching them. */
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
      fx: [], flash: { me: 0, foe: 0 }, shake: { me: 0, foe: 0 }, trainerShow: 0, banner: null,
    };
    v.meHp = v.me.mon.hp; v.foeHp = v.foe.mon.hp; v.meXp = xpFrac(v.me.mon); v.party.add(v.me.mon);
    const T_ = opts.trainer;
    const label = b => (b.side === 'foe' ? (v.wild ? 'The wild ' : 'The foe\'s ') : '') + monName(b.mon);
    const bstat = (b, k) => statOf(b.mon, k) * stageMult(b.st[k]) * (k === 'spd' && b.mon.status === 'stun' ? 0.5 : 1);
    const syncHp = b => tween(v, b.side + 'Hp', b.mon.hp, 320);
    const other = b => b === v.me ? v.foe : v.me;
    // purely visual: queue an effect on one side of the field
    const fx = (kind, side, o) => {
      v.fx.push(Object.assign({ kind, side, t0: Game.t }, o || {}));
      if (kind === 'hit') { v.flash[side] = Game.t + 150; v.shake[side] = Game.t + (o.crit || o.eff > 1 ? 280 : 170); }
    };

    Game.scene = 'battle'; Msg.set(''); S.seen[v.foe.mon.id] = 1;
    await fadeIn(200);
    if (v.wild) { await tween(v, 'foeShow', 1, 260); await tell('A wild ' + monName(v.foe.mon) + ' appeared!'); }
    else { v.trainerShow = T_.pal ? 1 : 0; await tell(T_.name + ' wants to battle!'); tween(v, 'trainerShow', 0, 200); tween(v, 'foeShow', 1, 260); fx('summon', 'foe'); await tell(T_.name + ' sent out ' + monName(v.foe.mon) + '!'); }
    tween(v, 'meShow', 1, 260); fx('summon', 'me'); await tell('Go, ' + monName(v.me.mon) + '!');

    const inflict = async (b, st, loud) => {
      const d = DEX[b.mon.id];
      if (b.mon.status) { if (loud) await tell('But it failed!'); return; }
      if (d.types.includes(STATUS_IMMUNE[st])) { if (loud) await tell('It doesn\'t affect ' + label(b) + '...'); return; }
      b.mon.status = st; if (st === 'sleep') b.mon.sleep = R.int(2, 4);
      fx('status', b.side, { st });
      await tell(label(b) + { burn: ' was burned!', frost: ' got frostbite!', poison: ' was poisoned!', sleep: ' fell asleep!', stun: ' is stunned! It may be unable to move.' }[st]);
    };
    const stage = async (b, stat, delta) => {
      const cur = b.st[stat];
      if ((delta > 0 && cur >= 6) || (delta < 0 && cur <= -6)) { await tell(label(b) + '\'s ' + STAT_NAME[stat] + ' won\'t go any ' + (delta > 0 ? 'higher' : 'lower') + '!'); return; }
      b.st[stat] = clamp(cur + delta, -6, 6); fx('stage', b.side, { up: delta > 0 });
      await tell(label(b) + '\'s ' + STAT_NAME[stat] + (delta > 1 ? ' rose sharply!' : delta > 0 ? ' rose!' : delta < -1 ? ' fell sharply!' : ' fell!'));
    };
    const effects = async (user, target, mv, primary) => {
      if (mv.heal) {
        const max = statOf(user.mon, 'hp');
        if (user.mon.hp >= max) await tell('But ' + label(user) + ' is already at full HP!');
        else { user.mon.hp = Math.min(max, user.mon.hp + Math.floor(max * mv.heal)); fx('heal', user.side); await syncHp(user); await tell(label(user) + ' regained HP!'); }
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
        fx('hit', target.side, { dmg, crit, eff, type: mv.type });
        await syncHp(target);
        if (crit) await tell('A critical hit!');
      }
      if (n && eff !== 1) fx('call', target.side, { text: eff > 1 ? 'SUPER EFFECTIVE' : 'RESISTED', col: eff > 1 ? PAL.gold : PAL.lavLo, fg: eff > 1 ? PAL.night : '#fff' });
      if (eff > 1) await tell('It\'s super effective!'); else if (eff < 1) await tell('It\'s not very effective...');
      if (hits > 1) await tell('Hit ' + n + (n === 1 ? ' time!' : ' times!'));
      if (mv.drain && total && mon.hp > 0) { mon.hp = Math.min(statOf(mon, 'hp'), mon.hp + Math.max(1, Math.floor(total * mv.drain))); fx('heal', user.side); await syncHp(user); await tell(name + ' drained some energy!'); }
      if (mv.recoil && total && mon.hp > 0) { mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(total * mv.recoil))); fx('recoil', user.side); await syncHp(user); await tell(name + ' is hurt by the recoil!'); }
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
      tween(v, 'meShow', 1, 240); fx('summon', 'me'); await tell('Go, ' + monName(v.me.mon) + '!');
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
        const evo = await grantXp(m, amt, () => { if (active) { v.meHp = m.hp; v.meXp = 0; fx('level', 'me'); } });
        if (active) { v.meHp = m.hp; await tween(v, 'meXp', xpFrac(m), 300); }
        if (evo) v.evolve.add(m);
      }
      v.fi++;
      if (v.fi < foes.length) {
        v.foe = mk(foes[v.fi], 'foe'); v.foeHp = v.foe.mon.hp; S.seen[v.foe.mon.id] = 1; v.party = new Set([v.me.mon]);
        tween(v, 'foeShow', 1, 260); fx('summon', 'foe'); await tell(T_.name + ' sent out ' + monName(v.foe.mon) + '!');
        return null;
      }
      if (T_) {
        if (T_.pal) tween(v, 'trainerShow', 1, 220);
        v.banner = { text: 'VICTORY', col: PAL.gold, t0: Game.t };
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
      if (firstAlive() < 0) { v.banner = { text: 'DEFEATED', col: PAL.coral, t0: Game.t }; if (!opts.friendly) await tell(S.name + ' has no monsters left to fight!'); return 'lose'; }
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
      tween(v.charm, 'y', 112, 340, x => 1 - (1 - x) * (1 - x)); await tween(v.charm, 'x', 386, 340);
      await tween(v, 'foeShow', 0, 160);
      const max = statOf(fm, 'hp');
      const p = clamp((3 * max - 2 * fm.hp) / (3 * max) * d.catchRate * ITEMS[itemName].bonus * (fm.status === 'sleep' ? 2 : fm.status ? 1.5 : 1) / 255, 0, 1);
      const each = Math.cbrt(p); let shakes = 0;
      for (let i = 0; i < 3; i++) { await wait(380); if (!R.chance(each)) break; shakes++; await tween(v.charm, 'rock', 1, 110); await tween(v.charm, 'rock', -1, 180); await tween(v.charm, 'rock', 0, 110); }
      if (shakes === 3) {
        await wait(300);
        fx('stars', 'foe'); v.banner = { text: 'CHARMED', col: PAL.gold, t0: Game.t };
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
        const r = await choose(['Fight', 'Bag', 'Team', 'Run'], { cols: 2, x: VW - 210, y: VH - 88, w: 204, rowH: 28, cancel: false, start: v.lastAct, draw: Battle.drawActions });
        v.lastAct = r;
        if (r === 0) {
          const ms = v.me.mon.moves;
          if (!ms.some(m => m.pp > 0)) return { type: 'move', slot: { n: 'Last Gasp', pp: 1 } };
          const i = await choose(ms.map(m => ({ label: m.n, right: MOVES[m.n].type + ' ' + m.pp + '/' + MOVES[m.n].pp, disabled: m.pp <= 0 })), { cols: 2, x: 6, y: VH - 88, w: VW - 12, rowH: 30, draw: Battle.drawMoves, start: ms[Math.min(v.lastMove || 0, ms.length - 1)].pp > 0 ? Math.min(v.lastMove || 0, ms.length - 1) : ms.findIndex(m => m.pp > 0) });
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
          fx('heal', 'me'); await tween(v, 'meHp', v.me.mon.hp, 300); await tell(act.msg); // the bag screen already applied the item
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
              v[b.side + 'Blink'] = Game.t + 250; fx('status', b.side, { st }); await syncHp(b);
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

  /* ---- presentation ---- */
  drawActions(g, st) {
    const ACTS = [['Fight', 'fight', PAL.coral], ['Bag', 'bag', PAL.gold], ['Team', 'team', PAL.greenHi], ['Run', 'run', PAL.lav]];
    const x = VW - 210, y = VH - 88;
    panel(g, x, y, 204, 82, 'dark');
    ACTS.forEach(([label, ic, col], i) => {
      const bx = x + 8 + (i % 2) * 96, by = y + 8 + Math.floor(i / 2) * 34 - (i === st.sel ? 2 : 0), on = i === st.sel;
      rrect(g, bx, by, 92, 30, 2, on ? PAL.goldHi : PAL.night);
      g.fillStyle = on ? PAL.parch : PAL.indigo2; g.fillRect(bx + 2, by + 2, 88, 26);
      g.fillStyle = col; g.fillRect(bx + 2, by + 2, 26, 26); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx + 2, by + 2, 26, 2);
      icon(g, ic, bx + 7, by + 7, 2);
      text(g, label, bx + 36, by + 5, { font: 'd', size: 16, color: on ? PAL.ink : PAL.parch, track: .5 });
    });
  },
  drawMoves(g, st) {
    const v = Battle.v, ms = v.me.mon.moves, x = 6, y = VH - 88, foeTypes = DEX[v.foe.mon.id].types;
    panel(g, x, y, VW - 12, 82, 'dark');
    const arrow = (ax, ay, up, col) => { g.fillStyle = col; for (let k = 0; k < 3; k++) g.fillRect(ax + 4 - k * 2, ay + (up ? k * 2 : 4 - k * 2), 2 + k * 4, 2); };
    ms.forEach((mv, i) => {
      const M = MOVES[mv.n], on = i === st.sel, bx = x + 8 + (i % 2) * 150, by = y + 8 + Math.floor(i / 2) * 34 - (on ? 2 : 0), dead = mv.pp <= 0, eff = typeMult(M.type, foeTypes);
      rrect(g, bx, by, 146, 30, 2, on ? PAL.goldHi : PAL.night);
      g.fillStyle = dead ? '#bdb5ac' : on ? PAL.white : PAL.parch; g.fillRect(bx + 2, by + 2, 142, 26);
      g.fillStyle = TYPE_COLOR[M.type]; g.fillRect(bx + 2, by + 2, 20, 26); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(bx + 2, by + 2, 20, 2);
      typeGlyph(g, M.type, bx + 7, by + 10, '#fff');
      text(g, mv.n, bx + 28, by, { font: 'd', size: 14, color: dead ? PAL.soft : PAL.ink });
      text(g, 'PP ' + mv.pp + '/' + M.pp, bx + 28, by + 16, { size: 9, weight: 800, color: mv.pp <= M.pp / 4 ? PAL.coralLo : PAL.soft });
      if (M.cat !== 'S' && eff !== 1) arrow(bx + 128, by + 16, eff > 1, eff > 1 ? PAL.green : PAL.coralLo);
    });
    const cur = ms[Math.min(st.sel, ms.length - 1)], M = MOVES[cur.n], dx = x + 318, eff = typeMult(M.type, foeTypes);
    g.fillStyle = PAL.indigo3; g.fillRect(dx - 8, y + 8, 2, 66);
    typeChip(g, M.type, dx, y + 8); tag(g, { P: 'MIGHT', F: 'FOCUS', S: 'STATUS' }[M.cat], dx + 56, y + 9, PAL.indigo3);
    text(g, (M.pow ? 'Power ' + M.pow : 'No damage') + '    Aim ' + (M.sure ? 'sure' : M.acc), dx, y + 26, { size: 10, weight: 800, color: PAL.parch });
    if (M.cat !== 'S') {
      const lab = eff > 1 ? 'Super effective' : eff < 1 ? 'Not very effective' : 'Normal damage', col = eff > 1 ? PAL.greenHi : eff < 1 ? PAL.coralHi : PAL.lav;
      if (eff !== 1) arrow(dx, y + 44, eff > 1, col);
      text(g, lab, dx + (eff !== 1 ? 14 : 0), y + 39, { size: 10, weight: 800, color: col });
    }
    wrap(g, M.desc, 146, 9).slice(0, 2).forEach((ln, i) => text(g, ln, dx, y + (M.cat === 'S' ? 40 : 53) + i * 11, { size: 9, color: PAL.lav }));
  },

  draw(g) {
    const v = this.v; if (!v) return;
    const t = Game.t, even = n => Math.round(n / 2) * 2;
    g.drawImage(Scenery.backdrop(v.biome), 0, 0, VW, VH);
    Scenery.ambient(g, v.biome, 0, 0, v.biome === 3 ? 1 : 0, true);
    const CEN = { foe: [394, 106], me: [104, 156] };
    // the other tamer steps up before and after the fight
    const T_ = v.opts.trainer;
    if (T_ && T_.pal && v.trainerShow > 0.02) { g.globalAlpha = v.trainerShow; g.drawImage(Sprites.char(T_.pal, 'down', 0), even(358 + (1 - v.trainerShow) * 40), 70, 72, 88); g.globalAlpha = 1; }
    // the foe faces you at 2x; your own monster is seen from behind, larger and closer
    const sprite = (b, show, dxo, bx, by, mine) => {
      if (show <= 0.02 || (v[b.side + 'Blink'] > t && v.flash[b.side] < t && Math.floor(t / 55) % 2)) return;
      const id = b.mon.id, size = mine ? 192 : 128; let oy = (1 - show) * 28, h = size;
      if (BODIES[DEX[id].art.b].float) oy += Math.round(Math.sin(t / 380 + (mine ? 2 : 0)) * 2) * 2;
      else if (Math.floor(t / 640 + (mine ? .5 : 0)) % 2) { h = size - 2; oy += 2; } // breathing
      const sh = v.shake[b.side] > t ? (Math.floor(t / 45) % 2 ? 4 : -4) : 0;
      g.globalAlpha = show; g.drawImage(mine ? Sprites.back(id) : Sprites.mon(id), even(bx + dxo) + sh, even(by + oy), size, h);
      if (v.flash[b.side] > t) { g.globalAlpha = clamp((v.flash[b.side] - t) / 150, 0, 1); g.drawImage(mine ? Sprites.backWhite(id) : Sprites.white(id), even(bx + dxo) + sh, even(by + oy), size, h); }
      g.globalAlpha = 1;
    };
    sprite(v.foe, v.foeShow, v.foeDX, 330, 34, false);
    sprite(v.me, v.meShow, v.meDX, 8, 38, true);
    if (v.charm) { g.save(); g.translate(v.charm.x + 16, v.charm.y + 32); g.rotate(v.charm.rock * 0.35); g.drawImage(objSprite('charm'), -16, -32, 32, 32); g.restore(); }

    // ---- effects ----
    const dot = (x, y, s, col) => { g.fillStyle = col; g.fillRect(even(x), even(y), s, s); };
    for (const f of v.fx) {
      const a = t - f.t0, [cx, cy] = CEN[f.side];
      if (f.kind === 'hit') {
        if (a < 420) for (let i = 0; i < 10; i++) { const an = i / 10 * 6.283 + f.t0, r = 12 + a * .13; dot(cx + Math.cos(an) * r, cy + Math.sin(an) * r * .8, a < 220 ? 4 : 2, i % 3 ? TYPE_COLOR[f.type] : PAL.white); }
        if (a < 950) {
          const str = '-' + f.dmg + (f.crit ? '!' : ''), size = f.crit ? 26 : 21, y = cy - 34 - Math.min(1, a / 420) * 24, col = f.eff > 1 ? PAL.goldHi : f.eff < 1 ? PAL.lav : PAL.white;
          g.globalAlpha = a > 750 ? 1 - (a - 750) / 200 : 1;
          for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) text(g, str, cx + ox, y + oy, { font: 'd', size, align: 'center', color: PAL.night });
          text(g, str, cx, y, { font: 'd', size, align: 'center', color: col }); g.globalAlpha = 1;
        }
      } else if (f.kind === 'call' && a < 1100) {
        const w = Math.ceil(textW(g, f.text, 9, { font: 'd', track: 1 })) + 10; g.globalAlpha = a > 900 ? 1 - (a - 900) / 200 : 1;
        tag(g, f.text, even(cx - w / 2), even(cy - 70 - Math.min(8, a / 16)), f.col, f.fg); g.globalAlpha = 1;
      } else if (f.kind === 'heal' && a < 800) {
        for (let i = 0; i < 5; i++) { const x = cx - 32 + i * 16, y = cy + 26 - a * .06 - (i % 2) * 12; g.globalAlpha = 1 - a / 800; dot(x, y - 2, 2, PAL.greenHi); dot(x - 2, y, 6, PAL.greenHi); dot(x, y + 6, 2, PAL.greenHi); dot(x, y + 2, 2, PAL.white); } g.globalAlpha = 1;
      } else if (f.kind === 'status' && a < 650) {
        for (let i = 0; i < 7; i++) dot(cx - 30 + i * 10 + Math.sin(a / 90 + i) * 4, cy + 10 - a * .05 - (i % 3) * 8, i % 2 ? 4 : 2, STATUS_COLOR[f.st]);
      } else if (f.kind === 'stage' && a < 750) {
        const col = f.up ? PAL.goldHi : PAL.lav, mv = (f.up ? -1 : 1) * a * .05;
        for (let i = 0; i < 3; i++) { const x = cx - 26 + i * 26, y = cy + (f.up ? 20 : -20) + mv + (i % 2) * 8; g.fillStyle = col; for (let k = 0; k < 4; k++) g.fillRect(even(x - k * 2), even(y + (f.up ? k * 2 : -k * 2)), 2 + k * 4, 2); }
      } else if (f.kind === 'summon' && a < 380) {
        for (let i = 0; i < 14; i++) { const an = i / 14 * 6.283, r = 8 + a * .2; dot(cx + Math.cos(an) * r, cy + 30 + Math.sin(an) * r * .35, a < 200 ? 4 : 2, i % 2 ? PAL.white : PAL.goldHi); }
      } else if (f.kind === 'recoil' && a < 300) {
        for (let i = 0; i < 6; i++) { const an = i / 6 * 6.283, r = 8 + a * .12; dot(cx + Math.cos(an) * r, cy + Math.sin(an) * r, 2, PAL.coral); }
      } else if (f.kind === 'stars' && a < 1000) {
        for (let i = 0; i < 9; i++) { const an = i / 9 * 6.283, r = 10 + a * .09, x = even(cx + Math.cos(an) * r), y = even(cy + 10 + Math.sin(an) * r * .8 - a * .02); g.globalAlpha = 1 - a / 1000; g.fillStyle = i % 2 ? PAL.goldHi : PAL.white; g.fillRect(x - 2, y, 6, 2); g.fillRect(x, y - 2, 2, 6); } g.globalAlpha = 1;
      } else if (f.kind === 'level' && a < 1500) {
        g.globalAlpha = a > 1200 ? 1 - (a - 1200) / 300 : 1; tag(g, 'LEVEL UP', 276, even(152 - Math.min(10, a / 30)), PAL.gold, PAL.night);
        for (let i = 0; i < 6; i++) dot(290 + i * 30 + Math.sin(a / 120 + i) * 6, 160 - ((a * .04 + i * 9) % 30), 2, i % 2 ? PAL.goldHi : PAL.white); g.globalAlpha = 1;
      }
    }
    if (v.fx.length && t - v.fx[0].t0 > 1600) v.fx.shift();

    // ---- name plates ----
    const pip = (x, y, col) => { g.fillStyle = PAL.night; g.fillRect(x + 2, y, 4, 8); g.fillRect(x, y + 2, 8, 4); g.fillStyle = col; g.fillRect(x + 2, y + 2, 4, 4); };
    const plate = (b, x, y, mine) => {
      const m = b.mon, max = statOf(m, 'hp'), shown = mine ? v.meHp : v.foeHp, w = 204, h = mine ? 62 : 46, k = mine ? 'meLag' : 'foeLag';
      if (v[k + 'For'] !== m) { v[k + 'For'] = m; v[k] = shown; }
      v[k] = shown >= v[k] ? shown : Math.max(shown, v[k] - Game.dt * max * 0.0007); // the pale trail behind a falling bar
      panel(g, x, y, w, h, 'parch');
      const name = monName(m); text(g, name, x + 12, y + 5, { font: 'd', size: 16, track: .3 });
      if (!mine && v.wild && S.caught[m.id]) pip(x + 16 + Math.ceil(textW(g, name, 16, { font: 'd', track: .3 })), y + 11, PAL.gold);
      lvPill(g, m.lvl, x + w - 10, y + 7);
      if (m.status) statusChip(g, m.status, x + w - 92, y + 8);
      rrect(g, x + 10, y + 26, 24, 12, 2, PAL.night); text(g, 'HP', x + 22, y + 25, { font: 'd', size: 10, color: PAL.goldHi, align: 'center' });
      bar(g, x + 36, y + 26, w - 48, 12, shown / max, hpColor(shown / max), v[k] / max);
      if (mine) {
        text(g, Math.round(shown) + ' / ' + max, x + w - 12, y + 39, { align: 'right', size: 12, weight: 800 });
        text(g, 'XP', x + 12, y + 42, { font: 'd', size: 9, color: PAL.soft }); bar(g, x + 28, y + 44, 96, 8, v.meXp, PAL.sky);
      }
    };
    plate(v.foe, 10, 10, false); plate(v.me, 266, 166, true);
    for (let i = 0; i < 6; i++) { const m = S.party[i]; pip(272 + i * 10, 156, !m ? PAL.indigo3 : m.hp > 0 ? PAL.gold : PAL.coralLo); }
    if (!v.wild) for (let i = 0; i < v.foes.length; i++) pip(20 + i * 10, 60, v.foes[i].hp > 0 ? PAL.coral : PAL.indigo3);

    // ---- result ribbon ----
    if (v.banner) {
      const a = clamp((t - v.banner.t0) / 260, 0, 1), e = 1 - (1 - a) * (1 - a);
      if (v.banner.text === 'DEFEATED') { g.fillStyle = 'rgba(23,22,41,' + (.5 * a) + ')'; g.fillRect(0, 0, VW, VH); }
      const w = Math.round(VW * e / 2) * 2, x = (VW - w) / 2;
      g.fillStyle = 'rgba(23,22,41,.82)'; g.fillRect(x, 12, w, 44);
      g.fillStyle = v.banner.col; g.fillRect(x, 12, w, 2); g.fillRect(x, 54, w, 2); g.fillRect(x, 16, w, 2); g.fillRect(x, 50, w, 2);
      if (a >= 1) { text(g, v.banner.text, VW / 2 + 4, 18, { font: 'd', size: 28, align: 'center', color: v.banner.col, shadow: PAL.night, track: 8 }); for (const sx of [-1, 1]) { const px = VW / 2 + sx * 150; g.fillStyle = v.banner.col; g.fillRect(px - 2, 28, 4, 12); g.fillRect(px - 6, 32, 12, 4); } }
    }
  },
};
