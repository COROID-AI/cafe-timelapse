/**
 * @file js/period1985.js
 * @description 1985 era pack — neon synthwave café.
 *
 * Scaffold module returning a valid PeriodPackage.
 * The downstream "1985 era pack" task will flesh out all assets.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1985 neon synthwave café PeriodPackage.
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1985,
      name: 'Neon Synthwave Café',
      description: 'A neon-lit café with a boombox, glass-topped tables, and synthwave ambiance.',
    },
    furniture: [
      {
        id: 'table-glass-tubular',
        label: 'Glass Top Tubular Table',
        type: 'table',
        asset: { mesh: 'assets/1985/glass-table.glb' },
        position: [0, 0, 0],
      },
    ],
    decor: [
      {
        id: 'neon-tube-sign',
        label: 'Neon Tube Sign',
        category: 'fixture',
        asset: { mesh: 'assets/1985/neon-tube.glb' },
        position: [-3, 2.5, -4],
      },
    ],
    coffeeMachine: {
      id: 'espresso-auto-1985',
      type: 'auto-espresso',
      brand: 'La Marzocco GS',
      asset: { mesh: 'assets/1985/lamarzocco-gs.glb' },
      position: [2, 0.9, -2],
      hasSteamWand: true,
      brewAnimation: 'assets/1985/anims/espresso-auto.json',
      hissSound: 'assets/1985/sfx/machine-hiss.mp3',
    },
    menu: {
      boardType: 'printed',
      items: [
        { id: 'espresso', name: 'Espresso', price: '$0.75' },
        { id: 'latte', name: 'Café Latte', price: '$1.25' },
        { id: 'cappuccino', name: 'Cappuccino', price: '$1.00' },
      ],
    },
    musicSource: {
      model: 'boombox',
      trackId: '1985-synthwave',
      trackName: 'Synthwave Mixtape',
      asset: { mesh: 'assets/1985/boombox.glb' },
      audioUri: 'assets/1985/music/synthwave.mp3',
      volume: 0.5,
    },
    wallPosters: [
      {
        id: 'poster-movie-blockbuster',
        title: 'Now Showing',
        textureUri: 'assets/1985/textures/poster-movie.png',
        position: [-3, 2, -4],
      },
    ],
    tableware: {
      cupStyle: 'ceramic-mug-1985',
      plateStyle: 'ceramic-plate-1985',
      cutleryStyle: 'stainless-steel',
      material: 'ceramic',
    },
    signage: {
      exteriorType: 'neon',
      exteriorText: 'CAFÉ',
    },
    lighting: {
      ambientType: 'neon',
      ambientIntensity: 1.2,
      colorTemperature: 'cool',
      fixtures: [
        {
          type: 'track',
          asset: { mesh: 'assets/1985/track-light.glb' },
          position: [0, 3, 0],
          intensity: 1.1,
        },
      ],
    },
    counterTech: {
      posType: 'electronic-register',
      paymentMethods: 'Cash, credit card (magnetic stripe)',
      asset: { mesh: 'assets/1985/electronic-register.glb' },
      position: [3, 0.9, -2],
    },
    patrons: {
      appearances: [
        {
          id: 'patron-yuppie',
          outfit: 'power-suit-shoulder-pads',
          hairstyle: 'mullet',
          gadgets: ['walkman', 'pager'],
          position: [-1, 0, 1],
        },
      ],
      count: 8,
    },
    sfx: {
      murmur: 'assets/1985/sfx/murmur.mp3',
      machineHiss: 'assets/1985/sfx/machine-hiss.mp3',
      clatter: 'assets/1985/sfx/clatter.mp3',
      murmurVolume: 0.35,
      machineHissVolume: 0.3,
      clatterVolume: 0.2,
    },
    navigationHotspots: [
      {
        id: 'boombox-closeup',
        label: 'Boombox',
        cameraPosition: [1.5, 1.4, -0.5],
        lookAt: [2, 1.0, -2.5],
        fov: 40,
      },
      {
        id: 'neon-sign',
        label: 'Neon Sign',
        cameraPosition: [-2, 2, -2],
        lookAt: [-3, 2.5, -4],
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
