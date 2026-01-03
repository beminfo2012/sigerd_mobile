import React, { useState, useEffect } from 'react'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteVistoriaLocal, getAllVistoriasLocal } from '../../services/db'

const VistoriaList = ({ onNew, onEdit }) => {
    const [vistorias, setVistorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchVistorias()
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

            // 3. Merge and De-duplicate
            const merged = [...(cloudData || [])]

            // Add local items that aren't in cloud yet (unsynced)
            localData.forEach(localItem => {
                const alreadyInCloud = merged.some(c =>
                    (c.vistoria_id === localItem.vistoriaId && c.vistoria_id) ||
                    (c.id === localItem.id)
                )

                if (!alreadyInCloud) {
                    merged.push({
                        ...localItem,
                        id: localItem.id, // Keep local ID
                        vistoria_id: localItem.vistoriaId,
                        created_at: localItem.createdAt || new Date().toISOString(),
                        isLocal: true,
                        synced: localItem.synced
                    })
                }
            })

            // Sort merged by date
            merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            setVistorias(merged)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation()
        if (window.confirm('Tem certeza que deseja excluir esta vistoria?')) {
            const { error } = await supabase.from('vistorias').delete().eq('id', id)
            if (!error) {
                await deleteVistoriaLocal(id)
                setVistorias(prev => prev.filter(v => v.id !== id))
            } else {
                alert('Erro ao excluir.')
            }
        }
    }

    const filteredVistorias = vistorias.filter(v =>
        v.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.solicitante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vistoria_id?.toString().includes(searchTerm)
    )

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

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por endereço, nome ou ID..."
                        className="w-full bg-slate-100 p-3 pl-10 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-2 items-center">
                                    <span className="bg-blue-50 text-[#2a5299] text-xs font-bold px-2 py-1 rounded-md">
                                        #{vistoria.vistoria_id || '---'}
                                    </span>
                                    {vistoria.isLocal && (vistoria.synced === false || vistoria.synced === undefined || vistoria.synced === 0) && (
                                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                            Pendente
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(vistoria.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{vistoria.tipo_info || 'Vistoria Geral'}</h3>

                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                <p className="line-clamp-2">{vistoria.endereco || 'Sem endereço'}</p>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); generatePDF(vistoria, 'vistoria') }}
                                    className="p-2 text-gray-400 hover:text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Exportar PDF"
                                >
                                    <Share size={18} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(vistoria.id, e)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default VistoriaList
