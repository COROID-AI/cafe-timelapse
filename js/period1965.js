/**
 * period1965.js — Mid-1960s café period content.
 *
 * Covers all 10 detail categories from README.md:
 *  1. Chrome-legged tables with vinyl booths
 *  2. Faema E61 espresso machine (with group head)
 *  3. Menu board with 1965 prices (canvas texture)
 *  4. Tabletop jukebox (wallbox selector with buttons + record disc)
 *  5. Pop-art posters (canvas textures)
 *  6. Melamine cups in pastel colors
 *  7. Neon signage (emissive MeshStandardMaterial)
 *  8. Fluorescent ceiling lights
 *  9. Electric cash register (chrome)
 * 10. 3-4 stylized 1960s patrons (low-poly, mod attire)
 *
 * All geometry is procedural; all textures are canvas-generated.
 */

import * as THREE from "three";
import { CAFE_DIMENSIONS } from "./config.js";

// ---------------------------------------------------------------------------
// Shared materials (created once per setup, disposed in teardown)
// ---------------------------------------------------------------------------

let _chromeMat = null;
let _vinylMat = null;
let _formicaMat = null;

function makeChromeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.9,
    roughness: 0.15,
  });
}

function makeVinylMaterial(color = 0xb03030) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.05,
  });
}

// ---------------------------------------------------------------------------
// Canvas-texture helpers
// ---------------------------------------------------------------------------

/**
 * Create a THREE.CanvasTexture from a draw callback.
 * @param {number} w
 * @param {number} h
 * @param {(ctx: CanvasRenderingContext2D, w: number, h: number) => void} draw
 * @returns {THREE.CanvasTexture}
 */
function makeCanvasTexture(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

/** Menu board texture — dark board with cream text listing 1965 prices. */
function makeMenuBoardTexture() {
  return makeCanvasTexture(1024, 512, (ctx, w, h) => {
    // Background — chalkboard green-black
    ctx.fillStyle = "#1a2a1a";
    ctx.fillRect(0, 0, w, h);
    // Subtle chalk noise
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // Title
    ctx.fillStyle = "#f5f0d8";
    ctx.font = "bold 64px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("MENU", w / 2, 80);
    ctx.font = "italic 28px Georgia, serif";
    ctx.fillText("— 1965 —", w / 2, 120);

    // Items
    ctx.textAlign = "left";
    ctx.font = "bold 44px Georgia, serif";
    const items = [
      ["espresso", "25¢"],
      ["coffee", "15¢"],
      ["cappuccino", "35¢"],
    ];
    let y = 210;
    for (const [name, price] of items) {
      ctx.fillStyle = "#f5f0d8";
      ctx.fillText(name, 120, y);
      ctx.textAlign = "right";
      ctx.fillText(price, w - 120, y);
      ctx.textAlign = "left";
      // dotted leader line
      ctx.fillStyle = "rgba(245,240,216,0.4)";
      const nameW = ctx.measureText(name).width;
      const priceW = ctx.measureText(price).width;
      const startX = 120 + nameW + 20;
      const endX = w - 120 - priceW - 20;
      ctx.fillRect(startX, y - 8, Math.max(0, endX - startX), 3);
      y += 90;
    }
  });
}

/** Pop-art poster texture — bold geometric shapes in primary colors. */
function makePopArtTexture(variant) {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    // Background
    const bgColors = ["#ffec5c", "#ff5c5c", "#5cb8ff"];
    ctx.fillStyle = bgColors[variant % bgColors.length];
    ctx.fillRect(0, 0, w, h);

    if (variant % 3 === 0) {
      // Concentric circles (Lichtenstein-esque)
      const ringColors = ["#1a1a8a", "#e63329", "#ffffff"];
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = ringColors[i % ringColors.length];
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, w / 2 - i * 30, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (variant % 3 === 1) {
      // Diagonal stripes
      const stripeColors = ["#1a1a8a", "#e63329", "#ffffff", "#1a1a8a"];
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 4);
      ctx.translate(-w, -h);
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = stripeColors[i % stripeColors.length];
        ctx.fillRect(i * (w / 8), 0, w / 16, h * 2);
      }
      ctx.restore();
    } else {
      // Bold dot grid (Warhol-esque)
      ctx.fillStyle = "#1a1a8a";
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if ((r + c) % 2 === 0) {
            ctx.beginPath();
            ctx.arc(c * 64 + 32, r * 64 + 32, 24, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
  });
}

/** Formica tabletop texture — speckled pattern. */
function makeFormicaTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#d8d0c0";
    ctx.fillRect(0, 0, w, h);
    // Speckles
    const speckleColors = ["#b8b0a0", "#c8c0b0", "#a8a098", "#e0d8c8"];
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = speckleColors[i % speckleColors.length];
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

// ---------------------------------------------------------------------------
// Builder helpers
// ---------------------------------------------------------------------------

/**
 * Build a single chrome-legged diner table with a Formica top.
 * @param {number} x
 * @param {number} z
 * @param {number} topRadius
 * @returns {THREE.Group}
 */
function buildDinerTable(x, z, topRadius = 0.9) {
  const group = new THREE.Group();
  group.name = `table-${x.toFixed(1)}-${z.toFixed(1)}`;

  const topHeight = 0.75;

  // Formica top (cylinder)
  const topGeo = new THREE.CylinderGeometry(topRadius, topRadius, 0.05, 24);
  const top = new THREE.Mesh(topGeo, _formicaMat);
  top.position.set(0, topHeight, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Chrome rim around top edge
  const rimGeo = new THREE.TorusGeometry(topRadius, 0.03, 8, 24);
  const rim = new THREE.Mesh(rimGeo, _chromeMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, topHeight, 0);
  group.add(rim);

  // Central chrome pedestal
  const pedGeo = new THREE.CylinderGeometry(0.06, 0.08, topHeight - 0.05, 12);
  const pedestal = new THREE.Mesh(pedGeo, _chromeMat);
  pedestal.position.set(0, (topHeight - 0.05) / 2, 0);
  pedestal.castShadow = true;
  group.add(pedestal);

  // Chrome base disc
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 20);
  const base = new THREE.Mesh(baseGeo, _chromeMat);
  base.position.set(0, 0.02, 0);
  base.castShadow = true;
  group.add(base);

  group.position.set(x, 0, z);
  return group;
}

/**
 * Build a vinyl booth bench along a wall.
 * @param {number} x
 * @param {number} z
 * @param {number} facingDir — 1 faces +X, -1 faces -X
 * @returns {THREE.Group}
 */
function buildVinylBooth(x, z, facingDir) {
  const group = new THREE.Group();
  group.name = `booth-${x.toFixed(1)}-${z.toFixed(1)}`;

  const seatMat = _vinylMat;
  const backMat = makeVinylMaterial(0x8a2020);

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.6, 0.12, 1.6);
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.set(0, 0.45, 0);
  seat.castShadow = true;
  group.add(seat);

  // Backrest
  const backGeo = new THREE.BoxGeometry(0.12, 0.7, 1.6);
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.set(facingDir * 0.3, 0.8, 0);
  back.castShadow = true;
  group.add(back);

  // Chrome legs
  for (const sz of [-0.7, 0.7]) {
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
    const leg = new THREE.Mesh(legGeo, _chromeMat);
    leg.position.set(0, 0.22, sz);
    group.add(leg);
  }

  group.position.set(x, 0, z);
  return group;
}

/**
 * Build the Faema E61 espresso machine with a visible group head.
 * @param {number} x
 * @param {number} y  — counter surface height
 * @param {number} z
 * @returns {THREE.Group}
 */
function buildEspressoMachine(x, y, z) {
  const group = new THREE.Group();
  group.name = "espresso-machine";

  // Main body — chrome cylindrical body
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.5, 24);
  const body = new THREE.Mesh(bodyGeo, _chromeMat);
  body.position.set(0, 0.25, 0);
  body.castShadow = true;
  group.add(body);

  // Top dome
  const domeGeo = new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, _chromeMat);
  dome.position.set(0, 0.5, 0);
  group.add(dome);

  // Steam wand (chrome tube)
  const wandGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  const wand = new THREE.Mesh(wandGeo, _chromeMat);
  wand.position.set(0.3, 0.35, 0);
  wand.rotation.z = Math.PI / 3;
  group.add(wand);

  // Group head — cylindrical protrusion on the FRONT (negative Z) of the body
  const groupHeadGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.18, 16);
  const groupHead = new THREE.Mesh(groupHeadGeo, _chromeMat);
  groupHead.rotation.x = Math.PI / 2;
  groupHead.position.set(0, 0.2, -0.32);
  group.add(groupHead);

  // Portafilter handle below group head
  const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
  const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 }));
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, 0.1, -0.42);
  group.add(handle);

  // Pressure gauge (small disc on front)
  const gaugeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
  const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.3 });
  const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0.15, 0.35, -0.29);
  group.add(gauge);

  group.position.set(x, y, z);
  return group;
}

/**
 * Build a menu board mounted on the back wall.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {THREE.Group}
 */
function buildMenuBoard(x, y, z) {
  const group = new THREE.Group();
  group.name = "menu-board";

  const boardW = 2.4;
  const boardH = 1.2;

  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a3c2e, roughness: 0.7 });
  const frameGeo = new THREE.BoxGeometry(boardW + 0.16, boardH + 0.16, 0.06);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.01;
  group.add(frame);

  // Board surface with canvas texture
  const menuTex = makeMenuBoardTexture();
  const boardMat = new THREE.MeshStandardMaterial({
    map: menuTex,
    roughness: 0.6,
    metalness: 0.0,
  });
  boardMat.userData.canvasTexture = menuTex; // track for disposal
  const boardGeo = new THREE.PlaneGeometry(boardW, boardH);
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.z = 0.03;
  group.add(board);

  group.position.set(x, y, z);
  return group;
}

/**
 * Build a tabletop jukebox (wallbox-style selector) with buttons + record disc.
 * @param {number} x
 * @param {number} y  — table surface height
 * @param {number} z
 * @returns {THREE.Group}
 */
function buildJukebox(x, y, z) {
  const group = new THREE.Group();
  group.name = "jukebox";

  // Housing — chrome box
  const housingGeo = new THREE.BoxGeometry(0.35, 0.45, 0.25);
  const housing = new THREE.Mesh(housingGeo, _chromeMat);
  housing.position.set(0, 0.225, 0);
  housing.castShadow = true;
  group.add(housing);

  // Title strip panel (dark)
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.4 });
  const panelGeo = new THREE.BoxGeometry(0.3, 0.12, 0.02);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 0.38, 0.13);
  group.add(panel);

  // Selector buttons — small colored cylinders in a grid
  const buttonColors = [0xe63329, 0xffec5c, 0x1a8a1a, 0x5c5cff, 0xff8c00, 0xff5cb8];
  let idx = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const btnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12);
      const btnMat = new THREE.MeshStandardMaterial({
        color: buttonColors[idx % buttonColors.length],
        roughness: 0.3,
        metalness: 0.2,
      });
      const btn = new THREE.Mesh(btnGeo, btnMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(-0.07 + col * 0.14, 0.28 - row * 0.06, 0.13);
      group.add(btn);
      idx++;
    }
  }

  // Record disc — visible at the bottom front
  const discMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.4 });
  const discGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.015, 24);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.set(0, 0.12, 0.13);
  group.add(disc);

  // Record label (colored center)
  const labelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.018, 16);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xe63329, roughness: 0.4 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0.128, 0.13);
  group.add(label);

  group.position.set(x, y, z);
  return group;
}

/**
 * Build a pop-art poster on a wall.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} rotY
 * @param {number} variant
 * @returns {THREE.Group}
 */
function buildPoster(x, y, z, rotY, variant) {
  const group = new THREE.Group();
  group.name = `poster-${variant}`;

  const pW = 1.0;
  const pH = 1.3;

  // Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const frameGeo = new THREE.BoxGeometry(pW + 0.08, pH + 0.08, 0.04);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  group.add(frame);

  // Poster image
  const posterTex = makePopArtTexture(variant);
  const posterMat = new THREE.MeshStandardMaterial({
    map: posterTex,
    roughness: 0.5,
    metalness: 0.0,
  });
  posterMat.userData.canvasTexture = posterTex;
  const posterGeo = new THREE.PlaneGeometry(pW, pH);
  const poster = new THREE.Mesh(posterGeo, posterMat);
  poster.position.z = 0.025;
  group.add(poster);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  return group;
}

/**
 * Build a melamine cup in a pastel color.
 * @param {number} color
 * @returns {THREE.Group}
 */
function buildMelamineCup(color) {
  const group = new THREE.Group();
  group.name = "melamine-cup";

  const cupMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.05,
  });

  // Cup body (hollow cylinder look)
  const bodyGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.12, 16);
  const body = new THREE.Mesh(bodyGeo, cupMat);
  body.position.y = 0.06;
  body.castShadow = true;
  group.add(body);

  // Rim
  const rimGeo = new THREE.TorusGeometry(0.05, 0.006, 6, 16);
  const rim = new THREE.Mesh(rimGeo, cupMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  group.add(rim);

  // Handle
  const handleGeo = new THREE.TorusGeometry(0.03, 0.008, 6, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeo, cupMat);
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.05, 0.07, 0);
  group.add(handle);

  return group;
}

/**
 * Build neon signage — glowing tube shapes on the wall.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} rotY
 * @returns {THREE.Group}
 */
function buildNeonSign(x, y, z, rotY) {
  const group = new THREE.Group();
  group.name = "neon-sign";

  // Backing panel (dark)
  const backMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const backGeo = new THREE.BoxGeometry(2.0, 0.7, 0.04);
  const back = new THREE.Mesh(backGeo, backMat);
  group.add(back);

  // Neon tube — "CAFE" represented as glowing tube segments
  const neonColor = 0xff33cc;
  const neonMat = new THREE.MeshStandardMaterial({
    color: neonColor,
    emissive: neonColor,
    emissiveIntensity: 0.9,
    roughness: 0.3,
    metalness: 0.0,
  });

  // Build letter-like tube shapes from torus segments + cylinders
  // C — left side
  const cGeo = new THREE.TorusGeometry(0.18, 0.018, 8, 24, Math.PI * 1.4);
  const c = new THREE.Mesh(cGeo, neonMat);
  c.position.set(-0.7, 0, 0.03);
  c.rotation.z = Math.PI / 2;
  group.add(c);

  // A — two angled cylinders + crossbar
  const aLeftGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8);
  const aLeft = new THREE.Mesh(aLeftGeo, neonMat);
  aLeft.position.set(-0.3, 0, 0.03);
  aLeft.rotation.z = Math.PI / 8;
  group.add(aLeft);
  const aRight = new THREE.Mesh(aLeftGeo.clone(), neonMat);
  aRight.position.set(-0.15, 0, 0.03);
  aRight.rotation.z = -Math.PI / 8;
  group.add(aRight);
  const aBarGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8);
  const aBar = new THREE.Mesh(aBarGeo, neonMat);
  aBar.position.set(-0.225, -0.05, 0.03);
  aBar.rotation.z = Math.PI / 2;
  group.add(aBar);

  // F — vertical + two horizontals
  const fVert = new THREE.Mesh(aLeftGeo.clone(), neonMat);
  fVert.position.set(0.15, 0, 0.03);
  group.add(fVert);
  const fTopGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8);
  const fTop = new THREE.Mesh(fTopGeo, neonMat);
  fTop.position.set(0.25, 0.1, 0.03);
  fTop.rotation.z = Math.PI / 2;
  group.add(fTop);
  const fMid = new THREE.Mesh(fTopGeo.clone(), neonMat);
  fMid.position.set(0.24, -0.02, 0.03);
  fMid.rotation.z = Math.PI / 2;
  group.add(fMid);

  // E — vertical + three horizontals
  const eVert = new THREE.Mesh(aLeftGeo.clone(), neonMat);
  eVert.position.set(0.55, 0, 0.03);
  group.add(eVert);
  const eTop = new THREE.Mesh(fTopGeo.clone(), neonMat);
  eTop.position.set(0.66, 0.1, 0.03);
  eTop.rotation.z = Math.PI / 2;
  group.add(eTop);
  const eMid = new THREE.Mesh(fTopGeo.clone(), neonMat);
  eMid.position.set(0.64, 0, 0.03);
  eMid.rotation.z = Math.PI / 2;
  group.add(eMid);
  const eBot = new THREE.Mesh(fTopGeo.clone(), neonMat);
  eBot.position.set(0.66, -0.1, 0.03);
  eBot.rotation.z = Math.PI / 2;
  group.add(eBot);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  return group;
}

/**
 * Build a fluorescent ceiling light fixture (emissive panel).
 * @param {number} x
 * @param {number} z
 * @returns {THREE.Group}
 */
function buildFluorescentLight(x, z) {
  const group = new THREE.Group();
  group.name = `fluorescent-light-${x.toFixed(1)}-${z.toFixed(1)}`;

  const ceilingY = CAFE_DIMENSIONS.height;

  // Fixture housing (thin box)
  const housingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.3 });
  const housingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.4);
  const housing = new THREE.Mesh(housingGeo, housingMat);
  housing.position.set(x, ceilingY - 0.06, z);
  group.add(housing);

  // Emissive panel (the glowing tube cover)
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffee,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });
  const panelGeo = new THREE.BoxGeometry(1.5, 0.02, 0.35);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(x, ceilingY - 0.11, z);
  group.add(panel);

  // Local point light for subtle illumination
  const light = new THREE.PointLight(0xffffee, 0.4, 6, 2);
  light.position.set(x, ceilingY - 0.15, z);
  group.add(light);

  return group;
}

/**
 * Build an electric cash register (chrome body with keys).
 * @param {number} x
 * @param {number} y  — counter surface height
 * @param {number} z
 * @returns {THREE.Group}
 */
function buildCashRegister(x, y, z) {
  const group = new THREE.Group();
  group.name = "cash-register";

  // Main body — chrome
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
  const body = new THREE.Mesh(bodyGeo, _chromeMat);
  body.position.set(0, 0.175, 0);
  body.castShadow = true;
  group.add(body);

  // Key row (small cylinders on top-front)
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const keyGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10);
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(-0.18 + i * 0.07, 0.37, -0.1);
    group.add(key);
  }

  // Display window (dark glass on top)
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x113311,
    emissive: 0x224422,
    emissiveIntensity: 0.3,
    roughness: 0.2,
  });
  const displayGeo = new THREE.BoxGeometry(0.3, 0.1, 0.02);
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, 0.36, -0.2);
  group.add(display);

  // Cash drawer (front)
  const drawerMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.7 });
  const drawerGeo = new THREE.BoxGeometry(0.45, 0.08, 0.05);
  const drawer = new THREE.Mesh(drawerGeo, drawerMat);
  drawer.position.set(0, 0.05, -0.21);
  group.add(drawer);

  // Crank lever (side)
  const crankGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
  const crank = new THREE.Mesh(crankGeo, _chromeMat);
  crank.position.set(0.27, 0.25, 0);
  crank.rotation.z = Math.PI / 2;
  group.add(crank);

  group.position.set(x, y, z);
  return group;
}

/**
 * Build a stylized low-poly 1960s patron.
 * @param {number} x
 * @param {number} z
 * @param {number} rotY
 * @param {object} opts — { dressColor, suitColor, hairStyle, hairColor }
 * @returns {THREE.Group}
 */
function buildPatron(x, z, rotY, opts) {
  const group = new THREE.Group();
  group.name = `patron-${x.toFixed(1)}-${z.toFixed(1)}`;

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0b894, roughness: 0.7 });

  // Legs
  const legMat = new THREE.MeshStandardMaterial({
    color: opts.suitColor ?? 0x1a1a3a,
    roughness: 0.7,
  });
  for (const sx of [-0.1, 0.1]) {
    const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.8, 8);
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(sx, 0.4, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Torso — dress (tapered cylinder) for mod look, or box for suit
  if (opts.dressColor !== null && opts.dressColor !== undefined) {
    const dressMat = new THREE.MeshStandardMaterial({ color: opts.dressColor, roughness: 0.6 });
    const dressGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.7, 10);
    const dress = new THREE.Mesh(dressGeo, dressMat);
    dress.position.set(0, 1.05, 0);
    dress.castShadow = true;
    group.add(dress);
  } else {
    const suitMat = new THREE.MeshStandardMaterial({
      color: opts.suitColor ?? 0x1a1a3a,
      roughness: 0.6,
    });
    const torsoGeo = new THREE.BoxGeometry(0.36, 0.7, 0.22);
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 1.05, 0);
    torso.castShadow = true;
    group.add(torso);
  }

  // Arms
  const armMat = new THREE.MeshStandardMaterial({
    color: opts.dressColor ?? opts.suitColor ?? 0x1a1a3a,
    roughness: 0.6,
  });
  for (const sx of [-0.24, 0.24]) {
    const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.6, 8);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(sx, 1.05, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  // Head
  const headGeo = new THREE.SphereGeometry(0.12, 12, 10);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.55, 0);
  head.castShadow = true;
  group.add(head);

  // Hair — beehive (elongated cone) or slim (close cap)
  const hairMat = new THREE.MeshStandardMaterial({
    color: opts.hairColor ?? 0x3a2010,
    roughness: 0.8,
  });
  if (opts.hairStyle === "beehive") {
    const hiveGeo = new THREE.ConeGeometry(0.14, 0.25, 12);
    const hive = new THREE.Mesh(hiveGeo, hairMat);
    hive.position.set(0, 1.72, 0);
    group.add(hive);
  } else {
    const capGeo = new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, hairMat);
    cap.position.set(0, 1.58, 0);
    group.add(cap);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  return group;
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

/**
 * Set up the 1965 period: add all 10 detail categories to the group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function setupPeriod1965(scene, group) {
  // Initialise shared materials
  _chromeMat = makeChromeMaterial();
  _vinylMat = makeVinylMaterial(0xb03030);
  _formicaMat = new THREE.MeshStandardMaterial({
    map: makeFormicaTexture(),
    roughness: 0.4,
    metalness: 0.1,
  });
  _formicaMat.userData.canvasTexture = _formicaMat.map;

  const hd = CAFE_DIMENSIONS.depth / 2; // 8
  const hw = CAFE_DIMENSIONS.width / 2; // 6

  // ---- 1. Chrome-legged tables with vinyl booths ----
  const tablePositions = [
    { x: -2.5, z: -2 },
    { x: 2.5, z: -2 },
    { x: -2.5, z: 2 },
    { x: 2.5, z: 2 },
  ];
  for (const pos of tablePositions) {
    group.add(buildDinerTable(pos.x, pos.z));
  }

  // Vinyl booths along side walls
  group.add(buildVinylBooth(-(hw - 0.8), -2, 1));
  group.add(buildVinylBooth(hw - 0.8, -2, -1));
  group.add(buildVinylBooth(-(hw - 0.8), 2, 1));
  group.add(buildVinylBooth(hw - 0.8, 2, -1));

  // ---- Counter (back wall zone) ----
  const counterY = 0.9; // counter surface height
  const counterMat = new THREE.MeshStandardMaterial({ color: 0xd0c8b8, roughness: 0.5, metalness: 0.1 });
  const counterGeo = new THREE.BoxGeometry(6, 0.1, 0.8);
  const counter = new THREE.Mesh(counterGeo, counterMat);
  counter.position.set(0, counterY, hd - 1.2);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Counter front panel
  const counterFrontGeo = new THREE.BoxGeometry(6, counterY, 0.05);
  const counterFront = new THREE.Mesh(counterFrontGeo, counterMat);
  counterFront.position.set(0, counterY / 2, hd - 0.85);
  group.add(counterFront);

  // ---- 2. Faema E61 espresso machine ----
  group.add(buildEspressoMachine(-1.5, counterY + 0.05, hd - 1.3));

  // ---- 9. Electric cash register ----
  group.add(buildCashRegister(1.8, counterY + 0.05, hd - 1.3));

  // ---- 3. Menu board with 1965 prices ----
  group.add(buildMenuBoard(0, 2.8, hd - 0.06));

  // ---- 7. Neon signage ----
  group.add(buildNeonSign(0, 3.5, hd - 0.06, 0));

  // ---- 4. Tabletop jukebox ----
  group.add(buildJukebox(2.5, 0.78, -2));

  // ---- 5. Pop-art posters ----
  group.add(buildPoster(-(hw - 0.1), 2.2, -1, Math.PI / 2, 0));
  group.add(buildPoster(hw - 0.1, 2.2, 1, -Math.PI / 2, 1));
  group.add(buildPoster(-(hw - 0.1), 2.2, 3, Math.PI / 2, 2));

  // ---- 6. Melamine cups in pastel colors ----
  const pastelColors = [0xffb3cc, 0xb3d9ff, 0xb3ffd9, 0xffd9b3, 0xd9b3ff];
  const cupPositions = [
    { x: -2.5, z: -2 },
    { x: 2.5, z: -2 },
    { x: -2.5, z: 2 },
    { x: 2.5, z: 2 },
  ];
  cupPositions.forEach((pos, i) => {
    const cup = buildMelamineCup(pastelColors[i % pastelColors.length]);
    cup.position.set(pos.x + 0.2, 0.78, pos.z + 0.1);
    group.add(cup);
  });

  // ---- 8. Fluorescent ceiling lights ----
  group.add(buildFluorescentLight(0, -4));
  group.add(buildFluorescentLight(0, 0));
  group.add(buildFluorescentLight(0, 4));

  // ---- 10. Stylized 1960s patrons ----
  group.add(buildPatron(-2.3, -1.5, Math.PI / 6, {
    dressColor: 0xff6600,
    hairStyle: "beehive",
    hairColor: 0x2a1010,
  }));
  group.add(buildPatron(2.3, -1.5, -Math.PI / 6, {
    dressColor: 0xff3399,
    hairStyle: "beehive",
    hairColor: 0x3a2010,
  }));
  group.add(buildPatron(-2.3, 2.5, -Math.PI / 4, {
    suitColor: 0x1a1a3a,
    hairStyle: "cap",
    hairColor: 0x1a1010,
  }));
  group.add(buildPatron(2.8, 2.5, Math.PI / 4, {
    dressColor: 0xffffff,
    hairStyle: "beehive",
    hairColor: 0x5a3010,
  }));
}

/**
 * Recursively dispose all geometries, materials, and canvas textures in a node.
 * @param {THREE.Object3D} node
 */
function disposeNode(node) {
  if (node.isMesh) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const mat of mats) {
        // Dispose canvas textures stored on the material
        if (mat.userData && mat.userData.canvasTexture) {
          mat.userData.canvasTexture.dispose();
        }
        // Dispose standard map / emissiveMap if present
        if (mat.map) mat.map.dispose();
        if (mat.emissiveMap) mat.emissiveMap.dispose();
        mat.dispose();
      }
    }
  }
}

/**
 * Tear down the 1965 period: dispose all resources and clear the group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function teardownPeriod1965(scene, group) {
  group.traverse((node) => disposeNode(node));
  group.clear();

  // Reset shared materials so next setup creates fresh ones
  _chromeMat = null;
  _vinylMat = null;
  _formicaMat = null;
}
