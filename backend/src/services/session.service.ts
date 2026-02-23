import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import { config } from '../config';
import type { Session, SessionRecoveryResult, SessionStatus } from '../types';

export function createSession(patientId: string): Session {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, patient_id, status, ai_state, current_question_index, created_at, updated_at, metadata)
     VALUES (?, ?, 'waiting', 'idle', 0, ?, ?, '{}')`
  ).run(id, patientId, now, now);

  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session;
}

export function getSession(sessionId: string): Session | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session | undefined;
}

export function getActiveSessionForPatient(patientId: string): Session | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM sessions 
       WHERE patient_id = ? AND status IN ('waiting', 'preparing', 'in_progress', 'interrupted', 'resuming')
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(patientId) as Session | undefined;
}

export function updateSessionStatus(sessionId: string, status: SessionStatus): Session | undefined {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: Record<string, string | null> = { status, updated_at: now };

  if (status === 'in_progress' && !getSession(sessionId)?.started_at) {
    updates.started_at = now;
  }
  if (status === 'interrupted') {
    updates.interrupted_at = now;
  }
  if (status === 'resuming') {
    updates.resumed_at = now;
  }
  if (status === 'completed') {
    updates.completed_at = now;
  }

  const setClauses = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(', ');
  const values = Object.values(updates);

  db.prepare(`UPDATE sessions SET ${setClauses} WHERE id = ?`).run(...values, sessionId);

  return getSession(sessionId);
}

export function updateSessionAIState(
  sessionId: string,
  aiState: string
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE sessions SET ai_state = ?, updated_at = ? WHERE id = ?`).run(
    aiState,
    now,
    sessionId
  );
}

export function updateQuestionIndex(sessionId: string, index: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE sessions SET current_question_index = ?, updated_at = ? WHERE id = ?`
  ).run(index, now, sessionId);
}

export function heartbeat(sessionId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE sessions SET last_heartbeat = ?, updated_at = ? WHERE id = ?`).run(
    now,
    now,
    sessionId
  );
}

export function getActiveSessions(): Session[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM sessions WHERE status IN ('preparing', 'in_progress', 'resuming')`
    )
    .all() as Session[];
}

export function getActiveSessionCount(): number {
  const db = getDb();
  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM sessions WHERE status IN ('preparing', 'in_progress', 'resuming')`
    )
    .get() as { count: number };
  return result.count;
}

export function checkSessionRecovery(sessionId: string): SessionRecoveryResult {
  const session = getSession(sessionId);

  if (!session) {
    return { can_resume: false, reason: 'Session not found' };
  }

  if (session.status === 'completed') {
    return { can_resume: false, reason: 'Session has already been completed' };
  }

  if (session.status === 'expired' || session.status === 'abandoned') {
    return { can_resume: false, reason: 'Session has expired or was abandoned' };
  }

  const interruptedAt = session.interrupted_at
    ? new Date(session.interrupted_at)
    : new Date(session.updated_at);
  const now = new Date();
  const minutesSinceInterrupt = (now.getTime() - interruptedAt.getTime()) / 60000;

  if (minutesSinceInterrupt > config.sessionResumeWindowMinutes) {
    updateSessionStatus(sessionId, 'expired');
    return {
      can_resume: false,
      reason: `Session exceeded the ${config.sessionResumeWindowMinutes}-minute resume window`,
    };
  }

  const createdAt = new Date(session.created_at);
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / 3600000;

  if (hoursSinceCreation > config.sessionExpireHours) {
    updateSessionStatus(sessionId, 'expired');
    return {
      can_resume: false,
      reason: 'Session has exceeded maximum lifetime',
    };
  }

  const db = getDb();
  const lastSegment = db
    .prepare(
      'SELECT * FROM transcript_segments WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1'
    )
    .get(sessionId);

  return {
    can_resume: true,
    session,
    last_transcript_segment: lastSegment as any,
  };
}

export function cleanupStaleSessions(): number {
  const db = getDb();
  const staleThreshold = new Date(
    Date.now() - config.sessionResumeWindowMinutes * 60 * 1000
  ).toISOString();

  const result = db
    .prepare(
      `UPDATE sessions SET status = 'expired', updated_at = datetime('now')
       WHERE status = 'interrupted' AND interrupted_at < ?`
    )
    .run(staleThreshold);

  return result.changes;
}
