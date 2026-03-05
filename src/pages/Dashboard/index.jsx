import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import {
    ClipboardList, AlertTriangle, Timer, CloudRain, Map, BarChart3,
    CloudUpload, Trash2, FileText, Flame, Zap, RefreshCw, Home, X, Users,
    ShieldAlert, Activity, Droplets, MapPin, Gauge, CheckCircle, Layers,
    Download, ChevronDown, ExternalLink, Bell, MonitorPlay, Clock
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import {
    getPendingSyncCount, syncPendingData, getAllVistoriasLocal,
    getRemoteVistoriasCache, pullAllData, resetDatabase, getManualReadings
} from '../../services/db'
import { getOcorrenciasLocal } from '../../services/ocorrenciasDb'
import { getShelters, getOccupants, getInventory } from '../../services/shelterDb'
import { generateSituationalReport } from '../../utils/situationalReportGenerator'
import { cemadenService } from '../../services/cemaden'
import CemadenAlertBanner from '../../components/CemadenAlertBanner'
import { useToast } from '../../components/ToastNotification'
import { APP_VERSION } from '../../version'

// --- HELPER FUNCTIONS ---
const processBreakdown = (records) => {
    const counts = {};
    records.forEach(v => {
        const cat = v.categoria_risco || v.categoriaRisco || 'Outros';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const colorPalette = {
        'Geológico / Geotécnico': 'bg-orange-500',
        'Risco Geológico': 'bg-orange-500',
        'Hidrológico': 'bg-blue-500',
        'Inundação': 'bg-blue-500',
        'Alagamento': 'bg-blue-400',
        'Inundação/Alagamento': 'bg-blue-500',
        'Enxurrada': 'bg-blue-600',
        'Estrutural': 'bg-slate-400',
        'Estrutural/Predial': 'bg-slate-400',
        'Ambiental': 'bg-emerald-500',
        'Tecnológico': 'bg-amber-500',
        'Climático / Meteorológico': 'bg-sky-500',
        'Infraestrutura Urbana': 'bg-indigo-500',
        'Sanitário': 'bg-rose-500',
        'Deslizamento': 'bg-orange-500',
        'Vendaval': 'bg-sky-600',
        'Granizo': 'bg-indigo-400',
        'Incêndio': 'bg-red-500',
        'Outros': 'bg-slate-400'
    };

    const defaultColors = ['bg-slate-300', 'bg-slate-400', 'bg-slate-500'];
    const total = records.length;

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        color: colorPalette[label] || defaultColors[idx % defaultColors.length]
    })).sort((a, b) => b.count - a.count);
};

const processLocations = (records) => {
    return records
        .filter(v => (v.coordenadas && String(v.coordenadas).includes(',')) || (v.latitude && v.longitude) || (v.lat && v.lng))
        .map(v => {
            let lat, lng;
            if (v.coordenadas && String(v.coordenadas).includes(',')) {
                const parts = String(v.coordenadas).split(',')
                lat = parseFloat(parts[0])
                lng = parseFloat(parts[1])
            } else if (v.latitude && v.longitude) {
                lat = parseFloat(v.latitude)
                lng = parseFloat(v.longitude)
            } else if (v.lat && v.lng) {
                lat = parseFloat(v.lat)
                lng = parseFloat(v.lng)
            }
            if (isNaN(lat) || isNaN(lng)) return null
            const subtypes = v.subtipos_risco || v.subtiposRisco || []
            const category = v.categoria_risco || v.categoriaRisco || 'Outros'
            return {
                id: v.id,
                formattedId: v.ocorrencia_id_format || v.ocorrencia_id || v.vistoria_id || v.vistoriaId || (v.id ? String(v.id).split('-')[0].toUpperCase() : ''),
                lat, lng, risk: category,
                status: v.status || 'Pendente',
                details: subtypes.length > 0 ? (Array.isArray(subtypes) ? subtypes.join(', ') : subtypes) : category,
                date: v.created_at || v.data_hora || new Date().toISOString()
            }
        })
        .filter(loc => loc !== null) || [];
};

const processLocalidadeBreakdown = (records) => {
    const counts = {};
    records.forEach(v => {
        const loc = v.bairro || v.comunidade || v.localidade || 'Não Informado';
        const label = loc.trim() || 'Não Informado';
        counts[label] = (counts[label] || 0) + 1;
    });

    const colors = [
        'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
        'bg-emerald-500', 'bg-teal-500', 'bg-orange-500',
        'bg-rose-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const total = records.length;

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
};

// --- SUB-COMPONENT: EVENT LOG CARD ---
const EventLogCard = ({ data, rainfall, cemadenAlerts }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!data) return;
        const generatedEvents = [];

        (data.vistorias?.locations || []).forEach(v => {
            generatedEvents.push({ id: `vist-${v.id}`, time: new Date(v.date), title: `Emissão de Vistoria ${v.formattedId}`, desc: `${v.risk} - ${v.status} (${v.details})`, icon: '📋', color: 'text-blue-500' });
        });
        (data.ocorrencias?.locations || []).forEach(o => {
            generatedEvents.push({ id: `oco-${o.id}`, time: new Date(o.date), title: `Nova Ocorrência ${o.formattedId}`, desc: `${o.risk} - ${o.status}`, icon: '🏠', color: 'text-orange-500' });
        });
        (data.alerts || []).forEach((a, idx) => {
            generatedEvents.push({ id: `inmet-${idx}`, time: new Date(), title: `Aviso INMET Emitido`, desc: `${a.descricao || a.resumo || 'Alerta Meteorológico'}`, icon: '⚠️', color: 'text-red-500' });
        });
        (cemadenAlerts || []).forEach((c, idx) => {
            generatedEvents.push({ id: `cemaden-${idx}`, time: new Date(), title: `Aviso CEMADEN Emitido`, desc: `${c.tipo || 'Alerta Geo/Hidro'}: ${c.municipio || 'Santa Maria de Jetibá'}`, icon: '⚠️', color: 'text-red-500' });
        });
        (rainfall || []).filter(r => r.rainRaw > 0).forEach((r, idx) => {
            generatedEvents.push({ id: `pluvio-${idx}`, time: new Date(), title: `Pluviômetro CEMADEN`, desc: `${r.name} registrou ${r.rainRaw.toFixed(1)}mm (${r.level})`, icon: '🌧️', color: 'text-blue-400' });
        });

        generatedEvents.push({ id: `sys-1`, time: new Date(), title: `Sincronização do Sistema`, desc: `Dados atualizados com sucesso via SIGERD e plataformas parceiras`, icon: '🟢', color: 'text-emerald-500' });

        fetch('https://sigerd-mobile.vercel.app/api/boletim-meteorologico?limite=3')
            .then(res => res.json())
            .then(bolData => {
                if (bolData && bolData.boletins) {
                    bolData.boletins.forEach((b, idx) => {
                        generatedEvents.push({ id: `bol-${idx}`, time: new Date(), title: `Boletim Emitido`, desc: b.titulo, icon: '📊', color: 'text-indigo-500' });
                    });
                }
                generatedEvents.sort((a, b) => b.time - a.time);
                setEvents(generatedEvents.slice(0, 100));
            })
            .catch(() => {
                generatedEvents.sort((a, b) => b.time - a.time);
                setEvents(generatedEvents.slice(0, 100));
            });

    }, [data, rainfall, cemadenAlerts]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full w-full overflow-hidden transition-all">
            <div className="flex bg-slate-50 dark:bg-slate-800/80 p-2.5 border-b border-slate-100 dark:border-slate-800 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                        Registro de Eventos do Sistema
                    </h3>
                </div>
                <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full uppercase tabular-nums tracking-widest">100 Últimos</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar max-h-[300px]">
                {events.length === 0 && <div className="text-center text-slate-400 text-[10px] my-6 uppercase font-bold tracking-widest">Nenhum evento registrado</div>}
                {events.map(ev => (
                    <div key={ev.id} className="flex gap-2.5 relative group items-start">
                        <div className="w-px h-[calc(100%+8px)] bg-slate-200 dark:bg-slate-700/50 absolute left-[11px] top-4 z-0"></div>
                        <div className="w-6 h-6 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center text-[10px] z-10">
                            {ev.icon}
                        </div>
                        <div className="flex-1 pb-1 pt-0.5">
                            <div className="flex justify-between items-center mb-0.5 pr-1">
                                <span className={`text-[9px] font-black ${ev.color} leading-none uppercase tracking-widest truncate max-w-[65%]`}>{ev.title}</span>
                                <span className="text-[8px] font-bold text-slate-400 tabular-nums shrink-0 uppercase tracking-wider">
                                    {ev.time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {ev.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 pr-2">
                                {ev.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TV MODE VIEW ---
const TvModeDashboardView = ({ data, weather, cemadenAlerts, rainfall, statusInfo, viewMode, setViewMode, mapFilter, mapStyle }) => {
    const currentData = viewMode === 'vistorias' ? (data.vistorias || data) : (data.ocorrencias || data);
    const filteredLocations = mapFilter === 'Todas' ? (currentData.locations || []) : (currentData.locations || []).filter(l => l.risk === mapFilter);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-6 gap-6 overflow-hidden">
            {/* TV Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md">
                <div className="flex gap-6 items-center">
                    <img src="/logo_header.png" alt="Logo" className="h-14 w-auto object-contain dark:brightness-0 dark:invert" onError={(e) => e.target.style.display = 'none'} />
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest uppercase">SALA DE OPERAÇÕES</h1>
                        <h2 className="text-sm font-bold text-blue-500 dark:text-blue-400 tracking-[4px] uppercase">Monitoramento Contínuo - Defesa Civil</h2>
                    </div>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="text-right">
                        <div className="text-4xl font-black text-slate-800 dark:text-white tabular-nums flex items-center gap-4">
                            {weather?.current && <span>{Math.round(weather.current.temp)}°C</span>}
                            <span className="text-blue-500 font-normal">|</span>
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <button onClick={() => window.close()} className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* TV Content */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Stats Column */}
                <div className="w-[400px] flex flex-col gap-6 shrink-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-md flex flex-col items-center justify-center relative overflow-hidden flex-1">
                        <div className={`absolute top-0 left-0 w-full h-2 ${statusInfo.color}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[4px] mb-4 ${statusInfo.text}`}>Status Atual</span>
                        <div className={`text-5xl font-black text-center mb-6 px-4 py-2 rounded-2xl ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div className={`h-full rounded-full w-full opacity-80 ${statusInfo.color}`} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-md flex-1 flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-4 mb-2 text-blue-500 dark:text-blue-400">
                            <AlertTriangle size={32} />
                            <span className="text-xs font-black uppercase tracking-[3px]">Ocorrências Ativas</span>
                        </div>
                        <span className="text-7xl font-black text-slate-800 dark:text-white tabular-nums">{data.stats.activeOccurrences}</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-md flex-1 flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-4 mb-2 text-indigo-500 dark:text-indigo-400">
                            <Droplets size={32} />
                            <span className="text-xs font-black uppercase tracking-[3px]">Média 24H (mm)</span>
                        </div>
                        <span className="text-7xl font-black text-slate-800 dark:text-white tabular-nums">
                            {rainfall?.length ? (rainfall.reduce((a, b) => a + (b.rainRaw || 0), 0) / rainfall.length).toFixed(1) : '0.0'}
                        </span>
                    </div>
                </div>

                {/* Right Map Column */}
                <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden relative">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        {mapStyle === 'street' ? (
                            <TileLayer url={`https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`} />
                        ) : (
                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        )}
                        <HeatmapLayer points={filteredLocations || []} show={mapStyle === 'street'} options={{ radius: 30, blur: 20, opacity: 0.8 }} />
                        {filteredLocations?.map((loc, idx) => (
                            <CircleMarker
                                key={idx} center={[loc.lat, loc.lng]} radius={8}
                                pathOptions={{
                                    color: '#fff',
                                    fillColor: viewMode === 'ocorrencias'
                                        ? (loc.status === 'Em Atendimento' ? '#f59e0b' : loc.status === 'Pendente' ? '#ef4444' : '#3b82f6')
                                        : (String(loc.risk).includes('Alto') ? '#ef4444' : '#f97316'),
                                    fillOpacity: 0.9, weight: 3
                                }}
                            >
                                <Popup><div className="font-bold text-sm p-1">{loc.risk} - {loc.status}</div></Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>

                    {/* TV Legend */}
                    <div className="absolute bottom-8 right-8 z-[1000] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest space-y-4">
                        <div className="mb-2 text-[10px] text-slate-400">LEGENDA DO MAPA ({viewMode.toUpperCase()})</div>
                        {viewMode === 'ocorrencias' ? (
                            <>
                                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white"></div>Atendido</div>
                                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-white"></div>Em Atendimento</div>
                                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>Pendente</div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white"></div>Risco Alto / Crítico</div>
                                <div className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white"></div>Risco Médio / Baixo</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: MOBILE VIEW ---
const MobileDashboardView = ({
    data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
    showReportMenu, setShowReportMenu, getWeatherIcon, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle,
    chartMode, setChartMode
}) => {
    const currentData = viewMode === 'vistorias' ? data.vistorias : data.ocorrencias;
    const filteredLocations = mapFilter === 'Todas' ? currentData.locations : currentData.locations.filter(l => l.risk === mapFilter);
    const typologies = ['Todas', ...currentData.breakdown.map(b => b.label)];
    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 font-sans">
            <div className="p-5 space-y-8">
                {/* 1. Weather Widget (Image 1 Style) */}
                {weather?.current ? (
                    <div
                        onClick={() => setShowForecast(true)}
                        className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between cursor-pointer active:scale-95 transition-all mb-4"
                    >
                        <div className="flex items-center gap-6">
                            <div className="text-6xl drop-shadow-sm">{getWeatherIcon(weather.current.code)}</div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{Math.round(weather.current.temp || 0)}</span>
                                    <span className="text-2xl font-bold text-slate-400">°C</span>
                                </div>
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mt-1">SANTA MARIA DE JETIBÁ</div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                                <CloudRain size={16} className="text-blue-500 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">Chuva: <span className="font-bold">{weather.daily?.[0]?.rainProb || 0}%</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                                <Timer size={16} className="text-blue-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">Umidade: <span className="font-bold">{weather.current.humidity || 0}%</span></span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                                <Activity size={16} className="text-slate-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">Vento: <span className="font-bold">{Math.round(weather.current.wind || 6)} km/h</span></span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-[32px] p-8 border border-white dark:border-slate-700 shadow-sm animate-pulse mb-4 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <div className="space-y-2">
                                <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    </div>
                )}

                <CemadenAlertBanner alerts={cemadenAlerts} />

                {/* 2. Indicadores Operacionais */}
                <div>
                    <div className="flex justify-between items-center mb-6 px-1">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Indicadores Operacionais</h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] -mt-1">Santa Maria de Jetibá</span>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className={`p-2.5 rounded-xl transition-all ${syncing ? 'bg-blue-100 text-blue-600 animate-spin' : 'bg-slate-200/50 text-gray-500'}`}
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Sync Card */}
                        <div onClick={handleSync} className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-all group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                {syncing ? <CloudUpload size={20} className="animate-bounce" /> : <CloudUpload size={20} />}
                            </div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1 tabular-nums">
                                {(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? (syncDetail.vistorias + syncDetail.interdicoes) : '100%'}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sincronização</div>
                        </div>

                        {/* INMET Alerts */}
                        <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                            <div className="bg-orange-50 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                                <Zap size={20} />
                            </div>
                            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1 tabular-nums">{data.stats.inmetAlertsCount || 0}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Avisos INMET</div>
                        </div>
                    </div>
                </div>

                {/* 3. Acesso Rápido - Circular Icons */}
                <div>
                    <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6 px-1 uppercase tracking-widest text-center">Acesso Rápido</h2>
                    <div className="grid grid-cols-4 gap-2 px-1 justify-items-center">
                        <div onClick={() => navigate('/monitoramento')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                <BarChart3 size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Monitoramento</span>
                        </div>
                        <div onClick={() => navigate('/abrigos')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                <Home size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Assisit. Humanitária</span>
                        </div>
                        <div onClick={() => navigate('/ocorrencias')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                <ClipboardList size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Ocorrências</span>
                        </div>
                        <div className="flex flex-col items-center gap-2.5 relative">
                            <div onClick={() => setShowReportMenu(!showReportMenu)} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-blue-600 active:scale-90 transition-all cursor-pointer">
                                <FileText size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Relatórios</span>
                        </div>
                    </div>
                </div>

                {/* 4. Tipologia Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[2px]">{viewMode === 'vistorias' ? 'Vistorias' : 'Ocorrências'}</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                            <button
                                onClick={() => setChartMode('tipologia')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'tipologia' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tipologia
                            </button>
                            <button
                                onClick={() => setChartMode('localidade')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'localidade' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Localidade
                            </button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {(chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown)?.slice(0, 5).map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-blue-500'}`} style={{ width: `${item.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. Map Section */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 px-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-[2px]">Mapa Situacional</h3>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <MapPin size={12} className="text-blue-500" />
                                <select
                                    value={mapFilter}
                                    onChange={(e) => setMapFilter(e.target.value)}
                                    className="text-[10px] font-bold bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none"
                                >
                                    {typologies.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-[18px] border border-slate-100/50 dark:border-slate-700/50">
                            <button
                                onClick={() => { setViewMode('vistorias'); setMapFilter('Todas'); }}
                                className={`flex-1 py-3 text-xs font-black rounded-[14px] transition-all ${viewMode === 'vistorias' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
                            >
                                Vistorias
                            </button>
                            <button
                                onClick={() => { setViewMode('ocorrencias'); setMapFilter('Todas'); }}
                                className={`flex-1 py-3 text-xs font-black rounded-[14px] transition-all ${viewMode === 'ocorrencias' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
                            >
                                Ocorrências
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-2 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="h-80 w-full rounded-[26px] overflow-hidden bg-slate-100 relative z-0">
                            <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                {/* Map Style Toggle (Mobile - Absolute inside map) */}
                                <div className="absolute top-4 left-4 z-[1000]">
                                    <button
                                        onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
                                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
                                    >
                                        <Layers size={20} />
                                    </button>
                                </div>


                                {mapStyle === 'street' ? (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                ) : (
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                )}
                                <HeatmapLayer points={filteredLocations || []} show={mapStyle === 'street'} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                                {filteredLocations?.map((loc, idx) => (
                                    <CircleMarker
                                        key={idx}
                                        center={[loc.lat, loc.lng]}
                                        radius={5}
                                        pathOptions={{
                                            color: mapStyle === 'street' ? '#fff' : '#3b82f6',
                                            fillColor: viewMode === 'ocorrencias'
                                                ? (loc.status === 'Cancelada' ? '#64748b' :
                                                    loc.status === 'Em Análise' ? '#f97316' :
                                                        loc.status === 'Em Atendimento' ? '#f59e0b' :
                                                            loc.status === 'Atendido' ? '#3b82f6' :
                                                                loc.status === 'Finalizada' ? '#10b981' :
                                                                    '#ef4444') // Pendente
                                                : (String(loc.risk).includes('Alto') || String(loc.risk).includes('Crítico') || String(loc.risk).includes('Perigo') ? '#ef4444' : '#f97316'),
                                            fillOpacity: 0.9,
                                            weight: 2
                                        }}
                                    >
                                        <Popup minWidth={180}>
                                            <div className="p-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest line-clamp-1">
                                                        {viewMode === 'vistorias' ? 'Vistoria' : 'Ocorrência'} {loc.formattedId ? `- ${loc.formattedId}` : ''}
                                                    </span>
                                                    {viewMode === 'ocorrencias' && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 ml-2 shrink-0">{loc.status}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-slate-800 mb-1">{loc.risk}</div>
                                                <div className="text-[11px] text-slate-500 leading-relaxed mb-2 line-clamp-2">{loc.details}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">
                                                    <span>Data: {new Date(loc.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                            {/* Standard Mobile Legend */}
                            <div className="absolute bottom-2 right-2 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-[8px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest space-y-1.5">
                                <div className="mb-0.5 text-[7px] text-slate-400">LEGENDA DO MAPA</div>
                                {viewMode === 'ocorrencias' ? (
                                    <>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Atendido</div>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Em Atend.</div>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>Em Análise</div>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Pendente</div>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>Cancelada</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Risco Alto</div>
                                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>Risco Baixo</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center py-8 opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-[4px] dark:text-white">SIGERD MOBILE V{APP_VERSION}</span>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: BOLETINS CARD ---
const BoletinsCard = () => {
    const [activeTab, setActiveTab] = useState('ext');
    const [boletinsMet, setBoletinsMet] = useState([]);
    const [boletinsExt, setBoletinsExt] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBoletins = async () => {
            setLoading(true);
            try {
                const baseURL = 'https://sigerd-mobile.vercel.app';
                const [resMet, resExt] = await Promise.all([
                    fetch(`${baseURL}/api/boletim-meteorologico?limite=10`).catch(() => null),
                    fetch(`${baseURL}/api/boletim-extraordinario?limite=10`).catch(() => null)
                ]);
                if (resMet && resMet.ok) {
                    const data = await resMet.json();
                    setBoletinsMet(data.boletins || []);
                }
                if (resExt && resExt.ok) {
                    const data = await resExt.json();
                    setBoletinsExt(data.boletins || []);
                }
            } catch (err) {
                console.warn('[BoletinsCard] Fetch failed:', err);
            }
            setLoading(false);
        };
        fetchBoletins();
    }, []);

    const isMet = activeTab === 'met';
    const currentList = isMet ? boletinsMet : boletinsExt;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden w-full transition-all">
            {/* TABS CONTROLS SMALL */}
            <div className="flex bg-slate-50 dark:bg-slate-800/80 p-1 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('ext')}
                    className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1 ${!isMet
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500 border border-slate-100 dark:border-slate-600'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                >
                    <ClipboardList size={12} /> Extra
                </button>
                <button
                    onClick={() => setActiveTab('met')}
                    className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1 ${isMet
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500 border border-slate-100 dark:border-slate-600'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                >
                    <CloudRain size={12} /> Meteo
                </button>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="p-2 flex-1 flex flex-col overflow-hidden relative min-h-[140px] max-h-[200px]">
                {loading ? (
                    <div className="absolute inset-0 flex justify-center items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300 border-t-slate-800"></div>
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
                        <FileText size={18} className="opacity-40" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Vazio</span>
                    </div>
                ) : (
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 flex flex-col gap-2">
                        {currentList.map((b, idx) => {
                            const isFirst = idx === 0;
                            return (
                                <a
                                    key={idx}
                                    href={b.url_pdf}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`group flex items-center p-2 rounded-xl transition-all border ${isFirst
                                        ? `bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow`
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-100 dark:hover:border-slate-800'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mr-2 shadow-sm ${isMet
                                        ? (isFirst ? 'bg-blue-500 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 border border-blue-100 dark:border-blue-800/50')
                                        : (isFirst ? 'bg-orange-500 text-white' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-500 border border-orange-100 dark:border-orange-800/50')
                                        }`}>
                                        <FileText size={14} />
                                    </div>
                                    <div className="flex-1 overflow-hidden pr-2">
                                        {isFirst && (
                                            <div className="flex items-center mb-0.5">
                                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest leading-none">Mais Recente</span>
                                            </div>
                                        )}
                                        <h4 className={`font-bold text-[10px] sm:text-[11px] leading-tight truncate transition-colors ${isFirst ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                                            } ${isMet ? 'group-hover:text-blue-500' : 'group-hover:text-orange-500'}`}>
                                            {b.titulo}
                                        </h4>
                                    </div>
                                    <ExternalLink size={10} className={`shrink-0 transition-all ${isFirst ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
// --- SUB-COMPONENT: WEB VIEW ---
const WebViewDashboardView = ({
    data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
    showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle,
    chartMode, setChartMode
}) => {
    const currentData = viewMode === 'vistorias' ? (data.vistorias || data) : (data.ocorrencias || data);
    const filteredLocations = mapFilter === 'Todas' ? (currentData.locations || []) : (currentData.locations || []).filter(l => l.risk === mapFilter);
    const typologies = ['Todas', ...(currentData.breakdown || []).map(b => b.label)];

    const isTvMode = new URLSearchParams(window.location.search).get('tvMode') === 'true';
    if (isTvMode) {
        return <TvModeDashboardView data={data} weather={weather} cemadenAlerts={cemadenAlerts} rainfall={rainfall} statusInfo={statusInfo} viewMode={viewMode} setViewMode={setViewMode} mapFilter={mapFilter} mapStyle={mapStyle} navigate={navigate} />
    }

    return (
        <div className="bg-[#f0f2f5] dark:bg-slate-950 min-h-screen font-sans flex flex-col">
            <div className="max-w-[1700px] mx-auto w-full p-6 space-y-6 flex-1">

                {/* --- 🏁 1. HEADER & TOP CARDS CONTAINER --- */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6">

                    {/* Header: Title */}
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            Monitoramento em Tempo Real
                        </h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.open('/?tvMode=true', '_blank', 'toolbar=no,scrollbars=yes,resizable=yes,top=50,left=50,width=1280,height=800')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
                            >
                                <MonitorPlay size={16} /> Modo TV
                            </button>
                        </div>
                    </div>

                    {/* Top 5 Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {/* Card 1: Risk Level */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col justify-between relative overflow-hidden group shadow-sm">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${statusInfo.color}`} />
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-xl font-black ${statusInfo.text}`}>{statusInfo.label}</span>
                                <div className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest leading-none ${statusInfo.text} ${statusInfo.bg}`}>Status</div>
                            </div>
                            <div className="space-y-4">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                    <div className={`h-full rounded-full w-full transition-all duration-1000 ${statusInfo.color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] italic">Plataforma INMET / CEMADEN</p>
                            </div>
                        </div>

                        {/* Card 2: INMET Alerts */}
                        <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-1 group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-500">
                                    <Zap size={20} />
                                </div>
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{((data.alerts || []).length + (cemadenAlerts || []).length)}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2">Avisos INMET</span>
                        </div>

                        {/* Card 3: Ocorrências Hoje */}
                        <div onClick={() => navigate('/ocorrencias')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-1 group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{data.stats.activeOccurrences}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2 text-center leading-none">Ocorrências Hoje</span>
                        </div>

                        {/* Card 4: Vistorias Totais */}
                        <div onClick={() => navigate('/vistorias')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-1 group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-500">
                                    <ClipboardList size={20} />
                                </div>
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{data.stats.totalVistorias}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2 text-center leading-none">Vistorias Totais</span>
                        </div>

                        {/* Card 5: Média Pluviométrica (Substituindo o Weather Card antigo) */}
                        <div onClick={() => navigate('/pluviometros')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col justify-between group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                                    <Droplets size={24} />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                                        {rainfall?.length ? (rainfall.reduce((a, b) => a + (b.rainRaw || 0), 0) / rainfall.length).toFixed(1) : 0}<span className="text-lg text-slate-400 font-bold ml-0.5">mm</span>
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">MÉDIA 24H</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <Gauge size={12} className="text-indigo-400 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-500 truncate">Estações: <span className="text-slate-600 dark:text-slate-300 font-black">{rainfall?.length || 0}</span> ativas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Clima Horizontal - Abaixo dos Minicards */}
                    {weather?.current && (
                        <div onClick={() => setShowForecast(true)} className="flex w-full flex-col md:flex-row items-center justify-between py-2.5 px-6 rounded-[16px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/60 shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group overflow-hidden">
                            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-3 md:mb-0">
                                <div className="text-3xl drop-shadow-sm text-blue-500 group-hover:scale-110 transition-transform">{getWeatherIcon(weather.current.code)}</div>
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tighter">{Math.round(weather.current.temp || 0)}°C</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Previsão • Santa Maria de Jetibá</div>
                                </div>
                            </div>
                            <div className="flex gap-6 relative z-10 w-full md:w-auto">
                                <div className="flex items-center gap-1.5">
                                    <CloudRain size={16} className="text-blue-500" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none uppercase">{weather.daily?.[0]?.rainProb || 0}%</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Chuva</span>
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex items-center gap-1.5">
                                    <Timer size={16} className="text-blue-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none uppercase">{weather.current.humidity || 0}%</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Umidade</span>
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex items-center gap-1.5">
                                    <Activity size={16} className="text-slate-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none uppercase">{Math.round(weather.current.wind || 6)} km/h</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Blue Horizontal Nav Bar */}
                    <div className="bg-[#2a5299] rounded-[18px] p-2 flex items-center justify-between overflow-x-auto custom-scrollbar gap-2">
                        {[
                            { label: 'Monitoramento', icon: BarChart3, path: '/monitoramento' },
                            { label: 'Ocorrências', icon: ClipboardList, path: '/ocorrencias' },
                            { label: 'Assistência Humanitária', icon: Home, path: '/abrigos' },
                            { label: 'Relatórios', icon: FileText, action: () => setShowReportMenu(!showReportMenu) },
                            { label: 'Atualizar Dados', icon: RefreshCw, action: handleSync, spin: syncing }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.action || (() => navigate(item.path))}
                                className="flex flex-1 justify-center items-center gap-2.5 px-6 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all group shrink-0"
                            >
                                <item.icon size={18} className={`opacity-70 group-hover:opacity-100 ${item.spin ? 'animate-spin' : ''}`} />
                                <span className="text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- 🗺️ 2. MAP & RESUMO SITUACIONAL --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Map Column */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">Mapa Situacional</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-1 underline decoration-blue-500 decoration-2 underline-offset-4">Distribuição Geográfica</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {/* Toggle Mode */}
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => { setViewMode('vistorias'); setMapFilter('Todas'); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'vistorias' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Vistorias
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('ocorrencias'); setMapFilter('Todas'); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'ocorrencias' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Ocorrências
                                    </button>
                                </div>

                                {/* Filter Dropdown */}
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <MapPin size={14} className="text-slate-400" />
                                    <select
                                        value={mapFilter}
                                        onChange={(e) => setMapFilter(e.target.value)}
                                        className="text-[11px] font-bold bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none cursor-pointer min-w-[120px]"
                                    >
                                        {typologies.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[520px] w-full rounded-[24px] overflow-hidden relative z-0 border border-slate-100 dark:border-slate-800 shadow-inner">
                            <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                                {/* Map Style Toggle (Web - Below Zoom) */}
                                <div className="absolute top-[80px] left-[10px] z-[1000]">
                                    <button
                                        onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
                                        className="w-[34px] h-[34px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center rounded-[4px] shadow-sm border-2 border-[rgba(0,0,0,0.2)] text-slate-700 dark:text-slate-200 transition-colors"
                                        title="Alternar vista"
                                    >
                                        <Layers size={18} />
                                    </button>
                                </div>

                                {mapStyle === 'street' ? (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                ) : (
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                )}
                                <HeatmapLayer points={filteredLocations || []} show={mapStyle === 'street'} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                                {filteredLocations?.map((loc, idx) => (
                                    <CircleMarker
                                        key={idx}
                                        center={[loc.lat, loc.lng]}
                                        radius={5}
                                        pathOptions={{
                                            color: mapStyle === 'street' ? '#fff' : '#3b82f6',
                                            fillColor: viewMode === 'ocorrencias'
                                                ? (loc.status === 'Cancelada' ? '#64748b' :
                                                    loc.status === 'Em Análise' ? '#f97316' :
                                                        loc.status === 'Em Atendimento' ? '#f59e0b' :
                                                            loc.status === 'Atendido' ? '#3b82f6' :
                                                                loc.status === 'Finalizada' ? '#10b981' :
                                                                    '#ef4444') // Pendente
                                                : (String(loc.risk).includes('Alto') || String(loc.risk).includes('Crítico') || String(loc.risk).includes('Perigo') ? '#ef4444' : '#f97316'),
                                            fillOpacity: 0.9,
                                            weight: 2
                                        }}
                                    >
                                        <Popup minWidth={220}>
                                            <div className="p-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest line-clamp-1">
                                                        {viewMode === 'vistorias' ? 'Vistoria' : 'Ocorrência'} {loc.formattedId ? `- ${loc.formattedId}` : ''}
                                                    </span>
                                                    {viewMode === 'ocorrencias' && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 ml-2 shrink-0">{loc.status}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-black text-slate-800 mb-2">{loc.risk}</div>
                                                <div className="text-xs text-slate-500 leading-relaxed mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                                                    {loc.details || 'Sem detalhes adicionais registrados.'}
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                                                    <span>Data: {new Date(loc.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                            {/* Standard Web Legend */}
                            <div className="absolute bottom-4 right-4 z-[1000] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-3.5 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest space-y-2.5">
                                <div className="mb-1 text-[8px] text-slate-400">LEGENDA DO MAPA</div>
                                {viewMode === 'ocorrencias' ? (
                                    <>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Atendido</div>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Em Atendimento</div>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-orange-500"></div>Em Análise</div>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-red-500"></div>Pendente</div>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-slate-500"></div>Cancelada</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-red-500"></div>Risco Alto / Crítico</div>
                                        <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-orange-500"></div>Risco Médio / Baixo</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resumo Situacional Column */}
                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[3px] border-l-4 border-blue-600 pl-4">{viewMode === 'vistorias' ? 'Vistorias' : 'Ocorrências'}</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setChartMode('tipologia')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'tipologia' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tipologia
                                </button>
                                <button
                                    onClick={() => setChartMode('localidade')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'localidade' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Localidade
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {(chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown)?.slice(0, 10).map((item, idx) => (
                                <div key={idx} className="group cursor-default">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors tracking-tight">{item.label}</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-100">{item.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-blue-500'}`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pluviômetros (Relocado para o final da lista situacional) */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            {/* Índices Pluviométricos Row */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px] flex items-center gap-2">
                                        Estações Pluviométricas (24h)
                                        {pluvioLoading && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                                    </h4>
                                    <button onClick={() => navigate('/pluviometros')} className="text-[9px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 py-1 px-2.5 rounded-lg active:scale-95">Ver painel</button>
                                </div>

                                {pluvioLoading ? (
                                    <div className="text-center py-6">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscando Estações...</div>
                                    </div>
                                ) : rainfall?.length > 0 ? (
                                    <div className="space-y-2.5 pr-2 custom-scrollbar max-h-[220px] overflow-y-auto">
                                        {rainfall.slice(0, 5).map((station, idx) => (
                                            <div key={idx} onClick={() => navigate('/pluviometros')} className="group flex items-center justify-between p-3 rounded-[16px] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-500/50 hover:bg-blue-50/30 hover:shadow-sm cursor-pointer transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-[4px] shadow-sm transform group-hover:rotate-45 transition-transform ${station.level === 'Extremo' ? 'bg-red-500 shadow-red-500/40' : station.level === 'Alerta' ? 'bg-orange-500 shadow-orange-500/40' : station.level === 'Atenção' ? 'bg-amber-400 shadow-amber-400/40' : 'bg-emerald-400 shadow-emerald-400/40'}`} />
                                                    <div className="flex flex-col justify-center">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-tight line-clamp-1 max-w-[140px] truncate">{station.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{station.level}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 px-3 py-1.5 rounded-[12px] border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                                    <Droplets size={12} className={station.level === 'Normal' ? 'text-blue-400' : station.level === 'Extremo' ? 'text-red-500' : 'text-slate-500'} />
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums tracking-tighter">{(station.rainRaw || 0).toFixed(1)}</span>
                                                        <span className="text-[9px] font-bold text-slate-500 leading-none">mm</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma estação com chuva reportada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 📉 3. BOTTOM SUMMARY ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Sync & Event Log) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Sync Summary */}
                            <div onClick={handleSync} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 group cursor-pointer hover:bg-slate-50 transition-all justify-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${syncing ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30'}`}>
                                        <CheckCircle size={18} className={syncing ? 'animate-spin' : ''} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sincronização do Sistema</span>
                                </div>
                                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">Atualizar</div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] italic">Forçar sincronização</span>
                            </div>

                            {/* Event Log Card (Replaces Vistoria Card block) */}
                            <div className="flex flex-col border border-transparent">
                                <EventLogCard data={data} rainfall={rainfall} cemadenAlerts={cemadenAlerts} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Boletins Card) */}
                    <div className="lg:col-span-4 h-full">
                        <BoletinsCard />
                    </div>
                </div>
            </div>

            <footer className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 mt-auto">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">SIGERD WEB INTERFACE</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Prefeitura Municipal de Santa Maria de Jetibá</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Version {APP_VERSION}</span>
                </div>
            </footer>
        </div >
    );
};


// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
    const navigate = useNavigate()
    const toast = useToast()

    // UI State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [rainfall, setRainfall] = useState(null)
    const [syncDetail, setSyncDetail] = useState({ total: 0, vistorias: 0, interdicoes: 0 })
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [cemadenAlerts, setCemadenAlerts] = useState([])
    const [viewMode, setViewMode] = useState('vistorias')
    const [chartMode, setChartMode] = useState('tipologia')
    const [mapFilter, setMapFilter] = useState('Todas')
    const [mapStyle, setMapStyle] = useState('street')
    const [climateLoading, setClimateLoading] = useState(true)
    const [pluvioLoading, setPluvioLoading] = useState(true)

    const statusInfo = useMemo(() => {
        if (climateLoading) {
            return {
                label: 'CONSULTANDO...',
                color: 'bg-slate-400',
                text: 'text-slate-500',
                bg: 'bg-slate-50',
                dot: 'bg-slate-400 animate-pulse',
                loading: true
            }
        }

        const inmet = data?.alerts || []
        const cemaden = cemadenAlerts || []
        const allAlerts = [...inmet, ...cemaden]

        // Default: Normal State
        let highest = 'NORMAL'
        let color = 'bg-emerald-500'
        let text = 'text-emerald-500'
        let bg = 'bg-emerald-50'
        let dot = 'bg-emerald-500'

        if (allAlerts.length > 0) {
            // Base Alert State
            highest = 'ATENÇÃO'
            color = 'bg-amber-500'
            text = 'text-amber-600'
            bg = 'bg-amber-50'
            dot = 'bg-amber-500'

            const severities = allAlerts.map(a => String(a.severidade || a.nivel || '').toLowerCase())

            if (severities.some(s => s.includes('grande') || s.includes('extremo') || s.includes('vermelho'))) {
                highest = 'G. PERIGO'
                color = 'bg-red-600'
                text = 'text-red-700'
                bg = 'bg-red-50'
                dot = 'bg-red-600'
            } else if (severities.some(s => s.includes('perigo') || s.includes('laranja') || s.includes('alerta'))) {
                highest = 'PERIGO'
                color = 'bg-orange-500'
                text = 'text-orange-600'
                bg = 'bg-orange-50'
                dot = 'bg-orange-500'
            }
        }

        return { label: highest, color, text, bg, dot }
    }, [data?.alerts, cemadenAlerts])

    // Responsive Switch Logic
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const load = async () => {
        try {
            const [pendingDetail, localVistorias, cachedVistorias, localOcorrencias] = await Promise.all([
                getPendingSyncCount().catch(() => ({ total: 0, vistorias: 0, interdicoes: 0 })),
                getAllVistoriasLocal().catch(() => []),
                getRemoteVistoriasCache().catch(() => []),
                getOcorrenciasLocal().catch(() => [])
            ]);

            const todayStr = new Date().toLocaleDateString('pt-BR');
            const todayOccurrences = localOcorrencias.filter(o => o.data_ocorrencia === todayStr).length;

            setSyncDetail(pendingDetail);
            const initialAllV = [...cachedVistorias, ...localVistorias];
            const initialAllO = localOcorrencias; // Ocorrencias mostly local for now or updated by api

            setData({
                vistorias: { stats: { total: initialAllV.length }, breakdown: processBreakdown(initialAllV), localidadeBreakdown: processLocalidadeBreakdown(initialAllV), locations: processLocations(initialAllV) },
                ocorrencias: { stats: { total: initialAllO.length, today: todayOccurrences }, breakdown: processBreakdown(initialAllO), localidadeBreakdown: processLocalidadeBreakdown(initialAllO), locations: processLocations(initialAllO) },
                stats: { totalVistorias: initialAllV.length, activeOccurrences: todayOccurrences, inmetAlertsCount: 0 },
                breakdown: processBreakdown(initialAllV),
                locations: processLocations(initialAllV),
                alerts: []
            });
            setLoading(false);

            // Refetch in background - IMPORTANT: Merge with existing states
            api.getDashboardData().then(dashResult => {
                if (dashResult) {
                    setData(prev => {
                        const merged = {
                            ...dashResult,
                            // Ensure local sync counts are preserved if API doesn't return them
                            syncDetail: prev?.syncDetail || pendingDetail
                        };
                        // Explicitly sync the count if it's missing or inconsistent
                        if (merged.alerts && (!merged.stats.inmetAlertsCount || merged.stats.inmetAlertsCount === 0)) {
                            merged.stats.inmetAlertsCount = merged.alerts.length;
                        }
                        return merged;
                    });
                }
            }).catch(() => { });

            // 4. Fetch Weather, Cemaden Rainfall & Alerts (Parallel & Persistent)
            const fetchClimate = async () => {
                setClimateLoading(true);
                try {
                    const lat = -20.0246, lon = -40.7464;
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
                    const r = await fetch(url);
                    if (r.ok) {
                        const d = await r.json();
                        setWeather({
                            current: {
                                temp: d.current.temperature_2m,
                                humidity: d.current.relative_humidity_2m,
                                rain: d.current.precipitation || 0,
                                code: d.current.weather_code,
                                wind: d.current.wind_speed_10m || 6
                            },
                            daily: d.daily.time.map((t, i) => ({
                                date: t,
                                tempMax: d.daily.temperature_2m_max[i],
                                tempMin: d.daily.temperature_2m_min[i],
                                rainProb: d.daily.precipitation_probability_max[i],
                                code: d.daily.weather_code[i]
                            }))
                        });
                    }
                } catch (e) { console.warn('[Weather] Fetch failed:', e); }

                try {
                    const alerts = await cemadenService.getActiveAlerts();
                    setCemadenAlerts(alerts || []);
                } catch (e) { console.warn('[Cemaden] Alerts failed:', e); }

                try {
                    setPluvioLoading(true);

                    // Fetch Manual Readings (SEDE) from DB
                    const manualReadings = await getManualReadings()
                    const now = new Date()
                    const getLatestForPeriod = (period, hours) => {
                        const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000)
                        const relevant = manualReadings.filter(r =>
                            (r.period === period || (!r.period && period === '1h')) &&
                            new Date(r.date) > windowStart &&
                            new Date(r.date) <= now
                        )
                        return relevant.length > 0 ? parseFloat(relevant[0].volume) : 0
                    }

                    const manualAcc24h = getLatestForPeriod('24h', 24)
                    const manualStation = {
                        id: 'SEDE_DEFESA_CIVIL',
                        name: 'SEDE DEFESA CIVIL (Manual)',
                        rainRaw: manualAcc24h,
                    }

                    const res = await fetch('/api/pluviometros')
                    let apiData = []
                    if (res.ok) {
                        apiData = await res.json()
                    }

                    const formattedApi = apiData.map(st => ({
                        id: st.id,
                        name: st.name,
                        rainRaw: st.acc24hr || 0,
                    }))

                    const combined = [manualStation, ...formattedApi].map(station => {
                        let level = 'Normal';
                        const acc24 = station.rainRaw;
                        if (acc24 >= 80) level = 'Extremo';
                        else if (acc24 >= 50) level = 'Alerta';
                        else if (acc24 >= 30) level = 'Atenção';

                        return { ...station, level }
                    }).filter(station => parseFloat(station.rainRaw) > 0);

                    setRainfall(combined);
                } catch (e) {
                    console.warn('[Pluviometros] Fetch failed, using fallback:', e);
                    const rain = await cemadenService.getRainfallData();
                    setRainfall(rain || []);
                } finally {
                    setPluvioLoading(false);
                }

                // Fallback direct INMET fetch if data.alerts is empty
                try {
                    const inmetResp = await fetch('https://apiprevmet3.inmet.gov.br/avisos/municipio/3204559');
                    if (inmetResp.ok) {
                        const inmetData = await inmetResp.json();
                        if (Array.isArray(inmetData) && inmetData.length > 0) {
                            setData(prev => ({ ...prev, alerts: inmetData }));
                        }
                    }
                } catch (e) { console.warn('[INMET] Direct catch failed:', e); }

                setClimateLoading(false);
            };

            fetchClimate();

        } catch (error) {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleSync = async () => {
        if (syncing) return
        setSyncing(true)
        toast.info('Sincronizando...', 'Comunicando com o servidor central.')
        try {
            await pullAllData();
            await syncPendingData()
            const [newData, newDetail] = await Promise.all([api.getDashboardData(), getPendingSyncCount()])
            setData(newData)
            setSyncDetail(newDetail)
            toast.success('Sincronizado', 'Dados atualizados com sucesso.')
        } catch (error) {
            toast.error('Erro', 'Falha na comunicação.')
        } finally {
            setSyncing(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('Apagar vistorias locais?')) return
        await resetDatabase();
        window.location.reload();
    }

    const handleExportKML = () => {
        if (!data?.locations?.length) return alert('Sem dados.');
        let kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${data.locations.map(loc => `<Placemark><name>${loc.risk}</name><Point><coordinates>${loc.lng},${loc.lat},0</coordinates></Point></Placemark>`).join('')}</Document></kml>`
        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'vistorias.kml'; link.click();
    }

    const getWeatherIcon = (code) => {
        if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️'; if (code <= 67) return '🌦️'; return '⛈️';
    }

    const handleGenerateReport = async (hours = 0) => {
        try {
            setGeneratingReport(true);
            const labels = {
                24: 'Últimas 24 Horas',
                48: 'Últimas 48 Horas',
                72: 'Últimas 72 Horas',
                96: 'Últimas 96 Horas',
                0: 'Todo o Período'
            }
            const label = labels[hours] || 'Todo o Período';

            // Filter context based on viewMode
            const sourceData = viewMode === 'vistorias' ? data.vistorias : data.ocorrencias;
            let finalLocations = sourceData.locations || [];

            if (hours > 0) {
                const limitDate = new Date();
                limitDate.setHours(limitDate.getHours() - hours);
                finalLocations = finalLocations.filter(loc => {
                    if (!loc.date) return false;
                    return new Date(loc.date) >= limitDate;
                });
            }

            // Recalculate Breakdown
            const colorPalette = {
                'Geológico / Geotécnico': '#f97316',
                'Risco Geológico': '#f97316',
                'Hidrológico': '#3b82f6',
                'Inundação': '#3b82f6',
                'Alagamento': '#60a5fa',
                'Inundação/Alagamento': '#3b82f6',
                'Enxurrada': '#2563eb',
                'Estrutural': '#94a3b8',
                'Estrutural/Predial': '#94a3b8',
                'Ambiental': '#10b981',
                'Tecnológico': '#f59e0b',
                'Climático / Meteorológico': '#0ea5e9',
                'Infraestrutura Urbana': '#6366f1',
                'Sanitário': '#f43f5e',
                'Deslizamento': '#f97316',
                'Vendaval': '#0284c7',
                'Granizo': '#818cf8',
                'Incêndio': '#ef4444',
                'Outros': '#94a3b8'
            };

            const counts = {};
            finalLocations.forEach(loc => {
                const cat = loc.risk || 'Outros';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const finalBreakdown = Object.keys(counts).map(catLabel => ({
                label: catLabel,
                count: counts[catLabel],
                percentage: finalLocations.length > 0 ? Math.round((counts[catLabel] / finalLocations.length) * 100) : 0,
                color: colorPalette[catLabel] || '#94a3b8'
            })).sort((a, b) => b.count - a.count);

            const reportData = {
                stats: {
                    totalVistorias: finalLocations.length,
                    activeOccurrences: data.stats?.activeOccurrences || 0
                },
                breakdown: finalBreakdown,
                locations: finalLocations
            };

            // Fetch Humanitarian Data for complete report
            const [shelters, occupants, inventory] = await Promise.all([
                getShelters().catch(() => []),
                getOccupants().catch(() => []),
                getInventory().catch(() => [])
            ]);
            const humanitarianData = { shelters, occupants, inventory };

            // Generate report with current dashboard data
            await generateSituationalReport(reportData, weather, rainfall || [], humanitarianData, label, null, false, viewMode);

            setShowReportMenu(false);
            toast.success('Pronto!', 'Relatório gerado.');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Erro', 'Erro ao gerar relatório.');
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 dark:bg-slate-900">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-slate-600 dark:text-slate-300">Carregando Inteligência...</span>
        </div>
    )

    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Erro ao carregar dados.</div>

    // Sub-component Props
    const commonProps = {
        data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
        handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
        showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
        viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle,
        chartMode, setChartMode
    };

    return (
        <>
            {isMobile ? <MobileDashboardView {...commonProps} /> : <WebViewDashboardView {...commonProps} />}

            {/* Global Modals */}
            {showForecast && weather && (
                <div onClick={() => setShowForecast(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Previsão Local</h3>
                            <button onClick={() => setShowForecast(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {weather.daily?.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{getWeatherIcon(day.code)}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-300">{Math.round(day.tempMax)}° <span className="text-slate-400 font-normal">/ {Math.round(day.tempMin)}°</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {generatingReport && (
                <div className="fixed inset-0 z-[200] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Gerando Relatório...</span>
                </div>
            )}

            {/* Menu de Relatórios para WebView */}
            {showReportMenu && (
                <div onClick={() => setShowReportMenu(false)} className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Emitir Relatório</h3>
                            <button onClick={() => setShowReportMenu(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Últimas 24 Horas', value: 24 },
                                { label: 'Últimas 48 Horas', value: 48 },
                                { label: 'Últimas 72 Horas', value: 72 },
                                { label: 'Últimas 96 Horas', value: 96 },
                                { label: 'Todo o Período', value: 0 },
                            ].map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleGenerateReport(opt.value)}
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700/50 hover:bg-blue-50 hover:text-blue-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 transition-colors flex justify-between items-center group"
                                >
                                    <span>{opt.label}</span>
                                    <FileText size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
};

export default Dashboard;