import 'dotenv/config';
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: { url: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  jwt: { secret: process.env.JWT_SECRET || 'dev_secret', expiresIn: '7d' },
  ledger: {
    rpcUrl: process.env.LEDGER_RPC_URL,
    privateKey: process.env.LEDGER_PRIVATE_KEY,
    chainName: process.env.LEDGER_CHAIN_NAME || 'ethereum-sepolia',
    anchorIntervalMs: parseInt(process.env.LEDGER_ANCHOR_INTERVAL_MS || '600000', 10),
  },
  okx: {
    clientId: process.env.OKX_CLIENT_ID,
    clientSecret: process.env.OKX_CLIENT_SECRET,
    redirectUri: process.env.OKX_REDIRECT_URI,
    authUrl: process.env.OKX_AUTH_URL || 'https://www.okx.com/oauth/authorize',
    tokenUrl: process.env.OKX_TOKEN_URL || 'https://www.okx.com/oauth/token',
    apiBase: process.env.OKX_API_BASE || 'https://www.okx.com/api/v5',
    wsUrl: process.env.OKX_WS_URL || 'wss://ws.okx.com:8443/ws/v5/public',
  },
};
