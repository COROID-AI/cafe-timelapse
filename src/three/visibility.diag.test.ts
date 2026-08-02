import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildPatrons } from './patrons';
import { buildTableSet, buildBench, buildCounter, TABLE_POSITIONS } from './furniture';
import { buildRoomShell } from './room';
import { ERA_MAP, DEFAULT_ERA } from '../data/eras';

describe('patron visibility from default overview camera', () => {
  it('projects patrons into screen space and checks occlusion by room + furniture', () => {
    const eraId = DEFAULT_ERA;
    const camera = new THREE.PerspectiveCamera(55, 1280 / 800, 0.1, 80);
    const preset = ERA_MAP[eraId].presets.overview;
    camera.position.set(preset.x, preset.y, preset.z);
    camera.lookAt(0, 1.1, 0);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();

    const colors = ERA_MAP[eraId].palette;
    const room = buildRoomShell(colors);
    const furniture = new THREE.Group();
    furniture.add(buildCounter(ERA_MAP[eraId]).group);
    for (const pos of TABLE_POSITIONS) {
      furniture.add(buildTableSet(ERA_MAP[eraId], pos.x, pos.z, pos.ry));
    }
    furniture.add(buildBench(ERA_MAP[eraId]));

    const world = new THREE.Group();
    world.add(room);
    world.add(furniture);
    world.updateMatrixWorld(true);

    const blockers: THREE.Mesh[] = [];
    world.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) blockers.push(mesh);
    });

    const patrons = buildPatrons(ERA_MAP[eraId]);
    patrons.updateMatrixWorld(true);

    const raycaster = new THREE.Raycaster();
    const rows: string[] = [];
    let visibleSamples = 0;
    let totalSamples = 0;
    let onScreenFigures = 0;
    let visibleFigures = 0;
    let totalFigures = 0;

    patrons.traverse((obj) => {
      if (obj.name !== 'Patron') return;
      const g = obj as THREE.Group;
      totalFigures++;
      const worldPos = new THREE.Vector3();
      g.getWorldPosition(worldPos);

      const samples: Array<[string, THREE.Vector3]> = [
        ['head', new THREE.Vector3(worldPos.x, worldPos.y + 0.85, worldPos.z)],
        ['torso', new THREE.Vector3(worldPos.x, worldPos.y + 0.45, worldPos.z)],
        ['hips', new THREE.Vector3(worldPos.x, worldPos.y + 0.2, worldPos.z)],
      ];
      let anyOnScreen = false;
      let anyVisible = false;
      for (const [label, p] of samples) {
        totalSamples++;
        const ndc = p.clone().project(camera);
        const onScreen =
          ndc.x >= -1 && ndc.x <= 1 && ndc.y >= -1 && ndc.y <= 1 && ndc.z >= -1 && ndc.z <= 1;
        if (onScreen) anyOnScreen = true;

        const dir = p.clone().sub(camera.position).normalize();
        raycaster.set(camera.position, dir);
        const distToPatron = camera.position.distanceTo(p);
        const hits = raycaster.intersectObjects(blockers, false);
        const blocked = hits.some((h) => h.distance < distToPatron - 0.01);
        if (onScreen && !blocked) {
          anyVisible = true;
          visibleSamples++;
        }
        rows.push(
          `patron@(${worldPos.x.toFixed(2)},${worldPos.y.toFixed(2)},${worldPos.z.toFixed(2)}) ${label} ` +
            `onScreen=${onScreen} blocked=${blocked} ndc=(${ndc.x.toFixed(2)},${ndc.y.toFixed(2)}) dist=${distToPatron.toFixed(2)}`,
        );
      }
      if (anyOnScreen) onScreenFigures++;
      if (anyVisible) {
        visibleFigures++;
        rows.push(`  => FIGURE VISIBLE from overview`);
      } else {
        rows.push(`  => FIGURE NOT VISIBLE from overview`);
      }
    });

    // eslint-disable-next-line no-console
    console.log(rows.join('\n'));
    // eslint-disable-next-line no-console
    console.log(
      `summary: figures=${totalFigures} onScreen=${onScreenFigures} visible=${visibleFigures} visibleSamples=${visibleSamples}/${totalSamples}`,
    );
    expect(visibleSamples).toBeGreaterThan(0);
  });
});
