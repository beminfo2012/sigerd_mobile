import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRain, ShieldAlert, ArrowLeft } from 'lucide-react';

// Lazy load the full components
const Pluviometros = lazy(() => import('../Pluviometros/index'));
const RiskDashboard = lazy(() => import('./RiskDashboard'));

export default function MonitoramentoMenu() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pluviometros'); // 'pluviometros' or 'riscos'

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
            {/* Minimal Sticky Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Monitoramento</h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Sigerd Mobile</p>
                    </div>
                </div>

                {/* Tab Switcher - estilo REDAP */}
                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mx-auto">
                    <button
                        onClick={() => setActiveTab('pluviometros')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pluviometros' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CloudRain size={13} strokeWidth={2.5} />
                        Pluviômetros
                    </button>
                    <button
                        onClick={() => setActiveTab('riscos')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'riscos' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldAlert size={13} strokeWidth={2.5} />
                        Áreas de Risco
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white dark:bg-slate-950">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Carregando Painel Especializado...</span>
                    </div>
                }>
                    <div className="animate-in fade-in duration-500">
                        {activeTab === 'pluviometros' ? (
                            <Pluviometros hideHeader={true} />
                        ) : (
                            <RiskDashboard hideHeader={true} />
                        )}
                    </div>
                </Suspense>
            </main>
        </div>
    );
}
