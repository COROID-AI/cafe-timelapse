/**
 * @typedef {import('../contracts/PeriodPackage.js').Era} Era
 */

/**
 * Era data for 1945
 * @type {Era}
 */
const era1945 = {
  year: 1945,
  name: '1945: Post-War Era',
  theme: 'Post-war optimism, beginning of suburban life',
  furniture: [
    'Wooden radio',
    'Formica kitchen table',
    'Metal kitchen chairs',
    'Wooden icebox',
    'Coal stove'
  ],
  decor: [
    'Victory garden posters',
    'Handmade quilts',
    'Enamelware',
    'Wire baskets',
    'Cloth curtains'
  ],
  menu: {
    items: [
      { name: 'Meatloaf', price: 0.35, description: 'Classic meatloaf with gravy' },
      { name: 'Victory Garden Vegetables', price: 0.25, description: 'Seasonal vegetables from the garden' },
      { name: 'Apple Pie', price: 0.15, description: 'Homemade apple pie with lattice crust' },
      { name: 'Coffee', price: 0.05, description: 'Brewed coffee' },
      { name: 'Milk', price: 0.05, description: 'Fresh milk' }
    ],
    board: {
      special: 'Meatloaf Special - $0.35',
      hours: 'Open 6am-8pm',
      message: 'Support our troops!'
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
      'War Bonds Poster',
      'Rosie the Riveter',
      'Buy War Stamps'
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
      'Women: dresses with aprons, men: suits and hats',
      'Children: knitted sweaters, short pants'
    ],
    hairstyles: [
      'Women: victory rolls, men: short back and sides'
    ],
    gadgets: [
      'Wooden radio',
      'Manual telephone'
    ]
  },
  counterTech: 'Manual cash register with metal keys'
};

module.exports = era1945;