/**
 * @file src/eras/2005.js
 * Era 2005 — Third-wave minimalist.
 *
 * Exposed-brick and reclaimed-wood communal tables, brushed-steel Tolix chairs,
 * pour-over station (Hario V60 / Chemex tower), commercial two-group espresso +
 * Mazzer grinder, cafe with single-origin beans and prices in dollars
 * (latte $3.50, pour-over $4.00, scone $2.75), flat-screen TV muted, early
 * PDF/laminated menu, iPod dock + small bookshelf of CDs, "Free Wi-Fi" sign,
 * track + Edison-bulb lighting, patrons on early MacBook/ThinkPad, iPod earbuds,
 * polo shirts, messenger bags.
 */
import * as THREE from 'three';
import {
  makeCommunalTable, makeTolixChair, makeShelf, makeFrame, makeMenuBoard,
  makeEnamelSign, makeCounter, makeCup, makeGlass, makePlate, makeWallClock,
  makeCommercialEspresso, makeGrinder, makePourOverTower, makeIpodDock,
  makeFlatPOS, makeCDShelf, makeEdisonPendant, makeTrackLight, makePatron
} from './era-builder.js';

/**
 * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
 */
export default function era2005() {
  const group = new THREE.Group();
  group.name = 'era-2005';

  const palette = {
    primary: 0x9aa7b3,
    accent: 0xc47a3c,
    wood: 0x7a5230,
    metal: 0xc9d4dc,
    fabric: 0x6a727a
  };

  // ---- Menu items (low single digits) ----
  const menu = [
    { name: 'Latte', price: '$3.50' },
    { name: 'Pour-Over', price: '$4.00' },
    { name: 'Cappuccino', price: '$3.25' },
    { name: 'Scone', price: '$2.75' },
    { name: 'Croissant', price: '$2.50' }
  ];

  // ---- Counter + equipment ----
  const counter = makeCounter({ topColor: 0x3a3a3a, frontColor: 0x2a2a2a, w: 2.4, h: 1.05, d: 0.7 });
  counter.position.set(0, 0, -2.2);
  group.add(counter);

  // Commercial espresso + grinder
  const espresso = makeCommercialEspresso();
  espresso.position.set(-0.3, 1.05, -2.25);
  group.add(espresso);
  const grinder = makeGrinder();
  grinder.position.set(-0.62, 1.05, -2.1);
  group.add(grinder);

  // Pour-over tower
  const pourOver = makePourOverTower();
  pourOver.position.set(0.5, 1.05, -2.15);
  group.add(pourOver);

  // Flat-screen POS
  const pos = makeFlatPOS();
  pos.position.set(0.9, 1.05, -2.0);
  group.add(pos);

  // ---- iPod dock (music source) on counter ----
  const ipodDock = makeIpodDock();
  ipodDock.position.set(-0.95, 1.05, -2.0);
  group.add(ipodDock);

  // ---- Menu board (laminated / minimal) ----
  const menuBoard = makeMenuBoard({
    title: 'MENU',
    items: menu,
    bgColor: 0x1a1a18,
    textColor: '#eef2f5',
    frameColor: 0x7a5230,
    w: 1.2, h: 0.9
  });
  menuBoard.position.set(0, 2.1, -2.95);
  group.add(menuBoard);

  // ---- "Free Wi-Fi" sign ----
  const wifiSign = makeEnamelSign({
    text: 'Free Wi-Fi', subtitle: 'ask barista', color: 0x2a8a4a, w: 0.7, h: 0.4
  });
  wifiSign.position.set(-2.0, 2.4, -2.92);
  group.add(wifiSign);

  // ---- Communal table center ----
  const communal = makeCommunalTable({ topColor: 0x7a5230, w: 2.4, d: 0.9, h: 0.76 });
  communal.position.set(0, 0, 1.6);
  group.add(communal);

  // tableware on communal
  const cup1 = makeCup({ color: 0xf5f0e8 });
  cup1.position.set(-0.5, 0.79, 1.6);
  group.add(cup1);
  const cup2 = makeCup({ color: 0xf5f0e8 });
  cup2.position.set(0.4, 0.79, 1.5);
  group.add(cup2);
  const plate1 = makePlate({ color: 0xe0e0e0 });
  plate1.position.set(-0.2, 0.775, 1.9);
  group.add(plate1);

  // Tolix chairs around communal table
  for (const [x, z, ry] of [
    [-0.7, 2.2, Math.PI], [0.7, 2.2, Math.PI],
    [-0.7, 1.0, 0], [0.7, 1.0, 0]
  ]) {
    const chair = makeTolixChair({ color: 0x9aa7b3 });
    chair.position.set(x, 0, z);
    chair.rotation.y = ry;
    group.add(chair);
  }

  // ---- Small bistro table near window ----
  const bistro = makeCommunalTable({ topColor: 0x7a5230, w: 0.9, d: 0.7, h: 0.74 });
  bistro.position.set(-2.4, 0, 0.6);
  group.add(bistro);
  const chairB = makeTolixChair({ color: 0x6a727a });
  chairB.position.set(-2.4, 0, 1.15);
  chairB.rotation.y = Math.PI;
  group.add(chairB);

  // ---- CD shelf on side wall ----
  const cdShelf = makeCDShelf();
  cdShelf.position.set(-3.2, 0, -0.8);
  cdShelf.rotation.y = Math.PI / 2;
  group.add(cdShelf);

  // ---- Wall art: minimal framed prints ----
  const art1 = makeFrame({ frameColor: 0x7a5230, artColor: 0xdcdcdc, w: 0.7, h: 0.5 });
  art1.position.set(3.45, 2.0, 0.0);
  art1.rotation.y = -Math.PI / 2;
  group.add(art1);

  const art2 = makeFrame({ frameColor: 0x7a5230, artColor: 0xb8b8b8, w: 0.5, h: 0.7 });
  art2.position.set(3.45, 1.8, -1.2);
  art2.rotation.y = -Math.PI / 2;
  group.add(art2);

  // Wall clock
  const clock = makeWallClock({ color: 0xeeeeee });
  clock.position.set(0, 2.9, -2.92);
  group.add(clock);

  // ---- Lighting: Edison pendants + track lights ----
  const pendantPositions = [
    [-0.7, 1.6], [0.7, 1.6], [0, -1.6]
  ];
  for (const [x, z] of pendantPositions) {
    const pendant = makeEdisonPendant({ h: 1.2 });
    pendant.position.set(x, 3.4, z);
    group.add(pendant);
  }

  // ---- Patrons ----
  // Patron 1: early laptop user, polo shirt
  const patron1 = makePatron({
    skin: 0xc9956a, shirt: 0x4a6a8a, pants: 0x2a2a3a, hair: 0x2a1a10,
    hairStyle: 'short'
  });
  patron1.position.set(-0.6, 0, 1.8);
  patron1.rotation.y = Math.PI + 0.2;
  group.add(patron1);
  // laptop
  const laptop = new THREE.Group();
  const lBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.02, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.5 })
  );
  lBase.castShadow = true;
  laptop.add(lBase);
  const lScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.18, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 })
  );
  lScreen.position.set(0, 0.1, -0.09);
  lScreen.rotation.x = -0.3;
  laptop.add(lScreen);
  const lDisp = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x224466, emissive: 0x4488bb, emissiveIntensity: 0.4 })
  );
  lDisp.position.set(0, 0.1, -0.082);
  lDisp.rotation.x = -0.3;
  laptop.add(lDisp);
  laptop.position.set(-0.6, 0.77, 1.6);
  group.add(laptop);

  // Patron 2: messenger bag, iPod earbuds
  const patron2 = makePatron({
    skin: 0xe0b890, shirt: 0x6a7a5a, pants: 0x4a4a3a, hair: 0x3a2010,
    hairStyle: 'short', jacket: 0x5a5a4a
  });
  patron2.position.set(0.6, 0, 1.4);
  patron2.rotation.y = -0.8;
  group.add(patron2);

  // Patron 3 at counter
  const patron3 = makePatron({
    skin: 0xd8a878, shirt: 0x9aa7b3, pants: 0x3a3a4a, hair: 0x1a1008,
    hairStyle: 'buzz'
  });
  patron3.position.set(-0.5, 0, -1.4);
  patron3.rotation.y = Math.PI;
  group.add(patron3);

  // ---- Hotspots ----
  const hotspots = [
    { id: 'music', position: [-0.95, 1.2, -2.0], radius: 0.6 },
    { id: 'menu', position: [0, 2.1, -2.9], radius: 0.7 },
    { id: 'counter', position: [0.9, 1.3, -2.0], radius: 0.6 },
    { id: 'equipment', position: [-0.3, 1.35, -2.25], radius: 0.6 },
    { id: 'patron', position: [0.6, 1.2, 1.4], radius: 0.7 }
  ];

  return {
    id: '2005',
    year: 2005,
    label: 'Third Wave',
    eraName: 'Third-Wave Minimalist',
    palette,
    lighting: {
      ambient: 0xffe8c8,
      ambientI: 0.5,
      key: 0xffd8a0,
      keyI: 1.5,
      fill: 0xcce0ff,
      fillI: 0.4,
      exposure: 1.05
    },
    group,
    menu,
    hotspots,
    musicId: '2005',
    sfxType: 'steam',
    hud: {
      cssVars: {
        '--era-primary': '#9aa7b3',
        '--era-accent': '#c47a3c',
        '--era-wood': '#7a5230',
        '--era-text': '#eef2f5',
        '--era-text-dim': 'rgba(238,242,245,0.62)',
        '--era-panel-bg': 'rgba(18,18,20,0.84)',
        '--era-panel-border': 'rgba(154,167,179,0.45)',
        '--era-track-from': '#6a727a',
        '--era-track-to': '#c9d4dc'
      }
    }
  };
}
