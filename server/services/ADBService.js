import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ADBService {
  constructor(deviceId) {
    this.deviceId = deviceId;
  }

  async getDevice() {
    try {
      const { stdout } = await execAsync('adb devices');
      const lines = stdout.split('\n');
      const deviceLine = lines.find(line => line.includes(this.deviceId));
      
      if (!deviceLine || !deviceLine.includes('device')) {
        throw new Error(`Device ${this.deviceId} not found`);
      }
      
      return { id: this.deviceId };
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  async getDeviceStatus() {
    try {
      await this.getDevice();
      
      const [battery, cpu, memory, storage, androidVersion, model, arch] = await Promise.all([
        this.getBatteryLevel(),
        this.getCPUUsage(),
        this.getMemoryUsage(),
        this.getStorageUsage(),
        this.getProperty('ro.build.version.release'),
        this.getProperty('ro.product.model'),
        this.getProperty('ro.product.cpu.abi')
      ]);

      return {
        connected: true,
        battery,
        cpu,
        memory,
        storage,
        androidVersion,
        model,
        architecture: arch
      };
    } catch (error) {
      return {
        connected: false,
        battery: 0,
        cpu: 0,
        memory: 0,
        storage: 0,
        androidVersion: 'Unknown',
        model: 'Unknown',
        architecture: 'Unknown'
      };
    }
  }

  async shell(command) {
    try {
      const { stdout } = await execAsync(`adb -s ${this.deviceId} shell "${command}"`);
      return stdout;
    } catch (error) {
      console.error('Shell command error:', error);
      throw error;
    }
  }

  async getProperty(prop) {
    try {
      const output = await this.shell(`getprop ${prop}`);
      return output.trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  async getBatteryLevel() {
    try {
      const output = await this.shell('dumpsys battery | grep level');
      const match = output.match(/level: (\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getCPUUsage() {
    try {
      const output = await this.shell('top -n 1 | grep "CPU:"');
      const match = output.match(/(\d+)%/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  async getMemoryUsage() {
    try {
      const output = await this.shell('dumpsys meminfo | grep "Total RAM"');
      const match = output.match(/(\d+),(\d+)K/);
      if (match) {
        const total = parseInt(match[1] + match[2]);
        const freeOutput = await this.shell('dumpsys meminfo | grep "Free RAM"');
        const freeMatch = freeOutput.match(/(\d+),(\d+)K/);
        if (freeMatch) {
          const free = parseInt(freeMatch[1] + freeMatch[2]);
          return Math.round(((total - free) / total) * 100);
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async getStorageUsage() {
    try {
      const output = await this.shell('df /data | tail -1');
      const parts = output.trim().split(/\s+/);
      if (parts.length >= 5) {
        const used = parseInt(parts[2]);
        const total = parseInt(parts[1]);
        return Math.round((used / total) * 100);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async pressKey(keyCode) {
    const keyMap = {
      'HOME': 3,
      'BACK': 4,
      'APP_SWITCH': 187,
      'POWER': 26,
      'VOLUME_UP': 24,
      'VOLUME_DOWN': 25,
      'MENU': 82
    };
    
    const code = keyMap[keyCode] || keyCode;
    await this.shell(`input keyevent ${code}`);
  }

  async tap(x, y) {
    await this.shell(`input tap ${x} ${y}`);
  }

  async swipe(x1, y1, x2, y2, duration = 300) {
    await this.shell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
  }

  async inputText(text) {
    const escaped = text.replace(/\s/g, '%s').replace(/[()]/g, '\\$&');
    await this.shell(`input text "${escaped}"`);
  }

  async screenshot() {
    try {
      const tempFile = `/sdcard/screenshot_${Date.now()}.png`;
      await this.shell(`screencap -p ${tempFile}`);
      
      const { stdout } = await execAsync(`adb -s ${this.deviceId} exec-out cat ${tempFile}`, {
        encoding: 'buffer',
        maxBuffer: 10 * 1024 * 1024
      });
      
      await this.shell(`rm ${tempFile}`);
      return stdout;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }

  async setRotation(rotation) {
    const rotationMap = {
      0: 0,
      90: 1,
      180: 2,
      270: 3
    };
    
    const value = rotationMap[rotation] || 0;
    await this.shell(`settings put system user_rotation ${value}`);
    await this.shell(`settings put system accelerometer_rotation 0`);
  }

  async getInstalledApps() {
    try {
      const output = await this.shell('pm list packages -3');
      const packages = output.split('\n')
        .filter(line => line.startsWith('package:'))
        .map(line => line.replace('package:', '').trim())
        .filter(pkg => pkg.length > 0);

      const apps = await Promise.all(
        packages.map(async (packageName) => {
          try {
            const labelOutput = await this.shell(`dumpsys package ${packageName} | grep "versionName"`);
            const labelMatch = labelOutput.match(/versionName=([^\s]+)/);
            
            const name = packageName.split('.').pop();
            
            return {
              packageName,
              name: name.charAt(0).toUpperCase() + name.slice(1),
              version: labelMatch ? labelMatch[1] : '1.0'
            };
          } catch (error) {
            return {
              packageName,
              name: packageName.split('.').pop(),
              version: '1.0'
            };
          }
        })
      );

      return apps.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return [];
    }
  }

  async launchApp(packageName) {
    await this.shell(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  }

  async uninstallApp(packageName) {
    await this.shell(`pm uninstall ${packageName}`);
  }

  async clearAppData(packageName) {
    await this.shell(`pm clear ${packageName}`);
  }

  async forceStopApp(packageName) {
    await this.shell(`am force-stop ${packageName}`);
  }

  async installApk(apkPath) {
    try {
      await execAsync(`adb -s ${this.deviceId} install -r "${apkPath}"`);
    } catch (error) {
      console.error('APK installation error:', error);
      throw error;
    }
  }

  async listFiles(path) {
    try {
      const output = await this.shell(`ls -la "${path}"`);
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      
      const files = [];
      for (const line of lines) {
        if (line.startsWith('total')) continue;
        
        const parts = line.trim().split(/\s+/);
        if (parts.length < 8) continue;
        
        const permissions = parts[0];
        const name = parts.slice(7).join(' ');
        
        if (name === '.' || name === '..') continue;
        
        const isDirectory = permissions.startsWith('d');
        const size = isDirectory ? 0 : parseInt(parts[4]) || 0;
        
        files.push({
          name,
          type: isDirectory ? 'directory' : 'file',
          size,
          permissions
        });
      }
      
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async pullFile(remotePath) {
    try {
      const { stdout } = await execAsync(`adb -s ${this.deviceId} exec-out cat "${remotePath}"`, {
        encoding: 'buffer',
        maxBuffer: 50 * 1024 * 1024
      });
      return stdout;
    } catch (error) {
      console.error('Error pulling file:', error);
      throw error;
    }
  }

  async pushFile(localPath, remotePath) {
    try {
      await execAsync(`adb -s ${this.deviceId} push "${localPath}" "${remotePath}"`);
    } catch (error) {
      console.error('Error pushing file:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    await this.shell(`rm -rf "${path}"`);
  }

  async clearLogcat() {
    await this.shell('logcat -c');
  }
}
