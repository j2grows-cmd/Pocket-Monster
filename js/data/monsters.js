'use strict';
/* The 144 monsters of Vessara, in Journal order. Every 16 make one 4x4 sprite sheet, and no evolution
   family is split across two sheets.
   Row: [names, types per stage, stat profile, base-stat totals, evolve levels, catch rate,
         body per stage, colour, accent, features per stage, eyes per stage, journal entries, scale?]
   Art fields drive the procedural sprite painter in sprites.js. */
const FAMILIES = [
  ['Sprigkin,Thornkin,Briaroth', 'Flora,Flora,Flora/Stone', 'tank', [315, 410, 530], [16, 34], 45, 'quad', '6cbf5a', 'd4eeb0', 'lf er bl|lf sp er bl|lf sp tu er bl', 'b,d,a',
    ['It naps with its leaf turned to the sun and wakes up hungry.', 'The thorns on its back harden each time it wins a scuffle.', 'Old forests grow where a Briaroth chooses to sleep for a season.']],
  ['Kindleram,Scorchorn,Pyribex', 'Ember,Ember,Ember/Wild', 'phys', [315, 410, 530], [16, 34], 45, 'quad', 'e8743b', 'f7d23e', 'hr tf bl|hr tf bl|hr tf mn bl', 'b,d,a',
    ['Its tail flame gutters when it is embarrassed.', 'It butts boulders to keep its horns hot.', 'It climbs volcano walls at a gallop, leaving glowing hoofprints.']],
  ['Dewpup,Brookmaw,Torrentusk', 'Tide,Tide,Tide/Frost', 'bal', [315, 410, 530], [16, 34], 45, 'quad', '4c9be8', 'bfe6ff', 'er tfin bl|er tfin tu bl|tfin tu ic bl', 'b,d,a',
    ['It slides down wet banks on its belly, over and over.', 'It can hold a river stone in its jaws all day without noticing.', 'Its tusks carve channels through sea ice for smaller swimmers to follow.']],
  ['Scampkin,Hoardrat', 'Wild', 'fast', [270, 420], [14], 220, 'quad', 'b98a5a', 'e6d2b0', 'er tn bl|er tn fng bl', 'b,d',
    ['Steals one berry, then comes back for the bush.', 'Its burrow holds more buttons and coins than food.']],
  ['Flitwing,Galewing,Stormcrest', 'Gale,Gale,Gale/Wild', 'fast', [260, 360, 490], [14, 30], 200, 'bird', '9fb7d9,9fb7d9,5f7fb0', 'e9d9a0', '|fc|fc', 'b,d,a',
    ['It follows travellers hoping for crumbs.', 'It rides thermals for hours with barely a wingbeat.', 'Sailors read tomorrow\'s weather from the angle of its crest.']],
  ['Whiskit,Prowlynx', 'Wild', 'fast', [290, 440], [20], 180, 'quad', 'd9a441', 'f2e2b8', 'ep tn st bl|ep tn sd fng bl', 'b,a',
    ['It pretends not to care whether you notice it.', 'It walks without sound and expects applause for it.']],
  ['Grublet,Silkshell,Gossamoth', 'Venom,Venom,Venom/Gale', 'cast', [200, 230, 410], [7, 12], 240, 'bug,blob,wing', 'a6c94a,d9d2b8,8f6bc2', '7a4fa0,b0a890,e6c5f2', 'an|st|an', 'b,s,d',
    ['Eats its own weight in leaves before noon.', 'Inside the shell, everything is being rearranged.', 'Dust from its wings makes lantern light look violet.']],
  ['Petalyn,Florabelle', 'Flora,Flora/Mind', 'cast', [290, 460], [22], 150, 'plant', 'f28cb1,e86aa0', '6cbf5a', '|fc', 'b,d',
    ['It turns to face whoever is speaking.', 'Its slow dance settles arguments between other monsters.']],
  ['Scrufflet,Packhound,Direfang', 'Wild,Wild,Wild/Shade', 'phys', [280, 390, 510], [18, 36], 150, 'quad', '8c7a6b,8c7a6b,4a4458', 'd9cbb8,d9cbb8,b0a8c0', 'ep tn bl|ep tn fng bl|ep tn fng mn', 'b,d,a',
    ['It howls at kettles, doors and the moon equally.', 'A pack shares food by rank, and rank by play-fights.', 'It hunts at dusk and is gone before its shadow.']],
  ['Zapbug,Shockshell,Thunderhorn', 'Spark,Spark,Spark/Iron', 'mix', [270, 380, 500], [15, 32], 170, 'bug', 'f2d23e', '3a3a3a', 'an|an h1|an h1 wi', 'b,d,a',
    ['Rub its back and your hair stands up.', 'It stores charge in its shell and clicks when full.', 'Its horn draws lightning down and holds it.']],
  ['Tadpip,Fenhop,Boglord', 'Tide,Tide,Tide/Venom', 'bal', [270, 380, 500], [17, 35], 180, 'fish,biped,biped', '5a8fd9,4fae7a,5a8a4a', 'cfe2f7,d8f0c8,c9b0e0', '|bl|bl sd', 'b,d,a',
    ['Mostly tail and good intentions.', 'It can leap a pond but prefers to sit in it.', 'It rules its swamp from one particular log.']],
  ['Hootlet,Strixen', 'Gale/Mind', 'cast', [290, 450], [24], 150, 'bird', '8a6f5a', 'e6d2a8', '|ep', 'b,d',
    ['It stares until you feel you owe it an answer.', 'It remembers every face that has walked under its tree.']],
  ['Pebblit,Cragmite,Boulderon', 'Stone', 'tank', [280, 390, 500], [20, 36], 170, 'golem', '9a8f80', 'c8bfae', '|cr|cr sp', 'b,d,a',
    ['Often mistaken for a stone until it sneezes.', 'It adds a layer of rock for every winter it survives.', 'It moves one step a day, and nothing moves it back.']],
  ['Capling,Sporecap,Mycolossus', 'Flora,Flora/Venom,Flora/Venom', 'wall', [270, 380, 500], [18, 36], 170, 'shroom', 'e05a4a,c2508a,7a4fa0', 'f2e6d0', 'sd|sd|sd sp', 'b,d,a',
    ['Sprouts overnight wherever it rained.', 'Its spores smell like wet bread.', 'Whole groves are connected under its feet.']],
  ['Finlet,Sharpike', 'Tide', 'fast', [260, 440], [22], 200, 'fish', 'f28c3a,5a7ad9', 'f7e0b0,d0d8f0', '|fng sp', 'b,a',
    ['Swims in shoals that turn all at once.', 'It strikes from below, faster than the ripple it makes.']],
  ['Clackit,Pincerock,Tidalcrag', 'Tide/Stone', 'tank', [280, 390, 505], [20, 38], 170, 'crab', 'e0705a,b0705a,7a8a9a', 'f7d0b8', '|cr|cr sp', 'b,d,a',
    ['It claps its claws at anything larger than itself.', 'Barnacles on its shell are tenants, and it charges rent.', 'Tide pools form in the hollows of its back.']],
  ['Jellibub,Medusurge', 'Tide/Venom', 'cast', [280, 450], [26], 170, 'jelly', 'c59af2,8f5ad9', 'f0e0ff', '|', 'b,d',
    ['Drifts wherever the current is going anyway.', 'Its trailing arms glow before a storm.']],
  ['Fizzlit,Ampossum', 'Spark,Spark/Wild', 'fcast', [290, 450], [22], 170, 'quad', 'f2c83a', '6a5030', 'er tb|er tb st', 'b,d',
    ['Its fur crackles when it is excited, which is always.', 'It plays dead, then shocks whoever comes to check.']],
  ['Lumifly', 'Spark/Flora', 'fcast', [430], [], 90, 'wing', 'f2e05a', '6cbf5a', 'an', 'b',
    ['Meadows full of them blink in slow, shared patterns.']],
  ['Driftseed,Puffbloom,Zephyrose', 'Flora/Gale', 'fcast', [250, 360, 490], [16, 32], 180, 'puff,puff,plant', 'f2f2e0,f2e0f0,f28cb1', '6cbf5a', 'lf|lf|wi', 'b,d,d',
    ['A strong sneeze can send it into the next field.', 'It steers by puffing out one cheek.', 'Petals from its flight path take root where they land.']],
  ['Hissle,Coilfang,Venomaw', 'Venom,Venom,Venom/Shade', 'phys', [280, 390, 505], [20, 38], 160, 'serpent', '9a5ac2,7a4aa0,5a3a7a', 'e6d2f2', '|fng|fng h2', 'b,d,a',
    ['It practises looking dangerous in puddles.', 'It coils around warm rocks and resents being moved.', 'One drop of its venom clears a pond for a year.']],
  ['Padlet,Lotuslord', 'Flora/Tide', 'wall', [290, 460], [26], 150, 'blob,biped', '4fae9a', 'f28cb1', 'lf|lf fc', 'b,d',
    ['It floats face-up and watches clouds.', 'Ponds stay clear for as long as one lives there.']],
  ['Zapfin,Voltail,Stormeel', 'Spark/Tide', 'mix', [270, 380, 505], [20, 38], 150, 'fish,serpent,serpent', '3ac2d9', 'f2e05a', 'tb|tb|tb h2', 'b,d,a',
    ['It lights its own way through murky water.', 'Its tail hums like a wire in the wind.', 'Lakes flash from below when it is angry.']],
  ['Sparrowatt,Voltalon', 'Spark/Gale', 'fast', [290, 460], [25], 150, 'bird', 'f2d23e', '3a3a3a', '|fc tb', 'b,a',
    ['Perches on anything metal to top itself up.', 'It dives with a crack like a snapped cable.']],
  ['Scrapkid,Brawlox', 'Wild,Wild/Iron', 'phys', [300, 470], [28], 150, 'biped', 'c2734a,8a8fa0', 'f2d2b8,d0d8e0', 'er|h2', 'a,a',
    ['It picks fights with fence posts to stay sharp.', 'It wears scrap plating it hammered out itself.']],
  ['Bramblehog', 'Flora/Wild', 'tank', [440], [], 100, 'quad', '7a9a4a', 'e6d8b0', 'sp bl', 'd',
    ['Berries grow on its quills, and it will not share them.']],
  ['Shalekid,Granitaur', 'Stone/Wild', 'phys', [300, 470], [28], 150, 'quad', 'a09080', 'd8d0c0', 'h2|hr mn', 'b,a',
    ['It climbs cliffs for the view and forgets how to get down.', 'It settles disputes on ledges a hand wide.']],
  ['Molbit,Drillox,Quakemaul', 'Stone,Stone/Iron,Stone/Iron', 'phys', [280, 395, 515], [22, 40], 150, 'quad,quad,biped', '7a6050', 'b0b8c2', 'bl|h1 bl|h1 tu', 'b,d,a',
    ['It surfaces, squints, and goes back down.', 'Its nose spins fast enough to bore through slate.', 'Miners follow the tunnels it leaves and never find the end.']],
  ['Mossling,Cairngrove', 'Stone/Flora', 'wall', [300, 470], [30], 140, 'golem', '8a8f80', '6cbf5a', 'lf|lf sp', 'b,d',
    ['A pebble that decided to grow a garden.', 'Birds nest in it and it has stopped minding.']],
  ['Rivlet,Cogrin,Anvilord', 'Iron', 'tank', [285, 400, 520], [24, 42], 140, 'orb,biped,golem', 'b0b8c2,a0a8b4,8a93a0', 'f2c83a', '|h2|cr', 'b,d,a',
    ['It rattles when it laughs.', 'Its joints tick in time when it is thinking.', 'Smiths bow to it before lighting a forge.']],
  ['Orelet,Ingotan', 'Iron/Stone', 'tank', [300, 475], [32], 140, 'golem', 'a0764a,c29a4a', 'f2c83a', '|cr', 'b,a',
    ['It is found wherever the rock is richest.', 'It melts itself down a little each year and recasts stronger.']],
  ['Coilet,Turbinox', 'Iron/Spark', 'cast', [300, 470], [30], 140, 'orb', 'c2c8d2', 'f2d23e', 'tb|tb halo', 'b,a',
    ['It spins when happy and sparks when it spins.', 'Towns once ran their mills from a single Turbinox.']],
  ['Crystare', 'Stone/Mind', 'cast', [450], [], 80, 'orb', '9ad9e0', 'e0a0d0', 'eye1 cr', 'd',
    ['It watches cave mouths and blinks once a week.']],
  ['Scorchid', 'Ember/Flora', 'cast', [450], [], 80, 'plant', 'e8503a', 'f2c83a', 'fl', 'a',
    ['It blooms only on ground too hot to stand on.']],
  ['Tinmite,Mantiron', 'Iron/Venom', 'fast', [290, 470], [31], 140, 'bug,biped', 'a0a8b2', '8f5ad9', 'an|an sp', 'b,a',
    ['It chews rust and leaves metal shining.', 'Its forearms are honed to a mirror edge.']],
  ['Stinglet,Scorpike', 'Venom/Stone', 'phys', [295, 465], [30], 140, 'crab', 'c29a5a,a07840', 'f2e0b8', 'ts|ts sp', 'b,a',
    ['It waves its tail to look taller.', 'It buries itself to the eyes and waits for footsteps.']],
  ['Embit,Pyrofinch', 'Ember/Gale', 'fcast', [290, 460], [28], 150, 'bird', 'e8743b', 'f7d23e', 'fl|fl fc', 'b,a',
    ['Its chirps come out as tiny smoke rings.', 'Its wingbeats fan brushfires, then put them out.']],
  ['Scaldit,Newtorch', 'Ember', 'mix', [300, 470], [30], 150, 'quad', 'e85a3a,d0402a', 'f7d23e', 'tn bl|tf fl bl', 'b,a',
    ['It sleeps on hot stones and sizzles in rain.', 'The crest on its head burns hotter than its tail.']],
  ['Coalet,Smeltjaw,Calderox', 'Ember/Stone', 'tank', [285, 400, 520], [26, 44], 130, 'golem', '4a4444,5a4a44,6a4a40', 'f2743a', '|fng|fng cr fl', 'b,d,a',
    ['Warm to hold, and it likes being held.', 'Molten rock drips from its jaw when it yawns.', 'It sleeps in craters and wakes when the mountain does.']],
  ['Ashling,Cindershade', 'Ember/Shade', 'cast', [300, 470], [33], 130, 'ghost', '6a5a5a,4a4048', 'f2743a', 'fl|fl h2', 'b,a',
    ['It rises from campfires that were left to die.', 'It walks burned forests, keeping the last embers lit.']],
  ['Bulwarx', 'Iron/Wild', 'tank', [470], [], 70, 'quad', '8a93a0', 'c8d0d8', 'h1 sh', 'a',
    ['It charges in a straight line and lets the world rearrange itself.']],
  ['Cumulet,Nimbrawl', 'Gale,Gale/Spark', 'cast', [290, 465], [32], 150, 'puff', 'f2f2f2,7a8090', 'bfe0f7,f2e05a', '|tb', 'b,a',
    ['It rains a little when it is sad.', 'It rumbles before it moves, to be fair to everyone.']],
  ['Tinfeather,Razorwing', 'Iron/Gale', 'fast', [295, 470], [33], 140, 'bird', 'b0b8c2,8a93a0', 'e0e6ee', '|fc sp', 'b,a',
    ['Its feathers chime when it preens.', 'It cuts kite strings for sport.']],
  ['Skyray', 'Gale/Tide', 'bal', [460], [], 80, 'wing', '5aa0e0', 'd8ecfa', 'tn', 'd',
    ['It leaps from the sea and simply keeps going.']],
  ['Wyrmlet,Drakarn,Zephyrex', 'Wild,Gale/Ember,Gale/Ember', 'mix', [300, 420, 600], [30, 50], 45, 'serpent,quad,biped', '7ab0a0,4aa090,3a9a8a', 'f2743a', 'h2|h2 wd tn|h2 wd tf sp', 'b,d,a',
    ['It hisses at clouds, sure it will reach them one day.', 'Its first flight usually ends in a tree.', 'It circles the highest peaks and lands for no one.']],
  ['Ponderling,Musewisp,Oraclyth', 'Mind', 'cast', [270, 385, 510], [22, 40], 140, 'biped,ghost,biped', 'e0a0d0,d090d0,b070c0', 'f7e0f0', '|halo|halo h2', 'b,d,d',
    ['It tilts its head at questions nobody asked aloud.', 'It hums the tune you had stuck in your head.', 'It answers truthfully, which is why few people ask.']],
  ['Dozecub,Slumbruin', 'Mind/Wild', 'wall', [300, 475], [30], 140, 'quad,biped', 'c2a0d0,a080b8', 'f2e6f7', 'er bl|er bl', 's,s',
    ['It falls asleep mid-step and finishes the step later.', 'Anything near its snoring dreams the same dream.']],
  ['Musefly,Psywing', 'Mind/Gale', 'fcast', [290, 460], [31], 140, 'wing', 'e0a0d0,c070c0', 'f7d8f0', 'an|an', 'b,d',
    ['Its wing patterns change with its mood.', 'Staring at its wings makes you forget the last minute.']],
  ['Sonarin', 'Mind/Tide', 'cast', [460], [], 80, 'fish', 'a0b0e8', 'e0a0d0', 'bl', 'b',
    ['It sings to map the water, and to say hello.']],
  ['Stinkpod,Reekroot', 'Venom/Flora', 'wall', [295, 465], [29], 150, 'plant', '9a8a3a,7a6a2a', '8f5ad9', '|sp', 's,a',
    ['Step on it once and you will know for days.', 'Its roots travel a long way looking for something to spoil.']],
  ['Dimlet,Gloamer,Nyxshade', 'Shade', 'cast', [270, 385, 510], [24, 42], 140, 'ghost', '6a5a9a,5a4a8a,3a3058', 'c8b8f0', '|h2|h2 halo', 'b,d,a',
    ['It hides in coat pockets and unlit lamps.', 'Candles burn low and blue when it passes.', 'Night arrives a little early wherever it settles.']],
  ['Flitbat,Duskwing,Noctalon', 'Shade/Gale', 'fast', [260, 375, 500], [22, 40], 170, 'wing', '5a4a7a,4a3a6a,3a2a5a', 'c8a8e0', 'wd ep|wd ep|wd ep fng', 'b,d,a',
    ['It hangs from eaves and squeaks at the moon.', 'It hunts by listening for heartbeats.', 'Its wings blot out the stars it flies under.']],
  ['Marrowpup,Gravehowl', 'Shade/Wild', 'phys', [300, 470], [34], 130, 'quad', 'e0dcd0,c8c4b8', '4a4458', 'ep tn|ep tn fng mn', 'b,a',
    ['It buries bones and then guards the wrong spot.', 'Its howl carries to places sound should not reach.']],
  ['Wiltling,Hollowillow', 'Shade/Flora', 'wall', [300, 475], [34], 130, 'plant,golem', '6a5a4a', '8a9a6a', '|lf h2', 's,a',
    ['A sapling that grew where no light did.', 'Travellers shelter in its trunk and wake up further along the road.']],
  ['Maskit,Revelmask', 'Shade/Mind', 'fcast', [300, 470], [35], 130, 'orb,ghost', 'e8e0d0', '8f3a5a', 'mk|mk h2', 'd,a',
    ['Nobody has seen what is behind it.', 'It wears a different expression for every watcher.']],
  ['Murkfin', 'Shade/Tide', 'phys', [460], [], 70, 'fish', '3a3a5a', 'f2e05a', 'an fng', 'a',
    ['The light on its head is the last friendly thing you see.']],
  ['Frostkit,Rimelynx,Blizzardine', 'Frost', 'fast', [280, 395, 520], [26, 44], 140, 'quad', 'bfe6f2,a8d8ec,90c8e4', 'ffffff', 'ep tn bl|ep tn ic bl|ep tn ic mn bl', 'b,d,a',
    ['It pounces on snowflakes one at a time.', 'Frost creeps out from each pawprint.', 'It runs ahead of the blizzard, never behind.']],
  ['Floeflip,Bergwhale', 'Tide/Frost', 'wall', [300, 480], [34], 140, 'bird,fish', '5a7ab0,7ab0d9', 'ffffff', 'bl|ic bl', 'b,d',
    ['It sleds on its stomach and steers with its beak.', 'Its back looks like an island until it breathes out.']],
  ['Flurrywing,Borealight', 'Gale/Frost', 'fcast', [295, 470], [35], 140, 'bird', 'e0f0f8,c8e8f8', '9ad0e8,b0f0c8', '|fc halo', 'b,d',
    ['It shakes snow from its wings onto anyone below.', 'Its tail trails green light across winter skies.']],
  ['Shiverling,Frostwraith', 'Frost/Shade', 'cast', [295, 470], [36], 130, 'ghost', 'bfe6f2,8ab0d0', 'ffffff', '|ic h2', 'b,a',
    ['It is the cold spot in an otherwise warm room.', 'It walks frozen lakes, tapping to hear who answers.']],
  ['Rimerock,Glaciolith', 'Frost/Stone', 'tank', [300, 480], [36], 130, 'golem', '9ab8c8,7aa0b8', 'e0f4fa', 'ic|ic cr', 'b,a',
    ['A rock that never thawed.', 'It is older than the valley it carved.']],
  ['Woolhorn', 'Wild/Frost', 'tank', [465], [], 70, 'quad', 'e8e0d0', '8a7a6a', 'hr mn bl', 'd',
    ['Snow piles on its back and it does not notice.']],
  ['Clovertail', 'Wild/Flora', 'bal', [470], [], 45, 'quad', '8ad07a', 'f2e05a', 'el tl bl', 'b',
    ['Seeing one is lucky. Catching one is luckier.']],
  ['Orogrove', 'Stone/Flora', 'tank', [590], [], 5, 'quad', '7a6a4a', '6cbf5a', 'hr sp cr lf', 'a',
    ['The hills of Vessara are said to be where it once lay down.'], 1.08],
  ['Leviarch', 'Tide/Shade', 'mix', [590], [], 5, 'serpent', '2a4a8a', '9ad9e0', 'h2 sp', 'a',
    ['It turns once in its sleep and the tide changes.'], 1.08],
  ['Solarion', 'Ember/Mind', 'cast', [590], [], 5, 'bird', 'f2a03a', 'f2e05a', 'fl fc halo', 'a',
    ['Its shadow is warm, and crops grow where it falls.'], 1.08],
  ['Tempestros', 'Gale/Spark', 'fast', [590], [], 5, 'quad', '5a6a9a', 'f2e05a', 'h2 tb mn cl', 'a',
    ['It gallops along the top of storm clouds.'], 1.08],
  ['Lunaveil', 'Shade/Frost', 'wall', [590], [], 5, 'wing', '3a3a6a', 'd0d8f2', 'halo ep', 'd',
    ['It appears over still water on the clearest nights.'], 1.08],
  ['Vessarion', 'Wild/Mind', 'bal', [630], [], 3, 'biped', 'f2f2e8', 'e0b84a', 'h2 wd tn halo', 'd',
    ['The first of all monsters, or the last. The stories disagree.'], 1.08],
];

const STAT_PROFILE = {
  bal: [1, 1, 1, 1, 1, 1], phys: [1.1, 1.45, 1.0, 0.55, 0.8, 1.1], tank: [1.3, 1.1, 1.45, 0.6, 1.1, 0.45],
  fast: [0.8, 1.3, 0.75, 0.6, 0.75, 1.6], cast: [0.95, 0.55, 0.8, 1.5, 1.15, 1.05], fcast: [0.75, 0.5, 0.65, 1.55, 0.9, 1.65],
  wall: [1.45, 0.6, 1.05, 1.0, 1.5, 0.4], mix: [1, 1.25, 0.85, 1.25, 0.8, 0.85],
};

function buildLearnset(id, types, lean) {
  const off = lean === 'P' ? 'F' : 'P';
  const t1 = types[0], t2 = types[1] || null;
  const L1 = LADDER[t1], L2 = t2 ? LADDER[t2] : null, W = LADDER.Wild;
  const out = [], seen = new Set();
  const add = (lvl, mv) => { if (mv && !seen.has(mv)) { seen.add(mv); out.push([lvl, mv]); } };
  add(1, W[lean][0]);
  add(3, id % 2 ? 'Bristle' : 'Stare Down');
  add(6, t1 !== 'Wild' ? L1[lean][0] : (lean === 'P' ? 'Quick Jab' : 'Focus Up'));
  add(8, L1.S[0]);
  add(11, L2 ? L2[lean][0] : (lean === 'P' ? 'Quick Jab' : 'Focus Up'));
  add(15, L1[lean][1]);
  add(19, L2 ? L2.S[0] : (lean === 'P' ? 'Rally' : 'Focus Up'));
  add(23, L2 ? L2[lean][1] : (t1 === 'Wild' ? 'Frenzy' : W[lean][1]));
  add(27, L1.S[1]);
  add(31, L1[lean][2]);
  add(35, L1[off][1]);
  add(39, L2 ? L2[lean][2] : W[lean][2]);
  add(44, L2 ? L2.S[1] : 'Rest Up');
  add(48, L1[lean][3]);
  add(54, L2 ? L2[lean][3] : W[lean][3]);
  return out;
}

/* Each monster's stat spread and one early move are seeded by a number. These are the Journal numbers the
   families had before the roster was reordered into sheets, so reordering never changed anyone's stats or moves.
   Families not listed use their current number. */
const SEEDS = { Grublet: 15, Whiskit: 18, Pebblit: 31, Hootlet: 34, Driftseed: 48, Hissle: 51, Lumifly: 54, Scrapkid: 64, Bramblehog: 66, Shalekid: 67, Molbit: 69, Mossling: 72, Rivlet: 74, Orelet: 77, Coilet: 79, Crystare: 81, Tinmite: 82, Stinglet: 84, Embit: 86, Scaldit: 88, Coalet: 90, Ashling: 93, Scorchid: 95, Bulwarx: 96, Cumulet: 97, Tinfeather: 99, Skyray: 101, Wyrmlet: 103, Ponderling: 106, Dozecub: 109, Musefly: 111, Sonarin: 113, Stinkpod: 116, Dimlet: 118, Flitbat: 121, Marrowpup: 124, Wiltling: 126, Maskit: 128, Murkfin: 130, Frostkit: 131, Floeflip: 134, Flurrywing: 136, Shiverling: 138, Rimerock: 140, Woolhorn: 142, Clovertail: 145, Orogrove: 146, Leviarch: 147, Solarion: 148, Tempestros: 149, Lunaveil: 150, Vessarion: 151 };
const DEX = [null];
(function () {
  const pick = (list, i) => list[Math.min(i, list.length - 1)];
  let id = 0;
  FAMILIES.forEach((f, fi) => {
    const names = f[0].split(','), n = names.length;
    const typeL = f[1].split(','), bodyL = f[6].split(','), cL = f[7].split(','), c2L = f[8].split(',');
    const featL = f[9].split('|'), eyeL = f[10].split(',');
    const scales = n === 3 ? [0.66, 0.84, 1] : n === 2 ? [0.74, 0.98] : [0.92];
    names.forEach((name, s) => {
      id++;
      const seed = (SEEDS[names[0]] || id - s) + s;
      const types = pick(typeL, s).split('/');
      const bst = f[3][s], w = STAT_PROFILE[f[2]], sum = w.reduce((a, b) => a + b, 0);
      const jr = mulberry32(seed * 7919);
      const base = {};
      STAT_KEYS.forEach((k, i) => { base[k] = Math.max(20, Math.round(bst * w[i] / sum * (0.92 + jr() * 0.16))); });
      const lean = base.atk >= base.foc ? 'P' : 'F';
      DEX.push({
        id, name, types, base, bst, fam: fi, stage: s, stages: n,
        evo: s < n - 1 ? { to: id + 1, lvl: f[4][s] } : null,
        catchRate: f[5], yield: Math.round(bst / 4),
        desc: f[11][s], legend: f[5] <= 5,
        art: { b: pick(bodyL, s), c: '#' + pick(cL, s), c2: '#' + pick(c2L, s), f: pick(featL, s).split(' ').filter(Boolean), eye: pick(eyeL, s), s: f[12] || scales[s] },
        learn: buildLearnset(seed, types, lean),
      });
    });
  });
})();
const DEX_BY_NAME = {};
for (let i = 1; i < DEX.length; i++) DEX_BY_NAME[DEX[i].name] = DEX[i];
function baseFormOf(id) { let d = DEX[id]; while (d.stage > 0) d = DEX[d.id - 1]; return d.id; }
