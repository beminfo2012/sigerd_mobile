import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { operacoesService } from '../../services/operacoesService';
import { UserContext } from '../../App';
import { ArrowLeft, History, PlayCircle, Filter, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useOperacao } from '../../contexts/OperacaoContext';

export default function OperacoesHistorico() {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const { operacaoAtiva, setOperacaoAtiva } = useOperacao();
    const [historico, setHistorico] = useState({});
    const [loading, setLoading] = useState(true);
    const [confirmReabrir, setConfirmReabrir] = useState(null);
    const [confirmExcluir, setConfirmExcluir] = useState(null);

    const isCoordOrAdmin = ['admin', 'administrador', 'coordenador', 'coordenador de proteção e defesa civil', 'secretário'].includes(userProfile?.role?.toLowerCase());

    useEffect(() => {
        if (userProfile) {
            loadHistorico();
        }
    }, [userProfile]);

    const loadHistorico = async () => {
        try {
            setLoading(true);
            const data = await operacoesService.getHistoricoOperacoes(userProfile.municipio_id || '00000000-0000-0000-0000-000000000000');
            
            // Agrupar por ano
            const agrupado = (data || []).reduce((acc, op) => {
                const ano = new Date(op.data_hora_inicio).getFullYear();
                if (!acc[ano]) acc[ano] = [];
                acc[ano].push(op);
                return acc;
            }, {});

            setHistorico(agrupado);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar histórico de operações');
        } finally {
            setLoading(false);
        }
    };

    const handleReabrir = (opId) => {
        if (operacaoAtiva) {
            toast.error('Já existe uma operação em andamento. Encerre-a primeiro.');
            return;
        }
        setConfirmReabrir(opId);
    };

    const executeReabrir = async () => {
        if (!confirmReabrir) return;
        const opId = confirmReabrir;
        setConfirmReabrir(null);

        try {
            setLoading(true);
            const op = await operacoesService.reabrirOperacao(opId);
            setOperacaoAtiva(op);
            toast.success('Operação reaberta com sucesso!');
            navigate('/assisthumanitaria');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao reabrir operação');
            setLoading(false);
        }
    };

    const handleExcluir = (opId) => {
        setConfirmExcluir(opId);
    };

    const executeExcluir = async () => {
        if (!confirmExcluir) return;
        const opId = confirmExcluir;
        setConfirmExcluir(null);

        try {
            setLoading(true);
            await operacoesService.excluirOperacao(opId);
            toast.success('Operação excluída com sucesso!');
            loadHistorico();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir operação');
            setLoading(false);
        }
    };

    const anosOrdenados = Object.keys(historico).sort((a, b) => b - a);

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 font-sans">
            <header className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800 px-4 h-16 flex items-center justify-between shadow-sm transition-all">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/assisthumanitaria')} className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black leading-tight">HISTÓRICO DE OPERAÇÕES</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Assistência Humanitária</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 rounded-2xl">
                            <History className="text-slate-600 dark:text-slate-300 dark:text-slate-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Operações Encerradas</h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Acesso somente leitura aos dados permanentes</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : anosOrdenados.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-700 dark:border-slate-800 p-10 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <History className="text-slate-400" size={32} />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Nenhum histórico encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Não há operações encerradas registradas para o seu município.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {anosOrdenados.map(ano => (
                            <div key={ano}>
                                <div className="flex items-center gap-4 mb-4">
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">{ano}</h3>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 dark:bg-slate-800"></div>
                                </div>
                                <div className="space-y-3">
                                    {historico[ano].map(op => {
                                        const inicio = new Date(op.data_hora_inicio);
                                        const fim = new Date(op.data_hora_encerramento);
                                        const diffTime = Math.abs(fim - inicio);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        
                                        return (
                                            <div key={op.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                            <span className="text-[10px] text-white font-bold">✓</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{op.nome}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                {inicio.toLocaleDateString('pt-BR')} – {fim.toLocaleDateString('pt-BR')}
                                                            </span>
                                                            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                                Duração: {diffDays} dia{diffDays > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                                                    {isCoordOrAdmin && (
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <button 
                                                                onClick={() => handleReabrir(op.id)}
                                                                title="Reabrir Operação"
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold transition-colors"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleExcluir(op.id)}
                                                                title="Excluir Operação"
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:bg-red-900/30 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => navigate(`/assisthumanitaria/operacoes/${op.id}`)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
                                                    >
                                                        Ver Detalhes <PlayCircle size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modal Reabrir */}
            {confirmReabrir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                            <RotateCcw size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">Reabrir Operação?</h3>
                        <p className="text-center text-slate-600 dark:text-slate-300 dark:text-slate-400 text-sm mb-6">
                            Tem certeza que deseja reabrir esta operação? Ela voltará a ficar em andamento e pronta para receber novos registros.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmReabrir(null)}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeReabrir}
                                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                Reabrir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Excluir */}
            {confirmExcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">Excluir Operação?</h3>
                        <p className="text-center text-slate-600 dark:text-slate-300 dark:text-slate-400 text-sm mb-6">
                            Atenção: Deseja realmente excluir esta operação? <strong>TODO o histórico de eventos vinculados a ela será perdido permanentemente!</strong>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setConfirmExcluir(null)}
                                className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={executeExcluir}
                                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
