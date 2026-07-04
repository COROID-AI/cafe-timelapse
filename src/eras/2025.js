// Era data for 2025
// @type {Era}
import { create2025Scene } from '../../js/period2025.js';

const era2025 = {
  year: 2025,
  name: '2025: Modern Sustainable Cafe',
  theme: 'Modern minimalist design with sustainable materials and smart technology',
  furniture: [
    'Bamboo and reclaimed wood tables',
    'Mid-century modern lounge chairs',
    'Hanging plant installations',
    'Live-edge wood counter',
    'Smart display screens'
  ],
  decor: [
    'Smart espresso machine with touchscreen interface',
    'IoT-connected grinder',
    'Single-serve specialty brewer (like Acaia or Fellow)',
    'Cold brew tower',
    'Nitrogen tap system'
  ],
  menu: {
    items: [
      { name: 'Coffee', price: 3.75, description: 'Freshly brewed coffee' },
      { name: 'Oat Milk Latte', price: 5.25, description: 'Espresso with steamed oat milk' },
      { name: 'Matcha Latte', price: 5.50, description: 'Premium matcha with oat milk' },
      { name: 'Cold Brew', price: 4.50, description: 'Cold brew coffee served over ice' },
      { name: 'Avocado Toast', price: 12.00, description: 'Sourdough with smashed avocado, seeds, and microgreens' }
    ],
    board: {
      special: 'Avocado Toast & Latte - $15.00',
      hours: 'Open 6am-8pm',
      message: 'WiFi available - Ask for password'
    }
  },
  audio: {
    music: {
      id: 'lo-fi-beats-playlist',
      type: 'lo-fi electronic',
      volume: 0.5
    },
    sfx: [
      { type: 'espresso-machine', id: 'smart-espresso' },
      { type: 'grinder', id: 'iot-grinder' }
    ],
    ambientNoise: 'cafe_ambient_modern'
  },
  lighting: {
    color: '#ffffff',
    intensity: 0.9,
    fixtureType: 'led_downlight'
  },
  signage: {
    posters: [
      'Abstract geometric art print',
      'Minimalist line art wall decor'
    ],
    menuBoard: {
      material: 'recycled_acrylic',
      style: 'digital_display'
    },
    windowDisplays: [
      'Sustainable practices notice',
      'Local artist collaboration'
    ]
  },
  patrons: {
    outfits: [
      'Modern casual: oversized hoodies, vintage-look flannel, athleisure',
      'Diverse styles: business casual, creative professional'
    ],
    hairstyles: [
      'Natural textures, diverse styles',
      'Modern cuts, fades, braids'
    ],
    gadgets: [
      'AirPods/true wireless earbuds visible',
      'Smartphones in hand',
      'Smartwatches',
      'Laptop computers open on tables'
    ]
  },
  counterTech: 'Contactless payment terminal (tap-to-pay, Apple Pay, Google Pay), QR code ordering system, tablet-based POS, self-service kiosk option, mobile order pickup shelf',
  buildScene: create2025Scene
};

export default era2025;