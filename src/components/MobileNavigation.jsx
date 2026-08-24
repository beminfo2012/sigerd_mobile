import React from 'react';
import { Link } from 'react-router-dom';

export default function MobileNavigation({ activeTab, setActiveTab }) {
    return (
        <nav className="md:hidden shrink-0 bg-white flex items-start justify-around pt-[11px] px-[6px] pb-[4px] shadow-[0_-2px_14px_rgba(15,30,70,0.06)] relative z-50">
            <Link 
                to="/" 
                className={`flex flex-col items-center gap-[5px] w-[64px] ${activeTab === 'dashboard' ? 'text-blue-mobile' : 'text-[#9aa2b6]'}`} 
                onClick={() => setActiveTab('dashboard')}
            >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[22px] h-[22px] ${activeTab === 'dashboard' ? 'stroke-blue-mobile' : 'stroke-[#9aa2b6]'}`}>
                    <path d="m3 11 9-7 9 7"/>
                    <path d="M5 10v10h14V10"/>
                </svg>
                <span className="text-[9.5px] font-bold tracking-[0.2px]">Início</span>
            </Link>

            <Link 
                to="/georescue" 
                className={`flex flex-col items-center gap-[5px] w-[64px] ${activeTab === 'georescue' ? 'text-blue-mobile' : 'text-[#9aa2b6]'}`} 
                onClick={() => setActiveTab('georescue')}
            >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[22px] h-[22px] ${activeTab === 'georescue' ? 'stroke-blue-mobile' : 'stroke-[#9aa2b6]'}`}>
                    <path d="M9 4 3 6v15l6-2 6 2 6-2V4l-6 2-6-2z"/>
                    <path d="M9 4v15M15 6v15"/>
                </svg>
                <span className="text-[9.5px] font-bold tracking-[0.2px]">Georescue</span>
            </Link>

            <div className="flex flex-col items-center gap-[5px] -mt-[30px] w-[64px]">
                <Link 
                    to="/vistorias" 
                    className="w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#3f6ae8] to-[#2f5fdb] flex items-center justify-center shadow-[0_10px_22px_-6px_rgba(47,95,219,0.55),0_0_0_6px_#f2f4f9]" 
                    onClick={() => setActiveTab('vistorias')}
                >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[25px] h-[25px] stroke-white">
                        <rect x="6" y="3" width="12" height="18" rx="2"/>
                        <path d="M9 3V2h6v1M9 11l2 2 4-4"/>
                    </svg>
                </Link>
                <span className="text-[9.5px] font-bold tracking-[0.2px] text-blue-mobile">Vistoria</span>
            </div>

            <Link 
                to="/interdicao" 
                className={`flex flex-col items-center gap-[5px] w-[64px] ${activeTab === 'interdicao' ? 'text-blue-mobile' : 'text-[#9aa2b6]'}`} 
                onClick={() => setActiveTab('interdicao')}
            >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[22px] h-[22px] ${activeTab === 'interdicao' ? 'stroke-blue-mobile' : 'stroke-[#9aa2b6]'}`}>
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
                    <path d="M12 9v4M12 17h.01"/>
                </svg>
                <span className="text-[9.5px] font-bold tracking-[0.2px]">Interdição</span>
            </Link>

            <Link 
                to="/menu" 
                className={`flex flex-col items-center gap-[5px] w-[64px] ${activeTab === 'menu' ? 'text-blue-mobile' : 'text-[#9aa2b6]'}`} 
                onClick={() => setActiveTab('menu')}
            >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[22px] h-[22px] ${activeTab === 'menu' ? 'stroke-blue-mobile' : 'stroke-[#9aa2b6]'}`}>
                    <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
                <span className="text-[9.5px] font-bold tracking-[0.2px]">Menu</span>
            </Link>
        </nav>
    );
}
