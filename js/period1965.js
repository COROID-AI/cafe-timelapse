/**
 * @file js/period1965.js
 * @description 1965 era pack — mod coffeehouse.
 *
 * Scaffold module returning a valid PeriodPackage.
 * The downstream "1965 era pack" task will flesh out all assets.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1965 mod coffeehouse PeriodPackage.
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1965,
      name: 'Mod Coffeehouse',
      description: 'A swinging mod coffeehouse with a jukebox and bold geometric decor.',
    },
    furniture: [
      {
        id: 'table-booth',
        label: 'Vinyl Booth Table',
        type: 'table',
        asset: { mesh: 'assets/1965/booth-table.glb' },
        position: [0, 0, 0],
      },
    ],
    decor: [
      {
        id: 'mod-art',
        label: 'Op-Art Print',
        category: 'artwork',
        asset: { mesh: 'assets/1965/op-art-print.glb' },
        position: [-3, 2, -4],
      },
    ],
    coffeeMachine: {
      id: 'faema-e61',
      type: 'lever-espresso',
      brand: 'Faema E61',
      asset: { mesh: 'assets/1965/faema-e61.glb' },
      position: [2, 0.9, -2],
      hasSteamWand: true,
      brewAnimation: 'assets/1965/anims/espresso-pull.json',
      hissSound: 'assets/1965/sfx/machine-hiss.mp3',
    },
    menu: {
      boardType: 'printed',
      items: [
        { id: 'espresso', name: 'Espresso', price: '15¢' },
        { id: 'cappuccino', name: 'Cappuccino', price: '25¢' },
        { id: 'coffee', name: 'Drip Coffee', price: '10¢' },
      ],
    },
    musicSource: {
      model: 'jukebox',
      trackId: '1965-mod-soul',
      trackName: 'Mod Soul Hits',
      asset: { mesh: 'assets/1965/jukebox.glb' },
      audioUri: 'assets/1965/music/mod-soul.mp3',
      volume: 0.5,
    },
    wallPosters: [
      {
        id: 'poster-band-night',
        title: 'Live Music Friday Night',
        textureUri: 'assets/1965/textures/poster-band-night.png',
        position: [-3, 2, -4],
      },
    ],
    tableware: {
      cupStyle: 'melamine-cup',
      plateStyle: 'melamine-plate',
      cutleryStyle: 'stainless-steel',
      material: 'melamine',
    },
    signage: {
      exteriorType: 'painted',
      exteriorText: 'THE COFFEE HOUSE',
    },
    lighting: {
      ambientType: 'tungsten',
      ambientIntensity: 0.9,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'pendant',
          asset: { mesh: 'assets/1965/space-age-pendant.glb' },
          position: [0, 3, 0],
          intensity: 1.0,
        },
      ],
    },
    counterTech: {
      posType: 'mechanical-register',
      paymentMethods: 'Cash only',
      asset: { mesh: 'assets/1965/mechanical-register.glb' },
      position: [3, 0.9, -2],
    },
    patrons: {
      appearances: [
        {
          id: 'patron-mod-girl',
          outfit: 'shift-dress-twiggy',
          hairstyle: 'pixie-cut',
          gadgets: ['cigarette-case'],
          position: [-1, 0, 1],
        },
      ],
      count: 6,
    },
    sfx: {
      murmur: 'assets/1965/sfx/murmur.mp3',
      machineHiss: 'assets/1965/sfx/machine-hiss.mp3',
      clatter: 'assets/1965/sfx/clatter.mp3',
      murmurVolume: 0.35,
      machineHissVolume: 0.3,
      clatterVolume: 0.2,
    },
    navigationHotspots: [
      {
        id: 'jukebox-closeup',
        label: 'Jukebox',
        cameraPosition: [1.5, 1.6, -0.5],
        lookAt: [2, 1.2, -2.5],
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
