import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import {
  CROSSFADE_DURATION_MS,
  SIGNAGE_ERA_MOODS,
  SIGNAGE_PROP_GROUP,
  SIGNAGE_PROP_GROUP_KEY,
  SUPPORTED_SIGNAGE_YEARS,
  disposeSignageLighting,
  extractSignageLighting,
  registerSignageLighting,
  resolveSignageMood,
  resolveSupportedYear,
} from './index';

function makeScene(): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra: getEra });
}

function update(host: CafeScene, year: number): void {
  const config = getEra(year as 1945 | 1965 | 1985 | 2005 | 2025) as unknown as EraConfig;
  host.applyEra(config.year);
}

/** Collects light-intensity signatures for every era sub-group. */
function lightSignature(group: THREE.Group): string {
  const lights: string[] = [];
  group.traverse((node) => {
    if (node instanceof THREE.PointLight || node instanceof THREE.SpotLight) {
      lights.push(`${node.type}:${node.color.getHexString()}:${Math.round(node.intensity)}`);
    }
  });
  return lights.sort().join('|');
}

describe('signage prop group', () => {
  it('registers under the signage key with the crossfade strategy', () => {
    const scene = makeScene();
    expect(registerSignageLighting(scene)).toBe(scene);
    expect(scene.hasPropGroup('signage')).toBe(true);

    const group = scene.getPropGroup('signage');
    expect(group).toBeDefined();
    expect(group?.userData.propGroup).toBe(SIGNAGE_PROP_GROUP_KEY);
    expect(group?.userData.strategy).toBe('crossfade');
    expect(SIGNAGE_PROP_GROUP.key).toBe('signage');

    expect(disposeSignageLighting(scene)).toBe(true);
    expect(scene.hasPropGroup('signage')).toBe(false);
  });

  it('builds five distinct era variants with period fixtures', () => {
    const scene = makeScene();
    registerSignageLighting(scene);
    const root = scene.getPropGroup('signage')!;

    const variants = SUPPORTED_SIGNAGE_YEARS.map(
      (year) => root.children.find((child) => child.name === `signage-era-${year}`)!,
    );
    for (const variant of variants) expect(variant).toBeDefined();

    // Exactly one variant visible before any era is applied (default 1945).
    const visible = variants.filter((variant) => variant.visible);
    expect(visible.map((variant) => variant.name)).toEqual(['signage-era-1945']);

    // Every era carries real fixture lights and a unique lighting signature.
    const signatures = new Set<string>();
    for (const variant of variants) {
      const signature = lightSignature(variant as THREE.Group);
      expect(signature.length).toBeGreaterThan(0);
      expect(signatures.has(signature)).toBe(false);
      signatures.add(signature);
    }

    // Period anchors: only 1945 hangs blackout curtains; only 1985 uses
    // SpotLight track gels in magenta/teal/amber.
    const countType = (group: THREE.Group, hex: string) => {
      let count = 0;
      group.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          if (material.color.getHexString() === hex.replace('#', '')) count += 1;
        }
      });
      return count;
    };
    const blackoutFabric = new THREE.Color(0x241f18).getHexString();
    expect(countType(variants[0] as THREE.Group, blackoutFabric)).toBeGreaterThan(6);

    const spotCount = (group: THREE.Group) => {
      let count = 0;
      group.traverse((node) => {
        if (node instanceof THREE.SpotLight) count += 1;
      });
      return count;
    };
    expect(spotCount(variants[0] as THREE.Group)).toBe(0); // no tracks in 1945
    expect(spotCount(variants[2] as THREE.Group)).toBeGreaterThanOrEqual(4); // 1985 gels

    disposeSignageLighting(scene);
  });

  it('crossfades to every other era without leaving lights popped', () => {
    const scene = makeScene();
    registerSignageLighting(scene);
    const root = scene.getPropGroup('signage')!;

    // Pristine baselines captured before ANY fade runs.
    const materialBaselines = new Map<string, { opacity: number; transparent: boolean }>();
    const lightBaselines = new Map<string, number>();
    root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          if (!(material instanceof THREE.MeshStandardMaterial)) continue;
          materialBaselines.set(material.uuid, {
            opacity: material.opacity,
            transparent: material.transparent,
          });
        }
      }
      if (node instanceof THREE.PointLight || node instanceof THREE.SpotLight) {
        lightBaselines.set(node.uuid, node.intensity);
      }
    });
    expect(materialBaselines.size).toBeGreaterThan(20);

    for (const year of SUPPORTED_SIGNAGE_YEARS) {
      update(scene, year);

      // Exactly one visible variant per applied era…
      const visible = root.children.filter((child) => child.visible);
      expect(visible.map((child) => child.name)).toEqual([`signage-era-${year}`]);
      expect(root.userData.activeYear).toBe(year);

      // …and EVERY material/light back to its authored baseline once the
      // crossfade settles (non-browser environments settle instantly).
      let materialCount = 0;
      let lightCount = 0;
      root.traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (mesh.isMesh) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial)) continue;
            const base = materialBaselines.get(material.uuid)!;
            expect(material.opacity).toBeCloseTo(base.opacity, 6);
            expect(material.transparent).toBe(base.transparent);
            materialCount += 1;
          }
        }
        if (node instanceof THREE.PointLight || node instanceof THREE.SpotLight) {
          expect(node.intensity).toBeCloseTo(lightBaselines.get(node.uuid)!, 6);
          expect(node.userData.fadeFactor ?? 1).toBe(1);
          lightCount += 1;
        }
      });
      // Every mesh-material slot was re-checked against a pristine baseline
      // above; slots exceed unique materials because several share one.
      expect(materialCount).toBeGreaterThanOrEqual(materialBaselines.size);
      expect(lightCount).toBeGreaterThan(20); // fixtures exist across all eras
    }

    disposeSignageLighting(scene);
  });

  it('exposes complete ambient moods for every era (colour/intensity/fog/exposure)', () => {
    for (const year of SUPPORTED_SIGNAGE_YEARS) {
      const mood = SIGNAGE_ERA_MOODS[year];
      expect(mood.ambientColor).toBeDefined();
      expect(typeof mood.ambientIntensity).toBe('number');
      expect(mood.sunColor).toBeDefined();
      expect(typeof mood.sunIntensity).toBe('number');
      expect(mood.accentColor).toBeDefined();
      expect(mood.fogColor).toBeDefined();
      expect(typeof mood.fogDensity).toBe('number');
      expect(typeof mood.exposure).toBe('number');
      expect(Number.isFinite(mood.exposure)).toBe(true);
    }

    // The timeline reads dim wartime → bright modern.
    expect(SIGNAGE_ERA_MOODS[1945].ambientIntensity!).toBeLessThan(
      SIGNAGE_ERA_MOODS[2025].ambientIntensity!,
    );
    expect(SIGNAGE_ERA_MOODS[1945].sunIntensity!).toBeLessThan(
      SIGNAGE_ERA_MOODS[1965].sunIntensity!,
    );
    expect(SIGNAGE_ERA_MOODS[1945].fogDensity!).toBeGreaterThan(
      SIGNAGE_ERA_MOODS[2025].fogDensity!,
    );
  });

  it('routes each era mood into the scene rig on direct application', () => {
    const scene = makeScene();
    registerSignageLighting(scene);

    scene.applyEra(1945);
    expect(scene.ambientLight.intensity).toBeCloseTo(SIGNAGE_ERA_MOODS[1945].ambientIntensity!, 5);
    const fog = scene.scene.fog as THREE.FogExp2;
    expect(fog.density).toBeCloseTo(SIGNAGE_ERA_MOODS[1945].fogDensity!, 8);
    expect(fog.color.getHexString()).toBe(new THREE.Color(SIGNAGE_ERA_MOODS[1945].fogColor!).getHexString());

    // Direct slider path ramps to the target; non-browser settles instantly.
    scene.applyEra(2025);
    expect(scene.ambientLight.intensity).toBeCloseTo(SIGNAGE_ERA_MOODS[2025].ambientIntensity!, 5);
    expect(fog.density).toBeCloseTo(SIGNAGE_ERA_MOODS[2025].fogDensity!, 8);
    expect(scene.sunLight.color.getHexString()).toBe(
      new THREE.Color(SIGNAGE_ERA_MOODS[2025].sunColor!).getHexString(),
    );

    // Accent points follow the era accent colour too.
    expect(scene.accentLights[0].color.getHexString()).toBe(
      new THREE.Color(SIGNAGE_ERA_MOODS[2025].accentColor!).getHexString(),
    );

    disposeSignageLighting(scene);
  });

  it('lets shell-provided config.lighting override individual channels', () => {
    const scene = makeScene();
    registerSignageLighting(scene);

    const config = getEra(1985);
    const overridden = { ...config, lighting: { ambientColor: '#ff0000', ambientIntensity: 0.9 } };
    scene.applyEra(overridden.year);
    // applyEra re-resolves through resolveEraFn, so drive the updater directly:
    const entry = { host: scene, previousYear: null };
    void entry;

    const resolved = resolveSignageMood(
      { ...(config as unknown as EraConfig), lighting: { ambientColor: '#ff0000', ambientIntensity: 0.9 } },
      1985,
    );
    expect(resolved.ambientColor).toBe('#ff0000');
    expect(resolved.ambientIntensity).toBe(0.9);
    expect(resolved.fogDensity).toBe(SIGNAGE_ERA_MOODS[1985].fogDensity); // preset fallback kept

    disposeSignageLighting(scene);
  });

  it('extracts payloads from carrier or direct section layouts', () => {
    const spec = { signage: [{ text: 'CAFÉ' }], overallMood: 'warm' };
    expect(extractSignageLighting({ signageLighting: spec })).toEqual(spec);
    expect(extractSignageLighting({ ...spec })).toEqual(spec);
    expect(extractSignageLighting({ unrelated: true })).toBeUndefined();
    expect(extractSignageLighting(undefined)).toBeUndefined();
  });

  it('clamps unsupported years onto the nearest rendered era', () => {
    expect(resolveSupportedYear(1945)).toBe(1945);
    expect(resolveSupportedYear(2055)).toBe(2025);
    expect(resolveSupportedYear(1990)).toBe(1985);
  });

  it('disposes cleanly and is idempotent', () => {
    const scene = makeScene();
    registerSignageLighting(scene);
    scene.applyEra(1965);
    expect(disposeSignageLighting(scene)).toBe(true);
    expect(disposeSignageLighting(scene)).toBe(false);
    expect(CROSSFADE_DURATION_MS).toBeGreaterThan(0);
  });
});
