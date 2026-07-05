/**
 * Era content builder — shared procedural-mesh factory for period packages.
 *
 * Each era package (1945, 1965, 1985, 2005, 2025) provides a plain-data
 * PeriodPackage descriptor.  This module turns that descriptor into a populated
 * `THREE.Group` containing furniture, coffee equipment, a menu board, a music
 * source prop, wall posters, tableware, signage/lighting, counter technology,
 * and patrons — all procedurally generated from primitives so no external
 * assets are required.
 *
 * Every mesh is named with a `era:` prefix so it can be easily inspected or
 * debugged.  Materials are created fresh per build so that disposal on era
 * change does not invalidate materials still in use by another era group.
 *
 * @module era-builder
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Constants (room dimensions must match scene-renderer.js).
// ---------------------------------------------------------------------------
const HALF_W = 5; // room half-width (X: -5..5)
const HALF_D = 4; // room half-depth (Z: -4..4)
const ROOM_H = 3; // room height (Y: 0..3)
const WALL_Z_BACK = -HALF_D + 0.15; // back wall surface (−Z), accounting for wall thickness
const WALL_Z_FRONT = HALF_D - 0.15; // front wall surface (+Z)
const WALL_X_LEFT = -HALF_W + 0.15; // left wall surface (−X)
const WALL_X_RIGHT = HALF_W - 0.15; // right wall surface (+X)

// ---------------------------------------------------------------------------
// Material cache — created once per buildEraScene call and disposed at end.
// ---------------------------------------------------------------------------

/**
 * Creates a fresh set of reusable materials coloured from the era palette.
 * Materials are *not* shared across builds to keep disposal safe.
 *
 * @param {Object} palette - Hex colour strings keyed by role.
 * @returns {Object<string, THREE.MeshStandardMaterial>}
 */
function makeMaterialCache(palette) {
  const make = (hex, opts = {}) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: opts.roughness ?? 0.7,
      metalness: opts.metalness ?? 0.0,
      ...opts,
    });

  return {
    wood: make(palette.wood, { roughness: 0.82 }),
    woodDark: make(palette.woodDark ?? palette.wood, { roughness: 0.8 }),
    metal: make(palette.metal ?? 0x888888, { roughness: 0.35, metalness: 0.85 }),
    chrome: make(palette.chrome ?? 0xcccccc, { roughness: 0.12, metalness: 0.95 }),
    fabric: make(palette.fabric, { roughness: 0.95 }),
    plastic: make(palette.plastic ?? 0x333333, { roughness: 0.5 }),
    wall: make(palette.wall ?? 0xdddddd, { roughness: 0.9 }),
    paper: make(palette.paper ?? 0xf5f0e6, { roughness: 0.95, side: THREE.DoubleSide }),
    accent: make(palette.accent ?? 0xff8800, { roughness: 0.5 }),
    glass: make(palette.glass ?? 0x9fc4d8, {
      roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35,
    }),
    light: make(palette.light ?? 0xffe8c0, {
      roughness: 0.2, metalness: 0.0,
    }),
  };
}

// ---------------------------------------------------------------------------
// Small mesh helpers.
// ---------------------------------------------------------------------------

/**
 * Creates a named BoxGeometry mesh with the given material.
 * @param {string} name
 * @param {number} w
 * @param {number} h
 * @param {number} d
 * @param {THREE.Material} material
 * @returns {THREE.Mesh}
 */
function box(name, w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Creates a named CylinderGeometry mesh.
 * @param {string} name
 * @param {number} rt - top radius
 * @param {number} rb - bottom radius
 * @param {number} h  - height
 * @param {THREE.Material} material
 * @param {number} [segments=20]
 * @returns {THREE.Mesh}
 */
function cyl(name, rt, rb, h, material, segments = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Creates a named sphere mesh.
 * @param {string} name
 * @param {number} r
 * @param {THREE.Material} material
 * @param {number} [segments=16]
 * @returns {THREE.Mesh}
 */
function sphere(name, r, material, segments = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material);
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Creates a thin plane suitable for posters/menus/signs.
 * @param {string} name
 * @param {number} w
 * @param {number} h
 * @param {THREE.Material} material
 * @returns {THREE.Mesh}
 */
function plane(name, w, h, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.name = name;
  m.receiveShadow = true;
  return m;
}

/**
 * Creates a canvas texture from text lines for menu boards and signs.
 *
 * @param {string[]} lines
 * @param {Object} [opts]
 * @returns {THREE.CanvasTexture}
 */
function makeTextTexture(lines, opts = {}) {
  const w = opts.width ?? 512;
  const h = opts.height ?? 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = opts.bg ?? '#3a2a1a';
  ctx.fillRect(0, 0, w, h);

  if (opts.borderColor) {
    ctx.strokeStyle = opts.borderColor;
    ctx.lineWidth = opts.borderWidth ?? 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);
  }

  const titleFont = opts.titleFont ?? 'bold 36px Georgia, serif';
  const bodyFont = opts.bodyFont ?? '24px Georgia, serif';
  const textColor = opts.color ?? '#f5f0e6';
  const titleColor = opts.titleColor ?? opts.accent ?? '#ffd9a0';
  const lineH = opts.lineHeight ?? 38;

  if (opts.title) {
    ctx.font = titleFont;
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.fillText(opts.title, w / 2, 52);
  }

  ctx.font = bodyFont;
  ctx.fillStyle = textColor;
  ctx.textAlign = opts.align ?? 'left';
  const startX = opts.align === 'center' ? w / 2 : 40;
  let y = opts.title ? 96 : 50;
  for (const line of lines) {
    ctx.fillText(line, startX, y);
    y += lineH;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a canvas texture simulating a wall poster/advertisement.
 *
 * @param {Object} spec - Poster spec: { headline, subtext, bg, fg, accent }
 * @returns {THREE.CanvasTexture}
 */
function makePosterTexture(spec) {
  const w = 340;
  const h = 460;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background gradient.
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, spec.bg ?? '#2a1a10');
  grad.addColorStop(1, spec.bgEnd ?? spec.bg ?? '#1a0e08');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Accent border.
  if (spec.accent) {
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  // Decorative circle.
  ctx.fillStyle = spec.accent ?? '#c98a4b';
  ctx.beginPath();
  ctx.arc(w / 2, 150, 80, 0, Math.PI * 2);
  ctx.fill();

  // Product silhouette inside circle.
  ctx.fillStyle = spec.bg ?? '#2a1a10';
  ctx.font = '64px serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.icon ?? '☕', w / 2, 172);

  // Headline.
  ctx.fillStyle = spec.fg ?? '#f5f0e6';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'center';
  const words = (spec.headline ?? '').split(' ');
  let line = '';
  let ly = 280;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w - 50) {
      ctx.fillText(line, w / 2, ly);
      line = word;
      ly += 32;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, w / 2, ly);

  // Subtext.
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = spec.subColor ?? '#ddd';
  ly += 40;
  for (const sub of (spec.subtext ?? [])) {
    ctx.fillText(sub, w / 2, ly);
    ly += 22;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
// ---------------------------------------------------------------------------
// Category builders — each returns a THREE.Group added to the root era group.
// ---------------------------------------------------------------------------

/**
 * Builds furniture (tables, chairs, counter stools, decor items).
 *
 * @param {Object} furniture - Furniture descriptor from the PeriodPackage.
 * @param {Object} mats      - Material cache.
 * @returns {THREE.Group}
 */
function buildFurniture(furniture, mats) {
  const g = new THREE.Group();
  g.name = 'era:Furniture';

  const seats = furniture.seats ?? [];
  seats.forEach((seat, i) => {
    if (seat.type === 'table') {
      // Table top.
      const top = box(`era:TableTop${i}`, seat.w ?? 1.0, seat.thickness ?? 0.06, seat.d ?? 1.0,
        mats[seat.material] ?? mats.wood);
      top.position.set(seat.x, seat.h ?? 0.74, seat.z);
      g.add(top);
      // Legs.
      const legMat = mats[seat.legMaterial] ?? mats[seat.material] ?? mats.wood;
      const lw = 0.08;
      const legOffsetX = (seat.w ?? 1.0) / 2 - lw;
      const legOffsetZ = (seat.d ?? 1.0) / 2 - lw;
      const legH = seat.h ?? 0.74;
      [
        [-legOffsetX, -legOffsetZ], [legOffsetX, -legOffsetZ],
        [-legOffsetX, legOffsetZ], [legOffsetX, legOffsetZ],
      ].forEach(([ox, oz], j) => {
        const leg = box(`era:TableLeg${i}_${j}`, lw, legH, lw, legMat);
        leg.position.set(seat.x + ox, legH / 2, seat.z + oz);
        g.add(leg);
      });
    } else if (seat.type === 'chair') {
      // Seat.
      const seatMesh = box(`era:ChairSeat${i}`, seat.w ?? 0.45, 0.05, seat.d ?? 0.45,
        mats[seat.material] ?? mats.wood);
      seatMesh.position.set(seat.x, seat.h ?? 0.45, seat.z);
      g.add(seatMesh);
      // Backrest.
      const back = box(`era:ChairBack${i}`, seat.w ?? 0.45, seat.backH ?? 0.5, 0.04,
        mats[seat.material] ?? mats.wood);
      back.position.set(seat.x, (seat.h ?? 0.45) + (seat.backH ?? 0.5) / 2,
        seat.z - (seat.d ?? 0.45) / 2);
      g.add(back);
      // Legs.
      const legMat = mats[seat.legMaterial] ?? mats.wood;
      const lw = 0.04;
      const ox = (seat.w ?? 0.45) / 2 - lw;
      const oz = (seat.d ?? 0.45) / 2 - lw;
      [[-ox, -oz], [ox, -oz], [-ox, oz], [ox, oz]].forEach(([dx, dz], j) => {
        const leg = box(`era:ChairLeg${i}_${j}`, lw, seat.h ?? 0.45, lw, legMat);
        leg.position.set(seat.x + dx, (seat.h ?? 0.45) / 2, seat.z + dz);
        g.add(leg);
      });
    } else if (seat.type === 'stool') {
      // Counter stool.
      const seatH = seat.h ?? 0.65;
      const seatMesh = cyl(`era:StoolSeat${i}`, seat.r ?? 0.18, seat.r ?? 0.18, 0.05,
        mats[seat.material] ?? mats.fabric, 16);
      seatMesh.position.set(seat.x, seatH, seat.z);
      g.add(seatMesh);
      const pole = cyl(`era:StoolPole${i}`, 0.03, 0.03, seatH,
        mats[seat.legMaterial] ?? mats.metal, 8);
      pole.position.set(seat.x, seatH / 2, seat.z);
      g.add(pole);
      // Base.
      const base = cyl(`era:StoolBase${i}`, 0.15, 0.15, 0.03,
        mats[seat.legMaterial] ?? mats.metal, 12);
      base.position.set(seat.x, 0.015, seat.z);
      g.add(base);
    }
  });

  // Decor items.
  const decor = furniture.decor ?? [];
  decor.forEach((item, i) => {
    let mesh;
    if (item.shape === 'box') {
      mesh = box(`era:Decor${i}`, item.w ?? 0.2, item.h ?? 0.2, item.d ?? 0.2,
        mats[item.material] ?? mats.accent);
    } else if (item.shape === 'sphere') {
      mesh = sphere(`era:Decor${i}`, item.r ?? 0.1, mats[item.material] ?? mats.accent);
    } else if (item.shape === 'cylinder') {
      mesh = cyl(`era:Decor${i}`, item.rt ?? 0.08, item.rb ?? 0.08, item.h ?? 0.2,
        mats[item.material] ?? mats.accent, 12);
    } else {
      mesh = box(`era:Decor${i}`, item.w ?? 0.2, item.h ?? 0.2, item.d ?? 0.2,
        mats[item.material] ?? mats.accent);
    }
    mesh.position.set(item.x ?? 0, item.y ?? 1, item.z ?? 0);
    if (item.rotY) mesh.rotation.y = item.rotY;
    g.add(mesh);
  });

  return g;
}

/**
 * Builds coffee equipment (espresso machine, grinder, brewer).
 *
 * @param {Object} equip - Coffee equipment descriptor.
 * @param {Object} mats  - Material cache.
 * @returns {THREE.Group}
 */
function buildCoffeeEquipment(equip, mats) {
  const g = new THREE.Group();
  g.name = 'era:CoffeeEquipment';
  // Place equipment on top of the counter (counter height ~1.05m, top surface ~1.08).
  const baseY = 1.08;

  // --- Espresso machine ---
  if (equip.espressoMachine) {
    const em = equip.espressoMachine;
    const emGroup = new THREE.Group();
    emGroup.name = 'era:EspressoMachine';

    // Main body.
    const body = box('era:MachineBody', em.w ?? 0.6, em.h ?? 0.45, em.d ?? 0.4,
      mats[em.material] ?? mats.chrome);
    emGroup.add(body);

    // Group head / portafilter stub.
    const groupHead = cyl('era:GroupHead', 0.05, 0.05, 0.12,
      mats[em.detailMaterial] ?? mats.metal, 10);
    groupHead.position.set(0, -0.1, (em.d ?? 0.4) / 2 + 0.06);
    groupHead.rotation.x = Math.PI / 2;
    emGroup.add(groupHead);

    // Steam wand.
    const wand = cyl('era:SteamWand', 0.012, 0.012, 0.2,
      mats.chrome, 8);
    wand.position.set((em.w ?? 0.6) / 2 - 0.05, 0, 0.05);
    wand.rotation.z = Math.PI / 3;
    emGroup.add(wand);

    // Pressure gauges or display.
    if (em.gauges) {
      em.gauges.forEach((gauge, gi) => {
        const gm = cyl(`era:Gauge${gi}`, 0.04, 0.04, 0.03,
          mats[em.detailMaterial] ?? mats.metal, 12);
        gm.rotation.x = Math.PI / 2;
        gm.position.set(gauge.x ?? -0.15, gauge.y ?? 0.05, (em.d ?? 0.4) / 2 + 0.015);
        emGroup.add(gm);
      });
    }

    // Lever (for manual / vintage machines).
    if (em.lever) {
      const lever = box('era:Lever', 0.04, em.leverLength ?? 0.25, 0.04, mats.woodDark);
      lever.position.set(0, 0.12, (em.d ?? 0.4) / 2 + 0.02);
      lever.rotation.x = -0.4;
      emGroup.add(lever);
    }

    // Touchscreen (modern machines).
    if (em.touchscreen) {
      const screen = box('era:Touchscreen', 0.2, 0.12, 0.02, mats.plastic);
      screen.material = new THREE.MeshStandardMaterial({
        color: 0x113355, emissive: 0x224477, emissiveIntensity: 0.5,
        roughness: 0.1,
      });
      screen.position.set(0, 0.1, (em.d ?? 0.4) / 2 + 0.01);
      emGroup.add(screen);
    }

    emGroup.position.set(em.x ?? -0.5, baseY + (em.h ?? 0.45) / 2, em.z ?? 2.8);
    g.add(emGroup);
  }

  // --- Grinder ---
  if (equip.grinder) {
    const gr = equip.grinder;
    const grinderGroup = new THREE.Group();
    grinderGroup.name = 'era:Grinder';

    const body = box('era:GrinderBody', gr.w ?? 0.18, gr.h ?? 0.35, gr.d ?? 0.18,
      mats[gr.material] ?? (gr.kind === 'electric' ? mats.plastic : mats.woodDark));
    grinderGroup.add(body);

    // Hopper on top (for electric grinders).
    if (gr.kind === 'electric' && gr.hopper) {
      const hopper = cyl('era:Hopper', gr.hopperR ?? 0.07, gr.hopperR2 ?? 0.05,
        gr.hopperH ?? 0.15, mats.glass, 12);
      hopper.position.y = (gr.h ?? 0.35) / 2 + 0.08;
      grinderGroup.add(hopper);
    }

    // Crank handle (for manual grinders).
    if (gr.kind === 'manual' && gr.crank) {
      const crank = cyl('era:CrankHandle', 0.015, 0.015, 0.2, mats.wood, 8);
      crank.position.set(0.12, (gr.h ?? 0.35) / 2, 0);
      crank.rotation.z = Math.PI / 2;
      grinderGroup.add(crank);
    }

    grinderGroup.position.set(gr.x ?? 0.3, baseY + (gr.h ?? 0.35) / 2, gr.z ?? 2.8);
    g.add(grinderGroup);
  }

  // --- Brewer (drip / pour-over / siphon / French press) ---
  if (equip.brewer) {
    const br = equip.brewer;
    const brewerGroup = new THREE.Group();
    brewerGroup.name = 'era:Brewer';

    if (br.kind === 'drip') {
      // Drip coffee maker: body + carafe.
      const body = box('era:BrewerBody', br.w ?? 0.2, br.h ?? 0.3, br.d ?? 0.2,
        mats[br.material] ?? mats.plastic);
      brewerGroup.add(body);
      const carafe = cyl('era:Carafe', 0.06, 0.07, 0.18, mats.glass, 12);
      carafe.position.set(0, -(br.h ?? 0.3) / 2 + 0.1, 0);
      brewerGroup.add(carafe);
    } else if (br.kind === 'siphon') {
      // Vacuum siphon: two glass bulbs.
      const topBulb = sphere('era:SiphonTop', 0.06, mats.glass, 12);
      topBulb.position.y = 0.12;
      brewerGroup.add(topBulb);
      const bottomBulb = sphere('era:SiphonBottom', 0.07, mats.glass, 12);
      bottomBulb.position.y = -0.08;
      brewerGroup.add(bottomBulb);
      const tube = cyl('era:SiphonTube', 0.008, 0.008, 0.2, mats.glass, 8);
      tube.position.y = 0.02;
      brewerGroup.add(tube);
    } else if (br.kind === 'frenchPress' || br.kind === 'pourOver') {
      // Generic glass vessel.
      const vessel = cyl('era:BrewVessel', 0.06, 0.07, br.h ?? 0.2, mats.glass, 12);
      brewerGroup.add(vessel);
    }

    brewerGroup.position.set(br.x ?? 0.6, baseY + (br.h ?? 0.25) / 2, br.z ?? 2.8);
    g.add(brewerGroup);
  }

  return g;
}

/**
 * Builds the menu board (text on a canvas-textured plane mounted on a wall
 * or stand).
 *
 * @param {Object} menu - Menu descriptor.
 * @param {Object} mats - Material cache.
 * @returns {THREE.Group}
 */
function buildMenuBoard(menu, mats) {
  const g = new THREE.Group();
  g.name = 'era:MenuBoard';

  // Each item's price already includes its currency symbol (e.g. "4d", "£2.80"),
  // so we render name + price directly without an extra currency prefix.
  const lines = (menu.items ?? []).map((item) =>
    `${item.name}  ${item.price}`,
  );

  const tex = makeTextTexture(lines, {
    title: menu.title ?? 'MENU',
    bg: menu.bg ?? '#3a2a1a',
    color: menu.textColor ?? '#f5f0e6',
    accent: menu.accent ?? '#ffd9a0',
    borderColor: menu.borderColor ?? '#c98a4b',
    titleFont: menu.titleFont ?? 'bold 36px Georgia, serif',
    bodyFont: menu.bodyFont ?? '24px Georgia, serif',
    align: menu.align ?? 'left',
    width: menu.textureWidth ?? 512,
    height: menu.textureHeight ?? 384,
  });

  const mat = new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.9, side: THREE.DoubleSide,
  });
  const boardW = menu.width ?? 1.6;
  const boardH = menu.height ?? 1.2;
  const board = plane('era:MenuBoard', boardW, boardH, mat);

  // Frame.
  const frameMat = mats[menu.frameMaterial] ?? mats.woodDark;
  const frameThickness = menu.frameThickness ?? 0.05;
  const frameDepth = menu.frameDepth ?? 0.04;
  // Top frame.
  const ft = box('era:MenuFrameTop', boardW + frameThickness * 2, frameThickness, frameDepth, frameMat);
  ft.position.set(0, boardH / 2 + frameThickness / 2, 0);
  g.add(ft);
  // Bottom frame.
  const fb = box('era:MenuFrameBottom', boardW + frameThickness * 2, frameThickness, frameDepth, frameMat);
  fb.position.set(0, -boardH / 2 - frameThickness / 2, 0);
  g.add(fb);
  // Left frame.
  const fl = box('era:MenuFrameLeft', frameThickness, boardH, frameDepth, frameMat);
  fl.position.set(-boardW / 2 - frameThickness / 2, 0, 0);
  g.add(fl);
  // Right frame.
  const fr = box('era:MenuFrameRight', frameThickness, boardH, frameDepth, frameMat);
  fr.position.set(boardW / 2 + frameThickness / 2, 0, 0);
  g.add(fr);

  g.add(board);

  // Position the board — on the back wall by default.
  g.position.set(menu.x ?? 0, menu.y ?? 2.0, menu.z ?? WALL_Z_BACK + 0.03);
  if (menu.rotY) g.rotation.y = menu.rotY;
  // If it's on the back wall, rotate to face forward (+Z).
  if (menu.faceForward !== false && (menu.z ?? WALL_Z_BACK + 0.03) < -3) {
    g.rotation.y = 0;
  }

  return g;
}

/**
 * Builds the music source prop (wireless set, jukebox, boombox, iPod, phone).
 *
 * @param {Object} music - Music descriptor.
 * @param {Object} mats  - Material cache.
 * @returns {THREE.Group}
 */
function buildMusicSource(music, mats) {
  const g = new THREE.Group();
  g.name = 'era:MusicSource';
  const kind = music.source ?? 'unknown';

  if (kind === 'wireless') {
    // 1945 wireless (wooden radio cabinet).
    const cab = box('era:RadioCabinet', 0.5, 0.35, 0.25, mats.woodDark);
    g.add(cab);
    // Speaker grille (fabric circle).
    const grille = cyl('era:RadioGrille', 0.1, 0.1, 0.01, mats.fabric, 16);
    grille.rotation.x = Math.PI / 2;
    grille.position.z = 0.13;
    g.add(grille);
    // Tuning dial.
    const dial = box('era:RadioDial', 0.15, 0.03, 0.01,
      new THREE.MeshStandardMaterial({ color: 0xddcc88, emissive: 0x665522, emissiveIntensity: 0.3 }));
    dial.position.set(0.12, -0.08, 0.13);
    g.add(dial);
    g.position.set(music.x ?? -2.5, music.y ?? 0.5, music.z ?? -2.5);
  } else if (kind === 'jukebox') {
    // 1965 jukebox: tall, glowing.
    const body = box('era:JukeboxBody', 0.6, 1.5, 0.5,
      new THREE.MeshStandardMaterial({
        color: 0x882244, roughness: 0.3, metalness: 0.4,
      }));
    body.position.y = 0.75;
    g.add(body);
    // Glowing tube/panel.
    const glow = box('era:JukeboxGlow', 0.3, 0.5, 0.02,
      new THREE.MeshStandardMaterial({
        color: 0xff44aa, emissive: 0xff3399, emissiveIntensity: 0.8,
      }));
    glow.position.set(0, 0.9, 0.26);
    g.add(glow);
    // Dome top.
    const dome = cyl('era:JukeboxDome', 0.3, 0.3, 0.1,
      new THREE.MeshStandardMaterial({
        color: 0xccaaa00, roughness: 0.1, metalness: 0.8,
      }), 16);
    dome.position.y = 1.55;
    g.add(dome);
    g.position.set(music.x ?? -3.5, music.y ?? 0, music.z ?? -1.5);
  } else if (kind === 'boombox') {
    // 1985 boombox: wide rectangular.
    const body = box('era:BoomboxBody', 0.6, 0.3, 0.15, mats.plastic);
    g.add(body);
    // Two speakers.
    [-0.18, 0.18].forEach((sx, i) => {
      const sp = cyl(`era:BoomboxSpeaker${i}`, 0.08, 0.08, 0.02, mats.fabric, 12);
      sp.rotation.x = Math.PI / 2;
      sp.position.set(sx, 0, 0.08);
      g.add(sp);
    });
    // Tape deck slot.
    const slot = box('era:TapeSlot', 0.12, 0.03, 0.01,
      new THREE.MeshStandardMaterial({ color: 0x222 }));
    slot.position.set(0, -0.08, 0.08);
    g.add(slot);
    // Handle.
    const handle = box('era:BoomboxHandle', 0.3, 0.02, 0.04, mats.plastic);
    handle.position.y = 0.17;
    g.add(handle);
    g.position.set(music.x ?? -2.0, music.y ?? 1.0, music.z ?? -2.0);
  } else if (kind === 'ipod') {
    // 2005 iPod: small white slab.
    const body = box('era:IpodBody', 0.08, 0.12, 0.015,
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.2 }));
    g.add(body);
    // Screen.
    const screen = box('era:IpodScreen', 0.05, 0.04, 0.002,
      new THREE.MeshStandardMaterial({ color: 0x88aacc, emissive: 0x3366aa, emissiveIntensity: 0.4 }));
    screen.position.set(0, 0.03, 0.008);
    g.add(screen);
    // Click wheel (circle).
    const wheel = cyl('era:ClickWheel', 0.025, 0.025, 0.003,
      new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 }), 16);
    wheel.position.set(0, -0.03, 0.009);
    g.add(wheel);
    g.position.set(music.x ?? 1.5, music.y ?? 1.1, music.z ?? -2.5);
  } else if (kind === 'phone') {
    // 2025 phone: slim black slab.
    const body = box('era:PhoneBody', 0.07, 0.14, 0.006,
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.15, metalness: 0.6 }));
    g.add(body);
    // Screen.
    const screen = box('era:PhoneScreen', 0.062, 0.13, 0.001,
      new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0x112244, emissiveIntensity: 0.6,
      }));
    screen.position.z = 0.004;
    g.add(screen);
    // Speaker dock / stand.
    const dock = cyl('era:PhoneDock', 0.05, 0.06, 0.06,
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.5 }), 12);
    dock.position.set(0, -0.1, 0);
    g.add(dock);
    g.position.set(music.x ?? 1.5, music.y ?? 1.1, music.z ?? -2.5);
  }

  return g;
}
/**
 * Builds wall posters/advertisements (3 per era).
 *
 * @param {Object} signage - Signage descriptor (contains `posters` array).
 * @param {Object} mats    - Material cache.
 * @returns {THREE.Group}
 */
function buildWallPosters(signage, mats) {
  const g = new THREE.Group();
  g.name = 'era:WallPosters';

  const posters = signage.posters ?? [];
  posters.forEach((p, i) => {
    const tex = makePosterTexture(p);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.92, side: THREE.DoubleSide,
    });
    const poster = plane(`era:Poster${i}`, p.w ?? 0.5, p.h ?? 0.7, mat);

    // Position the poster — default on the left wall.
    const px = p.x ?? WALL_X_LEFT + 0.02;
    const py = p.y ?? 1.8;
    const pz = p.z ?? -1.5 + i * 1.0;
    poster.position.set(px, py, pz);

    // Rotate to face inward depending on which wall.
    if (px < -4) poster.rotation.y = Math.PI / 2; // left wall faces +X
    else if (px > 4) poster.rotation.y = -Math.PI / 2; // right wall faces −X
    else if (pz < -3) poster.rotation.y = 0; // back wall faces +Z

    g.add(poster);
  });

  return g;
}

/**
 * Builds tableware (cups, saucers, cutlery, plates) placed on tables.
 *
 * @param {Object} tableware - Tableware descriptor.
 * @param {Object} mats      - Material cache.
 * @returns {THREE.Group}
 */
function buildTableware(tableware, mats) {
  const g = new THREE.Group();
  g.name = 'era:Tableware';

  // Cup material.
  const cupMat = mats[tableware.material] ?? mats.accent;

  // Place sets of tableware on each table.
  const tablePositions = tableware.tablePositions ?? [
    { x: -2, z: 0 }, { x: 2, z: 0 },
  ];
  const cupH = tableware.cupHeight ?? 0.08;
  const cupR = tableware.cupRadius ?? 0.04;

  tablePositions.forEach((pos, i) => {
    // Cup.
    const cup = cyl(`era:Cup${i}`, cupR, cupR * 0.9, cupH, cupMat, 12);
    cup.position.set(pos.x + 0.15, 0.78, pos.z + 0.1);
    g.add(cup);

    // Saucer.
    if (tableware.hasSaucer !== false) {
      const saucer = cyl(`era:Saucer${i}`, cupR * 2.2, cupR * 2.2, 0.012, cupMat, 16);
      saucer.position.set(pos.x + 0.15, 0.775, pos.z + 0.1);
      g.add(saucer);
    }

    // Plate.
    if (tableware.hasPlate !== false) {
      const plateR = tableware.plateRadius ?? 0.12;
      const plate = cyl(`era:Plate${i}`, plateR, plateR, 0.015,
        mats[tableware.plateMaterial] ?? cupMat, 16);
      plate.position.set(pos.x - 0.15, 0.775, pos.z - 0.1);
      g.add(plate);
    }

    // Cutlery.
    if (tableware.hasCutlery !== false) {
      const cutMat = mats[tableware.cutleryMaterial] ?? mats.metal;
      // Fork.
      const fork = box(`era:Fork${i}`, 0.015, 0.005, 0.12, cutMat);
      fork.position.set(pos.x - 0.15, 0.782, pos.z - 0.1 + 0.14);
      g.add(fork);
      // Knife.
      const knife = box(`era:Knife${i}`, 0.015, 0.005, 0.12, cutMat);
      knife.position.set(pos.x - 0.15, 0.782, pos.z - 0.1 - 0.14);
      g.add(knife);
    }
  });

  return g;
}

/**
 * Builds signage and lighting fixtures.
 *
 * @param {Object} lighting - Lighting descriptor.
 * @param {Object} mats     - Material cache.
 * @returns {THREE.Group}
 */
function buildSignageAndLighting(lighting, mats) {
  const g = new THREE.Group();
  g.name = 'era:SignageAndLighting';

  // --- Signage ---
  if (lighting.signage && lighting.signage.text) {
    const tex = makeTextTexture([], {
      title: lighting.signage.text,
      bg: lighting.signage.bg ?? 'transparent',
      titleColor: lighting.signage.color ?? '#ffd9a0',
      titleFont: 'bold 48px sans-serif',
      width: 512, height: 128,
    });
    // Clear bg if transparent.
    if (lighting.signage.bg === 'transparent') {
      const c = tex.image;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = lighting.signage.color ?? '#ffd9a0';
      ctx.textAlign = 'center';
      ctx.fillText(lighting.signage.text, c.width / 2, 80);
      tex.needsUpdate = true;
    }
    const signMat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true,
      emissive: new THREE.Color(lighting.signage.emissive ?? 0x000000),
      emissiveIntensity: lighting.signage.emissiveIntensity ?? 0,
      emissiveMap: tex,
      side: THREE.DoubleSide,
    });
    const sign = plane('era:Signage', lighting.signage.width ?? 1.2,
      lighting.signage.height ?? 0.3, signMat);
    sign.position.set(lighting.signage.x ?? 0, lighting.signage.y ?? 2.7,
      lighting.signage.z ?? WALL_Z_FRONT - 0.02);
    if (lighting.signage.rotY) sign.rotation.y = lighting.signage.rotY;
    g.add(sign);
  }

  // --- Lighting fixtures ---
  if (lighting.fixtures) {
    lighting.fixtures.forEach((fix, i) => {
      const fixGroup = new THREE.Group();
      fixGroup.name = `era:LightFixture${i}`;

      if (fix.type === 'pendant') {
        // Cord.
        const cord = cyl(`era:PendantCord${i}`, 0.005, 0.005, fix.cordLength ?? 0.4, mats.metal, 6);
        cord.position.y = (fix.cordLength ?? 0.4) / 2;
        fixGroup.add(cord);
        // Shade.
        const shade = cyl(`era:PendantShade${i}`, fix.shadeR ?? 0.15, (fix.shadeR ?? 0.15) * 0.7,
          fix.shadeH ?? 0.12, mats[fix.material] ?? mats.metal, 16);
        shade.position.y = -(fix.cordLength ?? 0.4) / 2;
        fixGroup.add(shade);
        // Bulb glow.
        const bulb = sphere(`era:Bulb${i}`, 0.04, mats.light, 8);
        bulb.material = new THREE.MeshStandardMaterial({
          color: fix.bulbColor ?? 0xffeec0,
          emissive: fix.bulbColor ?? 0xffeec0,
          emissiveIntensity: fix.bulbIntensity ?? 1.0,
        });
        bulb.position.y = -(fix.cordLength ?? 0.4) / 2 - 0.05;
        fixGroup.add(bulb);
      } else if (fix.type === 'fluorescent') {
        // Tube light.
        const tube = box(`era:FluorescentTube${i}`, fix.length ?? 0.8, 0.04, 0.08,
          new THREE.MeshStandardMaterial({
            color: fix.bulbColor ?? 0xffffff,
            emissive: fix.bulbColor ?? 0xffffff,
            emissiveIntensity: fix.bulbIntensity ?? 0.8,
          }));
        fixGroup.add(tube);
        // Housing.
        const housing = box(`era:FluorescentHousing${i}`, (fix.length ?? 0.8) + 0.04, 0.06, 0.1,
          mats.metal);
        housing.position.y = 0.02;
        fixGroup.add(housing);
      } else if (fix.type === 'bulb') {
        // Bare bulb.
        const bulb = sphere(`era:FixtureBulb${i}`, fix.r ?? 0.05, mats.light, 12);
        bulb.material = new THREE.MeshStandardMaterial({
          color: fix.bulbColor ?? 0xffd9a0,
          emissive: fix.bulbColor ?? 0xffd9a0,
          emissiveIntensity: fix.bulbIntensity ?? 0.9,
        });
        fixGroup.add(bulb);
      }

      fixGroup.position.set(fix.x ?? 0, fix.y ?? 2.8, fix.z ?? 0);
      g.add(fixGroup);
    });
  }

  // --- Point light (dynamic, era-coloured) ---
  if (lighting.pointLight) {
    const pl = new THREE.PointLight(
      lighting.pointLight.color ?? 0xffd9a0,
      lighting.pointLight.intensity ?? 1.2,
      lighting.pointLight.distance ?? 16,
      lighting.pointLight.decay ?? 1.8,
    );
    pl.position.set(
      lighting.pointLight.x ?? 0,
      lighting.pointLight.y ?? 2.6,
      lighting.pointLight.z ?? 0,
    );
    pl.name = 'era:PointLight';
    g.add(pl);
  }

  return g;
}

/**
 * Builds counter technology (till / POS / terminal).
 *
 * @param {Object} tech - Counter technology descriptor.
 * @param {Object} mats - Material cache.
 * @returns {THREE.Group}
 */
function buildCounterTechnology(tech, mats) {
  const g = new THREE.Group();
  g.name = 'era:CounterTechnology';
  // Counter top surface is ~1.08m.
  const baseY = 1.08;
  const kind = tech.type ?? 'manual';

  if (kind === 'manual') {
    // 1945 brass cash register.
    const body = box('era:CashRegisterBody', 0.3, 0.25, 0.25,
      mats[tech.material] ?? mats.metal);
    g.add(body);
    // Key row.
    for (let i = 0; i < 6; i++) {
      const key = cyl(`era:RegKey${i}`, 0.015, 0.015, 0.02, mats.accent, 8);
      key.position.set(-0.1 + i * 0.04, 0.13, 0.13);
      g.add(key);
    }
    // Drawer.
    const drawer = box('era:RegDrawer', 0.25, 0.06, 0.2, mats.woodDark);
    drawer.position.y = -0.08;
    g.add(drawer);
    g.position.set(tech.x ?? 1.0, baseY + 0.12, tech.z ?? 2.9);
  } else if (kind === 'mechanical') {
    // 1965 mechanical cash register (taller, more ornate).
    const body = box('era:MechRegisterBody', 0.32, 0.35, 0.28,
      mats[tech.material] ?? mats.metal);
    g.add(body);
    // Display pop-up numbers area.
    const display = box('era:RegDisplay', 0.15, 0.06, 0.02,
      new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0x443300, emissiveIntensity: 0.2 }));
    display.position.set(0, 0.15, 0.15);
    g.add(display);
    // Keys (2 rows).
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 5; i++) {
        const key = cyl(`era:MechRegKey${row}_${i}`, 0.016, 0.016, 0.022, mats.accent, 8);
        key.position.set(-0.1 + i * 0.05, 0.05 - row * 0.05, 0.15);
        g.add(key);
      }
    }
    g.position.set(tech.x ?? 1.0, baseY + 0.17, tech.z ?? 2.9);
  } else if (kind === 'electronic') {
    // 1985 electronic cash register with LED.
    const body = box('era:ElectronicRegisterBody', 0.3, 0.3, 0.3,
      mats[tech.material] ?? mats.plastic);
    g.add(body);
    // LED display.
    const led = box('era:RegLED', 0.12, 0.04, 0.01,
      new THREE.MeshStandardMaterial({
        color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6,
      }));
    led.position.set(0, 0.12, 0.16);
    g.add(led);
    // Keyboard.
    const kb = box('era:RegKeyboard', 0.2, 0.02, 0.1, mats.plastic);
    kb.position.set(0, 0.02, 0.17);
    g.add(kb);
    g.position.set(tech.x ?? 1.0, baseY + 0.15, tech.z ?? 2.9);
  } else if (kind === 'computer') {
    // 2005 POS computer: CRT or flat monitor + keyboard.
    const body = box('era:POSBody', 0.25, 0.25, 0.2, mats[tech.material] ?? mats.plastic);
    g.add(body);
    // Monitor screen.
    const screen = box('era:POSScreen', 0.18, 0.14, 0.02,
      new THREE.MeshStandardMaterial({
        color: 0x224488, emissive: 0x1133aa, emissiveIntensity: 0.4,
      }));
    screen.position.set(0, 0.03, 0.11);
    g.add(screen);
    // Keyboard.
    const kb = box('era:POSKeyboard', 0.25, 0.02, 0.1, mats.plastic);
    kb.position.set(0, -0.12, 0.17);
    g.add(kb);
    g.position.set(tech.x ?? 1.0, baseY + 0.13, tech.z ?? 2.9);
  } else if (kind === 'tablet') {
    // 2025 contactless tablet POS on a stand.
    const stand = cyl('era:POSStand', 0.03, 0.05, 0.1, mats.chrome, 10);
    g.add(stand);
    const tablet = box('era:POSTablet', 0.2, 0.3, 0.015,
      new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.2, metalness: 0.5,
      }));
    tablet.position.y = 0.2;
    g.add(tablet);
    // Screen.
    const screen = box('era:POSTabletScreen', 0.17, 0.27, 0.002,
      new THREE.MeshStandardMaterial({
        color: 0x000000, emissive: 0x224466, emissiveIntensity: 0.5,
      }));
    screen.position.set(0, 0.2, 0.008);
    g.add(screen);
    // Contactless symbol (small glowing circle).
    const nfc = cyl('era:NFCReader', 0.03, 0.03, 0.005,
      new THREE.MeshStandardMaterial({
        color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.5,
      }), 16);
    nfc.rotation.x = Math.PI / 2;
    nfc.position.set(0, -0.08, 0.12);
    g.add(nfc);
    g.position.set(tech.x ?? 1.0, baseY + 0.05, tech.z ?? 2.9);
  }

  return g;
}

/**
 * Builds patrons as simple stylised figures with era-appropriate outfit
 * colours, and optionally hair/gadgets.
 *
 * @param {Object} patrons - Patrons descriptor.
 * @param {Object} mats    - Material cache.
 * @returns {THREE.Group}
 */
function buildPatrons(patrons, mats) {
  const g = new THREE.Group();
  g.name = 'era:Patrons';

  const people = patrons.figures ?? [];
  people.forEach((person, i) => {
    const figGroup = new THREE.Group();
    figGroup.name = `era:Patron${i}`;

    // Body (torso) — coloured by outfit.
    const outfitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(person.outfit ?? 0x444444),
      roughness: 0.85,
    });
    const torso = box(`era:Torso${i}`, 0.38, 0.6, 0.22, outfitMat);
    torso.position.y = 1.1;
    figGroup.add(torso);

    // Head.
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(person.skin ?? 0xddc0a0),
      roughness: 0.7,
    });
    const head = sphere(`era:Head${i}`, 0.13, skinMat, 16);
    head.position.y = 1.55;
    figGroup.add(head);

    // Hair.
    if (person.hair) {
      const hairMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(person.hairColor ?? 0x332211),
        roughness: 0.9,
      });
      if (person.hair === 'short' || person.hair === 'cropped') {
        const hair = sphere(`era:Hair${i}`, 0.135, hairMat, 12);
        hair.position.y = 1.6;
        hair.scale.y = 0.7;
        figGroup.add(hair);
      } else if (person.hair === 'long') {
        const hair = sphere(`era:Hair${i}`, 0.14, hairMat, 12);
        hair.position.y = 1.55;
        hair.scale.set(1, 1.1, 1);
        figGroup.add(hair);
        // Longer back.
        const back = box(`era:HairBack${i}`, 0.2, 0.25, 0.05, hairMat);
        back.position.set(0, 1.45, -0.12);
        figGroup.add(back);
      } else if (person.hair === 'bun' || person.hair === 'updo') {
        const hair = sphere(`era:Hair${i}`, 0.135, hairMat, 12);
        hair.position.y = 1.6;
        hair.scale.y = 0.7;
        figGroup.add(hair);
        const bun = sphere(`era:HairBun${i}`, 0.06, hairMat, 10);
        bun.position.set(0, 1.72, -0.05);
        figGroup.add(bun);
      } else if (person.hair === 'curly' || person.hair === 'afro') {
        const hair = sphere(`era:Hair${i}`, 0.17, hairMat, 16);
        hair.position.y = 1.6;
        figGroup.add(hair);
      }
    }

    // Legs.
    const legMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(person.pants ?? 0x222222),
      roughness: 0.8,
    });
    [-0.1, 0.1].forEach((lx, j) => {
      const leg = box(`era:Leg${i}_${j}`, 0.12, 0.7, 0.12, legMat);
      leg.position.set(lx, 0.45, 0);
      figGroup.add(leg);
    });

    // Arms.
    [-0.24, 0.24].forEach((ax, j) => {
      const arm = box(`era:Arm${i}_${j}`, 0.1, 0.55, 0.1, outfitMat);
      arm.position.set(ax, 1.1, 0);
      figGroup.add(arm);
    });

    // Gadget in hand (phone, newspaper, walkman, etc.).
    if (person.gadget) {
      let gadget;
      if (person.gadget === 'newspaper') {
        gadget = box(`era:Gadget${i}`, 0.2, 0.25, 0.02, mats.paper);
      } else if (person.gadget === 'phone' || person.gadget === 'smartphone') {
        gadget = box(`era:Gadget${i}`, 0.06, 0.12, 0.008,
          new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }));
      } else if (person.gadget === 'walkman') {
        gadget = box(`era:Gadget${i}`, 0.08, 0.1, 0.03, mats.plastic);
      } else if (person.gadget === 'book') {
        gadget = box(`era:Gadget${i}`, 0.15, 0.2, 0.03, mats.paper);
      } else {
        gadget = box(`era:Gadget${i}`, 0.1, 0.1, 0.05, mats.accent);
      }
      gadget.position.set(person.gadgetSide === 'left' ? -0.24 : 0.24, 0.9, 0.05);
      figGroup.add(gadget);
    }

    // Position.
    figGroup.position.set(person.x ?? 0, person.y ?? 0, person.z ?? 0);
    if (person.rotY) figGroup.rotation.y = person.rotY;
    figGroup.scale.setScalar(person.scale ?? 1);

    g.add(figGroup);
  });

  return g;
}

// ---------------------------------------------------------------------------
// Main export: turn a PeriodPackage descriptor into a THREE.Group.
// ---------------------------------------------------------------------------

/**
 * Builds the complete 3D scene for a period package.
 *
 * Walks every category in the package descriptor and instantiates the
 * corresponding procedural meshes, adding them all to a single root
 * `THREE.Group` ready to be mounted by `window.CafeScene.mountEra()`.
 *
 * @param {Object} pkg     - The PeriodPackage descriptor.
 * @param {Object} palette - Colour palette (hex values keyed by material role).
 * @returns {THREE.Group}  - The populated era group.
 */
export function buildEraScene(pkg, palette) {
  const root = new THREE.Group();
  root.name = `era:${pkg.year}`;

  const mats = makeMaterialCache(palette);

  if (pkg.furniture) root.add(buildFurniture(pkg.furniture, mats));
  if (pkg.coffeeEquipment) root.add(buildCoffeeEquipment(pkg.coffeeEquipment, mats));
  if (pkg.menu) root.add(buildMenuBoard(pkg.menu, mats));
  if (pkg.music) root.add(buildMusicSource(pkg.music, mats));
  if (pkg.signage) root.add(buildWallPosters(pkg.signage, mats));
  if (pkg.tableware) root.add(buildTableware(pkg.tableware, mats));
  if (pkg.lighting) root.add(buildSignageAndLighting(pkg.lighting, mats));
  if (pkg.counterTechnology) root.add(buildCounterTechnology(pkg.counterTechnology, mats));
  if (pkg.patrons) root.add(buildPatrons(pkg.patrons, mats));

  return root;
}

export default buildEraScene;
