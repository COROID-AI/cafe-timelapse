import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js Scene Renderer for Café Timelapse
 * Creates a detailed café room with proper lighting and camera controls
 */

let scene, camera, renderer, controls;
let resizeObserver;

/**
 * Initialize the 3D scene with café room setup
 * @param {HTMLElement} container - The DOM element to render the scene into
 */
export function initScene(container) {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Light sky blue background

    // Set up camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(5, 4, 10);
    camera.lookAt(0, 0, 0);

    // Set up renderer with shadow map
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    container.appendChild(renderer.domElement);

    // Set up OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going under the floor

    // Create the café room
    createCaféRoom();

    // Add lighting
    addLighting();

    // Start render loop
    startRenderLoop();

    // Handle resize
    setupResizeHandling(container);

    return { scene, camera, renderer, controls };
}

/**
 * Create the detailed café room geometry
 * Includes floor, walls, ceiling, and counter area
 */
function createCaféRoom() {
    const roomSize = {
        width: 12,
        depth: 10,
        height: 4
    };

    const counterSize = {
        width: 6,
        depth: 2,
        height: 1.2
    };

    // Room materials with warm café tones
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8b7355, // Wood floor tone
        roughness: 0.7,
        metalness: 0.2
    });

    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5dc, // Cream wall color
        roughness: 0.8,
        metalness: 0.1
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf0f0f0, // Light ceiling
        roughness: 0.9,
        metalness: 0.05
    });

    const counterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x654321, // Dark wood counter
        roughness: 0.6,
        metalness: 0.1
    });

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -roomSize.depth / 2;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.x = -roomSize.width / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.PlaneGeometry(roomSize.depth, roomSize.height);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.x = roomSize.width / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Front wall (entrance area)
    const frontWallGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.height);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.z = roomSize.depth / 2;
    frontWall.receiveShadow = true;
    
    // Add door opening in front wall
    const doorFrameGeometry = new THREE.BoxGeometry(0.5, 2.5, 0.3);
    const doorFrame = new THREE.Mesh(doorFrameGeometry, wallMaterial);
    doorFrame.position.set(-1, 1.25, roomSize.depth / 2 + 0.15);
    frontWall.add(doorFrame);
    
    scene.add(frontWall);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomSize.width, roomSize.depth);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomSize.height;
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Counter - main section
    const counterGeometry = new THREE.BoxGeometry(counterSize.width, counterSize.height, counterSize.depth);
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(0, counterSize.height / 2, 2);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);

    // Counter top surface
    const counterTopGeometry = new THREE.PlaneGeometry(counterSize.width, counterSize.depth);
    const counterTop = new THREE.Mesh(counterTopGeometry, new THREE.MeshStandardMaterial({ 
        color: 0x4a3c30,
        roughness: 0.5,
        metalness: 0.3
    }));
    counterTop.rotation.x = -Math.PI / 2;
    counterTop.position.y = counterSize.height;
    counterTop.receiveShadow = true;
    scene.add(counterTop);

    // Add some basic café furniture (tables and chairs)
    createCaféFurniture();
}

/**
 * Create basic café furniture
 */
function createCaféFurniture() {
    const tableMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8b4513, // Wooden table
        roughness: 0.6,
        metalness: 0.2
    });

    const chairMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5d4037, // Dark wood chair
        roughness: 0.7,
        metalness: 0.1
    });

    // Tables
    for (let i = 0; i < 3; i++) {
        const tableGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const tableTop = new THREE.Mesh(tableGeometry, tableMaterial);
        tableTop.position.set(
            (i - 1) * 4,
            0.75,
            -3
        );
        tableTop.castShadow = true;
        scene.add(tableTop);

        // Table legs
        for (let j = -0.4; j <= 0.4; j += 0.8) {
            const legGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
            const leg = new THREE.Mesh(legGeometry, tableMaterial);
            leg.position.set(
                tableTop.position.x + j,
                0.35,
                tableTop.position.z
            );
            leg.castShadow = true;
            scene.add(leg);
        }

        // Chairs around table
        for (let k = 0; k < 4; k++) {
            const chairGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            const angle = (k * Math.PI) / 2;
            chair.position.set(
                tableTop.position.x + Math.cos(angle) * 1,
                0.4,
                tableTop.position.z + Math.sin(angle) * 1
            );
            chair.castShadow = true;
            scene.add(chair);
        }
    }
}

/**
 * Add lighting with warm café tones
 */
function addLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Directional light (simulating sunlight through window)
    const directionalLight = new THREE.DirectionalLight(0xffd700, 0.8); // Warm golden light
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Additional warm point lights for café ambiance
    const warmLight1 = new THREE.PointLight(0xff8c00, 0.5, 10);
    warmLight1.position.set(-5, 2, 0);
    scene.add(warmLight1);

    const warmLight2 = new THREE.PointLight(0xffa500, 0.4, 10);
    warmLight2.position.set(5, 2, -2);
    scene.add(warmLight2);

    // Counter light (hanging pendant)
    const counterLight = new THREE.PointLight(0xffd700, 0.6, 8);
    counterLight.position.set(0, 2.5, 2);
    scene.add(counterLight);
}

/**
 * Set up resize handling for responsive rendering
 */
function setupResizeHandling(container) {
    resizeObserver = new ResizeObserver(() => {
        if (!camera || !renderer) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
    });

    resizeObserver.observe(container);
}

/**
 * Start the render loop
 */
let animationId;
function startRenderLoop() {
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        if (controls) {
            controls.update();
        }

        renderer.render(scene, camera);
    }
    
    animate();
}

/**
 * Stop the render loop
 */
export function stopRenderLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/**
 * Clean up resources
 */
export function dispose() {
    stopRenderLoop();
    
    if (resizeObserver) {
        resizeObserver.disconnect();
    }

    if (controls) {
        controls.dispose();
    }

    if (renderer) {
        renderer.dispose();
    }

    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}

/**
 * Get current camera position (for potential future use)
 */
export function getCameraPosition() {
    return camera ? camera.position.clone() : null;
}

/**
 * Set camera position
 */
export function setCameraPosition(position) {
    if (camera) {
        camera.position.copy(position);
        camera.updateProjectionMatrix();
    }
}

// Auto-initialize if running in browser with a container
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // This will be called from main.js
    window.initCaféScene = initScene;
}