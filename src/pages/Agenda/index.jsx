import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, CheckCircle, Calendar as CalendarIcon, List, LayoutDashboard, AlertCircle, Plus,
    Clock, CheckCircle2, ChevronLeft, ChevronRight, Filter, AlertTriangle, X, Link, Search, RefreshCcw
} from 'lucide-react';
import { getAllVistoriasLocal, getAllAgendaLocal, saveAgendaOffline, deleteAgendaLocal, pullAllData } from '../../services/db';
import { toast } from '../../components/ToastNotification';
import { format, addDays, differenceInDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import bairrosDataRaw from '../../../Bairros.json';
import logradourosDataRaw from '../../../nomesderuas.json';

// Normalize data for searchable inputs
const logradourosData = logradourosDataRaw
    .filter(item => item["Logradouro (Rua, Av. e etc)"])
    .map(item => ({
        nome: item["Logradouro (Rua, Av. e etc)"].trim(),
        bairro: item["Bairro"] ? item["Bairro"].trim() : ""
    }));

const bairrosData = bairrosDataRaw
    .filter(b => b.nome)
    .map(b => ({ nome: b.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

const SearchableInput = ({
    label,
    value,
    onChange,
    options, // Can be array of strings or array of { value, label, isLinked, subLabel }
    placeholder,
    icon: IconComponent,
    labelClasses,
    inputClasses,
    renderOption // Optional custom render function
}) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const getLabel = (opt) => typeof opt === 'string' ? opt : opt.label;
    const getValue = (opt) => typeof opt === 'string' ? opt : opt.value;

    const filteredOptions = options.filter(opt => {
        const text = getLabel(opt).toLowerCase();
        return text.includes(search.toLowerCase());
    });

    const selectedLabel = useMemo(() => {
        if (!value) return '';
        const found = options.find(o => getValue(o) === value);
        return found ? getLabel(found) : value;
    }, [value, options]);

    return (
        <div className="relative">
            <label className={labelClasses}>{label}</label>
            <div className="relative group">
                {IconComponent && <IconComponent size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />}
                <div
                    onClick={() => setIsOpen(true)}
                    className={`${inputClasses} ${IconComponent ? 'pl-12' : ''} cursor-pointer min-h-[52px] flex items-center justify-between pr-4`}
                >
                    <span className={value ? 'text-slate-800 dark:text-white truncate pr-2' : 'text-slate-300 dark:text-slate-600 truncate pr-2'}>
                        {selectedLabel || placeholder}
                    </span>
                    <Search size={16} className="text-slate-300 shrink-0" />
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl mx-auto flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">{label}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    autoFocus
                                    className={`${inputClasses} pl-12 text-black dark:text-white border border-slate-200 dark:border-slate-700`}
                                    placeholder="Comece a digitar para filtrar..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-4 custom-scrollbar space-y-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => {
                                    const optValue = getValue(opt);
                                    const optLabel = getLabel(opt);
                                    const isSelected = value === optValue;
                                    const isLinked = opt.isLinked;
                                    
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                onChange(optValue);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group relative overflow-hidden ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {isLinked && !isSelected && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                                            )}
                                            
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-2">
                                                    {optLabel}
                                                    {isLinked && !isSelected && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 uppercase font-black tracking-tighter">Vinculado</span>
                                                    )}
                                                </span>
                                                {opt.subLabel && <span className={`text-[10px] font-medium opacity-60 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{opt.subLabel}</span>}
                                            </div>
                                            
                                            {isSelected && <CheckCircle size={18} className="ml-2 shrink-0" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="p-10 text-center space-y-2 opacity-50">
                                    <Search size={32} className="mx-auto text-slate-300" />
                                    <p className="font-bold text-sm">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

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
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    
    // User role check
    const [isCoordinator, setIsCoordinator] = useState(false);
    
    // Daily Prioritárias Filtro
    const [showingPrioritarias, setShowingPrioritarias] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [agendaToDelete, setAgendaToDelete] = useState(null);
    const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'integrados', 'pendentes'
    
    // Modal & Linking States
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [agendaToLink, setAgendaToLink] = useState(null);
    const [selectedLinkId, setSelectedLinkId] = useState('');
    
    // Details View State
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    
    const [formData, setFormData] = useState({
        numero_processo: '',
        data_abertura: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        categoria_risco: '',
        solicitante: '',
        endereco: '',
        bairro: '',
        informacoes_complementares: '',
        status: 'Protocolada',
        vistoria_id: '',
        data_atendimento: null
    });

    const resetForm = () => {
        setFormData({
            numero_processo: '',
            data_abertura: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            categoria_risco: '',
            solicitante: '',
            endereco: '',
            bairro: '',
            informacoes_complementares: '',
            status: 'Protocolada',
            vistoria_id: '',
            data_atendimento: null
        });
    };

    const handleProcessoMask = (value) => {
        // Formato YYYY-XXXXX (Ano - Numero/Letra)
        const v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (v.length <= 4) return v;
        return `${v.slice(0, 4)}-${v.slice(4, 9)}`;
    };

    useEffect(() => {
        const load = async (forcePull = false) => {
            if (forcePull) setRefreshing(true);
            try {
                if (forcePull && navigator.onLine) {
                    await pullAllData(true);
                }
                // Check Role
                const localStr = localStorage.getItem('userProfile');
                if (localStr) {
                    const prof = JSON.parse(localStr);
                    const isCoord = ['Admin', 'Administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Secretário'].includes(prof.role);
                    setIsCoordinator(isCoord);
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

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
                    let targetDate = new Date();
                    targetDate.setHours(0, 0, 0, 0);

                    if (linkedVistoria) {
                        targetDate = new Date(linkedVistoria.data_hora || linkedVistoria.createdAt || linkedVistoria.created_at || today);
                        targetDate.setHours(0, 0, 0, 0);
                    }
                    
                    const diasRestantes = differenceInDays(limitInfo.dataLimite, targetDate);
                    
                    const baseStatus = item.status || (item.is_legacy_vistoria ? item.status : 'Protocolada');
                    // If linked vistoria exists and has a conclusion status, use it
                    const finalStatus = linkedVistoria?.status === 'Finalizada' ? 'Concluída' : baseStatus;
                    const statusOperacional = getVistoriaStatus(finalStatus, !!item.vistoria_id);
                    
                    const riscoColor = getStatusColor(diasRestantes, limitInfo.prazoDias);
                    
                    const dataAtendimento = linkedVistoria ? (linkedVistoria.data_hora || linkedVistoria.createdAt || linkedVistoria.created_at) : null;
                    
                    return {
                        ...item,
                        ...limitInfo,
                        diasRestantes,
                        statusOperacional,
                        riscoColor,
                        data_atendimento: dataAtendimento,
                        linkedVistoria: linkedVistoria || (item.is_legacy_vistoria ? item : null)
                    };
                });
                
                setAgendas(processadas);
            } catch (err) {
                console.error("Erro ao carregar agenda", err);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };

        if (!initialLoadDone) {
            load(true);
            setInitialLoadDone(true);
        } else {
            load();
        }
    }, [showModal, showLinkModal, showDeleteModal, refreshCount]);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        try {
            if (!navigator.onLine) {
                toast.warning('Offline', 'Você precisa de internet para buscar novos dados.');
                return;
            }
            await pullAllData(true);
            // After pull, we need to reload from local too
            const [dbVistorias, dbAgendas] = await Promise.all([
                getAllVistoriasLocal(),
                getAllAgendaLocal()
            ]);
            setVistoriasBase(dbVistorias);
            
            // Re-process the list (simplified version of the logic in useEffect)
            // Actually, triggers by changing a dummy state is easier, but let's just trigger the reload logic
            // Using a hack to re-run the useEffect: we can add a refresh counter
        } catch (e) {
            console.error(e);
            toast.error('Erro', 'Falha ao atualizar dados.');
        } finally {
            setRefreshing(false);
            // Trigger local reload by toggling a state or just calling the logic again.
            // But useEffect already runs on mount. Let's add a state refreshCount.
            setRefreshCount(prev => prev + 1);
        }
    };

    const vistoriasOptions = useMemo(() => {
        // Find all vistoria_ids already used in agenda items TO HIGHLIGHT
        const linkedIds = new Set(agendas.map(a => a.vistoria_id).filter(Boolean));
        
        return vistoriasBase
            .map(v => {
                const vid = v.vistoria_id || v.id;
                return {
                    value: vid, // Store the actual ID
                    label: `${vid} - ${v.endereco || 'Sem endereço'}`,
                    subLabel: `${v.status || 'Nova'} • ${v.bairro || 'Sem bairro'} • ${v.solicitante || 'Sem solicitante'}`,
                    isLinked: linkedIds.has(vid),
                    numId: parseInt(String(vid).replace(/\D/g, '')) || 0
                };
            })
            // Sort numerically (ascending handles 2024 before 2025, but usually we want newest first)
            // Let's do descending so newest IDs are at top
            .sort((a, b) => b.numId - a.numId);
    }, [vistoriasBase, agendas]);

    const filteredAgendas = useMemo(() => {
        let f = agendas;
        
        // Filtro por integração
        if (filterStatus === 'integrados') {
            f = f.filter(v => !!v.vistoria_id || v.is_legacy_vistoria);
        } else if (filterStatus === 'pendentes') {
            f = f.filter(v => !v.vistoria_id && !v.is_legacy_vistoria);
        }

        if (showingPrioritarias) {
            f = f.filter(v => 
                v.statusOperacional !== 'Concluída' && 
                (v.diasRestantes <= 1 || isSameDay(new Date(v.dataLimite), new Date()))
            );
        }
        return f.sort((a, b) => a.diasRestantes - b.diasRestantes);
    }, [agendas, showingPrioritarias, filterStatus]);

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
            toast.warning('Campos Obrigatórios', 'Preencha Número do Processo, Data e Risco.');
            return;
        }
        
        try {
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            
            // Calcular data limite antes de salvar para persistir no banco
            const { dataLimite } = calculateLimit(formData.data_abertura, formData.categoria_risco);

            // Verificar se há uma vistoria vinculada selecionada para pegar a data de atendimento
            let dataAtendimento = formData.data_atendimento;
            if (formData.vistoria_id) {
                const vist = vistoriasBase.find(v => (v.vistoria_id === formData.vistoria_id || v.id === formData.vistoria_id));
                if (vist) dataAtendimento = vist.data_hora || vist.createdAt || vist.created_at;
            }

            await saveAgendaOffline({
                ...formData,
                data_limite: dataLimite.toISOString(),
                data_atendimento: dataAtendimento,
                created_by: userProfile.id || null
            });

            setShowModal(false);
            resetForm();
            toast.success('Sucesso', formData.id ? 'Agendamento atualizado!' : 'Agendamento salvo com sucesso!');
        } catch (e) {
            console.error('Erro ao salvar agenda:', e);
            toast.error('Erro', 'Falha ao salvar o agendamento.');
        }
    };

    const handleEdit = (agenda, e) => {
        if (e) e.stopPropagation();
        setFormData({
            ...agenda,
            data_abertura: agenda.data_abertura ? format(new Date(agenda.data_abertura), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            vistoria_id: agenda.vistoria_id || ''
        });
        setShowModal(true);
    };

    const handleDeleteClick = (agenda, e) => {
        if (e) e.stopPropagation();
        setAgendaToDelete(agenda);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await deleteAgendaLocal(agendaToDelete.id);
            toast.success('Excluído', 'Agendamento removido com sucesso.');
            setShowDeleteModal(false);
            setAgendaToDelete(null);
        } catch (e) {
            console.error(e);
            toast.error('Erro', 'Falha ao excluir.');
        }
    };

    const handleShowDetails = (agenda, e) => {
        if (e) e.stopPropagation();
        setSelectedAgenda(agenda);
        setShowDetailsModal(true);
    };

    const handleOpenLinkModal = (agenda, e) => {
        e.stopPropagation();
        setAgendaToLink(agenda);
        setSelectedLinkId(agenda.vistoria_id || '');
        setShowLinkModal(true);
    };

    const handleSaveLink = async () => {
        try {
            const vist = vistoriasBase.find(v => (v.vistoria_id === selectedLinkId || v.id === selectedLinkId));
            const dataAtendimento = vist ? (vist.data_hora || vist.createdAt || vist.created_at) : null;

            await saveAgendaOffline({
                ...agendaToLink,
                vistoria_id: selectedLinkId || null,
                data_atendimento: dataAtendimento
            });
            toast.success('Sucesso', 'Vistoria vinculada com sucesso!');
            setShowLinkModal(false);
            setAgendaToLink(null);
        } catch (e) {
            console.error(e);
            toast.error('Erro', 'Erro ao vincular.');
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
                    <button 
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className={`p-3 rounded-2xl border transition-all ${refreshing ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-500'}`}
                        title="Atualizar Dados"
                    >
                        <RefreshCcw size={20} className={refreshing ? 'animate-spin' : ''} />
                    </button>
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

            {/* BOTÕES DE FILTRO E PRIORIDADE */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setFilterStatus('todos')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'todos' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setFilterStatus('integrados')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'integrados' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                    >
                        Vinculados
                    </button>
                    <button 
                        onClick={() => setFilterStatus('pendentes')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'pendentes' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                    >
                        Pendentes
                    </button>
                </div>

                <button 
                    onClick={() => setShowingPrioritarias(!showingPrioritarias)}
                    className={`px-6 py-3 rounded-[16px] font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all ${showingPrioritarias ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-400'}`}
                >
                    <AlertTriangle size={16} className={showingPrioritarias ? 'animate-pulse' : 'text-red-500'} />
                    {showingPrioritarias ? 'Exibindo Prioritárias' : 'Filtrar Prioritárias'}
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
                                <div key={v.id || v.agenda_id} className={`flex justify-between items-center p-4 rounded-[16px] border ${v.riscoColor.border} ${v.riscoColor.bg} cursor-pointer hover:scale-[1.01] transition-transform shadow-sm group`} onClick={(e) => handleShowDetails(v, e)}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${v.riscoColor.text}`}>{v.riscoColor.label}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-300 uppercase font-bold">{v.numero_processo}</span>
                                            {v.linkedVistoria && (
                                                <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase flex items-center gap-1"><Link size={10}/> Integrada</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className={`font-black ${v.riscoColor.text}`}>{v.categoria_risco || 'Geral'}</h4>
                                            {!v.linkedVistoria && !v.is_legacy_vistoria && isCoordinator && (
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => handleOpenLinkModal(v, e)} className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 rounded text-slate-500 hover:text-blue-600 transition-colors">Vincular</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(v); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 size={12}/></button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs opacity-70 mt-0.5">{v.endereco || 'Endereço não informado'}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`text-2xl font-black ${v.riscoColor.text} leading-none`}>{v.diasRestantes}</div>
                                            <div className="text-[9px] uppercase tracking-widest font-bold opacity-70">Dias Restantes</div>
                                        </div>
                                        {isCoordinator && (
                                            <button onClick={(e) => handleDeleteClick(v, e)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
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
                                    <th className="p-4">Atendimento</th>
                                    <th className="p-4">Status Integração</th>
                                    <th className="p-4">Prazo Real</th>
                                    {isCoordinator && <th className="p-4">Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAgendas.map((v) => (
                                    <tr key={v.id || v.agenda_id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{v.numero_processo || 'NOVO'}</div>
                                            <div className="text-xs text-slate-500 truncate max-w-[150px]">
                                                {v.endereco}{v.bairro ? `, ${v.bairro}` : ''}
                                            </div>
                                            {v.solicitante && <div className="text-[9px] text-slate-400">Req: {v.solicitante}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{v.categoria_risco}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Regra: {v.prazoDias} dias</div>
                                        </td>
                                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{format(new Date(v.data_abertura), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">{format(new Date(v.dataLimite), 'dd/MM/yyyy')}</td>
                                        <td className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {v.data_atendimento ? format(new Date(v.data_atendimento), 'dd/MM/yyyy') : 'Pendente'}
                                        </td>
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
                                                {!v.linkedVistoria && !v.is_legacy_vistoria && isCoordinator && (
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
                                        {isCoordinator && (
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEdit(v)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDeleteClick(v)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filteredAgendas.length === 0 && (
                                    <tr>
                                        <td colSpan={isCoordinator ? 7 : 6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum agendamento encontrado.</td>
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
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{formData.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Restrito Coordenadoria</p>
                            </div>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
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
                                        onChange={(e) => setFormData({...formData, numero_processo: handleProcessoMask(e.target.value)})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: 2026-A001"
                                        maxLength={10}
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
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Solicitante</label>
                                <input 
                                    type="text" 
                                    value={formData.solicitante}
                                    onChange={(e) => setFormData({...formData, solicitante: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nome do morador"
                                />
                            </div>

                            <div className="space-y-4 pt-2">
                                <SearchableInput
                                    label="Logradouro *"
                                    placeholder="Rua, Avenida..."
                                    value={formData.endereco}
                                    onChange={val => {
                                        const found = logradourosData.find(l => l.nome.toLowerCase() === val.toLowerCase());
                                        setFormData(prev => ({
                                            ...prev,
                                            endereco: val,
                                            bairro: found ? found.bairro : prev.bairro
                                        }));
                                    }}
                                    options={logradourosData
                                        .filter(l => !formData.bairro || l.bairro === formData.bairro)
                                        .map(l => l.nome)
                                        .sort()}
                                    labelClasses="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1"
                                    inputClasses="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <SearchableInput
                                    label="Bairro *"
                                    placeholder="Selecione o bairro..."
                                    value={formData.bairro}
                                    onChange={val => setFormData({ ...formData, bairro: val })}
                                    options={bairrosData.map(b => b.nome).sort()}
                                    labelClasses="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1"
                                    inputClasses="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Informações Complementares</label>
                                    <input 
                                        type="text" 
                                        value={formData.informacoes_complementares}
                                        onChange={(e) => setFormData({...formData, informacoes_complementares: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none p-3 rounded-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Próximo à igreja, casa azul..."
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[16px] border border-blue-100 dark:border-blue-900/50">
                                <SearchableInput
                                    label="Vistoria Integrada (Opcional)"
                                    placeholder="Não integrar no momento (avulsa)"
                                    value={formData.vistoria_id}
                                    onChange={val => setFormData({ ...formData, vistoria_id: val })}
                                    options={vistoriasOptions.filter(opt => {
                                        // Optional: filter only non-finished ones, or specific logic
                                        return true;
                                    })}
                                    labelClasses="block text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1"
                                    inputClasses="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 p-3 rounded-[12px] font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                                    icon={Link}
                                />
                                <p className="text-[9px] text-blue-600/70 mt-2 font-bold leading-tight">Você pode integrar com um processo de vistoria que já foi criado no sistema pela equipe operacional.</p>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                            <button 
                                onClick={handleSaveNovoAgendamento}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest p-4 rounded-[16px] text-sm shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"
                            >
                                <CheckCircle2 size={18} /> {formData.id ? 'Salvar Alterações' : 'Cadastrar Agendamento'}
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

                        <div className="mb-8">
                            <SearchableInput
                                label="Processos Pendentes / Finalizados"
                                placeholder="Selecione ou busque o Nº..."
                                value={selectedLinkId}
                                onChange={setSelectedLinkId}
                                options={vistoriasOptions}
                                labelClasses="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2"
                                inputClasses="w-full bg-slate-50 dark:bg-slate-800 border-none p-4 rounded-[16px] font-bold text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-slate-400 mt-2 italic px-1">
                                <span className="text-emerald-500 font-black">●</span> Itens com tarja verde já estão vinculados.
                            </p>
                        </div>

                        <button onClick={handleSaveLink} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest p-4 rounded-[16px] text-xs shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                            <CheckCircle2 size={16} /> Confirmar Vínculo
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL DETALHES (INFORMAÇÕES) */}
            {showDetailsModal && selectedAgenda && (
                <div className="fixed inset-0 z-[140] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${selectedAgenda.riscoColor.bg}`}>
                                    <AlertCircle size={20} className={selectedAgenda.riscoColor.text} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">Detalhes da Agenda</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {selectedAgenda.id || 'Local'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Processo</label>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl inline-block">
                                        {selectedAgenda.numero_processo}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</label>
                                    <span className={`px-2 py-1 rounded-md text-[9px] uppercase font-black ${selectedAgenda.statusOperacional === 'Concluída' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {selectedAgenda.statusOperacional}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Tipo de Risco</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedAgenda.categoria_risco}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <Clock size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Protocolo em</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{format(new Date(selectedAgenda.data_abertura), 'dd/MM/yyyy HH:mm')}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon size={14} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-orange-500">Data Limite</label>
                                        <div className="text-xs font-black text-slate-800 dark:text-slate-100">{format(new Date(selectedAgenda.dataLimite), 'dd/MM/yyyy')} ({selectedAgenda.diasRestantes} dias restantes)</div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        <List size={14} className="text-slate-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Solicitante</label>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedAgenda.solicitante || 'Não informado'}</div>
                                    </div>
                                </div>

                                <div className="flex gap-3 border-t border-slate-50 dark:border-slate-800 pt-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                        <Search size={14} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400">Endereço Completo</label>
                                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                                            {selectedAgenda.endereco}
                                            {selectedAgenda.bairro && `, ${selectedAgenda.bairro}`}
                                        </div>
                                        {selectedAgenda.informacoes_complementares && (
                                            <div className="text-[9px] text-slate-400 mt-1 italic">Obs: {selectedAgenda.informacoes_complementares}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedAgenda.linkedVistoria && (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-between gap-3 border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase">Atendido em</p>
                                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                                                {format(new Date(selectedAgenda.data_atendimento), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/vistorias', { state: { selectedVistoria: selectedAgenda.linkedVistoria } })}
                                        className="p-2 bg-white dark:bg-emerald-800 rounded-xl text-emerald-600 shadow-sm hover:scale-105 transition-transform"
                                    >
                                        <Link size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="flex-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-black uppercase tracking-widest p-4 rounded-2xl text-xs border border-slate-100 dark:border-slate-600"
                            >
                                Fechar
                            </button>
                            {isCoordinator && (
                                <button 
                                    onClick={() => { setShowDetailsModal(false); handleEdit(selectedAgenda); }}
                                    className="px-6 bg-blue-600 text-white font-black uppercase tracking-widest p-4 rounded-2xl text-xs flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Agendamento?</h3>
                        <p className="text-sm text-slate-500 mb-6 font-bold">
                            Esta ação é irreversível. O processo <span className="text-red-500">{agendaToDelete?.numero_processo}</span> será removido da agenda.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest p-4 rounded-[16px] text-xs transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest p-4 rounded-[16px] text-xs shadow-lg shadow-red-500/30 transition-all"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Agenda;
