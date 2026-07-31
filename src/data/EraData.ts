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

/** Silhouette of a patron's hairstyle (built from primitives by the avatar system). */
export type HairstyleKind =
  | 'short'
  | 'bob'
  | 'beehive'
  | 'bouffant'
  | 'beret'
  | 'cap'
  | 'ponytail'
  | 'bun'
  | 'braids'
  | 'curls'
  | 'waves'
  | 'messy'
  | 'buzz';

/** Object a patron holds or wears (built from primitives by the avatar system). */
export type AccessoryKind =
  | 'book'
  | 'purse'
  | 'case'
  | 'mirror'
  | 'radio'
  | 'walkman'
  | 'calculator'
  | 'phone'
  | 'laptop'
  | 'headphones'
  | 'cup'
  | 'glasses'
  | 'wristband'
  | 'cigarette'
  | 'tie'
  | 'none';

/** Garment silhouette used to shape the avatar's torso. */
export type OutfitStyle = 'shirt-pants' | 'dress' | 'poncho' | 'jumpsuit';

/**
 * PatronConfig — the structured per-era patron contract consumed by the shared
 * CharacterAvatar system (src/world/characters/CharacterAvatar.ts).
 *
 * Unlike the descriptive {@link Patron} record (free-text outfit/hairstyle/
 * gadget), PatronConfig is directly renderable: body palette colours, a
 * hairstyle shape + colour, outfit garment colours, and a held/worn accessory.
 * Era patron tasks author one config per seated patron; the shared system
 * builds the stylised figure, animates it, and seats it at the café anchors.
 */
export interface PatronConfig {
  /** Optional display name, e.g. "beatnik". */
  name?: string;
  /** Skin colour (CSS hex). */
  skin: string;
  /** Hairstyle shape and colour (CSS hex). */
  hair: {
    kind: HairstyleKind;
    color: string;
  };
  /** Torso/upper garment colour (CSS hex). */
  shirt: string;
  /** Legs/lower garment colour (CSS hex). */
  pants: string;
  /** Footwear colour (CSS hex). */
  shoes: string;
  /** Garment silhouette. Defaults to 'shirt-pants'. */
  style?: OutfitStyle;
  /** Accent colour for accessories/trims (CSS hex). */
  accent?: string;
  /** Held or worn gadget/accessory. Defaults to 'none'. */
  accessory?: AccessoryKind;
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
