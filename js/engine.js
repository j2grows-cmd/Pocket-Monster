'use strict';
/* Canvas, main loop, input, tweens and the small UI toolkit everything else is built on. */
const FONT = '"Jersey 20", "Trebuchet MS", Verdana, sans-serif';
let FONT_SCALE = 1; // the pixel face runs small, so it is scaled up once it has loaded
const UIC = { paper: '#f8f1dc', paper2: '#eadfbe', ink: '#2b2540', soft: '#7a7090', accent: '#d8483a', gold: '#e0a82e', good: '#4caf50', warn: '#e6bd22', bad: '#d8483a' };

const Game = { canvas: null, g: null, scale: 1, scene: 'title', ui: [], tweens: [], timers: [], t: 0, busy: false, fadeA: 0, flash: 0 };
const Input = { held: {} };
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Enter: 'a', Space: 'a', KeyX: 'b', Escape: 'b', Backspace: 'b', ShiftLeft: 'b', ShiftRight: 'b', KeyM: 'start', Tab: 'start', KeyP: 'start',
};

function dispatch(k) {
  const top = Game.ui[Game.ui.length - 1];
  if (top) { if (top.key) top.key(k); }
  else if (Msg.visible && Msg.resolve) Msg.key(k);
  else if (Game.scene === 'world' && !Game.busy) World.key(k);
}
function press(k) { Input.held[k] = true; if (k === 'up' || k === 'down' || k === 'left' || k === 'right') Input.lastDir = k; dispatch(k); }
function release(k) { Input.held[k] = false; }

/* ---------- timing ---------- */
function tween(obj, key, to, ms, ease) {
  return new Promise(res => Game.tweens.push({ obj, key, from: obj[key], to, ms, t: 0, ease: ease || (x => x), res }));
}
function wait(ms) { return new Promise(res => Game.timers.push({ t: ms, res })); }
async function fadeOut(ms) { await tween(Game, 'fadeA', 1, ms || 160); }
async function fadeIn(ms) { await tween(Game, 'fadeA', 0, ms || 160); }

/* ---------- drawing helpers ---------- */
function setFont(g, size) { g.font = Math.round(size * FONT_SCALE) + 'px ' + FONT; }
function text(g, str, x, y, o) {
  o = o || {};
  setFont(g, o.size || 16, o.bold);
  g.textAlign = o.align || 'left'; g.textBaseline = 'top';
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(str, x + 1, y + 1); }
  g.fillStyle = o.color || UIC.ink; g.fillText(str, x, y);
}
function wrap(g, str, maxW, size) {
  setFont(g, size || 16);
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
function box(g, x, y, w, h, o) {
  o = o || {};
  g.fillStyle = 'rgba(20,14,40,.35)'; g.fillRect(x + 3, y + 3, w, h);
  g.fillStyle = UIC.ink; g.fillRect(x, y, w, h);
  g.fillStyle = o.fill || UIC.paper; g.fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle = o.trim || UIC.paper2; g.fillRect(x + 3, y + h - 7, w - 6, 4);
}
function bar(g, x, y, w, h, frac, col) {
  g.fillStyle = UIC.ink; g.fillRect(x, y, w, h);
  g.fillStyle = '#5a5470'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = col; g.fillRect(x + 1, y + 1, Math.max(0, Math.round((w - 2) * clamp(frac, 0, 1))), h - 2);
}
function hpColor(f) { return f > 0.5 ? UIC.good : f > 0.2 ? UIC.warn : UIC.bad; }
function typeChip(g, type, x, y) {
  g.fillStyle = UIC.ink; g.fillRect(x, y, 52, 16);
  g.fillStyle = TYPE_COLOR[type]; g.fillRect(x + 1, y + 1, 50, 14);
  text(g, type.toUpperCase(), x + 26, y + 2, { size: 11, bold: true, align: 'center', color: '#fff', shadow: 'rgba(0,0,0,.45)' });
}
function drawMon(g, id, x, y, size, flip, sil) {
  g.drawImage(sil ? Sprites.silhouette(id) : flip ? Sprites.monFlip(id) : Sprites.mon(id), x, y, size, size);
}

/* ---------- message box ---------- */
const Msg = {
  visible: false, pages: [], page: 0, chars: 0, resolve: null, auto: 0, hold: 0,
  say(str, auto) {
    const g = Game.g; const lines = wrap(g, str, VW - 52, 16);
    this.pages = []; for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    this.page = 0; this.chars = 0; this.visible = true; this.auto = auto || 0; this.hold = 0;
    return new Promise(res => { this.resolve = res; });
  },
  set(str) { const lines = wrap(Game.g, str, VW - 52, 16); this.pages = [lines.slice(0, 3)]; this.page = 0; this.chars = 999; this.visible = true; this.resolve = null; },
  total() { return this.pages[this.page].join('\n').length; },
  key(k) {
    if (k !== 'a' && k !== 'b') return;
    if (this.chars < this.total()) { this.chars = this.total(); return; }
    this.next();
  },
  next() {
    if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; this.hold = 0; return; }
    const r = this.resolve; this.resolve = null; if (r) r();
  },
  update(dt) {
    if (!this.visible || !this.resolve) return;
    if (this.chars < this.total()) this.chars += dt * 0.09 * (Input.held.a || Input.held.b ? 3 : 1);
    else if (this.auto) { this.hold += dt; if (this.hold >= this.auto) this.next(); }
  },
  hide() { this.visible = false; this.resolve = null; },
  draw(g) {
    if (!this.visible) return;
    box(g, 6, VH - 88, VW - 12, 82);
    let n = Math.floor(this.chars);
    (this.pages[this.page] || []).forEach((ln, i) => { const s = ln.slice(0, Math.max(0, n)); n -= ln.length + 1; text(g, s, 22, VH - 76 + i * 21); });
    if (this.resolve && !this.auto && this.chars >= this.total() && Math.floor(Game.t / 300) % 2) { g.fillStyle = UIC.accent; g.beginPath(); g.moveTo(VW - 30, VH - 26); g.lineTo(VW - 18, VH - 26); g.lineTo(VW - 24, VH - 18); g.fill(); }
  },
};
const say = (s, auto) => Msg.say(s, auto);

/* ---------- layers ---------- */
function layer(def) {
  return new Promise(res => {
    const L = { draw: def.draw, update: def.update };
    const done = v => { const i = Game.ui.indexOf(L); if (i >= 0) Game.ui.splice(i, 1); res(v); };
    L.key = k => def.key && def.key(k, done);
    if (def.init) def.init(done);
    Game.ui.push(L);
  });
}

/* A vertical (or grid) list menu. Resolves to the chosen index, or -1 if cancelled. */
function choose(options, o) {
  o = o || {};
  const cols = o.cols || 1, rowH = o.rowH || 24, maxRows = o.rows || 8;
  const g = Game.g; setFont(g, 16);
  const labelOf = v => typeof v === 'string' ? v : v.label;
  let w = o.w;
  if (!w) { w = 0; for (const v of options) w = Math.max(w, g.measureText(labelOf(v)).width + (v.right ? g.measureText(v.right).width + 24 : 0)); w = (w + 44) * cols; }
  const rowsTotal = Math.ceil(options.length / cols), rows = Math.min(maxRows, rowsTotal), h = rows * rowH + 20;
  const x = o.x !== undefined ? o.x : VW - w - 8, y = o.y !== undefined ? o.y : VH - 92 - h;
  let sel = o.start || 0, top = 0;
  const fix = () => { const r = Math.floor(sel / cols); if (r < top) top = r; if (r >= top + rows) top = r - rows + 1; if (o.onMove) o.onMove(sel); };
  fix();
  return layer({
    draw(g) {
      box(g, x, y, w, h);
      const cw = (w - 16) / cols;
      for (let i = top * cols; i < Math.min(options.length, (top + rows) * cols); i++) {
        const v = options[i], cx = x + 10 + (i % cols) * cw, cy = y + 10 + (Math.floor(i / cols) - top) * rowH;
        if (i === sel) { g.fillStyle = UIC.accent; g.beginPath(); g.moveTo(cx, cy + 3); g.lineTo(cx + 8, cy + 9); g.lineTo(cx, cy + 15); g.fill(); }
        text(g, labelOf(v), cx + 14, cy, { color: v.disabled ? UIC.soft : UIC.ink, bold: i === sel });
        if (v.right) text(g, v.right, cx + cw - 8, cy, { align: 'right', color: UIC.soft });
      }
      if (rowsTotal > rows) { g.fillStyle = UIC.soft; if (top > 0) g.fillRect(x + w - 12, y + 8, 4, 4); if (top + rows < rowsTotal) g.fillRect(x + w - 12, y + h - 14, 4, 4); }
    },
    key(k, done) {
      const n = options.length;
      if (k === 'up') sel = (sel - cols + n) % n; else if (k === 'down') sel = (sel + cols) % n;
      else if (k === 'left' && cols > 1) sel = (sel - 1 + n) % n; else if (k === 'right' && cols > 1) sel = (sel + 1) % n;
      else if (k === 'a') { if (!options[sel].disabled) return done(sel); }
      else if (k === 'b' && o.cancel !== false) return done(-1);
      if (sel >= n) sel = n - 1;
      fix();
    },
  });
}
async function confirmBox(question) {
  Msg.set(question);
  const r = await choose(['Yes', 'No'], { w: 90 });
  return r === 0;
}

/* ---------- boot / loop ---------- */
function resizeCanvas() {
  const c = Game.canvas, stage = c.parentElement;
  const availW = stage.clientWidth, availH = stage.clientHeight;
  const cssW = Math.max(160, Math.floor(Math.min(availW, availH * VW / VH)));
  const cssH = Math.floor(cssW * VH / VW);
  c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr);
  Game.scale = c.width / VW;
}
function frame(now) {
  const dt = Math.min(50, now - (Game.last || now)); Game.last = now; Game.t += dt;
  if (S && Game.scene !== 'title') S.time += dt;
  for (let i = Game.tweens.length - 1; i >= 0; i--) {
    const tw = Game.tweens[i]; tw.t += dt; const p = Math.min(1, tw.t / tw.ms);
    tw.obj[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(p);
    if (p >= 1) { Game.tweens.splice(i, 1); tw.res(); }
  }
  for (let i = Game.timers.length - 1; i >= 0; i--) { const tm = Game.timers[i]; tm.t -= dt; if (tm.t <= 0) { Game.timers.splice(i, 1); tm.res(); } }
  Msg.update(dt);
  for (const L of Game.ui) if (L.update) L.update(dt);
  if (Game.scene === 'world') World.update(dt);
  const g = Game.g;
  g.setTransform(Game.scale, 0, 0, Game.scale, 0, 0); g.imageSmoothingEnabled = false;
  g.fillStyle = '#14121c'; g.fillRect(0, 0, VW, VH);
  if (Game.scene === 'world') World.draw(g); else if (Game.scene === 'battle') Battle.draw(g); else if (Game.scene === 'title') Title.draw(g);
  Msg.draw(g);
  for (const L of Game.ui) if (L.draw) L.draw(g);
  if (Game.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Game.flash + ')'; g.fillRect(0, 0, VW, VH); }
  if (Game.fadeA > 0) { g.fillStyle = 'rgba(12,10,20,' + Game.fadeA + ')'; g.fillRect(0, 0, VW, VH); }
  requestAnimationFrame(frame);
}
function bootEngine() {
  Game.canvas = document.getElementById('game'); Game.g = Game.canvas.getContext('2d');
  resizeCanvas(); window.addEventListener('resize', resizeCanvas);
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(Game.canvas.parentElement);
  window.addEventListener('keydown', e => {
    const k = KEYMAP[e.code]; if (!k) return;
    e.preventDefault(); press(k);
  });
  window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) release(k); });
  window.addEventListener('blur', () => { Input.held = {}; });
  // touch pad
  document.querySelectorAll('[data-k]').forEach(btn => {
    const k = btn.dataset.k; let rep = null;
    const up = () => { release(k); btn.classList.remove('on'); clearTimeout(rep); clearInterval(rep); rep = null; };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); btn.classList.add('on'); press(k);
      if (['up', 'down', 'left', 'right'].includes(k)) rep = setTimeout(() => { rep = setInterval(() => { if (Game.ui.length) dispatch(k); }, 110); }, 320);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, up));
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  requestAnimationFrame(frame);
}
