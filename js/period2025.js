/**
 * period2025.js — Contemporary café period content (2025).
 *
 * Covers all 10 detail categories from the README:
 *  1. Furniture/decor   — sustainable reclaimed-wood tables & metal chairs
 *  2. Coffee equipment  — smart espresso machine with touchscreen
 *  3. Menu board        — digital LCD menu with 2025 prices (canvas texture)
 *  4. Music source      — smart speaker (cylindrical, LED ring) + phone
 *  5. Posters/ads       — digital ad screens with sustainability messaging
 *  6. Tableware         — reusable cups with silicone lids, glass water bottles
 *  7. Signage/lighting  — smart LED ceiling panels, bright cool-white light
 *  8. Counter technology— contactless POS terminal with NFC tap-to-pay
 *  9. Patrons           — 2020s-attired figures (athleisure/streetwear) w/ smartphones + earbuds
 * 10. (decor)           — green/living wall with plant clusters
 *
 * Exported functions are registered via PeriodManager.registerPeriod().
 */

import * as THREE from "three";
import { CAFE_DIMENSIONS } from "./config.js";

// ── Shared material palette (2025 modern/cooler tones) ──────────────────
const MAT = {
  matteWhite: new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.5, metalness: 0.1 }),
  matteBlack: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.5, metalness: 0.2 }),
  aluminum: new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.85 }),
  brushedSteel: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.35, metalness: 0.9 }),
  reclaimedWood: new THREE.MeshStandardMaterial({ color: 0xc8a878, roughness: 0.7, metalness: 0.05 }),
  reclaimedWoodDark: new THREE.MeshStandardMaterial({ color: 0xa88858, roughness: 0.75, metalness: 0.05 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xaaddee, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.4 }),
  glassBottle: new THREE.MeshStandardMaterial({ color: 0x88bbcc, roughness: 0.15, metalness: 0.0, transparent: true, opacity: 0.55 }),
  ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2, metalness: 0.0 }),
  siliconeLid: new THREE.MeshStandardMaterial({ color: 0x3a5a4a, roughness: 0.9, metalness: 0.0 }),
  siliconeLidTan: new THREE.MeshStandardMaterial({ color: 0x9a7a5a, roughness: 0.9, metalness: 0.0 }),
  coffeeDark: new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.2, metalness: 0.0 }),
  plantPot: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8, metalness: 0.1 }),
  feltGreen: new THREE.MeshStandardMaterial({ color: 0x2a4a3a, roughness: 0.95, metalness: 0.0 }),
  // Patron attire — athleisure/streetwear palette
  fabricCharcoal: new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.95, metalness: 0.0 }),
  fabricHeather: new THREE.MeshStandardMaterial({ color: 0x6a6a72, roughness: 0.95, metalness: 0.0 }),
  fabricNavy: new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.95, metalness: 0.0 }),
  fabricOlive: new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.95, metalness: 0.0 }),
  fabricBurgundy: new THREE.MeshStandardMaterial({ color: 0x6a2a3a, roughness: 0.95, metalness: 0.0 }),
  fabricCream: new THREE.MeshStandardMaterial({ color: 0xeae0d0, roughness: 0.95, metalness: 0.0 }),
  fabricRust: new THREE.MeshStandardMaterial({ color: 0x9a4a2a, roughness: 0.95, metalness: 0.0 }),
  fabricTeal: new THREE.MeshStandardMaterial({ color: 0x2a6a6a, roughness: 0.95, metalness: 0.0 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd4a878, roughness: 0.8, metalness: 0.0 }),
  skinDark: new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8, metalness: 0.0 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9, metalness: 0.0 }),
  hairBrown: new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.9, metalness: 0.0 }),
  earbudWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3, metalness: 0.1 }),
  phoneBody: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.3, metalness: 0.7 }),
};

// ── Canvas texture helpers ──────────────────────────────────────────────

/**
 * Create a digital LCD menu texture with 2025 prices.
 * Bright emissive-style background ensures legibility.
 */
function createDigitalMenuTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  // Bright LCD background (cool white)
  ctx.fillStyle = "#f4f8ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle header band
  ctx.fillStyle = "#2a6a4a";
  ctx.fillRect(0, 0, canvas.width, 90);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("☕ CAFÉ MENU", canvas.width / 2, 62);

  // Menu items with 2025 prices
  ctx.font = "48px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "left";
  const items = [
    { name: "Espresso", price: "$4.50", icon: "☕" },
    { name: "Oat Latte", price: "$6.00", icon: "🥛" },
    { name: "Cold Brew", price: "$5.50", icon: "🧊" },
    { name: "Flat White", price: "$5.00", icon: "☕" },
    { name: "Matcha Latte", price: "$6.50", icon: "🍵" },
    { name: "Avocado Toast", price: "$12.00", icon: "🥑" },
    { name: "Almond Croissant", price: "$5.50", icon: "🥐" },
  ];

  let y = 180;
  for (const item of items) {
    // Alternating row tint
    if ((y / 80) % 2 < 1) {
      ctx.fillStyle = "#e8f0fa";
      ctx.fillRect(40, y - 50, canvas.width - 80, 70);
    }
    ctx.fillStyle = "#1a2a3a";
    ctx.fillText(item.icon + "  " + item.name, 80, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#2a6a4a";
    ctx.font = "bold 48px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(item.price, canvas.width - 80, y);
    ctx.textAlign = "left";
    ctx.font = "48px 'Segoe UI', Arial, sans-serif";
    y += 80;
  }

  // Footer sustainability note
  ctx.fillStyle = "#2a6a4a";
  ctx.font = "italic 28px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🌱 10¢ discount for reusable cups · 100% compostable", canvas.width / 2, canvas.height - 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a digital ad screen texture with sustainability messaging.
 */
function createAdScreenTexture(headline, subline, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");

  // Bright gradient background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, "#ffffff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Large leaf/eco icon (procedural)
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(canvas.width / 2, 200, 90, 130, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a6a4a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 90);
  ctx.lineTo(canvas.width / 2, 310);
  ctx.stroke();

  // Headline
  ctx.fillStyle = "#1a2a3a";
  ctx.font = "bold 64px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(headline, canvas.width / 2, 420);

  // Subline
  ctx.font = "36px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = "#2a4a3a";
  ctx.fillText(subline, canvas.width / 2, 480);

  // Tag
  ctx.fillStyle = "#2a6a4a";
  ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("SUSTAINABLY SOURCED · 2025", canvas.width / 2, canvas.height - 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a smartphone screen texture (app UI).
 */
function createPhoneScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Screen background
  ctx.fillStyle = "#1a1a2a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Status bar
  ctx.fillStyle = "#2a6a4a";
  ctx.fillRect(0, 0, canvas.width, 40);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("9:41", 16, 28);
  ctx.textAlign = "right";
  ctx.fillText("100%", canvas.width - 16, 28);

  // App card
  ctx.fillStyle = "#2a3a4a";
  ctx.fillRect(24, 70, canvas.width - 48, 120);
  ctx.fillStyle = "#4a8a6a";
  ctx.fillRect(24, 70, canvas.width - 48, 8);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Order Ready ☕", 40, 120);
  ctx.font = "16px Arial, sans-serif";
  ctx.fillStyle = "#aabbcc";
  ctx.fillText("Oat Latte · $6.00", 40, 150);

  // Music player card
  ctx.fillStyle = "#2a3a4a";
  ctx.fillRect(24, 210, canvas.width - 48, 100);
  ctx.fillStyle = "#6a4a8a";
  ctx.beginPath();
  ctx.arc(56, 260, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillText("Now Playing", 96, 250);
  ctx.font = "14px Arial, sans-serif";
  ctx.fillStyle = "#aabbcc";
  ctx.fillText("Lo-fi Beats", 96, 274);

  // Bottom nav dots
  ctx.fillStyle = "#4a6a8a";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 30 + i * 30, canvas.height - 40, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create an espresso machine touchscreen texture.
 */
function createEspressoScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Brew buttons
  const drinks = ["ESPRESSO", "LATTE", "COLD BREW"];
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < 3; i++) {
    const bx = 20 + i * 76;
    ctx.fillStyle = i === 1 ? "#2a8a5a" : "#2a3a4a";
    ctx.fillRect(bx, 30, 64, 64);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(drinks[i], bx + 32, 150);
  }

  // Status bar
  ctx.fillStyle = "#2a6a4a";
  ctx.fillRect(0, 170, canvas.width, 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("● BREWING · 92°C", canvas.width / 2, 185);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a POS terminal screen texture with NFC icon.
 */
function createPosScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#101820";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Amount
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("$6.00", canvas.width / 2, 70);

  // NFC tap-to-pay icon (radio waves)
  ctx.strokeStyle = "#2a8a5a";
  ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    const r = 20 + i * 16;
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 30, 130, r, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
  // NFC dot
  ctx.fillStyle = "#2a8a5a";
  ctx.beginPath();
  ctx.arc(canvas.width / 2 - 30, 130, 8, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = "#aabbcc";
  ctx.font = "bold 20px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("TAP TO PAY", canvas.width / 2 + 10, 125);
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText("NFC / Apple Pay", canvas.width / 2 + 10, 150);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ── Geometry builders ───────────────────────────────────────────────────

/**
 * Create a sustainable reclaimed-wood table with metal legs.
 */
function createTable(x, z) {
  const table = new THREE.Group();
  table.name = "table-2025";

  // Reclaimed wood tabletop
  const topGeo = new THREE.BoxGeometry(1.2, 0.05, 0.7);
  const top = new THREE.Mesh(topGeo, MAT.reclaimedWood);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);

  // Metal legs (tapered, trapezoid style)
  const legGeo = new THREE.BoxGeometry(0.04, 0.72, 0.04);
  const legPositions = [
    [-0.5, 0.36, -0.28],
    [0.5, 0.36, -0.28],
    [-0.5, 0.36, 0.28],
    [0.5, 0.36, 0.28],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, MAT.brushedSteel);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    table.add(leg);
  }

  // Cross-brace
  const braceGeo = new THREE.BoxGeometry(1.0, 0.03, 0.03);
  const brace = new THREE.Mesh(braceGeo, MAT.brushedSteel);
  brace.position.set(0, 0.2, 0);
  table.add(brace);

  table.position.set(x, 0, z);
  return table;
}

/**
 * Create a modern metal chair with reclaimed wood seat.
 */
function createChair(x, z, rotY) {
  const chair = new THREE.Group();
  chair.name = "chair-2025";

  // Reclaimed wood seat
  const seatGeo = new THREE.BoxGeometry(0.42, 0.03, 0.42);
  const seat = new THREE.Mesh(seatGeo, MAT.reclaimedWood);
  seat.position.y = 0.45;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  // Four metal legs
  const legGeo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
  const legPositions = [
    [-0.17, 0.225, -0.17],
    [0.17, 0.225, -0.17],
    [-0.17, 0.225, 0.17],
    [0.17, 0.225, 0.17],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, MAT.brushedSteel);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    chair.add(leg);
  }

  // Back: two vertical posts + horizontal slat
  const postGeo = new THREE.BoxGeometry(0.04, 0.5, 0.04);
  for (const bx of [-0.17, 0.17]) {
    const post = new THREE.Mesh(postGeo, MAT.brushedSteel);
    post.position.set(bx, 0.7, -0.17);
    post.castShadow = true;
    chair.add(post);
  }
  // Back slat (wood)
  const slatGeo = new THREE.BoxGeometry(0.38, 0.12, 0.03);
  const slat = new THREE.Mesh(slatGeo, MAT.reclaimedWoodDark);
  slat.position.set(0, 0.85, -0.17);
  chair.add(slat);

  chair.position.set(x, 0, z);
  chair.rotation.y = rotY;
  return chair;
}

/**
 * Create a reusable cup with silicone lid (no single-use plastic).
 */
function createReusableCup(lidColor) {
  const cupGroup = new THREE.Group();
  cupGroup.name = "reusable-cup-2025";

  // Ceramic cup body
  const cupGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.11, 20);
  const cup = new THREE.Mesh(cupGeo, MAT.ceramicWhite);
  cup.position.y = 0.055;
  cup.castShadow = true;
  cupGroup.add(cup);

  // Coffee inside
  const liquidGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.005, 20);
  const liquid = new THREE.Mesh(liquidGeo, MAT.coffeeDark);
  liquid.position.y = 0.105;
  cupGroup.add(liquid);

  // Silicone lid (slightly wider, with drink hole)
  const lidMat = lidColor || MAT.siliconeLid;
  const lidGeo = new THREE.CylinderGeometry(0.06, 0.058, 0.025, 20);
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = 0.122;
  cupGroup.add(lid);

  // Drink opening (small box notch on top)
  const holeGeo = new THREE.BoxGeometry(0.02, 0.01, 0.03);
  const hole = new THREE.Mesh(holeGeo, MAT.coffeeDark);
  hole.position.set(0.03, 0.135, 0);
  cupGroup.add(hole);

  return cupGroup;
}

/**
 * Create a glass water bottle (reusable, no plastic).
 */
function createGlassBottle() {
  const bottleGroup = new THREE.Group();
  bottleGroup.name = "glass-bottle-2025";

  // Bottle body
  const bodyGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.2, 16);
  const body = new THREE.Mesh(bodyGeo, MAT.glassBottle);
  body.position.y = 0.1;
  body.castShadow = true;
  bottleGroup.add(body);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.05, 12);
  const neck = new THREE.Mesh(neckGeo, MAT.glassBottle);
  neck.position.y = 0.225;
  bottleGroup.add(neck);

  // Cap (metal)
  const capGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12);
  const cap = new THREE.Mesh(capGeo, MAT.aluminum);
  cap.position.y = 0.26;
  bottleGroup.add(cap);

  return bottleGroup;
}

/**
 * Create a smart espresso machine with touchscreen.
 */
function createEspressoMachine() {
  const machine = new THREE.Group();
  machine.name = "espresso-machine-2025";

  // Base body (matte white)
  const bodyGeo = new THREE.BoxGeometry(0.55, 0.4, 0.4);
  const body = new THREE.Mesh(bodyGeo, MAT.matteWhite);
  body.position.y = 0.2;
  body.castShadow = true;
  machine.add(body);

  // Touchscreen on front
  const screenTex = createEspressoScreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveMap: screenTex,
    emissiveIntensity: 0.7,
    map: screenTex,
    roughness: 0.2,
    metalness: 0.1,
  });
  const screenGeo = new THREE.PlaneGeometry(0.3, 0.22);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.25, 0.201);
  machine.add(screen);

  // Portafilter (chrome)
  const pfGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12);
  const pf = new THREE.Mesh(pfGeo, MAT.brushedSteel);
  pf.position.set(0, 0.08, 0.22);
  machine.add(pf);

  // Group head
  const ghGeo = new THREE.BoxGeometry(0.1, 0.06, 0.08);
  const gh = new THREE.Mesh(ghGeo, MAT.aluminum);
  gh.position.set(0, 0.14, 0.21);
  machine.add(gh);

  // Steam wand
  const wandGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.25, 8);
  const wand = new THREE.Mesh(wandGeo, MAT.brushedSteel);
  wand.position.set(0.28, 0.25, 0.1);
  wand.rotation.z = Math.PI / 2.5;
  machine.add(wand);

  // Cup tray
  const trayGeo = new THREE.BoxGeometry(0.4, 0.02, 0.15);
  const tray = new THREE.Mesh(trayGeo, MAT.brushedSteel);
  tray.position.set(0, 0.01, 0.25);
  machine.add(tray);

  // Drip grate
  const grateGeo = new THREE.BoxGeometry(0.35, 0.01, 0.1);
  const grate = new THREE.Mesh(grateGeo, MAT.matteBlack);
  grate.position.set(0, 0.02, 0.22);
  machine.add(grate);

  return machine;
}

/**
 * Create a digital menu board (LCD) on the back wall.
 */
function createDigitalMenuBoard(x, y, z) {
  const board = new THREE.Group();
  board.name = "digital-menu-2025";

  // Frame (matte black)
  const frameGeo = new THREE.BoxGeometry(1.8, 1.3, 0.06);
  const frame = new THREE.Mesh(frameGeo, MAT.matteBlack);
  frame.position.y = 0;
  frame.castShadow = true;
  board.add(frame);

  // LCD screen (emissive)
  const menuTex = createDigitalMenuTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveMap: menuTex,
    emissiveIntensity: 0.7,
    map: menuTex,
    roughness: 0.2,
    metalness: 0.0,
  });
  const screenGeo = new THREE.PlaneGeometry(1.7, 1.2);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.031;
  board.add(screen);

  // Mount bracket
  const mountGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const mount = new THREE.Mesh(mountGeo, MAT.matteBlack);
  mount.position.set(0, -0.7, -0.03);
  board.add(mount);

  board.position.set(x, y, z);
  return board;
}

/**
 * Create a smart speaker (cylindrical with emissive LED ring on top).
 */
function createSmartSpeaker() {
  const speaker = new THREE.Group();
  speaker.name = "smart-speaker-2025";

  // Cylindrical body
  const bodyGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.16, 24);
  const body = new THREE.Mesh(bodyGeo, MAT.matteWhite);
  body.position.y = 0.08;
  body.castShadow = true;
  speaker.add(body);

  // Speaker grille (fabric mesh look — darker band)
  const grilleGeo = new THREE.CylinderGeometry(0.061, 0.071, 0.1, 24, 1, true);
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a8a,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.y = 0.07;
  speaker.add(grille);

  // Emissive LED indicator ring on top
  const ringGeo = new THREE.TorusGeometry(0.035, 0.008, 12, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2a8a5a,
    emissive: 0x2a8a5a,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.2,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.165;
  ring.rotation.x = Math.PI / 2;
  speaker.add(ring);

  // Top cap
  const capGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.01, 24);
  const cap = new THREE.Mesh(capGeo, MAT.matteWhite);
  cap.position.y = 0.165;
  speaker.add(cap);

  return speaker;
}

/**
 * Create a contactless POS terminal with NFC tap-to-pay.
 */
function createPosTerminal() {
  const pos = new THREE.Group();
  pos.name = "pos-terminal-2025";

  // Base
  const baseGeo = new THREE.BoxGeometry(0.18, 0.03, 0.14);
  const base = new THREE.Mesh(baseGeo, MAT.matteBlack);
  base.position.y = 0.015;
  pos.add(base);

  // Screen (angled, emissive with NFC icon)
  const posTex = createPosScreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveMap: posTex,
    emissiveIntensity: 0.7,
    map: posTex,
    roughness: 0.2,
    metalness: 0.1,
  });
  const screenGeo = new THREE.PlaneGeometry(0.16, 0.12);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.12, 0.04);
  screen.rotation.x = -Math.PI / 6;
  pos.add(screen);

  // Screen housing
  const housingGeo = new THREE.BoxGeometry(0.17, 0.14, 0.02);
  const housing = new THREE.Mesh(housingGeo, MAT.matteBlack);
  housing.position.set(0, 0.12, 0.035);
  housing.rotation.x = -Math.PI / 6;
  pos.add(housing);

  // Re-add screen in front of housing
  screen.position.z = 0.046;

  // NFC contactless symbol on top of housing (emissive decal)
  const nfcGeo = new THREE.RingGeometry(0.015, 0.025, 24);
  const nfcMat = new THREE.MeshStandardMaterial({
    color: 0x2a8a5a,
    emissive: 0x2a8a5a,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
  });
  const nfcRing = new THREE.Mesh(nfcGeo, nfcMat);
  nfcRing.position.set(0, 0.19, 0.04);
  nfcRing.rotation.x = -Math.PI / 6;
  pos.add(nfcRing);

  // Card slot
  const slotGeo = new THREE.BoxGeometry(0.08, 0.005, 0.02);
  const slot = new THREE.Mesh(slotGeo, MAT.matteBlack);
  slot.position.set(0, 0.04, 0.06);
  pos.add(slot);

  return pos;
}

/**
 * Create a digital ad screen on a wall.
 */
function createAdScreen(x, y, z, rotY, headline, subline, accent) {
  const screen = new THREE.Group();
  screen.name = "ad-screen-2025";

  // Frame
  const frameGeo = new THREE.BoxGeometry(1.4, 0.9, 0.05);
  const frame = new THREE.Mesh(frameGeo, MAT.matteBlack);
  frame.castShadow = true;
  screen.add(frame);

  // Emissive display
  const adTex = createAdScreenTexture(headline, subline, accent);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveMap: adTex,
    emissiveIntensity: 0.65,
    map: adTex,
    roughness: 0.2,
    metalness: 0.0,
  });
  const displayGeo = new THREE.PlaneGeometry(1.32, 0.82);
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.z = 0.026;
  screen.add(display);

  screen.position.set(x, y, z);
  screen.rotation.y = rotY;
  return screen;
}

/**
 * Create a smart LED ceiling panel (emissive cool-white).
 */
function createLedPanel(x, z) {
  const panel = new THREE.Group();
  panel.name = "led-panel-2025";

  // Panel frame
  const frameGeo = new THREE.BoxGeometry(0.8, 0.04, 0.8);
  const frame = new THREE.Mesh(frameGeo, MAT.aluminum);
  frame.castShadow = true;
  panel.add(frame);

  // Emissive light surface
  const lightGeo = new THREE.PlaneGeometry(0.72, 0.72);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xeef2ff,
    emissive: 0xeef2ff,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.rotation.x = Math.PI / 2;
  light.position.y = -0.02;
  panel.add(light);

  panel.position.set(x, 0, z);
  return panel;
}

/**
 * Create a single plant cluster for the green wall.
 */
function createPlantCluster(x, y, z, scale, greenTone) {
  const plant = new THREE.Group();
  plant.name = "plant-2025";

  const leafMat = new THREE.MeshStandardMaterial({
    color: greenTone,
    roughness: 0.9,
    metalness: 0.0,
  });

  // Foliage — cluster of low-poly spheres
  const foliageGeo = new THREE.SphereGeometry(0.08, 8, 8);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(foliageGeo, leafMat);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(
      Math.cos(angle) * 0.06,
      0.05 + Math.random() * 0.04,
      Math.sin(angle) * 0.06
    );
    leaf.scale.setScalar(0.7 + Math.random() * 0.5);
    leaf.castShadow = true;
    plant.add(leaf);
  }
  // Top leaf
  const topLeaf = new THREE.Mesh(foliageGeo, leafMat);
  topLeaf.position.set(0, 0.12, 0);
  topLeaf.scale.setScalar(0.9);
  plant.add(topLeaf);

  // Small pot
  const potGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.06, 10);
  const pot = new THREE.Mesh(potGeo, MAT.plantPot);
  pot.position.y = -0.03;
  plant.add(pot);

  plant.position.set(x, y, z);
  plant.scale.setScalar(scale);
  return plant;
}

/**
 * Create the green/living wall with multiple plant clusters.
 */
function createGreenWall(x, y, z, rotY) {
  const wall = new THREE.Group();
  wall.name = "green-wall-2025";

  // Backing panel (felt green)
  const backingGeo = new THREE.BoxGeometry(2.4, 1.6, 0.05);
  const backing = new THREE.Mesh(backingGeo, MAT.feltGreen);
  backing.castShadow = true;
  backing.receiveShadow = true;
  wall.add(backing);

  // Plant clusters — 10+ in varying green tones
  const greenTones = [
    0x2a6a3a, 0x3a8a4a, 0x4a9a5a, 0x2a5a2a,
    0x5aaa6a, 0x3a7a3a, 0x4a8a4a, 0x6aba7a,
    0x2a7a4a, 0x3a6a3a, 0x4a7a5a, 0x5a9a6a,
  ];
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const px = -1.0 + col * 1.0 + (Math.random() - 0.5) * 0.15;
      const py = -0.6 + row * 0.4 + (Math.random() - 0.5) * 0.1;
      const pz = 0.04;
      const scale = 0.8 + Math.random() * 0.5;
      const plant = createPlantCluster(px, py, pz, scale, greenTones[idx % greenTones.length]);
      wall.add(plant);
      idx++;
    }
  }

  wall.position.set(x, y, z);
  wall.rotation.y = rotY;
  return wall;
}

/**
 * Create a modern counter bar (matte white + reclaimed wood top).
 */
function createCounter() {
  const counter = new THREE.Group();
  counter.name = "counter-2025";

  // Counter body (matte white)
  const bodyGeo = new THREE.BoxGeometry(3.0, 1.05, 0.7);
  const body = new THREE.Mesh(bodyGeo, MAT.matteWhite);
  body.position.y = 0.525;
  body.castShadow = true;
  body.receiveShadow = true;
  counter.add(body);

  // Reclaimed wood top
  const topGeo = new THREE.BoxGeometry(3.1, 0.04, 0.8);
  const top = new THREE.Mesh(topGeo, MAT.reclaimedWood);
  top.position.y = 1.07;
  top.castShadow = true;
  top.receiveShadow = true;
  counter.add(top);

  // Front panel accent (aluminum strip)
  const stripGeo = new THREE.BoxGeometry(3.0, 0.04, 0.02);
  const strip = new THREE.Mesh(stripGeo, MAT.aluminum);
  strip.position.set(0, 0.8, 0.36);
  counter.add(strip);

  return counter;
}

/**
 * Create a 2020s-attired patron figure with smartphone and earbuds.
 */
function createPatron(x, z, rotY, outfit) {
  const patron = new THREE.Group();
  patron.name = "patron-2025";

  const skinMat = outfit.skinDark ? MAT.skinDark : MAT.skin;
  const hairMat = outfit.hairBrown ? MAT.hairBrown : MAT.hair;

  // Legs (athleisure pants / joggers)
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.8, 10);
  for (const lx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(legGeo, outfit.trousers);
    leg.position.set(lx, 0.4, 0);
    leg.castShadow = true;
    patron.add(leg);
  }

  // Sneakers
  const shoeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.22);
  for (const lx of [-0.1, 0.1]) {
    const shoe = new THREE.Mesh(shoeGeo, MAT.matteWhite);
    shoe.position.set(lx, 0.04, 0.05);
    shoe.castShadow = true;
    patron.add(shoe);
  }

  // Torso (hoodie / sweatshirt / tee)
  const torsoGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.55, 14);
  const torso = new THREE.Mesh(torsoGeo, outfit.top);
  torso.position.y = 1.075;
  torso.castShadow = true;
  patron.add(torso);

  // Hood (if hoodie) — small sphere behind neck
  if (outfit.hoodie) {
    const hoodGeo = new THREE.SphereGeometry(0.14, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const hood = new THREE.Mesh(hoodGeo, outfit.top);
    hood.position.set(0, 1.32, -0.06);
    patron.add(hood);
  }

  // Head
  const headGeo = new THREE.SphereGeometry(0.13, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.5;
  head.castShadow = true;
  patron.add(head);

  // Hair (short cap style)
  const hairGeo = new THREE.SphereGeometry(0.14, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2.2);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 1.53, -0.01);
  patron.add(hair);

  // Arms (slightly forward to hold phone)
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.5, 10);
  for (const ax of [-0.22, 0.22]) {
    const arm = new THREE.Mesh(armGeo, outfit.top);
    arm.position.set(ax, 1.05, 0.08);
    arm.rotation.x = -0.5;
    arm.castShadow = true;
    patron.add(arm);
  }

  // Smartphone in hands (in front of torso)
  const phoneGroup = new THREE.Group();
  phoneGroup.name = "smartphone-2025";
  const phoneBodyGeo = new THREE.BoxGeometry(0.07, 0.14, 0.008);
  const phoneBody = new THREE.Mesh(phoneBodyGeo, MAT.phoneBody);
  phoneGroup.add(phoneBody);
  // Phone screen (emissive)
  const phoneTex = createPhoneScreenTexture();
  const phoneScreenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveMap: phoneTex,
    emissiveIntensity: 0.6,
    map: phoneTex,
    roughness: 0.2,
    metalness: 0.0,
  });
  const phoneScreenGeo = new THREE.PlaneGeometry(0.06, 0.13);
  const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
  phoneScreen.position.z = 0.005;
  phoneGroup.add(phoneScreen);
  phoneGroup.position.set(0, 1.0, 0.18);
  phoneGroup.rotation.x = -0.3;
  patron.add(phoneGroup);

  // Wireless earbuds (one visible per ear)
  const earbudGeo = new THREE.SphereGeometry(0.018, 8, 8);
  for (const ex of [-0.1, 0.1]) {
    const earbud = new THREE.Mesh(earbudGeo, MAT.earbudWhite);
    earbud.position.set(ex, 1.5, 0.12);
    patron.add(earbud);
    // Earbud stem
    const stemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6);
    const stem = new THREE.Mesh(stemGeo, MAT.earbudWhite);
    stem.position.set(ex, 1.48, 0.14);
    stem.rotation.x = 0.4;
    patron.add(stem);
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
 * Setup the 2025 period scene. Adds all content to the provided group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function setupPeriod2025(scene, group) {
  const { width, depth, height } = CAFE_DIMENSIONS;
  const hw = width / 2;
  const hd = depth / 2;

  // ── Adjust shared lighting to bright & cool for 2025 ──
  const ambient = scene.getObjectByProperty("type", "AmbientLight");
  const hemi = scene.getObjectByProperty("type", "HemisphereLight");
  const directional = scene.getObjectByProperty("type", "DirectionalLight");

  _state.savedLightIntensities = {};
  _state.savedLightColors = {};

  if (ambient) {
    _state.savedLightIntensities.ambient = ambient.intensity;
    _state.savedLightColors.ambient = ambient.color.getHex();
    ambient.intensity = 0.7;
    ambient.color.setHex(0xeef2ff);
  }
  if (hemi) {
    _state.savedLightIntensities.hemi = hemi.intensity;
    _state.savedLightColors.hemi = hemi.color.getHex();
    hemi.intensity = 0.6;
    hemi.color.setHex(0xddeeff);
  }
  if (directional) {
    _state.savedLightIntensities.directional = directional.intensity;
    _state.savedLightColors.directional = directional.color.getHex();
    directional.intensity = 0.8;
    directional.color.setHex(0xeef2ff);
  }

  // ── 1. Furniture: Counter bar along back wall ──
  const counter = createCounter();
  counter.position.set(0, 0, hd - 1.2);
  group.add(counter);

  // ── 2. Coffee equipment: Smart espresso machine on counter ──
  const espressoMachine = createEspressoMachine();
  espressoMachine.position.set(-0.9, 1.09, hd - 1.2);
  group.add(espressoMachine);

  // ── 8. Counter technology: Contactless POS terminal ──
  const posTerminal = createPosTerminal();
  posTerminal.position.set(0.9, 1.09, hd - 1.2);
  group.add(posTerminal);

  // ── 4. Music source: Smart speaker on counter ──
  const smartSpeaker = createSmartSpeaker();
  smartSpeaker.position.set(0.2, 1.09, hd - 1.0);
  group.add(smartSpeaker);

  // ── 3. Menu board: Digital LCD menu on back wall ──
  const menuBoard = createDigitalMenuBoard(-1.6, 2.6, hd - 0.05);
  group.add(menuBoard);

  // ── 5. Posters/ads: Digital ad screens on walls ──
  const ad1 = createAdScreen(
    -hw + 0.04, 2.4, -2, Math.PI / 2,
    "GO GREEN", "Bring your own cup ♻️", "#a8e6a8"
  );
  group.add(ad1);

  const ad2 = createAdScreen(
    hw - 0.04, 2.4, -2, -Math.PI / 2,
    "COMPOSTABLE", "100% plant-based packaging", "#a8d8e8"
  );
  group.add(ad2);

  const ad3 = createAdScreen(
    hw - 0.04, 2.4, 3, -Math.PI / 2,
    "CARBON NEUTRAL", "Powered by renewables ☀️", "#e8d8a8"
  );
  group.add(ad3);

  // ── 10. Decor: Green/living wall on side wall ──
  const greenWall = createGreenWall(-hw + 0.06, 1.8, 3.5, Math.PI / 2);
  group.add(greenWall);

  // ── 7. Signage/lighting: Smart LED ceiling panels ──
  const panelPositions = [
    { x: -2.5, z: -3 },
    { x: 2.5, z: -3 },
    { x: -2.5, z: 1 },
    { x: 2.5, z: 1 },
    { x: 0, z: hd - 2 },
  ];
  for (const pp of panelPositions) {
    const panel = createLedPanel(pp.x, pp.z);
    panel.position.y = height - 0.05;
    group.add(panel);
    // Point light from panel for actual illumination
    const panelLight = new THREE.PointLight(0xeef2ff, 0.4, 6, 1.5);
    panelLight.position.set(pp.x, height - 0.15, pp.z);
    group.add(panelLight);
  }

  // ── 1. Furniture: Tables and chairs in seating area ──
  const tablePositions = [
    { x: -2.5, z: -3 },
    { x: 2.5, z: -3 },
    { x: -2.5, z: 1 },
    { x: 2.5, z: 1 },
  ];

  for (const tp of tablePositions) {
    const table = createTable(tp.x, tp.z);
    group.add(table);

    const chairOffsets = [
      { dx: 0, dz: -0.6, rot: 0 },
      { dx: 0, dz: 0.6, rot: Math.PI },
      { dx: -0.7, dz: 0, rot: Math.PI / 2 },
      { dx: 0.7, dz: 0, rot: -Math.PI / 2 },
    ];
    for (const co of chairOffsets) {
      const chair = createChair(tp.x + co.dx, tp.z + co.dz, co.rot);
      group.add(chair);
    }

    // 6. Tableware: Reusable cups with silicone lids + glass water bottles
    const cup1 = createReusableCup(MAT.siliconeLid);
    cup1.position.set(tp.x + 0.2, 0.78, tp.z + 0.1);
    group.add(cup1);

    const cup2 = createReusableCup(MAT.siliconeLidTan);
    cup2.position.set(tp.x - 0.15, 0.78, tp.z - 0.15);
    group.add(cup2);

    const bottle = createGlassBottle();
    bottle.position.set(tp.x - 0.3, 0.78, tp.z + 0.2);
    group.add(bottle);
  }

  // ── 9. Patrons: 2020s-attired figures with smartphones + earbuds ──
  const patronConfigs = [
    {
      x: -2.5, z: -3.65, rotY: 0,
      outfit: { top: MAT.fabricCharcoal, trousers: MAT.fabricHeather, hoodie: true, hairBrown: false, skinDark: false },
    },
    {
      x: 2.5, z: -3.65, rotY: 0,
      outfit: { top: MAT.fabricNavy, trousers: MAT.fabricCharcoal, hoodie: false, hairBrown: true, skinDark: false },
    },
    {
      x: -3.2, z: 1, rotY: -Math.PI / 2,
      outfit: { top: MAT.fabricOlive, trousers: MAT.fabricHeather, hoodie: false, hairBrown: false, skinDark: true },
    },
    {
      x: 3.2, z: 1, rotY: Math.PI / 2,
      outfit: { top: MAT.fabricBurgundy, trousers: MAT.fabricCharcoal, hoodie: true, hairBrown: true, skinDark: false },
    },
  ];

  for (const pc of patronConfigs) {
    const patron = createPatron(pc.x, pc.z, pc.rotY, pc.outfit);
    group.add(patron);
  }

  // ── Additional cool overhead light for the counter area ──
  const counterLight = new THREE.PointLight(0xeef2ff, 0.5, 5, 1.5);
  counterLight.position.set(0, 3.2, hd - 2);
  group.add(counterLight);
}

/**
 * Teardown the 2025 period scene. Removes all content and disposes resources.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
export function teardownPeriod2025(scene, group) {
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
  for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) {
    if (material[key] && material[key].dispose) {
      material[key].dispose();
    }
  }
  material.dispose();
}
