import React, { useState, useEffect, useCallback } from 'react';
import NortisQuickSearch from '../../components/NortisQuickSearch';
import RichTextEditor from '../../components/Editor/RichTextEditor';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock as ClockIcon, Calendar, Info, FileText, CheckCircle2, AlertTriangle, X, Camera, Save, Trash2, Home, Users, Leaf, Globe, Shield, Search, ChevronDown, ChevronUp, AlertCircle, Calculator, Sparkles, ArrowLeft, PenTool, Image as ImageIcon, FileStack, Navigation, Check } from 'lucide-react';
import { CurrencyInput, NumberInput, DecimalInput } from '../../components/RedapInputs';
import { getRedapById, saveRedapLocal, INITIAL_REDAP_STATE } from '../../services/redapDb';
import { useToast } from '../../components/ToastNotification';
import { UserContext } from '../../App';
import { COBRADE_LIST } from '../../utils/cobradeData';
import { generateRedapReport } from '../../utils/redapReportGenerator';
import { refineReportText } from '../../services/ai';
import RedapSignature from './components/RedapSignature';
import RedapPhotoCapture from './components/RedapPhotoCapture';
import RedapIntensityModal from './components/RedapIntensityModal';
import { generateRedapDoc } from '../../utils/redapDocTemplates';
import RedapLocationPickerModal from './components/RedapLocationPickerModal';

const SectionHeader = ({ icon: Icon, title, isOpen, onToggle, color = "blue" }) => (
    <div
        onClick={onToggle}
        className={`flex items-center justify-between p-4 bg-white border-b border-slate-100 cursor-pointer active:bg-slate-50 transition-colors uppercase tracking-widest font-black text-[11px] ${color === 'blue' ? 'text-blue-600' : 'text-slate-600'}`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            {title}
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </div>
);

const RedapForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);

    const ROLE_MAP = {
        'Redap_Saude': 'saude',
        'Redap_Obras': 'obras',
        'Redap_Social': 'social',
        'Redap_Educacao': 'educacao',
        'Redap_Agricultura': 'agricultura',
        'Redap_Interior': 'interior',
        'Redap_Administracao': 'administracao',
        'Redap_CDL': 'cdl',
        'Redap_Cesan': 'cesan',
        'Redap_DefesaSocial': 'defesa_social',
        'Redap_EsporteTurismo': 'esporte_turismo',
        'Redap_ServicosUrbanos': 'servicos_urbanos',
        'Redap_Transportes': 'transportes',
        'Redap_Cultura': 'cultura',
        'Redap_MeioAmbiente': 'meio_ambiente',
        'Redap_Geral': 'defesa_civil',
        // Backward compatibility
        'S2id_Saude': 'saude',
        'S2id_Obras': 'obras',
        'S2id_Social': 'social',
        'S2id_Educacao': 'educacao',
        'S2id_Agricultura': 'agricultura',
        'S2id_Interior': 'interior',
        'S2id_Administracao': 'administracao',
        'S2id_CDL': 'cdl',
        'S2id_Cesan': 'cesan',
        'S2id_DefesaSocial': 'defesa_social',
        'S2id_EsporteTurismo': 'esporte_turismo',
        'S2id_ServicosUrbanos': 'servicos_urbanos',
        'S2id_Transportes': 'transportes',
        'S2id_Cultura': 'cultura',
        'S2id_MeioAmbiente': 'meio_ambiente',
        'S2id_Geral': 'defesa_civil'
    };

    const activeSector = ROLE_MAP[user?.role] ||
        (user?.role?.startsWith('Redap_') ? user.role.replace('Redap_', '').toLowerCase() :
            (user?.role?.startsWith('S2id_') ? user.role.replace('S2id_', '').toLowerCase() : null));
    const [formData, setFormData] = useState(INITIAL_REDAP_STATE);
    const [isNortisIAOpen, setIsNortisIAOpen] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [showIntensity, setShowIntensity] = useState(false);
    const [openSections, setOpenSections] = useState({
        tipificacao: true,
        danos_humanos: false,
        danos_materiais: false,
        danos_infraestrutura: false,
        danos_agricolas: false,
        danos_ambientais: false,
        prejuizos_publicos: false,
        prejuizos_privados: false,
        setorial: true,
        documentos: false,
        evidencias: false,
        assinatura: false,
        metadata_oficial: false
    });
    const [showCamera, setShowCamera] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [generatingIA, setGeneratingIA] = useState({ consideracoes: false });
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [capturingGPS, setCapturingGPS] = useState(false);
    const isDirty = React.useRef(false); // Track if there are actual unsaved changes

    // Load record if editing
    useEffect(() => {
        if (id && id !== 'novo') {
            loadRecord(id);
        } else {
            // New record: Set current date and time
            const now = new Date();
            setFormData(prev => ({
                ...prev,
                data: {
                    ...prev.data,
                    data_ocorrencia: {
                        dia: String(now.getDate()).padStart(2, '0'),
                        mes: String(now.getMonth() + 1).padStart(2, '0'),
                        ano: String(now.getFullYear()),
                        horario: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                    }
                }
            }));
            setLoading(false);
        }
    }, [id]);

    const loadRecord = async (recordId) => {
        try {
            const record = await getRedapById(recordId);
            if (record) {
                // Determine active sector for this user or record
                const targetSector = ROLE_MAP[user?.role] ||
                    (user?.role?.startsWith('Redap_') ? user.role.replace('Redap_', '').toLowerCase() :
                        (user?.role?.startsWith('S2id_') ? user.role.replace('S2id_', '').toLowerCase() : null));

                // Deep merge setorial data to ensure new fields (values) appear
                const mergedRecord = {
                    ...record,
                    tipo_registro: record.tipo_registro || 'redap', // Ensure tipo_registro is 'redap'
                    data: {
                        ...record.data,
                        setorial: {
                            ...INITIAL_REDAP_STATE.data.setorial, // Base structure
                            ...record.data.setorial, // Overwrite with saved data
                            // Ensure specific sector object is also merged deeply if it exists
                            ...(targetSector && record.data.setorial && record.data.setorial[targetSector] ? {
                                [targetSector]: {
                                    ...INITIAL_REDAP_STATE.data.setorial[targetSector],
                                    ...record.data.setorial[targetSector]
                                }
                            } : {})
                        }
                    }
                };

                // Also merge deeply for all sectors if user is Admin/Coordinator (viewing all)
                if (['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)) {
                    Object.keys(INITIAL_REDAP_STATE.data.setorial).forEach(sector => {
                        if (record.data.setorial && record.data.setorial[sector]) {
                            mergedRecord.data.setorial[sector] = {
                                ...INITIAL_REDAP_STATE.data.setorial[sector],
                                ...record.data.setorial[sector]
                            };
                        }
                    });
                }

                setFormData(mergedRecord);
            }
        } catch (error) {
            console.error('Error loading record:', error);
            toast.error('Erro', 'Falha ao carregar dados do formulário.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-save logic (Debounced)
    useEffect(() => {
        if (loading || !isDirty.current) return;

        const timer = setTimeout(() => {
            handleAutoSave();
        }, 2000); // 2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [formData, loading]);

    const handleAutoSave = async () => {
        if (loading || saving) return;
        setSaving(true);
        try {
            const savedId = await saveRedapLocal(formData);
            if ((!id || id === 'novo') && savedId) {
                isDirty.current = false; // Prevent immediate re-save
                navigate(`/redap/editar/${savedId}`, { replace: true });
                setFormData(prev => ({ ...prev, id: savedId }));
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        } finally {
            setSaving(false);
            isDirty.current = false;
        }
    };

    // Role-based permissions
    const canEditSection = (section) => {
        if (formData?.status === 'submitted') return false; // Block all editing when submitted
        if (!user) return false;
        const role = user.role;
        const isDC = ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(role);

        if (isDC) return true;

        const permissions = {
            tipificacao: false, // Read-only for sectors
            data_ocorrencia: false, // Read-only for sectors
            danos_humanos: false, // Sectors should not edit general S2id human damages unless specifically allowed
            danos_materiais: false,
            danos_ambientais: false,
            prejuizos_publicos: false,
            prejuizos_privados: false,
            setorial: true, // Only for their own sector (handled in rendering)
            evidencias: true,
            assinatura: true,
            metadata_oficial: false // Only DC can edit
        };

        return permissions[section] || false;
    };

    const isDC = ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role);
    const isEditableByDC = isDC && formData?.status !== 'submitted';
    const isGlobalReadOnly = formData?.status === 'submitted' || !(isDC || user?.role?.startsWith('Redap_') || user?.role?.startsWith('S2id_'));

    // AI Generation Logic
    const handleGenerateIA = async (field) => {
        if (!activeSector) return;

        setGeneratingIA(prev => ({ ...prev, [field]: true }));
        try {
            const cobradeContext = `${formData.data.tipificacao.cobrade} - ${formData.data.tipificacao.denominacao}`;
            const reportData = JSON.stringify({
                ocorrencia: formData.data.data_ocorrencia,
                setorial: formData.data.setorial[activeSector]
            });

            const textInput = `Gerar considerações finais para o setor ${activeSector} com os dados fornecidos.`;

            const generated = await refineReportText(
                textInput,
                cobradeContext,
                reportData,
                field
            );

            if (generated && !generated.startsWith('ERROR:')) {
                updateSetorialField(activeSector, field, generated);
                toast.success('Sucesso', 'Narrativa gerada com apoio da IA.');
            } else {
                toast.error('Erro', 'Não foi possível gerar o texto com IA.');
            }
        } catch (error) {
            console.error('IA Generation Error:', error);
            toast.error('Erro', 'Falha na conexão com serviço de IA.');
        } finally {
            setGeneratingIA(prev => ({ ...prev, [field]: false }));
        }
    };

    const updateData = (section, field, value) => {
        if (!canEditSection(section)) return;
        isDirty.current = true;
        setFormData(prev => {
            const newState = {
                ...prev,
                data: {
                    ...prev.data,
                    [section]: section === 'setorial' ? {
                        ...prev.data.setorial,
                        [field]: value
                    } : {
                        ...(prev.data[section] || {}),
                        [field]: value
                    }
                }
            };

            if (section === 'tipificacao' && field === 'denominacao') {
                const selected = COBRADE_LIST.find(c => c.name === value);
                if (selected) {
                    newState.data.tipificacao.cobrade = selected.code;
                }
            }

            return newState;
        });
    };

    // Auto-calculate total prejuizo for the active sector
    useEffect(() => {
        if (!activeSector || !formData.data.setorial[activeSector]) return;

        const currentSectorData = formData.data.setorial[activeSector];
        let total = 0;

        Object.entries(currentSectorData).forEach(([key, value]) => {
            // Sum all currency fields except the total itself
            if (key !== 'prejuizo_total' && (key.includes('valor') || key.includes('custo') || key.includes('prejuizo')) && typeof value === 'number') {
                total += value;
            }
        });

        if (total !== currentSectorData.prejuizo_total) {
            updateSetorialField(activeSector, 'prejuizo_total', total);
        }
    }, [formData.data.setorial[activeSector]]);

    const updateSetorialField = (sector, field, value) => {
        if (activeSector && sector !== activeSector) return;
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                setorial: {
                    ...prev.data.setorial,
                    [sector]: {
                        ...prev.data.setorial[sector],
                        [field]: value
                    }
                }
            }
        }));
    };

    const updateSectoralSubmission = (sector, field, value) => {
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                submissoes_setoriais: {
                    ...prev.data.submissoes_setoriais,
                    [sector]: {
                        ...prev.data.submissoes_setoriais[sector],
                        [field]: value
                    }
                }
            }
        }));
    };

    const updateMetadataOficial = (field, value) => {
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                metadata_oficial: {
                    ...prev.data.metadata_oficial,
                    [field]: value
                }
            }
        }));
    };

    const updateLocalizacao = (field, value) => {
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                localizacao: {
                    ...(prev.data.localizacao || { lat: null, lng: null, accuracy: null, timestamp: null }),
                    [field]: value === '' ? null : Number(value)
                }
            }
        }));
    };

    const handleCaptureGPS = () => {
        if (!navigator.geolocation) {
            toast.error('Erro', 'Geolocalização não suportada por este dispositivo.');
            return;
        }

        setCapturingGPS(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    data: {
                        ...prev.data,
                        localizacao: {
                            lat: latitude,
                            lng: longitude,
                            accuracy: accuracy,
                            timestamp: new Date().toISOString()
                        }
                    }
                }));
                isDirty.current = true;
                setCapturingGPS(false);
                toast.success('Sucesso', 'Coordenadas GPS capturadas com sucesso.');
            },
            (error) => {
                console.error('GPS error:', error);
                toast.error('Erro', 'Não foi possível obter a localização. Verifique as permissões de GPS.');
                setCapturingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const finalizeSectoral = async (sector) => {
        const sectorPhotos = formData.data.evidencias.filter(p => p.sector === sector);
        if (!sectorPhotos.length) {
            toast.error('Evidência Obrigatória', 'É obrigatório anexar pelo menos uma foto das evidências do seu setor.');
            return;
        }

        const sectorSub = formData.data.submissoes_setoriais[sector];
        if (!sectorSub.assinatura_url) {
            toast.error('Assinatura Pendente', 'É obrigatório coletar a assinatura do responsável do setor para finalizar.');
            return;
        }

        const newFormData = {
            ...formData,
            data: {
                ...formData.data,
                submissoes_setoriais: {
                    ...formData.data.submissoes_setoriais,
                    [sector]: {
                        ...sectorSub,
                        preenchido: true,
                        data: new Date().toISOString(),
                        usuario: user?.full_name || user?.email
                    }
                }
            }
        };
        setFormData(newFormData);
        await saveRedapLocal(newFormData);
        toast('✅ Seção setorial finalizada com sucesso! A Defesa Civil foi notificada.', 'success');
    };


    const updateDeepData = (section, field, subfield, value) => {
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                [section]: {
                    ...prev.data[section],
                    [field]: {
                        ...prev.data[section][field],
                        [subfield]: value
                    }
                }
            }
        }));
    };

    const addAgricolaItem = () => {
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                danos_agricolas: {
                    ...prev.data.danos_agricolas,
                    itens: [
                        ...(prev.data.danos_agricolas.itens || []),
                        { cultura_produto: '', area: 0, produtores: 0, animais: 0, perda: 0, prejuizo: 0 }
                    ]
                }
            }
        }));
    };

    const updateAgricolaItem = (index, field, value) => {
        setFormData(prev => {
            const newItens = [...(prev.data.danos_agricolas.itens || [])];
            newItens[index] = { ...newItens[index], [field]: value };
            return {
                ...prev,
                data: {
                    ...prev.data,
                    danos_agricolas: {
                        ...prev.data.danos_agricolas,
                        itens: newItens
                    }
                }
            };
        });
    };

    const removeAgricolaItem = (index) => {
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                danos_agricolas: {
                    ...prev.data.danos_agricolas,
                    itens: (prev.data.danos_agricolas.itens || []).filter((_, i) => i !== index)
                }
            }
        }));
    };

    const handleHumanChange = (catKey, subfield, value) => {
        isDirty.current = true;
        setFormData(prev => {
            const catObj = { ...(prev.data.danos_humanos[catKey] || { total: 0, homens: 0, mulheres: 0, criancas: 0 }), [subfield]: value };
            catObj.total = (catObj.homens || 0) + (catObj.mulheres || 0) + (catObj.criancas || 0);
            return {
                ...prev,
                data: {
                    ...prev.data,
                    danos_humanos: {
                        ...prev.data.danos_humanos,
                        [catKey]: catObj
                    }
                }
            };
        });
    };

    const handleMaterialChange = (itemKey, subfield, value) => {
        isDirty.current = true;
        setFormData(prev => {
            const itemObj = { ...(prev.data.danos_materiais[itemKey] || { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 }), [subfield]: value };
            itemObj.total = (itemObj.destruidas || 0) + (itemObj.danificadas || 0);
            return {
                ...prev,
                data: {
                    ...prev.data,
                    danos_materiais: {
                        ...prev.data.danos_materiais,
                        [itemKey]: itemObj
                    }
                }
            };
        });
    };

    const handleInfraChange = (itemKey, subfield, value) => {
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                danos_infraestrutura: {
                    ...prev.data.danos_infraestrutura,
                    [itemKey]: {
                        ...(prev.data.danos_infraestrutura[itemKey] || {}),
                        [subfield]: value
                    }
                }
            }
        }));
    };

    const handleAmbientalChange = (itemKey, subfield, value) => {
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                danos_ambientais: {
                    ...prev.data.danos_ambientais,
                    [itemKey]: {
                        ...(prev.data.danos_ambientais[itemKey] || {}),
                        [subfield]: value
                    }
                }
            }
        }));
    };

    const handleConsolidadoChange = (itemKey, subfield, value) => {
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            data: {
                ...prev.data,
                prejuizos_economicos_consolidados: {
                    ...prev.data.prejuizos_economicos_consolidados,
                    [itemKey]: {
                        ...(prev.data.prejuizos_economicos_consolidados[itemKey] || {}),
                        [subfield]: value
                    }
                }
            }
        }));
    };

    const autoConsolidatePrejuizos = () => {
        setFormData(prev => {
            const dm = prev.data.danos_materiais || {};
            const di = prev.data.danos_infraestrutura || {};
            const da = prev.data.danos_agricolas || {};
            const dam = prev.data.danos_ambientais || {};

            // Edificações (públicas + privadas): residencial, saúde, educação, templos
            const edificacoesDanos = 
                (dm.residencias_urbanas?.prejuizo || dm.residencias_urbanas?.valor || 0) +
                (dm.residencias_rurais?.prejuizo || dm.residencias_rurais?.valor || 0) +
                (dm.escolas_creches?.prejuizo || dm.escolas_creches?.valor || 0) +
                (dm.unidades_saude?.prejuizo || dm.unidades_saude?.valor || 0) +
                (dm.edificacoes_publicas?.prejuizo || dm.edificacoes_publicas?.valor || 0) +
                (dm.templos_culto?.prejuizo || dm.templos_culto?.valor || 0);

            // Infraestrutura pública
            let infraDanos = 0;
            Object.values(di).forEach(item => {
                infraDanos += (item?.prejuizo || 0);
            });

            // Agrícola
            let agricolaDanos = 0;
            (da.itens || []).forEach(item => {
                agricolaDanos += (item?.prejuizo || 0);
            });

            // Comercial / Industrial
            const comercialIndustrialDanos = 
                (dm.comercio?.prejuizo || dm.comercio?.valor || 0) +
                (dm.industria?.prejuizo || dm.industria?.valor || 0);

            // Meio ambiente
            let meioAmbienteDanos = 0;
            Object.keys(dam).forEach(key => {
                if (key !== 'descricao' && dam[key]) {
                    meioAmbienteDanos += (dam[key]?.prejuizo || 0);
                }
            });

            return {
                ...prev,
                data: {
                    ...prev.data,
                    prejuizos_economicos_consolidados: {
                        edificacoes: { danos: edificacoesDanos, prejuizos: prev.data.prejuizos_economicos_consolidados?.edificacoes?.prejuizos || 0 },
                        infraestrutura: { danos: infraDanos, prejuizos: prev.data.prejuizos_economicos_consolidados?.infraestrutura?.prejuizos || 0 },
                        agricola: { danos: agricolaDanos, prejuizos: prev.data.prejuizos_economicos_consolidados?.agricola?.prejuizos || 0 },
                        comercial_industrial: { danos: comercialIndustrialDanos, prejuizos: prev.data.prejuizos_economicos_consolidados?.comercial_industrial?.prejuizos || 0 },
                        meio_ambiente: { danos: meioAmbienteDanos, prejuizos: prev.data.prejuizos_economicos_consolidados?.meio_ambiente?.prejuizos || 0 }
                    }
                }
            };
        });
        toast.success('Calculado', 'Valores de danos consolidados a partir das seções anteriores.');
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-3 sm:px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                    <button onClick={() => navigate('/redap')} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="truncate">
                        <h1 className="text-sm sm:text-base font-black text-slate-800 leading-tight truncate">Formulário REDAP</h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none truncate">
                                {saving ? 'Salvando...' : 'Salvo'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                        onClick={() => generateRedapReport(formData, user)}
                        className="bg-slate-100 text-slate-700 p-2 sm:p-2.5 rounded-xl active:scale-95 transition-all hover:bg-slate-200 flex items-center gap-2"
                        title="Gerar Relatório PDF"
                    >
                        <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    {formData?.status === 'submitted' ? (
                        <button
                            onClick={async () => {
                                const updated = { ...formData, status: 'draft' };
                                setFormData(updated);
                                isDirty.current = true;
                                await saveRedapLocal(updated);
                                toast.info('Reaberto', 'Pasta reaberta para edições.');
                            }}
                            disabled={saving || !['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)}
                            className="bg-amber-600 disabled:opacity-50 text-white px-2.5 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-1 sm:gap-1.5"
                        >
                            <FileStack size={14} />
                            <span className="hidden sm:inline">Reabrir Pasta</span>
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                const updated = { ...formData, status: 'submitted' };
                                setFormData(updated);
                                isDirty.current = true;
                                await saveRedapLocal(updated);
                                toast.success('Finalizado', 'Pasta fechada e finalizada com sucesso.');
                            }}
                            disabled={saving || !['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)}
                            className="bg-emerald-600 disabled:opacity-50 text-white px-2.5 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-1 sm:gap-1.5"
                        >
                            <CheckCircle2 size={14} />
                            <span className="hidden sm:inline">Finalizar</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
                {/* 2. TIPIGICAÇÃO & 3. DATA */}
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <SectionHeader
                        icon={Shield}
                        title="2. Tipificação & 3. Ocorrência"
                        isOpen={openSections.tipificacao}
                        onToggle={() => toggleSection('tipificacao')}
                    />
                    {openSections.tipificacao && (
                        <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        COBRADE
                                        {!canEditSection('tipificacao') && (
                                            <span className="text-[7px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100">Definido pela Defesa Civil</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditSection('tipificacao')}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm disabled:opacity-60"
                                        value={formData.data.tipificacao.cobrade}
                                        onChange={(e) => updateData('tipificacao', 'cobrade', e.target.value)}
                                        placeholder="Ex: 1.1.1.1.0"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        Denominação (Tipo/Subtipo)
                                        {!canEditSection('tipificacao') && (
                                            <span className="text-[7px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100">Definido pela Defesa Civil</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        list="cobrade-options"
                                        disabled={!canEditSection('tipificacao')}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm disabled:opacity-60"
                                        value={formData.data.tipificacao.denominacao}
                                        onChange={(e) => updateData('tipificacao', 'denominacao', e.target.value)}
                                        placeholder="Escolha ou digite o tipo de desastre..."
                                    />
                                    <datalist id="cobrade-options">
                                        {COBRADE_LIST.map(item => (
                                            <option key={item.code} value={item.name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="col-span-2 sm:col-span-4 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                    Data da Ocorrência
                                    {!canEditSection('data_ocorrencia') && (
                                        <span className="text-[7px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100">Definido pela Defesa Civil</span>
                                    )}
                                </div>
                                {['dia', 'mes', 'ano', 'horario'].map(f => (
                                    <div key={f}>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">{f}</label>
                                        <input
                                            type="text"
                                            disabled={!canEditSection('data_ocorrencia')}
                                            value={formData.data.data_ocorrencia[f]}
                                            onChange={(e) => updateData('data_ocorrencia', f, e.target.value)}
                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-sm disabled:opacity-60"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* 3.1. Localização Georreferenciada do Evento */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Localização Georreferenciada do Evento
                                    {!canEditSection('tipificacao') && (
                                        <span className="text-[7px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100">Definido pela Defesa Civil</span>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            disabled={!canEditSection('tipificacao')}
                                            value={formData.data.localizacao?.lat != null ? formData.data.localizacao.lat : ''}
                                            onChange={(e) => updateLocalizacao('lat', e.target.value)}
                                            placeholder="Não definida"
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-xs disabled:opacity-60 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            disabled={!canEditSection('tipificacao')}
                                            value={formData.data.localizacao?.lng != null ? formData.data.localizacao.lng : ''}
                                            onChange={(e) => updateLocalizacao('lng', e.target.value)}
                                            placeholder="Não definida"
                                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-center font-bold text-xs disabled:opacity-60 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {canEditSection('tipificacao') && (
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleCaptureGPS}
                                            disabled={capturingGPS}
                                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                                        >
                                            {capturingGPS ? (
                                                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                                            ) : (
                                                <Navigation size={12} className="fill-slate-700" />
                                            )}
                                            Capturar GPS
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowLocationPicker(true)}
                                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-blue-100"
                                        >
                                            <MapPin size={12} />
                                            Marcar no Mapa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ----------- SEÇÕES DE DANOS E PREJUÍZOS (SOMENTE DEFESA CIVIL) ----------- */}
                {(!activeSector || ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)) && (
                    <>
                        {/* 6.1 DANOS HUMANOS */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={Users}
                                title="6.1 Danos Humanos"
                                isOpen={openSections.danos_humanos}
                                onToggle={() => toggleSection('danos_humanos')}
                                color="slate"
                            />
                            {openSections.danos_humanos && (
                                <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-3 pl-2">Classificação dos Danos</th>
                                                <th className="pb-3 text-center">Qtd. Total</th>
                                                <th className="pb-3 text-center">Homens</th>
                                                <th className="pb-3 text-center">Mulheres</th>
                                                <th className="pb-3 text-center">Crianças (&lt;12)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                { key: 'mortos_confirmados', label: 'Mortos confirmados' },
                                                { key: 'desaparecidos', label: 'Desaparecidos' },
                                                { key: 'feridos_graves', label: 'Feridos graves' },
                                                { key: 'feridos_leves', label: 'Feridos leves' },
                                                { key: 'enfermos', label: 'Enfermos' },
                                                { key: 'desabrigados', label: 'Desabrigados' },
                                                { key: 'desalojados', label: 'Desalojados' },
                                                { key: 'deslocados_temporariamente', label: 'Deslocados temporariamente' },
                                                { key: 'diretamente_afetados', label: 'Diretamente afetados' }
                                            ].map(item => {
                                                const val = formData.data.danos_humanos[item.key] || { total: 0, homens: 0, mulheres: 0, criancas: 0 };
                                                return (
                                                    <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3 pl-2 font-bold text-slate-700 text-xs">
                                                            {item.label}
                                                        </td>
                                                        <td className="py-2 text-center font-extrabold text-slate-900 bg-slate-50/50 rounded-lg text-xs w-20">
                                                            {val.total}
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <NumberInput
                                                                disabled={!canEditSection('danos_humanos')}
                                                                className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                value={val.homens}
                                                                onChange={(n) => handleHumanChange(item.key, 'homens', n)}
                                                            />
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <NumberInput
                                                                disabled={!canEditSection('danos_humanos')}
                                                                className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                value={val.mulheres}
                                                                onChange={(n) => handleHumanChange(item.key, 'mulheres', n)}
                                                            />
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            <NumberInput
                                                                disabled={!canEditSection('danos_humanos')}
                                                                className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                value={val.criancas}
                                                                onChange={(n) => handleHumanChange(item.key, 'criancas', n)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="pt-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">6.1.1 Descrição complementar / Memória de cálculo</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[100px] disabled:opacity-60"
                                            disabled={!canEditSection('danos_humanos')}
                                            value={formData.data.danos_humanos.descricao}
                                            onChange={(e) => updateData('danos_humanos', 'descricao', e.target.value)}
                                            placeholder="Descreva as fontes dos dados humanos, detalhando comunidades atingidas..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 6.2 DANOS MATERIAIS */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={Home}
                                title="6.2 Danos em Edificações"
                                isOpen={openSections.danos_materiais}
                                onToggle={() => toggleSection('danos_materiais')}
                                color="slate"
                            />
                            {openSections.danos_materiais && (
                                <div className="p-4 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-3 pl-2">Discriminação das Edificações</th>
                                                <th className="pb-3 text-center">Destruídas</th>
                                                <th className="pb-3 text-center">Danificadas</th>
                                                <th className="pb-3 text-center">Total Unid.</th>
                                                <th className="pb-3 text-right pr-2">Prejuízo (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                {
                                                    title: 'Residenciais',
                                                    items: [
                                                        { key: 'residencias_urbanas', label: 'Residências urbanas' },
                                                        { key: 'residencias_rurais', label: 'Residências rurais' }
                                                    ]
                                                },
                                                {
                                                    title: 'Públicas e de Uso Coletivo',
                                                    items: [
                                                        { key: 'escolas_creches', label: 'Escolas / creches' },
                                                        { key: 'unidades_saude', label: 'Unidades de saúde' },
                                                        { key: 'edificacoes_publicas', label: 'Edificações administrativas públicas' },
                                                        { key: 'templos_culto', label: 'Templos / igrejas / locais de culto' }
                                                    ]
                                                },
                                                {
                                                    title: 'Comerciais e Industriais',
                                                    items: [
                                                        { key: 'comercio', label: 'Estabelecimentos comerciais' },
                                                        { key: 'industria', label: 'Estabelecimentos industriais' }
                                                    ]
                                                }
                                            ].map(group => (
                                                <React.Fragment key={group.title}>
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={5} className="py-2 pl-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                                            {group.title}
                                                        </td>
                                                    </tr>
                                                    {group.items.map(item => {
                                                        const val = formData.data.danos_materiais[item.key] || { destruidas: 0, danificadas: 0, total: 0, prejuizo: 0 };
                                                        return (
                                                            <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                                <td className="py-3 pl-4 font-bold text-slate-700 text-xs">
                                                                    {item.label}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <NumberInput
                                                                        disabled={!canEditSection('danos_materiais')}
                                                                        className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.destruidas}
                                                                        onChange={(n) => handleMaterialChange(item.key, 'destruidas', n)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <NumberInput
                                                                        disabled={!canEditSection('danos_materiais')}
                                                                        className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.danificadas}
                                                                        onChange={(n) => handleMaterialChange(item.key, 'danificadas', n)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 text-center font-bold text-slate-600 text-xs w-20">
                                                                    {val.total}
                                                                </td>
                                                                <td className="py-2 pr-2 text-right">
                                                                    <CurrencyInput
                                                                        disabled={!canEditSection('danos_materiais')}
                                                                        className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.prejuizo || val.valor || 0}
                                                                        onChange={(n) => handleMaterialChange(item.key, 'prejuizo', n)}
                                                                    />
                                                                </td>
                                                             </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 6.3 DANOS EM INFRAESTRUTURA */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={Globe}
                                title="6.3 Danos em Infraestrutura Pública"
                                isOpen={openSections.danos_infraestrutura}
                                onToggle={() => toggleSection('danos_infraestrutura')}
                                color="slate"
                            />
                            {openSections.danos_infraestrutura && (
                                <div className="p-4 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-3 pl-2">Descrição da Infraestrutura</th>
                                                <th className="pb-3 text-center">Unidade</th>
                                                <th className="pb-3 text-center">Qtd. Afetada</th>
                                                <th className="pb-3 text-center">Extensão / Área</th>
                                                <th className="pb-3 text-right pr-2">Prejuízo (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                {
                                                    title: 'Viária / Transporte',
                                                    items: [
                                                        { key: 'estradas_rodovias', label: 'Estradas / rodovias danificadas', unit: 'km' },
                                                        { key: 'pontes_viadutos', label: 'Pontes / viadutos danificados', unit: 'unidade(s)' },
                                                        { key: 'bueiros_galerias', label: 'Bueiros / galerias comprometidos', unit: 'unidade(s)' }
                                                    ]
                                                },
                                                {
                                                    title: 'Saneamento e Abastecimento',
                                                    items: [
                                                        { key: 'abastecimento_agua', label: 'Rede de abastecimento de água', unit: 'km' },
                                                        { key: 'rede_esgoto', label: 'Rede de esgoto', unit: 'km' },
                                                        { key: 'drenagem_urbana', label: 'Drenagem urbana', unit: 'km' }
                                                    ]
                                                },
                                                {
                                                    title: 'Energia e Comunicações',
                                                    items: [
                                                        { key: 'rede_eletrica', label: 'Rede elétrica', unit: 'km / postes' },
                                                        { key: 'comunicacoes_telefonia', label: 'Rede de comunicações / telefonia', unit: 'km' }
                                                    ]
                                                },
                                                {
                                                    title: 'Contenção e Proteção',
                                                    items: [
                                                        { key: 'muros_arrimo', label: 'Muros de arrimo / contenção', unit: 'm' },
                                                        { key: 'drenagem_canais', label: 'Obras de drenagem / canais', unit: 'm' }
                                                    ]
                                                }
                                            ].map(group => (
                                                <React.Fragment key={group.title}>
                                                    <tr className="bg-slate-50/50">
                                                        <td colSpan={5} className="py-2 pl-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                                            {group.title}
                                                        </td>
                                                    </tr>
                                                    {group.items.map(item => {
                                                        const val = formData.data.danos_infraestrutura[item.key] || { qtd: 0, extensao_area: 0, prejuizo: 0, unidade: item.unit };
                                                        return (
                                                            <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                                <td className="py-3 pl-4 font-bold text-slate-700 text-xs">
                                                                    {item.label}
                                                                </td>
                                                                <td className="py-2 text-center text-slate-400 font-bold text-[10px] uppercase">
                                                                    {item.unit}
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <NumberInput
                                                                        disabled={!isEditableByDC}
                                                                        className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.qtd}
                                                                        onChange={(n) => handleInfraChange(item.key, 'qtd', n)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 text-center">
                                                                    <DecimalInput
                                                                        disabled={!isEditableByDC}
                                                                        className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.extensao_area}
                                                                        onChange={(n) => handleInfraChange(item.key, 'extensao_area', n)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2 text-right">
                                                                    <CurrencyInput
                                                                        disabled={!isEditableByDC}
                                                                        className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                                        value={val.prejuizo}
                                                                        onChange={(n) => handleInfraChange(item.key, 'prejuizo', n)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* 6.4 DANOS AGRÍCOLAS E DE PRODUÇÃO */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={Shield}
                                title="6.4 Danos Agrícolas e de Produção"
                                isOpen={openSections.danos_agricolas}
                                onToggle={() => toggleSection('danos_agricolas')}
                                color="slate"
                            />
                            {openSections.danos_agricolas && (
                                <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                disabled={!isEditableByDC}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                                                checked={formData.data.danos_agricolas?.nao_se_aplica}
                                                onChange={(e) => updateDeepData('danos_agricolas', 'nao_se_aplica', null, e.target.checked)}
                                            />
                                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Não se aplica / Sem danos agrícolas reportados neste evento</span>
                                        </label>
                                    </div>

                                    {!formData.data.danos_agricolas?.nao_se_aplica && (
                                        <div className="space-y-4 overflow-x-auto">
                                            <table className="w-full text-left min-w-[600px]">
                                                <thead>
                                                    <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                        <th className="pb-3 pl-2">Cultura / Produto</th>
                                                        <th className="pb-3 text-center">Área (ha)</th>
                                                        <th className="pb-3 text-center">Produtores Afetados</th>
                                                        <th className="pb-3 text-center">Animais Afetados</th>
                                                        <th className="pb-3 text-center">Perda (%)</th>
                                                        <th className="pb-3 text-right pr-2">Prejuízo (R$)</th>
                                                        <th className="pb-3 text-center">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {(formData.data.danos_agricolas?.itens || []).map((item, index) => (
                                                        <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-2 pl-2">
                                                                <input
                                                                    type="text"
                                                                    disabled={!isEditableByDC}
                                                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                                                                    value={item.cultura_produto}
                                                                    onChange={(e) => updateAgricolaItem(index, 'cultura_produto', e.target.value)}
                                                                    placeholder="Ex: Café, Tomate, etc."
                                                                />
                                                            </td>
                                                            <td className="py-2 text-center">
                                                                <DecimalInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={item.area}
                                                                    onChange={(n) => updateAgricolaItem(index, 'area', n)}
                                                                />
                                                            </td>
                                                            <td className="py-2 text-center">
                                                                <NumberInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={item.produtores}
                                                                    onChange={(n) => updateAgricolaItem(index, 'produtores', n)}
                                                                />
                                                            </td>
                                                            <td className="py-2 text-center">
                                                                <NumberInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={item.animais}
                                                                    onChange={(n) => updateAgricolaItem(index, 'animais', n)}
                                                                />
                                                            </td>
                                                            <td className="py-2 text-center">
                                                                <NumberInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={item.perda}
                                                                    onChange={(n) => updateAgricolaItem(index, 'perda', n)}
                                                                />
                                                            </td>
                                                            <td className="py-2 pr-2 text-right">
                                                                <CurrencyInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={item.prejuizo}
                                                                    onChange={(n) => updateAgricolaItem(index, 'prejuizo', n)}
                                                                />
                                                            </td>
                                                            <td className="py-2 text-center">
                                                                <button
                                                                    disabled={!isEditableByDC}
                                                                    onClick={() => removeAgricolaItem(index)}
                                                                    className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors active:scale-95 disabled:opacity-50"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!formData.data.danos_agricolas?.itens || formData.data.danos_agricolas.itens.length === 0) && (
                                                        <tr>
                                                            <td colSpan={7} className="py-6 text-center text-slate-400 font-bold text-xs">
                                                                Nenhum item agrícola adicionado. Clique no botão abaixo para adicionar.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                            <button
                                                disabled={!isEditableByDC}
                                                onClick={addAgricolaItem}
                                                className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl font-black text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <Calculator size={14} />
                                                Adicionar Item Agrícola
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 6.5 DANOS AMBIENTAIS */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={Leaf}
                                title="6.5 Danos Ambientais"
                                isOpen={openSections.danos_ambientais}
                                onToggle={() => toggleSection('danos_ambientais')}
                                color="slate"
                            />
                            {openSections.danos_ambientais && (
                                <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-3 pl-2">Tipo de Dano Ambiental</th>
                                                <th className="pb-3 text-center">Unidade</th>
                                                <th className="pb-3 text-center">Quantidade / Extensão</th>
                                                <th className="pb-3 text-right pr-2">Prejuízo Estimado (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                { key: 'vegetacao_nativa', label: 'Área de vegetação nativa destruída', unit: 'hectares (ha)' },
                                                { key: 'contaminacao_agua', label: 'Contaminação de corpos d\'água', unit: 'km de curso d\'água' },
                                                { key: 'erosao_app', label: 'Erosão / assoreamento de APP', unit: 'm²' },
                                                { key: 'animais_silvestres', label: 'Animais silvestres afetados', unit: 'indivíduos' }
                                            ].map(item => {
                                                const val = formData.data.danos_ambientais[item.key] || { quantidade: 0, prejuizo: 0, unidade: item.unit };
                                                return (
                                                    <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3 pl-2 font-bold text-slate-700 text-xs">
                                                            {item.label}
                                                        </td>
                                                        <td className="py-2 text-center text-slate-400 font-bold text-[10px] uppercase">
                                                            {item.unit}
                                                        </td>
                                                        <td className="py-2 text-center">
                                                            {item.key === 'animais_silvestres' ? (
                                                                <NumberInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={val.quantidade}
                                                                    onChange={(n) => handleAmbientalChange(item.key, 'quantidade', n)}
                                                                />
                                                            ) : (
                                                                <DecimalInput
                                                                    disabled={!isEditableByDC}
                                                                    className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                    value={val.quantidade}
                                                                    onChange={(n) => handleAmbientalChange(item.key, 'quantidade', n)}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="py-2 pr-2 text-right">
                                                            <CurrencyInput
                                                                disabled={!isEditableByDC}
                                                                className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                value={val.prejuizo}
                                                                onChange={(n) => handleAmbientalChange(item.key, 'prejuizo', n)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className="pt-4">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">6.5.1 Descrição complementar dos impactos ambientais</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[100px]"
                                            disabled={!isEditableByDC}
                                            value={formData.data.danos_ambientais.descricao}
                                            onChange={(e) => updateData('danos_ambientais', 'descricao', e.target.value)}
                                            placeholder="Descreva detalhes dos impactos ambientais constatados..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 7. PREJUÍZOS ECONÔMICOS CONSOLIDADOS */}
                        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                            <SectionHeader
                                icon={FileText}
                                title="7. Prejuízos Econômicos Consolidados"
                                isOpen={openSections.prejuizos_publicos}
                                onToggle={() => toggleSection('prejuizos_publicos')}
                                color="slate"
                            />
                            {openSections.prejuizos_publicos && (
                                <div className="p-4 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">Auxílio de Preenchimento</span>
                                        <button
                                            disabled={!isEditableByDC}
                                            onClick={autoConsolidatePrejuizos}
                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                        >
                                            <Calculator size={12} />
                                            Consolidar a partir de Danos
                                        </button>
                                    </div>

                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                <th className="pb-3 pl-2">Setor Afetado</th>
                                                <th className="pb-3 text-right">Danos Materiais (R$)</th>
                                                <th className="pb-3 text-right pr-2">Prejuízos (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[
                                                { key: 'edificacoes', label: 'Edificações (públicas + privadas)' },
                                                { key: 'infraestrutura', label: 'Infraestrutura pública' },
                                                { key: 'agricola', label: 'Setor agrícola / produção rural' },
                                                { key: 'comercial_industrial', label: 'Setor comercial / industrial' },
                                                { key: 'meio_ambiente', label: 'Meio ambiente' }
                                            ].map(item => {
                                                const val = formData.data.prejuizos_economicos_consolidados[item.key] || { danos: 0, prejuizos: 0 };
                                                return (
                                                    <tr key={item.key} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-3 pl-2 font-bold text-slate-700 text-xs">
                                                            {item.label}
                                                        </td>
                                                        <td className="py-2 text-right">
                                                            <CurrencyInput
                                                                disabled={!isEditableByDC}
                                                                className="w-32 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                value={val.danos}
                                                                onChange={(n) => handleConsolidadoChange(item.key, 'danos', n)}
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-2 text-right">
                                                            <CurrencyInput
                                                                disabled={!isEditableByDC}
                                                                className="w-32 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                                                                value={val.prejuizos}
                                                                onChange={(n) => handleConsolidadoChange(item.key, 'prejuizos', n)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Total Row */}
                                            <tr className="bg-slate-50 border-t border-slate-200">
                                                <td className="py-3 pl-2 font-black text-slate-800 text-xs uppercase tracking-wider">
                                                    TOTAL GERAL DO EVENTO
                                                </td>
                                                <td className="py-3 text-right font-black text-slate-900 text-xs pr-4">
                                                    R$ {Object.values(formData.data.prejuizos_economicos_consolidados || {}).reduce((acc, curr) => acc + (curr.danos || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 text-right font-black text-slate-900 text-xs pr-2">
                                                    R$ {Object.values(formData.data.prejuizos_economicos_consolidados || {}).reduce((acc, curr) => acc + (curr.prejuizos || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* EXPANSÃO SETORIAL ESPECÍFICA */}
                {(user?.role.startsWith('Redap_') || user?.role.startsWith('S2id_') || ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)) && (
                    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <SectionHeader
                            icon={Globe}
                            title={`Relatório Setorial: ${activeSector === 'obras' ? 'SECURB' : (user?.role.replace('Redap_', '').replace('S2id_', '') || 'Geral')}`}
                            isOpen={openSections.setorial}
                            onToggle={() => toggleSection('setorial')}
                            color="blue"
                        />
                        {openSections.setorial && (
                            <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                                {activeSector && (
                                    <div className="space-y-4">
                                        {/* LAYOUT RENDERER */}
                                        <div className="space-y-4">
                                            {(() => {
                                                // 1. Define Layouts (Field Pairing)
                                                const SECTOR_LAYOUTS = {
                                                    obras: [
                                                        ['pontes_danificadas', 'valor_pontes'],
                                                        ['bueiros_obstruidos', 'valor_bueiros'],
                                                        ['pavimentacao_m2', 'valor_pavimentacao'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    interior: [
                                                        ['ponte_madeira', 'valor_ponte_madeira'],
                                                        ['ponte_concreto', 'valor_ponte_concreto'],
                                                        ['bueiros', 'valor_bueiros'],
                                                        ['galerias', 'valor_galerias'],
                                                        ['estradas_vicinais', 'valor_estradas'],
                                                        ['inst_danificadas', 'prejuizo_total']
                                                    ],
                                                    social: [
                                                        ['cestas_basicas', 'custo_cestas'],
                                                        ['kits_higiene', 'custo_kits'],
                                                        ['colchoes_entregues', 'custo_colchoes'],
                                                        ['familias_desabrigadas', 'familias_desalojadas'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    servicos_urbanos: [
                                                        ['inst_prestadoras', 'valor_inst_prestadoras'],
                                                        ['inst_comunitarias', 'valor_inst_comunitarias'],
                                                        ['infra_urbana', 'valor_infra_urbana'],
                                                        ['prejuizo_limpeza', 'prejuizo_total']
                                                    ],
                                                    saude: [
                                                        ['mortos', 'feridos'],
                                                        ['enfermos', null],
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', null],
                                                        ['prejuizo_medico', 'prejuizo_epidemiologica'],
                                                        ['prejuizo_sanitaria', 'prejuizo_pragas'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    educacao: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', 'prejuizo_ensino'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    agricultura: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', null],
                                                        ['prejuizo_agricultura', 'prejuizo_pecuaria'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    transportes: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', null],
                                                        ['prejuizo_transportes', 'prejuizo_combustiveis'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    cesan: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', null],
                                                        ['prejuizo_abastecimento', 'prejuizo_esgoto'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    cdl: [
                                                        ['prejuizo_comercio', 'prejuizo_servicos'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    administracao: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', 'prejuizo_total']
                                                    ],
                                                    defesa_social: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', 'prejuizo_seguranca'],
                                                        ['prejuizo_total', null]
                                                    ],
                                                    esporte_turismo: [
                                                        ['inst_danificadas', 'inst_destruidas'],
                                                        ['inst_valor', 'prejuizo_total']
                                                    ]
                                                };

                                                const layout = SECTOR_LAYOUTS[activeSector] || [];

                                                // Track rendered fields to handle leftovers
                                                const renderedFields = new Set(layout.flat().filter(Boolean));
                                                const allFields = Object.keys(formData.data.setorial[activeSector])
                                                    .filter(k => !['observacoes', 'introducao', 'consideracoes'].includes(k));

                                                const remainingFields = allFields.filter(f => !renderedFields.has(f));

                                                // Helper to render a single input
                                                const renderInput = (fieldKey) => {
                                                    if (!fieldKey) return null; // Spacer
                                                    const isCurrency = ['valor', 'prejuizo', 'custo'].some(term => fieldKey.includes(term));
                                                    const isNumber = typeof formData.data.setorial[activeSector][fieldKey] === 'number';
                                                    const isDecimalField = ['m2', 'ha', 'km', 'extensao', 'estradas_vicinais'].some(term => fieldKey.toLowerCase().includes(term));
                                                    const isTotalField = fieldKey === 'prejuizo_total';

                                                    return (
                                                        <div key={fieldKey} className={`w-full ${isTotalField ? 'bg-amber-50 rounded-2xl p-3 border border-amber-200' : ''}`}>
                                                            <label className={`block text-[8px] font-black uppercase mb-1 ml-1 truncate ${isTotalField ? 'text-amber-600' : 'text-slate-400'}`} title={fieldKey.replace(/_/g, ' ')}>
                                                                {(() => {
                                                                    let label = fieldKey.replace(/_/g, ' ').toUpperCase();
                                                                    if (fieldKey.includes('ponte')) {
                                                                        if (activeSector === 'interior') label += ' (Área Rural)';
                                                                        if (activeSector === 'obras' || activeSector === 'servicos_urbanos') label += ' (Área Urbana)';
                                                                    }
                                                                    return label;
                                                                })()}
                                                            </label>
                                                            {isCurrency ? (
                                                                <CurrencyInput
                                                                    disabled={isTotalField}
                                                                    className={`w-full px-3 py-3 rounded-xl text-xs font-bold outline-none border transition-all ${isTotalField ? 'bg-white border-amber-300 text-amber-900 cursor-not-allowed text-base' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                                                                    value={formData.data.setorial[activeSector][fieldKey]}
                                                                    onChange={(val) => updateSetorialField(activeSector, fieldKey, val)}
                                                                />
                                                            ) : isNumber ? (
                                                                isDecimalField ? (
                                                                    <DecimalInput
                                                                        disabled={isTotalField}
                                                                        className={`w-full px-3 py-3 rounded-xl text-xs font-bold outline-none border transition-all ${isTotalField ? 'bg-white border-amber-300 text-amber-900 cursor-not-allowed text-base' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                                                                        value={formData.data.setorial[activeSector][fieldKey]}
                                                                        onChange={(val) => updateSetorialField(activeSector, fieldKey, val)}
                                                                    />
                                                                ) : (
                                                                    <NumberInput
                                                                        disabled={isTotalField}
                                                                        className={`w-full px-3 py-3 rounded-xl text-xs font-bold outline-none border transition-all ${isTotalField ? 'bg-white border-amber-300 text-amber-900 cursor-not-allowed text-base' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                                                                        value={formData.data.setorial[activeSector][fieldKey]}
                                                                        onChange={(val) => updateSetorialField(activeSector, fieldKey, val)}
                                                                    />
                                                                )
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    disabled={isTotalField}
                                                                    className={`w-full px-3 py-3 rounded-xl text-xs font-bold outline-none border transition-all ${isTotalField ? 'bg-white border-amber-300 text-amber-900 cursor-not-allowed text-base' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                                                                    value={formData.data.setorial[activeSector][fieldKey]}
                                                                    onChange={(e) => updateSetorialField(activeSector, fieldKey, e.target.value)}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                return (
                                                    <div className="space-y-3">
                                                        {/* Render Configured Layout */}
                                                        {layout.map((row, i) => (
                                                            <div key={i} className="grid grid-cols-2 gap-3">
                                                                {renderInput(row[0])}
                                                                {row[1] ? renderInput(row[1]) : <div />}
                                                            </div>
                                                        ))}

                                                        {/* Render Remaining Fields (Grid Flow) */}
                                                        {remainingFields.length > 0 && (
                                                            <div className="grid grid-cols-2 gap-3 mt-2 border-t border-dashed border-slate-200 pt-3">
                                                                {remainingFields.map(field => renderInput(field))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* 5. CONSIDERAÇÕES FINAIS IA */}
                                        <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">5. Considerações Finais</label>
                                                <button
                                                    onClick={() => handleGenerateIA('consideracoes')}
                                                    disabled={generatingIA.consideracoes}
                                                    className="text-[9px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-tighter flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {generatingIA.consideracoes ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={12} />}
                                                    Gerar com IA
                                                </button>
                                            </div>
                                            <textarea
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                placeholder="As considerações finais serão geradas aqui..."
                                                value={formData.data.setorial[activeSector].consideracoes}
                                                onChange={(e) => updateSetorialField(activeSector, 'consideracoes', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Observações Gerais do Setor</label>
                                            <textarea
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[100px]"
                                                value={formData.data.setorial[activeSector].observacoes}
                                                onChange={(e) => updateSetorialField(activeSector, 'observacoes', e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={() => finalizeSectoral(activeSector)}
                                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${formData.data.submissoes_setoriais[activeSector]?.preenchido
                                                ? 'bg-amber-100 text-amber-700 shadow-sm'
                                                : 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-95'
                                                }`}
                                        >
                                            {formData.data.submissoes_setoriais[activeSector]?.preenchido ? (
                                                <>Complementar Informações <CheckCircle2 size={16} /></>
                                            ) : (
                                                <>Finalizar Minha Parte <Save size={16} /></>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role) && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <Shield className="text-blue-600 mt-0.5" size={16} />
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-900 uppercase">Visão de Monitoramento</p>
                                                <p className="text-[9px] text-blue-700">Como Agente, você visualiza todas as secretarias. Use o dashboard para ver o progresso detalhado.</p>
                                            </div>
                                        </div>
                                        {/* Listar todas com resumo básico para admin */}
                                        <div className="space-y-4">
                                            {Object.keys(formData.data.submissoes_setoriais).map(s => (
                                                <div key={s} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-black uppercase text-slate-500 text-[9px] tracking-widest">{s}</span>
                                                        {formData.data.submissoes_setoriais[s].preenchido ? (
                                                            <span className="text-green-600 font-black text-[9px] flex items-center gap-1">FINALIZADO <Shield size={12} /></span>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[9px]">Pendente</span>
                                                        )}
                                                    </div>
                                                    {/* Mostrar campos preenchidos p/ admin */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {Object.entries(formData.data.setorial[s])
                                                            .filter(([k, v]) => !['introducao', 'consideracoes', 'observacoes'].includes(k) && (v !== 0 && v !== ''))
                                                            .map(([k, v]) => (
                                                                <div key={k} className="flex justify-between border-b border-slate-200 pb-1">
                                                                    <span className="text-[8px] text-slate-400 uppercase">{k.replace(/_/g, ' ')}</span>
                                                                    <span className="text-[9px] font-bold">{v}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* METADADOS OFICIAIS (Only for Admin/Defesa Civil) */}
                {(!activeSector || ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role)) && (
                    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                        <SectionHeader
                            icon={FileText}
                            title="Metadados Oficiais"
                            isOpen={openSections.metadata_oficial}
                            onToggle={() => toggleSection('metadata_oficial')}
                            color="slate"
                        />
                        {openSections.metadata_oficial && (
                            <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Intensidade (Portaria 260)</p>
                                        <h4 className="text-xl font-black text-white italic">
                                            {formData.data.metadata_oficial.intensidade || 'NÃO DEFINIDA'}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => setShowIntensity(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                                    >
                                        Calcular
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => updateMetadataOficial('plano_acionado', !formData.data.metadata_oficial.plano_acionado)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.data.metadata_oficial.plano_acionado ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
                                    >
                                        <div className="text-left">
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Plano Contingência</p>
                                            <p className="text-xs font-bold leading-none">{formData.data.metadata_oficial.plano_acionado ? 'ACIONADO' : 'NÃO ACIONADO'}</p>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.data.metadata_oficial.plano_acionado ? 'bg-white/30' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${formData.data.metadata_oficial.plano_acionado ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateMetadataOficial('necessita_apoio', !formData.data.metadata_oficial.necessita_apoio)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.data.metadata_oficial.necessita_apoio ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
                                    >
                                        <div className="text-left">
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Solicitar Apoio Estadual</p>
                                            <p className="text-xs font-bold leading-none">{formData.data.metadata_oficial.necessita_apoio ? 'SIM (SOLICITADO)' : 'NÃO NECESSITA'}</p>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.data.metadata_oficial.necessita_apoio ? 'bg-white/30' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${formData.data.metadata_oficial.necessita_apoio ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                                {/* Other metadata fields can go here */}
                            </div>
                        )}
                    </div>
                )}


                {/* EVIDÊNCIAS FOTOGRÁFICAS */}
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <SectionHeader
                        icon={ImageIcon}
                        title="Evidências Fotográficas Georreferenciadas"
                        isOpen={openSections.evidencias}
                        onToggle={() => toggleSection('evidencias')}
                        color="slate"
                    />
                    {openSections.evidencias && (
                        <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {formData.data.evidencias
                                    .filter(p => !activeSector || p.sector === activeSector || ['Admin', 'Coordenador', 'Agente de Defesa Civil'].includes(user?.role))
                                    .map((photo, index) => (
                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                                            <img src={photo.url} className="w-full h-full object-cover" alt="Evidência" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                                <p className="text-[8px] text-white font-bold flex items-center gap-1">
                                                    <MapPin size={10} /> 
                                                    {photo && photo.lat != null && photo.lng != null 
                                                        ? `${Number(photo.lat).toFixed(4)}, ${Number(photo.lng).toFixed(4)}` 
                                                        : 'Sem GPS'}
                                                </p>
                                                <p className="text-[8px] text-white/70 flex items-center gap-1">
                                                    <ClockIcon size={10} /> 
                                                    {photo.timestamp ? new Date(photo.timestamp).toLocaleTimeString() : 'Sem data'}
                                                </p>
                                                {photo.sector && <p className="text-[7px] text-blue-300 font-black uppercase mt-1">Setor: {photo.sector}</p>}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newPhotos = formData.data.evidencias.filter((_, i) => i !== index);
                                                    setFormData(prev => ({ ...prev, data: { ...prev.data, evidencias: newPhotos } }));
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-slate-400"
                                >
                                    <Camera size={24} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Adicionar Foto</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ASSINATURA DIGITAL */}
                <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <SectionHeader
                        icon={PenTool}
                        title="Assinatura do Responsável"
                        isOpen={openSections.assinatura}
                        onToggle={() => toggleSection('assinatura')}
                        color="slate"
                    />
                    {openSections.assinatura && (
                        <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Nome do Responsável</label>
                                    <input
                                        type="text"
                                        disabled={activeSector && formData.data.submissoes_setoriais[activeSector]?.preenchido}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-60"
                                        value={activeSector ? formData.data.submissoes_setoriais[activeSector].responsavel : formData.data.assinatura.responsavel}
                                        onChange={(e) => {
                                            if (activeSector) {
                                                updateSectoralSubmission(activeSector, 'responsavel', e.target.value);
                                            } else {
                                                setFormData(prev => ({ ...prev, data: { ...prev.data, assinatura: { ...prev.data.assinatura, responsavel: e.target.value } } }));
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Cargo / Função</label>
                                    <input
                                        type="text"
                                        disabled={activeSector && formData.data.submissoes_setoriais[activeSector]?.preenchido}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold disabled:opacity-60"
                                        value={activeSector ? formData.data.submissoes_setoriais[activeSector].cargo : formData.data.assinatura.cargo}
                                        onChange={(e) => {
                                            if (activeSector) {
                                                updateSectoralSubmission(activeSector, 'cargo', e.target.value);
                                            } else {
                                                setFormData(prev => ({ ...prev, data: { ...prev.data, assinatura: { ...prev.data.assinatura, cargo: e.target.value } } }));
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[150px]">
                                {(activeSector ? formData.data.submissoes_setoriais[activeSector].assinatura_url : formData.data.assinatura.data_url) ? (
                                    <div className="text-center">
                                        <img src={activeSector ? formData.data.submissoes_setoriais[activeSector].assinatura_url : formData.data.assinatura.data_url} className="max-h-[100px] mb-2 grayscale contrast-125" alt="Assinatura" />
                                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
                                            Assinado Digitalmente {activeSector ? `por ${activeSector.toUpperCase()}` : ''}
                                        </p>
                                        {!((activeSector && formData.data.submissoes_setoriais[activeSector]?.preenchido) || isGlobalReadOnly) && (
                                            <button onClick={() => setShowSignature(true)} className="mt-2 text-[9px] text-blue-600 font-black uppercase">Alterar Assinatura</button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowSignature(true)}
                                        disabled={isGlobalReadOnly}
                                        className="flex flex-col items-center gap-2 group disabled:opacity-40"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-active:scale-95 transition-all">
                                            <PenTool size={20} className="text-slate-400" />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coletar Assinatura Setorial</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Offline/Warning Footer */}
            {
                !navigator.onLine && (
                    <div className="fixed bottom-24 left-4 right-4 bg-amber-500 text-white p-3 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
                        <AlertTriangle size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">
                            Você está offline. Alterações salvas localmente!
                        </span>
                    
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
                                    observacoes: prev.observacoes ? prev.observacoes + "<br><br>" + citacao : citacao 
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
                )
            }

            {/* MODALS */}
            {
                showCamera && (
                    <RedapPhotoCapture
                        onSave={(photo) => {
                            const photoWithSector = { ...photo, sector: activeSector || 'defesa_civil' };
                            setFormData(prev => ({ ...prev, data: { ...prev.data, evidencias: [...prev.data.evidencias, photoWithSector] } }));
                            setShowCamera(false);
                            toast.success('Pronto', 'Foto georreferenciada capturada.');
                        }}
                        onCancel={() => setShowCamera(false)}
                    />
                )
            }

            {
                showSignature && (
                    <RedapSignature
                        onSave={(dataUrl) => {
                            if (activeSector) {
                                updateSectoralSubmission(activeSector, 'assinatura_url', dataUrl);
                            } else {
                                setFormData(prev => ({
                                    ...prev,
                                    data: {
                                        ...prev.data,
                                        assinatura: {
                                            ...prev.data.assinatura,
                                            data_url: dataUrl,
                                            data_assinatura: new Date().toISOString()
                                        }
                                    }
                                }));
                            }
                            setShowSignature(false);
                            toast.success('Sucesso', 'Assinatura registrada.');
                        }}
                        onCancel={() => setShowSignature(false)}
                    />
                )
            }
            {
                showIntensity && (
                    <RedapIntensityModal
                        isOpen={showIntensity}
                        onClose={() => setShowIntensity(false)}
                        formData={formData}
                        onSave={(intensityData) => {
                            setFormData(prev => ({
                                ...prev,
                                data: {
                                    ...prev.data,
                                    metadata_oficial: {
                                        ...prev.data.metadata_oficial,
                                        ...intensityData
                                    }
                                }
                            }));
                            toast.success('Sucesso', 'Intensidade e RCL atualizados no registro.');
                        }}
                    />
                )
            }
            {
                showLocationPicker && (
                    <RedapLocationPickerModal
                        isOpen={showLocationPicker}
                        onClose={() => setShowLocationPicker(false)}
                        initialLat={formData.data.localizacao?.lat}
                        initialLng={formData.data.localizacao?.lng}
                        onSave={(lat, lng) => {
                            setFormData(prev => ({
                                ...prev,
                                data: {
                                    ...prev.data,
                                    localizacao: {
                                        ...(prev.data.localizacao || {}),
                                        lat,
                                        lng,
                                        timestamp: new Date().toISOString()
                                    }
                                }
                            }));
                            isDirty.current = true;
                            setShowLocationPicker(false);
                            toast.success('Sucesso', 'Localização do evento atualizada.');
                        }}
                    />
                )
            }
        </div >
    );
};

export default RedapForm;
