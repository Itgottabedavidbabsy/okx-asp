import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { getOKXPositions } from '../services/okx.js';

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
  const pos = await prisma.position.findUnique({ where: { id: req.params.id } });
  if (!pos) return res.status(404).json({ error: 'Position not found' });
  await prisma.position.update({ where: { id: req.params.id }, data: { status: 'closed', closedAt: new Date() } });
  res.json({ message: 'Close order sent' });
});

export default router;
