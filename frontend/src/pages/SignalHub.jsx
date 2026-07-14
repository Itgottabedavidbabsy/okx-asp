import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const TYPES = ['all', 'on_chain', 'sentiment', 'technical', 'alert'];
const ASSETS = ['all', 'BTC', 'ETH', 'SOL'];

const IMPACT_COLOR = { Bullish: '#00c087', Bearish: '#f5475b', Risk: '#f5b800' };

function ComposabilityPanel({ agents }) {
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [triggerOn, setTriggerOn] = useState('signal_routed');
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [links, setLinks] = useState([]);
  const [creating, setCreating] = useState(false);
  const { addToast } = useAppStore();

  useEffect(() => {
    if (agents.length && !sourceId) setSourceId(agents[0].id);
  }, [agents]);

  useEffect(() => {
    if (!targetId && agents.length > 1) setTargetId(agents.find((a) => a.id !== sourceId)?.id || '');
  }, [sourceId, agents]);

  function loadLinks() {
    if (!sourceId) return;
    api.agents.links(sourceId).then((r) => setLinks(r.data || [])).catch(() => {});
  }

  useEffect(() => { loadLinks(); }, [sourceId]);

  async function createLink() {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setCreating(true);
    try {
      await api.agents.createLink(sourceId, { targetAgentId: targetId, triggerOn, minConfidence });
      addToast({ type: 'success', msg: 'Agent chain created' });
      loadLinks();
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Failed to create agent chain' });
    } finally {
      setCreating(false);
    }
  }

  async function removeLink(linkId) {
    try {
      await api.agents.deleteLink(linkId);
      addToast({ type: 'success', msg: 'Agent chain removed' });
      loadLinks();
    } catch {
      addToast({ type: 'error', msg: 'Failed to remove chain' });
    }
  }

  return (
    <div className="rounded-[10px] p-4 mt-5" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
      <div className="text-[12.5px] font-bold mb-1" style={{ color: 'var(--txt)' }}>Agent Composability</div>
      <div className="text-[11.5px] mb-3" style={{ color: 'var(--sub)' }}>
        Chain agents together — when a signal is routed to the source agent, it automatically cascades to trigger the target agent too.
      </div>

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <div>
          <label className="block text-[9.5px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Source Agent</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="text-[16px] font-black pb-1.5" style={{ color: 'var(--muted)' }}>&rarr;</div>
        <div>
          <label className="block text-[9.5px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Target Agent</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}>
            {agents.filter((a) => a.id !== sourceId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9.5px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Trigger On</label>
          <select value={triggerOn} onChange={(e) => setTriggerOn(e.target.value)} className="px-2.5 py-1.5 rounded-[7px] text-[11.5px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}>
            <option value="signal_routed">Signal Routed</option>
            <option value="any_signal">Any Signal</option>
          </select>
        </div>
        <div>
          <label className="block text-[9.5px] font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>Min Confidence: {(minConfidence * 100).toFixed(0)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="w-32" />
        </div>
        <button onClick={createLink} disabled={creating || !sourceId || !targetId} className="px-3.5 py-1.5 rounded-[7px] text-[11px] font-bold text-black disabled:opacity-50" style={{ background: '#06b6d4' }}>
          {creating ? 'Linking...' : 'Create Chain'}
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-[11.5px]" style={{ color: 'var(--muted)' }}>No chains configured for this agent yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {links.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-3 py-1.5 rounded-[7px]" style={{ background: 'var(--card2)' }}>
              <span className="text-[11.5px]" style={{ color: 'var(--txt)' }}>
                &rarr; <strong>{l.targetAgent?.name}</strong>
                <span style={{ color: 'var(--muted)' }}> &middot; {l.triggerOn.replace('_', ' ')} &middot; min {(l.minConfidence * 100).toFixed(0)}%</span>
              </span>
              <button onClick={() => removeLink(l.id)} className="text-[10.5px] font-bold" style={{ color: '#f5475b' }}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {allAgents.length > 1 && <ComposabilityPanel agents={allAgents} />}
    </div>
  );
}

export default function SignalHub() {
  const [signals, setSignals] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
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
  useEffect(() => { api.agents.list().then((r) => setAllAgents(r.data || [])).catch(() => {}); }, []);

  async function route(signalId) {
    const target = deployments[0];
    if (!target) return addToast({ type: 'warn', msg: 'Deploy an agent first to route signals to it' });
    try {
      const res = await api.signals.route({ signalId, agentId: target.agentId, action: 'trigger_entry' });
      addToast({ type: 'success', msg: res.cascadedCount ? `Routed — cascaded to ${res.cascadedCount} chained agent(s)` : (res.message || 'Signal routed') });
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
