// System Initialization - Enables System-Only Mode
// This script should be imported and run at the root of your application

import SystemDataValidator from './security/SystemDataValidator';
import AutoDataCollector from './utils/AutoDataCollector';

class SystemInit {
  constructor() {
    this.validator = new SystemDataValidator();
    this.dataCollector = new AutoDataCollector();
    this.systemOnlyMode = process.env.REACT_APP_SYSTEM_ONLY_MODE === 'true';
    this.blockUserInput = process.env.REACT_APP_BLOCK_USER_INPUT === 'true';
    
    this.init();
  }

  init() {
    console.log('🔒 Initializing System-Only Mode...');
    
    if (this.systemOnlyMode) {
      this.enableSystemOnlyMode();
      this.blockAllUserInputs();
      this.setupSystemDataCollection();
      this.displaySystemOnlyBanner();
    }
    
    console.log('✅ System-Only Mode Activated');
  }

  enableSystemOnlyMode() {
    // Override console methods to prevent user debugging
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      console.debug = () => {};
    }

    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
  }

  blockAllUserInputs() {
    if (!this.blockUserInput) return;

    // Block all form inputs
    const blockInputs = () => {
      const inputs = document.querySelectorAll('input, textarea, select, button[type="submit"]');
      inputs.forEach(input => {
        this.validator.blockUserInput(input);
        
        // Add visual indicator
        if (input.tagName !== 'BUTTON') {
          input.placeholder = 'System-only mode - Input disabled';
        } else {
          input.textContent = 'Disabled (System Mode)';
        }
      });
    };

    // Block inputs on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', blockInputs);
    } else {
      blockInputs();
    }

    // Block inputs added dynamically
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const inputs = node.querySelectorAll ? node.querySelectorAll('input, textarea, select, button[type="submit"]') : [];
            inputs.forEach(input => {
              this.validator.blockUserInput(input);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Block form submissions
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      console.warn('Form submission blocked - System operates in automated mode only');
      return false;
    }, true);
  }

  setupSystemDataCollection() {
    // Start automated data collection
    this.dataCollector.startTracking();

    // Setup automated metrics collection
    setInterval(() => {
      this.dataCollector.recordSystemInteraction('automated_metrics', {
        timestamp: new Date().toISOString(),
        performance: {
          memory: performance.memory ? performance.memory.usedJSHeapSize : null,
          navigation: performance.navigation ? performance.navigation.type : null
        }
      });
    }, 60000); // Every minute

    // Setup system heartbeat
    setInterval(() => {
      this.dataCollector.recordSystemInteraction('system_heartbeat', {
        status: 'active',
        timestamp: new Date().toISOString(),
        mode: 'system-only'
      });
    }, 300000); // Every 5 minutes
  }

  displaySystemOnlyBanner() {
    // Create system-only mode banner
    const banner = document.createElement('div');
    banner.id = 'system-only-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: white;
      text-align: center;
      padding: 8px;
      font-weight: bold;
      z-index: 9999;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    banner.textContent = '🔒 SYSTEM-ONLY MODE ACTIVE - User Input Disabled | Automated Data Collection Enabled';
    
    document.body.appendChild(banner);

    // Adjust body padding to accommodate banner
    document.body.style.paddingTop = '40px';
  }

  // Method to temporarily allow system input (for legitimate system operations)
  enableSystemInput(inputElement, duration = 5000) {
    if (!inputElement) return;

    const originalValue = inputElement.value;
    inputElement.disabled = false;
    inputElement.readOnly = false;
    inputElement.style.backgroundColor = '#fef3c7';
    inputElement.placeholder = 'System input enabled temporarily...';

    setTimeout(() => {
      this.validator.blockUserInput(inputElement);
      inputElement.value = originalValue;
    }, duration);
  }

  // Method to validate and process system-generated data
  processSystemData(data, source = 'system') {
    if (!this.validator.validateSystemSource(data, source)) {
      console.warn('Rejected non-system data');
      return false;
    }

    const systemData = this.validator.generateSystemData(data.type || 'system_operation', data);
    this.dataCollector.trackAssignmentInteractions(
      data.id || 'system-generated',
      systemData
    );

    return true;
  }
}

// Export singleton instance
const systemInit = new SystemInit();
export default systemInit;
