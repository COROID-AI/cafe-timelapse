# Patrons prop group

Stylised low-poly café patrons whose outfits, hairstyles and table gadgets
instantly date each era (1945 / 1965 / 1985 / 2005 / 2025). Registered under
the `'patrons'` key of `CafeScene`'s prop-group registry.

## Usage

```ts
import { registerPatronsPropGroup } from './cafe/props/patrons';

const patrons = registerPatronsPropGroup(cafeScene);
cafeScene.applyEra(1965); // crossfades the cast
```

The builder self-ticks via `requestAnimationFrame`; headless consumers (tests)
drive `builder.update(dt)` manually. `setTransitionSeconds`, `isTransitioning`
and `dispose` mirror the sibling builders (`FurnitureBuilder` et al.).

## Module map

| File | Role |
| --- | --- |
| `types.ts` | Spec contracts: eras, idle kinds, hair/gadget ids, figure specs |
| `variants/` | Pure per-era cast data (4–6 figures each) |
| `layout.ts` | Seat placement derived from `furniture/TABLE_ANCHORS` + per-era chair angles; counter-stool spot for the 1985 boombox patron |
| `figures.ts` | Parametric seated figure (~40 primitives, jointed arms, no faces) |
| `hairstyles.ts` | Victory rolls → mod bowl → big perm → frosted tips/emo fringe → bun/curls |
| `gadgets.ts` | Newspaper, pipe, teacup, transistor radio, Walkman + orange foam headphones, boombox, flip phone, white iPod cords, laptop, smartphone, wireless earbuds, laptop+tablet, e-reader, counter stool |
| `cast.ts` | Assembles one era's slots (figure + stool + gadgets per patron) |
| `animations.ts` | Stateless idle loops: head turn, sip, phone glance |
| `PatronsBuilder.ts` | Crossfade rig + transition-aware idle clock |

## Era transitions & idle pausing

Every era is pre-built once; swaps are opacity crossfades between whole casts
(any pair blends cleanly, including direct `applyEra` calls without the
animated controller).

Idle animations freeze whenever:

1. `setIdlePaused(true)` was called;
2. an internal era crossfade is still blending;
3. an `EraTransitionController` morph owns this group — detected by watching
   sentinel objects the controller flips while engaged (`mesh.castShadow`,
   `material.depthWrite`) and restores afterwards. This module never writes
   those flags, so a flipped sentinel is unambiguous morph evidence. Frozen
   poses stay inside the seated envelope by construction, so no limb clips
   through furniture mid-morph.

## Payload slice

The routed era config's `patrons` section accepts either a carrier
(`{ patrons: { headcountHint: 4 } }`, matching `src/cafe/eras/types.ts`) or
direct keys. `headcountHint` clamps how many of the prebuilt seats are shown
(1…cast size); activity notes are stamped onto the cast for debugging.
Missing payloads fall back to each era's full preset cast.
