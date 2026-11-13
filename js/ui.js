'use strict';
/* The Vessara design system. Every screen is assembled from the pieces in this file:
   one palette, two typefaces, pixel-stepped panels, bars, chips, icons and key hints.
   Art is drawn on a 2-unit grid (U) so UI pixels are the same size as world pixels. */

const PAL = {
  night: '#171629', night2: '#1e1b35', indigo: '#25213d', indigo2: '#322c52', indigo3: '#473f70',
  parch: '#f5ebd2', parch2: '#e8dbb8', parch3: '#cdbb93', white: '#fff9ea',
  ink: '#2b2540', soft: '#6e6485', gold: '#d9ad55', goldHi: '#f3d68f', goldLo: '#9c7636',
  coral: '#db665a', coralHi: '#ee8f80', coralLo: '#a8453f', green: '#557d58', greenHi: '#7fb56a',
  lav: '#a89abf', lavLo: '#6f6490', sky: '#6cb6e8', skyLo: '#3f7fc0',
};
// older call sites still read these names
const UIC = { paper: PAL.parch, paper2: PAL.parch2, ink: PAL.ink, soft: PAL.soft, accent: PAL.coral, gold: PAL.gold, good: '#6fb86a', warn: '#e3b341', bad: PAL.coral };
const U = 2;

/* ---------- type ----------
   Display (pixel face): branding, headings, monster and place names, short labels.
   Body (rounded sans): dialogue, descriptions, numbers, anything read in a sentence. */
const F_DISPLAY = '"Jersey 20", "Trebuchet MS", Verdana, sans-serif';
const F_BODY = 'Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
let FONT_SCALE = 1; // the pixel face runs small, so it is scaled up once it has loaded
function setFont(g, size, o) {
  o = o || {};
  if (o.font === 'd') g.font = Math.round(size * FONT_SCALE) + 'px ' + F_DISPLAY;
  else g.font = (o.weight || (o.bold ? 800 : 700)) + ' ' + size + 'px ' + F_BODY;
  if ('letterSpacing' in g) g.letterSpacing = (o.track || 0) + 'px';
}
function text(g, str, x, y, o) {
  o = o || {};
  setFont(g, o.size || 13, o);
  g.textAlign = o.align || 'left'; g.textBaseline = 'top';
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x, y + 1); g.fillText(str, x + 1, y + 1); }
  g.fillStyle = o.color || PAL.ink; g.fillText(str, x, y);
}
function textW(g, str, size, o) { setFont(g, size, o); return g.measureText(str).width; }
function wrap(g, str, maxW, size, o) {
  setFont(g, size || 13, o);
  const out = [];
  for (const para of String(str).split('\n')) {
    let lineStr = '';
    for (const word of para.split(' ')) {
      const test = lineStr ? lineStr + ' ' + word : word;
      if (g.measureText(test).width > maxW && lineStr) { out.push(lineStr); lineStr = word; } else lineStr = test;
    }
    out.push(lineStr);
  }
  return out;
}
/* A heading in the display face with small gold diamonds either side. */
function heading(g, str, x, y, o) {
  o = o || {};
  text(g, str.toUpperCase(), x, y, { font: 'd', size: o.size || 12, color: o.color || PAL.lav, track: 1.5, align: o.align });
}

/* ---------- shapes ---------- */
function rrect(g, x, y, w, h, r, col) {
  g.fillStyle = col;
  if (!r) { g.fillRect(x, y, w, h); return; }
  g.fillRect(x + r, y, w - 2 * r, h); g.fillRect(x, y + r, w, h - 2 * r);
  if (r > U) g.fillRect(x + U, y + U, w - 2 * U, h - 2 * U);
}
/* kind: 'parch' (dialogue, light windows), 'dark' (windows on dark screens),
         'card' (list card), 'well' (inset for artwork). o.sel highlights, o.dim greys out. */
function panel(g, x, y, w, h, kind, o) {
  o = o || {};
  if (kind === 'parch') {
    rrect(g, x + 2, y + 4, w, h, 4, 'rgba(12,10,28,.38)');
    rrect(g, x, y, w, h, 4, PAL.night);
    rrect(g, x + 2, y + 2, w - 4, h - 4, 2, o.sel ? PAL.goldHi : PAL.gold);
    rrect(g, x + 4, y + 4, w - 8, h - 8, 2, o.fill || PAL.parch);
    g.fillStyle = PAL.white; g.fillRect(x + 6, y + 4, w - 12, 2);
    g.fillStyle = PAL.parch2; g.fillRect(x + 6, y + h - 8, w - 12, 4);
  } else if (kind === 'dark') {
    rrect(g, x + 2, y + 4, w, h, 4, 'rgba(8,6,20,.4)');
    rrect(g, x, y, w, h, 4, PAL.night);
    rrect(g, x + 2, y + 2, w - 4, h - 4, 2, o.sel ? PAL.gold : PAL.indigo3);
    rrect(g, x + 4, y + 4, w - 8, h - 8, 2, o.fill || PAL.indigo);
    g.fillStyle = PAL.indigo2; g.fillRect(x + 6, y + 4, w - 12, 2);
  } else if (kind === 'card') {
    rrect(g, x + 2, y + (o.sel ? 6 : 4), w, h, 4, 'rgba(8,6,20,.45)');
    rrect(g, x, y, w, h, 4, o.sel ? PAL.gold : PAL.night);
    if (o.sel) rrect(g, x + 2, y + 2, w - 4, h - 4, 2, PAL.goldHi);
    const inset = o.sel ? 4 : 2;
    rrect(g, x + inset, y + inset, w - inset * 2, h - inset * 2, 2, o.dim ? '#cfc7bd' : PAL.parch);
    g.fillStyle = o.dim ? '#b9b0a8' : PAL.parch2; g.fillRect(x + inset + 2, y + h - inset - 4, w - inset * 2 - 4, 4);
  } else if (kind === 'well') {
    rrect(g, x, y, w, h, 2, PAL.night);
    g.fillStyle = o.fill || PAL.indigo2; g.fillRect(x + 2, y + 2, w - 4, h - 4);
    // faint checker so artwork never sits on a flat fill
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let j = 0; j < h - 4; j += 8) for (let i = (j / 8 % 2) * 8; i < w - 4; i += 16) g.fillRect(x + 2 + i, y + 2 + j, Math.min(8, w - 4 - i), Math.min(8, h - 4 - j));
    g.fillStyle = 'rgba(12,10,28,.22)'; g.fillRect(x + 2, y + 2, w - 4, 2);
  }
}
const box = (g, x, y, w, h) => panel(g, x, y, w, h, 'parch');

/* Health-style bar. ghost (optional) is a second fraction drawn pale behind the fill: the damage trail. */
function bar(g, x, y, w, h, frac, col, ghost) {
  rrect(g, x, y, w, h, 2, PAL.night);
  g.fillStyle = '#4a4368'; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  const full = w - 4, fw = Math.max(frac > 0 ? 2 : 0, Math.round(full * clamp(frac, 0, 1) / 2) * 2);
  if (ghost !== undefined && ghost > frac) { g.fillStyle = PAL.white; g.fillRect(x + 2, y + 2, Math.round(full * clamp(ghost, 0, 1) / 2) * 2, h - 4); }
  g.fillStyle = col; g.fillRect(x + 2, y + 2, fw, h - 4);
  if (h >= 8) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, y + 2, fw, 2); }
}
function hpColor(f) { return f > 0.5 ? UIC.good : f > 0.2 ? UIC.warn : UIC.bad; }

/* ---------- pixel icons ---------- */
const ICON_PAL = { k: PAL.night, w: PAL.white, p: PAL.parch2, g: PAL.gold, G: PAL.goldLo, y: PAL.goldHi, r: PAL.coral, R: PAL.coralLo, n: PAL.greenHi, N: PAL.green, l: PAL.lav, L: PAL.lavLo, b: PAL.sky, B: PAL.skyLo, o: '#b9834f', O: '#7a5433', i: PAL.indigo3, s: '#c9d3de', S: '#8d98a8' };
const ICONS = {
  journal: ['.kkkkkk.', 'kRrrrrrk', 'kRrggrrk', 'kRrggrrk', 'kRrrrrrk', 'kRrrrrrk', 'kpwwwwwk', '.kkkkkk.'],
  team: ['.kk..kk.', 'knnkknnk', 'knnnnnnk', 'knkNNknk', 'knnnnnnk', 'knNwwNnk', '.knnnnk.', '..kkkk..'],
  bag: ['..kkkk..', '.ko..ok.', 'kkkkkkkk', 'koooooOk', 'kooggoOk', 'koooooOk', 'kOOOOOOk', '.kkkkkk.'],
  map: ['kkk..kkk', 'kwwkkwpk', 'kwnwwbpk', 'kwnnwbpk', 'kwwnwwrk', 'kwwwwrpk', 'kwkkkwpk', 'kk...kkk'],
  save: ['kkkkkkk.', 'kbwwwwkk', 'kbwwwwbk', 'kbbbbbbk', 'kbkkkkbk', 'kbkwwkbk', 'kbkwwkbk', 'kkkkkkkk'],
  close: ['........', '.kk..kk.', 'krrkkrrk', '.krrrrk.', '.krrrrk.', 'krrkkrrk', '.kk..kk.', '........'],
  fight: ['.....kkk', '....kwwk', '...kwwk.', 'kk.kwk..', 'kgkwk...', '.kgk....', 'kokgk...', 'kk.kk...'],
  run: ['kk..kk..', 'klk.klk.', '.klk.klk', '..klk.kl', '..klk.kl', '.klk.klk', 'klk.klk.', 'kk..kk..'],
  coin: ['..kkkk..', '.kyyyyk.', 'kygggggk', 'kygGGggk', 'kygGgggk', 'kygGGggk', '.kggggk.', '..kkkk..'],
  sigil: ['...kk...', '..kyyk..', '.kywggk.', 'kywggggk', 'kgggggGk', '.kgggGk.', '..kgGk..', '...kk...'],
  sigil0: ['...kk...', '..kiik..', '.kiiiik.', 'kiiiiiik', 'kiiiiiik', '.kiiiik.', '..kiik..', '...kk...'],
  star: ['...kk...', '..kyyk..', 'kkkyykkk', 'kyyggggk', '.kggggk.', '.kgggGk.', 'kgGkkGGk', 'kkk..kkk'],
  up: ['...kk...', '..kyyk..', '.kyggGk.', 'kyggggGk', 'kkkggkkk', '..kgGk..', '..kgGk..', '..kkkk..'],
  charm: ['..kkkk..', '.kk..kk.', '.k....k.', '..kyyk..', '.kywggk.', 'kyggggGk', '.kggGGk.', '..kkkk..'],
  charm2: ['..kkkk..', '.kk..kk.', '.k....k.', '..kwwk..', '.kwwssk.', 'kwssssSk', '.kssSSk.', '..kkkk..'],
  charm1: ['..kkkk..', '.kk..kk.', '.k....k.', '..kssk..', '.ksssSk.', 'ksSSSSSk', '.kSSSSk.', '..kkkk..'],
  tonic: ['...kk...', '..kook..', '..kwwk..', '.kwwwwk.', 'krrrrrrk', 'krwrrrRk', 'krrrrRRk', '.kkkkkk.'],
  cure: ['.....kkk', '...kknnk', '..knnnNk', '.knnnNNk', 'knnnNNk.', 'knNNNk..', 'kkNkk...', 'k.k.....'],
  revive: ['.kk..kk.', 'knnkknnk', '.knNNnk.', '..kook..', '.koOook.', '.kooOok.', '..kOOk..', '...kk...'],
  incense: ['...l....', '..l.l...', '....l...', '...l....', '.kkkkkk.', 'kllllllk', '.kLLLLk.', '..kkkk..'],
  rod: ['......kk', '.....kok', '....kok.', '...kok.w', '..kok..w', '.kok...w', 'kok...kb', 'kk....kk'],
  flame: ['...k....', '..krk...', '..krrk..', '.krrgrk.', 'krrgyrrk', 'krgywgrk', '.krgyrk.', '..kkkk..'],
  pin: ['..kkkk..', '.krrrrk.', 'krrwwrrk', 'krrwwrrk', '.krrrrk.', '..krrk..', '...kk...', '........'],
  clock: ['..kkkk..', '.kwwwwk.', 'kwwkwwwk', 'kwwkwwwk', 'kwwkkkwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'],
};
ICONS.elixir = ICONS.tonic; ICONS.key = ICONS.map;
function icon(g, name, x, y, s) {
  const rows = ICONS[name]; if (!rows) return; s = s || U;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) {
    const ch = rows[j][i]; if (ch === '.') continue;
    g.fillStyle = ICON_PAL[ch]; g.fillRect(x + i * s, y + j * s, s, s);
  }
}
function itemIcon(name) {
  const it = ITEMS[name];
  if (name === 'Fishing Rod') return 'rod'; if (name === 'Town Map') return 'map';
  if (it.kind === 'charm') return name === 'Gold Charm' ? 'charm' : name === 'Silver Charm' ? 'charm2' : 'charm1';
  return { heal: 'tonic', cure: 'cure', revive: 'revive', ward: 'incense' }[it.kind] || 'bag';
}

const TYPE_GLYPH = {
  Wild: ['#.#.#', '.....', '.###.', '#####', '.###.'], Flora: ['..###', '.####', '####.', '###..', '#....'], Ember: ['..#..', '.##..', '.###.', '#####', '.###.'],
  Tide: ['..#..', '.###.', '#####', '#####', '.###.'], Spark: ['...##', '..##.', '#####', '.##..', '##...'], Stone: ['.###.', '#####', '#####', '####.', '.##..'],
  Gale: ['.##..', '...#.', '####.', '.....', '###..'], Frost: ['#.#.#', '.###.', '#####', '.###.', '#.#.#'], Venom: ['.###.', '#.#.#', '#####', '.#.#.', '.#.#.'],
  Mind: ['.###.', '#...#', '#.#.#', '#...#', '.###.'], Shade: ['.###.', '##...', '#....', '##...', '.###.'], Iron: ['#####', '#####', '.###.', '.###.', '..#..'],
};
function typeGlyph(g, type, x, y, col) {
  const rows = TYPE_GLYPH[type]; g.fillStyle = col || '#fff';
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (rows[j][i] === '#') g.fillRect(x + i * 2, y + j * 2, 2, 2);
}
function typeChip(g, type, x, y, w) {
  w = w || 52; const c = TYPE_COLOR[type];
  rrect(g, x, y, w, 16, 2, PAL.night);
  g.fillStyle = c; g.fillRect(x + 2, y + 2, w - 4, 12);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + 2, y + 2, w - 4, 2);
  g.fillStyle = 'rgba(20,14,40,.22)'; g.fillRect(x + 2, y + 12, w - 4, 2);
  if (w >= 40) { typeGlyph(g, type, x + 5, y + 3, 'rgba(255,255,255,.92)'); text(g, type.toUpperCase(), x + 18, y + 2, { font: 'd', size: 10, color: '#fff', shadow: 'rgba(20,14,40,.45)', track: .5 }); }
  else typeGlyph(g, type, x + Math.floor(w / 2) - 5, y + 3, 'rgba(255,255,255,.95)');
}
function statusChip(g, st, x, y) {
  rrect(g, x, y, 30, 14, 2, PAL.night);
  g.fillStyle = STATUS_COLOR[st]; g.fillRect(x + 2, y + 2, 26, 10);
  text(g, STATUS_NAME[st], x + 15, y + 1, { font: 'd', size: 10, color: '#fff', align: 'center', shadow: 'rgba(20,14,40,.4)' });
}
function tag(g, str, x, y, bg, fg) {
  const w = Math.ceil(textW(g, str, 9, { font: 'd', track: 1 })) + 10;
  rrect(g, x, y, w, 14, 2, PAL.night); g.fillStyle = bg; g.fillRect(x + 2, y + 2, w - 4, 10);
  text(g, str, x + 5, y + 1, { font: 'd', size: 9, color: fg || '#fff', track: 1 });
  return w;
}
/* The animated selection arrow. */
function cursor(g, x, y, col) {
  const dx = Math.round(Math.sin(Game.t / 140)) * 2;
  g.fillStyle = PAL.night; g.fillRect(x + dx - 2, y - 2, 6, 14); g.fillRect(x + dx + 4, y, 2, 10); g.fillRect(x + dx + 6, y + 2, 2, 6);
  g.fillStyle = col || PAL.coral; g.fillRect(x + dx, y, 2, 10); g.fillRect(x + dx + 2, y + 2, 2, 6); g.fillRect(x + dx + 4, y + 4, 2, 2);
}
/* Row highlight used by every list. */
function selRow(g, x, y, w, h) {
  g.fillStyle = PAL.parch2; g.fillRect(x, y, w, h);
  g.fillStyle = PAL.gold; g.fillRect(x, y, 4, h);
  g.fillStyle = 'rgba(217,173,85,' + (0.16 + 0.08 * Math.sin(Game.t / 220)) + ')'; g.fillRect(x + 4, y, w - 4, h);
}

/* ---------- key hints ---------- */
function keyCap(g, k, x, y) {
  const col = k === 'A' ? PAL.coral : k === 'B' ? PAL.lavLo : PAL.indigo3;
  rrect(g, x, y, 14, 14, 2, PAL.night); rrect(g, x + 2, y + 2, 10, 10, 2, col); g.fillStyle = col; g.fillRect(x + 2, y + 2, 10, 10);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, y + 2, 10, 2);
  text(g, k, x + 7, y + 1, { font: 'd', size: 10, color: '#fff', align: 'center' });
}
/* hints: [['A','Choose'],['B','Back']] drawn right-aligned ending at x. */
function hintRow(g, hints, x, y) {
  for (let i = hints.length - 1; i >= 0; i--) {
    const [k, label] = hints[i], w = textW(g, label, 11, { weight: 700 });
    text(g, label, x - w, y + 1, { size: 11, color: PAL.lav });
    x -= w + 18; keyCap(g, k, x, y); x -= 12;
  }
}
/* Full-screen menu chrome: night backdrop, title band, hint strip. */
function screenFrame(g, title, hints, right) {
  g.fillStyle = PAL.night; g.fillRect(0, 0, VW, VH);
  g.fillStyle = PAL.night2;
  for (let y = 40; y < VH - 20; y += 16) for (let x = ((y / 16) % 2) * 8; x < VW; x += 16) g.fillRect(x, y, 2, 2);
  g.fillStyle = PAL.indigo; g.fillRect(0, 0, VW, 30);
  g.fillStyle = PAL.indigo2; g.fillRect(0, 26, VW, 4);
  g.fillStyle = PAL.gold; g.fillRect(0, 30, VW, 2);
  g.fillStyle = PAL.goldLo; g.fillRect(0, 32, VW, 2);
  icon(g, 'sigil', 8, 7, 2);
  text(g, title.toUpperCase(), 30, 4, { font: 'd', size: 19, color: PAL.parch, shadow: PAL.night, track: 1.5 });
  if (right) right(g);
  g.fillStyle = PAL.indigo; g.fillRect(0, VH - 20, VW, 20);
  g.fillStyle = PAL.indigo3; g.fillRect(0, VH - 20, VW, 2);
  if (hints) hintRow(g, hints, VW - 10, VH - 16);
}
function coinsChip(g, x, y) {
  const s = String(S.coins), w = Math.ceil(textW(g, s, 12, { weight: 800 })) + 30;
  rrect(g, x - w, y, w, 20, 2, PAL.night); g.fillStyle = PAL.indigo2; g.fillRect(x - w + 2, y + 2, w - 4, 16);
  icon(g, 'coin', x - w + 4, y + 2, 2); text(g, s, x - 6, y + 3, { size: 12, weight: 800, color: PAL.goldHi, align: 'right' });
}
/* Monster art at pixel-true sizes: 32 (icon), 64, 128, 192. */
function drawMon(g, id, x, y, size, flip, sil) {
  const src = size <= 32 ? Sprites.icon(id) : sil ? Sprites.silhouette(id) : flip ? Sprites.monFlip(id) : Sprites.mon(id);
  g.drawImage(src, Math.round(x), Math.round(y), size, size);
}
