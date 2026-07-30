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

/**
 * The complete data contract for a single era — every brief category, typed.
 */
export interface EraData {
  year: EraYear;
  label: string;
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
