import React from 'react';
import { BellOff } from 'lucide-react';

const NotificationEmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <BellOff size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">Nenhuma notificação</h4>
            <p className="text-xs text-slate-400 max-w-xs">
                Você está em dia! Novos alertas e eventos operacionais aparecerão aqui automaticamente.
            </p>
        </div>
    );
};

export default NotificationEmptyState;
