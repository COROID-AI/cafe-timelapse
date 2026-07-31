/**
 * Scene compositions — public surface.
 *
 * Each era's Phase 4 composition lives in `src/compositions/<year>/` and
 * builds its fragment categories from the shared asset library. This barrel
 * exposes the 1965 composition (the first Phase 4 era) so the registry,
 * SceneManager and app entry can import it through one path.
 */
export {
  build1965Composition,
  build1965Architecture,
  build1965FurnitureDecor,
  build1965CoffeeMachines,
  build1965MenuBoard,
  build1965MusicSource,
  build1965Posters,
  build1965Tableware,
  build1965SignageLighting,
  build1965CounterTechnology,
  build1965Patrons,
  ERA_AUDIO_1965,
} from './1965';
export type { CompositionResult } from './1965';
export { populate1965Surfaces } from './1965/surfaces';
export type { EraSurfaceMaterials } from './1965/surfaces';
