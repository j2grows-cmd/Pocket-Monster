'use strict';
/* Moves. cat: P = physical (Might vs Guard), F = focus (Focus vs Will), S = status.
   fx keys: st:[status,chance]  sg:[[who,stat,delta,chance],...] (who: 's' self / 't' target)
            heal, drain, recoil (fractions)  pri  multi:[min,max]  crit  flinch  sure */
const MOVES = {};
(function () {
  const m = (name, type, cat, pow, acc, pp, fx, desc) => { MOVES[name] = Object.assign({ name, type, cat, pow, acc, pp, desc: desc || '' }, fx || {}); };
  // Wild
  m('Bump', 'Wild', 'P', 40, 100, 35, null, 'A full-body shove.');
  m('Yelp', 'Wild', 'F', 40, 100, 35, null, 'A sharp cry that stings the ears.');
  m('Quick Jab', 'Wild', 'P', 40, 100, 30, { pri: 1 }, 'Strikes first.');
  m('Frenzy', 'Wild', 'P', 20, 95, 20, { multi: [2, 5] }, 'Hits two to five times.');
  m('Headlong', 'Wild', 'P', 65, 100, 25, null, 'A reckless charge.');
  m('Wild Roar', 'Wild', 'F', 65, 100, 25, null, 'A roar with real force behind it.');
  m('Slam Down', 'Wild', 'P', 85, 90, 15, null, 'Drops the full weight on the foe.');
  m('Howl Blast', 'Wild', 'F', 85, 95, 15, null, 'A focused, booming howl.');
  m('Rampage', 'Wild', 'P', 110, 95, 10, { recoil: 0.25 }, 'Devastating, but the user is hurt too.');
  m('Primal Cry', 'Wild', 'F', 105, 90, 10, null, 'An ancient cry that shakes the ground.');
  m('Bristle', 'Wild', 'S', 0, 100, 30, { sg: [['t', 'atk', -1, 100]] }, 'Lowers the foe\'s Might.');
  m('Stare Down', 'Wild', 'S', 0, 100, 30, { sg: [['t', 'def', -1, 100]] }, 'Lowers the foe\'s Guard.');
  m('Rally', 'Wild', 'S', 0, 100, 20, { sg: [['s', 'atk', 1, 100]] }, 'Raises the user\'s Might.');
  m('Focus Up', 'Wild', 'S', 0, 100, 20, { sg: [['s', 'foc', 1, 100]] }, 'Raises the user\'s Focus.');
  m('Rest Up', 'Wild', 'S', 0, 100, 10, { heal: 0.5 }, 'Restores half of max HP.');
  m('Last Gasp', 'Wild', 'P', 35, 100, 99, { recoil: 0.25 }, 'A desperate move used when nothing else is left.');
  // Flora
  m('Leaf Flick', 'Flora', 'P', 40, 100, 30, null, 'Snaps a leaf like a whip.');
  m('Seed Shot', 'Flora', 'F', 40, 100, 30, null, 'Spits hard seeds.');
  m('Vine Lash', 'Flora', 'P', 65, 100, 20, null, 'A lashing vine strike.');
  m('Sap Drain', 'Flora', 'F', 55, 100, 15, { drain: 0.5 }, 'Steals vitality from the foe.');
  m('Thorn Crash', 'Flora', 'P', 85, 95, 15, null, 'A tackle wrapped in thorns.');
  m('Petal Storm', 'Flora', 'F', 85, 100, 15, null, 'A whirl of razor petals.');
  m('Timber Fall', 'Flora', 'P', 110, 85, 8, null, 'Crashes down like a felled tree.');
  m('Bloom Burst', 'Flora', 'F', 110, 85, 8, null, 'An explosion of raw growth.');
  m('Spore Dust', 'Flora', 'S', 0, 75, 15, { st: ['sleep', 100] }, 'Puts the foe to sleep.');
  m('Photosynth', 'Flora', 'S', 0, 100, 10, { heal: 0.5 }, 'Restores half of max HP.');
  // Ember
  m('Ember Paw', 'Ember', 'P', 40, 100, 30, null, 'A swipe with a heated paw.');
  m('Cinder', 'Ember', 'F', 40, 100, 30, { st: ['burn', 10] }, 'May burn.');
  m('Flame Fang', 'Ember', 'P', 65, 100, 20, { st: ['burn', 10] }, 'May burn.');
  m('Scorch Ring', 'Ember', 'F', 65, 100, 20, null, 'A closing ring of fire.');
  m('Flame Whip', 'Ember', 'P', 85, 100, 15, null, 'A whip of flame.');
  m('Blaze Wave', 'Ember', 'F', 85, 100, 15, { st: ['burn', 10] }, 'May burn.');
  m('Magma Crash', 'Ember', 'P', 105, 90, 8, null, 'A molten body slam.');
  m('Firestorm', 'Ember', 'F', 110, 85, 8, { st: ['burn', 20] }, 'May burn.');
  m('Smolder', 'Ember', 'S', 0, 90, 15, { st: ['burn', 100] }, 'Burns the foe.');
  m('Stoke', 'Ember', 'S', 0, 100, 15, { sg: [['s', 'atk', 1, 100], ['s', 'foc', 1, 100]] }, 'Raises Might and Focus.');
  // Tide
  m('Fin Slap', 'Tide', 'P', 40, 100, 30, null, 'A wet smack.');
  m('Splash Shot', 'Tide', 'F', 40, 100, 30, null, 'A jet of water.');
  m('Riptide', 'Tide', 'P', 65, 100, 20, null, 'Drags the foe under.');
  m('Surge', 'Tide', 'F', 65, 100, 20, null, 'A rolling swell.');
  m('Tidal Crash', 'Tide', 'P', 85, 100, 15, null, 'Rides a wave into the foe.');
  m('Deluge', 'Tide', 'F', 85, 100, 15, null, 'A crushing stream.');
  m('Breaker', 'Tide', 'P', 105, 90, 8, null, 'Hits like a storm wave on rock.');
  m('Maelstrom', 'Tide', 'F', 110, 85, 8, null, 'A spinning wall of water.');
  m('Mist Veil', 'Tide', 'S', 0, 100, 15, { sg: [['s', 'def', 1, 100], ['s', 'wil', 1, 100]] }, 'Raises Guard and Will.');
  m('Soothing Rain', 'Tide', 'S', 0, 100, 10, { heal: 0.5 }, 'Restores half of max HP.');
  // Spark
  m('Jolt Tackle', 'Spark', 'P', 45, 100, 30, null, 'A crackling tackle.');
  m('Static Snap', 'Spark', 'F', 40, 100, 30, { st: ['stun', 10] }, 'May stun.');
  m('Arc Fang', 'Spark', 'P', 65, 100, 20, { st: ['stun', 10] }, 'May stun.');
  m('Arc Bolt', 'Spark', 'F', 65, 100, 20, null, 'A leaping bolt.');
  m('Volt Rush', 'Spark', 'P', 90, 100, 15, { recoil: 0.25 }, 'Strong, with recoil.');
  m('Lightning Lance', 'Spark', 'F', 85, 100, 15, { st: ['stun', 10] }, 'May stun.');
  m('Thunder Hammer', 'Spark', 'P', 105, 90, 8, null, 'A charged overhead blow.');
  m('Sky Crack', 'Spark', 'F', 110, 80, 8, { st: ['stun', 30] }, 'Often stuns.');
  m('Numbing Pulse', 'Spark', 'S', 0, 90, 15, { st: ['stun', 100] }, 'Stuns the foe.');
  m('Charge Up', 'Spark', 'S', 0, 100, 15, { sg: [['s', 'foc', 1, 100], ['s', 'spd', 1, 100]] }, 'Raises Focus and Speed.');
  // Stone
  m('Pebble Toss', 'Stone', 'P', 40, 100, 30, null, 'Throws a stone.');
  m('Grit Blast', 'Stone', 'F', 40, 100, 30, null, 'A spray of sharp grit.');
  m('Boulder Bash', 'Stone', 'P', 65, 100, 20, null, 'Swings a rock like a club.');
  m('Gravel Burst', 'Stone', 'F', 65, 100, 20, null, 'Gravel erupts under the foe.');
  m('Quake Stomp', 'Stone', 'P', 90, 100, 15, null, 'Stomps hard enough to split earth.');
  m('Gem Ray', 'Stone', 'F', 85, 100, 15, null, 'Light focused through crystal.');
  m('Landslide', 'Stone', 'P', 110, 85, 8, null, 'Buries the foe.');
  m('Meteor Call', 'Stone', 'F', 110, 85, 8, null, 'Calls a rock from the sky.');
  m('Dust Screen', 'Stone', 'S', 0, 100, 15, { sg: [['t', 'acc', -1, 100]] }, 'Lowers the foe\'s Aim.');
  m('Fortify', 'Stone', 'S', 0, 100, 15, { sg: [['s', 'def', 2, 100]] }, 'Sharply raises Guard.');
  // Gale
  m('Beak Jab', 'Gale', 'P', 40, 100, 30, null, 'A quick peck.');
  m('Breeze Cut', 'Gale', 'F', 40, 100, 30, null, 'A slicing gust.');
  m('Wing Slash', 'Gale', 'P', 65, 100, 20, null, 'A slash with the wing edge.');
  m('Air Lance', 'Gale', 'F', 65, 100, 20, null, 'A spear of compressed air.');
  m('Dive Strike', 'Gale', 'P', 85, 100, 15, null, 'A steep, fast dive.');
  m('Gale Force', 'Gale', 'F', 85, 100, 15, null, 'Wind strong enough to bend trees.');
  m('Sky Breaker', 'Gale', 'P', 105, 90, 8, null, 'Falls from the clouds.');
  m('Cyclone', 'Gale', 'F', 110, 85, 8, null, 'A tearing funnel of wind.');
  m('Slipstream', 'Gale', 'S', 0, 100, 15, { sg: [['s', 'spd', 2, 100]] }, 'Sharply raises Speed.');
  m('Feather Guard', 'Gale', 'S', 0, 100, 15, { sg: [['s', 'def', 1, 100], ['s', 'wil', 1, 100]] }, 'Raises Guard and Will.');
  // Frost
  m('Frost Nip', 'Frost', 'P', 40, 100, 30, { pri: 1 }, 'Strikes first.');
  m('Chill Breath', 'Frost', 'F', 40, 100, 30, { sg: [['t', 'spd', -1, 30]] }, 'May lower Speed.');
  m('Rime Fang', 'Frost', 'P', 65, 100, 20, { st: ['frost', 10] }, 'May cause frostbite.');
  m('Sleet Shot', 'Frost', 'F', 65, 100, 20, null, 'A volley of sleet.');
  m('Icefall', 'Frost', 'P', 85, 100, 15, null, 'Drops heavy icicles.');
  m('Hail Lance', 'Frost', 'F', 85, 100, 15, { st: ['frost', 10] }, 'May cause frostbite.');
  m('Snowslide', 'Frost', 'P', 105, 90, 8, null, 'A wall of snow and ice.');
  m('Whiteout', 'Frost', 'F', 110, 85, 8, null, 'A blinding blizzard.');
  m('Deep Chill', 'Frost', 'S', 0, 90, 15, { st: ['frost', 100] }, 'Gives the foe frostbite.');
  m('Frost Mantle', 'Frost', 'S', 0, 100, 15, { sg: [['s', 'wil', 2, 100]] }, 'Sharply raises Will.');
  // Venom
  m('Sting', 'Venom', 'P', 35, 100, 30, { st: ['poison', 30] }, 'May poison.');
  m('Acid Spit', 'Venom', 'F', 40, 100, 30, { sg: [['t', 'wil', -1, 20]] }, 'May lower Will.');
  m('Venom Fang', 'Venom', 'P', 65, 100, 20, { st: ['poison', 30] }, 'May poison.');
  m('Mire Wave', 'Venom', 'F', 65, 100, 20, { st: ['poison', 20] }, 'May poison.');
  m('Needle Volley', 'Venom', 'P', 85, 100, 15, null, 'A volley of barbs.');
  m('Blight Burst', 'Venom', 'F', 85, 100, 15, { st: ['poison', 20] }, 'May poison.');
  m('Toxic Maul', 'Venom', 'P', 100, 90, 8, { st: ['poison', 30] }, 'May poison.');
  m('Plague Tide', 'Venom', 'F', 110, 85, 8, { st: ['poison', 30] }, 'May poison.');
  m('Miasma', 'Venom', 'S', 0, 90, 15, { st: ['poison', 100] }, 'Poisons the foe.');
  m('Corrode', 'Venom', 'S', 0, 100, 15, { sg: [['t', 'def', -2, 100]] }, 'Sharply lowers Guard.');
  // Mind
  m('Palm Push', 'Mind', 'P', 40, 100, 30, null, 'A shove guided by thought.');
  m('Nudge', 'Mind', 'F', 40, 100, 30, null, 'A small push of will.');
  m('Zen Strike', 'Mind', 'P', 65, 100, 20, null, 'A calm, exact blow.');
  m('Psi Pulse', 'Mind', 'F', 65, 100, 20, null, 'A pulse of mental force.');
  m('Mind Hammer', 'Mind', 'P', 85, 100, 15, null, 'Thought made heavy.');
  m('Mind Crush', 'Mind', 'F', 85, 100, 15, { sg: [['t', 'wil', -1, 20]] }, 'May lower Will.');
  m('Astral Blow', 'Mind', 'P', 105, 90, 8, null, 'A strike from just outside sight.');
  m('Dream Rend', 'Mind', 'F', 115, 80, 8, null, 'Tears at the foe\'s dreams.');
  m('Hypnotic Hum', 'Mind', 'S', 0, 70, 15, { st: ['sleep', 100] }, 'Puts the foe to sleep.');
  m('Insight', 'Mind', 'S', 0, 100, 15, { sg: [['s', 'foc', 1, 100], ['s', 'wil', 1, 100]] }, 'Raises Focus and Will.');
  // Shade
  m('Shadow Nip', 'Shade', 'P', 40, 100, 30, { pri: 1 }, 'Strikes first.');
  m('Spook', 'Shade', 'F', 40, 100, 30, { flinch: 20 }, 'May make the foe flinch.');
  m('Night Claw', 'Shade', 'P', 65, 100, 20, { crit: 1 }, 'Often lands a critical hit.');
  m('Soul Siphon', 'Shade', 'F', 60, 100, 15, { drain: 0.5 }, 'Steals vitality from the foe.');
  m('Phantom Rush', 'Shade', 'P', 85, 100, 15, null, 'Passes through, then strikes.');
  m('Umbral Pulse', 'Shade', 'F', 85, 100, 15, null, 'A wave of living shadow.');
  m('Grave Slam', 'Shade', 'P', 105, 90, 8, null, 'A blow with the weight of stone lids.');
  m('Eclipse', 'Shade', 'F', 110, 85, 8, null, 'Blots out the light.');
  m('Dread Gaze', 'Shade', 'S', 0, 100, 15, { sg: [['t', 'atk', -1, 100], ['t', 'foc', -1, 100]] }, 'Lowers Might and Focus.');
  m('Fade', 'Shade', 'S', 0, 100, 15, { sg: [['s', 'def', 1, 100], ['s', 'spd', 1, 100]] }, 'Raises Guard and Speed.');
  // Iron
  m('Rivet Punch', 'Iron', 'P', 40, 100, 30, { pri: 1 }, 'Strikes first.');
  m('Shrapnel', 'Iron', 'F', 40, 100, 30, null, 'A burst of metal flecks.');
  m('Cog Crush', 'Iron', 'P', 32, 95, 20, { multi: [2, 2] }, 'Hits twice.');
  m('Magnet Pulse', 'Iron', 'F', 60, 100, 20, { sure: 1 }, 'Never misses.');
  m('Blade Edge', 'Iron', 'P', 80, 100, 15, { crit: 1 }, 'Often lands a critical hit.');
  m('Mirror Ray', 'Iron', 'F', 85, 100, 15, null, 'A beam off polished metal.');
  m('Anvil Drop', 'Iron', 'P', 110, 85, 8, null, 'Exactly what it sounds like.');
  m('Railburst', 'Iron', 'F', 110, 85, 8, null, 'A magnetised slug.');
  m('Temper', 'Iron', 'S', 0, 100, 15, { sg: [['s', 'atk', 1, 100], ['s', 'def', 1, 100]] }, 'Raises Might and Guard.');
  m('Metal Shriek', 'Iron', 'S', 0, 95, 15, { sg: [['t', 'wil', -2, 100]] }, 'Sharply lowers Will.');
})();

// per-type ladders used to build learnsets: [weak, mid, strong, ultimate]
const LADDER = {
  Wild: { P: ['Bump', 'Headlong', 'Slam Down', 'Rampage'], F: ['Yelp', 'Wild Roar', 'Howl Blast', 'Primal Cry'], S: ['Bristle', 'Rest Up'] },
  Flora: { P: ['Leaf Flick', 'Vine Lash', 'Thorn Crash', 'Timber Fall'], F: ['Seed Shot', 'Sap Drain', 'Petal Storm', 'Bloom Burst'], S: ['Spore Dust', 'Photosynth'] },
  Ember: { P: ['Ember Paw', 'Flame Fang', 'Flame Whip', 'Magma Crash'], F: ['Cinder', 'Scorch Ring', 'Blaze Wave', 'Firestorm'], S: ['Smolder', 'Stoke'] },
  Tide: { P: ['Fin Slap', 'Riptide', 'Tidal Crash', 'Breaker'], F: ['Splash Shot', 'Surge', 'Deluge', 'Maelstrom'], S: ['Mist Veil', 'Soothing Rain'] },
  Spark: { P: ['Jolt Tackle', 'Arc Fang', 'Volt Rush', 'Thunder Hammer'], F: ['Static Snap', 'Arc Bolt', 'Lightning Lance', 'Sky Crack'], S: ['Numbing Pulse', 'Charge Up'] },
  Stone: { P: ['Pebble Toss', 'Boulder Bash', 'Quake Stomp', 'Landslide'], F: ['Grit Blast', 'Gravel Burst', 'Gem Ray', 'Meteor Call'], S: ['Dust Screen', 'Fortify'] },
  Gale: { P: ['Beak Jab', 'Wing Slash', 'Dive Strike', 'Sky Breaker'], F: ['Breeze Cut', 'Air Lance', 'Gale Force', 'Cyclone'], S: ['Slipstream', 'Feather Guard'] },
  Frost: { P: ['Frost Nip', 'Rime Fang', 'Icefall', 'Snowslide'], F: ['Chill Breath', 'Sleet Shot', 'Hail Lance', 'Whiteout'], S: ['Deep Chill', 'Frost Mantle'] },
  Venom: { P: ['Sting', 'Venom Fang', 'Needle Volley', 'Toxic Maul'], F: ['Acid Spit', 'Mire Wave', 'Blight Burst', 'Plague Tide'], S: ['Miasma', 'Corrode'] },
  Mind: { P: ['Palm Push', 'Zen Strike', 'Mind Hammer', 'Astral Blow'], F: ['Nudge', 'Psi Pulse', 'Mind Crush', 'Dream Rend'], S: ['Hypnotic Hum', 'Insight'] },
  Shade: { P: ['Shadow Nip', 'Night Claw', 'Phantom Rush', 'Grave Slam'], F: ['Spook', 'Soul Siphon', 'Umbral Pulse', 'Eclipse'], S: ['Dread Gaze', 'Fade'] },
  Iron: { P: ['Rivet Punch', 'Cog Crush', 'Blade Edge', 'Anvil Drop'], F: ['Shrapnel', 'Magnet Pulse', 'Mirror Ray', 'Railburst'], S: ['Temper', 'Metal Shriek'] },
};
