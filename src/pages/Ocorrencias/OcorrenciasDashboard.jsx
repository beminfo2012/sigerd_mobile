import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../App';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ArrowLeft, Search, Clock, CheckCircle,
    AlertTriangle, ShieldAlert, ChevronRight, MapPin, Trash2,
    Eye, ShieldCheck, RefreshCw, Loader2, FileText, Calendar, Printer, X
} from 'lucide-react';
import { generateConsolidatedReport } from '../../utils/ocorrenciaConsolidadoGenerator';
import { getOcorrenciasLocal, deleteOcorrenciaLocal, saveOcorrenciaLocal, OCORRENCIAS_SELECT_FIELDS, OCORRENCIAS_SELECT_FIELDS_LEGACY } from '../../services/ocorrenciasDb';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import OcorrenciaDrawer from './OcorrenciaDrawer';

export const OCORRENCIA_STATUSES = {
    'Pendente': { label: 'Pendente', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Em Análise': { label: 'Em Análise', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'Em Atendimento': { label: 'Em Atendimento', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'Atendido': { label: 'Atendido', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Finalizada': { label: 'Finalizada', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Cancelada': { label: 'Cancelada', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
};

const OcorrenciasDashboard = () => {
    const navigate = useNavigate();
    const { userProfile } = useContext(UserContext);
    const { toast } = useToast();
    const [records, setRecords] = useState([]);
    const [noprers, setNoprers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [statusModalRecord, setStatusModalRecord] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMode, setReportMode] = useState('periodo'); // 'periodo' | 'todos'
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [generatingConsolidated, setGeneratingConsolidated] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);

    useEffect(() => {
        document.title = 'SIGERD WEB';
        loadRecords();
        window.addEventListener('sync-complete', loadRecords);
        return () => window.removeEventListener('sync-complete', loadRecords);
    }, []);

    const loadRecords = async () => {
        try {
            // 1. Carregamento local instantâneo (0ms de atraso na UI)
            const localData = await getOcorrenciasLocal();
            if (localData && localData.length > 0) {
                setRecords(localData);
                setLoading(false);
            }

            // 2. Revalidação em segundo plano se online
            if (navigator.onLine) {
                try {
                    const { supabase } = await import('../../services/supabase');
                    
                    // Helper seguro: PostgrestBuilder implementa PromiseLike (then), mas NÃO possui .catch()
                    const safeFetch = async (queryPromise) => {
                        try {
                            const res = await queryPromise;
                            return res;
                        } catch (err) {
                            console.warn('[OcorrenciasDashboard] Falha na consulta remota:', err);
                            return { data: null, error: err };
                        }
                    };

                    // Busca paralela otimizada de NOPRERs e Ocorrências
                    // Limitando ocorrências a 100 para evitar statement timeout no Postgres
                    const [noprerRes, remoteRes] = await Promise.all([
                        safeFetch(supabase.from('noprer').select('*').limit(200)),
                        safeFetch(supabase.from('ocorrencias_operacionais').select(OCORRENCIAS_SELECT_FIELDS).order('created_at', { ascending: false }).limit(150))
                    ]);

                    if (noprerRes?.data) {
                        const formattedNoprers = noprerRes.data.map(n => ({
                            ...n,
                            origem_id: n.origem_id || n.vistoria_id || n.ocorrencia_id,
                            numero_noprer: n.numero_noprer || n.numero || n.id
                        }));
                        setNoprers(formattedNoprers);
                    }

                    // Fallback caso a query falhe por coluna ainda não migrada ou statement timeout no Postgres
                    let remoteData = remoteRes?.data;
                    if (!remoteData && remoteRes?.error) {
                        const errMsg = String(remoteRes.error.message || '').toLowerCase();
                        if (errMsg.includes('does not exist') || errMsg.includes('column')) {
                            console.warn('[OcorrenciasDashboard] Coluna nova ausente no Supabase, usando fallback legado...');
                            const legacyRes = await safeFetch(supabase.from('ocorrencias_operacionais').select(OCORRENCIAS_SELECT_FIELDS_LEGACY).order('created_at', { ascending: false }).limit(150));
                            remoteData = legacyRes?.data;
                        } else if (errMsg.includes('timeout') || errMsg.includes('canceling statement')) {
                            console.warn('[OcorrenciasDashboard] Timeout detectado no Postgres, tentando fallback sem ordenação...');
                            const fallbackRes = await safeFetch(supabase.from('ocorrencias_operacionais').select(OCORRENCIAS_SELECT_FIELDS).limit(50));
                            remoteData = fallbackRes?.data;
                        }
                    }

                    if (remoteData && remoteData.length > 0) {
                        const combined = [...(localData || [])];
                        remoteData.forEach(d => {
                            d.synced = true;
                            combined.push(d);
                        });
                        
                        const dedupMap = new Map();
                        combined.sort((a, b) => {
                            const dateA = new Date(a.updated_at || a.created_at || 0);
                            const dateB = new Date(b.updated_at || b.created_at || 0);
                            return dateA - dateB;
                        }).forEach(r => {
                            const key = r.ocorrencia_id || r.id;
                            const existing = dedupMap.get(key);
                            if (existing && !existing.synced && r.synced) {
                                return;
                            }
                            dedupMap.set(key, r);
                        });
                        
                        setRecords(Array.from(dedupMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));

                        // Cacheia localmente para persistência no IndexedDB em modo offline
                        try {
                            for (const item of remoteData) {
                                await saveOcorrenciaLocal(item, true);
                            }
                        } catch (cacheErr) {
                            console.warn('[OcorrenciasDashboard] Cache local falhou silenciosamente:', cacheErr);
                        }
                    }
                } catch (e) {
                    console.warn('Revalidação em segundo plano falhou silenciosamente:', e);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error);
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteOcorrenciaLocal(recordToDelete.id);
            if (selectedOcorrencia && (selectedOcorrencia.id === recordToDelete.id || (selectedOcorrencia.ocorrencia_id && selectedOcorrencia.ocorrencia_id === recordToDelete.ocorrencia_id))) {
                setIsDrawerOpen(false);
                setSelectedOcorrencia(null);
                document.title = 'SIGERD WEB';
            }
            toast.success('Registro removido.');
            loadRecords();
        } catch (error) {
            toast.error('Falha ao excluir.');
        } finally {
            setShowDeleteModal(false);
            setRecordToDelete(null);
        }
    };

    const handleStatusChange = async (record, newStatus) => {
        try {
            await saveOcorrenciaLocal({ ...record, status: newStatus });
            toast.success('Status atualizado com sucesso!');
            loadRecords();
        } catch (e) {
            toast.error('Erro ao atualizar status.');
        } finally {
            setStatusModalRecord(null);
        }
    };

    const parseDateToYmd = (raw) => {
        if (!raw) return null;
        const str = String(raw).trim();
        if (!str) return null;

        // Formato ISO YYYY-MM-DD (com ou sem hora)
        const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            // Se tiver timestamp com timezone (ex: 2026-11-27T01:00:00Z), converte para data local
            if (str.includes('T')) {
                const parsed = new Date(str);
                if (!isNaN(parsed.getTime())) {
                    const y = parsed.getFullYear();
                    const m = String(parsed.getMonth() + 1).padStart(2, '0');
                    const d = String(parsed.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
            return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
        }

        // Formato brasileiro DD/MM/YYYY ou DD-MM-YYYY (com ou sem hora)
        const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (brMatch) {
            const d = brMatch[1].padStart(2, '0');
            const m = brMatch[2].padStart(2, '0');
            const y = brMatch[3];
            return `${y}-${m}-${d}`;
        }

        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return null;
    };

    const filterByPeriod = (list, ini, fim) => {
        if (!ini && !fim) return list;
        return list.filter(r => {
            const recStartYmd =
                parseDateToYmd(r.data_ocorrencia) ||
                parseDateToYmd(r.data_chamado) ||
                parseDateToYmd(r.created_at);
            if (!recStartYmd) return false;
            const recEndYmd = parseDateToYmd(r.data_fim_ocorrencia) || recStartYmd;

            // Considera sobreposição de período (se ocorrência durar vários dias, aparece se interceptar o filtro)
            if (fim && recStartYmd > fim) return false;
            if (ini && recEndYmd < ini) return false;
            return true;
        });
    };

    const filtered = filterByPeriod(records, startDate, endDate).filter(r => {
        const search = searchTerm.toLowerCase();
        if (!search) return true;
        return (
            (r.categoriaRisco || r.categoria_risco || r.tipo_ocorrencia || r.tipoOcorrencia || r.tipo_info || r.riscoTipo || '').toLowerCase().includes(search) ||
            (r.bairro || '').toLowerCase().includes(search) ||
            (r.endereco || '').toLowerCase().includes(search) ||
            (r.solicitante || '').toLowerCase().includes(search) ||
            (r.ocorrencia_id_format || '').toLowerCase().includes(search)
        );
    });

    const openReportModal = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        if (startDate || endDate) {
            setReportMode('periodo');
            setReportStartDate(startDate || endDate || todayStr);
            setReportEndDate(endDate || startDate || todayStr);
        } else {
            setReportMode('periodo');
            setReportStartDate(todayStr);
            setReportEndDate(todayStr);
        }
        setShowReportModal(true);
    };

    const reportPreviewRecords = reportMode === 'todos'
        ? records
        : filterByPeriod(records, reportStartDate, reportEndDate);

    const handleEmitConsolidatedReport = async () => {
        if (reportMode === 'periodo') {
            if (!reportStartDate || !reportEndDate) {
                toast.warning('Período incompleto', 'Informe a data inicial e a data final.');
                return;
            }
            if (reportStartDate > reportEndDate) {
                toast.warning('Período inválido', 'A data inicial não pode ser posterior à data final.');
                return;
            }
        }

        if (reportPreviewRecords.length === 0) {
            toast.warning('Sem registros', 'Nenhuma ocorrência encontrada para o período selecionado.');
            return;
        }

        setGeneratingConsolidated(true);
        try {
            const formatBR = (ymd) => new Date(`${ymd}T12:00:00`).toLocaleDateString('pt-BR');
            const periodoLabel = reportMode === 'todos'
                ? 'Todo o Período'
                : `${formatBR(reportStartDate)} a ${formatBR(reportEndDate)}`;
            const filtrosLabel = reportMode === 'todos'
                ? 'Geral (Todas as ocorrências)'
                : `Período personalizado (${periodoLabel})`;

            const success = await generateConsolidatedReport(reportPreviewRecords, {
                periodoLabel,
                filtrosLabel,
            });
            if (success) {
                toast.success('Relatório gerado com sucesso!');
                setShowReportModal(false);
            } else {
                toast.error('Erro ao gerar relatório consolidado.');
            }
        } finally {
            setGeneratingConsolidated(false);
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Preparando registros...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 h-[calc(100vh-40px)] font-sans animate-in fade-in duration-500 flex w-full overflow-hidden">
            {/* Main panel - Painel de Cards (30% da largura em desktop quando relatório estiver aberto) */}
            <div className={`h-full overflow-y-auto transition-all duration-300 ${isDrawerOpen ? 'hidden md:flex flex-col w-full md:w-[30%] min-w-[280px] shrink-0 border-r border-slate-200/60 dark:border-slate-800' : 'w-full'}`}>
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="w-full mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-95 shrink-0"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">Ocorrências</h1>
                            {!isDrawerOpen && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Log de Atendimento Operacional</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            onClick={openReportModal}
                            className={`bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 h-10 sm:h-12 ${isDrawerOpen ? 'px-3' : 'px-3 sm:px-4'}`}
                            title="Gerar Relatório Consolidado"
                        >
                            <Printer size={18} className={isDrawerOpen ? '' : 'sm:mr-2'} />
                            {!isDrawerOpen && <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Relatório</span>}
                        </Button>
                        <Button
                            onClick={() => navigate('/ocorrencias/novo')}
                            className={`bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 h-10 sm:h-12 ${isDrawerOpen ? 'px-3' : 'px-4 sm:px-6'}`}
                            title="Nova Ocorrência"
                        >
                            <Plus size={18} className={isDrawerOpen ? '' : 'sm:mr-2'} />
                            {!isDrawerOpen && <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo</span>}
                        </Button>
                    </div>
                </div>
            </div>

            <main className={`w-full mx-auto pb-28 space-y-6 ${isDrawerOpen ? 'p-4' : 'p-5 sm:p-8 sm:space-y-8'}`}>
                {/* Search and Period Filters */}
                <div className={`grid gap-3 w-full mx-auto ${isDrawerOpen ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`}>
                    <div className={`relative group ${isDrawerOpen ? '' : 'md:col-span-6 lg:col-span-6'}`}>
                        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, endereço ou ID..."
                            className="w-full pl-12 sm:pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all font-bold text-sm dark:text-white placeholder:text-slate-300 min-h-[56px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={`grid grid-cols-2 gap-2.5 items-center ${isDrawerOpen ? '' : 'md:col-span-6 lg:col-span-6'}`}>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">
                                Data Inicial
                            </span>
                            <input
                                type="date"
                                className="w-full px-3.5 pt-5 pb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-xs dark:text-white min-h-[56px]"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="relative flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <span className="absolute left-3.5 top-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">
                                    Data Final
                                </span>
                                <input
                                    type="date"
                                    className="w-full px-3.5 pt-5 pb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-bold text-xs dark:text-white min-h-[56px]"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    type="button"
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-2.5 rounded-xl bg-slate-200/70 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0"
                                    title="Limpar período"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <ShieldAlert size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Nenhum registro</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-10">Tudo limpo por aqui. Nenhuma ocorrência nestes critérios.</p>
                        </div>
                    ) : (
                        <div className={`gap-4 sm:gap-6 ${isDrawerOpen ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                            {filtered.map((record) => {
                                const isSelected = isDrawerOpen && selectedOcorrencia && (selectedOcorrencia.id === record.id || (selectedOcorrencia.ocorrencia_id && selectedOcorrencia.ocorrencia_id === record.ocorrencia_id));
                                return (
                                <Card
                                    key={record.id}
                                    className={`group relative bg-white dark:bg-slate-800 p-6 flex flex-col justify-between hover:shadow-xl hover:translate-y-[-4px] active:scale-[0.98] transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-400' : 'border-slate-100 dark:border-slate-700'}`}
                                    onClick={() => { setSelectedOcorrencia(record); setIsDrawerOpen(true); }}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {record.ocorrencia_id_format && (
                                                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        #{record.ocorrencia_id_format}
                                                    </span>
                                                )}
                                                {!record.synced && (
                                                    <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 flex items-center gap-1 uppercase">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                        Pendente
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 border border-slate-100 dark:border-slate-700 px-2 py-1 rounded-lg">
                                                <Calendar size={12} />
                                                {new Date(record.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                                {(!record.solicitante || record.solicitante === 'Solicitante não informado') ? 'Coordenadoria Municipal de Proteção e Defesa Civil' : record.solicitante}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-blue-500 dark:text-blue-400 font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                    {record.tipo_ocorrencia || record.tipoOcorrencia || record.cobrade_subtipo || record.categoriaRisco || record.categoria_risco || record.tipo_info || 'Geral'}
                                                </p>
                                                {record.status && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStatusModalRecord(record);
                                                        }}
                                                        className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${
                                                            (OCORRENCIA_STATUSES[record.status] || OCORRENCIA_STATUSES['Pendente']).bg
                                                        } ${
                                                            (OCORRENCIA_STATUSES[record.status] || OCORRENCIA_STATUSES['Pendente']).text
                                                        } ${
                                                            (OCORRENCIA_STATUSES[record.status] || OCORRENCIA_STATUSES['Pendente']).border
                                                        }`}
                                                    >
                                                        {record.status}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 mb-4 h-[72px] overflow-hidden">
                                            <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                                            <p className="line-clamp-2 font-bold leading-snug">
                                                {record.endereco || 'Endereço não informado'} <br />
                                                <span className="text-[10px] font-medium text-slate-400">{record.bairro || ''}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                        <div className="flex gap-1.5 px-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOcorrencia(record);
                                                    setIsDrawerOpen(true);
                                                }}
                                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all active:scale-95"
                                                title="Visualizar Detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* NOPRER Button */}
                                            {(record.nivel_risco === 'Médio' || record.nivel_risco === 'Alto' || record.nivel_risco === 'Muito Alto' || record.nivel_risco === 'Iminente') && (
                                                (() => {
                                                    const linkedNoprer = noprers.find(n => String(n.origem_id) === String(record.ocorrencia_id_format) || String(n.origem_id) === String(record.ocorrencia_id) || String(n.origem_id) === String(record.id));
                                                    if (linkedNoprer) {
                                                        return (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/noprer/detalhes/${linkedNoprer.id}`); }}
                                                                className="px-3 h-10 flex items-center gap-1 justify-center text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-all active:scale-95 ml-1"
                                                                title="Ver NOPRER Gerada"
                                                            >
                                                                <ShieldAlert size={14} />
                                                                {linkedNoprer.numero_noprer}
                                                            </button>
                                                        );
                                                    } else {
                                                        return (
                                                            <button
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    const ocorrenciaIdStr = encodeURIComponent(record.id || record.ocorrencia_id);
                                                                    navigate(`/noprer/novo/ocorrencia/${ocorrenciaIdStr}`);
                                                                }}
                                                                className="px-3 h-10 flex items-center justify-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-all active:scale-95 ml-1"
                                                                title="Emitir Notificação Preliminar de Risco"
                                                            >
                                                                Emitir NOPRER
                                                            </button>
                                                        );
                                                    }
                                                })()
                                            )}

                                            {userProfile?.role !== 'Operador' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRecordToDelete(record);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all active:scale-95"
                                                    title="Excluir Ocorrência"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            </div>
            {/* End main panel */}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Excluir Ocorrência?"
                message={`Tem certeza que deseja apagar a ocorrência ${recordToDelete?.ocorrencia_id_format || ''}?`}
                isDestructive={true}
            />

            {/* Status Modal */}
            {statusModalRecord && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Alterar Status</h3>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                    ID: {statusModalRecord?.ocorrencia_id_format}
                                </div>
                            </div>
                            <button
                                onClick={() => setStatusModalRecord(null)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {Object.keys(OCORRENCIA_STATUSES).map(key => {
                                const opt = OCORRENCIA_STATUSES[key];
                                const isActive = statusModalRecord.status === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusChange(statusModalRecord, key)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${isActive ? `border-transparent ${opt.bg} ${opt.text} shadow-inner` : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <div className={`text-xs font-black uppercase tracking-widest ${isActive ? '' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {opt.label}
                                        </div>
                                        {isActive && <CheckCircle size={18} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Emissão do Relatório Consolidado de Ocorrências */}
            {showReportModal && (
                <div
                    onClick={() => setShowReportModal(false)}
                    className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                    >
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    <Printer size={18} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider">
                                        Relatório Consolidado
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Defina o período para emissão
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Seletor de Modo */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setReportMode('periodo')}
                                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                                        reportMode === 'periodo'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-xs font-black uppercase">Período</div>
                                    <div className="text-[10px] font-semibold opacity-75 mt-0.5">Definir data inicial e final</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportMode('todos')}
                                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                                        reportMode === 'todos'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="text-xs font-black uppercase">Todo o Período</div>
                                    <div className="text-[10px] font-semibold opacity-75 mt-0.5">Relatório completo</div>
                                </button>
                            </div>

                            {reportMode === 'periodo' && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                            Data Inicial *
                                        </label>
                                        <input
                                            type="date"
                                            value={reportStartDate}
                                            onChange={(e) => setReportStartDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                            Data Final *
                                        </label>
                                        <input
                                            type="date"
                                            value={reportEndDate}
                                            onChange={(e) => setReportEndDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Prévia da contagem */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-500 dark:text-slate-400">Ocorrências no período:</span>
                                <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                    {reportPreviewRecords.length} registro(s)
                                </span>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={generatingConsolidated}
                                onClick={handleEmitConsolidatedReport}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                            >
                                <Printer size={15} />
                                {generatingConsolidated ? 'Gerando...' : 'Emitir Relatório'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Side Panel Drawer */}
            {isDrawerOpen && (
                <OcorrenciaDrawer
                    ocorrencia={selectedOcorrencia}
                    onClose={() => {
                        setIsDrawerOpen(false);
                        setSelectedOcorrencia(null);
                        document.title = 'SIGERD WEB';
                    }}
                    onEdit={(ocorrencia) => {
                        const targetId = ocorrencia.id || ocorrencia.ocorrencia_id;
                        navigate(`/ocorrencias/editar/${targetId}`);
                    }}
                />
            )}
        </div>
    );
};

export default OcorrenciasDashboard;
