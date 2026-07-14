import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { initWebSocket } from './ws/server.js';
import { prisma } from './db/prisma.js';
import { seedSignals } from './services/signals.js';
import { runAnchorBatch } from './services/ledger.js';
import { config } from './config/index.js';

async function start() {
  await prisma.$connect();
  console.log('[DB] PostgreSQL connected');
  await seedSignals();

  const app    = createApp();
  const server = http.createServer(app);
  initWebSocket(server);

  server.listen(config.port, () => {
    console.log(`[Server] Running on http://localhost:${config.port}`);
    console.log(`[WS]     WebSocket ready at ws://localhost:${config.port}/ws`);
  });

  // Periodically batch any newly-closed trades into a Merkle root and anchor
  // it on-chain. Errors are logged but never crash the server — a missed
  // anchor cycle just gets picked up on the next interval.
  setInterval(() => {
    runAnchorBatch().catch((err) => console.error('[Ledger] Anchor batch failed', err.message));
  }, config.ledger.anchorIntervalMs);

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    server.close();
  });
}

start().catch((err) => { console.error('[Fatal]', err); process.exit(1); });
