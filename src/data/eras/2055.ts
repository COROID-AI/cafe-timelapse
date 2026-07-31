import type { EraData } from '../EraData';

/** 2055 — future: bioluminescent surfaces, robot baristas, neural payment. */
export const era2055: EraData = {
  year: 2055,

  architecture: {
    walls: 'Reactive smart-glass panels with ambient colour shifts',
    floor: 'Self-healing photopolymer with embedded light veins',
    ceiling: 'Living mycelium canopy with integrated glow nodes',
    trim: 'Recycled carbon-fibre frames with soft edge lighting',
  },

  furnitureDecor: [
    'Morphing foam chairs that mould to the sitter',
    'Holographic tabletop surfaces',
    'A floating counter serviced by robotic arms',
    'Vertical hydroponic herb wall',
    'Ambient projection art on the walls',
  ],

  coffeeMachines: [
    { name: 'Robo-barista arm', method: 'precision-pours from a ceiling pod' },
    { name: 'Algae brew reactor', method: 'cultured beans brewed on demand' },
  ],

  menuBoard: {
    title: 'Neuro Brew',
    items: [
      { name: 'Adaptive espresso', price: '5 cr' },
      { name: 'Algae oat latte', price: '6 cr' },
      { name: 'Synth-butter croissant', price: '4 cr' },
      { name: 'Probiotic tiramisu', price: '7 cr' },
    ],
  },

  musicSource: { kind: 'streaming-speaker', label: 'Ambient neural stream, spatially mixed' },

  posters: [
    { title: 'Mars Roast Co.', description: 'Holographic advertisement for off-world beans' },
    { title: 'Open Air Festival', description: 'Projected poster with moving light trails' },
  ],

  tableware: [
    { name: 'Self-cleaning mug', material: 'recycled graphene composite' },
    { name: 'Edible cup', material: 'alginate film' },
    { name: 'Sonic-cleaned cutlery', material: 'titanium alloy' },
  ],

  signageLighting: {
    sign: 'Holographic "BREW//2055" sign floating above the door',
    lighting: 'Bioluminescent ceiling nodes that pulse with music',
  },

  counterTechnology: {
    device: 'Neural point of sale',
    method: 'Contactless neural payment, order by gesture',
  },

  patrons: [
    {
      outfit: 'Smart fabric poncho that changes colour',
      hairstyle: 'Nanofiber braids with light threads',
      gadget: 'Wrist neural-link band',
    },
    {
      outfit: 'Reflective jumpsuit with glowing seams',
      hairstyle: 'Shaved sides with holographic dye',
      gadget: 'AR glasses',
    },
  ],
};
