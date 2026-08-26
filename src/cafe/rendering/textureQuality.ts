import type * as THREE from 'three';

/**
 * Scene-wide texture sampling quality.
 *
 * Procedural canvas textures (menu boards, posters, neon signage) are read at
 * grazing angles all the time — a chalk menu seen from the counter, posters
 * along the side wall — where bilinear/trilinear filtering alone turns lettering
 * into mush. Anisotropic filtering fixes that for close-up navigation at a
 * negligible bandwidth cost.
 *
 * {@link configureTextureQuality} is called once by the app shell right after
 * the renderer is created; every texture factory then reads the configured
 * level instead of hardcoding one. Headless environments (vitest in plain
 * node) never configure a renderer, so they keep the safe default of 4.
 */

/** Fallback used before any renderer exists (tests, headless builds). */
const DEFAULT_ANISOTROPY = 4;

/** Upper bound — beyond this the quality/bandwidth trade-off flattens out. */
const MAX_ANISOTROPY_CAP = 16;

let anisotropyLevel = DEFAULT_ANISOTROPY;

/**
 * Captures the renderer's supported anisotropy once. Called by the app shell
 * immediately after `WebGLRenderer` construction so every later texture mint
 * picks up real device capability.
 */
export function configureTextureQuality(renderer: THREE.WebGLRenderer): void {
  const supported = renderer.capabilities.getMaxAnisotropy();
  if (!Number.isFinite(supported) || supported <= 0) return;
  anisotropyLevel = Math.min(MAX_ANISOTROPY_CAP, Math.max(DEFAULT_ANISOTROPY, supported));
}

/** Currently configured anisotropy level (≥ 4 always). */
export function textureAnisotropy(): number {
  return anisotropyLevel;
}

/**
 * Applies scene-standard filtering quality to a freshly created texture.
 * Returns the texture for fluent factory returns.
 */
export function applyTextureQuality<T extends THREE.Texture>(texture: T): T {
  texture.anisotropy = anisotropyLevel;
  return texture;
}
