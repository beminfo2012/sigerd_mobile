import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Settings, HelpCircle, User } from 'lucide-react';

const DesktopHeader = ({ userProfile }) => {
    const location = useLocation();


    return (
        <header
            className="hidden md:flex h-20 sticky top-0 z-40 px-6 items-center justify-between shadow-lg transition-all"
            style={{
                background: 'var(--web-header-gradient)',
                color: '#fff',
                fontFamily: 'var(--web-font)'
            }}
        >
            <div className="flex items-center gap-4">
                <div className="h-4 w-4" /> {/* Spacer instead of logo */}

                <div className="h-8 w-[1px] bg-white/10 mx-6" />

                <div className="flex items-center text-white/80 text-sm font-bold">
                    <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
                    {location.pathname !== '/' && (
                        <div className="flex items-center">
                            <ChevronRight size={14} className="mx-2 opacity-40" />
                            <span className="text-white">
                                {{
                                    'vistorias': 'Vistorias',
                                    'ocorrencias': 'Ocorrências',
                                    'monitoramento': 'Monitoramento',
                                    'abrigos': 'Assistência Humanitária',
                                    'redap': 'REDAP',
                                    'alerts': 'Avisos INMET',
                                    'menu': 'Relatórios'
                                }[location.pathname.split('/').filter(x => x).pop()] || location.pathname.split('/').filter(x => x).pop().charAt(0).toUpperCase() + location.pathname.split('/').filter(x => x).pop().slice(1)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-6">

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-black text-white leading-none uppercase tracking-tight">{userProfile?.full_name || 'Operador'}</p>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1.5">{userProfile?.role || 'Fiscal'}</p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white font-black text-lg shadow-xl backdrop-blur-md">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DesktopHeader;
