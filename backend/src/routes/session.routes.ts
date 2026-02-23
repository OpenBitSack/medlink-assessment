import { Router, Request, Response } from 'express';
import * as sessionService from '../services/session.service';
import * as rateLimiter from '../services/rateLimiter.service';

const router = Router();

function param(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

router.post('/', (req: Request, res: Response) => {
  const { patient_id, force_new } = req.body;

  if (!patient_id) {
    res.status(400).json({ error: 'patient_id is required' });
    return;
  }

  const existing = sessionService.getActiveSessionForPatient(patient_id);
  if (existing) {
    if (force_new) {
      sessionService.updateSessionStatus(existing.id, 'abandoned');
    } else {
      const recovery = sessionService.checkSessionRecovery(existing.id);
      if (recovery.can_resume) {
        res.json({
          session: existing,
          resumable: true,
          message: 'You have an active session that can be resumed.',
        });
        return;
      }
    }
  }

  const session = sessionService.createSession(patient_id);

  if (rateLimiter.canStartSession()) {
    const updated = sessionService.updateSessionStatus(session.id, 'preparing');
    rateLimiter.removeFromQueue(session.id);
    res.status(201).json({ session: updated, queued: false });
  } else {
    const queueEntry = rateLimiter.addToQueue(session.id, patient_id);
    res.status(201).json({
      session,
      queued: true,
      queue_position: queueEntry.position,
      estimated_wait_seconds: queueEntry.estimated_wait_seconds,
      message: "We're experiencing high demand. You're in line and we'll connect you as soon as possible.",
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const session = sessionService.getSession(id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  res.json({ session });
});

router.post('/:id/start', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const session = sessionService.getSession(id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (!['preparing', 'waiting'].includes(session.status)) {
    res.status(400).json({
      error: `Cannot start session in '${session.status}' state`,
    });
    return;
  }

  const updated = sessionService.updateSessionStatus(session.id, 'in_progress');
  res.json({ session: updated });
});

router.post('/:id/interrupt', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const session = sessionService.getSession(id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const updated = sessionService.updateSessionStatus(session.id, 'interrupted');
  res.json({ session: updated });
});

router.post('/:id/resume', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const recovery = sessionService.checkSessionRecovery(id);

  if (!recovery.can_resume) {
    res.status(400).json({
      error: 'Session cannot be resumed',
      reason: recovery.reason,
    });
    return;
  }

  if (rateLimiter.canStartSession()) {
    const updated = sessionService.updateSessionStatus(id, 'resuming');
    res.json({ session: updated, recovery });
  } else {
    const queueEntry = rateLimiter.addToQueue(
      id,
      recovery.session!.patient_id
    );
    res.json({
      queued: true,
      queue_position: queueEntry.position,
      estimated_wait_seconds: queueEntry.estimated_wait_seconds,
      recovery,
      message: "We're reconnecting you as soon as a slot opens.",
    });
  }
});

router.post('/:id/complete', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const session = sessionService.getSession(id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const updated = sessionService.updateSessionStatus(session.id, 'completed');
  rateLimiter.removeFromQueue(session.id);
  rateLimiter.processQueue();

  res.json({ session: updated });
});

router.post('/:id/heartbeat', (req: Request, res: Response) => {
  const id = param(req.params.id);
  sessionService.heartbeat(id);
  res.json({ ok: true });
});

router.get('/:id/recovery', (req: Request, res: Response) => {
  const id = param(req.params.id);
  const recovery = sessionService.checkSessionRecovery(id);
  res.json(recovery);
});

export default router;
