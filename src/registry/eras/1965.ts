import { registerEra } from '../AssetRegistry';
import { era1965 } from '../../data/eras/1965';
import {
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
} from '../../compositions/1965';

/**
 * 1965 — mid-century / beatnik café.
 *
 * Every fragment category is built from the shared asset library by the
 * 1965 composition (src/compositions/1965). Each `build` mounts only its own
 * category into the fragment group so the SceneManager's per-category groups
 * stay clean (no cross-category duplication).
 */
registerEra({
  era: 1965,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1965.architecture.walls}; floor: ${era1965.architecture.floor}`,
      tags: ['wood-panelling', 'chrome-dado', 'geometric-wallpaper', 'checkerboard'],
      build: (target) => {
        build1965Architecture(target);
      },
    },
    {
      category: 'furnitureDecor',
      label: 'Formica booths with chrome trim, chrome-leg tables, vinyl stools',
      tags: era1965.furnitureDecor,
      build: (target) => {
        build1965FurnitureDecor(target);
      },
    },
    {
      category: 'coffeeMachines',
      label: era1965.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1965.coffeeMachines.map((m) => m.method),
      build: (target) => {
        build1965CoffeeMachines(target);
      },
    },
    {
      category: 'menuBoard',
      label: `${era1965.menuBoard.title}: ${era1965.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: era1965.menuBoard.items.map((i) => i.price),
      build: (target) => {
        build1965MenuBoard(target);
      },
    },
    {
      category: 'musicSource',
      label: era1965.musicSource.label,
      tags: [era1965.musicSource.kind],
      build: (target) => {
        build1965MusicSource(target);
      },
    },
    {
      category: 'posters',
      label: era1965.posters.map((p) => p.title).join(', '),
      tags: era1965.posters.map((p) => p.description),
      build: (target) => {
        build1965Posters(target);
      },
    },
    {
      category: 'tableware',
      label: era1965.tableware.map((t) => t.name).join(', '),
      tags: era1965.tableware.map((t) => t.material),
      build: (target) => {
        build1965Tableware(target);
      },
    },
    {
      category: 'signageLighting',
      label: `${era1965.signageLighting.sign}; ${era1965.signageLighting.lighting}`,
      tags: ['neon-tube', 'fluorescent'],
      build: (target) => {
        build1965SignageLighting(target);
      },
    },
    {
      category: 'counterTechnology',
      label: era1965.counterTechnology.device,
      tags: [era1965.counterTechnology.method],
      build: (target) => {
        build1965CounterTechnology(target);
      },
    },
    {
      category: 'patrons',
      label: era1965.patrons.map((p) => p.outfit).join(', '),
      tags: era1965.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: (target) => {
        build1965Patrons(target);
      },
    },
  ],
});
