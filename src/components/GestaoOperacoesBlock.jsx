import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperacao } from '../contexts/OperacaoContext';
import { operacoesService } from '../services/operacoesService';
import { getShelters } from '../services/shelterDb';
import { ClipboardList, Plus, History, PlayCircle, StopCircle, CheckSquare, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { COBRADE_LIST } from '../utils/cobradeData';

export default function GestaoOperacoesBlock({ userProfile }) {
    const navigate = useNavigate();
    const { operacaoAtiva, isLoadingOperacao, refreshOperacao } = useOperacao();
    const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
    const [isEncerrarModalOpen, setIsEncerrarModalOpen] = useState(false);
    const [isBlockingModalOpen, setIsBlockingModalOpen] = useState(false);
    const [blockingShelters, setBlockingShelters] = useState([]);
    
    // Novo Operação Form
    const [novaOp, setNovaOp] = useState({
        nome: '',
        tipo_desastre: '',
        cobrade: '',
        descricao: ''
    });
    
    // Encerrar Operação Form
    const [parecerFinal, setParecerFinal] = useState('');
    const [confirmacaoEncerramento, setConfirmacaoEncerramento] = useState(false);
    const [resumoOperacional, setResumoOperacional] = useState(null);
    const [isCarregandoResumo, setIsCarregandoResumo] = useState(false);

    const canCreate = ['admin', 'administrador', 'coordenador', 'coordenador de proteção e defesa civil'].includes(userProfile?.role?.toLowerCase());

    const openEncerrarModal = async () => {
        setIsCarregandoResumo(true);
        try {
            const abrigos = await getShelters();
            const ativos = (abrigos || []).filter(a => 
                (a.status === 'active' || a.status === 'full') && 
                (!a.operacao_id || a.operacao_id === operacaoAtiva.id)
            );
            if (ativos.length > 0) {
                setBlockingShelters(ativos);
                setIsBlockingModalOpen(true);
                setIsCarregandoResumo(false);
                return;
            }
            setIsEncerrarModalOpen(true);
            const resumo = await operacoesService.calcularResumoOperacional(operacaoAtiva.id);
            setResumoOperacional(resumo?.estatisticas || null);
        } catch (e) {
            console.error('Erro ao carregar resumo:', e);
        } finally {
            setIsCarregandoResumo(false);
        }
    };

    const handleCriarOperacao = async (e) => {
        e.preventDefault();
        try {
            await operacoesService.criarOperacao({
                ...novaOp,
                municipio_id: userProfile.municipio_id || '00000000-0000-0000-0000-000000000000',
                coordenador_responsavel_id: userProfile.id
            });
            toast.success('Operação iniciada com sucesso!');
            setIsNovoModalOpen(false);
            refreshOperacao();
        } catch (error) {
            toast.error(error.message || 'Erro ao criar operação');
        }
    };

    const handleEncerrarOperacao = async (e) => {
        e.preventDefault();
        if (!confirmacaoEncerramento) return;
        try {
            await operacoesService.encerrarOperacao(operacaoAtiva.id, parecerFinal, userProfile.id);
            toast.success('Operação encerrada com sucesso!');
            setIsEncerrarModalOpen(false);
            refreshOperacao();
        } catch (error) {
            toast.error(error.message || 'Erro ao encerrar operação');
        }
    };

    if (isLoadingOperacao) {
        return (
            <div className="mt-8 bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
                <div className="h-16 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <ClipboardList className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">GESTÃO DE OPERAÇÕES</h2>
                            <p className="text-[11px] text-slate-500 font-medium">Ciclo de vida da Assistência Humanitária</p>
                        </div>
                    </div>
                    {operacaoAtiva && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">EM ANDAMENTO</span>
                        </div>
                    )}
                </div>

                {!operacaoAtiva ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            Nenhuma operação ativa no momento.<br/>
                            <span className="text-xs text-slate-500">As funcionalidades permanentes permanecem disponíveis (Modo Preparação).</span>
                        </p>
                        <div className="flex gap-3">
                            {canCreate && (
                                <button 
                                    onClick={() => setIsNovoModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                                >
                                    <Plus size={16} /> Nova Operação
                                </button>
                            )}
                            <button 
                                onClick={() => navigate('/assisthumanitaria/historico')}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
                            >
                                <History size={16} /> Ver Histórico
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-1">{operacaoAtiva.nome}</h3>
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Iniciada em: {new Date(operacaoAtiva.data_hora_inicio).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="text-left md:text-right">
                                <p className="text-xs font-bold text-blue-800 dark:text-blue-200">COBRADE: {operacaoAtiva.cobrade}</p>
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">{operacaoAtiva.tipo_desastre}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => navigate(`/assisthumanitaria/operacoes/${operacaoAtiva.id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold transition-colors shadow-sm"
                            >
                                <PlayCircle size={16} /> Abrir Painel
                            </button>
                            {canCreate && (
                                <button 
                                    onClick={openEncerrarModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-colors"
                                >
                                    <StopCircle size={16} /> Encerrar Operação
                                </button>
                            )}
                            <button 
                                onClick={() => navigate('/assisthumanitaria/historico')}
                                className="flex items-center gap-2 px-4 py-2 bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl text-sm font-bold transition-colors ml-auto"
                            >
                                <History size={16} /> Histórico
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Nova Operação */}
            {isNovoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Iniciar Nova Operação
                            </h3>
                            <button onClick={() => setIsNovoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCriarOperacao} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">NOME DA OPERAÇÃO <span className="text-red-500">*</span></label>
                                <input required type="text" value={novaOp.nome} onChange={e => setNovaOp({...novaOp, nome: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: Enchente - Rio Santa Maria" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">COBRADE <span className="text-red-500">*</span></label>
                                    <select 
                                        required 
                                        value={novaOp.cobrade} 
                                        onChange={e => {
                                            const code = e.target.value;
                                            const cobradeItem = COBRADE_LIST.find(item => item.code === code);
                                            setNovaOp({
                                                ...novaOp, 
                                                cobrade: code,
                                                tipo_desastre: cobradeItem ? cobradeItem.name : ''
                                            });
                                        }} 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Selecione um COBRADE...</option>
                                        {COBRADE_LIST.map(item => (
                                            <option key={item.code} value={item.code}>{item.code} - {item.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TIPO DE DESASTRE <span className="text-red-500">*</span></label>
                                    <input 
                                        required 
                                        readOnly
                                        type="text" 
                                        value={novaOp.tipo_desastre} 
                                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none cursor-not-allowed text-slate-500" 
                                        placeholder="Preenchido automaticamente..." 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">DESCRIÇÃO INICIAL</label>
                                <textarea value={novaOp.descricao} onChange={e => setNovaOp({...novaOp, descricao: e.target.value})} rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" placeholder="Contexto da situação..."></textarea>
                            </div>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3 flex items-start gap-3 mt-4">
                                <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                                    A partir deste momento, <strong>todas as movimentações</strong> de Abrigos, Estoque, Doações, Logística e Contratos serão <strong>automaticamente vinculadas</strong> a esta operação.
                                </p>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsNovoModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Voltar</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">Confirmar e Iniciar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Encerrar Operação */}
            {isEncerrarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                                <StopCircle size={20} /> Encerrar Operação
                            </h3>
                            <button onClick={() => setIsEncerrarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEncerrarOperacao} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Você está encerrando a operação: <strong>{operacaoAtiva.nome}</strong>. Esta ação bloqueará novas movimentações. Os dados históricos serão preservados permanentemente.
                            </p>

                            {isCarregandoResumo ? (
                                <div className="text-center py-4 text-slate-500 text-sm">Carregando dados consolidados...</div>
                            ) : resumoOperacional && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xl font-black text-blue-600">{resumoOperacional.abrigosUtilizados}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Abrigos</p>
                                    </div>
                                    <div className="border-x border-slate-200 dark:border-slate-700">
                                        <p className="text-xl font-black text-emerald-600">{resumoOperacional.pessoasAcolhidas}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Acolhidos</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-amber-600">{resumoOperacional.itensEstoque}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">Itens Mapeados</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 mt-2">PARECER TÉCNICO FINAL <span className="text-red-500">*</span></label>
                                <textarea required minLength={50} value={parecerFinal} onChange={e => setParecerFinal(e.target.value)} rows={4} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/50 resize-none" placeholder="Relatório conclusivo (mín. 50 caracteres)..."></textarea>
                            </div>
                            
                            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer mt-4">
                                <div className="pt-0.5">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${confirmacaoEncerramento ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-600'}`}>
                                        {confirmacaoEncerramento && <CheckSquare className="text-white w-4 h-4" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={confirmacaoEncerramento} onChange={e => setConfirmacaoEncerramento(e.target.checked)} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Confirmo o encerramento desta operação</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Após confirmar, nenhuma nova movimentação será permitida.</p>
                                </div>
                            </label>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsEncerrarModalOpen(false)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Voltar</button>
                                <button type="submit" disabled={!confirmacaoEncerramento} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Confirmar Encerramento</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Bloqueio por Abrigos Ativos */}
            {isBlockingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                <AlertTriangle size={20} /> Encerramento Bloqueado
                            </h3>
                            <button onClick={() => setIsBlockingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Não é possível encerrar a operação <strong>{operacaoAtiva.nome}</strong> porque ainda existem abrigos em andamento. Inative os seguintes abrigos antes de continuar:
                            </p>
                            <div className="max-h-48 overflow-y-auto bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 space-y-2">
                                {blockingShelters.map(shelter => (
                                    <div key={shelter.shelter_id || shelter.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{shelter.name}</span>
                                        <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">Ativo</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4">
                                <button type="button" onClick={() => setIsBlockingModalOpen(false)} className="w-full py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Entendi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
