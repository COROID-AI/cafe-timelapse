import './style.css';
import type { EraYear } from './data/eras';
import { registerAllEras } from './registry';
import {
  createSceneManager,
  type SceneManagerHandle,
} from './systems/SceneManager';

const app = document.querySelector<HTMLDivElement>('#app');
const eraLabel = document.querySelector<HTMLParagraphElement>('#era-label');
const timeline = document.querySelector<HTMLInputElement>('#timeline');
const timelineYear = document.querySelector<HTMLSpanElement>('#timeline-year');

if (!app) {
  throw new Error('#app container missing');
}

// --- Scene, camera, renderer, controls --------------------------------------
// The SceneManager owns the persistent scene, per-era fragment groups, the
// per-era lighting environment and the render loop integration points.

const manager: SceneManagerHandle = createSceneManager({
  container: app,
  initialEra: 1945,
});

// --- Timeline UI -------------------------------------------------------------
// The slider drives era selection; every position maps to the nearest era
// step and triggers the transition controller via setActiveEra.

function syncTimelineUI(): void {
  const era = manager.activeEra;
  if (!era) return;
  const index = manager.eraSteps.indexOf(era);
  const position = manager.timelineSteps[index] ?? 0;
  if (timeline) timeline.value = String(position);
  if (timelineYear) timelineYear.textContent = String(era);
  if (eraLabel) {
    eraLabel.textContent = `Era ${era} — ${manager.activeEraGroup.children.length} fragment groups mounted`;
  }
}

if (timeline) {
  timeline.addEventListener('input', () => {
    manager.snapToTimeline(Number(timeline.value));
    syncTimelineUI();
  });
}

// --- Transition hooks ---------------------------------------------------------
// Future phases plug the cross-fade controller into these hooks. For now the
// hooks observe the swap so the label reflects the freshly mounted era.

manager.onBeforeTransition((next, previous) => {
  if (eraLabel) {
    eraLabel.textContent = previous
      ? `Transitioning ${previous} → ${next}…`
      : `Mounting ${next}…`;
  }
});

manager.onAfterTransition((era) => {
  if (eraLabel) {
    eraLabel.textContent = `Era ${era} — ${manager.activeEraGroup.children.length} fragment groups mounted`;
  }
});

// --- Animation loop -----------------------------------------------------------

function animate(): void {
  requestAnimationFrame(animate);
  manager.update();
  manager.render();
}

window.addEventListener('resize', () => {
  manager.resize();
});

async function init(): Promise<void> {
  await registerAllEras();
  manager.setActiveEra(manager.activeEra ?? (1945 as EraYear));
  syncTimelineUI();
  animate();
}

void init();
