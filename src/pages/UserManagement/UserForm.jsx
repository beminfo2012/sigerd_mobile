import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, Trash2, Eye, EyeOff, Shield, User, Mail, Lock, Hash, ToggleLeft, ToggleRight } from 'lucide-react'
import { createUser, updateUser, deactivateUser, reactivateUser, updateUserPassword } from '../../services/userService'

const UserForm = ({ user, onClose }) => {
    const isEditMode = !!user
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        password: '',
        matricula: user?.matricula || '',
        role: user?.role || 'Operador',
        is_active: user?.is_active !== false
    })

    const [errors, setErrors] = useState({})

    const roles = [
        { value: 'Admin', label: 'Administrador', icon: Shield, color: 'purple' },
        { value: 'Operador', label: 'Operador', icon: User, color: 'blue' },
        { value: 'Visualizador', label: 'Visualizador', icon: Eye, color: 'slate' }
    ]

    const validateForm = () => {
        const newErrors = {}

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Nome é obrigatório'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido'
        }

        if (!isEditMode && !formData.password) {
            newErrors.password = 'Senha é obrigatória para novos usuários'
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
            if (isEditMode) {
                // Update existing user
                const updates = {
                    full_name: formData.full_name,
                    matricula: formData.matricula,
                    role: formData.role,
                    is_active: formData.is_active
                }

                const { error } = await updateUser(user.id, updates)

                if (error) {
                    alert(`Erro ao atualizar usuário: ${error.message}`)
                    return
                }

                // Update password if provided
                if (formData.password) {
                    const { error: pwdError } = await updateUserPassword(user.id, formData.password)
                    if (pwdError) {
                        alert(`Usuário atualizado, mas erro ao alterar senha: ${pwdError.message}`)
                    }
                }

                alert('Usuário atualizado com sucesso!')
            } else {
                // Create new user
                const { error } = await createUser(formData)

                if (error) {
                    alert(`Erro ao criar usuário: ${error.message}`)
                    return
                }

                alert('Usuário criado com sucesso!')
            }

            onClose(true)
        } catch (error) {
            console.error('Error saving user:', error)
            alert('Erro ao salvar usuário.')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        if (!isEditMode) {
            setFormData({ ...formData, is_active: !formData.is_active })
            return
        }

        if (!window.confirm(`Deseja realmente ${formData.is_active ? 'desativar' : 'reativar'} este usuário?`)) {
            return
        }

        setLoading(true)
        try {
            const { error } = formData.is_active
                ? await deactivateUser(user.id)
                : await reactivateUser(user.id)

            if (error) {
                alert(`Erro: ${error.message}`)
                return
            }

            setFormData({ ...formData, is_active: !formData.is_active })
            alert(`Usuário ${formData.is_active ? 'desativado' : 'reativado'} com sucesso!`)
        } catch (error) {
            console.error('Error toggling status:', error)
            alert('Erro ao alterar status.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => onClose(false)}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">
                        {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                        {isEditMode ? 'Atualizar informações' : 'Cadastrar novo acesso'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
                {/* Full Name */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <User size={12} />
                        Nome Completo *
                    </label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                        placeholder="Ex: João Silva"
                    />
                    {errors.full_name && (
                        <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.full_name}</p>
                    )}
                </div>

                {/* Email */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Mail size={12} />
                        Email *
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isEditMode}
                        className={`w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        placeholder="usuario@exemplo.com"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.email}</p>
                    )}
                    {isEditMode && (
                        <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">Email não pode ser alterado</p>
                    )}
                </div>

                {/* Password */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Lock size={12} />
                        {isEditMode ? 'Nova Senha (opcional)' : 'Senha *'}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-slate-50 p-4 pr-12 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                            placeholder={isEditMode ? 'Deixe vazio para manter' : 'Mínimo 6 caracteres'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-xs text-red-500 font-bold mt-2 px-1">{errors.password}</p>
                    )}
                </div>

                {/* Matricula */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                        <Hash size={12} />
                        Matrícula (opcional)
                    </label>
                    <input
                        type="text"
                        value={formData.matricula}
                        onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                        placeholder="Ex: 12345"
                    />
                </div>

                {/* Role Selection */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <Shield size={12} />
                        Perfil de Acesso *
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                    >
                        <optgroup label="Administração">
                            <option value="Admin">Administrador (TI/Total)</option>
                            <option value="Coordenador">Coordenador Municipal (Geral)</option>
                        </optgroup>
                        <optgroup label="Operacional">
                            <option value="Agente de Defesa Civil">Agente de Defesa Civil</option>
                            <option value="Técnico em Edificações">Técnico em Edificações</option>
                            <option value="Secretário">Secretário</option>
                            <option value="Operador">Operador de Campo Auxiliar</option>
                        </optgroup>
                        <optgroup label="Assistência Humanitária e Abrigos">
                            <option value="Humanitario_Total">Assistência Humanitária (Gestão Total)</option>
                            <option value="Assistente Social">Assistente Social</option>
                            <option value="Humanitario_Leitura">Humantiária (Somente Leitura)</option>
                        </optgroup>
                        <optgroup label="Respostas e Desastres (Redap)">
                            <option value="Redap_Geral">Redap - Gestão Geral (Defesa Civil)</option>
                            <option value="Redap_Saude">Redap - Sec. Saúde</option>
                            <option value="Redap_Obras">Redap - Sec. Obras e Infraestrutura</option>
                            <option value="Redap_Social">Redap - Sec. Assistência Social</option>
                            <option value="Redap_Educacao">Redap - Sec. Educação</option>
                            <option value="Redap_Agricultura">Redap - Sec. Agricultura</option>
                            <option value="Redap_Interior">Redap - Sec. Interior</option>
                            <option value="Redap_Administracao">Redap - Sec. Administração</option>
                            <option value="Redap_EsporteTurismo">Redap - Sec. Esportes e Turismo</option>
                            <option value="Redap_DefesaSocial">Redap - Sec. Defesa Social</option>
                            <option value="Redap_Transportes">Redap - Sec. Transportes</option>
                            <option value="Redap_Cesan">Redap - CESAN / Água</option>
                            <option value="Redap_CDL">Redap - CDL / Comércio local</option>
                            <option value="Redap_Setorial">Redap - Setorial (Padrão)</option>
                        </optgroup>
                        <optgroup label="Outros">
                            <option value="Visualizador">Visualizador (Somente Leitura Limitado)</option>
                        </optgroup>
                    </select>
                </div>

                {/* Status Toggle */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Status do Usuário
                            </label>
                            <p className="text-xs font-medium text-slate-500">
                                {formData.is_active ? 'Usuário pode acessar o sistema' : 'Acesso bloqueado'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleToggleStatus}
                            disabled={loading}
                            className={`p-2 rounded-2xl transition-all ${formData.is_active
                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                        >
                            {formData.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                </div>

                {/* Save Button */}
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
