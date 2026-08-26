/**
 * Wall anchor slots for hanging posters.
 *
 * Coordinates are derived from the permanent shell in `CafeScene`:
 * room interior x ∈ [-6, 6], z ∈ [-5, 5], height 3.6 m.
 *
 * - South wall (inner face z = -5): three window openings at x ∈ {-4, 0, 4},
 *   each 1.9 wide between sill y = 0.85 and top y = 2.6 → solid piers at
 *   x ∈ [-3.05, -0.95] and [0.95, 3.05].
 * - East wall (inner face x = +6): two windows at z ∈ {-2.25, 2.25}, each
 *   1.6 wide (spans [-3.05, -1.45] and [1.45, 3.05]) → solid piers around them.
 * - West wall (inner face x = -6): solid except the doorway at
 *   z ∈ [2.675, 3.725] up to y = 2.15.
 * - North wall (inner face z = +5): fully solid — the feature wall.
 *
 * `position` semantics are uniform `[alongWall, height, 0]`; `assemble.ts`
 * converts them to world coordinates using the wall's inner face and normal,
 * pushing the artwork proud of the plaster by its frame depth.
 */

export type PosterWallName = 'north' | 'south' | 'east' | 'west' | 'west-till';

export interface WallSlot {
  id: string;
  wall: PosterWallName;
  /** `[alongWall, height, 0]` — see module doc. */
  position: [number, number, number];
  /** Turns a default plane (+z normal) to face the room interior. */
  rotationY: number;
  /** Largest poster size this slot accepts (metres). */
  maxWidth: number;
  maxHeight: number;
  role?: 'feature' | 'notice' | 'photo' | 'till';
}

/** Interior-facing slots, ordered north feature row first (deterministic fill). */
export const WALL_SLOTS: readonly WallSlot[] = [
  // North feature row (kitchen-side wall).
  { id: 'n1', wall: 'north', position: [-3.7, 1.78, 0], rotationY: Math.PI, maxWidth: 1.5, maxHeight: 2.0, role: 'feature' },
  { id: 'n2', wall: 'north', position: [-1.25, 1.75, 0], rotationY: Math.PI, maxWidth: 1.3, maxHeight: 1.8, role: 'feature' },
  { id: 'n3', wall: 'north', position: [1.25, 1.75, 0], rotationY: Math.PI, maxWidth: 1.3, maxHeight: 1.8, role: 'feature' },
  { id: 'n4', wall: 'north', position: [3.7, 1.78, 0], rotationY: Math.PI, maxWidth: 1.5, maxHeight: 2.0, role: 'feature' },
  // South piers between the three shopfront windows.
  { id: 's1', wall: 'south', position: [-2.0, 1.72, 0], rotationY: 0, maxWidth: 1.7, maxHeight: 1.6, role: 'notice' },
  { id: 's2', wall: 'south', position: [2.0, 1.72, 0], rotationY: 0, maxWidth: 1.7, maxHeight: 1.6, role: 'notice' },
  // East piers beside/between the side-street windows.
  { id: 'e1', wall: 'east', position: [0, 1.75, 0], rotationY: -Math.PI / 2, maxWidth: 1.9, maxHeight: 1.7, role: 'feature' },
  { id: 'e2', wall: 'east', position: [0, 1.6, 4.1], rotationY: -Math.PI / 2, maxWidth: 1.25, maxHeight: 1.55, role: 'notice' },
  { id: 'e3', wall: 'east', position: [0, 1.6, -4.1], rotationY: -Math.PI / 2, maxWidth: 1.25, maxHeight: 1.55, role: 'notice' },
  // West photo cluster (south of the doorway).
  { id: 'wp1', wall: 'west', position: [0, 1.8, -3.05], rotationY: Math.PI / 2, maxWidth: 0.55, maxHeight: 0.65, role: 'photo' },
  { id: 'wp2', wall: 'west', position: [0, 1.62, -2.45], rotationY: Math.PI / 2, maxWidth: 0.55, maxHeight: 0.65, role: 'photo' },
  { id: 'wp3', wall: 'west', position: [0, 1.86, -1.85], rotationY: Math.PI / 2, maxWidth: 0.55, maxHeight: 0.65, role: 'photo' },
  { id: 'w1', wall: 'west', position: [0, 1.7, -0.7], rotationY: Math.PI / 2, maxWidth: 1.35, maxHeight: 1.7, role: 'notice' },
  { id: 'w2', wall: 'west', position: [0, 1.55, 1.15], rotationY: Math.PI / 2, maxWidth: 1.2, maxHeight: 1.5, role: 'notice' },
  // Till corner just north of the door casing (casing ends near z ≈ 3.77).
  { id: 't1', wall: 'west-till', position: [0, 1.45, 4.42], rotationY: Math.PI / 2, maxWidth: 0.6, maxHeight: 0.6, role: 'till' },
  { id: 't2', wall: 'west-till', position: [0, 1.26, 4.04], rotationY: Math.PI / 2, maxWidth: 0.6, maxHeight: 0.75, role: 'till' },
];

const SLOT_BY_ID = new Map(WALL_SLOTS.map((slot) => [slot.id, slot]));

/**
 * Greedily assigns each spec to a free slot that fits its size, honouring the
 * spec's wall preference where possible. Deterministic: identical input order
 * always yields identical placements. Specs that fit nowhere are dropped
 * (authored content always fits by construction).
 */
export function assignSlots(
  specs: ReadonlyArray<{ size: [number, number]; wall?: string }>,
): Array<{ index: number; slotId: string }> {
  const used = new Set<string>();
  const out: Array<{ index: number; slotId: string }> = [];

  const findFree = (
    width: number,
    height: number,
    accept: (slotId: string) => boolean,
  ): string | null => {
    for (const slot of WALL_SLOTS) {
      if (used.has(slot.id) || !accept(slot.id)) continue;
      if (width <= slot.maxWidth && height <= slot.maxHeight) return slot.id;
    }
    return null;
  };

  specs.forEach((spec, index) => {
    const [width, height] = spec.size;
    let slotId: string | null;

    if (spec.wall === 'west-till') {
      slotId = findFree(width, height, (id) => SLOT_BY_ID.get(id)?.wall === 'west-till');
    } else if (spec.wall === 'north' || spec.wall === 'south' || spec.wall === 'east' || spec.wall === 'west') {
      const wanted = spec.wall;
      slotId =
        findFree(width, height, (id) => SLOT_BY_ID.get(id)?.wall === wanted) ??
        findFree(width, height, (id) => SLOT_BY_ID.get(id)?.role !== 'till');
    } else {
      // No preference: fill general slots first, till corner last.
      slotId =
        findFree(width, height, (id) => SLOT_BY_ID.get(id)?.role !== 'till') ??
        findFree(width, height, () => true);
    }

    if (slotId) {
      used.add(slotId);
      out.push({ index, slotId });
    }
  });

  return out;
}

/** Resolves a slot id back to its definition (used by the assembler). */
export function getWallSlot(slotId: string): WallSlot | undefined {
  return SLOT_BY_ID.get(slotId);
}
