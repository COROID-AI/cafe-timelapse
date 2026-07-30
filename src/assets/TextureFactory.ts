/**
 * TextureFactory.ts — canvas-generated procedural textures.
 *
 * Generates every surface texture the era-build toolkit needs from a 2D
 * `<canvas>`, with **no external image or model files**: wood grain, tile,
 * wallpaper, neon glow, chalkboard, and poster-frame textures (plus a few
 * supporting surfaces — concrete, brick, plaster, fabric).
 *
 * Every generator:
 *   - Is **capped** at {@link MAX_TEXTURE_SIZE} px to bound GPU memory.
 *   - Is **cached** by a composite key of (kind, era year, options hash) so
 *     repeated requests return the same `CanvasTexture` instance instead of
 *     redrawing — a single era's textures are built once and reused across
 *     every instanced prop.
 *   - Is **palette-driven**: pass an {@link EraPalette} and the surface picks
 *     up the era's wood / ceramic / neon / chalk tokens automatically.
 *
 * Era tasks never call `document.createElement('canvas')` themselves; they ask
 * this factory for a texture and receive a ready `THREE.CanvasTexture`.
 */
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from 'three';
import { getEraPalette, type EraPalette } from './EraPalette.js';
import type { EraYear } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Hard cap on the largest texture edge, in px (bounds GPU memory). */
export const MAX_TEXTURE_SIZE = 1024;

/** Default edge length for square textures that do not specify one. */
export const DEFAULT_TEXTURE_SIZE = 512;

/**
 * Kinds of texture this factory can generate. Each maps to a generator below.
 * Kept as a string union so cache keys stay debuggable.
 */
export type TextureKind =
  | 'wood'
  | 'tile'
  | 'wallpaper'
  | 'neonGlow'
  | 'chalkboard'
  | 'posterFrame'
  | 'poster'
  | 'concrete'
  | 'brick'
  | 'plaster'
  | 'fabric';

/** Options common to every texture generator. */
export interface BaseTextureOptions {
  /** Edge length in px (clamped to {@link MAX_TEXTURE_SIZE}). */
  readonly size?: number;
  /** Horizontal repeat count applied to the texture. */
  readonly repeatX?: number;
  /** Vertical repeat count applied to the texture. */
  readonly repeatY?: number;
  /**
   * Whether the texture tiles seamlessly. When true (default for tile/wood),
   * wrapping is set to {@link RepeatWrapping}; otherwise {@link ClampToEdgeWrapping}.
   */
  readonly tile?: boolean;
  /** Deterministic seed so identical options produce identical noise. */
  readonly seed?: number;
}

/** Options for the chalkboard generator (carries the menu text lines). */
export interface ChalkboardTextureOptions extends BaseTextureOptions {
  /** Heading drawn at the top (e.g. the café name). */
  readonly heading?: string;
  /** Menu item lines drawn beneath the heading. */
  readonly items?: readonly string[];
  /** Price strings, aligned right, matched index-for-index to `items`. */
  readonly prices?: readonly string[];
}

/** Options for the poster generator. */
export interface PosterTextureOptions extends BaseTextureOptions {
  /** Title / headline text on the poster. */
  readonly title?: string;
  /** Subtitle / body line. */
  readonly subtitle?: string;
  /** One of the era palette's accent swatches to use as the poster field. */
  readonly swatchIndex?: number;
}

/** The union of option types accepted by {@link TextureFactory.get}. */
export type TextureOptions =
  | BaseTextureOptions
  | ChalkboardTextureOptions
  | PosterTextureOptions;

// ---------------------------------------------------------------------------
// Deterministic PRNG (so seeded textures are reproducible & cache-stable)
// ---------------------------------------------------------------------------

/** Mulberry32 — a tiny, fast, deterministic 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Resolve a possibly-undefined seed into a stable positive integer. */
function resolveSeed(seed: number | undefined): number {
  return seed === undefined ? 1234567 : seed >>> 0;
}

/** Hash a string into a 32-bit integer (FNV-1a) for cache-key derivation. */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Colour helpers (hex number <-> canvas rgba string / components)
// ---------------------------------------------------------------------------

/** Convert a hex colour to an [r,g,b] triplet in 0–255. */
function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

/** Convert a hex colour to an `rgba()` string with the given alpha. */
function rgba(hex: number, alpha = 1): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Linearly interpolate two hex colours, returning an rgb() string. */
function lerpRgb(a: number, b: number, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * clamped);
  const g = Math.round(ag + (bg - ag) * clamped);
  const bl = Math.round(ab + (bb - ab) * clamped);
  return `rgb(${r},${g},${bl})`;
}

/** Clamp a size to the capped maximum, defaulting to 512. */
function clampSize(size: number | undefined): number {
  const s = size ?? DEFAULT_TEXTURE_SIZE;
  return Math.max(64, Math.min(MAX_TEXTURE_SIZE, Math.round(s)));
}

// ---------------------------------------------------------------------------
// Canvas context acquisition (works under jsdom-style test canvases too)
// ---------------------------------------------------------------------------

/**
 * Create a 2D canvas context of the given size. Throws if a 2D context cannot
 * be obtained (e.g. SSR without a canvas polyfill) so callers fail loudly.
 */
function createCanvasContext(
  size: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('TextureFactory: 2D canvas context unavailable.');
  return { canvas, ctx };
}

// ---------------------------------------------------------------------------
// Texture finalisation (repeat, colour space, mip filtering)
// ---------------------------------------------------------------------------

/** Wrap a finished canvas in a CanvasTexture with sensible defaults. */
function finalize(
  canvas: HTMLCanvasElement,
  options: BaseTextureOptions,
): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = options.tile ? RepeatWrapping : ClampToEdgeWrapping;
  texture.wrapT = options.tile ? RepeatWrapping : ClampToEdgeWrapping;
  texture.repeat.set(options.repeatX ?? 1, options.repeatY ?? 1);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ===========================================================================
// GENERATORS
//
// Each generator draws into a fresh canvas sized to the (capped) requested
// size and returns the finished CanvasTexture. They are deterministic given a
// seed + palette + options.
// ===========================================================================

/** 1. Wood grain — vertical streaked fibres with darker veining + knots. */
function generateWood(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  // Base board colour.
  ctx.fillStyle = rgba(p.wood);
  ctx.fillRect(0, 0, size, size);

  // Long vertical grain streaks.
  const streakCount = Math.max(18, Math.floor(size / 16));
  for (let i = 0; i < streakCount; i++) {
    const x = rng() * size;
    const w = 1 + rng() * 5;
    const tint = rng();
    ctx.fillStyle = rgba(
      tint > 0.5 ? p.woodGrain : p.wood,
      0.12 + rng() * 0.18,
    );
    ctx.fillRect(x, 0, w, size);
  }

  // Wavy darker fibres for organic movement.
  const fibreCount = Math.max(40, Math.floor(size / 6));
  ctx.lineWidth = 1;
  for (let i = 0; i < fibreCount; i++) {
    ctx.strokeStyle = rgba(p.woodGrain, 0.05 + rng() * 0.12);
    ctx.beginPath();
    let x = rng() * size;
    ctx.moveTo(x, 0);
    for (let y = 0; y < size; y += 8) {
      x += (rng() - 0.5) * 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // A few knots.
  const knotCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < knotCount; i++) {
    const kx = rng() * size;
    const ky = rng() * size;
    const kr = 4 + rng() * 10;
    const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, kr);
    grad.addColorStop(0, rgba(p.woodGrain, 0.7));
    grad.addColorStop(1, rgba(p.woodGrain, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalize(canvas, { ...o, tile: o.tile ?? true });
}

/** 2. Tile — gridded ceramic/terrazzo tiles with grout lines. */
function generateTile(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  const tiles = o.repeatX ?? 4;
  const cell = size / tiles;
  const grout = Math.max(1, cell * 0.06);

  // Grout background.
  ctx.fillStyle = rgba(lerpHex(p.floor, 0x000000, 0.4));
  ctx.fillRect(0, 0, size, size);

  // Tiles.
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const x = tx * cell + grout / 2;
      const y = ty * cell + grout / 2;
      const w = cell - grout;
      // Slight per-tile tone variation.
      const v = (rng() - 0.5) * 0.16;
      ctx.fillStyle = lerpRgb(p.floor, v < 0 ? 0x000000 : 0xffffff, Math.abs(v));
      ctx.fillRect(x, y, w, w);
      // Subtle specular speckle.
      if (rng() > 0.6) {
        ctx.fillStyle = rgba(0xffffff, 0.05);
        ctx.fillRect(x + rng() * w, y + rng() * w, 2, 2);
      }
    }
  }

  return finalize(canvas, { ...o, tile: true });
}

/** 3. Wallpaper — repeating era-appropriate pattern over the wall base. */
function generateWallpaper(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  // Base wall wash with soft vertical gradient.
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, rgba(lerpHex(p.wall, 0xffffff, 0.08)));
  grad.addColorStop(1, rgba(lerpHex(p.wall, 0x000000, 0.12)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const motif = Math.floor(size / 8);
  const r = motif * 0.28;

  // Diamond + dot motif, period-agnostic but palette-tinted.
  for (let y = 0; y < size + motif; y += motif) {
    for (let x = 0; x < size + motif; x += motif) {
      const ox = (Math.floor(y / motif) % 2) * (motif / 2);
      const cx = x + ox;
      const cy = y;
      ctx.strokeStyle = rgba(p.secondary, 0.35);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = rgba(p.accent, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Faint damask streaks for depth.
  for (let i = 0; i < 60; i++) {
    ctx.strokeStyle = rgba(p.trim, 0.03 + rng() * 0.04);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(rng() * size, 0);
    ctx.lineTo(rng() * size, size);
    ctx.stroke();
  }

  return finalize(canvas, { ...o, tile: true });
}

/** 4. Neon glow — a soft radial bloom for neon tube / signage. */
function generateNeonGlow(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);

  // Transparent base — neon is emissive, used as a glow sprite.
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2;

  // Outer broad bloom.
  const outer = ctx.createRadialGradient(cx, cy, 1, cx, cy, maxR);
  outer.addColorStop(0, rgba(p.neon, 0.95));
  outer.addColorStop(0.25, rgba(p.neon, 0.55));
  outer.addColorStop(0.6, rgba(p.neon, 0.18));
  outer.addColorStop(1, rgba(p.neon, 0));
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, size, size);

  // Hot inner core (near-white at the tube).
  const inner = ctx.createRadialGradient(cx, cy, 1, cx, cy, maxR * 0.18);
  inner.addColorStop(0, rgba(0xffffff, 0.95));
  inner.addColorStop(1, rgba(p.neon, 0));
  ctx.fillStyle = inner;
  ctx.fillRect(0, 0, size, size);

  return finalize(canvas, { ...o, tile: false });
}

/** 5. Chalkboard — slate base with handwritten heading + menu lines. */
function generateChalkboard(
  p: EraPalette,
  o: ChalkboardTextureOptions,
): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  // Slate base with a subtle vertical gradient (lighter at top).
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, rgba(lerpHex(p.chalkboard, 0xffffff, 0.06)));
  grad.addColorStop(1, rgba(p.chalkboard));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Chalk dust smudges.
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = rgba(p.chalk, 0.02 + rng() * 0.04);
    const r = 1 + rng() * 3;
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const chalk = p.chalk;
  ctx.textAlign = 'center';
  ctx.fillStyle = rgba(chalk, 0.92);

  // Heading.
  const heading = o.heading ?? 'MENU';
  const headSize = Math.floor(size * 0.1);
  ctx.font = `bold ${headSize}px "Bradley Hand","Segoe Script",cursive`;
  ctx.shadowColor = rgba(chalk, 0.5);
  ctx.shadowBlur = 4;
  ctx.fillText(heading, size / 2, size * 0.2);
  ctx.shadowBlur = 0;

  // Underline flourish.
  ctx.strokeStyle = rgba(chalk, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.25);
  ctx.lineTo(size * 0.8, size * 0.25);
  ctx.stroke();

  // Menu items.
  const items = o.items ?? [];
  const prices = o.prices ?? [];
  const itemSize = Math.floor(size * 0.052);
  ctx.font = `${itemSize}px "Bradley Hand","Segoe Script",cursive`;
  const rowH = size * 0.1;
  let y = size * 0.36;
  for (let i = 0; i < items.length && y < size * 0.95; i++) {
    ctx.textAlign = 'left';
    ctx.fillText(items[i], size * 0.12, y);
    if (prices[i]) {
      ctx.textAlign = 'right';
      ctx.fillText(prices[i], size * 0.88, y);
    }
    y += rowH;
  }

  return finalize(canvas, { ...o, tile: false });
}

/** 6. Poster — a framed lithograph/pop-art print with title + subtitle. */
function generatePoster(
  p: EraPalette,
  o: PosterTextureOptions,
): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  // Paper substrate.
  ctx.fillStyle = rgba(p.paper);
  ctx.fillRect(0, 0, size, size);

  // Field colour block (era accent swatch).
  const swatch =
    p.accentSwatches[(o.swatchIndex ?? 0) % p.accentSwatches.length];
  const margin = size * 0.08;
  ctx.fillStyle = rgba(swatch, 0.85);
  ctx.fillRect(margin, margin, size - margin * 2, size * 0.5);

  // Graphical flourish — radiating rays from a focal point.
  ctx.save();
  ctx.translate(size / 2, size * 0.33);
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    ctx.fillStyle = rgba(p.accent, 0.25 + rng() * 0.25);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.5) / rays) * Math.PI * 2;
    const rad = size;
    ctx.lineTo(Math.cos(a0) * rad, Math.sin(a0) * rad);
    ctx.lineTo(Math.cos(a1) * rad, Math.sin(a1) * rad);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Title.
  const title = o.title ?? '';
  if (title) {
    ctx.fillStyle = rgba(p.paper);
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(size * 0.11)}px Georgia, serif`;
    ctx.fillText(title, size / 2, size * 0.34);
  }

  // Subtitle band.
  const subtitle = o.subtitle ?? '';
  if (subtitle) {
    ctx.fillStyle = rgba(lerpHex(p.trim, 0x000000, 0.3));
    ctx.fillRect(0, size * 0.62, size, size * 0.1);
    ctx.fillStyle = rgba(p.paper);
    ctx.font = `${Math.floor(size * 0.05)}px Georgia, serif`;
    ctx.fillText(subtitle, size / 2, size * 0.69);
  }

  // Decorative lower border.
  ctx.fillStyle = rgba(p.secondary, 0.7);
  ctx.fillRect(margin, size * 0.82, size - margin * 2, size * 0.03);

  return finalize(canvas, { ...o, tile: false });
}

/** 7. Poster frame — a wooden/metal picture-frame moulding border. */
function generatePosterFrame(
  p: EraPalette,
  o: BaseTextureOptions,
): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  // Frame body.
  ctx.fillStyle = rgba(p.wood);
  ctx.fillRect(0, 0, size, size);

  // Inner bevel (lighter) + outer bevel (darker) for a moulded look.
  const bw = size * 0.14;
  ctx.fillStyle = rgba(lerpHex(p.wood, 0xffffff, 0.18));
  ctx.fillRect(bw, bw, size - bw * 2, size - bw * 2);
  ctx.strokeStyle = rgba(lerpHex(p.wood, 0x000000, 0.35));
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.strokeRect(bw * 0.5, bw * 0.5, size - bw, size - bw);

  // Gold-leaf accent line (signage era cue).
  ctx.strokeStyle = rgba(p.metal, 0.8);
  ctx.lineWidth = Math.max(1, size * 0.008);
  ctx.strokeRect(bw * 0.9, bw * 0.9, size - bw * 1.8, size - bw * 1.8);

  // Grain streaks along the frame members.
  ctx.lineWidth = 1;
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = rgba(p.woodGrain, 0.06 + rng() * 0.1);
    const horiz = rng() > 0.5;
    if (horiz) {
      const y = rng() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    } else {
      const x = rng() * size;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  }

  return finalize(canvas, { ...o, tile: false });
}

/** 8. Concrete — mottled grey with cracks, for polished-concrete floors. */
function generateConcrete(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  ctx.fillStyle = rgba(p.floor);
  ctx.fillRect(0, 0, size, size);

  // Mottle.
  for (let i = 0; i < size; i += 3) {
    for (let j = 0; j < size; j += 3) {
      const v = rng();
      ctx.fillStyle = rgba(
        v > 0.5 ? 0xffffff : 0x000000,
        0.03 + rng() * 0.04,
      );
      ctx.fillRect(i, j, 3, 3);
    }
  }

  // Cracks.
  ctx.strokeStyle = rgba(0x000000, 0.18);
  ctx.lineWidth = 1;
  for (let c = 0; c < 4; c++) {
    ctx.beginPath();
    let x = rng() * size;
    let y = rng() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 12; s++) {
      x += (rng() - 0.5) * 40;
      y += (rng() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return finalize(canvas, { ...o, tile: true });
}

/** 9. Brick — running-bond exposed brick. */
function generateBrick(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  ctx.fillStyle = rgba(0x000000);
  ctx.fillRect(0, 0, size, size);

  const rows = 8;
  const rowH = size / rows;
  const brickW = rowH * 2.2;
  const mortar = Math.max(2, rowH * 0.12);

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brickW / 2);
    for (let x = -brickW; x < size + brickW; x += brickW) {
      const bx = x + offset + mortar / 2;
      const by = r * rowH + mortar / 2;
      const v = (rng() - 0.5) * 0.2;
      ctx.fillStyle = lerpRgb(p.wall, v < 0 ? 0x000000 : 0xffffff, Math.abs(v));
      ctx.fillRect(bx, by, brickW - mortar, rowH - mortar);
    }
  }

  return finalize(canvas, { ...o, tile: true });
}

/** 10. Plaster — soft mottled limewash wall. */
function generatePlaster(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);
  const rng = mulberry32(resolveSeed(o.seed));

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.7,
  );
  grad.addColorStop(0, rgba(lerpHex(p.wall, 0xffffff, 0.06)));
  grad.addColorStop(1, rgba(lerpHex(p.wall, 0x000000, 0.08)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Large soft mottles.
  for (let i = 0; i < 40; i++) {
    const r = 20 + rng() * 60;
    const g = ctx.createRadialGradient(
      rng() * size,
      rng() * size,
      1,
      rng() * size,
      rng() * size,
      r,
    );
    g.addColorStop(0, rgba(rng() > 0.5 ? 0xffffff : 0x000000, 0.04));
    g.addColorStop(1, rgba(0x000000, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  return finalize(canvas, { ...o, tile: true });
}

/** 11. Fabric — woven upholstery texture (for vinyl booths / lounge chairs). */
function generateFabric(p: EraPalette, o: BaseTextureOptions): CanvasTexture {
  const size = clampSize(o.size);
  const { canvas, ctx } = createCanvasContext(size);

  ctx.fillStyle = rgba(p.primary);
  ctx.fillRect(0, 0, size, size);

  // Warp/weft weave.
  const step = Math.max(2, Math.floor(size / 64));
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const checker = ((x / step + y / step) % 2) === 0;
      ctx.fillStyle = rgba(
        checker
          ? lerpHex(p.primary, 0xffffff, 0.08)
          : lerpHex(p.primary, 0x000000, 0.1),
        1,
      );
      ctx.fillRect(x, y, step, step);
    }
  }

  return finalize(canvas, { ...o, tile: true });
}

/** Local hex lerp (number → number) for generators that need a raw value. */
function lerpHex(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * clamped);
  const g = Math.round(ag + (bg - ag) * clamped);
  const bl = Math.round(ab + (bb - ab) * clamped);
  return (r << 16) | (g << 8) | bl;
}

// ---------------------------------------------------------------------------
// Cache + public factory
// ---------------------------------------------------------------------------

/**
 * Composite cache key. Includes the texture kind, era year, and a stable hash
 * of the serialisable option fields so two calls with the same parameters
 * return the identical cached texture.
 */
function cacheKey(
  kind: TextureKind,
  year: EraYear,
  options: TextureOptions,
): string {
  const parts = [
    kind,
    String(year),
    `s${options.size ?? ''}`,
    `rx${options.repeatX ?? ''}`,
    `ry${options.repeatY ?? ''}`,
    `t${options.tile ? 1 : 0}`,
    `sd${options.seed ?? ''}`,
  ];
  // Fold text-bearing options into the hash (narrow the union per field).
  const textParts: string[] = [];
  if ('heading' in options) textParts.push(options.heading ?? '');
  if ('items' in options) textParts.push(JSON.stringify(options.items ?? []));
  if ('prices' in options) textParts.push(JSON.stringify(options.prices ?? []));
  if ('title' in options) textParts.push(options.title ?? '');
  if ('subtitle' in options) textParts.push(options.subtitle ?? '');
  if ('swatchIndex' in options) textParts.push(String(options.swatchIndex ?? 0));
  parts.push(`h${hashString(textParts.join('|'))}`);
  return parts.join('|');
}

/**
 * Shared process-wide texture cache. Keyed by composite cache key so an era's
 * textures are built once and reused by every instanced prop.
 */
const textureCache = new Map<string, CanvasTexture>();

/** Public API surface for the procedural texture toolkit. */
export const TextureFactory = {
  /** The hard cap on any texture edge length. */
  maxSize: MAX_TEXTURE_SIZE,

  /** Number of textures currently held in the cache. */
  get cacheSize(): number {
    return textureCache.size;
  },

  /**
   * Get (creating + caching if absent) a procedural texture of the given kind
   * for the given era. Repeated calls with identical parameters return the
   * same `CanvasTexture` instance.
   */
  get(
    kind: TextureKind,
    year: EraYear,
    options: TextureOptions = {},
  ): CanvasTexture {
    const key = cacheKey(kind, year, options);
    const cached = textureCache.get(key);
    if (cached) return cached;

    const palette = getEraPalette(year);
    let texture: CanvasTexture;
    switch (kind) {
      case 'wood':
        texture = generateWood(palette, options);
        break;
      case 'tile':
        texture = generateTile(palette, options);
        break;
      case 'wallpaper':
        texture = generateWallpaper(palette, options);
        break;
      case 'neonGlow':
        texture = generateNeonGlow(palette, options);
        break;
      case 'chalkboard':
        texture = generateChalkboard(palette, options);
        break;
      case 'posterFrame':
        texture = generatePosterFrame(palette, options);
        break;
      case 'poster':
        texture = generatePoster(palette, options);
        break;
      case 'concrete':
        texture = generateConcrete(palette, options);
        break;
      case 'brick':
        texture = generateBrick(palette, options);
        break;
      case 'plaster':
        texture = generatePlaster(palette, options);
        break;
      case 'fabric':
        texture = generateFabric(palette, options);
        break;
      default: {
        const exhaustive: never = kind;
        throw new Error(`TextureFactory: unhandled kind "${exhaustive}".`);
      }
    }
    texture.name = `tex:${kind}:${year}`;
    textureCache.set(key, texture);
    return texture;
  },

  /** Convenience accessors for the six required texture kinds. */
  wood(year: EraYear, options: BaseTextureOptions = {}): CanvasTexture {
    return this.get('wood', year, options);
  },
  tile(year: EraYear, options: BaseTextureOptions = {}): CanvasTexture {
    return this.get('tile', year, options);
  },
  wallpaper(year: EraYear, options: BaseTextureOptions = {}): CanvasTexture {
    return this.get('wallpaper', year, options);
  },
  neonGlow(year: EraYear, options: BaseTextureOptions = {}): CanvasTexture {
    return this.get('neonGlow', year, options);
  },
  chalkboard(
    year: EraYear,
    options: ChalkboardTextureOptions = {},
  ): CanvasTexture {
    return this.get('chalkboard', year, options);
  },
  posterFrame(year: EraYear, options: BaseTextureOptions = {}): CanvasTexture {
    return this.get('posterFrame', year, options);
  },

  /**
   * Dispose a single cached texture (and drop it from the cache). Use when an
   * era is fully torn down and its unique textures are no longer needed.
   */
  dispose(kind: TextureKind, year: EraYear, options: TextureOptions = {}): void {
    const key = cacheKey(kind, year, options);
    const tex = textureCache.get(key);
    if (tex) {
      tex.dispose();
      textureCache.delete(key);
    }
  },

  /** Dispose every cached texture and clear the cache (e.g. on full reset). */
  disposeAll(): void {
    for (const tex of textureCache.values()) tex.dispose();
    textureCache.clear();
  },
} as const;

// Re-export the Texture type so era tasks can type their texture fields without
// importing three directly (though they may import three themselves).
export type { Texture };
