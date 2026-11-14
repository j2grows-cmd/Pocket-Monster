# Tamers of Vessara

A monster-taming RPG that runs in the browser. 144 original monsters, an original region with eleven towns, eight wardens to beat and a crown to win. No build step and no dependencies. Monsters, battle scenes, portraits and icons are illustrated sheets in `assets/`; the overworld, tiles and interface are drawn by code, and so is a stand-in for any illustration that is missing.

![Title screen](docs/title.png)

| | |
|---|---|
| ![A town](docs/town.png) | ![A battle](docs/battle.png) |
| ![The team screen](docs/team.png) | ![A monster's summary](docs/summary.png) |
| ![The Journal](docs/journal.png) | ![The region map](docs/map.png) |

## Play

Open `index.html` in a browser. That is all it needs.

If your browser blocks local files, serve the folder instead:

```
python3 -m http.server 8000
```

and visit `http://localhost:8000`.

To put it online, turn on GitHub Pages for this repository (Settings, Pages, deploy from the `main` branch root).

### Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys or WASD | D-pad |
| Confirm, talk, fish | Z, Enter or Space | A |
| Back; hold to run | X, Esc or Shift | B |
| Menu | M or Tab | MENU |

The game saves to the browser's local storage. Use Save in the menu, or rest at any Hearth House.

## What is in it

- **144 monsters** in 69 evolution families, across 12 types. In Journal order they fall into nine groups of 16, one per 4x4 sprite sheet, and no evolution family is split across two sheets. Each has its own stats, learnset, catch rate, Journal entry and habitat.
- **Three starters**: Sprigkin (Flora), Kindleram (Ember) and Dewpup (Tide). Your rival takes the one that beats yours.
- **Turn-based battles** with physical, focus and status moves, 126 moves in all, five conditions (burn, frostbite, poison, sleep, stun), stat stages, critical hits, priority, multi-hit, drain and recoil.
- **Charms** for catching wild monsters, a six-monster team, and a Paddock for the rest.
- **One seamless overworld** of 196 by 110 tiles: 11 towns, 14 routes and 6 wild areas, with tall grass, fishing, 39 route tamers, hidden items and road wardens who check your sigils.
- **Eight wardens**, then four councillors and the High Warden at Crown Summit.
- **Six legendary monsters**, one waiting in each wild area. The last one only appears after you win the crown.
- Journal, team, bag, region map, shops whose stock grows with your sigils, and evolution scenes.

### Look and feel

- **One design system.** A night, parchment and gold palette, a pixel display face for names and headings, and a rounded sans for anything you read in a sentence. Panels, bars, chips, icons and key hints are shared by every screen (`js/ui.js`).
- **A living overworld.** Tile variants, soft path and shore edges, tall trees you can walk behind, shadows, swaying grass, moving water, pollen, fireflies, embers and snow by biome, and a day and night cycle with lit windows.
- **Battles with weight.** Painted backdrops per biome, a damage trail on HP bars, hit flashes, floating damage numbers, effectiveness callouts, and a move menu that shows type, power, aim and how well each move will land.
- **Illustrated art.** Every monster has its own sprite, each biome has a painted battle scene, and the wardens, councillors, Sage Maren, Corvin and the hero have full figures and portraits. Sigils and most items have illustrated icons.
- **Dialogue with faces.** Name plates and portraits for whoever is speaking.
- **Crisp at any size.** The 480 by 320 screen snaps to whole-number scales where it can, and the team screen switches to a single column on small displays.

### The region

| Town | Warden | Type |
|---|---|---|
| Mosswick | (home, Sage Maren's study) | |
| Brambleton | Fern | Flora |
| Port Calder | Marlow | Tide |
| Coilbridge | Volta | Spark |
| Stonehollow | Garnet | Stone |
| Emberfall | Ignacia | Ember |
| Windmere | Aerin | Gale |
| Duskwend | Morwen | Shade |
| Frostmere | Halvard | Frost |
| Solmarch | (crossroads, no warden) | |
| Crown Summit | The Council and the High Warden | |

Routes: Dewpath, Tidewalk, Saltmarsh, Whisperwood, Thornwood, Coil Road, Kingsroad, Quarry Trail, Cinder Climb, Skyreach, Lantern Road, Gloam Hollow, Rimewalk, Starfall Pass.

Wild areas: Sunken Coast, Deepquarry, Caldera, Stormspire, Mirror Lake, Origin Glade.

### Types

Wild, Flora, Ember, Tide, Spark, Stone, Gale, Frost, Venom, Mind, Shade, Iron.

Tide beats Ember, Ember beats Flora, Flora beats Tide. The full chart is in `js/core.js`, and people in the towns will tell you most of it.

## Code layout

```
index.html           page shell, header and touch pad
css/style.css        page styling
js/core.js           constants, random helpers, type chart
js/data/moves.js     all moves and the per-type move ladders
js/data/monsters.js  the 144 monsters and their learnsets
js/data/items.js     items and shop stock
js/data/world.js     the region: cells, tamers, wardens, map generation, interiors
js/ui.js             design system: palette, type, panels, bars, chips, icons
js/art.js            loads the illustrated sheets in assets/ and maps them to monsters, people and items
js/sprites.js        sprite cache, plus procedural pixel art for the overworld and for anything without an illustration
js/scenery.js        battle backdrops, title landscape, weather, daylight
js/state.js          save data, monster instances, stats
js/engine.js         canvas, game loop, input, dialogue box, menu primitives
js/screens.js        pause menu, team, bag, journal, map, shop, paddock, evolution, title
js/overworld.js      walking, world rendering, NPC scripts, encounters, fishing
js/battle.js         the battle system and its presentation
js/main.js           boot
tools/check.js       data and map checks
tools/art/           cuts the source illustrations into the sheets in assets/ (Python, Pillow, SciPy)
assets/              monster sprites at four sizes, battle scenes, title, people, faces, sigils, items
```

To add a monster, add a row to `FAMILIES` in `js/data/monsters.js` and put it in an encounter list in `js/data/world.js`. Its stand-in sprite is assembled from the body, colour and feature codes in that row.

### Art pipeline

The illustrations were generated from the prompts in `docs/sprite-prompts.md` and `docs/art-prompts.md` as 4x4 sheets on a flat magenta background. The source sheets are large and are not kept in this repository. To rebuild `assets/` from a folder holding `sheet-1.png` to `sheet-9.png`, the seven `bg-*.png` scenes, `characters.png`, `title.png` and `icons.png`:

```
python3 tools/art/build_mons.py  <source folder> assets
python3 tools/art/build_extra.py <source folder> assets
```

The cutter finds each figure as a connected shape, so sheets do not need to be exact grids, then removes the background, scales and reduces each sprite to a small palette. Monsters are indexed by Journal number, 12 to a row. Illustrated monsters have a front view only, so in battle your own monster is that view turned to face the foe.

### Checks

```
node tools/check.js
```

This confirms there are exactly 144 uniquely named monsters, every learnset and tamer team refers to things that exist, every monster family can be obtained somewhere, every town, door, sign, item and tamer on the map can be reached on foot, and no road warden can be walked around.

## Originality

All names, creatures, places and text were made for this project. The illustrations were produced with an image generator from this project's own prompts. It is a fan-made tribute to the monster-taming genre and is not affiliated with or endorsed by Nintendo, Game Freak or The Pokémon Company.
