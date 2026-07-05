/**
 * 1985 — Eighties era content package.
 *
 * Captures the 1980s café: tubular chrome furniture with pastel cushions, a
 * commercial espresso machine with pressure gauges, an electric burr grinder,
 * a drip coffee maker, a portable boombox blasting new-wave/synth-pop,
 * neon-accented advertising posters, ceramic tableware with geometric
 * patterns, harsh fluorescent lighting, an electronic cash register with LED
 * display, and patrons in shoulder-pad blazers, big hair, and Walkmans.
 *
 * @module eras/1985
 */

import { buildEraScene } from './era-builder.js';

/** Colour palette for 1985 materials. */
const PALETTE = {
  wood: 0x9a8a7a, // pale ash
  woodDark: 0x6a5a4a,
  metal: 0xb8b8c0, // brushed steel
  chrome: 0xc8c8d0,
  fabric: 0x4a9aaa, // teal/pastel blue
  plastic: 0x2a2a30, // black plastic
  wall: 0xc8c0b0, // off-white / pastel
  paper: 0xf5f0e0,
  accent: 0xff6080, // hot pink
  glass: 0xb8d0e0,
  light: 0xf0f0ff, // cool fluorescent
};

/**
 * @type {import('@/contracts/PeriodPackage.js').PeriodPackage}
 */
const period1985 = {
  year: 1985,
  name: 'Neon Eighties',

  furniture: {
    seats: [
      // Glass-topped chrome table.
      { type: 'table', x: -2.5, z: 0, w: 0.9, d: 0.9, h: 0.73, thickness: 0.03, material: 'glass' },
      { type: 'table', x: 2.5, z: 0, w: 0.9, d: 0.9, h: 0.73, thickness: 0.03, material: 'glass' },
      // Tubular chrome chairs with pastel cushions.
      { type: 'chair', x: -3.2, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.45, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: -1.8, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.45, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: 3.2, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.45, material: 'fabric', legMaterial: 'chrome' },
      { type: 'chair', x: 1.8, z: 0, w: 0.42, d: 0.42, h: 0.45, backH: 0.45, material: 'fabric', legMaterial: 'chrome' },
      // Chrome counter stools.
      { type: 'stool', x: -1.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'chrome' },
      { type: 'stool', x: 0.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'chrome' },
      { type: 'stool', x: 1.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'chrome' },
    ],
    decor: [
      { shape: 'box', w: 0.2, h: 0.15, d: 0.15, x: -4.3, y: 0.2, z: -1.5, material: 'accent' }, // neon cube
      { shape: 'cylinder', rt: 0.08, rb: 0.1, h: 0.3, x: 3.5, y: 0.2, z: -3.5, material: 'plastic' }, // Rubik's cube stand
      { shape: 'box', w: 0.25, h: 0.25, d: 0.05, x: 4.3, y: 1.5, z: -3.5, material: 'accent' }, // wall art panel
    ],
  },

  coffeeEquipment: {
    espressoMachine: {
      w: 0.65, h: 0.55, d: 0.45,
      material: 'chrome', detailMaterial: 'plastic',
      x: -0.5, z: 2.85,
      gauges: [{ x: -0.15, y: 0.1 }, { x: 0.1, y: 0.1 }],
    },
    grinder: {
      w: 0.2, h: 0.4, d: 0.2,
      kind: 'electric', hopper: true, hopperR: 0.08, hopperR2: 0.06, hopperH: 0.18,
      material: 'plastic',
      x: 0.2, z: 2.85,
    },
    brewer: {
      w: 0.22, h: 0.32, d: 0.22,
      kind: 'drip',
      x: 0.65, z: 2.85,
    },
  },

  menu: {
    title: 'MENU',
    currency: '£', // decimal pounds (post-1971)
    items: [
      { name: 'Espresso', price: '£0.65' },
      { name: 'Cappuccino', price: '£0.85' },
      { name: 'Latte', price: '£0.95' },
      { name: 'Tea', price: '£0.40' },
      { name: 'Croissant', price: '£0.70' },
      { name: 'Cheesecake', price: '£1.20' },
    ],
    bg: '#1a2a3a',
    textColor: '#f0f0ff',
    accent: '#ff6080',
    borderColor: '#40c0e0',
    titleFont: 'bold 36px "Courier New", monospace',
    bodyFont: '24px "Courier New", monospace',
    width: 1.5, height: 1.1,
    frameMaterial: 'chrome',
  },

  music: {
    source: 'boombox',
    description: 'Synth-pop and new-wave from a portable boombox',
    audio: { track: 'synth-pop', ambience: 'cafe-murmur', machine: 'pumpEspresso' },
    x: -2.0, y: 1.0, z: -2.5,
  },

  signage: {
    posters: [
      {
        headline: 'Sony Walkman',
        subtext: ['Listen On The Go', 'The Sound Of The 80s'],
        bg: '#1a1a1a', bgEnd: '#0a0a0a',
        fg: '#f0f0f0', accent: '#ff6080',
        icon: '🎧', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: -1.5,
      },
      {
        headline: 'Pepsi',
        subtext: ['The Choice', 'Of A New Generation'],
        bg: '#1a3a8a', bgEnd: '#0a1a4a',
        fg: '#ffffff', accent: '#e83030',
        icon: '🥤', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 0.0,
      },
      {
        headline: 'Nike Air',
        subtext: ['Just Do It', 'Air Technology'],
        bg: '#1a1a1a', bgEnd: '#000000',
        fg: '#ffffff', accent: '#ff8800',
        icon: '👟', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 1.5,
      },
    ],
  },

  tableware: {
    material: 'fabric',
    cupHeight: 0.09, cupRadius: 0.045,
    plateRadius: 0.13, cutleryMaterial: 'chrome',
    hasSaucer: false, hasPlate: true, hasCutlery: true,
    tablePositions: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
  },

  lighting: {
    signage: {
      text: 'CAFÉ',
      bg: 'transparent',
      color: '#ff6080',
      emissive: 0xff3080, emissiveIntensity: 0.6,
      width: 1.0, height: 0.25,
      x: 0, y: 2.7, z: 3.7, rotY: Math.PI,
    },
    fixtures: [
      { type: 'fluorescent', length: 0.9, bulbColor: 0xf0f0ff, bulbIntensity: 0.9,
        x: -2.5, y: 2.9, z: 0 },
      { type: 'fluorescent', length: 0.9, bulbColor: 0xf0f0ff, bulbIntensity: 0.9,
        x: 2.5, y: 2.9, z: 0 },
      { type: 'fluorescent', length: 0.9, bulbColor: 0xf0f0ff, bulbIntensity: 0.9,
        x: 0, y: 2.9, z: 2.8 },
    ],
    pointLight: { color: 0xf0f0ff, intensity: 1.3, distance: 16, decay: 1.8,
      x: 0, y: 2.6, z: 0 },
  },

  counterTechnology: {
    type: 'electronic',
    material: 'plastic',
    x: 1.2, z: 2.9,
  },

  patrons: {
    figures: [
      // Businessman in a shoulder-pad blazer.
      { x: -3.2, z: 0.3, rotY: Math.PI / 2, scale: 1.0,
        outfit: 0x2a3a5a, pants: 0x2a2a3a, skin: 0xd8b890,
        hair: 'short', hairColor: 0x2a1a10 },
      // Woman with big hair and a Walkman.
      { x: 3.2, z: 0.3, rotY: -Math.PI / 2, scale: 0.95,
        outfit: 0xff6080, pants: 0x8a2a5a, skin: 0xe8d0b0,
        hair: 'curly', hairColor: 0x4a3020, gadget: 'walkman', gadgetSide: 'right' },
      // Teen at the counter.
      { x: 1.0, z: 2.5, rotY: Math.PI, scale: 0.9,
        outfit: 0x3a8a4a, pants: 0x2a3a5a, skin: 0xddc0a0,
        hair: 'short', hairColor: 0x3a2010 },
    ],
  },

  /**
   * Builds the full 3D scene group for this era.
   * @returns {import('three').Group}
   */
  build() {
    return buildEraScene(period1985, PALETTE);
  },
};

export default period1985;
