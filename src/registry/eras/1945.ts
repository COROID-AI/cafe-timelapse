import { registerEra, type EraFragment } from '../AssetRegistry';
import { era1945 } from '../../data/eras/1945';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 1945,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1945.architecture.walls}; floor: ${era1945.architecture.floor}`,
      tags: ['plaster', 'linoleum', 'tin-ceiling'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Bentwood chairs, bistro tables, walnut counter',
      tags: era1945.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era1945.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1945.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era1945.menuBoard.title}: ${era1945.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era1945.musicSource.label,
      tags: [era1945.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era1945.posters.map((p) => p.title).join(', '),
      tags: era1945.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era1945.tableware.map((t) => t.name).join(', '),
      tags: era1945.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era1945.signageLighting.sign}; ${era1945.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era1945.counterTechnology.device,
      tags: [era1945.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era1945.patrons.map((p) => p.outfit).join(', '),
      tags: era1945.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
