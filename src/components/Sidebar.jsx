import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Map,
    FileText,
    AlertOctagon,
    AlertTriangle,
    Menu as MenuIcon,
    Shield,
    Users,
    ClipboardCheck,
    BarChart3,
    Package,
    Navigation,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    Cloud,
    Trash2,
    Sun,
    Moon,
    Settings,
    CheckCircle,
    RefreshCcw
} from 'lucide-react';
import { syncPendingData, getPendingSyncCount, clearLocalData } from '../services/db';
import ProfileModal from './ProfileModal';

const Sidebar = ({ userProfile, onLogout, AGENT_ROLES, HUMANITARIAN_ROLES, REDAP_ROLES, isDarkMode, setIsDarkMode, setUserProfile }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncDetail, setSyncDetail] = useState({ total: 0 });
    const userMenuRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        loadPendingCount();
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadPendingCount = async () => {
        const detail = await getPendingSyncCount();
        setSyncDetail(detail);
    };

    const handleManualSync = async (e) => {
        e.stopPropagation();
        if (syncDetail.total === 0 || syncing) return;
        if (!navigator.onLine) {
            alert('Você precisa estar online para sincronizar dados.');
            return;
        }

        setSyncing(true);
        try {
            const result = await syncPendingData();
            if (result.success) {
                await loadPendingCount();
                alert(`${result.count} registros sincronizados com sucesso!`);
                window.dispatchEvent(new CustomEvent('sync-complete'));
            }
        } catch (e) {
            console.error('Sync failed:', e);
            alert('Erro na sincronização.');
        } finally {
            setSyncing(false);
            setShowUserMenu(false);
        }
    };

    const handleClearCache = (e) => {
        e.stopPropagation();
        if (window.confirm('Deseja limpar o cache de histórico? Isso não apaga vistorias pendentes.')) {
            clearLocalData().then(() => {
                alert('Cache limpo!');
                window.location.reload();
            });
        }
    };

    const navItems = [
        {
            label: 'Início',
            icon: Home,
            path: '/',
            roles: AGENT_ROLES
        },
        {
            label: 'GeoRescue',
            icon: Map,
            path: '/georescue',
            roles: AGENT_ROLES
        },
        {
            label: 'Vistorias',
            icon: FileText,
            path: '/vistorias',
            roles: AGENT_ROLES
        },
        {
            label: 'Ocorrências',
            icon: AlertTriangle,
            path: '/ocorrencias',
            roles: AGENT_ROLES
        },
        {
            label: 'Interdição',
            icon: AlertOctagon,
            path: '/interdicao',
            roles: AGENT_ROLES
        },
        {
            label: 'Monitoramento',
            icon: BarChart3,
            path: '/monitoramento',
            roles: AGENT_ROLES
        },
        {
            label: 'Assist. Humanitária',
            icon: Shield,
            path: '/abrigos',
            roles: HUMANITARIAN_ROLES
        },
        {
            label: 'REDAP',
            icon: Navigation,
            path: '/redap',
            roles: REDAP_ROLES
        },
        {
            label: 'Configurações',
            icon: MenuIcon,
            path: '/menu',
            roles: ['Admin', 'Coordenador', 'Agente de Defesa Civil']
        }
    ];

    const filteredItems = navItems.filter(item =>
        item.roles.includes(userProfile?.role) || userProfile?.role === 'Admin'
    );

    return (
        <aside
            className={`hidden md:flex flex-col h-screen shrink-0 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'} border-r border-white/10`}
            style={{ backgroundColor: '#10346E' }}
        >
            {/* Header / Logo */}
            <div className={`p-4 h-20 flex items-center border-b border-white/10 bg-white/5 relative ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Link
                    to="/"
                    className="flex items-center gap-3 active:scale-95 transition-transform"
                    onAuxClick={(e) => { if (e.button === 1) window.open('/', '_blank') }}
                >
                    <img src="/logo_header.png" alt="Logo" className="h-10 w-auto object-contain shrink-0 brightness-0 invert" onError={(e) => e.target.style.display = 'none'} />
                    {!isCollapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h2 className="text-sm font-bold text-white m-0 leading-none tracking-tight">SIGERD</h2>
                            <span className="text-[10px] text-white/60 uppercase tracking-widest font-semibold">Defesa Civil</span>
                        </div>
                    )}
                </Link>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-[#10346E] shadow-sm hover:bg-white/90 transition-all z-10"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto space-y-1 py-6 ${isCollapsed ? 'px-2' : 'p-4'}`}>
                {!isCollapsed && (
                    <p className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4 animate-in fade-in duration-500">
                        Navegação Principal
                    </p>
                )}
                <div className="space-y-1">
                    {filteredItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.label : ''}
                            className={`flex items-center rounded-lg transition-all duration-200 group relative ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} ${isActive(item.path)
                                ? 'bg-white text-[#10346E] shadow-lg shadow-black/10'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={`${isActive(item.path) ? '' : 'group-hover:scale-110 transition-transform'} shrink-0`} />
                            {!isCollapsed && (
                                <span className="text-sm font-semibold truncate animate-in fade-in slide-in-from-left-2 duration-300">
                                    {item.label}
                                </span>
                            )}
                            {isCollapsed && isActive(item.path) && (
                                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                            )}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className={`p-4 border-t border-white/10 bg-black/10 relative`} ref={userMenuRef}>
                {/* User Dropdown Menu */}
                {showUserMenu && (
                    <div className={`absolute bottom-20 left-4 ${isCollapsed ? 'w-64' : 'w-[calc(100%-32px)]'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[60] animate-in slide-in-from-bottom-2 duration-200`}>
                        <div className="p-3 border-b border-slate-50 dark:border-slate-800 mb-1">
                            <p className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">{userProfile?.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{userProfile?.role}</p>
                        </div>

                        <div className="space-y-0.5">
                            <button onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left">
                                <User size={18} className="text-blue-500" />
                                Editar Perfil
                            </button>

                            <button onClick={handleManualSync} disabled={syncing} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-left">
                                <div className="flex items-center gap-3">
                                    <Cloud size={18} className={syncing ? "animate-spin text-orange-500" : "text-orange-500"} />
                                    Sincronizar Dados
                                </div>
                                {syncDetail.total > 0 && (
                                    <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full">{syncDetail.total}</span>
                                )}
                            </button>

                            <button onClick={handleClearCache} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left">
                                <Trash2 size={18} className="text-red-400" />
                                Limpar Cache
                            </button>

                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 rounded-xl transition-colors text-left">
                                {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-400" />}
                                Alterar Tema
                            </button>

                            <div className="h-[1px] bg-slate-50 dark:bg-slate-800 my-1" />

                            <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left">
                                <LogOut size={18} />
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-full flex items-center rounded-xl bg-white/10 border border-white/10 shadow-sm transition-all hover:bg-white/20 p-2 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
                >
                    <div className="user-avatar !w-10 !h-10 !bg-white !text-[#10346E] !border-white/20 shrink-0 shadow-sm shadow-black/10 transition-transform active:scale-90">
                        {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-bold truncate text-white leading-none">{userProfile?.full_name || 'Usuário'}</p>
                            <p className="text-[10px] text-white/50 truncate uppercase font-semibold mt-1">Ver Opções</p>
                        </div>
                    )}
                </button>
            </div>

            {showProfileModal && (
                <ProfileModal
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    onClose={() => setShowProfileModal(false)}
                />
            )}
        </aside>
    );
};

export default Sidebar;
