/**
 * SceneManager.ts — era-managed Three.js scene controller.
 *
 * Owns the single persistent root {@link Scene} plus one lazily-built
 * {@link Object3D} group per era. `setActiveEra(year)` is the stable entry
 * point consumed by the navigation/UI tasks: it mounts the selected era's
 * registered fragments (built from the shared {@link assetRegistry}) and
 * unmounts/disposes the previous era's heavy geometry so that, at rest, only
 * the active era's group lives in the scene graph.
 *
 * It also coordinates the lighting environment per era and exposes the
 * {@link SceneManagerHooks.onTransitionStart | onTransitionStart} /
 * {@link SceneManagerHooks.onTransitionEnd | onTransitionEnd} hooks that the
 * transition controller uses to run cross-fades, plus the camera + renderer
 * integration points ({@link SceneManager.camera}, {@link SceneManager.render},
 * {@link SceneManager.onResize}) that the main render loop drives.
 *
 * Lifecycle of an era switch (see {@link SceneManager.setActiveEra}):
 *   1. The target era's group is built (once) and mounted into the scene.
 *   2. The lighting rig is reconfigured for the target era.
 *   3. `onTransitionStart` fires with both the outgoing and incoming groups.
 *   4. If a transition controller is wired (i.e. an `onTransitionStart` hook
 *      is registered), the outgoing group stays mounted so the controller can
 *      cross-fade it against the incoming group; the controller MUST call
 *      {@link SceneManager.completeTransition} when the fade finishes so the
 *      outgoing group is unmounted and its resources disposed.
 *      If no controller is wired, the outgoing group is unmounted + disposed
 *      immediately (instant swap) and `onTransitionEnd` fires right away.
 */
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Object3D,
  PerspectiveCamera,
  Scene,
  type WebGLRenderer,
} from 'three';
import type { EraYear, LightingCategory } from '../data/EraData.js';
import { assetRegistry } from '../registry/AssetRegistry.js';
import { getEra, isEraYear } from '../data/eras.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Information passed to transition hooks when an era switch occurs. */
export interface EraTransitionInfo {
  /** The era being left, or `null` on the very first mount. */
  readonly fromYear: EraYear | null;
  /** The era being entered. */
  readonly toYear: EraYear;
  /**
   * The outgoing group that is still in the scene at transition start (so a
   * transition controller can cross-fade it out), or `null` on first mount.
   */
  readonly fromGroup: Object3D | null;
  /** The incoming group, already mounted in the scene. */
  readonly toGroup: Object3D;
}

/** Fired when an era switch begins (after the incoming group is mounted). */
export type TransitionStartHook = (info: EraTransitionInfo) => void;

/** Fired when an era switch is finalized (outgoing group removed/disposed). */
export type TransitionEndHook = (info: EraTransitionInfo) => void;

/**
 * Hooks consumed by the transition controller. When `onTransitionStart` is
 * registered the manager treats era switches as controller-driven cross-fades
 * (see {@link SceneManager.setActiveEra}); otherwise it performs instant swaps.
 */
export interface SceneManagerHooks {
  onTransitionStart?: TransitionStartHook;
  onTransitionEnd?: TransitionEndHook;
}

/** A reconfigurable per-era lighting environment. */
export interface EraLightingConfig {
  /** Scene background colour. */
  readonly background: number;
  /** Fill-all ambient light. */
  readonly ambient: { readonly color: number; readonly intensity: number };
  /** Sky/ground hemisphere light for natural gradient. */
  readonly hemisphere: {
    readonly sky: number;
    readonly ground: number;
    readonly intensity: number;
  };
  /** Primary key light (mimics the era's dominant fixture). */
  readonly key: { readonly color: number; readonly intensity: number };
  /** Secondary fill light (rim/colour bounce). */
  readonly fill: { readonly color: number; readonly intensity: number };
}

// ---------------------------------------------------------------------------
// Per-era lighting — derived from each era's LightingCategory direction.
// (eras.ts stores human-readable colour temperature; this maps it to concrete
//  Three.js light colours/intensities so the mood shifts visibly per period.)
// ---------------------------------------------------------------------------

const ERA_LIGHTING: Record<EraYear, EraLightingConfig> = {
  // 1945 — edison-bulb pendants, warm-and-dim, 2200K warm white.
  1945: {
    background: 0x1a1410,
    ambient: { color: 0xffb066, intensity: 0.45 },
    hemisphere: { sky: 0x4a3520, ground: 0x140e08, intensity: 0.3 },
    key: { color: 0xffa050, intensity: 1.1 },
    fill: { color: 0xff8c3a, intensity: 0.35 },
  },
  // 1965 — neon strips & sconces, vibrant-and-cool, 3000K cool white.
  1965: {
    background: 0x141820,
    ambient: { color: 0xbfd0ff, intensity: 0.55 },
    hemisphere: { sky: 0x303a55, ground: 0x0a0a14, intensity: 0.4 },
    key: { color: 0xffffff, intensity: 1.4 },
    fill: { color: 0xff4fb0, intensity: 0.5 },
  },
  // 1985 — halogen track & spotlights, bright-and-dramatic, 3200K neutral.
  1985: {
    background: 0x121418,
    ambient: { color: 0xfff0d0, intensity: 0.6 },
    hemisphere: { sky: 0x404858, ground: 0x0c0c10, intensity: 0.45 },
    key: { color: 0xfff2d6, intensity: 1.7 },
    fill: { color: 0xd0e0ff, intensity: 0.45 },
  },
  // 2005 — edison-filament pendants, cosy-and-warm, 2700K warm white.
  2005: {
    background: 0x181210,
    ambient: { color: 0xffcb8a, intensity: 0.5 },
    hemisphere: { sky: 0x403028, ground: 0x100a06, intensity: 0.35 },
    key: { color: 0xffd9a0, intensity: 1.25 },
    fill: { color: 0xffb070, intensity: 0.4 },
  },
  // 2025 — smart LED & sculptural, soft-and-layered, tunable 2700K–4000K.
  2025: {
    background: 0x14161a,
    ambient: { color: 0xeef2ff, intensity: 0.6 },
    hemisphere: { sky: 0x4a5060, ground: 0x101216, intensity: 0.5 },
    key: { color: 0xfff4e6, intensity: 1.3 },
    fill: { color: 0xcfe0ff, intensity: 0.45 },
  },
  // 2055 — adaptive bioluminescent & laser, dynamic-and-immersive, fully tunable.
  2055: {
    background: 0x0e1018,
    ambient: { color: 0x9affd0, intensity: 0.5 },
    hemisphere: { sky: 0x1a2a40, ground: 0x080610, intensity: 0.45 },
    key: { color: 0xb08bff, intensity: 1.2 },
    fill: { color: 0x5affc0, intensity: 0.6 },
  },
};

/** Optional constructor overrides for camera framing. */
export interface SceneManagerOptions {
  /** Horizontal field of view in degrees. Defaults to 50. */
  readonly fov?: number;
  /** Initial camera position. Defaults to (0, 2, 12). */
  readonly cameraPosition?: readonly [number, number, number];
  /** Point the camera looks at. Defaults to the origin (0, 0, 0). */
  readonly cameraTarget?: readonly [number, number, number];
  /** Transition hooks to wire immediately. */
  readonly hooks?: SceneManagerHooks;
}

// ---------------------------------------------------------------------------
// SceneManager
// ---------------------------------------------------------------------------

/**
 * Central era scene-graph lifecycle controller. Era content tasks only need to
 * register their fragments with the {@link assetRegistry}; this controller
 * handles mounting, unmounting, disposal, lighting, and the render integration.
 */
export class SceneManager {
  /** The persistent root scene shared by every era. */
  private readonly scene: Scene;

  /** The camera owned by the manager and used by the render loop. */
  private readonly camera: PerspectiveCamera;

  /** One lazily-built group per era, cached until disposed. */
  private readonly groups = new Map<EraYear, Object3D>();

  /** The currently active era, or `null` before the first mount. */
  private activeEra: EraYear | null = null;

  /** The currently mounted group, or `null` before the first mount. */
  private activeGroup: Object3D | null = null;

  /** A controller-driven transition awaiting {@link completeTransition}. */
  private pendingTransition: EraTransitionInfo | null = null;

  /** Registered transition hooks (may be updated via {@link setHooks}). */
  private hooks: SceneManagerHooks;

  // Persistent lighting rig — reconfigured per era, never re-created.
  private readonly ambientLight: AmbientLight;
  private readonly hemisphereLight: HemisphereLight;
  private readonly keyLight: DirectionalLight;
  private readonly fillLight: DirectionalLight;

  constructor(options: SceneManagerOptions = {}) {
    const {
      fov = 50,
      cameraPosition = [0, 2, 12],
      cameraTarget = [0, 0, 0],
      hooks = {},
    } = options;

    this.hooks = hooks;

    // --- Root scene + camera (renderer loop integration points) ------------
    this.scene = new Scene();
    this.scene.background = new Color(ERA_LIGHTING[1945].background);

    this.camera = new PerspectiveCamera(
      fov,
      typeof window !== 'undefined' && window.innerWidth
        ? window.innerWidth / window.innerHeight
        : 1,
      0.1,
      100,
    );
    this.camera.position.set(
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2],
    );
    this.camera.lookAt(cameraTarget[0], cameraTarget[1], cameraTarget[2]);

    // --- Persistent lighting rig -------------------------------------------
    this.ambientLight = new AmbientLight(0xffffff, 0.6);
    this.hemisphereLight = new HemisphereLight(0xffffff, 0x202020, 0.3);
    this.keyLight = new DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(5, 10, 7);
    this.fillLight = new DirectionalLight(0xffd9a0, 0.4);
    this.fillLight.position.set(-6, 4, -4);

    this.scene.add(
      this.ambientLight,
      this.hemisphereLight,
      this.keyLight,
      this.fillLight,
    );

    // Seed the rig with the default (1945) environment.
    this.applyEraLighting(1945);
  }

  // -------------------------------------------------------------------------
  // Read-only accessors (consumed by transition + UI tasks)
  // -------------------------------------------------------------------------

  /** The persistent root scene. Era groups are added/removed beneath it. */
  get rootScene(): Scene {
    return this.scene;
  }

  /** The camera the main render loop renders with. */
  get mainCamera(): PerspectiveCamera {
    return this.camera;
  }

  /** The currently active era year, or `null` before the first mount. */
  get currentEra(): EraYear | null {
    return this.activeEra;
  }

  /** The currently mounted era group, or `null` before the first mount. */
  get currentGroup(): Object3D | null {
    return this.activeGroup;
  }

  /** True when a controller-driven transition is awaiting finalization. */
  get isTransitioning(): boolean {
    return this.pendingTransition !== null;
  }

  /**
   * Returns (building + caching if necessary) the group for an era without
   * mounting it. Useful for the transition controller to pre-warm an era.
   */
  getEraGroup(year: EraYear): Object3D {
    this.assertEraYear(year);
    return this.buildEraGroup(year);
  }

  /** True when an era's group is currently present in the scene graph. */
  isEraMounted(year: EraYear): boolean {
    const group = this.groups.get(year);
    return !!group && group.parent === this.scene;
  }

  // -------------------------------------------------------------------------
  // Hook management
  // -------------------------------------------------------------------------

  /** Replace the transition hooks (transition controller wiring point). */
  setHooks(hooks: SceneManagerHooks): void {
    this.hooks = hooks;
  }

  // -------------------------------------------------------------------------
  // Core lifecycle
  // -------------------------------------------------------------------------

  /**
   * Switch the active era. This is the stable entry point consumed by the
   * navigation/UI tasks.
   *
   * Behaviour:
   * - Validates `year` against the six canonical eras (throws otherwise).
   * - No-op if `year` is already the active era.
   * - Builds (once) and mounts the target era's group.
   * - Reconfigures the lighting rig for the target era.
   * - Fires `onTransitionStart` with the outgoing + incoming groups.
   * - If a transition controller is wired (an `onTransitionStart` hook is
   *   registered) the outgoing group stays mounted for a cross-fade and the
   *   controller must call {@link completeTransition} to finalize. Otherwise
   *   the outgoing group is unmounted + disposed immediately (instant swap).
   * - Fires `onTransitionEnd` once the outgoing group has been removed.
   */
  setActiveEra(year: EraYear): void {
    this.assertEraYear(year);

    // Finalize any in-flight controller-driven transition first so we never
    // leak a half-faded outgoing group.
    this.finalizePendingTransition();

    if (year === this.activeEra) return; // no-op for the active era

    const fromYear = this.activeEra;
    const fromGroup = this.activeGroup;

    // Build + mount the incoming group.
    const toGroup = this.buildEraGroup(year);
    if (toGroup.parent !== this.scene) {
      this.scene.add(toGroup);
    }

    // Coordinate the lighting environment for the incoming era.
    this.applyEraLighting(year);

    // Track the new active era/group immediately so reads during a transition
    // reflect the target era.
    this.activeEra = year;
    this.activeGroup = toGroup;

    const info: EraTransitionInfo = {
      fromYear,
      toYear: year,
      fromGroup,
      toGroup,
    };

    this.hooks.onTransitionStart?.(info);

    if (fromGroup !== null) {
      // There is an outgoing group to retire.
      if (this.hooks.onTransitionStart) {
        // A transition controller owns the cross-fade; defer disposal until it
        // signals completion.
        this.pendingTransition = info;
      } else {
        // No controller wired — perform an instant swap.
        this.finalizeTransition(info);
      }
    } else {
      // First-ever mount: nothing to retire.
      this.hooks.onTransitionEnd?.(info);
    }
  }

  /**
   * Finalize the in-flight controller-driven transition: unmounts and disposes
   * the outgoing group and fires `onTransitionEnd`. Called by the transition
   * controller when its cross-fade completes. Safe to call when not
   * transitioning (it is a no-op then).
   */
  completeTransition(): void {
    if (!this.pendingTransition) return;
    this.finalizeTransition(this.pendingTransition);
  }

  // -------------------------------------------------------------------------
  // Camera + renderer loop integration points
  // -------------------------------------------------------------------------

  /**
   * Render a single frame. The main loop calls this each RAF tick:
   *
   * ```ts
   * function animate() {
   *   requestAnimationFrame(animate);
   *   sceneManager.render(renderer);
   * }
   * ```
   */
  render(renderer: WebGLRenderer): void {
    renderer.render(this.scene, this.camera);
  }

  /** Update the camera aspect + projection on viewport resize. */
  onResize(width: number, height: number): void {
    this.camera.aspect = width > 0 && height > 0 ? width / height : 1;
    this.camera.updateProjectionMatrix();
  }

  // -------------------------------------------------------------------------
  // Lighting
  // -------------------------------------------------------------------------

  /**
   * Reconfigure the lighting rig for an era. Public so the transition
   * controller can re-key lighting mid-cross-fade if desired.
   */
  applyEraLighting(year: EraYear): void {
    this.assertEraYear(year);
    const config = ERA_LIGHTING[year];

    this.scene.background = new Color(config.background);

    this.ambientLight.color.setHex(config.ambient.color);
    this.ambientLight.intensity = config.ambient.intensity;

    this.hemisphereLight.color.setHex(config.hemisphere.sky);
    this.hemisphereLight.groundColor.setHex(config.hemisphere.ground);
    this.hemisphereLight.intensity = config.hemisphere.intensity;

    this.keyLight.color.setHex(config.key.color);
    this.keyLight.intensity = config.key.intensity;

    this.fillLight.color.setHex(config.fill.color);
    this.fillLight.intensity = config.fill.intensity;
  }

  /** Look up the lighting configuration for an era (read-only). */
  getEraLighting(year: EraYear): EraLightingConfig {
    this.assertEraYear(year);
    return ERA_LIGHTING[year];
  }

  // -------------------------------------------------------------------------
  // Teardown
  // -------------------------------------------------------------------------

  /** Dispose every held group and release GPU resources. */
  dispose(): void {
    this.finalizePendingTransition();
    for (const year of [...this.groups.keys()]) {
      const group = this.groups.get(year);
      if (group) {
        if (group.parent) group.parent.remove(group);
        this.disposeObject3D(group);
      }
      this.groups.delete(year);
    }
    this.activeEra = null;
    this.activeGroup = null;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /** Build (and cache) the group of registered fragments for an era. */
  private buildEraGroup(year: EraYear): Object3D {
    const cached = this.groups.get(year);
    if (cached) return cached;

    const group = new Group();
    group.name = `era:${year}`;
    for (const fragment of assetRegistry.buildFragmentsForEra(year)) {
      group.add(fragment);
    }
    this.groups.set(year, group);
    return group;
  }

  /**
   * Finalize a specific transition: unmount + dispose the outgoing group,
   * clear the pending slot, and fire `onTransitionEnd`.
   */
  private finalizeTransition(info: EraTransitionInfo): void {
    const { fromGroup } = info;
    if (fromGroup) {
      if (fromGroup.parent) fromGroup.parent.remove(fromGroup);
      this.disposeObject3D(fromGroup);
      // Drop the cache entry so re-entering the era rebuilds fresh fragments.
      if (info.fromYear !== null) this.groups.delete(info.fromYear);
    }
    if (this.pendingTransition === info) this.pendingTransition = null;
    this.hooks.onTransitionEnd?.(info);
  }

  /** Finalize any in-flight controller-driven transition (leak safety). */
  private finalizePendingTransition(): void {
    if (this.pendingTransition) {
      this.finalizeTransition(this.pendingTransition);
    }
  }

  /** Throw if `year` is not one of the six canonical eras. */
  private assertEraYear(year: number): asserts year is EraYear {
    if (!isEraYear(year)) {
      throw new Error(
        `SceneManager: ${year} is not a valid era year ` +
          `(expected one of 1945, 1965, 1985, 2005, 2025, 2055).`,
      );
    }
  }

  /**
   * Recursively dispose the geometries and materials held by an object tree.
   * Lights and groups have neither and are safely skipped.
   */
  private disposeObject3D(object: Object3D): void {
    object.traverse((child) => {
      const node = child as unknown as DisposableRenderable;
      node.geometry?.dispose();
      const material = node.material;
      if (Array.isArray(material)) {
        for (const m of material) m.dispose();
      } else {
        material?.dispose();
      }
    });
  }

  /**
   * Log the descriptive lighting direction for an era (read from eras.ts) —
   * a convenience for debugging era mood without hardcoding strings here.
   */
  describeEraLighting(year: EraYear): LightingCategory {
    return getEra(year).lighting;
  }
}

/** Minimal shape used to safely dispose geometry/material on any Object3D. */
interface DisposableRenderable {
  geometry?: { dispose: () => void };
  material?: { dispose: () => void }[] | { dispose: () => void };
}

/**
 * Shared process-wide scene manager instance. Created lazily so importing this
 * module never constructs a Three.js scene during, e.g., the `check:eras`
 * Node gate (which never imports Three.js).
 */
let sharedManager: SceneManager | null = null;

/** Get (creating if necessary) the shared SceneManager instance. */
export function getSceneManager(options?: SceneManagerOptions): SceneManager {
  if (!sharedManager) sharedManager = new SceneManager(options);
  return sharedManager;
}

/** Reset the shared manager (primarily for tests). */
export function resetSceneManager(): void {
  sharedManager?.dispose();
  sharedManager = null;
}
