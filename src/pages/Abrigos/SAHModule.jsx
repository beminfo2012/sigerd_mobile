import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, Send, AlertTriangle, ArrowLeft,
    Archive, CheckCircle, MapPin, Users,
    Info, FileDown, RefreshCcw, Building2, Plus, Eye, Clock,
    Edit2, Trash2
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { UserContext } from '../../App';

const COBRADES = [
    "1.1.1.1.0 - Desastres Naturais / Terremoto",
    "1.1.1.2.0 - Desastres Naturais / Tsunami",
    "1.1.3.0.0 - Escorregamentos / Deslizamentos",
    "1.2.1.0.0 - Inundações",
    "1.2.2.0.0 - Enxurradas",
    "1.2.3.0.0 - Alagamentos",
    "1.3.1.1.1 - Vendaval",
    "1.3.1.1.2 - Ciclone",
    "1.3.1.2.0 - Tornados",
    "1.3.2.1.4 - Tempestade Local / Granizo",
    "1.4.1.1.0 - Seca",
    "1.4.1.2.0 - Estiagem",
    "1.4.1.3.1 - Incêndio Florestal",
    "2.1.1.1.0 - Ruptura de Barragem"
];

export default function SAHModule() {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const isAdminOrCoord = userProfile?.role === 'Admin' || userProfile?.role?.includes('Coordenador');
    
    const [view, setView] = useState('list'); // 'list' | 'wizard' | 'detail'
    const [selectedSah, setSelectedSah] = useState(null);
    const [solicitacoes, setSolicitacoes] = useState([]);
    const [etapa, setEtapa] = useState(1);
    const [protocolo, setProtocolo] = useState('');
    const [loading, setLoading] = useState(false);
    const [redaps, setRedaps] = useState([]);
    
    // Default Empty State
    const defaultSahData = {
        id: null,
        municipio: 'Santa Maria de Jetibá',
        uf: 'ES',
        cobrade: '',
        data_desastre: new Date().toISOString().split('T')[0],
        decreto_emergencia: '',
        descricao_situacao: '',
        redap_id: '',
        
        snapshot_desabrigados: 0,
        snapshot_desalojados: 0,
        snapshot_kits_entregues: 0,
        snapshot_deficit_kits: 0,
        
        assistente_social_nome: '',
        assistente_social_cress: '',
        
        encaminhamentos_cras: false,
        encaminhamentos_creas: false,
        encaminhamentos_abrigo: false,
        encaminhamentos_aluguel_social: false,
        
        oficio_qtde_cesta_basica: 0,
        oficio_qtde_kit_higiene_limpeza: 0,
        oficio_qtde_colchao: 0,
        oficio_qtde_jogo_lencol: 0,
        oficio_qtde_cobertor: 0,
        oficio_qtde_travesseiro: 0
    };
    
    const [sahData, setSahData] = useState(defaultSahData);

    useEffect(() => {
        if (view === 'list') {
            loadSolicitacoes();
        } else if (view === 'wizard') {
            loadInitialData();
            if (!sahData.id) {
                const generateProtocol = async () => {
                    const year = new Date().getFullYear();
                    try {
                        const { count } = await supabase
                            .from('sah_solicitacoes')
                            .select('*', { count: 'exact', head: true })
                            .like('protocolo', `SAH-SMJ-${year}-%`);
                        const nextNum = (count || 0) + 1;
                        setProtocolo(`SAH-SMJ-${year}-${String(nextNum).padStart(4, '0')}`);
                    } catch (e) {
                        const rand = Math.floor(1000 + Math.random() * 9000);
                        setProtocolo(`SAH-SMJ-${year}-${rand}`);
                    }
                };
                generateProtocol();
            }
        }
    }, [view]);

    const loadSolicitacoes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sah_solicitacoes')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSolicitacoes(data || []);
        } catch (error) {
            console.error('Erro ao carregar:', error);
            toast.error('Erro ao carregar solicitações.');
        } finally {
            setLoading(false);
        }
    };

    const loadInitialData = async () => {
        try {
            const { data: records, error } = await supabase
                .from('eventos_desastre')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (records) {
                const parsedRedaps = records.map(r => {
                    const eventDate = new Date(r.data_hora_evento);
                    const ano = eventDate.getFullYear() || '';
                    const mes = String(eventDate.getMonth() + 1).padStart(2, '0') || '';
                    const dia = String(eventDate.getDate()).padStart(2, '0') || '';
                    const dataStr = (ano && mes && dia) ? `${dia}/${mes}/${ano}` : 'Data N/I';
                    
                    const protocolo = r.id_sigerd || r.nome_evento || 'S/ Prot.';
                    const cobrade = r.cobrade_codigo || 'Desconhecido';
                    
                    return {
                        id: r.id,
                        label: `REDAP: ${protocolo} - ${dataStr} (${cobrade})`,
                        rawData: r
                    };
                });
                setRedaps(parsedRedaps);
            }
            
            if (!sahData.id) {
                await fetchCrossReferenceData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCrossReferenceData = async () => {
        try {
            setLoading(true);
            
            const { data: occupants } = await supabase.from('shelter_occupants').select('*').eq('status', 'active');
            const { data: inventory } = await supabase.from('shelter_inventory').select('*').eq('status', 'active');
            const { data: distributions } = await supabase.from('shelter_distributions').select('*');
            
            const desabrigados = occupants ? occupants.length : 0;
            const desalojados = parseInt(sahData.snapshot_desalojados) || 0; 
            
            let kitsEntregues = 0;
            if (distributions && inventory) {
                kitsEntregues = distributions.length * 2; 
            }
            
            const necessario = Math.ceil(desabrigados + (desalojados * 0.4));
            const deficit = Math.max(0, necessario - kitsEntregues);
            
            setSahData(prev => ({
                ...prev,
                snapshot_desabrigados: desabrigados,
                snapshot_kits_entregues: kitsEntregues,
                snapshot_deficit_kits: deficit,
                oficio_qtde_cesta_basica: deficit,
                oficio_qtde_kit_higiene_limpeza: deficit,
                oficio_qtde_jogo_lencol: deficit,
                oficio_qtde_colchao: deficit * 2
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setSahData(prev => ({ ...prev, [field]: value }));
    };

    const handleRedapSelect = async (eventoId) => {
        if (!eventoId) {
            handleInputChange('evento_id', '');
            return;
        }
        
        const selected = redaps.find(r => String(r.id) === String(eventoId));
        if (selected && selected.rawData) {
            const data = selected.rawData;
            const eventDate = new Date(data.data_hora_evento);
            const ano = eventDate.getFullYear();
            const mes = String(eventDate.getMonth() + 1).padStart(2, '0');
            const dia = String(eventDate.getDate()).padStart(2, '0');
            
            const cobradeCode = data.cobrade_codigo || '';
            const matchedCobrade = COBRADES.find(c => c.startsWith(cobradeCode)) || '';
            
            let desalojados = 0;
            let desabrigados = 0;
            try {
                const { data: secoes } = await supabase
                    .from('redap_secoes')
                    .select('dados_json')
                    .eq('evento_id', eventoId)
                    .eq('secao', 'DANOS_HUMANOS');
                    
                if (secoes && secoes.length > 0) {
                    secoes.forEach(sec => {
                        const json = sec.dados_json || {};
                        desalojados += Number(json.desalojados || 0);
                        desabrigados += Number(json.desabrigados || 0);
                    });
                }
            } catch (err) {
                console.error('Erro ao buscar dados humanos', err);
            }
            
            setSahData(prev => ({
                ...prev,
                evento_id: eventoId,
                cobrade: matchedCobrade || prev.cobrade,
                data_desastre: (ano && mes && dia) ? `${ano}-${mes}-${dia}` : prev.data_desastre,
                decreto_emergencia: data.decreto_municipal_emergencia || prev.decreto_emergencia,
                snapshot_desalojados: desalojados > 0 ? desalojados : prev.snapshot_desalojados,
                snapshot_desabrigados: desabrigados > 0 ? desabrigados : prev.snapshot_desabrigados
            }));
            toast.success('Dados importados do evento com sucesso!');
        } else {
            handleInputChange('evento_id', eventoId);
        }
    };

    const handleSaveToDB = async (status) => {
        try {
            setLoading(true);
            
            const payload = {
                protocolo: protocolo,
                evento_id: sahData.evento_id || null,
                municipio: sahData.municipio,
                uf: sahData.uf,
                cobrade: sahData.cobrade || 'Não Informado',
                data_desastre: sahData.data_desastre,
                decreto_emergencia: sahData.decreto_emergencia,
                descricao_situacao: sahData.descricao_situacao,
                
                snapshot_desabrigados: sahData.snapshot_desabrigados,
                snapshot_desalojados: sahData.snapshot_desalojados,
                snapshot_kits_entregues: sahData.snapshot_kits_entregues,
                snapshot_deficit_kits: sahData.snapshot_deficit_kits,
                
                status: status,
                data_envio: status === 'enviado' ? new Date().toISOString() : null,
                
                assistente_social_nome: sahData.assistente_social_nome,
                assistente_social_cress: sahData.assistente_social_cress,
                encaminhamentos_cras: sahData.encaminhamentos_cras,
                encaminhamentos_creas: sahData.encaminhamentos_creas,
                encaminhamentos_abrigo: sahData.encaminhamentos_abrigo,
                encaminhamentos_aluguel_social: sahData.encaminhamentos_aluguel_social,
                
                oficio_qtde_cesta_basica: sahData.oficio_qtde_cesta_basica,
                oficio_qtde_kit_higiene_limpeza: sahData.oficio_qtde_kit_higiene_limpeza,
                oficio_qtde_colchao: sahData.oficio_qtde_colchao,
                oficio_qtde_jogo_lencol: sahData.oficio_qtde_jogo_lencol
            };

            if (sahData.id) {
                const { error } = await supabase.from('sah_solicitacoes').update(payload).eq('id', sahData.id);
                if (error) throw error;
                toast.success('Solicitação atualizada com sucesso!');
            } else {
                payload.created_by = userProfile?.id;
                const { error } = await supabase.from('sah_solicitacoes').insert([payload]);
                if (error) throw error;
                toast.success(status === 'rascunho' ? 'Rascunho salvo!' : 'SAH Transmitida com sucesso!');
            }
            
            setSahData(defaultSahData);
            setEtapa(1);
            setView('list');
        } catch (error) {
            console.error('Erro ao salvar SAH:', error);
            toast.error('Erro ao salvar SAH no banco.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (novoStatus) => {
        if (!selectedSah) return;
        try {
            setLoading(true);
            const { error } = await supabase.from('sah_solicitacoes').update({ status: novoStatus }).eq('id', selectedSah.id);
            if (error) throw error;
            toast.success(`Status atualizado para ${novoStatus.toUpperCase()}!`);
            setSelectedSah({ ...selectedSah, status: novoStatus });
            setSolicitacoes(prev => prev.map(s => s.id === selectedSah.id ? { ...s, status: novoStatus } : s));
        } catch (error) {
            toast.error('Não foi possível atualizar o status.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta solicitação? Esta ação é irreversível.')) return;
        try {
            setLoading(true);
            const { error } = await supabase.from('sah_solicitacoes').delete().eq('id', id);
            if (error) throw error;
            toast.success('Solicitação excluída com sucesso!');
            setSolicitacoes(prev => prev.filter(s => s.id !== id));
            if (view === 'detail') setView('list');
        } catch (error) {
            toast.error('Erro ao excluir solicitação.');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (sah) => {
        setSahData({
            ...sah
        });
        setProtocolo(sah.protocolo);
        setEtapa(1);
        setView('wizard');
    };

    // ------------- RENDERERS ------------- //

    const renderList = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel de Assistência</h2>
                    <p className="text-sm text-slate-500 mt-1">Gerencie solicitações de recursos estaduais e federais (SAH).</p>
                </div>
                <button 
                    onClick={() => { setSahData(defaultSahData); setEtapa(1); setView('wizard'); }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-bold flex items-center gap-2"
                >
                    <Plus size={20} /> Nova Solicitação
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : solicitacoes.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <Archive size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-700">Nenhuma SAH Encontrada</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">Você ainda não registrou nenhuma solicitação. Clique em "Nova Solicitação" para abrir um processo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {solicitacoes.map((sah) => (
                        <div key={sah.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-xs font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{sah.protocolo}</span>
                                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                                        sah.status === 'enviado' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                        sah.status === 'recebido' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        {sah.status}
                                    </span>
                                </div>
                                <h4 className="font-bold text-slate-800 line-clamp-1" title={sah.cobrade}>{sah.cobrade || 'Sem COBRADE'}</h4>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 mb-4">
                                    <Clock size={12} /> Data Evento: {new Date(sah.data_desastre).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="text-center">
                                        <span className="block text-xl font-black text-slate-700">{sah.snapshot_deficit_kits}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Déficit Calc.</span>
                                    </div>
                                    <div className="text-center border-l border-slate-200">
                                        <span className="block text-xl font-black text-slate-700">{sah.oficio_qtde_cesta_basica}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Cestas Req.</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 bg-slate-50">
                                <button 
                                    onClick={() => { setSelectedSah(sah); setView('detail'); }}
                                    className="py-3 text-blue-600 hover:bg-blue-50 font-bold text-sm transition-colors flex justify-center items-center gap-2 border-r border-slate-200"
                                >
                                    <Eye size={16} /> Detalhes
                                </button>
                                <div className="flex">
                                    {(sah.status === 'rascunho' || isAdminOrCoord) && (
                                        <button 
                                            onClick={() => openEdit(sah)}
                                            className="flex-1 py-3 text-slate-600 hover:bg-slate-200 font-bold transition-colors flex justify-center items-center" title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                    {(isAdminOrCoord) && (
                                        <button 
                                            onClick={() => handleDelete(sah.id)}
                                            className="flex-1 py-3 text-red-500 hover:bg-red-50 font-bold transition-colors flex justify-center items-center" title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderDetail = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                
                {/* Detail Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase">Protocolo: {selectedSah.protocolo}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${
                                selectedSah.status === 'enviado' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                                selectedSah.status === 'recebido' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 
                                'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }`}>
                                STATUS: {selectedSah.status}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white">{selectedSah.cobrade || 'Evento Não Especificado'}</h2>
                        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2"><Clock size={14}/> {new Date(selectedSah.data_desastre).toLocaleDateString('pt-BR')} • {selectedSah.municipio}/{selectedSah.uf}</p>
                    </div>
                    <div className="flex gap-2">
                        {(selectedSah.status === 'rascunho' || isAdminOrCoord) && (
                            <button onClick={() => openEdit(selectedSah)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors">Editar</button>
                        )}
                        {isAdminOrCoord && (
                            <button onClick={() => handleDelete(selectedSah.id)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg text-sm font-bold transition-colors border border-red-500/30">Excluir</button>
                        )}
                    </div>
                </div>
                
                {/* Detail Body */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Informações do Desastre</h4>
                            <div className="space-y-4">
                                <div>
                                    <span className="block text-xs font-bold text-slate-500">Decreto de Emergência</span>
                                    <span className="text-sm font-semibold text-slate-800">{selectedSah.decreto_emergencia || 'Nenhum'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500">Descrição Situacional</span>
                                    <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl mt-1 leading-relaxed border border-slate-100">{selectedSah.descricao_situacao || 'Sem descrição.'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Responsável Técnico (Social)</h4>
                            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div>
                                    <span className="block text-[10px] font-bold text-blue-600 uppercase">Nome</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedSah.assistente_social_nome || 'N/I'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-blue-600 uppercase">CRESS</span>
                                    <span className="text-sm font-bold text-slate-800">{selectedSah.assistente_social_cress || 'N/I'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Métricas (Snapshot)</h4>
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Desabrigados</span>
                                    <span className="text-2xl font-black text-slate-800">{selectedSah.snapshot_desabrigados}</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Desalojados</span>
                                    <span className="text-2xl font-black text-slate-800">{selectedSah.snapshot_desalojados}</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Kits já Entregues</span>
                                    <span className="text-2xl font-black text-slate-800">{selectedSah.snapshot_kits_entregues}</span>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
                                    <span className="block text-[10px] font-bold text-red-600 uppercase">Déficit Total Calc.</span>
                                    <span className="text-2xl font-black text-red-700">{selectedSah.snapshot_deficit_kits}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Itens Solicitados ao Estado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                    <span className="text-3xl font-black text-slate-800 block">{selectedSah.oficio_qtde_cesta_basica}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">Cestas</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                    <span className="text-3xl font-black text-slate-800 block">{selectedSah.oficio_qtde_kit_higiene_limpeza}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">Higiene</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                    <span className="text-3xl font-black text-slate-800 block">{selectedSah.oficio_qtde_colchao}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">Colchões</span>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                    <span className="text-3xl font-black text-slate-800 block">{selectedSah.oficio_qtde_jogo_lencol}</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">Dormitório</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-4">
                    {selectedSah.status === 'rascunho' && (
                        <button 
                            onClick={() => handleUpdateStatus('enviado')} 
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md flex justify-center items-center gap-2"
                        >
                            <Send size={18} /> Transmitir Oficialmente (Finalizar Rascunho)
                        </button>
                    )}
                    {selectedSah.status === 'enviado' && (
                        <button 
                            onClick={() => handleUpdateStatus('recebido')} 
                            disabled={loading}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-md flex justify-center items-center gap-2"
                        >
                            <CheckCircle size={18} /> Confirmar Recebimento Físico dos Kits
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderEtapa1 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-3">1. Identificação do Desastre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Vincular REDAP (Opcional)</label>
                    <select 
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-semibold text-slate-700 transition-colors bg-slate-50"
                        value={sahData.evento_id || ''}
                        onChange={(e) => handleRedapSelect(e.target.value)}
                    >
                        <option value="">-- Não vincular / Sem REDAP --</option>
                        {redaps.map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">COBRADE (Opcional)</label>
                    <select 
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-semibold text-slate-700 transition-colors bg-slate-50"
                        value={sahData.cobrade}
                        onChange={(e) => handleInputChange('cobrade', e.target.value)}
                    >
                        <option value="">-- Selecione o COBRADE --</option>
                        {COBRADES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Data do Desastre</label>
                    <input 
                        type="date" 
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-semibold text-slate-700 transition-colors bg-slate-50" 
                        value={sahData.data_desastre} 
                        onChange={(e) => handleInputChange('data_desastre', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Decreto de Emergência (Opcional)</label>
                    <input 
                        type="text" 
                        className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-semibold text-slate-700 transition-colors bg-slate-50" 
                        placeholder="Nº do Decreto Municipal..." 
                        value={sahData.decreto_emergencia}
                        onChange={(e) => handleInputChange('decreto_emergencia', e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Pessoas Desalojadas (Estimativa Manual)</label>
                    <input 
                        type="number" 
                        className="w-full md:w-1/2 p-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-black text-slate-800 transition-colors bg-slate-50" 
                        placeholder="Qtd. Desalojados fora dos abrigos..." 
                        value={sahData.snapshot_desalojados || ''}
                        onChange={(e) => handleInputChange('snapshot_desalojados', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">*Desabrigados são contabilizados automaticamente pelo sistema de abrigos ativos.</p>
                </div>
            </div>
            
            <div className="mt-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Descrição Situacional Rápida</label>
                <textarea 
                    rows={4} 
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 font-medium text-slate-700 transition-colors bg-slate-50 resize-none" 
                    placeholder="Descreva o cenário e os principais danos registrados para constar no ofício..."
                    value={sahData.descricao_situacao}
                    onChange={(e) => handleInputChange('descricao_situacao', e.target.value)}
                />
            </div>
            
            <div className="flex justify-end mt-8 border-t border-slate-100 pt-6">
                <button 
                    onClick={() => {
                        fetchCrossReferenceData();
                        setEtapa(2);
                    }}
                    className="px-8 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all font-black flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    Avançar para Cálculo Snapshot <CheckCircle size={18} />
                </button>
            </div>
        </div>
    );

    const renderEtapa2 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-4">
                <h3 className="text-xl font-black text-slate-800">2. Cálculo do Snapshot (Déficit)</h3>
                <button onClick={fetchCrossReferenceData} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm font-bold bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-xl">
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Recalcular 
                </button>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl mb-6 flex gap-4 items-start shadow-sm">
                <Info className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    Os dados abaixo representam a <strong>fotografia do momento</strong>. 
                    O cálculo de déficit usa a fórmula: <span className="font-black bg-amber-200/50 px-1 rounded">Desabrigados + (Desalojados × 40%) - Kits Entregues</span>, baseada na IN Conjunta SEADH/CEPDEC 01/2014.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <Building2 className="text-slate-400 mb-3" size={28} />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Desabrigados</span>
                    <span className="text-4xl font-black text-slate-800">{sahData.snapshot_desabrigados}</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-semibold">Sistema de Abrigos</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <Users className="text-slate-400 mb-3" size={28} />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Desalojados</span>
                    <span className="text-4xl font-black text-slate-800">{sahData.snapshot_desalojados}</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-semibold">Estimativa Manual</span>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group transition-colors">
                    <Archive className="text-slate-400 mb-3" size={28} />
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Kits Entregues</span>
                    <span className="text-4xl font-black text-slate-800">{sahData.snapshot_kits_entregues}</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-semibold">Distribuição Local</span>
                </div>
                <div className="bg-red-600 p-6 rounded-2xl border-2 border-red-700 shadow-md shadow-red-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <AlertTriangle className="text-red-500/30 absolute -right-4 -bottom-4" size={100} />
                    <span className="text-[10px] text-red-200 font-black uppercase tracking-widest mb-1 relative z-10">Déficit (Kits)</span>
                    <span className="text-5xl font-black text-white relative z-10 drop-shadow-md">{sahData.snapshot_deficit_kits}</span>
                    <span className="text-[10px] text-red-100 font-bold mt-2 relative z-10">Necessidade Real Calc.</span>
                </div>
            </div>

            <div className="flex justify-between mt-10 border-t border-slate-100 pt-6">
                <button onClick={() => setEtapa(1)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">Voltar</button>
                <button onClick={() => setEtapa(3)} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-md transition-all font-black flex items-center gap-2">Próxima Etapa <ArrowLeft className="rotate-180" size={18}/></button>
            </div>
        </div>
    );

    const renderEtapa3 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-3">3. Dados Complementares (Ofício/Relatório)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-5 text-sm uppercase tracking-wide"><Users size={18} className="text-blue-600"/> Téc. Assistência Social</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Nome Completo</label>
                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700" placeholder="Nome do Profissional..." value={sahData.assistente_social_nome} onChange={e => handleInputChange('assistente_social_nome', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Registro CRESS</label>
                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-700" placeholder="Ex: 1234/ES" value={sahData.assistente_social_cress} onChange={e => handleInputChange('assistente_social_cress', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-5 text-sm uppercase tracking-wide"><MapPin size={18} className="text-blue-600"/> Encaminhamentos Adotados</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${sahData.encaminhamentos_cras ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={sahData.encaminhamentos_cras} onChange={e => handleInputChange('encaminhamentos_cras', e.target.checked)} /> 
                            <span className={`text-sm font-bold ${sahData.encaminhamentos_cras ? 'text-blue-800' : 'text-slate-600'}`}>CRAS</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${sahData.encaminhamentos_creas ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={sahData.encaminhamentos_creas} onChange={e => handleInputChange('encaminhamentos_creas', e.target.checked)} /> 
                            <span className={`text-sm font-bold ${sahData.encaminhamentos_creas ? 'text-blue-800' : 'text-slate-600'}`}>CREAS</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${sahData.encaminhamentos_abrigo ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={sahData.encaminhamentos_abrigo} onChange={e => handleInputChange('encaminhamentos_abrigo', e.target.checked)} /> 
                            <span className={`text-sm font-bold ${sahData.encaminhamentos_abrigo ? 'text-blue-800' : 'text-slate-600'}`}>Abrigo</span>
                        </label>
                        <label className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${sahData.encaminhamentos_aluguel_social ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}>
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={sahData.encaminhamentos_aluguel_social} onChange={e => handleInputChange('encaminhamentos_aluguel_social', e.target.checked)} /> 
                            <span className={`text-sm font-bold ${sahData.encaminhamentos_aluguel_social ? 'text-blue-800' : 'text-slate-600'}`}>Aluguel Social</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4 text-sm uppercase tracking-wide"><Archive size={18} className="text-blue-600" /> Tabela Final da Solicitação</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-5 rounded-2xl shadow-sm text-center">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Cestas Básicas</label>
                        <input type="number" className="w-full p-2 border-b-2 border-slate-600 bg-transparent text-3xl font-black text-white focus:outline-none focus:border-blue-500 text-center" value={sahData.oficio_qtde_cesta_basica} onChange={e => handleInputChange('oficio_qtde_cesta_basica', parseInt(e.target.value)||0)} />
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl shadow-sm text-center">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Kits Higiene</label>
                        <input type="number" className="w-full p-2 border-b-2 border-slate-600 bg-transparent text-3xl font-black text-white focus:outline-none focus:border-blue-500 text-center" value={sahData.oficio_qtde_kit_higiene_limpeza} onChange={e => handleInputChange('oficio_qtde_kit_higiene_limpeza', parseInt(e.target.value)||0)} />
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl shadow-sm text-center">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Colchões</label>
                        <input type="number" className="w-full p-2 border-b-2 border-slate-600 bg-transparent text-3xl font-black text-white focus:outline-none focus:border-blue-500 text-center" value={sahData.oficio_qtde_colchao} onChange={e => handleInputChange('oficio_qtde_colchao', parseInt(e.target.value)||0)} />
                    </div>
                    <div className="bg-slate-800 p-5 rounded-2xl shadow-sm text-center">
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Kit Dormitório</label>
                        <input type="number" className="w-full p-2 border-b-2 border-slate-600 bg-transparent text-3xl font-black text-white focus:outline-none focus:border-blue-500 text-center" value={sahData.oficio_qtde_jogo_lencol} onChange={e => handleInputChange('oficio_qtde_jogo_lencol', parseInt(e.target.value)||0)} />
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-10 border-t border-slate-100 pt-6">
                <button onClick={() => setEtapa(2)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">Voltar</button>
                <button onClick={() => setEtapa(4)} className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 shadow-md transition-all font-black flex items-center gap-2">Revisão e Documentos <ArrowLeft className="rotate-180" size={18}/></button>
            </div>
        </div>
    );

    const renderEtapa4 = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-slate-100 pb-3 gap-4">
                <h3 className="text-xl font-black text-slate-800">4. Geração de Documentos</h3>
                <button onClick={() => handleSaveToDB('rascunho')} disabled={loading} className="text-sm font-black text-slate-600 bg-slate-100 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-2">
                    {loading ? 'Salvando...' : <><Archive size={16}/> Salvar Rascunho</>}
                </button>
            </div>
            
            <p className="text-slate-600 text-sm font-medium">O sistema estruturou os documentos baseados nos normativos da CEPDEC. Baixe-os para assinatura digital (e-Docs) ou física antes de finalizar a transmissão do pedido.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <button className="flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 transition-all text-left group">
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={28} /></div>
                    <div className="flex-1">
                        <div className="font-black text-slate-800 group-hover:text-blue-700 transition-colors">Relatório Social (.docx)</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Modelo Oficial CEPDEC/ES</div>
                    </div>
                    <FileDown size={24} className="ml-auto text-slate-300 group-hover:text-blue-500" />
                </button>
                
                <button className="flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 transition-all text-left group">
                    <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all"><FileText size={28} /></div>
                    <div className="flex-1">
                        <div className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">Ofício de Solicitação (.docx)</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Portaria 606-R/2022</div>
                    </div>
                    <FileDown size={24} className="ml-auto text-slate-300 group-hover:text-emerald-500" />
                </button>
            </div>

            <div className="flex justify-between mt-10 border-t border-slate-100 pt-6">
                <button onClick={() => setEtapa(3)} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">Voltar</button>
                <button onClick={() => setEtapa(5)} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all font-black flex items-center gap-2">
                    Avançar para Envio <CheckCircle size={18} />
                </button>
            </div>
        </div>
    );

    const renderEtapa5 = () => (
        <div className="space-y-6 animate-in zoom-in-95 duration-500 text-center py-12">
            <div className="mx-auto bg-emerald-100 text-emerald-600 w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100 border-4 border-white ring-4 ring-emerald-50">
                <Send size={48} className="ml-2" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">Finalizar Protocolo SAH</h3>
            <p className="text-slate-600 max-w-md mx-auto text-sm mt-2 leading-relaxed font-medium">
                Ao transmitir, os quantitativos e as informações sociais atuais serão travados no histórico deste protocolo <strong className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{protocolo}</strong> para posterior prestação de contas.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={() => setEtapa(4)} className="px-8 py-3.5 border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold">
                    Revisar Documentos
                </button>
                <button onClick={() => handleSaveToDB('enviado')} disabled={loading} className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-200/50 transition-all font-black flex items-center justify-center gap-2 transform hover:-translate-y-1">
                    {loading ? 'Processando...' : <><CheckCircle size={20} /> Confirmar Transmissão Oficial</>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50/50 min-h-screen pb-24 font-sans text-slate-800 selection:bg-blue-200">
            {/* Minimal Header */}
            <header className="bg-white sticky top-0 z-30 border-b border-slate-200 px-6 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    {view !== 'list' && (
                        <button onClick={() => {
                            if (view === 'wizard') setView('list');
                            else if (view === 'detail') { setView('list'); setSelectedSah(null); }
                        }} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-sm font-black text-slate-800 tracking-wide">ASSISTÊNCIA HUMANITÁRIA</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Módulo SAH • Defesa Civil</p>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 max-w-6xl mx-auto mt-2">
                {view === 'list' && renderList()}
                {view === 'detail' && selectedSah && renderDetail()}
                
                {view === 'wizard' && (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header Wizard */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <Archive size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">{sahData.id ? 'Editar Solicitação' : 'Nova Solicitação SAH'}</h2>
                                    <p className="text-sm text-slate-400 font-medium">{sahData.id ? 'Atualize os dados em rascunho' : 'Fluxo assistido de solicitação e prestação de contas'}</p>
                                </div>
                            </div>
                            <div className="bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-black border border-white/20 flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                                {protocolo}
                            </div>
                        </div>

                        {/* Stepper */}
                        <div className="px-8 py-10 border-b border-slate-100 bg-white">
                            <div className="flex justify-between relative max-w-4xl mx-auto">
                                <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
                                <div className="absolute top-1/2 left-0 h-2 bg-blue-600 -z-10 -translate-y-1/2 transition-all duration-700 ease-in-out rounded-full shadow-sm" style={{ width: `${(etapa - 1) * 25}%` }}></div>
                                
                                {[1, 2, 3, 4, 5].map((step) => (
                                    <div key={step} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm transition-all duration-500 ease-out transform
                                        ${etapa === step ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-200 ring-4 ring-blue-50' : 
                                          etapa > step ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' : 'bg-white text-slate-300 border-2 border-slate-100'}
                                    `}>
                                        {etapa > step ? <CheckCircle size={24} /> : step}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-between max-w-4xl mx-auto mt-5 px-1 hidden md:flex">
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12 text-center ${etapa >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>Identificar</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12 text-center ${etapa >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>Snapshot</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12 text-center ${etapa >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>Dados</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12 text-center ${etapa >= 4 ? 'text-blue-600' : 'text-slate-400'}`}>Docs</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12 text-center ${etapa >= 5 ? 'text-blue-600' : 'text-slate-400'}`}>Enviar</span>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-8 md:p-12 min-h-[500px] bg-white">
                            {etapa === 1 && renderEtapa1()}
                            {etapa === 2 && renderEtapa2()}
                            {etapa === 3 && renderEtapa3()}
                            {etapa === 4 && renderEtapa4()}
                            {etapa === 5 && renderEtapa5()}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
