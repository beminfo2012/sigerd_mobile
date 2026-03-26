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
    ClipboardList,
    BarChart3,
    Activity,
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
    RefreshCcw,
    History,
    Calendar
} from 'lucide-react';
import HumanitarianIcon from './HumanitarianIcon';
import { syncPendingData, getPendingSyncCount, clearLocalData } from '../services/db';
import ProfileModal from './ProfileModal';
import ConfirmModal from './ConfirmModal';
import { toast } from './ToastNotification';

const Sidebar = ({ userProfile, onLogout, AGENT_ROLES, HUMANITARIAN_ROLES, REDAP_ROLES, isDarkMode, setIsDarkMode, setUserProfile }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showClearCacheModal, setShowClearCacheModal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncDetail, setSyncDetail] = useState({ total: 0 });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
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

    const handleConfirmClearCache = async () => {
        await clearLocalData();
        toast.info('Cache Limpo', 'O histórico foi removido.');
        setTimeout(() => window.location.reload(), 1500);
    };

    const handleLogoutConfirm = () => {
        onLogout();
    };

    const handleLogoutClick = () => {
        if (!navigator.onLine) {
            toast.warning('Você está offline. Não é seguro sair agora sem sincronizar seus dados.');
            return;
        }
        setShowLogoutModal(true);
        setShowUserMenu(false);
    };

    const navItems = [
        {
            label: 'Dashboard',
            icon: Home,
            path: '/',
            roles: AGENT_ROLES
        },
        {
            label: 'Vistorias',
            icon: ClipboardList,
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
            label: 'Interdições',
            icon: AlertOctagon,
            path: '/interdicao',
            roles: AGENT_ROLES
        },
        {
            label: 'REDAP',
            icon: ClipboardCheck,
            path: '/redap',
            roles: REDAP_ROLES
        },
        {
            label: 'Assist. Humanitária',
            icon: HumanitarianIcon,
            path: '/abrigos',
            roles: HUMANITARIAN_ROLES
        },
        {
            label: 'Monitoramento',
            icon: BarChart3,
            path: '/monitoramento',
            roles: AGENT_ROLES
        },
        {
            label: 'GeoRescue',
            icon: Map,
            path: '/georescue',
            roles: AGENT_ROLES.filter(r => r !== 'Operador')
        },
        {
            label: 'Legado',
            icon: History,
            path: '/monitoramento/legado',
            roles: AGENT_ROLES
        },
        {
            label: 'Configurações',
            icon: Settings,
            path: '/menu',
            roles: ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Secretário', 'admin']
        }
    ];

    const filteredItems = navItems.filter(item =>
        item.roles.includes(userProfile?.role) || userProfile?.role === 'Admin'
    );
    return (
        <aside
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
            className={`hidden md:flex flex-col relative h-full shrink-0 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} border-r border-white/10 shadow-xl`}
            style={{
                background: 'var(--web-sidebar-gradient)',
                fontFamily: 'var(--web-font)'
            }}
        >


            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto space-y-1 py-6 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                <div className="space-y-1">
                    {filteredItems.map((item) => (
                        <React.Fragment key={item.path}>
                            <Link
                                to={item.path}
                                title={isCollapsed ? item.label : ''}
                                className={`flex items-center rounded-xl transition-all duration-200 group relative ${isCollapsed ? 'justify-center py-3' : 'px-4 py-3 gap-3'} ${isActive(item.path)
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} className={`${isActive(item.path) ? '' : 'group-hover:scale-110 transition-transform'} shrink-0`} />

                                {!isCollapsed && (
                                    <span className="text-sm font-semibold truncate animate-in fade-in duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </Link>

                            {/* Separador após o ícone de Dashboard */}
                            {item.label === 'Dashboard' && (
                                <div className="h-[1px] bg-white/10 my-4 mx-2" />
                            )}

                            {/* Separador abaixo do ícone de REDAP */}
                            {item.label === 'REDAP' && (
                                <div className="h-[1px] bg-white/10 my-4 mx-2" />
                            )}

                            {/* Separador separando Legado e Configurações */}
                            {item.label === 'Legado' && (
                                <div className="h-[1px] bg-white/10 my-4 mx-2" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </nav>

            {/* Footer / User Profile */}
            <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-white/10 bg-black/10 relative`} ref={userMenuRef}>
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

                            {userProfile?.role !== 'Operador' && (
                                <button onClick={handleManualSync} disabled={syncing} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-left">
                                    <div className="flex items-center gap-3">
                                        <Cloud size={18} className={syncing ? "animate-spin text-orange-500" : "text-orange-500"} />
                                        Sincronizar Dados
                                    </div>
                                    {syncDetail.total > 0 && (
                                        <span className="bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full">{syncDetail.total}</span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); setShowClearCacheModal(true); setShowUserMenu(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left"
                            >
                                <Trash2 size={18} className="text-red-400" />
                                Limpar Cache
                            </button>

                            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 rounded-xl transition-colors text-left">
                                {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-slate-400" />}
                                Alterar Tema
                            </button>

                            <div className="h-[1px] bg-slate-50 dark:bg-slate-800 my-1" />

                            <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left">
                                <LogOut size={18} />
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`w-full flex items-center rounded-xl bg-white/10 border border-white/10 shadow-sm transition-all hover:bg-white/20 p-2 ${isCollapsed ? 'justify-center' : 'gap-3 px-3'}`}
                >
                    <div className={`user-avatar ${isCollapsed ? '!w-8 !h-8' : '!w-10 !h-10'} !bg-white !text-[#10346E] !border-white/20 shrink-0 shadow-sm shadow-black/10 transition-transform active:scale-90`}>
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

            <ConfirmModal
                isOpen={showClearCacheModal}
                onClose={() => setShowClearCacheModal(false)}
                onConfirm={handleConfirmClearCache}
                title="Limpar Histórico?"
                message="Deseja limpar o cache de histórico? Isso não apaga vistorias pendentes e melhora a velocidade do app."
                confirmText="Limpar Agora"
                type="info"
            />

            <ConfirmModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutConfirm}
                title="Sair do Sistema?"
                message="Você terá que entrar novamente para acessar seus dados. Certifique-se de que seus registros foram sincronizados."
                confirmText="Sair Agora"
                cancelText="Voltar"
                type="danger"
            />
        </aside>
    );
};

export default Sidebar;
