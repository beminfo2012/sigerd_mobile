import React from 'react';
import { Radio, AlertCircle, ChevronRight, BellRing } from 'lucide-react';

const IncidentAlertBanner = ({ incidents = [], loading = false, onClick }) => {
    // Determine status
    const activeIncidents = incidents.filter(i => i.status !== 'Finalizada');
    const hasCritical = activeIncidents.some(i => i.prioridade === 'Muito Alta');
    const count = activeIncidents.length;

    if (loading) {
        return (
            <div className="mb-6 bg-white rounded-[24px] p-4 border border-slate-100 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-1/4" />
                </div>
            </div>
        );
    }

    if (count === 0) {
        return (
            <div
                onClick={onClick}
                className="mb-6 bg-emerald-50/50 backdrop-blur-sm rounded-[24px] p-4 border border-emerald-100 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center text-emerald-600">
                        <Radio size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Estado Operacional</div>
                        <div className="text-sm font-black text-emerald-800 tracking-tight">Cenário de Normalidade</div>
                    </div>
                </div>
                <div className="text-emerald-300 group-hover:text-emerald-500 transition-colors">
                    <ChevronRight size={20} />
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`mb-6 rounded-[24px] p-4 border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden ${hasCritical
                    ? 'bg-red-50 border-red-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    : 'bg-orange-50 border-orange-100 shadow-[0_4px_20px_rgba(245,158,11,0.05)]'
                }`}
        >
            {/* Pulsing indicator */}
            <div className={`absolute top-0 left-0 w-1 h-full ${hasCritical ? 'bg-red-500' : 'bg-orange-500'} animate-pulse`} />

            <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${hasCritical ? 'bg-red-500 text-white animate-bounce' : 'bg-orange-500 text-white'
                    }`}>
                    {hasCritical ? <BellRing size={24} strokeWidth={2.5} /> : <AlertCircle size={24} strokeWidth={2.5} />}
                </div>
                <div>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 ${hasCritical ? 'text-red-600' : 'text-orange-600'}`}>
                        {count} {count === 1 ? 'Ocorrência Ativa' : 'Ocorrências Ativas'}
                    </div>
                    <div className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                        {activeIncidents[0].tipo} em {activeIncidents[0].bairro || 'Santa Maria'}
                    </div>
                    {count > 1 && (
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                            + {count - 1} outros chamados aguardando
                        </div>
                    )}
                </div>
            </div>

            <div className={`${hasCritical ? 'text-red-300' : 'text-orange-300'} group-hover:translate-x-1 transition-transform`}>
                <ChevronRight size={24} />
            </div>
        </div>
    );
};

export default IncidentAlertBanner;
