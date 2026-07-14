import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { runBacktestSimulation } from '../services/backtest.js';
import { prisma } from '../db/prisma.js';

const router = Router();

router.post('/run', requireAuth, async (req, res) => {
  const { strategyId = 'grid_alpha', pair = 'BTC-USDT', startDate, initialCapital = 10000 } = req.body;
  const record = await prisma.backtest.create({
    data: { userId: req.user.userId, strategyId, paramsJson: { pair, startDate, initialCapital }, status: 'running' },
  });
  const results = runBacktestSimulation({ strategyId, pair, initialCapital });
  await prisma.backtest.update({ where: { id: record.id }, data: { results, status: 'complete' } });
  res.json({ data: { backtestId: record.id, status: 'complete', ...results } });
});

router.get('/:id', requireAuth, async (req, res) => {
  const bt = await prisma.backtest.findUnique({ where: { id: req.params.id } });
  if (!bt || bt.userId !== req.user.userId) return res.status(404).json({ error: 'Backtest not found' });
  res.json({ data: bt });
});

export default router;
