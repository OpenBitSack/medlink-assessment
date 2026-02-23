# MedLink — AI Clinical Interview Platform

A working prototype of [MedLink Global's](https://medlink.global/) AI-powered patient interview system. The platform features **Delfia**, an AI voice agent that conducts structured clinical interviews, with real-time transcription, session recovery, and a clinician dashboard for longitudinal patient history.

The UI follows MedLink Global's brand identity — light purple palette, Noto Serif headings, and the same professional-yet-approachable aesthetic as [medlink.global](https://medlink.global/).

## Quick Start

### Prerequisites
- **Node.js** >= 18 (tested with v20)
- **npm** >= 9

### 1. Clone & Install

```bash
git clone <repo-url>
cd Medlink-assessment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

The defaults work for local development:

```env
PORT=3001
NODE_ENV=development
DB_PATH=./data/medlink.db
MAX_CONCURRENT_SESSIONS=50
SESSION_RESUME_WINDOW_MINUTES=30
SESSION_EXPIRE_HOURS=24
CORS_ORIGIN=http://localhost:5173
```

No changes needed for local development.

### 3. Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

The app will be available at:
- **Patient Interview**: http://localhost:5173
- **Clinician Dashboard**: http://localhost:5173/dashboard
- **Backend API**: http://localhost:3001

---

## Project Structure

```
Medlink-assessment/
├── backend/                    # Express + TypeScript + SQLite + Socket.IO
│   ├── src/
│   │   ├── index.ts           # Entry point, server setup
│   │   ├── config.ts          # Environment configuration
│   │   ├── database.ts        # SQLite schema & connection
│   │   ├── websocket.ts       # Real-time interview communication
│   │   ├── routes/
│   │   │   ├── session.routes.ts      # Session CRUD & lifecycle
│   │   │   ├── transcript.routes.ts   # Transcript retrieval & stitching
│   │   │   └── queue.routes.ts        # Queue status & position
│   │   ├── services/
│   │   │   ├── session.service.ts     # Session management & recovery
│   │   │   ├── transcript.service.ts  # Transcript stitching & dedup
│   │   │   ├── rateLimiter.service.ts # Concurrent session management
│   │   │   └── mockAI.service.ts      # Mock Delfia voice agent
│   │   ├── middleware/
│   │   │   └── error.ts              # Error handling
│   │   └── types/
│   │       └── index.ts              # Shared type definitions
│   └── .env                   # Environment variables
│
├── frontend/                   # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx            # Routing
│   │   ├── components/
│   │   │   ├── interview/
│   │   │   │   ├── InterviewScreen.tsx    # Main interview experience
│   │   │   │   ├── AIStateIndicator.tsx   # Animated AI state orb
│   │   │   │   ├── TranscriptDisplay.tsx  # Live transcript view
│   │   │   │   ├── WaitingRoom.tsx        # Queue waiting experience
│   │   │   │   ├── SessionRecovery.tsx    # Resume interrupted session
│   │   │   │   └── CompletedScreen.tsx    # Post-interview screen
│   │   │   └── dashboard/
│   │   │       └── GanttChart.tsx         # Patient timeline Gantt chart
│   │   ├── hooks/
│   │   │   └── useInterview.ts    # Interview state management
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx  # Clinician dashboard
│   │   ├── services/
│   │   │   ├── api.ts             # REST API client
│   │   │   └── socket.ts         # WebSocket client
│   │   └── types/
│   │       └── index.ts          # Frontend type definitions
│   └── public/
│       └── sample_patient_data.csv  # Sample patient data for Gantt chart
│
├── sample_patient_data.csv     # Source patient data CSV
├── DECISIONS.md                # Architecture decisions & trade-offs
└── README.md                   # This file
```

---

## Features

### Part 1 — Patient Interview Experience (Delfia)
- **MedLink-branded UI** — light purple palette, Noto Serif headings, matching [medlink.global](https://medlink.global/) design language
- **Mobile-first design** optimized for phones — large touch targets, minimal chrome, safe-area support
- **AI state indicator** — animated orb communicates Delfia's state: listening (green), thinking (amber), speaking (brand purple)
- **Session lifecycle** — preparing → in-progress → interrupted → resuming → completed
- **Uncomfortable silence handling** — comfort messages after 15s of silence; "Reflecting on what you shared..." during processing
- **Crisis detection** — suicidal ideation keywords trigger immediate crisis resources (988 Lifeline)
- **Toggle transcript** — hidden by default to reduce self-consciousness; available on demand

### Part 2 — Backend
- **Session recovery** — sessions persist in SQLite; interrupted sessions can resume within 30 minutes
- **Transcript stitching** — merges segments from dropped sessions; deduplicates overlapping content; marks gaps
- **Rate limiting with dignity** — tracks 50 concurrent sessions; queues overflow with position, estimated wait, and humane messaging

### Bonus — Clinician Dashboard
- **Interactive Gantt chart** — patient health timeline with events grouped by category
- **Color-coded** by event type (psychiatric meds, non-psychiatric meds, medical events, social/life events)
- **Filtering** — by category, status (active/completed), medication type toggle
- **Collapsible years** — click year headers to collapse/expand
- **Hover tooltips** — detailed event information; auto-flips above bar when near bottom of chart
- **Handles edge cases** — ongoing events (striped bars), single-day events (dot markers), overlapping events

---

## API Endpoints

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create a new session |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions/:id/start` | Start interview |
| POST | `/api/sessions/:id/interrupt` | Mark session interrupted |
| POST | `/api/sessions/:id/resume` | Resume interrupted session |
| POST | `/api/sessions/:id/complete` | Complete session |
| POST | `/api/sessions/:id/heartbeat` | Session heartbeat |
| GET | `/api/sessions/:id/recovery` | Check if session can resume |

### Transcripts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transcripts/:sessionId` | Get raw segments |
| GET | `/api/transcripts/:sessionId/stitched` | Get stitched transcript |
| POST | `/api/transcripts/:sessionId/segments` | Add transcript segment |

### Queue
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue/status` | Queue overview |
| GET | `/api/queue/position/:sessionId` | Position for a session |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join_session` | Client → Server | Join a session room |
| `patient_message` | Client → Server | Send patient response |
| `request_comfort` | Client → Server | Request comfort message |
| `session_state` | Server → Client | Full session state sync |
| `session_status` | Server → Client | Status change notification |
| `ai_state_change` | Server → Client | AI state transition (Delfia) |
| `ai_message` | Server → Client | AI speech content |
| `ai_comfort` | Server → Client | Comfort/reassurance message |
| `transcript_update` | Server → Client | New transcript entry |
| `queue_promoted` | Server → Client | Promoted from queue |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18, TypeScript, Vite | Fine-grained UI control for interview UX |
| Styling | Tailwind CSS 4 | Utility-first, mobile-first, rapid iteration |
| Typography | Noto Serif + Inter | Matches MedLink Global's serif/sans-serif pairing |
| Animations | Framer Motion | Smooth AI state transitions |
| Backend | Express 5, TypeScript | Lightweight, focused on business logic |
| Real-time | Socket.IO | Bidirectional with automatic reconnection |
| Database | SQLite (better-sqlite3) | Zero-config for prototype; production → PostgreSQL |
| Charts | Custom (CSS + React) | Lightweight Gantt without heavy dependencies |

---

## Deployment (Free Tier)

The app is configured for **Vercel** (frontend) + **Render** (backend).

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create medlink-assessment --public --source=. --push
```

### Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/index.js`
   - **Plan:** Free
5. Add environment variables:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` (update after Vercel deploy) |
6. Deploy — note your backend URL (e.g. `https://medlink-backend.onrender.com`)

> Alternatively, click **New** → **Blueprint** and point to the `render.yaml` at the repo root.

### Step 3: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework Preset will auto-detect **Vite**
4. Add one environment variable:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://medlink-backend.onrender.com` (your Render URL) |
5. Deploy

### Step 4: Update Backend CORS

Go back to Render → your backend service → **Environment** → update:
```
CORS_ORIGIN=https://your-app.vercel.app
```

### Notes

- **Cold starts**: Render free tier sleeps after 15 min of inactivity. First request takes ~30s.
- **SQLite persistence**: Data resets on each Render deploy (free tier has no persistent disk). For durable storage, swap to [Turso](https://turso.tech/) (free SQLite-over-HTTP) or add a Render persistent disk ($0.25/GB/mo).
- **WebSocket support**: Both Render and Vercel handle WebSocket connections out of the box.
