import type { EraData } from '../EraData';

/** 1965 — swinging sixties: Formica, chrome and espresso bar energy. */
export const era1965: EraData = {
  year: 1965,

  architecture: {
    walls: 'Pale yellow painted plaster with a chrome dado rail',
    floor: 'Terrazzo tiles with brass inlay strips',
    ceiling: 'Smooth plaster with recessed strip lights',
    trim: 'Anodised aluminium door and window frames',
  },

  furnitureDecor: [
    'Plastic-topped tables on chrome legs',
    'Stacking chairs with woven PVC seats',
    'A long Formica counter with padded stools',
    'Espresso bar with copper siphon lamps',
    'Hanging macramé plant holders',
  ],

  coffeeMachines: [
    { name: 'Gaggia lever espresso machine', method: 'chrome lever group, steam wand' },
    { name: 'Electric percolator', method: 'bubbled brews kept warm on the counter' },
  ],

  menuBoard: {
    title: 'Espresso Bar',
    items: [
      { name: 'Espresso', price: '1s' },
      { name: 'Cappuccino', price: '1s 6d' },
      { name: 'Bolognese toastie', price: '2s 6d' },
      { name: 'Viennese slice', price: '1s 3d' },
    ],
  },

  musicSource: { kind: 'jukebox', label: 'Wurlitzer jukebox by the window' },

  posters: [
    { title: 'Mod London', description: 'Bright geometric travel poster' },
    { title: 'Flower Power', description: 'Psychedelic concert advertisement' },
  ],

  tableware: [
    { name: 'Tulip-shaped cup', material: 'melamine' },
    { name: 'Espresso glass', material: 'thick glass' },
    { name: 'Spiral ashtray', material: 'ceramic' },
  ],

  signageLighting: {
    sign: 'Neon "CAFÉ" tube above the door',
    lighting: 'Strip lighting with warm fluorescent tubes',
  },

  counterTechnology: {
    device: 'Electromechanical cash register',
    method: 'Electric keys with printed receipts',
  },

  patrons: [
    {
      outfit: 'Slim mod suit with skinny tie',
      hairstyle: 'Swept fringe, sideburns',
      gadget: 'Transistor radio',
    },
    {
      outfit: 'Shift dress with geometric print',
      hairstyle: 'Beehive with backcombing',
      gadget: 'Compact mirror',
    },
  ],
};
