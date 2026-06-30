/**
 * PeriodManager — orchestrates era asset swaps driven by the timeline.
 *
 * Listens for the `period-change` CustomEvent dispatched by the TimelineUI and,
 * for every change, cross-fades the outgoing era's Three.js Group out while
 * fading the incoming era's Group in, then fully disposes the outgoing
 * Group's GPU resources. The result is a smooth "the café transforms in front
 * of your eyes" transition rather than a hard cut.
 *
 * Only one era is fully active once a transition settles; outgoing assets are
 * removed and disposed the instant their fade completes so the scene graph
 * never accumulates stale objects across swaps.
 *
 * Era registration contract
 * --------------------------
 * Downstream era-asset tasks register one builder per year:
 *
 *   periodManager.registerEra(1945, (ctx) => {
 *     const group = new ctx.THREE.Group();
 *     // ... furniture, coffee machine, menu+prices, music device, posters,
 *     //     tableware, signage/lighting, counter tech, patrons ...
 *     return group;
 *   }, { name: 'Post-war Café' });
 *
 * A builder MUST return a THREE.Group. Every mesh should use an opacity-aware
 * material (MeshStandardMaterial / MeshBasicMaterial) so the fade reads well.
 *
 * Lifecycle events (decoupled hooks for AudioManager / info panels):
 *   - `period:ready`          { year }  — an era group was mounted
 *   - `period:transition-start`{ from, to } — cross-fade begins
 *   - `period:transition-end`  { year, forced } — cross-fade finished
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** Smooth ease-in-out cubic curve for a natural fade. */
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ---------------------------------------------------------------------------
// Material helpers
// ---------------------------------------------------------------------------

/** Recursively gather every material referenced under an object (deduped). */
function collectMaterials(object) {
  const set = new Set();
  object.traverse((child) => {
    if (!(child.isMesh || child.isInstancedMesh)) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (m && !set.has(m)) set.add(m);
    }
  });
  return [...set];
}

/** Snapshot the transparent/opacity state of every material under a group. */
function captureMaterialState(group) {
  return collectMaterials(group).map((material) => ({
    material,
    transparent: material.transparent,
    opacity: material.opacity,
  }));
}

/** Fade every material in a captured state to the given opacity. */
function applyOpacity(states, opacity) {
  const o = Math.max(0, Math.min(1, opacity));
  for (const { material } of states) {
    material.transparent = o < 1; // transparent only while mid-fade
    material.opacity = o;
  }
}

/** Restore materials to the state captured before the transition. */
function restoreMaterialState(states) {
  for (const s of states) {
    s.material.transparent = s.transparent;
    s.material.opacity = s.opacity;
  }
}

/** Recursively dispose geometries, materials and textures under a group. */
function disposeGroupResources(group) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  group.traverse((child) => {
    if (!(child.isMesh || child.isInstancedMesh)) return;
    if (child.geometry) geometries.add(child.geometry);

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (!m) continue;
      materials.add(m);
      for (const key of [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'emissiveMap',
        'aoMap',
        'alphaMap',
        'bumpMap',
        'displacementMap',
      ]) {
        const tex = m[key];
        if (tex) textures.add(tex);
      }
    }
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}

// ---------------------------------------------------------------------------
// PeriodManager
// ---------------------------------------------------------------------------

export class PeriodManager {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Object3D} mountTarget Group/scene era groups attach to (the café shell).
   * @param {object} [options]
   * @param {number} [options.duration=1500] Cross-fade duration in milliseconds.
   */
  constructor(scene, mountTarget, options = {}) {
    this.scene = scene;
    this.mountTarget = mountTarget || scene;
    this.duration = options.duration ?? 1500;

    /** @type {Map<number, { builder: Function, meta: object }>} */
    this.yearBuilders = new Map();

    this.currentYear = null;
    this.currentGroup = null;

    /** Active transition state or null. */
    this._transition = null;

    this._onPeriodChange = this._handlePeriodChange.bind(this);
  }

  /** Shared context handed to era builders. */
  get ctx() {
    return {
      THREE,
      CAFE_DIMENSIONS: window.Cafe?.CAFE_DIMENSIONS,
    };
  }

  /**
   * Register a builder that produces the THREE.Group for a given year.
   * If the year is already the active one and nothing is mounted yet, it is
   * mounted immediately (handles the load-time registration race).
   *
   * @param {number} year
   * @param {(ctx: object) => THREE.Group} builder
   * @param {object} [meta] Optional era metadata (name, menu, prices, …).
   */
  registerEra(year, builder, meta) {
    this.yearBuilders.set(year, { builder, meta });
    if (this.currentYear === year && !this.currentGroup && !this._transition) {
      this._mountInstant(year);
    }
    return this;
  }

  /** Optional metadata accessor (e.g. menu/prices for an info panel). */
  getMeta(year) {
    return this.yearBuilders.get(year)?.meta ?? null;
  }

  /**
   * Subscribe to timeline `period-change` events and mount the initial era.
   * @param {number} [initialYear] Defaults to the timeline's current year.
   */
  start(initialYear) {
    window.addEventListener('period-change', this._onPeriodChange);
    this.currentYear =
      initialYear ?? window.Cafe?.timeline?.currentYear ?? null;
    if (this.currentYear != null) this._mountInstant(this.currentYear);
    return this;
  }

  /** Per-frame update; call from the render loop with the delta in seconds. */
  update(delta) {
    const t = this._transition;
    if (!t) return;

    t.elapsed += Math.max(0, delta) * 1000;
    const k = Math.min(1, t.elapsed / this.duration);
    const eased = easeInOutCubic(k);

    if (t.outgoing) applyOpacity(t.outgoingStates, 1 - eased);
    applyOpacity(t.incomingStates, eased);

    if (k >= 1) this._completeTransition(false);
  }

  /** Is a cross-fade currently in progress? */
  get isTransitioning() {
    return this._transition !== null;
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  _handlePeriodChange(event) {
    const { year } = event.detail;
    if (year == null || year === this.currentYear) return;
    this.transitionTo(year);
  }

  /** Build and name a fresh era group from a registered builder. */
  _buildGroup(year, entry) {
    const group = entry.builder(this.ctx);
    if (!group) return null;
    group.name = `Era-${year}`;
    group.userData.year = year;
    if (entry.meta) group.userData.meta = entry.meta;
    return group;
  }

  /** Mount an era instantly at full opacity (initial load / late register). */
  _mountInstant(year) {
    const entry = this.yearBuilders.get(year);
    if (!entry) return; // not registered yet — registerEra() will mount later

    const group = this._buildGroup(year, entry);
    if (!group) return;

    this.mountTarget.add(group);
    this.currentGroup = group;
    window.dispatchEvent(
      new CustomEvent('period:ready', { detail: { year } })
    );
  }

  /**
   * Cross-fade from the current era into the era for `year`.
   * @param {number} year
   */
  transitionTo(year) {
    const entry = this.yearBuilders.get(year);
    if (!entry) return; // era not registered yet — ignore

    // Finalize any in-flight transition before starting a new one.
    if (this._transition) this._completeTransition(true);

    const incoming = this._buildGroup(year, entry);
    if (!incoming) return;

    this.mountTarget.add(incoming);
    const incomingStates = captureMaterialState(incoming);
    applyOpacity(incomingStates, 0); // start invisible

    const outgoing = this.currentGroup;
    const outgoingStates = outgoing ? captureMaterialState(outgoing) : [];

    const fromYear = this.currentYear;
    this._transition = {
      fromYear,
      toYear: year,
      outgoing,
      outgoingStates,
      incoming,
      incomingStates,
      elapsed: 0,
    };

    this.currentYear = year;
    window.dispatchEvent(
      new CustomEvent('period:transition-start', {
        detail: { from: fromYear, to: year },
      })
    );
  }

  /** Finish the active transition: dispose outgoing, reveal incoming. */
  _completeTransition(forced) {
    const t = this._transition;
    if (!t) return;

    if (t.outgoing) {
      this.mountTarget.remove(t.outgoing);
      disposeGroupResources(t.outgoing);
    }
    restoreMaterialState(t.incomingStates); // back to opacity 1, transparent off

    this.currentGroup = t.incoming;
    this._transition = null;

    window.dispatchEvent(
      new CustomEvent('period:transition-end', {
        detail: { year: t.toYear, forced: !!forced },
      })
    );
  }

  /** Tear down: unsubscribe, finish any transition, dispose current era. */
  dispose() {
    window.removeEventListener('period-change', this._onPeriodChange);
    if (this._transition) this._completeTransition(true);
    if (this.currentGroup) {
      this.mountTarget.remove(this.currentGroup);
      disposeGroupResources(this.currentGroup);
      this.currentGroup = null;
    }
    this.currentYear = null;
  }
}

export default PeriodManager;
