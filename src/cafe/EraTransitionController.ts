import * as THREE from 'three';
import { PROP_GROUP_KEYS } from './types';
import type { CafeScene } from './CafeScene';
import type { EraConfig, EraYear, PropGroupKey } from './types';

/**
 * EraTransitionController — animates the swap between two {@link EraConfig}s.
 *
 * The café "transforms in front of your eyes": instead of the hard cut performed
 * by `CafeScene.applyEra`, this controller plays a ~1.2s morph driven by the
 * shared render-loop clock delta.
 *
 * ## How a morph is staged
 *
 * Every transition is one continuous timeline `t ∈ [0, 1]` with a commit point
 * at the halfway mark:
 *
 * - `t ∈ [0, 0.5)` — outgoing phase: fading/scaling groups wind down towards
 *   invisibility while the scene-wide lighting rig, fog and tone-mapping
 *   exposure interpolate from their live values towards the target era's mood.
 * - `t = 0.5` — commit: `CafeScene.applyEra(targetYear)` routes the new
 *   {@link EraConfig} through every registered prop-group updater (including
 *   `instantSwap` groups, which hard-cut here). Bookkeeping such as
 *   `currentEra`/`previousYear` becomes correct from this moment on.
 * - `t ∈ (0.5, 1]` — incoming phase: groups wind back up to full presence and
 *   the mood interpolation completes. Because the mood lerp keeps writing the
 *   lights every frame, the instantaneous mood application inside `applyEra`
 *   is never visible.
 *
 * ## Strategies (per prop group)
 *
 * - `crossfade` — material opacity dips to 0 and back (`transparent` is enabled
 *   for the duration; original flags are restored afterwards).
 * - `scalePop` — the registered group scales down with a small anticipation
 *   swell, then springs back up with a slight overshoot, relative to the
 *   group's authored base scale.
 * - `instantSwap` — no animation; the group's updater swaps it at the commit
 *   point. Intended for small props where a fade would read as noise.
 *
 * Only groups obtained through `CafeScene`'s registry API are touched — the
 * controller never manipulates scene graphs outside the registry.
 *
 * ## Retargeting mid-flight
 *
 * Calling {@link transitionTo} while a morph is playing cancels the current
 * animation and starts the new target *from the exact visual state on screen*
 * (live light values, current per-group scale/opacity factors). Nothing snaps:
 * - interrupted before the commit point → content was never swapped, the new
 *   morph simply continues winding down and commits to the new year;
 * - interrupted after the commit point → the outgoing content is whatever the
 *   previous target put on screen, and it winds down towards the new target;
 * - reversing back to the original year → the dip reverses smoothly.
 *
 * Two mechanisms keep retargets glitch-free:
 * - **Authoritative baselines.** Per-material/per-mesh baselines and each
 *   group's base scale are sticky per object instance: they are captured only
 *   from pristine states and are never re-sampled from values this controller
 *   has faded or scaled. Content that survives an era swap keeps its true
 *   authored baseline; genuinely new content is captured as-is.
 * - **Proportional resume.** A group's outgoing phase runs at the amplitude
 *   its factor had when the morph armed (`factor = entry × envelope(t)`), so
 *   an interruption continues the dissolve from exactly where it paused.
 *   Fresh morphs have `entry === 1` and follow the plain envelope.
 *
 * ## Performance contract
 *
 * {@link update} performs zero per-frame object allocations: colors are
 * interpolated with `Color.lerpColors` into the live light/fog instances,
 * factors are plain numbers, and progress listeners receive ONE reused event
 * object (read it in the callback, never retain it). Allocations happen only
 * while a transition is being armed or committed.
 *
 * @example
 * ```ts
 * const transitions = new EraTransitionController(cafeScene, { renderer });
 * const stop = transitions.onProgress((e) => timelineSlider.showMorph(e.progress));
 * transitions.transitionTo(1965);
 * // in the render loop:
 * transitions.update(clock.getDelta());
 * ```
 */

/** How one prop group visually morphs between eras. */
export type EraTransitionStrategy = 'crossfade' | 'scalePop' | 'instantSwap';

/**
 * Progress payload handed to listeners. The controller REUSES a single
 * instance per controller: copy fields out if the value must outlive the
 * callback.
 */
export interface EraTransitionProgressEvent {
  /** Linear timeline position: 0 when the morph starts, 1 when it completes. */
  progress: number;
  /** Year the visible morph departed from (previous target when retargeted). */
  fromYear: EraYear;
  /** Year currently being morphed towards. */
  toYear: EraYear;
}

export interface EraTransitionOptions {
  /** Morph length in seconds. Must be finite and > 0. Defaults to ~1.2s. */
  durationSeconds?: number;
  /** Per-group strategy overrides; keys left unset keep the default strategy. */
  strategies?: Partial<Record<PropGroupKey, EraTransitionStrategy>>;
  /**
   * Renderer whose tone-mapping exposure is interpolated. Pass the app shell's
   * renderer so the exposure leg of the mood morph has something to drive.
   */
  renderer?: THREE.WebGLRenderer;
}

type ProgressListener = (event: EraTransitionProgressEvent) => void;
type CompletionListener = (event: EraTransitionProgressEvent) => void;

/* ------------------------------------------------------------------------- */
/* Tuning constants                                                          */
/* ------------------------------------------------------------------------- */

const DEFAULT_DURATION_SECONDS = 1.2;

/** Commit point of the morph timeline (outgoing/incoming split). */
const OUT_IN_SPLIT = 0.5;

/** Incoming-phase span of the morph timeline (`1 - OUT_IN_SPLIT`). */
const IN_SPAN = 1 - OUT_IN_SPLIT;

/** Scale floor; exact 0 scales can degenerate matrices for shadow cameras. */
const MIN_SCALE_FACTOR = 1e-3;

/** Largest clock step accepted per frame (guards tab-switch spikes / NaNs). */
const MAX_FRAME_DELTA = 0.25;

/** Backforce of the scale-pop easings (standard easeInOutBack constant). */
const POP_OVERSHOOT = 1.70158;

/**
 * Default per-group strategies. Large silhouettes pop, atmospheric layers
 * crossfade, small props hard-cut at the commit point.
 */
const DEFAULT_STRATEGIES: Record<PropGroupKey, EraTransitionStrategy> = {
  furniture: 'scalePop',
  machines: 'scalePop',
  menu: 'crossfade',
  posters: 'crossfade',
  tableware: 'instantSwap',
  signage: 'crossfade',
  counterTech: 'instantSwap',
  patrons: 'crossfade',
};

/* ------------------------------------------------------------------------- */
/* Internal records                                                          */
/* ------------------------------------------------------------------------- */

interface MaterialRecord {
  material: THREE.Material;
  baseOpacity: number;
  baseTransparent: boolean;
  baseDepthWrite: boolean;
}

interface MeshRecord {
  mesh: THREE.Mesh;
  baseCastShadow: boolean;
}

/** Persistent per-group visual bookkeeping (created once per group). */
interface GroupVisualState {
  key: PropGroupKey;
  /** Registered group this state was captured against (parent-checked per frame). */
  group: THREE.Group | null;
  materials: MaterialRecord[];
  meshes: MeshRecord[];
  scaleBaseX: number;
  scaleBaseY: number;
  scaleBaseZ: number;
  /** Current scale multiplier applied on top of the authored base scale. */
  scaleFactor: number;
  /** Current opacity multiplier applied on top of authored material opacities. */
  opacityFactor: number;
  /** True when the recorded baselines describe the group's pristine state. */
  clean: boolean;
}

/** One animated group during an active morph. */
interface ActiveGroupPlan {
  key: PropGroupKey;
  strategy: EraTransitionStrategy;
  state: GroupVisualState;
  /** On-screen factor when this morph armed; resume-blend source. */
  opacityStart: number;
  scaleStart: number;
}

/**
 * Snapshot of every scene-wide mood channel the controller interpolates.
 * Two instances exist per controller (departure + target); all colors are
 * written in place during capture and lerped from during the morph.
 */
interface MoodSnapshot {
  ambient: THREE.Color;
  hemisphereSky: THREE.Color;
  hemisphereGround: THREE.Color;
  sun: THREE.Color;
  accent: THREE.Color;
  fog: THREE.Color;
  ambientIntensity: number;
  hemisphereIntensity: number;
  sunIntensity: number;
  accentIntensity: number;
  fogDensity: number;
  exposure: number;
}

function createMoodSnapshot(): MoodSnapshot {
  return {
    ambient: new THREE.Color(0, 0, 0),
    hemisphereSky: new THREE.Color(0, 0, 0),
    hemisphereGround: new THREE.Color(0, 0, 0),
    sun: new THREE.Color(0, 0, 0),
    accent: new THREE.Color(0, 0, 0),
    fog: new THREE.Color(0, 0, 0),
    ambientIntensity: 0,
    hemisphereIntensity: 0,
    sunIntensity: 0,
    accentIntensity: 0,
    fogDensity: 0,
    exposure: 1,
  };
}

function createVisualState(key: PropGroupKey): GroupVisualState {
  return {
    key,
    group: null,
    materials: [],
    meshes: [],
    scaleBaseX: 1,
    scaleBaseY: 1,
    scaleBaseZ: 1,
    scaleFactor: 1,
    opacityFactor: 1,
    clean: true,
  };
}

/* ------------------------------------------------------------------------- */
/* Easing helpers (pure math, allocation free)                               */
/* ------------------------------------------------------------------------- */

/** Scene-wide mood easing across the whole morph. */
function easeMood(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/** Crossfade envelope: 1 → 0 → 1 with a dip exactly at the commit point. */
function crossfadeEnvelope(t: number): number {
  return 0.5 + 0.5 * Math.cos(Math.PI * t);
}

/** Ease-in-back; the scale-pop uses `1 - easeInBack` for an anticipatory swell. */
function easeInBack(t: number): number {
  const c3 = POP_OVERSHOOT + 1;
  return c3 * t * t * t - POP_OVERSHOOT * t * t;
}

/** Ease-out-back; the scale-pop springs slightly past 1 before settling. */
function easeOutBack(t: number): number {
  const c3 = POP_OVERSHOOT + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + POP_OVERSHOOT * u * u;
}

function scaleOutFactor(phaseT: number): number {
  const k = 1 - easeInBack(phaseT);
  return k < MIN_SCALE_FACTOR ? MIN_SCALE_FACTOR : k;
}

function scaleInFactor(phaseT: number): number {
  const k = easeOutBack(phaseT);
  return k < MIN_SCALE_FACTOR ? MIN_SCALE_FACTOR : k;
}

/* ------------------------------------------------------------------------- */
/* Controller                                                                */
/* ------------------------------------------------------------------------- */

export class EraTransitionController {
  private readonly cafeScene: CafeScene;
  private readonly renderer?: THREE.WebGLRenderer;

  private durationSeconds = DEFAULT_DURATION_SECONDS;

  /** Strategy per registered key (defaults seeded in the constructor). */
  private readonly strategies = new Map<PropGroupKey, EraTransitionStrategy>();

  /** Persistent visual bookkeeping, kept across transitions for continuity. */
  private readonly visualStates = new Map<PropGroupKey, GroupVisualState>();

  /** Groups animated by the ACTIVE morph (rebuilt when a morph is armed). */
  private readonly activePlans: ActiveGroupPlan[] = [];

  private readonly progressListeners: ProgressListener[] = [];
  private readonly completionListeners: CompletionListener[] = [];

  /** Reused event object — zero allocation per emitted progress tick. */
  private readonly progressEvent: EraTransitionProgressEvent = {
    progress: 1,
    fromYear: 1945,
    toYear: 1945,
  };

  private active = false;
  /** True once the active morph has routed the target era through the registry. */
  private committed = true;
  private elapsed = 0;
  private activeDuration = DEFAULT_DURATION_SECONDS;
  private activeFromYear: EraYear | null = null;
  private activeToYear: EraYear | null = null;

  private readonly fromMood = createMoodSnapshot();
  private readonly toMood = createMoodSnapshot();
  private fogRef: THREE.FogExp2 | null = null;
  private hasAccentLights = false;

  constructor(cafeScene: CafeScene, options: EraTransitionOptions = {}) {
    this.cafeScene = cafeScene;
    this.renderer = options.renderer;
    if (options.durationSeconds !== undefined) this.setDuration(options.durationSeconds);

    const overrides = options.strategies;
    for (let i = 0; i < PROP_GROUP_KEYS.length; i++) {
      const key = PROP_GROUP_KEYS[i];
      const overridden = overrides ? overrides[key] : undefined;
      this.strategies.set(key, overridden ?? DEFAULT_STRATEGIES[key]);
    }
  }

  /* ----- Public surface -------------------------------------------------- */

  /** Starts (or retargets) the animated morph towards `year`. */
  transitionTo(year: EraYear): void {
    if (typeof year !== 'number' || !Number.isFinite(year)) return;

    // Already morphing towards this exact year: keep the running animation
    // instead of restarting it (slider spam stays glitch free).
    if (this.active && year === this.activeToYear) return;

    const wasActive = this.active;
    const committedYear = this.cafeScene.currentEra?.year ?? null;

    // Idle no-op: requesting the already-committed era would only produce a
    // pointless dip-to-black and back.
    if (!wasActive && committedYear === year) return;

    this.activeFromYear =
      (wasActive ? this.activeToYear : committedYear) ?? year;
    this.activeToYear = year;
    this.activeDuration = this.durationSeconds;
    this.elapsed = 0;
    this.committed = false;

    // Departure state = whatever is literally on screen right now (live lights
    // may sit mid-interpolation of a cancelled morph). This is what makes
    // mid-transition retargets seamless.
    this.captureLiveMood();
    this.applyTargetMood(this.cafeScene.resolveEra(year));
    this.armPlans();

    this.active = true;
    this.emitProgress(0);
  }

  /**
   * Advances the active morph by the shared render-loop clock delta.
   * Safe to call every frame; exits immediately when idle. Performs zero
   * per-frame object allocations.
   */
  update(deltaSeconds: number): void {
    if (!this.active) return;

    let delta = deltaSeconds;
    if (!Number.isFinite(delta) || delta <= 0) delta = 0;
    else if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;

    this.elapsed += delta;
    let t = this.activeDuration > 0 ? this.elapsed / this.activeDuration : 1;
    if (!(t >= 0)) t = 0; // NaN/defensive clamp — progress can never be NaN.
    if (t > 1) t = 1;

    // Commit point: route the target era through the registry once. Every
    // group's updater runs here, which is also how instantSwap groups land.
    if (!this.committed && t >= OUT_IN_SPLIT) {
      this.commitTargetEra();
      this.committed = true;
    }

    this.writeInterpolatedMood(easeMood(t));

    for (let i = 0; i < this.activePlans.length; i++) {
      const plan = this.activePlans[i];
      const state = plan.state;
      const group = state.group;
      if (!group || group.parent === null) {
        // Group was unregistered mid-morph: restore its recorded baseline and
        // drop it from the plan without disturbing the rest of the morph.
        this.restoreGroupVisuals(state);
        this.visualStates.delete(state.key);
        this.activePlans.splice(i, 1);
        i--;
        continue;
      }

      if (plan.strategy === 'crossfade') {
        // Proportional resume: the outgoing phase runs at whatever amplitude
        // the factor had when this morph armed, so a mid-flight retarget
        // continues smoothly. Fresh plans carry entry=1 (plain envelope).
        const m =
          t < OUT_IN_SPLIT
            ? plan.opacityStart * crossfadeEnvelope(t)
            : crossfadeEnvelope(t);
        state.opacityFactor = m;
        for (let j = 0; j < state.materials.length; j++) {
          const record = state.materials[j];
          record.material.opacity = record.baseOpacity * m;
        }
      } else {
        // scalePop: anticipate-and-shrink, then spring back with overshoot.
        // Outgoing phase is likewise amplitude-scaled for seamless retargets.
        const k =
          t < OUT_IN_SPLIT
            ? plan.scaleStart * scaleOutFactor(t / OUT_IN_SPLIT)
            : scaleInFactor((t - OUT_IN_SPLIT) / IN_SPAN);
        state.scaleFactor = k;
        group.scale.set(
          state.scaleBaseX * k,
          state.scaleBaseY * k,
          state.scaleBaseZ * k,
        );
      }
    }

    this.emitProgress(t);

    if (t >= 1) this.finishMorph();
  }

  /** Whether a morph is currently playing. */
  get isTransitioning(): boolean {
    return this.active;
  }

  /** Linear progress of the active morph; 1 when idle. */
  get progress(): number {
    if (!this.active) return 1;
    const p = this.elapsed / this.activeDuration;
    return p > 1 ? 1 : p;
  }

  /** Year the active/idle-most-recent morph departed from, if any. */
  get fromYear(): EraYear | null {
    return this.activeFromYear;
  }

  /** Year the active morph is heading towards, if any. */
  get toYear(): EraYear | null {
    return this.activeToYear;
  }

  /** Configured morph length in seconds. */
  get duration(): number {
    return this.durationSeconds;
  }

  /** Updates the morph length; non-finite/non-positive values are ignored. */
  setDuration(seconds: number): void {
    if (typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0) {
      this.durationSeconds = seconds;
    }
  }

  /** Strategy currently used for `key`. */
  getStrategy(key: PropGroupKey): EraTransitionStrategy {
    return this.strategies.get(key) ?? 'crossfade';
  }

  /** Overrides the strategy for `key`; applies from the next armed morph on. */
  setStrategy(key: PropGroupKey, strategy: EraTransitionStrategy): void {
    this.strategies.set(key, strategy);
  }

  /** Subscribes to per-frame progress ticks. Returns an unsubscribe function. */
  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.push(listener);
    return () => this.removeListener(this.progressListeners, listener);
  }

  /** Subscribes to morph completion (progress === 1). Returns unsubscribe. */
  onComplete(listener: CompletionListener): () => void {
    this.completionListeners.push(listener);
    return () => this.removeListener(this.completionListeners, listener);
  }

  /** Stops everything and restores every touched group to its authored state. */
  dispose(): void {
    for (let i = 0; i < this.activePlans.length; i++) {
      this.restoreGroupVisuals(this.activePlans[i].state);
    }
    this.activePlans.length = 0;
    this.active = false;
    this.committed = true;
    this.elapsed = 0;
    this.activeFromYear = null;
    this.activeToYear = null;
    this.visualStates.clear();
    this.progressListeners.length = 0;
    this.completionListeners.length = 0;
  }

  /* ----- Morph internals --------------------------------------------------- */

  /**
   * Builds the per-group plan for a freshly armed morph. Groups already
   * mid-animation KEEP their visual state (baselines and current factors), so
   * the new morph resumes seamlessly from the picture on screen.
   */
  private armPlans(): void {
    this.activePlans.length = 0;

    const keys = this.cafeScene.propGroupKeys;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const strategy = this.strategies.get(key) ?? 'crossfade';

      if (strategy === 'instantSwap') {
        // Hard-cut group: if a previous morph left it mid-fade, snap it home.
        const stale = this.visualStates.get(key);
        if (stale && !stale.clean) this.restoreGroupVisuals(stale);
        continue;
      }

      const group = this.cafeScene.getPropGroup(key);
      if (!group) continue;

      let state = this.visualStates.get(key);
      if (!state || state.group !== group) {
        // First touch, or the registry now holds a NEW group object: fresh
        // bookkeeping (its content is pristine by definition).
        state = createVisualState(key);
        this.visualStates.set(key, state);
      }

      this.engageFade(state, group);

      this.activePlans.push({
        key,
        strategy,
        state,
        opacityStart: state.opacityFactor,
        scaleStart: state.scaleFactor,
      });
    }
  }

  /**
   * Ensures `state` describes `group` and has the fade environment engaged
   * (transparency on, depth writes off, shadow casting paused).
   *
   * Baselines are AUTHORITATIVE and sticky per object instance: records for
   * objects already tracked by this state survive the call untouched, so a
   * mid-flight retarget (or an era updater mutating persistent materials in
   * place) can never overwrite the authored baseline with currently-faded
   * values. Unknown instances are pristine content and captured as-is.
   */
  private engageFade(state: GroupVisualState, group: THREE.Group): void {
    const continuing = state.group === group && !state.clean;

    const priorMaterials = new Map<THREE.Material, MaterialRecord>();
    const priorMeshes = new Map<THREE.Mesh, MeshRecord>();
    if (continuing) {
      for (let i = 0; i < state.materials.length; i++) {
        priorMaterials.set(state.materials[i].material, state.materials[i]);
      }
      for (let i = 0; i < state.meshes.length; i++) {
        priorMeshes.set(state.meshes[i].mesh, state.meshes[i]);
      }
    }

    state.group = group;
    if (!continuing) {
      // Clean state or brand-new group object: capture the authored scale.
      state.scaleBaseX = group.scale.x;
      state.scaleBaseY = group.scale.y;
      state.scaleBaseZ = group.scale.z;
    }

    state.materials.length = 0;
    state.meshes.length = 0;

    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      let meshRecord = priorMeshes.get(mesh);
      if (!meshRecord) {
        meshRecord = { mesh, baseCastShadow: mesh.castShadow };
      }
      state.meshes.push(meshRecord);
      mesh.castShadow = false;

      const material = mesh.material;
      if (Array.isArray(material)) {
        for (let i = 0; i < material.length; i++) {
          this.pushMaterialRecord(state, priorMaterials, material[i]);
        }
      } else {
        this.pushMaterialRecord(state, priorMaterials, material);
      }
    });

    state.clean = false;
  }

  private pushMaterialRecord(
    state: GroupVisualState,
    prior: Map<THREE.Material, MaterialRecord>,
    material: THREE.Material,
  ): void {
    const existing = prior.get(material);
    if (existing && !state.materials.includes(existing)) {
      state.materials.push(existing);
    } else if (!existing) {
      state.materials.push({
        material,
        baseOpacity: material.opacity,
        baseTransparent: material.transparent,
        baseDepthWrite: material.depthWrite,
      });
    }
    // Fade environment: asserted for both fresh and surviving records (an era
    // updater may have restored the flags on persistent materials).
    material.transparent = true;
    material.depthWrite = false;
  }

  /** Routes the target era through the registry and re-baselines fade-ins. */
  private commitTargetEra(): void {
    const target = this.activeToYear;
    if (target === null) return;
    this.cafeScene.applyEra(target);

    for (let i = 0; i < this.activePlans.length; i++) {
      const plan = this.activePlans[i];
      const group = this.cafeScene.getPropGroup(plan.key);
      if (!group) continue;
      // Post-swap content: surviving records keep their authoritative
      // baselines (see engageFade); genuinely new content is captured as-is.
      // Then start the incoming phase from invisibility — the per-frame apply
      // later in this same tick writes the actual start values before
      // anything renders.
      this.engageFade(plan.state, group);
      plan.state.opacityFactor = 0;
      plan.state.scaleFactor = MIN_SCALE_FACTOR;
      plan.opacityStart = 0;
      plan.scaleStart = MIN_SCALE_FACTOR;
    }
  }

  /** Restores a group exactly to its authored baseline and marks it clean. */
  private restoreGroupVisuals(state: GroupVisualState): void {
    const group = state.group;
    if (group) {
      group.scale.set(state.scaleBaseX, state.scaleBaseY, state.scaleBaseZ);
    }
    for (let i = 0; i < state.meshes.length; i++) {
      const record = state.meshes[i];
      record.mesh.castShadow = record.baseCastShadow;
    }
    for (let i = 0; i < state.materials.length; i++) {
      const record = state.materials[i];
      record.material.opacity = record.baseOpacity;
      record.material.transparent = record.baseTransparent;
      record.material.depthWrite = record.baseDepthWrite;
    }
    state.materials.length = 0;
    state.meshes.length = 0;
    state.group = null;
    state.scaleFactor = 1;
    state.opacityFactor = 1;
    state.clean = true;
  }

  /** Terminal state of a morph: exact restoration + completion events. */
  private finishMorph(): void {
    for (let i = 0; i < this.activePlans.length; i++) {
      this.restoreGroupVisuals(this.activePlans[i].state);
    }
    this.activePlans.length = 0;
    this.active = false;
    this.committed = true;
    this.elapsed = 0;

    // Pin the final mood exactly (kills residual float drift).
    this.writeInterpolatedMood(1);
    this.emitProgress(1);

    for (let i = 0; i < this.completionListeners.length; i++) {
      this.completionListeners[i](this.progressEvent);
    }
  }

  /* ----- Mood capture & interpolation -------------------------------------- */

  /** Copies the live lighting rig / fog / exposure into the departure slot. */
  private captureLiveMood(): void {
    const scene = this.cafeScene;
    const from = this.fromMood;

    from.ambient.copy(scene.ambientLight.color);
    from.ambientIntensity = scene.ambientLight.intensity;

    from.hemisphereSky.copy(scene.hemisphereLight.color);
    from.hemisphereGround.copy(scene.hemisphereLight.groundColor);
    from.hemisphereIntensity = scene.hemisphereLight.intensity;

    from.sun.copy(scene.sunLight.color);
    from.sunIntensity = scene.sunLight.intensity;

    this.hasAccentLights = scene.accentLights.length > 0;
    if (this.hasAccentLights) {
      from.accent.copy(scene.accentLights[0].color);
      from.accentIntensity = scene.accentLights[0].intensity;
    }

    const fog = scene.scene.fog;
    this.fogRef = fog instanceof THREE.FogExp2 ? fog : null;
    if (this.fogRef) {
      from.fog.copy(this.fogRef.color);
      from.fogDensity = this.fogRef.density;
    }

    from.exposure = this.renderer ? this.renderer.toneMappingExposure : 1;
  }

  /**
   * Seeds the target mood with the departure snapshot (so undefined mood
   * fields simply hold still), then overlays the target era's mood with
   * NaN-safe guards.
   */
  private applyTargetMood(config: EraConfig): void {
    const from = this.fromMood;
    const to = this.toMood;

    to.ambient.copy(from.ambient);
    to.hemisphereSky.copy(from.hemisphereSky);
    to.hemisphereGround.copy(from.hemisphereGround);
    to.sun.copy(from.sun);
    to.accent.copy(from.accent);
    to.fog.copy(from.fog);
    to.ambientIntensity = from.ambientIntensity;
    to.hemisphereIntensity = from.hemisphereIntensity;
    to.sunIntensity = from.sunIntensity;
    to.accentIntensity = from.accentIntensity;
    to.fogDensity = from.fogDensity;
    to.exposure = from.exposure;

    const mood = config.lighting;
    if (!mood) return;

    if (mood.ambientColor !== undefined) to.ambient.set(mood.ambientColor);
    const ambientI = mood.ambientIntensity;
    if (typeof ambientI === 'number' && Number.isFinite(ambientI)) to.ambientIntensity = ambientI;

    if (mood.hemisphereSkyColor !== undefined) to.hemisphereSky.set(mood.hemisphereSkyColor);
    if (mood.hemisphereGroundColor !== undefined) {
      to.hemisphereGround.set(mood.hemisphereGroundColor);
    }
    const hemisphereI = mood.hemisphereIntensity;
    if (typeof hemisphereI === 'number' && Number.isFinite(hemisphereI)) {
      to.hemisphereIntensity = hemisphereI;
    }

    if (mood.sunColor !== undefined) to.sun.set(mood.sunColor);
    const sunI = mood.sunIntensity;
    if (typeof sunI === 'number' && Number.isFinite(sunI)) to.sunIntensity = sunI;

    if (mood.accentColor !== undefined) to.accent.set(mood.accentColor);
    const accentI = mood.accentIntensity;
    if (typeof accentI === 'number' && Number.isFinite(accentI)) to.accentIntensity = accentI;

    if (mood.fogColor !== undefined) to.fog.set(mood.fogColor);
    const fogDensity = mood.fogDensity;
    if (typeof fogDensity === 'number' && Number.isFinite(fogDensity)) to.fogDensity = fogDensity;

    const exposure = mood.exposure;
    if (typeof exposure === 'number' && Number.isFinite(exposure)) to.exposure = exposure;
  }

  /**
   * Writes the interpolated mood into the live rig. Every write lands in an
   * existing three.js object — no allocations, and the values overwrite the
   * instant mood application performed by the mid-morph `applyEra` commit
   * within the same tick, so the commit never flashes on screen.
   */
  private writeInterpolatedMood(e: number): void {
    const scene = this.cafeScene;
    const from = this.fromMood;
    const to = this.toMood;

    scene.ambientLight.color.lerpColors(from.ambient, to.ambient, e);
    scene.ambientLight.intensity =
      from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * e;

    scene.hemisphereLight.color.lerpColors(from.hemisphereSky, to.hemisphereSky, e);
    scene.hemisphereLight.groundColor.lerpColors(
      from.hemisphereGround,
      to.hemisphereGround,
      e,
    );
    scene.hemisphereLight.intensity =
      from.hemisphereIntensity + (to.hemisphereIntensity - from.hemisphereIntensity) * e;

    scene.sunLight.color.lerpColors(from.sun, to.sun, e);
    scene.sunLight.intensity = from.sunIntensity + (to.sunIntensity - from.sunIntensity) * e;

    if (this.hasAccentLights) {
      const accents = scene.accentLights;
      for (let i = 0; i < accents.length; i++) {
        accents[i].color.lerpColors(from.accent, to.accent, e);
        accents[i].intensity =
          from.accentIntensity + (to.accentIntensity - from.accentIntensity) * e;
      }
    }

    if (this.fogRef) {
      this.fogRef.color.lerpColors(from.fog, to.fog, e);
      this.fogRef.density = from.fogDensity + (to.fogDensity - from.fogDensity) * e;
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = from.exposure + (to.exposure - from.exposure) * e;
    }
  }

  /* ----- Events ------------------------------------------------------------- */

  private emitProgress(progress: number): void {
    const event = this.progressEvent;
    event.progress = progress;
    event.fromYear = this.activeFromYear ?? this.activeToYear ?? event.fromYear;
    event.toYear = this.activeToYear ?? event.fromYear;

    for (let i = 0; i < this.progressListeners.length; i++) {
      this.progressListeners[i](event);
    }
  }

  private removeListener<T extends (event: EraTransitionProgressEvent) => void>(
    listeners: T[],
    listener: T,
  ): void {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  }
}
