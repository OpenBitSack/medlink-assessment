import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function parseCorsOrigin(raw?: string): string | string[] {
  if (!raw) return 'http://localhost:5173';
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || './data/medlink.db',
  maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '50', 10),
  sessionResumeWindowMinutes: parseInt(process.env.SESSION_RESUME_WINDOW_MINUTES || '30', 10),
  sessionExpireHours: parseInt(process.env.SESSION_EXPIRE_HOURS || '24', 10),
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),

  ai: {
    averageSessionDurationMinutes: 25,
    thinkingDelayMs: { min: 800, max: 2500 },
    speakingRateWordsPerMinute: 145,
  },
};
