export default function MetricCard({ label, value, sub, accentColor = 'var(--gold)', onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-[10px] p-3.5 cursor-pointer transition-all hover:-translate-y-px"
      style={{ background:'var(--card)', border:`1px solid var(--b)`, borderBottom:`2px solid ${accentColor}` }}
    >
      <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] mb-1.5" style={{ color:'var(--muted)' }}>{label}</div>
      <div className="text-[22px] font-black leading-none mb-1" style={{ color: accentColor }}>{value}</div>
      <div className="text-[10.5px] font-semibold" style={{ color:'var(--sub)' }}>{sub}</div>
    </div>
  );
}
