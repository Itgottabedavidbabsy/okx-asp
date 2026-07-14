import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

export default function MyAgents() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useAppStore();

  function load() {
    setLoading(true);
    api.agents.my()
      .then((r) => setDeployments(r.data || []))
      .catch(() => addToast({ type: 'error', msg: 'Failed to load your deployments' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function pause(id) {
    try {
      await api.agents.pause(id);
      addToast({ type: 'success', msg: 'Agent paused' });
      load();
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Failed to pause agent' });
    }
  }

  const totalCapital = deployments.reduce((s, d) => s + (d.capitalUsdt || 0), 0);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>My Agents</h1>
          <p className="text-[13px]" style={{ color: 'var(--sub)' }}>
            {deployments.length} deployed &middot; ${totalCapital.toLocaleString()} total capital allocated
          </p>
        </div>
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[7px] text-[12px] font-bold text-black"
          style={{ background: '#f5b800' }}
        >Deploy New Agent</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading deployments...</div>
      ) : deployments.length === 0 ? (
        <div className="rounded-[10px] p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <div className="text-[13px] mb-3" style={{ color: 'var(--sub)' }}>You haven&apos;t deployed any agents yet.</div>
          <button onClick={() => navigate('/marketplace')} className="px-4 py-2 rounded-[7px] text-xs font-bold text-black" style={{ background: '#f5b800' }}>
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--card2)' }}>
                {['Agent', 'Capital', 'Sub-Account', 'Risk', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 font-bold uppercase text-[10px]" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.id} className="border-t" style={{ borderColor: 'var(--b)' }}>
                  <td className="px-3.5 py-2.5">
                    <div className="font-bold" style={{ color: 'var(--txt)' }}>{d.agent?.name || d.agentId}</div>
                    <div className="text-[10.5px]" style={{ color: 'var(--muted)' }}>{d.agent?.category}</div>
                  </td>
                  <td className="px-3.5 py-2.5 font-bold" style={{ color: 'var(--txt)' }}>${d.capitalUsdt?.toLocaleString()}</td>
                  <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>{d.subAccount}</td>
                  <td className="px-3.5 py-2.5 capitalize" style={{ color: 'var(--sub)' }}>{d.riskConfig?.riskPreset || '—'}</td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className="text-[10px] font-bold px-2 py-px rounded-lg uppercase"
                      style={{
                        background: d.status === 'live' ? 'rgba(0,192,135,0.12)' : 'rgba(255,255,255,0.06)',
                        color: d.status === 'live' ? '#00c087' : 'var(--muted)',
                      }}
                    >{d.status}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    {d.status === 'live' && (
                      <button onClick={() => pause(d.id)} className="text-[11px] font-bold" style={{ color: '#f5475b' }}>Pause</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
