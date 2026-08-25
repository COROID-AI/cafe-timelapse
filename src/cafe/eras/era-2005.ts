import type { EraConfig } from './types';

/**
 * 2005 — STUB. Era-content task: replace this placeholder with period-accurate
 * details (internet-café vibe, iPod docks, chip-and-PIN card terminals…).
 * Fill only the keys you own; every nested field is optional by design.
 */
export const era2005: EraConfig = {
  year: 2005,
  title: '2005 — stub',
  // Furniture & décor slice — authored by src/cafe/props/furniture/ task.
  furniture: {
    furniture: [
      { id: 'tbl-combo', label: 'Dark wood & brushed steel combo tables', stylePeriod: 'noughties espresso bar', material: 'espresso veneer, brushed steel', quantity: 6 },
      { id: 'chr-combo', label: 'Matching wood-and-steel chairs', material: 'espresso wood, steel frame', quantity: 13 },
      { id: 'sofa-lounge', label: 'Lounge corner sofa', material: 'charcoal weave, steel legs', quantity: 1 },
    ],
    decor: [
      { id: 'dec-frames', label: 'Wall-mounted flat framed prints', placement: 'wall' },
    ],
    flooring: 'dark-stained boards with graphite lounge rug',
    colorPalette: ['#4a4642', '#7d6a55', '#3a3f45', '#9c7b52'],
  }, // TODO(era-2005): richer furniture & décor notes welcome.
  brewingEquipment: {}, // TODO(era-2005): coffee machines & brewing equipment.
  menuBoard: {}, // TODO(era-2005): menu board items + period prices.
  posters: {}, // TODO(era-2005): wall posters & advertisements.
  tableware: {}, // TODO(era-2005): tableware.
  signageLighting: {}, // TODO(era-2005): signage & lighting.
  counterTech: {}, // TODO(era-2005): counter technology (card terminal POS).
  patrons: {}, // TODO(era-2005): patron outfits, hairstyles, gadgets.
  ambientMood: {}, // TODO(era-2005): ambient mood (music source, soundscape…).
};
