import { initScene } from './scene-renderer.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const loadingElement = document.getElementById('loading');
    
    try {
        // Initialize the Three.js scene
        const { scene, camera, renderer, controls } = initScene(container);
        
        // Hide loading element
        loadingElement.style.display = 'none';
        
        // Add keyboard controls for better navigation
        document.addEventListener('keydown', (event) => {
            const speed = 0.1;
            switch (event.key.toLowerCase()) {
                case 'w':
                    camera.position.z -= speed;
                    break;
                case 's':
                    camera.position.z += speed;
                    break;
                case 'a':
                    camera.position.x -= speed;
                    break;
                case 'd':
                    camera.position.x += speed;
                    break;
                case 'q':
                    camera.position.y += speed;
                    break;
                case 'e':
                    camera.position.y -= speed;
                    break;
                case 'r':
                    // Reset camera position
                    camera.position.set(5, 4, 10);
                    camera.lookAt(0, 0, 0);
                    controls.update();
                    break;
            }
            
            // Update camera after movement
            camera.updateProjectionMatrix();
        });
        
        // Handle window focus/blur to pause/resume rendering
        window.addEventListener('focus', () => {
            // Render loop continues automatically
        });
        
        window.addEventListener('blur', () => {
            // Could pause rendering here for performance
        });
        
        // Make controls globally accessible for debugging
        window.controls = controls;
        window.scene = scene;
        window.camera = camera;
        window.renderer = renderer;
        
        console.log('Café Three.js scene initialized successfully');
        console.log('Controls:', controls);
        
    } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
        loadingElement.innerHTML = '<h1>Error Loading Scene</h1><p>' + error.message + '</p>';;
    }
});

// Export for potential use in other modules
export { initScene };