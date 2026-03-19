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
    const [activeTab, setActiveTab] = useState('Organograma')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredUsers = useMemo(() => {
        return availableUsers.filter(u => 
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [availableUsers, searchTerm])

    useEffect(() => {
        loadData()
    }, [])

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
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
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
            const result = await contingencyDb.updateScoMember(
                activePlan.id, assignmentData.sessao, assignmentData.funcao, assignmentData.usuario_id, assignmentData.atribuicao
            )
            setScoMembers(prev => {
                if (assignmentData.funcao === 'Chefia') {
                    const filtered = prev.filter(m => !(m.sessao === assignmentData.sessao && m.funcao === 'Chefia'))
                    return [...filtered, result]
                }
                return [...prev, result]
            })
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
        <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen flex flex-col overflow-hidden select-none">
            {/* Header: More compact and elegant */}
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
                {/* Sidebar Monitoring: Compact and clean */}
                <div className="w-[260px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Recursos Humanos</h3>
                            <Activity size={10} className="text-blue-500"/>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-500 uppercase">Mobilizados</span>
                            <span className="text-lg font-black text-blue-600">{scoMembers.length}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
                         {scoMembers.map(m => {
                             const p = availableUsers.find(u => u.id === m.usuario_id)
                             if (!p) return null
                             return (
                                 <div key={m.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-800 group hover:shadow-md transition-all">
                                     <img src={p.photo_url || `https://ui-avatars.com/api/?name=${p.full_name}`} className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-700" />
                                     <div className="flex-1 overflow-hidden">
                                         <p className="text-[10px] font-black uppercase text-slate-800 dark:text-white truncate leading-tight">{p.full_name}</p>
                                         <p className="text-[8px] font-bold text-slate-400 uppercase truncate mt-0.5">{m.sessao}</p>
                                     </div>
                                 </div>
                             )
                         })}
                    </div>
                </div>

                {/* Dashboard Center: Professional grid feel */}
                <div className="flex-1 overflow-auto flex flex-col bg-white dark:bg-slate-950">
                    <div className="sticky top-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-8 z-40">
                         <div className="flex items-center gap-2">
                             <button onClick={() => setActiveTab('Organograma')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Organograma' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Organograma</button>
                             <button onClick={() => setActiveTab('Mapa')} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'Mapa' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Monitoramento</button>
                         </div>
                         <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Clock size={10}/> Visualização Tática v2.4</div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col items-center">
                        {activeTab === 'Mapa' ? (
                            <div className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl relative min-h-[500px]">
                                <MapContainer center={[-20.0246, -40.7464]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Circle center={[-20.0246, -40.7464]} radius={400} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15 }} />
                                    <Marker position={[-20.0246, -40.7464]}><Popup><div className="font-bold text-xs">PCP Regional</div></Popup></Marker>
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="w-full max-w-6xl flex flex-col items-center relative py-6 gap-12">
                                
                                {/* COMANDO: Balanced size */}
                                <div className="relative z-10 w-80 bg-slate-900 text-white rounded-[28px] p-5 shadow-2xl flex items-center gap-4 border border-slate-800 group">
                                    <img src={availableUsers.find(u => u.id === activePlan?.comandante)?.photo_url || `https://ui-avatars.com/api/?name=C`} className="w-14 h-14 rounded-2xl bg-slate-800 object-cover ring-2 ring-blue-500 shadow-inner group-hover:scale-105 transition-transform shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="text-sm font-black uppercase tracking-tight truncate leading-tight">{availableUsers.find(u => u.id === activePlan?.comandante)?.full_name}</h3>
                                        <div className="text-[9px] font-black uppercase text-blue-400 tracking-widest mt-1">Comandante Geral</div>
                                    </div>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 p-1.5 bg-blue-600 rounded-full text-white ring-4 ring-white dark:ring-slate-950">
                                        <Shield size={14} />
                                    </div>
                                </div>

                                {/* STAFF: Compact cards */}
                                <div className="flex flex-wrap justify-center gap-6 z-10 w-full px-6">
                                    {SESSIONS.filter(s => ['Segurança', 'Informação', 'Ligação'].includes(s.id)).map(session => {
                                         const member = getMemberByRole(session.id, 'Chefia')
                                         return (
                                            <div key={session.id} className="relative group w-44">
                                                <div onClick={() => openAssignment(session.id, 'Chefia')} className={`bg-white dark:bg-slate-900 border-2 ${member ? 'border-slate-800 dark:border-blue-600/50' : 'border-slate-100 hover:border-blue-400 border-dashed'} rounded-[24px] p-4 shadow-lg transition-all cursor-pointer flex flex-col items-center gap-3 text-center`}>
                                                    <div className={`p-2.5 ${session.color} rounded-xl text-white shadow-lg shadow-current/10`}>{session.icon}</div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 dark:text-white mb-1">{session.id}</p>
                                                        <p className={`text-[9px] font-black uppercase truncate max-w-full ${member ? 'text-blue-500' : 'text-slate-300 italic'}`}>
                                                            {member ? member.full_name : 'DEFINIR'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {member && (
                                                    <button onClick={(e) => {e.stopPropagation(); handleRemoveMember(member.id_vinculo)}} className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={10} strokeWidth={4} />
                                                    </button>
                                                )}
                                            </div>
                                         )
                                    })}
                                </div>

                                {/* GRID COMPONENTS: Dense and professional */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-6 z-10">
                                    {SESSIONS.filter(s => !['Comando', 'Segurança', 'Informação', 'Ligação'].includes(s.id)).map(session => {
                                        const chefia = getMemberByRole(session.id, 'Chefia')
                                        const equipe = scoMembers.filter(m => m.sessao === session.id && m.funcao === 'Equipe')
                                        return (
                                            <div key={session.id} className="flex flex-col h-full">
                                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[30px] shadow-lg flex flex-col transition-all h-full group/card hover:border-blue-500/30">
                                                    <div className={`${session.color} p-4 text-white flex items-center gap-3 shrink-0`}>
                                                        <div className="bg-white/10 p-2 rounded-xl border border-white/5">{session.icon}</div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{session.id}</span>
                                                    </div>
                                                    
                                                    <div className="p-4 flex flex-col flex-1 gap-5">
                                                        {/* Head Slot */}
                                                        <div className="relative group/chefia">
                                                            <div onClick={() => openAssignment(session.id, 'Chefia')} className={`p-3 rounded-2xl border-2 ${chefia ? 'border-slate-800 dark:border-blue-500/40 bg-slate-50 dark:bg-slate-800/20' : 'border-dashed border-slate-50 italic text-slate-300'} flex items-center gap-3 cursor-pointer hover:bg-white transition-all`}>
                                                                <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md shrink-0">
                                                                    {chefia ? <img src={chefia.photo_url} className="w-full h-full object-cover" /> : <Shield size={16} className="text-slate-300" />}
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Responsável</p>
                                                                    <p className={`text-[10px] font-black uppercase truncate ${chefia ? 'text-slate-800 dark:text-white' : ''}`}>{chefia ? chefia.full_name : 'Definir'}</p>
                                                                </div>
                                                            </div>
                                                            {chefia && (
                                                                <button onClick={(e) => {e.stopPropagation(); handleRemoveMember(chefia.id_vinculo)}} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-slate-700 border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 shadow-md flex items-center justify-center opacity-0 group-hover/chefia:opacity-100 transition-opacity">
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Team Members */}
                                                        <div className="flex flex-col flex-1 gap-3">
                                                            <div className="flex items-center justify-between px-1">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Equipe Operativa</span>
                                                                <span className="text-[9px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full font-black text-blue-600">{equipe.length}</span>
                                                            </div>
                                                            
                                                            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                                                                {equipe.map(m => (
                                                                    <div key={m.id} className="flex items-center gap-3 p-2 bg-slate-50/50 dark:bg-slate-800/30 group/item relative rounded-xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/40">
                                                                        <img src={availableUsers.find(u => u.id === m.usuario_id)?.photo_url || `https://ui-avatars.com/api/?name=U`} className="w-7 h-7 rounded-lg object-cover ring-2 ring-white" />
                                                                        <div className="flex-1 overflow-hidden">
                                                                            <p className="text-[9px] font-black uppercase truncate text-slate-700 dark:text-slate-200">{availableUsers.find(u => u.id === m.usuario_id)?.full_name}</p>
                                                                            <p className="text-[7px] text-slate-400 font-bold truncate uppercase">{m.atribuicao || 'Operacional'}</p>
                                                                        </div>
                                                                        <button onClick={() => handleRemoveMember(m.id)} className="w-6 h-6 bg-white dark:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all shadow-sm">
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {equipe.length === 0 && (
                                                                    <div className="text-center py-6 opacity-20 border-2 border-dashed border-slate-50 rounded-2xl">
                                                                        <p className="text-[8px] font-black uppercase tracking-widest">Nenhum Membro</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button onClick={() => openAssignment(session.id, 'Equipe')} className="w-full mt-auto py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all hover:bg-blue-600 active:scale-95 flex items-center justify-center gap-2">
                                                                <Plus size={14} /> Adicionar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: Compact and functional */}
            <footer className="h-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-10 z-[100] shrink-0">
                <div className="flex items-center gap-3">
                     <button onClick={() => setActiveTab('Organograma')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Organograma' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 bg-slate-50 hover:bg-white'}`}>Estrutura</button>
                     <button onClick={() => setActiveTab('Mapa')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Mapa' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 bg-slate-50 hover:bg-white'}`}>Monitoramento</button>
                </div>
                <button onClick={handleGenerateReport} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all active:scale-95">
                    <FileText size={16} className="text-blue-500" /> Exportar Relatório SCO
                </button>
            </footer>

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
        </div>
    )
}

export default PlanoContingencia
