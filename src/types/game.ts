export type ToolType = 
  | 'brush' 
  | 'neon' 
  | 'highlighter' 
  | 'spray' 
  | 'eraser' 
  | 'bucket'
  | 'line'
  | 'rect'
  | 'circle'
  | 'star'
  | 'heart';

export interface DrawPoint {
  x: number; // 0 to 1 normalized coordinates for resolution-independence
  y: number;
}

export interface DrawStrokeEvent {
  type: 'stroke_step';
  x0: number; // 0 to 1
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  tool: ToolType;
  glow?: boolean;
}

export interface DrawShapeEvent {
  type: 'shape_draw';
  shape: 'line' | 'rect' | 'circle' | 'star' | 'heart';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
  fill: boolean;
  glow?: boolean;
}

export interface DrawSprayEvent {
  type: 'spray_step';
  cx: number;
  cy: number;
  points: Array<{ dx: number; dy: number }>;
  color: string;
  size: number;
}

export interface DrawBucketEvent {
  type: 'bucket_fill';
  x: number;
  y: number;
  color: string;
}

export interface CanvasClearEvent {
  type: 'canvas_clear';
}

export interface CanvasUndoEvent {
  type: 'canvas_undo';
  historyIndex: number;
}

export interface ReactionEvent {
  type: 'reaction';
  emoji: string;
  id: string;
  x?: number;
}

export type WebRTCMessage = 
  | DrawStrokeEvent
  | DrawShapeEvent
  | DrawSprayEvent
  | DrawBucketEvent
  | CanvasClearEvent
  | CanvasUndoEvent
  | ReactionEvent
  | { type: 'ping' }
  | { type: 'pong' };

export interface PromptItem {
  id: string;
  emoji: string;
  title: string;
  hint: string;
  category: string;
  primaryColors: string[]; // Expected color affinities e.g. ['#ef4444', '#10b981']
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  score: number;
  roundScores: number[];
  roundAccuracies: number[];
  drawings: string[]; // data URLs of submitted drawings for each round
  ready: boolean;
}

export type GamePhase = 
  | 'LOBBY'          // 4-digit code entry / host room
  | 'WAITING'        // waiting for opponent / ready
  | 'ROUND_COUNTDOWN'// 3, 2, 1, GO!
  | 'DRAWING'        // Active 45s battle
  | 'ROUND_SHOWCASE' // Cinematic showdown: side-by-side reveal & score rollout
  | 'GAME_OVER';     // 5 rounds done: Grand Champion podium & all drawings gallery

export interface RoomSettings {
  roundDuration: number; // e.g. 30, 45, 60, 90, 120 seconds
  totalRounds: number;   // e.g. 1, 3, 5, 7 rounds
  category: string;      // 'all' | 'Animal' | 'Food' | 'Object' | 'Nature' | 'Vehicle'
}

export interface RoomState {
  roomId: string;
  phase: GamePhase;
  currentRound: number; // 1 to 5
  totalRounds: number;
  currentPrompt: PromptItem | null;
  timerSeconds: number;
  settings: RoomSettings;
  players: {
    [socketId: string]: Player;
  };
  roundWinnerId: string | null;
  overallWinnerId: string | null;
}

export interface AccuracyBreakdown {
  overall: number;       // 0 to 100
  silhouetteMatch: number; // 0 to 100
  strokeDetail: number;    // 0 to 100
  colorHarmony: number;    // 0 to 100
  commentary: string;      // Fun gaming critique
}

