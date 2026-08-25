import * as THREE from 'three';
import {
  CENTRE_SPOT,
  PLATE_SPOTS,
  SEAT_SPOTS,
  SIDE_SPOT,
  THIRD_SEAT_SPOT,
  createTableCluster,
  mulberry32,
  spotPosition,
  tagItem,
} from '../dressing';
import { TABLE_COUNT } from '../layout';
import { chrome, ceramic, glass, darkMatte, melamine, plastic } from '../kit/materials';
import {
  makeDinerSugarShaker,
  makeKetchupBottle,
  makeMug,
  makePlate,
  makeSaucer,
} from '../kit/parts';
import { configuredPieceCount, stampPresetMetadata } from '../meta';
import type { EraVariantContext } from '../types';

/**
 * 1965 — formica diner tabletops.
 *
 * Bright diner-style cups matched to banded saucers, formica-safe melamine
 * plates in candy colours, a squeeze ketchup bottle on every table, and
 * chrome sugar shakers on half of them.
 */
export function buildEra1965Tableware(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tableware-era-1965';

  // Fresh palette.
  const cherryRed = ceramic(0xc23b2e);
  const aquaTurquoise = ceramic(0x2fa8a0);
  const dinerWhite = ceramic(0xf3efe4);
  const bandRed = ceramic(0xb3392f);
  const bandTeal = ceramic(0x2fa8a0);
  const plateBase = melamine(0xf0ead8);
  const plateBands = [melamine(0xb3392f), melamine(0x2fa8a0), melamine(0xe8b23a)];
  const ketchupRed = plastic(0xb32a20, 0.3);
  const ketchupCap = plastic(0xf2efe6, 0.4);
  const shakerGlass = glass(0xdce8ea, 0.28);
  const shakerChrome = chrome();
  const shakerHoles = darkMatte();

  const settingsPerTable = configuredPieceCount(context.spec, ['cup', 'coffee'], 2, 3);
  const cupGlazes = [cherryRed, aquaTurquoise];
  const cupBands = [bandRed, bandTeal];

  for (let tableIndex = 0; tableIndex < TABLE_COUNT; tableIndex += 1) {
    const cluster = createTableCluster(1965, tableIndex);
    const rnd = mulberry32(1965 * 131 + tableIndex * 7 + 3);

    const seatSpots =
      settingsPerTable >= 3 ? [...SEAT_SPOTS, THIRD_SEAT_SPOT] : SEAT_SPOTS;
    seatSpots.forEach((spot, slot) => {
      const flavour = (tableIndex + slot) % 2;

      // Banded saucer with the bright cup standing in its well.
      const saucer = tagItem(
        makeSaucer({ glaze: dinerWhite, accent: cupBands[flavour], radius: 0.07 }),
        'Diner saucer',
        'tw-diner-saucer',
      );
      saucer.position.copy(spotPosition(spot, (rnd() - 0.5) * 16));
      cluster.add(saucer);

      const cup = tagItem(
        makeMug({ body: cupGlazes[flavour], handle: cupGlazes[flavour] }),
        'Bright diner cup',
        'tw-diner-cup',
      );
      cup.position.set(saucer.position.x, 0.0075, saucer.position.z);
      cup.rotation.y = rnd() * Math.PI;
      cluster.add(cup);
    });

    // Formica-safe melamine plates in front of the seats.
    PLATE_SPOTS.forEach((plateSpot, slot) => {
      const plate = tagItem(
        makePlate({ glaze: plateBase, band: plateBands[(tableIndex + slot) % plateBands.length] }),
        'Formica-safe melamine plate',
        'tw-melamine-plate',
      );
      plate.position.copy(spotPosition(plateSpot, (rnd() - 0.5) * 12));
      plate.rotation.y = rnd() * Math.PI;
      cluster.add(plate);
    });

    // Squeeze ketchup on every diner table.
    const ketchup = tagItem(
      makeKetchupBottle({ red: ketchupRed, cap: ketchupCap }),
      'Squeeze ketchup bottle',
      'tw-ketchup-bottle',
    );
    ketchup.position.copy(spotPosition({ angleDeg: CENTRE_SPOT.angleDeg, radius: 0.07 }));
    cluster.add(ketchup);

    // Chrome sugar shakers on alternating tables.
    if (tableIndex % 3 === 0) {
      const shaker = tagItem(
        makeDinerSugarShaker({
          glassBody: shakerGlass,
          chromeTop: shakerChrome,
          holes: shakerHoles,
        }),
        'Chrome sugar shaker',
        'tw-diner-sugar-shaker',
      );
      shaker.position.copy(spotPosition(SIDE_SPOT));
      cluster.add(shaker);
    }

    group.add(cluster);
  }

  stampPresetMetadata(group, {
    year: 1965,
    title: 'Formica diner optimism',
    pieceLabels: [
      `${settingsPerTable}× bright diner cups & saucers per table`,
      'Formica-safe melamine plates (candy colour bands)',
      'Squeeze ketchup bottle on every table',
      'Chrome sugar shakers',
    ],
  });

  return group;
}
