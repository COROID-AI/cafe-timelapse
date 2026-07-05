/**
 * 2005 — Early-2000s era content package.
 *
 * Captures the early-noughties café: sleek aluminium-framed furniture, a
 * semi-automatic espresso machine with an LCD display, an on-demand electric
 * grinder, a drip brewer, an iPod in a speaker dock playing indie/chillout,
 * minimalist advertising posters, plain white ceramic tableware, warm halogen
 * spotlighting, a computer POS terminal with CRT/flat monitor, and patrons in
 * low-rise jeans, flip phones, and spiky hair.
 *
 * @module eras/2005
 */

import { buildEraScene } from './era-builder.js';

/** Colour palette for 2005 materials. */
const PALETTE = {
  wood: 0xb0a090, // light beech
  woodDark: 0x8a7a6a,
  metal: 0xc8c8d0, // brushed aluminium
  chrome: 0xd0d0d8,
  fabric: 0x6a6a7a, // grey upholstery
  plastic: 0xf0f0f0, // white plastic (iPod aesthetic)
  wall: 0xe8e4da, // pale minimalist
  paper: 0xfaf8f0,
  accent: 0x4a8aaa, // soft blue
  glass: 0xc0d8e8,
  light: 0xfff5dc, // warm halogen
};

/**
 * @type {import('@/contracts/PeriodPackage.js').PeriodPackage}
 */
const period2005 = {
  year: 2005,
  name: 'Noughties Chillout',

  furniture: {
    seats: [
      // Aluminium-framed table with a beech top.
      { type: 'table', x: -2.5, z: 0, w: 0.9, d: 0.9, h: 0.74, thickness: 0.04, material: 'wood' },
      { type: 'table', x: 2.5, z: 0, w: 0.9, d: 0.9, h: 0.74, thickness: 0.04, material: 'wood' },
      // Sleek metal-framed chairs.
      { type: 'chair', x: -3.2, z: 0, w: 0.44, d: 0.44, h: 0.45, backH: 0.5, material: 'fabric', legMaterial: 'metal' },
      { type: 'chair', x: -1.8, z: 0, w: 0.44, d: 0.44, h: 0.45, backH: 0.5, material: 'fabric', legMaterial: 'metal' },
      { type: 'chair', x: 3.2, z: 0, w: 0.44, d: 0.44, h: 0.45, backH: 0.5, material: 'fabric', legMaterial: 'metal' },
      { type: 'chair', x: 1.8, z: 0, w: 0.44, d: 0.44, h: 0.45, backH: 0.5, material: 'fabric', legMaterial: 'metal' },
      // Aluminium counter stools.
      { type: 'stool', x: -1.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'metal' },
      { type: 'stool', x: 0.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'metal' },
      { type: 'stool', x: 1.0, z: 2.8, h: 0.65, r: 0.17, material: 'fabric', legMaterial: 'metal' },
    ],
    decor: [
      { shape: 'box', w: 0.3, h: 0.4, d: 0.3, x: -4.3, y: 0.2, z: -1.5, material: 'wood' }, // iMac-style display stand
      { shape: 'sphere', r: 0.1, x: 3.5, y: 1.0, z: -3.5, material: 'glass' }, // glass vase
      { shape: 'box', w: 0.15, h: 0.25, d: 0.15, x: 4.3, y: 0.2, z: -2.0, material: 'plastic' }, // white accessory
    ],
  },

  coffeeEquipment: {
    espressoMachine: {
      w: 0.6, h: 0.52, d: 0.44,
      material: 'chrome', detailMaterial: 'plastic',
      x: -0.5, z: 2.85,
      gauges: [{ x: -0.1, y: 0.08 }],
      touchscreen: true,
    },
    grinder: {
      w: 0.18, h: 0.42, d: 0.18,
      kind: 'electric', hopper: true, hopperR: 0.07, hopperR2: 0.05, hopperH: 0.16,
      material: 'chrome',
      x: 0.15, z: 2.85,
    },
    brewer: {
      w: 0.2, h: 0.3, d: 0.2,
      kind: 'drip',
      x: 0.5, z: 2.85,
    },
  },

  menu: {
    title: 'MENU',
    currency: '£',
    items: [
      { name: 'Espresso', price: '£1.50' },
      { name: 'Cappuccino', price: '£2.00' },
      { name: 'Latte', price: '£2.20' },
      { name: 'Mocha', price: '£2.40' },
      { name: 'Tea', price: '£1.20' },
      { name: 'Muffin', price: '£1.80' },
      { name: 'Panini', price: '£3.50' },
    ],
    bg: '#e8e4da',
    textColor: '#2a2a2a',
    accent: '#4a8aaa',
    borderColor: '#8a8a8a',
    titleFont: 'bold 32px "Helvetica Neue", Arial, sans-serif',
    bodyFont: '22px "Helvetica Neue", Arial, sans-serif',
    width: 1.4, height: 1.0,
    frameMaterial: 'chrome',
  },

  music: {
    source: 'ipod',
    description: 'Indie and chillout from an iPod in a speaker dock',
    x: 1.5, y: 1.1, z: -2.5,
  },

  signage: {
    posters: [
      {
        headline: 'Starbucks',
        subtext: ['Coffee', 'Since 1971'],
        bg: '#1a4a2a', bgEnd: '#0a3a1a',
        fg: '#f5f5f5', accent: '#f0f0f0',
        icon: '☕', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: -1.5,
      },
      {
        headline: 'iPod',
        subtext: ['10,000 Songs', 'In Your Pocket'],
        bg: '#f5f5f5', bgEnd: '#e0e0e0',
        fg: '#2a2a2a', accent: '#4a8aaa',
        icon: '🎵', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 0.0,
      },
      {
        headline: 'Red Bull',
        subtext: ['Gives You', 'Wiiings'],
        bg: '#1a1a8a', bgEnd: '#0a0a5a',
        fg: '#ffffff', accent: '#c0c0c0',
        icon: '⚡', w: 0.5, h: 0.7,
        x: -4.6, y: 1.8, z: 1.5,
      },
    ],
  },

  tableware: {
    material: 'plastic',
    cupHeight: 0.1, cupRadius: 0.05,
    plateRadius: 0.14, cutleryMaterial: 'chrome',
    hasSaucer: false, hasPlate: true, hasCutlery: true,
    tablePositions: [{ x: -2.5, z: 0 }, { x: 2.5, z: 0 }],
  },

  lighting: {
    signage: {
      text: 'CAFÉ',
      bg: 'transparent',
      color: '#4a8aaa',
      emissive: 0x4a8aaa, emissiveIntensity: 0.3,
      width: 1.0, height: 0.25,
      x: 0, y: 2.7, z: 3.7, rotY: Math.PI,
    },
    fixtures: [
      { type: 'pendant', cordLength: 0.3, shadeR: 0.12, shadeH: 0.1,
        material: 'chrome', bulbColor: 0xfff5dc, bulbIntensity: 1.1,
        x: -2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.3, shadeR: 0.12, shadeH: 0.1,
        material: 'chrome', bulbColor: 0xfff5dc, bulbIntensity: 1.1,
        x: 2.5, y: 2.8, z: 0 },
      { type: 'pendant', cordLength: 0.3, shadeR: 0.12, shadeH: 0.1,
        material: 'chrome', bulbColor: 0xfff5dc, bulbIntensity: 1.1,
        x: 0, y: 2.8, z: 2.8 },
    ],
    pointLight: { color: 0xfff5dc, intensity: 1.3, distance: 16, decay: 1.8,
      x: 0, y: 2.6, z: 0 },
  },

  counterTechnology: {
    type: 'computer',
    material: 'plastic',
    x: 1.2, z: 2.9,
  },

  patrons: {
    figures: [
      // Student with a flip phone.
      { x: -3.2, z: 0.3, rotY: Math.PI / 2, scale: 1.0,
        outfit: 0x5a5a6a, pants: 0x3a3a4a, skin: 0xddc0a0,
        hair: 'short', hairColor: 0x2a1a10, gadget: 'phone', gadgetSide: 'left' },
      // Woman with long straight hair.
      { x: 3.2, z: 0.3, rotY: -Math.PI / 2, scale: 0.95,
        outfit: 0x8a4a6a, pants: 0x4a4a4a, skin: 0xe8d0b0,
        hair: 'long', hairColor: 0x2a1a08 },
      // Hipster with spiky hair at the counter.
      { x: 1.0, z: 2.5, rotY: Math.PI, scale: 1.0,
        outfit: 0x2a4a3a, pants: 0x2a2a2a, skin: 0xd8b890,
        hair: 'short', hairColor: 0x1a1008 },
    ],
  },

  /**
   * Builds the full 3D scene group for this era.
   * @returns {import('three').Group}
   */
  build() {
    return buildEraScene(period2005, PALETTE);
  },
};

export default period2005;
