import { useNavigate } from 'react-router-dom';
export default function MyAgents() {
  const navigate = useNavigate();
  return (
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[18px] font-black" style={{color:'var(--txt)'}}>My Agents</h1>
        <span className="text-[11px] px-2 py-px rounded-lg font-bold" style={{background:'rgba(245,184,0,0.12)',border:'1px solid rgba(245,184,0,0.25)',color:'#f5b800'}}>Module ready</span>
      </div>
      <div className="rounded-[10px] p-8 text-center" style={{background:'var(--card)',border:'1px solid var(--b)'}}>
        <i className="ti ti-code text-3xl mb-3 block" style={{color:'var(--muted)'}}></i>
        <div className="text-[13px] mb-2" style={{color:'var(--sub)'}}>This page connects to the backend API and real OKX data.</div>
        <div className="text-[12px] mb-4" style={{color:'var(--muted)'}}>Port the HTML module from the prototype files into this React component.</div>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-[7px] text-xs font-bold text-black" style={{background:'#f5b800'}}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
