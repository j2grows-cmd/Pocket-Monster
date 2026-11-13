'use strict';
/* Tamers of Vessara — core helpers, types and shared constants */

const VW = 480, VH = 320, TS = 32;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const R = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  chance(p) { return Math.random() < p; },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  weighted(list, wf) {
    let total = 0;
    for (const e of list) total += wf(e);
    let r = Math.random() * total;
    for (const e of list) { r -= wf(e); if (r <= 0) return e; }
    return list[list.length - 1];
  },
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Types ---------- */
const TYPES = ['Wild', 'Flora', 'Ember', 'Tide', 'Spark', 'Stone', 'Gale', 'Frost', 'Venom', 'Mind', 'Shade', 'Iron'];
const TYPE_COLOR = {
  Wild: '#a89878', Flora: '#5cae4e', Ember: '#e8663a', Tide: '#3f8fe0', Spark: '#e6bd22', Stone: '#9a7f5c',
  Gale: '#7fb6d6', Frost: '#6fcfe0', Venom: '#9a52c4', Mind: '#e0679f', Shade: '#5b4b86', Iron: '#8d98a8',
};
// attacker -> [strong against], [weak against]
const TYPE_STRONG = {
  Wild: [], Flora: ['Tide', 'Stone'], Ember: ['Flora', 'Frost', 'Iron'], Tide: ['Ember', 'Stone'],
  Spark: ['Tide', 'Gale'], Stone: ['Ember', 'Gale', 'Frost'], Gale: ['Flora', 'Venom'], Frost: ['Flora', 'Gale'],
  Venom: ['Flora', 'Mind'], Mind: ['Venom', 'Wild'], Shade: ['Mind', 'Shade'], Iron: ['Stone', 'Frost', 'Shade'],
};
const TYPE_WEAK = {
  Wild: ['Stone', 'Iron', 'Shade'], Flora: ['Ember', 'Flora', 'Gale', 'Venom', 'Iron'], Ember: ['Ember', 'Tide', 'Stone'],
  Tide: ['Tide', 'Flora', 'Frost'], Spark: ['Spark', 'Flora', 'Stone'], Stone: ['Flora', 'Iron', 'Stone'],
  Gale: ['Stone', 'Spark', 'Iron'], Frost: ['Ember', 'Tide', 'Frost', 'Iron'], Venom: ['Venom', 'Stone', 'Shade', 'Iron'],
  Mind: ['Mind', 'Shade', 'Iron'], Shade: ['Wild', 'Spark'], Iron: ['Iron', 'Ember', 'Tide', 'Spark'],
};
function typeMult(atk, defTypes) {
  let m = 1;
  for (const d of defTypes) {
    if (TYPE_STRONG[atk].includes(d)) m *= 2;
    else if (TYPE_WEAK[atk].includes(d)) m *= 0.5;
  }
  return m;
}

const STAT_KEYS = ['hp', 'atk', 'def', 'foc', 'wil', 'spd'];
const STAT_NAME = { hp: 'HP', atk: 'Might', def: 'Guard', foc: 'Focus', wil: 'Will', spd: 'Speed', acc: 'Aim' };
const STATUS_NAME = { burn: 'BRN', frost: 'FRB', poison: 'PSN', sleep: 'SLP', stun: 'STN' };
const STATUS_COLOR = { burn: '#e8663a', frost: '#6fcfe0', poison: '#9a52c4', sleep: '#8d98a8', stun: '#e6bd22' };
