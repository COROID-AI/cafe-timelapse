import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import {
  COUNTER_PROP_GROUP_KEY,
  CROSSFADE_DURATION_MS,
  CounterTechRig,
  SUPPORTED_ERA_YEARS,
  disposeCounterTech,
  extractCounterTech,
  registerCounterTech,
  resolveSupportedYear,
} from './index';
import type { SupportedEraYear } from './index';
import { MAX_DEVICE_HEIGHT_ABOVE_TOP, SERVICE_COUNTER } from './layout';

type GetEraYear = Parameters<typeof getEra>[0];

function makeScene(resolveEra?: (year: GetEraYear) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

function settle(rig: CounterTechRig, seconds = 2): void {
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) {
    rig.update(step);
  }
}

function eraVariant(scene: CafeScene, year: SupportedEraYear): THREE.Group {
  const group = scene.getPropGroup(COUNTER_PROP_GROUP_KEY);
  if (!group) throw new Error('counter-tech prop group missing');
  const variant = group.getObjectByName(`counter-tech-era-${year}`);
  if (!(variant instanceof THREE.Group)) throw new Error(`era variant ${year} missing`);
  return variant;
}

function visibleVariants(scene: CafeScene): SupportedEraYear[] {
  return SUPPORTED_ERA_YEARS.filter((year) => eraVariant(scene, year).visible);
}

/** Signature meshes exclusive to their era (instant visual dating). */
const SIGNATURES: Record<SupportedEraYear, string[]> = {
  1945: ['till-crank-arm', 'till-drawer', 'till-bell'],
  1965: ['register-total-flag', 'register-key-deck', 'register-flag-slot'],
  1985: ['pos-vfd-screen', 'imprinter-arm', 'vfd-segment-0'],
  2005: ['till-lcd-screen', 'stripe-terminal', 'receipt-printer'],
  2025: ['tablet-screen', 'tap-reader-glow', 'qr-code'],
};

function collectNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) names.add(obj.name);
  });
  return names;
}

describe('counter-tech prop group', () => {
  it('registers under the "counterTech" key with five prebuilt era variants', () => {
    const scene = makeScene();
    const rig = registerCounterTech(scene);

    expect(scene.hasPropGroup('counterTech')).toBe(true);
    expect(scene.getPropGroup('counterTech')?.name).toBe('prop-group:counterTech');
    expect(rig.activeYear).toBe(1945);

    for (const year of SUPPORTED_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      expect(variant.children.length).toBeGreaterThan(0);
      expect(variant.userData.eraYear).toBe(year);
    }
  });

  it('each era renders distinct signature checkout tech', () => {
    const scene = makeScene();
    registerCounterTech(scene);

    for (const year of SUPPORTED_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      const presentNames = collectNames(variant);

      for (const name of SIGNATURES[year]) {
        expect(presentNames.has(name)).toBe(true);
      }

      // No foreign-era signature leaks into this variant.
      const allSignatures = Object.values(SIGNATURES).flat();
      for (const name of allSignatures) {
        if (!SIGNATURES[year].includes(name)) {
          expect(presentNames.has(name)).toBe(false);
        }
      }

      // Preset catalogue stamped for tooltips / debug overlays.
      expect(Array.isArray(variant.userData.presetDevices)).toBe(true);
      expect(typeof variant.userData.presetReceiptMethod).toBe('string');
    }
  });

  it('devices sit on the counter surface without clipping', () => {
    const scene = makeScene();
    registerCounterTech(scene);

    for (const year of SUPPORTED_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      const box = new THREE.Box3().setFromObject(variant);

      // Nothing sinks below the counter top…
      expect(box.min.y).toBeGreaterThanOrEqual(SERVICE_COUNTER.topY - 0.01);
      // …or towers absurdly above it.
      expect(box.max.y - SERVICE_COUNTER.topY).toBeLessThanOrEqual(MAX_DEVICE_HEIGHT_ABOVE_TOP);

      // The whole line-up stays on the usable counter run.
      const halfLength = SERVICE_COUNTER.length / 2;
      expect(box.min.x).toBeGreaterThanOrEqual(SERVICE_COUNTER.centerX - halfLength - 0.02);
      expect(box.max.x).toBeLessThanOrEqual(SERVICE_COUNTER.centerX + halfLength + 0.02);

      // …and within the counter depth (small margin for lips/overhangs).
      const halfDepth = SERVICE_COUNTER.depth / 2;
      expect(box.min.z).toBeGreaterThanOrEqual(SERVICE_COUNTER.centerZ - halfDepth - 0.02);
      expect(box.max.z).toBeLessThanOrEqual(SERVICE_COUNTER.centerZ + halfDepth + 0.02);
    }
  });

  it('glow surfaces opt out of shadow casting after registration', async () => {
    const scene = makeScene();
    registerCounterTech(scene);
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    const screen = eraVariant(scene, 2025).getObjectByName('tap-reader-glow');
    if (!(screen instanceof THREE.Mesh)) throw new Error('tap-reader-glow mesh missing');
    expect(screen.userData.glowSurface).toBe(true);
    expect(screen.castShadow).toBe(false);
  });

  it('crossfade transitions work across every ordered pair of eras', () => {
    const scene = makeScene();
    // Deterministic stepping: the internal rAF loop stays off in tests.
    const rig = registerCounterTech(scene, { autoDrive: false });

    const midFadeSeconds = (CROSSFADE_DURATION_MS * 0.35) / 1000;

    for (const fromYear of SUPPORTED_ERA_YEARS) {
      for (const toYear of SUPPORTED_ERA_YEARS) {
        if (toYear === fromYear) continue;

        // Park on the outgoing era first so every ordered pair starts clean.
        scene.applyEra(fromYear);
        settle(rig, 1);
        expect(visibleVariants(scene)).toEqual([fromYear]);

        scene.applyEra(toYear);

        // Mid-fade both variants share the counter slot.
        settle(rig, midFadeSeconds);
        expect(eraVariant(scene, fromYear).visible).toBe(true);
        expect(eraVariant(scene, toYear).visible).toBe(true);

        // Settled: exactly the incoming era remains, fully opaque again.
        settle(rig, 1);
        expect(visibleVariants(scene)).toEqual([toYear]);
        const material = findFirstMeshMaterial(eraVariant(scene, toYear));
        expect(material.opacity).toBeCloseTo(1, 5);
        expect(material.transparent).toBe(false);
      }
    }
  });

  it('resolveSupportedYear snaps out-of-range years to the nearest stop', () => {
    for (const year of SUPPORTED_ERA_YEARS) {
      expect(resolveSupportedYear(year)).toBe(year);
    }
    expect(resolveSupportedYear(2055)).toBe(2025);
    expect(resolveSupportedYear(2035)).toBe(2025);
    expect(resolveSupportedYear(1900)).toBe(1945);
  });

  it('extractCounterTech reads carrier and direct payload layouts', () => {
    expect(extractCounterTech(undefined)).toBeUndefined();
    expect(extractCounterTech(null)).toBeUndefined();
    expect(extractCounterTech({})).toBeUndefined();

    const direct = {
      till: { kind: 'brass manual till' },
      additionalDevices: [{ kind: 'tip jar' }],
      receiptMethod: 'handwritten pad',
      queueFlowNote: 'single queue',
    };
    expect(extractCounterTech(direct)).toEqual(direct);

    const carrier = { counterTech: { receiptMethod: 'dot-matrix roll' } };
    expect(extractCounterTech(carrier)).toEqual(carrier.counterTech);
  });

  it('applyEra stamps the routed counterTech payload into the active variant', () => {
    const customConfig: EraConfig = {
      ...getEra(1985),
      counterTech: {
        till: { label: 'Till 88', kind: 'electronic POS' },
        additionalDevices: [{ label: 'Click-clack imprinter' }],
        receiptMethod: 'carbon slips',
        queueFlowNote: 'pay at end',
      },
    };
    const scene = makeScene((year) => (year === 1985 ? customConfig : getEra(year)));
    registerCounterTech(scene);

    scene.applyEra(1985);
    const rig = scene.getPropGroup(COUNTER_PROP_GROUP_KEY);
    expect(rig?.userData.activeYear).toBe(1985);
    expect(rig?.userData.strategy).toBe('crossfade');

    const variant = eraVariant(scene, 1985);
    expect(variant.userData.receiptMethod).toBe('carbon slips');
    expect(variant.userData.queueFlowNote).toBe('pay at end');
    expect(variant.userData.configuredDevices).toEqual([
      { label: 'Till 88', kind: 'electronic POS' },
      { label: 'Click-clack imprinter' },
    ]);
    expect(variant.userData.counterTechSectionPresent).toBe(true);
  });

  it('disposeCounterTech tears the rig down and unregisters the group', () => {
    const scene = makeScene();
    registerCounterTech(scene);

    expect(disposeCounterTech(scene)).toBe(true);
    expect(scene.hasPropGroup(COUNTER_PROP_GROUP_KEY)).toBe(false);
    expect(scene.getPropGroup(COUNTER_PROP_GROUP_KEY)).toBeUndefined();
    expect(disposeCounterTech(scene)).toBe(false);
  });
});

/* ----- helpers ------------------------------------------------------------ */

function findFirstMeshMaterial(root: THREE.Object3D): THREE.MeshStandardMaterial {
  let found: THREE.MeshStandardMaterial | null = null;
  root.traverse((node) => {
    const candidate = node as THREE.Mesh;
    if (found || !candidate.isMesh) return;
    const materials = Array.isArray(candidate.material) ? candidate.material : [candidate.material];
    const first = materials.find((m): m is THREE.MeshStandardMaterial => m instanceof THREE.MeshStandardMaterial);
    if (first) found = first;
  });
  if (!found) throw new Error('No MeshStandardMaterial found beneath root.');
  return found;
}
