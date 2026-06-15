import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Navigation, Check } from 'lucide-react';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ponto central padrão de Santa Maria de Jetibá
const DEFAULT_CENTER = [-20.0401, -40.7489];

// Componente para lidar com cliques no mapa
const MapEventsHandler = ({ onClick }) => {
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        },
    });
    return null;
};

// Componente para centralizar o mapa dinamicamente
const MapRecenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const RedapLocationPickerModal = ({ isOpen, onClose, onSave, initialLat, initialLng }) => {
    const [selectedCoords, setSelectedCoords] = useState(null);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [loadingGPS, setLoadingGPS] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialLat && initialLng) {
                const latNum = Number(initialLat);
                const lngNum = Number(initialLng);
                setSelectedCoords({ lat: latNum, lng: lngNum });
                setMapCenter([latNum, lngNum]);
            } else {
                setSelectedCoords(null);
                setMapCenter(DEFAULT_CENTER);
            }
        }
    }, [isOpen, initialLat, initialLng]);

    if (!isOpen) return null;

    const handleMapClick = (latlng) => {
        setSelectedCoords({ lat: latlng.lat, lng: latlng.lng });
    };

    const handleCaptureCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada pelo seu navegador.');
            return;
        }

        setLoadingGPS(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setSelectedCoords({ lat: latitude, lng: longitude });
                setMapCenter([latitude, longitude]);
                setLoadingGPS(false);
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização. Verifique as permissões de GPS.');
                setLoadingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleConfirm = () => {
        if (selectedCoords) {
            onSave(selectedCoords.lat, selectedCoords.lng);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 text-white">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-2xl shadow-inner backdrop-blur-md">
                            <MapPin size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-lg font-black tracking-tight uppercase">Marcar Localização do Evento</h2>
                            <p className="text-[8px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest leading-tight">
                                Clique no mapa ou use o GPS para marcar o local exato do desastre
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative bg-slate-150">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        className="z-10"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {selectedCoords && (
                            <Marker position={[selectedCoords.lat, selectedCoords.lng]} />
                        )}
                        <MapEventsHandler onClick={handleMapClick} />
                        <MapRecenter center={mapCenter} />
                    </MapContainer>

                    {/* Floating GPS Button */}
                    <button
                        onClick={handleCaptureCurrentLocation}
                        disabled={loadingGPS}
                        className="absolute bottom-6 right-6 z-25 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center border border-white/15"
                        title="Obter minha localização atual"
                    >
                        {loadingGPS ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Navigation size={20} className="fill-white" />
                        )}
                    </button>
                </div>

                {/* Footer details */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1 flex gap-4 text-left">
                         <div className="flex flex-col">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Latitude</span>
                            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-none mt-1">
                                {selectedCoords ? selectedCoords.lat.toFixed(6) : 'Pendente'}
                            </span>
                         </div>
                         <div className="flex flex-col border-l pl-4 border-slate-200 dark:border-slate-800">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Longitude</span>
                            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-none mt-1">
                                {selectedCoords ? selectedCoords.lng.toFixed(6) : 'Pendente'}
                            </span>
                         </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-initial px-5 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={!selectedCoords}
                            className="flex-1 sm:flex-initial px-6 py-3 sm:py-4 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs active:scale-95 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Salvar Localização
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RedapLocationPickerModal;
