import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import type { MusicSourceKind } from '../../data/eras';

/**
 * Era-specific music source prop. Each variant is built from primitives
 * with animated elements (rotating disk, pulsing glow, floating orb).
 */
export function MusicSource() {
  const era = useEraAssets();
  const kind = era.music;

  // Position: on a shelf near the back-left wall
  const pos: [number, number, number] = [-5.5, 2, -3];

  return (
    <group position={pos}>
      <MusicModel kind={kind} accentColor={era.palette.accent} />
    </group>
  );
}

function MusicModel({
  kind,
  accentColor,
}: {
  kind: MusicSourceKind;
  accentColor: string;
}) {
  switch (kind) {
    case 'wireless-set':
      return <WirelessSet />;
    case 'jukebox':
      return <Jukebox />;
    case 'boombox':
      return <Boombox />;
    case 'ipod-dock':
      return <IpodDock />;
    case 'phone-mat':
      return <PhoneMat />;
    case 'hologram-orb':
      return <HologramOrb accentColor={accentColor} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 1945: Wooden Wireless Set
// ---------------------------------------------------------------------------

function WirelessSet() {
  const dialRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (dialRef.current) {
      const mat = dialRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group>
      {/* Wooden cabinet */}
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.6, 0.35]} />
        <meshStandardMaterial color="#4A3018" roughness={0.6} />
      </mesh>
      {/* Speaker grille (top section) */}
      <mesh position={[0, 0.12, 0.18]}>
        <boxGeometry args={[0.8, 0.25, 0.01]} />
        <meshStandardMaterial color="#2a1a0e" roughness={0.9} />
      </mesh>
      {/* Grille pattern dots */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => (
          <mesh
            key={`${row}-${col}`}
            position={[-0.34 + col * 0.062, 0.08 + row * 0.05, 0.185]}
          >
            <circleGeometry args={[0.012, 8]} />
            <meshStandardMaterial color="#1a0a04" />
          </mesh>
        )),
      )}
      {/* Tuning dial */}
      <mesh ref={dialRef} position={[0, -0.1, 0.18]}>
        <boxGeometry args={[0.5, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Knobs */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, -0.1, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
          <meshStandardMaterial color="#c0a060" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Antenna */}
      <mesh position={[0.35, 0.4, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.005, 0.005, 0.4, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 1965: Jukebox (with glowing tubes)
// ---------------------------------------------------------------------------

function Jukebox() {
  const tubeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const recordRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tubeRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 1 + Math.sin(t * 4 + i) * 0.5;
      }
    });
    if (recordRef.current) {
      recordRef.current.rotation.y = t * 3;
    }
  });

  return (
    <group>
      {/* Curved top dome */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ff4040"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.7}
          thickness={0.5}
        />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.3]} />
        <meshStandardMaterial color="#8b0000" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Glowing tubes */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh
          key={x}
          ref={(el) => {
            tubeRefs.current[i] = el;
          }}
          position={[x, 0.25, 0.12]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* Rotating record (visible through dome) */}
      <mesh ref={recordRef} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.005, 32]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} />
      </mesh>
      {/* Record label */}
      <mesh position={[0, 0.105, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial color="#D43F3F" />
      </mesh>
      {/* Selection buttons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[-0.15 + (i % 2) * 0.1, 0.0 - Math.floor(i / 2) * 0.06, 0.16]}>
          <circleGeometry args={[0.015, 8]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {/* Base */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.1, 0.35]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color="#ffaa00" intensity={0.5} distance={2} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 1985: Boombox
// ---------------------------------------------------------------------------

function Boombox() {
  const coneRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    coneRefs.current.forEach((mesh) => {
      if (mesh) {
        mesh.scale.z = 1 + Math.sin(t * 8) * 0.05;
      }
    });
  });

  return (
    <group>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.6, 0.25]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Two speakers */}
      {[-0.35, 0.35].map((x, i) => (
        <group key={x} position={[x, 0, 0.13]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 24]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh
            ref={(el) => {
              coneRefs.current[i] = el;
            }}
            position={[0, 0, 0.01]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.12, 0.08, 0.03, 24]} />
            <meshStandardMaterial color="#444" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Cassette deck */}
      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[0.3, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Cassette reels */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0, 0.14]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 8]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      ))}
      {/* Handle */}
      <mesh position={[0, 0.35, 0]}>
        <torusGeometry args={[0.3, 0.02, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Tuning dial + buttons */}
      <mesh position={[0, -0.2, 0.13]}>
        <boxGeometry args={[0.4, 0.05, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-0.2 + i * 0.08, -0.25, 0.13]}>
          <boxGeometry args={[0.04, 0.02, 0.01]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2005: iPod + Dock
// ---------------------------------------------------------------------------

function IpodDock() {
  return (
    <group>
      {/* Speaker dock base */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.5, 0.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Speaker grille */}
      <mesh position={[0, 0, 0.16]}>
        <circleGeometry args={[0.15, 24]} />
        <meshStandardMaterial color="#cccccc" roughness={0.6} />
      </mesh>
      {/* Dock connector slot */}
      <mesh position={[0, 0.28, 0.12]}>
        <boxGeometry args={[0.1, 0.02, 0.05]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* iPod (classic white) */}
      <mesh position={[0, 0.42, 0.1]} castShadow>
        <boxGeometry args={[0.12, 0.2, 0.02]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.2} />
      </mesh>
      {/* iPod screen */}
      <mesh position={[0, 0.46, 0.111]}>
        <planeGeometry args={[0.09, 0.07]} />
        <meshStandardMaterial color="#1a2a4a" emissive="#3a6aaa" emissiveIntensity={0.5} />
      </mesh>
      {/* Click wheel */}
      <mesh position={[0, 0.36, 0.111]}>
        <circleGeometry args={[0.04, 24]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2025: Phone on Charging Mat
// ---------------------------------------------------------------------------

function PhoneMat() {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group>
      {/* Charging mat */}
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Charging glow ring */}
      <mesh ref={glowRef} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.18, 32]} />
        <meshStandardMaterial color="#7CB342" emissive="#7CB342" emissiveIntensity={0.5} />
      </mesh>
      {/* Phone lying flat */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.14, 0.01, 0.28]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Phone screen glow */}
      <mesh position={[0, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12, 0.25]} />
        <meshStandardMaterial color="#0a0a0a" emissive="#E0A458" emissiveIntensity={0.4} />
      </mesh>
      {/* Small Bluetooth speaker beside it */}
      <mesh position={[0.3, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 24]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>
      <mesh position={[0.3, 0.115, 0]}>
        <circleGeometry args={[0.035, 24]} />
        <meshStandardMaterial color="#555" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2055: Floating Holographic Speaker Orb
// ---------------------------------------------------------------------------

function HologramOrb({ accentColor }: { accentColor: string }) {
  const orbRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (orbRef.current) {
      orbRef.current.position.y = 0.3 + Math.sin(t * 1.5) * 0.05;
      orbRef.current.rotation.y = t * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.3;
    }
  });

  return (
    <group>
      {/* Emitter base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a20" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Emitter glow */}
      <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={2} />
      </mesh>

      {/* Floating orb */}
      <mesh ref={orbRef} position={[0, 0.3, 0]}>
        <icosahedronGeometry args={[0.1, 1]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
          wireframe
        />
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.008, 8, 48]} />
        <meshStandardMaterial color="#7C4DFF" emissive="#7C4DFF" emissiveIntensity={2} />
      </mesh>

      <pointLight position={[0, 0.3, 0]} color={accentColor} intensity={0.8} distance={3} />
    </group>
  );
}
