import type { EraYear } from '../data/eras';

/**
 * Per-era lighting environment for the café timelapse.
 *
 * Every config is grounded in the era's canonical record (src/data/eras/*.ts):
 * the `signageLighting.lighting` description and the `architecture` wall/floor
 * colours. The SceneManager applies these when it mounts an era.
 */
export interface EraLightingConfig {
  /** Scene background colour. */
  background: number;
  /** Soft ambient fill that sets the room's base mood. */
  ambient: {
    color: number;
    intensity: number;
  };
  /** Key light — the era's main source (pendant, strip, spots, LED). */
  key: {
    color: number;
    intensity: number;
    position: [number, number, number];
  };
  /** Cool fill from windows / secondary sources. */
  fill: {
    color: number;
    intensity: number;
    position: [number, number, number];
  };
  /** Optional accent/rim light (chrome, brass, bioluminescence). */
  rim?: {
    color: number;
    intensity: number;
    position: [number, number, number];
    /** Animate intensity over time (e.g. 2055 bioluminescent pulse). */
    pulse?: boolean;
  };
  /** Fog matching the background, for dim-corner depth falloff. */
  fog?: {
    color: number;
    near: number;
    far: number;
  };
}

/**
 * Lighting environment for each canonical era.
 *
 * Sources:
 * - 1945: "Single warm tungsten pendant; dim in the corners" + cream plaster /
 *   deep green dado walls.
 * - 1965: "Strip lighting with warm fluorescent tubes" + pale yellow walls,
 *   chrome trim.
 * - 1985: "Fluorescent panels and a brass pendant over the counter" + peach
 *   walls.
 * - 2005: "Track spotlights and warm pendant lamps" + chocolate-brown walls.
 * - 2025: "Warm LED strips with a statement rattan pendant" + white walls with
 *   oak slat panelling.
 * - 2055: "Bioluminescent ceiling nodes that pulse with music" + smart-glass
 *   panels.
 */
export const ERA_LIGHTING: Record<EraYear, EraLightingConfig> = {
  1945: {
    background: 0x1b160e,
    ambient: { color: 0xffd9b0, intensity: 0.35 },
    key: {
      color: 0xffc68a,
      intensity: 1.1,
      position: [0, 8, 2],
    },
    fill: {
      color: 0xbfd4ff,
      intensity: 0.2,
      position: [-6, 4, -4],
    },
    fog: { color: 0x1b160e, near: 12, far: 30 },
  },
  1965: {
    background: 0x14100c,
    ambient: { color: 0xfff3d6, intensity: 0.55 },
    key: {
      color: 0xfff0d2,
      intensity: 1.8,
      position: [0, 9, 4],
    },
    fill: {
      color: 0xffe0b0,
      intensity: 0.35,
      position: [-7, 5, 3],
    },
    rim: {
      color: 0xffd9a0,
      intensity: 0.3,
      position: [6, 7, -6],
    },
  },
  1985: {
    background: 0x141016,
    ambient: { color: 0xffe9e0, intensity: 0.5 },
    key: {
      color: 0xfff1dc,
      intensity: 1.7,
      position: [0, 8.5, 0],
    },
    fill: {
      color: 0x9fd0ff,
      intensity: 0.35,
      position: [-6, 4, -5],
    },
    rim: {
      color: 0xffb86b,
      intensity: 0.45,
      position: [6, 6, -2],
    },
  },
  2005: {
    background: 0x120e0a,
    ambient: { color: 0xffcf9f, intensity: 0.5 },
    key: {
      color: 0xffe3bb,
      intensity: 1.8,
      position: [3, 8, 6],
    },
    fill: {
      color: 0x9fb8ff,
      intensity: 0.3,
      position: [-6, 4, -4],
    },
    rim: {
      color: 0xffb87a,
      intensity: 0.35,
      position: [-3, 7, -6],
    },
  },
  2025: {
    background: 0x14151a,
    ambient: { color: 0xffe9d2, intensity: 0.65 },
    key: {
      color: 0xffffff,
      intensity: 2.0,
      position: [2, 8, 5],
    },
    fill: {
      color: 0xcdd9ff,
      intensity: 0.35,
      position: [-6, 4, 4],
    },
    rim: {
      color: 0xffd9a0,
      intensity: 0.4,
      position: [6, 6, -6],
    },
  },
  2055: {
    background: 0x0a0c14,
    ambient: { color: 0x6fd8ff, intensity: 0.25 },
    key: {
      color: 0xbfe9ff,
      intensity: 1.4,
      position: [0, 9, 0],
    },
    fill: {
      color: 0xff6ad5,
      intensity: 0.25,
      position: [-7, 5, -3],
    },
    rim: {
      color: 0x41f2c8,
      intensity: 0.5,
      position: [6, 8, 5],
      pulse: true,
    },
  },
};
