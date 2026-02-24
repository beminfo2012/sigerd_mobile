import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Download } from 'lucide-react';
import { useToast } from './ToastNotification';

const PWAUpdater = () => {
    const toast = useToast();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered:', r);
            // Periodic check for updates (every 1 hour)
            if (r) {
                setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    useEffect(() => {
        if (offlineReady) {
            toast.success('App pronto para uso offline', 'O conteúdo foi baixado e pode ser acessado sem internet.');
            setOfflineReady(false);
        }
    }, [offlineReady, setOfflineReady, toast]);

    useEffect(() => {
        if (needRefresh) {
            const toastId = toast.info(
                'Nova Versão Disponível',
                'Uma nova versão do sistema foi detectada. Clique aqui para atualizar agora.',
                {
                    autoClose: false,
                    closeOnClick: false,
                    onClick: () => {
                        updateServiceWorker(true);
                        setNeedRefresh(false);
                    }
                }
            );
        }
    }, [needRefresh, setNeedRefresh, updateServiceWorker, toast]);

    // This component doesn't render anything visible by default, 
    // but it could render a small floating button if we wanted.
    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
                onClick={() => updateServiceWorker(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
            >
                <RefreshCw size={18} className="animate-spin" />
                <span className="font-bold text-sm whitespace-nowrap">Nova Versão Disponível - Atualizar</span>
            </button>
        </div>
    );
};

export default PWAUpdater;
