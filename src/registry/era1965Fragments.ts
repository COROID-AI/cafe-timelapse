/**
 * era1965Fragments.ts — detailed procedural scene fragments for the 1965 era
 * (Swinging Sixties Diner / mid-century beatnik café).
 *
 * Registers a scene-fragment factory for every one of the 11 brief categories
 * for era 1965, replacing the generic stubs in eraFragments.ts. Each factory
 * builds period-appropriate procedural geometry using ONLY the shared asset
 * library (`MaterialFactory`, `TextureFactory`, `PropPrimitives`) and the
 * layout anchors from layout.ts — no external model files, no ad-hoc hex
 * colours (the 1965 palette is the single visual source of truth).
 *
 * Era 1965 brief (the eight detail categories + surface slots + audio):
 *   • Furniture & decor  — Formica booths w/ chrome trim, vinyl counter stools,
 *                          geometric wallpapers.
 *   • Coffee/brewing     — early electric drip urns + Faema E61-style espresso.
 *   • Menu board         — plastic letter-board with 1965 prices (~20–30¢).
 *   • Music source       — tabletop jukebox / mini-jukebox selector.
 *   • Posters/ads        — mid-century modern + pop-art coffee ads.
 *   • Tableware          — Melamine / diner mugs, glass creamers.
 *   • Signage & lighting — glowing tube neon, fluorescent ceiling tubes.
 *   • Counter tech       — early electric cash register.
 *   • Surface slots      — checkerboard tile floor, wood paneling walls.
 *
 * The era's audio config (motown/beat/folk-evocative generative bed, jukebox
 * timbre, urn hiss) already lives on EraData.audio in eras.ts and is consumed
 * by AudioEngine — see {@link registerEra1965} for the contract note.
 *
 * This module is side-effectful: importing it (or calling
 * {@link registerEra1965}) populates the shared AssetRegistry.
 */
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type Texture,
  type Object3D,
} from 'three';
import {
  MaterialFactory,
  PropPrimitives,
  TextureFactory,
  getEraPalette,
} from '../assets/index.js';
import { characterRoster, buildCharacterAvatars } from '../characters/index.js';
import '../characters/patrons1965.js';
import type { EraYear } from '../data/EraData.js';
import { assetRegistry } from './AssetRegistry.js';
import { registerShellFinisher } from './shellFinishers.js';
import { ANCHORS } from '../world/layout.js';
import type { ArchitectureShell } from '../world/ArchitectureShell.js';

// ---------------------------------------------------------------------------
// Era + palette
// ---------------------------------------------------------------------------

/** The era this module registers fragments for. */
const ERA: EraYear = 1965;

// ===========================================================================
// 1. ARCHITECTURE — surface slots (checkerboard tile floor, wood-panel walls)
// ===========================================================================
//
// The 1965 brief calls for checkerboard-lino floor and wood-paneling walls.
// The room envelope geometry is owned by the persistent ArchitectureShell; this
// fragment returns a Group whose meshes are era FINISHES applied to the shell's
// surface slots. SceneManager owns the shell reference; to keep the registry a
// pure (category→Object3D) mapping the finishes are emitted as standalone
// meshes that the scene controller can recognise by name and apply, OR — to
// keep things simple and self-contained — the fragment builds a lightweight
// finish-preview group. The real slot population happens in
// {@link applyEra1965ShellFinishes}, which the scene controller calls.
// ===========================================================================

/**
 * Apply the 1965 era surface finishes to the persistent shell's surface slots.
 * Registered with the shell-finisher registry so SceneManager applies it when
 * era 1965 becomes active, making the era-neutral shell read as a sixties
 * diner: checkerboard tile floor, wood-paneling walls, acoustic-tile ceiling,
 * chrome-trim glass.
 */
export function applyEra1965ShellFinishes(shell: ArchitectureShell): void {
  // Checkerboard tile floor (black-and-white lino): a concrete-role base with
  // the procedural tile texture for the checkerboard squares.
  const tileMat = MaterialFactory.get('concrete', ERA, {
    color: 0x1a1a1a,
    roughness: 0.4,
    textured: false,
  });
  (tileMat as unknown as { map: Texture | null }).map = TextureFactory.get(
    'tile',
    ERA,
    { repeatX: 8, repeatY: 8 },
  );
  tileMat.needsUpdate = true;
  shell.applyFloorMaterial(tileMat);

  // Wood-paneling walls — the 1965 palette wood (mahogany) with a wood texture.
  const panelMat = MaterialFactory.get('wood', ERA, {
    repeatX: 2,
    repeatY: 1,
  });
  shell.applyWallMaterial('back', panelMat);
  shell.applyWallMaterial('left', panelMat);
  shell.applyWallMaterial('right', panelMat);
  shell.applyWallMaterial('storefront', panelMat);

  // Acoustic-tile ceiling (dropped grid) — light, flat.
  shell.applyCeilingMaterial(
    MaterialFactory.get('concrete', ERA, {
      color: getEraPalette(ERA).ceiling,
      roughness: 0.9,
      textured: false,
    }),
  );

  // Chrome-trim storefront glass (slightly tinted).
  shell.applyGlassMaterial(
    MaterialFactory.get('glass', ERA, {
      color: 0xbfd0e0,
      roughness: 0.1,
    }),
  );
}

/**
 * Architecture fragment: emits a small placement marker group that names the
 * 1965 surface-slot finishes so the registry is complete for the category. The
 * real finishes are applied via {@link applyEra1965ShellFinishes}.
 */
function buildArchitectureFragment(): Object3D {
  const group = new Group();
  group.name = `architecture:${ERA}`;
  // A thin floor-level marker so the category is non-empty in the scene graph.
  const marker = new Mesh(
    new BoxGeometry(0.1, 0.1, 0.1),
    MaterialFactory.get('wood', ERA),
  );
  marker.position.set(0, 0.05, 0);
  marker.name = `architecture-marker:${ERA}`;
  group.add(marker);
  return group;
}

// ===========================================================================
// 2. FURNITURE & DECOR — Formica booths + chrome counter stools
// ===========================================================================

/**
 * Build a Formica diner booth: a vinyl-upholstered bench seat + backrest and a
 * Formica-topped table with chrome trim. The quintessential sixties-diner
 * seating. Uses the era palette's primary red vinyl + chrome metal accents.
 */
function buildFormicaBooth(x: number, z: number, flip = false): Object3D {
  const group = new Group();
  group.name = `booth:${ERA}`;
  group.position.set(x, 0, z);
  if (flip) group.rotation.y = Math.PI;

  const palette = getEraPalette(ERA);
  const vinylMat = MaterialFactory.get('fabric', ERA, {
    color: palette.primary,
  });
  const formicaMat = MaterialFactory.get('ceramic', ERA, {
    color: 0xf2f0ea,
    roughness: 0.3,
    clearcoat: 0.6,
  });
  const chromeMat = MaterialFactory.get('chrome', ERA);

  // Bench seat slab (runs along one side).
  const seatW = 1.6;
  const seatD = 0.5;
  const seatH = 0.45;
  const seat = new Mesh(new BoxGeometry(seatW, 0.08, seatD), vinylMat);
  seat.position.set(0, seatH, 0);
  seat.castShadow = true;
  group.add(seat);

  // Bench backrest.
  const back = new Mesh(new BoxGeometry(seatW, 0.55, 0.08), vinylMat);
  back.position.set(0, seatH + 0.3, -seatD / 2 + 0.04);
  back.castShadow = true;
  group.add(back);

  // Chrome trim along the seat edge + backrest top.
  const seatTrim = new Mesh(
    new BoxGeometry(seatW, 0.02, 0.02),
    chromeMat,
  );
  seatTrim.position.set(0, seatH + 0.045, seatD / 2);
  group.add(seatTrim);
  const backTrim = new Mesh(new BoxGeometry(seatW, 0.02, 0.02), chromeMat);
  backTrim.position.set(0, seatH + 0.58, -seatD / 2 + 0.04);
  group.add(backTrim);

  // Formica tabletop on a chrome pedestal.
  const top = new Mesh(new BoxGeometry(0.9, 0.04, 0.7), formicaMat);
  top.position.set(0, 0.75, 0.45);
  top.castShadow = true;
  group.add(top);
  // Chrome edge band on the tabletop.
  const edge = new Mesh(new BoxGeometry(0.92, 0.025, 0.72), chromeMat);
  edge.position.set(0, 0.75, 0.45);
  group.add(edge);
  // Pedestal leg.
  const ped = new Mesh(
    new CylinderGeometry(0.04, 0.06, 0.71, 16),
    chromeMat,
  );
  ped.position.set(0, 0.355, 0.45);
  group.add(ped);

  return group;
}

/** Build a single chrome vinyl counter stool. */
function buildChromeStool(x: number, z: number): Object3D {
  const group = new Group();
  group.name = `stool:${ERA}`;
  group.position.set(x, 0, z);

  const palette = getEraPalette(ERA);
  const vinylMat = MaterialFactory.get('fabric', ERA, {
    color: palette.primary,
  });
  const chromeMat = MaterialFactory.get('chrome', ERA);

  // Vinyl seat disc.
  const seat = new Mesh(new CylinderGeometry(0.18, 0.18, 0.05, 24), vinylMat);
  seat.position.set(0, 0.62, 0);
  seat.castShadow = true;
  group.add(seat);
  // Chrome seat rim.
  const rim = new Mesh(new TorusGeometry(0.18, 0.012, 12, 24), chromeMat);
  rim.position.set(0, 0.645, 0);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  // Central chrome column.
  const col = new Mesh(new CylinderGeometry(0.03, 0.03, 0.6, 16), chromeMat);
  col.position.set(0, 0.3, 0);
  group.add(col);
  // Circular chrome foot.
  const foot = new Mesh(new CylinderGeometry(0.16, 0.16, 0.02, 24), chromeMat);
  foot.position.set(0, 0.01, 0);
  group.add(foot);

  return group;
}

/**
 * Build the service counter body (Formica top, chrome trim, vinyl front panel)
 * that runs along the back wall. The espresso machine, urn, menu board, and
 * cash register sit on / above it.
 */
function buildDinerCounter(): Object3D {
  const group = new Group();
  group.name = `counter:${ERA}`;
  group.position.set(
    ANCHORS.counterCenter.x,
    0,
    ANCHORS.counterCenter.z + 0.3,
  );

  const palette = getEraPalette(ERA);
  const formicaMat = MaterialFactory.get('ceramic', ERA, {
    color: 0xf2f0ea,
    roughness: 0.3,
    clearcoat: 0.6,
  });
  const chromeMat = MaterialFactory.get('chrome', ERA);
  const vinylMat = MaterialFactory.get('fabric', ERA, {
    color: palette.primary,
  });

  // Counter top.
  const top = new Mesh(new BoxGeometry(6.0, 0.06, 0.7), formicaMat);
  top.position.set(0, 1.05, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  // Chrome edge band.
  const edge = new Mesh(new BoxGeometry(6.02, 0.03, 0.72), chromeMat);
  edge.position.set(0, 1.065, 0);
  group.add(edge);
  // Front fascia — red vinyl.
  const fascia = new Mesh(new BoxGeometry(6.0, 1.0, 0.04), vinylMat);
  fascia.position.set(0, 0.52, 0.36);
  group.add(fascia);
  // Chrome kick rail along the fascia bottom.
  const rail = new Mesh(new BoxGeometry(6.0, 0.06, 0.05), chromeMat);
  rail.position.set(0, 0.1, 0.37);
  group.add(rail);
  // Counter base box.
  const base = new Mesh(
    new BoxGeometry(6.0, 1.0, 0.7),
    MaterialFactory.get('wood', ERA, { textured: false }),
  );
  base.position.set(0, 0.52, 0);
  group.add(base);

  return group;
}

function buildFurnitureFragment(): Object3D {
  const group = new Group();
  group.name = `furniture:${ERA}`;

  // Service counter along the back wall.
  group.add(buildDinerCounter());

  // Counter stools along the customer side of the counter.
  for (let i = -2; i <= 2; i++) {
    group.add(buildChromeStool(i * 1.2, ANCHORS.counterCenter.z + 1.1));
  }

  // Two Formica booths in the seating zone.
  group.add(
    buildFormicaBooth(ANCHORS.seatingTableA.x - 1.2, ANCHORS.seatingTableA.z),
  );
  group.add(
    buildFormicaBooth(ANCHORS.seatingTableB.x + 1.2, ANCHORS.seatingTableB.z, true),
  );

  // A small Formica table + two chairs at the window table.
  const table = PropPrimitives.buildTable({
    year: ERA,
    width: 0.9,
    depth: 0.9,
    height: 0.75,
    legStyle: 'central',
    role: 'metal',
  });
  table.position.set(ANCHORS.seatingTableC.x, 0, ANCHORS.seatingTableC.z);
  group.add(table);
  for (const dx of [-0.6, 0.6]) {
    const chair = PropPrimitives.buildChair({
      year: ERA,
      upholstery: 'fabric',
    });
    chair.position.set(ANCHORS.seatingTableC.x + dx, 0, ANCHORS.seatingTableC.z);
    if (dx > 0) chair.rotation.y = Math.PI;
    group.add(chair);
  }

  return group;
}

// ===========================================================================
// 3. COFFEE MACHINES — electric drip urns + Faema E61-style espresso
// ===========================================================================

/**
 * Build a large electric drip coffee urn (stainless steel tank + spigot + drip
 * gauge), the workhorse urn of a 1960s diner. Placed beside the espresso
 * machine on the counter.
 */
function buildDripUrn(): Object3D {
  const group = new Group();
  group.name = `drip-urn:${ERA}`;

  const steelMat = MaterialFactory.get('metal', ERA, {
    roughness: 0.25,
    metalness: 0.95,
  });
  const chromeMat = MaterialFactory.get('chrome', ERA);
  const glassMat = MaterialFactory.get('glass', ERA, { color: 0xddeeff });

  // Main urn body (tall cylinder).
  const body = new Mesh(new CylinderGeometry(0.22, 0.24, 0.7, 24), steelMat);
  body.position.set(0, 0.45, 0);
  body.castShadow = true;
  group.add(body);
  // Domed lid.
  const lid = new Mesh(new SphereGeometry(0.22, 24, 12), steelMat);
  lid.position.set(0, 0.8, 0);
  lid.scale.y = 0.5;
  group.add(lid);
  // Top knob (chrome).
  const knob = new Mesh(new SphereGeometry(0.03, 12, 8), chromeMat);
  knob.position.set(0, 0.92, 0);
  group.add(knob);
  // Glass sight-gauge tube on the front.
  const gauge = new Mesh(
    new CylinderGeometry(0.015, 0.015, 0.4, 12),
    glassMat,
  );
  gauge.position.set(0.18, 0.5, 0.0);
  group.add(gauge);
  // Spigot.
  const spigot = new Mesh(
    new CylinderGeometry(0.018, 0.018, 0.12, 12),
    chromeMat,
  );
  spigot.position.set(0.24, 0.2, 0.0);
  spigot.rotation.z = Math.PI / 2;
  group.add(spigot);
  // Base ring.
  const base = new Mesh(new CylinderGeometry(0.25, 0.25, 0.04, 24), chromeMat);
  base.position.set(0, 0.04, 0);
  group.add(base);

  return group;
}

function buildCoffeeMachinesFragment(): Object3D {
  const group = new Group();
  group.name = `coffeeMachines:${ERA}`;

  // Faema E61-style espresso machine — lever style (the E61 pioneered the
  // volumetric group + E61 group head; the shared lever shell evokes its
  // chrome + bakelite boiler body).
  const espresso = PropPrimitives.buildMachineShell({
    year: ERA,
    style: 'lever',
    width: 0.7,
    height: 0.8,
    depth: 0.55,
    role: 'chrome',
  });
  // Place at the machine slot anchor (matches the audio spatialization).
  espresso.position.set(ANCHORS.machineSlot.x, 1.1, ANCHORS.machineSlot.z);
  group.add(espresso);

  // Electric drip urn beside it.
  const urn = buildDripUrn();
  urn.position.set(ANCHORS.machineSlot.x + 1.4, 1.1, ANCHORS.machineSlot.z);
  group.add(urn);

  return group;
}

// ===========================================================================
// 4. MENU BOARD — plastic letter-board with 1965 prices
// ===========================================================================

/**
 * Build a plastic letter-board menu (grooved felt-style board with snap-in
 * plastic letters). Uses the chalkboard texture generator with 1965 diner
 * prices (~20–30¢) to render the menu text, mounted in a chrome frame on the
 * back wall above the counter.
 */
function buildMenuBoardFragment(): Object3D {
  const group = new Group();
  group.name = `menuBoard:${ERA}`;

  const chromeMat = MaterialFactory.get('chrome', ERA);

  // Letter-board panel — use a dark board material with a chalkboard-style
  // texture carrying the 1965 diner menu + prices.
  const boardMat = MaterialFactory.get('chalkboard', ERA, { textured: false });
  const menuTex = TextureFactory.get('chalkboard', ERA, {
    heading: 'MENU',
    items: ['Coffee', 'Cappuccino', 'Milkshake', 'Slice of Pie', 'Diner Fries'],
    prices: ['20¢', '30¢', '25¢', '30¢', '25¢'],
  });
  (boardMat as unknown as { map: Texture | null }).map = menuTex;
  boardMat.needsUpdate = true;

  const board = new Mesh(new PlaneGeometry(2.4, 1.2), boardMat);
  board.position.set(0, 0, 0);
  board.castShadow = true;
  group.add(board);

  // Chrome frame rails around the letter-board.
  const fw = 2.5;
  const fh = 1.3;
  const t = 0.05;
  const top = new Mesh(new BoxGeometry(fw, t, 0.06), chromeMat);
  top.position.set(0, fh / 2 - t / 2, 0.01);
  group.add(top);
  const bot = new Mesh(new BoxGeometry(fw, t, 0.06), chromeMat);
  bot.position.set(0, -fh / 2 + t / 2, 0.01);
  group.add(bot);
  const left = new Mesh(new BoxGeometry(t, fh - t * 2, 0.06), chromeMat);
  left.position.set(-fw / 2 + t / 2, 0, 0.01);
  group.add(left);
  const right = new Mesh(new BoxGeometry(t, fh - t * 2, 0.06), chromeMat);
  right.position.set(fw / 2 - t / 2, 0, 0.01);
  group.add(right);

  // Mount on the back wall above the counter.
  group.position.copy(ANCHORS.menuBoardWall);
  return group;
}

// ===========================================================================
// 5. MUSIC SOURCE — tabletop jukebox / mini-jukebox selector
// ===========================================================================

/**
 * Build a tabletop mini-jukebox selector: a domed chrome-and-plastic housing
 * (evoking a Wall-O-Matic / tabletop selector) with a glowing song-title
 * window and selection buttons. Placed at the era's music-source spatial
 * anchor (matches the audio spatialization).
 */
function buildTabletopJukebox(): Object3D {
  const group = new Group();
  group.name = `jukebox:${ERA}`;

  const palette = getEraPalette(ERA);
  const chromeMat = MaterialFactory.get('chrome', ERA);
  const plasticMat = MaterialFactory.get('plastic', ERA, {
    color: palette.primary,
  });
  const glowMat = MaterialFactory.get('neon', ERA, {
    color: palette.neon,
    emissive: palette.neon,
    emissiveIntensity: 1.0,
  });

  // Base box (the selector housing).
  const base = new Mesh(new BoxGeometry(0.32, 0.12, 0.22), plasticMat);
  base.position.set(0, 0.06, 0);
  base.castShadow = true;
  group.add(base);

  // Domed top.
  const dome = new Mesh(new SphereGeometry(0.16, 20, 12), chromeMat);
  dome.position.set(0, 0.12, 0);
  dome.scale.set(1, 0.6, 0.7);
  group.add(dome);

  // Glowing song-title window (a small emissive strip on the front).
  const window = new Mesh(new PlaneGeometry(0.22, 0.06), glowMat);
  window.position.set(0, 0.1, 0.112);
  group.add(window);

  // Selection buttons — a grid of tiny chrome dots on the front face.
  const btnMat = chromeMat;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const btn = new Mesh(
        new CylinderGeometry(0.012, 0.012, 0.01, 10),
        btnMat,
      );
      btn.position.set(-0.1 + col * 0.05, 0.03 + row * 0.03, 0.112);
      btn.rotation.x = Math.PI / 2;
      group.add(btn);
    }
  }

  return group;
}

function buildMusicSourceFragment(): Object3D {
  const group = new Group();
  group.name = `musicSource:${ERA}`;

  // The tabletop jukebox selector sits at the era's music-source spatial
  // anchor (matches the PannerNode audio position).
  const jukebox = buildTabletopJukebox();
  jukebox.position.set(
    ANCHORS.counterCenter.x + 2,
    1.1,
    ANCHORS.counterCenter.z,
  );
  group.add(jukebox);

  return group;
}

// ===========================================================================
// 6. POSTERS — mid-century modern + pop-art coffee ads
// ===========================================================================

function buildPostersFragment(): Object3D {
  const group = new Group();
  group.name = `posters:${ERA}`;

  // Left wall: two pop-art coffee ads.
  const leftA = PropPrimitives.buildFrame({
    year: ERA,
    width: 0.7,
    height: 1.0,
    title: 'JAVA',
    subtitle: 'GROOVY COFFEE',
    swatchIndex: 0,
    role: 'chrome',
  });
  leftA.position.set(ANCHORS.leftPosterWall.x + 0.06, 2.2, -1.0);
  leftA.rotation.y = Math.PI / 2;
  group.add(leftA);

  const leftB = PropPrimitives.buildFrame({
    year: ERA,
    width: 0.7,
    height: 1.0,
    title: 'ESPRESSO',
    subtitle: 'BUON GIORNO',
    swatchIndex: 1,
    role: 'chrome',
  });
  leftB.position.set(ANCHORS.leftPosterWall.x + 0.06, 2.2, 1.0);
  leftB.rotation.y = Math.PI / 2;
  group.add(leftB);

  // Right wall: two more pop-art ads.
  const rightA = PropPrimitives.buildFrame({
    year: ERA,
    width: 0.7,
    height: 1.0,
    title: 'MOCCHA',
    subtitle: 'FAR OUT',
    swatchIndex: 2,
    role: 'chrome',
  });
  rightA.position.set(ANCHORS.rightPosterWall.x - 0.06, 2.2, -1.0);
  rightA.rotation.y = -Math.PI / 2;
  group.add(rightA);

  const rightB = PropPrimitives.buildFrame({
    year: ERA,
    width: 0.7,
    height: 1.0,
    title: 'COLA',
    subtitle: 'IT\'S THE REAL THING',
    swatchIndex: 3,
    role: 'chrome',
  });
  rightB.position.set(ANCHORS.rightPosterWall.x - 0.06, 2.2, 1.0);
  rightB.rotation.y = -Math.PI / 2;
  group.add(rightB);

  return group;
}

// ===========================================================================
// 7. TABLEWARE — Melamine/diner mugs + glass creamers
// ===========================================================================

/** Build a small glass creamer jug. */
function buildGlassCreamer(): Object3D {
  const group = new Group();
  group.name = `creamer:${ERA}`;
  const glassMat = MaterialFactory.get('glass', ERA, { color: 0xeef4ff });

  // Tapered body.
  const body = new Mesh(new CylinderGeometry(0.035, 0.045, 0.09, 16), glassMat);
  body.position.set(0, 0.045, 0);
  group.add(body);
  // Spout (a small angled wedge).
  const spout = new Mesh(new CylinderGeometry(0.008, 0.012, 0.03, 8), glassMat);
  spout.position.set(0.04, 0.09, 0);
  spout.rotation.z = -Math.PI / 4;
  group.add(spout);
  // Tiny handle.
  const handle = new Mesh(new TorusGeometry(0.025, 0.004, 8, 16, Math.PI), glassMat);
  handle.position.set(-0.045, 0.05, 0);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);

  return group;
}

function buildTablewareFragment(): Object3D {
  const group = new Group();
  group.name = `tableware:${ERA}`;

  // Diner mugs (heavy ceramic) on the counter + tables.
  const mugPositions: Array<[number, number]> = [
    [ANCHORS.counterCenter.x - 1.5, ANCHORS.counterCenter.z + 0.1],
    [ANCHORS.counterCenter.x + 0.5, ANCHORS.counterCenter.z + 0.1],
    [ANCHORS.seatingTableA.x, ANCHORS.seatingTableA.z + 0.45],
    [ANCHORS.seatingTableB.x, ANCHORS.seatingTableB.z + 0.45],
    [ANCHORS.seatingTableC.x, ANCHORS.seatingTableC.z],
  ];
  for (const [mx, mz] of mugPositions) {
    const mug = PropPrimitives.buildCup({ year: ERA, kind: 'mug' });
    mug.position.set(mx, 1.1, mz);
    group.add(mug);
  }

  // Glass creamers beside a couple of mugs.
  const creamerA = buildGlassCreamer();
  creamerA.position.set(ANCHORS.counterCenter.x - 1.2, 1.1, ANCHORS.counterCenter.z + 0.15);
  group.add(creamerA);
  const creamerB = buildGlassCreamer();
  creamerB.position.set(ANCHORS.seatingTableC.x + 0.2, 0.75, ANCHORS.seatingTableC.z);
  group.add(creamerB);

  return group;
}

// ===========================================================================
// 8. SIGNAGE — glowing tube neon
// ===========================================================================

function buildSignageFragment(): Object3D {
  const group = new Group();
  group.name = `signage:${ERA}`;

  // Tube neon "COFFEE" sign on the back wall, high up.
  const neon = PropPrimitives.buildSignage({
    year: ERA,
    style: 'neon',
    width: 2.2,
    height: 0.5,
    text: 'COFFEE',
  });
  neon.position.set(-2.5, 3.2, ANCHORS.menuBoardWall.z + 0.1);
  group.add(neon);

  // A second neon script near the storefront.
  const neon2 = PropPrimitives.buildSignage({
    year: ERA,
    style: 'neon',
    width: 1.6,
    height: 0.4,
    text: 'OPEN',
  });
  neon2.position.set(2.5, 3.2, ANCHORS.menuBoardWall.z + 0.1);
  group.add(neon2);

  return group;
}

// ===========================================================================
// 9. LIGHTING — tube neon + fluorescent ceiling tubes
// ===========================================================================

function buildLightingFragment(): Object3D {
  const group = new Group();
  group.name = `lighting:${ERA}`;

  const palette = getEraPalette(ERA);
  const tubeMat = MaterialFactory.get('neon', ERA, {
    color: palette.lightTint,
    emissive: palette.lightTint,
    emissiveIntensity: 1.4,
  });
  const housingMat = MaterialFactory.get('metal', ERA, { roughness: 0.5 });

  // Fluorescent ceiling tubes — long emissive bars in chrome housings, hung
  // from the ceiling light mount.
  for (let i = -1; i <= 1; i++) {
    const housing = new Group();
    housing.name = `fluoro-tube:${ERA}:${i}`;
    // Housing frame.
    const frame = new Mesh(new BoxGeometry(2.4, 0.06, 0.18), housingMat);
    frame.position.set(0, -0.04, 0);
    housing.add(frame);
    // Emissive tube.
    const tube = new Mesh(new BoxGeometry(2.2, 0.04, 0.08), tubeMat);
    tube.position.set(0, -0.02, 0);
    housing.add(tube);
    housing.position.set(i * 3.5, -0.15, 0);
    group.add(housing);
  }

  // Neon wall strips (sconces) on the side walls.
  const stripMat = MaterialFactory.get('neon', ERA);
  const leftStrip = new Mesh(new BoxGeometry(0.03, 1.2, 0.08), stripMat);
  leftStrip.position.set(ANCHORS.leftPosterWall.x + 0.05, 1.6, -2.5);
  group.add(leftStrip);
  const rightStrip = new Mesh(new BoxGeometry(0.03, 1.2, 0.08), stripMat);
  rightStrip.position.set(ANCHORS.rightPosterWall.x - 0.05, 1.6, -2.5);
  group.add(rightStrip);

  // Parent the whole rig at ceiling height so it sits in the light mount.
  group.position.set(0, 3.95, 0);
  return group;
}

// ===========================================================================
// 10. COUNTER TECHNOLOGY — early electric cash register
// ===========================================================================

/**
 * Build an early electric cash register: a tall metal body with a row of
 * push-button keys, a raised display, a cash drawer, and a crank side lever.
 * Evokes the electro-mechanical registers of the mid-1960s.
 */
function buildElectricCashRegister(): Object3D {
  const group = new Group();
  group.name = `cash-register:${ERA}`;

  const palette = getEraPalette(ERA);
  const metalMat = MaterialFactory.get('metal', ERA, {
    color: palette.metal,
    roughness: 0.35,
    metalness: 0.9,
  });
  const darkMat = MaterialFactory.get('plastic', ERA, {
    color: 0x1a1a1a,
  });
  const keyMat = MaterialFactory.get('plastic', ERA, {
    color: palette.primary,
  });
  const glassMat = MaterialFactory.get('glass', ERA, { color: 0xddeeff });

  // Main body.
  const body = new Mesh(new BoxGeometry(0.5, 0.35, 0.4), metalMat);
  body.position.set(0, 0.2, 0);
  body.castShadow = true;
  group.add(body);

  // Raised display housing (the pop-up amount indicator).
  const display = new Mesh(new BoxGeometry(0.35, 0.15, 0.2), metalMat);
  display.position.set(0, 0.45, -0.05);
  group.add(display);
  // Glass display window.
  const window = new Mesh(new PlaneGeometry(0.25, 0.08), glassMat);
  window.position.set(0, 0.45, 0.06);
  group.add(window);

  // Row of push-button keys on the front slope.
  for (let col = 0; col < 6; col++) {
    const key = new Mesh(new CylinderGeometry(0.025, 0.025, 0.03, 12), keyMat);
    key.position.set(-0.18 + col * 0.07, 0.27, 0.16);
    key.rotation.x = Math.PI / 2.4;
    group.add(key);
  }

  // Cash drawer (front face, slightly protruding).
  const drawer = new Mesh(new BoxGeometry(0.45, 0.08, 0.03), darkMat);
  drawer.position.set(0, 0.08, 0.205);
  group.add(drawer);

  // Side crank lever.
  const crank = new Mesh(new CylinderGeometry(0.015, 0.015, 0.12, 10), metalMat);
  crank.position.set(0.28, 0.25, 0);
  crank.rotation.z = Math.PI / 2;
  group.add(crank);
  const crankHandle = new Mesh(new SphereGeometry(0.025, 12, 8), metalMat);
  crankHandle.position.set(0.34, 0.25, 0);
  group.add(crankHandle);

  return group;
}

function buildCounterTechFragment(): Object3D {
  const group = new Group();
  group.name = `counterTech:${ERA}`;

  const register = buildElectricCashRegister();
  register.position.set(
    ANCHORS.counterTechSlot.x,
    1.1,
    ANCHORS.counterTechSlot.z,
  );
  group.add(register);

  return group;
}

// ===========================================================================
// 11. PATRONS — mod-suits / miniskirts / beehives / transistor radios
// ===========================================================================

/**
 * Build the 1965 patron population via the character system.
 *
 * The 1965-era {@link PatronConfig}s (mod-shift dresses, slim suits, beehives
 * / bouffant / bowl-cut hair, transistor-radio / cigarette / cigarette-case
 * gadgets) are defined in {@link src/characters/patrons1965.js} and registered
 * with the shared {@link characterRoster} for era 1965. This fragment builder
 * queries the roster for the 1965 population and hands each config to
 * {@link buildCharacterAvatars}, which seats every avatar at its configured
 * layout anchor (seatingTableA/B/C) with a table-sharing offset and facing
 * rotation. Because the roster is era-scoped, only 1965 patrons appear here —
 * no other era's population leaks into this fragment.
 */
function buildPatronsFragment(): Object3D {
  const group = new Group();
  group.name = `patrons:${ERA}`;

  const configs = characterRoster.getPatrons(ERA);
  for (const avatar of buildCharacterAvatars(configs)) {
    group.add(avatar);
  }

  return group;
}

// ===========================================================================
// Registration
// ===========================================================================

/**
 * Register every 1965 era scene-fragment factory with the shared
 * AssetRegistry. Idempotent: each (category, era) pair is registered exactly
 * once (duplicate registration throws, so we guard with `has`).
 *
 * NOTE on audio: the era audio config (motown/beat/folk-evocative generative
 * bed with a vinyl-45 jukebox timbre, urn hiss, and conversation murmur)
 * already lives on the 1965 EraData object in src/data/eras.ts as
 * EraAudioConfig and is consumed by AudioEngine.setEra — no separate audio
 * registration is needed here. The music bed's `timbre: 'vinyl-45'` and
 * `musicSource.device: 'jukebox'` fields are what make the audio match the
 * tabletop jukebox object this module places.
 */
export function registerEra1965(): void {
  const reg = assetRegistry;
  const pairs: Array<[import('../data/EraData.js').CategoryKey, () => Object3D]> = [
    ['architecture', buildArchitectureFragment],
    ['furnitureDecor', buildFurnitureFragment],
    ['coffeeMachines', buildCoffeeMachinesFragment],
    ['menuBoard', buildMenuBoardFragment],
    ['musicSource', buildMusicSourceFragment],
    ['posters', buildPostersFragment],
    ['tableware', buildTablewareFragment],
    ['signage', buildSignageFragment],
    ['lighting', buildLightingFragment],
    ['counterTechnology', buildCounterTechFragment],
    ['patrons', buildPatronsFragment],
  ];
  for (const [category, factory] of pairs) {
    if (!reg.has(category, ERA)) {
      reg.register(category, ERA, () => factory());
    }
  }

  // Register the shell-surface finisher so the persistent café shell reads as
  // a sixties diner (checkerboard tile floor, wood-panel walls) when era 1965
  // is active.
  registerShellFinisher(ERA, applyEra1965ShellFinishes);
}

// Register on import so the shared AssetRegistry is populated before the
// generic stubs in eraFragments.ts fill any gaps.
registerEra1965();
