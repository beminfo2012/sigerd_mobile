import React from 'react';
import { AlertTriangle, MapPin, Database, X } from 'lucide-react';

const RiskAreaModal = ({ 
    isOpen, 
    onClose, 
    riskInfo 
}) => {
    if (!isOpen || !riskInfo) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-red-100 dark:border-red-900/30 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Decoration */}
                <div className="h-24 bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center relative">
                    <div className="absolute top-4 right-4">
                        <button 
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-inner">
                        <AlertTriangle className="text-white fill-white/20" size={32} />
                    </div>
                </div>

                <div className="p-8 space-y-6 pt-10 px-6 sm:px-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Atenção!
                        </h2>
                        <p className="text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest">
                            Área de Risco Mapeada
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex gap-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Local</span>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                    {riskInfo.name}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex gap-4">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                                <Database className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Fonte</span>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                    {riskInfo.source}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-2">
                        Você está dentro de um perímetro de risco identificado pelo município. Por favor, redobre a atenção durante a vistoria.
                    </p>

                    <button 
                        onClick={onClose}
                        className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:opacity-90"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskAreaModal;
