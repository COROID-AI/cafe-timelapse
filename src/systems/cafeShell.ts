/**
 * src/systems/cafeShell.ts — compatibility shim.
 *
 * The canonical café spatial contract now lives in src/world/layout.ts and the
 * persistent room shell in src/world/ArchitectureShell.ts (Phase 3). This
 * module re-exports the same names so earlier phases' imports (the navigation
 * QA gate, main.ts history) keep compiling; new code should import from
 * src/world directly.
 */
import * as THREE from 'three';
import type { CaféBounds } from './Navigation';
import {
  ROOM_BOUNDS,
  ROOM_CENTER,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  WALL_THICKNESS,
} from '../world/layout';
import { buildArchitectureShell } from '../world/ArchitectureShell';

/** @deprecated Use ROOM_BOUNDS from src/world/layout. */
export const CAFÉ_BOUNDS: CaféBounds = ROOM_BOUNDS;

/** @deprecated Use ROOM_CENTER from src/world/layout. */
export const CAFÉ_CENTER: THREE.Vector3 = ROOM_CENTER;

/**
 * @deprecated Use buildArchitectureShell from src/world/ArchitectureShell —
 * the persistent shell builds floor, walls, ceiling, storefront window wall +
 * door, counter zone and seating zone from the canonical layout.
 */
export function buildCaféShell(target: THREE.Group): void {
  buildArchitectureShell(target);
}

export { ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT, WALL_THICKNESS };
