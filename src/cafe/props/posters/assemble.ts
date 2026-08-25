/**
 * Assembles one era's wall-art object graph.
 *
 * Each poster is a canvas-textured plane slightly proud of its wall, backed by
 * an era-appropriate frame/board:
 *
 * - 1945 — frameless notices held by pale tape strips;
 * - 1965 — bold painted frames;
 * - 1985 — thin black frames (polaroids hang frameless), glowing faces;
 * - 2005 — slim glossy black acrylic frames, stickers/cards on white plates;
 * - 2025 — pale oak float frames.
 *
 * Every material is authored at opacity 1 and sets hide via visibility, so the
 * scene-wide transition controller's sticky baseline capture stays consistent.
 */

import * as THREE from 'three';
import type { PosterEraContent, PosterEraYear, PosterPlacement, PosterSpec } from './types';
import { assignSlots, getWallSlot } from './wallLayout';
import { createPosterTexture } from './posterTextures';

const FRAME_DEPTH = 0.02;
const WALL_CLEARANCE = 0.003;

/** Interior wall-face coordinates from the CafeScene shell. */
const WALL_FACE: Record<'north' | 'south' | 'east' | 'west', number> = {
  north: 5,
  south: -5,
  east: 6,
  west: -6,
};

interface EraFrameLook {
  /** Frame board colour, or null for frameless (tape/pin mounting). */
  color: string | null;
  roughness: number;
  metalness: number;
  /** Extra margin added around the poster. */
  margin: number;
}

function frameLookFor(year: PosterEraYear): EraFrameLook {
  switch (year) {
    case 1945:
      return { color: null, roughness: 0.95, metalness: 0, margin: 0 };
    case 1965:
      return { color: '#e8734a', roughness: 0.55, metalness: 0.05, margin: 0.05 };
    case 1985:
      return { color: '#17171c', roughness: 0.4, metalness: 0.2, margin: 0.03 };
    case 2005:
      return { color: '#101014', roughness: 0.25, metalness: 0.35, margin: 0.025 };
    case 2025:
      return { color: '#d8cbb8', roughness: 0.7, metalness: 0.02, margin: 0.045 };
  }
}

/** Emissive glow strength per style (neon-era pieces light themselves). */
function glowFor(style: PosterSpec['style']): number {
  switch (style) {
    case 'neonBandPoster':
      return 0.5;
    case 'arcadeAd':
      return 0.34;
    case 'filmAd':
      return 0.2;
    default:
      return 0;
  }
}

/** Deterministic per-poster placement list for a catalogue. */
export function placePosters(content: PosterEraContent): PosterPlacement[] {
  const assignments = assignSlots(content.papers);
  const out: PosterPlacement[] = [];
  for (const { index, slotId } of assignments) {
    if (getWallSlot(slotId)) out.push({ spec: content.papers[index], slotId });
  }
  return out;
}

/** World-space transform pieces derived from a slot. */
interface SlotTransform {
  position: [number, number, number];
  rotationY: number;
  /** Unit vector pointing into the room (posters sit along this). */
  normal: [number, number, number];
}

function slotTransform(slotWall: string, along: number, height: number): SlotTransform {
  switch (slotWall) {
    case 'north':
      return { position: [along, height, WALL_FACE.north], rotationY: Math.PI, normal: [0, 0, -1] };
    case 'south':
      return { position: [along, height, WALL_FACE.south], rotationY: 0, normal: [0, 0, 1] };
    case 'east':
      return { position: [WALL_FACE.east, height, along], rotationY: -Math.PI / 2, normal: [-1, 0, 0] };
    default: // west / west-till
      return { position: [WALL_FACE.west, height, along], rotationY: Math.PI / 2, normal: [1, 0, 0] };
  }
}

export interface PosterSetBuild {
  root: THREE.Group;
  /** All fadeable materials (faces, frames, tape) — authored at opacity 1. */
  materials: THREE.MeshStandardMaterial[];
  /** Per-poster groups in catalogue order (used by the curl animation). */
  posterGroups: THREE.Group[];
  dispose(): void;
}

export function buildPosterEraSet(content: PosterEraContent): PosterSetBuild {
  const root = new THREE.Group();
  root.name = `posters-era-${content.year}`;

  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  const materials: THREE.MeshStandardMaterial[] = [];
  const posterGroups: THREE.Group[] = [];

  const look = frameLookFor(content.year);

  let frameMaterial: THREE.MeshStandardMaterial | null = null;
  if (look.color !== null) {
    frameMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(look.color),
      roughness: look.roughness,
      metalness: look.metalness,
      transparent: true,
    });
    materials.push(frameMaterial);
  }

  // Shared unit boxes for frames / tape / plates.
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  geometries.push(unitBox);

  let tapeMaterial: THREE.MeshStandardMaterial | null = null;
  if (content.year === 1945) {
    tapeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ddd3b8'),
      roughness: 0.9,
      transparent: true,
    });
    materials.push(tapeMaterial);
  }

  for (const placement of placePosters(content)) {
    const { spec, slotId } = placement;
    const slot = getWallSlot(slotId);
    if (!slot) continue;

    const transform = slotTransform(
      slot.wall === 'west-till' ? 'west' : slot.wall,
      slot.position[0] !== 0 ? slot.position[0] : slot.position[2],
      slot.position[1],
    );

    const posterGroup = new THREE.Group();
    posterGroup.name = `poster-${spec.id}`;
    posterGroup.userData.posterId = spec.id;
    posterGroup.userData.title = spec.title;

    const [width, height] = spec.size;

    /* ----- Frame / backing board ------------------------------------- */
    if (frameMaterial && spec.style !== 'polaroidPhoto') {
      const frame = new THREE.Mesh(unitBox, frameMaterial);
      frame.scale.set(width + look.margin * 2, height + look.margin * 2, FRAME_DEPTH);
      frame.position.set(
        transform.position[0] + transform.normal[0] * (FRAME_DEPTH / 2 + WALL_CLEARANCE),
        transform.position[1],
        transform.position[2] + transform.normal[2] * (FRAME_DEPTH / 2 + WALL_CLEARANCE),
      );
      frame.rotation.y = transform.rotationY;
      frame.castShadow = true;
      frame.receiveShadow = true;
      posterGroup.add(frame);
    }

    // White mounting plates under till stickers/cards read as retail signage.
    if (slot.role === 'till') {
      const plateMat =
        tapeMaterial ??
        new THREE.MeshStandardMaterial({ color: new THREE.Color('#f4f2ec'), roughness: 0.6, transparent: true });
      if (!materials.includes(plateMat)) materials.push(plateMat);
      const plate = new THREE.Mesh(unitBox, plateMat);
      plate.scale.set(width + 0.06, height + 0.06, 0.008);
      plate.position.copy(framelessPosition(transform, FRAME_DEPTH));
      plate.rotation.y = transform.rotationY;
      plate.castShadow = false;
      plate.receiveShadow = true;
      posterGroup.add(plate);
    }

    /* ----- Canvas-textured face --------------------------------------- */
    const painted = createPosterTexture(spec);
    if (painted) textures.push(painted.texture);

    const glow = glowFor(spec.style);
    const faceMaterial = new THREE.MeshStandardMaterial({
      map: painted?.texture ?? null,
      // Textured faces stay white (texture carries the art); headless fallback
      // tints flat with the poster's accent swatch.
      color: painted ? 0xffffff : new THREE.Color(spec.palette[2] ?? spec.palette[1] ?? '#9a917f'),
      roughness: content.year >= 2005 ? 0.32 : content.year === 1945 ? 0.92 : 0.7,
      metalness: 0,
      transparent: true, // crossfade-ready; opacity authored at 1.
      emissive: new THREE.Color(glow > 0 ? (painted ? 0xffffff : spec.palette[2] ?? '#ffffff') : 0x000000),
      emissiveMap: glow > 0 && painted ? painted.texture : null,
      emissiveIntensity: glow,
    });
    materials.push(faceMaterial);

    const faceGeometry = new THREE.PlaneGeometry(width, height);
    geometries.push(faceGeometry);
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.name = `${spec.id}-face`;
    const faceOffset = frameMaterial && spec.style !== 'polaroidPhoto' ? FRAME_DEPTH : 0;
    face.position.set(
      transform.position[0] + transform.normal[0] * (faceOffset + 0.006 + WALL_CLEARANCE),
      transform.position[1],
      transform.position[2] + transform.normal[2] * (faceOffset + 0.006 + WALL_CLEARANCE),
    );
    face.rotation.y = transform.rotationY;
    face.userData.posterId = spec.id;
    face.userData.title = spec.title;
    face.castShadow = true;
    face.receiveShadow = true;
    posterGroup.add(face);

    /* ----- Mounting details ------------------------------------------- */
    if (tapeMaterial && look.color === null) {
      for (const side of [-1, 1]) {
        const tape = new THREE.Mesh(unitBox, tapeMaterial);
        tape.scale.set(width * 0.16, height * 0.045, 0.004);
        tape.position.set(
          transform.position[0] +
            transform.normal[0] * (FRAME_DEPTH + 0.008) +
            side * width * 0.36 * (transform.rotationY === 0 || transform.rotationY === Math.PI ? 1 : 0),
          transform.position[1] + height * 0.52,
          transform.position[2] +
            transform.normal[2] * (FRAME_DEPTH + 0.008) +
            side * width * 0.36 * (transform.rotationY === 0 || transform.rotationY === Math.PI ? 0 : 1),
        );
        tape.rotation.y = transform.rotationY;
        tape.rotation.z = side * 0.45;
        tape.castShadow = false;
        tape.receiveShadow = true;
        posterGroup.add(tape);
      }
    }

    /* ----- Base tilt --------------------------------------------------- */
    const baseTilt = THREE.MathUtils.degToRad(spec.tiltDeg ?? 0);
    posterGroup.userData.baseTiltZ = baseTilt;
    posterGroup.rotation.z = baseTilt;
    // Rotate around the poster centre, not the room origin: rebase position
    // through a pivot group placed at the slot.
    const pivot = new THREE.Group();
    pivot.name = `${spec.id}-pivot`;
    pivot.position.set(transform.position[0], transform.position[1], transform.position[2]);
    // Move children back relative to pivot.
    for (const child of [...posterGroup.children]) {
      child.position.sub(pivot.position);
    }
    pivot.add(...posterGroup.children);
    pivot.rotation.z = baseTilt;
    pivot.userData.baseTiltZ = baseTilt;
    pivot.userData.posterId = spec.id;
    pivot.userData.title = spec.title;
    pivot.name = `poster-${spec.id}`;

    posterGroups.push(pivot);
    root.add(pivot);
  }

  return {
    root,
    materials,
    posterGroups,
    dispose(): void {
      for (const texture of textures) texture.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      root.removeFromParent();
    },
  };
}

/** Position helper for pieces mounted without a frame (plates, bare planes). */
function framelessPosition(transform: SlotTransform, depth: number): THREE.Vector3 {
  return new THREE.Vector3(
    transform.position[0] + transform.normal[0] * (depth / 2 + WALL_CLEARANCE),
    transform.position[1],
    transform.position[2] + transform.normal[2] * (depth / 2 + WALL_CLEARANCE),
  );
}
