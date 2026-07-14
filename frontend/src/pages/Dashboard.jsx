import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { api } from '../api/client.js';
import MetricCard from '../components/ui/MetricCard.jsx';

export default function Dashboard() {
  const { agents, deployments, setAgents, setDeployments, activity, addToast } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.agents.list().then((r) => setAgents(r.data || [])).catch(() => {});
    api.agents.my().then((r) => setDeployments(r.data || [])).catch(() => {});
  }, []);

  const LB = [
    { rank:'1', col:'#f5b800', name:'Grid Alpha Pro',     sub:'1,240 subs', roi:'+18.4%', roiCol:'#00c087' },
    { rank:'2', col:'#9ca3af', name:'Arb Hunter v2',      sub:'820 subs',   roi:'+15.2%', roiCol:'#00c087' },
    { rank:'3', col:'#cd7c2f', name:'Yield Optimizer',    sub:'634 subs',   roi:'34.7% APY', roiCol:'#00c087' },
    { rank:'4', col:'var(--muted)', name:'Sentiment Trader', sub:'291 subs', roi:'+11.8%', roiCol:'#00c087' },
    { rank:'5', col:'var(--muted)', name:'Whale Tracker', sub:'472 subs',   roi:'+9.4%',  roiCol:'#f5b800' },
  ];

  return (
    <div className="p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[18px] font-black mb-1" style={{ color:'var(--txt)' }}>Command Center</h1>
          <p className="text-[13px]" style={{ color:'var(--sub)' }}>
            Live overview — {agents.length || 6} agents available · {deployments.length || 3} deployed
          </p>
        </div>
        <button
          onClick={() => { navigate('/marketplace'); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[7px] text-[12px] font-bold text-black"
          style={{ background:'#f5b800' }}
        >
          <i className="ti ti-plus text-sm" /> Deploy Agent
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        <MetricCard label="Total AUM"       value="$4.72M"  sub="+12.4% this month"  accentColor="#00c087" onClick={() => navigate('/execution')} />
        <MetricCard label="Agent P&L (30D)" value="+$84,210" sub="+1.87% vs benchmark" accentColor="#f5b800" onClick={() => navigate('/backtester')} />
        <MetricCard label="Subscribers"     value="2,847"   sub="+318 this week"     accentColor="#1677ff" onClick={() => navigate('/earnings')} />
        <MetricCard label="Creator Revenue" value="$12,480" sub="+$2,340 this month" accentColor="#06b6d4" onClick={() => navigate('/earnings')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-[10px] p-3.5" style={{ background:'var(--card)', border:'1px solid var(--b)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] font-bold" style={{ color:'var(--txt)' }}>Live Activity Feed</span>
            <span className="text-[9.5px] font-bold px-2 py-px rounded-lg" style={{ background:'rgba(245,71,91,0.12)', color:'#f5475b', border:'1px solid rgba(245,71,91,0.25)' }}>Live</span>
          </div>
          {activity.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-1.5 border-b last:border-none" style={{ borderColor:'var(--b)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: a.color }} />
              <div className="flex-1 text-[11.5px] leading-snug" style={{ color:'var(--sub)' }} dangerouslySetInnerHTML={{ __html: a.text }} />
              <span className="text-[10px] flex-shrink-0" style={{ color:'var(--muted)' }}>{a.time}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[10px] p-3.5" style={{ background:'var(--card)', border:'1px solid var(--b)' }}>
          <div className="text-[12.5px] font-bold mb-3" style={{ color:'var(--txt)' }}>Top Agent Leaderboard</div>
          {LB.map((r) => (
            <div key={r.rank} className="flex items-center gap-2.5 py-1.5 border-b last:border-none" style={{ borderColor:'var(--b)' }}>
              <span className="text-[11.5px] font-bold w-4" style={{ color: r.col }}>{r.rank}</span>
              <div className="flex-1">
                <div className="text-[12px] font-bold" style={{ color:'var(--txt)' }}>{r.name}</div>
                <div className="text-[10px]" style={{ color:'var(--muted)' }}>{r.sub}</div>
              </div>
              <span className="text-[13px] font-black" style={{ color: r.roiCol }}>{r.roi}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
