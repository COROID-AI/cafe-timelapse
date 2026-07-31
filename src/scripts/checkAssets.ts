/**
 * QA gate: `npm run check:assets`
 *
 * Headless (no WebGL) verification of the shared procedural asset library:
 *   - every canonical era has palette tokens and every token is a valid hex;
 *   - TextureFactory draws every texture kind at capped resolution, caches
 *     identical specs (same texture instance) and honours size clamping;
 *   - MaterialFactory builds a `MeshPhysicalMaterial` (StandardPhysical) for
 *     every kind of every era, parameterised by the era palette, and caches
 *     per-era materials;
 *   - PropPrimitives produce meshes for every primitive family (table legs,
 *     chairs, cups, machine shells, frames, lamps, signage) with expected
 *     geometry counts;
 *   - the barrel export exposes the whole library to era tasks.
 *
 * Exits non-zero on any assertion failure.
 */
import * as THREE from 'three';
import { ERAS } from '../data/eras';
import {
  TextureFactory,
  MAX_TEXTURE_SIZE,
  clampTextureSize,
  shadeHex,
  mulberry32,
  MaterialFactory,
  materialFromSpec,
  PropPrimitives,
  ERA_PALETTES,
  paletteFor,
} from '../assets';

function run(): void {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  // Compare two hex colours with case-insensitivity and a small per-channel
  // tolerance (sRGB -> linear -> sRGB round trips can shift a channel by 1).
  const hexTuple = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    const value =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const n = Number.parseInt(value, 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  };
  const closeHex = (a: string, b: string, tolerance = 2): boolean => {
    const [ar, ag, ab] = hexTuple(a);
    const [br, bg, bb] = hexTuple(b);
    return (
      Math.abs(ar - br) <= tolerance &&
      Math.abs(ag - bg) <= tolerance &&
      Math.abs(ab - bb) <= tolerance
    );
  };

  // 1. Palette tokens exist for every canonical era and are valid hex.
  console.log('\n[palettes]');
  const hexRe = /^#[0-9a-fA-F]{6}$/;
  for (const era of ERAS) {
    const tokens = ERA_PALETTES[era];
    assert(!!tokens, `palette exists for era ${era}`);
    if (!tokens) continue;
    for (const [key, value] of Object.entries(tokens)) {
      assert(
        typeof value === 'string' && hexRe.test(value),
        `era ${era} token "${key}" is a 6-digit hex colour (got "${String(value)}")`,
      );
    }
    assert(paletteFor(era) === tokens, `paletteFor(${era}) returns the same tokens`);
  }

  // 2. TextureFactory: every kind renders at capped resolution and caches.
  console.log('\n[TextureFactory]');
  {
    const factory = new TextureFactory();
    const kinds = ['woodGrain', 'tile', 'wallpaper', 'neon', 'chalkboard', 'poster'] as const;
    for (const kind of kinds) {
      const result = factory.get({ kind, color: '#8a6a4a', color2: '#5a432e', size: 2048 });
      assert(result.texture instanceof THREE.CanvasTexture, `${kind} produces a CanvasTexture`);
      assert(result.canvas.width === MAX_TEXTURE_SIZE && result.canvas.height === MAX_TEXTURE_SIZE, `${kind} is capped at ${MAX_TEXTURE_SIZE}px (got ${result.canvas.width})`);
      assert(result.texture.wrapS === THREE.RepeatWrapping, `${kind} uses RepeatWrapping`);
      assert(result.texture.colorSpace === THREE.SRGBColorSpace, `${kind} uses SRGBColorSpace`);
    }

    const spec = { kind: 'woodGrain' as const, color: '#8a6a4a', size: 128 };
    const first = factory.get(spec);
    const second = factory.get(spec);
    assert(first.texture === second.texture, 'identical specs return the cached texture instance');
    assert(factory.size === kinds.length + 1, `cache holds ${kinds.length + 1} distinct textures (got ${factory.size})`);
    assert(factory.has(spec), 'factory.has(spec) reports cached entries');
    factory.release(spec);
    assert(!factory.has(spec), 'factory.release(spec) removes the entry');
    factory.releaseAll();
    assert(factory.size === 0, 'factory.releaseAll() empties the cache');

    assert(clampTextureSize(4096) === MAX_TEXTURE_SIZE, 'clampTextureSize caps at MAX_TEXTURE_SIZE');
    assert(clampTextureSize(4) === 8, 'clampTextureSize floors at 8');
    assert(typeof mulberry32(7)() === 'number', 'mulberry32 returns a deterministic PRNG');
    assert(shadeHex('#808080', 0.5) === '#c0c0c0', 'shadeHex lightens colours predictably');
  }

  // 3. MaterialFactory: StandardPhysical surfaces per era + kind, palette-driven.
  console.log('\n[MaterialFactory]');
  {
    const factory = new MaterialFactory();
    const kinds = ['wall', 'floor', 'ceiling', 'trim', 'wood', 'metal', 'chrome', 'brass', 'plastic', 'leather', 'ceramic', 'glass', 'neon', 'chalkboard', 'poster', 'fabric'] as const;
    for (const era of ERAS) {
      for (const kind of kinds) {
        const material = factory.forEra(era, kind);
        assert(material instanceof THREE.MeshPhysicalMaterial, `era ${era} ${kind} is a MeshPhysicalMaterial (StandardPhysical)`);
        assert(typeof material.roughness === 'number' && material.roughness >= 0 && material.roughness <= 1, `era ${era} ${kind} roughness in [0,1]`);
        if (kind === 'neon') {
          assert(material.emissiveIntensity > 1, `era ${era} neon is emissive`);
        }
        if (kind === 'glass') {
          assert(material.transmission > 0.5, `era ${era} glass transmits`);
        }
      }
      // The era palette must actually drive the wall colour (compare in sRGB).
      const wall = factory.forEra(era, 'wall');
      const hex = `#${wall.color.getHexString(THREE.SRGBColorSpace)}`;
      assert(closeHex(hex, ERA_PALETTES[era].walls), `era ${era} wall material uses palette walls token (${hex} ≈ ${ERA_PALETTES[era].walls})`);
    }
    assert(factory.forEra(1945, 'wood') === factory.forEra(1945, 'wood'), 'per-era materials are cached (same instance)');
    assert(factory.size === ERAS.length * kinds.length, `cache holds ${ERAS.length * kinds.length} materials (got ${factory.size})`);

    const explicit = materialFromSpec({ color: '#112233', metalness: 0.8, clearcoat: 0.4 });
    assert(explicit instanceof THREE.MeshPhysicalMaterial, 'materialFromSpec builds a physical material');
    assert(explicit.metalness === 0.8 && explicit.clearcoat === 0.4, 'materialFromSpec honours explicit params');
    factory.releaseAll();
    assert(factory.size === 0, 'factory.releaseAll() empties the material cache');
  }

  // 4. PropPrimitives: every primitive family produces meshes.
  console.log('\n[PropPrimitives]');
  {
    const countMeshes = (group: THREE.Group): number => {
      let n = 0;
      group.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) n += 1;
      });
      return n;
    };

    const leg = PropPrimitives.tableLeg({ height: 0.7, round: true, foot: true });
    assert(leg.children.length === 2, 'tableLeg builds a leg (and optional foot)');

    const frame = PropPrimitives.tableFrame({ width: 1.2, depth: 0.8 });
    assert(countMeshes(frame) === 4, 'tableFrame builds four legs');

    const top = PropPrimitives.tableTop({ width: 1.2, depth: 0.8 });
    assert(countMeshes(top) === 1, 'tableTop builds one top');

    const chairGroup = PropPrimitives.chair({ padded: true });
    assert(countMeshes(chairGroup) >= 7, 'chair builds legs, seat, pad and back');

    const cupGroup = PropPrimitives.cup({ saucerMaterial: new THREE.MeshStandardMaterial(), handle: true });
    assert(countMeshes(cupGroup) === 3, 'cup builds body, handle and saucer');
    const glassCup = PropPrimitives.cup({ glass: true });
    assert(countMeshes(glassCup) === 1, 'glass cup builds an open body');

    const machine = PropPrimitives.machineShell({ groupHead: true, lever: true, steamWand: true, dripTray: true });
    assert(countMeshes(machine) === 5, 'machineShell builds body, group head, lever, wand and tray');

    const poster = PropPrimitives.frame({ width: 0.5, height: 0.7 });
    assert(countMeshes(poster) === 5, 'frame builds panel and four rails');

    const pendant = PropPrimitives.pendantLamp({});
    assert(countMeshes(pendant) === 3, 'pendantLamp builds stem, shade and bulb');

    const sconce = PropPrimitives.wallLamp({});
    assert(countMeshes(sconce) === 3, 'wallLamp builds arm, shade and bulb');

    const sign = PropPrimitives.signage({ neon: true });
    assert(countMeshes(sign) === 5, 'signage builds housing, face, tube and two neon caps');
  }

  // 5. Barrel export: era tasks can import the library through the index.
  console.log('\n[barrel]');
  {
    const factory = new TextureFactory();
    const wood = factory.get({ kind: 'woodGrain', color: '#5C4432', size: 64 });
    assert(wood.texture.image !== null, 'texture factory reachable through src/assets');
    assert(typeof PropPrimitives.chair === 'function', 'PropPrimitives reachable through src/assets');
    assert(typeof MaterialFactory === 'function', 'MaterialFactory reachable through src/assets');
    assert(ERA_PALETTES[1945].furniture === '#5C4432', 'palette tokens reachable through src/assets');
  }

  if (failures > 0) {
    console.error(`\nAsset library check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll shared procedural asset checks passed.');
  }
}

void run();
