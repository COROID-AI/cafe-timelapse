import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { mixPaletteSlot, transitionState } from "../TransitionController";

/**
 * Architectural shell. All surface colours blend continuously between
 * eras inside useFrame (no React re-renders). Walls are single-sided,
 * so orbiting outside the shell keeps the interior visible dollhouse-style.
 */

const ROOM_W = 16;
const ROOM_D = 12;
const ROOM_H = 4.1;

const WINDOW_SLOTS = [-3.4, -0.6, 2.2] as const;
const BULB_SLOTS: ReadonlyArray<[number, number]> = [
  [-3.2, 1.6],
  [0.6, -0.8],
  [5.5, -0.6],
];

export default function Room() {
  const floorMat = useRef<THREE.MeshStandardMaterial>(null);
  const backWallMat = useRef<THREE.MeshStandardMaterial>(null);
  const sideWallMat = useRef<THREE.MeshStandardMaterial>(null);
  const trimMat = useRef<THREE.MeshStandardMaterial>(null);
  const ceilingMat = useRef<THREE.MeshStandardMaterial>(null);
  const rugMat = useRef<THREE.MeshStandardMaterial>(null);
  const doorMat = useRef<THREE.MeshStandardMaterial>(null);
  const windowGlowMat = useRef<THREE.MeshStandardMaterial>(null);
  const bulbMat = useRef<THREE.MeshStandardMaterial>(null);

  const scratch = useRef(new THREE.Color()).current;

  useFrame(() => {
    if (floorMat.current) mixPaletteSlot("floor", floorMat.current.color);
    if (backWallMat.current) mixPaletteSlot("wall", backWallMat.current.color);
    if (sideWallMat.current) mixPaletteSlot("wallSecondary", sideWallMat.current.color);
    if (trimMat.current) mixPaletteSlot("wood", trimMat.current.color);
    if (ceilingMat.current) mixPaletteSlot("ceiling", ceilingMat.current.color);

    // Rug follows the era accent, pulled toward the floor tone.
    if (rugMat.current) {
      mixPaletteSlot("accent", rugMat.current.color);
      mixPaletteSlot("floor", scratch);
      rugMat.current.color.lerp(scratch, 0.35);
      rugMat.current.color.multiplyScalar(0.85);
    }
    if (doorMat.current) mixPaletteSlot("wood", doorMat.current.color);

    const cfgA = ERA_CONFIGS[ERA_YEARS[transitionState.from]].lighting;
    const cfgB = ERA_CONFIGS[ERA_YEARS[transitionState.to]].lighting;
    const { t } = transitionState;
    if (bulbMat.current) {
      bulbMat.current.emissive.set(cfgA.bulbColor).lerp(scratch.set(cfgB.bulbColor), t);
      bulbMat.current.emissiveIntensity = 1.5;
    }
    if (windowGlowMat.current) {
      windowGlowMat.current.emissive.set(cfgA.color).lerp(scratch.set(cfgB.color), t);
      windowGlowMat.current.emissiveIntensity = 0.8;
    }
  });

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial ref={floorMat} color="#3a2d20" roughness={0.82} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial ref={ceilingMat} color="#efe6cf" roughness={0.95} />
      </mesh>

      {/* Back wall (faces +z) */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
        <meshStandardMaterial ref={backWallMat} color="#8a7a5c" roughness={0.9} />
      </mesh>

      {/* Side walls face inward */}
      <mesh position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial ref={sideWallMat} color="#6e6248" roughness={0.9} />
      </mesh>
      <mesh position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_D, ROOM_H]} />
        <meshStandardMaterial color="#5d5340" roughness={0.9} />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, 0.09, -ROOM_D / 2 + 0.03]}>
        <boxGeometry args={[ROOM_W, 0.18, 0.06]} />
        <meshStandardMaterial ref={trimMat} color="#4a3728" roughness={0.7} />
      </mesh>
      <mesh position={[-ROOM_W / 2 + 0.03, 0.09, 0]}>
        <boxGeometry args={[0.06, 0.18, ROOM_D]} />
        <meshStandardMaterial color="#4a3728" roughness={0.7} />
      </mesh>

      {/* Rug under the seating cluster */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.0, 0.01, 1.0]} receiveShadow>
        <planeGeometry args={[5.4, 4.2]} />
        <meshStandardMaterial ref={rugMat} color="#7a4a3a" roughness={1} />
      </mesh>

      {/* Street door, back-left corner */}
      <group position={[-6.4, 0, -ROOM_D / 2 + 0.05]}>
        <mesh position={[0, 1.28, 0]}>
          <boxGeometry args={[1.15, 2.56, 0.09]} />
          <meshStandardMaterial ref={doorMat} color="#4a3728" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.32, 0.06]}>
          <boxGeometry args={[0.95, 2.36, 0.02]} />
          <meshStandardMaterial color="#3a2b1e" roughness={0.7} />
        </mesh>
        <mesh position={[0.42, 1.25, 0.08]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#c8a24a" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Windows on the left wall with era-mood daylight */}
      {WINDOW_SLOTS.map((z) => (
        <group key={z} position={[-ROOM_W / 2 + 0.06, 2.15, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <planeGeometry args={[1.9, 1.35]} />
            <meshStandardMaterial
              ref={windowGlowMat}
              color="#dfe9f3"
              emissive="#ffe9c9"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[0, 0.72, 0.02]}>
            <boxGeometry args={[2.06, 0.1, 0.06]} />
            <meshStandardMaterial color="#3f3226" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.72, 0.02]}>
            <boxGeometry args={[2.06, 0.1, 0.06]} />
            <meshStandardMaterial color="#3f3226" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.07, 1.44, 0.06]} />
            <meshStandardMaterial color="#3f3226" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Pendant bulbs over tables & counter (emissive spheres + cords) */}
      {BULB_SLOTS.map(([x, z], i) => (
        <group key={`${x}:${z}`} position={[x, 0, z]}>
          <mesh position={[0, ROOM_H - 0.28, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.56, 6]} />
            <meshStandardMaterial color="#22201c" roughness={0.8} />
          </mesh>
          <mesh position={[0, ROOM_H - 0.62, 0]}>
            <sphereGeometry args={[0.075, 14, 14]} />
            {i === 0 ? (
              <meshStandardMaterial
                ref={bulbMat}
                color="#fff8e0"
                emissive="#ffe9b8"
                emissiveIntensity={1.5}
              />
            ) : (
              <meshStandardMaterial color="#fff8e0" emissive="#ffe9b8" emissiveIntensity={1.5} />
            )}
          </mesh>
          <mesh position={[0, ROOM_H - 0.52, 0]}>
            <coneGeometry args={[0.16, 0.14, 16, 1, true]} />
            <meshStandardMaterial
              color="#2c2620"
              roughness={0.55}
              metalness={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
