import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, MapPin, Navigation, Shield, Users, Info, Loader2,
    RefreshCw, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { saveOcorrenciaLocal, getOcorrenciaById, INITIAL_OCORRENCIA_STATE } from '../../services/ocorrenciasDb';
import { useToast } from '../../components/ToastNotification';
import { COBRADE_LIST } from '../../utils/cobradeData';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const OcorrenciasForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(INITIAL_OCORRENCIA_STATE);
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle, locating, success, error

    useEffect(() => {
        if (id && id !== 'novo') {
            loadRecord(id);
        } else {
            const now = new Date();
            setFormData(prev => ({
                ...prev,
                data_ocorrencia: now.toLocaleDateString('pt-BR'),
                horario_ocorrencia: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }));
            captureGPS();
            setLoading(false);
        }
    }, [id]);

    const loadRecord = async (recordId) => {
        try {
            const record = await getOcorrenciaById(recordId);
            if (record) setFormData(record);
        } catch (error) {
            toast.error('Erro ao carregar registro.');
        } finally {
            setLoading(false);
        }
    };

    const captureGPS = () => {
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        setGpsStatus('locating');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    gps_timestamp: new Date().toISOString()
                }));
                setGpsStatus('success');
            },
            (err) => {
                console.error('GPS Error:', err);
                setGpsStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const updateField = (field, value) => {
        setFormData(prev => {
            const newState = {
                ...prev,
                [field]: value
            };
            if (field === 'denominacao') {
                const selected = COBRADE_LIST.find(c => c.name === value);
                if (selected) newState.cobrade = selected.code;
            }
            return newState;
        });
    };

    const handleDamageChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: parseInt(value) || 0
        }));
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

    const inputClasses = "w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500/50 outline-none transition-all font-bold text-sm dark:text-white"
    const labelClasses = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1"

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
                        <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                            {id && id !== 'novo' ? 'Editar Ocorrência' : 'Nova Ocorrência'}
                        </h1>
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
                {/* Identification & Time */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">Geral e Tempo</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Data do Evento</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.data_ocorrencia}
                                onChange={(e) => updateField('data_ocorrencia', e.target.value)}
                                placeholder="DD/MM/AAAA"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Horário</label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={formData.horario_ocorrencia}
                                onChange={(e) => updateField('horario_ocorrencia', e.target.value)}
                                placeholder="HH:MM"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Código COBRADE</label>
                            <input
                                type="text"
                                placeholder="Ex: 1.2.3.0.0"
                                className={inputClasses}
                                value={formData.cobrade}
                                onChange={(e) => updateField('cobrade', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Tipo de Evento / Desastre</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50" size={18} />
                                <input
                                    type="text"
                                    list="cobrade-list"
                                    placeholder="Ex: Enxurrada, Deslizamento..."
                                    className={`${inputClasses} pl-12`}
                                    value={formData.denominacao}
                                    onChange={(e) => updateField('denominacao', e.target.value)}
                                />
                                <datalist id="cobrade-list">
                                    {COBRADE_LIST.map(c => <option key={c.code} value={c.name} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Geolocation Section */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-[#2a5299] dark:text-blue-400 rounded-2xl">
                                <Navigation size={22} />
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Localização do Evento</h2>
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Captação GPS Automática</p>
                            </div>
                        </div>
                        <button
                            onClick={captureGPS}
                            className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                        >
                            <RefreshCw size={18} className={gpsStatus === 'locating' ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className={`rounded-3xl p-6 border-2 transition-all ${gpsStatus === 'locating' ? 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-700' :
                        gpsStatus === 'success' ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' :
                            'bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
                        {gpsStatus === 'locating' ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                                <Loader2 size={32} className="text-blue-600 animate-spin" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Sincronizando com Satélites...</span>
                            </div>
                        ) : gpsStatus === 'success' ? (
                            <div className="grid grid-cols-2 gap-8 relative overflow-hidden">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Latitude</span>
                                    <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{formData.lat?.toFixed(7)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Longitude</span>
                                    <p className="text-lg font-black text-slate-800 dark:text-white font-mono">{formData.lng?.toFixed(7)}</p>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-emerald-100/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                                        <ShieldCheck size={14} /> Precisão: {formData.accuracy?.toFixed(1)}m
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400">PONTO FIXADO</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-4 text-red-500">
                                <AlertTriangle size={32} />
                                <span className="text-sm font-black uppercase tracking-widest text-center">Erro no Receptor GPS<br /><span className="text-[10px] opacity-70">Verifique as permissões</span></span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Human Damages */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-6 mb-8">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">Danos Humanos</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {[
                            { label: 'Óbitos', field: 'mortos' },
                            { label: 'Feridos', field: 'feridos' },
                            { label: 'Desabrigados', field: 'desabrigados' },
                            { label: 'Desalojados', field: 'desalojados' },
                            { label: 'Desaparecidos', field: 'desaparecidos' },
                            { label: 'Afetados', field: 'outros_afetados' }
                        ].map((item) => (
                            <div key={item.field} className="space-y-3">
                                <label className={labelClasses}>{item.label}</label>
                                <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm focus-within:border-red-500/20 transition-all">
                                    <button
                                        type="button"
                                        onClick={() => handleDamageChange(item.field, Math.max(0, (formData[item.field] || 0) - 1))}
                                        className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all text-xl font-bold"
                                    >-</button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        className="w-full bg-transparent border-none text-center font-black text-xl text-slate-800 dark:text-white focus:ring-0"
                                        value={formData[item.field] || 0}
                                        onChange={(e) => handleDamageChange(item.field, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleDamageChange(item.field, (formData[item.field] || 0) + 1)}
                                        className="w-14 h-14 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all text-xl font-bold"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Material Damages & Observations */}
                <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-sm dark:bg-slate-800 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-700/50 pb-4">
                        <div className="w-1.5 h-6 bg-orange-600 rounded-full"></div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-[3px]">Danos Materiais e Notas</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={labelClasses}>Descrição de Danos Materiais</label>
                            <textarea
                                rows={3}
                                className={`${inputClasses} resize-none min-h-[100px] py-4`}
                                placeholder="Descreva os danos em residências, infraestrutura publica, etc..."
                                value={formData.descricao_danos}
                                onChange={(e) => updateField('descricao_danos', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className={labelClasses}>Observações Adicionais</label>
                            <textarea
                                rows={3}
                                className={`${inputClasses} resize-none min-h-[100px] py-4`}
                                placeholder="Notas técnicas, recomendações ou informações complementares..."
                                value={formData.observacoes}
                                onChange={(e) => updateField('observacoes', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Notification */}
                <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-[32px] border border-red-100 dark:border-red-900/30 flex gap-4 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                        <ShieldCheck className="text-red-600" size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest mb-1">Nota Operacional</h4>
                        <p className="text-[11px] font-bold text-red-600/80 dark:text-red-400/80 leading-relaxed">
                            Ao finalizar, estes dados serão encaminhados para o Banco de Dados Operacional da Defesa Civil Estadual assim que houver conectividade.
                        </p>
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-16 rounded-3xl text-lg relative overflow-hidden group border-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 transition-transform group-hover:scale-105 duration-500"></div>
                        <div className="relative flex items-center gap-3">
                            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            <span>{saving ? 'PROCESSANDO...' : 'REGISTRAR OCORRÊNCIA'}</span>
                        </div>
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default OcorrenciasForm;
