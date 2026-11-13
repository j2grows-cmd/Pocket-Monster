'use strict';
/* Full-screen menus: team, summary, bag, journal, map, trade post, paddock, evolution and the title. */

function panel(g, title, hint) {
  g.fillStyle = '#231d36'; g.fillRect(0, 0, VW, VH);
  g.fillStyle = '#322a4c'; for (let i = 0; i < VW; i += 16) g.fillRect(i, 0, 1, VH);
  g.fillStyle = UIC.ink; g.fillRect(0, 0, VW, 28); g.fillStyle = UIC.accent; g.fillRect(0, 28, VW, 3);
  text(g, title, 12, 5, { bold: true, color: '#fff', size: 17 });
  if (hint) text(g, hint, VW - 10, 8, { align: 'right', size: 12, color: '#b8b0d0' });
}
function monRow(g, m, x, y, w, sel, tag) {
  const d = DEX[m.id], max = statOf(m, 'hp');
  g.fillStyle = sel ? UIC.accent : UIC.ink; g.fillRect(x, y, w, 44);
  g.fillStyle = m.hp > 0 ? UIC.paper : '#cfc6c0'; g.fillRect(x + 2, y + 2, w - 4, 40);
  drawMon(g, m.id, x + 4, y + 2, 40);
  text(g, d.name, x + 50, y + 4, { bold: true });
  text(g, 'Lv ' + m.lvl, x + 50, y + 24, { size: 13, color: UIC.soft });
  if (w > 260) {
    bar(g, x + w - 196, y + 10, 120, 9, m.hp / max, hpColor(m.hp / max));
    text(g, m.hp + ' / ' + max, x + w - 76, y + 22, { align: 'right', size: 13 });
    d.types.forEach((t, i) => typeChip(g, t, x + w - 64, y + 5 + i * 18));
    if (m.status) { g.fillStyle = STATUS_COLOR[m.status]; g.fillRect(x + w - 196, y + 24, 30, 14); text(g, STATUS_NAME[m.status], x + w - 181, y + 25, { size: 11, bold: true, color: '#fff', align: 'center' }); }
    else if (m.hp <= 0) text(g, 'FAINTED', x + w - 196, y + 24, { size: 12, bold: true, color: UIC.bad });
  } else {
    bar(g, x + 100, y + 28, w - 112, 7, m.hp / max, hpColor(m.hp / max));
  }
  if (tag) text(g, tag, x + 100, y + 25, { size: 12, bold: true, color: UIC.accent });
}

/* mode: 'menu' (pause menu), 'battle' (switching), 'pick' (choose a target). Resolves to an index or -1. */
function teamScreen(o) {
  let sel = Math.max(0, o.active || 0), note = '', busy = false;
  if (o.forced) { const i = S.party.findIndex(m => m.hp > 0); if (i >= 0) sel = i; } // start on someone who can still fight
  return layer({
    draw(g) {
      panel(g, o.title || 'Team', o.forced ? 'A choose' : 'A choose   B back');
      S.party.forEach((m, i) => monRow(g, m, 10, 36 + i * 46, VW - 20, i === sel, o.mode === 'battle' && i === o.active && m.hp > 0 ? 'IN BATTLE' : (i === 0 && o.mode === 'menu' ? 'LEAD' : '')));
      if (note) { box(g, 60, VH - 44, VW - 120, 36); text(g, note, VW / 2, VH - 35, { align: 'center', size: 14 }); }
    },
    async key(k, done) {
      if (busy) return;
      const n = S.party.length; note = '';
      if (k === 'up') sel = (sel - 1 + n) % n; else if (k === 'down') sel = (sel + 1) % n;
      else if (k === 'b') { if (!o.forced) done(-1); }
      else if (k === 'a') {
        const m = S.party[sel];
        if (o.mode === 'pick') return done(sel);
        busy = true;
        if (o.mode === 'battle') {
          const r = await choose(['Send out', 'Summary', 'Cancel'], { x: VW - 130, y: Math.min(36 + sel * 46, VH - 100), w: 120 });
          busy = false;
          if (r === 1) { busy = true; await summaryScreen(m); busy = false; }
          if (r === 0) { if (m.hp <= 0) note = monName(m) + ' has no energy left.'; else if (sel === o.active) note = monName(m) + ' is already in battle.'; else done(sel); }
        } else {
          const r = await choose(['Summary', 'Move to front', 'Cancel'], { x: VW - 150, y: Math.min(36 + sel * 46, VH - 100), w: 140 });
          busy = false;
          if (r === 0) { busy = true; await summaryScreen(m); busy = false; }
          if (r === 1 && sel > 0) { S.party.splice(sel, 1); S.party.unshift(m); sel = 0; }
        }
      }
    },
  });
}

function summaryScreen(m) {
  return layer({
    draw(g) {
      const d = DEX[m.id];
      panel(g, d.name + '   No. ' + String(d.id).padStart(3, '0'), 'A / B back');
      g.fillStyle = UIC.ink; g.fillRect(10, 38, 148, 148); g.fillStyle = shade(TYPE_COLOR[d.types[0]], .55); g.fillRect(13, 41, 142, 142);
      drawMon(g, m.id, 20, 46, 128);
      d.types.forEach((t, i) => typeChip(g, t, 14 + i * 56, 192));
      text(g, 'Level ' + m.lvl, 14, 214, { color: '#fff', bold: true });
      text(g, m.lvl >= 100 ? 'Fully grown' : 'Next level in ' + (xpFor(m.lvl + 1) - m.xp) + ' XP', 14, 234, { color: '#b8b0d0', size: 13 });
      bar(g, 14, 254, 144, 7, xpFrac(m), '#4a9be8');
      box(g, 166, 38, 150, 150);
      STAT_KEYS.forEach((k, i) => {
        text(g, STAT_NAME[k], 178, 48 + i * 22, { size: 14, color: UIC.soft });
        text(g, k === 'hp' ? m.hp + '/' + statOf(m, k) : String(statOf(m, k)), 304, 47 + i * 22, { align: 'right', bold: true });
      });
      box(g, 322, 38, 150, 150);
      text(g, 'MOVES', 334, 46, { size: 12, bold: true, color: UIC.soft });
      m.moves.forEach((mv, i) => {
        const M = MOVES[mv.n];
        g.fillStyle = TYPE_COLOR[M.type]; g.fillRect(334, 64 + i * 30, 5, 24);
        text(g, mv.n, 344, 62 + i * 30, { size: 14, bold: true });
        text(g, (M.pow ? 'Pow ' + M.pow : 'Status') + '   PP ' + mv.pp + '/' + M.pp, 344, 77 + i * 30, { size: 11, color: UIC.soft });
      });
      box(g, 166, 194, 306, 118);
      wrap(g, d.desc, 282, 14).forEach((ln, i) => text(g, ln, 178, 204 + i * 18, { size: 14 }));
      if (m.status) text(g, 'Condition: ' + { burn: 'Burned', frost: 'Frostbitten', poison: 'Poisoned', sleep: 'Asleep', stun: 'Stunned' }[m.status], 178, 284, { size: 13, bold: true, color: UIC.bad });
    },
    key(k, done) { if (k === 'a' || k === 'b') done(); },
  });
}

function applyItem(m, name) {
  const it = ITEMS[name], max = statOf(m, 'hp'), n = monName(m);
  if (it.kind === 'revive') { if (m.hp > 0) return null; m.hp = Math.floor(max / 2); m.status = null; m.sleep = 0; return n + ' is back on its feet!'; }
  if (m.hp <= 0) return null;
  if (it.kind === 'heal') { if (m.hp >= max && !(it.cure && m.status)) return null; m.hp = Math.min(max, m.hp + it.hp); if (it.cure) { m.status = null; m.sleep = 0; } return n + '\'s HP was restored.'; }
  if (it.kind === 'cure') { if (!m.status) return null; m.status = null; m.sleep = 0; return n + ' is feeling better.'; }
  return null;
}

/* Resolves to {item} when something was used in battle, 'close' to shut the pause menu, or null. */
function bagScreen(o) {
  let sel = 0, top = 0, note = '', busy = false;
  const names = () => Object.keys(S.bag).filter(n => S.bag[n] > 0);
  return layer({
    draw(g) {
      const list = names();
      panel(g, 'Bag', 'A use   B back');
      text(g, S.coins + ' coins', VW - 14, 38, { align: 'right', color: '#f2d27a', bold: true });
      box(g, 10, 60, 250, 250);
      if (!list.length) text(g, 'Nothing here yet.', 26, 74, { color: UIC.soft });
      for (let i = top; i < Math.min(list.length, top + 10); i++) {
        const y = 70 + (i - top) * 23;
        if (i === sel) { g.fillStyle = UIC.paper2; g.fillRect(16, y - 1, 238, 22); g.fillStyle = UIC.accent; g.fillRect(16, y - 1, 4, 22); }
        text(g, list[i], 28, y, { bold: i === sel });
        if (!ITEMS[list[i]].key) text(g, 'x' + S.bag[list[i]], 246, y, { align: 'right', color: UIC.soft });
      }
      box(g, 268, 60, 202, 150);
      const cur = list[sel];
      if (cur) wrap(g, ITEMS[cur].desc, 176, 14).forEach((ln, i) => text(g, ln, 280, 72 + i * 18, { size: 14 }));
      if (note) { box(g, 268, 218, 202, 92); wrap(g, note, 176, 14).forEach((ln, i) => text(g, ln, 280, 230 + i * 18, { size: 14 })); }
    },
    async key(k, done) {
      if (busy) return;
      const list = names(), n = list.length; note = '';
      if (k === 'b') return done(null);
      if (!n) return;
      if (k === 'up') sel = (sel - 1 + n) % n; else if (k === 'down') sel = (sel + 1) % n;
      if (sel < top) top = sel; if (sel >= top + 10) top = sel - 9;
      if (k !== 'a') return;
      const name = list[sel], it = ITEMS[name];
      if (it.kind === 'charm') { if (o.mode === 'battle') return done({ item: name }); note = 'Charms are thrown at wild monsters during a battle.'; return; }
      if (name === 'Town Map') { if (o.mode === 'battle') { note = 'Not now!'; return; } busy = true; await mapScreen(); busy = false; return; }
      if (name === 'Fishing Rod') { note = o.mode === 'battle' ? 'Not now!' : 'Stand facing water, close this menu and press A.'; return; }
      if (it.kind === 'ward') {
        if (o.mode === 'battle') { note = 'Not now!'; return; }
        S.ward = it.steps; addItem(name, -1); note = 'Wild monsters will keep away for ' + it.steps + ' steps.'; sel = Math.min(sel, names().length - 1); if (sel < 0) sel = 0; return;
      }
      if (!S.party.length) { note = 'You have no monsters yet.'; return; }
      busy = true;
      const i = await teamScreen({ mode: 'pick', title: 'Use ' + name + ' on...' });
      busy = false;
      if (i < 0) return;
      const msg = applyItem(S.party[i], name);
      if (!msg) { note = 'It would have no effect.'; return; }
      addItem(name, -1);
      if (o.mode === 'battle') return done({ item: name, msg });
      note = msg; sel = clamp(sel, 0, Math.max(0, names().length - 1));
    },
  });
}

function journalScreen() {
  let sel = 1, top = 1;
  const rows = 12;
  return layer({
    draw(g) {
      panel(g, 'Journal', 'B back');
      text(g, 'Seen ' + seenCount() + '   Caught ' + caughtCount() + ' / 151', VW - 80, 8, { align: 'right', size: 12, color: '#f2d27a' });
      box(g, 8, 36, 196, 278);
      for (let i = top; i < Math.min(152, top + rows); i++) {
        const y = 44 + (i - top) * 22, d = DEX[i], seen = S.seen[i], got = S.caught[i];
        if (i === sel) { g.fillStyle = UIC.paper2; g.fillRect(14, y - 1, 184, 21); g.fillStyle = UIC.accent; g.fillRect(14, y - 1, 4, 21); }
        text(g, String(i).padStart(3, '0'), 24, y + 1, { size: 13, color: UIC.soft });
        text(g, seen ? d.name : '- - - - -', 58, y, { bold: i === sel, color: seen ? UIC.ink : UIC.soft });
        if (got) { g.fillStyle = UIC.accent; g.fillRect(184, y + 5, 8, 8); g.fillStyle = '#fff'; g.fillRect(186, y + 7, 4, 4); }
      }
      const d = DEX[sel], seen = S.seen[sel], got = S.caught[sel];
      g.fillStyle = UIC.ink; g.fillRect(212, 36, 140, 140); g.fillStyle = seen ? shade(TYPE_COLOR[d.types[0]], .55) : '#3a3350'; g.fillRect(215, 39, 134, 134);
      if (seen) drawMon(g, sel, 218, 42, 128, false, !got); else text(g, '?', 282, 76, { size: 48, bold: true, align: 'center', color: '#6a6088' });
      box(g, 358, 36, 114, 140);
      text(g, 'No. ' + String(sel).padStart(3, '0'), 368, 46, { size: 13, color: UIC.soft });
      text(g, seen ? d.name : '?????', 368, 62, { bold: true, size: 15 });
      if (seen) d.types.forEach((t, i) => typeChip(g, t, 368, 86 + i * 20));
      text(g, got ? 'Caught' : seen ? 'Seen' : 'Unknown', 368, 148, { size: 13, bold: true, color: got ? UIC.good : UIC.soft });
      box(g, 212, 182, 260, 132);
      const body = got ? d.desc : seen ? 'Catch it to record its entry.' : 'Not yet encountered.';
      let y = 192; wrap(g, body, 236, 14).forEach(ln => { text(g, ln, 224, y, { size: 14 }); y += 18; });
      if (seen) { const hab = HABITAT[sel] ? 'Found: ' + HABITAT[sel].join(', ') : d.stage > 0 ? 'Evolves from ' + DEX[sel - 1].name + '.' : ''; y += 4; wrap(g, hab, 236, 12).forEach(ln => { text(g, ln, 224, y, { size: 12, color: UIC.soft }); y += 15; }); }
    },
    key(k, done) {
      if (k === 'b') return done();
      if (k === 'up') sel--; else if (k === 'down') sel++; else if (k === 'left') sel -= 10; else if (k === 'right') sel += 10;
      sel = sel < 1 ? (k === 'up' ? 151 : 1) : sel > 151 ? (k === 'down' ? 1 : 151) : sel;
      if (sel < top) top = sel; if (sel >= top + rows) top = sel - rows + 1;
    },
  });
}

function mapScreen() {
  return layer({
    draw(g) {
      panel(g, 'Vessara', 'A / B back');
      const mx = 44, my = 44, sc = 2;
      g.fillStyle = UIC.ink; g.fillRect(mx - 4, my - 4, 392 + 8, 220 + 8);
      g.drawImage(World.mini, mx, my, 392, 220);
      for (const t of MAPS.world.towns) {
        const x = mx + t.x * sc, y = my + t.y * sc;
        g.fillStyle = UIC.ink; g.fillRect(x - 4, y - 4, 9, 9); g.fillStyle = '#fff'; g.fillRect(x - 2, y - 2, 5, 5);
        text(g, t.name, x, y - 19, { size: 12, bold: true, align: 'center', color: '#fff', shadow: '#000' });
      }
      const wx = World.map.interior ? World.map.warps[Math.floor(World.map.w / 2) + ',' + (World.map.h - 1)].x : World.x;
      const wy = World.map.interior ? World.map.warps[Math.floor(World.map.w / 2) + ',' + (World.map.h - 1)].y : World.y;
      if (Math.floor(Game.t / 300) % 2) { g.fillStyle = '#fff'; g.fillRect(mx + wx * sc - 4, my + wy * sc - 4, 9, 9); g.fillStyle = UIC.accent; g.fillRect(mx + wx * sc - 3, my + wy * sc - 3, 7, 7); }
      const cell = MAPS.world.cellAt(wx, wy);
      text(g, 'You are in ' + (cell ? cell.name : 'Vessara') + '.   Sigils: ' + sigilCount() + ' / 8', VW / 2, 284, { align: 'center', color: '#fff', size: 14 });
    },
    key(k, done) { if (k === 'a' || k === 'b') done(); },
  });
}

function quantityBox(name, max) {
  let q = 1; const price = ITEMS[name].price;
  return layer({
    draw(g) {
      box(g, 150, 110, 180, 96);
      text(g, name, 240, 120, { align: 'center', bold: true });
      text(g, 'x ' + q, 240, 146, { align: 'center', size: 22, bold: true });
      text(g, (q * price) + ' coins', 240, 176, { align: 'center', color: UIC.soft, size: 14 });
      g.fillStyle = UIC.accent; g.beginPath(); g.moveTo(296, 154); g.lineTo(304, 146); g.lineTo(312, 154); g.fill(); g.beginPath(); g.moveTo(296, 162); g.lineTo(304, 170); g.lineTo(312, 162); g.fill();
    },
    key(k, done) {
      if (k === 'up') q = q >= max ? 1 : q + 1; else if (k === 'down') q = q <= 1 ? max : q - 1;
      else if (k === 'right') q = Math.min(max, q + 5); else if (k === 'left') q = Math.max(1, q - 5);
      else if (k === 'a') done(q); else if (k === 'b') done(0);
    },
  });
}
function shopScreen() {
  const stock = shopStock(sigilCount());
  let sel = 0, note = '', busy = false;
  return layer({
    draw(g) {
      panel(g, 'Trade Post', 'A buy   B leave');
      text(g, S.coins + ' coins', VW - 14, 38, { align: 'right', color: '#f2d27a', bold: true });
      box(g, 10, 60, 270, 250);
      stock.forEach((n, i) => {
        const y = 70 + i * 23;
        if (i === sel) { g.fillStyle = UIC.paper2; g.fillRect(16, y - 1, 258, 22); g.fillStyle = UIC.accent; g.fillRect(16, y - 1, 4, 22); }
        text(g, n, 28, y, { bold: i === sel }); text(g, String(ITEMS[n].price), 266, y, { align: 'right', color: ITEMS[n].price > S.coins ? UIC.bad : UIC.soft });
      });
      box(g, 288, 60, 182, 150);
      wrap(g, ITEMS[stock[sel]].desc, 156, 14).forEach((ln, i) => text(g, ln, 300, 72 + i * 18, { size: 14 }));
      text(g, 'You have: ' + (S.bag[stock[sel]] || 0), 300, 182, { size: 13, color: UIC.soft });
      if (note) { box(g, 288, 218, 182, 92); wrap(g, note, 156, 14).forEach((ln, i) => text(g, ln, 300, 230 + i * 18, { size: 14 })); }
    },
    async key(k, done) {
      if (busy) return;
      const n = stock.length;
      if (k === 'b') return done();
      if (k === 'up') { sel = (sel - 1 + n) % n; note = ''; } else if (k === 'down') { sel = (sel + 1) % n; note = ''; }
      else if (k === 'a') {
        const name = stock[sel], max = Math.min(99, Math.floor(S.coins / ITEMS[name].price));
        if (max < 1) { note = 'You can\'t afford that.'; return; }
        busy = true; const q = await quantityBox(name, max); busy = false;
        if (q > 0) { S.coins -= q * ITEMS[name].price; addItem(name, q); note = 'Bought ' + q + ' x ' + name + '.'; }
      }
    },
  });
}

function paddockScreen() {
  let col = 0, sel = 0, top = 0, note = '';
  const rows = 6;
  return layer({
    draw(g) {
      panel(g, 'Paddock', 'A move   B leave');
      text(g, 'TEAM  ' + S.party.length + ' / 6', 12, 36, { size: 12, bold: true, color: '#b8b0d0' });
      text(g, 'PADDOCK  ' + S.vault.length, 246, 36, { size: 12, bold: true, color: '#b8b0d0' });
      S.party.forEach((m, i) => monRow(g, m, 8, 52 + i * 44, 228, col === 0 && i === sel));
      for (let i = top; i < Math.min(S.vault.length, top + rows); i++) monRow(g, S.vault[i], 244, 52 + (i - top) * 44, 228, col === 1 && i === sel);
      if (!S.vault.length) wrap(g, 'Empty. Monsters you catch while your team is full arrive here.', 210, 13).forEach((ln, i) => text(g, ln, 252, 60 + i * 17, { size: 13, color: '#b8b0d0' }));
      if (note) { box(g, 60, VH - 40, VW - 120, 34); text(g, note, VW / 2, VH - 32, { align: 'center', size: 14 }); }
    },
    key(k, done) {
      const list = col === 0 ? S.party : S.vault; note = '';
      if (k === 'b') return done();
      if (k === 'left' || k === 'right') { if (col === 0 && !S.vault.length) return; col = 1 - col; sel = 0; top = 0; return; }
      if (k === 'up') sel = (sel - 1 + list.length) % list.length; else if (k === 'down') sel = (sel + 1) % list.length;
      else if (k === 'a') {
        if (col === 0) { if (S.party.length <= 1) { note = 'You need at least one monster with you.'; return; } if (!S.party.some((p, i) => i !== sel && p.hp > 0)) { note = 'Your other monsters can\'t fight.'; return; } const m = S.party.splice(sel, 1)[0]; healMon(m); S.vault.push(m); note = monName(m) + ' went to rest in the Paddock.'; }
        else { if (S.party.length >= 6) { note = 'Your team is full.'; return; } const m = S.vault.splice(sel, 1)[0]; S.party.push(m); note = monName(m) + ' joined your team.'; if (!S.vault.length) { col = 0; } }
        sel = clamp(sel, 0, Math.max(0, (col === 0 ? S.party : S.vault).length - 1));
      }
      if (col === 1) { if (sel < top) top = sel; if (sel >= top + rows) top = sel - rows + 1; }
    },
  });
}

async function evolveScene(m) {
  const from = m.id, to = DEX[from].evo.to, st = { phase: 0, done: false, t: 0 };
  const L = {
    update(dt) { st.t += dt; },
    draw(g) {
      g.fillStyle = '#16122a'; g.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 10; i++) { g.strokeStyle = 'rgba(255,240,180,' + (0.05 + 0.03 * i) + ')'; g.lineWidth = 2; g.beginPath(); g.arc(VW / 2, 116, 30 + i * 12 + (st.t / 30) % 12, 0, 7); g.stroke(); }
      const speed = st.phase ? 40 + Math.max(0, 260 - st.t / 8) : 0;
      const showNew = st.done || (st.phase && Math.floor(st.t / speed) % 2);
      drawMon(g, showNew ? to : from, VW / 2 - 80, 30, 160, false, st.phase && !st.done);
      Msg.draw(g);
    },
    key(k) { if (Msg.resolve) Msg.key(k); },
  };
  Game.ui.push(L);
  await say('What? ' + DEX[from].name + ' is changing!');
  st.phase = 1; st.t = 0; Msg.set('');
  await wait(2600);
  const before = statOf(m, 'hp');
  m.id = to; m.hp += statOf(m, 'hp') - before; S.seen[to] = 1; S.caught[to] = 1; st.done = true;
  Game.flash = 0.9; tween(Game, 'flash', 0, 400);
  await say(DEX[from].name + ' became ' + DEX[to].name + '!');
  for (const [l, mv] of DEX[to].learn) if (l === m.lvl) await learnMove(m, mv);
  Game.ui.splice(Game.ui.indexOf(L), 1); Msg.hide();
}

/* ---------- title ---------- */
const Title = {
  parade: null,
  draw(g) {
    if (!this.parade) { this.parade = []; for (let i = 0; i < 7; i++) this.parade.push({ id: R.int(1, 145), x: i * 90 - 60, s: 0.9 + (i % 3) * 0.12 }); }
    const gr = g.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#2a2350'); gr.addColorStop(.55, '#7a4a7a'); gr.addColorStop(1, '#f0a060');
    g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = (i * 97) % VW, y = (i * 53) % 130; if ((i + Math.floor(Game.t / 600)) % 5) g.fillRect(x, y, 2, 2); }
    g.fillStyle = '#3a2a55'; g.beginPath(); g.moveTo(0, 210); for (let x = 0; x <= VW; x += 40) g.lineTo(x, 180 + ((x * 7) % 50)); g.lineTo(VW, VH); g.lineTo(0, VH); g.fill();
    g.fillStyle = '#2a1f40'; g.fillRect(0, 262, VW, 60);
    for (const p of this.parade) { p.x -= 0.35; if (p.x < -90) { p.x = VW + 20; p.id = R.int(1, 145); } drawMon(g, p.id, Math.round(p.x), 206 + Math.round(Math.sin(Game.t / 260 + p.x / 30) * 2), 64); }
    text(g, 'TAMERS OF', VW / 2, 38, { align: 'center', size: 22, bold: true, color: '#f2d27a', shadow: '#1a1430' });
    text(g, 'VESSARA', VW / 2, 60, { align: 'center', size: 60, bold: true, color: '#fff', shadow: '#1a1430' });
    text(g, '151 monsters.  Eight sigils.  One crown.', VW / 2, 128, { align: 'center', size: 14, color: '#f0e6ff' });
  },
};

async function titleFlow() {
  Game.scene = 'title'; Game.fadeA = 0;
  for (;;) {
    const save = readSave();
    const opts = save ? ['Continue', 'New Game'] : ['New Game'];
    const r = await choose(opts, { x: VW / 2 - 70, y: save ? 150 : 162, w: 140, cancel: false });
    if (save && r === 0) { S = save; await fadeOut(250); break; }
    if (save) { if (!(await confirmBox('Start over? Your saved game will be replaced once you save again.'))) { Msg.hide(); continue; } }
    Msg.set('What is your name?');
    const names = ['Wren', 'Kai', 'Juno', 'Mira', 'Sol', 'Tamsin'];
    const n = await choose(names, { cols: 2, x: VW / 2 - 110, y: 136, w: 220 });
    Msg.hide();
    if (n < 0) continue;
    newGame(names[n]);
    await fadeOut(250);
    S.fresh = 1;
    break;
  }
  startWorld();
}
async function startWorld() {
  if (!MAPS[S.map]) { S.map = 'world'; const r = newGameSpawn(); S.x = r.x; S.y = r.y; }
  Game.scene = 'world'; World.enter(S.map, S.x, S.y, S.dir || 'down');
  await fadeIn(300);
  if (S.fresh) {
    delete S.fresh;
    World.run(async () => {
      await say('Mosswick, early morning. The grass is wet, the road east is empty, and today is the day.');
      await say('Sage Maren is expecting you at her study, the house with the teal roof.');
      await say('Move with the arrow keys or the pad. A talks and confirms, B cancels and runs, MENU opens your Journal, Team, Bag and Map.');
    });
  }
}
