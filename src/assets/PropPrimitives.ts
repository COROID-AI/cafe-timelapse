/**
 * PropPrimitives.ts — reusable parametric meshes for the era-build toolkit.
 *
 * Exposes parametric builders for the reusable café props every era composes:
 * tables, chairs, cups/mugs, coffee-machine shells, picture frames, lamps, and
 * signage. Each builder takes an era year + a small options object and returns
 * a fresh `THREE.Object3D` (a `Group`) populated with child meshes whose
 * materials and textures come from the shared {@link MaterialFactory} and
 * {@link TextureFactory} — so the props automatically pick up the era's palette
 * and procedural surfaces.
 *
 * Era tasks **instance and configure** these builders; they never rebuild the
 * underlying primitives or re-derive materials. For example:
 *
 *   const table = buildTable({ year: 1985, width: 1.2, legStyle: 'tapered' });
 *   const cup   = buildCup({ year: 1985, kind: 'mug' });
 *
 * All geometry is generated from Three.js primitives — **no external model
 * files** are loaded, honouring the procedural-only constraint.
 */
import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { MaterialFactory, type MaterialRole } from './MaterialFactory.js';
import type { EraYear } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** Base options every prop builder accepts. */
export interface BasePropOptions {
  /** The era year — selects the palette/materials for the prop. */
  readonly year: EraYear;
  /** Override the default material role for the prop's primary surface. */
  readonly role?: MaterialRole;
}

// ---------------------------------------------------------------------------
// Small geometry helpers
// ---------------------------------------------------------------------------

/** Create a mesh and position it, returning it for optional further tuning. */
function part(
  geometry: BoxGeometry | CylinderGeometry | SphereGeometry | TorusGeometry |
    LatheGeometry | ConeGeometry | CapsuleGeometry | TubeGeometry | PlaneGeometry,
  material: Material,
  parent: Group,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** Rotate a mesh to look down an axis helper (degrees → radians). */
function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Attach a procedural texture as the diffuse map of a factory material. */
function applyMap(mat: Material, tex: Texture): void {
  (mat as unknown as { map: Texture | null }).map = tex;
  mat.needsUpdate = true;
}

// ===========================================================================
// 1. TABLES
// ===========================================================================

/** Table leg styles the {@link buildTable} builder supports. */
export type TableLegStyle = 'square' | 'tapered' | 'cabriole' | 'central';

/** Options for {@link buildTable}. */
export interface TableOptions extends BasePropOptions {
  /** Top width (X), in metres. Default 1.0. */
  readonly width?: number;
  /** Top depth (Z), in metres. Default 1.0. */
  readonly depth?: number;
  /** Overall table height, in metres. Default 0.75. */
  readonly height?: number;
  /** Top thickness, in metres. Default 0.05. */
  readonly topThickness?: number;
  /** Leg style. Default 'square'. */
  readonly legStyle?: TableLegStyle;
}

/**
 * Build a parametric table: a top slab plus four legs (or a central pedestal).
 * The surface uses the era's wood/ceramic material unless overridden.
 */
export function buildTable(options: TableOptions): Object3D {
  const {
    year,
    width = 1.0,
    depth = 1.0,
    height = 0.75,
    topThickness = 0.05,
    legStyle = 'square',
    role = 'wood',
  } = options;

  const group = new Group();
  group.name = `table:${year}`;

  const topMat = MaterialFactory.get(role, year);
  const legMat = MaterialFactory.get(role, year);

  // Top slab.
  const top = part(
    new BoxGeometry(width, topThickness, depth),
    topMat,
    group,
    0,
    height - topThickness / 2,
    0,
  );
  top.castShadow = true;
  top.receiveShadow = true;

  const legHeight = height - topThickness;
  const inset = 0.06;

  if (legStyle === 'central') {
    // Pedestal base: a central column + a cross foot.
    const col = part(
      new CylinderGeometry(0.06, 0.08, legHeight, 16),
      legMat,
      group,
      0,
      legHeight / 2,
      0,
    );
    col.castShadow = true;
    part(
      new BoxGeometry(width * 0.6, 0.06, 0.12),
      legMat,
      group,
      0,
      0.03,
      0,
    );
  } else {
    // Four corner legs.
    const halfW = width / 2 - inset;
    const halfD = depth / 2 - inset;
    const positions: Array<[number, number]> = [
      [halfW, halfD],
      [-halfW, halfD],
      [halfW, -halfD],
      [-halfW, -halfD],
    ];
    for (const [lx, lz] of positions) {
      let leg: Mesh;
      if (legStyle === 'tapered') {
        leg = part(
          new CylinderGeometry(0.025, 0.05, legHeight, 12),
          legMat,
          group,
          lx,
          legHeight / 2,
          lz,
        );
      } else if (legStyle === 'cabriole') {
        // Cabriole: stacked tapered segments approximating a curved leg.
        const segH = legHeight / 3;
        part(new CylinderGeometry(0.05, 0.04, segH, 12), legMat, group, lx, legHeight - segH / 2, lz).castShadow = true;
        part(new CylinderGeometry(0.04, 0.06, segH, 12), legMat, group, lx, legHeight - segH - segH / 2, lz);
        leg = part(new CylinderGeometry(0.06, 0.035, segH, 12), legMat, group, lx, segH / 2, lz);
      } else {
        // square
        leg = part(
          new BoxGeometry(0.07, legHeight, 0.07),
          legMat,
          group,
          lx,
          legHeight / 2,
          lz,
        );
      }
      leg.castShadow = true;
    }
  }

  return group;
}

// ===========================================================================
// 2. CHAIRS
// ===========================================================================

/** Options for {@link buildChair}. */
export interface ChairOptions extends BasePropOptions {
  /** Seat width (X), in metres. Default 0.45. */
  readonly width?: number;
  /** Seat depth (Z), in metres. Default 0.45. */
  readonly depth?: number;
  /** Seat height (from floor), in metres. Default 0.45. */
  readonly seatHeight?: number;
  /** Backrest height above the seat. Default 0.5. */
  readonly backHeight?: number;
  /** Upholstery role for the seat (e.g. 'fabric', 'leather'). */
  readonly upholstery?: MaterialRole;
}

/**
 * Build a parametric chair: a seat slab, a backrest, and four legs. The seat
 * can use an era upholstery material (vinyl/fabric/leather) while the frame
 * uses the era wood/metal.
 */
export function buildChair(options: ChairOptions): Object3D {
  const {
    year,
    width = 0.45,
    depth = 0.45,
    seatHeight = 0.45,
    backHeight = 0.5,
    role = 'wood',
    upholstery,
  } = options;

  const group = new Group();
  group.name = `chair:${year}`;

  const frameMat = MaterialFactory.get(role, year);
  const seatMat = upholstery
    ? MaterialFactory.get(upholstery, year)
    : frameMat;

  const seatThick = 0.04;

  // Seat slab.
  const seat = part(
    new BoxGeometry(width, seatThick, depth),
    seatMat,
    group,
    0,
    seatHeight,
    0,
  );
  seat.castShadow = true;

  // Backrest.
  const back = part(
    new BoxGeometry(width, backHeight, 0.03),
    frameMat,
    group,
    0,
    seatHeight + seatThick / 2 + backHeight / 2,
    -depth / 2 + 0.015,
  );
  back.castShadow = true;

  // Four legs.
  const legH = seatHeight - seatThick / 2;
  const halfW = width / 2 - 0.03;
  const halfD = depth / 2 - 0.03;
  const legPositions: Array<[number, number]> = [
    [halfW, halfD],
    [-halfW, halfD],
    [halfW, -halfD],
    [-halfW, -halfD],
  ];
  for (const [lx, lz] of legPositions) {
    const leg = part(
      new BoxGeometry(0.04, legH, 0.04),
      frameMat,
      group,
      lx,
      legH / 2,
      lz,
    );
    leg.castShadow = true;
  }

  return group;
}

// ===========================================================================
// 3. CUPS / MUGS
// ===========================================================================

/** Cup profiles the {@link buildCup} builder supports. */
export type CupKind = 'demitasse' | 'mug' | 'glass' | 'latte';

/** Options for {@link buildCup}. */
export interface CupOptions extends BasePropOptions {
  /** Cup profile. Default 'demitasse'. */
  readonly kind?: CupKind;
  /** Scale multiplier. Default 1.0. */
  readonly scale?: number;
}

/**
 * Build a parametric cup/mug by lathing a 2D profile around the Y axis. The
 * profile (radius vs height) is derived from the `kind`, and a torus handle is
 * attached for mug/demitasse kinds. Materials come from the era palette
 * (ceramic, glass).
 */
export function buildCup(options: CupOptions): Object3D {
  const { year, kind = 'demitasse', scale = 1.0 } = options;

  const group = new Group();
  group.name = `cup:${kind}:${year}`;
  group.scale.setScalar(scale);

  // Profile: [radius, height] points from base centre up and over the rim.
  let profile: Array<[number, number]>;
  let role: MaterialRole;
  let hasHandle: boolean;

  switch (kind) {
    case 'mug':
      profile = mugProfile();
      role = 'ceramic';
      hasHandle = true;
      break;
    case 'glass':
      profile = glassProfile();
      role = 'glass';
      hasHandle = false;
      break;
    case 'latte':
      profile = latteProfile();
      role = 'ceramic';
      hasHandle = true;
      break;
    case 'demitasse':
    default:
      profile = demitasseProfile();
      role = 'ceramic';
      hasHandle = true;
      break;
  }

  const cupMat = MaterialFactory.get(role, year);
  const points = profile.map(([x, y]) => new Vector2(x, y));
  const cup = part(new LatheGeometry(points, 32), cupMat, group, 0, 0, 0);
  cup.castShadow = true;

  if (hasHandle) {
    // Torus handle on the +X side.
    const handleMat = MaterialFactory.get(role, year);
    const top = profile[profile.length - 2]?.[1] ?? 0.06;
    const bottom = profile[0]?.[1] ?? 0;
    const handleY = (top + bottom) / 2;
    const outerR = profile[profile.length - 2]?.[0] ?? 0.04;
    const handle = part(
      new TorusGeometry(0.025, 0.006, 12, 24, Math.PI),
      handleMat,
      group,
      outerR + 0.018,
      handleY,
      0,
    );
    handle.rotation.z = rad(-90);
  }

  return group;
}

/** Demitasse (espresso cup) lathe profile. */
function demitasseProfile(): Array<[number, number]> {
  const r = 0.032;
  const h = 0.045;
  const wall = 0.006;
  return [
    [0, 0],
    [r, 0],
    [r * 1.05, h],
    [r * 0.9, h],
    [r * 0.9 - wall, h - wall],
    [wall, wall],
    [0, wall],
  ];
}

/** Mug lathe profile. */
function mugProfile(): Array<[number, number]> {
  const r = 0.045;
  const h = 0.1;
  const wall = 0.008;
  return [
    [0, 0],
    [r, 0],
    [r, h],
    [r - wall, h],
    [r - wall, wall],
    [wall, wall],
    [0, wall],
  ];
}

/** Latte glass/cup lathe profile (wider, taller). */
function latteProfile(): Array<[number, number]> {
  const r = 0.05;
  const h = 0.11;
  const wall = 0.006;
  return [
    [0, 0],
    [r * 0.8, 0],
    [r, h * 0.9],
    [r, h],
    [r - wall, h],
    [r * 0.8 - wall, h * 0.9 - wall],
    [wall, wall],
    [0, wall],
  ];
}

/** Double-walled glass lathe profile. */
function glassProfile(): Array<[number, number]> {
  const r = 0.04;
  const h = 0.09;
  const wall = 0.003;
  return [
    [0, 0],
    [r * 0.85, 0],
    [r, h],
    [r - wall, h],
    [r * 0.85 - wall, 0 + wall],
    [wall, wall],
    [0, wall],
  ];
}

// ===========================================================================
// 4. COFFEE-MACHINE SHELLS
// ===========================================================================

/** Machine body styles the {@link buildMachineShell} builder supports. */
export type MachineStyle = 'lever' | 'boxy' | 'sleek' | 'futuristic';

/** Options for {@link buildMachineShell}. */
export interface MachineOptions extends BasePropOptions {
  /** Overall body width (X). Default 0.6. */
  readonly width?: number;
  /** Overall body height. Default 0.7. */
  readonly height?: number;
  /** Overall body depth (Z). Default 0.5. */
  readonly depth?: number;
  /** Body style. Default 'boxy'. */
  readonly style?: MachineStyle;
  /** Body material role. Default 'metal'. */
  readonly role?: MaterialRole;
}

/**
 * Build a parametric coffee-machine shell: a main body, a group-head spout, a
 * steam wand, and feet. The body shape varies by `style` to evoke the era's
 * machine (chrome lever → boxy dual-boiler → sleek → futuristic). Materials
 * come from the era palette.
 */
export function buildMachineShell(options: MachineOptions): Object3D {
  const {
    year,
    width = 0.6,
    height = 0.7,
    depth = 0.5,
    style = 'boxy',
    role = 'metal',
  } = options;

  const group = new Group();
  group.name = `machine:${style}:${year}`;

  const bodyMat = MaterialFactory.get(role, year);
  const accentMat = MaterialFactory.get('chrome', year);

  // Main body — shape varies by style.
  if (style === 'lever') {
    // Rounded boiler body via lathe + a box base.
    const boiler = part(
      new LatheGeometry(
        makeBoilerProfile(width * 0.4, height * 0.55),
        32,
      ),
      bodyMat,
      group,
      0,
      height * 0.35,
      0,
    );
    boiler.castShadow = true;
    part(new BoxGeometry(width, height * 0.3, depth), bodyMat, group, 0, height * 0.12, 0);
    // Lever arm.
    part(new CylinderGeometry(0.012, 0.012, 0.25, 12), accentMat, group, width * 0.45, height * 0.55, 0).rotation.z = rad(90);
  } else if (style === 'futuristic') {
    // Smooth capsule body.
    const capsule = part(
      new CapsuleGeometry(width * 0.35, height * 0.45, 16, 32),
      bodyMat,
      group,
      0,
      height * 0.5,
      0,
    );
    capsule.rotation.z = rad(90);
    capsule.castShadow = true;
  } else {
    // Boxy / sleek: beveled box body.
    const body = part(
      new BoxGeometry(width, height * 0.8, depth),
      bodyMat,
      group,
      0,
      height * 0.4,
      0,
    );
    body.castShadow = true;
    // Top cap for sleek style.
    if (style === 'sleek') {
      part(new BoxGeometry(width * 1.02, 0.03, depth * 1.02), accentMat, group, 0, height * 0.82, 0);
    }
  }

  // Group head + spout (always present).
  part(new CylinderGeometry(0.03, 0.035, 0.08, 16), accentMat, group, 0, height * 0.25, depth * 0.45);
  part(new CylinderGeometry(0.012, 0.012, 0.06, 12), accentMat, group, 0, height * 0.18, depth * 0.5);

  // Steam wand.
  const wand = part(new CylinderGeometry(0.008, 0.008, 0.22, 10), accentMat, group, width * 0.42, height * 0.45, depth * 0.1);
  wand.rotation.x = rad(35);

  // Drip tray.
  part(new BoxGeometry(width * 0.95, 0.02, depth * 0.9), bodyMat, group, 0, height * 0.08, 0);

  // Feet.
  const feet: Array<[number, number]> = [
    [width * 0.4, depth * 0.4],
    [-width * 0.4, depth * 0.4],
    [width * 0.4, -depth * 0.4],
    [-width * 0.4, -depth * 0.4],
  ];
  for (const [fx, fz] of feet) {
    part(new CylinderGeometry(0.02, 0.025, 0.04, 12), accentMat, group, fx, 0.02, fz);
  }

  return group;
}

/** Boiler lathe profile (radius, height) for the lever-style machine. */
function makeBoilerProfile(maxR: number, h: number): Vector2[] {
  return [
    new Vector2(0, 0),
    new Vector2(maxR, 0),
    new Vector2(maxR, h * 0.8),
    new Vector2(maxR * 0.9, h),
    new Vector2(maxR * 0.7, h),
    new Vector2(maxR * 0.5, h * 0.6),
    new Vector2(0, h * 0.5),
  ];
}

// ===========================================================================
// 5. PICTURE FRAMES
// ===========================================================================

/** Options for {@link buildFrame}. */
export interface FrameOptions extends BasePropOptions {
  /** Frame outer width (X). Default 0.6. */
  readonly width?: number;
  /** Frame outer height. Default 0.8. */
  readonly height?: number;
  /** Moulding thickness (depth of the frame border). Default 0.06. */
  readonly moulding?: number;
  /** Poster title (drawn on the insert via TextureFactory). */
  readonly title?: string;
  /** Poster subtitle. */
  readonly subtitle?: string;
  /** Accent swatch index for the poster field. */
  readonly swatchIndex?: number;
  /** Frame material role. Default 'wood'. */
  readonly role?: MaterialRole;
}

/**
 * Build a parametric picture frame: four moulding rails around a poster insert.
 * The insert uses a procedural poster texture from {@link TextureFactory}; the
 * rails use the era wood/metal material.
 */
export function buildFrame(options: FrameOptions): Object3D {
  const {
    year,
    width = 0.6,
    height = 0.8,
    moulding = 0.06,
    role = 'wood',
    title,
    subtitle,
    swatchIndex,
  } = options;

  const group = new Group();
  group.name = `frame:${year}`;

  const frameMat = MaterialFactory.get(role, year);

  // Poster insert (a textured plane).
  const { TextureFactory } = frameImports();
  const posterTex = TextureFactory.get('poster', year, {
    title,
    subtitle,
    swatchIndex,
  });
  const insertMat = MaterialFactory.get('paper', year, { textured: false });
  // Override the insert material's map directly with the poster texture.
  applyMap(insertMat, posterTex);

  const innerW = width - moulding * 2;
  const innerH = height - moulding * 2;
  const insert = part(
    new PlaneGeometry(innerW, innerH),
    insertMat,
    group,
    0,
    0,
    -moulding * 0.4,
  );
  insert.castShadow = true;

  // Four rails.
  const m2 = moulding / 2;
  // Top & bottom
  part(new BoxGeometry(width, moulding, moulding * 0.5), frameMat, group, 0, height / 2 - m2, 0).castShadow = true;
  part(new BoxGeometry(width, moulding, moulding * 0.5), frameMat, group, 0, -height / 2 + m2, 0).castShadow = true;
  // Left & right
  part(new BoxGeometry(moulding, innerH, moulding * 0.5), frameMat, group, -width / 2 + m2, 0, 0).castShadow = true;
  part(new BoxGeometry(moulding, innerH, moulding * 0.5), frameMat, group, width / 2 - m2, 0, 0).castShadow = true;

  return group;
}

// ===========================================================================
// 6. LAMPS
// ===========================================================================

/** Lamp fixture styles the {@link buildLamp} builder supports. */
export type LampStyle = 'pendant' | 'sconce' | 'bulb' | 'strip';

/** Options for {@link buildLamp}. */
export interface LampOptions extends BasePropOptions {
  /** Fixture style. Default 'pendant'. */
  readonly style?: LampStyle;
  /** Shade radius. Default 0.12. */
  readonly radius?: number;
  /** Cord/stem length. Default 0.5. */
  readonly stemLength?: number;
  /** Whether to add a visible emissive bulb. Default true. */
  readonly withBulb?: boolean;
}

/**
 * Build a parametric lamp fixture: a shade (cone/lathe), an emissive bulb, and
 * a cord or stem. The bulb material uses the era light tint so the fixture
 * matches the era's colour temperature.
 */
export function buildLamp(options: LampOptions): Object3D {
  const { year, style = 'pendant', radius = 0.12, stemLength = 0.5, withBulb = true } = options;

  const group = new Group();
  group.name = `lamp:${style}:${year}`;

  const shadeMat = MaterialFactory.get('metal', year, { roughness: 0.3 });
  const { getEraPalette } = lampImports();
  const palette = getEraPalette(year);

  if (style === 'strip') {
    // Neon/LED strip — a thin emissive bar.
    const stripMat = MaterialFactory.get('neon', year);
    part(new BoxGeometry(0.6, 0.03, 0.03), stripMat, group, 0, 0, 0);
    return group;
  }

  // Shade — a cone (open-bottomed) for pendant/sconce.
  const shade = part(
    new ConeGeometry(radius, radius * 1.1, 24, 1, true),
    shadeMat,
    group,
    0,
    0,
    0,
  );
  shade.castShadow = true;

  if (style === 'sconce') {
    // Backplate.
    part(new BoxGeometry(radius * 1.6, radius * 2, 0.02), shadeMat, group, 0, 0, -radius * 0.5);
  } else {
    // Cord/stem for pendant & bare-bulb.
    const cordMat = MaterialFactory.get('metal', year, { color: 0x222222, roughness: 0.8 });
    part(new CylinderGeometry(0.005, 0.005, stemLength, 8), cordMat, group, 0, stemLength / 2 + radius * 0.3, 0);
  }

  if (withBulb) {
    // Emissive bulb using the era light tint.
    const bulbMat = MaterialFactory.get('neon', year, {
      color: palette.lightTint,
      emissive: palette.lightTint,
      emissiveIntensity: 1.2,
    });
    part(new SphereGeometry(radius * 0.35, 16, 16), bulbMat, group, 0, -radius * 0.15, 0);
  }

  return group;
}

// ===========================================================================
// 7. SIGNAGE
// ===========================================================================

/** Signage styles the {@link buildSignage} builder supports. */
export type SignageStyle = 'neon' | 'backlit' | 'hanging' | 'projected';

/** Options for {@link buildSignage}. */
export interface SignageOptions extends BasePropOptions {
  /** Sign width (X). Default 1.0. */
  readonly width?: number;
  /** Sign height. Default 0.3. */
  readonly height?: number;
  /** Signage style. Default 'backlit'. */
  readonly style?: SignageStyle;
  /** Neon tube radius. Default 0.015. */
  readonly tubeRadius?: number;
  /** Sign text (drawn on the panel / used as the neon arc label). */
  readonly text?: string;
}

/**
 * Build a parametric shop-sign / signage piece. Styles:
 *   - `neon` — a glowing neon-tube arc on a dark backing panel.
 *   - `backlit` — a translucent panel with a chalkboard/menu texture.
 *   - `hanging` — a wooden sandwich-board sign.
 *   - `projected` — a holographic-style emissive plane (2055).
 */
export function buildSignage(options: SignageOptions): Object3D {
  const {
    year,
    width = 1.0,
    height = 0.3,
    style = 'backlit',
    tubeRadius = 0.015,
    text,
  } = options;

  const group = new Group();
  group.name = `signage:${style}:${year}`;

  if (style === 'neon') {
    // Dark backing panel + glowing neon arc tube.
    const backMat = MaterialFactory.get('metal', year, { color: 0x141414, roughness: 0.9 });
    part(new BoxGeometry(width, height, 0.02), backMat, group, 0, 0, -tubeRadius).castShadow = true;

    // Neon arc via a tube along a CatmullRom curve.
    const neonMat = MaterialFactory.get('neon', year);
    const arc = buildNeonArc(width * 0.8, height * 0.6, tubeRadius);
    const tube = part(new TubeGeometry(arc, 64, tubeRadius, 12, false), neonMat, group, 0, 0, 0.01);
    tube.castShadow = false;
    return group;
  }

  if (style === 'hanging') {
    // Wooden sandwich board with two panels + a chalkboard face.
    const woodMat = MaterialFactory.get('wood', year);
    part(new BoxGeometry(width, height, 0.03), woodMat, group, 0, 0, 0).castShadow = true;
    const boardMat = MaterialFactory.get('chalkboard', year, { textured: false });
    const { TextureFactory } = frameImports();
    const cbTex = TextureFactory.get('chalkboard', year, {
      heading: text ?? 'OPEN',
      items: [],
    });
    applyMap(boardMat, cbTex);
    part(new PlaneGeometry(width * 0.9, height * 0.85), boardMat, group, 0, 0, 0.02);
    return group;
  }

  if (style === 'projected') {
    // Holographic emissive plane (2055).
    const projMat = MaterialFactory.get('neon', year, { emissiveIntensity: 0.8 });
    part(new PlaneGeometry(width, height), projMat, group, 0, 0, 0);
    return group;
  }

  // backlit (default): translucent panel with a menu/chalkboard texture.
  const panelMat = MaterialFactory.get('chalkboard', year, { textured: false });
  const { TextureFactory } = frameImports();
  const menuTex = TextureFactory.get('chalkboard', year, {
    heading: text ?? 'MENU',
    items: [],
  });
  applyMap(panelMat, menuTex);
  part(new PlaneGeometry(width, height), panelMat, group, 0, 0, 0);

  // Backlight glow behind the panel.
  const glowMat = MaterialFactory.get('neon', year, { emissiveIntensity: 0.4 });
  part(new PlaneGeometry(width * 1.05, height * 1.05), glowMat, group, 0, 0, -0.01);

  return group;
}

/**
 * Build a CatmullRom curve describing a neon arc (a stylized "swoop") used by
 * the neon signage style. Returns a curve suitable for {@link TubeGeometry}.
 */
function buildNeonArc(w: number, h: number, _r: number): CatmullRomCurve3 {
  const pts = [
    new Vector3(-w / 2, 0, 0),
    new Vector3(-w / 3, h / 2, 0),
    new Vector3(0, h, 0),
    new Vector3(w / 3, h / 2, 0),
    new Vector3(w / 2, 0, 0),
  ];
  return new CatmullRomCurve3(pts);
}

// ---------------------------------------------------------------------------
// Late imports — kept in tiny lazy accessors so the prop module can reference
// TextureFactory / getEraPalette without a circular import ordering hazard at
// module-eval time (these helpers are only used inside builder functions, which
// run after module init). This also keeps the top-of-file import list focused
// on geometry types.
// ---------------------------------------------------------------------------

import { TextureFactory as TextureFactoryValue } from './TextureFactory.js';
import { getEraPalette as getEraPaletteValue } from './EraPalette.js';

function frameImports(): { TextureFactory: typeof TextureFactoryValue } {
  return { TextureFactory: TextureFactoryValue };
}

function lampImports(): { getEraPalette: typeof getEraPaletteValue } {
  return { getEraPalette: getEraPaletteValue };
}

// ---------------------------------------------------------------------------
// Barrel export of every builder + the prop namespace object.
// ---------------------------------------------------------------------------

/** Namespace object grouping all builders for convenient import. */
export const PropPrimitives = {
  buildTable,
  buildChair,
  buildCup,
  buildMachineShell,
  buildFrame,
  buildLamp,
  buildSignage,
} as const;
