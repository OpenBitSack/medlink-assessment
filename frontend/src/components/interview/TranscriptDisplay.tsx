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
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[40vh]">
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
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                entry.speaker === 'patient'
                  ? 'bg-primary/20 text-text-primary rounded-br-md'
                  : 'bg-surface-lighter text-text-primary rounded-bl-md'
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-wider mb-1 opacity-50">
                {entry.speaker === 'ai' ? 'Dr. AI' : 'You'}
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
