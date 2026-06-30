/**
 * 2025 era asset configuration — Contemporary Café.
 *
 * Builds the procedural Three.js Group for the most modern stop on the
 * timeline. Every README category is represented:
 *
 *   - Furniture & decor ....... minimalist tables, molded chairs, geometric planters
 *   - Coffee machine ......... smart / app-connected espresso machine w/ touchscreen
 *   - Menu board & prices .... digital menu board (CanvasTexture) with 2025 prices
 *   - Music source ........... smart speaker + phone on a wireless charging stand
 *   - Posters ................ modern minimalist framed posters
 *   - Tableware .............. matte ceramic cups, laptops, phone on table
 *   - Signage & lighting ..... LED neon-style sign + ceiling LED light strips
 *   - Counter technology ..... contactless payment terminal (glowing pad)
 *   - Patrons ................ 2020s figures (neutral clothes, phones, smartwatch)
 *
 * Registered with PeriodManager via `build2025Era(ctx)` returning a THREE.Group.
 * All props use opacity-aware MeshStandardMaterial so the PeriodManager
 * cross-fade transition reads cleanly.
 */
import * as THREE from 'three';

// Fallbacks mirror main.js CAFE_DIMENSIONS in case ctx is not yet populated
// at initial-mount time (window.Cafe bridge is assigned late in main.js).
const DIMENSIONS_FALLBACK = { width: 12, depth: 10, height: 3.5 };

/** Era metadata consumed by info panels / audio manager. */
export const PERIOD_2025_META = {
  year: 2025,
  name: 'Contemporary Café',
  music: 'Phone / smart-speaker streaming',
  counterTech: 'Contactless payment terminal',
  menu: [
    'Flat White',
    'Oat Milk Latte',
    'Cold Brew',
    'Matcha Latte',
    'Espresso',
    'Avocado Toast',
  ],
  prices: {
    'Flat White': 5.5,
    'Oat Milk Latte': 6.0,
    'Cold Brew': 5.75,
    'Matcha Latte': 6.25,
    Espresso: 4.5,
    'Avocado Toast': 12.0,
  },
};

// ---------------------------------------------------------------------------
// Material helpers
// ---------------------------------------------------------------------------

function standard(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.6,
    metalness: opts.metalness ?? 0.0,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

/**
 * Draw text/art onto an offscreen canvas and return a CanvasTexture.
 * @param {number} width
 * @param {number} height
 * @param {(ctx2d: CanvasRenderingContext2D, w: number, h: number) => void} drawFn
 */
function makeCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx2d = canvas.getContext('2d');
  drawFn(ctx2d, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ---------------------------------------------------------------------------
// 1. Contemporary furniture & decor
// ---------------------------------------------------------------------------

/** A single modern round table on a slender pedestal. */
function makeTable(x, z, radius = 0.62) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const topMat = standard(0xeaeae6, { roughness: 0.35, metalness: 0.05 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.05, 32), topMat);
  top.position.y = 0.74;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Slim central pedestal
  const pedestalMat = standard(0x2b2b30, { roughness: 0.3, metalness: 0.8 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.72, 16), pedestalMat);
  pedestal.position.y = 0.36;
  pedestal.castShadow = true;
  group.add(pedestal);

  // Round base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 24), pedestalMat);
  base.position.y = 0.015;
  base.castShadow = true;
  group.add(base);

  group.name = 'Table-2025';
  return group;
}

/** A modern molded-seat cafe chair (Eames-inspired) on slim metal legs. */
function makeChair(color = 0xb5c7a6) {
  const group = new THREE.Group();

  const seatMat = standard(color, { roughness: 0.5 });
  const legMat = standard(0x33333a, { roughness: 0.3, metalness: 0.7 });

  // Molded shell seat (slightly curved via scaled sphere segment)
  const seat = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.6), seatMat);
  seat.scale.set(1, 0.55, 1);
  seat.position.y = 0.48;
  seat.rotation.x = -0.12;
  seat.castShadow = true;
  group.add(seat);

  // Four slim splayed legs
  const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.48, 8);
  const legPositions = [
    [0.2, 0.0, 0.2],
    [-0.2, 0.0, 0.2],
    [0.2, 0.0, -0.2],
    [-0.2, 0.0, -0.2],
  ];
  for (const [lx, , lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, 0.24, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  group.name = 'Chair-2025';
  return group;
}

/** Minimalist geometric planter with a low-maintenance plant (decor). */
function makePlanter(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const potMat = standard(0xd9cfbf, { roughness: 0.8 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 6), potMat);
  pot.position.y = 0.14;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // Foliage clusters (succulent-like)
  const leafMat = standard(0x4f6f52, { roughness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), leafMat);
    const a = (i / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.05, 0.36, Math.sin(a) * 0.05);
    leaf.rotation.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
    leaf.castShadow = true;
    group.add(leaf);
  }

  group.name = 'Planter-2025';
  return group;
}

function buildFurniture() {
  const group = new THREE.Group();
  group.name = 'Furniture-2025';

  const setups = [
    { x: -3, z: -0.4 },
    { x: 2.6, z: 1.0 },
    { x: -0.5, z: 2.9 },
  ];

  for (const { x, z } of setups) {
    group.add(makeTable(x, z));
    group.add(makeChair(0xb5c7a6));
    group.add(makeChair(0xc98f6a));
    // Position chairs around each table
    group.children.at(-2).position.set(x + 0.0, z + 0.6);
    group.children.at(-1).position.set(x + 0.0, z - 0.6);
    group.children.at(-1).rotation.y = Math.PI;
  }

  group.add(makePlanter(4.6, -2.2));
  group.add(makePlanter(-4.6, -2.2));
  return group;
}

// ---------------------------------------------------------------------------
// 2. Smart / app-connected espresso machine
// ---------------------------------------------------------------------------

function buildEspressoMachine(counterTop, counterX, counterZ) {
  const group = new THREE.Group();
  group.position.set(counterX, counterTop, counterZ);
  group.name = 'EspressoMachine-2025';

  const steel = standard(0xcfd2d6, { roughness: 0.25, metalness: 0.9 });
  const dark = standard(0x1c1c20, { roughness: 0.4, metalness: 0.5 });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.5), steel);
  body.position.y = 0.3;
  body.castShadow = true;
  group.add(body);

  // Rounded top cup-warming tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.04, 0.46), steel);
  tray.position.y = 0.6;
  group.add(tray);

  // Glowing touchscreen display (front face) — "app-connected" smart UI
  const screenTex = makeCanvasTexture(256, 128, (c, w, h) => {
    c.fillStyle = '#0a1018';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#36e0c8';
    c.font = 'bold 30px system-ui, sans-serif';
    c.fillText('SMART BREW', 16, 42);
    c.fillStyle = '#9fb4c8';
    c.font = '20px system-ui, sans-serif';
    c.fillText('Oat · 92°C', 16, 74);
    c.fillText('App linked', 16, 100);
    c.fillStyle = '#36e0c8';
    c.beginPath();
    c.arc(w - 40, 64, 26, 0, Math.PI * 2);
    c.stroke();
  });
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0x0a2a33,
    emissiveMap: screenTex,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), screenMat);
  screen.position.set(0, 0.34, 0.251);
  group.add(screen);

  // Portafilter / group head
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 16), steel);
  head.position.set(-0.16, 0.12, 0.27);
  group.add(head);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), dark);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-0.16, 0.12, 0.42);
  group.add(handle);

  // Steam wand
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), steel);
  wand.rotation.x = 0.5;
  wand.position.set(0.26, 0.45, 0.18);
  group.add(wand);

  // Status LED ring (app-connected indicator)
  const led = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.012, 12, 24),
    new THREE.MeshStandardMaterial({
      color: 0x36e0c8,
      emissive: 0x36e0c8,
      emissiveIntensity: 1.4,
    })
  );
  led.position.set(0.24, 0.5, 0.252);
  group.add(led);

  return group;
}

// ---------------------------------------------------------------------------
// 3. Digital menu board with 2025 prices
// ---------------------------------------------------------------------------

function buildDigitalMenuBoard(backWallZ) {
  const group = new THREE.Group();
  group.name = 'DigitalMenuBoard-2025';

  const menuTex = makeCanvasTexture(512, 320, (c, w, h) => {
    c.fillStyle = '#0d1117';
    c.fillRect(0, 0, w, h);
    // Header
    c.fillStyle = '#ffffff';
    c.font = 'bold 40px system-ui, sans-serif';
    c.fillText('☕ MENU', 24, 52);
    c.fillStyle = '#7ee0c4';
    c.fillRect(24, 66, w - 48, 3);

    const items = [
      ['Flat White', '$5.50'],
      ['Oat Milk Latte', '$6.00'],
      ['Cold Brew', '$5.75'],
      ['Matcha Latte', '$6.25'],
      ['Espresso', '$4.50'],
      ['Avocado Toast', '$12.00'],
    ];
    c.font = '28px system-ui, sans-serif';
    items.forEach((row, i) => {
      const y = 120 + i * 34;
      c.fillStyle = '#e6edf3';
      c.fillText(row[0], 28, y);
      c.fillStyle = '#ffd166';
      const priceW = c.measureText(row[1]).width;
      c.fillText(row[1], w - 28 - priceW, y);
    });
  });

  const screenMat = new THREE.MeshStandardMaterial({
    map: menuTex,
    emissive: 0xffffff,
    emissiveMap: menuTex,
    emissiveIntensity: 0.7,
    roughness: 0.35,
  });
  // Bezel
  const bezelMat = standard(0x101216, { roughness: 0.5, metalness: 0.6 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.08, 0.05), bezelMat);
  group.add(bezel);
  // Screen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), screenMat);
  screen.position.z = 0.03;
  group.add(screen);

  // Mount above the counter on the back wall
  group.position.set(0, 2.55, backWallZ + 0.06);
  return group;
}

// ---------------------------------------------------------------------------
// 4. Music source — smart speaker + phone on wireless charging stand
// ---------------------------------------------------------------------------

function buildSmartSpeaker(x, z, surfaceY) {
  const group = new THREE.Group();
  group.position.set(x, surfaceY, z);
  group.name = 'SmartSpeaker-2025';

  // Fabric body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.09, 0.17, 24),
    standard(0x3a3a40, { roughness: 0.9 })
  );
  body.position.y = 0.085;
  body.castShadow = true;
  group.add(body);

  // Glowing LED ring on top (voice assistant indicator)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.012, 12, 28),
    new THREE.MeshStandardMaterial({
      color: 0x36a0ff,
      emissive: 0x36a0ff,
      emissiveIntensity: 1.6,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  group.add(ring);

  return group;
}

function buildPhoneStand(x, z, surfaceY) {
  const group = new THREE.Group();
  group.position.set(x, surfaceY, z);
  group.name = 'PhoneStand-2025';

  // Wireless charging base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.015, 20),
    standard(0x141418, { roughness: 0.4, metalness: 0.5 })
  );
  base.position.y = 0.0075;
  group.add(base);

  // Phone (thin slab), tilted on a stand
  const phoneMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.25,
    metalness: 0.6,
  });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.008), phoneMat);
  phone.position.set(0, 0.1, 0.02);
  phone.rotation.x = -0.32;
  group.add(phone);

  // Glowing screen face
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x9fd0ff,
    emissive: 0x9fd0ff,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.14), screenMat);
  screen.position.set(0, 0.1, 0.0265);
  screen.rotation.x = -0.32;
  group.add(screen);

  return group;
}

// ---------------------------------------------------------------------------
// 5. Modern minimalist posters
// ---------------------------------------------------------------------------

function buildModernPosters(sideWallX, height) {
  const group = new THREE.Group();
  group.name = 'Posters-2025';

  const designs = [
    { bg: '#f4f1ea', accent: '#d98b4a' },
    { bg: '#26415a', accent: '#9fd0ff' },
  ];

  designs.forEach((d, i) => {
    const tex = makeCanvasTexture(256, 384, (c, w, h) => {
      c.fillStyle = d.bg;
      c.fillRect(0, 0, w, h);
      // Abstract minimalist circles
      c.fillStyle = d.accent;
      c.beginPath();
      c.arc(w / 2, h * 0.4, 90, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = d.bg;
      c.beginPath();
      c.arc(w / 2 + 40, h * 0.4, 70, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#222';
      c.font = 'bold 26px system-ui, sans-serif';
      c.fillText('SLOW COFFEE', 30, h - 40);
    });
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
    const frameMat = standard(0x2a2a2e, { roughness: 0.5, metalness: 0.3 });

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.06, 0.04), frameMat);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 1.0), mat);
    art.position.z = 0.022;

    const poster = new THREE.Group();
    poster.add(frame, art);

    // Mount on side wall; alternate height
    const dir = Math.sign(sideWallX);
    poster.position.set(sideWallX - dir * 0.04, height * (0.5 + i * 0.28), -1.5 + i * 3.2);
    poster.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(poster);
  });

  return group;
}

// ---------------------------------------------------------------------------
// 6. Contemporary tableware (placed on tables)
// ---------------------------------------------------------------------------

function buildTableware() {
  const group = new THREE.Group();
  group.name = 'Tableware-2025';

  // Matte ceramic cup helper
  const makeCup = (color) => {
    const cup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.038, 0.085, 20),
      standard(color, { roughness: 0.45 })
    );
    body.position.y = 0.0425;
    cup.add(body);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI),
      standard(color, { roughness: 0.45 })
    );
    handle.position.set(0.045, 0.045, 0);
    handle.rotation.y = Math.PI / 2;
    cup.add(handle);
    return cup;
  };

  const tablePositions = [
    { x: -3, z: -0.4 },
    { x: 2.6, z: 1.0 },
    { x: -0.5, z: 2.9 },
  ];

  tablePositions.forEach((p, i) => {
    const cup = makeCup(i % 2 === 0 ? 0xf3f1ec : 0x2c2c30);
    cup.position.set(p.x - 0.12, 0.77, p.z + 0.05);
    group.add(cup);

    // A laptop on one table (very 2020s café)
    if (i === 1) {
      const laptopGroup = buildLaptop();
      laptopGroup.position.set(p.x + 0.12, 0.77, p.z - 0.05);
      group.add(laptopGroup);
    }

    // A phone resting flat on another table
    if (i === 2) {
      const phone = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.006, 0.16),
        standard(0x0a0a0a, { roughness: 0.3, metalness: 0.6 })
      );
      phone.position.set(p.x + 0.14, 0.775, p.z);
      group.add(phone);
    }
  });

  return group;
}

/** Open laptop with a glowing screen. */
function buildLaptop() {
  const lap = new THREE.Group();
  const alu = standard(0xb9bcc0, { roughness: 0.3, metalness: 0.7 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.21), alu);
  base.position.y = 0.006;
  lap.add(base);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.012), alu);
  lid.position.set(0, 0.106, -0.099);
  lid.rotation.x = -0.2;
  lap.add(lid);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xbfe3ff,
    emissive: 0xbfe3ff,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.18), screenMat);
  screen.position.set(0, 0.106, -0.093);
  screen.rotation.x = -0.2;
  lap.add(screen);
  return lap;
}

// ---------------------------------------------------------------------------
// 7. LED signage + ceiling light strips
// ---------------------------------------------------------------------------

function buildLEDSignage(backWallZ, height) {
  const group = new THREE.Group();
  group.name = 'LEDSignage-2025';

  // Neon-style "OPEN" LED sign built from tube segments (glowing)
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xff5d8f,
    emissive: 0xff5d8f,
    emissiveIntensity: 1.8,
  });
  const tubeGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 10);

  // Two horizontal glowing bars + framing to suggest a minimalist LED sign
  const bar1 = new THREE.Mesh(tubeGeo, tubeMat);
  bar1.rotation.z = Math.PI / 2;
  bar1.scale.x = 0.9;
  bar1.position.set(0, height - 0.45, backWallZ + 0.05);
  group.add(bar1);

  const bar2 = bar1.clone();
  bar2.position.y = height - 0.62;
  group.add(bar2);

  // Small backplate so the sign reads as a panel
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.4, 0.03),
    standard(0x0a0a0c, { roughness: 0.5 })
  );
  plate.position.set(0, height - 0.53, backWallZ + 0.02);
  group.add(plate);

  // Ceiling LED light strips (long emissive bars) running across the room
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xfff4e0,
    emissiveIntensity: 1.0,
  });
  for (let i = -1; i <= 1; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.04, 0.12), stripMat);
    strip.position.set(0, height - 0.12, i * 2.6);
    group.add(strip);
  }

  return group;
}

// ---------------------------------------------------------------------------
// 8. Contactless payment terminal
// ---------------------------------------------------------------------------

function buildContactlessTerminal(counterTop, counterX, counterZ) {
  const group = new THREE.Group();
  group.position.set(counterX + 1.0, counterTop, counterZ + 0.05);
  group.name = 'ContactlessTerminal-2025';

  const casing = standard(0x1b1b20, { roughness: 0.4, metalness: 0.4 });

  // Base unit
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.14), casing);
  base.position.y = 0.06;
  base.castShadow = true;
  group.add(base);

  // Small amount screen
  const amtTex = makeCanvasTexture(128, 64, (c, w, h) => {
    c.fillStyle = '#0a1018';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#9fe0c8';
    c.font = 'bold 26px system-ui, sans-serif';
    c.fillText('$6.00', 14, 42);
  });
  const screenMat = new THREE.MeshStandardMaterial({
    map: amtTex,
    emissive: 0x0a2a22,
    emissiveMap: amtTex,
    emissiveIntensity: 0.8,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), screenMat);
  screen.position.set(0, 0.075, 0.071);
  group.add(screen);

  // Glowing contactless pad on top
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.012, 20),
    new THREE.MeshStandardMaterial({
      color: 0x4be0a8,
      emissive: 0x4be0a8,
      emissiveIntensity: 1.2,
    })
  );
  pad.position.y = 0.126;
  group.add(pad);

  return group;
}

// ---------------------------------------------------------------------------
// 9. 2020s patron figures (neutral clothes, phones, smartwatch)
// ---------------------------------------------------------------------------

/**
 * Stylized seated patron looking at a phone. Built from primitives.
 * @param {object} opts { x, z, rotY, shirt, pants }
 */
function makePatron({ x, z, rotY = 0, shirt = 0x6a7d8a, pants = 0x36383d }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const skin = standard(0xe3b08f, { roughness: 0.7 });
  const shirtMat = standard(shirt, { roughness: 0.8 });
  const pantsMat = standard(pants, { roughness: 0.8 });
  const hairMat = standard(0x2a2018, { roughness: 0.8 });

  // Chair-seat reference ~0.48; build seated figure
  // Pelvis
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.26), pantsMat);
  pelvis.position.y = 0.5;
  pelvis.castShadow = true;
  group.add(pelvis);

  // Thighs (horizontal, seated)
  const thighGeo = new THREE.BoxGeometry(0.13, 0.13, 0.34);
  const lt = new THREE.Mesh(thighGeo, pantsMat);
  lt.position.set(-0.1, 0.49, 0.17);
  group.add(lt);
  const rt = new THREE.Mesh(thighGeo, pantsMat);
  rt.position.set(0.1, 0.49, 0.17);
  group.add(rt);

  // Lower legs (vertical down)
  const calfGeo = new THREE.BoxGeometry(0.12, 0.4, 0.13);
  const lc = new THREE.Mesh(calfGeo, pantsMat);
  lc.position.set(-0.1, 0.25, 0.34);
  group.add(lc);
  const rc = new THREE.Mesh(calfGeo, pantsMat);
  rc.position.set(0.1, 0.25, 0.34);
  group.add(rc);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.24), shirtMat);
  torso.position.set(0, 0.79, 0.0);
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin);
  head.position.set(0, 1.12, 0.0);
  head.castShadow = true;
  group.add(head);

  // Hair cap
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat
  );
  hair.position.set(0, 1.14, -0.01);
  group.add(hair);

  // Upper arms down alongside torso
  const armGeo = new THREE.BoxGeometry(0.1, 0.34, 0.1);
  const la = new THREE.Mesh(armGeo, shirtMat);
  la.position.set(-0.23, 0.76, 0.08);
  la.rotation.x = 0.5; // forearm forward toward phone
  group.add(la);
  const ra = new THREE.Mesh(armGeo, shirtMat);
  ra.position.set(0.23, 0.76, 0.08);
  ra.rotation.x = 0.5;
  group.add(ra);

  // Phone held in front of face (2020s signature gadget)
  const phoneMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.3,
    metalness: 0.5,
  });
  const phone = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.17, 0.01), phoneMat);
  phone.position.set(0, 0.98, 0.22);
  phone.rotation.x = -0.4;
  group.add(phone);
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.078, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0xcfe6ff,
      emissive: 0xcfe6ff,
      emissiveIntensity: 0.7,
    })
  );
  phoneScreen.position.set(0, 0.98, 0.226);
  phoneScreen.rotation.x = -0.4;
  group.add(phoneScreen);

  // Smartwatch on left wrist
  const watch = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x222226,
      emissive: 0x36a0ff,
      emissiveIntensity: 0.6,
    })
  );
  watch.position.set(-0.23, 0.6, 0.2);
  group.add(watch);

  group.name = 'Patron-2025';
  return group;
}

function buildPatrons() {
  const group = new THREE.Group();
  group.name = 'Patrons-2025';

  group.add(makePatron({ x: -3, z: 0.2, rotY: Math.PI, shirt: 0x7d8a6a, pants: 0x2f3338 }));
  group.add(makePatron({ x: 2.6, z: 1.6, rotY: Math.PI, shirt: 0xc98f6a, pants: 0x36383d }));
  group.add(makePatron({ x: -0.5, z: 3.5, rotY: Math.PI, shirt: 0x5a6d8a, pants: 0x2a2c30 }));

  return group;
}

// ---------------------------------------------------------------------------
// Era assembly
// ---------------------------------------------------------------------------

/**
 * Build the 2025 era asset group.
 * @param {{ THREE?: object, CAFE_DIMENSIONS?: object }} [ctx]
 * @returns {THREE.Group}
 */
export function build2025Era(ctx = {}) {
  const CAFE = ctx.CAFE_DIMENSIONS || DIMENSIONS_FALLBACK;
  const { width, depth, height } = CAFE;

  const group = new THREE.Group();
  group.name = 'Era-2025';
  group.userData.year = 2025;
  group.userData.meta = PERIOD_2025_META;

  // Counter geometry (mirrors main.js placeholder shell)
  const counterTopY = 1.1; // counter is 1.1 tall, centred at y=0.55
  const counterZ = -depth / 2 + 0.7; // -4.3
  const backWallZ = -depth / 2; // -5
  const sideWallX = width / 2; // 6

  group.add(buildFurniture());
  group.add(buildEspressoMachine(counterTopY, 0, counterZ));
  group.add(buildDigitalMenuBoard(backWallZ));
  group.add(buildSmartSpeaker(-0.5, counterZ, counterTopY));
  group.add(buildPhoneStand(-0.7, counterZ, counterTopY));
  group.add(buildModernPosters(sideWallX, height));
  group.add(buildTableware());
  group.add(buildLEDSignage(backWallZ, height));
  group.add(buildContactlessTerminal(counterTopY, 0, counterZ));
  group.add(buildPatrons());

  return group;
}

export default build2025Era;
