/**
 * 1945 — Post-war era content package.
 *
 * Captures a wartime-era / immediate-postwar café: dark varnished wood
 * furniture, a manual lever espresso machine, a hand-crank coffee grinder,
 * ration-conscious menu, a wooden wireless radio, wartime-era posters, heavy
 * ceramic tableware, incandescent pendant lighting, a brass cash register,
 * and patrons in period clothing (suits, frocks, Victory Rolls hair).
 *
 * @module eras/1945
 */

import { buildEraScene } from './era-builder.js';

/** Colour palette for 1945 materials. */
const PALETTE = {
  wood: 0x5a3e28, // dark varnished oak
  woodDark: 0x3b2a1c,
  metal: 0x8a7a6a, // brass / tarnished metal
  chrome: 0x9a9a9a,
  fabric: 0x6b4a30, // brown leatherette
  plastic: 0x3a3028,
  wall: 0x9a8a70,
  paper: 0xe8dfc8,
  accent: 0xc4863a, // amber / brass accent
  glass: 0xa8b8c0,
  light: 0xffd9a0, // warm incandescent
};

/**
 * @type {import('@/contracts/PeriodPackage.js').PeriodPackage}
 */
const period1945 = {
  year: 1945,
  name: 'Post-War Revival',

  furniture: {
    seats: [
      { type: 'table', x: -2.5, z: 0, w: 0.9, d: 0.9, h: 0.74, thickness: 0.05, material: 'wood' },
      { type: 'table', x: 2.0, z: -0.5, w: 0.85, d: 0.85, h: 0.74, thickness: 0.05, material: 'wood' },
      { type: 'chair', x: -3.2, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.48, material: 'wood' },
      { type: 'chair', x: -1.8, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.48, material: 'wood' },
      { type: 'chair', x: 2.0, z: -1.2, w: 0.42, d: 0.42, h: 0.45, backH: 0.48, material: 'wood' },
      { type: 'chair', x: 2.0, z: 0.2, w: 0.42, d: 0.42, h: 0.45, backH: 0.48, material: 'wood' },
      { type: 'stool', x: -1.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'wood' },
      { type: 'stool', x: 0.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'wood' },
    ],
    decor: [
      { shape: 'box', w: 0.15, h: 0.35, d: 0.15, x: -4.3, y: 0.2, z: -1.0, material: 'woodDark' }, // wooden plant stand
      { shape: 'cylinder', rt: 0.08, rb: 0.06, h: 0.25, x: -4.3, y: 0.45, z: -1.0, material: 'accent' }, // vase
      { shape: 'box', w: 0.08, h: 0.4, d: 0.04, x: 3.5, y: 0.8, z: -3.6, rotY: 0.1, material: 'wood' }, // wall clock case
    ],
  },

  coffeeEquipment: {
    espressoMachine: {
      w: 0.55, h: 0.42, d: 0.38,
      material: 'metal', detailMaterial: 'woodDark',
      x: -0.5, z: 2.85,
      lever: true, leverLength: 0.22,
      gauges: [{ x: -0.12, y: 0.08 }, { x: 0.08, y: 0.08 }],
    },
    grinder: {
      w: 0.16, h: 0.32, d: 0.16,
      kind: 'manual', crank: true,
      material: 'woodDark',
      x: 0.15, z: 2.85,
    },
    brewer: {
      w: 0.18, h: 0.22, d: 0.18,
      kind: 'siphon',
      x: 0.55, z: 2.85,
    },
  },

  menu: {
    title: 'MENU',
    currency: 'd ', // pence (pre-decimal: "3d")
    items: [
      { name: 'Coffee', price: '4d' },
      { name: 'Tea', price: '3d' },
      { name: 'Bun', price: '2d' },
      { name: 'Sandwich', price: '6d' },
      { name: 'Soup', price: '8d' },
    ],
    bg: '#3a2a1a',
    textColor: '#e8dfc8',
    accent: '#c4863a',
    borderColor: '#8a6a3a',
    width: 1.5, height: 1.1,
    frameMaterial: 'woodDark',
  },

  music: {
    source: 'wireless',
    description: 'BBC Home Service on a walnut wireless set',
    x: -4.0, y: 0.7, z: -2.0,
  },

  signage: {
    posters: [
      {
        headline: 'Dig For Victory',
        subtext: ['Grow Your Own', 'Food For All'],
        bg: '#2a4a2a', bgEnd: '#1a3a1a',
        fg: '#f0e8c8', accent: '#d4a040',
        icon: '🌾', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: -1.5,
      },
      {
        headline: 'Keep Calm And Carry On',
        subtext: ['Freedom Is In Peril', 'Defend It With All Your Might'],
        bg: '#6b2020', bgEnd: '#4a1818',
        fg: '#f5f0e0', accent: '#e8c850',
        icon: '👑', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 0.0,
      },
      {
        headline: 'Nestlé Coffee',
        subtext: ['Rich & Full Bodied', 'The Nation\'s Favourite'],
        bg: '#3a2818', bgEnd: '#2a1a0e',
        fg: '#f0e8d0', accent: '#c4863a',
        icon: '☕', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 1.5,
      },
    ],
  },

  tableware: {
    material: 'accent',
    cupHeight: 0.08, cupRadius: 0.04,
    plateRadius: 0.12, cutleryMaterial: 'metal',
    hasSaucer: true, hasPlate: true, hasCutlery: true,
    tablePositions: [{ x: -2.5, z: 0 }, { x: 2.0, z: -0.5 }],
  },

  lighting: {
    signage: {
      text: 'CAFÉ',
      bg: 'transparent',
      color: '#ffd9a0',
      emissive: 0xffaa50, emissiveIntensity: 0.3,
      width: 1.0, height: 0.25,
      x: 0, y: 2.7, z: 3.7, rotY: Math.PI,
    },
    fixtures: [
      { type: 'pendant', cordLength: 0.5, shadeR: 0.18, shadeH: 0.15,
        material: 'metal', bulbColor: 0xffd9a0, bulbIntensity: 1.0,
        x: -2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.5, shadeR: 0.18, shadeH: 0.15,
        material: 'metal', bulbColor: 0xffd9a0, bulbIntensity: 1.0,
        x: 2.0, y: 2.8, z: -0.5 },
      { type: 'bulb', r: 0.05, bulbColor: 0xffd9a0, bulbIntensity: 0.7,
        x: 0, y: 2.8, z: 2.8 },
    ],
    pointLight: { color: 0xffd9a0, intensity: 1.0, distance: 16, decay: 1.8,
      x: 0, y: 2.6, z: 0 },
  },

  counterTechnology: {
    type: 'manual',
    material: 'metal',
    x: 1.2, z: 2.9,
  },

  patrons: {
    figures: [
      // Gentleman reading a newspaper at a table.
      { x: -3.2, z: 0.3, rotY: Math.PI / 2, scale: 1.0,
        outfit: 0x3a3a4a, pants: 0x2a2a35, skin: 0xddc0a0,
        hair: 'short', hairColor: 0x2a1a10, gadget: 'newspaper', gadgetSide: 'left' },
      // Lady with a Victory Roll bun.
      { x: -1.8, z: 0.3, rotY: -Math.PI / 2, scale: 0.95,
        outfit: 0x8a4a3a, pants: 0x5a3a2a, skin: 0xe8d0b0,
        hair: 'bun', hairColor: 0x4a2a10 },
      // Man at the counter in a suit.
      { x: 0.5, z: 2.5, rotY: Math.PI, scale: 1.0,
        outfit: 0x2a2a3a, pants: 0x1a1a2a, skin: 0xd8b890,
        hair: 'short', hairColor: 0x1a1008 },
    ],
  },

  /**
   * Builds the full 3D scene group for this era.
   * @returns {import('three').Group}
   */
  build() {
    return buildEraScene(period1945, PALETTE);
  },
};

export default period1945;
