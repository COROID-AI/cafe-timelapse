/**
 * Era pack stub — 1985 Neon Synthwave Café.
 *
 * Placeholder. Full era pack will be implemented by a downstream task.
 */

export default {
  year: 1985,
  name: 'Neon Synthwave Café',
  palette: '#FF2D95',

  build(_group) {
    // Era-specific content added by downstream task
  },

  dispose(_group) {
    // Cleanup by downstream task
  },

  lighting: {
    ambientIntensity: 0.4,
    ambientColor: '#1a1030',
    directionalIntensity: 0.8,
    directionalColor: '#ff60ff',
    directionalPosition: [5, 8, 3],
    point1Intensity: 1.5,
    point1Color: '#ff2d95',
    point1Position: [-3, 3, 2],
    point2Intensity: 1.2,
    point2Color: '#00d4ff',
    point2Position: [3, 3, -2],
  },

  audio: {
    deviceName: 'boombox',
    volume: 0.45,
  },

  menuBoard: 'Coffee ............ $1.25\nLatte ............ $2.00\nMocha ............ $2.50',
};
