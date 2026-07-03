import { initScene } from './scene-renderer.js';
import { PeriodManager } from './period-manager.js';
import { initStatsPanel, updateStats } from './stats-panel.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const loadingElement = document.getElementById('loading');

  try {
    // Initialize Three.js scene
    const { scene, camera, renderer, _controls } = initScene(container);

    // Initialize Period Manager and set default era
    const periodManager = new PeriodManager();
    periodManager.selectEra(1945);

    // Initialize stats panel
    const _statsPanel = initStatsPanel();

    // Set up era change listener
    periodManager.onEraChange((era) => {
      updateStats(era.year, 0);
    });

    // Start render loop
    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      updateStats(periodManager.getState().year, 0);
    }

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
