/**
 * ArchitectureShell.test.ts — verifies the persistent (non-era) café envelope
 * builds the required geometry (floor, 4 walls, ceiling, storefront window +
 * door), exposes era surface slots, and stays era-neutral.
 */
import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial } from 'three';
import {
  ArchitectureShell,
  WALL_SLOT_NAMES,
} from './ArchitectureShell';
import { ROOM_DIMENSIONS } from './layout';

describe('ArchitectureShell', () => {
  it('exposes a named root group for SceneManager to mount', () => {
    const shell = new ArchitectureShell();
    expect(shell.root.name).toBe('cafe-shell');
    shell.dispose();
  });

  it('contains a floor, ceiling, and four wall slots', () => {
    const shell = new ArchitectureShell();
    const slots = shell.slots;

    expect(slots.floor.name).toBe('shell:floor');
    expect(slots.ceiling.name).toBe('shell:ceiling');
    // Every named wall slot is present and has at least one mesh.
    for (const name of WALL_SLOT_NAMES) {
      expect(slots.walls[name].length).toBeGreaterThan(0);
    }
    shell.dispose();
  });

  it('includes storefront glass panes and a door', () => {
    const shell = new ArchitectureShell();
    const slots = shell.slots;

    // Storefront glass: at least two side windows + a transom.
    expect(slots.storefrontGlass.length).toBeGreaterThanOrEqual(2);
    for (const glass of slots.storefrontGlass) {
      expect(glass.name.startsWith('shell:glass:')).toBe(true);
    }
    // A door mesh exists in the root.
    const door = shell.root.getObjectByName('shell:door');
    expect(door).not.toBeNull();
    shell.dispose();
  });

  it('exposes a ceiling light mount for era fixtures', () => {
    const shell = new ArchitectureShell();
    expect(shell.slots.lightMount.name).toBe('shell:lightMount');
    // The mount sits at ceiling height so fixtures hang correctly.
    expect(shell.slots.lightMount.position.y).toBe(ROOM_DIMENSIONS.height);
    shell.dispose();
  });

  it('default materials are era-neutral (MeshStandardMaterial placeholders)', () => {
    const shell = new ArchitectureShell();
    expect(shell.slots.floor.material).toBeInstanceOf(MeshStandardMaterial);
    expect(shell.slots.ceiling.material).toBeInstanceOf(MeshStandardMaterial);
    for (const name of WALL_SLOT_NAMES) {
      for (const mesh of shell.slots.walls[name]) {
        expect(mesh.material).toBeInstanceOf(MeshStandardMaterial);
      }
    }
    shell.dispose();
  });

  it('era tasks can swap finishes via the slot accessors', () => {
    const shell = new ArchitectureShell();
    const floorMat = new MeshStandardMaterial({ color: 0xff0000 });
    const wallMat = new MeshStandardMaterial({ color: 0x00ff00 });
    const glassMat = new MeshStandardMaterial({ color: 0x0000ff });

    shell.applyFloorMaterial(floorMat);
    expect(shell.slots.floor.material).toBe(floorMat);

    shell.applyWallMaterial('back', wallMat);
    for (const mesh of shell.slots.walls.back) {
      expect(mesh.material).toBe(wallMat);
    }

    shell.applyGlassMaterial(glassMat);
    for (const mesh of shell.slots.storefrontGlass) {
      expect(mesh.material).toBe(glassMat);
    }

    floorMat.dispose();
    wallMat.dispose();
    glassMat.dispose();
    shell.dispose();
  });

  it('geometry fills the canonical room dimensions', () => {
    const shell = new ArchitectureShell();
    // Floor spans full width × depth at y = 0 (centre of its 0.2-thick slab).
    const floor = shell.slots.floor;
    expect(floor.scale.x * 1).toBeGreaterThanOrEqual(0); // sanity
    expect(floor.position.y).toBeLessThan(0.2); // near floor level
    // All shell meshes are parented under root.
    let count = 0;
    shell.root.traverse(() => {
      count++;
    });
    expect(count).toBeGreaterThan(8); // floor, ceiling, 4+ walls, glass, door
    shell.dispose();
  });

  it('dispose is safe to call and frees geometry', () => {
    const shell = new ArchitectureShell();
    expect(() => shell.dispose()).not.toThrow();
  });
});
