import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { ClipboardList, AlertTriangle, Timer, Calendar, ChevronRight, CloudRain, Map, ArrowLeft, Activity, CloudUpload, CheckCircle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getPendingSyncCount, syncPendingData } from '../../services/db'

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
                const [result, weatherResult, pendingCount] = await Promise.all([
                    api.getDashboardData(),
                    fetch('/api/weather').then(r => r.ok ? r.json() : null),
                    getPendingSyncCount()
                ])
                setData(result)
                setWeather(weatherResult)
                setSyncCount(pendingCount)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSync = async () => {
        if (syncCount === 0 || syncing) return

        setSyncing(true)
        try {
            const result = await syncPendingData()
            if (result.success) {
                // Reload dashboard data to reflect synced items
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

    const getWeatherIcon = (code) => {
        // WMO Weather interpretation codes
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

            {/* Header section */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-black text-gray-800 tracking-tight">Indicadores Operacionais</h1>
                <div className="flex items-center gap-1 bg-slate-200/50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500">
                    <Calendar size={14} />
                    <span>Hoje</span>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Sync Card (Health) */}
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
                        <div className="absolute top-5 right-5 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                            OK
                        </div>
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none tabular-nums">
                        {syncCount > 0 ? syncCount : '100%'}
                    </div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">
                        {syncing ? 'Enviando para nuvem...' : (syncCount > 0 ? 'Clique para Sincronizar' : 'Dados Sincronizados')}
                    </div>
                </div>

                {/* Ocorrências Card */}
                <div
                    onClick={() => navigate('/alerts')}
                    className="bg-white p-5 rounded-[24px] shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative cursor-pointer active:scale-95 transition-all hover:bg-slate-50"
                >
                    <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-600 mb-3">
                        <AlertTriangle size={20} strokeWidth={2.5} />
                    </div>
                    {data.stats.inmetAlertsCount > 0 ? (
                        <div className="absolute top-5 right-5 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                            {data.stats.inmetAlertsCount} Alertas INMET
                        </div>
                    ) : (
                        data.stats.activeOccurrencesDiff && (
                            <div className="absolute top-5 right-5 bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
                                +{data.stats.activeOccurrencesDiff} novas
                            </div>
                        )
                    )}
                    <div className="text-3xl font-black text-slate-800 mb-1 leading-none tabular-nums">{data.stats.activeOccurrences}</div>
                    <div className="text-xs font-bold text-slate-400 leading-tight">Avisos e Ocorrências</div>
                </div>
            </div>

            {/* Pluviômetros Card */}
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

            {/* Categories Breakdown */}
            <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="font-bold text-slate-800 text-sm">Vistorias por Tipologia</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Dados em Tempo Real</span>
                </div>

                <div className="space-y-6">
                    {data.breakdown && data.breakdown.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline mb-2 px-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.color.replace('bg-', 'bg-')}`} />
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

            {/* Map Section */}
            <div className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-bold text-slate-800 text-sm">Mapa de Concentração</h3>
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Map size={16} />
                    </div>
                </div>
                <div className="h-72 w-full rounded-[24px] overflow-hidden bg-slate-100 relative z-0 border border-slate-100 shadow-inner">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; CARTO'
                        />
                        {data.locations && data.locations.map((loc, idx) => (
                            <CircleMarker
                                key={idx}
                                center={[loc.lat, loc.lng]}
                                radius={8}
                                pathOptions={{
                                    color: loc.risk === 'Alto' ? '#ef4444' : '#f97316',
                                    fillColor: loc.risk === 'Alto' ? '#ef4444' : '#f97316',
                                    fillOpacity: 0.6,
                                    stroke: false
                                }}
                            />
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Forecast Modal */}
            {showForecast && weather && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-8 bg-blue-600 text-white relative">
                            <button onClick={() => setShowForecast(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <ArrowLeft size={20} className="rotate-90" />
                            </button>
                            <div className="text-center mb-6">
                                <div className="text-[10px] font-black uppercase tracking-[4px] opacity-70 mb-2">Previsão 7 Dias</div>
                                <h2 className="text-2xl font-black text-white">Santa Maria de Jetibá</h2>
                            </div>
                            <div className="flex justify-around items-center bg-white/10 rounded-[32px] p-6 backdrop-blur-md">
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🌡️</div>
                                    <div className="text-xs font-bold opacity-70">Máxima</div>
                                    <div className="text-lg font-black">{Math.round(weather.daily[0].tempMax)}°</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">💧</div>
                                    <div className="text-xs font-bold opacity-70">Chuva</div>
                                    <div className="text-lg font-black">{weather.daily[0].rainProb}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">💨</div>
                                    <div className="text-xs font-bold opacity-70">Vento</div>
                                    <div className="text-lg font-black">{Math.round(weather.current.wind)}<span className="text-[10px] ml-0.5">km/h</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                            {weather.daily.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-16">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {idx === 0 ? 'Hoje' : new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                                        </div>
                                        <div className="text-sm font-black text-slate-800">
                                            {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="text-2xl">{getWeatherIcon(day.code)}</div>
                                    <div className="flex gap-4 items-center w-24 justify-end">
                                        <div className="text-sm font-black text-slate-800">{Math.round(day.tempMax)}°</div>
                                        <div className="text-sm font-bold text-slate-300">{Math.round(day.tempMin)}°</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
