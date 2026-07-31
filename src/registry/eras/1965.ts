import { registerEra, type EraFragment } from '../AssetRegistry';
import { era1965 } from '../../data/eras/1965';

const noopBuild: EraFragment['build'] = () => {
  // Phase 1 registers fragment contracts; scene geometry arrives in later phases.
};

registerEra({
  era: 1965,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1965.architecture.walls}; floor: ${era1965.architecture.floor}`,
      tags: ['terrazzo', 'chrome', 'plaster'],
      build: noopBuild,
    },
    {
      category: 'furnitureDecor',
      label: 'Formica counter, chrome-leg tables, stacking chairs',
      tags: era1965.furnitureDecor,
      build: noopBuild,
    },
    {
      category: 'coffeeMachines',
      label: era1965.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1965.coffeeMachines.map((m) => m.method),
      build: noopBuild,
    },
    {
      category: 'menuBoard',
      label: `${era1965.menuBoard.title}: ${era1965.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      build: noopBuild,
    },
    {
      category: 'musicSource',
      label: era1965.musicSource.label,
      tags: [era1965.musicSource.kind],
      build: noopBuild,
    },
    {
      category: 'posters',
      label: era1965.posters.map((p) => p.title).join(', '),
      tags: era1965.posters.map((p) => p.description),
      build: noopBuild,
    },
    {
      category: 'tableware',
      label: era1965.tableware.map((t) => t.name).join(', '),
      tags: era1965.tableware.map((t) => t.material),
      build: noopBuild,
    },
    {
      category: 'signageLighting',
      label: `${era1965.signageLighting.sign}; ${era1965.signageLighting.lighting}`,
      build: noopBuild,
    },
    {
      category: 'counterTechnology',
      label: era1965.counterTechnology.device,
      tags: [era1965.counterTechnology.method],
      build: noopBuild,
    },
    {
      category: 'patrons',
      label: era1965.patrons.map((p) => p.outfit).join(', '),
      tags: era1965.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: noopBuild,
    },
  ],
});
