import React, { useState, useEffect, useContext } from 'react'
import { UserContext } from '../../App'
import { contingencyDb } from '../../services/contingencyDb'
import { supabase } from '../../services/supabase'
import { toast } from '../../components/ToastNotification'
import { 
    Shield, ChevronRight, CheckCircle, Search, Users, Plus, 
    Trash2, Edit3, Phone, Mail, FileText, Layers, Award, Package, 
    X, AlertCircle, Building2, ExternalLink, CheckSquare, Sparkles,
    Settings, Sliders, Check, List, RefreshCcw, FileCheck, Layers3, Clock, Zap, Save
} from 'lucide-react'

const PlaconMatriz = ({ isPublicMode, showGerenciador: propShowGerenciador, setShowGerenciador: propSetShowGerenciador }) => {
    const userProfile = useContext(UserContext)
    const [orgaos, setOrgaos] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrgao, setSelectedOrgao] = useState(null)
    const [orgaoData, setOrgaoData] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [activePlan, setActivePlan] = useState(null)

    // Cache em memória para troca INSTÂNTANEA (0ms) de secretarias
    const [orgaoCache, setOrgaoCache] = useState({})

    // Modal Central do Gerenciador do Plano
    const [localShowGerenciador, setLocalShowGerenciador] = useState(false)
    const showGerenciador = propShowGerenciador !== undefined ? propShowGerenciador : localShowGerenciador
    const setShowGerenciador = propSetShowGerenciador || setLocalShowGerenciador
    const [activeGerenciadorTab, setActiveGerenciadorTab] = useState('orgaos_assinaturas') // 'orgaos_assinaturas' | 'atribuicoes' | 'versoes'

    // Form: Órgão + Lista Dinâmica de Assinaturas (Edição Unificada)
    const [selectedGerenciadorOrgaoId, setSelectedGerenciadorOrgaoId] = useState(null)
    const [isNovoOrgao, setIsNovoOrgao] = useState(false)
    const [gerenciadorSearch, setGerenciadorSearch] = useState('')
    const [orgaoForm, setOrgaoForm] = useState({
        nome_curto: '',
        nome_completo: '',
        cor_hex: '#1e40af',
        icone: 'Shield',
        descricao: ''
    })

    // Lista Dinâmica de Múltiplas Assinaturas/Titulares por Órgão
    const [assinaturasList, setAssinaturasList] = useState([
        { id: null, nome: '', cargo: '', telefone: '', email: '', identificacao_edocs: '' }
    ])

    // Form: Atribuição Operacional no Gerenciador
    const [atribuicaoFiltroOrgao, setAtribuicaoFiltroOrgao] = useState('todos')
    const [atribuicaoFiltroFase, setAtribuicaoFiltroFase] = useState('todas')
    const [editingAtribuicaoId, setEditingAtribuicaoId] = useState(null)
    const [atribuicaoForm, setAtribuicaoForm] = useState({
        orgao_id: '',
        fase: 'Prevenção',
        texto: '',
        base_legal: ''
    })
    const [todasAtribuicoes, setTodasAtribuicoes] = useState([])

    // Form: Versões do Plano
    const [versoes, setVersoes] = useState([])
    const [versaoForm, setVersaoForm] = useState({ numero_versao: '2026.1', data_alteracao: new Date().toISOString().split('T')[0], descricao: '' })

    const canManage = !isPublicMode

    useEffect(() => {
        loadOrgaos()
        loadActivePlan()
        loadVersoes()
    }, [userProfile])

    const loadActivePlan = async () => {
        const plan = await contingencyDb.getActivePlan()
        setActivePlan(plan)
    }

    // Precarrega todos os órgãos em paralelo para que a navegação seja instantânea (0ms)
    const prefetchTodosOrgaos = async (orgaosList) => {
        if (!orgaosList || orgaosList.length === 0) return
        try {
            const results = await Promise.all(
                orgaosList.map(o => contingencyDb.getOrgaoCompleto(o.id, userProfile?.tenant_id))
            )
            const map = {}
            results.forEach(res => {
                if (res && res.id) map[res.id] = res
            })
            setOrgaoCache(prev => ({ ...map, ...prev }))
        } catch (e) {
            console.error("Erro ao precarregar órgãos:", e)
        }
    }

    // Método com cache de memória para carregamento de órgãos em 0ms
    const getOrgaoWithCache = async (orgaoId) => {
        if (orgaoCache[orgaoId]) {
            return orgaoCache[orgaoId]
        }
        const full = await contingencyDb.getOrgaoCompleto(orgaoId, userProfile?.tenant_id)
        if (full) {
            setOrgaoCache(prev => ({ ...prev, [orgaoId]: full }))
        }
        return full
    }

    const loadOrgaos = async () => {
        setLoading(true)
        try {
            const data = await contingencyDb.getOrgaos(userProfile?.id, true, userProfile?.tenant_id)
            setOrgaos(data || [])
            if (data && data.length > 0) {
                const keepId = selectedOrgao && data.find(o => o.id === selectedOrgao) ? selectedOrgao : data[0].id
                handleSelectOrgao(keepId)
                if (!selectedGerenciadorOrgaoId) {
                    carregarFormOrgaoParaGerenciador(data[0].id)
                }
                // Dispara precarregamento de todas as secretarias em segundo plano
                prefetchTodosOrgaos(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const loadTodasAtribuicoes = async () => {
        try {
            const data = await contingencyDb.getAllAtribuicoes()
            setTodasAtribuicoes(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const loadVersoes = async () => {
        try {
            const { data } = await supabase.from('placon_versoes').select('*').order('created_at', { ascending: false })
            setVersoes(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const handleSelectOrgao = async (id) => {
        setSelectedOrgao(id)
        const full = await getOrgaoWithCache(id)
        setOrgaoData(full)
    }

    // =========================================================================
    // CARREGAR DADOS DE UM ÓRGÃO (COM CACHE EM MEMÓRIA - RESPOSTA INSTANTÂNEA)
    // =========================================================================
    const carregarFormOrgaoParaGerenciador = async (orgaoId) => {
        setSelectedGerenciadorOrgaoId(orgaoId)
        setIsNovoOrgao(false)
        
        // Busca com cache (resposta em 0ms no segundo clique)
        const full = await getOrgaoWithCache(orgaoId)
        
        setOrgaoForm({
            nome_curto: full?.nome_curto || '',
            nome_completo: full?.nome_completo || '',
            cor_hex: full?.cor_hex || '#1e40af',
            icone: full?.icone || 'Shield',
            descricao: full?.descricao_responsabilidade || full?.descricao || ''
        })

        // Mapear TODAS as assinaturas oficiais do órgão
        let list = []
        if (full?.assinaturas && full.assinaturas.length > 0) {
            list = full.assinaturas.map(a => ({
                id: a.id,
                nome: a.nome || '',
                cargo: a.cargo || '',
                telefone: a.contato || a.telefone || '',
                email: a.email || '',
                identificacao_edocs: a.identificacao_assinatura_edocs || ''
            }))
        } else if (full?.contatos && full.contatos.length > 0) {
            list = full.contatos.map(c => ({
                id: null,
                nome: c.nome || '',
                cargo: c.cargo || '',
                telefone: c.telefone || '',
                email: c.email || '',
                identificacao_edocs: ''
            }))
        }

        if (list.length === 0) {
            list = [{ id: null, nome: '', cargo: '', telefone: '', email: '', identificacao_edocs: '' }]
        }

        setAssinaturasList(list)
    }

    const handleNovoOrgaoNoGerenciador = () => {
        setSelectedGerenciadorOrgaoId(null)
        setIsNovoOrgao(true)
        setOrgaoForm({
            nome_curto: '',
            nome_completo: '',
            cor_hex: '#1e40af',
            icone: 'Building2',
            descricao: ''
        })
        setAssinaturasList([
            { id: null, nome: '', cargo: '', telefone: '', email: '', identificacao_edocs: '' }
        ])
    }

    // Handlers para manipular a lista dinâmica de assinaturas
    const handleAdicionarAssinaturaRow = () => {
        setAssinaturasList([
            ...assinaturasList,
            { id: null, nome: '', cargo: '', telefone: '', email: '', identificacao_edocs: '' }
        ])
    }

    const handleRemoverAssinaturaRow = (index) => {
        if (assinaturasList.length <= 1) {
            setAssinaturasList([{ id: null, nome: '', cargo: '', telefone: '', email: '', identificacao_edocs: '' }])
            return
        }
        setAssinaturasList(assinaturasList.filter((_, i) => i !== index))
    }

    const handleUpdateAssinaturaRow = (index, field, value) => {
        const updated = [...assinaturasList]
        updated[index] = { ...updated[index], [field]: value }
        setAssinaturasList(updated)
    }

    // =========================================================================
    // SALVAR ÓRGÃO + MÚLTIPLAS ASSINATURAS
    // =========================================================================
    const handleSaveGerenciadorOrgaoEAssinatura = async (e) => {
        e.preventDefault()
        if (!orgaoForm.nome_curto.trim() || !orgaoForm.nome_completo.trim()) {
            toast.warning("Campos Obrigatórios", "Preencha a sigla e o nome completo do órgão.")
            return
        }

        try {
            const tenantId = userProfile?.tenant_id || '00000000-0000-0000-0000-000000000001'
            let targetOrgaoId = selectedGerenciadorOrgaoId

            if (isNovoOrgao) {
                // Inserção do Novo Órgão exclusivamente na placon_orgaos
                const { data: newOrg, error: errPlacon } = await supabase.from('placon_orgaos').insert([{
                    tenant_id: tenantId,
                    nome_curto: orgaoForm.nome_curto.trim(),
                    nome_completo: orgaoForm.nome_completo.trim(),
                    cor_hex: orgaoForm.cor_hex,
                    icone: orgaoForm.icone,
                    descricao: orgaoForm.descricao,
                    ordem: orgaos.length + 1,
                    ativo: true
                }]).select().single()

                if (errPlacon) throw new Error("Erro ao criar órgão em placon_orgaos: " + errPlacon.message)
                targetOrgaoId = newOrg?.id
            } else {
                // Atualização do Órgão Existente exclusivamente em placon_orgaos
                const { error: errPlacon } = await supabase.from('placon_orgaos').update({
                    nome_curto: orgaoForm.nome_curto.trim(),
                    nome_completo: orgaoForm.nome_completo.trim(),
                    cor_hex: orgaoForm.cor_hex,
                    icone: orgaoForm.icone,
                    descricao: orgaoForm.descricao
                }).eq('id', targetOrgaoId)

                if (errPlacon) throw new Error("Erro ao atualizar órgão em placon_orgaos: " + errPlacon.message)
            }

            // Atualizar e sincronizar MÚLTIPLAS Assinaturas / Contatos Oficiais (placon_contatos com telefone e email SEPARADOS)
            if (targetOrgaoId) {
                const validAssinaturas = assinaturasList.filter(a => a.nome && a.nome.trim().length > 0)
                
                // Deletar contatos anteriores do órgão
                await supabase.from('placon_contatos').delete().eq('orgao_id', targetOrgaoId)

                if (validAssinaturas.length > 0) {
                    const contatosToInsert = validAssinaturas.map((a, idx) => ({
                        tenant_id: tenantId,
                        orgao_id: targetOrgaoId,
                        nome: a.nome.trim(),
                        cargo: a.cargo && a.cargo.trim() ? a.cargo.trim() : 'Titular / Assinante',
                        telefone: a.telefone && a.telefone.trim() ? a.telefone.trim() : 'Não informado',
                        email: a.email && a.email.trim() ? a.email.trim() : null,
                        is_responsavel_principal: idx === 0
                    }))

                    const { error: errContatos } = await supabase.from('placon_contatos').insert(contatosToInsert)
                    if (errContatos) {
                        console.error("Erro em placon_contatos:", errContatos)
                        throw new Error(errContatos.message || "Erro ao gravar contatos da secretaria.")
                    }

                    // Sincronizar também em placon_assinaturas se a tabela existir no Postgres
                    try {
                        await supabase.from('placon_assinaturas').delete().eq('orgao_id', targetOrgaoId)
                        const toInsertAss = validAssinaturas.map((a, idx) => ({
                            tenant_id: tenantId,
                            orgao_id: targetOrgaoId,
                            nome: a.nome.trim(),
                            cargo: a.cargo?.trim() || 'Titular / Assinante',
                            telefone: a.telefone?.trim() || 'Não informado',
                            email: a.email?.trim() || null,
                            identificacao_assinatura_edocs: a.identificacao_edocs || '',
                            ordem: idx + 1
                        }))
                        await supabase.from('placon_assinaturas').insert(toInsertAss)
                    } catch (eAss) {
                        console.warn("Tabela placon_assinaturas não presente ou em transição:", eAss)
                    }
                }
            }

            // Invalidar cache para esse órgão
            setOrgaoCache(prev => {
                const updated = { ...prev }
                delete updated[targetOrgaoId]
                return updated
            })

            toast.success("Sucesso!", "Órgão e Assinaturas salvos com sucesso no banco!")
            await loadOrgaos()
            if (targetOrgaoId) {
                handleSelectOrgao(targetOrgaoId)
                carregarFormOrgaoParaGerenciador(targetOrgaoId)
            }
        } catch (err) {
            console.error(err)
            toast.error("Erro ao Salvar", err.message || "Erro ao salvar dados do órgão e assinaturas.")
        }
    }

    // =========================================================================
    // SALVAR / REMOVER ATRIBUIÇÃO NO GERENCIADOR GERAL
    // =========================================================================
    const handleSaveGerenciadorAtribuicao = async (e) => {
        e.preventDefault()
        const targetOrgaoId = atribuicaoForm.orgao_id || selectedOrgao || (orgaos[0] && orgaos[0].id)
        if (!targetOrgaoId || !atribuicaoForm.texto.trim()) {
            toast.warning("Campos Obrigatórios", "Selecione o órgão e preencha a descrição da atribuição.")
            return
        }

        try {
            const tenantId = userProfile?.tenant_id || '00000000-0000-0000-0000-000000000001'

            if (editingAtribuicaoId) {
                const { error: errPlacon } = await supabase.from('placon_atribuicoes').update({
                    orgao_id: targetOrgaoId,
                    fase: atribuicaoForm.fase.toLowerCase(),
                    texto: atribuicaoForm.texto,
                    base_legal: atribuicaoForm.base_legal
                }).eq('id', editingAtribuicaoId)

                if (errPlacon) throw new Error("Erro ao atualizar atribuição: " + errPlacon.message)
            } else {
                await contingencyDb.createAtribuicao({
                    tenant_id: tenantId,
                    orgao_id: targetOrgaoId,
                    fase: atribuicaoForm.fase,
                    texto: atribuicaoForm.texto,
                    base_legal: atribuicaoForm.base_legal,
                    ordem_exibicao: todasAtribuicoes.length + 1
                })
            }

            // Invalidar cache
            setOrgaoCache(prev => {
                const updated = { ...prev }
                delete updated[targetOrgaoId]
                return updated
            })

            toast.success("Sucesso!", "Atribuição salva com sucesso!")
            setEditingAtribuicaoId(null)
            setAtribuicaoForm({ orgao_id: targetOrgaoId, fase: 'Prevenção', texto: '', base_legal: '' })
            await loadTodasAtribuicoes()
            if (selectedOrgao) handleSelectOrgao(selectedOrgao)
        } catch (err) {
            console.error(err)
            toast.error("Erro ao Salvar", err.message || "Erro ao salvar atribuição no gerenciador.")
        }
    }

    const handleDeleteGerenciadorAtribuicao = async (id) => {
        if (!window.confirm("Deseja remover esta atribuição do plano?")) return
        try {
            const { error } = await supabase.from('placon_atribuicoes').delete().eq('id', id)
            if (error) throw error
            toast.info("Removido", "Atribuição removida com sucesso.")
            await loadTodasAtribuicoes()
            if (selectedOrgao) handleSelectOrgao(selectedOrgao)
        } catch (err) {
            console.error(err)
            toast.error("Erro", "Erro ao remover atribuição.")
        }
    }

    // =========================================================================
    // SALVAR VERSÃO DO PLANO
    // =========================================================================
    const handleSaveVersaoPlano = async (e) => {
        e.preventDefault()
        if (!versaoForm.numero_versao || !versaoForm.descricao.trim()) return
        try {
            const tenantId = userProfile?.tenant_id || '00000000-0000-0000-0000-000000000001'
            const { error } = await supabase.from('placon_versoes').insert([{
                tenant_id: tenantId,
                numero_versao: versaoForm.numero_versao,
                data_alteracao: versaoForm.data_alteracao,
                descricao: versaoForm.descricao,
                usuario_id: userProfile?.id || null
            }])
            if (error) throw error

            setVersaoForm({ numero_versao: '2026.2', data_alteracao: new Date().toISOString().split('T')[0], descricao: '' })
            await loadVersoes()
            toast.success("Sucesso!", "Nova versão do Plano de Contingência registrada!")
        } catch (err) {
            console.error(err)
            toast.error("Erro ao Registrar", err.message || "Erro ao registrar versão do plano.")
        }
    }

    const filteredOrgaos = orgaos.filter(o => 
        o.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.nome_curto.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredGerenciadorOrgaos = orgaos.filter(o =>
        o.nome_completo.toLowerCase().includes(gerenciadorSearch.toLowerCase()) ||
        o.nome_curto.toLowerCase().includes(gerenciadorSearch.toLowerCase())
    )

    const atribuicoesFiltradasGerenciador = todasAtribuicoes.filter(a => {
        const matchesOrgao = atribuicaoFiltroOrgao === 'todos' || a.orgao_id === atribuicaoFiltroOrgao
        const matchesFase = atribuicaoFiltroFase === 'todas' || (a.fase || '').toLowerCase() === atribuicaoFiltroFase.toLowerCase()
        return matchesOrgao && matchesFase
    })

    if (loading) return (
        <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-10">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Carregando PLACON...</span>
            </div>
        </div>
    )

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 w-full overflow-hidden relative">
            {/* Sidebar de Órgãos (Visualizador Limpo) */}
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
                        {/* Header com Cores */}
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
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{orgaoData.descricao_responsabilidade || orgaoData.descricao}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {activePlan ? (
                                        <div className="bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                                            <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Ativo: {activePlan.nivel}</span>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2">
                                            <Clock size={12} className="text-amber-600" />
                                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Planejamento</span>
                                        </div>
                                    )}
                                </div>
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
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{orgaoData.recursos?.reduce((acc, r) => acc + (r.alocado_no_plano || r.alocado_plano || 0), 0)}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                                    <p className="text-[9px] font-black uppercase text-slate-400">Assinaturas Registradas</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        {orgaoData.assinaturas?.length ? orgaoData.assinaturas.length : (orgaoData.contatos?.length || 0)}
                                    </p>
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
                                    <p className="text-[10px] text-slate-400 font-medium">Ações operacionais distribuídas pelas 3 fases do desastre</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {['Prevenção', 'Preparação', 'Resposta'].map(fase => {
                                    const atrs = (orgaoData.atribuicoes || []).filter(a => (a.fase || '').toLowerCase() === fase.toLowerCase())
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
                                                        <li key={a.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{a.texto}</p>
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

                        {/* Seção de Assinaturas Oficiais Registradas e-Docs */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                                <Award size={16} className="text-amber-500" /> Assinaturas Oficiais Registradas (e-Docs)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(orgaoData.assinaturas && orgaoData.assinaturas.length > 0 ? orgaoData.assinaturas : orgaoData.contatos).map((ass, idx) => (
                                    <div key={ass.id || idx} className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 hover:border-amber-300 dark:hover:border-amber-800 transition-all">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900 shadow-inner">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase text-slate-900 dark:text-white">{ass.nome}</p>
                                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-0.5">{ass.cargo || 'Responsável Titular'}</p>
                                            {ass.identificacao_assinatura_edocs && (
                                                <span className="inline-block mt-1.5 text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    e-Docs: {ass.identificacao_assinatura_edocs}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seção Recursos MCI */}
                        <div className="space-y-4">
                            <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Package size={16} className="text-emerald-500" /> Capacidade Instalada Alocada (MCI)
                                </h2>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {orgaoData.recursos.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900">
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-slate-900 dark:text-white">
                                                    {r.nome_recurso || (r.mci_recursos ? r.mci_recursos.nome : `Recurso MCI #${String(r.mci_recurso_id).slice(0, 8)}`)}
                                                </p>
                                                <span className="inline-block text-[9px] font-bold text-slate-400 uppercase">
                                                    Categoria: {r.categoria}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{r.alocado_no_plano || r.alocado_plano || 0}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Alocados</p>
                                        </div>
                                    </div>
                                ))}
                                {orgaoData.recursos.length === 0 && (
                                    <p className="text-xs text-slate-400 italic py-6 text-center col-span-2">Nenhum recurso da Capacidade Instalada (MCI) vinculado a este órgão.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* =========================================================================
                MODAL CENTRAL DESIGN PREMIUM DE GERENCIAMENTO GERAL DO PLACON
               ========================================================================= */}
            {showGerenciador && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200 select-none">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                        
                        {/* Header do Gerenciador */}
                        <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                                    <Sliders size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Gerenciador Geral do PLACON</h2>
                                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-black rounded-full uppercase">Edição Centralizada</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Gestão unificada de secretarias, matriz de responsabilidades, titulares e assinaturas e-Docs</p>
                                </div>
                            </div>
                            <button onClick={() => setShowGerenciador(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <X size={22} />
                            </button>
                        </div>

                        {/* Abas Superiores do Gerenciador */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950 px-6 gap-2 shrink-0">
                            <button 
                                onClick={() => setActiveGerenciadorTab('orgaos_assinaturas')}
                                className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                    activeGerenciadorTab === 'orgaos_assinaturas' 
                                        ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <Building2 size={15} /> Órgãos & Assinaturas ({orgaos.length})
                            </button>
                            <button 
                                onClick={() => setActiveGerenciadorTab('atribuicoes')}
                                className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                    activeGerenciadorTab === 'atribuicoes' 
                                        ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <Layers size={15} /> Matriz de Atribuições ({todasAtribuicoes.length})
                            </button>
                            <button 
                                onClick={() => setActiveGerenciadorTab('versoes')}
                                className={`py-3.5 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                                    activeGerenciadorTab === 'versoes' 
                                        ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm' 
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <FileCheck size={15} /> Versões do Plano
                            </button>
                        </div>

                        {/* Conteúdo da Aba 1: Órgãos & Assinaturas */}
                        {activeGerenciadorTab === 'orgaos_assinaturas' && (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Lista Esquerda com Busca Rápida (Troca Instantânea 0ms) */}
                                <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-4 flex flex-col shrink-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Secretarias ({filteredGerenciadorOrgaos.length})</span>
                                        <button 
                                            onClick={handleNovoOrgaoNoGerenciador}
                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm transition-all"
                                        >
                                            <Plus size={12} /> Novo Órgão
                                        </button>
                                    </div>

                                    {/* Input de Filtro Rápido */}
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                        <input 
                                            type="text" 
                                            placeholder="Filtrar secretaria..."
                                            value={gerenciadorSearch}
                                            onChange={e => setGerenciadorSearch(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[11px] font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                                        {filteredGerenciadorOrgaos.map(o => {
                                            const isSel = selectedGerenciadorOrgaoId === o.id && !isNovoOrgao
                                            return (
                                                <button 
                                                    key={o.id} 
                                                    onClick={() => carregarFormOrgaoParaGerenciador(o.id)}
                                                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between group ${
                                                        isSel
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                                            : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-3 h-3 rounded-full shrink-0 border-2 ${isSel ? 'border-white' : 'border-slate-300 dark:border-slate-700'}`} style={{ backgroundColor: o.cor_hex || '#3b82f6' }}></div>
                                                        <div className="truncate">
                                                            <p className={`text-xs font-black uppercase truncate ${isSel ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{o.nome_curto}</p>
                                                            <p className={`text-[9px] truncate font-medium ${isSel ? 'text-blue-100' : 'text-slate-400'}`}>{o.nome_completo}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className={`shrink-0 ${isSel ? 'text-white' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Formulário Geral Unificado */}
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <form onSubmit={handleSaveGerenciadorOrgaoEAssinatura} className="space-y-6 max-w-3xl mx-auto">
                                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Edição Unificada</span>
                                                <h3 className="text-base font-black uppercase text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                                                    <Building2 size={18} className="text-blue-500" />
                                                    {isNovoOrgao ? "Cadastrar Novo Órgão e Assinaturas" : `Secretaria: ${orgaoForm.nome_curto || "Órgão"}`}
                                                </h3>
                                            </div>
                                            <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95">
                                                <Save size={15} /> Salvar Alterações
                                            </button>
                                        </div>

                                        {/* Bloco 1: Dados Institucionais do Órgão */}
                                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                                            <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <Building2 size={15} /> 1. Identificação da Secretaria / Órgão
                                            </h4>
                                            
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sigla / Nome Curto</label>
                                                    <input 
                                                        type="text" 
                                                        required 
                                                        placeholder="Ex: SECOBR" 
                                                        value={orgaoForm.nome_curto}
                                                        onChange={e => setOrgaoForm({...orgaoForm, nome_curto: e.target.value})}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold uppercase text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nome Completo Oficial da Secretaria</label>
                                                    <input 
                                                        type="text" 
                                                        required 
                                                        placeholder="Ex: Secretaria Municipal de Obras e Infraestrutura" 
                                                        value={orgaoForm.nome_completo}
                                                        onChange={e => setOrgaoForm({...orgaoForm, nome_completo: e.target.value})}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Cor Hexadecimal de Destaque Visual</label>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="color" 
                                                        value={orgaoForm.cor_hex}
                                                        onChange={e => setOrgaoForm({...orgaoForm, cor_hex: e.target.value})}
                                                        className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={orgaoForm.cor_hex}
                                                        onChange={e => setOrgaoForm({...orgaoForm, cor_hex: e.target.value})}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Responsabilidade Institucional (Competência Geral no PLACON)</label>
                                                <textarea 
                                                    rows={3}
                                                    placeholder="Descrição das competências institucionais do órgão nas ações de proteção e defesa civil..."
                                                    value={orgaoForm.descricao}
                                                    onChange={e => setOrgaoForm({...orgaoForm, descricao: e.target.value})}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Bloco 2: MÚLTIPLAS ASSINATURAS OFICIAIS */}
                                        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                                        <Award size={15} /> 2. Titulares e Assinaturas Oficiais (e-Docs) ({assinaturasList.length})
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cadastre quantas assinaturas forem necessárias para esta secretaria</p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={handleAdicionarAssinaturaRow} 
                                                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                                                >
                                                    <Plus size={13} /> Adicionar Assinatura
                                                </button>
                                            </div>

                                            {assinaturasList.map((ass, index) => (
                                                <div key={index} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3.5 shadow-sm relative">
                                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 text-[10px] font-black flex items-center justify-center">
                                                                #{index + 1}
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                                                                {index === 0 ? 'Titular Principal / Assinante 1' : `Assinante Secundário #${index + 1}`}
                                                            </span>
                                                        </div>
                                                        {assinaturasList.length > 1 && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleRemoverAssinaturaRow(index)}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                                                title="Remover esta assinatura"
                                                            >
                                                                <Trash2 size={13} /> Remover
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Nome Completo do Titular</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: Ronan Zocoloto Souza Dutra" 
                                                                value={ass.nome}
                                                                onChange={e => handleUpdateAssinaturaRow(index, 'nome', e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Cargo / Função Oficial</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: Prefeito Municipal" 
                                                                value={ass.cargo}
                                                                onChange={e => handleUpdateAssinaturaRow(index, 'cargo', e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Telefone / Ramal</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="(27) 3263-4350" 
                                                                value={ass.telefone}
                                                                onChange={e => handleUpdateAssinaturaRow(index, 'telefone', e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">E-mail Institucional</label>
                                                            <input 
                                                                type="email" 
                                                                placeholder="gabinete@pmsmj.es.gov.br" 
                                                                value={ass.email}
                                                                onChange={e => handleUpdateAssinaturaRow(index, 'email', e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Identificação e-Docs</label>
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: EDOCS-2026-PREF-9988" 
                                                                value={ass.identificacao_edocs}
                                                                onChange={e => handleUpdateAssinaturaRow(index, 'identificacao_edocs', e.target.value)}
                                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95">
                                                <Save size={16} /> Salvar Órgão e Assinaturas
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Conteúdo da Aba 2: Matriz Geral de Atribuições Operacionais */}
                        {activeGerenciadorTab === 'atribuicoes' && (
                            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
                                {/* Formulário Rápido de Inclusão de Atribuição */}
                                <form onSubmit={handleSaveGerenciadorAtribuicao} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                            <Plus size={14} /> {editingAtribuicaoId ? "Editar Atribuição" : "Adicionar Nova Atribuição ao Plano"}
                                        </h4>
                                        {editingAtribuicaoId && (
                                            <button type="button" onClick={() => { setEditingAtribuicaoId(null); setAtribuicaoForm({ ...atribuicaoForm, texto: '', base_legal: '' }) }} className="text-[10px] font-bold text-slate-400 underline">
                                                Cancelar Edição
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Órgão Responsável</label>
                                            <select 
                                                value={atribuicaoForm.orgao_id || (orgaos[0] && orgaos[0].id)}
                                                onChange={e => setAtribuicaoForm({...atribuicaoForm, orgao_id: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white"
                                            >
                                                {orgaos.map(o => (
                                                    <option key={o.id} value={o.id}>{o.nome_curto} - {o.nome_completo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Fase do Desastre</label>
                                            <select 
                                                value={atribuicaoForm.fase}
                                                onChange={e => setAtribuicaoForm({...atribuicaoForm, fase: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white"
                                            >
                                                <option value="Prevenção">Prevenção</option>
                                                <option value="Preparação">Preparação</option>
                                                <option value="Resposta">Resposta</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Base Legal / Normativa (Opcional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Ex: Lei Municipal 2.732/2023"
                                                value={atribuicaoForm.base_legal}
                                                onChange={e => setAtribuicaoForm({...atribuicaoForm, base_legal: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Descrição Detalhada da Ação / Responsabilidade</label>
                                        <div className="flex gap-3">
                                            <textarea 
                                                required
                                                rows={2}
                                                placeholder="Descreva o dever ou ação operacional a ser executada pelo órgão..."
                                                value={atribuicaoForm.texto}
                                                onChange={e => setAtribuicaoForm({...atribuicaoForm, texto: e.target.value})}
                                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-blue-500"
                                            />
                                            <button type="submit" className="px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-md shrink-0 self-end py-3">
                                                {editingAtribuicaoId ? "Salvar" : "Adicionar"}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                {/* Filtros e Tabela das Atribuições Mapeadas */}
                                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950 p-3 rounded-xl shrink-0">
                                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                                        Atribuições Cadastradas ({atribuicoesFiltradasGerenciador.length})
                                    </span>
                                    <div className="flex gap-3">
                                        <select 
                                            value={atribuicaoFiltroOrgao}
                                            onChange={e => setAtribuicaoFiltroOrgao(e.target.value)}
                                            className="bg-white dark:bg-slate-800 text-[10px] font-bold uppercase rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700"
                                        >
                                            <option value="todos">Todos os Órgãos</option>
                                            {orgaos.map(o => (
                                                <option key={o.id} value={o.id}>{o.nome_curto}</option>
                                            ))}
                                        </select>

                                        <select 
                                            value={atribuicaoFiltroFase}
                                            onChange={e => setAtribuicaoFiltroFase(e.target.value)}
                                            className="bg-white dark:bg-slate-800 text-[10px] font-bold uppercase rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700"
                                        >
                                            <option value="todas">Todas as Fases</option>
                                            <option value="prevencao">Prevenção</option>
                                            <option value="preparacao">Preparação</option>
                                            <option value="resposta">Resposta</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {atribuicoesFiltradasGerenciador.map(a => {
                                        const parentOrg = orgaos.find(o => o.id === a.orgao_id)
                                        return (
                                            <div key={a.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 group hover:border-blue-300 transition-all">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white" style={{ backgroundColor: parentOrg?.cor_hex || '#3b82f6' }}>
                                                            {parentOrg?.nome_curto || 'Órgão'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                                            (a.fase || '').toLowerCase() === 'prevencao' ? 'bg-emerald-100 text-emerald-700' :
                                                            (a.fase || '').toLowerCase() === 'preparacao' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {a.fase}
                                                        </span>
                                                        {a.base_legal && <span className="text-[9px] font-bold text-slate-400">({a.base_legal})</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">{a.texto}</p>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingAtribuicaoId(a.id)
                                                            setAtribuicaoForm({
                                                                orgao_id: a.orgao_id,
                                                                fase: a.fase ? a.fase.charAt(0).toUpperCase() + a.fase.slice(1) : 'Prevenção',
                                                                texto: a.texto,
                                                                base_legal: a.base_legal || ''
                                                            })
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteGerenciadorAtribuicao(a.id)} className="p-1 text-slate-400 hover:text-rose-600">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {atribuicoesFiltradasGerenciador.length === 0 && (
                                        <p className="text-xs italic text-slate-400 text-center py-10">Nenhuma atribuição encontrada com o filtro selecionado.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conteúdo da Aba 3: Versões do Plano */}
                        {activeGerenciadorTab === 'versoes' && (
                            <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-6">
                                <form onSubmit={handleSaveVersaoPlano} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shrink-0">
                                    <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                        <FileCheck size={14} /> Registrar Nova Versão Oficial do Plano (§6º Lei 12.608/2012)
                                    </h4>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Número da Versão</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="Ex: 2026.1" 
                                                value={versaoForm.numero_versao}
                                                onChange={e => setVersaoForm({...versaoForm, numero_versao: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Data de Alteração / Audiência</label>
                                            <input 
                                                type="date" 
                                                required 
                                                value={versaoForm.data_alteracao}
                                                onChange={e => setVersaoForm({...versaoForm, data_alteracao: e.target.value})}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase py-3 rounded-xl shadow-md">
                                                Registrar Versão
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Descrição / Notas de Atualização</label>
                                        <textarea 
                                            required
                                            rows={2}
                                            placeholder="Ex: Atualização anual aprovada em Audiência Pública municipal..."
                                            value={versaoForm.descricao}
                                            onChange={e => setVersaoForm({...versaoForm, descricao: e.target.value})}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                    <h4 className="text-xs font-black uppercase text-slate-500">Histórico de Versões Registradas</h4>
                                    {versoes.map(v => (
                                        <div key={v.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-black rounded-full">
                                                        Versão {v.numero_versao}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        Data: {v.data_alteracao}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-2">{v.descricao}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {versoes.length === 0 && (
                                        <p className="text-xs italic text-slate-400 py-6 text-center">Nenhuma versão cadastrada.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlaconMatriz
