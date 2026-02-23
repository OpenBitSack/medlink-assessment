import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import type { Session, AIState, SessionStatus, TranscriptEntry } from '../types';

interface UseInterviewReturn {
  session: Session | null;
  aiState: AIState;
  sessionStatus: SessionStatus | null;
  transcript: TranscriptEntry[];
  currentAIMessage: string | null;
  comfortMessage: string | null;
  queuePosition: number | null;
  estimatedWait: number | null;
  isConnected: boolean;
  error: string | null;
  startSession: (patientId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  resumeSession: (sessionId: string) => Promise<void>;
  requestComfort: () => void;
}

export function useInterview(): UseInterviewReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentAIMessage, setCurrentAIMessage] = useState<string | null>(null);
  const [comfortMessage, setComfortMessage] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queuePollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => {
      setIsConnected(false);
      if (sessionStatus === 'in_progress') {
        setSessionStatus('interrupted');
      }
    });

    socket.on('session_state', (data: { session: Session }) => {
      setSession(data.session);
      setSessionStatus(data.session.status);
      setAiState(data.session.ai_state);
    });

    socket.on('session_status', (data: { status: SessionStatus }) => {
      setSessionStatus(data.status);
    });

    socket.on('ai_state_change', (data: { state: AIState }) => {
      setAiState(data.state);
      if (data.state === 'listening') {
        setCurrentAIMessage(null);
      }
      setComfortMessage(null);
    });

    socket.on('ai_message', (data: { content: string }) => {
      setCurrentAIMessage(data.content);
    });

    socket.on('ai_comfort', (data: { message: string }) => {
      setComfortMessage(data.message);
    });

    socket.on('transcript_update', (data: TranscriptEntry) => {
      setTranscript((prev) => [...prev, data]);
    });

    socket.on('queue_promoted', () => {
      setQueuePosition(null);
      setEstimatedWait(null);
      if (queuePollRef.current) {
        clearInterval(queuePollRef.current);
      }
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('session_state');
      socket.off('session_status');
      socket.off('ai_state_change');
      socket.off('ai_message');
      socket.off('ai_comfort');
      socket.off('transcript_update');
      socket.off('queue_promoted');
      socket.off('error');
      if (queuePollRef.current) {
        clearInterval(queuePollRef.current);
      }
    };
  }, [sessionStatus]);

  const startSession = useCallback(async (patientId: string) => {
    try {
      setError(null);
      const result = await api.createSession(patientId);

      if (result.resumable) {
        setSession(result.session);
        setSessionStatus(result.session.status);
        return;
      }

      setSession(result.session);

      if (result.queued) {
        setSessionStatus('waiting');
        setQueuePosition(result.queue_position);
        setEstimatedWait(result.estimated_wait_seconds);

        queuePollRef.current = setInterval(async () => {
          try {
            const pos = await api.getQueuePosition(result.session.id);
            if (!pos.in_queue) {
              setQueuePosition(null);
              setEstimatedWait(null);
              clearInterval(queuePollRef.current);
              const socket = getSocket();
              socket.emit('join_session', { session_id: result.session.id });
            } else {
              setQueuePosition(pos.position);
              setEstimatedWait(pos.estimated_wait_seconds);
            }
          } catch {
            // silently retry
          }
        }, 5000);
      } else {
        setSessionStatus('preparing');
        const socket = getSocket();
        socket.emit('join_session', { session_id: result.session.id });
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!session) return;
    const socket = getSocket();
    socket.emit('patient_message', { content, session_id: session.id });
  }, [session]);

  const resumeSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      const result = await api.resumeSession(sessionId);

      if (result.queued) {
        setQueuePosition(result.queue_position);
        setEstimatedWait(result.estimated_wait_seconds);
        setSessionStatus('waiting');
      } else {
        setSession(result.session);
        setSessionStatus('resuming');
        const socket = getSocket();
        socket.emit('join_session', { session_id: sessionId });
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const requestComfort = useCallback(() => {
    if (!session) return;
    const socket = getSocket();
    socket.emit('request_comfort', { session_id: session.id });
  }, [session]);

  return {
    session,
    aiState,
    sessionStatus,
    transcript,
    currentAIMessage,
    comfortMessage,
    queuePosition,
    estimatedWait,
    isConnected,
    error,
    startSession,
    sendMessage,
    resumeSession,
    requestComfort,
  };
}
