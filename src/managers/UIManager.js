export class UIManager {
  constructor() {
    this.currentView = 'screen';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.sidebarOpen = false;
    this.rightPanelOpen = false;
  }

  async render() {
    const app = document.getElementById('app');
    app.innerHTML = this.getTemplate();
    this.applyTheme();
    this.attachEventListeners();
    this.setupGlobalEventListeners();
  }

  getTemplate() {
    return `
      <div class="topbar">
        <div class="topbar-left">
          <button class="btn btn-icon" id="menu-toggle">
            <span>☰</span>
          </button>
          <div class="logo">
            <div class="logo-icon">🤖</div>
            <span>Android Controller</span>
          </div>
          <div class="connection-status">
            <span class="status-dot" id="status-dot"></span>
            <span id="status-text">Connecting...</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="session-timer">
            <span>⏱️</span>
            <span id="timer">00:00:00</span>
          </div>
          <button class="btn btn-icon" id="theme-toggle">
            <span>🌙</span>
          </button>
          <button class="btn btn-icon" id="info-toggle">
            <span>ℹ️</span>
          </button>
        </div>
      </div>

      <div class="main-container">
        <aside class="sidebar" id="sidebar">
          <nav class="sidebar-nav">
            <button class="nav-item active" data-nav="screen">
              <span class="nav-icon">📱</span>
              <span>Screen</span>
            </button>
            <button class="nav-item" data-nav="apps">
              <span class="nav-icon">📦</span>
              <span>Apps</span>
            </button>
            <button class="nav-item" data-nav="files">
              <span class="nav-icon">📁</span>
              <span>Files</span>
            </button>
            <button class="nav-item" data-nav="logcat">
              <span class="nav-icon">📋</span>
              <span>Logcat</span>
            </button>
            <button class="nav-item" data-nav="terminal">
              <span class="nav-icon">💻</span>
              <span>Terminal</span>
            </button>
            <button class="nav-item" data-nav="settings">
              <span class="nav-icon">⚙️</span>
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        <div class="content">
          <main class="main-view">
            ${this.getScreenView()}
            ${this.getAppsView()}
            ${this.getFilesView()}
            ${this.getLogcatView()}
            ${this.getTerminalView()}
            ${this.getSettingsView()}
          </main>

          <aside class="right-panel" id="right-panel">
            <div class="panel-header">
              <h3 class="panel-title">Device Info</h3>
              <button class="btn btn-icon" id="panel-close">
                <span>✕</span>
              </button>
            </div>
            <div class="panel-content">
              ${this.getDeviceInfoPanel()}
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  getScreenView() {
    return `
      <div class="view-content active" data-view="screen">
        <div class="screen-container">
          <div class="screen-wrapper">
            <canvas id="screen-canvas" class="screen-canvas" width="1080" height="1920"></canvas>
            <div class="screen-overlay"></div>
            <div class="screen-controls">
              <button class="control-btn" id="back-btn" title="Back">
                <span>◀</span>
              </button>
              <button class="control-btn" id="home-btn" title="Home">
                <span>⚫</span>
              </button>
              <button class="control-btn" id="recent-btn" title="Recent">
                <span>▢</span>
              </button>
              <button class="control-btn" id="screenshot-btn" title="Screenshot">
                <span>📷</span>
              </button>
              <button class="control-btn" id="record-btn" title="Record">
                <span>⏺️</span>
              </button>
              <button class="control-btn" id="rotate-btn" title="Rotate">
                <span>🔄</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getAppsView() {
    return `
      <div class="view-content" data-view="apps">
        <div class="panel-header">
          <h3 class="panel-title">Installed Applications</h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" id="upload-btn">
              <span>📤</span>
              <span>Install APK</span>
            </button>
            <button class="btn btn-icon" id="refresh-apps">
              <span>🔄</span>
            </button>
          </div>
        </div>
        <div class="panel-content">
          <input type="file" id="apk-upload" accept=".apk" style="display: none;">
          <div id="upload-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" id="upload-progress-fill"></div>
            </div>
            <p id="upload-status" style="margin-top: 8px; text-align: center;"></p>
          </div>
          <div class="app-list" id="app-list">
            <p style="text-align: center; color: var(--text-muted);">Loading applications...</p>
          </div>
        </div>
      </div>
    `;
  }

  getFilesView() {
    return `
      <div class="view-content" data-view="files">
        <div class="panel-header">
          <h3 class="panel-title">File Manager</h3>
          <button class="btn btn-icon" id="refresh-files">
            <span>🔄</span>
          </button>
        </div>
        <div class="panel-content">
          <div class="file-browser">
            <div class="file-path" id="current-path">/sdcard</div>
            <div class="file-list" id="file-list">
              <p style="text-align: center; color: var(--text-muted);">Loading files...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getLogcatView() {
    return `
      <div class="view-content" data-view="logcat">
        <div class="logcat-container">
          <div class="logcat-toolbar">
            <input type="text" class="logcat-filter" id="logcat-filter" placeholder="Filter logs...">
            <select class="logcat-select" id="logcat-level">
              <option value="all">All Levels</option>
              <option value="verbose">Verbose</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
            <button class="btn" id="clear-logcat">
              <span>🗑️</span>
              <span>Clear</span>
            </button>
          </div>
          <div class="logcat-output" id="logcat-output"></div>
        </div>
      </div>
    `;
  }

  getTerminalView() {
    return `
      <div class="view-content" data-view="terminal">
        <div class="terminal-container">
          <div class="terminal-output" id="terminal-output"></div>
          <div class="terminal-input-wrapper">
            <input type="text" class="terminal-input" id="terminal-input" placeholder="Enter ADB command...">
            <button class="btn btn-primary" id="terminal-send">
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getSettingsView() {
    return `
      <div class="view-content" data-view="settings">
        <div class="panel-header">
          <h3 class="panel-title">Settings</h3>
        </div>
        <div class="panel-content">
          <div class="info-card">
            <h4 style="margin-bottom: 16px;">Display Settings</h4>
            <div class="info-row">
              <span class="info-label">Screen Quality</span>
              <select class="logcat-select" id="quality-select">
                <option value="high">High</option>
                <option value="medium" selected>Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="info-row">
              <span class="info-label">Frame Rate</span>
              <select class="logcat-select" id="fps-select">
                <option value="60">60 FPS</option>
                <option value="30" selected>30 FPS</option>
                <option value="15">15 FPS</option>
              </select>
            </div>
          </div>
          <div class="info-card" style="margin-top: 16px;">
            <h4 style="margin-bottom: 16px;">Power Controls</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button class="btn" id="power-btn">
                <span>🔌</span>
                <span>Power Button</span>
              </button>
              <button class="btn" id="volume-up-btn">
                <span>🔊</span>
                <span>Volume Up</span>
              </button>
              <button class="btn" id="volume-down-btn">
                <span>🔉</span>
                <span>Volume Down</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getDeviceInfoPanel() {
    return `
      <div class="device-info">
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="info-value" id="device-status">Offline</span>
          </div>
          <div class="info-row">
            <span class="info-label">Android Version</span>
            <span class="info-value" id="android-version">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Model</span>
            <span class="info-value" id="device-model">-</span>
          </div>
          <div class="info-row">
            <span class="info-label">Architecture</span>
            <span class="info-value" id="device-arch">-</span>
          </div>
        </div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value" id="battery-value">0%</div>
            <div class="metric-label">Battery</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" id="cpu-value">0%</div>
            <div class="metric-label">CPU</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" id="memory-value">0%</div>
            <div class="metric-label">Memory</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" id="storage-value">0%</div>
            <div class="metric-label">Storage</div>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      this.toggleSidebar();
    });

    document.getElementById('info-toggle')?.addEventListener('click', () => {
      this.toggleRightPanel();
    });

    document.getElementById('panel-close')?.addEventListener('click', () => {
      this.toggleRightPanel();
    });

    document.getElementById('terminal-send')?.addEventListener('click', () => {
      this.sendTerminalCommand();
    });

    document.getElementById('terminal-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendTerminalCommand();
      }
    });

    this.startTimer();
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    this.sidebarOpen = !this.sidebarOpen;
    sidebar.classList.toggle('open', this.sidebarOpen);
  }

  toggleRightPanel() {
    const panel = document.getElementById('right-panel');
    this.rightPanelOpen = !this.rightPanelOpen;
    panel.classList.toggle('open', this.rightPanelOpen);
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    document.querySelectorAll('.view-content').forEach(view => {
      view.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
    document.querySelector(`[data-nav="${viewName}"]`)?.classList.add('active');
    
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
      document.getElementById('sidebar').classList.remove('open');
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const icon = document.querySelector('#theme-toggle span');
    if (icon) {
      icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  updateDeviceStatus(status) {
    document.getElementById('device-status').textContent = status.connected ? 'Online' : 'Offline';
    document.getElementById('android-version').textContent = status.androidVersion || '-';
    document.getElementById('device-model').textContent = status.model || '-';
    document.getElementById('device-arch').textContent = status.architecture || '-';
    document.getElementById('battery-value').textContent = `${status.battery || 0}%`;
    document.getElementById('cpu-value').textContent = `${status.cpu || 0}%`;
    document.getElementById('memory-value').textContent = `${status.memory || 0}%`;
    document.getElementById('storage-value').textContent = `${status.storage || 0}%`;
  }

  updateConnectionStatus(connected) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    if (connected) {
      dot.classList.add('connected');
      text.textContent = 'Connected';
    } else {
      dot.classList.remove('connected');
      text.textContent = 'Disconnected';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="font-size: 20px;">${this.getToastIcon(type)}</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  sendTerminalCommand() {
    const input = document.getElementById('terminal-input');
    const command = input.value.trim();
    
    if (command) {
      window.dispatchEvent(new CustomEvent('terminal-command', { detail: command }));
      input.value = '';
    }
  }

  startTimer() {
    let seconds = 0;
    setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      const timerEl = document.getElementById('timer');
      if (timerEl) {
        timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }, 1000);
  }
}


  setupGlobalEventListeners() {
    window.addEventListener('toast', (e) => {
      this.showToast(e.detail.message, e.detail.type);
    });
  }
