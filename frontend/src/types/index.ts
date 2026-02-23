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
}

export interface TranscriptEntry {
  speaker: 'ai' | 'patient';
  content: string;
  timestamp: string;
}

export interface QueueInfo {
  in_queue: boolean;
  position?: number;
  estimated_wait_seconds?: number;
}

export interface PatientEvent {
  event_id: string;
  patient_id: string;
  event_category: string;
  event_subcategory: string;
  event_name: string;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string;
}
