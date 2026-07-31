/**
 * index.ts — barrel entry point for the character (patron) system.
 *
 * Re-exports the patron configuration types, the avatar builder, and the
 * era-scoped roster so downstream consumers (the SceneManager, era-population
 * tasks, tests) import from a single surface:
 *
 *   import {
 *     type PatronConfig,
 *     characterRoster,
 *     buildAvatarsForEra,
 *   } from '../characters/index.js';
 */
export type {
  PatronConfig,
  Outfit,
  OutfitType,
  Hair,
  Hairstyle,
  Gadget,
} from './PatronConfig.js';

export {
  buildCharacterAvatar,
  PATRON_SEATING_ANCHORS,
  ANCHORS as PATRON_ANCHORS,
} from './CharacterAvatar.js';

export {
  characterRoster,
  registerPatron,
  registerPatrons,
  getPatronsForEra,
  buildAvatarsForEra,
} from './CharacterRoster.js';

export { PATRONS_1985, registerEra1985Patrons } from './patrons1985.js';
