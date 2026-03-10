import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, MapPin, Calendar, Trash2, Share, Filter, X, ChevronDown, Mail, Printer, ArrowLeft, Eye, ChevronRight, AlertOctagon } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { generatePDF } from '../../utils/pdfGenerator'
import { deleteInterdicaoLocal, getAllInterdicoesLocal, getInterdicaoFull } from '../../services/db'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

const InterdicaoList = ({ onNew, onEdit }) => {
    const navigate = useNavigate()
    const [interdicoes, setInterdicoes] = useState([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filters, setFilters] = useState({
        bairro: '',
        riscoGrau: '',
        startDate: '',
        endDate: ''
    })
    const [emailModal, setEmailModal] = useState({ open: false, interdicao: null })
    const [emailAddress, setEmailAddress] = useState('')
    const [deleteModal, setDeleteModal] = useState({ open: false, interdicao: null })

    useEffect(() => {
        fetchInterdicoes()

        // Refresh list when sync completes
        const handleSyncComplete = () => {
            fetchInterdicoes();
        }
        window.addEventListener('sync-complete', handleSyncComplete);
        return () => window.removeEventListener('sync-complete', handleSyncComplete);
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
            const merged = [...(cloudData || [])].map(item => ({
                ...item,
                synced: true,
                riscoGrau: item.risco_grau || item.riscoGrau,
                responsavelNome: item.responsavel_nome || item.responsavelNome,
                medidaTipo: item.medida_tipo || item.medidaTipo,
                dataHora: item.data_hora || item.dataHora,
                endereco: item.endereco || item.logradouro || '',
                bairro: item.bairro || item.localidade || ''
            }))

            localData.forEach(localItem => {
                const iid = localItem.interdicaoId || localItem.interdicao_id;
                const alreadyInCloud = merged.some(c =>
                    (iid && c.interdicao_id === iid) ||
                    (localItem.id && c.id === localItem.id) ||
                    (localItem.supabase_id && c.id === localItem.supabase_id)
                )

                if (!alreadyInCloud) {
                    merged.push({
                        ...localItem,
                        id: localItem.id,
                        interdicao_id: iid,
                        created_at: localItem.createdAt || localItem.created_at || new Date().toISOString(),
                        isLocal: true,
                        synced: localItem.synced,
                        riscoGrau: localItem.riscoGrau || localItem.risco_grau,
                        responsavelNome: localItem.responsavelNome || localItem.responsavel_nome,
                        medidaTipo: localItem.medidaTipo || localItem.medida_tipo
                    })
                }
            })

            // Sort merged by ID (NN/YYYY) descending
            merged.sort((a, b) => {
                const idA = a.interdicao_id || '';
                const idB = b.interdicao_id || '';

                if (!idA || !idB || !idA.includes('/') || !idB.includes('/')) {
                    return new Date(b.created_at) - new Date(a.created_at);
                }

                const [numA, yearA] = idA.split('/').map(Number);
                const [numB, yearB] = idB.split('/').map(Number);

                if (yearA !== yearB) return yearB - yearA;
                return numB - numA;
            })

            setInterdicoes(merged)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (interdicao, e) => {
        e.stopPropagation()
        setDeleteModal({ open: true, interdicao })
    }

    const confirmDeletion = async () => {
        const interdicao = deleteModal.interdicao
        if (!interdicao) return

        const id = interdicao.id
        const supabaseId = interdicao.supabase_id || (typeof id === 'string' && id.includes('-') ? id : null)

        let error = null
        if (supabaseId) {
            const { error: remoteError } = await supabase.from('interdicoes').delete().eq('id', supabaseId)
            error = remoteError
        }

        if (!error) {
            await deleteInterdicaoLocal(id)
            setInterdicoes(prev => prev.filter(v => v.id !== id))
            window.dispatchEvent(new CustomEvent('interdicao-deleted'))
        } else {
            console.error('Delete error:', error)
            alert('Erro ao excluir do servidor. Verifique sua conexão.')
        }
    }

    const handleClearFilters = () => {
        setFilters({
            bairro: '',
            riscoGrau: '',
            startDate: '',
            endDate: ''
        })
        setSearchTerm('')
    }

    const handleEmailShare = (interdicao, e) => {
        e.stopPropagation()
        setEmailModal({ open: true, interdicao })
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
            let fullInterdicao = await getInterdicaoFull(emailModal.interdicao.id);
            if (!fullInterdicao && (emailModal.interdicao.supabase_id || emailModal.interdicao.id)) {
                const targetId = emailModal.interdicao.supabase_id || emailModal.interdicao.id;
                const { data } = await supabase.from('interdicoes').select('*').eq('id', targetId).single();
                if (data) fullInterdicao = data;
            }
            fullInterdicao = fullInterdicao || emailModal.interdicao;

            await generatePDF(fullInterdicao, 'interdicao')

            const interdicaoId = fullInterdicao.interdicao_id || fullInterdicao.interdicaoId || 'N/A'
            const responsavel = fullInterdicao.responsavel_nome || fullInterdicao.responsavelNome || 'Proprietário'
            const endereco = fullInterdicao.endereco || 'Endereço não informado'

            const subject = encodeURIComponent(`Relatório de Interdição ${interdicaoId}`)
            const body = (
                `Prezado(a),\n\n` +
                `Segue em anexo o Relatório de Interdição ${interdicaoId}.\n\n` +
                `Responsável: ${responsavel}\n` +
                `Local: ${endereco}\n\n` +
                `O arquivo PDF foi baixado no seu dispositivo. Por favor, anexe-o a este email antes de enviar.\n\n` +
                `Atenciosamente,\n` +
                `Defesa Civil Municipal de Santa Maria de Jetibá`
            )

            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
            setEmailModal({ open: false, interdicao: null })
            setEmailAddress('')
        } catch (e) {
            console.error(e)
            alert('Erro ao gerar PDF ou preparar email.')
        } finally {
            setSending(false)
        }
    }

    const neighborhoods = [...new Set(interdicoes.map(v => v.bairro).filter(Boolean))].sort()

    const filteredInterdicoes = interdicoes.filter(v => {
        const matchesSearch = !searchTerm ||
            v.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.responsavelNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.interdicao_id?.toString().includes(searchTerm);

        const matchesBairro = !filters.bairro || v.bairro === filters.bairro;
        const matchesRisco = !filters.riscoGrau || v.riscoGrau === filters.riscoGrau;

        const dateStr = new Date(v.created_at).toISOString().split('T')[0];
        const matchesStartDate = !filters.startDate || dateStr >= filters.startDate;
        const matchesEndDate = !filters.endDate || dateStr <= filters.endDate;

        return matchesSearch && matchesBairro && matchesRisco && matchesStartDate && matchesEndDate;
    })

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-95"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                                    <AlertOctagon className="text-red-500" /> Interdições
                                </h1>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Gerenciamento de Medidas Administrativas</p>
                            </div>
                        </div>
                        <Button
                            onClick={onNew}
                            className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-4 sm:px-6"
                        >
                            <Plus size={18} className="mr-2" /> <span className="hidden sm:inline">Nova Interdição</span><span className="sm:hidden">Nova</span>
                        </Button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por endereço, responsável ou ID..."
                                className="w-full bg-slate-100 dark:bg-slate-900/50 p-3.5 pl-12 rounded-2xl border border-transparent focus:border-blue-500/20 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-sm text-slate-700 dark:text-slate-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex-1 sm:flex-none px-6 rounded-2xl transition-all flex items-center justify-center gap-2 border font-bold text-sm h-[52px] ${isFilterOpen || activeFiltersCount > 0
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                    }`}
                            >
                                <Filter size={20} />
                                <span>Filtros</span>
                                {activeFiltersCount > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Expanded Filters Panel */}
                    {isFilterOpen && (
                        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/20 dark:shadow-none animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[2px]">Filtros de Refinamento</h3>
                                <button
                                    onClick={handleClearFilters}
                                    className="text-blue-600 text-xs font-black hover:underline uppercase tracking-widest disabled:opacity-30"
                                    disabled={activeFiltersCount === 0 && !searchTerm}
                                >
                                    Limpar Filtros
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Região / Bairro</label>
                                    <select
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                                        value={filters.bairro}
                                        onChange={(e) => setFilters(prev => ({ ...prev, bairro: e.target.value }))}
                                    >
                                        <option value="">Todas as Localidades</option>
                                        {neighborhoods.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Grau de Risco</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['Baixo', 'Médio', 'Alto', 'Iminente'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => setFilters(prev => ({ ...prev, riscoGrau: prev.riscoGrau === level ? '' : level }))}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${filters.riscoGrau === level
                                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                                                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Período</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="date"
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                            value={filters.startDate}
                                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                        <input
                                            type="date"
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
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
            <div className="max-w-6xl mx-auto p-4 sm:p-6 text-center">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Carregando interdições...</p>
                    </div>
                ) : filteredInterdicoes.length === 0 ? (
                    <div className="py-20 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 text-center">
                        <div className="bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertOctagon size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Nenhum registro encontrado</h3>
                        <p className="text-slate-400 text-sm mt-1">Tente ajustar seus filtros ou busca.</p>
                        <Button onClick={handleClearFilters} variant="secondary" className="mt-6">
                            Limpar Tudo
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInterdicoes.map(item => (
                            <Card
                                key={item.id}
                                onClick={() => onEdit(item)}
                                className="group relative bg-white dark:bg-slate-800 p-6 flex flex-col justify-between hover:shadow-xl hover:translate-y-[-4px] active:scale-[0.98] transition-all cursor-pointer border-slate-100 dark:border-slate-700 text-left"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                                #{item.interdicao_id || '---'}
                                            </span>
                                            {item.isLocal && (item.synced === false || item.synced === undefined || item.synced === 0) && (
                                                <span className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 flex items-center gap-1 uppercase">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                    Pendente
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 border border-slate-100 dark:border-slate-700 px-2 py-1 rounded-lg">
                                            <Calendar size={12} />
                                            {new Date(item.dataHora || item.data_hora || item.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-tight group-hover:text-red-600 transition-colors">
                                            {item.responsavelNome || 'Proprietário Não Identificado'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-red-500 dark:text-red-400 font-black uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                                                {item.medidaTipo || 'Interdição'}
                                            </p>
                                            {item.riscoGrau && item.riscoGrau !== 'Baixo' && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${item.riscoGrau === 'Iminente' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800' :
                                                    item.riscoGrau === 'Alto' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' :
                                                        'bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800'
                                                    }`}>
                                                    {item.riscoGrau}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 mb-4 h-[72px] overflow-hidden">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-red-600" />
                                        <p className="line-clamp-2 font-bold leading-snug">
                                            {item.endereco || 'Endereço não informado'} <br />
                                            <span className="text-[10px] font-medium text-slate-400">{item.bairro || ''}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                    <div className="flex gap-1.5 px-1">
                                        <button
                                            onClick={(e) => handleEmailShare(item, e)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all active:scale-95"
                                            title="Enviar Email"
                                        >
                                            <Mail size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(`/interdicao/imprimir/${item.id || item.interdicao_id}`, '_blank') }}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all active:scale-95"
                                            title="Visualizar Detalhes"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(`/interdicao/imprimir/${item.id || item.interdicao_id}`, '_blank') }}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-2xl transition-all active:scale-95"
                                            title="Imprimir Relatório"
                                        >
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleDelete(item, e)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all active:scale-95"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="w-8 h-8 flex items-center justify-center text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Email Share Modal */}
            {emailModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEmailModal({ open: false, interdicao: null })}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                                <Mail className="text-blue-600" size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Enviar por Email</h2>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Digite o email para enviar o relatório da interdição <span className="font-bold text-red-600">#{emailModal.interdicao?.interdicao_id}</span>
                        </p>

                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                            <p className="text-xs font-bold text-red-800 dark:text-red-300">📧 O PDF será anexado automaticamente</p>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">O arquivo será gerado e baixado no seu dispositivo.</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Endereço de Email</label>
                            <input
                                type="email"
                                inputMode="email"
                                placeholder="exemplo@email.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-base text-slate-700 dark:text-slate-200"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendViaEmail()}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setEmailModal({ open: false, interdicao: null })}
                                className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={sendViaEmail}
                                disabled={!emailAddress.includes('@')}
                                className="flex-1 p-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Mail size={18} />
                                {sending ? 'Enviando...' : 'Enviar Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Safety Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, interdicao: null })}
                onConfirm={confirmDeletion}
                title="Excluir Interdição"
                message={`Tem certeza que deseja excluir a interdição #${deleteModal.interdicao?.interdicao_id}? Esta ação não pode ser desfeita.`}
                confirmText="Sim, Excluir"
                cancelText="Mantenha para mim"
            />
        </div>
    )
}

export default InterdicaoList
