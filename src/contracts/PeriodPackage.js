/**
 * Shared contract type for a single café time-period package.
 *
 * A PeriodPackage bundles together every period-specific asset and data slice
 * (furniture, decor, menu/prices, music source, posters, tableware, signage,
 * lighting, counter technology, patron outfits, etc.) needed to fully render
 * the café for one year.
 *
 * Downstream tasks populate concrete instances of these for 1945, 1965, 1985,
 * 2005, and 2025. This scaffold only declares the shape so import paths are
 * stable and type-checked early.
 */

export const PERIOD_YEARS = [1945, 1965, 1985, 2005, 2025];

/**
 * Every top-level field a PeriodPackage must populate.  Used by
 * {@link validatePeriodPackage} for the schema check referenced in the
 * acceptance criteria.
 *
 * @type {readonly string[]}
 */
export const REQUIRED_FIELDS = Object.freeze([
  'year',
  'name',
  'furniture',
  'coffeeEquipment',
  'menu',
  'music',
  'signage',
  'tableware',
  'lighting',
  'counterTechnology',
  'patrons',
]);

/**
 * @typedef {Object} PeriodPackage
 * @property {number} year                   - The year this package targets.
 * @property {string} name                   - Human-readable period label.
 * @property {Object} furniture              - Furniture + decor descriptor.
 * @property {Object} coffeeEquipment        - Coffee machine + brewing gear.
 * @property {Object} menu                   - Menu board items + prices.
 * @property {Object} music                  - Music source + style descriptor.
 * @property {Object} signage                - Wall posters + advertisements.
 * @property {Object} tableware              - Cups, plates, cutlery.
 * @property {Object} lighting               - Lighting + signage descriptor.
 * @property {Object} counterTechnology      - Till/POS technology descriptor.
 * @property {Object} patrons                - Patron outfits, hair, gadgets.
 * @property {Function} [build]              - Factory returning a THREE.Group.
 */

/**
 * Validates a PeriodPackage against the required-field schema.
 *
 * @param {*} pkg - The object to validate.
 * @returns {{ valid: boolean, missing: string[], errors: string[] }}
 */
export function validatePeriodPackage(pkg) {
  const missing = [];
  const errors = [];

  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    return {
      valid: false,
      missing: [...REQUIRED_FIELDS],
      errors: ['Package is not a plain object'],
    };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in pkg) || pkg[field] == null) {
      missing.push(field);
    } else if (
      typeof pkg[field] === 'object' &&
      !Array.isArray(pkg[field]) &&
      Object.keys(pkg[field]).length === 0
    ) {
      errors.push(`Field "${field}" is present but empty`);
    }
  }

  if ('year' in pkg && typeof pkg.year !== 'number') {
    errors.push(`"year" must be a number, got ${typeof pkg.year}`);
  }
  if ('name' in pkg && (typeof pkg.name !== 'string' || pkg.name.length === 0)) {
    errors.push('"name" must be a non-empty string');
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

export default {};
