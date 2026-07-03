import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1965 = {
  year: 1965,
  name: '1960s Mod',
  theme: 'Swinging London meets American diners',
  furniture: ['Plastic laminate tables', 'Vinyl booth with chrome trim', 'Milk stools', 'Shag carpet'],
  decor: ['Psychedelic wall murals', 'Wood-paneled accent walls', ' lava lamp displays', 'Pop Art posters'],
  menu: {
    items: [
      { name: 'Rocky Road Milkshake', price: 0.45, description: 'Decadent vanilla shake with almonds and cherries' },
      { name: 'Club Sandwich', price: 0.55, description: 'Triple-decker with turkey, ham, lettuce, tomato' },
      { name: 'Coffee Pot Pie', price: 0.65, description: 'Sweet pastry filled with coffee-flavored custard' },
      { name: 'Jell-O Salad', price: 0.40, description: 'Gelatin salad with fruit and whipped cream' }
    ],
    board: { style: 'Neon menu board', material: 'Acrylic panels' }
  },
  audio: {
    music: { id: 'britpop_1965', type: 'Stereo System', volume: 0.75 },
    sfx: [
      { type: 'soda_fountain', id: 'syrup_pour_01' },
      { type: 'cash_register', id: 'cha-ching_01' },
      { type: 'radio_static', id: 'static_buzz_01' }
    ],
    ambientNoise: 'soft_rock_and_roll'
  },
  lighting: { color: '#FFD700', intensity: 0.7, fixtureType: 'Chrome pendant with frosted glass' },
  signage: {
    posters: ['British Invasion Poster', 'Space Race Advertisement', 'Mod Fashion Flyer'],
    menuBoard: { style: 'Glowing neon', frame: 'Chrome' },
    windowDisplays: ['Mini Cooper Display', 'Music Records Showcase']
  },
  patrons: {
    outfits: ['Mini skirts', 'Bell-bottoms', 'Mod suits', 'Go-go boots'],
    hairstyles: ['Beehive', 'Twiggy bob', 'Afro', 'Side part'],
    gadgets: ['Portable transistor radio', 'Polaroid camera', 'Fender guitar', 'Mixtape']
  },
  counterTech: 'Electric soda fountain with chrome trim'
};

export default Period1965;
