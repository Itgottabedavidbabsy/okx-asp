import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const STEPS = ['Select Strategy', 'Configure Capital', 'Set Risk Guards', 'Review & Deploy'];

export default function AgentBuilder() {
  const [step, setStep] = useState(0);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState('');
  const [capital, setCapital] = useState(1000);
  const [riskPreset, setRiskPreset] = useState('moderate');
  const [maxDrawdown, setMaxDrawdown] = useState(0.08);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.agents.list().then((r) => {
      setAgents(r.data || []);
      if (r.data?.[0]) setAgentId(r.data[0].id);
    }).catch(() => addToast({ type: 'error', msg: 'Failed to load strategy templates' }));
  }, []);

  const selectedAgent = agents.find((a) => a.id === agentId);

  async function deploy() {
    setSubmitting(true);
    try {
      await api.agents.deploy({ agentId, capitalUsdt: Number(capital), riskPreset, maxDrawdown });
      addToast({ type: 'success', msg: 'Agent built and deployed successfully' });
      navigate('/my-agents');
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Failed to deploy agent' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-5 max-w-[720px]">
      <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Agent Builder</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--sub)' }}>Configure and deploy a strategy-backed trading agent in four steps.</p>

      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold flex-shrink-0"
              style={{
                background: i <= step ? '#f5b800' : 'var(--card2)',
                color: i <= step ? '#0c1628' : 'var(--muted)',
              }}
            >{i + 1}</div>
            {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? '#f5b800' : 'var(--b)' }} />}
          </div>
        ))}
      </div>

      <div className="rounded-[10px] p-5 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
        <div className="text-[13px] font-bold mb-4" style={{ color: 'var(--txt)' }}>{STEPS[step]}</div>

        {step === 0 && (
          <div className="grid grid-cols-1 gap-2">
            {agents.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[7px] cursor-pointer"
                style={{ border: `1px solid ${agentId === a.id ? '#1677ff' : 'var(--b)'}`, background: agentId === a.id ? 'rgba(22,119,255,0.08)' : 'transparent' }}
              >
                <input type="radio" checked={agentId === a.id} onChange={() => setAgentId(a.id)} />
                <div className="flex-1">
                  <div className="text-[12.5px] font-bold" style={{ color: 'var(--txt)' }}>{a.name}</div>
                  <div className="text-[10.5px]" style={{ color: 'var(--muted)' }}>{a.category} &middot; ROI 30D +{a.roi30d}% &middot; Sharpe {a.sharpe}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="block text-[10.5px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Capital Allocation (USDT)</label>
            <input
              type="number" min="100" value={capital} onChange={(e) => setCapital(e.target.value)}
              className="w-full px-3 py-2 rounded-[7px] text-[13px] font-semibold bg-transparent"
              style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }}
            />
            <div className="flex gap-2 mt-2">
              {[500, 1000, 5000, 10000].map((v) => (
                <button key={v} onClick={() => setCapital(v)} className="px-2.5 py-1 rounded-[7px] text-[11px] font-bold" style={{ border: '1px solid var(--b2)', color: 'var(--sub)' }}>${v.toLocaleString()}</button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-[10.5px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Risk Preset</label>
            <div className="flex gap-2 mb-4">
              {['conservative', 'moderate', 'aggressive'].map((p) => (
                <button
                  key={p} onClick={() => setRiskPreset(p)}
                  className="flex-1 py-2 rounded-[7px] text-[11.5px] font-bold capitalize"
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
            <input type="range" min="0.02" max="0.25" step="0.01" value={maxDrawdown} onChange={(e) => setMaxDrawdown(Number(e.target.value))} className="w-full" />
          </div>
        )}

        {step === 3 && selectedAgent && (
          <div className="text-[12.5px]" style={{ color: 'var(--sub)' }}>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--b)' }}><span>Strategy</span><span className="font-bold" style={{ color: 'var(--txt)' }}>{selectedAgent.name}</span></div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--b)' }}><span>Capital</span><span className="font-bold" style={{ color: 'var(--txt)' }}>${Number(capital).toLocaleString()}</span></div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--b)' }}><span>Risk Preset</span><span className="font-bold capitalize" style={{ color: 'var(--txt)' }}>{riskPreset}</span></div>
            <div className="flex justify-between py-2"><span>Max Drawdown</span><span className="font-bold" style={{ color: '#f5475b' }}>{(maxDrawdown * 100).toFixed(0)}%</span></div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-[7px] text-xs font-bold" style={{ border: '1px solid var(--b2)', color: 'var(--sub)' }}>Back</button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)} disabled={!agentId}
            className="flex-1 py-2 rounded-[7px] text-xs font-bold text-black disabled:opacity-50"
            style={{ background: '#f5b800' }}
          >Continue</button>
        ) : (
          <button
            onClick={deploy} disabled={submitting}
            className="flex-1 py-2 rounded-[7px] text-xs font-bold text-black disabled:opacity-50"
            style={{ background: '#00c087' }}
          >{submitting ? 'Deploying...' : 'Deploy Agent'}</button>
        )}
      </div>
    </div>
  );
}
