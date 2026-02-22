import React, { useState } from 'react'
import { X, Save, Edit } from 'lucide-react'
import { supabase } from '../services/supabase'

const ProfileModal = ({ userProfile, setUserProfile, onClose }) => {
    const [editName, setEditName] = useState(userProfile?.full_name || '')
    const [editMatricula, setEditMatricula] = useState(userProfile?.matricula || '')
    const [editSignature, setEditSignature] = useState(userProfile?.signature || null)
    const [savingProfile, setSavingProfile] = useState(false)

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
                    const updatedProfile = {
                        ...userProfile,
                        full_name: editName,
                        matricula: editMatricula,
                        signature: editSignature
                    }
                    setUserProfile(updatedProfile)
                    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
                    alert('Perfil atualizado!')
                    onClose()
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

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Editar Perfil</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Atualize suas informações</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-5 mb-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 dark:text-slate-100 transition-all"
                            placeholder="Seu nome completo"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Matrícula</label>
                        <input
                            type="text"
                            value={editMatricula}
                            onChange={e => setEditMatricula(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 dark:text-slate-100 transition-all"
                            placeholder="Número da matrícula"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Sua Assinatura Digital</label>
                        <div
                            className="w-full bg-slate-50 dark:bg-slate-900 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden group transition-all"
                        >
                            {editSignature ? (
                                <img src={editSignature} className="h-full w-auto object-contain" />
                            ) : (
                                <div className="text-center opacity-40">
                                    <Edit size={20} className="mx-auto mb-1" />
                                    <span className="text-[10px] font-bold uppercase">Assinatura no App Mobile</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-slate-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex-[2] bg-blue-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {savingProfile ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfileModal
