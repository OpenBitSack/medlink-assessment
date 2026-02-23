import { motion } from 'framer-motion';

export function CompletedScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-safe-light flex items-center justify-center mb-6"
      >
        <svg className="w-10 h-10 text-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </motion.div>

      <h2 className="text-xl font-semibold text-text-primary font-serif mb-3">
        Thank you for sharing today
      </h2>

      <p className="text-text-secondary text-sm max-w-xs mb-6 leading-relaxed">
        Your conversation has been securely recorded. A licensed clinician will review your session and reach out with next steps.
      </p>

      <div className="bg-surface-white rounded-xl p-5 w-full max-w-xs border border-surface-border shadow-sm mb-6">
        <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">What happens next</h3>
        <ul className="space-y-2.5 text-left">
          {[
            'A clinician reviews your transcript within 24–48 hours',
            "You'll receive a follow-up with personalized recommendations",
            'Your information is kept strictly confidential',
          ].map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className="flex items-start gap-2.5 text-text-secondary text-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-safe mt-1.5 shrink-0" />
              {item}
            </motion.li>
          ))}
        </ul>
      </div>

      <p className="text-text-muted text-xs max-w-xs">
        If you need immediate support, the <span className="text-brand font-semibold">988 Suicide &amp; Crisis Lifeline</span> is available 24/7.
      </p>
    </motion.div>
  );
}
