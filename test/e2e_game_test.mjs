import { WebSocket } from 'ws';

const WS_URL = 'ws://localhost:3001';

async function runTest() {
  console.log('🧪 Starting 2-Player E2E Game Flow Test...');

  // 1. Player 1 Connects
  const p1 = new WebSocket(WS_URL);
  let p1RoomId = '';

  await new Promise((resolve, reject) => {
    p1.on('open', resolve);
    p1.on('error', reject);
  });
  console.log('✅ Player 1 WebSocket connected');

  // Player 1 creates room
  p1.send(JSON.stringify({
    type: 'create_room',
    name: 'Champion Alice',
    avatar: '🐱'
  }));

  const roomCreatedMsg = await new Promise((resolve) => {
    p1.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'room_created') resolve(msg);
    });
  });

  p1RoomId = roomCreatedMsg.roomId;
  console.log(`✅ Room successfully created with 4-digit code: [${p1RoomId}]`);
  if (!/^\d{4}$/.test(p1RoomId)) {
    throw new Error(`Room ID is not a 4-digit code: ${p1RoomId}`);
  }

  // 2. Player 2 Connects & Joins via 4-Digit Code
  const p2 = new WebSocket(WS_URL);
  await new Promise((resolve, reject) => {
    p2.on('open', resolve);
    p2.on('error', reject);
  });
  console.log('✅ Player 2 WebSocket connected');

  p2.send(JSON.stringify({
    type: 'join_room',
    roomId: p1RoomId,
    name: 'Challenger Bob',
    avatar: '🦊'
  }));

  const [p2JoinedMsg, p1PeerJoinedMsg] = await Promise.all([
    new Promise(res => {
      p2.on('message', data => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'room_joined') res(msg);
      });
    }),
    new Promise(res => {
      p1.on('message', data => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'peer_joined') res(msg);
      });
    })
  ]);

  console.log('✅ Player 2 joined successfully & Player 1 notified');

  // 3. Test WebRTC Signal Relay
  const testSdp = { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...' };
  p1.send(JSON.stringify({
    type: 'webrtc_signal',
    data: { sdp: testSdp }
  }));

  const receivedSignal = await new Promise(res => {
    p2.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'webrtc_signal') res(msg);
    });
  });

  console.log('✅ WebRTC Signal successfully relayed to Player 2');

  // 4. Test Player Ready & Round Start
  p1.send(JSON.stringify({ type: 'set_ready', ready: true }));
  p2.send(JSON.stringify({ type: 'set_ready', ready: true }));

  const roundCountdown = await new Promise(res => {
    p1.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'round_countdown_started') res(msg);
    });
  });

  console.log(`✅ 5-Round Game started! Round ${roundCountdown.room.currentRound} target: ${roundCountdown.room.currentPrompt.emoji} (${roundCountdown.room.currentPrompt.title})`);

  // 5. Test Stroke Relay
  const testStroke = {
    type: 'stroke_step',
    x0: 0.2, y0: 0.2, x1: 0.5, y1: 0.5,
    color: '#ef4444', size: 8, tool: 'brush'
  };

  p1.send(JSON.stringify({
    type: 'relay_event',
    data: testStroke
  }));

  const relayedStroke = await new Promise(res => {
    p2.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'relay_event' && msg.data.type === 'stroke_step') res(msg);
    });
  });

  console.log('✅ Real-time drawing stroke successfully relayed between players');

  // 6. Test Drawing Submission & Accuracy Scoring
  p1.send(JSON.stringify({
    type: 'submit_drawing',
    drawingDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    accuracy: 86
  }));

  p2.send(JSON.stringify({
    type: 'submit_drawing',
    drawingDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    accuracy: 74
  }));

  const roundShowcase = await new Promise(res => {
    p1.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'round_showcase_started') res(msg);
    });
  });

  console.log(`✅ Round Showcase triggered! Round Winner: Player ID ${roundShowcase.room.roundWinnerId}`);

  p1.close();
  p2.close();

  console.log('🎉 ALL E2E GAME FLOW TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
