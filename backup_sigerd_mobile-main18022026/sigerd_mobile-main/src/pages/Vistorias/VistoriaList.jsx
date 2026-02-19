import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter, X, ChevronDown, Mail, Printer, ArrowLeft } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteVistoriaLocal, getLightweightVistoriasLocal, getVistoriaFull } from '../../services/db'
import ConfirmModal from '../../components/ConfirmModal'

const VistoriaList = ({ onNew, onEdit }) => {
    const navigate = useNavigate()
    const [vistorias, setVistorias] = useState([])
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
            // 1. Fetch from Supabase (Optimized Select)
            const { data: cloudData, error } = await supabase
                .from('vistorias')
                .select('id, vistoria_id, created_at, solicitante, endereco, bairro, nivel_risco, categoria_risco, tipo_info, fotos') // Keeping fotos for now if needed for thumbnails, but maybe removing strictly? List doesn't show thumbs.
                // Wait, list DOES NOT show thumbs. Let's remove fotos.
                .select('id, vistoria_id, created_at, solicitante, endereco, bairro, nivel_risco, categoria_risco, tipo_info, synced')
                .order('created_at', { ascending: false })

            // 2. Fetch from Local (Lightweight)
            const localData = await getLightweightVistoriasLocal().catch(() => [])

            // 3. Merge and De-duplicate [FIXED]
            const merged = [...(cloudData || [])]

            localData.forEach(localItem => {
                const vid = localItem.vistoriaId || localItem.vistoria_id;
                const isSynced = localItem.synced === true || localItem.synced === 1;

                // [FIX] More robust matching: Check UUIDs AND Vistoria IDs
                const alreadyInCloud = merged.some(c =>
                    (vid && c.vistoria_id === vid) ||
                    (localItem.id && c.id === localItem.id) ||
                    (localItem.supabase_id && c.id === localItem.supabase_id)
                )

                // [DEFINITIVE FIX] Ghost Record Suppression v2
                // ALWAYS show local item if it's not in the cloud yet.
                // This covers:
                // 1. Offline & Unsynced (synced=false) -> Shows as Pending
                // 2. Online & Just Synced (synced=true) but not returned by API yet -> Shows as Synced
                // 3. Online & Cloud has it -> alreadyInCloud=true -> Local ignored, Cloud version shown
                if (!alreadyInCloud) {
                    merged.push({
                        ...localItem,
                        id: localItem.id,
                        vistoria_id: vid,
                        created_at: localItem.createdAt || localItem.created_at || new Date().toISOString(),
                        isLocal: true,
                        synced: localItem.synced
                    })
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
            alert('Erro ao excluir do servidor. Verifique sua conexão.')
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
            alert('Digite um email válido')
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
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Vistorias</h1>
                    </div>
                    <button
                        onClick={onNew}
                        className="bg-[#2a5299] text-white p-2 px-4 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-[#1e3c72]"
                    >
                        <Plus size={18} /> Nova
                    </button>
                </div>

                {/* Search Bar & Filter Toggle */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar endereço, nome ou ID..."
                            className="w-full bg-slate-100 p-2.5 pl-9 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2.5 rounded-xl transition-all flex items-center gap-2 border ${isFilterOpen || activeFiltersCount > 0
                            ? 'bg-blue-50 border-blue-200 text-[#2a5299]'
                            : 'bg-white border-gray-200 text-gray-500'
                            }`}
                    >
                        <Filter size={20} />
                        {activeFiltersCount > 0 && (
                            <span className="bg-[#2a5299] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Expanded Filters Panel */}
                {isFilterOpen && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Filtros Avançados</span>
                            <button onClick={handleClearFilters} className="text-[#2a5299] text-xs font-bold hover:underline">
                                Limpar Tudo
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Bairro Filter */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Bairro / Localidade</label>
                                <select
                                    className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#2a5299]/20"
                                    value={filters.bairro}
                                    onChange={(e) => setFilters(prev => ({ ...prev, bairro: e.target.value }))}
                                >
                                    <option value="">Todos os Bairros</option>
                                    {neighborhoods.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Risk Level Filter */}
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Nível de Risco</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['Baixo', 'Médio', 'Alto', 'Iminente'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setFilters(prev => ({ ...prev, nivelRisco: prev.nivelRisco === level ? '' : level }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filters.nivelRisco === level
                                                ? 'bg-[#2a5299] text-white border-[#2a5299] shadow-md'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range Filter */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-700"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Até</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-700"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Carregando vistorias...</div>
                ) : filteredVistorias.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <FileText size={48} className="mb-2 opacity-50" />
                        <p>Nenhuma vistoria encontrada.</p>
                    </div>
                ) : (
                    filteredVistorias.map(vistoria => (
                        <div
                            key={vistoria.id}
                            onClick={() => onEdit(vistoria)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-2 items-center">
                                    <span className="bg-slate-100 text-slate-600 text-xs font-black px-2.5 py-1 rounded-lg border border-slate-200">
                                        #{vistoria.vistoria_id || '---'}
                                    </span>
                                    {vistoria.isLocal && (vistoria.synced === false || vistoria.synced === undefined || vistoria.synced === 0) && (
                                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                            Pendente
                                        </span>
                                    )}
                                    {/* Badges de Risco */}
                                    {vistoria.nivelRisco && vistoria.nivelRisco !== 'Baixo' && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase ${vistoria.nivelRisco === 'Iminente' ? 'bg-red-50 text-red-600 border-red-100' :
                                            vistoria.nivelRisco === 'Alto' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-yellow-50 text-yellow-600 border-yellow-100'
                                            }`}>
                                            {vistoria.nivelRisco}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                    <Calendar size={12} />
                                    {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>

                            <div className="mb-3">
                                <h3 className="font-black text-gray-800 text-lg leading-tight mb-1">
                                    {vistoria.solicitante || 'Solicitante Não Identificado'}
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                    {vistoria.categoriaRisco || vistoria.tipo_info || 'Vistoria Geral'}
                                </p>
                            </div>

                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 mb-3">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-[#2a5299]" />
                                <p className="line-clamp-2 font-medium leading-snug">
                                    {vistoria.endereco || 'Endereço não informado'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                                <button
                                    onClick={(e) => handleEmailShare(vistoria, e)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Enviar por Email"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`/vistorias/imprimir/${vistoria.id || vistoria.vistoria_id}`, '_blank') }}
                                    className="p-2 text-gray-400 hover:text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Exportar Relatório (Novo)"
                                >
                                    <Share size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`/vistorias/imprimir/${vistoria.id || vistoria.vistoria_id}`, '_blank') }}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Imprimir Relatório (Novo)"
                                >
                                    <Printer size={18} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(vistoria, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
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
        </div>
    )
}

export default VistoriaList

