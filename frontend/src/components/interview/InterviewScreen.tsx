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
  const [, setSilenceTimer] = useState(0);
  const silenceRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('medlink_patient_id', patientId);
  }, [patientId]);

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

  // Pre-session: landing
  if (!session && !sessionStatus) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-surface">
        {/* Nav */}
        <nav className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto w-full">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-text-primary">MedLink</span>
          </a>
          <a href="/dashboard" className="text-xs text-text-muted hover:text-brand transition-colors">
            Clinician Portal
          </a>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center mb-8 border border-brand/15">
              <div className="w-16 h-16 rounded-full bg-brand/15 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-serif font-light text-brand leading-tight mb-3">
              Clarity for<br />Every Mind
            </h1>
            <p className="text-text-secondary text-sm mb-1 font-medium">
              AI-Assisted Clinical Interview
            </p>
            <p className="text-text-muted text-xs max-w-xs mb-8 leading-relaxed">
              You'll speak with Delfia, our AI assistant, about how you've been feeling. Your responses will be reviewed by a licensed clinician. This typically takes 15–30 minutes.
            </p>

            <button
              onClick={() => startSession(patientId)}
              className="w-full max-w-xs py-4 px-6 bg-brand text-white font-medium text-base rounded-xl hover:bg-brand-dark transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
            >
              Begin Session
            </button>

            <p className="text-text-muted text-[11px] mt-5 max-w-xs leading-relaxed">
              By starting, you consent to this session being recorded and reviewed by a licensed provider. If you're in crisis, call <span className="text-brand font-semibold">988</span> now.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Queue / waiting
  if (sessionStatus === 'waiting') {
    return (
      <div className="min-h-[100dvh] bg-surface">
        <WaitingRoom position={queuePosition} estimatedWaitSeconds={estimatedWait} />
      </div>
    );
  }

  // Session recovery
  if (session && sessionStatus === 'interrupted') {
    return (
      <div className="min-h-[100dvh] bg-surface">
        <SessionRecovery
          onResume={() => resumeSession(session.id)}
          onStartNew={() => startSession(patientId, true)}
        />
      </div>
    );
  }

  // Completed
  if (sessionStatus === 'completed') {
    return (
      <div className="min-h-[100dvh] bg-surface">
        <CompletedScreen />
      </div>
    );
  }

  // Active interview
  return (
    <div className="flex flex-col h-[100dvh] bg-surface">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 border-b border-surface-border/50 bg-surface-white/40 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2.5">
          <a href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-brand/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-text-primary">MedLink</span>
          </a>
          <div className="h-3 w-px bg-surface-border" />
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-safe' : 'bg-danger animate-pulse'}`} />
          <span className="text-xs text-text-muted">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-xs text-brand font-medium px-3 py-1.5 rounded-md bg-brand-bg hover:bg-surface-border transition-colors"
          >
            {showTranscript ? 'Hide' : 'Show'} transcript
          </button>
          <a
            href="/dashboard"
            className="text-xs text-text-muted hover:text-brand px-2 py-1.5 transition-colors"
            title="Clinician Dashboard"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </a>
        </div>
      </motion.header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-danger-light border-b border-danger/20 px-4 py-2 text-danger text-xs text-center"
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
            className="bg-warm-light border-b border-warm/20 px-4 py-2.5 text-center"
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
                  className="mt-8 mx-4 max-w-sm bg-surface-white/80 rounded-xl px-5 py-4 text-sm text-text-primary leading-relaxed border border-surface-border/50"
                >
                  {currentAIMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thinking comfort indicator */}
            <AnimatePresence>
              {aiState === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-warm"
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
        className="border-t border-surface-border/50 px-4 py-3 pb-safe bg-surface-white/40 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={toggleRecording}
            disabled={aiState !== 'listening'}
            className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-danger text-white animate-pulse'
                : aiState === 'listening'
                  ? 'bg-safe-light text-safe hover:bg-safe/15 border border-safe/20'
                  : 'bg-surface-muted text-text-muted opacity-50'
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
              className="w-full bg-surface rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/70 border border-surface-border focus:border-brand/50 focus:ring-2 focus:ring-brand/10 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || aiState !== 'listening'}
            className="shrink-0 w-11 h-11 rounded-lg bg-brand flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-dark transition-all active:scale-95"
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
