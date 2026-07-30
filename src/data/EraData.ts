/**
 * EraData.ts — Canonical data contract for the Café Time Period Timelapse.
 *
 * Every era (1945, 1965, 1985, 2005, 2025, 2055) describes the café across the
 * 11 brief categories. Downstream tasks (scene controller, asset library,
 * transition controller, audio engine) compose against this contract, so every
 * field is typed and intentionally descriptive rather than loosely `string`.
 *
 * The 11 categories (derived from the brief):
 *   1.  architecture        — walls / floor / ceiling / trim
 *   2.  furnitureDecor      — furniture & decor
 *   3.  coffeeMachines      — coffee machines & brewing equipment
 *   4.  menuBoard           — menu board & prices
 *   5.  musicSource         — music device (wireless set / jukebox / boombox / iPod / phone)
 *   6.  posters             — posters & advertisements
 *   7.  tableware           — cups, plates, cutlery
 *   8.  signage             — shop signage
 *   9.  lighting            — light fixtures & ambience
 *  10.  counterTechnology   — counter technology (manual till → contactless)
 *  11.  patrons             — outfits / hairstyles / gadgets of patrons
 */

/** The six selectable years, in chronological order. */
export const ERA_YEARS = [1945, 1965, 1985, 2005, 2025, 2055] as const;

/** A single selectable era year. */
export type EraYear = (typeof ERA_YEARS)[number];

/**
 * The canonical, ordered list of category keys. Adding a category here also
 * requires a matching key on {@link EraData} and {@link CategoryDataMap}.
 * The `check:eras` lint gate iterates this list to assert completeness.
 */
export const CATEGORY_KEYS = [
  'architecture',
  'furnitureDecor',
  'coffeeMachines',
  'menuBoard',
  'musicSource',
  'posters',
  'tableware',
  'signage',
  'lighting',
  'counterTechnology',
  'patrons',
] as const;

/** Union of the 11 category keys. */
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

// ---------------------------------------------------------------------------
// Per-category data shapes
// ---------------------------------------------------------------------------

/** 1. Architecture — the room shell itself. */
export interface ArchitectureCategory {
  walls: { material: string; color: string; pattern?: string };
  floor: { material: string; color: string; pattern?: string };
  ceiling: { material: string; style: string };
  trim: { material: string; color: string; style: string };
}

/** 2. Furniture & decor. */
export interface FurnitureDecorCategory {
  style: string;
  seating: string;
  tables: string;
  decorativeAccents: string[];
}

/** 3. Coffee machines & brewing equipment. */
export interface CoffeeMachinesCategory {
  machineType: string;
  brewingMethod: string;
  equipmentNotes: string;
}

/** 4. Menu board & prices. */
export interface MenuBoardCategory {
  boardType: string;
  /** Monetary value in the era's currency, e.g. "£0/2d" or "£3.50". */
  signatureDrink: string;
  signatureDrinkPrice: string;
  itemHighlights: string[];
}

/** 5. Music source — what the music plays from. */
export interface MusicSourceCategory {
  device:
    | 'wireless-set'
    | 'jukebox'
    | 'boombox'
    | 'iPod'
    | 'phone'
    | 'streaming'
    | 'none'
    | string;
  playbackFormat: string;
  musicStyle: string;
}

/** 6. Posters & advertisements on the walls. */
export interface PostersCategory {
  posterStyle: string;
  advertisementSubjects: string[];
}

/** 7. Tableware — cups, plates, cutlery. */
export interface TablewareCategory {
  cups: string;
  plates: string;
  cutlery: string;
}

/** 8. Signage — shop signage and brand mark. */
export interface SignageCategory {
  shopSign: string;
  brandVoice: string;
}

/** 9. Lighting — fixtures and overall ambience. */
export interface LightingCategory {
  fixtureType: string;
  ambience: string;
  colorTemperature: string;
}

/** 10. Counter technology — the point of sale. */
export interface CounterTechnologyCategory {
  tillType: string;
  paymentMethod: string;
  techNotes: string;
}

/** 11. Patrons — outfits, hairstyles, gadgets. */
export interface PatronsCategory {
  outfits: string;
  hairstyles: string;
  gadgets: string;
}

/**
 * Maps each category key to its strongly-typed data shape. Used to derive the
 * per-category data type in the asset registry without manual duplication.
 */
export interface CategoryDataMap {
  architecture: ArchitectureCategory;
  furnitureDecor: FurnitureDecorCategory;
  coffeeMachines: CoffeeMachinesCategory;
  menuBoard: MenuBoardCategory;
  musicSource: MusicSourceCategory;
  posters: PostersCategory;
  tableware: TablewareCategory;
  signage: SignageCategory;
  lighting: LightingCategory;
  counterTechnology: CounterTechnologyCategory;
  patrons: PatronsCategory;
}

// ---------------------------------------------------------------------------
// Per-era audio bed config (consumed by systems/AudioEngine.ts)
// ---------------------------------------------------------------------------
// The audio contract is intentionally a sibling of the 11 brief categories
// rather than a 12th entry in CATEGORY_KEYS: audio is not a renderable scene
// fragment (the AssetRegistry iterates CATEGORY_KEYS to build Object3Ds), so
// it lives directly on EraData alongside `year` and `label`.

/** A plain 3D position in scene metres (matches the Three.js coordinate space). */
export interface AudioVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * The playback-medium family of the era's music source. Drives the timbre of
 * the synthesized music bed so the *sonic character* matches the in-scene
 * music-source object (wireless set → jukebox → boombox → iPod → phone).
 */
export type MusicDeviceTimbre =
  | 'am-radio' // 1945 — wireless set, mid-band-limited, slightly staticky
  | 'vinyl-45' // 1965 — jukebox, full-range with surface crackle
  | 'cassette' // 1985 — boombox, rolled-off highs with tape wow/flutter
  | 'digital-mp3' // 2005 — iPod, clean with a gentle high-shelf roll-off
  | 'streaming' // 2025 — phone, curated lofi muffled warmth
  | 'spatial-audio'; // 2055 — adaptive generative, airy and wide

/** Synthesis recipe for the period-appropriate generative music bed. */
export interface EraMusicBedConfig {
  /** Playback-medium family — selects the music-source object timbre. */
  readonly timbre: MusicDeviceTimbre;
  /** Fundamental root note of the generative loop, in Hz. */
  readonly rootFrequency: number;
  /** Scale, as semitone offsets from the root, used to pick melodic notes. */
  readonly scale: readonly number[];
  /** Oscillator waveform for the pad + melodic voices. */
  readonly waveform: OscillatorType;
  /** Melodic note cadence (notes per second). */
  readonly notesPerSecond: number;
  /**
   * Biquad filter that imprints the playback-medium character (e.g. a narrow
   * AM-radio bandpass, or a cassette low-pass).
   */
  readonly mediumFilter: {
    readonly type: BiquadFilterType;
    readonly frequency: number;
    readonly Q: number;
  };
  /** Vinyl-style surface crackle amplitude, 0–1 (0 = none). */
  readonly crackle: number;
  /** Tape wow/flutter pitch-modulation depth, 0–1 (0 = none). */
  readonly wow: number;
  /** Relative loudness of the music bed, 0–1. */
  readonly gain: number;
}

/** Synthesis recipe for the coffee-machine hiss/clatter bed. */
export interface EraCoffeeMachineConfig {
  /** Continuous steam-hiss bed loudness, 0–1. */
  readonly hissGain: number;
  /** Hiss low-pass cutoff in Hz (higher = brighter steam). */
  readonly hissCutoff: number;
  /** Average clatter events per second (cups/spoons/portafilter). */
  readonly clatterRate: number;
  /** Clatter transient loudness, 0–1. */
  readonly clatterGain: number;
}

/** Synthesis recipe for the conversation-murmur bed. */
export interface EraMurmurConfig {
  /** Overall murmur bed loudness, 0–1 (busier eras are louder). */
  readonly gain: number;
  /** Count of overlapping synthesized "voices". */
  readonly voiceCount: number;
}

/**
 * Spatial anchors for the two spatialized sound sources, in scene metres.
 * Coffee-machine and music-source era tasks (Phase 4/5) MUST align their
 * in-scene Object3D positions to these coordinates so the PannerNode-emitted
 * audio matches the visible object. This is the shared position contract.
 */
export interface EraSpatialConfig {
  /** Where the coffee machine sits (typically the back counter). */
  readonly coffeeMachine: AudioVec3;
  /** Where the era's music-source object sits. */
  readonly musicSource: AudioVec3;
}

/** Seconds the ambient beds take to crossfade on an era change. */
export const AUDIO_CROSSFADE_SECONDS = 1.5;

/** Complete synthesis + spatialization recipe for a single era's audio beds. */
export interface EraAudioConfig {
  readonly music: EraMusicBedConfig;
  readonly coffeeMachine: EraCoffeeMachineConfig;
  readonly murmur: EraMurmurConfig;
  readonly spatial: EraSpatialConfig;
  /** Per-era override of the crossfade duration (defaults to the global value). */
  readonly crossfadeSeconds?: number;
}

/**
 * The complete data contract for a single era — every brief category, typed.
 */
export interface EraData {
  year: EraYear;
  label: string;
  /** Synthesis + spatialization recipe for this era's three ambient beds. */
  audio: EraAudioConfig;
  architecture: ArchitectureCategory;
  furnitureDecor: FurnitureDecorCategory;
  coffeeMachines: CoffeeMachinesCategory;
  menuBoard: MenuBoardCategory;
  musicSource: MusicSourceCategory;
  posters: PostersCategory;
  tableware: TablewareCategory;
  signage: SignageCategory;
  lighting: LightingCategory;
  counterTechnology: CounterTechnologyCategory;
  patrons: PatronsCategory;
}

/** Look up the typed data shape for a given category key. */
export type CategoryData<K extends CategoryKey> = CategoryDataMap[K];
