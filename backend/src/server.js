import 'dotenv/config';
import http from 'http';
import { createApp } from './app.js';
import { initWebSocket } from './ws/server.js';
import { prisma } from './db/prisma.js';
import { seedSignals } from './services/signals.js';
import { seedAgents } from './db/seed.js';
import { runAnchorBatch } from './services/ledger.js';
import { config } from './config/index.js';

// Serverless/free-tier Postgres (e.g. Neon) suspends when idle and can take
// a few seconds to wake on the first connection — long enough to blow past
// Prisma's default connect timeout on a cold deploy. Retry with backoff
// instead of crash-looping the whole process over a transient P1001.
async function connectWithRetry(maxAttempts = 6, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelayMs * attempt;
      console.warn(`[DB] Connect attempt ${attempt}/${maxAttempts} failed (${err.code || err.message}) — retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

async function start() {
  await connectWithRetry();
  console.log('[DB] PostgreSQL connected');
  await seedSignals().catch((err) => console.error('[Seed] Failed to seed signals (non-fatal)', err.stack || err.message));
  await seedAgents().catch((err) => console.error('[Seed] Failed to seed agents (non-fatal)', err.stack || err.message));

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
