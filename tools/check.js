#!/usr/bin/env node
/* Data and map sanity checks. Run with: node tools/check.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'js');
const files = ['core.js', 'data/moves.js', 'data/monsters.js', 'data/items.js', 'ui.js', 'sprites.js', 'data/world.js', 'state.js'];
const ctx = vm.createContext({ console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } });
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') +
  '\nbuildWorld(); this.X = { DEX, MOVES, CELLS, MAPS, WORLD, WARDENS, COUNCIL, LODGE_TRAINERS, ITEMS, T, isWalkable, CW, CH, HABITAT, baseFormOf, TYPES, TYPE_STRONG, TYPE_WEAK };', ctx);
const { DEX, MOVES, CELLS, MAPS, WORLD, WARDENS, COUNCIL, LODGE_TRAINERS, ITEMS, T, isWalkable, CW, CH, HABITAT } = ctx.X;
let bad = 0; const fail = (...a) => { bad++; console.log('FAIL', ...a); };

// --- monsters ---
if (DEX.length !== 152) fail('expected 151 monsters, got', DEX.length - 1);
const names = new Set();
for (let i = 1; i < DEX.length; i++) {
  const d = DEX[i];
  if (names.has(d.name)) fail('duplicate name', d.name); names.add(d.name);
  for (const [l, mv] of d.learn) if (!MOVES[mv]) fail(d.name, 'learns unknown move', mv);
  if (d.learn.filter(e => e[0] === 1).length < 1) fail(d.name, 'has no level-1 move');
  if (d.evo && (!DEX[d.evo.to] || DEX[d.evo.to].fam !== d.fam)) fail(d.name, 'bad evolution');
  for (const t of d.types) if (!ctx.X.TYPES.includes(t)) fail(d.name, 'bad type', t);
}
// --- parties ---
const checkParty = (who, party) => party.forEach(([id, l]) => { if (id !== 'R' && !DEX[id]) fail(who, 'bad monster id', id); if (!(l >= 1 && l <= 100)) fail(who, 'bad level', l); });
WARDENS.slice(1).forEach(w => checkParty(w.name, w.party)); COUNCIL.forEach(c => checkParty(c.name, c.party));
LODGE_TRAINERS.slice(1).forEach(ts => ts.forEach(t => checkParty(t[0], t[2])));
for (const k in CELLS) { const c = CELLS[k]; (c.trainers || []).forEach(t => checkParty(t[0], t[2])); (c.items || []).forEach(i => { if (!ITEMS[i]) fail(c.name, 'unknown item', i); });
  for (const e of [...(c.enc || []), ...(c.fish || [])]) if (!DEX[e[0]] || e[1] > e[2]) fail(c.name, 'bad encounter', e); }
// --- every family obtainable ---
for (let i = 1; i < DEX.length; i++) if (DEX[i].stage === 0 && !HABITAT[i]) fail(DEX[i].name, 'cannot be obtained anywhere');

// --- maps: everything reachable ---
const start = { x: 0 * CW + 4, y: 4 * CH + 9 };
function flood(map, sx, sy) {
  const seen = new Uint8Array(map.w * map.h), q = [[sx, sy]];
  const solid = new Set(map.npcs.filter(n => n.kind !== 'gate' && !(n.hideFlag && n.hideFlag === n.flag)).map(n => n.x + ',' + n.y));
  seen[sy * map.w + sx] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const i = ny * map.w + nx; if (seen[i] || !isWalkable(map.tiles[i]) || solid.has(nx + ',' + ny)) continue;
      seen[i] = 1; q.push([nx, ny]);
    }
  }
  return seen;
}
function checkMap(map, sx, sy) {
  if (!isWalkable(map.tiles[sy * map.w + sx])) fail(map.id, 'entry not walkable', sx, sy);
  const seen = flood(map, sx, sy), at = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h && seen[y * map.w + x];
  for (const n of map.npcs) {
    let ok = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (at(n.x + dx, n.y + dy)) ok = true;
      const t = map.tiles[(n.y + dy) * map.w + n.x + dx];
      if (t === T.COUNTER && at(n.x + dx * 2, n.y + dy * 2)) ok = true;
    }
    if (!ok) fail(map.id, 'NPC unreachable', n.kind, n.name || n.item || n.mon || '', n.x, n.y);
  }
  for (const k in map.warps) { const [x, y] = k.split(',').map(Number); if (!at(x, y)) fail(map.id, 'warp unreachable', k); }
  for (const k in map.signs) { const [x, y] = k.split(',').map(Number); if (!(at(x, y + 1) || at(x - 1, y) || at(x + 1, y))) fail(map.id, 'sign unreachable', k); }
  return seen;
}
const seen = checkMap(WORLD, start.x, start.y);
for (const t of WORLD.towns) if (!seen[t.y * WORLD.w + t.x]) fail('town unreachable', t.name);
let walk = 0; for (const v of seen) walk += v;
for (const id in MAPS) if (id !== 'world') { const m = MAPS[id]; checkMap(m, Math.floor(m.w / 2), m.h - 2); }
// trainers on routes must actually watch a path tile
let trainers = 0;
for (const n of WORLD.npcs) if (n.kind === 'trainer') { trainers++; const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[n.dir]; let sees = false;
  for (let i = 1; i <= n.sight; i++) { const t = WORLD.tiles[(n.y + d[1] * i) * WORLD.w + n.x + d[0] * i]; if (!isWalkable(t)) break; if (t === T.PATH || t === T.BRIDGE) sees = true; }
  if (!sees) fail('trainer does not watch the path', n.name, n.x, n.y); }
// gates must fully block: without passing a gate you can only reach Mosswick
const solidGates = new Set(WORLD.npcs.filter(n => n.kind === 'gate').map(n => n.x + ',' + n.y));
(function () { const s2 = new Uint8Array(WORLD.w * WORLD.h), q = [[start.x, start.y]]; s2[start.y * WORLD.w + start.x] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= WORLD.w || ny >= WORLD.h) continue; const i = ny * WORLD.w + nx; if (s2[i] || !isWalkable(WORLD.tiles[i]) || solidGates.has(nx + ',' + ny)) continue; s2[i] = 1; q.push([nx, ny]); } }
  for (const t of WORLD.towns) if (t.name !== 'Mosswick' && s2[t.y * WORLD.w + t.x]) fail('gates leak: reached', t.name, 'without passing a road warden'); })();

console.log(`monsters ${DEX.length - 1}, moves ${Object.keys(MOVES).length}, maps ${Object.keys(MAPS).length}, towns ${WORLD.towns.length}, world ${WORLD.w}x${WORLD.h}, walkable tiles ${walk}, world NPCs ${WORLD.npcs.length}, route trainers ${trainers}`);
console.log(bad ? bad + ' problem(s) found' : 'all checks passed');
process.exit(bad ? 1 : 0);
