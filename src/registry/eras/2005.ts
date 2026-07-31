import { registerEra, type EraFragment } from '../AssetRegistry';
import { era2005 } from '../../data/eras/2005';
import { eraAudioConfigFor } from '../../audio/eraAudioConfigs';
import {
  build2005Architecture,
  build2005FurnitureDecor,
  build2005CoffeeMachines,
  build2005MenuBoard,
  build2005MusicSource,
  build2005Posters,
  build2005Tableware,
  build2005SignageLighting,
  build2005CounterTechnology,
  build2005Patrons,
} from '../../scenes/eras/2005';

/**
 * Phase 4 — 2005 second-wave coffeehouse composition.
 *
 * Each fragment builds real Three.js geometry into the era group (via the
 * shared asset library at the canonical anchors). The era audio config
 * (src/audio/eraAudioConfigs.ts) rides along on the musicSource fragment so
 * the AudioEngine and QA tooling can resolve the era's sound bed.
 */
registerEra({
  era: 2005,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2005.architecture.walls}; floor: ${era2005.architecture.floor}`,
      tags: ['hardwood', 'exposed-brick', 'chocolate-brown', 'rafters'],
      build: build2005Architecture,
    },
    {
      category: 'furnitureDecor',
      label: 'Overstuffed armchairs, low wood tables, bookshelves',
      tags: era2005.furnitureDecor,
      build: build2005FurnitureDecor,
    },
    {
      category: 'coffeeMachines',
      label: era2005.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2005.coffeeMachines.map((m) => m.method),
      build: build2005CoffeeMachines,
    },
    {
      category: 'menuBoard',
      label: `${era2005.menuBoard.title}: ${era2005.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: ['printed', 'illuminated', '2005 prices'],
      build: build2005MenuBoard,
    },
    {
      category: 'musicSource',
      label: era2005.musicSource.label,
      tags: [era2005.musicSource.kind, 'ipod-dock', 'indie', 'acoustic'],
      build: build2005MusicSource,
      audio: eraAudioConfigFor(2005),
    },
    {
      category: 'posters',
      label: era2005.posters.map((p) => p.title).join(', '),
      tags: era2005.posters.map((p) => p.description),
      build: build2005Posters,
    },
    {
      category: 'tableware',
      label: era2005.tableware.map((t) => t.name).join(', '),
      tags: era2005.tableware.map((t) => t.material),
      build: build2005Tableware,
    },
    {
      category: 'signageLighting',
      label: `${era2005.signageLighting.sign}; ${era2005.signageLighting.lighting}`,
      tags: ['halogen-spots', 'pendant-lamps', 'chalkboard-a-frame'],
      build: build2005SignageLighting,
    },
    {
      category: 'counterTechnology',
      label: era2005.counterTechnology.device,
      tags: [era2005.counterTechnology.method],
      build: build2005CounterTechnology,
    },
    {
      category: 'patrons',
      label: era2005.patrons.map((p) => p.outfit).join(', '),
      tags: era2005.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: build2005Patrons,
    },
  ],
});

// Re-export the era audio config so consumers (AudioEngine, QA) can import it
// directly from the registry module without a second dynamic import.
export { eraAudioConfigFor, ERA_AUDIO_2005 } from '../../audio/eraAudioConfigs';
export type { EraAudioConfig } from '../../audio/eraAudioConfigs';

// Keep the EraFragment type import meaningful for fragment metadata typing.
export type { EraFragment };
