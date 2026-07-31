/**
 * index.ts — public surface of the character system.
 *
 * Consumers (era fragment builders, scene controller, slider wiring, tests)
 * import from this barrel so the internal module layout can evolve without
 * breaking imports.
 *
 * The character system separates *data* (PatronConfig — what a patron is)
 * from *registry* (CharacterRoster — which era a patron belongs to) from
 * *render* (CharacterAvatar — how a patron looks). Per-era patron
 * populations live in their own modules (`patrons1965`, …) and register with
 * the roster on import.
 */
export type {
  PatronConfig,
  PatronOutfit,
  PatronHairstyle,
  PatronGadget,
} from './PatronConfig.js';
export { isPatronConfig } from './PatronConfig.js';
export { characterRoster } from './CharacterRoster.js';
export {
  buildCharacterAvatar,
  buildCharacterAvatars,
} from './CharacterAvatar.js';
