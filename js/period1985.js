/**
 * period1985.js — 1985 period content module.
 *
 * Builds a 1980s café scene with tubular steel furniture, a commercial
 * espresso grinder, a digital menu board with 1985 prices, a boombox,
 * neon/Memphis-style posters, stoneware mugs, track lighting, an early
 * POS terminal, and 1980s-attired patrons with gadgets.
 *
 * All geometry is procedural (Three.js primitives) and all textures are
 * generated via the Canvas API.  Café dimensions come from config.js.
 *
 * Covers all 10 detail categories:
 *   1. Furniture          — tubular steel tables & chairs
 *   2. Coffee equipment   — commercial espresso grinder + espresso machine
 *   3. Menu board         — digital LED-style menu board with 1985 prices
 *   4. Music source       — boombox
 *   5. Posters            — neon / Memphis-style wall posters
 *   6. Tableware          — stoneware mugs
 *   7. Signage            — neon "ESPRESSO" sign
 *   8. Lighting           — track lighting
 *   9. Counter technology — early POS terminal (CRT + keyboard)
 *  10. Patrons            — 1980s-attired figures with gadgets
 */

import * as THREE from "three";
import { CAFE_DIMENSIONS } from "./config.js";

// ---------------------------------------------------------------------------
//  Colour palette — bold 1980s aesthetics
// ---------------------------------------------------------------------------
const PAL = {
  chrome: 0xc0c0c0,
  chromeDark: 0x8a8a8a,
  tubularSteel: 0xb8b8b8,
  black: 0x1a1a1a,
  white: 0xf0f0f0,
  neonPink: 0xff2d95,
  neonBlue: 0x00bfff,
  neonGreen: 0x39ff14,
  neonPurple: 0xbf00ff,
  memphisTeal: 0x00b8b8,
  memphisYellow: 0xffd700,
  memphisCoral: 0xff6f61,
  espressoBody: 0x2a2a2a,
  grinderRed: 0xb22222,
  posBeige: 0xddc8a8,
  posDark: 0x3a3a3a,
  crtGreen: 0x33ff66,
  stoneware: 0xc8a878,
  stonewareDark: 0xa88858,
  trackRail: 0x444444,
  patronSkin: 0xe0b080,
  patronHair: 0x3a2a1a,
  jacketBlue: 0x1a4a8a,
  jacketPink: 0xcc3377,
  shirtWhite: 0xf0f0f0,
  shirtCyan: 0x00aaaa,
  pants: 0x2a2a3a,
  pantsKhaki: 0x8a7a5a,
};

// ---------------------------------------------------------------------------
//  Canvas texture helpers
// ---------------------------------------------------------------------------

/**
 * Create a CanvasTexture from a drawing callback.
 * @param {number} w — canvas width in pixels
 * @param {number} h — canvas height in pixels
 * @param {(ctx: CanvasRenderingContext2D) => void} draw
 * @returns {THREE.CanvasTexture}
 */
function makeCanvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Digital menu board texture — LED dot-matrix style with 1985 prices. */
function createMenuBoardTexture() {
  return makeCanvasTexture(512, 320, (ctx) => {
    // Black LED background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 512, 320);

    // Subtle dot-grid to suggest LED matrix
    ctx.fillStyle = "#1a1a1a";
    for (let y = 4; y < 320; y += 8) {
      for (let x = 4; x < 512; x += 8) {
        ctx.fillRect(x, y, 2, 2);
      }
    }

    // Header
    ctx.fillStyle = "#ff2d95";
    ctx.font = "bold 30px monospace";
    ctx.textAlign = "center";
    ctx.fillText("★ CAFE MENU ★", 256, 40);

    // Menu items — neon green text
    ctx.fillStyle = "#39ff14";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    const items = [
      ["ESPRESSO", "$0.65"],
      ["CAPPUCCINO", "$0.95"],
      ["CAFE LATTE", "$1.10"],
      ["HOUSE COFFEE", "$0.50"],
      ["CROISSANT", "$0.75"],
      ["CHEESECAKE", "$1.25"],
    ];
    let y = 90;
    for (const [name, price] of items) {
      ctx.fillText(name, 50, y);
      ctx.textAlign = "right";
      ctx.fillText(price, 462, y);
      ctx.textAlign = "left";
      y += 38;
    }
  });
}

/** Memphis-style poster texture — bold geometric shapes. */
function createMemphisPosterTexture(variant) {
  return makeCanvasTexture(256, 384, (ctx) => {
    // Background
    const bgColors = ["#1a1a4a", "#4a1a4a", "#1a4a4a"];
    ctx.fillStyle = bgColors[variant % 3];
    ctx.fillRect(0, 0, 256, 384);

    // Bold triangles
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.moveTo(40, 60);
    ctx.lineTo(120, 200);
    ctx.lineTo(0, 200);
    ctx.closePath();
    ctx.fill();

    // Squiggle lines
    ctx.strokeStyle = "#ff2d95";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const sx = 130 + i * 25;
      ctx.moveTo(sx, 30);
      ctx.quadraticCurveTo(sx + 12, 60, sx + 25, 30);
    }
    ctx.stroke();

    // Circles
    ctx.fillStyle = "#00bfff";
    ctx.beginPath();
    ctx.arc(190, 150, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#39ff14";
    ctx.beginPath();
    ctx.arc(60, 280, 25, 0, Math.PI * 2);
    ctx.fill();

    // Zigzag
    ctx.strokeStyle = "#ff6f61";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(20, 340);
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(40 + i * 35, 340 + (i % 2 === 0 ? -20 : 0));
    }
    ctx.stroke();

    // Dots pattern
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(20 + i * 30, 240, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Neon "ESPRESSO" sign texture. */
function createNeonSignTexture() {
  return makeCanvasTexture(512, 128, (ctx) => {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 512, 128);

    // Glow effect
    ctx.shadowColor = "#ff2d95";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ff2d95";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ESPRESSO", 256, 64);
    // Second pass for brighter core
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff8fc0";
    ctx.fillText("ESPRESSO", 256, 64);
  });
}

/** CRT screen texture for the POS terminal. */
function createPosScreenTexture() {
  return makeCanvasTexture(256, 192, (ctx) => {
    ctx.fillStyle = "#0a1a0a";
    ctx.fillRect(0, 0, 256, 192);

    ctx.fillStyle = "#33ff66";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText("*** CAFE POS ***", 12, 28);
    ctx.fillText("----------------", 12, 50);
    ctx.fillText("CAPPUCCINO  $0.95", 12, 74);
    ctx.fillText("CROISSANT   $0.75", 12, 96);
    ctx.fillText("----------------", 12, 118);
    ctx.fillText("TOTAL       $1.70", 12, 142);
    ctx.fillText("TAX          $0.11", 12, 164);
    ctx.fillText("DUE         $1.81", 12, 184);
  });
}

/** Boombox speaker grille texture. */
function createSpeakerGrilleTexture() {
  return makeCanvasTexture(128, 128, (ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#2a2a2a";
    for (let y = 4; y < 128; y += 8) {
      for (let x = 4; x < 128; x += 8) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// ---------------------------------------------------------------------------
//  Geometry / mesh helpers
// ---------------------------------------------------------------------------

/**
 * Recursively dispose all geometries and materials in a group.
 * @param {THREE.Object3D} obj
 */
function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }
  });
}

/**
 * Create a tubular steel table (1980s café style).
 * @returns {THREE.Group}
 */
function createTubularTable() {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({
    color: PAL.white,
    roughness: 0.5,
    metalness: 0.1,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: PAL.tubularSteel,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Tabletop — round
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16), topMat);
  top.position.y = 0.74;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Central pedestal (tubular steel)
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 8), steelMat);
  pedestal.position.y = 0.36;
  group.add(pedestal);

  // Base disc
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), steelMat);
  base.position.y = 0.015;
  group.add(base);

  return group;
}

/**
 * Create a tubular steel chair (1980s café style).
 * @returns {THREE.Group}
 */
function createTubularChair() {
  const group = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({
    color: PAL.black,
    roughness: 0.6,
    metalness: 0.1,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    color: PAL.tubularSteel,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Seat
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12), seatMat);
  seat.position.y = 0.44;
  seat.castShadow = true;
  group.add(seat);

  // Backrest — curved tubular steel (approximated with a thin box)
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.4), steelMat);
  back.position.set(0, 0.64, -0.19);
  group.add(back);

  // Backrest top bar
  const backTop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), steelMat);
  backTop.rotation.z = Math.PI / 2;
  backTop.position.set(0, 0.84, -0.19);
  group.add(backTop);

  // Legs — 4 tubular steel legs
  const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.43, 6);
  const legPositions = [
    [0.16, 0, 0.16],
    [-0.16, 0, 0.16],
    [0.16, 0, -0.16],
    [-0.16, 0, -0.16],
  ];
  for (const [x, , z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, steelMat);
    leg.position.set(x, 0.215, z);
    group.add(leg);
  }

  return group;
}

/**
 * Create a commercial espresso grinder.
 * @returns {THREE.Group}
 */
function createEspressoGrinder() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: PAL.grinderRed,
    roughness: 0.4,
    metalness: 0.3,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: PAL.black,
    roughness: 0.5,
    metalness: 0.2,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: PAL.chrome,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), bodyMat);
  body.position.y = 0.2;
  body.castShadow = true;
  group.add(body);

  // Hopper (inverted cone on top)
  const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 12), darkMat);
  hopper.position.y = 0.5;
  group.add(hopper);

  // Hopper cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), darkMat);
  cap.position.y = 0.62;
  group.add(cap);

  // Spout / chute
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8), chromeMat);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(0, 0.12, 0.17);
  group.add(spout);

  // Dosing portafilter fork
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.06), chromeMat);
  fork.position.set(0, 0.08, 0.18);
  group.add(fork);

  return group;
}

/**
 * Create an espresso machine (commercial, 1980s style).
 * @returns {THREE.Group}
 */
function createEspressoMachine() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: PAL.espressoBody,
    roughness: 0.3,
    metalness: 0.6,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: PAL.chrome,
    roughness: 0.15,
    metalness: 0.95,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb8860b,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.45), bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  group.add(body);

  // Top panel
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.47), chromeMat);
  top.position.y = 0.52;
  group.add(top);

  // Group heads (2 portafilter groups)
  for (const x of [-0.2, 0.2]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12), chromeMat);
    head.position.set(x, 0.18, 0.24);
    group.add(head);

    // Portafilter handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8), brassMat);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(x, 0.12, 0.33);
    group.add(handle);
  }

  // Steam wand
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6), chromeMat);
  wand.rotation.x = Math.PI / 2.5;
  wand.position.set(0.35, 0.2, 0.2);
  group.add(wand);

  // Pressure gauge
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), chromeMat);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(-0.3, 0.4, 0.24);
  group.add(gauge);

  return group;
}

/**
 * Create a digital menu board (LED-style, wall-mounted).
 * @returns {THREE.Group}
 */
function createDigitalMenuBoard() {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: PAL.black,
    roughness: 0.5,
    metalness: 0.3,
  });

  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.06), frameMat);
  frame.position.y = 0.45;
  frame.castShadow = true;
  group.add(frame);

  // Screen with canvas texture
  const screenMat = new THREE.MeshStandardMaterial({
    map: createMenuBoardTexture(),
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0x222222,
    emissiveIntensity: 0.4,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.78), screenMat);
  screen.position.set(0, 0.45, 0.032);
  group.add(screen);

  return group;
}

/**
 * Create a boombox (1980s portable stereo).
 * @returns {THREE.Group}
 */
function createBoombox() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: PAL.black,
    roughness: 0.4,
    metalness: 0.3,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: PAL.chrome,
    roughness: 0.2,
    metalness: 0.9,
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    map: createSpeakerGrilleTexture(),
    roughness: 0.6,
    metalness: 0.2,
  });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.2), bodyMat);
  body.position.y = 0.225;
  body.castShadow = true;
  group.add(body);

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 16, Math.PI), chromeMat);
  handle.position.set(0, 0.46, 0);
  handle.rotation.x = Math.PI;
  group.add(handle);

  // Two speaker grilles
  for (const x of [-0.2, 0.2]) {
    const grille = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), grilleMat);
    grille.position.set(x, 0.225, 0.101);
  group.add(grille);
  }

  // Cassette deck slot
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.01), chromeMat);
  slot.position.set(0, 0.15, 0.101);
  group.add(slot);

  // Tuning display
  const display = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.01), chromeMat);
  display.position.set(0, 0.35, 0.101);
  group.add(display);

  return group;
}

/**
 * Create a Memphis/neon-style wall poster.
 * @param {number} variant
 * @returns {THREE.Group}
 */
function createPoster(variant) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: createMemphisPosterTexture(variant),
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), mat);
  poster.castShadow = false;
  group.add(poster);
  return group;
}

/**
 * Create a neon "ESPRESSO" sign (wall-mounted).
 * @returns {THREE.Group}
 */
function createNeonSign() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: createNeonSignTexture(),
    transparent: true,
    roughness: 0.3,
    metalness: 0.0,
    emissive: 0xff2d95,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), mat);
  group.add(sign);
  return group;
}

/**
 * Create a stoneware mug.
 * @returns {THREE.Group}
 */
function createStonewareMug() {
  const group = new THREE.Group();
  const mugMat = new THREE.MeshStandardMaterial({
    color: PAL.stoneware,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Mug body — hollow cylinder
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 12), mugMat);
  body.position.y = 0.05;
  body.castShadow = true;
  group.add(body);

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12, Math.PI), mugMat);
  handle.position.set(0.055, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  return group;
}

/**
 * Create a track lighting fixture.
 * @returns {THREE.Group}
 */
function createTrackLight() {
  const group = new THREE.Group();
  const railMat = new THREE.MeshStandardMaterial({
    color: PAL.trackRail,
    roughness: 0.4,
    metalness: 0.7,
  });
  const lampMat = new THREE.MeshStandardMaterial({
    color: PAL.chromeDark,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Track rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.04), railMat);
  group.add(rail);

  // 3 spotlights along the rail
  for (const x of [-0.6, 0, 0.6]) {
    // Lamp head (cylinder)
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 10), lampMat);
    head.position.set(x, -0.08, 0);
    head.rotation.x = Math.PI / 4;
    group.add(head);

    // Arm connecting to rail
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), railMat);
    arm.position.set(x, -0.02, 0);
    group.add(arm);

    // Light source (actual PointLight for illumination)
    const light = new THREE.PointLight(0xfff0d0, 0.4, 4, 1.5);
    light.position.set(x, -0.14, 0.05);
    group.add(light);
  }

  return group;
}

/**
 * Create an early POS terminal (CRT monitor + keyboard).
 * @returns {THREE.Group}
 */
function createPosTerminal() {
  const group = new THREE.Group();
  const caseMat = new THREE.MeshStandardMaterial({
    color: PAL.posBeige,
    roughness: 0.6,
    metalness: 0.1,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: PAL.posDark,
    roughness: 0.5,
    metalness: 0.2,
  });

  // CRT monitor body
  const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.35), caseMat);
  monitor.position.set(0, 0.5, 0);
  monitor.castShadow = true;
  group.add(monitor);

  // CRT screen (recessed, with green text texture)
  const screenMat = new THREE.MeshStandardMaterial({
    map: createPosScreenTexture(),
    roughness: 0.2,
    metalness: 0.0,
    emissive: 0x113311,
    emissiveIntensity: 0.5,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), screenMat);
  screen.position.set(0, 0.5, 0.176);
  group.add(screen);

  // Monitor stand
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 8), caseMat);
  stand.position.set(0, 0.29, 0);
  group.add(stand);

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 0.2), caseMat);
  base.position.set(0, 0.25, 0);
  group.add(base);

  // Keyboard
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 0.2), caseMat);
  keyboard.position.set(0, 0.015, 0.28);
  keyboard.castShadow = true;
  group.add(keyboard);

  // Keyboard keys (grid of small boxes)
  const keyMat = new THREE.MeshStandardMaterial({ color: PAL.white, roughness: 0.5 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.03), keyMat);
      key.position.set(-0.13 + col * 0.038, 0.035, 0.22 + row * 0.045);
      group.add(key);
    }
  }

  // Receipt printer (small box on side)
  const printer = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.15), darkMat);
  printer.position.set(0.28, 0.06, 0.1);
  group.add(printer);

  return group;
}

/**
 * Create a low-poly stylized patron figure with 1980s attire.
 * @param {object} opts — { jacketColor, shirtColor, pantsColor, hasWalkman }
 * @returns {THREE.Group}
 */
function createPatron(opts) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: PAL.patronSkin,
    roughness: 0.8,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: PAL.patronHair,
    roughness: 0.9,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: opts.jacketColor,
    roughness: 0.6,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: opts.shirtColor,
    roughness: 0.7,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: opts.pantsColor,
    roughness: 0.7,
  });

  // Head
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  g.add(head);

  // Hair (slightly larger sphere on top)
  const hair = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), hairMat);
  hair.position.y = 1.6;
  g.add(hair);

  // Torso (jacket)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.2), jacketMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  g.add(torso);

  // Shirt collar (small box at neck)
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.18), shirtMat);
  collar.position.y = 1.3;
  g.add(collar);

  // Arms (2 boxes)
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), jacketMat);
    arm.position.set(side * 0.2, 1.1, 0);
    arm.castShadow = true;
    g.add(arm);
  }

  // Legs (2 boxes)
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.14), pantsMat);
    leg.position.set(side * 0.09, 0.55, 0);
    leg.castShadow = true;
    g.add(leg);
  }

  // Walkman / gadget (if enabled)
  if (opts.hasWalkman) {
    const walkmanMat = new THREE.MeshStandardMaterial({
      color: PAL.black,
      roughness: 0.4,
      metalness: 0.3,
  });
    // Walkman body clipped to belt
    const walkman = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), walkmanMat);
    walkman.position.set(0.15, 0.82, 0.1);
    g.add(walkman);

    // Headphones band
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 16, Math.PI), walkmanMat);
    band.position.set(0, 1.68, 0);
    band.rotation.x = Math.PI / 2;
    g.add(band);

    // Ear pads
    for (const side of [-1, 1]) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), walkmanMat);
      pad.position.set(side * 0.1, 1.58, 0);
      pad.rotation.x = Math.PI / 2;
      g.add(pad);
    }
  }

  return g;
}

// ---------------------------------------------------------------------------
//  Period setup / teardown
// ---------------------------------------------------------------------------

/**
 * Setup function for the 1985 period — adds all content to the group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
function setup1985(scene, group) {
  const { width, depth, height } = CAFE_DIMENSIONS;
  const hw = width / 2;
  const hd = depth / 2;

  // ---- 1. Furniture: tubular steel tables & chairs ----
  // 4 table clusters arranged in the café
  const tablePositions = [
    [-2.5, 2], [2.5, 2],
    [-2.5, -1], [2.5, -1],
  ];
  for (const [x, z] of tablePositions) {
    const table = createTubularTable();
    table.position.set(x, 0, z);
    group.add(table);

    // 2 chairs per table
    for (const [dx, dz] of [[0, 0.65], [0, -0.65]]) {
      const chair = createTubularChair();
      chair.position.set(x + dx, 0, z + dz);
      if (dz < 0) chair.rotation.y = Math.PI;
      group.add(chair);
    }

    // 6. Tableware: stoneware mugs on tables
    const mug = createStonewareMug();
    mug.position.set(x + 0.15, 0.78, z - 0.1);
    group.add(mug);
  }

  // ---- 2. Coffee equipment: espresso machine + grinder on counter ----
  // Counter (simple box against back wall)
  const counterMat = new THREE.MeshStandardMaterial({
    color: PAL.black,
    roughness: 0.4,
    metalness: 0.2,
  });
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.9, 0.6), counterMat);
  counter.position.set(0, 0.45, hd - 0.5);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Espresso machine on counter
  const espressoMachine = createEspressoMachine();
  espressoMachine.position.set(-0.5, 0.9, hd - 0.5);
  group.add(espressoMachine);

  // Espresso grinder on counter
  const grinder = createEspressoGrinder();
  grinder.position.set(0.3, 0.9, hd - 0.5);
  group.add(grinder);

  // ---- 3. Menu board: digital LED board above counter ----
  const menuBoard = createDigitalMenuBoard();
  menuBoard.position.set(0, 2.4, hd - 0.35);
  group.add(menuBoard);

  // ---- 4. Music source: boombox on a shelf near the wall ----
  const boombox = createBoombox();
  boombox.position.set(-3.5, 2.0, hd - 0.3);
  group.add(boombox);

  // ---- 5. Posters: Memphis/neon-style posters on side walls ----
  // Left wall posters
  for (let i = 0; i < 3; i++) {
    const poster = createPoster(i);
    poster.position.set(-hw + 0.05, 2.0, -4 + i * 4);
    poster.rotation.y = Math.PI / 2;
    group.add(poster);
  }
  // Right wall posters
  for (let i = 0; i < 3; i++) {
    const poster = createPoster(i + 3);
    poster.position.set(hw - 0.05, 2.0, -4 + i * 4);
    poster.rotation.y = -Math.PI / 2;
    group.add(poster);
  }

  // ---- 7a. Signage: neon ESPRESSO sign on back wall ----
  const neonSign = createNeonSign();
  neonSign.position.set(3.0, 2.8, hd - 0.1);
  group.add(neonSign);

  // ---- 7b. Lighting: track lighting on ceiling ----
  // 2 track light rows
  for (const z of [1.5, -2.5]) {
    const track = createTrackLight();
    track.position.set(0, height - 0.15, z);
    group.add(track);
  }

  // ---- 9. Counter technology: early POS terminal ----
  const posTerminal = createPosTerminal();
  posTerminal.position.set(1.2, 0.9, hd - 0.55);
  group.add(posTerminal);

  // ---- 10. Patrons: 1980s-attired figures with gadgets ----
  // Patron 1 — blue jacket, walkman, at table
  const patron1 = createPatron({
    jacketColor: PAL.jacketBlue,
    shirtColor: PAL.shirtWhite,
    pantsColor: PAL.pants,
    hasWalkman: true,
  });
  patron1.position.set(-2.5, 0, 2.65);
  patron1.rotation.y = Math.PI;
  group.add(patron1);

  // Patron 2 — pink jacket, at table
  const patron2 = createPatron({
    jacketColor: PAL.jacketPink,
    shirtColor: PAL.shirtCyan,
    pantsColor: PAL.pantsKhaki,
    hasWalkman: false,
  });
  patron2.position.set(2.5, 0, 2.65);
  patron2.rotation.y = Math.PI;
  group.add(patron2);

  // Patron 3 — cyan shirt, walkman, at counter
  const patron3 = createPatron({
    jacketColor: PAL.shirtCyan,
    shirtColor: PAL.shirtWhite,
    pantsColor: PAL.pants,
    hasWalkman: true,
  });
  patron3.position.set(-1.0, 0, hd - 1.5);
  group.add(patron3);

  // Patron 4 — white jacket, at table
  const patron4 = createPatron({
    jacketColor: PAL.shirtWhite,
    shirtColor: PAL.neonPink,
    pantsColor: PAL.pants,
    hasWalkman: false,
  });
  patron4.position.set(2.5, 0, -1.65);
  group.add(patron4);

  // Patron 5 — blue jacket, at table
  const patron5 = createPatron({
    jacketColor: PAL.jacketBlue,
    shirtColor: PAL.memphisYellow,
    pantsColor: PAL.pantsKhaki,
    hasWalkman: false,
  });
  patron5.position.set(-2.5, 0, -1.65);
  patron5.rotation.y = Math.PI;
  group.add(patron5);
}

/**
 * Teardown function for the 1985 period — disposes all resources.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
function teardown1985(scene, group) {
  disposeObject(group);
}

// ---------------------------------------------------------------------------
//  Registration
// ---------------------------------------------------------------------------

/**
 * Register the 1985 period with the given PeriodManager.
 * @param {import("./period-manager.js").PeriodManager} periodManager
 */
export function registerPeriod1985(periodManager) {
  periodManager.registerPeriod(1985, setup1985, teardown1985);
}
