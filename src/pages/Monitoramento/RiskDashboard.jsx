import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldAlert, Home, Mountain, Droplets, AlertTriangle, RotateCcw } from 'lucide-react'

const RiskDashboard = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        total: 0,
        geologico: 0,
        hidrologico: 0,
        altaSeveridade: 0
    })

    useEffect(() => {
        // TODO: Substituir por dados reais do Supabase na Fase 2
        // Por enquanto, carrega dados estáticos
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            // TEMPORÁRIO: Simula carregamento
            // FUTURO: Buscar de src/services/riskData.js
            setTimeout(() => {
                setStats({
                    total: 1247,
                    geologico: 523,
                    hidrologico: 724,
                    altaSeveridade: 89
                })
                setLoading(false)
            }, 1000)

        } catch (error) {
            console.error('Erro ao carregar dados de risco:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-slate-600">Carregando Painel de Riscos...</span>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="bg-red-50 p-2 rounded-xl">
                        <ShieldAlert className="text-red-600 w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-900 leading-tight">Painel de Riscos</h1>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">SIGERD Mobile</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadDashboardData}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        title="Atualizar"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 max-w-lg mx-auto w-full space-y-6">

                {/* Quick Stats Scroll */}
                <div className="flex overflow-x-auto gap-4 pb-2 snap-x no-scrollbar">

                    {/* Stat Card 1 - Total */}
                    <div className="snap-center min-w-[160px] bg-white p-4 rounded-2xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Home className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">TOTAL</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{stats.total.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Imóveis Mapeados</p>
                    </div>

                    {/* Stat Card 2 - Geológico */}
                    <div className="snap-center min-w-[160px] bg-white p-4 rounded-2xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                                <Mountain className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">GEO</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{stats.geologico.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Risco Geológico</p>
                    </div>

                    {/* Stat Card 3 - Hidrológico */}
                    <div className="snap-center min-w-[160px] bg-white p-4 rounded-2xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                                <Droplets className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded">HIDRO</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{stats.hidrologico.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Risco Hidrológico</p>
                    </div>

                    {/* Stat Card 4 - Alta Severidade */}
                    <div className="snap-center min-w-[160px] bg-white p-4 rounded-2xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ALTA</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">{stats.altaSeveridade.toLocaleString()}</h3>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">Alta Severidade</p>
                    </div>
                </div>

                {/* Placeholder para futuras funcionalidades */}
                <div className="bg-white p-6 rounded-3xl shadow-[0_4px_25px_-4px_rgba(0,0,0,0.05)] border border-slate-100 text-center">
                    <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-800">Dashboard em Desenvolvimento</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Gráficos, mapas e filtros serão adicionados nas próximas versões.
                    </p>
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-xs text-slate-600 font-bold mb-2">Próximas Funcionalidades:</div>
                        <ul className="text-xs text-slate-500 space-y-1 text-left">
                            <li>📊 Gráficos de distribuição de riscos</li>
                            <li>🗺️ Mapa interativo com marcadores</li>
                            <li>🔍 Filtros por localidade e severidade</li>
                            <li>📄 Exportação de relatórios</li>
                        </ul>
                    </div>
                    <div className="mt-4 text-xs text-slate-400">
                        Versão: 1.0.0 (Fase 1 - Integração Básica)
                    </div>
                </div>

            </main>
        </div>
    )
}

export default RiskDashboard
