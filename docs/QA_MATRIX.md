# Final Cross-Era QA Matrix & Acceptance Verification

Phase 8 final QA pass for the Café Time Period Timelapse. This document records
the structured acceptance pass across all six eras × the brief's categories,
the end-to-end interaction verification, the defects found and their
resolutions, and the verification evidence.

Canonical timeline: `1945, 1965, 1985, 2005, 2025, 2055` (`src/data/eras.ts`).

## 1. Six eras × brief categories

The brief lists eleven things every era must carry: furniture, machines,
menu/prices, music source, posters, tableware, signage/lighting, counter tech,
surface finishes, audio config, and patrons. Mapping to the repository:

| # | Brief category | Repo surface | 1945 | 1965 | 1985 | 2005 | 2025 | 2055 |
|---|---|---|---|---|---|---|---|---|
| 1 | Furniture & decor | `furnitureDecor` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Coffee machines / brewing | `coffeeMachines` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Menu board & prices | `menuBoard` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Music source | `musicSource` fragment + `kind`/`label` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Posters & ads | `posters` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6 | Tableware | `tableware` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | Signage & lighting | `signageLighting` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | Counter technology | `counterTechnology` fragment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | Patrons (outfits/hair/gadgets) | `patrons` fragment + `PatronConfig` avatars | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | Surface finishes | `architecture` (walls/floor/ceiling/trim) + `MaterialFactory` kinds + `SurfaceSlots` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | Audio config | `eraAudioConfigs.ts` (all six eras) + `AudioEngine` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Data sources: `src/data/eras/1945.ts … 2055.ts` (full `EraData` records),
`src/registry/eras/*.ts` (one fragment per category per era), and
`src/scenes/eras/*.ts` (real Three.js builders — every era mounts 200+ meshes,
see §4).

`npm run check:eras` reports **10/10 categories for all six eras** and confirms
the composed-era audio configs (1965 jukebox/urn, 2025 BT speaker/steam wand,
2055 holo emitter/robotic brew).

## 2. End-to-end interaction verification

| Interaction | Headless gate | Browser evidence |
|---|---|---|
| Navigation (orbit/pan/zoom/walk, bounds) | `check:navigation` (aggressive orbit, zoom-in, corner clamp, walk eye-height, bounds replacement, reset) | Production build canvas renders reliably; walk-mode toggle present in HUD |
| Close-up inspection (walk mode) | `check:navigation` §4 (walk keeps camera at eye height above floor) | HUD walk-mode button wired to `Navigation.toggleMode` |
| Timeline slider | `check:timeline` (six labeled stops, click/keyboard/drag commits, `eraChange`, ARIA) | Clicked the **2055** stop in the production build |
| Transitions (cross-fade) | `check:transitions` (cross-fade 0.5/0.5 midpoint, interruption retarget, same-era snap, dolly lerp) | Era switch exercised in browser; canvas continues rendering |
| Audio sync (unlock → era swap → spatialize → mute → dispose) | `check:integration` (Web Audio stub: unlock on gesture, bed rebuild on era swap, listener follows camera, mute keeps voices, dispose stops every voice) | "Click to enter" clicked in browser (the same gesture unlocks audio) |

## 3. Performance & resource-leak verification

- **`check:stress` (new in Phase 8):** 25 era switches through the real
  `TransitionController` + `EraGroupHost` path (6 eras × 4 cycles + a
  mid-transition retarget). Asserts ≤2 era groups mid-fade, exactly 1 after
  each switch, 0 after dispose; instruments `THREE.BufferGeometry` /
  `THREE.Material` dispose and proves **0 leaked geometries/materials** out of
  6920 geometries and 8345 materials observed; asserts each era's live mesh
  footprint is stable across cycles.
- Per-era live footprints (mounted via `EraGroupHost`, `cloneMaterials: true`):

  | Era | Meshes | Geometries | Materials |
  |---|---|---|---|
  | 1945 | 257 | 256 | 317 |
  | 1965 | 207 | 207 | 255 |
  | 1985 | 298 | 297 | 348 |
  | 2005 | 313 | 313 | 377 |
  | 2025 | 223 | 223 | 280 |
  | 2055 | 296 | 296 | 344 |

  Total 1594 meshes across all eras; one era is mounted at a time (plus one
  transient group mid-cross-fade), so the live scene stays bounded (~200–313
  meshes).

- Performance targets (≥60fps mid-range, ≥30fps low-end): the app is
  deliberately low-poly/procedural (no external assets, no texture downloads,
  merged avatar geometry, capped texture resolution, per-era material cache,
  `renderer.setPixelRatio(min(devicePixelRatio, 2))`). The production build
  renders continuously under a **software** WebGL renderer (SwiftShader) with
  no console errors, which is a strong low-end proxy; exact FPS numbers require
  a GPU-equipped browser and are left to QA's acceptance environment.

## 4. Defects found & resolution

| # | Defect | Evidence | Resolution |
|---|---|---|---|
| 1 | `package.json` shipped without `dependencies`/`devDependencies` blocks (they existed only in `package-lock.json`), so `npm install` installed nothing and every check script failed with `tsx: not found` | `npm run check` → `sh: 1: tsx: not found`; `node -e` on the lockfile showed the declared deps at `packages[''].devDependencies` | Restored the declared dependencies into `package.json` (`three` + `tsx`/`vite`/`typescript`/`happy-dom`/`@types/*`) matching the lockfile; `npm install` succeeded; full check suite then passed |
| 2 | No automated gate covered the "no resource leaks across 20+ era switches" acceptance criterion | `rg` across `src/scripts` found no leak/stress script; existing gates were single-switch | Added `src/scripts/checkStress.ts` (`check:stress`) — 25 switches, disposal instrumentation, footprint stability; wired into `npm run check` |

No other defects were found: the full `npm run check` suite passes, the
production build succeeds, and the browser run shows no page errors, no
console errors, and no failed network requests.

## 5. Verification evidence

- `npm run check:eras` → OK for all six eras (10/10 categories).
- `npm run check` (all gates + typecheck) → exit 0:
  `check:eras`, `check:navigation`, `check:transitions`, `check:scene`,
  `check:assets`, `check:timeline`, `check:shell`, `check:1965`,
  `check:1985`, `check:2005`, `check:2025`, `check:2055`,
  `check:characters`, `check:integration`, `check:stress`, `typecheck`.
- `npm run build` → exit 0 (`tsc --noEmit && vite build`).
- Production build in browser (`vite preview` after build):
  - HTTP 200 on `/`;
  - onboarding "Click to enter" clickable (audio-unlock gesture);
  - timeline 2055 stop clickable and era switch exercised;
  - canvas non-blank with reliable pixel sampling (software WebGL renderer);
  - **zero** page errors, **zero** console errors, **zero** network failures
    (only benign SwiftShader "GPU stall" performance warnings, marked
    diagnostic by the harness).
- Impeccable UI scan (pinned 3.4.0, deep, workspace) → 0 findings.

## 6. Final cross-era review

All six eras are complete, period-accurate (data records + scene builders +
audio configs grounded in each era's canonical record), and polished
(procedural textures, per-era lighting, avatar idle animation, spatialized
audio). The era-switch pipeline is leak-free across 25 switches and the
production bundle runs in a browser with no console errors.
