import React from 'react';
import {
    LayoutDashboard,
    Search,
    Map as MapIcon,
    ShieldAlert,
    BarChart3,
    Menu as MenuIcon,
    LogOut,
    Bell
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'painel', label: 'Painel Geral', icon: LayoutDashboard },
        { id: 'ocorrencias', label: 'Ocorrências em Tempo Real', icon: MapIcon },
        { id: 'solicitacoes', label: 'Solicitações de Apoio', icon: ShieldAlert },
        { id: 'indicadores', label: 'Indicadores Estratégicos', icon: BarChart3 },
        { id: 'menu', label: 'Menu', icon: MenuIcon },
    ];

    return (
        <aside className="sidebar">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <ShieldAlert className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-lg font-black tracking-tighter leading-none">SIGERD</h1>
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70">Conecta Estadual</p>
                </div>
            </div>

            <nav className="flex-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`sidebar-link w-full border-none cursor-pointer bg-transparent ${activeTab === item.id ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-9 h-9 bg-white/20 rounded-full border border-white/30 overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" alt="Avatar" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">Carlos M.</p>
                        <p className="text-[9px] text-blue-300 font-black uppercase tracking-tighter">Coordenador Estadual</p>
                    </div>
                </div>

                <button className="sidebar-link w-full border-none cursor-pointer bg-transparent text-red-300 hover:text-red-100">
                    <LogOut size={18} />
                    <span>Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
