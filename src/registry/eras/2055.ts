import { registerEra, type EraFragment } from '../AssetRegistry';
import { era2055 } from '../../data/eras/2055';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 2055,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2055.architecture.walls}; floor: ${era2055.architecture.floor}`,
      tags: ['smart-glass', 'photopolymer', 'mycelium'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Morphing chairs, holographic tables, floating counter',
      tags: era2055.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era2055.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2055.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era2055.menuBoard.title}: ${era2055.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era2055.musicSource.label,
      tags: [era2055.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era2055.posters.map((p) => p.title).join(', '),
      tags: era2055.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era2055.tableware.map((t) => t.name).join(', '),
      tags: era2055.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era2055.signageLighting.sign}; ${era2055.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era2055.counterTechnology.device,
      tags: [era2055.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era2055.patrons.map((p) => p.outfit).join(', '),
      tags: era2055.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
