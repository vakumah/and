import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

const upload = multer({ dest: join(tmpdir(), 'android-uploads') });

export function setupRoutes(app, adbService) {
  
  app.get('/api/device/status', async (req, res) => {
    try {
      const status = await adbService.getDeviceStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/device/key', async (req, res) => {
    try {
      const { keyCode } = req.body;
      await adbService.pressKey(keyCode);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/device/touch', async (req, res) => {
    try {
      const { x, y, action } = req.body;
      if (action === 'tap') {
        await adbService.tap(x, y);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/device/swipe', async (req, res) => {
    try {
      const { x1, y1, x2, y2, duration } = req.body;
      await adbService.swipe(x1, y1, x2, y2, duration);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/device/text', async (req, res) => {
    try {
      const { text } = req.body;
      await adbService.inputText(text);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/device/screenshot', async (req, res) => {
    try {
      const screenshot = await adbService.screenshot();
      res.set('Content-Type', 'image/png');
      res.send(screenshot);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/device/rotate', async (req, res) => {
    try {
      const { rotation } = req.body;
      await adbService.setRotation(rotation);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/apps/list', async (req, res) => {
    try {
      const apps = await adbService.getInstalledApps();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/apps/launch', async (req, res) => {
    try {
      const { packageName } = req.body;
      await adbService.launchApp(packageName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/apps/uninstall', async (req, res) => {
    try {
      const { packageName } = req.body;
      await adbService.uninstallApp(packageName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/apps/clear', async (req, res) => {
    try {
      const { packageName } = req.body;
      await adbService.clearAppData(packageName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/apps/force-stop', async (req, res) => {
    try {
      const { packageName } = req.body;
      await adbService.forceStopApp(packageName);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/apps/install', upload.single('apk'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      await adbService.installApk(req.file.path);
      res.json({ success: true, message: 'APK installed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/files/list', async (req, res) => {
    try {
      const { path = '/sdcard' } = req.query;
      const files = await adbService.listFiles(path);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/files/download', async (req, res) => {
    try {
      const { path } = req.query;
      if (!path) {
        return res.status(400).json({ error: 'Path required' });
      }
      
      const file = await adbService.pullFile(path);
      const filename = path.split('/').pop();
      
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(file);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/files/delete', async (req, res) => {
    try {
      const { path } = req.body;
      await adbService.deleteFile(path);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/files/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { path } = req.body;
      await adbService.pushFile(req.file.path, path);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}
