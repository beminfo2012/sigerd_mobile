import React, { useState, useEffect } from 'react'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, AlertOctagon } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteInterdicaoLocal, getAllInterdicoesLocal } from '../../services/db'

const InterdicaoList = ({ onNew, onEdit }) => {
    const [interdicoes, setInterdicoes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchInterdicoes()
    }, [])

    const fetchInterdicoes = async () => {
        setLoading(true)
        try {
            // 1. Cloud
            const { data: cloudData, error } = await supabase
                .from('interdicoes')
                .select('*')
                .order('created_at', { ascending: false })

            // 2. Local
            const localData = await getAllInterdicoesLocal().catch(() => [])

            // 3. Merge
            const merged = [...(cloudData || [])]
            localData.forEach(localItem => {
                const alreadyInCloud = merged.some(c =>
                    (c.interdicao_id === localItem.interdicaoId && c.interdicao_id) ||
                    (c.id === localItem.id)
                )

                if (!alreadyInCloud) {
                    merged.push({
                        ...localItem,
                        id: localItem.id,
                        interdicao_id: localItem.interdicaoId,
                        created_at: localItem.createdAt || new Date().toISOString(),
                        isLocal: true,
                        synced: localItem.synced
                    })
                }
            })

            merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setInterdicoes(merged)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation()
        if (window.confirm('Tem certeza que deseja excluir esta interdição?')) {
            const { error } = await supabase.from('interdicoes').delete().eq('id', id)
            if (!error) {
                await deleteInterdicaoLocal(id)
                setInterdicoes(prev => prev.filter(v => v.id !== id))
                // Dispatch event to notify forms to recalculate next ID
                window.dispatchEvent(new CustomEvent('interdicao-deleted'))
            } else {
                alert('Erro ao excluir.')
            }
        }
    }

    const filteredInterdicoes = interdicoes.filter(v =>
        v.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.responsavel_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.interdicao_id?.toString().includes(searchTerm)
    )

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">Interdições</h1>
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

            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Carregando interdições...</div>
                ) : filteredInterdicoes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <FileText size={48} className="mb-2 opacity-50" />
                        <p>Nenhuma interdição encontrada.</p>
                    </div>
                ) : (
                    filteredInterdicoes.map(item => (
                        <div
                            key={item.id}
                            onClick={() => onEdit(item)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-2 items-center">
                                    <span className="bg-blue-50 text-[#2a5299] text-xs font-bold px-2 py-1 rounded-md">
                                        #{item.interdicao_id || '---'}
                                    </span>
                                    {item.isLocal && !item.synced && (
                                        <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                            Pendente
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">
                                {item.medida_tipo ? `Interdição ${item.medida_tipo}` : 'Interdição'}
                            </h3>

                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                <p className="line-clamp-2">{item.endereco || 'Sem endereço'}</p>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); generatePDF(item, 'interdicao') }}
                                    className="p-2 text-gray-400 hover:text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Exportar PDF"
                                >
                                    <Share size={18} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(item.id, e)}
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

export default InterdicaoList
