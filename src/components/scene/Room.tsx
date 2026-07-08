import { useMemo } from 'react';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import { floorTexture, wallTexture } from '../../lib/proceduralTextures';

/**
 * Static café shell: floor, walls, ceiling, baseboard, door frame, two front windows
 * with era-appropriate frames, and a hanging lamp socket.
 * Uses procedural textures with era-appropriate colours.
 */
export function Room() {
  const era = useEraAssets();
  const f = era.furniture;

  // Room dimensions
  const W = 16; // width (X)
  const D = 14; // depth (Z)
  const H = 6; // height (Y)

  // Generate textures — memoized per era
  const floorTex = useMemo(
    () => floorTexture(f.floorTexture, era.year, f.floorColor),
    [f.floorTexture, f.floorColor, era.year],
  );
  const wallTex = useMemo(
    () => wallTexture(f.wallTexture, era.year + 1, f.wallColor),
    [f.wallTexture, f.wallColor, era.year],
  );

  // Set repeat
  useMemo(() => {
    floorTex.repeat.set(4, 4);
    wallTex.repeat.set(3, 1);
  }, [floorTex, wallTex]);

  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: f.accentColor, roughness: 0.8 }),
    [f.accentColor],
  );

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floorTex} roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={f.ceilingColor} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, H / 2, -D / 2]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Right wall */}
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Front wall (behind camera) with door + windows */}
      <mesh position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Baseboards around the room */}
      <Baseboard width={W} depth={D} material={accentMat} />

      {/* Two front windows with era frames */}
      <Window position={[-3.5, 3, D / 2 - 0.05]} accentColor={f.accentColor} />
      <Window position={[3.5, 3, D / 2 - 0.05]} accentColor={f.accentColor} />

      {/* Door frame on the front wall */}
      <mesh position={[0, 1.1, D / 2 - 0.06]} castShadow>
        <boxGeometry args={[1.2, 2.2, 0.1]} />
        <meshStandardMaterial color={f.accentColor} roughness={0.7} />
      </mesh>

      {/* Hanging lamp above seating area */}
      <HangingLamp position={[-2, H - 1.5, 1]} />
    </group>
  );
}

function Baseboard({
  width,
  depth,
  material,
}: {
  width: number;
  depth: number;
  material: THREE.Material;
}) {
  const h = 0.15;
  const t = 0.04;
  return (
    <group>
      {/* Back */}
      <mesh position={[0, h / 2, -depth / 2 + t / 2]} material={material} castShadow>
        <boxGeometry args={[width, h, t]} />
      </mesh>
      {/* Front */}
      <mesh position={[0, h / 2, depth / 2 - t / 2]} material={material} castShadow>
        <boxGeometry args={[width, h, t]} />
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2 + t / 2, h / 2, 0]} material={material} castShadow>
        <boxGeometry args={[t, h, depth]} />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 - t / 2, h / 2, 0]} material={material} castShadow>
        <boxGeometry args={[t, h, depth]} />
      </mesh>
    </group>
  );
}

function Window({
  position,
  accentColor,
}: {
  position: [number, number, number];
  accentColor: string;
}) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[2.8, 2.8, 0.08]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
      {/* Glass pane */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshPhysicalMaterial
          color="#a0c8e0"
          transparent
          opacity={0.15}
          roughness={0.05}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
        />
      </mesh>
      {/* Crossbars */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[2.5, 0.05, 0.04]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.05, 2.5, 0.04]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

function HangingLamp({ position }: { position: [number, number, number] }) {
  const era = useEraAssets();
  const lamp = era.lighting.lamp;
  const glow = era.lighting.lampGlow;

  return (
    <group position={position}>
      {/* Cord */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.5, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {lamp === 'bulb' && (
        <>
          {/* Bare bulb socket */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color={glow}
              emissive={glow}
              emissiveIntensity={1.5}
            />
          </mesh>
        </>
      )}

      {lamp === 'fluorescent' && (
        <>
          {/* Tube fixture */}
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[1.2, 0.1, 0.15]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[1.0, 0.04, 0.08]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2} />
          </mesh>
        </>
      )}

      {lamp === 'neon' && (
        <>
          {/* Neon tube */}
          <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.2, 0.025, 8, 24]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[0.5, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.15, 0.02, 8, 24]} />
            <meshStandardMaterial color={era.lighting.key} emissive={era.lighting.key} emissiveIntensity={2.5} />
          </mesh>
        </>
      )}

      {lamp === 'pendant-edison' && (
        <>
          {/* Pendant cone shade */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.25, 0.15, 0.3, 12]} />
            <meshStandardMaterial color="#3a2a18" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={2} />
          </mesh>
        </>
      )}

      {lamp === 'spotlight' && (
        <>
          {/* Track spotlight */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.2, 12]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={3} />
          </mesh>
        </>
      )}

      {lamp === 'hologram' && (
        <>
          {/* Floating holographic emitter */}
          <mesh position={[0, -0.1, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={3} transparent opacity={0.8} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} color={glow} intensity={1} distance={5} />
        </>
      )}
    </group>
  );
}
