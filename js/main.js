import { initScene } from './scene-renderer.js';
import { PeriodManager } from './period-manager.js';
import { initStatsPanel, updateStats } from './stats-panel.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const loadingElement = document.getElementById('loading');

  // Declare variables that will be assigned in the try block
  let scene, camera, renderer, periodManager;

  try {
    // Initialize Three.js scene
    const sceneData = initScene(container);
    scene = sceneData.scene;
    camera = sceneData.camera;
    renderer = sceneData.renderer;

    // Initialize Period Manager and set default era
    periodManager = new PeriodManager();
    periodManager.selectEra(1945);

    // Initialize stats panel
    initStatsPanel();

    // Set up era change listener
    periodManager.onEraChange((era) => {
      const yearElement = document.getElementById('current-year');
      if (yearElement) {
        yearElement.textContent = era.year || '1945';
      }
    });

    // Start render loop
    const animate = () => {
      requestAnimationFrame(animate);
      const start = performance.now();
      renderer.render(scene, camera);
      const renderTime = performance.now() - start;
      updateStats(periodManager.getState().year, renderTime);
    };

    animate();

    // Handle window focus/blur
    window.addEventListener('focus', () => {
      // Resume rendering
    });
    window.addEventListener('blur', () => {
      // Could pause rendering
    });

    console.log('Café Three.js scene initialized successfully');
  } catch (error) {
    console.error('Failed to initialize scene:', error);
    loadingElement.innerHTML = '<h1>Error Loading Scene</h1><p>' + error.message + '</p>';
  }
});