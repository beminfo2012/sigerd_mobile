import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronRight, CloudRain, Map, ArrowLeft, Activity, CloudUpload, CheckCircle, Download, Trash2 } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getPendingSyncCount, syncPendingData, getAllVistoriasLocal, clearLocalData, resetDatabase } from '../../services/db'

const Dashboard = () => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [syncCount, setSyncCount] = useState(0)
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
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

                const localVistorias = await getAllVistoriasLocal().catch(() => [])

                if (!dashResult) {
                    const total = localVistorias.length
                    const counts = {}
                    localVistorias.forEach(v => {
                        const cat = v.categoriaRisco || v.categoria_risco || 'Outros'
                        counts[cat] = (counts[cat] || 0) + 1
                    })

                    // Color palette for distinct categories
                    const colorPalette = {
                        'Deslizamento': 'bg-orange-500',
                        'Alagamento': 'bg-blue-500',
                        'Inundação': 'bg-cyan-500',
                        'Enxurrada': 'bg-teal-500',
                        'Vendaval': 'bg-gray-500',
                        'Granizo': 'bg-indigo-500',
                        'Incêndio': 'bg-red-500',
                        'Estrutural': 'bg-purple-500',
                        'Outros': 'bg-slate-400'
                    };
                    const defaultColors = ['bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-violet-500'];

                    const totalOccurrences = total
                    finalData.stats.totalVistorias = total
                    finalData.breakdown = Object.keys(counts).map((label, idx) => ({
                        label,
                        count: counts[label],
                        percentage: totalOccurrences > 0 ? Math.round((counts[label] / totalOccurrences) * 100) : 0,
                        color: colorPalette[label] || defaultColors[idx % defaultColors.length]
                    })).sort((a, b) => b.count - a.count)

                    finalData.locations = localVistorias.filter(v => v.coordenadas).map(v => {
                        const parts = v.coordenadas.split(',')
                        const cat = v.categoriaRisco || v.categoria_risco || 'Local'
                        const subtypes = v.subtiposRisco || v.subtipos_risco || []
                        return {
                            lat: parseFloat(parts[0]),
                            lng: parseFloat(parts[1]),
                            risk: cat,
                            details: subtypes.length > 0 ? subtypes.join(', ') : cat
                        }
                    })
                } else {
                    const unsynced = localVistorias.filter(v => v.synced === false || v.synced === undefined || v.synced === 0)

                    unsynced.forEach(v => {
                        if (v.coordenadas) {
                            const parts = v.coordenadas.split(',')
                            const cat = v.categoriaRisco || v.categoria_risco || 'Pendente'
                            const subtypes = v.subtiposRisco || v.subtipos_risco || []
                            finalData.locations.push({
                                lat: parseFloat(parts[0]),
                                lng: parseFloat(parts[1]),
                                risk: cat,
                                details: subtypes.length > 0 ? subtypes.join(', ') : cat
                            })
                        }

                        const cat = v.categoriaRisco || v.categoria_risco || 'Outros'
                        const existing = finalData.breakdown.find(b => b.label.toLowerCase() === cat.toLowerCase())
                        if (existing) {
                            existing.count++
                        } else {
                            finalData.breakdown.push({ label: cat, count: 1, percentage: 0, color: 'bg-slate-300' })
                        }
                    })

                    finalData.stats.totalVistorias = (finalData.stats.totalVistorias || 0) + unsynced.length

                    const totalOccurrences = finalData.breakdown.reduce((acc, b) => acc + b.count, 0)
                    finalData.breakdown.forEach(b => {
                        b.percentage = totalOccurrences > 0 ? Math.round((b.count / totalOccurrences) * 100) : 0
                    })
                    finalData.breakdown.sort((a, b) => b.count - a.count)
                }

                setWeather(weatherResult)
                if (finalData.stats.totalVistorias === 0) {
                    finalData.breakdown = []
                }
                setData(finalData)
            } catch (error) {
                console.error('Load Error:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        const handleSyncComplete = () => {
            console.log('[Dashboard] Sync complete detected, reloading data...')
            window.location.reload()
        }

        window.addEventListener('sync-complete', handleSyncComplete)
        return () => window.removeEventListener('sync-complete', handleSyncComplete)
    }, [])

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

    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen text-slate-400 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold">Carregando SIGERD...</span>
        </div>
    )
    if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>


    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            {/* Weather Widget */}
            {weather && (
                <div
                    onClick={() => setShowForecast(true)}
                    className="mb-8 bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="text-5xl">{getWeatherIcon(weather.current.code)}</div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800 tabular-nums">{Math.round(weather.current.temp)}</span>
                                <span className="text-xl font-bold text-slate-400">°C</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Santa Maria de Jetibá</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <CloudRain size={14} className="text-blue-500" />
                            <span>Chuva: {weather.daily[0].rainProb}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Timer size={14} className="text-slate-400" />
                            <span>Umidade: {weather.current.humidity}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Activity size={14} className="text-slate-400" />
                            <span>Vento: {Math.round(weather.current.wind)} km/h</span>
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
                    <div className="text-xs font-bold text-slate-400 leading-tight">Avisos e Ocorrências</div>
                </div>
            </div>

            <div
                onClick={() => navigate('/pluviometros')}
                className="bg-white p-5 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 mb-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-slate-50"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                        <CloudRain size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 mb-0.5 uppercase tracking-widest">Tempo Real</div>
                        <div className="text-xl font-black text-slate-800">Pluviômetros</div>
                        <div className="text-xs font-bold text-blue-600">Ver índices CEMADEN</div>
                    </div>
                </div>
                <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center text-slate-300">
                    <ChevronRight size={20} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="font-bold text-slate-800 text-sm">Vistorias por Tipologia</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Tempo Real</span>
                </div>

                <div className="space-y-6">
                    {data.breakdown.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline mb-2 px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                    <span className="text-xs font-bold text-slate-500">{item.label}</span>
                                </div>
                                <div className="text-xs font-black text-slate-800 tabular-nums">
                                    {item.percentage}% <span className="text-slate-300 font-bold ml-1">{item.count}</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-3 p-0.5 border border-slate-100 shadow-inner">
                                <div className={`h-full rounded-full transition-all duration-1000 ${item.color}`} style={{ width: `${item.percentage}%` }} />
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
                        {data.locations.map((loc, idx) => (
                            <CircleMarker
                                key={idx}
                                center={[loc.lat, loc.lng]}
                                radius={8}
                                pathOptions={{
                                    color: loc.risk.includes('Alto') ? '#ef4444' : '#f97316',
                                    fillColor: loc.risk.includes('Alto') ? '#ef4444' : '#f97316',
                                    fillOpacity: 0.6,
                                    stroke: false
                                }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <div className="font-bold text-slate-800 mb-1">{loc.risk}</div>
                                        <div className="text-sm text-slate-600">{loc.details}</div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {showForecast && weather && (
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
            )}

            <div className="text-center py-8 opacity-20 hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">SIGERD Mobile v1.1.4</span>
            </div>
        </div>
    )
}

export default Dashboard
