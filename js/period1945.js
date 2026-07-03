/**
 * Era pack stub — 1945 Post-War Coffee Bar.
 *
 * This is a placeholder. The full 1945 era pack will be implemented by a
 * downstream task that adds furniture, decor, coffee equipment, menu board,
 * audio config, and lighting overrides specific to the post-war era.
 */

export default {
  year: 1945,
  name: 'Post-War Coffee Bar',
  palette: '#8B7355',

  /**
   * Build era-specific content into the given group.
   * @param {import('three').Group} _group
   */
  build(_group) {
    // Era-specific content will be added by the downstream era pack task
  },

  /**
   * Dispose era-specific content.
   * @param {import('three').Group} _group
   */
  dispose(_group) {
    // Cleanup will be handled by the downstream era pack task
  },

  lighting: {
    ambientIntensity: 0.6,
    ambientColor: '#fff0d0',
    directionalIntensity: 1.2,
    directionalColor: '#fff5e0',
    directionalPosition: [5, 8, 3],
    point1Intensity: 0.8,
    point1Color: '#ffd080',
    point1Position: [-3, 3, 2],
    point2Intensity: 0.6,
    point2Color: '#ffe0a0',
    point2Position: [3, 3, -2],
  },

  audio: {
    deviceName: 'wireless set',
    volume: 0.35,
  },

  menuBoard: 'Coffee ............ 5d\nTea ............... 3d\nBun ............... 4d',
};
