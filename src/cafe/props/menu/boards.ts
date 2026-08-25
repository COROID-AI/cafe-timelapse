/**
 * Mesh composers for the five menu-board era variants.
 *
 * Each composer returns a complete, self-contained group positioned at the
 * shared mount point from `layout.ts`: hanging board above/behind the counter
 * run, plus era-specific extras (2005 A-frame on the floor, 2025 QR ordering
 * cards on the dining tables). All materials are FRESH instances per variant
 * created `transparent: true` up front, so crossfades never recompile shaders
 * and never leak opacity between eras.
 */

import * as THREE from 'three';
import { AFRAME_PLACEMENT, MENU_MOUNT, QR_TABLE_INDICES, TABLE_TOP_Y } from './layout';
import { getMenuPreset, type MenuEraPreset } from './presets';
import { TABLE_ANCHORS } from '../furniture/specs';
import type { RenderedMenuRow } from './types';
import {
  paintAframeSpecials,
  paintChalkSlate,
  paintDinerBoard,
  paintLcdScreen,
  paintLcdSpecialsTicker,
  paintPlasticLetterPanel,
  paintPrintedWallMenu,
  paintQrOrderingCard,
} from './textures';

export interface EraVariantExtras {
  /** LCD ticker texture — animated by the builder when present. */
  specialsTicker?: THREE.CanvasTexture;
}

interface BuildKit {
  std: (opts: {
    color: THREE.ColorRepresentation;
    roughness?: number;
    metalness?: number;
    map?: THREE.Texture;
    emissiveMap?: THREE.Texture;
    emissive?: THREE.ColorRepresentation;
    emissiveIntensity?: number;
  }) => THREE.MeshStandardMaterial;
  box: (
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    name?: string,
  ) => THREE.Mesh;
  cylinder: (
    material: THREE.Material,
    rTop: number,
    rBottom: number,
    h: number,
    x: number,
    y: number,
    z: number,
    name?: string,
  ) => THREE.Mesh;
  plane: (
    material: THREE.Material,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    name?: string,
  ) => THREE.Mesh;
}

function makeKit(): BuildKit {
  return {
    // Only assign texture slots that were actually provided — three.js warns
    // when a material parameter is present with an `undefined` value.
    std: (opts) => {
      const material = new THREE.MeshStandardMaterial({
        color: opts.color,
        roughness: opts.roughness ?? 0.8,
        metalness: opts.metalness ?? 0.05,
        emissive: opts.emissive ?? 0xffffff,
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        transparent: true, // crossfade-ready from birth
      });
      if (opts.map) material.map = opts.map;
      if (opts.emissiveMap) material.emissiveMap = opts.emissiveMap;
      return material;
    },
    box: (material, w, h, d, x, y, z, name) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      if (name) mesh.name = name;
      return mesh;
    },
    cylinder: (material, rTop, rBottom, h, x, y, z, name) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, 10), material);
      mesh.position.set(x, y, z);
      if (name) mesh.name = name;
      return mesh;
    },
    plane: (material, w, h, x, y, z, name) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      mesh.position.set(x, y, z);
      if (name) mesh.name = name;
      return mesh;
    },
  };
}

/** Positions a finished board at the shared mount point. */
function placeAtMount(root: THREE.Group, height: number): void {
  root.position.set(MENU_MOUNT.centerX, MENU_MOUNT.bottomY + height / 2, MENU_MOUNT.centerZ);
  root.rotation.y = MENU_MOUNT.yaw;
}

/** Two drop lines + ceiling rail for a hanging board of `width`. */
function addHangers(
  kit: BuildKit,
  root: THREE.Group,
  width: number,
  topYInGroup: number,
  material: THREE.Material,
  radius: number,
): void {
  const railY = MENU_MOUNT.ceilingY - MENU_MOUNT.bottomY;
  const railLength = width + 0.34;
  root.add(kit.box(material, railLength, 0.035, 0.035, 0, railY, 0, 'ceiling-rail'));
  const dropHeight = railY - topYInGroup - 0.02;
  const halfSpan = width / 2 - Math.min(0.12, width * 0.14);
  for (const side of [-1, 1]) {
    const line = kit.cylinder(material, radius, radius, dropHeight, side * halfSpan, topYInGroup, 0);
    line.geometry.translate(0, dropHeight / 2, 0);
    line.name = side < 0 ? 'hang-line-0' : 'hang-line-1';
    root.add(line);
  }
}

/* ------------------------------------------------------------------------- */
/* Era composers                                                             */
/* ------------------------------------------------------------------------- */

function buildEra1945(preset: MenuEraPreset, rows: RenderedMenuRow[], note: string | undefined): THREE.Group {
  const kit = makeKit();
  const root = new THREE.Group();
  root.name = `menu-board-era-${preset.year}`;

  const { width, height } = preset.size;
  const texture = paintChalkSlate(preset, rows, note);

  const frame = kit.std({ color: preset.palette.trim, roughness: 0.62 });
  const slate = kit.std({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0,
    map: texture,
  });

  // Slate panel set into an oak frame.
  root.add(kit.box(slate, width, height, 0.022, 0, 0, 0, 'chalk-slate'));
  const bezel = 0.035;
  root.add(kit.box(frame, width + bezel * 2, height + bezel * 2, 0.016, 0, 0, -0.018, 'board-frame'));
  // Small chalk ledge with two chalk sticks.
  root.add(kit.box(frame, width * 0.42, 0.02, 0.05, 0, -height / 2 - 0.03, 0.01, 'chalk-ledge'));
  const chalk = kit.std({ color: '#f2e9b7', roughness: 0.9 });
  root.add(kit.cylinder(chalk, 0.006, 0.006, 0.05, -width * 0.08, -height / 2 - 0.008, 0.01));
  root.add(kit.cylinder(chalk, 0.006, 0.006, 0.05, width * 0.06, -height / 2 - 0.008, 0.01));

  const iron = kit.std({ color: '#55524c', roughness: 0.5, metalness: 0.6 });
  addHangers(kit, root, width, height / 2, iron, 0.006);

  placeAtMount(root, height);
  return root;
}

function buildEra1965(preset: MenuEraPreset, rows: RenderedMenuRow[], note: string | undefined): THREE.Group {
  const kit = makeKit();
  const root = new THREE.Group();
  root.name = `menu-board-era-${preset.year}`;

  const { width, height } = preset.size;
  const texture = paintDinerBoard(preset, rows, note);

  const wood = kit.std({ color: preset.palette.trim, roughness: 0.58 });
  const faceMat = kit.std({ color: 0xffffff, roughness: 0.5, map: texture });

  root.add(kit.box(faceMat, width, height, 0.024, 0, 0, 0, 'diner-paint-panel'));
  const bezel = 0.05;
  root.add(kit.box(wood, width + bezel * 2, height + bezel * 2, 0.03, 0, 0, -0.026, 'board-frame'));
  // Chrome trim strip along the bottom edge.
  const chrome = kit.std({ color: '#c9ced4', roughness: 0.25, metalness: 0.85 });
  root.add(kit.box(chrome, width, 0.025, 0.028, 0, -height / 2 + 0.012, 0.002));

  const chain = kit.std({ color: '#8f9297', roughness: 0.45, metalness: 0.7 });
  addHangers(kit, root, width, height / 2, chain, 0.008);

  placeAtMount(root, height);
  return root;
}

function buildEra1985(preset: MenuEraPreset, rows: RenderedMenuRow[], note: string | undefined): THREE.Group {
  const kit = makeKit();
  const root = new THREE.Group();
  root.name = `menu-board-era-${preset.year}`;

  const { width, height } = preset.size;
  const texture = paintPlasticLetterPanel(preset, rows, note);

  const alu = kit.std({ color: preset.palette.trim, roughness: 0.3, metalness: 0.75 });
  const panel = kit.std({
    color: 0xffffff,
    roughness: 0.4,
    map: texture,
    emissiveMap: texture,
    emissiveIntensity: preset.glow,
  });

  root.add(kit.box(panel, width, height, 0.05, 0, 0, 0, 'plastic-letter-panel'));
  const bezel = 0.04;
  root.add(kit.box(alu, width + bezel * 2, height + bezel * 2, 0.06, 0, 0, -0.045, 'lightbox-housing'));
  root.userData.glowSurfaceNames = ['plastic-letter-panel'];

  const rod = kit.std({ color: '#9aa0a6', roughness: 0.35, metalness: 0.8 });
  addHangers(kit, root, width, height / 2, rod, 0.011);

  placeAtMount(root, height);
  return root;
}

function buildEra2005(preset: MenuEraPreset, rows: RenderedMenuRow[], note: string | undefined): THREE.Group {
  const kit = makeKit();
  const root = new THREE.Group();
  root.name = `menu-board-era-${preset.year}`;

  /* --- hanging printed wall menu -------------------------------------- */
  const { width, height } = preset.size;
  const texture = paintPrintedWallMenu(preset, rows);
  const steel = kit.std({ color: '#9aa0a6', roughness: 0.32, metalness: 0.8 });
  const faceMat = kit.std({ color: 0xffffff, roughness: 0.62, map: texture });
  const trimMat = kit.std({ color: preset.palette.trim, roughness: 0.5 });

  const board = new THREE.Group();
  board.name = 'printed-wall-menu';
  board.add(kit.box(faceMat, width, height, 0.02, 0, 0, 0, 'menu-print-face'));
  board.add(kit.box(trimMat, width + 0.05, height + 0.05, 0.024, 0, 0, -0.02, 'board-frame'));
  board.add(kit.box(steel, width + 0.12, 0.028, 0.028, 0, height / 2 + 0.03, 0, 'top-batten'));
  addHangersInto(board, kit, width, height / 2 + 0.03, steel, 0.004);
  root.add(board);
  placeAtMount(root, height);

  /* --- floor-standing A-frame near the counter ------------------------ */
  const frame = new THREE.Group();
  frame.name = 'aframe-specials';
  frame.position.set(AFRAME_PLACEMENT.x, 0, AFRAME_PLACEMENT.z);
  frame.rotation.y = AFRAME_PLACEMENT.yaw;

  const specialsTexture = paintAframeSpecials(note);
  const chalkFace = kit.std({ color: 0xffffff, roughness: 0.92, map: specialsTexture });
  const backFace = kit.std({ color: '#2c2a27', roughness: 0.85 });
  const legMat = kit.std({ color: '#4a463f', roughness: 0.6 });

  const panelW = 0.62;
  const panelH = 0.95;
  const front = kit.plane(chalkFace, panelW, panelH, 0, panelH / 2, 0.075, 'aframe-panel');
  front.rotation.x = -0.21;
  frame.add(front);
  const rear = kit.plane(backFace, panelW, panelH, 0, panelH / 2, -0.075, 'aframe-back');
  rear.rotation.x = 0.21;
  rear.rotation.y = Math.PI;
  frame.add(rear);

  for (const side of [-1, 1]) {
    frame.add(
      kit.box(legMat, 0.045, 0.98, 0.03, side * (panelW / 2 - 0.02), 0.48, 0, `aframe-leg-${side < 0 ? 0 : 1}`),
    );
  }
  // Hinge bar + safety chain across the cheeks.
  frame.add(kit.cylinder(legMat, 0.015, 0.015, panelW, 0, panelH + 0.02, 0, 'aframe-hinge'));
  frame.add(kit.box(steel, 0.012, 0.012, 0.16, panelW / 2 - 0.05, 0.34, 0, 'aframe-chain'));

  root.add(frame);
  root.userData.aframe = frame;
  return root;
}

/** Hanger helper scoped to an arbitrary subgroup (used by the 2005 wall menu). */
function addHangersInto(
  parent: THREE.Group,
  kit: BuildKit,
  width: number,
  topLocalY: number,
  material: THREE.Material,
  radius: number,
): void {
  // The board subgroup sits at the mount origin, so local Y ≈ world Y offset
  // from the board centre: rail goes at (ceiling − bottom − boardCentreY).
  const dropHeight = MENU_MOUNT.ceilingY - MENU_MOUNT.bottomY - topLocalY;
  const railLength = width + 0.34;
  parent.add(kit.box(material, railLength, 0.028, 0.028, 0, topLocalY + dropHeight, 0, 'ceiling-rail'));
  const halfSpan = width / 2 - 0.11;
  for (const side of [-1, 1]) {
    const cable = kit.cylinder(material, radius, radius, dropHeight, side * halfSpan, topLocalY, 0);
    cable.geometry.translate(0, dropHeight / 2, 0);
    cable.name = side < 0 ? 'hang-line-0' : 'hang-line-1';
    parent.add(cable);
  }
}

export function buildEra2025(preset: MenuEraPreset, rows: RenderedMenuRow[], _note: string | undefined, extras: EraVariantExtras = {}): THREE.Group {
  const kit = makeKit();
  const root = new THREE.Group();
  root.name = `menu-board-era-${preset.year}`;

  /* --- LCD screen ------------------------------------------------------ */
  const { width, height } = preset.size;
  const screenTexture = paintLcdScreen(preset, rows);
  const tickerTexture = paintLcdSpecialsTicker(buildTickerLines(rows, _note));
  extras.specialsTicker = tickerTexture;

  const bezelMat = kit.std({ color: preset.palette.trim, roughness: 0.42, metalness: 0.35 });
  const screenMat = kit.std({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.05,
    map: screenTexture,
    emissiveMap: screenTexture,
    emissiveIntensity: preset.glow,
  });

  root.add(kit.box(bezelMat, width + 0.06, height + 0.06, 0.045, 0, 0, -0.03, 'lcd-bezel'));
  root.add(kit.box(screenMat, width, height, 0.012, 0, 0, 0, 'lcd-screen'));

  // Scrolling specials strip riding on the reserved bottom band of the UI.
  const stripMat = kit.std({
    color: 0xffffff,
    roughness: 0.3,
    map: tickerTexture,
    emissiveMap: tickerTexture,
    emissiveIntensity: preset.glow * 0.9,
  });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.78, height * 0.105), stripMat);
  strip.name = 'lcd-specials-strip';
  strip.position.set(width * 0.095, -height * 0.43, 0.009);
  strip.userData.glowSurface = true;
  root.add(strip);
  root.userData.glowSurfaceNames = ['lcd-screen', 'lcd-specials-strip'];

  // Slim ceiling pole + mount plate instead of chains — proper AV install.
  const poleMat = kit.std({ color: '#22252a', roughness: 0.4, metalness: 0.6 });
  const poleDrop = MENU_MOUNT.ceilingY - MENU_MOUNT.bottomY - height / 2;
  root.add(kit.cylinder(poleMat, 0.016, 0.016, poleDrop, 0, height / 2 + poleDrop / 2, -0.03, 'mount-pole'));
  const plate = kit.cylinder(poleMat, 0.09, 0.09, 0.018, 0, MENU_MOUNT.ceilingY - MENU_MOUNT.bottomY - 0.01, -0.03, 'ceiling-mount');
  plate.geometry.rotateX(Math.PI / 2);
  plate.rotation.x = Math.PI / 2;
  root.add(plate);

  placeAtMount(root, height);

  /* --- QR ordering tent-cards on the dining tables --------------------- */
  const cardMat = kit.std({ color: 0xffffff, roughness: 0.55 });
  const qrFront = paintQrOrderingCard('CORNER CAFÉ');
  let cardIndex = 0;
  for (const tableIndex of QR_TABLE_INDICES) {
    const anchor = TABLE_ANCHORS[tableIndex];
    if (!anchor) continue;
    const card = new THREE.Group();
    card.name = `qr-tent-card-${cardIndex}`;
    cardIndex += 1;
    card.position.set(anchor.x + 0.22, TABLE_TOP_Y, anchor.z + 0.16);
    card.rotation.y = Math.PI + 0.5;

    const leafGeo = new THREE.PlaneGeometry(0.095, 0.115);
    const qrMat = kit.std({ color: 0xffffff, roughness: 0.5, map: qrFront });
    for (const tilt of [1, -1] as const) {
      const leaf = new THREE.Mesh(leafGeo, qrMat);
      leaf.position.set(0, 0.062, 0);
      leaf.rotation.x = tilt * 0.32;
      if (tilt === -1) leaf.rotation.y = Math.PI;
      leaf.castShadow = false;
      leaf.receiveShadow = true;
      card.add(leaf);
    }
    card.add(kit.box(cardMat, 0.098, 0.004, 0.05, 0, 0.002, 0));
    root.add(card);
  }

  return root;
}

/** Ticker copy: rotating seasonal specials + routed note. */
function buildTickerLines(rows: RenderedMenuRow[], note: string | undefined): string[] {
  const cheapest = rows.reduce<RenderedMenuRow | null>(
    (best, row) => (best === null || row.price.length < best.price.length ? row : best),
    null,
  );
  return [
    'Seasonal specials — Pumpkin Spice Latte £4.80',
    `Happy Hour Filter 3–5pm £2.50`,
    'New: Pistachio Croissant £4.20 · vegan option',
    note ?? 'Scan to order · collect at counter',
    cheapest ? `${cheapest.label} only ${cheapest.price}` : '',
  ].filter((line) => line.length > 0);
}

/* ------------------------------------------------------------------------- */
/* Variant dispatch                                                          */
/* ------------------------------------------------------------------------- */

export type EraVariantComposer = (
  preset: MenuEraPreset,
  rows: RenderedMenuRow[],
  note: string | undefined,
) => THREE.Group;

export const ERA_VARIANT_COMPOSERS: Record<MenuEraPreset['year'], EraVariantComposer> = {
  1945: buildEra1945,
  1965: buildEra1965,
  1985: buildEra1985,
  2005: buildEra2005,
  2025: buildEra2025,
};

export function composeEraVariant(year: MenuEraPreset['year']): { group: THREE.Group; extras: EraVariantExtras } {
  const preset = getMenuPreset(year);
  const rows = preset.rows.map((row) => ({ label: row.label, price: row.price }));
  const extras: EraVariantExtras = {};
  const composer = ERA_VARIANT_COMPOSERS[year];
  const group =
    year === 2025
      ? buildEra2025(preset, rows, preset.specialsNote, extras)
      : composer(preset, rows, preset.specialsNote);
  group.userData.eraTitle = preset.title;
  group.userData.boardStyle = preset.boardStyle;
  group.userData.renderedRows = rows;
  group.userData.specialsNote = preset.specialsNote ?? null;
  return { group, extras };
}
