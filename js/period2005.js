/**
 * Era pack stub — 2005 Third-Wave Indie Café.
 *
 * Placeholder. Full era pack will be implemented by a downstream task.
 */

export default {
  year: 2005,
  name: 'Third-Wave Indie Café',
  palette: '#6B8E5A',

  build(_group) {
    // Era-specific content added by downstream task
  },

  dispose(_group) {
    // Cleanup by downstream task
  },

  lighting: {
    ambientIntensity: 0.8,
    ambientColor: '#fff5e8',
    directionalIntensity: 1.8,
    directionalColor: '#ffffff',
    directionalPosition: [5, 8, 3],
    point1Intensity: 1.2,
    point1Color: '#fff0d0',
    point1Position: [-3, 3, 2],
    point2Intensity: 1.0,
    point2Color: '#ffe8c0',
    point2Position: [3, 3, -2],
  },

  audio: {
    deviceName: 'iPod',
    volume: 0.35,
  },

  menuBoard: 'Pour Over ......... $3.50\nFlat White ........ $3.75\nCold Brew ......... $4.00',
};
