import * as THREE from 'three';
import {
  SEAT_SPOTS,
  SIDE_SPOT,
  THIRD_SEAT_SPOT,
  createTableCluster,
  mulberry32,
  spotPosition,
  tagItem,
} from '../dressing';
import { TABLE_COUNT } from '../layout';
import { cardStock, cardboard, darkMatte, glass, liquid, paper, plastic, stainless } from '../kit/materials';
import {
  makeNapkinDispenser,
  makeSyrupBottle,
  makeTakeawayCup,
} from '../kit/parts';
import { configuredPieceCount, stampPresetMetadata } from '../meta';
import type { EraVariantContext } from '../types';

/**
 * 2005 — branded takeaway espresso bar.
 *
 * Branded takeaway cups with corrugated sleeves and logo stripes, brushed
* steel paper-napkin dispensers, and flavoured syrup bottles for the
 * self-serve shelf habit of the noughties.
 */
export function buildEra2005Tableware(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tableware-era-2005';

  // Fresh palette.
  const cupPaper = cardStock(0xf0e8da);
  const sleeveBoard = cardboard();
  const lidWhite = plastic(0xf4f2ec, 0.35);
  const brandBand = cardStock(0x7a3020);
  const dispenserSteel = stainless();
  const slotDark = darkMatte();
  const napkinWhite = paper();
  const syrupGlass = glass(0xe8dcc8, 0.45);
  const syrupCap = darkMatte(0x18151a);
  const syrupFlavours = [
    { fill: liquid(0xd8a95c), label: cardStock(0xc9a86a) }, // vanilla
    { fill: liquid(0x4e2f1a), label: cardStock(0x8a4b22) }, // chocolate
  ];

  const cupsPerTable = configuredPieceCount(context.spec, ['takeaway', 'cup', 'paper'], 2, 3);

  for (let tableIndex = 0; tableIndex < TABLE_COUNT; tableIndex += 1) {
    const cluster = createTableCluster(2005, tableIndex);
    const rnd = mulberry32(2005 * 131 + tableIndex * 7 + 3);

    const seatSpots =
      cupsPerTable >= 3 ? [...SEAT_SPOTS, THIRD_SEAT_SPOT] : SEAT_SPOTS;
    seatSpots.forEach((seatSpot) => {
      const cup = tagItem(
        makeTakeawayCup({
          cup: cupPaper,
          sleeve: sleeveBoard,
          lid: lidWhite,
          band: brandBand,
        }),
        'Branded takeaway cup with sleeve',
        'tw-takeaway-cup',
      );
      cup.position.copy(spotPosition(seatSpot, (rnd() - 0.5) * 14));
      cup.rotation.y = (rnd() - 0.5) * 0.9;
      cluster.add(cup);
    });

    // Paper napkin dispensers on alternating tables.
    if (tableIndex % 2 === 0) {
      const dispenser = tagItem(
        makeNapkinDispenser({ steel: dispenserSteel, slotDark, napkin: napkinWhite }),
        'Paper napkin dispenser',
        'tw-paper-napkin-dispenser',
      );
      dispenser.position.copy(spotPosition(SIDE_SPOT));
      dispenser.rotation.y = (rnd() - 0.5) * 0.5;
      cluster.add(dispenser);
    }

    // Flavoured syrup pair on the remaining tables.
    if (tableIndex % 2 === 1) {
      syrupFlavours.forEach((flavour, bottleIndex) => {
        const bottle = tagItem(
          makeSyrupBottle({
            bottle: syrupGlass,
            fill: flavour.fill,
            cap: syrupCap,
            label: flavour.label,
          }),
        'Flavoured syrup bottle',
        'tw-syrup-bottle',
        );
        bottle.position.copy(
          spotPosition({ angleDeg: 138 + bottleIndex * 32, radius: 0.055 + bottleIndex * 0.03 }),
        );
        bottle.rotation.y = rnd() * Math.PI;
        cluster.add(bottle);
      });
    }

    group.add(cluster);
  }

  stampPresetMetadata(group, {
    year: 2005,
    title: 'Takeaway espresso bar',
    pieceLabels: [
      `${cupsPerTable}× branded takeaway cups with sleeves per table`,
      'Paper napkin dispensers',
      'Flavoured syrup bottles (vanilla / chocolate)',
    ],
  });

  return group;
}
