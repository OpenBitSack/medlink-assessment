import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { config } from './config';
import * as sessionService from './services/session.service';
import * as transcriptService from './services/transcript.service';
import * as rateLimiter from './services/rateLimiter.service';
import * as mockAI from './services/mockAI.service';

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    let currentSessionId: string | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    socket.on('join_session', async (data: { session_id: string }) => {
      // Leave old session room if switching sessions
      if (currentSessionId && currentSessionId !== data.session_id) {
        socket.leave(currentSessionId);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      currentSessionId = data.session_id;
      socket.join(data.session_id);

      const session = sessionService.getSession(data.session_id);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      heartbeatInterval = setInterval(() => {
        if (currentSessionId) {
          sessionService.heartbeat(currentSessionId);
        }
      }, 15000);

      socket.emit('session_state', { session });

      if (session.status === 'preparing' || session.status === 'resuming') {
        await startInterview(socket, data.session_id, session.current_question_index);
      }
    });

    socket.on('patient_message', async (data: { content: string; session_id: string }) => {
      const { content, session_id } = data;
      if (!session_id) return;

      transcriptService.addTranscriptSegment(session_id, 'patient', content);

      socket.emit('transcript_update', {
        speaker: 'patient',
        content,
        timestamp: new Date().toISOString(),
      });

      const empathyResponse = mockAI.generateEmpathyResponse(content);
      if (empathyResponse) {
        socket.emit('ai_state_change', { state: 'thinking' });
        await delay(1500);
        socket.emit('ai_state_change', { state: 'speaking' });

        transcriptService.addTranscriptSegment(session_id, 'ai', empathyResponse);
        socket.emit('ai_message', { content: empathyResponse });
        socket.emit('transcript_update', {
          speaker: 'ai',
          content: empathyResponse,
          timestamp: new Date().toISOString(),
        });

        await delay(calculateSpeakingDuration(empathyResponse));
      }

      await processNextQuestion(socket, session_id);
    });

    socket.on('request_comfort', (data: { session_id: string }) => {
      const message = mockAI.getComfortMessage();
      socket.emit('ai_comfort', { message });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      if (currentSessionId) {
        const session = sessionService.getSession(currentSessionId);
        if (session && session.status === 'in_progress') {
          sessionService.updateSessionStatus(currentSessionId, 'interrupted');
          console.log(`Session ${currentSessionId} interrupted due to disconnect`);
        }
      }
    });
  });

  setInterval(() => {
    const cleaned = sessionService.cleanupStaleSessions();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} stale sessions`);
      const processed = rateLimiter.processQueue();
      if (processed) {
        io.to(processed.session_id).emit('queue_promoted', {
          message: "Great news — we're ready for you now.",
        });
      }
    }
    rateLimiter.updateQueueEstimates();
  }, 30000);

  return io;
}

async function startInterview(socket: Socket, sessionId: string, startIndex: number) {
  sessionService.updateSessionStatus(sessionId, 'in_progress');
  socket.emit('session_status', { status: 'in_progress' });

  await delay(1000);

  const question = mockAI.getQuestion(startIndex);
  if (question) {
    sessionService.updateSessionAIState(sessionId, 'speaking');
    socket.emit('ai_state_change', { state: 'speaking' });

    transcriptService.addTranscriptSegment(sessionId, 'ai', question.question);
    socket.emit('ai_message', { content: question.question });
    socket.emit('transcript_update', {
      speaker: 'ai',
      content: question.question,
      timestamp: new Date().toISOString(),
    });

    await delay(calculateSpeakingDuration(question.question));

    sessionService.updateSessionAIState(sessionId, 'listening');
    socket.emit('ai_state_change', { state: 'listening' });
  }
}

async function processNextQuestion(socket: Socket, sessionId: string) {
  const session = sessionService.getSession(sessionId);
  if (!session || session.status !== 'in_progress') return;

  const nextIndex = session.current_question_index + 1;
  const totalQuestions = mockAI.getTotalQuestions();

  if (nextIndex >= totalQuestions) {
    sessionService.updateSessionStatus(sessionId, 'completed');
    socket.emit('session_status', { status: 'completed' });
    socket.emit('ai_state_change', { state: 'idle' });
    rateLimiter.removeFromQueue(sessionId);
    rateLimiter.processQueue();
    return;
  }

  sessionService.updateQuestionIndex(sessionId, nextIndex);

  socket.emit('ai_state_change', { state: 'thinking' });
  sessionService.updateSessionAIState(sessionId, 'thinking');

  const thinkingDelay = mockAI.generateThinkingDelay();
  await delay(thinkingDelay);

  const question = mockAI.getQuestion(nextIndex);
  if (question) {
    sessionService.updateSessionAIState(sessionId, 'speaking');
    socket.emit('ai_state_change', { state: 'speaking' });

    transcriptService.addTranscriptSegment(sessionId, 'ai', question.question);
    socket.emit('ai_message', { content: question.question });
    socket.emit('transcript_update', {
      speaker: 'ai',
      content: question.question,
      timestamp: new Date().toISOString(),
    });

    await delay(calculateSpeakingDuration(question.question));

    sessionService.updateSessionAIState(sessionId, 'listening');
    socket.emit('ai_state_change', { state: 'listening' });
  }
}

function calculateSpeakingDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const wpm = config.ai.speakingRateWordsPerMinute;
  return Math.max(2000, (words / wpm) * 60 * 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
