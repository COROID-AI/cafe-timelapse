import { registerEra, type EraFragment } from '../AssetRegistry';
import { era1945 } from '../../data/eras/1945';
import { eraAudioConfigFor } from '../../audio/eraAudioConfigs';
import {
  build1945Architecture,
  build1945FurnitureDecor,
  build1945CoffeeMachines,
  build1945MenuBoard,
  build1945MusicSource,
  build1945Posters,
  build1945Tableware,
  build1945SignageLighting,
  build1945CounterTechnology,
  build1945Patrons,
} from '../../scenes/eras/1945';

/**
 * Phase 4 — 1945 post-war café composition.
 *
 * Each fragment builds real Three.js geometry into the era group (via the
 * shared asset library at the canonical anchors). The era audio config
 * (src/audio/eraAudioConfigs.ts) rides along on the musicSource fragment so
 * the AudioEngine and QA tooling can resolve the era's sound bed.
 */
registerEra({
  era: 1945,
  fragments: [
    {
      category: 'architecture',
      label: `Walls: ${era1945.architecture.walls}; floor: ${era1945.architecture.floor}`,
      tags: ['plaster', 'linoleum', 'tin-ceiling', 'wainscoting'],
      build: build1945Architecture,
    },
    {
      category: 'furnitureDecor',
      label: 'Bentwood chairs, bistro tables, walnut counter',
      tags: era1945.furnitureDecor,
      build: build1945FurnitureDecor,
    },
    {
      category: 'coffeeMachines',
      label: era1945.coffeeMachines.map((m) => m.name).join(', '),
      tags: era1945.coffeeMachines.map((m) => m.method),
      build: build1945CoffeeMachines,
    },
    {
      category: 'menuBoard',
      label: `${era1945.menuBoard.title}: ${era1945.menuBoard.items.map((i) => `${i.name} ${i.price}`).join(' | ')}`,
      tags: ['hand-painted', 'chalk', '1945 prices'],
      build: build1945MenuBoard,
    },
    {
      category: 'musicSource',
      label: era1945.musicSource.label,
      tags: [era1945.musicSource.kind, 'valve-radio', 'big-band', 'swing'],
      build: build1945MusicSource,
      audio: eraAudioConfigFor(1945),
    },
    {
      category: 'posters',
      label: era1945.posters.map((p) => p.title).join(', '),
      tags: era1945.posters.map((p) => p.description),
      build: build1945Posters,
    },
    {
      category: 'tableware',
      label: era1945.tableware.map((t) => t.name).join(', '),
      tags: era1945.tableware.map((t) => t.material),
      build: build1945Tableware,
    },
    {
      category: 'signageLighting',
      label: `${era1945.signageLighting.sign}; ${era1945.signageLighting.lighting}`,
      tags: ['neon-cafe-sign', 'incandescent-pendant', 'tungsten'],
      build: build1945SignageLighting,
    },
    {
      category: 'counterTechnology',
      label: era1945.counterTechnology.device,
      tags: [era1945.counterTechnology.method],
      build: build1945CounterTechnology,
    },
    {
      category: 'patrons',
      label: era1945.patrons.map((p) => p.outfit).join(', '),
      tags: era1945.patrons.map((p) => `${p.hairstyle}; ${p.gadget}`),
      build: build1945Patrons,
    },
  ],
});

// Re-export the era audio config so consumers (AudioEngine, QA) can import it
// directly from the registry module without a second dynamic import.
export { eraAudioConfigFor, ERA_AUDIO_1945 } from '../../audio/eraAudioConfigs';
export type { EraAudioConfig } from '../../audio/eraAudioConfigs';

// Keep the EraFragment type import meaningful for fragment metadata typing.
export type { EraFragment };
