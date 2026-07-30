/**
 * index.ts — barrel entry point for the shared procedural asset library.
 *
 * This module is the single import surface era tasks use to compose the café's
 * reusable visual language. It re-exports the three factories plus the era
 * palette tokens, so a downstream era task writes:
 *
 *   import {
 *     TextureFactory,
 *     MaterialFactory,
 *     PropPrimitives,
 *     getEraPalette,
 *   } from '../assets/index.js';
 *
 * Everything is **procedural** — no external image or model files are loaded.
 * The three layers compose:
 *
 *   1. {@link EraPalette} (era palette tokens) — the per-year colour identity.
 *   2. {@link TextureFactory} — canvas-generated textures (wood, tile, wallpaper,
 *      neon glow, chalkboard, poster-frame, …), capped at 1024px and cached.
 *   3. {@link MaterialFactory} — PBR-ish Three.js materials parameterized by the
 *      era palette (wood, metal, ceramic, neon, glass, …), cached.
 *   4. {@link PropPrimitives} — parametric mesh builders (tables, chairs, cups,
 *      machine shells, frames, lamps, signage) that instance and configure the
 *      materials + textures above.
 *
 * Era tasks **consume** these factories; they must **not redefine** them. This
 * guarantees six eras share one consistent visual language and avoids every era
 * rebuilding its own primitives.
 */
export {
  ERA_PALETTES,
  ERA_PALETTE_LIST,
  getEraPalette,
  lerpColor,
  darken,
  lighten,
  type EraPalette,
} from './EraPalette.js';

export {
  TextureFactory,
  MAX_TEXTURE_SIZE,
  DEFAULT_TEXTURE_SIZE,
  type TextureKind,
  type BaseTextureOptions,
  type ChalkboardTextureOptions,
  type PosterTextureOptions,
  type TextureOptions,
} from './TextureFactory.js';

export {
  MaterialFactory,
  type MaterialRole,
  type MaterialOptions,
} from './MaterialFactory.js';

export {
  PropPrimitives,
  buildTable,
  buildChair,
  buildCup,
  buildMachineShell,
  buildFrame,
  buildLamp,
  buildSignage,
  type BasePropOptions,
  type TableOptions,
  type TableLegStyle,
  type ChairOptions,
  type CupOptions,
  type CupKind,
  type MachineOptions,
  type MachineStyle,
  type FrameOptions,
  type LampOptions,
  type LampStyle,
  type SignageOptions,
  type SignageStyle,
} from './PropPrimitives.js';
