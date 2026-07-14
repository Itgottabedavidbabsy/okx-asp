import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const CATEGORIES = ['All', 'Grid', 'Arbitrage', 'Yield', 'Sentiment', 'Momentum'];

function StatPill({ label, value, color }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-[15px] font-black" style={{ color }}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

function DeployModal({ agent, onClose, onDeployed }) {
  const [capital, setCapital] = useState(1000);
  const [riskPreset, setRiskPreset] = useState('moderate');
  const [maxDrawdown, setMaxDrawdown] = useState(0.08);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useAppStore();

  async function submit() {
    setSubmitting(true);
    try {
      await api.agents.deploy({ agentId: agent.id, capitalUsdt: Number(capital), riskPreset, maxDrawdown });
      addToast({ type: 'success', msg: `${agent.name} deployed with $${capital} capital` });
      onDeployed();
      onClose();
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Deployment failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-[10px] p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--b2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[15px] font-black mb-1" style={{ color: 'var(--txt)' }}>Deploy {agent.name}</div>
        <div className="text-[11.5px] mb-4" style={{ color: 'var(--sub)' }}>{agent.description}</div>

        <label className="block text-[10.5px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Capital (USDT)</label>
        <input
          type="number" min="100" value={capital} onChange={(e) => setCapital(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-[7px] text-[13px] font-semibold bg-transparent"
          style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}
        />

        <label className="block text-[10.5px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Risk Preset</label>
        <div className="flex gap-2 mb-3">
          {['conservative', 'moderate', 'aggressive'].map((p) => (
            <button
              key={p} onClick={() => setRiskPreset(p)}
              className="flex-1 py-1.5 rounded-[7px] text-[11px] font-bold capitalize"
              style={{
                background: riskPreset === p ? 'rgba(22,119,255,0.15)' : 'transparent',
                border: `1px solid ${riskPreset === p ? '#1677ff' : 'var(--b2)'}`,
                color: riskPreset === p ? '#1677ff' : 'var(--sub)',
              }}
            >{p}</button>
          ))}
        </div>

        <label className="block text-[10.5px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
          Max Drawdown Guard: {(maxDrawdown * 100).toFixed(0)}%
        </label>
        <input
          type="range" min="0.02" max="0.25" step="0.01" value={maxDrawdown}
          onChange={(e) => setMaxDrawdown(Number(e.target.value))}
          className="w-full mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-[7px] text-xs font-bold" style={{ border: '1px solid var(--b2)', color: 'var(--sub)' }}>
            Cancel
          </button>
          <button
            onClick={submit} disabled={submitting}
            className="flex-1 py-2 rounded-[7px] text-xs font-bold text-black disabled:opacity-50"
            style={{ background: '#f5b800' }}
          >
            {submitting ? 'Deploying...' : 'Confirm Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [agents, setAgents] = useState([]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('roi30d');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { addToast } = useAppStore();

  function load() {
    setLoading(true);
    const params = { sort };
    if (category !== 'All') params.category = category;
    api.agents.list(params)
      .then((r) => setAgents(r.data || []))
      .catch(() => addToast({ type: 'error', msg: 'Failed to load marketplace agents' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [category, sort]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Agent Marketplace</h1>
          <p className="text-[13px]" style={{ color: 'var(--sub)' }}>{agents.length} live agents available for deployment</p>
        </div>
        <select
          value={sort} onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 rounded-[7px] text-xs font-semibold bg-transparent"
          style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}
        >
          <option value="roi30d">Sort: ROI 30D</option>
          <option value="sharpe">Sort: Sharpe Ratio</option>
          <option value="winRate">Sort: Win Rate</option>
        </select>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c} onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-bold whitespace-nowrap"
            style={{
              background: category === c ? 'rgba(245,184,0,0.12)' : 'transparent',
              border: `1px solid ${category === c ? '#f5b800' : 'var(--b)'}`,
              color: category === c ? '#f5b800' : 'var(--sub)',
            }}
          >{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>No agents found for this filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((a) => (
            <div key={a.id} className="rounded-[10px] p-4 flex flex-col" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-[14px] font-black" style={{ color: 'var(--txt)' }}>{a.name}</div>
                <span className="text-[9px] font-bold px-1.5 py-px rounded-lg uppercase" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}>
                  {a.category}
                </span>
              </div>
              <div className="text-[11.5px] mb-3 flex-1" style={{ color: 'var(--sub)' }}>{a.description}</div>
              <div className="flex mb-3 py-2 rounded-[7px]" style={{ background: 'var(--card2)' }}>
                <StatPill label="ROI 30D" value={`+${a.roi30d}%`} color="#00c087" />
                <StatPill label="Sharpe" value={a.sharpe} color="#f5b800" />
                <StatPill label="Win Rate" value={`${a.winRate}%`} color="#1677ff" />
              </div>
              <div className="flex items-center justify-between mb-3 text-[11px]" style={{ color: 'var(--muted)' }}>
                <span>Max DD: <span style={{ color: '#f5475b' }}>{a.maxDrawdown}%</span></span>
                <span>Perf Fee: {(a.perfFee * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[13px] font-black" style={{ color: 'var(--txt)' }}>${a.priceMonthly}<span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>/mo</span></div>
                <button
                  onClick={() => setSelected(a)}
                  className="px-3 py-1.5 rounded-[7px] text-[11px] font-bold text-black"
                  style={{ background: '#f5b800' }}
                >Deploy</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <DeployModal agent={selected} onClose={() => setSelected(null)} onDeployed={load} />}
    </div>
  );
}
