/**
 * @file js/period1985.js
 * @description 1985 era pack — neon synthwave café.
 *
 * Full-detail PeriodPackage for the 1985 era: pastel Memphis-style furniture,
 * neon tube signage ('ESPRESSO', 'OPEN'), a chunky two-group La Marzocco
 * espresso machine, an arcade cabinet in the corner, a boombox on the counter
 * blasting synth-pop / early MTV hits, MTV / movie blockbuster posters, a glass
 * rack with branded ceramic mugs, patrons in shoulder-pads / perms / Members
 * Only jackets / high-tops / Walkmans, a lit menu board with photocopied prices
 * (Espresso $1.00, Cappuccino $1.75, Croissant $1.25), and brighter
 * track-lighting with pink/neon accent strips.
 *
 * All 11 user categories are populated with period-accurate detail and are
 * visually distinct from the 1965 (mod coffeehouse) and 2005 (third-wave indie)
 * eras.
 *
 * Acceptance criteria coverage:
 *   1. Returns a validatePeriodPackage()-passing package.
 *   2. All 11 categories visually distinct from 1965 and 2005.
 *   3. Menu shows 1985 prices (Espresso $1.00, Cappuccino $1.75, Croissant $1.25).
 *   4. Boombox mesh visible, playing synth-pop / early MTV track on selection.
 *   5. 5 patron models with 80s outfits (shoulder-pads, perms, Members Only, Walkmans).
 *   6. Neon signage and Memphis-style decor visually convincing.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1985 neon synthwave café PeriodPackage.
 *
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1985,
      name: 'Neon Synthwave Café',
      description:
        'A neon-drenched 1985 café with pastel Memphis-style furniture, ' +
        'a chunky two-group La Marzocco espresso machine, a boombox on the ' +
        'counter blasting synth-pop and early MTV hits, an arcade cabinet ' +
        'glowing in the corner, and patrons in shoulder-pads, perms, Members ' +
        'Only jackets, and Walkman headphones. Lit menu board with photocopied ' +
        'prices and brighter pink-tinted track-lighting.',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 1. FURNITURE — pastel Memphis-design furniture: glass-topped tubular
    //    steel tables, chrome-and-vinyl chairs, laminate counter, glass mug
    //    rack shelving, pastel Formica bar stools.
    // ───────────────────────────────────────────────────────────────────────
    furniture: [
      {
        id: 'table-glass-tubular-steel',
        label: 'Glass-Top Tubular Steel Table',
        type: 'table',
        asset: {
          mesh: 'assets/1985/glass-tubular-table.glb',
          texture: 'assets/1985/textures/glass-tabletop-pastel.png',
          material: 'chrome-tubular-steel-pastel',
        },
        position: [0, 0, 0.5],
        rotation: [0, 0, 0],
        scale: 1.1,
      },
      {
        id: 'table-glass-tubular-steel-2',
        label: 'Glass-Top Tubular Steel Table (Far)',
        type: 'table',
        asset: {
          mesh: 'assets/1985/glass-tubular-table.glb',
          texture: 'assets/1985/textures/glass-tabletop-pink.png',
          material: 'chrome-tubular-steel-pink',
        },
        position: [-3.0, 0, -1.2],
        rotation: [0, Math.PI / 8, 0],
        scale: 1.0,
      },
      {
        id: 'chair-chrome-vinyl-teal',
        label: 'Chrome-and-Vinyl Chair (Teal)',
        type: 'chair',
        asset: {
          mesh: 'assets/1985/chrome-vinyl-chair.glb',
          texture: 'assets/1985/textures/vinyl-teal.png',
          material: 'chrome-frame-vinyl-teal',
        },
        position: [-0.9, 0, 1.4],
        rotation: [0, Math.PI, 0],
      },
      {
        id: 'chair-chrome-vinyl-pink',
        label: 'Chrome-and-Vinyl Chair (Pink)',
        type: 'chair',
        asset: {
          mesh: 'assets/1985/chrome-vinyl-chair.glb',
          texture: 'assets/1985/textures/vinyl-pink.png',
          material: 'chrome-frame-vinyl-pink',
        },
        position: [0.9, 0, 1.4],
        rotation: [0, Math.PI, 0],
      },
      {
        id: 'chair-chrome-vinyl-yellow',
        label: 'Chrome-and-Vinyl Chair (Yellow)',
        type: 'chair',
        asset: {
          mesh: 'assets/1985/chrome-vinyl-chair.glb',
          texture: 'assets/1985/textures/vinyl-yellow.png',
          material: 'chrome-frame-vinyl-yellow',
        },
        position: [-0.9, 0, -0.4],
        rotation: [0, 0, 0],
      },
      {
        id: 'chair-chrome-vinyl-mint',
        label: 'Chrome-and-Vinyl Chair (Mint Green)',
        type: 'chair',
        asset: {
          mesh: 'assets/1985/chrome-vinyl-chair.glb',
          texture: 'assets/1985/textures/vinyl-mint.png',
          material: 'chrome-frame-vinyl-mint',
        },
        position: [0.9, 0, -0.4],
        rotation: [0, 0, 0],
      },
      {
        id: 'counter-laminate-pastel',
        label: 'Pastel Laminate Counter',
        type: 'counter',
        asset: {
          mesh: 'assets/1985/laminate-counter.glb',
          texture: 'assets/1985/textures/laminate-pastel-formica.png',
          material: 'formica-laminate-pastel',
        },
        position: [2.5, 0, -2.8],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      {
        id: 'shelf-glass-mug-rack',
        label: 'Glass Mug Rack Shelving',
        type: 'shelf',
        asset: {
          mesh: 'assets/1985/glass-mug-rack-shelf.glb',
          texture: 'assets/1985/textures/branded-mugs-rack.png',
          material: 'chrome-shelf-glass',
        },
        position: [-4.0, 1.4, -3.8],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'stool-formica-pastel',
        label: 'Pastel Formica Bar Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/1985/formica-bar-stool.glb',
          texture: 'assets/1985/textures/formica-pink.png',
          material: 'chrome-formica-pink',
        },
        position: [1.8, 0, -1.8],
      },
      {
        id: 'stool-formica-pastel-2',
        label: 'Pastel Formica Bar Stool (Mint)',
        type: 'stool',
        asset: {
          mesh: 'assets/1985/formica-bar-stool.glb',
          texture: 'assets/1985/textures/formica-mint.png',
          material: 'chrome-formica-mint',
        },
        position: [3.2, 0, -1.8],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 2. DECOR — neon tube signage, Memphis-design objects, arcade cabinet,
    //    potted silk plants, Rubik's-cube accent, neon wall strips.
    // ───────────────────────────────────────────────────────────────────────
    decor: [
      {
        id: 'neon-sign-espresso',
        label: 'Neon "ESPRESSO" Tube Sign',
        category: 'fixture',
        asset: {
          mesh: 'assets/1985/neon-tube-espresso.glb',
          texture: 'assets/1985/textures/neon-pink-glow.png',
          material: 'neon-tube-pink-emissive',
        },
        position: [-4.3, 2.4, -3.9],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'neon-sign-open',
        label: 'Neon "OPEN" Tube Sign',
        category: 'fixture',
        asset: {
          mesh: 'assets/1985/neon-tube-open.glb',
          texture: 'assets/1985/textures/neon-blue-glow.png',
          material: 'neon-tube-blue-emissive',
        },
        position: [4.3, 2.0, -3.9],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'arcade-cabinet-corner',
        label: 'Arcade Cabinet (Corner)',
        category: 'misc',
        asset: {
          mesh: 'assets/1985/arcade-cabinet.glb',
          texture: 'assets/1985/textures/arcade-screen-glow.png',
          material: 'arcade-cabinet-painted-mdf',
        },
        position: [-3.8, 0, 2.8],
        rotation: [0, 0.5, 0],
      },
      {
        id: 'memphis-zigzag-shelf',
        label: 'Memphis-Design Zigzag Wall Shelf',
        category: 'misc',
        asset: {
          mesh: 'assets/1985/memphis-zigzag-shelf.glb',
          texture: 'assets/1985/textures/memphis-pastel-pattern.png',
          material: 'memphis-painted-wood',
        },
        position: [4.3, 2.2, -3.9],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'memphis-cone-lamp',
        label: 'Memphis-Design Cone Table Lamp',
        category: 'fixture',
        asset: {
          mesh: 'assets/1985/memphis-cone-lamp.glb',
          material: 'memphis-painted-metal',
        },
        position: [-0.5, 0.75, 0.5],
      },
      {
        id: 'potted-silk-fern',
        label: 'Potted Silk Fern',
        category: 'plant',
        asset: { mesh: 'assets/1985/silk-fern-pot.glb' },
        position: [3.5, 0, 2.5],
      },
      {
        id: 'potted-silk-fern-2',
        label: 'Potted Silk Fern (Hanging)',
        category: 'plant',
        asset: { mesh: 'assets/1985/hanging-silk-fern.glb' },
        position: [-1.5, 2.8, 1.0],
      },
      {
        id: 'rubiks-cube-decor',
        label: 'Rubik\'s Cube Tabletop Decor',
        category: 'misc',
        asset: { mesh: 'assets/1985/rubiks-cube.glb' },
        position: [0.3, 0.75, 0.5],
        rotation: [0, 0.3, 0],
      },
      {
        id: 'neon-wall-strip-pink',
        label: 'Neon Pink Wall Strip Light',
        category: 'fixture',
        asset: {
          mesh: 'assets/1985/neon-wall-strip.glb',
          texture: 'assets/1985/textures/neon-pink-strip.png',
          material: 'neon-strip-pink-emissive',
        },
        position: [0, 2.6, -4.2],
      },
      {
        id: 'neon-wall-strip-cyan',
        label: 'Neon Cyan Wall Strip Light',
        category: 'fixture',
        asset: {
          mesh: 'assets/1985/neon-wall-strip.glb',
          texture: 'assets/1985/textures/neon-cyan-strip.png',
          material: 'neon-strip-cyan-emissive',
        },
        position: [0, 1.4, -4.2],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 3. COFFEE MACHINE — chunky two-group La Marzocco espresso machine
    //    (GS / Linea silhouette), polished stainless steel with steam wand.
    // ───────────────────────────────────────────────────────────────────────
    coffeeMachine: {
      id: 'lamarzocco-two-group-1985',
      type: 'auto-espresso',
      brand: 'La Marzocco GS Two-Group',
      asset: {
        mesh: 'assets/1985/lamarzocco-gs-two-group.glb',
        texture: 'assets/1985/textures/lamarzocco-stainless-steel.png',
        material: 'polished-stainless-steel',
      },
      position: [2.2, 0.95, -2.8],
      hasSteamWand: true,
      brewAnimation: 'assets/1985/anims/espresso-two-group-pull.json',
      hissSound: 'assets/audio/sfx/espresso-hiss.wav',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 4. MENU — lit menu board with photocopied prices. 1985 pricing:
    //    Espresso $1.00, Cappuccino $1.75, Croissant $1.25, etc.
    // ───────────────────────────────────────────────────────────────────────
    menu: {
      boardType: 'printed',
      boardAsset: 'assets/1985/textures/menu-board-photocopied.png',
      items: [
        {
          id: 'espresso',
          name: 'Espresso',
          price: '$1.00',
          description: 'Double shot, La Marzocco',
        },
        {
          id: 'cappuccino',
          name: 'Cappuccino',
          price: '$1.75',
          description: 'Foamed milk, dusted with cocoa',
        },
        {
          id: 'cafe-latte',
          name: 'Café Latte',
          price: '$1.50',
          description: 'Steamed milk, single shot',
        },
        {
          id: 'mocha',
          name: 'Mocha',
          price: '$1.85',
          description: 'Espresso, chocolate, steamed milk',
        },
        {
          id: 'croissant',
          name: 'Croissant',
          price: '$1.25',
          description: 'Butter croissant, fresh-baked',
        },
        {
          id: 'muffin-blueberry',
          name: 'Blueberry Muffin',
          price: '$1.00',
          description: 'Large, with real blueberries',
        },
        {
          id: 'decaf',
          name: 'Decaf Coffee',
          price: '$0.85',
          description: 'Swiss Water Process',
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 5. MUSIC SOURCE — boombox on the counter playing synth-pop / early
    //    MTV hits (procedural "Neon Synthwave" track).
    // ───────────────────────────────────────────────────────────────────────
    musicSource: {
      model: 'boombox',
      trackId: '1985-synthwave-mtv',
      trackName: 'Neon Synthwave — Early MTV Hits',
      asset: {
        mesh: 'assets/1985/boombox.glb',
        texture: 'assets/1985/textures/boombox-chrome-silver.png',
        material: 'boombox-chrome-plastic',
      },
      audioUri: 'assets/audio/1985/music-1985.wav',
      volume: 0.5,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 6. WALL POSTERS — MTV-style and movie blockbuster posters, aerobics
    //    class flyer, and a neon-grid synthwave landscape print.
    // ───────────────────────────────────────────────────────────────────────
    wallPosters: [
      {
        id: 'poster-mtv-music-video',
        title: 'MTV Music Video Awards Promo',
        textureUri: 'assets/1985/textures/poster-mtv-awards.png',
        position: [-4.3, 2.0, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.9,
        height: 1.2,
      },
      {
        id: 'poster-movie-blockbuster',
        title: 'Summer Blockbuster Movie Poster',
        textureUri: 'assets/1985/textures/poster-blockbuster.png',
        position: [-4.3, 1.0, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.8,
        height: 1.1,
      },
      {
        id: 'poster-synthwave-grid',
        title: 'Neon Grid Synthwave Landscape',
        textureUri: 'assets/1985/textures/poster-neon-grid.png',
        position: [4.3, 1.0, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 1.0,
        height: 0.7,
      },
      {
        id: 'poster-aerobics-class',
        title: 'Aerobics Class — Tuesdays & Thursdays',
        textureUri: 'assets/1985/textures/poster-aerobics.png',
        position: [4.3, 2.2, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 0.7,
        height: 0.9,
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 7. TABLEWARE — branded ceramic mugs (glass rack), melamine plates,
    //    stainless-steel cutlery. Classic 80s diner-café tableware.
    // ───────────────────────────────────────────────────────────────────────
    tableware: {
      cupStyle: 'branded-ceramic-mug-1985',
      plateStyle: 'melamine-pastel-plate-1985',
      cutleryStyle: 'stainless-steel-heavy-1985',
      cupAsset: {
        mesh: 'assets/1985/branded-ceramic-mug.glb',
        texture: 'assets/1985/textures/mug-cafe-logo-1985.png',
      },
      plateAsset: {
        mesh: 'assets/1985/melamine-pastel-plate.glb',
        texture: 'assets/1985/textures/plate-pastel-mint.png',
      },
      cutleryAsset: {
        mesh: 'assets/1985/stainless-cutlery-set.glb',
        material: 'stainless-steel-polished',
      },
      material: 'ceramic-and-melamine',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 8. SIGNAGE — neon exterior and interior signs. 'ESPRESSO' in pink neon,
    //    'OPEN' in blue neon, 'Cappuccino' interior neon accent.
    // ───────────────────────────────────────────────────────────────────────
    signage: {
      exteriorType: 'neon',
      exteriorText: 'CAFÉ ESPRESSO',
      exteriorAsset: 'assets/1985/textures/exterior-neon-sign.png',
      interiorSigns: [
        {
          text: 'ESPRESSO',
          type: 'neon',
          asset: {
            mesh: 'assets/1985/neon-tube-espresso-interior.glb',
            texture: 'assets/1985/textures/neon-pink-glow.png',
          },
        },
        {
          text: 'OPEN',
          type: 'neon',
          asset: {
            mesh: 'assets/1985/neon-tube-open-interior.glb',
            texture: 'assets/1985/textures/neon-blue-glow.png',
          },
        },
        {
          text: 'Cappuccino · Latte · Mocha',
          type: 'printed',
          asset: {
            mesh: 'assets/1985/printed-menu-board.glb',
            texture: 'assets/1985/textures/menu-board-photocopied.png',
          },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 9. LIGHTING — brighter track-lighting with pink/neon accent strips.
    //    Cool-toned ambient with neon glow accents for the synthwave vibe.
    // ───────────────────────────────────────────────────────────────────────
    lighting: {
      ambientType: 'neon',
      ambientIntensity: 1.2,
      colorTemperature: 'cool',
      fixtures: [
        {
          type: 'track',
          asset: {
            mesh: 'assets/1985/track-light-head.glb',
            material: 'chrome-track-light',
          },
          position: [0, 3.0, 0.5],
          intensity: 1.3,
        },
        {
          type: 'track',
          asset: {
            mesh: 'assets/1985/track-light-head.glb',
            material: 'chrome-track-light',
          },
          position: [-2.5, 3.0, -1.0],
          intensity: 1.2,
        },
        {
          type: 'track',
          asset: {
            mesh: 'assets/1985/track-light-head.glb',
            material: 'chrome-track-light',
          },
          position: [2.5, 3.0, -2.5],
          intensity: 1.25,
        },
        {
          type: 'strip',
          asset: {
            mesh: 'assets/1985/neon-strip-pink.glb',
            texture: 'assets/1985/textures/neon-pink-strip.png',
          },
          position: [-4.3, 2.6, -3.9],
          intensity: 0.8,
        },
        {
          type: 'strip',
          asset: {
            mesh: 'assets/1985/neon-strip-cyan.glb',
            texture: 'assets/1985/textures/neon-cyan-strip.png',
          },
          position: [4.3, 2.6, -3.9],
          intensity: 0.8,
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 10. COUNTER TECH — electronic cash register with LCD display.
    //     Cash + magnetic-stripe credit cards.
    // ───────────────────────────────────────────────────────────────────────
    counterTech: {
      posType: 'electronic-register',
      posAsset: 'assets/1985/electronic-cash-register.glb',
      paymentMethods: 'Cash, credit card (magnetic stripe)',
      asset: {
        mesh: 'assets/1985/electronic-cash-register.glb',
        texture: 'assets/1985/textures/register-lcd-1985.png',
        material: 'beige-plastic-register',
      },
      position: [3.2, 0.95, -2.6],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 11. PATRONS — 1985-era outfits: shoulder pads, perms, Members Only
    //     jackets, high-top sneakers, Walkmans, power suits, leg warmers.
    //     At least 3 distinct patron models (acceptance criterion #5).
    // ───────────────────────────────────────────────────────────────────────
    patrons: {
      appearances: [
        {
          id: 'patron-yuppie-power-suit',
          outfit: 'power-suit-shoulder-pads-pinstripe',
          hairstyle: 'mullet-perm',
          gadgets: ['walkman', 'pager', 'rolex-gold'],
          asset: {
            mesh: 'assets/1985/patron-yuppie-power-suit.glb',
            texture: 'assets/1985/textures/patron-power-suit-grey.png',
          },
          position: [-0.8, 0, 1.2],
          rotation: [0, Math.PI, 0],
        },
        {
          id: 'patron-members-only-jacket',
          outfit: 'members-only-jacket-jeans-high-tops',
          hairstyle: 'side-ponytail-perm',
          gadgets: ['walkman', 'swatch-watch'],
          asset: {
            mesh: 'assets/1985/patron-members-only.glb',
            texture: 'assets/1985/textures/patron-members-only-tan.png',
          },
          position: [0.8, 0, 1.2],
          rotation: [0, Math.PI, 0],
        },
        {
          id: 'patron-aerobics-leg-warmers',
          outfit: 'leotard-leg-warmers-headband-sneakers',
          hairstyle: 'high-ponytail-perm-bangs',
          gadgets: ['walkman', 'scrunchie'],
          asset: {
            mesh: 'assets/1985/patron-aerobics.glb',
            texture: 'assets/1985/textures/patron-leotard-pink.png',
          },
          position: [-2.8, 0, -1.0],
          rotation: [0, 0.4, 0],
        },
        {
          id: 'patron-preppy-polo',
          outfit: 'polo-shirt-collared-up-chinos-deck-shoes',
          hairstyle: 'feathered-farrah-fawcett',
          gadgets: ['walkman', 'wayfarer-sunglasses'],
          asset: {
            mesh: 'assets/1985/patron-preppy-polo.glb',
            texture: 'assets/1985/textures/patron-polo-pastel.png',
          },
          position: [-1.0, 0, -0.3],
          rotation: [0, 0, 0],
        },
        {
          id: 'patron-miami-vice-blazer',
          outfit: 'pastel-blazer-tee-loafers-no-socks',
          hairstyle: 'slicked-back-perm',
          gadgets: ['walkman', 'pager', 'ray-ban-aviators'],
          asset: {
            mesh: 'assets/1985/patron-miami-vice.glb',
            texture: 'assets/1985/textures/patron-blazer-pastel-blue.png',
          },
          position: [2.3, 0, -2.2],
          rotation: [0, -Math.PI / 2, 0],
        },
      ],
      count: 8,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 12. SFX — ambient murmur, espresso hiss, cup clatter, plus the
    //     electronic register ding. Uses the shared license-cleared SFX
    //     library generated by scripts/generate-audio.py.
    // ───────────────────────────────────────────────────────────────────────
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
      murmurVolume: 0.35,
      machineHissVolume: 0.3,
      clatterVolume: 0.2,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 13. NAVIGATION HOTSPOTS — close-up camera anchors for the boombox,
    //     arcade cabinet, neon signage, espresso machine, and seating area.
    // ───────────────────────────────────────────────────────────────────────
    navigationHotspots: [
      {
        id: 'boombox-closeup',
        label: 'Boombox',
        cameraPosition: [2.8, 1.3, -1.5],
        lookAt: [2.2, 1.0, -2.5],
        fov: 35,
      },
      {
        id: 'arcade-cabinet-closeup',
        label: 'Arcade Cabinet',
        cameraPosition: [-2.5, 1.5, 2.5],
        lookAt: [-3.8, 1.2, 2.8],
        fov: 40,
      },
      {
        id: 'neon-espresso-sign-closeup',
        label: 'Neon "ESPRESSO" Sign',
        cameraPosition: [-3.0, 2.2, -2.5],
        lookAt: [-4.3, 2.4, -3.9],
        fov: 45,
      },
      {
        id: 'neon-open-sign-closeup',
        label: 'Neon "OPEN" Sign',
        cameraPosition: [3.0, 1.8, -2.5],
        lookAt: [4.3, 2.0, -3.9],
        fov: 45,
      },
      {
        id: 'espresso-machine-closeup',
        label: 'La Marzocco Espresso Machine',
        cameraPosition: [1.5, 1.4, -1.8],
        lookAt: [2.2, 0.95, -2.8],
        fov: 40,
      },
      {
        id: 'seating-area',
        label: 'Seating Area',
        cameraPosition: [-2, 1.6, 2],
        lookAt: [0, 0.5, 0.5],
        fov: 60,
      },
      {
        id: 'menu-board-closeup',
        label: 'Menu Board',
        cameraPosition: [1.8, 1.5, -1.5],
        lookAt: [3.0, 1.3, -2.6],
        fov: 45,
      },
    ],
  };

  validatePeriodPackage(pkg);
  return pkg;
}

export default { createPeriodPackage };
