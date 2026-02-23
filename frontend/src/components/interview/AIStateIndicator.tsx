import { motion, AnimatePresence } from 'framer-motion';
import type { AIState } from '../../types';

interface AIStateIndicatorProps {
  state: AIState;
  comfortMessage?: string | null;
}

export function AIStateIndicator({ state, comfortMessage }: AIStateIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Ambient ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: getGradient(state),
            filter: 'blur(20px)',
            opacity: 0.3,
          }}
          animate={{
            scale: state === 'listening' ? [1, 1.15, 1] : state === 'speaking' ? [1, 1.1, 0.95, 1.1, 1] : [1, 1.05, 1],
            opacity: state === 'idle' ? 0.15 : 0.35,
          }}
          transition={{
            duration: state === 'speaking' ? 0.8 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Secondary ring */}
        <AnimatePresence>
          {state !== 'idle' && (
            <motion.div
              className="absolute inset-2 rounded-full border-2"
              style={{ borderColor: getColor(state) }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
                scale: [0.9, 1.05, 0.9],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Core orb */}
        <motion.div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: getGradient(state) }}
          animate={{
            scale: state === 'speaking' ? [1, 1.06, 0.97, 1.04, 1] : state === 'listening' ? [1, 1.03, 1] : state === 'thinking' ? [1, 1.02, 1] : 1,
          }}
          transition={{
            duration: state === 'speaking' ? 0.6 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <StateIcon state={state} />
        </motion.div>
      </div>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state + (comfortMessage || '')}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-text-secondary">
            {getLabel(state)}
          </p>
          {comfortMessage && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-text-muted mt-1 max-w-48 italic"
            >
              {comfortMessage}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StateIcon({ state }: { state: AIState }) {
  if (state === 'listening') {
    return (
      <div className="flex items-end gap-[3px] h-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-[3px] bg-white/90 rounded-full"
            animate={{ height: ['30%', '100%', '30%'] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (state === 'speaking') {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-white/90 rounded-full"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    );
  }

  if (state === 'thinking') {
    return (
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-white/80 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-3 h-3 bg-white/40 rounded-full" />
  );
}

function getColor(state: AIState): string {
  switch (state) {
    case 'listening': return '#34d399';
    case 'speaking': return '#818cf8';
    case 'thinking': return '#fbbf24';
    default: return '#6b6880';
  }
}

function getGradient(state: AIState): string {
  switch (state) {
    case 'listening': return 'linear-gradient(135deg, #34d399, #059669)';
    case 'speaking': return 'linear-gradient(135deg, #818cf8, #6366f1)';
    case 'thinking': return 'linear-gradient(135deg, #fbbf24, #d97706)';
    default: return 'linear-gradient(135deg, #6b6880, #4b4860)';
  }
}

function getLabel(state: AIState): string {
  switch (state) {
    case 'listening': return 'Listening to you...';
    case 'speaking': return 'Speaking...';
    case 'thinking': return 'Reflecting on what you shared...';
    default: return '';
  }
}
