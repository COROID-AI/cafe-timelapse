/**
 * period1945.js — WWII-era café period content (1945).
 *
 * Covers all 10 detail categories from the README:
 *  1. Furniture/decor   — wooden round tables & spindle-back chairs
 *  2. Coffee equipment  — espresso lever machine (Gaggia-style)
 *  3. Menu board        — chalkboard with 1945 prices (canvas texture)
 *  4. Music source      — wooden wireless set radio
 *  5. Posters/ads       — wartime propaganda posters (canvas textures)
 *  6. Tableware         — ceramic cups & saucers
 *  7. Signage/lighting  — gas lamp wall fixtures, warm dim point lights
 *  8. Counter technology— manual mechanical cash register
 *  9. Patrons           — 1940s-attired figures (suits, hats, dresses)
 * 10. (decor)           — wooden counter bar, shelf, framed photos
 *
 * Exported functions are registered via PeriodManager.registerPeriod().
 */

(function () {
  const { CAFE_DIMENSIONS } = window.Cafe;

  // ── Shared material palette (1945 warm/wood tones) ──────────────────────
  const MAT = {
  woodDark: new THREE.MeshStandardMaterial({ color: 0x4a3522, roughness: 0.8, metalness: 0.05 }),
  woodMed: new THREE.MeshStandardMaterial({ color: 0x6b4e34, roughness: 0.75, metalness: 0.05 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0x8b6f4e, roughness: 0.7, metalness: 0.05 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.3, metalness: 0.85 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.35, metalness: 0.8 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 }),
  blackMetal: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.6 }),
  ceramicWhite: new THREE.MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.25, metalness: 0.0 }),
  ceramicBlue: new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.25, metalness: 0.0 }),
  chalkboard: null, // set in setup with canvas texture
  fabricBrown: new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.95, metalness: 0.0 }),
  fabricGray: new THREE.MeshStandardMaterial({ color: 0x555560, roughness: 0.95, metalness: 0.0 }),
  fabricNavy: new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.95, metalness: 0.0 }),
  fabricOlive: new THREE.MeshStandardMaterial({ color: 0x4a5a30, roughness: 0.95, metalness: 0.0 }),
  fabricBurgundy: new THREE.MeshStandardMaterial({ color: 0x6a2a30, roughness: 0.95, metalness: 0.0 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd4a878, roughness: 0.8, metalness: 0.0 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9, metalness: 0.0 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.6 }),
};

// ── Canvas texture helpers ──────────────────────────────────────────────

/**
 * Create a chalkboard menu texture with 1945 prices.
 * High-resolution canvas ensures text remains legible up close.
 */
function createChalkboardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  // Dark green chalkboard background
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
  ctx.fillText("— CAFFÈ MENU —", canvas.width / 2, 80);

  // Decorative line
  ctx.strokeStyle = "#e8e8d8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(200, 110);
  ctx.lineTo(canvas.width - 200, 110);
  ctx.stroke();

  // Menu items with 1945 prices
  ctx.font = "44px Georgia, serif";
  ctx.textAlign = "left";
  const items = [
    { name: "Espresso", price: "5¢" },
    { name: "Cappuccino", price: "8¢" },
    { name: "Caffè Latte", price: "7¢" },
    { name: "Pastry", price: "3¢" },
    { name: "Sandwich", price: "10¢" },
    { name: "Soup of the Day", price: "6¢" },
    { name: "Bread & Butter", price: "2¢" },
    { name: "Tea", price: "4¢" },
  ];

  let y = 180;
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
    y += 68;
  }

  // Footer note
  ctx.fillStyle = "rgba(232,232,216,0.6)";
  ctx.font = "italic 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("Prices subject to wartime regulations", canvas.width / 2, canvas.height - 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a wartime propaganda poster texture.
 */
function createPosterTexture(title, subtitle, accentColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = "#f0e8d0";
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Title
  ctx.fillStyle = "#f0e8d0";
  ctx.font = "bold 56px Impact, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, 120);

  // Decorative star/emblem area
  ctx.font = "120px Georgia, serif";
  ctx.fillText("★", canvas.width / 2, 320);

  // Subtitle
  ctx.font = "bold 36px Georgia, serif";
  const words = subtitle.split(" ");
  let line = "";
  let yPos = 420;
  const maxWidth = canvas.width - 80;
  for (const word of words) {
    const testLine = line ? line + " " + word : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, canvas.width / 2, yPos);
      line = word;
      yPos += 48;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, canvas.width / 2, yPos);

  // Bottom banner
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  ctx.fillStyle = "#f0e8d0";
  ctx.font = "bold 24px Georgia, serif";
  ctx.fillText("1945", canvas.width / 2, canvas.height - 30);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a framed photo texture (sepia-toned).
 */
function createPhotoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  // Sepia background
  ctx.fillStyle = "#d4c4a8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simple landscape silhouette
  ctx.fillStyle = "#8a7a5a";
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(60, 140);
  ctx.lineTo(120, 170);
  ctx.lineTo(180, 120);
  ctx.lineTo(256, 160);
  ctx.lineTo(256, 320);
  ctx.lineTo(0, 320);
  ctx.closePath();
  ctx.fill();

  // Sky gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, "rgba(180,150,100,0.3)");
  grad.addColorStop(1, "rgba(180,150,100,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ── Geometry builders ───────────────────────────────────────────────────

/**
 * Create a wooden round table with a single pedestal base.
 */
function createTable(x, z) {
  const table = new THREE.Group();
  table.name = "table-1945";

  // Tabletop
  const topGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 24);
  const top = new THREE.Mesh(topGeo, MAT.woodMed);
  top.position.y = 0.75;
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);

  // Pedestal
  const pedGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.72, 12);
  const ped = new THREE.Mesh(pedGeo, MAT.woodDark);
  ped.position.y = 0.36;
  ped.castShadow = true;
  table.add(ped);

  // Base foot
  const footGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.06, 16);
  const foot = new THREE.Mesh(footGeo, MAT.woodDark);
  foot.position.y = 0.03;
  foot.castShadow = true;
  foot.receiveShadow = true;
  table.add(foot);

  table.position.set(x, 0, z);
  return table;
}

/**
 * Create a spindle-back wooden chair.
 */
function createChair(x, z, rotY) {
  const chair = new THREE.Group();
  chair.name = "chair-1945";

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.42, 0.04, 0.42);
  const seat = new THREE.Mesh(seatGeo, MAT.woodMed);
  seat.position.y = 0.45;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  // Four legs
  const legGeo = new THREE.BoxGeometry(0.05, 0.45, 0.05);
  const legPositions = [
    [-0.17, 0.225, -0.17],
    [0.17, 0.225, -0.17],
    [-0.17, 0.225, 0.17],
    [0.17, 0.225, 0.17],
  ];
  for (const [lx, ly, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, MAT.woodDark);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    chair.add(leg);
  }

  // Back: two vertical posts
  const postGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
  for (const bx of [-0.17, 0.17]) {
    const post = new THREE.Mesh(postGeo, MAT.woodDark);
    post.position.set(bx, 0.7, -0.17);
    post.castShadow = true;
    chair.add(post);
  }

  // Spindles between posts
  const spindleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  for (let i = 0; i < 3; i++) {
    for (const bx of [-0.17, 0.17]) {
      const spindle = new THREE.Mesh(spindleGeo, MAT.woodDark);
      spindle.position.set(bx, 0.55 + i * 0.08, -0.17);
      spindle.rotation.z = Math.PI / 2;
      chair.add(spindle);
    }
  }
  // Horizontal spindles
  const hSpindleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.34, 8);
  hSpindleGeo.rotateZ(Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const h = new THREE.Mesh(hSpindleGeo, MAT.woodDark);
    h.position.set(0, 0.55 + i * 0.08, -0.17);
    chair.add(h);
  }

  // Top rail
  const railGeo = new THREE.BoxGeometry(0.4, 0.05, 0.05);
  const rail = new THREE.Mesh(railGeo, MAT.woodDark);
  rail.position.set(0, 0.95, -0.17);
  rail.castShadow = true;
  chair.add(rail);

  chair.position.set(x, 0, z);
  chair.rotation.y = rotY;
  return chair;
}

/**
 * Create a ceramic cup with saucer.
 */
function createCupAndSaucer() {
  const cupGroup = new THREE.Group();
  cupGroup.name = "cup-saucer-1945";

  // Saucer
  const saucerGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.015, 20);
  const saucer = new THREE.Mesh(saucerGeo, MAT.ceramicWhite);
  saucer.position.y = 0.008;
  saucer.castShadow = true;
  cupGroup.add(saucer);

  // Cup body
  const cupGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.07, 20);
  const cup = new THREE.Mesh(cupGeo, MAT.ceramicWhite);
  cup.position.y = 0.05;
  cup.castShadow = true;
  cupGroup.add(cup);

  // Handle (torus segment)
  const handleGeo = new THREE.TorusGeometry(0.025, 0.008, 8, 12, Math.PI);
  const handle = new THREE.Mesh(handleGeo, MAT.ceramicWhite);
  handle.position.set(0.065, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  handle.castShadow = true;
  cupGroup.add(handle);

  // Coffee inside (dark liquid)
  const liquidGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.005, 20);
  const liquidMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.2, metalness: 0.0 });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = 0.082;
  cupGroup.add(liquid);

  return cupGroup;
}

/**
 * Create an espresso lever machine (Gaggia-style) for the counter.
 */
function createEspressoMachine() {
  const machine = new THREE.Group();
  machine.name = "espresso-machine-1945";

  // Base body
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.35, 0.35);
  const body = new THREE.Mesh(bodyGeo, MAT.brass);
  body.position.y = 0.175;
  body.castShadow = true;
  machine.add(body);

  // Top section (boiler housing)
  const topGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 20);
  const top = new THREE.Mesh(topGeo, MAT.copper);
  top.position.y = 0.475;
  top.castShadow = true;
  machine.add(top);

  // Pressure gauge
  const gaugeGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16);
  const gauge = new THREE.Mesh(gaugeGeo, MAT.brass);
  gauge.position.set(0.15, 0.3, 0.18);
  gauge.rotation.x = Math.PI / 2;
  machine.add(gauge);

  // Lever arm (horizontal then angled up)
  const leverBaseGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
  const leverBase = new THREE.Mesh(leverBaseGeo, MAT.blackMetal);
  leverBase.position.set(-0.2, 0.35, 0);
  leverBase.rotation.z = Math.PI / 2;
  machine.add(leverBase);

  const leverArmGeo = new THREE.BoxGeometry(0.2, 0.03, 0.03);
  const leverArm = new THREE.Mesh(leverArmGeo, MAT.woodDark);
  leverArm.position.set(-0.32, 0.42, 0);
  leverArm.rotation.z = -0.3;
  machine.add(leverArm);

  // Group head (where coffee comes out)
  const groupHeadGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.1, 12);
  const groupHead = new THREE.Mesh(groupHeadGeo, MAT.brass);
  groupHead.position.set(0, 0.08, 0.12);
  machine.add(groupHead);

  // Portafilter
  const pfGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
  const portafilter = new THREE.Mesh(pfGeo, MAT.steel);
  portafilter.position.set(0, 0.03, 0.12);
  machine.add(portafilter);

  // Steam wand
  const wandGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8);
  const wand = new THREE.Mesh(wandGeo, MAT.steel);
  wand.position.set(0.22, 0.3, 0.1);
  wand.rotation.z = -0.4;
  machine.add(wand);

  // Drip tray
  const trayGeo = new THREE.BoxGeometry(0.45, 0.02, 0.3);
  const tray = new THREE.Mesh(trayGeo, MAT.steel);
  tray.position.y = 0.01;
  machine.add(tray);

  return machine;
}

/**
 * Create a wooden wireless set radio (1940s style).
 */
function createRadio() {
  const radio = new THREE.Group();
  radio.name = "wireless-radio-1945";

  // Wooden cabinet
  const cabGeo = new THREE.BoxGeometry(0.5, 0.35, 0.25);
  const cabinet = new THREE.Mesh(cabGeo, MAT.woodDark);
  cabinet.position.y = 0.175;
  cabinet.castShadow = true;
  radio.add(cabinet);

  // Speaker grille (canvas texture with grille pattern)
  const grilleCanvas = document.createElement("canvas");
  grilleCanvas.width = 256;
  grilleCanvas.height = 256;
  const gctx = grilleCanvas.getContext("2d");
  gctx.fillStyle = "#3a2a1a";
  gctx.fillRect(0, 0, 256, 256);
  gctx.fillStyle = "#1a1a1a";
  for (let x = 0; x < 256; x += 8) {
    for (let y = 0; y < 256; y += 8) {
      gctx.beginPath();
      gctx.arc(x + 4, y + 4, 2, 0, Math.PI * 2);
      gctx.fill();
    }
  }
  const grilleTex = new THREE.CanvasTexture(grilleCanvas);
  grilleTex.anisotropy = 4;
  const grilleMat = new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.8 });

  const grilleGeo = new THREE.PlaneGeometry(0.3, 0.25);
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(-0.08, 0.18, 0.126);
  radio.add(grille);

  // Tuning dial (glass)
  const dialGeo = new THREE.PlaneGeometry(0.12, 0.08);
  const dialMat = new THREE.MeshStandardMaterial({
    color: 0xddcc88,
    roughness: 0.15,
    metalness: 0.0,
    emissive: 0x443300,
    emissiveIntensity: 0.3,
  });
  const dial = new THREE.Mesh(dialGeo, dialMat);
  dial.position.set(0.15, 0.22, 0.126);
  radio.add(dial);

  // Tuning knobs
  const knobGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12);
  for (let i = 0; i < 2; i++) {
    const knob = new THREE.Mesh(knobGeo, MAT.brass);
    knob.position.set(0.15 + i * 0.08, 0.1, 0.126);
    knob.rotation.x = Math.PI / 2;
    radio.add(knob);
  }

  // Antenna wire (thin cylinder going up)
  const antGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.4, 6);
  const antenna = new THREE.Mesh(antGeo, MAT.blackMetal);
  antenna.position.set(0.2, 0.55, 0);
  radio.add(antenna);

  return radio;
}

/**
 * Create a manual mechanical cash register.
 */
function createCashRegister() {
  const register = new THREE.Group();
  register.name = "cash-register-1945";

  // Main body
  const bodyGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
  const body = new THREE.Mesh(bodyGeo, MAT.brass);
  body.position.y = 0.15;
  body.castShadow = true;
  register.add(body);

  // Drawer section
  const drawerGeo = new THREE.BoxGeometry(0.38, 0.08, 0.28);
  const drawer = new THREE.Mesh(drawerGeo, MAT.woodDark);
  drawer.position.y = 0.04;
  register.add(drawer);

  // Key buttons (rows of small cylinders)
  const keyGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const key = new THREE.Mesh(keyGeo, MAT.brass);
      key.position.set(-0.15 + col * 0.06, 0.32, -0.1 + row * 0.08);
      register.add(key);
    }
  }

  // Display window
  const displayGeo = new THREE.BoxGeometry(0.25, 0.06, 0.02);
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.0,
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0, 0.28, 0.151);
  register.add(display);

  // Crank handle on side
  const crankGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
  const crank = new THREE.Mesh(crankGeo, MAT.steel);
  crank.position.set(0.21, 0.2, 0);
  crank.rotation.z = Math.PI / 2;
  register.add(crank);

  // Bell on top
  const bellGeo = new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const bell = new THREE.Mesh(bellGeo, MAT.brass);
  bell.position.set(0, 0.32, 0);
  register.add(bell);

  return register;
}

/**
 * Create a gas lamp wall fixture with warm point light.
 */
function createGasLamp(x, y, z, rotY) {
  const lamp = new THREE.Group();
  lamp.name = "gas-lamp-1945";

  // Wall bracket
  const bracketGeo = new THREE.BoxGeometry(0.04, 0.15, 0.04);
  const bracket = new THREE.Mesh(bracketGeo, MAT.brass);
  bracket.position.y = -0.1;
  lamp.add(bracket);

  // Arm extending outward
  const armGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
  const arm = new THREE.Mesh(armGeo, MAT.brass);
  arm.position.set(0.1, -0.05, 0);
  arm.rotation.z = Math.PI / 2;
  lamp.add(arm);

  // Lamp housing (cylindrical)
  const housingGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12);
  const housing = new THREE.Mesh(housingGeo, MAT.brass);
  housing.position.set(0.2, 0.02, 0);
  lamp.add(housing);

  // Glass chimney
  const chimneyGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.1, 12);
  const chimney = new THREE.Mesh(chimneyGeo, MAT.glass);
  chimney.position.set(0.2, 0.13, 0);
  lamp.add(chimney);

  // Warm point light
  const light = new THREE.PointLight(0xffaa44, 0.6, 4, 1.5);
  light.position.set(0.2, 0.1, 0);
  lamp.add(light);

  // Small glowing bulb mesh
  const bulbGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xffaa33,
    emissiveIntensity: 0.8,
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(0.2, 0.1, 0);
  lamp.add(bulb);

  lamp.position.set(x, y, z);
  lamp.rotation.y = rotY;
  return lamp;
}

/**
 * Create a chalkboard menu board on the wall.
 */
function createChalkboard(x, y, z) {
  const board = new THREE.Group();
  board.name = "chalkboard-menu-1945";

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
 * Create a framed wartime poster.
 */
function createPoster(x, y, z, rotY, title, subtitle, color) {
  const poster = new THREE.Group();
  poster.name = "poster-1945";

  // Frame
  const frameGeo = new THREE.BoxGeometry(0.7, 1.05, 0.04);
  const frame = new THREE.Mesh(frameGeo, MAT.woodDark);
  frame.position.z = -0.01;
  poster.add(frame);

  // Poster image
  const tex = createPosterTexture(title, subtitle, color);
  const posterMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.7,
    metalness: 0.0,
  });
  const posterGeo = new THREE.PlaneGeometry(0.6, 0.9);
  const posterMesh = new THREE.Mesh(posterGeo, posterMat);
  posterMesh.position.z = 0.021;
  poster.add(posterMesh);

  poster.position.set(x, y, z);
  poster.rotation.y = rotY;
  return poster;
}

/**
 * Create a framed sepia photo.
 */
function createFramedPhoto(x, y, z, rotY) {
  const photo = new THREE.Group();
  photo.name = "framed-photo-1945";

  const frameGeo = new THREE.BoxGeometry(0.35, 0.44, 0.03);
  const frame = new THREE.Mesh(frameGeo, MAT.woodDark);
  frame.position.z = -0.01;
  photo.add(frame);

  const tex = createPhotoTexture();
  const photoMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const photoGeo = new THREE.PlaneGeometry(0.28, 0.35);
  const photoMesh = new THREE.Mesh(photoGeo, photoMat);
  photoMesh.position.z = 0.016;
  photo.add(photoMesh);

  photo.position.set(x, y, z);
  photo.rotation.y = rotY;
  return photo;
}

/**
 * Create a wooden counter bar.
 */
function createCounter() {
  const counter = new THREE.Group();
  counter.name = "counter-1945";

  // Counter top
  const topGeo = new THREE.BoxGeometry(4, 0.06, 0.7);
  const top = new THREE.Mesh(topGeo, MAT.woodLight);
  top.position.y = 1.0;
  top.castShadow = true;
  top.receiveShadow = true;
  counter.add(top);

  // Front panel
  const frontGeo = new THREE.BoxGeometry(4, 0.94, 0.05);
  const front = new THREE.Mesh(frontGeo, MAT.woodMed);
  front.position.set(0, 0.5, 0.325);
  front.castShadow = true;
  counter.add(front);

  // Side panels
  for (const sx of [-2, 2]) {
    const sideGeo = new THREE.BoxGeometry(0.05, 0.94, 0.7);
    const side = new THREE.Mesh(sideGeo, MAT.woodMed);
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
 * Create a simple 1940s-attired patron figure.
 * @param {number} x
 * @param {number} z
 * @param {number} rotY
 * @param {object} outfit — { suit, hat } material refs
 */
function createPatron(x, z, rotY, outfit) {
  const patron = new THREE.Group();
  patron.name = "patron-1945";

  // Legs (trousers)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.7, 8);
  for (const lx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(legGeo, outfit.trousers);
    leg.position.set(lx, 0.35, 0);
    leg.castShadow = true;
    patron.add(leg);
  }

  // Shoes
  const shoeGeo = new THREE.BoxGeometry(0.1, 0.05, 0.18);
  for (const lx of [-0.1, 0.1]) {
    const shoe = new THREE.Mesh(shoeGeo, MAT.blackMetal);
    shoe.position.set(lx, 0.025, 0.04);
    patron.add(shoe);
  }

  // Torso (jacket/suit)
  const torsoGeo = new THREE.BoxGeometry(0.36, 0.55, 0.22);
  const torso = new THREE.Mesh(torsoGeo, outfit.suit);
  torso.position.y = 0.97;
  torso.castShadow = true;
  patron.add(torso);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.5, 8);
  for (const ax of [-0.22, 0.22]) {
    const arm = new THREE.Mesh(armGeo, outfit.suit);
    arm.position.set(ax, 0.95, 0);
    arm.castShadow = true;
    patron.add(arm);
  }

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
  const neck = new THREE.Mesh(neckGeo, MAT.skin);
  neck.position.y = 1.3;
  patron.add(neck);

  // Head
  const headGeo = new THREE.SphereGeometry(0.12, 16, 12);
  const head = new THREE.Mesh(headGeo, MAT.skin);
  head.position.y = 1.42;
  head.castShadow = true;
  patron.add(head);

  // Hair (thin cap on head)
  if (outfit.hair) {
    const hairGeo = new THREE.SphereGeometry(0.125, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, MAT.hair);
    hair.position.y = 1.44;
    patron.add(hair);
  }

  // Hat (fedora for men, or none)
  if (outfit.hat) {
    const hatBrimGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.015, 16);
    const hatBrim = new THREE.Mesh(hatBrimGeo, outfit.hat);
    hatBrim.position.y = 1.54;
    hatBrim.castShadow = true;
    patron.add(hatBrim);

    const hatCrownGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.1, 16);
    const hatCrown = new THREE.Mesh(hatCrownGeo, outfit.hat);
    hatCrown.position.y = 1.6;
    patron.add(hatCrown);
  }

  patron.position.set(x, 0, z);
  patron.rotation.y = rotY;
  return patron;
}

/**
 * Create a wooden shelf unit for decor.
 */
function createShelf(x, y, z) {
  const shelf = new THREE.Group();
  shelf.name = "shelf-1945";

  // Two horizontal shelves
  for (const sy of [0, 0.3]) {
    const boardGeo = new THREE.BoxGeometry(1.2, 0.03, 0.2);
    const board = new THREE.Mesh(boardGeo, MAT.woodDark);
    board.position.y = sy;
    board.castShadow = true;
    shelf.add(board);
  }

  // Side supports
  for (const sx of [-0.58, 0.58]) {
    const supGeo = new THREE.BoxGeometry(0.04, 0.35, 0.2);
    const sup = new THREE.Mesh(supGeo, MAT.woodDark);
    sup.position.set(sx, 0.15, 0);
    shelf.add(sup);
  }

  shelf.position.set(x, y, z);
  return shelf;
}

// ── Period setup / teardown ─────────────────────────────────────────────

/**
 * Saved references for light adjustment and cleanup.
 */
const _state = {
  savedLightIntensities: null,
  savedLightColors: null,
  canvasTextures: [],
};

/**
 * Setup the 1945 period scene. Adds all content to the provided group.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
function setupPeriod1945(scene, group) {
  const { width, depth, height } = CAFE_DIMENSIONS;
  const hw = width / 2;
  const hd = depth / 2;

  // ── Adjust shared lighting to warm & dim for 1945 ──
  // Find the base lights from SceneManager and dim/warm them.
  const ambient = scene.getObjectByProperty("type", "AmbientLight");
  const hemi = scene.getObjectByProperty("type", "HemisphereLight");
  const directional = scene.getObjectByProperty("type", "DirectionalLight");

  _state.savedLightIntensities = {};
  _state.savedLightColors = {};

  if (ambient) {
    _state.savedLightIntensities.ambient = ambient.intensity;
    _state.savedLightColors.ambient = ambient.color.getHex();
    ambient.intensity = 0.25;
    ambient.color.setHex(0xffd4a0);
  }
  if (hemi) {
    _state.savedLightIntensities.hemi = hemi.intensity;
    _state.savedLightColors.hemi = hemi.color.getHex();
    hemi.intensity = 0.15;
    hemi.color.setHex(0xffcc88);
  }
  if (directional) {
    _state.savedLightIntensities.directional = directional.intensity;
    _state.savedLightColors.directional = directional.color.getHex();
    directional.intensity = 0.35;
    directional.color.setHex(0xffb87a);
  }

  // ── 1. Furniture: Counter bar along back wall ──
  const counter = createCounter();
  counter.position.set(0, 0, hd - 1.2);
  group.add(counter);

  // ── 2. Coffee equipment: Espresso lever machine on counter ──
  const espressoMachine = createEspressoMachine();
  espressoMachine.position.set(-0.8, 1.06, hd - 1.2);
  group.add(espressoMachine);

  // ── 8. Counter technology: Manual cash register ──
  const cashRegister = createCashRegister();
  cashRegister.position.set(0.8, 1.06, hd - 1.2);
  group.add(cashRegister);

  // ── 3. Menu board: Chalkboard on wall behind counter ──
  const chalkboard = createChalkboard(0, 2.6, hd - 0.05);
  group.add(chalkboard);

  // ── 4. Music source: Wireless set radio on shelf ──
  const radio = createRadio();
  radio.position.set(1.5, 1.55, hd - 1.3);
  group.add(radio);

  // ── 5. Posters/ads: Wartime posters on side walls ──
  const poster1 = createPoster(
    -hw + 0.03, 2.2, -2, Math.PI / 2,
    "KEEP CALM", "AND CARRY ON", "#1a4a6a"
  );
  group.add(poster1);

  const poster2 = createPoster(
    hw - 0.03, 2.2, -2, -Math.PI / 2,
    "DIG FOR VICTORY", "GROW YOUR OWN FOOD", "#4a6a2a"
  );
  group.add(poster2);

  const poster3 = createPoster(
    -hw + 0.03, 2.2, 3, Math.PI / 2,
    "VICTORY", "BUY WAR BONDS", "#8a2a2a"
  );
  group.add(poster3);

  // ── Framed sepia photos on walls ──
  const photo1 = createFramedPhoto(hw - 0.03, 2.0, 1, -Math.PI / 2);
  group.add(photo1);

  const photo2 = createFramedPhoto(-hw + 0.03, 2.0, 1, Math.PI / 2);
  group.add(photo2);

  // ── 7. Signage/lighting: Gas lamps on walls ──
  const lampPositions = [
    { x: -hw + 0.15, y: 2.8, z: -4, rotY: Math.PI / 2 },
    { x: hw - 0.15, y: 2.8, z: -4, rotY: -Math.PI / 2 },
    { x: -hw + 0.15, y: 2.8, z: 0, rotY: Math.PI / 2 },
    { x: hw - 0.15, y: 2.8, z: 0, rotY: -Math.PI / 2 },
    { x: -hw + 0.15, y: 2.8, z: 4, rotY: Math.PI / 2 },
    { x: hw - 0.15, y: 2.8, z: 4, rotY: -Math.PI / 2 },
  ];
  for (const lp of lampPositions) {
    const lamp = createGasLamp(lp.x, lp.y, lp.z, lp.rotY);
    group.add(lamp);
  }

  // ── 1. Furniture: Tables and chairs in seating area ──
  const tablePositions = [
    { x: -2.5, z: -3 },
    { x: 2.5, z: -3 },
    { x: -2.5, z: 1 },
    { x: 2.5, z: 1 },
  ];

  for (const tp of tablePositions) {
    // Table
    const table = createTable(tp.x, tp.z);
    group.add(table);

    // 4 chairs around each table
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

    // 6. Tableware: Ceramic cups on tables
    const cup = createCupAndSaucer();
    cup.position.set(tp.x + 0.2, 0.78, tp.z + 0.1);
    group.add(cup);

    const cup2 = createCupAndSaucer();
    cup2.position.set(tp.x - 0.15, 0.78, tp.z - 0.2);
    group.add(cup2);
  }

  // ── Decor: Wooden shelf on wall ──
  const shelf = createShelf(-1.5, 1.8, hd - 0.1);
  group.add(shelf);

  // ── 9. Patrons: 1940s-attired figures at tables ──
  const patronConfigs = [
    { x: -2.5, z: -3.85, rotY: 0, outfit: { suit: MAT.fabricNavy, trousers: MAT.fabricGray, hat: MAT.fabricGray, hair: true } },
    { x: 2.5, z: -3.85, rotY: 0, outfit: { suit: MAT.fabricBrown, trousers: MAT.fabricBrown, hat: MAT.fabricBrown, hair: true } },
    { x: -3.35, z: 1, rotY: -Math.PI / 2, outfit: { suit: MAT.fabricOlive, trousers: MAT.fabricOlive, hat: null, hair: true } },
    { x: 3.35, z: 1, rotY: Math.PI / 2, outfit: { suit: MAT.fabricBurgundy, trousers: MAT.fabricGray, hat: null, hair: true } },
    { x: -2.5, z: 1.85, rotY: Math.PI, outfit: { suit: MAT.fabricGray, trousers: MAT.fabricGray, hat: MAT.fabricGray, hair: true } },
  ];

  for (const pc of patronConfigs) {
    const patron = createPatron(pc.x, pc.z, pc.rotY, pc.outfit);
    group.add(patron);
  }

  // ── Additional warm overhead light for the counter area ──
  const counterLight = new THREE.PointLight(0xffaa55, 0.5, 5, 1.5);
  counterLight.position.set(0, 3.2, hd - 2);
  group.add(counterLight);

  // ── Hanging pendant light over center ──
  const pendantCordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.8, 6);
  const pendantCord = new THREE.Mesh(pendantCordGeo, MAT.blackMetal);
  pendantCord.position.set(0, 3.4, -1);
  group.add(pendantCord);

  const pendantShadeGeo = new THREE.ConeGeometry(0.15, 0.12, 16, 1, true);
  const pendantShadeMat = new THREE.MeshStandardMaterial({
    color: 0x4a3a2a,
    roughness: 0.6,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  const pendantShade = new THREE.Mesh(pendantShadeGeo, pendantShadeMat);
  pendantShade.position.set(0, 2.9, -1);
  group.add(pendantShade);

  const pendantLight = new THREE.PointLight(0xffaa44, 0.4, 6, 1.5);
  pendantLight.position.set(0, 2.8, -1);
  group.add(pendantLight);

  const pendantBulbGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const pendantBulbMat = new THREE.MeshStandardMaterial({
    color: 0xffcc66,
    emissive: 0xffaa33,
    emissiveIntensity: 0.8,
  });
  const pendantBulb = new THREE.Mesh(pendantBulbGeo, pendantBulbMat);
  pendantBulb.position.set(0, 2.82, -1);
  group.add(pendantBulb);
}

/**
 * Teardown the 1945 period scene. Removes all content and disposes resources.
 * @param {THREE.Scene} scene
 * @param {THREE.Group} group
 */
function teardownPeriod1945(scene, group) {
  // Restore shared lighting to original values.
  const ambient = scene.getObjectByProperty("type", "AmbientLight");
  const hemi = scene.getObjectByProperty("type", "HemisphereLight");
  const directional = scene.getObjectByProperty("type", "DirectionalLight");

  if (ambient && _state.savedLightIntensities.ambient !== undefined) {
    ambient.intensity = _state.savedLightIntensities.ambient;
    ambient.color.setHex(_state.savedLightColors.ambient);
  }
  if (hemi && _state.savedLightIntensities.hemi !== undefined) {
    hemi.intensity = _state.savedLightIntensities.hemi;
    hemi.color.setHex(_state.savedLightColors.hemi);
  }
  if (directional && _state.savedLightIntensities.directional !== undefined) {
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

  window.Cafe = window.Cafe || {};
  window.Cafe.setupPeriod1945 = setupPeriod1945;
  window.Cafe.teardownPeriod1945 = teardownPeriod1945;
})();
