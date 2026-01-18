import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Users, ChevronRight, Plus, Search,
    Trash2, ArrowLeft
} from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Badge } from '../../components/Shelter/ui/Badge';
import { Button } from '../../components/Shelter/ui/Button';
import { Input } from '../../components/Shelter/ui/Input';
import { getShelters, deleteShelter } from '../../services/shelterDb';
import { seedSheltersIfNeeded } from '../../utils/seedShelters';

export default function ShelterList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [shelters, setShelters] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            await seedSheltersIfNeeded();
            const s = await getShelters();
            setShelters(s || []);
        };
        loadData();
    }, []);

    const statusLabels = {
        active: 'ATIVO',
        inactive: 'INATIVO',
        full: 'LOTADO',
    };

    const filteredShelters = shelters.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()));
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

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate('/abrigos')}
                            className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors mb-2"
                        >
                            <ArrowLeft size={20} />
                            Voltar ao Menu
                        </button>
                        <h1 className="text-2xl font-black text-slate-800">Gestão de Abrigos</h1>
                    </div>
                    <Button
                        onClick={() => navigate('/abrigos/novo')}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Novo Abrigo
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="flex-1 w-full relative">
                        <Input
                            icon={Search}
                            placeholder="Buscar abrigo por nome ou endereço..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'full'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase ${statusFilter === status
                                    ? 'bg-[#2a5299] text-white'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' : statusLabels[status]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shelters List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredShelters.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Nenhum abrigo encontrado</h3>
                        </div>
                    ) : (
                        filteredShelters.map((shelter) => (
                            <Card
                                key={shelter.id}
                                onClick={() => navigate(`/abrigos/${shelter.id}`)}
                                className="p-4 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] border border-transparent hover:border-blue-100"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#2a5299]">
                                        <Building2 size={20} />
                                    </div>
                                    <Badge status={shelter.status || 'active'}>
                                        {statusLabels[shelter.status] || 'ATIVO'}
                                    </Badge>
                                </div>

                                <h3 className="text-sm font-bold text-slate-800 truncate mb-1">
                                    {shelter.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium truncate mb-4">
                                    {shelter.address}
                                </p>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <Users size={12} />
                                            {shelter.current_occupancy || 0}/{shelter.capacity}
                                        </span>
                                        <span>
                                            {Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100)}% Lotado
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#2a5299] rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(((shelter.current_occupancy || 0) / shelter.capacity) * 100, 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <button
                                        onClick={(e) => handleDeleteShelter(e, shelter.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="flex items-center gap-1 text-xs font-bold text-[#2a5299] group-hover:translate-x-1 transition-transform">
                                        Gerenciar
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
