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
    if (n && (n !== this.lastName || force)) { this.lastName = n; this.banner = { text: n, t: 2200 }; }
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
    Msg.hide(); Game.busy = false;
  },

  onStep() {
    S.x = this.x; S.y = this.y; S.steps++;
    const key = this.x + ',' + this.y, warp = this.map.warps[key];
    if (warp) { this.run(async () => { await fadeOut(); this.enter(warp.map, warp.x, warp.y, warp.dir); await fadeIn(); }); return; }
    this.checkBanner();
    const spotter = this.map.npcs.find(n => n.kind === 'trainer' && n.sight > 0 && !S.flags[n.flag] && this.visible(n) && this.sees(n));
    if (spotter) { this.run(async () => { this.bubble = spotter; await wait(550); this.bubble = null; await Scripts.trainer(spotter); }); return; }
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
    if (n) { if (n.pal && !(n.kind === 'trainer' && n.sight > 0 && !S.flags[n.flag])) n.dir = OPP[this.dir]; this.run(() => Scripts[n.kind](n)); return; }
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
      if (t === T.PATH || t === T.BRIDGE) col = '#e6c88c'; else if (t === T.WATER) col = '#3f8fe0'; else if (t === T.LAVA) col = '#e8562a'; else if (t === T.SAND) col = '#ecd9a0';
      else if (t >= T.OBST && t < T.OBST + 10) col = shade(B.g, -.38); else if (t >= T.TALL && t < T.TALL + 10) col = shade(B.g, -.14);
      else if ((t >= T.WALL && t <= T.EMB_L && t !== T.BRIDGE && t !== T.LAVA) || (t >= T.EAVE && t < T.EAVE + 10)) col = '#b8503a';
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    this.mini = c;
  },

  draw(g) {
    if (!this.buf) this.buf = makeCanvas(VW, VH);
    const b = this.buf.getContext('2d'), m = this.map; b.imageSmoothingEnabled = false;
    b.fillStyle = '#14121c'; b.fillRect(0, 0, VW, VH);
    const [dx, dy] = DIRS[this.dir], p = this.moving ? this.prog : 1;
    const ppx = this.moving ? (this.fx + dx * p) * TS : this.x * TS, ppy = this.moving ? (this.fy + dy * p) * TS : this.y * TS;
    const mw = m.w * TS, mh = m.h * TS;
    const camX = Math.round(mw <= VW ? (mw - VW) / 2 : clamp(ppx + 16 - VW / 2, 0, mw - VW));
    const camY = Math.round(mh <= VH ? (mh - VH) / 2 : clamp(ppy + 16 - VH / 2, 0, mh - VH));
    const fr = Math.floor(Game.t / 450) % 2;
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(m.w - 1, Math.floor((camX + VW) / TS)), y1 = Math.min(m.h - 1, Math.floor((camY + VH) / TS));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const id = m.tiles[ty * m.w + tx]; if (!id) continue;
      b.drawImage(Sprites.tile(id, m.biomeAt(tx, ty), fr), tx * TS - camX, ty * TS - camY, TS, TS);
    }
    const ents = [];
    for (const n of m.npcs) { if (n.x < x0 - 2 || n.x > x1 + 2 || n.y < y0 - 2 || n.y > y1 + 2 || !this.visible(n)) continue; ents.push(n); }
    ents.push({ player: 1, y: this.moving ? this.fy + dy * p : this.y });
    ents.sort((a, c) => a.y - c.y);
    for (const n of ents) {
      if (n.player) {
        const f = this.moving ? 1 + (Math.floor(p * 2) + this.stepN) % 2 : 0;
        b.drawImage(Sprites.char('hero', this.dir, f), Math.round(ppx - camX), Math.round(ppy - camY - 8), TS, TS);
        continue;
      }
      const sx = n.x * TS - camX, sy = n.y * TS - camY;
      if (n.mon) { const big = n.kind === 'legend', bob = Math.round(Math.sin(Game.t / 400 + n.x) * 2); if (big) b.drawImage(Sprites.mon(n.mon), sx - 24, sy - 46 + bob, 80, 80); else b.drawImage(Sprites.mon(n.mon), sx - 8, sy - 26 + bob, 48, 48); }
      else if (n.obj) b.drawImage(objSprite(n.obj), sx, sy - (n.obj === 'item' ? 2 : 4), TS, TS);
      else b.drawImage(Sprites.char(n.pal, n.dir, 0), sx, sy - 8, TS, TS);
      if (this.bubble === n) { b.fillStyle = '#fff'; b.fillRect(sx + 8, sy - 34, 16, 22); b.fillStyle = UIC.accent; b.fillRect(sx + 14, sy - 30, 4, 10); b.fillRect(sx + 14, sy - 18, 4, 4); }
    }
    g.drawImage(this.buf, 0, 0, VW, VH);
    if (this.banner) {
      const a = Math.min(1, this.banner.t / 300); setFont(g, 16, true);
      const w = g.measureText(this.banner.text).width + 32;
      g.globalAlpha = a; box(g, 8, 8, w, 34); text(g, this.banner.text, 24, 16, { bold: true }); g.globalAlpha = 1;
    }
    if (S.ward > 0) text(g, 'Ward ' + S.ward, VW - 10, 8, { align: 'right', size: 12, color: '#fff', shadow: '#000' });
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

async function pauseMenu() {
  let start = 0;
  for (;;) {
    const r = await choose(['Journal', 'Team', 'Bag', 'Map', 'Save', 'Close'], { x: VW - 126, y: 8, w: 118, start });
    if (r < 0 || r === 5) return;
    start = r;
    if (r === 0) await journalScreen();
    if (r === 1) { if (S.party.length) await teamScreen({ mode: 'menu' }); else { await say('You have no monsters yet.'); Msg.hide(); } }
    if (r === 2) { const out = await bagScreen({ mode: 'field' }); if (out === 'close') return; }
    if (r === 3) await mapScreen();
    if (r === 4) { const ok = saveGame(); await say(ok ? 'Game saved.' : 'Saved for this session only. This browser is blocking storage.'); Msg.hide(); }
  }
}
