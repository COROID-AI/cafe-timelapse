import type { EraConfig } from './types';

/**
 * 1985 — STUB. Era-content task: replace this placeholder with period-accurate
 * details (fluorescent glare, boombox, electronic cash register…).
 * Fill only the keys you own; every nested field is optional by design.
 */
export const era1985: EraConfig = {
  year: 1985,
  title: '1985 — stub',
  // Furniture & décor slice — authored by src/cafe/props/furniture/ task.
  furniture: {
    furniture: [
      { id: 'tbl-pastel', label: 'Pastel laminate tables on tubular steel', stylePeriod: 'eighties casual', material: 'laminate, tubular steel', quantity: 6 },
      { id: 'chr-tubular', label: 'Tubular-steel chairs with moulded shells', material: 'steel, moulded pastel shells', quantity: 14 },
    ],
    decor: [
      { id: 'dec-ferns', label: 'Potted ferns', placement: 'floor corners', color: '#3f7d44' },
      { id: 'dec-neon', label: 'Neon-accented wall piece', placement: 'wall', color: '#ff4fd8' },
    ],
    flooring: 'pale lino with mint area rug',
    colorPalette: ['#bfe3cf', '#f2cfd4', '#f6d8bd', '#8f9aa6'],
  }, // TODO(era-1985): richer furniture & décor notes welcome.
  brewingEquipment: {}, // TODO(era-1985): coffee machines & brewing equipment.
  menuBoard: {}, // TODO(era-1985): menu board items + period prices.
  posters: {}, // TODO(era-1985): wall posters & advertisements.
  tableware: {}, // TODO(era-1985): tableware.
  signageLighting: {}, // TODO(era-1985): signage & lighting.
  counterTech: {}, // TODO(era-1985): counter technology (electronic register).
  patrons: {}, // TODO(era-1985): patron outfits, hairstyles, gadgets.
  ambientMood: {}, // TODO(era-1985): ambient mood (music source, soundscape…).
};
