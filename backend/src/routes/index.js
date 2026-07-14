import { Router } from 'express';
import authRoutes     from './auth.js';
import agentRoutes    from './agents.js';
import signalRoutes   from './signals.js';
import positionRoutes from './positions.js';
import backtestRoutes from './backtest.js';
import earningsRoutes from './earnings.js';
import performanceRoutes from './performance.js';

const router = Router();
router.use('/auth',        authRoutes);
router.use('/agents',      agentRoutes);
router.use('/signals',     signalRoutes);
router.use('/positions',   positionRoutes);
router.use('/backtest',    backtestRoutes);
router.use('/earnings',    earningsRoutes);
router.use('/performance', performanceRoutes);

router.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));
export default router;
