# Café Timelapse

A 3D café interior that transforms across five eras — 1945, 1965, 1985, 2005, and 2025 — via a timeline slider. Every detail changes: furniture, coffee equipment, menu and prices, music source, wall art, lighting, payment technology, and the patrons themselves.

## Run

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). Click **"Enter the Café"** to start — this first click also unlocks audio per browser autoplay policy.

### Controls

- **Timeline slider** (top): click a year, drag the thumb, or use **←/→/Home/End** to switch eras.
- **Camera**: drag to orbit, scroll/pinch to zoom, right-drag to pan (clamped to the room).
- **Hotspots**: click the glowing markers (or the objects themselves) to open the inspector panel. **Esc** or click outside to close.

### Audio

Audio is fully procedural (Web Audio API synthesis) — no licensed assets are shipped. Period-style music loops, ambient crowd murmur, and coffee-machine SFX are generated at runtime. Audio starts after your first click anywhere on the page (browser autoplay policy).

#### Adding your own music

Drop royalty-free / CC0 tracks into `public/assets/audio/` named by era — e.g. `1945.mp3`, `1965.ogg`. The AudioManager will use them instead of the synthesized loops. Supported formats: `.mp3`, `.ogg`, `.wav`.

## Build

```bash
npm run build      # produces dist/
npm run preview    # serves the production build
```

## Tech Stack

- **Vite** + **Three.js** (vanilla ES modules — no React, no UI framework)
- Hand-styled CSS HUD with per-era theming via `body[data-era]` custom properties
- Procedural geometry and audio — zero external image/audio assets required

## Eras

| Year | Era | Music Source | Coffee Equipment | Payment |
|------|-----|-------------|-----------------|---------|
| 1945 | Post-War Austerity | Cathedral radio | Stove-top percolator | Crank cash register |
| 1965 | Mid-Century Modern | Wurlitzer jukebox | Lever espresso machine | Adding-machine register |
| 1985 | Neon 80s | Boombox | Two-group espresso | Digital register |
| 2005 | Third-Wave Minimalist | iPod dock | Commercial espresso + pour-over | Flat-screen POS |
| 2025 | Modern Sustainable | Bluetooth speaker | Modbar under-counter brewer | Contactless POS |
