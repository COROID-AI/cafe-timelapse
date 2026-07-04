// Three.js Scene Renderer with Lighting and Camera Controls
// Reference: Following typical Three.js setup pattern as would be in public/js/main.js

// Assuming Three.js and OrbitControls are available as globals (via script tags)
// If using ES modules, adjust imports accordingly:
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Initializes a Three.js scene with café room, lighting, and controls
 * @param {HTMLElement} container - DOM element to attach the renderer to
 * @returns {{scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: THREE.OrbitControls}}
 */
function initScene(container) {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); // Light gray background

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75, // FOV
    container.clientWidth / container.clientHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  camera.position.set(0, 1.5, 3); // Initial camera position

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true; // Enable shadow mapping
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
  container.appendChild(renderer.domElement);

  // Ambient light (warm café tone)
  const ambientLight = new THREE.AmbientLight(0xfff0e6, 0.6); // Soft warm white
  scene.add(ambientLight);

  // Directional light (simulating warm sunlight from window)
  const directionalLight = new THREE.DirectionalLight(0xffd8b2, 0.8); // Warm sunlight
  directionalLight.position.set(5, 5, 3); // Position to cast shadows across the room
  directionalLight.castShadow = true;
  
  // Configure shadow map properties for better quality
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 20;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  
  scene.add(directionalLight);

  // Create café room
  const roomSize = { width: 8, height: 3, depth: 6 };
  
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Saddle brown
    roughness: 0.8,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rotate to horizontal
  floor.position.y = -roomSize.height / 2; // Place at bottom of room
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfff8dc, // Cornsilk
    roughness: 0.9,
    metalness: 0.0
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2; // Rotate to horizontal
  ceiling.position.y = roomSize.height / 2; // Place at top of room
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // Back wall
  const backWallGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
  const backWallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5deb3, // Wheat
    roughness: 0.9,
    metalness: 0.0
  });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.z = -roomSize.depth / 2;
  backWall.position.y = 0; // Centered vertically
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Front wall (optional - could be open or glass)
  const frontWallGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
  const frontWallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfdf5e6, // Old lace
    roughness: 0.9,
    metalness: 0.0
  });
  const frontWall = new THREE.Mesh(frontWallGeometry, frontWallMaterial);
  frontWall.position.z = roomSize.depth / 2;
  frontWall.position.y = 0;
  frontWall.receiveShadow = true;
  scene.add(frontWall);

  // Left wall
  const leftWallGeometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
  const leftWallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5deb3, // Wheat
    roughness: 0.9,
    metalness: 0.0
  });
  const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
  leftWall.position.x = -roomSize.width / 2;
  leftWall.position.y = 0;
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  // Right wall
  const rightWallGeometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
  const rightWallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5deb3, // Wheat
    roughness: 0.9,
    metalness: 0.0
  });
  const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
  rightWall.position.x = roomSize.width / 2;
  rightWall.position.y = 0;
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Counter area (simplified as a block)
  const counterWidth = 2;
  const counterDepth = 1.5;
  const counterHeight = 1;
  const counterGeometry = new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth);
  const counterMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Saddle brown
    roughness: 0.6,
    metalness: 0.1
  });
  const counter = new THREE.Mesh(counterGeometry, counterMaterial);
  counter.position.set(0, -roomSize.height/2 + counterHeight/2, roomSize.depth/3); // Front part of room
  counter.castShadow = true;
  counter.receiveShadow = true;
  scene.add(counter);

  // Add some simple details to counter (countertop)
  const counterTopGeometry = new THREE.BoxGeometry(counterWidth + 0.2, 0.1, counterDepth + 0.2);
  const counterTopMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdeb887, // Burlywood
    roughness: 0.3,
    metalness: 0.1
  });
  const counterTop = new THREE.Mesh(counterTopGeometry, counterTopMaterial);
  counterTop.position.set(0, -roomSize.height/2 + counterHeight + 0.05, roomSize.depth/3);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  scene.add(counterTop);

  // OrbitControls for camera navigation
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Enable damping for smooth movement
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, 0, 0); // Focus on center of room

  // Handle window resize
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  window.addEventListener('resize', onWindowResize);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    controls.update(); // Required if damping enabled
    
    renderer.render(scene, camera);
  }
  
  // Start the animation loop
  animate();

  // Return objects for external manipulation if needed
  return {
    scene,
    camera,
    renderer,
    controls
  };
}

// Export for use in other modules (if using ES modules)
// In a global script setup, this would be attached to window
if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
  module.exports = { initScene };
} else {
  // Attach to window for global script usage
  window.initScene = initScene;
}