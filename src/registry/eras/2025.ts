import { registerEra, type EraFragment } from '../AssetRegistry';
import { era2025 } from '../../data/eras/2025';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 2025,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2025.architecture.walls}; floor: ${era2025.architecture.floor}`,
      tags: ['oak', 'concrete', 'white-plaster'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Live-edge oak tables, bouclé armchairs, stone counter',
      tags: era2025.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era2025.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2025.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era2025.menuBoard.title}: ${era2025.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era2025.musicSource.label,
      tags: [era2025.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era2025.posters.map((p) => p.title).join(', '),
      tags: era2025.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era2025.tableware.map((t) => t.name).join(', '),
      tags: era2025.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era2025.signageLighting.sign}; ${era2025.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era2025.counterTechnology.device,
      tags: [era2025.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era2025.patrons.map((p) => p.outfit).join(', '),
      tags: era2025.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
