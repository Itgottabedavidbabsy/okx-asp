import { NavLink } from 'react-router-dom';

const NAV = [
  { section: 'Platform', items: [
    { to:'/dashboard',   icon:'ti-layout-dashboard', label:'Dashboard' },
    { to:'/marketplace', icon:'ti-apps',             label:'Marketplace',   badge:'6',   badgeColor:'#00c087' },
    { to:'/my-agents',   icon:'ti-robot',            label:'My Agents',     badge:'3',   badgeColor:'#1677ff' },
    { to:'/builder',     icon:'ti-wand',             label:'Build Agent' },
  ]},
  { section: 'Intelligence', items: [
    { to:'/signals',    icon:'ti-radar',          label:'Signal Hub',   badge:'Live', badgeColor:'#f5b800' },
    { to:'/backtester', icon:'ti-chart-histogram', label:'Backtester' },
    { to:'/execution',  icon:'ti-bolt',           label:'Execution Engine' },
    { to:'/risk',       icon:'ti-shield-half',    label:'Risk Monitor' },
  ]},
  { section: 'Revenue', items: [
    { to:'/earnings', icon:'ti-coin', label:'Creator Earnings' },
    { to:'/api',      icon:'ti-api',  label:'API Access' },
  ]},
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-[140] lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-[150] w-[218px] flex flex-col border-r transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surf)', borderColor: 'var(--b)' }}
      >
        <div className="flex-1 overflow-y-auto p-2">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="px-3 pt-3 pb-1 text-[9.5px] font-bold uppercase tracking-wider" style={{ color:'var(--muted)' }}>{section}</div>
              {items.map(({ to, icon, label, badge, badgeColor }) => (
                <NavLink
                  key={to} to={to} onClick={() => window.innerWidth < 1024 && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 my-px rounded-[7px] text-[12.5px] font-semibold transition-all ${
                      isActive ? 'text-[#1677ff] bg-[rgba(22,119,255,0.12)] border border-[rgba(22,119,255,0.2)]'
                              : 'text-[#6677a0] hover:bg-white/5 hover:text-[#dce6f5]'
                    } border border-transparent`
                  }
                >
                  <i className={`ti ${icon} text-base w-4 text-center flex-shrink-0`} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-bold px-1.5 py-px rounded-lg text-black" style={{ background: badgeColor }}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
        <div className="p-2.5 border-t" style={{ borderColor:'var(--b)' }}>
          <div className="rounded-[7px] p-3 text-xs" style={{ background:'rgba(22,119,255,0.12)', border:'1px solid rgba(22,119,255,0.22)' }}>
            <div className="font-bold text-[#1677ff] mb-1">PRO TIER ACTIVE</div>
            <div style={{ color:'var(--sub)' }}>Unlimited agents · All signal sources</div>
          </div>
        </div>
      </aside>
    </>
  );
}
