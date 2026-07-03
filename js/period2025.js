/**
 * @file js/period2025.js
 * @description 2025 era pack — modern specialty café.
 *
 * Scaffold module returning a valid PeriodPackage.
 * The downstream "2025 era pack" task will flesh out all assets.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 2025 modern specialty café PeriodPackage.
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 2025,
      name: 'Modern Specialty Café',
      description: 'A sleek modern café with contactless payment, smart brewing, and phone-based music.',
    },
    furniture: [
      {
        id: 'table-minimalist-concrete',
        label: 'Concrete Top Table',
        type: 'table',
        asset: { mesh: 'assets/2025/concrete-table.glb' },
        position: [0, 0, 0],
      },
    ],
    decor: [
      {
        id: 'living-wall',
        label: 'Living Green Wall',
        category: 'plant',
        asset: { mesh: 'assets/2025/living-wall.glb' },
        position: [-4, 0, -4],
      },
    ],
    coffeeMachine: {
      id: 'smart-espresso-2025',
      type: 'auto-espresso',
      brand: 'La Marzocco Linea Mini AV',
      asset: { mesh: 'assets/2025/lamarzocco-linea-mini.glb' },
      position: [2, 0.9, -2],
      hasSteamWand: true,
      brewAnimation: 'assets/2025/anims/smart-espresso.json',
      hissSound: 'assets/2025/sfx/machine-hiss.mp3',
    },
    menu: {
      boardType: 'digital',
      items: [
        { id: 'flat-white', name: 'Flat White', price: '£4.00' },
        { id: 'filter', name: 'Single Origin Filter', price: '£4.50' },
        { id: 'oat-latte', name: 'Oat Milk Latte', price: '£4.25' },
      ],
    },
    musicSource: {
      model: 'phone',
      trackId: '2025-lofi-beats',
      trackName: 'Lo-Fi Study Beats',
      asset: { mesh: 'assets/2025/phone-stand.glb' },
      audioUri: 'assets/2025/music/lofi-beats.mp3',
      volume: 0.35,
    },
    wallPosters: [
      {
        id: 'poster-sustainability',
        title: '100% Compostable',
        textureUri: 'assets/2025/textures/poster-eco.png',
        position: [-3, 2, -4],
      },
    ],
    tableware: {
      cupStyle: 'double-glass-cup-2025',
      plateStyle: 'ceramic-plate-minimal',
      cutleryStyle: 'reusable-wooden',
      material: 'borosilicate-glass',
    },
    signage: {
      exteriorType: 'led',
      exteriorText: 'SPECIALTY COFFEE',
    },
    lighting: {
      ambientType: 'warm-led',
      ambientIntensity: 1.1,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'strip',
          asset: { mesh: 'assets/2025/led-strip.glb' },
          position: [0, 3, 0],
          intensity: 1.0,
        },
      ],
    },
    counterTech: {
      posType: 'contactless',
      paymentMethods: 'Contactless, Apple Pay, Google Pay, crypto',
      asset: { mesh: 'assets/2025/contactless-terminal.glb' },
      position: [3, 0.9, -2],
    },
    patrons: {
      appearances: [
        {
          id: 'patron-remote-worker',
          outfit: 'athleisure-smart-casual',
          hairstyle: 'modern-undercut',
          gadgets: ['smartphone', 'laptop', 'wireless-earbuds'],
          position: [-1, 0, 1],
        },
      ],
      count: 12,
    },
    sfx: {
      murmur: 'assets/2025/sfx/murmur.mp3',
      machineHiss: 'assets/2025/sfx/machine-hiss.mp3',
      clatter: 'assets/2025/sfx/clatter.mp3',
      murmurVolume: 0.4,
      machineHissVolume: 0.2,
      clatterVolume: 0.15,
    },
    navigationHotspots: [
      {
        id: 'counter-closeup',
        label: 'Counter & Contactless',
        cameraPosition: [1.5, 1.6, -0.5],
        lookAt: [3, 0.9, -2],
        fov: 45,
      },
      {
        id: 'living-wall',
        label: 'Living Wall',
        cameraPosition: [-2, 2, -2],
        lookAt: [-4, 1.5, -4],
        fov: 50,
      },
      {
        id: 'seating-area',
        label: 'Seating Area',
        cameraPosition: [-2, 1.6, 2],
        lookAt: [0, 0, 0],
        fov: 60,
      },
    ],
  };

  validatePeriodPackage(pkg);
  return pkg;
}

export default { createPeriodPackage };
