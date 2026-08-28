import React, { useEffect, useRef } from 'react';
import { X, CheckCheck, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from './NotificationList';

const NotificationPanel = ({ isOpen, onClose }) => {
    const {
        notifications,
        unreadCount,
        markAllAsRead,
        syncing,
        sync,
        soundEnabled,
        toggleSound
    } = useNotifications();

    const panelRef = useRef(null);

    // ESC key close listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop / Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9990] transition-opacity animate-in fade-in duration-200"
            />

            {/* Panel Container (Mobile Bottom Sheet / Desktop Dropdown Drawer) */}
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Painel de Notificações"
                className="fixed z-[9995] bg-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col
                    /* Mobile: Bottom Sheet */
                    bottom-0 left-0 right-0 rounded-t-3xl max-h-[88vh] border-t border-slate-200
                    /* Desktop: Right Side Drawer / Modal */
                    md:bottom-auto md:top-14 md:right-6 md:left-auto md:w-[420px] md:max-h-[80vh] md:rounded-2xl md:border md:border-slate-200/80
                    animate-in slide-in-from-bottom-5 md:slide-in-from-top-3"
            >
                {/* Panel Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700/50 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
                            🔔
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black tracking-wide uppercase m-0 text-white leading-none">
                                    NOTIFICAÇÕES
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                                        {unreadCount} não lidas
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium mt-0.5 m-0">
                                Centro de Alertas Operacionais
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Manual sync button */}
                        <button
                            type="button"
                            onClick={sync}
                            disabled={syncing}
                            title="Sincronizar Notificações"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                        </button>

                        {/* Sound preference toggle */}
                        <button
                            type="button"
                            onClick={toggleSound}
                            title={soundEnabled ? 'Silenciar Sons' : 'Ativar Sons'}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {soundEnabled ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-slate-400" />}
                        </button>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            title="Fechar"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Sub-bar / Actions */}
                {unreadCount > 0 && (
                    <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <span className="text-xs text-slate-500 font-medium">
                            {unreadCount} {unreadCount === 1 ? 'notificação pendente' : 'notificações pendentes'}
                        </span>
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <CheckCheck size={14} />
                            Marcar todas como lidas
                        </button>
                    </div>
                )}

                {/* Panel Body / Notification List */}
                <div className="p-4 overflow-y-auto flex-1">
                    <NotificationList
                        notifications={notifications}
                        onClosePanel={onClose}
                    />
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
