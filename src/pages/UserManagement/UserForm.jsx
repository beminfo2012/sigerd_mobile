import React, { useState } from 'react'
import { ArrowLeft, Save, Eye, EyeOff, Shield, User, Mail, Lock, Hash, ToggleLeft, ToggleRight } from 'lucide-react'
import { createUser, updateUser, deactivateUser, reactivateUser, updateUserPassword } from '../../services/userService'
import { useToast } from '../../components/ToastNotification'

// ─── Grupos de perfil base para seleção visual ───────────────────────────────
const ROLE_GROUPS = [
    {
        group: 'Administração',
        roles: [
            { value: 'Admin', label: 'Administrador', desc: 'Acesso total ao sistema' },
            { value: 'Coordenador', label: 'Coordenador Municipal', desc: 'Gestão geral e relatórios' },
        ]
    },
    {
        group: 'Operacional — Defesa Civil',
        roles: [
            { value: 'Agente de Defesa Civil', label: 'Agente DC', desc: 'Campo e registros operacionais' },
            { value: 'Técnico em Edificações', label: 'Técnico em Edificações', desc: 'Vistorias e interdições' },
            { value: 'Secretário', label: 'Secretário', desc: 'Suporte e documentação' },
            { value: 'Operador', label: 'Operador Auxiliar', desc: 'Acesso básico de campo' },
        ]
    },
    {
        group: 'Assistência Humanitária',
        roles: [
            { value: 'Humanitario_Total', label: 'Humanitária (Total)', desc: 'Gestão completa de abrigos' },
            { value: 'Assistente Social', label: 'Assistente Social', desc: 'Abrigos e atendimento social' },
            { value: 'Humanitario_Leitura', label: 'Humanitária (Leitura)', desc: 'Somente visualização' },
        ]
    },
    {
        group: 'REDAP — Mapeamento de Danos',
        roles: [
            { value: 'Redap', label: 'REDAP', desc: 'Vincular a uma Secretaria / Setor' },
        ]
    },
    {
        group: 'Outros',
        roles: [
            { value: 'Visualizador', label: 'Visualizador', desc: 'Somente leitura limitada' },
        ]
    },
]

const REDAP_SECRETARIAS = [
    { value: 'Redap_Geral', label: 'Redap Geral (Defesa Civil)' },
    { value: 'Redap_Saude', label: 'Sec. Saúde' },
    { value: 'Redap_Social', label: 'Sec. Assistência Social' },
    { value: 'Redap_Obras', label: 'Sec. Obras' },
    { value: 'Redap_Educacao', label: 'Sec. Educação' },
    { value: 'Redap_Agricultura', label: 'Sec. Agricultura' },
    { value: 'Redap_Interior', label: 'Sec. Interior' },
    { value: 'Redap_Administracao', label: 'Sec. Administração' },
    { value: 'Redap_Transportes', label: 'Sec. Transportes' },
    { value: 'Redap_EsporteTurismo', label: 'Sec. Esportes e Turismo' },
    { value: 'Redap_DefesaSocial', label: 'Sec. Defesa Social' },
    { value: 'Redap_CDL', label: 'CDL / Comércio' },
    { value: 'Redap_Cesan', label: 'CESAN / Água' },
    { value: 'Redap_Setorial', label: 'Redap Setorial (Outros/Padrão)' },
]

// ─── Componente principal ─────────────────────────────────────────────────────
const UserForm = ({ user, onClose }) => {
    const isEditMode = !!user
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        password: '',
        matricula: user?.matricula || '',
        cargo: user?.cargo || '',
        role: user?.role || 'Agente de Defesa Civil',
        is_active: user?.is_active !== false,
    })

    const [errors, setErrors] = useState({})

    const validateForm = () => {
        const newErrors = {}
        if (!formData.full_name.trim()) newErrors.full_name = 'Nome é obrigatório'
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido'
        if (!isEditMode && !formData.password) newErrors.password = 'Senha é obrigatória para novos usuários'
        if (formData.password && formData.password.length < 6) newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return
        setLoading(true)
        try {
            if (isEditMode) {
                const updates = {
                    full_name: formData.full_name,
                    matricula: formData.matricula,
                    cargo: formData.cargo,
                    role: formData.role,
                    is_active: formData.is_active,
                }
                const { error } = await updateUser(user.id, updates)
                if (error) { toast.error('Erro', `Não foi possível atualizar o usuário: ${error.message}`); return }
                if (formData.password) {
                    const { error: pwdError } = await updateUserPassword(user.id, formData.password)
                    if (pwdError) alert(`Usuário atualizado, mas erro ao alterar senha: ${pwdError.message}`)
                }
                toast.success('Sucesso', 'Dados do usuário atualizados!')
            } else {
                const { error } = await createUser(formData)
                if (error) { toast.error('Erro ao criar', error.message); return }
                toast.success('Sucesso', 'Novo usuário cadastrado!')
            }
            onClose(true)
        } catch (error) {
            console.error('Error saving user:', error)
            toast.error('Erro', 'Não foi possível salvar o usuário.')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        if (!isEditMode) { setFormData(prev => ({ ...prev, is_active: !prev.is_active })); return }
        if (!window.confirm(`Deseja realmente ${formData.is_active ? 'desativar' : 'reativar'} este usuário?`)) return
        setLoading(true)
        try {
            const { error } = formData.is_active ? await deactivateUser(user.id) : await reactivateUser(user.id)
            if (error) { alert(`Erro: ${error.message}`); return }
            setFormData(prev => ({ ...prev, is_active: !prev.is_active }))
            toast.success('Status Alterado', `Usuário ${formData.is_active ? 'desativado' : 'reativado'} com sucesso!`)
        } catch (error) {
            toast.error('Erro', 'Não foi possível alterar o status do usuário.')
        } finally {
            setLoading(false)
        }
    }

    const isRedapSelected = formData.role.startsWith('Redap_') || formData.role === 'Redap'

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => onClose(false)} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">{isEditMode ? 'Editar Usuário' : 'Novo Usuário'}</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{isEditMode ? 'Atualizar informações' : 'Cadastrar novo acesso'}</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Nome Completo */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <User size={12} /> Nome Completo *
                    </label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                        placeholder="Ex: João Silva"
                    />
                    {errors.full_name && <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.full_name}</p>}
                </div>

                {/* Email */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Mail size={12} /> Email *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        disabled={isEditMode}
                        className={`w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="usuario@exemplo.com"
                    />
                    {errors.email && <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.email}</p>}
                    {isEditMode && <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">Email não pode ser alterado</p>}
                </div>

                {/* Senha */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Lock size={12} /> {isEditMode ? 'Nova Senha (opcional)' : 'Senha *'}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                            className="w-full bg-slate-50 p-4 pr-12 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                            placeholder={isEditMode ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.password}</p>}
                </div>

                {/* Matrícula e Cargo */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                            <Hash size={12} /> Matrícula
                        </label>
                        <input type="text" value={formData.matricula} onChange={(e) => setFormData(p => ({ ...p, matricula: e.target.value }))}
                            className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800" placeholder="Ex: 12345" />
                    </div>
                    <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                            <Shield size={12} /> Cargo
                        </label>
                        <input type="text" value={formData.cargo} onChange={(e) => setFormData(p => ({ ...p, cargo: e.target.value }))}
                            className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800" placeholder="Ex: Agente DC" />
                    </div>
                </div>

                {/* Perfil base — seleção visual por grupos */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1 flex items-center gap-2">
                        <Shield size={12} /> Perfil de Acesso *
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium mb-4 px-1">
                        As permissões de cada perfil são gerenciadas em <strong>Gestão de Perfis</strong>.
                    </p>
                    <div className="space-y-5">
                        {ROLE_GROUPS.map(group => (
                            <div key={group.group}>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{group.group}</p>
                                <div className="flex flex-wrap gap-2">
                                    {group.roles.map(role => {
                                        const isSelected = role.value === 'Redap'
                                            ? isRedapSelected
                                            : formData.role === role.value
                                        return (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => {
                                                    if (role.value === 'Redap') {
                                                        if (!formData.role.startsWith('Redap_')) {
                                                            setFormData(p => ({ ...p, role: 'Redap_Setorial' }))
                                                        }
                                                    } else {
                                                        setFormData(p => ({ ...p, role: role.value }))
                                                    }
                                                }}
                                                className={`flex-1 min-w-[calc(50%-4px)] px-3 py-3 rounded-2xl text-left transition-all border-2 ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                                    : 'bg-slate-50 text-slate-600 border-transparent hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className={`text-xs font-black leading-tight ${isSelected ? 'text-white' : 'text-slate-700'}`}>{role.label}</div>
                                                {role.desc && <div className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{role.desc}</div>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* REDAP Dropdown selector */}
                    {isRedapSelected && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Vincular à Secretaria / Órgão do REDAP:
                            </label>
                            <select
                                value={formData.role.startsWith('Redap_') ? formData.role : 'Redap_Setorial'}
                                onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                                className="w-full bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {REDAP_SECRETARIAS.map(sec => (
                                    <option key={sec.value} value={sec.value}>
                                        {sec.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Status */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Usuário</label>
                            <p className="text-xs font-medium text-slate-500">{formData.is_active ? 'Usuário pode acessar o sistema' : 'Acesso bloqueado'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleStatus}
                            disabled={loading}
                            className={`p-2 rounded-2xl transition-all ${formData.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                            {formData.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                </div>

                {/* Salvar */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {loading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Usuário')}
                </button>
            </div>
        </div>
    )
}

export default UserForm
