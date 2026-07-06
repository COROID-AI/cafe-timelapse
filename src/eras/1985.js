/**
 * @file src/eras/1985.js
 * Era 1985 — Neon 80s.
 *
 * Pastel pink/teal booths, glass-top tables, arcade cabinet in corner, VHS
 * rental shelf, two-group espresso machine, cafe latte appears on menu
 * (latte $1.85, espresso $1.00, croissant $1.25), Trapper-Keeper style printed
 * menu, boombox on counter playing synth-pop/new wave, Brat Pack movie posters,
 * "Open Late" neon, fluorescent + neon combo lighting, patrons with big hair,
 * shoulder pads, leg warmers, Walkman with foam headphones, aviator glasses,
 * Members Only jacket.
 */
import * as THREE from 'three';
import {
  makeGlassTable, makeChair, makeBooth, makeTrackLight, makeShelf, makeFrame,
  makeMenuBoard, makeNeonSign, makeCounter, makeEspressoCup, makeCup, makeGlass,
  makePlate, makeWallClock, makeTwoGroupEspresso, makeBoombox, makeDigitalRegister,
  makeArcadeCabinet, makeVHSRack, makePatron
} from './era-builder.js';

/**
 * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
 */
export default function era1985() {
  const group = new THREE.Group();
  group.name = 'era-1985';

  const palette = {
    primary: 0xff4d9d,
    accent: 0x38e0d6,
    wood: 0x2b2b4a,
    metal: 0xc0c0d0,
    fabric: 0xff8fc7
  };

  // ---- Menu items (single-dollar items) ----
  const menu = [
    { name: 'Cafe Latte', price: '$1.85' },
    { name: 'Espresso', price: '$1.00' },
    { name: 'Cappuccino', price: '$1.50' },
    { name: 'Croissant', price: '$1.25' },
    { name: 'Muffin', price: '$1.10' }
  ];

  // ---- Counter + equipment ----
  const counter = makeCounter({ topColor: 0x2b2b4a, frontColor: 0x1a1a3a, w: 2.4, h: 1.05, d: 0.7 });
  counter.position.set(0, 0, -2.2);
  group.add(counter);

  // Two-group espresso machine
  const espresso = makeTwoGroupEspresso();
  espresso.position.set(-0.4, 1.05, -2.2);
  group.add(espresso);

  // Digital (fluorescent) register
  const register = makeDigitalRegister();
  register.position.set(0.75, 1.05, -2.0);
  group.add(register);

  // ---- Boombox on counter (music source) ----
  const boombox = makeBoombox();
  boombox.position.set(-0.9, 1.05, -2.05);
  group.add(boombox);

  // ---- Menu board (Trapper-Keeper style) ----
  const menuBoard = makeMenuBoard({
    title: 'MENU',
    items: menu,
    bgColor: 0x1a0a1a,
    textColor: '#38e0d6',
    frameColor: 0xff4d9d,
    w: 1.2, h: 0.9
  });
  menuBoard.position.set(0, 2.1, -2.95);
  group.add(menuBoard);

  // ---- Neon "OPEN LATE" sign on wall ----
  const neon = makeNeonSign({ text: 'OPEN LATE', color: 0xff4d9d, w: 1.0, h: 0.28 });
  neon.position.set(-2.0, 2.6, -2.92);
  group.add(neon);

  // Second neon accent
  const neon2 = makeNeonSign({ text: 'COFFEE', color: 0x38e0d6, w: 0.8, h: 0.24 });
  neon2.position.set(2.0, 2.6, -2.92);
  group.add(neon2);

  // ---- Seating: glass tables + pastel booths ----
  const tablePositions = [
    [-1.8, 1.4],
    [1.8, 1.4]
  ];
  for (const [x, z] of tablePositions) {
    const table = makeGlassTable({ frameColor: 0xc0c0d0, r: 0.42, h: 0.74 });
    table.position.set(x, 0, z);
    group.add(table);

    // latte cup
    const cup = makeCup({ color: 0xffffff });
    cup.position.set(x - 0.1, 0.77, z);
    group.add(cup);
    const plate = makePlate({ color: 0xff8fc7 });
    plate.position.set(x + 0.12, 0.755, z - 0.05);
    group.add(plate);

    // chairs (pastel)
    const chairA = makeChair({ seatColor: 0x38e0d6, frameColor: 0xc0c0d0, metal: true });
    chairA.position.set(x, 0, z + 0.55);
    chairA.rotation.y = Math.PI;
    group.add(chairA);
    const chairB = makeChair({ seatColor: 0xff4d9d, frameColor: 0xc0c0d0, metal: true });
    chairB.position.set(x, 0, z - 0.55);
    group.add(chairB);
  }

  // ---- Pastel booth on side wall ----
  const booth = makeBooth({ color: 0x38e0d6 });
  booth.position.set(-3.2, 0, 1.0);
  booth.rotation.y = Math.PI / 2;
  group.add(booth);
  const boothTable = makeGlassTable({ frameColor: 0xc0c0d0, r: 0.38, h: 0.72 });
  boothTable.position.set(-2.9, 0, 1.0);
  group.add(boothTable);

  // ---- Arcade cabinet in corner ----
  const arcade = makeArcadeCabinet();
  arcade.position.set(2.9, 0, -1.2);
  arcade.rotation.y = -Math.PI / 2 + 0.4;
  group.add(arcade);

  // ---- VHS rental shelf ----
  const vhs = makeVHSRack();
  vhs.position.set(-3.1, 0, -1.6);
  vhs.rotation.y = Math.PI / 2;
  group.add(vhs);

  // ---- Wall art: Brat Pack movie posters ----
  const moviePoster1 = makeFrame({ frameColor: 0xff4d9d, artColor: 0x2a4a6a, w: 0.65, h: 0.95 });
  moviePoster1.position.set(-3.45, 1.9, 0.0);
  moviePoster1.rotation.y = Math.PI / 2;
  group.add(moviePoster1);

  const moviePoster2 = makeFrame({ frameColor: 0x38e0d6, artColor: 0x8a2a4a, w: 0.65, h: 0.95 });
  moviePoster2.position.set(3.45, 1.9, 0.2);
  moviePoster2.rotation.y = -Math.PI / 2;
  group.add(moviePoster2);

  // Wall clock (digital-ish look via frame)
  const clock = makeWallClock({ color: 0x1a1a2a });
  clock.position.set(0, 2.9, -2.92);
  group.add(clock);

  // ---- Lighting: fluorescent ceiling grid + neon accents ----
  // fluorescent panel (emissive ceiling tile)
  for (let i = 0; i < 3; i++) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeeeeff, emissiveIntensity: 1.8 })
    );
    panel.rotation.x = Math.PI / 2;
    panel.position.set(-1.6 + i * 1.6, 3.48, -0.5);
    group.add(panel);
  }

  // ---- Patrons ----
  // Patron 1: big hair, shoulder pads, Walkman
  const patron1 = makePatron({
    skin: 0xe0b890, shirt: 0xff4d9d, pants: 0x2b2b4a, hair: 0x4a2a1a,
    hairStyle: 'bouffant', accessory: 'walkman', jacket: 0x38e0d6
  });
  patron1.position.set(-1.6, 0, 1.4);
  patron1.rotation.y = 0.6;
  group.add(patron1);

  // Patron 2: Members Only jacket, aviators
  const patron2 = makePatron({
    skin: 0xc9956a, shirt: 0xeeeeee, pants: 0x2a2a3a, hair: 0x1a0a04,
    hairStyle: 'short', accessory: 'glasses', jacket: 0x4a4a5a
  });
  patron2.position.set(1.6, 0, 1.6);
  patron2.rotation.y = -0.6;
  group.add(patron2);

  // Patron 3 at counter: leg warmers, big hair
  const patron3 = makePatron({
    skin: 0xd8a878, shirt: 0x38e0d6, pants: 0xff8fc7, hair: 0x3a2010,
    hairStyle: 'bouffant'
  });
  patron3.position.set(-0.5, 0, -1.4);
  patron3.rotation.y = Math.PI;
  group.add(patron3);

  // ---- Hotspots ----
  const hotspots = [
    { id: 'music', position: [-0.9, 1.3, -2.05], radius: 0.6 },
    { id: 'menu', position: [0, 2.1, -2.9], radius: 0.7 },
    { id: 'counter', position: [0.75, 1.2, -2.0], radius: 0.6 },
    { id: 'equipment', position: [-0.4, 1.3, -2.2], radius: 0.6 },
    { id: 'patron', position: [1.6, 1.2, 1.6], radius: 0.7 }
  ];

  return {
    id: '1985',
    year: 1985,
    label: 'Neon 80s',
    eraName: 'Neon Eighties',
    palette,
    lighting: {
      ambient: 0xccddff,
      ambientI: 0.6,
      key: 0xeef0ff,
      keyI: 1.4,
      fill: 0xff4d9d,
      fillI: 0.5,
      exposure: 1.0
    },
    group,
    menu,
    hotspots,
    musicId: '1985',
    sfxType: 'steam',
    hud: {
      cssVars: {
        '--era-primary': '#ff4d9d',
        '--era-accent': '#38e0d6',
        '--era-wood': '#2b2b4a',
        '--era-text': '#f0f4ff',
        '--era-text-dim': 'rgba(240,244,255,0.66)',
        '--era-panel-bg': 'rgba(12,8,26,0.86)',
        '--era-panel-border': 'rgba(255,77,157,0.5)',
        '--era-track-from': '#6a3acf',
        '--era-track-to': '#ff4d9d'
      }
    }
  };
}
