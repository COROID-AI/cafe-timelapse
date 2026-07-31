import './style.css';
import * as THREE from 'three';
import { ERAS, type EraYear } from './data/eras';
import { registerAllEras } from './registry';
import {
  createSceneManager,
  type SceneManagerHandle,
} from './systems/SceneManager';
import { Navigation, type NavigationMode } from './systems/Navigation';
import { buildArchitectureShell } from './world/ArchitectureShell';
import { ROOM_BOUNDS } from './world/layout';
import { EraGroupHost } from './systems/SceneHost';
import { TransitionController } from './systems/TransitionController';
import { ERA_LIGHTING } from './systems/lighting';
import { AudioEngine } from './audio/AudioEngine';
import {
  populate1965Surfaces,
  populate2025Surfaces,
  populate2055Surfaces,
} from './compositions';
import type { SurfaceSlots } from './world/ArchitectureShell';
import {
  TimelineSlider,
  ERA_CHANGE_EVENT,
} from './ui/TimelineSlider';
import { OnboardingScreen } from './ui/OnboardingScreen';
import { Hud } from './ui/Hud';
import { updateCharacterAnimations } from './world/characters';

const app = document.querySelector<HTMLDivElement>('#app');
const timelineWrap = document.querySelector<HTMLDivElement>('#timeline-wrap');
const hudWrap = document.querySelector<HTMLDivElement>('#hud-wrap');

if (!app) {
  throw new Error('#app container missing');
}

// --- Scene, camera, renderer, controls --------------------------------------
// The SceneManager owns the persistent scene, camera and renderer. Its built-in
// OrbitControls and placeholder fallback are disabled here: the Navigation rig
// owns camera control, the café shell below provides the visible room, and the
// TransitionController owns era mounting (externalEraMounting so the manager
// never mounts a second copy of an era group).

const manager: SceneManagerHandle = createSceneManager({
  container: app,
  initialEra: 1945,
  disableFallback: true,
  externalEraMounting: true,
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

// --- Persistent café architecture shell --------------------------------------
// The shell is the era-neutral room (floor, walls, ceiling, storefront window
// wall + door, counter zone, seating zone) built from the canonical spatial
// contract (src/world/layout.ts). It defines the interior collision volume the
// navigation rig clamps against and stays mounted beneath the per-era groups;
// era tasks dress it through its surface slots (wallSlots / floorSlot /
// ceilingSlot) rather than rebuilding architecture.

const shellGroup = new THREE.Group();
const shellBuild = buildArchitectureShell(shellGroup);
const shellSlots: SurfaceSlots = shellBuild.slots;
scene.add(shellGroup);

// Composed eras dress the shell's surface slots through their compositions.
// The 1965 finishes are checkerboard tile / geometric wallpaper / plaster
// ceiling; the 2025 finishes are white ceramic tile / polished concrete /
// matte black exposed-services ceiling; the 2055 finishes are reactive
// smart-glass walls / photopolymer resin floor / mycelium ceiling. Eras that
// are not yet composed keep the neutral placeholder finishes; finishes are
// applied once per era on first mount so the visible room matches the era.
const shellSurfacesDressedFor = new Set<number>();
function dressShellForEra(era: EraYear): void {
  if (era === 1965 && !shellSurfacesDressedFor.has(era)) {
    populate1965Surfaces(shellSlots);
    shellSurfacesDressedFor.add(era);
  }
  if (era === 2025 && !shellSurfacesDressedFor.has(era)) {
    populate2025Surfaces(shellSlots);
    shellSurfacesDressedFor.add(era);
  }
  if (era === 2055 && !shellSurfacesDressedFor.has(era)) {
    populate2055Surfaces(shellSlots);
    shellSurfacesDressedFor.add(era);
  }
}

// --- Era host + transition controller -----------------------------------------
// Era groups are mounted into `eraRoot` through the SceneHost hook. The
// TransitionController cross-fades between era groups: the outgoing group
// stays mounted (fading out) while the incoming group fades in, then the
// outgoing group is unmounted/disposed.

const eraRoot = new THREE.Group();
scene.add(eraRoot);
const eraHost = new EraGroupHost(eraRoot, { cloneMaterials: true });

const transition = new TransitionController({
  host: eraHost,
  camera,
  duration: 1.2,
  easing: 'easeInOut',
  onTransitionStart: (era) => {
    applyEraLighting(era);
    dressShellForEra(era);
    audio.setEra(era);
  },
  onTransitionEnd: (era) => {
    hud?.setEra(era);
    syncTimelineUI();
  },
});

// --- Audio engine -------------------------------------------------------------
// Generative per-era sound bed. The AudioContext is created lazily on the
// onboarding click (user gesture → autoplay policy satisfied); each era swap
// rebuilds the bed; every frame moves the Web Audio listener with the camera.

const audio = new AudioEngine();

// --- HUD ----------------------------------------------------------------------
// Small overlay: active era label, mute toggle, walk-mode toggle and a
// controls hint. The mode toggle mirrors the Navigation rig's F-key toggle.

const hud = hudWrap ? new Hud({}) : null;
if (hud && hudWrap) {
  hudWrap.appendChild(hud.root);
}

// --- Onboarding ---------------------------------------------------------------
// Loading gate: shows while the async era registry prepares, then reveals a
// 'click to enter' button. The click unlocks Web Audio (autoplay policy) and
// starts the scene.

const onboarding = new OnboardingScreen({
  container: app,
  onEnter: () => {
    audio.unlock();
    navigation.focus();
  },
});

// --- Navigation ---------------------------------------------------------------
// Orbit (left-drag rotate, right/middle-drag pan, wheel/pinch zoom), a walk-up
// close mode (F key / button), arrow-key + WASD support, smooth damping, and
// collision clamping to the café shell.

const navigation = new Navigation(camera, renderer.domElement, {
  bounds: ROOM_BOUNDS,
  collisionMargin: 0.25,
  initialTarget: new THREE.Vector3(0, 1.4, 0),
  initialRadius: 6.5,
  onModeChange: (mode: NavigationMode) => {
    hud?.setMode(mode);
  },
});

hud?.root.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('.hud__mute')) {
    const muted = audio.toggleMute();
    hud.setMuted(muted);
  }
  if (target.closest('.hud__button--mode')) {
    navigation.toggleMode();
    navigation.focus();
  }
});

// --- Timeline slider ----------------------------------------------------------
// The top control bar renders six labeled stops (1945…2055) with a draggable
// handle. Selecting a stop commits the era through the TransitionController
// (which mounts/unmounts era groups via the SceneHost and reports through the
// SceneManager hooks), and the slider mirrors external era changes.

const timelineSlider = timelineWrap
  ? new TimelineSlider({ initialEra: manager.activeEra ?? ERAS[0] })
  : undefined;

if (timelineSlider) {
  timelineWrap?.appendChild(timelineSlider.root);

  timelineSlider.root.addEventListener(ERA_CHANGE_EVENT, ((event: Event) => {
    const era = (event as CustomEvent<EraYear>).detail;
    if (!era) return;
    // The SceneManager is the canonical era driver: with externalEraMounting
    // it records the switch and runs its transition hooks (HUD / slider sync)
    // without mounting a second era group, then the TransitionController
    // performs the actual cross-fade through the SceneHost.
    manager.setActiveEra(era);
    transition.goTo(era);
  }) as EventListener);
}

function syncTimelineUI(): void {
  const era = transition.activeEra ?? manager.activeEra;
  if (era && timelineSlider) timelineSlider.setEra(era);
}

// --- SceneManager transition hooks ----------------------------------------------
// When eras are switched through the manager directly (e.g. programmatic
// `setActiveEra` calls), these hooks keep the HUD / slider in sync with the
// swap. Audio follows the same path through the TransitionController (which is
// the only era-mounting entry used by the timeline).

manager.onBeforeTransition((next, previous) => {
  if (hud) {
    hud.setEra(previous ?? next);
  }
});

manager.onAfterTransition((era) => {
  hud?.setEra(era);
  // Reflect external era changes (e.g. programmatic `setActiveEra`) back into
  // the slider without re-emitting eraChange.
  timelineSlider?.setEra(era);
});

// --- Animation loop ----------------------------------------------------------------

let lastTime = performance.now();

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  navigation.update(dt);
  transition.update(dt);

  // Shared character idle loop: breathing, head turns, occasional sips.
  updateCharacterAnimations(scene, dt, now / 1000);

  // Audio spatialization: keep the Web Audio listener with the camera.
  audio.update(dt, camera);

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

  // First era: mount + light + dress the shell, then start the loop. Audio is
  // only applied once the user clicks to enter (unlock), but the target era is
  // remembered so the correct bed starts on the first gesture.
  transition.goTo(ERAS[0]);
  navigation.focus();
  syncTimelineUI();
  hud?.setEra(ERAS[0]);

  onboarding.showReady();
  requestAnimationFrame(animate);
}

void init();
