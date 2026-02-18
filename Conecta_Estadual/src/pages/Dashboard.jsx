import React from 'react';
import {
    Users,
    MapPin,
    ShieldAlert,
    AlertTriangle,
    FileCheck,
    TrendingUp,
    Map as MapIcon,
    ChevronRight
} from 'lucide-react';
import StateMap from '../components/StateMap';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';

const Dashboard = () => {
    // Mock Data
    const stats = [
        { title: 'Ocorrências Ativas', value: 38, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Planos Acionados', value: 15, icon: ShieldAlert, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Pendentes Análise', value: 7, icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        { title: 'Decretos Emitidos', value: 33, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const chartData = [
        { name: 'Jan', val: 400 },
        { name: 'Fev', val: 300 },
        { name: 'Mar', val: 200 },
        { name: 'Abr', val: 278 },
        { name: 'Mai', val: 189 },
        { name: 'Jun', val: 239 },
        { name: 'Jul', val: 349 },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel Geral</h2>
                    <p className="text-sm text-slate-500 font-medium">Monitoramento em tempo real do Estado do ES</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Sincronizado: Just now
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-5 group flex items-start justify-between">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-600">
                                <TrendingUp size={12} /> +12% este mês
                            </div>
                        </div>
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors group-hover:bg-blue-600 group-hover:text-white`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area: Map & Sidebar Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2 glass-card p-6 min-h-[500px] relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <MapIcon size={18} className="text-blue-600" /> Monitoramento Geográfico
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 uppercase tracking-tighter">Nível Estadual</span>
                        </div>
                    </div>

                    {/* Real Map Integration */}
                    <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
                        <StateMap />
                    </div>
                </div>

                {/* Regional Stats */}
                <div className="space-y-6">
                    <div className="glass-card p-6 flex flex-col h-full">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Users size={18} className="text-indigo-600" /> Impacto Humano
                        </h3>

                        <div className="space-y-6 flex-1">
                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Desabrigados</p>
                                <p className="text-3xl font-black text-indigo-900 italic">2.408</p>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                                    <div className="w-3/4 h-full bg-indigo-600 rounded-full"></div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Afetados</p>
                                <p className="text-3xl font-black text-blue-900 italic">24.609</p>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                                    <div className="w-1/2 h-full bg-blue-600 rounded-full"></div>
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Ranking por Município</h4>
                                {[
                                    { name: 'Santa Maria de Jetibá', count: 12 },
                                    { name: 'Mimoso do Sul', count: 8 },
                                    { name: 'Afonso Cláudio', count: 5 }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle row: Charts & Recent List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline Chart */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tendência de Ocorrências</h3>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1 outline-none">
                            <option>Últimos 30 dias</option>
                            <option>Últimos 12 meses</option>
                        </select>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 800 }}
                                />
                                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Occurrences Quick List */}
                <div className="glass-card p-6 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ocorrências Recentes</h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all">Ver Todos <ChevronRight size={14} /></button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-50">
                                    <th className="pb-3 pl-2">Município</th>
                                    <th className="pb-3">Tipo</th>
                                    <th className="pb-3 text-right pr-2">Gravidade</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {[
                                    { mun: 'Sta Maria Jetibá', tipo: 'Hídrica', severity: 'Alta', color: 'text-amber-500 bg-amber-50' },
                                    { mun: 'Mimoso do Sul', tipo: 'Inundação', severity: 'Crítica', color: 'text-red-600 bg-red-50' },
                                    { mun: 'Afonso Cláudio', tipo: 'Deslizamento', severity: 'Médio', color: 'text-blue-500 bg-blue-50' },
                                    { mun: 'Vila Velha', tipo: 'Enchente', severity: 'Alto', color: 'text-orange-500 bg-orange-50' }
                                ].map((r, i) => (
                                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-2 font-bold text-slate-700">{r.mun}</td>
                                        <td className="py-4 text-slate-500 font-medium">{r.tipo}</td>
                                        <td className="py-4 text-right pr-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${r.color}`}>
                                                {r.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
