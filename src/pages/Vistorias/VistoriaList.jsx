import React, { useState, useEffect } from 'react'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter, X, ChevronDown, MessageCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteVistoriaLocal, getAllVistoriasLocal } from '../../services/db'

const VistoriaList = ({ onNew, onEdit }) => {
    const [vistorias, setVistorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filters, setFilters] = useState({
        bairro: '',
        nivelRisco: '',
        startDate: '',
        endDate: ''
    })
    const [whatsappModal, setWhatsappModal] = useState({ open: false, vistoria: null })
    const [whatsappPhone, setWhatsappPhone] = useState('')

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
            // 1. Fetch from Supabase
            const { data: cloudData, error } = await supabase
                .from('vistorias')
                .select('*')
                .order('created_at', { ascending: false })

            // 2. Fetch from Local
            const localData = await getAllVistoriasLocal().catch(() => [])

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

                // [DEFINITIVE FIX] Ghost Record Suppression
                // Only add local item if:
                // 1. It's NOT in cloud and it's NOT synced (it's new offline data)
                // 2. OR it's NOT in cloud and we are offline (we trust local cache)
                const shouldAdd = !alreadyInCloud && (!isSynced || !navigator.onLine);

                if (shouldAdd) {
                    merged.push({
                        ...localItem,
                        id: localItem.id,
                        vistoria_id: vid,
                        created_at: localItem.createdAt || localItem.created_at || new Date().toISOString(),
                        isLocal: true,
                        synced: isSynced
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

    const handleDelete = async (vistoria, e) => {
        e.stopPropagation()
        const id = vistoria.id
        const supabaseId = vistoria.supabase_id || (typeof id === 'string' && id.includes('-') ? id : null)

        if (window.confirm('Tem certeza que deseja excluir esta vistoria?')) {
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

    const handleWhatsAppShare = (vistoria, e) => {
        e.stopPropagation()
        setWhatsappModal({ open: true, vistoria })
        setWhatsappPhone('')
    }

    const formatPhoneNumber = (value) => {
        let v = value.replace(/\D/g, '')
        if (v.length > 9) v = v.slice(0, 9)
        v = v.replace(/^(\d{5})(\d)/, '$1-$2')
        return v
    }

    const sendToWhatsApp = async () => {
        const phone = whatsappPhone.replace(/\D/g, '')
        if (phone.length !== 9) {
            alert('Digite um número válido com 9 dígitos')
            return
        }

        // Generate PDF
        await generatePDF(whatsappModal.vistoria, 'vistoria')

        // Open WhatsApp
        const fullNumber = `5527${phone}`
        const vistoriaId = whatsappModal.vistoria.vistoria_id || 'N/A'
        const message = encodeURIComponent(
            `Olá! Segue o relatório de vistoria ${vistoriaId}. O arquivo PDF foi baixado - basta anexar e enviar.`
        )
        window.open(`https://wa.me/${fullNumber}?text=${message}`, '_blank')

        // Close modal
        setWhatsappModal({ open: false, vistoria: null })
        setWhatsappPhone('')
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
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Vistorias</h1>
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
                                    onClick={(e) => handleWhatsAppShare(vistoria, e)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Compartilhar via WhatsApp"
                                >
                                    <MessageCircle size={18} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); generatePDF(vistoria, 'vistoria') }}
                                    className="p-2 text-gray-400 hover:text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Exportar PDF"
                                >
                                    <Share size={18} />
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

            {/* WhatsApp Share Modal */}
            {whatsappModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setWhatsappModal({ open: false, vistoria: null })}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-green-100 p-2 rounded-full">
                                <MessageCircle className="text-green-600" size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-800">Compartilhar via WhatsApp</h2>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Digite o número de telefone para compartilhar o relatório da vistoria <span className="font-bold text-[#2a5299]">#{whatsappModal.vistoria?.vistoria_id}</span>
                        </p>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Número de Telefone</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500 font-bold">(27)</span>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="99999-9999"
                                    className="w-full bg-slate-50 p-3 pl-12 rounded-xl border-2 border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all font-mono text-lg"
                                    value={whatsappPhone}
                                    onChange={(e) => setWhatsappPhone(formatPhoneNumber(e.target.value))}
                                    onKeyDown={(e) => e.key === 'Enter' && sendToWhatsApp()}
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Digite apenas os 9 dígitos do número</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setWhatsappModal({ open: false, vistoria: null })}
                                className="flex-1 p-3 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={sendToWhatsApp}
                                disabled={whatsappPhone.replace(/\D/g, '').length !== 9}
                                className="flex-1 p-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} />
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VistoriaList
