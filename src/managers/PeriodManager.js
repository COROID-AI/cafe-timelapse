/**
 * @file src/managers/PeriodManager.js
 * Owns the active era, the incoming era, and the crossfade transition state.
 *
 * Public API: setPeriod(year, animate=true).
 *
 * On change:
 *  - Builds the new era group via the era module factory.
 *  - Tweens the old group out (opacity 1→0, scale 1→0.98 over 800ms) and the
 *    new group in (0→1, 0.98→1).
 *  - Swaps audio (music + SFX) with a 600ms crossfade via AudioManager.
 *  - Updates CSS custom properties on body[data-era] for HUD retheme.
 *  - Emits 'period:changed' for the inspector / badge.
 *
 * Handles interruption: if a transition is mid-flight when a new one is
 * requested, the new target replaces the pending one (old group is removed
 * immediately, new target becomes the only active transition).
 */
import { PERIOD_PACKAGE_FIELDS, easeInOutCubic } from '../contracts/PeriodPackage.js';
import era1945 from '../eras/1945.js';
import era1965 from '../eras/1965.js';
import era1985 from '../eras/1985.js';
import era2005 from '../eras/2005.js';
import era2025 from '../eras/2025.js';

const ERA_FACTORIES = {
  1945: era1945,
  1965: era1965,
  1985: era1985,
  2005: era2005,
  2025: era2025
};

export default class PeriodManager {
  /**
   * @param {{renderer:object, audio:object, onPeriodChanged?:Function}} opts
   */
  constructor({ renderer, audio, onPeriodChanged }) {
    this.renderer = renderer;
    this.audio = audio;
    this.onPeriodChanged = onPeriodChanged;

    this.activePackage = null; // {pkg, group}
    this.transition = null; // {fromGroup, toGroup, toPkg, start, dur, raf}
    this.currentYear = null;
  }

  /** Validate a PeriodPackage object against the contract. */
  validatePackage(pkg) {
    for (const field of PERIOD_PACKAGE_FIELDS) {
      if (pkg[field] === undefined || pkg[field] === null) {
        console.error(`[PeriodManager] Era package missing required field "${field}".`);
        return false;
      }
    }
    return true;
  }

  /**
   * Transition to a new year.
   * @param {number} year
   * @param {boolean} [animate=true]
   */
  setPeriod(year, animate = true) {
    const factory = ERA_FACTORIES[year];
    if (!factory) {
      console.error(`[PeriodManager] No era factory for year ${year}`);
      return;
    }

    // If same year and no mid-transition, do nothing.
    if (this.currentYear === year && !this.transition) return;

    const pkg = factory();
    if (!this.validatePackage(pkg)) {
      console.error(`[PeriodManager] Era ${year} package invalid; aborting.`);
      return;
    }

    // --- Handle interruption ---
    // If a transition is mid-flight, finalize the outgoing removal immediately.
    if (this.transition) {
      this._finalizeTransition(true);
    }

    this.currentYear = year;

    if (!this.activePackage || !animate) {
      // First load or non-animated: instant mount.
      if (this.activePackage) {
        this.renderer.unmountEraGroup(this.activePackage.group);
      }
      this.renderer.mountEraGroup(pkg.group);
      this._applyLighting(pkg);
      this.activePackage = { pkg, group: pkg.group };
      this._commitEra(pkg);
      return;
    }

    // --- Animated crossfade ---
    const toGroup = pkg.group;
    toGroup.scale.set(0.98, 0.98, 0.98);
    this._setGroupOpacity(toGroup, 0);
    this.renderer.mountEraGroup(toGroup);

    const fromGroup = this.activePackage.group;

    this.transition = {
      fromGroup,
      toGroup,
      toPkg: pkg,
      start: performance.now(),
      dur: 800,
      interrupted: false
    };

    // Audio crossfade
    this.audio.playMusicFor(pkg.id, 600);

    this._tickTransition();
  }

  _tickTransition() {
    if (!this.transition) return;
    const { fromGroup, toGroup, toPkg, start, dur } = this.transition;
    const elapsed = performance.now() - start;
    const t = Math.min(1, elapsed / dur);
    const e = easeInOutCubic(t);

    this._setGroupOpacity(fromGroup, 1 - e);
    fromGroup.scale.setScalar(1 - 0.02 * e);
    this._setGroupOpacity(toGroup, e);
    toGroup.scale.setScalar(0.98 + 0.02 * e);

    // Apply new lighting partway through for a smoother blend.
    if (t >= 0.5 && this.activePackage && this.activePackage.pkg !== toPkg) {
      this._applyLighting(toPkg);
    }

    if (t < 1) {
      this.transition.raf = requestAnimationFrame(() => this._tickTransition());
    } else {
      this._finalizeTransition(false);
    }
  }

  /**
   * Finalize (or cancel) the current transition.
   * @param {boolean} interrupted - true if a new transition pre-empted this one.
   */
  _finalizeTransition(interrupted) {
    if (!this.transition) return;
    if (this.transition.raf) cancelAnimationFrame(this.transition.raf);

    const { fromGroup, toGroup, toPkg } = this.transition;

    if (interrupted) {
      // Old outgoing group: remove immediately.
      this.renderer.unmountEraGroup(fromGroup);
      // The toGroup of the interrupted transition becomes the fromGroup of the
      // next one, but setPeriod() builds a brand-new group, so we must also
      // remove the interrupted toGroup to avoid duplicates.
      this.renderer.unmountEraGroup(toGroup);
      this.activePackage = null;
    } else {
      // Clean completion: remove old group, promote new one.
      this.renderer.unmountEraGroup(fromGroup);
      this._setGroupOpacity(toGroup, 1);
      toGroup.scale.setScalar(1);
      this._applyLighting(toPkg);
      this.activePackage = { pkg: toPkg, group: toGroup };
      this._commitEra(toPkg);
    }

    this.transition = null;
  }

  /** Apply the package's lighting profile + CSS vars + emit change event. */
  _commitEra(pkg) {
    this._applyLighting(pkg);
    this._applyHud(pkg);
    this.currentYear = pkg.year;
    if (this.onPeriodChanged) this.onPeriodChanged(pkg);
  }

  _applyLighting(pkg) {
    if (this.renderer && this.renderer.applyLightingProfile) {
      this.renderer.applyLightingProfile(pkg);
    }
  }

  _applyHud(pkg) {
    const body = document.body;
    body.setAttribute('data-era', pkg.id);
    if (pkg.hud && pkg.hud.cssVars) {
      for (const [k, v] of Object.entries(pkg.hud.cssVars)) {
        body.style.setProperty(k, v);
      }
    }
  }

  /** Walk a group's materials and set opacity (enabling transparent as needed). */
  _setGroupOpacity(group, opacity) {
    group.traverse((obj) => {
      if (obj.isMesh || obj.isPoints || obj.isLine) {
        const mat = obj.material;
        if (Array.isArray(mat)) {
          for (const m of mat) this._setMatOpacity(m, opacity);
        } else if (mat) {
          this._setMatOpacity(mat, opacity);
        }
      }
    });
  }

  _setMatOpacity(material, opacity) {
    // Skip glass materials that are already intentionally transparent? We still
    // fade them for the transition, then restore full opacity on completion.
    material.transparent = opacity < 1 || material.userData.glassy === true;
    material.opacity = opacity;
    material.needsUpdate = true;
  }

  getActivePackage() {
    return this.activePackage ? this.activePackage.pkg : null;
  }
}
