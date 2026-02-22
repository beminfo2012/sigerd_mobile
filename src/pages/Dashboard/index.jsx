import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronRight, CloudRain, Map, ArrowLeft, Activity, BarChart3, CloudUpload, CheckCircle, Download, Trash2, FileText, Printer, Flame, Zap, ShieldAlert, ChevronDown, ChevronUp, Truck, Home, Share2, RefreshCw, Plus, Users, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import { getPendingSyncCount, syncPendingData, getAllVistoriasLocal, getRemoteVistoriasCache, pullAllData, resetDatabase } from '../../services/db'
import { generateSituationalReport } from '../../utils/situationalReportGenerator'
import { cemadenService } from '../../services/cemaden'
import { getShelters, getOccupants, getGlobalInventory } from '../../services/shelterDb'
import CemadenAlertBanner from '../../components/CemadenAlertBanner'
import { useToast } from '../../components/ToastNotification'

// Helper functions for Lightning Load
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

    const defaultColors = ['bg-slate-300', 'bg-slate-400', 'bg-slate-50 dark:bg-slate-9000'];
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
                lat,
                lng,
                risk: category,
                details: subtypes.length > 0 ? subtypes.join(', ') : category,
                date: v.created_at || v.data_hora || new Date().toISOString()
            }
        })
        .filter(loc => loc !== null) || [];
};

const Dashboard = () => {
    console.log('[Dashboard] Component mounting...');
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [syncDetail, setSyncDetail] = useState({ total: 0 })
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [cemadenAlerts, setCemadenAlerts] = useState([])
    const toast = useToast()

    useEffect(() => {
        console.log('[Dashboard] useEffect running - starting data load...');
        const load = async () => {
            try {
                // [LIGHTNING LOAD - STEP 1] Load Local/Cached data immediately to show UI
                console.log('[Dashboard] Lightning Load: Fetching local/cached data...');
                const [pendingDetail, localVistorias, cachedVistorias] = await Promise.all([
                    getPendingSyncCount().catch(() => ({ total: 0 })),
                    getAllVistoriasLocal().catch(() => []),
                    getRemoteVistoriasCache().catch(() => [])
                ]);

                setSyncDetail(pendingDetail);

                // Initial processing with what we have
                const initialAll = [...cachedVistorias, ...localVistorias];
                const initialStats = {
                    totalVistorias: initialAll.length,
                    activeOccurrences: 0,
                    inmetAlertsCount: 0
                };

                // Process initial breakdown and locations...
                const initialBreakdown = processBreakdown(initialAll);
                const initialLocations = processLocations(initialAll);

                setData({
                    stats: initialStats,
                    breakdown: initialBreakdown,
                    locations: initialLocations,
                    alerts: []
                });

                // [LIGHTNING LOAD - STEP 2] Release loading screen NOW
                setLoading(false);
                console.log('[Dashboard] Lightning Load: Local data displayed. Fetching server updates...');

                // [LIGHTNING LOAD - STEP 3] Fetch fresh data in background
                const safetyTimer = setTimeout(() => {
                    if (loading) setLoading(false);
                }, 5000);

                api.getDashboardData().then(dashResult => {
                    clearTimeout(safetyTimer);
                    if (dashResult && dashResult.stats?.totalVistorias > 0) {
                        console.log('[Dashboard] Lightning Load: Server data received. Updating UI...');
                        setData(dashResult);
                    } else if (dashResult) {
                        console.warn('[Dashboard] Server returned 0 vistorias. Keeping local data for stability.');
                        // Still update alerts even if vistorias are missing
                        setData(prev => ({ ...prev, alerts: dashResult.alerts }));
                    }
                }).catch(err => {
                    clearTimeout(safetyTimer);
                    console.warn('[Dashboard] Background refresh failed:', err);
                });

                // [LIGHTNING LOAD - STEP 4] Secondary data also in background
                Promise.all([
                    (async () => {
                        try {
                            const r = await fetch('/api/weather');
                            if (r.ok) return r.json();
                        } catch (_) { /* proxy not available */ }
                        // Fallback: fetch directly from Open-Meteo (works anywhere)
                        try {
                            const lat = -20.0246, lon = -40.7464;
                            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
                            const r2 = await fetch(url);
                            if (!r2.ok) return null;
                            const d = await r2.json();
                            return {
                                current: { temp: d.current.temperature_2m, humidity: d.current.relative_humidity_2m, rain: d.current.precipitation, wind: d.current.wind_speed_10m, code: d.current.weather_code },
                                daily: d.daily.time.map((t, i) => ({ date: t, tempMax: d.daily.temperature_2m_max[i], tempMin: d.daily.temperature_2m_min[i], rainProb: d.daily.precipitation_probability_max[i], code: d.daily.weather_code[i] }))
                            };
                        } catch (_) { return null; }
                    })(),
                    cemadenService.getActiveAlerts().catch(() => [])
                ]).then(([weatherRes, cemadenRes]) => {
                    if (weatherRes) setWeather(weatherRes)
                    if (cemadenRes) setCemadenAlerts(cemadenRes || [])
                });

                return; // Stop here, background promises handle the rest
            } catch (error) {
                console.error('Load Error:', error)
                setLoading(false)
            }
        }
        load()
    }, [])

    const getPredictiveInsights = () => {
        if (!data || !data.alerts || data.alerts.length === 0) return null;

        // 1. Identify active risks from alerts (using regex to avoid encoding issues)
        const activeRisks = [];
        data.alerts.forEach(alert => {
            const desc = (alert.descricao || alert.aviso_tipo || '').toLowerCase();

            // Mapping alerts keywords to system categories
            if (/chuva|alagamento|inunda|enxurrada/.test(desc)) {
                activeRisks.push('Hidrológico');
            }
            if (/deslizamento|encosta|geol|geot/.test(desc)) {
                activeRisks.push('Geológico / Geotécnico');
            }
            if (/vento|vendaval|granizo|tempestade|clim/.test(desc)) {
                activeRisks.push('Climático / Meteorológico');
            }
            if (/estrutural|predial|desabamento/.test(desc)) {
                activeRisks.push('Estrutural');
            }
        });

        if (activeRisks.length === 0) return null;

        // 2. Correlate with historical data (locations)
        const neighborhoodRisk = {};
        data.locations.forEach(loc => {
            // Check for risk match (normalized)
            const isMatch = activeRisks.some(r =>
                (loc.risk || '').toLowerCase().includes(r.split(' ')[0].toLowerCase().replace(/[^a-z]/g, ''))
            );

            if (isMatch) {
                const bairro = loc.bairro || 'Santa Maria de Jetibá';
                neighborhoodRisk[bairro] = (neighborhoodRisk[bairro] || 0) + 1;
            }
        });

        // 3. Sort and get top 3
        const topBairros = Object.entries(neighborhoodRisk)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));

        return {
            risks: [...new Set(activeRisks)],
            topBairros,
            severity: data.alerts[0].severidade || 'Alerta'
        };
    };

    const predictive = getPredictiveInsights();

    useEffect(() => {
        const handleSyncComplete = () => {
            console.log('[Dashboard] Sync complete detected, reloading data...')
            window.location.reload()
        }

        window.addEventListener('sync-complete', handleSyncComplete)
        return () => window.removeEventListener('sync-complete', handleSyncComplete)
    }, [])

    // Cluster Detection for toggle
    let hasClusters = false;
    if (data && data.locations) {
        const clusters = {};
        data.locations.forEach(loc => {
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                const gridKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
                clusters[gridKey] = (clusters[gridKey] || 0) + 1;
            }
        });
        hasClusters = Object.values(clusters).some(count => count >= 2);
    }

    const handleSync = async () => {
        if (syncing) return
        setSyncing(true)
        const toastId = toast.info('Sincronizando...', 'Buscando novos dados e enviando pendências. Aguarde.');

        try {
            // 1. Pull new data from server first
            console.log('[Dashboard] Pulling data from server...');
            await pullAllData();

            // 2. Then push pending local data
            const result = await syncPendingData()

            // 3. Refresh Dashboard UI
            const [newData, newDetail] = await Promise.all([
                api.getDashboardData(),
                getPendingSyncCount()
            ])
            setData(newData)
            setSyncDetail(newDetail)

            if (result.success && result.count > 0) {
                toast.success('Sincronização Concluída', `${result.count} registros enviados.`);
            } else {
                toast.success('Dados Atualizados', 'O sistema está sincronizado com a nuvem.');
            }
        } catch (error) {
            console.error('Sync Error:', error)
            toast.error('Erro na Sincronização', 'Verifique sua conexão e tente novamente.');
        } finally {
            setSyncing(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('⚠️ AVISO: Isso irá apagar TODAS as vistorias do seu celular (mesmo as pendentes) e resetar a base de dados local. Use apenas se o gráfico estiver com erro. Continuar?')) return

        try {
            setLoading(true)
            await resetDatabase()
            alert('Banco de dados resetado com sucesso! Reiniciando...')
            window.location.reload()
        } catch (e) {
            console.error('Reset failed:', e)
            await clearLocalData().catch(() => { })
            window.location.reload()
        }
    }

    const handleExportKML = () => {
        if (!data || !data.locations || data.locations.length === 0) {
            alert('Não há dados de localização para exportar.')
            return
        }

        let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Vistorias Defesa Civil</name>
    <description>Localização das vistorias registradas</description>
    ${data.locations.map((loc, i) => `
    <Placemark>
      <name>Vistoria ${i + 1}</name>
      <description>Risco: ${loc.risk}</description>
      <Point>
        <coordinates>${loc.lng},${loc.lat},0</coordinates>
      </Point>
    </Placemark>
    `).join('')}
  </Document>
</kml>`

        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `vistorias_${new Date().toISOString().split('T')[0]}.kml`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const getWeatherIcon = (code) => {
        if (code <= 1) return '☀️'
        if (code <= 3) return '⛅'
        if (code <= 48) return '🌫️'
        if (code <= 67) return '🌧️'
        if (code <= 77) return '❄️'
        if (code <= 82) return '🌧️'
        return '⛈️'
    }

    // Safety timeout - if loading for more than 10 seconds, something is wrong
    useEffect(() => {
        if (loading) {
            const timeout = setTimeout(() => {
                console.error('[Dashboard] STUCK IN LOADING STATE FOR 10+ SECONDS!');
                alert('⚠️ Dashboard travado no carregamento!\n\nO dashboard não conseguiu carregar os dados.\n\nPossíveis causas:\n- Erro na API\n- Dados corrompidos\n- Problema de rede\n\nVeja o console (F12) para mais detalhes.');
            }, 10000);
            return () => clearTimeout(timeout);
        }
    }, [loading]);

    console.log('[Dashboard] Render - loading:', loading, 'data:', !!data);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold">Carregando SIGERD...</span>
            <span className="text-sm text-gray-500">Se demorar muito, pressione F12 e veja o console</span>
        </div>
    )

    if (!data) {
        console.error('[Dashboard] NO DATA - returning error message');
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 font-bold text-xl mb-4">❌ Erro ao carregar dados do Dashboard</div>
                <div className="text-gray-600 mb-4">O dashboard não conseguiu carregar os dados necessários.</div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                    Recarregar Página
                </button>
            </div>
        )
    }

    console.log('[Dashboard] Rendering main content with data:', data);


    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto p-5 pb-24 lg:p-8">

                {/* 1. Weather Widget (Responsive) */}
                {weather?.current && (
                    <div
                        onClick={() => setShowForecast(true)}
                        className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all hover:bg-white/60 dark:hover:bg-slate-800/60 mb-6 lg:mb-8"
                    >
                        <div className="flex items-center gap-6">
                            <div className="text-5xl lg:text-6xl">{getWeatherIcon(weather.current.code)}</div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{Math.round(weather.current.temp || 0)}</span>
                                    <span className="text-xl font-bold text-slate-400">°C</span>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Santa Maria de Jetibá</div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 lg:gap-8 items-center">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-white/50 dark:bg-slate-700/50 px-3 py-2 rounded-2xl">
                                <CloudRain size={16} className="text-blue-500" />
                                <span>{weather.daily?.[0]?.rainProb || 0}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-white/50 dark:bg-slate-700/50 px-3 py-2 rounded-2xl">
                                <Timer size={16} className="text-blue-400" />
                                <span>{weather.current.humidity || 0}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-white/50 dark:bg-slate-700/50 px-3 py-2 rounded-2xl">
                                <BarChart3 size={16} className="text-orange-400" />
                                <span>{Math.round(weather.current.wind || 0)} km/h</span>
                            </div>
                        </div>
                    </div>
                )}

                <CemadenAlertBanner alerts={cemadenAlerts} />

                {/* 2. Main Layout (Mobile: Stacked | Desktop: Grid) */}
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">

                    {/* Left Column (Main Content on Desktop | Full Width on Mobile) */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                        {/* Indicators Grid (Mobile layout restored) */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Indicadores Operacionais</h2>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider -mt-1">Santa Maria de Jetibá</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSync}
                                        disabled={syncing}
                                        className={`p-2.5 rounded-xl transition-all ${syncing ? 'bg-blue-100 text-blue-600 animate-spin' : 'bg-slate-200/50 text-gray-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {/* Sync Card */}
                                <div
                                    onClick={handleSync}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 relative transition-all cursor-pointer active:scale-95 group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                        {syncing ? <CloudUpload size={20} className="animate-bounce" /> : <CloudUpload size={20} />}
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1 tabular-nums">
                                        {(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? (syncDetail.vistorias + syncDetail.interdicoes) : '100%'}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">Sincronização</div>
                                    {((syncDetail.total > 0) || (data.stats.totalVistorias > 0)) && !syncing && (
                                        <button onClick={(e) => { e.stopPropagation(); handleClearCache(); }} className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={10} /> Limpar Cache
                                        </button>
                                    )}
                                </div>

                                {/* INMET Alerts */}
                                <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all">
                                    <div className="bg-orange-50 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                                        <Zap size={20} />
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1 leading-none tabular-nums">
                                        {data.stats.inmetAlertsCount || 0}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">Avisos INMET</div>
                                </div>

                                {/* Total Inspections - Hidden on Mobile */}
                                <div className="hidden md:block bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                                        <ClipboardList size={20} />
                                    </div>
                                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1 tabular-nums">
                                        {data.stats.totalVistorias}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">Vistorias Totais</div>
                                </div>
                            </div>
                        </div>

                        {/* Circular Icons - Mobile Only Section */}
                        <div className="lg:hidden mb-12">
                            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6 px-1 uppercase tracking-widest">Acesso Rápido</h2>
                            <div className="grid grid-cols-4 gap-2 px-1 justify-items-center">
                                {/* Monitoramento */}
                                <div onClick={() => navigate('/monitoramento')} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-[#2a5299] active:scale-95 transition-all">
                                        <BarChart3 size={28} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">Monitoramento</span>
                                </div>

                                {/* ASSIST. HUMANITÁRIA */}
                                <div onClick={() => navigate('/abrigos')} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-[#2a5299] active:scale-95 transition-all">
                                        <Home size={28} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">Assist. Humanitária</span>
                                </div>

                                {/* Ocorrências */}
                                <div onClick={() => navigate('/ocorrencias')} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-[#2a5299] active:scale-95 transition-all">
                                        <ClipboardList size={28} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">Ocorrências</span>
                                </div>

                                {/* Relatórios */}
                                <div className="flex flex-col items-center gap-2.5 relative">
                                    <div onClick={() => setShowReportMenu(!showReportMenu)} className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center text-[#2a5299] active:scale-95 transition-all cursor-pointer">
                                        <FileText size={28} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight">Relatórios</span>
                                    {showReportMenu && (
                                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {[24, 48, 96, 0].map(h => (
                                                <button key={h} className="w-full text-left px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setShowReportMenu(false)}>
                                                    {h === 0 ? 'Todo o Período' : `Últimas ${h}h`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Panel (Mobile: Visible | Desktop: Hidden, handled by sidebar) */}
                        <div className="lg:hidden bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-[2px]">Resumo Situacional</h3>
                            <div className="space-y-6">
                                {data?.breakdown?.map((item, idx) => (
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

                        {/* Map Section (Responsive) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Mapa Situacional</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Distribuição Geográfica</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate('/monitoramento')} className="bg-orange-50 text-orange-600 p-2 rounded-xl transition-colors" title="Mapa de Calor">
                                        <Flame size={16} />
                                    </button>
                                    <button onClick={handleExportKML} className="bg-slate-100 text-slate-600 p-2 rounded-xl" title="Exportar KML">
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="h-96 w-full rounded-[24px] overflow-hidden bg-slate-100 relative z-0 border border-slate-100">
                                <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <HeatmapLayer points={data?.locations || []} show={true} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                                    {data?.locations?.map((loc, idx) => (
                                        <CircleMarker
                                            key={idx}
                                            center={[loc.lat, loc.lng]}
                                            radius={6}
                                            pathOptions={{
                                                color: '#ffffff',
                                                weight: 1.5,
                                                fillColor: String(loc.risk).includes('Alto') ? '#ef4444' : '#f97316',
                                                fillOpacity: 0.8
                                            }}
                                        />
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Sidebar - Desktop Only) */}
                    <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-8">

                        {/* Quick Access (Desktop Card Style) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-[2px]">Ações do Sistema</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => navigate('/monitoramento')} className="flex flex-col items-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-blue-500 transition-all group">
                                    <BarChart3 className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Monitoramento</span>
                                </button>
                                <button onClick={() => navigate('/ocorrencias')} className="flex flex-col items-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-blue-500 transition-all group">
                                    <ClipboardList className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Ocorrências</span>
                                </button>
                                <button onClick={() => navigate('/abrigos')} className="flex flex-col items-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-blue-500 transition-all group">
                                    <Home className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assist. Humanitária</span>
                                </button>
                                <div className="relative">
                                    <button onClick={() => setShowReportMenu(!showReportMenu)} className="w-full flex flex-col items-center p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-transparent hover:border-blue-500 transition-all group">
                                        <FileText className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Relatórios</span>
                                    </button>
                                    {showReportMenu && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1">
                                            {[24, 48, 96, 0].map(h => (
                                                <button key={h} className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 uppercase" onClick={() => setShowReportMenu(false)}>
                                                    {h === 0 ? 'Tudo' : `${h}h`}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Panel (Desktop Sidebar) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-[2px]">Resumo Situacional</h3>
                            <div className="space-y-6">
                                {data?.breakdown?.map((item, idx) => (
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
                    </aside>
                </div>

                {/* Footer */}
                <div className="mt-16 mb-8 flex flex-col items-center">
                    <div className="h-px w-24 bg-slate-200 dark:bg-slate-800 mb-8" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">SIGERD WEB V1.2.0</span>
                </div>
            </div>

            {/* Global Modals */}
            {showForecast && weather && (
                <div onClick={() => setShowForecast(false)} className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Previsão 7 Dias</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Santa Maria de Jetibá</p>
                            </div>
                            <button onClick={() => setShowForecast(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {weather.daily?.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent hover:border-slate-100 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{getWeatherIcon(day.code)}</div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400">{day.rainProb}% chuva</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-800 dark:text-slate-100">{Math.round(day.tempMax)}°</div>
                                        <div className="text-[10px] font-bold text-slate-300">{Math.round(day.tempMin)}°</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {generatingReport && (
                <div className="fixed inset-0 z-[200] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Gerando Relatório Situacional...</span>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
