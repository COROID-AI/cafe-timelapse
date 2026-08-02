import * as THREE from 'three';
import { matColor } from './materials';
import type { InterpolatedColors } from './transition';

export interface LightingState {
  ambient: THREE.AmbientLight;
  key: THREE.DirectionalLight;
  point: THREE.PointLight;
  rim: THREE.DirectionalLight;
}

/**
 * Create the era lighting rig: ambient + warm key + a café point light
 * near the counter + a cool rim light to separate the room from the void.
 */
export function createLighting(colors: InterpolatedColors): LightingState {
  const ambient = new THREE.AmbientLight(colors.ambient, colors.ambientIntensity);

  const key = new THREE.DirectionalLight(colors.key, colors.keyIntensity);
  key.position.set(-4, 5.4, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  key.shadow.bias = -0.0005;

  const point = new THREE.PointLight(colors.point, colors.pointIntensity, 16, 2);
  point.position.set(1.6, 1.9, -1.1);

  const rim = new THREE.DirectionalLight('#9fb6ff', 0.45);
  rim.position.set(3, 3.5, 8);

  return { ambient, key, point, rim };
}

/** Update light colors/intensities for the interpolated palette. */
export function applyLighting(lighting: LightingState, colors: InterpolatedColors): void {
  lighting.ambient.color.set(colors.ambient);
  lighting.ambient.intensity = colors.ambientIntensity;
  lighting.key.color.set(colors.key);
  lighting.key.intensity = colors.keyIntensity;
  lighting.point.color.set(colors.point);
  lighting.point.intensity = colors.pointIntensity;
}

export function createFog(colors: InterpolatedColors): THREE.FogExp2 {
  return new THREE.FogExp2(colors.fog, colors.fogDensity);
}

/** Small emissive helper for the anchor glow of the machine. */
export function anchorGlow(color: string, intensity = 0.8): THREE.MeshStandardMaterial {
  return matColor(color, {
    emissive: color,
    emissiveIntensity: intensity,
    transparent: true,
    opacity: 0.85,
  });
}
