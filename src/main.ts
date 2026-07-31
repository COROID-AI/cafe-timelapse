import './style.css';
import * as THREE from 'three';
import { ERAS, type EraYear } from './data/eras';
import { registerAllEras, getEraRegistration } from './registry';
import {
  createSceneManager,
  type SceneManagerHandle,
} from './systems/SceneManager';
import { Navigation, type NavigationMode } from './systems/Navigation';
import { buildCaféShell, CAFÉ_BOUNDS } from './systems/cafeShell';
import { EraGroupHost } from './systems/SceneHost';
import { TransitionController } from './systems/TransitionController';
import { ERA_LIGHTING } from './systems/lighting';

const app = document.querySelector<HTMLDivElement>('#app');
const eraLabel = document.querySelector<HTMLParagraphElement>('#era-label');
const modeLabel = document.querySelector<HTMLSpanElement>('#mode-label');
const timeline = document.querySelector<HTMLInputElement>('#timeline');
const timelineYear = document.querySelector<HTMLSpanElement>('#timeline-year');

if (!app) {
  throw new Error('#app container missing');
}

// --- Scene, camera, renderer, controls --------------------------------------
// The SceneManager owns the persistent scene, camera, renderer and the
// timeline snap contract. Its built-in OrbitControls and placeholder fallback
// are disabled here: the Navigation rig owns camera control and the café shell
// below provides the visible room, while the TransitionController owns era
// mounting.

const manager: SceneManagerHandle = createSceneManager({
  container: app,
  initialEra: 1945,
  disableFallback: true,
});
manager.controls.enabled = false;

const scene = manager.scene;
const camera = manager.camera;
const renderer = manager.renderer;

// --- Per-era lighting --------------------------------------------------------
// The SceneManager reconfigures its own lights only when `setActiveEra` runs.
// Era mounting is owned by the TransitionController instead, so main drives the
// per-era environment (src/systems/lighting.ts) itself on each transition.
// Drop the manager's static lights and install the era-driven rig here.

for (const child of [...scene.children]) {
  if (child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight) {
    scene.remove(child);
  }
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
const keyLight = new THREE.DirectionalLight(0xffc68a, 1.1);
keyLight.castShadow = true;
const fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.2);
const rimLight = new THREE.DirectionalLight(0xffffff, 0);
scene.add(ambientLight, keyLight, fillLight, rimLight);

function applyEraLighting(era: EraYear): void {
  const config = ERA_LIGHTING[era];
  scene.background = new THREE.Color(config.background);
  scene.fog = config.fog
    ? new THREE.Fog(config.fog.color, config.fog.near, config.fog.far)
    : null;

  ambientLight.color.setHex(config.ambient.color);
  ambientLight.intensity = config.ambient.intensity;

  keyLight.color.setHex(config.key.color);
  keyLight.intensity = config.key.intensity;
  keyLight.position.set(...config.key.position);

  fillLight.color.setHex(config.fill.color);
  fillLight.intensity = config.fill.intensity;
  fillLight.position.set(...config.fill.position);

  if (config.rim) {
    rimLight.color.setHex(config.rim.color);
    rimLight.intensity = config.rim.intensity;
    rimLight.position.set(...config.rim.position);
    rimLight.visible = true;
  } else {
    rimLight.visible = false;
  }
}

// --- Café shell + placeholder scene ------------------------------------------
// The shell defines the interior collision volume the navigation rig clamps
// against. A stand-in café room keeps the interior visible until era fragments
// build real geometry (Phase 3+).

const shellGroup = new THREE.Group();
buildCaféShell(shellGroup);
scene.add(shellGroup);

// --- Era host + transition controller -----------------------------------------
// Era groups are mounted into `eraRoot` through the SceneHost hook. The
// TransitionController cross-fades between era groups: the outgoing group
// stays mounted (fading out) while the incoming group fades in, then the
// outgoing group is unmounted/disposed.

const eraRoot = new THREE.Group();
scene.add(eraRoot);
const eraHost = new EraGroupHost(eraRoot, { cloneMaterials: true });

function describeEra(era: EraYear): string {
  const registration = getEraRegistration(era);
  return registration
    ? `Era ${era} — ${registration.fragments.length} scene fragments registered`
    : `Era ${era} — not yet registered`;
}

const transition = new TransitionController({
  host: eraHost,
  camera,
  duration: 1.2,
  easing: 'easeInOut',
  onTransitionStart: (era) => {
    applyEraLighting(era);
    if (eraLabel) eraLabel.textContent = `Era ${era} — fading in…`;
  },
  onTransitionEnd: (era) => {
    if (eraLabel) eraLabel.textContent = describeEra(era);
    syncTimelineUI();
  },
});

// --- Navigation ---------------------------------------------------------------
// Orbit (left-drag rotate, right/middle-drag pan, wheel/pinch zoom), a walk-up
// close mode (F key / button), arrow-key + WASD support, smooth damping, and
// collision clamping to the café shell.

const modeButton = document.querySelector<HTMLButtonElement>('#mode-toggle');

const navigation = new Navigation(camera, renderer.domElement, {
  bounds: CAFÉ_BOUNDS,
  collisionMargin: 0.25,
  initialTarget: new THREE.Vector3(0, 1.4, 0),
  initialRadius: 6.5,
  onModeChange: (mode: NavigationMode) => {
    if (modeLabel) modeLabel.textContent = mode === 'orbit' ? 'Orbit' : 'Walk';
    if (modeButton) {
      modeButton.textContent = mode === 'orbit' ? 'Walk up close (F)' : 'Orbit (F)';
    }
  },
});

modeButton?.addEventListener('click', () => {
  navigation.toggleMode();
  navigation.focus();
});

// --- Timeline / era switching ---------------------------------------------------
// The slider drives era selection; every position maps to the nearest era
// step and triggers the TransitionController so changes are cross-faded and
// interruption-safe (a new selection mid-transition retargets cleanly).

function eraForTimeline(value: number): EraYear {
  const clamped = Math.min(1, Math.max(0, value));
  let nearest = 0;
  let nearestDistance = Infinity;
  for (let i = 0; i < manager.timelineSteps.length; i += 1) {
    const distance = Math.abs(manager.timelineSteps[i] - clamped);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = i;
    }
  }
  return manager.eraSteps[nearest];
}

function syncTimelineUI(): void {
  const era = transition.activeEra ?? manager.activeEra;
  if (!era) return;
  const index = manager.eraSteps.indexOf(era);
  const position = manager.timelineSteps[index] ?? 0;
  if (timeline) timeline.value = String(position);
  if (timelineYear) timelineYear.textContent = String(era);
}

if (timeline) {
  timeline.addEventListener('input', () => {
    transition.goTo(eraForTimeline(Number(timeline.value)));
    syncTimelineUI();
  });
}

// --- SceneManager transition hooks ----------------------------------------------
// When eras are switched through the manager directly (e.g. programmatic
// `setActiveEra` calls), these hooks keep the label in sync with the swap.

manager.onBeforeTransition((next, previous) => {
  if (eraLabel) {
    eraLabel.textContent = previous
      ? `Transitioning ${previous} → ${next}…`
      : `Mounting ${next}…`;
  }
});

manager.onAfterTransition((era) => {
  if (eraLabel) eraLabel.textContent = describeEra(era);
});

// --- Animation loop ----------------------------------------------------------------

let lastTime = performance.now();

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  navigation.update(dt);
  transition.update(dt);

  // 2055 bioluminescent pulse: subtle rim-light intensity breathing.
  const config = transition.activeEra ? ERA_LIGHTING[transition.activeEra] : undefined;
  if (config?.rim?.pulse) {
    rimLight.intensity = config.rim.intensity * (0.75 + 0.25 * Math.sin(now * 0.002));
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  manager.resize();
});

async function init(): Promise<void> {
  await registerAllEras();

  // The SceneManager pre-mounted the initial era at construction, before the
  // async registry finished loading; the TransitionController owns era
  // mounting, so drop that placeholder group.
  if (manager.activeEraGroup !== scene) {
    scene.remove(manager.activeEraGroup);
  }

  transition.goTo(ERAS[0]);
  navigation.focus();
  syncTimelineUI();
  requestAnimationFrame(animate);
}

void init();
