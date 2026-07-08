import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import { SteamParticles } from './SteamParticles';
import type { MachineKind } from '../../data/eras';

/**
 * Era-switching coffee machine. All built from primitives.
 * Emits steam particles in 1945/1965/1985/2005 eras.
 */
export function CoffeeMachine() {
  const era = useEraAssets();
  const kind = era.machine;

  // Position: on the counter
  return (
    <group position={[2, 1.2, -4.8]}>
      <MachineModel kind={kind} />

      {/* Steam for eras that produce it */}
      {(kind === 'enamel-percolator' ||
        kind === 'faema-e61' ||
        kind === 'la-marzocco' ||
        kind === 'super-automatic') && (
        <SteamParticles position={[0, 0.6, 0]} count={15} speed={0.5} color="#ffffff" />
      )}
    </group>
  );
}

function MachineModel({ kind }: { kind: MachineKind }) {
  switch (kind) {
    case 'enamel-percolator':
      return <Percolator />;
    case 'faema-e61':
      return <FaemaE61 />;
    case 'la-marzocco':
      return <LaMarzocco />;
    case 'super-automatic':
      return <SuperAutomatic />;
    case 'pour-over-bar':
      return <PourOverBar />;
    case 'cold-brew-sphere':
      return <ColdBrewSphere />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 1945: Enamel Percolator on Burner
// ---------------------------------------------------------------------------

function Percolator() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle vibration of the percolator
      groupRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 8) * 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body — tapered cylinder (lathe-like) */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Glass knob */}
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#aaffff" transparent opacity={0.7} roughness={0.1} />
      </mesh>
      {/* Spout */}
      <mesh position={[0.17, 0.4, 0]} rotation={[0, 0, -1.2]}>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Handle */}
      <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#3a1a0a" roughness={0.8} />
      </mesh>
      {/* Burner grate */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Burner glow */}
      <mesh position={[0, 0.07, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff6600" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 0.1, 0]} color="#ff6600" intensity={0.5} distance={1} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 1965: Faema E61 Lever Espresso
// ---------------------------------------------------------------------------

function FaemaE61() {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.7, 0.3, 0.5]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Body — chrome */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.45]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Brew group head */}
      <mesh position={[0, 0.45, 0.25]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Portafilter */}
      <mesh position={[0, 0.28, 0.3]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 12]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lever */}
      <mesh position={[0, 0.75, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.5, 0.04, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.23, 0.85, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Steam wand */}
      <mesh position={[0.28, 0.6, -0.1]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Drip tray */}
      <mesh position={[0, 0.05, 0.3]}>
        <boxGeometry args={[0.5, 0.03, 0.15]} />
        <meshStandardMaterial color="#aaa" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Brand badge */}
      <mesh position={[0, 0.55, 0.23]}>
        <boxGeometry args={[0.15, 0.05, 0.005]} />
        <meshStandardMaterial color="#1a3a1a" emissive="#2a5a2a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 1985: La Marzocco Two-Group
// ---------------------------------------------------------------------------

function LaMarzocco() {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[1.0, 0.24, 0.55]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Body — polished stainless steel */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.9, 0.42, 0.5]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Two group heads */}
      <mesh position={[-0.22, 0.35, 0.28]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0.22, 0.35, 0.28]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Portafilters */}
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0.2, 0.32]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 12]} />
            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.14, 0.05, 0.06]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      ))}
      {/* Pressure gauges */}
      <mesh position={[-0.35, 0.5, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ddd" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.35, 0.5, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#fff" emissive="#ddd" emissiveIntensity={0.2} />
      </mesh>
      {/* Cup warming tray on top */}
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.85, 0.03, 0.45]} />
        <meshStandardMaterial color="#bbb" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Espresso cup on tray */}
      <mesh position={[0.2, 0.75, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.05, 12]} />
        <meshStandardMaterial color="#fff" roughness={0.2} />
      </mesh>
      {/* Drip tray */}
      <mesh position={[0, 0.02, 0.35]}>
        <boxGeometry args={[0.8, 0.02, 0.15]} />
        <meshStandardMaterial color="#999" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2005: Super-Automatic Bean-to-Cup
// ---------------------------------------------------------------------------

function SuperAutomatic() {
  return (
    <group>
      {/* Tall body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1.0, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Bean hopper on top */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 16]} />
        <meshPhysicalMaterial
          color="#2a1a0a"
          transparent
          opacity={0.6}
          roughness={0.1}
          transmission={0.5}
        />
      </mesh>
      {/* Display screen */}
      <mesh position={[0, 0.7, 0.23]}>
        <boxGeometry args={[0.3, 0.15, 0.01]} />
        <meshStandardMaterial color="#1a4a8a" emissive="#3a7aca" emissiveIntensity={0.5} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, 0.35, 0.22]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.05, 0.3, 0.23]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      <mesh position={[0.05, 0.3, 0.23]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
      {/* Button panel */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[-0.12 + i * 0.08, 0.15, 0.23]}>
          <cylinderGeometry args={[0.025, 0.025, 0.01, 12]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      {/* Cup under spout */}
      <mesh position={[0, 0.1, 0.25]}>
        <cylinderGeometry args={[0.045, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#fff" roughness={0.2} />
      </mesh>
      {/* Drip tray */}
      <mesh position={[0, 0.02, 0.25]}>
        <boxGeometry args={[0.4, 0.02, 0.15]} />
        <meshStandardMaterial color="#555" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2025: Pour-Over Bar (V60 + Scales)
// ---------------------------------------------------------------------------

function PourOverBar() {
  const kettleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // Gentle kettle tilt animation simulating pouring
    if (kettleRef.current) {
      const cycle = (state.clock.elapsedTime % 6) / 6;
      if (cycle > 0.3 && cycle < 0.5) {
        kettleRef.current.rotation.z = -0.5 + Math.sin(cycle * 30) * 0.05;
      } else {
        kettleRef.current.rotation.z = THREE.MathUtils.lerp(
          kettleRef.current.rotation.z,
          0,
          0.1,
        );
      }
    }
  });

  return (
    <group>
      {/* Scale base (digital) */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.25, 0.04, 0.25]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Scale display */}
      <mesh position={[0, 0.06, 0.12]}>
        <boxGeometry args={[0.15, 0.02, 0.04]} />
        <meshStandardMaterial color="#00ff80" emissive="#00ff80" emissiveIntensity={0.8} />
      </mesh>
      {/* Carafe */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.06, 0.15, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.9}
          thickness={0.3}
        />
      </mesh>
      {/* V60 dripper */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.1, 0.12, 16, 1, true]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          roughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Paper filter inside V60 */}
      <mesh position={[0, 0.26, 0]}>
        <coneGeometry args={[0.085, 0.1, 16, 1, true]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Gooseneck kettle */}
      <mesh ref={kettleRef} position={[0.25, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Kettle spout */}
      <mesh position={[0.18, 0.38, 0]} rotation={[0, 0, 1.2]}>
        <cylinderGeometry args={[0.01, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Kettle handle */}
      <mesh position={[0.33, 0.35, 0]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2055: Suspended Cold-Brew Sphere
// ---------------------------------------------------------------------------

function ColdBrewSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      sphereRef.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group>
      {/* Magnetic levitation ring */}
      <mesh ref={ringRef} position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.015, 8, 32]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={2} />
      </mesh>
      {/* Ring glow */}
      <pointLight position={[0, 0.15, 0]} color="#00E5FF" intensity={1} distance={2} />

      {/* Suspended sphere — cold brew container */}
      <mesh ref={sphereRef} position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshPhysicalMaterial
          color="#2a1a0a"
          transparent
          opacity={0.5}
          roughness={0.05}
          transmission={0.8}
          thickness={0.5}
          ior={1.3}
        />
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#7C4DFF"
          emissive="#7C4DFF"
          emissiveIntensity={1}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Dispenser tube */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={1.5} />
      </mesh>

      {/* Crystal glass pod below */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.12, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.2}
          roughness={0.02}
          transmission={0.95}
          thickness={0.3}
        />
      </mesh>

      {/* Holographic control panel */}
      <mesh position={[0, 0.4, 0.22]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshStandardMaterial
          color="#7C4DFF"
          emissive="#7C4DFF"
          emissiveIntensity={2}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
