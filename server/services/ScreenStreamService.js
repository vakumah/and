import { spawn } from 'child_process';

export class ScreenStreamService {
  constructor(adbService) {
    this.adbService = adbService;
    this.streams = new Map();
  }

  startStream(ws, options = {}) {
    if (this.streams.has(ws)) {
      return;
    }

    const { width = 1080, height = 1920, quality = 80 } = options;
    
    const screenCapProcess = spawn('adb', [
      '-s', this.adbService.deviceId,
      'exec-out',
      'screenrecord',
      '--output-format=h264',
      '--size', `${width}x${height}`,
      '--bit-rate', '4000000',
      '-'
    ]);

    const ffmpegProcess = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-q:v', quality.toString(),
      '-r', '30',
      'pipe:1'
    ]);

    screenCapProcess.stdout.pipe(ffmpegProcess.stdin);

    let buffer = Buffer.alloc(0);
    const SOI = Buffer.from([0xFF, 0xD8]);
    const EOI = Buffer.from([0xFF, 0xD9]);

    ffmpegProcess.stdout.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      let start = buffer.indexOf(SOI);
      let end = buffer.indexOf(EOI, start + 2);

      while (start !== -1 && end !== -1) {
        const frame = buffer.slice(start, end + 2);
        
        if (ws.readyState === ws.OPEN) {
          const base64Frame = frame.toString('base64');
          ws.send(JSON.stringify({
            type: 'screen-frame',
            payload: base64Frame
          }));
        }

        buffer = buffer.slice(end + 2);
        start = buffer.indexOf(SOI);
        end = buffer.indexOf(EOI, start + 2);
      }
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg error:', data.toString());
    });

    screenCapProcess.on('error', (error) => {
      console.error('Screen capture error:', error);
      this.stopStream(ws);
    });

    ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg error:', error);
      this.stopStream(ws);
    });

    this.streams.set(ws, {
      screenCapProcess,
      ffmpegProcess
    });

    ws.on('close', () => {
      this.stopStream(ws);
    });
  }

  stopStream(ws) {
    const stream = this.streams.get(ws);
    
    if (stream) {
      try {
        stream.screenCapProcess.kill('SIGTERM');
        stream.ffmpegProcess.kill('SIGTERM');
      } catch (error) {
        console.error('Error stopping stream:', error);
      }
      
      this.streams.delete(ws);
    }
  }

  stopAllStreams() {
    this.streams.forEach((stream, ws) => {
      this.stopStream(ws);
    });
  }
}
