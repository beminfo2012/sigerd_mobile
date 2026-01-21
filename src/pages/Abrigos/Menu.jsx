import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Package, Truck, Gift, FileText, ArrowLeft, ChevronRight,
    BarChart3, Users, Cloud, CheckCircle2, RefreshCcw, LayoutDashboard,
    Home, Info
} from 'lucide-react';
import { UserContext } from '../../App';
import { getShelters, getOccupants, getDonations, getGlobalInventory } from '../../services/shelterDb.js';
import { shelterSyncService } from '../../services/shelterSyncService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
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
        totalDonations: 0,
        itemsCount: 0,
        occupancyRate: 0
    });
    const [chartData, setChartData] = useState({ inventory: [], occupancy: [] });
    const [syncPercentage, setSyncPercentage] = useState(100);
    const [isSyncing, setIsSyncing] = useState(false);

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

            // Calculate KPIs
            const activeShelters = shelters.filter(s => s.status === 'active');
            const totalCapacity = shelters.reduce((acc, s) => acc + parseInt(s.capacity || 0), 0);
            const totalOccupancy = shelters.reduce((acc, s) => acc + parseInt(s.current_occupancy || 0), 0);

            setStats({
                totalShelters: shelters.length,
                activeShelters: activeShelters.length,
                totalOccupants: occupants.length,
                totalDonations: donations.length,
                itemsCount: inventory.length,
                occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0
            });

            // Prepare Chart Data
            // 1. Inventory Top 5 by Quantity
            const aggInventory = inventory.reduce((acc, item) => {
                const existing = acc.find(i => i.name === item.item_name);
                if (existing) {
                    existing.quantity += parseFloat(item.quantity);
                } else {
                    acc.push({ name: item.item_name, quantity: parseFloat(item.quantity) });
                }
                return acc;
            }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

            // 2. Shelter Occupancy
            const occupancyData = activeShelters.map(s => ({
                name: s.name.length > 15 ? s.name.substring(0, 12) + '...' : s.name,
                current: s.current_occupancy || 0,
                capacity: s.capacity || 0
            })).slice(0, 5); // Limit to 5 for cleanliness

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

                {/* KPI Cards Section */}
                {isAgent && (
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
                            {/* Decorative Blur */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                        </div>

                        {/* White Card - Total Occupants */}
                        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <Users className="text-emerald-500" size={20} />
                                <div className={`text-[10px] font-black ${stats.occupancyRate > 90 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {stats.occupancyRate}% LOTAÇÃO
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-800">{stats.totalOccupants}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pessoas Abrigadas</div>
                        </div>

                        {/* White Card - Total Donations */}
                        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <Gift className="text-amber-500" size={20} />
                            </div>
                            <div className="text-3xl font-black text-slate-800">{stats.totalDonations}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Doações Recebidas</div>
                        </div>

                        {/* White Card - Stock Items */}
                        <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <Package className="text-purple-500" size={20} />
                            </div>
                            <div className="text-3xl font-black text-slate-800">{stats.itemsCount}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Itens em Estoque</div>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                {isAgent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Occupancy Chart */}
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
                    </div>
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIGERD Mobile v1.39.0</span>
                    </div>
                </div>

            </main>
        </div>
    );
}
