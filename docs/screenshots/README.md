# Era Screenshots

This directory holds one screenshot per era, captured by the QA walkthrough
using the built-in FPS/performance overlay (`?fps=1` URL parameter).

## Capturing screenshots

1. Start the dev server: `npm run dev`
2. Open the app and append `?fps=1` to the URL to show the performance counter.
3. For each era (1945, 1965, 1985, 2005, 2025):
   - Select the year on the timeline slider.
   - Wait for the 1.5-second cross-fade to settle.
   - Orbit / walk to a representative viewing angle.
   - Capture the screenshot (browser DevTools → "Capture screenshot", or the OS
     screen-capture shortcut).
4. Save as `1945.png`, `1965.png`, `1985.png`, `2005.png`, `2025.png`.

## Expected files

| File | Era |
|------|-----|
| `1945.png` | Post-War Revival |
| `1965.png` | Swinging Sixties |
| `1985.png` | Neon Eighties |
| `2005.png` | Noughties Chillout |
| `2025.png` | Contemporary Artisan |

> These screenshots are captured during the QA walkthrough and committed here
> as evidence that each era renders correctly and holds ≥ 30 FPS at 1080p.
