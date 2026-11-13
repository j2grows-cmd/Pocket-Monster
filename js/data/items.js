'use strict';
const ITEMS = {
  'Tin Charm': { price: 100, kind: 'charm', bonus: 1, desc: 'A simple charm for befriending a wild monster.' },
  'Silver Charm': { price: 350, kind: 'charm', bonus: 1.6, desc: 'A finer charm. Works more often.' },
  'Gold Charm': { price: 900, kind: 'charm', bonus: 2.4, desc: 'The best charm coin can buy.' },
  'Tonic': { price: 120, kind: 'heal', hp: 25, desc: 'Restores 25 HP.' },
  'Elixir': { price: 380, kind: 'heal', hp: 70, desc: 'Restores 70 HP.' },
  'Grand Elixir': { price: 850, kind: 'heal', hp: 180, desc: 'Restores 180 HP.' },
  'Ambrosia': { price: 2200, kind: 'heal', hp: 9999, cure: 1, desc: 'Restores all HP and cures any condition.' },
  'Panacea': { price: 180, kind: 'cure', desc: 'Cures burn, frostbite, poison, sleep and stun.' },
  'Wakeroot': { price: 1200, kind: 'revive', desc: 'Revives a fainted monster with half its HP.' },
  'Ward Incense': { price: 300, kind: 'ward', steps: 150, desc: 'Keeps wild monsters away for 150 steps.' },
  'Fishing Rod': { key: 1, desc: 'Face water and press A to fish.' },
  'Town Map': { key: 1, desc: 'A map of the Vessara region.' },
};
function shopStock(sigils) {
  const s = ['Tin Charm', 'Tonic', 'Panacea', 'Ward Incense'];
  if (sigils >= 2) s.push('Silver Charm', 'Elixir');
  if (sigils >= 4) s.push('Grand Elixir', 'Wakeroot');
  if (sigils >= 6) s.push('Gold Charm', 'Ambrosia');
  return s;
}
