/**
 * Shared character/patron system — public surface.
 *
 * Phase 5: the reusable CharacterAvatar system (low-poly stylized figures
 * parameterized by a per-era PatronConfig), the shared idle/subtle-motion
 * animation loop, seating placement helpers for the architecture anchors, and
 * the CharacterRoster that mounts/removes the right set of avatars per era.
 *
 * Era patron tasks compose these helpers instead of hand-building figure
 * geometry; the QA gate (src/scripts/checkCharacters.ts) verifies the
 * contract headlessly.
 */
export {
  CharacterAvatar,
  CharacterRoster,
  AvatarMaterialCache,
  makeAvatarMaterials,
  seatAtAnchor,
  seatAtTable,
  seatAtCounter,
  counterStoolAnchors,
  updateCharacterAnimations,
} from './CharacterAvatar';
export type {
  CharacterAvatarOptions,
  AvatarMaterials,
  AvatarPosture,
  RosterMountOptions,
  SeatOptions,
  TableSide,
} from './CharacterAvatar';
