/**
 * Procedural canvas textures for wall art.
 *
 * Every poster is painted from scratch on a `<canvas>` — period palettes,
 * typography and motifs only; no real copyrighted artwork is reproduced.
 * Painters are deterministic (seeded by spec id) so a given poster always
 * renders identically across reloads and rebuilds.
 *
 * Headless safety: when no DOM canvas exists (unit tests, node), texture
 * creation returns `null` and the assembler falls back to flat palette
 * colours, so the object graph still builds.
 */

import * as THREE from 'three';
import type { PosterSpec } from './types';
import { applyTextureQuality } from '../../rendering/textureQuality';

/* ------------------------------------------------------------------------- */
/* Deterministic randomness                                                   */
/* ------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 14), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type Ctx = CanvasRenderingContext2D;

/* ------------------------------------------------------------------------- */
/* Drawing helpers                                                            */
/* ------------------------------------------------------------------------- */

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws centred wrapped text top-down from `y`; returns the next free y. */
function wrapCentered(
  ctx: Ctx,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, cx, cursorY);
      cursorY += lineHeight;
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    ctx.fillText(line, cx, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

/** Aged paper: base wash, blotches, fibre speckles, darkened edges. */
function agedPaper(ctx: Ctx, w: number, h: number, rng: () => number, tint = '#efe5c8'): void {
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 7; i++) {
    const gx = rng() * w;
    const gy = rng() * h;
    const gr = (0.08 + rng() * 0.22) * Math.min(w, h);
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    grad.addColorStop(0, `rgba(150,120,70,${0.05 + rng() * 0.07})`);
    grad.addColorStop(1, 'rgba(150,120,70,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = 'rgba(96,78,48,0.16)';
  for (let i = 0; i < Math.round((w * h) / 900); i++) {
    ctx.fillRect(rng() * w, rng() * h, 1.4, 1.1);
  }

  // Darkened rim.
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, 'rgba(84,64,34,0.22)');
  edge.addColorStop(0.12, 'rgba(84,64,34,0)');
  edge.addColorStop(0.88, 'rgba(84,64,34,0)');
  edge.addColorStop(1, 'rgba(84,64,34,0.24)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  const rimX = ctx.createLinearGradient(0, 0, w, 0);
  rimX.addColorStop(0, 'rgba(84,64,34,0.18)');
  rimX.addColorStop(0.1, 'rgba(84,64,34,0)');
  rimX.addColorStop(0.9, 'rgba(84,64,34,0)');
  rimX.addColorStop(1, 'rgba(84,64,34,0.2)');
  ctx.fillStyle = rimX;
  ctx.fillRect(0, 0, w, h);
}

function doubleBorder(ctx: Ctx, w: number, h: number, inset: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(3, w * 0.012);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.lineWidth = Math.max(1.5, w * 0.005);
  ctx.strokeRect(inset * 2.1, inset * 2.1, w - inset * 4.2, h - inset * 4.2);
}

function sunburst(ctx: Ctx, cx: number, cy: number, radius: number, rays: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const spread = (Math.PI / rays) * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0 - spread) * radius, Math.sin(a0 - spread) * radius);
    ctx.lineTo(Math.cos(a0 + spread) * radius, Math.sin(a0 + spread) * radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function halftoneDisc(ctx: Ctx, cx: number, cy: number, radius: number, dotColor: string, bg: string): void {
  const step = Math.max(7, radius / 14);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = bg;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.fillStyle = dotColor;
  for (let gy = cy - radius; gy <= cy + radius; gy += step) {
    for (let gx = cx - radius; gx <= cx + radius; gx += step) {
      const dist = Math.hypot(gx - cx, gy - cy) / radius;
      const r = Math.max(0.8, step * 0.52 * (1.05 - dist));
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function neonText(
  ctx: Ctx,
  text: string,
  cx: number,
  y: number,
  font: string,
  core: string,
  glow: string,
  passes = 3,
): void {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.shadowColor = glow;
  for (let p = passes; p >= 1; p--) {
    ctx.shadowBlur = 10 * p;
    ctx.fillStyle = glow;
    ctx.fillText(text, cx, y);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.fillText(text, cx, y);
  ctx.restore();
}

function glossSheen(ctx: Ctx, w: number, h: number, strength = 0.1): void {
  const grad = ctx.createLinearGradient(w * 0.15, 0, w * 0.75, h);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.42, `rgba(255,255,255,${strength})`);
  grad.addColorStop(0.55, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Deterministic QR-style module grid with finder patterns (not scannable). */
function qrBlock(ctx: Ctx, x: number, y: number, size: number, modules: number, ink: string, rng: () => number): void {
  const cell = size / modules;
  ctx.fillStyle = ink;
  const finder = (fx: number, fy: number): void => {
    ctx.fillRect(x + fx * cell, y + fy * cell, cell * 7, cell * 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + (fx + 1) * cell, y + (fy + 1) * cell, cell * 5, cell * 5);
    ctx.fillStyle = ink;
    ctx.fillRect(x + (fx + 2) * cell, y + (fy + 2) * cell, cell * 3, cell * 3);
  };
  const inFinder = (mx: number, my: number): boolean =>
    (mx < 8 && my < 8) || (mx >= modules - 8 && my < 8) || (mx < 8 && my >= modules - 8);

  for (let my = 0; my < modules; my++) {
    for (let mx = 0; mx < modules; mx++) {
      if (inFinder(mx, my)) continue;
      // Timing rows keep a regular rhythm like real codes.
      const on =
        my === 6 || mx === 6 ? (mx + my) % 2 === 0 : rng() > 0.52;
      if (on) ctx.fillRect(x + mx * cell, y + my * cell, cell * 0.92, cell * 0.92);
    }
  }
  finder(0, 0);
  finder(modules - 7, 0);
  finder(0, modules - 7);
}

function simpleLeaf(ctx: Ctx, x: number, y: number, len: number, angle: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(len / 2, 0, len / 2, len / 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function laurelWreath(ctx: Ctx, cx: number, cy: number, radius: number, color: string): void {
  const count = 11;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 0.62 + (i / (count - 1)) * Math.PI * 0.76;
      const px = cx + Math.cos(angle) * radius * dir;
      const py = cy - Math.sin(angle) * radius;
      simpleLeaf(ctx, px, py, radius * 0.26, dir > 0 ? -angle : angle + Math.PI, color);
    }
  }
}

/* ------------------------------------------------------------------------- */
/* Style painters                                                             */
/* ------------------------------------------------------------------------- */

type Painter = (ctx: Ctx, w: number, h: number, spec: PosterSpec, rng: () => number) => void;

/** Palette access with safe fallbacks. */
function pal(spec: PosterSpec): { bg: string; ink: string; accent: string; accent2: string } {
  return {
    bg: spec.palette[0] ?? '#e9dfc6',
    ink: spec.palette[1] ?? '#33291d',
    accent: spec.palette[2] ?? '#7a2f22',
    accent2: spec.palette[3] ?? spec.palette[2] ?? '#3f5a3a',
  };
}

const paintPropagandaNotice: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  agedPaper(ctx, w, h, rng, bg);
  doubleBorder(ctx, w, h, w * 0.05, ink);

  // Emblem: wreath ring around a spade motif (original artwork).
  const cx = w / 2;
  const emblemY = h * 0.185;
  const r = w * 0.105;
  ctx.strokeStyle = accent2;
  ctx.lineWidth = w * 0.014;
  laurelWreath(ctx, cx, emblemY, r, accent2);
  ctx.fillStyle = accent;
  ctx.beginPath();
  // Spade: pointed blade + stem.
  ctx.moveTo(cx, emblemY - r * 0.72);
  ctx.quadraticCurveTo(cx + r * 0.66, emblemY - r * 0.1, cx + r * 0.28, emblemY + r * 0.3);
  ctx.quadraticCurveTo(cx + r * 0.12, emblemY + r * 0.42, cx, emblemY + r * 0.36);
  ctx.quadraticCurveTo(cx - r * 0.12, emblemY + r * 0.42, cx - r * 0.28, emblemY + r * 0.3);
  ctx.quadraticCurveTo(cx - r * 0.66, emblemY - r * 0.1, cx, emblemY - r * 0.72);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `900 ${w * 0.135}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), cx, h * 0.44, w * 0.82, w * 0.145);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${w * 0.062}px Verdana, Geneva, sans-serif`;
    y = wrapCentered(ctx, spec.subtitle.toUpperCase(), cx, y + w * 0.02, w * 0.76, w * 0.075);
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.moveTo(w * 0.16, y + w * 0.03);
  ctx.lineTo(w * 0.84, y + w * 0.03);
  ctx.stroke();
  if (spec.lines?.length) {
    ctx.fillStyle = ink;
    ctx.font = `${w * 0.05}px Georgia, 'Times New Roman', serif`;
    let ly = y + w * 0.115;
    for (const line of spec.lines) {
      ctx.fillText(line.toUpperCase(), cx, ly);
      ly += w * 0.07;
    }
  }
};

const paintRationingNotice: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  agedPaper(ctx, w, h, rng, bg);
  doubleBorder(ctx, w, h, w * 0.06, ink);

  ctx.textAlign = 'center';
  ctx.fillStyle = accent2;
  roundRect(ctx, w * 0.09, h * 0.1, w * 0.82, h * 0.115, w * 0.02);
  ctx.fill();
  ctx.fillStyle = '#f4ecd6';
  ctx.font = `800 ${w * 0.062}px Verdana, sans-serif`;
  ctx.fillText('MINISTRY OF FOOD NOTICE', w / 2, h * 0.175);

  ctx.fillStyle = ink;
  ctx.font = `900 ${w * 0.125}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), w / 2, h * 0.36, w * 0.8, w * 0.14);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${w * 0.058}px Verdana, sans-serif`;
    y = wrapCentered(ctx, spec.subtitle.toUpperCase(), w / 2, y + w * 0.02, w * 0.74, w * 0.072);
  }

  // Coupon strip: five stamped coupons.
  const couponY = Math.min(h * 0.78, y + h * 0.06);
  const couponW = w * 0.128;
  const gap = w * 0.03;
  const totalW = couponW * 5 + gap * 4;
  let cxp = w / 2 - totalW / 2;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i === 0 ? accent : '#f4ecd6';
    ctx.strokeStyle = ink;
    ctx.lineWidth = w * 0.006;
    roundRect(ctx, cxp, couponY, couponW, couponW * 0.72, w * 0.012);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = i === 0 ? '#f4ecd6' : ink;
    ctx.font = `700 ${w * 0.042}px Georgia, serif`;
    ctx.fillText(String(i + 1), cxp + couponW / 2, couponY + couponW * 0.5);
    cxp += couponW + gap;
  }
  if (spec.lines?.length) {
    ctx.fillStyle = ink;
    ctx.font = `italic ${w * 0.046}px Georgia, serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), w / 2, Math.min(h * 0.93, couponY + couponW * 1.25));
  }
};

const paintPopArtConcert: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  halftoneDisc(ctx, w * 0.5, h * 0.36, w * 0.42, accent2, bg);
  sunburst(ctx, w * 0.5, h * 0.36, w * 0.4, 12, accent);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.36, w * 0.17, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.save();
  ctx.translate(w / 2, h * 0.37);
  ctx.rotate(-0.05);
  ctx.font = `900 ${w * 0.155}px Impact, 'Arial Black', sans-serif`;
  wrapCentered(ctx, spec.title.toUpperCase(), 0, 0, w * 0.88, w * 0.165);
  ctx.restore();

  if (spec.subtitle) {
    ctx.fillStyle = bg;
    ctx.strokeStyle = ink;
    ctx.lineWidth = w * 0.008;
    const bannerY = h * 0.58;
    roundRect(ctx, w * 0.08, bannerY, w * 0.84, h * 0.1, w * 0.02);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = `800 ${w * 0.058}px 'Trebuchet MS', Verdana, sans-serif`;
    ctx.fillText(spec.subtitle.toUpperCase(), w / 2, bannerY + h * 0.067);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = ink;
    ctx.font = `700 ${w * 0.042}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), w / 2, h * 0.76);
  }
  // Ticket-strip footer.
  ctx.fillStyle = ink;
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  ctx.fillStyle = accent;
  ctx.font = `800 ${w * 0.05}px Verdana, sans-serif`;
  ctx.fillText('DOORS 7 · TICKETS AT THE BAR', w / 2, h * 0.945);
};

const paintBMoviePoster: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Menacing sky rings + jagged skyline silhouette (original).
  const cx = w / 2;
  const cy = h * 0.34;
  ctx.strokeStyle = accent2;
  for (let i = 5; i >= 1; i--) {
    ctx.lineWidth = w * 0.008;
    ctx.beginPath();
    ctx.arc(cx, cy, w * (0.09 + i * 0.052), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  const peaks = 9;
  for (let i = 0; i <= peaks; i++) {
    const px = (i / peaks) * w;
    ctx.lineTo(px, h * (0.62 + ((i % 2 === 0 ? 0.05 : -0.035) + (i % 3) * 0.012)));
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Creature legs poking over the ridge.
  ctx.strokeStyle = accent;
  ctx.lineWidth = w * 0.02;
  for (let i = 0; i < 4; i++) {
    const lx = w * (0.3 + i * 0.13);
    ctx.beginPath();
    ctx.moveTo(lx, h * 0.56);
    ctx.lineTo(lx + w * 0.02, h * 0.63);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `900 ${w * 0.118}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), cx, h * 0.14, w * 0.88, w * 0.126);
  if (spec.subtitle) {
    ctx.fillStyle = accent2;
    ctx.font = `italic 700 ${w * 0.05}px Georgia, serif`;
    y = wrapCentered(ctx, spec.subtitle.toUpperCase(), cx, y + w * 0.01, w * 0.8, w * 0.058);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = bg;
    ctx.font = `700 ${w * 0.04}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), cx, h * 0.87);
    if (spec.lines[1]) ctx.fillText(spec.lines[1].toUpperCase(), cx, h * 0.93);
  }
  void y;
};

const paintTravelPoster: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  // Banded sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, accent2);
  sky.addColorStop(1, bg);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Deco sun with rings.
  const cx = w * 0.5;
  const cy = h * 0.3;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = bg;
  ctx.lineWidth = w * 0.012;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.21 * (i / 4), Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  // Sea waves.
  ctx.fillStyle = accent2;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.strokeStyle = bg;
  ctx.lineWidth = w * 0.008;
  for (let row = 0; row < 4; row++) {
    const wy = h * (0.68 + row * 0.07);
    ctx.beginPath();
    for (let sx = 0; sx <= w; sx += w / 24) {
      ctx.lineTo(sx, wy + Math.sin((sx / w) * Math.PI * 5 + row) * h * 0.012);
    }
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `900 ${w * 0.13}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), cx, h * 0.83, w * 0.86, w * 0.138);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `800 ${w * 0.06}px Verdana, sans-serif`;
    wrapCentered(ctx, spec.subtitle.toUpperCase(), cx, y + w * 0.02, w * 0.8, w * 0.07);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = bg;
    ctx.font = `${w * 0.036}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0], cx, h * 0.97);
  }
};

const paintShopAdvert: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Star badge.
  sunburst(ctx, w * 0.74, h * 0.2, w * 0.17, 10, accent);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(w * 0.74, h * 0.2, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent2;
  ctx.font = `900 ${w * 0.055}px Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NEW!', w * 0.74, h * 0.215);

  ctx.fillStyle = ink;
  ctx.font = `900 ${w * 0.105}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), w * 0.46, h * 0.24, w * 0.62, w * 0.112);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `italic 700 ${w * 0.055}px Georgia, serif`;
    y = wrapCentered(ctx, `“${spec.subtitle}”`, w * 0.46, y + w * 0.02, w * 0.7, w * 0.062);
  }

  // Record-sleeve grid motif.
  const sleeve = w * 0.16;
  for (let i = 0; i < 4; i++) {
    const sx = w * 0.12 + i * sleeve * 1.25;
    ctx.fillStyle = [accent, accent2, ink, accent][i];
    ctx.fillRect(sx, h * 0.56, sleeve, sleeve);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(sx + sleeve / 2, h * 0.56 + sleeve / 2, sleeve * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  void rng;

  if (spec.lines?.length) {
    ctx.fillStyle = ink;
    ctx.font = `600 ${w * 0.038}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0], w / 2, h * 0.85);
  }
  // Tear-off dashed strip.
  ctx.strokeStyle = ink;
  ctx.setLineDash([w * 0.03, w * 0.02]);
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.91);
  ctx.lineTo(w * 0.94, h * 0.91);
  ctx.stroke();
  ctx.setLineDash([]);
};

const paintNeonBandPoster: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const horizon = h * 0.52;
  // Perspective floor grid.
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(1, w * 0.004);
  for (let i = -7; i <= 7; i++) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + i * w * 0.06, horizon);
    ctx.lineTo(w / 2 + i * w * 0.32, h);
    ctx.stroke();
  }
  for (let i = 1; i <= 6; i++) {
    const gy = horizon + (h - horizon) * (i / 6) ** 1.7;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Striped retro sun on the horizon.
  const sunGrad = ctx.createLinearGradient(0, horizon - h * 0.26, 0, horizon);
  sunGrad.addColorStop(0, accent);
  sunGrad.addColorStop(1, accent2);
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(w / 2, horizon, w * 0.23, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = bg;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(w / 2 - w * 0.24, horizon - h * 0.05 - i * h * 0.045, w * 0.48, h * 0.016);
  }

  ctx.textAlign = 'center';
  neonText(
    ctx,
    spec.title.toUpperCase(),
    w / 2,
    h * 0.2,
    `900 ${w * 0.125}px Impact, 'Arial Black', sans-serif`,
    ink === bg ? '#ffffff' : ink,
    accent,
  );
  if (spec.subtitle) {
    neonText(
      ctx,
      spec.subtitle.toUpperCase(),
      w / 2,
      h * 0.29,
      `700 ${w * 0.055}px Verdana, sans-serif`,
      accent2,
      accent,
      2,
    );
  }
  if (spec.lines?.length) {
    ctx.fillStyle = '#cfcfe8';
    ctx.font = `600 ${w * 0.038}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), w / 2, h * 0.94);
  }
};

const paintArcadeAd: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  // Starfield.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(rng() * w, rng() * h, 2, 2);
  }

  // Pixel invader sprite (original arrangement).
  const cell = w * 0.032;
  const ox = w * 0.5 - cell * 5.5;
  const oy = h * 0.42;
  const sprite = [
    '..X.....X..',
    '...X...X...',
    '..XXXXXXX..',
    '.XX.XXX.XX.',
    'XXXXXXXXXXX',
    'X.XXXXXXX.X',
    'X.X.....X.X',
    '...XX.XX...',
  ];
  ctx.fillStyle = accent;
  sprite.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === 'X') ctx.fillRect(ox + rx * cell, oy + ry * cell, cell * 0.92, cell * 0.92);
    });
  });

  ctx.textAlign = 'center';
  neonText(
    ctx,
    spec.title.toUpperCase(),
    w / 2,
    h * 0.17,
    `900 ${w * 0.14}px 'Courier New', monospace`,
    accent2,
    accent,
    2,
  );
  if (spec.subtitle) {
    ctx.fillStyle = accent2;
    ctx.font = `700 ${w * 0.05}px 'Courier New', monospace`;
    wrapCentered(ctx, spec.subtitle.toUpperCase(), w / 2, h * 0.27, w * 0.8, w * 0.058);
  }

  // Blinking INSERT COIN box.
  ctx.strokeStyle = accent2;
  ctx.lineWidth = w * 0.01;
  roundRect(ctx, w * 0.22, h * 0.78, w * 0.56, h * 0.1, w * 0.015);
  ctx.stroke();
  ctx.fillStyle = accent2;
  ctx.font = `800 ${w * 0.055}px 'Courier New', monospace`;
  ctx.fillText('INSERT COIN', w / 2, h * 0.85);
  if (spec.lines?.length) {
    ctx.fillStyle = '#9adfff';
    ctx.font = `600 ${w * 0.034}px Verdana, sans-serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), w / 2, h * 0.95);
  }
  void ink;
};

const paintFilmAd: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Laser slashes.
  ctx.save();
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = i % 2 ? accent : accent2;
    ctx.lineWidth = w * (0.012 + rng() * 0.014);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    const sy = h * (0.3 + i * 0.09);
    ctx.moveTo(-w * 0.1, sy);
    ctx.lineTo(w * 1.1, sy - h * 0.16);
    ctx.stroke();
  }
  ctx.restore();

  // Crosshair target.
  ctx.strokeStyle = accent;
  ctx.lineWidth = w * 0.008;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.42, w * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - w * 0.26, h * 0.42);
  ctx.lineTo(w * 0.5 + w * 0.26, h * 0.42);
  ctx.moveTo(w * 0.5, h * 0.42 - w * 0.26);
  ctx.lineTo(w * 0.5, h * 0.42 + w * 0.26);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = ink === bg ? '#ffffff' : ink;
  ctx.font = `900 ${w * 0.115}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), w / 2, h * 0.72, w * 0.9, w * 0.122);
  if (spec.subtitle) {
    ctx.fillStyle = accent2;
    ctx.font = `italic 700 ${w * 0.045}px Georgia, serif`;
    y = wrapCentered(ctx, spec.subtitle.toUpperCase(), w / 2, y, w * 0.84, w * 0.05);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = '#bbbbcc';
    ctx.font = `600 ${w * 0.034}px Verdana, sans-serif`;
    ctx.fillText(spec.lines.join('  ·  ').toUpperCase(), w / 2, Math.min(h * 0.97, y + h * 0.03));
  }
};

const paintPolaroidPhoto: Painter = (ctx, w, h, spec, rng) => {
  const { ink, accent, accent2 } = pal(spec);
  // White frame.
  ctx.fillStyle = '#f6f5ef';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.07;
  const photoH = h * 0.72;

  // Snapshot scene variant by seed.
  const scene = rng();
  const grad = ctx.createLinearGradient(pad, pad, w - pad, photoH);
  if (scene < 0.34) {
    grad.addColorStop(0, accent); // sunset gig
    grad.addColorStop(1, accent2);
  } else if (scene < 0.67) {
    grad.addColorStop(0, accent2); // daylight
    grad.addColorStop(1, accent);
  } else {
    grad.addColorStop(0, accent); // dusk
    grad.addColorStop(0.6, accent2);
    grad.addColorStop(1, ink);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(pad, pad, w - pad * 2, photoH - pad);

  // Grainy highlights.
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(pad + rng() * (w - pad * 2), pad + rng() * (photoH - pad), 2, 2);
  }
  // Horizon band.
  ctx.fillStyle = 'rgba(20,20,30,0.35)';
  ctx.fillRect(pad, pad + (photoH - pad) * 0.62, w - pad * 2, (photoH - pad) * 0.14);

  // Handwritten caption.
  ctx.fillStyle = '#3a3a48';
  ctx.font = `italic 600 ${w * 0.13}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(spec.title, w / 2, photoH + (h - photoH) * 0.62, w * 0.86);

  // Slight corner curl shading.
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w - w * 0.09, 0);
  ctx.lineTo(w, h * 0.09);
  ctx.closePath();
  ctx.fill();
};

const paintGlossyOneSheet: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.32, w * 0.1, w * 0.5, h * 0.5, h * 0.85);
  grad.addColorStop(0, accent);
  grad.addColorStop(0.55, bg);
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Hero silhouette: cloaked figure on a ridge (original).
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.28);
  ctx.quadraticCurveTo(w * 0.62, h * 0.4, w * 0.58, h * 0.58);
  ctx.lineTo(w * 0.42, h * 0.58);
  ctx.quadraticCurveTo(w * 0.38, h * 0.4, w * 0.5, h * 0.28);
  ctx.closePath();
  ctx.fill();
  // Glowing artifact held high.
  ctx.fillStyle = accent2;
  ctx.shadowColor = accent2;
  ctx.shadowBlur = w * 0.06;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.245, w * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Metallic title via vertical gradient fill.
  ctx.textAlign = 'center';
  const metal = ctx.createLinearGradient(0, h * 0.6, 0, h * 0.74);
  metal.addColorStop(0, '#fdfdfd');
  metal.addColorStop(0.5, ink);
  metal.addColorStop(1, '#8a8a92');
  ctx.fillStyle = metal;
  ctx.font = `900 ${w * 0.128}px Impact, 'Arial Black', sans-serif`;
  wrapCentered(ctx, spec.title.toUpperCase(), w / 2, h * 0.68, w * 0.9, w * 0.136);

  if (spec.subtitle) {
    ctx.fillStyle = accent2;
    ctx.font = `700 ${w * 0.048}px Georgia, serif`;
    wrapCentered(ctx, spec.subtitle.toUpperCase(), w / 2, h * 0.77, w * 0.86, w * 0.054);
  }

  // Billing block.
  ctx.fillStyle = 'rgba(235,235,240,0.75)';
  ctx.font = `500 ${w * 0.026}px 'Courier New', monospace`;
  ctx.fillText(
    'A PICTUREHOUSE ORIGINAL · SCORE BY THE AMBER ENSEMBLE',
    w / 2,
    h * 0.88,
  );
  ctx.fillText(`RUNTIME 142 MIN · RATED PG-13 · SEED ${rng().toFixed(3).slice(2)}`, w / 2, h * 0.915);
  if (spec.lines?.length) {
    ctx.fillStyle = '#ffd97a';
    ctx.font = `800 ${w * 0.05}px Impact, sans-serif`;
    ctx.fillText(spec.lines[0].toUpperCase(), w / 2, h * 0.96);
  }
  glossSheen(ctx, w, h, 0.14);
};

const paintWifiSticker: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent } = pal(spec);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, w, h, w * 0.16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = w * 0.012;
  roundRect(ctx, w * 0.035, w * 0.035, w * 0.93, h * 0.93, w * 0.13);
  ctx.stroke();

  // Wifi arcs.
  const cx = w * 0.5;
  const cy = h * 0.4;
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  for (let i = 3; i >= 1; i--) {
    ctx.lineWidth = w * 0.035;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.09 * i, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();
  }
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(cx, cy + w * 0.035, w * 0.035, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `800 ${w * 0.105}px Verdana, sans-serif`;
  ctx.fillText('FREE Wi-Fi', w / 2, h * 0.71);
  ctx.font = `700 ${w * 0.07}px Verdana, sans-serif`;
  ctx.fillStyle = accent;
  ctx.fillText('Z O N E', w / 2, h * 0.85);
  if (spec.subtitle) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `500 ${w * 0.038}px Verdana, sans-serif`;
    ctx.fillText(spec.subtitle, w / 2, h * 0.955, w * 0.9);
  }
};

const paintLoyaltyCard: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, w, h, w * 0.09);
  ctx.fill();
  ctx.strokeStyle = accent2;
  ctx.lineWidth = w * 0.012;
  roundRect(ctx, w * 0.03, w * 0.03, w * 0.94, h - w * 0.06, w * 0.07);
  ctx.stroke();

  // Header band.
  ctx.fillStyle = accent;
  roundRect(ctx, 0, 0, w, h * 0.24, w * 0.09);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.textAlign = 'center';
  ctx.font = `800 ${w * 0.095}px Georgia, serif`;
  ctx.fillText(spec.title, w / 2, h * 0.165);

  ctx.fillStyle = ink;
  ctx.font = `700 ${w * 0.06}px Verdana, sans-serif`;
  ctx.fillText(spec.subtitle ?? '', w / 2, h * 0.35);

  // Punch-hole grid 5 × 2, first three stamped.
  const holeR = w * 0.055;
  const cols = 5;
  const startX = w * 0.5 - (cols - 1) * holeR * 3.4 * 0.5;
  for (let rowIdx = 0; rowIdx < 2; rowIdx++) {
    for (let col = 0; col < cols; col++) {
      const hx = startX + col * holeR * 3.4;
      const hy = h * (0.47 + rowIdx * 0.17);
      ctx.beginPath();
      ctx.arc(hx, hy, holeR, 0, Math.PI * 2);
      ctx.fillStyle = rowIdx === 0 && col < 3 ? accent : bg;
      ctx.fill();
      ctx.strokeStyle = ink;
      ctx.lineWidth = w * 0.008;
      ctx.stroke();
    }
  }
  if (spec.lines?.length) {
    ctx.fillStyle = accent2;
    ctx.font = `italic 500 ${w * 0.038}px Georgia, serif`;
    ctx.fillText(spec.lines[0], w / 2, h * 0.92, w * 0.9);
  }
};

const paintMinimalPrint: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Composition: large arch, offset disc, single rule.
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(w * 0.24, h * 0.62);
  ctx.lineTo(w * 0.24, h * 0.34);
  ctx.arc(w * 0.41, h * 0.34, w * 0.17, Math.PI, 0);
  ctx.lineTo(w * 0.58, h * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = accent2;
  ctx.beginPath();
  ctx.arc(w * 0.69, h * 0.31, w * 0.085, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = ink;
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.7);
  ctx.lineTo(w * 0.8, h * 0.7);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.font = `300 ${w * 0.05}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
  ctx.fillText(spec.title, w * 0.2, h * 0.79);
  if (spec.subtitle) {
    ctx.fillStyle = 'rgba(60,56,50,0.65)';
    ctx.font = `300 ${w * 0.032}px 'Helvetica Neue', Helvetica, Arial, sans-serif`;
    ctx.fillText(spec.subtitle, w * 0.2, h * 0.845);
  }
};

const paintQrEventPoster: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, h * 0.045);
  ctx.fillRect(0, h * 0.955, w, h * 0.045);

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `700 ${w * 0.085}px 'Helvetica Neue', Arial, sans-serif`;
  let y = wrapCentered(ctx, spec.title, w / 2, h * 0.17, w * 0.84, w * 0.095);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `500 ${w * 0.05}px 'Helvetica Neue', Arial, sans-serif`;
    y = wrapCentered(ctx, spec.subtitle, w / 2, y + w * 0.015, w * 0.8, w * 0.056);
  }

  const qrSize = w * 0.52;
  qrBlock(ctx, w / 2 - qrSize / 2, Math.max(y + h * 0.03, h * 0.34), qrSize, 25, ink, rng);

  ctx.fillStyle = ink;
  ctx.font = `600 ${w * 0.038}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillText('SCAN FOR TICKETS', w / 2, h * 0.925);
  if (spec.lines?.length) {
    ctx.fillStyle = 'rgba(40,38,34,0.7)';
    ctx.font = `400 ${w * 0.032}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillText(spec.lines[0], w / 2, h * 0.9);
  }
  void accent2;
};

const paintSustainabilityCert: Painter = (ctx, w, h, spec, _rng) => {
  void _rng;
  const { bg, ink, accent, accent2 } = pal(spec);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  doubleBorder(ctx, w, h, w * 0.045, accent);
  // Corner ticks.
  ctx.strokeStyle = accent;
  ctx.lineWidth = w * 0.01;
  const t = w * 0.09;
  for (const [cx2, cy2, dx, dy] of [
    [t, t, 1, 1],
    [w - t, t, -1, 1],
    [t, h - t, 1, -1],
    [w - t, h - t, -1, -1],
  ] as Array<[number, number, number, number]>) {
    ctx.beginPath();
    ctx.moveTo(cx2, cy2);
    ctx.lineTo(cx2 + dx * w * 0.05, cy2);
    ctx.moveTo(cx2, cy2);
    ctx.lineTo(cx2, cy2 + dy * h * 0.04);
    ctx.stroke();
  }

  // Leaf seal.
  const lx = w * 0.5;
  const ly = h * 0.2;
  laurelWreath(ctx, lx, ly, w * 0.1, accent2);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(lx, ly, w * 0.035, w * 0.05, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = bg;
  ctx.lineWidth = w * 0.007;
  ctx.beginPath();
  ctx.moveTo(lx - w * 0.03, ly + w * 0.045);
  ctx.quadraticCurveTo(lx, ly, lx + w * 0.032, ly - w * 0.042);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `700 ${w * 0.075}px Georgia, 'Times New Roman', serif`;
  let y = wrapCentered(ctx, spec.title, w / 2, h * 0.46, w * 0.8, w * 0.082);
  if (spec.subtitle) {
    ctx.fillStyle = accent2;
    ctx.font = `400 ${w * 0.042}px Georgia, serif`;
    y = wrapCentered(ctx, spec.subtitle, w / 2, y + w * 0.02, w * 0.78, w * 0.048);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = 'rgba(60,60,54,0.8)';
    ctx.font = `400 ${w * 0.032}px 'Helvetica Neue', Arial, sans-serif`;
    ctx.fillText(spec.lines[0], w / 2, Math.min(h * 0.9, y + h * 0.04));
  }
  // Wax-seal dot.
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.86, w * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.font = `700 ${w * 0.045}px Georgia, serif`;
  ctx.fillText('GL', w * 0.82, h * 0.875);
};

const paintFramedNotice: Painter = (ctx, w, h, spec, rng) => {
  const { bg, ink, accent } = pal(spec);
  agedPaper(ctx, w, h, rng, bg);
  doubleBorder(ctx, w, h, w * 0.055, ink);
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.055, h * 0.09, w * 0.89, h * 0.05);
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = `800 ${w * 0.1}px Impact, 'Arial Black', sans-serif`;
  let y = wrapCentered(ctx, spec.title.toUpperCase(), w / 2, h * 0.32, w * 0.82, w * 0.108);
  if (spec.subtitle) {
    ctx.fillStyle = accent;
    ctx.font = `700 ${w * 0.05}px Verdana, sans-serif`;
    y = wrapCentered(ctx, spec.subtitle.toUpperCase(), w / 2, y + w * 0.015, w * 0.76, w * 0.056);
  }
  if (spec.lines?.length) {
    ctx.fillStyle = ink;
    ctx.font = `500 ${w * 0.038}px Verdana, sans-serif`;
    let ly = y + h * 0.05;
    for (const line of spec.lines.slice(0, 3)) {
      wrapCentered(ctx, line, w / 2, ly, w * 0.76, w * 0.046);
      ly += w * 0.075;
    }
  }
};

const PAINTERS: Record<PosterSpec['style'], Painter> = {
  propagandaNotice: paintPropagandaNotice,
  rationingNotice: paintRationingNotice,
  popArtConcert: paintPopArtConcert,
  bMoviePoster: paintBMoviePoster,
  travelPoster: paintTravelPoster,
  shopAdvert: paintShopAdvert,
  neonBandPoster: paintNeonBandPoster,
  arcadeAd: paintArcadeAd,
  filmAd: paintFilmAd,
  polaroidPhoto: paintPolaroidPhoto,
  glossyOneSheet: paintGlossyOneSheet,
  wifiSticker: paintWifiSticker,
  loyaltyCard: paintLoyaltyCard,
  minimalPrint: paintMinimalPrint,
  qrEventPoster: paintQrEventPoster,
  sustainabilityCert: paintSustainabilityCert,
  framedNotice: paintFramedNotice,
};

/* ------------------------------------------------------------------------- */
/* Texture factory                                                            */
/* ------------------------------------------------------------------------- */

const PX_PER_METRE = 430;
const MAX_EDGE_PX = 1024;
const MIN_EDGE_PX = 220;

export interface PaintedPoster {
  texture: THREE.CanvasTexture;
  /** Fallback flat colour derived from the palette (frame/backing tint). */
  fallbackColor: string;
}

function cssColor(spec: PosterSpec, index: number, fallback: string): string {
  const value = spec.palette[index];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/**
 * Paints the spec onto a fresh canvas and wraps it in a THREE texture.
 * Returns `null` when no DOM canvas is available (headless/test environments).
 */
export function createPosterTexture(spec: PosterSpec): PaintedPoster | null {
  const doc: Document | undefined = typeof document === 'undefined' ? undefined : document;
  if (!doc || typeof doc.createElement !== 'function') return null;

  const canvas = doc.createElement('canvas');
  if (!canvas) return null;

  let width = Math.round(spec.size[0] * PX_PER_METRE);
  let height = Math.round(spec.size[1] * PX_PER_METRE);
  const longest = Math.max(width, height);
  if (longest > MAX_EDGE_PX) {
    const scale = MAX_EDGE_PX / longest;
    width = Math.max(MIN_EDGE_PX, Math.round(width * scale));
    height = Math.max(MIN_EDGE_PX, Math.round(height * scale));
  }
  width = Math.max(MIN_EDGE_PX, width);
  height = Math.max(MIN_EDGE_PX, height);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const painter = PAINTERS[spec.style] ?? paintFramedNotice;
  painter(ctx, width, height, spec, mulberry32(hashCode(`${spec.id}:${spec.style}`)));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  applyTextureQuality(texture);
  texture.name = `poster-tex-${spec.id}`;

  return {
    texture,
    // Flat tint for frames/fallback faces: mid-palette accent.
    fallbackColor: cssColor(spec, 2, cssColor(spec, 1, '#8a8074')),
  };
}
