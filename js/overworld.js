'use strict';
/* Walking around Vessara: movement, NPC scripts, encounters, warps. */
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

const World = {
  map: null, x: 0, y: 0, dir: 'down', moving: false, prog: 0, fx: 0, fy: 0, stepN: 0, banner: null, bubble: null, lastName: '', buf: null, mini: null,

  enter(mapId, x, y, dir) {
    this.map = MAPS[mapId]; this.x = x; this.y = y; if (dir) this.dir = dir; this.moving = false;
    S.map = mapId; S.x = x; S.y = y; S.dir = this.dir;
    this.checkBanner(true);
  },
  placeName() {
    const m = this.map, c = m.cellAt(this.x, this.y);
    if (!m.interior) return c ? c.name : '';
    return { hearth: 'Hearth House', trade: 'Trade Post', lodge: c.name + ' Lodge', study: 'Sage Maren\'s Study', summit: 'Hall of the Crown', home: 'Home', house: c.name }[m.type];
  },
  checkBanner(force) {
    const n = this.placeName();
    if (!n || (n === this.lastName && !force)) return;
    const m = this.map, c = m.cellAt(this.x, this.y);
    const sub = m.interior ? c.name : c.kind === 'town' ? c.tag : c.kind === 'area' ? 'Wild area' : 'Route';
    this.lastName = n; this.banner = { text: n, sub, t: 2800, life: 2800 };
  },
  visible(n) {
    if (n.hideFlag && S.flags[n.hideFlag]) return false;
    if ((n.kind === 'item' || n.kind === 'legend') && S.flags[n.flag]) return false;
    return true;
  },
  npcAt(x, y) { return this.map.npcs.find(n => n.x === x && n.y === y && this.visible(n)); },
  tile(x, y) { const m = this.map; return x < 0 || y < 0 || x >= m.w || y >= m.h ? T.VOID : m.tiles[y * m.w + x]; },
  canWalk(x, y) { return isWalkable(this.tile(x, y)) && !this.npcAt(x, y); },

  update(dt) {
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.moving) {
      this.prog += dt / (Input.held.b ? 95 : 150);
      if (this.prog >= 1) { this.moving = false; this.stepN++; this.onStep(); }
      return;
    }
    if (Game.busy || Game.ui.length || Msg.visible) return;
    let d = Input.held[Input.lastDir] ? Input.lastDir : ['up', 'down', 'left', 'right'].find(k => Input.held[k]);
    if (!d) return;
    this.dir = d; S.dir = d;
    const nx = this.x + DIRS[d][0], ny = this.y + DIRS[d][1];
    if (this.canWalk(nx, ny)) { this.fx = this.x; this.fy = this.y; this.x = nx; this.y = ny; this.moving = true; this.prog = 0; }
  },

  async run(fn) {
    if (Game.busy) return;
    Game.busy = true;
    try { await fn(); } catch (e) { console.error(e); }
    Msg.hide(); Msg.ctx = null; Game.busy = false;
  },

  onStep() {
    S.x = this.x; S.y = this.y; S.steps++;
    const key = this.x + ',' + this.y, warp = this.map.warps[key];
    if (warp) { this.run(async () => { await fadeOut(); this.enter(warp.map, warp.x, warp.y, warp.dir); await fadeIn(); }); return; }
    this.checkBanner();
    const spotter = this.map.npcs.find(n => n.kind === 'trainer' && n.sight > 0 && !S.flags[n.flag] && this.visible(n) && this.sees(n));
    if (spotter) { Msg.ctx = spotter; this.run(async () => { this.bubble = spotter; await wait(550); this.bubble = null; await Scripts.trainer(spotter); }); return; }
    if (S.ward > 0) { S.ward--; if (S.ward === 0) this.run(async () => { await say('The Ward Incense has burned out.'); }); return; }
    const t = this.tile(this.x, this.y), cell = this.map.cellAt(this.x, this.y);
    if (t >= T.TALL && t < T.TALL + 10 && cell && cell.enc && firstAlive() >= 0 && R.chance(0.115)) {
      const e = R.weighted(cell.enc, v => v[3]);
      this.run(() => wildBattle(makeMon(e[0], R.int(e[1], e[2]))));
    }
  },
  sees(n) {
    const [dx, dy] = DIRS[n.dir];
    for (let i = 1; i <= n.sight; i++) {
      const x = n.x + dx * i, y = n.y + dy * i;
      if (x === this.x && y === this.y) return true;
      if (!isWalkable(this.tile(x, y)) || this.npcAt(x, y)) return false;
    }
    return false;
  },

  key(k) {
    if (['up', 'down', 'left', 'right'].includes(k)) return;
    if (this.moving) return;
    if (k === 'start') { this.run(pauseMenu); return; }
    if (k !== 'a') return;
    const [dx, dy] = DIRS[this.dir], fx = this.x + dx, fy = this.y + dy, ft = this.tile(fx, fy);
    let n = this.npcAt(fx, fy);
    if (!n && ft === T.COUNTER) n = this.npcAt(fx + dx, fy + dy);
    if (n) { if (n.pal && !(n.kind === 'trainer' && n.sight > 0 && !S.flags[n.flag])) n.dir = OPP[this.dir]; Msg.ctx = n; this.run(() => Scripts[n.kind](n)); return; }
    const sign = this.map.signs[fx + ',' + fy];
    if (sign) { this.run(() => say(sign)); return; }
    if (ft === T.WATER) { this.run(fish); return; }
    if (ft === T.SHELF) { this.run(() => say('Rows of well-thumbed books about monsters.')); return; }
    if (ft === T.STATUE) { this.run(() => say('A statue of a tamer and their partner. The plaque is worn smooth.')); return; }
  },

  buildMini() {
    const m = MAPS.world, c = makeCanvas(m.w, m.h), g = c.getContext('2d');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const t = m.tiles[y * m.w + x], B = BIOMES[m.biomeAt(x, y)];
      let col = B.g;
      if (t === T.PATH || t === T.BRIDGE) col = '#ecd9a3'; else if (t === T.WATER) col = '#4a90d6'; else if (t === T.LAVA) col = '#db665a'; else if (t === T.SAND) col = '#f1e2b4';
      else if (t >= T.OBST && t < T.OBST + 10) col = shade(B.g, (x + y) % 2 ? -.42 : -.36); else if (t >= T.TALL && t < T.TALL + 10) col = shade(B.g, -.14);
      else if (isBuilding(t)) col = '#a8453f';
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    this.mini = c;
  },

  /* Ground first, then everything that stands up (scenery, people, monsters) sorted by depth,
     then weather, light and the vignette. */
  draw(g) {
    if (!this.buf) this.buf = makeCanvas(VW, VH);
    const b = this.buf.getContext('2d'), m = this.map, t = Game.t; b.imageSmoothingEnabled = false;
    b.fillStyle = PAL.night; b.fillRect(0, 0, VW, VH);
    const [dx, dy] = DIRS[this.dir], p = this.moving ? this.prog : 1;
    const ppx = this.moving ? (this.fx + dx * p) * TS : this.x * TS, ppy = this.moving ? (this.fy + dy * p) * TS : this.y * TS;
    const mw = m.w * TS, mh = m.h * TS, even = v => Math.round(v / 2) * 2;
    const camX = even(mw <= VW ? (mw - VW) / 2 : clamp(ppx + 16 - VW / 2, 0, mw - VW));
    const camY = even(mh <= VH ? (mh - VH) / 2 : clamp(ppy + 16 - VH / 2, 0, mh - VH));
    const wf = Math.floor(t / 300), sf = Math.floor(t / 560);
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(m.w - 1, Math.floor((camX + VW) / TS)), y1 = Math.min(m.h - 1, Math.floor((camY + VH) / TS) + 1);
    const tl = (x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.tiles[y * m.w + x];
    const soft = n => (n >= 20 && n < 50) || n === T.FLOWER || n === T.FENCE || n === T.SIGN;
    const ents = [], lights = [];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const id = m.tiles[ty * m.w + tx]; if (!id) continue;
      const bio = m.biomeAt(tx, ty), sx = tx * TS - camX, sy = ty * TS - camY;
      let h = (Math.imul(tx, 374761393) + Math.imul(ty, 668265263)) >>> 0; h = (Math.imul(h ^ (h >>> 13), 1274126177) >>> 0) >>> 8;
      let v = h & 3, fr = 0;
      if (id === T.WATER || id === T.LAVA) { fr = wf; v = h & 1; }
      else if ((id >= 40 && id < 50) || id === T.FLOWER) fr = sf + tx + ty; // the sway rolls across a field
      else if (id === T.HEARTH) fr = wf;
      else if (isBuilding(id)) { v = (isBuilding(tl(tx - 1, ty)) ? 0 : 1) | (isBuilding(tl(tx + 1, ty)) ? 0 : 2); if (ROOF_COL[id] && !v && h % 3 === 0) v = 4; }
      b.drawImage(Sprites.tile(id, bio, fr, v), sx, sy, TS, TS);
      if (id === T.PATH) {
        const mask = (soft(tl(tx, ty - 1)) ? 1 : 0) | (soft(tl(tx + 1, ty)) ? 2 : 0) | (soft(tl(tx, ty + 1)) ? 4 : 0) | (soft(tl(tx - 1, ty)) ? 8 : 0);
        if (mask) b.drawImage(Sprites.edge('path', mask, bio, 0), sx, sy, TS, TS);
      } else if (id === T.WATER) {
        const land = n => n !== T.WATER && n !== T.BRIDGE && n !== 0;
        const mask = (land(tl(tx, ty - 1)) ? 1 : 0) | (land(tl(tx + 1, ty)) ? 2 : 0) | (land(tl(tx, ty + 1)) ? 4 : 0) | (land(tl(tx - 1, ty)) ? 8 : 0);
        if (mask) b.drawImage(Sprites.edge('shore', mask, bio, wf), sx, sy, TS, TS);
      } else if (id >= 30 && id < 40) ents.push({ prop: 1, x: tx, y: ty, key: ty, bio, v });
      else if (id === T.WINDOW) lights.push(sx, sy);
      if (!isBuilding(id) && isBuilding(tl(tx, ty - 1))) { b.fillStyle = 'rgba(23,22,41,.24)'; b.fillRect(sx, sy, TS, 6); } // buildings sit on the ground
    }
    for (const n of m.npcs) { if (n.x < x0 - 2 || n.x > x1 + 2 || n.y < y0 - 2 || n.y > y1 + 2 || !this.visible(n)) continue; n.key = n.y + .5; ents.push(n); }
    ents.push({ player: 1, key: (this.moving ? this.fy + dy * p : this.y) + .5 });
    ents.sort((a, c) => a.key - c.key);
    const shadow = (sx, sy, w) => { b.fillStyle = 'rgba(23,22,41,.26)'; b.fillRect(sx + 16 - w / 2, sy + 24, w, 6); b.fillRect(sx + 14 - w / 2, sy + 26, w + 4, 2); };
    for (const n of ents) {
      if (n.prop) {
        const sx = n.x * TS - camX, sy = n.y * TS - camY;
        shadow(sx, sy + 2, 24); b.drawImage(Sprites.prop(n.bio, n.v), sx - 6, sy - 26, 44, 60);
        continue;
      }
      if (n.player) {
        const px = even(ppx - camX), py = even(ppy - camY);
        const f = this.moving ? 1 + (Math.floor(p * 2) + this.stepN) % 2 : (Math.floor(t / 700) % 2 ? 3 : 0);
        shadow(px, py, 16); b.drawImage(Sprites.char('hero', this.dir, f), px - 2, py - 14, 36, 44);
        // wading through tall grass: the front blades cover your feet
        const tids = this.moving ? [[this.fx, this.fy], [this.x, this.y]] : [[this.x, this.y]];
        for (const [gx, gy] of tids) { const id = tl(gx, gy); if (id >= 40 && id < 50) b.drawImage(Sprites.tallFront(m.biomeAt(gx, gy), (sf + gx + gy) % 2), gx * TS - camX, gy * TS - camY, TS, TS); }
        continue;
      }
      const sx = n.x * TS - camX, sy = n.y * TS - camY;
      if (n.mon) {
        const big = n.kind === 'legend', bob = Math.round(Math.sin(t / 400 + n.x)) * 2, s = big ? 96 : 64;
        shadow(sx, sy, big ? 36 : 20); b.drawImage(Sprites.icon(n.mon), sx + 16 - s / 2, sy + 28 - s + bob, s, s);
        if (big) for (let i = 0; i < 4; i++) { const a = t / 900 + i * 1.57; b.fillStyle = Math.floor(t / 200 + i) % 3 ? PAL.goldHi : PAL.white; b.fillRect(even(sx + 15 + Math.cos(a) * 34), even(sy - 16 + Math.sin(a) * 22), 2, 2); }
      } else if (n.obj) {
        if (n.obj === 'item') { shadow(sx, sy - 2, 14); b.drawImage(objSprite('item'), sx, sy - 2, TS, TS); const k = Math.floor(t / 220 + n.x) % 6; if (k < 2) { b.fillStyle = PAL.white; b.fillRect(sx + 22, sy + 4 - k * 2, 2, 2); b.fillRect(sx + 6, sy + 12 - k * 2, 2, 2); } }
        else b.drawImage(objSprite(n.obj), sx, sy - 4, TS, TS);
      } else {
        shadow(sx, sy, 16);
        b.drawImage(Sprites.char(n.pal, n.dir, Math.floor((t + n.x * 137 + n.y * 59) / 800) % 2 ? 3 : 0), sx - 2, sy - 14, 36, 44);
      }
      if (this.bubble === n) { const by = sy - 40 - Math.abs(Math.round(Math.sin(t / 90) * 2)) * 2; rrect(b, sx + 6, by, 20, 22, 2, PAL.night); rrect(b, sx + 8, by + 2, 16, 18, 2, PAL.parch); b.fillStyle = PAL.coral; b.fillRect(sx + 14, by + 4, 4, 8); b.fillRect(sx + 14, by + 14, 4, 4); b.fillStyle = PAL.night; b.fillRect(sx + 12, by + 22, 4, 2); }
    }
    if (!m.interior) {
      const L = Scenery.light(), bio = m.biomeAt(this.x, this.y);
      Scenery.ambient(b, bio, camX, camY, L.night);
      if (L.r < 255 || L.b < 255) { b.globalCompositeOperation = 'multiply'; b.fillStyle = 'rgb(' + L.r + ',' + L.g + ',' + L.b + ')'; b.fillRect(0, 0, VW, VH); b.globalCompositeOperation = 'source-over'; }
      if (L.night > .05) { // windows light up after dark
        for (let i = 0; i < lights.length; i += 2) { const sx = lights[i], sy = lights[i + 1]; b.fillStyle = 'rgba(255,217,138,' + (L.night * .9) + ')'; b.fillRect(sx + 8, sy + 6, 16, 14); b.fillStyle = 'rgba(255,196,110,' + (L.night * .14) + ')'; b.fillRect(sx - 4, sy - 4, 40, 38); b.fillRect(sx + 2, sy + 2, 28, 34); }
      }
    }
    if (!m.interior) b.drawImage(Scenery.vignette(), 0, 0, VW, VH);
    g.drawImage(this.buf, 0, 0, VW, VH);
    if (this.banner) {
      const bn = this.banner, age = bn.life - bn.t, a = Math.min(1, age / 220, bn.t / 300), ease = 1 - (1 - a) * (1 - a);
      const w = Math.ceil(Math.max(textW(g, bn.text, 16, { font: 'd', track: .5 }), bn.sub ? textW(g, bn.sub, 11) : 0)) + 46, h = bn.sub ? 42 : 30, y = Math.round(-h + (h + 8) * ease);
      g.globalAlpha = Math.min(1, a * 1.5);
      panel(g, 8, y, w, h, 'dark'); g.fillStyle = PAL.gold; g.fillRect(12, y + 4, 4, h - 8);
      icon(g, 'pin', 20, y + 7, 2);
      text(g, bn.text, 40, y + 4, { font: 'd', size: 16, color: PAL.parch, track: .5 });
      if (bn.sub) text(g, bn.sub, 40, y + 23, { size: 11, color: PAL.lav });
      g.globalAlpha = 1;
    }
    if (S.ward > 0) { const s = 'WARD ' + S.ward, w = Math.ceil(textW(g, s, 9, { font: 'd', track: 1 })) + 10; tag(g, s, VW - w - 8, 8, PAL.lavLo); }
  },
};

/* ---------- encounters ---------- */
async function battleFlash() {
  for (let i = 0; i < 3; i++) { await tween(Game, 'flash', 0.9, 70); await tween(Game, 'flash', 0, 70); }
  await fadeOut(180);
}
async function wildBattle(mon, legendNpc) {
  await battleFlash();
  const res = await Battle.start({ wild: mon, legend: !!legendNpc });
  if (res === 'lose') await blackout();
  return res;
}
async function blackout() {
  Game.scene = 'world';
  await say(S.name + ' is out of monsters that can fight. You hurry back to the last place you rested...');
  await fadeOut(300);
  healParty();
  const r = S.respawn; World.enter(r.map, r.x, r.y, 'down');
  await fadeIn(300);
}
async function fish() {
  if (!S.bag['Fishing Rod']) { await say('The water is clear and deep. Something moves under the surface.'); return; }
  if (firstAlive() < 0) return;
  const cell = World.map.cellAt(World.x, World.y);
  await say('You cast your line...', 700);
  await wait(500 + Math.random() * 700);
  if (!cell.fish || !R.chance(0.72)) { await say('Not even a nibble.'); return; }
  const e = R.weighted(cell.fish, v => v[3]);
  await say('A bite!', 500);
  await wildBattle(makeMon(e[0], R.int(e[1], e[2])));
}

/* ---------- NPC scripts ---------- */
const Scripts = {
  async talk(n) { await say(n.text); },
  async gift(n) {
    if (S.flags[n.flag]) { await say(n.after); return; }
    await say(n.text); addItem(n.item, 1); S.flags[n.flag] = 1;
    await say(S.name + ' received the ' + n.item + '!');
  },
  async item(n) { S.flags[n.flag] = 1; addItem(n.item, 1); await say(S.name + ' found ' + (/^[AEIOU]/.test(n.item) ? 'an ' : 'a ') + n.item + '!'); },
  async heal(n) {
    await say(n.text);
    await fadeOut(250); healParty(); await wait(450); await fadeIn(250);
    S.respawn = { map: S.map, x: S.x, y: S.y };
    const ok = saveGame();
    await say('Your team is rested and ready.' + (ok ? ' (Game saved.)' : ''));
  },
  async shop(n) { await say(n.text, 1); await shopScreen(); await say('Come back any time.'); },
  async paddock(n) {
    if (!S.party.length) { await say('Come back when you have a monster of your own.'); return; }
    await say(n.text, 1); await paddockScreen();
  },
  async gate(n) {
    const c = sigilCount(), r = n.req;
    const ok = r === 'starter' ? S.flags.starter : r === 'champion' ? S.flags.champion : c >= r;
    if (ok) { await say(r === 'starter' ? 'Road Warden: A partner of your own! Off you go, then. Stick to the path if it looks tired.' : r === 'champion' ? 'Road Warden: The Crown of Vessara. The glade is open to you.' : 'Road Warden: ' + (r === 1 ? 'A sigil' : r + ' sigils') + '. That will do. Safe travels.'); S.flags[n.flag] = 1; return; }
    if (r === 'starter') await say('Road Warden: Hold on! The grass out there is full of wild monsters. See Sage Maren first. Her study has the teal roof.');
    else if (r === 'champion') await say('Road Warden: Only the Crown of Vessara may enter the Origin Glade.');
    else await say('Road Warden: This road is closed to anyone with fewer than ' + r + (r === 1 ? ' sigil' : ' sigils') + '. You have ' + c + '.');
  },
  async sage() {
    if (!S.flags.starter) { await say('Sage Maren: There you are, ' + S.name + '. Today you become a tamer. Three young monsters are waiting on the table. Choose the one you would like as your partner.'); return; }
    const c = caughtCount();
    await say('Sage Maren: Your Journal lists ' + c + ' of 151 monsters. ' + (c >= 151 ? 'Every single one. I never thought I would see it.' : c >= 100 ? 'Vessara has very few secrets left for you.' : c >= 40 ? 'A fine collection, and still growing.' : 'Vessara has plenty more to show you.'));
  },
  async starter(n) {
    const d = DEX[n.mon];
    await say(d.name + ', the ' + d.types[0] + ' monster. ' + d.desc);
    if (!(await confirmBox('Choose ' + d.name + ' as your partner?'))) return;
    addMon(makeMon(d.id, 5)); S.flags.starter = 1; S.rivalStarter = { 1: 4, 4: 7, 7: 1 }[d.id];
    await say(S.name + ' chose ' + d.name + '!');
    await say('Corvin: Then I\'ll take ' + DEX[S.rivalStarter].name + '. Obviously.');
    addItem('Tin Charm', 5); addItem('Tonic', 3);
    await say('Sage Maren: Take these as well. Five Tin Charms for befriending wild monsters, some Tonics, and a Journal to record what you find.');
    await say('Corvin: Before you go anywhere, battle me. Right now.');
    await battleFlash();
    const res = await Battle.start({ trainer: { name: 'Rival Corvin', pal: 'rival' }, party: resolveParty([['R', 5]]), friendly: true });
    healParty();
    await say(res === 'win' ? 'Corvin: Beginner\'s luck. I\'ll see you on the road.' : 'Corvin: Ha! Train harder. I\'ll see you on the road.');
    await say('Sage Maren: Off you go, both of you. Brambleton is east along the Dewpath. Warden Fern there grants the first sigil.');
    saveGame();
  },
  async legend(n) {
    const d = DEX[n.mon];
    if (firstAlive() < 0) { await say('Something vast is watching. You have no monster fit to face it.'); return; }
    await say('The air goes very still.');
    await say(d.name + ' turns to face you!');
    const res = await wildBattle(makeMon(n.mon, n.lvl), n);
    if (res === 'caught') S.flags[n.flag] = 1;
    else if (res === 'win') await say(d.name + ' withdrew, but it has not gone far. It will be back.');
  },
  async trainer(n) {
    if (S.flags[n.flag]) { await say(n.name + ': ' + (n.champion ? 'Vessara is in good hands.' : n.post)); return; }
    if (!S.party.length || firstAlive() < 0) { await say(n.name + ': Come back with a monster that can fight.'); return; }
    await say(n.name + ': ' + n.pre);
    await battleFlash();
    const res = await Battle.start({ trainer: n, party: resolveParty(n.party) });
    if (res !== 'win') { await blackout(); return; }
    S.flags[n.flag] = 1;
    if (n.warden) {
      const w = WARDENS[n.warden];
      await say(S.name + ' received the ' + w.sigil + '!');
      const c = sigilCount();
      await say(c >= 8 ? 'That is all eight sigils. The road to Crown Summit is open.' : 'Sigils held: ' + c + ' of 8. New roads will open, and Trade Posts may stock better goods.');
      saveGame();
    }
    if (n.champion) {
      S.flags.champion = 1; healParty();
      await say('The hall falls silent. Then every lamp in it flares gold.');
      await say(S.name + ' is the new Crown of Vessara!');
      await say('Journal: ' + caughtCount() + ' of 151 monsters recorded. Somewhere past the Whisperwood, the Origin Glade has opened.');
      await fadeOut(600);
      const r = newGameSpawn(); S.respawn = r; World.enter(r.map, r.x, r.y, 'down'); saveGame();
      await fadeIn(600);
      await say('Thank you for playing Tamers of Vessara. Your adventure can go on for as long as you like.');
    }
  },
};
function newGameSpawn() { const h = CELLS['0,4']; return { map: 'world', x: h.c * CW + 4, y: h.r * CH + 9 }; }

