/**
 * 1985 era asset configuration — Neon Eighties Café.
 *
 * Builds the procedural Three.js Group for the mid-80s stop on the timeline.
 * Every README category is represented with unmistakable 80s detail:
 *
 *   - Furniture & decor ....... tubular chrome tables & chairs, laminate tops, neon decor
 *   - Coffee machine ......... pump-lever espresso machine (chrome body, portafilter,
 *                              steam wand, pressure gauge) — distinct from 2025's touchscreen
 *   - Menu board & prices .... neon-style menu board (CanvasTexture) with 1980s prices
 *   - Music source ........... boombox (two speaker grilles + cassette slot + handle)
 *   - Posters ................ 80s neon / MTV-era posters with geometric Memphis patterns
 *   - Tableware .............. bold-colored ceramic mugs, neon cups
 *   - Signage & lighting ..... fluorescent ceiling tubes + glowing neon wall sign
 *   - Counter technology ..... digital cash register with CRT display — distinct from 2025's contactless pad
 *   - Patrons ................ 80s figures (big hair, windbreakers, one with Walkman headphones)
 *
 * Registered with PeriodManager via `build1985Era(ctx)` returning a THREE.Group.
 * All props use opacity-aware MeshStandardMaterial so the PeriodManager
 * cross-fade transition reads cleanly.
 */
import * as THREE from 'three';

// Fallbacks mirror main.js CAFE_DIMENSIONS in case ctx is not yet populated
// at initial-mount time (window.Cafe bridge is assigned late in main.js).
const DIMENSIONS_FALLBACK = { width: 12, depth: 10, height: 3.5 };

/** Era metadata consumed by info panels / audio manager. */
export const PERIOD_1985_META = {
  year: 1985,
  name: 'Neon Eighties Café',
  music: 'Boombox (cassette)',
  counterTech: 'Digital cash register (CRT)',
  menu: [
    'Cappuccino',
    'Café au Lait',
    'Espresso',
    'Hot Chocolate',
    'Decaf',
    'Muffin',
  ],
  prices: {
    Cappuccino: 1.5,
    'Café au Lait': 1.25,
    Espresso: 1.0,
    'Hot Chocolate': 1.35,
    Decaf: 1.1,
    Muffin: 0.95,
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
// 1. 80s furniture & decor (tubular chrome + laminate)
// ---------------------------------------------------------------------------

/** A square laminate-top table on tubular chrome legs. */
function makeTable(x, z, size = 0.72) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const topMat = standard(0xf2f2ee, { roughness: 0.4, metalness: 0.05 }); // pale laminate
  const top = new THREE.Mesh(new THREE.BoxGeometry(size, 0.05, size), topMat);
  top.position.y = 0.74;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Four tubular chrome legs
  const chromeLeg = standard(0xd8dadd, { roughness: 0.2, metalness: 0.95 });
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.72, 12);
  const half = size / 2 - 0.06;
  const legPositions = [
    [half, -half],
    [-half, -half],
    [half, half],
    [-half, half],
  ];
  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, chromeLeg);
    leg.position.set(lx, 0.36, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  group.name = 'Table-1985';
  return group;
}

/** A tubular chrome-framed chair with a bold-colored vinyl seat. */
function makeChair(color = 0xff3b6b) {
  const group = new THREE.Group();

  const chromeMat = standard(0xd8dadd, { roughness: 0.2, metalness: 0.95 });
  const seatMat = standard(color, { roughness: 0.5, metalness: 0.1 });

  // Flat square vinyl seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), seatMat);
  seat.position.y = 0.46;
  seat.castShadow = true;
  group.add(seat);

  // Tubular backrest frame (curved bar)
  const backTop = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.018, 10, 20, Math.PI),
    chromeMat
  );
  backTop.position.set(0, 0.68, -0.2);
  backTop.rotation.x = Math.PI / 2;
  group.add(backTop);

  // Vinyl back panel
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.03), seatMat);
  backPanel.position.set(0, 0.6, -0.2);
  group.add(backPanel);

  // Four splayed tubular legs
  const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.46, 10);
  const legPositions = [
    [0.18, 0.18],
    [-0.18, 0.18],
    [0.18, -0.18],
    [-0.18, -0.18],
  ];
  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, chromeMat);
    leg.position.set(lx, 0.23, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  group.name = 'Chair-1985';
  return group;
}

/** Neon wall cube decor (Memphis-style accent on a stand). */
function makeNeonCubeDecor(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const standMat = standard(0x2a2a2e, { roughness: 0.5, metalness: 0.4 });
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), standMat);
  stand.position.y = 0.25;
  group.add(stand);

  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.5,
    roughness: 0.4,
  });
  const cube = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), cubeMat);
  cube.position.y = 0.58;
  cube.rotation.y = Math.PI / 4;
  group.add(cube);

  group.name = 'NeonCubeDecor-1985';
  return group;
}

function buildFurniture() {
  const group = new THREE.Group();
  group.name = 'Furniture-1985';

  const setups = [
    { x: -3, z: -0.4 },
    { x: 2.6, z: 1.0 },
    { x: -0.5, z: 2.9 },
  ];
  const chairColors = [0xff3b6b, 0x00e5ff, 0xffd23b];

  for (const { x, z } of setups) {
    group.add(makeTable(x, z));
    group.add(makeChair(0xff3b6b));
    group.add(makeChair(0x00e5ff));
    group.children.at(-2).position.set(x + 0.0, z + 0.62);
    group.children.at(-1).position.set(x + 0.0, z - 0.62);
    group.children.at(-1).rotation.y = Math.PI;
  }

  group.add(makeNeonCubeDecor(4.6, -2.2));
  group.add(makeNeonCubeDecor(-4.6, -2.2));
  return group;
}

// ---------------------------------------------------------------------------
// 2. Pump-lever espresso machine (chrome body, portafilter, steam wand, gauge)
// ---------------------------------------------------------------------------

function buildEspressoMachine(counterTop, counterX, counterZ) {
  const group = new THREE.Group();
  group.position.set(counterX, counterTop, counterZ);
  group.name = 'EspressoMachine-1985';

  const chrome = standard(0xd8dadd, { roughness: 0.18, metalness: 0.98 });
  const darkMetal = standard(0x2b2b30, { roughness: 0.4, metalness: 0.7 });
  const brass = standard(0xc89b3c, { roughness: 0.3, metalness: 0.85 });

  // Main chrome body (taller, more industrial than 2025's)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.52), chrome);
  body.position.y = 0.32;
  body.castShadow = true;
  group.add(body);

  // Cup-warming tray on top
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.04, 0.48), chrome);
  tray.position.y = 0.65;
  group.add(tray);

  // Two pump-lever handles on the front (signature 80s pump machine feature)
  const leverGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10);
  for (const lx of [-0.18, 0.18]) {
    const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 12), brass);
    leverKnob.position.set(lx, 0.56, 0.28);
    group.add(leverKnob);
    const lever = new THREE.Mesh(leverGeo, darkMetal);
    lever.position.set(lx, 0.46, 0.27);
    lever.rotation.x = 0.5;
    group.add(lever);
  }

  // Pressure gauge (round dial) — distinct mechanical detail
  const gaugeBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.02, 24),
    standard(0xf0f0ec, { roughness: 0.5 })
  );
  gaugeBack.rotation.x = Math.PI / 2;
  gaugeBack.position.set(0.0, 0.42, 0.265);
  group.add(gaugeBack);
  const gaugeNeedle = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.05, 0.004),
    new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.4 })
  );
  gaugeNeedle.position.set(0.0, 0.43, 0.278);
  gaugeNeedle.rotation.z = -0.6;
  group.add(gaugeNeedle);

  // Group head + portafilter hanging below
  const headGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.12, 16);
  const head = new THREE.Mesh(headGeo, chrome);
  head.position.set(-0.2, 0.18, 0.27);
  group.add(head);
  const portafilter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.07, 0.1, 16),
    darkMetal
  );
  portafilter.position.set(-0.2, 0.08, 0.27);
  group.add(portafilter);
  const pfHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.22, 10),
    standard(0x1a1a1a, { roughness: 0.6 })
  );
  pfHandle.rotation.z = Math.PI / 2;
  pfHandle.position.set(-0.2, 0.07, 0.42);
  group.add(pfHandle);

  // Steam wand (angled chrome tube with knob)
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.34, 10), chrome);
  wand.rotation.x = 0.55;
  wand.position.set(0.3, 0.5, 0.16);
  group.add(wand);
  const wandKnob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), brass);
  wandKnob.position.set(0.3, 0.67, 0.12);
  group.add(wandKnob);

  return group;
}

// ---------------------------------------------------------------------------
// 3. Neon-style menu board with 1980s prices
// ---------------------------------------------------------------------------

function buildNeonMenuBoard(backWallZ) {
  const group = new THREE.Group();
  group.name = 'NeonMenuBoard-1985';

  const menuTex = makeCanvasTexture(512, 320, (c, w, h) => {
    // Black background lets neon colors pop
    c.fillStyle = '#080018';
    c.fillRect(0, 0, w, h);

    // Neon glow header
    c.shadowColor = '#ff2bd6';
    c.shadowBlur = 18;
    c.fillStyle = '#ff2bd6';
    c.font = 'bold 46px system-ui, sans-serif';
    c.fillText('MENU', 30, 56);
    c.shadowBlur = 0;

    // Cyan underline
    c.shadowColor = '#00e5ff';
    c.shadowBlur = 12;
    c.fillStyle = '#00e5ff';
    c.fillRect(30, 70, w - 60, 4);
    c.shadowBlur = 0;

    const items = [
      ['Cappuccino', '$1.50'],
      ['Cafe au Lait', '$1.25'],
      ['Espresso', '$1.00'],
      ['Hot Chocolate', '$1.35'],
      ['Decaf', '$1.10'],
      ['Muffin', '$0.95'],
    ];
    const neonColors = ['#ffd23b', '#39ff14', '#00e5ff', '#ff2bd6', '#ffd23b', '#39ff14'];
    items.forEach((row, i) => {
      const y = 128 + i * 32;
      c.shadowColor = neonColors[i];
      c.shadowBlur = 10;
      c.fillStyle = neonColors[i];
      c.font = 'bold 26px system-ui, sans-serif';
      c.fillText(row[0], 34, y);
      const priceW = c.measureText(row[1]).width;
      c.fillText(row[1], w - 34 - priceW, y);
    });
    c.shadowBlur = 0;
  });

  const screenMat = new THREE.MeshStandardMaterial({
    map: menuTex,
    emissive: 0xffffff,
    emissiveMap: menuTex,
    emissiveIntensity: 0.7,
    roughness: 0.4,
  });

  // Dark bezel / backboard
  const bezelMat = standard(0x0a0a0e, { roughness: 0.6, metalness: 0.3 });
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.08, 0.06), bezelMat);
  group.add(bezel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), screenMat);
  screen.position.z = 0.035;
  group.add(screen);

  // Mount above the counter on the back wall
  group.position.set(0, 2.55, backWallZ + 0.06);
  return group;
}

// ---------------------------------------------------------------------------
// 4. Music source — boombox (two speaker grilles + cassette slot + handle)
// ---------------------------------------------------------------------------

function buildBoombox(x, z, surfaceY) {
  const group = new THREE.Group();
  group.position.set(x, surfaceY, z);
  group.name = 'Boombox-1985';

  const caseMat = standard(0x1a1a1e, { roughness: 0.5, metalness: 0.3 });
  const chromeMat = standard(0xd8dadd, { roughness: 0.2, metalness: 0.95 });
  const grilleMat = standard(0x0a0a0c, { roughness: 0.7, metalness: 0.2 });

  // Main rectangular body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.26), caseMat);
  body.position.y = 0.17;
  body.castShadow = true;
  group.add(body);

  // Carry handle (arched tube across the top)
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.02, 10, 24, Math.PI),
    chromeMat
  );
  handle.position.set(0, 0.34, 0);
  handle.rotation.z = Math.PI / 2;
  handle.rotation.x = -Math.PI / 2;
  handle.scale.set(1, 0.32, 1);
  group.add(handle);

  // Two speaker grilles (left + right)
  const makeGrille = (gx) => {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 0.02, 28),
      chromeMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(gx, 0.17, 0.135);
    group.add(ring);
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.1, 0.015, 28),
      grilleMat
    );
    cone.rotation.x = Math.PI / 2;
    cone.position.set(gx, 0.17, 0.14);
    group.add(cone);
    // Center tweeter dot
    const dot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.018, 16),
      chromeMat
    );
    dot.rotation.x = Math.PI / 2;
    dot.position.set(gx, 0.17, 0.148);
    group.add(dot);
  };
  makeGrille(-0.27);
  makeGrille(0.27);

  // Cassette slot in the center
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.01), grilleMat);
  slot.position.set(0, 0.24, 0.135);
  group.add(slot);
  // Cassette window (slightly lighter)
  const cassette = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.07, 0.008),
    standard(0x2a2a30, { roughness: 0.4, metalness: 0.4 })
  );
  cassette.position.set(0, 0.18, 0.136);
  group.add(cassette);

  // Two tuning knobs between speakers
  const knobMat = chromeMat;
  for (const kx of [-0.1, 0.1]) {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(kx, 0.1, 0.14);
    group.add(knob);
  }

  return group;
}

// ---------------------------------------------------------------------------
// 5. 80s neon / MTV-era posters (Memphis geometric patterns)
// ---------------------------------------------------------------------------

function buildNeonPosters(sideWallX, height) {
  const group = new THREE.Group();
  group.name = 'Posters-1985';

  const designs = [
    { bg: '#0a0020', a: '#ff2bd6', b: '#00e5ff' }, // neon pink/cyan
    { bg: '#001a14', a: '#39ff14', b: '#ffd23b' }, // neon green/yellow
  ];

  designs.forEach((d, i) => {
    const tex = makeCanvasTexture(256, 384, (c, w, h) => {
      c.fillStyle = d.bg;
      c.fillRect(0, 0, w, h);
      // Memphis-style geometric shapes
      c.fillStyle = d.a;
      c.beginPath();
      // Big triangle
      c.moveTo(w / 2, 40);
      c.lineTo(60, 200);
      c.lineTo(w - 60, 200);
      c.closePath();
      c.fill();
      // Zigzag accent
      c.strokeStyle = d.b;
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(30, 250);
      c.lineTo(80, 300);
      c.lineTo(130, 250);
      c.lineTo(180, 300);
      c.lineTo(w - 30, 250);
      c.stroke();
      // Squiggle dots
      c.fillStyle = d.b;
      for (let dx = 40; dx < w - 30; dx += 44) {
        c.beginPath();
        c.arc(dx, 330, 7, 0, Math.PI * 2);
        c.fill();
      }
      // Bold typography
      c.shadowColor = d.a;
      c.shadowBlur = 14;
      c.fillStyle = '#ffffff';
      c.font = 'bold 30px system-ui, sans-serif';
      c.fillText('NEON', 28, h - 30);
      c.shadowBlur = 0;
    });

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.35,
      roughness: 0.6,
    });
    const frameMat = standard(0x1a1a20, { roughness: 0.5, metalness: 0.4 });

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
// 6. Bold tableware (placed on tables)
// ---------------------------------------------------------------------------

function buildTableware() {
  const group = new THREE.Group();
  group.name = 'Tableware-1985';

  // Bold-colored ceramic mug helper
  const makeMug = (color) => {
    const mug = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.044, 0.1, 24),
      standard(color, { roughness: 0.5 })
    );
    body.position.y = 0.05;
    mug.add(body);
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI),
      standard(color, { roughness: 0.5 })
    );
    handle.position.set(0.05, 0.05, 0);
    handle.rotation.y = Math.PI / 2;
    mug.add(handle);
    return mug;
  };

  const tablePositions = [
    { x: -3, z: -0.4 },
    { x: 2.6, z: 1.0 },
    { x: -0.5, z: 2.9 },
  ];
  const mugColors = [0xff3b6b, 0x00e5ff, 0xffd23b];

  tablePositions.forEach((p, i) => {
    const mug = makeMug(mugColors[i]);
    mug.position.set(p.x - 0.12, 0.785, p.z + 0.05);
    group.add(mug);

    // A folded newspaper / magazine on one table (very 80s)
    if (i === 1) {
      const paper = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.012, 0.18),
        standard(0xe8e6df, { roughness: 0.8 })
      );
      paper.position.set(p.x + 0.1, 0.786, p.z - 0.05);
      group.add(paper);
    }
  });

  return group;
}

// ---------------------------------------------------------------------------
// 7. Fluorescent ceiling lighting + neon wall sign
// ---------------------------------------------------------------------------

function buildFluorescentSignage(backWallZ, height) {
  const group = new THREE.Group();
  group.name = 'FluorescentSignage-1985';

  // Glowing neon wall sign ("ESPRESSO" tube) on the back wall
  const neonTubeMat = new THREE.MeshStandardMaterial({
    color: 0xff2bd6,
    emissive: 0xff2bd6,
    emissiveIntensity: 1.6,
  });
  const tubeGeo = new THREE.CylinderGeometry(0.016, 0.016, 1.4, 10);
  const tube1 = new THREE.Mesh(tubeGeo, neonTubeMat);
  tube1.rotation.z = Math.PI / 2;
  tube1.position.set(0, height - 0.5, backWallZ + 0.05);
  group.add(tube1);

  const neonCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00e5ff,
    emissiveIntensity: 1.6,
  });
  const tube2 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 1.2, 10),
    neonCyanMat
  );
  tube2.rotation.z = Math.PI / 2;
  tube2.position.set(0, height - 0.66, backWallZ + 0.05);
  group.add(tube2);

  // Backplate for the sign
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.42, 0.03),
    standard(0x080018, { roughness: 0.6 })
  );
  plate.position.set(0, height - 0.57, backWallZ + 0.02);
  group.add(plate);

  // Fluorescent ceiling tubes (long emissive bars) — era-appropriate lighting
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf2ff,
    emissive: 0xeaf2ff,
    emissiveIntensity: 0.9,
  });
  for (let i = -1; i <= 1; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.05, 0.14), tubeMat);
    strip.position.set(0, height - 0.14, i * 2.6);
    group.add(strip);
  }

  return group;
}

// ---------------------------------------------------------------------------
// 8. Digital cash register with CRT display
// ---------------------------------------------------------------------------

function buildCashRegister(counterTop, counterX, counterZ) {
  const group = new THREE.Group();
  group.position.set(counterX + 1.0, counterTop, counterZ + 0.05);
  group.name = 'CashRegister-1985';

  const caseMat = standard(0xe9e5d8, { roughness: 0.5, metalness: 0.1 }); // beige/cream 80s plastic
  const darkMat = standard(0x2a2a2e, { roughness: 0.5, metalness: 0.3 });

  // Base unit
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.34), caseMat);
  base.position.y = 0.12;
  base.castShadow = true;
  group.add(base);

  // CRT display (small green/amber screen, tilted up)
  const crtHousing = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), darkMat);
  crtHousing.position.set(0, 0.3, -0.1);
  crtHousing.rotation.x = -0.35;
  group.add(crtHousing);

  // CRT screen face (glowing green text)
  const crtTex = makeCanvasTexture(128, 64, (c, w, h) => {
    c.fillStyle = '#021a06';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#39ff14';
    c.font = 'bold 24px monospace';
    c.fillText('$1.50', 14, 42);
  });
  const crtMat = new THREE.MeshStandardMaterial({
    map: crtTex,
    emissive: 0x0a3306,
    emissiveMap: crtTex,
    emissiveIntensity: 0.8,
    roughness: 0.4,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), crtMat);
  screen.position.set(0, 0.3, -0.059);
  screen.rotation.x = -0.35;
  group.add(screen);

  // Cash drawer front
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.04), darkMat);
  drawer.position.set(0, 0.05, 0.175);
  group.add(drawer);

  // Button cluster (raised keys)
  const keyMat = standard(0x55555a, { roughness: 0.5, metalness: 0.2 });
  for (let r = 0; r < 2; r++) {
    for (let cc = 0; cc < 3; cc++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.05), keyMat);
      key.position.set(-0.1 + cc * 0.08, 0.245, 0.02 + r * 0.07);
      group.add(key);
    }
  }

  return group;
}

// ---------------------------------------------------------------------------
// 9. 1980s patron figures (big hair, windbreakers, one with Walkman)
// ---------------------------------------------------------------------------

/**
 * Stylized seated 80s patron. Big hair + bright windbreaker by default;
 * the Walkman variant adds headphones + a cassette player on the belt.
 * @param {object} opts { x, z, rotY, shirt, pants, bigHair, walkman }
 */
function makePatron({
  x,
  z,
  rotY = 0,
  shirt = 0xff3b6b,
  pants = 0x2a6fd6,
  bigHair = true,
  walkman = false,
}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const skin = standard(0xe3b08f, { roughness: 0.7 });
  const shirtMat = standard(shirt, { roughness: 0.8 });
  const pantsMat = standard(pants, { roughness: 0.8 });
  const hairMat = standard(0x2a1a10, { roughness: 0.8 });

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

  // Torso — slightly broader (shoulder-pad era)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.46, 0.24), shirtMat);
  torso.position.set(0, 0.79, 0.0);
  torso.castShadow = true;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), skin);
  head.position.set(0, 1.12, 0.0);
  head.castShadow = true;
  group.add(head);

  // BIG HAIR — exaggerated 80s volume (larger hemisphere)
  const hairGeo = bigHair
    ? new THREE.SphereGeometry(0.17, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.9)
    : new THREE.SphereGeometry(0.13, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.16, -0.02);
  if (bigHair) hair.scale.set(1, 1.05, 1.1);
  group.add(hair);

  // Upper arms down alongside torso
  const armGeo = new THREE.BoxGeometry(0.11, 0.34, 0.11);
  const la = new THREE.Mesh(armGeo, shirtMat);
  la.position.set(-0.25, 0.76, 0.06);
  group.add(la);
  const ra = new THREE.Mesh(armGeo, shirtMat);
  ra.position.set(0.25, 0.76, 0.06);
  group.add(ra);

  // Walkman variant: headphones band + earcups + belt cassette player
  if (walkman) {
    const bandMat = standard(0x1a1a1e, { roughness: 0.5, metalness: 0.4 });
    // Headphone band over the head
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.012, 10, 20, Math.PI),
      bandMat
    );
    band.position.set(0, 1.2, 0);
    band.rotation.y = 0;
    group.add(band);
    // Two earcups
    for (const ex of [-0.12, 0.12]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), bandMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(ex, 1.12, 0);
      group.add(cup);
    }
    // Walkman unit clipped to belt
    const walkmanBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.03),
      standard(0x222226, { roughness: 0.4, metalness: 0.5 })
    );
    walkmanBody.position.set(0.16, 0.52, 0.14);
    group.add(walkmanBody);
    // Wire from walkman up toward head
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.32, 6),
      bandMat
    );
    wire.position.set(0.16, 0.7, 0.16);
    group.add(wire);
  }

  group.name = 'Patron-1985';
  return group;
}

function buildPatrons() {
  const group = new THREE.Group();
  group.name = 'Patrons-1985';

  // Patron 1: pink windbreaker, big hair
  group.add(makePatron({ x: -3, z: 0.2, rotY: Math.PI, shirt: 0xff3b6b, pants: 0x2a6fd6 }));
  // Patron 2: cyan windbreaker, big hair, Walkman headphones
  group.add(makePatron({ x: 2.6, z: 1.6, rotY: Math.PI, shirt: 0x00e5ff, pants: 0x33383d, walkman: true }));
  // Patron 3: bright yellow top, big hair
  group.add(makePatron({ x: -0.5, z: 3.5, rotY: Math.PI, shirt: 0xffd23b, pants: 0x8a2be2 }));

  return group;
}

// ---------------------------------------------------------------------------
// Era assembly
// ---------------------------------------------------------------------------

/**
 * Build the 1985 era asset group.
 * @param {{ THREE?: object, CAFE_DIMENSIONS?: object }} [ctx]
 * @returns {THREE.Group}
 */
export function build1985Era(ctx = {}) {
  const CAFE = ctx.CAFE_DIMENSIONS || DIMENSIONS_FALLBACK;
  const { width, depth, height } = CAFE;

  const group = new THREE.Group();
  group.name = 'Era-1985';
  group.userData.year = 1985;
  group.userData.meta = PERIOD_1985_META;

  // Counter geometry (mirrors main.js placeholder shell)
  const counterTopY = 1.1; // counter is 1.1 tall, centred at y=0.55
  const counterZ = -depth / 2 + 0.7; // -4.3
  const backWallZ = -depth / 2; // -5
  const sideWallX = width / 2; // 6

  group.add(buildFurniture());
  group.add(buildEspressoMachine(counterTopY, 0, counterZ));
  group.add(buildNeonMenuBoard(backWallZ));
  group.add(buildBoombox(-0.5, counterZ, counterTopY));
  group.add(buildNeonPosters(sideWallX, height));
  group.add(buildTableware());
  group.add(buildFluorescentSignage(backWallZ, height));
  group.add(buildCashRegister(counterTopY, 0, counterZ));
  group.add(buildPatrons());

  return group;
}

export default build1985Era;
