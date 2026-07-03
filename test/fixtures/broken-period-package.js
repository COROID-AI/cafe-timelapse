/**
 * @file test/fixtures/broken-period-package.js
 * @description A deliberately broken PeriodPackage fixture for validation tests.
 *
 * This fixture is missing the `coffeeMachine` key to demonstrate that
 * validatePeriodPackage() throws on missing top-level keys.
 */

/**
 * Create a deliberately broken PeriodPackage (missing coffeeMachine).
 * @returns {Object} a broken package that will fail validation
 */
export function createBrokenPackage() {
  return {
    meta: {
      year: 1945,
      name: 'Broken Package',
    },
    furniture: [],
    decor: [],
    // coffeeMachine is deliberately MISSING
    menu: {
      boardType: 'chalkboard',
      items: [],
    },
    musicSource: {
      model: 'wireless-set',
      trackId: 'test-track',
    },
    wallPosters: [],
    tableware: {
      cupStyle: 'enamel-mug',
      plateStyle: 'enamel-plate',
      cutleryStyle: 'basic-metal',
    },
    signage: {
      exteriorType: 'painted',
    },
    lighting: {
      ambientType: 'tungsten',
      ambientIntensity: 0.7,
    },
    counterTech: {
      posType: 'manual-till',
    },
    patrons: {
      appearances: [],
    },
    sfx: {
      murmur: 'murmur.mp3',
      machineHiss: 'hiss.mp3',
      clatter: 'clatter.mp3',
    },
    navigationHotspots: [],
  };
}

export default { createBrokenPackage };
