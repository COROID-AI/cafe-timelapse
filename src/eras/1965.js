/**
 * 1965 — Mid-century modern era content package.
 *
 * Captures the swinging-sixties café: chrome-vinyl diner furniture, a Faema
 * E61-style espresso machine, an electric coffee grinder, a classic neon-lit
 * jukebox playing Motown and Beat music, mid-century advertising posters,
 * melamine tableware, warm fluorescent pendant lighting, a mechanical cash
 * register, and patrons in beatnik/mod fashion.
 *
 * @module eras/1965
 */

import { buildEraScene } from './era-builder.js';

/** Colour palette for 1965 materials. */
const PALETTE = {
  wood: 0x8a6a4a, // lighter teak
  woodDark: 0x5a4030,
  metal: 0xc0c0c0, // chrome
  chrome: 0xd0d0d0,
  fabric: 0xb85040, // red vinyl
  plastic: 0x3a4a5a, // teal plastic
  wall: 0xd4a868, // mustard wallpaper
  paper: 0xf5f0e0,
  accent: 0xe8a838, // gold/amber
  glass: 0xb0d0e0,
  light: 0xffe8c0,
};

/**
 * @type {import('@/contracts/PeriodPackage.js').PeriodPackage}
 */
const period1965 = {
  year: 1965,
  name: 'Swinging Sixties',

  furniture: {
    seats: [
      // Chrome-vinyl diner table.
      { type: 'table', x: -2.5, z: 0, w: 0.8, d: 0.8, h: 0.72, thickness: 0.04, material: 'metal' },
      { type: 'table', x: 2.5, z: 0, w: 0.8, d: 0.8, h: 0.72, thickness: 0.04, material: 'metal' },
      // Chrome diner chairs with vinyl seats.
      { type: 'chair', x: -3.2, z: 0, w: 0.4, d: 0.4, h: 0.44, backH: 0.5, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: -1.8, z: 0, w: 0.4, d: 0.4, h: 0.44, backH: 0.5, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: 3.2, z: 0, w: 0.4, d: 0.4, h: 0.44, backH: 0.5, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: 1.8, z: 0, w: 0.4, d: 0.4, h: 0.44, backH: 0.5, material: 'fabric', legMaterial: 'chrome' },
      // Chrome counter stools with red vinyl.
      { type: 'stool', x: -1.0, z: 2.8, h: 0.65, r: 0.16, material: 'fabric', legMaterial: 'chrome' },
      { type: 'stool', x: 0.0, z: 2.8, h: 0.65, r: 0.16, material: 'fabric', legMaterial: 'chrome' },
      { type: 'stool', x: 1.0, z: 2.8, h: 0.65, r: 0.16, material: 'fabric', legMaterial: 'chrome' },
    ],
    decor: [
      { shape: 'cylinder', rt: 0.1, rb: 0.08, h: 0.3, x: -4.3, y: 0.2, z: -1.5, material: 'accent' }, // lava lamp base
      { shape: 'sphere', r: 0.08, x: -4.3, y: 0.4, z: -1.5, material: 'glass' }, // lava lamp blob
      { shape: 'box', w: 0.3, h: 0.15, d: 0.15, x: 3.5, y: 0.8, z: -3.5, material: 'plastic' }, // table radio
    ],
  },

  coffeeEquipment: {
    espressoMachine: {
      w: 0.6, h: 0.5, d: 0.42,
      material: 'chrome', detailMaterial: 'metal',
      x: -0.5, z: 2.85,
      gauges: [{ x: -0.15, y: 0.1 }],
    },
    grinder: {
      w: 0.2, h: 0.38, d: 0.2,
      kind: 'electric', hopper: true, hopperR: 0.08, hopperR2: 0.05, hopperH: 0.16,
      material: 'plastic',
      x: 0.2, z: 2.85,
    },
    brewer: {
      w: 0.2, h: 0.28, d: 0.2,
      kind: 'drip',
      x: 0.6, z: 2.85,
    },
  },

  menu: {
    title: 'MENU',
    currency: 's ', // shillings (pre-decimal)
    items: [
      { name: 'Espresso', price: '1/6' },
      { name: 'Cappuccino', price: '2/-' },
      { name: 'Coffee', price: '1/3' },
      { name: 'Tea', price: '1/-' },
      { name: 'Cake', price: '2/6' },
    ],
    bg: '#2a4a5a',
    textColor: '#f5f0e0',
    accent: '#e8a838',
    borderColor: '#c0c0c0',
    width: 1.5, height: 1.1,
    frameMaterial: 'chrome',
  },

  music: {
    source: 'jukebox',
    description: 'Motown and Beat music on a glowing Wurlitzer jukebox',
    x: -3.8, y: 0, z: -1.8,
  },

  signage: {
    posters: [
      {
        headline: 'The Beatles',
        subtext: ['New Album Out Now', 'Beatlemania!'],
        bg: '#2a2a8a', bgEnd: '#1a1a5a',
        fg: '#f5f5f5', accent: '#e8a838',
        icon: '🎸', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: -1.5,
      },
      {
        headline: 'Campbells Soup',
        subtext: ['Mmm Mmm Good', 'A Meal In Minutes'],
        bg: '#b83020', bgEnd: '#8a2010',
        fg: '#fff5e0', accent: '#e8c850',
        icon: '🍲', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 0.0,
      },
      {
        headline: 'Coca-Cola',
        subtext: ['Things Go Better', 'With Coke'],
        bg: '#b02020', bgEnd: '#8a1010',
        fg: '#ffffff', accent: '#ffffff',
        icon: '🥤', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 1.5,
      },
    ],
  },

  tableware: {
    material: 'plastic',
    cupHeight: 0.09, cupRadius: 0.045,
    plateRadius: 0.13, cutleryMaterial: 'chrome',
    hasSaucer: true, hasPlate: true, hasCutlery: true,
    tablePositions: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
  },

  lighting: {
    signage: {
      text: 'CAFÉ',
      bg: 'transparent',
      color: '#ff60aa',
      emissive: 0xff3099, emissiveIntensity: 0.5,
      width: 1.0, height: 0.25,
      x: 0, y: 2.7, z: 3.7, rotY: Math.PI,
    },
    fixtures: [
      { type: 'pendant', cordLength: 0.4, shadeR: 0.2, shadeH: 0.12,
        material: 'chrome', bulbColor: 0xffe8c0, bulbIntensity: 1.0,
        x: -2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.4, shadeR: 0.2, shadeH: 0.12,
        material: 'chrome', bulbColor: 0xffe8c0, bulbIntensity: 1.0,
        x: 2.5, y: 2.8, z: 0 },
    ],
    pointLight: { color: 0xffe8c0, intensity: 1.2, distance: 16, decay: 1.8,
      x: 0, y: 2.6, z: 0 },
  },

  counterTechnology: {
    type: 'mechanical',
    material: 'metal',
    x: 1.2, z: 2.9,
  },

  patrons: {
    figures: [
      // Beatnik with a book.
      { x: -3.2, z: 0.3, rotY: Math.PI / 2, scale: 1.0,
        outfit: 0x1a1a1a, pants: 0x1a1a1a, skin: 0xd8b890,
        hair: 'short', hairColor: 0x1a1008, gadget: 'book', gadgetSide: 'left' },
      // Mod girl in a bright dress.
      { x: 3.2, z: 0.3, rotY: -Math.PI / 2, scale: 0.95,
        outfit: 0xe85020, pants: 0xe85020, skin: 0xe8d0b0,
        hair: 'long', hairColor: 0x4a3020 },
      // Man at counter in a polo shirt.
      { x: -1.0, z: 2.5, rotY: Math.PI, scale: 1.0,
        outfit: 0x3a6a8a, pants: 0x2a2a3a, skin: 0xddc0a0,
        hair: 'short', hairColor: 0x3a2010 },
    ],
  },

  /**
   * Builds the full 3D scene group for this era.
   * @returns {import('three').Group}
   */
  build() {
    return buildEraScene(period1965, PALETTE);
  },
};

export default period1965;
