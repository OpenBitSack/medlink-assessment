# MedLink — AI Clinical Interview Platform

A healthcare platform prototype featuring an AI voice agent for structured patient interviews, with real-time transcription, session recovery, and a clinician dashboard.

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
- **Interview UI**: http://localhost:5173
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
│   │   │   └── mockAI.service.ts      # Mock clinical interview agent
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

### Part 1 — Patient Interview Experience
- **Mobile-first design** optimized for phones — large touch targets, minimal chrome, safe-area support
- **AI state indicator** — animated orb communicates listening (green), thinking (amber), speaking (purple)
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
- **Hover tooltips** — detailed event information on hover
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
| `ai_state_change` | Server → Client | AI state transition |
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
| Animations | Framer Motion | Smooth AI state transitions |
| Backend | Express 5, TypeScript | Lightweight, focused on business logic |
| Real-time | Socket.IO | Bidirectional with automatic reconnection |
| Database | SQLite (better-sqlite3) | Zero-config for prototype; production → PostgreSQL |
| Charts | Custom (CSS + React) | Lightweight Gantt without heavy dependencies |
