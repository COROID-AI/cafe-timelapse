/**
 * Assembles one complete era set: dining tables + chairs on the shared
 * anchors, plus every décor piece listed in the era spec.
 *
 * The whole set lives under one group so the crossfade can treat an era as a
 * single unit. Layout jitter uses a deterministic PRNG seeded per year.
 */

import * as THREE from 'three';
import { TABLE_ANCHORS } from './specs';
import { GeometryCache } from './geometry';
import { MaterialKit } from './materials';
import type { ResolvedFurnitureEra } from './slice';
import {
  ERA_TONES,
  buildChair,
  buildCoffeeTable,
  buildSofa,
  buildTable,
  mulberry32,
} from './pieces';
import type { BuiltTable } from './pieces';
import {
  buildBlackoutCurtain,
  buildCheckerLino,
  buildChargingSpot,
  buildDoily,
  buildFern,
  buildHangingPlant,
  buildJukeboxHint,
  buildNeonPanel,
  buildRecordCrates,
  buildRug,
  buildSucculent,
  buildVase,
  buildWallFrame,
} from './decor';

/** Chair standoff distance from the table centre, per chair family. */
const SEAT_DISTANCE: Record<string, number> = {
  mismatchedWood: 0.52,
  chromeVinyl: 0.62,
  tubularPastel: 0.58,
  woodSteelCombo: 0.64,
  ergoShell: 0.56,
};

const CEILING_Y = 3.54;

export interface EraSetBuild {
  root: THREE.Group;
  kit: MaterialKit;
  geo: GeometryCache;
  /** Rug groups (hidden when the flooring description says bare boards). */
  rugs: THREE.Object3D[];
  /** Décor container (hidden when the slice's decor labels say "none"). */
  decorRoot: THREE.Group;
}

/** Builds the full object graph for one era. */
export function buildEraSet(resolved: ResolvedFurnitureEra): EraSetBuild {
  const spec = resolved.spec;
  const year = spec.year;
  const rnd = mulberry32(year * 7919 + 17);
  const tones = ERA_TONES[year];
  const geo = new GeometryCache();
  const kit = new MaterialKit();
  const deps = { geo };

  const paletteHex =
    resolved.palette.length > 0
      ? resolved.palette.map((color) => `#${color.getHexString()}`)
      : ['#9a9a9a'];

  const root = new THREE.Group();
  root.name = `furniture-era-${year}`;
  root.userData.eraYear = year;
  root.visible = false;

  /* ----- Dining tables + chairs ------------------------------------- */

  const tables: BuiltTable[] = [];
  spec.tables.forEach((kind, index) => {
    const anchor = TABLE_ANCHORS[index];
    const built = buildTable(deps, kit, tones, kind, paletteHex, index, rnd);
    built.group.position.set(anchor.x + (rnd() - 0.5) * 0.08, 0, anchor.z + (rnd() - 0.5) * 0.08);
    built.group.rotation.y = (rnd() - 0.5) * 0.14;
    root.add(built.group);
    tables.push(built);
  });

  const standOff = SEAT_DISTANCE[spec.chairs.style] ?? 0.56;
  spec.chairs.anglesByTable.forEach((angles, tableIndex) => {
    const table = tables[tableIndex];
    angles.forEach((angleDeg, chairIndex) => {
      const angle = (angleDeg * Math.PI) / 180;
      const chair = buildChair(deps, kit, tones, spec.chairs.style, paletteHex, tableIndex * 7 + chairIndex + 1, rnd);
      const px = table.group.position.x + Math.sin(angle) * standOff + (rnd() - 0.5) * 0.05;
      const pz = table.group.position.z + Math.cos(angle) * standOff + (rnd() - 0.5) * 0.05;
      chair.position.set(px, 0, pz);
      chair.rotation.y = Math.atan2(table.group.position.x - px, table.group.position.z - pz) + (rnd() - 0.5) * 0.16;
      if (spec.chairs.style === 'mismatchedWood' && rnd() < 0.25) {
        chair.rotation.z = (rnd() - 0.5) * 0.03; // Uneven floor, uneven chair.
      }
      chair.name = `chair-t${tableIndex}-${chairIndex}`;
      root.add(chair);
    });
  });

  /* ----- Décor ------------------------------------------------------- */

  const decorRoot = new THREE.Group();
  decorRoot.name = 'furniture-decor';
  // Rugs get their own container so the flooring rule governs them
  // independently of the décor labels ("none" must not hide rugs).
  const rugsRoot = new THREE.Group();
  rugsRoot.name = 'furniture-rugs';
  const rugs: THREE.Object3D[] = [];

  const addRug = (rug: THREE.Object3D, x: number, z: number, yaw = 0): void => {
    rug.position.set(x, 0, z);
    rug.rotation.y = yaw;
    rugs.push(rug);
    rugsRoot.add(rug);
  };

  for (const id of spec.decor) {
    switch (id) {
      case 'doilies': {
        tables.forEach((table, i) => {
          const doily = buildDoily(deps, kit, table.topY);
          doily.position.set(table.group.position.x, 0, table.group.position.z);
          doily.name = `doily-${i}`;
          decorRoot.add(doily);
        });
        break;
      }
      case 'blackoutCurtains': {
        const southSpots = [
          { x: -4, drawn: false },
          { x: 0, drawn: true },
          { x: 4, drawn: false },
        ];
        for (const spot of southSpots) {
          const curtain = buildBlackoutCurtain(deps, kit, { width: 1.9, drawn: spot.drawn });
          curtain.position.set(spot.x, 0, -4.84);
          curtain.name = 'blackout-curtain';
          decorRoot.add(curtain);
        }
        for (const ez of [-2.25, 2.25]) {
          const curtain = buildBlackoutCurtain(deps, kit, { width: 1.6, drawn: ez > 0 });
          curtain.position.set(5.84, 0, ez);
          curtain.rotation.y = -Math.PI / 2;
          curtain.name = 'blackout-curtain';
          decorRoot.add(curtain);
        }
        break;
      }
      case 'ragRug':
        addRug(buildRug(deps, kit, 2.4, 2.4, '#7d4b3f', '#a08662', true), 0.3, 1.7);
        break;
      case 'doorMat':
        addRug(buildRug(deps, kit, 0.95, 0.55, '#8a7a5c'), -4.55, 3.2);
        break;
      case 'checkerLino': {
        const lino = buildCheckerLino(deps, kit, 2.7, 2.3);
        lino.position.set(0, 0, 0.1);
        decorRoot.add(lino);
        break;
      }
      case 'jukeboxCorner': {
        const jukebox = buildJukeboxHint(deps, kit);
        jukebox.position.set(4.78, 0, -4.18);
        jukebox.rotation.y = Math.atan2(-4.78, 4.18);
        decorRoot.add(jukebox);
        break;
      }
      case 'recordCrates': {
        const crates = buildRecordCrates(deps, kit);
        crates.position.set(4.12, 0.02, -3.5);
        crates.rotation.y = Math.atan2(-4.12, 3.5);
        decorRoot.add(crates);
        break;
      }
      case 'ferns': {
        const spots: Array<[number, number, number]> = [
          [-4.9, 0.55, 1.0],
          [-5.0, 4.32, 1.15],
          [4.92, -4.28, 0.9],
        ];
        spots.forEach(([fx, fz, scale], i) => {
          const fern = buildFern(deps, kit, scale);
          fern.position.set(fx, 0, fz);
          fern.name = `fern-${i}`;
          decorRoot.add(fern);
        });
        break;
      }
      case 'neonAccents': {
        const neon = buildNeonPanel(deps, kit, paletteHex);
        neon.position.set(5.94, 2.12, 0);
        neon.rotation.y = -Math.PI / 2;
        neon.name = 'neon-panel';
        decorRoot.add(neon);
        break;
      }
      case 'pastelRug':
        addRug(
          buildRug(deps, kit, 2.8, 2.0, paletteHex[1 % paletteHex.length], paletteHex[2 % paletteHex.length]),
          0.3,
          1.7,
          0.06,
        );
        break;
      case 'ceramicVases': {
        for (const vi of [1, 4]) {
          const vase = buildVase(deps, kit, paletteHex[(vi + 1) % paletteHex.length], tables[vi].topY);
          vase.position.set(tables[vi].group.position.x, 0, tables[vi].group.position.z);
          vase.name = `vase-${vi}`;
          decorRoot.add(vase);
        }
        break;
      }
      case 'loungeSofa': {
        const sofa = buildSofa(deps, kit, tones, paletteHex);
        sofa.position.set(5.02, 0, 3.15);
        sofa.rotation.y = -Math.PI / 2;
        sofa.name = 'lounge-sofa';
        decorRoot.add(sofa);
        const coffee = buildCoffeeTable(deps, kit, tones);
        coffee.position.set(4.1, 0, 3.15);
        coffee.name = 'coffee-table';
        decorRoot.add(coffee);
        break;
      }
      case 'wallFrames': {
        const frames: Array<[number, number, number, number, string]> = [
          [-2.6, 1.62, 0.72, 0.92, '#8a8578'],
          [0.1, 1.78, 0.5, 0.66, '#5c6b73'],
          [2.7, 1.55, 0.9, 0.55, '#a49a8c'],
        ];
        for (const [fx, fy, fw, fh, fc] of frames) {
          const frame = buildWallFrame(deps, kit, fw, fh, fc);
          frame.position.set(fx, fy, -4.86);
          frame.name = 'wall-frame';
          decorRoot.add(frame);
        }
        const pierFrame = buildWallFrame(deps, kit, 0.62, 0.82, paletteHex[3 % paletteHex.length]);
        pierFrame.position.set(5.96, 1.6, 0);
        pierFrame.rotation.y = -Math.PI / 2;
        pierFrame.name = 'wall-frame';
        decorRoot.add(pierFrame);
        break;
      }
      case 'graphiteRug':
        addRug(buildRug(deps, kit, 2.7, 2.1, '#37342f', '#211d19'), 4.35, 3.15);
        break;
      case 'hangingPlants': {
        const drops: Array<[number, number, number]> = [
          [-2.6, -1.9, 0.95],
          [2.4, 2.3, 0.75],
        ];
        drops.forEach(([hx, hz, drop], i) => {
          const plant = buildHangingPlant(deps, kit, CEILING_Y, drop);
          plant.position.set(hx, 0, hz);
          plant.name = `hanging-plant-${i}`;
          decorRoot.add(plant);
        });
        break;
      }
      case 'chargingSpots': {
        for (const ci of [0, 3, 5]) {
          const spot = buildChargingSpot(deps, kit, tables[ci].topY);
          spot.position.set(tables[ci].group.position.x, 0, tables[ci].group.position.z);
          spot.name = `charging-spot-${ci}`;
          decorRoot.add(spot);
        }
        break;
      }
      case 'weaveRug':
        addRug(buildRug(deps, kit, 2.6, 2.6, '#cbb99a', '#a58c68', true), 0.3, 1.7);
        break;
      case 'succulentPots': {
        const si = 2;
        const succulent = buildSucculent(deps, kit, tables[si].topY);
        succulent.position.set(tables[si].group.position.x, 0, tables[si].group.position.z);
        succulent.name = 'succulent-pot';
        decorRoot.add(succulent);
        break;
      }
    }
  }

  root.add(decorRoot);
  root.add(rugsRoot);

  return { root, kit, geo, rugs, decorRoot };
}
