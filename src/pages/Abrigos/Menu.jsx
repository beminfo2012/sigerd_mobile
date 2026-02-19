import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Package, Truck, Gift, FileText, ArrowLeft, ChevronRight,
    BarChart3, Users, Cloud, CheckCircle2, RefreshCcw, LayoutDashboard,
    Home, Info, AlertTriangle, TrendingUp, Heart
} from 'lucide-react';
import { UserContext } from '../../App';
import { getShelters, getOccupants, getDonations, getDistributions, getGlobalInventory, getDataConsistencyReport } from '../../services/shelterDb.js';
import { shelterSyncService } from '../../services/shelterSyncService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';

export default function ShelterMenu() {
    const navigate = useNavigate();
    const userProfile = useContext(UserContext);
    const userRole = (userProfile?.role || '').toLowerCase();
    const userEmail = (userProfile?.email || '').toLowerCase();

    // State for Dashboard Data
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalShelters: 0,
        activeShelters: 0,
        totalOccupants: 0,
        totalFamilies: 0,
        totalDonations: 0,
        totalDistributions: 0,
        itemsCount: 0,
        occupancyRate: 0,
        totalCapacity: 0
    });
    const [shelterOccupancy, setShelterOccupancy] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [chartData, setChartData] = useState({ inventory: [], occupancy: [] });
    const [syncPercentage, setSyncPercentage] = useState(100);
    const [isSyncing, setIsSyncing] = useState(false);
    const [consistency, setConsistency] = useState(null);

    // Master bypass for admin email
    const isAdminEmail = userEmail === 'bruno_pagel@hotmail.com';
    const AGENT_ROLES = ['agente de defesa civil', 'técnico em edificações', 'admin', 'agente', 'tecnico'];

    useEffect(() => {
        loadDashboardData();
        checkSyncStatus();
    }, []);

    const loadDashboardData = async () => {
        try {
            const shelters = await getShelters() || [];
            const occupants = await getOccupants() || [];
            const donations = await getDonations() || [];
            const inventory = await getGlobalInventory() || [];
            let allDistributions = [];
            try { allDistributions = await getDistributions() || []; } catch (e) { /* distributions store may not exist yet */ }

            // Calculate KPIs
            const activeShelters = shelters.filter(s => s.status === 'active');
            const totalCapacity = shelters.reduce((acc, s) => acc + parseInt(s.capacity || 0), 0);
            const totalOccupancy = shelters.reduce((acc, s) => acc + parseInt(s.current_occupancy || 0), 0);
            const totalItemsQty = inventory.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0);

            // Count unique families (family heads)
            const familyHeads = occupants.filter(o => o.is_family_head);
            const totalFamilies = familyHeads.length || (occupants.length > 0 ? Math.ceil(occupants.length / 3.5) : 0);

            setStats({
                totalShelters: shelters.length,
                activeShelters: activeShelters.length,
                totalOccupants: occupants.length,
                totalFamilies,
                totalDonations: donations.length,
                totalDistributions: allDistributions.length,
                itemsCount: inventory.length,
                totalItemsQty,
                totalCapacity,
                occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0
            });

            // === Per-Shelter Occupancy Bars ===
            const occupancyBars = activeShelters.map(s => {
                const cap = parseInt(s.capacity || 0);
                const occ = parseInt(s.current_occupancy || 0);
                const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
                return {
                    name: s.name,
                    occupancy: occ,
                    capacity: cap,
                    percent: Math.min(pct, 100),
                    shelter_id: s.shelter_id
                };
            }).sort((a, b) => b.percent - a.percent);
            setShelterOccupancy(occupancyBars);

            // === Low Stock Alerts ===
            const LOW_STOCK_THRESHOLD = 10; // Alert when quantity < 10
            const lowStock = inventory
                .filter(item => {
                    const qty = parseFloat(item.quantity) || 0;
                    const minQty = parseFloat(item.min_quantity) || LOW_STOCK_THRESHOLD;
                    return qty < minQty && qty > 0 && item.status !== 'deleted';
                })
                .map(item => ({
                    name: item.item_name,
                    quantity: parseFloat(item.quantity),
                    min_quantity: parseFloat(item.min_quantity) || LOW_STOCK_THRESHOLD,
                    unit: item.unit || 'un',
                    shelter: item.shelter_id || 'CENTRAL',
                    deficit: (parseFloat(item.min_quantity) || LOW_STOCK_THRESHOLD) - parseFloat(item.quantity)
                }))
                .sort((a, b) => a.quantity - b.quantity)
                .slice(0, 6);
            setLowStockAlerts(lowStock);

            // === Timeline: Donations vs Distributions (last 30 days) ===
            const now = new Date();
            const daysBack = 30;
            const dayMap = {};
            for (let i = daysBack; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                dayMap[key] = { day: key, doacoes: 0, distribuicoes: 0 };
            }

            donations.forEach(d => {
                const date = new Date(d.donation_date || d.created_at);
                const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (dayMap[key]) dayMap[key].doacoes += 1;
            });

            allDistributions.forEach(d => {
                const date = new Date(d.distribution_date || d.created_at);
                const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                if (dayMap[key]) dayMap[key].distribuicoes += 1;
            });

            // Only keep days that have data or are endpoints
            const timeline = Object.values(dayMap);
            setTimelineData(timeline);

            // Load consistency report
            try {
                const report = await getDataConsistencyReport('CENTRAL');
                setConsistency(report);
            } catch (e) { console.warn('Consistency check failed:', e); }

            // Prepare Chart Data
            const aggInventory = inventory.reduce((acc, item) => {
                const existing = acc.find(i => i.name === item.item_name);
                if (existing) {
                    existing.quantity += parseFloat(item.quantity);
                } else {
                    acc.push({ name: item.item_name, quantity: parseFloat(item.quantity) });
                }
                return acc;
            }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

            const occupancyData = activeShelters.map(s => ({
                name: s.name.length > 15 ? s.name.substring(0, 12) + '...' : s.name,
                current: s.current_occupancy || 0,
                capacity: s.capacity || 0
            })).slice(0, 5);

            setChartData({
                inventory: aggInventory,
                occupancy: occupancyData
            });

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkSyncStatus = async () => {
        const progress = await shelterSyncService.getSyncProgress();
        setSyncPercentage(progress);
    };

    const handleForceSync = async () => {
        setIsSyncing(true);
        await shelterSyncService.syncPending();
        await shelterSyncService.pullData();
        await checkSyncStatus();
        await loadDashboardData(); // Reload data after sync
        setTimeout(() => setIsSyncing(false), 1000);
    };

    const menuItems = [
        {
            title: 'Gestão de Abrigos',
            description: 'Gerencie ocupantes, capacidade e operações de cada abrigo.',
            icon: Building2,
            path: '/abrigos/lista',
            color: 'bg-blue-50 text-[#2a5299]',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social']
        },
        {
            title: 'Estoque Municipal',
            description: 'Visualize e gerencie o estoque centralizado da prefeitura.',
            icon: Package,
            path: '/abrigos/estoque',
            color: 'bg-emerald-50 text-emerald-600',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social', 'voluntário']
        },
        {
            title: 'Receber Doações',
            description: 'Registre a entrada de doações para o estoque ou abrigos.',
            icon: Gift,
            path: '/abrigos/doacoes-central',
            color: 'bg-amber-50 text-amber-600',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social', 'voluntário']
        },
        {
            title: 'Logística & Distribuição',
            description: 'Transfira itens do estoque municipal para os abrigos.',
            icon: Truck,
            path: '/abrigos/logistica',
            color: 'bg-purple-50 text-purple-600',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social', 'voluntário']
        },
        {
            title: 'Relatórios Gerais',
            description: 'Consolidado de ocupação, doações e movimentações.',
            icon: FileText,
            path: '/abrigos/relatorios',
            color: 'bg-slate-50 text-slate-600',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social']
        },

        {
            title: 'Contratos de Emergência',
            description: 'Contratos vigentes e suprimentos emergenciais.',
            icon: FileText,
            path: '/abrigos/contratos',
            color: 'bg-amber-50 text-amber-700',
            allowedRoles: ['agente de defesa civil', 'técnico em edificações', 'admin', 'assistente social']
        }
    ];


    const filteredItems = menuItems.filter(item =>
        isAdminEmail || item.allowedRoles.includes(userRole)
    );
    const isAgent = isAdminEmail || AGENT_ROLES.includes(userRole);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-600 text-xs uppercase tracking-widest">Carregando Dados...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header Sticky Glass */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm transition-all">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Assistência Humanitária</h1>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className={`w-1.5 h-1.5 rounded-full ${syncPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'} flex-shrink-0`} />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                                {syncPercentage === 100 ? 'Dados Sincronizados' : 'Sincronização Pendente'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className={`p-2 bg-slate-100 rounded-xl text-slate-500 active:rotate-180 transition-all ${isSyncing ? 'animate-spin text-blue-500' : ''}`}
                    >
                        {isSyncing ? <RefreshCcw className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-4xl mx-auto">

                {/* ═══ ENHANCED KPI DASHBOARD ═══ */}
                {isAgent && (
                    <>
                        {/* Summary KPI Cards */}
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Gradient Card - Total Shelters */}
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-[28px] shadow-lg border border-blue-400/20 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <Building2 className="text-white/60" size={20} />
                                    {stats.activeShelters > 0 && (
                                        <div className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-sm border border-white/10">
                                            {stats.activeShelters} ATIVOS
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-black text-white relative z-10">{stats.totalShelters}</div>
                                <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1 relative z-10">Total de Abrigos</div>
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                            </div>

                            {/* Families vs Capacity */}
                            <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2">
                                    <Heart className="text-rose-500" size={20} />
                                    <div className={`text-[10px] font-black ${stats.occupancyRate > 90 ? 'text-red-500' : 'text-slate-400'}`}>
                                        {stats.occupancyRate}% LOTAÇÃO
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-800">{stats.totalFamilies}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Famílias • {stats.totalOccupants} pessoas
                                </div>
                                {/* Capacity mini bar */}
                                <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${stats.occupancyRate > 90 ? 'bg-red-500' : stats.occupancyRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[8px] text-slate-400 font-bold">{stats.totalOccupants} atual</span>
                                    <span className="text-[8px] text-slate-400 font-bold">{stats.totalCapacity} máx</span>
                                </div>
                            </div>

                            {/* Donations */}
                            <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2">
                                    <Gift className="text-amber-500" size={20} />
                                    <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        +{stats.totalDistributions} distribuídos
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-800">{stats.totalDonations}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Doações Recebidas</div>
                            </div>

                            {/* Stock with Consistency */}
                            <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-2">
                                    <Package className="text-purple-500" size={20} />
                                    {lowStockAlerts.length > 0 ? (
                                        <div className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600 flex items-center gap-1 animate-pulse">
                                            <AlertTriangle size={10} /> {lowStockAlerts.length} ALERTA{lowStockAlerts.length > 1 ? 'S' : ''}
                                        </div>
                                    ) : consistency && (
                                        <div className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${consistency.isConsistent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {consistency.isConsistent ? '✓ OK' : '⚠ DIVERGÊNCIA'}
                                        </div>
                                    )}
                                </div>
                                <div className="text-3xl font-black text-slate-800">{(stats.totalItemsQty || 0).toLocaleString('pt-BR')}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stats.itemsCount} tipos em estoque</div>
                            </div>
                        </div>

                        {/* ═══ PER-SHELTER OCCUPANCY BARS ═══ */}
                        {shelterOccupancy.length > 0 && (
                            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in duration-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Users className="text-blue-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Taxa de Ocupação por Abrigo</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Capacidade utilizada em cada unidade</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {shelterOccupancy.map((s, i) => (
                                        <div key={s.shelter_id || i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[60%]">{s.name}</span>
                                                <span className={`text-[10px] font-black ${s.percent >= 90 ? 'text-red-600' : s.percent >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {s.occupancy}/{s.capacity} ({s.percent}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative
                                                    ${s.percent >= 90 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                                                            s.percent >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                                                'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                                                    style={{ width: `${s.percent}%` }}
                                                >
                                                    {s.percent >= 30 && (
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" style={{ animationDuration: '3s' }}></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ LOW STOCK ALERTS ═══ */}
                        {lowStockAlerts.length > 0 && (
                            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-[32px] border border-red-100 shadow-sm animate-in fade-in duration-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="text-red-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-red-800 text-sm">Alertas de Estoque Baixo</h3>
                                        <p className="text-[10px] text-red-400 font-medium">Itens abaixo do nível mínimo</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {lowStockAlerts.map((item, i) => (
                                        <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 border border-red-100 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <span className="text-lg">📦</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-800 truncate">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-red-600">
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400">/ mín. {item.min_quantity}</span>
                                                </div>
                                                <div className="w-full bg-red-100 rounded-full h-1 mt-1 overflow-hidden">
                                                    <div
                                                        className="h-full bg-red-500 rounded-full"
                                                        style={{ width: `${Math.min((item.quantity / item.min_quantity) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TIMELINE: DOAÇÕES vs DISTRIBUIÇÕES ═══ */}
                        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in duration-700">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-violet-50 rounded-lg">
                                    <TrendingUp className="text-violet-500" size={18} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm">Doações vs Distribuições</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Últimos 30 dias</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                        <span className="text-[9px] font-bold text-slate-400">Doações</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                        <span className="text-[9px] font-bold text-slate-400">Distribuições</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradDoacoes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradDist" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="day"
                                            tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 700 }}
                                            tickLine={false}
                                            axisLine={false}
                                            interval={Math.floor(timelineData.length / 6)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px', border: 'none',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                                fontSize: '11px', fontWeight: 700
                                            }}
                                        />
                                        <Area type="monotone" dataKey="doacoes" stroke="#10b981" strokeWidth={2.5} fill="url(#gradDoacoes)" dot={false} name="Doações" />
                                        <Area type="monotone" dataKey="distribuicoes" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradDist)" dot={false} name="Distribuições" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ═══ ORIGINAL CHARTS (Top Items) ═══ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Stock Chart */}
                            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <Package className="text-emerald-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Top Itens em Estoque</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Categorias com maior volume</p>
                                    </div>
                                </div>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={chartData.inventory} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                                            <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16}>
                                                {chartData.inventory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Occupancy Bar Chart */}
                            <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <BarChart3 className="text-blue-500" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Ocupação por Abrigo</h3>
                                        <p className="text-[10px] text-slate-400 font-medium">Unidades com maior lotação</p>
                                    </div>
                                </div>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData.occupancy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickLine={false} axisLine={false} interval={0} />
                                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }} />
                                            <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Operations Menu Grid */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <LayoutDashboard size={16} className="text-slate-400" />
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Módulos Operacionais</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(item.path)}
                                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group flex items-center gap-4"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                    <item.icon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                        {item.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center pt-8 border-t border-slate-100 mt-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                        <Info size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIGERD Mobile v1.40.0</span>
                    </div>
                </div>

            </main>
        </div>
    );
}
