import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useEraStore } from "../state/eraStore";

/**
 * Bounded navigation with deterministic preset tweens (plan convention).
 * User interaction cancels any active tween; the orbit target is
 * re-clamped into room bounds every frame so pans can't escape.
 */

const PRESETS = {
  default: {
    pos: new THREE.Vector3(0.5, 3.2, 8.8),
    tgt: new THREE.Vector3(0.2, 1.15, -0.4),
  },
  closeup: {
    pos: new THREE.Vector3(3.35, 1.62, -1.25),
    tgt: new THREE.Vector3(5.55, 1.2, -2.25),
  },
  wide: {
    pos: new THREE.Vector3(-9.5, 5.4, 9.4),
    tgt: new THREE.Vector3(-0.6, 1.1, -0.7),
  },
} as const;

const TARGET_BOUNDS = {
  x: [-5.5, 5.5],
  y: [0.3, 3.2],
  z: [-4.6, 4.6],
} as const;

function clampTarget(v: THREE.Vector3): boolean {
  let changed = false;
  const cl = (val: number, min: number, max: number): number => {
    if (val < min) { changed = true; return min; }
    if (val > max) { changed = true; return max; }
    return val;
  };
  v.set(
    cl(v.x, TARGET_BOUNDS.x[0], TARGET_BOUNDS.x[1]),
    cl(v.y, TARGET_BOUNDS.y[0], TARGET_BOUNDS.y[1]),
    cl(v.z, TARGET_BOUNDS.z[0], TARGET_BOUNDS.z[1]),
  );
  return changed;
}

export default function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const viewPreset = useEraStore((s) => s.viewPreset);
  const tweening = useRef(false);
  const tweenPos = useRef(new THREE.Vector3());
  const tweenTgt = useRef(new THREE.Vector3());
  const { camera } = useThree();

  useEffect(() => {
    const preset = PRESETS[viewPreset];
    tweenPos.current.copy(preset.pos);
    tweenTgt.current.copy(preset.tgt);
    tweening.current = true;
  }, [viewPreset]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return undefined;
    const cancelTween = () => {
      tweening.current = false;
    };
    controls.addEventListener("start", cancelTween);
    return () => controls.removeEventListener("start", cancelTween);
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (tweening.current) {
      const k = 1 - Math.exp(-delta * 4.5);
      camera.position.lerp(tweenPos.current, k);
      controls.target.lerp(tweenTgt.current, k);
      clampTarget(controls.target);
      if (
        camera.position.distanceTo(tweenPos.current) < 0.01 &&
        controls.target.distanceTo(tweenTgt.current) < 0.01
      ) {
        tweening.current = false;
      }
      controls.update();
    } else if (clampTarget(controls.target)) {
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      target={[0.2, 1.15, -0.4]}
      minDistance={1.1}
      maxDistance={13.5}
      minPolarAngle={0.12}
      maxPolarAngle={1.52}
      panSpeed={0.6}
      rotateSpeed={0.85}
      zoomSpeed={0.9}
    />
  );
}
