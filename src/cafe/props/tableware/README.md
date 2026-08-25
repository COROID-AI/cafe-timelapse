# Tableware & Table Settings prop group

Period-correct tabletop dressing for all five café eras, registered under the
`tableware` prop-group key (1:1 with the `tableware` section of the routed era
config). Owned surface: **everything in this folder only**.

## Era catalogues (built-in presets)

| Year | Look | Signature props |
| ---- | ---- | --------------- |
| 1945 | Austerity & recovery | Chipped enamel mugs on mismatched saucers, sugar in an open bowl, worn side plates, ration book on a table |
| 1965 | Formica diner optimism | Bright diner cups on banded saucers, formica-safe melamine plates, squeeze ketchup bottle on every table, chrome sugar shakers |
| 1985 | Pastel stoneware & smoke | Chunky pastel stoneware mugs + matching side plates, glass sugar pourer, ashtrays on the tables (period-accurate) |
| 2005 | Takeaway espresso bar | Branded takeaway cups with sleeves & logo bands, paper napkin dispensers, flavoured syrup bottles |
| 2025 | Third-wave minimal | Reusable eco-cups, minimal flat-white glasses, ceramic pour-over set showpiece, card-reader tip jar on the pickup table |

## Wiring (app shell / scene)

```ts
import { registerTablewarePropGroup } from './cafe/props/tableware';

const tableware = registerTablewarePropGroup(cafeScene); // key: 'tableware'
cafeScene.applyEra(1985); // instant swap + staggered pop-in
```

The declarative `TABLEWARE_PROP_GROUP = { key, build, update }` descriptor and
the plain `TablewareBuilder` / `updateTableware` pair are exported for
registry-style integrations; `disposeTableware(host)` tears the rig down.

## Swap strategy: instant swap + subtle pop-in

The shell's transition controller already treats this group as `instantSwap`
(small props would read an opacity crossfade as flicker). The rig matches that
contract and adds the delight layer: after the hard cut, every incoming item
plays a ~240 ms back-out scale pop (`POP_START_SCALE` → slight overshoot → 1),
staggered ~16 ms per item and capped at 380 ms total. Items pivot around their
own contact point, so they grow in place instead of sliding across the table.
Browsers self-tick via `requestAnimationFrame`; headless consumers drive
`builder.update(dt)` manually or call `flushAnimations()`.

## Sitting correctly on furniture (no clipping)

- Cluster anchors are imported from the furniture specs (`TABLE_ANCHORS`);
  every furniture tabletop is y = 0.74 m.
- The 1945 `clothRound` tables get their 18 mm cloth pad added automatically
  (`tableSurfaceY`), plus a 6 mm micro lift for wartime table wobble.
- All props stay within `TABLE_MAX_REACH` = 0.33 m of the table centre —
  budgeted against the smallest diner top (0.39 m half-width) minus the
  furniture group's ±4 cm placement jitter.
- Item origins sit at their contact point (`kit/parts`), so nothing floats or
  sinks; tests assert both bounds per era.

## Performance contract

Six tables × several items × five coincident era builds means polycounts stay
deliberately low: shared unit box/cylinder/sphere geometries plus 8–18 segment
primitives only (`kit/geometries`). Materials are fresh per era variant (the
rig restores per-variant state independently) but shared within one variant.
Translucent glass opts out of shadow casting via `markNoCastShadow`.

## Era-config slice

`extractTableware` accepts either `{ tableware: {...} }` (carrier form used by
`src/cafe/eras/types.ts`) or the spec keys directly on the section. When pieces
are configured they enrich `userData.configuredPieces` / `servingStyle` /
`napkinNote` for tooltips, and `configuredPieceCount` lets composers derive
duplicate counts (e.g. settings per table) from matching piece labels.

## Extension notes

- New items: add a low-poly builder in `kit/parts.ts` (origin at contact
  point), then place it inside a cluster with `tagItem(item, label, name)` —
  the pop-in animation picks it up automatically.
- Counter dressing is intentionally deferred until the furniture task lands
  its counter run with a known top height/placement; guessing a surface today
  would break the no-clipping guarantee. Dining-table dressing covers the
  "placed on tables" requirement now, and the layout module is where a
  counter anchor slots in later.
