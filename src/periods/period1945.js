import { PeriodPackageSchema } from '../contracts/PeriodPackage.js';

/** @type {import('../contracts/PeriodPackage.js').PeriodPackage} */
export const Period1945 = {
  year: 1945,
  name: '1940s Vintage',
  theme: 'Post-war American café culture',
  furniture: [
    'Wooden tables with checked tablecloths',
    'Formica-topped counter stools',
    'Chrome-and-leather bar stools',
    'Classic wooden chairs with woven seats'
  ],
  decor: [
    'Wall-mounted coat hooks',
    'Vintage clock on the wall',
    'Wall-mounted AM radio/wireless set',
    'WWII-era propaganda posters',
    'Vintage Coca-Cola signs',
    'Wooden paneling',
    'Traditional stovetop percolator',
    'Manual espresso machine (Lamarzocco style)',
    'Metal french press carafes',
    'Ceramic drip coffee filter'
  ],
  menu: {
    items: [
      { name: 'Classic Coffee', price: 0.15, description: 'Freshly brewed coffee served in a white ceramic cup with saucer, accompanied by chrome creamer and sugar set' },
      { name: 'Egg Sandwich', price: 0.25, description: 'Fried egg on toasted bread with lettuce' },
      { name: 'Milk Shake', price: 0.20, description: 'Vanilla or chocolate milk shake' },
      { name: 'Pie of the Day', price: 0.15, description: 'Apple or cherry pie, served warm' }
    ],
    board: { style: 'Hand-painted chalkboard', material: 'Oak' }
  },
  audio: {
    music: { id: 'radio_1945', type: 'AM Radio', volume: 0.6 },
    sfx: [
      { type: 'radio_tune', id: 'radio_tune_01' },
      { type: 'percolator_bubble', id: 'percolator_01' },
      { type: 'patrons_chatter', id: 'low_talk_01' }
    ],
    ambientNoise: 'soft_radio_jazz'
  },
  lighting: { color: '#E8D8B3', intensity: 0.7, fixtureType: 'Incandescent pendant with metal shade' },
  signage: {
    posters: ['WWII War Bonds Poster', 'Vintage Coca-Cola Ad', 'Rosie the Riveter Poster'],
    menuBoard: { style: 'Hand-painted chalkboard', frame: 'Oak' },
    windowDisplays: ['Radio Collection', 'Newspaper Stand']
  },
  patrons: {
    outfits: ['Military uniform', 'House dress with apron', 'Business suit', 'Casual day dress', 'Hat'],
    hairstyles: ['Victory rolls', 'Pin curls', 'Short back and sides', 'Bob cut'],
    gadgets: ['Pocket watch', 'Wireless radio', 'Compacts', 'Reading glasses']
  },
  counterTech: 'Manual NCR-style cash register with brass till'
};

export default Period1945;