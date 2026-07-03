/**
 * Era pack stub — 2025 Modern Specialty Café.
 *
 * Placeholder. Full era pack will be implemented by a downstream task.
 */

export default {
  year: 2025,
  name: 'Modern Specialty Café',
  palette: '#D4A574',

  build(_group) {
    // Era-specific content added by downstream task
  },

  dispose(_group) {
    // Cleanup by downstream task
  },

  lighting: {
    ambientIntensity: 0.9,
    ambientColor: '#fff8f0',
    directionalIntensity: 2.0,
    directionalColor: '#ffffff',
    directionalPosition: [5, 8, 3],
    point1Intensity: 1.5,
    point1Color: '#fff5e0',
    point1Position: [-3, 3, 2],
    point2Intensity: 1.2,
    point2Color: '#ffe8d0',
    point2Position: [3, 3, -2],
  },

  audio: {
    deviceName: 'phone',
    volume: 0.3,
  },

  menuBoard: 'Single Origin ..... $5.50\nOat Milk Latte .... $5.75\nNitro Cold Brew ... $6.00',
};
