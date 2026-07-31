# Café Time Period Timelapse

Create a 3D scene of a café interior. Emphasis on detail is very important.

The scene must have a timeline slider in the top, with the following options:
1945, 1965, 1985, 2005, 2025 and 2055

The point of the scene is to be able to select any of the 5 different years, and the café will transform in front of your eyes to the time period selected from the slider.

Time period should affect every detail of the café. The furniture and decor, the coffee machines and brewing equipment, the menu board and its prices, the music and what it plays from (wireless set, jukebox, boombox, iPod, phone), the posters and advertisements on the walls, the tableware, the signage and lighting, the technology at the counter (from manual till to contactless), and the outfits, hairstyles and gadgets of the patrons — everything.

This must be a polished high end scene with SFX (period-appropriate music, the murmur of conversation, the hiss and clatter of the coffee machine), the ability to navigate around and look at things up close, etc. Go all out.

## Phase 1 — Shared Scaffold, Build System & Era Contract

This repository currently contains the runnable foundation: a Vite + TypeScript +
Three.js project with the canonical era data contract, the per-era asset
registry, and the shared runtime navigation rig.

### Getting started

```sh
npm install
npm run dev        # start the Vite dev server (shows the placeholder café canvas)
npm run build      # type-check + produce the dist bundle
npm run check:eras # QA gate: every era supplies every required category
npm run check:navigation # QA gate: camera stays inside the interior collision bounds
npm run check:audio # QA gate: procedural audio engine builds per-era beds, spatialises and crossfades
npm run check      # check:eras + check:navigation + check:audio + typecheck
```

### Project structure

- `src/main.ts` — entrypoint: Three.js renderer, scene, camera, the Navigation
  rig, the café shell placeholder geometry and the animation loop.
- `src/data/EraData.ts` — the canonical `EraData` type covering every brief
  category: architecture (walls/floor/ceiling/trim), furniture & decor, coffee
  machines & brewing equipment, menu board & prices, music source (wireless
  set/jukebox/boombox/iPod/phone/streaming), posters & advertisements,
  tableware, signage & lighting, counter technology (manual till → contactless)
  and patrons (outfits/hairstyles/gadgets).
- `src/data/eras.ts` — the canonical timeline `[1945, 1965, 1985, 2005, 2025, 2055]`.
- `src/data/eras/*.ts` — one full `EraData` record per era.
- `src/registry/AssetRegistry.ts` — the registration pattern: every era registers
  scene fragments by category. Each fragment carries a `category`, `label`,
  `tags`, and a `build(target, era)` hook that later phases implement with real
  Three.js geometry.
- `src/registry/eras/*.ts` — the per-era registrations (loaded by
  `src/registry/loadEras.ts`).
- `src/systems/Navigation.ts` — the shared camera rig: orbit (drag rotate),
  pan (right-drag / two-finger), zoom (scroll / pinch), a first-person "walk up
  close" mode (F key / button), arrow-key + WASD movement, smooth damping, and
  interior collision clamping so the camera can never clip through the café
  shell (walls / floor / ceiling).
- `src/systems/cafeShell.ts` — the canonical interior bounding volume and the
  placeholder shell meshes that make it visible.
- `src/systems/audioProfiles.ts` — the canonical per-era audio configuration:
  each era defines its music source object (wireless set → jukebox → boombox →
  iPod → phone/speaker) with a generative character (tempo, scale, waveform,
  filtering, hiss/crackle), plus coffee-machine hiss/clatter and conversation
  murmur levels and the in-scene positions used for spatialisation.
- `src/systems/AudioEngine.ts` — the procedural Web Audio engine: layered
  ambient beds (conversation murmur loop, coffee machine hiss/clatter SFX,
  period-appropriate generative music), spatialised coffee machine and music
  source via PannerNodes positioned at their in-scene objects, layer
  crossfades on era change, an autoplay-policy unlock on the first user
  gesture (`unlock()`), a mute toggle (`setMuted()`), and per-frame `update()`
  so the listener follows the camera. No audio files are shipped — everything
  is synthesised from noise buffers and oscillator sequences.
- `src/scripts/checkEras.ts` — the `check:eras` QA gate: asserts every canonical
  era is registered and supplies all required fragment categories.
- `src/scripts/checkNavigation.ts` — the `check:navigation` QA gate: headless
  assertions that the rig keeps the camera inside the interior bounds under
  orbit, zoom, pan, walk and keyboard input.
- `src/scripts/checkAudio.ts` — the `check:audio` QA gate: headless assertions
  (via a fake AudioContext) that every era has a complete profile, the engine
  unlocks on a simulated gesture, beds start, music/clatter schedule ahead,
  layers crossfade on era change, spatialisers sit at the in-scene objects,
  the mute toggle ramps the master gain, and dispose() stops everything.

### Adding a new era

1. Add the year to `ERAS` in `src/data/eras.ts`.
2. Create `src/data/eras/<year>.ts` with a full `EraData` record.
3. Create `src/registry/eras/<year>.ts` registering one fragment per category.
4. Wire the new era into `src/registry/loadEras.ts` (and the static imports in
   `src/scripts/checkEras.ts`).
5. Run `npm run check:eras` — the gate will confirm 10/10 categories.
