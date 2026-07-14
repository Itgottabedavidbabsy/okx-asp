import { useAppStore } from '../../store/appStore.js';
import { api } from '../../api/client.js';

const PAIRS = [
  { key:'BTC', label:'BTC' },
  { key:'ETH', label:'ETH' },
  { key:'SOL', label:'SOL' },
];

export default function TopNav({ onMenuToggle }) {
  const { prices, wssConnected, addToast } = useAppStore();

  async function connectOKX() {
    try {
      const res = await api.auth.startOKX();
      if (res.authUrl) window.location.href = res.authUrl;
    } catch {
      addToast({ type:'error', msg:'Failed to initiate OKX OAuth' });
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 z-[200] flex items-center gap-0"
      style={{ background:'var(--surf)', borderBottom:'1px solid var(--b)' }}
    >
      <div className="w-[218px] flex items-center gap-2.5 px-4 flex-shrink-0 border-r" style={{ borderColor:'var(--b)' }}>
        <button className="lg:hidden text-[var(--sub)] text-xl mr-1 bg-transparent border-none cursor-pointer" onClick={onMenuToggle}>
          <i className="ti ti-menu-2" />
        </button>
        <div className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-black text-black flex-shrink-0" style={{ background:'#f5b800' }}>OKX</div>
        <span className="text-[14px] font-black">OKX<span style={{ color:'#f5b800' }}>.AI</span></span>
        <span className="text-[9px] font-bold px-1.5 py-px rounded-lg hidden sm:block" style={{ border:'1px solid var(--b2)', color:'var(--muted)' }}>ASP</span>
      </div>

      <div className="flex items-center gap-3.5 px-4 flex-1 overflow-hidden">
        {PAIRS.map(({ key, label }) => {
          const p = prices[key];
          const isPos = p?.c >= 0;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <span style={{ color:'var(--sub)', fontWeight:700 }}>{label}</span>
              <span className="font-bold" style={{ color:'var(--txt)' }}>
                {p?.v ? `$${p.v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}` : '—'}
              </span>
              {p?.c !== 0 && (
                <span className="text-[11px] font-bold px-1.5 py-px rounded-lg" style={{ background: isPos ? 'rgba(0,192,135,0.12)' : 'rgba(245,71,91,0.12)', color: isPos ? '#00c087' : '#f5475b' }}>
                  {isPos ? '+' : ''}{p?.c?.toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 text-[10.5px] ml-1">
          <div className={`w-1.5 h-1.5 rounded-full ${wssConnected ? 'bg-[#00c087] animate-pulse' : 'bg-[var(--muted)]'}`} />
          <span style={{ color:'var(--muted)' }}>{wssConnected ? 'OKX Live Feed' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 flex-shrink-0">
        <button
          onClick={connectOKX}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-bold"
          style={{ background:'rgba(0,192,135,0.1)', border:'1px solid rgba(0,192,135,0.22)', color:'#00c087' }}
        >
          <i className="ti ti-shield-check text-sm" />
          Connect OKX
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-bold text-black"
          style={{ background:'#f5b800' }}
        >
          <i className="ti ti-plus text-sm" />
          New Agent
        </button>
      </div>
    </header>
  );
}
