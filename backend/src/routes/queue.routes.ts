import { Router, Request, Response } from 'express';
import * as rateLimiter from '../services/rateLimiter.service';

const router = Router();

function param(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

router.get('/status', (_req: Request, res: Response) => {
  const status = rateLimiter.getQueueStatus();
  const available = rateLimiter.getAvailableSlots();

  res.json({
    available_slots: available,
    max_concurrent: 50,
    ...status,
  });
});

router.get('/position/:sessionId', (req: Request, res: Response) => {
  const sessionId = param(req.params.sessionId);
  const entry = rateLimiter.getQueuePosition(sessionId);

  if (!entry) {
    res.json({ in_queue: false });
    return;
  }

  res.json({
    in_queue: true,
    position: entry.position,
    estimated_wait_seconds: entry.estimated_wait_seconds,
    queued_at: entry.queued_at,
  });
});

export default router;
