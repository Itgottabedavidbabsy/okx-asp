import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';
import MetricCard from '../components/ui/MetricCard.jsx';

export default function RiskMonitor() {
  const [positions, setPositions] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useAppStore();

  useEffect(() => {
    Promise.all([api.positions.list(), api.agents.my()])
      .then(([pos, dep]) => { setPositions(pos.data || []); setDeployments(dep.data || []); })
      .catch(() => addToast({ type: 'error', msg: 'Failed to load risk data' }))
      .finally(() => setLoading(false));
  }, []);

  const totalExposure = deployments.reduce((s, d) => s + (d.capitalUsdt || 0), 0);
  const totalUnrealized = positions.reduce((s, p) => s + (p.unrealizedPnl || 0), 0);
  const worstDD = deployments.reduce((max, d) => Math.max(max, d.riskConfig?.maxDrawdown || 0), 0);
  const avgDD = deployments.length ? deployments.reduce((s, d) => s + (d.riskConfig?.maxDrawdown || 0), 0) / deployments.length : 0;

  function riskLevel(dd) {
    if (dd >= 0.15) return { label: 'High', color: '#f5475b' };
    if (dd >= 0.08) return { label: 'Moderate', color: '#f5b800' };
    return { label: 'Low', color: '#00c087' };
  }

  return (
    <div className="p-5">
      <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Risk Monitor</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--sub)' }}>Portfolio-wide exposure and drawdown guard tracking across all deployed agents.</p>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading risk data...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
            <MetricCard label="Total Exposure" value={`$${totalExposure.toLocaleString()}`} sub={`${deployments.length} active deployments`} accentColor="#1677ff" />
            <MetricCard label="Unrealized PnL" value={`${totalUnrealized >= 0 ? '+' : ''}$${totalUnrealized.toFixed(2)}`} sub={`${positions.length} open positions`} accentColor={totalUnrealized >= 0 ? '#00c087' : '#f5475b'} />
            <MetricCard label="Avg Drawdown Guard" value={`${(avgDD * 100).toFixed(0)}%`} sub="across active agents" accentColor="#f5b800" />
            <MetricCard label="Worst-Case Guard" value={`${(worstDD * 100).toFixed(0)}%`} sub="tightest safety net needed" accentColor="#f5475b" />
          </div>

          <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--card2)' }}>
                  {['Agent', 'Capital', 'Risk Preset', 'Max Drawdown', 'Risk Level'].map((h) => (
                    <th key={h} className="text-left px-3.5 py-2.5 font-bold uppercase text-[10px]" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deployments.length === 0 ? (
                  <tr><td colSpan={5} className="px-3.5 py-6 text-center" style={{ color: 'var(--sub)' }}>No active deployments to monitor.</td></tr>
                ) : deployments.map((d) => {
                  const dd = d.riskConfig?.maxDrawdown || 0;
                  const risk = riskLevel(dd);
                  return (
                    <tr key={d.id} className="border-t" style={{ borderColor: 'var(--b)' }}>
                      <td className="px-3.5 py-2.5 font-bold" style={{ color: 'var(--txt)' }}>{d.agent?.name || d.agentId}</td>
                      <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>${d.capitalUsdt?.toLocaleString()}</td>
                      <td className="px-3.5 py-2.5 capitalize" style={{ color: 'var(--sub)' }}>{d.riskConfig?.riskPreset || '—'}</td>
                      <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>{(dd * 100).toFixed(0)}%</td>
                      <td className="px-3.5 py-2.5">
                        <span className="text-[10px] font-bold px-2 py-px rounded-lg" style={{ background: `${risk.color}20`, color: risk.color }}>{risk.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
