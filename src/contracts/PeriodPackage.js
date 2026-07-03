/**
 * PeriodPackage — Contract / Interface for era content packs.
 *
 * Each era pack (1945, 1965, 1985, 2005, 2025) must export an object that
 * conforms to this shape. The engine uses it to populate the café interior
 * with period-appropriate furniture, lighting, decor, audio, and metadata.
 *
 * File: js/periodXXXX.js  →  export default { ...PeriodPackage }
 *
 * This module also provides a runtime validator.
 */

/**
 * @typedef {Object} EraLighting
 * @property {number} [ambientIntensity]  - 0–3
 * @property {string} [ambientColor]     - hex string e.g. '#fff5e0'
 * @property {number} [directionalIntensity] - 0–5
 * @property {string} [directionalColor]
 * @property {number[]} [directionalPosition]  - [x,y,z]
 * @property {number} [point1Intensity]
 * @property {string} [point1Color]
 * @property {number[]} [point1Position]
 * @property {number} [point2Intensity]
 * @property {string} [point2Color]
 * @property {number[]} [point2Position]
 */

/**
 * @typedef {Object} EraAudio
 * @property {string} [trackUrl]       - path to period music loop
 * @property {number} [volume]        - 0–1
 * @property {string} [deviceName]    - 'wireless set' | 'jukebox' | 'boombox' | 'iPod' | 'phone'
 * @property {string[]} [sfx]         - ambient SFX paths
 */

/**
 * @typedef {Object} PeriodPackage
 * @property {number} year                       - Must be one of: 1945, 1965, 1985, 2005, 2025
 * @property {string} name                       - Display name e.g. "Post-War Coffee Bar"
 * @property {string} palette                    - CSS-style hex string for UI accent
 * @property {function(import('three').THREE.Group): void} [build] - Called with an empty THREE.Group to populate with era content
 * @property {function(import('three').THREE.Group): void} [dispose] - Called when leaving the era to clean up resources
 * @property {EraLighting} [lighting]            - Lighting overrides for this era
 * @property {EraAudio} [audio]                  - Audio config for this era
 * @property {string} [menuBoard]                - HTML/text for the menu board
 */

/**
 * The canonical list of supported years.
 * @type {number[]}
 */
export const SUPPORTED_YEARS = Object.freeze([1945, 1965, 1985, 2005, 2025]);

/**
 * Validate that an object conforms to the PeriodPackage contract.
 * @param {unknown} pkg
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePeriodPackage(pkg) {
  const errors = [];

  if (!pkg || typeof pkg !== 'object') {
    return { valid: false, errors: ['Package must be an object'] };
  }

  const p = /** @type {Record<string, unknown>} */ (pkg);

  if (typeof p.year !== 'number' || !SUPPORTED_YEARS.includes(p.year)) {
    errors.push(`year must be one of ${SUPPORTED_YEARS.join(', ')}, got ${String(p.year)}`);
  }

  if (typeof p.name !== 'string' || p.name.length === 0) {
    errors.push('name must be a non-empty string');
  }

  if (typeof p.palette !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(p.palette)) {
  errors.push('palette must be a hex color string like "#aabbcc"');
  }

  if (p.build !== undefined && typeof p.build !== 'function') {
    errors.push('build must be a function if provided');
  }

  if (p.dispose !== undefined && typeof p.dispose !== 'function') {
    errors.push('dispose must be a function if provided');
  }

  if (p.lighting !== undefined) {
    const l = /** @type {Record<string, unknown>} */ (p.lighting);
    if (typeof l !== 'object') {
      errors.push('lighting must be an object if provided');
    }
  }

  if (p.audio !== undefined) {
    if (typeof p.audio !== 'object') {
      errors.push('audio must be an object if provided');
    }
  }

  if (p.menuBoard !== undefined && typeof p.menuBoard !== 'string') {
    errors.push('menuBoard must be a string if provided');
  }

  return { valid: errors.length === 0, errors };
}

export default {
  SUPPORTED_YEARS,
  validatePeriodPackage,
};
