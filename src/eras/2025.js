/**
 * @typedef {import('../contracts/PeriodPackage.js').Era} Era
 */

/**
 * Era data for 2025
 * @type {Era}
 */
const era2025 = {
  year: 2025,
  name: '2025: Sustainable Tech & AI',
  theme: 'Sustainability, AI integration, touchless technology',
  furniture: [
    'Modular sofa made from recycled materials',
    'Bamboo standing desk',
    'Induction cooktop',
    'Smart refrigerator with touchscreen',
    'Ergonomic chair with lumbar support'
  ],
  decor: [
    'Living wall with air-purifying plants',
    'Solar-powered wireless charger',
    'Digital art frame',
    'Recycled glass pendant lights',
    'Biodegradable tableware'
  ],
  menu: {
    items: [
      { name: 'Plant-Based Burger', price: 8.95, description: 'Beyond Meat patty with vegan cheese' },
      { name: 'Oat Milk Latte', price: 4.50, description: 'Espresso with steamed oat milk' },
      { name: 'Avocado Toast', price: 7.25, description: 'Sourdough with smashed avocado and seeds' },
      { name: 'Kombucha', price: 3.50, description: 'Fermented tea, ginger flavor' },
      { name: 'Quinoa Bowl', price: 9.50, description: 'With roasted vegetables and tahini dressing' }
    ],
    board: {
      special: 'Plant-Based Lunch Combo - $12.95',
      hours: 'Open 7am-9pm',
      message: 'Carbon neutral cafe'
    }
  },
  audio: {
    music: {
      id: 'ai-generated-ambient',
      type: 'ambient',
      volume: 0.5
    },
    sfx: [
      { type: 'espresso-machine', id: 'smart-machine' },
      { type: 'robot', id: 'server-bot' }
    ],
    ambientNoise: 'ai_ambient_and_machines'
  },
  lighting: {
    color: '#00ff88',
    intensity: 0.8,
    fixtureType: 'led_panel'
  },
  signage: {
    posters: [
      'AI Art Exhibition',
      'Sustainable Living Tips',
      'Community Garden Workshop'
    ],
    menuBoard: {
      material: 'recycled_aluminum',
      style: 'e-ink display'
    },
    windowDisplays: [
      'Living wall display',
      'Electric vehicle charging station info'
    ]
  },
  patrons: {
    outfits: [
      'Athleisure wear, sustainable fabrics',
      'Tech workers: branded hoodies, jeans'
    ],
    hairstyles: [
      'Natural textures, diverse styles'
    ],
    gadgets: [
      'AR glasses',
      'Smartwatch with health sensors'
    ]
  },
  counterTech: 'Contactless POS with facial recognition and crypto payment'
};

module.exports = era2025;