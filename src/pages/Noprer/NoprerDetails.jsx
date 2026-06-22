import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
    ArrowLeft, Printer, History, AlertOctagon, CheckCircle, 
    Calendar, MapPin, User, FileText, ArrowRight, ShieldAlert,
    RefreshCw, X, MessageSquare
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

const NoprerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [noprer, setNoprer] = useState(null);
    const [showConvertModal, setShowConvertModal] = useState(false);
    
    // Modal de Status
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusObs, setStatusObs] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        const fetchNoprer = async () => {
            try {
                const { data, error } = await supabase.from('noprer').select('*').eq('id', id).single();
                if (data) setNoprer(data);
                else console.error(error);
            } catch (err) {
                console.error(err);
            }
        };
        fetchNoprer();
    }, [id]);

    if (!noprer) {
        return <div className="p-8 text-center text-slate-500 font-bold uppercase">Carregando detalhes...</div>;
    }

    const handlePrint = () => {
        window.open(`/noprer/imprimir/${noprer.id}`, '_blank');
    };

    const handleConvertToInterdicao = async () => {
        try {
            await supabase.from('noprer').update({ status: 'CONVERTIDA EM INTERDIÇÃO' }).eq('id', noprer.id);
            
            sessionStorage.setItem('interdicao_import_data', JSON.stringify({
                endereco: noprer.endereco,
                proprietario: noprer.solicitante,
                coordenadas: noprer.coordenadas,
                origem: noprer.origem_id,
                noprer: noprer.numero_noprer
            }));
            
            navigate('/interdicao'); 
        } catch (err) {
            console.error("Erro ao converter para interdição:", err);
            alert("Erro ao converter.");
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus) return;
        setUpdatingStatus(true);
        try {
            const historyEntry = {
                date: new Date().toISOString(),
                status: newStatus,
                obs: statusObs
            };
            
            // Verifica se historico_status existe, senao cria
            const historicoExistente = Array.isArray(noprer.historico_status) ? noprer.historico_status : [];
            const novoHistorico = [...historicoExistente, historyEntry];

            const { error } = await supabase.from('noprer').update({ 
                status: newStatus,
                historico_status: novoHistorico
            }).eq('id', noprer.id);

            if (error) throw error;
            
            setNoprer({ ...noprer, status: newStatus, historico_status: novoHistorico });
            setIsStatusModalOpen(false);
            setNewStatus('');
            setStatusObs('');
        } catch (err) {
            console.error("Erro ao alterar status:", err);
            alert(`Falha ao alterar status. Se o banco não tiver a coluna historico_status, avise o suporte.\nErro: ${err.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openStatusModal = () => {
        setNewStatus(noprer.status);
        setStatusObs('');
        setIsStatusModalOpen(true);
    };

    const getStatusColor = (status) => {
        if (status === 'EMITIDA' || status === 'NOTIFICADO') return 'text-blue-500 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
        if (status === 'EM ADEQUAÇÃO') return 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
        if (status === 'PRAZO VENCENDO') return 'text-orange-500 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
        if (status === 'VENCIDA') return 'text-red-500 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
        if (status === 'REVISTORIADA') return 'text-purple-500 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800';
        if (status === 'CONVERTIDA EM INTERDIÇÃO') return 'text-red-600 bg-red-100 border-red-300 dark:bg-red-900/40 dark:border-red-700/50';
        if (status === 'ENCERRADA') return 'text-slate-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700';
        return 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700';
    };

    const isConclusive = ['CONVERTIDA EM INTERDIÇÃO', 'ENCERRADA'].includes(noprer.status);

    // Montando a Timeline (Eventos automáticos + Eventos do histórico de status)
    const historyTimeline = [
        { date: new Date(noprer.data_emissao).toLocaleDateString('pt-BR'), iso: noprer.data_emissao, type: 'noprer', label: 'Emissão NOPRER', doc: noprer.numero_noprer },
    ];

    if (noprer.origem_id) {
        historyTimeline.push({ date: new Date(noprer.data_emissao).toLocaleDateString('pt-BR'), iso: noprer.data_emissao, type: 'vistoria', label: 'Vistoria Original', doc: noprer.origem_id });
    }

    // Só adiciona o "Fim do Prazo" automático se não for conclusivo (ou se quiser sempre ver o prazo, remove essa condicional)
    if (!isConclusive && noprer.data_limite) {
        historyTimeline.push({ date: new Date(noprer.data_limite).toLocaleDateString('pt-BR'), iso: noprer.data_limite, type: 'prazo', label: 'Fim do Prazo', doc: `${noprer.prazo_dias} dias concedidos` });
    }

    // Injetando as atualizações de status
    if (Array.isArray(noprer.historico_status)) {
        noprer.historico_status.forEach(h => {
            historyTimeline.push({
                date: new Date(h.date).toLocaleDateString('pt-BR'),
                iso: h.date,
                type: 'status_change',
                label: `Status: ${h.status}`,
                doc: h.obs || 'Atualização manual'
            });
        });
    }

    // Opcional: ordenar cronologicamente a timeline
    historyTimeline.sort((a, b) => new Date(a.iso) - new Date(b.iso));

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/noprer')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldAlert className="text-blue-600" /> 
                                Detalhes NOPRER
                            </h1>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                {noprer.numero_noprer}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePrint}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
                        >
                            <Printer size={18} />
                            Relatório
                        </button>
                        {!isConclusive && (
                            <button 
                                onClick={() => setShowConvertModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all"
                            >
                                <AlertOctagon size={18} />
                                Interdição
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Status Badge */}
                    <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${getStatusColor(noprer.status)}`}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Status Atual</p>
                            <h2 className="text-2xl font-black">{noprer.status}</h2>
                        </div>
                        
                        {!isConclusive ? (
                            <button 
                                onClick={openStatusModal}
                                className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-current text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                            >
                                <RefreshCw size={16} /> Atualizar Status
                            </button>
                        ) : (
                            <div className="bg-black/10 dark:bg-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                                <CheckCircle size={18} /> <span className="font-bold text-xs uppercase tracking-wider">Concluído</span>
                            </div>
                        )}
                    </div>

                    {/* Resumo */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                            Identificação e Localização
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Responsável</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <User size={14} className="text-slate-400" />
                                    {noprer.solicitante}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Endereço</p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                    {noprer.endereco}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes Técnicos */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                            Avaliação Técnica
                        </h3>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risco e Tipo</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded mr-2 uppercase tracking-wider text-[10px]">{noprer.risco}</span>
                                {noprer.tipo_risco}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição</p>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                {noprer.descricao}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Medidas Mitigatórias Exigidas</p>
                            <ul className="space-y-2 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                {noprer.medidas_mitigatorias?.map((medida, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                        {medida}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar Timeline */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
                            <History size={16} className="text-blue-500" />
                            Histórico do Imóvel
                        </h3>
                        
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-8">
                            {historyTimeline.map((item, idx) => (
                                <div key={idx} className="relative pl-6">
                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 ${
                                        item.type === 'noprer' ? 'bg-blue-500' : 
                                        item.type === 'prazo' ? 'bg-orange-500' : 
                                        item.type === 'status_change' ? 'bg-purple-500' : 'bg-slate-400'
                                    }`}></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-widest">{item.date}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{item.label}</p>
                                    <p className={`text-xs font-bold mt-1 ${item.type === 'status_change' ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {item.doc}
                                    </p>
                                </div>
                            ))}
                            
                            {noprer.status === 'CONVERTIDA EM INTERDIÇÃO' && (
                                <div className="relative pl-6">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-800 bg-red-600"></div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Encerrado</p>
                                    <p className="text-sm font-black text-red-600">Auto de Interdição</p>
                                    <p className="text-xs font-medium text-slate-500 mt-1">Imóvel interditado. NOPRER convertida.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <ConfirmModal 
                isOpen={showConvertModal}
                onClose={() => setShowConvertModal(false)}
                onConfirm={handleConvertToInterdicao}
                title="Converter para Interdição"
                message="Esta ação migrará todo o histórico da NOPRER (fotos, endereço, coordenadas) para a geração de um Auto de Interdição oficial. Deseja prosseguir?"
                confirmText="Sim, Converter"
                cancelText="Cancelar"
                isDestructive={true}
            />

            {/* Modal de Atualização de Status */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <RefreshCw size={18} className="text-blue-600" /> Alterar Status
                            </h3>
                            <button onClick={() => setIsStatusModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Novo Status</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 dark:text-white transition-all cursor-pointer"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="EMITIDA">EMITIDA</option>
                                    <option value="NOTIFICADO">NOTIFICADO</option>
                                    <option value="EM ADEQUAÇÃO">EM ADEQUAÇÃO</option>
                                    <option value="PRAZO VENCENDO">PRAZO VENCENDO</option>
                                    <option value="VENCIDA">VENCIDA</option>
                                    <option value="REVISTORIADA">REVISTORIADA</option>
                                    <option value="ENCERRADA">ENCERRADA</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <MessageSquare size={12} /> Observações p/ o Histórico (Opcional)
                                </label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all text-slate-800 dark:text-white min-h-[100px] resize-none"
                                    placeholder="Ex: Responsável contatado via telefone..."
                                    value={statusObs}
                                    onChange={(e) => setStatusObs(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleUpdateStatus}
                                disabled={updatingStatus}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black uppercase tracking-widest p-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2"
                            >
                                {updatingStatus ? <RefreshCw className="animate-spin" size={20} /> : 'Salvar Alteração'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoprerDetails;
