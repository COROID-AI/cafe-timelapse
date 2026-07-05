# Café Time Period Timelapse

An interactive 3D café interior that morphs through five time periods — **1945,
1965, 1985, 2005, and 2025** — right before your eyes. Drag the timeline slider
and watch the furniture, coffee machines, menu prices, music, posters,
tableware, lighting, counter technology, and patrons all transform to the era.

Built with **Three.js** (WebGL) and **Vite**. Every 3D object, texture, and
sound is **procedurally generated at runtime** — there are zero external asset
files to download.

---

## Features

- **Five fully-realised eras** — each with period-accurate furniture, coffee
  equipment, menu/prices, music source, wall posters, tableware, signage,
  lighting, counter technology, and patrons.
- **Smooth cross-fade transitions** — the café morphs between eras with a
  1.5-second opacity cross-fade; GPU resources are disposed to prevent leaks.
- **Dual navigation** — orbit-rotate the camera, or toggle first-person walk
  mode (pointer-lock + WASD / arrow keys) to explore the room up close.
- **Interactive inspector hotspots** — glowing markers at the menu board,
  coffee machine, music source, counter technology, and one patron per era.
  Hover for a label; click to open a detailed side panel with era-specific
  descriptions, price lists, and product specs.
- **Per-era lighting profiles** — the base ambient/hemisphere/key-light colour
  and intensity shift visibly between eras (warm incandescent → cool
  fluorescent → clean LED).
- **Layered procedural SFX** — era-appropriate music (synthesised), café
  ambience (murmur, cup clatter), and coffee-machine sounds, all cross-faded
  on era change via the Web Audio API.

---

## Prerequisites

- **Node.js** ≥ 18 (uses native ES modules)
- A WebGL-capable browser (Chrome, Firefox, Edge, Safari)

---

## Install

```bash
npm install
```

This installs Three.js and Vite from `package.json`.

---

## Development

```bash
npm run dev
```

Starts the Vite dev server with hot-module replacement. Open the printed URL
( defaults to `http://127.0.0.1:5173`). The runner-provided `PORT` environment
variable is honoured automatically.

### Performance profiling

Append `?fps=1` to the dev URL to show a live FPS counter overlay:

```
http://127.0.0.1:5173/?fps=1
```

The counter is colour-coded: **green** ≥ 30 FPS, **amber** 20–29, **red** < 20.

---

## Build

```bash
npm run build
```

Bundles the app into `dist/` (minified, tree-shaken). The output is a static
site that can be served from any static host.

## Preview the production build

```bash
npm run preview
```

Serves the built `dist/` folder locally for a final smoke test.

---

## Usage

1. **Select an era** — drag the timeline slider at the top of the screen to
   1945, 1965, 1985, 2005, or 2025.
2. **Look around** — click-drag to orbit, scroll to zoom.
3. **Walk inside** — click the "Walk Mode" button (bottom-right) to enter
   first-person mode. Use **WASD** or **arrow keys** to move, mouse to look.
   Press **Esc** or click the button again to exit.
4. **Inspect objects** — hover over the glowing markers to see labels. Click a
   marker to open a detail side panel with era-specific information. Press
   **Esc** or the **×** button to close the panel.
5. **Listen** — audio unlocks on your first click/keypress (browser autoplay
   policy). Each era has its own procedurally-synthesised soundtrack.

---

## Asset Sources

All assets in this project are **100% procedurally generated at runtime**.
There are **no external image, model, audio, or font files** — nothing is
downloaded from a CDN or bundled from third-party sources.

### 3D geometry

All meshes are built from Three.js primitives (boxes, cylinders, spheres,
planes) in [`src/eras/era-builder.js`](src/eras/era-builder.js). Furniture,
equipment, patrons, signage, and decor are assembled programmatically from
these primitives — no GLTF/OBJ model files are used.

### Textures (menu boards, posters, signage)

Menu boards, wall posters, and café signage are rendered to an off-screen
`<canvas>` 2D context and applied as `THREE.CanvasTexture` to plane meshes.
This includes the text, colours, gradients, and emoji icons — all drawn with
the Canvas 2D API at runtime.

### Audio (music, ambience, SFX)

The entire soundscape is **synthesised in real time** using the Web Audio API
(`AudioContext`, oscillators, noise buffers, biquad filters, and gain
envelopes). No recordings, samples, or third-party audio files are used. See
[`SOURCES.md`](SOURCES.md) for the full technical breakdown of the synthesis
engine, per-era musical parameters, and cross-fade behaviour.

### Fonts

The app uses only the system font stack (`system-ui`, `sans-serif`, `serif`,
`monospace`) — no web fonts are loaded.

### Licensing

Because every asset is algorithmically generated, the project is
**royalty-free** and carries no third-party licensing requirements. The
synthesis and geometry code is original work covered by this project's
license.

---

## Project structure

```
├── public/
│   ├── index.html              # HTML entry point (Vite root)
│   └── js/
│       ├── main.js             # App bootstrap + CafeScene public API
│       ├── scene-renderer.js   # Persistent 3D café shell + navigation
│       ├── timeline-slider.js  # Top-of-screen era selector UI
│       ├── inspector.js        # Interactive hotspot markers + detail panel
│       ├── hotspot-data.js     # Per-era hotspot definitions (5+ each)
│       └── audio-manager.js    # Procedural SFX + music synthesis
├── src/
│   ├── contracts/
│   │   └── PeriodPackage.js    # Era package schema + validation
│   ├── eras/
│   │   ├── era-builder.js      # Procedural mesh factory
│   │   ├── 1945.js             # Post-War Revival package
│   │   ├── 1965.js             # Swinging Sixties package
│   │   ├── 1985.js             # Neon Eighties package
│   │   ├── 2005.js             # Noughties Chillout package
│   │   └── 2025.js             # Contemporary Artisan package
│   └── managers/
│       └── PeriodManager.js    # Era lifecycle + cross-fade orchestration
├── docs/
│   └── screenshots/            # QA-captured era screenshots
├── SOURCES.md                  # Audio synthesis technical breakdown
├── vite.config.js              # Vite build config (@ → src/ alias)
└── package.json
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| 3D rendering | Three.js ^0.170 (WebGL2) |
| Build tool | Vite ^5.4 |
| Audio | Web Audio API (procedural synthesis) |
| Language | Vanilla JavaScript (ES modules) |

---

## License

Original work. All content is procedurally generated — no third-party assets.
