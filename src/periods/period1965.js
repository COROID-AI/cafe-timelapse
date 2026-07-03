import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1965 = {
  year: 1965,
  name: '1960s Mod',
  theme: 'Swinging London meets American diners',
  furniture: [
    'Teardrop-shaped plastic laminate tables',
    'Retro chrome-and-plastic bar stools',
    'Vinyl booth with chrome trim',
    'Shag rug'
  ],
  decor: [
    'Psychedelic wall murals',
    'Wood-paneled accent walls',
    'Lava lamp displays',
    'Atomic Age starburst wall clock',
    'Floor-standing jukebox (Wurlitzer style)',
    'Colorful 1960s dinnerware (orange, turquoise, avocado) on tables',
    'Neon accent lighting',
    'Early 1960s electric drip coffee maker',
    'Chrome espresso machine with chrome drip trays',
    'Percolator on display',
    'Pop Art posters'
  ],
  menu: {
    items: [
      { name: 'Rocky Road Milkshake', price: 0.35, description: 'Decadent vanilla shake with almonds and cherries' },
      { name: 'Club Sandwich', price: 0.45, description: 'Triple-decker with turkey, ham, lettuce, tomato' },
      { name: 'Coffee Pot Pie', price: 0.25, description: 'Sweet pastry filled with coffee-flavored custard' },
      { name: 'Jell-O Salad', price: 0.30, description: 'Gelatin salad with fruit and whipped cream' }
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
  lighting: { color: '#FFD700', intensity: 0.7, fixtureType: 'Globe pendant light' },
  signage: {
    posters: [
      'Beatles \"Help!\" Poster',
      '1965 New York Travel Poster',
      'Mod Fashion Flyer',
      '1965 World\'s Fair Poster'
    ],
    menuBoard: { style: 'Glowing neon', frame: 'Chrome' },
    windowDisplays: [
      'Mini Cooper Display',
      'Music Records Showcase'
    ]
  },
  patrons: {
    outfits: [
      'Mini skirts',
      'Bell-bottoms',
      'Mod suits',
      'Go-go boots'
    ],
    hairstyles: [
      'Beehive',
      'Twiggy bob',
      'Bouffant',
      'Afro',
      'Side part'
    ],
    gadgets: [
      'Portable transistor radio',
      'Polaroid camera',
      'Fender guitar',
      'Mixtape'
    ]
  },
  counterTech: 'Electric soda fountain with chrome trim and electronic cash register with paper receipts'
};

export default Period1965;