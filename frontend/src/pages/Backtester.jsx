import { useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const STRATEGIES = [
  { id: 'grid_alpha', label: 'Grid Alpha' },
  { id: 'sentiment_trader', label: 'Sentiment Trader' },
  { id: 'arb_hunter', label: 'Arb Hunter' },
  { id: 'yield_optimizer', label: 'Yield Optimizer' },
];
const PAIRS = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT'];

function Sparkline({ points, color }) {
  if (!points?.length) return null;
  const w = 600, h = 140;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 140 }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function Stat({ label, value, color = 'var(--txt)' }) {
  return (
    <div className="rounded-[8px] p-3" style={{ background: 'var(--card2)' }}>
      <div className="text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
      <div className="text-[15px] font-black" style={{ color }}>{value}</div>
    </div>
  );
}

export default function Backtester() {
  const [strategyId, setStrategyId] = useState('grid_alpha');
  const [pair, setPair] = useState('BTC-USDT');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const { addToast } = useAppStore();

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const res = await api.backtest.run({ strategyId, pair, initialCapital: Number(initialCapital) });
      setResult(res.data);
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Backtest failed to run' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-5">
      <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Backtester</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--sub)' }}>Simulate a strategy against historical conditions before deploying real capital.</p>

      <div className="rounded-[10px] p-4 mb-4 flex flex-wrap items-end gap-3" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Strategy</label>
          <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)} className="px-3 py-2 rounded-[7px] text-[12.5px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}>
            {STRATEGIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Pair</label>
          <select value={pair} onChange={(e) => setPair(e.target.value)} className="px-3 py-2 rounded-[7px] text-[12.5px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}>
            {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Initial Capital</label>
          <input type="number" min="100" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} className="px-3 py-2 rounded-[7px] text-[12.5px] font-semibold bg-transparent w-32" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }} />
        </div>
        <button onClick={run} disabled={running} className="px-4 py-2 rounded-[7px] text-xs font-bold text-black disabled:opacity-50" style={{ background: '#f5b800' }}>
          {running ? 'Running...' : 'Run Backtest'}
        </button>
      </div>

      {result && (
        <div className="rounded-[10px] p-4" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <div className="text-[12.5px] font-bold mb-3" style={{ color: 'var(--txt)' }}>Equity Curve</div>
          <Sparkline points={result.equityCurve} color={result.totalReturn >= 0 ? '#00c087' : '#f5475b'} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
            <Stat label="Total Return" value={`${(result.totalReturn * 100).toFixed(1)}%`} color={result.totalReturn >= 0 ? '#00c087' : '#f5475b'} />
            <Stat label="Annualized" value={`${(result.annualizedReturn * 100).toFixed(1)}%`} color="#f5b800" />
            <Stat label="Sharpe Ratio" value={result.sharpeRatio} />
            <Stat label="Sortino Ratio" value={result.sortinoRatio} />
            <Stat label="Calmar Ratio" value={result.calmarRatio} />
            <Stat label="Max Drawdown" value={`${(result.maxDrawdown * 100).toFixed(1)}%`} color="#f5475b" />
            <Stat label="Win Rate" value={`${(result.winRate * 100).toFixed(1)}%`} color="#00c087" />
            <Stat label="Profit Factor" value={result.profitFactor} />
            <Stat label="Total Trades" value={result.totalTrades} />
            <Stat label="Alpha vs Benchmark" value={`${(result.alpha * 100).toFixed(1)}%`} color={result.alpha >= 0 ? '#00c087' : '#f5475b'} />
            <Stat label="Initial Capital" value={`$${result.initialCapital.toLocaleString()}`} />
            <Stat label="Final Value" value={`$${result.finalValue.toLocaleString()}`} color="#1677ff" />
          </div>
        </div>
      )}
    </div>
  );
}
