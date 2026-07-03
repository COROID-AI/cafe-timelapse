/**
 * Era pack stub — 1965 Mod Coffeehouse.
 *
 * Placeholder. Full era pack will be implemented by a downstream task.
 */

export default {
  year: 1965,
  name: 'Mod Coffeehouse',
  palette: '#E0913A',

  build(_group) {
    // Era-specific content added by downstream task
  },

  dispose(_group) {
    // Cleanup by downstream task
  },

  lighting: {
    ambientIntensity: 0.7,
    ambientColor: '#ffe8c0',
    directionalIntensity: 1.5,
    directionalColor: '#ffffff',
    directionalPosition: [5, 8, 3],
    point1Intensity: 1.0,
    point1Color: '#ffd060',
    point1Position: [-3, 3, 2],
    point2Intensity: 0.8,
    point2Color: '#ffe0a0',
    point2Position: [3, 3, -2],
  },

  audio: {
    deviceName: 'jukebox',
    volume: 0.4,
  },

  menuBoard: 'Coffee ............ 15¢\nEspresso ......... 25¢\nCappuccino ....... 30¢',
};
