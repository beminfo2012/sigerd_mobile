import React, { useState, useEffect, useContext, useRef } from 'react';
import NortisQuickSearch from '../../components/NortisQuickSearch';
import RichTextEditor from '../../components/Editor/RichTextEditor';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, MapPin, Share2, Camera, ShieldAlert,
    ChevronDown, ChevronUp, CheckCircle, Plus, Minus, FileText, Share,
    Edit2, Trash2, ChevronLeft, ChevronRight, X, Download, Sparkles, Search, FileUp, AlertCircle
} from 'lucide-react';
import FileInput from '../../components/FileInput';
import ImageEditor from '../../components/ImageEditor';
import SignaturePadComp from '../../components/SignaturePad';
import { saveOcorrenciaLocal, getOcorrenciaById, INITIAL_OCORRENCIA_STATE } from '../../services/ocorrenciasDb';
import { initDB } from '../../services/db';
import { supabase } from '../../services/supabase';
import { useToast } from '../../components/ToastNotification';
import { UserContext } from '../../App';
import bairrosDataRaw from '../../data/Bairros.json';
import logradourosDataRaw from '../../data/nomesderuas.json';

// CONSTANTS & OPTIONS
const bairrosData = bairrosDataRaw;
const logradourosData = logradourosDataRaw
    .filter(item => item["Logradouro (Rua, Av. e etc)"])
    .map(item => ({
        nome: item["Logradouro (Rua, Av. e etc)"].trim(),
        bairro: item["Bairro"] ? item["Bairro"].trim() : ""
    }));
const ORGAOS_OPTIONS = ['Defesa Civil', 'Bombeiros', 'SECOBR', 'Agropecuária', 'Saúde', 'Assistência Social', 'Outro'];
const TIPO_OCORRENCIA_OPTIONS = [
    'Poda/queda de árvore', 'Vistoria de imóvel', 'Reclamação de rachadura/trinca',
    'Animal em via pública', 'Apoio a outro órgão', 'Deslizamento/escorregamento',
    'Alagamento/enchente', 'Vendaval/destelhamento', 'Incêndio (encaminhar Bombeiros)',
    'Acidente com vítima (encaminhar Bombeiros/SAMU)', 'Outros'
];
const NIVEL_GRAVIDADE_OPTIONS = ['Baixo', 'Médio', 'Alto', 'Iminente'];
const DESCRICAO_CHIPS = [
    'Sem risco aparente', 'Risco estrutural', 'Risco geológico', 'Área isolada',
    'Família desalojada', 'Família desabrigada', 'Lona fornecida', 'Cesta básica fornecida'
];

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

    const filteredOptions = (options || []).filter(opt =>
        opt && typeof opt === 'string' && opt.toLowerCase().includes((search || '').toLowerCase())
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
                    <span className={value ? 'text-slate-800' : 'text-slate-400'}>
                        {value || placeholder}
                    </span>
                    <Search size={16} className="text-slate-300" />
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 w-full max-w-xl mx-auto flex flex-col max-h-[85vh] overflow-hidden shadow-2xl rounded-2xl">
                        <div className="p-6 border-b border-slate-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{label}</h3>
                                <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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
                                        className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 font-bold text-slate-600 transition-colors"
                                    >
                                        {opt}
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-400 font-bold">
                                    Nenhum resultado encontrado.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CHIPS_DESCRICAO = {
    'Árvores e vegetação': ["Árvore caída na via", "Árvore com risco de queda", "Galho comprometendo rede elétrica", "Raiz danificando estrutura/calçada"],
    'Estruturas e edificações': ["Rachadura visível na parede", "Trinca estrutural aparente", "Infiltração de água", "Telhado danificado/destelhado", "Muro com risco de desabamento", "Desabamento parcial de estrutura", "Desabamento total de estrutura", "Imóvel com recalque de fundação"],
    'Água e drenagem': ["Residência alagada", "Via pública alagada", "Bueiro obstruído", "Transbordamento de córrego/rio", "Erosão às margens de curso d'água", "Assoreamento de drenagem"],
    'Encostas e solo': ["Deslizamento de terra", "Escorregamento de talude", "Rachadura no solo", "Erosão em encosta", "Risco de deslizamento identificado"],
    'Vias e trânsito': ["Via interditada", "Via parcialmente obstruída", "Ponte/passarela danificada", "Queda de poste/fiação", "Sinalização de trânsito danificada"],
    'Pessoas e vulnerabilidade': ["Morador idoso em situação de risco", "Presença de pessoa com mobilidade reduzida", "Necessidade de evacuação imediata", "Família removida preventivamente", "Ausência de moradores no momento da vistoria"],
    'Animais': ["Animal de grande porte na via", "Animal silvestre em área urbana", "Necessidade de resgate de animal"],
    'Diversos / apoio': ["Solicitado apoio de outro órgão", "Local já monitorado anteriormente", "Reincidência de ocorrência no mesmo ponto", "Sem constatação de risco no momento da vistoria", "Vistoria realizada sem intercorrências"]
};

// COMPONENTS
const StepperInput = ({ label, value, onChange }) => (
    <div className="flex flex-col space-y-2 mb-4 w-full">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
        <div className="flex items-center space-x-1 sm:space-x-2">
            <button
                type="button"
                onClick={() => onChange(Math.max(0, (value || 0) - 1))}
                className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
            >
                <Minus size={18} className="text-slate-600" />
            </button>
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                className="w-full min-w-0 h-10 sm:h-12 text-center text-base sm:text-lg font-black bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
            />
            <button
                type="button"
                onClick={() => onChange((value || 0) + 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center bg-blue-100 rounded-lg active:bg-blue-200 transition-colors"
            >
                <Plus size={18} className="text-blue-600" />
            </button>
        </div>
    </div>
);

export default function OcorrenciasForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const userProfile = useContext(UserContext);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [importingPdf, setImportingPdf] = useState(false);
    const [unrecognizedFields, setUnrecognizedFields] = useState({});
    const fileInputPdfRef = useRef(null);
    const [formData, setFormData] = useState(INITIAL_OCORRENCIA_STATE);
    const [isNortisIAOpen, setIsNortisIAOpen] = useState(false);
    
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Photo and Signature states
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    const [editingPhotoIndex, setEditingPhotoIndex] = useState(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [activeSignatureType, setActiveSignatureType] = useState('agente');
    const [docType, setDocType] = useState('CPF');

    const labelClasses = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1";
    const baseInputClasses = "w-full p-3 rounded-xl border font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all";
    const getInputClass = (fieldName) => {
        if (unrecognizedFields[fieldName]) {
            return `${baseInputClasses} border-amber-400 bg-amber-50 ring-2 ring-amber-400/20 text-amber-900`;
        }
        return `${baseInputClasses} border-slate-200 bg-slate-50 text-slate-800`;
    };

    // Handlers
    const handlePhotoSelect = async (files) => {
        const currentFotos = Array.isArray(formData.fotos) ? formData.fotos : [];
        const newFotos = await Promise.all(Array.from(files).map(file => {
            return new Promise((resolve) => {
                // Se já for um objeto com dataUrl (da CameraModal, por ex)
                if (file.dataUrl) {
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        data: file.dataUrl,
                        legenda: ''
                    });
                    return;
                }
                
                // Se for um arquivo de galeria (File object)
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Math.random().toString(36).substr(2, 9),
                        data: reader.result,
                        legenda: ''
                    });
                };
                reader.readAsDataURL(file);
            });
        }));
        setFormData(prev => ({ ...prev, fotos: [...currentFotos, ...newFotos] }));
    };

    const removePhoto = (id) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.filter(f => f.id !== id)
        }));
    };

    const updatePhotoCaption = (id, legenda) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.map(f => f.id === id ? { ...f, legenda } : f)
        }));
    };

    const movePhoto = (id, direction) => {
        setFormData(prev => {
            const fotos = [...prev.fotos];
            const idx = fotos.findIndex(f => f.id === id);
            if (idx < 0) return prev;
            if (direction === 'left' && idx > 0) {
                [fotos[idx - 1], fotos[idx]] = [fotos[idx], fotos[idx - 1]];
            } else if (direction === 'right' && idx < fotos.length - 1) {
                [fotos[idx + 1], fotos[idx]] = [fotos[idx], fotos[idx + 1]];
            }
            return { ...prev, fotos };
        });
    };

    const prevPhoto = () => {
        setSelectedPhotoIndex(p => p > 0 ? p - 1 : (formData.fotos?.length || 1) - 1);
    };

    const nextPhoto = () => {
        setSelectedPhotoIndex(p => p < (formData.fotos?.length || 0) - 1 ? p + 1 : 0);
    };

    const handlePdfImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportingPdf(true);
        const formPayload = new FormData();
        formPayload.append('file', file);

        try {
            const response = await fetch('/api/importar_pdf', {
                method: 'POST',
                body: formPayload
            });
            const result = await response.json();

            if (!response.ok) {
                const errorMsg = result.message || (result.detail ? JSON.stringify(result.detail) : 'Erro ao importar PDF');
                toast.error(errorMsg);
                console.error('Erro na resposta da API:', result);
                return;
            }

            const c = result.campos || {};
            const updateFields = {
                origem: 'importacao_pdf',
                tipo_documento_origem: result.tipo,
                nome_arquivo_original: file.name,
                numero_referencia: c.numero_referencia || '',
                tipo_ocorrencia: c.natureza || '',
                data_aproximada: c.data_aproximada || '',
                endereco: c.rua || '',
                bairro: c.bairro || '',
                referencia: c.referencia || '',
                observacoes_local: c.observacoes_local || '',
                descricao: c.descricao || ''
            };

            const unrecog = {
                tipo_ocorrencia: !c.natureza,
                endereco: !c.rua,
                bairro: !c.bairro,
                descricao: !c.descricao
            };

            setFormData(prev => ({ ...prev, ...updateFields }));
            setUnrecognizedFields(unrecog);
            toast.success(`PDF ${result.tipo} importado para revisão.`);
        } catch (error) {
            console.error('Erro na importação:', error);
            toast.error('Erro ao conectar com o serviço de extração.');
        } finally {
            setImportingPdf(false);
            if (fileInputPdfRef.current) fileInputPdfRef.current.value = '';
        }
    };

    const downloadPhoto = (dataUrl, filename) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Load data
    useEffect(() => {
        const init = async () => {
            if (id && id !== 'novo') {
                const record = await getOcorrenciaById(id);
                if (record) {
                    setFormData({ ...INITIAL_OCORRENCIA_STATE, ...record });
                }
            } else {
                const now = new Date();
                setFormData(prev => ({
                    ...prev,
                    data_chamado: now.toISOString(),
                    agente: userProfile?.full_name || '',
                    matricula: userProfile?.matricula || '',
                    cargo: userProfile?.cargo || 'Agente'
                }));
            }
            setLoading(false);
        };
        init();
    }, [id, userProfile]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleChipClick = (texto) => {
        setFormData(prev => {
            const currentDesc = prev.descricao ? prev.descricao.trim() : '';
            const newDesc = currentDesc ? `${currentDesc} - ${texto}` : texto;
            return { ...prev, descricao: newDesc };
        });
    };

    const getGPS = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                }));
                toast.success('Localização atualizada');
            },
            () => toast.error('Falha ao obter GPS'),
            { enableHighAccuracy: true }
        );
    };

    const handleShare = () => {
        const text = `*Ocorrência ${formData.tipo_ocorrencia || 'Não definida'}*\n` +
                     `Gravidade: ${formData.nivel_gravidade || 'Não definida'}\n` +
                     `Endereço: ${formData.endereco || 'Não informado'}, ${formData.bairro || 'Não informado'}\n` +
                     `Coordenadas: ${formData.lat || ''}, ${formData.lng || ''}`;
        const encodedUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(encodedUrl, '_blank');
    };

    const isValid = () => {
        if (!formData.solicitante_nome && !formData.solicitante) return false;
        if (!formData.tipo_ocorrencia) return false;
        if (!formData.nivel_gravidade) return false;
        if (!formData.orgao_solicitado) return false;
        if (!formData.orgao_atendeu) return false;
        
        // Foto validation
        const totalFotos = formData.fotos?.length || 0;
        if (formData.nivel_gravidade === 'Iminente' && totalFotos < 3) return false;
        if (formData.nivel_gravidade === 'Alto' && totalFotos < 1) return false;

        return true;
    };

    const saveRecord = async (isDraft, resetAfter = false) => {
        setSaving(true);
        try {
            const finalData = {
                ...formData,
                status: isDraft ? 'Aberta' : 'Finalizada',
                encaminhada: formData.orgao_solicitado !== formData.orgao_atendeu
            };
            
            await saveOcorrenciaLocal(finalData, !navigator.onLine);
            
            toast.success('Ocorrência salva!');
            if (resetAfter) {
                setFormData({
                    ...INITIAL_OCORRENCIA_STATE,
                    data_chamado: new Date().toISOString(),
                    agente: userProfile?.full_name || '',
                    matricula: userProfile?.matricula || '',
                    cargo: userProfile?.cargo || 'Agente'
                });
                window.scrollTo(0, 0);
            } else {
                navigate('/ocorrencias');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    const showEncaminhamento = formData.orgao_solicitado !== formData.orgao_atendeu && formData.orgao_solicitado && formData.orgao_atendeu;

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Topbar */}
            <div className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/ocorrencias')} className="p-2 -ml-2 rounded-full active:bg-slate-100">
                        <ArrowLeft size={24} className="text-slate-700" />
                    </button>
                    <div>
                        <h1 className="font-black text-lg text-slate-800">Nova Ocorrência</h1>
                        <p className="text-xs font-bold text-slate-400">{formData.data_chamado ? new Date(formData.data_chamado).toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <input type="file" accept="application/pdf" ref={fileInputPdfRef} className="hidden" onChange={handlePdfImport} />
                    <button onClick={() => fileInputPdfRef.current?.click()} disabled={importingPdf} className="p-2 rounded-full text-purple-600 bg-purple-50 active:bg-purple-100 flex items-center gap-2 px-3">
                        {importingPdf ? <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span> : <FileUp size={18} />}
                        <span className="text-xs font-bold hidden sm:block">Importar PDF</span>
                    </button>
                    <button onClick={handleShare} className="p-2 rounded-full text-blue-600 bg-blue-50 active:bg-blue-100">
                        <Share size={20} />
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-4 max-w-7xl mx-auto">
                {formData.origem === 'importacao_pdf' && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl flex gap-3 text-sm font-medium">
                        <AlertCircle size={20} className="text-purple-600 flex-shrink-0" />
                        <div>
                            <strong>Importação em modo de revisão:</strong> Verifique e complete os campos abaixo antes de salvar.
                            Alguns dados do documento original ({formData.nome_arquivo_original}) podem não ter sido reconhecidos.
                        </div>
                    </div>
                )}
                {/* SOLICITANTE */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Solicitante</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Nome Completo</label>
                            <input
                                type="text"
                                className={getInputClass('solicitante_nome')}
                                value={formData.solicitante_nome || formData.solicitante || ''}
                                onChange={e => {
                                    setFormData(prev => ({ ...prev, solicitante_nome: e.target.value, solicitante: e.target.value }));
                                    setUnrecognizedFields(prev => ({ ...prev, solicitante_nome: false }));
                                }}
                                placeholder="Nome completo do solicitante/morador"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className={labelClasses}>{docType}</label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDocType('CPF');
                                                setFormData(prev => ({ ...prev, cpf: '' }));
                                            }}
                                            className={`text-[9px] px-2 py-1 rounded-md font-black transition-all ${docType === 'CPF' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            CPF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDocType('CNPJ');
                                                setFormData(prev => ({ ...prev, cpf: '' }));
                                            }}
                                            className={`text-[9px] px-2 py-1 rounded-md font-black transition-all ${docType === 'CNPJ' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            CNPJ
                                        </button>
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    className={getInputClass('cpf')}
                                    placeholder={docType === 'CPF' ? "000.000.000-00" : "00.000.000/0000-00"}
                                    value={formData.cpf || ''}
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
                                        setFormData(prev => ({ ...prev, cpf: v }));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Telefone</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none pointer-events-none group-focus-within:text-blue-500 transition-colors">(27)</span>
                                    <input
                                        type="tel"
                                        className={`${getInputClass('telefone')} pl-12`}
                                        placeholder="90000-0000"
                                        value={(formData.solicitante_telefone || formData.telefone || '').replace(/^\(27\) /, '')}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 9) v = v.slice(0, 9);
                                            v = v.replace(/^(\d{5})(\d)/, '$1-$2');
                                            setFormData(prev => ({ ...prev, solicitante_telefone: `(27) ${v}`, telefone: `(27) ${v}` }));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOCALIZAÇÃO */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Localização</h2>
                        <button onClick={getGPS} type="button" className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                            <MapPin size={14} /> OBTER GPS
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <SearchableInput
                                label="Endereço"
                                placeholder="Nome da rua, avenida..."
                                value={formData.endereco || ''}
                                onChange={val => {
                                    const found = logradourosData.find(l => l.nome.toLowerCase() === val.toLowerCase());
                                    setFormData(prev => ({
                                        ...prev,
                                        endereco: val,
                                        bairro: found ? found.bairro : prev.bairro
                                    }));
                                    setUnrecognizedFields(prev => ({ ...prev, endereco: false }));
                                }}
                                options={logradourosData
                                    .map(l => l.nome)
                                    .sort()}
                                icon={MapPin}
                                labelClasses={labelClasses}
                                inputClasses={getInputClass('endereco')}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <SearchableInput
                                    label="Bairro"
                                    placeholder="Selecione o bairro..."
                                    value={formData.bairro || ''}
                                    onChange={val => {
                                        setFormData(prev => ({ ...prev, bairro: val }));
                                        setUnrecognizedFields(prev => ({ ...prev, bairro: false }));
                                    }}
                                    options={bairrosData.map(b => b.nome).sort()}
                                    labelClasses={labelClasses}
                                    inputClasses={getInputClass('bairro')}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={labelClasses}>Complemento (opcional)</label>
                                <input
                                    type="text"
                                    className={getInputClass('complemento')}
                                    placeholder="Nº, Bloco, Referência..."
                                    value={formData.complemento || ''}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, complemento: e.target.value }));
                                    }}
                                />
                            </div>
                        </div>
                        {(formData.lat && formData.lng) && (
                            <div className="text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg text-center">
                                Lat: {Number(formData.lat).toFixed(6)}, Lng: {Number(formData.lng).toFixed(6)}
                            </div>
                        )}
                    </div>
                </div>

                {/* ATENDIMENTO */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Atendimento</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Órgão Solicitado</label>
                            <select
                                name="orgao_solicitado"
                                value={formData.orgao_solicitado || ''}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold mt-1 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {ORGAOS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Órgão que Atendeu</label>
                            <select
                                name="orgao_atendeu"
                                value={formData.orgao_atendeu || ''}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold mt-1 outline-none"
                            >
                                <option value="">Selecione...</option>
                                {ORGAOS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>

                        {showEncaminhamento && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-2 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-xs font-bold text-orange-800 uppercase mb-2">Detalhes do Encaminhamento</h3>
                                <input
                                    type="text"
                                    name="numero_ocorrencia_externa"
                                    placeholder="Nº Ocorrência Externa (Opcional)"
                                    value={formData.numero_ocorrencia_externa || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-white p-2 rounded-lg border border-orange-200 font-bold text-sm outline-none mb-2"
                                />
                                <input
                                    type="text"
                                    name="observacao_encaminhamento"
                                    placeholder="Observação"
                                    value={formData.observacao_encaminhamento || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-white p-2 rounded-lg border border-orange-200 font-bold text-sm outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* CLASSIFICAÇÃO OPERACIONAL */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Classificação Operacional</h2>
                    
                    <select
                        name="tipo_ocorrencia"
                        value={formData.tipo_ocorrencia || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold mb-4 outline-none"
                    >
                        <option value="">Tipo de Ocorrência...</option>
                        {TIPO_OCORRENCIA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>

                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Nível de Gravidade</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {NIVEL_GRAVIDADE_OPTIONS.map(nivel => (
                            <button
                                key={nivel}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, nivel_gravidade: nivel }))}
                                className={`p-2 rounded-xl text-sm font-bold border transition-colors ${
                                    formData.nivel_gravidade === nivel
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {nivel}
                            </button>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Descrição Rápida (Chips)</label>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-100 space-y-2">
                            {Object.entries(CHIPS_DESCRICAO).map(([categoria, chips]) => {
                                const availableChips = chips.filter(c => !(formData.descricao || '').includes(c));
                                if (availableChips.length === 0) return null;
                                
                                const isExpanded = expandedCategory === categoria;
                                return (
                                <div key={categoria} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                                    <button 
                                        type="button" 
                                        onClick={() => setExpandedCategory(isExpanded ? null : categoria)}
                                        className="w-full flex justify-between items-center p-2 bg-slate-100/50 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-[10px] font-black text-slate-500 uppercase">{categoria} ({availableChips.length})</span>
                                        {isExpanded ? <ChevronUp size={14} className="text-slate-400"/> : <ChevronDown size={14} className="text-slate-400"/>}
                                    </button>
                                    {isExpanded && (
                                        <div className="p-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                                            {availableChips.map(chip => (
                                                <button
                                                    key={chip}
                                                    type="button"
                                                    onClick={() => handleChipClick(chip)}
                                                    className="bg-white border border-slate-200 px-2 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left shadow-sm"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Descrição / Observações</label>
                        <button type="button" onClick={() => setIsNortisIAOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            ✨ REFERÊNCIAS
                        </button>
                    </div>
                    <RichTextEditor
                        value={formData.descricao || ''}
                        onChange={val => setFormData(prev => ({ ...prev, descricao: val }))}
                    />
                </div>

                {/* BLOCO CONDICIONAL TÉCNICO */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${formData.risco_pessoas_estruturas ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                name="risco_pessoas_estruturas"
                                checked={formData.risco_pessoas_estruturas || false}
                                onChange={handleInputChange}
                                className="peer sr-only"
                            />
                            <div className="w-6 h-6 rounded border-2 border-slate-300 peer-checked:bg-red-600 peer-checked:border-red-600 flex items-center justify-center transition-colors">
                                <CheckCircle size={16} className="text-white opacity-0 peer-checked:opacity-100" />
                            </div>
                        </div>
                        <span className="font-bold text-slate-700">Envolve risco a pessoas ou estruturas?</span>
                    </label>

                    {formData.risco_pessoas_estruturas && (
                        <div className="mt-4 pt-4 border-t border-red-200 space-y-6 animate-in slide-in-from-top-4 fade-in">
                            
                            {/* COBRADE Placeholder */}
                            <div>
                                <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">Classificação Técnica (COBRADE)</h3>
                                <select
                                    name="cobrade_grupo"
                                    value={formData.cobrade_grupo || ''}
                                    onChange={handleInputChange}
                                    className="w-full bg-white p-3 rounded-xl border border-red-200 font-bold outline-none text-sm"
                                >
                                    <option value="">Selecione o Grupo...</option>
                                    <option value="Natural">Natural</option>
                                    <option value="Tecnológico">Tecnológico</option>
                                </select>
                                {/* Cascading selects would go here in full implementation */}
                            </div>

                            {/* Danos Humanos */}
                            <div>
                                <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-3">Danos Humanos</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <StepperInput label="Mortos" value={formData.mortos} onChange={(v) => setFormData(p => ({...p, mortos: v}))} />
                                    <StepperInput label="Feridos" value={formData.feridos} onChange={(v) => setFormData(p => ({...p, feridos: v}))} />
                                    <StepperInput label="Desaparecidos" value={formData.desaparecidos} onChange={(v) => setFormData(p => ({...p, desaparecidos: v}))} />
                                    <StepperInput label="Desalojados" value={formData.desalojados} onChange={(v) => setFormData(p => ({...p, desalojados: v}))} />
                                    <StepperInput label="Desabrigados" value={formData.desabrigados} onChange={(v) => setFormData(p => ({...p, desabrigados: v}))} />
                                </div>
                            </div>

                            {/* Medidas Adotadas Placeholder */}
                            <div>
                                <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2">Medidas Adotadas</h3>
                                <div className="flex items-center justify-between mt-4 mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Observações</label>
                        <button type="button" onClick={() => setIsNortisIAOpen(true)} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            ✨ REFERÊNCIAS
                        </button>
                    </div>
                    <RichTextEditor
                        value={formData.observacoes || ''}
                        onChange={val => setFormData(prev => ({ ...prev, observacoes: val }))}
                    />
                            </div>
                        </div>
                    )}
                </div>

                    {/* FOTOS E ASSINATURAS */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Registro Fotográfico ({formData.fotos?.length || 0})</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                        <FileInput onFileSelect={handlePhotoSelect} className="h-24 sm:h-32" />
                        {formData.fotos?.map((foto, idx) => (
                            <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 group shadow-sm bg-slate-50">
                                <img
                                    src={foto.data || foto}
                                    className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                                    onClick={() => setSelectedPhotoIndex(idx)}
                                />
                                <div className="absolute top-1 inset-x-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all z-20">
                                    <div className="flex gap-0.5">
                                        {idx > 0 && (
                                            <button type="button" onClick={() => movePhoto(foto.id, 'left')} className="bg-slate-800/80 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm hover:bg-slate-700">
                                                <ChevronLeft size={14} />
                                            </button>
                                        )}
                                        {idx < formData.fotos.length - 1 && (
                                            <button type="button" onClick={() => movePhoto(foto.id, 'right')} className="bg-slate-800/80 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm hover:bg-slate-700">
                                                <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-0.5">
                                        <button type="button" onClick={() => setEditingPhotoIndex(idx)} className="bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm hover:bg-blue-600">
                                            <Edit2 size={14} />
                                        </button>
                                        <button type="button" onClick={() => removePhoto(foto.id)} className="bg-red-600/80 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm hover:bg-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-1.5 z-10">
                                    <input
                                        className="w-full bg-transparent border-none text-[9px] text-white placeholder-white/70 focus:ring-0 p-0 font-bold"
                                        placeholder="Legenda..."
                                        value={foto.legenda || ''}
                                        onChange={e => updatePhotoCaption(foto.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 mt-6">Assinaturas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Assinatura do Agente</label>
                                <div className="flex gap-2">
                                    {userProfile?.signature && (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, assinaturaAgente: userProfile.signature }))} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1">
                                            <Sparkles size={10} /> Auto
                                        </button>
                                    )}
                                    {formData.assinaturaAgente && (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, assinaturaAgente: null }))} className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                                            <Trash2 size={10} /> Limpar
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div
                                onClick={() => { setActiveSignatureType('agente'); setShowSignaturePad(true); }}
                                className="h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-blue-50/30 transition-all"
                            >
                                {formData.assinaturaAgente ? (
                                    <img src={formData.assinaturaAgente} className="h-full w-auto p-2" alt="Agente" />
                                ) : (
                                    <div className="text-center space-y-1">
                                        <Edit2 size={20} className="mx-auto text-slate-300" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Assinar</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Assinatura do Assistido</label>
                                {formData.assinaturaAssistido && (
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, assinaturaAssistido: null }))} className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                                        <Trash2 size={10} /> Limpar
                                    </button>
                                )}
                            </div>
                            <div
                                onClick={() => { setActiveSignatureType('assistido'); setShowSignaturePad(true); }}
                                className="h-28 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-blue-50/30 transition-all"
                            >
                                {formData.assinaturaAssistido ? (
                                    <img src={formData.assinaturaAssistido} className="h-full w-auto p-2" alt="Assistido" />
                                ) : (
                                    <div className="text-center space-y-1">
                                        <Edit2 size={20} className="mx-auto text-slate-300" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Assinar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ACTIONS */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-7xl mx-auto flex flex-col gap-2">
                        {(!isValid() && !saving) && (
                            <div className="text-[10px] text-center font-bold text-red-500 uppercase">
                                Preencha os campos obrigatórios (Solicitante, Tipo, Gravidade, Órgãos)
                                {(formData.nivel_gravidade === 'Iminente' || formData.nivel_gravidade === 'Alto') && ' e adicione as fotos mínimas necessárias'}
                                para finalizar.
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => saveRecord(true)}
                                disabled={saving}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg text-xs transition-colors uppercase tracking-wide"
                            >
                                Salvar Rascunho
                            </button>
                            <button
                                onClick={() => saveRecord(false)}
                                disabled={saving || !isValid()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-lg text-xs transition-colors uppercase tracking-wide shadow-md"
                            >
                                {saving ? 'Salvando...' : 'Finalizar'}
                            </button>
                        </div>
                        </div>
                    </div>
                </div>

            {/* Modals and Overlays */}
            {showSignaturePad && (
                <SignaturePadComp
                    title={activeSignatureType === 'agente' ? "Assinatura do Agente" : "Assinatura do Assistido"}
                    onCancel={() => setShowSignaturePad(false)}
                    onSave={(dataUrl) => {
                        if (activeSignatureType === 'agente') {
                            setFormData(prev => ({ ...prev, assinaturaAgente: dataUrl }));
                        } else {
                            setFormData(prev => ({ ...prev, assinaturaAssistido: dataUrl }));
                        }
                        setShowSignaturePad(false);
                    }}
                />
            )}

            {/* Foto Lightbox / Popup */}
            {selectedPhotoIndex !== null && (
                <div
                    className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[6001] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedPhotoIndex(null)}
                >
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-50">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-lg">
                                Foto {selectedPhotoIndex + 1} de {formData.fotos?.length}
                            </span>
                            {formData.fotos?.[selectedPhotoIndex]?.legenda && (
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
                                    downloadPhoto(foto.data || foto, `ocorrencia-foto-${selectedPhotoIndex + 1}.jpg`);
                                }}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all border border-white/10 shadow-xl"
                            >
                                <Download size={22} />
                            </button>
                            <button onClick={() => setSelectedPhotoIndex(null)} className="p-3 bg-red-600/20 hover:bg-red-600/40 text-red-100 rounded-2xl backdrop-blur-md transition-all border border-red-500/20 shadow-xl">
                                <X size={22} />
                            </button>
                        </div>
                    </div>

                    {(formData.fotos?.length > 1) && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 sm:left-24 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm transition-all border border-white/5 z-50">
                                <ChevronLeft size={32} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full backdrop-blur-sm transition-all border border-white/5 z-50">
                                <ChevronRight size={32} />
                            </button>
                        </>
                    )}

                    <div className="relative w-full max-w-7xl max-h-[70vh] flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
                        <img
                            src={formData.fotos[selectedPhotoIndex]?.data || formData.fotos[selectedPhotoIndex]}
                            className="w-full h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-300"
                        />
                    </div>

                    <div className="absolute bottom-10 flex gap-2 overflow-x-auto p-4 max-w-full no-scrollbar" onClick={e => e.stopPropagation()}>
                        {formData.fotos?.map((f, i) => (
                            <button key={i} onClick={() => setSelectedPhotoIndex(i)} className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedPhotoIndex === i ? 'border-white scale-110 shadow-lg' : 'border-white/20 opacity-50 hover:opacity-100'}`}>
                                <img src={f.data || f} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {editingPhotoIndex !== null && (
                <ImageEditor
                    imageUrl={formData.fotos[editingPhotoIndex].data || formData.fotos[editingPhotoIndex]}
                    onSave={(newData) => {
                        const updatedFotos = [...formData.fotos];
                        if (typeof updatedFotos[editingPhotoIndex] === 'string') {
                            updatedFotos[editingPhotoIndex] = { id: crypto.randomUUID(), data: newData, legenda: '' };
                        } else {
                            updatedFotos[editingPhotoIndex].data = newData;
                        }
                        setFormData({ ...formData, fotos: updatedFotos });
                        setEditingPhotoIndex(null);
                    }}
                    onCancel={() => setEditingPhotoIndex(null)}
                />
            )}
        
            {isNortisIAOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
                        <button onClick={() => setIsNortisIAOpen(false)} className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full z-10 transition-colors">
                            <X size={20} className="text-slate-600" />
                        </button>
                        <NortisQuickSearch 
                            onClose={() => setIsNortisIAOpen(false)} 
                            onAcceptCitation={(citacao) => {
                                setFormData(prev => ({ 
                                    ...prev, 
                                    descricao: prev.descricao ? prev.descricao + "<br><br>" + citacao : citacao 
                                }));
                            }}
                            onApplyReference={(newRef) => {
                                setFormData(prev => ({ 
                                    ...prev, 
                                    referencias_normativas: [...(prev.referencias_normativas || []), newRef] 
                                }));
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
