/**
 * eras.ts — the six canonical eras and their descriptive data.
 *
 * Exactly the years 1945, 1965, 1985, 2005, 2025, 2055 (see ERA_YEARS).
 * Each era supplies a complete {@link EraData} object spanning all 11 brief
 * categories. Downstream tasks consume this as a single source of truth for
 * era metadata and visual/audio direction.
 */
import type { EraData, EraYear } from './EraData.js';
import { ERA_YEARS } from './EraData.js';

/** Type guard confirming a value is one of the six era years. */
export function isEraYear(value: unknown): value is EraYear {
  return (
    typeof value === 'number' &&
    (ERA_YEARS as readonly number[]).includes(value)
  );
}

/** The complete, ordered list of era data objects. */
export const ERAS: readonly EraData[] = [
  {
    year: 1945,
    label: 'Postwar Café',
    audio: {
      music: {
        timbre: 'am-radio',
        rootFrequency: 130.81,
        scale: [0, 4, 7, 9, 12],
        waveform: 'triangle',
        notesPerSecond: 1.2,
        mediumFilter: { type: 'bandpass', frequency: 1000, Q: 1.5 },
        crackle: 0.15,
        wow: 0.02,
        gain: 0.32,
      },
      coffeeMachine: {
        hissGain: 0.22,
        hissCutoff: 4500,
        clatterRate: 0.4,
        clatterGain: 0.32,
      },
      murmur: { gain: 0.28, voiceCount: 4 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: 3, y: 1.5, z: -3 },
      },
    },
    architecture: {
      walls: { material: 'plaster', color: 'cream', pattern: 'faded-stripe' },
      floor: { material: 'terrazzo', color: 'mottled-grey' },
      ceiling: { material: 'tin-tiles', style: 'pressed-victorian' },
      trim: { material: 'painted-wood', color: 'forest-green', style: 'picture-rail' },
    },
    furnitureDecor: {
      style: 'utilitarian-postwar',
      seating: 'bentwood-chairs',
      tables: 'round-marble-top',
      decorativeAccents: ['wartime-rationing-posters', 'dried-flowers'],
    },
    coffeeMachines: {
      machineType: 'lever-espresso',
      brewingMethod: 'stovetop-percolation',
      equipmentNotes: 'chrome Gaggia-style lever machine; manual bean grinder',
    },
    menuBoard: {
      boardType: 'chalkboard',
      signatureDrink: 'Espresso',
      signatureDrinkPrice: 'tuppence',
      itemHighlights: ['brewed-coffee', 'bread-and-butter'],
    },
    musicSource: {
      device: 'wireless-set',
      playbackFormat: 'AM-radio',
      musicStyle: 'big-band-and-swing',
    },
    posters: {
      posterStyle: 'lithograph',
      advertisementSubjects: ['war-bonds', 'tea-brands', 'travel-posters'],
    },
    tableware: {
      cups: 'thick-ceramic-demitasse',
      plates: 'enamel-tin',
      cutlery: 'stainless-steel-basic',
    },
    signage: {
      shopSign: 'hand-painted-gold-leaf-on-glass',
      brandVoice: 'reassuring-and-traditional',
    },
    lighting: {
      fixtureType: 'edison-bulb-pendants',
      ambience: 'warm-and-dim',
      colorTemperature: '2200K-warm-white',
    },
    counterTechnology: {
      tillType: 'brass-cash-register',
      paymentMethod: 'cash',
      techNotes: 'mechanical bell, manual price entry',
    },
    patrons: {
      outfits: 'utility-suits-and-floral-dresses',
      hairstyles: ' victory-rolls-and-slicked-back',
      gadgets: 'pocket-watches',
    },
  },
  {
    year: 1965,
    label: 'Swinging Sixties Diner',
    audio: {
      music: {
        timbre: 'vinyl-45',
        rootFrequency: 146.83,
        scale: [0, 3, 5, 6, 7, 10],
        waveform: 'sawtooth',
        notesPerSecond: 1.8,
        mediumFilter: { type: 'lowpass', frequency: 9000, Q: 0.5 },
        crackle: 0.25,
        wow: 0.03,
        gain: 0.36,
      },
      coffeeMachine: {
        hissGain: 0.26,
        hissCutoff: 5000,
        clatterRate: 0.5,
        clatterGain: 0.3,
      },
      murmur: { gain: 0.34, voiceCount: 5 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: 4, y: 1.2, z: -3 },
      },
    },
    architecture: {
      walls: { material: 'wood-paneling', color: 'mahogany' },
      floor: { material: 'checkerboard-lino', color: 'black-and-white' },
      ceiling: { material: 'acoustic-tile', style: 'dropped-grid' },
      trim: { material: 'chrome', color: 'silver', style: 'sleek-edging' },
    },
    furnitureDecor: {
      style: 'mid-century-diner',
      seating: 'vinyl-booths',
      tables: 'formica-counters',
      decorativeAccents: ['chrome-accents', 'neon-trim'],
    },
    coffeeMachines: {
      machineType: 'faema-e61-espresso',
      brewingMethod: 'pump-espresso',
      equipmentNotes: 'first commercial heat-exchanger machine; chrome and bakelite',
    },
    menuBoard: {
      boardType: 'backlit-menu-panel',
      signatureDrink: 'Cappuccino',
      signatureDrinkPrice: 'one-shilling',
      itemHighlights: ['milkshakes', 'diner-fries', 'pie-of-the-day'],
    },
    musicSource: {
      device: 'jukebox',
      playbackFormat: 'vinyl-45s',
      musicStyle: 'rock-and-roll-and-motown',
    },
    posters: {
      posterStyle: 'pop-art',
      advertisementSubjects: ['soft-drinks', 'cars', 'cigarettes'],
    },
    tableware: {
      cups: 'melamine-mugs',
      plates: 'melamine-patterned',
      cutlery: 'chromed-diner-cutlery',
    },
    signage: {
      shopSign: 'neon-tube-script',
      brandVoice: 'modern-and-groovy',
    },
    lighting: {
      fixtureType: 'neon-strip-and-sconces',
      ambience: 'vibrant-and-cool',
      colorTemperature: '3000K-cool-white',
    },
    counterTechnology: {
      tillType: 'electro-mechanical-till',
      paymentMethod: 'cash',
      techNotes: 'push-button register with printed receipt tape',
    },
    patrons: {
      outfits: 'mod-suits-and-miniskirts',
      hairstyles: 'beehives-and-bowl-cuts',
      gadgets: 'transistor-radios',
    },
  },
  {
    year: 1985,
    label: 'Eighties Coffee Bar',
    audio: {
      music: {
        timbre: 'cassette',
        rootFrequency: 110,
        scale: [0, 3, 5, 7, 10, 12],
        waveform: 'square',
        notesPerSecond: 1.6,
        mediumFilter: { type: 'lowpass', frequency: 6000, Q: 0.7 },
        crackle: 0.06,
        wow: 0.2,
        gain: 0.34,
      },
      coffeeMachine: {
        hissGain: 0.3,
        hissCutoff: 5500,
        clatterRate: 0.55,
        clatterGain: 0.28,
      },
      murmur: { gain: 0.36, voiceCount: 5 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: 3, y: 1.2, z: -2 },
      },
    },
    architecture: {
      walls: { material: 'brick-veneer', color: 'rust-red', pattern: 'exposed' },
      floor: { material: 'terracotta-tile', color: 'terracotta' },
      ceiling: { material: 'suspended-acoustic', style: 'recessed-grid' },
      trim: { material: 'stained-wood', color: 'dark-oak', style: 'arched' },
    },
    furnitureDecor: {
      style: 'postmodern-eclectic',
      seating: 'tub-chairs',
      tables: 'glass-and-chrome',
      decorativeAccents: ['potted-ferns', 'art-deco-revival-mirrors'],
    },
    coffeeMachines: {
      machineType: 'dual-boiler-espresso',
      brewingMethod: 'pump-espresso',
      equipmentNotes: 'Polished La Marzocco-style machine; first wave of cafe culture',
    },
    menuBoard: {
      boardType: 'chalkboard-menu',
      signatureDrink: 'Caffè Latte',
      signatureDrinkPrice: '£1.20',
      itemHighlights: ['flavoured-lattes', 'muffins', 'bagels'],
    },
    musicSource: {
      device: 'boombox',
      playbackFormat: 'cassette-tape',
      musicStyle: 'synthpop-and-new-wave',
    },
    posters: {
      posterStyle: 'glossy-pop',
      advertisementSubjects: ['fashion-brands', 'soft-drinks', 'film-posters'],
    },
    tableware: {
      cups: 'thick-cafe-mugs',
      plates: 'white-ceramic',
      cutlery: 'standard-stainless-steel',
    },
    signage: {
      shopSign: 'illuminated-channel-letters',
      brandVoice: 'bold-and-energetic',
    },
    lighting: {
      fixtureType: 'halogen-track-and-spotlights',
      ambience: 'bright-and-dramatic',
      colorTemperature: '3200K-neutral',
    },
    counterTechnology: {
      tillType: 'electronic-POS-terminal',
      paymentMethod: 'cash-and-early-cards',
      techNotes: 'green-screen CRT terminal; magnetic-stripe cards emerging',
    },
    patrons: {
      outfits: 'power-shoulders-and-denim',
      hairstyles: 'perms-and-mullets',
      gadgets: 'walkmans',
    },
  },
  {
    year: 2005,
    label: 'Third-Wave Coffeehouse',
    audio: {
      music: {
        timbre: 'digital-mp3',
        rootFrequency: 196,
        scale: [0, 2, 4, 7, 9],
        waveform: 'sine',
        notesPerSecond: 1.0,
        mediumFilter: { type: 'lowpass', frequency: 16000, Q: 0.5 },
        crackle: 0.0,
        wow: 0.0,
        gain: 0.3,
      },
      coffeeMachine: {
        hissGain: 0.32,
        hissCutoff: 6000,
        clatterRate: 0.5,
        clatterGain: 0.26,
      },
      murmur: { gain: 0.4, voiceCount: 6 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: 2, y: 1.0, z: 0 },
      },
    },
    architecture: {
      walls: { material: 'reclaimed-wood', color: 'natural-oak' },
      floor: { material: 'polished-concrete', color: 'grey' },
      ceiling: { material: 'exposed-structure', style: 'industrial-loft' },
      trim: { material: 'steel', color: 'blackened-steel', style: 'minimal' },
    },
    furnitureDecor: {
      style: 'industrial-rustic',
      seating: 'mixing-mismatched-chairs',
      tables: 'communal-reclaimed-wood',
      decorativeAccents: ['edison-bulbs', 'blackboard-art', 'vintage-crates'],
    },
    coffeeMachines: {
      machineType: 'multi-boiler-precision-espresso',
      brewingMethod: 'pump-espresso-and-pourover',
      equipmentNotes: 'La Marzocco GB5; single-origin beans; pour-over bars',
    },
    menuBoard: {
      boardType: 'handwritten-chalkboard',
      signatureDrink: 'Flat White',
      signatureDrinkPrice: '£2.50',
      itemHighlights: ['single-origin-pourover', 'raw-cane-sugar', 'vegan-treats'],
    },
    musicSource: {
      device: 'iPod',
      playbackFormat: 'digital-mp3',
      musicStyle: 'indie-folk-and-acoustic',
    },
    posters: {
      posterStyle: 'letterpress-and-artisan',
      advertisementSubjects: ['fair-trade', 'local-roasters', 'live-music-nights'],
    },
    tableware: {
      cups: 'double-walled-glass-and-ceramic',
      plates: 'slate-and-rustic-ceramic',
      cutlery: 'heavyweight-stainless-steel',
    },
    signage: {
      shopSign: 'reclaimed-wood-sandwich-board',
      brandVoice: 'artisanal-and-authentic',
    },
    lighting: {
      fixtureType: 'edison-filament-pendants',
      ambience: 'cosy-and-warm',
      colorTemperature: '2700K-warm-white',
    },
    counterTechnology: {
      tillType: 'touchscreen-POS',
      paymentMethod: 'chip-and-pin',
      techNotes: 'LCD touchscreen terminals; chip cards standard',
    },
    patrons: {
      outfits: 'skinny-jeans-and-flannel',
      hairstyles: 'messy-buns-and-beards',
      gadgets: 'early-smartphones-and-laptops',
    },
  },
  {
    year: 2025,
    label: 'Contemporary Specialty Café',
    audio: {
      music: {
        timbre: 'streaming',
        rootFrequency: 174.61,
        scale: [0, 3, 5, 7, 10],
        waveform: 'sine',
        notesPerSecond: 0.9,
        mediumFilter: { type: 'lowpass', frequency: 4000, Q: 0.8 },
        crackle: 0.0,
        wow: 0.05,
        gain: 0.3,
      },
      coffeeMachine: {
        hissGain: 0.34,
        hissCutoff: 6500,
        clatterRate: 0.45,
        clatterGain: 0.22,
      },
      murmur: { gain: 0.44, voiceCount: 6 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: -2, y: 1.1, z: 1 },
      },
    },
    architecture: {
      walls: { material: 'limewash-plaster', color: 'soft-white' },
      floor: { material: 'large-format-porcelain', color: 'warm-stone' },
      ceiling: { material: 'acoustic-baffling', style: 'curved-felt-panels' },
      trim: { material: 'anodised-aluminium', color: 'bronze', style: 'frameless' },
    },
    furnitureDecor: {
      style: 'biophilic-minimal',
      seating: 'upholstered-lounge-chairs',
      tables: 'live-edge-oak',
      decorativeAccents: ['living-green-walls', 'sculptural-lighting', 'curated-plants'],
    },
    coffeeMachines: {
      machineType: 'pressure-profiling-espresso',
      brewingMethod: 'precision-espresso-and-modern-pourover',
      equipmentNotes: 'Slayer/Modbar pressure-profiling; IoT-connected grinders',
    },
    menuBoard: {
      boardType: 'digital-menu-screen',
      signatureDrink: 'Specialty Oat Latte',
      signatureDrinkPrice: '£4.20',
      itemHighlights: ['oat-and-barista-milks', 'matcha', 'seasonal-specials'],
    },
    musicSource: {
      device: 'phone',
      playbackFormat: 'streaming',
      musicStyle: 'lofi-and-curated-playlists',
    },
    posters: {
      posterStyle: 'minimalist-digital-prints',
      advertisementSubjects: ['sustainability', 'local-artisans', 'app-loyalty'],
    },
    tableware: {
      cups: 'artisan-ceramic-and-reusable-cups',
      plates: 'matte-stoneware',
      cutlery: 'sustainable-bamboo-and-steel',
    },
    signage: {
      shopSign: 'minimalist-backlit-acrylic',
      brandVoice: 'conscious-and-modern',
    },
    lighting: {
      fixtureType: 'smart-led-and-sculptural',
      ambience: 'soft-and-layered',
      colorTemperature: 'tunable-2700K-4000K',
    },
    counterTechnology: {
      tillType: 'mobile-tablet-POS',
      paymentMethod: 'contactless',
      techNotes: 'tablet POS (Square/Toast); contactless + mobile wallets',
    },
    patrons: {
      outfits: 'athleisure-and-techwear',
      hairstyles: 'natural-and-gender-fluid',
      gadgets: 'smartphones-and-smartwatches',
    },
  },
  {
    year: 2055,
    label: 'Future Smart Café',
    audio: {
      music: {
        timbre: 'spatial-audio',
        rootFrequency: 87.31,
        scale: [0, 7, 12, 19],
        waveform: 'sine',
        notesPerSecond: 0.7,
        mediumFilter: { type: 'lowpass', frequency: 12000, Q: 0.4 },
        crackle: 0.0,
        wow: 0.0,
        gain: 0.28,
      },
      coffeeMachine: {
        hissGain: 0.2,
        hissCutoff: 7000,
        clatterRate: 0.3,
        clatterGain: 0.16,
      },
      murmur: { gain: 0.42, voiceCount: 6 },
      spatial: {
        coffeeMachine: { x: -3, y: 1.3, z: -4 },
        musicSource: { x: 0, y: 2.5, z: -2 },
      },
    },
    architecture: {
      walls: { material: 'adaptive-smart-glass', color: 'tint-shifts-on-demand', pattern: 'programmable' },
      floor: { material: 'recycled-composite', color: 'pearl-graphite' },
      ceiling: { material: 'ambient-light-panel', style: 'seamless-diffuser' },
      trim: { material: 'graphene-composite', color: 'iridescent', style: 'parametric' },
    },
    furnitureDecor: {
      style: 'parametric-biophilic',
      seating: 'adaptive-morphing-benches',
      tables: 'holographic-display-surfaces',
      decorativeAccents: ['air-purifying-moss-walls', 'kinetic-sculptures', 'projection-art'],
    },
    coffeeMachines: {
      machineType: 'molecular-extraction-unit',
      brewingMethod: 'programmable-precision-extraction',
      equipmentNotes: 'AI-driven autonomous brewing; molecular flavour synthesis',
    },
    menuBoard: {
      boardType: 'holographic-projection',
      signatureDrink: 'Custom Molecular Brew',
      signatureDrinkPrice: '£9.00',
      itemHighlights: ['dna-personalised-blends', 'nutrient-fortified', 'aroma-engineering'],
    },
    musicSource: {
      device: 'streaming',
      playbackFormat: 'spatial-audio',
      musicStyle: 'adaptive-generative-ambient',
    },
    posters: {
      posterStyle: 'dynamic-projection-art',
      advertisementSubjects: ['sustainable-cities', 'bio-couture', 'neural-experiences'],
    },
    tableware: {
      cups: 'self-cleaning-nanomaterial',
      plates: 'programmable-surface',
      cutlery: 'magnetic-modular',
    },
    signage: {
      shopSign: 'holographic-augmented-reality-overlay',
      brandVoice: 'futuristic-and-seamless',
    },
    lighting: {
      fixtureType: 'adaptive-bioluminescent-and-laser',
      ambience: 'dynamic-and-immersive',
      colorTemperature: 'fully-tunable-programmable',
    },
    counterTechnology: {
      tillType: 'invisible-frictionless',
      paymentMethod: 'biometric',
      techNotes: 'no terminal — walk-in walk-out via biometric identity; robotic barista',
    },
    patrons: {
      outfits: 'smart-textiles-and-ar-layers',
      hairstyles: 'digital-ar-overlays',
      gadgets: 'ar-glasses-and-neural-interfaces',
    },
  },
];

/** Ordered list of just the era years, derived from ERAS for convenience. */
export const ERA_YEAR_LIST: readonly EraYear[] = ERAS.map((e) => e.year);

/** Look up the EraData for a given year (throws if not found). */
export function getEra(year: EraYear): EraData {
  const era = ERAS.find((e) => e.year === year);
  if (!era) throw new Error(`Unknown era year: ${year}`);
  return era;
}
