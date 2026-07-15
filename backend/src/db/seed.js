// Seeds the marketplace with first-party agents. Idempotent — no-ops if
// agents already exist, so it's safe to call on every server boot (see
// server.js) as well as run manually via `npm run db:seed`.

import { prisma } from './prisma.js';

const PLATFORM_CREATOR_EMAIL = 'platform@okx.ai';

const AGENTS = [
  {
    name: 'Grid Alpha Pro',
    category: 'Grid',
    description: 'Automated grid trading across BTC/ETH ranges — profits from volatility without directional bias.',
    priceMonthly: 29, perfFee: 0.15,
    roi30d: 18.4, sharpe: 2.31, maxDrawdown: 8.4, winRate: 67.2,
  },
  {
    name: 'Arb Hunter v2',
    category: 'Arbitrage',
    description: 'Cross-exchange and funding-rate arbitrage — high win rate, low variance, small consistent edges.',
    priceMonthly: 49, perfFee: 0.15,
    roi30d: 15.2, sharpe: 3.14, maxDrawdown: 3.2, winRate: 94.1,
  },
  {
    name: 'Yield Optimizer',
    category: 'Yield',
    description: 'Rotates capital across on-chain yield sources for the best risk-adjusted APY.',
    priceMonthly: 39, perfFee: 0.15,
    roi30d: 34.7, sharpe: 2.64, maxDrawdown: 5.1, winRate: 71.0,
  },
  {
    name: 'Sentiment Trader',
    category: 'Sentiment',
    description: 'NLP-driven entries off social + news sentiment spikes across major pairs.',
    priceMonthly: 35, perfFee: 0.15,
    roi30d: 11.8, sharpe: 1.82, maxDrawdown: 14.2, winRate: 58.4,
  },
  {
    name: 'Whale Tracker',
    category: 'Momentum',
    description: 'Follows large on-chain wallet movements and exchange flows to front-run momentum shifts.',
    priceMonthly: 45, perfFee: 0.15,
    roi30d: 9.4, sharpe: 1.95, maxDrawdown: 11.6, winRate: 61.5,
  },
];

export async function seedAgents() {
  const count = await prisma.agent.count();
  if (count > 0) return;

  let creator = await prisma.user.findUnique({ where: { email: PLATFORM_CREATOR_EMAIL } });
  if (!creator) {
    creator = await prisma.user.create({ data: { email: PLATFORM_CREATOR_EMAIL, tier: 'pro' } });
  }

  await prisma.agent.createMany({
    data: AGENTS.map((a) => ({ ...a, creatorId: creator.id, status: 'live' })),
  });
  console.log(`[Seed] Created ${AGENTS.length} marketplace agents`);
}

// Allow `npm run db:seed` to run this standalone too.
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAgents().then(() => prisma.$disconnect()).catch((err) => { console.error(err); process.exit(1); });
}
