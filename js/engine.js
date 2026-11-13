'use strict';
/* Canvas, main loop, input, tweens, the dialogue box and the menu primitives. Drawing helpers live in ui.js. */
const Game = { canvas: null, g: null, scale: 1, scene: 'title', ui: [], tweens: [], timers: [], t: 0, dt: 16, busy: false, fadeA: 0, flash: 0, compact: false };
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

/* ---------- dialogue box ----------
   Lines that start "Name: " get a name plate, and a portrait when we know the speaker's face. */
const SPEAKERS = { 'Sage Maren': 'sage', 'Corvin': 'rival', 'Rival Corvin': 'rival', 'Road Warden': 'guard' };
const Msg = {
  visible: false, pages: [], page: 0, chars: 0, resolve: null, auto: 0, hold: 0, ctx: null, who: null, face: null,
  layout(str) {
    let who = null, face = null; const c = this.ctx;
    const m = /^([A-Z][A-Za-z' ]{1,24}): /.exec(str);
    if (m) { const pal = SPEAKERS[m[1]] || (c && c.name === m[1] && c.pal); if (pal) { who = m[1]; face = pal; str = str.slice(m[0].length); } }
    else if (c && c.pal && (['talk', 'heal', 'shop', 'paddock'].includes(c.kind) || (c.kind === 'gift' && (str === c.text || str === c.after)))) face = c.pal;
    this.who = who; this.face = face;
    return wrap(Game.g, str, VW - 46 - (face ? 62 : 0), 14);
  },
  say(str, auto) {
    const lines = this.layout(str);
    this.pages = []; for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    this.page = 0; this.chars = 0; this.visible = true; this.auto = auto || 0; this.hold = 0;
    return new Promise(res => { this.resolve = res; });
  },
  set(str) { const lines = this.layout(str); this.pages = [lines.slice(0, 3)]; this.page = 0; this.chars = 999; this.visible = true; this.resolve = null; },
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
    const x = 6, y = VH - 84, w = VW - 12, h = 78;
    panel(g, x, y, w, h, 'parch');
    let tx = x + 18;
    if (this.face) {
      panel(g, x + 10, y + 10, 58, 58, 'well', { fill: PAL.indigo2 });
      g.drawImage(Sprites.portrait(this.face), x + 15, y + 17, 48, 48);
      tx = x + 80;
    }
    if (this.who) {
      const nw = Math.ceil(textW(g, this.who, 13, { font: 'd', track: .5 })) + 20;
      rrect(g, x + 10, y - 10, nw, 20, 2, PAL.night); g.fillStyle = PAL.indigo; g.fillRect(x + 12, y - 8, nw - 4, 16);
      g.fillStyle = PAL.gold; g.fillRect(x + 12, y + 6, nw - 4, 2);
      text(g, this.who, x + 20, y - 8, { font: 'd', size: 13, color: PAL.goldHi, track: .5 });
    }
    let n = Math.floor(this.chars);
    (this.pages[this.page] || []).forEach((ln, i) => { const s = ln.slice(0, Math.max(0, n)); n -= ln.length + 1; text(g, s, tx, y + 11 + i * 19, { size: 14 }); });
    if (this.resolve && !this.auto && this.chars >= this.total()) {
      const by = y + h - 18 + (Math.floor(Game.t / 260) % 2) * 2;
      g.fillStyle = PAL.coral; g.fillRect(x + w - 24, by, 10, 2); g.fillRect(x + w - 22, by + 2, 6, 2); g.fillRect(x + w - 20, by + 4, 2, 2);
    }
  },
};
const say = (s, auto) => Msg.say(s, auto);

/* ---------- layers ---------- */
function layer(def) {
  return new Promise(res => {
    const L = { draw: def.draw, update: def.update, born: Game.t, anim: def.anim };
    const done = v => { const i = Game.ui.indexOf(L); if (i >= 0) Game.ui.splice(i, 1); res(v); };
    L.key = k => def.key && def.key(k, done);
    if (def.init) def.init(done);
    Game.ui.push(L);
  });
}

/* A vertical (or grid) list menu. Resolves to the chosen index, or -1 if cancelled.
   o.draw(g, st) replaces the default look while keeping the same keys (battle and title use it). */
function choose(options, o) {
  o = o || {};
  const cols = o.cols || 1, rowH = o.rowH || 22, maxRows = o.rows || 8;
  const g = Game.g; setFont(g, 14);
  const labelOf = v => typeof v === 'string' ? v : v.label;
  let w = o.w;
  if (!w) { w = 0; for (const v of options) w = Math.max(w, g.measureText(labelOf(v)).width + (v.right ? g.measureText(v.right).width + 24 : 0)); w = (w + 46) * cols; }
  const rowsTotal = Math.ceil(options.length / cols), rows = Math.min(maxRows, rowsTotal), h = rows * rowH + 20;
  const x = o.x !== undefined ? o.x : VW - w - 8, y = o.y !== undefined ? o.y : VH - 92 - h;
  const st = { sel: o.start > 0 ? o.start : 0, top: 0, x, y, w, h, options, moved: Game.t };
  const fix = () => { const r = Math.floor(st.sel / cols); if (r < st.top) st.top = r; if (r >= st.top + rows) st.top = r - rows + 1; if (o.onMove) o.onMove(st.sel); };
  fix();
  return layer({
    anim: o.anim,
    draw(g) {
      if (o.draw) return o.draw(g, st);
      panel(g, x, y, w, h, 'parch');
      const cw = (w - 20) / cols;
      for (let i = st.top * cols; i < Math.min(options.length, (st.top + rows) * cols); i++) {
        const v = options[i], cx = x + 10 + (i % cols) * cw, cy = y + 10 + (Math.floor(i / cols) - st.top) * rowH;
        if (i === st.sel) { selRow(g, cx, cy - 2, cw, rowH - 2); cursor(g, cx + 8, cy + 3); }
        text(g, labelOf(v), cx + 22, cy, { size: 14, weight: i === st.sel ? 800 : 700, color: v.disabled ? PAL.parch3 : PAL.ink });
        if (v.right) text(g, v.right, cx + cw - 8, cy + 2, { align: 'right', size: 11, color: PAL.soft });
      }
      if (rowsTotal > rows) { g.fillStyle = PAL.goldLo; if (st.top > 0) g.fillRect(x + w - 14, y + 8, 4, 4); if (st.top + rows < rowsTotal) g.fillRect(x + w - 14, y + h - 14, 4, 4); }
    },
    key(k, done) {
      const n = options.length, before = st.sel;
      if (k === 'up') st.sel = (st.sel - cols + n) % n; else if (k === 'down') st.sel = (st.sel + cols) % n;
      else if (k === 'left' && cols > 1) st.sel = (st.sel - 1 + n) % n; else if (k === 'right' && cols > 1) st.sel = (st.sel + 1) % n;
      else if (k === 'a') { if (!options[st.sel].disabled) return done(st.sel); }
      else if (k === 'b' && o.cancel !== false) return done(-1);
      if (st.sel >= n) st.sel = n - 1;
      if (st.sel !== before) st.moved = Game.t;
      fix();
    },
  });
}
async function confirmBox(question) {
  Msg.set(question);
  const r = await choose(['Yes', 'No'], { w: 96 });
  return r === 0;
}

/* ---------- boot / loop ---------- */
/* Fit the 480x320 screen to the page. Whole-number scales keep every art pixel square, so we snap to one
   whenever that costs little space, fall back to half steps, and only then stretch to fit exactly. */
function resizeCanvas() {
  const c = Game.canvas, stage = document.getElementById('stage');
  const availW = stage.clientWidth - 20, availH = stage.clientHeight - 20;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const exact = Math.max(0.5, Math.min(availW / VW, availH / VH) * dpr);
  let k = Math.floor(exact);
  if (k < 1 || k / exact < 0.86) { const half = Math.floor(exact * 2) / 2; k = half >= 1 && half / exact >= 0.86 ? half : exact; }
  c.width = Math.round(VW * k); c.height = Math.round(VH * k);
  c.style.width = (c.width / dpr) + 'px'; c.style.height = (c.height / dpr) + 'px';
  Game.scale = c.width / VW;
  Game.compact = c.width / dpr < 430;
}
/* The page header mirrors where you are and how far you have come. */
const HUD = {
  key: '', next: 0,
  sync() {
    if (Game.t < this.next) return; this.next = Game.t + 300;
    const on = !!(S && Game.scene !== 'title' && World.map);
    const loc = on ? World.placeName() : 'Title screen';
    const key = on ? [loc, S.name, sigilCount(), S.coins, caughtCount()].join('|') : 'title';
    if (key === this.key) return; this.key = key;
    const $ = id => document.getElementById(id); if (!$('hud-loc')) return;
    $('hud-loc').textContent = loc;
    $('hud-who').hidden = !on;
    if (on) { $('hud-name').textContent = S.name; $('hud-sig').textContent = sigilCount() + '/8'; $('hud-coins').textContent = S.coins; $('hud-jr').textContent = caughtCount() + '/144'; }
  },
};
function frame(now) {
  const dt = Math.min(50, now - (Game.last || now)); Game.last = now; Game.t += dt; Game.dt = dt;
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
  g.fillStyle = PAL.night; g.fillRect(0, 0, VW, VH);
  if (Game.scene === 'world') World.draw(g); else if (Game.scene === 'battle') Battle.draw(g); else if (Game.scene === 'title') Title.draw(g);
  Msg.draw(g);
  for (const L of Game.ui) if (L.draw) {
    // menus ease in: a short fade and an 8px rise
    const a = L.born === undefined || L.anim === false ? 1 : clamp((Game.t - L.born) / 130, 0, 1);
    g.save(); if (a < 1) { g.globalAlpha = a; g.translate(0, Math.round((1 - a) * 8)); }
    L.draw(g); g.restore();
  }
  HUD.sync();
  if (Game.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + Game.flash + ')'; g.fillRect(0, 0, VW, VH); }
  if (Game.fadeA > 0) { g.fillStyle = 'rgba(23,22,41,' + Game.fadeA + ')'; g.fillRect(0, 0, VW, VH); }
  requestAnimationFrame(frame);
}
function bootEngine() {
  Game.canvas = document.getElementById('game'); Game.g = Game.canvas.getContext('2d');
  resizeCanvas(); window.addEventListener('resize', resizeCanvas);
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(document.getElementById('stage'));
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
