/**
 * @file js/period1965.js
 * @description 1965 era pack — mod coffeehouse.
 *
 * Full period-accurate detail across all 11 user categories:
 *   furniture, decor, coffee machine, menu, music source, posters,
 *   tableware, signage, lighting, counter tech, patrons.
 *
 * Visual character: molded plywood chairs (Eames-style), Saarinen tulip
 * tables with Formica tops, vinyl booths with chrome trim, a Formica
 * service counter, a Faema E61 lever espresso machine (the iconic
 * continuous-delivery group head that revolutionised espresso), a
 * wall-mounted jukebox with a neon ring playing bossa nova and early
 * rock, a lava lamp on the counter, op-art and go-go-dancer posters
 * on the walls, pendant lights with brass cone shades, paper napkin
 * dispensers on every table, chrome-and-glass exterior signage, and
 * slightly cooler tungsten lighting warmed by the jukebox glow.
 *
 * Patrons wear mod shift dresses, black turtlenecks with Beatle-cut
 * hair, mini-skirts with go-go boots, and sharp Italian suits.
 *
 * Era modules are loaded dynamically via import() so heavy assets
 * (textures, audio) are code-split per era.
 *
 * Audio asset URIs align with the AudioManager's actual generated files
 * (see scripts/generate-audio.py and credits.md):
 *   - Music:  assets/audio/1965/music-1965.wav  ("Mod Coffeehouse")
 *   - SFX:    assets/audio/sfx/{murmur,espresso-hiss,cup-clatter,jukebox-clack}.wav
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 1965 mod coffeehouse PeriodPackage.
 *
 * Every category is populated with period-accurate, visually-distinct
 * content that differentiates this era from the 1945 post-war bar
 * (wooden furniture, chalkboard, wireless set) and the 1985 neon
 * synthwave café (glass tables, boombox, neon lighting).
 *
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 1965,
      name: 'Mod Coffeehouse',
      description:
        'A swinging mid-sixties mod coffeehouse with molded plywood '
        + 'furniture, a Faema E61 espresso machine, a neon-ringed '
        + 'jukebox playing bossa nova, op-art posters, and a printed '
        + 'menu priced in cents.',
    },

    // ─────────────────────────────────────────────────────────────────
    // FURNITURE — molded plywood chairs, tulip tables, vinyl booths,
    //             Formica counter, bar stools, napkin dispensers
    // (1945 uses heavy wooden chairs + formica tables — visually distinct)
    // (1985 uses glass-tubular tables — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    furniture: [
      {
        id: 'chair-plywood-molded-a',
        label: 'Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/1965/chair-plywood-molded.glb',
          material: 'walnut-veneer-chrome-legs',
        },
        position: [-1.6, 0, 0.5],
        rotation: [0, -0.3, 0],
      },
      {
        id: 'chair-plywood-molded-b',
        label: 'Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/1965/chair-plywood-molded.glb',
          material: 'walnut-veneer-chrome-legs',
        },
        position: [-1.6, 0, 2.0],
        rotation: [0, -2.8, 0],
      },
      {
        id: 'chair-plywood-molded-c',
        label: 'Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/1965/chair-plywood-molded.glb',
          material: 'walnut-veneer-chrome-legs',
        },
        position: [1.1, 0, 0.5],
        rotation: [0, 0.3, 0],
      },
      {
        id: 'chair-plywood-molded-d',
        label: 'Molded Plywood Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/1965/chair-plywood-molded.glb',
          material: 'walnut-veneer-chrome-legs',
        },
        position: [1.1, 0, 2.0],
        rotation: [0, 2.8, 0],
      },
      {
        id: 'table-tulip-a',
        label: 'Saarinen Tulip Table',
        type: 'table',
        asset: {
          mesh: 'assets/1965/table-tulip.glb',
          texture: 'assets/1965/textures/formica-tulip-white.png',
          material: 'formica-white-pedestal',
        },
        position: [-1.6, 0, 1.25],
      },
      {
        id: 'table-tulip-b',
        label: 'Saarinen Tulip Table',
        type: 'table',
        asset: {
          mesh: 'assets/1965/table-tulip.glb',
          texture: 'assets/1965/textures/formica-tulip-white.png',
          material: 'formica-white-pedestal',
        },
        position: [1.1, 0, 1.25],
      },
      {
        id: 'booth-vinyl-left',
        label: 'Vinyl Booth (Left)',
        type: 'bar',
        asset: {
          mesh: 'assets/1965/vinyl-booth.glb',
          material: 'orange-vinyl-chrome-trim',
        },
        position: [-3.2, 0, 1.5],
        rotation: [0, 1.57, 0],
      },
      {
        id: 'booth-vinyl-right',
        label: 'Vinyl Booth (Right)',
        type: 'bar',
        asset: {
          mesh: 'assets/1965/vinyl-booth.glb',
          material: 'orange-vinyl-chrome-trim',
        },
        position: [3.2, 0, 1.5],
        rotation: [0, -1.57, 0],
      },
      {
        id: 'counter-formica-service',
        label: 'Formica Service Counter',
        type: 'counter',
        asset: {
          mesh: 'assets/1965/counter-formica.glb',
          texture: 'assets/1965/textures/formica-counter-boomerang.png',
          material: 'formica-boomerang-chrome-edge',
        },
        position: [0, 0, -2.5],
      },
      {
        id: 'bar-stool-chrome-a',
        label: 'Chrome Swivel Bar Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/1965/bar-stool-chrome.glb',
          material: 'chrome-vinyl-seat-orange',
        },
        position: [1.5, 0, -1.8],
      },
      {
        id: 'bar-stool-chrome-b',
        label: 'Chrome Swivel Bar Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/1965/bar-stool-chrome.glb',
          material: 'chrome-vinyl-seat-orange',
        },
        position: [-1.5, 0, -1.8],
      },
      {
        id: 'napkin-dispenser-table-a',
        label: 'Paper Napkin Dispenser',
        type: 'counter',
        asset: { mesh: 'assets/1965/napkin-dispenser.glb', material: 'chrome' },
        position: [-1.6, 0.74, 1.25],
      },
      {
        id: 'napkin-dispenser-table-b',
        label: 'Paper Napkin Dispenser',
        type: 'counter',
        asset: { mesh: 'assets/1965/napkin-dispenser.glb', material: 'chrome' },
        position: [1.1, 0.74, 1.25],
      },
      {
        id: 'napkin-dispenser-counter',
        label: 'Paper Napkin Dispenser',
        type: 'counter',
        asset: { mesh: 'assets/1965/napkin-dispenser.glb', material: 'chrome' },
        position: [0.8, 0.95, -2.5],
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // DECOR — lava lamp, op-art prints, go-go boots wall art, jukebox
    //         neon ring glow, pendant shade, ashtray
    // (1945 uses ceiling fan + war posters — visually distinct)
    // (1985 uses neon tube signs — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    decor: [
      {
        id: 'lava-lamp-counter',
        label: 'Lava Lamp',
        category: 'fixture',
        asset: {
          mesh: 'assets/1965/lava-lamp.glb',
          material: 'orange-wax-blue-liquid',
        },
        position: [-0.8, 0.95, -2.5],
      },
      {
        id: 'op-art-print-left',
        label: 'Op-Art Print (Bridget Riley-style)',
        category: 'artwork',
        asset: {
          mesh: 'assets/1965/framed-print.glb',
          texture: 'assets/1965/textures/op-art-black-white.png',
        },
        position: [-3.5, 2.2, -4],
      },
      {
        id: 'op-art-print-right',
        label: 'Op-Art Print (Vasarely-style)',
        category: 'artwork',
        asset: {
          mesh: 'assets/1965/framed-print.glb',
          texture: 'assets/1965/textures/op-art-concentric.png',
        },
        position: [3.5, 2.2, -4],
      },
      {
        id: 'go-go-dancers-poster',
        label: 'Go-Go Dancers Poster',
        category: 'artwork',
        asset: {
          mesh: 'assets/1965/framed-poster.glb',
          texture: 'assets/1965/textures/poster-go-go-dancers.png',
        },
        position: [0, 2.3, -4],
      },
      {
        id: 'go-go-boots-wall-art',
        label: 'Go-Go Boots Wall Art',
        category: 'artwork',
        asset: {
          mesh: 'assets/1965/wall-sculpture-boots.glb',
          material: 'chrome-white-vinyl',
        },
        position: [-3.5, 1.0, -4],
      },
      {
        id: 'pendant-shade-brass-decor',
        label: 'Brass Pendant Shade',
        category: 'fixture',
        asset: {
          mesh: 'assets/1965/pendant-shade.glb',
          material: 'brass-cone-enamel',
        },
        position: [0, 2.8, 0],
      },
      {
        id: 'jukebox-neon-ring',
        label: 'Jukebox Neon Ring Glow',
        category: 'fixture',
        asset: {
          mesh: 'assets/1965/jukebox-neon-ring.glb',
          material: 'neon-tube-blue-pink',
        },
        position: [-2.8, 1.6, -3.8],
      },
      {
        id: 'ashtray-chrome-counter',
        label: 'Chrome Ashtray',
        category: 'misc',
        asset: { mesh: 'assets/1965/ashtray.glb', material: 'chrome' },
        position: [0.4, 0.95, -2.5],
      },
      {
        id: 'ashtray-table-a',
        label: 'Chrome Ashtray',
        category: 'misc',
        asset: { mesh: 'assets/1965/ashtray.glb', material: 'chrome' },
        position: [-1.4, 0.74, 1.25],
      },
      {
        id: 'ashtray-table-b',
        label: 'Chrome Ashtray',
        category: 'misc',
        asset: { mesh: 'assets/1965/ashtray.glb', material: 'chrome' },
        position: [1.3, 0.74, 1.25],
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // COFFEE MACHINE — Faema E61 (1961, continuous-delivery group head)
    //   The E61 revolutionised espresso with its thermosiphon group head
    //   that kept water at brewing temperature continuously. Its iconic
    //   silhouette — cylindrical body, dual pressure gauges, lever arm,
    //   and steam wand — defines the 1960s espresso bar.
    // (1945 uses Gaggia lever without steam wand — visually distinct)
    // (1985 uses La Marzocco GS automatic — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    coffeeMachine: {
      id: 'faema-e61-1965',
      type: 'lever-espresso',
      brand: 'Faema E61',
      asset: {
        mesh: 'assets/1965/faema-e61.glb',
        material: 'chrome-stainless-panel-gauges',
      },
      position: [-0.4, 0.95, -2.5],
      hasSteamWand: true,
      brewAnimation: 'assets/1965/anims/lever-pull-e61.json',
      hissSound: 'assets/audio/sfx/espresso-hiss.wav',
    },

    // ─────────────────────────────────────────────────────────────────
    // MENU — printed board with 1965 prices
    //   Espresso was typically 25–30¢, cappuccino 35¢ in mid-60s US
    //   coffee houses. Prices reflect the Beat/bohemian coffee-house era.
    // (1945 uses chalkboard at 5–10¢ — visually distinct)
    // (1985 uses printed at $0.75+ — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    menu: {
      boardType: 'printed',
      boardAsset: 'assets/1965/textures/printed-menu-board.png',
      items: [
        { id: 'espresso', name: 'Espresso', price: '25¢', description: 'Single Faema E61 pull' },
        { id: 'cappuccino', name: 'Cappuccino', price: '35¢', description: 'Espresso with steamed milk foam' },
        { id: 'coffee', name: 'Drip Coffee', price: '20¢', description: 'Bottomless cup' },
        { id: 'cafe-au-lait', name: 'Café au Lait', price: '30¢', description: 'Coffee with hot milk' },
        { id: 'hot-chocolate', name: 'Hot Chocolate', price: '25¢', description: 'Steamed milk and cocoa' },
        { id: 'tea', name: 'Tea', price: '15¢', description: 'Pot of Earl Grey or Darjeeling' },
        { id: 'pastry-danish', name: 'Cheese Danish', price: '30¢', description: 'Fresh from the bakery' },
        { id: 'pastry-cheesecake', name: 'Cheesecake Slice', price: '40¢', description: 'New York style' },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // MUSIC SOURCE — wall-mounted jukebox with neon ring
    //   Plays bossa nova and early rock (British Invasion jangle).
    //   The jukebox has a visible neon ring, bubbling tubes, and
    //   chrome trim. On selection it plays the 1965 music track.
    // (1945 uses a Bakelite wireless set — visually distinct)
    // (1985 uses a boombox — visually distinct)
    //
    // audioUri points to the actual generated music track
    // (assets/audio/1965/music-1965.wav — "Mod Coffeehouse") so the
    // PeriodManager adapter / AudioManager can play it on slider select.
    // ─────────────────────────────────────────────────────────────────
    musicSource: {
      model: 'jukebox',
      trackId: '1965-mod-coffeehouse',
      trackName: 'Mod Coffeehouse',
      asset: {
        mesh: 'assets/1965/wall-jukebox.glb',
        material: 'chrome-neon-blue-pink-bubble-tubes',
      },
      audioUri: 'assets/audio/1965/music-1965.wav',
      volume: 0.5,
    },
    // ─────────────────────────────────────────────────────────────────
    // WALL POSTERS — op-art, go-go dancers, coffee-import ads
    //   Mid-60s coffee houses displayed vibrant geometric op-art,
    //   go-go dancer promotional posters, and coffee-import ads.
    // (1945 uses war-bond / victory / rationing posters — visually distinct)
    // (1985 uses movie blockbuster posters — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    wallPosters: [
      {
        id: 'poster-op-art-bridget-riley',
        title: 'Op-Art — Black & White Stripes (Bridget Riley)',
        textureUri: 'assets/1965/textures/poster-op-art-bridget-riley.png',
        position: [-3.5, 2.2, -4],
        width: 1.2,
        height: 1.6,
      },
      {
        id: 'poster-go-go-dancers',
        title: 'Go-Go Dancers Night — Every Friday',
        textureUri: 'assets/1965/textures/poster-go-go-dancers.png',
        position: [0, 2.3, -4],
        width: 1.4,
        height: 1.0,
      },
      {
        id: 'poster-coffee-import-ad',
        title: 'Imported Coffee — Direct from Brazil',
        textureUri: 'assets/1965/textures/poster-coffee-import.png',
        position: [3.5, 2.2, -4],
        width: 1.2,
        height: 1.6,
      },
      {
        id: 'poster-bossa-nova-night',
        title: 'Bossa Nova Night — Live Music Saturday',
        textureUri: 'assets/1965/textures/poster-bossa-nova.png',
        position: [-3.5, 1.0, -4],
        width: 0.9,
        height: 1.2,
      },
    ],

    // ─────────────────────────────────────────────────────────────────
    // TABLEWARE — melamine cups and plates, stainless steel cutlery
    //   Melamine dinnerware was ubiquitous in mid-60s diners and
    //   coffee houses — durable, colorful, and unbreakable.
    // (1945 uses enamel mugs/plates — visually distinct)
    // (1985 uses ceramic mugs — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    tableware: {
      cupStyle: 'melamine-cup-mod-orange',
      plateStyle: 'melamine-plate-mod-yellow',
      cutleryStyle: 'stainless-steel-mod',
      cupAsset: { mesh: 'assets/1965/melamine-cup.glb', material: 'melamine-orange' },
      plateAsset: { mesh: 'assets/1965/melamine-plate.glb', material: 'melamine-yellow' },
      cutleryAsset: { mesh: 'assets/1965/cutlery-stainless.glb', material: 'stainless-steel-brushed' },
      material: 'melamine',
    },

    // ─────────────────────────────────────────────────────────────────
    // SIGNAGE — chrome-and-glass exterior sign, printed interior signs
    //   Mid-60s coffee houses used sleek chrome-and-glass signage
    //   with sans-serif lettering, reflecting the Space Age aesthetic.
    // (1945 uses hand-painted exterior — visually distinct)
    // (1985 uses neon exterior — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    signage: {
      exteriorType: 'vinyl',
      exteriorText: 'THE COFFEE HOUSE',
      exteriorAsset: 'assets/1965/textures/sign-exterior-chrome-glass.png',
      interiorSigns: [
        {
          text: 'Today\'s Special — Cappuccino 35¢',
          type: 'printed',
          asset: { mesh: 'assets/1965/specials-printed-board.glb' },
        },
        {
          text: 'Jukebox — 5¢ per play',
          type: 'printed',
          asset: { mesh: 'assets/1965/sign-jukebox-price.glb' },
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // LIGHTING — slightly cooler tungsten with jukebox glow
    //   Mid-60s coffee houses had pendant lights with brass cone
    //   shades — slightly cooler than the warm 1945 tungsten, but
    //   warmed by the colorful glow of the jukebox neon ring.
    //   No flicker (unlike 1945); instead a steady jukebox glow.
    // (1945 uses warm tungsten 0.7 with flicker — visually distinct)
    // (1985 uses neon 1.2 intensity — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    lighting: {
      ambientType: 'tungsten',
      ambientIntensity: 0.9,
      colorTemperature: 'neutral',
      accentGlow: {
        enabled: true,
        type: 'jukebox-neon',
        color: '#4a90d9',
        intensity: 0.3,
      },
      fixtures: [
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/1965/pendant-light.glb',
            material: 'brass-cone-enamel-shade',
          },
          position: [0, 2.8, 0],
          intensity: 1.0,
          color: '#ffe8c0',
        },
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/1965/pendant-light.glb',
            material: 'brass-cone-enamel-shade',
          },
          position: [-2.2, 2.8, 1.0],
          intensity: 0.7,
          color: '#ffe8c0',
        },
        {
          type: 'pendant',
          asset: {
            mesh: 'assets/1965/pendant-light.glb',
            material: 'brass-cone-enamel-shade',
          },
          position: [2.2, 2.8, 1.0],
          intensity: 0.7,
          color: '#ffe8c0',
        },
        {
          type: 'sconce',
          asset: {
            mesh: 'assets/1965/wall-sconce.glb',
            material: 'chrome-frosted-glass',
          },
          position: [-3.5, 2.2, -3.9],
          intensity: 0.4,
          color: '#fff0d0',
        },
        {
          type: 'sconce',
          asset: {
            mesh: 'assets/1965/wall-sconce.glb',
            material: 'chrome-frosted-glass',
          },
          position: [3.5, 2.2, -3.9],
          intensity: 0.4,
          color: '#fff0d0',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────
    // COUNTER TECH — mechanical cash register
    //   Mid-60s coffee houses used mechanical lever registers (e.g.
    //   National Cash Register models) with pop-up amount displays.
    //   Cash only; no electronic POS yet.
    // (1945 uses a manual brass-bell till — visually distinct)
    // (1985 uses an electronic register with magnetic stripe — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    counterTech: {
      posType: 'mechanical-register',
      paymentMethods: 'Cash only',
      asset: {
        mesh: 'assets/1965/mechanical-register.glb',
        material: 'chrome-black-body-pop-up-numbers',
      },
      position: [1.2, 0.95, -2.5],
      bellSound: 'assets/audio/sfx/register-ding.wav',
    },

    // ─────────────────────────────────────────────────────────────────
    // PATRONS — at least 3 with 1965-appropriate mod outfits,
    //           hairstyles, and props:
    //   1. Mod girl in a shift dress with pixie cut (Twiggy-style)
    //   2. Beatle-cut man in black turtleneck (Beatnik/mod)
    //   3. Go-go dancer in mini-skirt and white go-go boots
    //   4. Sharp Italian-suited man with side-parted hair
    // (1945 has fedora businessmen, victory-rolls women — visually distinct)
    // (1985 has yuppies with mullets and shoulder pads — visually distinct)
    // ─────────────────────────────────────────────────────────────────
    patrons: {
      appearances: [
        {
          id: 'patron-mod-girl-shift-dress',
          outfit: 'geometric-shift-dress-white-go-go-boots',
          hairstyle: 'pixie-cut-eyeliner',
          gadgets: ['cigarette-case', 'compact-mirror'],
          asset: { mesh: 'assets/1965/patron-mod-girl.glb' },
          position: [-1.6, 0, 0.8],
          rotation: [0, -0.3, 0],
        },
        {
          id: 'patron-beatle-cut-turtleneck',
          outfit: 'black-turtleneck-slim-trousers-winkle-pickers',
          hairstyle: 'beatle-cut-mop-top',
          gadgets: ['paperback-novel', 'cigarette'],
          asset: { mesh: 'assets/1965/patron-beatnik.glb' },
          position: [1.1, 0, 0.8],
          rotation: [0, 0.3, 0],
        },
        {
          id: 'patron-go-go-dancer',
          outfit: 'mini-skirt-turtle-neck-white-go-go-boots',
          hairstyle: 'high-ponytail-flip',
          gadgets: ['cigarette-case'],
          asset: { mesh: 'assets/1965/patron-go-go-dancer.glb' },
          position: [1.5, 0, -1.8],
          rotation: [0, 1.5, 0],
        },
        {
          id: 'patron-italian-suit',
          outfit: 'slim-italian-suit-narrow-tie-pointy-collars',
          hairstyle: 'side-parted-pomade',
          gadgets: ['folded-newspaper', 'cigarette-case'],
          asset: { mesh: 'assets/1965/patron-italian-suit.glb' },
          position: [-1.6, 0, 2.2],
          rotation: [0, -2.8, 0],
        },
      ],
      count: 6,
    },

    // ─────────────────────────────────────────────────────────────────
    // SFX — jukebox mechanism clack, espresso pull hiss, bossa nova
    //       music from jukebox, conversation murmur, cup clatter
    // URIs align with actual AudioManager generated assets.
    // ─────────────────────────────────────────────────────────────────
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
      jukeboxClack: 'assets/audio/sfx/jukebox-clack.wav',
      murmurVolume: 0.35,
      machineHissVolume: 0.3,
      clatterVolume: 0.2,
      jukeboxClackVolume: 0.4,
    },

    // ─────────────────────────────────────────────────────────────────
    // NAVIGATION HOTSPOTS — camera anchor points for close-up viewing
    // ─────────────────────────────────────────────────────────────────
    navigationHotspots: [
      {
        id: 'jukebox-closeup',
        label: 'Jukebox & Neon Ring',
        cameraPosition: [-1.8, 1.6, -2.5],
        lookAt: [-2.8, 1.6, -3.8],
        fov: 40,
      },
      {
        id: 'espresso-machine-closeup',
        label: 'Faema E61 Espresso Machine',
        cameraPosition: [-0.2, 1.6, -1.5],
        lookAt: [-0.4, 0.95, -2.5],
        fov: 45,
      },
      {
        id: 'lava-lamp-closeup',
        label: 'Lava Lamp',
        cameraPosition: [-1.4, 1.5, -1.8],
        lookAt: [-0.8, 0.95, -2.5],
        fov: 35,
      },
      {
        id: 'seating-area',
        label: 'Seating Area & Booths',
        cameraPosition: [-2.5, 1.7, 3.0],
        lookAt: [0, 0.5, 1.25],
        fov: 60,
      },
      {
        id: 'wall-art-closeup',
        label: 'Op-Art & Go-Go Posters',
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
