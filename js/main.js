// App Entry Point Wiring and Initialization
// Initializes Three.js scene renderer, period manager, and wires them together
// Loads default era (1945), renders initial scene, sets up event bus for era change events for performance monitoring

import { initScene } from './scene events
// Initializes StatsPanel for performance monitoring

import { initScene } from './scene-renderer.js';
import PeriodManager from './period-manager.js';
import { StatsPanel } from './stats-panel.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Create container for renderer
  const container = document.createElement('div');
  container.id = 'canvas-container';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.display = 'block';
  document.body.appendChild(container);

  // Initialize Three.js scene renderer
  const { scene, camera, renderer, controls } = initScene(container);

  // Initialize period manager
  const periodManager = new PeriodManager();

  // Initialize stats panel
  const statsPanel = new StatsPanel();

  // Set up era change event bus
  periodManager.onEraChange(async (era) => {
    console.log(`Era changed to: ${era.year}`);
    // TODO: Update scene with era-specific objects (to be implemented in downstream tasks)
    // For now, we just log the era change
  });

  // Load default era (1945) and render initial scene
  const initializeApp = async () => {
    try {
      await periodManager.setEra(1945);
      console.log('Initial era (1945) loaded');
      // Initial render is handled by the animation loop
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    controls.update(); // Required if controls.enableDamping = true, or if using auto-rotation
    renderer.render(scene, camera);
    statsPanel.update();
  };

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Initialize app and start animation loop
  initializeApp().then(() => {
    animate();
  });
});