import React, { useState, useEffect } from 'react'
import { ArrowLeft, Save, MapPin, Calendar, User, FileText, Camera, Trash2, Maximize2, X, ChevronLeft, ChevronRight, Download, Sparkles, CheckCircle, Printer, Edit2 } from 'lucide-react'
import SignaturePadComp from '../../components/SignaturePad'
import { UserContext } from '../../App'
import { useContext } from 'react'
import FileInput from '../../components/FileInput'
import { saveDesinterdicaoOffline, updateInterdicaoStatus } from '../../services/db'
import { generatePDF } from '../../utils/pdfGenerator'
import { toast } from '../../components/ToastNotification'

const DesinterdicaoForm = ({ interdicao, initialData, onBack }) => {
    const userProfile = useContext(UserContext)
    const [saving, setSaving] = useState(false)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)
    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [lastGeneratedId, setLastGeneratedId] = useState(null)

    const [formData, setFormData] = useState({
        // Only store local numeric ID for edits; UUIDs go into supabase_id
        id: (initialData?.id && typeof initialData.id === 'number') ? initialData.id : undefined,
        supabase_id: initialData?.supabase_id || (typeof initialData?.id === 'string' && initialData?.id?.length > 20 ? initialData.id : undefined),
        interdicaoId: initialData?.interdicao_id || initialData?.interdicaoId || interdicao?.interdicao_id || interdicao?.interdicaoId || interdicao?.id,
        dataNovaVistoria: initialData?.data_nova_vistoria || initialData?.dataNovaVistoria || new Date().toISOString().split('T')[0],
        agente: initialData?.agente || userProfile?.name || '',
        matricula: initialData?.matricula || userProfile?.registration || '',
        responsavelNome: initialData?.responsavel_nome || initialData?.responsavelNome || interdicao?.responsavel_nome || interdicao?.responsavelNome || '',
        endereco: initialData?.endereco || interdicao?.endereco || '',
        bairro: initialData?.bairro || interdicao?.bairro || '',
        medidasCorretivas: initialData?.medidas_corretivas_executadas || initialData?.medidasCorretivas || '',
        situacaoVerificada: initialData?.situacao_verificada || initialData?.situacaoVerificada || '',
        observacoes: initialData?.observacoes_tecnicas || initialData?.observacoes || '',
        fotos: initialData?.fotos || [],
        documentos: initialData?.documentos || [],
        tipoDesinterdicao: initialData?.tipo_desinterdicao || initialData?.tipoDesinterdicao || 'Total',
        assinaturaAgente: initialData?.assinatura_agente || initialData?.assinaturaAgente || null,
        cargo: initialData?.cargo || userProfile?.cargo || localStorage.getItem('lastAgentCargo') || ''
    })

    // Auto-populate user data when profile loads ONLY for new records
    useEffect(() => {
        if (userProfile && !initialData) {
            setFormData(prev => ({
                ...prev,
                agente: userProfile.full_name || userProfile.name || '',
                matricula: userProfile.registration || userProfile.matricula || '',
                cargo: userProfile.cargo || ''
            }));
        }
    }, [userProfile, initialData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSignatureSave = (signatureData) => {
        handleChange('assinaturaAgente', signatureData)
        setShowSignaturePad(false)
    }

    const handlePhotoSelect = (files) => {
        const newPhotos = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            data: file,
            legenda: ''
        }))
        
        newPhotos.forEach(p => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    fotos: [...prev.fotos, { ...p, data: reader.result }]
                }))
            }
            reader.readAsDataURL(p.data)
        })
    }

    const handleDocumentSelect = (files) => {
        const newDocs = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        }))

        newDocs.forEach(doc => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    documentos: [...prev.documentos, { ...doc, data: reader.result }]
                }))
            }
            reader.readAsDataURL(doc.file)
        })
    }

    const removePhoto = (id) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.filter(f => f.id !== id)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.medidasCorretivas || !formData.situacaoVerificada) {
            toast.error('Campos Obrigatórios', 'Por favor, preencha as medidas corretivas e a situação verificada.')
            return
        }

        setSaving(true)
        try {
            // 1. Save Desinterdicao record
            const desintId = await saveDesinterdicaoOffline({
                ...formData,
                interdicao_id: formData.interdicaoId,
                status_anterior: interdicao.status || 'Interditado',
                tipo_desinterdicao: formData.tipoDesinterdicao,
                supabase_id: initialData?.supabase_id || initialData?.id // Keep the UUID if editing
            })

            // 2. Update Interdicao status
            if (updateInterdicaoStatus) {
                const newStatus = formData.tipoDesinterdicao === 'Total' ? 'Desinterditado' : 'Parcialmente Desinterditado'
                await updateInterdicaoStatus(interdicao.id, newStatus)
            }

            // 3. Generate PDF (Silent)
            await generatePDF({
                ...formData,
                agente: formData.agente,
                matricula: formData.matricula,
                cargo: formData.cargo,
                assinaturaAgente: formData.assinaturaAgente || userProfile?.signature,
                tipo_desinterdicao: formData.tipo_desinterdicao
            }, 'desinterdicao', { autoOpen: false })

            setLastGeneratedId(desintId)
            setShowSuccessModal(true)
            toast.success('Sucesso', 'Desinterdição registrada com sucesso!')
        } catch (error) {
            console.error('Error saving desinterdicao:', error)
            toast.error('Erro ao Salvar', 'Não foi possível registrar a desinterdição.')
        } finally {
            setSaving(false)
        }
    }

    const sectionClasses = "bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6"
    const labelClasses = "text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mb-2 block ml-1"
    const inputClasses = "w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[4px]">Solicitar Desinterdição</h1>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Ref. Interdição #{formData.interdicaoId}</span>
                    </div>
                    <div className="w-10"></div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
                {/* 1. SEÇÃO: Identificação */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">1. Identificação</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Nº do Auto de Interdição</label>
                            <input type="text" value={formData.interdicaoId} readOnly className={`${inputClasses} opacity-60 bg-slate-100 cursor-not-allowed`} />
                        </div>
                        <div>
                            <label className={labelClasses}>Data da Nova Vistoria</label>
                            <input type="date" value={formData.dataNovaVistoria} onChange={e => handleChange('dataNovaVistoria', e.target.value)} className={inputClasses} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Agente</label>
                            <input type="text" value={formData.agente} readOnly className={`${inputClasses} opacity-60 bg-slate-100 cursor-not-allowed`} />
                        </div>
                        <div>
                            <label className={labelClasses}>Matrícula</label>
                            <input type="text" value={formData.matricula} readOnly className={`${inputClasses} opacity-60 bg-slate-100 cursor-not-allowed`} />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Cargo do Agente</label>
                            <input type="text" value={formData.cargo} onChange={e => handleChange('cargo', e.target.value)} className={inputClasses} placeholder="Ex: Agente de Defesa Civil" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={labelClasses} style={{ marginBottom: 0 }}>Assinatura do Agente</label>
                            <div className="flex gap-2">
                                {userProfile?.signature && (
                                    <button
                                        type="button"
                                        onClick={() => handleChange('assinaturaAgente', userProfile.signature)}
                                        className="text-[10px] font-black text-white uppercase tracking-wider bg-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <CheckCircle size={12} />
                                        Usar Assinatura Salva
                                    </button>
                                )}
                                {formData.assinaturaAgente && (
                                    <button
                                        type="button"
                                        onClick={() => handleChange('assinaturaAgente', null)}
                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800/30"
                                    >
                                        <Trash2 size={12} /> Limpar
                                    </button>
                                )}
                            </div>
                        </div>
                        <div
                            onClick={() => setShowSignaturePad(true)}
                            className="h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors"
                        >
                            {formData.assinaturaAgente ? (
                                <img src={formData.assinaturaAgente} className="h-full w-auto object-contain p-2" />
                            ) : (
                                <div className="text-center">
                                    <Edit2 size={24} className="mx-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Coletar Assinatura</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. SEÇÃO: Localização */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-green-500 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">2. Imóvel e Responsável</h2>
                    </div>

                    <div>
                        <label className={labelClasses}>Proprietário / Responsável</label>
                        <input type="text" value={formData.responsavelNome} readOnly className={`${inputClasses} opacity-60 bg-slate-100 cursor-not-allowed`} />
                    </div>

                    <div>
                        <label className={labelClasses}>Endereço Completo</label>
                        <textarea rows="2" value={`${formData.endereco} - ${formData.bairro}`} readOnly className={`${inputClasses} opacity-60 bg-slate-100 cursor-not-allowed`} />
                    </div>
                </section>

                {/* 3. SEÇÃO: Avaliação */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">3. Avaliação Técnica</h2>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className={labelClasses}>Tipo de Desinterdição</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => handleChange('tipoDesinterdicao', 'Total')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.tipoDesinterdicao === 'Total' 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'}`}
                            >
                                <Sparkles size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Total</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange('tipoDesinterdicao', 'Parcial')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.tipoDesinterdicao === 'Parcial' 
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' 
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'}`}
                            >
                                <FileText size={20} />
                                <span className="text-xs font-black uppercase tracking-widest">Parcial</span>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-3 px-2">
                            {formData.tipoDesinterdicao === 'Total' 
                                ? '• Liberação total do imóvel. O processo será encerrado.' 
                                : '• Liberação parcial de áreas específicas. A interdição continua ativa para o restante.'}
                        </p>
                    </div>

                    <div>
                        <label className={labelClasses}>Medidas Corretivas Executadas</label>
                        <textarea 
                            rows="3" 
                            value={formData.medidasCorretivas} 
                            onChange={e => handleChange('medidasCorretivas', e.target.value)} 
                            className={inputClasses} 
                            placeholder="Descreva as obras, manutenções ou medidas tomadas pelo proprietário..." 
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Situação Verificada</label>
                        <textarea 
                            rows="3" 
                            value={formData.situacaoVerificada} 
                            onChange={e => handleChange('situacaoVerificada', e.target.value)} 
                            className={inputClasses} 
                            placeholder="Descreva como o imóvel se encontra no momento..." 
                        />
                    </div>

                    <div>
                        <label className={labelClasses}>Observações Técnicas Complementares</label>
                        <textarea 
                            rows="2" 
                            value={formData.observacoes} 
                            onChange={e => handleChange('observacoes', e.target.value)} 
                            className={inputClasses} 
                            placeholder="Informações adicionais se necessário..." 
                        />
                    </div>
                </section>

                {/* 4. SEÇÃO: Registro Fotográfico */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">4. Registro Fotográfico</h2>
                        </div>
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full font-black uppercase text-[10px]">{formData.fotos.length} fotos</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <FileInput onFileSelect={handlePhotoSelect} className="h-32" />
                        {formData.fotos.map((foto, idx) => (
                            <div key={foto.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-sm bg-slate-50 dark:bg-slate-900">
                                <img
                                    src={foto.data}
                                    className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                    onClick={() => setSelectedPhotoIndex(idx)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(foto.id)}
                                    className="absolute top-2 right-2 z-10 bg-red-600/80 backdrop-blur-md text-white p-1.5 rounded-xl shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-2 z-10">
                                    <input
                                        className="w-full bg-transparent border-none text-[10px] text-white placeholder-white/70 focus:ring-0 p-0 font-bold"
                                        placeholder="Legenda..."
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

                {/* 5. SEÇÃO: Documentos */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">5. Documentos Complementares</h2>
                        </div>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">{formData.documentos.length} arquivos</span>
                    </div>

                    <div className="space-y-4">
                        <FileInput 
                            onFileSelect={handleDocumentSelect} 
                            multiple={true}
                            acceptAll={true}
                            compact={true}
                            label="Anexar arquivos (PDF, DOC, etc)"
                        />
                        
                        {formData.documentos.length > 0 && (
                            <div className="grid grid-cols-1 gap-3">
                                {formData.documentos.map((doc, idx) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all shadow-sm">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate pr-4">{doc.name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{(doc.size / 1024).toFixed(1)} KB</span>
                                                    <span className="text-[9px] text-slate-300">•</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase">{doc.name.split('.').pop()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    documentos: prev.documentos.filter(d => d.id !== doc.id)
                                                }))
                                            }}
                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className={`w-full p-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${saving ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {saving ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><Save size={24} /> Finalizar Desinterdição</>
                        )}
                    </button>
                    
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full p-4 rounded-xl text-slate-500 font-bold text-sm mt-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar e Voltar
                    </button>
                </div>
            </form>

            {/* Lightbox Implementation simplified here */}
            {selectedPhotoIndex !== null && (
                <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedPhotoIndex(null)}>
                    <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full"><X/></button>
                    <img src={formData.fotos[selectedPhotoIndex].data} className="max-w-full max-h-full object-contain" />
                </div>
            )}

            {/* Signature Pad */}
            {showSignaturePad && (
                <SignaturePadComp
                    onSave={handleSignatureSave}
                    onClose={() => setShowSignaturePad(false)}
                />
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                            <CheckCircle size={48} />
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-2 uppercase tracking-tight leading-tight">Desinterdição Registrada!</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 font-bold text-sm px-4">O registro foi salvo com sucesso. Como deseja prosseguir?</p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    window.open(`/desinterdicao/imprimir/${lastGeneratedId}`, '_blank');
                                }}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98]"
                            >
                                <Printer size={18} /> Visualizar e Imprimir PDF
                            </button>
                            
                            <button
                                onClick={onBack}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
                            >
                                Sair sem abrir PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DesinterdicaoForm
