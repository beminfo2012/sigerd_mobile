import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, MapPin, Navigation, Shield, Users, Info, Loader2,
    RefreshCw, ShieldCheck, AlertTriangle, Sparkles, Trash2, Maximize2,
    FileText, Edit2, CheckCircle, CheckCircle2, Circle, Camera, Search,
    X, Phone, User, Fingerprint, Siren, ClipboardList, Share
} from 'lucide-react';
import { saveOcorrenciaLocal, getOcorrenciaById, INITIAL_OCORRENCIA_STATE } from '../../services/ocorrenciasDb';
import { initDB } from '../../services/db';
import { supabase } from '../../services/supabase';
import { useToast } from '../../components/ToastNotification';
import { COBRADE_LIST } from '../../utils/cobradeData';
import { CHECKLIST_DATA } from '../../data/checklists';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { UserContext } from '../../App';
import VoiceInput from '../../components/VoiceInput';
import SignaturePadComp from '../../components/SignaturePad';
import FileInput from '../../components/FileInput';
import { refineReportText } from '../../services/ai';

// Address Data Imports
import logradourosDataRaw from '../../../nomesderuas.json';

// Normalize Address Data
const logradourosData = logradourosDataRaw
    .filter(item => item["Logradouro (Rua, Av. e etc)"])
    .map(item => ({
        nome: item["Logradouro (Rua, Av. e etc)"].trim(),
        bairro: item["Bairro"] ? item["Bairro"].trim() : ""
    }));

const uniqueBairrosFromStreets = [...new Set(logradourosData.map(l => l.bairro).filter(Boolean))].sort();
const bairrosData = uniqueBairrosFromStreets.map(b => ({ nome: b }));

const OcorrenciasForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const userProfile = useContext(UserContext);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refining, setRefining] = useState(false);
    const [formData, setFormData] = useState(INITIAL_OCORRENCIA_STATE);
    const [gpsStatus, setGpsStatus] = useState('idle');

    // UI States
    const [docType, setDocType] = useState('CPF');
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [activeSignatureType, setActiveSignatureType] = useState('agente');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

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
            'Instabilidade de Fachada', 'Afundamento de Piso', 'Estrutura de Madeira com Cupim/Podridão'
        ],
        'Ambiental': [
            'Queda de Árvore', 'Risco de Queda de Árvore', 'Contaminação de Água', 'Incêndio em Vegetação',
            'Descarte de Resíduos Perigosos', 'Erosão Biológica'
        ],
        'Tecnológico': [
            'Risco Elétrico', 'Vazamento de Gás', 'Produtos Perigosos', 'Rompimento de Adutora',
            'Explosão', 'Acidente de Trânsito com Vítima'
        ],
        'Outros': ['Não listado']
    };

    useEffect(() => {
        if (id && id !== 'novo') {
            loadRecord(id);
        } else {
            const now = new Date();
            setFormData(prev => ({
                ...prev,
                data_ocorrencia: now.toLocaleDateString('pt-BR'),
                horario_ocorrencia: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                agente: userProfile?.full_name || localStorage.getItem('lastAgentName') || '',
                matricula: userProfile?.matricula || localStorage.getItem('lastAgentMatricula') || ''
            }));
            getNextId();
            captureGPS(true);
            setLoading(false);
        }
    }, [id, userProfile]);

    const getNextId = async () => {
        const currentYear = new Date().getFullYear();
        try {
            let maxNum = 0;
            const db = await initDB();
            const localRecords = await db.getAll('ocorrencias_operacionais');
            localRecords.forEach(r => {
                const oid = r.ocorrencia_id_format;
                if (oid && oid.includes(`/${currentYear}`)) {
                    const num = parseInt(oid.split('/')[0]);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            });

            if (navigator.onLine) {
                const { data } = await supabase
                    .from('ocorrencias_operacionais')
                    .select('ocorrencia_id_format')
                    .ilike('ocorrencia_id_format', `%/${currentYear}`)
                    .limit(100);

                if (data) {
                    data.forEach(r => {
                        if (r.ocorrencia_id_format) {
                            const num = parseInt(r.ocorrencia_id_format.split('/')[0]);
                            if (!isNaN(num) && num > maxNum) maxNum = num;
                        }
                    });
                }
            }

            const nextId = `${(maxNum + 1).toString().padStart(3, '0')}/${currentYear}`;
            setFormData(prev => ({ ...prev, ocorrencia_id_format: nextId }));
        } catch (e) {
            console.error('Error calculating next ID:', e);
        }
    };

    const loadRecord = async (recordId) => {
        try {
            const record = await getOcorrenciaById(recordId);
            if (record) {
                setFormData({
                    ...INITIAL_OCORRENCIA_STATE,
                    ...record
                });
                if (record.cpf) {
                    setDocType(record.cpf.length > 14 ? 'CNPJ' : 'CPF');
                }
            }
        } catch (error) {
            toast.error('Erro ao carregar registro.');
        } finally {
            setLoading(false);
        }
    };

    const captureGPS = (isInitial = false) => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        setGpsStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setFormData(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    accuracy: accuracy,
                    gps_timestamp: new Date().toISOString()
                }));
                setGpsStatus('success');
                if (!isInitial) toast.success(`Localização atualizada! Precisão: ${accuracy.toFixed(1)}m`);
            },
            (err) => {
                console.error('GPS Error:', err);
                setGpsStatus('error');
                if (!isInitial) toast.error('Não foi possível obter a localização.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleAIRefine = async () => {
        if (!formData.observacoes) return;
        setRefining(true);
        try {
            const result = await refineReportText(
                formData.observacoes,
                formData.denominacao,
                `Local: ${formData.endereco}, ${formData.bairro}.`
            );
            if (result && !result.startsWith('ERROR:')) {
                setFormData(prev => ({ ...prev, observacoes: result }));
                toast.success('Texto refinado com sucesso!');
            } else {
                toast.error(result || 'Falha no refinamento');
            }
        } catch (e) {
            toast.error('Erro ao processar IA');
        } finally {
            setRefining(false);
        }
    };

    const handlePhotoSelect = (file, base64) => {
        const newPhoto = {
            id: crypto.randomUUID(),
            data: base64,
            legenda: ''
        };
        setFormData(prev => ({ ...prev, fotos: [...prev.fotos, newPhoto] }));
    };

    const removePhoto = (id) => {
        setFormData(prev => ({ ...prev, fotos: prev.fotos.filter(f => f.id !== id) }));
    };

    const updatePhotoCaption = (id, caption) => {
        setFormData(prev => ({
            ...prev,
            fotos: prev.fotos.map(f => f.id === id ? { ...f, legenda: caption } : f)
        }));
    };

    const toggleArrayItem = (field, item) => {
        setFormData(prev => {
            const current = prev[field] || [];
            if (current.includes(item)) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            }
            return { ...prev, [field]: [...current, item] };
        });
    };

    const handleSave = async () => {
        if (!formData.denominacao) {
            toast.error('Informe o tipo de desastre.');
            return;
        }

        setSaving(true);
        try {
            const finalData = {
                ...formData,
                status: 'finalized',
                updated_at: new Date().toISOString()
            };
            await saveOcorrenciaLocal(finalData);
            toast.success('Ocorrência registrada com sucesso!');
            navigate('/ocorrencias');
        } catch (error) {
            toast.error('Falha ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const inputClasses = "w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500/50 outline-none transition-all font-bold text-sm dark:text-white placeholder:text-slate-300"
    const labelClasses = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 text-left"

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Carregando formulário...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-32 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/ocorrencias')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-95">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                {id && id !== 'novo' ? 'Editar Ocorrência' : 'Nova Ocorrência'}
                            </h1>
                            <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-[2px]">{formData.ocorrencia_id_format}</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-6 h-12"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        {saving ? 'SALVANDO...' : 'SALVAR'}
                    </Button>
                </div>
            </div>

            <main className="p-5 max-w-2xl mx-auto space-y-6">

                {/* 1. SEÇÃO: Identificação (Processo removido) */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">1. Identificação</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className={labelClasses}>Nº Ocorrência</label>
                                <button
                                    type="button"
                                    onClick={getNextId}
                                    className="text-blue-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                            <div className="text-xl font-black p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 shadow-inner">
                                {formData.ocorrencia_id_format}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>Data</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.data_ocorrencia}
                                    onChange={(e) => setFormData({ ...formData, data_ocorrencia: e.target.value })}
                                    placeholder="DD/MM/AAAA"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Horário</label>
                                <input
                                    type="text"
                                    className={inputClasses}
                                    value={formData.horario_ocorrencia}
                                    onChange={(e) => setFormData({ ...formData, horario_ocorrencia: e.target.value })}
                                    placeholder="HH:MM"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 2. SEÇÃO: Responsável Técnico (Valores automáticos editáveis) */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">2. Responsável Técnico</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Agente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className={`${inputClasses} pl-12 bg-blue-50/30 dark:bg-blue-900/10`}
                                    value={formData.agente}
                                    onChange={e => setFormData({ ...formData, agente: e.target.value })}
                                    placeholder="Carregando..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Matrícula</label>
                            <div className="relative">
                                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    className={`${inputClasses} pl-12 bg-blue-50/30 dark:bg-blue-900/10`}
                                    value={formData.matricula}
                                    onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                                    placeholder="Matrícula"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. SEÇÃO: Solicitante */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">3. Solicitante</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className={labelClasses}>Nome Completo</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.solicitante}
                                onChange={(e) => setFormData({ ...formData, solicitante: e.target.value })}
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
                                        value={formData.telefone?.replace(/^\(27\) /, '')}
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

                {/* 4. SEÇÃO: Localização (Refresh Coords e Accuracy) */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">4. Localização</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => captureGPS(false)}
                            className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 hover:bg-blue-100 transition-all border border-blue-100/50 flex items-center gap-2"
                        >
                            <RefreshCw size={14} className={gpsStatus === 'locating' ? 'animate-spin' : ''} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Atualizar GPS</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className={labelClasses}>Endereço da Ocorrência</label>
                            <div className="relative group">
                                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
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
                                            bairro: found ? found.bairro : prev.bairro
                                        }));
                                    }}
                                    placeholder="Nome da rua, avenida..."
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

                        <div className="space-y-2">
                            <label className={labelClasses}>Bairro</label>
                            <select
                                className={inputClasses}
                                value={formData.bairro}
                                onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                            >
                                <option value="">Selecione o Bairro</option>
                                {bairrosData.map(b => (
                                    <option key={b.nome} value={b.nome}>{b.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className={`rounded-3xl p-5 border-2 transition-all ${gpsStatus === 'success' ? (formData.accuracy < 15 ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-amber-50/20 border-amber-100/50') : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'}`}>
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Latitude</label>
                                    <input
                                        type="number"
                                        className="bg-transparent border-b border-slate-200 dark:border-slate-700 w-full font-mono text-sm font-bold p-1 outline-none focus:border-blue-500"
                                        value={formData.lat || ''}
                                        onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                                        step="0.0000001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Longitude</label>
                                    <input
                                        type="number"
                                        className="bg-transparent border-b border-slate-200 dark:border-slate-700 w-full font-mono text-sm font-bold p-1 outline-none focus:border-blue-500"
                                        value={formData.lng || ''}
                                        onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                                        step="0.0000001"
                                    />
                                </div>
                            </div>
                            {gpsStatus === 'success' && (
                                <div className="space-y-1">
                                    <p className={`text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider ${formData.accuracy < 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        <ShieldCheck size={12} /> Precisão do GPS: {formData.accuracy?.toFixed(1)}m
                                        {formData.accuracy >= 15 && <span className="text-[8px] italic ml-2 opacity-70">(Aguarde estabilizar para melhor precisão)</span>}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 5. SEÇÃO: Tipologia e Risco */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">5. Tipologia e Risco</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className={labelClasses}>Evento / Desastre (COBRADE)</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50" size={18} />
                                <input
                                    type="text"
                                    list="cobrade-list"
                                    placeholder="Ex: Enxurrada, Deslizamento..."
                                    className={`${inputClasses} pl-12`}
                                    value={formData.denominacao}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const selected = COBRADE_LIST.find(c => c.name === val);
                                        setFormData(prev => ({
                                            ...prev,
                                            denominacao: val,
                                            cobrade: selected ? selected.code : prev.cobrade
                                        }));
                                    }}
                                />
                                <datalist id="cobrade-list">
                                    {COBRADE_LIST.map(c => <option key={c.code} value={c.name} />)}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>Categoria de Risco</label>
                            <select
                                className={inputClasses}
                                value={formData.categoriaRisco}
                                onChange={e => setFormData({ ...formData, categoriaRisco: e.target.value, subtiposRisco: [], checklistRespostas: {} })}
                            >
                                <option value="">Selecione a Categoria</option>
                                {Object.keys(RISK_DATA).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        {formData.categoriaRisco && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {RISK_DATA[formData.categoriaRisco].map(sub => (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => toggleArrayItem('subtiposRisco', sub)}
                                        className={`p-4 rounded-xl text-left text-sm font-bold border-2 transition-all flex items-center justify-between ${formData.subtiposRisco?.includes(sub) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'}`}
                                    >
                                        {sub}
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${formData.subtiposRisco?.includes(sub) ? 'bg-white border-white text-indigo-600' : 'border-slate-200 dark:border-slate-600'}`}>
                                            {formData.subtiposRisco?.includes(sub) && <CheckCircle2 size={14} />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {formData.categoriaRisco && CHECKLIST_DATA[formData.categoriaRisco] && (
                            <div className="pt-6 space-y-4">
                                <label className={labelClasses}>Detalhamento Técnico (Checklist)</label>
                                <div className="space-y-3">
                                    {CHECKLIST_DATA[formData.categoriaRisco].map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                const current = formData.checklistRespostas || {};
                                                setFormData({
                                                    ...formData,
                                                    checklistRespostas: {
                                                        ...current,
                                                        [item]: !current[item]
                                                    }
                                                });
                                            }}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${formData.checklistRespostas?.[item] ? 'bg-emerald-50/50 border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                                        >
                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.checklistRespostas?.[item] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                                {formData.checklistRespostas?.[item] && <CheckCircle size={14} />}
                                            </div>
                                            <span className={`text-[11px] font-bold leading-tight ${formData.checklistRespostas?.[item] ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                            <label className={labelClasses}>Nível de Gravidade</label>
                            <div className="grid grid-cols-4 gap-2">
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
                    </div>
                </Card>

                {/* 6. SEÇÃO: Danos Humanos */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-700/50 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">6. Danos Humanos</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, tem_danos_humanos: !p.tem_danos_humanos }))}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.tem_danos_humanos ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                            {formData.tem_danos_humanos ? 'REMOVER DANOS' : 'INSERIR VALORES'}
                        </button>
                    </div>

                    {!formData.tem_danos_humanos ? (
                        <div className="py-8 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <Users size={40} className="mx-auto text-slate-200" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum dano humano registrado inicialmente</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-in zoom-in duration-300">
                            {[
                                { label: 'Óbitos', field: 'mortos' },
                                { label: 'Feridos', field: 'feridos' },
                                { label: 'Desabrigados', field: 'desabrigados' },
                                { label: 'Desalojados', field: 'desalojados' },
                                { label: 'Desaparecidos', field: 'desaparecidos' },
                                { label: 'Outros Afetados', field: 'outros_afetados' }
                            ].map((item) => (
                                <div key={item.field} className="space-y-3">
                                    <label className={labelClasses}>{item.label}</label>
                                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden focus-within:border-blue-500/20 transition-all shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, [item.field]: Math.max(0, (p[item.field] || 0) - 1) }))}
                                            className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
                                        >-</button>
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-none text-center font-black text-xl text-slate-800 dark:text-white focus:ring-0"
                                            value={formData[item.field] || 0}
                                            onChange={(e) => setFormData({ ...formData, [item.field]: parseInt(e.target.value) || 0 })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, [item.field]: (p[item.field] || 0) + 1 }))}
                                            className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all font-bold"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* 7. SEÇÃO: Danos Materiais e Notas */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">7. Descrição e Notas</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className={labelClasses}>Danos Materiais</label>
                                <VoiceInput onResult={(text) => setFormData(prev => ({ ...prev, descricao_danos: prev.descricao_danos + ' ' + text }))} />
                            </div>
                            <textarea
                                rows={4}
                                className={`${inputClasses} resize-none min-h-[120px] py-4 leading-relaxed`}
                                placeholder="Descreva os danos em residências, infraestrutura publica, pontes, etc..."
                                value={formData.descricao_danos}
                                onChange={(e) => setFormData({ ...formData, descricao_danos: e.target.value })}
                            />
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
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:scale-105 active:scale-95 transition-all shadow-sm"
                                    >
                                        <Sparkles size={12} className={refining ? 'animate-spin' : ''} />
                                        {refining ? 'IA...' : 'Refinar IA'}
                                    </button>
                                </div>
                            </div>
                            <textarea
                                rows={4}
                                className={`${inputClasses} resize-none min-h-[120px] py-4 leading-relaxed`}
                                placeholder="Notas adicionais, recomendações imediatas ou interdições efetuadas..."
                                value={formData.observacoes}
                                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            />
                        </div>
                    </div>
                </Card>

                {/* 8. SEÇÃO: Fotos */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                            <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">8. Fotos</h2>
                        </div>
                        <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{formData.fotos?.length || 0} fotos</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <FileInput onFileSelect={handlePhotoSelect} className="h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50" />
                        {formData.fotos?.map((foto, idx) => (
                            <div key={foto.id} className="relative aspect-square rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-sm">
                                <img
                                    src={foto.data}
                                    className="w-full h-full object-cover cursor-zoom-in"
                                    onClick={() => setSelectedPhotoIndex(idx)}
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(foto.id)}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="absolute bottom-0 inset-x-0 bg-black/40 backdrop-blur-md p-2">
                                    <input
                                        className="w-full bg-transparent border-none text-[9px] text-white placeholder-white/60 focus:ring-0 p-0 font-bold uppercase tracking-tight"
                                        placeholder="Legenda..."
                                        value={foto.legenda}
                                        onChange={e => updatePhotoCaption(foto.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 9. SEÇÃO: Assinaturas (Auto-assinar e Apoio Técnico) */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">9. Assinaturas</h2>
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
                                className="h-40 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 transition-all shadow-inner"
                            >
                                {formData.assinaturaAgente ? (
                                    <img src={formData.assinaturaAgente} className="h-full w-auto p-4" alt="Assinatura Agente" />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <Edit2 size={32} className="mx-auto text-slate-300" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toque para Assinar</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className={labelClasses}>Assinatura do Assistido</label>
                            <div
                                onClick={() => { setActiveSignatureType('assistido'); setShowSignaturePad(true); }}
                                className="h-40 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-500/50 transition-all shadow-inner"
                            >
                                {formData.assinaturaAssistido ? (
                                    <img src={formData.assinaturaAssistido} className="h-full w-auto p-4" alt="Assinatura Assistido" />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <Edit2 size={32} className="mx-auto text-slate-300" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toque para Assinar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Toggle Houve Apoio Técnico */}
                    <div className="flex justify-center pt-8 border-t border-slate-50 dark:border-slate-700/50">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, temApoioTecnico: !prev.temApoioTecnico }))}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all border-2 shadow-sm ${formData.temApoioTecnico
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900/20'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-400'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.temApoioTecnico ? 'bg-white border-white text-indigo-600' : 'border-slate-200 dark:border-slate-600'}`}>
                                {formData.temApoioTecnico && <CheckCircle size={14} />}
                            </div>
                            Houve Apoio Técnico nesta Ocorrência?
                        </button>
                    </div>

                    {/* Bloco de Apoio Técnico */}
                    {formData.temApoioTecnico && (
                        <div className="pt-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelClasses}>Nome do Técnico</label>
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
                                    <div className="space-y-2">
                                        <label className={labelClasses}>CREA/CAU</label>
                                        <input
                                            type="text"
                                            className={inputClasses}
                                            value={formData.apoioTecnico.crea}
                                            onChange={e => setFormData(prev => ({
                                                ...prev,
                                                apoioTecnico: { ...prev.apoioTecnico, crea: e.target.value }
                                            }))}
                                            placeholder="Registro Profissional"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClasses}>Matrícula</label>
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
                                <div className="space-y-2">
                                    <label className={labelClasses}>Assinatura do Apoio</label>
                                    <div
                                        onClick={() => { setActiveSignatureType('apoio'); setShowSignaturePad(true); }}
                                        className="h-32 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-500/50 transition-all shadow-inner"
                                    >
                                        {formData.apoioTecnico.assinatura ? (
                                            <img src={formData.apoioTecnico.assinatura} className="h-full w-auto p-4" alt="Assinatura Apoio" />
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <Edit2 size={24} className="mx-auto text-slate-300" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toque para Assinar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Action Buttons */}
                <div className="pt-8 space-y-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-16 rounded-3xl text-lg relative overflow-hidden group border-none shadow-xl shadow-red-500/10"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-500 transition-transform group-hover:scale-105 duration-500"></div>
                        <div className="relative flex items-center gap-3">
                            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            <span className="font-black tracking-widest">FINALIZAR REGISTRO</span>
                        </div>
                    </Button>
                </div>
            </main>

            {/* Signature Pad Modal */}
            {showSignaturePad && (
                <SignaturePadComp
                    title={`Assinatura do ${activeSignatureType === 'agente' ? 'Agente' : (activeSignatureType === 'apoio' ? 'Apoio Técnico' : 'Assistido')}`}
                    onSave={(data) => {
                        if (activeSignatureType === 'agente') setFormData(prev => ({ ...prev, signatureAgente: data, assinaturaAgente: data }));
                        else if (activeSignatureType === 'apoio') setFormData(prev => ({ ...prev, apoioTecnico: { ...prev.apoioTecnico, assinatura: data } }));
                        else setFormData(prev => ({ ...prev, signatureAssistido: data, assinaturaAssistido: data }));
                        setShowSignaturePad(false);
                    }}
                    onCancel={() => setShowSignaturePad(false)}
                />
            )}

            {/* Image Viewer Overlay */}
            {selectedPhotoIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center py-4">
                        <span className="text-[10px] font-black text-white/50 uppercase tracking-[4px]">Visualização</span>
                        <button onClick={() => setSelectedPhotoIndex(null)} className="p-3 bg-white/10 hover:bg-red-500 rounded-2xl text-white transition-all">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                        <img
                            src={formData.fotos[selectedPhotoIndex].data}
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                            alt="Visualização"
                        />
                    </div>
                    <div className="py-8 max-w-lg mx-auto w-full">
                        <label className="text-[9px] font-black text-white/40 uppercase mb-2 block ml-1 tracking-widest text-center">Editar Legenda da Foto</label>
                        <input
                            type="text"
                            className="w-full bg-white/10 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center outline-none focus:border-white/30"
                            value={formData.fotos[selectedPhotoIndex].legenda || ''}
                            onChange={(e) => updatePhotoCaption(formData.fotos[selectedPhotoIndex].id, e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OcorrenciasForm;
