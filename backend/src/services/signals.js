import { prisma } from '../db/prisma.js';

const SIGNAL_POOL = [
  { type:'on_chain', asset:'BTC', title:'450 BTC transferred to Binance', detail:'Whale wallet 0x3f4a — 87% confidence. Bearish pattern.', confidence:0.87, impact:'Bearish', source:'on_chain_tracker' },
  { type:'sentiment', asset:'BTC', title:'BTC social volume surged 340%', detail:'128K X/Twitter mentions vs 29K 7-day avg. NLP bullish 74%.', confidence:0.74, impact:'Bullish', source:'nlp_engine' },
  { type:'technical', asset:'SOL', title:'SOL golden cross on 4H — MA20 > MA50', detail:'First golden cross since Oct 2023. Historical win rate 68%.', confidence:0.68, impact:'Bullish', source:'ta_scanner' },
  { type:'alert', asset:'BTC', title:'BTC funding rate elevated at 0.052%', detail:'Long squeeze risk elevated — liquidation risk below $42,800.', confidence:0.81, impact:'Risk', source:'funding_monitor' },
  { type:'on_chain', asset:'ETH', title:'ETH exchange reserves hit 4-month low', detail:'42,000 ETH withdrawn from CEXes. Supply pressure reduced.', confidence:0.79, impact:'Bullish', source:'on_chain_tracker' },
];

export async function seedSignals() {
  const count = await prisma.signal.count();
  if (count > 0) return;
  await prisma.signal.createMany({ data: SIGNAL_POOL });
}
