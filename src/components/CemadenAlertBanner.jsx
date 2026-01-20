import React from 'react';
import { AlertTriangle, ChevronRight, Bell } from 'lucide-react';

const CemadenAlertBanner = ({ alerts }) => {
    if (!alerts || alerts.length === 0) return null;

    // Get the most severe alert
    const mainAlert = alerts[0];

    // Logic for colors based on CEMADEN threat level
    // Levels: 1 (Moderate/Yellow), 2 (High/Orange), 3 (Very High/Red), 4 (Extreme/Black-Purple)
    const level = mainAlert.nivel || 1;

    const config = {
        1: {
            bg: 'bg-amber-400/90',
            border: 'border-amber-300',
            text: 'text-amber-950',
            label: 'Risco Moderado',
            iconColor: 'text-amber-900'
        },
        2: {
            bg: 'bg-orange-500/90',
            border: 'border-orange-400',
            text: 'text-white',
            label: 'Risco Alto',
            iconColor: 'text-white'
        },
        3: {
            bg: 'bg-red-600/90',
            border: 'border-red-500',
            text: 'text-white',
            label: 'Risco Muito Alto',
            iconColor: 'text-white'
        },
        4: {
            bg: 'bg-slate-900/95',
            border: 'border-slate-800',
            text: 'text-purple-400',
            label: 'Risco Extremo',
            iconColor: 'text-purple-400'
        }
    }[level] || {
        bg: 'bg-blue-600/90',
        border: 'border-blue-500',
        text: 'text-white',
        label: 'Aviso Cemaden',
        iconColor: 'text-white'
    };

    return (
        <div className={`mb-6 p-4 rounded-[28px] ${config.bg} backdrop-blur-md border ${config.border} shadow-lg animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 bg-white/20 rounded-2xl ${config.iconColor}`}>
                    <AlertTriangle size={24} strokeWidth={2.5} />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.text} opacity-80`}>
                            Alerta Cemaden
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.iconColor} animate-pulse`} />
                    </div>

                    <h3 className={`text-base font-black ${config.text} leading-tight mt-0.5 uppercase tracking-tight`}>
                        {mainAlert.descricao || `${config.label} de Deslizamento`}
                    </h3>

                    <p className={`text-[11px] font-bold ${config.text} opacity-90 mt-1`}>
                        Localização: Santa Maria de Jetibá - ES
                    </p>
                </div>

                <div className={`p-2 bg-white/10 rounded-full ${config.text}`}>
                    <ChevronRight size={20} />
                </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bell size={12} className={config.text} />
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${config.text}`}>Notificação Ativa</span>
                </div>
                <button className={`text-[10px] font-black uppercase bg-white/20 px-3 py-1 rounded-lg ${config.text}`}>
                    Ver Mapas
                </button>
            </div>
        </div>
    );
};

export default CemadenAlertBanner;
