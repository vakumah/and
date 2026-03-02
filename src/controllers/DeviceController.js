export class DeviceController {
  constructor() {
    this.baseUrl = '/api';
    this.deviceId = 'localhost:5555';
  }

  async getDeviceStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/device/status`);
      if (!response.ok) throw new Error('Failed to fetch device status');
      return await response.json();
    } catch (error) {
      console.error('Error fetching device status:', error);
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

  async pressKey(keyCode) {
    try {
      const response = await fetch(`${this.baseUrl}/device/key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode })
      });
      return await response.json();
    } catch (error) {
      console.error('Error pressing key:', error);
      throw error;
    }
  }

  async sendTouch(x, y, action = 'tap') {
    try {
      const response = await fetch(`${this.baseUrl}/device/touch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, action })
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending touch:', error);
      throw error;
    }
  }

  async sendSwipe(x1, y1, x2, y2, duration = 300) {
    try {
      const response = await fetch(`${this.baseUrl}/device/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x1, y1, x2, y2, duration })
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending swipe:', error);
      throw error;
    }
  }

  async sendText(text) {
    try {
      const response = await fetch(`${this.baseUrl}/device/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending text:', error);
      throw error;
    }
  }

  async takeScreenshot() {
    try {
      const response = await fetch(`${this.baseUrl}/device/screenshot`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw error;
    }
  }

  async rotateScreen(rotation) {
    try {
      const response = await fetch(`${this.baseUrl}/device/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotation })
      });
      return await response.json();
    } catch (error) {
      console.error('Error rotating screen:', error);
      throw error;
    }
  }

  async getInstalledApps() {
    try {
      const response = await fetch(`${this.baseUrl}/apps/list`);
      if (!response.ok) throw new Error('Failed to fetch apps');
      return await response.json();
    } catch (error) {
      console.error('Error fetching apps:', error);
      return [];
    }
  }

  async launchApp(packageName) {
    try {
      const response = await fetch(`${this.baseUrl}/apps/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error launching app:', error);
      throw error;
    }
  }

  async uninstallApp(packageName) {
    try {
      const response = await fetch(`${this.baseUrl}/apps/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error uninstalling app:', error);
      throw error;
    }
  }

  async clearAppData(packageName) {
    try {
      const response = await fetch(`${this.baseUrl}/apps/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error clearing app data:', error);
      throw error;
    }
  }

  async forceStopApp(packageName) {
    try {
      const response = await fetch(`${this.baseUrl}/apps/force-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName })
      });
      return await response.json();
    } catch (error) {
      console.error('Error force stopping app:', error);
      throw error;
    }
  }

  async installApk(file, onProgress) {
    try {
      const formData = new FormData();
      formData.append('apk', file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload error')));
        
        xhr.open('POST', `${this.baseUrl}/apps/install`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error installing APK:', error);
      throw error;
    }
  }

  async listFiles(path = '/sdcard') {
    try {
      const response = await fetch(`${this.baseUrl}/files/list?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to list files');
      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  async downloadFile(path) {
    try {
      const response = await fetch(`${this.baseUrl}/files/download?path=${encodeURIComponent(path)}`);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    try {
      const response = await fetch(`${this.baseUrl}/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async uploadFile(file, path, onProgress) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload error')));
        
        xhr.open('POST', `${this.baseUrl}/files/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
