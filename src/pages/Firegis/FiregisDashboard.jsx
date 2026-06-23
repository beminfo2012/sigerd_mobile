import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Flame, ArrowLeft, Activity, MapPin, AlertTriangle } from 'lucide-react';

const FiregisDashboard = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncidents();
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

    const totalIncidents = incidents.length;
    const totalArea = incidents.reduce((sum, i) => sum + (parseFloat(i.area_queimada_ha) || 0), 0).toFixed(2);
    const activeFires = incidents.filter(i => i.status === 'EM ANDAMENTO').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-4 sticky top-0 z-20 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/firegis')} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight">FIREGIS Dashboard</h1>
                        <p className="text-white/80 text-[10px] uppercase font-bold tracking-widest">Inteligência Territorial</p>
                    </div>
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

            <div className="flex-1 p-4 md:p-6 pt-0 flex flex-col">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative min-h-[400px]">
                    {/* Placeholder coordinates for Santa Maria de Jetibá */}
                    <MapContainer center={[-20.0223, -40.744]} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        
                        {incidents.filter(i => i.coordenadas?.lat && i.coordenadas?.lng).map(inc => (
                            <CircleMarker 
                                key={inc.id} 
                                center={[parseFloat(inc.coordenadas.lat), parseFloat(inc.coordenadas.lng)]}
                                radius={inc.status === 'EM ANDAMENTO' ? 12 : 8}
                                pathOptions={{ 
                                    color: inc.status === 'EM ANDAMENTO' ? '#ef4444' : inc.status === 'EXTINTO' ? '#10b981' : '#f97316',
                                    fillColor: inc.status === 'EM ANDAMENTO' ? '#ef4444' : inc.status === 'EXTINTO' ? '#10b981' : '#f97316',
                                    fillOpacity: 0.6
                                }}
                            >
                                <Popup>
                                    <div className="text-sm font-sans">
                                        <p className="font-bold">{inc.tipo_incendio}</p>
                                        <p className="text-xs text-slate-500">{inc.bairro}</p>
                                        <p className="text-xs mt-1 font-bold text-orange-600">{inc.status}</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default FiregisDashboard;
