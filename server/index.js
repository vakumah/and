import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';
import { ADBService } from './services/ADBService.js';
import { ScreenStreamService } from './services/ScreenStreamService.js';
import { LogcatService } from './services/LogcatService.js';
import { setupRoutes } from './routes/index.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 8080;
const DEVICE_ID = process.env.DEVICE_ID || 'localhost:5555';

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const adbService = new ADBService(DEVICE_ID);
const screenStreamService = new ScreenStreamService(adbService);
const logcatService = new LogcatService(adbService);

setupRoutes(app, adbService);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'dist' });
  });
}

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: error.message }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  sendDeviceStatus(ws);
  const statusInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      sendDeviceStatus(ws);
    } else {
      clearInterval(statusInterval);
    }
  }, 2000);
});

async function handleWebSocketMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'start-screen-stream':
      screenStreamService.startStream(ws, payload);
      break;

    case 'stop-screen-stream':
      screenStreamService.stopStream(ws);
      break;

    case 'touch-tap':
      await adbService.tap(payload.x, payload.y);
      break;

    case 'touch-swipe':
      await adbService.swipe(payload.x1, payload.y1, payload.x2, payload.y2, payload.duration);
      break;

    case 'touch-move':
      break;

    case 'rotate-screen':
      await adbService.setRotation(payload.rotation);
      break;

    case 'terminal-command':
      const output = await adbService.shell(payload.command);
      ws.send(JSON.stringify({
        type: 'terminal-output',
        payload: { output }
      }));
      break;

    case 'clear-logcat':
      await adbService.clearLogcat();
      break;

    default:
      console.warn('Unknown message type:', type);
  }
}

async function sendDeviceStatus(ws) {
  try {
    const status = await adbService.getDeviceStatus();
    ws.send(JSON.stringify({
      type: 'device-status',
      payload: status
    }));
  } catch (error) {
    console.error('Error sending device status:', error);
  }
}

logcatService.on('log', (log) => {
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'logcat',
        payload: log
      }));
    }
  });
});

logcatService.start();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}/ws`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  screenStreamService.stopAllStreams();
  logcatService.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
