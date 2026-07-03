/**
 * @file js/period2025.js
 * @description 2025 era pack — modern specialty café.
 *
 * Full-detail PeriodPackage for the 2025 era: minimalist plywood + matte-black
 * furniture on a terrazzo floor, a slat-wall with single-origin posters, a
 * modern multi-group espresso machine alongside an automated pour-over
 * (Marco brew system), a QR-code menu on a tablet stand, plant-based / oat
 * milk options, patrons in athleisure / streetwear with AirPods / laptops /
 * phones-as-payment, soft warm LED lighting with screen-glow accents, a
 * contactless payment terminal on the counter, QR-code wall stickers, and a
 * vegan pastry case.
 *
 * All 11 user categories are populated with period-accurate detail and are
 * visually distinct from the 2005 (third-wave indie) era.
 *
 * Era modules are loaded dynamically via import() so heavy assets
 * (textures, audio) are code-split per era.
 *
 * Audio asset URIs align with the AudioManager's actual generated files
 * (see scripts/generate-audio.py and credits.md):
 *   - Music:  assets/audio/2025/music-2025.wav  ("Modern Ambient")
 *   - SFX:    assets/audio/sfx/{murmur,espresso-hiss,cup-clatter,register-ding}.wav
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/**
 * Create the 2025 modern specialty café PeriodPackage.
 *
 * Every category is populated with period-accurate, visually-distinct
 * content that differentiates this era from the 2005 third-wave indie café.
 *
 * @returns {PeriodPackage}
 */
export function createPeriodPackage() {
  const pkg = {
    meta: {
      year: 2025,
      name: 'Modern Specialty Café',
      description:
        'A sleek modern specialty café with minimalist plywood and matte-black '
        + 'furniture on a terrazzo floor, a multi-group espresso machine and '
        + 'automated Marco pour-over system, a QR-code menu on a tablet stand, '
        + 'oat and plant-based milk options, a phone streaming to a bluetooth '
        + 'speaker, warm LED lighting with screen-glow accents, and a '
        + 'contactless payment terminal. Patrons in athleisure and streetwear '
        + 'tap to pay with phones while wearing AirPods.',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 1. FURNITURE — minimalist plywood + matte-black furniture, terrazzo
    //    floor, slat-wall counter, tablet-stand menu, vegan pastry case.
    //    (2005 used reclaimed-wood communal tables + live-edge counter —
    //    2025 is minimalist, matte, and engineered.)
    // ───────────────────────────────────────────────────────────────────────
    furniture: [
      {
        id: 'table-plywood-minimalist-a',
        label: 'Minimalist Plywood Table',
        type: 'table',
        asset: {
          mesh: 'assets/2025/plywood-table-minimalist.glb',
          texture: 'assets/2025/textures/birch-plywood-diffuse.png',
          roughnessMap: 'assets/2025/textures/birch-plywood-roughness.png',
          material: 'birch-plywood-matte-clearcoat',
        },
        position: [-1.5, 0, 0.5],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      {
        id: 'table-plywood-minimalist-b',
        label: 'Minimalist Plywood Table',
        type: 'table',
        asset: {
          mesh: 'assets/2025/plywood-table-minimalist.glb',
          texture: 'assets/2025/textures/birch-plywood-diffuse.png',
          roughnessMap: 'assets/2025/textures/birch-plywood-roughness.png',
          material: 'birch-plywood-matte-clearcoat',
        },
        position: [1.5, 0, 0.5],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      {
        id: 'chair-matte-black-cantilever-a',
        label: 'Matte-Black Cantilever Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2025/chair-matte-black-cantilever.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [-2.2, 0, 0.5],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'chair-matte-black-cantilever-b',
        label: 'Matte-Black Cantilever Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2025/chair-matte-black-cantilever.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [-0.8, 0, 0.5],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'chair-matte-black-cantilever-c',
        label: 'Matte-Black Cantilever Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2025/chair-matte-black-cantilever.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [0.8, 0, 0.5],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'chair-matte-black-cantilever-d',
        label: 'Matte-Black Cantilever Chair',
        type: 'chair',
        asset: {
          mesh: 'assets/2025/chair-matte-black-cantilever.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [2.2, 0, 0.5],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'counter-slat-wall-plywood',
        label: 'Plywood Slat-Wall Counter',
        type: 'counter',
        asset: {
          mesh: 'assets/2025/slat-wall-counter.glb',
          texture: 'assets/2025/textures/birch-plywood-diffuse.png',
          material: 'birch-plywood-slat-matte',
        },
        position: [2.5, 0, -2.8],
        rotation: [0, 0, 0],
        scale: 1.0,
      },
      {
        id: 'shelf-slat-wall-back',
        label: 'Slat-Wall Shelving (Back Wall)',
        type: 'shelf',
        asset: {
          mesh: 'assets/2025/slat-wall-shelf.glb',
          texture: 'assets/2025/textures/birch-plywood-diffuse.png',
          material: 'birch-plywood-slat-matte',
        },
        position: [0, 1.5, -4.0],
        rotation: [0, 0, 0],
      },
      {
        id: 'stool-matte-black-counter-a',
        label: 'Matte-Black Counter Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/2025/stool-matte-black.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [1.8, 0, -1.8],
      },
      {
        id: 'stool-matte-black-counter-b',
        label: 'Matte-Black Counter Stool',
        type: 'stool',
        asset: {
          mesh: 'assets/2025/stool-matte-black.glb',
          material: 'matte-black-powder-coated-steel',
        },
        position: [3.2, 0, -1.8],
      },
      {
        id: 'tablet-stand-qr-menu',
        label: 'QR-Code Menu Tablet Stand',
        type: 'bar',
        asset: {
          mesh: 'assets/2025/tablet-stand-qr-menu.glb',
          texture: 'assets/2025/textures/qr-menu-tablet-screen.png',
          material: 'matte-black-aluminum-stand',
        },
        position: [3.8, 0, -2.5],
        rotation: [0, -Math.PI / 4, 0],
      },
      {
        id: 'pastry-case-vegan-glass',
        label: 'Vegan Pastry Case (Glass)',
        type: 'counter',
        asset: {
          mesh: 'assets/2025/vegan-pastry-case.glb',
          texture: 'assets/2025/textures/pastry-case-glass.png',
          material: 'glass-brushed-aluminum-frame',
        },
        position: [1.2, 0.95, -2.5],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 2. DECOR — terrazzo floor, living green wall, slat-wall back panel,
    //    QR-code wall stickers, potted monstera, minimalist art prints.
    //    (2005 used exposed brick + Edison bulbs + burlap sacks — 2025 is
    //    clean, green, and digital.)
    // ───────────────────────────────────────────────────────────────────────
    decor: [
      {
        id: 'terrazzo-floor',
        label: 'Terrazzo Floor',
        category: 'misc',
        asset: {
          mesh: 'assets/2025/terrazzo-floor-plane.glb',
          texture: 'assets/2025/textures/terrazzo-diffuse.png',
          normalMap: 'assets/2025/textures/terrazzo-normal.png',
          roughnessMap: 'assets/2025/textures/terrazzo-roughness.png',
        },
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      {
        id: 'living-green-wall',
        label: 'Living Green Wall',
        category: 'plant',
        asset: {
          mesh: 'assets/2025/living-wall.glb',
          texture: 'assets/2025/textures/living-wall-diffuse.png',
        },
        position: [-4.5, 2.0, -4.0],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'slat-wall-back-panel',
        label: 'Birch Slat-Wall Back Panel',
        category: 'misc',
        asset: {
          mesh: 'assets/2025/slat-wall-panel.glb',
          texture: 'assets/2025/textures/birch-plywood-diffuse.png',
        },
        position: [0, 2.0, -4.1],
        rotation: [0, 0, 0],
      },
      {
        id: 'potted-monstera',
        label: 'Potted Monstera Plant',
        category: 'plant',
        asset: { mesh: 'assets/2025/monstera-pot.glb' },
        position: [4.2, 0, -3.0],
      },
      {
        id: 'hanging-pothos-modern',
        label: 'Hanging Pothos (Modern Planter)',
        category: 'plant',
        asset: { mesh: 'assets/2025/hanging-pothos-modern.glb' },
        position: [-2.0, 2.8, 1.0],
      },
      {
        id: 'qr-code-wall-sticker-menu',
        label: 'QR-Code Wall Sticker — Menu',
        category: 'misc',
        asset: {
          mesh: 'assets/2025/qr-sticker.glb',
          texture: 'assets/2025/textures/qr-menu-sticker.png',
        },
        position: [3.8, 1.5, -3.9],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'qr-code-wall-sticker-wifi',
        label: 'QR-Code Wall Sticker — Wi-Fi',
        category: 'misc',
        asset: {
          mesh: 'assets/2025/qr-sticker.glb',
          texture: 'assets/2025/textures/qr-wifi-sticker.png',
        },
        position: [3.8, 1.1, -3.9],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        id: 'minimalist-art-print-abstract',
        label: 'Minimalist Abstract Art Print',
        category: 'artwork',
        asset: {
          mesh: 'assets/2025/art-print-frame.glb',
          texture: 'assets/2025/textures/art-abstract-minimal.png',
        },
        position: [-3.8, 2.2, -3.9],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        id: 'led-strip-ceiling-recessed',
        label: 'Recessed LED Strip Ceiling',
        category: 'fixture',
        asset: { mesh: 'assets/2025/led-strip-recessed.glb' },
        position: [0, 3.0, 0],
        rotation: [0, 0, 0],
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 3. COFFEE MACHINE — modern multi-group espresso machine (La Marzocco
    //    Linea PB) plus an automated pour-over system (Marco Beveridge
    //    brew system). Both sit on the slat-wall counter.
    //    (2005 used a Slayer single-group + manual Hario V60 — 2025 is
    //    multi-group + automated batch brew.)
    // ───────────────────────────────────────────────────────────────────────
    coffeeMachine: {
      id: 'lamarzocco-linea-pb-multi-2025',
      type: 'auto-espresso',
      brand: 'La Marzocco Linea PB Multi-Group',
      asset: {
        mesh: 'assets/2025/lamarzocco-linea-pb.glb',
        material: 'stainless-steel-polished-red-panels',
      },
      position: [2.2, 0.95, -2.8],
      hasSteamWand: true,
      brewAnimation: 'assets/2025/anims/linea-pb-extraction.json',
      hissSound: 'assets/audio/sfx/espresso-hiss.wav',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 4. MENU — digital / QR-code menu on a tablet stand. 2025 specialty
    //    café pricing with oat and plant-based milk options.
    //    (2005 used a chalkboard with $2.50–$4.50 prices — 2025 is higher
    //    pricing, digital board, and alternative milks.)
    // ───────────────────────────────────────────────────────────────────────
    menu: {
      boardType: 'digital',
      boardAsset: 'assets/2025/textures/menu-tablet-digital-2025.png',
      items: [
        {
          id: 'cortado',
          name: 'Cortado',
          price: '$4.50',
          description: 'Double ristretto, warm milk, 4oz glass',
        },
        {
          id: 'oat-latte',
          name: 'Oat Latte',
          price: '$5.25',
          description: 'Oatly barista edition, single origin espresso',
        },
        {
          id: 'matcha',
          name: 'Matcha',
          price: '$5.50',
          description: 'Ceremonial-grade, oat milk, iced or hot',
        },
        {
          id: 'pourover',
          name: 'Pour-Over',
          price: '$6.00',
          description: 'Marco automated brew, rotating single origin',
        },
        {
          id: 'flat-white',
          name: 'Flat White',
          price: '$4.75',
          description: 'Double ristretto, microfoam, 5oz',
        },
        {
          id: 'cold-brew-nitro',
          name: 'Nitro Cold Brew',
          price: '$5.75',
          description: '17-hour steep, nitrogen infused, on tap',
        },
        {
          id: 'oat-milk-cappuccino',
          name: 'Oat Milk Cappuccino',
          price: '$5.00',
          description: 'Oat milk, dense microfoam, 5oz',
        },
        {
          id: 'vegan-pastry',
          name: 'Vegan Pastry',
          price: '$4.25',
          description: 'Selection from the case — plant-based',
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 5. MUSIC SOURCE — a smartphone streaming to a bluetooth speaker
    //    (Sonos One-style), playing the 2025 modern ambient track.
    //    (2005 used an iPod in a speaker dock — 2025 uses a phone +
    //    wireless speaker.)
    // ───────────────────────────────────────────────────────────────────────
    musicSource: {
      model: 'phone',
      trackId: '2025-modern-ambient',
      trackName: 'Modern Ambient',
      asset: {
        mesh: 'assets/2025/phone-bluetooth-speaker.glb',
        texture: 'assets/2025/textures/phone-screen-streaming.png',
      },
      audioUri: 'assets/audio/2025/music-2025.wav',
      volume: 0.35,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 6. WALL POSTERS — single-origin origin posters on the slat-wall,
    //    sustainability / compostable signage, and a QR-code loyalty poster.
    //    (2005 used framed vinyl album art + show flyers — 2025 uses
    //    origin story posters and QR codes.)
    // ───────────────────────────────────────────────────────────────────────
    wallPosters: [
      {
        id: 'poster-single-origin-ethiopia',
        title: 'Single Origin — Ethiopia Guji',
        textureUri: 'assets/2025/textures/poster-origin-ethiopia.png',
        position: [-3.5, 2.2, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.7,
        height: 1.0,
      },
      {
        id: 'poster-single-origin-colombia',
        title: 'Single Origin — Colombia Huila',
        textureUri: 'assets/2025/textures/poster-origin-colombia.png',
        position: [-3.5, 1.1, -3.9],
        rotation: [0, Math.PI / 2, 0],
        width: 0.7,
        height: 1.0,
      },
      {
        id: 'poster-compostable-sustainability',
        title: '100% Compostable Cups',
        textureUri: 'assets/2025/textures/poster-compostable.png',
        position: [3.8, 2.2, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 0.6,
        height: 0.8,
      },
      {
        id: 'poster-qr-loyalty',
        title: 'Scan for Loyalty Rewards',
        textureUri: 'assets/2025/textures/poster-qr-loyalty.png',
        position: [3.8, 1.1, -3.9],
        rotation: [0, -Math.PI / 2, 0],
        width: 0.5,
        height: 0.5,
      },
    ],

    // ───────────────────────────────────────────────────────────────────────
    // 7. TABLEWARE — double-walled borosilicate glass cups, minimalist
    //    ceramic plates, reusable / compostable cutlery.
    //    (2005 used paper to-go cups + handmade stoneware — 2025 uses
    //    reusable glass and compostable everything.)
    // ───────────────────────────────────────────────────────────────────────
    tableware: {
      cupStyle: 'double-walled-borosilicate-glass-2025',
      plateStyle: 'minimalist-ceramic-plate-matte-white',
      cutleryStyle: 'compostable-wooden-cutlery',
      cupAsset: {
        mesh: 'assets/2025/double-glass-cup.glb',
        material: 'borosilicate-glass-clear',
      },
      plateAsset: {
        mesh: 'assets/2025/ceramic-plate-minimalist.glb',
        texture: 'assets/2025/textures/matte-white-ceramic.png',
      },
      cutleryAsset: {
        mesh: 'assets/2025/compostable-cutlery-set.glb',
      },
      material: 'borosilicate-glass-and-matte-ceramic',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 8. SIGNAGE — LED exterior sign, digital interior displays, and a
    //    'Tap to Pay' contactless decal.
    //    (2005 used a hand-painted sign + chalkboards — 2025 uses LED
    //    and digital displays.)
    // ───────────────────────────────────────────────────────────────────────
    signage: {
      exteriorType: 'led',
      exteriorText: 'SPECIALTY COFFEE',
      exteriorAsset: 'assets/2025/textures/exterior-sign-led.png',
      interiorSigns: [
        {
          text: 'Scan QR for Menu',
          type: 'digital',
          asset: {
            mesh: 'assets/2025/qr-menu-display.glb',
            texture: 'assets/2025/textures/qr-menu-screen.png',
          },
        },
        {
          text: 'Today\'s Single Origin: Ethiopia Guji Natural',
          type: 'digital',
          asset: {
            mesh: 'assets/2025/origin-digital-display.glb',
            texture: 'assets/2025/textures/origin-digital-screen.png',
          },
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 9. LIGHTING — warm LED with screen-glow accents. Not tungsten.
    //    Recessed LED strips provide soft ambient, while device screens
    //    (tablets, phones, laptops, the POS terminal) add cool screen-glow
    //    accents. (2005 used warm Edison-bulb pendants — 2025 uses
    //    recessed LED strips + screen glow.)
    // ───────────────────────────────────────────────────────────────────────
    lighting: {
      ambientType: 'warm-led',
      ambientIntensity: 1.1,
      colorTemperature: 'warm',
      fixtures: [
        {
          type: 'strip',
          asset: { mesh: 'assets/2025/led-strip-recessed.glb' },
          position: [0, 3.0, 0],
          intensity: 1.0,
        },
        {
          type: 'strip',
          asset: { mesh: 'assets/2025/led-strip-recessed.glb' },
          position: [-2.5, 3.0, -1.0],
          intensity: 0.85,
        },
        {
          type: 'strip',
          asset: { mesh: 'assets/2025/led-strip-recessed.glb' },
          position: [2.5, 3.0, -2.5],
          intensity: 0.9,
        },
        {
          type: 'sconce',
          asset: { mesh: 'assets/2025/led-sconce-minimal.glb' },
          position: [-4.4, 2.0, -3.5],
          intensity: 0.5,
        },
        {
          type: 'sconce',
          asset: { mesh: 'assets/2025/led-sconce-minimal.glb' },
          position: [4.4, 2.0, -3.5],
          intensity: 0.5,
        },
        {
          type: 'strip',
          asset: {
            mesh: 'assets/2025/screen-glow-tablet.glb',
            texture: 'assets/2025/textures/tablet-screen-glow.png',
          },
          position: [3.8, 1.2, -2.5],
          intensity: 0.3,
        },
        {
          type: 'strip',
          asset: {
            mesh: 'assets/2025/screen-glow-pos.glb',
            texture: 'assets/2025/textures/pos-screen-glow.png',
          },
          position: [3.5, 1.0, -2.6],
          intensity: 0.25,
        },
        {
          type: 'strip',
          asset: {
            mesh: 'assets/2025/screen-glow-laptop.glb',
            texture: 'assets/2025/textures/laptop-screen-glow.png',
          },
          position: [-1.5, 0.8, 0.5],
          intensity: 0.35,
        },
      ],
    },

    // ───────────────────────────────────────────────────────────────────────
    // 10. COUNTER TECH — contactless payment terminal (tap to pay with
    //     phone / watch / card). Triggers a 'beep' SFX on tap.
    //     (2005 used a dual-monitor touchscreen POS with mag-stripe cards —
    //     2025 uses contactless / NFC with Apple Pay, Google Pay, and cards.)
    // ───────────────────────────────────────────────────────────────────────
    counterTech: {
      posType: 'contactless',
      posAsset: 'assets/2025/contactless-terminal.glb',
      paymentMethods: 'Contactless (Apple Pay, Google Pay, tap card), phone-as-payment',
      asset: {
        mesh: 'assets/2025/contactless-terminal.glb',
        texture: 'assets/2025/textures/contactless-screen-glow.png',
        material: 'matte-white-plastic-with-nfc-icon',
      },
      position: [3.5, 0.95, -2.6],
      tapSfx: 'assets/audio/sfx/register-ding.wav',
    },

    // ───────────────────────────────────────────────────────────────────────
    // 11. PATRONS — 2025-era outfits: athleisure, streetwear, AirPods,
    //     laptops, phones-as-payment. At least 3 distinct patron models
    //     (acceptance criterion #5). All visually distinct from 2005's
    //     trucker-cap-and-hoodie indie crowd.
    // ───────────────────────────────────────────────────────────────────────
    patrons: {
      appearances: [
        {
          id: 'patron-remote-worker-athleisure',
          outfit: 'athleisure-leggings-oversized-hoodie-sneakers',
          hairstyle: 'sleek-low-bun',
          gadgets: ['macbook-pro', 'airpods-pro', 'smartphone', 'stanley-tumbler'],
          asset: {
            mesh: 'assets/2025/patron-remote-worker.glb',
            texture: 'assets/2025/textures/patron-athleisure.png',
          },
          position: [-0.8, 0, 0.5],
          rotation: [0, Math.PI / 2, 0],
        },
        {
          id: 'patron-streetwear-airpods',
          outfit: 'streetwear-oversized-tee-cargo-pants-sneakers',
          hairstyle: 'modern-buzz-cut',
          gadgets: ['smartphone', 'airpods-pro', 'crossbody-bag'],
          asset: {
            mesh: 'assets/2025/patron-streetwear.glb',
            texture: 'assets/2025/textures/patron-streetwear.png',
          },
          position: [0.8, 0, 0.5],
          rotation: [0, -Math.PI / 2, 0],
        },
        {
          id: 'patron-barista-modern-apron',
          outfit: 'denim-apron-merino-tee-tattoos',
          hairstyle: 'modern-undercut',
          gadgets: ['smartwatch', 'phone-pos', 'tamper', 'portafilter'],
          asset: {
            mesh: 'assets/2025/patron-barista.glb',
            texture: 'assets/2025/textures/patron-barista-modern.png',
          },
          position: [2.3, 0, -2.5],
          rotation: [0, -Math.PI / 2, 0],
        },
        {
          id: 'patron-freelancer-laptop',
          outfit: 'smart-casual-blazer-jeans-white-sneakers',
          hairstyle: 'shoulder-length-blunt-cut',
          gadgets: ['macbook-air', 'airpods-max', 'smartphone', 'oat-latte'],
          asset: {
            mesh: 'assets/2025/patron-freelancer.glb',
            texture: 'assets/2025/textures/patron-smart-casual.png',
          },
          position: [-2.2, 0, 0.5],
          rotation: [0, -Math.PI / 2, 0],
        },
        {
          id: 'patron-student-phone-payment',
          outfit: 'crop-hoodie-joggers-airforces',
          hairstyle: 'two-space-buns',
          gadgets: ['smartphone', 'airpods-pro', 'wireless-earbuds', 'canvas-tote'],
          asset: {
            mesh: 'assets/2025/patron-student.glb',
            texture: 'assets/2025/textures/patron-student-2025.png',
          },
          position: [-1.5, 0, -0.3],
          rotation: [0, 0, 0],
        },
      ],
      count: 10,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 12. SFX — ambient murmur, espresso hiss, cup clatter, and the
    //     contactless payment 'beep' (register-ding.wav repurposed as the
    //     terminal beep on tap). Uses the shared license-cleared SFX library.
    // ───────────────────────────────────────────────────────────────────────
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
      murmurVolume: 0.4,
      machineHissVolume: 0.2,
      clatterVolume: 0.15,
    },

    // ───────────────────────────────────────────────────────────────────────
    // 13. NAVIGATION HOTSPOTS — close-up camera anchors for the contactless
    //     terminal, the espresso machine, the QR-code menu tablet, the
    //     bluetooth speaker, and the living wall.
    // ───────────────────────────────────────────────────────────────────────
    navigationHotspots: [
      {
        id: 'contactless-terminal-closeup',
        label: 'Contactless Payment Terminal',
        cameraPosition: [3.2, 1.3, -1.5],
        lookAt: [3.5, 1.0, -2.6],
        fov: 35,
      },
      {
        id: 'espresso-machine-closeup',
        label: 'La Marzocco Multi-Group',
        cameraPosition: [1.5, 1.4, -1.8],
        lookAt: [2.2, 1.0, -2.8],
        fov: 40,
      },
      {
        id: 'qr-menu-tablet-closeup',
        label: 'QR-Code Menu Tablet',
        cameraPosition: [3.5, 1.3, -1.2],
        lookAt: [3.8, 1.2, -2.5],
        fov: 35,
      },
      {
        id: 'bluetooth-speaker-closeup',
        label: 'Phone + Bluetooth Speaker',
        cameraPosition: [2.8, 1.3, -1.5],
        lookAt: [3.0, 1.0, -2.3],
        fov: 35,
      },
      {
        id: 'living-wall-closeup',
        label: 'Living Green Wall',
        cameraPosition: [-3.0, 1.8, -2.0],
        lookAt: [-4.5, 2.0, -4.0],
        fov: 45,
      },
      {
        id: 'vegan-pastry-case-closeup',
        label: 'Vegan Pastry Case',
        cameraPosition: [1.0, 1.4, -1.2],
        lookAt: [1.2, 1.0, -2.5],
        fov: 40,
      },
      {
        id: 'seating-area-closeup',
        label: 'Minimalist Seating Area',
        cameraPosition: [0, 1.5, 2.5],
        lookAt: [0, 0.8, 0.5],
        fov: 55,
      },
    ],
  };

  validatePeriodPackage(pkg);
  return pkg;
}

export default { createPeriodPackage };
