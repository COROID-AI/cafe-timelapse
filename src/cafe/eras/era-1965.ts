import type { EraConfig } from './types';

/**
 * 1965 — STUB. Era-content task: replace this placeholder with period-accurate
 * details (mid-century optimism, jukebox culture, formica diner look…).
 * Fill only the keys you own; every nested field is optional by design.
 */
export const era1965: EraConfig = {
  year: 1965,
  title: '1965 — stub',
  // Furniture & décor slice — authored by src/cafe/props/furniture/ task.
  furniture: {
    furniture: [
      { id: 'tbl-formica', label: 'Formica diner tables', stylePeriod: 'mid-century diner', material: 'white speckled Formica, chrome banding', quantity: 6 },
      { id: 'chr-chrome-vinyl', label: 'Chrome-edged chairs with vinyl seats', material: 'chromed steel tubing, candy-red vinyl', quantity: 12 },
    ],
    decor: [
      { id: 'dec-jukebox-hint', label: 'Jukebox corner hint', placement: 'corner', color: '#ff4f9e' },
      { id: 'dec-lino', label: 'Red-and-cream checkerboard lino', placement: 'floor' },
    ],
    flooring: 'red-and-cream checkerboard lino',
    colorPalette: ['#b3392f', '#2fa8a0', '#e8b23a', '#3a3f4a'],
  }, // TODO(era-1965): richer furniture & décor notes welcome.
  brewingEquipment: {}, // TODO(era-1965): coffee machines & brewing equipment.
  menuBoard: {}, // TODO(era-1965): menu board items + period prices.
  posters: {}, // TODO(era-1965): wall posters & advertisements.
  tableware: {}, // TODO(era-1965): tableware.
  signageLighting: {}, // TODO(era-1965): signage & lighting.
  counterTech: {}, // TODO(era-1965): counter technology.
  patrons: {}, // TODO(era-1965): patron outfits, hairstyles, gadgets.
  ambientMood: {}, // TODO(era-1965): ambient mood (music source, soundscape…).
};
