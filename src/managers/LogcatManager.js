export class LogcatManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.logs = [];
    this.filter = '';
    this.level = 'all';
    this.maxLogs = 1000;
  }

  appendLog(logData) {
    this.logs.push(logData);
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    if (this.shouldDisplayLog(logData)) {
      this.renderLog(logData);
    }
  }

  shouldDisplayLog(log) {
    if (this.level !== 'all' && log.level !== this.level) {
      return false;
    }
    
    if (this.filter && !log.message.toLowerCase().includes(this.filter.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  renderLog(log) {
    const output = document.getElementById('logcat-output');
    if (!output) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${log.level}`;
    
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    entry.textContent = `[${timestamp}] [${log.level.toUpperCase()}] ${log.tag}: ${log.message}`;
    
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
  }

  setFilter(filter) {
    this.filter = filter;
    this.refreshDisplay();
  }

  setLevel(level) {
    this.level = level;
    this.refreshDisplay();
  }

  refreshDisplay() {
    const output = document.getElementById('logcat-output');
    if (!output) return;
    
    output.innerHTML = '';
    
    this.logs.forEach(log => {
      if (this.shouldDisplayLog(log)) {
        this.renderLog(log);
      }
    });
  }

  clearLogs() {
    this.logs = [];
    const output = document.getElementById('logcat-output');
    if (output) {
      output.innerHTML = '';
    }
    
    this.wsManager.send('clear-logcat', {});
  }
}
