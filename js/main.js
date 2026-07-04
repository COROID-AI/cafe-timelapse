// App Entry Point Wiring and Initialization
// Initializes Three.js scene renderer, period manager, and wires them together
// Loads default era (1945), renders initial scene, sets up event bus for era change events for performance monitoring
// Also implements the 3D Hotspot Inspection System

import { initScene } from './scene-renderer.js';
import PeriodManager from './period-manager.js';
import { StatsPanel } from './stats-panel.js';
import { getHotspotsForEra } from '../public/js/hotspot-data.js';
import { InspectorPanel } from '../public/js/inspector.js';
import { TimelineSlider, eraDescriptions } from './timeline-slider.js';

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

  // Timeline slider UI (top overlay)
  const sliderContainerForUI = document.createElement('div');
  sliderContainerForUI.id = 'ui-overlay';
  sliderContainerForUI.style.position = 'fixed';
  sliderContainerForUI.style.top = '0';
  sliderContainerForUI.style.left = '0';
  sliderContainerForUI.style.width = '100%';
  sliderContainerForUI.style.pointerEvents = 'auto';
  sliderContainerForUI.style.zIndex = '1000';
  document.body.appendChild(sliderContainerForUI);

  const timelineSlider = new TimelineSlider(sliderContainerForUI, periodManager, eraDescriptions);
  // eslint-disable-next-line no-unused-vars
  const _unusedTimelineSlider = timelineSlider;

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
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 64;

    const center = 32;
    const radius = 24;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 0, 0.8)';
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.2, 0.2, 0.2);
    return sprite;
  }

  // Function to update hotspots for the current era
  function updateHotspotsForEra(era) {
    currentHotspots.forEach((hotspot) => {
      hotspotGroup.remove(hotspot.sprite);
    });
    currentHotspots = [];

    const hotspots = getHotspotsForEra(era);
    hotspots.forEach((hotspot) => {
      const sprite = createHotspotSprite();
      sprite.position.set(hotspot.position.x, hotspot.position.y, hotspot.position.z);
      sprite.userData = { info: hotspot.info, name: hotspot.name };
      hotspotGroup.add(sprite);
      currentHotspots.push({ sprite, data: hotspot });
    });
  }

  // Function to animate hotspot pulsation
  function updateHotspotAnimation(time) {
    currentHotspots.forEach((hotspot) => {
      const scale = 0.25 + 0.05 * Math.sin(time * 2 + hotspot.sprite.position.x * 10);
      hotspot.sprite.scale.set(scale, scale, scale);
    });
  }

  // Mouse click handler
  function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(hotspotGroup.children);
    if (intersects.length > 0) {
      const intersected = intersects[0];
      const hotspotInfo = intersected.object.userData;
      if (hotspotInfo && hotspotInfo.info) {
        inspectorPanel.show(hotspotInfo.info.title, `<p>${hotspotInfo.info.description}</p>`);
      }
    }
  }

  // Set up era change event bus
  periodManager.onEraChange((era) => {
    if (!era || typeof era.year !== 'number') return;
    updateHotspotsForEra(era.year);
  });

  // Load default era (1945) and render initial scene
  const initializeApp = async () => {
    try {
      await periodManager.setEra(1945);
      updateHotspotsForEra(1945);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // Animation loop
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    controls.update();
    renderer.render(scene, camera);
    statsPanel.update();
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

  initializeApp().then(() => {
    animate();
  });
});
