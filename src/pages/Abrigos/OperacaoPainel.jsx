import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { operacoesService } from '../../services/operacoesService';
import { UserContext } from '../../App';
import { 
    ArrowLeft, ClipboardList, BookOpen, Building2, Users, Package, 
    Gift, Truck, FileText, Send, Clock, ShieldAlert, BadgeInfo, Printer 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OperacaoPainel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    
    const [operacao, setOperacao] = useState(null);
    const [diario, setDiario] = useState([]);
    const [estoque, setEstoque] = useState([]);
    const [abrigos, setAbrigos] = useState([]);
    const [doacoes, setDoacoes] = useState([]);
    const [distribuicoes, setDistribuicoes] = useState([]);
    const [novoRegistro, setNovoRegistro] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('diario');
    
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            // We use the 'resumo' that gives operation data plus stats
            const resumo = await operacoesService.calcularResumoOperacional(id);
            if (resumo && resumo.operacao) {
                setOperacao(resumo.operacao);
            }
            
            const historicoDiario = await operacoesService.getDiarioOperacao(id);
            setDiario(historicoDiario || []);

            // Carregar dados de logística
            try {
                const { getGlobalInventory, getShelters, getDonations, getDistributions } = await import('../../services/shelterDb.js');
                const { initDB } = await import('../../services/db.js');
                const db = await initDB();

                const allInv = await getGlobalInventory();
                const allAbr = await getShelters();
                const allDoa = await getDonations();
                const allDis = await getDistributions();
                const allHist = await db.getAll('shelter_history').catch(() => []);

                const opStart = resumo.operacao.data_hora_inicio ? new Date(resumo.operacao.data_hora_inicio) : new Date(0);
                const opEnd = resumo.operacao.data_hora_encerramento ? new Date(resumo.operacao.data_hora_encerramento) : new Date(8640000000000000);

                const isWithinPeriod = (dateString) => {
                    if (!dateString) return false;
                    const date = new Date(dateString);
                    return date >= opStart && date <= opEnd;
                };

                const filteredDoacoes = (allDoa || []).filter(d => String(d.operacao_id) === String(id) || isWithinPeriod(d.created_at));
                const filteredSaidas = (allDis || []).filter(d => String(d.operacao_id) === String(id) || isWithinPeriod(d.created_at));

                setEstoque((allInv || []).filter(i => String(i.operacao_id) === String(id) || isWithinPeriod(i.created_at) || isWithinPeriod(i.updated_at)));
                
                const abrigosDestaOp = (allAbr || []).filter(a => {
                    if (String(a.operacao_id) === String(id)) return true;
                    if (isWithinPeriod(a.created_at) || isWithinPeriod(a.updated_at)) return true;
                    
                    const hasHistory = allHist.some(h => 
                        (h.shelter_id === a.shelter_id || h.shelter_id === a.id || h.shelter_id === a.supabase_id) && 
                        String(h.operacao_id) === String(id)
                    );
                    return hasHistory;
                });
                setAbrigos(abrigosDestaOp);
                setDoacoes(filteredDoacoes);
                setDistribuicoes(filteredSaidas);

                // Mix logistics events into the diary
                const logEventos = [
                    ...(historicoDiario || []),
                    ...filteredDoacoes.map(d => ({
                        id: `doa-${d.id || d.donation_id}`,
                        origem: 'automatico',
                        data_hora: d.created_at,
                        descricao: `📦 ENTRADA DE ESTOQUE\nItem: ${d.item_name || d.item_description}\nQuantidade: ${d.quantity} ${d.unit}\nDestino: ${!d.shelter_id || d.shelter_id === 'CENTRAL' ? 'Estoque Central (Logística)' : 'Abrigo'}`
                    })),
                    ...filteredSaidas.map(s => ({
                        id: `sai-${s.id || s.distribution_id}`,
                        origem: 'automatico',
                        data_hora: s.created_at,
                        descricao: `🚚 SAÍDA DE ESTOQUE\nItem: ${s.item_name}\nQuantidade: ${s.quantity} ${s.unit}\nDestino: ${s.destination_shelter_id ? `Transferência para Abrigo ${s.destination_shelter_id}` : (s.recipient_name || 'Desconhecido')}`
                    }))
                ].sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

                setDiario(logEventos);
            } catch (e) {
                console.warn('Não foi possível carregar dados locais do IndexedDB para o painel', e);
                setDiario(historicoDiario || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar painel da operação');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDiario = async (e) => {
        e.preventDefault();
        if (!novoRegistro.trim()) return;

        try {
            await operacoesService.addRegistroDiario(id, novoRegistro, 'manual', userProfile.id);
            setNovoRegistro('');
            const historicoDiario = await operacoesService.getDiarioOperacao(id);
            setDiario(historicoDiario || []);
            toast.success('Registro adicionado');
        } catch (error) {
            toast.error('Erro ao adicionar registro');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!operacao) {
        return (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 min-h-screen">
                <h2>Operação não encontrada.</h2>
                <button onClick={() => navigate('/assisthumanitaria/historico')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Voltar</button>
            </div>
        );
    }

    const isEncerrada = operacao.status === 'encerrada';

    const tabs = [
        { id: 'resumo', label: 'Resumo', icon: ClipboardList },
        { id: 'diario', label: 'Diário', icon: BookOpen },
        { id: 'abrigos', label: 'Abrigos', icon: Building2 },
        { id: 'estoque', label: 'Estoque', icon: Package }
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 font-sans">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black leading-tight text-slate-800 dark:text-slate-100">Painel da Operação</h1>
                                {isEncerrada ? (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">ENCERRADA</span>
                                ) : (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">EM ANDAMENTO</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium truncate max-w-sm">{operacao.nome}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {operacao.status === 'aberta' && (
                                <button 
                                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-colors"
                                    onClick={handleFinalizarOperacao}
                                >
                                    Finalizar
                                </button>
                            )}
                            <button 
                                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold transition-colors flex items-center gap-1"
                                onClick={() => window.open(`/assisthumanitaria/operacoes/imprimir/${operacao.id}`, '_blank')}
                            >
                                <Printer size={14} />
                                Imprimir PDF
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {isEncerrada && (
                <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/50 p-2 text-center text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldAlert size={14} /> MODO SOMENTE LEITURA. NENHUMA ALTERAÇÃO PERMITIDA.
                </div>
            )}

            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    {activeTab === 'diario' && (
                        <div className="flex flex-col h-[600px]">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <BookOpen className="text-blue-500" size={20} />
                                <h3 className="font-bold text-lg">Diário Operacional</h3>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                                {diario.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-10">Nenhum evento registrado.</p>
                                ) : (
                                    diario.map((evento, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border ${evento.origem === 'automatico' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-500'}`}>
                                                    {evento.origem === 'automatico' ? '🤖' : '✍️'}
                                                </div>
                                                {i !== diario.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1"></div>}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                            <Clock size={12} /> {new Date(evento.data_hora).toLocaleString('pt-BR')}
                                                        </span>
                                                        {evento.profiles && evento.origem !== 'automatico' && (
                                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">{evento.profiles.nome}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{evento.descricao}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {!isEncerrada ? (
                                <form onSubmit={handleAddDiario} className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={novoRegistro}
                                        onChange={e => setNovoRegistro(e.target.value)}
                                        placeholder="Registrar acontecimento..."
                                        className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-slate-800 dark:text-slate-100"
                                    />
                                    <button type="submit" disabled={!novoRegistro.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold transition-colors">
                                        <Send size={16} /> Salvar
                                    </button>
                                </form>
                            ) : (
                                <div className="mt-auto bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operação encerrada — somente leitura</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'resumo' && (
                        <div className="space-y-6">
                             <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <BadgeInfo className="text-blue-500" size={20} />
                                <h3 className="font-bold text-lg">Resumo Operacional</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Início da Operação</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{new Date(operacao.data_hora_inicio).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Encerramento</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{operacao.data_hora_encerramento ? new Date(operacao.data_hora_encerramento).toLocaleString('pt-BR') : 'Em andamento'}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Classificação COBRADE</span>
                                    <p className="text-sm font-black text-blue-700 dark:text-blue-400 mt-1">{operacao.cobrade || '---'} ({operacao.tipo_desastre || 'Não definido'})</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isEncerrada ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isEncerrada ? 'text-red-500' : 'text-emerald-500'}`}>Status Atual</span>
                                    <p className={`text-sm font-black mt-1 uppercase ${isEncerrada ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{operacao.status}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center flex flex-col items-center justify-center">
                                    <Users className="text-indigo-500 mb-2" size={24} />
                                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{abrigos.reduce((sum, a) => sum + Number(a.current_occupancy || 0), 0)}</p>
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-500 uppercase tracking-widest">Pessoas Acolhidas</p>
                                </div>
                                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800 text-center flex flex-col items-center justify-center">
                                    <Building2 className="text-cyan-500 mb-2" size={24} />
                                    <p className="text-2xl font-black text-cyan-700 dark:text-cyan-400">{abrigos.length}</p>
                                    <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-widest">Abrigos Vinculados</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center flex flex-col items-center justify-center">
                                    <Gift className="text-emerald-500 mb-2" size={24} />
                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{doacoes.length}</p>
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Doações (Registros)</p>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-center flex flex-col items-center justify-center">
                                    <Truck className="text-amber-500 mb-2" size={24} />
                                    <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{distribuicoes.length}</p>
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Saídas Logísticas</p>
                                </div>
                            </div>

                            {operacao.descricao && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contexto / Descrição Inicial</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{operacao.descricao}</p>
                                </div>
                            )}

                            {operacao.parecer_final && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                        <ShieldAlert size={12} /> Parecer Técnico / Conclusão
                                    </span>
                                    <p className="text-sm text-amber-900 dark:text-amber-200 mt-2 whitespace-pre-wrap leading-relaxed font-medium">{operacao.parecer_final}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'abrigos' && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <Building2 className="text-blue-500" size={20} />
                                <h3 className="font-bold text-lg">Abrigos da Operação</h3>
                            </div>
                            
                            {abrigos.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-10">Nenhum abrigo vinculado a esta operação.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {abrigos.map(a => (
                                        <div key={a.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{a.name}</h4>
                                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                                                <span>Lotação: {a.current_occupancy || 0}/{a.capacity || '?'}</span>
                                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                    {a.status === 'active' ? 'Ativo' : a.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'estoque' && (
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <Package className="text-blue-500" size={20} />
                                <h3 className="font-bold text-lg">Logística da Operação</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600">
                                        <Gift size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                            {doacoes.reduce((sum, d) => sum + Number(d.quantity || 0), 0).toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">Itens Recebidos</p>
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center text-amber-600">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                                            {distribuicoes.reduce((sum, d) => sum + Number(d.quantity || 0), 0).toLocaleString('pt-BR')}
                                        </p>
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase">Itens Distribuídos</p>
                                    </div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                                            {doacoes.length + distribuicoes.length}
                                        </p>
                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase">Movimentações logísticas</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Material Consumido / Distribuído</h4>
                            {(() => {
                                const consumed = distribuicoes.reduce((acc, curr) => {
                                    const key = `${curr.item_name}-${curr.category}`;
                                    if (!acc[key]) {
                                        acc[key] = {
                                            item_name: curr.item_name,
                                            category: curr.category,
                                            quantity: 0,
                                            unit: curr.unit || 'un.'
                                        };
                                    }
                                    acc[key].quantity += Number(curr.quantity || 0);
                                    return acc;
                                }, {});
                                const consumedList = Object.values(consumed);

                                if (consumedList.length === 0) {
                                    return <p className="text-sm text-slate-500 text-center py-6">Nenhum consumo registrado durante o período da operação.</p>;
                                }

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {consumedList.map((item, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{item.item_name}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{item.category || 'Geral'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <p className="font-black text-rose-600 text-lg">-{item.quantity}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{item.unit}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
