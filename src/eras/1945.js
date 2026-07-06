/**
 * @file src/eras/1945.js
 * Era 1945 — Post-war austerity.
 *
 * Wood-and-formica tables, chrome-edge chairs, manual stove-top percolator on a
 * burner, handwritten-style chalk menu (coffee 5¢, sandwich 15¢, pie 10¢), bell
 * on the counter, manual crank cash register with brass bell, Victory war-bond
 * poster, Coca-Cola enamel sign, "Welcome Home" bunting, cathedral wireless set
 * playing big-band/swing, incandescent bare-bulb pendant lighting, patrons in
 * fedoras, victory rolls, three-piece suits, ankle-strap shoes, no electronics.
 *
 * The era module exports a factory returning a PeriodPackage.
 */
import * as THREE from 'three';
import {
  makeTable, makeChair, makeLamp, makeShelf, makeFrame, makeMenuBoard,
  makeCounter, makeCup, makeSaucer, makeMug, makePlate, makeWallClock,
  makePercolator, makeBurner, makeCathedralRadio, makeCrankRegister,
  makePatron, makeEnamelSign
} from './era-builder.js';

/**
 * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
 */
export default function era1945() {
  const group = new THREE.Group();
  group.name = 'era-1945';

  const palette = {
    primary: 0xc8a464,
    accent: 0xe9c46a,
    wood: 0x6b4a2b,
    metal: 0x999999,
    fabric: 0x8a6a4a
  };

  // ---- Menu items (period-correct, prices in cents under $1) ----
  const menu = [
    { name: 'Coffee', price: '5¢' },
    { name: 'Sandwich', price: '15¢' },
    { name: 'Pie Slice', price: '10¢' },
    { name: 'Donut', price: '6¢' },
    { name: 'Egg Cream', price: '12¢' }
  ];

  // ---- Counter + equipment ----
  const counter = makeCounter({ topColor: 0x5a3a20, frontColor: 0x4a3018, w: 2.4, h: 1.05, d: 0.7 });
  counter.position.set(0, 0, -2.2);
  group.add(counter);

  // Percolator on burner on counter (barista side)
  const burner = makeBurner();
  burner.position.set(-0.4, 1.05, -2.2);
  group.add(burner);
  const percolator = makePercolator({ metal: 0x9a9a9a });
  percolator.position.set(-0.4, 1.11, -2.2);
  group.add(percolator);

  // Crank register on counter
  const register = makeCrankRegister();
  register.position.set(0.7, 1.05, -2.0);
  group.add(register);

  // Bell on counter
  const bellBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0xc8a464, roughness: 0.3, metalness: 0.8 })
  );
  bellBase.castShadow = true;
  bellBase.position.set(0.95, 1.08, -2.1);
  group.add(bellBase);
  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd8b46a, roughness: 0.3, metalness: 0.8 })
  );
  bellDome.castShadow = true;
  bellDome.position.set(0.95, 1.1, -2.1);
  group.add(bellDome);

  // ---- Cathedral radio on counter (music source) ----
  const radio = makeCathedralRadio({ wood: 0x5a3a1a });
  radio.position.set(-0.85, 1.05, -2.05);
  group.add(radio);

  // ---- Menu board on wall behind counter ----
  const menuBoard = makeMenuBoard({
    title: 'MENU',
    items: menu,
    bgColor: 0x2a2418,
    textColor: '#f4ead5',
    frameColor: 0x3a2a1a,
    w: 1.2, h: 0.9
  });
  menuBoard.position.set(0, 2.1, -2.95);
  group.add(menuBoard);

  // ---- Seating: 3 wood tables with chrome-edge chairs ----
  const tablePositions = [
    [-1.8, 1.4],
    [1.8, 1.4],
    [0, 2.8]
  ];
  for (const [x, z] of tablePositions) {
    const table = makeTable({ topColor: 0x6b4a2b, legColor: 0x3a2a1a, w: 1.1, d: 0.7, h: 0.74 });
    table.position.set(x, 0, z);
    group.add(table);

    // tableware: mug + saucer + plate
    const mug = makeMug({ color: 0xe8dcc0 });
    mug.position.set(x - 0.15, 0.77, z);
    group.add(mug);
    const saucer = makeSaucer({ color: 0xe8dcc0 });
    saucer.position.set(x + 0.15, 0.755, z);
    group.add(saucer);
    const plate = makePlate({ color: 0xd8c8a8 });
    plate.position.set(x + 0.15, 0.755, z - 0.18);
    group.add(plate);

    // 2 chairs per table
    const chairA = makeChair({ seatColor: 0x8a6a4a, frameColor: 0x333333, metal: true });
    chairA.position.set(x, 0, z + 0.55);
    chairA.rotation.y = Math.PI;
    group.add(chairA);
    const chairB = makeChair({ seatColor: 0x8a6a4a, frameColor: 0x333333, metal: true });
    chairB.position.set(x, 0, z - 0.55);
    group.add(chairB);
  }

  // ---- Wall art & signage ----
  // Victory war-bond poster
  const poster = makeFrame({
    frameColor: 0x4a3a1a, artColor: 0x2a4a7a, w: 0.6, h: 0.85
  });
  poster.position.set(-3.45, 1.9, 0.6);
  poster.rotation.y = Math.PI / 2;
  group.add(poster);

  // Coca-Cola enamel sign
  const cokeSign = makeEnamelSign({
    text: 'Coca-Cola', subtitle: 'Drink', color: 0xcc2222, w: 0.7, h: 0.45
  });
  cokeSign.position.set(3.45, 2.1, 0.4);
  cokeSign.rotation.y = -Math.PI / 2;
  group.add(cokeSign);

  // "Welcome Home" bunting along the top of front wall
  const buntColors = [0xcc3333, 0xeeeeee, 0x3366cc];
  for (let i = 0; i < 9; i++) {
    const tri = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.22, 3),
      new THREE.MeshStandardMaterial({ color: buntColors[i % 3], roughness: 0.7 })
    );
    tri.castShadow = true;
    tri.position.set(-2.8 + i * 0.7, 3.0, -2.9);
    group.add(tri);
  }

  // Shelf with jars on side wall
  const shelf = makeShelf({ color: 0x4a3018, w: 1.2, d: 0.22 });
  shelf.position.set(-3.42, 1.4, -0.8);
  shelf.rotation.y = Math.PI / 2;
  group.add(shelf);
  for (let i = 0; i < 3; i++) {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0xaabbbf, roughness: 0.2, transparent: true, opacity: 0.6 })
    );
    jar.castShadow = true;
    jar.position.set(-3.38, 1.49, -1.2 + i * 0.32);
    group.add(jar);
  }

  // Wall clock
  const clock = makeWallClock({ color: 0xf0e8d0 });
  clock.position.set(0, 2.9, -2.92);
  group.add(clock);

  // ---- Lighting: bare incandescent pendant lamps ----
  const lampPositions = [
    [-1.8, 1.4], [1.8, 1.4], [0, 2.8], [0, -1.6]
  ];
  for (const [x, z] of lampPositions) {
    const lamp = makeLamp({ shadeColor: 0x5a4a2a, cordColor: 0x2a1a0a, emissive: 0xffaa44, r: 0.2, h: 1.2 });
    lamp.position.set(x, 3.4, z);
    lamp.rotation.x = Math.PI; // hang downward
    group.add(lamp);
  }

  // ---- Patrons ----
  // Patron 1: man in fedora + three-piece suit
  const patron1 = makePatron({
    skin: 0xc9956a, shirt: 0xf0f0f0, pants: 0x2a2a3a, hair: 0x2a1a10,
    hairStyle: 'fedora', jacket: 0x3a3a4a
  });
  patron1.position.set(-1.6, 0, 1.4);
  patron1.rotation.y = 0.6;
  group.add(patron1);

  // Patron 2: woman with victory-roll bun, period dress
  const patron2 = makePatron({
    skin: 0xe0b890, shirt: 0xaa4a6a, pants: 0x6a3a4a, hair: 0x3a2010,
    hairStyle: 'bun'
  });
  patron2.position.set(1.6, 0, 1.4);
  patron2.rotation.y = -0.6;
  group.add(patron2);

  // Patron 3 at counter: man in suit
  const patron3 = makePatron({
    skin: 0xb88860, shirt: 0xeeeeee, pants: 0x333344, hair: 0x1a1008,
    hairStyle: 'short'
  });
  patron3.position.set(-0.6, 0, -1.4);
  patron3.rotation.y = Math.PI;
  group.add(patron3);

  // ---- Hotspots (world positions relative to era group) ----
  const hotspots = [
    { id: 'music', position: [-0.85, 1.45, -2.05], radius: 0.6 },
    { id: 'menu', position: [0, 2.1, -2.9], radius: 0.7 },
    { id: 'counter', position: [0.7, 1.35, -2.0], radius: 0.6 },
    { id: 'equipment', position: [-0.4, 1.3, -2.2], radius: 0.6 },
    { id: 'patron', position: [-1.6, 1.2, 1.4], radius: 0.7 }
  ];

  return {
    id: '1945',
    year: 1945,
    label: 'Post-War',
    eraName: 'Post-War Austerity',
    palette,
    lighting: {
      ambient: 0xffcc88,
      ambientI: 0.5,
      key: 0xffb060,
      keyI: 1.6,
      fill: 0xffaa44,
      fillI: 0.5,
      exposure: 1.15
    },
    group,
    menu,
    hotspots,
    musicId: '1945',
    sfxType: 'percolator',
    hud: {
      cssVars: {
        '--era-primary': '#c8a464',
        '--era-accent': '#e9c46a',
        '--era-wood': '#6b4a2b',
        '--era-text': '#f4ead5',
        '--era-text-dim': 'rgba(244,234,213,0.62)',
        '--era-panel-bg': 'rgba(20,14,8,0.86)',
        '--era-panel-border': 'rgba(200,164,100,0.45)',
        '--era-track-from': '#8a6a3a',
        '--era-track-to': '#d8b46a'
      }
    }
  };
}
