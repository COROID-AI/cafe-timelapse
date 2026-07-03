/**
 * @file js/period1945.js
 * @description 1945 era pack — post-war coffee bar.
 *
 * This is a scaffold module that returns a valid PeriodPackage.
 * The downstream "1945 era pack" task will flesh out all assets with
 * period-accurate furniture, decor, music, etc.
 *
 * Era modules are loaded dynamically via import() so heavy assets
 * (textures, audio) are code-split per era.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1945 post-war coffee bar PeriodPackage.
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1945,
      name: 'Post-War Coffee Bar',
      description: 'A modest post-war coffee bar with simple wooden furniture and a wireless set.',
    },
    furniture: [
      {
        id: 'table-round-small',
        label: 'Round Wooden Table',
        type: 'table',
        asset: { mesh: 'assets/1945/table-round.glb' },
        position: [0, 0, 0],
      },
    ],
    decor: [
      {
        id: 'wartime-poster',
        label: 'Wartime Information Poster',
        category: 'artwork',
        asset: { mesh: 'assets/1945/poster-wartime.glb' },
        position: [-3, 2, -4],
      },
    ],
    coffeeMachine: {
      id: 'lever-espresso-1945',
      type: 'lever-espresso',
      brand: 'Gaggia Classica',
      asset: { mesh: 'assets/1945/gaggia-lever.glb' },
      position: [2, 0.9, -2],
      hasSteamWand: false,
      hissSound: 'assets/1945/sfx/machine-hiss.mp3',
    },
    menu: {
      boardType: 'chalkboard',
      items: [
        { id: 'coffee', name: 'Coffee', price: '5¢' },
        { id: 'espresso', name: 'Espresso', price: '8¢' },
        { id: 'tea', name: 'Tea', price: '3¢' },
      ],
    },
    musicSource: {
      model: 'wireless-set',
      trackId: '1945-bbc-light-programme',
      trackName: 'BBC Light Programme',
      asset: { mesh: 'assets/1945/wireless-set.glb' },
      audioUri: 'assets/1945/music/wireless-bbc.mp3',
      volume: 0.4,
    },
    wallPosters: [
      {
        id: 'poster-victory-garden',
        title: 'Grow Your Own Food',
        textureUri: 'assets/1945/textures/poster-victory-garden.png',
        position: [-3, 2, -4],
      },
    ],
    tableware: {
      cupStyle: 'enamel-mug',
      plateStyle: 'enamel-plate',
      cutleryStyle: 'basic-metal',
      material: 'enamel',
    },
    signage: {
      exteriorType: 'painted',
      exteriorText: 'COFFEE BAR',
    },
    lighting: {
      ambientType: 'tungsten',
      ambientIntensity: 0.7,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'pendant',
          asset: { mesh: 'assets/1945/pendant-light.glb' },
          position: [0, 3, 0],
          intensity: 0.8,
        },
      ],
    },
    counterTech: {
      posType: 'manual-till',
      paymentMethods: 'Cash only',
      asset: { mesh: 'assets/1945/manual-till.glb' },
      position: [3, 0.9, -2],
    },
    patrons: {
      appearances: [
        {
          id: 'patron-war-worker',
          outfit: 'war-worker-overalls',
          hairstyle: 'victory-rolls',
          gadgets: ['newspaper'],
          position: [-1, 0, 1],
        },
      ],
      count: 4,
    },
    sfx: {
      murmur: 'assets/1945/sfx/murmur.mp3',
      machineHiss: 'assets/1945/sfx/machine-hiss.mp3',
      clatter: 'assets/1945/sfx/clatter.mp3',
      murmurVolume: 0.3,
      machineHissVolume: 0.25,
      clatterVolume: 0.2,
    },
    navigationHotspots: [
      {
        id: 'counter-closeup',
        label: 'Counter Close-up',
        cameraPosition: [1.5, 1.6, -0.5],
        lookAt: [2, 0.9, -2],
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
