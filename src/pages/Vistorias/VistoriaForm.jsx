import React, { useState, useEffect, useContext } from 'react'
import { Save, Camera, FileText, MapPin, Trash2, Share, File as FileIcon, ArrowLeft, Crosshair, AlertTriangle, Users, ClipboardCheck, Send } from 'lucide-react'
import { saveVistoriaOffline } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'
import { generatePDF } from '../../utils/pdfGenerator'

const RISK_DATA = {
    'Geológico / Geotécnico': [
        'Deslizamento de Terra', 'Movimento de Massa', 'Erosão do Solo', 'Ravina', 'Voçoroca',
        'Queda de Blocos Rochosos', 'Recalque do Solo', 'Subsidência', 'Instabilidade de Encosta',
        'Soterramento', 'Colapso de Talude', 'Trinca no Terreno', 'Afloramento de Água'
    ],
    'Hidrológico': [
        'Alagamento', 'Inundação', 'Enxurrada', 'Transbordamento de Rio', 'Transbordamento de Córrego',
        'Assoreamento', 'Obstrução de Drenagem', 'Rompimento de Galeria Pluvial', 'Erosão Marginal',
        'Retorno de Esgoto', 'Enchente Repentina', 'Rompimento de Barragem / Açude', 'Elevação do Lençol Frático'
    ],
    'Estrutural': [
        'Risco de Desabamento', 'Colapso Parcial', 'Colapso Total', 'Fissuras Estruturais',
        'Trincas', 'Rachaduras', 'Muro de Arrimo com Risco', 'Laje com Risco', 'Marquise com Risco',
        'Edificação Abandonada', 'Estrutura Pós-Incêndio', 'Estrutura Comprometida por Infiltração',
        'Fundação Aparente', 'Pilar / Viga Comprometidos'
    ],
    'Ambiental': [
        'Queda de Árvore', 'Árvore com Risco de Queda', 'Galhos sobre Via ou Rede Elétrica',
        'Incêndio Florestal', 'Queimada Irregular', 'Supressão Vegetal Irregular', 'Contaminação do Solo',
        'Contaminação da Água', 'Assoreamento Ambiental', 'Erosão Ambiental', 'Deslizamento em Área Verde', 'Fauna em Risco'
    ],
    'Tecnológico': [
        'Vazamento de Gás', 'Vazamento de Produto Químico', 'Derramamento de Combustível',
        'Derramamento de Óleo', 'Explosão', 'Incêndio Industrial', 'Risco Elétrico', 'Poste com Risco de Queda',
        'Fiação Exposta', 'Acidente com Carga Perigosa', 'Colapso de Infraestrutura Crítica',
        'Falha em Equipamento Industrial', 'Contaminação Química'
    ],
    'Climático / Meteorológico': [
        'Chuvas Intensas', 'Tempestade Severa', 'Vendaval', 'Granizo', 'Geada', 'Calor Extremo',
        'Frio Intenso', 'Estiagem', 'Seca', 'Descarga Elétrica (Raio)', 'Tornado / Microexplosão', 'Neblina Intensa'
    ],
    'Infraestrutura Urbana': [
        'Obstrução de Via Pública', 'Queda de Barreira', 'Colapso de Ponte', 'Risco em Ponte',
        'Risco em Passarela', 'Afundamento de Via', 'Cratera em Via', 'Rompimento de Bueiro',
        'Rompimento de Galeria', 'Dano em Pavimentação', 'Risco em Escadaria', 'Risco em Contenção Urbana'
    ],
    'Sanitário': ['Esgoto a céu aberto', 'Infestação de vetores', 'Contaminação biológica'],
    'Outros': ['Outro Risco (descrever)', 'Situação Atípica', 'Risco Não Classificado']
}

const VistoriaForm = ({ onBack, initialData = null }) => {
    const userProfile = useContext(UserContext)

    const [formData, setFormData] = useState({
        vistoriaId: '',
        processo: '',
        agente: '',
        matricula: '',
        solicitante: '',
        cpf: '',
        telefone: '',
        enderecoSolicitante: '',
        endereco: '',
        bairro: '',
        latitude: '',
        longitude: '',
        coordenadas: '',
        dataHora: new Date().toISOString().slice(0, 16),

        // 5. Detalhes (Evolução)
        categoriaRisco: '',
        subtiposRisco: [],
        nivelRisco: 'Baixo', // Baixo, Médio, Alto, Iminente
        situacaoObservada: 'Estabilizado', // Ativo, Em evolução, Estabilizado, Recorrente

        // 5.5 População Exposta
        populacaoEstimada: '',
        gruposVulneraveis: [], // Crianças, Idosos, PCD

        // 5.6 Observações Técnicas
        observacoes: '',
        medidasTomadas: [], // Monitoramento, Isolamento, Interdição Parcial, Interdição Total, etc

        // 8. Encaminhamentos
        encaminhamentos: [],

        fotos: [],
        documentos: []
    })

    const [saving, setSaving] = useState(false)
    const [gettingLoc, setGettingLoc] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Ensure arrays are handled
                subtiposRisco: initialData.subtipos_risco || initialData.subtiposRisco || [],
                gruposVulneraveis: initialData.grupos_vulneraveis || initialData.gruposVulneraveis || [],
                medidasTomadas: initialData.medidas_tomadas || initialData.medidasTomadas || [],
                encaminhamentos: initialData.encaminhamentos || []
            })
        } else {
            getNextId()
        }
    }, [initialData])

    const getNextId = async () => {
        const currentYear = new Date().getFullYear()
        const { data } = await supabase.from('vistorias').select('vistoria_id').filter('vistoria_id', 'like', `%/${currentYear}`)
        let nextNum = 1
        if (data && data.length > 0) {
            const ids = data.map(v => parseInt((v.vistoria_id || '').split('/')[0])).filter(n => !isNaN(n)).sort((a, b) => a - b)
            for (let i = 0; i < ids.length; i++) {
                if (ids[i] === nextNum) nextNum++
                else if (ids[i] > nextNum) break
            }
        }
        setFormData(prev => ({
            ...prev,
            vistoriaId: `${nextNum.toString().padStart(2, '0')}/${currentYear}`,
            agente: userProfile?.full_name || '',
            matricula: userProfile?.matricula || ''
        }))
    }

    const getLocation = () => {
        if (!navigator.geolocation) return alert("GPS não suportado.")
        setGettingLoc(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude.toFixed(6),
                    longitude: pos.coords.longitude.toFixed(6),
                    coordenadas: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
                }))
                setGettingLoc(false)
            },
            () => { setGettingLoc(false); alert("Erro ao obter GPS."); },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const toggleArrayItem = (field, item) => {
        setFormData(prev => {
            const current = prev[field] || []
            const exists = current.includes(item)
            return {
                ...prev,
                [field]: exists ? current.filter(i => i !== item) : [...current, item]
            }
        })
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

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== id) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation for Risco Iminente
        if (formData.nivelRisco === 'Iminente' && formData.fotos.length === 0) {
            alert("⚠️ Para Risco Iminente, é obrigatório anexar no mínimo 1 foto.")
            return
        }
        if (formData.nivelRisco === 'Iminente' && !formData.observacoes.trim()) {
            alert("⚠️ Para Risco Iminente, descreva as Observações Técnicas com as recomendações.")
            return
        }

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

    const inputClasses = "w-full bg-slate-50 p-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#2a5299] focus:ring-2 focus:ring-[#2a5299]/20 transition-all text-gray-700 font-medium"
    const labelClasses = "text-sm text-[#2a5299] font-bold block mb-1.5 uppercase tracking-wide opacity-90"
    const sectionClasses = "bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5"

    return (
        <div className="bg-slate-50 min-h-screen pb-32 font-sans">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">Nova Vistoria</h1>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-xl mx-auto">
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 1. Identificação
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Nº Vistoria</label>
                            <div className="bg-blue-50/50 text-[#2a5299] font-black text-lg p-3.5 rounded-xl border border-blue-100/50 shadow-inner">{formData.vistoriaId}</div>
                        </div>
                        <div>
                            <label className={labelClasses}>Nº Processo</label>
                            <input type="text" className={inputClasses} value={formData.processo} onChange={e => setFormData({ ...formData, processo: e.target.value })} />
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 2. Responsável Técnico
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Agente</label>
                            <input type="text" className={inputClasses} value={formData.agente} disabled />
                        </div>
                        <div>
                            <label className={labelClasses}>Matrícula</label>
                            <input type="text" className={inputClasses} value={formData.matricula} disabled />
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 3. Solicitante
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Nome Completo</label>
                            <input type="text" className={inputClasses} value={formData.solicitante} onChange={e => setFormData({ ...formData, solicitante: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClasses}>Endereço Solicitante</label>
                            <input type="text" className={inputClasses} value={formData.enderecoSolicitante} onChange={e => setFormData({ ...formData, enderecoSolicitante: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>CPF</label>
                                <input type="text" className={inputClasses} value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Telefone</label>
                                <input type="text" className={inputClasses} value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 4. Local da Ocorrência
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Endereço da Ocorrência</label>
                            <div className="relative">
                                <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                                <input type="text" className={`${inputClasses} pl-12`} value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Bairro</label>
                                <input type="text" className={inputClasses} value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Coordenadas</label>
                                <div className="flex gap-2">
                                    <input type="text" className={`${inputClasses} bg-slate-100 text-gray-500`} value={formData.coordenadas} readOnly />
                                    <button type="button" onClick={getLocation} disabled={gettingLoc} className="p-3 bg-[#2a5299] text-white rounded-xl shadow-lg active:scale-95 transition-all">
                                        <Crosshair size={20} className={gettingLoc ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 5. Risco e Detalhes
                    </h2>

                    <div className="space-y-5">
                        {/* 5.1 Categoria */}
                        <div>
                            <label className={labelClasses}>Categoria de Risco</label>
                            <select className={inputClasses} value={formData.categoriaRisco} onChange={e => setFormData({ ...formData, categoriaRisco: e.target.value, subtiposRisco: [] })}>
                                <option value="">Selecione a Categoria</option>
                                {Object.keys(RISK_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        {/* 5.2 Subtipos Dinâmicos */}
                        {formData.categoriaRisco && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className={labelClasses}>Subtipos de Risco</label>
                                <div className="grid grid-cols-1 gap-2 mt-3">
                                    {RISK_DATA[formData.categoriaRisco].map(sub => (
                                        <button key={sub} type="button" onClick={() => toggleArrayItem('subtiposRisco', sub)} className={`p-3 rounded-xl text-left font-semibold border transition-all flex items-center justify-between ${formData.subtiposRisco.includes(sub) ? 'bg-[#2a5299] border-[#2a5299] text-white' : 'bg-white text-slate-600 border-slate-100'}`}>
                                            {sub}
                                            {formData.subtiposRisco.includes(sub) && <ClipboardCheck size={18} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5.3 Nível de Risco */}
                        <div>
                            <label className={labelClasses}>Nível de Risco</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                    { id: 'Baixo', label: '🟢 Baixo', color: 'bg-green-100 text-green-700 border-green-200' },
                                    { id: 'Médio', label: '🟡 Médio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                    { id: 'Alto', label: '🟠 Alto', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                    { id: 'Iminente', label: '🔴 Iminente', color: 'bg-red-100 text-red-700 border-red-200' }
                                ].map(nivel => (
                                    <button key={nivel.id} type="button" onClick={() => setFormData({ ...formData, nivelRisco: nivel.id })} className={`p-4 rounded-xl font-bold border-2 transition-all ${formData.nivelRisco === nivel.id ? nivel.color : 'bg-white text-slate-400 border-slate-50'}`}>
                                        {nivel.label}
                                    </button>
                                ))}
                            </div>
                            {formData.nivelRisco === 'Iminente' && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start gap-2 animate-pulse">
                                    <AlertTriangle size={20} className="shrink-0" />
                                    <span className="text-sm font-bold">ATENÇÃO: Risco Iminente exige fotos e recomendações técnicas. Sugestão de Interdição.</span>
                                </div>
                            )}
                        </div>

                        {/* 5.4 Situação */}
                        <div>
                            <label className={labelClasses}>Situação Observada</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Ativo', 'Em evolução', 'Estabilizado', 'Recorrente'].map(s => (
                                    <button key={s} type="button" onClick={() => setFormData({ ...formData, situacaoObservada: s })} className={`p-3 rounded-xl text-sm font-bold border transition-all ${formData.situacaoObservada === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border-slate-100'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 5.5 População */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <h3 className="flex items-center gap-2 font-bold text-slate-700 mb-4"><Users size={20} /> População Exposta</h3>
                            <div className="space-y-4">
                                <input type="number" placeholder="Nº estimado de pessoas" className={inputClasses} value={formData.populacaoEstimada} onChange={e => setFormData({ ...formData, populacaoEstimada: e.target.value })} />
                                <div className="grid grid-cols-3 gap-2">
                                    {['Crianças', 'Idosos', 'PCD'].map(g => (
                                        <button key={g} type="button" onClick={() => toggleArrayItem('gruposVulneraveis', g)} className={`p-2.5 rounded-lg text-xs font-bold border transition-all ${formData.gruposVulneraveis.includes(g) ? 'bg-[#2a5299] border-[#2a5299] text-white' : 'bg-white text-slate-400'}`}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5.6 Observações Técnicas */}
                        <div>
                            <label className={labelClasses}>Observações Técnicas</label>
                            <textarea rows="4" className={inputClasses} placeholder="Descrever condições observadas, indícios técnicos e fatores agravantes." value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} />
                        </div>

                        {/* Checklist Medidas */}
                        <div>
                            <label className={labelClasses}>Medidas e Recomendações</label>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {['Monitoramento', 'Isolamento da área', 'Interdição Parcial', 'Interdição Total', 'Acionamento de outro órgão', 'Orientação ao morador'].map(m => (
                                    <button key={m} type="button" onClick={() => toggleArrayItem('medidasTomadas', m)} className={`p-3 rounded-xl text-left text-sm font-semibold border transition-all flex items-center justify-between ${formData.medidasTomadas.includes(m) ? 'bg-slate-100 border-[#2a5299] text-[#2a5299]' : 'bg-white text-slate-500 border-slate-100'}`}>
                                        {m}
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${formData.medidasTomadas.includes(m) ? 'bg-[#2a5299] border-[#2a5299]' : 'border-slate-300'}`}>
                                            {formData.medidasTomadas.includes(m) && <ClipboardCheck size={14} className="text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 8. Encaminhamentos */}
                        <div>
                            <label className={labelClasses}>Encaminhamentos</label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {['Obras', 'Assistência Social', 'Meio Ambiente', 'Outros'].map(enc => (
                                    <button key={enc} type="button" onClick={() => toggleArrayItem('encaminhamentos', enc)} className={`p-3 rounded-xl text-sm font-bold border transition-all ${formData.encaminhamentos.includes(enc) ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>
                                        {enc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg">Registro Fotográfico</h2>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{formData.fotos.length} anexos</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <FileInput onFileSelect={handlePhotoSelect} label="+" />
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden shadow-md group">
                                <img src={foto.data} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removePhoto(foto.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="pt-6 space-y-4">
                    <button type="submit" disabled={saving} className={`w-full p-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-3 ${saving ? 'bg-slate-400' : 'bg-[#2a5299] text-white hover:bg-[#1e3c72]'}`}>
                        <Save size={24} /> {saving ? 'Salvando...' : 'Salvar Vistoria'}
                    </button>
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => generatePDF(formData, 'vistoria')} className="flex justify-center items-center gap-2 p-4 border border-gray-200 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50 shadow-sm"><Share size={20} /> Relatório PDF</button>
                        <button type="button" onClick={() => initialData ? alert("Use lista para excluir") : onBack()} className="flex justify-center items-center gap-2 p-4 border border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100/50"><Trash2 size={20} /> Cancelar</button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default VistoriaForm
