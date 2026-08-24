import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter, X, ChevronDown, Mail, Printer, ArrowLeft, Eye, ChevronRight, ShieldAlert, MoreVertical } from 'lucide-react'
import { UserContext } from '../../App'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteVistoriaLocal, getLightweightVistoriasLocal, getVistoriaFull } from '../../services/db'
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

    useEffect(() => {
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
            const { data: noprersData } = await supabase.from('noprer').select('id, origem_id, numero_noprer')
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
            const endereco = fullVistoria.endereco || 'EndereÃ§o nÃ£o informado'

            const subject = encodeURIComponent(`RelatÃ³rio de Vistoria TÃ©cnica ${vistoriaId}`)
            const body = (
                `Prezado(a),\n\n` +
                `Segue em anexo o RelatÃ³rio de Vistoria TÃ©cnica ${vistoriaId}.\n\n` +
                `Solicitante: ${solicitante}\n` +
                `Local: ${endereco}\n\n` +
                `O arquivo PDF foi baixado no seu dispositivo. Por favor, anexe-o a este email antes de enviar.\n\n` +
                `Atenciosamente,\n` +
                `Defesa Civil Municipal de Santa Maria de JetibÃ¡`
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
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 font-sans animate-in fade-in duration-500">
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
                                placeholder="Buscar por endereÃ§o, solicitante ou ID..."
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">RegiÃ£o / Bairro</label>
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">NÃ­vel de Risco</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Baixo', 'MÃ©dio', 'Alto', 'Iminente'].map(level => (
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
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">PerÃ­odo de Registro</label>
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
                    <div className="flex flex-col gap-4">
                        {filteredVistorias.map(vistoria => {
                            let borderColor = 'border-l-blue-500';
                            if (vistoria.nivelRisco === 'Alto' || vistoria.nivelRisco === 'Muito Alto') borderColor = 'border-l-orange-500';
                            if (vistoria.nivelRisco === 'Iminente') borderColor = 'border-l-red-500';
                            if (vistoria.nivelRisco === 'Baixo') borderColor = 'border-l-yellow-500';

                            return (
                                <div
                                    key={vistoria.id}
                                    onClick={() => onEdit(vistoria)}
                                    className={`bg-white dark:bg-slate-800 rounded-[16px] shadow-sm border border-slate-100 dark:border-slate-700 p-4 border-l-[6px] ${borderColor} relative active:scale-[0.98] transition-all cursor-pointer`}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-1 rounded-md">
                                            #{vistoria.vistoria_id || '---'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-slate-400" />
                                            <span className="text-[10px] text-slate-500 font-bold">{new Date(vistoria.created_at).toLocaleDateString('pt-BR')}</span>
                                            <button onClick={(e) => { e.stopPropagation(); /* Optional context menu */ }} className="text-slate-400 hover:text-slate-600 ml-1 p-1">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                                        {vistoria.solicitante || 'Solicitante NÃ£o Identificado'}
                                    </h3>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[9px] font-black px-2 py-1 rounded uppercase">
                                            {vistoria.categoriaRisco || vistoria.tipo_info || 'Geral'}
                                        </span>
                                        {vistoria.isLocal && (vistoria.synced === false || vistoria.synced === undefined || vistoria.synced === 0) && (
                                            <span className="bg-orange-50 text-orange-600 dark:bg-orange-900/30 text-[9px] font-black px-2 py-1 rounded uppercase flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" /> Pendente
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex items-start gap-2">
                                        <MapPin size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 line-clamp-1">{vistoria.endereco || 'EndereÃ§o nÃ£o informado'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
                            Digite o email para enviar o relatÃ³rio da vistoria <span className="font-bold text-[#2a5299]">#{emailModal.vistoria?.vistoria_id}</span>
                        </p>

                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
                            <p className="text-xs font-bold text-blue-800">ðŸ“§ O PDF serÃ¡ anexado automaticamente</p>
                            <p className="text-xs text-blue-700 mt-1">Funciona offline - o email serÃ¡ enviado quando houver conexÃ£o</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">EndereÃ§o de Email</label>
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

            {/* Deletion Safety Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, vistoria: null })}
                onConfirm={confirmDeletion}
                title="Excluir Vistoria"
                message={`Tem certeza que deseja excluir a vistoria #${deleteModal.vistoria?.vistoria_id}? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`}
                confirmText="Sim, Excluir"
                cancelText="Mantenha para mim"
            />
        </div>
    )
}

export default VistoriaList


