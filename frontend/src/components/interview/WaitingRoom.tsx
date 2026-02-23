import { motion } from 'framer-motion';

interface WaitingRoomProps {
  position: number | null;
  estimatedWaitSeconds: number | null;
}

export function WaitingRoom({ position, estimatedWaitSeconds }: WaitingRoomProps) {
  const minutes = estimatedWaitSeconds ? Math.ceil(estimatedWaitSeconds / 60) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      {/* Calming animated orb */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-brand/15"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-brand/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        <motion.div
          className="absolute inset-6 rounded-full bg-brand/40 flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold text-text-primary font-serif mb-3"
      >
        We're preparing your session
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-text-secondary text-sm max-w-xs mb-6 leading-relaxed"
      >
        We're experiencing high demand right now. A clinician-guided AI session will be ready for you shortly. Thank you for your patience.
      </motion.p>

      {position !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-white rounded-xl p-5 w-full max-w-xs border border-surface-border shadow-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Your place</span>
            <span className="text-2xl font-bold text-brand">#{position}</span>
          </div>

          {minutes !== null && (
            <div className="flex justify-between items-center">
              <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Est. wait</span>
              <span className="text-text-secondary text-sm">
                ~{minutes} {minutes === 1 ? 'minute' : 'minutes'}
              </span>
            </div>
          )}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-text-muted text-xs mt-6 max-w-xs"
      >
        You can keep this page open — we'll start automatically when it's your turn. If you need immediate help, call <span className="text-brand font-semibold">988</span>.
      </motion.p>
    </div>
  );
}
