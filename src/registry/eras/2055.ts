import { registerEra } from '../AssetRegistry';
import { era2055 } from '../../data/eras/2055';
import {
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
} from '../../compositions/2055';

/**
 * 2055 — near-future speculative café.
 *
 * Every fragment category is built from the shared asset library by the
 * 2055 composition (src/compositions/2055). Each `build` mounts only its own
 * category into the fragment group so the SceneManager's per-category groups
 * stay clean (no cross-category duplication). The patrons fragment mounts
 * four PatronConfigs (smart-fabric poncho, reflective jumpsuit, minimalist
 * techwear holo-drinker and holo-interface techwear) via the shared
 * CharacterRoster, so they toggle with era changes.
 */
registerEra({
  era: 2055,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2055.architecture.walls}; floor: ${era2055.architecture.floor}`,
      tags: ['smart-glass', 'photopolymer', 'mycelium', 'led-skirt'],
      build: (target) => {
        build2055Architecture(target);
      },
    },
    {
      category: 'furnitureDecor',
      label: 'Curved seamless tables, morphing-foam pods, vertical garden, holo accents',
      tags: era2055.furnitureDecor,
      build: (target) => {
        build2055FurnitureDecor(target);
      },
    },
    {
      category: 'coffeeMachines',
      label: era2055.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2055.coffeeMachines.map((m) => m.method),
      build: (target) => {
        build2055CoffeeMachines(target);
      },
    },
    {
      category: 'menuBoard',
      label: `${era2055.menuBoard.title}: ${era2055.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: era2055.menuBoard.items.map((i) => i.price),
      build: (target) => {
        build2055MenuBoard(target);
      },
    },
    {
      category: 'musicSource',
      label: era2055.musicSource.label,
      tags: [era2055.musicSource.kind, 'holographic-emitter'],
      build: (target) => {
        build2055MusicSource(target);
      },
    },
    {
      category: 'posters',
      label: era2055.posters.map((p) => p.title).join(', '),
      tags: era2055.posters.map((p) => p.description),
      build: (target) => {
        build2055Posters(target);
      },
    },
    {
      category: 'tableware',
      label: era2055.tableware.map((t) => t.name).join(', '),
      tags: era2055.tableware.map((t) => t.material),
      build: (target) => {
        build2055Tableware(target);
      },
    },
    {
      category: 'signageLighting',
      label: `${era2055.signageLighting.sign}; ${era2055.signageLighting.lighting}`,
      tags: ['holo-sign', 'led-strip', 'bio-nodes'],
      build: (target) => {
        build2055SignageLighting(target);
      },
    },
    {
      category: 'counterTechnology',
      label: era2055.counterTechnology.device,
      tags: [era2055.counterTechnology.method, 'kiosk', 'drone-hatch'],
      build: (target) => {
        build2055CounterTechnology(target);
      },
    },
    {
      category: 'patrons',
      label: era2055.patrons.map((p) => p.outfit).join(', '),
      tags: era2055.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: (target) => {
        build2055Patrons(target);
      },
    },
  ],
});
