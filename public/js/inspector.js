// Inspector panel for displaying hotspot information
class InspectorPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.createPanel();
        this.hide(); // Start hidden
    }

    createPanel() {
        // Create the panel container
        this.panel = document.createElement('div');
        this.panel.className = 'inspector-panel';
        this.panel.innerHTML = `
            <div class="inspector-header">
                <h3 id="inspector-title">Object Information</h3>
                <button class="inspector-close">&times;</button>
            </div>
            <div class="inspector-content">
                <p id="inspector-description">Click on a hotspot to learn more about this object.</p>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .inspector-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                max-height: 80vh;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                overflow: hidden;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                z-index: 1000;
            }
            
            .inspector-panel.visible {
                transform: translateX(0);
            }
            
            .inspector-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .inspector-header h3 {
                margin: 0;
                font-size: 1.4rem;
                font-weight: 600;
            }
            
            .inspector-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.8rem;
                cursor: pointer;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .inspector-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .inspector-content {
                padding: 20px;
                overflow-y: auto;
                max-height: calc(80vh - 80px);
            }
            
            .inspector-content p {
                line-height: 1.6;
                color: #333;
                margin: 0 0 16px 0;
            }
            
            .inspector-content h4 {
                color: #555;
                margin: 0 0 12px 0;
            }
            
            .inspector-content .metadata {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
                color: #666;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid #eee;
            }
            
            @media (max-width: 768px) {
                .inspector-panel {
                    width: 90%;
                    max-width: 90%;
                }
            }
        `;

        document.head.appendChild(style);

        // Add event listener for close button
        const closeBtn = this.panel.querySelector('.inspector-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Add to document
        document.body.appendChild(this.panel);
    }

    show(hotspotData) {
        if (!this.panel) return;

        // Update content
        const titleElement = this.panel.querySelector('#inspector-title');
        const descriptionElement = this.panel.querySelector('#inspector-description');
        
        titleElement.textContent = hotspotData.name || 'Object Information';
        
        // Create rich content
        let content = `<p>${hotspotData.description}</p>`;
        
        if (hotspotData.era) {
            content += `<div class="${hotspotData.era}"`;
        }
        
        descriptionElement.innerHTML = content;
        
        // Show panel
        this.panel.classList.add('visible');
        this.isVisible = true;
    }

    hide() {
        if (!this.panel) return;
        
        this.panel.classList.remove('visible');
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            // This shouldn't be called directly without data
        }
    }

    isShown() {
        return this.isVisible;
    }
}

// Make available globally
window.InspectorPanel = InspectorPanel;