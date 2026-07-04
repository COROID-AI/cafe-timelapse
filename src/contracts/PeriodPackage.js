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
 */

export default {};
