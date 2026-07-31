# Café Time Period Timelapse

Create a 3D scene of a café interior. Emphasis on detail is very important.

The scene must have a timeline slider in the top, with the following options:
1945, 1965, 1985, 2005, 2025 and 2055

The point of the scene is to be able to select any of the 5 different years, and the café will transform in front of your eyes to the time period selected from the slider.

Time period should affect every detail of the café. The furniture and decor, the coffee machines and brewing equipment, the menu board and its prices, the music and what it plays from (wireless set, jukebox, boombox, iPod, phone), the posters and advertisements on the walls, the tableware, the signage and lighting, the technology at the counter (from manual till to contactless), and the outfits, hairstyles and gadgets of the patrons — everything.

This must be a polished high end scene with SFX (period-appropriate music, the murmur of conversation, the hiss and clatter of the coffee machine), the ability to navigate around and look at things up close, etc. Go all out.

## Phase 1 — Shared Scaffold, Build System & Era Contract

This repository currently contains the runnable foundation: a Vite + TypeScript +
Three.js project with the canonical era data contract and the per-era asset
registry.

### Getting started

```sh
npm install
npm run dev        # start the Vite dev server (shows the placeholder café canvas)
npm run build      # type-check + produce the dist bundle
npm run check:eras # QA gate: every era supplies every required category
npm run check:scene # QA gate: every era's fragments mount/unmount correctly
npm run check      # check:eras + check:scene + typecheck
```

### Project structure

- `src/main.ts` — entrypoint: boots the SceneManager, wires the timeline
  slider to era selection, and drives the render loop.
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
- `src/systems/SceneManager.ts` — the era-managed scene controller. Owns the
  persistent Three.js Scene, camera, renderer, OrbitControls and animation
  loop integration (`update`/`render`/`resize`). Manages a per-era `Object3D`
  group and `setActiveEra(year)` mounts the selected era's registered
  fragments, unmounting and disposing the previous era's heavy resources
  (geometries, materials, textures). Exposes `onBeforeTransition` /
  `onAfterTransition` hooks for the cross-fade controller and applies the
  per-era lighting environment (`src/systems/lighting.ts`).
- `src/systems/lighting.ts` — the per-era lighting config (background, ambient,
  key/fill/rim lights, fog), grounded in each era's canonical record.
- `src/scripts/checkEras.ts` — the `check:eras` QA gate: asserts every canonical
  era is registered and supplies all required fragment categories.
- `src/scripts/checkScene.ts` — the `check:scene` QA gate: headlessly verifies
  every era's fragment group mounts with the expected category children and
  the timeline step contract matches the canonical `ERAS` timeline.

### Adding a new era

1. Add the year to `ERAS` in `src/data/eras.ts`.
2. Create `src/data/eras/<year>.ts` with a full `EraData` record.
3. Create `src/registry/eras/<year>.ts` registering one fragment per category.
4. Wire the new era into `src/registry/loadEras.ts` (and the static imports in
   `src/scripts/checkEras.ts`).
5. Run `npm run check:eras` — the gate will confirm 10/10 categories.
