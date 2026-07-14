import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Marketplace from './pages/Marketplace.jsx';
import MyAgents from './pages/MyAgents.jsx';
import AgentBuilder from './pages/AgentBuilder.jsx';
import Backtester from './pages/Backtester.jsx';
import ExecutionEngine from './pages/ExecutionEngine.jsx';
import SignalHub from './pages/SignalHub.jsx';
import RiskMonitor from './pages/RiskMonitor.jsx';
import CreatorEconomy from './pages/CreatorEconomy.jsx';
import APIPortal from './pages/APIPortal.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import { useAppStore } from './store/appStore.js';

function ProtectedLayout() {
  const { initWebSocket } = useAppStore();
  useEffect(() => { initWebSocket(); }, []);
  return <Layout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/my-agents"  element={<MyAgents />} />
        <Route path="/builder"    element={<AgentBuilder />} />
        <Route path="/backtester" element={<Backtester />} />
        <Route path="/execution"  element={<ExecutionEngine />} />
        <Route path="/signals"    element={<SignalHub />} />
        <Route path="/risk"       element={<RiskMonitor />} />
        <Route path="/earnings"   element={<CreatorEconomy />} />
        <Route path="/api"        element={<APIPortal />} />
      </Route>
    </Routes>
  );
}
