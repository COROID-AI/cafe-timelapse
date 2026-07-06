/**
 * @file src/utils/canvas-text.js
 * Generates canvas-backed THREE.CanvasTexture for menu boards, signs, neon, and
 * QR tents without any external image assets. All text is rendered crisply at
 * 2x backing resolution.
 */
import * as THREE from 'three';

/**
 * Render a menu / sign / neon / QR texture onto a canvas-backed CanvasTexture.
 * @param {{
 *   title?:string,
 *   lines?:Array<{left:string,right:string}>,
 *   bg?:string,
 *   textColor?:string,
 *   subtitle?:string,
 *   neon?:boolean,
 *   qr?:boolean
 * }} options
 * @returns {THREE.CanvasTexture}
 */
export function createTextTexture(options) {
  const o = options || {};
  const W = 512;
  const H = 384;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = o.bg ?? '#1a1410';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // subtle texture / vignette
  const grad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7);
  grad.addColorStop(0, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const textColor = o.textColor ?? '#f4ead5';

  if (o.neon) {
    // glow effect for neon signs
    ctx.save();
    ctx.shadowColor = textColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 120px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.title ?? '', W / 2, H / 2);
    // second pass for stronger glow
    ctx.shadowBlur = 12;
    ctx.fillText(o.title ?? '', W / 2, H / 2);
    ctx.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }

  // Title
  if (o.title) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(o.title, W / 2, 24);
    // underline
    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, 84);
    ctx.lineTo(W / 2 + 90, 84);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (o.subtitle) {
    ctx.fillStyle = textColor;
    ctx.font = 'italic 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.8;
    ctx.fillText(o.subtitle, W / 2, 96);
    ctx.globalAlpha = 1;
  }

  // Menu / line items
  const lines = o.lines ?? [];
  const startY = o.subtitle ? 150 : 110;
  const rowH = Math.min(46, (H - startY - 30) / Math.max(lines.length, 1));
  ctx.font = `${Math.round(rowH * 0.62)}px "Courier New", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  lines.forEach((line, i) => {
    const y = startY + i * rowH + rowH / 2;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.92;
    ctx.textAlign = 'left';
    ctx.fillText(line.left, 48, y);

    ctx.textAlign = 'right';
    ctx.fillText(line.right, W - 48, y);

    // dotted leader
    ctx.globalAlpha = 0.3;
    ctx.textAlign = 'left';
    const leftW = ctx.measureText(line.left).width;
    const rightW = ctx.measureText(line.right).width;
    const leaderStart = 48 + leftW + 12;
    const leaderEnd = W - 48 - rightW - 12;
    let dots = '';
    ctx.font = `${Math.round(rowH * 0.5)}px monospace`;
    while (ctx.measureText(dots).width < leaderEnd - leaderStart && dots.length < 80) {
      dots += '.';
    }
    ctx.fillText(dots, leaderStart, y);
    ctx.font = `${Math.round(rowH * 0.62)}px "Courier New", monospace`;
    ctx.globalAlpha = 1;
  });

  // QR block
  if (o.qr) {
    const size = 200;
    const qx = (W - size) / 2;
    const qy = (H - size) / 2 + 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qx - 10, qy - 10, size + 20, size + 20);
    const cell = size / 21;
    ctx.fillStyle = '#111111';
    // deterministic pseudo-random QR-like pattern with finder squares
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const inFinder =
          (r < 7 && c < 7) ||
          (r < 7 && c > 13) ||
          (r > 13 && c < 7);
        if (inFinder) continue;
        // hash
        const v = (r * 31 + c * 17 + r * c) % 7;
        if (v < 3) {
          ctx.fillRect(qx + c * cell, qy + r * cell, cell, cell);
        }
      }
    }
    // finder patterns
    const drawFinder = (fx, fy) => {
      ctx.fillStyle = '#111111';
      ctx.fillRect(fx, fy, cell * 7, cell * 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx + cell, fy + cell, cell * 5, cell * 5);
      ctx.fillStyle = '#111111';
      ctx.fillRect(fx + cell * 2, fy + cell * 2, cell * 3, cell * 3);
    };
    drawFinder(qx, qy);
    drawFinder(qx + cell * 14, qy);
    drawFinder(qx, qy + cell * 14);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Simple solid-color texture (for floors/walls when needed). */
export function createSolidTexture(hex) {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + hex.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 4, 4);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/**
 * Wood-plank floor texture generator.
 * @param {{base:number, plank:number, rows?:number}} o
 */
export function createFloorTexture(o = {}) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const base = '#' + (o.base ?? 0x6b4a2b).toString(16).padStart(6, '0');
  const plank = '#' + (o.plank ?? 0x5a3a20).toString(16).padStart(6, '0');
  const rows = o.rows ?? 8;
  const ph = size / rows;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let r = 0; r < rows; r++) {
    // plank color variation
    ctx.fillStyle = r % 2 === 0 ? base : plank;
    ctx.fillRect(0, r * ph, size, ph);
    // grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      const y = r * ph + Math.random() * ph;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (Math.random() - 0.5) * 6, size * 0.6, y + (Math.random() - 0.5) * 6, size, y);
      ctx.stroke();
    }
    // seam between planks
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * ph);
    ctx.lineTo(size, r * ph);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Tile floor texture (checkered) for 1985 / 1965.
 * @param {{a:number, b:number, cells?:number}} o
 */
export function createTileTexture(o = {}) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cells = o.cells ?? 8;
  const cs = size / cells;
  const a = '#' + (o.a ?? 0xeeeeee).toString(16).padStart(6, '0');
  const b = '#' + (o.b ?? 0xcccccc).toString(16).padStart(6, '0');
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? a : b;
      ctx.fillRect(c * cs, r * cs, cs, cs);
    }
  }
  // grout
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cs, 0);
    ctx.lineTo(i * cs, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cs);
    ctx.lineTo(size, i * cs);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  return tex;
}
