import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, PlusCircle, Search, CalendarCheck, 
    BellRing, Shield, Award, ClipboardList, ArrowLeft
} from 'lucide-react';

const VoluntariosDashboard = () => {
    const navigate = useNavigate();

    const modules = [
        {
            title: 'Banco de Voluntários',
            description: 'Buscar, filtrar e gerenciar cadastros',
            icon: Search,
            color: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            path: '/voluntarios/lista'
        },
        {
            title: 'Acionamentos',
            description: 'Convocar voluntários para missões e ocorrências',
            icon: BellRing,
            color: 'text-amber-500',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            path: '/voluntarios/acionamentos'
        },
        {
            title: 'Registro de Missões',
            description: 'Histórico de atuações e horas trabalhadas',
            icon: ClipboardList,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            path: '/voluntarios/missoes'
        },
        {
            title: 'Habilidades',
            description: 'Gerenciar áreas de atuação e especialidades',
            icon: Award,
            color: 'text-purple-500',
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            path: '/voluntarios/habilidades'
        }
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Sticky Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Módulo Voluntários</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão e Acionamento</p>
                    </div>
                </div>
            </header>

            <div className="p-4 max-w-5xl mx-auto space-y-6 mt-4">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((mod, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(mod.path)}
                        className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all text-left group"
                    >
                        <div className={`p-4 rounded-2xl mb-4 ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform`}>
                            <mod.icon size={24} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white mb-2">
                            {mod.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                            {mod.description}
                        </p>
                    </button>
                ))}
            </div>

            <div className="bg-blue-600 dark:bg-blue-700 rounded-[2rem] p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative mt-8">
                <Shield size={120} className="absolute -right-10 -bottom-10 opacity-10" />
                <div className="relative z-10">
                    <h2 className="text-2xl font-black tracking-tight mb-2">Painel Rápido de Prontidão</h2>
                    <p className="text-blue-100 font-medium">Visão geral da disponibilidade da rede neste momento.</p>
                </div>
                <div className="flex gap-4 relative z-10 w-full md:w-auto">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center flex-1 md:flex-none">
                        <span className="text-3xl font-black">0</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Disponíveis</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center flex-1 md:flex-none">
                        <span className="text-3xl font-black">0</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Em Missão</span>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default VoluntariosDashboard;
