import type { EraData } from '../EraData';

/** 2005 — noughties: chocolate brown, Wi-Fi, chunky laptops and pod coffee. */
export const era2005: EraData = {
  year: 2005,

  architecture: {
    walls: 'Chocolate-brown painted plaster with a feature red wall',
    floor: 'Warm bamboo wood flooring',
    ceiling: 'Exposed rafters with track spotlights',
    trim: 'MDF skirting painted to match the walls',
  },

  furnitureDecor: [
    'Dark wooden tables with steel legs',
    'Low leather-look armchairs and sofas',
    'A curved white counter with glass display',
    'Framed black-and-white photography prints',
    'Magazine rack with glossy titles',
  ],

  coffeeMachines: [
    { name: 'Saeco super-automatic espresso machine', method: 'one-touch beans-to-cup' },
    { name: 'Pod coffee machine', method: 'single-serve pods behind the counter' },
  ],

  menuBoard: {
    title: 'Café Menu',
    items: [
      { name: 'Americano', price: '£1.80' },
      { name: 'Caramel latte', price: '£2.40' },
      { name: 'Panini', price: '£3.50' },
      { name: 'Blueberry muffin', price: '£1.95' },
    ],
  },

  musicSource: { kind: 'ipod', label: 'iPod docked on the counter' },

  posters: [
    { title: 'Free Wi-Fi', description: 'Blue sticker promising wireless internet' },
    { title: 'Local Art Night', description: 'Flyer with a hand-drawn coffee cup logo' },
  ],

  tableware: [
    { name: 'White latte bowl', material: 'ceramic' },
    { name: 'Glass mug', material: 'borosilicate glass' },
    { name: 'Recycled paper cup', material: 'paper with sleeve' },
  ],

  signageLighting: {
    sign: 'Illuminated acrylic "Bean & Leaf" sign',
    lighting: 'Track spotlights and warm pendant lamps',
  },

  counterTechnology: {
    device: 'Touchscreen point of sale',
    method: 'Card payments accepted, receipts by email',
  },

  patrons: [
    {
      outfit: 'Layered pink camisole over a tee with bootcut jeans',
      hairstyle: 'Side-swept bangs',
      gadget: 'Flip phone in hand',
    },
    {
      outfit: 'White layered top with bootcut jeans',
      hairstyle: 'Shoulder-length bob',
      gadget: 'Early iPod with white earbuds',
    },
    {
      outfit: 'Layered cardigan over a band tee',
      hairstyle: 'Messy bedhead',
      gadget: 'Open laptop with Wi-Fi card',
    },
    {
      outfit: 'Hoodie with bootcut jeans',
      hairstyle: 'Spiky crop',
      gadget: 'Flip phone clipped to belt',
    },
  ],
};
