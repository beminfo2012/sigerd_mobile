import React from 'react';
import {
    LayoutDashboard, Map, ShieldAlert, BarChart3, Menu,
    ChevronRight, LogOut, Shield
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'painel', label: 'Painel Geral', icon: LayoutDashboard },
        { id: 'ocorrencias', label: 'Ocorrências em Tempo Real', icon: Map },
        { id: 'solicitacoes', label: 'Solicitações de Apoio', icon: ShieldAlert },
        { id: 'indicadores', label: 'Indicadores Estratégicos', icon: BarChart3 },
        { id: 'menu', label: 'Menu', icon: Menu },
    ];

    return (
        <>
            {/* Logo Area */}
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
                    <Shield size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-[15px] font-extrabold tracking-tight text-white leading-none">SIGERD</h1>
                    <p className="text-[9px] font-semibold text-blue-200/70 uppercase tracking-widest">Conecta Estadual</p>
                </div>
            </div>

            {/* DEFESA CIVIL Badge */}
            <div className="mx-4 my-3 px-3 py-2.5 rounded-xl bg-gradient-to-br from-[#2a5299] to-[#3b82f6] text-center border border-white/10">
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100/70">Defesa Civil</p>
                <p className="text-sm font-extrabold text-white leading-tight">ESTADUAL</p>
            </div>

            {/* Section Label */}
            <p className="px-6 mt-5 mb-2 text-[9px] font-bold uppercase tracking-widest text-blue-200/40">DEFESA CIVIL</p>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5">
                {navItems.map((item) => {
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer border-none
                ${active
                                    ? 'bg-white/15 text-white font-semibold'
                                    : 'text-blue-100/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={17} strokeWidth={active ? 2.2 : 1.6} />
                            <span className="flex-1 text-left">{item.label}</span>
                            {active && <ChevronRight size={13} className="opacity-40" />}
                        </button>
                    );
                })}
            </nav>

            {/* User Card */}
            <div className="p-4 mt-auto">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-400 overflow-hidden border-2 border-white/20">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=b6e3f4"
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1e3c72]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate leading-tight">Carlos M.</p>
                        <p className="text-[9px] text-blue-200/50 font-medium truncate">Coordenador Estadual</p>
                    </div>
                </div>
                <button className="w-full mt-2 flex items-center justify-center gap-1.5 text-[9px] font-bold text-red-300/40 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer py-1.5">
                    <LogOut size={12} /> Sair do Sistema
                </button>
            </div>
        </>
    );
};

export default Sidebar;
