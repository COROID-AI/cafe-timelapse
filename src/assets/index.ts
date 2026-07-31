/**
 * Shared procedural asset library — canvas textures, materials, and prop
 * primitives that every era task composes.
 *
 * All assets are procedural (no external image/model files):
 *   - TextureFactory  — canvas-generated textures (wood grains, tile,
 *     wallpaper, neon glow, menu chalkboards, posters) at capped resolution
 *     with caching.
 *   - MaterialFactory — PBR-ish `MeshPhysicalMaterial` surfaces parameterised
 *     by the era palette tokens.
 *   - PropPrimitives  — reusable parametric meshes (table legs, chairs, cups,
 *     machine shells, frames, lamps, signage) that era tasks instance and
 *     configure.
 *   - palettes        — the era palette tokens per year.
 */
export { TextureFactory, textureFactory, mulberry32, shadeHex, clampTextureSize, MAX_TEXTURE_SIZE } from './TextureFactory';
export type { TextureKind, TextureSpec, TextureResult } from './TextureFactory';
export { MaterialFactory, materialFactory, materialFromSpec, eraMaterialSpecs } from './MaterialFactory';
export type { MaterialKind, MaterialSpec, EraMaterialOptions } from './MaterialFactory';
export { PropPrimitives, tableLeg, tableFrame, tableTop, chair, cup, machineShell, frame, pendantLamp, wallLamp, signage } from './PropPrimitives';
export type { PrimitiveOptions, TableLegOptions, TableFrameOptions, TableTopOptions, ChairOptions, CupOptions, MachineShellOptions, FrameOptions, LampOptions, WallLampOptions, SignageOptions } from './PropPrimitives';
export { ERA_PALETTES, paletteFor } from './palettes';
export type { EraPaletteTokens } from './palettes';
