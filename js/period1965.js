/**
 * 1965 era asset configuration — mid-century modern café.
 *
 * Realizes the 1965 stop on the timeline with period-accurate detail across
 * every README category, each VISUALLY DISTINCT from the 1945 era:
 *   1. Furniture      — teak tables with splayed tapered legs + molded shell chairs
 *   2. Espresso       — chrome / space-age espresso machine with pressure gauge (NO lever)
 *   3. Menu           — mod typographic menu board with 1960s prices
 *   4. Music source   — freestanding chrome jukebox with colored front panel
 *   5. Posters        — 60s pop-art / Madison-Avenue advertising styling
 *   6. Tableware      — bright melamine (Melmac) cups in mustard / teal / orange
 *   7. Signage        — neon tube emissive signage + sputnik / space-age pendant
 *   8. Counter tech   — early push-button cash register (flat coloured button rows)
 *   9. Patrons        — seated figures in 1960s mod fashion (no hats)
 *
 * Registration pattern mirrors period1945.js exactly: this module is a
 * side-effect import of main.js. ES module imports are hoisted and executed
 * before the importing module's body, so the `cafe:ready` listener is in
 * place before main.js dispatches it. PeriodManager.registerEra() also
 * auto-mounts if currentYear already matches, closing the load-time race.
 *
 * Builder contract: buildEra1965(ctx) receives { THREE, CAFE_DIMENSIONS } from
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
 * Build a mod-style 1960s menu board texture with period-accurate prices.
 * Clean typographic board (NOT a chalkboard) — flat colour fields + bold type.
 * @param {typeof import('three')} THREE
 */
function makeMenuTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Clean cream board (printed menu, not chalk)
  ctx.fillStyle = '#f4ead2';
  ctx.fillRect(0, 0, 512, 512);

  // Bold top + bottom colour bands (Madison-Avenue styling)
  ctx.fillStyle = '#d83a2c'; // pop red
  ctx.fillRect(0, 0, 512, 60);
  ctx.fillStyle = '#2a6f97'; // teal accent
  ctx.fillRect(0, 460, 512, 52);

  // Title in top band
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px "Arial Black", Arial, sans-serif';
  ctx.fillText('MENU', 256, 42);

  // Items with 1960s prices
  ctx.fillStyle = '#2a2520';
  ctx.font = '34px Georgia, serif';
  const items = [
    ['Coffee', '25¢'],
    ['Espresso', '40¢'],
    ['Cappuccino', '50¢'],
    ['Pastry', '30¢'],
    ['Sandwich', '55¢'],
  ];
  let y = 140;
  for (const [name, price] of items) {
    ctx.textAlign = 'left';
    ctx.fillText(name, 70, y);
    ctx.textAlign = 'right';
    ctx.fillText(price, 442, y);
    // clean dotted leader
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9a8a6a';
    ctx.fillText('· · · · · · · · · ·', 256, y);
    ctx.fillStyle = '#2a2520';
    y += 60;
  }

  // Footer slogan
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Coffee, Served The Modern Way', 256, 492);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Build a 60s pop-art / Madison-Avenue advertising poster texture.
 * Bold flat colour blocks + geometric shapes (NOT the 1945 starburst emblem).
 * @param {typeof import('three')} THREE
 * @param {object} cfg { bg, shape, accent, title, subtitle }
 */
function makePopArtPosterTexture(THREE, cfg) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Bold flat background
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, 384, 512);

  // Geometric pop-art shape (concentric squares / target — classic 60s motif)
  ctx.fillStyle = cfg.accent;
  ctx.beginPath();
  ctx.arc(192, 256, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cfg.bg;
  ctx.beginPath();
  ctx.arc(192, 256, 112, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cfg.shape;
  ctx.beginPath();
  ctx.arc(192, 256, 74, 0, Math.PI * 2);
  ctx.fill();

  // Hard-edged colour bands top + bottom
  ctx.fillStyle = cfg.accent;
  ctx.fillRect(0, 0, 384, 48);
  ctx.fillStyle = cfg.shape;
  ctx.fillRect(0, 464, 384, 48);

  // Title (top band) — bold sans, all-caps
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "Arial Black", Arial, sans-serif';
  ctx.fillText(cfg.title.toUpperCase(), 192, 34);

  // Big word across the emblem
  ctx.fillStyle = cfg.accent;
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(cfg.word.toUpperCase(), 192, 266);

  // Subtitle (bottom band)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Arial Black", Arial, sans-serif';
  ctx.fillText(cfg.subtitle.toUpperCase(), 192, 496);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// Small reusable mesh helpers
// ---------------------------------------------------------------------------

/**
 * Mid-century table: teak top with splayed, tapered legs.
 * Distinct from 1945's chunky square-leg wooden table.
 */
function buildTable(THREE, teakMat, darkTeakMat) {
  const g = new THREE.Group();

  // Teak tabletop with a slight bevel feel
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), teakMat);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  g.add(top);

  // Splayed tapered legs — the defining mid-century silhouette.
  // Built as thin angled boxes radiating outward.
  const legGeo = new THREE.BoxGeometry(0.05, 0.74, 0.05);
  const off = 0.5;
  const legPositions = [
    [-off, 0.37, 0.3],
    [off, 0.37, 0.3],
    [-off, 0.37, -0.3],
    [off, 0.37, -0.3],
  ];
  const splay = 0.12;
  legPositions.forEach(([x, y, z], i) => {
    const leg = new THREE.Mesh(legGeo, darkTeakMat);
    leg.position.set(x, y, z);
    // tilt outward
    leg.rotation.z = (x < 0 ? -1 : 1) * 0.12;
    leg.rotation.x = (z < 0 ? -1 : 1) * 0.12;
    leg.castShadow = true;
    g.add(leg);
  });

  return g;
}

/**
 * Molded shell chair (Eames-style) on a thin metal leg base.
 * Distinct from 1945's boxy wooden chair with flat back panel.
 */
function buildShellChair(THREE, shellMat, chromeLegMat) {
  const g = new THREE.Group();

  // Molded shell seat — a flattened, curved shell (half-sphere slice scaled)
  const shellGeo = new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI, 0, Math.PI / 2);
  const seat = new THREE.Mesh(shellGeo, shellMat);
  seat.scale.set(1, 0.6, 1);
  seat.position.y = 0.5;
  seat.rotation.x = -0.08;
  seat.castShadow = true;
  seat.receiveShadow = true;
  g.add(seat);

  // Four slim chrome rod legs (splayed)
  const legGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.5, 8);
  const o = 0.19;
  for (const [x, z] of [
    [-o, o],
    [o, o],
    [-o, -o],
    [o, -o],
  ]) {
    const leg = new THREE.Mesh(legGeo, chromeLegMat);
    leg.position.set(x, 0.25, z);
    leg.rotation.z = x < 0 ? -0.06 : 0.06;
    leg.castShadow = true;
    g.add(leg);
  }

  return g;
}

/**
 * Bright melamine (Melmac) diner cup — bold 60s colour, no saucer lip ring.
 * Distinct from 1945's plain white ceramic cup & saucer.
 */
function buildMelamineCup(THREE, colorMat) {
  const g = new THREE.Group();

  // Flared melamine cup body
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.05, 0.09, 18),
    colorMat
  );
  cup.position.y = 0.045;
  cup.castShadow = true;
  cup.receiveShadow = true;
  g.add(cup);

  // Simple handle
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.01, 8, 14, Math.PI),
    colorMat
  );
  handle.position.set(0.078, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);

  // Coffee surface
  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.057, 0.057, 0.006, 18),
    new THREE.MeshStandardMaterial({ color: 0x2b1a0c, roughness: 0.5, metalness: 0.0 })
  );
  coffee.position.y = 0.088;
  g.add(coffee);

  return g;
}

/**
 * Chrome / space-age espresso machine: boxy chrome body with a pressure
 * gauge. NO visible pull-down lever — the defining difference from 1945's
 * copper lever machine.
 */
function buildChromeEspressoMachine(THREE) {
  const g = new THREE.Group();

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    roughness: 0.18,
    metalness: 0.95,
  });
  const blackTrim = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    roughness: 0.4,
    metalness: 0.6,
  });
  const gaugeGlass = new THREE.MeshStandardMaterial({
    color: 0xf2f4f6,
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0x335577,
    emissiveIntensity: 0.2,
  });

  // Rectangular chrome base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.46), chrome);
  base.position.y = 0.04;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Main boxy chrome body (space-age flat-faced)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.44, 0.4), chrome);
  body.position.y = 0.3;
  body.castShadow = true;
  g.add(body);

  // Black trim band across the front (control strip)
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.02), blackTrim);
  strip.position.set(0, 0.36, 0.205);
  g.add(strip);

  // Two small chrome knobs/dials on the strip
  const dialGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 14);
  for (let i = 0; i < 2; i++) {
    const dial = new THREE.Mesh(dialGeo, chrome);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(-0.1 + i * 0.2, 0.36, 0.216);
    g.add(dial);
  }

  // Pressure gauge (round glass-fronted dial) on the upper front
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 18), gaugeGlass);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(0, 0.46, 0.21);
  g.add(gauge);
  // Gauge bezel ring
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 10, 20), chrome);
  bezel.position.set(0, 0.46, 0.222);
  g.add(bezel);

  // Steam wand (chrome tube) on the right side
  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), chrome);
  wand.position.set(0.31, 0.34, 0.05);
  wand.rotation.z = -0.7;
  g.add(wand);

  // Group head / spout where coffee emerges
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.08, 12), blackTrim);
  spout.position.set(0, 0.16, 0.21);
  g.add(spout);

  // Drip tray
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 0.32), chrome);
  tray.position.set(0, 0.005, 0.06);
  g.add(tray);

  return g;
}

/**
 * Early push-button cash register: flat coloured button rows (no raised
 * brass mechanical keys). Distinct from 1945's raised-key mechanical till.
 */
function buildPushButtonRegister(THREE) {
  const g = new THREE.Group();

  const body = new THREE.MeshStandardMaterial({ color: 0x2b6b6b, roughness: 0.4, metalness: 0.5 }); // teal
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.2, metalness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.5, metalness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd83a2c, roughness: 0.4, metalness: 0.2 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xe8c23a, roughness: 0.4, metalness: 0.2 });

  // Main cabinet
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.4), body);
  cabinet.position.y = 0.17;
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  g.add(cabinet);

  // Slanted top control deck (where the flat buttons live)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.28), dark);
  deck.position.set(0, 0.38, 0.02);
  deck.rotation.x = -0.35; // slanted toward the barista
  g.add(deck);

  // Flat coloured push-buttons arranged in rows on the deck
  const btnGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.014, 12);
  const btnColors = [red, yellow, chrome, dark];
  const cols = 5;
  const rows = 2;
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      const btn = new THREE.Mesh(btnGeo, btnColors[(r + cI) % btnColors.length]);
      const x = -0.18 + cI * (0.36 / (cols - 1));
      const z = 0.12 - r * 0.1;
      // place on slanted deck
      btn.position.set(x, 0.4 - r * 0.035, z);
      btn.rotation.x = -0.35;
      g.add(btn);
    }
  }

  // Chrome pop-up numeral display window on top
  const display = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.07, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.15, metalness: 0.2, emissive: 0x88aa66, emissiveIntensity: 0.25 })
  );
  display.position.set(0, 0.44, -0.08);
  g.add(display);

  // Cash drawer pull (chrome)
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.02), chrome);
  drawer.position.set(0, 0.08, 0.205);
  g.add(drawer);

  return g;
}

/**
 * Freestanding chrome jukebox: dome top + coloured front panel + record slot.
 * Distinct from 1945's wooden radio cabinet. Serves as the music source.
 */
function buildJukebox(THREE) {
  const g = new THREE.Group();

  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.15, metalness: 0.95 });
  const colored = new THREE.MeshStandardMaterial({ color: 0xc23b5a, roughness: 0.3, metalness: 0.2 }); // pink-red
  const teal = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.3, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.5, metalness: 0.3 });
  const glow = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffaa33, emissiveIntensity: 0.8, roughness: 0.3 });

  // Lower cabinet box
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.55), chrome);
  cab.position.y = 0.45;
  cab.castShadow = true;
  cab.receiveShadow = true;
  g.add(cab);

  // Coloured front panel (the signature jukebox face)
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.7, 0.04), colored);
  panel.position.set(0, 0.5, 0.28);
  g.add(panel);

  // Teal trim frame around the panel
  const frameT = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.05), teal);
  frameT.position.set(0, 0.84, 0.28);
  g.add(frameT);
  const frameB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.05), teal);
  frameB.position.set(0, 0.16, 0.28);
  g.add(frameB);

  // Record slot (dark rectangle) in the lower front
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), dark);
  slot.position.set(0, 0.28, 0.295);
  g.add(slot);

  // Glowing selection buttons grid (little dots) on the panel
  const dotGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.012, 10);
  for (let r = 0; r < 3; r++) {
    for (let cI = 0; cI < 5; cI++) {
      const dot = new THREE.Mesh(dotGeo, glow);
      dot.rotation.x = Math.PI / 2;
      dot.position.set(-0.2 + cI * 0.1, 0.62 - r * 0.08, 0.295);
      g.add(dot);
    }
  }

  // Chrome dome top (the classic jukebox crown)
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    chrome
  );
  dome.position.y = 0.9;
  dome.castShadow = true;
  g.add(dome);

  // Glowing tube inside the dome (visible glow)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 14), glow);
  tube.position.set(0, 0.95, 0);
  g.add(tube);

  // Warm glow light from the jukebox
  const jukeLight = new THREE.PointLight(0xffb070, 0.6, 4, 2);
  jukeLight.position.set(0, 1.1, 0.3);
  g.add(jukeLight);

  return g;
}

/**
 * A 1960s patron figure (stylised) in mod clothing — beehive / short hair,
 * slim suits or mod dresses. NO hats (distinct from 1945's fedora figures).
 */
function buildPatron(THREE, palette) {
  const g = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: 0xd8a878, roughness: 0.8, metalness: 0.0 });
  const outfit = new THREE.MeshStandardMaterial({ color: palette.outfit, roughness: 0.7, metalness: 0.05 });
  const hairMat = new THREE.MeshStandardMaterial({ color: palette.hair, roughness: 0.85, metalness: 0.0 });

  // Lower torso / lap area (seated)
  const lap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), outfit);
  lap.position.y = 0.46;
  lap.castShadow = true;
  g.add(lap);

  // Upper torso (slim cut)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.22), outfit);
  torso.position.y = 0.66;
  torso.castShadow = true;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), skin);
  head.position.y = 0.93;
  head.castShadow = true;
  g.add(head);

  // Hair — beehive (tall rounded cap) for women / short crop for men
  if (palette.beehive) {
    const hive = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.16, 16),
      hairMat
    );
    hive.position.y = 1.06;
    g.add(hive);
  } else {
    // Short crop — a thin hair cap
    const crop = new THREE.Mesh(
      new THREE.SphereGeometry(0.102, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      hairMat
    );
    crop.position.y = 0.95;
    g.add(crop);
  }

  // Arms resting on the lap
  const armGeo = new THREE.BoxGeometry(0.08, 0.22, 0.1);
  for (const x of [-0.22, 0.22]) {
    const arm = new THREE.Mesh(armGeo, outfit);
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
 * Build the 1965 mid-century café as a THREE.Group.
 * @param {{ THREE: typeof import('three'), CAFE_DIMENSIONS: object }} ctx
 * @returns {THREE.Group}
 */
export function buildEra1965(ctx) {
  const { THREE } = ctx;
  const group = new THREE.Group();
  group.name = 'Era-1965';

  // ---- Shared materials (all MeshStandardMaterial for opacity cross-fade) ----
  const teakMat = new THREE.MeshStandardMaterial({ color: 0x9c6b33, roughness: 0.55, metalness: 0.05 });
  const darkTeakMat = new THREE.MeshStandardMaterial({ color: 0x6b4a24, roughness: 0.55, metalness: 0.05 });
  const chromeLegMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: 0.25, metalness: 0.9 });
  // Molded shell chair colours — bright 60s
  const shellMats = [
    new THREE.MeshStandardMaterial({ color: 0xe0a020, roughness: 0.5, metalness: 0.05 }), // mustard
    new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.5, metalness: 0.05 }),  // teal
    new THREE.MeshStandardMaterial({ color: 0xd83a2c, roughness: 0.5, metalness: 0.05 }),  // pop red
    new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5, metalness: 0.05 }),  // off-white
  ];
  // Melamine cup colours — bright diner melmac
  const melamineMats = [
    new THREE.MeshStandardMaterial({ color: 0xe0a020, roughness: 0.55, metalness: 0.0 }), // mustard
    new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.55, metalness: 0.0 }),  // teal
    new THREE.MeshStandardMaterial({ color: 0xd86a2c, roughness: 0.55, metalness: 0.0 }),  // orange
  ];

  // =========================================================================
  // 1. FURNITURE — teak tables with splayed legs + molded shell chairs
  // =========================================================================
  const tableSpots = [
    [-3, 0, 1.2],
    [3, 0, 1.2],
    [-3, 0, 3.2],
    [3, 0, 3.2],
  ];
  tableSpots.forEach(([tx, , tz], i) => {
    const table = buildTable(THREE, teakMat, darkTeakMat);
    table.position.set(tx, 0, tz);
    group.add(table);

    // Two molded shell chairs per table
    const chairA = buildShellChair(THREE, shellMats[i % shellMats.length], chromeLegMat);
    chairA.position.set(tx, 0, tz + 0.62);
    group.add(chairA);

    const chairB = buildShellChair(THREE, shellMats[(i + 1) % shellMats.length], chromeLegMat);
    chairB.position.set(tx, 0, tz - 0.62);
    chairB.rotation.y = Math.PI;
    group.add(chairB);

    // 6. TABLEWARE — bright melamine cups on each table
    const cup = buildMelamineCup(THREE, melamineMats[i % melamineMats.length]);
    cup.position.set(tx - 0.25, 0.79, tz);
    group.add(cup);
    const cup2 = buildMelamineCup(THREE, melamineMats[(i + 1) % melamineMats.length]);
    cup2.position.set(tx + 0.25, 0.79, tz + 0.2);
    group.add(cup2);
  });

  // =========================================================================
  // 2. ESPRESSO MACHINE — chrome space-age machine on the counter (left)
  //    Boxy chrome body + pressure gauge, NO lever.
  // =========================================================================
  const machine = buildChromeEspressoMachine(THREE);
  machine.position.set(-0.9, COUNTER_TOP_Y, -4.3);
  group.add(machine);

  // =========================================================================
  // 8. COUNTER TECH — early push-button register (right of counter)
  // =========================================================================
  const till = buildPushButtonRegister(THREE);
  till.position.set(0.95, COUNTER_TOP_Y, -4.3);
  group.add(till);

  // =========================================================================
  // 3. MENU — mod typographic menu board with 1960s prices (back wall)
  // =========================================================================
  const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.5 });
  const menuTex = makeMenuTexture(THREE);
  const menuMat = new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.6, metalness: 0.05 });

  const menuFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.08), boardFrameMat);
  menuFrame.position.set(0, 2.2, -4.9);
  group.add(menuFrame);

  const menuSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.28), menuMat);
  menuSurface.position.set(0, 2.2, -4.85);
  group.add(menuSurface);

  // =========================================================================
  // 5. POSTERS — 60s pop-art / Madison-Avenue styling (left wall)
  // =========================================================================
  const posters = [
    { bg: '#ffd33d', accent: '#d83a2c', shape: '#2a6f97', title: 'Go-Go', word: 'GROOVY', subtitle: 'The In-Crowd' },
    { bg: '#2a6f97', accent: '#ffd33d', shape: '#d83a2c', title: 'Mod Life', word: 'SWING', subtitle: 'Drink Modern' },
  ];
  const posterMat = (cfg) =>
    new THREE.MeshStandardMaterial({
      map: makePopArtPosterTexture(THREE, cfg),
      roughness: 0.6,
      metalness: 0.05,
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
  // 4. MUSIC SOURCE — freestanding chrome jukebox on a side spot
  // =========================================================================
  const jukebox = buildJukebox(THREE);
  jukebox.position.set(-5.0, 0, 3.5);
  group.add(jukebox);

  // =========================================================================
  // 7. SIGNAGE & LIGHTING — neon tube signage + sputnik pendant light
  // =========================================================================
  // Neon "CAFÉ" tube sign on the back wall (emissive coloured tubes)
  const neonRed = new THREE.MeshStandardMaterial({
    color: 0xff2d6b,
    emissive: 0xff2d6b,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.1,
  });
  const neonBlue = new THREE.MeshStandardMaterial({
    color: 0x33ccff,
    emissive: 0x33ccff,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.1,
  });
  // A horizontal neon tube bar + small accent tubes
  const neonBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.06), neonRed);
  neonBar.position.set(0, 3.0, -4.88);
  group.add(neonBar);
  const neonBar2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.06), neonBlue);
  neonBar2.position.set(0, 3.18, -4.88);
  group.add(neonBar2);
  // Neon light cast
  const neonLight = new THREE.PointLight(0xff5a8a, 0.7, 6, 2);
  neonLight.position.set(0, 3.0, -4.6);
  group.add(neonLight);

  // Sputnik / space-age pendant lamp over the seating area
  const sputnikCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.25, metalness: 0.9 })
  );
  sputnikCore.position.set(0, 3.0, 1.2);
  group.add(sputnikCore);
  // Radiating arms with glowing tips (the sputnik look)
  const armGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xffe6b0,
    emissive: 0xffcf6e,
    emissiveIntensity: 1.1,
    roughness: 0.3,
  });
  const sputnikArms = 8;
  for (let i = 0; i < sputnikArms; i++) {
    const theta = (i / sputnikArms) * Math.PI * 2;
    const arm = new THREE.Mesh(armGeo, sputnikCore.material);
    arm.position.set(Math.cos(theta) * 0.14, 3.0, 1.2 + Math.sin(theta) * 0.14);
    arm.rotation.z = Math.cos(theta) * 0.9;
    arm.rotation.x = -Math.sin(theta) * 0.9;
    group.add(arm);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), tipMat);
    tip.position.set(Math.cos(theta) * 0.28, 3.0, 1.2 + Math.sin(theta) * 0.28);
    group.add(tip);
  }
  // Cord
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6, metalness: 0.2 })
  );
  cord.position.set(0, 3.35, 1.2);
  group.add(cord);
  // Warm light from the sputnik
  const sputnikLight = new THREE.PointLight(0xffd28a, 0.8, 5, 2);
  sputnikLight.position.set(0, 2.95, 1.2);
  group.add(sputnikLight);

  // =========================================================================
  // 9. PATRONS — seated 1960s figures (mod fashion, beehive/short hair, no hats)
  // =========================================================================
  const patronPalettes = [
    { outfit: 0xd83a2c, hair: 0x2a1a10, beehive: true },   // red mod dress + beehive
    { outfit: 0x2a4060, hair: 0x1a1208, beehive: false },  // slim blue suit + short crop
    { outfit: 0xe0a020, hair: 0x3a2a10, beehive: true },   // mustard dress + beehive
    { outfit: 0x4a4a52, hair: 0x1a1208, beehive: false },  // grey slim suit
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
// Listens for the bootstrapped engine, then registers the 1965 era builder.
// ---------------------------------------------------------------------------

const ERA_META = {
  name: 'Mid-century Café (1965)',
  year: 1965,
  menu: [
    { item: 'Coffee', price: '25¢' },
    { item: 'Espresso', price: '40¢' },
    { item: 'Cappuccino', price: '50¢' },
    { item: 'Pastry', price: '30¢' },
    { item: 'Sandwich', price: '55¢' },
  ],
  musicSource: 'Jukebox',
};

function register() {
  const Cafe = window.Cafe;
  if (!Cafe || !Cafe.periodManager) return;
  Cafe.periodManager.registerEra(1965, buildEra1965, ERA_META);
}

// If the engine is already bootstrapped, register now; otherwise wait.
if (window.Cafe && window.Cafe.periodManager) {
  register();
} else {
  window.addEventListener('cafe:ready', register, { once: true });
}

export default buildEra1965;
