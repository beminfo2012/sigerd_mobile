import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl, LayerGroup, GeoJSON } from 'react-leaflet';
import { Flame, ArrowLeft, Activity, MapPin, AlertTriangle, Layers, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const FiregisDashboard = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [smjLimit, setSmjLimit] = useState(null);

    useEffect(() => {
        fetchIncidents();
        fetch('/limite_smj.json')
            .then(res => res.json())
            .then(data => setSmjLimit(data))
            .catch(err => console.error("Erro ao carregar limite SMJ:", err));
    }, []);

    const fetchIncidents = async () => {
        try {
            const { data, error } = await supabase.from('firegis').select('*');
            if (!error && data) {
                setIncidents(data);
            }
        } catch (error) {
            console.error('Error', error);
        } finally {
            setLoading(false);
        }
    };

    const mapbiomasData = [
        { name: 'Agropecuária', value: 40138, percent: 54.6, fill: '#fde047' }, // Yellow
        { name: 'Floresta', value: 32016, percent: 43.5, fill: '#22c55e' }, // Green
        { name: 'Área Não Vegetada', value: 903, percent: 1.2, fill: '#ef4444' }, // Red
        { name: 'Água / Marinho', value: 310, percent: 0.4, fill: '#3b82f6' }, // Blue
        { name: 'Veg. Herbácea', value: 152, percent: 0.2, fill: '#d97706' } // Amber
    ];

    const totalIncidents = incidents.length;
    const totalArea = incidents.reduce((sum, i) => sum + (parseFloat(i.area_queimada_ha) || 0), 0).toFixed(2);
    const activeFires = incidents.filter(i => i.status === 'EM ANDAMENTO').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm flex items-center gap-4">
                <button onClick={() => navigate('/firegis')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <MapPin className="text-orange-600" /> Dashboard FIREGIS
                    </h1>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Inteligência Territorial</p>
                </div>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-2xl text-orange-600">
                        <Flame size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Registros</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{loading ? '-' : totalIncidents}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl text-red-600">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focos em Andamento</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{loading ? '-' : activeFires}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-2xl text-slate-600 dark:text-slate-300">
                        <Activity size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área Afetada (Ha)</p>
                        <p className="text-3xl font-black text-slate-800 dark:text-white">{loading ? '-' : totalArea}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-6 pt-0 flex flex-col xl:flex-row gap-6">
                
                {/* MAP PANEL */}
                <div className="flex-[2] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative min-h-[500px]">
                    {/* Placeholder coordinates for Santa Maria de Jetibá */}
                    <MapContainer center={[-20.0223, -40.744]} zoom={11} className="absolute inset-0 w-full h-full z-0">
                        <LayersControl position="topright">
                            {/* MAPAS BASE */}
                            <LayersControl.BaseLayer checked name="Satélite (ArcGIS)">
                                <TileLayer 
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
                                    attribution="Tiles &copy; Esri"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Ruas (OpenStreetMap)">
                                <TileLayer 
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                                    attribution="&copy; OpenStreetMap contributors"
                                />
                            </LayersControl.BaseLayer>

                            {/* CAMADAS (OVERLAYS) */}
                            <LayersControl.Overlay name="Limites Municipais (SMJ)">
                                <LayerGroup>
                                    {smjLimit && (
                                        <GeoJSON 
                                            data={smjLimit}
                                            style={{
                                                fillColor: 'transparent',
                                                weight: 3,
                                                opacity: 1,
                                                color: '#f97316',
                                                dashArray: '5, 10'
                                            }}
                                        />
                                    )}
                                </LayerGroup>
                            </LayersControl.Overlay>

                            <LayersControl.Overlay checked name="Bioma Mata Atlântica (SMJ)">
                                <LayerGroup>
                                    {smjLimit && (
                                        <GeoJSON 
                                            data={smjLimit}
                                            style={{
                                                fillColor: '#8bc34a',
                                                weight: 2,
                                                opacity: 1,
                                                color: '#558b2f',
                                                fillOpacity: 0.3
                                            }}
                                        >
                                            <Popup>
                                                <div className="text-center">
                                                    <p className="font-black text-green-800 uppercase">Bioma Mata Atlântica</p>
                                                    <p className="text-xs text-slate-600">Município de Santa Maria de Jetibá</p>
                                                </div>
                                            </Popup>
                                        </GeoJSON>
                                    )}
                                </LayerGroup>
                            </LayersControl.Overlay>

                            <LayersControl.Overlay checked name="Ocorrências FIREGIS">
                                <LayerGroup>
                                    {incidents.filter(i => i.coordenadas?.lat && i.coordenadas?.lng).map(inc => (
                                        <CircleMarker 
                                            key={inc.id} 
                                            center={[parseFloat(inc.coordenadas.lat), parseFloat(inc.coordenadas.lng)]}
                                            radius={inc.status === 'EM ANDAMENTO' ? 12 : 8}
                                            pathOptions={{ 
                                                color: inc.status === 'EM ANDAMENTO' ? '#ef4444' : inc.status === 'EXTINTO' ? '#10b981' : '#f97316',
                                                fillColor: inc.status === 'EM ANDAMENTO' ? '#ef4444' : inc.status === 'EXTINTO' ? '#10b981' : '#f97316',
                                                fillOpacity: 0.8,
                                                weight: 2
                                            }}
                                        >
                                            <Popup>
                                                <div className="text-sm font-sans min-w-[180px]">
                                                    <div className="bg-orange-50 -mx-5 -mt-4 p-3 border-b border-orange-100 mb-2 rounded-t-xl">
                                                        <p className="font-black text-orange-800 uppercase text-xs">{inc.codigo_ocorrencia}</p>
                                                    </div>
                                                    <p className="font-bold text-slate-800">{inc.tipo_incendio}</p>
                                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {inc.bairro}</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{inc.area_queimada_ha} ha</span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                                            inc.status === 'EM ANDAMENTO' ? 'bg-red-100 text-red-700' : 
                                                            inc.status === 'EXTINTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                            {inc.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    ))}
                                </LayerGroup>
                            </LayersControl.Overlay>
                        </LayersControl>
                    </MapContainer>
                </div>

                {/* MAPBIOMAS STATS PANEL */}
                <div className="flex-1 xl:w-[450px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                            <PieChartIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">MapBiomas • Santa Maria de Jetibá</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cobertura por classe (2024)</p>
                        </div>
                    </div>

                    <div className="h-[250px] w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mapbiomasData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {mapbiomasData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => `${value.toLocaleString('pt-BR')} ha`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        {mapbiomasData.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.fill }}></div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-800 dark:text-white leading-tight">
                                        {item.value.toLocaleString('pt-BR')} ha ({item.percent}%)
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold">{item.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[9px] text-slate-400 text-center italic">
                            Fonte: Projeto MapBiomas - Coleção 9.0 da Série Anual de Mapas de Cobertura e Uso da Terra do Brasil.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiregisDashboard;
