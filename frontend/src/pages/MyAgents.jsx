import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

function LedgerModal({ agentId, agentName, onClose }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total: 0, anchored: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.performance.agent(agentId)
      .then((r) => { setRecords(r.data || []); setSummary({ total: r.total, anchored: r.anchored, pending: r.pending }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-[560px] max-h-[80vh] overflow-y-auto rounded-[10px] p-5" style={{ background: 'var(--card)', border: '1px solid var(--b2)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-[15px] font-black" style={{ color: 'var(--txt)' }}>On-Chain Ledger — {agentName}</div>
          <button onClick={onClose} className="text-[11px] font-bold" style={{ color: 'var(--sub)' }}>Close</button>
        </div>
        <div className="text-[11.5px] mb-4" style={{ color: 'var(--sub)' }}>
          Every closed trade is hashed and batched into a Merkle root anchored on-chain — verifiable by anyone, independent of this platform.
        </div>
        {!loading && (
          <div className="flex gap-2 mb-3">
            <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(0,192,135,0.12)', color: '#00c087' }}>{summary.anchored} anchored</span>
            <span className="text-[10.5px] font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,184,0,0.12)', color: '#f5b800' }}>{summary.pending} pending</span>
          </div>
        )}
        {loading ? (
          <div className="text-center py-6 text-[12px]" style={{ color: 'var(--sub)' }}>Loading ledger...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-6 text-[12px]" style={{ color: 'var(--sub)' }}>No closed trades recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-[7px]" style={{ background: 'var(--card2)' }}>
                <div className="font-mono text-[10.5px] truncate mr-2" style={{ color: 'var(--sub)' }}>{r.tradeHash.slice(0, 18)}...{r.tradeHash.slice(-6)}</div>
                <span className="text-[9.5px] font-bold px-1.5 py-px rounded-lg flex-shrink-0" style={{ background: r.anchoredAt ? 'rgba(0,192,135,0.12)' : 'rgba(245,184,0,0.12)', color: r.anchoredAt ? '#00c087' : '#f5b800' }}>
                  {r.anchoredAt ? `Anchored · ${r.chain}` : 'Pending anchor'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyAgents() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerAgent, setLedgerAgent] = useState(null);
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
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setLedgerAgent({ id: d.agentId, name: d.agent?.name || d.agentId })} className="text-[11px] font-bold mr-3" style={{ color: '#06b6d4' }}>Ledger</button>
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

      {ledgerAgent && <LedgerModal agentId={ledgerAgent.id} agentName={ledgerAgent.name} onClose={() => setLedgerAgent(null)} />}
    </div>
  );
}
