// App Entry Point Wiring and Initialization
// Initializes Three.js scene renderer, period manager, and wires them together
// Loads default era (1945), renders initial scene, sets up event bus for era change events for performance monitoring
// Also implements the 3D Hotspot Inspection System

import { initScene } from './scene-renderer.js';
import PeriodManager from './period-manager.js';
import { StatsPanel } from './stats-panel.js';
import { hotspotData, getHotspotsForEra } from '../public/js/hotspot-data.js';
import { InspectorPanel } from '../public/js/inspector.js';

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

  // Initialize inspector panel
  const inspectorPanel = new InspectorPanel();

  // Create a group for hotspot markers and add to scene
  const hotspotGroup = new THREE.Group();
  scene.add(hotspotGroup);

  // Raycaster for mouse clicking
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Store current hotspots for cleanup
  let currentHotspots = [];

  // Function to create a hotspot sprite (pulsing dot)
  function createHotspotSprite() {
    // Create a sprite material with a circular texture
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;
    const center = 32;
    const radius = 24;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow pulsating
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.2, 0.2, 0.2); // Initial size
    return sprite;
  }

  // Function to update hotspots for the current era
  function updateHotspotsForEra(era) {
    // Remove existing hotspots
    currentHotspots.forEach(hotspot => {
      hotspotGroup.remove(hotspot.sprite);
    });
    currentHotspots = [];

    // Get hotspots for this era
    const hotspots = getHotspotsForEra(era);
    hotspots.forEach(hotspotData => {
      const sprite = createHotspotSprite();
      sprite.position.set(hotspotData.position.x, hotspotData.position.y, hotspotData.position.z);
      // Store the hotspot data in userData for click handling
      sprite.userData = { info: hotspotData.info, name: hotspotData.name };
      hotspotGroup.add(sprite);
      currentHotspots.push({ sprite, data: hotspotData });
    });
  }

  // Function to animate hotspot pulsation
  function updateHotspotAnimation(time) {
    currentHotspots.forEach(hotspot => {
      // Pulse scale between 0.2 and 0.3
      const scale = 0.25 + 0.05 * Math.sin(time * 2 + hotspot.sprite.position.x * 10);
      hotspot.sprite.scale.set(scale, scale, scale);
    });
  }

  // Mouse click handler
  function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with hotspot sprites
    const intersects = raycaster.intersectObjects(hotspotGroup.children);
    if (intersects.length > 0) {
      const intersected = intersects[0];
      const hotspotData = intersected.object.userData;
      if (hotspotData && hotspotData.info) {
        inspectorPanel.show(hotspotData.info.title, `<p>${hotspotData.info.description}</p>`);
      }
    }
  }

  // Set up era change event bus
  periodManager.onEraChange(async (era) => {
    console.log(`Era changed to: ${era.year}`);
    // Update hotspots for the new era
    updateHotspotsForEra(era.year);
    // TODO: Update scene with era-specific objects (to be implemented in downstream tasks)
    // For now, we just log the era change
  });

  // Load default era (1945) and render initial scene
  const initializeApp = async () => {
    try {
      await periodManager.setEra(1945);
      console.log('Initial era (1945) loaded');
      // Update hotspots for initial era
      updateHotspotsForEra(1945);
      // Initial render is handled by the animation loop
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // Animation loop
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    controls.update(); // Required if controls.enableDamping = true, or if using auto-rotation
    renderer.render(scene, camera);
    statsPanel.update();
    // Update hotspot animation
    updateHotspotAnimation(elapsedTime);
  };

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Mouse click event listener
  window.addEventListener('click', onMouseClick);

  // Initialize app and start animation loop
  initializeApp().then(() => {
    animate();
  });
});