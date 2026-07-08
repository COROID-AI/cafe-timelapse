import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * First-person walk controls: WASD to move, mouse-look via PointerLockControls.
 * Press ESC to release the pointer (handled by PointerLockControls).
 * Press R to reset to orbit position.
 */
export function WalkControls() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());

  useEffect(() => {
    // Set initial walk position
    camera.position.set(0, 1.7, 6);
    camera.rotation.set(0, 0, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      // R resets position
      if (e.code === 'KeyR') {
        camera.position.set(0, 1.7, 6);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = 4;

    // Build movement vector from WASD in camera-local space
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (keys.current['KeyW'] || keys.current['ArrowUp']) move.add(forward);
    if (keys.current['KeyS'] || keys.current['ArrowDown']) move.sub(forward);
    if (keys.current['KeyD'] || keys.current['ArrowRight']) move.add(right);
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
    }

    // Smooth velocity
    velocity.current.lerp(move, 0.2);
    camera.position.add(velocity.current);

    // Clamp to café bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7, 7);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -7, 7);
    camera.position.y = 1.7; // Fixed eye height
  });

  return null;
}
