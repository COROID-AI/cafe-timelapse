import { initScene } from './scene-renderer.js';
import { PeriodManager } from './period-manager.js';
import { AudioManager } from './audio-manager.js';
import { initStatsPanel, updateStats } from './stats-panel.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('container');
  const loadingElement = document.getElementById('loading');

  // Declare variables that will be assigned in the try block
  let scene, camera, renderer, periodManager, audioManager;

  try {
    // Initialize Three.js scene
    const sceneData = initScene(container);
    scene = sceneData.scene;
    camera = sceneData.camera;
    renderer = sceneData.renderer;

    // Initialize Audio Manager
    audioManager = new AudioManager();

    // Initialize Period Manager and set default era
    periodManager = new PeriodManager();
    periodManager.selectEra(1945);

    // Connect PeriodManager to AudioManager
    periodManager.onEraChange((era) => {
      audioManager.onEraChange(era.year);
      // Update year display
      const yearElement = document.getElementById('current-year');
      if (yearElement) {
        yearElement.textContent = era.year || '1945';
      }
      // Update era name and description
      const eraNameElement = document.getElementById('era-name');
      const eraDescriptionElement = document.getElementById('era-description');
      if (eraNameElement && eraDescriptionElement) {
        eraNameElement.textContent = `${era.year} — ${era.name}`;
        eraDescriptionElement.textContent = era.description || '';
      }
      // Start transition to new era
      sceneData.startTransitionToEra(era.data, 1500);
    });

    // Initialize stats panel
    initStatsPanel();

    // Initialize timeline slider
    const initTimelineSlider = () => {
      const timelineContainer = document.getElementById('timeline-markers');
      const timelineFill = document.getElementById('timeline-fill');

      if (!timelineContainer || !timelineFill) {
        console.error('Timeline elements not found');
        return;
      }

      // Get available years from periodManager
      const years = periodManager.getAvailableYears();

      // Clear any existing markers
      timelineContainer.innerHTML = '';

      // Create markers for each year
      years.forEach((year) => {
        const marker = document.createElement('div');
        marker.className = 'timeline-marker'; 
        marker.dataset.year = year;

        marker.addEventListener('click', () => {
          periodManager.selectEra(year);
          updateMarkerActiveState(year);
        });

        timelineContainer.appendChild(marker);
      });

      // Add click event to the timeline bar
      const timelineBar = document.querySelector('.timeline-bar');
      if (timelineBar) {
        timelineBar.addEventListener('click', (e) => {
          const rect = timelineBar.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const index = Math.round(percent * (years.length - 1));
          const year = years[index];
          if (year !== undefined) {
            periodManager.selectEra(year);
            updateMarkerActiveState(year);
          }
        });
      }

      // Function to update the active marker
      const updateMarkerActiveState = (year) => {
        const markers = timelineContainer.querySelectorAll('.timeline-marker');
        markers.forEach(marker => {
          const markerYear = parseInt(marker.dataset.year);
          if (markerYear === year) {
            marker.classList.add('active');
          } else {
            marker.classList.remove('active');
          }
        });
      };

      // Function to update the timeline fill
      const updateTimelineFill = () => {
        const years = periodManager.getAvailableYears();
        const currentIndex = years.indexOf(periodManager.currentYear);
        const percent = (currentIndex / (years.length - 1)) * 100;
        timelineFill.style.width = `${percent}%`;
      };

      // Set initial state
      updateMarkerActiveState(periodManager.currentYear);
      updateTimelineFill();

      // Subscribe to era changes to update the timeline UI
      periodManager.onEraChange((era) => {
        updateMarkerActiveState(era.year);
        updateTimelineFill();
      });
    };

    // Initialize timeline slider
    initTimelineSlider();

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
      // Resume audio context if suspended
      if (audioManager) {
        audioManager.resume();
      }
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