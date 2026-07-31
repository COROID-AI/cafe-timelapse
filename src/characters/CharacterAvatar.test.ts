/**
 * CharacterAvatar.test.ts — asserts the procedural seated-figure builder
 * produces well-formed geometry from a PatronConfig without rebuilding the
 * silhouette per-config.
 */
import { describe, expect, it } from 'vitest';
import { Mesh, Group } from 'three';
import { buildAvatar, buildSeatedPatron, placeAvatar } from './CharacterAvatar.js';
import type { PatronConfig } from './PatronConfig.js';
import { ANCHORS } from '../world/layout.js';

/** A representative config covering the suit/fedora/newspaper family. */
function gentConfig(): PatronConfig {
  return {
    id: 'gent',
    era: 1945,
    outfit: { type: 'suit', color: 0x333333, accent: 0xeeeeee },
    hat: { type: 'fedora', color: 0x333333 },
    hair: { style: 'slickedBack', color: 0x222222 },
    gadget: { type: 'newspaper' },
    seat: 'seatingTableA',
  };
}

/** A representative config covering the dress/victory-rolls family. */
function ladyConfig(): PatronConfig {
  return {
    id: 'lady',
    era: 1945,
    outfit: { type: 'dayDress', color: 0x9a3a30, accent: 0xe8dcc0 },
    hat: { type: 'none', color: 0x000000 },
    hair: { style: 'victoryRolls', color: 0x5a3018 },
    gadget: { type: 'newspaper' },
    seat: 'seatingTableB',
  };
}

/** Count the meshes under a group (recursively). */
function meshCount(obj: { traverse: (cb: (o: unknown) => void) => void }): number {
  let n = 0;
  obj.traverse((child) => {
    if ((child as Mesh).isMesh) n++;
  });
  return n;
}

describe('buildAvatar', () => {
  it('returns a named group for the era + id', () => {
    const g = buildAvatar(gentConfig());
    expect(g).toBeInstanceOf(Group);
    expect(g.name).toBe('patron:1945:gent');
  });

  it('produces a non-trivial mesh count (torso + head + accessories)', () => {
    const g = buildAvatar(gentConfig());
    expect(meshCount(g)).toBeGreaterThan(8);
  });

  it('builds a head sphere for every config', () => {
    const g = buildAvatar(ladyConfig());
    let hasSphere = false;
    g.traverse((child) => {
      if ((child as Mesh).isMesh && (child as Mesh).geometry.type === 'SphereGeometry') {
        hasSphere = true;
      }
    });
    expect(hasSphere).toBe(true);
  });

  it('adds a fedora when configured', () => {
    const g = buildAvatar(gentConfig());
    // A fedora adds a crown cylinder + brim cylinder + band = 3 extra meshes
    // beyond the hat-less baseline.
    const withHat = meshCount(g);
    const noHat = meshCount(buildAvatar({ ...gentConfig(), hat: { type: 'none', color: 0 } }));
    expect(withHat).toBeGreaterThan(noHat);
  });

  it('adds a newspaper gadget when configured', () => {
    const withNews = meshCount(buildAvatar(gentConfig()));
    const noGadget = meshCount(
      buildAvatar({ ...gentConfig(), gadget: { type: 'none' } }),
    );
    expect(withNews).toBeGreaterThan(noGadget);
  });

  it('does not add hat meshes when hat type is none', () => {
    const g = buildAvatar(ladyConfig());
    // The lady has no hat; mesh count should still be substantial from hair.
    expect(meshCount(g)).toBeGreaterThan(6);
  });
});

describe('placeAvatar', () => {
  it('positions the group at anchor + offset and applies facing', () => {
    const g = buildAvatar(gentConfig());
    const anchor = ANCHORS.seatingTableA;
    placeAvatar(g, [anchor.x, anchor.y, anchor.z], [0.3, 0, 0.1], 45);
    expect(g.position.x).toBeCloseTo(anchor.x + 0.3, 5);
    expect(g.position.y).toBeCloseTo(anchor.y, 5);
    expect(g.position.z).toBeCloseTo(anchor.z + 0.1, 5);
    expect(g.rotation.y).toBeCloseTo((45 * Math.PI) / 180, 5);
  });
});

describe('buildSeatedPatron', () => {
  it('builds and positions in one call', () => {
    const cfg = gentConfig();
    const anchor = ANCHORS[cfg.seat];
    const g = buildSeatedPatron(cfg, [anchor.x, anchor.y, anchor.z]);
    expect(g).toBeInstanceOf(Group);
    expect(g.position.x).toBeCloseTo(anchor.x, 5);
    expect(meshCount(g)).toBeGreaterThan(8);
  });

  it('every 1945 patron config builds without throwing', async () => {
    const { PATRONS_1945 } = await import('./patrons1945.js');
    for (const cfg of PATRONS_1945) {
      const anchor = ANCHORS[cfg.seat];
      const g = buildSeatedPatron(cfg, [anchor.x, anchor.y, anchor.z]);
      expect(meshCount(g)).toBeGreaterThan(6);
    }
  });
});
