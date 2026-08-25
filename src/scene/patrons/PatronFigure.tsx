import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { dominantEraIndex, transitionState } from "../TransitionController";

/**
 * One stylised café occupant. Outfit colour blends continuously between
 * eras; hairstyle silhouette flips discretely at the blend midpoint
 * (five low-poly variants cover all fifteen era hairstyles); a small
 * gadget slab sits in front of every patron, glowing more in later eras.
 */

type HairVariant = "cap" | "bun" | "tall" | "back" | "ridge";

const HAIR_VARIANT: Record<string, HairVariant> = {
  slick: "cap",
  crop: "cap",
  flattop: "cap",
  moptop: "cap",
  fringe: "cap",
  curly: "cap",
  rolls: "bun",
  beehive: "tall",
  mullet: "back",
  pony: "back",
  shag: "back",
  drift: "back",
  fauxhawk: "ridge",
  crest: "ridge",
  filaments: "ridge",
};

const SKIN_TONES = ["#d9a066", "#c68a5a", "#e8b98a"];
const GADGET_GLOW = [0, 0, 0.35, 0.45, 0.6, 1.1];

interface Props {
  position: [number, number, number];
  rotationY: number;
  patronIndex: number;
  standing?: boolean;
}

export default function PatronFigure({ position, rotationY, patronIndex, standing = false }: Props) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const outfitMat = useRef<THREE.MeshStandardMaterial>(null);
  const gadgetMat = useRef<THREE.MeshStandardMaterial>(null);
  const hairGroups = {
    cap: useRef<THREE.Group>(null),
    bun: useRef<THREE.Group>(null),
    tall: useRef<THREE.Group>(null),
    back: useRef<THREE.Group>(null),
    ridge: useRef<THREE.Group>(null),
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const phase = patronIndex * 1.73 + (standing ? 0 : 0.9);

    if (root.current) {
      root.current.position.y = Math.sin(time * 1.15 + phase) * 0.008;
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(time * 0.6 + phase) * 0.09;
    }

    const fromEra = ERA_YEARS[transitionState.from];
    const toEra = ERA_YEARS[transitionState.to];
    const t = transitionState.t;
    const from = ERA_CONFIGS[fromEra].patrons[patronIndex % 3];
    const to = ERA_CONFIGS[toEra].patrons[patronIndex % 3];

    if (outfitMat.current) {
      outfitMat.current.color.set(from.outfit.color).lerp(new THREE.Color(to.outfit.color), t);
    }

    // Hairstyle flips with the dominant era.
    const active = dominantEraIndex();
    const variant =
      HAIR_VARIANT[ERA_CONFIGS[ERA_YEARS[active]].patrons[patronIndex % 3].hairstyle] ?? "cap";
    for (const key of Object.keys(hairGroups) as Array<keyof typeof hairGroups>) {
      const g = hairGroups[key].current;
      if (g) g.visible = key === variant;
    }

    if (gadgetMat.current) {
      const a = ERA_CONFIGS[fromEra].palette.accent;
      const b = ERA_CONFIGS[toEra].palette.accent;
      gadgetMat.current.color.set(a).lerp(new THREE.Color(b), t);
      gadgetMat.current.emissive.set(a).lerp(new THREE.Color(b), t);
      gadgetMat.current.emissiveIntensity = GADGET_GLOW[active];
    }
  });

  const torsoY = standing ? 1.22 : 1.02;
  const headY = standing ? 1.66 : 1.46;
  const skin = SKIN_TONES[patronIndex % SKIN_TONES.length];

  return (
    <group ref={root} position={position} rotation={[0, rotationY, 0]}>
      {/* Legs (standing figures only; seated ones hide under tables) */}
      {standing &&
        [-0.09, 0.09].map((lx) => (
          <mesh key={lx} position={[lx, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.06, 0.8, 10]} />
            <meshStandardMaterial color="#23201c" roughness={0.8} />
          </mesh>
        ))}

      {/* Torso */}
      <mesh position={[0, torsoY, 0]} castShadow>
        <capsuleGeometry args={[0.17, 0.34, 6, 14]} />
        <meshStandardMaterial ref={outfitMat} color="#3d2b1f" roughness={0.85} />
      </mesh>

      {/* Head + neck */}
      <mesh position={[0, headY - 0.14, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 8]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh ref={head} position={[0, headY, 0]} castShadow>
        <sphereGeometry args={[0.115, 16, 16]} />
        <meshStandardMaterial color={skin} roughness={0.65} />
        {/* Hair sits relative to the head so yaw follows naturally */}
        <group ref={hairGroups.cap}>
          <mesh position={[0, 0.045, 0]} scale={[1.08, 0.72, 1.08]}>
            <sphereGeometry args={[0.115, 14, 12]} />
            <meshStandardMaterial color="#241a12" roughness={0.9} />
          </mesh>
        </group>
        <group ref={hairGroups.bun} visible={false}>
          <mesh position={[0, 0.04, 0]} scale={[1.05, 0.7, 1.05]}>
            <sphereGeometry args={[0.115, 14, 12]} />
            <meshStandardMaterial color="#241a12" roughness={0.9} />
          </mesh>
          {[-0.09, 0.09].map((bx) => (
            <mesh key={bx} position={[bx, 0.06, -0.06]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshStandardMaterial color="#241a12" roughness={0.9} />
            </mesh>
          ))}
        </group>
        <group ref={hairGroups.tall} visible={false}>
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.09, 0.105, 0.22, 12]} />
            <meshStandardMaterial color="#241a12" roughness={0.9} />
          </mesh>
        </group>
        <group ref={hairGroups.back} visible={false}>
          <mesh position={[0, 0.03, 0]} scale={[1.06, 0.75, 1.06]}>
            <sphereGeometry args={[0.115, 14, 12]} />
            <meshStandardMaterial color="#241a12" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.06, -0.1]}>
            <boxGeometry args={[0.16, 0.22, 0.08]} />
            <meshStandardMaterial color="#241a12" roughness={0.9} />
          </mesh>
        </group>
        <group ref={hairGroups.ridge} visible={false}>
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.045, 0.1, 0.2]} />
            <meshStandardMaterial
              color="#37e6ff"
              emissive="#37e6ff"
              emissiveIntensity={0.9}
              roughness={0.4}
            />
          </mesh>
        </group>
      </mesh>

      {/* Gadget slab resting ahead of the patron */}
      <mesh position={[0, standing ? 1.18 : torsoY + 0.06, 0.3]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.13, 0.02, 0.19]} />
        <meshStandardMaterial
          ref={gadgetMat}
          color="#b8862f"
          emissive="#000000"
          emissiveIntensity={0}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
