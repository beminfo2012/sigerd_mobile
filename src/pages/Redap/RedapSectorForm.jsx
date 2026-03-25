import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Camera, Save, ArrowLeft, 
    Shield, Info, Trash2, Image as ImageIcon,
    Clock, DollarSign, List, X
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { CurrencyInput } from '../../components/RedapInputs';
import FileInput from '../../components/FileInput';
import { REDAP_ITEM_MAPPING } from '../../services/redapService';

const RedapSectorForm = () => {
    const { eventoId, id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState(null);

    const [formData, setFormData] = useState({
        evento_id: eventoId,
        secretaria_responsavel: '',
        classificacao_dano: 'Dano Material',
        instalacao_afetada: '',
        descricao_detalhada: '',
        valor_estimado: 0,
        latitude: null,
        longitude: null,
        fotos: [],
        status_validacao: 'Enviado',
        usuario_id: user?.id
    });

    const [extraData, setExtraData] = useState({});

    useEffect(() => {
        loadData();
    }, [id, eventoId]);

    const handleFileSelect = (files) => {
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    fotos: [...prev.fotos, { 
                        id: crypto.randomUUID(), 
                        data: reader.result, 
                        timestamp: new Date().toISOString() 
                    }]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const events = await redapService.getActiveEvents();
            const currentEvent = events.find(e => e.id === eventoId);
            setEvent(currentEvent);

            const sector = redapService.REDAP_SECTORS[user?.role] || 'Não Identificado';
            
            if (id && id !== 'novo') {
                const regs = await redapService.getRegistrationsByEvent(eventoId);
                const current = regs.find(r => r.id === id);
                if (current) {
                    setFormData(current);
                    // Try to parse extra columns if they were prefix-encoded in description
                    try {
                        if (current.descricao_detalhada.includes('--- INFO EXTRA ---')) {
                            const [desc, extra] = current.descricao_detalhada.split('--- INFO EXTRA ---');
                            // Simple parsing could be added here if needed
                        }
                    } catch(e) {}
                }
            } else {
                setFormData(prev => ({ ...prev, secretaria_responsavel: sector }));
                navigator.geolocation.getCurrentPosition(
                    (pos) => setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
                    () => console.warn('GPS fail')
                );
            }
        } catch (error) {
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.instalacao_afetada) return toast.error('Informe o item afetado.');
        if (formData.fotos.length === 0) return toast.error('Adicione fotos da evidência.');

        setSaving(true);
        try {
            // Merge extraData into description
            let finalDescription = formData.descricao_detalhada;
            if (Object.keys(extraData).length > 0) {
                const extraString = Object.entries(extraData)
                    .map(([key, val]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${val}`)
                    .join(' | ');
                finalDescription = `${finalDescription}\n\n--- INFO EXTRA ---\n${extraString}`;
            }

            await redapService.saveRegistration({
                ...formData,
                descricao_detalhada: finalDescription
            });
            toast.success('Dano registrado com sucesso!');
            navigate(`/redap/evento/${eventoId}`);
        } catch (error) {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const sectorConfig = REDAP_ITEM_MAPPING[formData.secretaria_responsavel]?.[formData.classificacao_dano] || {};
    const availableTypes = REDAP_ITEM_MAPPING[formData.secretaria_responsavel] 
        ? Object.keys(REDAP_ITEM_MAPPING[formData.secretaria_responsavel]) 
        : ['Dano Material', 'Prejuízo Econômico'];
    const sectorItems = sectorConfig.items || [];
    const extraFields = sectorConfig.extraFields || [];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24 text-slate-800">
            <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/redap/evento/${eventoId}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight tracking-tight">Registro de Dano</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[150px]">
                            {event?.nome_evento}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center gap-2"
                >
                    {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Enviar
                </button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">
                {/* Sector Info */}
                <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Responsabilidade Setorial</p>
                        <h2 className="text-xl font-black uppercase">{formData.secretaria_responsavel}</h2>
                    </div>
                    <Shield size={32} className="opacity-40" />
                </div>

                {/* Form Body */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <List size={12} className="text-blue-500" /> Classificação do Impacto
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableTypes.map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, classificacao_dano: t, instalacao_afetada: '' }))}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            formData.classificacao_dano === t 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                            : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item Selection (Assisted) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Shield size={12} className="text-blue-500" /> Item / Instalação Afetada
                            </label>
                            <div className="relative">
                                <input
                                    list="sector-items"
                                    type="text"
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                    placeholder={formData.classificacao_dano === 'Dano Humano' ? 'Descreva o impacto humano...' : "Ex: Ponte, Escola, Lavoura..."}
                                    value={formData.instalacao_afetada}
                                    onChange={(e) => setFormData(prev => ({ ...prev, instalacao_afetada: e.target.value }))}
                                />
                                <datalist id="sector-items">
                                    {sectorItems.map(item => <option key={item} value={item} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* Financial Value (only if not human damage, or optional) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <DollarSign size={12} className="text-blue-500" /> Valor Estimado (R$)
                            </label>
                            <CurrencyInput
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                value={formData.valor_estimado}
                                onChange={(val) => setFormData(prev => ({ ...prev, valor_estimado: val }))}
                            />
                        </div>

                        {/* Extra Fields Section (Dynamic based on FIDE Models) */}
                        {extraFields.length > 0 && (
                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={12} /> Dados Técnicos do Setor
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {extraFields.map(field => (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                                {field.label}
                                            </label>
                                            {field.type === 'number' ? (
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700 text-sm"
                                                    value={extraData[field.name] || ''}
                                                    onChange={(e) => setExtraData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700 text-sm"
                                                    value={extraData[field.name] || ''}
                                                    onChange={(e) => setExtraData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Info size={12} className="text-blue-500" /> Descrição Técnica Adicional
                            </label>
                            <textarea
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 min-h-[100px]"
                                placeholder="Detalhes específicos, endereços atingidos..."
                                value={formData.descricao_detalhada}
                                onChange={(e) => setFormData(prev => ({ ...prev, descricao_detalhada: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                {/* GPS Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenadas GPS</p>
                            <p className="text-xs font-bold text-slate-700 tracking-tight">
                                {formData.latitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : 'Buscando Localização...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Photo Capture Section using App Standard FileInput */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                        Fotos de Evidência ({formData.fotos.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="aspect-square">
                            <FileInput 
                                label="Adicionar"
                                onFileSelect={handleFileSelect}
                                type="photo"
                            />
                        </div>
                        {formData.fotos.map((foto, idx) => (
                            <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 group shadow-sm bg-slate-50">
                                <img src={foto.url || foto.data} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== idx) }))}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RedapSectorForm;
