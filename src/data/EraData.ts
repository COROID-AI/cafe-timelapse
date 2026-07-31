/**
 * Canonical per-era data contract for the Café Time Period Timelapse.
 *
 * Every era in the timeline (see src/data/eras.ts) must supply an EraData
 * record covering every category of the café, from the architecture itself to
 * the patrons drinking in it. The `check:eras` QA gate (src/scripts/checkEras.ts)
 * enforces that every registered era satisfies every required category.
 */

/** A named coffee machine / brewing device, e.g. "La Pavoni lever machine". */
export interface BrewingEquipment {
  /** Human-readable equipment name. */
  name: string;
  /** Short note on how it is used (fuel, pressure, pour-over, …). */
  method: string;
}

/** A single menu entry with its era-appropriate price. */
export interface MenuItem {
  name: string;
  /** Price as it would be written on the menu board, e.g. "1s 6d" or "$4.50". */
  price: string;
}

/** How the café plays music in this era. */
export type MusicSourceKind =
  | 'wireless-set'
  | 'jukebox'
  | 'boombox'
  | 'ipod'
  | 'phone'
  | 'streaming-speaker';

export interface MusicSource {
  kind: MusicSourceKind;
  label: string;
}

/** A poster or advertisement pinned to the walls. */
export interface Poster {
  title: string;
  description: string;
}

/** A piece of tableware (cup, saucer, cutlery, …). */
export interface Tableware {
  name: string;
  material: string;
}

/** Signage and lighting that set the room's mood. */
export interface SignageLighting {
  sign: string;
  lighting: string;
}

/** The technology behind the counter, from manual till to contactless. */
export interface CounterTechnology {
  device: string;
  /** How payment / orders are handled in this era. */
  method: string;
}

/** A patron's look: outfit, hairstyle and the gadget they carry. */
export interface Patron {
  outfit: string;
  hairstyle: string;
  gadget: string;
}

/**
 * The complete snapshot of one era. Every category from the brief is
 * represented so that future phases can turn these records into scene
 * fragments without guessing.
 */
export interface EraData {
  /** The year this record describes. */
  year: number;

  architecture: {
    walls: string;
    floor: string;
    ceiling: string;
    trim: string;
  };

  furnitureDecor: string[];

  coffeeMachines: BrewingEquipment[];

  menuBoard: {
    title: string;
    items: MenuItem[];
  };

  musicSource: MusicSource;

  posters: Poster[];

  tableware: Tableware[];

  signageLighting: SignageLighting;

  counterTechnology: CounterTechnology;

  patrons: Patron[];
}

/** The set of categories the QA gate requires every era to supply. */
export const REQUIRED_CATEGORIES = [
  'architecture',
  'furnitureDecor',
  'coffeeMachines',
  'menuBoard',
  'musicSource',
  'posters',
  'tableware',
  'signageLighting',
  'counterTechnology',
  'patrons',
] as const;

export type RequiredCategory = (typeof REQUIRED_CATEGORIES)[number];
