/**
 * Procedurally drawn menu-board textures (pure canvas 2D).
 *
 * Every era gets its own painter with period-appropriate fonts, colours and
 * layout. All canvases are generated at build time from the resolved rows in
 * `presets.ts` — no external image files.
 *
 * Headless safety: the vitest suite runs in a plain Node environment where
 * `document.createElement('canvas')` does not exist (and jsdom has no 2D
 * backend). `createSurface` therefore falls back to a stub surface driven by
 * a Proxy no-op 2D context: painter code runs unchanged, structural tests can
 * assert geometry/materials/userData, and real browsers get genuine pixels.
 */

import * as THREE from 'three';
import type { MenuEraPreset } from './presets';
import type { RenderedMenuRow } from './types';
import { applyTextureQuality } from '../../rendering/textureQuality';

/* ------------------------------------------------------------------------- */
/* Surface plumbing                                                          */
/* ------------------------------------------------------------------------- */

interface PaintSurface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

/** No-op 2D context so painters run identically in headless environments. */
function createNoopContext(): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'measureText') {
        return () => ({ width: 10 }) as TextMetrics;
      }
      if (
        prop === 'createLinearGradient' ||
        prop === 'createRadialGradient' ||
        prop === 'createPattern'
      ) {
        return () => ({ addColorStop: () => undefined });
      }
      if (typeof prop === 'string') {
        if (prop in target) return target[prop];
        return () => undefined;
      }
      return undefined;
    },
    set(target, prop, value) {
      if (typeof prop === 'string') target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

function createSurface(pxWidth: number, pxHeight: number): PaintSurface {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const candidate = document.createElement('canvas');
    candidate.width = pxWidth;
    candidate.height = pxHeight;
    // Some headless DOMs hand out <canvas> elements with no 2D backend at all
    // (getContext itself missing) — only trust a context that really draws.
    if (typeof candidate.getContext === 'function') {
      const real = candidate.getContext('2d');
      if (real) return { canvas: candidate, ctx: real };
    }
  }
  // Headless stub: three.js only needs image-like width/height outside of
  // an actual WebGL upload, which tests never perform.
  const stub = { width: pxWidth, height: pxHeight } as unknown as HTMLCanvasElement;
  return { canvas: stub, ctx: createNoopContext() };
}

function toTexture(surface: PaintSurface): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(surface.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  applyTextureQuality(texture);
  texture.needsUpdate = true;
  return texture;
}

/** Deterministic PRNG (mulberry32) — chalk jitter / QR modules never flicker. */
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

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Shared row renderer: label left-aligned, price right-aligned per line. */
function drawRows(
  ctx: CanvasRenderingContext2D,
  rows: RenderedMenuRow[],
  options: {
    left: number;
    right: number;
    firstBaseline: number;
    lineHeight: number;
    font: string;
    ink: string;
    accent: string;
    priceFont?: string;
    jitter?: () => number;
    shadowBlur?: number;
  },
): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < rows.length; i += 1) {
    const y = options.firstBaseline + i * options.lineHeight + (options.jitter?.() ?? 0);
    ctx.font = options.font;
    ctx.fillStyle = options.ink;
    if (options.shadowBlur) {
      ctx.shadowColor = 'rgba(255,255,255,0.35)';
      ctx.shadowBlur = options.shadowBlur;
    }
    ctx.fillText(rows[i].label.toUpperCase(), options.left, y);
    ctx.font = options.priceFont ?? options.font;
    ctx.fillStyle = options.accent;
    ctx.textAlign = 'right';
    ctx.fillText(rows[i].price, options.right, y);
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;

    // Faint separator between rows.
    if (i < rows.length - 1) {
      ctx.strokeStyle = 'rgba(128,128,128,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(options.left, y + options.lineHeight * 0.32);
      ctx.lineTo(options.right, y + options.lineHeight * 0.32);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------------- */
/* Era painters                                                              */
/* ------------------------------------------------------------------------- */

/** 1945 — slate chalkboard: chalk dust, hand-jittered script, smudges. */
export function paintChalkSlate(
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
  specialsNote: string | undefined,
): THREE.CanvasTexture {
  const W = 768;
  const H = Math.round((W * preset.size.height) / preset.size.width);
  const { ctx } = createSurface(W, H);
  const rand = mulberry32(19450601);

  // Slate base with cloudy wear.
  ctx.fillStyle = preset.palette.face;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(220,225,230,${0.015 + rand() * 0.03})`;
    const rx = rand() * W;
    const ry = rand() * H;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 20 + rand() * 70, 10 + rand() * 30, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Chalk header on a ruled line.
  ctx.strokeStyle = 'rgba(232,228,218,0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 8]);
  ctx.beginPath();
  ctx.moveTo(W * 0.08, H * 0.24);
  ctx.lineTo(W * 0.92, H * 0.235);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = preset.fonts.header;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(240,240,235,0.55)';
  ctx.shadowBlur = 5;
  ctx.fillStyle = preset.palette.accent;
  ctx.fillText(preset.header, W / 2, H * 0.17);
  ctx.shadowBlur = 0;

  drawRows(ctx, rows, {
    left: W * 0.12,
    right: W * 0.88,
    firstBaseline: H * 0.36,
    lineHeight: H * 0.115,
    font: preset.fonts.body,
    ink: preset.palette.ink,
    accent: preset.palette.accent,
    jitter: () => (rand() - 0.5) * 2.4,
    shadowBlur: 4,
  });

  // Rationing note, underlined twice like a hurried landlord's scrawl.
  if (specialsNote) {
    const y = H * 0.925;
    ctx.textAlign = 'center';
    ctx.font = "italic 34px 'Brush Script MT', 'Segoe Script', cursive";
    ctx.fillStyle = '#f2e9b7';
    ctx.shadowColor = 'rgba(242,233,183,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(specialsNote, W / 2, y);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(242,233,183,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, y + 8);
    ctx.lineTo(W * 0.82, y + 6);
    ctx.stroke();
  }

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

// Helper: recover the canvas backing a context without storing extra state.
function currentCanvas(ctx: CanvasRenderingContext2D): HTMLCanvasElement {
  const maybe = (ctx as unknown as { canvas?: HTMLCanvasElement }).canvas;
  if (maybe && typeof maybe.width === 'number') return maybe;
  return { width: 4, height: 4 } as unknown as HTMLCanvasElement;
}

/**
 * 1965 — painted wooden diner board: cream enamel panel, teal header band,
 * red prices, hand-painted drop shadows.
 */
export function paintDinerBoard(
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
  specialsNote: string | undefined,
): THREE.CanvasTexture {
  const W = 900;
  const H = Math.round((W * preset.size.height) / preset.size.width);
  const { ctx } = createSurface(W, H);

  // Enamel face.
  ctx.fillStyle = preset.palette.face;
  ctx.fillRect(0, 0, W, H);

  // Teal header band with cream pinline.
  ctx.fillStyle = preset.palette.band;
  ctx.fillRect(0, 0, W, H * 0.185);
  ctx.fillStyle = 'rgba(243,233,210,0.9)';
  ctx.fillRect(0, H * 0.185, W, 5);

  ctx.font = preset.fonts.header;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(40,40,44,0.35)';
  ctx.fillText(preset.header, W / 2 + 4, H * 0.095 + 4);
  ctx.fillStyle = '#f3e9d2';
  ctx.fillText(preset.header, W / 2, H * 0.095);

  drawRows(ctx, rows, {
    left: W * 0.1,
    right: W * 0.9,
    firstBaseline: H * 0.31,
    lineHeight: H * 0.108,
    font: preset.fonts.body,
    ink: preset.palette.ink,
    accent: preset.palette.accent,
    priceFont: "bold italic 38px 'Trebuchet MS', Verdana, sans-serif",
  });

  // Starburst doodle beside the note — pure diner kitsch.
  if (specialsNote) {
    const cx = W * 0.16;
    const cy = H * 0.915;
    ctx.strokeStyle = preset.palette.accent;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 12, cy + Math.sin(angle) * 12);
      ctx.lineTo(cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 26);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.font = "bold italic 34px 'Trebuchet MS', Verdana, sans-serif";
    ctx.fillStyle = preset.palette.band;
    ctx.fillText(specialsNote, W * 0.22, cy + 12);
  }
  ctx.textBaseline = 'alphabetic';

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

/**
 * 1985 — backlit plastic-letter board: black lightbox, letters sitting on
 * clear tracker rails, amber price column, halo glow behind every letter.
 */
export function paintPlasticLetterPanel(
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
  specialsNote: string | undefined,
): THREE.CanvasTexture {
  const W = 1024;
  const H = Math.round((W * preset.size.height) / preset.size.width);
  const { ctx } = createSurface(W, H);

  // Backlit field: soft radial bloom over near-black.
  const bloom = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.72);
  bloom.addColorStop(0, '#26282e');
  bloom.addColorStop(1, preset.palette.face);
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, W, H);

  ctx.font = preset.fonts.header;
  ctx.textAlign = 'center';
  ctx.shadowColor = preset.palette.accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = preset.palette.ink;
  ctx.fillText(preset.header, W / 2, H * 0.135);
  ctx.shadowBlur = 0;

  // Tracker rails: one translucent groove per row.
  const rowCount = rows.length;
  const top = H * 0.21;
  const railH = (H * 0.62) / rowCount;
  for (let i = 0; i < rowCount; i += 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.055)';
    ctx.fillRect(W * 0.05, top + i * railH + railH * 0.68, W * 0.9, 3);
    // Little plastic letter tiles behind the text.
    const rand = mulberry32(19850000 + i);
    ctx.font = preset.fonts.body;
    const label = rows[i].label.toUpperCase();
    ctx.textAlign = 'left';
    let cursor = W * 0.07;
    for (const ch of label) {
      const tileW = ch === ' ' ? 14 : 26 + Math.floor(rand() * 6);
      if (ch !== ' ') {
        ctx.fillStyle = 'rgba(250,250,245,0.92)';
        ctx.shadowColor = 'rgba(255,255,255,0.75)';
        ctx.shadowBlur = 7;
        ctx.fillText(ch, cursor, top + i * railH + railH * 0.52);
        ctx.shadowBlur = 0;
      }
      cursor += tileW;
    }
    // Amber price digits on the right of the same rail.
    ctx.textAlign = 'right';
    ctx.font = "bold 34px 'Courier New', monospace";
    ctx.fillStyle = preset.palette.accent;
    ctx.shadowColor = 'rgba(255,179,71,0.85)';
    ctx.shadowBlur = 10;
    ctx.fillText(rows[i].price, W * 0.93, top + i * railH + railH * 0.52);
    ctx.shadowBlur = 0;
  }

  if (specialsNote) {
    ctx.textAlign = 'center';
    ctx.font = "bold 28px Arial, Helvetica, sans-serif";
    ctx.fillStyle = '#f4f4f0';
    ctx.globalAlpha = 0.85;
    ctx.fillText(specialsNote.toUpperCase(), W / 2, H * 0.93);
    ctx.globalAlpha = 1;
  }

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

/** 2005 — printed wall menu: paper stock, brand roundel, clean grid. */
export function paintPrintedWallMenu(
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
): THREE.CanvasTexture {
  const W = 960;
  const H = Math.round((W * preset.size.height) / preset.size.width);
  const { ctx } = createSurface(W, H);

  // Paper base + subtle print grain.
  ctx.fillStyle = preset.palette.face;
  ctx.fillRect(0, 0, W, H);
  const rand = mulberry32(20050402);
  for (let i = 0; i < 420; i += 1) {
    ctx.fillStyle = `rgba(120,100,70,${rand() * 0.04})`;
    ctx.fillRect(rand() * W, rand() * H, 2, 2);
  }

  // Brand band across the top with a coffee-ring roundel logo.
  ctx.fillStyle = preset.palette.band;
  ctx.fillRect(0, 0, W, H * 0.17);
  ctx.beginPath();
  ctx.arc(W * 0.09, H * 0.085, H * 0.062, 0, Math.PI * 2);
  ctx.fillStyle = '#f5f1e6';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.09, H * 0.085, H * 0.03, 0, Math.PI * 2);
  ctx.fillStyle = preset.palette.band;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = preset.fonts.header;
  ctx.fillStyle = '#f5f1e6';
  ctx.fillText(preset.header, W * 0.155, H * 0.085);

  drawRows(ctx, rows, {
    left: W * 0.09,
    right: W * 0.91,
    firstBaseline: H * 0.29,
    lineHeight: H * 0.104,
    font: preset.fonts.body,
    ink: preset.palette.ink,
    accent: preset.palette.accent,
    priceFont: "600 32px Verdana, Geneva, sans-serif",
  });

  // Footer strip: loyalty-card plug, very 2005.
  ctx.textAlign = 'center';
  ctx.font = "italic 26px Georgia, serif";
  ctx.fillStyle = 'rgba(90,80,60,0.85)';
  ctx.fillText('Ask about our loyalty card — 9 stamps, 10th coffee free', W / 2, H * 0.95);
  ctx.textBaseline = 'alphabetic';

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

/** 2005 A-frame chalk specials panel (matte black, hand-lettered). */
export function paintAframeSpecials(specialsNote: string | undefined): THREE.CanvasTexture {
  const W = 480;
  const H = 720;
  const { ctx } = createSurface(W, H);
  const rand = mulberry32(20051225);

  ctx.fillStyle = '#23211f';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i += 1) {
    ctx.fillStyle = `rgba(230,230,225,${rand() * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(rand() * W, rand() * H, 30 + rand() * 60, 14 + rand() * 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.font = "bold 52px 'Brush Script MT', 'Segoe Script', cursive";
  ctx.fillStyle = '#f2e9b7';
  ctx.shadowColor = 'rgba(242,233,183,0.45)';
  ctx.shadowBlur = 5;
  ctx.fillText("Today's", W / 2, H * 0.16);
  ctx.fillText('Special', W / 2, H * 0.27);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#f2e9b7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W * 0.2, H * 0.33);
  ctx.lineTo(W * 0.8, H * 0.33);
  ctx.stroke();

  ctx.font = "italic bold 44px 'Brush Script MT', cursive";
  ctx.fillStyle = '#efece2';
  const lines = (specialsNote ?? '').split(':');
  const headline = (lines[1] ?? lines[0] ?? 'Fresh Soup').trim();
  ctx.fillText(headline.split(' ').slice(0, 2).join(' '), W / 2, H * 0.47);
  ctx.fillText(headline.split(' ').slice(2).join(' ') || ' ', W / 2, H * 0.56);
  ctx.font = "bold 46px Georgia, serif";
  ctx.fillStyle = '#f2e9b7';
  ctx.fillText('£4.50', W / 2, H * 0.72);

  ctx.font = "italic 30px 'Segoe Script', cursive";
  ctx.fillStyle = 'rgba(239,236,226,0.85)';
  ctx.fillText('~ welcome ~', W / 2, H * 0.88);

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

/** 2025 LCD main screen: dark UI card list with mint accents. */
export function paintLcdScreen(
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
): THREE.CanvasTexture {
  const W = 1024;
  const H = Math.round((W * preset.size.height) / preset.size.width);
  const { ctx } = createSurface(W, H);

  ctx.fillStyle = preset.palette.face;
  ctx.fillRect(0, 0, W, H);

  // Header bar with status chips, very app-like.
  ctx.fillStyle = preset.palette.band;
  ctx.fillRect(0, 0, W, H * 0.13);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = preset.fonts.header;
  ctx.fillStyle = preset.palette.ink;
  ctx.fillText(preset.header.replace('☕', '').trimEnd(), W * 0.035, H * 0.065);
  ctx.textAlign = 'right';
  ctx.font = "500 26px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = preset.palette.accent;
  ctx.fillText('ORDER AT THE COUNTER · OR TAP TO SCAN', W * 0.97, H * 0.065);

  // Row cards.
  const top = H * 0.165;
  const cardH = (H * 0.66) / rows.length;
  for (let i = 0; i < rows.length; i += 1) {
    const y = top + i * cardH;
    roundRectPath(ctx, W * 0.035, y + cardH * 0.12, W * 0.86, cardH * 0.76, 14);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.03)';
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = preset.fonts.body;
    ctx.fillStyle = preset.palette.ink;
    ctx.fillText(rows[i].label, W * 0.06, y + cardH * 0.5);

    ctx.textAlign = 'right';
    ctx.font = "600 34px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = preset.palette.accent;
    ctx.fillText(rows[i].price, W * 0.87, y + cardH * 0.5);

    // Dietary dot (vegan/ GF markers).
    ctx.beginPath();
    ctx.arc(W * 0.91, y + cardH * 0.5, 7, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? '#8bd450' : '#58a6ff';
    ctx.fill();
  }

  // Reserve the bottom strip for the scrolling specials ticker.
  ctx.fillStyle = preset.palette.band;
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
  ctx.textAlign = 'left';
  ctx.font = "500 24px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = 'rgba(242,245,244,0.55)';
  ctx.fillText('SPECIALS ▸', W * 0.035, H * 0.93);
  ctx.textBaseline = 'alphabetic';

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}

/**
 * 2025 scrolling specials ticker content — drawn twice side by side so the
 * RepeatWrapping scroll is seamless. Returns the texture pre-configured for
 * horizontal offset animation.
 */
export function paintLcdSpecialsTicker(specials: string[]): THREE.CanvasTexture {
  const blockW = 1400;
  const H = 96;
  const surface = createSurface(blockW * 2, H);
  const { ctx } = surface;

  ctx.fillStyle = '#131a1e';
  ctx.fillRect(0, 0, blockW * 2, H);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = "500 42px 'Segoe UI', Arial, sans-serif";

  const joined = specials.join('      ◆      ');
  for (let copy = 0; copy < 2; copy += 1) {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#58e0c0');
    gradient.addColorStop(1, '#f7d774');
    ctx.fillStyle = gradient;
    ctx.fillText(joined, copy * blockW + 20, H * 0.52);
  }
  ctx.textBaseline = 'alphabetic';

  const texture = toTexture(surface);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/**
 * Pseudo-QR matrix (finder patterns + timing lines + deterministic payload
 * noise). Reads unmistakably as a QR code at prop scale; it is decorative.
 */
export function paintQrOrderingCard(label: string): THREE.CanvasTexture {
  const W = 256;
  const H = 320;
  const { ctx } = createSurface(W, H);
  const rand = mulberry32(20251111);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.font = "600 22px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = '#101216';
  ctx.fillText(label, W / 2, 26);

  // Matrix area.
  const n = 21;
  const cell = 9;
  const size = n * cell;
  const ox = (W - size) / 2;
  const oy = 44;
  ctx.fillStyle = '#101216';

  const inFinder = (x: number, y: number): boolean =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  const drawFinder = (fx: number, fy: number): void => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const ring = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (!ring && !core) continue;
        ctx.fillRect(ox + (fx + x) * cell, oy + (fy + y) * cell, cell, cell);
      }
    }
  };

  // Data modules first, then stamp finders/timing over them.
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (inFinder(x, y)) continue;
      if (y === 6 || x === 6) continue; // timing rows drawn explicitly
      if (rand() > 0.52) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  for (let i = 0; i < n; i += 1) {
    if (i % 2 === 0) {
      ctx.fillRect(ox + i * cell, oy + 6 * cell, cell, cell);
      ctx.fillRect(ox + 6 * cell, oy + i * cell, cell, cell);
    }
  }
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  ctx.font = "500 20px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = '#58a878';
  ctx.fillText('SCAN TO ORDER', W / 2, oy + size + 30);
  ctx.font = "400 16px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = '#6a6f74';
  ctx.fillText('pay on collection', W / 2, oy + size + 54);

  return toTexture({ canvas: currentCanvas(ctx), ctx });
}
