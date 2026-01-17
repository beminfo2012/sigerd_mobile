import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Users, Phone, User, ArrowLeft,
    Plus, Gift, TrendingUp, Heart, LogOut,
    Crown, ChevronDown, ChevronUp, Package, Building2,
    Droplets, Bed, Shirt, Calculator, Edit
} from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Badge } from '../../components/Shelter/ui/Badge';
import { Button } from '../../components/Shelter/ui/Button';
import { getShelterById, getOccupants, getDonations, getInventory, updateShelter, deleteShelter, exitOccupant } from '../../services/shelterDb';
import { calculateShelterNeeds } from '../../utils/needsCalculator';

export function ShelterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('individual'); // individual or family
    const [expandedFamilies, setExpandedFamilies] = useState({});

    const [shelter, setShelter] = useState(undefined);
    const [occupants, setOccupants] = useState([]);
    const [donations, setDonations] = useState([]);
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            // Handle both string and int IDs seamlessly by passing raw ID to service
            const s = await getShelterById(id);
            const o = await getOccupants(id);
            const d = await getDonations(id);
            const i = await getInventory(id);

            setShelter(s || null); // null indicates "not found", undefined "loading"
            setOccupants(o || []);
            setDonations(d || []);
            setInventory(i || []);
        };
        loadData();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja excluir este abrigo? Esta ação não pode ser desfeita e removerá o abrigo da listagem.')) {
            try {
                await deleteShelter(id);
                alert('Abrigo excluído com sucesso.');
                navigate('/abrigos');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir abrigo.');
            }
        }
    };

    const handleExit = async (occupantId) => {
        if (confirm('Tem certeza que deseja registrar a saída deste abrigado?')) {
            try {
                await exitOccupant(occupantId, id);
                alert('Saída registrada com sucesso!');
            } catch (error) {
                console.error('Error exiting occupant:', error);
                alert('Erro ao registrar saída.');
            }
        }
    };

    if (shelter === undefined) return null; // Loading state

    if (!shelter) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Abrigo não encontrado</h1>
                    <Button onClick={() => navigate('/abrigos')}>Voltar ao Dashboard</Button>
                </div>
            </div>
        );
    }

    const statusLabels = {
        active: 'ATIVO',
        inactive: 'INATIVO',
        full: 'LOTADO',
    };

    const occupancyRate = Math.round(((shelter.current_occupancy || 0) / shelter.capacity) * 100);

    const toggleFamily = (group) => {
        setExpandedFamilies(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const families = occupants.reduce((acc, occ) => {
        const group = occ.family_group || 'Sem Grupo';
        if (!acc[group]) acc[group] = [];
        acc[group].push(occ);
        return acc;
    }, {});

    const estimatedNeeds = calculateShelterNeeds(shelter.current_occupancy || occupants.length);

    const iconMap = {
        Package,
        Droplets,
        Heart,
        Bed,
        Shirt
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold w-fit hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Dashboard
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-black text-slate-800">{shelter.name}</h1>
                                <Badge status={shelter.status || 'active'}>
                                    {statusLabels[shelter.status] || 'ATIVO'}
                                </Badge>
                                <button
                                    onClick={() => navigate(`/abrigos/editar/${id}`)}
                                    className="p-2 text-[#2a5299] hover:bg-blue-50 rounded-xl transition-colors"
                                    title="Editar Abrigo"
                                >
                                    <Edit size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <MapPin size={16} />
                                {shelter.address}{shelter.bairro ? ` - ${shelter.bairro}` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 bg-white">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            OCUPAÇÃO
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {shelter.current_occupancy || 0}/{shelter.capacity}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                            {occupancyRate}% CARREGADO
                        </div>
                    </Card>

                    <Card className="p-4 bg-white">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            ABRIGADOS
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {occupants.length}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                            PESSOAS ATIVAS
                        </div>
                    </Card>

                    <Card className="p-4 bg-white">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            DOAÇÕES
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {donations.length}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                            REGISTROS
                        </div>
                    </Card>

                    <Card className="p-4 bg-white">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            ESTOQUE
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {inventory.length}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                            ITENS ÚNICOS
                        </div>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card
                                onClick={() => navigate(`/abrigos/${id}/abrigados/novo`)}
                                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800">
                                            Cadastrar Abrigado
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Adicionar nova pessoa
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card
                                onClick={() => navigate(`/abrigos/${id}/doacoes/novo`)}
                                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Gift className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800">
                                            Registrar Doação
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Nova doação recebida
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card
                                onClick={() => navigate(`/abrigos/${id}/distribuicoes/novo`)}
                                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800">
                                            Distribuir Itens
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Controle de estoque
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* List Sections */}
                        <div className="space-y-6">
                            {/* Occupants List */}
                            <Card className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-slate-800">Pessoas Abrigadas</h2>
                                        <Badge status="active">{occupants.length}</Badge>
                                    </div>

                                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                        <button
                                            onClick={() => setViewMode('individual')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'individual' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500'
                                                }`}
                                        >
                                            INDIVIDUAL
                                        </button>
                                        <button
                                            onClick={() => setViewMode('family')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'family' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500'
                                                }`}
                                        >
                                            POR FAMÍLIA
                                        </button>
                                    </div>
                                </div>

                                {occupants.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8 italic">Nenhum abrigado cadastrado.</p>
                                ) : viewMode === 'individual' ? (
                                    <div className="space-y-3">
                                        {occupants.map((occupant) => (
                                            <div key={occupant.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl group relative overflow-hidden">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <User size={20} className="text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-semibold text-slate-800 truncate">
                                                            {occupant.full_name}
                                                        </div>
                                                        {occupant.is_family_head && (
                                                            <Crown size={12} className="text-amber-500" title="Responsável Familiar" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {occupant.age} anos • {occupant.gender === 'masculino' ? 'M' : occupant.gender === 'feminino' ? 'F' : 'Outro'}
                                                        {occupant.family_group && ` • Grp: ${occupant.family_group}`}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {occupant.special_needs && (
                                                        <Heart size={16} className="text-red-500" />
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExit(occupant.id); }}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                                                        title="Registrar Saída"
                                                    >
                                                        <LogOut size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {Object.entries(families).map(([groupName, members]) => (
                                            <div key={groupName} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                                <button
                                                    onClick={() => toggleFamily(groupName)}
                                                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                            <Users size={20} className="text-[#2a5299]" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-sm font-bold text-slate-800">{groupName}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                {members.length} {members.length === 1 ? 'Membro' : 'Membros'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {expandedFamilies[groupName] ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                                                </button>

                                                {expandedFamilies[groupName] && (
                                                    <div className="bg-slate-50/50 p-3 space-y-2 border-t border-slate-50">
                                                        {members.map(member => (
                                                            <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100/50">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.is_family_head ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                                        {member.is_family_head ? <Crown size={14} className="text-amber-600" /> : <User size={14} className="text-slate-400" />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="text-xs font-bold text-slate-800 truncate">{member.full_name}</div>
                                                                        <div className="text-[10px] text-slate-500">{member.age} anos • {member.gender}</div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleExit(member.id)}
                                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <LogOut size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Inventory List */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-800">Estoque do Abrigo</h2>
                                    <Package className="w-5 h-5 text-slate-400" />
                                </div>
                                {inventory.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum item em estoque.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {inventory.map((item) => {
                                            const isLowStock = item.quantity <= (item.minimum_stock || 5);
                                            return (
                                                <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isLowStock ? 'bg-red-100' : 'bg-blue-100'
                                                        }`}>
                                                        <Package size={20} className={isLowStock ? 'text-red-600' : 'text-blue-600'} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-slate-800 truncate">
                                                            {item.item_name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 capitalize">
                                                            {item.category} • {item.location || 'Sem localização'}
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-slate-800'}`}>
                                                            {item.quantity} {item.unit}
                                                        </div>
                                                        {isLowStock && (
                                                            <div className="text-xs text-red-500">
                                                                Estoque baixo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Information Card */}
                        <Card className="p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Informações</h2>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <MapPin className="w-5 h-5 text-[#2a5299] flex-shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            ENDEREÇO
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed text-wrap break-words">
                                            {shelter.address ? (shelter.bairro ? `${shelter.address}, ${shelter.bairro}` : shelter.address) : (shelter.bairro || 'Endereço não informado')}
                                        </p>
                                        {(shelter.lat || shelter.coordenadas) && (
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                <MapPin size={12} />
                                                GPS: {shelter.lat ? `${shelter.lat}, ${shelter.lng}` : shelter.coordenadas}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Building2 className="w-5 h-5 text-[#2a5299] flex-shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            CAPACIDADE
                                        </div>
                                        <p className="text-sm text-slate-700 font-bold">
                                            {shelter.capacity} Pessoas
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <User className="w-5 h-5 text-[#2a5299] flex-shrink-0" />
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            RESPONSÁVEL
                                        </div>
                                        <p className="text-sm text-slate-700 font-bold">
                                            {shelter.responsible_name || shelter.contact_name || 'Não informado'}
                                        </p>
                                        {(shelter.responsible_phone || shelter.contact_phone) && (
                                            <div className="flex items-center gap-1 text-slate-500 mt-1">
                                                <Phone size={12} />
                                                <span className="text-xs">{shelter.responsible_phone || shelter.contact_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {shelter.observations && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                            OBSERVAÇÕES
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed italic">
                                            "{shelter.observations}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Donation Summary Card */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Doações</h2>
                                <Gift className="w-5 h-5 text-slate-400" />
                            </div>
                            {donations.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4 italic">Nenhuma doação registrada.</p>
                            ) : (
                                <div className="space-y-3">
                                    {donations.slice(0, 3).map((donation) => (
                                        <div key={donation.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-800 truncate">
                                                    {donation.item_description}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {donation.quantity} {donation.unit} • {donation.donor_name || 'Anônimo'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {donations.length > 3 && (
                                        <button className="w-full text-center text-xs font-bold text-[#2a5299] py-2">
                                            Ver todas as doações
                                        </button>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Estimated Needs Card */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Necessidades (7 dias)</h2>
                                <Calculator className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="space-y-4">
                                {estimatedNeeds.map((need, index) => {
                                    const Icon = iconMap[need.icon] || Package;
                                    return (
                                        <div key={index} className="flex items-start gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Icon size={20} className="text-[#2a5299]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                                        {need.category}
                                                    </div>
                                                    <div className="text-sm font-black text-[#2a5299]">
                                                        {need.quantity} {need.unit}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold mb-1">
                                                    {need.item}
                                                </div>
                                                <div className="text-[9px] text-slate-400 italic">
                                                    {need.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-[10px] text-amber-700 font-bold text-center uppercase tracking-widest">
                                    Cálculo baseado na ocupação atual
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShelterDetail;
