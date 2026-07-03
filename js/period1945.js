/**
 * @file js/period1945.js
 * @description 1945 era pack — post-war coffee bar.
 *
 * Full period-accurate detail across all 11 user categories:
 *   furniture, decor, coffee machine, menu, music source, posters,
 *   tableware, signage, lighting, counter tech, patrons.
 *
 * Visual character: heavy wooden chairs, formica-topped tables, a glass
 * pastry case on the counter, a lever espresso machine beside a stovetop
 * moka pot, a ceiling fan turning slowly overhead, framed war-bond and
 * WWII victory / rationing posters on the walls, a chalkboard menu with
 * nickel-coffee and dime-pie prices, a Bakelite wireless set on a side
 * table playing swing, warm tungsten pendant lighting with a slight
 * flicker, and a manual cash register with a brass bell.
 *
 * Patrons wear fedoras, ties, dress-hats, and victory-roll hairstyles.
 *
 * Era modules are loaded dynamically via import() so heavy assets
 * (textures, audio) are code-split per era.
 *
 * Audio asset URIs align with the AudioManager's actual generated files
 * (see scripts/generate-audio.py and credits.md):
 *   - Music:  assets/audio/1945/music-1945.wav  ("Post-War Swing")
 *   - SFX:    assets/audio/sfx/{murmur,espresso-hiss,cup-clatter,register-ding}.wav
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1945 post-war coffee bar PeriodPackage.
 *
 * Every category is populated with period-accurate, visually-distinct
 * content that differentiates this era from the 1965 mod coffeehouse.
 *
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1945,
      name: 'Post-War Coffee Bar',
      description:
        'A modest post-war coffee bar with heavy wooden furniture, '
        + 'a lever espresso machine and moka pot, a Bakelite wireless set '
        + 'playing swing, and a chalkboard menu priced in cents.',
    },

    // ─────────────────────────────────────────────────────────────────
    // FURNITURE — heavy wooden chairs, formica tables, pastry case,
    //             counter, side table, bar stools
    // (1965 uses vinyl booths — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    furniture: [
      {
        id: 'chair-wooden-heavy-a',
        label: 'Heavy Wooden Chair',
        type: 'chair',
        asset: { mesh: 'assets/1945/chair-wooden-heavy.glb', material: 'dark-oak-stained' },
        position: [-1.5, 0, 0.5],
        rotation: [0, -0.3, 0],
      },
      {
        id: 'chair-wooden-heavy-b',
        label: 'Heavy Wooden Chair',
        type: 'chair',
        asset: { mesh: 'assets/1945/chair-wooden-heavy.glb', material: 'dark-oak-stained' },
        position: [-1.5, 0, 2.0],
        rotation: [0, -2.8, 0],
      },
      {
        id: 'chair-wooden-heavy-c',
        label: 'Heavy Wooden Chair',
        type: 'chair',
        asset: { mesh: 'assets/1945/chair-wooden-heavy.glb', material: 'dark-oak-stained' },
        position: [1.0, 0, 0.5],
        rotation: [0, 0.3, 0],
      },
      {
        id: 'chair-wooden-heavy-d',
        label: 'Heavy Wooden Chair',
        type: 'chair',
        asset: { mesh: 'assets/1945/chair-wooden-heavy.glb', material: 'dark-oak-stained' },
        position: [1.0, 0, 2.0],
        rotation: [0, 2.8, 0],
      },
      {
        id: 'table-formica-a',
        label: 'Formica-Topped Table',
        type: 'table',
        asset: {
          mesh: 'assets/1945/table-formica.glb',
          texture: 'assets/1945/textures/formica-boomerang.png',
          material: 'formica-boomerang-chrome-edge',
        },
        position: [-1.5, 0, 1.25],
      },
      {
        id: 'table-formica-b',
        label: 'Formica-Topped Table',
        type: 'table',
        asset: {
          mesh: 'assets/1945/table-formica.glb',
          texture: 'assets/1945/textures/formica-boomerang.png',
          material: 'formica-boomerang-chrome-edge',
        },
        position: [1.0, 0, 1.25],
      },
      {
        id: 'counter-wood-service',
        label: 'Wooden Service Counter',
        type: 'counter',
        asset: { mesh: 'assets/1945/counter-wood.glb', material: 'mahogany-stained' },
        position: [2.5, 0, -2.5],
      },
      {
        id: 'pastry-case-glass',
        label: 'Glass Pastry Case',
        type: 'counter',
        asset: {
          mesh: 'assets/1945/pastry-case-glass.glb',
          material: 'glass-brass-frame',
        },
        position: [1.8, 0.95, -2.5],
      },
      {
        id: 'side-table-wireless',
        label: 'Side Table (Wireless Set Stand)',
        type: 'table',
        asset: { mesh: 'assets/1945/side-table.glb', material: 'walnut' },
        position: [-3.0, 0, -2.0],
      },
      {
        id: 'bar-stool-chrome-a',
        label: 'Chrome Bar Stool',
        type: 'stool',
        asset: { mesh: 'assets/1945/bar-stool-chrome.glb' },
        position: [3.2, 0, -1.5],
      },
      {
        id: 'bar-stool-chrome-b',
        label: 'Chrome Bar Stool',
        type: 'stool',
        asset: { mesh: 'assets/1945/bar-stool-chrome.glb' },
        position: [3.2, 0, -0.5],
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // DECOR — ceiling fan, framed war-bond poster, victory/rationing
    //         notices, pendant light shade, lace doily
    // (1965 uses op-art prints — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    decor: [
      {
        id: 'ceiling-fan',
        label: 'Ceiling Fan',
        category: 'fixture',
        asset: { mesh: 'assets/1945/ceiling-fan.glb', material: 'brass-wooden-blades' },
        position: [0, 3.2, 0],
      },
      {
        id: 'framed-war-bond-poster',
        label: 'Framed War-Bond Poster',
        category: 'artwork',
        asset: {
          mesh: 'assets/1945/framed-poster.glb',
          texture: 'assets/1945/textures/poster-war-bonds.png',
        },
        position: [-3.5, 2.2, -4],
      },
      {
        id: 'victory-notice',
        label: 'VE-Day Victory Notice',
        category: 'artwork',
        asset: {
          mesh: 'assets/1945/framed-notice.glb',
          texture: 'assets/1945/textures/notice-victory.png',
        },
        position: [3.5, 2.2, -4],
      },
      {
        id: 'rationing-notice',
        label: 'Rationing Notice',
        category: 'artwork',
        asset: {
          mesh: 'assets/1945/framed-notice.glb',
          texture: 'assets/1945/textures/notice-rationing.png',
        },
        position: [0, 2.2, -4],
      },
      {
        id: 'pendant-shade-decor',
        label: 'Tungsten Pendant Shade',
        category: 'fixture',
        asset: { mesh: 'assets/1945/pendant-shade.glb', material: 'green-enamel-cone' },
        position: [0, 2.8, 0],
      },
      {
        id: 'moka-pot-counter',
        label: 'Stovetop Moka Pot',
        category: 'misc',
        asset: { mesh: 'assets/1945/moka-pot.glb', material: 'aluminium-cast' },
        position: [2.6, 0.95, -2.5],
      },
      {
        id: 'lace-doily-table-a',
        label: 'Lace Doily',
        category: 'misc',
        asset: { mesh: 'assets/1945/doily.glb', material: 'crocheted-cotton' },
        position: [-1.5, 0.76, 1.25],
      },
      {
        id: 'lace-doily-table-b',
        label: 'Lace Doily',
        category: 'misc',
        asset: { mesh: 'assets/1945/doily.glb', material: 'crocheted-cotton' },
        position: [1.0, 0.76, 1.25],
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // COFFEE MACHINE — lever espresso (Gaggia-style) + stovetop moka pot
    // (1965 uses Faema E61 with steam wand — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    coffeeMachine: {
      id: 'lever-espresso-gaggia-1945',
      type: 'lever-espresso',
      brand: 'Gaggia Classica (lever group head)',
      asset: { mesh: 'assets/1945/gaggia-lever-espresso.glb', material: 'chrome-brass' },
      position: [2.2, 0.95, -2.5],
      hasSteamWand: false,
      brewAnimation: 'assets/1945/anims/lever-pull.json',
      hissSound: 'assets/audio/sfx/espresso-hiss.wav',
    },

    // ─────────────────────────────────────────────────────────────────
    // MENU — chalkboard with nickel-coffee / dime-pie pricing
    // (1965 uses printed menu at higher prices — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    menu: {
      boardType: 'chalkboard',
      boardAsset: 'assets/1945/textures/chalkboard-menu.png',
      items: [
        { id: 'coffee', name: 'Coffee', price: '5¢', description: 'Bottomless cup of drip' },
        { id: 'espresso', name: 'Espresso', price: '8¢', description: 'Single lever-pull shot' },
        { id: 'pie-apple', name: 'Apple Pie', price: '10¢', description: 'Slice with cream' },
        { id: 'pie-cherry', name: 'Cherry Pie', price: '10¢', description: 'Slice with cream' },
        { id: 'tea', name: 'Tea', price: '3¢', description: 'Pot of English breakfast' },
        { id: 'donut', name: 'Donut', price: '5¢', description: 'Glazed or powdered' },
        { id: 'milk', name: 'Cold Milk', price: '3¢', description: 'Half-pint bottle' },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // MUSIC SOURCE — Bakelite wireless set on side table, playing swing
    // (1965 uses a jukebox playing mod-soul — visually distinct)
    //
    // audioUri points to the actual generated swing track
    // (assets/audio/1945/music-1945.wav — "Post-War Swing") so the
    // PeriodManager adapter / AudioManager can play it on slider select.
    // ─────────────────────────────────────────────────────────────────
    musicSource: {
      model: 'wireless-set',
      trackId: '1945-post-war-swing',
      trackName: 'Post-War Swing',
      asset: { mesh: 'assets/1945/bakelite-wireless-set.glb', material: 'bakelite-brown' },
      audioUri: 'assets/audio/1945/music-1945.wav',
      volume: 0.4,
    },

    // ─────────────────────────────────────────────────────────────────
    // WALL POSTERS — WWII victory, rationing, war-bond advertisements
    // (1965 uses band-night posters — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    wallPosters: [
      {
        id: 'poster-war-bonds',
        title: 'Back the Attack — Buy War Bonds',
        textureUri: 'assets/1945/textures/poster-war-bonds.png',
        position: [-3.5, 2.2, -4],
        width: 1.2,
        height: 1.6,
      },
      {
        id: 'poster-victory',
        title: 'Victory in Europe — VE Day 1945',
        textureUri: 'assets/1945/textures/poster-victory-ve-day.png',
        position: [3.5, 2.2, -4],
        width: 1.2,
        height: 1.6,
      },
      {
        id: 'poster-rationing',
        title: 'Rationing Is Patriotic — Waste Not',
        textureUri: 'assets/1945/textures/poster-rationing.png',
        position: [0, 2.2, -4],
        width: 1.4,
        height: 1.0,
      },
      {
        id: 'poster-victory-garden',
        title: 'Grow Your Own — Victory Garden',
        textureUri: 'assets/1945/textures/poster-victory-garden.png',
        position: [-3.5, 1.0, -4],
        width: 0.9,
        height: 1.2,
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // TABLEWARE — enamel mugs, enamel plates, basic metal cutlery
    // (1965 uses melamine — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    tableware: {
      cupStyle: 'enamel-mug-white-rim',
      plateStyle: 'enamel-plate-white-rim',
      cutleryStyle: 'basic-tin-plated',
      cupAsset: { mesh: 'assets/1945/enamel-mug.glb', material: 'enamel-white-blue-rim' },
      plateAsset: { mesh: 'assets/1945/enamel-plate.glb', material: 'enamel-white-blue-rim' },
      cutleryAsset: { mesh: 'assets/1945/cutlery-tin.glb', material: 'tin-plated-steel' },
      material: 'enamel',
    },

    // ─────────────────────────────────────────────────────────────────
    // SIGNAGE — hand-painted exterior sign, chalkboard interior
    // (1965 uses painted "THE COFFEE HOUSE" — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    signage: {
      exteriorType: 'painted',
      exteriorText: 'COFFEE BAR',
      exteriorAsset: 'assets/1945/textures/sign-exterior-painted.png',
      interiorSigns: [
        {
          text: 'Today\'s Special — Apple Pie 10¢',
          type: 'chalkboard',
          asset: { mesh: 'assets/1945/specials-chalkboard.glb' },
        },
        {
          text: 'Please Wait to Be Seated',
          type: 'printed',
          asset: { mesh: 'assets/1945/sign-printed-small.glb' },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // LIGHTING — warm tungsten pendants with slight flicker
    // (1965 uses brighter tungsten at 0.9 intensity — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    lighting: {
      ambientType: 'tungsten',
      ambientIntensity: 0.7,
      colorTemperature: 'warm',
      flicker: {
        enabled: true,
        type: 'subtle',
        frequencyHz: 0.5,
        amplitude: 0.08,
      },
      fixtures: [
        {
          type: 'pendant',
          asset: { mesh: 'assets/1945/pendant-light.glb', material: 'green-enamel-cone-brass' },
          position: [0, 2.8, 0],
          intensity: 0.8,
          color: '#ffd9a0',
        },
        {
          type: 'pendant',
          asset: { mesh: 'assets/1945/pendant-light.glb', material: 'green-enamel-cone-brass' },
          position: [-2.0, 2.8, 1.0],
          intensity: 0.6,
          color: '#ffd9a0',
        },
        {
          type: 'pendant',
          asset: { mesh: 'assets/1945/pendant-light.glb', material: 'green-enamel-cone-brass' },
          position: [2.0, 2.8, 1.0],
          intensity: 0.6,
          color: '#ffd9a0',
        },
        {
          type: 'sconce',
          asset: { mesh: 'assets/1945/wall-sconce.glb', material: 'brass-frosted-glass' },
          position: [-3.5, 2.2, -3.9],
          intensity: 0.4,
          color: '#ffcc88',
        },
        {
          type: 'sconce',
          asset: { mesh: 'assets/1945/wall-sconce.glb', material: 'brass-frosted-glass' },
          position: [3.5, 2.2, -3.9],
          intensity: 0.4,
          color: '#ffcc88',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // COUNTER TECH — manual cash register with brass bell
    // (1965 uses a mechanical register — visually distinct era)
    // ─────────────────────────────────────────────────────────────────
    counterTech: {
      posType: 'manual-till',
      paymentMethods: 'Cash only',
      asset: { mesh: 'assets/1945/manual-cash-register.glb', material: 'brass-bell-wooden-case' },
      position: [3.0, 0.95, -2.5],
      bellSound: 'assets/audio/sfx/register-ding.wav',
    },

    // ─────────────────────────────────────────────────────────────────
    // PATRONS — at least 3 with 1945-appropriate outfits, hairstyles,
    //           and props: fedora + tie businessman, dress-hat + victory
    //           rolls woman, war-worker in overalls with newspaper
    // (1965 has mod-girl shift dress + pixie cut — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    patrons: {
      appearances: [
        {
          id: 'patron-businessman-fedora',
          outfit: 'grey-flannel-suit-white-shirt-narrow-tie',
          hairstyle: 'slicked-back-pomade',
          gadgets: ['fedora-hat', 'folded-newspaper', 'cigarette-case'],
          asset: { mesh: 'assets/1945/patron-businessman.glb' },
          position: [-1.5, 0, 0.8],
          rotation: [0, -0.3, 0],
        },
        {
          id: 'patron-woman-dress-hat',
          outfit: 'print-day-dress-cardigan-low-heels',
          hairstyle: 'victory-rolls',
          gadgets: ['pillbox-hat', 'handbag', 'compact-mirror'],
          asset: { mesh: 'assets/1945/patron-woman-dress-hat.glb' },
          position: [1.0, 0, 0.8],
          rotation: [0, 0.3, 0],
        },
        {
          id: 'patron-war-worker',
          outfit: 'denim-overalls-work-boots-undershirt',
          hairstyle: 'short-combed-back',
          gadgets: ['newspaper', 'lunch-pail'],
          asset: { mesh: 'assets/1945/patron-war-worker.glb' },
          position: [3.2, 0.45, -1.5],
          rotation: [0, 1.5, 0],
        },
        {
          id: 'patron-soldier-on-leave',
          outfit: 'khaki-uniform-garrison-cap',
          hairstyle: 'buzz-cut',
          gadgets: ['cigarette', 'matchbook'],
          asset: { mesh: 'assets/1945/patron-soldier.glb' },
          position: [-1.5, 0, 2.2],
          rotation: [0, -2.8, 0],
        },
      ],
      count: 4,
    },

    // ─────────────────────────────────────────────────────────────────
    // SFX — register bell, lever-pull hiss, swing music from wireless,
    //       conversation murmur, cup clatter
    // URIs align with actual AudioManager generated assets.
    // ─────────────────────────────────────────────────────────────────
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
      registerBell: 'assets/audio/sfx/register-ding.wav',
      murmurVolume: 0.3,
      machineHissVolume: 0.25,
      clatterVolume: 0.2,
      registerBellVolume: 0.4,
    },

    // ─────────────────────────────────────────────────────────────────
    // NAVIGATION HOTSPOTS — camera anchor points for close-up viewing
    // ─────────────────────────────────────────────────────────────────
    navigationHotspots: [
      {
        id: 'counter-closeup',
        label: 'Counter & Espresso Machine',
        cameraPosition: [1.8, 1.6, -1.0],
        lookAt: [2.2, 0.95, -2.5],
        fov: 45,
      },
      {
        id: 'wireless-set-closeup',
        label: 'Bakelite Wireless Set',
        cameraPosition: [-2.2, 1.4, -1.5],
        lookAt: [-3.0, 0.9, -2.0],
        fov: 40,
      },
      {
        id: 'pastry-case-closeup',
        label: 'Glass Pastry Case',
        cameraPosition: [1.2, 1.5, -1.5],
        lookAt: [1.8, 0.95, -2.5],
        fov: 50,
      },
      {
        id: 'seating-area',
        label: 'Seating Area',
        cameraPosition: [-2.5, 1.7, 3.0],
        lookAt: [0, 0.5, 1.25],
        fov: 60,
      },
      {
        id: 'wall-posters-closeup',
        label: 'War Posters & Notices',
        cameraPosition: [0, 1.8, -2.0],
        lookAt: [0, 2.2, -4],
        fov: 55,
      },
    ],
  };

  validatePeriodPackage(pkg);
  return pkg;
}

export default { createPeriodPackage };
