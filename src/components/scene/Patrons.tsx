import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';
import type { PatronLook } from '../../data/eras';

/**
 * Seated/standing patrons built from primitives (capsule body, sphere head,
 * simple limbs), with era-specific clothing palette, hairstyle, and gadget.
 * Idle animation: head sway, sipping coffee.
 */
export function Patrons() {
  const era = useEraAssets();

  // Patron positions — seated at tables, standing at counter
  const positions: Array<{
    pos: [number, number, number];
    rot: number;
    seated: boolean;
  }> = useMemo(
    () => [
      { pos: [-4, 0, 2.85], rot: Math.PI, seated: true }, // At table 0
      { pos: [-3.5, 0, 1.5], rot: 0, seated: true }, // At table 0 (opposite side)
      { pos: [2, 0, 3.0], rot: -0.3, seated: true }, // Near counter
    ],
    [],
  );

  return (
    <group>
      {era.patrons.map((look, i) => {
        const p = positions[i % positions.length]!;
        return (
          <Patron
            key={`${era.id}-patron-${i}`}
            look={look}
            position={p.pos}
            rotationY={p.rot}
            seated={p.seated}
            phase={i * 1.7}
          />
        );
      })}
    </group>
  );
}

function Patron({
  look,
  position,
  rotationY,
  seated,
  phase,
}: {
  look: PatronLook;
  position: [number, number, number];
  rotationY: number;
  seated: boolean;
  phase: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  // Seated height offset (lower)
  const baseY = seated ? 0.45 : 0;

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase;
    // Head sway
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
      headRef.current.rotation.z = Math.sin(t * 0.3) * 0.05;
    }
    // Arm sipping animation (raises cup to mouth periodically)
    if (armRef.current) {
      const sipCycle = (Math.sin(t * 0.4) + 1) / 2; // 0..1
      armRef.current.rotation.x = -0.3 - sipCycle * 1.2;
    }
    // Subtle breathing
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + baseY + Math.sin(t * 1.5) * 0.005;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} rotation={[0, rotationY, 0]}>
      {/* Torso */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.3, 4, 12]} />
        <meshStandardMaterial color={look.outfit[0]} roughness={0.7} />
      </mesh>

      {/* Lower body / hips */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.15, 4, 12]} />
        <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 0.75, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={look.skin} roughness={0.6} />
        </mesh>
        {/* Hair */}
        <Hair style={look.hairstyle} color={look.hairColor} />
        {/* Face details */}
        <FaceDetails skin={look.skin} />
      </group>

      {/* Arms */}
      {/* Left arm (resting) */}
      <mesh position={[-0.2, 0.45, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
        <meshStandardMaterial color={look.outfit[0]} roughness={0.7} />
      </mesh>
      {/* Right arm (sipping — animated) */}
      <group ref={armRef} position={[0.2, 0.55, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.05, 0.25, 4, 8]} />
          <meshStandardMaterial color={look.outfit[0]} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.27, 0.05]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={look.skin} roughness={0.6} />
        </mesh>
        {/* Cup in hand */}
        <mesh position={[0, -0.28, 0.1]}>
          <cylinderGeometry args={[0.035, 0.03, 0.05, 12]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.3} />
        </mesh>
      </group>

      {/* Legs (if seated, bent; if standing, straight) */}
      {seated ? (
        <>
          {/* Thighs (horizontal) */}
          <mesh position={[-0.08, 0.08, 0.12]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
            <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
          </mesh>
          <mesh position={[0.08, 0.08, 0.12]} rotation={[Math.PI / 2.2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
            <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
          </mesh>
          {/* Shins (vertical) */}
          <mesh position={[-0.08, -0.05, 0.25]} castShadow>
            <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
          </mesh>
          <mesh position={[0.08, -0.05, 0.25]} castShadow>
            <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
            <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
          </mesh>
          {/* Shoes */}
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, -0.17, 0.28]} castShadow>
              <boxGeometry args={[0.08, 0.05, 0.15]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* Standing legs */}
          {[-0.08, 0.08].map((x) => (
            <group key={x}>
              <mesh position={[x, -0.02, 0]} castShadow>
                <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
                <meshStandardMaterial color={look.outfit[1]} roughness={0.7} />
              </mesh>
              <mesh position={[x, -0.22, 0.05]} castShadow>
                <boxGeometry args={[0.08, 0.05, 0.18]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Gadget */}
      <Gadget gadget={look.gadget} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Hairstyles — procedural geometry per style
// ---------------------------------------------------------------------------

function Hair({ style, color }: { style: PatronLook['hairstyle']; color: string }) {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    [color],
  );

  switch (style) {
    case 'victory-rolls':
      return (
        <group>
          {/* Base hair cap */}
          <mesh position={[0, 0.02, -0.01]} material={mat}>
            <sphereGeometry args={[0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          </mesh>
          {/* Victory rolls — two side curls */}
          <mesh position={[-0.1, 0.1, 0]} material={mat}>
            <torusGeometry args={[0.04, 0.03, 8, 16, Math.PI * 1.5]} />
          </mesh>
          <mesh position={[0.1, 0.1, 0]} material={mat}>
            <torusGeometry args={[0.04, 0.03, 8, 16, Math.PI * 1.5]} />
          </mesh>
        </group>
      );

    case 'bouffant':
      return (
        <group>
          {/* Large puffy hair */}
          <mesh position={[0, 0.05, -0.01]} material={mat}>
            <sphereGeometry args={[0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
          </mesh>
          <mesh position={[0, 0.12, -0.05]} material={mat}>
            <sphereGeometry args={[0.1, 16, 16]} />
          </mesh>
        </group>
      );

    case 'mullet':
      return (
        <group>
          {/* Short on top, long in back */}
          <mesh position={[0, 0.03, -0.01]} material={mat}>
            <sphereGeometry args={[0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          </mesh>
          {/* Long back section */}
          <mesh position={[0, -0.05, -0.1]} material={mat}>
            <boxGeometry args={[0.16, 0.2, 0.06]} />
          </mesh>
        </group>
      );

    case 'frosted-tips':
      return (
        <group>
          <mesh position={[0, 0.03, -0.01]} material={mat}>
            <sphereGeometry args={[0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          </mesh>
          {/* Spiky tips — lighter colour */}
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.1, 0.08, 6]} />
            <meshStandardMaterial color="#d4c4a0" roughness={0.7} />
          </mesh>
          {[
            [-0.08, 0.1, 0.05],
            [0.08, 0.1, 0.05],
            [0, 0.12, -0.05],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <coneGeometry args={[0.03, 0.06, 5]} />
              <meshStandardMaterial color="#d4c4a0" roughness={0.7} />
            </mesh>
          ))}
        </group>
      );

    case 'undercut':
      return (
        <group>
          {/* Tight on sides, longer on top */}
          <mesh position={[0, 0.04, 0]} material={mat}>
            <sphereGeometry args={[0.125, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
          </mesh>
          {/* Swept top */}
          <mesh position={[0, 0.1, 0.02]} rotation={[0.2, 0, 0]} material={mat}>
            <boxGeometry args={[0.14, 0.06, 0.12]} />
          </mesh>
        </group>
      );

    case 'chrome-visor':
      return (
        <group>
          {/* Sleek chrome cap */}
          <mesh position={[0, 0.03, -0.01]}>
            <sphereGeometry args={[0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Visor — glowing strip across eyes */}
          <mesh position={[0, 0.0, 0.1]}>
            <boxGeometry args={[0.18, 0.04, 0.03]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={2}
              metalness={0.5}
            />
          </mesh>
        </group>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Face details
// ---------------------------------------------------------------------------

function FaceDetails({ skin }: { skin: string }) {
  return (
    <group>
      {/* Eyes */}
      <mesh position={[-0.04, 0.0, 0.1]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.04, 0.0, 0.1]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, -0.05, 0.1]}>
        <boxGeometry args={[0.04, 0.008, 0.005]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Gadgets — held props
// ---------------------------------------------------------------------------

function Gadget({ gadget }: { gadget: PatronLook['gadget'] }) {
  switch (gadget) {
    case 'newspaper':
      return (
        <group position={[-0.25, 0.4, 0.1]} rotation={[0.3, 0, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.3, 0.005]} />
            <meshStandardMaterial color="#f0ead6" roughness={0.7} />
          </mesh>
          {/* Newsprint lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[0, 0.1 - i * 0.03, 0.003]}>
              <boxGeometry args={[0.2, 0.008, 0.001]} />
              <meshStandardMaterial color="#999" />
            </mesh>
          ))}
        </group>
      );

    case 'transistor-radio':
      return (
        <group position={[-0.25, 0.4, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.07, 0.04]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
          {/* Speaker grille */}
          <mesh position={[0, 0, 0.021]}>
            <circleGeometry args={[0.025, 16]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.6} />
          </mesh>
          {/* Dial */}
          <mesh position={[0.035, 0.015, 0.021]}>
            <circleGeometry args={[0.015, 12]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );

    case 'walkman':
      return (
        <group position={[-0.25, 0.4, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[0.11, 0.07, 0.025]} />
            <meshStandardMaterial color="#2a4a8a" roughness={0.5} />
          </mesh>
          {/* Cassette window */}
          <mesh position={[0, 0.01, 0.013]}>
            <boxGeometry args={[0.06, 0.03, 0.005]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.5} />
          </mesh>
          {/* Headphones */}
          <mesh position={[0, 0.1, 0]}>
            <torusGeometry args={[0.08, 0.008, 8, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      );

    case 'smartphone':
      return (
        <group position={[-0.22, 0.38, 0.08]} rotation={[-0.5, 0, 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.15, 0.008]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Screen */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.07, 0.13]} />
            <meshStandardMaterial color="#0a0a0a" emissive="#4a7abf" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );

    case 'neural-band':
      return (
        <group position={[0, 0.78, 0]}>
          {/* Band around forehead */}
          <mesh position={[0, 0, 0.1]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.11, 0.015, 8, 24, Math.PI]} />
            <meshStandardMaterial
              color="#7C4DFF"
              emissive="#7C4DFF"
              emissiveIntensity={1.5}
              metalness={0.5}
            />
          </mesh>
          {/* Center node */}
          <mesh position={[0, 0.02, 0.12]}>
            <sphereGeometry args={[0.02, 12, 12]} />
            <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={2} />
          </mesh>
        </group>
      );

    case 'none':
    default:
      return null;
  }
}
