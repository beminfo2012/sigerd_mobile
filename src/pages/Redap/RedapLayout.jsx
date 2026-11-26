import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Shield, Calendar, Layers, BarChart3, ArrowLeft, LogOut, User
} from 'lucide-react';
import { UserContext } from '../../App';
import { isDefesaCivilRole } from '../../services/redapV3Service';
import { SECRETARIA_CATALOG } from '../../utils/redapModelsConfig';
import { getMainSigerdUrl } from '../../utils/redapDomain';

const RedapLayout = ({ children, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useContext(UserContext);
    const isDC = isDefesaCivilRole(user?.role);

    const secInfo = SECRETARIA_CATALOG.find(s => s.key === user?.role);
    const roleLabel = isDC
        ? 'Defesa Civil — Gestor REDAP'
        : (secInfo?.nome || user?.role || 'Secretaria Setorial');

    const navItems = [
        { label: 'Eventos', path: '/redap', icon: Calendar, show: true },
        { label: 'Modelos', path: '/redap/modelos', icon: Layers, show: isDC },
        { label: 'Indicadores', path: '/redap/indicadores', icon: BarChart3, show: isDC },
    ].filter(i => i.show);

    const isActive = (path) => {
        if (path === '/redap') {
            return (
                location.pathname === '/redap' ||
                location.pathname === '/' ||
                location.pathname.startsWith('/redap/evento') ||
                location.pathname.startsWith('/redap/relatorios')
            );
        }
        return location.pathname.startsWith(path);
    };

    const handleBackToSigerd = () => {
        const target = getMainSigerdUrl('/');
        if (target.startsWith('http://') || target.startsWith('https://')) {
            window.location.href = target;
        } else {
            navigate(target);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
            {/* Top Portal Bar — Standalone REDAP (sem Sidebar do SIGERD principal) */}
            <header className="sticky top-0 z-40 bg-[#0B1F3A] text-white border-b border-white/10 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand */}
                    <div
                        onClick={() => navigate('/redap')}
                        className="flex items-center gap-3 cursor-pointer shrink-0"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
                            <img
                                src="/logo_defesa_civil.png"
                                alt="Defesa Civil"
                                className="w-8 h-8 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>
                        <div className="leading-tight">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm sm:text-base tracking-wide uppercase">
                                    SIGERD • REDAP
                                </span>
                                <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-200 border border-blue-400/30">
                                    Portal Setorial
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-semibold hidden sm:block">
                                Coleta Integrada de Danos e Prejuízos — Santa Maria de Jetibá/ES
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Icon size={15} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-200 flex items-center justify-center">
                                <User size={14} />
                            </div>
                            <div className="leading-tight max-w-[190px]">
                                <div className="text-xs font-bold truncate">{user?.full_name || 'Usuário'}</div>
                                <div className="text-[10px] text-blue-200/80 font-semibold truncate">{roleLabel}</div>
                            </div>
                        </div>

                        {isDC && (
                            <button
                                onClick={handleBackToSigerd}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors"
                                title="Retornar ao SIGERD Principal"
                            >
                                <ArrowLeft size={14} />
                                <span className="hidden sm:inline">SIGERD</span>
                            </button>
                        )}

                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/80 text-slate-300 hover:text-white transition-colors"
                                title="Sair do sistema"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Nav Bar */}
                {navItems.length > 1 && (
                    <div className="md:hidden border-t border-white/10 px-4 py-2 flex gap-2 overflow-x-auto">
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                                        active
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 bg-white/5'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {children}
            </main>

            {/* Subtle Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-[11px] text-slate-400 font-medium">
                COMPDEC • Santa Maria de Jetibá/ES — Módulo REDAP (Coleta Setorial Integrada)
            </footer>
        </div>
    );
};

export default RedapLayout;
