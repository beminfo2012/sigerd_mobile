import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import PizZip from 'pizzip';
import 'leaflet/dist/leaflet.css';
import OrthofotsLayer from '../../../components/OrthofotsLayer';
import { X, MapPin, Navigation, Check, RotateCcw, Trash2, HelpCircle, Grid } from 'lucide-react';

const DEFAULT_CENTER = [-20.0401, -40.7489];

const MapEventsHandler = ({ onClick }) => {
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        },
    });
    return null;
};

const MapRecenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const getCentroidOfPolygons = (polygons) => {
    if (!polygons || polygons.length === 0) return null;
    let latSum = 0;
    let lngSum = 0;
    let totalPoints = 0;
    
    polygons.forEach(poly => {
        poly.forEach(pt => {
            latSum += pt[0];
            lngSum += pt[1];
            totalPoints++;
        });
    });
    
    if (totalPoints === 0) return null;
    return {
        lat: latSum / totalPoints,
        lng: lngSum / totalPoints
    };
};

const RedapLocationPickerModal = ({ isOpen, onClose, onSave, initialLat, initialLng, initialPolygonCoords }) => {
    const [polygons, setPolygons] = useState([]);
    const [currentPolygon, setCurrentPolygon] = useState([]);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [loadingGPS, setLoadingGPS] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialPolygonCoords) {
                try {
                    const parsed = typeof initialPolygonCoords === 'string'
                        ? JSON.parse(initialPolygonCoords)
                        : initialPolygonCoords;
                    
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        if (Array.isArray(parsed.polygons)) {
                            setPolygons(parsed.polygons);
                        }
                        const centroid = getCentroidOfPolygons(parsed.polygons || []);
                        if (centroid) setMapCenter([centroid.lat, centroid.lng]);
                    } else if (Array.isArray(parsed) && parsed.length > 0) {
                        if (Array.isArray(parsed[0][0])) {
                            setPolygons(parsed);
                            const centroid = getCentroidOfPolygons(parsed);
                            if (centroid) setMapCenter([centroid.lat, centroid.lng]);
                        } else {
                            setPolygons([parsed]);
                            const latSum = parsed.reduce((acc, pt) => acc + pt[0], 0);
                            const lngSum = parsed.reduce((acc, pt) => acc + pt[1], 0);
                            setMapCenter([latSum / parsed.length, lngSum / parsed.length]);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing initial coords:', e);
                }
            } else if (initialLat && initialLng) {
                const latNum = Number(initialLat);
                const lngNum = Number(initialLng);
                setPolygons([[[latNum, lngNum]]]);
                setMapCenter([latNum, lngNum]);
            } else {
                setPolygons([]);
                setCurrentPolygon([]);
                setMapCenter(DEFAULT_CENTER);
            }
        }
    }, [isOpen, initialPolygonCoords, initialLat, initialLng]);

    if (!isOpen) return null;

    const handleMapClick = (latlng) => {
        setCurrentPolygon(prev => [...prev, [latlng.lat, latlng.lng]]);
    };

    const handleUndoPoint = () => {
        setCurrentPolygon(prev => prev.slice(0, -1));
    };

    const handleAddPolygon = () => {
        if (currentPolygon.length >= 3) {
            setPolygons(prev => [...prev, currentPolygon]);
            setCurrentPolygon([]);
        } else {
            alert('A área atual precisa ter pelo menos 3 pontos antes de ser adicionada.');
        }
    };

    const handleDeletePolygon = (index) => {
        setPolygons(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleClearAll = () => {
        if (window.confirm('Deseja realmente limpar todos os polígonos marcados?')) {
            setPolygons([]);
            setCurrentPolygon([]);
        }
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
                setCurrentPolygon(prev => [...prev, [latitude, longitude]]);
                setMapCenter([latitude, longitude]);
                setLoadingGPS(false);
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização.');
                setLoadingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSelectEntireMunicipality = async () => {
        try {
            const res = await fetch('/limite_smj.json');
            const data = await res.json();
            
            let importedPolygons = [];
            if (data && data.features) {
                data.features.forEach(feature => {
                    if (feature.geometry.type === 'Polygon') {
                        const rawCoords = feature.geometry.coordinates[0];
                        const step = Math.max(1, Math.floor(rawCoords.length / 200));
                        const coords = rawCoords.filter((_, i) => i % step === 0).map(c => [c[1], c[0]]);
                        importedPolygons.push(coords);
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(poly => {
                            const rawCoords = poly[0];
                            const step = Math.max(1, Math.floor(rawCoords.length / 200));
                            const coords = rawCoords.filter((_, i) => i % step === 0).map(c => [c[1], c[0]]);
                            importedPolygons.push(coords);
                        });
                    }
                });
            }
            
            if (importedPolygons.length > 0) {
                setPolygons(prev => [...prev, ...importedPolygons]);
                const centroid = getCentroidOfPolygons(importedPolygons);
                if (centroid) setMapCenter([centroid.lat, centroid.lng]);
            }
        } catch (error) {
            console.error('Erro ao carregar limite do município:', error);
            alert('Erro ao carregar o limite do município.');
        }
    };

    const handleSave = () => {
        if (polygons.length === 0 && currentPolygon.length < 3) {
            alert('Por favor, adicione pelo menos uma área poligonal no mapa antes de salvar.');
            return;
        }

        let finalPolygons = [...polygons];
        if (currentPolygon.length >= 3) {
            finalPolygons.push(currentPolygon);
        }

        const centroid = getCentroidOfPolygons(finalPolygons) || { lat: mapCenter[0], lng: mapCenter[1] };
        
        const resultObject = {
            polygons: finalPolygons
        };

        onSave(centroid.lat, centroid.lng, resultObject);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-row">
                
                <div className="w-[360px] bg-slate-50 dark:bg-slate-900/40 border-r border-slate-800/80 flex flex-col h-full">
                    <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} />
                            <div>
                                <h2 className="text-sm font-black uppercase">Georreferenciamento</h2>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">Área em Construção</span>
                                <span className="text-xs font-bold">{currentPolygon.length} vértices</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleUndoPoint} disabled={currentPolygon.length === 0} className="flex-1 bg-slate-100 p-2 rounded-xl text-[10px] font-black uppercase">Desfazer</button>
                                <button onClick={handleAddPolygon} disabled={currentPolygon.length < 3} className="flex-[1.5] bg-blue-600 text-white p-2 rounded-xl text-[10px] font-black uppercase">Confirmar Área</button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <h3 className="text-[10px] font-black uppercase text-slate-450">Áreas Confirmadas ({polygons.length})</h3>
                                <button onClick={handleSelectEntireMunicipality} className="text-[9px] font-black uppercase text-emerald-600 hover:underline">
                                    + Todo o Município
                                </button>
                            </div>
                            <div className="space-y-2">
                                {polygons.map((poly, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl">
                                        <span className="text-xs font-bold">Região #{idx + 1} ({poly.length} pts)</span>
                                        <button onClick={() => handleDeletePolygon(idx)} className="text-rose-500"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex justify-between gap-2">
                        <button onClick={handleClearAll} className="flex-1 bg-rose-50 text-rose-600 p-2.5 rounded-xl text-[10px] font-black uppercase">Limpar Tudo</button>
                        <button onClick={handleCaptureCurrentLocation} disabled={loadingGPS} className="flex-1 bg-blue-50 text-blue-600 p-2.5 rounded-xl text-[10px] font-black uppercase">GPS</button>
                    </div>
                </div>

                <div className="flex-1 relative bg-slate-150">
                    <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <OrthofotsLayer />
                        {polygons.map((poly, idx) => (
                            <Polygon key={`poly-${idx}`} positions={poly} pathOptions={{ color: '#4f46e5', fillOpacity: 0.2 }} />
                        ))}
                        {currentPolygon.length > 0 && (
                            <Polygon positions={currentPolygon} pathOptions={{ color: '#2563eb', fillOpacity: 0.35 }} />
                        )}
                        {currentPolygon.map((point, index) => (
                            <CircleMarker key={`curr-vertex-${index}`} center={point} radius={6} />
                        ))}
                        <MapEventsHandler onClick={handleMapClick} />
                        <MapRecenter center={mapCenter} />
                    </MapContainer>

                    <div className="absolute bottom-5 right-5 z-[400] flex gap-2">
                        <button
                            onClick={onClose}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-5 py-3 text-slate-700 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all border border-slate-200/50 dark:border-slate-800/50 shadow-md"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={polygons.length === 0 && currentPolygon.length < 3}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 border border-white/10"
                        >
                            <Check size={14} />
                            Salvar Alterações Geográficas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RedapLocationPickerModal;
