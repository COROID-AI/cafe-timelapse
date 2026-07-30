/**
 * layout.test.ts — asserts the canonical spatial contract is complete, stable,
 * and internally consistent. These dimensions/anchors are consumed by every
 * era task and by Navigation, so the contract must not silently drift.
 */
import { describe, expect, it } from 'vitest';
import {
  ANCHOR_KEYS,
  ANCHORS,
  COUNTER_ZONE,
  INTERIOR_BOUNDS,
  ROOM_DIMENSIONS,
  SEATING_ZONE,
  getAnchor,
} from './layout';
import type { RoomAnchors } from './layout';

describe('ROOM_DIMENSIONS', () => {
  it('exports the canonical café dimensions', () => {
    expect(ROOM_DIMENSIONS.width).toBe(12);
    expect(ROOM_DIMENSIONS.height).toBe(4);
    expect(ROOM_DIMENSIONS.depth).toBe(10);
  });
});

describe('INTERIOR_BOUNDS', () => {
  it('is derived from ROOM_DIMENSIONS (floor at y=0)', () => {
    expect(INTERIOR_BOUNDS.min.x).toBe(-ROOM_DIMENSIONS.width / 2);
    expect(INTERIOR_BOUNDS.max.x).toBe(ROOM_DIMENSIONS.width / 2);
    expect(INTERIOR_BOUNDS.min.y).toBe(0);
    expect(INTERIOR_BOUNDS.max.y).toBe(ROOM_DIMENSIONS.height);
    expect(INTERIOR_BOUNDS.min.z).toBe(-ROOM_DIMENSIONS.depth / 2);
    expect(INTERIOR_BOUNDS.max.z).toBe(ROOM_DIMENSIONS.depth / 2);
  });

  it('matches the original Navigation default volume', () => {
    // The canonical bounds superseded the interim 12×4×10 placeholder.
    expect(INTERIOR_BOUNDS.min).toMatchObject({ x: -6, y: 0, z: -5 });
    expect(INTERIOR_BOUNDS.max).toMatchObject({ x: 6, y: 4, z: 5 });
  });
});

describe('ANCHORS', () => {
  it('defines every acceptance-criteria anchor by stable key', () => {
    for (const key of [
      'counterCenter',
      'machineSlot',
      'menuBoardWall',
      'leftPosterWall',
      'rightPosterWall',
      'seatingTableA',
      'seatingTableB',
      'seatingTableC',
      'entrance',
    ] as const) {
      expect(ANCHORS[key as keyof RoomAnchors]).toBeDefined();
    }
  });

  it('ANCHOR_KEYS lists every anchor key exactly once', () => {
    const keys = ANCHOR_KEYS as readonly string[];
    expect(new Set(keys).size).toBe(keys.length);
    // Every key on the RoomAnchors interface is present.
    expect(keys).toEqual(Object.keys(ANCHORS));
  });

  it('getAnchor returns the same instance as ANCHORS', () => {
    expect(getAnchor('entrance')).toBe(ANCHORS.entrance);
  });

  it('places every anchor inside the interior bounds (on the floor or above)', () => {
    const { min, max } = INTERIOR_BOUNDS;
    for (const key of ANCHOR_KEYS) {
      const p = ANCHORS[key];
      expect(p.x).toBeGreaterThanOrEqual(min.x);
      expect(p.x).toBeLessThanOrEqual(max.x);
      expect(p.y).toBeGreaterThanOrEqual(min.y);
      expect(p.y).toBeLessThanOrEqual(max.y);
      expect(p.z).toBeGreaterThanOrEqual(min.z);
      expect(p.z).toBeLessThanOrEqual(max.z);
    }
  });

  it('places the machine slot at the audio-spatialization coffee-machine point', () => {
    // EraData audio spatializes the coffee machine at (-3, 1.3, -4); the visual
    // machine anchor must line up with the panned audio source.
    expect(ANCHORS.machineSlot).toMatchObject({ x: -3, y: 1.3, z: -4 });
  });

  it('places the menu board on the back wall above the counter', () => {
    expect(ANCHORS.menuBoardWall.z).toBe(-ROOM_DIMENSIONS.depth / 2);
    expect(ANCHORS.menuBoardWall.y).toBeGreaterThan(ANCHORS.counterCenter.y);
  });

  it('places posters on the side walls (x = ±width/2)', () => {
    expect(ANCHORS.leftPosterWall.x).toBe(-ROOM_DIMENSIONS.width / 2);
    expect(ANCHORS.rightPosterWall.x).toBe(ROOM_DIMENSIONS.width / 2);
  });

  it('places the entrance on the storefront wall (z = +depth/2)', () => {
    expect(ANCHORS.entrance.z).toBe(ROOM_DIMENSIONS.depth / 2);
  });
});

describe('functional zones', () => {
  it('COUNTER_ZONE sits along the back wall and is bounded by counter height', () => {
    expect(COUNTER_ZONE.min.z).toBe(-ROOM_DIMENSIONS.depth / 2);
    expect(COUNTER_ZONE.max.y).toBeLessThanOrEqual(1.3);
    // Counter spans a sensible central width.
    expect(COUNTER_ZONE.max.x - COUNTER_ZONE.min.x).toBeGreaterThan(0);
  });

  it('SEATING_ZONE occupies the front half of the room, above the floor', () => {
    expect(SEATING_ZONE.min.y).toBe(0);
    // Front half: toward the storefront (+Z).
    expect(SEATING_ZONE.max.z).toBeGreaterThan(0);
  });

  it('seating tables fall inside the seating zone footprint', () => {
    for (const t of [ANCHORS.seatingTableA, ANCHORS.seatingTableB, ANCHORS.seatingTableC]) {
      expect(SEATING_ZONE.containsPoint(t)).toBe(true);
    }
  });
});
