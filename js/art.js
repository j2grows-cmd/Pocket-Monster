'use strict';
/* Illustrated art: monsters, battle scenes, the title, people, sigils and items.
   Every image is optional. Until one has loaded, or if a file is missing, the game draws its
   built-in pixel art for that thing instead, so it still runs from a bare copy of the code.
   The sheets are cut from the source illustrations by tools/art. */
const Art = {
  dir: 'assets/', img: {},
  FILES: ['mon-32', 'mon-64', 'mon-128', 'mon-160', 'title', 'bg-meadow', 'bg-mountain', 'bg-volcano', 'bg-darkwood', 'bg-snow', 'bg-coast', 'bg-hall',
    'people', 'faces-48', 'faces-32', 'sigils-64', 'sigils-16', 'items-32', 'items-16'],
  SCENES: ['bg-meadow', 'bg-mountain', 'bg-volcano', 'bg-darkwood', 'bg-snow', 'bg-coast'],
  // who stands where on the character sheet
  PEOPLE: { Fern: 3, Marlow: 4, Volta: 5, Garnet: 6, Ignacia: 7, Aerin: 8, Morwen: 9, Halvard: 10, Thane: 11, Sybil: 12, Rook: 13, Brine: 14, Isolde: 15 },
  LOOKS: { hero: 0, rival: 1, sage: 2 },
  ITEMS: { 'Tin Charm': 0, 'Silver Charm': 1, 'Gold Charm': 2, Tonic: 3, Elixir: 4, 'Grand Elixir': 4, Ambrosia: 5, Panacea: 6, Wakeroot: 7 },
  load() {
    return Promise.all(this.FILES.map(n => new Promise(done => {
      const im = new Image();
      im.onload = () => { this.img[n] = im; Sprites.reset(); done(); };
      im.onerror = () => done();
      im.src = this.dir + n + '.png';
    })));
  },
  /* One cell of a sheet as its own canvas, optionally mirrored. */
  cell(name, i, w, h, cols, flip) {
    const im = this.img[name]; if (!im || i < 0) return null;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    if (flip) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(im, (i % cols) * w, Math.floor(i / cols) * h, w, h, 0, 0, w, h);
    return c;
  },
  mon(id, size, flip) { return this.cell('mon-' + size, id - 1, size, size, 12, flip); },
  scene(bio) { return this.img[bio === -1 ? 'bg-hall' : this.SCENES[bio]] || null; },
  /* Sheet position for a named person, or for a look only one person has. -1 if they have no portrait. */
  person(pal, name) {
    const last = name ? String(name).split(' ').pop() : '';
    if (last in this.PEOPLE) return this.PEOPLE[last];
    return pal in this.LOOKS ? this.LOOKS[pal] : -1;
  },
};
