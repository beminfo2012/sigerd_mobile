import React, { useState } from 'react'
import { ArrowLeft, Save, Shield, Settings, Check, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { saveProfile } from '../../services/profileService'
import { useToast } from '../../components/ToastNotification'

const MODULES = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        color: 'blue',
        actions: ['ver'],
    },
    {
        id: 'tv_mode',
        label: 'Modo TV',
        color: 'blue',
        actions: ['ver'],
    },
    {
        id: 'ocorrencias',
        label: 'Ocorrências',
        color: 'orange',
        actions: ['ver', 'criar', 'editar', 'excluir', 'imprimir', 'aprovar'],
    },
    {
        id: 'vistorias',
        label: 'Vistorias',
        color: 'violet',
        actions: ['ver', 'criar', 'editar', 'excluir', 'imprimir', 'aprovar'],
    },
    {
        id: 'interdicoes',
        label: 'Interdições',
        color: 'red',
        actions: ['ver', 'criar', 'editar', 'excluir', 'imprimir', 'aprovar'],
    },
    {
        id: 'redap',
        label: 'REDAP',
        color: 'sky',
        actions: ['ver', 'criar', 'editar', 'imprimir'],
    },
    {
        id: 'humanitaria',
        label: 'Assist. Humanitária / Abrigos',
        color: 'emerald',
        actions: ['ver', 'criar', 'editar', 'excluir', 'imprimir', 'aprovar'],
    },
    {
        id: 'voluntarios',
        label: 'Voluntários',
        color: 'teal',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'mci',
        label: 'Capacidade Instalada (MCI)',
        color: 'green',
        actions: ['ver', 'criar', 'imprimir'],
    },
    {
        id: 'contingencia',
        label: 'Plano de Contingência',
        color: 'amber',
        actions: ['ver', 'editar'],
    },
    {
        id: 'usuarios',
        label: 'Usuários (Administração)',
        color: 'fuchsia',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'orthofotos',
        label: 'Gerenciar Orthofotos / Camadas GIS',
        color: 'emerald',
        actions: ['ver', 'editar'],
    },
    {
        id: 'noprer',
        label: 'Núcleo Operacional (NOPRER)',
        color: 'violet',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'nortis',
        label: 'Módulo NORTIS (Legislação)',
        color: 'indigo',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'mrcr',
        label: 'Módulo MRCR (Custos)',
        color: 'blue',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'agenda',
        label: 'Agenda de Prazos',
        color: 'violet',
        actions: ['ver', 'criar', 'editar', 'excluir'],
    },
    {
        id: 'pluviometros',
        label: 'Pluviômetros / Monitoramento',
        color: 'sky',
        actions: ['ver'],
    },
    {
        id: 'checklist_saida',
        label: 'Checklist de Saída',
        color: 'amber',
        actions: ['ver', 'criar', 'editar'],
    },
    {
        id: 'georescue',
        label: 'GeoRescue (Mapa Interativo)',
        color: 'teal',
        actions: ['ver'],
    },
    {
        id: 'alertas',
        label: 'Alertas (Cemaden/Sistema)',
        color: 'orange',
        actions: ['ver', 'criar'],
    },
]

const ACTION_LABELS = {
    ver: 'Ver',
    criar: 'Criar',
    editar: 'Editar',
    excluir: 'Excluir',
    imprimir: 'Imprimir',
    aprovar: 'Aprovar',
}

const MODULE_COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', header: 'bg-blue-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', header: 'bg-orange-500' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', header: 'bg-violet-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', header: 'bg-red-600' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', header: 'bg-sky-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', header: 'bg-emerald-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', header: 'bg-teal-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', header: 'bg-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', header: 'bg-amber-500' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100', header: 'bg-fuchsia-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', header: 'bg-indigo-600' }
}

const PermissionModule = ({ module, permissions, onChange }) => {
    const [open, setOpen] = useState(false)
    const perms = permissions[module.id] || {}
    const colors = MODULE_COLORS[module.color] || MODULE_COLORS.blue

    const hasAny = module.actions.some(a => perms[a])
    const hasAll = module.actions.every(a => perms[a])

    const toggleAll = () => {
        const newVal = !hasAll
        const updated = Object.fromEntries(module.actions.map(a => [a, newVal]))
        onChange(module.id, updated)
    }

    const toggleAction = (action) => {
        onChange(module.id, { ...perms, [action]: !perms[action] })
    }

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all ${hasAny ? colors.border : 'border-slate-100'}`}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${hasAny ? colors.bg : 'bg-slate-50'}`}
            >
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleAll() }}
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all flex-shrink-0 ${hasAll ? `${colors.header} border-transparent` : hasAny ? 'border-slate-400 bg-slate-200' : 'border-slate-300 bg-white'}`}
                    >
                        {hasAll && <Check size={11} className="text-white" />}
                        {hasAny && !hasAll && <div className="w-2 h-0.5 bg-slate-500 rounded" />}
                    </button>
                    <span className={`text-sm font-black ${hasAny ? colors.text : 'text-slate-500'}`}>{module.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${hasAny ? `${colors.bg} ${colors.text}` : 'bg-slate-100 text-slate-400'}`}>
                        {module.actions.filter(a => perms[a]).length}/{module.actions.length}
                    </span>
                    {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                </div>
            </button>

            {/* Permissions grid */}
            {open && (
                <div className="bg-white p-4 grid grid-cols-2 gap-2 border-t border-slate-100">
                    {module.actions.map(action => (
                        <button
                            key={action}
                            type="button"
                            onClick={() => toggleAction(action)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${perms[action] ? `${colors.bg} ${colors.text} ${colors.border}` : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                        >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${perms[action] ? `${colors.header}` : 'border border-slate-300 bg-white'}`}>
                                {perms[action] && <Check size={9} className="text-white" />}
                            </div>
                            {ACTION_LABELS[action]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const ProfileForm = ({ profile, onClose }) => {
    const isEditMode = !!profile
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        role_key: profile?.role_key || '',
        label: profile?.label || '',
        description: profile?.description || '',
        is_system: profile?.is_system || false,
        is_active: profile?.is_active !== false,
    })

    const [permissions, setPermissions] = useState(() => {
        if (profile?.permissions && typeof profile.permissions === 'object') {
            return profile.permissions
        }
        // Inicializar objeto vazio para permissões
        return Object.fromEntries(MODULES.map(m => [m.id, {}]))
    })

    const [errors, setErrors] = useState({})

    const handlePermissionChange = (moduleId, newPerms) => {
        setPermissions(prev => ({ ...prev, [moduleId]: newPerms }))
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.label.trim()) newErrors.label = 'Nome do perfil é obrigatório'
        if (!formData.role_key.trim()) newErrors.role_key = 'Chave do perfil (role_key) é obrigatória'
        else if (formData.role_key.includes(' ')) newErrors.role_key = 'A chave do perfil não deve conter espaços'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return
        setLoading(true)
        try {
            const { error } = await saveProfile({
                ...formData,
                permissions
            })

            if (error) {
                toast.error('Erro ao Salvar', error.message || 'Ocorreu um erro ao salvar o perfil.')
            } else {
                toast.success('Sucesso', 'Perfil salvo com sucesso!')
                onClose(true)
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error('Falha', 'Não foi possível salvar o perfil.')
        } finally {
            setLoading(false)
        }
    }

    const activeModulesCount = MODULES.filter(m => Object.values(permissions[m.id] || {}).some(Boolean)).length

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => onClose(false)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">{isEditMode ? 'Editar Perfil' : 'Novo Perfil'}</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{isEditMode ? 'Atualizar atribuições e permissões' : 'Criar nova função de acesso'}</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Nome do Perfil */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Shield size={12} /> Nome do Perfil *
                    </label>
                    <input
                        type="text"
                        value={formData.label}
                        onChange={(e) => setFormData(p => ({ ...p, label: e.target.value }))}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                        placeholder="Ex: Agente Especial DC"
                    />
                    {errors.label && <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.label}</p>}
                </div>

                {/* Chave (role_key) */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Shield size={12} /> Chave do Perfil (role_key) *
                    </label>
                    <input
                        type="text"
                        value={formData.role_key}
                        onChange={(e) => setFormData(p => ({ ...p, role_key: e.target.value }))}
                        disabled={isEditMode && formData.is_system}
                        className={`w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 ${(isEditMode && formData.is_system) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="Ex: Agente_Especial"
                    />
                    {errors.role_key && <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.role_key}</p>}
                    <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">Chave identificadora única interna do sistema (ex: Admin, Operador, Redap_Saude).</p>
                </div>

                {/* Descrição */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                        Descrição do Perfil
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 h-24 resize-none"
                        placeholder="Ex: Perfil destinado a agentes com permissões especiais de vistoria."
                    />
                </div>

                {/* Status do Perfil */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Perfil</label>
                            <p className="text-xs font-medium text-slate-500">{formData.is_active ? 'Perfil ativo e disponível para uso' : 'Perfil inativo (usuários não herdarão acessos)'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                            disabled={formData.is_system}
                            className={`p-2 rounded-2xl transition-all ${formData.is_system ? 'opacity-50 cursor-not-allowed' : ''} ${formData.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                            {formData.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                </div>

                {/* Permissões do Perfil */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Settings size={16} className="text-slate-600" />
                        </div>
                        <div>
                            <span className="block font-black text-slate-800 text-sm">Permissões por Módulo</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{activeModulesCount} de {MODULES.length} módulos ativos</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Configure o nível de acesso que este perfil terá para cada módulo do sistema:
                    </p>
                    <div className="space-y-2">
                        {MODULES.map(module => (
                            <PermissionModule
                                key={module.id}
                                module={module}
                                permissions={permissions}
                                onChange={handlePermissionChange}
                            />
                        ))}
                    </div>
                </div>

                {/* Salvar */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Perfil')}
                </button>
            </div>
        </div>
    )
}

export default ProfileForm
