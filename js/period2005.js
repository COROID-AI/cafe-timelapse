/**
 * 2005 era asset configuration — Wi-Fi Lounge Café.
 *
 * Builds the procedural Three.js Group for the mid-2000s stop on the timeline.
 * Every README category is represented with unmistakable early-2000s detail,
 * each VISUALLY DISTINCT from the 1985 and 2025 eras:
 *
 *   - Furniture & decor ....... brushed-aluminium bistro tables with frosted-glass tops
 *                              + sleek cube stools/chairs
 *   - Coffee machine ......... superautomatic espresso machine (stainless body,
 *                              bean hopper, LCD display, group head) — distinct
 *                              from 1985's lever machine and 2025's robotic arm
 *   - Menu board & prices .... flat LCD menu panel (CanvasTexture) with 2000s prices
 *   - Music source ........... iPod-style MP3 player dock + two flat panel speakers
 *   - Posters ................ 2000s minimalist flat-design advertising posters
 *   - Tableware .............. white ceramic mugs + paper takeaway cups with sleeves
 *   - Signage & lighting ..... ceiling track spotlights + backlit wordmark panel
 *   - Counter technology ..... touchscreen POS terminal (LCD + card reader) — distinct
 *                              from 1985's CRT register and 2025's contactless pad
 *   - Patrons ................ 2000s figures (hoodies, baggy jeans, flip phones, messenger bags)
 *
 * Registered with PeriodManager via `build2005Era(ctx)` returning a THREE.Group.
 * All props use opacity-aware MeshStandardMaterial so the PeriodManager
 * cross-fade transition reads cleanly.
 */
import * as THREE from 'three';

// Fallbacks mirror main.js CAFE_DIMENSIONS in case ctx is not yet populated
// at initial-mount time (window.Cafe bridge is assigned late in main.js).
const DIMENSIONS_FALLBACK = { width: 12, depth: 10, height: 3.5 };

/** Era metadata consumed by info panels / audio manager. */
export const PERIOD_2005_META = {
  year: 2005,
  name: 'Wi-Fi Lounge Café',
  music: 'iPod dock (MP3)',
  counterTech: 'Touchscreen POS terminal',
  menu: [
    'Latte',
    'Cappuccino',
    'Mocha',
    'Drip Coffee',
    'Iced Coffee',
    'Muffin',
  ],
  prices: {
    Latte: 3.5,
    Cappuccino: 3.25,
    Mocha: 3.75,
    'Drip Coffee': 2.0,
    'Iced Coffee': 3.0,
    Muffin: 2.5,
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
// 1. 2000s furniture & decor (brushed aluminium + frosted glass)
// ---------------------------------------------------------------------------

/** A round frosted-glass-top table on a brushed-aluminium pedestal. */
function makeTable(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Frosted-glass top (slightly translucent pale surface)
  const topMat = standard(0xeef2f4, { roughness: 0.25, metalness: 0.1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 24), topMat);
  top.position.y = 0.74;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Brushed-aluminium central pedestal (splayed base)
  const aluMat = standard(0xcfd3d6, { roughness: 0.35, metalness: 0.85 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 16), aluMat);
  pedestal.position.y = 0.36;
  pedestal.castShadow = true;
  group.add(pedestal);

  // Four-prong splayed foot
  const footGeo = new THREE.BoxGeometry(0.5, 0.04, 0.06);
  for (let i = 0; i < 4; i++) {
    const foot = new THREE.Mesh(footGeo, aluMat);
    foot.position.y = 0.02;
    foot.rotation.y = (Math.PI / 2) * i;
    group.add(foot);
  }

  group.name = 'Table-2005';
  return group;
}

/** A sleek moulded cube stool / chair. */
function makeStool(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const seatMat = standard(0x3a4a5a, { roughness: 0.55, metalness: 0.1 }); // slate-blue cube seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.4), seatMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // Brushed-aluminium single post
  const aluMat = standard(0xcfd3d6, { roughness: 0.35, metalness: 0.85 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.42, 14), aluMat);
  post.position.y = 0.21;
  post.castShadow = true;
  group.add(post);

  // Circular base plate
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.03, 20), aluMat);
  base.position.y = 0.015;
  group.add(base);

  group.name = 'Stool-2005';
  return group;
}

function buildFurniture() {
  const group = new THREE.Group();
  group.name = 'Furniture-2005';

  // Three tables across the seating area (z = 1.2 to 3.2)
  const spots = [
    [-3.0, 1.6],
    [0.0, 2.4],
    [3.0, 1.6],
  ];
  for (const [x, z] of spots) {
    group.add(makeTable(x, z));
    group.add(makeStool(x - 0.5, z + 0.55));
    group.add(makeStool(x + 0.5, z + 0.55));
  }
  return group;
}

// ---------------------------------------------------------------------------
// 2. Superautomatic espresso machine (stainless body + LCD + bean hopper)
// ---------------------------------------------------------------------------

function buildEspressoMachine(counterTopY, x, z) {
  const group = new THREE.Group();
  group.position.set(x, counterTopY, z);
  group.name = 'EspressoMachine-2005';

  const steelMat = standard(0xd4d8db, { roughness: 0.3, metalness: 0.9 });
  const darkMat = standard(0x1c2024, { roughness: 0.5, metalness: 0.3 });

  // Main stainless body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.5), steelMat);
  body.position.y = 0.25;
  body.castShadow = true;
  group.add(body);

  // Bean hopper (transparent-tinted dark cylinder on top)
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.34, 20), darkMat);
  hopper.position.set(0.2, 0.67, 0);
  hopper.castShadow = true;
  group.add(hopper);

  // LCD display panel (emissive screen on the front face)
  const lcdMat = standard(0x10243a, {
    emissive: 0x2a7fd6,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), lcdMat);
  lcd.position.set(0, 0.32, 0.251);
  group.add(lcd);

  // Two group heads (nozzles) at the front
  const nozzleMat = standard(0x8a8f93, { roughness: 0.25, metalness: 0.95 });
  for (const dx of [-0.18, 0.18]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 16), nozzleMat);
    head.position.set(dx, 0.08, 0.2);
    group.add(head);
    // Portafilter hanging below
    const pf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 16), nozzleMat);
    pf.position.set(dx, -0.02, 0.22);
    group.add(pf);
  }

  // Drip tray slot
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.2), darkMat);
  tray.position.set(0, 0.02, 0.12);
  group.add(tray);

  return group;
}

// ---------------------------------------------------------------------------
// 3. Flat LCD menu board (CanvasTexture with 2000s prices)
// ---------------------------------------------------------------------------

function makeMenuTexture() {
  return makeCanvasTexture(512, 512, (ctx2d, w, h) => {
    // Dark glossy panel
    ctx2d.fillStyle = '#11161c';
    ctx2d.fillRect(0, 0, w, h);

    // Thin accent line
    ctx2d.fillStyle = '#3a9bd6';
    ctx2d.fillRect(0, 60, w, 4);

    // Title
    ctx2d.fillStyle = '#ffffff';
    ctx2d.textAlign = 'center';
    ctx2d.font = 'bold 42px Arial, sans-serif';
    ctx2d.fillText('— MENU —', w / 2, 42);

    // Items with 2000s prices
    const items = [
      ['Latte', '$3.50'],
      ['Cappuccino', '$3.25'],
      ['Mocha', '$3.75'],
      ['Drip Coffee', '$2.00'],
      ['Iced Coffee', '$3.00'],
      ['Muffin', '$2.50'],
    ];
    ctx2d.fillStyle = '#eaf2fb';
    ctx2d.font = '34px Arial, sans-serif';
    let y = 140;
    for (const [name, price] of items) {
      ctx2d.textAlign = 'left';
      ctx2d.fillText(name, 70, y);
      ctx2d.textAlign = 'right';
      ctx2d.fillStyle = '#7fc4f2';
      ctx2d.fillText(price, w - 70, y);
      ctx2d.fillStyle = '#eaf2fb';
      y += 56;
    }

    // Footer
    ctx2d.fillStyle = '#9aa7b4';
    ctx2d.textAlign = 'center';
    ctx2d.font = 'italic 22px Arial, sans-serif';
    ctx2d.fillText('Free Wi-Fi — Ask Inside', w / 2, h - 30);
  });
}

function buildMenuBoard(backWallZ) {
  const group = new THREE.Group();
  group.name = 'MenuBoard-2005';

  const tex = makeMenuTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    metalness: 0.0,
  });

  // Flat panel mounted on the back wall
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), screenMat);
  panel.position.set(0, 2.3, backWallZ + 0.12);
  panel.castShadow = false;
  group.add(panel);

  // Thin aluminium frame
  const frameMat = standard(0x2a2f36, { roughness: 0.4, metalness: 0.6 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.12, 1.72, 0.04), frameMat);
  frame.position.set(0, 2.3, backWallZ + 0.1);
  group.add(frame);

  return group;
}

// ---------------------------------------------------------------------------
// 4. iPod-style MP3 dock + flat panel speakers
// ---------------------------------------------------------------------------

function buildIpodDock(x, z, counterTopY) {
  const group = new THREE.Group();
  group.position.set(x, counterTopY, z);
  group.name = 'MusicSource-2005';

  const whiteMat = standard(0xf4f4f4, { roughness: 0.4, metalness: 0.1 });
  const screenMat = standard(0x1a2a3a, {
    emissive: 0x3aa0e0,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });

  // Dock base
  const dock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.18), whiteMat);
  dock.position.y = 0.025;
  dock.castShadow = true;
  group.add(dock);

  // iPod (small white slab standing in the dock)
  const ipod = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.02), whiteMat);
  ipod.position.y = 0.13;
  ipod.castShadow = true;
  group.add(ipod);
  // iPod screen
  const ipodScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.07), screenMat);
  ipodScreen.position.set(0, 0.15, 0.011);
  group.add(ipodScreen);

  // Two small flat-panel speakers flanking the dock
  const speakerMat = standard(0x2c2c30, { roughness: 0.5, metalness: 0.2 });
  const grillMat = standard(0x101012, { roughness: 0.7, metalness: 0.1 });
  for (const dx of [-0.24, 0.24]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.14), speakerMat);
    cab.position.set(dx, 0.13, 0);
    cab.castShadow = true;
    group.add(cab);
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.18), grillMat);
    grill.position.set(dx, 0.13, 0.071);
    group.add(grill);
  }

  return group;
}

// ---------------------------------------------------------------------------
// 5. 2000s minimalist flat-design posters
// ---------------------------------------------------------------------------

function makePosterTexture(bg, accent, title) {
  return makeCanvasTexture(384, 512, (ctx2d, w, h) => {
    // Bold flat background
    ctx2d.fillStyle = bg;
    ctx2d.fillRect(0, 0, w, h);

    // Large minimalist accent circle (flat-design motif)
    ctx2d.fillStyle = accent;
    ctx2d.beginPath();
    ctx2d.arc(w / 2, h * 0.38, w * 0.26, 0, Math.PI * 2);
    ctx2d.fill();

    // Clean sans-serif title
    ctx2d.fillStyle = '#ffffff';
    ctx2d.textAlign = 'center';
    ctx2d.font = 'bold 40px Arial, sans-serif';
    ctx2d.fillText(title, w / 2, h * 0.72);

    // Small tagline
    ctx2d.font = '20px Arial, sans-serif';
    ctx2d.globalAlpha = 0.8;
    ctx2d.fillText('since 2005', w / 2, h * 0.82);
    ctx2d.globalAlpha = 1;
  });
}

function buildPosters(sideWallX, height) {
  const group = new THREE.Group();
  group.name = 'Posters-2005';

  const posters = [
    { bg: '#2a6f97', accent: '#f4c95d', title: 'ESPRESSO' },
    { bg: '#6a4c93', accent: '#f4a261', title: 'LATTE ART' },
  ];

  posters.forEach((cfg, i) => {
    const tex = makePosterTexture(cfg.bg, cfg.accent, cfg.title);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.0,
      emissive: 0x111111,
      emissiveIntensity: 0.05,
    });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.15), mat);
    // Left wall, staggered heights
    poster.position.set(-sideWallX + 0.12, 2.0 - i * 0.1, -1.0 + i * 1.8);
    poster.rotation.y = Math.PI / 2;
    group.add(poster);
  });

  return group;
}

// ---------------------------------------------------------------------------
// 6. Tableware — white ceramic mugs + paper takeaway cups
// ---------------------------------------------------------------------------

function makeMug(x, z, tableY) {
  const group = new THREE.Group();
  group.position.set(x, tableY, z);

  const whiteMat = standard(0xf0f0ee, { roughness: 0.45, metalness: 0.0 });
  // Body (slightly tapered cylinder)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.1, 16), whiteMat);
  body.position.y = 0.05;
  body.castShadow = true;
  group.add(body);
  // Handle (torus segment)
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI),
    whiteMat
  );
  handle.position.set(0.045, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  return group;
}

function makeTakeawayCup(x, z, tableY) {
  const group = new THREE.Group();
  group.position.set(x, tableY, z);

  // Paper cup body
  const cupMat = standard(0xf7f4ec, { roughness: 0.8, metalness: 0.0 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.03, 0.12, 16), cupMat);
  cup.position.y = 0.06;
  cup.castShadow = true;
  group.add(cup);
  // Cardboard sleeve
  const sleeveMat = standard(0xb98656, { roughness: 0.9, metalness: 0.0 });
  const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.036, 0.04, 16), sleeveMat);
  sleeve.position.y = 0.05;
  group.add(sleeve);
  // Domed lid
  const lidMat = standard(0x3a3a3e, { roughness: 0.5, metalness: 0.1 });
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lidMat);
  lid.position.y = 0.12;
  group.add(lid);

  return group;
}

function buildTableware() {
  const group = new THREE.Group();
  group.name = 'Tableware-2005';

  const TABLE_TOP = 0.78;
  // A couple of mugs + a takeaway cup across the tables
  group.add(makeMug(-3.15, 1.5, TABLE_TOP));
  group.add(makeTakeawayCup(-2.8, 1.7, TABLE_TOP));
  group.add(makeMug(0.2, 2.4, TABLE_TOP));
  group.add(makeTakeawayCup(2.85, 1.5, TABLE_TOP));
  group.add(makeMug(3.2, 1.75, TABLE_TOP));

  return group;
}

// ---------------------------------------------------------------------------
// 7. Signage & lighting — ceiling track spotlights + backlit wordmark
// ---------------------------------------------------------------------------

function buildSignage(backWallZ, height) {
  const group = new THREE.Group();
  group.name = 'Signage-2005';

  // Track rail across the ceiling
  const railMat = standard(0x4a4e54, { roughness: 0.4, metalness: 0.7 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.0, 12), railMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, height - 0.3, -1.0);
  group.add(rail);

  // Three spotlights hanging from the rail
  const spotMat = standard(0x2a2d32, { roughness: 0.4, metalness: 0.6 });
  const bulbMat = standard(0xfff2d8, { emissive: 0xffd98a, emissiveIntensity: 0.6, roughness: 0.3 });
  for (const x of [-2.0, 0, 2.0]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), spotMat);
    arm.position.set(x, height - 0.41, -1.0);
    group.add(arm);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 16), spotMat);
    head.position.set(x, height - 0.55, -1.0);
    head.rotation.x = Math.PI * 0.12;
    group.add(head);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), bulbMat);
    bulb.position.set(x, height - 0.6, -1.0);
    group.add(bulb);
  }

  // Backlit wordmark panel on the back wall
  const signMat = standard(0xffffff, {
    emissive: 0x6cc0ff,
    emissiveIntensity: 0.8,
    roughness: 0.3,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 0.05), signMat);
  sign.position.set(0, 3.0, backWallZ + 0.12);
  group.add(sign);

  return group;
}

// ---------------------------------------------------------------------------
// 8. Counter technology — touchscreen POS terminal (LCD + card reader)
// ---------------------------------------------------------------------------

function buildCashRegister(counterTopY, x, z) {
  const group = new THREE.Group();
  group.position.set(x + 1.1, counterTopY, z);
  group.name = 'CounterTech-2005';

  const darkMat = standard(0x22262b, { roughness: 0.5, metalness: 0.3 });
  const screenMat = standard(0x0a1a2a, {
    emissive: 0x2a8ad6,
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });

  // Touchscreen monitor (angled back slightly)
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 12), darkMat);
  stand.position.y = 0.06;
  group.add(stand);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.03), darkMat);
  bezel.position.set(0, 0.24, 0);
  bezel.rotation.x = -Math.PI * 0.1;
  bezel.castShadow = true;
  group.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.21), screenMat);
  screen.position.set(0, 0.24, 0.016);
  screen.rotation.x = -Math.PI * 0.1;
  group.add(screen);

  // Card reader / PIN pad beside the terminal
  const padMat = standard(0x2c3036, { roughness: 0.5, metalness: 0.2 });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.03), padMat);
  pad.position.set(0.28, 0.08, 0.04);
  pad.rotation.x = -Math.PI * 0.18;
  group.add(pad);

  return group;
}

// ---------------------------------------------------------------------------
// 9. Patrons — 2000s figures (hoodies, baggy jeans, flip phones)
// ---------------------------------------------------------------------------

function makePatron(opts) {
  const group = new THREE.Group();
  group.position.set(opts.x, 0, opts.z);
  group.rotation.y = opts.rotY || 0;

  const skinMat = standard(0xe0ac84, { roughness: 0.7 });
  const hairMat = standard(opts.hair ?? 0x2a1d12, { roughness: 0.8 });
  const topMat = standard(opts.top, { roughness: 0.75 });
  const pantsMat = standard(opts.pants, { roughness: 0.8 });

  // Legs (baggy jeans)
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.8, 12);
  for (const dx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.set(dx, 0.4, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Torso (hoodie)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.26), topMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  group.add(torso);

  // Hood collar behind the neck
  const hood = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.06, 8, 16, Math.PI), topMat);
  hood.position.set(0, 1.28, -0.06);
  hood.rotation.x = Math.PI / 2;
  group.add(hood);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), skinMat);
  head.position.y = 1.42;
  head.castShadow = true;
  group.add(head);

  // Hair cap
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
  hair.position.y = 1.46;
  group.add(hair);

  // Arms (slightly out, hoodie sleeves)
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.42, 10);
  for (const dx of [-0.27, 0.27]) {
    const arm = new THREE.Mesh(armGeo, topMat);
    arm.position.set(dx, 1.05, 0.02);
    arm.rotation.z = dx < 0 ? 0.12 : -0.12;
    group.add(arm);
  }

  // Optional flip phone in hand
  if (opts.phone) {
    const phoneMat = standard(0x3a3a44, { roughness: 0.4, metalness: 0.5 });
    const phone = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.02), phoneMat);
    phone.position.set(0.3, 0.86, 0.08);
    group.add(phone);
  }

  group.name = 'Patron-2005';
  return group;
}

function buildPatrons() {
  const group = new THREE.Group();
  group.name = 'Patrons-2005';

  // Patron 1: grey hoodie, baggy jeans, flip phone
  group.add(makePatron({ x: -3.5, z: 2.0, rotY: Math.PI, top: 0x6a707a, pants: 0x3a4356, phone: true }));
  // Patron 2: red hoodie, denim jeans
  group.add(makePatron({ x: 0.5, z: 2.8, rotY: Math.PI, top: 0xb54031, pants: 0x4a5a78 }));
  // Patron 3: green jacket, khakis
  group.add(makePatron({ x: 3.5, z: 2.0, rotY: Math.PI, top: 0x3f7d52, pants: 0x8a7a52 }));

  return group;
}

// ---------------------------------------------------------------------------
// Era assembly
// ---------------------------------------------------------------------------

/**
 * Build the 2005 era asset group.
 * @param {{ THREE?: object, CAFE_DIMENSIONS?: object }} [ctx]
 * @returns {THREE.Group}
 */
export function build2005Era(ctx = {}) {
  const CAFE = ctx.CAFE_DIMENSIONS || DIMENSIONS_FALLBACK;
  const { width, depth, height } = CAFE;

  const group = new THREE.Group();
  group.name = 'Era-2005';
  group.userData.year = 2005;
  group.userData.meta = PERIOD_2005_META;

  // Counter geometry (mirrors main.js placeholder shell)
  const counterTopY = 1.1; // counter is 1.1 tall, centred at y=0.55
  const counterZ = -depth / 2 + 0.7; // -4.3
  const backWallZ = -depth / 2; // -5
  const sideWallX = width / 2; // 6

  group.add(buildFurniture());
  group.add(buildEspressoMachine(counterTopY, -0.5, counterZ));
  group.add(buildMenuBoard(backWallZ));
  group.add(buildIpodDock(-0.5, counterZ, counterTopY));
  group.add(buildPosters(sideWallX, height));
  group.add(buildTableware());
  group.add(buildSignage(backWallZ, height));
  group.add(buildCashRegister(counterTopY, 0, counterZ));
  group.add(buildPatrons());

  return group;
}

export default build2005Era;
