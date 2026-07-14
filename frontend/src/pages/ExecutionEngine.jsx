import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';

export default function ExecutionEngine() {
  const [positions, setPositions] = useState([]);
  const [source, setSource] = useState('db');
  const [loading, setLoading] = useState(true);
  const { addToast } = useAppStore();

  function load() {
    setLoading(true);
    api.positions.list()
      .then((r) => { setPositions(r.data || []); setSource(r.source || 'db'); })
      .catch(() => addToast({ type: 'error', msg: 'Failed to load open positions' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  async function close(id) {
    try {
      await api.positions.close(id);
      addToast({ type: 'success', msg: 'Close order sent' });
      load();
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Failed to close position' });
    }
  }

  const totalPnl = positions.reduce((s, p) => s + (p.unrealizedPnl || 0), 0);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Execution Engine</h1>
          <p className="text-[13px]" style={{ color: 'var(--sub)' }}>
            {positions.length} open positions &middot; source: {source === 'okx_live' ? 'OKX live feed' : 'internal ledger'}
          </p>
        </div>
        <div className="text-[16px] font-black" style={{ color: totalPnl >= 0 ? '#00c087' : '#f5475b' }}>
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} unrealized
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="rounded-[10px] p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <div className="text-[13px]" style={{ color: 'var(--sub)' }}>No open positions right now.</div>
        </div>
      ) : (
        <div className="rounded-[10px] overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--card2)' }}>
                {['Pair', 'Direction', 'Size', 'Entry', 'Mark', 'Unrealized PnL', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 font-bold uppercase text-[10px]" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--b)' }}>
                  <td className="px-3.5 py-2.5 font-bold" style={{ color: 'var(--txt)' }}>{p.pair || p.instId}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="font-bold uppercase" style={{ color: p.direction === 'long' ? '#00c087' : '#f5475b' }}>{p.direction}</span>
                  </td>
                  <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>{p.size}</td>
                  <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>${p.entryPrice}</td>
                  <td className="px-3.5 py-2.5" style={{ color: 'var(--sub)' }}>${p.markPrice}</td>
                  <td className="px-3.5 py-2.5 font-bold" style={{ color: (p.unrealizedPnl || 0) >= 0 ? '#00c087' : '#f5475b' }}>
                    {(p.unrealizedPnl || 0) >= 0 ? '+' : ''}${(p.unrealizedPnl || 0).toFixed(2)}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-px rounded-lg uppercase" style={{ background: 'rgba(22,119,255,0.12)', color: '#1677ff' }}>{p.status}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <button onClick={() => close(p.id)} className="text-[11px] font-bold" style={{ color: '#f5475b' }}>Close</button>
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
