import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building, MapPin, User, Phone, Save } from 'lucide-react'

const NovoAbrigo = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        bairro: '',
        capacity: '',
        responsible_name: '',
        responsible_phone: '',
        observations: ''
    })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        // TODO: Implement save logic with shelterApi and shelterDb
        setTimeout(() => {
            setSaving(false)
            navigate('/assisthumanitaria')
        }, 1000)
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 min-h-screen p-5 pb-24 font-sans">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/assisthumanitaria')}
                    className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">Novo Abrigo</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cadastro de Estrutura</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wide">Informações Básicas</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Nome do Abrigo *
                            </label>
                            <div className="relative">
                                <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                    placeholder="Ex: Ginásio Municipal"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Endereço Completo *
                            </label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                    placeholder="Rua, número, complemento"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Bairro
                            </label>
                            <input
                                type="text"
                                value={formData.bairro}
                                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                placeholder="Nome do bairro"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Capacidade Total *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                placeholder="Número de pessoas"
                            />
                        </div>
                    </div>
                </div>

                {/* Responsible Person Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wide">Responsável</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Nome do Responsável
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={formData.responsible_name}
                                    onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                    placeholder="Nome completo"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Telefone de Contato
                            </label>
                            <div className="relative">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="tel"
                                    value={formData.responsible_phone}
                                    onChange={(e) => setFormData({ ...formData, responsible_phone: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 pl-12 pr-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Observations Card */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-wide">Observações</h3>

                    <textarea
                        value={formData.observations}
                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                        rows={4}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 px-4 py-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#2a5299]/20 font-bold text-slate-800 dark:text-slate-100 resize-none"
                        placeholder="Informações adicionais sobre o abrigo..."
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#2a5299] text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {saving ? 'Salvando...' : 'Cadastrar Abrigo'}
                </button>
            </form>
        </div>
    )
}

export default NovoAbrigo
