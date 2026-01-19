import React, { useState, useEffect } from 'react'
import { Users, UserPlus, ArrowLeft, Search, Shield, UserCheck, UserX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { listUsers } from '../../services/userService'
import { isAdmin } from '../../utils/permissions'
import UserForm from './UserForm'

const UserManagement = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [hasAdminAccess, setHasAdminAccess] = useState(false)

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        const admin = await isAdmin()
        if (!admin) {
            alert('Acesso negado. Apenas administradores podem acessar esta página.')
            navigate('/menu')
            return
        }
        setHasAdminAccess(true)
        loadUsers()
    }

    const loadUsers = async () => {
        setLoading(true)
        try {
            const { data, error } = await listUsers()
            if (error) {
                console.error('Error loading users:', error)
                alert('Erro ao carregar usuários.')
            } else {
                setUsers(data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = () => {
        setEditingUser(null)
        setShowForm(true)
    }

    const handleEditUser = (user) => {
        setEditingUser(user)
        setShowForm(true)
    }

    const handleFormClose = (success) => {
        setShowForm(false)
        setEditingUser(null)
        if (success) {
            loadUsers()
        }
    }

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-50 text-purple-600 border-purple-100'
            case 'Operador':
                return 'bg-blue-50 text-blue-600 border-blue-100'
            case 'Visualizador':
                return 'bg-slate-50 text-slate-600 border-slate-100'
            default:
                return 'bg-gray-50 text-gray-600 border-gray-100'
        }
    }

    if (!hasAdminAccess) {
        return null
    }

    if (showForm) {
        return <UserForm user={editingUser} onClose={handleFormClose} />
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
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Administração do Sistema</p>
                </div>
            </div>

            {/* Search and Create */}
            <div className="mb-6 space-y-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou matrícula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 placeholder:text-slate-300"
                    />
                </div>

                <button
                    onClick={handleCreateUser}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                    <UserPlus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-500">Carregando usuários...</span>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
                    <Users size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-500">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        {searchTerm ? 'Tente outro termo de busca' : 'Clique em "Novo Usuário" para começar'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => handleEditUser(user)}
                            className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 active:scale-95 transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 ${user.is_active ? 'bg-blue-50 text-blue-600 border-2 border-blue-100' : 'bg-slate-100 text-slate-400 border-2 border-slate-200'}`}>
                                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-slate-800 text-sm truncate">
                                            {user.full_name || 'Sem nome'}
                                        </h3>
                                        {user.role === 'Admin' && (
                                            <Shield size={14} className="text-purple-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate mb-2">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight border ${getRoleBadgeColor(user.role)}`}>
                                            {user.role || 'Sem perfil'}
                                        </span>
                                        {user.matricula && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                                                Mat: {user.matricula}
                                            </span>
                                        )}
                                        {user.is_active ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                                                <UserCheck size={10} />
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                                                <UserX size={10} />
                                                Inativo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Footer */}
            <div className="mt-8 bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-black text-slate-800">{users.length}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Total</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-green-600">{users.filter(u => u.is_active).length}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Ativos</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-red-600">{users.filter(u => !u.is_active).length}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Inativos</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserManagement
