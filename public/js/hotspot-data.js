/**
 * @file public/js/hotspot-data.js
 * @description
 * Browser-accessible navigation hotspot positions and pre-built era
 * summaries for all 5 eras.
 *
 * The full PeriodPackage modules (js/period1945.js ...) live outside the
 * public/ serve root and import from src/contracts/, so they cannot be
 * loaded directly by the browser. This module mirrors the
 * navigationHotspots arrays and the key diff-able fields so the
 * inspection-mode controller and HUD overlay can operate without a
 * dynamic PeriodPackage loader.
 *
 * Data is derived verbatim from the era packs in js/period*.js.
 */

/**
 * Pre-built era summaries — one entry per supported year.
 * These are the fields extracted by buildEraSummary() in era-data.js,
 * pre-computed here so the HUD diff works without loading full packages.
 * @type {Record<number, object>}
 */
export const ERA_SUMMARIES = {
  1945: {
    year: 1945,
    name: 'Post-War Coffee Bar',
    musicDevice: 'Wireless Set',
    trackName: 'Post-War Swing',
    coffeeMachine: 'Gaggia Classica (lever group head)',
    coffeeType: 'lever-espresso',
    counterTech: 'manual-till',
    paymentMethods: 'Cash only',
    cupStyle: 'enamel-mug-white-rim',
    lighting: 'tungsten',
    signage: 'painted',
    exteriorText: 'COFFEE BAR',
  },
  1965: {
    year: 1965,
    name: 'Mod Coffeehouse',
    musicDevice: 'Jukebox',
    trackName: 'Mod Coffeehouse',
    coffeeMachine: 'Faema E61',
    coffeeType: 'lever-espresso',
    counterTech: 'mechanical-register',
    paymentMethods: 'Cash only',
    cupStyle: 'melamine-cup-mod-orange',
    lighting: 'tungsten',
    signage: 'vinyl',
    exteriorText: 'THE COFFEE HOUSE',
  },
  1985: {
    year: 1985,
    name: 'Neon Synthwave Cafe',
    musicDevice: 'Boombox',
    trackName: 'Neon Synthwave',
    coffeeMachine: 'La Marzocco GS Two-Group',
    coffeeType: 'auto-espresso',
    counterTech: 'electronic-register',
    paymentMethods: 'Cash, credit card (magnetic stripe)',
    cupStyle: 'branded-ceramic-mug-1985',
    lighting: 'neon',
    signage: 'neon',
    exteriorText: 'CAFE ESPRESSO',
  },
  2005: {
    year: 2005,
    name: 'Third-Wave Indie Cafe',
    musicDevice: 'iPod',
    trackName: 'Third-Wave Indie Folk',
    coffeeMachine: 'Slayer Espresso Single Group',
    coffeeType: 'auto-espresso',
    counterTech: 'touchscreen-pos',
    paymentMethods: 'Cash, credit/debit card (magnetic stripe)',
    cupStyle: 'paper-to-go-cup-2005',
    lighting: 'warm-led',
    signage: 'painted',
    exteriorText: 'THE ROASTERY',
  },
  2025: {
    year: 2025,
    name: 'Modern Specialty Cafe',
    musicDevice: 'Phone',
    trackName: 'Modern Ambient',
    coffeeMachine: 'La Marzocco Linea PB Multi-Group',
    coffeeType: 'auto-espresso',
    counterTech: 'contactless',
    paymentMethods: 'Contactless (Apple Pay, Google Pay, tap card)',
    cupStyle: 'double-walled-borosilicate-glass-2025',
    lighting: 'warm-led',
    signage: 'led',
    exteriorText: 'SPECIALTY COFFEE',
  },
};

/**
 * Navigation hotspots for all 5 eras.
 * Each hotspot has: id, label, cameraPosition, lookAt, fov, and a
 * screenPosition [x%, y%] for placing the clickable marker on the 2D
 * viewport (derived from the 3D cameraPosition projected to screen).
 * @type {Record<number, object[]>}
 */
export const ERA_HOTSPOTS = {
  1945: [
    {
      id: 'counter-closeup',
      label: 'Counter & Espresso Machine',
      cameraPosition: [1.8, 1.6, -1.0],
      lookAt: [2.2, 0.95, -2.5],
      fov: 45,
      screenPosition: [62, 45],
    },
    {
      id: 'wireless-set-closeup',
      label: 'Bakelite Wireless Set',
      cameraPosition: [-2.2, 1.4, -1.5],
      lookAt: [-3.0, 0.9, -2.0],
      fov: 40,
      screenPosition: [22, 52],
    },
    {
      id: 'pastry-case-closeup',
      label: 'Glass Pastry Case',
      cameraPosition: [1.2, 1.5, -1.5],
      lookAt: [1.8, 0.95, -2.5],
      fov: 50,
      screenPosition: [55, 48],
    },
    {
      id: 'seating-area',
      label: 'Seating Area',
      cameraPosition: [-2.5, 1.7, 3.0],
      lookAt: [0, 0.5, 1.25],
      fov: 60,
      screenPosition: [30, 65],
    },
    {
      id: 'wall-posters-closeup',
      label: 'War Posters & Notices',
      cameraPosition: [0, 1.8, -2.0],
      lookAt: [0, 2.2, -4],
      fov: 55,
      screenPosition: [50, 25],
    },
  ],

  1965: [
    {
      id: 'jukebox-closeup',
      label: 'Jukebox & Neon Ring',
      cameraPosition: [-1.8, 1.6, -2.5],
      lookAt: [-2.8, 1.6, -3.8],
      fov: 40,
      screenPosition: [28, 42],
    },
    {
      id: 'espresso-machine-closeup',
      label: 'Faema E61 Espresso Machine',
      cameraPosition: [-0.2, 1.6, -1.5],
      lookAt: [-0.4, 0.95, -2.5],
      fov: 45,
      screenPosition: [48, 45],
    },
    {
      id: 'lava-lamp-closeup',
      label: 'Lava Lamp',
      cameraPosition: [-1.4, 1.5, -1.8],
      lookAt: [-0.8, 0.95, -2.5],
      fov: 35,
      screenPosition: [38, 50],
    },
    {
      id: 'seating-area',
      label: 'Seating Area & Booths',
      cameraPosition: [-2.5, 1.7, 3.0],
      lookAt: [0, 0.5, 1.25],
      fov: 60,
      screenPosition: [30, 65],
    },
    {
      id: 'wall-art-closeup',
      label: 'Op-Art & Go-Go Posters',
      cameraPosition: [0, 1.8, -2.0],
      lookAt: [0, 2.2, -4],
      fov: 55,
      screenPosition: [50, 25],
    },
  ],

  1985: [
    {
      id: 'boombox-closeup',
      label: 'Boombox',
      cameraPosition: [2.8, 1.3, -1.5],
      lookAt: [2.2, 1.0, -2.5],
      fov: 35,
      screenPosition: [72, 42],
    },
    {
      id: 'arcade-cabinet-closeup',
      label: 'Arcade Cabinet',
      cameraPosition: [-2.5, 1.5, 2.5],
      lookAt: [-3.8, 1.2, 2.8],
      fov: 40,
      screenPosition: [18, 55],
    },
    {
      id: 'neon-espresso-sign-closeup',
      label: 'Neon "ESPRESSO" Sign',
      cameraPosition: [-3.0, 2.2, -2.5],
      lookAt: [-4.3, 2.4, -3.9],
      fov: 45,
      screenPosition: [15, 22],
    },
    {
      id: 'neon-open-sign-closeup',
      label: 'Neon "OPEN" Sign',
      cameraPosition: [3.0, 1.8, -2.5],
      lookAt: [4.3, 2.0, -3.9],
      fov: 45,
      screenPosition: [82, 28],
    },
    {
      id: 'espresso-machine-closeup',
      label: 'La Marzocco Espresso Machine',
      cameraPosition: [1.5, 1.4, -1.8],
      lookAt: [2.2, 0.95, -2.8],
      fov: 40,
      screenPosition: [58, 48],
    },
    {
      id: 'seating-area',
      label: 'Seating Area',
      cameraPosition: [-2, 1.6, 2],
      lookAt: [0, 0.5, 1.25],
      fov: 60,
      screenPosition: [28, 62],
    },
  ],

  2005: [
    {
      id: 'pourover-bar-closeup',
      label: 'Pour-Over Bar',
      cameraPosition: [1.8, 1.5, -1.2],
      lookAt: [2.2, 0.95, -2.8],
      fov: 40,
      screenPosition: [62, 45],
    },
    {
      id: 'ipod-dock-closeup',
      label: 'iPod Speaker Dock',
      cameraPosition: [2.6, 1.3, -1.5],
      lookAt: [3.0, 1.0, -2.5],
      fov: 35,
      screenPosition: [75, 42],
    },
    {
      id: 'wifi-chalkboard-closeup',
      label: 'Free Wi-Fi Chalkboard',
      cameraPosition: [-3.0, 1.6, -2.0],
      lookAt: [-4.2, 1.5, -3.8],
      fov: 45,
      screenPosition: [18, 35],
    },
    {
      id: 'communal-table-closeup',
      label: 'Communal Table',
      cameraPosition: [0, 1.5, 2.5],
      lookAt: [0, 0.8, 0.5],
      fov: 55,
      screenPosition: [50, 60],
    },
    {
      id: 'vinyl-poster-wall-closeup',
      label: 'Vinyl Record Wall',
      cameraPosition: [-2.8, 1.8, -2.5],
      lookAt: [-3.8, 2.0, -3.9],
      fov: 45,
      screenPosition: [20, 25],
    },
    {
      id: 'slayer-machine-closeup',
      label: 'Slayer Espresso Machine',
      cameraPosition: [1.5, 1.4, -1.8],
      lookAt: [2.2, 1.0, -2.8],
      fov: 40,
      screenPosition: [55, 48],
    },
  ],

  2025: [
    {
      id: 'contactless-terminal-closeup',
      label: 'Contactless Payment Terminal',
      cameraPosition: [3.2, 1.3, -1.5],
      lookAt: [3.5, 1.0, -2.6],
      fov: 35,
      screenPosition: [78, 42],
    },
    {
      id: 'espresso-machine-closeup',
      label: 'La Marzocco Multi-Group',
      cameraPosition: [1.5, 1.4, -1.8],
      lookAt: [2.2, 1.0, -2.8],
      fov: 40,
      screenPosition: [55, 48],
    },
    {
      id: 'qr-menu-tablet-closeup',
      label: 'QR-Code Menu Tablet',
      cameraPosition: [3.5, 1.3, -1.2],
      lookAt: [3.8, 1.2, -2.5],
      fov: 35,
      screenPosition: [82, 38],
    },
    {
      id: 'bluetooth-speaker-closeup',
      label: 'Phone + Bluetooth Speaker',
      cameraPosition: [2.8, 1.3, -1.5],
      lookAt: [3.0, 1.0, -2.3],
      fov: 35,
      screenPosition: [70, 42],
    },
    {
      id: 'living-wall-closeup',
      label: 'Living Green Wall',
      cameraPosition: [-3.0, 1.8, -2.0],
      lookAt: [-4.5, 2.0, -4.0],
      fov: 45,
      screenPosition: [15, 30],
    },
    {
      id: 'vegan-pastry-case-closeup',
      label: 'Vegan Pastry Case',
      cameraPosition: [1.0, 1.4, -1.2],
      lookAt: [1.2, 1.0, -2.5],
      fov: 40,
      screenPosition: [48, 45],
    },
    {
      id: 'seating-area-closeup',
      label: 'Minimalist Seating Area',
      cameraPosition: [0, 1.5, 2.5],
      lookAt: [0, 0.8, 0.5],
      fov: 55,
      screenPosition: [50, 62],
    },
  ],
};

/**
 * Get the navigation hotspots for a given year.
 * @param {number} year
 * @returns {object[]}
 */
export function getHotspotsForYear(year) {
  return ERA_HOTSPOTS[year] || [];
}

/**
 * Get the pre-built era summary for a given year.
 * @param {number} year
 * @returns {object|null}
 */
export function getEraSummary(year) {
  return ERA_SUMMARIES[year] || null;
}

export default {
  ERA_HOTSPOTS,
  ERA_SUMMARIES,
  getHotspotsForYear,
  getEraSummary,
};
