/**
 * TextureFactory — deterministic, canvas-generated textures at capped
 * resolution with caching.
 *
 * Every texture is procedural: no image assets are loaded. A texture is
 * identified by a `TextureSpec` key so repeated requests return the exact same
 * `CanvasTexture` (plus its offscreen canvas) without re-drawing. Cached
 * textures and canvases are owned by the factory and can be released in bulk
 * with `releaseAll()`.
 *
 * The factory is fully headless-safe: when no DOM canvas is available it falls
 * back to `document.createElement('canvas')`, and a `getContext` that returns
 * null is treated as a draw-no-op so the texture still exists and can be
 * sampled (useful for QA gates that run outside a browser).
 *
 * Texture kinds (from the shared-asset brief):
 *   - woodGrain   — parallel plank grain with subtle knots
 *   - tile        — checkerboard / chequer linoleum or terrazzo
 *   - wallpaper   — repeating damask / stencil pattern
 *   - neon        — soft emissive glow for neon tubes / signs
 *   - chalkboard  — menu chalkboard with a chalk-stroke border
 *   - poster      — flat poster art with title bar and motif
 */
import * as THREE from 'three';

/** Hard cap for generated texture resolution. */
export const MAX_TEXTURE_SIZE = 512;

export type TextureKind =
  | 'woodGrain'
  | 'tile'
  | 'wallpaper'
  | 'geometric'
  | 'neon'
  | 'chalkboard'
  | 'letterboard'
  | 'poster'
  | 'brick'
  | 'digitalMenu';

/** Draw options shared by every texture kind. */
export interface TextureSpec {
  kind: TextureKind;
  /** Base colour used by the pattern (CSS hex). Default '#8a7a68'. */
  color?: string;
  /** Secondary colour (checks, knots, strokes). Default derived per kind. */
  color2?: string;
  /** Square resolution in pixels, clamped to [8, MAX_TEXTURE_SIZE]. */
  size?: number;
  /** Repeat factor per texture tile (tile/wallpaper). Default 4. */
  repeats?: number;
  /** Rotation of the pattern in radians (tile/wood). Default 0. */
  rotation?: number;
  /** Title text for poster textures. Default 'POSTER'. */
  title?: string;
  /** Rows of text for letterboard textures (plastic changeable-letter boards). */
  lines?: string[];
}

export interface TextureResult {
  /** The cached canvas texture (colorSpace SRGB, RepeatWrapping). */
  texture: THREE.CanvasTexture;
  /** The offscreen canvas the texture was drawn onto. */
  canvas: HTMLCanvasElement;
  /** True when the canvas 2D context was unavailable (draw skipped). */
  blank: boolean;
}

/** Deterministic PRNG so identical specs produce identical textures. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSpec(spec: TextureSpec): string {
  const safe = (v: string | number | undefined): string =>
    v === undefined ? '' : String(v);
  return [
    spec.kind,
    safe(spec.color),
    safe(spec.color2),
    safe(spec.size),
    safe(spec.repeats),
    safe(spec.rotation),
    safe(spec.title),
    safe(spec.lines?.join('\n')),
  ].join('|');
}

/** Clamp a resolution to the factory cap. */
export function clampTextureSize(size: number): number {
  return Math.max(8, Math.min(Math.round(size), MAX_TEXTURE_SIZE));
}

function normalizeHex(color: string): number {
  const hex = color.replace('#', '');
  const value =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const parsed = Number.parseInt(value, 16);
  return Number.isNaN(parsed) ? 0x8a7a68 : parsed;
}

function hexToCss(color: string): string {
  const value = normalizeHex(color);
  return `#${value.toString(16).padStart(6, '0')}`;
}

/** Lighten/darken a hex colour by a factor in [-1, 1]. */
export function shadeHex(color: string, factor: number): string {
  const value = normalizeHex(color);
  const r = Math.round(((value >> 16) & 0xff) * (1 + factor));
  const g = Math.round(((value >> 8) & 0xff) * (1 + factor));
  const b = Math.round((value & 0xff) * (1 + factor));
  return `#${((Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b))
    .toString(16)
    .padStart(6, '0')}`;
}

function createCanvas(size: number): HTMLCanvasElement {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    return document.createElement('canvas');
  }
  // Headless fallback: a bare object with the canvas surface contract. The
  // 2D context is unavailable, so drawing is skipped and the texture is blank
  // (still usable by headless QA gates and renderer-independent code).
  return { width: size, height: size, getContext: () => null } as unknown as HTMLCanvasElement;
}

function prepareCanvas(
  canvas: HTMLCanvasElement,
  size: number,
): CanvasRenderingContext2D | null {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  return ctx;
}

/** Draw a soft radial glow into a square canvas (neon textures). */
function drawGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string,
  alpha: number,
): void {
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

function drawWoodGrain(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const base = hexToCss(spec.color ?? '#8a6a4a');
  const dark = hexToCss(spec.color2 ?? '#5a432e');
  const random = mulberry32(normalizeHex(base));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  // Plank joints every ~64px plus curved grain lines.
  const plank = Math.max(32, Math.round(size / 4));
  for (let x = plank; x < size; x += plank) {
    ctx.strokeStyle = shadeHex(base, -0.28);
    ctx.lineWidth = Math.max(1, size / 256);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size);
    ctx.stroke();
  }
  for (let i = 0; i < size; i += 1) {
    const y = i + 0.5;
    const drift = Math.sin(i * 0.045 + random() * 6.28) * (size / 110);
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.12 + random() * 0.12;
    ctx.lineWidth = Math.max(0.6, size / 384);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(size * 0.5, y + drift * 2, size, y + random() * 2 - 1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Occasional soft knots.
  for (let k = 0; k < 3; k += 1) {
    const kx = random() * size;
    const ky = random() * size;
    const r = size / 48 + random() * size / 36;
    const ring = ctx.createRadialGradient(kx, ky, 0, kx, ky, r * 2);
    ring.addColorStop(0, dark);
    ring.addColorStop(0.55, base);
    ring.addColorStop(1, dark);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(kx, ky, r * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const a = hexToCss(spec.color ?? '#E8E0D0');
  const b = hexToCss(spec.color2 ?? '#3A3026');
  const repeats = Math.max(1, Math.round(spec.repeats ?? 4));
  const cell = size / repeats;
  for (let row = 0; row < repeats; row += 1) {
    for (let col = 0; col < repeats; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? a : b;
      ctx.fillRect(col * cell, row * cell, cell + 0.5, cell + 0.5);
    }
  }
  // Subtle grout highlight lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = Math.max(0.6, size / 320);
  for (let i = 0; i <= repeats; i += 1) {
    const p = i * cell + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }
}

function drawWallpaper(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const base = hexToCss(spec.color ?? '#E8B79A');
  const motif = hexToCss(spec.color2 ?? '#7A2436');
  const repeats = Math.max(1, Math.round(spec.repeats ?? 3));
  const cell = size / repeats;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = motif;
  ctx.fillStyle = motif;
  ctx.lineWidth = Math.max(0.8, size / 220);
  for (let row = 0; row < repeats; row += 1) {
    for (let col = 0; col < repeats; col += 1) {
      const cx = col * cell + cell / 2;
      const cy = row * cell + cell / 2;
      const r = cell * 0.3;
      // Damask-style four-petal flower with a centre dot.
      for (let petal = 0; petal < 4; petal += 1) {
        const angle = (petal * Math.PI) / 2;
        const px = cx + Math.cos(angle) * r * 0.6;
        const py = cy + Math.sin(angle) * r * 0.6;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shadeHex(motif, 0.15);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = motif;
    }
  }
}

function drawGeometric(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const base = hexToCss(spec.color ?? '#EFE3B6');
  const motif = hexToCss(spec.color2 ?? '#C94F3D');
  const repeats = Math.max(1, Math.round(spec.repeats ?? 3));
  const cell = size / repeats;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = motif;
  ctx.lineWidth = Math.max(0.8, size / 260);
  for (let row = 0; row < repeats; row += 1) {
    for (let col = 0; col < repeats; col += 1) {
      const cx = col * cell + cell / 2;
      const cy = row * cell + cell / 2;
      // Mid-century atomic starburst: an outer ring, eight rays and a dot.
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.34, 0, Math.PI * 2);
      ctx.stroke();
      for (let ray = 0; ray < 8; ray += 1) {
        const angle = (ray / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * cell * 0.12, cy + Math.sin(angle) * cell * 0.12);
        ctx.lineTo(cx + Math.cos(angle) * cell * 0.3, cy + Math.sin(angle) * cell * 0.3);
        ctx.stroke();
      }
      ctx.fillStyle = motif;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = motif;
    }
  }
}

function drawNeon(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const color = hexToCss(spec.color ?? '#FF5AC8');
  const dark = hexToCss(spec.color2 ?? '#1F2428');
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, size, size);
  // Tube with rounded caps.
  const inset = size * 0.16;
  const tubeY = size * 0.5;
  const tubeR = Math.max(2, size / 28);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Soft outer glow, then the bright tube core.
  for (let pass = 0; pass < 3; pass += 1) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.18 - pass * 0.05;
    ctx.lineWidth = tubeR * (7 - pass * 2);
    ctx.beginPath();
    ctx.moveTo(inset, tubeY);
    ctx.lineTo(size - inset, tubeY);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = tubeR;
  ctx.beginPath();
  ctx.moveTo(inset, tubeY);
  ctx.lineTo(size - inset, tubeY);
  ctx.stroke();
  ctx.strokeStyle = '#FFFFFF';
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = tubeR * 0.35;
  ctx.beginPath();
  ctx.moveTo(inset, tubeY);
  ctx.lineTo(size - inset, tubeY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Subtle reflection on the backing surface.
  drawGlow(ctx, size / 2, tubeY, size * 0.55, color, 0.22);
}

function drawChalkboard(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const board = hexToCss(spec.color ?? '#2F3B31');
  const chalk = hexToCss(spec.color2 ?? '#F4EFE6');
  const random = mulberry32(normalizeHex(board));
  ctx.fillStyle = board;
  ctx.fillRect(0, 0, size, size);
  // Chalk dust texture.
  for (let i = 0; i < 1400; i += 1) {
    ctx.globalAlpha = 0.05 + random() * 0.1;
    ctx.fillStyle = chalk;
    ctx.fillRect(random() * size, random() * size, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
  // Chalk frame border.
  const inset = size * 0.08;
  ctx.strokeStyle = chalk;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = Math.max(1.5, size / 90);
  ctx.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
  ctx.globalAlpha = 1;
  // Title scribble.
  ctx.fillStyle = chalk;
  ctx.globalAlpha = 0.9;
  ctx.font = `bold ${Math.max(10, size / 7)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.title ?? 'MENU', size / 2, size / 2);
  ctx.globalAlpha = 1;
}

function drawLetterboard(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const board = hexToCss(spec.color ?? '#1F2428');
  const letters = hexToCss(spec.color2 ?? '#FFFFFF');
  const lines = spec.lines && spec.lines.length > 0 ? spec.lines : ['COFFEE 20', 'ESPRESSO 25', 'CAPPUCCINO 30', 'DONUT 20', 'PIE 25'];
  ctx.fillStyle = board;
  ctx.fillRect(0, 0, size, size);
  // Grooves between the changeable-letter rows.
  ctx.strokeStyle = shadeHex(board, 0.18);
  ctx.lineWidth = Math.max(0.8, size / 240);
  const rowGap = size / (lines.length + 1);
  for (let i = 1; i < lines.length; i += 1) {
    const y = i * rowGap;
    ctx.beginPath();
    ctx.moveTo(size * 0.06, y);
    ctx.lineTo(size * 0.94, y);
    ctx.stroke();
  }
  // Plastic changeable letters: uppercase sans-serif, centred per row.
  ctx.fillStyle = letters;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(9, size / (lines.length * 2.6))}px Arial, sans-serif`;
  lines.forEach((line, index) => {
    ctx.fillText(line, size / 2, (index + 0.5) * rowGap);
  });
  // Faint frame shadow around the board.
  ctx.strokeStyle = shadeHex(board, 0.28);
  ctx.lineWidth = Math.max(1.5, size / 140);
  ctx.strokeRect(size * 0.03, size * 0.03, size * 0.94, size * 0.94);
}

function drawDigitalMenu(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const screen = hexToCss(spec.color ?? '#0B0E14');
  const text = hexToCss(spec.color2 ?? '#FFE3B8');
  const lines = spec.lines && spec.lines.length > 0 ? spec.lines : ['FLAT WHITE $5.00', 'OAT LATTE $5.50', 'SOURDOUGH TOAST $6.00', 'CINNAMON BUN $4.50'];
  // Dark digital panel with a soft vertical glow (backlit screen).
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, shadeHex(screen, 0.1));
  gradient.addColorStop(0.5, screen);
  gradient.addColorStop(1, shadeHex(screen, 0.06));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  // Rounded screen bezel highlight.
  ctx.strokeStyle = shadeHex(text, -0.2);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, size / 180);
  ctx.strokeRect(size * 0.02, size * 0.02, size * 0.96, size * 0.96);
  // Header title.
  ctx.fillStyle = text;
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(10, size / 9)}px Arial, sans-serif`;
  ctx.fillText(spec.title ?? 'SPECIALTY COFFEE', size / 2, size * 0.1);
  // Menu rows with a price column aligned right.
  const rowGap = size / (lines.length + 2);
  ctx.font = `bold ${Math.max(8, size / (lines.length * 2.6))}px Arial, sans-serif`;
  lines.forEach((line, index) => {
    const y = (index + 1.5) * rowGap;
    ctx.fillText(line, size / 2, y);
  });
  // Faint scan-line shimmer so it reads as a digital screen.
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.04;
  ctx.fillRect(0, size * 0.72, size, Math.max(1, size / 60));
  ctx.globalAlpha = 1;
}

function drawPoster(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const base = hexToCss(spec.color ?? '#C94F3D');
  const accent = hexToCss(spec.color2 ?? '#F2D06B');
  const random = mulberry32(normalizeHex(base));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  // Title bar at the top.
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, size, size * 0.2);
  ctx.fillStyle = base;
  ctx.fillRect(0, size * 0.2, size, size / 24);
  // Sunburst motif.
  const cx = size / 2;
  const cy = size * 0.62;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, size / 120);
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * size * 0.42, cy + Math.sin(angle) * size * 0.42);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  // Grain.
  for (let i = 0; i < 400; i += 1) {
    ctx.globalAlpha = 0.05 + random() * 0.08;
    ctx.fillStyle = '#000000';
    ctx.fillRect(random() * size, random() * size, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
  // Title text.
  ctx.fillStyle = accent;
  ctx.font = `bold ${Math.max(8, size / 14)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.title ?? 'POSTER', size / 2, size * 0.09);
}

function drawBrick(
  ctx: CanvasRenderingContext2D,
  size: number,
  spec: TextureSpec,
): void {
  const brick = hexToCss(spec.color ?? '#8A4A3A');
  const mortar = hexToCss(spec.color2 ?? '#C9B8A8');
  const courses = Math.max(3, Math.round(spec.repeats ?? 5));
  const random = mulberry32(normalizeHex(brick) ^ normalizeHex(mortar));
  ctx.fillStyle = mortar;
  ctx.fillRect(0, 0, size, size);
  const courseHeight = size / courses;
  const mortarThickness = Math.max(1, courseHeight / 8);
  const bricksPerCourse = Math.max(2, Math.round(courses * 1.6));
  const brickWidth = size / bricksPerCourse;
  // Running bond: each course is offset by half a brick, with per-brick
  // colour jitter for a worn second-wave brick wall.
  for (let row = 0; row < courses; row += 1) {
    const y = row * courseHeight;
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    for (let col = -1; col < bricksPerCourse + 1; col += 1) {
      const jitterX = (random() - 0.5) * brickWidth * 0.12;
      const jitterY = (random() - 0.5) * courseHeight * 0.12;
      ctx.fillStyle = shadeHex(brick, (random() - 0.5) * 0.2);
      ctx.fillRect(
        col * brickWidth + offset + jitterX,
        y + jitterY,
        brickWidth - mortarThickness,
        courseHeight - mortarThickness,
      );
    }
  }
}

/** Draw a texture kind into a prepared 2D context. */
export function drawTexture(ctx: CanvasRenderingContext2D, size: number, spec: TextureSpec): void {
  switch (spec.kind) {
    case 'woodGrain':
      drawWoodGrain(ctx, size, spec);
      break;
    case 'tile':
      drawTile(ctx, size, spec);
      break;
    case 'wallpaper':
      drawWallpaper(ctx, size, spec);
      break;
    case 'geometric':
      drawGeometric(ctx, size, spec);
      break;
    case 'neon':
      drawNeon(ctx, size, spec);
      break;
    case 'chalkboard':
      drawChalkboard(ctx, size, spec);
      break;
    case 'letterboard':
      drawLetterboard(ctx, size, spec);
      break;
    case 'digitalMenu':
      drawDigitalMenu(ctx, size, spec);
      break;
    case 'poster':
      drawPoster(ctx, size, spec);
      break;
    case 'brick':
      drawBrick(ctx, size, spec);
      break;
  }
}

/**
 * TextureFactory — cached canvas texture generator.
 *
 * ```ts
 * const factory = new TextureFactory();
 * const floor = factory.get({ kind: 'tile', color: palette.floor, color2: '#333' });
 * const glow  = factory.get({ kind: 'neon', color: palette.neon });
 * ```
 */
export class TextureFactory {
  private readonly cache = new Map<string, TextureResult>();

  /** Return (and cache) the texture for a spec. */
  get(spec: TextureSpec): TextureResult {
    const key = hashSpec(spec);
    const cached = this.cache.get(key);
    if (cached) return cached;
    const result = this.create(spec);
    this.cache.set(key, result);
    return result;
  }

  /** Number of distinct textures currently cached. */
  get size(): number {
    return this.cache.size;
  }

  /** True when a texture with the same options is already cached. */
  has(spec: TextureSpec): boolean {
    return this.cache.has(hashSpec(spec));
  }

  /** Release one cached texture + canvas. */
  release(spec: TextureSpec): void {
    const key = hashSpec(spec);
    const entry = this.cache.get(key);
    if (entry) {
      entry.texture.dispose();
      this.cache.delete(key);
    }
  }

  /** Release every cached texture + canvas. */
  releaseAll(): void {
    for (const entry of this.cache.values()) entry.texture.dispose();
    this.cache.clear();
  }

  private create(spec: TextureSpec): TextureResult {
    const size = clampTextureSize(spec.size ?? 256);
    const canvas = createCanvas(size);
    const ctx = prepareCanvas(canvas, size);
    if (ctx) drawTexture(ctx, size, spec);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    const repeats = Math.max(1, spec.repeats ?? 1);
    if (spec.kind === 'tile' || spec.kind === 'wallpaper') {
      texture.repeat.set(repeats, repeats);
    }
    if (spec.rotation) {
      texture.rotation = spec.rotation;
      texture.center.set(0.5, 0.5);
    }
    texture.needsUpdate = true;
    return { texture, canvas, blank: !ctx };
  }
}

/** Convenience singleton so era tasks can share one factory. */
export const textureFactory = new TextureFactory();
