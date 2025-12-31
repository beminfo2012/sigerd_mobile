import React, { useState, useEffect, useContext } from 'react'
import { Save, Camera, FileText, MapPin, Trash2, Share, File as FileIcon, ArrowLeft, Crosshair } from 'lucide-react'
import { saveVistoriaOffline } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'

const VistoriaForm = ({ onBack, initialData = null }) => {
    const userProfile = useContext(UserContext)

    const [formData, setFormData] = useState({
        // Identificação
        vistoriaId: '',
        processo: '',

        // Responsável
        agente: '',
        matricula: '',

        // Solicitante
        solicitante: '',
        cpf: '',
        telefone: '',
        enderecoSolicitante: '',

        // Localização
        endereco: '', // Occurrence Address
        coordenadas: '',
        dataHora: new Date().toISOString().slice(0, 16),

        // Detalhes
        tipoInfo: '',
        observacoes: '',

        // Arrays
        fotos: [],
        documentos: []
    })

    const [saving, setSaving] = useState(false)
    const [gettingLoc, setGettingLoc] = useState(false)
    const [tiposVistoria, setTiposVistoria] = useState([])

    useEffect(() => {
        if (initialData) {
            setFormData(initialData)
        } else {
            // Initialize new form
            setFormData(prev => ({
                ...prev,
                vistoriaId: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
                agente: userProfile?.full_name || '',
                matricula: userProfile?.matricula || ''
            }))
        }

        // Fetch types
        const fetchTipos = async () => {
            try {
                const { data } = await supabase.from('tipos_vistoria').select('*').eq('ativo', true).order('ordem')
                if (data && data.length > 0) {
                    setTiposVistoria(data)
                    if (!initialData) setFormData(prev => ({ ...prev, tipoInfo: data[0].nome }))
                } else {
                    setTiposVistoria([{ nome: 'Risco Geológico' }, { nome: 'Risco Hidrológico' }, { nome: 'Risco Estrutural' }])
                    if (!initialData) setFormData(prev => ({ ...prev, tipoInfo: 'Risco Geológico' }))
                }
            } catch (e) {
                console.error(e)
                setTiposVistoria([{ nome: 'Risco Geológico' }, { nome: 'Risco Hidrológico' }, { nome: 'Risco Estrutural' }])
            }
        }
        fetchTipos()
    }, [userProfile, initialData])

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert("GPS não suportado neste dispositivo.")
            return
        }

        setGettingLoc(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
                setFormData(prev => ({ ...prev, coordenadas: coords }))
                setGettingLoc(false)
                alert("Coordenadas atualizadas com sucesso!")
            },
            (err) => {
                console.error("Erro GPS:", err)
                setGettingLoc(false)
                alert("Erro ao obter localização. Verifique se o GPS está ativado.")
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

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
            alert('Vistoria salva com sucesso!')
            onBack()
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
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                    {initialData ? 'Editar Vistoria' : 'Nova Vistoria'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6 max-w-xl mx-auto">

                {/* 1. Identificação */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        1. Identificação
                    </h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className={labelClasses}>Nº Vistoria</label>
                            <div className="bg-blue-50/50 text-[#2a5299] font-black text-lg p-3.5 rounded-xl border border-blue-100/50 flex justify-between items-center shadow-inner">
                                {formData.vistoriaId}
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Nº Processo</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.processo}
                                onChange={e => handleChange('processo', e.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Responsável (Agente) */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        2. Responsável Técnico
                    </h2>
                    <div>
                        <label className={labelClasses}>Agente</label>
                        <input type="text" className={inputClasses} value={formData.agente} onChange={e => handleChange('agente', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClasses}>Matrícula</label>
                        <input type="text" className={inputClasses} value={formData.matricula} onChange={e => handleChange('matricula', e.target.value)} />
                    </div>
                </section>

                {/* 3. Solicitante */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        3. Solicitante
                    </h2>
                    <div>
                        <label className={labelClasses}>Nome Completo</label>
                        <input type="text" className={inputClasses} value={formData.solicitante} onChange={e => handleChange('solicitante', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClasses}>Endereço do Solicitante</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="Rua, Número, Bairro (Se diferente da ocorrência)"
                            value={formData.enderecoSolicitante}
                            onChange={e => handleChange('enderecoSolicitante', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>CPF</label>
                            <input type="text" inputMode="numeric" className={inputClasses} value={formData.cpf} onChange={e => handleChange('cpf', e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClasses}>Telefone</label>
                            <input type="tel" className={inputClasses} value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} />
                        </div>
                    </div>
                </section>

                {/* 4. Localização da Ocorrência */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        4. Local da Ocorrência
                    </h2>
                    <div>
                        <label className={labelClasses}>Endereço da Ocorrência</label>
                        <div className="relative">
                            <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                            <input
                                type="text"
                                className={`${inputClasses} pl-12`}
                                placeholder="Onde ocorreu o evento?"
                                value={formData.endereco}
                                onChange={e => handleChange('endereco', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        <div>
                            <label className={labelClasses}>Coordenadas</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className={`${inputClasses} bg-gray-100 text-gray-500`}
                                    value={formData.coordenadas}
                                    readOnly
                                    placeholder="Lat, Long"
                                />
                                <button
                                    type="button"
                                    onClick={getLocation}
                                    className={`p-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-white flex items-center justify-center gap-2 ${gettingLoc ? 'bg-gray-400' : 'bg-[#2a5299] hover:bg-[#1e3c72]'}`}
                                    title="Pegar Localização Atual"
                                    disabled={gettingLoc}
                                >
                                    <Crosshair size={24} className={gettingLoc ? 'animate-spin' : ''} />
                                    {gettingLoc ? 'Buscando...' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Detalhes */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2">5. Detalhes</h2>
                    <div>
                        <label className={labelClasses}>Tipo</label>
                        <select className={inputClasses} value={formData.tipoInfo} onChange={e => handleChange('tipoInfo', e.target.value)}>
                            {tiposVistoria.map((t, i) => <option key={i} value={t.nome}>{t.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Observações</label>
                        <textarea rows="4" className={inputClasses} value={formData.observacoes} onChange={e => handleChange('observacoes', e.target.value)} />
                    </div>
                </section>

                {/* Evidências */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg">Evidências</h2>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{formData.fotos.length} fotos</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <FileInput onFileSelect={handlePhotoSelect} label="+" />
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                                <img src={foto.data} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removePhoto(foto.id)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Submit & Actions */}
                <div className="space-y-4 pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-[#2a5299] text-white p-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-3"
                    >
                        <Save size={24} />
                        {saving ? 'Salvando...' : 'Salvar Vistoria'}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => alert("Exportar PDF")} className="flex justify-center items-center gap-2 p-4 border border-gray-200 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50">
                            <Share size={20} /> Exportar
                        </button>
                        <button type="button" onClick={() => alert("Excluir")} className="flex justify-center items-center gap-2 p-4 border border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100/50">
                            <Trash2 size={20} /> Excluir
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default VistoriaForm
