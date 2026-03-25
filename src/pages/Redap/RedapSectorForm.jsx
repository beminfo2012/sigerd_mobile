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
        usuario_id: user?.id,
        assinatura_url: null,
        responsavel_nome: '',
        responsavel_cargo: ''
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
                    setExtraData(current.extra_parameters || {});
                }
            } else {
                setFormData(prev => ({ 
                    ...prev, 
                    secretaria_responsavel: sector,
                    extra_parameters: {} 
                }));
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
            // Use structural extra_parameters field (JSONB)
            await redapService.saveRegistration({
                ...formData,
                extra_parameters: extraData
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
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/redap/evento/${eventoId}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Registro de Dano</h1>
                        <p className="text-[10px] text-slate-400 dark:text-emerald-400/80 font-bold uppercase tracking-widest truncate max-w-[150px]">
                            {event?.nome_evento}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />} Enviar
                </button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">
                {/* Sector Info */}
                <div className="bg-blue-600 dark:bg-blue-700 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between transition-all">
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Responsabilidade Setorial</p>
                        <h2 className="text-xl font-black uppercase">{formData.secretaria_responsavel}</h2>
                    </div>
                    <Shield size={32} className="opacity-40" />
                </div>

                {/* Form Body */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors">
                    <div className="space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
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
                                            ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-lg' 
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Item Selection (Assisted) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Shield size={12} className="text-blue-500" /> Item / Instalação Afetada
                            </label>
                            <div className="relative">
                                <input
                                    list="sector-items"
                                    type="text"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100"
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
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <DollarSign size={12} className="text-blue-500" /> Valor Estimado (R$)
                            </label>
                            <CurrencyInput
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-100"
                                value={formData.valor_estimado}
                                onChange={(val) => setFormData(prev => ({ ...prev, valor_estimado: val }))}
                            />
                        </div>

                        {/* Extra Fields Section (Dynamic based on FIDE Models) */}
                        {extraFields.length > 0 && (
                            <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={12} /> Dados Técnicos do Setor
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {extraFields.map(field => (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tight">
                                                {field.label}
                                            </label>
                                            {field.type === 'number' ? (
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 text-sm"
                                                    value={extraData[field.name] || ''}
                                                    onChange={(e) => setExtraData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                />
                                            ) : field.type === 'boolean' ? (
                                                <div className="flex gap-2">
                                                    {['Sim', 'Não'].map(opt => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => setExtraData(prev => ({ ...prev, [field.name]: opt }))}
                                                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                                                extraData[field.name] === opt 
                                                                ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm' 
                                                                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700 dark:text-slate-100 text-sm"
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
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Info size={12} className="text-blue-500" /> Descrição Técnica Adicional
                            </label>
                            <textarea
                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 min-h-[100px]"
                                placeholder="Detalhes específicos, logradouros, ruas e pontos de referência..."
                                value={formData.descricao_detalhada}
                                onChange={(e) => setFormData(prev => ({ ...prev, descricao_detalhada: e.target.value }))}
                            />
                        </div>

                        {/* FIDE Narrative Sections */}
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Considerações Finais</label>
                                <textarea
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-medium text-slate-600 dark:text-slate-400 text-xs min-h-[80px]"
                                    placeholder="Parecer técnico final e conclusões do setor..."
                                    value={extraData.consideracoes || ''}
                                    onChange={(e) => setExtraData(prev => ({ ...prev, consideracoes: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* GPS Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 transition-colors">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Coordenadas GPS</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-100 tracking-tight">
                                {formData.latitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : 'Buscando Localização...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Photo Capture Section using App Standard FileInput */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-colors">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
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
                            <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-sm bg-slate-50 dark:bg-slate-800 transition-all">
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
