import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Share2, CloudRain, Calendar, AlertTriangle, Waves, Activity, Plus, MapPin, X, Plus as ZoomIn, Minus as ZoomOut, Search, FileText } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import html2canvas from 'html2canvas'
import { saveManualReading, getManualReadings } from '../../services/db'
import { STATION_METADATA } from '../../services/cemaden'
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import LimiteSMJLayer from '../../components/LimiteSMJLayer'

// Helper to parse dates safely from ISO or BR formats
const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Format: DD/MM/YY HH:MM or DD/MM/YYYY HH:MM
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2,4})\s+(\d{2}):(\d{2})/);
    if (match) {
        const [_, day, month, year, hour, minute] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;
        return new Date(`${fullYear}-${month}-${day}T${hour}:${minute}:00`);
    }
    return null;
};

// Check if a station is active (updated in the last 48 hours)
const isStationActive = (station) => {
    if (station.isManual) return true;
    if (station.status === 'Offline') return false;
    
    const lastUpdateDate = parseDateSafe(station.lastUpdate);
    if (!lastUpdateDate) return false;
    
    const diffHrs = (new Date() - lastUpdateDate) / (1000 * 60 * 60);
    return diffHrs <= 48;
};

// Get color based on risk level
const getPluvioColor = (level) => {
    if (level === 'Extremo') return '#ef4444';
    if (level === 'Alerta') return '#f97316';
    if (level === 'Atenção') return '#f59e0b';
    return '#22c55e'; // Green for normal
};

// Create custom icons for Leaflet Map
const createPluvioIcon = (station, isActive) => {
    if (!isActive) {
        // Inactive: small gray circle
        return L.divIcon({
            className: 'custom-pluvio-inactive',
            html: `
                <div style="
                    background-color: #94a3b8;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 1.5px 3px rgba(0,0,0,0.35);
                "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -7]
        });
    }

    // Active: colored circle with rainfall value
    const rainVal = (station.acc24hr || 0).toFixed(1);
    const level = station.level || 'Normal';
    const color = getPluvioColor(level);

    return L.divIcon({
        className: 'custom-pluvio-active',
        html: `
            <div style="
                background-color: ${color};
                color: white;
                font-family: 'Outfit', 'Inter', system-ui, sans-serif;
                font-size: 10px;
                font-weight: 900;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
                ${rainVal}
            </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
    });
};
// --- Bacias Hidrográficas Layer ---
const BACIAS_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];
const getBaciaColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return BACIAS_COLORS[Math.abs(hash) % BACIAS_COLORS.length];
};

const BaciasLayer = ({ data }) => {
    if (!data || !data.features || data.features.length === 0) return null;
    return (
        <GeoJSON
            data={data}
            style={(feature) => {
                const color = getBaciaColor(feature.properties?.Name || 'Unknown');
                return {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    weight: 2,
                    opacity: 0.9
                };
            }}
            onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const color = getBaciaColor(p.Name || 'Unknown');
                layer.bindPopup(`
                    <div style="font-family:sans-serif;min-width:190px">
                        <div style="font-size:10px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Bacia Hidrográfica</div>
                        <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">${p.Name || 'Bacia'}</div>
                        <div style="font-size:10px;color:#475569;max-height:150px;overflow-y:auto;line-height:1.4;">${p.description || ''}</div>
                    </div>
                `);
            }}
        />
    );
};

// Map hook component to capture Leaflet map instance
const MapInstanceCapture = ({ setMap }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            setMap(map);
        }
    }, [map, setMap]);
    return null;
};

// Map hook component to listen for mouse move and update coords
const CoordsListener = ({ setCoords }) => {
    useMapEvents({
        mousemove(e) {
            setCoords(e.latlng);
        }
    });
    return null;
};

// Risk Badge for Detailed Modal
const RiskBadge = ({ level, size = 'sm' }) => {
    const colors = {
        'NORMAL': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800/50' },
        'OBSERVAÇÃO': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800/50' },
        'ATENÇÃO': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50' },
        'ALERTA MÁXIMO': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800/50' }
    };
    const style = colors[level] || colors['NORMAL'];
    const sizeClass = size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-[10px]';

    return (
        <span className={`${style.bg} ${style.text} ${style.border} border ${sizeClass} font-black rounded-full uppercase tracking-wide`}>
            {level}
        </span>
    );
};

const Pluviometros = ({ hideHeader = false }) => {
    const navigate = useNavigate();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [baciasData, setBaciasData] = useState(null);
    const [showBacias, setShowBacias] = useState(false);
    
    // Selection state for Map & Charts
    const [selectedStation, setSelectedStation] = useState(null);
    
    // Detailed analysis modal state (opens on click/select)
    const [analysisModalStation, setAnalysisModalStation] = useState(null);
    
    const activeStation = analysisModalStation || selectedStation;
    
    // Manual reading modal state
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 16));
    const [manualVolume, setManualVolume] = useState('');
    const [manualPeriod, setManualPeriod] = useState('1h');
    
    // Interactive Map States
    const [mapInstance, setMapInstance] = useState(null);
    const [mapStyle, setMapStyle] = useState('osm');
    const [mouseCoords, setMouseCoords] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Table Filters
    const [cityFilter, setCityFilter] = useState('santa ma');
    const [nameFilter, setNameFilter] = useState('');

    const chartsRef = useRef(null);
    const reportRef = useRef(null);
    const modalReportRef = useRef(null);

    useEffect(() => {
        fetchData();
        fetch('/bacias_hidrograficas.geojson')
            .then(r => r.json())
            .then(d => setBaciasData(d))
            .catch(e => console.warn('[Bacias] Falha ao carregar JSON:', e));
    }, []);

    // Set first station as default for charts once loaded
    useEffect(() => {
        if (stations.length > 0 && !selectedStation) {
            setSelectedStation(stations[0]);
        }
    }, [stations, selectedStation]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Manual Readings (SEDE)
            const manualReadings = await getManualReadings().catch(() => []);
            const now = new Date();

            const getLatestForPeriod = (period, hours) => {
                const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000);
                const relevant = manualReadings.filter(r =>
                    (r.period === period || (!r.period && period === '1h')) &&
                    new Date(r.date) > windowStart &&
                    new Date(r.date) <= now
                );
                return relevant.length > 0 ? parseFloat(relevant[0].volume) : 0;
            };

            const manualAcc1h = getLatestForPeriod('1h', 1);
            const manualAcc24h = getLatestForPeriod('24h', 24);
            const manualAcc48h = getLatestForPeriod('48h', 48);
            const manualAcc96h = getLatestForPeriod('96h', 96);
            const lastManualDate = manualReadings.length > 0 ? manualReadings[0].date : null;

            const manualMeta = STATION_METADATA['SEDE_DEFESA_CIVIL'] || {};
            const manualStation = {
                id: 'SEDE_DEFESA_CIVIL',
                name: 'SEDE DEFESA CIVIL (Manual)',
                type: 'pluviometric',
                status: 'Online',
                acc1hr: manualAcc1h,
                acc24hr: manualAcc24h,
                acc48hr: manualAcc48h,
                acc96hr: manualAcc96h,
                level: 0,
                flow: 0,
                lat: manualMeta.lat || -20.0406,
                lng: manualMeta.lon || -40.7456,
                lastUpdate: lastManualDate,
                isManual: true
            };

            // 2. Fetch Automatic Data
            const res = await fetch('/api/pluviometros').catch(() => null);
            let apiData = [];
            if (res && res.ok) {
                const rawData = await res.json();
                apiData = rawData.map(st => {
                    const meta = STATION_METADATA[st.id] || STATION_METADATA[st.id + 'A'] || {};
                    return {
                        ...st,
                        lat: meta.lat || st.lat || null,
                        lng: meta.lon || st.lng || st.lon || null
                    };
                });
            }

            // Normalise levels based on 24h accumulated rain
            const calculateStationLevel = (acc24) => {
                if (acc24 >= 80) return 'Extremo';
                if (acc24 >= 50) return 'Alerta';
                if (acc24 >= 30) return 'Atenção';
                return 'Normal';
            };

            const normalisedStations = [manualStation, ...apiData].map(st => {
                const acc24 = st.acc24hr || 0;
                return {
                    ...st,
                    level: calculateStationLevel(acc24)
                };
            });

            setStations(normalisedStations);

        } catch (err) {
            console.error(err);
            setError('Não foi possível carregar os dados das estações.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveManual = async () => {
        if (!manualVolume || isNaN(parseFloat(manualVolume))) {
            alert("Digite um volume válido");
            return;
        }
        try {
            await saveManualReading(manualVolume, manualDate, manualPeriod);
            setManualModalOpen(false);
            setManualVolume('');
            setManualDate(new Date().toISOString().slice(0, 16));
            fetchData();
        } catch (e) {
            alert("Erro ao salvar leitura manual.");
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        if (!searchTerm) return;
        
        const term = searchTerm.toLowerCase();
        const found = stations.find(s =>
            s.name.toLowerCase().includes(term) ||
            s.id.toLowerCase().includes(term)
        );

        if (found && found.lat && found.lng) {
            setSelectedStation(found);
            mapInstance?.setView([found.lat, found.lng], 13);
        } else {
            alert('Estação não encontrada ou sem coordenadas.');
        }
    };

    const handleSelectForCharts = (station) => {
        setSelectedStation(station);
        chartsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Chart Data Generators
    const chart4hData = useMemo(() => {
        if (!activeStation) return [];
        const r1 = activeStation.acc1hr || 0;
        const r3 = activeStation.acc3hr || 0;
        const now = new Date();

        const rainValues = [
            0,
            Math.max(0, r3 - r1) * 0.4,
            Math.max(0, r3 - r1) * 0.6,
            r1
        ];

        let cumulative = 0;
        return Array.from({ length: 4 }).map((_, i) => {
            const hourTime = new Date(now.getTime() - (3 - i) * 60 * 60 * 1000);
            const label = `${String(hourTime.getHours()).padStart(2, '0')}:00`;
            cumulative += rainValues[i];
            return {
                name: label,
                rain: parseFloat(rainValues[i].toFixed(1)),
                cumulative: parseFloat(cumulative.toFixed(1))
            };
        });
    }, [activeStation]);

    const chart24hData = useMemo(() => {
        if (!activeStation) return [];
        const r1 = activeStation.acc1hr || 0;
        const r3 = activeStation.acc3hr || 0;
        const r6 = activeStation.acc6hr || 0;
        const r12 = activeStation.acc12hr || 0;
        const r24 = activeStation.acc24hr || 0;

        let cumulative = 0;
        const now = new Date();

        return Array.from({ length: 24 }).map((_, i) => {
            const hourTime = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
            const label = `${String(hourTime.getHours()).padStart(2, '0')}:00`;

            let rain = 0;
            if (i === 23) {
                rain = r1;
            } else if (i >= 21) {
                rain = (r3 - r1) / 2;
            } else if (i >= 18) {
                rain = (r6 - r3) / 3;
            } else if (i >= 12) {
                rain = (r12 - r6) / 6;
            } else {
                rain = (r24 - r12) / 12;
            }

            if (rain < 0) rain = 0;
            cumulative += rain;

            return {
                name: label,
                rain: parseFloat(rain.toFixed(1)),
                cumulative: parseFloat(cumulative.toFixed(1))
            };
        });
    }, [activeStation]);

    const chart7dData = useMemo(() => {
        if (!activeStation) return [];
        const r24 = activeStation.acc24hr || 0;
        const r48 = activeStation.acc48hr || 0;
        const r72 = activeStation.acc72hr || 0;
        const r96 = activeStation.acc96hr || 0;

        const now = new Date();
        let cumulative = 0;

        const dailyRain = [
            0,
            0.1 * r96,
            0.2 * r96,
            Math.max(0, r96 - r72),
            Math.max(0, r72 - r48),
            Math.max(0, r48 - r24),
            r24
        ];

        return Array.from({ length: 7 }).map((_, i) => {
            const dayTime = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            const label = dayTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            cumulative += dailyRain[i];
            return {
                name: label,
                rain: parseFloat(dailyRain[i].toFixed(1)),
                cumulative: parseFloat(cumulative.toFixed(1))
            };
        });
    }, [activeStation]);

    // Table Filtered Data
    const filteredStations = useMemo(() => {
        return stations.filter(s => {
            const cityMatches = 'SANTA MARIA DE JETIBÁ'.toLowerCase().includes(cityFilter.toLowerCase()) || cityFilter === '';
            const nameMatches = s.name.toLowerCase().includes(nameFilter.toLowerCase()) || nameFilter === '';
            return cityMatches && nameMatches;
        });
    }, [stations, cityFilter, nameFilter]);

    // Risk level info text for modal
    const getRiskLabel = (acc24) => {
        if (acc24 >= 80) return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-100 dark:border-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'ALERTA MÁXIMO' };
        if (acc24 >= 50) return { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-100 dark:border-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'ATENÇÃO' };
        if (acc24 >= 30) return { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-100 dark:border-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: 'OBSERVAÇÃO' };
        return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-100 dark:border-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'NORMAL' };
    };

    return (
        <div className={hideHeader ? "" : "bg-slate-50 dark:bg-slate-950 min-h-screen pb-12 transition-colors duration-200"}>
            {/* Standard Header */}
            {!hideHeader && (
                <div className="bg-white dark:bg-slate-900 px-6 py-4 shadow-sm sticky top-0 z-[10] border-b border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Pluviômetros</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setAnalysisModalStation(stations[0] || selectedStation)} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/70 dark:bg-blue-900/20 text-[#2a5299] dark:text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-100 dark:border-blue-800 hover:scale-[1.02]"
                        >
                            <FileText size={16} /> Tabela & Gráficos
                        </button>
                        <button onClick={() => setManualModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-[#2a5299] dark:text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-100 dark:border-blue-800 hover:bg-blue-100/50">
                            <Plus size={16} /> Entrada Manual
                        </button>
                        <button onClick={fetchData} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Layout Container */}
            <div ref={reportRef} className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-6">
                {hideHeader && (
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAnalysisModalStation(stations[0] || selectedStation)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 hover:bg-blue-100/40"
                            >
                                <FileText size={14} /> Tabela & Gráficos
                            </button>
                            <button
                                onClick={() => setManualModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 hover:bg-blue-100/40"
                            >
                                <Plus size={14} /> Entrada Manual
                            </button>
                            <button
                                onClick={fetchData}
                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 🌧️ CEMADEN-Style Map Control Bar */}
                <div className="bg-[#0ea5e9] p-3 text-white flex flex-col md:flex-row justify-between items-center rounded-t-[20px] shadow-md gap-3">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl border border-white/25 w-full md:w-auto">
                        <Search size={16} className="text-white/85 shrink-0" />
                        <input
                            type="text"
                            placeholder="cidade, uf"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-transparent text-white text-xs font-semibold placeholder-white/60 outline-none border-none w-full md:w-56"
                        />
                        <button type="submit" className="bg-white text-[#0ea5e9] px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all shrink-0">
                            Buscar
                        </button>
                    </form>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowBacias(!showBacias)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${showBacias ? 'bg-white text-[#0ea5e9]' : 'bg-white/20 text-white hover:bg-white/30 border border-white/25'}`}
                            title="Alternar Bacias Hidrográficas"
                        >
                            <Waves size={14} /> Bacias
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/80 ml-2 hidden sm:inline">Provedor:</span>
                        <select
                            value={mapStyle}
                            onChange={e => setMapStyle(e.target.value)}
                            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs px-2.5 py-1.5 rounded-xl border-none font-bold focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer shadow-sm"
                        >
                            <option value="osm">OpenStreetMap</option>
                            <option value="satellite">Satélite</option>
                            <option value="carto">CartoDB Light</option>
                        </select>
                    </div>
                </div>

                {/* Interactive Leaflet Map */}
                <div className="h-[500px] md:h-[70vh] min-h-[500px] max-h-[850px] w-full rounded-b-[20px] overflow-hidden relative border-x border-b border-slate-200 dark:border-slate-800 shadow-lg z-[0] bg-slate-100 dark:bg-slate-900">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm z-[10]">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Carregando Pluviômetros...</span>
                            </div>
                        </div>
                    ) : (
                        <MapContainer
                            center={[-20.0246, -40.7464]}
                            zoom={11}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <MapInstanceCapture setMap={setMapInstance} />
                            <CoordsListener setCoords={setMouseCoords} />
                            
                            {mapStyle === 'osm' && (
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            )}
                            {mapStyle === 'satellite' && (
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                            )}
                            {mapStyle === 'carto' && (
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                            )}

                            {/* Municipality Bounds */}
                            <LimiteSMJLayer keyId="pluvio-page-smj" />

                            {/* Bacias Hidrográficas Layer */}
                            {showBacias && baciasData && (
                                <BaciasLayer data={baciasData} />
                            )}

                            {/* Rain Gauges Markers */}
                            {stations.filter(s => s.lat && s.lng).map(station => {
                                const active = isStationActive(station);
                                return (
                                    <Marker
                                        key={station.id}
                                        position={[station.lat, station.lng]}
                                        icon={createPluvioIcon(station, active)}
                                        eventHandlers={{
                                            mouseover: () => {
                                                setSelectedStation(station);
                                            },
                                            click: () => {
                                                setSelectedStation(station);
                                                setAnalysisModalStation(station);
                                            }
                                        }}
                                    />
                                );
                            })}
                        </MapContainer>
                    )}

                    {/* Floating Info Box (Bottom-Left) */}
                    {selectedStation && (
                        <div className="absolute bottom-4 left-4 z-[1000] w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-3 duration-250">
                            <div className="bg-[#0ea5e9] text-white px-4 py-2.5 flex justify-between items-center font-black text-[10px] uppercase tracking-widest shrink-0">
                                <span>Informações do Pluviômetro</span>
                                <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="p-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold tracking-tight">
                                <div className="text-slate-800 dark:text-slate-100 font-extrabold text-[13px] border-b border-slate-100 dark:border-slate-800 pb-1">{selectedStation.name}</div>
                                <div>Estação: <span className="font-semibold text-slate-500 dark:text-slate-400">{selectedStation.id}</span></div>
                                <div>Fonte: <span className="font-semibold text-slate-500 dark:text-slate-400">{selectedStation.isManual ? 'Manual / Defesa Civil' : 'CEMADEN'}</span></div>
                                <div>Município: <span className="font-semibold text-slate-500 dark:text-slate-400">SANTA MARIA DE JETIBÁ-ES</span></div>
                                <div>Coordenadas: <span className="font-mono text-slate-500 dark:text-slate-400">[{selectedStation.lat?.toFixed(3)}][{selectedStation.lng?.toFixed(3)}]</span></div>
                            </div>
                        </div>
                    )}

                    {/* Custom Zoom Buttons (Bottom-Center) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
                        <button
                            onClick={() => mapInstance?.zoomIn()}
                            className="w-9 h-9 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 active:scale-90 transition-all border border-cyan-400/20"
                            title="Aumentar Zoom"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <button
                            onClick={() => mapInstance?.zoomOut()}
                            className="w-9 h-9 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 active:scale-90 transition-all border border-cyan-400/20"
                            title="Diminuir Zoom"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <button
                            onClick={() => mapInstance?.setView([-20.0246, -40.7464], 11)}
                            className="w-9 h-9 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-600 active:scale-90 transition-all border border-cyan-400/20"
                            title="Restaurar Visão"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>

                    {/* Coordinates Label (Bottom-Right) */}
                    <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] text-white/90 font-mono z-[1000] pointer-events-none tracking-wider border border-white/10">
                        {mouseCoords ? `${mouseCoords.lng.toFixed(5)}, ${mouseCoords.lat.toFixed(5)}` : '-40.74640, -20.02460'}
                    </div>
                </div>

            {/* Fab Button for Share */}
            {!loading && stations.length > 0 && (
                <div className="fixed bottom-6 right-6 z-20">
                    <button
                        onClick={async () => {
                            if (!reportRef.current) return;
                            try {
                                const canvas = await html2canvas(reportRef.current, {
                                    backgroundColor: '#0f172a',
                                    scale: 2
                                });
                                canvas.toBlob(async (blob) => {
                                    const file = new File([blob], "mapa_pluviometria_smj.jpg", { type: "image/jpeg" });
                                    if (navigator.share) {
                                        await navigator.share({
                                            title: 'SIGERD - Mapa Pluviométrico',
                                            text: `Mapa de Pluviometria - Santa Maria de Jetibá. Atualizado em ${new Date().toLocaleString()}`,
                                            files: [file]
                                        }).catch(() => {});
                                    } else {
                                        const link = document.createElement('a');
                                        link.download = `mapa_pluviometria_smj_${Date.now()}.jpg`;
                                        link.href = canvas.toDataURL('image/jpeg');
                                        link.click();
                                    }
                                });
                            } catch (e) {
                                alert("Erro ao gerar imagem do mapa.");
                            }
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white px-5 py-3.5 rounded-full shadow-lg shadow-green-650/30 active:scale-95 transition-all flex items-center gap-2 font-bold"
                    >
                        <Share2 size={20} />
                        <span>Compartilhar Mapa</span>
                    </button>
                </div>
            )}

            {/* Manual Entry Modal */}
            {manualModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <button
                            onClick={() => setManualModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                        >
                            <X size={18} />
                        </button>

                        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Nova Leitura Manual</h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Sede Defesa Civil</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Data e Hora</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-bold text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={manualDate}
                                    onChange={e => setManualDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Período Relacionado</label>
                                <div className="grid grid-cols-4 gap-1.5 mt-2">
                                    {['1h', '24h', '48h', '96h'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setManualPeriod(p)}
                                            className={`py-2 px-1 rounded-xl border text-xs font-black transition-all ${manualPeriod === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Volume (mm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 font-black text-lg text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={manualVolume}
                                    onChange={e => setManualVolume(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleSaveManual}
                                className="w-full py-3.5 bg-[#2a5299] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg mt-4 active:scale-95 transition-all"
                            >
                                Salvar Leitura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📊 Comprehensive Analysis & Table Modal */}
            {analysisModalStation && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[28px] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 max-h-[92vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Painel de Análise Detalhada</h3>
                                <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight pr-2">
                                    {analysisModalStation.name}
                                </h2>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
                                    <span>ID: {analysisModalStation.id}</span>
                                    <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline"></span>
                                    <span>Fonte: {analysisModalStation.isManual ? 'Manual (Defesa Civil)' : 'CEMADEN'}</span>
                                    <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline"></span>
                                    <span>Coordenadas: {analysisModalStation.lat?.toFixed(5)}, {analysisModalStation.lng?.toFixed(5)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={async () => {
                                        if (!modalReportRef.current) return;
                                        try {
                                            const canvas = await html2canvas(modalReportRef.current, {
                                                backgroundColor: '#0f172a',
                                                scale: 2
                                            });
                                            canvas.toBlob(async (blob) => {
                                                const file = new File([blob], `analise_${analysisModalStation.id}.jpg`, { type: "image/jpeg" });
                                                if (navigator.share) {
                                                    await navigator.share({
                                                        title: `SIGERD - Análise: ${analysisModalStation.name}`,
                                                        text: `Gráficos e Histórico Pluviométrico. Atualizado em ${new Date().toLocaleString()}`,
                                                        files: [file]
                                                    }).catch(() => {});
                                                } else {
                                                    const link = document.createElement('a');
                                                    link.download = `analise_${analysisModalStation.id}_${Date.now()}.jpg`;
                                                    link.href = canvas.toDataURL('image/jpeg');
                                                    link.click();
                                                }
                                            });
                                        } catch (e) {
                                            alert("Erro ao compartilhar análise.");
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold transition-all border border-green-150 dark:border-green-800 hover:bg-green-100/50"
                                >
                                    <Share2 size={14} /> Compartilhar
                                </button>
                                <button
                                    onClick={() => setAnalysisModalStation(null)}
                                    className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0"
                                >
                                    <X size={20} className="text-slate-600 dark:text-slate-350" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-350">
                            <div ref={modalReportRef} className="space-y-6">
                                {/* Station stats grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nível de Risco</span>
                                        <div className="mt-2">
                                            <RiskBadge level={getRiskLabel(analysisModalStation.acc24hr).label} size="lg" />
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Acumulado 1h</span>
                                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                            {analysisModalStation.acc1hr?.toFixed(1) || '0.0'}
                                            <span className="text-xs font-bold text-slate-400 ml-1">mm</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Acumulado 24h</span>
                                        <div className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">
                                            {analysisModalStation.acc24hr?.toFixed(1) || '0.0'}
                                            <span className="text-xs font-bold text-slate-400 ml-1">mm</span>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Última Leitura</span>
                                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 mt-2">
                                            {analysisModalStation.lastUpdate ? new Date(analysisModalStation.lastUpdate).toLocaleString('pt-BR') : 'Sem dados'}
                                        </div>
                                    </div>
                                </div>

                                {analysisModalStation.type === 'fluviometric' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-wider">
                                                <Waves size={16} /> Nível do Rio
                                            </div>
                                            <div className="text-xl font-black text-slate-800 dark:text-slate-100">
                                                {analysisModalStation.level} <span className="text-xs font-bold text-slate-450 ml-1">cm</span>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-500 uppercase tracking-wider">
                                                <Activity size={16} /> Vazão Estimada
                                            </div>
                                            <div className="text-xl font-black text-slate-800 dark:text-slate-100">
                                                {analysisModalStation.flow} <span className="text-xs font-bold text-slate-450 ml-1">m³/s</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 📉 GRÁFICOS */}
                                <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/70 dark:border-slate-800 shadow-sm p-6 space-y-6">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                                        Gráficos de Precipitação
                                    </h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Chart 1: Last 4 Hours */}
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider text-center">
                                                Acumulado nas Últimas 4 horas (mm)
                                            </h4>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chart4hData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="color4h_modal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                                                                <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                                                        <Area type="monotone" dataKey="cumulative" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#color4h_modal)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="text-[9px] text-center text-slate-400 font-medium uppercase mt-2">
                                                Fonte: CEMADEN | Elaboração: Defesa Civil
                                            </div>
                                        </div>

                                        {/* Chart 2: 24 Hours */}
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider text-center">
                                                Precipitação Acumulada em 24h (mm)
                                            </h4>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={chart24hData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} fontWeight="bold" />
                                                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                                                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                        <Bar dataKey="rain" fill="#b91c1c" name="Hora (mm)" barSize={6} />
                                                        <Line type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2} dot={false} name="Acumulado (mm)" />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="text-[9px] text-center text-slate-400 font-medium uppercase mt-2">
                                                Fonte: CEMADEN | Elaboração: Defesa Civil
                                            </div>
                                        </div>

                                        {/* Chart 3: 7 Days */}
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider text-center">
                                                Precipitação Acumulada em 7 dias (mm)
                                            </h4>
                                            <div className="h-64 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ComposedChart data={chart7dData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                                                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                                                        <Bar dataKey="rain" fill="#60a5fa" name="Diária (mm)" barSize={20} />
                                                        <Line type="monotone" dataKey="cumulative" stroke="#0f172a" strokeWidth={2} dot={false} name="Acumulado (mm)" />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="text-[9px] text-center text-slate-400 font-medium uppercase mt-2">
                                                Fonte: CEMADEN | Elaboração: Defesa Civil
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 📊 TABELAS COM VALORES */}
                            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/70 dark:border-slate-800 shadow-sm p-6 space-y-4">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-l-4 border-blue-500 pl-3">
                                    Tabelas de Monitoramento (Município)
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-850">
                                    <table className="w-full text-left border-collapse min-w-[1000px]">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                <th colSpan={5} className="p-3 text-[10px] font-black uppercase tracking-wider text-center">Identificação da Estação</th>
                                                <th colSpan={7} className="p-3 text-[10px] font-black uppercase tracking-wider text-center bg-blue-50/50 dark:bg-blue-950/20 border-x border-slate-100 dark:border-slate-800">ACUMULADOS [ HR ]</th>
                                                <th colSpan={2} className="p-3 text-[10px] font-black uppercase tracking-wider text-center">Status & Ações</th>
                                            </tr>
                                            <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider">
                                                <th className="p-3 w-12 text-center">UF</th>
                                                <th className="p-3 w-48">
                                                    <div className="space-y-1">
                                                        <div>Cidade</div>
                                                        <input
                                                            type="text"
                                                            placeholder="santa ma"
                                                            value={cityFilter}
                                                            onChange={e => setCityFilter(e.target.value)}
                                                            className="w-full px-2 py-1 text-[9px] font-bold border border-slate-600 bg-slate-700 dark:bg-slate-850 text-white rounded outline-none focus:ring-1 focus:ring-blue-400"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="p-3 w-56">
                                                    <div className="space-y-1">
                                                        <div>Nome</div>
                                                        <input
                                                            type="text"
                                                            placeholder="filtrar nome..."
                                                            value={nameFilter}
                                                            onChange={e => setNameFilter(e.target.value)}
                                                            className="w-full px-2 py-1 text-[9px] font-bold border border-slate-600 bg-slate-700 dark:bg-slate-850 text-white rounded outline-none focus:ring-1 focus:ring-blue-400"
                                                        />
                                                    </div>
                                                </th>
                                                <th className="p-3 w-40">Data (Horário UTC)</th>
                                                <th className="p-3 w-20 text-center">Último</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">1</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">6</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">12</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">24</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">48</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">72</th>
                                                <th className="p-3 w-16 text-center bg-blue-50/20 dark:bg-blue-950/10">96</th>
                                                <th className="p-3 w-36 text-center">Risco</th>
                                                <th className="p-3 text-center">Selecionar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-350">
                                            {filteredStations.map((station) => {
                                                const active = isStationActive(station);
                                                const parsedDate = parseDateSafe(station.lastUpdate);
                                                const formattedDate = parsedDate 
                                                    ? parsedDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                    : 'Sem dados';

                                                return (
                                                    <tr
                                                        key={station.id}
                                                        onClick={() => setAnalysisModalStation(station)}
                                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all ${analysisModalStation.id === station.id ? 'bg-blue-50/40 dark:bg-blue-950/20 font-bold' : ''}`}
                                                    >
                                                        <td className="p-3 text-center text-[10px] font-bold text-slate-400">ES</td>
                                                        <td className="p-3 uppercase">SANTA MARIA DE JETIBÁ</td>
                                                        <td className="p-3 font-extrabold text-slate-900 dark:text-slate-100">{station.name}</td>
                                                        <td className="p-3 text-slate-450 font-mono text-[10.5px]">{formattedDate}</td>
                                                        <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{(station.acc1hr || 0).toFixed(1)}</td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc1hr !== undefined ? station.acc1hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc6hr !== undefined ? station.acc6hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc12hr !== undefined ? station.acc12hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc24hr !== undefined ? station.acc24hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc48hr !== undefined ? station.acc48hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc72hr !== undefined ? station.acc72hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center text-slate-400 bg-blue-50/10 dark:bg-blue-950/5">
                                                            {active && station.acc96hr !== undefined ? station.acc96hr.toFixed(1) : '-'}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center">
                                                                <div 
                                                                    className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-900 shadow-sm"
                                                                    style={{ backgroundColor: active ? getPluvioColor(station.level) : '#94a3b8' }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setAnalysisModalStation(station);
                                                                }}
                                                                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-150 dark:border-blue-900 hover:bg-blue-100"
                                                            >
                                                                Carregar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
                            {analysisModalStation.lat && analysisModalStation.lng && (
                                <button
                                    onClick={() => {
                                        setSelectedStation(analysisModalStation);
                                        setAnalysisModalStation(null);
                                        mapInstance?.setView([analysisModalStation.lat, analysisModalStation.lng], 13);
                                    }}
                                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold rounded-xl active:scale-95 transition-all text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 border border-cyan-400/20"
                                >
                                    <MapPin size={14} />
                                    Focar no Mapa
                                </button>
                            )}
                            <button
                                onClick={() => setAnalysisModalStation(null)}
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-250 dark:hover:bg-slate-800 font-extrabold rounded-xl active:scale-95 transition-all text-xs uppercase tracking-wider"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default Pluviometros;
