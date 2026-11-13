'use strict';
/* The Vessara region: a 7 x 5 grid of cells, each a town, a route or a wild area.
   The whole overworld is one seamless tile map, generated deterministically from this data. */
const CW = 28, CH = 22, GW = 7, GH = 5;

const WARDENS = [
  null,
  { name: 'Warden Fern', sigil: 'Sprout Sigil', type: 'Flora', party: [[49, 9], [20, 10], [36, 12]], pre: 'Everything in Brambleton grows at its own pace. Let us see how far you have grown.', post: 'Strong roots. The Sprout Sigil is yours.' },
  { name: 'Warden Marlow', sigil: 'Current Sigil', type: 'Tide', party: [[39, 16], [41, 16], [29, 19]], pre: 'The sea does not care how you feel about it. Neither will my team.', post: 'You swim well against the current. Take the Current Sigil.' },
  { name: 'Warden Volta', sigil: 'Circuit Sigil', type: 'Spark', party: [[46, 21], [26, 22], [60, 22], [47, 25]], pre: 'Coilbridge runs on my partners. Try not to trip the breakers.', post: 'Ha! You blew every fuse I had. The Circuit Sigil, fairly won.' },
  { name: 'Warden Garnet', sigil: 'Bedrock Sigil', type: 'Stone', party: [[34, 27], [66, 28], [68, 28], [71, 31]], pre: 'Stone does not hurry. Stone does not yield. Show me which of us is stone.', post: 'Hm. You wore me down. The Bedrock Sigil is yours.' },
  { name: 'Warden Ignacia', sigil: 'Cinder Sigil', type: 'Ember', party: [[88, 33], [86, 33], [90, 34], [93, 37]], pre: 'Stand close. You will want to remember how this heat felt.', post: 'Burned out! Take the Cinder Sigil before I change my mind.' },
  { name: 'Warden Aerin', sigil: 'Zephyr Sigil', type: 'Gale', party: [[96, 38], [98, 38], [14, 39], [61, 39], [101, 42]], pre: 'Up here the wind decides. I only make suggestions.', post: 'You never lost your footing. The Zephyr Sigil goes with you.' },
  { name: 'Warden Morwen', sigil: 'Dusk Sigil', type: 'Shade', party: [[114, 43], [117, 43], [120, 44], [122, 44], [115, 47]], pre: 'The lamps in Duskwend are not for us. They are for what we keep company with.', post: 'You walked through the dark and did not flinch. The Dusk Sigil.' },
  { name: 'Warden Halvard', sigil: 'Rime Sigil', type: 'Frost', party: [[127, 47], [132, 48], [134, 48], [136, 48], [130, 49], [128, 51]], pre: 'Seven sigils. Everyone arrives here warm with confidence. Few leave that way.', post: 'The last sigil. The Summit road is open to you. Go carefully.' },
];
const COUNCIL = [
  { name: 'Councillor Thane', pal: 'council', party: [[74, 52], [76, 52], [78, 53], [35, 53], [69, 54]], pre: 'I am the gate. Iron and stone. Begin.', post: 'The gate opens.' },
  { name: 'Councillor Sybil', pal: 'mystic', party: [[109, 53], [38, 53], [110, 54], [54, 54], [105, 55]], pre: 'I already know how this ends. I would still like to watch.', post: 'Exactly as I saw it. Go on.' },
  { name: 'Councillor Rook', pal: 'council', party: [[118, 54], [124, 54], [125, 55], [14, 55], [115, 56]], pre: 'No speeches. Night falls, you fall.', post: '...Morning, then.' },
  { name: 'Councillor Brine', pal: 'angler', party: [[59, 55], [43, 55], [56, 56], [91, 56], [51, 57]], pre: 'Flood, flower and fire. I never could pick just one.', post: 'Wonderful! Only the High Warden is left.' },
  { name: 'High Warden Isolde', pal: 'champ', champion: 1, party: [[21, 58], [27, 58], [24, 58], [94, 59], [128, 59], [102, 61]], pre: 'Eight sigils and four councillors. You have earned the right to try for the crown of Vessara.', post: 'It is yours. Wear it kindly.' },
];
const RIVAL = { name: 'Corvin', pal: 'rival' };

const TIPS = [
  'Monsters you catch past your sixth go to the Paddock. Ask the keeper in any Hearth House.',
  'A monster that is asleep or stunned is far easier to charm.',
  'Lower a wild monster\'s HP before you throw a charm. Just don\'t knock it out.',
  'Stone shrugs off Wild moves. Bring something else to a quarry.',
  'Tide beats Ember, Ember beats Flora, Flora beats Tide. The rest you learn by losing.',
  'Ward Incense keeps wild monsters off you for a while. Handy on a long road.',
  'Some monsters only bite a fishing line. Port Calder is the place to ask about rods.',
  'I heard something huge sleeps at the bottom of the Deepquarry.',
  'Burn weakens Might. Frostbite weakens Focus. Poison just hurts.',
  'A stunned monster moves last and sometimes not at all.',
  'Wardens hand out sigils. Road wardens count them. Simple as that.',
  'The Journal fills in when you catch something, not when you see it.',
  'My grandmother swears she saw a white monster in the Origin Glade. Nobody gets in there now.',
  'If your whole team faints you wake up at the last Hearth House. No shame in it.',
  'Trade Posts stock better goods as you earn sigils.',
  'Moves of a monster\'s own type hit harder. Worth remembering when it learns a new one.',
  'Over Mirror Lake, on clear nights, something comes down to look at its reflection.',
  'The storm over Stormspire never moves. People say it is waiting for someone.',
  'Emberfall\'s caldera glows brighter every year. The stokers say something is nesting.',
  'A wave came in at the Sunken Coast once and just... stayed, looking at us.',
  'You can move a monster to the front of your team from the Team menu.',
  'Iron cuts through Stone, Frost and Shade. Ember melts it.',
  'Shade moves pass straight through Mind types. Mind returns the favour to Venom.',
  'Save often. The menu has a Save option, and Hearth Houses save for you.',
];

const CELLS = {};
(function () {
  const C = (c, r, name, kind, biome, exits, x) => { CELLS[c + ',' + r] = Object.assign({ c, r, key: c + ',' + r, name, kind, biome, exits }, x || {}); };
  const std = ['house', 'hearth', 'trade', 'lodge', 'house', null, null, 'house'];
  // ---- row 4 (south) ----
  C(0, 4, 'Mosswick', 'town', 0, 'NE', { tag: 'Where every road begins.', gates: { E: 'starter', N: 'starter' }, builds: ['home', null, 'study', 'house', null, 'hearth', 'trade', null],
    folk: [['elder', 'Tall grass hides wild monsters. Walk in with a partner, or not at all.'], ['kid', 'Sage Maren\'s study is the one with the teal roof. She gives monsters to new tamers!']] });
  C(1, 4, 'Dewpath', 'route', 0, 'WE', { enc: [[10, 2, 4, 30], [12, 2, 4, 30], [17, 2, 4, 25], [15, 3, 4, 15]], items: ['Tonic', 'Tin Charm'],
    trainers: [['Scamp Tolly', 'kid', [[10, 3], [12, 3]], 'I just caught these! Come on, come on!', 'Aw. Back to the grass for me.'], ['Rambler Ines', 'lass', [[17, 4], [15, 4]], 'A stroll and a battle. Perfect morning.', 'Well, the stroll was nice.']] });
  C(2, 4, 'Brambleton', 'town', 0, 'WEN', { tag: 'A town held together by ivy.', gates: { E: 1, N: 3 }, builds: std, warden: 1,
    folk: [['lass', 'Warden Fern keeps the lodge with the gold roof. Flora types, every one.'], ['hiker', 'Hearth Houses heal your team for free. Red roof. Can\'t miss it.']] });
  C(3, 4, 'Tidewalk', 'route', 0, 'WE', { pond: 'SW', enc: [[22, 8, 11, 22], [12, 8, 11, 16], [25, 8, 11, 18], [28, 8, 11, 12], [20, 9, 12, 12], [55, 9, 12, 10], [49, 9, 12, 10]], fish: [[39, 8, 12, 40], [28, 8, 12, 30], [41, 9, 12, 30]], items: ['Tonic', 'Panacea', 'Tin Charm'],
    trainers: [['Rambler Odette', 'lass', [[20, 10], [55, 10]], 'You can smell the sea from here. Battle?', 'Salt in the wound.'], ['Scamp Rudd', 'kid', [[22, 11], [25, 11]], 'My Scrufflet bites! Mostly me, but still!', 'Ow. It bit me again.'], ['RIVAL', 'rival', [[12, 11], ['R', 13]], 'There you are. I\'ve already been to Port Calder and back. Let\'s see if you kept up.', 'Fine. You kept up. Don\'t get used to it.']] });
  C(4, 4, 'Port Calder', 'town', 5, 'WNE', { tag: 'Salt on every doorstep.', gates: { N: 2, E: 3 }, builds: std, warden: 2, shore: 1, fish: [[39, 10, 15, 40], [41, 10, 15, 30], [44, 10, 15, 30]],
    folk: [['angler', 'GIFT:Fishing Rod:You look like you have patience. Take this old rod. Face the water and press A.:Any luck? The marsh to the east bites best.'], ['kid', 'Ember types have a rough time against Warden Marlow.']] });
  C(5, 4, 'Saltmarsh', 'route', 5, 'WE', { pond: 'SW', enc: [[29, 21, 25, 22], [55, 21, 25, 16], [41, 21, 25, 16], [83, 21, 25, 14], [44, 22, 25, 10]], fish: [[57, 20, 25, 35], [39, 20, 25, 25], [44, 20, 25, 25]], items: ['Elixir', 'Silver Charm'],
    trainers: [['Angler Dov', 'angler', [[39, 22], [41, 22], [44, 23]], 'Shh. You\'ll scare the— oh, forget it. Battle.', 'Now they\'re definitely scared.'], ['Angler Marta', 'angler', [[29, 24], [44, 24]], 'The marsh gives, the marsh takes.', 'Today it takes.']] });
  C(6, 4, 'Sunken Coast', 'area', 5, 'W', { feature: 'cove', legend: [140, 50], enc: [[42, 28, 33, 30], [99, 28, 33, 22], [129, 28, 33, 18], [83, 28, 33, 15], [45, 28, 33, 15]], fish: [[110, 28, 33, 25], [40, 28, 33, 30], [45, 28, 33, 25], [125, 30, 34, 10], [58, 28, 33, 10]], items: ['Grand Elixir'],
    trainers: [['Diver Coral', 'angler', [[42, 29], [45, 30], [40, 30]], 'Careful on the rocks. And of me.', 'Mind the rocks on your way.']] });
  // ---- row 3 ----
  C(0, 3, 'Whisperwood', 'route', 0, 'SNE', { lush: 1, gates: { N: 8, E: 'champion' }, enc: [[17, 4, 6, 16], [18, 5, 7, 12], [20, 4, 7, 16], [36, 4, 7, 16], [31, 5, 7, 14], [22, 4, 7, 14], [64, 6, 8, 6], [48, 6, 8, 6]], items: ['Tin Charm', 'Tonic', 'Panacea'],
    trainers: [['Bug Scout Pim', 'kid', [[17, 5], [18, 6], [17, 5]], 'Whisper! You\'ll wake the cocoons!', 'They\'re awake now. Thanks.'], ['Forager Hale', 'ranger', [[36, 7], [20, 7]], 'These woods feed me. Let\'s see what they taught my team.', 'More foraging to do, clearly.']] });
  C(1, 3, 'Origin Glade', 'area', 0, 'W', { feature: 'grove', legend: [144, 65], enc: [[1, 40, 45, 8], [4, 40, 45, 8], [7, 40, 45, 8], [138, 50, 58, 14], [21, 52, 58, 16], [24, 52, 58, 16], [51, 52, 58, 14], [105, 52, 58, 10], [101, 50, 56, 6]], items: ['Ambrosia', 'Gold Charm'] });
  C(2, 3, 'Thornwood', 'route', 3, 'NS', { lush: 1, enc: [[37, 19, 23, 18], [52, 19, 23, 18], [111, 19, 23, 16], [19, 19, 23, 12], [64, 20, 23, 10], [31, 19, 23, 12], [81, 20, 23, 10]], items: ['Elixir', 'Silver Charm'],
    trainers: [['Bug Scout Remy', 'kid', [[19, 20], [81, 21], [26, 21]], 'The thorns keep the grown-ups out. Not you, though.', 'I should plant more thorns.'], ['Forager Sable', 'ranger', [[37, 22], [111, 22]], 'Hold your nose and battle.', 'Phew. In every sense.']] });
  C(3, 3, 'Lake Vess', 'lake', 0, '');
  C(4, 3, 'Coil Road', 'route', 0, 'NS', { enc: [[46, 14, 18, 20], [26, 15, 18, 14], [25, 14, 17, 10], [60, 14, 18, 16], [52, 14, 18, 12], [13, 15, 18, 6], [62, 15, 18, 12]], items: ['Tonic', 'Silver Charm', 'Ward Incense'],
    trainers: [['Tinkerer Vos', 'shop', [[25, 15], [46, 16]], 'Hold this wire. No? Then battle me.', 'Should have held the wire.'], ['Falconer Brisa', 'lass', [[13, 16], [60, 16]], 'Eyes up! That\'s where it\'ll come from.', 'Eyes down. That\'s where I\'m looking now.'], ['Duelist Garrick', 'hiker', [[10, 17], [62, 17], [52, 17]], 'Three monsters. Three chances to prove you wrong.', 'Wrong three times. A new record.']] });
  C(5, 3, 'The Shale Wall', 'wall', 1, '');
  C(6, 3, 'Deepquarry', 'area', 1, 'N', { feature: 'pit', legend: [139, 50], enc: [[34, 27, 31, 20], [68, 27, 31, 16], [75, 27, 31, 16], [77, 27, 31, 14], [73, 27, 31, 12], [81, 27, 31, 10], [79, 28, 31, 6], [94, 28, 31, 6]], items: ['Grand Elixir', 'Wakeroot'],
    trainers: [['Miner Grisel', 'hiker', [[34, 28], [68, 29], [77, 29]], 'Deeper you go, harder they hit.', 'Deep enough for today.'], ['Prospector Lyle', 'elder', [[75, 29], [79, 30], [73, 30]], 'Found gold yet? No? Found me instead.', 'Fool\'s gold, my whole team.']] });
  // ---- row 2 ----
  C(0, 2, 'Crown Summit', 'town', 4, 'NS', { tag: 'Eight sigils. One crown.', builds: [null, 'hearth', 'trade', 'summit', null, null, null, null],
    folk: [['council', 'Four councillors and the High Warden wait in the hall with the gold roof. Stock up first.'], ['sledder', 'I came up here with eight sigils too. I have been stocking up for three years.']] });
  C(1, 2, 'Mirror Lake', 'area', 0, 'E', { feature: 'lake', legend: [143, 52], enc: [[104, 34, 38, 16], [108, 34, 38, 18], [107, 34, 38, 12], [106, 33, 36, 10], [56, 34, 38, 12], [123, 34, 38, 14], [103, 33, 36, 12], [138, 35, 38, 3]], fish: [[110, 33, 38, 25], [58, 33, 38, 30], [40, 33, 38, 30], [56, 33, 38, 15]], items: ['Grand Elixir', 'Gold Charm'],
    trainers: [['Mystic Oriel', 'mystic', [[104, 35], [108, 35], [123, 36]], 'The lake shows what you are. Shall we look?', 'Clear as water. You are stronger.'], ['Angler Finn', 'angler', [[58, 35], [40, 36], [56, 36]], 'Biggest fish in Vessara live right here.', 'And the biggest fool, apparently.']] });
  C(2, 2, 'Solmarch', 'town', 0, 'WENS', { tag: 'The heart of Vessara.', gates: { W: 5, N: 6 }, builds: ['house', 'hearth', 'trade', 'house', 'house', 'house', 'house', 'house'],
    folk: [['elder', 'Every road in Vessara ends up in Solmarch sooner or later. So does every rumour.'], ['mystic', 'West of here is Mirror Lake. On the clearest nights, something visits it.'], ['lass', 'The Lantern Road north goes straight to Duskwend, if the road warden lets you by.']] });
  C(3, 2, 'Kingsroad', 'route', 0, 'WE', { enc: [[62, 19, 23, 16], [16, 20, 23, 12], [106, 19, 23, 14], [103, 19, 23, 14], [11, 19, 22, 12]], items: ['Elixir', 'Panacea'],
    trainers: [['Courier Nell', 'lass', [[10, 20], [11, 21]], 'Parcel for you! It\'s a battle.', 'Return to sender.'], ['Duelist Ansel', 'hiker', [[62, 21], [16, 22], [70, 21]], 'The road to the capital is paved with losers. Join them.', 'I\'ll just... lie here on the paving.']] });
  C(4, 2, 'Coilbridge', 'town', 0, 'WES', { tag: 'The town that hums.', gates: { E: 3, W: 3 }, builds: std, warden: 3,
    folk: [['shop', 'West is the Kingsroad to Solmarch. East is quarry country. Both want three sigils.'], ['kid', 'If your hair stands up, Warden Volta is nearby.']] });
  C(5, 2, 'Quarry Trail', 'route', 1, 'WE', { enc: [[33, 22, 26, 16], [34, 23, 26, 8], [65, 22, 26, 18], [67, 22, 26, 16], [70, 22, 26, 14], [75, 22, 26, 12], [72, 22, 26, 10], [83, 22, 26, 6]], items: ['Elixir', 'Silver Charm'],
    trainers: [['Miner Bort', 'hiker', [[33, 23], [67, 23], [75, 24]], 'Hard hat on? No? Your funeral.', 'Mine, as it turns out.'], ['Hiker Una', 'ranger', [[65, 24], [70, 25]], 'Halfway up is the best place for a battle.', 'And for a sit down.']] });
  C(6, 2, 'Stonehollow', 'town', 1, 'WNS', { tag: 'Carved, not built.', gates: { N: 4, S: 4 }, builds: std, warden: 4,
    folk: [['hiker', 'South is the Deepquarry. North is the Cinder Climb. Garnet\'s sigil opens both.'], ['elder', 'This town was a single boulder once. We have been patient.']] });
  // ---- row 1 ----
  C(0, 1, 'Starfall Pass', 'route', 4, 'NS', { enc: [[127, 47, 51, 18], [132, 47, 51, 16], [134, 47, 51, 16], [136, 47, 51, 16], [137, 47, 51, 10], [130, 47, 51, 12], [131, 46, 49, 12]], items: ['Ambrosia', 'Wakeroot', 'Gold Charm'],
    trainers: [['Ace Tamer Lysa', 'sledder', [[127, 48], [132, 48], [134, 49], [86, 48]], 'One last test before the Summit. Me.', 'Passed. Go on up.'], ['Ace Tamer Dorn', 'ranger', [[136, 48], [130, 49], [69, 49], [11, 48]], 'I turn back half the people who come this way.', 'You\'re in the other half.'], ['RIVAL', 'rival', [[14, 48], [47, 47], [107, 47], [127, 48], ['R', 51]], 'Eight sigils each. Only one of us walks into that hall first. Last battle, for real this time.', 'Go on, then. Win the crown. I\'ll be right behind you.']] });
  C(1, 1, 'The Frostfangs', 'wall', 4, '');
  C(2, 1, 'Lantern Road', 'route', 3, 'NS', { enc: [[116, 36, 40, 18], [113, 36, 40, 18], [121, 36, 40, 16], [112, 36, 40, 12], [32, 36, 40, 12], [119, 36, 40, 14], [111, 35, 38, 10]], items: ['Grand Elixir', 'Panacea'],
    trainers: [['Lamplighter Jory', 'elder', [[116, 37], [113, 37], [32, 38]], 'I keep these lamps lit. You keep out of the dark.', 'Mind the third lamp. It flickers.'], ['Mourner Wren', 'mystic', [[112, 38], [119, 38]], 'I come here to remember. Battle me so I forget.', 'I remember this feeling.']] });
  C(3, 1, 'The Gloamwood', 'wall', 3, '');
  C(4, 1, 'Stormspire', 'area', 1, 'N', { feature: 'peak', legend: [142, 52], enc: [[96, 44, 48, 20], [98, 44, 48, 18], [14, 44, 48, 16], [61, 44, 48, 16], [101, 44, 48, 6], [99, 44, 48, 14], [109, 44, 48, 10]], items: ['Ambrosia'],
    trainers: [['Stormchaser Vale', 'ranger', [[96, 45], [98, 45], [14, 46]], 'Forty storms I\'ve chased up here. You\'re number forty-one.', 'Caught by the storm instead.']] });
  C(5, 1, 'Caldera', 'area', 2, 'E', { feature: 'crater', legend: [141, 52], enc: [[88, 44, 48, 20], [90, 44, 48, 18], [86, 44, 48, 18], [93, 44, 48, 16], [80, 44, 48, 12], [91, 46, 49, 6], [87, 43, 46, 10]], items: ['Ambrosia'],
    trainers: [['Firewalker Sol', 'stoker', [[88, 45], [90, 45], [93, 46]], 'The ground is not the only thing that burns here.', 'Cooled right off.']] });
  C(6, 1, 'Cinder Climb', 'route', 2, 'NSW', { gates: { W: 7 }, enc: [[87, 28, 32, 20], [89, 28, 32, 20], [85, 28, 32, 18], [92, 28, 32, 16], [66, 29, 32, 10], [65, 28, 31, 10], [80, 29, 32, 6]], items: ['Grand Elixir', 'Panacea', 'Silver Charm'],
    trainers: [['Stoker Ashby', 'stoker', [[87, 29], [89, 29], [85, 30]], 'Watch your boots. And your eyebrows.', 'There go mine.'], ['Stoker Pyra', 'stoker', [[92, 31], [66, 31]], 'The mountain\'s awake today. So am I.', 'Back to sleep, both of us.']] });
  // ---- row 0 (north) ----
  C(0, 0, 'Frostmere', 'town', 4, 'ES', { tag: 'The last warm door before the Summit.', gates: { S: 8 }, builds: std, warden: 8,
    folk: [['sledder', 'The pass south leads up to Crown Summit. Halvard decides who is ready for it.'], ['elder', 'Keep a Panacea handy. Frostbite saps the Focus right out of a monster.']] });
  C(1, 0, 'Rimewalk', 'route', 4, 'WE', { enc: [[126, 42, 46, 18], [127, 43, 46, 8], [131, 42, 46, 18], [133, 42, 46, 16], [135, 42, 46, 16], [129, 42, 46, 16], [137, 43, 46, 6]], items: ['Grand Elixir', 'Gold Charm'],
    trainers: [['Sledder Kaia', 'sledder', [[126, 43], [131, 43], [129, 43]], 'Race you! No? Battle you, then!', 'You\'d have won the race too.'], ['Sledder Bjorn', 'sledder', [[135, 44], [133, 44], [137, 45]], 'Cold enough for you?', 'It is now.']] });
  C(2, 0, 'Duskwend', 'town', 3, 'WES', { tag: 'Lamps lit since anyone remembers.', gates: { W: 7 }, builds: std, warden: 7,
    folk: [['mystic', 'We light the lamps for the Shade monsters. They are shy, not unkind.'], ['elder', 'The Lantern Road south runs to Solmarch. West is the cold.']] });
  C(3, 0, 'Gloam Hollow', 'route', 3, 'WE', { enc: [[113, 38, 42, 16], [114, 39, 42, 10], [116, 38, 42, 16], [117, 39, 42, 8], [119, 38, 42, 16], [121, 38, 42, 14], [123, 38, 42, 12], [53, 38, 42, 8]], items: ['Grand Elixir', 'Wakeroot'],
    trainers: [['Mourner Elspeth', 'mystic', [[113, 39], [116, 39], [121, 40]], 'Do you hear them? They want to meet you.', 'They liked you. That is rare.'], ['Mystic Thorne', 'mystic', [[114, 40], [123, 40], [119, 41]], 'Your shadow is walking a step behind. Shall we wait for it?', 'Ah. It has caught up.']] });
  C(4, 0, 'Windmere', 'town', 1, 'WES', { tag: 'Hold on to your hat.', gates: { W: 6, S: 7 }, builds: std, warden: 6,
    folk: [['lass', 'South is the Stormspire. The storm up there has not moved in a hundred years.'], ['ranger', 'Spark and Stone both knock Gale types out of the sky. Aerin knows it, too.']] });
  C(5, 0, 'Skyreach', 'route', 1, 'WE', { enc: [[95, 33, 37, 18], [97, 33, 37, 18], [13, 33, 37, 14], [61, 33, 37, 12], [108, 33, 37, 14], [50, 33, 37, 12], [100, 33, 36, 5], [60, 32, 35, 7]], items: ['Grand Elixir', 'Silver Charm'],
    trainers: [['Falconer Wynn', 'ranger', [[95, 34], [97, 34], [13, 35]], 'Nothing between us and the sky. Lovely day to lose.', 'Lovely day regardless.'], ['Kite Flyer Ozzy', 'kid', [[108, 35], [50, 35], [61, 36]], 'My kite got eaten. I\'m in a mood.', 'Still in a mood.'], ['RIVAL', 'rival', [[14, 36], [47, 35], [107, 35], ['R', 38]], 'Five sigils. Same as me. Funny how that keeps happening.', 'One day I\'ll get there before you. Not today, apparently.']] });
  C(6, 0, 'Emberfall', 'town', 2, 'WS', { tag: 'Mind the warm pavements.', gates: { W: 5 }, builds: std, warden: 5,
    folk: [['stoker', 'West along Skyreach is Windmere. You will want Ignacia\'s sigil for that road.'], ['kid', 'Don\'t touch the black rocks. I did. Don\'t.']] });
})();

const LODGE_TRAINERS = [null,
  [['Gardener Posy', 'lass', [[17, 8], [20, 9]]], ['Gardener Linden', 'ranger', [[36, 10]]]],
  [['Deckhand Cole', 'angler', [[39, 14], [28, 14]]], ['Deckhand Mira', 'angler', [[41, 15], [44, 15]]]],
  [['Wirehand Jax', 'shop', [[25, 19], [46, 20]]], ['Wirehand Pell', 'kid', [[60, 20], [26, 20]]]],
  [['Mason Durn', 'hiker', [[33, 25], [65, 25]]], ['Mason Hild', 'hiker', [[67, 26], [70, 26]]]],
  [['Stoker Brand', 'stoker', [[87, 31], [85, 31]]], ['Stoker Cyra', 'stoker', [[89, 32], [92, 32]]]],
  [['Glider Tams', 'ranger', [[95, 36], [97, 36]]], ['Glider Suri', 'lass', [[13, 37], [61, 37]]]],
  [['Medium Nox', 'mystic', [[113, 41], [116, 41], [121, 41]]], ['Medium Ravenna', 'mystic', [[123, 42], [119, 42]]]],
  [['Skater Ilsa', 'sledder', [[126, 45], [131, 45], [133, 45]]], ['Skater Torv', 'sledder', [[135, 46], [129, 46]]]],
];

const INTERIORS = {
  house: ['#########', '#PSS...B#', '#.......#', '#..T....#', '#.......#', '#...R...#', '#...R...#', '####M####'],
  hearth: ['##H###H##', '#.......#', '#.CCCCC.#', '#.......#', '#.......#', '#P..R..P#', '#...R...#', '####M####'],
  trade: ['#########', '#SS...SS#', '#.CCCCC.#', '#.......#', '#K.....K#', '#...R...#', '#...R...#', '####M####'],
  lodge: ['###########', '#XsssssssX#', '#sssssssss#', '#XsssRsssX#', '#ssssRssss#', '#ssssRssss#', '#ssssRssss#', '#XsssRsssX#', '#ssssRssss#', '#ssssRssss#', '#ssssRssss#', '#####M#####'],
  study: ['###########', '#SS.....SS#', '#.........#', '#.........#', '#..D.D.D..#', '#.........#', '#P.......P#', '#....R....#', '#####M#####'],
};
INTERIORS.home = INTERIORS.house;
INTERIORS.summit = (function () {
  const rows = ['#########'];
  for (let y = 1; y < 26; y++) rows.push([6, 11, 16, 21].includes(y) ? '#XXXsXXX#' : '#sssRsss#');
  rows.push('####M####');
  return rows;
})();
const INT_CODE = { '#': T.IWALL, '.': T.FLOOR, 'S': T.SHELF, 'B': T.BED, 'T': T.TABLE, 'P': T.POT, 'C': T.COUNTER, 'M': T.MAT, 'H': T.HEARTH, 'R': T.RUG, 's': T.STONE, 'X': T.STATUE, 'D': T.PEDESTAL, 'K': T.CRATE, ' ': T.VOID };

const MAPS = {};
let WORLD = null;

function buildWorld() {
  const W = GW * CW, H = GH * CH, tiles = new Uint8Array(W * H);
  const world = { id: 'world', w: W, h: H, tiles, npcs: [], warps: {}, signs: {}, towns: [] };
  WORLD = world; MAPS.world = world;
  world.cellAt = (x, y) => CELLS[Math.floor(x / CW) + ',' + Math.floor(y / CH)];
  world.biomeAt = (x, y) => { const c = world.cellAt(x, y); return c ? c.biome : 0; };
  const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = t; };
  const get = (x, y) => tiles[y * W + x];
  let tipIx = 0;

  for (const key in CELLS) {
    const cell = CELLS[key], ox = cell.c * CW, oy = cell.r * CH, b = cell.biome;
    const rng = mulberry32(1997 + cell.c * 31 + cell.r * 977);
    const G = T.GROUND + b, O = T.OBST + b, TG = T.TALL + b;
    const L = (x, y, t) => set(ox + x, oy + y, t), LG = (x, y) => get(ox + x, oy + y);
    const fill = (x, y, w, h, t) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L(x + i, y + j, t); };
    const inner = (x, y) => x >= 2 && x <= CW - 3 && y >= 2 && y <= CH - 3;
    const npc = (n) => { n.x += ox; n.y += oy; n.map = 'world'; n.id = 'w' + key + '#' + world.npcs.length; world.npcs.push(n); return n; };
    fill(0, 0, CW, CH, cell.kind === 'lake' ? T.WATER : O);
    if (cell.kind === 'lake') { for (let i = 0; i < CW; i++) { L(i, 0, O); L(i, CH - 1, O); } for (let j = 0; j < CH; j++) { L(0, j, O); L(CW - 1, j, O); } continue; }
    if (cell.kind === 'wall') continue;
    const ex = cell.exits;

    if (cell.kind === 'town') {
      fill(2, 2, CW - 4, CH - 4, G);
      // scattered decoration
      for (let i = 0; i < 64; i++) { const x = 2 + Math.floor(rng() * 24), y = 2 + Math.floor(rng() * 18), r = rng(); L(x, y, (b === 0 || b === 3) ? (r < .62 ? T.FLOWER : r < .8 ? O : G) : (r < .3 ? O : G)); }
      for (let x = 3; x <= 24; x += 1) if (x < 12 || x > 15) { if (rng() < .5) L(x, 13, T.FENCE); }
      if (cell.shore) { fill(0, 19, CW, 3, T.WATER); fill(2, 18, 24, 1, T.SAND); }
      fill(2, 9, 24, 4, G); fill(12, 2, 4, 17, G); fill(2, 18, 24, 1, cell.shore ? T.SAND : G);
      // streets
      fill(ex.includes('W') ? 0 : 3, 10, (ex.includes('E') ? CW : 25) - (ex.includes('W') ? 0 : 3), 2, T.PATH);
      fill(13, ex.includes('N') ? 0 : 9, 2, (ex.includes('S') ? CH : 19) - (ex.includes('N') ? 0 : 9), T.PATH);
      fill(3, 18, 22, 1, T.PATH);
      // buildings
      const roofOf = { home: T.ROOF, house: T.ROOF, hearth: T.ROOF_H, trade: T.ROOF_T, lodge: T.ROOF_L, study: T.ROOF_S, summit: T.ROOF_L };
      const embOf = { hearth: T.EMB_H, trade: T.EMB_T, lodge: T.EMB_L, summit: T.EMB_L };
      cell.builds.forEach((type, slot) => {
        if (!type) return;
        const x0 = [3, 8, 16, 21][slot % 4], y0 = slot < 4 ? 6 : 15, roof = roofOf[type];
        fill(x0 - 1, y0 - 1, 6, 4, G);
        fill(x0, y0, 4, 1, roof); fill(x0, y0 + 1, 4, 1, T.EAVE + roof - 9);
        L(x0, y0 + 2, T.WINDOW); L(x0 + 1, y0 + 2, T.DOOR); L(x0 + 2, y0 + 2, embOf[type] || T.WALL); L(x0 + 3, y0 + 2, T.WINDOW);
        L(x0 + 1, y0 + 3, T.PATH);
        const id = key + ':' + slot;
        buildInterior(type, id, cell, ox + x0 + 1, oy + y0 + 2, () => TIPS[tipIx++ % TIPS.length]);
      });
      L(16, 9, T.SIGN); world.signs[(ox + 16) + ',' + (oy + 9)] = cell.name.toUpperCase() + '\n' + cell.tag;
      const spots = [[6, 12], [20, 13], [10, 4], [23, 4]];
      (cell.folk || []).forEach((f, i) => {
        const [x, y] = spots[i]; L(x, y, G);
        if (f[1].startsWith('GIFT:')) { const p = f[1].split(':'); npc({ x, y, pal: f[0], dir: 'down', kind: 'gift', item: p[1], text: p[2], after: p[3], flag: 'gift:' + p[1] }); }
        else npc({ x, y, pal: f[0], dir: 'down', kind: 'talk', text: f[1] });
      });
      world.towns.push({ name: cell.name, x: ox + 14, y: oy + 10, cell });
    } else {
      // ---- routes and wild areas: dog-leg corridors from each exit to the centre ----
      const legs = [];
      const LEG = {
        W: [[0, 10], [4, 10], [4, 4], [10, 4], [10, 10], [13, 10]],
        E: [[26, 10], [22, 10], [22, 15], [16, 15], [16, 10], [13, 10]],
        N: [[13, 0], [13, 3], [20, 3], [20, 7], [13, 7], [13, 10]],
        S: [[13, 20], [13, 17], [5, 17], [5, 13], [13, 13], [13, 10]],
      };
      for (const d of ex) legs.push(LEG[d]);
      const sweep = (a, c, pad, fn) => {
        const x0 = Math.min(a[0], c[0]) - pad, x1 = Math.max(a[0], c[0]) + 1 + pad, y0 = Math.min(a[1], c[1]) - pad, y1 = Math.max(a[1], c[1]) + 1 + pad;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y);
      };
      for (const leg of legs) for (let i = 0; i < leg.length - 1; i++) sweep(leg[i], leg[i + 1], 2, (x, y) => { if (inner(x, y)) L(x, y, G); });
      // features
      if (cell.kind === 'area') {
        for (let y = 5; y <= 16; y++) for (let x = 6; x <= 21; x++) L(x, y, G);
        if (cell.feature === 'grove') for (let y = 5; y <= 16; y++) for (let x = 6; x <= 21; x++) { const r = rng(); L(x, y, r < .55 ? TG : r < .62 ? T.FLOWER : r < .66 ? O : G); }
        if (cell.feature === 'cove') { fill(2, 14, 24, 6, T.WATER); fill(6, 13, 16, 1, T.SAND); for (let y = 5; y <= 12; y++) for (let x = 6; x <= 21; x++) if (rng() < .3) L(x, y, TG); }
        if (cell.feature === 'crater') for (let y = 5; y <= 16; y++) for (let x = 6; x <= 21; x++) { const r = rng(); const edge = x < 9 || x > 18 || y < 7 || y > 14; L(x, y, edge ? (r < .5 ? TG : G) : (r < .16 ? T.LAVA : G)); }
        if (cell.feature === 'peak' || cell.feature === 'pit') for (let y = 5; y <= 16; y++) for (let x = 6; x <= 21; x++) { const r = rng(); const edge = x < 9 || x > 18 || y < 7 || y > 14; L(x, y, edge ? (r < .55 ? TG : G) : (r < .06 ? O : G)); }
      }
      if (cell.lush) for (let y = 2; y <= CH - 3; y++) for (let x = 2; x <= CW - 3; x++) if (LG(x, y) === G && rng() < .22) L(x, y, rng() < .8 ? TG : T.FLOWER);
      if (cell.pond) { const px = cell.pond === 'SW' ? 5 : 17; fill(px, 13, 6, 5, T.WATER); fill(px - 1, 12, 8, 1, G); if (cell.pond === 'SW') fill(11, 12, 1, 7, G); else fill(16, 12, 1, 7, G); }
      // paths
      for (const leg of legs) for (let i = 0; i < leg.length - 1; i++) sweep(leg[i], leg[i + 1], 0, (x, y) => L(x, y, T.PATH));
      if (cell.feature === 'lake') {
        for (let y = 5; y <= 16; y++) for (let x = 6; x <= 21; x++) L(x, y, LG(x, y) === T.PATH ? T.BRIDGE : T.WATER);
        fill(12, 9, 4, 4, T.BRIDGE);
        for (let x = 5; x <= 22; x++) { if (LG(x, 4) !== T.PATH) L(x, 4, rng() < .5 ? TG : G); if (LG(x, 17) !== T.PATH) L(x, 17, rng() < .5 ? TG : G); }
        for (let y = 4; y <= 17; y++) { if (LG(5, y) !== T.PATH) L(5, y, rng() < .5 ? TG : G); if (LG(22, y) !== T.PATH && LG(22, y) !== T.BRIDGE) L(22, y, rng() < .5 ? TG : G); }
      }
      // tall-grass bands across the corridor, side strips, trainers and items
      const slots = [], pockets = [];
      legs.forEach((leg) => {
        const a = leg[2], c = leg[3], horiz = a[1] === c[1];
        const mx = Math.floor((a[0] + c[0]) / 2), my = Math.floor((a[1] + c[1]) / 2);
        for (let u = -1; u <= 2; u++) for (let v = -2; v <= 3; v++) { const x = horiz ? mx + u : a[0] + v, y = horiz ? a[1] + v : my + u; if (inner(x, y) && isWalkable(LG(x, y)) && LG(x, y) !== T.BRIDGE) L(x, y, TG); }
        const s3a = leg[3], s3b = leg[4];
        sweep(s3a, s3b, 2, (x, y) => { if (inner(x, y) && LG(x, y) === G && rng() < .75) L(x, y, TG); });
        [[leg[1], leg[2]], [leg[3], leg[4]]].forEach(([p, q], k) => {
          const h = p[1] === q[1], sx = Math.floor((p[0] + q[0]) / 2), sy = Math.floor((p[1] + q[1]) / 2);
          const pos = h ? [sx, Math.min(p[1] + 3, CH - 3)] : [Math.max(p[0] - 2, 2), sy];
          slots.push({ k, x: pos[0], y: pos[1], dir: h ? 'up' : 'right', sight: 5 });
        });
        [2, 4].forEach(i => {
          const p = leg[i], prev = leg[i - 1], next = leg[i + 1];
          const dx = Math.sign(next[0] - p[0]) || Math.sign(prev[0] - p[0]), dy = Math.sign(next[1] - p[1]) || Math.sign(prev[1] - p[1]);
          const x = clamp(dx > 0 ? p[0] - 2 : p[0] + 3, 2, CW - 3), y = clamp(dy > 0 ? p[1] - 2 : p[1] + 3, 2, CH - 3);
          pockets.push([x, y]);
        });
      });
      slots.sort((p, q) => p.k - q.k);
      if (cell.feature === 'lake') slots.splice(0, slots.length, { x: 24, y: 13, dir: 'up', sight: 3 }, { x: 25, y: 15, dir: 'left', sight: 3 });
      (cell.trainers || []).forEach((t, i) => {
        const s = slots[i]; if (!s) return;
        L(s.x, s.y, G);
        const rival = t[0] === 'RIVAL';
        npc({ x: s.x, y: s.y, pal: t[1], dir: s.dir, kind: 'trainer', sight: s.sight, name: rival ? 'Rival ' + RIVAL.name : t[0], party: t[2], pre: t[3], post: t[4], flag: 'T:' + key + ':' + i, rival });
      });
      pockets.sort((p, q) => (p[0] * 7 + p[1] * 13) % 5 - (q[0] * 7 + q[1] * 13) % 5);
      const usable = cell.feature === 'lake' ? [[22, 5], [5, 17], [22, 16]] : pockets;
      (cell.items || []).forEach((it, i) => {
        const p = usable[i]; if (!p) return;
        L(p[0], p[1], G);
        npc({ x: p[0], y: p[1], obj: 'item', kind: 'item', item: it, flag: 'I:' + key + ':' + i });
      });
      if (cell.legend) { L(13, 10, cell.feature === 'lake' ? T.BRIDGE : T.PATH); npc({ x: 13, y: 10, mon: cell.legend[0], lvl: cell.legend[1], kind: 'legend', flag: 'L:' + cell.legend[0] }); }
    }
    // road wardens at gated exits
    for (const d in (cell.gates || {})) {
      const req = cell.gates[d];
      const pos = { E: [[26, 10], [26, 11]], W: [[1, 10], [1, 11]], N: [[13, 1], [14, 1]], S: [[13, 20], [14, 20]] }[d];
      const flag = 'gate:' + key + ':' + d;
      npc({ x: pos[0][0], y: pos[0][1], pal: 'guard', dir: { E: 'left', W: 'right', N: 'down', S: 'up' }[d], kind: 'gate', req, flag, hideFlag: flag });
      npc({ x: pos[1][0], y: pos[1][1], obj: 'barrier', kind: 'gate', req, flag, hideFlag: flag });
    }
  }
  return world;
}

function buildInterior(type, id, cell, doorX, doorY, tip) {
  const rows = INTERIORS[type], h = rows.length, w = rows[0].length;
  const tiles = new Uint8Array(w * h);
  rows.forEach((row, y) => { for (let x = 0; x < w; x++) tiles[y * w + x] = INT_CODE[row[x]]; });
  const cx = Math.floor(w / 2);
  const map = { id, w, h, tiles, npcs: [], warps: {}, signs: {}, interior: true, cell, type };
  map.cellAt = () => cell; map.biomeAt = () => 0;
  map.warps[cx + ',' + (h - 1)] = { map: 'world', x: doorX, y: doorY + 1, dir: 'down' };
  WORLD.warps[doorX + ',' + doorY] = { map: id, x: cx, y: h - 2, dir: 'up' };
  const npc = (n) => { n.map = id; n.id = id + '#' + map.npcs.length; map.npcs.push(n); return n; };
  if (type === 'house') npc({ x: 6, y: 3, pal: ['elder', 'lass', 'kid', 'hiker', 'ranger'][(doorX + doorY) % 5], dir: 'down', kind: 'talk', text: tip() });
  if (type === 'home') npc({ x: 6, y: 3, pal: 'healer', dir: 'down', kind: 'heal', home: 1, text: 'You look worn out. Sit down a minute, I\'ll look after your team.' });
  if (type === 'hearth') {
    npc({ x: 4, y: 1, pal: 'healer', dir: 'down', kind: 'heal', text: 'Welcome to the Hearth House. Let your team rest by the fire.' });
    npc({ x: 7, y: 3, pal: 'ranger', dir: 'left', kind: 'paddock', text: 'I keep the Paddock. Want to swap monsters in or out?' });
  }
  if (type === 'trade') npc({ x: 4, y: 1, pal: 'shop', dir: 'down', kind: 'shop', text: 'Trade Post. What do you need?' });
  if (type === 'lodge') {
    const n = cell.warden, wd = WARDENS[n], lt = LODGE_TRAINERS[n];
    npc({ x: 5, y: 1, pal: 'warden', dir: 'down', kind: 'trainer', sight: 0, name: wd.name, party: wd.party, pre: wd.pre, post: wd.post, flag: 'W:' + n, warden: n });
    npc({ x: 2, y: 6, pal: lt[0][1], dir: 'right', kind: 'trainer', sight: 7, name: lt[0][0], party: lt[0][2], pre: 'Nobody reaches the warden without getting past me.', post: 'Past me, then. Good luck.', flag: 'T:' + id + ':0' });
    npc({ x: 8, y: 4, pal: lt[1][1], dir: 'left', kind: 'trainer', sight: 7, name: lt[1][0], party: lt[1][2], pre: 'One more before the warden. That\'s me.', post: 'The warden won\'t go so easy.', flag: 'T:' + id + ':1' });
  }
  if (type === 'study') {
    npc({ x: 5, y: 2, pal: 'sage', dir: 'down', kind: 'sage' });
    [1, 4, 7].forEach((m, i) => npc({ x: 3 + i * 2, y: 4, mon: m, kind: 'starter', hideFlag: 'starter' }));
    npc({ x: 8, y: 5, pal: 'rival', dir: 'left', kind: 'talk', text: 'Hurry up and pick. I want whichever one beats yours.', hideFlag: 'starter' });
  }
  if (type === 'summit') {
    COUNCIL.forEach((c, i) => {
      const y = [21, 16, 11, 6, 2][i], flag = 'C:' + i;
      npc({ x: 4, y, pal: c.pal, dir: 'down', kind: 'trainer', sight: 0, name: c.name, party: c.party, pre: c.pre, post: c.post, flag, hideFlag: c.champion ? null : flag, council: i, champion: c.champion });
    });
  }
  MAPS[id] = map;
  return map;
}
