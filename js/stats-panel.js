// Simple FPS stats panel for performance monitoring
// Creates a small FPS counter in the top-left corner

class StatsPanel {
  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '0px';
    this.container.style.left = '0px';
    this.container.style.padding = '2px 4px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.container.style.color = '#0ff';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '12px';
    this.container.style.lineHeight = '15px';
    this.container.style.zIndex = '1000';
    
    this.fpsText = document.createElement('span');
    this.fpsText.textContent = 'FPS: --';
    this.container.appendChild(this.fpsText);
    
    document.body.appendChild(this.container);
    
    this.frames = 0;
    this.lastTime = performance.now();
  }
  
  update() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      const fps = Math.round((this.frames * 1000) / (now - this.lastTime));
      this.fpsText.textContent = `FPS: ${fps}`;
      this.frames = 0;
      this.lastTime = now;
    }
  }
}

// Export as ES module
export { StatsPanel };