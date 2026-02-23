import { motion, AnimatePresence } from 'framer-motion';
import type { AIState } from '../../types';

interface AIStateIndicatorProps {
  state: AIState;
  comfortMessage?: string | null;
}

export function AIStateIndicator({ state, comfortMessage }: AIStateIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Ambient glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: getGradient(state),
            filter: 'blur(24px)',
            opacity: 0.2,
          }}
          animate={{
            scale: state === 'listening' ? [1, 1.2, 1] : state === 'speaking' ? [1, 1.15, 0.95, 1.15, 1] : [1, 1.06, 1],
            opacity: state === 'idle' ? 0.08 : 0.22,
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
              style={{ borderColor: getColor(state) + '40' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0.15, 0.35, 0.15],
                scale: [0.92, 1.05, 0.92],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Core orb */}
        <motion.div
          className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: getGradient(state) }}
          animate={{
            scale: state === 'speaking' ? [1, 1.05, 0.97, 1.04, 1] : state === 'listening' ? [1, 1.03, 1] : state === 'thinking' ? [1, 1.02, 1] : 1,
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
              className="text-xs text-text-muted mt-1.5 max-w-52 italic"
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
      <div className="flex items-end gap-[3px] h-7">
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
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 bg-white/90 rounded-full"
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
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-white/80 rounded-full"
            animate={{ y: [0, -7, 0] }}
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
    <div className="w-4 h-4 bg-white/30 rounded-full" />
  );
}

function getColor(state: AIState): string {
  switch (state) {
    case 'listening': return '#059669';
    case 'speaking': return '#7526c3';
    case 'thinking': return '#d97706';
    default: return '#8b7a9e';
  }
}

function getGradient(state: AIState): string {
  switch (state) {
    case 'listening': return 'linear-gradient(135deg, #34d399, #059669)';
    case 'speaking': return 'linear-gradient(135deg, #9b59d0, #7526c3)';
    case 'thinking': return 'linear-gradient(135deg, #fbbf24, #d97706)';
    default: return 'linear-gradient(135deg, #8b7a9e, #6b5b80)';
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
