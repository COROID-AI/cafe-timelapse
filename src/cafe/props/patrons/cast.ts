/**
 * Assembles one complete era cast: figures on their seats plus every gadget
 * in its mount position, all under a single group the crossfade can treat as
 * one unit. Every patron's belongings (figure, stool, personal gadgets) live
 * inside a per-patron slot so payload-driven headcount changes can hide a
 * whole seat — props included — with one visibility flip.
 */

import * as THREE from 'three';
import { PATRON_CASTS } from './variants';
import { buildPatronFigure } from './figures';
import type { FigureBuild } from './figures';
import { buildGadget, buildCounterStool } from './gadgets';
import {
  BOOMBOX_STOOL_SPOT,
  resolveSeatPlacement,
  resolveTableGadgetSpot,
} from './layout';
import type { SeatPlacement } from './layout';
import type { PatronEraYear, PatronFigureSpec } from './types';

export interface PatronSlot {
  /** Everything belonging to one patron (figure + stool + own gadgets). */
  root: THREE.Group;
  figure: FigureBuild;
  spec: PatronFigureSpec;
}

export interface CastBuild {
  root: THREE.Group;
  /** Every material in the cast, aggregated across per-figure kits. */
  materials: readonly THREE.MeshStandardMaterial[];
  slots: PatronSlot[];
  year: PatronEraYear;
}

/** Builds the full object graph for one era's cast. */
export function buildPatronCast(year: PatronEraYear): CastBuild {
  const specs = PATRON_CASTS[year];
  const root = new THREE.Group();
  root.name = `patrons-era-${year}`;
  root.userData = { eraYear: year };
  root.visible = false;

  const materials: THREE.MeshStandardMaterial[] = [];
  const slots: PatronSlot[] = [];

  specs.forEach((spec, index) => {
    const slot = new THREE.Group();
    slot.name = `patron-slot-${index}`;

    const place = resolveSeatPlacement(year, spec.seat);
    const figure = buildPatronFigure(spec, year, index, place.seatY);
    materials.push(...figure.kit.materials);

    figure.root.position.set(place.x, 0, place.z);
    figure.root.rotation.y = place.yaw;
    slot.add(figure.root);

    attachGadget(slot, figure, spec, place);

    if (spec.seat.kind === 'counterStool') {
      const stool = buildCounterStool(figure.kit);
      stool.position.set(place.x, 0, place.z);
      slot.add(stool);
    }

    root.add(slot);
    slots.push({ root: slot, figure, spec });
  });

  return { root, materials, slots, year };
}

/* ----- gadget mounting ------------------------------------------------------ */

function attachGadget(
  slot: THREE.Group,
  figure: FigureBuild,
  spec: PatronFigureSpec,
  place: SeatPlacement,
): void {
  if (!spec.gadget || !spec.gadgetMount) return;
  const built = buildGadget(spec.gadget, figure.kit);

  switch (spec.gadgetMount) {
    case 'rightHand':
    case 'screen': {
      figure.handItemAnchor.add(built.root);
      break;
    }
    case 'bothHands': {
      figure.holdFrontAnchor.add(built.root);
      break;
    }
    case 'table': {
      const spot = resolveTableGadgetSpot(place);
      const wrapper = new THREE.Group();
      wrapper.name = `gadget-spot-${spec.gadget}`;
      wrapper.position.set(spot.x, 0.745, spot.z);
      wrapper.rotation.y = spot.yaw;
      wrapper.add(built.root);
      slot.add(wrapper);
      break;
    }
    case 'worn': {
      figure.torsoPivot.add(built.root);
      if (built.headRoot) figure.headPivot.add(built.headRoot);
      break;
    }
    case 'stool': {
      // Boombox rests on its own stool beside the counter perch, speakers
      // fired out into the room (same −z yaw as the seated listener).
      const stool = buildCounterStool(figure.kit);
      stool.position.set(BOOMBOX_STOOL_SPOT.x, 0, BOOMBOX_STOOL_SPOT.z);
      stool.rotation.y = Math.PI;
      built.root.position.y = 0.6825; // stool vinyl pad top
      stool.add(built.root);
      slot.add(stool);
      break;
    }
  }
}
