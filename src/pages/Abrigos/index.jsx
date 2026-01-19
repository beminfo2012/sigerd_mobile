import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, Gift, ChevronRight, Plus, Search,
    CheckCircle2, Cloud, RefreshCcw, Trash2, FileText, ArrowLeft
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
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card variant="gradient" className="p-4 md:col-span-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                {/* Back Button */}
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-2 text-white/90 hover:text-white font-semibold mb-3 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                    Voltar
                                </button>
                                <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1">
                                    GESTÃO DE ABRIGOS
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-3xl font-black text-white">
                                        {stats.totalShelters}
                                    </div>
                                    <div className="text-xs text-white/90">
                                        {stats.activeShelters} abrigos ativos
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/abrigos/novo')}
                                className="flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus size={20} />
                                Novo Abrigo
                            </Button>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={() => generateShelterReport(shelters, donationsList, occupantsList)}
                                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 py-1.5 h-8 text-xs"
                            >
                                <FileText size={14} />
                                Relatório PDF
                            </Button>
                        </div>
                    </Card>

                    <Card variant="stat" className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                ABRIGADOS
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 mb-1">
                            {stats.totalOccupancy}
                        </div>
                        <div className="text-xs text-slate-500">
                            de {stats.totalCapacity} vagas ({stats.occupancyRate}%)
                        </div>
                    </Card>

                    <Card variant="stat" className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Gift className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                DOAÇÕES
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 mb-1">
                            {stats.totalDonations}
                        </div>
                        <div className="text-xs text-slate-500">
                            registradas
                        </div>
                    </Card>

                    <Card variant="stat" className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncPercentage === 100 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                    {syncPercentage === 100 ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <Cloud className="w-5 h-5 text-amber-600" />
                                    )}
                                </div>
                                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                    SINCRONIZADO
                                </div>
                            </div>
                            <button
                                onClick={handleForceSync}
                                disabled={isSyncing}
                                className={`p-2 rounded-lg transition-all ${isSyncing ? 'animate-spin text-blue-400' : 'text-[#2a5299] hover:bg-blue-50'}`}
                            >
                                <RefreshCcw size={16} />
                            </button>
                        </div>
                        <div className="text-3xl font-black text-slate-800 mb-1">
                            {syncPercentage}%
                        </div>
                        <div className="text-[10px] space-x-2">
                            <span className={syncPercentage === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                {syncPercentage === 100 ? 'STATUS: OK' : 'PENDENTE'}
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1 w-full relative">
                        <Input
                            icon={Search}
                            placeholder="Buscar por nome, endereço ou bairro..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-[#2a5299] text-white' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            TODOS
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            ATIVOS
                        </button>
                        <button
                            onClick={() => setStatusFilter('full')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'full' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            LOTADOS
                        </button>
                    </div>
                </div>

                {/* Shelters List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 font-sans">Abrigos Cadastrados</h2>
                        <span className="text-sm font-semibold text-slate-400">
                            {filteredShelters.length} de {shelters.length}
                        </span>
                    </div>

                    {filteredShelters.length === 0 ? (
                        <Card className="p-12">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                    <Search className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                    Nenhum resultado encontrado
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 font-medium">
                                    Tente ajustar sua busca ou filtros para encontrar o que procura.
                                </p>
                                <Button variant="secondary" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                                    Limpar Filtros
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredShelters.map((shelter) => (
                                <Card
                                    key={shelter.id}
                                    onClick={() => navigate(`/abrigos/${shelter.id}`)}
                                    className="p-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Building2 className="w-6 h-6 text-[#2a5299]" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-slate-800 truncate">
                                                    {shelter.name}
                                                </h3>
                                                <Badge status={shelter.status || 'active'}>
                                                    {statusLabels[shelter.status] || 'ATIVO'}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium truncate mb-2">
                                                {shelter.address}{shelter.bairro ? ` - ${shelter.bairro}` : ''}
                                            </p>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-slate-700 uppercase tracking-widest">
                                                        OCUPAÇÃO: {shelter.current_occupancy || 0}/{shelter.capacity}
                                                    </span>
                                                    <span className="text-slate-400">
                                                        {Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(((shelter.current_occupancy || 0) / shelter.capacity) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={(e) => handleDeleteShelter(e, shelter.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Excluir Abrigo"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

export default Dashboard;
