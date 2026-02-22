import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Search, Bell, Settings, HelpCircle, User } from 'lucide-react';

const DesktopHeader = ({ userProfile }) => {
    const location = useLocation();

    // Breadcrumb mapping
    const getBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter((x) => x);
        const labels = {
            'vistorias': 'Vistorias Técnicas',
            'ocorrencias': 'Ocorrências',
            'monitoramento': 'Monitoramento',
            'riscos': 'Áreas de Risco',
            'pluviometros': 'Pluviometros',
            'abrigos': 'Assist. Humanitária',
            'interdicao': 'Interdição',
            'georescue': 'GeoRescue',
            'settings': 'Configurações',
            'reports': 'Relatórios'
        };

        return pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const label = labels[name] || name.charAt(0).toUpperCase() + name.slice(1);

            return (
                <div key={routeTo} className="flex items-center">
                    <ChevronRight size={14} className="mx-2 text-slate-400" />
                    {isLast ? (
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-sm tracking-tight">{label}</span>
                    ) : (
                        <Link to={routeTo} className="text-slate-500 hover:text-primary transition-colors text-sm font-medium">
                            {label}
                        </Link>
                    )}
                </div>
            );
        });
    };

    return (
        <header className="hidden md:flex h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 px-6 items-center justify-between shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all">
            <div className="flex items-center">
                <Link
                    to="/"
                    className="text-slate-500 hover:text-primary transition-colors text-sm font-medium"
                >
                    Dashboard
                </Link>
                {getBreadcrumbs()}
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative hidden lg:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className="bg-slate-100 dark:bg-slate-800 border-none rounded-full pl-10 pr-4 py-1.5 text-xs w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                </div>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden lg:block" />

                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all relative">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <HelpCircle size={18} />
                    </button>
                    <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <Settings size={18} />
                    </button>
                </div>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden xl:block">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{userProfile?.full_name || 'Usuário'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{userProfile?.role || 'Agente'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary/20">
                        {userProfile?.full_name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DesktopHeader;
