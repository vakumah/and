export class FileManager {
  constructor(deviceController) {
    this.deviceController = deviceController;
    this.currentPath = '/sdcard';
  }

  async loadFileSystem(path = this.currentPath) {
    this.currentPath = path;
    const fileList = document.getElementById('file-list');
    const pathEl = document.getElementById('current-path');
    
    if (!fileList) return;
    
    fileList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading...</p>';
    
    try {
      const files = await this.deviceController.listFiles(path);
      
      if (pathEl) {
        pathEl.textContent = path;
      }
      
      if (files.length === 0) {
        fileList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No files found</p>';
        return;
      }
      
      fileList.innerHTML = '';
      
      if (path !== '/') {
        const parentItem = this.createFileItem({
          name: '..',
          type: 'directory',
          size: 0
        }, path);
        fileList.appendChild(parentItem);
      }
      
      files.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      files.forEach(file => {
        const item = this.createFileItem(file, path);
        fileList.appendChild(item);
      });
    } catch (error) {
      console.error('Error loading files:', error);
      fileList.innerHTML = '<p style="text-align: center; color: var(--error);">Failed to load files</p>';
    }
  }

  createFileItem(file, currentPath) {
    const item = document.createElement('div');
    item.className = 'file-item';
    
    const icon = this.getFileIcon(file);
    const size = file.type === 'directory' ? '' : this.formatFileSize(file.size);
    
    item.innerHTML = `
      <span class="file-icon">${icon}</span>
      <span class="file-name">${file.name}</span>
      ${size ? `<span class="file-size">${size}</span>` : ''}
    `;
    
    item.addEventListener('click', () => {
      if (file.type === 'directory') {
        const newPath = file.name === '..' 
          ? currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
          : `${currentPath}/${file.name}`.replace('//', '/');
        this.loadFileSystem(newPath);
      } else {
        this.handleFileClick(file, currentPath);
      }
    });
    
    return item;
  }

  getFileIcon(file) {
    if (file.type === 'directory') return '📁';
    
    const ext = file.name.split('.').pop().toLowerCase();
    const iconMap = {
      'apk': '📦',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎥',
      'mp3': '🎵',
      'pdf': '📄',
      'txt': '📝',
      'zip': '🗜️',
      'rar': '🗜️',
      'db': '💾',
      'log': '📋'
    };
    
    return iconMap[ext] || '📄';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async handleFileClick(file, path) {
    const fullPath = `${path}/${file.name}`.replace('//', '/');
    
    try {
      const blob = await this.deviceController.downloadFile(fullPath);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: `Downloaded ${file.name}`, type: 'success' }
      }));
    } catch (error) {
      console.error('Error downloading file:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to download file', type: 'error' }
      }));
    }
  }

  async handleFileUpload(file) {
    if (!file) return;
    
    const progressDiv = document.getElementById('upload-progress');
    const progressFill = document.getElementById('upload-progress-fill');
    const statusText = document.getElementById('upload-status');
    
    if (progressDiv) progressDiv.style.display = 'block';
    if (statusText) statusText.textContent = 'Uploading...';
    
    try {
      await this.deviceController.installApk(file, (progress) => {
        if (progressFill) {
          progressFill.style.width = `${progress}%`;
        }
        if (statusText) {
          statusText.textContent = `Uploading... ${Math.round(progress)}%`;
        }
      });
      
      if (statusText) statusText.textContent = 'Installing...';
      
      setTimeout(() => {
        if (progressDiv) progressDiv.style.display = 'none';
        if (progressFill) progressFill.style.width = '0%';
        
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'APK installed successfully', type: 'success' }
        }));
        
        window.dispatchEvent(new CustomEvent('refresh-apps'));
      }, 1000);
    } catch (error) {
      console.error('Error installing APK:', error);
      if (progressDiv) progressDiv.style.display = 'none';
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to install APK', type: 'error' }
      }));
    }
  }
}
