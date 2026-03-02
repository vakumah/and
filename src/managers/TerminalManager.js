export class TerminalManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.history = [];
    this.historyIndex = -1;
    
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('terminal-command', (e) => {
      this.executeCommand(e.detail);
    });
  }

  executeCommand(command) {
    this.history.push(command);
    this.historyIndex = this.history.length;
    
    this.appendOutput(`$ ${command}`, 'command');
    this.wsManager.send('terminal-command', { command });
  }

  appendOutput(text, type = 'output') {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    
    const line = document.createElement('div');
    line.style.color = type === 'command' ? 'var(--accent-light)' : 'var(--text-primary)';
    line.style.marginBottom = '4px';
    line.textContent = text;
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  clear() {
    const output = document.getElementById('terminal-output');
    if (output) {
      output.innerHTML = '';
    }
  }
}
