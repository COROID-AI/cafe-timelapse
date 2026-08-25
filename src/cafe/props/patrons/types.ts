/**
 * Typed contracts for the `patrons` prop group.
 *
 * Every era prebuilds a small cast of stylised, low-poly seated figures whose
 * outfits, hairstyles and table gadgets come straight from the request's
 * period-detail list. Specs stay declarative so the era variant files remain
 * pure data and {@link ./figures.ts} turns them into geometry.
 */

/** The five timeline stops this group renders patron casts for. */
export type PatronEraYear = 1945 | 1965 | 1985 | 2005 | 2025;

/** Runtime list of {@link PatronEraYear} values, chronological. */
export const PATRON_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

/**
 * Subtle looping idle animations. All amplitudes are deliberately tiny — a
 * frozen mid-pose frame must never poke a limb through a chair, table or
 * neighbour (which is exactly what happens while transitions hold poses).
 */
export type PatronIdleKind =
  /** Slow head yaw sweeps, as patrons look around the room. */
  | 'headTurn'
  /** Periodic right-arm raise bringing a cup towards the face. */
  | 'sip'
  /** Periodic head-drop towards a handheld screen (phone glance loop). */
  | 'phoneGlance';

/** Hairstyles built by `hairstyles.ts`, keyed per era look. */
export type HairStyleId =
  | 'victoryRolls' // 1945 women — rolled sections pinned along the crown.
  | 'rafSidePart' // 1945 men — neat short side part (RAF style).
  | 'modBowl' // 1965 — sleek bob/bowl with blunt fringe.
  | 'modCrop' // 1965 — tight geometric crop.
  | 'bigPerm' // 1985 — voluminous chemically-curled cloud.
  | 'shortPerm' // 1985 — tighter permed crop.
  | 'frostedTips' // 2005 — spiky tips bleached lighter.
  | 'emoFringe' // 2005 — long side-swept fringe over one eye.
  | 'topBun' // 2025 — slicked bun on the crown.
  | 'naturalCurls'; // 2025 — defined curl cluster.

/** Gadgets/props built by `gadgets.ts`. */
export type GadgetDeviceId =
  | 'teacup'
  | 'newspaper'
  | 'pipe'
  | 'transistorRadio'
  | 'walkman'
  | 'boombox'
  | 'flipPhone'
  | 'earbudCord'
  | 'laptop'
  | 'smartphone'
  | 'wirelessEarbuds'
  | 'laptopTablet'
  | 'eReader';

/** Where a gadget lives on/around the figure. */
export type GadgetMount =
  /** Held loosely in the right hand at rest (cup, pipe). */
  | 'rightHand'
  /** Raised in the right hand — pairs with the `phoneGlance`/`sip` loops. */
  | 'screen'
  /** Held up with both hands (broadsheet, e-reader). */
  | 'bothHands'
  /** Resting on the tabletop in front of the figure. */
  | 'table'
  /** Attached to head/torso (headphones, earbuds, cords). */
  | 'worn'
  /** Resting on its own counter stool beside the figure (1985 boombox). */
  | 'stool';

/** Garment colours for one figure (stylised colour blocking, no textures). */
export interface PatronOutfitSpec {
  /** Stable id, e.g. `wool-suit-charcoal`. */
  id: string;
  /** Human-readable outfit note stamped into `userData` for debugging. */
  label: string;
  /** Jacket / dress / tee / knit colour. */
  top: string;
  /** Trousers / skirt / jeans colour (falls back to a neutral). */
  bottom?: string;
  /** Tie / stripe / trim accent colour. */
  accent?: string;
}

/** One seat assignment. */
export type PatronSeatRef =
  | { kind: 'table'; table: number; chair: number }
  | { kind: 'counterStool' };

/** Declarative description of one stylised patron. */
export interface PatronFigureSpec {
  /** Stable id used in object names (`patron-figure-<era>-<id>`). */
  id: string;
  /** Debug label, e.g. `woman · victory rolls · floral tea dress`. */
  label: string;
  /** Skin tone hex. */
  skin: string;
  hairstyle: HairStyleId;
  hairColor: string;
  outfit: PatronOutfitSpec;
  /** Optional extra head detail (only `rafMustache` is implemented). */
  facialHair?: 'rafMustache';
  /** 1985 power jackets get exaggerated shoulder-pad blocks. */
  shoulderPads?: boolean;
  /** Neon windbreakers get a contrast chest stripe from `outfit.accent`. */
  accentStripe?: boolean;
  /** Sleeve length; bare forearms for tees/knits/hoodies. Default `long`. */
  sleeves?: 'long' | 'short';
  /** Shoe colour (defaults to a period-neutral dark). */
  shoes?: string;
  gadget?: GadgetDeviceId;
  gadgetMount?: GadgetMount;
  idle: PatronIdleKind;
  seat: PatronSeatRef;
}

/** Full cast for one era (4–6 figures per the task brief). */
export type PatronCastSpec = readonly PatronFigureSpec[];
