import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Settings, HelpCircle, User } from 'lucide-react';

const DesktopHeader = ({ userProfile }) => {
    const location = useLocation();


    return (
        <header
            className="hidden md:flex h-10 shrink-0 z-40 px-6 items-center justify-between shadow-lg transition-all"
            style={{
                background: 'var(--web-header-gradient)',
                color: '#fff',
                fontFamily: 'var(--web-font)'
            }}
        >
            <div className="flex items-center gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-3 active:scale-95 transition-transform"
                    onAuxClick={(e) => { if (e.button === 1) window.open('/', '_blank') }}
                >
                    <img src="/logo_header.png" alt="Logo" className="h-6 w-auto object-contain shrink-0 brightness-0 invert" onError={(e) => e.target.style.display = 'none'} />
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300 border-l border-white/20 pl-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-white m-0 leading-none tracking-tight">SIGERD</h2>
                            <span className="text-[8px] text-white/70 uppercase tracking-[2px] font-bold">Defesa Civil</span>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-black text-white leading-none uppercase tracking-tight">{userProfile?.full_name || 'Operador'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm shadow-lg backdrop-blur-md">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DesktopHeader;
