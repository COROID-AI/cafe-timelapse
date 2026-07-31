import { registerEra, type EraFragment } from '../AssetRegistry';
import { era1985 } from '../../data/eras/1985';
import { eraAudioConfigFor } from '../../audio/eraAudioConfigs';
import {
  build1985Architecture,
  build1985FurnitureDecor,
  build1985CoffeeMachines,
  build1985MenuBoard,
  build1985MusicSource,
  build1985Posters,
  build1985Tableware,
  build1985SignageLighting,
  build1985CounterTechnology,
  build1985Patrons,
} from '../../scenes/eras/1985';

/**
 * Phase 4 — 1985 eighties espresso-bar composition.
 *
 * Each fragment builds real Three.js geometry into the era group (via the
 * shared asset library at the canonical anchors). The era audio config
 * (src/audio/eraAudioConfigs.ts) rides along on the musicSource fragment so
 * the AudioEngine and QA tooling can resolve the era's sound bed.
 */
registerEra({
  era: 1985,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1985.architecture.walls}; floor: ${era1985.architecture.floor}`,
      tags: ['terrazzo', 'peach', 'mirrors', 'chrome-rails', 'suspended-ceiling'],
      build: build1985Architecture,
    },
    {
      category: 'furnitureDecor',
      label: 'Tubular chrome tables, pastel Memphis tops, mirrored walls',
      tags: era1985.furnitureDecor,
      build: build1985FurnitureDecor,
    },
    {
      category: 'coffeeMachines',
      label: era1985.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1985.coffeeMachines.map((m) => m.method),
      build: build1985CoffeeMachines,
    },
    {
      category: 'menuBoard',
      label: `${era1985.menuBoard.title}: ${era1985.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: ['chalkboard', 'neon-markers', '1985 dollar prices'],
      build: build1985MenuBoard,
    },
    {
      category: 'musicSource',
      label: era1985.musicSource.label,
      tags: [era1985.musicSource.kind, 'ghetto-blaster', 'synth-pop', 'new-wave'],
      build: build1985MusicSource,
      audio: eraAudioConfigFor(1985),
    },
    {
      category: 'posters',
      label: era1985.posters.map((p) => p.title).join(', '),
      tags: era1985.posters.map((p) => p.description),
      build: build1985Posters,
    },
    {
      category: 'tableware',
      label: era1985.tableware.map((t) => t.name).join(', '),
      tags: era1985.tableware.map((t) => t.material),
      build: build1985Tableware,
    },
    {
      category: 'signageLighting',
      label: `${era1985.signageLighting.sign}; ${era1985.signageLighting.lighting}`,
      tags: ['pink-neon', 'blue-neon', 'track-lighting'],
      build: build1985SignageLighting,
    },
    {
      category: 'counterTechnology',
      label: era1985.counterTechnology.device,
      tags: [era1985.counterTechnology.method],
      build: build1985CounterTechnology,
    },
    {
      category: 'patrons',
      label: era1985.patrons.map((p) => p.outfit).join(', '),
      tags: era1985.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: build1985Patrons,
    },
  ],
});

// Re-export the era audio config so consumers (AudioEngine, QA) can import it
// directly from the registry module without a second dynamic import.
export { eraAudioConfigFor, ERA_AUDIO_1985 } from '../../audio/eraAudioConfigs';
export type { EraAudioConfig } from '../../audio/eraAudioConfigs';

// Keep the EraFragment type import meaningful for fragment metadata typing.
export type { EraFragment };
