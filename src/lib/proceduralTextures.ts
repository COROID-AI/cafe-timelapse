import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) — so every era renders identically.
// ---------------------------------------------------------------------------

/** Create a seeded PRNG function returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULT_SIZE = 512;

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Texture generators
// ---------------------------------------------------------------------------

/**
 * Wood-grain texture. Deterministic given the seed.
 * @param seed numeric seed for the PRNG
 * @param size canvas dimension (default 512)
 * @param baseColour hex colour for the wood base
 * @param grainColour hex colour for the darker grain lines
 */
export function woodGrain(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#6B4423',
  grainColour = '#3A2818',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  // Base
  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  // Subtle vertical gradient for depth
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.12)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Grain lines
  const lineCount = Math.floor(size / 4);
  ctx.lineCap = 'round';
  for (let i = 0; i < lineCount; i++) {
    const y = rand() * size;
    const opacity = 0.1 + rand() * 0.3;
    ctx.strokeStyle = hexToRgba(grainColour, opacity);
    ctx.lineWidth = 0.5 + rand() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    // Wavy grain
    const segments = 8;
    for (let s = 1; s <= segments; s++) {
      const x = (s / segments) * size;
      const wave = (rand() - 0.5) * 8;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  // Knots
  const knotCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < knotCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 4 + rand() * 12;
    const knotGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    knotGrad.addColorStop(0, hexToRgba(grainColour, 0.6));
    knotGrad.addColorStop(1, hexToRgba(grainColour, 0));
    ctx.fillStyle = knotGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(canvas);
}

/**
 * Marble texture — swirling veins on a light base.
 */
export function marble(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#E8E4DE',
  veinColour = '#8A8580',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  // Veins
  const veinCount = 6 + Math.floor(rand() * 5);
  for (let v = 0; v < veinCount; v++) {
    ctx.strokeStyle = hexToRgba(veinColour, 0.15 + rand() * 0.25);
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    let x = rand() * size;
    let y = rand() * size;
    ctx.moveTo(x, y);
    const steps = 20 + Math.floor(rand() * 30);
    for (let s = 0; s < steps; s++) {
      x += (rand() - 0.5) * size * 0.15;
      y += (rand() - 0.5) * size * 0.15;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Soft noise
  addNoise(ctx, size, 8, rand);

  return toTexture(canvas);
}

/**
 * Brick wall texture.
 */
export function brick(
  seed: number,
  size = DEFAULT_SIZE,
  brickColour = '#8B4513',
  mortarColour = '#C8B89A',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = mortarColour;
  ctx.fillRect(0, 0, size, size);

  const rows = 8;
  const brickH = size / rows;
  const brickW = brickH * 2.2;
  const mortar = 3;

  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : brickW / 2;
    for (let x = -brickW; x < size + brickW; x += brickW) {
      const bx = x + offset;
      const by = r * brickH;
      const shade = 0.85 + rand() * 0.3;
      ctx.fillStyle = shadeColour(brickColour, shade);
      ctx.fillRect(bx + mortar / 2, by + mortar / 2, brickW - mortar, brickH - mortar);
    }
  }

  addNoise(ctx, size, 12, rand);
  return toTexture(canvas);
}

/**
 * Wallpaper texture — subtle patterned repeat.
 */
export function wallpaper(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#A67C52',
  patternColour = '#8A6535',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  // Damask-like repeating motif
  const cellSize = 64;
  const cols = Math.ceil(size / cellSize);
  const rows = Math.ceil(size / cellSize);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cellSize + cellSize / 2;
      const cy = r * cellSize + cellSize / 2;
      ctx.strokeStyle = hexToRgba(patternColour, 0.25);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 5, 0, Math.PI * 2);
      ctx.stroke();
      // Diamond
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-cellSize / 4, -cellSize / 4, cellSize / 2, cellSize / 2);
      ctx.restore();
    }
  }

  addNoise(ctx, size, 6, rand);
  return toTexture(canvas);
}

/**
 * Fabric texture — woven threads.
 */
export function fabric(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#8B0000',
  threadColour = '#5A0000',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  const threadCount = 40;
  const gap = size / threadCount;

  // Horizontal threads
  for (let i = 0; i < threadCount; i++) {
    ctx.strokeStyle = hexToRgba(threadColour, 0.2 + rand() * 0.2);
    ctx.lineWidth = gap * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, i * gap + gap / 2);
    ctx.lineTo(size, i * gap + gap / 2);
    ctx.stroke();
  }
  // Vertical threads
  for (let i = 0; i < threadCount; i++) {
    ctx.strokeStyle = hexToRgba(threadColour, 0.15 + rand() * 0.15);
    ctx.lineWidth = gap * 0.4;
    ctx.beginPath();
    ctx.moveTo(i * gap + gap / 2, 0);
    ctx.lineTo(i * gap + gap / 2, size);
    ctx.stroke();
  }

  return toTexture(canvas);
}

/**
 * Neon glow texture — radial gradient for emissive surfaces.
 */
export function neonGlow(
  _seed: number,
  size = 256,
  glowColour = '#FF2D95',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, glowColour);
  grad.addColorStop(0.3, glowColour);
  grad.addColorStop(0.6, hexToRgba(glowColour, 0.4));
  grad.addColorStop(1, hexToRgba(glowColour, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return toTexture(canvas);
}

/**
 * Concrete / painted wall — flat colour with subtle noise.
 */
export function flatPaint(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#E8DCC8',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);
  addNoise(ctx, size, 10, rand);
  return toTexture(canvas);
}

/**
 * Terrazzo floor — speckled chips in a matrix.
 */
export function terrazzo(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#C8C0B8',
  chipColours = ['#8B7355', '#E0A458', '#5A4A3A', '#FAFAFA'],
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  const chipCount = 200;
  for (let i = 0; i < chipCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 8;
    const colour = chipColours[Math.floor(rand() * chipColours.length)] ?? baseColour;
    ctx.fillStyle = colour;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI);
    // Irregular polygon
    const sides = 4 + Math.floor(rand() * 3);
    ctx.beginPath();
    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      const radius = r * (0.7 + rand() * 0.3);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  return toTexture(canvas);
}

/**
 * Tile floor — grid of glossy tiles with grout lines.
 */
export function tileFloor(
  seed: number,
  size = DEFAULT_SIZE,
  tileColour = '#3A3A4A',
  groutColour = '#1A1A2A',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = groutColour;
  ctx.fillRect(0, 0, size, size);

  const count = 8;
  const cell = size / count;
  const grout = 4;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      const shade = 0.9 + rand() * 0.2;
      ctx.fillStyle = shadeColour(tileColour, shade);
      ctx.fillRect(c * cell + grout / 2, r * cell + grout / 2, cell - grout, cell - grout);
    }
  }

  return toTexture(canvas);
}

/**
 * Linoleum — speckled mid-tone floor.
 */
export function linoleum(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#C8C8C8',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  const fleckCount = 600;
  for (let i = 0; i < fleckCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 3;
    const dark = rand() > 0.5;
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(canvas);
}

/**
 * Bamboo / light wood floor — lighter, tighter grain.
 */
export function bamboo(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#8B6B4A',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  // Horizontal planks
  const planks = 6;
  const ph = size / planks;
  for (let p = 0; p < planks; p++) {
    const shade = 0.92 + rand() * 0.16;
    ctx.fillStyle = shadeColour(baseColour, shade);
    ctx.fillRect(0, p * ph, size, ph - 2);
    // Node lines
    const nodes = 3 + Math.floor(rand() * 3);
    for (let n = 0; n < nodes; n++) {
      ctx.strokeStyle = hexToRgba('#5A3A1A', 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      const ny = p * ph + rand() * ph;
      ctx.moveTo(0, ny);
      ctx.lineTo(size, ny);
      ctx.stroke();
    }
  }

  return toTexture(canvas);
}

/**
 * Holographic panel — dark with glowing grid.
 */
export function holoPanel(
  seed: number,
  size = DEFAULT_SIZE,
  glowColour = '#00E5FF',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, size, size);

  // Grid lines
  const grid = 32;
  ctx.strokeStyle = hexToRgba(glowColour, 0.15);
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += grid) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Random glowing nodes
  const nodes = 20;
  for (let i = 0; i < nodes; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 4 + rand() * 12;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexToRgba(glowColour, 0.6));
    g.addColorStop(1, hexToRgba(glowColour, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(canvas);
}

/**
 * Glass floor — dark glossy with reflections.
 */
export function glassFloor(
  seed: number,
  size = DEFAULT_SIZE,
  baseColour = '#0A0A20',
): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = baseColour;
  ctx.fillRect(0, 0, size, size);

  // Light streaks
  const streaks = 30;
  for (let i = 0; i < streaks; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 1 + rand() * 40;
    ctx.fillStyle = hexToRgba('#00E5FF', 0.05 + rand() * 0.1);
    ctx.fillRect(x, y, w, 1 + rand() * 2);
  }

  return toTexture(canvas);
}

// ---------------------------------------------------------------------------
// Colour utilities
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function shadeColour(hex: string, factor: number): string {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor));
  return `rgb(${r},${g},${b})`;
}

function addNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  intensity: number,
  rand: () => number,
): void {
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * intensity;
    data[i] = Math.max(0, Math.min(255, data[i]! + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! + n));
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Generic floor-texture dispatcher based on the FurnitureDescriptor type.
 */
export function floorTexture(
  kind: string,
  seed: number,
  baseColour: string,
): THREE.CanvasTexture {
  switch (kind) {
    case 'wood':
      return woodGrain(seed, DEFAULT_SIZE, baseColour);
    case 'linoleum':
      return linoleum(seed, DEFAULT_SIZE, baseColour);
    case 'tile':
      return tileFloor(seed, DEFAULT_SIZE, baseColour);
    case 'bamboo':
      return bamboo(seed, DEFAULT_SIZE, baseColour);
    case 'terrazzo':
      return terrazzo(seed, DEFAULT_SIZE, baseColour, ['#8B7355', '#E0A458', '#5A4A3A', '#FAFAFA']);
    case 'glass':
      return glassFloor(seed, DEFAULT_SIZE, baseColour);
    default:
      return flatPaint(seed, DEFAULT_SIZE, baseColour);
  }
}

/**
 * Generic wall-texture dispatcher.
 */
export function wallTexture(
  kind: string,
  seed: number,
  baseColour: string,
): THREE.CanvasTexture {
  switch (kind) {
    case 'wallpaper':
      return wallpaper(seed, DEFAULT_SIZE, baseColour);
    case 'paint':
      return flatPaint(seed, DEFAULT_SIZE, baseColour);
    case 'brick':
      return brick(seed, DEFAULT_SIZE, baseColour, '#C8B89A');
    case 'panel':
      return woodGrain(seed, DEFAULT_SIZE, baseColour, '#3A2818');
    case 'concrete':
      return flatPaint(seed, DEFAULT_SIZE, baseColour);
    case 'holo-panel':
      return holoPanel(seed, DEFAULT_SIZE, '#00E5FF');
    default:
      return flatPaint(seed, DEFAULT_SIZE, baseColour);
  }
}
