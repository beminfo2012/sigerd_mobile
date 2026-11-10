import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Map } from 'lucide-react';
import GeoRescueTab from '../Configuracoes/GeoRescueTab';

const GeoRescueAdminPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Header Standalone */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <Zap size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">
                                GeoRescue - Base de Dados
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Gestão de UCs & Rede Elétrica
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/georescue')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                        <Map size={14} className="text-indigo-500" />
                        <span className="hidden sm:inline">Abrir Mapa</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">
                <GeoRescueTab />
            </main>
        </div>
    );
};

export default GeoRescueAdminPage;

