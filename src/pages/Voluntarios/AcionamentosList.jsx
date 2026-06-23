import React from 'react';
import { ArrowLeft, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AcionamentosList = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 transition-colors">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/voluntarios')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Painel de Acionamentos</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Em Desenvolvimento</p>
                    </div>
                </div>
            </header>
            <main className="p-4 max-w-5xl mx-auto mt-10">
                <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 border border-slate-200 dark:border-slate-800">
                    <BellRing size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Módulo em Desenvolvimento</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                        O painel de Acionamentos e Convocações está sendo construído (Submódulo 4). Em breve você poderá disparar alertas para os voluntários.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AcionamentosList;
