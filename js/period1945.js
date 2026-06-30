/**
 * 1945 era asset configuration — wartime café.
 *
 * Realizes the 1945 stop on the timeline with period-accurate detail across
 * every README category:
 *   1. Furniture      — simple wooden tables & chairs
 *   2. Espresso       — copper lever espresso machine on the counter
 *   3. Menu           — chalkboard with 1940s prices (Coffee 10¢, Espresso 15¢)
 *   4. Music source   — wooden wireless/radio cabinet
 *   5. Posters        — WWII-era propaganda / advertising styling
 *   6. Tableware      — plain ceramic cups & saucers
 *   7. Signage        — warm illuminated sign + pendant lamp
 *   8. Counter tech   — mechanical cash register with visible keys
 *   9. Patrons        — seated figures in 1940s suits, dresses & hats
 *
 * Registration pattern: this module is a side-effect import of main.js. ES
 * module imports are hoisted and executed before the importing module's body,
 * so the `cafe:ready` listener is registered before main.js dispatches it.
 * PeriodManager.registerEra() also auto-mounts if currentYear already matches,
 * which closes the load-time registration race entirely.
 *
 * Builder contract: buildEra1945(ctx) receives { THREE, CAFE_DIMENSIONS } from
 * PeriodManager.ctx and MUST return a THREE.Group. Every mesh uses
 * MeshStandardMaterial so the opacity cross-fade (PeriodManager) reads cleanly.
 */

// ---------------------------------------------------------------------------
// Café layout reference (from CAFE_DIMENSIONS in main.js)
//   Floor:   12m (X) × 10m (Z), centred at origin
//   Counter: (0, 0.55, -4.3), size (3.2, 1.1, 0.9) — top surface at y ≈ 1.1
//   Back wall: z = -5   Side walls: x = ±6   Wall height: 3.5m
//   Seating area: z from 0 to +4 (in front of counter)
// ---------------------------------------------------------------------------

/** Counter top surface height — props rest on top of this. */
const COUNTER_TOP_Y = 1.1;

// ---------------------------------------------------------------------------
// Texture helpers (CanvasTexture for text-bearing props)
// ---------------------------------------------------------------------------

/**
 * Build a chalkboard menu texture with 1940s-appropriate items & prices.
 * @param {typeof import('three')} THREE
 */
function makeChalkboardTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Dark slate-green chalkboard surface
  ctx.fillStyle = '#26301f';
  ctx.fillRect(0, 0, 512, 512);

  // Faint chalk smudges for realism
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = '#e8e2c8';
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 24 + Math.random() * 30, 2 + Math.random() * 4);
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3ecd0';

  // Title
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('— MENU —', 256, 70);

  // Items with 1940s prices
  ctx.font = '34px Georgia, serif';
  const items = [
    ['Coffee', '10¢'],
    ['Espresso', '15¢'],
    ['Tea', '8¢'],
    ['Pastry', '12¢'],
    ['Sandwich', '20¢'],
  ];
  let y = 140;
  for (const [name, price] of items) {
    ctx.textAlign = 'left';
    ctx.fillText(name, 70, y);
    ctx.textAlign = 'right';
    ctx.fillText(price, 442, y);
    // dotted leader line
    ctx.textAlign = 'center';
    ctx.fillText('· · · · · · · · · · · ·', 256, y);
    y += 60;
  }

  // Footer flourish
  ctx.font = 'italic 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Fresh Brewed Daily', 256, 470);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Build a WWII-era propaganda / advertising poster texture.
 * @param {typeof import('three')} THREE
 * @param {object} cfg { bg, title, subtitle, accent }
 */
function makePosterTexture(THREE, cfg) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Bold background block
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, 384, 512);

  // Accent banner stripes
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(0, 0, 384, 54);
  ctx.fillRect(0, 458, 384, 54);

  // Starburst / emblem circle
  ctx.fillStyle = cfg.accent;
  ctx.beginPath();
  ctx.arc(192, 250, 96, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4ecd2';
  ctx.beginPath();
  ctx.arc(192, 250, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cfg.bg;
  ctx.beginPath();
  ctx.arc(192, 250, 62, 0, Math.PI * 2);
  ctx.fill();

  // Title (top)
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px "Arial Black", Arial, sans-serif';
  ctx.fillText(cfg.title.toUpperCase(), 192, 38);

  // Big slogan across emblem
  ctx.fillStyle = cfg.accent;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(cfg.slogan.toUpperCase(), 192, 258);

  // Subtitle (bottom block)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px "Arial Black", Arial, sans-serif';
  ctx.fillText(cfg.subtitle.toUpperCase(), 192, 496);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// Small reusable mesh helpers
// ---------------------------------------------------------------------------

/** Wooden table with a square top and four legs. */
function buildTable(THREE, woodMat, darkWoodMat) {
  const g = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), woodMat);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  const legGeo = new THREE.BoxGeometry(0.09, 0.76, 0.09);
  const off = 0.52;
  const legPositions = [
    [-off, 0.38, 0.32],
    [off, 0.38, 0.32],
    [-off, 0.38, -0.32],
    [off, 0.38, -0.32],
  ];
  for (const p of legPositions) {
    const leg = new THREE.Mesh(legGeo, darkWoodMat);
    leg.position.set(p[0], p[1], p[2]);
    leg.castShadow = true;
    g.add(leg);
  }
  return g;
}

/** Simple wooden chair with a backrest. */
function buildChair(THREE, woodMat, darkWoodMat, seatMat) {
  const g = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), seatMat);
  seat.position.y = 0.46;
  seat.castShadow = true;
  seat.receiveShadow = true;
  g.add(seat);

  const legGeo = new THREE.BoxGeometry(0.05, 0.46, 0.05);
  const o = 0.2;
  for (const [x, z] of [
    [-o, o],
    [o, o],
    [-o, -o],
    [o, -o],
  ]) {
    const leg = new THREE.Mesh(legGeo, darkWoodMat);
    leg.position.set(x, 0.23, z);
    leg.castShadow = true;
    g.add(leg);
  }

  // Backrest posts + panel
  const postGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
  for (const x of [-o, o]) {
    const post = new THREE.Mesh(postGeo, darkWoodMat);
    post.position.set(x, 0.71, -o);
    post.castShadow = true;
    g.add(post);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.28, 0.04), woodMat);
  back.position.set(0, 0.82, -o);
  back.castShadow = true;
  g.add(back);

  return g;
}

/** Plain ceramic cup + saucer. */
function buildCupAndSaucer(THREE, ceramicMat) {
  const g = new THREE.Group();

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.1, 0.015, 20),
    ceramicMat
  );
  saucer.position.y = 0.008;
  saucer.castShadow = true;
  saucer.receiveShadow = true;
  g.add(saucer);

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.045, 0.08, 20),
    ceramicMat
  );
  cup.position.y = 0.06;
  cup.castShadow = true;
  g.add(cup);

  // Simple handle
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.009, 8, 14, Math.PI),
    ceramicMat
  );
  handle.position.set(0.07, 0.06, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);

  // Coffee surface
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.006, 20),
    new THREE.MeshStandardMaterial({ color: 0x2b1a0c, roughness: 0.5, metalness: 0.0 })
  );
  coffee.position.y = 0.094;
  g.add(coffee);

  return g;
}

/** Copper lever espresso machine with a visible lever/arm mechanism. */
function buildEspressoMachine(THREE) {
  const g = new THREE.Group();

  const copper = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    roughness: 0.3,
    metalness: 0.9,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc9a227,
    roughness: 0.35,
    metalness: 0.85,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x222018,
    roughness: 0.5,
    metalness: 0.7,
  });

  // Base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.42), darkMetal);
  base.position.y = 0.03;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Main copper boiler body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.4, 24),
    copper
  );
  body.position.y = 0.27;
  body.castShadow = true;
  g.add(body);

  // Top dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    copper
  );
  dome.position.y = 0.47;
  dome.castShadow = true;
  g.add(dome);

  // Pressure gauge (brass disc on front)
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), brass);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0, 0.34, 0.22);
  g.add(gauge);

  // Group head / portafilter where coffee emerges
  const groupHead = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16), brass);
  groupHead.position.set(0, 0.18, 0.23);
  g.add(groupHead);
  const portafilter = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 14), brass);
  portafilter.position.set(0, 0.1, 0.25);
  portafilter.rotation.x = Math.PI;
  g.add(portafilter);

  // --- Visible LEVER / arm mechanism (the defining feature of a 1940s lever machine) ---
  // Vertical pivot post rising from the body
  const pivotPost = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 12), darkMetal);
  pivotPost.position.set(0, 0.6, 0.0);
  g.add(pivotPost);

  // Horizontal lever arm (brass) — angled upward, the classic pull-down lever
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.05), brass);
  lever.position.set(0.12, 0.74, 0);
  lever.rotation.z = -Math.PI / 7;
  lever.castShadow = true;
  g.add(lever);

  // Lever ball/knob at the far end
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 14, 10), darkMetal);
  knob.position.set(0.28, 0.78, 0);
  g.add(knob);

  // Drip tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.3), darkMetal);
  tray.position.set(0, 0.005, 0.05);
  g.add(tray);

  return g;
}

/** Mechanical cash register with visible keys. */
function buildCashRegister(THREE) {
  const g = new THREE.Group();

  const body = new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.45, metalness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6, metalness: 0.3 });

  // Cabinet
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.4), body);
  cabinet.position.y = 0.17;
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  g.add(cabinet);

  // Raised top section (bell housing)
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.28), body);
  housing.position.set(0, 0.41, -0.06);
  housing.castShadow = true;
  g.add(housing);

  // Glass display window at top front
  const glass = new THREE.MeshStandardMaterial({
    color: 0xeef2f0, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.6,
  });
  const window = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.02), glass);
  window.position.set(0, 0.44, 0.085);
  g.add(window);

  // Row of visible brass keys (the defining mechanical-till feature)
  const keyGeo = new THREE.CylinderGeometry(0.022, 0.025, 0.05, 10);
  const keysPerRow = 6;
  const rows = 2;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < keysPerRow; k++) {
      const key = new THREE.Mesh(keyGeo, brass);
      const x = -0.18 + k * (0.36 / (keysPerRow - 1));
      const y = 0.07 + r * 0.07;
      key.position.set(x, y, 0.205);
      key.castShadow = true;
      g.add(key);
    }
  }

  // Crank handle on the right side
  const crankShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 10), dark);
  crankShaft.rotation.z = Math.PI / 2;
  crankShaft.position.set(0.27, 0.32, -0.06);
  g.add(crankShaft);
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.025), brass);
  crankArm.position.set(0.31, 0.37, -0.06);
  g.add(crankArm);

  return g;
}

/** Wooden wireless/radio cabinet with a fabric grille + knobs. */
function buildRadio(THREE) {
  const g = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.6, metalness: 0.05 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.6, metalness: 0.05 });
  const grille = new THREE.MeshStandardMaterial({ color: 0xd8c9a0, roughness: 0.85, metalness: 0.0 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.85 });

  // Cabinet box
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.42, 0.32), wood);
  cab.position.y = 0.21;
  cab.castShadow = true;
  cab.receiveShadow = true;
  g.add(cab);

  // Speaker grille (fabric panel) on the front
  const speaker = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.3), grille);
  speaker.position.set(-0.08, 0.21, 0.161);
  g.add(speaker);
  // Grille frame trim
  const trim = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.16, 6), darkWood);
  trim.position.set(-0.08, 0.21, 0.163);
  trim.scale.set(1, 1.2, 1);
  g.add(trim);

  // Tuning dial strip on the right of the front
  const dial = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), new THREE.MeshStandardMaterial({ color: 0xece0a8, roughness: 0.4, metalness: 0.1, emissive: 0x554d20, emissiveIntensity: 0.25 }));
  dial.position.set(0.18, 0.24, 0.161);
  g.add(dial);

  // Two brass tuning/volume knobs below the dial
  const knobGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 14);
  for (let i = 0; i < 2; i++) {
    const knob = new THREE.Mesh(knobGeo, brass);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0.14 + i * 0.1, 0.1, 0.165);
    g.add(knob);
  }

  // Top crest (rounded wooden crown)
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.34), darkWood);
  crown.position.y = 0.44;
  g.add(crown);

  return g;
}

/** A 1940s patron figure (stylised) in period clothing. */
function buildPatron(THREE, palette) {
  const g = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: 0xd8a878, roughness: 0.8, metalness: 0.0 });
  const suit = new THREE.MeshStandardMaterial({ color: palette.suit, roughness: 0.7, metalness: 0.05 });
  const hatMat = new THREE.MeshStandardMaterial({ color: palette.hat, roughness: 0.6, metalness: 0.05 });

  // Lower torso / lap area (seated, legs forward)
  const lap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), suit);
  lap.position.y = 0.46;
  lap.castShadow = true;
  g.add(lap);

  // Upper torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.24), suit);
  torso.position.y = 0.66;
  torso.castShadow = true;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), skin);
  head.position.y = 0.93;
  head.castShadow = true;
  g.add(head);

  // Hat (period-appropriate: fedora for gents, small hat for ladies)
  if (palette.hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 18), hatMat);
    brim.position.y = 1.0;
    g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.1, 18), hatMat);
    crown.position.y = 1.05;
    g.add(crown);
  }

  // Arms resting on the lap
  const armGeo = new THREE.BoxGeometry(0.08, 0.22, 0.1);
  for (const x of [-0.22, 0.22]) {
    const arm = new THREE.Mesh(armGeo, suit);
    arm.position.set(x, 0.56, 0.04);
    arm.castShadow = true;
    g.add(arm);
  }

  return g;
}

// ---------------------------------------------------------------------------
// Main era builder
// ---------------------------------------------------------------------------

/**
 * Build the 1945 wartime café as a THREE.Group.
 * @param {{ THREE: typeof import('three'), CAFE_DIMENSIONS: object }} ctx
 * @returns {THREE.Group}
 */
export function buildEra1945(ctx) {
  const { THREE } = ctx;
  const group = new THREE.Group();
  group.name = 'Era-1945';

  // ---- Shared materials (all MeshStandardMaterial for opacity cross-fade) ----
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.8, metalness: 0.0 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3f2716, roughness: 0.8, metalness: 0.0 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2b, roughness: 0.85, metalness: 0.0 });
  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xf0ece2, roughness: 0.4, metalness: 0.0 });

  // =========================================================================
  // 1. FURNITURE — wooden tables & chairs across the seating area
  // =========================================================================
  const tableSpots = [
    [-3, 0, 1.2],
    [3, 0, 1.2],
    [-3, 0, 3.2],
    [3, 0, 3.2],
  ];
  for (const [tx, , tz] of tableSpots) {
    const table = buildTable(THREE, woodMat, darkWoodMat);
    table.position.set(tx, 0, tz);
    group.add(table);

    // Two chairs per table, facing it
    const chairA = buildChair(THREE, woodMat, darkWoodMat, seatMat);
    chairA.position.set(tx, 0, tz + 0.62);
    group.add(chairA);

    const chairB = buildChair(THREE, woodMat, darkWoodMat, seatMat);
    chairB.position.set(tx, 0, tz - 0.62);
    chairB.rotation.y = Math.PI;
    group.add(chairB);

    // 6. TABLEWARE — plain cup & saucer on each table
    const cup = buildCupAndSaucer(THREE, ceramicMat);
    cup.position.set(tx - 0.25, 0.8, tz);
    group.add(cup);
    const cup2 = buildCupAndSaucer(THREE, ceramicMat);
    cup2.position.set(tx + 0.25, 0.8, tz + 0.2);
    group.add(cup2);
  }

  // =========================================================================
  // 2. ESPRESSO MACHINE — copper lever machine on the counter (left)
  // =========================================================================
  const machine = buildEspressoMachine(THREE);
  machine.position.set(-0.9, COUNTER_TOP_Y, -4.3);
  group.add(machine);

  // =========================================================================
  // 8. COUNTER TECH — mechanical cash register with keys (right of counter)
  // =========================================================================
  const till = buildCashRegister(THREE);
  till.position.set(0.95, COUNTER_TOP_Y, -4.3);
  group.add(till);

  // =========================================================================
  // 3. MENU — wall-mounted chalkboard with 1940s prices (back wall)
  // =========================================================================
  const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.7, metalness: 0.0 });
  const chalkTex = makeChalkboardTexture(THREE);
  const chalkMat = new THREE.MeshStandardMaterial({ map: chalkTex, roughness: 0.9, metalness: 0.0 });

  const menuFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.08), boardFrameMat);
  menuFrame.position.set(0, 2.2, -4.9);
  group.add(menuFrame);

  const chalkSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.28), chalkMat);
  chalkSurface.position.set(0, 2.2, -4.85);
  group.add(chalkSurface);

  // =========================================================================
  // 5. POSTERS — WWII-era propaganda styling (left wall)
  // =========================================================================
  const posters = [
    { bg: '#0b3d6b', accent: '#d8b738', title: 'Keep Calm', slogan: 'Victory', subtitle: 'Brew for Britain' },
    { bg: '#7a1d1d', accent: '#e8d27a', title: 'We Can Do It', slogan: 'Buy Bonds', subtitle: 'Support The Troops' },
  ];
  const posterMat = (cfg) =>
    new THREE.MeshStandardMaterial({
      map: makePosterTexture(THREE, cfg),
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x222222,
      emissiveIntensity: 0.15,
    });

  const posterGeo = new THREE.PlaneGeometry(0.96, 1.28);
  posters.forEach((cfg, i) => {
    const poster = new THREE.Mesh(posterGeo, posterMat(cfg));
    poster.position.set(-5.9, 2.1, -1.5 + i * 2.6);
    poster.rotation.y = Math.PI / 2;
    group.add(poster);
  });

  // =========================================================================
  // 4. MUSIC SOURCE — wooden wireless/radio cabinet on a side shelf/table
  // =========================================================================
  const radioStand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), darkWoodMat);
  radioStand.position.set(-5.3, 0.25, 3.5);
  radioStand.castShadow = true;
  radioStand.receiveShadow = true;
  group.add(radioStand);

  const radio = buildRadio(THREE);
  radio.position.set(-5.3, 0.5, 3.5);
  group.add(radio);

  // =========================================================================
  // 7. SIGNAGE & LIGHTING — warm illuminated sign + pendant lamp
  // =========================================================================
  // Glowing back-wall sign (warm "CAFÉ" neon-style slab)
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff8c1a,
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.1,
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.34, 0.06), signMat);
  sign.position.set(0, 3.0, -4.88);
  group.add(sign);
  // Warm light cast by the sign
  const signLight = new THREE.PointLight(0xffb060, 0.6, 6, 2);
  signLight.position.set(0, 3.0, -4.6);
  group.add(signLight);

  // Pendant lamp hanging over the seating area
  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.24, 18, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide })
  );
  lampShade.position.set(0, 3.1, 1.2);
  group.add(lampShade);
  const lampCord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.2 })
  );
  lampCord.position.set(0, 3.4, 1.2);
  group.add(lampCord);
  // Glowing bulb
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffcf6e, emissiveIntensity: 1.2, roughness: 0.3 })
  );
  bulb.position.set(0, 2.98, 1.2);
  group.add(bulb);
  const pendantLight = new THREE.PointLight(0xffd28a, 0.8, 5, 2);
  pendantLight.position.set(0, 2.95, 1.2);
  group.add(pendantLight);

  // =========================================================================
  // 9. PATRONS — seated 1940s figures (suits, dresses, hats)
  // =========================================================================
  const patronPalettes = [
    { suit: 0x35405a, hat: 0x23262e }, // grey-blue suit + dark fedora
    { suit: 0x6b2f2f, hat: 0x4a1f1f }, // maroon dress + matching hat
    { suit: 0x3a3320, hat: 0x222018 }, // brown suit
    { suit: 0x5a4632, hat: null },     // olive dress, hatless
  ];
  // Seat a patron at each table
  patronPalettes.forEach((pal, i) => {
    const [tx, , tz] = tableSpots[i % tableSpots.length];
    const patron = buildPatron(THREE, pal);
    patron.position.set(tx, 0, tz - 0.62);
    patron.rotation.y = Math.PI; // facing into the table
    group.add(patron);
  });

  return group;
}

// ---------------------------------------------------------------------------
// Registration — side-effect on module import.
// Listens for the bootstrapped engine, then registers the 1945 era builder.
// ---------------------------------------------------------------------------

const ERA_META = {
  name: 'Wartime Café (1945)',
  year: 1945,
  menu: [
    { item: 'Coffee', price: '10¢' },
    { item: 'Espresso', price: '15¢' },
    { item: 'Tea', price: '8¢' },
    { item: 'Pastry', price: '12¢' },
    { item: 'Sandwich', price: '20¢' },
  ],
  musicSource: 'Wooden wireless radio',
};

function register() {
  const Cafe = window.Cafe;
  if (!Cafe || !Cafe.periodManager) return;
  Cafe.periodManager.registerEra(1945, buildEra1945, ERA_META);
}

// If the engine is already bootstrapped, register now; otherwise wait.
if (window.Cafe && window.Cafe.periodManager) {
  register();
} else {
  window.addEventListener('cafe:ready', register, { once: true });
}

export default buildEra1945;
