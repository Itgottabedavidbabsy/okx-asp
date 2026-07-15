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

// ---------------------------------------------------------------------------
// Composability — link one agent's signal output to trigger another agent.
// ---------------------------------------------------------------------------

// Create an outgoing link from :id (source) to a target agent
router.post('/:id/links', requireAuth, async (req, res) => {
  const { targetAgentId, triggerOn = 'signal_routed', minConfidence = 0 } = req.body;
  if (!targetAgentId) return res.status(400).json({ error: 'targetAgentId is required' });
  if (targetAgentId === req.params.id) return res.status(400).json({ error: 'An agent cannot link to itself' });

  const [source, target] = await Promise.all([
    prisma.agent.findUnique({ where: { id: req.params.id } }),
    prisma.agent.findUnique({ where: { id: targetAgentId } }),
  ]);
  if (!source || !target) return res.status(404).json({ error: 'Source or target agent not found' });

  const link = await prisma.agentLink.create({
    data: { sourceAgentId: req.params.id, targetAgentId, triggerOn, minConfidence },
    include: { targetAgent: { select: { id: true, name: true, category: true } } },
  });
  res.json({ data: link });
});

// List outgoing links (downstream agents this one can trigger)
router.get('/:id/links', optionalAuth, async (req, res) => {
  const links = await prisma.agentLink.findMany({
    where: { sourceAgentId: req.params.id },
    include: { targetAgent: { select: { id: true, name: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: links });
});

// Remove a composability link
router.delete('/links/:linkId', requireAuth, async (req, res) => {
  await prisma.agentLink.delete({ where: { id: req.params.linkId } }).catch(() => {});
  res.json({ message: 'Link removed' });
});

export default router;
