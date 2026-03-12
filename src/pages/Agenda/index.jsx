import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon, List, LayoutDashboard, AlertCircle, Plus,
    Clock, CheckCircle2, ChevronLeft, ChevronRight, Filter, AlertTriangle, X, Link, Search
} from 'lucide-react';
import { getAllVistoriasLocal, getAllAgendaLocal, saveAgendaOffline } from '../../services/db';
import { format, addDays, differenceInDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Constants for deadlines (in days)
const PRAZOS = {
    ESTRUTURAL: 3,
    GEOLOGICO: 3,
    ARVORE: 10,
    HIDROLOGICO: 2,
    DEFAULT: 10
};

// Helper: Calculate limits based on category and start date
const calculateLimit = (dataAbertura, categoriaRisco, subtipos = '') => {
    const protocoloDate = dataAbertura ? new Date(dataAbertura) : new Date();
    
    // Default 10 days
    let prazoDias = PRAZOS.DEFAULT;
    
    const cat = (categoriaRisco || '').toLowerCase();
    const sub = (subtipos || '').toLowerCase();
    const combinado = `${cat} ${sub}`;
    
    if (combinado.includes('estrutural') || combinado.includes('predial')) {
        prazoDias = PRAZOS.ESTRUTURAL;
    } else if (combinado.includes('geológico') || combinado.includes('geotécnico') || combinado.includes('deslizamento')) {
        prazoDias = PRAZOS.GEOLOGICO;
    } else if (combinado.includes('arvore') || combinado.includes('árvore')) {
        prazoDias = PRAZOS.ARVORE;
    } else if (combinado.includes('hidrológico') || combinado.includes('alagamento') || combinado.includes('inundação') || combinado.includes('enxurrada')) {
        prazoDias = PRAZOS.HIDROLOGICO;
    }
    
    const dataLimite = addDays(protocoloDate, prazoDias);
    return { dataProtocolo: protocoloDate, prazoDias, dataLimite };
};

const getStatusColor = (diasRestantes, prazoTotal) => {
    if (diasRestantes < 0) return { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-700 dark:text-red-400', label: 'Vencido', color: 'red' };
    if (diasRestantes <= 1) return { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-400', label: 'Crítico', color: 'orange' };
    if (diasRestantes <= (prazoTotal / 2)) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-400', label: 'Atenção', color: 'yellow' };
    return { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-700 dark:text-green-400', label: 'No Prazo', color: 'green' };
};

const getVistoriaStatus = (status, vinculado = false) => {
    if (status === 'Concluída' || status === 'Finalizada') return 'Concluída';
    if (status === 'Agendada' || vinculado) return 'Agendada';
    return 'Protocolada';
};

const Agenda = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('painel'); // 'painel', 'lista', 'agenda'
    const [agendas, setAgendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vistoriasBase, setVistoriasBase] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // User role check
    const [isCoordinator, setIsCoordinator] = useState(false);
    
    // Daily Prioritárias Filtro
    const [showingPrioritarias, setShowingPrioritarias] = useState(false);

    // Modal Setup
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [agendaToLink, setAgendaToLink] = useState(null);
    const [selectedLinkId, setSelectedLinkId] = useState('');
    
    const [formData, setFormData] = useState({
        numero_processo: '',
        data_abertura: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        categoria_risco: '',
        solicitante: '',
        endereco: '',
        status: 'Protocolada',
        vistoria_id: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                // Check Role
                const localStr = localStorage.getItem('userProfile');
                if (localStr) {
                    const prof = JSON.parse(localStr);
                    const isCoord = ['Admin', 'Administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Secretário'].includes(prof.role);
                    setIsCoordinator(isCoord);
                }

                const [dbVistorias, dbAgendas] = await Promise.all([
                    getAllVistoriasLocal(),
                    getAllAgendaLocal()
                ]);
                
                setVistoriasBase(dbVistorias);

                // Map Agendas
                const agendasLinkedIds = dbAgendas.map(a => a.vistoria_id).filter(Boolean);

                // Combine Agendas with Orphan Vistorias (Legacy compatibility)
                const orphanVistorias = dbVistorias.filter(v => {
                    const vid = v.vistoria_id || v.id || v.vistoriaId;
                    return !agendasLinkedIds.includes(vid);
                }).map(v => ({
                    ...v,
                    is_legacy_vistoria: true,
                    agenda_id: `v-${v.id}`,
                    numero_processo: v.vistoria_id || v.vistoriaId || 'Sem Processo',
                    data_abertura: v.data_hora || v.createdAt,
                    categoria_risco: v.categoriaRisco || v.categoria_risco || 'Geral'
                }));

                const combinedList = [...dbAgendas, ...orphanVistorias];

                const processadas = combinedList.map(item => {
                    const limitInfo = calculateLimit(
                        item.data_abertura, 
                        item.categoria_risco, 
                        item.is_legacy_vistoria ? item.subtiposRisco : ''
                    );
                    
                    // Check linked vistoria
                    let linkedVistoria = null;
                    if (item.vistoria_id) {
                        linkedVistoria = dbVistorias.find(v => (v.vistoria_id === item.vistoria_id || v.id === item.vistoria_id));
                    }

                    // Se vinculou, parar contagem na data do protocolo/criação da vistoria
                    let targetDate = today;
                    if (linkedVistoria) {
                        targetDate = new Date(linkedVistoria.data_hora || linkedVistoria.createdAt || linkedVistoria.created_at || today);
                        targetDate.setHours(0, 0, 0, 0);
                    }
                    
                    const diasRestantes = differenceInDays(limite, targetDate);
                    
                    const baseStatus = item.status || (item.is_legacy_vistoria ? item.status : 'Protocolada');
                    // If linked vistoria exists and has a conclusion status, use it
                    const finalStatus = linkedVistoria?.status === 'Finalizada' ? 'Concluída' : baseStatus;
                    const statusOperacional = getVistoriaStatus(finalStatus, !!item.vistoria_id);
                    
                    const riscoColor = getStatusColor(diasRestantes, limitInfo.prazoDias);
                    
                    return {
                        ...item,
                        ...limitInfo,
                        diasRestantes,
                        statusOperacional,
                        riscoColor,
                        linkedVistoria: linkedVistoria || (item.is_legacy_vistoria ? item : null)
                    };
                });
                
                setAgendas(processadas);
            } catch (err) {
                console.error("Erro ao carregar agenda", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [showModal, showLinkModal]);

    const filteredAgendas = useMemo(() => {
        let f = agendas;
        if (showingPrioritarias) {
            f = f.filter(v => 
                v.statusOperacional !== 'Concluída' && 
                (v.diasRestantes <= 1 || isSameDay(new Date(v.dataLimite), new Date()))
            );
        }
        return f.sort((a, b) => a.diasRestantes - b.diasRestantes);
    }, [agendas, showingPrioritarias]);

    const stats = useMemo(() => {
        const ativas = agendas.filter(v => v.statusOperacional !== 'Concluída');
        return {
            total: ativas.length,
            vencidas: ativas.filter(v => v.diasRestantes < 0).length,
            criticas: ativas.filter(v => v.diasRestantes === 0 || v.diasRestantes === 1).length,
            atencao: ativas.filter(v => v.riscoColor.color === 'yellow').length,
            tranquilas: ativas.filter(v => v.riscoColor.color === 'green').length,
            concluidas: agendas.filter(v => v.statusOperacional === 'Concluída').length
        };
    }, [agendas]);

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    const prevMonth = () => setCurrentMonth(addDays(monthStart, -1));
    const nextMonth = () => setCurrentMonth(addDays(monthEnd, 1));

    const handleSaveNovoAgendamento = async () => {
        if (!formData.numero_processo || !formData.data_abertura || !formData.categoria_risco) {
            alert('Preencha Número do Processo, Data e Risco obrigatoriamente.');
            return;
        }
        
        try {
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            await saveAgendaOffline({
                ...formData,
                created_by: userProfile.id || null
            });
            setShowModal(false);
            setFormData({
                numero_processo: '',
                data_abertura: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                categoria_risco: '',
                solicitante: '',
                endereco: '',
                status: 'Protocolada',
                vistoria_id: ''
            });
            alert('Agedamento salvo com sucesso!');
        } catch (e) {
            console.error('Erro ao salvar agenda:', e);
            alert('Falha ao salvar o agendamento.');
        }
    };

    const handleOpenLinkModal = (agenda, e) => {
        e.stopPropagation();
        setAgendaToLink(agenda);
        setSelectedLinkId(agenda.vistoria_id || '');
        setShowLinkModal(true);
    };

    const handleSaveLink = async () => {
        try {
            await saveAgendaOffline({
                ...agendaToLink,
                vistoria_id: selectedLinkId || null,
            });
            alert('Vistoria vinculada com sucesso!');
            setShowLinkModal(false);
            setAgendaToLink(null);
        } catch (e) {
            console.error(e);
            alert('Erro ao vincular.');
        }
    };


    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-bold tracking-widest uppercase">Carregando Agenda...</div>;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <CalendarIcon size={28} className="text-blue-500" />
                        Agenda de Vistorias
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Controle de Prazos e Agendamentos Administrativos
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[16px]">
                        <button 
                            onClick={() => setViewMode('painel')}
                            className={`px-4 py-2 rounded-[12px] text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'painel' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <LayoutDashboard size={14} /> Painel
                        </button>
                        <button 
                            onClick={() => setViewMode('lista')}
                            className={`px-4 py-2 rounded-[12px] text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'lista' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <List size={14} /> Lista
                        </button>
                        <button 
                            onClick={() => setViewMode('agenda')}
                            className={`px-4 py-2 rounded-[12px] text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <CalendarIcon size={14} /> Calendário
                        </button>
                    </div>

                    {/* Botão de Criação Restrito! */}
                    {isCoordinator && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-[16px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                        >
                            <Plus size={16} /> Novo Agendamento
                        </button>
                    )}
                </div>
            </div>

            {/* BOTÃO MODO PRIORITÁRIO (SEMPRE VISÍVEL) */}
            <div className="flex justify-end">
                <button 
                    onClick={() => setShowingPrioritarias(!showingPrioritarias)}
                    className={`px-6 py-3 rounded-[16px] font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all ${showingPrioritarias ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-400'}`}
                >
                    <AlertTriangle size={16} className={showingPrioritarias ? 'animate-pulse' : 'text-red-500'} />
                    {showingPrioritarias ? 'Exibindo Prioritárias do Dia' : 'Filtrar Prioritárias do Dia'}
                </button>
            </div>


            {/* VIEWS */}

            {/* 1. PAINEL DE PRIORIDADES */}
            {viewMode === 'painel' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-900 border-l-4 border-red-500 p-6 rounded-[24px] shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prazos Vencidos</span>
                            <div className="text-4xl font-black text-red-600 mt-2">{stats.vencidas}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border-l-4 border-orange-500 p-6 rounded-[24px] shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risco Crítico (1 dia)</span>
                            <div className="text-4xl font-black text-orange-500 mt-2">{stats.criticas}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border-l-4 border-yellow-500 p-6 rounded-[24px] shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atenção (Metade do prazo)</span>
                            <div className="text-4xl font-black text-yellow-500 mt-2">{stats.atencao}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border-l-4 border-emerald-500 p-6 rounded-[24px] shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Prazo (Tranquilo)</span>
                            <div className="text-4xl font-black text-emerald-500 mt-2">{stats.tranquilas}</div>
                        </div>
                    </div>

                    {/* Vistorias Mais Críticas Preview */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4">Top 5 Mais Críticas (Abertas)</h3>
                        <div className="space-y-3">
                            {filteredAgendas.filter(v => v.statusOperacional !== 'Concluída').slice(0, 5).map(v => (
                                <div key={v.id || v.agenda_id} className={`flex justify-between items-center p-4 rounded-[16px] border ${v.riscoColor.border} ${v.riscoColor.bg} ${v.linkedVistoria ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`} onClick={() => v.linkedVistoria && navigate('/vistorias', { state: { selectedVistoria: v.linkedVistoria } })}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${v.riscoColor.text}`}>{v.riscoColor.label}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300 uppercase font-bold">{v.numero_processo || 'S/ PROC'}</span>
                                            {v.linkedVistoria && (
                                                <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1"><Link size={10}/> Integrada</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-black ${v.riscoColor.text}`}>{v.categoria_risco || 'Geral'}</h4>
                                            {!v.linkedVistoria && !v.is_legacy_vistoria && (
                                                <button onClick={(e) => handleOpenLinkModal(v, e)} className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 rounded text-slate-500 hover:text-blue-600 transition-colors">Vincular</button>
                                            )}
                                        </div>
                                        <p className="text-xs opacity-70 mt-0.5">{v.endereco || 'Endereço não informado'}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-black ${v.riscoColor.text} leading-none`}>{v.diasRestantes}</div>
                                        <div className="text-[9px] uppercase tracking-widest font-bold opacity-70">Dias Restantes</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. LISTA DETALHADA */}
            {viewMode === 'lista' && (
                <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                    <th className="p-4">Processo</th>
                                    <th className="p-4">Risco / Categoria</th>
                                    <th className="p-4">Protocolo</th>
                                    <th className="p-4">Data Limite</th>
                                    <th className="p-4">Status Integração</th>
                                    <th className="p-4">Prazo Real</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgendas.map((v) => (
                                    <tr key={v.id || v.agenda_id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{v.numero_processo || 'NOVO'}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[150px]">{v.endereco}</div>
                                            {v.solicitante && <div className="text-[9px] text-slate-400">Req: {v.solicitante}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{v.categoria_risco}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Regra: {v.prazoDias} dias</div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{format(new Date(v.data_abertura), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{format(new Date(v.dataLimite), 'dd/MM/yyyy')}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-black ${v.statusOperacional === 'Concluída' ? 'bg-slate-100 text-slate-500' : v.statusOperacional === 'Agendada' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {v.statusOperacional}
                                                </span>
                                                {v.linkedVistoria && (
                                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded cursor-pointer" onClick={() => navigate('/vistorias', { state: { selectedVistoria: v.linkedVistoria } })}>
                                                        <Link size={10}/> Ver Vistoria
                                                    </span>
                                                )}
                                                {!v.linkedVistoria && !v.is_legacy_vistoria && (
                                                    <>
                                                        <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5 uppercase">Não Integrado</span>
                                                        <button onClick={(e) => handleOpenLinkModal(v, e)} className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-slate-500 hover:text-blue-600 transition-colors mt-1">Vincular Vistoria</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center min-w-[100px] ${v.riscoColor.bg} ${v.riscoColor.border}`}>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${v.riscoColor.text}`}>{v.riscoColor.label}</span>
                                                <span className={`text-xl font-black leading-none mt-1 ${v.riscoColor.text}`}>{v.diasRestantes} <span className="text-[10px]">dias</span></span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAgendas.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum agendamento encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. CALENDÁRIO (AGENDA) */}
            {viewMode === 'agenda' && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"><ChevronLeft size={20}/></button>
                            <button onClick={nextMonth} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"><ChevronRight size={20}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">{day}</div>
                        ))}
                        
                        {/* Placeholder para alinhar o primeiro dia do mês */}
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[100px] p-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl"></div>
                        ))}

                        {daysInMonth.map((date, i) => {
                            // Encontrar vistorias cujo prazo limite cai neste dia
                            const doDia = filteredAgendas.filter(v => isSameDay(new Date(v.dataLimite), date) && v.statusOperacional !== 'Concluída');
                            
                            return (
                                <div key={i} className={`min-h-[100px] p-2 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col gap-1 transition-all ${isSameDay(date, new Date()) ? 'ring-2 ring-blue-500 bg-blue-50/20 shadow-md' : 'bg-white dark:bg-slate-900'} hover:shadow-md hover:border-blue-300`}>
                                    <div className={`text-xs font-black self-end ${isSameDay(date, new Date()) ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {format(date, 'd')}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                                        {doDia.slice(0, 3).map(v => (
                                            <div key={v.id || v.agenda_id} title={`${v.numero_processo} - ${v.categoria_risco}`} className={`text-[9px] px-1.5 py-1 rounded-md border font-bold flex justify-between items-center ${v.riscoColor.bg} ${v.riscoColor.border} ${v.riscoColor.text}`}>
                                                <span className="truncate">{v.numero_processo || 'Novo'}</span>
                                                {v.linkedVistoria ? (
                                                    <Link size={8} className="cursor-pointer flex-shrink-0" onClick={() => navigate('/vistorias', { state: { selectedVistoria: v.linkedVistoria } })} />
                                                ) : !v.is_legacy_vistoria ? (
                                                    <button onClick={(e) => handleOpenLinkModal(v, e)} className="ml-1 text-slate-500 hover:text-blue-600 focus:outline-none flex-shrink-0"><Plus size={10}/></button>
                                                ) : null}
                                            </div>
                                        ))}
                                        {doDia.length > 3 && (
                                            <div className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">+ {doDia.length - 3} mais</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL DE NOVO AGENDAMENTO PARA O COORDENADOR */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Novo Agendamento</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Restrito Coordenadoria</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cód./Prot. Processo *</label>
                                    <input 
                                        type="text" 
                                        value={formData.numero_processo}
                                        onChange={(e) => setFormData({...formData, numero_processo: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: 2026/014"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Data de Abertura *</label>
                                    <input 
                                        type="datetime-local" 
                                        value={formData.data_abertura}
                                        onChange={(e) => setFormData({...formData, data_abertura: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tipo de Vistoria / Risco *</label>
                                <select 
                                    value={formData.categoria_risco}
                                    onChange={(e) => setFormData({...formData, categoria_risco: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Risco Estrutural">Risco Estrutural (Prazo 3 dias)</option>
                                    <option value="Risco Geológico">Risco Geológico (Prazo 3 dias)</option>
                                    <option value="Risco Hidrológico">Risco Hidrológico (Prazo 2 dias)</option>
                                    <option value="Risco de Queda de Árvore">Queda de Árvore (Prazo 10 dias)</option>
                                    <option value="Avaliação Preventiva">Avaliação Preventiva (Prazo 10 dias)</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Solicitante (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={formData.solicitante}
                                    onChange={(e) => setFormData({...formData, solicitante: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nome de quem solicitou"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Endereço do Chamado (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={formData.endereco}
                                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Logradouro e bairro"
                                />
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[16px] border border-blue-100 dark:border-blue-900/50">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1">
                                    <Link size={12}/> Vistoria Integrada (Opcional)
                                </label>
                                <select 
                                    value={formData.vistoria_id}
                                    onChange={(e) => setFormData({...formData, vistoria_id: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Não integrar no momento (avulsa)</option>
                                    {vistoriasBase.filter(v => v.status !== 'Finalizada').map(v => (
                                        <option key={v.id} value={v.vistoria_id || v.id}>{v.vistoria_id || v.id} - {v.endereco || 'Sem endereço'}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-blue-600/70 mt-2 font-bold leading-tight">Você pode integrar com um processo de vistoria que já foi criado no sistema pela equipe operacional.</p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={handleSaveNovoAgendamento}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest p-4 rounded-[16px] text-sm shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 size={18} /> Cadastrar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VINCULAR VISTORIA */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2"><Link size={20} className="text-blue-500"/> Vincular Vistoria</h3>
                            <button onClick={() => setShowLinkModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold leading-relaxed">
                            Vincular à agenda <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200">{agendaToLink?.numero_processo}</span> para <span className="text-blue-600 dark:text-blue-400">paralisar o prazo limite</span> usando a data em que ela foi gerada pela vistoria.
                        </p>

                        <div className="mb-6">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Processos Pendentes / Finalizados</label>
                            <select 
                                value={selectedLinkId}
                                onChange={(e) => setSelectedLinkId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-[16px] font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Não vincular a nenhuma</option>
                                {vistoriasBase.map(v => (
                                    <option key={v.id} value={v.vistoria_id || v.id}>{v.vistoria_id || v.id} - {v.endereco?.substring(0,25) || 'S/ endereço'} ({v.status || 'Nova'})</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleSaveLink} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest p-4 rounded-[16px] text-xs shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                            <CheckCircle2 size={16} /> Confirmar Vínculo
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Agenda;
