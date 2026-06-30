# Café Time Period Timelapse

Create a 3D scene of a café interior. Emphasis on detail is very important.

The scene must have a timeline slider in the top, with the following options:
1945, 1965, 1985, 2005 and 2025

The point of the scene is to be able to select any of the 5 different years, and the café will transform in front of your eyes to the time period selected from the slider.

Time period should affect every detail of the café. The furniture and decor, the coffee machines and brewing equipment, the menu board and its prices, the music and what it plays from (wireless set, jukebox, boombox, iPod, phone), the posters and advertisements on the walls, the tableware, the signage and lighting, the technology at the counter (from manual till to contactless), and the outfits, hairstyles and gadgets of the patrons — everything.

This must be a polished high end scene with SFX (period-appropriate music, the murmur of conversation, the hiss and clatter of the coffee machine), the ability to navigate around and look at things up close, etc. Go all out.

---

## Running the project

> **Do not open `index.html` directly from disk.**
>
> The app is built with ES modules (`<script type="module">`) and a Three.js
> importmap. Browsers block module scripts over the `file://` protocol — that
> shows up as a black screen with CORS errors such as
> _"Cross origin requests are only supported for protocol schemes: http,
> https"_. Serve the project over HTTP instead.

### Recommended (no install, no internet required)

Requires Node.js 18+.

```bash
npm start
```

Then open **http://localhost:8000** in your browser.

The included `server.js` is a zero-dependency static server (Node.js
built-ins only), so no `npm install` is needed.

### Alternative

Any static file server works, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open **http://localhost:8000**.

If you open `index.html` via `file://` anyway, the page shows a friendly
notice explaining how to run it instead of a blank black screen.
