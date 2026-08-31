import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter, X, ChevronDown, Mail, Printer, ArrowLeft, Eye, ChevronRight, ShieldAlert, MoreVertical } from 'lucide-react'
import { UserContext } from '../../App'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteVistoriaLocal, getLightweightVistoriasLocal, getVistoriaFull } from '../../services/db'
import VistoriaDrawer from './VistoriaDrawer'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

const VistoriaList = ({ onNew, onEdit }) => {
    const navigate = useNavigate()
    const { userProfile } = useContext(UserContext)
    const [vistorias, setVistorias] = useState([])
    const [noprers, setNoprers] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filters, setFilters] = useState({
        bairro: '',
        nivelRisco: '',
        startDate: '',
        endDate: ''
    })
    const [emailModal, setEmailModal] = useState({ open: false, vistoria: null })
    const [emailAddress, setEmailAddress] = useState('')
    const [deleteModal, setDeleteModal] = useState({ open: false, vistoria: null })
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedVistoria, setSelectedVistoria] = useState(null)
    const [mobileMenuVistoria, setMobileMenuVistoria] = useState(null)

    useEffect(() => {
        document.title = 'SIGERD WEB';
        fetchVistorias()

        // [SYNC FIX] Refresh list when background sync completes
        const handleSyncComplete = (e) => {
            console.log('[VistoriaList] Sync complete event received, refreshing list...', e.detail);
            fetchVistorias();
        }
        window.addEventListener('sync-complete', handleSyncComplete);
        return () => window.removeEventListener('sync-complete', handleSyncComplete);
    }, [])

    const fetchVistorias = async () => {
        setLoading(true)
        try {
            // Fetch NOPRERs to link them
            const { data: noprersData } = await supabase.from('noprer').select('id, vistoria_id, numero')
            if (noprersData) setNoprers(noprersData)

            // 1. Fetch from Supabase (Optimized Select)
            const { data: rawCloudData, error } = await supabase
                .from('vistorias')
                .select('id, vistoria_id, created_at, solicitante, endereco, bairro, nivel_risco, categoria_risco, tipo_info')
                .order('created_at', { ascending: false })

            // Map cloud data to match local camelCase structure
            const cloudData = (rawCloudData || []).map(item => ({
                ...item,
                synced: true,
                nivelRisco: item.nivel_risco,
                categoriaRisco: item.categoria_risco
            }))

            // 2. Fetch from Local (Lightweight)
            const localData = await getLightweightVistoriasLocal().catch(() => [])

            // 3. Merge and De-duplicate [FIXED]
            const merged = [...(cloudData || [])]

            localData.forEach(localItem => {
                const vid = localItem.vistoriaId || localItem.vistoria_id;
                const isSynced = localItem.synced === true || localItem.synced === 1;

                // [FIX] More robust matching: Check UUIDs AND Vistoria IDs
                const cloudIndex = merged.findIndex(c =>
                    (vid && c.vistoria_id === vid) ||
                    (localItem.id && c.id === localItem.id) ||
                    (localItem.supabase_id && c.id === localItem.supabase_id)
                )

                // [DEFINITIVE FIX] Ghost Record Suppression v2
                // ALWAYS show local item if it's not in the cloud yet OR if it has offline edits.
                const mappedLocalItem = {
                    ...localItem,
                    id: localItem.id,
                    vistoria_id: vid,
                    created_at: localItem.createdAt || localItem.created_at || new Date().toISOString(),
                    isLocal: true,
                    synced: localItem.synced
                }

                if (cloudIndex !== -1) {
                    if (localItem.synced === false || localItem.synced === 0) {
                        merged[cloudIndex] = mappedLocalItem; // Overwrite with local pending edit
                    }
                } else {
                    merged.push(mappedLocalItem)
                }
            })

            // Sort merged by Vistoria ID (NN/YYYY) descending
            merged.sort((a, b) => {
                const idA = a.vistoria_id || '';
                const idB = b.vistoria_id || '';

                if (!idA || !idB || !idA.includes('/') || !idB.includes('/')) {
                    return new Date(b.created_at) - new Date(a.created_at);
                }

                const [numA, yearA] = idA.split('/').map(Number);
                const [numB, yearB] = idB.split('/').map(Number);

                if (yearA !== yearB) return yearB - yearA;
                return numB - numA;
            })

            setVistorias(merged)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (vistoria, e) => {
        e.stopPropagation()
        setDeleteModal({ open: true, vistoria })
    }

    const confirmDeletion = async () => {
        const vistoria = deleteModal.vistoria
        if (!vistoria) return

        const id = vistoria.id
        const supabaseId = vistoria.supabase_id || (typeof id === 'string' && id.includes('-') ? id : null)

        let error = null

        // 1. If it has a Supabase ID, try to delete from cloud
        if (supabaseId) {
            const { error: remoteError } = await supabase.from('vistorias').delete().eq('id', supabaseId)
            error = remoteError
        }

        // 2. If no remote error (success or wasn't in cloud), delete locally
        if (!error) {
            await deleteVistoriaLocal(id)
            setVistorias(prev => prev.filter(v => v.id !== id))
            // Dispatch event to notify forms to recalculate next ID
            window.dispatchEvent(new CustomEvent('vistoria-deleted'))
        } else {
            console.error('Delete error:', error)
            alert('Erro ao excluir do servidor. Verifique sua conexÃ£o.')
        }
    }

    const handleClearFilters = () => {
        setFilters({
            bairro: '',
            nivelRisco: '',
            startDate: '',
            endDate: ''
        })
        setSearchTerm('')
    }

    const handleEmailShare = (vistoria, e) => {
        e.stopPropagation()
        setEmailModal({ open: true, vistoria })
        setEmailAddress('')
    }

    const sendViaEmail = async () => {
        const email = emailAddress.trim()
        if (!email || !email.includes('@')) {
            alert('Digite um email vÃ¡lido')
            return
        }

        setSending(true)
        try {
            // 1. Fetch full data (photos etc)
            let fullVistoria = await getVistoriaFull(emailModal.vistoria.id);
            if (!fullVistoria && (emailModal.vistoria.supabase_id || emailModal.vistoria.id)) {
                const targetId = emailModal.vistoria.supabase_id || emailModal.vistoria.id;
                const { data } = await supabase.from('vistorias').select('*').eq('id', targetId).single();
                if (data) fullVistoria = data;
            }
            // Fallback
            fullVistoria = fullVistoria || emailModal.vistoria;

            // Generate PDF first (this downloads it)
            await generatePDF(fullVistoria, 'vistoria')

            // Prepare email
            const vistoriaId = fullVistoria.vistoria_id || fullVistoria.vistoriaId || 'N/A'
            const solicitante = fullVistoria.solicitante || 'Solicitante'
            const endereco = fullVistoria.endereco || 'Endereço não informado'

            const subject = encodeURIComponent(`Relatório de Vistoria Técnica ${vistoriaId}`)
            const body = (
                `Prezado(a),\n\n` +
                `Segue em anexo o Relatório de Vistoria Técnica ${vistoriaId}.\n\n` +
                `Solicitante: ${solicitante}\n` +
                `Local: ${endereco}\n\n` +
                `O arquivo PDF foi baixado no seu dispositivo. Por favor, anexe-o a este email antes de enviar.\n\n` +
                `Atenciosamente,\n` +
                `Defesa Civil Municipal de Santa Maria de Jetibá`
            )

            // Open email client with mailto
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`

            // Close modal
            setEmailModal({ open: false, vistoria: null })
            setEmailAddress('')
        } catch (e) {
            console.error(e)
            alert('Erro ao gerar PDF ou preparar email.')
        } finally {
            setSending(false)
        }
    }

    const neighborhoods = [...new Set(vistorias.map(v => v.bairro).filter(Boolean))].sort()

    const filteredVistorias = vistorias.filter(v => {
        const matchesSearch = !searchTerm ||
            v.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.solicitante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.vistoria_id?.toString().includes(searchTerm);

        const matchesBairro = !filters.bairro || v.bairro === filters.bairro;
        const matchesRisco = !filters.nivelRisco || v.nivelRisco === filters.nivelRisco;

        const vistoriaDate = new Date(v.created_at).toISOString().split('T')[0];
        const matchesStartDate = !filters.startDate || vistoriaDate >= filters.startDate;
        const matchesEndDate = !filters.endDate || vistoriaDate <= filters.endDate;

        return matchesSearch && matchesBairro && matchesRisco && matchesStartDate && matchesEndDate;
    })

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 h-[calc(100vh-40px)] font-sans animate-in fade-in duration-500 flex w-full overflow-hidden">
            {/* Main panel - Painel de Cards (30% da largura em desktop quando relatório estiver aberto) */}
            <div className={`h-full overflow-y-auto transition-all duration-300 ${isDrawerOpen ? 'hidden md:flex flex-col w-full md:w-[30%] min-w-[280px] shrink-0 border-r border-slate-200/60 dark:border-slate-800' : 'w-full'}`}>
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-4 sticky top-0 z-20">
                <div className="w-full mx-auto">
                    <div className="flex items-center justify-between mb-4 mt-2">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/')} className="p-1 -ml-1 text-slate-500 hover:text-slate-700 active:scale-95 transition-all">
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Vistorias</h1>
                        </div>
                        <button
                            onClick={onNew}
                            className="bg-blue-600 text-white rounded-xl px-4 py-2.5 font-bold text-sm flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                        >
                            <Plus size={16} /> Nova
                        </button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por endereço, solicitante ou ID..."
                                className="w-full bg-white dark:bg-slate-800 p-3.5 pl-12 rounded-[16px] border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="bg-[#ff5722] text-white w-[52px] h-[52px] rounded-[16px] shadow-sm flex items-center justify-center active:scale-95 transition-all"
                            >
                                <Filter size={20} />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-[#1e293b] text-white text-[10px] w-[20px] h-[20px] flex items-center justify-center rounded-full font-bold shadow-sm">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Expanded Filters Panel */}
                    {isFilterOpen && (
                        <div className="mt-4 p-5 bg-white dark:bg-slate-800 rounded-[20px] border border-slate-100 dark:border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[2px]">Filtros</h3>
                                <button
                                    onClick={handleClearFilters}
                                    className="text-blue-600 text-xs font-black hover:underline uppercase tracking-widest disabled:opacity-30"
                                    disabled={activeFiltersCount === 0 && !searchTerm}
                                >
                                    Limpar Filtros
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Bairro Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Região / Bairro</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                                        value={filters.bairro}
                                        onChange={(e) => setFilters(prev => ({ ...prev, bairro: e.target.value }))}
                                    >
                                        <option value="">Todas as Localidades</option>
                                        {neighborhoods.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Risk Level Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nível de Risco</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Baixo', 'Médio', 'Alto', 'Iminente'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setFilters(prev => ({ ...prev, nivelRisco: prev.nivelRisco === level ? '' : level }))}
                                                className={`px-4 py-2 rounded-[12px] text-xs font-bold transition-all border ${filters.nivelRisco === level
                                                    ? 'bg-[#ff5722] text-white border-[#ff5722] shadow-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range Filter */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Período de Registro</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="date"
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                            value={filters.startDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                        <input
                                            type="date"
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-2.5 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                            value={filters.endDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="w-full mx-auto p-4 sm:p-6 pb-24 bg-slate-50 dark:bg-slate-900">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Carregando vistorias...</p>
                    </div>
                ) : filteredVistorias.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Nenhum registro encontrado</h3>
                        <p className="text-slate-400 text-sm mt-1">Tente ajustar seus filtros ou busca.</p>
                        <Button onClick={handleClearFilters} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                            Limpar Tudo
                        </Button>
                    </div>
                ) : (
                    <div className={`gap-4 ${isDrawerOpen ? 'grid grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {filteredVistorias.map(vistoria => {
                            const getRiskBorderColor = (nivel) => {
                                switch (nivel) {
                                    case 'Iminente': return 'border-l-red-500';
                                    case 'Alto': return 'border-l-orange-500';
                                    case 'Médio': return 'border-l-amber-500';
                                    default: return 'border-l-amber-500';
                                }
                            };

                            return (
                                <div
                                    key={vistoria.id}
                                    onClick={() => { setSelectedVistoria(vistoria); setIsDrawerOpen(true); }}
                                    className={`group relative bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-[18px] md:rounded-xl shadow-xs hover:shadow-lg hover:translate-y-[-2px] active:scale-[0.98] transition-all cursor-pointer border border-slate-100 dark:border-slate-700/60 border-l-[5px] ${getRiskBorderColor(vistoria.nivelRisco)} md:border-l-slate-100 md:dark:border-l-slate-700`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="bg-slate-100/80 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700">
                                                    #{vistoria.vistoria_id || '---'}
                                                </span>
                                                {vistoria.isLocal && (vistoria.synced === false || vistoria.synced === undefined || vistoria.synced === 0) && (
                                                    <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 flex items-center gap-1 uppercase">
                                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                        Pendente
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                                    <Calendar size={12} className="text-slate-400" />
                                                    {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMobileMenuVistoria(vistoria);
                                                    }}
                                                    className="md:hidden p-0.5 text-slate-400 hover:text-slate-600 rounded-lg active:bg-slate-100 dark:active:bg-slate-700 transition-colors ml-0.5"
                                                    title="Mais Opções"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-2">
                                            <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                {vistoria.solicitante || 'Solicitante Não Identificado'}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <p className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                    {vistoria.categoriaRisco || vistoria.tipo_info || 'Geral'}
                                                </p>
                                                {vistoria.nivelRisco && vistoria.nivelRisco !== 'Baixo' && (
                                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${vistoria.nivelRisco === 'Iminente' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800' :
                                                        vistoria.nivelRisco === 'Alto' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' :
                                                            'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800'
                                                        }`}>
                                                        {vistoria.nivelRisco}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/80 dark:border-slate-700/50 mb-1 sm:mb-2 min-h-[44px] overflow-hidden">
                                            <MapPin size={14} className="shrink-0 text-blue-500" />
                                            <p className="font-bold leading-tight line-clamp-1 md:line-clamp-2">
                                                {vistoria.endereco || 'Endereço não informado'}
                                                {vistoria.bairro && <span className="hidden md:block text-[9px] font-medium text-slate-400">{vistoria.bairro}</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Row - Web Only */}
                                    <div className="hidden md:flex justify-between items-center pt-2 mt-1 border-t border-slate-50 dark:border-slate-700/50">
                                        <div className="flex gap-1 px-0.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); { setSelectedVistoria(vistoria); setIsDrawerOpen(true); } }}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-95"
                                                title="Visualizar Detalhes"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEmailModal({ open: true, vistoria }) }}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all active:scale-95"
                                                title="Enviar por Email"
                                            >
                                                <Mail size={16} />
                                            </button>

                                            {/* NOPRER Button */}
                                            {(vistoria.nivelRisco === 'Médio' || vistoria.nivelRisco === 'Alto' || vistoria.nivelRisco === 'Muito Alto' || vistoria.nivelRisco === 'Iminente') && (
                                                (() => {
                                                    const linkedNoprer = noprers.find(n => String(n.vistoria_id) === String(vistoria.vistoria_id) || String(n.vistoria_id) === String(vistoria.id));
                                                    if (linkedNoprer) {
                                                        return (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/noprer/detalhes/${linkedNoprer.id}`); }}
                                                                className="px-2 h-8 flex items-center gap-1 justify-center text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all active:scale-95 ml-0.5"
                                                                title="Ver NOPRER Gerada"
                                                            >
                                                                <ShieldAlert size={12} />
                                                                {linkedNoprer.numero}
                                                            </button>
                                                        );
                                                    } else {
                                                        return (
                                                            <button
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    const vistoriaIdStr = encodeURIComponent(vistoria.id || vistoria.vistoria_id);
                                                                    navigate(`/noprer/novo/vistoria/${vistoriaIdStr}`);
                                                                }}
                                                                className="px-2 h-8 flex items-center justify-center text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-all active:scale-95 ml-0.5"
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
                                                    onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, vistoria }) }}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95"
                                                    title="Excluir Vistoria"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="w-6 h-6 flex items-center justify-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            </div>
            {/* End main panel */}

            {/* Email Share Modal */}
            {emailModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEmailModal({ open: false, vistoria: null })}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Mail className="text-blue-600" size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-800">Enviar por Email</h2>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Digite o email para enviar o relatório da vistoria <span className="font-bold text-[#2a5299]">#{emailModal.vistoria?.vistoria_id}</span>
                        </p>

                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
                            <p className="text-xs font-bold text-blue-800">📧 O PDF será anexado automaticamente</p>
                            <p className="text-xs text-blue-700 mt-1">Funciona offline - o email será enviado quando houver conexão</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Endereço de Email</label>
                            <input
                                type="email"
                                inputMode="email"
                                placeholder="exemplo@email.com"
                                className="w-full bg-slate-50 p-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendViaEmail()}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEmailModal({ open: false, vistoria: null })}
                                className="flex-1 p-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={sendViaEmail}
                                disabled={!emailAddress.includes('@')}
                                className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Mail size={18} />
                                Enviar Email
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Action Menu Popup */}
            {mobileMenuVistoria && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[6000] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setMobileMenuVistoria(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-700">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white text-base">Vistoria #{mobileMenuVistoria.vistoria_id || '---'}</h3>
                                <p className="text-xs font-medium text-slate-400 truncate max-w-[180px]">{mobileMenuVistoria.solicitante || 'Solicitante não informado'}</p>
                            </div>
                            <button onClick={() => setMobileMenuVistoria(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    const v = mobileMenuVistoria;
                                    setMobileMenuVistoria(null);
                                    setSelectedVistoria(v);
                                    setIsDrawerOpen(true);
                                }}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
                            >
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                    <Eye size={18} />
                                </div>
                                <span>Visualizar Relatório</span>
                            </button>

                            <button
                                onClick={() => {
                                    const v = mobileMenuVistoria;
                                    setMobileMenuVistoria(null);
                                    setEmailModal({ open: true, vistoria: v });
                                }}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
                            >
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Mail size={18} />
                                </div>
                                <span>Enviar por E-mail</span>
                            </button>

                            {/* NOPRER Option */}
                            {(mobileMenuVistoria.nivelRisco === 'Médio' || mobileMenuVistoria.nivelRisco === 'Alto' || mobileMenuVistoria.nivelRisco === 'Muito Alto' || mobileMenuVistoria.nivelRisco === 'Iminente') && (() => {
                                const linkedNoprer = noprers.find(n => String(n.vistoria_id) === String(mobileMenuVistoria.vistoria_id) || String(n.vistoria_id) === String(mobileMenuVistoria.id));
                                if (linkedNoprer) {
                                    return (
                                        <button
                                            onClick={() => {
                                                setMobileMenuVistoria(null);
                                                navigate(`/noprer/detalhes/${linkedNoprer.id}`);
                                            }}
                                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                                                <ShieldAlert size={18} />
                                            </div>
                                            <span>Ver NOPRER ({linkedNoprer.numero})</span>
                                        </button>
                                    );
                                } else {
                                    return (
                                        <button
                                            onClick={() => {
                                                const vid = encodeURIComponent(mobileMenuVistoria.id || mobileMenuVistoria.vistoria_id);
                                                setMobileMenuVistoria(null);
                                                navigate(`/noprer/novo/vistoria/${vid}`);
                                            }}
                                            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                                <ShieldAlert size={18} />
                                            </div>
                                            <span>Emitir NOPRER</span>
                                        </button>
                                    );
                                }
                            })()}

                            {userProfile?.role !== 'Operador' && (
                                <button
                                    onClick={() => {
                                        const v = mobileMenuVistoria;
                                        setMobileMenuVistoria(null);
                                        setDeleteModal({ open: true, vistoria: v });
                                    }}
                                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 font-bold text-sm transition-all"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                                        <Trash2 size={18} />
                                    </div>
                                    <span>Excluir Vistoria</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Safety Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, vistoria: null })}
                onConfirm={confirmDeletion}
                title="Excluir Vistoria"
                message={`Tem certeza que deseja excluir a vistoria #${deleteModal.vistoria?.vistoria_id}? Esta ação não pode ser desfeita.`}
                confirmText="Sim, Excluir"
                cancelText="Mantenha para mim"
            />
        {/* Side Panel Drawer */}
        {isDrawerOpen && (
            <VistoriaDrawer
                vistoria={selectedVistoria}
                onClose={() => { 
                    setIsDrawerOpen(false); 
                    setSelectedVistoria(null); 
                    document.title = 'SIGERD WEB';
                }}
                onEdit={onEdit}
            />
        )}
        </div>
    )
}

export default VistoriaList;
