/**
 * @file public/js/era-data.js
 * @description
 * Era-specific inspection data and PeriodPackage diff utilities.
 *
 * Provides:
 *   1. INSPECTION_NOTES — per-year, per-hotspot era-accurate descriptions
 *      used by the inspect-mode side panel.
 *   2. buildEraSummary() — extracts key changeable elements from a
 *      PeriodPackage for diffing.
 *   3. diffEras() — compares two era summaries, returns change tokens.
 */

// ---------------------------------------------------------------------------
// Human-readable labels for diff-able music-device models
// ---------------------------------------------------------------------------
const MUSIC_DEVICE_LABELS = {
  'wireless-set': 'Wireless Set',
  jukebox: 'Jukebox',
  boombox: 'Boombox',
  ipod: 'iPod',
  phone: 'Phone',
  speaker: 'Speaker',
};

/**
 * Build a human-readable summary object from a PeriodPackage for diffing.
 *
 * Extracts the key user-facing changeable elements: music device, coffee
 * machine brand/type, counter POS type, cup style, lighting type, and
 * signage type.
 *
 * @param {object} pkg — a validated PeriodPackage
 * @returns {object}
 */
export function buildEraSummary(pkg) {
  return {
    musicDevice: MUSIC_DEVICE_LABELS[pkg.musicSource.model] || pkg.musicSource.model,
    trackName: pkg.musicSource.trackName || pkg.musicSource.trackId,
    coffeeMachine: pkg.coffeeMachine.brand,
    coffeeType: pkg.coffeeMachine.type,
    counterTech: pkg.counterTech.posType,
    paymentMethods: pkg.counterTech.paymentMethods || '',
    cupStyle: pkg.tableware.cupStyle,
    lighting: pkg.lighting.ambientType,
    signage: pkg.signage.exteriorType,
    exteriorText: pkg.signage.exteriorText || '',
  };
}

/**
 * Compare two era summaries and produce a list of change tokens.
 *
 * Each token is a string like "+Jukebox", "\u2212Boombox", "\u2192Faema E61".
 * The caller can join these with spaces for the HUD subtitle.
 *
 * @param {object|null} prevSummary — summary of the previous era (null if none)
 * @param {object} currSummary — summary of the current era
 * @returns {string[]} array of change-token strings
 */
export function diffEras(prevSummary, currSummary) {
  if (!prevSummary) return [];

  const tokens = [];

  // Music device — most visually striking change (+Jukebox, -Boombox)
  if (prevSummary.musicDevice !== currSummary.musicDevice) {
    tokens.push(`+${currSummary.musicDevice}`);
    tokens.push(`\u2212${prevSummary.musicDevice}`);
  }

  // Coffee machine brand
  if (prevSummary.coffeeMachine !== currSummary.coffeeMachine) {
    tokens.push(`\u2192${currSummary.coffeeMachine}`);
  }

  // Counter tech / payment
  if (prevSummary.counterTech !== currSummary.counterTech) {
    tokens.push(`+${currSummary.counterTech}`);
    tokens.push(`\u2212${prevSummary.counterTech}`);
  }

  // Cup style
  if (prevSummary.cupStyle !== currSummary.cupStyle) {
    tokens.push(`+${currSummary.cupStyle}`);
    tokens.push(`\u2212${prevSummary.cupStyle}`);
  }

  // Lighting
  if (prevSummary.lighting !== currSummary.lighting) {
    tokens.push(`+${currSummary.lighting}-lighting`);
    tokens.push(`\u2212${prevSummary.lighting}-lighting`);
  }

  // Signage
  if (prevSummary.signage !== currSummary.signage) {
    tokens.push(`+${currSummary.signage}-sign`);
    tokens.push(`\u2212${prevSummary.signage}-sign`);
  }

  return tokens;
}

/**
 * Produce a compact subtitle string for the HUD from diff tokens.
 * @param {string[]} tokens
 * @returns {string}
 */
export function formatDiffSubtitle(tokens) {
  if (!tokens || tokens.length === 0) return '';
  return tokens.join('  ');
}

// ---------------------------------------------------------------------------
// INSPECTION_NOTES — per-year, per-hotspot era-accurate descriptions.
// Keyed by year -> hotspotId -> { name, note, copy }
// ---------------------------------------------------------------------------

export const INSPECTION_NOTES = {
  1945: {
    'counter-closeup': {
      name: 'Service Counter',
      note: 'Hand-rubbed mahogany counter with a brass-trimmed glass pastry '
        + 'case. The barista pulls espresso shots on a Gaggia lever machine '
        + '\u2014 a post-war luxury after years of rationing.',
      copy: 'Coffee 5\u00a2 \u00b7 Espresso 8\u00a2 \u00b7 Pie 10\u00a2',
    },
    'wireless-set-closeup': {
      name: 'Bakelite Wireless Set',
      note: 'A polished brown Bakelite wireless set tuned to a swing-music '
        + 'broadcast. Radio was the cafe\'s only source of music \u2014 no '
        + 'jukeboxes or recorded playlists yet.',
      copy: 'Now playing: Post-War Swing',
    },
    'pastry-case-closeup': {
      name: 'Glass Pastry Case',
      note: 'A brass-framed glass display case holding fresh apple pie, cherry '
        + 'pie, and glazed donuts. Baking on-site was common to stretch '
        + 'rationed ingredients.',
      copy: 'Fresh pie \u2014 10\u00a2 a slice',
    },
    'seating-area': {
      name: 'Seating Area',
      note: 'Heavy dark-oak chairs around Formica-topped tables with chrome '
        + 'edges and lace doilies. Functional and sturdy \u2014 the post-war '
        + 'emphasis on durability over decoration.',
      copy: 'Formica tables \u00b7 Enamel mugs',
    },
    'wall-posters-closeup': {
      name: 'War Posters & Notices',
      note: 'Framed war-bond posters, a VE-Day victory notice, and a rationing '
        + 'reminder line the back wall. Even in the cafe, the war effort '
        + 'was ever-present in 1945.',
      copy: 'Buy War Bonds \u00b7 Rationing Is Patriotic',
    },
  },

  1965: {
    'jukebox-closeup': {
      name: 'Jukebox',
      note: 'A glowing Wurlitzer-style jukebox with a neon ring and chrome '
        + 'trim. For a nickel, patrons pick from the latest mod-soul and '
        + 'beat-group singles \u2014 a far cry from the wireless set.',
      copy: 'Select a track \u2014 5\u00a2 per play',
    },
    'espresso-machine-closeup': {
      name: 'Faema E61 Espresso Machine',
      note: 'The Faema E61 \u2014 the first lever-less espresso machine, 1961. '
        + 'Its volumetric pump revolutionised espresso: consistent pressure '
        + 'without the barista\'s arm strength, and a steam wand for '
        + 'cappuccinos that became a coffee-bar staple.',
      copy: 'Faema E61 \u00b7 Continuous extraction \u00b7 Steam wand',
    },
    'lava-lamp-closeup': {
      name: 'Lava Lamp',
      note: 'A groovy lava lamp glows on the counter, wax blobs rising and '
        + 'falling in slow motion. The epitome of 1960s counter d\u00e9cor.',
      copy: 'Astro Lamp \u00b7 1963 design',
    },
    'seating-area': {
      name: 'Seating Area & Booths',
      note: 'Vinyl-upholstered booths in mod orange and yellow replace the '
        + 'heavy wooden chairs. Melamine cups in bold colours match the '
        + 'optimistic pop aesthetic of the mid-sixties.',
      copy: 'Vinyl booths \u00b7 Melamine cups',
    },
    'wall-art-closeup': {
      name: 'Op-Art & Go-Go Posters',
      note: 'Optical-art prints and go-go band-night posters replace the war '
        + 'notices. The cafe wall now advertises live music rather than '
        + 'war bonds.',
      copy: 'Live Friday Night \u2014 The Mindbenders',
    },
  },

  1985: {
    'boombox-closeup': {
      name: 'Boombox',
      note: 'A large portable boombox sits on the counter blasting early-MTV '
        + 'synth-pop. The cafe has no permanent music installation \u2014 '
        + 'whoever brings the boombox sets the mood.',
      copy: 'Now playing: Neon Synthwave',
    },
    'arcade-cabinet-closeup': {
      name: 'Arcade Cabinet',
      note: 'A stand-up arcade cabinet glows in the corner, its CRT screen '
        + 'flickering with pixel-art graphics. A quarter buys three lives.',
      copy: '25\u00a2 per play \u00b7 High score: GLM',
    },
    'neon-espresso-sign-closeup': {
      name: 'Neon "ESPRESSO" Sign',
      note: 'A hand-bent neon tube spells "ESPRESSO" in hot pink above the '
        + 'counter. Neon signage was the defining aesthetic of the 1980s '
        + 'cafe \u2014 bright, loud, and unmistakably modern.',
      copy: 'Neon \u00b7 Hot pink \u00b7 120V',
    },
    'neon-open-sign-closeup': {
      name: 'Neon "OPEN" Sign',
      note: 'A flashing "OPEN" neon sign in the window announces the cafe is '
        + 'serving. By the mid-80s, neon had replaced painted signage '
        + 'almost everywhere.',
      copy: 'Flashing neon \u00b7 Open daily',
    },
    'espresso-machine-closeup': {
      name: 'La Marzocco Espresso Machine',
      note: 'A La Marzocco GS two-group espresso machine \u2014 the first with '
        + 'saturated-group technology for thermal stability. By 1985, '
        + 'espresso had gone from lever-pulled to push-button consistent.',
      copy: 'La Marzocco GS \u00b7 Saturated groups',
    },
    'seating-area': {
      name: 'Seating Area',
      note: 'Tubular chrome chairs with pastel cushions, black laminate '
        + 'tables, and branded ceramic mugs. The look is sleek, glossy, '
        + 'and unmistakably eighties.',
      copy: 'Chrome chairs \u00b7 Branded mugs',
    },
  },

  2005: {
    'pourover-bar-closeup': {
      name: 'Pour-Over Bar',
      note: 'A dedicated pour-over bar with glass drippers, a gooseneck '
        + 'kettle, and a timer. The third-wave coffee movement elevated '
        + 'brewing to a craft \u2014 each cup made individually, to order.',
      copy: 'Single-origin \u00b7 Hand-poured \u00b7 3 min brew',
    },
    'ipod-dock-closeup': {
      name: 'iPod Speaker Dock',
      note: 'A white iPod sits in a speaker dock, the cafe\'s entire music '
        + 'library in a pocket. Playlists replaced jukeboxes and boomboxes '
        + '\u2014 the barista is now the DJ.',
      copy: 'Now playing: Third-Wave Indie Folk',
    },
    'wifi-chalkboard-closeup': {
      name: 'Free Wi-Fi Chalkboard',
      note: 'A chalkboard by the counter advertises free Wi-Fi \u2014 the '
        + 'network password is the cafe\'s name. By 2005, wireless internet '
        + 'was the newest amenity cafes competed on.',
      copy: 'Wi-Fi: therostery2005 \u00b7 Free with purchase',
    },
    'communal-table-closeup': {
      name: 'Communal Table',
      note: 'A long reclaimed-wood communal table encourages laptop-toting '
        + 'patrons to sit together. Paper to-go cups, bamboo cutlery, and '
        + 'handmade stoneware reflect the rustic artisanal ethos.',
      copy: 'Reclaimed wood \u00b7 Paper cups \u00b7 Laptops welcome',
    },
    'vinyl-poster-wall-closeup': {
      name: 'Vinyl Record Wall',
      note: 'A wall of vintage vinyl record covers serves as both d\u00e9cor '
        + 'and soundproofing. Indie band posters and fair-trade '
        + 'certifications line the remaining wall space.',
      copy: 'Vinyl wall \u00b7 Fair Trade certified',
    },
    'slayer-machine-closeup': {
      name: 'Slayer Espresso Machine',
      note: 'A Slayer single-group espresso machine with needle-valve '
        + 'pressure profiling \u2014 the barista can shape the extraction '
        + 'curve for each bean. The pinnacle of third-wave espresso engineering.',
      copy: 'Slayer Espresso \u00b7 Pressure profiling',
    },
  },

  2025: {
    'contactless-terminal-closeup': {
      name: 'Contactless Payment Terminal',
      note: 'A sleek contactless payment terminal accepts Apple Pay, Google '
        + 'Pay, and tap cards. Cash is almost never used \u2014 most patrons '
        + 'pay with their phone or smartwatch in under a second.',
      copy: 'Tap to pay \u00b7 Apple Pay \u00b7 Google Pay',
    },
    'espresso-machine-closeup': {
      name: 'La Marzocco Multi-Group',
      note: 'A La Marzocco Linea PB with multi-group scheduling and IoT '
        + 'telemetry. Each group head is tracked remotely, and brew '
        + 'recipes are saved per bean origin in the cloud.',
      copy: 'Linea PB \u00b7 IoT telemetry \u00b7 Cloud recipes',
    },
    'qr-menu-tablet-closeup': {
      name: 'QR-Code Menu Tablet',
      note: 'A tablet displays a QR code linking to the digital menu. '
        + 'Paper menus are gone \u2014 patrons scan and browse on their own '
        + 'phones, with allergen filters and origin traceability.',
      copy: 'Scan for menu \u00b7 Allergen-filtered',
    },
    'bluetooth-speaker-closeup': {
      name: 'Phone + Bluetooth Speaker',
      note: 'A phone streams a curated ambient playlist to a premium '
        + 'Bluetooth speaker. The cafe\'s music is algorithmically '
        + 'selected based on time of day and occupancy sensors.',
      copy: 'Now playing: Modern Ambient \u00b7 Auto-curated',
    },
    'living-wall-closeup': {
      name: 'Living Green Wall',
      note: 'A floor-to-ceiling living wall of mosses and ferns brings '
        + 'biophilic design indoors. Integrated LED grow-lights keep the '
        + 'plants thriving while doubling as accent lighting.',
      copy: 'Living wall \u00b7 Biophilic design',
    },
    'vegan-pastry-case-closeup': {
      name: 'Vegan Pastry Case',
      note: 'A refrigerated case of plant-based pastries \u2014 vegan '
        + 'croissants, gluten-free brownies, and oat-milk cheesecake. By '
        + '2025, plant-based is the default, not the alternative.',
      copy: 'Plant-based \u00b7 Gluten-free options',
    },
    'seating-area-closeup': {
      name: 'Minimalist Seating Area',
      note: 'Minimalist furniture in natural tones: light oak tables, '
        + 'double-walled borosilicate glass cups, and compostable wooden '
        + 'cutlery. Sustainability is visible in every detail.',
      copy: 'Borosilicate glass \u00b7 Compostable cutlery',
    },
  },
};

/**
 * Get the inspection note for a given hotspot in a given year.
 *
 * Falls back to the hotspot's label from the PeriodPackage if no curated
 * note exists.
 *
 * @param {number} year
 * @param {string} hotspotId
 * @param {string} [fallbackLabel]
 * @returns {object|null}
 */
export function getInspectionNote(year, hotspotId, fallbackLabel) {
  const yearNotes = INSPECTION_NOTES[year];
  if (yearNotes && yearNotes[hotspotId]) {
    return yearNotes[hotspotId];
  }
  if (fallbackLabel) {
    return {
      name: fallbackLabel,
      note: 'A detail from the ' + year + ' era of this cafe.',
      copy: '',
    };
  }
  return null;
}

export default {
  INSPECTION_NOTES,
  buildEraSummary,
  diffEras,
  formatDiffSubtitle,
  getInspectionNote,
};
