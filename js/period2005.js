/**
 * @file js/period2005.js
 * @description 2005 era pack — third-wave indie café.
 *
 * Scaffold module returning a valid PeriodPackage.
 * The downstream "2005 era pack" task will flesh out all assets.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 2005 third-wave indie café PeriodPackage.
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 2005,
      name: 'Third-Wave Indie Café',
      description: 'A rustic-chic indie café with reclaimed wood, pour-over bars, and iPod docks.',
    },
    furniture: [
      {
        id: 'table-reclaimed-wood',
        label: 'Reclaimed Wood Table',
        type: 'table',
        asset: { mesh: 'assets/2005/reclaimed-table.glb' },
        position: [0, 0, 0],
      },
    ],
    decor: [
      {
        id: 'exposed-brick',
        label: 'Exposed Brick Wall',
        category: 'misc',
        asset: { mesh: 'assets/2005/brick-wall.glb' },
        position: [-4, 0, -4],
      },
    ],
    coffeeMachine: {
      id: 'pourover-bar-2005',
      type: 'pourover',
      brand: 'Hario V60',
      asset: { mesh: 'assets/2005/hario-v60.glb' },
      position: [2, 0.9, -2],
      hasSteamWand: false,
      brewAnimation: 'assets/2005/anims/pourover-pour.json',
      hissSound: 'assets/2005/sfx/water-pour.mp3',
    },
    menu: {
      boardType: 'chalkboard',
      items: [
        { id: 'pourover', name: 'Pour Over', price: '$3.50' },
        { id: 'latte', name: 'Vanilla Latte', price: '$3.75' },
        { id: 'cappuccino', name: 'Cappuccino', price: '$3.25' },
      ],
    },
    musicSource: {
      model: 'ipod',
      trackId: '2005-indie-folk',
      trackName: 'Indie Folk Playlist',
      asset: { mesh: 'assets/2005/ipod-dock.glb' },
      audioUri: 'assets/2005/music/indie-folk.mp3',
      volume: 0.45,
    },
    wallPosters: [
      {
        id: 'poster-local-band',
        title: 'Open Mic Tuesdays',
        textureUri: 'assets/2005/textures/poster-open-mic.png',
        position: [-3, 2, -4],
      },
    ],
    tableware: {
      cupStyle: 'stoneware-mug-2005',
      plateStyle: 'ceramic-plate-rustic',
      cutleryStyle: 'bamboo-cutlery',
      material: 'stoneware',
    },
    signage: {
      exteriorType: 'painted',
      exteriorText: 'THE ROASTERY',
    },
    lighting: {
      ambientType: 'warm-led',
      ambientIntensity: 1.0,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'pendant',
          asset: { mesh: 'assets/2005/edison-pendant.glb' },
          position: [0, 3, 0],
          intensity: 0.9,
        },
      ],
    },
    counterTech: {
      posType: 'touchscreen-pos',
      paymentMethods: 'Cash, credit/debit card',
      asset: { mesh: 'assets/2005/touchscreen-pos.glb' },
      position: [3, 0.9, -2],
    },
    patrons: {
      appearances: [
        {
          id: 'patron-hipster',
          outfit: 'flannel-beanie',
          hairstyle: 'messy-bun',
          gadgets: ['ipod', 'macbook'],
          position: [-1, 0, 1],
        },
      ],
      count: 10,
    },
    sfx: {
      murmur: 'assets/2005/sfx/murmur.mp3',
      machineHiss: 'assets/2005/sfx/machine-hiss.mp3',
      clatter: 'assets/2005/sfx/clatter.mp3',
      murmurVolume: 0.4,
      machineHissVolume: 0.2,
      clatterVolume: 0.15,
    },
    navigationHotspots: [
      {
        id: 'pourover-bar',
        label: 'Pour Over Bar',
        cameraPosition: [1.5, 1.6, -0.5],
        lookAt: [2, 0.9, -2],
        fov: 45,
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
