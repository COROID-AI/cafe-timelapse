import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period2025 = {
  year: 2025,
  name: '2020s Modern',
  theme: 'Contemporary sustainable café culture',
  furniture: [
    'Reclaimed wood and bamboo tables',
    'Mid-century modern lounge chairs',
    'Live-edge wood counter',
    'Bar-height counter stools',
    'Recycled material flooring'
  ],
  decor: [
    'Living green walls',
    'Gallery-style art prints',
    'Smart mirrors',
    'Minimalist sculptures',
    'Hanging plant installations',
    'Smart display screens',
    'Smart espresso machine with touchscreen',
    'IoT-connected grinder',
    'Single-serve specialty brewer (Fellow)',
    'Cold brew tower',
    'Nitrogen tap system',
    'Bluetooth smart speaker',
    'Sustainable decals',
    'QR code standee',
    'Reusable ceramic cups',
    'Compostable to-go cups',
    'Digital tablets on tables'
  ],
  menu: {
    items: [
      { name: 'Cold Brew Nitro', price: 5.95, description: 'Nitrogen-infused cold brew with creamy texture' },
      { name: 'Matcha Latte', price: 5.50, description: 'Organic matcha with oat milk' },
      { name: 'Oat Milk Latte', price: 4.95, description: 'Organic oat milk with single-origin espresso' },
      { name: 'Avocado Toast', price: 8.95, description: 'Sourdough with smashed avocado, radish, and microgreens' },
      { name: 'Plant-Based Bowl', price: 9.95, description: 'Quinoa, roasted vegetables, tahini dressing' }
    ],
    board: { style: 'Interactive digital display', material: 'Sustainable bamboo' }
  },
  audio: {
    music: { id: 'lofi_2025', type: 'Smart Speaker', volume: 0.6 },
    sfx: [
      { type: 'coffee_machine', id: 'brew_cycle_01' },
      { type: 'payment_door', id: 'beep_bip_01' },
      { type: 'air_purifier', id: 'soft_hum_01' }
    ],
    ambientNoise: 'lofi_hip_hop_and_nature_sounds'
  },
  lighting: { color: '#F0F8FF', intensity: 0.5, fixtureType: 'Smart LED downlights and modern geometric pendant lights' },
  signage: {
    posters: ['Sustainability Infographic', 'Local Art Flyer', 'QR Code Menu Board', 'Plant-Based Poster'],
    menuBoard: { style: 'Interactive touchscreen', frame: 'Recycled aluminum' },
    windowDisplays: ['Zero-waste showcase', 'Local artisan products display']
  },
  patrons: {
    outfits: ['Athleisure wear', 'Sustainable fashion', 'Vintage revival', 'Tech wear'],
    hairstyles: ['Natural curls', 'Balayage highlights', 'Braided updos', 'Pixie cut'],
    gadgets: ['Smartphone', 'E-reader', 'Wireless earbuds (AirPods)', 'Smartwatch', 'Laptop']
  },
  counterTech: 'Contactless NFC payment terminal with tablet-based POS'
};

export default Period2025;
