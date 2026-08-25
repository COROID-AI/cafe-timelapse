import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { transitionState } from "./../TransitionController";

/**
 * Lighting rig: one shadow-casting key light (frame budget, finding
 * d25328b1) plus shadowless fill/pendant/accent lights whose colour and
 * intensity blend between eras. Emissive fixture surfaces live in
 * Room/CafeScene where their meshes are declared.
 */

const ACCENT_COLORS = ["#ffd9a0", "#ff6ec7", "#00ffff", "#fff3d6", "#ffb347", "#22d3ee"];
const ACCENT_INTENSITY = [0.15, 0.35, 0.85, 0.25, 0.4, 1.0];

const scratchA = new THREE.Color();
const scratchB = new THREE.Color();
const mixedColor = new THREE.Color();

export { ACCENT_COLORS, ACCENT_INTENSITY };

export default function LightingRig() {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const pendantARef = useRef<THREE.PointLight>(null);
  const pendantBRef = useRef<THREE.PointLight>(null);
  const accentRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const { from, to, t } = transitionState;
    const cfgA = ERA_CONFIGS[ERA_YEARS[from]].lighting;
    const cfgB = ERA_CONFIGS[ERA_YEARS[to]].lighting;

    const ambient = ambientRef.current;
    if (ambient) {
      ambient.intensity = 0.32 + (cfgA.intensity + cfgB.intensity) * 0.06;
    }

    const key = keyRef.current;
    if (key) {
      key.intensity = 1.1 + t * 0.15;
    }

    mixedColor.copy(scratchA.set(cfgA.color)).lerp(scratchB.set(cfgB.color), t);
    for (const p of [pendantARef.current, pendantBRef.current]) {
      if (p) {
        p.color.copy(mixedColor);
        p.intensity = 0.9 + (cfgA.intensity + cfgB.intensity) * 0.35;
      }
    }

    const hemi = hemiRef.current;
    if (hemi) {
      hemi.intensity = 0.25;
    }

    // Accent (neon / holo) blends smoothly between eras.
    const accentIdxA = from % ACCENT_COLORS.length;
    const accentIdxB = to % ACCENT_COLORS.length;
    const accent = accentRef.current;
    if (accent) {
      accent.color
        .set(ACCENT_COLORS[accentIdxA])
        .lerp(scratchB.set(ACCENT_COLORS[accentIdxB]), t);
      accent.intensity =
        ACCENT_INTENSITY[accentIdxA] * (1 - t) + ACCENT_INTENSITY[accentIdxB] * t;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.4} />
      <hemisphereLight ref={hemiRef} args={["#ffffff", "#33251c", 0.25]} />
      <directionalLight
        ref={keyRef}
        position={[6, 9, 5]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
      />
      <pointLight ref={pendantARef} position={[-2.4, 3.1, 1.4]} distance={9} decay={2} />
      <pointLight ref={pendantBRef} position={[5.4, 3.1, -0.6]} distance={9} decay={2} />
      {/* Era accent fixture: neon strip / holo projector glow */}
      <pointLight
        ref={accentRef}
        position={[0, 3.6, -4.6]}
        distance={14}
        decay={2}
        color={ACCENT_COLORS[0]}
        intensity={ACCENT_INTENSITY[0]}
      />
    </>
  );
}
