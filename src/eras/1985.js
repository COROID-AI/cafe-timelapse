/**
 * @typedef {import('../contracts/PeriodPackage.js').Era} Era
 */

/**
 * Era data for 1985
 * @type {Era}
 */
const era1985 = {
  year: 1985,
  name: '1985: Neon & MTV',
  theme: 'Neon colors, arcade culture, rise of MTV',
  furniture: [
    'Glass coffee table with metal base',
    'Black leather sofa',
    'Arcade cabinet (Pac-Man)',
    'Stereo system with large speakers',
    'Geometric patterned rug'
  ],
  decor: [
    'Neon signs',
    'Memphis Milano patterns',
    'Rubik\'s cube',
    'Posters of Madonna and Michael Jackson',
    'Mirrored wall tiles'
  ],
  menu: {
    items: [
      { name: 'Chicken McNuggets', price: 1.95, description: 'Chicken McNuggets with sauce' },
      { name: 'Diet Coke', price: 0.75, description: 'Silver can Diet Coke' },
      { name: 'Hot Pocket', price: 1.25, description: 'Microwaveable pepperoni pizza pocket' },
      { name: 'Slurpee', price: 1.00, description: 'Cherry flavored Slurpee' },
      { name: 'Lean Cuisine', price: 2.25, description: 'Microwaveable chicken dinner' }
    ],
    board: {
      special: 'McNuggets Meal - $1.95',
      hours: 'Open 24 hours',
      message: 'Totally awesome!'
    }
  },
  audio: {
    music: {
      id: 'michael-jackson',
      type: 'pop',
      volume: 0.7
    },
    sfx: [
      { type: 'arcade', id: 'pac-man' },
      { type: 'boombox', id: 'mix-tape' }
    ],
    ambientNoise: 'arcade_and_boombox'
  },
  lighting: {
    color: '#ff00ff',
    intensity: 0.9,
    fixtureType: 'track_lighting'
  },
  signage: {
    posters: [
      'Madonna Like a Virgin Tour',
      'Back to the Future Poster',
      'Nintendo Entertainment System'
    ],
    menuBoard: {
      material: 'plastic',
      style: 'neon glow'
    },
    windowDisplays: [
      'Neon open sign',
      'Arcade game display'
    ]
  },
  patrons: {
    outfits: [
      'Members Only jacket, acid wash jeans',
      'Lace gloves, big hair, leg warmers'
    ],
    hairstyles: [
      'Big hair, mullet, crimped hair'
    ],
    gadgets: [
      'Walkman cassette player',
      'NES controller'
    ]
  },
  counterTech: 'Electronic cash register with barcode scanner'
};

module.exports = era1985;