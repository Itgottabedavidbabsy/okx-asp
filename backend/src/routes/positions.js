import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { getOKXPositions } from '../services/okx.js';
import { hashTrade } from '../services/ledger.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (user?.okxAccessToken) {
    try {
      const live = await getOKXPositions(user.okxAccessToken);
      return res.json({ data: live, source: 'okx_live' });
    } catch {}
  }
  const positions = await prisma.position.findMany({
    where: { deployment: { userId: req.user.userId }, status: 'open' },
    include: { deployment: { include: { agent: true } } },
  });
  res.json({ data: positions, source: 'db' });
});

router.post('/:id/close', requireAuth, async (req, res) => {
  const pos = await prisma.position.findUnique({ where: { id: req.params.id }, include: { deployment: true } });
  if (!pos) return res.status(404).json({ error: 'Position not found' });

  const closedAt = new Date();
  await prisma.position.update({ where: { id: req.params.id }, data: { status: 'closed', closedAt } });

  // Hash this closed trade and queue it for on-chain performance verification.
  // The hash is recorded immediately; it gets batched into a Merkle root and
  // anchored on the next scheduled anchor run (see services/ledger.js).
  let tradeHash = null;
  try {
    tradeHash = hashTrade({
      agentId: pos.deployment.agentId,
      deploymentId: pos.deploymentId,
      positionId: pos.id,
      pair: pos.pair,
      direction: pos.direction,
      size: pos.size,
      entryPrice: pos.entryPrice,
      exitPrice: pos.markPrice,
      realizedPnl: pos.unrealizedPnl,
      openedAt: pos.openedAt,
      closedAt,
    });
    await prisma.performanceRecord.create({
      data: { agentId: pos.deployment.agentId, deploymentId: pos.deploymentId, positionId: pos.id, tradeHash },
    });
  } catch (err) {
    console.error('[Ledger] Failed to record trade hash', err.message);
  }

  res.json({ message: 'Close order sent', tradeHash });
});

export default router;
