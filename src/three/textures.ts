import * as THREE from 'three';

export interface PosterStyle {
  title: string;
  caption: string;
  year?: string;
  accent: string;
  background?: string;
  ink?: string;
}

export interface MenuStyle {
  title: string;
  subtitle?: string;
  items: { item: string; price: string }[];
  background?: string;
  ink?: string;
  accent?: string;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.05): void {
  ctx.fillStyle = `rgba(120, 96, 60, ${alpha})`;
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

/** Vintage poster: cream paper, accent border, serif headline, caption rule. */
export function makePosterTexture(style: PosterStyle): THREE.CanvasTexture {
  const w = 256;
  const h = 384;
  const [canvas, ctx] = makeCanvas(w, h);
  const bg = style.background ?? '#f2e8cf';
  const ink = style.ink ?? '#2b2116';
  const accent = style.accent;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // outer frame
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, w - 14, h - 14);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ink;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  // header band
  ctx.fillStyle = accent;
  ctx.fillRect(0, 78, w, 6);
  // title
  ctx.fillStyle = ink;
  ctx.font = 'bold 34px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  wrapText(ctx, style.title, w / 2, 130, w - 56, 38);
  // rule
  ctx.fillStyle = accent;
  ctx.fillRect(w / 2 - 42, 196, 84, 3);
  // caption
  ctx.fillStyle = ink;
  ctx.font = 'italic 20px Georgia, serif';
  wrapText(ctx, style.caption, w / 2, 236, w - 60, 26);
  // year
  if (style.year) {
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = accent;
    ctx.fillText(style.year, w / 2, 296);
  }
  // bottom flourish
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(w / 2, 330, 6, 0, Math.PI * 2);
  ctx.fill();
  grain(ctx, w, h, 0.07);
  return toTexture(canvas);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

/** Café menu board: cream card with title, dotted leaders, prices. */
export function makeMenuTexture(style: MenuStyle): THREE.CanvasTexture {
  const w = 384;
  const h = 512;
  const [canvas, ctx] = makeCanvas(w, h);
  const bg = style.background ?? '#1f3d2b';
  const ink = style.ink ?? '#f4e9d0';
  const accent = style.accent ?? '#c9a227';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // title
  ctx.fillStyle = ink;
  ctx.font = 'bold 30px Georgia, serif';
  wrapText(ctx, style.title, w / 2, 74, w - 48, 34);
  ctx.fillStyle = accent;
  ctx.fillRect(w / 2 - 60, 128, 120, 3);

  // items
  ctx.font = '20px Georgia, serif';
  const startY = 180;
  const lineH = 44;
  style.items.forEach((entry, i) => {
    const y = startY + i * lineH;
    ctx.textAlign = 'left';
    ctx.fillStyle = ink;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(entry.item, 40, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = accent;
    ctx.fillText(entry.price, w - 40, y);
    // dotted leader
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(40 + ctx.measureText(entry.item).width + 8, y);
    ctx.lineTo(w - 40 - ctx.measureText(entry.price).width - 8, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  });

  // footer
  ctx.textAlign = 'center';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.8;
  ctx.fillText(style.subtitle ?? 'Merci · Grazie · Thank you', w / 2, 470);
  ctx.globalAlpha = 1;
  return toTexture(canvas);
}

/** Neon sign texture with a glow — used for the 1985 era. */
export function makeNeonTexture(text: string, color: string): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 86px Impact, "Arial Black", sans-serif';
  ctx.shadowColor = color;
  ctx.shadowBlur = 46;
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 6);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, h / 2 + 6);
  return toTexture(canvas);
}

/** Classic café clock face. */
export function makeClockTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const [canvas, ctx] = makeCanvas(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const r = 118;

  ctx.fillStyle = '#f6efdd';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a2b18';
  ctx.lineWidth = 6;
  ctx.stroke();

  // hour ticks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x1 = cx + Math.sin(a) * (r - 12);
    const y1 = cy - Math.cos(a) * (r - 12);
    const x2 = cx + Math.sin(a) * (r - 26);
    const y2 = cy - Math.cos(a) * (r - 26);
    ctx.strokeStyle = i % 3 === 0 ? '#3a2b18' : '#8a7a5e';
    ctx.lineWidth = i % 3 === 0 ? 7 : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // hands ~10:08
  ctx.strokeStyle = '#2b2116';
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(-2.1) * 62, cy - Math.cos(-2.1) * 62);
  ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(0.9) * 84, cy - Math.cos(0.9) * 84);
  ctx.stroke();
  ctx.fillStyle = '#b3402e';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(canvas);
}

/** Wi-Fi sign used by 2005 / 2025. */
export function makeWifiTexture(ssid: string, accent: string): THREE.CanvasTexture {
  const w = 384;
  const h = 160;
  const [canvas, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#12325e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  // signal arcs
  for (let i = 0; i < 3; i++) {
    const rr = 24 + i * 20;
    ctx.globalAlpha = 1 - i * 0.18;
    ctx.beginPath();
    ctx.arc(64, 108, rr, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 116, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(ssid, 110, 66);
  ctx.font = '18px Arial, sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText('FREE HOTSPOT', 110, 100);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 132, w, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('— internet for your coffee —', w / 2, 146);
  return toTexture(canvas);
}
