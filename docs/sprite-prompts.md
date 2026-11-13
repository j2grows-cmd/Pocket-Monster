# Sprite sheet prompts

Nine prompts for an image generator, one per 4x4 sheet. Together they cover all 144 monsters in Journal order: sheet 1 is No. 001 to 016, sheet 2 is No. 017 to 032, and so on. No evolution family is split across two sheets, so each line is always drawn together.

This file is generated from the game data by `node tools/sprite-prompts.js`. Edit the script, not this file.

## How to use them

1. Generate one sheet per prompt, as a square image, 2048 by 2048 if the generator allows (1024 by 1024 at minimum).
2. Check the result against the cell list before keeping it. Generators often merge two cells, drop one, repeat one or shuffle the order. Regenerate until there are 16 distinct creatures in the right places.
3. To keep one look across all nine, generate sheet 1 first, then attach it as a style reference for sheets 2 to 9 (or reuse the same seed and style settings if the tool has them).
4. Save the keepers as `sheet-1.png` to `sheet-9.png`. Do not crop or rearrange them.
5. The magenta background is there to be removed. If your generator can output a transparent background, ask for that instead and delete the BACKGROUND colour from the prompt.

The prompts describe the style in words and never name another game, on purpose: naming one pulls generators toward copying its characters.

## What the game needs

- Front sprites: these nine sheets. Each cell is cut out, the magenta removed, and scaled to 64 by 64 pixels.
- Back sprites (optional): the same nine sheets seen from behind, for your own monster in battle. Use the follow-up prompt at the end with each front sheet attached. Without them the game keeps using its generated back views.

## Sheet 1: No. 001 to 016

Sprigkin, Thornkin, Briaroth, Kindleram, Scorchorn, Pyribex, Dewpup, Brookmaw, Torrentusk, Scampkin, Hoardrat, Flitwing, Galewing, Stormcrest, Whiskit, Prowlynx

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Sprigkin: small, cute first form; four-legged beast; green body (#6cbf5a) with pale lime green accents (#d4eeb0); leaf sprout on its head, round ears, pale belly patch; big round friendly eyes; plant element.
2. (row 1, column 2) Thornkin: medium middle form; four-legged beast; green body (#6cbf5a) with pale lime green accents (#d4eeb0); leaf sprout on its head, row of spines down its back, round ears, pale belly patch; alert confident eyes; plant element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Briaroth: large, powerful final form; four-legged beast; green body (#6cbf5a) with pale lime green accents (#d4eeb0); leaf sprout on its head, row of spines down its back, short tusks, round ears, pale belly patch; fierce angled eyes; plant and rock element. Evolved from cell 2: same species grown up, same colours and motifs.
4. (row 1, column 4) Kindleram: small, cute first form; four-legged beast; orange body (#e8743b) with amber accents (#f7d23e); curled ram horns, flame burning at its tail tip, pale belly patch; big round friendly eyes; fire element.
5. (row 2, column 1) Scorchorn: medium middle form; four-legged beast; orange body (#e8743b) with amber accents (#f7d23e); curled ram horns, flame burning at its tail tip, pale belly patch; alert confident eyes; fire element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Pyribex: large, powerful final form; four-legged beast; orange body (#e8743b) with amber accents (#f7d23e); curled ram horns, flame burning at its tail tip, thick mane, pale belly patch; fierce angled eyes; fire and untamed beast element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Dewpup: small, cute first form; four-legged beast; sky blue body (#4c9be8) with pale sky blue accents (#bfe6ff); round ears, fin-shaped tail, pale belly patch; big round friendly eyes; water element.
8. (row 2, column 4) Brookmaw: medium middle form; four-legged beast; sky blue body (#4c9be8) with pale sky blue accents (#bfe6ff); round ears, fin-shaped tail, short tusks, pale belly patch; alert confident eyes; water element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Torrentusk: large, powerful final form; four-legged beast; sky blue body (#4c9be8) with pale sky blue accents (#bfe6ff); fin-shaped tail, short tusks, ice crystals growing from its back, pale belly patch; fierce angled eyes; water and ice element. Evolved from cell 8: same species grown up, same colours and motifs.
10. (row 3, column 2) Scampkin: small, cute first form; four-legged beast; brown body (#b98a5a) with pale amber accents (#e6d2b0); round ears, slim tail, pale belly patch; big round friendly eyes; untamed beast element.
11. (row 3, column 3) Hoardrat: large, powerful final form; four-legged beast; brown body (#b98a5a) with pale amber accents (#e6d2b0); round ears, slim tail, small fangs, pale belly patch; alert confident eyes; untamed beast element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Flitwing: small, cute first form; bird; light sky blue body (#9fb7d9) with light amber accents (#e9d9a0); big round friendly eyes; wind element.
13. (row 4, column 1) Galewing: medium middle form; bird; light sky blue body (#9fb7d9) with light amber accents (#e9d9a0); feather crest; alert confident eyes; wind element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Stormcrest: large, powerful final form; bird; muted sky blue body (#5f7fb0) with light amber accents (#e9d9a0); feather crest; fierce angled eyes; wind and untamed beast element. Evolved from cell 13: same species grown up, same colours and motifs.
15. (row 4, column 3) Whiskit: small, cute first form; four-legged beast; amber body (#d9a441) with pale amber accents (#f2e2b8); pointed ears, slim tail, dark stripes, pale belly patch; big round friendly eyes; untamed beast element.
16. (row 4, column 4) Prowlynx: large, powerful final form; four-legged beast; amber body (#d9a441) with pale amber accents (#f2e2b8); pointed ears, slim tail, spots, small fangs, pale belly patch; fierce angled eyes; untamed beast element. Evolved from cell 15: same species grown up, same colours and motifs.
```

## Sheet 2: No. 017 to 032

Grublet, Silkshell, Gossamoth, Petalyn, Florabelle, Scrufflet, Packhound, Direfang, Zapbug, Shockshell, Thunderhorn, Tadpip, Fenhop, Boglord, Hootlet, Strixen

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Grublet: small, cute first form; six-legged insect; lime green body (#a6c94a) with muted indigo accents (#7a4fa0); antennae; big round friendly eyes; poison element.
2. (row 1, column 2) Silkshell: medium middle form; rounded blob creature; pale amber body (#d9d2b8) with light amber accents (#b0a890); dark stripes; sleepy half-closed eyes; poison element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Gossamoth: large, powerful final form; flier with broad butterfly- or bat-like wings; indigo body (#8f6bc2) with pale violet accents (#e6c5f2); antennae; alert confident eyes; poison and wind element. Evolved from cell 2: same species grown up, same colours and motifs.
4. (row 1, column 4) Petalyn: small, cute first form; walking flower creature; light red body (#f28cb1) with green accents (#6cbf5a); big round friendly eyes; plant element.
5. (row 2, column 1) Florabelle: large, powerful final form; walking flower creature; light pink body (#e86aa0) with green accents (#6cbf5a); feather crest; alert confident eyes; plant and psychic element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Scrufflet: small, cute first form; four-legged beast; brown body (#8c7a6b) with pale amber accents (#d9cbb8); pointed ears, slim tail, pale belly patch; big round friendly eyes; untamed beast element.
7. (row 2, column 3) Packhound: medium middle form; four-legged beast; brown body (#8c7a6b) with pale amber accents (#d9cbb8); pointed ears, slim tail, small fangs, pale belly patch; alert confident eyes; untamed beast element. Evolved from cell 6: same species grown up, same colours and motifs.
8. (row 2, column 4) Direfang: large, powerful final form; four-legged beast; deep indigo body (#4a4458) with light indigo accents (#b0a8c0); pointed ears, slim tail, small fangs, thick mane; fierce angled eyes; untamed beast and shadow element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Zapbug: small, cute first form; six-legged insect; yellow body (#f2d23e) with charcoal accents (#3a3a3a); antennae; big round friendly eyes; electric element.
10. (row 3, column 2) Shockshell: medium middle form; six-legged insect; yellow body (#f2d23e) with charcoal accents (#3a3a3a); antennae, single horn; alert confident eyes; electric element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Thunderhorn: large, powerful final form; six-legged insect; yellow body (#f2d23e) with charcoal accents (#3a3a3a); antennae, single horn, translucent insect wings; fierce angled eyes; electric and metal element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Tadpip: small, cute first form; fish; sky blue body (#5a8fd9) with pale sky blue accents (#cfe2f7); big round friendly eyes; water element.
13. (row 4, column 1) Fenhop: medium middle form; upright two-legged creature; muted green body (#4fae7a) with pale green accents (#d8f0c8); pale belly patch; alert confident eyes; water element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Boglord: large, powerful final form; upright two-legged creature; deep green body (#5a8a4a) with pale indigo accents (#c9b0e0); pale belly patch, spots; fierce angled eyes; water and poison element. Evolved from cell 13: same species grown up, same colours and motifs.
15. (row 4, column 3) Hootlet: small, cute first form; bird; brown body (#8a6f5a) with pale amber accents (#e6d2a8); big round friendly eyes; wind and psychic element.
16. (row 4, column 4) Strixen: large, powerful final form; bird; brown body (#8a6f5a) with pale amber accents (#e6d2a8); pointed ears; alert confident eyes; wind and psychic element. Evolved from cell 15: same species grown up, same colours and motifs.
```

## Sheet 3: No. 033 to 048

Pebblit, Cragmite, Boulderon, Capling, Sporecap, Mycolossus, Finlet, Sharpike, Clackit, Pincerock, Tidalcrag, Jellibub, Medusurge, Fizzlit, Ampossum, Lumifly

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Pebblit: small, cute first form; chunky golem made of boulders; grey body (#9a8f80) with light amber accents (#c8bfae); big round friendly eyes; rock element.
2. (row 1, column 2) Cragmite: medium middle form; chunky golem made of boulders; grey body (#9a8f80) with light amber accents (#c8bfae); crystals growing from its back; alert confident eyes; rock element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Boulderon: large, powerful final form; chunky golem made of boulders; grey body (#9a8f80) with light amber accents (#c8bfae); crystals growing from its back, row of spines down its back; fierce angled eyes; rock element. Evolved from cell 2: same species grown up, same colours and motifs.
4. (row 1, column 4) Capling: small, cute first form; mushroom creature with a wide cap; red body (#e05a4a) with pale amber accents (#f2e6d0); spots; big round friendly eyes; plant element.
5. (row 2, column 1) Sporecap: medium middle form; mushroom creature with a wide cap; pink body (#c2508a) with pale amber accents (#f2e6d0); spots; alert confident eyes; plant and poison element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Mycolossus: large, powerful final form; mushroom creature with a wide cap; muted indigo body (#7a4fa0) with pale amber accents (#f2e6d0); spots, row of spines down its back; fierce angled eyes; plant and poison element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Finlet: small, cute first form; fish; orange body (#f28c3a) with pale amber accents (#f7e0b0); big round friendly eyes; water element.
8. (row 2, column 4) Sharpike: large, powerful final form; fish; sky blue body (#5a7ad9) with pale blue accents (#d0d8f0); small fangs, row of spines down its back; fierce angled eyes; water element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Clackit: small, cute first form; crab with raised pincers; red body (#e0705a) with pale orange accents (#f7d0b8); big round friendly eyes; water and rock element.
10. (row 3, column 2) Pincerock: medium middle form; crab with raised pincers; brown body (#b0705a) with pale orange accents (#f7d0b8); crystals growing from its back; alert confident eyes; water and rock element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Tidalcrag: large, powerful final form; crab with raised pincers; muted sky blue body (#7a8a9a) with pale orange accents (#f7d0b8); crystals growing from its back, row of spines down its back; fierce angled eyes; water and rock element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Jellibub: small, cute first form; jellyfish with trailing tentacles; light indigo body (#c59af2) with pale indigo accents (#f0e0ff); big round friendly eyes; water and poison element.
13. (row 4, column 1) Medusurge: large, powerful final form; jellyfish with trailing tentacles; indigo body (#8f5ad9) with pale indigo accents (#f0e0ff); alert confident eyes; water and poison element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Fizzlit: small, cute first form; four-legged beast; amber body (#f2c83a) with dark brown accents (#6a5030); round ears, zigzag lightning-bolt tail; big round friendly eyes; electric element.
15. (row 4, column 3) Ampossum: large, powerful final form; four-legged beast; amber body (#f2c83a) with dark brown accents (#6a5030); round ears, zigzag lightning-bolt tail, dark stripes; alert confident eyes; electric and untamed beast element. Evolved from cell 14: same species grown up, same colours and motifs.
16. (row 4, column 4) Lumifly: does not evolve, medium size; flier with broad butterfly- or bat-like wings; light yellow body (#f2e05a) with green accents (#6cbf5a); antennae; big round friendly eyes; electric and plant element.
```

## Sheet 4: No. 049 to 064

Driftseed, Puffbloom, Zephyrose, Hissle, Coilfang, Venomaw, Padlet, Lotuslord, Zapfin, Voltail, Stormeel, Sparrowatt, Voltalon, Scrapkid, Brawlox, Bramblehog

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Driftseed: small, cute first form; round fluffy puffball; pale yellow body (#f2f2e0) with green accents (#6cbf5a); leaf sprout on its head; big round friendly eyes; plant and wind element.
2. (row 1, column 2) Puffbloom: medium middle form; round fluffy puffball; pale pink body (#f2e0f0) with green accents (#6cbf5a); leaf sprout on its head; alert confident eyes; plant and wind element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Zephyrose: large, powerful final form; walking flower creature; light red body (#f28cb1) with green accents (#6cbf5a); translucent insect wings; alert confident eyes; plant and wind element. Evolved from cell 2: same species grown up, same colours and motifs.
4. (row 1, column 4) Hissle: small, cute first form; coiled serpent; violet body (#9a5ac2) with pale violet accents (#e6d2f2); big round friendly eyes; poison element.
5. (row 2, column 1) Coilfang: medium middle form; coiled serpent; muted indigo body (#7a4aa0) with pale violet accents (#e6d2f2); small fangs; alert confident eyes; poison element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Venomaw: large, powerful final form; coiled serpent; deep indigo body (#5a3a7a) with pale violet accents (#e6d2f2); small fangs, two horns; fierce angled eyes; poison and shadow element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Padlet: small, cute first form; rounded blob creature; muted teal body (#4fae9a) with light red accents (#f28cb1); leaf sprout on its head; big round friendly eyes; plant and water element.
8. (row 2, column 4) Lotuslord: large, powerful final form; upright two-legged creature; muted teal body (#4fae9a) with light red accents (#f28cb1); leaf sprout on its head, feather crest; alert confident eyes; plant and water element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Zapfin: small, cute first form; fish; cyan body (#3ac2d9) with light yellow accents (#f2e05a); zigzag lightning-bolt tail; big round friendly eyes; electric and water element.
10. (row 3, column 2) Voltail: medium middle form; coiled serpent; cyan body (#3ac2d9) with light yellow accents (#f2e05a); zigzag lightning-bolt tail; alert confident eyes; electric and water element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Stormeel: large, powerful final form; coiled serpent; cyan body (#3ac2d9) with light yellow accents (#f2e05a); zigzag lightning-bolt tail, two horns; fierce angled eyes; electric and water element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Sparrowatt: small, cute first form; bird; yellow body (#f2d23e) with charcoal accents (#3a3a3a); big round friendly eyes; electric and wind element.
13. (row 4, column 1) Voltalon: large, powerful final form; bird; yellow body (#f2d23e) with charcoal accents (#3a3a3a); feather crest, zigzag lightning-bolt tail; fierce angled eyes; electric and wind element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Scrapkid: small, cute first form; upright two-legged creature; brown body (#c2734a) with pale orange accents (#f2d2b8); round ears; fierce angled eyes; untamed beast element.
15. (row 4, column 3) Brawlox: large, powerful final form; upright two-legged creature; grey body (#8a8fa0) with pale lavender accents (#d0d8e0); two horns; fierce angled eyes; untamed beast and metal element. Evolved from cell 14: same species grown up, same colours and motifs.
16. (row 4, column 4) Bramblehog: does not evolve, medium size; four-legged beast; muted lime green body (#7a9a4a) with pale amber accents (#e6d8b0); row of spines down its back, pale belly patch; alert confident eyes; plant and untamed beast element.
```

## Sheet 5: No. 065 to 080

Shalekid, Granitaur, Molbit, Drillox, Quakemaul, Mossling, Cairngrove, Rivlet, Cogrin, Anvilord, Orelet, Ingotan, Coilet, Turbinox, Crystare, Scorchid

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Shalekid: small, cute first form; four-legged beast; muted orange body (#a09080) with cream accents (#d8d0c0); two horns; big round friendly eyes; rock and untamed beast element.
2. (row 1, column 2) Granitaur: large, powerful final form; four-legged beast; muted orange body (#a09080) with cream accents (#d8d0c0); curled ram horns, thick mane; fierce angled eyes; rock and untamed beast element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Molbit: small, cute first form; four-legged beast; brown body (#7a6050) with light sky blue accents (#b0b8c2); pale belly patch; big round friendly eyes; rock element.
4. (row 1, column 4) Drillox: medium middle form; four-legged beast; brown body (#7a6050) with light sky blue accents (#b0b8c2); single horn, pale belly patch; alert confident eyes; rock and metal element. Evolved from cell 3: same species grown up, same colours and motifs.
5. (row 2, column 1) Quakemaul: large, powerful final form; upright two-legged creature; brown body (#7a6050) with light sky blue accents (#b0b8c2); single horn, short tusks; fierce angled eyes; rock and metal element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Mossling: small, cute first form; chunky golem made of boulders; grey body (#8a8f80) with green accents (#6cbf5a); leaf sprout on its head; big round friendly eyes; rock and plant element.
7. (row 2, column 3) Cairngrove: large, powerful final form; chunky golem made of boulders; grey body (#8a8f80) with green accents (#6cbf5a); leaf sprout on its head, row of spines down its back; alert confident eyes; rock and plant element. Evolved from cell 6: same species grown up, same colours and motifs.
8. (row 2, column 4) Rivlet: small, cute first form; floating orb creature; light sky blue body (#b0b8c2) with amber accents (#f2c83a); big round friendly eyes; metal element.
9. (row 3, column 1) Cogrin: medium middle form; upright two-legged creature; light grey body (#a0a8b4) with amber accents (#f2c83a); two horns; alert confident eyes; metal element. Evolved from cell 8: same species grown up, same colours and motifs.
10. (row 3, column 2) Anvilord: large, powerful final form; chunky golem made of boulders; grey body (#8a93a0) with amber accents (#f2c83a); crystals growing from its back; fierce angled eyes; metal element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Orelet: small, cute first form; chunky golem made of boulders; brown body (#a0764a) with amber accents (#f2c83a); big round friendly eyes; metal and rock element.
12. (row 3, column 4) Ingotan: large, powerful final form; chunky golem made of boulders; brown body (#c29a4a) with amber accents (#f2c83a); crystals growing from its back; fierce angled eyes; metal and rock element. Evolved from cell 11: same species grown up, same colours and motifs.
13. (row 4, column 1) Coilet: small, cute first form; floating orb creature; pale lavender body (#c2c8d2) with yellow accents (#f2d23e); zigzag lightning-bolt tail; big round friendly eyes; metal and electric element.
14. (row 4, column 2) Turbinox: large, powerful final form; floating orb creature; pale lavender body (#c2c8d2) with yellow accents (#f2d23e); zigzag lightning-bolt tail, glowing ring halo behind its head; fierce angled eyes; metal and electric element. Evolved from cell 13: same species grown up, same colours and motifs.
15. (row 4, column 3) Crystare: does not evolve, medium size; floating orb creature; light cyan body (#9ad9e0) with light pink accents (#e0a0d0); one large single eye, crystals growing from its back; alert confident eyes; rock and psychic element.
16. (row 4, column 4) Scorchid: does not evolve, medium size; walking flower creature; red body (#e8503a) with amber accents (#f2c83a); flame burning on its head; fierce angled eyes; fire and plant element.
```

## Sheet 6: No. 081 to 096

Tinmite, Mantiron, Stinglet, Scorpike, Embit, Pyrofinch, Scaldit, Newtorch, Coalet, Smeltjaw, Calderox, Ashling, Cindershade, Bulwarx, Cumulet, Nimbrawl

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Tinmite: small, cute first form; six-legged insect; light grey body (#a0a8b2) with indigo accents (#8f5ad9); antennae; big round friendly eyes; metal and poison element.
2. (row 1, column 2) Mantiron: large, powerful final form; upright two-legged creature; light grey body (#a0a8b2) with indigo accents (#8f5ad9); antennae, row of spines down its back; fierce angled eyes; metal and poison element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Stinglet: small, cute first form; crab with raised pincers; amber body (#c29a5a) with pale amber accents (#f2e0b8); tail curled up over its back; big round friendly eyes; poison and rock element.
4. (row 1, column 4) Scorpike: large, powerful final form; crab with raised pincers; brown body (#a07840) with pale amber accents (#f2e0b8); tail curled up over its back, row of spines down its back; fierce angled eyes; poison and rock element. Evolved from cell 3: same species grown up, same colours and motifs.
5. (row 2, column 1) Embit: small, cute first form; bird; orange body (#e8743b) with amber accents (#f7d23e); flame burning on its head; big round friendly eyes; fire and wind element.
6. (row 2, column 2) Pyrofinch: large, powerful final form; bird; orange body (#e8743b) with amber accents (#f7d23e); flame burning on its head, feather crest; fierce angled eyes; fire and wind element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Scaldit: small, cute first form; four-legged beast; red body (#e85a3a) with amber accents (#f7d23e); slim tail, pale belly patch; big round friendly eyes; fire element.
8. (row 2, column 4) Newtorch: large, powerful final form; four-legged beast; red body (#d0402a) with amber accents (#f7d23e); flame burning at its tail tip, flame burning on its head, pale belly patch; fierce angled eyes; fire element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Coalet: small, cute first form; chunky golem made of boulders; charcoal body (#4a4444) with orange accents (#f2743a); big round friendly eyes; fire and rock element.
10. (row 3, column 2) Smeltjaw: medium middle form; chunky golem made of boulders; dark brown body (#5a4a44) with orange accents (#f2743a); small fangs; alert confident eyes; fire and rock element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Calderox: large, powerful final form; chunky golem made of boulders; deep orange body (#6a4a40) with orange accents (#f2743a); small fangs, crystals growing from its back, flame burning on its head; fierce angled eyes; fire and rock element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Ashling: small, cute first form; floating ghost with a wispy tail; grey body (#6a5a5a) with orange accents (#f2743a); flame burning on its head; big round friendly eyes; fire and shadow element.
13. (row 4, column 1) Cindershade: large, powerful final form; floating ghost with a wispy tail; charcoal body (#4a4048) with orange accents (#f2743a); flame burning on its head, two horns; fierce angled eyes; fire and shadow element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Bulwarx: does not evolve, medium size; four-legged beast; grey body (#8a93a0) with pale lavender accents (#c8d0d8); single horn, polished metallic sheen; fierce angled eyes; metal and untamed beast element.
15. (row 4, column 3) Cumulet: small, cute first form; round fluffy puffball; white body (#f2f2f2) with pale sky blue accents (#bfe0f7); big round friendly eyes; wind element.
16. (row 4, column 4) Nimbrawl: large, powerful final form; round fluffy puffball; grey body (#7a8090) with light yellow accents (#f2e05a); zigzag lightning-bolt tail; fierce angled eyes; wind and electric element. Evolved from cell 15: same species grown up, same colours and motifs.
```

## Sheet 7: No. 097 to 112

Tinfeather, Razorwing, Skyray, Wyrmlet, Drakarn, Zephyrex, Ponderling, Musewisp, Oraclyth, Dozecub, Slumbruin, Musefly, Psywing, Sonarin, Stinkpod, Reekroot

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Tinfeather: small, cute first form; bird; light sky blue body (#b0b8c2) with pale lavender accents (#e0e6ee); big round friendly eyes; metal and wind element.
2. (row 1, column 2) Razorwing: large, powerful final form; bird; grey body (#8a93a0) with pale lavender accents (#e0e6ee); feather crest, row of spines down its back; fierce angled eyes; metal and wind element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Skyray: does not evolve, medium size; flier with broad butterfly- or bat-like wings; sky blue body (#5aa0e0) with pale sky blue accents (#d8ecfa); slim tail; alert confident eyes; wind and water element.
4. (row 1, column 4) Wyrmlet: small, cute first form; coiled serpent; muted teal body (#7ab0a0) with orange accents (#f2743a); two horns; big round friendly eyes; untamed beast element.
5. (row 2, column 1) Drakarn: medium middle form; four-legged beast; muted teal body (#4aa090) with orange accents (#f2743a); two horns, dragon-like wings, slim tail; alert confident eyes; wind and fire element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Zephyrex: large, powerful final form; upright two-legged creature; deep teal body (#3a9a8a) with orange accents (#f2743a); two horns, dragon-like wings, flame burning at its tail tip, row of spines down its back; fierce angled eyes; wind and fire element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Ponderling: small, cute first form; upright two-legged creature; light pink body (#e0a0d0) with pale pink accents (#f7e0f0); big round friendly eyes; psychic element.
8. (row 2, column 4) Musewisp: medium middle form; floating ghost with a wispy tail; light pink body (#d090d0) with pale pink accents (#f7e0f0); glowing ring halo behind its head; alert confident eyes; psychic element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Oraclyth: large, powerful final form; upright two-legged creature; muted violet body (#b070c0) with pale pink accents (#f7e0f0); glowing ring halo behind its head, two horns; alert confident eyes; psychic element. Evolved from cell 8: same species grown up, same colours and motifs.
10. (row 3, column 2) Dozecub: small, cute first form; four-legged beast; light violet body (#c2a0d0) with pale violet accents (#f2e6f7); round ears, pale belly patch; sleepy half-closed eyes; psychic and untamed beast element.
11. (row 3, column 3) Slumbruin: large, powerful final form; upright two-legged creature; muted indigo body (#a080b8) with pale violet accents (#f2e6f7); round ears, pale belly patch; sleepy half-closed eyes; psychic and untamed beast element. Evolved from cell 10: same species grown up, same colours and motifs.
12. (row 3, column 4) Musefly: small, cute first form; flier with broad butterfly- or bat-like wings; light pink body (#e0a0d0) with pale pink accents (#f7d8f0); antennae; big round friendly eyes; psychic and wind element.
13. (row 4, column 1) Psywing: large, powerful final form; flier with broad butterfly- or bat-like wings; muted pink body (#c070c0) with pale pink accents (#f7d8f0); antennae; alert confident eyes; psychic and wind element. Evolved from cell 12: same species grown up, same colours and motifs.
14. (row 4, column 2) Sonarin: does not evolve, medium size; fish; light blue body (#a0b0e8) with light pink accents (#e0a0d0); pale belly patch; big round friendly eyes; psychic and water element.
15. (row 4, column 3) Stinkpod: small, cute first form; walking flower creature; brown body (#9a8a3a) with indigo accents (#8f5ad9); sleepy half-closed eyes; poison and plant element.
16. (row 4, column 4) Reekroot: large, powerful final form; walking flower creature; brown body (#7a6a2a) with indigo accents (#8f5ad9); row of spines down its back; fierce angled eyes; poison and plant element. Evolved from cell 15: same species grown up, same colours and motifs.
```

## Sheet 8: No. 113 to 128

Dimlet, Gloamer, Nyxshade, Flitbat, Duskwing, Noctalon, Marrowpup, Gravehowl, Wiltling, Hollowillow, Maskit, Revelmask, Murkfin, Frostkit, Rimelynx, Blizzardine

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Dimlet: small, cute first form; floating ghost with a wispy tail; muted indigo body (#6a5a9a) with pale indigo accents (#c8b8f0); big round friendly eyes; shadow element.
2. (row 1, column 2) Gloamer: medium middle form; floating ghost with a wispy tail; deep indigo body (#5a4a8a) with pale indigo accents (#c8b8f0); two horns; alert confident eyes; shadow element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Nyxshade: large, powerful final form; floating ghost with a wispy tail; dark indigo body (#3a3058) with pale indigo accents (#c8b8f0); two horns, glowing ring halo behind its head; fierce angled eyes; shadow element. Evolved from cell 2: same species grown up, same colours and motifs.
4. (row 1, column 4) Flitbat: small, cute first form; flier with broad butterfly- or bat-like wings; deep indigo body (#5a4a7a) with light indigo accents (#c8a8e0); dragon-like wings, pointed ears; big round friendly eyes; shadow and wind element.
5. (row 2, column 1) Duskwing: medium middle form; flier with broad butterfly- or bat-like wings; deep indigo body (#4a3a6a) with light indigo accents (#c8a8e0); dragon-like wings, pointed ears; alert confident eyes; shadow and wind element. Evolved from cell 4: same species grown up, same colours and motifs.
6. (row 2, column 2) Noctalon: large, powerful final form; flier with broad butterfly- or bat-like wings; dark indigo body (#3a2a5a) with light indigo accents (#c8a8e0); dragon-like wings, pointed ears, small fangs; fierce angled eyes; shadow and wind element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Marrowpup: small, cute first form; four-legged beast; cream body (#e0dcd0) with deep indigo accents (#4a4458); pointed ears, slim tail; big round friendly eyes; shadow and untamed beast element.
8. (row 2, column 4) Gravehowl: large, powerful final form; four-legged beast; light amber body (#c8c4b8) with deep indigo accents (#4a4458); pointed ears, slim tail, small fangs, thick mane; fierce angled eyes; shadow and untamed beast element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Wiltling: small, cute first form; walking flower creature; brown body (#6a5a4a) with muted lime green accents (#8a9a6a); sleepy half-closed eyes; shadow and plant element.
10. (row 3, column 2) Hollowillow: large, powerful final form; chunky golem made of boulders; brown body (#6a5a4a) with muted lime green accents (#8a9a6a); leaf sprout on its head, two horns; fierce angled eyes; shadow and plant element. Evolved from cell 9: same species grown up, same colours and motifs.
11. (row 3, column 3) Maskit: small, cute first form; floating orb creature; pale amber body (#e8e0d0) with deep red accents (#8f3a5a); pale face mask; alert confident eyes; shadow and psychic element.
12. (row 3, column 4) Revelmask: large, powerful final form; floating ghost with a wispy tail; pale amber body (#e8e0d0) with deep red accents (#8f3a5a); pale face mask, two horns; fierce angled eyes; shadow and psychic element. Evolved from cell 11: same species grown up, same colours and motifs.
13. (row 4, column 1) Murkfin: does not evolve, medium size; fish; deep blue body (#3a3a5a) with light yellow accents (#f2e05a); antennae, small fangs; fierce angled eyes; shadow and water element.
14. (row 4, column 2) Frostkit: small, cute first form; four-legged beast; pale cyan body (#bfe6f2) with white accents (#ffffff); pointed ears, slim tail, pale belly patch; big round friendly eyes; ice element.
15. (row 4, column 3) Rimelynx: medium middle form; four-legged beast; pale cyan body (#a8d8ec) with white accents (#ffffff); pointed ears, slim tail, ice crystals growing from its back, pale belly patch; alert confident eyes; ice element. Evolved from cell 14: same species grown up, same colours and motifs.
16. (row 4, column 4) Blizzardine: large, powerful final form; four-legged beast; light sky blue body (#90c8e4) with white accents (#ffffff); pointed ears, slim tail, ice crystals growing from its back, thick mane, pale belly patch; fierce angled eyes; ice element. Evolved from cell 15: same species grown up, same colours and motifs.
```

## Sheet 9: No. 129 to 144

Floeflip, Bergwhale, Flurrywing, Borealight, Shiverling, Frostwraith, Rimerock, Glaciolith, Woolhorn, Clovertail, Orogrove, Leviarch, Solarion, Tempestros, Lunaveil, Vessarion

```text
A 4x4 sprite sheet: a square image divided into a strict grid of 16 equal square cells, 4 columns by 4 rows, with exactly one creature in each cell and nothing else. Cells are listed left to right, top to bottom.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.
VIEW: each creature is shown whole in a front three-quarter view, facing left, centred in its cell with clear space around it. Scale is consistent across the sheet: first forms fill about 55% of a cell, final forms and legendaries about 85%.
BACKGROUND: one flat solid magenta (#FF00FF) across the whole image. No ground, no cast shadows, no scenery, no frames, no grid lines, no text, no letters, no numbers, no labels, no logos, no watermark.
DESIGNS: all 16 are original creatures. Do not copy or resemble any existing franchise character. Each name hints at what the creature is based on (a name with "ram" in it suggests a ram, "pup" a puppy, "lynx" a wild cat); use that to give every creature its own animal or object identity, but never write the names in the image. Creatures in the same evolution line must look like the same species growing up.

THE 16 CELLS:
1. (row 1, column 1) Floeflip: small, cute first form; bird; muted sky blue body (#5a7ab0) with white accents (#ffffff); pale belly patch; big round friendly eyes; water and ice element.
2. (row 1, column 2) Bergwhale: large, powerful final form; fish; light sky blue body (#7ab0d9) with white accents (#ffffff); ice crystals growing from its back, pale belly patch; alert confident eyes; water and ice element. Evolved from cell 1: same species grown up, same colours and motifs.
3. (row 1, column 3) Flurrywing: small, cute first form; bird; pale sky blue body (#e0f0f8) with light cyan accents (#9ad0e8); big round friendly eyes; wind and ice element.
4. (row 1, column 4) Borealight: large, powerful final form; bird; pale sky blue body (#c8e8f8) with pale green accents (#b0f0c8); feather crest, glowing ring halo behind its head; alert confident eyes; wind and ice element. Evolved from cell 3: same species grown up, same colours and motifs.
5. (row 2, column 1) Shiverling: small, cute first form; floating ghost with a wispy tail; pale cyan body (#bfe6f2) with white accents (#ffffff); big round friendly eyes; ice and shadow element.
6. (row 2, column 2) Frostwraith: large, powerful final form; floating ghost with a wispy tail; light sky blue body (#8ab0d0) with white accents (#ffffff); ice crystals growing from its back, two horns; fierce angled eyes; ice and shadow element. Evolved from cell 5: same species grown up, same colours and motifs.
7. (row 2, column 3) Rimerock: small, cute first form; chunky golem made of boulders; light sky blue body (#9ab8c8) with pale cyan accents (#e0f4fa); ice crystals growing from its back; big round friendly eyes; ice and rock element.
8. (row 2, column 4) Glaciolith: large, powerful final form; chunky golem made of boulders; muted sky blue body (#7aa0b8) with pale cyan accents (#e0f4fa); ice crystals growing from its back, crystals growing from its back; fierce angled eyes; ice and rock element. Evolved from cell 7: same species grown up, same colours and motifs.
9. (row 3, column 1) Woolhorn: does not evolve, medium size; four-legged beast; pale amber body (#e8e0d0) with brown accents (#8a7a6a); curled ram horns, thick mane, pale belly patch; alert confident eyes; untamed beast and ice element.
10. (row 3, column 2) Clovertail: does not evolve, medium size; four-legged beast; light green body (#8ad07a) with light yellow accents (#f2e05a); long upright ears, leaf-tipped tail, pale belly patch; big round friendly eyes; untamed beast and plant element.
11. (row 3, column 3) Orogrove: legendary, majestic, largest on the sheet; four-legged beast; brown body (#7a6a4a) with green accents (#6cbf5a); curled ram horns, row of spines down its back, crystals growing from its back, leaf sprout on its head; fierce angled eyes; rock and plant element.
12. (row 3, column 4) Leviarch: legendary, majestic, largest on the sheet; coiled serpent; deep sky blue body (#2a4a8a) with light cyan accents (#9ad9e0); two horns, row of spines down its back; fierce angled eyes; water and shadow element.
13. (row 4, column 1) Solarion: legendary, majestic, largest on the sheet; bird; amber body (#f2a03a) with light yellow accents (#f2e05a); flame burning on its head, feather crest, glowing ring halo behind its head; fierce angled eyes; fire and psychic element.
14. (row 4, column 2) Tempestros: legendary, majestic, largest on the sheet; four-legged beast; muted blue body (#5a6a9a) with light yellow accents (#f2e05a); two horns, zigzag lightning-bolt tail, thick mane, small cloud it rides on; fierce angled eyes; wind and electric element.
15. (row 4, column 3) Lunaveil: legendary, majestic, largest on the sheet; flier with broad butterfly- or bat-like wings; deep blue body (#3a3a6a) with pale blue accents (#d0d8f2); glowing ring halo behind its head, pointed ears; alert confident eyes; shadow and ice element.
16. (row 4, column 4) Vessarion: legendary, majestic, largest on the sheet; upright two-legged creature; cream body (#f2f2e8) with amber accents (#e0b84a); two horns, dragon-like wings, slim tail, glowing ring halo behind its head; alert confident eyes; untamed beast and psychic element.
```

## Follow-up prompt: back views

Attach the finished front sheet, then use:

```text
Redraw this exact 4x4 sprite sheet with every creature seen from behind in a rear three-quarter view, facing away to the right, as the player's own monster appears in a battle. Keep the same 16 creatures in the same cells, the same colours, proportions, pixel-art style, palette and outline treatment. Show each creature's back, tail, wings, spines and the back of its head; no faces looking at the viewer. Same flat solid magenta (#FF00FF) background, no ground, no shadows, no text, no grid lines.
```

## Single-monster prompt

For any creature the sheets get wrong, generate it alone. Paste its line from the cell list in place of the last sentence:

```text
One original creature for a monster-taming RPG, as a single battle sprite centred on a flat solid magenta (#FF00FF) background.

STYLE: hand-pixelled 2D battle sprites for a classic handheld monster-collecting RPG. True pixel art: crisp square pixels, hard edges, no anti-aliasing, no blur, no gradients, no 3D render, no painterly texture. Each creature uses a small palette of about 12 to 16 colours with 3 or 4 shades per colour. Light comes from the top-left. Shadows shift toward blue-violet and highlights toward warm yellow. Outlines are one pixel wide in a dark tone of the creature's own colour, not pure black. Simple, readable silhouettes with one or two memorable features each. Large expressive eyes with a white catchlight. First forms are cute, middle forms are confident, final forms are powerful.

Front three-quarter view, facing left, whole body visible, no ground, no shadow, no text.

The creature: <paste its line here>
```
