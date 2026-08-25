import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { transitionState } from "../TransitionController";

/**
 * Tableware clusters on every table. Cup/saucer/plate materials blend
 * continuously between era palettes; the smart-ceramic haptic rim
 * (2055 only) flips visibility at the midpoint.
 */

interface TableSpot {
  x: number;
  z: number;
}

const TABLE_SPOTS: TableSpot[] = [
  { x: -3.2, z: 1.6 },
  { x: -0.4, z: 2.6 },
  { x: -2.4, z: -1.9 },
];

const PLACE_OFFSETS: ReadonlyArray<[number, number]> = [
  [0.16, 0.1],
  [-0.18, -0.08],
  [0.02, -0.2],
];

function dominantIndex(): number {
  return transitionState.progress < 0.5 ? transitionState.from : transitionState.to;
}

export default function Tableware() {
  const cupMat = useRef<THREE.MeshStandardMaterial>(null);
  const saucerMat = useRef<THREE.MeshStandardMaterial>(null);
  const plateMat = useRef<THREE.MeshStandardMaterial>(null);
  const rimMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].tablewareColors;
    const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].tablewareColors;
    const t = transitionState.t;

    if (cupMat.current) {
      cupMat.current.color.set(a.cup).lerp(new THREE.Color(b.cup), t);
      cupMat.current.transparent = false;
      cupMat.current.opacity = 1;
    }
    if (saucerMat.current) {
      saucerMat.current.color.set(a.saucer).lerp(new THREE.Color(b.saucer), t);
    }
    if (plateMat.current) {
      plateMat.current.color.set(a.plate).lerp(new THREE.Color(b.plate), t);
    }

    const active = dominantIndex();
    if (rimMat.current) {
      const glow = active === 5 ? b.rimGlow : null;
      rimMat.current.emissive.set(glow ?? "#000000");
      rimMat.current.emissiveIntensity = glow ? 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.3 : 0;
    }
  });

  return (
    <group>
      {TABLE_SPOTS.map((spot) => (
        <group key={`${spot.x}:${spot.z}`} position={[spot.x, 0.775, spot.z]}>
          {PLACE_OFFSETS.map(([ox, oz], i) => (
            <group key={i} position={[ox, 0, oz]}>
              {/* Saucer */}
              <mesh position={[0, 0.008, 0]}>
                <cylinderGeometry args={[0.085, 0.07, 0.016, 16]} />
                <meshStandardMaterial ref={i === 0 ? saucerMat : undefined} color="#ddd3bd" roughness={0.4} />
              </mesh>
              {/* Cup */}
              <mesh position={[0, 0.055, 0]} castShadow>
                <cylinderGeometry args={[0.042, 0.034, 0.095, 14, 1, true]} />
                <meshStandardMaterial ref={i === 0 ? cupMat : undefined} color="#e8e0d0" roughness={0.35} side={THREE.DoubleSide} />
              </mesh>
              {/* Coffee surface */}
              <mesh position={[0, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.038, 14]} />
                <meshStandardMaterial color="#2a1a10" roughness={0.25} />
              </mesh>
              {/* Plate with pastry-ish dome on first setting */}
              {i === 1 && (
                <>
                  <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.11, 18]} />
                    <meshStandardMaterial ref={plateMat} color="#e8e0d0" roughness={0.4} side={THREE.DoubleSide} />
                  </mesh>
                  <mesh position={[0, 0.035, 0]} castShadow>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <meshStandardMaterial color="#b98a54" roughness={0.7} />
                  </mesh>
                </>
              )}
              {/* Haptic rim — 2055 smart ceramic */}
              {i === 2 && (
                <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.042, 0.004, 8, 20]} />
                  <meshStandardMaterial ref={rimMat} color="#cfe9f2" emissive="#000000" emissiveIntensity={0} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
