import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Navigation, Check, RotateCcw, Trash2, HelpCircle } from 'lucide-react';

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

// Calcula o centroide de um array de coordenadas [[lat, lng], ...]
const getCentroid = (points) => {
    if (!points || points.length === 0) return null;
    let latSum = 0;
    let lngSum = 0;
    points.forEach(pt => {
        latSum += pt[0];
        lngSum += pt[1];
    });
    return {
        lat: latSum / points.length,
        lng: lngSum / points.length
    };
};

const RedapLocationPickerModal = ({ isOpen, onClose, onSave, initialLat, initialLng, initialPolygonCoords }) => {
    const [polygonPoints, setPolygonPoints] = useState([]);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [loadingGPS, setLoadingGPS] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialPolygonCoords) {
                try {
                    const coords = typeof initialPolygonCoords === 'string'
                        ? JSON.parse(initialPolygonCoords)
                        : initialPolygonCoords;
                    if (Array.isArray(coords) && coords.length > 0) {
                        setPolygonPoints(coords);
                        const centroid = getCentroid(coords);
                        if (centroid) setMapCenter([centroid.lat, centroid.lng]);
                    } else {
                        setPolygonPoints([]);
                        setMapCenter(DEFAULT_CENTER);
                    }
                } catch (e) {
                    console.error('Error parsing initial polygon coordinates:', e);
                    setPolygonPoints([]);
                    setMapCenter(DEFAULT_CENTER);
                }
            } else if (initialLat && initialLng) {
                const latNum = Number(initialLat);
                const lngNum = Number(initialLng);
                setPolygonPoints([[latNum, lngNum]]);
                setMapCenter([latNum, lngNum]);
            } else {
                setPolygonPoints([]);
                setMapCenter(DEFAULT_CENTER);
            }
        }
    }, [isOpen, initialPolygonCoords, initialLat, initialLng]);

    if (!isOpen) return null;

    const handleMapClick = (latlng) => {
        setPolygonPoints(prev => [...prev, [latlng.lat, latlng.lng]]);
    };

    const handleUndo = () => {
        setPolygonPoints(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setPolygonPoints([]);
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
                setPolygonPoints(prev => [...prev, [latitude, longitude]]);
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
        if (polygonPoints.length >= 3) {
            const centroid = getCentroid(polygonPoints);
            onSave(centroid.lat, centroid.lng, polygonPoints);
        } else {
            alert('Por favor, defina pelo menos 3 pontos para criar uma área poligonal no mapa.');
        }
    };

    const centroid = getCentroid(polygonPoints);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] sm:h-[80vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-blue-600 text-white">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-2xl shadow-inner backdrop-blur-md">
                            <MapPin size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-lg font-black tracking-tight uppercase">Mapear Área do Evento (Polígono)</h2>
                            <p className="text-[8px] sm:text-[10px] font-bold text-white/70 uppercase tracking-widest leading-tight">
                                Clique no mapa para adicionar os vértices e delimitar a região afetada
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
                        
                        {/* Desenha o Polígono */}
                        {polygonPoints.length > 0 && (
                            <Polygon 
                                positions={polygonPoints} 
                                pathOptions={{ 
                                    color: '#2563eb', // Blue-600
                                    fillColor: '#3b82f6', // Blue-500
                                    fillOpacity: 0.3,
                                    weight: 3
                                }} 
                            />
                        )}

                        {/* Desenha os Vértices */}
                        {polygonPoints.map((point, index) => (
                            <CircleMarker 
                                key={index} 
                                center={point} 
                                radius={6} 
                                pathOptions={{ 
                                    color: '#1e3a8a', 
                                    fillColor: index === polygonPoints.length - 1 ? '#ef4444' : '#60a5fa', 
                                    fillOpacity: 1,
                                    weight: 2
                                }} 
                            />
                        ))}

                        <MapEventsHandler onClick={handleMapClick} />
                        <MapRecenter center={mapCenter} />
                    </MapContainer>

                    {/* Instruções Flutuantes no Mapa */}
                    <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800/50 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-350 space-y-1 max-w-[280px]">
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 uppercase font-black tracking-wider text-[9px] sm:text-[10px]">
                            <HelpCircle size={14} /> Instruções de Marcação:
                        </div>
                        <p className="leading-tight">
                            1. Clique no mapa para adicionar pontos. <br />
                            2. Adicione no mínimo 3 pontos para formar a área. <br />
                            3. O último ponto inserido fica destacado em vermelho.
                        </p>
                    </div>

                    {/* Floating Map Action Buttons (Undo & Clear) */}
                    <div className="absolute bottom-6 left-6 z-25 flex gap-2">
                        <button
                            onClick={handleUndo}
                            disabled={polygonPoints.length === 0}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Desfazer último vértice"
                        >
                            <RotateCcw size={16} />
                            <span className="hidden sm:inline">Desfazer</span>
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={polygonPoints.length === 0}
                            className="bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50 text-rose-600 p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Limpar todos os pontos"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Limpar Tudo</span>
                        </button>
                    </div>

                    {/* Floating GPS Button */}
                    <button
                        onClick={handleCaptureCurrentLocation}
                        disabled={loadingGPS}
                        className="absolute bottom-6 right-6 z-25 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center border border-white/15"
                        title="Adicionar ponto via GPS atual"
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
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Vértices Marcados</span>
                            <span className={`text-base font-black leading-none mt-1 ${polygonPoints.length >= 3 ? 'text-emerald-650' : 'text-amber-500'}`}>
                                {polygonPoints.length} {polygonPoints.length < 3 && '(Mínimo 3)'}
                            </span>
                         </div>
                         <div className="flex flex-col border-l pl-4 border-slate-200 dark:border-slate-800">
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Centroide da Área</span>
                            <span className="text-xs sm:text-sm font-mono font-bold text-slate-600 dark:text-slate-350 leading-none mt-1">
                                {centroid ? `${centroid.lat.toFixed(5)}, ${centroid.lng.toFixed(5)}` : 'Defina os pontos'}
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
                            disabled={polygonPoints.length < 3}
                            className="flex-1 sm:flex-initial px-6 py-3 sm:py-4 bg-emerald-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs active:scale-95 transition-all shadow-lg shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Salvar Área Poligonal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RedapLocationPickerModal;
