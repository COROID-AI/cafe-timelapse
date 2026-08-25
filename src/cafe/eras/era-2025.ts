import type { EraConfig } from './types';

/**
 * 2025 — STUB. Era-content task: replace this placeholder with period-accurate
 * details (speciality third-wave coffee, contactless/mobile wallet payments,
 * phone speakers and laptops on every table…).
 * Fill only the keys you own; every nested field is optional by design.
 */
export const era2025: EraConfig = {
  year: 2025,
  title: '2025 — stub',
  // Furniture & décor slice — authored by src/cafe/props/furniture/ task.
  furniture: {
    furniture: [
      { id: 'tbl-light-oak', label: 'Minimalist light-oak tables', stylePeriod: 'contemporary minimal', material: 'oiled FSC oak', quantity: 6 },
      { id: 'chr-shell', label: 'Ergonomic shell chairs', material: 'moulded recycled shell, oak legs', quantity: 14 },
    ],
    decor: [
      { id: 'dec-hanging-plants', label: 'Hanging plants in macramé slings', placement: 'ceiling', color: '#5c8a4a' },
      { id: 'dec-charging-spots', label: 'Wireless-charging spots inset in tabletops', placement: 'table surface', color: '#58e0c0' },
    ],
    flooring: 'light oak boards with natural-weave rug',
    colorPalette: ['#9db08b', '#d8b98a', '#efeae2', '#26262a'],
  }, // TODO(era-2025): richer furniture & décor notes welcome.
  brewingEquipment: {}, // TODO(era-2025): coffee machines & brewing equipment.
  menuBoard: {}, // TODO(era-2025): menu board items + period prices.
  posters: {}, // TODO(era-2025): wall posters & advertisements.
  tableware: {}, // TODO(era-2025): tableware.
  signageLighting: {}, // TODO(era-2025): signage & lighting.
  counterTech: {}, // TODO(era-2025): counter technology (contactless).
  patrons: {}, // TODO(era-2025): patron outfits, hairstyles, gadgets.
  ambientMood: {}, // TODO(era-2025): ambient mood (music source, soundscape…).
};
