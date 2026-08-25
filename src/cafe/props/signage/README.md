# Signage & Lighting prop group (`signage`)

Period-correct signs and light fixtures for all five eras, plus the scene-wide
ambient mood data that makes each era *feel* lit like its time period.

## Era looks

| Year | Signage | Fixtures | Scene mood |
| ---- | ------- | -------- | ---------- |
| 1945 | Hand-painted hanging wooden board on chains in the window | Warm low-wattage filament pendants in tin shades, gaslight-style wall sconces, blackout curtains on every street window | Blackout gloom: cold dim sun, warm pockets, dense fog, low exposure |
| 1965 | Red neon **CAFÉ** buzzing in the street window | Chrome-and-vinyl pendants, long fluorescent ceiling run | Bright diner fill, cherry-red accents |
| 1985 | Backlit plastic lightbox (pink/cyan retro face) | Track rail with magenta/teal/amber gelled spots, crisp halogen counter spots | Vivid mall-era pop, punchy exposure |
| 2005 | Brushed-metal dimensional CAFÉ letters on the fascia | Recessed cool-white downlights, blue-white LED strips under the counter lip | Clean café-retail white |
| 2025 | Minimal LED neon outline + script | Smart bulbs cycling warm/cool scenes, pendant Edison bulbs, subtly animated mint shelf strip | Layered smart scenes, softest fog |

Every variant also registers per-frame animators (gas flame flutter, neon
transformer flicker, smart-scene hue drift, LED breathing) that are allocation-
free and compose with crossfades via `light.userData.fadeFactor`.

## Integration

```ts
import { registerSignageLighting } from './cafe/props/signage';

registerSignageLighting(cafeScene); // registers under the 'signage' key
```

The group is registered with the **crossfade** strategy: all five variants are
built up front at their room anchors, the outgoing one eases to opacity 0 /
zero light intensity while the incoming one eases in (700 ms smoothstep), then
the outgoing is hidden. Interrupted transitions finalise cleanly, so arbitrary
era pairs chain without popping.

### Payload

The updater reads `EraConfig.signage` (see `extractSignageLighting`). It accepts
either a carrier object — `{ signageLighting: {...} }`, matching the field name
in `src/cafe/eras/types.ts` — or the spec keys directly:

```ts
signage: {
  signageLighting: {
    signage: [{ id: 'neon-cafe', text: 'CAFÉ', type: 'neon tube', animated: true }],
    fixtures: [{ type: 'fluorescent tube', colorTemperatureK: 4200 }],
    overallMood: 'bright fluorescent hum',
    daylightNote: '…',
  },
}
```

Any missing key falls back to that era's built-in period preset; routed payload
metadata is stamped into the variant's `userData` for debug overlays.

## Ambient mood coordination (EraTransitionController)

All era lighting numbers live HERE — nothing outside this module hard-codes
them. `SIGNAGE_ERA_MOODS` maps every year to a complete `EraLightingMood`
(ambient/hemisphere/directional-sun/accent colours + intensities, fog colour +
density, tone-mapping exposure) using exactly the schema
`EraTransitionController` lerps between.

Two consumption paths:

1. **Controller-driven morphs (preferred).** Route the values into the config
   the controller resolves: era-content tasks copy
   `SIGNAGE_ERA_MOODS[year]` into their `EraConfig.lighting` (or have
   `getEra` merge it). The controller then captures live lights as departure
   state and lerps colour/intensity/fog/exposure to these targets across the
   whole morph — commit-safe because it keeps writing after `applyEra`.
2. **Direct slider changes.** When the updater sees a new year it starts its
   own 700 ms mood ramp (same envelope as the fixture crossfade). If an
   `EraTransitionController` morph writes the lights meanwhile, the ramp
   detects the divergence on its next tick and stands down, leaving the
   controller authoritative — the two systems never fight for more than one
   frame.

Shell-provided `config.lighting` fields always win field-by-field over the
presets (`resolveSignageMood`).

## Files

```
SignageLightingBuilder.ts     rig, crossfade + mood-ramp animator, extraction, registration
moods.ts                      per-era EraLightingMood table + resolvers
layout.ts                     shared room anchors (windows, fascia, counter lip)
kit.ts                        sign faces (canvas w/ node fallback), pendants, sconces, strips…
types.ts                      payload contracts + era year list
variants/era<year>.ts         one builder per era
index.ts                      public exports
```
