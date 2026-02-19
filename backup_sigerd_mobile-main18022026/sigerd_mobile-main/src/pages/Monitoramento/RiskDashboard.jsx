import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Filter, Map as MapIcon, BarChart3, PieChart as PieIcon, RefreshCw, XCircle, Home, AlertTriangle, CloudRain, Droplets } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import 'leaflet/dist/leaflet.css'

// Import consolidated data and services
import residencesRiskData from '../../data/residences_risk.json'
import { cemadenService } from '../../services/cemaden'

// Custom marker for Cemaden stations
const createCemadenIcon = (level) => {
    const colors = {
        'Extremo': '#dc2626',
        'Alerta': '#f97316',
        'Atenção': '#fbbf24',
        'Normal': '#3b82f6'
    }
    const color = colors[level] || '#3b82f6'

    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: scale(1.1);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c.7 0 1.3-.2 1.8-.7s.7-1.1.7-1.8c0-1.3-1-2.4-2.3-2.5C17.2 10.3 14.2 8 10.5 8 7.3 8 4.6 10.1 3.7 13c-1.5.3-2.7 1.6-2.7 3.2 0 1.8 1.5 3.3 3.3 3.3h13.2"></path></svg>
               </div>`,
        className: 'custom-div-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    })
}

const RiskDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [rainStations, setRainStations] = useState([])
    const [lastUpdate, setLastUpdate] = useState(new Date())

    // Filters
    const [selectedBairro, setSelectedBairro] = useState('Todos')
    const [selectedRisk, setSelectedRisk] = useState('Todos')
    const [selectedSeverity, setSelectedSeverity] = useState('Todos')
    const [showFilters, setShowFilters] = useState(false)

    // Colors
    const COLORS = {
        'Geológico': '#f97316', // orange-500
        'Hidrológico': '#3b82f6', // blue-500
        'Muito Alto': '#b91c1c', // red-700
        'Alto': '#ef4444', // red-500
        'Médio': '#f59e0b', // amber-500
        'Baixo': '#10b981', // emerald-500
        'Default': '#94a3b8'
    }

    const PIE_COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [data, selectedBairro, selectedRisk, selectedSeverity])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load residences data
            setData(residencesRiskData)

            // Load rainfall data
            const rainfall = await cemadenService.getRainfallData()
            if (rainfall) {
                setRainStations(rainfall)
            }
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = data;
        if (selectedBairro !== 'Todos') {
            result = result.filter(v => v.bairro === selectedBairro)
        }
        if (selectedRisk !== 'Todos') {
            result = result.filter(v => v.tipo === selectedRisk)
        }
        if (selectedSeverity !== 'Todos') {
            result = result.filter(v => v.severidade === selectedSeverity)
        }
        setFilteredData(result)
    }

    // Derived Data for Charts
    const stats = useMemo(() => {
        const typeDistribution = {}
        const severityDistribution = {}
        const neighborhoodRisk = {}

        filteredData.forEach(v => {
            typeDistribution[v.tipo] = (typeDistribution[v.tipo] || 0) + 1
            severityDistribution[v.severidade] = (severityDistribution[v.severidade] || 0) + 1
            neighborhoodRisk[v.bairro] = (neighborhoodRisk[v.bairro] || 0) + 1
        })

        // Find max rainfall
        const maxRain = rainStations.length > 0
            ? Math.max(...rainStations.map(s => s.rainRaw))
            : 0

        return {
            total: filteredData.length,
            critical: (severityDistribution['Muito Alto'] || 0) + (severityDistribution['Alto'] || 0),
            maxRain: maxRain.toFixed(1),
            geoCount: typeDistribution['Geológico'] || 0,
            hidroCount: typeDistribution['Hidrológico'] || 0,
            typeChart: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
            severityChart: Object.entries(severityDistribution).map(([name, value]) => ({ name, value })),
            neighborhoodChart: Object.entries(neighborhoodRisk)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
        }
    }, [filteredData, rainStations])

    const bairros = useMemo(() => ['Todos', ...new Set(data.map(v => v.bairro).filter(Boolean).sort())], [data])
    const tipos = useMemo(() => ['Todos', ...new Set(data.map(v => v.tipo).filter(Boolean).sort())], [data])
    const severidades = ['Todos', 'Muito Alto', 'Alto', 'Médio', 'Baixo']

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-600">Sincronizando Inteligência...</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest text-center">Residências + Cemaden</span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Painel de Riscos</h1>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider truncate">
                                Monitoramento em Tempo Real
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl transition-all active:scale-95 ${showFilters || selectedBairro !== 'Todos' || selectedRisk !== 'Todos' || selectedSeverity !== 'Todos' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                    <button onClick={loadData} className="p-2 bg-slate-100 rounded-xl text-slate-500 active:rotate-180 transition-all">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Filters Area */}
            {showFilters && (
                <div className="bg-white border-b border-slate-200 p-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Bairro</label>
                                <select
                                    value={selectedBairro}
                                    onChange={e => setSelectedBairro(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {bairros.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Severidade</label>
                                <select
                                    value={selectedSeverity}
                                    onChange={e => setSelectedSeverity(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {severidades.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tipo de Risco</label>
                            <select
                                value={selectedRisk}
                                onChange={e => setSelectedRisk(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    {(selectedBairro !== 'Todos' || selectedRisk !== 'Todos' || selectedSeverity !== 'Todos') && (
                        <button
                            onClick={() => { setSelectedBairro('Todos'); setSelectedRisk('Todos'); setSelectedSeverity('Todos'); }}
                            className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors border border-red-100"
                        >
                            <XCircle size={14} /> Limpar Filtros
                        </button>
                    )}
                </div>
            )}

            <main className="p-4 space-y-6">

                {/* KPI Cards Row 1 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-lg border border-blue-400/20">
                        <div className="flex justify-between items-start mb-2">
                            <Home className="text-white/60" size={16} />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.total}</div>
                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Imóveis Mapeados</div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <CloudRain className="text-blue-500" size={16} />
                            {stats.maxRain > 50 && (
                                <div className="text-[8px] font-black text-orange-500 animate-bounce">ATENÇÃO</div>
                            )}
                        </div>
                        <div className="text-2xl font-black text-slate-800">{stats.maxRain}<span className="text-sm ml-0.5">mm</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Max Acumulado 24h</div>
                    </div>
                </div>

                {/* KPI Cards Row 2 */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <AlertTriangle className="text-red-500" size={16} />
                            <div className="text-[9px] font-black text-red-500">ALTO RISCO</div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">{stats.critical}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nível Crítico</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm flex-1 flex flex-col justify-center">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Geológico</div>
                            <div className="text-lg font-black text-orange-500 leading-none">{stats.geoCount}</div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm flex-1 flex flex-col justify-center">
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Hidrológico</div>
                            <div className="text-lg font-black text-blue-500 leading-none">{stats.hidroCount}</div>
                        </div>
                    </div>
                </div>

                {/* Main Charts Section */}
                <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <PieIcon className="text-blue-500" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Distribuição por Tipologia</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Categorias do Plano Municipal</p>
                        </div>
                    </div>
                    <div className="h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.typeChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={3}
                                >
                                    {stats.typeChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Section - The most important part for correlation */}
                <div className="bg-white p-1 rounded-[32px] border border-slate-100 shadow-lg overflow-hidden ring-4 ring-slate-100">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <MapIcon className="text-emerald-500" size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Mapa Dinâmico</h3>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Residências + Chuva</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                {filteredData.length} PONTOS
                            </div>
                            <div className="text-[8px] font-bold text-slate-300 mt-1 uppercase">
                                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <div className="h-[450px] w-full rounded-b-[30px] overflow-hidden relative z-0">
                        {filteredData.length > 0 && filteredData[0].lat ? (
                            <MapContainer
                                center={[filteredData[0].lat, filteredData[0].lon]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />

                                {/* 1. Rendering Residences Risk Markers */}
                                {filteredData.slice(0, 1000).map((v, i) => (
                                    <CircleMarker
                                        key={`risk-${i}`}
                                        center={[v.lat, v.lon]}
                                        radius={5}
                                        pathOptions={{
                                            color: '#fff',
                                            fillColor: COLORS[v.severidade] || COLORS[v.tipo] || '#3b82f6',
                                            fillOpacity: 0.85,
                                            weight: 1.5,
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-xs p-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[v.tipo] }}></span>
                                                    <strong className="text-sm text-slate-800 uppercase font-black tracking-tighter">{v.tipo}</strong>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-700 leading-tight">{v.logradouro}, {v.numero}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded inline-block">{v.bairro}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                                    <div className="flex items-center gap-1">
                                                        <ShieldAlert size={12} className={v.severidade === 'Muito Alto' ? 'text-red-600' : 'text-slate-400'} />
                                                        <span className={`text-[10px] font-black uppercase ${v.severidade === 'Muito Alto' || v.severidade === 'Alto' ? 'text-red-600' : 'text-slate-500'}`}>
                                                            Risco: {v.severidade}
                                                        </span>
                                                    </div>
                                                </div>
                                                {v.descricao && (
                                                    <p className="mt-2 text-[9px] text-slate-400 leading-tight italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                        "{v.descricao}"
                                                    </p>
                                                )}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}

                                {/* 2. Rendering Cemaden Station Markers */}
                                {rainStations.map(station => (
                                    station.lat && (
                                        <Marker
                                            key={`rain-${station.id}`}
                                            position={[station.lat, station.lon]}
                                            icon={createCemadenIcon(station.level)}
                                        >
                                            <Popup minWidth={180}>
                                                <div className="p-2 text-center">
                                                    <div className="flex items-center justify-center gap-2 mb-2">
                                                        <CloudRain size={18} className="text-blue-500" />
                                                        <span className="font-black text-slate-800 text-sm uppercase">{station.name}</span>
                                                    </div>
                                                    <div className="bg-blue-50 py-3 rounded-2xl border border-blue-100 my-2">
                                                        <div className="text-3xl font-black text-blue-600 leading-none">{station.rain}</div>
                                                        <div className="text-[10px] font-bold text-blue-400 uppercase mt-1">Acumulado 24h</div>
                                                    </div>
                                                    <div className={`text-[10px] font-black uppercase py-1 rounded-full ${station.level === 'Extremo' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                        STATUS: {station.level}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                                                        ID Estação: {station.id}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}
                            </MapContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <RefreshCw size={48} className="animate-spin opacity-10 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-wider">Carregando mapa interativo...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Insights Section */}
                <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <BarChart3 className="text-purple-500" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Zonas de Atenção</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Bairros com maior concentração crítica</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.neighborhoodChart} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid horizontal={false} vertical={true} stroke="#f8fafc" strokeDasharray="3 3" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={90}
                                    tick={{ fontSize: 9, fontWeight: '900', fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 10, 10, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </main>

            <style>{`
                .leaflet-popup-content-wrapper {
                    background: #ffffff !important;
                    border-radius: 24px !important;
                    border: none !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    overflow: hidden !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    padding: 12px !important;
                }
                .leaflet-popup-tip {
                    background: #ffffff !important;
                }
                .recharts-tooltip-cursor {
                    fill: #f8fafc !important;
                }
                .custom-div-icon {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    )
}

export default RiskDashboard
