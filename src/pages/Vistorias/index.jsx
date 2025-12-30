import React, { useState, useEffect, useContext } from 'react'
import { Save, Camera, FileText, MapPin, Trash2, Share, File as FileIcon } from 'lucide-react'
import { saveVistoriaOffline } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'

const Vistorias = () => {
    const userProfile = useContext(UserContext)

    const [formData, setFormData] = useState({
        // Identificação
        vistoriaId: '', // Auto-generated or read-only
        processo: '',

        // Responsável
        agente: '',
        matricula: '',

        // Solicitante
        solicitante: '',
        cpf: '',
        telefone: '',

        // Localização
        endereco: '',
        coordenadas: '',
        dataHora: new Date().toISOString().slice(0, 16), // datetime-local format

        // Detalhes
        tipoInfo: '', // Will be set from database
        observacoes: '',

        // Arrays
        fotos: [],
        documentos: []
    })

    const [saving, setSaving] = useState(false)
    const [tiposVistoria, setTiposVistoria] = useState([])

    useEffect(() => {
        console.log("Vistorias Component Loaded - UI Updated")
        // Generate random Vistoria ID
        setFormData(prev => ({
            ...prev,
            vistoriaId: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
            // Auto-fill from user profile
            agente: userProfile?.full_name || '',
            matricula: userProfile?.matricula || ''
        }))

        // Auto-fill coords
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setFormData(prev => ({
                    ...prev,
                    coordenadas: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`
                }))
            })
        }

        // Fetch tipos de vistoria from Supabase
        const fetchTipos = async () => {
            try {
                const { data, error } = await supabase
                    .from('tipos_vistoria')
                    .select('*')
                    .eq('ativo', true)
                    .order('ordem')

                if (!error && data) {
                    setTiposVistoria(data)
                    // Set first option as default
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, tipoInfo: data[0].nome }))
                    }
                } else {
                    console.warn('Failed to load tipos_vistoria:', error)
                    // Fallback to hardcoded options
                    setTiposVistoria([
                        { nome: 'Risco Geológico' },
                        { nome: 'Risco Hidrológico' },
                        { nome: 'Risco Estrutural' }
                    ])
                    setFormData(prev => ({ ...prev, tipoInfo: 'Risco Geológico' }))
                }
            } catch (err) {
                console.error('Error fetching tipos:', err)
                // Fallback
                setTiposVistoria([
                    { nome: 'Risco Geológico' },
                    { nome: 'Risco Hidrológico' },
                    { nome: 'Risco Estrutural' }
                ])
                setFormData(prev => ({ ...prev, tipoInfo: 'Risco Geológico' }))
            }
        }

        fetchTipos()
    }, [userProfile])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handlePhotoSelect = async (files) => {
        const newPhotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve({
                    id: Date.now() + Math.random(),
                    data: reader.result,
                    name: file.name
                })
                reader.readAsDataURL(file)
            })
        }))
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] }))
    }

    const handleDocSelect = (files) => {
        const newDocs = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        }))
        setFormData(prev => ({ ...prev, documentos: [...prev.documentos, ...newDocs] }))
    }

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== id) }))
    }

    const removeDoc = (id) => {
        setFormData(prev => ({ ...prev, documentos: prev.documentos.filter(d => d.id !== id) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await saveVistoriaOffline(formData)
            alert('Vistoria salva offline com sucesso! ID: ' + formData.vistoriaId)
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar vistoria.')
        } finally {
            setSaving(false)
        }
    }

    // Styles
    const inputClasses = "w-full bg-slate-50 p-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#2a5299] focus:ring-2 focus:ring-[#2a5299]/20 transition-all text-gray-700 font-medium placeholder:text-gray-400"
    const labelClasses = "text-sm text-[#2a5299] font-bold block mb-1.5 uppercase tracking-wide opacity-90"
    const sectionClasses = "bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5"

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            {/* Page Title */}
            <div className="bg-white px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-0 z-10 border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Nova Vistoria</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6 max-w-xl mx-auto">

                {/* Identificação */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        Identificação do Relatório
                    </h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className={labelClasses}>Nº Vistoria</label>
                            <div className="bg-blue-50/50 text-[#2a5299] font-black text-lg p-3.5 rounded-xl border border-blue-100/50 flex justify-between items-center shadow-inner">
                                {formData.vistoriaId}
                                <span className="text-blue-300">#</span>
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Nº Processo</label>
                            <input
                                type="text"
                                placeholder="Ex: 2023/0592"
                                className={inputClasses}
                                value={formData.processo}
                                onChange={e => handleChange('processo', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Responsável */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        Responsável pela Vistoria
                    </h2>
                    <div>
                        <label className={labelClasses}>Nome do Agente</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="Nome completo do agente"
                            value={formData.agente}
                            onChange={e => handleChange('agente', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Matrícula</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="Número da matrícula"
                            value={formData.matricula}
                            onChange={e => handleChange('matricula', e.target.value)}
                        />
                    </div>
                </section>

                {/* Solicitante */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        Dados do Solicitante
                    </h2>
                    <div>
                        <label className={labelClasses}>Nome do Solicitante</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="Nome completo"
                            value={formData.solicitante}
                            onChange={e => handleChange('solicitante', e.target.value)}
                        />
                    </div>
                    {/* Matricula */}
                    <div>
                        <label className={labelClasses}>Matrícula</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={inputClasses}
                            value={formData.matricula}
                            onChange={e => handleChange('matricula', e.target.value)}
                            placeholder="00000"
                        />
                    </div>

                    {/* CPF */}
                    <div>
                        <label className={labelClasses}>CPF do Solicitante</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={inputClasses}
                            value={formData.cpf}
                            onChange={e => handleChange('cpf', e.target.value)}
                            placeholder="000.000.000-00"
                        />
                    </div>

                    {/* Telefone */}
                    <div>
                        <label className={labelClasses}>Telefone</label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            className={inputClasses}
                            value={formData.telefone}
                            onChange={e => handleChange('telefone', e.target.value)}
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </section>

                {/* Localização */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        Localização e Data
                    </h2>
                    <div>
                        <label className={labelClasses}>Endereço da Ocorrência</label>
                        <div className="relative">
                            <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                            <input
                                type="text"
                                className={`${inputClasses} pl-12`}
                                placeholder="Rua, Número, Bairro"
                                value={formData.endereco}
                                onChange={e => handleChange('endereco', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className={labelClasses}>Coordenadas</label>
                            <input
                                type="text"
                                className={`${inputClasses} bg-gray-100 text-gray-500`}
                                value={formData.coordenadas}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Data/Hora</label>
                            <input
                                type="datetime-local"
                                className={inputClasses}
                                value={formData.dataHora}
                                onChange={e => handleChange('dataHora', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Detalhes */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        Detalhes da Ocorrência
                    </h2>
                    <div>
                        <label className={labelClasses}>Tipo de Vistoria</label>
                        <div className="relative">
                            <select
                                className={`${inputClasses} appearance-none`}
                                value={formData.tipoInfo}
                                onChange={e => handleChange('tipoInfo', e.target.value)}
                            >
                                {tiposVistoria.map((tipo, idx) => (
                                    <option key={idx} value={tipo.nome}>{tipo.nome}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Observações</label>
                        <textarea
                            rows="4"
                            className={inputClasses}
                            placeholder="Descreva os detalhes da situação encontrada..."
                            value={formData.observacoes}
                            onChange={e => handleChange('observacoes', e.target.value)}
                        ></textarea>
                    </div>
                </section>

                {/* Evidências */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                            Evidências
                        </h2>
                        <span className="text-xs bg-[#2a5299]/10 text-[#2a5299] font-bold px-3 py-1 rounded-full">{formData.fotos.length} fotos</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        <FileInput onFileSelect={handlePhotoSelect} label="+" />
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden shadow-md border border-gray-200 group">
                                <img src={foto.data} alt="Evidência" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(foto.id)}
                                        className="bg-white/90 text-red-500 p-1.5 rounded-full hover:bg-white"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Documentos */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg mr-2 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                            Documentos Anexos
                        </h2>
                        <span className="text-xs bg-[#2a5299]/10 text-[#2a5299] font-bold px-3 py-1 rounded-full">{formData.documentos.length} arq</span>
                    </div>

                    <div className="border-2 border-dashed border-[#2a5299]/30 bg-[#2a5299]/5 rounded-xl p-6 text-center hover:bg-[#2a5299]/10 transition-colors">
                        <FileInput
                            onFileSelect={handleDocSelect}
                            type="file"
                            label={<span className="text-[#2a5299] font-bold text-lg">Anexar Documento</span>}
                        />
                    </div>

                    <div className="space-y-3">
                        {formData.documentos.map(doc => (
                            <div key={doc.id} className="flex items-center p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                                <div className="bg-red-50 p-2.5 rounded-lg mr-4 border border-red-100">
                                    <FileIcon className="text-red-500" size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-400 font-medium">{doc.size} • Enviado agora</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeDoc(doc.id)}
                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Actions */}
                <div className="space-y-4 pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#2a5299] text-white p-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(42,82,153,0.39)] active:scale-[0.98] transition-transform flex justify-center items-center gap-3"
                    >
                        <Save size={24} />
                        {saving ? 'Safando...' : 'Salvar Vistoria'}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" className="flex justify-center items-center gap-2 p-4 border border-gray-200 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50">
                            <Share size={20} /> Exportar
                        </button>
                        <button type="button" className="flex justify-center items-center gap-2 p-4 border border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100/50">
                            <Trash2 size={20} /> Excluir
                        </button>
                    </div>
                </div>

            </form>
        </div>
    )
}

export default Vistorias
