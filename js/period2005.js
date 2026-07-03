/**
 * @file js/period2005.js
 * @description 2005 era pack — third-wave indie café.
 *
 * Full-detail PeriodPackage for the 2005 era: reclaimed-wood communal tables,
 * Eames-style chairs, exposed-brick walls, Slayer espresso machine, iPod +
 * speaker dock playing indie/folk, framed vinyl-record posters, 'Free Wi-Fi'
 * chalkboard, single-origin pour-over station, dual-monitor POS, patrons in
 * trucker caps / hoodies / messenger bags / wired earbuds / iPod minis, and
 * warmer diffused pendant lighting.
 *
 * All 11 user categories are populated with period-accurate detail and are
 * visually distinct from the 1985 (neon synthwave) and 2025 (modern specialty)
 * eras.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 2005 third-wave indie café PeriodPackage.
 *
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 2005,
      name: 'Third-Wave Indie Café',
      description:
        'A rustic-chic third-wave café with reclaimed-wood communal tables, ' +
        'exposed brick, a Slayer espresso machine, single-origin pour-over bar, ' +
        'an iPod dock spinning indie/folk, and a dual-monitor POS. Patrons in ' +
        'trucker caps, hoodies, and messenger bags sip from the great ' +
        'paper-vs-ceramic debate era.',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 1. FURNITURE — reclaimed-wood communal tables, Eames-style chairs,
    //    live-edge bar counter, reclaimed shelving, barista bar.
    // ───────────────────────────────────────────────────────────────────────
    furniture: [
      {
        id: 'communal-table-reclaimed-wood',
        label: 'Reclaimed Wood Communal Table',
        type: 'table',
        asset: {
          mesh: 'assets/2005/reclaimed-communal-table.glb',
          texture: 'assets/2005/textures/reclaimed-wood-diffuse.png',
          roughnessMap: 'assets/2005/textures/reclaimed-wood-roughness.png',
        },
        position: [0, 0, 0.5],
        rotation: [0, 0, 0],
        scale: 1.4,
      },
      {
        id: 'communal-table-reclaimed-wood-2',
        label: 'Reclaimed Wood Communal Table (Far)',
        type: 'table',
        asset: {
          mesh: 'assets/2005/reclaimed-communal-table.glb',
          texture: 'assets/2005/textures/reclaimed-wood-diffuse.png',
          roughnessMap: 'assets/2005/textures/reclaimed-wood-roughness.png',
        },
        position: [-3.2, 0, -1.5],
        rotation: [0, Math.PI / 6, 0],
        scale: 1.2,
      },
      {
        id: 'chair-eames-molded-plywood',
        label: 'Eames-Style Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2005/eames-plywood-chair.glb',
          material: 'walnut-plywood-matte',
        },
        position: [-0.9, 0, 1.4],
        rotation: [0, Math.PI, 0],
      },
      {
        id: 'chair-eames-molded-plywood-2',
        label: 'Eames-Style Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2005/eames-plywood-chair.glb',
          material: 'walnut-plywood-matte',
        },
        position: [0.9, 0, 1.4],
        rotation: [0, Math.PI, 0],
      },
      {
        id: 'chair-eames-molded-plywood-3',
        label: 'Eames-Style Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2005/eames-plywood-chair.glb',
          material: 'walnut-plywood-matte',
        },
        position: [-0.9, 0, -0.4],
        rotation: [0, 0, 0],
      },
      {
        id: 'chair-eames-molded-plywood-4',
        label: 'Eames-Style Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2005/eames-plywood-chair.glb',
          material: 'walnut-plywood-matte',
        },
        position: [0.9, 0, -0.4],
        rotation: [0, 0, 0],
      },
      {
        id: 'bar-counter-live-edge',
        label: 'Live-Edge Walnut Bar Counter',
        type: 'counter',
        asset: {
          mesh: 'assets/2005/live-edge-counter.glb',
          texture: 'assets/2005/textures/live-edge-walnut.png',
        },
        position: [2.5, 0, -2.8],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      {
        id: 'shelf-reclaimed-pipe',
        label: 'Reclaimed Wood & Black-Pipe Shelving',
        type: 'shelf',
        asset: {
          mesh: 'assets/2005/pipe-shelf.glb',
          texture: 'assets/2005/textures/reclaimed-wood-diffuse.png',
        },
        position: [-4.2, 1.2, -3.8],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'stool-metal-counter-height',
        label: 'Industrial Metal Bar Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/2005/metal-bar-stool.glb',
          material: 'brushed-steel-matte',
        },
        position: [1.8, 0, -1.8],
      },
      {
        id: 'stool-metal-counter-height-2',
        label: 'Industrial Metal Bar Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/2005/metal-bar-stool.glb',
          material: 'brushed-steel-matte',
        },
        position: [3.2, 0, -1.8],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 2. DECOR — exposed-brick walls, Edison-bulb accents, potted succulents,
    //    chalkboard A-frame, vinyl-record wall display, burlap sack display.
    // ───────────────────────────────────────────────────────────────────────
    decor: [
      {
        id: 'exposed-brick-wall-back',
        label: 'Exposed Brick Wall',
        category: 'misc',
        asset: {
          mesh: 'assets/2005/brick-wall-plane.glb',
          texture: 'assets/2005/textures/exposed-brick-red.png',
          normalMap: 'assets/2005/textures/brick-normal.png',
        },
        position: [-4.5, 1.8, -4],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'exposed-brick-wall-side',
        label: 'Exposed Brick Wall (Side)',
        category: 'misc',
        asset: {
          mesh: 'assets/2005/brick-wall-plane.glb',
          texture: 'assets/2005/textures/exposed-brick-red.png',
          normalMap: 'assets/2005/textures/brick-normal.png',
        },
        position: [4.5, 1.8, -4],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'potted-succulent-counter',
        label: 'Potted Succulent (Counter)',
        category: 'plant',
        asset: { mesh: 'assets/2005/succulent-pot.glb' },
        position: [3.5, 0.95, -2.5],
      },
      {
        id: 'hanging-plant-pothos',
        label: 'Hanging Pothos Plant',
        category: 'plant',
        asset: { mesh: 'assets/2005/hanging-pothos.glb' },
        position: [-1.5, 2.8, 1.0],
      },
      {
        id: 'chalkboard-a-frame-sidewalk',
        label: 'Chalkboard A-Frame (Daily Special)',
        category: 'misc',
        asset: { mesh: 'assets/2005/chalkboard-aframe.glb' },
        position: [0.5, 0, 3.5],
        rotation: [0, -0.15, 0],
      },
      {
        id: 'vinyl-record-wall-display',
        label: 'Framed Vinyl Record Wall Display',
        category: 'artwork',
        asset: {
          mesh: 'assets/2005/vinyl-record-frame.glb',
          texture: 'assets/2005/textures/vinyl-label-indie.png',
        },
        position: [-3.8, 2.0, -3.9],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'burlap-coffee-sack-display',
        label: 'Burlap Coffee Sack Display',
        category: 'misc',
        asset: { mesh: 'assets/2005/burlap-sack.glb' },
        position: [4.0, 0.5, -3.5],
        rotation: [0, -0.3, 0],
      },
      {
        id: 'edison-bulb-string-lights',
        label: 'Edison Bulb String Lights',
        category: 'fixture',
        asset: { mesh: 'assets/2005/edison-string-lights.glb' },
        position: [0, 2.9, 0],
        rotation: [0, 0, 0],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 3. COFFEE MACHINE — Slayer single-group espresso machine (flagship
    //    third-wave gear) plus a Hario V60 / Chemex pour-over bar station.
    // ───────────────────────────────────────────────────────────────────────
    coffeeMachine: {
      id: 'slayer-single-group-2005',
      type: 'auto-espresso',
      brand: 'Slayer Espresso Single Group',
      asset: {
        mesh: 'assets/2005/slayer-espresso.glb',
        material: 'stainless-steel-polished',
      },
      position: [2.2, 0.95, -2.8],
      hasSteamWand: true,
      brewAnimation: 'assets/2005/anims/slayer-extraction.json',
      hissSound: 'assets/audio/sfx/espresso-hiss.wav',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 4. MENU — 2005 third-wave pricing on a large chalkboard.
    //    Paper-vs-ceramic debate era. Wi-Fi is free but listed on the board.
    // ───────────────────────────────────────────────────────────────────────
    menu: {
      boardType: 'chalkboard',
      boardAsset: 'assets/2005/textures/menu-chalkboard-2005.png',
      items: [
        {
          id: 'espresso',
          name: 'Espresso',
          price: '$2.50',
          description: 'Double shot, Slayer pull',
        },
        {
          id: 'latte',
          name: 'Latte',
          price: '$3.50',
          description: 'Whole or non-fat milk',
        },
        {
          id: 'cappuccino',
          name: 'Cappuccino',
          price: '$3.25',
          description: 'Wet, traditional 5oz',
        },
        {
          id: 'pourover',
          name: 'Single-Origin Pour-Over',
          price: '$4.00',
          description: 'Hario V60, rotating origin',
        },
        {
          id: 'chemex',
          name: 'Chemex',
          price: '$4.50',
          description: '3-cup, served in carafe',
        },
        {
          id: 'cold-brew',
          name: 'Cold Brew',
          price: '$3.75',
          description: '17-hour steep, on tap',
        },
        {
          id: 'wifi',
          name: 'Wi-Fi',
          price: '$0.00',
          description: 'Free — password on receipt',
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 5. MUSIC SOURCE — iPod (4th-gen click-wheel) in a speaker dock on the
    //    counter, playing an indie/folk playlist.
    // ───────────────────────────────────────────────────────────────────────
    musicSource: {
      model: 'ipod',
      trackId: '2005-indie-folk',
      trackName: 'Third-Wave Indie Folk',
      asset: {
        mesh: 'assets/2005/ipod-speaker-dock.glb',
        texture: 'assets/2005/textures/ipod-clickwheel.png',
      },
      audioUri: 'assets/audio/2005/music-2005.wav',
      volume: 0.45,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 6. WALL POSTERS — framed vinyl-record album art and indie show flyers.
    // ───────────────────────────────────────────────────────────────────────
    wallPosters: [
      {
        id: 'poster-vinyl-album-indie-1',
        title: 'Framed Vinyl — Indie Folk LP',
        textureUri: 'assets/2005/textures/poster-vinyl-indie-1.png',
        position: [-3.5, 2.2, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.8,
        height: 0.8,
      },
      {
        id: 'poster-vinyl-album-folk-2',
        title: 'Framed Vinyl — Alt-Folk LP',
        textureUri: 'assets/2005/textures/poster-vinyl-folk-2.png',
        position: [-3.5, 1.3, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.7,
        height: 0.7,
      },
      {
        id: 'poster-show-flyer',
        title: 'Indie Show Flyer — The Loft',
        textureUri: 'assets/2005/textures/poster-show-flyer.png',
        position: [3.8, 2.0, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 0.6,
        height: 0.85,
      },
      {
        id: 'poster-open-mic-tuesdays',
        title: 'Open Mic Tuesdays',
        textureUri: 'assets/2005/textures/poster-open-mic.png',
        position: [3.8, 1.1, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 0.6,
        height: 0.45,
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 7. TABLEWARE — the paper-vs-ceramic debate era. Stumptown-style paper
    //    cups alongside handmade stoneware mugs for here.
    // ───────────────────────────────────────────────────────────────────────
    tableware: {
      cupStyle: 'paper-to-go-cup-2005',
      plateStyle: 'handmade-stoneware-plate-rustic',
      cutleryStyle: 'bamboo-cutlery',
      cupAsset: {
        mesh: 'assets/2005/paper-cup-to-go.glb',
        texture: 'assets/2005/textures/sleeve-kraft.png',
      },
      plateAsset: {
        mesh: 'assets/2005/stoneware-plate.glb',
        texture: 'assets/2005/textures/stoneware-glaze.png',
      },
      cutleryAsset: {
        mesh: 'assets/2005/bamboo-cutlery-set.glb',
      },
      material: 'kraft-paper-and-stoneware',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 8. SIGNAGE — hand-painted exterior sign, 'Free Wi-Fi' chalkboard, and
    //    a single-origin bean chalkboard.
    // ───────────────────────────────────────────────────────────────────────
    signage: {
      exteriorType: 'painted',
      exteriorText: 'THE ROASTERY',
      exteriorAsset: 'assets/2005/textures/exterior-sign-painted.png',
      interiorSigns: [
        {
          text: 'FREE Wi-Fi',
          type: 'chalkboard',
          asset: {
            mesh: 'assets/2005/wifi-chalkboard.glb',
            texture: 'assets/2005/textures/chalk-wifi.png',
          },
        },
        {
          text: 'Today\'s Single Origin: Ethiopia Yirgacheffe',
          type: 'chalkboard',
          asset: {
            mesh: 'assets/2005/origin-chalkboard.glb',
            texture: 'assets/2005/textures/chalk-origin.png',
          },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 9. LIGHTING — warm, diffused pendant lighting with Edison bulbs for a
    //    cozy, intimate third-wave atmosphere.
    // ───────────────────────────────────────────────────────────────────────
    lighting: {
      ambientType: 'warm-led',
      ambientIntensity: 0.85,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/2005/edison-pendant.glb',
            texture: 'assets/2005/textures/edison-bulb-glow.png',
          },
          position: [0, 2.6, 0.5],
          intensity: 0.9,
        },
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/2005/edison-pendant.glb',
            texture: 'assets/2005/textures/edison-bulb-glow.png',
          },
          position: [-2.5, 2.6, -1.0],
          intensity: 0.8,
        },
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/2005/edison-pendant.glb',
            texture: 'assets/2005/textures/edison-bulb-glow.png',
          },
          position: [2.5, 2.4, -2.5],
          intensity: 0.85,
        },
        {
          type: 'sconce',
          asset: { mesh: 'assets/2005/industrial-sconce.glb' },
          position: [-4.4, 2.0, -3.5],
          intensity: 0.5,
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 10. COUNTER TECH — dual-monitor POS (touchscreen register + order
    //     display). Cash + magnetic-stripe credit/debit cards.
    // ───────────────────────────────────────────────────────────────────────
    counterTech: {
      posType: 'touchscreen-pos',
      posAsset: 'assets/2005/dual-monitor-pos.glb',
      paymentMethods: 'Cash, credit/debit card (magnetic stripe)',
      asset: {
        mesh: 'assets/2005/dual-monitor-pos.glb',
        texture: 'assets/2005/textures/pos-screen-2005.png',
      },
      position: [3.2, 0.95, -2.6],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 11. PATRONS — 2005-era outfits: trucker caps, hoodies, messenger bags,
    //     wired earbuds, iPod minis, flannel, vintage tees, skinny jeans.
    //     At least 3 distinct patron models (acceptance criterion #5).
    // ───────────────────────────────────────────────────────────────────────
    patrons: {
      appearances: [
        {
          id: 'patron-indie-dev-trucker',
          outfit: 'trucker-cap-hoodie-skinny-jeans',
          hairstyle: 'shaggy-side-swept',
          gadgets: ['ipod-mini', 'wired-earbuds', 'messenger-bag', 'macbook'],
          asset: {
            mesh: 'assets/2005/patron-indie-dev.glb',
            texture: 'assets/2005/textures/patron-trucker-hoodie.png',
          },
          position: [-0.8, 0, 1.2],
          rotation: [0, Math.PI, 0],
        },
        {
          id: 'patron-folksinger-flannel',
          outfit: 'flannel-shirt-vintage-tee-skinny-jeans',
          hairstyle: 'messy-bun',
          gadgets: ['ipod-mini', 'wired-earbuds', 'moleskine-notebook'],
          asset: {
            mesh: 'assets/2005/patron-folksinger.glb',
            texture: 'assets/2005/textures/patron-flannel.png',
          },
          position: [0.8, 0, 1.2],
          rotation: [0, Math.PI, 0],
        },
        {
          id: 'patron-barista-sleeve-tats',
          outfit: 'rolled-sleeve-tee-apron-tattoos',
          hairstyle: 'man-bun-under-cap',
          gadgets: ['tamper', 'portafilter', 'wristwatch'],
          asset: {
            mesh: 'assets/2005/patron-barista.glb',
            texture: 'assets/2005/textures/patron-barista-apron.png',
          },
          position: [2.3, 0, -2.5],
          rotation: [0, -Math.PI / 2, 0],
        },
        {
          id: 'patron-hipster-messenger',
          outfit: 'messenger-bag-cardigan-ironic-tee',
          hairstyle: 'bedhead',
          gadgets: ['ipod-mini', 'wired-earbuds', 'messenger-bag', 'novel'],
          asset: {
            mesh: 'assets/2005/patron-hipster.glb',
            texture: 'assets/2005/textures/patron-cardigan.png',
          },
          position: [-2.8, 0, -1.2],
          rotation: [0, 0.4, 0],
        },
        {
          id: 'patron-student-hoodie',
          outfit: 'hoodie-jeans-converse',
          hairstyle: 'long-straight',
          gadgets: ['ipod-mini', 'wired-earbuds', 'textbook', 'highlighter'],
          asset: {
            mesh: 'assets/2005/patron-student.glb',
            texture: 'assets/2005/textures/patron-hoodie.png',
          },
          position: [-1.0, 0, -0.3],
          rotation: [0, 0, 0],
        },
      ],
      count: 9,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 12. SFX — ambient murmur, espresso hiss, cup clatter. The iPod click
    //     wheel is referenced via musicSource asset; the murmur/hiss/clatter
    //     use the shared license-cleared SFX library.
    // ───────────────────────────────────────────────────────────────────────
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
      murmurVolume: 0.35,
      machineHissVolume: 0.25,
      clatterVolume: 0.15,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 13. NAVIGATION HOTSPOTS — close-up camera anchors for the pour-over
    //     bar, iPod dock, Wi-Fi chalkboard, and communal seating.
    // ───────────────────────────────────────────────────────────────────────
    navigationHotspots: [
      {
        id: 'pourover-bar-closeup',
        label: 'Pour-Over Bar',
        cameraPosition: [1.8, 1.5, -1.2],
        lookAt: [2.2, 0.95, -2.8],
        fov: 40,
      },
      {
        id: 'ipod-dock-closeup',
        label: 'iPod Speaker Dock',
        cameraPosition: [2.6, 1.3, -1.5],
        lookAt: [3.0, 1.0, -2.5],
        fov: 35,
      },
      {
        id: 'wifi-chalkboard-closeup',
        label: 'Free Wi-Fi Chalkboard',
        cameraPosition: [-3.0, 1.6, -2.0],
        lookAt: [-4.2, 1.5, -3.8],
        fov: 45,
      },
      {
        id: 'communal-table-closeup',
        label: 'Communal Table',
        cameraPosition: [0, 1.5, 2.5],
        lookAt: [0, 0.8, 0.5],
        fov: 55,
      },
      {
        id: 'vinyl-poster-wall-closeup',
        label: 'Vinyl Record Wall',
        cameraPosition: [-2.8, 1.8, -2.5],
        lookAt: [-3.8, 2.0, -3.9],
        fov: 45,
      },
      {
        id: 'slayer-machine-closeup',
        label: 'Slayer Espresso Machine',
        cameraPosition: [1.5, 1.4, -1.8],
        lookAt: [2.2, 1.0, -2.8],
        fov: 40,
      },
    ],
  };

  validatePeriodPackage(pkg);
  return pkg;
}

export default { createPeriodPackage };
