import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { gameManager, Room } from './gameManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Map<string, WebSocket>();

// Helper to broadcast room state to all players in that room
function broadcastToRoom(roomId: string, message: object, excludeSocketId?: string) {
  const room = gameManager.getRoom(roomId);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const socketId in room.players) {
    if (socketId !== excludeSocketId) {
      const client = clients.get(socketId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

function startRoundCountdown(room: Room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  room.currentRound += 1;
  const promptIdx = (room.currentRound - 1) % room.promptList.length;
  room.currentPrompt = room.promptList[promptIdx];
  room.phase = 'ROUND_COUNTDOWN';
  room.timerSeconds = 3;
  room.roundWinnerId = null;

  broadcastToRoom(room.id, {
    type: 'round_countdown_started',
    room: gameManager.serializeRoom(room)
  });

  room.timerInterval = setInterval(() => {
    room.timerSeconds -= 1;

    if (room.timerSeconds <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      startActiveDrawing(room);
    } else {
      broadcastToRoom(room.id, {
        type: 'timer_tick',
        phase: room.phase,
        timerSeconds: room.timerSeconds
      });
    }
  }, 1000);
}

function startActiveDrawing(room: Room) {
  room.phase = 'DRAWING';
  room.timerSeconds = 45; // 45 seconds drawing battle

  broadcastToRoom(room.id, {
    type: 'drawing_phase_started',
    room: gameManager.serializeRoom(room)
  });

  room.timerInterval = setInterval(() => {
    room.timerSeconds -= 1;

    broadcastToRoom(room.id, {
      type: 'timer_tick',
      phase: room.phase,
      timerSeconds: room.timerSeconds
    });

    if (room.timerSeconds <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = null;
      // Request both clients to evaluate and submit final drawing
      broadcastToRoom(room.id, {
        type: 'times_up_request_drawing'
      });

      // Give 2 seconds grace period for submission before auto-finalizing showcase
      setTimeout(() => {
        finalizeRoundShowcase(room);
      }, 2000);
    }
  }, 1000);
}

function finalizeRoundShowcase(room: Room) {
  if (room.phase === 'ROUND_SHOWCASE' || room.phase === 'GAME_OVER') return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  const pIds = Object.keys(room.players);
  let bestScore = -1;
  let winnerId: string | null = null;

  for (const pId of pIds) {
    const player = room.players[pId];
    const rIdx = room.currentRound - 1;
    const currentScore = player.roundScores[rIdx] || 0;
    if (currentScore > bestScore) {
      bestScore = currentScore;
      winnerId = pId;
    }
  }

  room.roundWinnerId = winnerId;
  room.phase = 'ROUND_SHOWCASE';
  room.timerSeconds = 8; // 8 seconds cinematic showcase

  broadcastToRoom(room.id, {
    type: 'round_showcase_started',
    room: gameManager.serializeRoom(room)
  });

  // Countdown through showcase then move to next round or game over
  room.timerInterval = setInterval(() => {
    room.timerSeconds -= 1;

    broadcastToRoom(room.id, {
      type: 'timer_tick',
      phase: room.phase,
      timerSeconds: room.timerSeconds
    });

    if (room.timerSeconds <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = null;

      if (room.currentRound >= room.totalRounds) {
        // Game Over! Determine overall champion
        let maxTotal = -1;
        let champId: string | null = null;
        for (const pId of pIds) {
          if (room.players[pId].score > maxTotal) {
            maxTotal = room.players[pId].score;
            champId = pId;
          }
        }
        room.overallWinnerId = champId;
        room.phase = 'GAME_OVER';

        broadcastToRoom(room.id, {
          type: 'game_over',
          room: gameManager.serializeRoom(room)
        });
      } else {
        // Next round
        startRoundCountdown(room);
      }
    }
  }, 1000);
}

wss.on('connection', (ws) => {
  const socketId = 'sock_' + Math.random().toString(36).substring(2, 9);
  clients.set(socketId, ws);

  ws.send(JSON.stringify({ type: 'connected', socketId }));

  ws.on('message', (dataStr) => {
    try {
      const msg = JSON.parse(dataStr.toString());

      switch (msg.type) {
        case 'create_room': {
          const room = gameManager.createRoom(socketId, msg.name, msg.avatar);
          ws.send(JSON.stringify({
            type: 'room_created',
            roomId: room.id,
            room: gameManager.serializeRoom(room),
            socketId
          }));
          break;
        }

        case 'join_room': {
          const result = gameManager.joinRoom(socketId, msg.roomId, msg.name, msg.avatar);
          if (!result.success || !result.room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: result.message || 'Could not join room'
            }));
          } else {
            const serialized = gameManager.serializeRoom(result.room);
            // Notify joining player
            ws.send(JSON.stringify({
              type: 'room_joined',
              roomId: result.room.id,
              room: serialized,
              socketId
            }));
            // Notify existing room members (e.g. host)
            broadcastToRoom(result.room.id, {
              type: 'peer_joined',
              room: serialized,
              joinedPlayerId: socketId
            }, socketId);
          }
          break;
        }

        case 'webrtc_signal': {
          // Relay WebRTC SDP offer/answer or ICE candidate to opponent
          const room = gameManager.getRoomBySocket(socketId);
          if (room) {
            broadcastToRoom(room.id, {
              type: 'webrtc_signal',
              senderId: socketId,
              data: msg.data
            }, socketId);
          }
          break;
        }

        case 'relay_event': {
          // Fallback websocket relay for drawing events or reactions
          const room = gameManager.getRoomBySocket(socketId);
          if (room) {
            broadcastToRoom(room.id, {
              type: 'relay_event',
              senderId: socketId,
              data: msg.data
            }, socketId);
          }
          break;
        }

        case 'set_ready': {
          const room = gameManager.getRoomBySocket(socketId);
          if (room && room.players[socketId]) {
            room.players[socketId].ready = !!msg.ready;
            const pIds = Object.keys(room.players);
            const allReady = pIds.length === 2 && pIds.every(id => room.players[id].ready);

            broadcastToRoom(room.id, {
              type: 'player_ready_state',
              room: gameManager.serializeRoom(room)
            });

            if (allReady && (room.phase === 'WAITING' || room.phase === 'LOBBY')) {
              startRoundCountdown(room);
            }
          }
          break;
        }

        case 'submit_drawing': {
          const room = gameManager.getRoomBySocket(socketId);
          if (room && room.players[socketId]) {
            const player = room.players[socketId];
            const roundIdx = room.currentRound - 1;
            const accuracy = Math.round(msg.accuracy || 0);
            const scoreEarned = Math.round(accuracy * 10); // e.g. 85% = 850 pts

            player.roundAccuracies[roundIdx] = accuracy;
            player.roundScores[roundIdx] = scoreEarned;
            player.score = player.roundScores.reduce((sum, s) => sum + s, 0);
            player.drawings[roundIdx] = msg.drawingDataUrl || '';

            // Check if both players have submitted for this round
            const pIds = Object.keys(room.players);
            const allSubmitted = pIds.length === 2 && pIds.every(id => room.players[id].roundScores[roundIdx] !== undefined);

            if (allSubmitted && (room.phase === 'DRAWING' || room.phase === 'ROUND_COUNTDOWN')) {
              finalizeRoundShowcase(room);
            }
          }
          break;
        }

        case 'rematch': {
          const room = gameManager.getRoomBySocket(socketId);
          if (room) {
            const resetRoom = gameManager.resetMatch(room.id);
            if (resetRoom) {
              broadcastToRoom(room.id, {
                type: 'rematch_started',
                room: gameManager.serializeRoom(resetRoom)
              });
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling socket message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(socketId);
    const { roomId, room } = gameManager.removeSocket(socketId);
    if (roomId && room) {
      broadcastToRoom(roomId, {
        type: 'peer_left',
        room: gameManager.serializeRoom(room),
        leftPlayerId: socketId
      });
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Drawing Battle Server & Signaling running on http://localhost:${PORT}`);
});
