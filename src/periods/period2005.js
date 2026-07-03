import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period2005 = {
  year: 2005,
  name: '2000s Y2K',
  theme: 'Early digital age café culture',
  furniture: ['Glass-top tables', 'Fabric upholstered chairs', 'Bar stools with chrome feet', 'Dark wood flooring'],
  decor: ['Digital photo frames', 'Flat-screen TV', 'Minimalist art', 'Inspirational quotes'],
  menu: {
    items: [
      { name: 'Frappuccino', price: 3.75, description: 'Blended coffee with whipped cream and flavorings' },
      { name: 'Panini', price: 5.95, description: 'Grilled panini with turkey and provolone' },
      { name: 'Acai Bowl', price: 6.25, description: 'Frozen acai puree with granola and berries' },
      { name: 'Smoothie', price: 4.50, description: 'Fruit blend with Greek yogurt' }
    ],
    board: { style: 'LCD touchscreen display', material: 'Metal frame' }
  },
  audio: {
    music: { id: 'indie_2005', type: 'iPod', volume: 0.65 },
    sfx: [
      { type: 'espresso_machine', id: 'steam_hiss_01' },
      { type: 'cell_phone', id: 'ring_tone_01' },
      { type: 'printer', id: 'printer_ping_01' }
    ],
    ambientNoise: 'indie_rock_and_podcasts'
  },
  lighting: { color: '#FFFFFF', intensity: 0.5, fixtureType: 'LED recessed lights' },
  signage: {
    posters: ['Harry Potter Poster', 'iPhone Launch Ad', 'Social Media Flyer', 'Yoga Class Poster'],
    menuBoard: { style: 'Touchscreen LCD', frame: 'Aluminum' },
    windowDisplays: ['Laptop display', 'Digital camera showcase']
  },
  patrons: {
    outfits: ['Jeans and hoodie', 'Business casual', 'Ugg boots', 'Cargo pants'],
    hairstyles: ['Shoulder-length hair', 'Highlights', 'Pigtails', 'Bob cut'],
    gadgets: ['iPod', 'BlackBerry', 'Digital camera', 'Laptop bag']
  },
  counterTech: 'Touchscreen POS system with integrated card reader'
};

export default Period2005;
