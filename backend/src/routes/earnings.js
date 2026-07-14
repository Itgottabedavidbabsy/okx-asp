import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const [subs, payouts] = await Promise.all([
    prisma.subscriber.findMany({ where: { agent: { creatorId: req.user.userId }, status: 'active' } }),
    prisma.payout.findMany({ where: { creatorId: req.user.userId }, orderBy: { createdAt: 'desc' }, take: 12 }),
  ]);
  const gross = subs.length * 29;
  const platform = gross * 0.15;
  const net = gross - platform;
  res.json({ data: { thisMonthGross: gross, platformFee: platform, netEarnings: net, activeSubscribers: subs.length, payouts } });
});

router.post('/withdraw', requireAuth, async (req, res) => {
  const payout = await prisma.payout.create({
    data: { creatorId: req.user.userId, amount: req.body.amount || 0, status: 'pending' },
  });
  res.json({ data: payout, message: 'Withdrawal initiated. Arrives in 1-3 hours.' });
});

export default router;
