/**
 * CharacterAvatar.ts — builds a Three.js `Object3D` figure from a
 * {@link PatronConfig}.
 *
 * This is the render side of the character system: it reads a plain-data
 * PatronConfig and emits a self-contained, era-palette-tinted Group that the
 * era fragment builder can drop into the scene. The avatar is a stylised
 * capsule silhouette — torso, head, legs, arms — plus period-specific
 * attachments (hairstyle mass, gadget prop) so the figure reads as its
 * decade at a glance.
 *
 * All materials come from the shared {@link MaterialFactory} (parameterised by
 * the config's era) so the figure automatically picks up the era palette. No
 * ad-hoc hex colours except the optional per-patron tint overrides on the
 * PatronConfig.
 */
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  type Material,
  type Object3D,
} from 'three';
import { MaterialFactory, getEraPalette } from '../assets/index.js';
import type { EraYear } from '../data/EraData.js';
import { ANCHORS } from '../world/layout.js';
import type {
  PatronConfig,
  PatronGadget,
  PatronHairstyle,
  PatronOutfit,
} from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Union of the geometry types the `part` helper accepts. */
type PartGeometry =
  | BoxGeometry
  | CylinderGeometry
  | SphereGeometry
  | ConeGeometry
  | TorusGeometry;

/** Create a mesh, position it, add it to a parent, and return it. */
function part(
  geo: PartGeometry,
  mat: Material,
  parent: Group,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Hairstyle geometry
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
// Gadget geometry
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
// Outfit body shape
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
 * Build a seated patron avatar `Object3D` from a {@link PatronConfig}.
 *
 * The returned Group is positioned at the config's anchor + offset and rotated
 * to the config's facing. It is a fresh tree each call (the caller owns
 * disposal). The figure's era palette comes from {@link MaterialFactory} keyed
 * by `config.era`, so the avatar is visually consistent with its decade.
 */
export function buildCharacterAvatar(config: PatronConfig): Object3D {
  const era = config.era;
  const palette = getEraPalette(era);

  // Resolve materials via the shared factory. Patrons are small distant
  // figures, so we skip the procedural fabric/ceramic map textures (which
  // require a 2D canvas) — the era-palette-tinted plain materials read
  // correctly at café distance and keep the avatar builder environment-
  // agnostic (e.g. usable in jsdom tests without a canvas polyfill).
  const clothingColor = config.clothingTint ?? palette.primary;
  const hairColor = config.hairTint ?? 0x2a1a0e;
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
  group.name = `patron:${config.id}`;

  // Body (torso + legs + arms).
  group.add(buildBody(era, config.outfit, clothingMat, legMat));

  // Head mesh.
  const headMesh = part(new SphereGeometry(0.12, 16, 12), skinMat, group, 0, 1.5, 0);
  headMesh.name = 'patron-head-mesh';

  // Hairstyle — parented to an offset group at head height so hairstyle
  // geometry is authored around the head centre (y ≈ 0 within the group).
  const hairParent = new Group();
  hairParent.position.set(0, 1.5, 0);
  group.add(hairParent);
  attachHairstyle(hairParent, config.hairstyle, hairMat);

  // Gadget.
  if (config.gadget !== null) {
    attachGadget(group, config.gadget, gadgetMat);
  }

  // Seat the avatar at its anchor + offset.
  const anchor = ANCHORS[config.anchor];
  group.position.set(anchor.x + config.offset.x, 0, anchor.z + config.offset.z);
  group.rotation.y = config.rotation;

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
