/**
 * PeriodManager — Central controller for switching between eras.
 *
 * Responsibilities:
 *  - Register era packs (period1945.js … period2025.js)
 *  - Switch the active year via setYear()
 *  - Call the era pack's build()/dispose() lifecycle hooks
 *  - Emit 'yearchange' events so the engine and UI can react
 *
 * Lifecycle:
 *  1. register(year, package)  — called at boot for each era
 *  2. setYear(year)            — called by the timeline slider
 *     → calls previous pack.dispose(contentGroup) if present
 *     → calls new pack.build(contentGroup) if present
 *     → dispatches 'yearchange' event
 */

import { SUPPORTED_YEARS, validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

/** @type {Map<number, import('../src/contracts/PeriodPackage.js').PeriodPackage>} */
const _packs = new Map();

/** @type {number|null} */
let _currentYear = null;

/**
 * The THREE.Group that era packs populate / depopulate.
 * Set by the engine on init.
 * @type {import('three').Group|null}
 */
let _contentGroup = null;

/**
 * Simple event listener storage.
 * @type {Map<string, Set<Function>>}
 */
const _listeners = new Map();

/**
 * Register an era pack.
 * @param {number} year
 * @param {import('../src/contracts/PeriodPackage.js').PeriodPackage} pkg
 * @throws if the year is not supported or the package is invalid
 */
export function register(year, pkg) {
  if (!SUPPORTED_YEARS.includes(year)) {
    throw new Error(`Unsupported year: ${year}. Must be one of ${SUPPORTED_YEARS.join(', ')}`);
  }

  const { valid, errors } = validatePeriodPackage(pkg);
  if (!valid) {
    throw new Error(`Invalid period package for ${year}: ${errors.join('; ')}`);
  }

  if (pkg.year !== year) {
    throw new Error(`Package year mismatch: registered as ${year} but package declares ${pkg.year}`);
  }

  _packs.set(year, pkg);
}

/**
 * Switch to a new year. Fires build/dispose lifecycle hooks.
 * @param {number} year - Must be one of SUPPORTED_YEARS
 * @returns {boolean} true if the switch succeeded
 */
export function setYear(year) {
  if (!SUPPORTED_YEARS.includes(year)) {
    console.warn(`[PeriodManager] Ignoring unsupported year: ${year}`);
    return false;
  }

  if (year === _currentYear) {
    return true; // Already there, no-op
  }

  const newPack = _packs.get(year);
  if (!newPack) {
    console.warn(`[PeriodManager] No package registered for year ${year}. ` +
      `Registered: ${[..._packs.keys()].join(', ') || 'none'}`);
    // Still set the year so the UI reflects the selection;
    // era content will populate when the pack is registered.
  }

  // Dispose previous era content
  if (_currentYear !== null && _contentGroup) {
    const oldPack = _packs.get(_currentYear);
    if (oldPack && typeof oldPack.dispose === 'function') {
      try {
        oldPack.dispose(_contentGroup);
      } catch (err) {
        console.error(`[PeriodManager] Error disposing era ${_currentYear}:`, err);
      }
    }
    // Safety: clear any leftover children
    while (_contentGroup.children.length > 0) {
      const child = _contentGroup.children[0];
      _contentGroup.remove(child);
      // Recursively dispose geometries/materials
      child.traverse?.((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose?.());
          } else {
            obj.material.dispose?.();
          }
        }
      });
    }
  }

  const previousYear = _currentYear;
  _currentYear = year;

  // Build new era content
  if (newPack && _contentGroup && typeof newPack.build === 'function') {
    try {
      newPack.build(_contentGroup);
    } catch (err) {
      console.error(`[PeriodManager] Error building era ${year}:`, err);
    }
  }

  // Notify listeners
  _emit('yearchange', {
    year,
    previousYear,
    package: newPack || null,
  });

  return true;
}

/**
 * Get the currently active year.
 * @returns {number|null}
 */
export function getYear() {
  return _currentYear;
}

/**
 * Get the currently active package.
 * @returns {import('../src/contracts/PeriodPackage.js').PeriodPackage|null}
 */
export function getCurrentPackage() {
  return _currentYear !== null ? _packs.get(_currentYear) || null : null;
}

/**
 * Set the THREE.Group that era packs populate.
 * @param {import('three').Group} group
 */
export function setContentGroup(group) {
  _contentGroup = group;
}

/**
 * Get the content group.
 * @returns {import('three').Group|null}
 */
export function getContentGroup() {
  return _contentGroup;
}

/**
 * Get all registered years.
 * @returns {number[]}
 */
export function getRegisteredYears() {
  return [..._packs.keys()].sort((a, b) => a - b);
}

/**
 * Subscribe to events. Currently supports 'yearchange'.
 * @param {string} event
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function on(event, callback) {
  if (!_listeners.has(event)) {
    _listeners.set(event, new Set());
  }
  _listeners.get(event).add(callback);
  return () => _listeners.get(event)?.delete(callback);
}

/**
 * Emit an event to all listeners.
 * @param {string} event
 * @param {*} data
 */
function _emit(event, data) {
  const set = _listeners.get(event);
  if (set) {
    for (const cb of set) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[PeriodManager] Listener error for '${event}':`, err);
      }
    }
  }
}

/**
 * Reset all state (useful for testing).
 */
export function _reset() {
  _packs.clear();
  _currentYear = null;
  _contentGroup = null;
  _listeners.clear();
}

export default {
  SUPPORTED_YEARS,
  register,
  setYear,
  getYear,
  getCurrentPackage,
  setContentGroup,
  getContentGroup,
  getRegisteredYears,
  on,
  _reset,
};
