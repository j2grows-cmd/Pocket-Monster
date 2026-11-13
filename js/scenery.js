'use strict';
/* Painted scenery and atmosphere: battle backdrops, the title landscape, ambient particles,
   the day and night cycle, and the dithered vignette. All of it is drawn at the same pixel size as the world. */

const Scenery = {
  _bg: {}, _title: null, _vig: null, _cloud: null,

  /* ---- shared painters ---- */
  _sky(p, bands, horizon) {
    const hts = [.30, .24, .19, .15, .12]; let y = 0;
    bands.forEach((c, i) => {
      const h = i === bands.length - 1 ? horizon - y : Math.round(horizon * hts[i]);
      p(0, y, 240, h, c);
      if (i) for (let x = (i % 2); x < 240; x += 2) p(x, y, 1, 1, bands[i - 1]); // one dithered row between bands
      y += h;
    });
  },
  _ridge(p, r, base, amp, col, opt) {
    opt = opt || {}; const a = r() * 6, b = r() * 6, c = r() * 6, tops = [];
    for (let x = 0; x < 240; x++) {
      let h = Math.sin(x / 31 + a) * .5 + Math.sin(x / 13 + b) * .3 + Math.sin(x / 7 + c) * .2;
      if (opt.peaks) h = 1 - Math.abs(Math.sin(x / (opt.peaks) + a)) * 1.6 + Math.sin(x / 9 + b) * .15;
      const y = Math.round(base - (h * .5 + .5) * amp); tops.push(y);
      p(x, y, 1, opt.to - y, col);
      if (opt.cap && y < base - amp * .55) p(x, y, 1, Math.min(4, Math.max(1, Math.round((base - amp * .55 - y) * .6))), opt.cap);
      if (opt.rim) p(x, y, 1, 1, opt.rim);
    }
    return tops;
  },
  _pines(p, r, y, col, n, hMin, hMax) {
    for (let i = 0; i < n; i++) { const x = Math.floor(r() * 240), h = hMin + Math.floor(r() * (hMax - hMin)); for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round(k / h * (h * .45))); p(x - w, y - h + k, w * 2 + 1, 1, col); } }
  },
  _cloudShape(p, x, y, s, col, shade2) {
    p(x + 2 * s, y, 6 * s, 2 * s, col); p(x, y + 1 * s, 11 * s, 2 * s, col); p(x + 7 * s, y - 1 * s, 3 * s, 2 * s, col);
    if (shade2) p(x + 1 * s, y + 2 * s + s - 1, 9 * s, 1, shade2);
  },
  _platform(p, cx, cy, rx, ry, top, rim, shadow) {
    const ell = (oy, rx2, ry2, col) => { for (let y = -ry2; y <= ry2; y++) { const w = Math.round(rx2 * Math.sqrt(1 - (y * y) / (ry2 * ry2))); if (w > 0) p(cx - w, cy + oy + y, w * 2, 1, col); } };
    ell(3, rx, ry, shadow); ell(1, rx, ry, rim); ell(-1, rx, ry, top); ell(-3, Math.round(rx * .7), Math.round(ry * .45), 'rgba(255,255,255,.16)');
  },

  /* ---- battle backdrops: one per biome, plus an interior hall (-1) ---- */
  backdrop(bio) {
    if (this._bg[bio]) return this._bg[bio];
    const c = makeCanvas(240, 160), g = c.getContext('2d'), r = mulberry32(900 + bio * 31);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const H = 72; // horizon
    const D = {
      0: { sky: ['#7cc4ec', '#97d1f0', '#b6e0f1', '#d5eee6', '#edf5d6'], gr: ['#79b860', '#68a653', '#90cc74'] },
      1: { sky: ['#86b8e0', '#a3cae8', '#c2dcee', '#deeaee', '#efead6'], gr: ['#b8a987', '#a69877', '#cbbd9b'] },
      2: { sky: ['#2a1c30', '#472438', '#6e2f3a', '#9c4238', '#c8603a'], gr: ['#584c54', '#4a4048', '#6a5d66'] },
      3: { sky: ['#1f2a44', '#27395a', '#30506a', '#3f6b72', '#5a8a7a'], gr: ['#4b7355', '#40664b', '#598566'] },
      4: { sky: ['#a8cdea', '#bfdcf0', '#d6e9f5', '#e9f3f8', '#f8fbfc'], gr: ['#e6eef4', '#d2e0ea', '#f9fdff'] },
      5: { sky: ['#6fc0ec', '#8fd0f0', '#b3e0f2', '#d9eee4', '#f6ecc6'], gr: ['#ecd9a3', '#dcc88c', '#f6e9bd'] },
      '-1': { sky: ['#322c52', '#3a335e', '#423a68', '#473f70', '#4f4678'], gr: ['#8f8ca0', '#75728a', '#a09db2'] },
    }[bio] || null;
    const d = D || { sky: ['#7cc4ec', '#97d1f0', '#b6e0f1', '#d5eee6', '#edf5d6'], gr: ['#79b860', '#68a653', '#90cc74'] };
    this._sky(p, d.sky, H);
    if (bio === 0) {
      this._cloudShape(p, 20, 14, 2, '#fbfdf6', '#d5eee6'); this._cloudShape(p, 120, 26, 3, '#fbfdf6', '#d5eee6'); this._cloudShape(p, 196, 10, 2, '#fbfdf6', '#d5eee6');
      this._ridge(p, r, H, 20, '#9bcf98', { to: H }); this._ridge(p, r, H + 2, 12, '#73b56c', { to: H + 2, rim: '#86c47e' }); this._pines(p, r, H + 1, '#4f9454', 16, 6, 12);
    } else if (bio === 1) {
      this._cloudShape(p, 150, 12, 3, '#f6f8f4', '#deeaee'); this._cloudShape(p, 30, 24, 2, '#f6f8f4', '#deeaee');
      this._ridge(p, r, H, 46, '#a7a2bc', { to: H, peaks: 38, cap: '#f4f6fa' }); this._ridge(p, r, H + 2, 24, '#8f8672', { to: H + 2, peaks: 23, rim: '#a69c86' });
    } else if (bio === 2) {
      for (let i = 0; i < 26; i++) p(r() * 240, r() * 40, 1, 1, '#c8603a');
      // a volcano with a lit crater
      for (let x = 60; x < 190; x++) { const t = Math.abs(x - 125) / 65, y = Math.round(H - (1 - t) * 50 + (t < .12 ? 6 : 0)); p(x, y, 1, H - y, '#30232e'); if (t < .12) p(x, y, 1, 2, '#f1a04a'); }
      p(119, 16, 12, 4, '#db665a'); p(116, 10, 8, 6, '#6e2f3a'); p(124, 4, 10, 7, '#56283a'); p(112, 0, 9, 9, '#472438');
      for (let i = 0; i < 5; i++) p(122 + i * 3 - 6, 26 + i * 8, 2, 8, '#db665a');
      this._ridge(p, r, H + 2, 16, '#3c3038', { to: H + 2, peaks: 19 });
    } else if (bio === 3) {
      for (let i = 0; i < 40; i++) p(r() * 240, r() * 36, 1, 1, i % 4 ? '#b9c8e0' : '#fff9ea');
      for (let y = -7; y <= 7; y++) { const w = Math.round(Math.sqrt(49 - y * y)); p(186 - w, 20 + y, w * 2, 1, '#f5ebd2'); } p(183, 16, 3, 3, '#d9cfb4'); p(189, 22, 2, 2, '#d9cfb4');
      this._ridge(p, r, H, 14, '#2c5a55', { to: H }); this._pines(p, r, H + 1, '#234f3c', 26, 12, 26); this._pines(p, r, H + 2, '#1a3d30', 18, 8, 16);
    } else if (bio === 4) {
      this._cloudShape(p, 40, 10, 3, '#ffffff', '#d6e9f5');
      this._ridge(p, r, H, 48, '#c3d4e4', { to: H, peaks: 44, cap: '#ffffff' }); this._ridge(p, r, H + 2, 22, '#a9c0d4', { to: H + 2, peaks: 21, cap: '#f4fbff' }); this._pines(p, r, H + 2, '#5f8f8a', 12, 8, 14);
    } else if (bio === 5) {
      for (let y = -9; y <= 9; y++) { const w = Math.round(Math.sqrt(81 - y * y)); p(60 - w, 30 + y, w * 2, 1, '#fff3c4'); }
      this._cloudShape(p, 130, 14, 3, '#fbfdf6', '#d9eee4'); this._cloudShape(p, 200, 30, 2, '#fbfdf6', '#d9eee4');
      p(0, H - 14, 240, 16, '#4a90d6'); p(0, H - 14, 240, 1, '#86c1ee');
      for (let i = 0; i < 40; i++) { const y = H - 12 + Math.floor(r() * 12); p(r() * 240, y, 3 + r() * 6, 1, i % 3 ? '#86c1ee' : '#eaf8ff'); }
      p(0, H, 240, 2, '#eaf8ff');
    } else { // a lamplit hall
      for (let x = 0; x < 240; x += 40) { p(x + 4, 0, 6, H, '#3a335e'); p(x + 4, 0, 1, H, '#554c86'); p(x + 2, H - 6, 10, 6, '#322c52'); }
      for (let x = 24; x < 240; x += 80) { p(x, 6, 16, 34, '#a8453f'); p(x, 6, 16, 2, '#d9ad55'); p(x + 6, 16, 4, 4, '#d9ad55'); p(x, 38, 6, 4, '#a8453f'); p(x + 10, 38, 6, 4, '#a8453f'); }
      for (let x = 64; x < 240; x += 80) { p(x, 14, 14, 22, '#25213d'); p(x + 2, 16, 10, 18, '#6f8fc0'); p(x + 6, 16, 2, 18, '#25213d'); p(x + 2, 24, 10, 2, '#25213d'); }
      p(0, H - 2, 240, 2, '#25213d');
    }
    // ground: bands that widen toward the viewer, then scattered texture
    p(0, H, 240, 160 - H, d.gr[0]);
    for (let i = 0, y = H + 3; y < 160; i++, y += 3 + i * 2) p(0, y, 240, 1 + (i > 2 ? 1 : 0), d.gr[1]);
    for (let i = 0; i < 150; i++) { const t = r() * r(), y = H + 2 + t * (158 - H), s = 1 + Math.floor((y - H) / 30); p(r() * 240, y, s * 2, 1, i % 3 ? d.gr[1] : d.gr[2]); }
    if (bio === -1) for (let y = H + 6, i = 0; y < 160; y += 8 + i * 3, i++) for (let x = (i % 2) * 20; x < 240; x += 40) p(x, y, 2, 6 + i * 3, d.gr[1]);
    if (bio === 0 || bio === 3) for (let i = 0; i < 18; i++) { const y = H + 6 + r() * 80, x = r() * 240; p(x, y, 1, 3, d.gr[1]); p(x + 1, y - 1, 1, 4, d.gr[2]); p(x + 2, y, 1, 3, d.gr[1]); }
    const rim = shade(d.gr[1], -.22), top = shade(d.gr[0], bio === 4 ? -.06 : .1), sh = shade(d.gr[1], -.34);
    this._platform(p, 197, 77, 46, 8, top, rim, sh); this._platform(p, 52, 108, 54, 11, top, rim, sh);
    return this._bg[bio] = c;
  },

  /* ---- title landscape ---- */
  title() {
    if (this._title) return this._title;
    const c = makeCanvas(240, 160), g = c.getContext('2d'), r = mulberry32(4242);
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const bands = ['#171629', '#1e1b35', '#25213d', '#3a2f62', '#5e4480', '#94567e', '#cf7a6c', '#eeb074'], hts = [16, 14, 14, 16, 16, 14, 12, 10];
    let y = 0; bands.forEach((col, i) => { p(0, y, 240, hts[i], col); if (i) for (let x = i % 2; x < 240; x += 2) p(x, y, 1, 1, bands[i - 1]); y += hts[i]; });
    for (let i = 0; i < 60; i++) p(r() * 240, r() * 62, 1, 1, i % 5 ? '#a89abf' : '#fff9ea');
    for (let yy = -9; yy <= 9; yy++) { const w = Math.round(Math.sqrt(81 - yy * yy)); p(212 - w, 74 + yy, w * 2, 1, '#f5ebd2'); } p(207, 69, 4, 4, '#dfd3b4'); p(215, 77, 3, 3, '#dfd3b4'); p(209, 79, 2, 2, '#dfd3b4');
    this._cloudShape(p, 30, 70, 3, '#b36a86'); this._cloudShape(p, 150, 82, 2, '#d98e7a'); this._cloudShape(p, 96, 58, 2, '#7a5290');
    this._ridge(p, r, 118, 44, '#4a3a72', { to: 160, peaks: 47, cap: '#8f7ab0' });
    this._ridge(p, r, 124, 30, '#372d5c', { to: 160, peaks: 29, rim: '#473f70' });
    this._ridge(p, r, 132, 16, '#25213d', { to: 160 });
    this._pines(p, r, 134, '#1e1b35', 30, 6, 16);
    p(0, 132, 240, 28, '#171629');
    // a far-off town: a few lit windows
    for (let i = 0; i < 9; i++) { const x = 30 + i * 4 + Math.floor(r() * 3); p(x, 121 - (i % 3), 3, 3, '#25213d'); p(x + 1, 122 - (i % 3), 1, 1, '#f3d68f'); }
    return this._title = c;
  },

  /* ---- ordered-dither vignette, drawn over the world ---- */
  vignette() {
    if (this._vig) return this._vig;
    const c = makeCanvas(240, 160), g = c.getContext('2d'), M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    g.fillStyle = 'rgba(23,22,41,.26)';
    for (let y = 0; y < 160; y++) for (let x = 0; x < 240; x++) {
      const dx = (x - 119.5) / 120, dy = (y - 79.5) / 80, v = (dx * dx + dy * dy - 1.02) * 1.5;
      if (v > (M[(y & 3) * 4 + (x & 3)] + .5) / 16) g.fillRect(x, y, 1, 1);
    }
    return this._vig = c;
  },
  cloud() {
    if (this._cloud) return this._cloud;
    const c = makeCanvas(48, 24), g = c.getContext('2d'); g.fillStyle = '#171629';
    [[10, 6, 22, 14], [4, 10, 40, 8], [20, 2, 18, 8], [30, 8, 14, 12]].forEach(([x, y, w, h]) => { g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); });
    return this._cloud = c;
  },

  /* ---- daylight: one full day every ten minutes of play ---- */
  light() {
    const c = ((S.time || 0) / 1000 % 600) / 600;
    const K = [[0, 255, 255, 255, 0], [.5, 255, 255, 255, 0], [.58, 255, 216, 180, .12], [.66, 152, 152, 214, 1], [.88, 152, 152, 214, 1], [.95, 255, 226, 216, .1], [1, 255, 255, 255, 0]];
    let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1], t = clamp((c - a[0]) / (b[0] - a[0]), 0, 1);
    return { r: Math.round(lerp(a[1], b[1], t)), g: Math.round(lerp(a[2], b[2], t)), b: Math.round(lerp(a[3], b[3], t)), night: lerp(a[4], b[4], t) };
  },

  /* ---- ambient life over the world: pollen, fireflies, embers, snow ---- */
  ambient(b, bio, camX, camY, night, noClouds) {
    const t = Game.t, W = VW + 40, H = VH + 40;
    const R = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    const put = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect((Math.floor((((x - camX) % W) + W) % W - 20) >> 1) << 1, (Math.floor((((y - camY) % H) + H) % H - 20) >> 1) << 1, w, h); };
    if (!noClouds && (bio === 0 || bio === 1 || bio === 5) && night < .5) { // slow cloud shadows
      b.globalAlpha = .07 * (1 - night * 2); b.imageSmoothingEnabled = false;
      for (let i = 0; i < 3; i++) { const x = ((R(i, 1) * 900 + t * .012 - camX * 1) % 900 + 900) % 900 - 220, y = ((R(i, 2) * 700 - camY) % 700 + 700) % 700 - 160; b.drawImage(this.cloud(), Math.round(x / 4) * 4, Math.round(y / 4) * 4, 192, 96); }
      b.globalAlpha = 1;
    }
    if (bio === 4) for (let i = 0; i < 44; i++) put(R(i, 1) * W + Math.sin(t / 900 + i) * 10 + t * .012, R(i, 2) * H + t * (.03 + R(i, 3) * .03), 2, 2, i % 3 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.55)');
    else if (bio === 2) for (let i = 0; i < 18; i++) { const a = .5 + .5 * Math.sin(t / 180 + i * 2); put(R(i, 1) * W + Math.sin(t / 600 + i) * 14, R(i, 2) * H - t * (.02 + R(i, 3) * .03), 2, 2, 'rgba(' + (i % 2 ? '241,160,74,' : '219,102,90,') + (.35 + a * .6) + ')'); }
    else if (bio === 3 || ((bio === 0 || bio === 5) && night > .5)) for (let i = 0; i < 14; i++) { const a = Math.max(0, Math.sin(t / 420 + i * 1.7)); if (a > .15) put(R(i, 1) * W + Math.sin(t / 1300 + i * 3) * 26, R(i, 2) * H + Math.cos(t / 1700 + i) * 18, 2, 2, 'rgba(226,245,154,' + a + ')'); }
    else if (bio === 0 || bio === 5) for (let i = 0; i < 9; i++) put(R(i, 1) * W + t * .008 + Math.sin(t / 800 + i) * 8, R(i, 2) * H - t * .005 + Math.cos(t / 1100 + i) * 6, 2, 2, 'rgba(255,249,220,' + (.45 + .3 * Math.sin(t / 500 + i)) + ')');
    else if (bio === 1) for (let i = 0; i < 6; i++) put(R(i, 1) * W + t * .03, R(i, 2) * H + Math.sin(t / 1400 + i) * 8, 8, 2, 'rgba(255,255,255,.28)');
  },
};
