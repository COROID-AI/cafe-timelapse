// App Entry Point Wiring and Initialization
// Initializes Three.js scene renderer, period manager, and wires them together
// Loads default era (1945), renders initial scene, sets up event bus for era change events for performance monitoring
// Also implements the 3D Hotspot Inspection System and Era Transition Visual Animations

import { initScene } from './scene-renderer.js';
import PeriodManager from './period-manager.js';
import { StatsPanel } from './stats-panel.js';
import AudioManager from './audio-manager.js';
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
  const { scene, camera, renderer, controls, ambientLight, directionalLight } = initScene(container);

  // Initialize period manager
  const periodManager = new PeriodManager();

  // Initialize stats panel
  const statsPanel = new StatsPanel();

  // Initialize audio manager (era music + SFX + ambient)
  const audioManager = new AudioManager({
    periodManager,
    // Slightly shorter crossfade feels better for quick era changes.
    crossfadeDurationMs: 1800
  });
  audioManager.bindVolumeSliders();

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

  // Transition variables
  let oldGroup = null;
  let newGroup = null;
  let currentEra = null;
  let oldEra = null;
  let newEra = null;
  let transitionInProgress = false;
  let transitionStartTime = 0;
  const transitionDuration = 1500; // ms (1.5 seconds)
  let particleSystem = null; // will be an object { points, material }

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
  function updateHotspotsForEra(eraYear) {
    // Remove existing hotspots
    currentHotspots.forEach(hotspot => {
      hotspotGroup.remove(hotspot.sprite);
    });
    currentHotspots = [];

    // Get hotspots for this era
    const hotspots = getHotspotsForEra(eraYear);
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

  // Helper function to set opacity of a group and its children
  function setGroupOpacity(group, opacity) {
    if (!group) return;
    group.traverse(child => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.opacity = opacity;
            material.transparent = opacity < 1;
          });
        } else {
          child.material.opacity = opacity;
          child.material.transparent = opacity < 1;
        }
      }
    });
  }

  // Helper function to create a particle system for transition effects
  function createTransitionParticleSystem(colorString) {
    const particleCount = 30;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new THREE.Color(colorString);

    for (let i = 0; i < particleCount; i++) {
      // Random position within the room
      positions[i * 3] = (Math.random() - 0.5) * 8; // x: -4 to 4
      positions[i * 3 + 1] = Math.random() * 3; // y: 0 to 3 (height)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6; // z: -3 to 3

      // Color
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Random size between 0.03 and 0.12
      sizes[i] = 0.03 + Math.random() * 0.09;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    return { points: particles, material };
  }

  // Function to update particle system during transition
  function updateParticleSystem(time) {
    if (!particleSystem) return;
    const elapsed = (time - transitionStartTime) / 1000; // seconds
    // Fade in and out over the transition duration
    const progress = Math.min(elapsed / (transitionDuration / 1000), 1);
    // Use a curve that peaks in the middle
    const opacity = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
    particleSystem.material.opacity = opacity;
    // Optional: make particles drift slowly
    particleSystem.points.rotation.y += 0.001;
  }

  // Function to update transition (lights, opacity, etc.)
  function updateTransition(time) {
    if (!transitionInProgress) return;

    const elapsed = time - transitionStartTime;
    const progress = Math.min(elapsed / transitionDuration, 1);
    const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // easeInOutSine

    // Update opacities: fade out old group, fade in new group
    if (oldGroup) {
      setGroupOpacity(oldGroup, 1 - easedProgress);
    }
    setGroupOpacity(newGroup, easedProgress);

    // Update lights: interpolate between old era and new era lighting
    if (oldEra && newEra) {
      // Ambient light
      const oldAmbientColor = new THREE.Color(oldEra.lighting.color);
      const newAmbientColor = new THREE.Color(newEra.lighting.color);
      ambientLight.color.lerp(newAmbientColor, easedProgress);
      ambientLight.intensity = THREE.MathUtils.lerp(
        oldEra.lighting.intensity,
        newEra.lighting.intensity,
        easedProgress
      );

      // Directional light (we adjust intensity slightly to match the era's lighting intensity)
      const oldDirectionalColor = new THREE.Color(oldEra.lighting.color);
      const newDirectionalColor = new THREE.Color(newEra.lighting.color);
      directionalLight.color.lerp(newDirectionalColor, easedProgress);
      // Directional light intensity matches the era's lighting intensity
      directionalLight.intensity = THREE.MathUtils.lerp(
        oldEra.lighting.intensity,
        newEra.lighting.intensity,
        easedProgress
      );
    }

    // Update particle system
    updateParticleSystem(time);

    // End transition
    if (progress >= 1) {
      transitionInProgress = false;
      // Remove old group from scene
      if (oldGroup) {
        scene.remove(oldGroup);
      }
      // Set oldGroup to newGroup for next transition
      oldGroup = newGroup;
      newGroup = null;
      // Remove particle system
      if (particleSystem) {
        scene.remove(particleSystem.points);
        particleSystem = null;
      }
      // Update current era to the new era
      currentEra = newEra;
    }
  }

  // Set up era change event bus
  periodManager.onEraChange(async (era) => {
    console.log(`Era changed to: ${era.year}`);
    // Update hotspots for the new era
    updateHotspotsForEra(era.year);

    // If this is the initial load (no oldGroup), just set up the scene without transition
    if (!oldGroup) {
      const initialGroup = era.buildScene();
      setGroupOpacity(initialGroup, 1);
      scene.add(initialGroup);
      oldGroup = initialGroup;
      currentEra = era;
      return;
    }

    // We have an old group, so we need to transition to the new era
    newEra = era;
    oldEra = currentEra; // currentEra is the era we are currently displaying (old era)

    // Create the new era's group
    newGroup = newEra.buildScene();
    // Initially set new group opacity to 0 (invisible)
    setGroupOpacity(newGroup, 0);
    scene.add(newGroup);

    // Ensure old group is fully visible before fading out
    if (oldGroup) {
      setGroupOpacity(oldGroup, 1);
    }

    // Start transition
    transitionInProgress = true;
    transitionStartTime = Date.now();

    // Create particle system for this transition (based on new era's lighting color)
    if (particleSystem) {
      scene.remove(particleSystem.points);
    }
    particleSystem = createTransitionParticleSystem(newEra.lighting.color);
  });

  // Load default era (1945) and render initial scene
  const initializeApp = async () => {
    try {
      await periodManager.setEra(1945);
      console.log('Initial era (1945) loaded');
      // The era change callback will handle the initial setup
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

    // Update transition if in progress
    if (transitionInProgress) {
      updateTransition(Date.now());
    }
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