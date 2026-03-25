import React from 'react';
import { X, CheckCircle, Clock, Shield, ChevronRight } from 'lucide-react';
import { REDAP_SECTORS } from '../../../services/redapService';

const SectorProgressModal = ({ isOpen, onClose, registrations = [] }) => {
    if (!isOpen) return null;

    // Map of sectors with their registration counts
    const sectorStats = Object.keys(REDAP_SECTORS).map(role => {
        const name = REDAP_SECTORS[role];
        const regs = registrations.filter(r => r.secretaria_responsavel === role);
        return {
            role,
            name,
            count: regs.length,
            lastUpdate: regs.length > 0 ? regs[0].updated_at : null,
            isFilled: regs.length > 0
        };
    }).sort((a, b) => b.isFilled - a.isFilled || a.name.localeCompare(b.name));

    const totalFilled = sectorStats.filter(s => s.isFilled).length;
    const totalSectors = sectorStats.length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Status de Preenchimento</h2>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">
                                {totalFilled} de {totalSectors} setores com danos lançados
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
                    {sectorStats.map((sector) => (
                        <div 
                            key={sector.role}
                            className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                                sector.isFilled 
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
                                : 'bg-slate-50/30 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/50 grayscale'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-2xl ${
                                    sector.isFilled 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                }`}>
                                    {sector.isFilled ? <CheckCircle size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-tight ${
                                        sector.isFilled ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'
                                    }`}>
                                        {sector.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        {sector.isFilled ? `${sector.count} danos registrados` : 'Nenhum dano informado'}
                                    </p>
                                </div>
                            </div>

                            {sector.isFilled && (
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full uppercase">
                                        CONCLUÍDO
                                    </span>
                                </div>
                            )}
                            {!sector.isFilled && (
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full uppercase">
                                        PENDENTE
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg"
                    >
                        Fechar Histórico
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectorProgressModal;
