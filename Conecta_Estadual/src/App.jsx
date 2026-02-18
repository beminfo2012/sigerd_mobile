import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Occurrences from './pages/Occurrences';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('painel');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <Topbar />

        {/* Dynamic Page Rendering */}
        <div className="page-wrapper animate-fade-in">
          {activeTab === 'painel' && <Dashboard />}
          {activeTab === 'ocorrencias' && <Occurrences />}
          {activeTab === 'solicitacoes' && (
            <div className="p-10 text-center">
              <h2 className="text-2xl font-black text-slate-300 uppercase">Solicitações de Apoio</h2>
              <p className="text-slate-400">Em desenvolvimento...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
