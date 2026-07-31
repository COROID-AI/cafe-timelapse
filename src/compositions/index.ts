/**
 * Scene compositions — public surface.
 *
 * Each era's Phase 4 composition lives in `src/compositions/<year>/` and
 * builds its fragment categories from the shared asset library. This barrel
 * exposes the composed eras so the registry, SceneManager and app entry can
 * import them through one path.
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
export type { CompositionResult as CompositionResult1965 } from './1965';
export { populate1965Surfaces } from './1965/surfaces';
export type { EraSurfaceMaterials as EraSurfaceMaterials1965 } from './1965/surfaces';

export {
  build2025Composition,
  build2025Architecture,
  build2025FurnitureDecor,
  build2025CoffeeMachines,
  build2025MenuBoard,
  build2025MusicSource,
  build2025Posters,
  build2025Tableware,
  build2025SignageLighting,
  build2025CounterTechnology,
  build2025Patrons,
  ERA_AUDIO_2025,
} from './2025';
export type { CompositionResult as CompositionResult2025 } from './2025';
export { populate2025Surfaces } from './2025/surfaces';
export type { EraSurfaceMaterials as EraSurfaceMaterials2025 } from './2025/surfaces';
