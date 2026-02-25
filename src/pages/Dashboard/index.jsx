import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import {
    ClipboardList, AlertTriangle, Timer, CloudRain, Map, BarChart3,
    CloudUpload, Trash2, FileText, Flame, Zap, RefreshCw, Home, X, Users,
    ShieldAlert, Activity, Droplets, MapPin, Gauge, CheckCircle, Layers
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import {
    getPendingSyncCount, syncPendingData, getAllVistoriasLocal,
    getRemoteVistoriasCache, pullAllData, resetDatabase
} from '../../services/db'
import { getOcorrenciasLocal } from '../../services/ocorrenciasDb'
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
        .filter(v => (v.coordenadas && String(v.coordenadas).includes(',')) || (v.latitude && v.longitude))
        .map(v => {
            let lat, lng;
            if (v.coordenadas && String(v.coordenadas).includes(',')) {
                const parts = String(v.coordenadas).split(',')
                lat = parseFloat(parts[0])
                lng = parseFloat(parts[1])
            } else if (v.latitude && v.longitude) {
                lat = parseFloat(v.latitude)
                lng = parseFloat(v.longitude)
            }
            if (isNaN(lat) || isNaN(lng)) return null
            const subtypes = v.subtipos_risco || v.subtiposRisco || []
            const category = v.categoria_risco || v.categoriaRisco || 'Outros'
            return {
                lat, lng, risk: category,
                details: subtypes.length > 0 ? subtypes.join(', ') : category,
                date: v.created_at || v.data_hora || new Date().toISOString()
            }
        })
        .filter(loc => loc !== null) || [];
};

// --- SUB-COMPONENT: MOBILE VIEW ---
const MobileDashboardView = ({
    data, weather, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast,
    showReportMenu, setShowReportMenu, getWeatherIcon, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle
}) => {
    const currentData = viewMode === 'vistorias' ? data.vistorias : data.ocorrencias;
    const filteredLocations = mapFilter === 'Todas' ? currentData.locations : currentData.locations.filter(l => l.risk === mapFilter);
    const typologies = ['Todas', ...currentData.breakdown.map(b => b.label)];
    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 font-sans">
            <div className="p-5 space-y-8">
                {/* 1. Weather Widget */}
                {weather?.current && (
                    <div
                        onClick={() => setShowForecast(true)}
                        className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all mb-4"
                    >
                        <div className="flex items-center gap-6">
                            <div className="text-5xl">{getWeatherIcon(weather.current.code)}</div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{Math.round(weather.current.temp || 0)}</span>
                                    <span className="text-xl font-bold text-slate-400">°C</span>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Santa Maria de Jetibá</div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                                <CloudRain size={15} className="text-blue-500 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">Chuva: <span className="font-bold">{weather.daily?.[0]?.rainProb || 0}%</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                                <Timer size={15} className="text-blue-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-300">Umidade: <span className="font-bold">{weather.current.humidity || 0}%</span></span>
                            </div>
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
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[2px] mb-6">{viewMode === 'vistorias' ? 'Vistorias' : 'Ocorrências'} por Tipologia</h3>
                    <div className="space-y-6">
                        {currentData?.breakdown?.slice(0, 5).map((item, idx) => (
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
                                            fillColor: String(loc.risk).includes('Alto') || String(loc.risk).includes('Crítico') || String(loc.risk).includes('Perigo') ? '#ef4444' : '#f97316',
                                            fillOpacity: 0.9,
                                            weight: 2
                                        }}
                                    >
                                        <Popup minWidth={180}>
                                            <div className="p-1">
                                                <div className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">{viewMode === 'vistorias' ? 'Vistoria' : 'Ocorrência'}</div>
                                                <div className="text-xs font-bold text-slate-800 mb-1">{loc.risk}</div>
                                                <div className="text-[11px] text-slate-500 leading-relaxed mb-2">{loc.details}</div>
                                                <div className="text-[9px] font-bold text-slate-400 italic uppercase">Data: {new Date(loc.date).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
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

// --- SUB-COMPONENT: WEB VIEW ---
const WebViewDashboardView = ({
    data, weather, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast,
    showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle
}) => {
    const currentData = viewMode === 'vistorias' ? (data.vistorias || data) : (data.ocorrencias || data);
    const filteredLocations = mapFilter === 'Todas' ? (currentData.locations || []) : (currentData.locations || []).filter(l => l.risk === mapFilter);
    const typologies = ['Todas', ...(currentData.breakdown || []).map(b => b.label)];
    return (
        <div className="bg-[#f0f2f5] dark:bg-slate-950 min-h-screen font-sans flex flex-col">
            <div className="max-w-[1700px] mx-auto w-full p-6 space-y-6 flex-1">

                {/* --- 🏁 1. HEADER & TOP CARDS CONTAINER --- */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6">

                    {/* Header: Title & Weather */}
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            Monitoramento em Tempo Real
                        </h2>
                        {weather?.current && (
                            <div className="flex items-center gap-4 py-1">
                                <div className="text-2xl">{getWeatherIcon(weather.current.code)}</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{Math.round(weather.current.temp || 0)}°C</div>
                                <div className="hidden xl:flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none italic">Localização</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Santa Maria de Jetibá</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top 4 Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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

                        {/* Card 2: Ocorrências Hoje */}
                        <div onClick={() => navigate('/ocorrencias')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-1 group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-500">
                                    <AlertTriangle size={20} />
                                </div>
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{data.stats.activeOccurrences}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2 text-center leading-none">Ocorrências Hoje</span>
                        </div>

                        {/* Card 3: INMET Alerts */}
                        <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl flex flex-col items-center justify-center gap-1 group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-500">
                                    <Zap size={20} />
                                </div>
                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{data.stats.inmetAlertsCount || 0}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2">Avisos INMET</span>
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
                    </div>

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
                                        radius={7}
                                        pathOptions={{
                                            color: mapStyle === 'street' ? '#fff' : '#3b82f6',
                                            fillColor: String(loc.risk).includes('Alto') || String(loc.risk).includes('Crítico') || String(loc.risk).includes('Perigo') ? '#ef4444' : '#f97316',
                                            fillOpacity: 0.9,
                                            weight: 2
                                        }}
                                    >
                                        <Popup minWidth={220}>
                                            <div className="p-2">
                                                <div className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">{viewMode === 'vistorias' ? 'Registro de Vistoria' : 'Registro de Ocorrência'}</div>
                                                <div className="text-sm font-black text-slate-800 mb-2">{loc.risk}</div>
                                                <div className="text-xs text-slate-500 leading-relaxed mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    {loc.details || 'Sem detalhes adicionais registrados.'}
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase italic">
                                                    <span>Santa Maria de Jetibá</span>
                                                    <span>{new Date(loc.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        </div>
                    </div>

                    {/* Resumo Situacional Column */}
                    <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-8 uppercase tracking-[3px] border-l-4 border-blue-600 pl-4">{viewMode === 'vistorias' ? 'Vistorias' : 'Ocorrências'} por Tipologia</h3>
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {currentData?.breakdown?.slice(0, 10).map((item, idx) => (
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
                    </div>
                </div>

                {/* --- 📉 3. BOTTOM SUMMARY ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sync Summary */}
                    <div onClick={handleSync} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 group cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl group-hover:scale-110 transition-transform ${syncing ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30'}`}>
                                <CheckCircle size={18} className={syncing ? 'animate-spin' : ''} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sincronização do Sistema</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">Atualizar</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] italic">Forçar sincronização</span>
                    </div>

                    {/* INMET Summary */}
                    <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 group cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-500 group-hover:scale-110 transition-transform">
                                <Zap size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Avisos INMET</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{data.stats.inmetAlertsCount || 0}</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] italic">Alertas Ativos</span>
                    </div>

                    {/* Vistorias Summary */}
                    <div onClick={() => navigate('/vistorias')} className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 group cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                                <ClipboardList size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vistorias</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{data.stats.totalVistorias}</div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] italic">Total Computado</span>
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
        </div>
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
    const [syncDetail, setSyncDetail] = useState({ total: 0, vistorias: 0, interdicoes: 0 })
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [cemadenAlerts, setCemadenAlerts] = useState([])
    const [viewMode, setViewMode] = useState('vistorias')
    const [mapFilter, setMapFilter] = useState('Todas')
    const [mapStyle, setMapStyle] = useState('street')

    const statusInfo = useMemo(() => {
        const inmet = data?.alerts || []
        const cemaden = cemadenAlerts || []

        // Default: Normal State
        let highest = 'NORMAL'
        let color = 'bg-emerald-500'
        let text = 'text-emerald-500'
        let bg = 'bg-emerald-50'
        let dot = 'bg-emerald-500'

        if (inmet.length > 0 || cemaden.length > 0) {
            // Base Alert State
            highest = 'ATENÇÃO'
            color = 'bg-amber-500'
            text = 'text-amber-600'
            bg = 'bg-amber-50'
            dot = 'bg-amber-500'

            const severities = inmet.map(a => String(a.severidade || '').toLowerCase())

            if (severities.some(s => s.includes('grande'))) {
                highest = 'G. PERIGO'
                color = 'bg-red-600'
                text = 'text-red-700'
                bg = 'bg-red-50'
                dot = 'bg-red-600'
            } else if (severities.some(s => s.includes('perigo')) || cemaden.length > 0) {
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
                vistorias: { stats: { total: initialAllV.length }, breakdown: processBreakdown(initialAllV), locations: processLocations(initialAllV) },
                ocorrencias: { stats: { total: initialAllO.length, today: todayOccurrences }, breakdown: processBreakdown(initialAllO), locations: processLocations(initialAllO) },
                stats: { totalVistorias: initialAllV.length, activeOccurrences: todayOccurrences, inmetAlertsCount: 0 },
                breakdown: processBreakdown(initialAllV),
                locations: processLocations(initialAllV),
                alerts: []
            });
            setLoading(false);

            // Refetch in background
            api.getDashboardData().then(dashResult => {
                if (dashResult) setData(dashResult);
            }).catch(() => { });

            // Fetch Weather & Cemaden
            Promise.all([
                (async () => {
                    try {
                        const lat = -20.0246, lon = -40.7464;
                        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_height_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
                        const r = await fetch(url);
                        if (!r.ok) return null;
                        const d = await r.json();
                        return {
                            current: { temp: d.current.temperature_2m, humidity: d.current.relative_humidity_2m, rain: d.current.precipitation || 0, code: d.current.weather_code },
                            daily: d.daily.time.map((t, i) => ({ date: t, tempMax: d.daily.temperature_2m_max[i], tempMin: d.daily.temperature_2m_min[i], rainProb: d.daily.precipitation_probability_max[i], code: d.daily.weather_code[i] }))
                        };
                    } catch (_) { return null; }
                })(),
                cemadenService.getActiveAlerts().catch(() => [])
            ]).then(([w, c]) => {
                if (w) setWeather(w)
                if (c) setCemadenAlerts(c)
            });

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

            // Generate report with current dashboard data
            await generateSituationalReport(data, weather, [], null, label);

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
        data, weather, cemadenAlerts, syncDetail, syncing, handleSync,
        handleClearCache, handleExportKML, navigate, setShowForecast,
        showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
        viewMode, setViewMode, mapFilter, setMapFilter, mapStyle, setMapStyle
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