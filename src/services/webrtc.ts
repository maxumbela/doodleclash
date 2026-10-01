import { RoomState, WebRTCMessage } from '../types/game';

type EventListener = (data: any) => void;

class NetworkManager {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  public socketId: string = '';
  public currentRoom: RoomState | null = null;
  public isWebRTCConnected: boolean = false;

  private listeners: Map<string, Set<EventListener>> = new Map();

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    // If running in Vite dev with proxy on port 3000, target 3001 or /ws proxy
    const wsUrl = typeof window !== 'undefined' && window.location.port === '3000'
      ? `${isHttps ? 'wss:' : 'ws:'}//${host}:3001`
      : `${isHttps ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('⚡ Connected to signaling server');
        this.emit('ws_connected', true);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('Signaling server closed, retrying in 2s...');
        this.emit('ws_connected', false);
        setTimeout(() => this.initWebSocket(), 2000);
      };

      this.ws.onerror = (err) => {
        console.warn('Signaling WS error:', err);
      };
    } catch (e) {
      console.error('Error instantiating WebSocket:', e);
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'connected':
        this.socketId = msg.socketId;
        this.emit('connected', msg.socketId);
        break;

      case 'room_created':
      case 'room_joined':
        this.currentRoom = msg.room;
        this.emit('room_update', msg.room);
        break;

      case 'peer_joined':
        this.currentRoom = msg.room;
        this.emit('room_update', msg.room);
        // If host, initiate WebRTC offer
        const hostPlayer = Object.values(msg.room.players).find((p: any) => (p as any).isHost) as any;
        if (hostPlayer && hostPlayer.id === this.socketId) {
          this.initiateWebRTCOffer();
        }
        break;

      case 'peer_left':
        this.currentRoom = msg.room;
        this.emit('room_update', msg.room);
        this.closePeerConnection();
        break;

      case 'webrtc_signal':
        this.handlePeerSignal(msg.data);
        break;

      case 'relay_event':
        this.handleDataChannelMessage(msg.data);
        break;

      case 'round_countdown_started':
      case 'drawing_phase_started':
      case 'round_showcase_started':
      case 'player_ready_state':
      case 'room_settings_updated':
      case 'rematch_started':
      case 'game_over':
        this.currentRoom = msg.room;
        this.emit('room_update', msg.room);
        break;


      case 'timer_tick':
        this.emit('timer_tick', { phase: msg.phase, seconds: msg.timerSeconds });
        break;

      case 'times_up_request_drawing':
        this.emit('request_submission');
        break;

      case 'error':
        this.emit('error', msg.message);
        break;
    }
  }

  // --- WebRTC PeerConnection Management ---

  private async createPeerConnection() {
    if (this.pc) return this.pc;

    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'webrtc_signal',
          data: { candidate: event.candidate }
        }));
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', this.pc?.connectionState);
      if (this.pc?.connectionState === 'connected') {
        this.isWebRTCConnected = true;
        this.emit('webrtc_connected', true);
      } else if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
        this.isWebRTCConnected = false;
        this.emit('webrtc_connected', false);
      }
    };

    return this.pc;
  }

  private async initiateWebRTCOffer() {
    try {
      const pc = await this.createPeerConnection();

      // Create low-latency data channel
      this.dataChannel = pc.createDataChannel('drawing_stream', {
        ordered: false,
        maxRetransmits: 0
      });
      this.setupDataChannel(this.dataChannel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.ws?.send(JSON.stringify({
        type: 'webrtc_signal',
        data: { sdp: offer }
      }));
    } catch (err) {
      console.error('Failed to initiate WebRTC offer:', err);
    }
  }

  private async handlePeerSignal(signal: any) {
    try {
      const pc = await this.createPeerConnection();

      if (signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

        if (signal.sdp.type === 'offer') {
          // Listen for incoming data channel
          pc.ondatachannel = (e) => {
            this.dataChannel = e.channel;
            this.setupDataChannel(e.channel);
          };

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          this.ws?.send(JSON.stringify({
            type: 'webrtc_signal',
            data: { sdp: answer }
          }));
        }
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error('Error handling peer signal:', err);
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log('🚀 WebRTC DataChannel OPEN! Ultra-low latency active.');
      this.isWebRTCConnected = true;
      this.emit('webrtc_connected', true);
    };

    channel.onclose = () => {
      console.log('WebRTC DataChannel closed');
      this.isWebRTCConnected = false;
      this.emit('webrtc_connected', false);
    };

    channel.onerror = (err) => {
      console.warn('DataChannel error:', err);
    };

    channel.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleDataChannelMessage(msg);
      } catch (e) {
        console.error('Error parsing data channel message:', e);
      }
    };
  }

  private handleDataChannelMessage(msg: WebRTCMessage) {
    switch (msg.type) {
      case 'stroke_step':
        this.emit('opponent_stroke', msg);
        break;
      case 'shape_draw':
        this.emit('opponent_shape', msg);
        break;
      case 'spray_step':
        this.emit('opponent_spray', msg);
        break;
      case 'bucket_fill':
        this.emit('opponent_bucket', msg);
        break;
      case 'canvas_clear':
        this.emit('opponent_clear', msg);
        break;
      case 'canvas_undo':
        this.emit('opponent_undo', msg);
        break;
      case 'reaction':
        this.emit('opponent_reaction', msg);
        break;
    }
  }

  private closePeerConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.isWebRTCConnected = false;
  }

  // --- Public API for UI & Drawing ---

  public sendDrawingEvent(msg: WebRTCMessage) {
    // If WebRTC DataChannel is ready, use it for peer-to-peer 0-overhead transport
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(msg));
        return;
      } catch (e) {
        console.warn('Error sending over dataChannel, falling back to WS:', e);
      }
    }

    // Fallback: relay through websocket server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'relay_event',
        data: msg
      }));
    }
  }

  public createRoom(name: string, avatar: string, settings?: any) {
    this.ws?.send(JSON.stringify({
      type: 'create_room',
      name,
      avatar,
      settings
    }));
  }

  public updateRoomSettings(settings: any) {
    this.ws?.send(JSON.stringify({
      type: 'update_room_settings',
      settings
    }));
  }

  public joinRoom(roomId: string, name: string, avatar: string) {
    this.ws?.send(JSON.stringify({
      type: 'join_room',
      roomId,
      name,
      avatar
    }));
  }

  public setReady(ready: boolean) {
    this.ws?.send(JSON.stringify({
      type: 'set_ready',
      ready
    }));
  }

  public submitDrawing(drawingDataUrl: string, accuracy: number) {
    this.ws?.send(JSON.stringify({
      type: 'submit_drawing',
      drawingDataUrl,
      accuracy
    }));
  }

  public requestRematch() {
    this.ws?.send(JSON.stringify({
      type: 'rematch'
    }));
  }

  // --- Simple Event Pub/Sub ---
  public on(event: string, callback: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventListener) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in listener for ${event}:`, err);
      }
    });
  }
}

export const network = new NetworkManager();
