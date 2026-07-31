import type { EraData } from '../EraData';

/** 1945 — post-war austerity: recycled materials, rationing, gentle optimism. */
export const era1945: EraData = {
  year: 1945,

  architecture: {
    walls: 'Scrubbed cream plaster with a deep green dado rail',
    floor: 'Worn black-and-white checkerboard linoleum',
    ceiling: 'Pressed tin panels with a single pendant light',
    trim: 'Dark oak skirting boards and window frames',
  },

  furnitureDecor: [
    'Bentwood café chairs with rattan seats',
    'Small marble-topped bistro tables',
    'A tall walnut counter with brass fittings',
    'Lace doilies and a vase of dried flowers',
    'Curtained display cabinet for cakes',
  ],

  coffeeMachines: [
    { name: 'La Pavoni lever espresso machine', method: 'manual lever pressure over a gas burner' },
    { name: 'Cafetière / French press', method: 'plunger-brewed on the counter' },
  ],

  menuBoard: {
    title: 'Refreshments',
    items: [
      { name: 'Coffee', price: '3d' },
      { name: 'Tea', price: '2d' },
      { name: 'Bread & dripping', price: '4d' },
      { name: 'Jam tart', price: '3d' },
    ],
  },

  musicSource: { kind: 'wireless-set', label: 'Valve wireless set on the shelf' },

  posters: [
    { title: 'Dig for Victory', description: 'Wartime vegetable campaign poster' },
    { title: 'Visit the Seaside', description: 'Cheerful railway holiday advertisement' },
  ],

  tableware: [
    { name: 'White porcelain cup and saucer', material: 'bone china' },
    { name: 'Sugar bowl', material: 'stamped aluminium' },
    { name: 'Cake fork', material: 'recycled steel' },
  ],

  signageLighting: {
    sign: 'Hand-painted "The Corner Café" sign over the door',
    lighting: 'Single warm tungsten pendant; dim in the corners',
  },

  counterTechnology: {
    device: 'Brass cash register',
    method: 'Manual keyed till, change counted by hand',
  },

  patrons: [
    {
      outfit: 'Demob suit and flat cap',
      hairstyle: 'Short back and sides',
      gadget: 'Cigarette case',
    },
    {
      outfit: 'Knee-length dress with padded shoulders',
      hairstyle: 'Waves pinned with clips',
      gadget: 'Ration book in a handbag',
    },
  ],
};
