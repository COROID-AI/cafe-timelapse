import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1985 = {
  year: 1985,
  name: '1980s Retro',
  theme: 'Neon and synth culture',
  furniture: ['Boxy wood-paneled tables', 'Neon-accented vinyl booth', 'Geometric pattern wallpaper', 'MTV-era wall art', 'Boombox display on counter'],
  decor: ['Full-size automatic espresso machine with milk steamer', 'Commercial drip coffee system with warming plate', 'Bagged whole beans display', 'Neon tube lighting', 'Geometric pattern wallpaper', 'MTV-era wall art', 'Boombox display on counter', 'Disposable plastic cups with lids', 'Ceramic mugs with 80s graphics'],
  menu: {
    items: [
      { name: 'Coffee', price: 1.25, description: 'Regular brewed coffee' },
      { name: 'Latte', price: 2.50, description: 'Espresso with steamed milk' },
      { name: 'Cappuccino', price: 2.75, description: 'Espresso with steamed milk and foam' },
      { name: 'Scone', price: 2.00, description: 'Freshly baked scone' }
    ],
    board: { style: 'Backlit menu board', material: 'Metal and plastic' }
  },
  audio: {
    music: { id: 'boombox_cassette_01', type: 'Boombox', volume: 0.8 },
    sfx: [
      { type: 'espresso_machine', id: 'espresso_steam_01' },
      { type: 'cash_register', id: 'cash_drawer_cha_ching' },
      { type: 'tape_deck', id: 'tape_insert_01' }
    ],
    ambientNoise: '80s_pop_and_rock'
  },
  lighting: { color: '#FFFFFF', intensity: 0.9, fixtureType: 'Fluorescent tube lights, neon tubes, and track lighting' },
  signage: {
    posters: ['Miami Vice Poster', 'Bruce Springsteen Born in the USA Poster', 'U2 Joshua Tree Poster', 'MTV Logo Poster'],
    menuBoard: { style: 'Backlit menu board', frame: 'Metal and plastic' },
    windowDisplays: ['Cassette tape display', 'Neon sign artwork']
  },
  patrons: {
    outfits: ['Shoulder-pad blazers', 'Acid-wash denim jackets', 'Mini skirts', 'Leg warmers'],
    hairstyles: ['Big hair', 'Permed curls', 'Mullet', 'High ponytail'],
    gadgets: ['Sony Walkman', 'Casio calculator watch', 'Polaroid camera', 'Amateur radio']
  },
  counterTech: 'Digital LCD cash register with thermal receipt printer'
};

export default Period1985;
