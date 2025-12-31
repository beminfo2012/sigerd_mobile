import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, MapPin, Save, AlertOctagon, User, ShieldAlert, Plus, X, Upload, FileText } from 'lucide-react'
import { saveInterdicaoOffline } from '../../services/db'

const Interdicao = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [gpsLoading, setGpsLoading] = useState(false)

    const [formData, setFormData] = useState({
        interdicaoId: `INT-${Date.now()}`,
        dataHora: new Date().toISOString().slice(0, 16),
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
        orgaosAcionados: ''
    })

    const handleGPS = () => {
        setGpsLoading(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                setFormData(prev => ({
                    ...prev,
                    latitude,
                    longitude,
                    coordenadas: `${latitude}, ${longitude}`
                }))
                setGpsLoading(false)
            },
            (err) => {
                alert('Erro ao capturar GPS: ' + err.message)
                setGpsLoading(false)
            },
            { enableHighAccuracy: true }
        )
    }

    const toggleRisco = (tipo) => {
        setFormData(prev => ({
            ...prev,
            riscoTipo: prev.riscoTipo.includes(tipo)
                ? prev.riscoTipo.filter(t => t !== tipo)
                : [...prev.riscoTipo, tipo]
        }))
    }

    const handlePhoto = (e) => {
        const files = Array.from(e.target.files)
        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    fotos: [...prev.fotos, { id: Date.now() + Math.random(), data: reader.result, legenda: '' }]
                }))
            }
            reader.readAsDataURL(file)
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await saveInterdicaoOffline(formData)
            alert('Interdição salva com sucesso!')
            navigate('/')
        } catch (error) {
            alert('Erro ao salvar interdição: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <div className="bg-white p-5 sticky top-0 z-10 border-b border-slate-100 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-black tracking-tight">Nova Interdição</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formData.interdicaoId}</p>
                </div>
                <div className="ml-auto bg-amber-50 text-amber-600 p-2 rounded-xl">
                    <AlertOctagon size={20} strokeWidth={2.5} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">

                {/* 1. Identificação */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <FileText size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800">Identificação</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Número Registro</label>
                            <input type="text" readOnly value={formData.interdicaoId} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data e Hora</label>
                            <input type="datetime-local" value={formData.dataHora} onChange={e => setFormData({ ...formData, dataHora: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Município</label>
                            <input type="text" value={formData.municipio} readOnly className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-slate-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Bairro / Localidade</label>
                            <input type="text" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" required />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Endereço Completo</label>
                            <textarea rows="2" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" required />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Interdição (Alvo)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Imóvel', 'Via pública', 'Área pública', 'Outro'].map(t => (
                                <button key={t} type="button" onClick={() => setFormData({ ...formData, tipoAlvo: t })} className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.tipoAlvo === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {formData.tipoAlvo === 'Outro' && (
                            <input type="text" placeholder="Especifique..." value={formData.tipoAlvoEspecificar} onChange={e => setFormData({ ...formData, tipoAlvoEspecificar: e.target.value })} className="mt-2 w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300" />
                        )}
                    </div>
                </section>

                {/* 2. Geolocalização */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                <MapPin size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Geolocalização</h2>
                        </div>
                        <button type="button" onClick={handleGPS} disabled={gpsLoading} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gpsLoading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-lg active:scale-95'}`}>
                            {gpsLoading ? 'Capturando...' : 'GPS Atual'}
                        </button>
                    </div>

                    <input type="text" value={formData.coordenadas} readOnly placeholder="Latitude, Longitude" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-center" required />
                    <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-tight">Necessário para mapeamento de risco</p>
                </section>

                {/* 3. Identificação do Responsável */}
                {formData.tipoAlvo !== 'Via pública' && (
                    <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                <User size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Responsável / Proprietário</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nome Completo</label>
                                <input type="text" value={formData.responsavelNome} onChange={e => setFormData({ ...formData, responsavelNome: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">CPF/CNPJ</label>
                                    <input type="text" value={formData.responsavelCpf} onChange={e => setFormData({ ...formData, responsavelCpf: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Telefone</label>
                                    <input type="tel" value={formData.responsavelTelefone} onChange={e => setFormData({ ...formData, responsavelTelefone: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">E-mail</label>
                                <input type="email" value={formData.responsavelEmail} onChange={e => setFormData({ ...formData, responsavelEmail: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                            </div>
                        </div>
                    </section>
                )}

                {/* 4. Caracterização do Risco */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                            <ShieldAlert size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800">Caracterização do Risco</h2>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Ocorrência (Múltiplo)</label>
                        <div className="flex flex-wrap gap-2">
                            {['Risco estrutural', 'Deslizamento', 'Alagamento', 'Erosão', 'Incêndio', 'Colapso parcial', 'Colapso total', 'Outro'].map(r => (
                                <button key={r} type="button" onClick={() => toggleRisco(r)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.riscoTipo.includes(r) ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Grau de Risco</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['Baixo', 'Médio', 'Alto', 'Imediato'].map(g => (
                                <button key={g} type="button" onClick={() => setFormData({ ...formData, riscoGrau: g })} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.riscoGrau === g ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
                                    {g}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Situação Observada</label>
                        <textarea rows="3" value={formData.situacaoObservada} onChange={e => setFormData({ ...formData, situacaoObservada: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" placeholder="Descreva os danos e evidências..." />
                    </div>
                </section>

                {/* 5. Medida Administrativa */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                            <AlertOctagon size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800">Medida Administrativa</h2>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de Interdição</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Total', 'Parcial', 'Preventiva'].map(m => (
                                <button key={m} type="button" onClick={() => setFormData({ ...formData, medidaTipo: m })} className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.medidaTipo === m ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-500'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Prazo</label>
                            <select value={formData.medidaPrazo} onChange={e => setFormData({ ...formData, medidaPrazo: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold">
                                <option>Indeterminado</option>
                                <option>Determinado</option>
                            </select>
                        </div>
                        {formData.medidaPrazo === 'Determinado' && (
                            <div className="animate-in slide-in-from-right-2 duration-300">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Data Final</label>
                                <input type="date" value={formData.medidaPrazoData} onChange={e => setFormData({ ...formData, medidaPrazoData: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div>
                            <div className="text-xs font-black text-red-600 uppercase tracking-widest">Evacuação</div>
                            <div className="text-[10px] font-bold text-red-400">Necessário desocupação imediata?</div>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl shadow-inner border border-red-100">
                            <button type="button" onClick={() => setFormData({ ...formData, evacuacaoNecessaria: true })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.evacuacaoNecessaria ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>SIM</button>
                            <button type="button" onClick={() => setFormData({ ...formData, evacuacaoNecessaria: false })} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!formData.evacuacaoNecessaria ? 'bg-slate-100 text-slate-600' : 'text-slate-400'}`}>NÃO</button>
                        </div>
                    </div>
                </section>

                {/* 6. Registro Fotográfico */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <Camera size={18} />
                            </div>
                            <h2 className="font-bold text-slate-800">Registro Fotográfico</h2>
                        </div>
                        <label className="cursor-pointer bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                            <Plus size={24} />
                            <input type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
                        </label>
                    </div>

                    {formData.fotos.length > 0 ? (
                        <div className="space-y-4">
                            {formData.fotos.map((foto, idx) => (
                                <div key={foto.id} className="relative bg-slate-50 p-3 rounded-2xl flex gap-4 border border-slate-100 animate-in zoom-in-95 duration-300">
                                    <img src={foto.data} className="w-20 h-20 object-cover rounded-xl shadow-sm" alt="Preview" />
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Legenda da Foto</label>
                                        <input type="text" placeholder="Ex: Rachadura na sala..." className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold"
                                            value={foto.legenda}
                                            onChange={e => {
                                                const newFotos = [...formData.fotos]
                                                newFotos[idx].legenda = e.target.value
                                                setFormData({ ...formData, fotos: newFotos })
                                            }}
                                        />
                                    </div>
                                    <button type="button" onClick={() => setFormData({ ...formData, fotos: formData.fotos.filter(f => f.id !== foto.id) })} className="absolute -top-2 -right-2 bg-white text-red-500 w-6 h-6 rounded-full shadow-md flex items-center justify-center border border-red-50">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-100 rounded-[24px] p-8 flex flex-col items-center justify-center gap-2 text-slate-300">
                            <Upload size={32} />
                            <span className="text-xs font-bold uppercase tracking-widest">Toque para adicionar fotos</span>
                        </div>
                    )}
                </section>

                {/* 7. Observações Técnicas */}
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <FileText size={18} />
                        </div>
                        <h2 className="font-bold text-slate-800">Relatório e Recomendações</h2>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Relatório Técnico</label>
                        <textarea rows="4" value={formData.relatorioTecnico} onChange={e => setFormData({ ...formData, relatorioTecnico: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" placeholder="Detalhes técnicos da vistoria..." />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Recomendações Imediatas</label>
                        <textarea rows="2" value={formData.recomendacoes} onChange={e => setFormData({ ...formData, recomendacoes: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" placeholder="O que o morador/município deve fazer..." />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Órgãos a serem acionados</label>
                        <input type="text" value={formData.orgaosAcionados} onChange={e => setFormData({ ...formData, orgaosAcionados: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" placeholder="Ex: Obras, Assistência Social..." />
                    </div>
                </section>

                {/* Action Button */}
                <button type="submit" disabled={loading} className={`w-full p-5 rounded-[24px] text-white font-black text-sm uppercase tracking-[4px] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-200'}`}>
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <><Save size={20} /> Salvar Interdição</>
                    )}
                </button>

            </form>
        </div>
    )
}

export default Interdicao
