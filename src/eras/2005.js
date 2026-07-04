// Era data for 2005
// @type {Era}
const era2005 = {
  year: 2005,
  name: '2005: Y2K & Early Internet',
  theme: 'Y2K aesthetic, early social media, iPod era',
  furniture: [
    'IKEA Billy bookcase',
    'Bean bag chair',
    'iPod docking station',
    'Flat screen TV (early LCD)',
    'Plastic folding chairs'
  ],
  decor: [
    'LiveStrong bracelet',
    'MySpace poster',
    'Floppy disk coasters',
    'Glow-in-the-dark stars',
    'Inflatable furniture'
  ],
  menu: {
    items: [
      { name: 'Starbucks Latte', price: 2.95, description: 'Espresso and steamed milk' },
      { name: 'Subway Sandwich', price: 4.50, description: '6-inch turkey sub' },
      { name: 'Krispy Kreme Donut', price: 0.75, description: 'Original glazed donut' },
      { name: 'Red Bull', price: 2.00, description: 'Energy drink' },
      { name: 'Lean Pocket', price: 1.99, description: 'Microwaveable ham and cheese pocket' }
    ],
    board: {
      special: 'Latte and Donut Combo - $3.50',
      hours: 'Open 6am-10pm',
      message: 'Free Wi-Fi!'
    }
  },
  audio: {
    music: {
      id: 'coldplay',
      type: 'alternative',
      volume: 0.6
    },
    sfx: [
      { type: 'ipod', id: 'shuffle' },
      { type: 'dialup', id: 'internet-connection' }
    ],
    ambientNoise: 'ipod_and_dialup'
  },
  lighting: {
    color: '#99ccff',
    intensity: 0.7,
    fixtureType: 'recessed_lighting'
  },
  signage: {
    posters: [
      'Facebook Launch Poster',
      'iPod Silhouette Ad',
      'Harry Potter Book 6 Release'
    ],
    menuBoard: {
      material: 'digital',
      style: 'LCD screen'
    },
    windowDisplays: [
      'iPod display',
      'MySpace theme window'
    ]
  },
  patrons: {
    outfits: [
      'Low-rise jeans, crop tops, men: polo shirts, jeans',
      'Scene: dyed black hair, band t-shirts, skinny jeans'
    ],
    hairstyles: [
      'Women: straightened, men: spiky or shaggy'
    ],
    gadgets: [
      'iPod Nano',
      'Motorola Razr flip phone'
    ]
  },
  counterTech: 'Touchscreen cash register with credit card reader'
};

export default era2005;