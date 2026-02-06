import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, Calendar, Download, Users, ShieldAlert, Home, Activity, CheckCircle, Clock, Filter, Printer, Share2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getAllVistoriasLocal, getRemoteVistoriasCache, getAllInterdicoesLocal } from '../../services/db'
import { getOccupants } from '../../services/shelterDb'
import { generateManagementReport } from '../../utils/managementReportGenerator'

const ManagementDashboard = () => {
    const navigate = useNavigate()
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    const [loading, setLoading] = useState(true)
    const [allData, setAllData] = useState([])
    const [timeframe, setTimeframe] = useState('year') // 'month', 'quarter', 'year', 'all'
    const [showFilters, setShowFilters] = useState(false)

    const COLORS = ['#2a5299', '#f97316', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#6366f1']
    const RISK_COLORS = {
        'Muito Alto': '#b91c1c',
        'Alto': '#ef4444',
        'Médio': '#f59e0b',
        'Baixo': '#10b981',
        'Outros': '#94a3b8'
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [local, remote, interdicoes, occupants] = await Promise.all([
                getAllVistoriasLocal(),
                getRemoteVistoriasCache(),
                getAllInterdicoesLocal(),
                getOccupants()
            ])

            setAllData({
                vistorias: [...remote, ...local],
                interdicoes: interdicoes || [],
                occupants: occupants || []
            })
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = useMemo(() => {
        const now = new Date()
        const threshold = new Date()

        if (timeframe === 'month') threshold.setMonth(now.getMonth() - 1)
        else if (timeframe === 'quarter') threshold.setMonth(now.getMonth() - 3)
        else if (timeframe === 'year') threshold.setFullYear(now.getFullYear(), 0, 1)
        else return allData

        const filterByDate = (list) => list.filter(item => {
            const date = new Date(item.created_at || item.data_hora || Date.now())
            return date >= threshold
        })

        return {
            vistorias: filterByDate(allData.vistorias || []),
            interdicoes: filterByDate(allData.interdicoes || []),
            occupants: allData.occupants || [] // Occupants are current state, usually not filtered by entry date for management view but can be if needed
        }
    }, [allData, timeframe])

    const stats = useMemo(() => {
        const vistorias = filteredData.vistorias || []
        const total = vistorias.length
        const riskLevels = { 'Muito Alto': 0, 'Alto': 0, 'Médio': 0, 'Baixo': 0, 'Outros': 0 }
        const categories = {}
        const monthlyTrend = {}

        // Advanced Indicators
        let totalInterdicoes = (filteredData.interdicoes || []).length
        let desabrigados = (filteredData.occupants || []).filter(o => o.status !== 'exited').length
        let desalojados = 0
        let totalPeopleAssist = 0

        vistorias.forEach(item => {
            // Risk Level
            const risk = item.nivel_risco || item.nivelRisco || 'Outros'
            riskLevels[risk] = (riskLevels[risk] || 0) + 1

            // Category
            const cat = item.categoria_risco || item.categoriaRisco || 'Outros'
            categories[cat] = (categories[cat] || 0) + 1

            // Trend
            const date = new Date(item.created_at || item.data_hora || Date.now())
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'short' })
            monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1

            // Displaced/Interdicted in Vistoria
            const medidas = item.medidas_tomadas || item.medidasTomadas || []
            if (medidas.includes('Interdição Parcial') || medidas.includes('Interdição Total')) {
                // If it's not already counted in interdicoes table (to avoid double counting if UI creates both)
                // For simplicity, we assume interdicoes table is primary for legal acts
            }

            if (medidas.includes('Desalojamento') || medidas.includes('Orientação ao morador (sair do imóvel)')) {
                desalojados += parseInt(item.populacao_estimada || item.populacaoEstimada || 0)
            }

            totalPeopleAssist += parseInt(item.populacao_estimada || item.populacaoEstimada || 0)
        })

        return {
            total,
            interdicoes: totalInterdicoes,
            desabrigados,
            desalojados,
            riskChart: Object.entries(riskLevels).map(([name, value]) => ({ name, value })),
            categoryChart: Object.entries(categories)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5),
            trendChart: Object.entries(monthlyTrend).map(([name, value]) => ({ name, value })),
            familiesAfected: totalPeopleAssist || (total * 3.5)
        }
    }, [filteredData])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Processando Inteligência de Gestão...</p>
        </div>
    )

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-800">
            {/* Executive Header */}
            <header className="bg-white border-b border-slate-200 px-6 h-20 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-50 rounded-2xl transition-all active:scale-95 text-slate-400 border border-slate-100">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Gestão Estratégica</h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Visão Administrativa SIGERD</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors active:scale-95 shadow-sm border border-blue-100">
                        <Printer size={20} />
                    </button>
                </div>
            </header>

            <main className="p-6 space-y-8 max-w-2xl mx-auto">
                {/* Timeframe Selector */}
                <div className="flex bg-white p-1.5 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'month', label: '30 Dias' },
                        { id: 'quarter', label: 'Trimestre' },
                        { id: 'year', label: 'Este Ano' },
                        { id: 'all', label: 'Tudo' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setTimeframe(opt.id)}
                            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-tighter transition-all whitespace-nowrap ${timeframe === opt.id ? 'bg-[#2a5299] text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 border border-blue-100/50">
                            <Activity size={20} />
                        </div>
                        <div className="text-4xl font-black text-slate-900 leading-none">{stats.total}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Vistorias Totais</div>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 border border-emerald-100/50">
                            <Users size={20} />
                        </div>
                        <div className="text-4xl font-black text-slate-900 leading-none">{Math.round(stats.familiesAfected)}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Cidadãos Impactados</div>
                    </div>

                    {/* New KPIs */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4 border border-red-100/50">
                            <ShieldAlert size={20} />
                        </div>
                        <div className="text-4xl font-black text-slate-900 leading-none">{stats.interdicoes}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Interdições</div>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4 border border-orange-100/50">
                            <Home size={20} />
                        </div>
                        <div className="text-4xl font-black text-slate-900 leading-none">{stats.desabrigados + stats.desalojados}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Desabr./Desaloj.</div>
                    </div>
                </div>

                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden ring-4 ring-slate-50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-sm">Níveis de Severidade</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Gráfico de Proteção à Vida</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.riskChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="#fff"
                                    strokeWidth={3}
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {stats.riskChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-sm">Tendência de Atuação</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Volume de Demandas por Mês</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.trendChart}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#2a5299" radius={[10, 10, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category List */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-sm">Principais Tipologias</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Classificação de Ocorrências</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {stats.categoryChart.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{item.name}</span>
                                    <span className="text-sm font-black text-slate-900">{item.value}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-1000"
                                        style={{ width: `${(item.value / stats.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Executive Action Button */}
                <button
                    onClick={() => generateManagementReport(stats, timeframe, userProfile)}
                    className="w-full bg-[#1e293b] text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all hover:bg-slate-800"
                >
                    <Download size={18} />
                    Gerar Relatório Executivo (PDF)
                </button>
            </main>
        </div>
    )
}

export default ManagementDashboard
