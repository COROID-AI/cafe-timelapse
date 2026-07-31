import type { EraData } from '../EraData';

/**
 * 1945 — post-war café: ration-era thrift, late-war optimism, warm tungsten.
 *
 * The composition (src/scenes/eras/1945.ts) reads this record for the menu
 * board, posters, machines, tableware, signage and patrons, and the era audio
 * profile (src/audio/eraAudioConfigs.ts) is grounded in these entries.
 */
export const era1945: EraData = {
  year: 1945,

  architecture: {
    walls: 'Scrubbed cream plaster with a deep green dado rail',
    floor: 'Worn black-and-white checkerboard linoleum',
    ceiling: 'Pressed tin panels with a single pendant light',
    trim: 'Dark oak skirting boards and window frames',
  },

  furnitureDecor: [
    'Bentwood Thonet-style café chairs with rattan seats',
    'Small round marble-topped bistro tables',
    'A tall walnut counter with brass fittings',
    'Lace doilies and a vase of dried flowers',
    'Curtained display cabinet for cakes',
  ],

  coffeeMachines: [
    { name: 'La Pavoni lever espresso machine', method: 'manual lever pressure over a gas burner' },
    { name: 'Hand-cranked burr grinder', method: 'freshly ground by hand per shot' },
    { name: 'Cafetière / French press', method: 'plunger-brewed on the counter' },
  ],

  menuBoard: {
    title: 'Refreshments',
    items: [
      { name: 'Coffee', price: '5¢' },
      { name: 'Tea', price: '5¢' },
      { name: 'Cocoa', price: '10¢' },
      { name: 'Doughnut', price: '5¢' },
      { name: 'Ham sandwich', price: '15¢' },
    ],
  },

  musicSource: { kind: 'wireless-set', label: 'Wooden tabletop wireless (valve radio) on the cabinet' },

  posters: [
    { title: 'Dig for Victory', description: 'Wartime vegetable campaign poster' },
    { title: 'Rationing — Save Fats', description: 'Late-war ration-era kitchen notice' },
    { title: 'Victory Loans', description: 'Victory bond drive advertisement' },
    { title: 'Visit the Seaside', description: 'Cheerful railway holiday advertisement' },
  ],

  tableware: [
    { name: 'Thick white ceramic cup and saucer', material: 'heavy stoneware' },
    { name: 'Glass sugar pourer', material: 'pressed glass' },
    { name: 'Cake fork', material: 'recycled steel' },
  ],

  signageLighting: {
    sign: 'Neon "CAFÉ" sign over the door, hand-painted "The Corner Café" board inside',
    lighting: 'Incandescent pendant lamps; warm tungsten glow',
  },

  counterTechnology: {
    device: 'Brass manual cash register',
    method: 'Mechanical keyed till, change counted by hand',
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
