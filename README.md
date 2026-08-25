# Café Time Period Timelapse

Create a 3D scene of a café interior. Emphasis on detail is very important.

The scene must have a timeline slider in the top, with the following options:
1945, 1965, 1985, 2005, 2025 and 2055

The point of the scene is to be able to select any of the 5 different years, and the café will transform in front of your eyes to the time period selected from the slider.

Time period should affect every detail of the café. The furniture and decor, the coffee machines and brewing equipment, the menu board and its prices, the music and what it plays from (wireless set, jukebox, boombox, iPod, phone), the posters and advertisements on the walls, the tableware, the signage and lighting, the technology at the counter (from manual till to contactless), and the outfits, hairstyles and gadgets of the patrons — everything.

This must be a polished high end scene with SFX (period-appropriate music, the murmur of conversation, the hiss and clatter of the coffee machine), the ability to navigate around and look at things up close, etc. Go all out.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Install dependencies

```bash
npm install
```

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload (serves at http://localhost:5173) |
| `npm run build` | Type-check the sources (`tsc --noEmit`) and emit an optimized production build into `dist/` |
| `npm run preview` | Serve the production build from `dist/` locally |

### Project structure

```
index.html          # HTML entrypoint mounting the full-viewport canvas
src/main.ts         # App shell: renderer, scene, camera, controls, lights, loop
src/style.css       # Full-viewport canvas styling
public/             # Static assets served verbatim
docs/               # Project documentation
```
