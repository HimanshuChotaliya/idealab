const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map to store room state. 
// Key: 6-digit room code (string)
// Value: { containerLabel: string, sharer: WebSocket, watchers: Set<WebSocket>, lastLocation: Object }
const rooms = new Map();

// REST endpoint to validate room code
app.get('/api/room/:code', (req, res) => {
  const { code } = req.params;
  if (rooms.has(code)) {
    const room = rooms.get(code);
    if (room.sharer) {
      return res.status(200).json({ valid: true, containerLabel: room.containerLabel });
    }
  }
  return res.status(404).json({ valid: false, error: 'Invalid code or no active container found' });
});

// REST endpoint for dashboard stats
app.get('/api/stats', (req, res) => {
  const activeRooms = Array.from(rooms.values()).filter(r => r.sharer !== null).length;
  res.json({
    activeRooms,
    totalContainers: 4280, // Hardcoded for demo
    successRate: 98.4
  });
});

wss.on('connection', (ws) => {
  console.log('New client connected');
  let currentRoom = null;
  let isSharer = false;

  ws.on('message', (messageAsString) => {
    try {
      const message = JSON.parse(messageAsString);
      const { type, roomCode, containerLabel, lat, lng } = message;

      if (type === 'register') {
        currentRoom = roomCode;
        isSharer = true;

        if (!rooms.has(roomCode)) {
          rooms.set(roomCode, { containerLabel, sharer: null, watchers: new Set(), lastLocation: null });
        }
        
        const room = rooms.get(roomCode);
        if (room.sharer && room.sharer !== ws) {
          room.sharer.close(1000, 'Replaced by new sharer');
        }
        room.sharer = ws;
        if (containerLabel) room.containerLabel = containerLabel;
        console.log(`Container ${containerLabel || roomCode} registered`);

      } else if (type === 'watch') {
        currentRoom = roomCode;
        isSharer = false;

        if (!rooms.has(roomCode)) {
          rooms.set(roomCode, { containerLabel: 'Unknown', sharer: null, watchers: new Set(), lastLocation: null });
        }
        
        const room = rooms.get(roomCode);
        room.watchers.add(ws);
        console.log(`Room ${roomCode} watcher joined. Total watchers: ${room.watchers.size}`);

        if (room.lastLocation) {
          ws.send(JSON.stringify({
            type: 'location',
            lat: room.lastLocation.lat,
            lng: room.lastLocation.lng,
            containerLabel: room.containerLabel
          }));
        }

      } else if (type === 'location') {
        if (!isSharer || currentRoom !== roomCode) return;
        
        const room = rooms.get(roomCode);
        if (room) {
          room.lastLocation = { lat, lng };
          
          const locationMessage = JSON.stringify({ type: 'location', lat, lng, containerLabel: room.containerLabel });
          room.watchers.forEach((watcher) => {
            if (watcher.readyState === WebSocket.OPEN) {
              watcher.send(locationMessage);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (!currentRoom) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    if (isSharer) {
      const sharerLeftMessage = JSON.stringify({ type: 'container_offline' });
      room.watchers.forEach((watcher) => {
        if (watcher.readyState === WebSocket.OPEN) {
          watcher.send(sharerLeftMessage);
        }
      });
      room.sharer = null;
    } else {
      room.watchers.delete(ws);
    }

    if (!room.sharer && room.watchers.size === 0) {
      rooms.delete(currentRoom);
      console.log(`Room ${currentRoom} deleted`);
    }
  });
});

app.get('/', (req, res) => {
  res.send('PackCycle Container Tracking API is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
