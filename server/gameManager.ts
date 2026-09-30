import { GamePhase, Player, PromptItem, RoomState } from '../src/types/game.js';
import { PROMPTS, getRandomPrompts } from '../src/data/prompts.js';

export interface Room {
  id: string; // 4-digit room code
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  promptList: PromptItem[];
  currentPrompt: PromptItem | null;
  timerSeconds: number;
  timerInterval: NodeJS.Timeout | null;
  players: {
    [socketId: string]: Player;
  };
  roundWinnerId: string | null;
  overallWinnerId: string | null;
}

export class GameManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  /**
   * Generates a unique 4-digit room code
   */
  public generateRoomCode(): string {
    let code: string;
    let attempts = 0;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
    } while (this.rooms.has(code) && attempts < 1000);
    return code;
  }

  public createRoom(socketId: string, playerName: string, avatar: string): Room {
    const roomId = this.generateRoomCode();
    const promptList = getRandomPrompts(5);

    const hostPlayer: Player = {
      id: socketId,
      name: playerName || 'Player 1',
      avatar: avatar || '🎨',
      isHost: true,
      score: 0,
      roundScores: [],
      roundAccuracies: [],
      drawings: [],
      ready: false
    };

    const room: Room = {
      id: roomId,
      phase: 'WAITING',
      currentRound: 0,
      totalRounds: 5,
      promptList,
      currentPrompt: null,
      timerSeconds: 45,
      timerInterval: null,
      players: {
        [socketId]: hostPlayer
      },
      roundWinnerId: null,
      overallWinnerId: null
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socketId, roomId);
    return room;
  }

  public joinRoom(socketId: string, roomId: string, playerName: string, avatar: string): { success: boolean; message?: string; room?: Room } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, message: 'Room not found. Check 4-digit code.' };
    }

    const playerKeys = Object.keys(room.players);
    if (playerKeys.length >= 2 && !room.players[socketId]) {
      return { success: false, message: 'Room is already full (2/2 players).' };
    }

    const guestPlayer: Player = {
      id: socketId,
      name: playerName || 'Player 2',
      avatar: avatar || '⚡',
      isHost: false,
      score: 0,
      roundScores: [],
      roundAccuracies: [],
      drawings: [],
      ready: false
    };

    room.players[socketId] = guestPlayer;
    this.socketToRoom.set(socketId, roomId);

    return { success: true, room };
  }

  public getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public removeSocket(socketId: string): { roomId?: string; room?: Room; wasEmpty?: boolean } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return {};

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return { roomId };

    delete room.players[socketId];

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    if (Object.keys(room.players).length === 0) {
      this.rooms.delete(roomId);
      return { roomId, wasEmpty: true };
    }

    // If host left, designate guest as host
    const remainingIds = Object.keys(room.players);
    if (remainingIds.length > 0) {
      room.players[remainingIds[0]].isHost = true;
      room.phase = 'WAITING';
    }

    return { roomId, room, wasEmpty: false };
  }

  public serializeRoom(room: Room): RoomState {
    return {
      roomId: room.id,
      phase: room.phase,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      currentPrompt: room.currentPrompt,
      timerSeconds: room.timerSeconds,
      players: room.players,
      roundWinnerId: room.roundWinnerId,
      overallWinnerId: room.overallWinnerId
    };
  }

  public resetMatch(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.currentRound = 0;
    room.phase = 'WAITING';
    room.promptList = getRandomPrompts(5);
    room.currentPrompt = null;
    room.roundWinnerId = null;
    room.overallWinnerId = null;
    room.timerSeconds = 45;

    for (const pId in room.players) {
      room.players[pId].score = 0;
      room.players[pId].roundScores = [];
      room.players[pId].roundAccuracies = [];
      room.players[pId].drawings = [];
      room.players[pId].ready = false;
    }

    return room;
  }
}

export const gameManager = new GameManager();
