import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Globe, AlertTriangle,
    ChevronDown, ChevronUp, FileText,
    Users, Home, Leaf, Shield
} from 'lucide-react';
import { getS2idById, saveS2idLocal, INITIAL_S2ID_STATE } from '../../services/s2idDb';
import { useToast } from '../../components/ToastNotification';
import { UserContext } from '../../App';
import { COBRADE_LIST } from '../../utils/cobradeData';
import { generateS2idReport } from '../../utils/s2idReportGenerator';
import S2idSignature from './components/S2idSignature';
import S2idPhotoCapture from './components/S2idPhotoCapture';
import { Camera, PenTool, Trash2, MapPin, Clock as ClockIcon, Image as ImageIcon } from 'lucide-react';

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

const S2idForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    const [formData, setFormData] = useState(INITIAL_S2ID_STATE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [openSections, setOpenSections] = useState({
        tipificacao: true,
        danos_humanos: false,
        danos_materiais: false,
        danos_ambientais: false,
        prejuizos_publicos: false,
        prejuizos_privados: false,
        setorial: true,
        evidencias: false,
        assinatura: false
    });
    const [showCamera, setShowCamera] = useState(false);
    const [showSignature, setShowSignature] = useState(false);

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
            const record = await getS2idById(recordId);
            if (record) {
                setFormData(record);
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
        if (loading) return;

        const timer = setTimeout(() => {
            handleAutoSave();
        }, 2000); // 2 seconds of inactivity

        return () => clearTimeout(timer);
    }, [formData]);

    const handleAutoSave = async () => {
        if (loading || saving) return;
        setSaving(true);
        try {
            const savedId = await saveS2idLocal(formData);
            if (!id || id === 'novo') {
                // If new, update URL without reloading
                window.history.replaceState(null, '', `/s2id/editar/${savedId}`);
                setFormData(prev => ({ ...prev, id: savedId }));
            }
        } catch (error) {
            console.warn('Auto-save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    // Role-based permissions
    const canEditSection = (section) => {
        if (!user) return false;
        const role = user.role;
        const fullAccess = ['Admin', 'Coordenador', 'Agente de Defesa Civil', 'S2id_Geral', 'admin'].includes(role);
        if (fullAccess) return true;

        const permissions = {
            tipificacao: ['Admin', 'Coordenador'],
            data_ocorrencia: ['Admin', 'Coordenador'],
            danos_humanos: ['S2id_Saude', 'S2id_Social'],
            danos_materiais: ['S2id_Obras', 'S2id_Setorial'],
            danos_ambientais: ['S2id_MeioAmbiente', 'S2id_Agricultura'],
            prejuizos_publicos: ['S2id_Obras', 'S2id_Educacao', 'S2id_Saude'],
            prejuizos_privados: ['S2id_Agricultura', 'S2id_Social'],
            setorial: ['S2id_Saude', 'S2id_Obras', 'S2id_Social', 'S2id_Educacao', 'S2id_Agricultura', 'S2id_Setorial'],
            evidencias: ['S2id_Saude', 'S2id_Obras', 'S2id_Social', 'S2id_Educacao', 'S2id_Agricultura', 'S2id_Setorial'],
            assinatura: ['S2id_Saude', 'S2id_Obras', 'S2id_Social', 'S2id_Educacao', 'S2id_Agricultura', 'S2id_Setorial']
        };

        return permissions[section]?.includes(role) || false;
    };

    const isGlobalReadOnly = !['Admin', 'Coordenador', 'Agente de Defesa Civil', 'S2id_Geral', 'S2id_Setorial', 'S2id_Saude', 'S2id_Educacao', 'S2id_Obras', 'S2id_Agricultura', 'S2id_Social', 'admin'].includes(user?.role);

    const updateData = (section, field, value) => {
        if (!canEditSection(section)) return;
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

    const updateSetorialField = (sector, field, value) => {
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
            <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/s2id')} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Formulário S2id</h1>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                {saving ? 'Salvando...' : 'Trabalho Salvo'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => generateS2idReport(formData, user)}
                        className="bg-slate-100 text-slate-700 p-2.5 rounded-xl active:scale-95 transition-all hover:bg-slate-200 flex items-center gap-2"
                        title="Gerar Relatório PDF"
                    >
                        <FileText size={18} />
                    </button>
                    <button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, status: 'submitted' }));
                            toast.success('Finalizado', 'Formulário marcado como finalizado.');
                        }}
                        disabled={saving || !['Admin', 'Coordenador', 'Agente de Defesa Civil', 'admin'].includes(user?.role)}
                        className="bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                    >
                        Finalizar
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* 2. TIPIGICAÇÃO & 3. DATA */}
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
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">COBRADE</label>
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
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Denominação (Tipo/Subtipo)</label>
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

                        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Data da Ocorrência</div>
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
                    </div>
                )}

                {/* 6.1 DANOS HUMANOS */}
                <SectionHeader
                    icon={Users}
                    title="6.1 Danos Humanos"
                    isOpen={openSections.danos_humanos}
                    onToggle={() => toggleSection('danos_humanos')}
                    color="slate"
                />
                {openSections.danos_humanos && (
                    <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                        {['mortos', 'feridos', 'enfermos', 'desabrigados', 'desalojados', 'desaparecidos', 'outros_afetados'].map(field => (
                            <div key={field}>
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{field.replace('_', ' ')}</label>
                                <input
                                    type="number"
                                    disabled={!canEditSection('danos_humanos')}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold disabled:opacity-60"
                                    value={formData.data.danos_humanos[field]}
                                    onChange={(e) => updateData('danos_humanos', field, parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ))}
                        <div className="col-span-full">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">6.1.1 Descrição</label>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[100px] disabled:opacity-60"
                                disabled={!canEditSection('danos_humanos')}
                                value={formData.data.danos_humanos.descricao}
                                onChange={(e) => updateData('danos_humanos', 'descricao', e.target.value)}
                                placeholder="Descreva os danos humanos..."
                            />
                        </div>
                    </div>
                )}

                {/* 6.2 DANOS MATERIAIS */}
                <SectionHeader
                    icon={Home}
                    title="6.2 Danos Materiais"
                    isOpen={openSections.danos_materiais}
                    onToggle={() => toggleSection('danos_materiais')}
                    color="slate"
                />
                {openSections.danos_materiais && (
                    <div className="p-4 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                        <table className="w-full text-left min-w-[500px]">
                            <thead>
                                <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4 pl-2">Discriminação</th>
                                    <th className="pb-4 text-center">Danificadas</th>
                                    <th className="pb-4 text-center">Destruídas</th>
                                    <th className="pb-4 text-right pr-2">Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {Object.keys(formData.data.danos_materiais).map(key => (
                                    <tr key={key} className="border-t border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-2 font-bold text-slate-700 capitalize text-xs">
                                            {key.replace(/_/g, ' ')}
                                        </td>
                                        <td className="py-2 text-center">
                                            <input
                                                type="number"
                                                disabled={!canEditSection('danos_materiais')}
                                                className="w-16 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                value={formData.data.danos_materiais[key].danificadas}
                                                onChange={(e) => updateDeepData('danos_materiais', key, 'danificadas', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="py-2 text-center">
                                            <input
                                                type="number"
                                                disabled={!canEditSection('danos_materiais')}
                                                className="w-16 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                value={formData.data.danos_materiais[key].destruidas}
                                                onChange={(e) => updateDeepData('danos_materiais', key, 'destruidas', parseInt(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="py-2 pr-2 text-right">
                                            <input
                                                type="number"
                                                disabled={!canEditSection('danos_materiais')}
                                                className="w-24 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-right font-bold outline-none focus:ring-1 focus:ring-blue-500 text-xs disabled:opacity-60"
                                                value={formData.data.danos_materiais[key].valor}
                                                onChange={(e) => updateDeepData('danos_materiais', key, 'valor', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 6.3 DANOS AMBIENTAIS */}
                <SectionHeader
                    icon={Leaf}
                    title="6.3 Danos Ambientais"
                    isOpen={openSections.danos_ambientais}
                    onToggle={() => toggleSection('danos_ambientais')}
                    color="slate"
                />
                {openSections.danos_ambientais && (
                    <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {Object.keys(formData.data.danos_ambientais).filter(k => k !== 'descricao').map(key => (
                            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex-1 font-bold text-slate-700 text-xs capitalize">{key.replace(/_/g, ' ')}</div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            disabled={!canEditSection('danos_ambientais')}
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                                            checked={formData.data.danos_ambientais[key].sim}
                                            onChange={(e) => updateDeepData('danos_ambientais', key, 'sim', e.target.checked)}
                                        />
                                        <span className="text-[10px] font-black uppercase text-slate-400">Sim</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={key === 'incendios' ? "Área" : "População"}
                                        className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                                        value={formData.data.danos_ambientais[key][key === 'incendios' ? 'area' : 'populacao']}
                                        onChange={(e) => updateDeepData('danos_ambientais', key, key === 'incendios' ? 'area' : 'populacao', e.target.value)}
                                        disabled={!formData.data.danos_ambientais[key].sim || !canEditSection('danos_ambientais')}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 7. PREJUÍZOS */}
                <SectionHeader
                    icon={FileText}
                    title="7. Prejuízos Públicos & Privados"
                    isOpen={openSections.prejuizos_publicos}
                    onToggle={() => toggleSection('prejuizos_publicos')}
                    color="slate"
                />
                {openSections.prejuizos_publicos && (
                    <div className="p-4 bg-white space-y-6 animate-in slide-in-from-top-2 duration-300">
                        {/* Públicos */}
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">7.1 Públicos</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.keys(formData.data.prejuizos_publicos).map(key => (
                                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase capitalize">{key.replace(/_/g, ' ')}</span>
                                        <input
                                            type="number"
                                            disabled={!canEditSection('prejuizos_publicos')}
                                            className="w-24 p-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                                            value={formData.data.prejuizos_publicos[key]}
                                            onChange={(e) => updateData('prejuizos_publicos', key, parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* EXPANSÃO SETORIAL ESPECÍFICA */}
                {(user?.role.startsWith('S2id_') || ['Admin', 'Coordenador', 'Agente de Defesa Civil'].includes(user?.role)) && (
                    <>
                        <SectionHeader
                            icon={Globe}
                            title={`Relatório Setorial: ${user?.role.replace('S2id_', '') || 'Geral'}`}
                            isOpen={openSections.setorial}
                            onToggle={() => toggleSection('setorial')}
                            color="blue"
                        />
                        {openSections.setorial && (
                            <div className="p-4 bg-white space-y-4 animate-in slide-in-from-top-2 duration-300">
                                {user?.role === 'S2id_Saude' && (
                                    <>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Unidades de Saúde Afetadas</label>
                                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data.setorial.saude.unidades_afetadas} onChange={(e) => updateSetorialField('saude', 'unidades_afetadas', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Perda de Medicamentos/Insumos</label>
                                            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" value={formData.data.setorial.saude.medicamentos_perda} onChange={(e) => updateSetorialField('saude', 'medicamentos_perda', e.target.value)} />
                                        </div>
                                    </>
                                )}
                                {user?.role === 'S2id_Obras' && (
                                    <>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Pontes/Pontilhões Comprometidos</label>
                                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data.setorial.obras.pontes_danificadas} onChange={(e) => updateSetorialField('obras', 'pontes_danificadas', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Área de Pavimentação Atingida (m²)</label>
                                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data.setorial.obras.pavimentacao_m2} onChange={(e) => updateSetorialField('obras', 'pavimentacao_m2', e.target.value)} />
                                        </div>
                                    </>
                                )}
                                {user?.role === 'S2id_Social' && (
                                    <>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Famílias cadastradas p/ Assistência</label>
                                            <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data.setorial.social.familias_desabrigadas} onChange={(e) => updateSetorialField('social', 'familias_desabrigadas', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Necessidade de Cestas Básicas / Kits</label>
                                            <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.data.setorial.social.cestas_basicas} onChange={(e) => updateSetorialField('social', 'cestas_basicas', e.target.value)} />
                                        </div>
                                    </>
                                )}
                                {['Admin', 'Coordenador', 'Agente de Defesa Civil'].includes(user?.role) && (
                                    <p className="text-[10px] text-slate-400 italic">Visão consolidada: Todos os campos setoriais estão disponíveis para edição administrativa.</p>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* EVIDÊNCIAS FOTOGRÁFICAS */}
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
                            {formData.data.evidencias.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                                    <img src={photo.url} className="w-full h-full object-cover" alt="Evidência" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                        <p className="text-[8px] text-white font-bold flex items-center gap-1"><MapPin size={10} /> {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}</p>
                                        <p className="text-[8px] text-white/70 flex items-center gap-1"><ClockIcon size={10} /> {new Date(photo.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newPhotos = [...formData.data.evidencias];
                                            newPhotos.splice(index, 1);
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

                {/* ASSINATURA DIGITAL */}
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
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                    value={formData.data.assinatura.responsavel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, data: { ...prev.data, assinatura: { ...prev.data.assinatura, responsavel: e.target.value } } }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1 ml-1">Cargo / Função</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                    value={formData.data.assinatura.cargo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, data: { ...prev.data, assinatura: { ...prev.data.assinatura, cargo: e.target.value } } }))}
                                />
                            </div>
                        </div>

                        <div className="mt-4 p-4 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center min-h-[150px]">
                            {formData.data.assinatura.data_url ? (
                                <div className="text-center">
                                    <img src={formData.data.assinatura.data_url} className="max-h-[100px] mb-2 grayscale contrast-125" alt="Assinatura" />
                                    <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Assinado Digitalmente em {new Date(formData.data.assinatura.data_assinatura).toLocaleString()}</p>
                                    <button onClick={() => setShowSignature(true)} className="mt-2 text-[9px] text-blue-600 font-black uppercase">Alterar Assinatura</button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowSignature(true)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm group-active:scale-95 transition-all">
                                        <PenTool size={20} className="text-slate-400" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coletar Assinatura</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Offline/Warning Footer */}
            {!navigator.onLine && (
                <div className="fixed bottom-24 left-4 right-4 bg-amber-500 text-white p-3 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
                    <AlertTriangle size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">
                        Você está offline. Alterações salvas localmente!
                    </span>
                </div>
            )}

            {/* MODALS */}
            {showCamera && (
                <S2idPhotoCapture
                    onSave={(photo) => {
                        setFormData(prev => ({ ...prev, data: { ...prev.data, evidencias: [...prev.data.evidencias, photo] } }));
                        setShowCamera(false);
                        toast.success('Pronto', 'Foto georreferenciada capturada.');
                    }}
                    onCancel={() => setShowCamera(false)}
                />
            )}

            {showSignature && (
                <S2idSignature
                    onSave={(dataUrl) => {
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
                        setShowSignature(false);
                        toast.success('Sucesso', 'Assinatura registrada.');
                    }}
                    onCancel={() => setShowSignature(false)}
                />
            )}
        </div>
    );
};

export default S2idForm;
