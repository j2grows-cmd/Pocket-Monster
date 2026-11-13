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
    v: 1, name: name || 'Wren', map: 'world', x: home.c * CW + 4, y: home.r * CH + 9, dir: 'down',
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
  try { const s = JSON.parse(data); return s && s.v === 1 && s.party ? s : null; } catch (e) { return null; }
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
