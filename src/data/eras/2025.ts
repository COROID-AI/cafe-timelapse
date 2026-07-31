import type { EraData } from '../EraData';

/** 2025 — present day: oat-milk minimalism, contactless and laptop nomads. */
export const era2025: EraData = {
  year: 2025,

  architecture: {
    walls: 'White painted plaster with oak slat panelling',
    floor: 'Polished concrete with a herringbone oak island',
    ceiling: 'Exposed services painted matte black',
    trim: 'Oak window reveals and minimal skirting',
  },

  furnitureDecor: [
    'Live-edge oak tables with tubular steel legs',
    'Bouclé armchairs and rattan pendants',
    'A pale stone counter with open shelving',
    'Pothos and monstera plants in ceramic pots',
    'A shelf of indie magazines and vinyl',
  ],

  coffeeMachines: [
    { name: 'La Marzocco Linea espresso machine', method: 'dual boiler, temperature-stable group' },
    { name: 'V60 pour-over station', method: 'hand-brewed single origin on demand' },
  ],

  menuBoard: {
    title: 'Specialty Coffee',
    items: [
      { name: 'Flat white', price: '$5.00' },
      { name: 'Oat latte', price: '$5.50' },
      { name: 'Sourdough toast', price: '$6.00' },
      { name: 'Cinnamon bun', price: '$4.50' },
    ],
  },

  musicSource: {
    kind: 'streaming-speaker',
    label: 'Smartphone + Bluetooth speaker (Sonos-style) streaming a lo-fi playlist',
  },

  posters: [
    { title: 'Single Origin Map', description: 'Minimal print of the coffee-growing world' },
    { title: 'Local Roaster Drop', description: 'Small-batch roaster announcement poster' },
  ],

  tableware: [
    { name: 'Artisan speckled stoneware cup', material: 'ceramic' },
    { name: 'Hand-blown glass water tumbler', material: 'glass' },
    { name: 'Compostable to-go cup with bamboo lid', material: 'plant-based fibre' },
  ],

  signageLighting: {
    sign: 'Backlit sans-serif "BREW" sign in brushed aluminium',
    lighting: 'Warm LED strips with a statement rattan pendant',
  },

  counterTechnology: {
    device: 'iPad point of sale with card reader',
    method: 'Contactless and mobile wallet payments',
  },

  patrons: [
    {
      outfit: 'Oversized grey hoodie, joggers and dad trainers',
      hairstyle: 'Top-knot bun',
      gadget: 'Open laptop on the table',
    },
    {
      outfit: 'Athleisure track suit with running shoes',
      hairstyle: 'Knit beanie',
      gadget: 'Smartphone with magnetic wallet',
    },
    {
      outfit: 'Oversized cream knit and wide-leg trousers',
      hairstyle: 'High top-knot',
      gadget: 'Wireless earbuds',
    },
    {
      outfit: 'Oversized apron over a hoodie',
      hairstyle: 'Messy bun',
      gadget: 'Reusable cup with bamboo lid',
    },
  ],
};
