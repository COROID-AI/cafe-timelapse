/**
 * @file src/contracts/PeriodPackage.js
 * @callback PeriodFactory
 * @returns {PeriodPackage} A fully-built era scene package.
 *
 * Every era module under src/eras/ exports a factory function whose return
 * value must satisfy this PeriodPackage shape. PeriodManager.validatePackage()
 * enforces the presence of each top-level field at runtime so a malformed era
 * fails loudly instead of rendering an empty room.
 */

/**
 * @typedef {Object} PeriodPalette
 * @property {number} primary   - dominant accent hex color
 * @property {number} accent    - secondary accent hex color
 * @property {number} wood      - wood tone hex color
 * @property {number} metal     - metal tone hex color
 * @property {number} fabric    - upholstery/fabric hex color
 */

/**
 * @typedef {Object} PeriodLighting
 * @property {number} ambient     - ambient/hemisphere color hex
 * @property {number} ambientI    - ambient intensity (0..2)
 * @property {number} key         - key light color hex
 * @property {number} keyI        - key light intensity (0..3)
 * @property {number} fill        - fill light color hex
 * @property {number} fillI       - fill light intensity (0..2)
 * @property {number} exposure    - ACESFilmic tone-mapping exposure (0.6..1.6)
 */

/**
 * @typedef {Object} PeriodMenuItem
 * @property {string} name  - menu item label
 * @property {string} price - period-formatted price string, e.g. "5¢", "$3.50"
 */

/**
 * @typedef {Object} PeriodHotspot
 * @property {string} id     - unique key matching an entry in hotspot-data.js
 * @property {[number,number,number]} position - local position within era group
 * @property {number} [radius] - raycast sphere radius (default 0.5)
 */

/**
 * @typedef {Object} PeriodPackage
 * @property {string} id        - era id, e.g. "1945"
 * @property {number} year      - display year
 * @property {string} label     - short era name, e.g. "Post-War"
 * @property {string} eraName   - longer descriptive name
 * @property {PeriodPalette} palette
 * @property {PeriodLighting} lighting
 * @property {THREE.Group} group - root THREE.Group of all era geometry
 * @property {PeriodMenuItem[]} menu - menu board items with era prices
 * @property {PeriodHotspot[]} hotspots - clickable hotspots
 * @property {string} musicId - music loop id for AudioManager
 * @property {string} sfxType - coffee-machine SFX type ("percolator"|"steam")
 * @property {{cssVars: Record<string,string>}} hud - CSS custom props to apply
 */

export const PERIOD_PACKAGE_FIELDS = [
  'id',
  'year',
  'label',
  'eraName',
  'palette',
  'lighting',
  'group',
  'menu',
  'hotspots',
  'musicId',
  'sfxType',
  'hud'
];

export const PERIOD_YEARS = [1945, 1965, 1985, 2005, 2025];

/** Shared easeInOutCubic for synchronized transitions. */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
