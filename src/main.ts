import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

import { CafeScene } from './cafe/CafeScene';
import { EraTransitionController } from './cafe/EraTransitionController';
import { NavigationController } from './cafe/NavigationController';
import type { EraConfig, EraLightingMood, EraYear } from './cafe/types';
import { getEra as getShellEra } from './cafe/eras/getEra';

// All eight detail categories — one register call per category, no internals.
import { registerFurniturePropGroup } from './cafe/props/furniture';
import { registerBrewingEquipment } from './cafe/props/machines';
import { registerMenuPropGroup } from './cafe/props/menu';
import { registerPostersPropGroup } from './cafe/props/posters';
import { registerTablewarePropGroup } from './cafe/props/tableware';
import { registerSignageLighting, SIGNAGE_ERA_MOODS } from './cafe/props/signage';
import { registerCounterTech } from './cafe/props/counter';
import { registerPatronsPropGroup } from './cafe/props/patrons';

import { TimelineSlider } from './ui/TimelineSlider';
import './style.css';

/**
 * Application shell for the Café Time Period Timelapse.
 *
 * Composition order (everything café-specific lives behind the controllers):
 *
 * 1. Render foundation: renderer, scene, camera, presentation pipeline
 *    (MSAA render target → subtle vignette/colour-grade pass → tonemap+sRGB).
 * 2. Animated loading overlay paints while the permanent shell and all eight
 *    prop groups build step-by-step; the first era is applied and one hidden
 *    frame is rendered to warm every shader before the doors "open".
 * 3. Cinematic intro: a slow eased dolly-in from the west doorway to the
 *    seating area. Any input skips it instantly; when it ends (or is skipped)
 *    control hands to the NavigationController, which starts in default orbit
 *    mode.
 * 4. TimelineSlider selections route through EraTransitionController, whose
 *    mid-morph commit drives CafeScene.applyEra across every registered group.
 */

/* ------------------------------------------------------------------------- */
/* Tunables                                                                   */
/* ------------------------------------------------------------------------- */

/** Year shown when the doors open (matches the slider's highlighted stop). */
const INITIAL_YEAR = 2025 as const;

/** Length of the opening doorway→seating dolly-in, in seconds. */
const INTRO_DURATION_SECONDS = 8;

// Intro path: start just inside the west-wall doorway (door centre z = 3.2),
// glide past the counter side and settle on an elevated wide framing of the
// dining area (table anchors span roughly x −3.9…3.85, z −3.75…1.7).
const INTRO_START_POSITION = new THREE.Vector3(-4.85, 1.62, 3.18);
const INTRO_START_LOOK = new THREE.Vector3(1.2, 1.05, -0.8);
const INTRO_CONTROL_POSITION = new THREE.Vector3(-3.55, 2.0, 4.35);
const INTRO_END_POSITION = new THREE.Vector3(-1.55, 2.55, 4.35);
const INTRO_END_LOOK = new THREE.Vector3(0.55, 1.02, -1.25);

/**
 * Subtle finishing grade applied in linear HDR before tone mapping: gentle
 * saturation/contrast around mids, a warm amber lift weighted into the
 * shadows so highlights stay clean, and a soft elliptical lens vignette.
 */
const GRADE_VIGNETTE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 1.06 },
    uContrast: { value: 1.03 },
    uWarmth: { value: 0.03 },
    uVignetteStrength: { value: 0.34 },
    uVignetteRadius: { value: 0.62 },
    uVignetteSoftness: { value: 0.46 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uWarmth;
    uniform float uVignetteStrength;
    uniform float uVignetteRadius;
    uniform float uVignetteSoftness;
    varying vec2 vUv;

    void main() {
      vec4 sampled = texture2D(tDiffuse, vUv);

      float luma = dot(sampled.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 graded = mix(vec3(luma), sampled.rgb, uSaturation);
      graded = (graded - 0.5) * uContrast + 0.5;
      graded += vec3(1.0, 0.74, 0.44) * uWarmth * (1.0 - smoothstep(0.0, 0.9, luma));

      vec2 centred = vUv - 0.5;
      centred.x *= 1.12; // Slightly wider frame weighting.
      float distanceToCentre = length(centred) * 1.4142;
      float vignette = smoothstep(
        uVignetteRadius - uVignetteSoftness,
        uVignetteRadius,
        distanceToCentre
      );
      graded *= 1.0 - vignette * uVignetteStrength;

      gl_FragColor = vec4(max(graded, vec3(0.0)), sampled.a);
    }
  `,
};

/**
 * Scene-wide era moods routed through the neutral shell seam. The prop-group
 * database owns the canonical per-year lighting values (`SIGNAGE_ERA_MOODS`);
 * composing them here gives the EraTransitionController real colour, fog and
 * exposure lerp targets without touching the seam or any prop group.
 */
const MOODS_BY_YEAR = SIGNAGE_ERA_MOODS as Readonly<
  Record<number, EraLightingMood | undefined>
>;

function resolveEra(year: EraYear): EraConfig {
  const shellConfig = getShellEra(year);
  return { ...shellConfig, lighting: MOODS_BY_YEAR[year] ?? {} };
}

/* ------------------------------------------------------------------------- */
/* Render foundation                                                          */
/* ------------------------------------------------------------------------- */

const canvas = document.getElementById('app') as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// r185 renamed the soft-kernel filter to PCFShadowMap; the legacy PCFSoft
// alias logs a deprecation warning on first render, so use the current name.
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15131a);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.05, // Near plane tight enough for close-up prop inspection.
  120,
);
camera.position.copy(INTRO_START_POSITION);
camera.lookAt(INTRO_START_LOOK);

/**
 * Presentation pipeline: multisampled HalfFloat target → render pass → the
 * subtle grade/vignette pass → OutputPass (tone map + sRGB, honouring the
 * exposure the era morph interpolates). Returns null when the pipeline cannot
 * be created, falling back to direct rendering below.
 */
function createPresentationPipeline(): EffectComposer | null {
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const renderTarget = new THREE.WebGLRenderTarget(Math.max(size.x, 1), Math.max(size.y, 1), {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    const composerInstance = new EffectComposer(renderer, renderTarget);
    composerInstance.addPass(new RenderPass(scene, camera));
    composerInstance.addPass(new ShaderPass(GRADE_VIGNETTE_SHADER));
    composerInstance.addPass(new OutputPass());
    composerInstance.setPixelRatio(renderer.getPixelRatio());
    composerInstance.setSize(window.innerWidth, window.innerHeight);
    return composerInstance;
  } catch {
    return null;
  }
}

const composer = createPresentationPipeline();

function renderFrame(deltaTime: number): void {
  if (composer) composer.render(deltaTime);
  else renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  if (composer) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
  }
});

/* ------------------------------------------------------------------------- */
/* Small DOM helpers                                                          */
/* ------------------------------------------------------------------------- */

const nextFrame = (): Promise<void> =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

interface LoadingOverlay {
  /** Sets bar fraction (0..1) and the human-readable build step label. */
  setProgress(fraction: number, label: string): void;
  /** Fades the overlay out; resolves once it is fully hidden. */
  finish(): Promise<void>;
}

function createLoadingOverlay(): LoadingOverlay {
  const root = document.createElement('div');
  root.className = 'boot-overlay';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-label', 'Preparing the café');
  root.innerHTML =
    '<div class="boot-card">' +
    '<div class="boot-mark" aria-hidden="true">' +
    '<span class="boot-steam boot-steam--1"></span>' +
    '<span class="boot-steam boot-steam--2"></span>' +
    '<span class="boot-steam boot-steam--3"></span>' +
    '<svg viewBox="0 0 24 24" fill="none">' +
    '<path d="M3.5 9h12v5.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9z"/>' +
    '<path d="M15.5 10.2h1.6a2.4 2.4 0 0 1 0 4.8h-1.6"/>' +
    '</svg>' +
    '</div>' +
    '<h1 class="boot-title">Café Timelapse</h1>' +
    '<p class="boot-sub">1945 → 2025</p>' +
    '<div class="boot-track"><div class="boot-fill"></div></div>' +
    '<p class="boot-status">Warming the espresso machine…</p>' +
    '</div>';
  document.body.appendChild(root);

  const fillEl = root.querySelector<HTMLElement>('.boot-fill');
  const statusEl = root.querySelector<HTMLElement>('.boot-status');

  return {
    setProgress(fraction: number, label: string): void {
      const clamped = Math.min(Math.max(fraction, 0), 1);
      if (fillEl) fillEl.style.transform = `scaleX(${clamped})`;
      if (statusEl && label) statusEl.textContent = label;
    },
    finish(): Promise<void> {
      return new Promise<void>((resolve) => {
        root.classList.add('is-done');
        // Resolve on the fade-out transition, with a timer fallback for
        // environments that suppress transitions (reduced motion).
        let settled = false;
        const settleOnce = (): void => {
          if (settled) return;
          settled = true;
          root.remove();
          resolve();
        };
        root.addEventListener('transitionend', settleOnce, { once: true });
        window.setTimeout(settleOnce, 800);
      });
    },
  };
}

/* ------------------------------------------------------------------------- */
/* Bootstrap                                                                  */
/* ------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const loading = createLoadingOverlay();
  // Let the overlay paint before any heavy synchronous work begins.
  await nextFrame();
  await nextFrame();
  loading.setProgress(0.04, 'Raising the room');

  // --- Permanent café shell + lighting rig + prop-group registry ------------

  const cafeScene = new CafeScene({ scene, renderer, camera, resolveEra });

  /**
   * Per-frame ticks for the registered rigs that own idle animation
   * (patrons fidgeting, poster flutter, till crossfades…). Machines and
   * signage are static between era swaps and need no tick.
   */
  const frameTicks: Array<(deltaSeconds: number) => void> = [];

  const registrations: Array<[label: string, register: () => void]> = [
    [
      'Setting bentwood chairs & tables',
      () => {
        const furniture = registerFurniturePropGroup(cafeScene);
        frameTicks.push((deltaSeconds) => {
          furniture.update(deltaSeconds);
        });
      },
    ],
    [
      'Firing the brewing equipment',
      () => {
        registerBrewingEquipment(cafeScene);
      },
    ],
    [
      'Wiring the till',
      () => {
        // autoDrive off: the shared render-loop clock steps the rig instead.
        const counter = registerCounterTech(cafeScene, { autoDrive: false });
        frameTicks.push((deltaSeconds) => {
          counter.update(deltaSeconds);
        });
      },
    ],
    [
      'Chalking the menu board',
      () => {
        const menu = registerMenuPropGroup(cafeScene);
        frameTicks.push((deltaSeconds) => {
          menu.update(deltaSeconds);
        });
      },
    ],
    [
      'Polishing the china',
      () => {
        const tableware = registerTablewarePropGroup(cafeScene);
        frameTicks.push((deltaSeconds) => {
          tableware.update(deltaSeconds);
        });
      },
    ],
    [
      'Pasting posters & advertisements',
      () => {
        const posters = registerPostersPropGroup(cafeScene);
        frameTicks.push((deltaSeconds) => {
          posters.update(deltaSeconds);
        });
      },
    ],
    [
      'Seating the regulars',
      () => {
        const patrons = registerPatronsPropGroup(cafeScene);
        frameTicks.push((deltaSeconds) => {
          patrons.update(deltaSeconds);
        });
      },
    ],
    [
      'Dimming to period lighting',
      () => {
        registerSignageLighting(cafeScene);
      },
    ],
  ];

  for (let i = 0; i < registrations.length; i++) {
    await nextFrame(); // Keep the loading bar visibly alive between groups.
    registrations[i][1]();
    loading.setProgress(0.04 + ((i + 1) / registrations.length) * 0.82, registrations[i][0]);
  }

  // Initial era routes the composed config through every registered group.
  cafeScene.applyEra(INITIAL_YEAR);
  loading.setProgress(0.94, 'Setting the mood');

  // Warm every shader/material with one covered frame so the reveal is smooth.
  try {
    renderer.compile(scene, camera);
  } catch {
    // Best-effort warm-up only; the loop below still renders normally.
  }
  await nextFrame();
  renderFrame(0);
  await nextFrame();

  // --- Top timeline control bar ----------------------------------------------

  /**
   * Five-stop year selector rendered above the canvas. Typed selections drive
   * the animated morph (`transitionTo` commits `CafeScene.applyEra` halfway
   * through); passing the controller here also wires the rail shimmer to its
   * progress events.
   */
  const eraTransitions = new EraTransitionController(cafeScene, { renderer });
  const timelineSlider = new TimelineSlider({
    initialYear: INITIAL_YEAR,
    transitions: eraTransitions,
  });
  timelineSlider.onSelectYear((year) => {
    eraTransitions.transitionTo(year);
  });

  loading.setProgress(1, 'Opening the doors');
  await loading.finish();

  // --- Cinematic intro + navigation hand-off ---------------------------------

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introDuration = reducedMotion ? 0 : INTRO_DURATION_SECONDS;

  let navigation: NavigationController | null = null;
  let introActive = false;
  let introElapsed = 0;

  // Reusable math scratch so the intro performs zero per-frame allocations.
  const introScratchPosition = new THREE.Vector3();
  const introScratchLook = new THREE.Vector3();

  function beginNavigationHandOff(): void {
    if (navigation) return;
    // Land exactly on the closing framing before controls attach, so
    // OrbitControls adopts the pose as its damping origin.
    camera.position.copy(INTRO_END_POSITION);
    camera.lookAt(INTRO_END_LOOK);

    // Reusable bounds buffer so the per-frame bounds query allocates nothing.
    const shellBounds = new THREE.Box3();
    navigation = new NavigationController({
      camera,
      domElement: canvas,
      scene,
      getBounds: () => cafeScene.getShellBounds(shellBounds),
      resolveFocusFrame: (point) => cafeScene.getCloseUpFrame(point),
    });
  }

  function endIntro(): void {
    if (!introActive) return;
    introActive = false;
    introAbort.abort(); // Detach every skip listener.
    beginNavigationHandOff(); // Control hands over (default orbit mode).
  }

  /** Advances the doorway→seating dolly-in by one frame delta. */
  function stepIntro(deltaSeconds: number): void {
    introElapsed += deltaSeconds;
    let t = introDuration > 0 ? introElapsed / introDuration : 1;
    if (!Number.isFinite(t) || t < 0) t = 0;
    if (t > 1) t = 1;

    const ease = 0.5 - 0.5 * Math.cos(Math.PI * t); // easeInOutSine
    const inverse = 1 - ease;

    // Quadratic bezier through the control point keeps the dolly on a gentle arc.
    const p0 = INTRO_START_POSITION;
    const pc = INTRO_CONTROL_POSITION;
    const p1 = INTRO_END_POSITION;
    introScratchPosition.set(
      inverse * inverse * p0.x + 2 * inverse * ease * pc.x + ease * ease * p1.x,
      inverse * inverse * p0.y + 2 * inverse * ease * pc.y + ease * ease * p1.y,
      inverse * inverse * p0.z + 2 * inverse * ease * pc.z + ease * ease * p1.z,
    );
    camera.position.copy(introScratchPosition);

    introScratchLook.lerpVectors(INTRO_START_LOOK, INTRO_END_LOOK, ease);
    camera.lookAt(introScratchLook);

    if (t >= 1) endIntro();
  }

  const introAbort = new AbortController();

  function startIntroOrHandOff(): void {
    if (introDuration <= 0) {
      // Reduced motion: land straight on the closing framing, no glide.
      beginNavigationHandOff();
      return;
    }
    introActive = true;
    introElapsed = 0;
    camera.position.copy(INTRO_START_POSITION);
    camera.lookAt(INTRO_START_LOOK);
    // Any input at all skips the cinematic and hands over instantly.
    const skipEventTypes = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const;
    for (const type of skipEventTypes) {
      window.addEventListener(type, endIntro, { capture: true, signal: introAbort.signal });
    }
  }

  // --- Render loop -------------------------------------------------------------

  // Wall-clock delta via performance.now(); THREE.Clock logs a deprecation
  // warning in this three release, and the loop only needs one delta per frame.
  let previousTimeMs = performance.now();

  function frameLoop(): void {
    requestAnimationFrame(frameLoop);

    const timeMs = performance.now();
    // One clock read per frame, shared by every per-frame system so each sees
    // the same elapsed delta (intro dolly, orbit damping, era morphing).
    const delta = Math.min(Math.max((timeMs - previousTimeMs) / 1000, 0), 0.1);
    previousTimeMs = timeMs;

    if (introActive) stepIntro(delta);
    else if (navigation) navigation.update(delta);

    eraTransitions.update(delta);
    for (let i = 0; i < frameTicks.length; i++) frameTicks[i](delta);

    renderFrame(delta);
  }

  startIntroOrHandOff();
  requestAnimationFrame(frameLoop);
}

main().catch((error: unknown) => {
  // A failed bootstrap is a genuine error worth surfacing.
  console.error('[cafe-timelapse] bootstrap failed:', error);
});
