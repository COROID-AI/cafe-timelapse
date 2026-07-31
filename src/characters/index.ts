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
 */
export {
  DEFAULT_SEAT_OFFSET,
  DEFAULT_SKIN_TONE,
  SEATING_ANCHORS,
  type GadgetType,
  type GadgetConfig,
  type HairConfig,
  type HairStyle,
  type HatConfig,
  type HatType,
  type OutfitConfig,
  type OutfitType,
  type PatronConfig,
} from './PatronConfig.js';

export {
  buildAvatar,
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
export { PATRONS_2025, registerPatrons2025 } from './patrons2025.js';
