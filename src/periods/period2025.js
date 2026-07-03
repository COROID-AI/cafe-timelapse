import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period2025 = {
  year: 2025,
  name: '2020s Modern',
  theme: 'Contemporary sustainable café culture',
  furniture: ['Reclaimed wood tables', 'Ergonomic upholstered chairs', 'Bar-height counter stools', 'Recycled material flooring'],
  decor: ['Living green walls', 'Contemporary art', 'Smart mirrors', 'Minimalist sculptures'],
  menu: {
    items: [
      { name: 'Cold Brew Nitro', price: 5.95, description: 'Nitrogen-infused cold brew with creamy texture' },
      { name: 'Avocado Toast', price: 8.95, description: 'Sourdough with smashed avocado, radish, and microgreens' },
      { name: 'Plant-Based Bowl', price: 9.95, description: 'Quinoa, roasted vegetables, tahini dressing' },
      { name: 'Oat Milk Latte', price: 4.95, description: 'Organic oat milk with single-origin espresso' }
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
  lighting: { color: '#E6E6FA', intensity: 0.4, fixtureType: 'Smart LED with circadian rhythm' },
  signage: {
    posters: ['Sustainability Infographic', 'Local Art Flyer', 'QR Code Menu Board', 'Plant-Based Poster'],
    menuBoard: { style: 'Interactive touchscreen', frame: 'Recycled aluminum' },
    windowDisplays: ['Zero-waste showcase', 'Local artisan products display']
  },
  patrons: {
    outfits: ['Athleisure wear', 'Sustainable fashion', 'Vintage revival', 'Tech wear'],
    hairstyles: ['Natural curls', 'Balayage highlights', 'Braided updos', 'Pixie cut'],
    gadgets: ['Smartphone', 'E-reader', 'Wireless earbuds', 'Smartwatch']
  },
  counterTech: 'Contactless NFC payment terminal with mobile app integration'
};

export default Period2025;
