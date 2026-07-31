import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ERAS, type EraYear } from '../data/eras';
import {
  getEraRegistration,
  getRegisteredEraYears,
} from '../registry/AssetRegistry';
import {
  ERA_LIGHTING,
  type EraLightingConfig,
} from './lighting';
import {
  buildArchitectureShell,
  type SurfaceSlots,
} from '../world/ArchitectureShell';

/**
 * SceneManager — the era-managed scene controller.
 *
 * Owns the persistent Three.js Scene, camera, renderer and animation loop.
 * Every era's registered fragments are built into a dedicated per-era
 * `THREE.Group`; `setActiveEra` mounts the target era's group and disposes
 * the previously mounted era's heavy GPU resources (geometries, materials,
 * textures).
 *
 * Responsibilities:
 *  - persistent scene + per-era fragment groups (mount / unmount / dispose)
 *  - `setActiveEra(year)` used by the timeline UI / transition controller
 *  - transition hooks (`onBeforeTransition`, `onAfterTransition`) so the
 *    cross-fade controller can run both eras during a fade
 *  - per-era lighting environment (see src/systems/lighting.ts)
 *  - camera + renderer loop integration (`render`, `resize`, `update`)
 *
 * The class is intentionally UI-agnostic: no DOM querying or timeline
 * wiring lives here. Timelines, buttons and transition fades drive it through
 * the public surface.
 */
export interface SceneManagerOptions {
  /** DOM element the WebGL renderer canvas is appended to. */
  container: HTMLElement;
  /** Initial era to mount after construction (defaults to ERAS[0]). */
  initialEra?: EraYear;
  /** Vertical clearance (metres) kept above furniture inside the room. */
  headroom?: number;
  /** Disable the persistent architecture shell layer when no registration exists. */
  disableFallback?: boolean;
  /**
   * When true the manager does not mount/unmount era groups itself. The app
   * hands group mounting to the TransitionController (through a SceneHost) so
   * `setActiveEra` only runs the transition hooks and per-era lighting; this
   * keeps the manager and the controller from mounting duplicate era groups.
   */
  externalEraMounting?: boolean;
}

export interface SceneManagerHandle {
  /** The persistent Three.js scene. */
  readonly scene: THREE.Scene;
  /** The perspective camera. */
  readonly camera: THREE.PerspectiveCamera;
  /** The WebGL renderer. */
  readonly renderer: THREE.WebGLRenderer;
  /** The OrbitControls instance bound to the renderer's canvas. */
  readonly controls: OrbitControls;
  /** The group containing all currently mounted era fragments. */
  readonly activeEraGroup: THREE.Object3D;
  /** The currently mounted era year (undefined before first mount). */
  readonly activeEra: EraYear | undefined;
  /** Timeline snap positions for each era, derived from the canonical ERAS. */
  readonly eraSteps: readonly EraYear[];
  /** Timeline slider positions (0..1) matching `eraSteps`. */
  readonly timelineSteps: readonly number[];
  /**
   * Mount the era fragments registered for `era`, unmounting and disposing
   * the previous era's group. Runs the transition hooks around the swap.
   */
  setActiveEra(era: EraYear): void;
  /**
   * Transition hook: called immediately before the era swap, while the
   * outgoing era is still mounted (used to start a cross-fade).
   */
  onBeforeTransition(cb: (next: EraYear, previous: EraYear | undefined) => void): void;
  /**
   * Transition hook: called immediately after the era swap (used to end a
   * cross-fade and reveal the newly mounted era).
   */
  onAfterTransition(cb: (era: EraYear) => void): void;
  /** Advance the render loop by one frame (drives controls + lights). */
  update(delta?: number): void;
  /** Render one frame to the renderer. */
  render(): void;
  /** Resize the camera and renderer for a new viewport size. */
  resize(width?: number, height?: number): void;
  /** Update the era to the nearest timeline step for a slider position. */
  snapToTimeline(value: number): void;
  /**
   * Release all Three.js resources: dispose every era group's geometries,
   * materials and textures, then dispose the renderer.
   */
  dispose(): void;
}

/**
 * Mount the persistent (non-era) café architecture shell directly into
 * `scene`. The shell group becomes a direct child of the scene — a persistent
 * layer beneath the per-era groups that are added/removed on era switches.
 *
 * Pure object-graph work (no WebGL required), so the QA gate can verify the
 * integration headlessly.
 */
export function mountArchitectureShell(scene: THREE.Scene): {
  shell: THREE.Group;
  slots: SurfaceSlots;
} {
  const built = buildArchitectureShell(scene);
  return { shell: built.group, slots: built.slots };
}

/**
 * Dispose the persistent shell's geometries and its own placeholder materials.
 * Era-populated slot materials are owned by the era groups and are disposed
 * when those groups are disposed, so only the shell's own resources are
 * released here.
 */
function disposeShellLayer(shell: THREE.Group, slots: SurfaceSlots): void {
  shell.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry?.dispose();
  });
  slots.dispose();
}

/** Dispose every heavy resource (geometry, material, texture) in a group. */
function disposeGroupDeep(group: THREE.Object3D): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) {
            value.dispose();
          }
        }
        material.dispose();
      }
    }
  });
}

/**
 * Build a fresh fragment group for one era from its AssetRegistry
 * registration. Pure object-graph work (no WebGL required), so the QA gate
 * can mount every era's fragments headlessly.
 *
 * Returns a group with one child per registered fragment; the child names are
 * `<era>-<category>` so tooling can assert category coverage.
 */
export function buildEraFragmentGroup(era: EraYear): THREE.Group {
  const group = new THREE.Group();
  group.name = `era-${era}`;
  const registration = getEraRegistration(era);
  if (registration) {
    for (const fragment of registration.fragments) {
      const fragmentGroup = new THREE.Group();
      fragmentGroup.name = `${era}-${fragment.category}`;
      fragment.build(fragmentGroup, era);
      group.add(fragmentGroup);
    }
  }
  return group;
}

export function createSceneManager(options: SceneManagerOptions): SceneManagerHandle {
  const {
    container,
    initialEra = ERAS[0],
    headroom = 1.6,
    disableFallback = false,
    externalEraMounting = false,
  } = options;

  // --- Persistent scene, camera, renderer --------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17171c);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight || 1,
    0.1,
    100,
  );
  camera.position.set(8, 6, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  // headroom = vertical clearance kept above furniture; the orbit target sits
  // at that height above the floor so framing stays inside the room.
  controls.target.set(0, headroom, 0);
  // Collision-free interior bounds: keep the camera inside the room so
  // orbit/pan/zoom can never leave the café or clip through the floor.
  controls.minDistance = 1.5;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.maxAzimuthAngle = Math.PI / 3;
  controls.minAzimuthAngle = -Math.PI / 3;
  controls.update();

  // --- Per-era groups ------------------------------------------------------
  let currentEra: EraYear | undefined;
  let currentGroup: THREE.Group | undefined;
  let transitionStart: ((next: EraYear, previous: EraYear | undefined) => void) | undefined;
  let transitionEnd: ((era: EraYear) => void) | undefined;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  const keyLight = new THREE.DirectionalLight(0xfff2df, 2.2);
  keyLight.position.set(6, 10, 6);
  keyLight.castShadow = true;
  scene.add(ambientLight, keyLight);

  // --- Persistent architecture shell (non-era layer) ------------------------
  // The café room shell is mounted once, beneath every per-era group. Era
  // groups are added/removed on era switches; the shell persists for the app
  // lifetime and era tasks dress it through its surface slots.
  let shell: THREE.Group | undefined;
  let shellSlots: SurfaceSlots | undefined;
  if (!disableFallback) {
    const mounted = mountArchitectureShell(scene);
    shell = mounted.shell;
    shellSlots = mounted.slots;
  }

  // --- Per-era lighting lights ---------------------------------------------
  const fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.25);
  fillLight.position.set(-6, 4, -4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0);
  rimLight.position.set(6, 6, -6);
  scene.add(rimLight);

  // --- Era helpers ----------------------------------------------------------
  function unmountEra(): void {
    if (currentGroup) {
      scene.remove(currentGroup);
      currentGroup.visible = false;
      // Release the outgoing era's heavy GPU resources (geometries,
      // materials, textures) so only the mounted era holds them.
      disposeGroupDeep(currentGroup);
    }
  }

  function mountEra(era: EraYear): void {
    const group = buildEraFragmentGroup(era);
    group.visible = true;
    scene.add(group);
    currentGroup = group;
  }

  function applyLighting(config: EraLightingConfig): void {
    scene.background = new THREE.Color(config.background);
    if (config.fog) {
      scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
    } else {
      scene.fog = null;
    }

    ambientLight.color.setHex(config.ambient.color);
    ambientLight.intensity = config.ambient.intensity;

    keyLight.color.setHex(config.key.color);
    keyLight.intensity = config.key.intensity;
    keyLight.position.set(...config.key.position);

    fillLight.color.setHex(config.fill.color);
    fillLight.intensity = config.fill.intensity;
    fillLight.position.set(...config.fill.position);

    if (config.rim) {
      rimLight.color.setHex(config.rim.color);
      rimLight.intensity = config.rim.intensity;
      rimLight.position.set(...config.rim.position);
      rimLight.visible = true;
    } else {
      rimLight.visible = false;
    }
  }

  // --- Public surface -------------------------------------------------------
  const eraSteps: readonly EraYear[] = [...ERAS];
  const timelineSteps: readonly number[] = eraSteps.map(
    (_, index) => (eraSteps.length <= 1 ? 0 : index / (eraSteps.length - 1)),
  );

  let handle: SceneManagerHandle;

  handle = {
    scene,
    camera,
    renderer,
    controls,
    get activeEraGroup(): THREE.Object3D {
      return currentGroup ?? scene;
    },
    get activeEra(): EraYear | undefined {
      return currentEra;
    },
    eraSteps,
    timelineSteps,
    setActiveEra(era: EraYear): void {
      // Skip only when the era is already mounted AND its group was built from
      // a real registration. An empty group means the era was mounted before
      // `registerAllEras()` finished (async at app startup), so rebuild it now
      // that its fragments are available.
      if (era === currentEra && currentGroup && currentGroup.children.length > 0) {
        return;
      }
      const previous = currentEra;
      transitionStart?.(era, previous);
      if (!externalEraMounting) {
        unmountEra();
      }
      currentEra = era;
      if (!externalEraMounting) {
        mountEra(era);
      }
      applyLighting(ERA_LIGHTING[era]);
      transitionEnd?.(era);
    },
    onBeforeTransition(cb): void {
      transitionStart = cb;
    },
    onAfterTransition(cb): void {
      transitionEnd = cb;
    },
    update(delta = 0.016): void {
      controls.update();
      // 2055 bioluminescent pulse: subtle ambient intensity breathing.
      const config = currentEra ? ERA_LIGHTING[currentEra] : undefined;
      if (config?.rim?.pulse) {
        rimLight.intensity =
          config.rim.intensity * (0.75 + 0.25 * Math.sin(delta * 2.2));
      }
    },
    render(): void {
      renderer.render(scene, camera);
    },
    resize(width = container.clientWidth, height = container.clientHeight): void {
      const w = width || 1;
      const h = height || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    snapToTimeline(value: number): void {
      const clamped = Math.min(1, Math.max(0, value));
      let nearest = 0;
      let nearestDistance = Infinity;
      for (let i = 0; i < timelineSteps.length; i += 1) {
        const distance = Math.abs(timelineSteps[i] - clamped);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = i;
        }
      }
      handle.setActiveEra(eraSteps[nearest]);
    },
    dispose(): void {
      if (currentGroup) {
        disposeGroupDeep(currentGroup);
      }
      // The shell layer is persistent and separate from the era groups, so it
      // is disposed explicitly (its geometry + own placeholder materials).
      if (shell && shellSlots) {
        disposeShellLayer(shell, shellSlots);
      }
      scene.clear();
      controls.dispose();
      renderer.dispose();
    },
  };

  // --- Initial mount ---------------------------------------------------------
  handle.setActiveEra(initialEra);

  return handle;
}

/**
 * Convenience snapshot of the SceneManager's mounted state, used by the QA
 * gate (`npm run check:scene`) to verify mount/unmount behaviour.
 */
export function describeSceneManager(handle: SceneManagerHandle): {
  activeEra: EraYear | undefined;
  mountedEraChildren: number;
  registeredEras: EraYear[];
  eraSteps: readonly EraYear[];
} {
  return {
    activeEra: handle.activeEra,
    mountedEraChildren: handle.activeEraGroup.children.length,
    registeredEras: getRegisteredEraYears(),
    eraSteps: handle.eraSteps,
  };
}

/**
 * Class-based wrapper around {@link createSceneManager}. Useful for test
 * suites and frameworks that prefer `new SceneManager(...)` over the factory;
 * behaviour is identical to the handle it wraps.
 */
export class SceneManager {
  readonly handle: SceneManagerHandle;

  constructor(options: SceneManagerOptions) {
    this.handle = createSceneManager(options);
  }

  get scene(): THREE.Scene {
    return this.handle.scene;
  }
  get camera(): THREE.PerspectiveCamera {
    return this.handle.camera;
  }
  get renderer(): THREE.WebGLRenderer {
    return this.handle.renderer;
  }
  get controls(): OrbitControls {
    return this.handle.controls;
  }
  get activeEraGroup(): THREE.Object3D {
    return this.handle.activeEraGroup;
  }
  get activeEra(): EraYear | undefined {
    return this.handle.activeEra;
  }
  get eraSteps(): readonly EraYear[] {
    return this.handle.eraSteps;
  }
  get timelineSteps(): readonly number[] {
    return this.handle.timelineSteps;
  }

  setActiveEra(era: EraYear): void {
    this.handle.setActiveEra(era);
  }
  onBeforeTransition(cb: (next: EraYear, previous: EraYear | undefined) => void): void {
    this.handle.onBeforeTransition(cb);
  }
  onAfterTransition(cb: (era: EraYear) => void): void {
    this.handle.onAfterTransition(cb);
  }
  update(delta?: number): void {
    this.handle.update(delta);
  }
  render(): void {
    this.handle.render();
  }
  resize(width?: number, height?: number): void {
    this.handle.resize(width, height);
  }
  snapToTimeline(value: number): void {
    this.handle.snapToTimeline(value);
  }
  dispose(): void {
    this.handle.dispose();
  }
}
