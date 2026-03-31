import React from 'react';
import { Search, Bell, Mail } from 'lucide-react';

const Topbar = () => {
    return (
        <header className="top-header">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Buscar município..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-300 font-medium"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#2a5299] transition-colors">
                    <Mail size={18} />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#2a5299] transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-tight">Estado do ES</p>
                        <p className="text-[11px] font-semibold text-slate-600">Governadoria</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#2a5299] flex items-center justify-center text-white text-[10px] font-bold border-2 border-blue-200/30">CP</div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
