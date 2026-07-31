import { registerEra, type EraFragment } from '../AssetRegistry';
import { era2025 } from '../../data/eras/2025';
import {
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
} from '../../compositions/2025';

/**
 * Phase 4 — 2025 modern third-wave / specialty café composition.
 *
 * Each fragment builds real Three.js geometry into the era group (via the
 * shared asset library at the canonical anchors). The era audio config
 * (src/audio/eras/2025.ts) rides along on the musicSource fragment so the
 * AudioEngine and QA tooling can resolve the era's sound bed.
 */
registerEra({
  era: 2025,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era2025.architecture.walls}; floor: ${era2025.architecture.floor}`,
      tags: ['oak-slats', 'polished-concrete', 'white-tile', 'matte-black-ceiling'],
      build: build2025Architecture,
    },
    {
      category: 'furnitureDecor',
      label: 'Live-edge oak tables, bouclé armchairs, hanging plants',
      tags: era2025.furnitureDecor,
      build: build2025FurnitureDecor,
    },
    {
      category: 'coffeeMachines',
      label: era2025.coffeeMachines.map((m) => m.name).join(', '),
      tags: era2025.coffeeMachines.map((m) => m.method),
      build: build2025CoffeeMachines,
    },
    {
      category: 'menuBoard',
      label: `${era2025.menuBoard.title}: ${era2025.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: ['digital-screen', 'backlit', '2025 dollar prices'],
      build: build2025MenuBoard,
    },
    {
      category: 'musicSource',
      label: era2025.musicSource.label,
      tags: [era2025.musicSource.kind, 'smartphone', 'bluetooth-speaker', 'sonos-style', 'lo-fi'],
      build: build2025MusicSource,
    },
    {
      category: 'posters',
      label: era2025.posters.map((p) => p.title).join(', '),
      tags: era2025.posters.map((p) => p.description),
      build: build2025Posters,
    },
    {
      category: 'tableware',
      label: era2025.tableware.map((t) => t.name).join(', '),
      tags: era2025.tableware.map((t) => t.material),
      build: build2025Tableware,
    },
    {
      category: 'signageLighting',
      label: `${era2025.signageLighting.sign}; ${era2025.signageLighting.lighting}`,
      tags: ['backlit-brew-sign', 'warm-led-strips', 'edison-bulbs'],
      build: build2025SignageLighting,
    },
    {
      category: 'counterTechnology',
      label: era2025.counterTechnology.device,
      tags: [era2025.counterTechnology.method],
      build: build2025CounterTechnology,
    },
    {
      category: 'patrons',
      label: era2025.patrons.map((p) => p.outfit).join(', '),
      tags: era2025.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: build2025Patrons,
    },
  ],
});

// Re-export the era audio config so consumers (AudioEngine, QA) can import it
// directly from the registry module without a second dynamic import.
export { ERA_AUDIO_2025 } from '../../audio/eras/2025';
export type { EraAudioConfig } from '../../audio/eras/2025';

// Keep the EraFragment type import meaningful for fragment metadata typing.
export type { EraFragment };
