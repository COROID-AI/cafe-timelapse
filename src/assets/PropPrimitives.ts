/**
 * PropPrimitives — reusable parametric meshes for era tasks.
 *
 * Era fragments compose these primitives instead of hand-building every box
 * and cylinder. Each builder returns a `THREE.Group` rooted at the origin with
 * sensible local coordinates (a table top at y = tableTopY, a cup sitting on
 * the floor at y = 0, …), so callers translate/rotate/scale the returned group
 * to place it in the café.
 *
 * All geometry is procedural (`BoxGeometry`, `CylinderGeometry`,
 * `TorusGeometry`, …) — no external models.
 *
 * Included primitives (from the shared-asset brief): table legs, chairs, cups,
 * machine shells, frames, lamps, signage.
 */
import * as THREE from 'three';

export interface PrimitiveOptions {
  /** Root material applied to every mesh (children can override). */
  material?: THREE.Material | THREE.Material[];
  /** Name prefix for the group (defaults to the primitive name). */
  name?: string;
  /** Enable shadows on every mesh. Default false. */
  castShadow?: boolean;
  /** Receive shadows on every mesh. Default false. */
  receiveShadow?: boolean;
}

function applyOptions(group: THREE.Group, options: PrimitiveOptions, fallbackName: string): THREE.Group {
  group.name = options.name ?? fallbackName;
  if (options.castShadow || options.receiveShadow) {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (options.castShadow) mesh.castShadow = true;
      if (options.receiveShadow) mesh.receiveShadow = true;
    });
  }
  return group;
}

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  x: number,
  y: number,
  z: number,
  name: string,
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.name = name;
  return m;
}

// ---------------------------------------------------------------------------
// Table legs / frames
// ---------------------------------------------------------------------------

export interface TableLegOptions extends PrimitiveOptions {
  /** Leg height in world units. Default 0.72. */
  height?: number;
  /** Leg cross-section size (square legs). Default 0.05. */
  thickness?: number;
  /** Material for the legs. */
  material?: THREE.Material | THREE.Material[];
  /** Use a round turned leg (cylinder) instead of a square one. */
  round?: boolean;
  /** Feet / brass cap at the bottom of each leg. */
  foot?: boolean;
  /** Foot material (defaults to the leg material). */
  footMaterial?: THREE.Material | THREE.Material[];
}

/** One table leg, rooted at its base (y = 0). */
export function tableLeg(options: TableLegOptions = {}): THREE.Group {
  const height = options.height ?? 0.72;
  const thickness = options.thickness ?? 0.05;
  const legMaterial = options.material ?? new THREE.MeshStandardMaterial({ color: 0x4a3224, roughness: 0.6 });
  const footMaterial = options.footMaterial ?? legMaterial;
  const group = new THREE.Group();

  const legGeometry = options.round
    ? new THREE.CylinderGeometry(thickness * 0.5, thickness * 0.55, height, 12)
    : new THREE.BoxGeometry(thickness, height, thickness);
  group.add(mesh(legGeometry, legMaterial, 0, height / 2, 0, 'leg'));

  if (options.foot) {
    group.add(
      mesh(
        new THREE.CylinderGeometry(thickness * 0.72, thickness * 0.85, thickness * 0.4, 12),
        footMaterial,
        0,
        thickness * 0.2,
        0,
        'foot',
      ),
    );
  }
  return applyOptions(group, options, 'table-leg');
}

export interface TableFrameOptions extends PrimitiveOptions {
  /** Distance between the two long sides (table width). Default 1.2. */
  width?: number;
  /** Distance between the two short sides (table depth). Default 0.8. */
  depth?: number;
  /** Leg height. Default 0.72. */
  height?: number;
  /** Leg thickness. Default 0.05. */
  thickness?: number;
  /** Use round turned legs. Default false. */
  round?: boolean;
  /** Material for the legs/frame. */
  material?: THREE.Material | THREE.Material[];
  /** Add feet caps. Default false. */
  foot?: boolean;
}

/**
 * A four-leg table underframe: `legs[0]` is at the near-left corner when
 * viewed from +Z; legs are children of the returned group. Top of the legs is
 * at y = `height`.
 */
export function tableFrame(options: TableFrameOptions = {}): THREE.Group {
  const width = options.width ?? 1.2;
  const depth = options.depth ?? 0.8;
  const height = options.height ?? 0.72;
  const thickness = options.thickness ?? 0.05;
  const group = new THREE.Group();
  const halfW = width / 2 - thickness;
  const halfD = depth / 2 - thickness;

  const corners: Array<[number, number]> = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [-halfW, halfD],
    [halfW, halfD],
  ];
  for (const [x, z] of corners) {
    const leg = tableLeg({
      height,
      thickness: options.thickness,
      round: options.round,
      material: options.material,
      foot: options.foot,
    });
    leg.position.set(x, 0, z);
    group.add(leg);
  }
  return applyOptions(group, options, 'table-frame');
}

export interface TableTopOptions extends PrimitiveOptions {
  /** Table width. Default 1.2. */
  width?: number;
  /** Table depth. Default 0.8. */
  depth?: number;
  /** Top thickness. Default 0.05. */
  thickness?: number;
  /** Top height above origin (top surface at this y). Default 0.75. */
  topY?: number;
  /** Material for the top. */
  material?: THREE.Material | THREE.Material[];
}

/** A flat table top with its top surface at `topY`. */
export function tableTop(options: TableTopOptions = {}): THREE.Group {
  const width = options.width ?? 1.2;
  const depth = options.depth ?? 0.8;
  const thickness = options.thickness ?? 0.05;
  const topY = options.topY ?? 0.75;
  const group = new THREE.Group();
  group.add(
    mesh(
      new THREE.BoxGeometry(width, thickness, depth),
      options.material ?? new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.5 }),
      0,
      topY - thickness / 2,
      0,
      'top',
    ),
  );
  return applyOptions(group, options, 'table-top');
}

// ---------------------------------------------------------------------------
// Chairs
// ---------------------------------------------------------------------------

export interface ChairOptions extends PrimitiveOptions {
  /** Seat height above origin. Default 0.45. */
  seatY?: number;
  /** Overall chair scale. Default 1. */
  scale?: number;
  /** Leg height. Default 0.45. */
  legHeight?: number;
  /** Back height above the seat. Default 0.5. */
  backHeight?: number;
  /** Seat width. Default 0.42. */
  width?: number;
  /** Seat depth. Default 0.42. */
  depth?: number;
  /** Seat thickness. Default 0.04. */
  thickness?: number;
  /** Leg material. */
  material?: THREE.Material | THREE.Material[];
  /** Seat material (defaults to `material`). */
  seatMaterial?: THREE.Material | THREE.Material[];
  /** Back material (defaults to `material`). */
  backMaterial?: THREE.Material | THREE.Material[];
  /** Add an upholstered padded seat. Default false. */
  padded?: boolean;
}

/** A simple café chair, rooted at the floor (seat top at `seatY`). */
export function chair(options: ChairOptions = {}): THREE.Group {
  const seatY = options.seatY ?? 0.45;
  const thickness = options.thickness ?? 0.04;
  const legHeight = options.legHeight ?? seatY - thickness;
  const backHeight = options.backHeight ?? 0.5;
  const width = options.width ?? 0.42;
  const depth = options.depth ?? 0.42;
  const legMaterial = options.material ?? new THREE.MeshStandardMaterial({ color: 0x5a432e, roughness: 0.6 });
  const seatMaterial = options.seatMaterial ?? legMaterial;
  const backMaterial = options.backMaterial ?? legMaterial;
  const scale = options.scale ?? 1;

  const group = new THREE.Group();

  // Four legs.
  const legHalfW = width / 2 - 0.03;
  const legHalfD = depth / 2 - 0.03;
  for (const [x, z] of [
    [-legHalfW, -legHalfD],
    [legHalfW, -legHalfD],
    [-legHalfW, legHalfD],
    [legHalfW, legHalfD],
  ] as Array<[number, number]>) {
    group.add(mesh(new THREE.BoxGeometry(0.04, legHeight, 0.04), legMaterial, x, legHeight / 2, z, 'leg'));
  }

  // Seat.
  group.add(
    mesh(new THREE.BoxGeometry(width, thickness, depth), seatMaterial, 0, seatY - thickness / 2, 0, 'seat'),
  );
  if (options.padded) {
    group.add(
      mesh(new THREE.BoxGeometry(width - 0.04, thickness * 0.8, depth - 0.04), seatMaterial, 0, seatY - thickness * 0.4, 0, 'pad'),
    );
  }

  // Back: two uprights + slat.
  const backTop = seatY + backHeight;
  group.add(mesh(new THREE.BoxGeometry(0.035, backHeight, 0.035), backMaterial, -legHalfW, seatY + backHeight / 2, -legHalfD, 'back-upright'));
  group.add(mesh(new THREE.BoxGeometry(0.035, backHeight, 0.035), backMaterial, legHalfW, seatY + backHeight / 2, -legHalfD, 'back-upright'));
  group.add(
    mesh(new THREE.BoxGeometry(width - 0.02, 0.04, 0.03), backMaterial, 0, backTop - 0.04, -legHalfD, 'back-slat'),
  );

  group.scale.setScalar(scale);
  return applyOptions(group, options, 'chair');
}

// ---------------------------------------------------------------------------
// Cups
// ---------------------------------------------------------------------------

export interface CupOptions extends PrimitiveOptions {
  /** Cup height. Default 0.08. */
  height?: number;
  /** Radius at the rim. Default 0.035. */
  radius?: number;
  /** Radius at the base. Default 0.025. */
  baseRadius?: number;
  /** Wall thickness for glass cups. Default 0.004. */
  wall?: number;
  /** Material for the cup body. */
  material?: THREE.Material | THREE.Material[];
  /** Material for the saucer (optional; skip when null). */
  saucerMaterial?: THREE.Material | THREE.Material[] | null;
  /** Add a handle. Default false. */
  handle?: boolean;
  /** Handle material (defaults to the cup material). */
  handleMaterial?: THREE.Material | THREE.Material[];
  /** Cup is a glass/espresso cup with a visible wall. Default false. */
  glass?: boolean;
}

/** A coffee cup (optionally with saucer + handle), rooted at the base (y = 0). */
export function cup(options: CupOptions = {}): THREE.Group {
  const height = options.height ?? 0.08;
  const radius = options.radius ?? 0.035;
  const baseRadius = options.baseRadius ?? 0.025;
  const wall = options.wall ?? 0.004;
  const material = options.material ?? new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.3 });
  const handleMaterial = options.handleMaterial ?? material;
  const group = new THREE.Group();

  if (options.glass) {
    // Glass cups get a visible rim and wall via an open cylinder.
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(radius - wall, baseRadius - wall, height - wall * 2, 24, 1, true),
      material,
    );
    inner.position.y = height / 2;
    inner.name = 'glass-inner';
    group.add(inner);
  } else {
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, baseRadius, height, 24),
      material,
    );
    body.position.y = height / 2;
    body.name = 'cup-body';
    group.add(body);
  }

  if (options.handle) {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 0.55, radius * 0.16, 8, 16),
      handleMaterial,
    );
    torus.position.set(radius * 0.82, height * 0.55, 0);
    torus.rotation.y = Math.PI / 2;
    torus.name = 'handle';
    group.add(torus);
  }

  if (options.saucerMaterial) {
    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 2.1, radius * 1.6, 0.012, 24),
      options.saucerMaterial,
    );
    saucer.position.y = -0.008;
    saucer.name = 'saucer';
    group.add(saucer);
  }
  return applyOptions(group, options, 'cup');
}

// ---------------------------------------------------------------------------
// Machine shells
// ---------------------------------------------------------------------------

export interface MachineShellOptions extends PrimitiveOptions {
  /** Machine width. Default 0.6. */
  width?: number;
  /** Machine height. Default 0.5. */
  height?: number;
  /** Machine depth. Default 0.5. */
  depth?: number;
  /** Body material. */
  material?: THREE.Material | THREE.Material[];
  /** Accent (chrome/brass) material for details. */
  accentMaterial?: THREE.Material | THREE.Material[];
  /** Add a group head dome on top (lever machines). Default true. */
  groupHead?: boolean;
  /** Add a side lever arm. Default false. */
  lever?: boolean;
  /** Add a steam wand on the side. Default false. */
  steamWand?: boolean;
  /** Add a drip tray at the front base. Default true. */
  dripTray?: boolean;
}

/**
 * A coffee machine shell rooted at the floor: a main body, optional group head
 * dome, lever arm, steam wand, and drip tray. Callers place it on a counter.
 */
export function machineShell(options: MachineShellOptions = {}): THREE.Group {
  const width = options.width ?? 0.6;
  const height = options.height ?? 0.5;
  const depth = options.depth ?? 0.5;
  const material = options.material ?? new THREE.MeshStandardMaterial({ color: 0xb0b4b8, roughness: 0.4, metalness: 0.9 });
  const accent = options.accentMaterial ?? new THREE.MeshStandardMaterial({ color: 0xd6d9dc, roughness: 0.12, metalness: 1 });
  const group = new THREE.Group();

  group.add(mesh(new THREE.BoxGeometry(width, height, depth), material, 0, height / 2, 0, 'body'));

  if (options.groupHead) {
    group.add(
      mesh(
        new THREE.SphereGeometry(width * 0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        accent,
        0,
        height,
        0,
        'group-head',
      ),
    );
  }

  if (options.lever) {
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.012, 0.012, height * 0.55, 8),
        accent,
        width * 0.32,
        height * 0.72,
        -depth * 0.12,
        'lever',
      ),
    );
  }

  if (options.steamWand) {
    group.add(
      mesh(
        new THREE.CylinderGeometry(0.008, 0.008, height * 0.45, 8),
        accent,
        width * 0.3,
        height * 0.55,
        depth * 0.2,
        'steam-wand',
      ),
    );
  }

  if (options.dripTray) {
    group.add(
      mesh(
        new THREE.BoxGeometry(width * 0.8, 0.025, depth * 0.5),
        accent,
        0,
        0.015,
        depth * 0.22,
        'drip-tray',
      ),
    );
  }
  return applyOptions(group, options, 'machine-shell');
}

// ---------------------------------------------------------------------------
// Frames (posters, photos, menu boards)
// ---------------------------------------------------------------------------

export interface FrameOptions extends PrimitiveOptions {
  /** Frame outer width. Default 0.5. */
  width?: number;
  /** Frame outer height. Default 0.7. */
  height?: number;
  /** Frame thickness (depth). Default 0.03. */
  depth?: number;
  /** Frame rail width. Default 0.03. */
  rail?: number;
  /** Poster/board surface material (fills the frame). */
  panelMaterial?: THREE.Material | THREE.Material[];
  /** Frame material. */
  material?: THREE.Material | THREE.Material[];
  /** Backing panel sits at z = 0; frame is centred on z = 0. */
}

/**
 * A wall frame (poster / photo / menu board) with a panel and moulding rails.
 * Rooted at the panel centre; face points towards +Z.
 */
export function frame(options: FrameOptions = {}): THREE.Group {
  const width = options.width ?? 0.5;
  const height = options.height ?? 0.7;
  const depth = options.depth ?? 0.03;
  const rail = options.rail ?? 0.03;
  const material = options.material ?? new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.6 });
  const panelMaterial = options.panelMaterial ?? new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.85 });
  const group = new THREE.Group();

  group.add(mesh(new THREE.BoxGeometry(width, height, 0.008), panelMaterial, 0, 0, depth / 2 - 0.004, 'panel'));

  // Four moulding rails.
  group.add(mesh(new THREE.BoxGeometry(width, rail, depth), material, 0, height / 2 - rail / 2, 0, 'rail-top'));
  group.add(mesh(new THREE.BoxGeometry(width, rail, depth), material, 0, -height / 2 + rail / 2, 0, 'rail-bottom'));
  group.add(mesh(new THREE.BoxGeometry(rail, height, depth), material, width / 2 - rail / 2, 0, 0, 'rail-right'));
  group.add(mesh(new THREE.BoxGeometry(rail, height, depth), material, -width / 2 + rail / 2, 0, 0, 'rail-left'));

  return applyOptions(group, options, 'frame');
}

// ---------------------------------------------------------------------------
// Lamps
// ---------------------------------------------------------------------------

export interface LampOptions extends PrimitiveOptions {
  /** Ceiling/pendant height (arm length). Default 0.5. */
  height?: number;
  /** Shade radius. Default 0.14. */
  shadeRadius?: number;
  /** Shade height. Default 0.12. */
  shadeHeight?: number;
  /** Shade material. */
  shadeMaterial?: THREE.Material | THREE.Material[];
  /** Stem/arm material. */
  stemMaterial?: THREE.Material | THREE.Material[];
  /** Bulb emissive material (visible when `emissive` is true). */
  bulbMaterial?: THREE.Material | THREE.Material[];
  /** Show a glowing emissive bulb. Default true. */
  emissive?: boolean;
}

/**
 * A pendant lamp hanging from y = 0 (the ceiling anchor): a stem, an inverted
 * cone shade, and a glowing bulb. Position the group at the ceiling and it
 * hangs down.
 */
export function pendantLamp(options: LampOptions = {}): THREE.Group {
  const height = options.height ?? 0.5;
  const shadeRadius = options.shadeRadius ?? 0.14;
  const shadeHeight = options.shadeHeight ?? 0.12;
  const shadeMaterial = options.shadeMaterial ?? new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.7 });
  const stemMaterial = options.stemMaterial ?? new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.6 });
  const bulbMaterial = options.bulbMaterial ?? new THREE.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffc27a, emissiveIntensity: 2.4 });
  const group = new THREE.Group();

  group.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, height, 8), stemMaterial, 0, -height / 2, 0, 'stem'));

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(shadeRadius, shadeRadius * 0.35, shadeHeight, 24, 1, true),
    shadeMaterial,
  );
  shade.position.y = -height - shadeHeight / 2;
  shade.name = 'shade';
  group.add(shade);

  if (options.emissive ?? true) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(shadeRadius * 0.3, 12, 8), bulbMaterial);
    bulb.position.y = -height - shadeHeight * 0.45;
    bulb.name = 'bulb';
    group.add(bulb);
  }
  return applyOptions(group, options, 'pendant-lamp');
}

export interface WallLampOptions extends PrimitiveOptions {
  /** Arm length from the wall. Default 0.18. */
  arm?: number;
  /** Shade radius. Default 0.09. */
  shadeRadius?: number;
  /** Shade material. */
  shadeMaterial?: THREE.Material | THREE.Material[];
  /** Bulb material. */
  bulbMaterial?: THREE.Material | THREE.Material[];
}

/**
 * A small sconce/wall lamp. Mount point at the group origin (against the
 * wall); the arm and shade extend towards +Z.
 */
export function wallLamp(options: WallLampOptions = {}): THREE.Group {
  const arm = options.arm ?? 0.18;
  const shadeRadius = options.shadeRadius ?? 0.09;
  const shadeMaterial = options.shadeMaterial ?? new THREE.MeshStandardMaterial({ color: 0x4a3224, roughness: 0.6 });
  const bulbMaterial = options.bulbMaterial ?? new THREE.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffc27a, emissiveIntensity: 2.2 });
  const group = new THREE.Group();

  group.add(mesh(new THREE.BoxGeometry(0.02, 0.05, arm), shadeMaterial, 0, 0, arm / 2, 'arm'));
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(shadeRadius, shadeRadius * 0.9, 16, 1, true),
    shadeMaterial,
  );
  shade.position.z = arm;
  shade.rotation.x = Math.PI / 2;
  shade.name = 'shade';
  group.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(shadeRadius * 0.35, 10, 8), bulbMaterial);
  bulb.position.z = arm;
  bulb.name = 'bulb';
  group.add(bulb);

  return applyOptions(group, options, 'wall-lamp');
}

// ---------------------------------------------------------------------------
// Signage
// ---------------------------------------------------------------------------

export interface SignageOptions extends PrimitiveOptions {
  /** Sign width. Default 1.2. */
  width?: number;
  /** Sign height. Default 0.3. */
  height?: number;
  /** Sign thickness. Default 0.06. */
  depth?: number;
  /** Sign board material (the face). */
  faceMaterial?: THREE.Material | THREE.Material[];
  /** Frame/housing material. */
  frameMaterial?: THREE.Material | THREE.Material[];
  /** Emissive neon tube material (added when `neon` is true). */
  neonMaterial?: THREE.Material | THREE.Material[];
  /** Render a glowing neon bar across the sign. Default false. */
  neon?: boolean;
}

/**
 * A wall/over-door sign: a boxed board with optional neon tube. Rooted at the
 * board centre, face towards +Z.
 */
export function signage(options: SignageOptions = {}): THREE.Group {
  const width = options.width ?? 1.2;
  const height = options.height ?? 0.3;
  const depth = options.depth ?? 0.06;
  const faceMaterial = options.faceMaterial ?? new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.6 });
  const frameMaterial = options.frameMaterial ?? new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.6 });
  const group = new THREE.Group();

  group.add(mesh(new THREE.BoxGeometry(width, height, depth * 0.5), frameMaterial, 0, 0, depth * 0.25, 'housing'));
  group.add(mesh(new THREE.BoxGeometry(width * 0.92, height * 0.7, 0.012), faceMaterial, 0, 0, depth * 0.5 + 0.006, 'face'));

  if (options.neon) {
    const neonMaterial = options.neonMaterial ?? new THREE.MeshStandardMaterial({
      color: 0xff5ac8,
      emissive: 0xff5ac8,
      emissiveIntensity: 2.6,
    });
    // A tube bar with a rounded core.
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, width * 0.62, 10), neonMaterial);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, 0, depth * 0.5 + 0.03);
    tube.name = 'neon-tube';
    group.add(tube);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), neonMaterial);
    glow.position.set(-width * 0.31, 0, depth * 0.5 + 0.03);
    glow.name = 'neon-cap';
    group.add(glow);
    const glow2 = glow.clone();
    glow2.position.x = width * 0.31;
    glow2.name = 'neon-cap';
    group.add(glow2);
  }
  return applyOptions(group, options, 'signage');
}

/** The default primitives export for era tasks. */
export const PropPrimitives = {
  tableLeg,
  tableFrame,
  tableTop,
  chair,
  cup,
  machineShell,
  frame,
  pendantLamp,
  wallLamp,
  signage,
};
