import React, { useState, useEffect, useContext } from 'react'
import { ArrowLeft, Save, Camera, MapPin, Search, Plus, X, Siren, Clock, FileText, CheckCircle, Edit2, User, Phone, Mail, Crosshair, AlertTriangle, Info, RefreshCw, Upload, Sparkles, Mic, Type, Activity, ChevronRight, Share, Trash2, Download, ChevronLeft, Maximize2, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { checkRiskArea } from '../../services/riskAreas'
import { saveInterdicaoOffline, deleteInterdicaoLocal } from '../../services/db'
import FileInput from '../../components/FileInput'
import { generatePDF } from '../../utils/pdfGenerator'
import { compressImage, extractMetadata } from '../../utils/imageOptimizer'
import SignaturePadComp from '../../components/SignaturePad'
import VoiceInput from '../../components/VoiceInput'
import { supabase } from '../../services/supabase'
import { UserContext } from '../../App'
import { refineReportText } from '../../services/ai'
import ConfirmModal from '../../components/ConfirmModal'
import bairrosData from '../../../Bairros.json'
import logradourosDataRaw from '../../../nomesderuas.json'

// Normalize logradouros data
const logradourosData = logradourosDataRaw
    .filter(item => item["Logradouro (Rua, Av. e etc)"])
    .map(item => ({
        nome: item["Logradouro (Rua, Av. e etc)"].trim(),
        bairro: item["Bairro"] ? item["Bairro"].trim() : ""
    }));


const SearchableInput = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    icon: IconComponent,
    labelClasses,
    inputClasses
}) => {
    const [search, setSearch] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative">
            <label className={labelClasses}>{label}</label>
            <div className="relative group">
                {IconComponent && <IconComponent size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />}
                <div
                    onClick={() => setIsOpen(true)}
                    className={`${inputClasses} ${IconComponent ? 'pl-12' : ''} cursor-pointer min-h-[56px] flex items-center justify-between pr-4`}
                >
                    <span className={value ? 'text-slate-800 dark:text-white' : 'text-slate-300 dark:text-slate-600'}>
                        {value || placeholder}
                    </span>
                    <Search size={16} className="text-slate-300" />
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl mx-auto flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">{label}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    autoFocus
                                    className={`${inputClasses} pl-12 text-black`}
                                    placeholder="Comece a digitar para filtrar..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto p-2 pb-20">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full text-left p-4 rounded-2xl font-bold transition-all flex items-center justify-between group mb-1 ${value === opt ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                                    >
                                        <span className="flex-1">{opt}</span>
                                        {value === opt && <CheckCircle size={18} className="ml-2" />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center space-y-2 opacity-50">
                                    <Search size={32} className="mx-auto text-slate-300" />
                                    <p className="font-bold text-sm">Nenhum resultado encontrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



const InterdicaoForm = ({ onBack, initialData, onDesinterdicao }) => {
    const userProfile = useContext(UserContext)
    const navigate = useNavigate()
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
        informacoes_complementares: '',
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
        agente: userProfile?.full_name || localStorage.getItem('lastAgentName') || '',
        matricula: userProfile?.matricula || localStorage.getItem('lastAgentMatricula') || '',
        assinaturaAgente: null,
        apoioTecnico: { nome: '', crea: '', matricula: '', assinatura: null },
        temApoioTecnico: false
    })

    const [docType, setDocType] = useState('CPF')
    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const [saving, setSaving] = useState(false)
    const [gettingLoc, setGettingLoc] = useState(false)
    const [activeSignatureType, setActiveSignatureType] = useState('agente') // 'agente' or 'apoio'
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [detectedRiskArea, setDetectedRiskArea] = useState(null)
    const [refining, setRefining] = useState(false)
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)

    useEffect(() => {
        const formatDateTime = (val) => {
            if (!val) return '';
            try {
                const d = new Date(val);
                if (isNaN(d.getTime())) return val;
                const pad = (num) => String(num).padStart(2, '0');
                const year = d.getFullYear();
                const month = pad(d.getMonth() + 1);
                const day = pad(d.getDate());
                const hours = pad(d.getHours());
                const minutes = pad(d.getMinutes());
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch (e) { return val; }
        };

        if (initialData) {
            setFormData({
                ...initialData,
                interdicaoId: initialData.interdicao_id || initialData.interdicaoId,
                dataHora: formatDateTime(initialData.data_hora || initialData.dataHora || initialData.created_at),
                municipio: initialData.municipio || 'Santa Maria de Jetibá',
                bairro: initialData.bairro || initialData.localidade || '',
                endereco: initialData.endereco || initialData.logradouro || '',
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
                assinaturaAgente: initialData.assinatura_agente || initialData.assinaturaAgente || null,
                apoioTecnico: (() => {
                    let a = initialData.apoio_tecnico || initialData.apoioTecnico || { nome: '', crea: '', matricula: '', assinatura: null };
                    if (typeof a === 'string') {
                        try { a = JSON.parse(a); } catch (e) { a = { nome: '', crea: '', matricula: '', assinatura: null }; }
                    }
                    return a;
                })(),
                informacoes_complementares: initialData.informacoes_complementares || initialData.informacoesComplementares || '',
                fotos: (Array.isArray(initialData.fotos) ? initialData.fotos : []).map((f, i) =>
                    typeof f === 'string'
                        ? { id: `legacy-${i}`, data: f, legenda: '' }
                        : { ...f, id: f.id || `photo-${i}`, legenda: f.legenda || '' }
                ),
                temApoioTecnico: !!(initialData.apoioTecnico?.nome || initialData.apoio_tecnico?.nome)
            })

            if (initialData.latitude && initialData.longitude) {
                const riskInfo = checkRiskArea(initialData.latitude, initialData.longitude);
                setDetectedRiskArea(riskInfo);
            }
        } else {
            getNextId()
        }
    }, [initialData])

    // Update agent info when user profile loads
    useEffect(() => {
        if (userProfile && (!formData.agente || !formData.matricula)) {
            setFormData(prev => ({
                ...prev,
                agente: prev.agente || userProfile.full_name || '',
                matricula: prev.matricula || userProfile.matricula || ''
            }))
        }
    }, [userProfile])

    // Persist agent info
    useEffect(() => {
        if (formData.agente) localStorage.setItem('lastAgentName', formData.agente)
        if (formData.matricula) localStorage.setItem('lastAgentMatricula', formData.matricula)
    }, [formData.agente, formData.matricula])

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
                    latitude: latitude,
                    longitude: longitude,
                    coordenadas: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                }))

                // Check Risk Area
                const riskInfo = checkRiskArea(latitude, longitude);
                setDetectedRiskArea(riskInfo);

                if (riskInfo) {
                    alert(`⚠️ ALERTA: Esta localidade está em uma Área de Risco Mapeada!\n\nLocal: ${riskInfo.name}\nFonte: ${riskInfo.source}`);

                    // Auto-append to technical report if not already there
                    setFormData(prev => {
                        const riskNote = `[SISTEMA] Interdição realizada em área de risco mapeada: ${riskInfo.name} (${riskInfo.source}).`;
                        if (!prev.relatorioTecnico.includes(riskNote)) {
                            return {
                                ...prev,
                                relatorioTecnico: riskNote + (prev.relatorioTecnico ? '\n\n' + prev.relatorioTecnico : '')
                            }
                        }
                        return prev;
                    });
                }

                setGettingLoc(false)
                if (!riskInfo) alert("Coordenadas atualizadas com sucesso!")
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

    const handleAIRefine = async () => {
        if (!formData.situacaoObservada.trim()) return alert("Digite algo na situação observada primeiro.");
        setRefining(true);
        try {
            const refinedText = await refineReportText(
                formData.situacaoObservada,
                formData.riscoTipo.join(', '),
                `Local: ${formData.endereco}, Alvo: ${formData.tipoAlvo}`
            );

            if (refinedText && !refinedText.startsWith('ERROR:')) {
                if (window.confirm("A IA refinou o seu texto. Deseja substituir o original pelo texto técnico profissional?\n\nNOVO TEXTO:\n" + refinedText)) {
                    setFormData(prev => ({ ...prev, situacaoObservada: refinedText }));
                }
            } else {
                const errorMsg = refinedText ? refinedText.replace('ERROR:', '') : 'Serviço de IA indisponível no momento.';
                alert(`Erro ao refinar com IA: ${errorMsg}`);
            }
        } catch (e) {
            console.error("AI Refine error:", e);
            alert(`Erro ao refinar com IA: ${e.message}`);
        } finally {
            setRefining(false);
        }
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
        // Prepare current form coords as fallback
        const formCoords = formData.latitude && formData.longitude ? {
            lat: formData.latitude,
            lng: formData.longitude
        } : null;

        const newPhotos = await Promise.all(files.map(async (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = async () => {
                    try {
                        // Extract metadata from file (Works for both camera and gallery if file has EXIF)
                        const meta = await extractMetadata(file);

                        // Prioritize EXIF coords, then form coords
                        const finalCoords = meta.coords || formCoords;
                        // Prioritize EXIF timestamp, then current date
                        const finalTimestamp = meta.timestamp || new Date();

                        const compressed = await compressImage(reader.result, {
                            coordinates: finalCoords,
                            timestamp: finalTimestamp
                        });

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

    const downloadPhoto = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const nextPhoto = () => {
        if (selectedPhotoIndex === null) return;
        setSelectedPhotoIndex((selectedPhotoIndex + 1) % formData.fotos.length);
    };

    const prevPhoto = () => {
        if (selectedPhotoIndex === null) return;
        setSelectedPhotoIndex((selectedPhotoIndex - 1 + formData.fotos.length) % formData.fotos.length);
    };

    const getNextId = async () => {
        const currentYear = new Date().getFullYear()

        if (!navigator.onLine) {
            setFormData(prev => ({ ...prev, interdicaoId: '' }))
            return
        }

        try {
            const { data } = await supabase
                .from('interdicoes')
                .select('interdicao_id')
                .ilike('interdicao_id', `%/${currentYear}`)
                .order('created_at', { ascending: false })
                .limit(100);

            let maxNum = 0
            if (data && data.length > 0) {
                data.forEach(v => {
                    const parts = (v.interdicao_id || '').split('/')
                    const n = parseInt(parts[0])
                    if (!isNaN(n)) maxNum = Math.max(maxNum, n)
                })
            }

            const formattedId = `${(maxNum + 1).toString().padStart(2, '0')}/${currentYear}`
            setFormData(prev => ({ ...prev, interdicaoId: formattedId }))
        } catch (e) {
            console.error(e)
            setFormData(prev => ({ ...prev, interdicaoId: '' }))
        }
    }

    const handleDeleteFromForm = async () => {
        if (!initialData?.id) return

        const id = initialData.id
        const supabaseId = initialData.supabase_id || (typeof id === 'string' && id.includes('-') ? id : null)

        setSaving(true)
        try {
            let error = null
            if (supabaseId) {
                const { error: remoteError } = await supabase.from('interdicoes').delete().eq('id', supabaseId)
                error = remoteError
            }

            if (!error) {
                await deleteInterdicaoLocal(id)
                window.dispatchEvent(new CustomEvent('interdicao-deleted'))
                onBack()
            } else {
                alert('Erro ao excluir do servidor.')
            }
        } catch (e) {
            alert('Falha ao excluir.')
        } finally {
            setSaving(false)
        }
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
    const inputClasses = "w-full bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 outline-none focus:border-[#2a5299] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#2a5299]/20 transition-all text-gray-700 dark:text-slate-200 font-medium placeholder:text-gray-400"
    const labelClasses = "text-sm text-[#2a5299] dark:text-blue-400 font-bold block mb-1.5 uppercase tracking-wide opacity-90"
    const sectionClasses = "bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 space-y-5"

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-32 font-sans transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                    {initialData ? (formData.interdicaoId || 'Interdição') : 'Nova Interdição'}
                </h1>
            </div>

            {detectedRiskArea && (
                <div className="bg-red-50 mx-5 mt-5 mb-0 p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-red-100 p-2 rounded-full">
                        <Siren className="text-red-600 animate-pulse" size={24} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-red-700 uppercase tracking-wide text-sm">Área de Risco Detectada</h3>
                        <p className="text-red-600 font-bold leading-tight mt-1">{detectedRiskArea.name}</p>
                        <p className="text-red-500 text-xs mt-1 font-medium">Fonte: {detectedRiskArea.source}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-6 max-w-xl mx-auto">

                {/* 1. SEÇÃO: Identificação */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">1. Identificação</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2">
                            <label className={labelClasses}>Nº Interdição</label>
                            <div className={`text-lg font-black p-3.5 rounded-xl border flex justify-between items-center shadow-inner ${formData.interdicaoId ? 'bg-blue-50/50 dark:bg-blue-900/20 text-[#2a5299] dark:text-blue-300 border-blue-100/50 dark:border-blue-800/50' : 'bg-orange-50/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100/50 dark:border-orange-800/50 italic text-base'}`}>
                                {formData.interdicaoId || 'Pendente (Gerado no Sincronismo)'}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className={labelClasses}>Data e Hora</label>
                            <input type="datetime-local" value={formData.dataHora} onChange={e => handleChange('dataHora', e.target.value)} className={inputClasses} />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClasses}>Tipo de Alvo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Imóvel', 'Via pública', 'Área pública', 'Outro'].map(t => (
                                    <button key={t} type="button" onClick={() => handleChange('tipoAlvo', t)} className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.tipoAlvo === t ? 'bg-[#2a5299] border-[#2a5299] dark:bg-blue-600 dark:border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {formData.tipoAlvo === 'Outro' && (
                                <input type="text" placeholder="Especifique..." value={formData.tipoAlvoEspecificar} onChange={e => handleChange('tipoAlvoEspecificar', e.target.value)} className={`${inputClasses} mt-2 animate-in slide-in-from-top-2 duration-300`} />
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. SEÇÃO: Responsável Técnico */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">2. Responsável Técnico</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClasses}>Agente</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.agente}
                                onChange={e => handleChange('agente', e.target.value)}
                                placeholder="Nome do Agente"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Matrícula</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.matricula}
                                onChange={e => handleChange('matricula', e.target.value)}
                                placeholder="Matrícula"
                            />
                        </div>
                    </div>
                </section>

                {/* 3. SEÇÃO: Localização */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">3. Localização</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className={labelClasses}>Coordenadas (Lat, Lng)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        style={{ paddingLeft: '3rem' }}
                                        value={formData.coordenadas}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const parts = val.split(',');
                                            let updates = { coordenadas: val };
                                            if (parts.length >= 2) {
                                                const lat = parseFloat(parts[0].trim());
                                                const lng = parseFloat(parts[1].trim());
                                                if (!isNaN(lat) && !isNaN(lng)) {
                                                    updates.latitude = lat;
                                                    updates.longitude = lng;
                                                }
                                            }
                                            setFormData(prev => ({ ...prev, ...updates }));
                                        }}
                                        placeholder="-20.1234, -40.1234"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={getLocation}
                                    className={`p-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-white flex items-center justify-center gap-2 ${gettingLoc ? 'bg-gray-400' : 'bg-[#2a5299] hover:bg-[#1e3c72]'}`}
                                    disabled={gettingLoc}
                                >
                                    <Crosshair size={24} className={gettingLoc ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Município</label>
                                <input type="text" value={formData.municipio} readOnly className={`${inputClasses} bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500`} />
                            </div>
                            <div>
                                <SearchableInput
                                    label="Bairro / Localidade"
                                    placeholder="Selecione o bairro..."
                                    value={formData.bairro}
                                    onChange={val => handleChange('bairro', val)}
                                    options={bairrosData.map(b => b.nome).sort()}
                                    labelClasses={labelClasses}
                                    inputClasses={inputClasses}
                                />
                            </div>
                            <div className="col-span-2">
                                <SearchableInput
                                    label="Endereço da Ocorrência"
                                    placeholder="Nome da rua, avenida..."
                                    value={formData.endereco}
                                    onChange={val => {
                                        const found = logradourosData.find(l => l.nome.toLowerCase() === val.toLowerCase());
                                        setFormData(prev => ({
                                            ...prev,
                                            endereco: val,
                                            bairro: found ? found.bairro : prev.bairro
                                        }));
                                    }}
                                    options={logradourosData
                                        .filter(l => !formData.bairro || l.bairro === formData.bairro)
                                        .map(l => l.nome)
                                        .sort()}
                                    icon={MapPin}
                                    labelClasses={labelClasses}
                                    inputClasses={inputClasses}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className={labelClasses}>Informações Complementares</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Próximo à igreja, casa azul..."
                                    className={inputClasses}
                                    value={formData.informacoes_complementares}
                                    onChange={e => handleChange('informacoes_complementares', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </section>


                {/* 4. SEÇÃO: Responsável / Proprietário */}
                {formData.tipoAlvo !== 'Via pública' && (
                    <section className={`${sectionClasses} animate-in fade-in duration-500`}>
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">4. Responsável / Proprietário</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>Nome Completo</label>
                                <input type="text" value={formData.responsavelNome} onChange={e => handleChange('responsavelNome', e.target.value)} className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center px-1">
                                        <label className={labelClasses}>{docType}</label>
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 mb-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocType('CPF')
                                                    handleChange('responsavelCpf', '')
                                                }}
                                                className={`text-[9px] px-2 py-0.5 rounded font-black transition-all ${docType === 'CPF' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                                            >
                                                CPF
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocType('CNPJ')
                                                    handleChange('responsavelCpf', '')
                                                }}
                                                className={`text-[9px] px-2 py-0.5 rounded font-black transition-all ${docType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
                                            >
                                                CNPJ
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="tel"
                                        className={inputClasses}
                                        placeholder={docType === 'CPF' ? "000.000.000-00" : "00.000.000/0000-00"}
                                        value={formData.responsavelCpf}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (docType === 'CPF') {
                                                if (v.length > 11) v = v.slice(0, 11);
                                                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                                v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                                v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                            } else {
                                                if (v.length > 14) v = v.slice(0, 14);
                                                v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                                                v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                                                v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                                                v = v.replace(/(\d{4})(\d)/, '$1-$2');
                                            }
                                            handleChange('responsavelCpf', v);
                                        }}
                                    />
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

                {/* 5. SEÇÃO: Caracterização do Risco */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">5. Caracterização do Risco</h2>
                    </div>

                    <div>
                        <label className={labelClasses}>Tipo de Ocorrência (Múltiplo)</label>
                        <div className="flex flex-wrap gap-2">
                            {['Risco estrutural', 'Deslizamento', 'Alagamento', 'Erosão', 'Incêndio', 'Colapso parcial', 'Colapso total', 'Outro'].map(r => (
                                <button key={r} type="button" onClick={() => toggleRisco(r)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.riscoTipo.includes(r) ? 'bg-red-600 border-red-600 dark:bg-red-700 dark:border-red-700 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Grau de Risco</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'Baixo', color: 'bg-emerald-500' },
                                { id: 'Médio', color: 'bg-amber-500' },
                                { id: 'Alto', color: 'bg-orange-500' },
                                { id: 'Iminente', color: 'bg-red-600' }
                            ].map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => handleChange('riscoGrau', g.id)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.riscoGrau === g.id
                                        ? `${g.color} border-transparent text-white shadow-lg scale-105`
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600'
                                        }`}
                                >
                                    {g.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={labelClasses} style={{ marginBottom: 0 }}>Situação Observada</label>
                            <button
                                type="button"
                                onClick={handleAIRefine}
                                disabled={refining}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${refining ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md active:scale-95'}`}
                            >
                                <Sparkles size={12} className={refining ? 'animate-spin' : ''} />
                                {refining ? 'Refinando...' : 'Refinar com IA'}
                            </button>
                        </div>
                        <textarea
                            rows="3"
                            value={formData.situacaoObservada}
                            onChange={e => handleChange('situacaoObservada', e.target.value)}
                            className={`${inputClasses} ${refining ? 'opacity-50' : ''}`}
                            placeholder="Descreva os danos e evidências..."
                        />
                    </div>
                </section>



                {/* 6. SEÇÃO: Medida Administrativa */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">6. Medida Administrativa</h2>
                    </div>

                    <div>
                        <label className={labelClasses}>Tipo de Interdição</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'Preventiva', color: 'bg-blue-500' },
                                { id: 'Parcial', color: 'bg-orange-400' },
                                { id: 'Total', color: 'bg-red-600' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleChange('medidaTipo', m.id)}
                                    className={`p-3 rounded-xl text-xs font-bold border transition-all ${formData.medidaTipo === m.id
                                        ? `${m.color} border-transparent text-white shadow-lg scale-105`
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                                        }`}
                                >
                                    {m.id}
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

                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/50">
                        <div>
                            <div className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Evacuação</div>
                            <div className="text-[10px] font-bold text-red-400 dark:text-red-500">Desocupação imediata?</div>
                        </div>
                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-red-100 dark:border-red-800/30">
                            <button type="button" onClick={() => handleChange('evacuacaoNecessaria', true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.evacuacaoNecessaria ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}>SIM</button>
                            <button type="button" onClick={() => handleChange('evacuacaoNecessaria', false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!formData.evacuacaoNecessaria ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>NÃO</button>
                        </div>
                    </div>
                </section>


                {/* 7. SEÇÃO: Registro Fotográfico */}
                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">7. Registro Fotográfico</h2>
                        </div>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full font-black uppercase">{formData.fotos.length} fotos</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <FileInput onFileSelect={handlePhotoSelect} className="h-32" />
                        {formData.fotos.map((foto, idx) => (
                            <div key={foto.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-sm bg-slate-50 dark:bg-slate-900">
                                <img
                                    src={foto.data || foto}
                                    className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                    onClick={() => setSelectedPhotoIndex(idx)}
                                />
                                <div
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none flex items-center justify-center"
                                >
                                    <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
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
                                        value={foto.legenda || ''}
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

                {/* 8. SEÇÃO: Relatório e Recomendações */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">8. Relatório e Recomendações</h2>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={labelClasses} style={{ marginBottom: 0 }}>Relatório Técnico</label>
                            <VoiceInput onResult={(text) => setFormData(prev => ({ ...prev, relatorioTecnico: (prev.relatorioTecnico ? prev.relatorioTecnico + ' ' : '') + text }))} />
                        </div>
                        <textarea rows="4" value={formData.relatorioTecnico} onChange={e => handleChange('relatorioTecnico', e.target.value)} className={inputClasses} placeholder="Detalhes técnicos da vistoria..." />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className={labelClasses} style={{ marginBottom: 0 }}>Recomendações Imediatas</label>
                            <VoiceInput onResult={(text) => setFormData(prev => ({ ...prev, recomendacoes: (prev.recomendacoes ? prev.recomendacoes + ' ' : '') + text }))} />
                        </div>
                        <textarea rows="2" value={formData.recomendacoes} onChange={e => handleChange('recomendacoes', e.target.value)} className={inputClasses} placeholder="O que o morador/município deve fazer..." />
                    </div>
                </section>

                {/* 9. SEÇÃO: Assinaturas */}
                <section className={sectionClasses}>
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-[3px]">9. Assinaturas</h2>
                    </div>

                    <div className="pt-4 space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className={labelClasses} style={{ marginBottom: 0 }}>Assinatura do Agente</label>
                                {userProfile?.signature && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, assinaturaAgente: userProfile.signature }))}
                                        className="text-[10px] font-black text-white uppercase tracking-wider bg-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <CheckCircle size={12} />
                                        Usar Assinatura Salva
                                    </button>
                                )}
                            </div>
                            <div
                                onClick={() => {
                                    setActiveSignatureType('agente')
                                    setShowSignaturePad(true)
                                }}
                                className="h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#2a5299] dark:hover:border-blue-500 transition-colors"
                            >
                                {formData.assinaturaAgente ? (
                                    <img src={formData.assinaturaAgente} className="h-full w-auto object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <Edit2 size={24} className="mx-auto text-slate-300 dark:text-slate-600 group-hover:text-[#2a5299] dark:group-hover:text-blue-500" />
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Tocar para Assinar (Agente)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                <div>
                                    <div className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Apoio Técnico</div>
                                    <div className="text-[10px] font-bold text-blue-400 dark:text-blue-500">Houve participação de técnico/engenheiro?</div>
                                </div>
                                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-blue-100 dark:border-blue-800/50">
                                    <button type="button" onClick={() => handleChange('temApoioTecnico', true)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${formData.temApoioTecnico ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500'}`}>SIM</button>
                                    <button type="button" onClick={() => handleChange('temApoioTecnico', false)} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${!formData.temApoioTecnico ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>NÃO</button>
                                </div>
                            </div>

                            {formData.temApoioTecnico && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className={labelClasses}>Dados do Técnico (Obras/Engenharia)</label>
                                    <div className="space-y-3 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Nome do Técnico"
                                            className={`${inputClasses} text-sm py-2`}
                                            value={formData.apoioTecnico.nome}
                                            onChange={e => setFormData(prev => ({
                                                ...prev,
                                                apoioTecnico: { ...prev.apoioTecnico, nome: e.target.value }
                                            }))}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="CREA/CAU"
                                                className={`${inputClasses} text-sm py-2`}
                                                value={formData.apoioTecnico.crea}
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    apoioTecnico: { ...prev.apoioTecnico, crea: e.target.value }
                                                }))}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Matrícula"
                                                className={`${inputClasses} text-sm py-2`}
                                                value={formData.apoioTecnico.matricula}
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    apoioTecnico: { ...prev.apoioTecnico, matricula: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1.5">
                                                <label className={labelClasses} style={{ marginBottom: 0 }}>Assinatura do Apoio</label>
                                                {userProfile?.signature && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ 
                                                            ...prev, 
                                                            apoioTecnico: { ...prev.apoioTecnico, assinatura: userProfile.signature } 
                                                        }))}
                                                        className="text-[10px] font-black text-white uppercase tracking-wider bg-blue-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle size={12} />
                                                        Usar Assinatura Salva
                                                    </button>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => {
                                                    setActiveSignatureType('apoio')
                                                    setShowSignaturePad(true)
                                                }}
                                                className="h-32 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#2a5299] dark:hover:border-blue-500 transition-colors"
                                            >
                                        {formData.apoioTecnico.assinatura ? (
                                            <img src={formData.apoioTecnico.assinatura} className="h-full w-auto object-contain" />
                                        ) : (
                                            <div className="text-center">
                                                <Edit2 size={24} className="mx-auto text-slate-300 dark:text-slate-600 group-hover:text-[#2a5299] dark:group-hover:text-blue-500" />
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Assinar Apoio Técnico</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                </section>

                {/* Histórico de Desinterdição */}
                {initialData?.desinterdicoes && initialData.desinterdicoes.length > 0 && (
                    <div className="mt-8 bg-green-50 dark:bg-green-900/10 rounded-[2rem] p-6 border border-green-100 dark:border-green-800/20 shadow-inner">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[11px]">Histórico de Desinterdição</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Autos vinculados a esta interdição</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {initialData.desinterdicoes.map((d, i) => (
                                <div key={d.id || i} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl shadow-sm border border-green-100/50 dark:border-green-900/30 flex items-center justify-between group hover:border-green-300 transition-all">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${d.tipo_desinterdicao === 'Parcial' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                {d.tipo_desinterdicao || 'Total'}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-slate-700 dark:text-white">
                                            {new Date(d.created_at).toLocaleString('pt-BR')}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">{d.agente || 'Agente'}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => window.open(`/desinterdicao/imprimir/${d.id}`, '_blank')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-black uppercase tracking-tighter text-xs shadow-md shadow-green-200 dark:shadow-none active:scale-95"
                                    >
                                        <Printer size={16} />
                                        PDF
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

                    {initialData && (!formData.status || formData.status === 'Interditado' || formData.status === 'Parcialmente Desinterditado') && (
                        <button
                            type="button"
                            onClick={() => onDesinterdicao(formData)}
                            className="w-full p-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-4"
                        >
                            <Sparkles size={24} /> Solicitar Desinterdição
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <button 
                            type="button" 
                            onClick={() => {
                                const id = formData.id || formData.interdicaoId || formData.interdicao_id;
                                if (!id) {
                                    alert('Por favor, salve a interdição primeiro para gerar o PDF neste modelo.');
                                    return;
                                }
                                window.open(`/interdicao/imprimir/${id}`, '_blank');
                            }} 
                            className="flex justify-center items-center gap-2 p-4 border border-gray-200 rounded-xl font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Printer size={20} /> IMPRIMIR PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => initialData ? setShowDeleteModal(true) : onBack()}
                            className="flex justify-center items-center gap-2 p-4 border border-red-100 text-red-500 bg-red-50/50 rounded-xl font-bold hover:bg-red-100/50 transition-colors"
                        >
                            <Trash2 size={20} /> {initialData ? 'Excluir' : 'Cancelar'}
                        </button>
                    </div>
                </div>

            </form>

            {/* Signature Modal */}
            {showSignaturePad && (
                <SignaturePadComp
                    title={activeSignatureType === 'agente' ? "Assinatura do Agente" : "Assinatura do Apoio Técnico"}
                    onCancel={() => setShowSignaturePad(false)}
                    onSave={(dataUrl) => {
                        if (activeSignatureType === 'agente') {
                            setFormData(prev => ({ ...prev, assinaturaAgente: dataUrl }))
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                apoioTecnico: { ...prev.apoioTecnico, assinatura: dataUrl }
                            }))
                        }
                        setShowSignaturePad(false)
                    }}
                />
            )}

            {/* Deletion Safety Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteFromForm}
                title="Excluir Interdição"
                message={`Tem certeza que deseja excluir permanentemente a interdição #${formData.interdicaoId}?`}
                confirmText="Sim, Excluir Agora"
                cancelText="Não, Voltar"
            />
            {/* Photo Lightbox / Popup */}
            {selectedPhotoIndex !== null && (
                <div
                    className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedPhotoIndex(null)}
                >
                    {/* Toolbar Superior */}
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-lg">
                                Foto {selectedPhotoIndex + 1} de {formData.fotos.length}
                            </span>
                            {formData.fotos[selectedPhotoIndex]?.legenda && (
                                <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider drop-shadow-md">
                                    {formData.fotos[selectedPhotoIndex].legenda}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const foto = formData.fotos[selectedPhotoIndex];
                                    downloadPhoto(foto.data || foto, `interdicao-${formData.interdicaoId}-foto-${selectedPhotoIndex + 1}.jpg`);
                                }}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all border border-white/10 shadow-xl active:scale-95"
                                title="Baixar esta foto"
                            >
                                <Download size={22} />
                            </button>
                            <button
                                onClick={() => setSelectedPhotoIndex(null)}
                                className="p-3 bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl backdrop-blur-md transition-all border border-red-500/20 shadow-xl active:scale-95"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Botões de Navegação */}
                    {formData.fotos.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm transition-all border border-white/5 z-50 group active:scale-90"
                            >
                                <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm transition-all border border-white/5 z-50 group active:scale-90"
                            >
                                <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}

                    {/* Imagem Central */}
                    <div className="relative w-full max-h-[70vh] flex-1 flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
                        <img
                            src={formData.fotos[selectedPhotoIndex]?.data || formData.fotos[selectedPhotoIndex]}
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-300"
                            alt="Visualização em tela cheia"
                        />
                    </div>

                    {/* Painel Inferior: Legenda e Miniaturas */}
                    <div
                        className="w-full bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pt-12 pb-6 px-6 flex flex-col items-center gap-6 z-50"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Legenda Editável */}
                        <div className="w-full max-w-md">
                            <p className="text-white font-black text-[10px] uppercase tracking-widest opacity-50 text-center mb-2">Edite a Legenda</p>
                            <input
                                type="text"
                                placeholder="Adicione uma legenda..."
                                className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-white/30 transition-all shadow-inner"
                                value={formData.fotos[selectedPhotoIndex]?.legenda || ''}
                                onChange={(e) => {
                                    const newFotos = [...formData.fotos]
                                    newFotos[selectedPhotoIndex].legenda = e.target.value
                                    handleChange('fotos', newFotos)
                                }}
                            />
                        </div>

                        {/* Miniaturas */}
                        <div className="flex gap-3 overflow-x-auto p-2 max-w-full no-scrollbar pb-4">
                            {formData.fotos.map((f, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedPhotoIndex(i)}
                                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedPhotoIndex === i ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={f.data || f} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InterdicaoForm
