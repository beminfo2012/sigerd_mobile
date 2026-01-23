import React, { useState, useEffect, useContext } from 'react'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronLeft, MapPin, Crosshair, Save, Share, Trash2, Camera, ClipboardCheck, Users, Edit2, CheckCircle2, CheckCircle, Circle, Sparkles, ArrowLeft, Siren, X } from 'lucide-react'
import { CHECKLIST_DATA } from '../../data/checklists'
import { saveVistoriaOffline, getRemoteVistoriasCache, getAllVistoriasLocal } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'
import { generatePDF } from '../../utils/pdfGenerator'
import { compressImage } from '../../utils/imageOptimizer'
import SignaturePadComp from '../../components/SignaturePad'
import VoiceInput from '../../components/VoiceInput'
import { checkRiskArea } from '../../services/riskAreas'
import { refineReportText } from '../../services/ai'
import bairrosDataRaw from '../../../Bairros.json'
import logradourosDataRaw from '../../../nomesderuas.json'

// Normalize logradouros data
const logradourosData = logradourosDataRaw
    .filter(item => item["Logradouro (Rua, Av. e etc)"])
    .map(item => ({
        nome: item["Logradouro (Rua, Av. e etc)"].trim(),
        bairro: item["Bairro"] ? item["Bairro"].trim() : ""
    }));

// Get unique neighborhoods from the new file
const uniqueBairrosFromStreets = [...new Set(logradourosData.map(l => l.bairro).filter(Boolean))].sort();
const bairrosData = uniqueBairrosFromStreets.map(b => ({ nome: b }));


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

const ENCAMINHAMENTOS_LIST = [
    'Secretaria de Interior',
    'Secretaria de Ação Social',
    'Secretaria de Serviços Urbanos',
    'Secretaria de Saúde',
    'Secretaria de Defesa Social',
    'Secretaria de Educação',
    'Secretaria de Meio Ambiente',
    'Secretaria de Agropecuária',
    'Secretaria de Obras',
    'Bombeiros Voluntários',
    'Bombeiros Militar',
    'Policia Militar',
    'Policia Militar Ambiental',
    'SAMU',
    'Defesa Civil Estadual',
    'Outros'
]

const VistoriaForm = ({ onBack, initialData = null }) => {
    const userProfile = useContext(UserContext)

    const [formData, setFormData] = useState({
        vistoriaId: '',
        processo: '',
        agente: userProfile?.full_name || localStorage.getItem('lastAgentName') || '',
        matricula: userProfile?.matricula || localStorage.getItem('lastAgentMatricula') || '',
        solicitante: '',
        cpf: '',
        telefone: '',
        endereco: '',
        bairro: '',
        latitude: '',
        longitude: '',
        coordenadas: '',
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
        documentos: [],
        assinaturaAgente: null,
        apoioTecnico: {
            nome: '',
            crea: '',
            matricula: '',
            assinatura: null
        },
        checklistRespostas: {} // { "pergunta": true/false }
    })

    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const [activeSignatureType, setActiveSignatureType] = useState('agente') // 'agente' ou 'apoio'

    const [saving, setSaving] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [refining, setRefining] = useState(false)
    const [gettingLoc, setGettingLoc] = useState(false)
    const [detectedRiskArea, setDetectedRiskArea] = useState(null)

    // Update agent info when user profile loads (if fields are empty)
    useEffect(() => {
        if (userProfile && (!formData.agente || !formData.matricula)) {
            setFormData(prev => ({
                ...prev,
                agente: prev.agente || userProfile.full_name || '',
                matricula: prev.matricula || userProfile.matricula || ''
            }))
        }
    }, [userProfile])

    // Persist agent info to be used as fallback
    useEffect(() => {
        if (formData.agente) localStorage.setItem('lastAgentName', formData.agente)
        if (formData.matricula) localStorage.setItem('lastAgentMatricula', formData.matricula)
    }, [formData.agente, formData.matricula])

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Map snake_case from DB to camelCase for form state
                vistoriaId: initialData.vistoria_id || initialData.vistoriaId,
                dataHora: initialData.data_hora || initialData.dataHora,
                categoriaRisco: initialData.categoria_risco || initialData.categoriaRisco,
                subtiposRisco: initialData.subtipos_risco || initialData.subtiposRisco || [],
                nivelRisco: initialData.nivel_risco || initialData.nivelRisco || 'Baixo',
                situacaoObservada: initialData.situacao_observada || initialData.situacaoObservada || 'Estabilizado',
                populacaoEstimada: initialData.populacao_estimada || initialData.populacaoEstimada,
                gruposVulneraveis: initialData.grupos_vulneraveis || initialData.gruposVulneraveis || [],
                medidasTomadas: initialData.medidas_tomadas || initialData.medidasTomadas || [],
                encaminhamentos: initialData.encaminhamentos || [],
                assinaturaAgente: initialData.assinatura_agente || initialData.assinaturaAgente || null,
                apoioTecnico: initialData.apoio_tecnico || initialData.apoioTecnico || { nome: '', crea: '', matricula: '', assinatura: null },
                checklistRespostas: initialData.checklist_respostas || initialData.checklistRespostas || {},
                fotos: (initialData.fotos || []).map((f, i) =>
                    typeof f === 'string'
                        ? { id: `legacy-${i}`, data: f, legenda: '' }
                        : { ...f, id: f.id || `photo-${i}`, legenda: f.legenda || '' }
                )
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
        window.addEventListener('vistoria-deleted', handleDeletion)
        return () => window.removeEventListener('vistoria-deleted', handleDeletion)
    }, [initialData])

    const getNextId = async () => {
        const currentYear = new Date().getFullYear()

        try {
            let maxNum = 0

            // 1. Fetch from Local and Cache
            const [cached, local] = await Promise.all([
                getRemoteVistoriasCache().catch(() => []),
                getAllVistoriasLocal().catch(() => [])
            ]);

            const allRecords = [...cached, ...local];
            console.log(`[ID Sequence] Scanned ${allRecords.length} records in local/cache.`);

            allRecords.forEach(v => {
                const vid = v.vistoria_id || v.vistoriaId
                if (vid && vid.includes(`/${currentYear}`)) {
                    const parts = vid.split('/');
                    const num = parseInt(parts[0]);
                    if (!isNaN(num)) {
                        if (num > maxNum) maxNum = num;
                    }
                }
            })

            // 2. Fetch from Supabase (if online)
            if (navigator.onLine) {
                try {
                    const { data, error } = await supabase
                        .from('vistorias')
                        .select('vistoria_id')
                        .ilike('vistoria_id', `%/${currentYear}`)
                        .limit(500); // Higher limit to ensure we see all recent ones

                    if (data && data.length > 0) {
                        data.forEach(row => {
                            const vid = row.vistoria_id;
                            if (vid) {
                                const parts = vid.split("/");
                                const num = parseInt(parts[0]);
                                if (!isNaN(num)) {
                                    if (num > maxNum) maxNum = num;
                                }
                            }
                        });
                    }
                } catch (srvErr) {
                    console.warn('Server ID fetch failed:', srvErr);
                }
            }

            const nextNum = maxNum + 1
            const newId = `${nextNum.toString().padStart(3, '0')}/${currentYear}`

            console.log(`[ID Sequence] MAX: ${maxNum} -> NEXT: ${newId}`);

            setFormData(prev => ({
                ...prev,
                vistoriaId: newId,
                agente: userProfile?.full_name || prev.agente || '',
                matricula: userProfile?.matricula || prev.matricula || ''
            }))

        } catch (e) {
            console.error('Error calculating next ID:', e)
            setFormData(prev => ({ ...prev, vistoriaId: '' }))
        }
    }

    const getLocation = async () => {
        if (!navigator.geolocation) return alert("GPS não suportado.")

        // Check permission first (if supported)
        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                if (permissionStatus.state === 'denied') {
                    return alert("🚫 Permissão de GPS negada.\n\nVá em Configurações do navegador e permita o acesso à localização para este site.");
                }
            } catch (e) {
                console.warn("Permissions API not fully supported, proceeding with geolocation request:", e);
            }
        }

        setGettingLoc(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                setFormData(prev => ({
                    ...prev,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                    coordenadas: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                }))

                // Check Risk Area
                const riskInfo = checkRiskArea(lat, lng);
                setDetectedRiskArea(riskInfo);

                if (riskInfo) {
                    alert(`⚠️ ALERTA: Você está em uma Área de Risco Mapeada!\n\nLocal: ${riskInfo.name}\nFonte: ${riskInfo.source}`);

                    // Auto-append to observations if not already there
                    setFormData(prev => {
                        const riskNote = `[SISTEMA] Vistoria realizada em área de risco mapeada: ${riskInfo.name} (${riskInfo.source}).`;
                        if (!prev.observacoes.includes(riskNote)) {
                            return {
                                ...prev,
                                observacoes: riskNote + (prev.observacoes ? '\n\n' + prev.observacoes : '')
                            }
                        }
                        return prev;
                    });
                }

                setGettingLoc(false)
            },
            (error) => {
                setGettingLoc(false);
                let errorMsg = "Erro ao obter GPS.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = "🚫 Permissão de GPS negada.\n\nVá em Configurações do navegador e permita o acesso à localização para este site.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = "📡 Posição GPS indisponível.\n\nVerifique se o GPS do dispositivo está ativado e se você está em área aberta.";
                        break;
                    case error.TIMEOUT:
                        errorMsg = "⏱️ Tempo esgotado ao buscar GPS.\n\nTente novamente em área aberta ou aguarde mais tempo para o sinal estabilizar.";
                        break;
                    default:
                        errorMsg = `❌ Erro desconhecido ao obter GPS.\n\nCódigo: ${error.code}\nMensagem: ${error.message}`;
                }

                alert(errorMsg);
                console.error("Geolocation error:", error);
            },
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
        // Attempt to get location if missing (Best Effort for High Fidelity)
        let currentCoords = formData.latitude && formData.longitude ? {
            lat: formData.latitude,
            lng: formData.longitude
        } : null;

        if (!currentCoords && navigator.geolocation) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
                });
                currentCoords = {
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6)
                };

                // Also update form state if we got it
                setFormData(prev => ({
                    ...prev,
                    latitude: currentCoords.lat,
                    longitude: currentCoords.lng,
                    coordenadas: `${currentCoords.lat}, ${currentCoords.lng}`
                }));
            } catch (e) {
                console.warn("Auto-GPS for photo failed:", e);
                // Continue without coords
            }
        }

        const newPhotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = async () => {
                    try {
                        const compressed = await compressImage(reader.result, { coordinates: currentCoords });
                        resolve({
                            id: Date.now() + Math.random(),
                            data: compressed,
                            name: file.name,
                            legenda: ''
                        })
                    } catch (e) {
                        console.error("Compression error:", e)
                        resolve({
                            id: Date.now() + Math.random(),
                            data: reader.result,
                            name: file.name,
                            legenda: ''
                        })
                    }
                }
                reader.readAsDataURL(file)
            })
        }))
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ...newPhotos] }))
    }

    // [SAFE AI] Comparison State - Strictly Local, No Global Side Effects
    const [comparisonContent, setComparisonContent] = useState(null) // { original: '', refined: '' }

    const handleAIRefine = async () => {
        if (!formData.observacoes.trim()) {
            return alert("Digite algo nas observações primeiro."); // Simple alert is fine for empty check
        }

        setRefining(true);
        try {
            const refinedText = await refineReportText(
                formData.observacoes,
                formData.categoriaRisco,
                `Cidadão: ${formData.solicitante}, Local: ${formData.endereco}`
            );

            if (refinedText) {
                // SUCCESS: Open Comparison Modal instead of auto-applying
                setComparisonContent({
                    original: formData.observacoes,
                    refined: refinedText
                });
            } else {
                // SILENT FAIL (Handled by AI Service returning null)
                // Just show a subtle toast/alert, don't break flow
                alert("⚠️ A IA não pôde responder no momento. Tente novamente mais tarde.\n(Seu texto original está seguro)");
            }
        } catch (e) {
            console.error("Critical Safety Catch:", e); // Should rarely hit due to ai.js wrapping
            alert("Erro de conexão com o assistente inteligente.");
        } finally {
            setRefining(false);
        }
    }

    const applyRefinement = () => {
        if (comparisonContent?.refined) {
            setFormData(prev => ({ ...prev, observacoes: comparisonContent.refined }));
            setComparisonContent(null); // Close modal
        }
    }

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== id) }))
    }

    const updatePhotoCaption = (id, text) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.map(p => String(p.id) === String(id) ? { ...p, legenda: text } : p)
        }))
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
    const labelClasses = "text-[10px] sm:text-xs md:text-sm text-[#2a5299] font-bold block mb-1.5 uppercase tracking-wide opacity-90 min-h-[1.2rem] sm:min-h-[1.5rem]"
    const sectionClasses = "bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5"

    return (
        <div className="bg-slate-50 min-h-screen pb-32 font-sans">
            {/* Header */}
            <div className="bg-white px-5 py-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                    {initialData ? (formData.processo || formData.vistoriaId) : 'Nova Vistoria'}
                </h1>
            </div>

            {detectedRiskArea && (
                <div className="bg-red-50 mx-4 mt-4 mb-0 p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
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

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-xl mx-auto">
                <section className={sectionClasses}>
                    <h2 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 1. Identificação
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className={labelClasses.replace('mb-1.5', 'mb-0')}>Nº Vistoria</label>
                                <button type="button" onClick={getNextId} className="text-blue-500 p-1 hover:bg-blue-50 rounded" title="Forçar atualização">
                                    <Sparkles size={12} />
                                </button>
                            </div>
                            <div className={`text-lg font-black p-3.5 rounded-xl border flex justify-between items-center shadow-inner ${formData.vistoriaId ? 'bg-blue-50/50 text-[#2a5299] border-blue-100/50' : 'bg-orange-50/50 text-orange-600 border-orange-100/50 italic text-base'}`}>
                                {formData.vistoriaId || 'Pendente (Gerar)'}
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Nº Processo</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 font-bold select-none">{new Date().getFullYear()}-</span>
                                <input
                                    type="text"
                                    className={`${inputClasses} pl-[60px] uppercase font-mono`}
                                    placeholder="XXXXX"
                                    maxLength={8}
                                    value={formData.processo.replace(`${new Date().getFullYear()}-`, '')}
                                    onChange={e => {
                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                        setFormData({ ...formData, processo: `${new Date().getFullYear()}-${val}` })
                                    }}
                                />
                            </div>
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
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.agente}
                                onChange={e => setFormData({ ...formData, agente: e.target.value })}
                                placeholder="Nome do Agente"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Matrícula</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.matricula}
                                onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                                placeholder="Matrícula"
                            />
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>CPF</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={14}
                                    placeholder="000.000.000-00"
                                    className={inputClasses}
                                    value={formData.cpf}
                                    onChange={e => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 11) v = v.slice(0, 11);
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                        setFormData({ ...formData, cpf: v });
                                    }}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Telefone</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-3.5 text-gray-500 font-bold select-none">(27)</span>
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        maxLength={10}
                                        placeholder="90000-0000"
                                        className={`${inputClasses} pl-12`}
                                        value={formData.telefone.replace(/^\(27\) /, '')}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 9) v = v.slice(0, 9);
                                            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
                                            setFormData({ ...formData, telefone: `(27) ${v}` });
                                        }}
                                    />
                                </div>
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
                            <div className="flex justify-between items-center">
                                <label className={labelClasses}>Endereço da Ocorrência</label>
                            </div>
                            <div className="relative">
                                <MapPin size={20} className="absolute left-4 top-4 text-[#2a5299]" />
                                <input
                                    type="text"
                                    list="logradouros-list"
                                    className={`${inputClasses} pl-12`}
                                    value={formData.endereco}
                                    onChange={e => {
                                        const streetName = e.target.value;
                                        const found = logradourosData.find(l => l.nome.toLowerCase() === streetName.toLowerCase());

                                        setFormData(prev => ({
                                            ...prev,
                                            endereco: streetName,
                                            // Auto-fill bairro if street is found
                                            bairro: found ? found.bairro : prev.bairro
                                        }));
                                    }}
                                    placeholder="Comece a digitar o nome da rua..."
                                />
                                <datalist id="logradouros-list">
                                    {logradourosData
                                        .filter(l => !formData.bairro || l.bairro === formData.bairro)
                                        .map(l => l.nome)
                                        .sort()
                                        .map(nome => (
                                            <option key={nome} value={nome} />
                                        ))}
                                </datalist>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="flex flex-col">
                                <label className={labelClasses}>Bairro</label>
                                <input
                                    type="text"
                                    list="bairros-list"
                                    className={inputClasses}
                                    value={formData.bairro}
                                    onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                                    placeholder="Digite ou selecione..."
                                />
                                <datalist id="bairros-list">
                                    {bairrosData.map(b => b.nome).sort().map(nome => (
                                        <option key={nome} value={nome} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="flex flex-col">
                                <label className={labelClasses}>Coordenadas (Lat, Lng)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className={inputClasses}
                                        value={formData.coordenadas}
                                        placeholder="-20.000000, -40.000000"
                                        onChange={e => {
                                            const val = e.target.value;
                                            const parts = val.split(',');
                                            let updates = { coordenadas: val };

                                            if (parts.length >= 2) {
                                                const lat = parseFloat(parts[0].trim());
                                                const lng = parseFloat(parts[1].trim());
                                                if (!isNaN(lat) && !isNaN(lng)) {
                                                    updates.latitude = parts[0].trim();
                                                    updates.longitude = parts[1].trim();
                                                }
                                            }
                                            setFormData(prev => ({ ...prev, ...updates }));
                                        }}
                                    />
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

                        {/* 5.1.1 Checklist Inteligente */}
                        {formData.categoriaRisco && CHECKLIST_DATA[formData.categoriaRisco] && (
                            <div className="bg-blue-50/30 p-5 rounded-2xl border-2 border-blue-100/50 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-blue-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <CheckCircle2 size={18} className="text-blue-600" /> Checklist Técnico
                                    </h3>
                                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">Obrigatório</span>
                                </div>
                                <div className="space-y-2">
                                    {CHECKLIST_DATA[formData.categoriaRisco].map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                checklistRespostas: {
                                                    ...prev.checklistRespostas,
                                                    [item]: !prev.checklistRespostas[item]
                                                }
                                            }))}
                                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.checklistRespostas[item] ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}
                                        >
                                            <div className={`mt-0.5 shrink-0 ${formData.checklistRespostas[item] ? 'text-white' : 'text-slate-300'}`}>
                                                {formData.checklistRespostas[item] ? <CheckCircle2 size={20} fill="currentColor" className="text-blue-200" /> : <Circle size={20} />}
                                            </div>
                                            <span className="text-sm font-bold leading-tight">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const simAnswers = Object.keys(formData.checklistRespostas).filter(k => formData.checklistRespostas[k]);
                                        if (simAnswers.length === 0) return alert("Marque pelo menos um item para consolidar.");
                                        const text = `CONSTATAÇÕES TÉCNICAS:\n${simAnswers.map(a => `[SIM] ${a}`).join('\n')}\n\n`;
                                        setFormData(prev => ({ ...prev, observacoes: text + prev.observacoes }));
                                    }}
                                    className="w-full p-3 bg-white border-2 border-blue-200 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm"
                                >
                                    Consolidar em Observações
                                </button>
                            </div>
                        )}

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
                                    { id: 'Baixo', label: 'Baixo', color: 'bg-green-100 text-green-700 border-green-200' },
                                    { id: 'Médio', label: 'Médio', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                    { id: 'Alto', label: 'Alto', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                    { id: 'Iminente', label: 'Iminente', color: 'bg-red-100 text-red-700 border-red-200' }
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
                                <input type="number" inputMode="numeric" placeholder="Nº estimado de pessoas" className={inputClasses} value={formData.populacaoEstimada} onChange={e => setFormData({ ...formData, populacaoEstimada: e.target.value })} />
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
                            <div className="flex justify-between items-center mb-1.5">
                                <label className={labelClasses} style={{ marginBottom: 0 }}>Observações Técnicas</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAIRefine}
                                        disabled={refining}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${refining ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md active:scale-95'}`}
                                    >
                                        <Sparkles size={12} className={refining ? 'animate-spin' : ''} />
                                        {refining ? 'Refinando...' : 'Refinar com IA ⚡'}
                                    </button>
                                    <VoiceInput onResult={(text) => setFormData(prev => ({ ...prev, observacoes: (prev.observacoes ? prev.observacoes + ' ' : '') + text }))} />
                                </div>
                            </div>
                            <textarea
                                rows="4"
                                className={`${inputClasses} ${refining ? 'opacity-50' : ''}`}
                                placeholder="Descrever condições observadas, indícios técnicos e fatores agravantes."
                                value={formData.observacoes}
                                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                            />
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
                        {/* 8. Encaminhamentos */}
                        <div>
                            <label className={labelClasses}>Encaminhamentos</label>

                            <select
                                className={inputClasses}
                                value=""
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !formData.encaminhamentos.includes(val)) {
                                        setFormData(prev => ({
                                            ...prev,
                                            encaminhamentos: [...(prev.encaminhamentos || []), val]
                                        }));
                                    }
                                }}
                            >
                                <option value="">Selecione para adicionar...</option>
                                {ENCAMINHAMENTOS_LIST.map(enc => (
                                    <option key={enc} value={enc} disabled={formData.encaminhamentos.includes(enc)}>
                                        {enc}
                                    </option>
                                ))}
                            </select>

                            {formData.encaminhamentos.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.encaminhamentos.map(enc => (
                                        <button
                                            key={enc}
                                            type="button"
                                            onClick={() => toggleArrayItem('encaminhamentos', enc)}
                                            className="px-3 py-2 rounded-lg text-sm font-bold bg-blue-50 text-[#2a5299] border border-blue-100 flex items-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors group"
                                        >
                                            {enc}
                                            <Trash2 size={14} className="group-hover:block" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 6. Assinaturas
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Agente Signature */}
                        <div>
                            <label className={labelClasses}>Assinatura do Agente</label>
                            <div
                                onClick={() => {
                                    setActiveSignatureType('agente')
                                    setShowSignaturePad(true)
                                }}
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

                        {/* Support Signature */}
                        <div className="pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
                            <label className={labelClasses}>Apoio Técnico (Obras/Engenharia)</label>
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

                            <div
                                onClick={() => {
                                    setActiveSignatureType('apoio')
                                    setShowSignaturePad(true)
                                }}
                                className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#2a5299] transition-colors"
                            >
                                {formData.apoioTecnico.assinatura ? (
                                    <img src={formData.apoioTecnico.assinatura} className="h-full w-auto object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <Edit2 size={24} className="mx-auto text-slate-300 group-hover:text-[#2a5299]" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Assinatura do Apoio</span>
                                    </div>
                                )}
                            </div>
                            {formData.apoioTecnico.assinatura && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFormData({ ...formData, apoioTecnico: { ...formData.apoioTecnico, assinatura: null } })
                                    }}
                                    className="text-[10px] text-red-500 font-bold mt-1 uppercase"
                                >
                                    Limpar Assinatura
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section className={sectionClasses}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#2a5299] rounded-full"></span> 7. Registro Fotográfico
                        </h2>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">{formData.fotos.length} anexos</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <FileInput onFileSelect={handlePhotoSelect} label="+" />
                        {formData.fotos.map(foto => (
                            <div key={foto.id} className="relative flex flex-col rounded-xl overflow-hidden shadow-md bg-white border border-gray-100">
                                <div className="relative aspect-square w-full">
                                    <img src={foto.data || foto} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removePhoto(foto.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"><Trash2 size={12} /></button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Legenda..."
                                    className="w-full p-2 text-[10px] sm:text-xs border-t border-gray-100 outline-none focus:bg-blue-50/50 transition-colors"
                                    value={foto.legenda || ''}
                                    onChange={(e) => updatePhotoCaption(foto.id, e.target.value)}
                                />
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

            {/* AI Comparison Modal - Safe & Explicit */}
            {comparisonContent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setComparisonContent(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2 text-lg">
                                <Sparkles size={20} className="text-yellow-300" />
                                Refinamento Inteligente
                            </h3>
                            <button onClick={() => setComparisonContent(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            {/* Original */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Seu Texto Original</span>
                                <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {comparisonContent.original}
                                </div>
                            </div>

                            {/* Refined */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block flex items-center gap-1">
                                    <Sparkles size={12} /> Sugestão da IA
                                </span>
                                <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100 text-indigo-900 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-sm">
                                    {comparisonContent.refined}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t border-gray-100">
                            <button
                                onClick={() => setComparisonContent(null)}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                                Manter Original
                            </button>
                            <button
                                onClick={applyRefinement}
                                className="px-5 py-2.5 rounded-xl font-bold bg-[#2a5299] text-white hover:bg-[#1e3c72] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={18} />
                                Aplicar Melhoria
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    )
}

export default VistoriaForm
