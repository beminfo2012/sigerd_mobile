import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, Gift, ChevronRight, Plus, Search,
    CheckCircle2, Cloud, RefreshCcw, Trash2, FileText, ArrowLeft,
    Home, Filter, XCircle, RefreshCw
} from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Badge } from '../../components/Shelter/ui/Badge.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { getShelters, getOccupants, getDonations, deleteShelter } from '../../services/shelterDb.js';
import { shelterSyncService } from '../../services/shelterSyncService';
import { generateShelterReport } from '../../services/pdfReportService';
import { seedSheltersIfNeeded } from '../../utils/seedShelters';

export function Dashboard() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [syncPercentage, setSyncPercentage] = useState(100);
    const [isSyncing, setIsSyncing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false); // Controls filter visibility

    const [shelters, setShelters] = useState([]);
    const [occupantsList, setOccupantsList] = useState([]);
    const [donationsList, setDonationsList] = useState([]);


    useEffect(() => {
        const loadData = async () => {
            // Attempt seed first
            await seedSheltersIfNeeded();

            const s = await getShelters();
            const o = await getOccupants();
            const d = await getDonations();
            setShelters(s || []);
            setOccupantsList(o || []);
            setDonationsList(d || []);
        };
        loadData();
    }, []);

    // Sync Status Effect
    useEffect(() => {
        const updateProgress = async () => {
            const progress = await shelterSyncService.getSyncProgress();
            setSyncPercentage(progress);
        };
        updateProgress();
    }, [shelters, occupantsList, donationsList]);

    const handleForceSync = async () => {
        setIsSyncing(true);
        await shelterSyncService.syncPending();
        await shelterSyncService.pullData();
        setTimeout(() => setIsSyncing(false), 1000);
    };

    const stats = {
        totalShelters: shelters.length,
        activeShelters: shelters.filter(s => s.status === 'active').length,
        totalCapacity: shelters.reduce((sum, s) => sum + parseInt(s.capacity || 0), 0),
        totalOccupancy: shelters.reduce((sum, s) => sum + parseInt(s.current_occupancy || 0), 0),
        totalDonations: donationsList.length,
        totalOccupants: occupantsList.length,
        occupancyRate: 0
    };

    stats.occupancyRate = stats.totalCapacity > 0 ? Math.round((stats.totalOccupancy / stats.totalCapacity) * 100) : 0;

    const statusLabels = {
        active: 'ATIVO',
        inactive: 'INATIVO',
        full: 'LOTADO',
    };

    const filteredShelters = shelters.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.bairro && s.bairro.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleDeleteShelter = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir este abrigo?')) {
            await deleteShelter(id);
            const s = await getShelters();
            setShelters(s || []);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Assistência Humanitária</h1>
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className={`w-1 h-1 rounded-full ${syncPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'} flex-shrink-0`} />
                            <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${syncPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {syncPercentage === 100 ? 'Sincronizado' : 'Sincronização Pendente'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/abrigos/novo')}
                        className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleForceSync}
                        disabled={isSyncing}
                        className={`p-2 bg-slate-100 rounded-xl text-slate-500 active:rotate-180 transition-all ${isSyncing ? 'animate-spin text-blue-500' : ''}`}
                    >
                        {isSyncing ? <RefreshCcw className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6">

                {/* KPI Cards Row 1 */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Gradient Card - Total Shelters */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-lg border border-blue-400/20 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <Building2 className="text-white/60" size={20} />
                            <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-sm border border-white/10">
                                {stats.activeShelters} ativos
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white relative z-10">{stats.totalShelters}</div>
                        <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1 relative z-10">Total de Abrigos</div>

                        {/* Decorative circle */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/30 rounded-full blur-xl"></div>
                    </div>

                    {/* Stats Card - Occupants */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <Users className="text-emerald-500" size={20} />
                        </div>
                        <div className="text-3xl font-black text-slate-800">{stats.totalOccupants}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Abrigados</div>
                    </div>
                </div>

                {/* KPI Cards Row 2 */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Stats Card - Occupancy Rate */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`text-[9px] font-black ${stats.occupancyRate > 90 ? 'text-red-500' : 'text-slate-400'}`}>
                                {stats.totalOccupancy}/{stats.totalCapacity} VAGAS
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800">{stats.occupancyRate}<span className="text-sm ml-0.5">%</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Taxa Ocupação</div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${stats.occupancyRate > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Card - Donations */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <Gift className="text-amber-500" size={20} />
                            <button
                                onClick={() => generateShelterReport(shelters, donationsList, occupantsList)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <FileText size={16} />
                            </button>
                        </div>
                        <div className="text-3xl font-black text-slate-800">{stats.totalDonations}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Doações</div>
                    </div>
                </div>

                {/* Main Content Section (List) */}
                <div className="bg-white p-1 rounded-[32px] border border-slate-100 shadow-lg ring-4 ring-slate-100 overflow-hidden">
                    {/* Search and Filters Header */}
                    <div className="p-4 border-b border-slate-50 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Home className="text-blue-500" size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Lista de Abrigos</h3>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                        {filteredShelters.length} Unidade{filteredShelters.length !== 1 && 's'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar abrigo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-xl transition-all active:scale-95 ${showFilters ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Collapsible Filters */}
                        {showFilters && (
                            <div className="mt-3 pt-3 border-t border-slate-50 animate-in slide-in-from-top-2">
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('active')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-colors ${statusFilter === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        Ativos
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('full')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition-colors ${statusFilter === 'full' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        Lotados
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* List Content */}
                    <div className="bg-slate-50 min-h-[300px]">
                        {filteredShelters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-600 mb-1">
                                    Nenhum abrigo encontrado
                                </h3>
                                <p className="text-[10px] text-slate-400 px-8">
                                    Tente buscar por outro nome ou limpe os filtros.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredShelters.map((shelter) => (
                                    <div
                                        key={shelter.id}
                                        onClick={() => navigate(`/abrigos/${shelter.id}`)}
                                        className="p-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer group active:bg-blue-50/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Status Dot */}
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${shelter.status === 'active' ? 'bg-emerald-500' :
                                                    shelter.status === 'full' ? 'bg-amber-500' : 'bg-slate-300'
                                                }`} />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-bold text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
                                                        {shelter.name}
                                                    </h4>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                                                    {shelter.address}{shelter.bairro ? `, ${shelter.bairro}` : ''}
                                                </p>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <Users size={10} className="text-slate-400" />
                                                        {shelter.current_occupancy || 0}/{shelter.capacity}
                                                    </div>
                                                    {shelter.status !== 'active' && (
                                                        <div className="text-[9px] font-bold text-white bg-amber-500 px-2 py-0.5 rounded uppercase">
                                                            {statusLabels[shelter.status]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => handleDeleteShelter(e, shelter.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 active:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}

export default Dashboard;
