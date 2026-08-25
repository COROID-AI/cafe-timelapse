import * as THREE from 'three';
import {
  CENTRE_SPOT,
  PLATE_SPOTS,
  SEAT_SPOTS,
  THIRD_SEAT_SPOT,
  createTableCluster,
  mulberry32,
  spotPosition,
  tagItem,
} from '../dressing';
import { TABLE_COUNT } from '../layout';
import type { Spot } from '../dressing';
import { ceramic, darkMatte, glass, paper, stainless, stoneware } from '../kit/materials';
import {
  makeAshtray,
  makeGlassSugarPourer,
  makeMug,
  makePlate,
} from '../kit/parts';
import { configuredPieceCount, stampPresetMetadata } from '../meta';
import type { EraVariantContext } from '../types';

/**
 * 1985 — pastel stoneware & smoke.
 *
 * Chunky pastel stoneware mugs with matching side plates, a glass sugar
* pourer, and — period-accurately — ashtrays on the tables.
 */
export function buildEra1985Tableware(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tableware-era-1985';

  // Fresh palette.
  const pastels = [
    stoneware(0xbfe3cf), // mint
    stoneware(0xf2cfd4), // pink
    stoneware(0xf6d8bd), // peach
    stoneware(0xaebdc9), // powder blue
  ];
  const ashtrayGlaze = ceramic(0xd9d4c8, 0.3);
  const ashtrayInner = darkMatte(0x4a4038);
  const stubWhite = paper();
  const ashGrey = darkMatte(0x9a958a, 0.85);
  const pourerGlass = glass(0xdfe9ea, 0.28);
  const pourerSteel = stainless();

  const settingsPerTable = configuredPieceCount(context.spec, ['mug', 'coffee', 'cup'], 2, 3);

  for (let tableIndex = 0; tableIndex < TABLE_COUNT; tableIndex += 1) {
    const cluster = createTableCluster(1985, tableIndex);
    const rnd = mulberry32(1985 * 131 + tableIndex * 7 + 3);

    const seatSpots =
      settingsPerTable >= 3 ? [...SEAT_SPOTS, THIRD_SEAT_SPOT] : SEAT_SPOTS;
    seatSpots.forEach((seatSpot, slot) => {
      const pastel = pastels[(tableIndex * 2 + slot) % pastels.length];

      // Chunky pastel stoneware mug.
      const mug = tagItem(
        makeMug({ body: pastel, handle: pastel, radius: 0.043, height: 0.096 }),
        'Pastel stoneware mug',
        'tw-pastel-stoneware-mug',
      );
      mug.position.copy(spotPosition(seatSpot, (rnd() - 0.5) * 14));
      mug.rotation.y = rnd() * Math.PI;
      cluster.add(mug);
    });

    // Matching side plates.
    PLATE_SPOTS.forEach((plateSpot, slot) => {
      const pastel = pastels[(tableIndex * 2 + slot + 1) % pastels.length];
      const plate = tagItem(
        makePlate({ glaze: pastel, radius: 0.082 }),
        'Stoneware side plate',
        'tw-stoneware-side-plate',
      );
      plate.position.copy(spotPosition(plateSpot, (rnd() - 0.5) * 10));
      cluster.add(plate);
    });

    // Glass sugar pourer on alternating tables.
    if (tableIndex % 3 === 1) {
      const pourer = tagItem(
        makeGlassSugarPourer({ glassBody: pourerGlass, steel: pourerSteel }),
        'Glass sugar pourer',
        'tw-glass-sugar-pourer',
      );
      pourer.position.copy(spotPosition(CENTRE_SPOT));
      cluster.add(pourer);
    }

    // Period-accurate ashtrays: one per table, two on the corner tables.
    const ashtraySpots: Spot[] = [{ angleDeg: 90, radius: 0.055 }];
    if (tableIndex === 2 || tableIndex === 5) {
      ashtraySpots.push({ angleDeg: 270, radius: 0.115 });
    }
    ashtraySpots.forEach((ashtraySpot) => {
      const ashtray = tagItem(
        makeAshtray({
          glaze: ashtrayGlaze,
          inner: ashtrayInner,
          stub: stubWhite,
          ash: ashGrey,
          radius: 0.05,
        }),
        'Ashtray (period-accurate)',
        'tw-ashtray',
      );
      ashtray.position.copy(spotPosition(ashtraySpot, (rnd() - 0.5) * 18));
      ashtray.rotation.y = rnd() * Math.PI;
      cluster.add(ashtray);
    });

    group.add(cluster);
  }

  stampPresetMetadata(group, {
    year: 1985,
    title: 'Pastel stoneware & smoke',
    pieceLabels: [
      `${settingsPerTable}× pastel stoneware mugs per table`,
      'Matching stoneware side plates',
      'Glass sugar pourer',
      'Ashtrays on the tables (period-accurate)',
    ],
  });

  return group;
}
