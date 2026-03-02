export class AppManager {
  constructor(deviceController) {
    this.deviceController = deviceController;
    this.apps = [];
  }

  async loadInstalledApps() {
    const appList = document.getElementById('app-list');
    if (!appList) return;
    
    appList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading applications...</p>';
    
    try {
      this.apps = await this.deviceController.getInstalledApps();
      
      if (this.apps.length === 0) {
        appList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No applications found</p>';
        return;
      }
      
      appList.innerHTML = '';
      
      this.apps.forEach(app => {
        const item = this.createAppItem(app);
        appList.appendChild(item);
      });
    } catch (error) {
      console.error('Error loading apps:', error);
      appList.innerHTML = '<p style="text-align: center; color: var(--error);">Failed to load applications</p>';
    }
  }

  createAppItem(app) {
    const item = document.createElement('div');
    item.className = 'app-item';
    
    const iconLetter = app.name.charAt(0).toUpperCase();
    const iconColor = this.getColorFromString(app.packageName);
    
    item.innerHTML = `
      <div class="app-icon" style="background: ${iconColor};">
        ${iconLetter}
      </div>
      <div class="app-info">
        <div class="app-name">${app.name}</div>
        <div class="app-package">${app.packageName}</div>
      </div>
      <div class="app-actions">
        <button class="action-btn" data-action="launch" title="Launch">
          ▶️
        </button>
        <button class="action-btn" data-action="stop" title="Force Stop">
          ⏹️
        </button>
        <button class="action-btn" data-action="clear" title="Clear Data">
          🗑️
        </button>
        <button class="action-btn" data-action="uninstall" title="Uninstall">
          ❌
        </button>
      </div>
    `;
    
    item.querySelector('[data-action="launch"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.launchApp(app);
    });
    
    item.querySelector('[data-action="stop"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.forceStopApp(app);
    });
    
    item.querySelector('[data-action="clear"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearAppData(app);
    });
    
    item.querySelector('[data-action="uninstall"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.uninstallApp(app);
    });
    
    return item;
  }

  getColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
      '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  }

  async launchApp(app) {
    try {
      await this.deviceController.launchApp(app.packageName);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Launching ${app.name}`, type: 'info' }
      }));
    } catch (error) {
      console.error('Error launching app:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to launch app', type: 'error' }
      }));
    }
  }

  async forceStopApp(app) {
    try {
      await this.deviceController.forceStopApp(app.packageName);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Stopped ${app.name}`, type: 'success' }
      }));
    } catch (error) {
      console.error('Error stopping app:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to stop app', type: 'error' }
      }));
    }
  }

  async clearAppData(app) {
    if (!confirm(`Clear all data for ${app.name}?`)) return;
    
    try {
      await this.deviceController.clearAppData(app.packageName);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Cleared data for ${app.name}`, type: 'success' }
      }));
    } catch (error) {
      console.error('Error clearing app data:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to clear app data', type: 'error' }
      }));
    }
  }

  async uninstallApp(app) {
    if (!confirm(`Uninstall ${app.name}?`)) return;
    
    try {
      await this.deviceController.uninstallApp(app.packageName);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Uninstalled ${app.name}`, type: 'success' }
      }));
      
      setTimeout(() => {
        this.loadInstalledApps();
      }, 1000);
    } catch (error) {
      console.error('Error uninstalling app:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to uninstall app', type: 'error' }
      }));
    }
  }
}
