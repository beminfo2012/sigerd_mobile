import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, BarChart3, TrendingUp, DollarSign,
    AlertTriangle, Map as MapIcon, RefreshCw, Loader2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { fetchDashboardKPIs, subscribeToOccurrences } from '../services/api';

const StrategicIndicators = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadData();
        const unsubscribe = subscribeToOccurrences(() => loadData());
        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const kpis = await fetchDashboardKPIs();
            setData(kpis);
        } catch (err) {
            console.error('[Indicators] Load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 size={32} className="animate-spin text-[#2a5299]" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processando Inteligência de Dados...</p>
            </div>
        );
    }

    // Prepare Data for Rankings
    const occurrencesByMun = {};
    const homelessByMun = {};
    const gravityStats = { 'Crítica': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0 };

    data.occurrences.forEach(o => {
        occurrencesByMun[o.municipio] = (occurrencesByMun[o.municipio] || 0) + 1;
        homelessByMun[o.municipio] = (homelessByMun[o.municipio] || 0) + (o.desabrigados || 0);
        gravityStats[o.gravidade] = (gravityStats[o.gravidade] || 0) + 1;
    });

    const rankingOccurrences = Object.entries(occurrencesByMun)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const rankingHomeless = Object.entries(homelessByMun)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    const gravityPieData = Object.entries(gravityStats)
        .map(([name, value]) => ({ name, value }))
        .filter(v => v.value > 0);

    const COLORS = {
        'Crítica': '#ef4444',
        'Alta': '#f97316',
        'Média': '#f59e0b',
        'Baixa': '#10b981'
    };

    const totalLosses = data.totalLosses || 0;

    return (
        <div className="space-y-6 anim-fade pb-10">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Indicadores Estratégicos</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise consolidada do Estado</p>
                </div>
                <button onClick={loadData} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#2a5299] transition-colors">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prejuízo Estimado</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                        R$ {totalLosses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                        <TrendingUp size={12} /> Consolidado Estadual
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-[#2a5299] rounded-xl">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gravidade Crítica</p>
                    </div>
                    <p className="text-2xl font-black text-red-600">
                        {gravityStats['Crítica']} <span className="text-sm font-bold text-slate-400">ocorrências</span>
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-red-500 h-full"
                            style={{ width: `${(gravityStats['Crítica'] / data.activeOccurrences) * 100 || 0}%` }}
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">População Desabrigada</p>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                        {data.totalDisplaced?.toLocaleString('pt-BR')} <span className="text-sm font-bold text-slate-400">pessoas</span>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-2">Média: {(data.totalDisplaced / data.activeOccurrences || 0).toFixed(1)} por evento</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking: Occurrences */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MapIcon size={14} className="text-blue-500" /> Ranking por Nº de Ocorrências
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rankingOccurrences} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 800, color: '#1e293b' }}
                                />
                                <Bar dataKey="value" fill="#2a5299" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ranking: Homeless */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={14} className="text-red-500" /> Ranking por Desabrigados
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rankingHomeless} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 800, color: '#1e293b' }}
                                />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gravity Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Distribuição de Gravidade</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={gravityPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {gravityPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#cbd5e1'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Prejuízos Consolidado Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/50 mb-2">Total de Prejuízos</h3>
                        <p className="text-4xl font-black">R$ {(totalLosses / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                            Impacto financeiro consolidado em todo o estado baseado nos relatos municipais do S2ID.
                        </p>
                    </div>
                    <DollarSign size={120} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
                </div>
            </div>
        </div>
    );
};

export default StrategicIndicators;
