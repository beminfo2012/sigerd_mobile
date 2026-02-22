import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronLeft, MapPin, Crosshair, Save, Share, Trash2, Camera, ClipboardCheck, Users, Edit2, CheckCircle2, CheckCircle, Circle, Sparkles, ArrowLeft, Siren, X, FileText, RefreshCw } from 'lucide-react'
import { CHECKLIST_DATA } from '../../data/checklists'
import { saveVistoriaOffline, getRemoteVistoriasCache, getAllVistoriasLocal, deleteVistoriaLocal } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'
import { generatePDF } from '../../utils/pdfGenerator'
import { compressImage } from '../../utils/imageOptimizer'
import { useToast } from '../../components/ToastNotification'
import SignaturePadComp from '../../components/SignaturePad'
import VoiceInput from '../../components/VoiceInput'
import { checkRiskArea } from '../../services/riskAreas'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { refineReportText } from '../../services/ai'
import ConfirmModal from '../../components/ConfirmModal'
import DespachoModal from '../../components/DespachoModal'
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
    const navigate = useNavigate()
    const { toast } = useToast()

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

    const [docType, setDocType] = useState('CPF')

    const [showSignaturePad, setShowSignaturePad] = useState(false)
    const [activeSignatureType, setActiveSignatureType] = useState('agente') // 'agente' ou 'apoio'
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDespachoModal, setShowDespachoModal] = useState(false)

    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
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
            const parseJSON = (val, fallback) => {
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch (e) { return fallback; }
                }
                return val || fallback;
            };

            const apoio = parseJSON(initialData.apoio_tecnico || initialData.apoioTecnico, { nome: '', crea: '', matricula: '', assinatura: null });

            setFormData({
                ...initialData,
                // Map snake_case from DB to camelCase for form state
                vistoriaId: initialData.vistoria_id || initialData.vistoriaId,
                dataHora: initialData.data_hora || initialData.dataHora,
                categoriaRisco: initialData.categoria_risco || initialData.categoriaRisco,
                subtiposRisco: Array.isArray(initialData.subtipos_risco || initialData.subtiposRisco) ? (initialData.subtipos_risco || initialData.subtiposRisco) : [],
                nivelRisco: initialData.nivel_risco || initialData.nivelRisco || 'Baixo',
                situacaoObservada: initialData.situacao_observada || initialData.situacaoObservada || 'Estabilizado',
                populacaoEstimada: initialData.populacao_estimada || initialData.populacaoEstimada,
                gruposVulneraveis: Array.isArray(initialData.grupos_vulneraveis || initialData.gruposVulneraveis) ? (initialData.grupos_vulneraveis || initialData.gruposVulneraveis) : [],
                medidasTomadas: Array.isArray(initialData.medidas_tomadas || initialData.medidasTomadas) ? (initialData.medidas_tomadas || initialData.medidasTomadas) : [],
                encaminhamentos: Array.isArray(initialData.encaminhamentos) ? initialData.encaminhamentos : [],
                assinaturaAgente: initialData.assinatura_agente || initialData.assinaturaAgente || null,
                apoioTecnico: {
                    nome: apoio?.nome || '',
                    crea: apoio?.crea || '',
                    matricula: apoio?.matricula || '',
                    assinatura: apoio?.assinatura || null
                },
                checklistRespostas: parseJSON(initialData.checklist_respostas || initialData.checklistRespostas, {}),
                fotos: (parseJSON(initialData.fotos, [])).map((f, i) =>
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

            if (refinedText && !refinedText.startsWith('ERROR:')) {
                // SUCCESS: Open Comparison Modal instead of auto-applying
                setComparisonContent({
                    original: formData.observacoes,
                    refined: refinedText
                });
            } else {
                // FAILURE: Show specific error for debugging
                const errorMsg = refinedText ? refinedText.replace('ERROR:', '') : 'Resposta vazia.';
                alert(`⚠️ DIAGNÓSTICO DE ERRO:\n\n${errorMsg}\n\n(Tire um print desta tela)`);
            }
        } catch (e) {
            console.error("Critical Safety Catch:", e);
            alert(`CRITICAL: ${e.message}`);
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

    const handleDeleteFromForm = async () => {
        if (!initialData?.id) return

        const id = initialData.id
        const supabaseId = initialData.supabase_id

        setSaving(true)
        try {
            let error = null
            if (supabaseId) {
                const { error: remoteError } = await supabase.from('vistorias').delete().eq('id', supabaseId)
                error = remoteError
            }

            if (!error) {
                await deleteVistoriaLocal(id)
                window.dispatchEvent(new CustomEvent('vistoria-deleted'))
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

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(p => p.id !== id) }))
    }

    const updatePhotoCaption = (id, text) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.map(p => String(p.id) === String(id) ? { ...p, legenda: text } : p)
        }))
    }

    const handleGeneratePDF = async () => {
        if (generating) return;
        setGenerating(true);
        toast.info('Gerando PDF...', 'Por favor, aguarde enquanto processamos o relatório e as imagens.');

        try {
            const result = await generatePDF(formData, 'vistoria');
            if (result.success) {
                toast.success('Relatório Gerado!', 'O arquivo foi criado e está pronto para salvar ou compartilhar.');
            } else {
                toast.error('Erro ao gerar PDF', result.error || 'Ocorreu um erro inesperado.');
            }
        } catch (e) {
            console.error('PDF Error:', e);
            toast.error('Erro Crítico', 'Não foi possível gerar o PDF. Verifique sua conexão e tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

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
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-32 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-30 border-b border-slate-100 dark:border-slate-700">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                                {initialData ? (formData.processo || formData.vistoriaId) : 'Nova Vistoria'}
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Formulário de Inspeção Técnica
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
                {detectedRiskArea && (
                    <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 p-5 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-2xl shadow-sm">
                            <Siren className="text-red-600 animate-pulse" size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-red-700 dark:text-red-400 uppercase tracking-[2px] text-[10px] mb-1">ALERTA: Área de Risco Crítico</h3>
                            <p className="text-red-700 dark:text-red-300 font-black leading-tight text-lg">{detectedRiskArea.name}</p>
                            <p className="text-red-600/70 dark:text-red-400/70 text-[10px] mt-1 font-bold uppercase tracking-wider">Mapeamento Oficial: {detectedRiskArea.source}</p>
                        </div>
                    </Card>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* 1. SEÇÃO: Identificação */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">1. Identificação</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className={labelClasses}>Nº Vistoria</label>
                                    <button
                                        type="button"
                                        onClick={getNextId}
                                        className="text-blue-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Atualizar ID"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <div className={`text-xl font-black p-4 rounded-2xl border flex justify-between items-center shadow-inner transition-all ${formData.vistoriaId
                                    ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/30'
                                    : 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-600 border-orange-100/50 dark:border-orange-900/30 italic text-base'
                                    }`}>
                                    {formData.vistoriaId || 'Pendente (Gerar)'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClasses}>Nº Processo</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm select-none pointer-events-none group-focus-within:text-blue-500 transition-colors">
                                        {new Date().getFullYear()}-
                                    </span>
                                    <input
                                        type="text"
                                        className={`${inputClasses} pl-[68px] uppercase font-mono tracking-widest`}
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
                    </Card>

                    {/* 5. SEÇÃO: Risco e Detalhes */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">5. Risco e Detalhes</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>Categoria de Risco</label>
                                <select
                                    className={inputClasses}
                                    value={formData.categoriaRisco}
                                    onChange={e => setFormData({ ...formData, categoriaRisco: e.target.value, subtiposRisco: [] })}
                                >
                                    <option value="">Selecione a Categoria</option>
                                    {Object.keys(RISK_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>

                            {formData.categoriaRisco && CHECKLIST_DATA[formData.categoriaRisco] && (
                                <div className="bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-3xl border-2 border-blue-100/50 dark:border-blue-900/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-black text-blue-900 dark:text-blue-400 text-[10px] uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-blue-600" /> Checklist Técnico
                                        </h3>
                                        <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase">Obrigatório</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
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
                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${formData.checklistRespostas[item] ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200'}`}
                                            >
                                                <div className={`mt-0.5 shrink-0 ${formData.checklistRespostas[item] ? 'text-white' : 'text-slate-300'}`}>
                                                    {formData.checklistRespostas[item] ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </div>
                                                <span className="text-sm font-bold leading-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className={labelClasses}>Nível de Risco</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'Baixo', color: 'bg-emerald-500' },
                                        { id: 'Médio', color: 'bg-amber-500' },
                                        { id: 'Alto', color: 'bg-orange-600' },
                                        { id: 'Iminente', color: 'bg-red-600' }
                                    ].map(nivel => (
                                        <button
                                            key={nivel.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, nivelRisco: nivel.id })}
                                            className={`p-3 rounded-xl font-black text-[10px] uppercase tracking-wider border-2 transition-all ${formData.nivelRisco === nivel.id
                                                ? `${nivel.color} text-white border-transparent shadow-lg scale-105`
                                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700'
                                                }`}
                                        >
                                            {nivel.id}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className={labelClasses}>Observações Técnicas</label>
                                    <div className="flex gap-2">
                                        <VoiceInput onResult={(text) => setFormData(prev => ({ ...prev, observacoes: prev.observacoes + ' ' + text }))} />
                                        <button
                                            type="button"
                                            onClick={handleAIRefine}
                                            disabled={refining}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <Sparkles size={12} className={refining ? 'animate-spin' : ''} />
                                            {refining ? 'Processando...' : 'IA Refinear'}
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    rows="5"
                                    className={`${inputClasses} py-3 text-sm leading-relaxed`}
                                    placeholder="Descreva as condições técnicas, indícios de instabilidade e diagnóstico final..."
                                    value={formData.observacoes}
                                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* 6. SEÇÃO: Assinaturas */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">6. Assinaturas</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className={labelClasses}>Assinatura do Agente</label>
                                <div
                                    onClick={() => { setActiveSignatureType('agente'); setShowSignaturePad(true); }}
                                    className="h-40 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-blue-50/30 transition-all border-image-none"
                                >
                                    {formData.assinaturaAgente ? (
                                        <img src={formData.assinaturaAgente} className="h-full w-auto p-2" alt="Assinatura Agente" />
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <Edit2 size={32} className="mx-auto text-slate-300" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tocar para Assinar</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className={labelClasses}>Assinatura do Assistido</label>
                                <div
                                    onClick={() => { setActiveSignatureType('assistido'); setShowSignaturePad(true); }}
                                    className="h-40 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-blue-50/30 transition-all"
                                >
                                    {formData.assinaturaAssistido ? (
                                        <img src={formData.assinaturaAssistido} className="h-full w-auto p-2" alt="Assinatura Assistido" />
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <Edit2 size={32} className="mx-auto text-slate-300" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tocar para Assinar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 7. SEÇÃO: Registro Fotográfico */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">7. Fotos</h2>
                            </div>
                            <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{formData.fotos.length} ANEXOS</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <FileInput onFileSelect={handlePhotoSelect} className="h-32" />
                            {formData.fotos.map(foto => (
                                <div key={foto.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 group shadow-sm">
                                    <img src={foto.data || foto} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(foto.id)}
                                        className="absolute top-2 right-2 bg-red-600/80 backdrop-blur-md text-white p-1.5 rounded-xl shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-2">
                                        <input
                                            className="w-full bg-transparent border-none text-[10px] text-white placeholder-white/70 focus:ring-0 p-0 font-bold"
                                            placeholder="Legenda..."
                                            value={foto.legenda || ''}
                                            onChange={e => updatePhotoCaption(foto.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Botões de Ação */}
                    <div className="pt-8 space-y-4">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-16 rounded-3xl text-lg relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="relative flex items-center gap-3">
                                {saving ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
                                <span>{saving ? 'PROCESSANDO...' : 'FINALIZAR E SALVAR'}</span>
                            </div>
                        </Button>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGeneratePDF}
                                className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                                <Share size={18} className="mr-2" /> RELATÓRIO PDF
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => initialData ? setShowDeleteModal(true) : onBack()}
                                className="h-14 rounded-2xl border-2 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                                <Trash2 size={18} className="mr-2" /> {initialData ? 'EXCLUIR' : 'CANCELAR'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Admin Feature: Gerar Despacho - Only for Coordinators */}
            {
                ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'admin'].includes(userProfile?.role) && (
                    <div className="fixed bottom-24 right-4 z-40">
                        <button
                            onClick={() => setShowDespachoModal(true)}
                            className="bg-slate-800 text-white p-4 rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center animate-in zoom-in spin-in-12 duration-500 hover:scale-110 transition-transform"
                            title="Gerar Despacho Administrativo"
                        >
                            <FileText size={24} />
                        </button>
                        <span className="absolute right-16 top-2 text-xs font-bold bg-white px-2 py-1 rounded-md shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Novo Despacho
                        </span>
                    </div>
                )
            }

            <DespachoModal
                isOpen={showDespachoModal}
                onClose={() => setShowDespachoModal(false)}
                vistoriaData={formData}
                userProfile={userProfile}
            />

            {/* AI Comparison Modal - Safe & Explicit */}
            {
                comparisonContent && (
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
                )
            }

            {/* Signature Modal */}
            {
                showSignaturePad && (
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
                )
            }

            {/* Deletion Safety Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteFromForm}
                title="Excluir Vistoria"
                message={`Tem certeza que deseja excluir permanentemente a vistoria #${formData.vistoriaId}?`}
                confirmText="Sim, Excluir Agora"
                cancelText="Não, Voltar"
            />
        </div >
    )
}

export default VistoriaForm
