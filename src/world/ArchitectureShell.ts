/**
 * ArchitectureShell.ts — persistent (non-era) café interior geometry.
 *
 * Builds the unchanging room envelope: floor, ceiling, four walls (one of them
 * a storefront wall with a window + door), plus era *surface slots* that era
 * tasks populate with period-specific finishes. The shell itself is era-neutral
 * geometry only — no signage, no props, no lighting fixtures (those are added
 * by era groups and the ceiling {@link EraSurfaceSlots.lightMount | lightMount}
 * respectively). All dimensions and placement anchors come from
 * {@link ../layout.html | layout.ts}, the single spatial contract.
 *
 * Lifecycle: a single shell is owned by {@link SceneManager} and added to the
 * persistent root {@link Scene} once, where it survives era switches as a base
 * layer beneath the per-era groups. Era tasks never construct a shell.
 */
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Material,
} from 'three';
import { ROOM_DIMENSIONS } from './layout.js';

// ---------------------------------------------------------------------------
// Era surface slots — the contract era tasks populate
// ---------------------------------------------------------------------------

/**
 * Named wall slots an era task can re-finish. Each wall may be built from
 * several meshes (the storefront is a frame of pieces); era tasks swap the
 * material on every mesh in the slot's list via
 * {@link ArchitectureShell.applyWallMaterial}.
 */
export type WallSlotName = 'back' | 'left' | 'right' | 'storefront';

/** Ordered list of wall slot names (stable — era tasks reference by name). */
export const WALL_SLOT_NAMES: readonly WallSlotName[] = [
  'back',
  'left',
  'right',
  'storefront',
];

/**
 * The era-populatable surface slots. Era tasks receive this object (from
 * {@link ArchitectureShell.slots}) and swap materials / parent fixtures into
 * the defined holders. Slot names are stable for the project lifetime.
 */
export interface EraSurfaceSlots {
  /** Solid wall meshes per named wall slot (swap the wall finish here). */
  readonly walls: Readonly<Record<WallSlotName, readonly Mesh[]>>;
  /** Floor surface mesh (swap the floor finish here). */
  readonly floor: Mesh;
  /** Ceiling surface mesh (swap the ceiling finish here). */
  readonly ceiling: Mesh;
  /** Storefront glass panes (era tasks may tint, e.g. neon signage). */
  readonly storefrontGlass: readonly Mesh[];
  /**
   * Ceiling mount point. Era tasks parent their period light fixtures
   * (pendants, tracks, sconces) here so lights sit correctly in the shell.
   */
  readonly lightMount: Group;
}

// ---------------------------------------------------------------------------
// Era-neutral placeholder materials
// ---------------------------------------------------------------------------

// Neutral greys/wood so the room reads as a plain café before era finishes are
// applied. Era tasks replace these via the slot accessors.
const NEUTRAL_WALL = () => new MeshStandardMaterial({ color: 0xc9c9c9 });
const NEUTRAL_FLOOR = () => new MeshStandardMaterial({ color: 0x9a9a9a });
const NEUTRAL_CEILING = () => new MeshStandardMaterial({ color: 0xededed });
const NEUTRAL_DOOR = () => new MeshStandardMaterial({ color: 0x7a5230 });
const STOREFRONT_GLASS = () =>
  new MeshStandardMaterial({
    color: 0xaaccee,
    transparent: true,
    opacity: 0.28,
    roughness: 0.1,
    metalness: 0.0,
  });

// ---------------------------------------------------------------------------
// ArchitectureShell
// ---------------------------------------------------------------------------

/**
 * The persistent, era-neutral café room envelope. Owns its own root
 * {@link Group} (`'cafe-shell'`) which SceneManager mounts once into the root
 * scene as a base layer beneath the per-era groups.
 */
export class ArchitectureShell {
  /** Root group — add this to the scene once; it persists across era switches. */
  readonly root: Group;

  /** Solid wall meshes keyed by slot name. */
  private readonly wallMeshes: Record<WallSlotName, Mesh[]>;
  /** Floor surface mesh. */
  private readonly floorMesh: Mesh;
  /** Ceiling surface mesh. */
  private readonly ceilingMesh: Mesh;
  /** Storefront glass panes. */
  private readonly glassMeshes: Mesh[];
  /** The door panel mesh. */
  private readonly doorMesh: Mesh;
  /** Ceiling mount point for era light fixtures. */
  readonly lightMount: Group;

  /** Track every material we own so dispose() can free them. */
  private readonly ownedMaterials: MeshStandardMaterial[] = [];

  constructor() {
    const { width, height, depth } = ROOM_DIMENSIONS;
    const halfW = width / 2;
    const halfD = depth / 2;
    const wallT = 0.2; // wall thickness (metres)

    this.root = new Group();
    this.root.name = 'cafe-shell';

    // --- Floor + ceiling --------------------------------------------------
    this.floorMesh = this.addBox(
      new BoxGeometry(width, wallT, depth),
      NEUTRAL_FLOOR(),
      0,
      -wallT / 2,
      0,
      'shell:floor',
    );

    this.ceilingMesh = this.addBox(
      new BoxGeometry(width, wallT, depth),
      NEUTRAL_CEILING(),
      0,
      height + wallT / 2,
      0,
      'shell:ceiling',
    );

    // --- Solid back / left / right walls ----------------------------------
    this.wallMeshes = {
      back: [],
      left: [],
      right: [],
      storefront: [],
    };

    // Back wall along z = −depth/2 (counter + menu board live on it).
    this.wallMeshes.back.push(
      this.addBox(
        new BoxGeometry(width, height, wallT),
        NEUTRAL_WALL(),
        0,
        height / 2,
        -halfD,
        'shell:wall:back',
      ),
    );

    // Left wall along x = −width/2.
    this.wallMeshes.left.push(
      this.addBox(
        new BoxGeometry(wallT, height, depth),
        NEUTRAL_WALL(),
        -halfW,
        height / 2,
        0,
        'shell:wall:left',
      ),
    );

    // Right wall along x = +width/2.
    this.wallMeshes.right.push(
      this.addBox(
        new BoxGeometry(wallT, height, depth),
        NEUTRAL_WALL(),
        halfW,
        height / 2,
        0,
        'shell:wall:right',
      ),
    );

    // --- Storefront wall (z = +depth/2): window + door ---------------------
    // The storefront is a frame of solid pieces (sill, header) plus glass
    // panes (two side windows + a door transom) and a solid door panel. The
    // pieces abut so the envelope is fully closed.
    const sillTop = 1.0; // sill height
    const headerBottom = 3.2; // window/transom lintel
    const doorHalf = 0.8; // door half-width
    const doorTop = 2.3; // door height
    const glassZ = halfD;

    // Solid sill band (below the window, full width).
    this.wallMeshes.storefront.push(
      this.addBox(
        new BoxGeometry(width, sillTop, wallT),
        NEUTRAL_WALL(),
        0,
        sillTop / 2,
        glassZ,
        'shell:wall:storefront:sill',
      ),
    );

    // Solid header band (above the window/transom, full width).
    this.wallMeshes.storefront.push(
      this.addBox(
        new BoxGeometry(width, height - headerBottom, wallT),
        NEUTRAL_WALL(),
        0,
        (headerBottom + height) / 2,
        glassZ,
        'shell:wall:storefront:header',
      ),
    );

    this.glassMeshes = [];

    // Left storefront window pane (from the left wall up to the door).
    const leftGlassW = halfW - doorHalf; // x: −halfW .. −doorHalf
    this.glassMeshes.push(
      this.addBox(
        new BoxGeometry(leftGlassW, headerBottom - sillTop, 0.05),
        STOREFRONT_GLASS(),
        -(halfW + doorHalf) / 2,
        (sillTop + headerBottom) / 2,
        glassZ,
        'shell:glass:left',
      ),
    );

    // Right storefront window pane (from the door up to the right wall).
    this.glassMeshes.push(
      this.addBox(
        new BoxGeometry(leftGlassW, headerBottom - sillTop, 0.05),
        STOREFRONT_GLASS(),
        (halfW + doorHalf) / 2,
        (sillTop + headerBottom) / 2,
        glassZ,
        'shell:glass:right',
      ),
    );

    // Door transom (the glass band directly above the door, up to the header).
    this.glassMeshes.push(
      this.addBox(
        new BoxGeometry(doorHalf * 2, headerBottom - doorTop, 0.05),
        STOREFRONT_GLASS(),
        0,
        (doorTop + headerBottom) / 2,
        glassZ,
        'shell:glass:transom',
      ),
    );

    // Solid door panel, floor to doorTop.
    this.doorMesh = this.addBox(
      new BoxGeometry(doorHalf * 2, doorTop, wallT),
      NEUTRAL_DOOR(),
      0,
      doorTop / 2,
      glassZ,
      'shell:door',
    );

    // --- Ceiling light mount (era fixtures parent here) --------------------
    this.lightMount = new Group();
    this.lightMount.name = 'shell:lightMount';
    this.lightMount.position.set(0, height, 0);
    this.root.add(this.lightMount);
  }

  // -------------------------------------------------------------------------
  // Slot accessors (consumed by era tasks)
  // -------------------------------------------------------------------------

  /** The era-populatable surface slots (read-only view of the shell's parts). */
  get slots(): EraSurfaceSlots {
    return {
      walls: this.wallMeshes,
      floor: this.floorMesh,
      ceiling: this.ceilingMesh,
      storefrontGlass: this.glassMeshes,
      lightMount: this.lightMount,
    };
  }

  /**
   * The storefront door panel. Era tasks may re-finish or animate it (e.g.
   * period door hardware); by default it is a solid era-neutral panel.
   */
  get door(): Mesh {
    return this.doorMesh;
  }

  /** Swap the finish of every mesh in a named wall slot. */
  applyWallMaterial(slot: WallSlotName, material: Material): void {
    for (const mesh of this.wallMeshes[slot]) mesh.material = material;
  }

  /** Swap the floor finish. */
  applyFloorMaterial(material: Material): void {
    this.floorMesh.material = material;
  }

  /** Swap the ceiling finish. */
  applyCeilingMaterial(material: Material): void {
    this.ceilingMesh.material = material;
  }

  /** Swap the finish of every storefront glass pane. */
  applyGlassMaterial(material: Material): void {
    for (const mesh of this.glassMeshes) mesh.material = material;
  }

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------

  /** Dispose all owned geometries and materials. */
  dispose(): void {
    this.root.traverse((child) => {
      const node = child as unknown as {
        geometry?: { dispose: () => void };
      };
      node.geometry?.dispose();
    });
    for (const material of this.ownedMaterials) material.dispose();
    this.ownedMaterials.length = 0;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /**
   * Create a mesh, register its material for disposal, parent it to the root,
   * and return it. Keeps the constructor readable and guarantees every owned
   * material is tracked for {@link dispose}.
   */
  private addBox(
    geometry: BoxGeometry,
    material: MeshStandardMaterial,
    x: number,
    y: number,
    z: number,
    name: string,
  ): Mesh {
    this.ownedMaterials.push(material);
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    this.root.add(mesh);
    return mesh;
  }
}
