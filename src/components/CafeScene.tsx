import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildCafeScene } from '../three/scene';
import { createCameraRig } from '../three/camera';
import { lerpPalettes, continuousBlend, stepTransition } from '../three/transition';
import { ERA_MAP } from '../data/eras';
import { useStore } from '../store/useStore';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';

/**
 * Imperative café scene mounted inside a React Three Fiber canvas.
 * The heavy geometry is built once; per-frame updates only touch
 * colors, lights, fog, and the era decor visibility.
 */
export function CafeScene() {
  const era = useStore((s) => s.era);
  const transition = useStore((s) => s.transition);
  const targetEra = useStore((s) => s.targetEra);
  const cameraPreset = useStore((s) => s.cameraPreset);
  const presetNonce = useStore((s) => s.presetNonce);
  const cameraAnimState = useStore((s) => s.cameraAnimState);
  const setCameraAnimState = useStore((s) => s.setCameraAnimState);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const paused = useStore((s) => s.paused);

  const { gl, camera, size, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;

  const sceneRef = useRef<ReturnType<typeof buildCafeScene> | null>(null);
  const rigRef = useRef<ReturnType<typeof createCameraRig> | null>(null);
  const lastDecorSwap = useRef(era);

  // Build the scene once
  if (!sceneRef.current) {
    sceneRef.current = buildCafeScene(era);
    scene.add(sceneRef.current.group);
    scene.fog = sceneRef.current.fog;
  }

  // TEMP DEBUG: runtime patron diagnostics
  if (typeof window !== 'undefined') {
    const s = sceneRef.current;
    let patronFigures = 0;
    let patronMeshes = 0;
    s.group.traverse((o) => {
      if ((o as THREE.Object3D).name === 'Patron') patronFigures++;
      if ((o as THREE.Mesh).isMesh) patronMeshes++;
    });
    // eslint-disable-next-line no-console
    console.log(
      `[DEBUG] era=${s.currentEra} currentEraVisible=${s.patrons.get(s.currentEra)?.visible} ` +
        `patronFigures=${patronFigures} totalMeshes=${patronMeshes} camera=${cam.position.x.toFixed(2)},${cam.position.y.toFixed(2)},${cam.position.z.toFixed(2)}`,
    );
  }

  // Camera rig once (operates on the R3F camera directly)
  if (!rigRef.current) {
    rigRef.current = createCameraRig(gl.domElement, era, cam);
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  }

  // Handle size changes
  useEffect(() => {
    cam.aspect = size.width / size.height;
    cam.updateProjectionMatrix();
  }, [cam, size.width, size.height]);

  // Trigger preset fly-to
  useEffect(() => {
    if (!rigRef.current || !cameraPreset) return;
    const preset = ERA_MAP[targetEra].presets[cameraPreset];
    rigRef.current.flyTo(preset, { x: 0, y: 1.1, z: 0 }, 1.3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetNonce, cameraPreset, targetEra]);

  // Camera animation state
  useEffect(() => {
    if (cameraAnimState === 'animating') {
      const check = () => {
        if (rigRef.current && !rigRef.current.isAnimating()) {
          setCameraAnimState('done');
        } else {
          requestAnimationFrame(check);
        }
      };
      const raf = requestAnimationFrame(check);
      return () => cancelAnimationFrame(raf);
    }
  }, [cameraAnimState, setCameraAnimState]);

  // Bloom intensity follows the blended palette during cross-fades
  const bloomIntensity = useMemo(() => {
    if (transition.phase === 'fading') {
      const blend = continuousBlend(transition.progress);
      const from = ERA_MAP[transition.fromEra].palette.bloom;
      const to = ERA_MAP[transition.toEra].palette.bloom;
      return from + (to - from) * blend;
    }
    return ERA_MAP[era].palette.bloom;
  }, [transition, era]);

  // Update loop
  useFrame((_, delta) => {
    const sceneObj = sceneRef.current;
    const rig = rigRef.current;
    if (!sceneObj || !rig) return;

    // Clamp delta (tab-switch spikes)
    const dt = Math.min(delta, 0.1);

    // Era cross-fade progression
    const t = useStore.getState().transition;
    if (t.phase === 'fading' && !reducedMotion && !paused) {
      const next = stepTransition(t, dt);
      useStore.setState({ transition: next });
      const blend = continuousBlend(next.progress);
      const fromPalette = ERA_MAP[next.fromEra].palette;
      const toPalette = ERA_MAP[next.toEra].palette;
      const colors = lerpPalettes(fromPalette, toPalette, blend);
      sceneObj.updateColors(colors);

      // Swap discrete decor at the midpoint
      if (next.progress >= 0.5 && lastDecorSwap.current !== next.toEra) {
        sceneObj.showEra(next.toEra);
        lastDecorSwap.current = next.toEra;
      }
      if (next.settled) {
        useStore.getState().completeTransition();
      }
    } else if (t.settled && sceneObj.currentEra !== t.toEra) {
      sceneObj.showEra(t.toEra);
      lastDecorSwap.current = t.toEra;
    }

    rig.update(dt);
  });

  // Cleanup
  useEffect(() => {
    return () => {
      const rig = rigRef.current;
      if (rig) {
        rig.dispose();
        rigRef.current = null;
      }
      const sceneObj = sceneRef.current;
      if (sceneObj) {
        scene.remove(sceneObj.group);
        sceneObj.group.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
          }
        });
        sceneRef.current = null;
      }
    };
  }, [scene]);

  // Post-processing
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Noise opacity={0.015} />
      <Vignette eskil={false} offset={0.18} darkness={0.72} />
    </EffectComposer>
  );
}
