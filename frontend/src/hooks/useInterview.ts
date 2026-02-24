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
  startSession: (patientId: string, forceNew?: boolean) => Promise<void>;
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
  const queuePollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const activeSessionIdRef = useRef<string | null>(null);
  const sessionStatusRef = useRef<SessionStatus | null>(null);

  // Keep ref in sync so the disconnect handler always sees latest status
  useEffect(() => {
    sessionStatusRef.current = sessionStatus;
  }, [sessionStatus]);

  // Register socket listeners once on mount — no dependency on sessionStatus
  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => {
      setIsConnected(false);
      if (sessionStatusRef.current === 'in_progress') {
        setSessionStatus('interrupted');
      }
    });

    socket.on('session_state', (data: { session: Session }) => {
      if (activeSessionIdRef.current && data.session.id !== activeSessionIdRef.current) return;
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
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    activeSessionIdRef.current = sessionId;
    const socket = getSocket();
    socket.emit('join_session', { session_id: sessionId });
  }, []);

  const startSession = useCallback(async (patientId: string, forceNew = false) => {
    try {
      setError(null);

      if (forceNew) {
        setTranscript([]);
        setCurrentAIMessage(null);
        setComfortMessage(null);
        setAiState('idle');
        setSessionStatus('preparing');
      }

      const result = await api.createSession(patientId, forceNew);

      if (result.resumable) {
        setSession(result.session);
        setSessionStatus(result.session.status);
        activeSessionIdRef.current = result.session.id;
        return;
      }

      setSession(result.session);
      activeSessionIdRef.current = result.session.id;

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
              joinSession(result.session.id);
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
        joinSession(result.session.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [joinSession]);

  const sendMessage = useCallback((content: string) => {
    if (!activeSessionIdRef.current) return;
    const socket = getSocket();
    socket.emit('patient_message', { content, session_id: activeSessionIdRef.current });
  }, []);

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
        joinSession(sessionId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [joinSession]);

  const requestComfort = useCallback(() => {
    if (!activeSessionIdRef.current) return;
    const socket = getSocket();
    socket.emit('request_comfort', { session_id: activeSessionIdRef.current });
  }, []);

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
