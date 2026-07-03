/**
 * StatsPanel - Performance monitoring overlay for the café timelapse scene
 * Displays FPS, render time, and other performance metrics
 */

let statsPanel = null;
let fpsCounter = 0;
let lastTime = performance.now();
let fps = 0;
let frameCount = 0;

/**
 * Initialize the stats panel UI
 * @returns {HTMLElement} The stats panel element
 */
export function initStatsPanel() {
    if (statsPanel) {
        return statsPanel;
    }

    statsPanel = document.createElement('div');
    statsPanel.id = 'stats-panel';
    statsPanel.style.position = 'absolute';
    statsPanel.style.top = '10px';
    statsPanel.style.right = '10px';
    statsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    statsPanel.style.color = '#00ff00';
    statsPanel.style.fontFamily = 'monospace';
    statsPanel.style.fontSize = '12px';
    statsPanel.style.padding = '10px';
    statsPanel.style.borderRadius = '5px';
    statsPanel.style.zIndex = '1000';
    statsPanel.style.pointerEvents = 'none';

    statsPanel.innerHTML = `
        <div><strong>Stats</strong></div>
        <div>FPS: <span id="fps-count">--</span></div>
        <div>Render: <span id="render-time">--</span>ms</div>
        <div>Year: <span id="current-year">1945</span></div>
    `;

    document.body.appendChild(statsPanel);
    return statsPanel;
}

/**
 * Update the stats panel with current values
 * @param {number} year - Current year/era
 * @param {number} renderTime - Last frame render time in ms
 */
export function updateStats(year, renderTime) {
    if (!statsPanel) {
        initStatsPanel();
    }

    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    frameCount++;
    if (delta >= 1000) {
        fps = Math.round((frameCount * 1000) / delta);
        frameCount = 0;
    }

    const fpsElement = document.getElementById('fps-count');
    const renderElement = document.getElementById('render-time');
    const yearElement = document.getElementById('current-year');

    if (fpsElement) {
        fpsElement.textContent = fps;
    }
    if (renderElement) {
        renderElement.textContent = renderTime ? renderTime.toFixed(1) : '--';
    }
    if (yearElement) {
        yearElement.textContent = year || '1945';
    }
}

/**
 * Remove the stats panel from the DOM
 */
export function destroyStatsPanel() {
    if (statsPanel && statsPanel.parentNode) {
        statsPanel.parentNode.removeChild(statsPanel);
    }
    statsPanel = null;
}

// Auto-initialize if running in browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.StatsPanel = {
    init: initStatsPanel,
    update: updateStats,
    destroy: destroyStatsPanel
  };
}