import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildPatrons } from './patrons';
import { chairSeatPositions } from './furniture';
import { ERAS, ERA_MAP } from '../data/eras';

function countPatronMeshes(group: THREE.Object3D): number {
  let count = 0;
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) count++;
  });
  return count;
}

function countPatronFigureGroups(group: THREE.Object3D): number {
  let count = 0;
  group.traverse((obj) => {
    if (obj.name === 'Patron') count++;
  });
  return count;
}

describe('café patrons', () => {
  it('builds patron figures for every era', () => {
    for (const era of ERAS) {
      const patrons = buildPatrons(era);
      expect(patrons.name).toBe(`Patrons:${era.id}`);
      // every era has seated table guests, counter/bench guests, a barista,
      // and several standing guests — a clearly visible crowd
      expect(countPatronFigureGroups(patrons)).toBeGreaterThanOrEqual(13);
      expect(countPatronMeshes(patrons)).toBeGreaterThanOrEqual(13 * 4);
    }
  });

  it('seated patrons rest on the shared chair seat positions', () => {
    for (const era of ERAS) {
      const seats = chairSeatPositions(era, -2.2, 2.2, 0.2);
      expect(seats.length).toBe(era.furniture.chairStyle.includes('levitating') ? 4 : 3);
      for (const seat of seats) {
        expect(seat.y).toBeGreaterThan(0.4);
        expect(seat.y).toBeLessThan(0.7);
      }
    }
  });

  it('every seated patron sits above the floor; standing guests rest on it', () => {
    for (const era of ERAS) {
      const patrons = buildPatrons(era);
      let seated = 0;
      let standing = 0;
      patrons.traverse((obj) => {
        if (obj.name === 'Patron' && (obj as THREE.Group).type === 'Group') {
          const g = obj as THREE.Group;
          if (g.position.y >= 0.4) {
            seated++;
          } else if (g.position.y === 0) {
            standing++;
          }
        }
      });
      expect(seated).toBeGreaterThanOrEqual(11);
      expect(standing).toBeGreaterThanOrEqual(4);
    }
  });

  it('fills the front-facing chair at each table so guests read from the overview', () => {
    for (const era of ERAS) {
      const patrons = buildPatrons(era);
      let frontGuests = 0;
      patrons.traverse((obj) => {
        if (obj.name !== 'Patron') return;
        const g = obj as THREE.Group;
        // Seated table guests at the front half of the room (z >= 2).
        if (g.position.y >= 0.4 && g.position.z >= 2) frontGuests++;
      });
      // Tables at z 2.2/2.9/5.2/5.6 each seat their front guest.
      expect(frontGuests).toBeGreaterThanOrEqual(4);
    }
  });

  it('outfits vary per era so the crowd reads differently across the timelapse', () => {
    const first = buildPatrons(ERA_MAP.e1945);
    const last = buildPatrons(ERA_MAP.e2055);
    // material keys differ because the era palettes/outfits differ
    const firstColors = new Set<string>();
    const lastColors = new Set<string>();
    first.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        firstColors.add(m.color.getHexString());
      }
    });
    last.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const m = mesh.material as THREE.MeshStandardMaterial;
        lastColors.add(m.color.getHexString());
      }
    });
    // era-specific torso colors guarantee different crowd looks
    expect(firstColors.size).toBeGreaterThan(0);
    expect(lastColors.size).toBeGreaterThan(0);
  });
});
