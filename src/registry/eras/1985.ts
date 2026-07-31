import { registerEra, type EraFragment } from '../AssetRegistry';
import { era1985 } from '../../data/eras/1985';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 1985,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1985.architecture.walls}; floor: ${era1985.architecture.floor}`,
      tags: ['carpet-tiles', 'peach', 'brass'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Laminate tables, burgundy chairs, smoked-glass counter',
      tags: era1985.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era1985.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1985.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era1985.menuBoard.title}: ${era1985.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era1985.musicSource.label,
      tags: [era1985.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era1985.posters.map((p) => p.title).join(', '),
      tags: era1985.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era1985.tableware.map((t) => t.name).join(', '),
      tags: era1985.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era1985.signageLighting.sign}; ${era1985.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era1985.counterTechnology.device,
      tags: [era1985.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era1985.patrons.map((p) => p.outfit).join(', '),
      tags: era1985.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
