import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Filter, Map as MapIcon, BarChart3, PieChart as PieIcon, RefreshCw, XCircle, Home, AlertTriangle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import 'leaflet/dist/leaflet.css'

// Import consolidated data
import residencesRiskData from '../../data/residences_risk.json'

const RiskDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [filteredData, setFilteredData] = useState([])

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

    const loadData = () => {
        setLoading(true)
        try {
            setData(residencesRiskData)
        } catch (error) {
            console.error('Erro ao carregar dados de risco:', error)
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

        return {
            total: filteredData.length,
            critical: (severityDistribution['Muito Alto'] || 0) + (severityDistribution['Alto'] || 0),
            geoCount: typeDistribution['Geológico'] || 0,
            hidroCount: typeDistribution['Hidrológico'] || 0,
            typeChart: Object.entries(typeDistribution).map(([name, value]) => ({ name, value })),
            severityChart: Object.entries(severityDistribution).map(([name, value]) => ({ name, value })),
            neighborhoodChart: Object.entries(neighborhoodRisk)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
        }
    }, [filteredData])

    const bairros = useMemo(() => ['Todos', ...new Set(data.map(v => v.bairro).filter(Boolean).sort())], [data])
    const tipos = useMemo(() => ['Todos', ...new Set(data.map(v => v.tipo).filter(Boolean).sort())], [data])
    const severidades = ['Todos', 'Muito Alto', 'Alto', 'Médio', 'Baixo']

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-slate-600">Carregando Dados...</span>
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
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Monitoramento de Moradias
                        </p>
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

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-lg border border-blue-400/20">
                        <div className="flex justify-between items-start mb-2">
                            <Home className="text-white/60" size={16} />
                        </div>
                        <div className="text-2xl font-black text-white">{stats.total}</div>
                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Imóveis Mapeados</div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <AlertTriangle className="text-red-500" size={16} />
                            <div className="text-[9px] font-black text-red-500">ALTO RISCO</div>
                        </div>
                        <div className="text-2xl font-black text-slate-800">{stats.critical}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nível Crítico</div>
                    </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-tighter">Geológico</div>
                        <div className="text-lg font-black text-orange-500">{stats.geoCount}</div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                        <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-tighter">Hidrológico</div>
                        <div className="text-lg font-black text-blue-500">{stats.hidroCount}</div>
                    </div>
                </div>

                {/* Type Distribution Chart */}
                <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <PieIcon className="text-blue-500" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Tipologias de Risco</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Distribuição por Categoria</p>
                        </div>
                    </div>
                    <div className="h-56 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.typeChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={2}
                                >
                                    {stats.typeChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-bold text-slate-500 capitalize">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top 5 Localidades Chart */}
                <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <BarChart3 className="text-purple-500" size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Top 5 Localidades</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Bairros com maior incidência</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.neighborhoodChart} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid horizontal={false} vertical={true} stroke="#f1f5f9" strokeDasharray="3 3" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={90}
                                    tick={{ fontSize: 10, fontWeight: '800', fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Section */}
                <div className="bg-white p-1 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <MapIcon className="text-emerald-500" size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Geomapeamento</h3>
                                <p className="text-[10px] text-slate-400 font-medium">Visualização Espacial</p>
                            </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                            {filteredData.length} PONTOS
                        </div>
                    </div>
                    <div className="h-96 w-full rounded-b-[30px] overflow-hidden relative z-0">
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
                                {filteredData.slice(0, 1000).map((v, i) => (
                                    <CircleMarker
                                        key={i}
                                        center={[v.lat, v.lon]}
                                        radius={6}
                                        pathOptions={{
                                            color: '#fff',
                                            fillColor: COLORS[v.severidade] || COLORS[v.tipo] || '#3b82f6',
                                            fillOpacity: 0.85,
                                            weight: 2
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-xs p-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: COLORS[v.tipo] }}></span>
                                                    <strong className="text-sm text-slate-800">{v.tipo}</strong>
                                                </div>
                                                <p className="font-bold text-slate-700">{v.logradouro}, {v.numero}</p>
                                                <p className="text-slate-500">{v.bairro}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                                                        Grau: {v.severidade}
                                                    </span>
                                                </div>
                                                {v.descricao && (
                                                    <p className="mt-2 pt-2 border-t border-slate-100 italic text-[10px] text-slate-400">
                                                        {v.descricao}
                                                    </p>
                                                )}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <MapIcon size={48} className="opacity-10 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-wider">Nenhum dado geográfico encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            <style>{`
                .leaflet-popup-content-wrapper {
                    background: #ffffff !important;
                    border-radius: 16px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
                }
                .leaflet-popup-tip {
                    background: #ffffff !important;
                }
                .recharts-tooltip-cursor {
                    fill: #f8fafc !important;
                }
            `}</style>
        </div>
    )
}

export default RiskDashboard
