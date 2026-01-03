import React, { useState, useEffect, useContext } from 'react'
import { Save, Camera, FileText, MapPin, Trash2, Share, ArrowLeft, Crosshair, ShieldAlert, AlertOctagon, User, Upload, X, Edit2 } from 'lucide-react'
import { saveInterdicaoOffline } from '../../services/db'
import FileInput from '../../components/FileInput'
import { generatePDF } from '../../utils/pdfGenerator'
import { compressImage } from '../../utils/imageOptimizer'
import SignaturePadComp from '../../components/SignaturePad'
import { UserContext } from '../../App'

const InterdicaoForm = ({ onBack, initialData = null }) => {
    const userProfile = useContext(UserContext)
    const [formData, setFormData] = useState({
        interdicaoId: '',
        dataHora: (() => {
            const now = new Date();
            const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            const year = brasiliaTime.getFullYear();
            const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
            const day = String(brasiliaTime.getDate()).padStart(2, '0');
            const hours = String(brasiliaTime.getHours()).padStart(2, '0');
            const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        })(),
        municipio: 'Santa Maria de Jetibá',
        bairro: '',
        endereco: '',
        tipoAlvo: 'Imóvel',
        tipoAlvoEspecificar: '',
        latitude: '',
        longitude: '',
        coordenadas: '',
        responsavelNome: '',
        responsavelCpf: '',
        responsavelTelefone: '',
        responsavelEmail: '',
        riscoTipo: [],
        riscoGrau: 'Médio',
        situacaoObservada: '',
        medidaTipo: 'Total',
        medidaPrazo: 'Indeterminado',
        medidaPrazoData: '',
        evacuacaoNecessaria: false,
        fotos: [],
        relatorioTecnico: '',
        recomendacoes: '',
        orgaosAcionados: '',
        agente: userProfile?.nome || '',
        matricula: userProfile?.matricula || '',
        assinaturaAgente: null
    })

    const [showSignaturePad, setShowSignaturePad] = useState(false)

    const [saving, setSaving] = useState(false)
    const [gettingLoc, setGettingLoc] = useState(false)

    useEffect(() => {
        if (initialData) {
            // Map DB fields back to form state if necessary
            // For interdicao, the fields seem to match mostly, but let's be careful
            setFormData({
                ...initialData,
                interdicaoId: initialData.interdicao_id || initialData.interdicaoId,
                dataHora: initialData.data_hora || initialData.dataHora,
                tipoAlvo: initialData.tipo_alvo || initialData.tipoAlvo,
                tipoAlvoEspecificar: initialData.tipo_alvo_especificar || initialData.tipoAlvoEspecificar,
                responsavelNome: initialData.responsavel_nome || initialData.responsavelNome,
                responsavelCpf: initialData.responsavel_cpf || initialData.responsavelCpf,
                responsavelTelefone: initialData.responsavel_telefone || initialData.responsavelTelefone,
                responsavelEmail: initialData.responsavel_email || initialData.responsavelEmail,
                riscoTipo: initialData.risco_tipo || initialData.riscoTipo || [],
                riscoGrau: initialData.risco_grau || initialData.riscoGrau,
                situacaoObservada: initialData.situacao_observada || initialData.situacaoObservada,
                medidaTipo: initialData.medida_tipo || initialData.medidaTipo,
                medidaPrazo: initialData.medida_prazo || initialData.medidaPrazo,
                medidaPrazoData: initialData.medida_prazo_data || initialData.medidaPrazoData,
                evacuacaoNecessaria: initialData.evacuacao_necessaria ?? initialData.evacuacaoNecessaria,
                relatorioTecnico: initialData.relatorio_tecnico || initialData.relatorioTecnico,
                recomendacoes: initialData.recomendacoes,
                orgaosAcionados: initialData.orgaos_acionados || initialData.orgaosAcionados,
                agente: initialData.agente || initialData.agente || '',
                matricula: initialData.matricula || initialData.matricula || '',
                assinaturaAgente: initialData.assinatura_agente || initialData.assinaturaAgente || null
            })
        } else {
            getNextId()
        }
    }, [initialData])

    // Listen for deletion events to recalculate ID
    useEffect(() => {
        const handleDeletion = () => {
            if (!initialData) {
                getNextId()
            }
        }
        window.addEventListener('interdicao-deleted', handleDeletion)
        return () => window.removeEventListener('interdicao-deleted', handleDeletion)
    }, [initialData])

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert("GPS não suportado neste dispositivo.")
            return
        }

        setGettingLoc(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude,
                    coordenadas: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                }))
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

    const toggleRisco = (tipo) => {
        setFormData(prev => ({
            ...prev,
            riscoTipo: prev.riscoTipo.includes(tipo)
                ? prev.riscoTipo.filter(t => t !== tipo)
                : [...prev.riscoTipo, tipo]
        }))
    }

    const handlePhotoSelect = async (files) => {
        const newPhotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = async () => {
                    try {
                        const compressed = await compressImage(reader.result)
                        resolve({
                            id: Date.now() + Math.random(),
                            data: compressed,
                            legenda: ''
                        })
                    } catch (e) {
                        console.error("Compression error:", e)
                        resolve({
                            id: Date.now() + Math.random(),
                            data: reader.result,
                            legenda: ''
                        })
                    }
                }
                reader.readAsDataURL(file)
            })
        }))
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] }))
    }

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== id) }))
    }

    const getNextId = async () => {
        const currentYear = new Date().getFullYear()
        const { data, error } = await supabase
            .from('interdicoes')
            .select('interdicao_id')
            .filter('interdicao_id', 'like', `%/${currentYear}`)

        let nextNum = 1
        if (data && data.length > 0) {
            const ids = data.map(v => {
                const parts = (v.interdicao_id || '').split('/')
                return parseInt(parts[0])
            }).filter(n => !isNaN(n)).sort((a, b) => a - b)

            for (let i = 0; i < ids.length; i++) {
                if (ids[i] === nextNum) {
                    nextNum++
                } else if (ids[i] > nextNum) {
                    break
                }
            }
        }

        const formattedId = `${nextNum.toString().padStart(2, '0')}/${currentYear}`
        setFormData(prev => ({ ...prev, interdicaoId: formattedId }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await saveInterdicaoOffline(formData)
            alert('Interdição salva com sucesso!')
            onBack()
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar interdição.')
        } finally {
            setSaving(false)
        }
    }

    // Styles
    const inputClasses = "w-full bg-slate-50 p-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#2a5299] focus:ring-2 focus:ring-[#2a5299]/20 transition-all text-gray-700 font-medium placeholder:text-gray-400"
    const labelClasses = "text-sm text-[#2a5299] font-bold block mb-1.5 uppercase tracking-wide opacity-90"
    const sectionClasses = "bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5"

    return (
        <div className="bg-slate-50 min-h-screen pb-32 font-sans">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                    {initialData ? 'Editar Interdição' : 'Nova Interdição'}
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
                        <div className="col-span-2">
                            <label className={labelClasses}>Nº Interdição</label>
                            <div className="bg-blue-50/50 text-[#2a5299] font-black text-lg p-3.5 rounded-xl border border-blue-100/50 flex justify-between items-center shadow-inner">
                                {formData.interdicaoId || 'Gerando...'}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Data e Hora</label>
                            <input type="datetime-local" value={formData.dataHora} onChange={e => handleChange('dataHora', e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Município</label>
                            <input type="text" value={formData.municipio} readOnly className={`${inputClasses} bg-gray-100 text-gray-500`} />
                        </div>
                        <div>
                            <label className={labelClasses}>Bairro / Localidade</label>
                            <input type="text" value={formData.bairro} onChange={e => handleChange('bairro', e.target.value)} className={inputClasses} required />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Endereço Completo</label>
                            <textarea rows="2" value={formData.endereco} onChange={e => handleChange('endereco', e.target.value)} className={inputClasses} required />
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Tipo de Alvo</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Imóvel', 'Via pública', 'Área pública', 'Outro'].map(t => (
                                <button key={t} type="button" onClick={() => handleChange('tipoAlvo', t)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.tipoAlvo === t ? 'bg-[#2a5299] border-[#2a5299] text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {formData.tipoAlvo === 'Outro' && (
                            <input type="text" placeholder="Especifique..." value={formData.tipoAlvoEspecificar} onChange={e => handleChange('tipoAlvoEspecificar', e.target.value)} className={`${inputClasses} mt-2 animate-in slide-in-from-top-2 duration-300`} />
                        )}
                    </div>
                </section>

                {/* 2. Geolocalização */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        2. Localização
                    </h2>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                            <input
                                type="text"
                                className={`${inputClasses} pl-12 bg-gray-100 text-gray-500`}
                                value={formData.coordenadas}
                                readOnly
                                placeholder="Lat, Long"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={getLocation}
                            className={`p-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-white flex items-center justify-center gap-2 ${gettingLoc ? 'bg-gray-400' : 'bg-[#2a5299] hover:bg-[#1e3c72]'}`}
                            disabled={gettingLoc}
                        >
                            <Crosshair size={24} className={gettingLoc ? 'animate-spin' : ''} />
                            {gettingLoc ? 'Buscando...' : ''}
                        </button>
                    </div>
                </section>

                {/* 3. Identificação do Responsável */}
                {formData.tipoAlvo !== 'Via pública' && (
                    <section className={`${sectionClasses} animate-in fade-in duration-500`}>
                        <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                            3. Responsável / Proprietário
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>Nome Completo</label>
                                <input type="text" value={formData.responsavelNome} onChange={e => handleChange('responsavelNome', e.target.value)} className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>CPF/CNPJ</label>
                                    <input type="tel" inputMode="numeric" pattern="[0-9]*" value={formData.responsavelCpf} onChange={e => handleChange('responsavelCpf', e.target.value.replace(/\D/g, ''))} className={inputClasses} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Telefone</label>
                                    <input type="tel" inputMode="tel" value={formData.responsavelTelefone} onChange={e => handleChange('responsavelTelefone', e.target.value)} className={inputClasses} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClasses}>E-mail</label>
                                <input type="email" value={formData.responsavelEmail} onChange={e => handleChange('responsavelEmail', e.target.value)} className={inputClasses} />
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. Caracterização do Risco */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        4. Caracterização do Risco
                    </h2>

                    <div>
                        <label className={labelClasses}>Tipo de Ocorrência (Múltiplo)</label>
                        <div className="flex flex-wrap gap-2">
                            {['Risco estrutural', 'Deslizamento', 'Alagamento', 'Erosão', 'Incêndio', 'Colapso parcial', 'Colapso total', 'Outro'].map(r => (
                                <button key={r} type="button" onClick={() => toggleRisco(r)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.riscoTipo.includes(r) ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Grau de Risco</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Baixo', 'Médio', 'Alto', 'Imediato'].map(g => (
                                <button key={g} type="button" onClick={() => handleChange('riscoGrau', g)} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.riscoGrau === g ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Situação Observada</label>
                        <textarea rows="3" value={formData.situacaoObservada} onChange={e => handleChange('situacaoObservada', e.target.value)} className={inputClasses} placeholder="Descreva os danos e evidências..." />
                    </div>
                </section>

                {/* 5. Medida Administrativa */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        5. Medida Administrativa
                    </h2>

                    <div>
                        <label className={labelClasses}>Tipo de Interdição</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Total', 'Parcial', 'Preventiva'].map(m => (
                                <button key={m} type="button" onClick={() => handleChange('medidaTipo', m)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.medidaTipo === m ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Prazo</label>
                            <select value={formData.medidaPrazo} onChange={e => handleChange('medidaPrazo', e.target.value)} className={inputClasses}>
                                <option>Indeterminado</option>
                                <option>Determinado</option>
                            </select>
                        </div>
                        {formData.medidaPrazo === 'Determinado' && (
                            <div className="animate-in slide-in-from-right-2 duration-300">
                                <label className={labelClasses}>Data Final</label>
                                <input type="date" value={formData.medidaPrazoData} onChange={e => handleChange('medidaPrazoData', e.target.value)} className={inputClasses} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div>
                            <div className="text-xs font-black text-red-600 uppercase tracking-widest">Evacuação</div>
                            <div className="text-[10px] font-bold text-red-400">Desocupação imediata?</div>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl shadow-inner border border-red-100">
                            <button type="button" onClick={() => handleChange('evacuacaoNecessaria', true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.evacuacaoNecessaria ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>SIM</button>
                            <button type="button" onClick={() => handleChange('evacuacaoNecessaria', false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!formData.evacuacaoNecessaria ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}>NÃO</button>
                        </div>
                    </div>
                </section>

                {/* 6. Registro Fotográfico */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                            6. Registro Fotográfico
                        </h2>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{formData.fotos.length} fotos</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 justify-items-center">
                        <FileInput onFileSelect={handlePhotoSelect} label="+" />
                        {formData.fotos.map((foto, idx) => (
                            <div key={foto.id} className="relative w-full aspect-square rounded-xl overflow-hidden shadow-md group">
                                <img src={foto.data || foto} className="w-full h-full object-cover" alt="Preview" />
                                <button type="button" onClick={() => removePhoto(foto.id)} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/40">
                                    <input
                                        type="text"
                                        placeholder="Legenda..."
                                        className="w-full bg-transparent text-[8px] text-white border-none p-0 focus:ring-0 placeholder:text-white/60"
                                        value={foto.legenda}
                                        onChange={e => {
                                            const newFotos = [...formData.fotos]
                                            newFotos[idx].legenda = e.target.value
                                            handleChange('fotos', newFotos)
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 7. Observações Técnicas */}
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#2a5299] rounded-full"></span>
                        7. Relatório e Recomendações
                    </h2>

                    <div>
                        <label className={labelClasses}>Relatório Técnico</label>
                        <textarea rows="4" value={formData.relatorioTecnico} onChange={e => handleChange('relatorioTecnico', e.target.value)} className={inputClasses} placeholder="Detalhes técnicos da vistoria..." />
                    </div>

                    <div>
                        <label className={labelClasses}>Recomendações Imediatas</label>
                        <textarea rows="2" value={formData.recomendacoes} onChange={e => handleChange('recomendacoes', e.target.value)} className={inputClasses} placeholder="O que o morador/município deve fazer..." />
                    </div>

                    <div>
                        <label className={labelClasses}>Órgãos a serem acionados</label>
                        <input type="text" value={formData.orgaosAcionados} onChange={e => handleChange('orgaosAcionados', e.target.value)} className={inputClasses} placeholder="Ex: Obras, Assistência Social..." />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className={labelClasses}>Assinatura do Agente</label>
                        <div
                            onClick={() => setShowSignaturePad(true)}
                            className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#2a5299] transition-colors"
                        >
                            {formData.assinaturaAgente ? (
                                <img src={formData.assinaturaAgente} className="h-full w-auto object-contain" />
                            ) : (
                                <div className="text-center">
                                    <Edit2 size={24} className="mx-auto text-slate-300 group-hover:text-[#2a5299]" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Tocar para Assinar</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Submit button */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full p-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${saving ? 'bg-slate-400' : 'bg-[#2a5299] hover:bg-[#1e3c72]'}`}
                    >
                        {saving ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><Save size={24} /> Salvar Interdição</>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <button type="button" onClick={() => generatePDF(formData, 'interdicao')} className="flex justify-center items-center gap-2 p-4 border border-gray-200 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                            <Share size={20} /> Exportar PDF
                        </button>
                        {initialData && (
                            <button type="button" onClick={() => alert("Excluir")} className="flex justify-center items-center gap-2 p-4 border border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100/50 transition-colors">
                                <Trash2 size={20} /> Excluir
                            </button>
                        )}
                    </div>
                </div>

            </form>

            {/* Signature Modal */}
            {showSignaturePad && (
                <SignaturePadComp
                    title="Assinatura do Agente"
                    onCancel={() => setShowSignaturePad(false)}
                    onSave={(dataUrl) => {
                        setFormData(prev => ({ ...prev, assinaturaAgente: dataUrl }))
                        setShowSignaturePad(false)
                    }}
                />
            )}
        </div>
    )
}

export default InterdicaoForm
