import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';

const router = Router();

// List all marketplace agents
router.get('/', optionalAuth, async (req, res) => {
  const { category, sort = 'roi30d', limit = 20 } = req.query;
  const where = { status: 'live' };
  if (category) where.category = category;
  const orderBy = { [sort === 'subscribers' ? 'id' : sort]: 'desc' };
  const agents = await prisma.agent.findMany({
    where, orderBy, take: parseInt(limit),
    select: { id:true, name:true, category:true, description:true, priceMonthly:true, perfFee:true, roi30d:true, sharpe:true, maxDrawdown:true, winRate:true, status:true },
  });
  res.json({ data: agents, total: agents.length });
});

// Deploy an agent (creates a deployment)
router.post('/deploy', requireAuth, async (req, res) => {
  const { agentId, capitalUsdt, riskPreset = 'moderate', maxDrawdown = 0.08 } = req.body;
  if (!agentId || !capitalUsdt) return res.status(400).json({ error: 'agentId and capitalUsdt are required' });
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user.okxAccessToken) return res.status(403).json({ error: 'OKX account not connected — complete OAuth first' });

  const deployment = await prisma.deployment.create({
    data: {
      userId:     req.user.userId,
      agentId,
      capitalUsdt,
      subAccount:  user.okxSubAccount || 'Agent_Prod_01',
      status:      'live',
      riskConfig:  { riskPreset, maxDrawdown },
    },
  });
  res.json({ data: deployment });
});

// Get user's deployed agents
router.get('/my', requireAuth, async (req, res) => {
  const deployments = await prisma.deployment.findMany({
    where: { userId: req.user.userId, status: 'live' },
    include: { agent: true },
  });
  res.json({ data: deployments });
});

// Pause a deployment
router.put('/:id/pause', requireAuth, async (req, res) => {
  const dep = await prisma.deployment.findUnique({ where: { id: req.params.id } });
  if (!dep || dep.userId !== req.user.userId) return res.status(404).json({ error: 'Deployment not found' });
  await prisma.deployment.update({ where: { id: req.params.id }, data: { status: 'paused' } });
  res.json({ message: 'Agent paused successfully' });
});

export default router;
