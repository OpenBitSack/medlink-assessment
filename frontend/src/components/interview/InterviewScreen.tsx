import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterview } from '../../hooks/useInterview';
import { AIStateIndicator } from './AIStateIndicator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { WaitingRoom } from './WaitingRoom';
import { SessionRecovery } from './SessionRecovery';
import { CompletedScreen } from './CompletedScreen';

export function InterviewScreen() {
  const {
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
  } = useInterview();

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [patientId] = useState(() => localStorage.getItem('medlink_patient_id') || crypto.randomUUID());
  const [silenceTimer, setSilenceTimer] = useState(0);
  const silenceRef = useRef<ReturnType<typeof setInterval>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('medlink_patient_id', patientId);
  }, [patientId]);

  // Silence comfort: when AI is listening and patient hasn't spoken for 15+ seconds
  useEffect(() => {
    if (aiState === 'listening') {
      setSilenceTimer(0);
      silenceRef.current = setInterval(() => {
        setSilenceTimer((prev) => {
          if (prev >= 15) {
            requestComfort();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setSilenceTimer(0);
      if (silenceRef.current) clearInterval(silenceRef.current);
    }
    return () => {
      if (silenceRef.current) clearInterval(silenceRef.current);
    };
  }, [aiState, requestComfort]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || aiState !== 'listening') return;
    sendMessage(text);
    setInputText('');
    setSilenceTimer(0);
  }, [inputText, aiState, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    setIsRecording((prev) => !prev);
  }, []);

  // Pre-session: show start screen
  if (!session && !sessionStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            MedLink
          </h1>
          <p className="text-text-secondary text-sm max-w-xs mb-2">
            AI-Assisted Clinical Interview
          </p>
          <p className="text-text-muted text-xs max-w-xs mb-8 leading-relaxed">
            You'll speak with an AI assistant about how you've been feeling. Your responses will be reviewed by a licensed clinician. This typically takes 15-30 minutes.
          </p>

          <button
            onClick={() => startSession(patientId)}
            className="w-full max-w-xs py-4 px-6 bg-primary rounded-2xl text-white font-semibold text-base hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-primary/25"
          >
            Begin Session
          </button>

          <p className="text-text-muted text-[11px] mt-4 max-w-xs">
            By starting, you consent to this session being recorded and reviewed by a licensed provider. If you're in crisis, call <span className="text-primary-light">988</span> now.
          </p>
        </motion.div>
      </div>
    );
  }

  // Queue / waiting
  if (sessionStatus === 'waiting') {
    return <WaitingRoom position={queuePosition} estimatedWaitSeconds={estimatedWait} />;
  }

  // Session recovery
  if (session && sessionStatus === 'interrupted') {
    return (
      <SessionRecovery
        onResume={() => resumeSession(session.id)}
        onStartNew={() => startSession(patientId)}
      />
    );
  }

  // Completed
  if (sessionStatus === 'completed') {
    return <CompletedScreen />;
  }

  // Active interview
  return (
    <div className="flex flex-col h-[100dvh] bg-surface">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 border-b border-surface-lighter/50"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-safe' : 'bg-danger animate-pulse'}`} />
          <span className="text-xs text-text-muted">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="text-xs text-text-muted px-3 py-1.5 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors"
        >
          {showTranscript ? 'Hide' : 'Show'} transcript
        </button>
      </motion.header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-danger-dim/50 border-b border-danger/20 px-4 py-2 text-danger text-xs text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnection banner */}
      <AnimatePresence>
        {!isConnected && sessionStatus === 'in_progress' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-warm/10 border-b border-warm/20 px-4 py-2.5 text-center"
          >
            <p className="text-warm text-xs font-medium">Connection interrupted</p>
            <p className="text-text-muted text-[11px]">Your progress is saved. Reconnecting...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
        {!showTranscript ? (
          <div className="flex flex-col items-center justify-center flex-1 px-6">
            <AIStateIndicator state={aiState} comfortMessage={comfortMessage} />

            {/* Current AI message bubble */}
            <AnimatePresence mode="wait">
              {currentAIMessage && aiState === 'speaking' && (
                <motion.div
                  key={currentAIMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 mx-4 max-w-sm bg-surface-light rounded-2xl px-5 py-4 text-sm text-text-primary leading-relaxed"
                >
                  {currentAIMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thinking comfort indicator: subtle feedback during processing */}
            <AnimatePresence>
              {aiState === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 flex flex-col items-center"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-warm/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      />
                    ))}
                  </div>
                  <p className="text-text-muted text-xs mt-2">
                    Taking a moment to reflect...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <TranscriptDisplay entries={transcript} currentAIMessage={currentAIMessage} />
        )}
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-t border-surface-lighter/50 px-4 py-3 pb-safe"
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={toggleRecording}
            disabled={aiState !== 'listening'}
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-danger text-white animate-pulse'
                : aiState === 'listening'
                  ? 'bg-safe/20 text-safe hover:bg-safe/30'
                  : 'bg-surface-lighter text-text-muted opacity-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={aiState !== 'listening'}
              placeholder={
                aiState === 'listening'
                  ? 'Type your response...'
                  : aiState === 'speaking'
                    ? 'Listening to the question...'
                    : aiState === 'thinking'
                      ? 'One moment...'
                      : ''
              }
              className="w-full bg-surface-light rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 border border-surface-lighter focus:border-primary/50 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || aiState !== 'listening'}
            className="shrink-0 w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-dark transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>

        {aiState === 'listening' && (
          <p className="text-center text-text-muted text-[11px] mt-2">
            Take your time. Share as much or as little as you'd like.
          </p>
        )}
      </motion.div>
    </div>
  );
}
