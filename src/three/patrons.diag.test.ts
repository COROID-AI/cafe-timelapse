import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildPatrons } from './patrons';
import { buildTableSet, buildBench, buildCounter, TABLE_POSITIONS } from './furniture';
import { ERA_MAP } from '../data/eras';

describe('patron occlusion diagnostics', () => {
  it('checks whether furniture occludes patrons from the default camera', () => {
    const eraId = 'e2025' as const;
    const camera = new THREE.PerspectiveCamera(55, 1280 / 800, 0.1, 80);
    const preset = ERA_MAP[eraId].presets.overview;
    camera.position.set(preset.x, preset.y, preset.z);
    camera.lookAt(0, 1.1, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const patrons = buildPatrons(ERA_MAP[eraId]);
    const furniture = new THREE.Group();
    furniture.add(buildCounter(ERA_MAP[eraId]).group);
    for (const pos of TABLE_POSITIONS) {
      furniture.add(buildTableSet(ERA_MAP[eraId], pos.x, pos.z, pos.ry));
    }
    furniture.add(buildBench(ERA_MAP[eraId]));
    furniture.updateMatrixWorld(true);
    patrons.updateMatrixWorld(true);

    const blockerMeshes: THREE.Mesh[] = [];
    furniture.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) blockerMeshes.push(mesh);
    });

    const raycaster = new THREE.Raycaster();
    const rows: string[] = [];
    let visibleCount = 0;
    let total = 0;
    patrons.traverse((obj) => {
      if (obj.name !== 'Patron') return;
      const g = obj as THREE.Group;
      const world = new THREE.Vector3();
      g.getWorldPosition(world);
      const samples: Array<[string, THREE.Vector3]> = [
        ['head', new THREE.Vector3(world.x, world.y + 0.9, world.z)],
        ['torso', new THREE.Vector3(world.x, world.y + 0.5, world.z)],
        ['hips', new THREE.Vector3(world.x, world.y + 0.25, world.z)],
      ];
      for (const [label, p] of samples) {
        total++;
        const dir = p.clone().sub(camera.position).normalize();
        raycaster.set(camera.position, dir);
        const distToPatron = camera.position.distanceTo(p);
        const hits = raycaster.intersectObjects(blockerMeshes, false);
        const blocked = hits.some((h) => h.distance < distToPatron - 0.01);
        if (!blocked) visibleCount++;
        rows.push(
          `patron@(${world.x.toFixed(2)},${world.y.toFixed(2)},${world.z.toFixed(2)}) ${label} blocked=${blocked} dist=${distToPatron.toFixed(2)}`,
        );
      }
    });
    // eslint-disable-next-line no-console
    console.log(rows.join('\n'));
    // eslint-disable-next-line no-console
    console.log(`visible samples: ${visibleCount}/${total}`);
    expect(visibleCount).toBeGreaterThan(0);
  });
});
