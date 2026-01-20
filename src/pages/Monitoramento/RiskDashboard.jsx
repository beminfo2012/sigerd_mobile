import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Filter, Map as MapIcon, BarChart3, PieChart as PieIcon, RefreshCw, XCircle } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import 'leaflet/dist/leaflet.css'
import { getAllVistoriasLocal } from '../../services/db'
import legacyRisks from '../../data/legacy_risks.json'

const RiskDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [vistorias, setVistorias] = useState([])
    const [filteredData, setFilteredData] = useState([])

    // Filters
    const [selectedBairro, setSelectedBairro] = useState('Todos')
    const [selectedRisk, setSelectedRisk] = useState('Todos')
    const [showFilters, setShowFilters] = useState(false)

    // Colors
    const COLORS = {
        'Alto': '#ef4444', // red-500
        'Muito Alto': '#b91c1c', // red-700
        'Médio': '#f97316', // orange-500
        'Baixo': '#eab308', // yellow-500
        'R5': '#7f1d1d', // red-900 (Desastre)
        'R4': '#ef4444',
        'R3': '#f97316',
        'R2': '#eab308',
        'R1': '#22c55e', // green-500
        'Geológico': '#f97316',
        'Hidrológico': '#3b82f6',
        'Estrutural': '#94a3b8',
        'Outros': '#cbd5e1'
    }

    const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#94a3b8'];

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [vistorias, selectedBairro, selectedRisk])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await getAllVistoriasLocal()

            // 1. Normalize Local Data (Has GPS)
            const normalizedLocal = data.map(v => ({
                ...v,
                lat: v.coordenadas ? parseFloat(v.coordenadas.split(',')[0]) : (v.latitude ? parseFloat(v.latitude) : null),
                lng: v.coordenadas ? parseFloat(v.coordenadas.split(',')[1]) : (v.longitude ? parseFloat(v.longitude) : null),
                bairro: v.bairro || 'Não Informado',
                risco: v.categoriaRisco || v.categoria_risco || 'Não Classificado',
                nivel: v.grauRisco || v.grau_risco || 'Não Avaliado',
                data: v.created_at || v.data_hora,
                source: 'App'
            })).filter(v => v.lat && v.lng && !isNaN(v.lat))

            // 2. Normalize Legacy Data (From CSV)
            const normalizedLegacy = legacyRisks.map((l, idx) => ({
                id: `leg_${l.id}_${idx}`,
                risco: l.risco,
                bairro: l.bairro,
                nivel: l.severidade,
                data: new Date().toISOString(),
                source: 'Planilha',
                lat: null,
                lng: null
            }));

            // 3. Merge Both
            const combined = [...normalizedLocal, ...normalizedLegacy];

            console.log(`Loaded ${normalizedLocal.length} local and ${normalizedLegacy.length} legacy records.`);
            setVistorias(combined)
        } catch (error) {
            console.error('Erro ao carregar vistorias:', error)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = vistorias;
        if (selectedBairro !== 'Todos') {
            result = result.filter(v => v.bairro === selectedBairro)
        }
        if (selectedRisk !== 'Todos') {
            result = result.filter(v => v.risco === selectedRisk)
        }
        setFilteredData(result)
    }

    // Derived Data for Charts
    const stats = useMemo(() => {
        const riskDistribution = {}
        const severityDistribution = {}

        filteredData.forEach(v => {
            // By Type
            riskDistribution[v.risco] = (riskDistribution[v.risco] || 0) + 1

            // By Severity
            const sev = v.nivel || 'N/A'
            severityDistribution[sev] = (severityDistribution[sev] || 0) + 1
        })

        return {
            total: filteredData.length,
            riskChart: Object.entries(riskDistribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
            severityChart: Object.entries(severityDistribution).map(([name, value]) => ({ name, value }))
        }
    }, [filteredData])

    // Unique options for dropdowns
    const bairros = useMemo(() => ['Todos', ...new Set(vistorias.map(v => v.bairro).filter(Boolean).sort())], [vistorias])
    const riscos = useMemo(() => ['Todos', ...new Set(vistorias.map(v => v.risco).filter(Boolean).sort())], [vistorias])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-slate-600">Carregando Dados...</span>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Painel de Riscos</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {filteredData.length} Ocorrências
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl transition-all active:scale-95 ${showFilters || selectedBairro !== 'Todos' || selectedRisk !== 'Todos' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-500'}`}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Bairro</label>
                            <select
                                value={selectedBairro}
                                onChange={e => setSelectedBairro(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {bairros.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Tipo de Risco</label>
                            <select
                                value={selectedRisk}
                                onChange={e => setSelectedRisk(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-bold focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                {riscos.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    {(selectedBairro !== 'Todos' || selectedRisk !== 'Todos') && (
                        <button
                            onClick={() => { setSelectedBairro('Todos'); setSelectedRisk('Todos'); }}
                            className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                            <XCircle size={14} /> Limpar Filtros
                        </button>
                    )}
                </div>
            )}

            <main className="p-4 space-y-6">

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Mapeado</div>
                        <div className="text-3xl font-black">{stats.total}</div>
                        <div className="text-[10px] font-bold mt-1 opacity-80">Imóveis em risco</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bairro + Afetado</div>
                        <div className="text-sm font-black text-slate-800 leading-tight">
                            {stats.riskChart.length > 0 ? filteredData.sort((a, b) => filteredData.filter(v => v.bairro === a.bairro).length - filteredData.filter(v => v.bairro === b.bairro).length).pop()?.bairro || 'N/A' : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="text-blue-600" size={20} />
                        <h3 className="font-bold text-slate-800">Distribuição por Tipologia</h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={stats.riskChart} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {stats.riskChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name.split(' ')[0]] || '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <PieIcon className="text-orange-500" size={20} />
                        <h3 className="font-bold text-slate-800">Severidade do Risco</h3>
                    </div>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.severityChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.severityChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Map Section */}
                <div className="bg-white p-1 rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 flex items-center gap-2">
                        <MapIcon className="text-emerald-600" size={20} />
                        <h3 className="font-bold text-slate-800">Geolocalização</h3>
                    </div>
                    <div className="h-80 w-full rounded-b-[20px] overflow-hidden relative z-0">
                        {filteredData.length > 0 && filteredData[0].lat ? (
                            <MapContainer
                                center={[filteredData[0].lat, filteredData[0].lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                {filteredData.map((v, i) => (
                                    <CircleMarker
                                        key={i}
                                        center={[v.lat, v.lng]}
                                        radius={6}
                                        pathOptions={{
                                            color: 'white',
                                            fillColor: COLORS[v.risco.split(' ')[0]] || COLORS[v.nivel] || '#3b82f6',
                                            fillOpacity: 0.8,
                                            weight: 2
                                        }}
                                    >
                                        <Popup>
                                            <div className="text-xs font-sans">
                                                <strong className="block text-sm mb-1">{v.risco}</strong>
                                                <p>{v.bairro}</p>
                                                <p className="text-slate-500 mt-1">{new Date(v.data).toLocaleDateString()}</p>
                                                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">{v.nivel}</span>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))}
                            </MapContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                <MapIcon size={48} className="opacity-20 mb-2" />
                                <p className="text-xs font-bold">Sem dados de GPS para os filtros atuais</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    )
}

export default RiskDashboard
