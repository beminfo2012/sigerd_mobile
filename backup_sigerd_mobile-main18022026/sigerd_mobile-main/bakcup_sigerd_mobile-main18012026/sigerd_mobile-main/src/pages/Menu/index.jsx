import React, { useState, useEffect } from 'react'
import { User, Settings, LogOut, Database, WifiOff, CheckCircle, RefreshCcw, X, Edit2, Save, Trash2, ShieldAlert } from 'lucide-react'
import { syncPendingData, getPendingSyncCount, resetDatabase, clearLocalData } from '../../services/db'
import { supabase } from '../../services/supabase'

const Menu = ({ userProfile, onLogout, setUserProfile }) => {
    const [syncCount, setSyncCount] = useState(0)
    const [syncing, setSyncing] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [editName, setEditName] = useState(userProfile?.full_name || '')
    const [editMatricula, setEditMatricula] = useState(userProfile?.matricula || '')
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        loadPendingCount()
    }, [])

    const loadPendingCount = async () => {
        const count = await getPendingSyncCount()
        setSyncCount(count)
    }

    const handleManualSync = async () => {
        if (syncCount === 0 || syncing) return
        if (!navigator.onLine) {
            alert('Você precisa estar online para sincronizar dados.')
            return
        }

        setSyncing(true)
        try {
            const result = await syncPendingData()
            if (result.success) {
                await loadPendingCount()
                alert(`${result.count} registros sincronizados com sucesso!`)
                window.dispatchEvent(new CustomEvent('sync-complete'))
            }
        } catch (e) {
            console.error('Sync failed:', e)
            alert('Erro na sincronização.')
        } finally {
            setSyncing(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!editName.trim()) return
        setSavingProfile(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: editName,
                        matricula: editMatricula,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)

                if (!error) {
                    setUserProfile({ ...userProfile, full_name: editName, matricula: editMatricula })
                    setShowProfileModal(false)
                    alert('Perfil atualizado!')
                } else {
                    alert('Erro ao atualizar perfil.')
                }
            }
        } catch (e) {
            console.error(e)
            alert('Erro de conexão.')
        } finally {
            setSavingProfile(false)
        }
    }

    const handleResetDB = async () => {
        if (!window.confirm('⚠️ AVISO CRÍTICO: Isso apagará TODOS os dados do celular e deslogará você. Use apenas se o aplicativo estiver travado ou com dados corrompidos. Continuar?')) return

        try {
            await resetDatabase()
            onLogout()
        } catch (e) {
            console.error(e)
            await clearLocalData()
            onLogout()
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* User Header Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-xl font-black text-blue-600 mr-5 border-2 border-blue-100">
                    {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-800 leading-tight">
                        {userProfile?.full_name || 'Agente'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {userProfile?.matricula ? `Matrícula: ${userProfile.matricula}` : 'Defesa Civil'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditName(userProfile?.full_name || '')
                        setEditMatricula(userProfile?.matricula || '')
                        setShowProfileModal(true)
                    }}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                    <Edit2 size={20} />
                </button>
            </div>

            {/* Menu Sections */}
            <div className="space-y-4">
                <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden">
                    {/* Sync Option */}
                    <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left border-b border-slate-50"
                    >
                        <div className="flex items-center">
                            <div className={`p-3 rounded-2xl mr-4 ${syncCount > 0 ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                                <Database size={22} className={syncing ? 'animate-spin' : ''} />
                            </div>
                            <div>
                                <span className="block font-bold text-slate-800 text-sm">Sincronizar Dados</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {syncCount > 0 ? `${syncCount} registros pendentes` : 'Tudo atualizado'}
                                </span>
                            </div>
                        </div>
                        {syncCount > 0 && <RefreshCcw size={18} className="text-slate-300" />}
                        {syncCount === 0 && <CheckCircle size={18} className="text-green-500" />}
                    </button>

                    {/* Settings Option (Clear Cache Only) */}
                    <button
                        onClick={async () => {
                            if (window.confirm('Deseja limpar o cache de histórico? Isso não apaga vistorias pendentes.')) {
                                await clearLocalData()
                                alert('Cache limpo!')
                                window.location.reload()
                            }
                        }}
                        className="w-full p-5 flex items-center hover:bg-slate-50 transition-colors text-left border-b border-slate-50"
                    >
                        <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl mr-4">
                            <Settings size={22} />
                        </div>
                        <div>
                            <span className="block font-bold text-slate-800 text-sm">Limpar Cache</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Otimizar espaço local</span>
                        </div>
                    </button>

                    {/* Critical Reset */}
                    <button
                        onClick={handleResetDB}
                        className="w-full p-5 flex items-center hover:bg-red-50 transition-colors text-left"
                    >
                        <div className="p-3 bg-red-50 text-red-500 rounded-2xl mr-4">
                            <ShieldAlert size={22} />
                        </div>
                        <div>
                            <span className="block font-bold text-red-600 text-sm">Resetar Aplicativo</span>
                            <span className="text-[10px] font-bold text-red-300 uppercase tracking-tight">Uso emergencial apenas</span>
                        </div>
                    </button>
                </div>

                {/* Logout Card */}
                <button
                    onClick={onLogout}
                    className="w-full bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                    <div className="p-3 bg-red-50 rounded-2xl mr-4">
                        <LogOut size={22} />
                    </div>
                    <div>
                        <span className="block font-bold text-sm">Deslogar do Sistema</span>
                        <span className="text-[10px] font-bold text-red-300 uppercase tracking-tight">Encerrar sessão atual</span>
                    </div>
                </button>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Editar Perfil</h3>
                            <button onClick={() => setShowProfileModal(false)} className="text-slate-300 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Matrícula</label>
                                <input
                                    type="text"
                                    value={editMatricula}
                                    onChange={e => setEditMatricula(e.target.value)}
                                    className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        >
                            <Save size={20} />
                            {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-12 flex flex-col items-center w-full">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">SIGERD MOBILE V1.2.0</p>
                <p className="text-[10px] font-bold text-slate-200 mt-1">Defesa Civil Municipal</p>
            </div>
        </div>
    )
}

export default Menu
