/**
 * CharacterAvatar.ts — procedural avatar builder for café patrons.
 *
 * Turns a {@link PatronConfig} (pure data) into a Three.js `Object3D`: a
 * stylized low-poly seated/standing figure composed entirely of Three.js
 * primitives + the shared {@link MaterialFactory}. NO external model files are
 * loaded — this honours the project's procedural-only constraint and keeps the
 * avatar consistent with the rest of the era asset library.
 *
 * The avatar is a fixed-silhouette "paper-doll" figure: a head, torso, arms,
 * and hips. Outfit/hair/gadget config drives the *appearance* of those parts
 * (colour, material role, extra mesh attachments) rather than re-posing a
 * skeleton — period patrons read clearly at café-room scale without a rig.
 *
 * Seating: the builder reads the config's {@link AnchorKey}, resolves it via
 * {@link getAnchor} to a world position, and seats the figure there. The
 * anchor's Y is the floor; the figure stands on it (patrons are modelled
 * standing-at-table rather than chair-seated, matching the café's standing
 * sightlines).
 */
import {
  BoxGeometry,
  CapsuleGeometry,
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
import { ANCHORS, getAnchor } from '../world/layout.js';
import type {
  Gadget,
  Hairstyle,
  OutfitType,
  PatronConfig,
} from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Geometry constants (metres)
// ---------------------------------------------------------------------------

/** Default skin tone (neutral). */
const DEFAULT_SKIN = 0xd4a373;

// ---------------------------------------------------------------------------
// Small helpers (mirror PropPrimitives' internal `part` helper)
// ---------------------------------------------------------------------------

/** Create a mesh, position it, add it to a parent, and return it. */
function part(
  geo:
    | BoxGeometry
    | CylinderGeometry
    | SphereGeometry
    | CapsuleGeometry
    | ConeGeometry
    | TorusGeometry,
  mat: Material,
  parent: Group,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** Convert degrees to radians. */
function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// Torso / outfit builders
// ---------------------------------------------------------------------------

/**
 * Build the torso garment for an outfit type. Returns a Group positioned so
 * its origin is at the figure's hips (y=0 of the figure root), with the torso
 * rising upward.
 */
function buildTorso(
  outfit: OutfitType,
  color: number,
  year: EraYear,
): { group: Group; shoulderWidth: number } {
  const group = new Group();
  group.name = `torso:${outfit}`;

  const mat = MaterialFactory.get('fabric', year, { color });

  // Base torso block (shared): shoulders → waist.
  const torsoW = 0.34;
  const torsoH = 0.62;
  const torsoD = 0.18;

  switch (outfit) {
    case 'shoulder-pad-blazer': {
      // Power-shoulder: widen the top with an epaulette slab.
      part(
        new BoxGeometry(torsoW, torsoH, torsoD),
        mat,
        group,
        0,
        torsoH / 2,
        0,
      );
      const padW = torsoW + 0.14;
      const pad = part(
        new BoxGeometry(padW, 0.1, torsoD + 0.02),
        mat,
        group,
        0,
        torsoH - 0.05,
        0,
      );
      pad.castShadow = true;
      return { group, shoulderWidth: padW };
    }
    case 'members-only-jacket': {
      part(
        new BoxGeometry(torsoW, torsoH, torsoD),
        mat,
        group,
        0,
        torsoH / 2,
        0,
      );
      // Quilted satin collar + slightly flared hem.
      const collarMat = MaterialFactory.get('fabric', year, {
        color: 0xe8e0d0,
      });
      const collar = part(
        new BoxGeometry(torsoW + 0.04, 0.08, 0.04),
        collarMat,
        group,
        0,
        torsoH - 0.02,
        torsoD / 2,
      );
      collar.castShadow = true;
      const hem = part(
        new BoxGeometry(torsoW + 0.06, 0.08, torsoD + 0.02),
        mat,
        group,
        0,
        0.04,
        0,
      );
      hem.castShadow = true;
      return { group, shoulderWidth: torsoW + 0.06 };
    }
    case 'denim-jacket': {
      part(
        new BoxGeometry(torsoW, torsoH, torsoD),
        MaterialFactory.get('fabric', year, { color }),
        group,
        0,
        torsoH / 2,
        0,
      );
      // Chest pockets.
      const pocketMat = MaterialFactory.get('fabric', year, {
        color,
        roughness: 1.0,
      });
      part(new BoxGeometry(0.07, 0.07, 0.01), pocketMat, group, -0.08, torsoH - 0.12, torsoD / 2);
      part(new BoxGeometry(0.07, 0.07, 0.01), pocketMat, group, 0.08, torsoH - 0.12, torsoD / 2);
      return { group, shoulderWidth: torsoW };
    }
    case 'sweater':
    case 'shirt': {
      part(
        new BoxGeometry(torsoW, torsoH, torsoD),
        mat,
        group,
        0,
        torsoH / 2,
        0,
      );
      return { group, shoulderWidth: torsoW };
    }
    case 'dress': {
      // Torso + A-line skirt.
      part(
        new BoxGeometry(torsoW, torsoH * 0.5, torsoD),
        mat,
        group,
        0,
        torsoH * 0.7,
        0,
      );
      const skirt = part(
        new ConeGeometry(torsoW * 0.9, torsoH * 0.55, 12, 1, true),
        mat,
        group,
        0,
        torsoH * 0.275,
        0,
      );
      skirt.castShadow = true;
      return { group, shoulderWidth: torsoW };
    }
    default: {
      part(
        new BoxGeometry(torsoW, torsoH, torsoD),
        mat,
        group,
        0,
        torsoH / 2,
        0,
      );
      return { group, shoulderWidth: torsoW };
    }
  }
}

// ---------------------------------------------------------------------------
// Head + hair builders
// ---------------------------------------------------------------------------

/**
 * Build the head + hair for a hairstyle. Returns a Group whose origin is at
 * the neck-top (sits at the top of the torso). The head sphere is centred at
 * y = headRadius inside this group.
 */
function buildHead(
  hair: { style: Hairstyle; color: number },
  skinColor: number,
  year: EraYear,
): Group {
  const group = new Group();
  group.name = `head:${hair.style}`;

  const headR = 0.09;
  const skinMat = MaterialFactory.get('plastic', year, {
    color: skinColor,
    roughness: 0.7,
  });
  part(new SphereGeometry(headR, 12, 12), skinMat, group, 0, headR, 0);

  const hairMat = MaterialFactory.get('fabric', year, {
    color: hair.color,
    roughness: 0.95,
  });

  switch (hair.style) {
    case 'big-hair': {
      // Voluminous teased hair: an inflated sphere shell over the head.
      const big = part(
        new SphereGeometry(headR * 1.55, 16, 16),
        hairMat,
        group,
        0,
        headR + 0.02,
        -0.01,
      );
      big.castShadow = true;
      // A small fringe bang.
      part(
        new SphereGeometry(headR * 0.6, 10, 10),
        hairMat,
        group,
        0,
        headR + 0.06,
        headR * 0.5,
      );
      return group;
    }
    case 'mullet': {
      // Short top cap + long back panel.
      part(
        new SphereGeometry(headR * 1.15, 14, 14),
        hairMat,
        group,
        0,
        headR + 0.02,
        -0.01,
      );
      const back = part(
        new BoxGeometry(0.12, 0.22, 0.04),
        hairMat,
        group,
        0,
        headR * 0.4,
        -headR * 0.95,
      );
      back.castShadow = true;
      return group;
    }
    case 'perm': {
      // Curly perm: a rough sphere with high-segment bumps.
      part(
        new SphereGeometry(headR * 1.3, 6, 6),
        hairMat,
        group,
        0,
        headR + 0.01,
        -0.01,
      );
      return group;
    }
    case 'buzz': {
      part(
        new SphereGeometry(headR * 1.05, 12, 12),
        hairMat,
        group,
        0,
        headR + 0.005,
        -0.01,
      );
      return group;
    }
    case 'bob': {
      part(
        new SphereGeometry(headR * 1.2, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
        hairMat,
        group,
        0,
        headR + 0.01,
        -0.01,
      );
      return group;
    }
    case 'ponytail': {
      part(
        new SphereGeometry(headR * 1.1, 12, 12),
        hairMat,
        group,
        0,
        headR + 0.01,
        -0.01,
      );
      part(
        new CapsuleGeometry(0.03, 0.18, 8, 8),
        hairMat,
        group,
        0,
        headR,
        -headR * 1.1,
      ).rotateX(rad(110));
      return group;
    }
    case 'slicked': {
      part(
        new SphereGeometry(headR * 1.08, 12, 12),
        MaterialFactory.get('plastic', year, {
          color: hair.color,
          roughness: 0.3,
        }),
        group,
        0,
        headR + 0.005,
        -0.01,
      );
      return group;
    }
    case 'bald':
    default:
      return group;
  }
}

// ---------------------------------------------------------------------------
// Gadget builders
// ---------------------------------------------------------------------------

/**
 * Attach a gadget mesh to the avatar group. Gadgets are small clip-ons
 * positioned relative to the avatar root (origin at floor between feet).
 */
function attachGadget(
  gadget: Gadget,
  year: EraYear,
  parent: Group,
): void {
  switch (gadget) {
    case 'walkman-headphones': {
      // Over-head band (torus arc) + two earcups (cylinders) at temple height.
      const bandMat = MaterialFactory.get('plastic', year, {
        color: 0x1a1a1a,
        roughness: 0.4,
      });
      const band = part(
        new TorusGeometry(0.11, 0.012, 8, 16, Math.PI),
        bandMat,
        parent,
        0,
        1.5,
        0,
      );
      band.rotation.x = rad(90);
      band.castShadow = true;
      const earMat = MaterialFactory.get('plastic', year, {
        color: 0x2a2a2a,
      });
      const left = part(
        new CylinderGeometry(0.045, 0.045, 0.03, 12),
        earMat,
        parent,
        -0.11,
        1.5,
        0,
      );
      left.rotation.z = rad(90);
      const right = part(
        new CylinderGeometry(0.045, 0.045, 0.03, 12),
        earMat,
        parent,
        0.11,
        1.5,
        0,
      );
      right.rotation.z = rad(90);
      break;
    }
    case 'walkman-clip': {
      // Cassette body clipped at the hip.
      const mat = MaterialFactory.get('plastic', year, {
        color: 0x3a3a5a,
        roughness: 0.4,
      });
      const body = part(
        new BoxGeometry(0.11, 0.08, 0.03),
        mat,
        parent,
        0.16,
        0.85,
        0.05,
      );
      body.castShadow = true;
      break;
    }
    case 'pager': {
      const mat = MaterialFactory.get('plastic', year, {
        color: 0x222222,
      });
      part(new BoxGeometry(0.05, 0.08, 0.02), mat, parent, 0.15, 0.9, 0.04);
      break;
    }
    case 'pocket-watch': {
      const mat = MaterialFactory.get('brass', year);
      part(new CylinderGeometry(0.03, 0.03, 0.01, 12), mat, parent, 0.12, 1.0, 0.05).rotateX(rad(90));
      break;
    }
    case 'transistor-radio': {
      const mat = MaterialFactory.get('plastic', year, {
        color: 0x6a3a3a,
      });
      part(new BoxGeometry(0.08, 0.12, 0.03), mat, parent, 0.14, 0.95, 0.04);
      break;
    }
    case 'none':
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build a complete patron avatar from a {@link PatronConfig}.
 *
 * The returned `Object3D` is a `Group` named `patron:<id>`. It is positioned
 * at the config's anchor (world space) and rotated by `facing` degrees. The
 * figure stands roughly 1.6 m tall (head-top at ≈1.6).
 *
 * @param config The patron configuration.
 * @returns A fresh, positioned `Object3D` avatar (the caller owns disposal).
 */
export function buildCharacterAvatar(config: PatronConfig): Object3D {
  const palette = getEraPalette(config.era);
  const skinColor = config.skinColor ?? DEFAULT_SKIN;

  const root = new Group();
  root.name = `patron:${config.id}`;
  root.userData = { patronId: config.id, era: config.era };

  // --- Legs / hips (shared, not outfit-driven) -----------------------------
  const legMat = MaterialFactory.get('fabric', palette.year, {
    color: 0x2a2a3a,
  });
  const legGeo = new CapsuleGeometry(0.05, 0.66, 8, 8);
  const legL = part(legGeo, legMat, root, -0.07, 0.38, 0);
  legL.castShadow = true;
  const legR = part(legGeo.clone(), legMat, root, 0.07, 0.38, 0);
  legR.castShadow = true;

  // --- Torso + outfit ------------------------------------------------------
  const { group: torso, shoulderWidth } = buildTorso(
    config.outfit.type,
    config.outfit.color,
    config.era,
  );
  torso.position.set(0, 0.72, 0);
  root.add(torso);

  // --- Arms (shoulder-pads affect arm position) ----------------------------
  const armMat = MaterialFactory.get('fabric', config.era, {
    color: config.outfit.color,
  });
  const armGeo = new CapsuleGeometry(0.04, 0.5, 8, 8);
  const armOffsetX = shoulderWidth / 2 - 0.02;
  const armL = part(armGeo, armMat, root, -armOffsetX, 1.0, 0);
  armL.castShadow = true;
  const armR = part(armGeo.clone(), armMat, root, armOffsetX, 1.0, 0);
  armR.castShadow = true;

  // --- Head + hair ---------------------------------------------------------
  const head = buildHead(config.hair, skinColor, config.era);
  head.position.set(0, 0.72 + 0.62, 0); // atop the torso
  root.add(head);

  // --- Gadgets -------------------------------------------------------------
  for (const gadget of config.gadgets) {
    attachGadget(gadget, config.era, root);
  }

  // --- Seat at the anchor (world position + facing) ------------------------
  const anchor = getAnchor(config.anchor);
  root.position.copy(anchor);
  // Stand on the floor at the anchor's XZ; the anchor Y may be a table-top,
  // so we clamp the figure's feet to the floor (y = 0) unless the anchor is
  // a standing-height point (counter). Seating-table anchors have y = 0.
  root.position.y = 0;
  root.rotation.y = rad(config.facing ?? 0);

  return root;
}

/**
 * Convenience: the set of all stable layout anchor keys that are valid seating
 * targets for patrons (the three customer tables + entrance stand spot).
 */
export const PATRON_SEATING_ANCHORS = [
  'seatingTableA',
  'seatingTableB',
  'seatingTableC',
] as const;

/** Re-export the anchors map for avatar consumers that need to place groups. */
export { ANCHORS };
