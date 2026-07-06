/**
 * @file src/eras/1965.js
 * Era 1965 — Mid-century modern.
 *
 * Tulip tables (Saarinen style), egg/pod chairs, Naugahyde banquette booths,
 * first-generation Faema-style lever espresso machine, drip coffee brewer,
 * printed menu with cents (espresso 25¢, cappuccino 35¢, BLT 65¢), adding-
 * machine cash register, jukebox (Wurlitzer 1015) playing Motown/British
 * Invasion, pop-art and travel posters, track lighting, patrons in mod fashion
 * (miniskirts, suits, go-go boots, bouffant hair, thick-rimmed glasses).
 */
import * as THREE from 'three';
import {
  makeTulipTable, makeEggChair, makeBooth, makeLamp, makeShelf, makeFrame,
  makeMenuBoard, makeCounter, makeEspressoCup, makeCup, makeSaucer, makePlate,
  makeWallClock, makeLeverEspresso, makeJukebox, makeAddingRegister
} from './era-builder.js';

/**
 * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
 */
export default function era1965() {
  const group = new THREE.Group();
  group.name = 'era-1965';

  const palette = {
    primary: 0xd98a3d,
    accent: 0x6ec1c4,
    wood: 0xa9602b,
    metal: 0xc8c8c8,
    fabric: 0xb73a3a
  };

  // ---- Menu items (cents-to-low-dollars) ----
  const menu = [
    { name: 'Espresso', price: '25¢' },
    { name: 'Cappuccino', price: '35¢' },
    { name: 'Coffee', price: '15¢' },
    { name: 'BLT', price: '65¢' },
    { name: 'Cheesecake', price: '40¢' }
  ];

  // ---- Counter + equipment ----
  const counter = makeCounter({ topColor: 0xa9602b, frontColor: 0x8a4a1a, w: 2.4, h: 1.05, d: 0.7 });
  counter.position.set(0, 0, -2.2);
  group.add(counter);

  // Lever espresso machine on counter
  const espresso = makeLeverEspresso();
  espresso.position.set(-0.4, 1.05, -2.2);
  group.add(espresso);

  // Adding-machine register
  const register = makeAddingRegister();
  register.position.set(0.75, 1.05, -2.0);
  group.add(register);

  // ---- Jukebox (music source) — against side wall, near counter ----
  const jukebox = makeJukebox();
  jukebox.position.set(2.6, 0, -1.8);
  jukebox.rotation.y = -Math.PI / 2 + 0.3;
  group.add(jukebox);

  // ---- Menu board on wall behind counter ----
  const menuBoard = makeMenuBoard({
    title: 'MENU',
    items: menu,
    bgColor: 0x2a1a10,
    textColor: '#fdf0e0',
    frameColor: 0x8a4a1a,
    w: 1.2, h: 0.9
  });
  menuBoard.position.set(0, 2.1, -2.95);
  group.add(menuBoard);

  // ---- Seating: tulip tables + egg chairs ----
  const tablePositions = [
    [-1.8, 1.4],
    [0, 2.8]
  ];
  for (const [x, z] of tablePositions) {
    const table = makeTulipTable({ topColor: 0xf0f0f0, stemColor: 0xe8e8e8, r: 0.45, h: 0.74 });
    table.position.set(x, 0, z);
    group.add(table);

    // espresso cups + saucers
    const cup = makeEspressoCup({ color: 0xffffff });
    cup.position.set(x - 0.1, 0.755, z);
    group.add(cup);
    const saucer = makeSaucer({ color: 0xffffff });
    saucer.position.set(x - 0.1, 0.745, z);
    group.add(saucer);

    // egg chairs
    const chairA = makeEggChair({ color: 0xb73a3a });
    chairA.position.set(x, 0, z + 0.7);
    chairA.rotation.y = Math.PI;
    group.add(chairA);
    const chairB = makeEggChair({ color: 0x6ec1c4 });
    chairB.position.set(x, 0, z - 0.7);
    group.add(chairB);
  }

  // ---- Banquette booth on side wall ----
  const booth = makeBooth({ color: 0x8a3a3a });
  booth.position.set(-3.2, 0, 1.0);
  booth.rotation.y = Math.PI / 2;
  group.add(booth);
  // booth table
  const boothTable = makeTulipTable({ topColor: 0xa9602b, r: 0.4, h: 0.72 });
  boothTable.position.set(-2.9, 0, 1.0);
  group.add(boothTable);

  // ---- Wall art: pop-art + travel posters ----
  const popArt = makeFrame({ frameColor: 0xe8e8e8, artColor: 0xe8445a, w: 0.7, h: 0.7 });
  popArt.position.set(-3.45, 2.0, 0.0);
  popArt.rotation.y = Math.PI / 2;
  group.add(popArt);

  const travelPoster = makeFrame({ frameColor: 0xe8e8e8, artColor: 0x3a6ec9, w: 0.6, h: 0.85 });
  travelPoster.position.set(3.45, 2.0, -0.4);
  travelPoster.rotation.y = -Math.PI / 2;
  group.add(travelPoster);

  // Shelf
  const shelf = makeShelf({ color: 0xa9602b, w: 1.2, d: 0.22 });
  shelf.position.set(-3.42, 1.3, -1.2);
  shelf.rotation.y = Math.PI / 2;
  group.add(shelf);
  // records on shelf
  for (let i = 0; i < 4; i++) {
    const record = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.005, 24),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 })
    );
    record.castShadow = true;
    record.position.set(-3.38, 1.34, -1.45 + i * 0.1);
    record.rotation.x = Math.PI / 2;
    group.add(record);
  }

  // Wall clock
  const clock = makeWallClock({ color: 0xf0f0e0 });
  clock.position.set(0, 2.9, -2.92);
  group.add(clock);

  // ---- Lighting: pendant lamps (space-age sputnik style) ----
  const lampPositions = [
    [-1.8, 1.4], [0, 2.8], [0, -1.6], [2.0, 0.2]
  ];
  for (const [x, z] of lampPositions) {
    const lamp = makeLamp({ shadeColor: 0xd98a3d, cordColor: 0x333333, emissive: 0xffcc66, r: 0.18, h: 1.2 });
    lamp.position.set(x, 3.4, z);
    lamp.rotation.x = Math.PI;
    group.add(lamp);
  }

  // ---- Patrons ----
  // Patron 1: mod woman — bouffant hair, miniskirt, go-go boots
  const patron1 = makePatron({
    skin: 0xe0b890, shirt: 0xffdd44, pants: 0xffffff, hair: 0x2a1a10,
    hairStyle: 'bouffant', accessory: 'glasses'
  });
  patron1.position.set(-1.6, 0, 1.4);
  patron1.rotation.y = 0.6;
  group.add(patron1);

  // Patron 2: man in slim suit, thick-rimmed glasses
  const patron2 = makePatron({
    skin: 0xc9956a, shirt: 0x2a2a2a, pants: 0x1a1a2a, hair: 0x1a0a04,
    hairStyle: 'short', accessory: 'glasses', jacket: 0x4a4a5a
  });
  patron2.position.set(1.6, 0, 1.6);
  patron2.rotation.y = -0.6;
  group.add(patron2);

  // Patron 3 at counter
  const patron3 = makePatron({
    skin: 0xb88860, shirt: 0x6ec1c4, pants: 0x2a3a4a, hair: 0x3a2010,
    hairStyle: 'long'
  });
  patron3.position.set(-0.5, 0, -1.4);
  patron3.rotation.y = Math.PI;
  group.add(patron3);

  // ---- Hotspots ----
  const hotspots = [
    { id: 'music', position: [2.6, 0.8, -1.8], radius: 0.8 },
    { id: 'menu', position: [0, 2.1, -2.9], radius: 0.7 },
    { id: 'counter', position: [0.75, 1.25, -2.0], radius: 0.6 },
    { id: 'equipment', position: [-0.4, 1.3, -2.2], radius: 0.6 },
    { id: 'patron', position: [1.6, 1.2, 1.6], radius: 0.7 }
  ];

  return {
    id: '1965',
    year: 1965,
    label: 'Mid-Century',
    eraName: 'Mid-Century Modern',
    palette,
    lighting: {
      ambient: 0xffd9a0,
      ambientI: 0.55,
      key: 0xffc070,
      keyI: 1.5,
      fill: 0x6ec1c4,
      fillI: 0.4,
      exposure: 1.1
    },
    group,
    menu,
    hotspots,
    musicId: '1965',
    sfxType: 'steam',
    hud: {
      cssVars: {
        '--era-primary': '#d98a3d',
        '--era-accent': '#6ec1c4',
        '--era-wood': '#a9602b',
        '--era-text': '#fdf0e0',
        '--era-text-dim': 'rgba(253,240,224,0.64)',
        '--era-panel-bg': 'rgba(28,18,10,0.84)',
        '--era-panel-border': 'rgba(217,138,61,0.45)',
        '--era-track-from': '#b5722f',
        '--era-track-to': '#e7a44a'
      }
    }
  };
}
