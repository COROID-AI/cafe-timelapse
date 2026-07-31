/**
 * index.ts — barrel entry point for the character (patron) system.
 *
 * Re-exports the three layers of the patron system so era-population tasks
 * import from a single surface:
 *
 *   1. {@link PatronConfig} — the declarative appearance + seat contract.
 *   2. {@link CharacterAvatar} — the procedural seated-figure builder.
 *   3. {@link CharacterRoster} — the era-scoped registry + factory wiring.
 *
 * Example (a Phase-6 era-population task):
 *
 *   import { characterRoster, type PatronConfig } from '../characters/index.js';
 *   characterRoster.register([{ id, era, outfit, hat, hair, gadget, seat }]);
 *
 * Consumers (era fragment builders, scene controller, slider wiring, tests)
 * import from this barrel so the internal module layout can evolve without
 * breaking imports.
 *
 * The character system separates *data* (PatronConfig — what a patron is)
 * from *registry* (CharacterRoster — which era a patron belongs to) from
 * *render* (CharacterAvatar — how a patron looks). Per-era patron
 * populations live in their own modules (`patrons1945`, `patrons1965`, …) and
 * register with the roster on import.
 */
export {
  DEFAULT_SEAT_OFFSET,
  DEFAULT_SKIN_TONE,
  SEATING_ANCHORS,
  isPatronConfig,
  type GadgetType,
  type GadgetConfig,
  type HairConfig,
  type HairStyle,
  type HatConfig,
  type HatType,
  type OutfitConfig,
  type OutfitType,
  type PatronConfig,
  type PatronGadget,
  type PatronHairstyle,
  type PatronOutfit,
} from './PatronConfig.js';

export {
  buildAvatar,
  buildCharacterAvatar,
  buildCharacterAvatars,
  buildSeatedPatron,
  placeAvatar,
} from './CharacterAvatar.js';

export {
  characterRoster,
  registerPatron,
  registerPatrons,
  type RosterFactoryContext,
} from './CharacterRoster.js';

// Per-era population modules (side-effectful: importing populates the roster).
export { PATRONS_1945, registerPatrons1945 } from './patrons1945.js';
export { getPatrons1965, registerPatrons1965 } from './patrons1965.js';
