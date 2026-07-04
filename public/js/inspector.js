// Inspector Panel for Hotspot Inspection System
// Creates and manages the inspector panel that appears when a hotspot is clicked

class InspectorPanel {
  constructor() {
    this.isVisible = false;
    this.panel = this.createPanel();
    this.titleElement = this.panel.querySelector('.inspector-title');
    this.contentElement = this.panel.querySelector('.inspector-content');
    this.closeButton = this.panel.querySelector('.inspector-close');
    
    // Bind event listeners
    this.closeButton.addEventListener('click', () => this.hide());
    
    // Clicking outside the panel content also closes it
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });
    
    // Prevent clicks inside the panel from closing it
    this.panel.querySelector('.insider').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  createPanel() {
    // Create the panel element
    const panel = document.createElement('div');
    panel.className = 'inspector-panel';
    panel.innerHTML = `
      <div class="insider">
        <div class="inspector-header">
          <h2 class="inspector-title"></h2>
          <button class="inspector-close">&times;</button>
        </div>
        <div class="inspector-content"></div>
      </div>
    `;
    
    // Style the panel
    panel.style.position = 'fixed';
    panel.style.top = '20px';
    panel.style.right = '20px';
    panel.style.width = '300px';
    panel.style.maxHeight = '80vh';
    panel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.zIndex = '1000';
    panel.style.overflow = 'hidden';
    panel.style.fontFamily = 'Arial, sans-serif';
    
    // Style the inner content
    const inner = panel.querySelector('.insider');
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.height = '100%';
    inner.style.width = '100%';
    
    // Style the header
    const header = inner.querySelector('.inspector-header');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '12px 16px';
    header.style.borderBottom = '1px solid #eee';
    
    // Style the title
    const title = inner.querySelector('.inspector-title');
    title.style.margin = '0';
    title.style.fontSize = '1.25rem';
    title.style.color = '#333';
    
    // Style the close button
    const closeBtn = inner.querySelector('.inspector-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#666';
    closeBtn.style.width = '30px';
    closeBtn.style.height = '30px';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.transition = 'background-color 0.2s';
    
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = '#f0f0f0';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });
    
    // Style the content
    const content = inner.querySelector('.inspector-content');
    content.style.flex = '1';
    content.style.padding = '16px';
    content.style.overflowY = 'auto';
    content.style.fontSize = '0.95rem';
    content.style.color = '#555';
    content.style.lineHeight = '1.5';
    
    // Add to document
    document.body.appendChild(panel);
    
    return panel;
  }
  
  show(title, content) {
    this.titleElement.textContent = title;
    this.contentElement.innerHTML = content;
    this.panel.style.display = 'flex';
    this.isVisible = true;
  }
  
  hide() {
    this.panel.style.display = 'none';
    this.isVisible = false;
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      // This method should be called with title and content, so we don't use toggle without args
      // We'll keep it for completeness but note that show requires arguments
    }
  }
}

// Export the class
export { InspectorPanel };