import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class LogcatService extends EventEmitter {
  constructor(adbService) {
    super();
    this.adbService = adbService;
    this.logcatProcess = null;
  }

  start() {
    if (this.logcatProcess) {
      return;
    }

    this.logcatProcess = spawn('adb', [
      '-s', this.adbService.deviceId,
      'logcat',
      '-v', 'time'
    ]);

    this.logcatProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      
      lines.forEach(line => {
        if (line.trim().length === 0) return;
        
        const parsed = this.parseLogLine(line);
        if (parsed) {
          this.emit('log', parsed);
        }
      });
    });

    this.logcatProcess.stderr.on('data', (data) => {
      console.error('Logcat error:', data.toString());
    });

    this.logcatProcess.on('error', (error) => {
      console.error('Logcat process error:', error);
      this.logcatProcess = null;
    });

    this.logcatProcess.on('close', (code) => {
      console.log('Logcat process closed with code:', code);
      this.logcatProcess = null;
    });
  }

  parseLogLine(line) {
    const regex = /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+([VDIWEF])\/(.+?)\(\s*(\d+)\):\s+(.+)$/;
    const match = line.match(regex);
    
    if (!match) {
      return null;
    }

    const [, timestamp, levelChar, tag, pid, message] = match;
    
    const levelMap = {
      'V': 'verbose',
      'D': 'debug',
      'I': 'info',
      'W': 'warn',
      'E': 'error',
      'F': 'error'
    };

    return {
      timestamp: new Date().toISOString(),
      level: levelMap[levelChar] || 'info',
      tag: tag.trim(),
      pid: parseInt(pid),
      message: message.trim()
    };
  }

  stop() {
    if (this.logcatProcess) {
      this.logcatProcess.kill('SIGTERM');
      this.logcatProcess = null;
    }
  }
}
