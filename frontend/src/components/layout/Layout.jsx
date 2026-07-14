import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopNav from './TopNav.jsx';
import { useAppStore } from '../../store/appStore.js';

function Toast({ id, type, msg }) {
  const colors = {
    success: { bg:'rgba(0,192,135,0.12)',  border:'rgba(0,192,135,0.3)',  text:'#00c087' },
    info:    { bg:'rgba(22,119,255,0.12)', border:'rgba(22,119,255,0.3)', text:'#1677ff' },
    warn:    { bg:'rgba(245,184,0,0.12)',  border:'rgba(245,184,0,0.3)',  text:'#f5b800' },
    error:   { bg:'rgba(245,71,91,0.12)', border:'rgba(245,71,91,0.3)',  text:'#f5475b' },
  }[type] || {};
  return (
    <div className="px-4 py-3 rounded-[7px] text-[12.5px] font-semibold pointer-events-none"
      style={{ background:colors.bg, border:`1px solid ${colors.border}`, color:colors.text }}>
      {msg}
    </div>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toasts = useAppStore((s) => s.toasts);
  return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>
      <TopNav onMenuToggle={() => setSidebarOpen((o) => !o)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-[218px] pt-14 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
      <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => <Toast key={t.id} {...t} />)}
      </div>
    </div>
  );
}
