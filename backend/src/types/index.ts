export type SessionStatus =
  | 'waiting'
  | 'preparing'
  | 'in_progress'
  | 'interrupted'
  | 'resuming'
  | 'completed'
  | 'expired'
  | 'abandoned';

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Session {
  id: string;
  patient_id: string;
  status: SessionStatus;
  ai_state: AIState;
  current_question_index: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  interrupted_at: string | null;
  resumed_at: string | null;
  last_heartbeat: string | null;
  metadata: string;
}

export interface TranscriptSegment {
  id: string;
  session_id: string;
  segment_index: number;
  speaker: 'ai' | 'patient';
  content: string;
  timestamp: string;
  duration_ms: number | null;
  is_final: boolean;
  gap_before_ms: number | null;
}

export interface StitchedTranscript {
  session_id: string;
  segments: TranscriptEntry[];
  gaps: GapMarker[];
  total_duration_ms: number;
  created_at: string;
}

export interface TranscriptEntry {
  speaker: 'ai' | 'patient';
  content: string;
  timestamp: string;
  segment_index: number;
}

export interface GapMarker {
  after_segment_index: number;
  gap_duration_ms: number;
  reason: 'network_drop' | 'patient_pause' | 'session_resume';
  timestamp: string;
}

export interface QueueEntry {
  session_id: string;
  patient_id: string;
  position: number;
  estimated_wait_seconds: number;
  queued_at: string;
}

export interface SessionRecoveryResult {
  can_resume: boolean;
  reason?: string;
  session?: Session;
  last_transcript_segment?: TranscriptSegment;
}

export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
  session_id?: string;
  timestamp: string;
}
