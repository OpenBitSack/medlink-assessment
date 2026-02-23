# Key Decisions & Trade-offs

## Architecture

### Monorepo with Separate Frontend/Backend
I chose a monorepo structure (`frontend/` + `backend/`) over a single full-stack framework (Next.js, Remix) for clarity of separation. In a healthcare platform, backend services handling PHI need independent deployment, scaling, and security policies. A monorepo keeps the developer experience simple while maintaining that boundary.

### React + Vite (Frontend) / Express + Socket.IO (Backend)
- **React** for the frontend gives us fine-grained control over the interview UX — animations, state management, and real-time updates without framework opinions getting in the way.
- **Vite** for near-instant HMR during development.
- **Express** is deliberately lightweight; this is a prototype, and Express lets us focus on business logic over framework ceremony.
- **Socket.IO** for real-time bidirectional communication — essential for the interview's AI state changes, transcript streaming, and connection recovery. It also handles WebSocket fallback to long-polling automatically, which matters for patients on flaky mobile connections.

### SQLite (via better-sqlite3) for Persistence
For a prototype, SQLite eliminates infrastructure complexity while still giving us real SQL semantics (transactions, indexes, foreign keys). In production, this would migrate to PostgreSQL with encryption-at-rest for PHI compliance. The data access layer is structured to make this migration straightforward — all database access goes through service modules, not raw queries in routes.

---

## Frontend Decisions

### Mobile-First, Not Mobile-Also
The interview screen is designed for the literal scenario described: a person on their phone at 11pm. Every decision flows from this:
- **Viewport-height layout** (`100dvh`) to avoid mobile browser chrome issues
- **Large touch targets** (44px+ buttons) for anxious, possibly shaking hands
- **Minimal chrome** — no navigation bars, settings, or distractions during the interview
- **Safe-area padding** for notched devices

### AI State Communication via Animated Orb
Rather than text labels alone, the AI state (listening, thinking, speaking) is communicated through a central animated orb with color, motion, and secondary visual cues:
- **Listening** = green + audio waveform bars — the patient sees the AI is actively receiving
- **Thinking** = amber + floating dots — conveys processing without feeling stalled
- **Speaking** = purple/indigo + pulsing dots — distinct from listening

This solves the "uncomfortable silence" problem: when the AI is processing after a heavy disclosure, the patient sees warm amber animation and the label "Reflecting on what you shared..." rather than dead silence. After 15 seconds of silence during the listening state, the system proactively sends a comfort message ("Take your time. There's no rush here.").

### Transcript Toggle (Not Always Visible)
The transcript is hidden by default during the interview. Reading your own words about mental health during an interview creates self-consciousness and can interrupt emotional flow. The toggle exists for patients who find it grounding to see the conversation in text.

---

## Backend Decisions

### Session Recovery Rules
Sessions can be resumed if:
1. Less than **30 minutes** since interruption (configurable)
2. Less than **24 hours** since creation
3. Status is `interrupted` (not `completed`, `expired`, or `abandoned`)

Sessions should NOT be resumed if they're too stale — the patient's emotional state may have changed significantly, and the AI picking up mid-conversation after hours could feel jarring and clinically irresponsible.

### Transcript Stitching
When a session drops and resumes, it creates separate segments. The stitching service:
1. **Orders** segments chronologically
2. **Deduplicates** overlapping content (reconnections often replay the last few messages)
3. **Marks gaps** — gaps over 10 seconds are annotated; gaps over 60 seconds are labeled as session resumes

This gives clinicians reviewing the transcript a clear picture of what happened, including how long the patient was disconnected.

### Rate Limiting with Dignity
The 50-concurrent-session cap is a hard constraint. The system:
1. Tracks active sessions in the database (not in-memory, so it survives restarts)
2. Queues overflow patients with their **position** and **estimated wait time**
3. Automatically promotes queued patients when slots open (via periodic cleanup + session completion events)
4. Gives patients honest messaging: their place in line, estimated wait, and the 988 crisis line if they need immediate help

The wait screen is designed to be calming (animated orb, gentle language) rather than clinical ("Error: capacity exceeded").

### Mock AI Service
The AI voice agent is fully mocked with a structured clinical interview (15 questions). The mock includes:
- **Crisis detection**: messages containing suicidal ideation trigger an immediate empathy response with the 988 crisis line
- **Distress detection**: keywords like "hopeless" or "overwhelmed" trigger supportive acknowledgment before continuing
- **Configurable timing**: thinking delays and speaking duration are calculated from word count to feel natural

---

## What I'd Do Differently with More Time

1. **End-to-end encryption for transcripts**: Transcripts contain PHI. In production, I'd implement client-side encryption before transmission and at-rest encryption in the database. The current prototype stores plaintext.

2. **Real voice integration**: Web Speech API for speech-to-text/text-to-speech would make the interview genuinely voice-based. The UI is designed for this — the microphone button, AI speaking state, and audio waveform visualizations are all ready for real audio.

3. **Session analytics & monitoring**: Structured logging, session duration tracking, drop-off rates, and alerting (e.g., PagerDuty for sessions silently failing at 3am). The backend logs to stdout; production needs structured observability.

4. **Horizontal scaling**: The current rate limiter uses SQLite for tracking concurrent sessions. At scale, this needs Redis or a distributed lock for accurate cross-instance counting.

5. **Accessibility audit**: Screen reader support, keyboard navigation through the interview, high-contrast mode. The current prototype focuses on visual design but needs a thorough a11y pass.

6. **Gantt chart performance**: For patients with hundreds of events spanning decades, the current DOM-based rendering would need virtualization. Canvas or WebGL rendering (via something like Pixi.js) would handle larger datasets.

7. **Testing**: Unit tests for transcript stitching logic, integration tests for session recovery flows, and Playwright E2E tests for the interview experience.
