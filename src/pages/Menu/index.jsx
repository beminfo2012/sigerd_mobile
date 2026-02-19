import React, { useState, useEffect } from 'react'
import { User, Settings, LogOut, Database, WifiOff, CheckCircle, RefreshCcw, X, Edit2, Save, Trash2, ShieldAlert, ArrowLeft, Users, Edit, Moon, Sun, BarChart3, Globe } from 'lucide-react'
import { syncPendingData, getPendingSyncCount, resetDatabase, clearLocalData } from '../../services/db'
import { supabase } from '../../services/supabase'
import SignaturePadComp from '../../components/SignaturePad'

const Menu = ({ userProfile, onLogout, setUserProfile, isDarkMode, setIsDarkMode }) => {
    const [syncDetail, setSyncDetail] = useState({ total: 0 })
    const [syncing, setSyncing] = useState(false)
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [editName, setEditName] = useState(userProfile?.full_name || '')
    const [editMatricula, setEditMatricula] = useState(userProfile?.matricula || '')
    const [editSignature, setEditSignature] = useState(userProfile?.signature || null)
    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        loadPendingCount()
    }, [])

    const loadPendingCount = async () => {
        const detail = await getPendingSyncCount()
        setSyncDetail(detail)
    }

    // [FIX] Ensure saude@s2id.com has correct role if it was accidentally promoted
    useEffect(() => {
        const fixRole = async () => {
            if (userProfile?.email === 'saude@s2id.com' && userProfile?.role !== 'S2id_Saude') {
                console.log('Correcting saude role to S2id_Saude...')
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            role: 'S2id_Saude',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)

                    if (!error) {
                        const newProfile = { ...userProfile, role: 'S2id_Saude' }
                        setUserProfile(newProfile)
                        localStorage.setItem('userProfile', JSON.stringify(newProfile))
                        alert('Perfil corrigido automaticamente para Secretaria de Saúde.')
                    }
                }
            }

            // [FIX] Ensure freitas.edificar@gmail.com has correct role (Agente de Defesa Civil) to access all menus
            if (userProfile?.email === 'freitas.edificar@gmail.com' && userProfile?.role !== 'Agente de Defesa Civil') {
                console.log('Correcting freitas role to Agente de Defesa Civil...')
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            role: 'Agente de Defesa Civil',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', user.id)

                    if (!error) {
                        const newProfile = { ...userProfile, role: 'Agente de Defesa Civil' }
                        setUserProfile(newProfile)
                        localStorage.setItem('userProfile', JSON.stringify(newProfile))
                        alert('Acesso total restaurado ao SIGERD.')
                    }
                }
            }
        }
        fixRole()
    }, [userProfile])

    const handleManualSync = async () => {
        if (syncDetail.total === 0 || syncing) return
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
                        signature: editSignature,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id)

                if (!error) {
                    const updatedProfile = { ...userProfile, full_name: editName, matricula: editMatricula, signature: editSignature }
                    setUserProfile(updatedProfile)
                    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
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
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen p-5 pb-24 font-sans transition-colors duration-300">
            {/* Header Back Button */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => window.location.href = '/'}
                    className="p-3 bg-white text-slate-400 rounded-2xl shadow-sm border border-slate-100 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Menu do Sistema</h1>
                <div className="flex-1"></div>
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:text-blue-600 transition-colors"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* User Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex items-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xl font-black text-blue-600 mr-5 border-2 border-blue-100 dark:border-blue-900/50">
                    {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                        {userProfile?.full_name || 'Usuário'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {userProfile?.role || 'Acesso Restrito'}
                    </p>
                    {userProfile?.matricula && (
                        <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                            Matrícula: {userProfile.matricula}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => {
                        setEditName(userProfile?.full_name || '')
                        setEditMatricula(userProfile?.matricula || '')
                        setEditSignature(userProfile?.signature || null)
                        setShowProfileModal(true)
                    }}
                    className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition-colors"
                >
                    <Edit2 size={20} />
                </button>
            </div>

            {/* Menu Sections */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {/* Sync Option */}
                    <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-50 dark:border-slate-700"
                    >
                        <div className="flex items-center">
                            <div className={`p-3 rounded-2xl mr-4 ${syncDetail.total > 0 ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-500' : 'bg-green-50 dark:bg-green-950/30 text-green-500'}`}>
                                <Database size={22} className={syncing ? 'animate-spin' : ''} />
                            </div>
                            <div>
                                <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm">Sincronizar Dados</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {syncDetail.total > 0 ? `${syncDetail.total} registros pendentes` : 'Tudo atualizado'}
                                </span>
                            </div>
                        </div>
                        {syncDetail.total > 0 && <RefreshCcw size={18} className="text-slate-300" />}
                        {syncDetail.total === 0 && <CheckCircle size={18} className="text-green-500" />}
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
                        className="w-full p-5 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-slate-50 dark:border-slate-700"
                    >
                        <div className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-500 rounded-2xl mr-4">
                            <Settings size={22} />
                        </div>
                        <div>
                            <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm">Limpar Cache</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Otimizar espaço local</span>
                        </div>
                    </button>

                    {/* Critical Reset - Only for Agents */}
                    {['Agente de Defesa Civil', 'Técnico em Edificações', 'admin'].includes(userProfile?.role) && (
                        <button
                            onClick={handleResetDB}
                            className="w-full p-5 flex items-center hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left border-b border-slate-50 dark:border-slate-700"
                        >
                            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-2xl mr-4">
                                <ShieldAlert size={22} />
                            </div>
                            <div>
                                <span className="block font-bold text-red-600 text-sm">Resetar Aplicativo</span>
                                <span className="text-[10px] font-bold text-red-300 uppercase tracking-tight">Uso emergencial apenas</span>
                            </div>
                        </button>
                    )}
                </div>


                {/* S2ID Strategic Module - Access for S2id roles and Defesa Civil */}
                {(['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'S2id_Geral', 'S2id_Setorial', 'S2id_Saude', 'S2id_Educacao', 'S2id_Obras', 'Agente de Defesa Civil', 'admin'].includes(userProfile?.role)) && (
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => window.location.href = '/s2id'}
                            className="w-full p-5 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl mr-4">
                                    <Globe size={22} />
                                </div>
                                <div className="flex-1">
                                    <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm">Módulo S2id</span>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-tight">Preenchimento Setorial de Danos</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase">Nacional</div>
                        </button>
                    </div>
                )}

                {/* Management Section (Strategic) - FOR COORDINATORS AND ADMINS */}
                {['Admin', 'Coordenador', 'Secretário', 'admin'].includes(userProfile?.role) && (
                    <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <button
                            onClick={() => window.location.href = '/monitoramento/gestao'}
                            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl mr-4">
                                    <BarChart3 size={22} />
                                </div>
                                <div className="flex-1">
                                    <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm">Gestão Estratégica</span>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Painel de Autoridades</span>
                                </div>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-2 py-1 rounded-lg uppercase">Novo</div>
                        </button>
                    </div>
                )}

                {/* Logout Card */}
                <button
                    onClick={onLogout}
                    className="w-full bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-700 flex items-center text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                >
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl mr-4">
                        <LogOut size={22} />
                    </div>
                    <div>
                        <span className="block font-bold text-sm text-red-600 dark:text-red-500">Deslogar do Sistema</span>
                        <span className="text-[10px] font-bold text-red-300 uppercase tracking-tight">Encerrar sessão atual</span>
                    </div>
                </button>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Editar Perfil</h3>
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
                                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 dark:text-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Matrícula</label>
                                <input
                                    type="text"
                                    value={editMatricula}
                                    onChange={e => setEditMatricula(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sua Assinatura Digital</label>
                                <div
                                    onClick={() => setShowSignaturePad(true)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors"
                                >
                                    {editSignature ? (
                                        <img src={editSignature} className="h-full w-auto object-contain" />
                                    ) : (
                                        <div className="text-center">
                                            <Edit size={20} className="mx-auto text-slate-300 group-hover:text-blue-500 mb-1" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tocar para cadastrar</span>
                                        </div>
                                    )}
                                </div>
                                {editSignature && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditSignature(null)
                                        }}
                                        className="text-[9px] font-bold text-red-500 uppercase mt-2 px-1"
                                    >
                                        Limpar Assinatura
                                    </button>
                                )}
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

            {/* Signature Pad Modal */}
            {showSignaturePad && (
                <SignaturePadComp
                    title="Cadastrar Assinatura Digital"
                    onCancel={() => setShowSignaturePad(false)}
                    onSave={(dataUrl) => {
                        setEditSignature(dataUrl)
                        setShowSignaturePad(false)
                    }}
                />
            )}

            <div className="mt-12 flex flex-col items-center w-full">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[4px]">SIGERD MOBILE {isDarkMode ? '🌙' : '☀️'}</p>
                <p className="text-[10px] font-bold text-slate-200 mt-1">Defesa Civil Municipal</p>
            </div>
        </div>
    )
}

export default Menu
