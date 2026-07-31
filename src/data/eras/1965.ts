import type { EraData } from '../EraData';

/**
 * 1965 — mid-century / beatnik café.
 *
 * The canonical record drives the era's registry fragment labels and the
 * check:eras gate. The visible scene composition (src/compositions/1965.ts)
 * renders exactly these categories: Formica booths with chrome trim, vinyl
 * stools, geometric wallpaper, early electric drip urn + Faema E61-style
 * espresso machine, a plastic letter-board menu with ~20–30¢ prices, a
 * tabletop jukebox selector, mid-century modern + pop-art coffee ads,
 * melamine diner mugs and glass creamers, tube neon + fluorescent ceiling
 * tubes, an early electric cash register, checkerboard tile and wood
 * panelling, and beatnik patrons.
 */
export const era1965: EraData = {
  year: 1965,

  architecture: {
    walls: 'Wood panelling below a chrome dado rail with geometric wallpaper above',
    floor: 'Black and white checkerboard tile',
    ceiling: 'Smooth plaster with recessed fluorescent strip lights',
    trim: 'Chrome trim on Formica edges and booth seating',
  },

  furnitureDecor: [
    'Formica booths with chrome trim',
    'Vinyl stools at the counter',
    'Chrome-leg tables with Formica tops',
    'Geometric wallpaper bands above the panelling',
    'Tabletop mini-jukebox selectors on the booths',
  ],

  coffeeMachines: [
    { name: 'Faema E61-style espresso machine', method: 'chrome group head, lever, steam wand' },
    { name: 'Electric drip urn', method: 'early electric urn kept warm on the counter' },
  ],

  menuBoard: {
    title: 'Menu',
    items: [
      { name: 'Coffee', price: '20¢' },
      { name: 'Espresso', price: '25¢' },
      { name: 'Cappuccino', price: '30¢' },
      { name: 'Donut', price: '20¢' },
      { name: 'Pie', price: '25¢' },
    ],
  },

  musicSource: { kind: 'jukebox', label: 'Tabletop mini-jukebox selector' },

  posters: [
    { title: 'Espresso', description: 'Pop-art coffee advertisement, red sunburst' },
    { title: 'Caffè', description: 'Mid-century modern travel-poster style' },
    { title: 'Beat Café', description: 'Geometric beatnik poster, olive and cream' },
    { title: 'Cappuccino', description: 'Pop-art ad, orange and cream' },
    { title: 'Coffee', description: 'Mid-century modern ad, pink and black' },
  ],

  tableware: [
    { name: 'Melamine diner mug', material: 'melamine' },
    { name: 'Glass creamer', material: 'glass' },
    { name: 'Sugar dispenser', material: 'chrome and glass' },
  ],

  signageLighting: {
    sign: 'Glowing tube neon "COFFEE" above the door',
    lighting: 'Fluorescent ceiling tubes and warm strip light',
  },

  counterTechnology: {
    device: 'Early electric cash register',
    method: 'Electric keys with printed receipts',
  },

  patrons: [
    {
      outfit: 'Black turtleneck and dark slacks (beatnik)',
      hairstyle: 'Short crop under a black beret',
      gadget: 'Paperback novel',
    },
    {
      outfit: 'Mod shift dress with geometric print',
      hairstyle: 'Beehive with backcombing',
      gadget: 'Compact mirror',
    },
    {
      outfit: 'Crew-neck sweater and slim trousers',
      hairstyle: 'Swept fringe, sideburns',
      gadget: 'Transistor radio',
    },
  ],
};
