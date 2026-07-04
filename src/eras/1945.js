// Era data for 1945
// @type {Era}
import { create1945Scene } from '../../js/period1945.js';

const era1945 = {
  year: 1945,
  name: '1945: Post-War Era',
  theme: 'Post-war optimism, beginning of suburban life',
  furniture: [
    'Wooden tables with checked tablecloths',
    'Formica-topped counter stools',
    'Chrome-and-leather bar stools',
    'Wall-mounted coat hooks',
    'Classic wooden chairs with woven seats',
    'Vintage clock on the wall'
  ],
  decor: [
    'Traditional stovetop percolator',
    'Manual espresso machine',
    'Metal french press carafes',
    'Ceramic drip filters',
    'Menu board',
    'Wall-mounted wireless set/radio',
    'WWII-era propaganda posters',
    'Vintage Coca-Cola signs',
    'Hand-painted chalk menu board',
    '\'Open\' neon sign'
  ],
  menu: {
    items: [
      { name: 'Coffee', price: 0.05, description: 'Coffee' },
      { name: 'Cup of Coffee', price: 0.10, description: 'Cup of Coffee' },
      { name: 'Pie Slice', price: 0.15, description: 'Pie Slice' },
      { name: 'Milkshake', price: 0.20, description: 'Milkshake' }
    ],
    board: {
      special: 'Coffee and Pie - $0.20',
      hours: 'Open 6am-8pm',
      message: 'Buy War Bonds'
    }
  },
  audio: {
    music: {
      id: 'glenn-miller',
      type: 'swing',
      volume: 0.5
    },
    sfx: [
      { type: 'radio', id: 'news-bulletin' },
      { type: 'ambient', id: 'street-traffic' }
    ],
    ambientNoise: 'street_traffic_and_radio'
  },
  lighting: {
    color: '#ffffcc',
    intensity: 0.8,
    fixtureType: 'incandescent'
  },
  signage: {
    posters: [
      'Buy War Bonds',
      'Keep Your Eyes on the Mark'
    ],
    menuBoard: {
      material: 'wood',
      style: 'hand-painted'
    },
    windowDisplays: [
      'Victory garden display',
      'War bond poster'
    ]
  },
  patrons: {
    outfits: [
      'Soldiers in uniform',
      'Women in hats/dresses (typical 1940s fashion)'
    ],
    hairstyles: [
      'Victory rolls',
      'Slicked-back hair'
    ],
    gadgets: [
      'Wooden radio',
      'Manual telephone'
    ]
  },
  counterTech: 'Manual cash register with metal keys',
  buildScene: create1945Scene
};

export default era1945;