import * as THREE from 'three';
import {
  CENTRE_SPOT,
  SEAT_SPOTS,
  SIDE_SPOT,
  THIRD_SEAT_SPOT,
  createTableCluster,
  mulberry32,
  spotPosition,
  tagItem,
} from '../dressing';
import { TABLE_COUNT } from '../layout';
import {
  cardStock,
  ceramic,
  darkMatte,
  enamel,
  paper,
} from '../kit/materials';
import {
  makeMug,
  makeOpenSugarBowl,
  makePlate,
  makeRationBook,
  makeSaucer,
} from '../kit/parts';
import { configuredPieceCount, stampPresetMetadata } from '../meta';
import type { EraVariantContext } from '../types';

/**
 * 1945 — post-war austerity tabletops.
 *
 * Chipped enamel mugs on mismatched saucers, sugar exposed in an open bowl,
 * worn side plates, and a ration book left on one table. Everything is reuse:
 * four different saucer glazes rotate across the six tables and the mugs
 * carry rim chips from years of hard service.
 */
export function buildEra1945Tableware(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tableware-era-1945';

  // Fresh palette (never share materials across era variants).
  const creamEnamel = enamel(0xe9e2ce);
  const sageEnamel = enamel(0x9aa189);
  const handleIron = enamel(0x57503f, 0.34);
  const chipDark = darkMatte(0x3f3324);
  const saucerGlazes = [
    ceramic(0xded4ba),
    ceramic(0xb9b09a),
    ceramic(0xcfc6ab),
    ceramic(0x8f8a76),
  ];
  const bowlGlaze = ceramic(0xe8e2d2);
  const bowlInner = darkMatte(0x6a5c48);
  const sugarWhite = paper();
  const bookCover = cardStock(0x9a7b52);
  const bookPages = paper();
  const bookStripe = cardStock(0x5c5646);

  const settingsPerTable = configuredPieceCount(
    context.spec,
    ['mug', 'cup', 'coffee', 'tea'],
    2,
    3,
  );

  for (let tableIndex = 0; tableIndex < TABLE_COUNT; tableIndex += 1) {
    const cluster = createTableCluster(1945, tableIndex);
    const rnd = mulberry32(1945 * 131 + tableIndex * 7 + 3);

    const seatSpots =
      settingsPerTable >= 3 ? [...SEAT_SPOTS, THIRD_SEAT_SPOT] : SEAT_SPOTS;
    seatSpots.forEach((spot, slot) => {
      const yawJitter = (rnd() - 0.5) * 20;
      const position = spotPosition(spot, yawJitter);

      // Mismatched saucer: radius and glaze vary per placement.
      const saucerRadius = 0.06 + rnd() * 0.015;
      const saucerGlaze = saucerGlazes[(tableIndex * 2 + slot) % saucerGlazes.length];
      const saucer = tagItem(
        makeSaucer({ glaze: saucerGlaze, radius: saucerRadius }),
        'Mismatched saucer',
        'tw-mismatched-saucer',
      );
      saucer.position.copy(position);
      saucer.rotation.y = rnd() * Math.PI;
      cluster.add(saucer);

      // Chipped enamel mug standing in the saucer well.
      const bodyMaterial = (tableIndex + slot) % 2 === 0 ? creamEnamel : sageEnamel;
      const mug = tagItem(
        makeMug({ body: bodyMaterial, handle: handleIron, chip: chipDark }),
        'Chipped enamel mug',
        'tw-enamel-mug',
      );
      mug.position.set(position.x, 0.0075, position.z);
      mug.rotation.y = rnd() * Math.PI;
      cluster.add(mug);
    });

    // Sugar served from an open bowl at the centre.
    const sugarBowl = tagItem(
      makeOpenSugarBowl({ glaze: bowlGlaze, inner: bowlInner, sugar: sugarWhite }),
      'Sugar in an open bowl',
      'tw-open-sugar-bowl',
    );
    sugarBowl.position.copy(spotPosition(CENTRE_SPOT, (rnd() - 0.5) * 14));
    cluster.add(sugarBowl);

    // Worn side plates survive on two tables only.
    if (tableIndex === 1 || tableIndex === 4) {
      const sidePlate = tagItem(
        makePlate({ glaze: saucerGlazes[(tableIndex + 1) % saucerGlazes.length], radius: 0.082 }),
        'Worn side plate',
        'tw-worn-side-plate',
      );
      sidePlate.position.copy(spotPosition(SIDE_SPOT));
      sidePlate.rotation.y = rnd() * Math.PI;
      cluster.add(sidePlate);
    }

    // The ration book rests on one table near the window.
    if (tableIndex === 1) {
      const rationBook = tagItem(
        makeRationBook({ cover: bookCover, pages: bookPages, stripe: bookStripe }),
        'Ration book on the table',
        'tw-ration-book',
      );
      rationBook.position.copy(spotPosition({ angleDeg: 30, radius: 0.06 }));
      rationBook.rotation.y = 0.35;
      cluster.add(rationBook);
    }

    group.add(cluster);
  }

  stampPresetMetadata(group, {
    year: 1945,
    title: 'Austerity & recovery',
    pieceLabels: [
      `${settingsPerTable}× chipped enamel mugs per table`,
      'Mismatched saucers (four surviving glazes)',
      'Sugar in an open bowl',
      'Worn side plates',
      'Ration book on a table',
    ],
  });

  return group;
}
