import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, DollarSign, Shield } from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RecenterMap = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
};

const RedapMapModal = ({ isOpen, onClose, registrations = [], eventName }) => {
    if (!isOpen) return null;

    const points = registrations.filter(r => r.latitude && r.longitude);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-600 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl shadow-inner backdrop-blur-md">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase">Mapa de Danos Localizados</h2>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-tight">
                                {eventName} • {points.length} pontos identificados
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 relative bg-slate-100 dark:bg-slate-950">
                    {points.length > 0 ? (
                        <MapContainer 
                            center={[points[0].latitude, points[0].longitude]} 
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            className="z-10"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {points.map((reg) => (
                                <Marker 
                                    key={reg.id} 
                                    position={[reg.latitude, reg.longitude]}
                                >
                                    <Popup className="redap-popup">
                                        <div className="p-1 space-y-2 min-w-[200px]">
                                            <div className="flex flex-col gap-1 border-b pb-2 mb-2">
                                                <span className="text-[10px] font-black uppercase text-blue-600">
                                                    {reg.secretaria_responsavel?.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm font-black leading-tight">
                                                    {reg.instalacao_afetada}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] text-slate-500 leading-tight">
                                                    {reg.descricao_detalhada}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 mt-2">
                                                    <DollarSign size={14} className="text-emerald-500" />
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_estimado)}
                                                </div>
                                            </div>
                                            <div className="flex -space-x-1.5 pt-2">
                                                {reg.fotos?.slice(0, 3).map((foto, i) => (
                                                    <img key={i} src={foto.url || foto.data} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                                                ))}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            <RecenterMap points={points} />
                        </MapContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                            <div className="p-8 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 animate-pulse">
                                <MapPin size={64} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Sem Coordenadas</h3>
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-2">Não há pontos de GPS vinculados a este evento.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex-1 flex gap-4">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Registros</span>
                            <span className="text-base font-black text-slate-800 dark:text-white leading-none">{registrations.length}</span>
                         </div>
                         <div className="flex flex-col border-l pl-4 border-slate-100 dark:border-slate-800">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Com Localização</span>
                            <span className="text-base font-black text-emerald-600 leading-none">{points.length}</span>
                         </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20"
                    >
                        Fechar Mapa
                    </button>
                </div>
            </div>
            <style>{`
                .redap-popup .leaflet-popup-content-wrapper { border-radius: 1.5rem; padding: 0.5rem; }
                .redap-popup .leaflet-popup-content { margin: 8px 12px; }
            `}</style>
        </div>
    );
};

export default RedapMapModal;
