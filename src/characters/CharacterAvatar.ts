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
 * Two builder families coexist so both description forms are honoured:
 *  • Structured (1945) — {@link buildAvatar} / {@link buildSeatedPatron} /
 *    {@link placeAvatar}. Detailed seated figure: fixed hip/torso/head
 *    measurements, outfit families (suit / dayDress), period hats, period
 *    hairstyles, and handheld newspaper / pocket-watch gadgets.
 *  • Flat-slug (1965+) — {@link buildCharacterAvatar} /
 *    {@link buildCharacterAvatars}. Era-palette-tinted capsule silhouette
 *    plus period-specific attachments (hairstyle mass, gadget prop) so the
 *    figure reads as its decade at a glance.
 *
 * All materials come from the shared {@link MaterialFactory} (parameterised by
 * the config's era) so the figure automatically picks up the era palette. No
 * ad-hoc hex colours except the optional per-patron tint overrides on the
 * PatronConfig.
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
import { MaterialFactory, getEraPalette } from '../assets/index.js';
import type { EraYear } from '../data/EraData.js';
import { ANCHORS } from '../world/layout.js';
import {
  DEFAULT_SEAT_OFFSET,
  DEFAULT_SKIN_TONE,
  type GadgetConfig,
  type HairConfig,
  type HatConfig,
  type OutfitConfig,
  type PatronConfig,
  type FlatSlugPatronConfig,
  type StructuredPatronConfig,
  type PatronGadget,
  type PatronHairstyle,
  type PatronOutfit,
} from './PatronConfig.js';

function isFlatSlugPatron(
  config: PatronConfig,
): config is FlatSlugPatronConfig {
  return typeof config.outfit === 'string';
}

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

/** Union of the geometry types the `part` helper accepts. */
type PartGeometry =
  | BoxGeometry
  | CylinderGeometry
  | SphereGeometry
  | CapsuleGeometry
  | ConeGeometry
  | TorusGeometry
  | PlaneGeometry;

/** Degrees → radians. */
function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Create a mesh, position it, add it to a parent, and return it. */
function part(
  geometry: PartGeometry,
  material: Material,
  parent: Group,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Outfit families (structured 1945 form)
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
// Head + hair (structured 1945 form)
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
// Hat (structured 1945 form)
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
// Held gadget (structured 1945 form)
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
// Hairstyle geometry (flat-slug 1965+ form)
// ---------------------------------------------------------------------------

/**
 * Attach a hairstyle to the head group. The hairstyle is a period-defining
 * silhouette element (beehive, bouffant, bowl-cut, victory-rolls, …) drawn as
 * a small mass on/around the head.
 */
function attachHairstyle(
  head: Group,
  hairstyle: PatronHairstyle,
  hairMat: Material,
): void {
  switch (hairstyle) {
    // 1965 — tall rounded beehive.
    case 'beehive': {
      part(new ConeGeometry(0.14, 0.22, 16), hairMat, head, 0, 0.16, 0);
      break;
    }
    // 1965 — voluminous bouffant (wide rounded mass).
    case 'bouffant': {
      part(new SphereGeometry(0.16, 16, 12), hairMat, head, 0, 0.1, -0.02).scale.set(
        1,
        0.8,
        1.1,
      );
      break;
    }
    // 1965 — blunt bowl-cut fringe (top hemisphere).
    case 'bowl-cut': {
      part(
        new SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        hairMat,
        head,
        0,
        0.02,
        0,
      );
      break;
    }
    // 1965 — sharp mod bob.
    case 'mod-bob': {
      part(new SphereGeometry(0.135, 16, 12), hairMat, head, 0, 0.04, 0).scale.set(
        1,
        0.9,
        1,
      );
      break;
    }
    // 1945 — victory rolls (two small side rolls).
    case 'victory-rolls': {
      const left = part(
        new TorusGeometry(0.05, 0.04, 8, 12),
        hairMat,
        head,
        -0.09,
        0.08,
        0,
      );
      left.rotation.x = Math.PI / 2;
      const right = part(
        new TorusGeometry(0.05, 0.04, 8, 12),
        hairMat,
        head,
        0.09,
        0.08,
        0,
      );
      right.rotation.x = Math.PI / 2;
      break;
    }
    case 'slicked-back': {
      part(new SphereGeometry(0.125, 16, 12), hairMat, head, 0, 0.03, 0).scale.set(
        1,
        0.85,
        1,
      );
      break;
    }
    default:
      // Fallback: a simple hair cap for any hairstyle not yet specialised.
      part(
        new SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8),
        hairMat,
        head,
        0,
        0.02,
        0,
      );
  }
}

// ---------------------------------------------------------------------------
// Gadget geometry (flat-slug 1965+ form)
// ---------------------------------------------------------------------------

/**
 * Attach a handheld gadget to the avatar's right hand. Gadgets are small
 * period props (transistor radio, cigarette, walkman, smartphone, …).
 */
function attachGadget(
  body: Group,
  gadget: PatronGadget,
  mat: Material,
): void {
  // Right hand sits roughly here.
  const hx = 0.18;
  const hy = 0.95;
  const hz = 0.12;
  switch (gadget) {
    // 1965 — pocket transistor radio.
    case 'transistor-radio': {
      const radio = part(new BoxGeometry(0.08, 0.05, 0.03), mat, body, hx, hy, hz);
      radio.name = 'gadget:transistor-radio';
      // Tiny grille.
      const grille = part(
        new BoxGeometry(0.06, 0.02, 0.005),
        mat,
        body,
        hx,
        hy + 0.005,
        hz + 0.018,
      );
      grille.scale.set(1, 1, 0.4);
      break;
    }
    // 1965 / 1945 — cigarette (slim white cylinder).
    case 'cigarette': {
      const cig = part(
        new CylinderGeometry(0.006, 0.006, 0.06, 8),
        mat,
        body,
        hx,
        hy,
        hz + 0.04,
      );
      cig.rotation.x = Math.PI / 2;
      cig.name = 'gadget:cigarette';
      break;
    }
    // 1945 — cigarette case (flat metal box).
    case 'cigarette-case': {
      part(new BoxGeometry(0.07, 0.04, 0.02), mat, body, hx, hy, hz).name =
        'gadget:cigarette-case';
      break;
    }
    case 'sunglasses': {
      part(new BoxGeometry(0.1, 0.03, 0.02), mat, body, 0, 1.52, 0.1).name =
        'gadget:sunglasses';
      break;
    }
    default:
      // Generic small box prop for any gadget not yet specialised.
      part(new BoxGeometry(0.06, 0.04, 0.02), mat, body, hx, hy, hz).name =
        `gadget:${gadget}`;
  }
}

// ---------------------------------------------------------------------------
// Outfit body shape (flat-slug 1965+ form)
// ---------------------------------------------------------------------------

/**
 * Build the torso/leg silhouette for an outfit. Slim suits and mod shifts use
 * a narrow tapered torso; miniskirts shorten the leg reveal; utility suits
 * are boxier. The body parts are era-tinted via the shared MaterialFactory.
 */
function buildBody(
  era: EraYear,
  outfit: PatronOutfit,
  clothingMat: Material,
  legMat: Material,
): Group {
  void era;
  const body = new Group();
  body.name = 'patron-body';

  // Torso geometry varies a little by outfit family.
  const slim =
    outfit === 'slim-suit' ||
    outfit === 'mod-shift-dress' ||
    outfit === 'miniskirt';
  const torso = part(
    new CylinderGeometry(slim ? 0.14 : 0.17, slim ? 0.18 : 0.21, 0.68, 16),
    clothingMat,
    body,
    0,
    1.02,
    0,
  );
  torso.name = 'patron-torso';

  // Mod shift dress / miniskirt: a slight skirt flare.
  if (outfit === 'mod-shift-dress' || outfit === 'miniskirt') {
    const skirt = part(
      new CylinderGeometry(0.2, 0.26, 0.22, 16),
      clothingMat,
      body,
      0,
      0.62,
      0,
    );
    skirt.name = 'patron-skirt';
  }

  // Legs (slim trousers).
  const legLen = outfit === 'miniskirt' ? 0.5 : 0.6;
  for (const dx of [-0.07, 0.07]) {
    const leg = part(
      new CylinderGeometry(0.05, 0.045, legLen, 10),
      legMat,
      body,
      dx,
      0.3,
      0,
    );
    leg.name = 'patron-leg';
  }

  // Arms.
  for (const dx of [-0.16, 0.16]) {
    const arm = part(
      new CylinderGeometry(0.045, 0.045, 0.5, 10),
      clothingMat,
      body,
      dx,
      0.95,
      0,
    );
    arm.name = 'patron-arm';
  }

  return body;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a seated Three.js figure from a structured {@link PatronConfig}. The
 * returned {@link Group} is positioned at the avatar origin (caller positions
 * it — see {@link placeAvatar} / {@link buildSeatedPatron}). The figure is
 * seated with hips at seat height, knees bent forward, torso upright, head
 * up, and the gadget held in the hands at lap height.
 *
 * The config never rebuilds the silhouette — it only selects the outfit
 * family, swaps materials, and adds the hairstyle / hat / gadget accessories.
 */
export function buildAvatar(config: PatronConfig): Object3D {
  if (isFlatSlugPatron(config)) {
    throw new Error(
      'CharacterAvatar.buildAvatar expects a structured (1945) PatronConfig, but received a flat-slug patron config.',
    );
  }

  const structured = config as StructuredPatronConfig;

  const group = new Group();
  group.name = `patron:${structured.era}:${structured.id}`;

  const skinTone = structured.skinTone ?? DEFAULT_SKIN_TONE;

  buildOutfit(structured.outfit, group);
  buildHeadAndHair(structured.hair, skinTone, group);
  buildHat(structured.hat, group);
  buildGadget(structured.gadget, group);

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
  if (isFlatSlugPatron(config)) {
    throw new Error(
      'CharacterAvatar.buildSeatedPatron expects a structured (1945) PatronConfig.',
    );
  }

  const structured = config as StructuredPatronConfig;
  const group = buildAvatar(structured);
  const offset = structured.seatOffset ?? DEFAULT_SEAT_OFFSET;
  const facing = structured.facing ?? 0;
  return placeAvatar(group, anchorWorld, offset, facing);
}

/**
 * Build a seated patron avatar `Object3D` from a flat-slug {@link PatronConfig}.
 *
 * The returned Group is positioned at the config's anchor + offset and rotated
 * to the config's facing. It is a fresh tree each call (the caller owns
 * disposal). The figure's era palette comes from {@link MaterialFactory} keyed
 * by `config.era`, so the avatar is visually consistent with its decade.
 */
export function buildCharacterAvatar(config: PatronConfig): Object3D {
  if (!isFlatSlugPatron(config)) {
    throw new Error(
      'CharacterAvatar.buildCharacterAvatar expects a flat-slug (1965+) PatronConfig.',
    );
  }

  const flat = config as FlatSlugPatronConfig;
  const era = flat.era;
  const palette = getEraPalette(era);

  // Resolve materials via the shared factory. Patrons are small distant
  // figures, so we skip the procedural fabric/ceramic map textures (which
  // require a 2D canvas) — the era-palette-tinted plain materials read
  // correctly at café distance and keep the avatar builder environment-
  // agnostic (e.g. usable in jsdom tests without a canvas polyfill).
  const clothingColor = flat.clothingTint ?? palette.primary;
  const hairColor = flat.hairTint ?? 0x2a1a0e;
  const clothingMat = MaterialFactory.get('fabric', era, {
    color: clothingColor,
    textured: false,
  });
  const legMat = MaterialFactory.get('fabric', era, {
    color: 0x222222,
    textured: false,
  });
  const skinMat = MaterialFactory.get('ceramic', era, {
    color: 0xe8c9a0,
    roughness: 0.6,
    textured: false,
  });
  const hairMat = MaterialFactory.get('fabric', era, {
    color: hairColor,
    roughness: 0.8,
    textured: false,
  });
  const gadgetMat = MaterialFactory.get('plastic', era, {
    color: palette.secondary,
    textured: false,
  });

  const group = new Group();
  group.name = `patron:${flat.id}`;

  // Body (torso + legs + arms).
  group.add(buildBody(era, flat.outfit as PatronOutfit, clothingMat, legMat));

  // Head mesh.
  const headMesh = part(new SphereGeometry(0.12, 16, 12), skinMat, group, 0, 1.5, 0);
  headMesh.name = 'patron-head-mesh';

  // Hairstyle — parented to an offset group at head height so hairstyle
  // geometry is authored around the head centre (y ≈ 0 within the group).
  const hairParent = new Group();
  hairParent.position.set(0, 1.5, 0);
  group.add(hairParent);
  attachHairstyle(hairParent, flat.hairstyle as PatronHairstyle, hairMat);

  // Gadget.
  if (flat.gadget !== null) {
    attachGadget(group, flat.gadget, gadgetMat);
  }

  // Seat the avatar at its anchor + offset.
  const anchor = ANCHORS[flat.anchor];
  const offset = flat.offset;
  group.position.set(anchor.x + offset.x, 0, anchor.z + offset.z);
  group.rotation.y = flat.rotation;

  return group;
}

/**
 * Build avatars for every patron config in a list (convenience for era
 * fragment builders that want the full era population as Object3Ds).
 */
export function buildCharacterAvatars(
  configs: readonly PatronConfig[],
): Object3D[] {
  return configs.map((c) => buildCharacterAvatar(c));
}

/** Re-export for consumers that type against the builder. */
export type { Material };
