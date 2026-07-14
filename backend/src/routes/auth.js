import { Router } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { prisma } from '../db/prisma.js';

const router = Router();
const pkceStore = new Map();

// Step 1: Initiate OKX OAuth PKCE flow
router.get('/okx/start', (req, res) => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  const state = crypto.randomBytes(16).toString('hex');
  pkceStore.set(state, { verifier, expiresAt: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id:             config.okx.clientId,
    redirect_uri:          config.okx.redirectUri,
    response_type:         'code',
    scope:                 'read trade',
    state,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });
  res.json({ authUrl: `${config.okx.authUrl}?${params}` });
});

// Step 2: OKX redirects here with code
router.get('/okx/callback', async (req, res) => {
  const { code, state } = req.query;
  const stored = pkceStore.get(state);
  if (!stored || stored.expiresAt < Date.now())
    return res.status(400).json({ error: 'Invalid or expired state' });
  pkceStore.delete(state);

  try {
    const { data: tokenData } = await axios.post(config.okx.tokenUrl, {
      grant_type:    'authorization_code',
      client_id:     config.okx.clientId,
      client_secret: config.okx.clientSecret,
      redirect_uri:  config.okx.redirectUri,
      code,
      code_verifier: stored.verifier,
    });

    let user = await prisma.user.findFirst({ where: { okxAccessToken: tokenData.access_token } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email:          `okx_${crypto.randomBytes(8).toString('hex')}@okx.ai`,
          okxAccessToken:  tokenData.access_token,
          okxRefreshToken: tokenData.refresh_token,
          okxSubAccount:   'Agent_Prod_01',
          tier:            'pro',
        },
      });
    }

    const jwtToken = jwt.sign({ userId: user.id, email: user.email }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    res.redirect(`${config.frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    res.status(500).json({ error: 'OAuth token exchange failed', detail: err.message });
  }
});

// Refresh OKX token
router.post('/okx/refresh', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user?.okxRefreshToken) return res.status(400).json({ error: 'No refresh token stored' });
  try {
    const { data } = await axios.post(config.okx.tokenUrl, {
      grant_type:    'refresh_token',
      client_id:     config.okx.clientId,
      client_secret: config.okx.clientSecret,
      refresh_token: user.okxRefreshToken,
    });
    await prisma.user.update({
      where: { id: user.id },
      data:  { okxAccessToken: data.access_token, okxRefreshToken: data.refresh_token },
    });
    res.json({ message: 'Token refreshed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.userId },
    select: { id: true, email: true, tier: true, okxSubAccount: true, createdAt: true },
  });
  res.json(user);
});

export default router;
