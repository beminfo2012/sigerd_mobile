import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, MapPin, Clock, AlertCircle,
    Navigation, Shield, Users, Info, Loader2
} from 'lucide-react';
import { getS2idById, saveS2idLocal, INITIAL_S2ID_STATE } from '../../services/s2idDb';
import { useToast } from '../../components/ToastNotification';
import { COBRADE_LIST } from '../../utils/cobradeData';

const OcorrenciasForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(INITIAL_S2ID_STATE);
    const [gpsStatus, setGpsStatus] = useState('idle'); // idle, locating, success, error

    useEffect(() => {
        if (id && id !== 'novo') {
            loadRecord(id);
        } else {
            // New record: Set current date/time and capture GPS
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
            captureGPS();
            setLoading(false);
        }
    }, [id]);

    const loadRecord = async (recordId) => {
        try {
            const record = await getS2idById(recordId);
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
                    data: {
                        ...prev.data,
                        localizacao: {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            timestamp: new Date().toISOString()
                        }
                    }
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

    const updateField = (section, field, value) => {
        setFormData(prev => {
            const newState = {
                ...prev,
                data: {
                    ...prev.data,
                    [section]: {
                        ...prev.data[section],
                        [field]: value
                    }
                }
            };

            // Auto-update COBRADE if denomination changes
            if (section === 'tipificacao' && field === 'denominacao') {
                const selected = COBRADE_LIST.find(c => c.name === value);
                if (selected) newState.data.tipificacao.cobrade = selected.code;
            }
            return newState;
        });
    };

    const handleSave = async () => {
        if (!formData.data.tipificacao.denominacao) {
            toast.error('Informe o tipo de desastre.');
            return;
        }

        setSaving(true);
        try {
            // Ensure status is finalized for the state dashboard to pick it up immediately
            const finalData = {
                ...formData,
                status: 'finalized',
                tipo_registro: 'ocorrencia',
                updated_at: new Date().toISOString()
            };
            await saveS2idLocal(finalData);
            toast.success('Ocorrência registrada com sucesso!');
            navigate('/ocorrencias');
        } catch (error) {
            toast.error('Falha ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-[#2a5299] animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/ocorrencias')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-black text-slate-800">Nova Ocorrência</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#2a5299] text-white px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar
                </button>
            </header>

            <main className="p-5 max-w-xl mx-auto space-y-6">
                {/* Geolocation Section */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-[#2a5299] rounded-lg">
                                <Navigation size={18} />
                            </div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ponto Geográfico</h2>
                        </div>
                        <button
                            onClick={captureGPS}
                            className="text-[10px] font-black text-[#2a5299] uppercase tracking-widest hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                            Atualizar
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        {gpsStatus === 'locating' ? (
                            <div className="flex items-center gap-3 text-slate-400">
                                <Loader2 size={20} className="animate-spin" />
                                <span className="text-xs font-bold">Obtendo coordenadas...</span>
                            </div>
                        ) : gpsStatus === 'success' ? (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Latitude:</span>
                                    <span className="text-slate-800">{formData.data.localizacao.lat?.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-400">Longitude:</span>
                                    <span className="text-slate-800">{formData.data.localizacao.lng?.toFixed(6)}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-2 text-[9px] text-emerald-600 font-black uppercase">
                                    <MapPin size={10} /> Precisão: {formData.data.localizacao.accuracy?.toFixed(1)}m
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertCircle size={20} />
                                <span className="text-xs font-bold text-red-600">Erro ao obter GPS</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disaster Identification */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                            <Shield size={18} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipificação do Desastre</h2>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">COBRADE</label>
                        <input
                            type="text"
                            placeholder="Ex: 1.2.3.0.0"
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#2a5299] outline-none transition-all font-bold text-sm"
                            value={formData.data.tipificacao.cobrade}
                            onChange={(e) => updateField('tipificacao', 'cobrade', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Evento</label>
                        <input
                            type="text"
                            list="cobrade-list"
                            placeholder="Selecione o tipo..."
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-[#2a5299] outline-none transition-all font-bold text-sm"
                            value={formData.data.tipificacao.denominacao}
                            onChange={(e) => updateField('tipificacao', 'denominacao', e.target.value)}
                        />
                        <datalist id="cobrade-list">
                            {COBRADE_LIST.map(c => <option key={c.code} value={c.name} />)}
                        </datalist>
                    </div>
                </div>

                {/* Human Damages (Critical) */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                            <Users size={18} />
                        </div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Danos Humanos</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Mortos', field: 'mortos', color: 'bg-slate-900 text-white' },
                            { label: 'Feridos', field: 'feridos', color: 'bg-orange-500 text-white' },
                            { label: 'Desabrigados', field: 'desabrigados', color: 'bg-blue-600 text-white' },
                            { label: 'Desalojados', field: 'desalojados', color: 'bg-[#2a5299] text-white' },
                            { label: 'Desaparecidos', field: 'desaparecidos', color: 'bg-slate-400 text-white' },
                            { label: 'Outros Afetados', field: 'outros_afetados', color: 'bg-secondary text-white' }
                        ].map((item) => (
                            <div key={item.field} className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.label}</label>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => updateField('danos_humanos', item.field, Math.max(0, (formData.data.danos_humanos[item.field] || 0) - 1))}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-l-xl active:bg-slate-200 transition-colors"
                                    >-</button>
                                    <input
                                        type="number"
                                        className={`w-full h-10 bg-slate-50 border-y border-slate-100 text-center font-bold text-slate-800 outline-none`}
                                        value={formData.data.danos_humanos[item.field] || 0}
                                        onChange={(e) => updateField('danos_humanos', item.field, parseInt(e.target.value) || 0)}
                                    />
                                    <button
                                        onClick={() => updateField('danos_humanos', item.field, (formData.data.danos_humanos[item.field] || 0) + 1)}
                                        className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-r-xl active:bg-slate-200 transition-colors"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Info */}
                <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex gap-4">
                    <Info className="text-[#2a5299] shrink-0" size={24} />
                    <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                        Ao salvar, esta ocorrência será enviada automaticamente ao Painel Conecta Estadual quando o dispositivo estiver online.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default OcorrenciasForm;
