import { Router, Request, Response } from 'express';
import * as transcriptService from '../services/transcript.service';

const router = Router();

function param(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

router.get('/:sessionId', (req: Request, res: Response) => {
  const sessionId = param(req.params.sessionId);
  const segments = transcriptService.getTranscriptSegments(sessionId);
  res.json({ segments });
});

router.get('/:sessionId/stitched', (req: Request, res: Response) => {
  const sessionId = param(req.params.sessionId);
  const stitched = transcriptService.stitchTranscript(sessionId);
  res.json(stitched);
});

router.post('/:sessionId/segments', (req: Request, res: Response) => {
  const sessionId = param(req.params.sessionId);
  const { speaker, content, duration_ms } = req.body;

  if (!speaker || !content) {
    res.status(400).json({ error: 'speaker and content are required' });
    return;
  }

  if (!['ai', 'patient'].includes(speaker)) {
    res.status(400).json({ error: "speaker must be 'ai' or 'patient'" });
    return;
  }

  const segment = transcriptService.addTranscriptSegment(
    sessionId,
    speaker,
    content,
    duration_ms
  );

  res.status(201).json({ segment });
});

export default router;
