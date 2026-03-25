import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Camera, Save, ArrowLeft, 
    Shield, Info, Trash2, Image as ImageIcon,
    Clock, DollarSign, List
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { CurrencyInput } from '../../components/RedapInputs';
import RedapPhotoCapture from './components/RedapPhotoCapture';

const RedapSectorForm = () => {
    const { eventoId, id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
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

    useEffect(() => {
        loadData();
    }, [id, eventoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load event info
            const events = await redapService.getActiveEvents();
            const currentEvent = events.find(e => e.id === eventoId);
            setEvent(currentEvent);

            if (id && id !== 'novo') {
                // Load existing record logic here if needed
            } else {
                // New record: set sector from role
                const sector = redapService.REDAP_SECTORS[user?.role] || 'Não Identificado';
                setFormData(prev => ({ ...prev, secretaria_responsavel: sector }));
                
                // Try get GPS
                navigator.geolocation.getCurrentPosition(
                    (pos) => setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
                    () => console.warn('Could not get GPS')
                );
            }
        } catch (error) {
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.instalacao_afetada) {
            toast.error('Informe a instalação afetada.');
            return;
        }
        if (formData.fotos.length === 0) {
            toast.error('Adicione pelo menos uma foto de evidência.');
            return;
        }

        setSaving(true);
        try {
            await redapService.saveRegistration(formData);
            toast.success('Registro de dano enviado com sucesso!');
            navigate(`/redap/evento/${eventoId}`);
        } catch (error) {
            toast.error('Falha ao salvar registro.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/redap/evento/${eventoId}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Registrar Dano</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight truncate max-w-[150px]">
                            {event?.nome_evento || 'Carregando...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center gap-2"
                >
                    {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Enviar
                </button>
            </header>

            <main className="p-4 max-w-2xl mx-auto space-y-6">
                {/* Sector Header Card */}
                <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Secretaria Responsável</p>
                        <h2 className="text-xl font-black uppercase leading-none">{formData.secretaria_responsavel}</h2>
                    </div>
                    <Shield size={32} className="opacity-40" />
                </div>

                {/* Form Body */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <List size={12} className="text-blue-500" />
                                Classificação do Dano
                            </label>
                            <select
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                value={formData.classificacao_dano}
                                onChange={(e) => setFormData(prev => ({ ...prev, clasificacao_dano: e.target.value }))}
                            >
                                <option>Dano Material</option>
                                <option>Prejuízo Econômico</option>
                                <option>Dano Humano</option>
                                <option>Dano Ambiental</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Shield size={12} className="text-blue-500" />
                                Instalação Afetada
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                placeholder="Ex: Ponte Rio Vermelho, Escola Municipal..."
                                value={formData.instalacao_afetada}
                                onChange={(e) => setFormData(prev => ({ ...prev, instalacao_afetada: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <DollarSign size={12} className="text-blue-500" />
                                Valor Estimado de Prejuízo (R$)
                            </label>
                            <CurrencyInput
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                value={formData.valor_estimado}
                                onChange={(val) => setFormData(prev => ({ ...prev, valor_estimado: val }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Info size={12} className="text-blue-500" />
                                Descrição Detalhada
                            </label>
                            <textarea
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 min-h-[120px]"
                                placeholder="Descreva tecnicamente o que foi afetado e o grau de comprometimento..."
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
                                {formData.latitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : 'Obtendo GPS...'}
                            </p>
                        </div>
                    </div>
                    {!formData.latitude && (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>

                {/* Photo Capture Section */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Evidências Fotográficas ({formData.fotos.length})
                        </label>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                            <Camera size={16} /> Capturar
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {formData.fotos.map((foto, idx) => (
                            <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 group shadow-sm">
                                <img src={foto.url || foto.data} alt="Evidência" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== idx) }))}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {formData.fotos.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                                <ImageIcon size={32} className="text-slate-300 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma foto anexada</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showCamera && (
                <RedapPhotoCapture
                    onCapture={(data) => {
                        setFormData(prev => ({
                            ...prev,
                            fotos: [...prev.fotos, { id: crypto.randomUUID(), data, timestamp: new Date().toISOString() }]
                        }));
                        setShowCamera(false);
                    }}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </div>
    );
};

const X = ({ size, className }) => <Trash2 size={size} className={className} />;

export default RedapSectorForm;
