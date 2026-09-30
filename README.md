# 🎨 DoodleClash - Realtime Dual-Screen Drawing Competition

**DoodleClash** is a fast-paced, real-time multiplayer drawing competition game designed for mobile and web. Two players face off head-to-head in a dual-screen battle arena with ultra-low latency WebRTC stroke synchronization, prompt-based rounds, custom drawing studio tools, and computer vision accuracy scoring.

---

## ⚡ Features

- **📱 Mobile-First Ergonomic Layout**: 
  - **Upper Canvas**: Live mirror of your opponent's drawing in real time.
  - **Lower Canvas**: Your own interactive drawing canvas positioned right under your thumbs.
- **🌐 Real-Time WebRTC P2P Sync**:
  - Sub-millisecond peer-to-peer data channel stroke, spray, and shape streaming.
  - Automatic WebSocket fallback signaling.
- **🔢 4-Digit Room Codes**: Quick and easy lobby creation or room joining via a mobile-friendly PIN pad.
- **🖌️ Creative Studio Tools**:
  - Continuous size slider (2px to 60px) for both Pen and Eraser.
  - **Artistic Brushes**: Solid Pen, Neon Glow, Highlighter, and Spray Airbrush.
  - **Geometric Vector Shapes**: Line, Rectangle, Circle, 5-Point Star, and Heart with Fill/Outline toggle.
  - Instant Undo / Redo history and Canvas Clear.
- **🤖 Computer Vision Accuracy Scoring**:
  - Pixel-density and contour analysis comparing player drawings against target emoji silhouettes.
- **🏆 5-Round Match Loop & Cinematic Showcase**:
  - Automatic canvas wipe on new round starts.
  - Round countdown timers.
  - Post-round and endgame cinematic showcases with celebratory confetti.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas API, WebRTC
- **Backend**: Node.js, Express, `ws` (WebSockets), Vite
- **Deployment Ready**: Fully self-contained single-port full-stack architecture (ideal for Render, Railway, Fly.io, or local Wi-Fi)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
git clone https://github.com/maxumbela/doodleclash.git
cd doodleclash
npm install
```

### Development
```bash
# Start frontend and backend
npm run dev
```

### Production Build & Run
```bash
# Build frontend
npm run build

# Start production server (serves frontend + WebSockets on port 3001)
npx tsx server/index.ts
```

Open `http://localhost:3001` or connect two devices on the same local Wi-Fi using your machine's IP (e.g., `http://192.168.x.x:3001`).

---

## 📄 License
MIT
