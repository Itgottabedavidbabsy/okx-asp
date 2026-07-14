import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { verifyMerkleProof, runAnchorBatch } from '../services/ledger.js';

const router = Router();

// Public — anyone can audit an agent's on-chain-verified trade history,
// no auth required, since the whole point is third-party verifiability.
router.get('/agent/:agentId', async (req, res) => {
  const records = await prisma.performanceRecord.findMany({
    where: { agentId: req.params.agentId },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, tradeHash: true, merkleRoot: true, txHash: true,
      chain: true, blockNumber: true, anchoredAt: true, createdAt: true,
    },
  });
  const anchored = records.filter((r) => r.anchoredAt).length;
  res.json({ data: records, total: records.length, anchored, pending: records.length - anchored });
});

// Public — independently verify a single trade hash against its anchored Merkle root.
router.get('/verify/:tradeHash', async (req, res) => {
  const record = await prisma.performanceRecord.findUnique({ where: { tradeHash: req.params.tradeHash } });
  if (!record) return res.status(404).json({ error: 'Trade hash not found in ledger' });
  if (!record.merkleRoot) return res.json({ verified: false, status: 'pending_anchor', data: record });
  const verified = verifyMerkleProof(record.tradeHash, record.merkleProof, record.merkleRoot);
  res.json({ verified, status: 'anchored', data: record });
});

// Triggers a Merkle batch + on-chain anchor of any trades recorded since the
// last run. In production this is wired to a scheduled job (see server.js);
// exposed here too so it can be triggered manually or by an external cron.
router.post('/anchor', async (req, res) => {
  const result = await runAnchorBatch();
  if (!result) return res.json({ message: 'No pending trades to anchor' });
  res.json({ message: `Anchored ${result.count} trade(s) to ${result.chain}`, ...result });
});

export default router;
