/**
 * eras.ts — SINGLE SOURCE OF TRUTH
 * ================================
 * Every visual, audio, and descriptive element of the café is driven by this data.
 * Adding a new era is a single object literal — no component branching required.
 *
 * The {@link assertEraComplete} invariant runs in dev mode to catch missing fields.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single menu item shown on the in-world board. */
export interface MenuItem {
  name: string;
  /** Price in nominal dollars of the era. Must be > 0. */
  price: number;
}

/** A poster / advertisement spec rendered as a canvas texture. */
export interface PosterSpec {
  title: string;
  subtitle: string;
  /** Dominant colour of the artwork (hex). */
  bg: string;
  /** Accent / text colour (hex). */
  fg: string;
  /** Shape motif used by the canvas generator. */
  motif: 'stripes' | 'starburst' | 'grid' | 'silhouette' | 'orb' | 'waves';
}

/** A patron look descriptor — clothing, hair, and a hand-held gadget. */
export interface PatronLook {
  /** Hex colours of the outfit (shirt, trousers / skirt). */
  outfit: [string, string];
  /** Hex skin tone. */
  skin: string;
  /** Hex hair colour. */
  hairColor: string;
  /** Hair style id — maps to procedural geometry. */
  hairstyle:
    | 'victory-rolls'
    | 'bouffant'
    | 'mullet'
    | 'frosted-tips'
    | 'undercut'
    | 'chrome-visor';
  /** Held gadget rendered as a small primitive. */
  gadget: 'newspaper' | 'transistor-radio' | 'walkman' | 'smartphone' | 'neural-band' | 'none';
}

/** Lighting recipe for an era. */
export interface LightingRecipe {
  /** Three.js environment preset name. */
  environment: 'apartment' | 'city' | 'night' | 'park' | 'studio' | 'dawn';
  /** Ambient colour (hex). */
  ambient: string;
  /** Ambient intensity. */
  ambientIntensity: number;
  /** Key light colour (hex). */
  key: string;
  /** Key light intensity. */
  keyIntensity: number;
  /** Fog colour (hex). */
  fog: string;
  /** Fog near plane. */
  fogNear: number;
  /** Fog far plane. */
  fogFar: number;
  /** Decorative lamp style — drives the hanging fixture geometry. */
  lamp: 'bulb' | 'fluorescent' | 'neon' | 'pendant-edison' | 'spotlight' | 'hologram';
  /** Lamp glow colour (hex). */
  lampGlow: string;
}

/** Wall + floor material descriptors. */
export interface FurnitureDescriptor {
  floorColor: string;
  wallColor: string;
  ceilingColor: string;
  /** Procedural texture type for the floor. */
  floorTexture: 'wood' | 'linoleum' | 'tile' | 'bamboo' | 'terrazzo' | 'glass';
  /** Procedural texture type for the walls. */
  wallTexture: 'wallpaper' | 'paint' | 'brick' | 'panel' | 'concrete' | 'holo-panel';
  /** Table style id. */
  tableStyle: 'bentwood-marble' | 'formica-vinyl' | 'smoked-glass-chrome' | 'light-wood-ikea' | 'terrazzo-oak' | 'maglev';
  /** Chair style id. */
  chairStyle: 'bentwood' | 'vinyl' | 'chrome' | 'plywood' | 'oak-minimal' | 'acrylic';
  /** Wood / accent colour for furniture trim. */
  accentColor: string;
}

/** Coffee machine variant id — maps to procedural geometry in CoffeeMachine.tsx. */
export type MachineKind =
  | 'enamel-percolator'
  | 'faema-e61'
  | 'la-marzocco'
  | 'super-automatic'
  | 'pour-over-bar'
  | 'cold-brew-sphere';

/** Music source prop variant id. */
export type MusicSourceKind =
  | 'wireless-set'
  | 'jukebox'
  | 'boombox'
  | 'ipod-dock'
  | 'phone-mat'
  | 'hologram-orb';

/** Counter technology variant id. */
export type CounterTechKind =
  | 'cash-box'
  | 'mechanical-till'
  | 'electronic-register'
  | 'touchscreen-pos'
  | 'tablet-pos'
  | 'holographic-nfc';

/** Tableware variant id. */
export type TablewareKind = 'china-silver' | 'thick-ceramic' | 'stoneware-bright' | 'white-porcelain' | 'matte-black' | 'crystal-glass';

/** Era-wide audio recipe. */
export interface AudioRecipe {
  /** Music timbre shape for the procedural generator. */
  musicTone: 'jazz' | 'motown' | 'synth' | 'indie' | 'lofi' | 'ambient-future';
  /** Base frequency (Hz) of the procedural drone. */
  baseFreq: number;
  /** Ambient bed — café murmur character. */
  ambient: 'hushed' | 'lively' | 'buzzy' | 'corporate' | 'artisanal' | 'ethereal';
  /** Coffee machine SFX loop character. */
  machineSfx: 'percolate' | 'lever-hiss' | 'pump-clatter' | 'auto-grind' | 'pour-trickle' | 'sub-zero-hum';
}

/** A complete era descriptor. */
export interface Era {
  /** Stable id, e.g. '1945'. */
  id: string;
  /** Display year. */
  year: number;
  /** Short label, e.g. 'Post-War'. */
  label: string;
  /** One-line tagline. */
  tagline: string;
  /** Longer flavour paragraph. */
  description: string;

  /** HUD palette — CSS variable values. */
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    bg: string;
  };

  furniture: FurnitureDescriptor;
  machine: MachineKind;
  machineLabel: string;
  music: MusicSourceKind;
  musicLabel: string;
  posters: PosterSpec[];
  tableware: TablewareKind;
  tablewareLabel: string;
  lighting: LightingRecipe;
  counterTech: CounterTechKind;
  counterTechLabel: string;
  patrons: PatronLook[];
  menu: MenuItem[];
  audio: AudioRecipe;
}

// ---------------------------------------------------------------------------
// Data — six eras
// ---------------------------------------------------------------------------

export const ERAS: readonly Era[] = [
  // ── 1945 ──────────────────────────────────────────────────────────────
  {
    id: '1945',
    year: 1945,
    label: 'Post-War',
    tagline: 'Victory gardens & ration-friendly roasts',
    description:
      'A smoky, wood-paneled corner café where the wireless crackles with swing tunes and neighbours share the morning paper over a ten-cent cup of joe.',
    palette: {
      primary: '#8B5A2B',
      secondary: '#D4A574',
      accent: '#C8A165',
      text: '#F5E6D3',
      bg: '#2A1F17',
    },
    furniture: {
      floorColor: '#6B4423',
      wallColor: '#A67C52',
      ceilingColor: '#8B7355',
      floorTexture: 'wood',
      wallTexture: 'wallpaper',
      tableStyle: 'bentwood-marble',
      chairStyle: 'bentwood',
      accentColor: '#4A3018',
    },
    machine: 'enamel-percolator',
    machineLabel: 'Enamel Percolator on Burner',
    music: 'wireless-set',
    musicLabel: 'Wooden Wireless Set',
    posters: [
      {
        title: 'V-ICTORY\nCOFFEE',
        subtitle: 'A Cup for the Cause',
        bg: '#1B3A2F',
        fg: '#E8D4A0',
        motif: 'starburst',
      },
      {
        title: 'WAR BONDS',
        subtitle: 'Buy & Win',
        bg: '#3A1F1F',
        fg: '#D4A574',
        motif: 'stripes',
      },
    ],
    tableware: 'china-silver',
    tablewareLabel: 'Fine China & Silver',
    lighting: {
      environment: 'apartment',
      ambient: '#FFD9A0',
      ambientIntensity: 0.4,
      key: '#FFB870',
      keyIntensity: 1.2,
      fog: '#3A2A1A',
      fogNear: 8,
      fogFar: 25,
      lamp: 'bulb',
      lampGlow: '#FFC080',
    },
    counterTech: 'cash-box',
    counterTechLabel: 'Wooden Cash Box',
    patrons: [
      {
        outfit: ['#4A5D3A', '#2B3A1F'],
        skin: '#E8C4A0',
        hairColor: '#3A2818',
        hairstyle: 'victory-rolls',
        gadget: 'newspaper',
      },
      {
        outfit: ['#6B3030', '#3A2020'],
        skin: '#D8A880',
        hairColor: '#2A1A0A',
        hairstyle: 'victory-rolls',
        gadget: 'none',
      },
      {
        outfit: ['#1F2A3A', '#151A25'],
        skin: '#F0D0B0',
        hairColor: '#1A0F08',
        hairstyle: 'victory-rolls',
        gadget: 'newspaper',
      },
    ],
    menu: [
      { name: 'Cup o’ Joe', price: 0.1 },
      { name: 'Donut', price: 0.05 },
      { name: 'Egg Sandwich', price: 0.15 },
    ],
    audio: {
      musicTone: 'jazz',
      baseFreq: 220,
      ambient: 'hushed',
      machineSfx: 'percolate',
    },
  },

  // ── 1965 ──────────────────────────────────────────────────────────────
  {
    id: '1965',
    year: 1965,
    label: 'Space Age',
    tagline: 'Formica counters & Motown on the jukebox',
    description:
      'Chrome dinette vibes with a gleaming Faema lever machine behind the counter. The jukebox glows warm orange as teenagers feed nickels for the latest single.',
    palette: {
      primary: '#D43F3F',
      secondary: '#F5E66B',
      accent: '#4A90D9',
      text: '#FFFFFF',
      bg: '#1A1014',
    },
    furniture: {
      floorColor: '#C8C8C8',
      wallColor: '#E8D0B0',
      ceilingColor: '#F0E8D8',
      floorTexture: 'linoleum',
      wallTexture: 'paint',
      tableStyle: 'formica-vinyl',
      chairStyle: 'vinyl',
      accentColor: '#C0C0C0',
    },
    machine: 'faema-e61',
    machineLabel: 'Faema E61 Lever Espresso',
    music: 'jukebox',
    musicLabel: 'Glowing Tube Jukebox',
    posters: [
      {
        title: 'COCA-COLA',
        subtitle: 'Things Go Better',
        bg: '#D43030',
        fg: '#FFFFFF',
        motif: 'starburst',
      },
      {
        title: 'GROOVY\nBABY',
        subtitle: 'Mod Is In',
        bg: '#F5E66B',
        fg: '#D43F3F',
        motif: 'waves',
      },
    ],
    tableware: 'thick-ceramic',
    tablewareLabel: 'Thick Ceramic & Chrome',
    lighting: {
      environment: 'city',
      ambient: '#FFF0D0',
      ambientIntensity: 0.5,
      key: '#FFFFFF',
      keyIntensity: 1.4,
      fog: '#2A2025',
      fogNear: 10,
      fogFar: 30,
      lamp: 'fluorescent',
      lampGlow: '#FFFFF0',
    },
    counterTech: 'mechanical-till',
    counterTechLabel: 'Mechanical Cash Register',
    patrons: [
      {
        outfit: ['#D43F3F', '#1A1A1A'],
        skin: '#E8C4A0',
        hairColor: '#1A0A0A',
        hairstyle: 'bouffant',
        gadget: 'transistor-radio',
      },
      {
        outfit: ['#4A90D9', '#2A2A3A'],
        skin: '#F0D0B0',
        hairColor: '#2A1808',
        hairstyle: 'bouffant',
        gadget: 'none',
      },
      {
        outfit: ['#F5E66B', '#3A3A3A'],
        skin: '#C8A878',
        hairColor: '#1A0A0A',
        hairstyle: 'bouffant',
        gadget: 'transistor-radio',
      },
    ],
    menu: [
      { name: 'Espresso', price: 0.25 },
      { name: 'Cheeseburger', price: 0.45 },
      { name: 'Milkshake', price: 0.35 },
    ],
    audio: {
      musicTone: 'motown',
      baseFreq: 261,
      ambient: 'lively',
      machineSfx: 'lever-hiss',
    },
  },

  // ── 1985 ──────────────────────────────────────────────────────────────
  {
    id: '1985',
    year: 1985,
    label: 'Neon Decade',
    tagline: 'Smoked glass, synth-pop & cappuccino art',
    description:
      'A dimly lit café bathed in neon pinks and blues. La Marzocco rules the counter while a boombox blares synth-wave and power suits discuss Reaganomics.',
    palette: {
      primary: '#FF2D95',
      secondary: '#00D9FF',
      accent: '#9D4EDD',
      text: '#F0F0FF',
      bg: '#0D0518',
    },
    furniture: {
      floorColor: '#2A2A3A',
      wallColor: '#1A1A2A',
      ceilingColor: '#151520',
      floorTexture: 'tile',
      wallTexture: 'brick',
      tableStyle: 'smoked-glass-chrome',
      chairStyle: 'chrome',
      accentColor: '#C0C0C0',
    },
    machine: 'la-marzocco',
    machineLabel: 'La Marzocco Two-Group',
    music: 'boombox',
    musicLabel: 'Shoulder Boombox',
    posters: [
      {
        title: 'BAUHAUS\n85',
        subtitle: 'Form Follows Function',
        bg: '#FF2D95',
        fg: '#0D0518',
        motif: 'grid',
      },
      {
        title: 'NEON\nNIGHTS',
        subtitle: 'Dance Till Dawn',
        bg: '#00D9FF',
        fg: '#0D0518',
        motif: 'waves',
      },
    ],
    tableware: 'stoneware-bright',
    tablewareLabel: 'Stoneware, Bright Colours',
    lighting: {
      environment: 'night',
      ambient: '#2A1A3A',
      ambientIntensity: 0.3,
      key: '#FF2D95',
      keyIntensity: 1.0,
      fog: '#1A0A2A',
      fogNear: 6,
      fogFar: 22,
      lamp: 'neon',
      lampGlow: '#FF2D95',
    },
    counterTech: 'electronic-register',
    counterTechLabel: 'Electronic Register w/ Display',
    patrons: [
      {
        outfit: ['#FF2D95', '#0D0518'],
        skin: '#E8C4A0',
        hairColor: '#0A0A0A',
        hairstyle: 'mullet',
        gadget: 'walkman',
      },
      {
        outfit: ['#00D9FF', '#1A1A3A'],
        skin: '#F0D0B0',
        hairColor: '#3A3A3A',
        hairstyle: 'mullet',
        gadget: 'walkman',
      },
      {
        outfit: ['#9D4EDD', '#1A0A2A'],
        skin: '#D8A880',
        hairColor: '#1A1A1A',
        hairstyle: 'mullet',
        gadget: 'none',
      },
    ],
    menu: [
      { name: 'Cappuccino', price: 0.85 },
      { name: 'Croissant', price: 0.75 },
      { name: 'Bagel & Lox', price: 1.5 },
    ],
    audio: {
      musicTone: 'synth',
      baseFreq: 174,
      ambient: 'buzzy',
      machineSfx: 'pump-clatter',
    },
  },

  // ── 2005 ──────────────────────────────────────────────────────────────
  {
    id: '2005',
    year: 2005,
    label: 'Second Wave',
    tagline: 'Laptops, lattes & a thousand songs in your pocket',
    description:
      'The Starbucks era. Light woods, Edison-bulb pendants, and a super-automatic whirring out skinny lattes for freelancers pecking at PowerBooks.',
    palette: {
      primary: '#2D6A4F',
      secondary: '#D4A574',
      accent: '#E63946',
      text: '#F5F0E8',
      bg: '#1A1612',
    },
    furniture: {
      floorColor: '#8B6B4A',
      wallColor: '#E8DCC8',
      ceilingColor: '#F0E8D8',
      floorTexture: 'bamboo',
      wallTexture: 'paint',
      tableStyle: 'light-wood-ikea',
      chairStyle: 'plywood',
      accentColor: '#6B4E2A',
    },
    machine: 'super-automatic',
    machineLabel: 'Super-Automatic Bean-to-Cup',
    music: 'ipod-dock',
    musicLabel: 'iPod in Speaker Dock',
    posters: [
      {
        title: '1,000\nSONGS',
        subtitle: 'In Your Pocket',
        bg: '#F5F0E8',
        fg: '#1A1612',
        motif: 'silhouette',
      },
      {
        title: 'FAIR\nTRADE',
        subtitle: 'Ethically Sourced',
        bg: '#2D6A4F',
        fg: '#F5F0E8',
        motif: 'stripes',
      },
    ],
    tableware: 'white-porcelain',
    tablewareLabel: 'White Porcelain, Minimalist',
    lighting: {
      environment: 'apartment',
      ambient: '#FFE8C8',
      ambientIntensity: 0.6,
      key: '#FFD498',
      keyIntensity: 1.3,
      fog: '#2A2018',
      fogNear: 10,
      fogFar: 32,
      lamp: 'pendant-edison',
      lampGlow: '#FFC880',
    },
    counterTech: 'touchscreen-pos',
    counterTechLabel: 'Touchscreen POS Terminal',
    patrons: [
      {
        outfit: ['#2D6A4F', '#1A2A20'],
        skin: '#E8C4A0',
        hairColor: '#3A2A18',
        hairstyle: 'frosted-tips',
        gadget: 'smartphone',
      },
      {
        outfit: ['#1A1A1A', '#0A0A0A'],
        skin: '#F0D0B0',
        hairColor: '#5A4A3A',
        hairstyle: 'frosted-tips',
        gadget: 'smartphone',
      },
      {
        outfit: ['#E63946', '#2A2A2A'],
        skin: '#D8A880',
        hairColor: '#2A1A0A',
        hairstyle: 'frosted-tips',
        gadget: 'none',
      },
    ],
    menu: [
      { name: 'Skinny Latte', price: 2.25 },
      { name: 'Frappuccino', price: 3.5 },
      { name: 'Blueberry Muffin', price: 1.95 },
    ],
    audio: {
      musicTone: 'indie',
      baseFreq: 233,
      ambient: 'corporate',
      machineSfx: 'auto-grind',
    },
  },

  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    id: '2025',
    year: 2025,
    label: 'Third-Wave Artisanal',
    tagline: 'Pour-over bars, oat milk & minimalist terrazzo',
    description:
      'Scandinavian-minimal meets Instagram. A V60 pour-over bar with lab-grade scales, matte-black ceramics, and phones charging on induction mats.',
    palette: {
      primary: '#1A1A1A',
      secondary: '#E0A458',
      accent: '#7CB342',
      text: '#FAFAFA',
      bg: '#0F0F0F',
    },
    furniture: {
      floorColor: '#C8C0B8',
      wallColor: '#F0EDE8',
      ceilingColor: '#FAFAFA',
      floorTexture: 'terrazzo',
      wallTexture: 'concrete',
      tableStyle: 'terrazzo-oak',
      chairStyle: 'oak-minimal',
      accentColor: '#8B7355',
    },
    machine: 'pour-over-bar',
    machineLabel: 'Pour-Over Bar (V60 + Scales)',
    music: 'phone-mat',
    musicLabel: 'Phone on Charging Mat',
    posters: [
      {
        title: 'OAT\nMILK',
        subtitle: 'Plant-Based Pride',
        bg: '#7CB342',
        fg: '#FAFAFA',
        motif: 'orb',
      },
      {
        title: 'SINGLE\nORIGIN',
        subtitle: 'Ethiopia Yirgacheffe',
        bg: '#1A1A1A',
        fg: '#E0A458',
        motif: 'grid',
      },
    ],
    tableware: 'matte-black',
    tablewareLabel: 'Matte Black Stoneware',
    lighting: {
      environment: 'studio',
      ambient: '#FFFFFF',
      ambientIntensity: 0.7,
      key: '#FAFAFA',
      keyIntensity: 1.1,
      fog: '#202020',
      fogNear: 12,
      fogFar: 35,
      lamp: 'spotlight',
      lampGlow: '#FAFAFA',
    },
    counterTech: 'tablet-pos',
    counterTechLabel: 'Tablet POS (Square)',
    patrons: [
      {
        outfit: ['#1A1A1A', '#0A0A0A'],
        skin: '#E8C4A0',
        hairColor: '#1A1A1A',
        hairstyle: 'undercut',
        gadget: 'smartphone',
      },
      {
        outfit: ['#E0A458', '#2A2018'],
        skin: '#F0D0B0',
        hairColor: '#5A3A1A',
        hairstyle: 'undercut',
        gadget: 'smartphone',
      },
      {
        outfit: ['#7CB342', '#1A2A10'],
        skin: '#D8A880',
        hairColor: '#2A1A0A',
        hairstyle: 'undercut',
        gadget: 'neural-band',
      },
    ],
    menu: [
      { name: 'V60 Pour-Over', price: 4.5 },
      { name: 'Oat Milk Flat White', price: 5.25 },
      { name: 'Avocado Toast', price: 7.0 },
    ],
    audio: {
      musicTone: 'lofi',
      baseFreq: 277,
      ambient: 'artisanal',
      machineSfx: 'pour-trickle',
    },
  },

  // ── 2055 ──────────────────────────────────────────────────────────────
  {
    id: '2055',
    year: 2055,
    label: 'Neo-Future',
    tagline: 'Holographic menus, magnetic-lev seating & cold-brew spheres',
    description:
      'A luminous, translucent café floating between the physical and the holographic. Crystal-glass pods serve nitrogen cold-brew from a suspended sphere, while ambient AI-art shifts on the walls.',
    palette: {
      primary: '#00E5FF',
      secondary: '#7C4DFF',
      accent: '#FF4081',
      text: '#E0F7FA',
      bg: '#050510',
    },
    furniture: {
      floorColor: '#0A0A20',
      wallColor: '#0F0F30',
      ceilingColor: '#080818',
      floorTexture: 'glass',
      wallTexture: 'holo-panel',
      tableStyle: 'maglev',
      chairStyle: 'acrylic',
      accentColor: '#00E5FF',
    },
    machine: 'cold-brew-sphere',
    machineLabel: 'Suspended Cold-Brew Sphere',
    music: 'hologram-orb',
    musicLabel: 'Floating Holographic Speaker Orb',
    posters: [
      {
        title: 'AI\nDREAMS',
        subtitle: 'Generative Futures',
        bg: '#0F0F30',
        fg: '#00E5FF',
        motif: 'orb',
      },
      {
        title: 'NFC\nTAP',
        subtitle: 'Pay With Your Mind',
        bg: '#7C4DFF',
        fg: '#FFFFFF',
        motif: 'orb',
      },
    ],
    tableware: 'crystal-glass',
    tablewareLabel: 'Transparent Crystal-Glass Pods',
    lighting: {
      environment: 'dawn',
      ambient: '#1A1A40',
      ambientIntensity: 0.4,
      key: '#00E5FF',
      keyIntensity: 0.9,
      fog: '#0A0A25',
      fogNear: 8,
      fogFar: 28,
      lamp: 'hologram',
      lampGlow: '#7C4DFF',
    },
    counterTech: 'holographic-nfc',
    counterTechLabel: 'Holographic NFC Payment Pad',
    patrons: [
      {
        outfit: ['#00E5FF', '#0A0A20'],
        skin: '#E8C4A0',
        hairColor: '#C0C0C0',
        hairstyle: 'chrome-visor',
        gadget: 'neural-band',
      },
      {
        outfit: ['#7C4DFF', '#0F0F30'],
        skin: '#F0D0B0',
        hairColor: '#A0A0FF',
        hairstyle: 'chrome-visor',
        gadget: 'neural-band',
      },
      {
        outfit: ['#FF4081', '#1A0A20'],
        skin: '#D8A880',
        hairColor: '#FFD700',
        hairstyle: 'chrome-visor',
        gadget: 'neural-band',
      },
    ],
    menu: [
      { name: 'N₂ Cold-Brew Sphere', price: 9.0 },
      { name: 'Synth-Paste Croissant', price: 6.5 },
      { name: 'Electrolyte Tonic', price: 5.0 },
    ],
    audio: {
      musicTone: 'ambient-future',
      baseFreq: 130,
      ambient: 'ethereal',
      machineSfx: 'sub-zero-hum',
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default starting era id. */
export const DEFAULT_ERA_ID = '1945';

/** Returns the Era with the given id, or undefined. */
export function getEraById(id: string): Era | undefined {
  return ERAS.find((e) => e.id === id);
}

/** Returns the Era with the given year. */
export function getEraByYear(year: number): Era | undefined {
  return ERAS.find((e) => e.year === year);
}

/** Number of menu items, for tests. */
export const ERA_COUNT = ERAS.length;

/**
 * Dev-mode invariant: throws if any required field on the era is empty / missing.
 * Runs once at module load via {@link assertAllErasComplete}.
 */
export function assertEraComplete(era: Era): void {
  const errors: string[] = [];

  const check = (label: string, value: unknown): void => {
    if (value === null || value === undefined) {
      errors.push(`${label} is null/undefined`);
      return;
    }
    if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${label} is an empty string`);
    }
    if (Array.isArray(value) && value.length === 0) {
      errors.push(`${label} is an empty array`);
    }
  };

  check('id', era.id);
  check('label', era.label);
  check('tagline', era.tagline);
  check('description', era.description);
  check('machine', era.machine);
  check('music', era.music);
  check('tableware', era.tableware);
  check('counterTech', era.counterTech);
  check('posters', era.posters);
  check('patrons', era.patrons);
  check('menu', era.menu);

  era.menu.forEach((item, i) => {
    if (typeof item.price !== 'number' || item.price <= 0) {
      errors.push(`menu[${i}].price must be a positive number (got ${item.price})`);
    }
    check(`menu[${i}].name`, item.name);
  });

  if (errors.length > 0) {
    throw new Error(`Era ${era.id} is incomplete:\n  - ${errors.join('\n  - ')}`);
  }
}

/** Runs the invariant on every era. Call at app init (guarded by IS_DEV). */
export function assertAllErasComplete(): void {
  if (ERAS.length === 0) {
    throw new Error('ERAS array is empty — at least one era is required.');
  }
  for (const era of ERAS) {
    assertEraComplete(era);
  }
}

// Run the invariant in dev so we surface missing data immediately.
if (import.meta.env?.DEV) {
  assertAllErasComplete();
}
