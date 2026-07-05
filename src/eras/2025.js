/**
 * 2025 — Contemporary era content package.
 *
 * Captures the modern-day café: sustainable wood-and-metal furniture, a
 * touchscreen smart espresso machine, an on-demand electric grinder, a
 * precision pour-over bar, a smartphone streaming lo-fi/chill beats from a
 * wireless speaker, eco-conscious branding posters, artisan ceramic
 * tableware, warm LED track lighting, a tablet POS with contactless payment,
 * and patrons in athleisure with smartphones and wireless earbuds.
 *
 * @module eras/2025
 */

import { buildEraScene } from './era-builder.js';

/** Colour palette for 2025 materials. */
const PALETTE = {
  wood: 0xa08060, // reclaimed oak
  woodDark: 0x6a5240,
  metal: 0xd8d8e0, // matte aluminium
  chrome: 0xe0e0e8,
  fabric: 0x5a7a6a, // sage green upholstery
  plastic: 0x2a2a2a, // matte black
  wall: 0xf0ede8, // warm white
  paper: 0xfaf8f4,
  accent: 0x4aaa8a, // eco green
  glass: 0xc8e0e8,
  light: 0xfff0d8, // warm LED
};

/**
 * @type {import('@/contracts/PeriodPackage.js').PeriodPackage}
 */
const period2025 = {
  year: 2025,
  name: 'Contemporary Artisan',

  furniture: {
    seats: [
      // Reclaimed wood communal table.
      { type: 'table', x: -2.5, z: 0, w: 1.0, d: 0.9, h: 0.74, thickness: 0.05, material: 'wood' },
      { type: 'table', x: 2.5, z: 0, w: 1.0, d: 0.9, h: 0.74, thickness: 0.05, material: 'wood' },
      // Modern bentwood chairs.
      { type: 'chair', x: -3.2, z: 0, w: 0.46, d: 0.46, h: 0.45, backH: 0.52, material: 'wood', legMaterial: 'wood' },
      { type: 'chair', x: -1.8, z: 0, w: 0.46, d: 0.46, h: 0.45, backH: 0.52, material: 'wood', legMaterial: 'wood' },
      { type: 'chair', x: 3.2, z: 0, w: 0.46, d: 0.46, h: 0.45, backH: 0.52, material: 'wood', legMaterial: 'wood' },
      { type: 'chair', x: 1.8, z: 0, w: 0.46, d: 0.46, h: 0.45, backH: 0.52, material: 'wood', legMaterial: 'wood' },
      // Modern counter stools.
      { type: 'stool', x: -1.0, z: 2.8, h: 0.65, r: 0.18, material: 'fabric', legMaterial: 'metal' },
      { type: 'stool', x: 0.0, z: 2.8, h: 0.65, r: 0.18, material: 'fabric', legMaterial: 'metal' },
      { type: 'stool', x: 1.0, z: 2.8, h: 0.65, r: 0.18, material: 'fabric', legMaterial: 'metal' },
    ],
    decor: [
      { shape: 'cylinder', rt: 0.12, rb: 0.1, h: 0.35, x: -4.3, y: 0.2, z: -1.5, material: 'wood' }, // concrete planter
      { shape: 'sphere', r: 0.15, x: -4.3, y: 0.55, z: -1.5, material: 'accent' }, // plant (monstera)
      { shape: 'box', w: 0.25, h: 0.3, d: 0.25, x: 3.5, y: 0.2, z: -3.5, material: 'plastic' }, // smart speaker
      { shape: 'box', w: 0.3, h: 0.5, d: 0.03, x: 4.3, y: 1.5, z: -3.5, material: 'paper' }, // framed art print
    ],
  },

  coffeeEquipment: {
    espressoMachine: {
      w: 0.6, h: 0.55, d: 0.45,
      material: 'chrome', detailMaterial: 'plastic',
      x: -0.5, z: 2.85,
      touchscreen: true,
      gauges: [{ x: 0.15, y: 0.08 }],
    },
    grinder: {
      w: 0.17, h: 0.45, d: 0.17,
      kind: 'electric', hopper: true, hopperR: 0.07, hopperR2: 0.05, hopperH: 0.18,
      material: 'chrome',
      x: 0.2, z: 2.85,
    },
    brewer: {
      w: 0.18, h: 0.25, d: 0.18,
      kind: 'pourOver',
      x: 0.6, z: 2.85,
    },
  },

  menu: {
    title: 'MENU',
    currency: '£',
    items: [
      { name: 'Espresso', price: '£2.80' },
      { name: 'Flat White', price: '£3.50' },
      { name: 'Oat Latte', price: '£3.80' },
      { name: 'Cold Brew', price: '£4.00' },
      { name: 'Matcha Latte', price: '£4.20' },
      { name: 'Avocado Toast', price: '£6.50' },
      { name: 'Vegan Brownie', price: '£3.20' },
    ],
    bg: '#f0ede8',
    textColor: '#2a2a2a',
    accent: '#4aaa8a',
    borderColor: '#a0a0a0',
    titleFont: 'bold 32px "Helvetica Neue", Arial, sans-serif',
    bodyFont: '22px "Helvetica Neue", Arial, sans-serif',
    width: 1.4, height: 1.0,
    frameMaterial: 'wood',
  },

  music: {
    source: 'phone',
    description: 'Lo-fi chill beats streaming from a phone on a smart speaker dock',
    x: 1.5, y: 1.1, z: -2.5,
  },

  signage: {
    posters: [
      {
        headline: 'Oatly',
        subtext: ['It\'s Like Milk', 'But Made For Humans'],
        bg: '#f0f0f0', bgEnd: '#e0e0e0',
        fg: '#2a2a2a', accent: '#2a4a6a',
        icon: '🌱', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: -1.5,
      },
      {
        headline: 'Specialty Coffee',
        subtext: ['Single Origin', 'Direct Trade', 'Ethically Sourced'],
        bg: '#2a4a3a', bgEnd: '#1a3a2a',
        fg: '#f5f5f5', accent: '#4aaa8a',
        icon: '☕', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 0.0,
      },
      {
        headline: 'Bring Your Own Cup',
        subtext: ['-20p Discount', 'Zero Waste'],
        bg: '#2a3a4a', bgEnd: '#1a2a3a',
        fg: '#f5f5f5', accent: '#4aaa8a',
        icon: '♻️', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 1.5,
      },
    ],
  },

  tableware: {
    material: 'fabric',
    cupHeight: 0.1, cupRadius: 0.05,
    plateRadius: 0.14, cutleryMaterial: 'wood',
    hasSaucer: false, hasPlate: true, hasCutlery: true,
    tablePositions: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
  },

  lighting: {
    signage: {
      text: 'CAFÉ',
      bg: 'transparent',
      color: '#4aaa8a',
      emissive: 0x4aaa8a, emissiveIntensity: 0.4,
      width: 1.0, height: 0.25,
      x: 0, y: 2.7, z: 3.7, rotY: Math.PI,
    },
    fixtures: [
      { type: 'pendant', cordLength: 0.35, shadeR: 0.1, shadeH: 0.08,
        material: 'metal', bulbColor: 0xfff0d8, bulbIntensity: 1.2,
        x: -2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.35, shadeR: 0.1, shadeH: 0.08,
        material: 'metal', bulbColor: 0xfff0d8, bulbIntensity: 1.2,
        x: 2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.35, shadeR: 0.1, shadeH: 0.08,
        material: 'metal', bulbColor: 0xfff0d8, bulbIntensity: 1.2,
        x: 0, y: 2.8, z: 2.8 },
      { type: 'pendant', cordLength: 0.35, shadeR: 0.1, shadeH: 0.08,
        material: 'metal', bulbColor: 0xfff0d8, bulbIntensity: 1.2,
        x: -2.5, y: 2.8, z: 2.8 },
    ],
    pointLight: { color: 0xfff0d8, intensity: 1.4, distance: 16, decay: 1.8,
      x: 0, y: 2.6, z: 0 },
  },

  counterTechnology: {
    type: 'tablet',
    x: 1.2, z: 2.9,
  },

  patrons: {
    figures: [
      // Remote worker with a laptop-equivalent (phone).
      { x: -3.2, z: 0.3, rotY: Math.PI / 2, scale: 1.0,
        outfit: 0x2a2a2a, pants: 0x3a3a3a, skin: 0xddc0a0,
        hair: 'short', hairColor: 0x2a1a10, gadget: 'phone', gadgetSide: 'right' },
      // Woman in athleisure with a phone.
      { x: 3.2, z: 0.3, rotY: -Math.PI / 2, scale: 0.95,
        outfit: 0x6a4a8a, pants: 0x4a4a5a, skin: 0xe8d0b0,
        hair: 'long', hairColor: 0x3a2a18, gadget: 'phone', gadgetSide: 'left' },
      // Bearded hipster at the counter.
      { x: 1.0, z: 2.5, rotY: Math.PI, scale: 1.0,
        outfit: 0x8a7a5a, pants: 0x3a3a2a, skin: 0xd8b890,
        hair: 'short', hairColor: 0x2a1a08 },
    ],
  },

  /**
   * Builds the full 3D scene group for this era.
   * @returns {import('three').Group}
   */
  build() {
    return buildEraScene(period2025, PALETTE);
  },
};

export default period2025;
