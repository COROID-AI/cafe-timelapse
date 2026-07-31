import { registerEra, type EraFragment } from '../AssetRegistry';
import { era2005 } from '../../data/eras/2005';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 2005,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2005.architecture.walls}; floor: ${era2005.architecture.floor}`,
      tags: ['bamboo', 'chocolate-brown', 'exposed-rafters'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Dark wood tables, leather-look sofas, curved white counter',
      tags: era2005.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era2005.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2005.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era2005.menuBoard.title}: ${era2005.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era2005.musicSource.label,
      tags: [era2005.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era2005.posters.map((p) => p.title).join(', '),
      tags: era2005.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era2005.tableware.map((t) => t.name).join(', '),
      tags: era2005.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era2005.signageLighting.sign}; ${era2005.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era2005.counterTechnology.device,
      tags: [era2005.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era2005.patrons.map((p) => p.outfit).join(', '),
      tags: era2005.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
