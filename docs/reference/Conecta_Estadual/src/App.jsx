import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Occurrences from './pages/Occurrences';
import SupportRequests from './pages/SupportRequests';
import StrategicIndicators from './pages/StrategicIndicators';
import Login from './pages/Login';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('painel');

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      <div className="main-area">
        <Topbar />
        <main className="page-content">
          {activeTab === 'painel' && <Dashboard />}
          {activeTab === 'ocorrencias' && <Occurrences />}
          {activeTab === 'solicitacoes' && <SupportRequests />}
          {activeTab === 'indicadores' && <StrategicIndicators />}
          {(activeTab === 'menu') && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-300 mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Configurações</h2>
              <p className="text-sm text-slate-400">Em desenvolvimento.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
