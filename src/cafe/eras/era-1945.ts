import type { EraConfig } from './types';

/**
 * 1945 — STUB. Era-content task: replace this placeholder with period-accurate
 * details (post-war austerity, rationing, utilitarian furniture, manual till…).
 * Fill only the keys you own; every nested field is optional by design.
 */
export const era1945: EraConfig = {
  year: 1945,
  title: '1945 — stub',
  // Furniture & décor slice — authored by src/cafe/props/furniture/ task.
  furniture: {
    furniture: [
      { id: 'tbl-round-oak', label: 'Mismatched round café tables', stylePeriod: 'wartime utility', material: 'stained oak, mixed provenance', quantity: 6 },
      { id: 'tbl-cloth', label: 'Cloth-covered tables', material: 'herringbone cotton cloth', color: '#ddd6c4', quantity: 2 },
      { id: 'chr-mismatched', label: 'Mismatched wooden chairs', stylePeriod: 'pre-war survivals', material: 'bentwood & slat-back beech', quantity: 14 },
    ],
    decor: [
      { id: 'dec-doilies', label: 'Crocheted lace doilies', placement: 'table top', color: '#f4efe4' },
      { id: 'dec-blackout', label: 'Blackout-curtain remnants', placement: 'window', color: '#453f31' },
    ],
    flooring: 'worn strip boards with patchy rag rugs',
    colorPalette: ['#8a6a45', '#6b4a2f', '#b9b09a', '#4a4436'],
  }, // TODO(era-1945): richer furniture & décor notes welcome.
  brewingEquipment: {}, // TODO(era-1945): coffee machines & brewing equipment.
  menuBoard: {}, // TODO(era-1945): menu board items + period prices.
  posters: {}, // TODO(era-1945): wall posters & advertisements.
  tableware: {}, // TODO(era-1945): tableware.
  signageLighting: {}, // TODO(era-1945): signage & lighting.
  counterTech: {}, // TODO(era-1945): counter technology (manual till).
  patrons: {}, // TODO(era-1945): patron outfits, hairstyles, gadgets.
  ambientMood: {}, // TODO(era-1945): ambient mood (music source, soundscape…).
};
