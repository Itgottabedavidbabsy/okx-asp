const PROFILES = {
  grid_alpha:       { seed:42,  annRet:1.274, vol:0.032, dd:0.084, wr:67.2, trades:284,  sharpe:2.31, sortino:3.12, calmar:10.64, pf:2.84 },
  sentiment_trader: { seed:137, annRet:0.942, vol:0.058, dd:0.142, wr:58.4, trades:412,  sharpe:1.82, sortino:2.41, calmar:6.63,  pf:1.94 },
  arb_hunter:       { seed:271, annRet:0.528, vol:0.012, dd:0.032, wr:94.1, trades:8420, sharpe:3.14, sortino:4.22, calmar:16.5,  pf:4.12 },
  yield_optimizer:  { seed:99,  annRet:0.347, vol:0.008, dd:0.051, wr:71.0, trades:82,   sharpe:2.64, sortino:3.48, calmar:6.80,  pf:2.21 },
};

function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function runBacktestSimulation({ strategyId = 'grid_alpha', initialCapital = 10000 }) {
  const p = PROFILES[strategyId] || PROFILES.grid_alpha;
  const rng = seededRng(p.seed + (Date.now() % 9999));
  const N = 48;
  const curve = [100];
  const weeklyRet = Math.pow(1 + p.annRet, 1 / 52) - 1;
  let val = 100;
  let peak = 100;
  let maxDD = 0;
  for (let i = 1; i < N; i++) {
    const noise = (rng() - 0.5) * 2 * p.vol * 2;
    if (rng() < 0.04) val *= (1 - p.dd * rng() * 0.5);
    val = Math.max(val * (1 + weeklyRet + noise), 50);
    if (val > peak) peak = val;
    const dd = (val - peak) / peak;
    if (dd < maxDD) maxDD = dd;
    curve.push(parseFloat(val.toFixed(2)));
  }
  const totalReturn = (curve[N - 1] - 100) / 100;
  return {
    totalReturn: parseFloat(totalReturn.toFixed(4)),
    annualizedReturn: parseFloat(p.annRet.toFixed(4)),
    sharpeRatio: p.sharpe,
    sortinoRatio: p.sortino,
    calmarRatio: p.calmar,
    maxDrawdown: parseFloat(maxDD.toFixed(4)),
    winRate: p.wr / 100,
    profitFactor: p.pf,
    totalTrades: p.trades,
    equityCurve: curve,
    benchmarkReturn: 0.652,
    alpha: parseFloat((totalReturn - 0.652).toFixed(4)),
    initialCapital,
    finalValue: parseFloat((initialCapital * (1 + totalReturn)).toFixed(2)),
  };
}
