/**
 * CharacterAvatar.ts — procedural builder that turns a {@link PatronConfig}
 * into a seated Three.js figure.
 *
 * The avatar is composed entirely from Three.js primitives (cylinders,
 * capsules, spheres, boxes, planes) parameterized by the era palette via
 * {@link MaterialFactory}. It **never** rebuilds character geometry from
 * scratch per-config — the silhouette is fixed (seated torso + legs + head +
 * outfit accessories) and the config only swaps materials, hairstyle, hat, and
 * held gadget. This honours the "configure via PatronConfig + CharacterAvatar;
 * do not rebuild character geometry" constraint.
 *
 * The builder returns a single {@link Group} rooted at the anchor's floor
 * position, with the figure already seated (knees bent, torso upright) and
 * optionally holding the configured gadget.
 */
import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type Material,
  type Object3D,
} from 'three';
import {
  DEFAULT_SEAT_OFFSET,
  DEFAULT_SKIN_TONE,
  type GadgetConfig,
  type HairConfig,
  type HatConfig,
  type OutfitConfig,
  type PatronConfig,
} from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Seated-figure measurements (metres). Fixed silhouette — config only changes
// materials/accessories, never proportions.
// ---------------------------------------------------------------------------

// A patron sits with hips at the table, knees bent forward under the table top.
// Table-top height is ~0.75 m (see layout.ts seating anchors at y=0); the seat
// surface is ~0.45 m. The avatar root is at the floor; all parts are stacked
// from there.
const HIP_Y = 0.45; // hip pivot / seat surface height
const TORSO_TOP_Y = 0.95; // shoulder line
const NECK_Y = 1.0;
const HEAD_CENTER_Y = 1.12;
const HEAD_RADIUS = 0.11;

// Outfit-family silhouettes.
const SUIT_SHOULDER_W = 0.34;
const SUIT_CHEST_H = 0.5;
const DRESS_SHOULDER_W = 0.3;
const DRESS_CHEST_H = 0.46;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Degrees → radians. */
function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Create a mesh, position it, add it to a parent, return it for tuning. */
function part(
  geometry:
    | BoxGeometry
    | CylinderGeometry
    | SphereGeometry
    | CapsuleGeometry
    | ConeGeometry
    | TorusGeometry
    | PlaneGeometry,
  material: Material,
  parent: Group,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Outfit families
// ---------------------------------------------------------------------------

/**
 * Build the torso + seated legs for a given outfit family. Returns the parent
 * group containing the garment meshes. Proportions are fixed; the config only
 * selects the family and colours.
 */
function buildOutfit(outfit: OutfitConfig, root: Group): void {
  const jacketMat = new MeshStandardMaterial({
    color: outfit.color,
    roughness: 0.82,
    metalness: 0.0,
  });
  const accentMat = new MeshStandardMaterial({
    color: outfit.accent,
    roughness: 0.78,
    metalness: 0.0,
  });

  if (outfit.type === 'suit') {
    // Torso block (jacket).
    const torso = part(
      new BoxGeometry(SUIT_SHOULDER_W, SUIT_CHEST_H, 0.22),
      jacketMat,
      root,
      0,
      (HIP_Y + TORSO_TOP_Y) / 2,
      0,
    );
    torso.castShadow = true;

    // Shirt collar / tie accent strip down the front.
    part(
      new BoxGeometry(0.09, SUIT_CHEST_H * 0.9, 0.02),
      accentMat,
      root,
      0,
      (HIP_Y + TORSO_TOP_Y) / 2,
      0.12,
    );

    // Two seated thighs (horizontal cylinders from hip forward).
    const legMat = new MeshStandardMaterial({
      color: outfit.color,
      roughness: 0.85,
      metalness: 0.0,
    });
    for (const sx of [-0.09, 0.09]) {
      const thigh = part(
        new CapsuleGeometry(0.07, 0.36, 6, 12),
        legMat,
        root,
        sx,
        HIP_Y,
        0.16,
      );
      thigh.rotation.x = rad(90);
      thigh.castShadow = true;
      // Lower legs (calves) going down to the floor.
      const calf = part(
        new CapsuleGeometry(0.06, 0.32, 6, 12),
        legMat,
        root,
        sx,
        HIP_Y - 0.18,
        0.36,
      );
      calf.castShadow = true;
    }
  } else {
    // dayDress — slightly narrower shoulders, A-line skirt over the lap.
    const torso = part(
      new BoxGeometry(DRESS_SHOULDER_W, DRESS_CHEST_H, 0.2),
      jacketMat,
      root,
      0,
      (HIP_Y + TORSO_TOP_Y) / 2,
      0,
    );
    torso.castShadow = true;

    // Blouse collar accent.
    part(
      new BoxGeometry(0.1, 0.1, 0.02),
      accentMat,
      root,
      0,
      TORSO_TOP_Y - 0.05,
      0.1,
    );

    // A-line skirt: a short cone frustum over the lap/thighs.
    const skirtMat = new MeshStandardMaterial({
      color: outfit.color,
      roughness: 0.88,
      metalness: 0.0,
    });
    const skirt = part(
      new ConeGeometry(0.24, 0.28, 16, 1, true),
      skirtMat,
      root,
      0,
      HIP_Y - 0.02,
      0.18,
    );
    skirt.rotation.x = rad(180);
    skirt.castShadow = true;

    // Lower legs (stockinged calves) visible below the skirt.
    const legMat = new MeshStandardMaterial({
      color: 0xe8d8c0,
      roughness: 0.7,
      metalness: 0.0,
    });
    for (const sx of [-0.08, 0.08]) {
      const calf = part(
        new CapsuleGeometry(0.055, 0.32, 6, 12),
        legMat,
        root,
        sx,
        HIP_Y - 0.18,
        0.34,
      );
      calf.castShadow = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Head + hair
// ---------------------------------------------------------------------------

/** Build the head sphere + neck, plus the hairstyle sculpt. */
function buildHeadAndHair(
  hair: HairConfig,
  skinTone: number,
  root: Group,
): void {
  const skinMat = new MeshStandardMaterial({
    color: skinTone,
    roughness: 0.65,
    metalness: 0.0,
  });
  const hairMat = new MeshStandardMaterial({
    color: hair.color,
    roughness: 0.6,
    metalness: 0.0,
  });

  // Neck.
  part(new CylinderGeometry(0.045, 0.05, 0.09, 12), skinMat, root, 0, NECK_Y, 0);

  // Head.
  const head = part(
    new SphereGeometry(HEAD_RADIUS, 24, 18),
    skinMat,
    root,
    0,
    HEAD_CENTER_Y,
    0,
  );
  head.castShadow = true;

  switch (hair.style) {
    case 'victoryRolls': {
      // Two rolls on top of the head (small tori) plus a back mass.
      for (const sx of [-0.06, 0.06]) {
        const roll = part(
          new TorusGeometry(0.05, 0.03, 10, 16),
          hairMat,
          root,
          sx,
          HEAD_CENTER_Y + 0.1,
          -0.01,
        );
        roll.castShadow = true;
      }
      // Back hair mass.
      const back = part(
        new SphereGeometry(0.12, 18, 14),
        hairMat,
        root,
        0,
        HEAD_CENTER_Y - 0.02,
        -0.07,
      );
      back.castShadow = true;
      break;
    }
    case 'fingerWaves': {
      // Sculpted wave cap hugging the crown (flattened sphere).
      const waves = part(
        new SphereGeometry(0.115, 20, 16),
        hairMat,
        root,
        0,
        HEAD_CENTER_Y + 0.02,
        0,
      );
      waves.scale.set(1, 0.55, 1);
      waves.castShadow = true;
      // Side wave bumps.
      for (const sx of [-0.1, 0.1]) {
        const bump = part(
          new SphereGeometry(0.045, 14, 12),
          hairMat,
          root,
          sx,
          HEAD_CENTER_Y + 0.01,
          0.02,
        );
        bump.castShadow = true;
      }
      break;
    }
    case 'slickedBack': {
      // Close-fitting cap covering the upper-back of the head.
      const cap = part(
        new SphereGeometry(HEAD_RADIUS + 0.012, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
        hairMat,
        root,
        0,
        HEAD_CENTER_Y,
        0,
      );
      cap.castShadow = true;
      break;
    }
    case 'pompadour': {
      // Volume-forward roll above the forehead.
      const front = part(
        new SphereGeometry(0.07, 18, 14),
        hairMat,
        root,
        0,
        HEAD_CENTER_Y + 0.06,
        0.08,
      );
      front.scale.set(1.1, 0.9, 0.8);
      front.castShadow = true;
      const cap = part(
        new SphereGeometry(HEAD_RADIUS + 0.01, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
        hairMat,
        root,
        0,
        HEAD_CENTER_Y,
        0,
      );
      cap.castShadow = true;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Hat
// ---------------------------------------------------------------------------

/** Build the hat on top of the head, or nothing if `type === 'none'`. */
function buildHat(hat: HatConfig, root: Group): void {
  if (hat.type === 'none') return;
  const hatMat = new MeshStandardMaterial({
    color: hat.color,
    roughness: 0.55,
    metalness: 0.05,
  });
  const brimMat = new MeshStandardMaterial({
    color: hat.color,
    roughness: 0.6,
    metalness: 0.05,
  });
  const hatBaseY = HEAD_CENTER_Y + HEAD_RADIUS + 0.02;

  switch (hat.type) {
    case 'fedora': {
      // Crown: tapered cylinder with a slight pinch.
      const crown = part(
        new CylinderGeometry(0.085, 0.1, 0.12, 18),
        hatMat,
        root,
        0,
        hatBaseY + 0.06,
        0,
      );
      crown.castShadow = true;
      // Wide flat brim.
      const brim = part(
        new CylinderGeometry(0.16, 0.16, 0.012, 24),
        brimMat,
        root,
        0,
        hatBaseY,
        0,
      );
      brim.castShadow = true;
      // Hatband accent.
      const bandMat = new MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.1,
      });
      part(
        new CylinderGeometry(0.101, 0.101, 0.02, 18),
        bandMat,
        root,
        0,
        hatBaseY + 0.015,
        0,
      );
      break;
    }
    case 'wideBrim': {
      const crown = part(
        new CylinderGeometry(0.08, 0.09, 0.09, 18),
        hatMat,
        root,
        0,
        hatBaseY + 0.045,
        0,
      );
      crown.castShadow = true;
      const brim = part(
        new CylinderGeometry(0.2, 0.2, 0.01, 28),
        brimMat,
        root,
        0,
        hatBaseY,
        0,
      );
      brim.castShadow = true;
      break;
    }
    case 'cloche': {
      // Deep bell-shaped crown hugging the head.
      const crown = part(
        new SphereGeometry(0.12, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
        hatMat,
        root,
        0,
        hatBaseY - 0.02,
        0,
      );
      crown.castShadow = true;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Held gadget
// ---------------------------------------------------------------------------

/** Build the held gadget in the patron's hands at lap/table height. */
function buildGadget(gadget: GadgetConfig, root: Group): void {
  if (gadget.type === 'none') return;

  // Hands rest just above the lap, roughly at table-top height.
  const handsY = HIP_Y + 0.22;
  const handsZ = 0.22;

  switch (gadget.type) {
    case 'newspaper': {
      // A folded newspaper held open: a thin box (folded pages) standing in
      // the hands, textured with a paper material.
      const paperMat = new MeshStandardMaterial({
        color: gadget.color ?? 0xe8dcc0,
        roughness: 0.9,
        metalness: 0.0,
      });
      const news = part(
        new BoxGeometry(0.26, 0.3, 0.015),
        paperMat,
        root,
        0,
        handsY + 0.05,
        handsZ,
      );
      news.rotation.x = rad(-18);
      news.castShadow = true;
      // Dark ink headline strip.
      const inkMat = new MeshStandardMaterial({
        color: 0x202020,
        roughness: 0.85,
        metalness: 0.0,
      });
      part(
        new BoxGeometry(0.22, 0.025, 0.018),
        inkMat,
        root,
        0,
        handsY + 0.16,
        handsZ + 0.005,
      );
      break;
    }
    case 'pocketWatch': {
      const caseMat = new MeshStandardMaterial({
        color: gadget.color ?? 0xb5883a,
        roughness: 0.25,
        metalness: 0.9,
      });
      const watch = part(
        new CylinderGeometry(0.035, 0.035, 0.012, 18),
        caseMat,
        root,
        0.1,
        handsY,
        handsZ,
      );
      watch.rotation.x = rad(90);
      watch.castShadow = true;
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a seated Three.js figure from a {@link PatronConfig}. The returned
 * {@link Group} is positioned at the anchor floor point (x/z from the anchor,
 * y = 0) and rotated to `facing` degrees on Y. The figure is seated with hips
 * at seat height, knees bent forward, torso upright, head up, and the gadget
 * held in the hands at lap height.
 *
 * The config never rebuilds the silhouette — it only selects the outfit
 * family, swaps materials, and adds the hairstyle / hat / gadget accessories.
 */
export function buildAvatar(config: PatronConfig): Object3D {
  const group = new Group();
  group.name = `patron:${config.era}:${config.id}`;

  const skinTone = config.skinTone ?? DEFAULT_SKIN_TONE;

  buildOutfit(config.outfit, group);
  buildHeadAndHair(config.hair, skinTone, group);
  buildHat(config.hat, group);
  buildGadget(config.gadget, group);

  return group;
}

/**
 * Place a built avatar at its configured anchor + offset + facing. Returns the
 * same group, mutated in place. This is split from {@link buildAvatar} so the
 * roster can position the group after building it.
 */
export function placeAvatar(
  group: Object3D,
  anchorWorld: readonly [number, number, number],
  offset: readonly [number, number, number],
  facing: number,
): Object3D {
  group.position.set(
    anchorWorld[0] + offset[0],
    anchorWorld[1] + offset[1],
    anchorWorld[2] + offset[2],
  );
  group.rotation.y = rad(facing);
  return group;
}

/**
 * Convenience: build AND position an avatar from a full config + resolved
 * anchor world position. The anchor's Y is expected to be the floor reference
 * (0 for seating tables); the avatar internally stacks parts from the floor.
 */
export function buildSeatedPatron(
  config: PatronConfig,
  anchorWorld: readonly [number, number, number],
): Object3D {
  const group = buildAvatar(config);
  const offset = config.seatOffset ?? DEFAULT_SEAT_OFFSET;
  const facing = config.facing ?? 0;
  return placeAvatar(group, anchorWorld, offset, facing);
}

/** Re-export for consumers that type against the builder. */
export type { Material };
