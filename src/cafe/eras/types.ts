/**
 * Typed data contracts for the Café Time Period Timelapse.
 *
 * `EraYear` fixes the exact five timeline stops offered by the slider, and
 * `EraConfig` is the single source of truth describing every detail category
 * that changes between periods: furniture/décor, coffee machines & brewing
 * equipment, menu board (items + prices), wall posters/advertisements,
 * tableware, signage & lighting, counter technology (manual till → contactless),
 * patron appearance (outfits/hairstyles/gadgets) and ambient mood.
 *
 * Per-year content lives in sibling stub modules (`era-<year>.ts`) that
 * independent era-content tasks fill in. To keep those tasks merge-conflict-free
 * the nine category fields on `EraConfig` are required slots, while EVERYTHING
 * nested inside a category is optional: a content task populates only the keys
 * it owns and never needs to edit this shared contract again.
 */

/** The exact timeline stops offered by the era slider — no other years. */
export type EraYear = 1945 | 1965 | 1985 | 2005 | 2025;

/** Stable cross-reference id (e.g. linking a menu item to its price row). */
export type ItemId = string;

/** Base shape shared by most catalogue entries across categories. */
export interface DescribedItem {
  /** Stable id so cross-category references stay possible. */
  id?: ItemId;
  /** Short human-readable label (UI tooltips, debug overlay). */
  label?: string;
  /** Longer free-form description used when modelling/rendering the detail. */
  description?: string;
}

/* ------------------------------------------------------------------ *
 * Category: furniture & décor                                        *
 * ------------------------------------------------------------------ */

/** One piece of furniture (chairs, tables, booths, shelving…). */
export interface FurniturePiece extends DescribedItem {
  /** Style flavour text, e.g. "bentwood Thonet", "mid-century teak". */
  stylePeriod?: string;
  material?: string;
  color?: string;
  quantity?: number;
}

/** Décor dressing that is not furniture (plants, clocks, curios…). */
export interface DecorItem extends DescribedItem {
  /** Rough anchor point, e.g. "wall", "counter", "window sill", "ceiling". */
  placement?: string;
  color?: string;
}

export interface FurnitureConfig {
  furniture?: FurniturePiece[];
  decor?: DecorItem[];
  /** Floor covering, e.g. "oak parquet", "checkerboard lino". */
  flooring?: string;
  /** Walls: paint, wallpaper, wood panelling… */
  wallFinish?: string;
  ceilingTreatment?: string;
  /** Dominant swatches (hex or names) defining the era look. */
  colorPalette?: string[];
}

/* ------------------------------------------------------------------ *
 * Category: coffee machines & brewing equipment                      *
 * ------------------------------------------------------------------ */

/** A coffee/brewing appliance at or behind the counter. */
export interface BrewingAppliance extends DescribedItem {
  /** e.g. "lever espresso machine", "percolator", "bean-to-cup system". */
  kind?: string;
  /** Real-world flavour text, e.g. "Faema E61". */
  brandModel?: string;
  /** "gas", "electric", "induction"… */
  powerSource?: string;
  /** e.g. "counter", "back bar", "under-counter fridge". */
  placement?: string;
}

export interface BrewingEquipmentConfig {
  espressoMachines?: BrewingAppliance[];
  /** Percolators, moka pots, filter brewers, kettles… */
  otherBrewers?: BrewingAppliance[];
  grinder?: BrewingAppliance;
  /** How drinks are actually prepared and served in this era. */
  preparationNotes?: string;
}

/* ------------------------------------------------------------------ *
 * Category: menu board (items + prices)                              *
 * ------------------------------------------------------------------ */

/** An item listed on the menu board. */
export interface MenuItem extends DescribedItem {
  /** "coffee", "tea", "cold drinks", "food"… */
  category?: string;
}

/** Price row for one menu item, kept period-correct. */
export interface MenuPrice {
  /** References the matching {@link MenuItem.id}. */
  itemId?: ItemId;
  /** Numeric amount in the era's smallest common unit. */
  amount?: number;
  /** Period-correct rendering, e.g. "$0.05", "1/6d", "£2.40". */
  display?: string;
  /** Currency context note, e.g. "pre-decimal GBP", "US cents". */
  currencyNote?: string;
}

export interface MenuBoardConfig {
  /** e.g. "hand-chalked slate", "backlit plastic letters", "LCD panels". */
  boardStyle?: string;
  items?: MenuItem[];
  prices?: MenuPrice[];
  /** Era flavour such as "no oranges — still rationed". */
  specialsNote?: string;
}

/* ------------------------------------------------------------------ *
 * Category: wall posters & advertisements                            *
 * ------------------------------------------------------------------ */

/** A poster, advertisement or framed print on the walls. */
export interface WallPoster extends DescribedItem {
  /** "advert", "public information", "event", "art print"… */
  kind?: string;
  /** Big text readable on the poster texture. */
  headline?: string;
  brand?: string;
  palette?: string[];
  /** Which wall, or what it hangs above. */
  placement?: string;
}

export interface PostersConfig {
  posters?: WallPoster[];
  /** "gilt frames", "clip rails", "frameless acrylic"… */
  framingStyle?: string;
  /** Sparse and tasteful vs plastered wall-to-wall. */
  densityNote?: string;
}

/* ------------------------------------------------------------------ *
 * Category: tableware                                                *
 * ------------------------------------------------------------------ */

/** Cups, saucers, plates, cutlery, sugar bowls… */
export interface TablewarePiece extends DescribedItem {
  /** "bone china", "melamine", "paper", "thick glass"… */
  material?: string;
  pattern?: string;
  /** e.g. "chipped wartime reuse", "pristine". */
  condition?: string;
}

export interface TablewareConfig {
  pieces?: TablewarePiece[];
  /** "waitress table service", "self-serve cafeteria trays"… */
  servingStyle?: string;
  /** Cloth vs paper napkins, holders, dispensers. */
  napkinNote?: string;
}

/* ------------------------------------------------------------------ *
 * Category: signage & lighting                                       *
 * ------------------------------------------------------------------ */

/** A sign: neon, painted fascia, chalkboard A-board, digital screen… */
export interface SignageElement extends DescribedItem {
  /** "neon tube", "hand-painted wood", "LED ticker"… */
  type?: string;
  text?: string;
  placement?: string;
  animated?: boolean;
}

/** One light fixture contributing to the era look. */
export interface LightFixture extends DescribedItem {
  /** "bare incandescent bulb", "fluorescent tube", "smart LED panel"… */
  type?: string;
  colorTemperatureK?: number;
  /** Relative brightness 0..1. */
  intensity?: number;
  color?: string;
  placement?: string;
}

export interface SignageLightingConfig {
  signage?: SignageElement[];
  fixtures?: LightFixture[];
  /** Overall light mood, e.g. "warm smoky glow", "bright fluorescent hum". */
  overallMood?: string;
  daylightNote?: string;
}

/* ------------------------------------------------------------------ *
 * Category: counter technology (manual till → contactless)           *
 * ------------------------------------------------------------------ */

/** Till / payment hardware at the counter. */
export interface CounterDevice extends DescribedItem {
  /** "brass manual till", "electronic POS", "contactless card reader"… */
  kind?: string;
  /** "cash", "cheque", "card", "contactless", "phone wallet"… */
  supportsPayment?: string[];
  placement?: string;
}

export interface CounterTechConfig {
  till?: CounterDevice;
  /** Card terminals, tip jars, loyalty tablets… */
  additionalDevices?: CounterDevice[];
  /** "handwritten pad", "dot-matrix roll", "email receipt"… */
  receiptMethod?: string;
  queueFlowNote?: string;
}

/* ------------------------------------------------------------------ *
 * Category: patron appearance (outfits/hairstyles/gadgets)           *
 * ------------------------------------------------------------------ */

/** What the customers wear. */
export interface PatronOutfit extends DescribedItem {
  /** "factory worker", "city professional", "student"… */
  archetype?: string;
  garments?: string[];
  palette?: string[];
}

/** Period hairstyles seen in the room. */
export interface PatronHairstyle extends DescribedItem {
  styleName?: string;
  /** "men", "women", "children", "all". */
  appliesTo?: string;
}

/** Gadgets patrons carry or use at their tables. */
export interface PatronGadget extends DescribedItem {
  /** "newspaper", "transistor radio", "Walkman", "flip phone", "smartphone"… */
  device?: string;
  /** How it is held/used, for posing characters. */
  usagePose?: string;
}

export interface PatronsConfig {
  outfits?: PatronOutfit[];
  hairstyles?: PatronHairstyle[];
  gadgets?: PatronGadget[];
  /** Rough number of patrons to stage in the scene. */
  headcountHint?: number;
  /** "reading a broadsheet", "jitterbugging", "filming a vlog"… */
  activityNotes?: string[];
}

/* ------------------------------------------------------------------ *
 * Category: ambient mood                                             *
 * ------------------------------------------------------------------ */

/** Music: what plays and from which period-correct device. */
export interface MusicConfig {
  /** "wireless set", "jukebox", "boombox", "iPod dock", "phone speaker"… */
  source?: string;
  genre?: string;
  trackIdeas?: string[];
  /** Background level hint 0..1. */
  volumeHint?: number;
}

export interface AmbientMoodConfig {
  music?: MusicConfig;
  /** "murmur of conversation", "steam hiss", "till drawer clang"… */
  soundscape?: string[];
  scent?: string;
  /** Pacing of life, e.g. "slow post-war recovery" vs "always-on hustle". */
  paceNote?: string;
  /** Scene-wide colour grade for emotional tone. */
  colorGrade?: string;
}

/* ------------------------------------------------------------------ *
 * Root contract                                                      *
 * ------------------------------------------------------------------ */

/**
 * Complete per-year configuration.
 *
 * The nine category fields are REQUIRED so every registry entry has a slot for
 * each detail the user asked for; all nested fields stay OPTIONAL so parallel
 * era-content tasks can fill in disjoint keys without editing shared types.
 */
export interface EraConfig {
  year: EraYear;
  /** Short era name, e.g. "Austerity & Recovery". */
  title?: string;
  /** One-line summary of the period feel. */
  summary?: string;
  furniture: FurnitureConfig;
  brewingEquipment: BrewingEquipmentConfig;
  menuBoard: MenuBoardConfig;
  posters: PostersConfig;
  tableware: TablewareConfig;
  signageLighting: SignageLightingConfig;
  counterTech: CounterTechConfig;
  patrons: PatronsConfig;
  ambientMood: AmbientMoodConfig;
}
