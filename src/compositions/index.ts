/**
 * Scene compositions — public surface.
 *
 * Each era's Phase 4 composition lives in `src/compositions/<year>/` and
 * builds its fragment categories from the shared asset library. This barrel
 * exposes the composed eras (1965 mid-century / beatnik café, 2025 modern
 * third-wave / specialty café and the 2055 near-future speculative café) so
 * the registry, SceneManager and app entry can import them through one path.
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
export type {
  EraSurfaceMaterials,
  EraSurfaceMaterials as EraSurfaceMaterials1965,
} from './1965/surfaces';

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

export {
  build2055Composition,
  build2055Architecture,
  build2055FurnitureDecor,
  build2055CoffeeMachines,
  build2055MenuBoard,
  build2055MusicSource,
  build2055Posters,
  build2055Tableware,
  build2055SignageLighting,
  build2055CounterTechnology,
  build2055Patrons,
  PATRON_CONFIGS_2055,
  ERA_AUDIO_2055,
} from './2055';
export type { CompositionResult as CompositionResult2055 } from './2055';
export { populate2055Surfaces } from './2055/surfaces';
export type { EraSurfaceMaterials as EraSurfaceMaterials2055 } from './2055/surfaces';
