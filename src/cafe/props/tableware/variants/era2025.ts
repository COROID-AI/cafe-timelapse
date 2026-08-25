import * as THREE from 'three';
import {
  CENTRE_SPOT,
  SEAT_SPOTS,
  THIRD_SEAT_SPOT,
  createTableCluster,
  mulberry32,
  spotPosition,
  tagItem,
} from '../dressing';
import { TABLE_COUNT } from '../layout';
import { cardStock, ceramic, glass, linen, liquid, plastic } from '../kit/materials';
import {
  makeEcoCup,
  makeFlatWhiteGlass,
  makePourOverSet,
  makeTipJar,
} from '../kit/parts';
import { configuredPieceCount, stampPresetMetadata } from '../meta';
import type { EraVariantContext } from '../types';

/**
 * 2025 — third-wave minimal tabletops.
 *
 * Reusable eco-cups, minimal flat-white glasses, one showpiece ceramic
* pour-over set, and a card-reader tip jar on the pickup table nearest the
 * counter run.
 */
export function buildEra2025Tableware(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tableware-era-2025';

  // Fresh palette.
  const sageCup = plastic(0x8fae8b, 0.55);
  const terracottaCup = plastic(0xc2795a, 0.55);
  const lidOffWhite = plastic(0xefeadf, 0.4);
  const corkBand = linen(0xb99b72);
  const fwGlass = glass(0xe4eeef, 0.32);
  const filterCoffee = liquid(0x3a2a1e);
  const cremaFoam = liquid(0xcaa87a, 0.92);
  const dripperCeramic = ceramic(0xf1ece2);
  const carafeGlass = glass(0xe6efef, 0.3);
  const jarGlass = glass(0xe9f0ee, 0.3);
  const jarCork = linen(0xb99b72);
  const jarSign = cardStock(0x26262a);
  const jarAccent = cardStock(0x58e0c0);
  const cardStubs = [
    cardStock(0x2f6fb2),
    cardStock(0xc23b2e),
    cardStock(0x2fa860),
  ];

  const cupsPerTable = configuredPieceCount(context.spec, ['eco', 'reusable', 'cup'], 2, 3);
  const ecoCups = [sageCup, terracottaCup];

  for (let tableIndex = 0; tableIndex < TABLE_COUNT; tableIndex += 1) {
    const cluster = createTableCluster(2025, tableIndex);
    const rnd = mulberry32(2025 * 131 + tableIndex * 7 + 3);

    const seatSpots =
      cupsPerTable >= 3 ? [...SEAT_SPOTS, THIRD_SEAT_SPOT] : SEAT_SPOTS;
    seatSpots.forEach((seatSpot, slot) => {
      const cup = tagItem(
        makeEcoCup({ cup: ecoCups[(tableIndex + slot) % 2], lid: lidOffWhite, band: corkBand }),
        'Reusable eco-cup',
        'tw-reusable-eco-cup',
      );
      cup.position.copy(spotPosition(seatSpot, (rnd() - 0.5) * 14));
      cup.rotation.y = (rnd() - 0.5) * 0.8;
      cluster.add(cup);
    });

    // Minimal flat-white glasses on three tables.
    const flatWhiteSpots: Array<{ angleDeg: number; radius: number }> =
      tableIndex === 0
        ? [
            { angleDeg: 110, radius: 0.11 },
            { angleDeg: 140, radius: 0.155 },
          ]
        : tableIndex === 3 || tableIndex === 4
          ? [{ angleDeg: 115, radius: 0.12 }]
          : [];
    flatWhiteSpots.forEach((glassSpot) => {
      const flatWhite = tagItem(
        makeFlatWhiteGlass({ glassWall: fwGlass, coffee: filterCoffee, crema: cremaFoam }),
        'Minimal flat-white glass',
        'tw-flat-white-glass',
      );
      flatWhite.position.copy(spotPosition(glassSpot, (rnd() - 0.5) * 10));
      cluster.add(flatWhite);
    });

    // Showpiece ceramic pour-over set on the east-window table.
    if (tableIndex === 2) {
      const pourOver = tagItem(
        makePourOverSet({ dripper: dripperCeramic, carafe: carafeGlass, coffee: filterCoffee }),
        'Ceramic pour-over set',
        'tw-pour-over-set',
      );
      pourOver.position.copy(spotPosition(CENTRE_SPOT));
      pourOver.rotation.y = -0.4;
      cluster.add(pourOver);
    }

    // Card-reader tip jar beside the pickup point (table nearest the counter).
    if (tableIndex === 5) {
      const tipJar = tagItem(
        makeTipJar({
          jar: jarGlass,
          base: jarCork,
          cards: cardStubs,
          sign: jarSign,
          accent: jarAccent,
        }),
        'Card-reader tip jar',
        'tw-card-tip-jar',
      );
      tipJar.position.copy(spotPosition({ angleDeg: 15, radius: 0.04 }));
      cluster.add(tipJar);
    }

    group.add(cluster);
  }

  stampPresetMetadata(group, {
    year: 2025,
    title: 'Third-wave minimal',
    pieceLabels: [
      `${cupsPerTable}× reusable eco-cups per table`,
      'Minimal flat-white glasses',
      'Ceramic pour-over set (showpiece table)',
      'Card-reader tip jar (pickup table)',
    ],
  });

  return group;
}
