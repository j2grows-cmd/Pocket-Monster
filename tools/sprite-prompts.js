/* Writes docs/sprite-prompts.md: nine image-generator prompts, one per 4x4 sprite sheet,
   built from the monster data so names, colours and features always match the game.
   Run: node tools/sprite-prompts.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({ console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } });
vm.runInContext(['core.js', 'data/moves.js', 'data/monsters.js'].map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n') + '\nthis.X = { DEX };', ctx);
const DEX = ctx.X.DEX;

const BODY = {
  quad: 'four-legged beast', bird: 'bird', bug: 'six-legged insect', blob: 'rounded blob creature', wing: 'flier with broad butterfly- or bat-like wings',
  plant: 'walking flower creature', fish: 'fish', biped: 'upright two-legged creature', golem: 'chunky golem made of boulders', shroom: 'mushroom creature with a wide cap',
  crab: 'crab with raised pincers', jelly: 'jellyfish with trailing tentacles', puff: 'round fluffy puffball', serpent: 'coiled serpent', orb: 'floating orb creature', ghost: 'floating ghost with a wispy tail',
};
const FEAT = {
  lf: 'leaf sprout on its head', er: 'round ears', ep: 'pointed ears', el: 'long upright ears', bl: 'pale belly patch', sp: 'row of spines down its back', tu: 'short tusks',
  hr: 'curled ram horns', tf: 'flame burning at its tail tip', mn: 'thick mane', tfin: 'fin-shaped tail', ic: 'ice crystals growing from its back', tn: 'slim tail', fng: 'small fangs',
  fc: 'feather crest', an: 'antennae', st: 'dark stripes', sd: 'spots', h1: 'single horn', wi: 'translucent insect wings', cr: 'crystals growing from its back',
  tb: 'zigzag lightning-bolt tail', h2: 'two horns', halo: 'glowing ring halo behind its head', eye1: 'one large single eye', ts: 'tail curled up over its back',
  fl: 'flame burning on its head', sh: 'polished metallic sheen', wd: 'dragon-like wings', wb: 'feathered wings', mk: 'pale face mask', cl: 'small cloud it rides on', tl: 'leaf-tipped tail',
};
const ELEMENT = { Wild: 'untamed beast', Flora: 'plant', Ember: 'fire', Tide: 'water', Spark: 'electric', Stone: 'rock', Gale: 'wind', Frost: 'ice', Venom: 'poison', Mind: 'psychic', Shade: 'shadow', Iron: 'metal' };
const EYES = { b: 'big round friendly eyes', d: 'alert confident eyes', a: 'fierce angled eyes', s: 'sleepy half-closed eyes' };

function colourName(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  if (s < .12) return l > .88 ? 'white' : l > .65 ? 'light grey' : l > .35 ? 'grey' : l > .16 ? 'charcoal' : 'black';
  if (s < .3 && l > .78) return h < 70 ? 'cream' : h < 200 ? 'pale mint' : 'pale lavender';
  if (h >= 15 && h < 50 && l < .55 && s < .65) return l < .32 ? 'dark brown' : 'brown';
  const hue = h < 12 ? 'red' : h < 32 ? 'orange' : h < 48 ? 'amber' : h < 65 ? 'yellow' : h < 95 ? 'lime green' : h < 150 ? 'green' : h < 178 ? 'teal' : h < 200 ? 'cyan' : h < 225 ? 'sky blue' : h < 250 ? 'blue' : h < 275 ? 'indigo' : h < 300 ? 'violet' : h < 335 ? 'pink' : 'red';
  const tone = l > .78 ? 'pale ' : l > .62 ? 'light ' : l < .28 ? 'dark ' : l < .42 ? 'deep ' : s < .4 ? 'muted ' : '';
  return tone + hue;
}
function stageWords(d) {
  if (d.legend) return 'legendary, majestic, largest on the sheet';
  if (d.stages === 1) return 'does not evolve, medium size';
  if (d.stage === 0) return 'small, cute first form';
  if (d.stage === d.stages - 1) return 'large, powerful final form';
  return 'medium middle form';
}
function describe(d, cellOf) {
  const a = d.art, feats = a.f.filter(k => FEAT[k]).map(k => FEAT[k]);
  const parts = [
    stageWords(d),
    BODY[a.b],
    colourName(a.c) + ' body (' + a.c + ') with ' + colourName(a.c2) + ' accents (' + a.c2 + ')',
  ];
  if (feats.length) parts.push(feats.join(', '));
  parts.push(EYES[a.eye]);
  parts.push(d.types.map(t => ELEMENT[t]).join(' and ') + ' element');
  let line = d.name + ': ' + parts.join('; ') + '.';
  if (d.stage > 0) line += ' Evolved from cell ' + cellOf[d.id - 1] + ': same species grown up, same colours and motifs.';
  return line;
}

const STYLE = [
  'STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature\'s own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.',
  'VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.',
  'BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.',
  'DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.',
];
function sheetPrompt(n) {
  const mons = DEX.slice((n - 1) * 16 + 1, n * 16 + 1), cellOf = {};
  mons.forEach((d, i) => { cellOf[d.id] = i + 1; });
  const lines = mons.map((d, i) => (i + 1) + '. (row ' + (Math.floor(i / 4) + 1) + ', column ' + (i % 4 + 1) + ') ' + describe(d, cellOf));
  return [
    'A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.',
    '', ...STYLE, '', 'THE 16 CELLS:', ...lines,
  ].join('\n');
}

const out = [];
out.push('# Sprite sheet prompts', '');
out.push('Nine prompts for an image generator, one per 4x4 sheet. Together they cover all 144 monsters in Journal order: sheet 1 is No. 001 to 016, sheet 2 is No. 017 to 032, and so on. No evolution family is split across two sheets, so each line is always drawn together.', '');
out.push('This file is generated from the game data by `node tools/sprite-prompts.js`. Edit the script, not this file.', '');
out.push('## How to use them', '');
out.push('1. Generate one sheet per prompt, as a square image, 2048 by 2048 if the generator allows (1024 by 1024 at minimum).');
out.push('2. Check the result against the cell list before keeping it. Generators often merge two cells, drop one, repeat one or shuffle the order. Regenerate until there are 16 distinct creatures in the right places.');
out.push('3. To keep one look across all nine, generate sheet 1 first, then attach it as a style reference for sheets 2 to 9 (or reuse the same seed and style settings if the tool has them).');
out.push('4. Save the keepers as `sheet-1.png` to `sheet-9.png`. Do not crop or rearrange them.');
out.push('5. The magenta background is there to be removed. If your generator can output a transparent background, ask for that instead and delete the BACKGROUND colour from the prompt.');
out.push('', 'The prompts describe the style in words and never name another game, on purpose: naming one pulls generators toward copying its characters.', '');
out.push('## What the game needs', '');
out.push('- Front sprites: these nine sheets. Each cell is cut out, the magenta removed, and scaled to 64 by 64 pixels.');
out.push('- Back sprites (optional): the same nine sheets seen from behind, for your own monster in battle. Use the follow-up prompt at the end with each front sheet attached. Without them the game keeps using its generated back views.', '');
for (let n = 1; n <= 9; n++) {
  const first = (n - 1) * 16 + 1, mons = DEX.slice(first, first + 16);
  out.push('## Sheet ' + n + ': No. ' + String(first).padStart(3, '0') + ' to ' + String(first + 15).padStart(3, '0'), '');
  out.push(mons.map(d => d.name).join(', '), '');
  out.push('```text', sheetPrompt(n), '```', '');
}
out.push('## Follow-up prompt: back views', '');
out.push('Attach the finished front sheet, then use:', '');
out.push('```text', 'Redraw this exact 4x4 sprite sheet with every creature seen from behind in a rear three-quarter view, facing away to the right, as the player\'s own monster appears in a battle. Keep the same 16 creatures in the same cells, the same colours, proportions, pixel-art style, palette and outline treatment. Show each creature\'s back, tail, wings, spines and the back of its head; no faces looking at the viewer. Same flat solid magenta (#FF00FF) background, no ground, no shadows, no text, no grid lines.', '```', '');
out.push('## Single-monster prompt', '');
out.push('For any creature the sheets get wrong, generate it alone. Paste its line from the cell list in place of the last sentence:', '');
out.push('```text', 'One original creature for a monster-taming RPG, as a single battle sprite centred on a flat solid magenta (#FF00FF) background.', '', STYLE[0], '', 'Front three-quarter view, facing left, whole body visible, no ground, no shadow, no text.', '', 'The creature: <paste its line here>', '```', '');
fs.writeFileSync(path.join(root, 'docs', 'sprite-prompts.md'), out.join('\n'));
console.log('wrote docs/sprite-prompts.md:', out.join('\n').length, 'characters; longest prompt', Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => sheetPrompt(n).length)), 'characters');
