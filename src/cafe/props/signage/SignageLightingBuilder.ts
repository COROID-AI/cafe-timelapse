import * as THREE from 'three';
import type { CafeScene } from '../../CafeScene';
import type {
  EraConfig,
  EraLightingMood,
  PropBuildContext,
  PropGroupUpdater,
} from '../../types';
import { disposeObjectTree } from '../machines/kit/geometries';
import { ERA_LAYER_EPSILON } from './layout';
import { resolveSignageMood } from './moods';
import type {
  EraVariantBuilder,
  SignageAnimator,
  SignageEraYear,
  SignageLightingSpec,
} from './types';
import { SIGNAGE_ERA_YEARS } from './types';
import { buildEra1945Signage } from './variants/era1945';
import { buildEra1965Signage } from './variants/era1965';
import { buildEra1985Signage } from './variants/era1985';
import { buildEra2005Signage } from './variants/era2005';
import { buildEra2025Signage } from './variants/era2025';

/**
 * Signage & Lighting prop group.
 *
 * Renders all five era looks up front (hanging painted board → window neon →
 * backlit lightbox + track gels → dimensional letters + downlights → LED neon
 * + smart scenes) and crossfades between any pair without light popping:
 * material opacities AND fixture-light intensities ride the same smoothstep
 * envelope, and the scene-wide ambient/directional/fog/exposure mood ramps
 * along with them unless an `EraTransitionController` morph owns those lights
 * (detected by divergence, at which point this rig stands down).
 */

/** Prop-group key — matches the `signage` section of {@link EraConfig}. */
export const SIGNAGE_PROP_GROUP_KEY = 'signage' as const;

/** Era years this group renders signage + fixtures for. */
export const SUPPORTED_SIGNAGE_YEARS = SIGNAGE_ERA_YEARS;

export type SupportedSignageYear = SignageEraYear;

/** Duration of one era-to-era crossfade, in milliseconds. */
export const CROSSFADE_DURATION_MS = 700;

/** Shown before any era has been applied. */
const DEFAULT_ACTIVE_YEAR: SupportedSignageYear = 1945;

const VARIANT_BUILDERS: Record<SupportedSignageYear, EraVariantBuilder> = {
  1945: buildEra1945Signage,
  1965: buildEra1965Signage,
  1985: buildEra1985Signage,
  2005: buildEra2005Signage,
  2025: buildEra2025Signage,
};

/* ------------------------------------------------------------------------- */
/* Payload extraction                                                         */
/* ------------------------------------------------------------------------- */

const SPEC_KEYS = ['signage', 'fixtures', 'overallMood', 'daylightNote'] as const;

function isSignageLightingSpec(value: unknown): value is SignageLightingSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return SPEC_KEYS.some((key) => record[key] !== undefined);
}

/**
 * Reads the era's `signageLighting` payload out of the routed {@link EraConfig}
 * `signage` section. Two layouts are accepted so the group survives either
 * integration shape: a carrier object (`{ signageLighting: {...} }`, matching
 * the field name used by `src/cafe/eras/types.ts`) or the spec keys directly
 * on the section. Returns `undefined` when neither is present (current era
 * stubs), which makes every variant fall back to its period preset.
 */
export function extractSignageLighting(section: unknown): SignageLightingSpec | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  const carrier = record.signageLighting ?? record.signsAndLights;
  if (isSignageLightingSpec(carrier)) return carrier;
  if (isSignageLightingSpec(record)) return record;
  return undefined;
}

/**
 * Maps any shell timeline year onto a rendered era variant. Years outside the
 * five supported stops (i.e. 2055) snap to the nearest era so signage never
 * disappears mid-timeline.
 */
export function resolveSupportedYear(year: number): SupportedSignageYear {
  let best: SupportedSignageYear = 2025;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of SUPPORTED_SIGNAGE_YEARS) {
    const delta = Math.abs(candidate - year);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

/** Stamps routed payload metadata onto a variant group (debug overlay data). */
function stampSpecMetadata(group: THREE.Group, spec: SignageLightingSpec | undefined): void {
  group.userData.specOverallMood = spec?.overallMood ?? null;
  group.userData.specDaylightNote = spec?.daylightNote ?? null;
  group.userData.specSignageLabels = spec?.signage?.length
    ? spec.signage.map((element) => element.label ?? element.text ?? element.id ?? '')
    : [];
  group.userData.hasPayloadOverride = spec !== undefined;
}

/* ------------------------------------------------------------------------- */
/* Crossfade machinery                                                        */
/* ------------------------------------------------------------------------- */

interface FadeEntry {
  material: THREE.MeshStandardMaterial;
  baseOpacity: number;
  baseTransparent: boolean;
}

interface LightEntry {
  light: THREE.PointLight | THREE.SpotLight;
  baseIntensity: number;
}

interface EraVariant {
  year: SupportedSignageYear;
  group: THREE.Group;
  fades: FadeEntry[];
  lights: LightEntry[];
  animators: SignageAnimator[];
}

interface ActiveFade {
  from: EraVariant;
  to: EraVariant;
  startedAt: number;
}

function pushFadeEntry(
  entries: FadeEntry[],
  seen: Set<THREE.MeshStandardMaterial>,
  material: THREE.Material,
): void {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  if (seen.has(material)) return;
  seen.add(material);
  entries.push({
    material,
    baseOpacity: material.opacity,
    baseTransparent: material.transparent,
  });
}

function collectFadeEntries(group: THREE.Group): FadeEntry[] {
  const entries: FadeEntry[] = [];
  const seen = new Set<THREE.MeshStandardMaterial>();
  group.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) pushFadeEntry(entries, seen, material);
  });
  return entries;
}

function collectLightEntries(group: THREE.Group): LightEntry[] {
  const entries: LightEntry[] = [];
  group.traverse((node) => {
    if (node instanceof THREE.PointLight || node instanceof THREE.SpotLight) {
      entries.push({ light: node, baseIntensity: node.intensity });
    }
  });
  return entries;
}

function applyOpacity(entries: FadeEntry[], factor: number): void {
  for (const entry of entries) {
    // Transparency toggling is render-state only in three.js — no shader
    // recompile — so flipping it per frame is cheap.
    entry.material.transparent = true;
    entry.material.opacity = entry.baseOpacity * factor;
  }
}

function restoreEntries(entries: FadeEntry[]): void {
  for (const entry of entries) {
    entry.material.opacity = entry.baseOpacity;
    entry.material.transparent = entry.baseTransparent;
  }
}

function applyLightFactor(entries: LightEntry[], factor: number): void {
  for (const entry of entries) {
    entry.light.intensity = entry.baseIntensity * factor;
    // Animators compose with the fade through this shared factor.
    entry.light.userData.fadeFactor = factor;
  }
}

function restoreLights(entries: LightEntry[]): void {
  for (const entry of entries) {
    entry.light.intensity = entry.baseIntensity;
    entry.light.userData.fadeFactor = 1;
  }
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function hasAnimationFrameLoop(): boolean {
  return typeof requestAnimationFrame === 'function';
}

/* ------------------------------------------------------------------------- */
/* Scene-wide mood ramp                                                       */
/* ------------------------------------------------------------------------- */

/** Numeric snapshot of every scene-mood channel this rig drives. */
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
}

/** Fully-resolved lerp destination parsed once per application. */
interface ParsedMood {
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

interface MoodRamp {
  targetYear: SupportedSignageYear;
  target: ParsedMood;
  from: MoodSnapshot;
  /** What this rig last wrote — the divergence baseline. */
  written: MoodSnapshot;
  startedAt: number;
}

function createSnapshot(): MoodSnapshot {
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
  };
}

const COLOR_EPSILON = 0.01;
const VALUE_EPSILON = 0.005;

function colorMatches(a: THREE.Color, b: THREE.Color): boolean {
  return (
    Math.abs(a.r - b.r) <= COLOR_EPSILON &&
    Math.abs(a.g - b.g) <= COLOR_EPSILON &&
    Math.abs(a.b - b.b) <= COLOR_EPSILON
  );
}

function snapshotsMatch(live: MoodSnapshot, written: MoodSnapshot, accentsAvailable: boolean): boolean {
  if (!colorMatches(live.ambient, written.ambient)) return false;
  if (Math.abs(live.ambientIntensity - written.ambientIntensity) > VALUE_EPSILON) return false;
  if (!colorMatches(live.hemisphereSky, written.hemisphereSky)) return false;
  if (!colorMatches(live.hemisphereGround, written.hemisphereGround)) return false;
  if (Math.abs(live.hemisphereIntensity - written.hemisphereIntensity) > VALUE_EPSILON) return false;
  if (!colorMatches(live.sun, written.sun)) return false;
  if (Math.abs(live.sunIntensity - written.sunIntensity) > VALUE_EPSILON) return false;
  if (!colorMatches(live.fog, written.fog)) return false;
  if (Math.abs(live.fogDensity - written.fogDensity) > VALUE_EPSILON * 4) return false;
  if (accentsAvailable) {
    if (!colorMatches(live.accent, written.accent)) return false;
    if (Math.abs(live.accentIntensity - written.accentIntensity) > VALUE_EPSILON) return false;
  }
  return true;
}

function parseMood(mood: EraLightingMood, fallbackLive: MoodSnapshot): ParsedMood {
  return {
    ambient: new THREE.Color(mood.ambientColor ?? fallbackLive.ambient),
    hemisphereSky: new THREE.Color(mood.hemisphereSkyColor ?? fallbackLive.hemisphereSky),
    hemisphereGround: new THREE.Color(mood.hemisphereGroundColor ?? fallbackLive.hemisphereGround),
    sun: new THREE.Color(mood.sunColor ?? fallbackLive.sun),
    accent: new THREE.Color(mood.accentColor ?? fallbackLive.accent),
    fog: new THREE.Color(mood.fogColor ?? fallbackLive.fog),
    ambientIntensity: mood.ambientIntensity ?? fallbackLive.ambientIntensity,
    hemisphereIntensity: mood.hemisphereIntensity ?? fallbackLive.hemisphereIntensity,
    sunIntensity: mood.sunIntensity ?? fallbackLive.sunIntensity,
    accentIntensity: mood.accentIntensity ?? fallbackLive.accentIntensity,
    fogDensity: mood.fogDensity ?? fallbackLive.fogDensity,
    exposure: mood.exposure ?? 1,
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------------- */
/* Rig                                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Owns the five procedural era variants plus the scene-wide mood ramp, and
 * animates crossfades between any pair of them.
 *
 * Crossfade strategy: all variants stay mounted at their authored anchors;
 * the outgoing one eases to opacity 0 (materials) and 0 intensity (lights)
 * while the incoming one eases in, then the outgoing is hidden entirely.
 * Interrupting transitions simply finalises the previous fade first, so
 * slider spam produces clean chained results instead of blended soup.
 */
class SignageRig {
  readonly root = new THREE.Group();

  private readonly host: CafeScene;
  private readonly variants = new Map<SupportedSignageYear, EraVariant>();
  private active: EraVariant;
  private fade: ActiveFade | null = null;
  private rafId: number | null = null;
  private readonly bornAtMs = nowMs();

  /* Mood bookkeeping ------------------------------------------------------ */
  private moodInitialized = false;
  private moodTargetYear: SupportedSignageYear | null = null;
  private ramp: MoodRamp | null = null;
  private readonly scratchLive = createSnapshot();
  /**
   * Exposure cannot be read back through the host's public hooks, so the rig
   * tracks the last value IT wrote; `null` means unknown (never animate the
   * channel until an instant application pins it again).
   */
  private trackedExposure: number | null = null;

  constructor(host: CafeScene, initialYear: SupportedSignageYear, initialSpec?: SignageLightingSpec) {
    this.host = host;
    this.root.name = 'cafe-signage-lighting';
    this.root.userData.propGroup = SIGNAGE_PROP_GROUP_KEY;
    this.root.userData.strategy = 'crossfade';
    this.root.userData.supportedYears = [...SUPPORTED_SIGNAGE_YEARS];

    let index = 0;
    for (const year of SUPPORTED_SIGNAGE_YEARS) {
      const built = VARIANT_BUILDERS[year]({ spec: year === initialYear ? initialSpec : undefined });
      stampSpecMetadata(built, year === initialYear ? initialSpec : undefined);
      // Micro-offset per variant so coincident sign surfaces never z-fight
      // while two eras blend.
      built.position.x += index * ERA_LAYER_EPSILON;
      built.position.y += index * ERA_LAYER_EPSILON;
      built.visible = year === initialYear;
      this.root.add(built);
      this.variants.set(year, {
        year,
        group: built,
        fades: collectFadeEntries(built),
        lights: collectLightEntries(built),
        animators: (built.userData.animators as SignageAnimator[] | undefined) ?? [],
      });
      index += 1;
    }

    const initial = this.variants.get(initialYear);
    if (!initial) throw new Error(`Signage rig missing variant for ${initialYear}.`);
    this.active = initial;
    this.root.userData.activeYear = initial.year;
    this.root.userData.activeTitle = initial.group.userData.eraTitle ?? null;
    this.applyShadowFlags();

    // Seed the scene mood immediately so the room reads correctly from the
    // very first rendered frame, even before the first applyEra call.
    this.applyMoodPreset(initial.year);
    this.ensureLoop();
  }

  /** Era currently shown (or fading in). */
  get activeYear(): SupportedSignageYear {
    return this.active.year;
  }

  /**
   * Clears forced shadow casting on translucent/emissive surfaces.
   * `CafeScene.registerPropGroup` switches shadows ON for every mesh after
   * the builder returns, so glow panels, LED strips, neon faces and glass opt
   * back out here (idempotent).
   */
  applyShadowFlags(): void {
    this.root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.glowSurface === true || mesh.userData.noCastShadow === true) {
        mesh.castShadow = false;
      }
    });
  }

  /** Applies one era config: metadata refresh, mood ramp, crossfade. */
  applyEra(config: EraConfig): void {
    const spec = extractSignageLighting(config.signage);
    const target = this.variants.get(resolveSupportedYear(config.year));
    if (!target) return;

    stampSpecMetadata(target.group, spec);
    this.root.userData.activeYear = target.year;
    this.root.userData.activeTitle = target.group.userData.eraTitle ?? null;

    this.applyMood(resolveSignageMood(config, target.year), target.year);

    if (target === this.active) return; // fade (if any) already heading there
    this.startCrossfade(target);
  }

  dispose(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.finishFade();
    this.ramp = null;
    for (const variant of this.variants.values()) disposeObjectTree(variant.group);
    this.variants.clear();
  }

  /* ----- Crossfade internals --------------------------------------------- */

  private startCrossfade(target: EraVariant): void {
    // Finalise any in-flight transition so arbitrary era pairs chain cleanly.
    this.finishFade();
    const from = this.active;
    if (from === target) return;

    from.group.visible = true;
    target.group.visible = true;
    this.fade = { from, to: target, startedAt: nowMs() };
    this.active = target;
    this.ensureLoop();
  }

  private stepFade(): void {
    const fade = this.fade;
    if (!fade) return;
    const progress = Math.min(Math.max((nowMs() - fade.startedAt) / CROSSFADE_DURATION_MS, 0), 1);
    if (progress >= 1) {
      this.finishFade();
      return;
    }
    const eased = smoothstep(progress);
    applyOpacity(fade.from.fades, 1 - eased);
    applyOpacity(fade.to.fades, eased);
    applyLightFactor(fade.from.lights, 1 - eased);
    applyLightFactor(fade.to.lights, eased);
  }

  private finishFade(): void {
    const fade = this.fade;
    if (!fade) return;
    applyOpacity(fade.from.fades, 0);
    applyOpacity(fade.to.fades, 1);
    applyLightFactor(fade.from.lights, 0);
    applyLightFactor(fade.to.lights, 1);
    fade.from.group.visible = false;
    restoreEntries(fade.from.fades);
    restoreEntries(fade.to.fades);
    restoreLights(fade.from.lights);
    restoreLights(fade.to.lights);
    this.fade = null;
  }

  /* ----- Mood internals ---------------------------------------------------- */

  /** Seeds the mood for a year straight from this module's presets. */
  private applyMoodPreset(year: SupportedSignageYear): void {
    this.applyMood(resolveSignageMood({} as EraConfig, year), year);
  }

  /**
   * Routes one resolved mood into the scene-wide rig.
   *
   * - First contact writes instantly (boot/registration).
   * - A NEW year starts an animated ramp synchronised with the fixture
   *   crossfade — no popping on direct slider changes.
   * - If some other writer (the EraTransitionController during a morph)
   *   moves the lights meanwhile, the ramp detects the divergence and stands
   *   down, leaving the controller's lerp targets authoritative.
   */
  private applyMood(mood: EraLightingMood, year: SupportedSignageYear): void {
    const live = this.captureLive(this.scratchLive);

    if (!this.moodInitialized) {
      this.writeInstant(parseMood(mood, live), live);
      this.moodInitialized = true;
      this.moodTargetYear = year;
      return;
    }

    const rampActiveForYear = this.ramp !== null && this.ramp.targetYear === year;
    if (!rampActiveForYear && year === this.moodTargetYear && !this.ramp) {
      // Same-era re-apply: recover drift left by another writer (e.g. a
      // controller morph whose stub config carried no lighting targets).
      const written = this.lastWritten;
      if (!written || !snapshotsMatch(live, written, this.host.accentLights.length > 0)) {
        this.writeInstant(parseMood(mood, live), live);
      }
      return;
    }
    if (rampActiveForYear) return; // already easing towards this exact mood

    this.startMoodRamp(mood, year, live);
  }

  /**
   * Snapshot of what this rig last wrote. Kept as a field (not part of the
   * ramp) so same-era drift checks work even when idle.
   */
  private readonly lastWrittenSnapshot = createSnapshot();
  private get lastWritten(): MoodSnapshot | null {
    return this.moodInitialized ? this.lastWrittenSnapshot : null;
  }

  private captureLive(into: MoodSnapshot): MoodSnapshot {
    into.ambient.copy(this.host.ambientLight.color);
    into.ambientIntensity = this.host.ambientLight.intensity;
    into.hemisphereSky.copy(this.host.hemisphereLight.color);
    into.hemisphereGround.copy(this.host.hemisphereLight.groundColor);
    into.hemisphereIntensity = this.host.hemisphereLight.intensity;
    into.sun.copy(this.host.sunLight.color);
    into.sunIntensity = this.host.sunLight.intensity;
    const accents = this.host.accentLights;
    if (accents.length > 0) {
      into.accent.copy(accents[0].color);
      into.accentIntensity = accents[0].intensity;
    }
    const fog = this.host.scene.fog;
    if (fog instanceof THREE.FogExp2) {
      into.fog.copy(fog.color);
      into.fogDensity = fog.density;
    }
    return into;
  }

  private writeInstant(target: ParsedMood, live: MoodSnapshot): void {
    this.writeInterpolated(live, target, 1, this.lastWrittenSnapshot);
    this.trackedExposure = target.exposure;
  }

  /**
   * Writes `from + (target − from) × e` into the scene rig and mirrors every
   * written value into `record` (the divergence baseline). Zero allocations
   * beyond the caller-provided snapshots.
   */
  private writeInterpolated(
    from: MoodSnapshot,
    target: ParsedMood,
    e: number,
    record: MoodSnapshot,
  ): void {
    const ambient = this.host.ambientLight;
    record.ambient.copy(from.ambient).lerp(target.ambient, e);
    ambient.color.copy(record.ambient);
    record.ambientIntensity = from.ambientIntensity + (target.ambientIntensity - from.ambientIntensity) * e;
    ambient.intensity = record.ambientIntensity;

    const hemisphere = this.host.hemisphereLight;
    record.hemisphereSky.copy(from.hemisphereSky).lerp(target.hemisphereSky, e);
    hemisphere.color.copy(record.hemisphereSky);
    record.hemisphereGround.copy(from.hemisphereGround).lerp(target.hemisphereGround, e);
    hemisphere.groundColor.copy(record.hemisphereGround);
    record.hemisphereIntensity =
      from.hemisphereIntensity + (target.hemisphereIntensity - from.hemisphereIntensity) * e;
    hemisphere.intensity = record.hemisphereIntensity;

    const sun = this.host.sunLight;
    record.sun.copy(from.sun).lerp(target.sun, e);
    sun.color.copy(record.sun);
    record.sunIntensity = from.sunIntensity + (target.sunIntensity - from.sunIntensity) * e;
    sun.intensity = record.sunIntensity;

    const accents = this.host.accentLights;
    record.accent.copy(from.accent).lerp(target.accent, e);
    record.accentIntensity =
      from.accentIntensity + (target.accentIntensity - from.accentIntensity) * e;
    for (const light of accents) {
      light.color.copy(record.accent);
      light.intensity = record.accentIntensity;
    }

    const fog = this.host.scene.fog;
    if (fog instanceof THREE.FogExp2) {
      record.fog.copy(from.fog).lerp(target.fog, e);
      record.fogDensity = from.fogDensity + (target.fogDensity - from.fogDensity) * e;
      fog.color.copy(record.fog);
      fog.density = record.fogDensity;
    }

    if (this.trackedExposure !== null) {
      this.host.setExposure(this.trackedExposure + (target.exposure - this.trackedExposure) * e);
    }
  }

  private startMoodRamp(
    mood: EraLightingMood,
    year: SupportedSignageYear,
    live: MoodSnapshot,
  ): void {
    const target = parseMood(mood, live);
    if (!hasAnimationFrameLoop()) {
      // Non-browser environment: settle instantly instead of freezing.
      this.writeInstant(target, live);
      this.moodTargetYear = year;
      return;
    }
    this.ramp = {
      targetYear: year,
      target,
      from: createSnapshotCopy(live),
      written: createSnapshotCopy(live),
      startedAt: nowMs(),
    };
    this.moodTargetYear = year;
    this.ensureLoop();
  }

  private tickMood(): void {
    const ramp = this.ramp;
    if (!ramp) return;

    const live = this.captureLive(this.scratchLive);
    // Divergence check: if anything else moved these channels since our last
    // write, an EraTransitionController morph owns the lights — stand down.
    if (!snapshotsMatch(live, ramp.written, this.host.accentLights.length > 0)) {
      this.ramp = null;
      this.trackedExposure = null; // controller-owned until pinned again
      return;
    }

    const progress = Math.min(Math.max((nowMs() - ramp.startedAt) / CROSSFADE_DURATION_MS, 0), 1);
    this.writeInterpolated(ramp.from, ramp.target, smoothstep(progress), ramp.written);
    if (progress >= 1) {
      this.recordWritten(ramp.written);
      this.ramp = null;
      this.trackedExposure = ramp.target.exposure;
    }
  }

  /** Mirrors a snapshot into the drift-check baseline for idle comparisons. */
  private recordWritten(source: MoodSnapshot): void {
    const into = this.lastWrittenSnapshot;
    into.ambient.copy(source.ambient);
    into.hemisphereSky.copy(source.hemisphereSky);
    into.hemisphereGround.copy(source.hemisphereGround);
    into.sun.copy(source.sun);
    into.accent.copy(source.accent);
    into.fog.copy(source.fog);
    into.ambientIntensity = source.ambientIntensity;
    into.hemisphereIntensity = source.hemisphereIntensity;
    into.sunIntensity = source.sunIntensity;
    into.accentIntensity = source.accentIntensity;
    into.fogDensity = source.fogDensity;
  }

  /* ----- Animation loop ---------------------------------------------------- */

  private ensureLoop(): void {
    if (this.rafId !== null) return;
    if (!hasAnimationFrameLoop()) {
      // Non-browser environment: settle pending animation instantly instead
      // of freezing mid-fade.
      this.finishFade();
      return;
    }
    this.rafId = requestAnimationFrame(this.tickLoop);
  }

  private readonly tickLoop = (): void => {
    this.rafId = null;
    if (this.variants.size === 0) return; // disposed

    this.stepFade();
    this.tickMood();

    const elapsedSeconds = (nowMs() - this.bornAtMs) / 1000;
    const animators = this.active.animators;
    for (let i = 0; i < animators.length; i++) animators[i](elapsedSeconds);

    this.ensureLoop();
  };
}

function createSnapshotCopy(source: MoodSnapshot): MoodSnapshot {
  return {
    ambient: source.ambient.clone(),
    hemisphereSky: source.hemisphereSky.clone(),
    hemisphereGround: source.hemisphereGround.clone(),
    sun: source.sun.clone(),
    accent: source.accent.clone(),
    fog: source.fog.clone(),
    ambientIntensity: source.ambientIntensity,
    hemisphereIntensity: source.hemisphereIntensity,
    sunIntensity: source.sunIntensity,
    accentIntensity: source.accentIntensity,
    fogDensity: source.fogDensity,
  };
}

/* ------------------------------------------------------------------------- */
/* Registration surface                                                       */
/* ------------------------------------------------------------------------- */

const rigs = new WeakMap<object, SignageRig>();

function requireRig(host: object): SignageRig {
  const rig = rigs.get(host);
  if (!rig) {
    throw new Error(
      'No signage rig for this host — build it first via SignageLightingBuilder / registerSignageLighting().',
    );
  }
  return rig;
}

function scheduleShadowFix(rig: SignageRig): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => rig.applyShadowFlags());
  }
  // Environments without microtasks still converge: every applyEra call
  // re-runs applyShadowFlags idempotently.
}

/**
 * PropGroupBuilder for the `signage` detail category.
 *
 * Builds ALL five era looks up front (they share the same room anchors) and
 * pre-selects the host's current era when one was applied before registration,
 * otherwise 1945.
 */
export const SignageLightingBuilder = (context: PropBuildContext): THREE.Group => {
  const current = context.host.currentEra;
  const initialYear = current ? resolveSupportedYear(current.year) : DEFAULT_ACTIVE_YEAR;
  const initialSpec = current ? extractSignageLighting(current.signage) : undefined;
  const rig = new SignageRig(context.host, initialYear, initialSpec);
  rigs.set(context.host, rig);
  scheduleShadowFix(rig);
  return rig.root;
};

/** PropGroupUpdater for the `signage` detail category. */
export const updateSignageLighting: PropGroupUpdater = (config, context) => {
  requireRig(context.host).applyEra(config);
};

/**
 * Convenience wiring: registers the signage & lighting group under the
 * `signage` key on a CafeScene. Returns the host for chaining.
 */
export function registerSignageLighting(host: CafeScene): CafeScene {
  host.registerPropGroup(SIGNAGE_PROP_GROUP_KEY, SignageLightingBuilder, updateSignageLighting);
  return host;
}

/**
 * Tears the rig down (cancels animations, disposes geometry/materials) and
 * unregisters the group. Returns false when nothing was registered.
 */
export function disposeSignageLighting(host: CafeScene): boolean {
  const rig = rigs.get(host);
  if (!rig) return false;
  rigs.delete(host);
  rig.dispose();
  host.unregisterPropGroup(SIGNAGE_PROP_GROUP_KEY);
  return true;
}

/** Declarative descriptor for registry-style integrations. */
export const SIGNAGE_PROP_GROUP = {
  key: SIGNAGE_PROP_GROUP_KEY,
  build: SignageLightingBuilder,
  update: updateSignageLighting,
  strategy: 'crossfade',
} as const;
