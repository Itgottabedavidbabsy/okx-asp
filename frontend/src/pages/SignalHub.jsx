import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const TYPES = ['all', 'on_chain', 'sentiment', 'technical', 'alert'];
const ASSETS = ['all', 'BTC', 'ETH', 'SOL'];

const IMPACT_COLOR = { Bullish: '#00c087', Bearish: '#f5475b', Risk: '#f5b800' };

export default function SignalHub() {
  const [signals, setSignals] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [type, setType] = useState('all');
  const [asset, setAsset] = useState('all');
  const [loading, setLoading] = useState(true);
  const { addToast } = useAppStore();

  function load() {
    setLoading(true);
    const params = {};
    if (type !== 'all') params.type = type;
    if (asset !== 'all') params.asset = asset;
    api.signals.list(params)
      .then((r) => setSignals(r.data || []))
      .catch(() => addToast({ type: 'error', msg: 'Failed to load signals' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [type, asset]);
  useEffect(() => { api.agents.my().then((r) => setDeployments(r.data || [])).catch(() => {}); }, []);

  async function route(signalId) {
    const target = deployments[0];
    if (!target) return addToast({ type: 'warn', msg: 'Deploy an agent first to route signals to it' });
    try {
      const res = await api.signals.route({ signalId, agentId: target.agentId, action: 'trigger_entry' });
      addToast({ type: 'success', msg: res.message || 'Signal routed' });
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Failed to route signal' });
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[18px] font-black" style={{ color: 'var(--txt)' }}>Signal Hub</h1>
        <span className="text-[9.5px] font-bold px-2 py-px rounded-lg" style={{ background: 'rgba(245,71,91,0.12)', color: '#f5475b', border: '1px solid rgba(245,71,91,0.25)' }}>Live</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className="px-2.5 py-1 rounded-[7px] text-[10.5px] font-bold capitalize" style={{ background: type === t ? 'rgba(22,119,255,0.12)' : 'transparent', border: `1px solid ${type === t ? '#1677ff' : 'var(--b)'}`, color: type === t ? '#1677ff' : 'var(--sub)' }}>
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {ASSETS.map((a) => (
            <button key={a} onClick={() => setAsset(a)} className="px-2.5 py-1 rounded-[7px] text-[10.5px] font-bold" style={{ background: asset === a ? 'rgba(245,184,0,0.12)' : 'transparent', border: `1px solid ${asset === a ? '#f5b800' : 'var(--b)'}`, color: asset === a ? '#f5b800' : 'var(--sub)' }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading signals...</div>
      ) : signals.length === 0 ? (
        <div className="rounded-[10px] p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <div className="text-[13px]" style={{ color: 'var(--sub)' }}>No signals match this filter.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {signals.map((s) => (
            <div key={s.id} className="rounded-[10px] p-3.5 flex items-center gap-3.5" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
              <div className="w-9 h-9 rounded-[7px] flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: 'var(--card2)', color: 'var(--sub)' }}>{s.asset}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12.5px] font-bold" style={{ color: 'var(--txt)' }}>{s.title}</span>
                  <span className="text-[9px] font-bold px-1.5 py-px rounded-lg uppercase" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>{s.type.replace('_', ' ')}</span>
                </div>
                <div className="text-[11px]" style={{ color: 'var(--sub)' }}>{s.detail}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[11px] font-bold mb-1" style={{ color: IMPACT_COLOR[s.impact] || 'var(--sub)' }}>{s.impact} &middot; {(s.confidence * 100).toFixed(0)}%</div>
                <button onClick={() => route(s.id)} className="text-[10.5px] font-bold px-2.5 py-1 rounded-[7px] text-black" style={{ background: '#f5b800' }}>Route to Agent</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
