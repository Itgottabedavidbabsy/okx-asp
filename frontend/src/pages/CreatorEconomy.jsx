import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAppStore } from '../store/appStore.js';
import MetricCard from '../components/ui/MetricCard.jsx';

export default function CreatorEconomy() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100);
  const [withdrawing, setWithdrawing] = useState(false);
  const { addToast } = useAppStore();

  function load() {
    setLoading(true);
    api.earnings.get()
      .then((r) => setEarnings(r.data))
      .catch(() => addToast({ type: 'error', msg: 'Failed to load earnings' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function withdraw() {
    setWithdrawing(true);
    try {
      const res = await api.earnings.withdraw({ amount: Number(amount) });
      addToast({ type: 'success', msg: res.message || 'Withdrawal initiated' });
      load();
    } catch (err) {
      addToast({ type: 'error', msg: err?.error || 'Withdrawal failed' });
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="p-5">
      <h1 className="text-[18px] font-black mb-1" style={{ color: 'var(--txt)' }}>Creator Economy</h1>
      <p className="text-[13px] mb-4" style={{ color: 'var(--sub)' }}>Revenue from subscribers to the agents you publish.</p>

      {loading ? (
        <div className="text-center py-10 text-[13px]" style={{ color: 'var(--sub)' }}>Loading earnings...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
            <MetricCard label="Gross This Month" value={`$${earnings.thisMonthGross.toLocaleString()}`} sub="before platform fee" accentColor="#1677ff" />
            <MetricCard label="Platform Fee" value={`$${earnings.platformFee.toFixed(2)}`} sub="15% of gross" accentColor="#f5475b" />
            <MetricCard label="Net Earnings" value={`$${earnings.netEarnings.toFixed(2)}`} sub="your take-home" accentColor="#00c087" />
            <MetricCard label="Active Subscribers" value={earnings.activeSubscribers} sub="paying subscribers" accentColor="#f5b800" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-[10px] p-4" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
              <div className="text-[12.5px] font-bold mb-3" style={{ color: 'var(--txt)' }}>Payout History</div>
              {earnings.payouts.length === 0 ? (
                <div className="text-[12px] py-4 text-center" style={{ color: 'var(--sub)' }}>No payouts yet.</div>
              ) : earnings.payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-none" style={{ borderColor: 'var(--b)' }}>
                  <div>
                    <div className="text-[12px] font-bold" style={{ color: 'var(--txt)' }}>${p.amount.toFixed(2)}</div>
                    <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-px rounded-lg uppercase" style={{ background: p.status === 'pending' ? 'rgba(245,184,0,0.12)' : 'rgba(0,192,135,0.12)', color: p.status === 'pending' ? '#f5b800' : '#00c087' }}>{p.status}</span>
                </div>
              ))}
            </div>

            <div className="rounded-[10px] p-4" style={{ background: 'var(--card)', border: '1px solid var(--b)' }}>
              <div className="text-[12.5px] font-bold mb-3" style={{ color: 'var(--txt)' }}>Withdraw Earnings</div>
              <label className="block text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Amount (USDT)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mb-3 px-3 py-2 rounded-[7px] text-[13px] font-semibold bg-transparent" style={{ border: '1px solid var(--b2)', color: 'var(--txt)' }} />
              <button onClick={withdraw} disabled={withdrawing} className="w-full py-2 rounded-[7px] text-xs font-bold text-black disabled:opacity-50" style={{ background: '#f5b800' }}>
                {withdrawing ? 'Processing...' : 'Withdraw Now'}
              </button>
              <div className="text-[10.5px] mt-2" style={{ color: 'var(--muted)' }}>Arrives in 1-3 hours to your connected OKX account.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
