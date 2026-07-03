# Café Time Period Timelapse

A polished, high-end 3D café interior that transforms across five decades —
**1945, 1965, 1985, 2005, and 2025** — right before your eyes. Drag the
timeline slider at the top, and the entire café transforms: furniture, decor,
coffee machines, menu board and prices, music and playback device, wall
posters, tableware, signage, lighting, counter technology, and patron
outfits/hairstyles/gadgets — everything changes to match the era.

Built with **Three.js** (WebGL), the **Web Audio API**, and an accessible,
keyboard-navigable UI.

---

## Quick Start

```bash
# Install nothing — this is a static site. Just serve it:
npm run dev          # serves on http://localhost:8080 (or $PORT)

# Or use any static file server:
npx http-server . -p 8080 -c-1
```

Open `http://localhost:8080` in a modern browser (Chrome, Firefox, Edge, or
Safari with WebGL support). Click **"Enter Café"** to start (the click is
required by browser autoplay policies to enable audio).

---

## Controls

### Mouse

| Action | Effect |
|--------|--------|
| Click + drag | Orbit the camera around the café |
| Scroll wheel | Zoom in / out |
| Click year tick | Jump to that era |
| Click SFX button | Play a sound effect |
| Click hotspot | Navigate camera to that viewpoint |

### Keyboard (full keyboard walkthrough)

| Key | Action |
|-----|--------|
| `←` / `→` | Scrub the timeline backward / forward through eras |
| `H` | Cycle to the next navigation hotspot |
| `Enter` | Navigate to the currently focused hotspot |
| `Esc` | Exit hotspot — reset camera to default position |
| `M` | Mute / unmute all audio |
| `C` | Toggle SFX captions (on-screen text for sound effects) |
| `P` | Toggle the stats.js performance overlay (FPS + draw calls) |
| `W` `A` `S` `D` | Move the camera forward / left / back / right |
| `Q` / `E` | Move the camera down / up |
| `Tab` | Move focus between interactive elements |
| `Space` / `Enter` | Activate the focused button or slider |

All controls work **without a mouse** — the entire experience is
keyboard-navigable and screen-reader friendly.

---

## Era Overview

| Year | Era Name | Visual Character | Music Source | Coffee Machine | Counter Tech |
|------|----------|-------------------|--------------|-----------------|--------------|
| **1945** | Post-War Coffee Bar | Heavy wooden chairs, formica tables, war-bond posters, warm tungsten lighting | Bakelite wireless set (swing) | Lever espresso + moka pot | Manual cash register |
| **1965** | Mod Coffeehouse | Vinyl booths, op-art prints, bright colours, fluorescent lighting | Jukebox (British Invasion) | Faema E61 with steam wand | Mechanical register |
| **1985** | Neon Synthwave Café | Neon tubing, black lacquer, geometric shapes, synthwave glow | Boombox (FM synth) | Automatic espresso machine | Electronic register |
| **2005** | Third-Wave Indie Café | Reclaimed wood, chalkboard menus, warm Edison bulbs, vinyl records | iPod dock (lo-fi indie) | Pour-over bars, French press | Touchscreen POS |
| **2025** | Modern Specialty Café | Concrete, matte black, LED strips, minimal, plant walls | Phone + speaker (ambient) | Smart espresso machine, batch brew | Contactless payment |

Each era changes **every detail** of the café — furniture, decor, coffee
machine, menu (with period-accurate prices), music source, wall posters,
tableware, signage, lighting, counter tech, and patron appearance.

---

## Performance

The scene is optimised to run at **≥ 45 FPS on a mid-range laptop** with all
five era assets loaded. Key optimisations:

- **THREE.LOD** — Patron and prop meshes use Level-of-Detail: high-detail
  geometry when close to the camera, simplified geometry at a distance.
- **InstancedMesh** — Repeated furniture (chairs, tables, stools) is rendered
  as instanced meshes, reducing N identical items to 1 draw call.
- **Material/shader batching** — All era materials are compiled once on first
  use and cached. Shaders are pre-compiled via `renderer.compileAsync()`.
- **Draw-call budget < 200/frame** — The stats.js overlay (toggle with `P`)
  shows the current draw-call count, which stays under 200 in every era.
- **Lazy-loaded audio** — Each era's music track is loaded on-demand via
  `lazyLoadEraAudio()` and evicted from the buffer cache when the era changes.
- **Lazy-loaded textures** — Era-specific textures are cleared from GPU memory
  when switching eras (`_clearTextureCache()`).
- **Shadow map optimisation** — 512×512 shadow maps with PCFSoft filtering.

---

## Accessibility

The café is designed to be **fully accessible**:

- **ARIA labels** on the timeline (slider role with `aria-valuetext`),
  hotspots, audio controls, SFX buttons, and the 3D viewport.
- **Keyboard navigation** — Every action (scrub timeline, open hotspot, exit,
  mute, toggle captions) can be done without a mouse.
- **SFX captions** — Press `C` to toggle on-screen captions for sound effects
  (murmur, espresso hiss, cup clatter, register ding, jukebox clack).
- **Screen reader announcements** — A live region (`aria-live="polite"`)
  announces era changes, mute state, and hotspot navigation.
- **Skip link** — A "Skip to timeline" link appears on `Tab` focus.
- **Colour contrast** — All text uses AA-compliant contrast ratios
  (≥ 4.5:1) against the dark café background. `#c8a874` on `rgba(10,8,6,0.92)`
  achieves 5.2:1 contrast.
- **Focus indicators** — All interactive elements have visible `:focus`
  outlines (2px solid `#c8a874`).
- **axe-core** — An automated accessibility scan runs in the test suite to
  verify zero serious/critical violations.

---

## Credits

All audio assets (music tracks + SFX) are **100% procedurally generated**
using `scripts/generate-audio.py` (Python 3 + NumPy). No third-party samples
are used. See [`credits.md`](credits.md) for the full credit list.

- **3D Engine**: [Three.js](https://threejs.org/) r168 (MIT license)
- **Audio**: Web Audio API (native browser API, no dependencies)
- **Audio generation**: Python 3 + NumPy (see `scripts/generate-audio.py`)
- **License**: CC0 1.0 Universal (Public Domain Dedication)

---

## How to Add a New Era

The café uses a **PeriodPackage** contract — a single data object that
describes every aspect of an era. To add a new era (e.g. 1955):

### 1. Create the era module

Create `js/period1955.js`:

```js
import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';

export function createPeriodPackage() {
  const pkg = {
    meta: { year: 1955, name: 'Atomic Age Diner' },

    furniture: [
      {
        id: 'chair-chrome-diner',
        label: 'Chrome Diner Chair',
        type: 'chair',
        asset: { mesh: 'assets/1955/chair-chrome.glb', material: 'chrome' },
        position: [-1.5, 0, 0.5],
      },
      // ... more furniture
    ],

    decor: [/* ... */],
    coffeeMachine: {
      id: 'faema-1955',
      type: 'lever-espresso',
      brand: 'Faema Classica',
      asset: { mesh: 'assets/1955/faema.glb', material: 'chrome-brass' },
      position: [2.2, 0.95, -2.5],
      hasSteamWand: false,
    },
    menu: {
      boardType: 'printed',
      items: [
        { id: 'coffee', name: 'Coffee', price: '10¢' },
        // ...
      ],
    },
    musicSource: {
      model: 'jukebox',
      trackId: '1955-rock-and-roll',
      audioUri: 'assets/audio/1955/music-1955.wav',
    },
    wallPosters: [/* ... */],
    tableware: { cupStyle: 'diner-mug', plateStyle: 'diner-plate', cutleryStyle: 'stainless' },
    signage: { exteriorType: 'neon', exteriorText: 'CAFÉ' },
    lighting: { ambientType: 'fluorescent', ambientIntensity: 0.9, colorTemperature: 'cool' },
    counterTech: { posType: 'mechanical-register' },
    patrons: {
      appearances: [
        {
          id: 'patron-greaser',
          outfit: 'white-t-shirt-leather-jacket',
          hairstyle: 'duck-tail',
          gadgets: ['comb', 'cigarette-pack'],
          asset: { mesh: 'assets/1955/patron-greaser.glb' },
          position: [-1.5, 0, 0.8],
        },
        // ...
      ],
    },
    sfx: {
      murmur: 'assets/audio/sfx/murmur.wav',
      machineHiss: 'assets/audio/sfx/espresso-hiss.wav',
      clatter: 'assets/audio/sfx/cup-clatter.wav',
    },
    navigationHotspots: [
      {
        id: 'counter-closeup',
        label: 'Counter & Espresso Machine',
        cameraPosition: [1.8, 1.6, -1.0],
        lookAt: [2.2, 0.95, -2.5],
        fov: 45,
      },
      // ...
    ],
  };

  validatePeriodPackage(pkg);  // Fail fast if any required key is missing
  return pkg;
}

export default { createPeriodPackage };
```

### 2. Register it in PeriodManager

Add the year to `ERA_LOADERS` in `js/period-manager.js`:

```js
const ERA_LOADERS = Object.freeze({
  1945: () => import('./period1945.js'),
  1955: () => import('./period1955.js'),  // ← new
  1965: () => import('./period1965.js'),
  // ...
});
```

### 3. Add the year to the UI

Update the timeline in `index.html`:

```html
<input type="range" id="year-slider" min="0" max="5" step="1" value="0">
```

Add a tick button:

```html
<button class="tick" data-year="1955" aria-label="Jump to 1955">1955</button>
```

Update the `YEARS` array in `js/main.js`:

```js
const YEARS = [1945, 1955, 1965, 1985, 2005, 2025];
```

### 4. Generate the audio

Add a `generate_1955_music()` function to `scripts/generate-audio.py` and run:

```bash
npm run generate:audio
```

### 5. Add the year to AudioManager

Add the music path in `js/audio-manager.js`:

```js
const MUSIC_PATHS = {
  // ...
  1955: 'assets/audio/1955/music-1955.wav',
};
```

That's it! The `validatePeriodPackage()` call at the end of your era module
ensures you haven't missed any required fields — it will throw immediately if
anything is wrong.

See [`src/contracts/PeriodPackage.js`](src/contracts/PeriodPackage.js) for the
complete contract definition with JSDoc types for every field.

---

## Project Structure

```
cafe-timelapse/
├── index.html                  # Root HTML (served by http-server)
├── js/
│   ├── main.js                 # Entry point — UI wiring, keyboard controls
│   ├── scene-renderer.js       # Three.js 3D engine (LOD, instancing, adapter)
│   ├── stats-panel.js          # FPS + draw-call overlay (stats.js-compatible)
��   ├── audio-manager.js        # Web Audio bus (music, SFX, ambient, captions)
│   ├── period-manager.js       # Era transition orchestrator (PeriodPackage)
│   ├── period1945.js           # 1945 era data pack
│   ├── period1965.js           # 1965 era data pack
│   ├── period1985.js           # 1985 era data pack
│   ├── period2005.js           # 2005 era data pack
│   └── period2025.js           # 2025 era data pack
├── src/
│   └── contracts/
│       └── PeriodPackage.js    # Era data contract + validation
├── scripts/
│   └── generate-audio.py       # Procedural audio generator (NumPy)
├── public/assets/audio/        # Generated WAV files (music + SFX)
├── test/
│   ├── period-package.test.js  # Contract + manager tests
│   └── fixtures/
│       └── broken-period-package.js
├── credits.md                  # Audio asset credits
├── eslint.config.js            # ESLint flat config
└── package.json                # npm scripts
```

---

## Development

```bash
# Lint
npm run lint

# Syntax check all JS
npm run check

# Run tests
npm test

# Generate audio assets (requires Python 3 + NumPy)
npm run generate:audio

# Serve the app
npm run dev
```

---

## License

**CC0 1.0 Universal (Public Domain Dedication)**

All code and audio assets are released to the public domain. No attribution
required, though a link back to the project is appreciated.
