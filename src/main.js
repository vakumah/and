import './styles/main.css';
import { DeviceController } from './controllers/DeviceController.js';
import { UIManager } from './managers/UIManager.js';
import { WebSocketManager } from './managers/WebSocketManager.js';
import { ScreenManager } from './managers/ScreenManager.js';
import { FileManager } from './managers/FileManager.js';
import { AppManager } from './managers/AppManager.js';
import { LogcatManager } from './managers/LogcatManager.js';
import { TerminalManager } from './managers/TerminalManager.js';

class AndroidWebController {
  constructor() {
    this.deviceController = new DeviceController();
    this.wsManager = new WebSocketManager();
    this.uiManager = new UIManager();
    this.screenManager = null;
    this.fileManager = null;
    this.appManager = null;
    this.logcatManager = null;
    this.terminalManager = null;
    
    this.init();
  }

  async init() {
    await this.uiManager.render();
    
    this.screenManager = new ScreenManager(this.wsManager);
    this.fileManager = new FileManager(this.deviceController);
    this.appManager = new AppManager(this.deviceController);
    this.logcatManager = new LogcatManager(this.wsManager);
    this.terminalManager = new TerminalManager(this.wsManager);
    
    this.setupEventListeners();
    this.connectWebSocket();
    this.startDevicePolling();
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.uiManager.toggleTheme();
    });

    // Navigation
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.nav;
        this.uiManager.switchView(view);
      });
    });

    // Screen controls
    document.getElementById('screenshot-btn')?.addEventListener('click', () => {
      this.screenManager.takeScreenshot();
    });

    document.getElementById('record-btn')?.addEventListener('click', () => {
      this.screenManager.toggleRecording();
    });

    document.getElementById('rotate-btn')?.addEventListener('click', () => {
      this.screenManager.rotateScreen();
    });

    document.getElementById('home-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('HOME');
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('BACK');
    });

    document.getElementById('recent-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('APP_SWITCH');
    });

    // Power controls
    document.getElementById('power-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('POWER');
    });

    document.getElementById('volume-up-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('VOLUME_UP');
    });

    document.getElementById('volume-down-btn')?.addEventListener('click', () => {
      this.deviceController.pressKey('VOLUME_DOWN');
    });

    // File upload
    document.getElementById('apk-upload')?.addEventListener('change', (e) => {
      this.fileManager.handleFileUpload(e.target.files[0]);
    });

    document.getElementById('upload-btn')?.addEventListener('click', () => {
      document.getElementById('apk-upload').click();
    });

    // Refresh buttons
    document.getElementById('refresh-apps')?.addEventListener('click', () => {
      this.appManager.loadInstalledApps();
    });

    document.getElementById('refresh-files')?.addEventListener('click', () => {
      this.fileManager.loadFileSystem();
    });

    // Logcat controls
    document.getElementById('clear-logcat')?.addEventListener('click', () => {
      this.logcatManager.clearLogs();
    });

    document.getElementById('logcat-filter')?.addEventListener('input', (e) => {
      this.logcatManager.setFilter(e.target.value);
    });

    document.getElementById('logcat-level')?.addEventListener('change', (e) => {
      this.logcatManager.setLevel(e.target.value);
    });
  }

  connectWebSocket() {
    this.wsManager.connect();
    
    this.wsManager.on('device-status', (data) => {
      this.uiManager.updateDeviceStatus(data);
    });

    this.wsManager.on('screen-frame', (data) => {
      this.screenManager.renderFrame(data);
    });

    this.wsManager.on('logcat', (data) => {
      this.logcatManager.appendLog(data);
    });

    this.wsManager.on('terminal-output', (data) => {
      this.terminalManager.appendOutput(data);
    });

    this.wsManager.on('connection-status', (status) => {
      this.uiManager.updateConnectionStatus(status);
    });
  }

  async startDevicePolling() {
    setInterval(async () => {
      const status = await this.deviceController.getDeviceStatus();
      this.uiManager.updateDeviceStatus(status);
    }, 2000);

    // Initial load
    setTimeout(() => {
      this.appManager.loadInstalledApps();
      this.fileManager.loadFileSystem();
    }, 1000);
  }
}

// Initialize app
new AndroidWebController();
