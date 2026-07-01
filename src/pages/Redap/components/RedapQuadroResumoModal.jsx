import React from 'react';
import { X, DollarSign, Activity, AlertTriangle } from 'lucide-react';

const RedapQuadroResumoModal = ({ isOpen, onClose, secoes }) => {
    if (!isOpen) return null;

    // Helper para extrair valores
    const calculateTotals = () => {
        let totalEdificacoes = 0;
        let totalInfra = 0;
        let totalAgro = 0;
        let totalAmbientais = 0;

        secoes.forEach(sec => {
            const statusMatch = ['VALIDADO', 'ENVIADO', 'PREENCHIDO'].includes(sec.status_secao);
            if (statusMatch && sec.dados_json) {
                if (sec.secao === 'DANOS_EDIFICACOES') {
                    if (sec.dados_json.items) {
                        Object.values(sec.dados_json.items).forEach(i => totalEdificacoes += Number(i.valor_estimado) || 0);
                    }
                    if (sec.dados_json.servicos) {
                        Object.values(sec.dados_json.servicos).forEach(i => totalEdificacoes += Number(i.valor_estimado) || 0);
                    }
                }
                if (sec.secao === 'DANOS_INFRAESTRUTURA') {
                    if (sec.dados_json.items) {
                        Object.values(sec.dados_json.items).forEach(i => totalInfra += Number(i.valor_estimado) || 0);
                    }
                }
                if (sec.secao === 'DANOS_AGRICOLAS') {
                    if (sec.dados_json.items) {
                        Object.values(sec.dados_json.items).forEach(i => totalAgro += Number(i.valor_estimado) || 0);
                    }
                    if (sec.dados_json.agro) {
                        Object.values(sec.dados_json.agro).forEach(i => totalAgro += Number(i.valor_estimado) || 0);
                    }
                    if (sec.dados_json.infra) {
                        Object.values(sec.dados_json.infra).forEach(i => totalAgro += Number(i.valor_estimado) || 0);
                    }
                    if (sec.dados_json.setores) {
                        Object.values(sec.dados_json.setores).forEach(i => totalAgro += Number(i.valor_estimado) || 0);
                    }
                }
                if (sec.secao === 'DANOS_AMBIENTAIS') {
                    if (sec.dados_json.custo_recuperacao) {
                        totalAmbientais += Number(sec.dados_json.custo_recuperacao) || 0;
                    }
                }
            }
        });

        const totalGeral = totalEdificacoes + totalInfra + totalAgro + totalAmbientais;

        return {
            totalEdificacoes,
            totalInfra,
            totalAgro,
            totalAmbientais,
            totalGeral
        };
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={18} className="text-blue-500" /> Quadro Resumo
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Consolidação Econômica (Seção 7)</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                        <p className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Prejuízo Total Estimado</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-2">{formatCurrency(totals.totalGeral)}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                            Detalhamento por Setor
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700/50">
                                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Danos a Edificações (Públicas/Sociais)</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totals.totalEdificacoes)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700/50">
                                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Danos de Infraestrutura</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totals.totalInfra)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700/50">
                                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Danos a Atividades Agrícolas/Privadas</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totals.totalAgro)}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700/50">
                                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Danos Ambientais</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totals.totalAmbientais)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex gap-3 text-sm text-amber-800 dark:text-amber-300">
                        <AlertTriangle size={20} className="shrink-0" />
                        <p>Estes valores são calculados com base nas seções que já foram preenchidas, enviadas ou validadas. Seções pendentes ou dispensadas não entram no cálculo.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-700 dark:hover:bg-slate-200 active:scale-95 transition-all shadow-md"
                    >
                        Fechar Resumo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RedapQuadroResumoModal;
