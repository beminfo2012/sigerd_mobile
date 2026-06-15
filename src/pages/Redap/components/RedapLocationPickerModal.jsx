import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents, ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Navigation, Check, RotateCcw, Trash2, HelpCircle, Layers, Image as ImageIcon, Plus, Grid, Sliders } from 'lucide-react';

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

// Componente auxiliar para obter os bounds atuais do mapa e alinhar a orthofoto
const MapBoundsAligner = ({ trigger, onAlign }) => {
    const map = useMap();
    useEffect(() => {
        if (trigger && map) {
            const bounds = map.getBounds();
            const north = bounds.getNorth();
            const south = bounds.getSouth();
            const east = bounds.getEast();
            const west = bounds.getWest();
            // Dá uma margem interna de 10% para a imagem ficar centralizada
            const latDiff = north - south;
            const lngDiff = east - west;
            const innerSouth = south + latDiff * 0.15;
            const innerNorth = north - latDiff * 0.15;
            const innerWest = west + lngDiff * 0.15;
            const innerEast = east - lngDiff * 0.15;
            
            onAlign([
                [innerSouth, innerWest],
                [innerNorth, innerEast]
            ]);
        }
    }, [trigger, map, onAlign]);
    return null;
};

// Calcula o centroide de múltiplos polígonos combinados
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
    const [polygons, setPolygons] = useState([]); // Array de polígonos: [[[lat, lng], ...], ...]
    const [currentPolygon, setCurrentPolygon] = useState([]); // Polígono atual sendo desenhado
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [loadingGPS, setLoadingGPS] = useState(false);
    
    // Estados da Orthofoto
    const [orthofotoUrl, setOrthofotoUrl] = useState('');
    const [orthofotoBounds, setOrthofotoBounds] = useState(null); // [[south, west], [north, east]]
    const [orthofotoOpacity, setOrthofotoOpacity] = useState(0.7);
    const [alignTrigger, setAlignTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('desenho'); // 'desenho' | 'orthofoto'

    // Inputs manuais de bounds
    const [boundSouth, setBoundSouth] = useState('');
    const [boundWest, setBoundWest] = useState('');
    const [boundNorth, setBoundNorth] = useState('');
    const [boundEast, setBoundEast] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialPolygonCoords) {
                try {
                    const parsed = typeof initialPolygonCoords === 'string'
                        ? JSON.parse(initialPolygonCoords)
                        : initialPolygonCoords;
                    
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        // Formato de objeto unificado
                        if (Array.isArray(parsed.polygons)) {
                            setPolygons(parsed.polygons);
                        }
                        if (parsed.orthofoto && parsed.orthofoto.url) {
                            setOrthofotoUrl(parsed.orthofoto.url);
                            setOrthofotoBounds(parsed.orthofoto.bounds);
                            if (parsed.orthofoto.bounds) {
                                setBoundSouth(parsed.orthofoto.bounds[0][0].toString());
                                setBoundWest(parsed.orthofoto.bounds[0][1].toString());
                                setBoundNorth(parsed.orthofoto.bounds[1][0].toString());
                                setBoundEast(parsed.orthofoto.bounds[1][1].toString());
                            }
                        }
                        const centroid = getCentroidOfPolygons(parsed.polygons || []);
                        if (centroid) setMapCenter([centroid.lat, centroid.lng]);
                    } else if (Array.isArray(parsed) && parsed.length > 0) {
                        // Se for array de arrays de coordenadas (múltiplos polígonos)
                        if (Array.isArray(parsed[0][0])) {
                            setPolygons(parsed);
                            const centroid = getCentroidOfPolygons(parsed);
                            if (centroid) setMapCenter([centroid.lat, centroid.lng]);
                        } else {
                            // Se for array simples de coordenadas (único polígono legado)
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
                setOrthofotoUrl('');
                setOrthofotoBounds(null);
                setMapCenter(DEFAULT_CENTER);
            }
        }
    }, [isOpen, initialPolygonCoords, initialLat, initialLng]);

    useEffect(() => {
        if (orthofotoBounds) {
            setBoundSouth(orthofotoBounds[0][0].toFixed(6));
            setBoundWest(orthofotoBounds[0][1].toFixed(6));
            setBoundNorth(orthofotoBounds[1][0].toFixed(6));
            setBoundEast(orthofotoBounds[1][1].toFixed(6));
        }
    }, [orthofotoBounds]);

    if (!isOpen) return null;

    const handleMapClick = (latlng) => {
        if (activeTab === 'desenho') {
            setCurrentPolygon(prev => [...prev, [latlng.lat, latlng.lng]]);
        }
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
        if (window.confirm('Deseja realmente limpar todos os polígonos e a orthofoto marcados?')) {
            setPolygons([]);
            setCurrentPolygon([]);
            setOrthofotoUrl('');
            setOrthofotoBounds(null);
            setBoundSouth('');
            setBoundWest('');
            setBoundNorth('');
            setBoundEast('');
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
                if (activeTab === 'desenho') {
                    setCurrentPolygon(prev => [...prev, [latitude, longitude]]);
                }
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

    const handleOrthofotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setOrthofotoUrl(reader.result);
            // Dispara o alinhamento da imagem com a viewport atual do mapa
            setAlignTrigger(prev => prev + 1);
        };
        reader.readAsDataURL(file);
    };

    const handleAlignToViewport = () => {
        setAlignTrigger(prev => prev + 1);
    };

    const handleBoundChange = (type, value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return;

        setOrthofotoBounds(prev => {
            const current = prev || [[mapCenter[0] - 0.005, mapCenter[1] - 0.005], [mapCenter[0] + 0.005, mapCenter[1] + 0.005]];
            const newBounds = JSON.parse(JSON.stringify(current));
            if (type === 'south') newBounds[0][0] = num;
            if (type === 'west') newBounds[0][1] = num;
            if (type === 'north') newBounds[1][0] = num;
            if (type === 'east') newBounds[1][1] = num;
            return newBounds;
        });
    };

    const handleConfirm = () => {
        if (polygons.length === 0 && currentPolygon.length < 3) {
            alert('Por favor, adicione pelo menos uma área poligonal no mapa antes de salvar.');
            return;
        }

        // Se houver algum polígono desenhado mas não adicionado, adiciona-o automaticamente
        let finalPolygons = [...polygons];
        if (currentPolygon.length >= 3) {
            finalPolygons.push(currentPolygon);
        }

        const centroid = getCentroidOfPolygons(finalPolygons) || { lat: mapCenter[0], lng: mapCenter[1] };
        
        // Estrutura de dados unificada contendo múltiplos polígonos e orthofoto
        const resultObject = {
            polygons: finalPolygons,
            orthofoto: orthofotoUrl ? {
                url: orthofotoUrl,
                bounds: orthofotoBounds
            } : null
        };

        onSave(centroid.lat, centroid.lng, resultObject);
    };

    const allCoords = [...polygons.flatMap(p => p), ...currentPolygon];
    const centroid = getCentroidOfPolygons(polygons.length > 0 ? polygons : (currentPolygon.length > 0 ? [currentPolygon] : []));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[92vh] sm:h-[85vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                
                {/* Painel Lateral de Controle (Esquerda) */}
                <div className="w-full sm:w-[320px] md:w-[360px] bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800/80 flex flex-col h-[40%] sm:h-full shrink-0">
                    
                    {/* Header do Painel */}
                    <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin size={20} />
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-tight">Georreferenciamento</h2>
                                <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest leading-none">REDAP Inteligente</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="sm:hidden p-1.5 hover:bg-white/10 rounded-full transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Abas */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                        <button
                            onClick={() => setActiveTab('desenho')}
                            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 ${activeTab === 'desenho' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Grid size={14} /> Desenho ({polygons.length + (currentPolygon.length >= 3 ? 1 : 0)})
                        </button>
                        <button
                            onClick={() => setActiveTab('orthofoto')}
                            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 ${activeTab === 'orthofoto' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <ImageIcon size={14} /> Orthofoto
                        </button>
                    </div>

                    {/* Conteúdo da Aba Ativa */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {activeTab === 'desenho' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 rounded-2xl text-[11px] text-blue-700 dark:text-blue-300 font-bold space-y-1.5">
                                    <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-black"><HelpCircle size={12} /> Como maper múltiplas áreas:</span>
                                    <p className="leading-relaxed font-medium">
                                        1. Clique no mapa para adicionar os pontos da área atual. <br />
                                        2. Finalize a área clicando em <b>"Confirmar Área"</b> abaixo. <br />
                                        3. Repita o processo para mapear mais regiões se necessário.
                                    </p>
                                </div>

                                {/* Polígono Atual em Edição */}
                                <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-850/50">
                                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Área em Construção</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{currentPolygon.length} vértices</span>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUndoPoint}
                                            disabled={currentPolygon.length === 0}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 text-slate-700 dark:text-slate-200 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                        >
                                            <RotateCcw size={12} /> Desfazer
                                        </button>
                                        <button
                                            onClick={handleAddPolygon}
                                            disabled={currentPolygon.length < 3}
                                            className="flex-[1.5] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-450 dark:disabled:text-slate-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-200 dark:shadow-none"
                                        >
                                            <Plus size={12} /> Confirmar Área
                                        </button>
                                    </div>
                                </div>

                                {/* Lista de Áreas Poligonais Salvas */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-555 tracking-wider ml-1">Áreas Confirmadas ({polygons.length})</h3>
                                    
                                    {polygons.length === 0 ? (
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic p-3 text-center bg-slate-100/40 dark:bg-slate-850/20 rounded-2xl">
                                            Nenhuma área poligonal finalizada ainda.
                                        </p>
                                    ) : (
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                            {polygons.map((poly, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Região Afetada #{idx + 1}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">({poly.length} pts)</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePolygon(idx)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                                                        title="Excluir região"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'orthofoto' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 rounded-2xl text-[11px] text-blue-700 dark:text-blue-300 font-bold space-y-1">
                                    <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] font-black"><ImageIcon size={12} /> Upload de Mapas Raster:</span>
                                    <p className="leading-relaxed font-medium">
                                        Suba uma imagem aérea (orthofoto) e delimite seus cantos geográficos para sobrepô-la ao mapa base.
                                    </p>
                                </div>

                                {/* Upload input */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest ml-1">Carregar Imagem Orthofoto</label>
                                    <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-white dark:bg-slate-850">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleOrthofotoUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <ImageIcon className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={24} />
                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase">Selecionar Arquivo</p>
                                        <p className="text-[9px] text-slate-400 mt-1 font-medium">PNG ou JPG</p>
                                    </div>
                                    {orthofotoUrl && (
                                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl border border-emerald-100 dark:border-emerald-900/20 w-fit">
                                            ✓ Orthofoto carregada com sucesso
                                        </p>
                                    )}
                                </div>

                                {orthofotoUrl && (
                                    <>
                                        {/* Slider Opacidade */}
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest ml-1">
                                                <span>Opacidade da Orthofoto</span>
                                                <span className="font-mono text-slate-600 dark:text-slate-350 font-bold">{Math.round(orthofotoOpacity * 100)}%</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Sliders size={14} className="text-slate-400 shrink-0" />
                                                <input
                                                    type="range"
                                                    min="0.1"
                                                    max="1.0"
                                                    step="0.05"
                                                    value={orthofotoOpacity}
                                                    onChange={(e) => setOrthofotoOpacity(parseFloat(e.target.value))}
                                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                                                />
                                            </div>
                                        </div>

                                        {/* Coordenadas Limites da Imagem (Bounds) */}
                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest ml-1">Bounds da Orthofoto</h4>
                                                <button
                                                    onClick={handleAlignToViewport}
                                                    className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline"
                                                >
                                                    Enquadrar na Tela
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Latitude Norte</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={boundNorth}
                                                        onChange={(e) => handleBoundChange('north', e.target.value)}
                                                        className="w-full p-2 bg-white dark:bg-slate-850 border rounded-xl font-mono text-[10px]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Latitude Sul</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={boundSouth}
                                                        onChange={(e) => handleBoundChange('south', e.target.value)}
                                                        className="w-full p-2 bg-white dark:bg-slate-850 border rounded-xl font-mono text-[10px]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Longitude Leste</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={boundEast}
                                                        onChange={(e) => handleBoundChange('east', e.target.value)}
                                                        className="w-full p-2 bg-white dark:bg-slate-850 border rounded-xl font-mono text-[10px]"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Longitude Oeste</label>
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={boundWest}
                                                        onChange={(e) => handleBoundChange('west', e.target.value)}
                                                        className="w-full p-2 bg-white dark:bg-slate-850 border rounded-xl font-mono text-[10px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Botões de Ação Auxiliares do Rodapé Lateral */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex justify-between gap-2">
                        <button
                            onClick={handleClearAll}
                            className="flex-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                        >
                            <Trash2 size={13} /> Limpar Tudo
                        </button>
                        <button
                            onClick={handleCaptureCurrentLocation}
                            disabled={loadingGPS}
                            className="flex-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                        >
                            {loadingGPS ? (
                                <div className="w-3.5 h-3.5 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            ) : (
                                <Navigation size={13} />
                            )}
                            GPS Atual
                        </button>
                    </div>
                </div>

                {/* Mapa (Direita) */}
                <div className="flex-1 relative h-[60%] sm:h-full bg-slate-150">
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
                        
                        {/* Desenha Múltiplos Polígonos Salvos */}
                        {polygons.map((poly, idx) => (
                            <Polygon 
                                key={`poly-${idx}`}
                                positions={poly} 
                                pathOptions={{ 
                                    color: '#4f46e5', // Indigo-600
                                    fillColor: '#818cf8', // Indigo-400
                                    fillOpacity: 0.2,
                                    weight: 2
                                }} 
                            />
                        ))}

                        {/* Desenha o Polígono Atual em construção */}
                        {currentPolygon.length > 0 && (
                            <Polygon 
                                positions={currentPolygon} 
                                pathOptions={{ 
                                    color: '#2563eb', // Blue-600
                                    fillColor: '#3b82f6', // Blue-500
                                    fillOpacity: 0.35,
                                    weight: 3
                                }} 
                            />
                        )}

                        {/* Desenha os Vértices do Polígono em construção */}
                        {currentPolygon.map((point, index) => (
                            <CircleMarker 
                                key={`curr-vertex-${index}`} 
                                center={point} 
                                radius={6} 
                                pathOptions={{ 
                                    color: '#1e3a8a', 
                                    fillColor: index === currentPolygon.length - 1 ? '#ef4444' : '#60a5fa', 
                                    fillOpacity: 1,
                                    weight: 2
                                }} 
                            />
                        ))}

                        {/* Exibe a Overlay de Orthofoto */}
                        {orthofotoUrl && orthofotoBounds && (
                            <ImageOverlay
                                url={orthofotoUrl}
                                bounds={orthofotoBounds}
                                opacity={orthofotoOpacity}
                            />
                        )}

                        <MapEventsHandler onClick={handleMapClick} />
                        <MapRecenter center={mapCenter} />
                        {alignTrigger > 0 && (
                            <MapBoundsAligner trigger={alignTrigger} onAlign={setOrthofotoBounds} />
                        )}
                    </MapContainer>

                    {/* Botões de Ação Principais no Rodapé Flutuante do Mapa */}
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
