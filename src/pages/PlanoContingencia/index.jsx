import React, { useState, useEffect, useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../App'
import { 
    Shield, AlertTriangle, Users, Map as MapIcon, FileText, 
    X, CheckCircle, ChevronRight, Plus, Search, LogOut, 
    Menu, Bell, Settings, Info, Briefcase, Activity, Clock,
    UserPlus, ShieldAlert, Zap, ClipboardList, HelpingHand, Eye,
    Trash2, UserMinus, MoreVertical, ExternalLink, RefreshCcw,
    Layers, LayoutDashboard, Target
} from 'lucide-react'
import { contingencyDb } from '../../services/contingencyDb'
import { supabase } from '../../services/supabase'
import { useToast } from '../../components/ToastNotification'

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const LEVELS = [
    { id: 'Alerta', color: 'bg-amber-500', text: 'text-amber-500', icon: '⚠️' },
    { id: 'Emergência', color: 'bg-orange-600', text: 'text-orange-600', icon: '🚨' },
    { id: 'Calamidade', color: 'bg-red-600', text: 'text-red-600', icon: '🔥' }
]

const SESSIONS = [
    { id: 'Comando', color: 'bg-slate-900', icon: <Shield size={14} /> },
    { id: 'Segurança', color: 'bg-rose-600', icon: <Shield size={14} /> },
    { id: 'Informação', color: 'bg-sky-400', icon: <Bell size={14} /> },
    { id: 'Ligação', color: 'bg-indigo-500', icon: <Users size={14} /> },
    { id: 'Operações', color: 'bg-orange-500', icon: <Activity size={14} /> },
    { id: 'Planejamento', color: 'bg-blue-500', icon: <FileText size={14} /> },
    { id: 'Logística', color: 'bg-emerald-500', icon: <Briefcase size={14} /> },
    { id: 'Finanças', color: 'bg-teal-500', icon: <Info size={14} /> }
]

const PlanoContingencia = () => {
    const navigate = useNavigate()
    const { addToast } = useToast()
    const userProfile = useContext(UserContext)
    const [activePlan, setActivePlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showActivationModal, setShowActivationModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [showAtribuicaoPlanoModal, setShowAtribuicaoPlanoModal] = useState(false)
    
    // Matriz de Responsabilidades
    const [atribuicoesPlano, setAtribuicoesPlano] = useState([])
    const [novaAtribuicao, setNovaAtribuicao] = useState({
        ambito: 'Resposta', secretaria: '', descricao: ''
    })

    const [assignmentData, setAssignmentData] = useState({
        sessao: '', funcao: '', atribuicao: '', usuario_id: null
    })
    
    const [formData, setFormData] = useState({
        nivel: 'Alerta', motivo: '', area_afetada: ''
    })
    const [scoMembers, setScoMembers] = useState([])
    const [availableUsers, setAvailableUsers] = useState([])
    const [activeTab, setActiveTab] = useState('Organograma') // Main Tab
    const [sidebarTab, setSidebarTab] = useState('agentes') // Right sidebar tab
    const [searchTerm, setSearchTerm] = useState('')

    // Advanced SCO States
    const [setores, setSetores] = useState([])
    const [recursos, setRecursos] = useState([])
    const [tarefas, setTarefas] = useState([])
    const [mensagens, setMensagens] = useState([])
    const [logs, setLogs] = useState([])
    const [selectedSetor, setSelectedSetor] = useState(null)
    const [showSetorModal, setShowSetorModal] = useState(false)
    const [chatInput, setChatInput] = useState('')

    // Management Modals (Added)
    const [showAddSetorModal, setShowAddSetorModal] = useState(false)
    const [addSetorData, setAddSetorData] = useState({ parentId: null, type: 'child', title: '' })
    const [showAddRecursoModal, setShowAddRecursoModal] = useState(false)
    const [addRecursoData, setAddRecursoData] = useState({ name: '', type: 'Veículo' })
    const [showAddTaskModal, setShowAddTaskModal] = useState(false)
    const [addTaskData, setAddTaskData] = useState({ sectorId: null, text: '' })
    const [showAllocateResourceModal, setShowAllocateResourceModal] = useState(false)
    const [allocateResourceData, setAllocateResourceData] = useState({ sectorId: null, taskId: null })
    const [orgScale, setOrgScale] = useState(1)

    const filteredUsers = useMemo(() => {
        return availableUsers.filter(u => 
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [availableUsers, searchTerm])

    const filteredRecursos = useMemo(() => {
        return recursos.filter(r => 
            r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.type?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [recursos, searchTerm])

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (selectedSetor) {
            loadSetorDetails(selectedSetor.id)
        }
    }, [selectedSetor])

    const handleOnDragEnd = async (result) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId) return

        // Destination is a Setor ID (which we use as Title in droppableId)
        const targetSetorTitle = destination.droppableId
        
        // Check if Draggable is Agent or Resource
        if (draggableId.startsWith('agent_')) {
            const uid = draggableId.replace('agent_', '')
            await contingencyDb.updateScoMember(activePlan.id, targetSetorTitle, 'Equipe', uid, '')
            addToast('Agente alocado.', 'success')
        } else if (draggableId.startsWith('res_')) {
            const rid = draggableId.replace('res_', '')
            const set = setores.find(s => s.title === targetSetorTitle)
            if (set) {
                await handleAllocateRecurso(rid, set.id)
            }
        }
        loadData()
    }

    const handleConfirmAddSetor = async () => {
        if (!addSetorData.title) return
        await contingencyDb.addSetor(activePlan.id, addSetorData.parentId, addSetorData.title)
        setShowAddSetorModal(false)
        setAddSetorData({ parentId: null, type: 'child', title: '' })
        loadData()
        addToast('Setor criado.', 'success')
    }

    const handleConfirmAddRecurso = async () => {
        if (!addRecursoData.name) return
        await contingencyDb.addRecurso(activePlan.id, addRecursoData.name, addRecursoData.type)
        setShowAddRecursoModal(false)
        setAddRecursoData({ name: '', type: 'Veículo' })
        loadData()
        addToast('Recurso cadastrado.', 'success')
    }

    const handleConfirmAddTask = async () => {
        if (!addTaskData.text) return
        await contingencyDb.addTarefa(addTaskData.sectorId, addTaskData.text)
        loadSetorDetails(addTaskData.sectorId)
        setShowAddTaskModal(false)
        setAddTaskData({ sectorId: null, text: '' })
        addToast('Tarefa adicionada!', 'success')
    }

    const handleConfirmAllocateRecurso = async (rid) => {
        await handleAllocateRecurso(rid, allocateResourceData.sectorId, allocateResourceData.taskId)
        setShowAllocateResourceModal(false)
        setAllocateResourceData({ sectorId: null, taskId: null })
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const plan = await contingencyDb.getActivePlan()
            setActivePlan(plan)
            const { data: users } = await supabase.from('profiles').select('*')
            if (users) setAvailableUsers(users)
            
            if (plan) {
                const members = await contingencyDb.loadScoStructure(plan.id)
                setScoMembers(members || [])
                const planAtribs = await contingencyDb.loadPlanoAtribuicoes(plan.id)
                if (planAtribs) setAtribuicoesPlano(planAtribs)

                // Advanced SCO data
                let sets = await contingencyDb.loadSetores(plan.id)
                let roots = sets.filter(s => s.parent_id === null)
                
                // Proactive Fix: If multiple roots exist, auto-clean redundant empty roots
                if (roots.length > 1) {
                    const primaryRootId = roots[0].id
                    for (let i = 1; i < roots.length; i++) {
                        const root = roots[i]
                        const children = sets.filter(s => s.parent_id === root.id)
                        // If it's a redundant root name and has no children, remove it
                        if (children.length === 0 && (root.title === 'Comando' || root.title === 'Comando Geral')) {
                            await contingencyDb.removeSetor(root.id)
                        }
                    }
                    // Reload after cleaning
                    sets = await contingencyDb.loadSetores(plan.id)
                    roots = sets.filter(s => s.parent_id === null)
                }

                if (roots.length === 0) {
                    // Init structure if empty or missing root
                    await contingencyDb.addSetor(plan.id, null, 'Comando', 'bg-slate-900')
                    sets = await contingencyDb.loadSetores(plan.id)
                }
                setSetores(sets)

                const recs = await contingencyDb.loadRecursos(plan.id)
                if (recs.length === 0) {
                   // Mock resources if none
                   await contingencyDb.addRecurso(plan.id, 'Ambulância UTI 01', 'Veículo')
                   await contingencyDb.addRecurso(plan.id, 'Caminhão-Pipa 04', 'Veículo')
                   setRecursos(await contingencyDb.loadRecursos(plan.id))
                } else setRecursos(recs)

                setLogs(await contingencyDb.loadLogs(plan.id))
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadSetorDetails = async (sid) => {
        setTarefas(await contingencyDb.loadTarefas(sid))
        setMensagens(await contingencyDb.loadMensagens(sid))
        // Re-load resources to check for task links
        setRecursos(await contingencyDb.loadRecursos(activePlan.id))
    }

    const handleActivate = async () => {
        if (!formData.motivo) {
            addToast('Informe o motivo.', 'error')
            return
        }
        try {
            const plan = await contingencyDb.activatePlan({ ...formData, comandante: userProfile?.id })
            setActivePlan(plan)
            setShowActivationModal(false)
            addToast('Plano ativado!', 'success')
            loadData() 
        } catch (error) {
            addToast('Erro na ativação.', 'error')
        }
    }

    const openAssignment = (sessao, funcao) => {
        setAssignmentData({ sessao, funcao, atribuicao: '', usuario_id: null })
        setShowAssignModal(true)
    }

    const handleAssignMember = async () => {
        if (!assignmentData.usuario_id) {
            addToast('Selecione um agente.', 'error')
            return
        }
        try {
            await contingencyDb.updateScoMember(
                activePlan.id, assignmentData.sessao, assignmentData.funcao, assignmentData.usuario_id, assignmentData.atribuicao
            )
            addToast('Designação concluída.', 'success')
            setShowAssignModal(false)
            setTimeout(() => loadData(), 500)
        } catch (e) {
            addToast('Erro na designação.', 'error')
        }
    }

    const handleRemoveMember = async (memberId) => {
        if (window.confirm('Remover este agente?')) {
            try {
                await contingencyDb.removeScoMember(memberId)
                setScoMembers(prev => prev.filter(m => m.id !== memberId))
                addToast('Membro removido.', 'info')
            } catch (e) {
                addToast('Erro ao remover.', 'error')
            }
        }
    }

    const handleAddAtribuicaoPlano = async () => {
        if (!novaAtribuicao.secretaria || !novaAtribuicao.descricao) return
        try {
            const data = await contingencyDb.addPlanoAtribuicao({ plano_id: activePlan.id, ...novaAtribuicao })
            if (data) {
                setAtribuicoesPlano([...atribuicoesPlano, data])
                setNovaAtribuicao({ ...novaAtribuicao, secretaria: '', descricao: '' })
                addToast('Salvo!', 'success')
            }
        } catch (e) {
            addToast('Erro ao salvar.', 'error')
        }
    }

    const handleRemoveAtribuicao = async (id) => {
        if (window.confirm('Remover atribuição?')) {
            try {
                await contingencyDb.removePlanoAtribuicao(id)
                setAtribuicoesPlano(prev => prev.filter(a => a.id !== id))
            } catch (e) {
                addToast('Erro ao remover.', 'error')
            }
        }
    }

    const handleClosePlan = async () => {
        if (window.confirm('Encerrar operação?')) {
            try {
                await contingencyDb.closePlan(activePlan.id, 'Encerrado.')
                setActivePlan(null)
                addToast('Operação encerrada.', 'success')
            } catch (error) {
                addToast('Erro.', 'error')
            }
        }
    }

    const handleGenerateReport = () => {
        addToast('Exportando Relatório SCO...', 'info')
        setTimeout(() => {
            const content = `PLANO DE CONTINGÊNCIA - ${activePlan.nivel}\n` + 
                `Motivo: ${activePlan.motivo}\n\nMATRIZ DE RESPONSABILIDADES:\n` +
                atribuicoesPlano.map(a => `[${a.ambito}] ${a.secretaria}: ${a.descricao}`).join('\n') +
                `\n\nESTRUTURA SCO:\n` + 
                scoMembers.map(m => `- ${m.sessao} (${m.funcao}): ${availableUsers.find(u => u.id === m.usuario_id)?.full_name || 'Agente'}`).join('\n')
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = `sco_${activePlan.id}.txt`; a.click();
            addToast('Relatório exportado!', 'success')
        }, 1500)
    }

    const handleAddSetor = async (parentId, type = 'child') => {
        const title = window.prompt(`Novo setor ${type === 'child' ? 'subordinado' : 'lateral'}:`)
        if (!title?.trim()) return
        await contingencyDb.addSetor(activePlan.id, parentId, title)
        loadData()
        addToast('Setor criado.', 'success')
    }

    const handleRemoveSetor = async (sid) => {
        if (window.confirm('Excluir setor e subdivisões?')) {
            await contingencyDb.removeSetor(sid)
            loadData()
            addToast('Setor removido.', 'info')
        }
    }

    const handleAllocateRecurso = async (recursoId, setorId, taskId = null) => {
        await contingencyDb.allocateRecurso(recursoId, setorId, taskId)
        loadData()
        addToast('Recurso alocado.', 'success')
        if (setorId) {
            const res = recursos.find(r => r.id === recursoId)
            const set = setores.find(s => s.id === setorId)
            await contingencyDb.addLog(activePlan.id, `${res?.name} em ${set?.title}${taskId ? ' (Tarefa)' : ''}`)
        }
    }

    const handleAddTarefa = async (sid) => {
        setAddTaskData({ sectorId: sid, text: '' })
        setShowAddTaskModal(true)
    }

    const handleToggleTarefa = async (taskId, sid) => {
        await contingencyDb.toggleTarefa(taskId)
        loadSetorDetails(sid)
    }

    const handleSendMessage = async (sid) => {
        if (!chatInput.trim()) return
        await contingencyDb.addMensagem(sid, userProfile?.id, chatInput)
        setChatInput('')
        loadSetorDetails(sid)
    }

    const getMemberByRole = (sessao, funcao) => {
        const m = scoMembers.find(m => m.sessao === sessao && m.funcao === (funcao || 'Chefia'))
        if (!m) return null
        const profile = m.profiles || availableUsers.find(u => u.id === m.usuario_id)
        return profile ? { ...profile, id_vinculo: m.id, atribuicao: m.atribuicao } : null
    }

    if (loading) return (
        <div className="flex items-center justify-center p-20 min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    )

    const handleRenameSetor = async (sid, oldTitle) => {
        const title = window.prompt('Novo nome para o setor:', oldTitle)
        if (title && title !== oldTitle) {
            const db = await initDB()
            const s = await db.get('sco_setores', sid)
            if (s) {
                s.title = title
                await db.put('sco_setores', s)
                loadData()
                addToast('Setor renomeado.', 'success')
            }
        }
    }

    const renderSetor = (setor, isRoot = false) => {
        const chefia = scoMembers.find(m => m.sessao === setor.title && m.funcao === 'Chefia')
        const p = chefia ? availableUsers.find(u => u.id === chefia.usuario_id) : null
        const children = setores.filter(s => s.parent_id === setor.id)
        const nodeRecursos = recursos.filter(r => r.setor_id === setor.id)
        const equipe = scoMembers.filter(m => m.sessao === setor.title && m.funcao === 'Equipe')

        // Fatigue check (12h)
        const hoursActive = chefia?.assigned_at ? (new Date() - new Date(chefia.assigned_at)) / (1000 * 60 * 60) : 0
        const isFatigued = hoursActive > 12
        
        return (
            <div key={setor.id} className="flex flex-col items-center relative">
                <Droppable droppableId={setor.title}>
                    {(provided, snapshot) => (
                        <div 
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                            className="relative group flex flex-col items-center"
                        >
                            {/* Top Vertical Line (Linking to Parent) */}
                            {!isRoot && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-slate-300 dark:bg-slate-700"></div>
                            )}

                            <div 
                                onClick={() => { setSelectedSetor(setor); setShowSetorModal(true); }}
                                className={`w-48 bg-white dark:bg-slate-900 border-2 rounded-[24px] p-4 shadow-lg transition-all cursor-pointer flex flex-col items-center gap-3 text-center ${snapshot.isDraggingOver ? 'ring-4 ring-blue-500/50 border-blue-500' : chefia ? 'border-slate-800 dark:border-blue-600/50' : 'border-slate-100 hover:border-blue-400 border-dashed'}`}
                            >
                                <div className={`p-2.5 ${setor.color_class || 'bg-slate-500'} rounded-xl text-white shadow-lg shadow-current/10 shrink-0 relative`}>
                                    {isRoot ? <Shield size={16} /> : <Users size={16} />}
                                    {isFatigued && (
                                        <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full animate-pulse border-2 border-white">
                                            <Clock size={8} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden w-full">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-white mb-1 truncate">{setor.title}</p>
                                    <p className={`text-[9px] font-black uppercase truncate max-w-full ${chefia ? 'text-blue-500' : 'text-slate-300 italic'}`}>
                                        {p ? p.full_name : 'DEFINIR'}
                                    </p>
                                </div>

                                {/* Metrics / Counts on Node */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                         <Users size={8} className="text-slate-300"/>
                                         <span className="text-[8px] font-black text-slate-400">{equipe.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         <Briefcase size={8} className="text-slate-300"/>
                                         <span className="text-[8px] font-black text-slate-400">{nodeRecursos.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Node Actions */}
                            <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <button onClick={(e) => { e.stopPropagation(); setAddSetorData({ parentId: setor.id, type: 'child', title: '' }); setShowAddSetorModal(true); }} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:text-blue-600 border border-slate-100 dark:border-slate-700" title="Subordinado"><Plus size={10}/></button>
                                {!isRoot && <button onClick={(e) => { e.stopPropagation(); setAddSetorData({ parentId: setor.parent_id, type: 'sibling', title: '' }); setShowAddSetorModal(true); }} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:text-blue-600 border border-slate-100 dark:border-slate-700" title="Lateral"><ChevronRight size={10}/></button>}
                                <button onClick={(e) => { e.stopPropagation(); handleRenameSetor(setor.id, setor.title) }} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:text-emerald-600 border border-slate-100 dark:border-slate-700" title="Renomear"><Menu size={10}/></button>
                                {( !isRoot || setores.filter(s => !s.parent_id).length > 1 ) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveSetor(setor.id) }} className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:text-rose-600 border border-slate-100 dark:border-slate-700" title="Remover"><Trash2 size={10}/></button>
                                )}
                            </div>
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {children.length > 0 && (
                    <div className="flex gap-12 mt-12 relative pt-12">
                         {/* Horizontal Connector Line */}
                         <div className="absolute top-0 h-px bg-slate-400 dark:bg-slate-600" style={{ left: `${100 / (2 * children.length)}%`, right: `${100 / (2 * children.length)}%` }}></div>
                         {/* Main Vertical Stem down to horizontal line */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-slate-300 dark:bg-slate-700 -translate-y-12"></div>
                         {children.map(child => renderSetor(child))}
                    </div>
                )}
            </div>
        )
    }

    if (!activePlan) {
        return (
            <div className="p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-slate-950 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-xl rotate-3">
                        <Shield size={40} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Plano de Contingência</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Gestão tática e governança operacional de incidentes.</p>
                    </div>
                    <button onClick={() => setShowActivationModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-3 mx-auto text-xs">
                        <Plus size={16} /> Ativar Novo Plano
                    </button>
                </div>
                {showActivationModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/5 p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Ativação de SCO</h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-3 gap-3">
                                    {LEVELS.map(l => (
                                        <button key={l.id} onClick={() => setFormData({...formData, nivel: l.id})} className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${formData.nivel === l.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}>
                                            <span className="text-sm font-black uppercase">{l.id}</span>
                                        </button>
                                    ))}
                                </div>
                                <textarea value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold border-none ring-1 ring-slate-100 dark:ring-slate-700 outline-none focus:ring-2 ring-blue-500" rows={2} placeholder="Motivo da ativação..." />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowActivationModal(false)} className="flex-1 py-3 text-xs font-black uppercase text-slate-400">Cancelar</button>
                                <button onClick={handleActivate} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }


    return (
        <>
            <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen flex flex-col overflow-hidden select-none">
            <DragDropContext onDragEnd={handleOnDragEnd}>
                {/* Header */}
                <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-50 shrink-0 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
                                <Shield size={18} />
                            </div>
                            <h1 className="text-sm font-black tracking-tight uppercase">Sigerd <span className="text-blue-600">SCO</span></h1>
                        </div>
                        <div className="h-6 w-px bg-slate-100 dark:bg-slate-800"></div>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-100 dark:border-rose-900/30 flex items-center gap-1.5">
                                <Activity size={10} className="animate-pulse" /> Ativo
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${LEVELS.find(l => l.id === activePlan.nivel)?.color.replace('bg-', 'bg-opacity-10 text-').replace('-600', '-500')} border-current`}>
                                {activePlan.nivel}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Zoom Controls */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                            <button onClick={() => setOrgScale(s => Math.max(0.4, s - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400"><Search size={12} className="rotate-180"/></button>
                            <span className="text-[9px] font-black w-8 text-center text-slate-500">{Math.round(orgScale * 100)}%</span>
                            <button onClick={() => setOrgScale(s => Math.min(1.5, s + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400"><Search size={12}/></button>
                        </div>

                        <button onClick={() => setShowAtribuicaoPlanoModal(true)} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <ClipboardList size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Matriz</span>
                        </button>
                        
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-1 pr-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <img src={availableUsers.find(u => u.id === activePlan?.comandante)?.photo_url || `https://ui-avatars.com/api/?name=C`} className="w-8 h-8 rounded-xl object-cover shadow-sm bg-slate-200" />
                            <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[100px]">{availableUsers.find(u => u.id === activePlan?.comandante)?.full_name}</span>
                            <button onClick={handleClosePlan} className="ml-2 p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><X size={12}/></button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">

                    {/* MAIN DASHBOARD CENTER */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-[#f0f2f5] dark:bg-slate-950 relative">
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-white/5 flex gap-1">
                             <button onClick={() => setActiveTab('Organograma')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Organograma' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Tático</button>
                             <button onClick={() => setActiveTab('Mapa')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Mapa' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Mapa</button>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar p-10 flex flex-col items-center">
                            {activeTab === 'Mapa' ? (
                                <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl min-h-[500px]">
                                    <MapContainer center={[-20.0246, -40.7464]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Circle center={[-20.0246, -40.7464]} radius={400} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }} />
                                    </MapContainer>
                                </div>
                            ) : (
                                <div 
                                    className="origin-top transition-transform duration-300 pointer-events-auto"
                                    style={{ transform: `scale(${orgScale})` }}
                                >
                                    {setores.filter(s => s.parent_id === null).map(root => renderSetor(root, true))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: LOGÍSTICA */}
                    <div className="w-[300px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
                        <div className="flex border-b border-slate-50 dark:border-slate-800">
                         {['agentes', 'recursos', 'diário'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setSidebarTab(tab)} 
                                className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${sidebarTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50/10' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab}
                            </button>
                         ))}
                        </div>
                        
                        {sidebarTab !== 'diário' && (
                            <div className="p-5 border-b border-slate-50 dark:border-slate-800">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                    <input 
                                        type="text" 
                                        placeholder={`Buscar ${sidebarTab}...`} 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700" 
                                    />
                                </div>
                            </div>
                        )}

                        <Droppable droppableId="logistics-source" isDropDisabled={true}>
                            {(provided) => (
                                <div 
                                    ref={provided.innerRef} 
                                    {...provided.droppableProps}
                                    className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4"
                                >
                                    {sidebarTab !== 'diário' && (
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disponíveis</h4>
                                            <button 
                                                onClick={() => sidebarTab === 'agentes' ? setShowAssignModal(true) : setShowAddRecursoModal(true)} 
                                                className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all"
                                            >
                                                <Plus size={12}/>
                                            </button>
                                        </div>
                                    )}

                                    {sidebarTab === 'agentes' ? (
                                        filteredUsers.filter(u => !scoMembers.some(m => m.usuario_id === u.id)).map((p, index) => (
                                            <Draggable key={p.id} draggableId={`agent_${p.id}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef} 
                                                        {...provided.draggableProps} 
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-800 group transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-105 z-50' : 'hover:shadow-md'}`}
                                                    >
                                                        <img src={p.photo_url || `https://ui-avatars.com/api/?name=${p.full_name}`} className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-100" />
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate leading-tight">{p.full_name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase truncate mt-0.5">Agente de Campo</p>
                                                        </div>
                                                        <Menu size={12} className="text-slate-200 group-hover:text-slate-400" />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    ) : sidebarTab === 'recursos' ? (
                                        filteredRecursos.filter(r => !r.setor_id).map((r, index) => (
                                            <Draggable key={r.id} draggableId={`res_${r.id}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div 
                                                        ref={provided.innerRef} 
                                                        {...provided.draggableProps} 
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 scale-105 z-50' : 'hover:shadow-md'}`}
                                                    >
                                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg shrink-0">
                                                            <Briefcase size={14} />
                                                        </div>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate leading-tight">{r.name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{r.type}</p>
                                                        </div>
                                                        <Menu size={12} className="text-slate-200 group-hover:text-slate-400" />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))
                                    ) : (
                                        <div className="flex-1 flex flex-col space-y-4">
                                            {logs.length === 0 && <p className="text-[10px] text-slate-300 uppercase font-black text-center py-10 italic">Nenhum evento registrado.</p>}
                                            {logs.map(log => (
                                                <div key={log.id} className="flex gap-3 items-start group p-3 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                                                    <span className="text-[9px] font-black font-mono text-slate-400 shrink-0 mt-0.5">{log.time}</span>
                                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase">{log.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex items-center justify-between">
                                 <span className="text-[9px] font-black text-slate-400 uppercase">Mobilizados</span>
                                 <span className="text-lg font-black text-blue-600">{scoMembers.length}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="h-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end px-10 z-[100] shrink-0">
                    <button onClick={handleGenerateReport} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all active:scale-95 shadow-lg">
                        <FileText size={16} className="text-blue-500" /> Exportar Relatório SCO
                    </button>
                </footer>
            </DragDropContext>
        </div>

            {/* MODAL: ADVANCED SETOR DETAILS (Tactical Control) */}
            {showSetorModal && selectedSetor && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/5">
                        <div className={`p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center ${selectedSetor.color_class || 'bg-slate-500'} text-white`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 rounded-xl">
                                    <Activity size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight">{selectedSetor.title}</h3>
                                    <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Controle de Operações / Tático</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSetorModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Col: Tasks & Resources */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-slate-50 dark:border-slate-800 space-y-10">
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <CheckCircle size={14} className="text-blue-500" /> Quadro de Tarefas
                                        </h4>
                                        <button onClick={() => handleAddTarefa(selectedSetor.id)} className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-all shadow-md active:scale-90"><Plus size={14} /></button>
                                    </div>
                                    <div className="space-y-4">
                                        {tarefas.length === 0 && <p className="text-[10px] text-slate-300 uppercase font-black py-4 text-center border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-2xl italic">Nenhuma tarefa.</p>}
                                        {tarefas.map(t => (
                                            <div key={t.id} className={`flex flex-col gap-4 p-5 rounded-3xl transition-all border-2 ${t.done ? 'bg-slate-50/50 dark:bg-slate-800/10 border-transparent opacity-60' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-500'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div onClick={() => handleToggleTarefa(t.id, selectedSetor.id)} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer ${t.done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-transparent'}`}>
                                                        <CheckCircle size={14} />
                                                    </div>
                                                    <span className={`flex-1 text-sm font-black uppercase tracking-tight ${t.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{t.text}</span>
                                                    <button onClick={() => { setAllocateResourceData({ sectorId: selectedSetor.id, taskId: t.id }); setShowAllocateResourceModal(true); }} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                                                        <Plus size={10} /> Recurso
                                                    </button>
                                                </div>
                                                
                                                {/* Resources linked to this task */}
                                                <div className="flex flex-wrap gap-2 pl-11">
                                                    {recursos.filter(r => r.tarefa_id === t.id).map(r => (
                                                        <div key={r.id} className="px-3 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-lg flex items-center gap-2 group/res">
                                                            <div className="p-1 bg-white dark:bg-slate-800 rounded-md">
                                                                <Briefcase size={8} className="text-blue-500" />
                                                            </div>
                                                            <span className="text-[8px] font-black uppercase text-blue-600 dark:text-blue-400">{r.name}</span>
                                                            <button onClick={() => handleAllocateRecurso(r.id, selectedSetor.id, null)} className="opacity-0 group-hover/res:opacity-100 transition-all text-slate-400 hover:text-rose-500"><X size={8}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                        <Briefcase size={14} className="text-emerald-500" /> Recursos Alocados
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {recursos.filter(r => r.setor_id === selectedSetor.id && !r.tarefa_id).map(r => (
                                            <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase size={12} className="text-slate-400" />
                                                    <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{r.name}</span>
                                                </div>
                                                <button onClick={() => handleAllocateRecurso(r.id, null)} className="text-rose-500 hover:text-rose-600 transition-all"><Trash2 size={12}/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => { setAllocateResourceData({ sectorId: selectedSetor.id, taskId: null }); setShowAllocateResourceModal(true); }} className="p-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase text-slate-400 items-center justify-center flex hover:border-blue-400 hover:text-blue-500 transition-all">
                                            + Alocar Recurso
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Right Col: Personnel & Chat */}
                            <div className="w-[360px] bg-slate-50/50 dark:bg-slate-800/20 flex flex-col overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                        <Users size={14} className="text-purple-500" /> Agentes Mobiliados
                                    </h4>
                                    <div className="space-y-3 mb-8">
                                        {scoMembers.filter(m => m.sessao === selectedSetor.title).map(m => {
                                            const agent = availableUsers.find(u => u.id === m.usuario_id)
                                            return (
                                                <div key={m.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <img src={agent?.photo_url} className="w-10 h-10 rounded-xl object-cover" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate leading-tight">{agent?.full_name}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase truncate mt-0.5">{m.funcao} // {m.atribuicao || 'Tático'}</p>
                                                    </div>
                                                    <button onClick={() => handleRemoveMember(m.id)} className="text-slate-300 hover:text-rose-500 transition-all p-1"><Trash2 size={12}/></button>
                                                </div>
                                            )
                                        })}
                                        <button 
                                            onClick={() => { setShowSetorModal(false); openAssignment(selectedSetor.title, 'Chefia') }} 
                                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <UserPlus size={14} /> Designar Chefia
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col overflow-hidden">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                            <Info size={14} className="text-orange-500" /> Comunicação Direta
                                        </h4>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 mb-4">
                                            {mensagens.length === 0 && <p className="text-[9px] text-slate-300 uppercase font-black text-center py-10">Canal Seguro Iniciado.</p>}
                                            {mensagens.map(msg => (
                                                <div key={msg.id} className={`flex flex-col ${msg.sender_id === userProfile?.id ? 'items-end' : 'items-start'}`}>
                                                    <div className={`p-4 rounded-[22px] max-w-[90%] text-xs font-bold leading-relaxed shadow-sm uppercase ${msg.sender_id === userProfile?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'}`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-300 mt-1 uppercase px-2">{msg.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={chatInput}
                                                onChange={e => setChatInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSendMessage(selectedSetor.id)}
                                                placeholder="COMANDO..." 
                                                className="w-full bg-white dark:bg-slate-800 rounded-2xl py-4 px-6 text-[10px] font-black uppercase outline-none shadow-xl border border-slate-100 dark:border-slate-800 ring-4 ring-slate-50 dark:ring-slate-900 pr-16" 
                                            />
                                            <button onClick={() => handleSendMessage(selectedSetor.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-black text-[10px] uppercase hover:text-blue-500 transition-all">Enviar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: COMPACT ASSIGNMENT */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[600px] border border-white/5">
                         <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600 rounded-lg text-white">
                                    <UserPlus size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Designar Agente</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{assignmentData.sessao} // {assignmentData.funcao}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-rose-500 p-2"><X size={20} /></button>
                         </div>
                         
                         <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                             <div className="space-y-2">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Atribuição / Secretaria</label>
                                 <input type="text" placeholder="Ex: Sec. de Saúde, SAMU..." value={assignmentData.atribuicao} onChange={e => setAssignmentData({...assignmentData, atribuicao: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white ring-1 ring-slate-100 dark:ring-slate-700 outline-none focus:ring-2 ring-blue-500" />
                             </div>

                             <div className="flex flex-col flex-1 min-h-0 space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Selecionar Membro</label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                    <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none ring-1 ring-slate-100 dark:ring-slate-700" />
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl min-h-[180px]">
                                    {filteredUsers.map(user => (
                                        <div key={user.id} onClick={() => setAssignmentData({...assignmentData, usuario_id: user.id})} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all border-2 ${assignmentData.usuario_id === user.id ? 'bg-blue-600 border-white text-white shadow-md' : 'bg-white dark:bg-slate-800 border-transparent'}`}>
                                            <img src={user.photo_url || `https://ui-avatars.com/api/?name=${user.full_name}`} className="w-9 h-9 rounded-lg object-cover" />
                                            <div className="flex-1 overflow-hidden font-black uppercase text-[10px] truncate">{user.full_name}</div>
                                            {assignmentData.usuario_id === user.id && <CheckCircle size={16} />}
                                        </div>
                                    ))}
                                </div>
                             </div>
                         </div>

                         <div className="p-6 bg-slate-50 dark:bg-slate-800/30 flex gap-3">
                             <button onClick={() => setShowAssignModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                             <button onClick={handleAssignMember} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Confirmar</button>
                         </div>
                    </div>
                </div>
            )}

            {/* MODAL: COMPACT MATRIZ */}
            {showAtribuicaoPlanoModal && activePlan && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/5">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
                                    <ClipboardList size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Matriz Setorial</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de Responsabilidades do Plano</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAtribuicaoPlanoModal(false)} className="text-slate-300 hover:text-rose-500 p-2 transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Compact Add Form */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-50 dark:border-slate-800">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="w-32">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Âmbito</label>
                                        <select value={novaAtribuicao.ambito} onChange={e => setNovaAtribuicao({...novaAtribuicao, ambito: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-[10px] font-black uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700">
                                            <option value="Prevenção">Prevenção</option>
                                            <option value="Preparação">Preparação</option>
                                            <option value="Resposta">Resposta</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Secretaria / Setor</label>
                                        <input type="text" placeholder="..." value={novaAtribuicao.secretaria} onChange={e => setNovaAtribuicao({...novaAtribuicao, secretaria: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-[10px] font-black outline-none ring-1 ring-slate-100 dark:ring-slate-700" />
                                    </div>
                                    <div className="flex-[2]">
                                        <label className="text-[8px] font-black text-slate-400 uppercase mb-2 block">Atribuição Detalhada</label>
                                        <input type="text" placeholder="..." value={novaAtribuicao.descricao} onChange={e => setNovaAtribuicao({...novaAtribuicao, descricao: e.target.value})} className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-[10px] font-black outline-none ring-1 ring-slate-100 dark:ring-slate-700" />
                                    </div>
                                    <button onClick={handleAddAtribuicaoPlano} className="h-[42px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all active:scale-90 flex items-center justify-center">
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Dense Matrix Grid */}
                            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar">
                                {['Prevenção', 'Preparação', 'Resposta'].map(ambito => (
                                    <div key={ambito} className="flex flex-col gap-4">
                                        <div className={`p-3 rounded-xl border-l-4 ${ambito === 'Prevenção' ? 'border-l-emerald-500 bg-emerald-50/5' : ambito === 'Preparação' ? 'border-l-amber-500 bg-amber-50/5' : 'border-l-rose-500 bg-rose-50/5'} flex items-center justify-between shrink-0 shadow-sm`}>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{ambito}</h4>
                                            <span className="text-[9px] font-black opacity-40">{atribuicoesPlano.filter(a => a.ambito === ambito).length}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {atribuicoesPlano.filter(a => a.ambito === ambito).map(a => (
                                                <div key={a.id} className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm hover:border-blue-500/20 transition-all flex flex-col gap-1.5 ring-1 ring-slate-100/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate max-w-[85%]">{a.secretaria}</span>
                                                        <button onClick={() => handleRemoveAtribuicao(a.id)} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">{a.descricao}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL: ADD SETOR */}
            {showAddSetorModal && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/5 p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Novo Comando / Setor</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estruturação Hierárquica</p>
                            </div>
                            <button onClick={() => setShowAddSetorModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Setor</label>
                                <input 
                                    type="text" 
                                    value={addSetorData.title}
                                    onChange={e => setAddSetorData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Logística, Saúde, Segurança..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500"
                                />
                            </div>
                            <button onClick={handleConfirmAddSetor} className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                Criar Setor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD RECURSO */}
            {showAddRecursoModal && (
                <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/5 p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Novo Recurso Operacional</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cadastro de Logística</p>
                            </div>
                            <button onClick={() => setShowAddRecursoModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Identificação / Nome</label>
                                <input 
                                    type="text" 
                                    value={addRecursoData.name}
                                    onChange={e => setAddRecursoData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Ambulância 04, Drone A, Viatura..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Recurso</label>
                                <select 
                                    value={addRecursoData.type}
                                    onChange={e => setAddRecursoData(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs font-bold uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500"
                                >
                                    <option>Veículo</option>
                                    <option>Equipamento</option>
                                    <option>Suprimento</option>
                                    <option>Comunicação</option>
                                </select>
                            </div>
                            <button onClick={handleConfirmAddRecurso} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                Cadastrar Recurso
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL: ADD TASK */}
            {showAddTaskModal && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Nova Tarefa</h3>
                            <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                        </div>
                        <div className="p-8">
                            <textarea 
                                value={addTaskData.text} 
                                onChange={e => setAddTaskData({...addTaskData, text: e.target.value})} 
                                placeholder="Descreva a missão..." 
                                className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs font-bold text-slate-800 dark:text-white outline-none ring-2 ring-slate-100 dark:ring-slate-700 focus:ring-blue-500 min-h-[120px] mb-6 shadow-inner"
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setShowAddTaskModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                                <button onClick={handleConfirmAddTask} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Atribuir Missão</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ALLOCATE RESOURCE */}
            {showAllocateResourceModal && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/5 h-[500px] flex flex-col">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
                            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Alocar Estrutura</h3>
                            <button onClick={() => setShowAllocateResourceModal(false)} className="text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3">
                            <div className="relative mb-6">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                <input 
                                    type="text" 
                                    placeholder="Pesquisar veículo / suporte..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-700" 
                                />
                            </div>

                            {filteredRecursos.filter(r => r.status === 'Disponível').length === 0 && (
                                <p className="text-[10px] text-slate-300 uppercase font-black py-10 text-center italic border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-3xl">Nenhum suporte encontrado.</p>
                            )}
                            {filteredRecursos.filter(r => r.status === 'Disponível').map(r => (
                                <div key={r.id} onClick={() => handleConfirmAllocateRecurso(r.id)} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                                            <Briefcase size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white tracking-tight">{r.name}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{r.type}</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md text-[7px] font-black uppercase">Pronto</div>
                                </div>
                            ))}

                            <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-[.2em] pt-6 mb-2">Estruturas Engajadas</h4>
                            {filteredRecursos.filter(r => r.status !== 'Disponível').map(r => (
                                <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent opacity-60 flex items-center justify-between grayscale">
                                    <div className="flex items-center gap-3">
                                        <Briefcase size={14} className="text-slate-300" />
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-tight">{r.name}</p>
                                    </div>
                                    <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md text-[7px] font-black uppercase">Empenhado</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}


export default PlanoContingencia
