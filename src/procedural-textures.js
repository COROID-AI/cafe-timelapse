/**
 * ProceduralTextures — Canvas-based texture generators for PBR materials.
 *
 * All textures are generated at runtime via Canvas2D, so no external image
 * assets are required. These are original works and don't need credits.md
 * entries (see credits.md rule #4).
 *
 * Each generator returns a THREE.CanvasTexture ready for use as
 * map, normalMap, roughnessMap, etc.
 */

import * as THREE from 'three';

/**
 * Create a canvas with the given size.
 * @param {number} size
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = /** @type {CanvasRenderingContext2D} */ (
    canvas.getContext('2d', { willReadFrequently: true })
  );
  return { canvas, ctx };
}

/**
 * Convert a canvas to a THREE.CanvasTexture with proper settings.
 * @param {HTMLCanvasElement} canvas
 * @param {number} [repeat]
 * @returns {THREE.CanvasTexture}
 */
function toTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generate a wood plank texture (color map).
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function woodPlankColor(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  // Base wood color
  ctx.fillStyle = '#8B6F47';
  ctx.fillRect(0, 0, size, size);

  const planks = 6;
  const plankH = size / planks;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;

    // Vary plank shade
    const shade = 0.85 + Math.random() * 0.3;
    const r = Math.floor(139 * shade);
    const g = Math.floor(111 * shade);
    const b = Math.floor(71 * shade);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, size, plankH);

    // Wood grain lines
    for (let j = 0; j < 12; j++) {
      const grainY = y + Math.random() * plankH;
      const opacity = 0.1 + Math.random() * 0.15;
      ctx.strokeStyle = `rgba(60, 40, 20, ${opacity})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, grainY);
      // Wavy grain
      for (let x = 0; x <= size; x += 8) {
        ctx.lineTo(x, grainY + Math.sin(x * 0.05 + j) * 1.5);
      }
      ctx.stroke();
    }

    // Plank gap (dark line between planks)
    ctx.strokeStyle = 'rgba(30, 20, 10, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  return toTexture(canvas, 4);
}

/**
 * Generate a wood plank roughness map.
 * Lighter = rougher, darker = smoother.
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function woodPlankRoughness(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, size, size);

  const planks = 6;
  const plankH = size / planks;

  for (let i = 0; i < planks; i++) {
    const y = i * plankH;
    // Wood is moderately rough
    const roughness = 140 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${roughness},${roughness},${roughness})`;
    ctx.fillRect(0, y, size, plankH);

    // Grain slightly smoother
    for (let j = 0; j < 8; j++) {
      const grainY = y + Math.random() * plankH;
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, grainY);
      for (let x = 0; x <= size; x += 8) {
        ctx.lineTo(x, grainY + Math.sin(x * 0.05 + j) * 1.5);
      }
      ctx.stroke();
    }
  }

  const tex = toTexture(canvas, 4);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Generate a painted plaster wall texture.
 * @param {number} [size]
 * @param {string} [baseColor]
 * @returns {THREE.CanvasTexture}
 */
export function plasterWallColor(size = 512, baseColor = '#E8E0D5') {
  const { canvas, ctx } = createCanvas(size);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  // Add subtle noise for plaster texture
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Subtle cracks
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = 'rgba(180, 170, 160, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    for (let j = 0; j < 20; j++) {
      x += (Math.random() - 0.5) * 30;
      y += (Math.random() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return toTexture(canvas, 2);
}

/**
 * Generate a plaster wall roughness map.
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function plasterWallRoughness(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  ctx.fillStyle = '#bbb';
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    const val = Math.max(0, Math.min(255, 187 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  const tex = toTexture(canvas, 2);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/**
 * Generate a marble counter texture.
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function marbleCounterColor(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  // Base marble color
  ctx.fillStyle = '#f5f2ed';
  ctx.fillRect(0, 0, size, size);

  // Veining
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(120, 110, 95, ${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const startX = Math.random() * size;
    const startY = Math.random() * size;
    ctx.moveTo(startX, startY);
    let x = startX;
    let y = startY;
    for (let j = 0; j < 30; j++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Subtle noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return toTexture(canvas, 1);
}

/**
 * Generate a ceiling texture (subtle white plaster).
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function ceilingColor(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  ctx.fillStyle = '#f8f6f3';
  ctx.fillRect(0, 0, size, size);

  // Very subtle noise
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return toTexture(canvas, 3);
}

/**
 * Generate a tile floor texture (checkerboard pattern for café).
 * @param {number} [size]
 * @returns {THREE.CanvasTexture}
 */
export function tileFloorColor(size = 512) {
  const { canvas, ctx } = createCanvas(size);

  const tiles = 8;
  const tile = size / tiles;

  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const isLight = (x + y) % 2 === 0;
      ctx.fillStyle = isLight ? '#d8d0c5' : '#3a3530';
      ctx.fillRect(x * tile, y * tile, tile, tile);

      // Subtle texture within tile
      const imageData = ctx.getImageData(x * tile, y * tile, tile, tile);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, x * tile, y * tile);
    }
  }

  // Grout lines
  ctx.strokeStyle = 'rgba(80, 70, 60, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tile, 0);
    ctx.lineTo(i * tile, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tile);
    ctx.lineTo(size, i * tile);
    ctx.stroke();
  }

  return toTexture(canvas, 6);
}

export default {
  woodPlankColor,
  woodPlankRoughness,
  plasterWallColor,
  plasterWallRoughness,
  marbleCounterColor,
  ceilingColor,
  tileFloorColor,
};
