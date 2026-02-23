import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config';
import { getDb, closeDb } from './database';
import { initializeWebSocket } from './websocket';
import { errorHandler, notFoundHandler } from './middleware/error';
import sessionRoutes from './routes/session.routes';
import transcriptRoutes from './routes/transcript.routes';
import queueRoutes from './routes/queue.routes';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

getDb();
console.log('Database initialized');

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/sessions', sessionRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/queue', queueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const io = initializeWebSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`MedLink backend running on port ${config.port}`);
  console.log(`WebSocket server ready`);
  console.log(`Max concurrent sessions: ${config.maxConcurrentSessions}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  io.close();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  io.close();
  closeDb();
  process.exit(0);
});
