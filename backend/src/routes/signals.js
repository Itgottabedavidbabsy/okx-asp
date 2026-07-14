import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { type, asset, limit = 50 } = req.query;
  const where = {};
  if (type) where.type = type;
  if (asset) where.asset = asset;
  const signals = await prisma.signal.findMany({
    where, orderBy: { createdAt: 'desc' }, take: parseInt(limit),
  });
  res.json({ data: signals, total: signals.length });
});

router.post('/route', requireAuth, async (req, res) => {
  const { signalId, agentId, action = 'trigger_entry' } = req.body;
  if (!signalId || !agentId) return res.status(400).json({ error: 'signalId and agentId are required' });
  res.json({ message: `Signal ${signalId} routed to agent ${agentId}`, action });
});

export default router;
