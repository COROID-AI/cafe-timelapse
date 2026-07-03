import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1985 = {
  year: 1985,
  name: '1980s Retro',
  theme: 'Neon and synth culture',
  furniture: ['Laminate tables with chrome legs', 'Orange vinyl booth', 'Plastic swivel chairs', 'Checkerboard tile floor'],
  decor: ['Neon tube lighting', 'Graffiti art', 'Record wall', 'Vintage arcade cabinet'],
  menu: {
    items: [
      { name: 'Big Gulp Soda', price: 1.25, description: 'Giant cup of cola with straw and lid' },
      { name: 'Taco Salad', price: 3.50, description: 'Refried beans, lettuce, cheese, and salsa in a tortilla bowl' },
      { name: 'Pretzel Bites', price: 2.25, description: 'Warm soft pretzels with cheese dip' },
      { name: 'Jell-O Pudding Cup', price: 1.50, description: 'Chocolate pudding in a plastic cup' }
    ],
    board: { style: 'Digital LED menu', material: 'Plastic casing' }
  },
  audio: {
    music: { id: 'synthpop_1985', type: 'Boombox', volume: 0.8 },
    sfx: [
      { type: 'microwave_beep', id: 'beep_chirp_01' },
      { type: 'calculator_keys', id: 'key_click_01' },
      { type: 'tape_deck', id: 'tape_rewind_01' }
    ],
    ambientNoise: 'synthwave_and_80s_hits'
  },
  lighting: { color: '#FF69B4', intensity: 0.8, fixtureType: 'Neon tubes and blacklight' },
  signage: {
    posters: ['Miami Vice Poster', 'Pac-Man Flyer', 'MTV Logo Poster', 'Star Wars Posters'],
    menuBoard: { style: 'Glowing LED display', frame: 'Black plastic' },
    windowDisplays: ['Cassette tapes display', 'Nintendo setup showcase']
  },
  patrons: {
    outfits: ['Leg warmers', 'Spandex', 'Shoulder pads', 'Sweatband'],
    hairstyles: ['Mullet', 'Crimped hair', 'Side ponytail', 'Headband'],
    gadgets: ['Walkman', 'Beepers', 'Nintendo Game Boy', 'Atari joystick']
  },
  counterTech: 'Digital cash register with credit card slot'
};

export default Period1985;
