import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

const ENDPOINTS = [
  { method: 'GET',  path: '/api/agents',         desc: 'List live marketplace agents' },
  { method: 'POST', path: '/api/agents/deploy',  desc: 'Deploy an agent with capital + risk config' },
  { method: 'GET',  path: '/api/agents/my',      desc: 'List your active deployments' },
  { method: 'PUT',  path: '/api/agents/:id/pause', desc: 'Pause a deployment' },
  { method: 'GET',  path: '/api/signals',        desc: 'List recent trading signals' },
  { method: 'POST', path: '/api/signals/route',  desc: 'Route a signal to an agent' },
  { method: 'GET',  path: '/api/positions',      desc: 'List open positions (live or ledger)' },
  { method: 'POST', path: '/api/positions/:id/close', desc: 'Close a position' },
  { method: 'POST', path: '/api/backtest/run',   desc: 'Run a strategy backtest simulation' },
  { method: 'GET',  path: '/api/earnings',       desc: 'Get creator earnings summary' },
];

const METHOD_COLOR = { GET: '#00c087', POST: '#1677ff', PUT: '#f5b800', DELETE: '#f5475b' };

export default function APIPortal() {
  const [me, setMe] = useState(null);
  const [copied, setCopied] = useState(false);
  const { token, addToast } = useAppStore();

  useEffect(() => {
    if (!token) return;
    api.auth.me().then(setMe).catch(() => {});
  }, [token]);

  function copyToken() {
    if (!token) return addToast({ type: 'warn', msg: 'Connect your OKX account first to receive an API token' });
    navigator.clipboard.writeText(token);
    setCopied(true);
    addToast({ type: 'success', msg: 'Token copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-5">
      <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>API Access</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--sub)' }}>Authenticate with your bearer token and integrate the OKX.AI ASP platform programmatically.</p>

      <div className="rounded-[10px] p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12.5px] font-bold" style={{ color: 'var(--txt)' }}>Your Bearer Token</div>
          {me && <span className="text-[9px] font-bold px-1.5 py-px rounded-lg uppercase" style={{ background: 'rgba(0,192,135,0.12)', color: '#00c087' }}>{me.tier} tier</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-[7px] text-[11.5px] font-mono truncate" style={{ background: 'var(--card2)', color: 'var(--sub)' }}>
            {token ? `${token.slice(0, 24)}...${token.slice(-8)}` : 'Connect OKX to receive a token'}
          </div>
          <button onClick={copyToken} className="px-3 py-2 rounded-[7px] text-[11px] font-bold text-black flex-shrink-0" style={{ background: '#f5b800' }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="text-[10.5px] mt-2" style={{ color: 'var(--muted)' }}>Send as: <span className="font-mono">Authorization: Bearer &lt;token&gt;</span></div>
      </div>

      <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
        <div className="px-3.5 py-2.5 text-[12.5px] font-bold" style={{ borderBottom: '1px solid var(--b)', color: 'var(--txt)' }}>Endpoint Reference</div>
        {ENDPOINTS.map((e) => (
          <div key={e.method + e.path} className="flex items-center gap-3 px-3.5 py-2.5 border-t" style={{ borderColor: 'var(--b)' }}>
            <span className="text-[10px] font-black w-12 text-center py-0.5 rounded-lg flex-shrink-0" style={{ background: `${METHOD_COLOR[e.method]}20`, color: METHOD_COLOR[e.method] }}>{e.method}</span>
            <span className="text-[12px] font-mono flex-shrink-0" style={{ color: 'var(--txt)' }}>{e.path}</span>
            <span className="text-[11.5px]" style={{ color: 'var(--sub)' }}>{e.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
