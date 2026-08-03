import React, { useState, useEffect, useContext } from 'react'
import { UserContext } from '../../App'
import { contingencyDb } from '../../services/contingencyDb'
import { supabase } from '../../services/supabase'
import { 
    Shield, ChevronRight, CheckCircle, Search, Users, Plus, 
    Trash2, Edit3, Phone, Mail, FileText, Layers, Award, Package, 
    X, AlertCircle, Building2, ExternalLink, CheckSquare, Sparkles 
} from 'lucide-react'

const PlaconMatriz = ({ isPublicMode }) => {
    const userProfile = useContext(UserContext)
    const [orgaos, setOrgaos] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrgao, setSelectedOrgao] = useState(null)
    const [orgaoData, setOrgaoData] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activePlan, setActivePlan] = useState(null)

    // Modais e Estados do Form
    const [showContatoModal, setShowContatoModal] = useState(false)
    const [contatoForm, setContatoForm] = useState({ nome: '', cargo: '', telefone: '', email: '', is_responsavel_principal: false })
    
    const [showAtribuicaoModal, setShowAtribuicaoModal] = useState(false)
    const [atribuicaoForm, setAtribuicaoForm] = useState({ fase: 'Prevenção', texto: '', base_legal: '' })
    
    const [showRecursoModal, setShowRecursoModal] = useState(false)
    const [availableMciRecursos, setAvailableMciRecursos] = useState([])
    const [recursoForm, setRecursoForm] = useState({ mci_recurso_id: '', categoria: 'Veículos', alocado_no_plano: 1 })
    const [loadingMci, setLoadingMci] = useState(false)

    const isCoordenador = ['Admin', 'Administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(userProfile?.role) || isPublicMode

    useEffect(() => {
        loadOrgaos()
        loadActivePlan()
    }, [userProfile])

    const loadActivePlan = async () => {
        const plan = await contingencyDb.getActivePlan()
        setActivePlan(plan)
    }

    const loadOrgaos = async () => {
        setLoading(true)
        try {
            const data = await contingencyDb.getOrgaos(userProfile?.id, isCoordenador)
            setOrgaos(data)
            if (data && data.length > 0) {
                handleSelectOrgao(data[0].id)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOrgao = async (id) => {
        setSelectedOrgao(id)
        const full = await contingencyDb.getOrgaoCompleto(id)
        setOrgaoData(full)
    }

    // Ações de Atribuição
    const handleSaveAtribuicao = async (e) => {
        e.preventDefault()
        if (!atribuicaoForm.texto.trim()) return
        try {
            await contingencyDb.createAtribuicao({
                orgao_id: orgaoData.id,
                fase: atribuicaoForm.fase,
                texto: atribuicaoForm.texto,
                base_legal: atribuicaoForm.base_legal,
                ordem_exibicao: (orgaoData.atribuicoes || []).length + 1
            })
            setShowAtribuicaoModal(false)
            setAtribuicaoForm({ fase: 'Prevenção', texto: '', base_legal: '' })
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
            alert("Erro ao salvar atribuição")
        }
    }

    const handleDeleteAtribuicao = async (id) => {
        if (!window.confirm("Deseja realmente remover esta atribuição?")) return
        try {
            await supabase.from('atribuicoes').delete().eq('id', id)
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
        }
    }

    // Ações de Contato
    const handleSaveContato = async (e) => {
        e.preventDefault()
        if (!contatoForm.nome.trim()) return
        try {
            const { error } = await supabase.from('contatos').insert([{
                orgao_id: orgaoData.id,
                nome: contatoForm.nome,
                cargo: contatoForm.cargo,
                telefone: contatoForm.telefone,
                email: contatoForm.email,
                is_responsavel_principal: contatoForm.is_responsavel_principal
            }])
            if (error) throw error
            setShowContatoModal(false)
            setContatoForm({ nome: '', cargo: '', telefone: '', email: '', is_responsavel_principal: false })
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
            alert("Erro ao adicionar contato")
        }
    }

    const handleDeleteContato = async (id) => {
        if (!window.confirm("Deseja remover este contato institucional?")) return
        try {
            await supabase.from('contatos').delete().eq('id', id)
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
        }
    }

    // Ações de Recursos MCI
    const handleOpenRecursoModal = async () => {
        setShowRecursoModal(true)
        setLoadingMci(true)
        try {
            const { data } = await supabase.from('mci_recursos').select('*').order('nome')
            setAvailableMciRecursos(data || [])
            if (data && data.length > 0) {
                setRecursoForm(prev => ({ ...prev, mci_recurso_id: data[0].id }))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingMci(false)
        }
    }

    const handleSaveRecurso = async (e) => {
        e.preventDefault()
        if (!recursoForm.mci_recurso_id) return
        try {
            const { error } = await supabase.from('recursos_plano').insert([{
                orgao_id: orgaoData.id,
                mci_recurso_id: recursoForm.mci_recurso_id,
                categoria: recursoForm.categoria,
                alocado_no_plano: parseInt(recursoForm.alocado_no_plano) || 1
            }])
            if (error) throw error
            setShowRecursoModal(false)
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
            alert("Erro ao vincular recurso MCI")
        }
    }

    const handleDeleteRecurso = async (id) => {
        if (!window.confirm("Deseja desvincular este recurso do Plano de Contingência?")) return
        try {
            await supabase.from('recursos_plano').delete().eq('id', id)
            handleSelectOrgao(orgaoData.id)
        } catch (err) {
            console.error(err)
        }
    }

    const filteredOrgaos = orgaos.filter(o => 
        o.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.nome_curto.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-10">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando PLACON...</span>
            </div>
        </div>
    )

    if (orgaos.length === 0) return (
        <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">
            Nenhum órgão vinculado ao seu perfil.
        </div>
    )

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 w-full overflow-hidden">
            {/* Sidebar de Órgãos */}
            <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                            <Building2 size={14} className="text-blue-500" /> Órgãos do Plano ({orgaos.length})
                        </h3>
                    </div>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input 
                            type="text" 
                            placeholder="Buscar órgão por sigla ou nome..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold outline-none border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                    {filteredOrgaos.map(o => {
                        const isSelected = selectedOrgao === o.id
                        return (
                            <button 
                                key={o.id} 
                                onClick={() => handleSelectOrgao(o.id)}
                                className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between group relative overflow-hidden ${
                                    isSelected 
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div 
                                        className={`w-3 h-3 rounded-full shrink-0 border-2 ${isSelected ? 'border-white' : 'border-slate-300 dark:border-slate-700'}`} 
                                        style={{ backgroundColor: o.cor_hex || '#3b82f6' }}
                                    ></div>
                                    <div className="overflow-hidden">
                                        <p className={`text-xs font-black uppercase truncate tracking-tight ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                                            {o.nome_curto}
                                        </p>
                                        <p className={`text-[9px] font-medium truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {o.nome_completo}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'text-white translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Painel Principal do Órgão Selecionado */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {orgaoData && (
                    <div className="max-w-5xl mx-auto space-y-8 pb-20">
                        {/* Header com Glassmorphism e Cores do Órgão */}
                        <div className="relative bg-white dark:bg-slate-900 p-7 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                            <div className="absolute top-0 left-0 w-2.5 h-full" style={{ backgroundColor: orgaoData.cor_hex || '#3b82f6' }}></div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pl-2">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-inner">
                                        <Shield size={28} style={{ color: orgaoData.cor_hex || '#3b82f6' }} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: orgaoData.cor_hex || '#3b82f6' }}>
                                                {orgaoData.nome_curto}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PLACON 2026</span>
                                        </div>
                                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1 uppercase">{orgaoData.nome_completo}</h1>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{orgaoData.descricao_responsabilidade}</p>
                                    </div>
                                </div>

                                {activePlan && !isPublicMode && (
                                    <div className="shrink-0 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 p-3.5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest">Plano em Operação</p>
                                            <p className="text-xs font-black uppercase text-slate-800 dark:text-white">Nível: {activePlan.nivel}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Métrica Resumida */}
                            <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Atribuições Mapeadas</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{orgaoData.atribuicoes?.length || 0}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Contatos Responsáveis</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{orgaoData.contatos?.length || 0}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Recursos Alocados (MCI)</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{orgaoData.recursos?.reduce((acc, r) => acc + (r.alocado_no_plano || 0), 0)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Autoridades Vinculadas</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{orgaoData.assinaturas?.length || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Matriz de Responsabilidades em Fases */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Layers size={16} className="text-blue-500" /> Matriz de Responsabilidades
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-medium">Ações operacionais distribuídas por fases do desastre</p>
                                </div>
                                {isCoordenador && !isPublicMode && (
                                    <button 
                                        onClick={() => setShowAtribuicaoModal(true)} 
                                        className="px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                                    >
                                        <Plus size={13} /> Nova Atribuição
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {['Prevenção', 'Preparação', 'Resposta'].map(fase => {
                                    const atrs = (orgaoData.atribuicoes || []).filter(a => a.fase === fase)
                                    const faseColors = {
                                        Prevenção: { border: 'border-emerald-200 dark:border-emerald-900/40', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', dot: 'bg-emerald-500' },
                                        Preparação: { border: 'border-amber-200 dark:border-amber-900/40', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', dot: 'bg-amber-500' },
                                        Resposta: { border: 'border-rose-200 dark:border-rose-900/40', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300', dot: 'bg-rose-500' }
                                    }
                                    return (
                                        <div key={fase} className={`bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border ${faseColors[fase].border} flex flex-col justify-between`}>
                                            <div>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${faseColors[fase].badge}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${faseColors[fase].dot}`}></div>
                                                        {fase} ({atrs.length})
                                                    </span>
                                                </div>

                                                <ul className="space-y-3">
                                                    {atrs.map(a => (
                                                        <li key={a.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 relative group hover:border-blue-200 transition-all">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{a.texto}</p>
                                                                {isCoordenador && !isPublicMode && (
                                                                    <button 
                                                                        onClick={() => handleDeleteAtribuicao(a.id)}
                                                                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        title="Excluir atribuição"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {a.base_legal && (
                                                                <span className="inline-block mt-2 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                                                                    Base Legal: {a.base_legal}
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                    {atrs.length === 0 && (
                                                        <li className="text-[11px] italic text-slate-400 py-6 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl">
                                                            Nenhuma atribuição cadastrada nesta fase.
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Seção 2: Contatos Institucionais & Capacidade Instalada MCI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Contatos Institucionais */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Users size={16} className="text-indigo-500" /> Contatos Institucionais
                                    </h2>
                                    {isCoordenador && !isPublicMode && (
                                        <button 
                                            onClick={() => setShowContatoModal(true)} 
                                            className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Adicionar Contato
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                                    {orgaoData.contatos.map(c => (
                                        <div key={c.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                    <Users size={18} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black uppercase text-slate-900 dark:text-white">{c.nome}</span>
                                                        {c.is_responsavel_principal && (
                                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[8px] font-black rounded-full uppercase">
                                                                Titular
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-0.5">{c.cargo}</p>
                                                    
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                                        {c.telefone && <span className="flex items-center gap-1"><Phone size={10} /> {c.telefone}</span>}
                                                        {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {isCoordenador && !isPublicMode && (
                                                <button 
                                                    onClick={() => handleDeleteContato(c.id)}
                                                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {orgaoData.contatos.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum contato institucional registrado para este órgão.</p>
                                    )}
                                </div>
                            </div>

                            {/* Recursos MCI */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Package size={16} className="text-emerald-500" /> Capacidade Instalada (MCI)
                                    </h2>
                                    {isCoordenador && !isPublicMode && (
                                        <button 
                                            onClick={handleOpenRecursoModal} 
                                            className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Vincular Recurso MCI
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-3">
                                    {orgaoData.recursos.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-emerald-200 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                                        {r.mci_recursos ? r.mci_recursos.nome : `Recurso MCI #${String(r.mci_recurso_id).slice(0, 8)}`}
                                                    </p>
                                                    <span className="inline-block text-[9px] font-bold text-slate-400 uppercase">
                                                        Categoria: {r.categoria}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{r.alocado_no_plano}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase">Unidades</p>
                                                </div>
                                                {isCoordenador && !isPublicMode && (
                                                    <button 
                                                        onClick={() => handleDeleteRecurso(r.id)}
                                                        className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {orgaoData.recursos.length === 0 && (
                                        <p className="text-xs text-slate-400 italic py-6 text-center">Nenhum recurso da Capacidade Instalada (MCI) vinculado a este órgão.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seção 3: Autoridades e Assinaturas Oficiais */}
                        {orgaoData.assinaturas && orgaoData.assinaturas.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                                    <Award size={16} className="text-amber-500" /> Autoridade Responsável e Assinatura Oficial (e-Docs)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {orgaoData.assinaturas.map(ass => (
                                        <div key={ass.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-slate-900 dark:text-white">{ass.nome}</p>
                                                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">{ass.cargo}</p>
                                                <p className="text-[9px] text-slate-400 mt-1 font-medium">{ass.contato}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: Nova Atribuição */}
            {showAtribuicaoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <Layers size={16} className="text-blue-500" /> Nova Atribuição Operacional
                            </h3>
                            <button onClick={() => setShowAtribuicaoModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAtribuicao} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Fase do Desastre</label>
                                <select 
                                    value={atribuicaoForm.fase}
                                    onChange={(e) => setAtribuicaoForm({ ...atribuicaoForm, fase: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold uppercase text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="Prevenção">Prevenção</option>
                                    <option value="Preparação">Preparação</option>
                                    <option value="Resposta">Resposta</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Descrição da Responsabilidade</label>
                                <textarea 
                                    required
                                    rows={3}
                                    placeholder="Descreva detalhadamente a ação ou responsabilidade do órgão..."
                                    value={atribuicaoForm.texto}
                                    onChange={(e) => setAtribuicaoForm({ ...atribuicaoForm, texto: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Base Legal / Normativa (Opcional)</label>
                                <input 
                                    type="text"
                                    placeholder="Ex: Lei Municipal nº 1.234/2023, Decreto 022/2023"
                                    value={atribuicaoForm.base_legal}
                                    onChange={(e) => setAtribuicaoForm({ ...atribuicaoForm, base_legal: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAtribuicaoModal(false)}
                                    className="px-4 py-2.5 text-[11px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-md shadow-blue-500/20"
                                >
                                    Salvar Atribuição
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Novo Contato */}
            {showContatoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <Users size={16} className="text-indigo-500" /> Cadastrar Contato Institucional
                            </h3>
                            <button onClick={() => setShowContatoModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveContato} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nome Completo</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ex: João da Silva"
                                    value={contatoForm.nome}
                                    onChange={(e) => setContatoForm({ ...contatoForm, nome: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Cargo / Função</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ex: Secretário Titular / Diretor Operacional"
                                    value={contatoForm.cargo}
                                    onChange={(e) => setContatoForm({ ...contatoForm, cargo: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Telefone / Celular</label>
                                    <input 
                                        type="text"
                                        placeholder="(27) 99999-9999"
                                        value={contatoForm.telefone}
                                        onChange={(e) => setContatoForm({ ...contatoForm, telefone: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">E-mail Institucional</label>
                                    <input 
                                        type="email"
                                        placeholder="contato@pmsmj.es.gov.br"
                                        value={contatoForm.email}
                                        onChange={(e) => setContatoForm({ ...contatoForm, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input 
                                    type="checkbox"
                                    id="chk_titular"
                                    checked={contatoForm.is_responsavel_principal}
                                    onChange={(e) => setContatoForm({ ...contatoForm, is_responsavel_principal: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="chk_titular" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Responsável Principal (Titular da Pasta)
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    type="button" 
                                    onClick={() => setShowContatoModal(false)}
                                    className="px-4 py-2.5 text-[11px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-md shadow-indigo-500/20"
                                >
                                    Salvar Contato
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Vincular Recurso MCI */}
            {showRecursoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <Package size={16} className="text-emerald-500" /> Vincular Recurso MCI
                            </h3>
                            <button onClick={() => setShowRecursoModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        {loadingMci ? (
                            <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase">Buscando recursos cadastrados no MCI...</div>
                        ) : (
                            <form onSubmit={handleSaveRecurso} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Selecione o Recurso do MCI</label>
                                    <select 
                                        value={recursoForm.mci_recurso_id}
                                        onChange={(e) => setRecursoForm({ ...recursoForm, mci_recurso_id: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {availableMciRecursos.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.nome} ({r.categoria})
                                            </option>
                                        ))}
                                        {availableMciRecursos.length === 0 && (
                                            <option value="">Nenhum recurso cadastrado no MCI</option>
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Categoria de Exibição no Plano</label>
                                    <select 
                                        value={recursoForm.categoria}
                                        onChange={(e) => setRecursoForm({ ...recursoForm, categoria: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="Veículos">Veículos</option>
                                        <option value="Materiais">Materiais</option>
                                        <option value="Recursos Humanos">Recursos Humanos</option>
                                        <option value="Instituições e Apoio Voluntário">Instituições e Apoio Voluntário</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Quantidade Alocada no Plano</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        required
                                        value={recursoForm.alocado_no_plano}
                                        onChange={(e) => setRecursoForm({ ...recursoForm, alocado_no_plano: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowRecursoModal(false)}
                                        className="px-4 py-2.5 text-[11px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={availableMciRecursos.length === 0}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        Vincular Recurso
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlaconMatriz

