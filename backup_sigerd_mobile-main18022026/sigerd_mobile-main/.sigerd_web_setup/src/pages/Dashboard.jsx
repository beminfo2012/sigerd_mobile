import React, { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Users, MapPin, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '../services/supabase'

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalVistorias: 0,
        totalInterdicoes: 0,
        vistoriasHoje: 0,
        atendimentosAtivos: 0,
        impactados: 0,
        abrigos: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            // Load Vistorias
            const { data: vistorias } = await supabase
                .from('vistorias')
                .select('*', { count: 'exact' })

            // Load Interdições
            const { data: interdicoes } = await supabase
                .from('interdicoes')
                .select('*', { count: 'exact' })

            // Calculate stats
            const hoje = new Date().toISOString().split('T')[0]
            const vistoriasHoje = vistorias?.filter(v =>
                v.created_at?.startsWith(hoje)
            ).length || 0

            const totalImpactados = vistorias?.reduce((sum, v) =>
                sum + (parseInt(v.populacao_estimada) || 0), 0
            ) || 0

            setStats({
                totalVistorias: vistorias?.length || 0,
                totalInterdicoes: interdicoes?.length || 0,
                vistoriasHoje,
                atendimentosAtivos: 3, // Mock data
                impactados: totalImpactados,
                abrigos: 0
            })
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold">Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Dashboard Operacional</h1>
                <p className="text-sm text-slate-500 font-bold mt-1">
                    Visão geral em tempo real
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={<Activity className="text-blue-600" />}
                    label="Vistorias Realizadas"
                    value={stats.totalVistorias}
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    icon={<AlertTriangle className="text-red-600" />}
                    label="Interdições Ativas"
                    value={stats.totalInterdicoes}
                    trend="0%"
                    trendUp={false}
                />
                <StatCard
                    icon={<MapPin className="text-emerald-600" />}
                    label="Vistorias Hoje"
                    value={stats.vistoriasHoje}
                    trend="+5"
                    trendUp={true}
                />
                <StatCard
                    icon={<Activity className="text-purple-600" />}
                    label="Atendimentos Ativos"
                    value={stats.atendimentosAtivos}
                    trend="2 em campo"
                    trendUp={true}
                />
                <StatCard
                    icon={<Users className="text-orange-600" />}
                    label="População Impactada"
                    value={stats.impactados}
                    trend="Est. acumulado"
                    trendUp={false}
                />
                <StatCard
                    icon={<MapPin className="text-indigo-600" />}
                    label="Abrigos Ativos"
                    value={stats.abrigos}
                    trend="0 lotados"
                    trendUp={true}
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4">Atividade Recente</h2>
                <div className="space-y-3">
                    <ActivityItem
                        type="vistoria"
                        title="Nova vistoria registrada"
                        location="Bairro Centro"
                        time="Há 5 minutos"
                    />
                    <ActivityItem
                        type="interdicao"
                        title="Interdição atualizada"
                        location="Rua das Flores"
                        time="Há 15 minutos"
                    />
                    <ActivityItem
                        type="vistoria"
                        title="Vistoria concluída"
                        location="Alto da Boa Vista"
                        time="Há 1 hora"
                    />
                </div>
            </div>
        </div>
    )
}

const StatCard = ({ icon, label, value, trend, trendUp }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
        <div className="text-sm text-slate-500 font-bold">{label}</div>
    </div>
)

const ActivityItem = ({ type, title, location, time }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
        <div className={`w-2 h-2 rounded-full ${type === 'interdicao' ? 'bg-red-500' : 'bg-blue-500'}`} />
        <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">{title}</div>
            <div className="text-xs text-slate-500 font-medium">{location}</div>
        </div>
        <div className="text-xs text-slate-400 font-bold">{time}</div>
    </div>
)

export default Dashboard
