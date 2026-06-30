/**
 * period2005.js — 2000s-era café period content (2005).
 *
 * Covers all 10 detail categories from the README:
 *  1. Furniture/decor   — modern wood/metal tables, molded plywood chairs, lounge sofa
 *  2. Coffee equipment  — semi-automatic espresso machine with PID display
 *  3. Menu board        — chalkboard with 2005 prices ($2.50-$4.25)
 *  4. Music source      — iPod dock with speaker system
 *  5. Posters/ads       — minimalist / fair-trade posters (canvas textures)
 *  6. Tableware         — ceramic to-go cups with sleeves
 *  7. Signage/lighting  — pendant lights over tables, backlit café sign
 *  8. Counter technology— touchscreen POS with emissive display + card reader
 *  9. Patrons           — 2000s-attired figures with flip phones
 * 10. (decor)           — modern counter bar, shelf, pendant lighting
 *
 * Exported functions are registered via PeriodManager.registerPeriod().
 */

import * as THREE from "three";
import { CAFE_DIMENSIONS } from "./config.js";

// ── Shared material palette (2005 modern bright/cool tones) ──────────────
const MAT = {
  woodLight: new THREE.MeshStandardMaterial({ color: 0xc4a47a, roughness: 0.6, metalness: 0.05 }),
  woodMed: new THREE.MeshStandardMaterial({ color: 0x8b6f4e, roughness: 0.65, metalness: 0.05 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.7, metalness: 0.05 }),
  brushedSteel: new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.85 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 0.95 }),
  blackMetal: new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 }),
  blackPlastic: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.2 }),
  whitePlastic: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4, metalness: 0.1 }),
  ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.2, metalness: 0.0 }),
  kraftPaper: new THREE.MeshStandardMaterial({ color: 0xc4a878, roughness: 0.9, metalness: 0.0 }),
  fabricCharcoal: new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.95, metalness: 0.0 }),
  fabricOlive: new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.95, metalness: 0.0 }),
  fabricDenim: new THREE.MeshStandardMaterial({ color: 0x3a4a6a, roughness: 0.95, metalness: 0.0 }),
  fabricBurgundy: new THREE.MeshStandardMaterial({ color: 0x6a2a3a, roughness: 0.95, metalness: 0.0 }),
  fabricCream: new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.95, metalness: 0.0 }),
  fabricBlack: new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.95, metalness: 0.0 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd4a878, roughness: 0.8, metalness: 0.0 }),
  skinDark: new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.8, metalness: 0.0 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9, metalness: 0.0 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.6 }),
};

// ── Canvas texture helpers ──────────────────────────────────────────────

/**
 * Create a chalkboard menu texture with 2005 prices.
 */
function createChalkboardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  // Dark chalkboard background
  ctx.fillStyle = "#1a2a1a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Chalk dust smudges
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 20 + Math.random() * 60;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Title
  ctx.fillStyle = "#e8e8d8";
  ctx.font = "bold 64px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("— ESPRESSO BAR —", canvas.width / 2, 80);

  // Decorative line
  ctx.strokeStyle = "#e8e8d8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, 110);
  ctx.lineTo(canvas.width - 200, 110);
  ctx.stroke();

  // Menu items with 2005 prices
  ctx.font = "44px Georgia, serif";
  ctx.textAlign = "left";
  const items = [
    { name: "Espresso", price: "$2.50" },
    { name: "Cappuccino", price: "$3.25" },
    { name: "Caffè Latte", price: "$3.50" },
    { name: "Mocha", price: "$3.75" },
    { name: "Macchiato", price: "$3.00" },
    { name: "Americano", price: "$2.75" },
    { name: "Cold Brew", price: "$3.50" },
    { name: "Pastry", price: "$2.50" },
    { name: "Sandwich", price: "$4.25" },
  ];

  let y = 170;
  for (const item of items) {
    ctx.fillStyle = "#e8e8d8";
    ctx.fillText(item.name, 120, y);
    ctx.textAlign = "right";
    ctx.fillText(item.price, canvas.width - 120, y);
    ctx.textAlign = "left";
    // Dotted line between name and price
    ctx.fillStyle = "rgba(232,232,216,0.4)";
    const nameWidth = ctx.measureText(item.name).width;
    const priceWidth = ctx.measureText(item.price).width;
    const startX = 120 + nameWidth + 20;
    const endX = canvas.width - 120 - priceWidth - 20;
    for (let x = startX; x < endX; x += 12) {
      ctx.fillText("·", x, y);
    }
    y += 62;
  }

  // Footer note
  ctx.fillStyle = "rgba(232,232,216,0.6)";
  ctx.font = "italic 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Fair Trade & Organic", canvas.width / 2, canvas.height - 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a minimalist poster texture (fair-trade / specialty coffee theme).
 */
function createPosterTexture(title, subtitle, bgColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Minimalist border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, 150);

  // Simple coffee cup icon (minimalist)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  // Cup body
  ctx.moveTo(canvas.width / 2 - 60, 280);
  ctx.lineTo(canvas.width / 2 - 50, 380);
  ctx.lineTo(canvas.width / 2 + 50, 380);
  ctx.lineTo(canvas.width / 2 + 60, 280);
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.arc(canvas.width / 2 + 80, 330, 25, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  // Saucer
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 70, 390);
  ctx.lineTo(canvas.width / 2 + 70, 390);
  ctx.stroke();
  // Steam
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const sx = canvas.width / 2 - 20 + i * 20;
    ctx.moveTo(sx, 250);
    ctx.quadraticCurveTo(sx + 15, 230, sx, 210);
    ctx.stroke();
  }

  // Subtitle (word-wrapped)
  ctx.font = "bold 32px Helvetica, Arial, sans-serif";
  const words = subtitle.split(" ");
  let line = "";
  let yPos = 480;
  const maxWidth = canvas.width - 100;
  for (const word of words) {
    const testLine = line ? line + " " + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, canvas.width / 2, yPos);
      line = word;
      yPos += 42;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, canvas.width / 2, yPos);

  // Bottom banner
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Helvetica, Arial, sans-serif";
  ctx.fillText("EST. 2005", canvas.width / 2, canvas.height - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a POS touchscreen display texture.
 */
function createPOSTouchscreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");

  // Screen background
  ctx.fillStyle = "#1a1a2a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header bar
  ctx.fillStyle = "#2a4a6a";
  ctx.fillRect(0, 0, canvas.width, 50);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("POINT OF SALE", 20, 33);
  ctx.textAlign = "right";
  ctx.fillText("$12.75", canvas.width - 20, 33);

  // Grid of buttons
  const btnColors = ["#3a5a7a", "#5a3a3a", "#3a5a3a", "#5a5a3a", "#3a3a5a", "#5a3a5a"];
  const labels = ["Latte", "Espresso", "Mocha", "Cappuccino", "Americano", "Macchiato"];
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bx = 20 + col * 160;
    const by = 70 + row * 100;
    ctx.fillStyle = btnColors[i];
    ctx.fillRect(bx, by, 145, 85);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], bx + 72, by + 50);
  }

  // Bottom total bar
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
  ctx.fillStyle = "#88ff88";
  ctx.font = "bold 28px Helvetica, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TOTAL: $12.75", 20, canvas.height - 22);
  ctx.fillStyle = "#88aaff";
  ctx.textAlign = "right";
  ctx.fillText("CHARGE ▶", canvas.width - 20, canvas.height - 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a PID display texture for the espresso machine.
 */
function createPIDTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Dark display background
  ctx.fillStyle = "#0a1a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Green LCD text
  ctx.fillStyle = "#33ff33";
  ctx.font = "bold 36px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("93.5°C", canvas.width / 2, 50);

  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.fillText("9.2 bar", canvas.width / 2, 85);

  ctx.font = "14px 'Courier New', monospace";
  ctx.fillStyle = "#22aa22";
  ctx.fillText("PRE-INFUSION", canvas.width / 2, 110);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a backlit café sign texture.
 */
function createCafeSignTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Dark background (will be backlit)
  ctx.fillStyle = "#1a1a2a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing text
  ctx.fillStyle = "#ffdd88";
  ctx.font = "bold 72px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CAFÉ", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// ── Geometry builders ───────────────────────────────────────────────────

/**
 * Create a modern wood/metal table with metal legs.
 */
function createTable(x, z) {
  const table = new THREE.Group();
  table.name = "table-2005";

  // Tabletop (wood)
  const topGeo = new THREE.BoxGeometry(1.2, 0.05, 0.8);
  const top = new THREE.Mesh(topGeo, MAT.woodLight);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);

  // Metal legs (splayed)
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.73, 8);
  const legPositions = [
    [-0.5, 0.365, -0.32],
    [0.5, 0.365, -0.32],
    [-0.5, 0.365, 0.32],
    [0.5, 0.365, 0.32],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, MAT.brushedSteel);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    table.add(leg);
  }

  // Metal foot bar connecting legs (front and back)
  const footGeo = new THREE.BoxGeometry(1.0, 0.03, 0.03);
  for (const fz of [-0.32, 0.32]) {
    const foot = new THREE.Mesh(footGeo, MAT.brushedSteel);
    foot.position.set(0, 0.02, fz);
    table.add(foot);
  }

  table.position.set(x, 0, z);
  return table;
}

/**
 * Create a molded plywood chair (Eames-style).
 */
function createChair(x, z, rotY) {
  const chair = new THREE.Group();
  chair.name = "chair-2005";

  // Molded plywood seat (curved — approximated with a slightly tapered box)
  const seatGeo = new THREE.BoxGeometry(0.44, 0.04, 0.42);
  const seat = new THREE.Mesh(seatGeo, MAT.woodLight);
  seat.position.y = 0.45;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  // Metal legs (4 splayed)
  const legGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.45, 8);
  const legPositions = [
    [-0.18, 0.225, -0.17],
    [0.18, 0.225, -0.17],
    [-0.18, 0.225, 0.17],
    [0.18, 0.225, 0.17],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, MAT.brushedSteel);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    chair.add(leg);
  }

  // Molded plywood backrest (curved — approximated with a box tilted slightly)
  const backGeo = new THREE.BoxGeometry(0.42, 0.35, 0.03);
  const back = new THREE.Mesh(backGeo, MAT.woodLight);
  back.position.set(0, 0.65, -0.19);
  back.rotation.x = -0.15;
  back.castShadow = true;
  chair.add(back);

  // Backrest supports (metal struts connecting seat to back)
  const strutGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6);
  for (const bx of [-0.18, 0.18]) {
    const strut = new THREE.Mesh(strutGeo, MAT.brushedSteel);
    strut.position.set(bx, 0.55, -0.18);
    strut.rotation.x = 0.3;
    chair.add(strut);
  }

  chair.position.set(x, 0, z);
  chair.rotation.y = rotY;
  return chair;
}

/**
 * Create a lounge sofa (modern minimalist).
 */
function createSofa(x, z, rotY) {
  const sofa = new THREE.Group();
  sofa.name = "sofa-2005";

  // Base
  const baseGeo = new THREE.BoxGeometry(1.6, 0.3, 0.7);
  const base = new THREE.Mesh(baseGeo, MAT.fabricCharcoal);
  base.position.y = 0.2;
  base.castShadow = true;
  sofa.add(base);

  // Seat cushions
  for (const cx of [-0.4, 0.4]) {
    const cushionGeo = new THREE.BoxGeometry(0.7, 0.12, 0.6);
    const cushion = new THREE.Mesh(cushionGeo, MAT.fabricCharcoal);
    cushion.position.set(cx, 0.41, 0);
    cushion.castShadow = true;
    sofa.add(cushion);
  }

  // Back cushions
  for (const cx of [-0.4, 0.4]) {
    const backCushionGeo = new THREE.BoxGeometry(0.7, 0.4, 0.15);
    const backCushion = new THREE.Mesh(backCushionGeo, MAT.fabricCharcoal);
    backCushion.position.set(cx, 0.55, -0.25);
    backCushion.castShadow = true;
    sofa.add(backCushion);
  }

  // Arms
  for (const ax of [-0.85, 0.85]) {
    const armGeo = new THREE.BoxGeometry(0.15, 0.35, 0.7);
    const arm = new THREE.Mesh(armGeo, MAT.fabricCharcoal);
    arm.position.set(ax, 0.35, 0);
    arm.castShadow = true;
    sofa.add(arm);
  }

  // Metal legs
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
  for (const [lx, lz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) {
    const leg = new THREE.Mesh(legGeo, MAT.brushedSteel);
    leg.position.set(lx, 0.05, lz);
    sofa.add(leg);
  }

  sofa.position.set(x, 0, z);
  sofa.rotation.y = rotY;
  return sofa;
}

/**
 * Create a ceramic to-go cup with cardboard sleeve.
 */
function createToGoCup() {
  const cupGroup = new THREE.Group();
  cupGroup.name = "to-go-cup-2005";

  // Cup body (slightly tapered cylinder)
  const cupGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.14, 16);
  const cup = new THREE.Mesh(cupGeo, MAT.ceramicWhite);
  cup.position.y = 0.07;
  cup.castShadow = true;
  cupGroup.add(cup);

  // Cardboard sleeve (kraft paper, slightly wider)
  const sleeveGeo = new THREE.CylinderGeometry(0.048, 0.045, 0.05, 16);
  const sleeve = new THREE.Mesh(sleeveGeo, MAT.kraftPaper);
  sleeve.position.y = 0.05;
  sleeve.castShadow = true;
  cupGroup.add(sleeve);

  // Lid (white plastic dome)
  const lidGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.015, 16);
  const lid = new THREE.Mesh(lidGeo, MAT.whitePlastic);
  lid.position.y = 0.148;
  cupGroup.add(lid);

  // Sip hole (small dark circle on lid)
  const holeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.002, 8);
  const hole = new THREE.Mesh(holeGeo, MAT.blackPlastic);
  hole.position.set(0.015, 0.156, 0);
  cupGroup.add(hole);

  // Coffee inside (dark liquid visible at top)
  const liquidGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.003, 16);
  const liquidMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.2, metalness: 0.0 });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = 0.14;
  cupGroup.add(liquid);

  return cupGroup;
}

/**
 * Create a semi-automatic espresso machine with PID display.
 */
function createEspressoMachine() {
  const machine = new THREE.Group();
  machine.name = "espresso-machine-2005";

  // Main body (stainless steel box)
  const bodyGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
  const body = new THREE.Mesh(bodyGeo, MAT.brushedSteel);
  body.position.y = 0.2;
  body.castShadow = true;
  machine.add(body);

  // Top section (group head housing)
  const topGeo = new THREE.BoxGeometry(0.55, 0.15, 0.38);
  const top = new THREE.Mesh(topGeo, MAT.brushedSteel);
  top.position.y = 0.475;
  top.castShadow = true;
  machine.add(top);

  // PID display (emissive green LCD)
  const pidTex = createPIDTexture();
  const pidMat = new THREE.MeshStandardMaterial({
    map: pidTex,
    emissive: 0x33ff33,
    emissiveIntensity: 0.6,
    emissiveMap: pidTex,
    roughness: 0.3,
  });
  const pidGeo = new THREE.PlaneGeometry(0.12, 0.06);
  const pidDisplay = new THREE.Mesh(pidGeo, pidMat);
  pidDisplay.position.set(0.15, 0.35, 0.201);
  machine.add(pidDisplay);

  // PID display frame
  const pidFrameGeo = new THREE.BoxGeometry(0.14, 0.08, 0.01);
  const pidFrame = new THREE.Mesh(pidFrameGeo, MAT.blackPlastic);
  pidFrame.position.set(0.15, 0.35, 0.195);
  machine.add(pidFrame);

  // Portafilter (group head)
  const groupHeadGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.08, 12);
  const groupHead = new THREE.Mesh(groupHeadGeo, MAT.chrome);
  groupHead.position.set(-0.1, 0.12, 0.15);
  machine.add(groupHead);

  // Portafilter handle
  const pfHandleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12);
  const pfHandle = new THREE.Mesh(pfHandleGeo, MAT.blackPlastic);
  pfHandle.position.set(-0.1, 0.05, 0.22);
  pfHandle.rotation.x = Math.PI / 2;
  machine.add(pfHandle);

  // Steam wand (with knob)
  const wandGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.25, 8);
  const wand = new THREE.Mesh(wandGeo, MAT.chrome);
  wand.position.set(0.25, 0.25, 0.1);
  wand.rotation.z = -0.5;
  machine.add(wand);

  // Steam knob
  const knobGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.015, 12);
  const knob = new THREE.Mesh(knobGeo, MAT.blackPlastic);
  knob.position.set(0.28, 0.35, 0.15);
  knob.rotation.x = Math.PI / 2;
  machine.add(knob);

  // Drip tray
  const trayGeo = new THREE.BoxGeometry(0.55, 0.02, 0.35);
  const tray = new THREE.Mesh(trayGeo, MAT.brushedSteel);
  tray.position.y = 0.01;
  machine.add(tray);

  // Pressure gauge (small dial on front)
  const gaugeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
  const gaugeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    emissive: 0x444444,
    emissiveIntensity: 0.2,
  });
  const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
  gauge.position.set(-0.15, 0.35, 0.201);
  gauge.rotation.x = Math.PI / 2;
  machine.add(gauge);

  return machine;
}

/**
 * Create an iPod dock with speaker system.
 */
function createIpodDock() {
  const dock = new THREE.Group();
  dock.name = "ipod-dock-2005";

  // Dock base
  const baseGeo = new THREE.BoxGeometry(0.3, 0.04, 0.2);
  const base = new THREE.Mesh(baseGeo, MAT.whitePlastic);
  base.position.y = 0.02;
  base.castShadow = true;
  dock.add(base);

  // iPod (standing upright in dock)
  const ipodGeo = new THREE.BoxGeometry(0.06, 0.09, 0.012);
  const ipod = new THREE.Mesh(ipodGeo, MAT.whitePlastic);
  ipod.position.y = 0.09;
  ipod.castShadow = true;
  dock.add(ipod);

  // iPod screen (dark emissive rectangle)
  const screenGeo = new THREE.PlaneGeometry(0.04, 0.03);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x113311,
    roughness: 0.2,
    emissive: 0x33aa33,
    emissiveIntensity: 0.4,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.11, 0.007);
  dock.add(screen);

  // Click wheel (circle on lower iPod)
  const wheelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.002, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 });
  const wheel = new THREE.Mesh(wheelGeo, wheelMat);
  wheel.position.set(0, 0.06, 0.007);
  wheel.rotation.x = Math.PI / 2;
  dock.add(wheel);

  // Speaker (left — small bookshelf speaker)
  const speakerGeo = new THREE.BoxGeometry(0.15, 0.25, 0.12);
  const speaker = new THREE.Mesh(speakerGeo, MAT.blackPlastic);
  speaker.position.set(-0.22, 0.165, 0);
  speaker.castShadow = true;
  dock.add(speaker);

  // Speaker cone (left)
  const coneGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const cone1 = new THREE.Mesh(coneGeo, coneMat);
  cone1.position.set(-0.22, 0.2, 0.065);
  cone1.rotation.x = Math.PI / 2;
  dock.add(cone1);

  // Tweeter (small cone on left speaker)
  const tweeterGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12);
  const tweeter1 = new THREE.Mesh(tweeterGeo, coneMat);
  tweeter1.position.set(-0.22, 0.27, 0.065);
  tweeter1.rotation.x = Math.PI / 2;
  dock.add(tweeter1);

  // Speaker (right)
  const speaker2 = new THREE.Mesh(speakerGeo, MAT.blackPlastic);
  speaker2.position.set(0.22, 0.165, 0);
  speaker2.castShadow = true;
  dock.add(speaker2);

  // Speaker cone (right)
  const cone2 = new THREE.Mesh(coneGeo, coneMat);
  cone2.position.set(0.22, 0.2, 0.065);
  cone2.rotation.x = Math.PI / 2;
  dock.add(cone2);

  // Tweeter (right)
  const tweeter2 = new THREE.Mesh(tweeterGeo, coneMat);
  tweeter2.position.set(0.22, 0.27, 0.065);
  tweeter2.rotation.x = Math.PI / 2;
  dock.add(tweeter2);

  return dock;
}

/**
 * Create a touchscreen POS system with card reader.
 */
function createPOS() {
  const pos = new THREE.Group();
  pos.name = "pos-2005";

  // Base stand
  const baseGeo = new THREE.BoxGeometry(0.25, 0.02, 0.2);
  const base = new THREE.Mesh(baseGeo, MAT.blackPlastic);
  base.position.y = 0.01;
  base.castShadow = true;
  pos.add(base);

  // Stand neck
  const neckGeo = new THREE.BoxGeometry(0.04, 0.08, 0.04);
  const neck = new THREE.Mesh(neckGeo, MAT.blackPlastic);
  neck.position.y = 0.06;
  pos.add(neck);

  // Monitor housing
  const housingGeo = new THREE.BoxGeometry(0.35, 0.28, 0.03);
  const housing = new THREE.Mesh(housingGeo, MAT.blackPlastic);
  housing.position.y = 0.22;
  housing.castShadow = true;
  pos.add(housing);

  // Touchscreen display (emissive)
  const screenTex = createPOSTouchscreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0x4488ff,
    emissiveIntensity: 0.5,
    emissiveMap: screenTex,
    roughness: 0.2,
  });
  const screenGeo = new THREE.PlaneGeometry(0.3, 0.23);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.22, 0.017);
  pos.add(screen);

  // Card reader (small box on side of base)
  const readerGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
  const reader = new THREE.Mesh(readerGeo, MAT.blackPlastic);
  reader.position.set(0.16, 0.03, 0);
  pos.add(reader);

  // Card swipe slot (visible dark slot on card reader)
  const slotGeo = new THREE.BoxGeometry(0.06, 0.003, 0.02);
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5 });
  const slot = new THREE.Mesh(slotGeo, slotMat);
  slot.position.set(0.16, 0.035, 0.031);
  pos.add(slot);

  // Receipt printer slot (top of housing)
  const printerGeo = new THREE.BoxGeometry(0.1, 0.02, 0.04);
  const printer = new THREE.Mesh(printerGeo, MAT.blackPlastic);
  printer.position.set(0, 0.37, 0);
  pos.add(printer);

  return pos;
}

/**
 * Create a pendant light with warm point light.
 */
function createPendantLight(x, y, z) {
  const lamp = new THREE.Group();
  lamp.name = "pendant-light-2005";

  // Cord (thin cylinder from ceiling)
  const cordGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.8, 6);
  const cord = new THREE.Mesh(cordGeo, MAT.blackMetal);
  cord.position.y = 0.4;
  lamp.add(cord);

  // Cone shade (metal, modern minimalist)
  const shadeGeo = new THREE.ConeGeometry(0.15, 0.18, 20, 1, true);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.4,
    metalness: 0.6,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.position.y = -0.05;
  shade.castShadow = true;
  lamp.add(shade);

  // Inner shade (lighter, reflective)
  const innerShadeGeo = new THREE.ConeGeometry(0.14, 0.16, 20, 1, true);
  const innerShadeMat = new THREE.MeshStandardMaterial({
    color: 0xddccaa,
    roughness: 0.3,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  const innerShade = new THREE.Mesh(innerShadeGeo, innerShadeMat);
  innerShade.position.y = -0.04;
  lamp.add(innerShade);

  // Bulb (glowing sphere)
  const bulbGeo = new THREE.SphereGeometry(0.035, 12, 10);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffeecc,
    emissive: 0xffdd88,
    emissiveIntensity: 0.9,
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.y = -0.08;
  lamp.add(bulb);

  // Warm point light (focused downward)
  const light = new THREE.PointLight(0xffeecc, 0.4, 5, 1.5);
  light.position.y = -0.1;
  lamp.add(light);

  lamp.position.set(x, y, z);
  return lamp;
}

/**
 * Create a chalkboard menu board on the wall.
 */
function createChalkboard(x, y, z) {
  const board = new THREE.Group();
  board.name = "chalkboard-menu-2005";

  // Wooden frame
  const frameGeo = new THREE.BoxGeometry(1.6, 1.2, 0.06);
  const frame = new THREE.Mesh(frameGeo, MAT.woodDark);
  frame.position.z = -0.01;
  frame.castShadow = true;
  board.add(frame);

  // Chalkboard surface with canvas texture
  const tex = createChalkboardTexture();
  const boardMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.6,
    metalness: 0.0,
  });
  const boardGeo = new THREE.PlaneGeometry(1.4, 1.05);
  const boardMesh = new THREE.Mesh(boardGeo, boardMat);
  boardMesh.position.z = 0.031;
  board.add(boardMesh);

  board.position.set(x, y, z);
  return board;
}

/**
 * Create a minimalist poster.
 */
function createPoster(x, y, z, rotY, title, subtitle, bgColor) {
  const poster = new THREE.Group();
  poster.name = "poster-2005";

  // Thin frame
  const frameGeo = new THREE.BoxGeometry(0.7, 1.05, 0.03);
  const frame = new THREE.Mesh(frameGeo, MAT.blackMetal);
  frame.position.z = -0.01;
  poster.add(frame);

  // Poster image
  const tex = createPosterTexture(title, subtitle, bgColor);
  const posterMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.7,
    metalness: 0.0,
  });
  const posterGeo = new THREE.PlaneGeometry(0.6, 0.9);
  const posterMesh = new THREE.Mesh(posterGeo, posterMat);
  posterMesh.position.z = 0.016;
  poster.add(posterMesh);

  poster.position.set(x, y, z);
  poster.rotation.y = rotY;
  return poster;
}

/**
 * Create a backlit café sign.
 */
function createBacklitSign(x, y, z) {
  const sign = new THREE.Group();
  sign.name = "backlit-sign-2005";

  // Sign housing (dark box)
  const housingGeo = new THREE.BoxGeometry(1.2, 0.35, 0.08);
  const housing = new THREE.Mesh(housingGeo, MAT.blackPlastic);
  housing.position.z = -0.02;
  housing.castShadow = true;
  sign.add(housing);

  // Backlit panel with text texture
  const tex = createCafeSignTexture();
  const panelMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: 0xffdd88,
    emissiveIntensity: 0.7,
    emissiveMap: tex,
    roughness: 0.4,
  });
  const panelGeo = new THREE.PlaneGeometry(1.1, 0.28);
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.z = 0.025;
  sign.add(panel);

  sign.position.set(x, y, z);
  return sign;
}

/**
 * Create a modern counter bar.
 */
function createCounter() {
  const counter = new THREE.Group();
  counter.name = "counter-2005";

  // Counter top (lighter wood)
  const topGeo = new THREE.BoxGeometry(4, 0.06, 0.7);
  const top = new THREE.Mesh(topGeo, MAT.woodLight);
  top.position.y = 1.0;
  top.castShadow = true;
  top.receiveShadow = true;
  counter.add(top);

  // Front panel (dark wood)
  const frontGeo = new THREE.BoxGeometry(4, 0.94, 0.05);
  const front = new THREE.Mesh(frontGeo, MAT.woodDark);
  front.position.set(0, 0.5, 0.325);
  front.castShadow = true;
  counter.add(front);

  // Side panels (metal accents)
  for (const sx of [-2, 2]) {
    const sideGeo = new THREE.BoxGeometry(0.05, 0.94, 0.7);
    const side = new THREE.Mesh(sideGeo, MAT.brushedSteel);
    side.position.set(sx, 0.5, 0);
    counter.add(side);
  }

  // Shelf behind counter
  const shelfGeo = new THREE.BoxGeometry(3.8, 0.04, 0.3);
  const shelf = new THREE.Mesh(shelfGeo, MAT.woodDark);
  shelf.position.set(0, 1.5, -0.15);
  shelf.castShadow = true;
  counter.add(shelf);

  return counter;
}

/**
 * Create a 2000s-attired patron figure.
 * @param {number} x
 * @param {number} z
 * @param {number} rotY
 * @param {object} outfit — { shirt, trousers, skin } material refs
 * @param {boolean} flipPhone — whether patron holds a flip phone to ear
 */
function createPatron(x, z, rotY, outfit, flipPhone) {
  const patron = new THREE.Group();
  patron.name = "patron-2005";

  // Legs (jeans/trousers)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8);
  for (const lx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(legGeo, outfit.trousers);
    leg.position.set(lx, 0.35, 0);
    leg.castShadow = true;
    patron.add(leg);
  }

  // Shoes (sneakers)
  const shoeGeo = new THREE.BoxGeometry(0.1, 0.05, 0.18);
  for (const lx of [-0.1, 0.1]) {
    const shoe = new THREE.Mesh(shoeGeo, MAT.blackPlastic);
    shoe.position.set(lx, 0.025, 0.04);
    patron.add(shoe);
  }

  // Torso (t-shirt or hoodie)
  const torsoGeo = new THREE.BoxGeometry(0.36, 0.55, 0.22);
  const torso = new THREE.Mesh(torsoGeo, outfit.shirt);
  torso.position.y = 0.97;
  torso.castShadow = true;
  patron.add(torso);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.5, 8);
  for (const ax of [-0.22, 0.22]) {
    const arm = new THREE.Mesh(armGeo, outfit.shirt);
    arm.position.set(ax, 0.95, 0);
    arm.castShadow = true;
    patron.add(arm);
  }

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
  const neck = new THREE.Mesh(neckGeo, outfit.skin);
  neck.position.y = 1.3;
  patron.add(neck);

  // Head
  const headGeo = new THREE.SphereGeometry(0.12, 16, 12);
  const head = new THREE.Mesh(headGeo, outfit.skin);
  head.position.y = 1.42;
  head.castShadow = true;
  patron.add(head);

  // Hair (various styles — thin cap on head)
  const hairGeo = new THREE.SphereGeometry(0.125, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const hair = new THREE.Mesh(hairGeo, MAT.hair);
  hair.position.y = 1.44;
  patron.add(hair);

  // Flip phone held to ear (on right side)
  if (flipPhone) {
    const phoneGeo = new THREE.BoxGeometry(0.05, 0.09, 0.025);
  const phone = new THREE.Mesh(phoneGeo, MAT.blackPlastic);
    phone.position.set(0.13, 1.38, 0);
    phone.rotation.z = -0.1;
    patron.add(phone);

    // Phone screen (small emissive slit)
    const phoneScreenGeo = new THREE.PlaneGeometry(0.03, 0.05);
    const phoneScreenMat = new THREE.MeshStandardMaterial({
      color: 0x224488,
      emissive: 0x3366aa,
      emissiveIntensity: 0.4,
    });
    const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
    phoneScreen.position.set(0.143, 1.38, 0);
    phoneScreen.rotation.y = Math.PI / 2;
    patron.add(phoneScreen);
  }

  patron.position.set(x, 0, z);
  patron.rotation.y = rotY;
  return patron;
}

// ── Period setup / teardown ─────────────────────────────────────────────

/**
 * Saved references for light adjustment and cleanup.
 */
const _state = {
  savedLightIntensities: null,
  savedLightColors: null,
};

/**
 * Setup the 2005 period scene. Adds all content to the provided group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function setupPeriod2005(scene, group) {
  const { width, depth, height } = CAFE_DIMENSIONS;
  const hw = width / 2;
  const hd = depth / 2;

  // ── Adjust shared lighting to bright & cool for 2005 ──
  const ambient = scene.getObjectByProperty("type", "AmbientLight");
  const hemi = scene.getObjectByProperty("type", "HemisphereLight");
  const directional = scene.getObjectByProperty("type", "DirectionalLight");

  _state.savedLightIntensities = {};
  _state.savedLightColors = {};

  if (ambient) {
    _state.savedLightIntensities.ambient = ambient.intensity;
    _state.savedLightColors.ambient = ambient.color.getHex();
    ambient.intensity = 0.45;
    ambient.color.setHex(0xeeeeff);
  }
  if (hemi) {
    _state.savedLightIntensities.hemi = hemi.intensity;
    _state.savedLightColors.hemi = hemi.color.getHex();
    hemi.intensity = 0.35;
    hemi.color.setHex(0xddddff);
  }
  if (directional) {
    _state.savedLightIntensities.directional = directional.intensity;
    _state.savedLightColors.directional = directional.color.getHex();
    directional.intensity = 0.5;
    directional.color.setHex(0xfff5e8);
  }

  // ── 1. Furniture: Counter bar along back wall ──
  const counter = createCounter();
  counter.position.set(0, 0, hd - 1.2);
  group.add(counter);

  // ── 2. Coffee equipment: Semi-auto espresso machine on counter ──
  const espressoMachine = createEspressoMachine();
  espressoMachine.position.set(-0.8, 1.06, hd - 1.2);
  group.add(espressoMachine);

  // ── 8. Counter technology: Touchscreen POS ──
  const pos = createPOS();
  pos.position.set(0.8, 1.06, hd - 1.2);
  group.add(pos);

  // ── 3. Menu board: Chalkboard on wall behind counter ──
  const chalkboard = createChalkboard(0, 2.6, hd - 0.05);
  group.add(chalkboard);

  // ── 4. Music source: iPod dock with speakers on shelf ──
  const ipodDock = createIpodDock();
  ipodDock.position.set(1.5, 1.55, hd - 1.3);
  group.add(ipodDock);

  // ── 5. Posters/ads: Minimalist / fair-trade posters on side walls ──
  const poster1 = createPoster(
    -hw + 0.03, 2.2, -2, Math.PI / 2,
    "FAIR TRADE", "SUPPORT FARMERS", "#2a6a4a"
  );
  group.add(poster1);

  const poster2 = createPoster(
    hw - 0.03, 2.2, -2, -Math.PI / 2,
    "SPECIALTY", "COFFEE MATTERS", "#4a3a6a"
  );
  group.add(poster2);

  const poster3 = createPoster(
    -hw + 0.03, 2.2, 3, Math.PI / 2,
    "ORGANIC", "GROWN WITH CARE", "#6a4a2a"
  );
  group.add(poster3);

  // ── 7. Signage/lighting: Backlit café sign on wall ──
  const sign = createBacklitSign(0, 3.4, hd - 0.05);
  group.add(sign);

  // ── 7. Signage/lighting: Pendant lights over tables ──
  const tablePositions = [
    { x: -2.5, z: -3 },
    { x: 2.5, z: -3 },
    { x: -2.5, z: 1 },
    { x: 2.5, z: 1 },
  ];

  for (const tp of tablePositions) {
    const pendant = createPendantLight(tp.x, height - 0.5, tp.z);
    group.add(pendant);
  }

  // ── 1. Furniture: Tables and chairs in seating area ──
  for (const tp of tablePositions) {
    // Table
    const table = createTable(tp.x, tp.z);
    group.add(table);

    // 4 molded plywood chairs around each table
    const chairOffsets = [
      { dx: 0, dz: -0.85, rot: 0 },
      { dx: 0, dz: 0.85, rot: Math.PI },
      { dx: -0.85, dz: 0, rot: Math.PI / 2 },
      { dx: 0.85, dz: 0, rot: -Math.PI / 2 },
    ];
    for (const co of chairOffsets) {
      const chair = createChair(tp.x + co.dx, tp.z + co.dz, co.rot);
      group.add(chair);
    }

    // 6. Tableware: Ceramic to-go cups on tables
    const cup = createToGoCup();
    cup.position.set(tp.x + 0.2, 0.78, tp.z + 0.1);
    group.add(cup);

    const cup2 = createToGoCup();
    cup2.position.set(tp.x - 0.15, 0.78, tp.z - 0.2);
    group.add(cup2);
  }

  // ── 1. Furniture: Lounge sofa in corner ──
  const sofa = createSofa(-hw + 1.0, -hd + 1.5, Math.PI / 2);
  group.add(sofa);

  // ── 9. Patrons: 2000s-attired figures at tables ──
  const patronConfigs = [
    { x: -2.5, z: -3.85, rotY: 0, outfit: { shirt: MAT.fabricDenim, trousers: MAT.fabricDenim, skin: MAT.skin }, flipPhone: false },
    { x: 2.5, z: -3.85, rotY: 0, outfit: { shirt: MAT.fabricOlive, trousers: MAT.fabricBlack, skin: MAT.skinDark }, flipPhone: true },
    { x: -3.35, z: 1, rotY: -Math.PI / 2, outfit: { shirt: MAT.fabricBurgundy, trousers: MAT.fabricBlack, skin: MAT.skin }, flipPhone: false },
    { x: 3.35, z: 1, rotY: Math.PI / 2, outfit: { shirt: MAT.fabricCharcoal, trousers: MAT.fabricDenim, skin: MAT.skinDark }, flipPhone: false },
    { x: -2.5, z: 1.85, rotY: Math.PI, outfit: { shirt: MAT.fabricCream, trousers: MAT.fabricBlack, skin: MAT.skin }, flipPhone: false },
  ];

  for (const pc of patronConfigs) {
    const patron = createPatron(pc.x, pc.z, pc.rotY, pc.outfit, pc.flipPhone);
    group.add(patron);
  }

  // ── Additional bright light for the counter area ──
  const counterLight = new THREE.PointLight(0xeeeeff, 0.4, 5, 1.5);
  counterLight.position.set(0, 3.2, hd - 2);
  group.add(counterLight);
}

/**
 * Teardown the 2005 period scene. Removes all content and disposes resources.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function teardownPeriod2005(scene, group) {
  // Restore shared lighting to original values.
  const ambient = scene.getObjectByProperty("type", "AmbientLight");
  const hemi = scene.getObjectByProperty("type", "HemisphereLight");
  const directional = scene.getObjectByProperty("type", "DirectionalLight");

  if (ambient && _state.savedLightIntensities && _state.savedLightIntensities.ambient !== undefined) {
    ambient.intensity = _state.savedLightIntensities.ambient;
    ambient.color.setHex(_state.savedLightColors.ambient);
  }
  if (hemi && _state.savedLightIntensities && _state.savedLightIntensities.hemi !== undefined) {
    hemi.intensity = _state.savedLightIntensities.hemi;
    hemi.color.setHex(_state.savedLightColors.hemi);
  }
  if (directional && _state.savedLightIntensities && _state.savedLightIntensities.directional !== undefined) {
    directional.intensity = _state.savedLightIntensities.directional;
    directional.color.setHex(_state.savedLightColors.directional);
  }

  // Dispose all geometries and materials in the group.
  group.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => disposeMaterial(m));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });

  // Remove all children from the group.
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  // Clear saved state.
  _state.savedLightIntensities = null;
  _state.savedLightColors = null;
}

/**
 * Dispose a material and its textures.
 * @param {THREE.Material} material
 */
function disposeMaterial(material) {
  // Dispose any map textures.
  for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) {
    if (material[key] && material[key].dispose) {
      material[key].dispose();
    }
  }
  material.dispose();
}
