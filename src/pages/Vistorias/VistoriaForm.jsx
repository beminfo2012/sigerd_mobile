import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronLeft, ChevronRight, MapPin, Crosshair, Save, Share, Trash2, Camera, ClipboardCheck, Users, Edit2, CheckCircle2, CheckCircle, Circle, Sparkles, ArrowLeft, Siren, X, FileText, RefreshCw, Download, Maximize2, Zap, Search, Printer } from 'lucide-react'
import { CHECKLIST_DATA } from '../../data/checklists'
import { saveVistoriaOffline, getRemoteVistoriasCache, getAllVistoriasLocal, deleteVistoriaLocal } from '../../services/db'
import { supabase } from '../../services/supabase'
import FileInput from '../../components/FileInput'
import { UserContext } from '../../App'
import { generatePDF } from '../../utils/pdfGenerator'
import { compressImage, extractMetadata } from '../../utils/imageOptimizer'
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

const bairrosData = bairrosDataRaw
    .filter(b => b.nome)
    .map(b => ({ nome: b.nome.trim() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));


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

const STRUCTURAL_DETAILED_CHECKLIST = [
    {
        title: "1. TERRENO E ENTORNO",
        groups: [
            {
                label: "Movimentação do terreno",
                options: ["Não apresenta patologia", "Pequenos indícios", "Erosão", "Recalque", "Afundamento", "Talude instável"]
            },
            {
                label: "Drenagem",
                options: ["Adequada", "Deficiente", "Água acumulada", "Infiltração próxima à fundação"]
            }
        ]
    },
    {
        title: "2. FUNDAÇÕES",
        options: ["Não apresenta patologia", "Trincas na base", "Recalque localizado", "Desnivelamento do piso", "Deslocamento solo/estrutura", "Afundamento significativo"]
    },
    {
        title: "3. PILARES",
        options: ["Não apresenta patologia", "Fissura superficial", "Trinca estrutural", "Armadura exposta", "Concreto deteriorado", "Esmagamento", "Pilar inclinado"]
    },
    {
        title: "4. VIGAS",
        options: ["Não apresenta patologia", "Fissuras", "Trinca diagonal", "Deformação", "Armadura exposta", "Concreto deteriorado", "Risco de ruptura"]
    },
    {
        title: "5. LAJES",
        options: ["Não apresenta patologia", "Fissuras", "Flecha excessiva", "Infiltração", "Armadura exposta", "Desplacamento do concreto", "Colapso parcial"]
    },
    {
        title: "6. PAREDES E ALVENARIA",
        options: ["Não apresenta patologia", "Trinca horizontal", "Trinca vertical", "Trinca diagonal", "Trincas em portas/janelas", "Parede fora de prumo", "Abaulamento", "Deslocamento estrutural"]
    },
    {
        title: "7. COBERTURA",
        groups: [
            {
                label: "Estrutura do telhado",
                options: ["Não apresenta patologia", "Madeira deteriorada", "Estrutura metálica corroída", "Deformação estrutural", "Risco de colapso"]
            },
            {
                label: "Telhas",
                options: ["Sem problemas", "Telhas deslocadas", "Telhas quebradas", "Risco de queda"]
            }
        ]
    },
    {
        title: "8. INDÍCIOS DE MOVIMENTAÇÃO ESTRUTURAL",
        options: ["Não observado", "Portas não fecham", "Janelas travando", "Piso desnivelado", "Degraus deslocados", "Estrutura inclinada"]
    },
    {
        title: "9. INFILTRAÇÕES E UMIDADE",
        options: ["Não apresenta patologia", "Umidade ascendente", "Infiltração em paredes", "Infiltração em laje", "Mofo/bolor", "Eflorescência"]
    },
    {
        title: "10. INTERVENÇÕES ESTRUTURAIS IRREGULARES",
        options: ["Não identificado", "Remoção de parede", "Ampliação sem projeto", "Corte em vigas", "Corte em pilares", "Sobrecarga estrutural"]
    },
    {
        title: "11. ELEMENTOS EXTERNOS COM RISCO",
        options: ["Não identificado", "Marquise com fissuras", "Sacada com trincas", "Muro inclinado", "Caixa d’água comprometida", "Estrutura com risco de queda"]
    }
]

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
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);

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
        informacoes_complementares: '',
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
        checklistRespostas: {}, // { "pergunta": true/false }
        temApoioTecnico: false
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
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null)

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

            const formatDateTime = (val) => {
                if (!val) return '';
                try {
                    const d = new Date(val);
                    if (isNaN(d.getTime())) return val;
                    // Format to YYYY-MM-DDTHH:mm
                    return d.toISOString().slice(0, 16);
                } catch (e) { return val; }
            };

            setFormData({
                ...initialData,
                // Map snake_case from DB to camelCase for form state
                vistoriaId: initialData.vistoria_id || initialData.vistoriaId,
                dataHora: formatDateTime(initialData.data_hora || initialData.dataHora),
                categoriaRisco: initialData.categoria_risco || initialData.categoriaRisco || '',
                subtiposRisco: Array.isArray(initialData.subtipos_risco || initialData.subtiposRisco) ? (initialData.subtipos_risco || initialData.subtiposRisco) : [],
                nivelRisco: initialData.nivel_risco || initialData.nivelRisco || 'Baixo',
                situacaoObservada: initialData.situacao_observada || initialData.situacaoObservada || 'Estabilizado',
                populacaoEstimada: initialData.populacao_estimada || initialData.populacaoEstimada || '',
                gruposVulneraveis: Array.isArray(initialData.grupos_vulneraveis || initialData.gruposVulneraveis) ? (initialData.grupos_vulneraveis || initialData.gruposVulneraveis) : [],
                medidasTomadas: Array.isArray(initialData.medidas_tomadas || initialData.medidasTomadas) ? (initialData.medidas_tomadas || initialData.medidasTomadas) : [],
                encaminhamentos: Array.isArray(initialData.encaminhamentos) ? initialData.encaminhamentos : [],
                informacoes_complementares: initialData.informacoes_complementares || initialData.informacoesComplementares || '',
                assinaturaAgente: initialData.assinatura_agente || initialData.assinaturaAgente || null,
                apoioTecnico: {
                    nome: apoio?.nome || '',
                    crea: apoio?.crea || '',
                    matricula: apoio?.matricula || '',
                    assinatura: apoio?.assinatura || null
                },
                checklistRespostas: parseJSON(initialData.checklist_respostas || initialData.checklistRespostas, {}),
                temApoioTecnico: !!(apoio?.nome || apoio?.assinatura),
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
                        // Extract metadata from file
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

    const downloadPhoto = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename || `foto-vistoria-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const nextPhoto = () => {
        if (selectedPhotoIndex === null) return;
        setSelectedPhotoIndex((prev) => (prev + 1) % formData.fotos.length);
    };

    const prevPhoto = () => {
        if (selectedPhotoIndex === null) return;
        setSelectedPhotoIndex((prev) => (prev - 1 + formData.fotos.length) % formData.fotos.length);
    };

    const handleGeneratePDF = async () => {
        const id = formData.id || formData.vistoria_id || formData.vistoriaId;
        if (!id) {
            toast.warning('Ação Necessária', 'Por favor, salve a vistoria primeiro para gerar o PDF neste modelo.');
            return;
        }
        window.open(`/vistorias/imprimir/${id}`, '_blank');
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

                    {/* 2. SEÇÃO: Responsável Técnico */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">2. Responsável Técnico</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>Agente</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.agente}
                                    onChange={e => setFormData({ ...formData, agente: e.target.value })}
                                    placeholder="Nome do Agente"
                                />
                            </div>
                            <div className="space-y-2">
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
                    </Card>

                    {/* 3. SEÇÃO: Solicitante */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">3. Solicitante</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className={labelClasses}>Nome Completo</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.solicitante}
                                    onChange={e => setFormData({ ...formData, solicitante: e.target.value })}
                                    placeholder="Nome completo do solicitante/morador"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className={labelClasses}>{docType}</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocType('CPF')
                                                    setFormData(prev => ({ ...prev, cpf: '' }))
                                                }}
                                                className={`text-[9px] px-2 py-1 rounded-md font-black transition-all ${docType === 'CPF' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                CPF
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocType('CNPJ')
                                                    setFormData(prev => ({ ...prev, cpf: '' }))
                                                }}
                                                className={`text-[9px] px-2 py-1 rounded-md font-black transition-all ${docType === 'CNPJ' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                CNPJ
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="tel"
                                        className={inputClasses}
                                        placeholder={docType === 'CPF' ? "000.000.000-00" : "00.000.000/0000-00"}
                                        value={formData.cpf}
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
                                            setFormData({ ...formData, cpf: v });
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Telefone</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none pointer-events-none group-focus-within:text-blue-500 transition-colors">(27)</span>
                                        <input
                                            type="tel"
                                            className={`${inputClasses} pl-12`}
                                            placeholder="90000-0000"
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
                    </Card>

                    {/* 4. SEÇÃO: Local da Ocorrência */}
                    <Card className="p-6 sm:p-8 space-y-6 dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-sm uppercase tracking-[3px]">4. Local da Ocorrência</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <SearchableInput
                                        label="Bairro"
                                        placeholder="Selecione o bairro..."
                                        value={formData.bairro}
                                        onChange={val => setFormData({ ...formData, bairro: val })}
                                        options={bairrosData.map(b => b.nome).sort()}
                                        labelClasses={labelClasses}
                                        inputClasses={inputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Informações Complementares</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Próximo à igreja, casa azul..."
                                        className={inputClasses}
                                        value={formData.informacoes_complementares}
                                        onChange={e => setFormData({ ...formData, informacoes_complementares: e.target.value })}
                                    />
                                </div>
                                <div className="sm:col-span-2 space-y-2">
                                    <label className={labelClasses}>Coordenadas (Lat, Lng)</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                className={inputClasses}
                                                value={formData.coordenadas}
                                                placeholder="-20.1234, -40.1234"
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
                                        </div>
                                        <button
                                            type="button"
                                            onClick={getLocation}
                                            disabled={gettingLoc}
                                            className="p-3.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            <Crosshair size={20} className={gettingLoc ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
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

                            {formData.categoriaRisco === 'Estrutural' && (
                                <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/30">
                                                <ClipboardCheck size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-xl uppercase tracking-tight">
                                                    Checklist Estrutural
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Diagnóstico Técnico Detalhado</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {Object.keys(formData.checklistRespostas).filter(k => k.startsWith('structural:')).length} Itens Marcados
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {STRUCTURAL_DETAILED_CHECKLIST.map((section, sIdx) => {
                                            const sectionAnswers = Object.keys(formData.checklistRespostas).filter(k => k.startsWith(`structural:${section.title}:`));
                                            const hasIssues = sectionAnswers.some(k => {
                                                const parts = k.split(':');
                                                const opt = parts[parts.length - 1];
                                                return !["Não apresenta patologia", "Não identificado", "Não observado", "Sem problemas", "OK", "Funcionando", "Adequada", "Desobstruídas"].includes(opt);
                                            });
                                            const isClean = sectionAnswers.length > 0 && !hasIssues;

                                            return (
                                                <div key={sIdx} className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col bg-white dark:bg-slate-900/50 shadow-sm ${hasIssues
                                                    ? 'border-amber-200 dark:border-amber-900/30 bg-amber-50/20'
                                                    : isClean
                                                        ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/20'
                                                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-md'}`}>

                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                                            {section.title}
                                                        </h4>
                                                        <div className="flex gap-2">
                                                            {hasIssues && <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-bold"><AlertTriangle size={12} /> ALERTA</div>}
                                                            {isClean && <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold"><CheckCircle2 size={12} /> NORMAL</div>}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {section.groups ? (
                                                            <div className="grid grid-cols-1 gap-4">
                                                                {section.groups.map((group, gIdx) => (
                                                                    <div key={gIdx} className="space-y-2.5">
                                                                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block pl-1">{group.label}</label>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {group.options.map(opt => {
                                                                                const key = `structural:${section.title}:${group.label}:${opt}`;
                                                                                const isSelected = formData.checklistRespostas[key];
                                                                                const isNeg = ["Não apresenta patologia", "Não identificado", "Não observado", "Sem problemas", "OK", "Funcionando", "Adequada", "Desobstruídas"].includes(opt);
                                                                                return (
                                                                                    <button
                                                                                        key={opt}
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            setFormData(prev => {
                                                                                                const newRes = { ...prev.checklistRespostas };
                                                                                                if (isNeg) {
                                                                                                    Object.keys(newRes).forEach(k => {
                                                                                                        if (k.startsWith(`structural:${section.title}:${group.label}:`)) delete newRes[k];
                                                                                                    });
                                                                                                    newRes[key] = true;
                                                                                                } else {
                                                                                                    const negOpts = ["Não apresenta patologia", "Não identificado", "Não observado", "Sem problemas", "OK", "Funcionando", "Adequada", "Desobstruídas"];
                                                                                                    negOpts.forEach(n => {
                                                                                                        delete newRes[`structural:${section.title}:${group.label}:${n}`];
                                                                                                    });
                                                                                                    newRes[key] = !newRes[key];
                                                                                                }
                                                                                                return { ...prev, checklistRespostas: newRes };
                                                                                            });
                                                                                        }}
                                                                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm ${isSelected
                                                                                            ? isNeg
                                                                                                ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-500/20'
                                                                                                : 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-500/20'
                                                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-slate-50'}`}
                                                                                    >
                                                                                        {opt}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {section.options.map(opt => {
                                                                    const key = `structural:${section.title}:${opt}`;
                                                                    const isSelected = formData.checklistRespostas[key];
                                                                    const isNeg = ["Não apresenta patologia", "Não identificado", "Não observado", "Sem problemas", "OK", "Funcionando", "Adequada", "Desobstruídas"].includes(opt);
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData(prev => {
                                                                                    const newRes = { ...prev.checklistRespostas };
                                                                                    if (isNeg) {
                                                                                        Object.keys(newRes).forEach(k => {
                                                                                            if (k.startsWith(`structural:${section.title}:`)) delete newRes[k];
                                                                                        });
                                                                                        newRes[key] = true;
                                                                                    } else {
                                                                                        const negOpts = ["Não apresenta patologia", "Não identificado", "Não observado", "Sem problemas", "OK", "Funcionando", "Adequada", "Desobstruídas"];
                                                                                        negOpts.forEach(n => {
                                                                                            delete newRes[`structural:${section.title}:${n}`];
                                                                                        });
                                                                                        newRes[key] = !newRes[key];
                                                                                    }
                                                                                    return { ...prev, checklistRespostas: newRes };
                                                                                });
                                                                            }}
                                                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm ${isSelected
                                                                                ? isNeg
                                                                                    ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-500/20'
                                                                                    : 'bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-500/20'
                                                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-slate-50'}`}
                                                                        >
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer Section - Multi-media and Consolidation */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-4">
                                            <h4 className="text-[11px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[3px] pl-1">
                                                12. DOCUMENTAÇÃO E REGISTROS
                                            </h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'fotos', label: 'Fotos', icon: <Camera size={20} />, checked: formData.fotos.length > 0, color: 'emerald' },
                                                    { id: 'croqui', label: 'Croqui', icon: <FileText size={20} />, checked: formData.checklistRespostas['structural:16:croqui'], color: 'indigo' },
                                                    { id: 'video', label: 'Vídeo', icon: <Zap size={20} />, checked: formData.checklistRespostas['structural:16:video'], color: 'blue' }
                                                ].map(reg => (
                                                    <div
                                                        key={reg.id}
                                                        onClick={() => {
                                                            if (reg.id === 'fotos') return;
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                checklistRespostas: {
                                                                    ...prev.checklistRespostas,
                                                                    [`structural:16:${reg.id}`]: !prev.checklistRespostas[`structural:16:${reg.id}`]
                                                                }
                                                            }))
                                                        }}
                                                        className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-3 transition-all duration-300 ${reg.checked
                                                            ? `bg-${reg.color}-500/10 border-${reg.color}-500 text-${reg.color}-600 shadow-lg shadow-${reg.color}-500/10`
                                                            : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-900/50'}`}
                                                    >
                                                        <div className={`p-3 rounded-xl ${reg.checked ? `bg-${reg.color}-500 text-white shadow-lg` : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                                            {reg.icon}
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-wider">{reg.label}</span>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${reg.checked ? `bg-${reg.color}-500 text-white scale-110 shadow-md` : 'bg-slate-100 dark:bg-slate-700'}`}>
                                                            {reg.checked && <CheckCircle2 size={14} />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-end gap-5">
                                            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/20 shadow-inner">
                                                <p className="text-xs sm:text-sm text-indigo-700/80 dark:text-indigo-400/80 font-medium leading-relaxed">
                                                    Ao finalizar a marcação dos itens acima, utilize o botão de consolidação para converter o checklist em um texto técnico profissional para o relatório.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const answers = Object.keys(formData.checklistRespostas)
                                                        .filter(k => k.startsWith('structural:') && formData.checklistRespostas[k]);

                                                    if (answers.length === 0) return alert("Marque pelo menos um item para consolidar.");

                                                    const sections = {};
                                                    answers.forEach(key => {
                                                        const parts = key.split(':');
                                                        const sectionTitle = parts[1];
                                                        const content = parts[parts.length - 1];
                                                        if (!sections[sectionTitle]) sections[sectionTitle] = [];
                                                        sections[sectionTitle].push(content);
                                                    });

                                                    let text = "\n--- DIAGNÓSTICO ESTRUTURAL ---\n";
                                                    Object.entries(sections).forEach(([title, items]) => {
                                                        text += `${title}: ${items.join(", ")}\n`;
                                                    });

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        observacoes: text + (prev.observacoes || "")
                                                    }));
                                                }}
                                                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                                            >
                                                <RefreshCw size={20} className="animate-spin-slow" />
                                                CONSOLIDAR DIAGNÓSTICO
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.categoriaRisco && formData.categoriaRisco !== 'Estrutural' && CHECKLIST_DATA[formData.categoriaRisco] && (
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
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const simAnswers = Object.keys(formData.checklistRespostas).filter(k => formData.checklistRespostas[k] && !k.startsWith('structural:'));
                                            if (simAnswers.length === 0) return alert("Marque pelo menos um item para consolidar.");
                                            const text = `CONSTATAÇÕES TÉCNICAS:\n${simAnswers.map(a => `[SIM] ${a}`).join('\n')}\n\n`;
                                            setFormData(prev => ({ ...prev, observacoes: text + prev.observacoes }));
                                        }}
                                        className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        Consolidar em Observações
                                    </button>
                                </div>
                            )}

                            {/* Subtipos de Risco Dinâmicos */}
                            {formData.categoriaRisco && RISK_DATA[formData.categoriaRisco] && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className={labelClasses}>Subtipos de Risco</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {RISK_DATA[formData.categoriaRisco].map(sub => (
                                            <button
                                                key={sub}
                                                type="button"
                                                onClick={() => toggleArrayItem('subtiposRisco', sub)}
                                                className={`p-4 rounded-xl text-left text-sm font-bold border-2 transition-all flex items-center justify-between ${formData.subtiposRisco.includes(sub) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}
                                            >
                                                {sub}
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${formData.subtiposRisco.includes(sub) ? 'bg-white border-white text-indigo-600' : 'border-slate-200 dark:border-slate-600'}`}>
                                                    {formData.subtiposRisco.includes(sub) && <CheckCircle2 size={14} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className={labelClasses}>Nível de Risco</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'Baixo', label: 'Baixo', color: 'bg-emerald-500' },
                                        { id: 'Médio', label: 'Moderado', color: 'bg-amber-500' },
                                        { id: 'Alto', label: 'Alto', color: 'bg-orange-600' },
                                        { id: 'Iminente', label: 'Muito Alto / Iminente', color: 'bg-red-600' }
                                    ].map(nivel => (
                                        <button
                                            key={nivel.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, nivelRisco: nivel.id })}
                                            className={`p-3 rounded-xl font-black text-[9px] uppercase tracking-wider border-2 transition-all ${formData.nivelRisco === nivel.id
                                                ? `${nivel.color} text-white border-transparent shadow-lg scale-105`
                                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700'
                                                }`}
                                        >
                                            {nivel.label}
                                        </button>
                                    ))}
                                </div>
                                {formData.nivelRisco === 'Iminente' && (
                                    <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-pulse">
                                        <AlertTriangle size={20} className="shrink-0" />
                                        <p className="text-xs font-bold leading-tight uppercase tracking-tight">Risco Iminente exige registro fotográfico obrigatório e recomendações técnicas imediatas.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className={labelClasses}>Situação Observada</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['Ativo', 'Em evolução', 'Estabilizado', 'Recorrente'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, situacaoObservada: s })}
                                            className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${formData.situacaoObservada === s
                                                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-md scale-105'
                                                : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Users size={20} className="text-blue-600" />
                                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-[10px] uppercase tracking-[2px]">População Exposta</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nº Estimado de Pessoas</label>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="Ex: 5"
                                            className={inputClasses}
                                            value={formData.populacaoEstimada}
                                            onChange={e => setFormData({ ...formData, populacaoEstimada: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Crianças', 'Idosos', 'PCD'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => toggleArrayItem('gruposVulneraveis', g)}
                                                className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.gruposVulneraveis.includes(g)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
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

                            {/* Checklist Medidas */}
                            <div className="space-y-4">
                                <label className={labelClasses}>Medidas e Recomendações</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                    {[
                                        'Orientação ao responsável',
                                        'Notificação preventiva',
                                        'Solicitação de laudo estrutural',
                                        'Monitoramento',
                                        'Escoramento emergencial',
                                        'Interdição parcial',
                                        'Interdição total',
                                        'Isolamento da área',
                                        'Acionamento de outro órgão'
                                    ].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => toggleArrayItem('medidasTomadas', m)}
                                            className={`p-3 rounded-xl text-left text-xs font-bold border-2 transition-all flex items-center justify-between ${formData.medidasTomadas.includes(m) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}
                                        >
                                            {m}
                                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${formData.medidasTomadas.includes(m) ? 'bg-white border-white text-blue-600' : 'border-slate-200 dark:border-slate-600'}`}>
                                                {formData.medidasTomadas.includes(m) && <CheckCircle size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 8. Encaminhamentos */}
                            <div className="space-y-4">
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
                                    <div className="flex flex-wrap gap-2">
                                        {formData.encaminhamentos.map(enc => (
                                            <button
                                                key={enc}
                                                type="button"
                                                onClick={() => toggleArrayItem('encaminhamentos', enc)}
                                                className="px-4 py-2 rounded-xl text-xs font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900 transition-colors group"
                                            >
                                                {enc}
                                                <Trash2 size={12} className="text-blue-400 group-hover:text-red-500" />
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                <div className="flex justify-between items-center px-1">
                                    <label className={labelClasses}>Assinatura do Agente</label>
                                    {userProfile?.signature && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, assinaturaAgente: userProfile.signature }))}
                                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-700 transition-colors"
                                        >
                                            <Sparkles size={12} /> Auto-assinar
                                        </button>
                                    )}
                                </div>
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

                        {/* Toggle de Apoio Técnico */}
                        <div className="flex justify-center pt-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, temApoioTecnico: !prev.temApoioTecnico }))}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all border-2 shadow-sm ${formData.temApoioTecnico
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/20'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.temApoioTecnico ? 'bg-white border-white text-indigo-600' : 'border-slate-200 dark:border-slate-600'}`}>
                                    {formData.temApoioTecnico && <CheckCircle size={12} />}
                                </div>
                                Houve Apoio Técnico nesta Vistoria?
                            </button>
                        </div>

                        {/* Bloco de Apoio Técnico */}
                        {formData.temApoioTecnico && (
                            <div className="border-t border-slate-50 dark:border-slate-700/50 pt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-[2px] mb-6 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                                        Apoio Técnico (Obras/Engenharia)
                                    </h3>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nome do Técnico</label>
                                                <input
                                                    type="text"
                                                    className={inputClasses}
                                                    value={formData.apoioTecnico.nome}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        apoioTecnico: { ...prev.apoioTecnico, nome: e.target.value }
                                                    }))}
                                                    placeholder="Nome completo"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">CREA/CAU</label>
                                                <input
                                                    type="text"
                                                    className={inputClasses}
                                                    value={formData.apoioTecnico.crea}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        apoioTecnico: { ...prev.apoioTecnico, crea: e.target.value }
                                                    }))}
                                                    placeholder="000.000-0"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Matrícula</label>
                                                <input
                                                    type="text"
                                                    className={inputClasses}
                                                    value={formData.apoioTecnico.matricula}
                                                    onChange={e => setFormData(prev => ({
                                                        ...prev,
                                                        apoioTecnico: { ...prev.apoioTecnico, matricula: e.target.value }
                                                    }))}
                                                    placeholder="Matrícula"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Assinatura do Apoio</label>
                                                {userProfile?.signature && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ 
                                                            ...prev, 
                                                            apoioTecnico: { ...prev.apoioTecnico, assinatura: userProfile.signature } 
                                                        }))}
                                                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-700 transition-colors"
                                                    >
                                                        <Sparkles size={12} /> Auto-assinar
                                                    </button>
                                                )}
                                            </div>
                                            <div
                                                onClick={() => { setActiveSignatureType('apoio'); setShowSignaturePad(true); }}
                                                className="h-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-500/50 transition-all shadow-inner"
                                            >
                                                {formData.apoioTecnico.assinatura ? (
                                                    <img src={formData.apoioTecnico.assinatura} className="h-full w-auto p-2" alt="Assinatura Apoio" />
                                                ) : (
                                                    <div className="text-center space-y-1">
                                                        <Edit2 size={24} className="mx-auto text-slate-300" />
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tocar para Assinar</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            {formData.fotos.map((foto, idx) => (
                                <div key={foto.id} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 group shadow-sm bg-slate-50 dark:bg-slate-900">
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
                                <Printer size={18} className="mr-2" /> IMPRIMIR PDF
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
                        title={
                            activeSignatureType === 'agente' ? "Assinatura do Agente" :
                                activeSignatureType === 'assistido' ? "Assinatura do Assistido" :
                                    "Assinatura do Apoio Técnico"
                        }
                        onCancel={() => setShowSignaturePad(false)}
                        onSave={(dataUrl) => {
                            if (activeSignatureType === 'agente') {
                                setFormData(prev => ({ ...prev, assinaturaAgente: dataUrl }))
                            } else if (activeSignatureType === 'assistido') {
                                setFormData(prev => ({ ...prev, assinaturaAssistido: dataUrl }))
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

            {/* Foto Lightbox / Popup */}
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
                                    downloadPhoto(foto.data || foto, `vistoria-${formData.vistoriaId}-foto-${selectedPhotoIndex + 1}.jpg`);
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
                    <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
                        <img
                            src={formData.fotos[selectedPhotoIndex]?.data || formData.fotos[selectedPhotoIndex]}
                            className="w-full h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-300"
                            alt="Visualização em tela cheia"
                        />
                    </div>

                    {/* Miniaturas Inferiores */}
                    <div className="absolute bottom-10 flex gap-2 overflow-x-auto p-4 max-w-full no-scrollbar" onClick={e => e.stopPropagation()}>
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
            )}
        </div >
    )
}

export default VistoriaForm
