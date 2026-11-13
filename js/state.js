'use strict';
/* Game state, monster instances, save and load. */
const SAVE_KEY = 'vessara-save-v1';
let S = null;          // the live game state
let memorySave = null; // fallback when browser storage is unavailable

function xpFor(l) { return Math.floor(0.8 * l * l * l); }
function statOf(m, k) {
  const b = DEX[m.id].base[k] + m.iv[STAT_KEYS.indexOf(k)];
  return k === 'hp' ? Math.floor(b * m.lvl / 50) + m.lvl + 10 : Math.floor(b * m.lvl / 50) + 5;
}
function monName(m) { return DEX[m.id].name; }
function movesAt(id, lvl) {
  const known = DEX[id].learn.filter(e => e[0] <= lvl).map(e => e[1]);
  return known.slice(-4).map(n => ({ n, pp: MOVES[n].pp }));
}
function makeMon(id, lvl) {
  const m = { id, lvl, xp: xpFor(lvl), iv: STAT_KEYS.map(() => R.int(0, 15)), status: null, sleep: 0, moves: movesAt(id, lvl) };
  m.hp = statOf(m, 'hp');
  return m;
}
function healMon(m) { m.hp = statOf(m, 'hp'); m.status = null; m.sleep = 0; m.moves.forEach(mv => mv.pp = MOVES[mv.n].pp); }
function healParty() { S.party.forEach(healMon); }
function firstAlive() { return S.party.findIndex(m => m.hp > 0); }
function sigilCount() { let n = 0; for (let i = 1; i <= 8; i++) if (S.flags['W:' + i]) n++; return n; }
function addItem(name, n) { S.bag[name] = (S.bag[name] || 0) + (n || 1); if (S.bag[name] <= 0) delete S.bag[name]; }
function caughtCount() { return Object.keys(S.caught).length; }
function seenCount() { return Object.keys(S.seen).length; }
function addMon(m) {
  S.seen[m.id] = 1; S.caught[m.id] = 1;
  if (S.party.length < 6) { S.party.push(m); return 'team'; }
  S.vault.push(m); return 'paddock';
}
function rivalMon(lvl) {
  let id = S.rivalStarter || 4;
  while (DEX[id].evo && lvl >= DEX[id].evo.lvl) id = DEX[id].evo.to;
  return id;
}
function resolveParty(party) { return party.map(([id, lvl]) => makeMon(id === 'R' ? rivalMon(lvl) : id, lvl)); }

function newGame(name) {
  const home = CELLS['0,4'];
  S = {
    v: 1, dex: 144, name: name || 'Wren', map: 'world', x: home.c * CW + 4, y: home.r * CH + 9, dir: 'down',
    party: [], vault: [], bag: { 'Town Map': 1 }, coins: 600, flags: {}, seen: {}, caught: {},
    rivalStarter: 4, ward: 0, steps: 0, time: 0,
    respawn: { map: 'world', x: home.c * CW + 4, y: home.r * CH + 9 },
  };
  return S;
}
function saveGame() {
  const data = JSON.stringify(S);
  memorySave = data;
  try { localStorage.setItem(SAVE_KEY, data); return true; } catch (e) { return false; }
}
function readSave() {
  let data = null;
  try { data = localStorage.getItem(SAVE_KEY); } catch (e) { /* storage blocked */ }
  data = data || memorySave;
  if (!data) return null;
  try { const s = JSON.parse(data); return s && s.v === 1 && s.party ? migrateSave(s) : null; } catch (e) { return null; }
}
/* Saves from the 151-monster build: Journal numbers changed when the roster became 144.
   OLD_DEX[oldNumber] is the new number; the seven retired monsters become their closest relative. */
const OLD_DEX = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,17,18,19,15,16,20,21,22,23,24,25,26,27,28,29,30,33,34,35,31,32,36,37,38,39,40,41,42,43,44,45,46,47,49,50,51,52,53,54,48,55,56,57,58,59,60,61,10,11,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,81,82,83,84,85,86,87,88,89,90,91,92,93,80,94,95,96,97,98,99,19,100,101,102,103,104,105,106,107,108,109,110,44,45,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,70,71,138,139,140,141,142,143,144];
function migrateSave(s) {
  if (s.dex === 144) return s;
  const id = n => OLD_DEX[n] || 1;
  for (const m of s.party.concat(s.vault || [])) m.id = id(m.id);
  for (const key of ['seen', 'caught']) { const out = {}; for (const k in s[key] || {}) out[id(+k)] = 1; s[key] = out; }
  const flags = {}; for (const k in s.flags || {}) flags[/^L:\d+$/.test(k) ? 'L:' + id(+k.slice(2)) : k] = s.flags[k]; s.flags = flags;
  s.dex = 144;
  return s;
}
function wipeSave() { memorySave = null; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

/* Where a monster can be found, for the Journal. */
const HABITAT = {};
(function () {
  const add = (id, where) => { (HABITAT[id] = HABITAT[id] || []); if (!HABITAT[id].includes(where)) HABITAT[id].push(where); };
  for (const k in CELLS) {
    const c = CELLS[k];
    (c.enc || []).forEach(e => add(e[0], c.name));
    (c.fish || []).forEach(e => add(e[0], c.name + ' (fishing)'));
    if (c.legend) add(c.legend[0], c.name);
  }
  [1, 4, 7].forEach(id => add(id, 'Sage Maren\'s study'));
})();
