import React from 'react';
import { Search, Bell, User, MessageSquare } from 'lucide-react';

const Topbar = () => {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-transparent sticky top-0 z-50">
            <div className="flex-1 max-w-xl">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar município, ocorrência ou tipo..."
                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
                <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm relative">
                    <MessageSquare size={18} />
                </button>
                <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 transition-all shadow-sm relative">
                    <Bell size={18} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Estado do ES</p>
                        <p className="text-xs font-bold text-slate-700">Governadoria</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
