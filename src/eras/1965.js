// Era data for 1965
// @type {Era}
const era1965 = {
  year: 1965,
  name: '1965: Swinging Sixties',
  theme: 'Mod culture, British Invasion, space age optimism',
  furniture: [
    'Eames lounge chair',
    'Formica dining set with chrome legs',
    'Shag rug',
    'Bar cart with cocktail shaker',
    'Record player console'
  ],
  decor: [
    'Andy Warhol prints',
    'Lava lamp',
    'Geometric wallpaper',
    'Sputnik chandelier',
    'Macrame wall hanging'
  ],
  menu: {
    items: [
      { name: 'Beef Wellington', price: 1.25, description: 'Beef tenderloin wrapped in puff pastry' },
      { name: 'Deviled Eggs', price: 0.35, description: 'Classic deviled eggs with paprika' },
      { name: 'Fondue Platter', price: 1.50, description: 'Swiss cheese fondue with bread and vegetables' },
      { name: 'Tang', price: 0.10, description: 'Orange-flavored drink mix' },
      { name: 'Tab Cola', price: 0.10, description: 'Diet cola beverage' }
    ],
    board: {
      special: 'Beef Wellington Night - $1.25',
      hours: 'Open 7am-9pm',
      message: 'Groovy baby!'
    }
  },
  audio: {
    music: {
      id: 'beatles',
      type: 'rock',
      volume: 0.6
    },
    sfx: [
      { type: 'jukebox', id: 'beatles-hit' },
      { type: 'ambient', id: 'espresso-machine' }
    ],
    ambientNoise: 'jukebox_and_espresso'
  },
  lighting: {
    color: '#ffcc99',
    intensity: 0.7,
    fixtureType: 'fluorescent'
  },
  signage: {
    posters: [
      'Beatles Concert Poster',
      'Mary Quant Fashion',
      'PSA: Seat Belts Save Lives'
    ],
    menuBoard: {
      material: 'plastic',
      style: 'mod geometric'
    },
    windowDisplays: [
      'Mod mannequin in mini skirt',
      'Lava lamp display'
    ]
  },
  patrons: {
    outfits: [
      'Women: mini skirts, go-go boots, men: turtlenecks, blazers',
      'Hippie: tie-dye, bell bottoms, fringe'
    ],
    hairstyles: [
      'Women: beehive, men: mop top, long hair for hippies'
    ],
    gadgets: [
      'Transistor radio',
      'Rotary phone with colorful buttons'
    ]
  },
  counterTech: 'Electronic cash register with LED display'
};

export default era1965;