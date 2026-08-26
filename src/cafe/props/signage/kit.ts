import * as THREE from 'three';
import {
  box,
  cone,
  cylinder,
  disc,
  markGlowSurface,
  markNoCastShadow,
  orient,
  sphere,
  torus,
} from '../machines/kit/geometries';
import { blackSteel, brass, glass, glow, metal } from '../machines/kit/materials';
import { applyTextureQuality } from '../../rendering/textureQuality';

/**
 * Shared part kit for the signage & lighting prop group.
 *
 * Everything here is deliberately allocation-friendly for tests: canvas
 * textures degrade to plain emissive materials when `document` is missing
 * (vitest runs in node), mirroring the guard used by the menu-board textures.
 */

/* ------------------------------------------------------------------------- */
/* Canvas sign faces                                                          */
/* ------------------------------------------------------------------------- */

export interface SignFaceOptions {
  /** Text painted on the face. */
  text: string;
  /** CSS colour of the lettering. */
  textColor: string;
  /** Optional backing colour (defaults to transparent-black glow panel). */
  backgroundColor?: string;
  /** Optional border stroke colour + width in px. */
  borderColor?: string;
  borderWidth?: number;
  /** CSS font stack; defaults to a bold condensed sans. */
  font?: string;
  /** Glow radius in px around the letters (neon/backlit looks). */
  glowPx?: number;
  /** Italic slant for retro scripts. */
  italic?: boolean;
  /** Texture resolution in px. */
  widthPx?: number;
  heightPx?: number;
}

function tryCreate2D(width: number, height: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return null;
  }
  try {
    const candidate = document.createElement('canvas');
    if (typeof candidate.getContext !== 'function') return null;
    const ctx = candidate.getContext('2d');
    if (!ctx) return null;
    candidate.width = width;
    candidate.height = height;
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Paints a glowing sign face onto a canvas texture; returns `null` when no
 * real 2D context is available (node tests) so callers can fall back to a
 * flat emissive material.
 */
export function makeSignTexture(options: SignFaceOptions): THREE.CanvasTexture | null {
  const widthPx = options.widthPx ?? 512;
  const heightPx = options.heightPx ?? Math.max(96, Math.round((widthPx * 2) / 5));
  const ctx = tryCreate2D(widthPx, heightPx);
  if (!ctx) return null;

  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, widthPx, heightPx);
  }
  if (options.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth ?? 8;
    ctx.strokeRect(
      (options.borderWidth ?? 8) / 2,
      (options.borderWidth ?? 8) / 2,
      widthPx - (options.borderWidth ?? 8),
      heightPx - (options.borderWidth ?? 8),
    );
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${options.italic ? 'italic ' : ''}${options.font ?? `bold ${Math.round(heightPx * 0.62)}px "Trebuchet MS", "Arial Black", sans-serif`}`;
  if (options.glowPx) {
    ctx.shadowColor = options.textColor;
    ctx.shadowBlur = options.glowPx;
  }
  ctx.fillStyle = options.textColor;
  // Double-draw so shadowed glyphs saturate like real tube/backlit signage.
  ctx.fillText(options.text, widthPx / 2, heightPx / 2 + heightPx * 0.03);
  ctx.fillText(options.text, widthPx / 2, heightPx / 2 + heightPx * 0.03);

  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  applyTextureQuality(texture);
  return texture;
}

export interface SignFaceResult {
  material: THREE.MeshStandardMaterial;
  /** True when a canvas texture could be created (browser environments). */
  textured: boolean;
}

/**
 * Builds an emissive sign-face material. When canvas is unavailable the
 * fallback colour stands in for the whole face so node tests still exercise
 * realistic material graphs.
 */
export function makeSignFace(
  options: SignFaceOptions & { fallbackColor: number; emissiveIntensity?: number },
): SignFaceResult {
  const intensity = options.emissiveIntensity ?? 1.35;
  const texture = makeSignTexture(options);
  if (texture) {
    const material = new THREE.MeshStandardMaterial({
      color: 0x101010,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: intensity,
      roughness: 0.42,
      metalness: 0,
    });
    return { material, textured: true };
  }
  const material = new THREE.MeshStandardMaterial({
    color: options.fallbackColor,
    emissive: options.fallbackColor,
    emissiveIntensity: intensity,
    roughness: 0.42,
    metalness: 0,
  });
  return { material, textured: false };
}

/** Double-sided painted board (hand-painted hanging wooden signs). */
export function makePaintedBoard(
  width: number,
  height: number,
  depth: number,
  face: SignFaceResult,
  frame: THREE.Material,
): THREE.Mesh {
  const boardGeo = new THREE.BoxGeometry(width, height, depth);
  const materials = [
    frame, // +x edge
    frame, // -x edge
    frame, // +y edge
    frame, // -y edge
    face.material, // +z face
    face.material, // -z face
  ];
  return new THREE.Mesh(boardGeo, materials);
}

/* ------------------------------------------------------------------------- */
/* Fixture parts                                                              */
/* ------------------------------------------------------------------------- */

export interface PendantLampOptions {
  /** World y of the shade/bulb (cord rises to the ceiling from here). */
  dropY: number;
  ceilingY?: number;
  shadeRadius?: number;
  shadeHeight?: number;
  shade: THREE.Material;
  rim?: THREE.Material;
  bulb: THREE.Material;
}

/**
 * Cord-hung pendant lamp with its opening facing down. Origin sits at the
 * ceiling attach point so variants can hang several from y = CEILING_Y.
 */
export function makePendantLamp(options: PendantLampOptions): THREE.Group {
  const lamp = new THREE.Group();
  const drop = options.dropY;
  const ceilingY = options.ceilingY ?? 0;
  const radius = options.shadeRadius ?? 0.18;
  const height = options.shadeHeight ?? 0.15;

  lamp.add(cylinder(blackSteel(), 0.006, 0.006, ceilingY - drop, 0, (ceilingY + drop) / 2, 0));
  lamp.add(cylinder(blackSteel(), 0.02, 0.02, 0.02, 0, ceilingY - 0.01, 0)); // ceiling rose
  // Cone apex up (toward the cord), wide brim down — classic metal shade.
  lamp.add(cone(options.shade, radius, height, 0, drop + height / 2, 0));
  if (options.rim) {
    lamp.add(orient(torus(options.rim, radius * 0.94, 0.014, 0, drop + 0.012, 0), Math.PI / 2, 0, 0));
  }
  const bulbMesh = sphere(options.bulb, radius * 0.28, 0, drop - radius * 0.16, 0);
  markGlowSurface(bulbMesh);
  lamp.add(bulbMesh);
  return lamp;
}

/** Exposed filament-style bulb (Edison look) with optional cage rings. */
export function makeEdisonBulb(material: THREE.Material, radius = 0.045, cage = true): THREE.Group {
  const bulb = new THREE.Group();
  const glass0 = sphere(material, radius, 0, 0, 0);
  markGlowSurface(glass0);
  bulb.add(glass0);
  bulb.add(cylinder(blackSteel(), 0.016, 0.02, 0.05, 0, radius + 0.02, 0)); // brass cap
  if (cage) {
    bulb.add(orient(torus(blackSteel(), radius * 1.18, 0.004, 0, -radius * 0.25, 0), Math.PI / 2, 0, 0));
    bulb.add(orient(torus(blackSteel(), radius * 1.12, 0.004, 0, radius * 0.3, 0), Math.PI / 2, 0, 0));
  }
  return bulb;
}

/**
 * Gaslight-style wall sconce: backplate, glazed lantern body, corner posts,
 * domed cap and a flame glow. Origin at the backplate centre.
 */
export function makeGasSconce(): { group: THREE.Group; flame: THREE.Mesh } {
  const sconce = new THREE.Group();
  const plateMat = brass();
  const glassMat = glass(0xf2e6c8, 0.32);

  sconce.add(box(plateMat, 0.05, 0.36, 0.2, 0, 0, 0.06));
  sconce.add(disc(plateMat, 0.085, 0, -0.13, -0.01, 'x'));
  sconce.add(cone(plateMat, 0.095, 0.07, 0, 0.17, -0.01));

  const postOffsets: Array<[number, number]> = [
    [-0.055, -0.06],
    [0.055, -0.06],
    [-0.055, 0.04],
    [0.055, 0.04],
  ];
  for (const [px, pz] of postOffsets) {
    sconce.add(cylinder(plateMat, 0.008, 0.008, 0.26, px, 0.02, pz));
  }
  const lanternGlass = box(glassMat, 0.115, 0.2, 0.105, 0, 0.02, -0.01);
  markNoCastShadow(lanternGlass);
  sconce.add(lanternGlass);

  const flame = sphere(glow(0xffb254, 1.6), 0.028, 0, 0.0, -0.01, 1.5);
  markGlowSurface(flame);
  sconce.add(flame);
  return { group: sconce, flame };
}

/** Recessed downlight can flush with the ceiling; origin at can centre. */
export function makeDownlightCan(diffuser: THREE.Material): THREE.Group {
  const can = new THREE.Group();
  can.add(cylinder(metal(0xdadde2, 0.35, 0.85), 0.078, 0.07, 0.035, 0, 0, 0));
  const lensDisc = disc(diffuser, 0.06, 0, -0.016, 0, 'y');
  markNoCastShadow(lensDisc);
  can.add(lensDisc);
  return can;
}

/** Track-lighting spot head: knuckle sphere + barrel; aim via lookAt(). */
export function makeTrackHead(body: THREE.Material): THREE.Group {
  const head = new THREE.Group();
  head.add(sphere(body, 0.035, 0, 0, 0));
  const barrel = cylinder(body, 0.048, 0.055, 0.16, 0, 0, 0);
  barrel.rotation.x = Math.PI / 2; // point along -z locally before aiming
  head.add(barrel);
  head.add(cylinder(blackSteel(), 0.05, 0.046, 0.02, 0, 0, -0.09).rotateX(Math.PI / 2));
  return head;
}

/** Thin LED strip run; origin centred, extends along local x by `length`. */
export function makeLedStrip(length: number, colorHex: number, intensity = 1.5): THREE.Mesh {
  const strip = box(glow(colorHex, intensity), length, 0.018, 0.045, 0, 0, 0);
  markGlowSurface(strip);
  return strip;
}

/**
 * Blocky "dimensional letter" built on a 3×5 cell grid (brushed-metal fascia
 * letters). Returns a group centred on the letter's cell grid centre.
 */
export function makeBlockyLetter(
  rows: readonly string[],
  material: THREE.Material,
  cell: number,
  depth: number,
): THREE.Group {
  const letter = new THREE.Group();
  const halfW = ((rows[0]?.length ?? 3) * cell) / 2;
  const halfH = (rows.length * cell) / 2;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < (rows[r]?.length ?? 0); c++) {
      if (rows[r][c] !== '1') continue;
      const x = -halfW + cell * (c + 0.5);
      const y = halfH - cell * (r + 0.5);
      letter.add(box(material, cell * 0.92, cell * 0.92, depth, x, y, 0));
    }
  }
  return letter;
}
