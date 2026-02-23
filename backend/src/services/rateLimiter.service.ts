import { getDb } from '../database';
import { config } from '../config';
import { getActiveSessionCount, updateSessionStatus } from './session.service';
import type { QueueEntry } from '../types';

export function canStartSession(): boolean {
  return getActiveSessionCount() < config.maxConcurrentSessions;
}

export function getAvailableSlots(): number {
  return Math.max(0, config.maxConcurrentSessions - getActiveSessionCount());
}

export function addToQueue(sessionId: string, patientId: string): QueueEntry {
  const db = getDb();

  const existing = db
    .prepare('SELECT * FROM session_queue WHERE session_id = ?')
    .get(sessionId) as QueueEntry | undefined;

  if (existing) {
    return existing;
  }

  const lastPosition = db
    .prepare('SELECT MAX(position) as max_pos FROM session_queue')
    .get() as { max_pos: number | null };

  const position = (lastPosition.max_pos ?? 0) + 1;
  const estimatedWait = estimateWaitTime(position);

  db.prepare(
    `INSERT INTO session_queue (session_id, patient_id, position, estimated_wait_seconds, queued_at)
     VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(sessionId, patientId, position, estimatedWait);

  return {
    session_id: sessionId,
    patient_id: patientId,
    position,
    estimated_wait_seconds: estimatedWait,
    queued_at: new Date().toISOString(),
  };
}

export function removeFromQueue(sessionId: string): void {
  const db = getDb();

  const entry = db
    .prepare('SELECT position FROM session_queue WHERE session_id = ?')
    .get(sessionId) as { position: number } | undefined;

  if (!entry) return;

  db.prepare('DELETE FROM session_queue WHERE session_id = ?').run(sessionId);

  db.prepare(
    'UPDATE session_queue SET position = position - 1 WHERE position > ?'
  ).run(entry.position);
}

export function getQueuePosition(sessionId: string): QueueEntry | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM session_queue WHERE session_id = ?')
    .get(sessionId) as QueueEntry | undefined;
}

export function getQueueStatus(): { queue_length: number; entries: QueueEntry[] } {
  const db = getDb();
  const entries = db
    .prepare('SELECT * FROM session_queue ORDER BY position ASC')
    .all() as QueueEntry[];

  return { queue_length: entries.length, entries };
}

export function processQueue(): QueueEntry | null {
  if (!canStartSession()) return null;

  const db = getDb();
  const next = db
    .prepare('SELECT * FROM session_queue ORDER BY position ASC LIMIT 1')
    .get() as QueueEntry | undefined;

  if (!next) return null;

  removeFromQueue(next.session_id);
  updateSessionStatus(next.session_id, 'preparing');

  return next;
}

function estimateWaitTime(position: number): number {
  const avgSessionMinutes = config.ai.averageSessionDurationMinutes;
  const concurrent = config.maxConcurrentSessions;
  const turnoverPerMinute = concurrent / avgSessionMinutes;
  const estimatedMinutes = position / turnoverPerMinute;
  return Math.ceil(estimatedMinutes * 60);
}

export function updateQueueEstimates(): void {
  const db = getDb();
  const entries = db
    .prepare('SELECT * FROM session_queue ORDER BY position ASC')
    .all() as QueueEntry[];

  const updateStmt = db.prepare(
    'UPDATE session_queue SET estimated_wait_seconds = ? WHERE session_id = ?'
  );

  for (const entry of entries) {
    const newEstimate = estimateWaitTime(entry.position);
    updateStmt.run(newEstimate, entry.session_id);
  }
}
