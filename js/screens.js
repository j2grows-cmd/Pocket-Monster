'use strict';
/* Full-screen menus: pause menu, team, summary, bag, journal, map, trade post, paddock, evolution and the title.
   Layouts are built from the panels, bars, chips and icons in ui.js; nothing here touches the game rules. */

function evoReady(m) { const e = DEX[m.id].evo; return !!(e && m.lvl >= e.lvl && m.hp > 0); }
function sigilRow(g, x, y, n) {
  for (let i = 0; i < 8; i++) {
    const sx = x + i * 10; g.fillStyle = PAL.night; g.fillRect(sx + 2, y, 4, 8); g.fillRect(sx, y + 2, 8, 4);
    g.fillStyle = i < n ? PAL.gold : PAL.indigo3; g.fillRect(sx + 2, y + 2, 4, 4);
    if (i < n) { g.fillStyle = PAL.goldHi; g.fillRect(sx + 2, y + 2, 2, 2); }
  }
}
function playTime() { const m = Math.floor((S.time || 0) / 60000); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
function noteBar(g, note) { if (!note) return; panel(g, 60, VH - 60, VW - 120, 32, 'dark'); text(g, note, VW / 2, VH - 52, { align: 'center', size: 12, color: PAL.parch }); }

/* ---------- pause menu: a side drawer with your tamer card ---------- */
async function pauseMenu() {
  const items = [['Journal', 'journal'], ['Team', 'team'], ['Bag', 'bag'], ['Map', 'map'], ['Save', 'save'], ['Close', 'close']];
  let start = 0;
  const draw = (g, st) => {
    const x = VW - 162, y = 8, w = 154, h = 240;
    panel(g, x, y, w, h, 'dark');
    panel(g, x + 10, y + 10, 40, 40, 'well', { fill: PAL.indigo3 });
    g.drawImage(Sprites.portrait('hero'), x + 14, y + 16, 32, 32);
    text(g, S.name, x + 58, y + 7, { font: 'd', size: 17, color: PAL.parch, track: .5 });
    text(g, 'Tamer of Vessara', x + 58, y + 27, { size: 10, color: PAL.lav });
    sigilRow(g, x + 58, y + 42, sigilCount());
    g.fillStyle = PAL.indigo3; g.fillRect(x + 10, y + 58, w - 20, 2);
    icon(g, 'coin', x + 10, y + 66, 1); text(g, String(S.coins), x + 21, y + 63, { size: 10, weight: 800, color: PAL.goldHi });
    icon(g, 'journal', x + 62, y + 66, 1); text(g, caughtCount() + '/151', x + 73, y + 63, { size: 10, weight: 800, color: PAL.parch });
    icon(g, 'clock', x + 114, y + 66, 1); text(g, playTime(), x + 125, y + 63, { size: 10, weight: 800, color: PAL.parch });
    items.forEach(([label, ic], i) => {
      const ry = y + 84 + i * 25, on = i === st.sel;
      if (on) { rrect(g, x + 8, ry - 2, w - 16, 24, 2, PAL.gold); g.fillStyle = PAL.parch; g.fillRect(x + 10, ry, w - 20, 20); g.fillStyle = PAL.parch2; g.fillRect(x + 10, ry + 16, w - 20, 4); }
      icon(g, ic, x + (on ? 20 : 16), ry + 2, 2);
      text(g, label, x + (on ? 46 : 42), ry, { font: 'd', size: 16, color: on ? PAL.ink : PAL.parch, track: .5 });
      if (on) cursor(g, x + w - 26, ry + 5);
    });
  };
  for (;;) {
    const r = await choose(items.map(i => i[0]), { x: VW - 162, y: 8, w: 154, start, draw });
    if (r < 0 || r === 5) return;
    start = r;
    if (r === 0) await journalScreen();
    if (r === 1) { if (S.party.length) await teamScreen({ mode: 'menu' }); else { await say('You have no monsters yet.'); Msg.hide(); } }
    if (r === 2) { const out = await bagScreen({ mode: 'field' }); if (out === 'close') return; }
    if (r === 3) await mapScreen();
    if (r === 4) { const ok = saveGame(); await say(ok ? 'Game saved.' : 'Saved for this session only. This browser is blocking storage.'); Msg.hide(); }
  }
}

/* ---------- monster cards ---------- */
/* The large card used on the team screen. o: sel, badge. */
function monCard(g, m, x, y, w, h, o) {
  const d = DEX[m.id], max = statOf(m, 'hp'), f = m.hp / max, out = m.hp <= 0, ga = g.globalAlpha;
  if (o.sel) y -= 2;
  panel(g, x, y, w, h, 'card', { sel: o.sel, dim: out });
  panel(g, x + 8, y + 8, 68, h - 16, 'well', { fill: shade(TYPE_COLOR[d.types[0]], out ? -.5 : -.18) });
  const bob = o.sel && !out ? Math.round(Math.sin(Game.t / 240)) * 2 : 0;
  g.globalAlpha = ga * (out ? .5 : 1); drawMon(g, m.id, x + 10, y + 8 + (h - 16 - 64) / 2 + bob, 64); g.globalAlpha = ga;
  text(g, d.name, x + 84, y + (d.name.length > 10 ? 7 : 5), { font: 'd', size: d.name.length > 10 ? 14 : 17, color: PAL.ink, track: .3 });
  lvPill(g, m.lvl, x + w - 8, y + 6);
  d.types.forEach((t, i) => typeChip(g, t, x + 84 + i * 56, y + 27));
  bar(g, x + 84, y + 47, w - 94, 10, f, hpColor(f));
  text(g, m.hp + ' / ' + max, x + w - 10, y + 59, { size: 12, weight: 800, align: 'right', color: out ? PAL.coralLo : PAL.ink });
  let tx = x + 84;
  if (out) tx += tag(g, 'FAINTED', tx, y + 61, PAL.coralLo) + 4;
  else if (m.status) { statusChip(g, m.status, tx, y + 61); tx += 34; }
  if (evoReady(m)) { icon(g, 'up', tx, y + 64, 1); tag(g, m.status ? 'EVOLVE' : 'CAN EVOLVE', tx + 10, y + 61, PAL.green); }
  if (o.badge) tag(g, o.badge, x + 4, y + 2, o.badge === 'LEAD' ? PAL.gold : PAL.coral, o.badge === 'LEAD' ? PAL.night : '#fff');
}
/* The compact row: paddock columns, and the team screen on small displays. */
function monRow(g, m, x, y, w, sel, badge) {
  const d = DEX[m.id], max = statOf(m, 'hp'), f = m.hp / max, out = m.hp <= 0, h = 38, ga = g.globalAlpha;
  panel(g, x, y, w, h, 'card', { sel, dim: out });
  panel(g, x + 6, y + 4, 36, 30, 'well', { fill: shade(TYPE_COLOR[d.types[0]], out ? -.5 : -.18) });
  g.globalAlpha = ga * (out ? .5 : 1); drawMon(g, m.id, x + 8, y + 3, 32); g.globalAlpha = ga;
  text(g, d.name, x + 48, y + 2, { font: 'd', size: 15, color: PAL.ink });
  lvPill(g, m.lvl, x + w - 6, y + 3);
  bar(g, x + 48, y + 22, w - 108, 8, f, hpColor(f));
  text(g, out ? 'Fainted' : m.hp + '/' + max, x + w - 8, y + 18, { size: 11, weight: 800, align: 'right', color: out ? PAL.coralLo : PAL.ink });
  if (m.status && !out) statusChip(g, m.status, x + w - 84, y + 4);
  else if (evoReady(m)) icon(g, 'up', x + w - 60, y + 7, 1);
  if (badge) tag(g, badge, x + 2, y - 2, badge === 'LEAD' ? PAL.gold : PAL.coral, badge === 'LEAD' ? PAL.night : '#fff');
}
function lvPill(g, lvl, xr, y) {
  const str = 'Lv ' + lvl, w = Math.ceil(textW(g, str, 11, { weight: 800 })) + 12;
  rrect(g, xr - w, y, w, 16, 2, PAL.indigo); text(g, str, xr - 6, y + 1, { size: 11, weight: 800, color: PAL.parch, align: 'right' });
}
function emptySlot(g, x, y, w, h) {
  g.fillStyle = PAL.night2; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = PAL.indigo2;
  for (let i = 4; i < w - 6; i += 8) { g.fillRect(x + i, y, 4, 2); g.fillRect(x + i, y + h - 2, 4, 2); }
  for (let i = 4; i < h - 6; i += 8) { g.fillRect(x, y + i, 2, 4); g.fillRect(x + w - 2, y + i, 2, 4); }
  text(g, 'EMPTY SLOT', x + w / 2, y + h / 2 - 8, { font: 'd', size: 11, color: PAL.indigo3, align: 'center', track: 1.5 });
}

/* mode: 'menu' (pause menu), 'battle' (switching), 'pick' (choose a target). Resolves to an index or -1. */
function teamScreen(o) {
  let sel = Math.max(0, o.active || 0), note = '', busy = false;
  if (o.forced) { const i = S.party.findIndex(m => m.hp > 0); if (i >= 0) sel = i; } // start on someone who can still fight
  const rect = i => Game.compact ? [8, 40 + i * 43, VW - 16, 38] : [8 + (i % 2) * 235, 42 + Math.floor(i / 2) * 86, 229, 80];
  return layer({
    draw(g) {
      screenFrame(g, o.title || 'Team', o.forced ? [['A', 'Choose']] : [['A', 'Choose'], ['B', 'Back']], g2 => text(g2, S.party.length + ' / 6', VW - 12, 7, { size: 12, weight: 800, color: PAL.goldHi, align: 'right' }));
      for (let i = 0; i < 6; i++) {
        const [x, y, w, h] = rect(i), m = S.party[i];
        if (!m) { emptySlot(g, x, y, w, h); continue; }
        const badge = o.mode === 'battle' && i === o.active && m.hp > 0 ? 'IN BATTLE' : (i === 0 && o.mode === 'menu' ? 'LEAD' : '');
        if (Game.compact) monRow(g, m, x, y, w, i === sel, badge); else monCard(g, m, x, y, w, h, { sel: i === sel, badge });
      }
      noteBar(g, note);
    },
    async key(k, done) {
      if (busy) return;
      const n = S.party.length, two = !Game.compact; note = '';
      if (k === 'up') sel = !two ? (sel - 1 + n) % n : sel - 2 >= 0 ? sel - 2 : sel;
      else if (k === 'down') sel = !two ? (sel + 1) % n : sel + 2 < n ? sel + 2 : sel;
      else if (k === 'left' && two) sel = sel > 0 ? sel - 1 : sel;
      else if (k === 'right' && two) sel = sel + 1 < n ? sel + 1 : sel;
      else if (k === 'b') { if (!o.forced) done(-1); }
      else if (k === 'a') {
        const m = S.party[sel], [rx, ry, rw] = rect(sel), mx = Math.min(rx + rw - 150, VW - 158), my = Math.min(ry + 24, VH - 118);
        if (o.mode === 'pick') return done(sel);
        busy = true;
        if (o.mode === 'battle') {
          const r = await choose(['Send out', 'Summary', 'Cancel'], { x: mx, y: my, w: 140 });
          busy = false;
          if (r === 1) { busy = true; await summaryScreen(m); busy = false; }
          if (r === 0) { if (m.hp <= 0) note = monName(m) + ' has no energy left.'; else if (sel === o.active) note = monName(m) + ' is already in battle.'; else done(sel); }
        } else {
          const r = await choose(['Summary', 'Move to front', 'Cancel'], { x: mx, y: my, w: 150 });
          busy = false;
          if (r === 0) { busy = true; await summaryScreen(m); busy = false; }
          if (r === 1 && sel > 0) { S.party.splice(sel, 1); S.party.unshift(m); sel = 0; }
        }
      }
    },
  });
}

const STAT_TINT = { hp: '#6fb86a', atk: '#db665a', def: '#d9ad55', foc: '#6cb6e8', wil: '#a89abf', spd: '#7fd0c0' };
function moveCard(g, mv, x, y, w) {
  const M = MOVES[mv.n];
  rrect(g, x, y, w, 36, 2, PAL.night); g.fillStyle = PAL.parch; g.fillRect(x + 2, y + 2, w - 4, 32);
  g.fillStyle = TYPE_COLOR[M.type]; g.fillRect(x + 2, y + 2, 6, 32);
  g.fillStyle = PAL.parch2; g.fillRect(x + 8, y + 30, w - 10, 4);
  text(g, mv.n, x + 14, y + 1, { font: 'd', size: 14, color: PAL.ink });
  typeGlyph(g, M.type, x + w - 16, y + 5, TYPE_COLOR[M.type]);
  text(g, (M.pow ? 'Pow ' + M.pow : 'Status') + '  ·  PP ' + mv.pp + '/' + M.pp, x + 14, y + 17, { size: 10, color: mv.pp ? PAL.soft : PAL.coralLo });
}
function summaryScreen(m) {
  return layer({
    draw(g) {
      const d = DEX[m.id];
      screenFrame(g, d.name, [['A', 'Back'], ['B', 'Back']], g2 => text(g2, 'No. ' + String(d.id).padStart(3, '0'), VW - 12, 7, { size: 12, weight: 800, color: PAL.goldHi, align: 'right' }));
      // artwork
      panel(g, 8, 40, 140, 140, 'well', { fill: shade(TYPE_COLOR[d.types[0]], -.18) });
      drawMon(g, m.id, 14, 44 + Math.round(Math.sin(Game.t / 420)) * 2, 128);
      d.types.forEach((t, i) => typeChip(g, t, 8 + i * 56, 186));
      text(g, 'Level ' + m.lvl, 8, 206, { font: 'd', size: 18, color: PAL.parch });
      bar(g, 8, 230, 140, 8, xpFrac(m), PAL.sky);
      text(g, m.lvl >= 100 ? 'Fully grown' : (xpFor(m.lvl + 1) - m.xp) + ' XP to next level', 8, 241, { size: 10, color: PAL.lav });
      if (evoReady(m)) { icon(g, 'up', 8, 262, 1); tag(g, 'CAN EVOLVE', 20, 259, PAL.green); }
      if (m.status) { statusChip(g, m.status, 8, 278); text(g, { burn: 'Burned', frost: 'Frostbitten', poison: 'Poisoned', sleep: 'Asleep', stun: 'Stunned' }[m.status], 44, 277, { size: 11, color: PAL.coralHi }); }
      // stats
      panel(g, 156, 40, 150, 148, 'dark');
      heading(g, 'Stats', 168, 47);
      const top = Math.max(120, ...STAT_KEYS.map(k => statOf(m, k)));
      STAT_KEYS.forEach((k, i) => {
        const y = 68 + i * 19, v = statOf(m, k);
        text(g, STAT_NAME[k], 168, y - 4, { size: 11, color: PAL.lav });
        bar(g, 208, y, 36, 8, v / top, STAT_TINT[k]);
        text(g, k === 'hp' ? m.hp + '/' + v : String(v), 296, y - 5, { size: 12, weight: 800, color: PAL.parch, align: 'right' });
      });
      // moves
      panel(g, 314, 40, 158, 180, 'dark');
      heading(g, 'Moves', 326, 47);
      m.moves.forEach((mv, i) => moveCard(g, mv, 324, 66 + i * 38, 138));
      // journal note and habitat
      panel(g, 156, 196, 150, 98, 'parch');
      wrap(g, d.desc, 126, 11).slice(0, 5).forEach((ln, i) => text(g, ln, 168, 205 + i * 15, { size: 11 }));
      panel(g, 314, 228, 158, 66, 'dark');
      heading(g, 'Habitat', 326, 235);
      const hab = HABITAT[baseFormOf(m.id)] || [];
      wrap(g, hab.length ? hab.slice(0, 4).join(', ') : 'Unknown', 136, 10).slice(0, 3).forEach((ln, i) => text(g, ln, 326, 251 + i * 13, { size: 10, color: PAL.parch }));
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

/* The list-and-detail layout shared by the bag and the trade post. */
function itemList(g, list, sel, top, right) {
  panel(g, 8, 40, 256, 254, 'parch');
  if (!list.length) text(g, 'Nothing here yet.', 26, 56, { color: PAL.soft });
  for (let i = top; i < Math.min(list.length, top + 10); i++) {
    const y = 50 + (i - top) * 24;
    if (i === sel) selRow(g, 14, y - 2, 244, 22);
    icon(g, itemIcon(list[i]), 22, y + 1, 2);
    text(g, list[i], 46, y - 1, { size: 13, weight: i === sel ? 800 : 700 });
    const r = right(list[i]); if (r) text(g, r.text, 250, y, { align: 'right', size: 12, weight: 800, color: r.color || PAL.soft });
  }
  if (list.length > 10) { g.fillStyle = PAL.goldLo; if (top > 0) g.fillRect(250, 44, 6, 2); if (top + 10 < list.length) g.fillRect(250, 286, 6, 2); }
}
function itemDetail(g, name, extra, note) {
  panel(g, 272, 40, 200, 150, 'parch');
  if (name) {
    panel(g, 282, 50, 40, 40, 'well', { fill: PAL.indigo2 }); icon(g, itemIcon(name), 286, 54, 4);
    text(g, name, 330, 50, { font: 'd', size: 16 });
    if (extra) text(g, extra, 330, 70, { size: 11, color: PAL.soft });
    wrap(g, ITEMS[name].desc, 176, 12).forEach((ln, i) => text(g, ln, 284, 98 + i * 16, { size: 12 }));
  }
  if (note) { panel(g, 272, 198, 200, 96, 'dark'); wrap(g, note, 176, 12).forEach((ln, i) => text(g, ln, 284, 208 + i * 16, { size: 12, color: PAL.parch })); }
}

/* Resolves to {item} when something was used in battle, 'close' to shut the pause menu, or null. */
function bagScreen(o) {
  let sel = 0, top = 0, note = '', busy = false;
  const names = () => Object.keys(S.bag).filter(n => S.bag[n] > 0);
  return layer({
    draw(g) {
      const list = names(), cur = list[sel];
      screenFrame(g, 'Bag', [['A', 'Use'], ['B', 'Back']], g2 => coinsChip(g2, VW - 8, 5));
      itemList(g, list, sel, top, n => ITEMS[n].key ? { text: 'KEY', color: PAL.goldLo } : { text: 'x' + S.bag[n] });
      itemDetail(g, cur, cur ? (ITEMS[cur].key ? 'Key item' : 'In bag: ' + S.bag[cur]) : '', note);
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
      const i = await teamScreen({ mode: 'pick', title: 'Use ' + name });
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
  const rows = 11;
  return layer({
    draw(g) {
      screenFrame(g, 'Journal', [['B', 'Back']], g2 => {
        text(g2, 'Seen ' + seenCount() + '   Caught ' + caughtCount() + ' / 151', VW - 12, 2, { size: 10, weight: 800, color: PAL.goldHi, align: 'right' });
        bar(g2, VW - 132, 17, 120, 8, caughtCount() / 151, PAL.gold);
      });
      panel(g, 8, 40, 196, 254, 'parch');
      for (let i = top; i < Math.min(152, top + rows); i++) {
        const y = 50 + (i - top) * 22, d = DEX[i], seen = S.seen[i], got = S.caught[i];
        if (i === sel) selRow(g, 14, y - 2, 184, 20);
        text(g, String(i).padStart(3, '0'), 24, y + 1, { size: 10, weight: 800, color: PAL.soft });
        if (seen) text(g, d.name, 54, y - 1, { size: 13, weight: i === sel ? 800 : 700 });
        else { g.fillStyle = PAL.parch3; for (let k = 0; k < 5; k++) g.fillRect(54 + k * 10, y + 8, 6, 2); }
        if (got) { g.fillStyle = PAL.night; g.fillRect(184, y + 2, 4, 12); g.fillRect(180, y + 6, 12, 4); g.fillRect(182, y + 4, 8, 8); g.fillStyle = PAL.gold; g.fillRect(184, y + 4, 4, 8); g.fillRect(182, y + 6, 8, 4); g.fillStyle = PAL.goldHi; g.fillRect(184, y + 6, 2, 2); }
        else if (seen) { g.fillStyle = PAL.parch3; g.fillRect(184, y + 6, 4, 4); }
      }
      const d = DEX[sel], seen = S.seen[sel], got = S.caught[sel];
      panel(g, 212, 40, 136, 136, 'well', { fill: seen ? shade(TYPE_COLOR[d.types[0]], -.18) : PAL.indigo });
      if (seen) drawMon(g, sel, 216, 44 + (got ? Math.round(Math.sin(Game.t / 420)) * 2 : 0), 128, false, !got);
      else text(g, '?', 280, 70, { font: 'd', size: 56, align: 'center', color: PAL.indigo3 });
      panel(g, 354, 40, 118, 136, 'dark');
      text(g, 'No. ' + String(sel).padStart(3, '0'), 366, 48, { size: 11, weight: 800, color: PAL.lav });
      text(g, seen ? d.name : '?????', 366, 62, { font: 'd', size: 17, color: PAL.parch });
      if (seen) d.types.forEach((t, i) => typeChip(g, t, 366, 90 + i * 20));
      tag(g, got ? 'CAUGHT' : seen ? 'SEEN' : 'UNKNOWN', 366, 152, got ? PAL.green : seen ? PAL.lavLo : PAL.indigo3);
      panel(g, 212, 182, 260, 112, 'parch');
      const body = got ? d.desc : seen ? 'Catch it to record its entry.' : 'Not yet encountered.';
      let y = 191; wrap(g, body, 234, 12).forEach(ln => { text(g, ln, 224, y, { size: 12 }); y += 16; });
      if (seen) { const hab = HABITAT[sel] ? 'Found: ' + HABITAT[sel].join(', ') : d.stage > 0 ? 'Evolves from ' + DEX[sel - 1].name + '.' : ''; y += 4; wrap(g, hab, 234, 10).slice(0, 3).forEach(ln => { text(g, ln, 224, y, { size: 10, color: PAL.soft }); y += 13; }); }
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
      screenFrame(g, 'Vessara', [['A', 'Back'], ['B', 'Back']], g2 => sigilRow(g2, VW - 92, 11, sigilCount()));
      const mx = 44, my = 46, sc = 2;
      panel(g, mx - 8, my - 8, 408, 236, 'parch');
      g.fillStyle = PAL.night; g.fillRect(mx - 2, my - 2, 396, 224);
      g.drawImage(World.mini, mx, my, 392, 220);
      for (const t of MAPS.world.towns) {
        const x = mx + t.x * sc, y = my + t.y * sc, w = Math.ceil(textW(g, t.name, 11, { font: 'd' })) + 8;
        g.fillStyle = 'rgba(23,22,41,.8)'; g.fillRect(Math.round(x - w / 2), y - 21, w, 14);
        text(g, t.name, x, y - 22, { font: 'd', size: 11, align: 'center', color: PAL.parch });
        g.fillStyle = PAL.night; g.fillRect(x - 2, y - 6, 4, 12); g.fillRect(x - 6, y - 2, 12, 4); g.fillRect(x - 4, y - 4, 8, 8);
        g.fillStyle = PAL.gold; g.fillRect(x - 2, y - 4, 4, 8); g.fillRect(x - 4, y - 2, 8, 4); g.fillStyle = PAL.goldHi; g.fillRect(x - 2, y - 2, 2, 2);
      }
      const door = World.map.interior ? World.map.warps[Math.floor(World.map.w / 2) + ',' + (World.map.h - 1)] : null;
      const wx = door ? door.x : World.x, wy = door ? door.y : World.y;
      icon(g, 'pin', mx + wx * sc - 8, my + wy * sc - 16 - (Math.floor(Game.t / 300) % 2) * 2, 2);
      const cell = MAPS.world.cellAt(wx, wy);
      text(g, 'You are in ' + (cell ? cell.name : 'Vessara') + '.', VW / 2, 278, { align: 'center', color: PAL.parch, size: 12 });
    },
    key(k, done) { if (k === 'a' || k === 'b') done(); },
  });
}

function quantityBox(name, max) {
  let q = 1; const price = ITEMS[name].price;
  return layer({
    draw(g) {
      panel(g, 146, 100, 188, 116, 'parch');
      text(g, name, 240, 108, { align: 'center', font: 'd', size: 16 });
      rrect(g, 204, 134, 72, 34, 2, PAL.night); g.fillStyle = PAL.indigo; g.fillRect(206, 136, 68, 30);
      text(g, 'x ' + q, 240, 137, { align: 'center', font: 'd', size: 22, color: PAL.parch });
      const up = Math.floor(Game.t / 300) % 2 * 2;
      g.fillStyle = PAL.coral; g.fillRect(292, 144 - up, 2, 2); g.fillRect(290, 146 - up, 6, 2); g.fillRect(288, 148 - up, 10, 2);
      g.fillRect(288, 156 + up, 10, 2); g.fillRect(290, 158 + up, 6, 2); g.fillRect(292, 160 + up, 2, 2);
      icon(g, 'coin', 196, 180, 2); text(g, (q * price) + ' coins', 218, 179, { size: 13, weight: 800, color: PAL.goldLo });
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
      screenFrame(g, 'Trade Post', [['A', 'Buy'], ['B', 'Leave']], g2 => coinsChip(g2, VW - 8, 5));
      itemList(g, stock, sel, 0, n => ({ text: String(ITEMS[n].price), color: ITEMS[n].price > S.coins ? PAL.coralLo : PAL.goldLo }));
      itemDetail(g, stock[sel], 'In bag: ' + (S.bag[stock[sel]] || 0), note);
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
  const rows = 5;
  return layer({
    draw(g) {
      screenFrame(g, 'Paddock', [['A', 'Move'], ['B', 'Leave']]);
      heading(g, 'Team  ' + S.party.length + ' / 6', 10, 38, { color: col === 0 ? PAL.goldHi : PAL.lav });
      heading(g, 'Paddock  ' + S.vault.length, 246, 38, { color: col === 1 ? PAL.goldHi : PAL.lav });
      S.party.forEach((m, i) => monRow(g, m, 8, 56 + i * 40, 228, col === 0 && i === sel));
      for (let i = top; i < Math.min(S.vault.length, top + rows + 1); i++) monRow(g, S.vault[i], 244, 56 + (i - top) * 40, 228, col === 1 && i === sel);
      if (!S.vault.length) { emptySlot(g, 244, 56, 228, 60); wrap(g, 'Monsters you catch while your team is full arrive here.', 200, 10).forEach((ln, i) => text(g, ln, 358, 122 + i * 13, { size: 10, color: PAL.lav, align: 'center' })); }
      noteBar(g, note);
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
      g.fillStyle = PAL.night; g.fillRect(0, 0, VW, VH);
      // rings of light closing in, then bursting out
      const cx = VW / 2, cy = 122, col = st.done ? PAL.goldHi : PAL.lav;
      for (let i = 0; i < 6; i++) {
        const r = st.done ? 30 + ((st.t / 6 + i * 34) % 204) : 204 - ((st.t / (st.phase ? 5 : 14) + i * 34) % 204);
        g.fillStyle = col; g.globalAlpha = clamp(1 - r / 204, 0, 1) * .5;
        for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2 + i; g.fillRect(Math.round((cx + Math.cos(an) * r) / 2) * 2, Math.round((cy + Math.sin(an) * r * .62) / 2) * 2, 2, 2); }
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 26; i++) { const x = (i * 97 + 31) % VW, y = VH - ((st.t * (.03 + (i % 5) * .012) + i * 53) % (VH + 20)); g.fillStyle = i % 3 ? PAL.gold : PAL.white; g.fillRect(x & ~1, Math.round(y) & ~1, i % 4 ? 2 : 4, i % 4 ? 2 : 4); }
      g.fillStyle = 'rgba(71,63,112,.8)'; for (let y = -8; y <= 8; y += 2) { const w = Math.round(84 * Math.sqrt(1 - y * y / 64) / 2) * 2; g.fillRect(cx - w, 208 + y, w * 2, 2); }
      const speed = st.phase ? 40 + Math.max(0, 260 - st.t / 8) : 0;
      const showNew = st.done || (st.phase && Math.floor(st.t / speed) % 2);
      const id = showNew ? to : from;
      if (st.phase && !st.done) g.drawImage(Sprites.white(id), cx - 96, 22, 192, 192); else drawMon(g, id, cx - 96, 22 + Math.round(Math.sin(st.t / 300)) * 2, 192);
      if (st.done) { const w = Math.ceil(textW(g, DEX[to].name.toUpperCase(), 18, { font: 'd', track: 1.5 })) + 36; rrect(g, cx - w / 2, 8, w, 28, 4, PAL.night); rrect(g, cx - w / 2 + 2, 10, w - 4, 24, 2, PAL.gold); g.fillStyle = PAL.indigo; g.fillRect(cx - w / 2 + 4, 12, w - 8, 20); text(g, DEX[to].name.toUpperCase(), cx, 10, { font: 'd', size: 18, align: 'center', color: PAL.goldHi, track: 1.5 }); }
      Msg.draw(g);
    },
    key(k) { if (Msg.resolve) Msg.key(k); },
  };
  Game.ui.push(L);
  await say('What? ' + DEX[from].name + ' is changing!');
  st.phase = 1; st.t = 0; Msg.set('');
  await wait(2600);
  const before = statOf(m, 'hp');
  m.id = to; m.hp += statOf(m, 'hp') - before; S.seen[to] = 1; S.caught[to] = 1; st.done = true; st.t = 0;
  Game.flash = 0.9; tween(Game, 'flash', 0, 400);
  await say(DEX[from].name + ' became ' + DEX[to].name + '!');
  for (const [l, mv] of DEX[to].learn) if (l === m.lvl) await learnMove(m, mv);
  Game.ui.splice(Game.ui.indexOf(L), 1); Msg.hide();
}

/* ---------- title ---------- */
const Title = {
  parade: null,
  draw(g) {
    const t = Game.t;
    if (!this.parade) { this.parade = []; for (let i = 0; i < 7; i++) this.parade.push({ id: R.int(1, 145), x: i * 90 - 60 }); }
    g.drawImage(Scenery.title(), 0, 0, VW, VH);
    for (let i = 0; i < 14; i++) { const x = (i * 173 + 40) % VW, y = (i * 59 + 12) % 118; if (Math.floor(t / 500 + i * 1.3) % 4 === 0) { g.fillStyle = PAL.white; g.fillRect(x & ~1, y & ~1, 2, 2); g.fillRect((x & ~1) - 2, y & ~1, 6, 2); g.fillRect(x & ~1, (y & ~1) - 2, 2, 6); } }
    for (const p of this.parade) {
      p.x -= Game.dt * 0.022; if (p.x < -90) { p.x = VW + 20; p.id = R.int(1, 145); }
      const px = Math.round(p.x / 2) * 2, hop = Math.abs(Math.round(Math.sin(t / 220 + p.id) * 2)) * 2;
      g.fillStyle = 'rgba(8,6,20,.5)'; g.fillRect(px + 14, 292, 36, 4); g.fillRect(px + 18, 290, 28, 8);
      drawMon(g, p.id, px, 232 - hop, 64);
    }
    // wordmark
    text(g, 'TAMERS OF', VW / 2 + 3, 28, { font: 'd', size: 17, align: 'center', color: PAL.gold, shadow: PAL.night, track: 7 });
    g.fillStyle = PAL.gold; [-88, 84].forEach(o => { g.fillRect(VW / 2 + o, 40, 4, 4); g.fillRect(VW / 2 + o + (o < 0 ? -24 : 8), 41, 20, 2); });
    for (const [ox, oy, c] of [[4, 6, PAL.night], [-2, 0, PAL.night], [2, 0, PAL.night], [0, -2, PAL.night], [0, 4, PAL.coral], [0, 0, PAL.parch]]) text(g, 'VESSARA', VW / 2 + 5 + ox, 42 + oy, { font: 'd', size: 62, align: 'center', color: c, track: 5 });
    text(g, '151 monsters  ·  Eight sigils  ·  One crown', VW / 2, 122, { align: 'center', size: 11, color: PAL.parch2, shadow: PAL.night });
  },
};
function titleMenu(opts, hasSave) {
  const bw = 168, x = VW / 2 - bw / 2, y0 = hasSave ? 146 : 158;
  return choose(opts, {
    cancel: false, x, y: y0, w: bw,
    draw(g, st) {
      opts.forEach((label, i) => {
        const on = i === st.sel, y = y0 + i * 34;
        panel(g, x, y + (on ? -2 : 0), bw, 28, on ? 'parch' : 'dark', { sel: on });
        text(g, label.toUpperCase(), VW / 2, y + (on ? 1 : 3), { font: 'd', size: 16, align: 'center', color: on ? PAL.ink : PAL.lav, track: 2 });
        if (on) cursor(g, x + 14, y + 7);
      });
      hintRow(g, [['A', 'Select']], VW - 10, VH - 18);
      text(g, 'An original fan-made monster-taming RPG', 10, VH - 18, { size: 9, color: PAL.lav, shadow: PAL.night });
    },
  });
}

async function titleFlow() {
  Game.scene = 'title'; Game.fadeA = 0;
  for (;;) {
    const save = readSave();
    const opts = save ? ['Continue', 'New Game'] : ['New Game'];
    const r = await titleMenu(opts, !!save);
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
