import * as THREE from 'three';
import { ERA_MAP } from '../data/eras';
import type { EraId, Vec3Tuple } from '../types';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  /** Current orbit target. */
  target: THREE.Vector3;
  /** The DOM element used for pointer input. */
  domElement: HTMLElement;
  dispose: () => void;
  /** Called from the RAF loop with dt in seconds. */
  update: (dt: number) => void;
  /** Smoothly fly the camera to a preset. */
  flyTo: (position: Vec3Tuple, target: Vec3Tuple, duration?: number) => void;
  /** Reset to the overview preset for the current era. */
  reset: (era: EraId) => void;
  isAnimating: () => boolean;
  onUserInteract: (cb: () => void) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Orbit camera controller with damping, zoom, pan, and preset fly-to.
 * Operates directly on the PerspectiveCamera supplied by the R3F canvas.
 * Left-drag orbits, wheel zooms, right-drag or two-finger pans.
 */
export function createCameraRig(
  domElement: HTMLElement,
  era: EraId,
  camera: THREE.PerspectiveCamera,
): CameraRig {
  const start = ERA_MAP[era].presets.overview;
  camera.position.set(start.x, start.y, start.z);

  const target = new THREE.Vector3(0, 1.1, 0);
  const spherical = new THREE.Spherical().setFromVector3(
    camera.position.clone().sub(target),
  );

  const minRadius = 1.1;
  const maxRadius = 18;

  let phi = spherical.phi;
  let theta = spherical.theta;
  let radius = spherical.radius;
  let targetPhi = phi;
  let targetTheta = theta;
  let targetRadius = radius;

  const panOffset = new THREE.Vector3(0, 0, 0);
  const panTarget = new THREE.Vector3(0, 0, 0);

  let animating = false;
  const animFrom = new THREE.Vector3();
  const animTo = new THREE.Vector3();
  const animTargetFrom = new THREE.Vector3();
  const animTargetTo = new THREE.Vector3();
  let animTime = 0;
  let animDuration = 1;

  let panning = false;
  let lastX = 0;
  let lastY = 0;
  let pointerDown = false;
  let userInteracted = false;
  let interactCb: (() => void) | null = null;

  const onPointerDown = (e: PointerEvent) => {
    pointerDown = true;
    panning = e.button === 2 || e.ctrlKey || e.metaKey;
    lastX = e.clientX;
    lastY = e.clientY;
    domElement.setPointerCapture(e.pointerId);
    if (!userInteracted && interactCb) {
      userInteracted = true;
      interactCb();
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (panning) {
      const scale = radius * 0.0016;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      panTarget.add(right.multiplyScalar(-dx * scale));
      panTarget.add(up.multiplyScalar(dy * scale));
    } else {
      targetTheta -= dx * 0.005;
      targetPhi = clamp(targetPhi - dy * 0.005, 0.15, Math.PI - 0.15);
    }
    if (!userInteracted && interactCb) {
      userInteracted = true;
      interactCb();
    }
  };

  const onPointerUp = () => {
    pointerDown = false;
    panning = false;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    targetRadius = clamp(targetRadius * (1 + e.deltaY * 0.001), minRadius, maxRadius);
    if (!userInteracted && interactCb) {
      userInteracted = true;
      interactCb();
    }
  };

  const onContextMenu = (e: Event) => e.preventDefault();

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('pointercancel', onPointerUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('contextmenu', onContextMenu);

  const ease = (t: number) => t * t * (3 - 2 * t);

  const update = (dt: number) => {
    if (animating) {
      animTime += dt;
      const t = ease(clamp(animTime / animDuration, 0, 1));
      camera.position.lerpVectors(animFrom, animTo, t);
      target.lerpVectors(animTargetFrom, animTargetTo, t);
      if (t >= 1) {
        animating = false;
        // sync orbit params with the final pose
        const diff = camera.position.clone().sub(target);
        spherical.setFromVector3(diff);
        phi = spherical.phi;
        theta = spherical.theta;
        radius = spherical.radius;
        targetPhi = phi;
        targetTheta = theta;
        targetRadius = radius;
      }
      return;
    }

    // damped orbit
    const k = 1 - Math.pow(0.0001, dt);
    phi += (targetPhi - phi) * k;
    theta += (targetTheta - theta) * k;
    radius += (targetRadius - radius) * k;
    panOffset.lerp(panTarget, k);

    spherical.phi = phi;
    spherical.theta = theta;
    spherical.radius = radius;
    camera.position.setFromSpherical(spherical).add(target).add(panOffset);
    camera.lookAt(target.clone().add(panOffset));
  };

  const flyTo = (position: Vec3Tuple, targetPos: Vec3Tuple, duration = 1.4) => {
    animFrom.copy(camera.position);
    animTo.set(position.x, position.y, position.z);
    animTargetFrom.copy(target);
    animTargetTo.set(targetPos.x, targetPos.y, targetPos.z);
    animTime = 0;
    animDuration = duration;
    animating = true;
  };

  const reset = (nextEra: EraId) => {
    const preset = ERA_MAP[nextEra].presets.overview;
    flyTo(preset, { x: 0, y: 1.1, z: 0 }, 1.2);
  };

  const dispose = () => {
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('pointerup', onPointerUp);
    domElement.removeEventListener('pointercancel', onPointerUp);
    domElement.removeEventListener('wheel', onWheel);
    domElement.removeEventListener('contextmenu', onContextMenu);
  };

  return {
    camera,
    target,
    domElement,
    dispose,
    update,
    flyTo,
    reset,
    isAnimating: () => animating,
    onUserInteract: (cb) => {
      interactCb = cb;
    },
  };
}
