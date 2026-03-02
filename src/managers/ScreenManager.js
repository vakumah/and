export class ScreenManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.canvas = null;
    this.ctx = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.rotation = 0;
    this.touchStartPos = null;
    
    this.init();
  }

  init() {
    this.canvas = document.getElementById('screen-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.setupTouchHandlers();
    this.requestScreenStream();
  }

  setupTouchHandlers() {
    let isDown = false;
    let startX, startY;
    
    const getCoordinates = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);
      
      return { x, y };
    };
    
    const handleStart = (e) => {
      e.preventDefault();
      isDown = true;
      const coords = getCoordinates(e);
      startX = coords.x;
      startY = coords.y;
      this.touchStartPos = { x: startX, y: startY, time: Date.now() };
    };
    
    const handleMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const coords = getCoordinates(e);
      this.wsManager.send('touch-move', coords);
    };
    
    const handleEnd = (e) => {
      if (!isDown) return;
      e.preventDefault();
      isDown = false;
      
      const coords = getCoordinates(e);
      const endTime = Date.now();
      const duration = endTime - this.touchStartPos.time;
      const distance = Math.sqrt(
        Math.pow(coords.x - startX, 2) + Math.pow(coords.y - startY, 2)
      );
      
      if (distance < 20 && duration < 300) {
        this.wsManager.send('touch-tap', { x: coords.x, y: coords.y });
      } else {
        this.wsManager.send('touch-swipe', {
          x1: startX,
          y1: startY,
          x2: coords.x,
          y2: coords.y,
          duration: Math.min(duration, 1000)
        });
      }
      
      this.touchStartPos = null;
    };
    
    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('mouseup', handleEnd);
    this.canvas.addEventListener('mouseleave', handleEnd);
    
    this.canvas.addEventListener('touchstart', handleStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleMove, { passive: false });
    this.canvas.addEventListener('touchend', handleEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleEnd, { passive: false });
  }

  requestScreenStream() {
    this.wsManager.send('start-screen-stream', {
      width: this.canvas.width,
      height: this.canvas.height,
      quality: 80
    });
  }

  renderFrame(frameData) {
    if (!this.ctx || !frameData) return;
    
    try {
      const img = new Image();
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      };
      img.src = `data:image/jpeg;base64,${frameData}`;
    } catch (error) {
      console.error('Error rendering frame:', error);
    }
  }

  async takeScreenshot() {
    try {
      this.canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Screenshot saved', type: 'success' }
        }));
      });
    } catch (error) {
      console.error('Error taking screenshot:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to take screenshot', type: 'error' }
      }));
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    try {
      const stream = this.canvas.captureStream(30);
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });
      
      this.recordedChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Recording saved', type: 'success' }
        }));
      };
      
      this.mediaRecorder.start();
      this.isRecording = true;
      
      const btn = document.getElementById('record-btn');
      if (btn) btn.style.color = '#ef4444';
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Recording started', type: 'info' }
      }));
    } catch (error) {
      console.error('Error starting recording:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Failed to start recording', type: 'error' }
      }));
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      const btn = document.getElementById('record-btn');
      if (btn) btn.style.color = '';
    }
  }

  rotateScreen() {
    this.rotation = (this.rotation + 90) % 360;
    this.wsManager.send('rotate-screen', { rotation: this.rotation });
    
    if (this.rotation === 90 || this.rotation === 270) {
      [this.canvas.width, this.canvas.height] = [this.canvas.height, this.canvas.width];
    }
  }
}
