import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Flame, ArrowLeft, Save, MapPin, Calendar, Clock, Activity, FileText } from 'lucide-react';
import { toast } from '../../components/ToastNotification';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const FiregisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Component to capture map clicks
    const LocationPicker = () => {
        useMapEvents({
            click(e) {
                setFormData(prev => ({
                    ...prev,
                    coordenadas: { lat: e.latlng.lat, lng: e.latlng.lng }
                }));
            },
        });
        return formData.coordenadas?.lat ? (
            <Marker position={[formData.coordenadas.lat, formData.coordenadas.lng]} />
        ) : null;
    };
    
    const [formData, setFormData] = useState({
        codigo_ocorrencia: '',
        data_ocorrencia: '',
        hora_ocorrencia: '',
        tipo_incendio: 'Vegetação', // Vegetação, Estrutural, Veicular, Lixo/Terreno Baldio
        status: 'EXTINTO', // EM ANDAMENTO, CONTROLADO, EXTINTO
        bairro: '',
        endereco: '',
        coordenadas: { lat: '', lng: '' },
        area_queimada_ha: '',
        equipes_acionadas: [],
        descricao: '',
        causa_provavel: ''
    });

    useEffect(() => {
        if (id) {
            fetchIncident();
        }
    }, [id]);

    const fetchIncident = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('firegis').select('*').eq('id', id).single();
            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    coordenadas: data.coordenadas || { lat: '', lng: '' }
                });
            }
        } catch (error) {
            console.error('Erro ao buscar', error);
            toast.error('Erro', 'Falha ao carregar o registro.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.coordenadas?.lat || !formData.coordenadas?.lng) {
            toast.warning('Atenção', 'A coordenada (Lat/Lng) é obrigatória. Clique no mapa para marcar o local do incêndio.');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData };
            if (payload.area_queimada_ha === '') payload.area_queimada_ha = null;
            
            if (id) {
                const { error } = await supabase.from('firegis').update(payload).eq('id', id);
                if (error) throw error;
                toast.success('Sucesso', 'Registro atualizado!');
            } else {
                const { error } = await supabase.from('firegis').insert([payload]);
                if (error) throw error;
                toast.success('Sucesso', 'Novo registro inserido!');
            }
            navigate('/firegis');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao Salvar', error.message || 'Verifique se a tabela firegis existe.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/firegis')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Flame className="text-orange-600" /> 
                                {id ? 'Editar Registro FIREGIS' : 'Novo Registro FIREGIS'}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Bloco 1: Identificação */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                            <FileText size={16} className="text-orange-500" /> Identificação da Ocorrência
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Código / Referência</label>
                                <input type="text" name="codigo_ocorrencia" value={formData.codigo_ocorrencia} onChange={handleChange} placeholder="Ex: BM-2026/045" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500 font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Operacional</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500 font-bold">
                                    <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                                    <option value="CONTROLADO">CONTROLADO</option>
                                    <option value="EXTINTO">EXTINTO</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Calendar size={12}/> Data</label>
                                <input type="date" name="data_ocorrencia" value={formData.data_ocorrencia} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Clock size={12}/> Hora</label>
                                <input type="time" name="hora_ocorrencia" value={formData.hora_ocorrencia} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tipo de Incêndio</label>
                                <select name="tipo_incendio" value={formData.tipo_incendio} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500 font-bold text-orange-600">
                                    <option value="Vegetação">Incêndio em Vegetação</option>
                                    <option value="Estrutural">Incêndio Estrutural</option>
                                    <option value="Veicular">Incêndio Veicular</option>
                                    <option value="Lixo/Terreno Baldio">Lixo / Terreno Baldio</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Bloco 2: Localização e Impacto */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                            <MapPin size={16} className="text-blue-500" /> Localização e Impacto
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Bairro / Localidade</label>
                                <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Activity size={12}/> Área Queimada (Hectares)</label>
                                <input type="number" step="0.01" name="area_queimada_ha" value={formData.area_queimada_ha} onChange={handleChange} placeholder="Ex: 2.5" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 font-mono" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Endereço Descritivo / Referência</label>
                                <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500" />
                            </div>

                            <div className="md:col-span-2 space-y-2 mt-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1">
                                    <MapPin size={12}/> Selecione o Local no Mapa (Obrigatório)
                                </label>
                                <div className="h-64 w-full rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative z-0">
                                    <MapContainer center={[-20.0223, -40.744]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                        <LocationPicker />
                                    </MapContainer>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Latitude</label>
                                <input type="text" required value={formData.coordenadas.lat} onChange={(e) => setFormData(p => ({...p, coordenadas: {...p.coordenadas, lat: e.target.value}}))} placeholder="-20.000000" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 font-mono text-sm" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Longitude</label>
                                <input type="text" required value={formData.coordenadas.lng} onChange={(e) => setFormData(p => ({...p, coordenadas: {...p.coordenadas, lng: e.target.value}}))} placeholder="-40.000000" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 font-mono text-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Bloco 3: Detalhes Operacionais */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">
                            Detalhes Operacionais
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Descrição / Resumo Operacional</label>
                            <textarea name="descricao" value={formData.descricao} onChange={handleChange} rows="4" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500 text-sm resize-none"></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Causa Provável Observada (Opcional)</label>
                            <input type="text" name="causa_provavel" value={formData.causa_provavel} onChange={handleChange} placeholder="Ex: Queima de Lixo, Curto-circuito..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-orange-500 text-sm" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => navigate('/firegis')} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl font-black text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all">
                            {loading ? <Flame className="animate-pulse" size={20} /> : <Save size={20} />}
                            Salvar Registro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FiregisForm;
