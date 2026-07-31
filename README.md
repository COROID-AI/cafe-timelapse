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
registry, the era-managed scene controller, and the shared runtime navigation
rig with cross-fade era transitions.

### Getting started

```sh
npm install
npm run dev        # start the Vite dev server (shows the placeholder café canvas)
npm run build      # type-check + produce the dist bundle
npm run check:eras # QA gate: every era supplies every required category
npm run check:navigation # QA gate: camera stays inside the interior collision bounds
npm run check:transitions # QA gate: cross-fade / dolly / interruption safety
npm run check:scene # QA gate: every era's fragments mount/unmount correctly
npm run check:timeline # QA gate: timeline slider stops, drag/keyboard, ARIA, eraChange
npm run check:shell # QA gate: persistent café shell + spatial contract + slots
npm run check:integration # QA gate: AudioEngine unlock/era-swap/spatialization, onboarding, HUD
npm run check:stress # QA gate: 24+ era switches through the transition pipeline, no resource leaks
npm run check      # all QA gates + typecheck
```

### Project structure

- `src/main.ts` — entrypoint: boots the SceneManager for the scene, camera,
  renderer and timeline snap contract, wires the timeline slider through the
  TransitionController (cross-faded era switches), and drives the Navigation
  rig, the café shell, the AudioEngine (per-era sound bed + spatialization),
  the onboarding 'click to enter' gate and the animation loop.
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
- `src/systems/Navigation.ts` — the shared camera rig: orbit (drag rotate),
  pan (right-drag / two-finger), zoom (scroll / pinch), a first-person "walk up
  close" mode (F key / button), arrow-key + WASD movement, smooth damping, and
  interior collision clamping so the camera can never clip through the café
  shell (walls / floor / ceiling).
- `src/world/layout.ts` — the canonical spatial contract: room dimensions
  (`ROOM_WIDTH` / `ROOM_DEPTH` / `ROOM_HEIGHT`), the interior bounding box
  (`ROOM_BOUNDS`) consumed by Navigation, named anchor points (`ANCHORS`:
  counter position, machine slot, menu-board wall, poster walls, seating table
  positions, entrance, lighting mounts), wall-face geometry (`WALLS`) and
  interior zones (`ZONES`: counter / seating / entrance).
- `src/world/ArchitectureShell.ts` — the persistent (non-era) café room shell:
  floor, back wall, side walls, ceiling, and a storefront window wall with a
  door (real openings extruded from the layout anchors), plus a counter zone
  and seating zone. Era-neutral geometry only; era tasks dress it through the
  `SurfaceSlots` (wall slots, floor slot, ceiling/light slot) instead of
  rebuilding architecture. `src/systems/cafeShell.ts` is a compatibility shim
  re-exporting the same names for earlier phases.
- `src/systems/SceneHost.ts` — the mount/unmount hook contract the transition
  controller coordinates with, plus the reference `EraGroupHost` that mounts
  era fragments from the AssetRegistry, clones per-group materials, and
  disposes geometries/materials on unmount.
- `src/systems/SceneManager.ts` — mounts the persistent architecture shell as a
  direct scene child (a persistent layer beneath the per-era groups) through
  `mountArchitectureShell`, and disposes it on `dispose()`.
- `src/systems/TransitionController.ts` — the cross-fade controller: when the
  era changes it mounts the incoming era group, cross-fades the outgoing and
  incoming groups (configurable duration and easing, optional camera dolly),
  then disposes the outgoing group through the SceneHost hook. Interruptions
  resolve cleanly (new era mid-transition retargets; the era being revealed
  snaps to completion). Call `update(dt)` each frame.
- `src/audio/AudioEngine.ts` — the generative per-era sound bed: creates its
  AudioContext lazily on the onboarding click (autoplay policy), swaps the bed
  in lockstep with the era transition, spatializes the Web Audio listener with
  the camera each frame, and exposes a master mute for the HUD. No audio files
  are bundled — every voice is synthesized from the era config layers.
- `src/ui/OnboardingScreen.ts` — the loading / 'click to enter' gate: shows
  while the async era registry prepares, then reveals the enter button. The
  click both dismisses the overlay and unlocks Web Audio.
- `src/ui/Hud.ts` — the small in-scene overlay: active era label, mute toggle,
  walk-mode toggle and a controls hint.
- `src/systems/lighting.ts` — the per-era lighting config (background, ambient,
  key/fill/rim lights, fog), grounded in each era's canonical record.
- `src/ui/TimelineSlider.ts` — the top timeline control bar: six labeled stops
  (1945…2055), a draggable handle, era-name tooltips, keyboard-selectable stops
  (radiogroup + slider roles with full ARIA), and an `eraChange` CustomEvent.
  `src/ui/timelineData.ts` holds the DOM-free era names / keyboard math.
- `src/scripts/checkTimeline.ts` — the `check:timeline` QA gate: headless
  assertions that the slider renders the canonical stops, commits eras by
  click / drag / keyboard, emits `eraChange`, and exposes the accessibility
  surface (happy-dom based, no browser needed).
- `src/scripts/checkEras.ts` — the `check:eras` QA gate: asserts every canonical
  era is registered and supplies all required fragment categories.
- `src/scripts/checkNavigation.ts` — the `check:navigation` QA gate: headless
  assertions that the rig keeps the camera inside the interior bounds under
  orbit, zoom, pan, walk and keyboard input.
- `src/scripts/checkShell.ts` — the `check:shell` QA gate: headless assertions
  that the persistent shell builds every room element from the layout contract,
  exposes era surface slots (and `setMaterial`), keeps the shell era-neutral,
  mounts as a persistent scene layer, and that `ROOM_BOUNDS` keeps Navigation
  inside the interior.
- `src/scripts/checkTransitions.ts` — the `check:transitions` QA gate: headless
  assertions that cross-fades animate with the configured duration/easing, the
  outgoing group is disposed only after the fade, the optional dolly lerps, and
  mid-transition interruptions retarget cleanly.
- `src/scripts/checkScene.ts` — the `check:scene` QA gate: headlessly verifies
  every era's fragment group mounts with the expected category children and
  the timeline step contract matches the canonical `ERAS` timeline.
- `src/scripts/checkIntegration.ts` — the `check:integration` QA gate: headless
  assertions that every era resolves an audio config, the AudioEngine unlocks
  on a user gesture / swaps beds / spatializes / disposes cleanly (with a Web
  Audio stub), the onboarding screen drives the enter click to audio unlock,
  the HUD updates era/mute/mode, and the TransitionController leaves exactly
  one era group mounted.
- `src/scripts/checkStress.ts` — the `check:stress` QA gate (Phase 8 final QA):
  headless stress + leak verification of the era-switch pipeline. Performs 24+
  era switches through the real TransitionController + EraGroupHost path
  (including mid-transition retargets), asserts mount discipline (≤2 groups
  mid-fade, exactly 1 after each switch, 0 after dispose), instruments
  `THREE.BufferGeometry` / `THREE.Material` dispose to prove every observed
  geometry and material was disposed (no resource leaks), and asserts each
  era's live mesh footprint stays stable across cycles.

### Adding a new era

1. Add the year to `ERAS` in `src/data/eras.ts`.
2. Create `src/data/eras/<year>.ts` with a full `EraData` record.
3. Create `src/registry/eras/<year>.ts` registering one fragment per category.
4. Wire the new era into `src/registry/loadEras.ts` (and the static imports in
   `src/scripts/checkEras.ts`).
5. Run `npm run check:eras` — the gate will confirm 10/10 categories.
