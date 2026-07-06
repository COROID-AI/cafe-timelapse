/**
 * @file src/eras/2025.js
 * Era 2025 — Modern sustainable.
 *
 * Scandinavian light-oak furniture, living wall of plants, contactless POS
 * (square-style terminal + tap-to-pay pad), QR-code table tents linking to a
 * digital menu, oat/almond/soy milk listed (oat latte $5.75, specialty flight
 * $7.50, avocado toast $9.00), multi-boiler espresso + automated pour-over +
 * Modbar-style under-counter brewer, ambient smart lighting (warm dimmable),
 * phone-centric music source (bluetooth speaker playing lo-fi/chill), patrons on
 * phones and slim laptops, sustainable fashion, tote bags, AirPods.
 */
import * as THREE from 'three';
import {
  makeTable, makeChair, makeShelf, makeFrame, makeCounter, makeCup, makeGlass,
  makePlate, makeWallClock, makeModbar, makeSmartPOS, makeBluetoothSpeaker,
  makeQRTent, makePlant, makePlantWall, makeLamp, makePatron
} from './era-builder.js';

/**
 * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
 */
export default function era2025() {
  const group = new THREE.Group();
  group.name = 'era-2025';

  const palette = {
    primary: 0x7fd1b9,
    accent: 0xb8a6ff,
    wood: 0xc9a87a,
    metal: 0xdddddd,
    fabric: 0x6ec1c4
  };

  // ---- Menu items (mid-to-high single digits, plant-milk options) ----
  const menu = [
    { name: 'Oat Latte', price: '$5.75' },
    { name: 'Specialty Flight', price: '$7.50' },
    { name: 'Avocado Toast', price: '$9.00' },
    { name: 'Almond Cappuccino', price: '$5.25' },
    { name: 'Soy Flat White', price: '$5.50' }
  ];

  // ---- Counter + equipment ----
  const counter = makeCounter({ topColor: 0xc9a87a, frontColor: 0xb89868, w: 2.4, h: 1.05, d: 0.7 });
  counter.position.set(0, 0, -2.2);
  group.add(counter);

  // Modbar under-counter brewer (taps on counter)
  const modbar = makeModbar();
  modbar.position.set(-0.3, 1.05, -2.2);
  group.add(modbar);

  // Smart POS terminal
  const pos = makeSmartPOS();
  pos.position.set(0.85, 1.05, -2.0);
  group.add(pos);

  // ---- Bluetooth speaker + phone (music source) on counter ----
  const speaker = makeBluetoothSpeaker();
  speaker.position.set(-0.95, 1.05, -2.0);
  group.add(speaker);

  // ---- Menu: QR-code table tents instead of wall board, but keep a
  //      digital menu tablet on the counter for visibility ----
  const tablet = new THREE.Group();
  const tStand = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.02, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 })
  );
  tStand.castShadow = true;
  tablet.add(tStand);
  const tScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.15, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 })
  );
  tScreen.position.set(0, 0.08, 0);
  tScreen.rotation.x = -0.25;
  tablet.add(tScreen);
  const tDisp = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.13),
    new THREE.MeshStandardMaterial({ color: 0x113322, emissive: 0x7fd1b9, emissiveIntensity: 0.5 })
  );
  tDisp.position.set(0, 0.08, 0.006);
  tDisp.rotation.x = -0.25;
  tablet.add(tDisp);
  tablet.position.set(0, 2.1, -2.92);
  group.add(tablet);

  // ---- Seating: light-oak tables + minimalist chairs ----
  const tablePositions = [
    [-1.8, 1.4],
    [1.8, 1.4],
    [0, 2.8]
  ];
  for (const [x, z] of tablePositions) {
    const table = makeTable({ topColor: 0xc9a87a, legColor: 0xdddddd, w: 1.0, d: 0.7, h: 0.74 });
    table.position.set(x, 0, z);
    group.add(table);

    // tableware: ceramic cup + glass water
    const cup = makeCup({ color: 0xfafafa });
    cup.position.set(x - 0.12, 0.77, z);
    group.add(cup);
    const glass = makeGlass();
    glass.position.set(x + 0.14, 0.755, z);
    group.add(glass);

    // QR tent
    const tent = makeQRTent();
    tent.position.set(x + 0.18, 0.76, z - 0.18);
    group.add(tent);

    // minimalist oak chairs
    const chairA = makeChair({ seatColor: 0xe8dcc8, frameColor: 0xb89868 });
    chairA.position.set(x, 0, z + 0.52);
    chairA.rotation.y = Math.PI;
    group.add(chairA);
    const chairB = makeChair({ seatColor: 0xe8dcc8, frameColor: 0xb89868 });
    chairB.position.set(x, 0, z - 0.52);
    group.add(chairB);
  }

  // ---- Communal standing table near window ----
  const standTable = makeTable({ topColor: 0xc9a87a, legColor: 0xdddddd, w: 1.2, d: 0.5, h: 1.05 });
  standTable.position.set(-2.8, 0, 0.6);
  group.add(standTable);

  // ---- Plant wall (living wall) on side ----
  const plantWall = makePlantWall();
  plantWall.position.set(-3.4, 0.2, -1.0);
  plantWall.rotation.y = Math.PI / 2;
  group.add(plantWall);

  // ---- Potted plants ----
  const plant1 = makePlant({ potColor: 0xe8dcc8 });
  plant1.position.set(2.9, 0, 0.6);
  plant1.scale.set(1.3, 1.3, 1.3);
  group.add(plant1);
  const plant2 = makePlant({ potColor: 0xb89868 });
  plant2.position.set(-2.9, 0, 2.4);
  plant2.scale.set(1.1, 1.1, 1.1);
  group.add(plant2);

  // ---- Minimal wall art ----
  const art1 = makeFrame({ frameColor: 0xc9a87a, artColor: 0xeef5f0, w: 0.7, h: 0.5 });
  art1.position.set(3.45, 2.0, 0.0);
  art1.rotation.y = -Math.PI / 2;
  group.add(art1);

  const art2 = makeFrame({ frameColor: 0xc9a87a, artColor: 0xd8e8e0, w: 0.5, h: 0.7 });
  art2.position.set(3.45, 1.9, -1.2);
  art2.rotation.y = -Math.PI / 2;
  group.add(art2);

  // Wall clock (minimal)
  const clock = makeWallClock({ color: 0xfafafa });
  clock.position.set(-1.0, 2.9, -2.92);
  group.add(clock);

  // ---- Lighting: warm dimmable smart pendants ----
  const lampPositions = [
    [-1.8, 1.4], [1.8, 1.4], [0, 2.8], [0, -1.6]
  ];
  for (const [x, z] of lampPositions) {
    const lamp = makeLamp({ shadeColor: 0xeeeeee, cordColor: 0xcccccc, emissive: 0xffe8cc, r: 0.16, h: 1.2 });
    lamp.position.set(x, 3.4, z);
    lamp.rotation.x = Math.PI;
    group.add(lamp);
  }

  // ---- Patrons ----
  // Patron 1: on phone, AirPods, sustainable fashion
  const patron1 = makePatron({
    skin: 0xc9956a, shirt: 0x7fd1b9, pants: 0x4a5a4a, hair: 0x2a1a10,
    hairStyle: 'short', accessory: 'phone'
  });
  patron1.position.set(-1.6, 0, 1.4);
  patron1.rotation.y = 0.6;
  group.add(patron1);

  // Patron 2: slim laptop, tote bag, AirPods
  const patron2 = makePatron({
    skin: 0xe0b890, shirt: 0xb8a6ff, pants: 0x3a3a4a, hair: 0x3a2010,
    hairStyle: 'long', accessory: 'airpods'
  });
  patron2.position.set(1.6, 0, 1.6);
  patron2.rotation.y = -0.6;
  group.add(patron2);
  // slim laptop
  const laptop = new THREE.Group();
  const lBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.012, 0.21),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.6 })
  );
  lBase.castShadow = true;
  laptop.add(lBase);
  const lScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.19, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.15 })
  );
  lScreen.position.set(0, 0.1, -0.1);
  lScreen.rotation.x = -0.1;
  laptop.add(lScreen);
  const lDisp = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x113322, emissive: 0x7fd1b9, emissiveIntensity: 0.3 })
  );
  lDisp.position.set(0, 0.1, -0.094);
  lDisp.rotation.x = -0.1;
  laptop.add(lDisp);
  laptop.position.set(1.6, 0.77, 1.5);
  group.add(laptop);

  // Patron 3 at counter: ordering on phone
  const patron3 = makePatron({
    skin: 0xd8a878, shirt: 0x6ec1c4, pants: 0x4a4a5a, hair: 0x1a1008,
    hairStyle: 'buzz', accessory: 'phone'
  });
  patron3.position.set(-0.5, 0, -1.4);
  patron3.rotation.y = Math.PI;
  group.add(patron3);

  // ---- Hotspots ----
  const hotspots = [
    { id: 'music', position: [-0.95, 1.2, -2.0], radius: 0.6 },
    { id: 'menu', position: [0, 2.2, -2.9], radius: 0.7 },
    { id: 'counter', position: [0.85, 1.4, -2.0], radius: 0.6 },
    { id: 'equipment', position: [-0.3, 1.4, -2.2], radius: 0.6 },
    { id: 'patron', position: [1.6, 1.2, 1.6], radius: 0.7 }
  ];

  return {
    id: '2025',
    year: 2025,
    label: 'Modern',
    eraName: 'Modern Sustainable',
    palette,
    lighting: {
      ambient: 0xfff4e6,
      ambientI: 0.65,
      key: 0xffeed8,
      keyI: 1.4,
      fill: 0xd8f0e8,
      fillI: 0.45,
      exposure: 1.0
    },
    group,
    menu,
    hotspots,
    musicId: '2025',
    sfxType: 'steam',
    hud: {
      cssVars: {
        '--era-primary': '#7fd1b9',
        '--era-accent': '#b8a6ff',
        '--era-wood': '#c9a87a',
        '--era-text': '#f5fbf9',
        '--era-text-dim': 'rgba(245,251,249,0.62)',
        '--era-panel-bg': 'rgba(14,20,18,0.8)',
        '--era-panel-border': 'rgba(127,209,185,0.45)',
        '--era-track-from': '#4a6b5e',
        '--era-track-to': '#9fe3cd'
      }
    }
  };
}
