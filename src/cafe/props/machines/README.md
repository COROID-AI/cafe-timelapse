# Coffee Machines & Brewing Equipment (`machines` prop group)

Procedural, period-correct brewing equipment for all five café eras
(1945 / 1965 / 1985 / 2005 / 2025), driven by the `brewingEquipment` payload
of each era config and swapped with an opacity crossfade.

## Integration

```ts
import { registerBrewingEquipment } from './cafe/props/machines';

registerBrewingEquipment(cafeScene); // registers under the 'machines' key
cafeScene.applyEra(1965);            // crossfades machines into 1965
```

Declarative registries can use `MACHINES_PROP_GROUP`
(`{ key: 'machines', build, update }`) or call
`CafeScene.registerPropGroup(MACHINES_PROP_GROUP_KEY, BrewingEquipmentBuilder, updateBrewingEquipment)`
directly. `disposeBrewingEquipment(host)` tears the rig down (cancels the
fade animation, disposes geometry/materials).

## Data flow

1. The routed `EraConfig.machines` section is scanned by
   `extractBrewingEquipment()`. It accepts either a carrier object
   (`{ brewingEquipment: {...} }`, matching the field name in
   `src/cafe/eras/types.ts`) or the equipment keys directly on the section.
2. Every year renders a fully procedural built-in preset even when the
   payload is absent (current era stubs), so all five eras always show
   recognisable machines.
3. When era content lands, the payload enriches the scene: appliance counts
   hint duplicated props (moka pots, carafes, frother jugs, cold-brew
   dispensers), `grinder: null` removes the 2005 grinder, and the resolved
   catalogue + `preparationNotes` are stamped onto the active variant's
   `userData` (`configuredAppliances`, `presetAppliances`,
   `preparationNotes`) for tooltips/debug overlays.
4. Years outside the five stops (2055) snap to the nearest supported era so
   the machines never vanish mid-timeline.

## Era line-ups

| Year | Signature kit |
| --- | --- |
| 1945 | Enamel coffee urn w/ brass spigot, twin-burner gas ring + moka pots, walnut hand grinder clamped to the bench, thick cups, enamel canisters |
| 1965 | Big chrome percolator, chrome filter drip machine + carafe on warming plate, spare carafe on standalone hotplate, diner cup stacks, sugar globe |
| 1985 | Boxy beige/brown auto-drip with translucent ORANGE reservoir, stainless cappuccino frother jug, mug tree, ceramic cup stack, cordless jug kettle |
| 2005 | Stainless semi-automatic espresso machine (portafilters, steam wand, pressure gauge), burr grinder w/ bean hopper, cup-warmer stacks, knock box, syrups |
| 2025 | Matte super-automatic touchscreen centre, tablet ordering display, cold-brew tap tower + glass dispensers, under-counter milk fridge |

## Placement & orientation

The room shell is 12 m × 10 m (see `src/cafe/CafeScene.ts`). The customer
counter belongs to the furniture task; this group builds its own back-bar
worktop line at **z = +1.05** (top surface y = 0.92 m), north of the expected
counter position, leaving a believable staff aisle. Machine fronts face −z
(the barista's facing); splashbacks rise at +z. Constants live in `layout.ts`.

## Crossfade strategy

All five variants stay mounted at the same slot; only one is visible. An era
change starts a ~700 ms smoothstep opacity blend between outgoing and
incoming groups (per-material baselines captured once), then hides the
outgoing group. Interrupted transitions finalise first, so any era pair —
including slider spam — chains cleanly. Per-variant micro-offsets prevent
z-fighting between coincident surfaces while both are semi-transparent.

Glass panes, emissive screens/LEDs and gas flames carry `noCastShadow` /
`glowSurface` flags; the rig clears forced shadow casting on them after
registration (CafeScene switches shadows on for everything post-build).

## File map

```
brewingEquipmentBuilder.ts   rig, crossfade animator, extraction, registration
eraMeta.ts                   metadata stamping + configuredCount helper
layout.ts                    BACK_BAR placement constants
kit/geometries.ts            primitive helpers + disposeObjectTree
kit/materials.ts             fresh-instance PBR material factories
kit/parts.ts                 composite parts (bench, cups, taps, screens…)
variants/era<year>.ts        one composer per era
types.ts                     BrewingEquipmentSpec contracts
index.ts                     public API barrel
```

All geometry is procedural — no external model files.
