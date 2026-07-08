import { useEraAssets } from '../../hooks/useEraAssets';
import * as THREE from 'three';

/**
 * Per-era lighting recipe.
 * Reads era.lighting and renders ambient + directional/point lights + hanging lamps.
 */
export function Lighting() {
  const era = useEraAssets();
  const l = era.lighting;

  return (
    <>
      <ambientLight color={l.ambient} intensity={l.ambientIntensity} />

      {/* Key light — main illumination from front-top */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={l.keyIntensity}
        color={l.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />

      {/* Fill light from the window side */}
      <directionalLight position={[-6, 4, -2]} intensity={l.keyIntensity * 0.3} color={l.ambient} />

      {/* Hanging lamp glow above the seating area */}
      <pointLight
        position={[-2, 3.5, 1]}
        intensity={l.lamp === 'neon' || l.lamp === 'hologram' ? 2.5 : 1.5}
        color={l.lampGlow}
        distance={8}
        decay={2}
      />

      {/* Counter spotlight */}
      <spotLight
        position={[2, 4, 3.5]}
        angle={0.6}
        penumbra={0.5}
        intensity={l.keyIntensity * 0.8}
        color={l.key}
        distance={10}
        target-position={[2, 0, 3.5]}
      />

      {/* Era-specific neon accent for 1985/2055 */}
      {(l.lamp === 'neon' || l.lamp === 'hologram') && (
        <>
          <pointLight position={[-5, 2.5, -2]} intensity={1.5} color={l.lampGlow} distance={6} />
          <pointLight position={[5, 2.5, -2]} intensity={1.5} color={l.key} distance={6} />
        </>
      )}
    </>
  );
}

/** Helper to create a THREE.Color from a hex string. */
export function toColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}
