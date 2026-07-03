import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1945 = {
  year: 1945,
  name: '1940s Vintage',
  theme: 'Post-war American café culture',
  furniture: ['Formica tables', 'Vinyl booth seats', 'Metal stools', 'Checkerboard floor'],
  decor: ['Art Deco wall sconces', 'Vintage Coca-Cola signs', 'Radio cabinet', 'Wooden paneling'],
  menu: {
    items: [
      { name: 'Classic Coffee', price: 0.15, description: 'Strong drip coffee served in thick mugs' },
      { name: 'Egg Sandwich', price: 0.25, description: 'Fresh-baked croissant with fried egg' },
      { name: 'Milk Shake', price: 0.35, description: 'Vanilla or chocolate, served with a straw' },
      { name: 'Pie of the Day', price: 0.20, description: 'Apple or cherry, served warm' }
    ],
    board: { style: 'Chalkboard', material: 'Wood frame' }
  },
  audio: {
    music: { id: 'bigband_1945', type: 'Record Player', volume: 0.7 },
    sfx: [
      { type: 'coffee_grinder', id: 'grinder_hiss_01' },
      { type: 'espresso_pump', id: 'pump_click_01' },
      { type: 'patrons_chatter', id: 'low_talk_01' }
    ],
    ambientNoise: 'soft_radio_jazz'
  },
  lighting: { color: '#F5DEB3', intensity: 0.6, fixtureType: 'Art Deco pendant' },
  signage: {
    posters: ['Wartime Ration Poster', 'Vintage Coca-Cola Ad', 'Einstein Quote Poster'],
    menuBoard: { style: 'Hand-painted chalkboard', frame: 'Oak' },
    windowDisplays: ['Vintage Camera Display', 'Radio Collection Showcase']
  },
  patrons: {
    outfits: ['Poodle skirts', 'Tailored suits', 'Polka dot dresses', 'Newsboy caps'],
    hairstyles: ['Buns', 'Crew cuts', 'Pompadours', 'Bob cuts'],
    gadgets: ['Phonograph', 'Handheld radio', 'Pocket watch', 'Reading glasses']
  },
  counterTech: 'Manual cash register with brass till'
};

export default Period1945;
