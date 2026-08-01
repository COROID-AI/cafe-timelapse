import { useEffect, useRef } from 'react';
import type { ElementRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const CAMERA_MIN_DISTANCE = 0.6;
export const CAMERA_MAX_DISTANCE = 10;
export const CAMERA_MIN_POLAR = 0.12; // stay above the floor
export const CAMERA_MAX_POLAR = Math.PI / 2 - 0.06; // never go under the floor

const ROOM_HALF_W = 4.2;
const ROOM_HALF_D = 3.2;
const FLOOR_Y = 0.12;
const CEILING_Y = 3.45;

const WALK_SPEED = 0.06;

type OrbitControlsRef = ElementRef<typeof OrbitControls>;

interface CameraControlsProps {
  walkMode: boolean;
  resetSignal: number;
}

/** Clamp the camera to the interior of the room (above floor, below ceiling). */
function clampCameraToRoom(camera: THREE.Camera): void {
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM_HALF_W, ROOM_HALF_W);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM_HALF_D, ROOM_HALF_D);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, FLOOR_Y, CEILING_Y);
}

/** Walk-mode translation from WASD + Space/Shift key state. */
function applyWalk(camera: THREE.Camera, keys: Record<string, boolean>): void {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
  const fwd = new THREE.Vector3(dir.x, 0, dir.z).normalize();
  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(fwd);
  if (keys['KeyS']) move.sub(fwd);
  if (keys['KeyA']) move.sub(right);
  if (keys['KeyD']) move.add(right);
  if (keys['Space']) move.y += 1;
  if (keys['ShiftLeft'] || keys['ShiftRight']) move.y -= 1;
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(WALK_SPEED);
    camera.position.add(move);
  }
}

/**
 * Navigation controls: orbit/pan/zoom with bounds that keep the camera
 * inside the room and above the floor, a deterministic reset view
 * (triggered by resetSignal), and an optional walk mode (WASD + Space/Shift
 * translation while orbiting stays on).
 */
export function CameraControls({ walkMode, resetSignal }: CameraControlsProps) {
  const controlsRef = useRef<OrbitControlsRef>(null);
  const keys = useRef<Record<string, boolean>>({});
  const { camera } = useThree();

  // Keyboard state for walk mode.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Deterministic reset view.
  useEffect(() => {
    if (resetSignal > 0) {
      const c = controlsRef.current;
      if (c) {
        c.object.position.set(0, 1.7, 4.2);
        c.target.set(0, 1.1, -0.5);
        c.update();
      }
    }
  }, [resetSignal]);

  // Enforce room bounds every frame; walk-mode translation.
  useFrame(() => {
    if (walkMode) {
      applyWalk(camera, keys.current);
    }
    clampCameraToRoom(camera);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={CAMERA_MIN_DISTANCE}
      maxDistance={CAMERA_MAX_DISTANCE}
      minPolarAngle={CAMERA_MIN_POLAR}
      maxPolarAngle={CAMERA_MAX_POLAR}
      maxAzimuthAngle={Math.PI / 2 - 0.05}
      minAzimuthAngle={-Math.PI / 2 + 0.05}
      enablePan
      panSpeed={0.7}
    />
  );
}
