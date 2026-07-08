import { useMemo } from 'react';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import type { CounterTechKind } from '../../data/eras';

/**
 * Wooden counter with era-specific front paneling, register/tech swap-in,
 * and item placements (cake dome, tip jar, napkin holder).
 * Counter technology renders different props per era.
 */
export function Counter() {
  const era = useEraAssets();
  const f = era.furniture;

  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: f.accentColor,
        roughness: 0.6,
        metalness: 0.1,
      }),
    [f.accentColor],
  );

  const topMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3a2818',
        roughness: 0.3,
        metalness: 0.15,
      }),
    [],
  );

  // Counter position — along the back wall
  const cx = 2;
  const cy = 0.55;
  const cz = -4.5;

  return (
    <group position={[cx, 0, cz]}>
      {/* Counter body */}
      <mesh position={[0, cy, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[5, 1.1, 1.2]} />
      </mesh>

      {/* Counter top — darker polished surface */}
      <mesh position={[0, 1.15, 0]} material={topMat} castShadow>
        <boxGeometry args={[5.2, 0.08, 1.4]} />
      </mesh>

      {/* Era-specific front panel */}
      <CounterPanel kind={era.counterTech} accentColor={f.accentColor} />

      {/* Counter technology */}
      <CounterTech kind={era.counterTech} position={[1.5, 1.19, -0.3]} />

      {/* Cake dome */}
      <mesh position={[-1.5, 1.35, -0.2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.3, 16]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.25}
          roughness={0.05}
          transmission={0.9}
          thickness={0.3}
        />
      </mesh>
      <mesh position={[-1.5, 1.28, -0.2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.5} />
      </mesh>

      {/* Tip jar */}
      <mesh position={[-0.8, 1.32, -0.3]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 16]} />
        <meshPhysicalMaterial
          color="#aaffcc"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.85}
          thickness={0.2}
        />
      </mesh>

      {/* Napkin holder */}
      <mesh position={[0.5, 1.25, -0.4]} castShadow>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CounterPanel({
  kind,
  accentColor,
}: {
  kind: CounterTechKind;
  accentColor: string;
}) {
  // Era-specific front detailing
  if (kind === 'cash-box' || kind === 'mechanical-till') {
    // Beaded / paneled wood front
    return (
      <group position={[0, 0.55, 0.61]}>
        <mesh>
          <boxGeometry args={[4.8, 0.8, 0.02]} />
          <meshStandardMaterial color={accentColor} roughness={0.7} />
        </mesh>
        {/* Vertical panels */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-2 + i * 1, 0, 0.01]}>
            <boxGeometry args={[0.8, 0.7, 0.01]} />
            <meshStandardMaterial color="#2a1a0e" roughness={0.6} />
          </mesh>
        ))}
      </group>
    );
  }

  if (kind === 'electronic-register' || kind === 'touchscreen-pos') {
    return (
      <group position={[0, 0.55, 0.61]}>
        {/* Laminate front */}
        <mesh>
          <boxGeometry args={[4.8, 0.9, 0.02]} />
          <meshStandardMaterial color="#8B6B4A" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    );
  }

  // Modern / future: minimalist
  return (
    <group position={[0, 0.55, 0.61]}>
      <mesh>
        <boxGeometry args={[4.8, 0.9, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* LED strip accent */}
      <mesh position={[0, 0.3, 0.01]}>
        <boxGeometry args={[4.6, 0.03, 0.01]} />
        <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function CounterTech({
  kind,
  position,
}: {
  kind: CounterTechKind;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {kind === 'cash-box' && (
        <>
          {/* Wooden cash box */}
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.25, 0.3]} />
            <meshStandardMaterial color="#5A3A1A" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <boxGeometry args={[0.42, 0.02, 0.32]} />
            <meshStandardMaterial color="#3a2a18" roughness={0.6} />
          </mesh>
        </>
      )}

      {kind === 'mechanical-till' && (
        <>
          {/* Mechanical cash register */}
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.4, 0.35]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Keys */}
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 4 }).map((_, col) => (
              <mesh
                key={`${row}-${col}`}
                position={[-0.18 + col * 0.12, 0.22 - row * 0.08, 0.15]}
              >
                <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
              </mesh>
            )),
          )}
          {/* Display flag */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.05]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
        </>
      )}

      {kind === 'electronic-register' && (
        <>
          {/* Electronic register with LED display */}
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.35, 0.35]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
          </mesh>
          {/* Green LED display */}
          <mesh position={[0, 0.1, 0.18]}>
            <boxGeometry args={[0.25, 0.08, 0.01]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={1.5} />
          </mesh>
          {/* Keypad */}
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 3 }).map((_, col) => (
              <mesh
                key={`${row}-${col}`}
                position={[-0.1 + col * 0.1, -0.05 - row * 0.06, 0.18]}
              >
                <boxGeometry args={[0.06, 0.04, 0.02]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
            )),
          )}
        </>
      )}

      {kind === 'touchscreen-pos' && (
        <>
          {/* Touchscreen POS */}
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.25, 0.1]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          {/* Screen on angled mount */}
          <mesh position={[0, 0.15, 0]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.3, 0.22, 0.02]} />
            <meshStandardMaterial
              color="#2a4a7a"
              emissive="#4a7abf"
              emissiveIntensity={0.6}
            />
          </mesh>
          {/* Base */}
          <mesh position={[0, -0.15, 0.05]}>
            <cylinderGeometry args={[0.06, 0.08, 0.1, 12]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </>
      )}

      {kind === 'tablet-pos' && (
        <>
          {/* Tablet on stand */}
          <mesh position={[0, 0.12, 0]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.25, 0.35, 0.015]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </mesh>
          {/* Screen */}
          <mesh position={[0, 0.12, 0.01]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.22, 0.3, 0.005]} />
            <meshStandardMaterial color="#2a2a2a" emissive="#7CB342" emissiveIntensity={0.4} />
          </mesh>
          {/* Stand */}
          <mesh position={[0, -0.1, 0.05]}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
          </mesh>
        </>
      )}

      {kind === 'holographic-nfc' && (
        <>
          {/* Holographic NFC pad — glowing disc */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.2, 32]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={2}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Holographic projection */}
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.08, 0.5, 8, 1, true]} />
            <meshStandardMaterial
              color="#7C4DFF"
              emissive="#7C4DFF"
              emissiveIntensity={1.5}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Base ring */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.22, 32]} />
            <meshStandardMaterial color="#7C4DFF" emissive="#7C4DFF" emissiveIntensity={1} />
          </mesh>
        </>
      )}
    </group>
  );
}
