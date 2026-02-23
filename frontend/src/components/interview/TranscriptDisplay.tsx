import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TranscriptEntry } from '../../types';

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  currentAIMessage: string | null;
}

export function TranscriptDisplay({ entries, currentAIMessage }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length, currentAIMessage]);

  if (entries.length === 0 && !currentAIMessage) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[40vh]">
      <AnimatePresence initial={false}>
        {entries.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${entry.speaker === 'patient' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                entry.speaker === 'patient'
                  ? 'bg-brand/10 text-text-primary border border-brand/15 rounded-br-sm'
                  : 'bg-surface-white text-text-primary border border-surface-border rounded-bl-sm'
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 text-text-muted">
                {entry.speaker === 'ai' ? 'Dr. Delfia' : 'You'}
              </p>
              {entry.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
