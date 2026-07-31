import type { EraData } from '../EraData';

/**
 * 1985 — eighties espresso bar: tubular chrome, pastel Memphis accents,
 * mirrored walls, neon and synth-wave energy.
 */
export const era1985: EraData = {
  year: 1985,

  architecture: {
    walls: 'Peach walls with chrome-framed mirror panels',
    floor: 'Terrazzo tiles with pink and grey flecks',
    ceiling: 'Suspended ceiling with white acoustic panels',
    trim: 'Chrome and brass-effect trim',
  },

  furnitureDecor: [
    'Tubular chrome tables with pastel Memphis tops',
    'Memphis-pattern chairs with pastel upholstered seats',
    'Mirrored wall panels and chrome rails',
    'Pastel geometric wall clock',
    'Neon coffee sign by the door',
  ],

  coffeeMachines: [
    { name: 'Commercial espresso machine', method: 'electric pump group, steam wand, cup warmer' },
    { name: 'Coffee grinder doser', method: 'dosed grounds straight into the portafilter' },
    { name: 'Glass decanters on warmers', method: 'batch brews kept hot on electric warmers' },
  ],

  menuBoard: {
    title: 'Today’s Menu',
    items: [
      { name: 'Espresso', price: '$1.00' },
      { name: 'Cappuccino', price: '$1.25' },
      { name: 'Latte', price: '$1.50' },
      { name: 'Danish', price: '$1.10' },
    ],
  },

  musicSource: { kind: 'boombox', label: 'Ghetto blaster on the counter' },

  posters: [
    { title: 'Neon Nights Coffee', description: 'Synth-wave ad with pink and cyan grids' },
    { title: 'Cappuccino After Dark', description: 'Retro neon poster with a geometric sun' },
    { title: 'Espresso Chrome', description: 'Chrome-cup ad with a pastel sunset' },
    { title: 'Miami Blend', description: 'Palm-and-grid synth-wave coffee advertisement' },
  ],

  tableware: [
    { name: 'Stoneware cappuccino cup', material: 'stoneware' },
    { name: 'Glass demitasse', material: 'glass' },
  ],

  signageLighting: {
    sign: 'Pink neon "ESPRESSO BAR" sign',
    lighting: 'Track lighting with warm spots and blue neon accents',
  },

  counterTechnology: {
    device: 'Electronic LED cash register',
    method: 'Programmed price keys, LED display, thermal receipts',
  },

  patrons: [
    {
      outfit: 'Shoulder-pad power blazer over a pencil skirt',
      hairstyle: 'Big permed hair with a side sweep',
      gadget: 'Sony Walkman headphones',
    },
    {
      outfit: 'Cobalt members-only jacket over a white tee',
      hairstyle: 'Mullet with a feathered fringe',
      gadget: 'Sony Walkman personal stereo',
    },
    {
      outfit: 'Neon leotard with leg warmers over tights',
      hairstyle: 'High ponytail with a scrunchie',
      gadget: 'Wrist sweatband',
    },
    {
      outfit: 'Pastel oversized blazer with rolled sleeves',
      hairstyle: 'Big curly perm',
      gadget: 'Cappuccino cup',
    },
  ],
};
