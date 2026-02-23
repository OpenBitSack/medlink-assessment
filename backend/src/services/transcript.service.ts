import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database';
import type { TranscriptSegment, StitchedTranscript, TranscriptEntry, GapMarker } from '../types';

export function addTranscriptSegment(
  sessionId: string,
  speaker: 'ai' | 'patient',
  content: string,
  durationMs?: number
): TranscriptSegment {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const lastSegment = db
    .prepare(
      'SELECT segment_index, timestamp FROM transcript_segments WHERE session_id = ? ORDER BY segment_index DESC LIMIT 1'
    )
    .get(sessionId) as { segment_index: number; timestamp: string } | undefined;

  const segmentIndex = lastSegment ? lastSegment.segment_index + 1 : 0;

  let gapBeforeMs: number | null = null;
  if (lastSegment) {
    const lastTime = new Date(lastSegment.timestamp).getTime();
    const currentTime = new Date(now).getTime();
    gapBeforeMs = currentTime - lastTime;
  }

  db.prepare(
    `INSERT INTO transcript_segments (id, session_id, segment_index, speaker, content, timestamp, duration_ms, is_final, gap_before_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(id, sessionId, segmentIndex, speaker, content, now, durationMs || null, gapBeforeMs);

  return db.prepare('SELECT * FROM transcript_segments WHERE id = ?').get(id) as TranscriptSegment;
}

export function getTranscriptSegments(sessionId: string): TranscriptSegment[] {
  const db = getDb();
  return db
    .prepare(
      'SELECT * FROM transcript_segments WHERE session_id = ? ORDER BY segment_index ASC'
    )
    .all(sessionId) as TranscriptSegment[];
}

/**
 * Stitches multiple conversation segments from a potentially interrupted session
 * into a single coherent transcript with gap markers.
 *
 * Handles:
 * - Ordering segments chronologically
 * - Detecting and marking gaps (network drops, session resumes)
 * - Deduplicating overlapping content from reconnection
 */
export function stitchTranscript(sessionId: string): StitchedTranscript {
  const segments = getTranscriptSegments(sessionId);

  if (segments.length === 0) {
    return {
      session_id: sessionId,
      segments: [],
      gaps: [],
      total_duration_ms: 0,
      created_at: new Date().toISOString(),
    };
  }

  const sorted = [...segments].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const deduped = deduplicateSegments(sorted);

  const entries: TranscriptEntry[] = [];
  const gaps: GapMarker[] = [];

  const GAP_THRESHOLD_MS = 10000; // 10 seconds indicates a meaningful gap

  for (let i = 0; i < deduped.length; i++) {
    const segment = deduped[i];

    if (i > 0 && segment.gap_before_ms && segment.gap_before_ms > GAP_THRESHOLD_MS) {
      gaps.push({
        after_segment_index: i - 1,
        gap_duration_ms: segment.gap_before_ms,
        reason: segment.gap_before_ms > 60000 ? 'session_resume' : 'network_drop',
        timestamp: segment.timestamp,
      });
    }

    entries.push({
      speaker: segment.speaker,
      content: segment.content,
      timestamp: segment.timestamp,
      segment_index: i,
    });
  }

  const firstTime = new Date(sorted[0].timestamp).getTime();
  const lastTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const lastDuration = sorted[sorted.length - 1].duration_ms || 0;

  return {
    session_id: sessionId,
    segments: entries,
    gaps,
    total_duration_ms: lastTime - firstTime + lastDuration,
    created_at: new Date().toISOString(),
  };
}

/**
 * Removes overlapping/duplicate content that can occur when a session
 * reconnects and replays the last few messages.
 */
function deduplicateSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  if (segments.length <= 1) return segments;

  const result: TranscriptSegment[] = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const prev = result[result.length - 1];

    const isSameSpeaker = current.speaker === prev.speaker;
    const isSameContent = current.content.trim() === prev.content.trim();
    const timeDiff =
      Math.abs(new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime());
    const isCloseInTime = timeDiff < 5000;

    if (isSameSpeaker && isSameContent && isCloseInTime) {
      continue;
    }

    if (isSameSpeaker && isCloseInTime && !isSameContent) {
      const overlap = findOverlap(prev.content, current.content);
      if (overlap.length > 20) {
        result[result.length - 1] = {
          ...prev,
          content: prev.content + current.content.slice(overlap.length),
        };
        continue;
      }
    }

    result.push(current);
  }

  return result;
}

function findOverlap(str1: string, str2: string): string {
  const maxLen = Math.min(str1.length, str2.length);
  let overlap = '';

  for (let len = 1; len <= maxLen; len++) {
    const end = str1.slice(-len);
    const start = str2.slice(0, len);
    if (end === start) {
      overlap = end;
    }
  }

  return overlap;
}
