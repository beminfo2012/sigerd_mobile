import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronRight, CloudRain, Map, ArrowLeft, Activity, CloudUpload, CheckCircle, Download, Trash2, FileText, Printer, Flame, Zap, ShieldAlert, ChevronDown, ChevronUp, Truck, Home } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import { getPendingSyncCount, syncPendingData, getAllVistoriasLocal, clearLocalData, resetDatabase } from '../../services/db'
import { generateSituationalReport } from '../../utils/situationalReportGenerator'

const Dashboard = () => {
    console.log('[Dashboard] Component mounting...');
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [syncCount, setSyncCount] = useState(0)
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)

    useEffect(() => {
        console.log('[Dashboard] useEffect running - starting data load...');
        const load = async () => {
            try {
                console.log('[Dashboard] Fetching pending sync count...');
                const pendingCount = await getPendingSyncCount().catch(() => 0)
                setSyncCount(pendingCount)

                const [dashResult, weatherResult] = await Promise.all([
                    api.getDashboardData().catch(err => {
                        console.warn('Supabase fetch failed, showing local data only:', err)
                        return null
                    }),
                    fetch('/api/weather').then(r => r.ok ? r.json() : null).catch(() => null)
                ])

                let finalData = dashResult || {
                    stats: { totalVistorias: 0, activeOccurrences: 0, inmetAlertsCount: 0 },
                    breakdown: [],
                    locations: []
                }

                const localVistorias = await getAllVistoriasLocal().catch(err => {
                    console.error('[Dashboard] Error loading local vistorias:', err);
                    return [];
                });

                // Filter out any corrupted vistorias that might crash the app
                const validVistorias = localVistorias.filter(v => {
                    try {
                        // Basic validation - must have essential fields
                        if (!v) return false;

                        // If has coordinates, they must be valid
                        if (v.coordenadas) {
                            if (!v.coordenadas.includes(',')) {
                                console.warn('[Dashboard] Skipping vistoria with invalid coordinates (no comma):', v.vistoriaId || v.id);
                                return false;
                            }
                            const parts = v.coordenadas.split(',');
                            const lat = parseFloat(parts[0]);
                            const lng = parseFloat(parts[1]);
                            if (isNaN(lat) || isNaN(lng)) {
                                console.warn('[Dashboard] Skipping vistoria with NaN coordinates:', v.vistoriaId || v.id);
                                return false;
                            }
                        }

                        return true;
                    } catch (err) {
                        console.error('[Dashboard] Error validating vistoria:', v, err);
                        return false;
                    }
                });

                console.log(`[Dashboard] Loaded ${localVistorias.length} local vistorias, ${validVistorias.length} valid`);

                if (!dashResult) {
                    const total = validVistorias.length
                    const counts = {}
                    validVistorias.forEach(v => {
                        const cat = v.categoriaRisco || v.categoria_risco || 'Outros'
                        counts[cat] = (counts[cat] || 0) + 1
                    })

                    // Color palette for distinct categories
                    const colorPalette = {
                        'Geológico / Geotécnico': 'bg-orange-500',
                        'Risco Geológico': 'bg-orange-500',
                        'Hidrológico': 'bg-blue-500',
                        'Inundação/Alagamento': 'bg-blue-500',
                        'Estrutural': 'bg-slate-400',
                        'Estrutural/Predial': 'bg-slate-400',
                        'Ambiental': 'bg-emerald-500',
                        'Tecnológico': 'bg-amber-500',
                        'Climático / Meteorológico': 'bg-sky-500',
                        'Infraestrutura Urbana': 'bg-indigo-500',
                        'Sanitário': 'bg-rose-500',
                        'Outros': 'bg-slate-400',
                        // Legacy/Simplified keys support
                        'Deslizamento': 'bg-orange-500',
                        'Alagamento': 'bg-blue-500',
                        'Inundação': 'bg-blue-500',
                        'Enxurrada': 'bg-blue-400',
                        'Vendaval': 'bg-sky-500',
                        'Granizo': 'bg-sky-400',
                        'Incêndio': 'bg-red-500'
                    };
                    const defaultColors = ['bg-orange-500', 'bg-blue-500', 'bg-slate-400', 'bg-emerald-500'];

                    const totalOccurrences = total
                    finalData.stats.totalVistorias = total
                    finalData.breakdown = Object.keys(counts).map((label, idx) => ({
                        label,
                        count: counts[label],
                        percentage: totalOccurrences > 0 ? Math.round((counts[label] / totalOccurrences) * 100) : 0,
                        color: colorPalette[label] || defaultColors[idx % defaultColors.length]
                    })).sort((a, b) => b.count - a.count)

                    finalData.locations = validVistorias
                        .filter(v => (v.coordenadas && v.coordenadas.includes(',')) || (v.latitude && v.longitude))
                        .map(v => {
                            let lat, lng
                            if (v.coordenadas && v.coordenadas.includes(',')) {
                                const parts = v.coordenadas.split(',')
                                lat = parseFloat(parts[0])
                                lng = parseFloat(parts[1])
                            } else {
                                lat = parseFloat(v.latitude)
                                lng = parseFloat(v.longitude)
                            }

                            if (isNaN(lat) || isNaN(lng)) return null

                            const cat = v.categoriaRisco || v.categoria_risco || 'Local'
                            const subtypes = v.subtiposRisco || v.subtipos_risco || []
                            return {
                                lat,
                                lng,
                                risk: cat,
                                details: subtypes.length > 0 ? subtypes.join(', ') : cat,
                                date: v.created_at || v.data_hora || new Date().toISOString()
                            }
                        })
                        .filter(loc => loc !== null)
                } else {
                    const unsynced = validVistorias.filter(v => v.synced === false || v.synced === undefined || v.synced === 0)

                    unsynced.forEach(v => {

                        let lat, lng
                        let hasCoords = false

                        if (v.coordenadas && v.coordenadas.includes(',')) {
                            const parts = v.coordenadas.split(',')
                            lat = parseFloat(parts[0])
                            lng = parseFloat(parts[1])
                            hasCoords = true
                        } else if (v.latitude && v.longitude) {
                            lat = parseFloat(v.latitude)
                            lng = parseFloat(v.longitude)
                            hasCoords = true
                        }

                        if (hasCoords && !isNaN(lat) && !isNaN(lng)) {
                            const cat = v.categoriaRisco || v.categoria_risco || 'Pendente'
                            const subtypes = v.subtiposRisco || v.subtipos_risco || []
                            finalData.locations.push({
                                lat,
                                lng,
                                risk: cat,
                                details: subtypes.length > 0 ? subtypes.join(', ') : cat,
                                date: v.created_at || v.data_hora || new Date().toISOString()
                            })
                        }

                        const cat = v.categoriaRisco || v.categoria_risco || 'Outros'
                        const existing = finalData.breakdown.find(b => b.label.toLowerCase() === cat.toLowerCase())
                        if (existing) {
                            existing.count++
                        } else {
                            // Define colorPalette here too for the remote branch
                            const colorPalette = {
                                'Geológico / Geotécnico': 'bg-orange-500',
                                'Risco Geológico': 'bg-orange-500',
                                'Hidrológico': 'bg-blue-500',
                                'Inundação/Alagamento': 'bg-blue-500',
                                'Estrutural': 'bg-slate-400',
                                'Estrutural/Predial': 'bg-slate-400',
                                'Ambiental': 'bg-emerald-500',
                                'Tecnológico': 'bg-amber-500',
                                'Climático / Meteorológico': 'bg-sky-500',
                                'Infraestrutura Urbana': 'bg-indigo-500',
                                'Sanitário': 'bg-rose-500',
                                'Outros': 'bg-slate-400'
                            };
                            finalData.breakdown.push({
                                label: cat,
                                count: 1,
                                percentage: 0,
                                color: colorPalette[cat] || 'bg-slate-300'
                            })
                        }
                    })

                    finalData.stats.totalVistorias = (finalData.stats.totalVistorias || 0) + unsynced.length

                    const totalOccurrences = finalData.breakdown.reduce((acc, b) => acc + b.count, 0)
                    finalData.breakdown.forEach(b => {
                        b.percentage = totalOccurrences > 0 ? Math.round((b.count / totalOccurrences) * 100) : 0
                    })
                    finalData.breakdown.sort((a, b) => b.count - a.count)
                }

                if (finalData.stats.totalVistorias === 0) {
                    finalData.breakdown = []
                } else {
                    // Final Color Enforcement - Overwrite any colors from API
                    const masterPalette = {
                        'Geológico / Geotécnico': 'bg-orange-500',
                        'Risco Geológico': 'bg-orange-500',
                        'Hidrológico': 'bg-blue-500',
                        'Inundação': 'bg-blue-500',
                        'Alagamento': 'bg-blue-500',
                        'Inundação/Alagamento': 'bg-blue-500',
                        'Estrutural': 'bg-slate-400',
                        'Estrutural/Predial': 'bg-slate-400',
                        'Ambiental': 'bg-emerald-500',
                        'Tecnológico': 'bg-amber-500',
                        'Climático / Meteorológico': 'bg-sky-500',
                        'Infraestrutura Urbana': 'bg-indigo-500',
                        'Sanitário': 'bg-rose-500',
                        'Outros': 'bg-slate-400',
                        'Deslizamento': 'bg-orange-500'
                    };

                    finalData.breakdown = finalData.breakdown.map(item => ({
                        ...item,
                        color: masterPalette[item.label] || item.color || 'bg-slate-300'
                    }));
                }
                setWeather(weatherResult)
                setData(finalData)
            } catch (error) {
                console.error('Load Error:', error)
            } finally {
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
        if (syncCount === 0 || syncing) return
        setSyncing(true)
        try {
            const result = await syncPendingData()
            if (result.success) {
                const [newData, newCount] = await Promise.all([
                    api.getDashboardData(),
                    getPendingSyncCount()
                ])
                setData(newData)
                setSyncCount(newCount)
                alert(`${result.count} vistorias sincronizadas com sucesso!`)
            }
        } catch (e) {
            console.error('Sync failed:', e)
            alert('Erro ao sincronizar dados.')
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
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Weather Widget */}
            {weather?.current && (
                <div
                    onClick={() => setShowForecast(true)}
                    className="mb-8 bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="text-5xl">{getWeatherIcon(weather.current.code)}</div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800 tabular-nums">{Math.round(weather.current.temp || 0)}</span>
                                <span className="text-xl font-bold text-slate-400">°C</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Santa Maria de Jetibá</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <CloudRain size={14} className="text-blue-500" />
                            <span>Chuva: {weather.daily?.[0]?.rainProb || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Timer size={14} className="text-slate-400" />
                            <span>Umidade: {weather.current.humidity || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Activity size={14} className="text-slate-400" />
                            <span>Vento: {Math.round(weather.current.wind || 0)} km/h</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Indicadores Operacionais</h1>
                <div className="flex items-center gap-1 bg-slate-200/50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500">
                    <Calendar size={14} />
                    <span>Hoje</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div
                    onClick={handleSync}
                    className={`bg-white p-5 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative transition-all ${syncCount > 0 ? 'cursor-pointer active:scale-95 hover:bg-orange-50/30' : ''}`}
                >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${syncCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        {syncing ? (
                            <CloudUpload size={20} strokeWidth={2.5} className="animate-bounce" />
                        ) : (
                            syncCount > 0 ? <CloudUpload size={20} strokeWidth={2.5} /> : <CheckCircle size={20} strokeWidth={2.5} />
                        )}
                    </div>
                    {syncCount > 0 ? (
                        <div className={`absolute top-5 right-5 bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100 ${syncing ? 'animate-pulse' : ''}`}>
                            {syncing ? 'Sincronizando...' : 'Pendente'}
                        </div>
                    ) : (
                        <div className="absolute top-5 right-5 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">OK</div>
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none tabular-nums">
                        {syncCount > 0 ? syncCount : '100%'}
                    </div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">
                        {syncing ? 'Enviando...' : (syncCount > 0 ? 'Clique para Sincronizar' : 'Sincronizado')}
                    </div>
                    {/* Reset Button - Always available if something exists locally */}
                    {((syncCount > 0) || (data.stats.totalVistorias > 0) || (data.breakdown.length > 0)) && !syncing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClearCache(); }}
                            className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1 active:opacity-50"
                        >
                            <Trash2 size={10} />
                            Limpar Dados Locais
                        </button>
                    )}
                </div>

                <div
                    onClick={() => navigate('/alerts')}
                    className="bg-white p-5 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative cursor-pointer active:scale-95 transition-all hover:bg-slate-50"
                >
                    <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-600 mb-3">
                        <AlertTriangle size={20} strokeWidth={2.5} />
                    </div>
                    {data.stats.inmetAlertsCount > 0 && (
                        <div className="absolute top-5 right-5 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                            {data.stats.inmetAlertsCount} Alertas
                        </div>
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none tabular-nums">{data.stats.activeOccurrences}</div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">Avisos</div>
                </div>
            </div>

            {/* Quick Access - Circular Icons */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-slate-600 mb-4 px-1">Acesso Rápido</h2>
                <div className="flex gap-8 overflow-x-auto pb-2 px-1 scrollbar-hide">
                    {/* Pluviômetros */}
                    <div
                        onClick={() => navigate('/pluviometros')}
                        className="flex flex-col items-center gap-2.5 cursor-pointer flex-shrink-0"
                    >
                        <div className="w-16 h-16 bg-white rounded-full shadow-[0_4px_20px_rgba(42,82,153,0.12)] flex items-center justify-center text-[#2a5299] active:scale-95 transition-all hover:shadow-[0_6px_25px_rgba(42,82,153,0.18)]">
                            <CloudRain size={28} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight max-w-[80px]">Pluviômetros</span>
                    </div>

                    {/* Abrigos */}
                    <div
                        onClick={() => navigate('/abrigos')}
                        className="flex flex-col items-center gap-2.5 cursor-pointer flex-shrink-0"
                    >
                        <div className="w-16 h-16 bg-white rounded-full shadow-[0_4px_20px_rgba(42,82,153,0.12)] flex items-center justify-center text-[#2a5299] active:scale-95 transition-all hover:shadow-[0_6px_25px_rgba(42,82,153,0.18)]">
                            <Home size={28} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight max-w-[80px]">Abrigos</span>
                    </div>

                    {/* Relatórios */}
                    <div className="flex flex-col items-center gap-2.5 flex-shrink-0 relative">
                        <div
                            onClick={() => setShowReportMenu(!showReportMenu)}
                            className="w-16 h-16 bg-white rounded-full shadow-[0_4px_20px_rgba(42,82,153,0.12)] flex items-center justify-center text-[#2a5299] active:scale-95 transition-all hover:shadow-[0_6px_25px_rgba(42,82,153,0.18)] cursor-pointer"
                        >
                            <FileText size={28} strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight text-center leading-tight max-w-[80px]">Relatórios</span>

                        {/* Dropdown Menu */}
                        {showReportMenu && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                {[
                                    { label: 'Últimas 24h', hours: 24 },
                                    { label: 'Últimas 48h', hours: 48 },
                                    { label: 'Últimas 96h', hours: 96 },
                                    { label: 'Todo o Período', hours: 0 }
                                ].map((opt) => (
                                    <button
                                        key={opt.hours}
                                        onClick={async () => {
                                            setShowReportMenu(false);
                                            setGeneratingReport(true);
                                            try {
                                                // 1. Filter Data by timeframe
                                                const filteredData = { ...data };
                                                let timeframeLabel = opt.label;

                                                if (opt.hours > 0) {
                                                    const threshold = new Date();
                                                    threshold.setHours(threshold.getHours() - opt.hours);

                                                    // Update locations
                                                    filteredData.locations = data.locations.filter(l => {
                                                        const d = new Date(l.date);
                                                        return d >= threshold;
                                                    });

                                                    // Recalculate breakdown for the selected timeframe
                                                    const counts = {};
                                                    filteredData.locations.forEach(l => {
                                                        const cat = l.risk || 'Outros';
                                                        counts[cat] = (counts[cat] || 0) + 1;
                                                    });

                                                    const total = filteredData.locations.length;
                                                    filteredData.breakdown = Object.keys(counts).map((label) => ({
                                                        label,
                                                        count: counts[label],
                                                        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
                                                    })).sort((a, b) => b.count - a.count);

                                                    // Update stats for report
                                                    filteredData.stats = {
                                                        ...data.stats,
                                                        totalVistorias: total,
                                                    };
                                                }

                                                // 2. Fetch fresh Pluviometer data
                                                let pluvioData = [];
                                                try {
                                                    const res = await fetch('/api/pluviometros');
                                                    if (res.ok) pluvioData = await res.json();
                                                } catch (e) {
                                                    console.warn("Failed to fetch pluvio for report", e);
                                                }

                                                // 3. Capture Map Element
                                                const mapElement = document.querySelector('.leaflet-container');

                                                // 4. Generate PDF
                                                await generateSituationalReport(filteredData, weather, pluvioData, mapElement, timeframeLabel);

                                            } catch (e) {
                                                console.error(e);
                                                alert("Erro ao gerar relatório.");
                                            } finally {
                                                setGeneratingReport(false);
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                    >
                                        {opt.label}
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Predictive Intelligence Insight - Slim Version */}
            {predictive && (
                <div
                    className="bg-white p-4 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 mb-5 flex items-center justify-between border-l-4 border-l-indigo-500 active:scale-[0.98] transition-all cursor-default"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 w-11 h-11 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                            <ShieldAlert size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-indigo-500 mb-0.5 uppercase tracking-widest flex items-center gap-1">
                                <Zap size={10} fill="currentColor" /> Previsão de Impacto
                            </div>
                            <div className="text-sm font-black text-slate-800 leading-tight">
                                {predictive.topBairros.length > 0
                                    ? predictive.topBairros.map(b => b.name).join(', ')
                                    : 'Alerta para todo o município'}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Baseado no histórico de vistorias</div>
                        </div>
                    </div>
                    <div className="bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center text-slate-200">
                        <Activity size={14} />
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 relative">
                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="font-bold text-slate-800 text-sm">Vistorias por Tipologia</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Tempo Real</span>
                        <button
                            onClick={() => {
                                const csvContent = "data:text/csv;charset=utf-8,"
                                    + "Tipologia;Quantidade;Porcentagem\n"
                                    + data.breakdown.map(e => `${e.label};${e.count};${e.percentage}%`).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `sigerd_stats_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Exportar CSV"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {data?.breakdown?.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline mb-2 px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.color || 'bg-slate-300'}`} />
                                    <span className="text-xs font-bold text-slate-500">{item.label || 'Outros'}</span>
                                </div>
                                <div className="text-xs font-black text-slate-800 tabular-nums">
                                    {item.percentage || 0}% <span className="text-slate-300 font-bold ml-1">{item.count || 0}</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-3 p-0.5 border border-slate-100 shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-slate-300'}`} style={{ width: `${item.percentage || 0}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Mapa de Concentração</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ocorrências Atuais</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/monitoramento')}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 p-2 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Flame size={16} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">MAPA DE CALOR</span>
                        </button>
                        <div className="relative">
                            <button
                                id="btn-report-mini"
                                onClick={() => setShowReportMenu(!showReportMenu)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Printer size={16} />
                                <span className="text-[10px] font-black uppercase tracking-tighter">RELATÓRIO</span>
                            </button>

                            {showReportMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {[
                                        { label: 'Últimas 24h', hours: 24 },
                                        { label: 'Últimas 48h', hours: 48 },
                                        { label: 'Últimas 96h', hours: 96 },
                                        { label: 'Todo o Período', hours: 0 }
                                    ].map((opt) => (
                                        <button
                                            key={opt.hours}
                                            onClick={async () => {
                                                setShowReportMenu(false);
                                                setGeneratingReport(true);
                                                try {
                                                    // 1. Filter Data by timeframe
                                                    const filteredData = { ...data };
                                                    let timeframeLabel = opt.label;

                                                    if (opt.hours > 0) {
                                                        const threshold = new Date();
                                                        threshold.setHours(threshold.getHours() - opt.hours);

                                                        // Update locations
                                                        filteredData.locations = data.locations.filter(l => {
                                                            const d = new Date(l.date);
                                                            return d >= threshold;
                                                        });

                                                        // Recalculate breakdown for the selected timeframe
                                                        const counts = {};
                                                        filteredData.locations.forEach(l => {
                                                            const cat = l.risk || 'Outros';
                                                            counts[cat] = (counts[cat] || 0) + 1;
                                                        });

                                                        const total = filteredData.locations.length;
                                                        filteredData.breakdown = Object.keys(counts).map((label) => ({
                                                            label,
                                                            count: counts[label],
                                                            percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
                                                            // color will be inherited or doesn't matter much for the PDF table/list
                                                        })).sort((a, b) => b.count - a.count);

                                                        // Update stats for report
                                                        filteredData.stats = {
                                                            ...data.stats,
                                                            totalVistorias: total,
                                                        };
                                                    }

                                                    // 2. Fetch fresh Pluviometer data
                                                    let pluvioData = [];
                                                    try {
                                                        const res = await fetch('/api/pluviometros');
                                                        if (res.ok) pluvioData = await res.json();
                                                    } catch (e) {
                                                        console.warn("Failed to fetch pluvio for report", e);
                                                    }

                                                    // 3. Capture Map Element
                                                    const mapElement = document.querySelector('.leaflet-container');

                                                    // 4. Generate PDF
                                                    await generateSituationalReport(filteredData, weather, pluvioData, mapElement, timeframeLabel);

                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Erro ao gerar relatório.");
                                                } finally {
                                                    setGeneratingReport(false);
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between"
                                        >
                                            {opt.label}
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {generatingReport && (
                                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
                                    <div className="bg-white p-8 rounded-[32px] shadow-2xl text-center max-w-xs w-full animate-in zoom-in duration-300">
                                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                                        <h3 className="text-lg font-black text-slate-800 mb-2">Gerando Relatório</h3>
                                        <p className="text-sm text-slate-500 font-medium">Compilando dados e capturando mapa...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleExportKML}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">KML</span>
                        </button>
                    </div>
                </div>
                <div className="h-72 w-full rounded-[24px] overflow-hidden bg-slate-100 relative z-0 border border-slate-100 shadow-inner">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <HeatmapLayer points={data.locations} show={true} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                        {data?.locations?.map((loc, idx) => {
                            const isHighRisk = String(loc.risk || '').includes('Alto');
                            return (
                                <CircleMarker
                                    key={idx}
                                    center={[loc.lat, loc.lng]}
                                    radius={8}
                                    pathOptions={{
                                        color: '#ffffff',
                                        weight: 2,
                                        fillColor: isHighRisk ? '#ef4444' : '#f97316',
                                        fillOpacity: 1,
                                        stroke: true
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center">
                                            <div className="font-bold text-slate-800 mb-1">{loc.risk || 'Local'}</div>
                                            <div className="text-sm text-slate-600">{loc.details || ''}</div>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>



            {
                showForecast && weather && (
                    <div
                        onClick={() => setShowForecast(false)}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-200"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Previsão 7 Dias</h3>
                                    <div className="text-xs font-bold text-slate-400">Santa Maria de Jetibá</div>
                                </div>
                                <button
                                    onClick={() => setShowForecast(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {weather.daily.map((day, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl">{getWeatherIcon(day.code || day.weatherCode)}</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <CloudRain size={10} className="text-blue-500" />
                                                    {day.rainProb}% chance
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-800">{Math.round(day.tempMax)}°</div>
                                                <div className="text-[10px] font-bold text-slate-400">Max</div>
                                            </div>
                                            <div className="h-8 w-px bg-slate-100" />
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-400">{Math.round(day.tempMin)}°</div>
                                                <div className="text-[10px] font-bold text-slate-300">Min</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="flex flex-col items-center w-full mt-12 mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">SIGERD MOBILE V1.2.0</span>
            </div>
        </div >
    )
}

export default Dashboard
