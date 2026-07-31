import type { EraData } from '../EraData';

/** 1985 — eighties: bold colours, smoked glass, microwave snacks and MTV. */
export const era1985: EraData = {
  year: 1985,

  architecture: {
    walls: 'Peach wallpapered plaster with a stencilled border',
    floor: 'Grey carpet tiles with burgundy flecks',
    ceiling: 'Suspended ceiling with fluorescent panels',
    trim: 'Brass-effect skirting and door furniture',
  },

  furnitureDecor: [
    'Oak-effect laminate tables with brass trim',
    'Plush burgundy upholstered chairs',
    'A smoked-glass counter with tiled front',
    'Ficus plant in a terracotta pot',
    'Laminated menu stand on every table',
  ],

  coffeeMachines: [
    { name: 'La Cimbali commercial espresso machine', method: 'electric pump group, steam wand' },
    { name: 'Filter coffee machine', method: 'batch drip brew on a hotplate' },
  ],

  menuBoard: {
    title: 'Today’s Menu',
    items: [
      { name: 'Espresso', price: '60p' },
      { name: 'Latte', price: '85p' },
      { name: 'Jacket potato', price: '£1.20' },
      { name: 'Black Forest gateau', price: '95p' },
    ],
  },

  musicSource: { kind: 'boombox', label: 'Ghetto blaster on the counter' },

  posters: [
    { title: 'Live Aid', description: 'Concert poster with bold typography' },
    { title: 'New Wave Nights', description: 'Club night flyer in neon colours' },
  ],

  tableware: [
    { name: 'Brown ceramic mug', material: 'stoneware' },
    { name: 'Melamine saucer', material: 'melamine' },
    { name: 'Plastic stirrer', material: 'polystyrene' },
  ],

  signageLighting: {
    sign: 'Backlit "The Coffee Shop" sign with chrome letters',
    lighting: 'Fluorescent panels and a brass pendant over the counter',
  },

  counterTechnology: {
    device: 'Electronic cash register',
    method: 'Programmed price keys, thermal receipts',
  },

  patrons: [
    {
      outfit: 'Denim jacket over a band t-shirt',
      hairstyle: 'Big perm with a side sweep',
      gadget: 'Walkman personal stereo',
    },
    {
      outfit: 'Neon tracksuit with white trainers',
      hairstyle: 'High ponytail with scrunchie',
      gadget: 'Pocket calculator',
    },
  ],
};
