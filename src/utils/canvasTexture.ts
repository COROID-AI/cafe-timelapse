import * as THREE from "three";

/**
 * Memoised CanvasTexture factory.
 *
 * Ownership note (documented per plan conventions): cached textures live
 * for the lifetime of the app and are intentionally never disposed.
 * Every caller requests textures by a serialised spec key, so repeated
 * mounts reuse the same GPU upload instead of leaking duplicates.
 */

const cache = new Map<string, THREE.CanvasTexture>();

interface TextSpec {
  lines: string[];
  bg: string;
  fg: string;
  font: string;
  align?: "left" | "center";
  glow?: string | null;
  width?: number;
  height?: number;
}

function specKey(prefix: string, spec: TextSpec): string {
  return [
    prefix,
    spec.bg,
    spec.fg,
    spec.font,
    spec.align ?? "center",
    spec.glow ?? "",
    spec.width ?? "",
    spec.height ?? "",
    ...spec.lines,
  ].join("|");
}

function drawTextTexture(spec: TextSpec): HTMLCanvasElement {
  const width = spec.width ?? 512;
  const height = spec.height ?? 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = spec.bg;
  ctx.fillRect(0, 0, width, height);

  if (spec.glow) {
    ctx.shadowColor = spec.glow;
    ctx.shadowBlur = 24;
  }

  ctx.fillStyle = spec.fg;
  ctx.font = spec.font;
  ctx.textAlign = spec.align ?? "center";
  ctx.textBaseline = "middle";

  const lineHeight = Math.min(64, height / Math.max(1, spec.lines.length + 1));
  const startY = height / 2 - ((spec.lines.length - 1) * lineHeight) / 2;
  const x = (spec.align ?? "center") === "center" ? width / 2 : 28;
  spec.lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight, width - 48);
  });
  return canvas;
}

export function getCachedTextTexture(prefix: string, spec: TextSpec): THREE.CanvasTexture | null {
  const key = specKey(prefix, spec);
  const existing = cache.get(key);
  if (existing) return existing;

  if (typeof document === "undefined") return null;
  const canvas = drawTextTexture(spec);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}

let noiseTexture: THREE.CanvasTexture | null = null;

/** Subtle grain texture used for floors/walls. Created once, shared. */
export function getSharedNoiseTexture(): THREE.CanvasTexture | null {
  if (noiseTexture) return noiseTexture;
  if (typeof document === "undefined") return null;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.createImageData(size, size);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = 200 + Math.floor(Math.random() * 55);
    imageData.data[i] = v;
    imageData.data[i + 1] = v;
    imageData.data[i + 2] = v;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  noiseTexture = new THREE.CanvasTexture(canvas);
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;
  noiseTexture.repeat.set(6, 6);
  return noiseTexture;
}
