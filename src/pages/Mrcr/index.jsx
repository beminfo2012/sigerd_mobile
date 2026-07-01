import React from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MrcrTab from '../Configuracoes/MrcrTab';

export default function MrcrPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                            <Calculator size={18} className="text-blue-500" /> Módulo MRCR
                        </h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Módulo de Referências de Custo</p>
                    </div>
                </div>
            </header>
            <div className="p-4 max-w-7xl mx-auto">
                <MrcrTab />
            </div>
        </div>
    );
}
