# Menu Boards & Period Prices (`menu` prop group)

Procedural, period-correct menu boards for all five café eras
(1945 / 1965 / 1985 / 2005 / 2025), driven by the `menuBoard` payload of each
era config and swapped with an opacity crossfade.

## Integration

```ts
import { registerMenuPropGroup } from './cafe/props/menu';

registerMenuPropGroup(cafeScene); // registers under the 'menu' key
cafeScene.applyEra(1965);         // crossfades the board into 1965
```

Declarative registries can use `MENU_PROP_GROUP`
(`{ key: 'menu', build, update }`) or call
`CafeScene.registerPropGroup(MENU_PROP_GROUP_KEY, MenuBoardBuilderBuild, updateMenuBoard)`
directly. `disposeMenuPropGroup(host)` tears the rig down (cancels the
animation loop, disposes geometry/materials/textures).

## Data flow

1. The routed `EraConfig.menu` section is scanned by `extractMenuBoard()`.
   It accepts either a carrier object (`{ menuBoard: {...} }`, matching the
   field name in `src/cafe/eras/types.ts`) or the menu keys directly on the
   section.
2. Every year renders a fully procedural built-in preset even when the
   payload is absent (current era stubs), so all five eras always show a
   plausible, correctly priced board.
3. When era content lands, the payload enriches the scene: routed items
   replace preset labels, routed prices are matched by `itemId` first (then
   position) so partial data can never blank the board, and
   `boardStyle` / `specialsNote` stamp through to the active variant's
   `userData` (`renderedRows`, `boardStyle`, `specialsNote`,
   `sliceApplied`) for tooltips/debug overlays.
4. Years outside the five stops (2055) snap to the nearest supported era
   (2025) so the menu never vanishes mid-timeline.

## Era boards

| Year | Board | Items & prices (period-correct) |
| --- | --- | --- |
| 1945 | Small hand-chalked slate in an oak frame, chains from the ceiling rail, chalk sticks on the ledge | Coffee 2d · Tea 1½d · Bun 3d · Scone 2d · Cake Slice 4d — pre-decimal £sd, "No oranges — still rationed" |
| 1965 | Painted wooden diner board, teal header band, red prices, chrome trim | Espresso 1/6 · Milkshake 2/- · Tea 9d · Ham Roll 1/3 · Iced Cola 10d · Egg & Chips 3/6 |
| 1985 | Backlit lightbox, white plastic letters on tracker rails, amber price digits, aluminium housing | COFFEE 25p · TEA 20p · CAPPUCCINO 48p · HOT CHOCOLATE 42p · BACON BAP 68p · JACKET POTATO £1.15 |
| 2005 | Printed wall menu with brand roundel + floor-standing A-frame specials board near the counter | Americano £1.60 · Caffè Latte £2.10 · Flat White £1.95 · Caffè Mocha £2.30 · Toasted Panini £3.25 · Blueberry Muffin £1.75 |
| 2025 | Digital LCD screen (rotating specials ticker + soft glow pulse) on a ceiling pole mount, plus QR-code ordering tent-cards on the dining tables | Oat Flat White £3.80 · Filter V60 £3.40 · Matcha Latte £4.50 · Cold Brew £3.90 · Avocado Toast £7.50 · Almond Croissant £3.60 |

Textures are drawn at build time to 2D canvases (fonts/colors/layout per
era): chalk script with jitter + dust for 1945, enamel diner lettering with
drop shadows for 1965, glowing letter tiles on rails for 1985, printed paper
stock with print grain for 2005, and a dark UI card list with mint accents
for 2025.

## Placement & orientation

The room shell is 12 m × 10 m × 3.6 m (see `src/cafe/CafeScene.ts`). The
customer counter belongs to the furniture task (~z −0.6); the brewing
group's back-bar line sits at z = +1.05. The menu hangs **above/behind the
counter run** — bottom edge y = 2.02 m, z = +0.72, facing the customers
(south, −z) — suspended from ceiling rails/chains/poles per era. The 2005
A-frame stands on the floor beside the counter end; the 2025 QR tent-cards
sit on the shared dining-table anchors from `furniture/specs.ts`. Constants
live in `layout.ts`.

## Crossfade strategy

All five variants stay mounted at the same slot; only one is visible. An era
change starts a ~850 ms linear opacity blend between outgoing and incoming
boards (per-material baselines captured once), then hides the outgoing
board. Interrupted transitions simply retarget mid-flight, so any era pair —
including slider spam — chains cleanly. Per-variant micro-offsets prevent
z-fighting between coincident surfaces while both are semi-transparent.
Emissive screens dim their glow proportionally while fading.

The shell's `EraTransitionController` also lists `menu` under its default
`crossfade` strategy, so the whole group dips cleanly during full-scene era
morphs as well.

## File map

```
MenuBoardBuilder.ts           rig, crossfade + LCD animator, extraction, registration
layout.ts                     counter-mount placement constants
presets.ts                    built-in period menus, palettes, fonts, row resolution
textures.ts                   canvas painters per era (+ pseudo-QR, ticker)
boards.ts                     mesh composers (frames, hangers, A-frame, LCD, cards)
types.ts                      MenuBoardPayload contracts
index.ts                      public API barrel
MenuBoardBuilder.test.ts      structural + crossfade tests
```

All geometry and textures are procedural — no external asset files, no new
dependencies.
