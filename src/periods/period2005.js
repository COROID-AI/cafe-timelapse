import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period2005 = {
  year: 2005,
  name: '2005 Hipster Café',
  theme: 'Hipster café with industrial aesthetic',
  furniture: [
    'Industrial-style wooden tables',
    'Wrought-iron chairs',
    'Vintage barn wood accents',
    'Exposed brick walls'
  ],
  decor: [
    'Vinyl record display on wall',
    'Modern semi-automatic espresso machine with dual boilers',
    'Grinder with dosing chamber',
    'Pour-over setup',
    'Branded coffee bean bags',
    'iPod dock station',
    'Glass mugs',
    'Branded ceramic cups',
    'To-go cups',
    'Edison bulb pendants',
    'Tungsten track lighting'
  ],
  menu: {
    items: [
      { name: 'Espresso', price: 2.50, description: 'Single shot espresso' },
      { name: 'Americano', price: 2.75, description: 'Espresso with hot water' },
      { name: 'Latte', price: 3.50, description: 'Espresso with steamed milk' },
      { name: 'Cappuccino', price: 3.75, description: 'Espresso with steamed milk and foam' },
      { name: 'Mocha', price: 4.25, description: 'Espresso with chocolate and steamed milk' },
      { name: 'Pastry', price: 3.00, description: 'Freshly baked pastry' }
    ],
    board: { style: 'Chalkboard menu', material: 'Wooden frame' }
  },
  audio: {
    music: { id: 'indie_2005', type: 'iPod', volume: 0.65 },
    sfx: [
      { type: 'espresso_machine', id: 'steam_hiss_01' },
      { type: 'cell_phone', id: 'flip_phone_ring_01' },
      { type: 'ipod', id: 'click_wheel_01' }
    ],
    ambientNoise: 'indie_rock_and_podcasts'
  },
  lighting: { color: '#FFE4B5', intensity: 0.6, fixtureType: 'Edison bulb pendants and tungsten track lighting' },
  signage: {
    posters: ['Arctic Monkeys Poster', 'The Strokes Poster', 'Free Wi-Fi Window Decal', 'Modest Mouse Poster'],
    menuBoard: { style: 'Chalkboard menu', frame: 'Wooden' },
    windowDisplays: ['Free Wi-Fi sign', 'Vinyl record display']
  },
  patrons: {
    outfits: ['Skinny jeans', 'Flannel shirts', 'Converse sneakers', 'Emo band t-shirts'],
    hairstyles: ['Emo bangs', 'Messy shag', 'Side-swept bangs', 'Asymmetrical cut'],
    gadgets: ['iPod Classic', 'Flip phone', 'Digital camera', 'MacBook laptop']
  },
  counterTech: 'Touchscreen POS system with magnetic stripe reader'
};

export default Period2005;
