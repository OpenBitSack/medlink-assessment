import { motion } from 'framer-motion';

interface SessionRecoveryProps {
  onResume: () => void;
  onStartNew: () => void;
}

export function SessionRecovery({ onResume, onStartNew }: SessionRecoveryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-warm/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Welcome back
      </h2>

      <p className="text-text-secondary text-sm max-w-xs mb-8 leading-relaxed">
        It looks like your previous session was interrupted. Would you like to pick up where you left off?
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onResume}
          className="w-full py-3.5 px-6 bg-primary rounded-xl text-white font-medium text-sm hover:bg-primary-dark transition-colors active:scale-[0.98]"
        >
          Continue my session
        </button>
        <button
          onClick={onStartNew}
          className="w-full py-3.5 px-6 bg-surface-lighter rounded-xl text-text-secondary font-medium text-sm hover:bg-surface-light transition-colors active:scale-[0.98]"
        >
          Start a new session
        </button>
      </div>
    </motion.div>
  );
}
