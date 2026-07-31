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
      { name: 'Flat white', price: '£3.40' },
      { name: 'Oat latte', price: '£3.80' },
      { name: 'Sourdough toast', price: '£5.50' },
      { name: 'Cinnamon bun', price: '£3.20' },
    ],
  },

  musicSource: { kind: 'streaming-speaker', label: 'Smart speaker streaming a lo-fi playlist' },

  posters: [
    { title: 'Single Origin Map', description: 'Minimal print of the coffee-growing world' },
    { title: 'Local Roaster Drop', description: 'Small-batch roaster announcement poster' },
  ],

  tableware: [
    { name: 'Speckled stoneware cup', material: 'ceramic' },
    { name: 'Tumbler with lid', material: 'recycled plastic' },
    { name: 'Flatware set', material: 'stainless steel' },
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
      outfit: 'Oversized beige coat and dad trainers',
      hairstyle: 'Curtain fringe',
      gadget: 'Smartphone with magnetic wallet',
    },
    {
      outfit: 'Graphic tee and cargo trousers',
      hairstyle: 'Tied-back curls',
      gadget: 'Laptop and noise-cancelling headphones',
    },
  ],
};
