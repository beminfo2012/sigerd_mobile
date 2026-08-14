import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Shield, User, Edit3, Trash2, Eye, X, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { listProfiles, deleteProfile, getUserCountByRole, saveProfile } from '../../services/profileService'
import { listUsers } from '../../services/userService'
import { isAdmin } from '../../utils/permissions'
import { useToast } from '../../components/ToastNotification'
import ProfileForm from './ProfileForm'

const MODULE_LABELS = {
    dashboard: 'Dashboard',
    tv_mode: 'Modo TV',
    ocorrencias: 'Ocorrências',
    vistorias: 'Vistorias',
    interdicoes: 'Interdições',
    redap: 'REDAP',
    humanitaria: 'Assist. Humanitária / Abrigos',
    voluntarios: 'Voluntários',
    mci: 'Capacidade Instalada (MCI)',
    contingencia: 'Plano de Contingência',
    usuarios: 'Usuários (Administração)',
    orthofotos: 'Orthofotos / Camadas GIS',
    noprer: 'Núcleo Operacional (NOPRER)',
    nortis: 'Módulo NORTIS (Legislação)',
    mrcr: 'Módulo MRCR (Custos)',
    agenda: 'Agenda de Prazos',
    pluviometros: 'Pluviômetros / Monitoramento',
    checklist_saida: 'Checklist de Saída',
    georescue: 'GeoRescue (Mapa Interativo)',
    alertas: 'Alertas (Cemaden/Sistema)'
}

const ACTION_LABELS = {
    ver: 'Ver',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    imprimir: 'Imprimir',
    aprovar: 'Aprovar',
}

// ─── Modal de Visualização de Perfil (Detalhes, Usuários e Permissões) ───────
const ProfileDetailModal = ({ profile, users, userCount, onClose, onEdit, onToggleStatus, onDelete }) => {
    const [activeTab, setActiveTab] = useState('permissions') // 'permissions' or 'users'
    const profileUsers = users.filter(u => u.role === profile.role_key)

    const permissions = profile.permissions || {}
    const activePermsCount = Object.keys(permissions).reduce((acc, modId) => {
        const modPerms = permissions[modId] || {}
        const activeActions = Object.keys(modPerms).filter(act => modPerms[act])
        return acc + (activeActions.length > 0 ? 1 : 0)
    }, 0)

    const isProfileActive = profile.is_active !== false

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Shield size={16} />
                            </span>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                                {profile.label}
                            </h2>
                            {profile.is_system && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-200 text-slate-600 border border-slate-300">
                                    Sistema
                                </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${isProfileActive ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {isProfileActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chave: {profile.role_key}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Description */}
                {profile.description && (
                    <div className="px-6 py-4 bg-blue-50/30 border-b border-blue-50/50">
                        <p className="text-xs text-slate-600 font-medium italic">
                            "{profile.description}"
                        </p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-white">
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`flex-1 py-4 font-black text-xs uppercase tracking-widest border-b-2 text-center transition-all ${activeTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Permissões ({activePermsCount} módulos)
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-4 font-black text-xs uppercase tracking-widest border-b-2 text-center transition-all ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Usuários Vinculados ({userCount})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
                    {activeTab === 'permissions' ? (
                        <div className="space-y-3">
                            {Object.keys(MODULE_LABELS).map(modId => {
                                const modPerms = permissions[modId] || {}
                                const activeActions = Object.keys(modPerms).filter(act => modPerms[act])

                                if (activeActions.length === 0) return null

                                return (
                                    <div key={modId} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                                        <span className="text-xs font-black text-slate-700">{MODULE_LABELS[modId]}</span>
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {activeActions.map(action => (
                                                <span key={action} className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
                                                    {ACTION_LABELS[action] || action}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                            {activePermsCount === 0 && (
                                <div className="text-center py-8">
                                    <ShieldCheck className="mx-auto mb-2 text-slate-300" size={36} />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhuma permissão concedida para este perfil.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {profileUsers.map(user => (
                                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase ${user.is_active ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                                            {user.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <span className="block text-xs font-black text-slate-700 leading-tight">{user.full_name || 'Sem nome'}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{user.email}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-650'}`}>
                                        {user.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            ))}
                            {profileUsers.length === 0 && (
                                <div className="text-center py-8">
                                    <User className="mx-auto mb-2 text-slate-300" size={36} />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum usuário vinculado a este perfil.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                    {profile.role_key !== 'Admin' && (
                        <button
                            onClick={() => onToggleStatus(profile)}
                            className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all ${isProfileActive ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}`}
                        >
                            {isProfileActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                            {isProfileActive ? 'Inativar' : 'Ativar'}
                        </button>
                    )}
                    {!profile.is_system && userCount === 0 && (
                        <button
                            onClick={() => onDelete(profile)}
                            className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        >
                            <Trash2 size={16} />
                            Excluir
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(profile)}
                        className="px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    >
                        <Edit3 size={16} />
                        Editar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-3 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}

const ProfileManagement = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [profiles, setProfiles] = useState([])
    const [users, setUsers] = useState([])
    const [userCounts, setUserCounts] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingProfile, setEditingProfile] = useState(null)
    const [selectedProfileDetail, setSelectedProfileDetail] = useState(null)
    const [hasAdminAccess, setHasAdminAccess] = useState(false)

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        const admin = await isAdmin()
        if (!admin) {
            toast.error('Acesso Negado', 'Apenas administradores podem acessar esta página.')
            navigate('/menu')
            return
        }
        setHasAdminAccess(true)
        loadData()
    }

    const loadData = async () => {
        setLoading(true)
        try {
            const [profilesRes, countsRes, usersRes] = await Promise.all([
                listProfiles(),
                getUserCountByRole(),
                listUsers()
            ])

            if (profilesRes.error) {
                console.error('Error loading profiles:', profilesRes.error)
                toast.error('Erro de Carregamento', 'Não foi possível carregar os perfis.')
            } else {
                setProfiles(profilesRes.data || [])
            }

            if (!countsRes.error) {
                setUserCounts(countsRes.data || {})
            }

            if (!usersRes.error) {
                setUsers(usersRes.data || [])
            }
        } catch (error) {
            console.error('Exception loading profiles data:', error)
            toast.error('Falha Crítica', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProfile = () => {
        setEditingProfile(null)
        setShowForm(true)
        setSelectedProfileDetail(null)
    }

    const handleEditProfile = (profile) => {
        setEditingProfile(profile)
        setShowForm(true)
        setSelectedProfileDetail(null)
    }

    const handleToggleStatus = async (profile) => {
        if (profile.role_key === 'Admin') {
            toast.warning('Ação Negada', 'O perfil Administrador do sistema não pode ser inativado.')
            return
        }

        const isProfileActive = profile.is_active !== false
        const nextStatus = !isProfileActive
        if (!window.confirm(`Deseja realmente ${nextStatus ? 'ativar' : 'inativar'} o perfil "${profile.label}"?`)) {
            return
        }

        try {
            const { error } = await saveProfile({
                ...profile,
                is_active: nextStatus
            })

            if (error) {
                toast.error('Erro', error.message || 'Ocorreu um erro ao alterar o status.')
            } else {
                toast.success('Sucesso', `Perfil ${nextStatus ? 'ativado' : 'inativado'} com sucesso!`)
                setSelectedProfileDetail(null)
                loadData()
            }
        } catch (error) {
            console.error('Exception changing profile status:', error)
            toast.error('Falha', 'Não foi possível alterar o status.')
        }
    }

    const handleDeleteProfile = async (profile) => {
        if (profile.is_system) {
            toast.warning('Bloqueado', 'Perfis de sistema não podem ser excluídos.')
            return
        }

        const count = userCounts[profile.role_key] || 0
        if (count > 0) {
            toast.warning('Ação Negada', `Existem ${count} usuário(s) utilizando este perfil. Altere os usuários antes de excluir.`)
            return
        }

        if (!window.confirm(`Deseja realmente excluir o perfil "${profile.label}"? Esta ação não pode ser desfeita.`)) {
            return
        }

        try {
            const { error } = await deleteProfile(profile.id)
            if (error) {
                toast.error('Erro ao Excluir', error.message || 'Ocorreu um erro ao excluir o perfil.')
            } else {
                toast.success('Sucesso', 'Perfil excluído com sucesso!')
                setSelectedProfileDetail(null)
                loadData()
            }
        } catch (error) {
            console.error('Exception deleting profile:', error)
            toast.error('Falha', 'Não foi possível excluir o perfil.')
        }
    }

    const handleFormClose = (success) => {
        setShowForm(false)
        setEditingProfile(null)
        if (success) {
            loadData()
        }
    }

    const filteredProfiles = profiles.filter(profile =>
        profile.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.role_key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!hasAdminAccess) {
        return null
    }

    if (showForm) {
        return <ProfileForm profile={editingProfile} onClose={handleFormClose} />
    }

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/menu')}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Gestão de Perfis</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Atribuições & Permissões por Módulo</p>
                </div>
            </div>

            {/* Search and Create */}
            <div className="mb-6 space-y-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar perfil..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 placeholder:text-slate-300"
                    />
                </div>

                <button
                    onClick={handleCreateProfile}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                    <Plus size={20} />
                    Novo Perfil
                </button>
            </div>

            {/* Profile List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-500">Carregando perfis...</span>
                </div>
            ) : filteredProfiles.length === 0 ? (
                <div className="bg-white border border-slate-200 p-8 shadow-sm text-center">
                    <Shield size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-500">
                        {searchTerm ? 'Nenhum perfil encontrado' : 'Nenhum perfil cadastrado'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredProfiles.map((profile) => {
                        const userCount = userCounts[profile.role_key] || 0
                        const isProfileActive = profile.is_active !== false
                        return (
                            <div
                                key={profile.id}
                                onClick={() => setSelectedProfileDetail(profile)}
                                className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 active:scale-95 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 border-2 ${isProfileActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                            <Shield size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-black text-slate-800 text-sm truncate">
                                                    {profile.label}
                                                </h3>
                                                {profile.is_system && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                                        Sistema
                                                    </span>
                                                )}
                                                {!isProfileActive && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-200">
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-2">
                                                {profile.description || 'Sem descrição cadastrada.'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1">
                                                    <User size={10} />
                                                    {userCount} {userCount === 1 ? 'usuário' : 'usuários'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                                                    Chave: {profile.role_key}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => setSelectedProfileDetail(profile)}
                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Visualizar Permissões"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEditProfile(profile)}
                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                            title="Editar Perfil"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Profile Detail Modal */}
            {selectedProfileDetail && (
                <ProfileDetailModal
                    profile={selectedProfileDetail}
                    users={users}
                    userCount={userCounts[selectedProfileDetail.role_key] || 0}
                    onClose={() => setSelectedProfileDetail(null)}
                    onEdit={handleEditProfile}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteProfile}
                />
            )}
        </div>
    )
}

export default ProfileManagement
