import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Users, Phone, User, ArrowLeft,
    Plus, Gift, TrendingUp, Heart, LogOut,
    Crown, ChevronDown, ChevronUp, Package, Building2,
    Droplets, Bed, Shirt, Calculator, Edit, FileText
} from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Badge } from '../../components/Shelter/ui/Badge.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { getShelterById, getOccupants, getDonations, getInventory, updateShelter, deleteShelter, exitOccupant, getShelterTransfers } from '../../services/shelterDb.js';
import { calculateShelterNeeds } from '../../utils/needsCalculator';
import { useOperacao } from '../../contexts/OperacaoContext';
import { operacoesService } from '../../services/operacoesService';
import toast from 'react-hot-toast';

export function ShelterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { operacaoAtiva } = useOperacao();
    const [viewMode, setViewMode] = useState('individual'); // individual or family
    const [expandedFamilies, setExpandedFamilies] = useState({});
    
    // Modal states
    const [isOccupantsModalOpen, setIsOccupantsModalOpen] = useState(false);
    const [modalViewMode, setModalViewMode] = useState('individual');
    const [expandedModalFamilies, setExpandedModalFamilies] = useState({});

    const [shelter, setShelter] = useState(undefined);
    const [occupants, setOccupants] = useState([]);
    const [donations, setDonations] = useState([]);
    const [distributions, setDistributions] = useState([]);
    const [inventory, setInventory] = useState([]);
    
    // Modal states
    const [isDonationsModalOpen, setIsDonationsModalOpen] = useState(false);
    const [isDistributionsModalOpen, setIsDistributionsModalOpen] = useState(false);
    const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const [occupantToExit, setOccupantToExit] = useState(null);

    // Report Modal
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [operationsList, setOperationsList] = useState([]);
    const [selectedOperationId, setSelectedOperationId] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            // Handle both string and int IDs seamlessly by passing raw ID to service
            const s = await getShelterById(id);
            const o = await getOccupants(id);
            const d = await getDonations(id);
            const i = await getInventory(id);
            const t = await getShelterTransfers(id);

            setShelter(s || null); // null indicates "not found", undefined "loading"
            setOccupants(o || []);
            setInventory(i || []);

            // Mesclar doações com transferências recebidas
            const receivedTransfers = (t.incoming || []).map(tr => ({
                id: tr.id || tr.distribution_id,
                item_description: tr.item_name,
                quantity: tr.quantity,
                unit: tr.unit,
                donor_name: 'Transferência Interna (MCI)',
                donation_date: tr.distribution_date || tr.created_at
            }));
            setDonations([...(d || []), ...receivedTransfers].sort((a,b) => new Date(b.donation_date) - new Date(a.donation_date)));
            
            // Gravar saídas no estado
            setDistributions(t.outgoing || []);
        };
        loadData();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Tem certeza que deseja excluir este abrigo? Esta ação não pode ser desfeita e removerá o abrigo da listagem.')) {
            try {
                await deleteShelter(id);
                alert('Abrigo excluído com sucesso.');
                navigate('/assisthumanitaria/lista');
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir abrigo.');
            }
        }
    };

    const handleExitClick = (occupantId) => {
        setOccupantToExit(occupantId);
        setIsExitModalOpen(true);
    };

    const confirmExit = async () => {
        if (!occupantToExit) return;
        try {
            await exitOccupant(occupantToExit, id);
            toast.success('Saída registrada com sucesso!');
            const occ = await getOccupants(id);
            setOccupants(occ || []);
        } catch (error) {
            console.error('Error exiting occupant:', error);
            toast.error('Erro ao registrar saída.');
        } finally {
            setIsExitModalOpen(false);
            setOccupantToExit(null);
        }
    };

    const handleToggleStatus = () => {
        setIsToggleModalOpen(true);
    };

    const confirmToggleStatus = async () => {
        setIsToggleModalOpen(false);
        const newStatus = shelter.status === 'active' ? 'inactive' : 'active';
        if (newStatus === 'active' && !operacaoAtiva) {
            toast.error('Não é possível ativar um abrigo sem uma operação em andamento.');
            return;
        }
        try {
            await updateShelter(id, { status: newStatus });
            setShelter({ ...shelter, status: newStatus });
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            toast.error('Erro ao alterar status do abrigo.');
        }
    };

    const handleOpenReportModal = async () => {
        setIsReportModalOpen(true);
        if (operationsList.length === 0) {
            try {
                const ops = await operacoesService.getAllOperacoes();
                setOperationsList(ops || []);
                if (operacaoAtiva) {
                    setSelectedOperationId(operacaoAtiva.id);
                }
            } catch (error) {
                console.error("Erro ao carregar operações", error);
            }
        } else if (operacaoAtiva && selectedOperationId === 'all') {
            setSelectedOperationId(operacaoAtiva.id);
        }
    };

    const generateSpecificReport = () => {
        setIsReportModalOpen(false);
        window.open(`/assisthumanitaria/${id}/imprimir?operacao_id=${selectedOperationId}`, '_blank');
    };

    if (shelter === undefined) return null; // Loading state

    if (!shelter) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Abrigo não encontrado</h1>
                    <Button onClick={() => navigate('/assisthumanitaria')}>Voltar ao Dashboard</Button>
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

    const activeOccupants = occupants.filter(o => o.status !== 'exited');

    const toggleFamily = (group) => {
        setExpandedFamilies(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const toggleModalFamily = (group) => {
        setExpandedModalFamilies(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const families = activeOccupants.reduce((acc, occ) => {
        const group = occ.family_group || 'Sem Grupo';
        if (!acc[group]) acc[group] = [];
        acc[group].push(occ);
        return acc;
    }, {});
    
    const allFamilies = occupants.reduce((acc, occ) => {
        const group = occ.family_group || 'Sem Grupo';
        if (!acc[group]) acc[group] = [];
        acc[group].push(occ);
        return acc;
    }, {});

    const estimatedNeeds = calculateShelterNeeds(shelter.current_occupancy || activeOccupants.length);

    const iconMap = {
        Package,
        Droplets,
        Heart,
        Bed,
        Shirt
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {isToggleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Alterar Status</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Deseja alterar o abrigo para <strong className={shelter.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}>{shelter.status === 'active' ? 'INATIVO (Fechado)' : 'ATIVO (Aberto)'}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" onClick={() => setIsToggleModalOpen(false)} className="flex-1">Cancelar</Button>
                            <Button type="button" onClick={confirmToggleStatus} className={`flex-1 text-white ${shelter.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isExitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Registrar Saída</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Tem certeza que deseja registrar a saída deste abrigado do abrigo?
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" onClick={() => setIsExitModalOpen(false)} className="flex-1">Cancelar</Button>
                            <Button type="button" onClick={confirmExit} className="flex-1 text-white bg-red-600 hover:bg-red-700">
                                Confirmar Saída
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isReportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Gerar Relatório</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Selecione a operação para a qual deseja gerar o relatório deste abrigo.
                        </p>
                        <div className="mb-6 text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-2">Operação Relacionada</label>
                            <select 
                                value={selectedOperationId} 
                                onChange={(e) => setSelectedOperationId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Todas (Visão Geral)</option>
                                {operationsList.map(op => (
                                    <option key={op.id} value={op.id}>{op.nome} ({op.status})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" onClick={() => setIsReportModalOpen(false)} className="flex-1">Cancelar</Button>
                            <Button type="button" onClick={generateSpecificReport} className="flex-1 text-white bg-blue-600 hover:bg-blue-700">
                                Gerar PDF
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/assisthumanitaria/lista')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold w-fit hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar à Lista
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-black text-slate-800">{shelter.name}</h1>
                                <Badge status={shelter.status || 'active'}>
                                    {statusLabels[shelter.status] || 'ATIVO'}
                                </Badge>
                                <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 ml-2">
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${shelter.status === 'active' ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                        title={shelter.status === 'active' ? 'Fechar Abrigo' : 'Reabrir Abrigo'}
                                    >
                                        {shelter.status === 'active' ? 'Inativar' : 'Ativar'}
                                    </button>
                                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                                    <button
                                        onClick={() => navigate(`/assisthumanitaria/editar/${id}`)}
                                        className="p-1.5 text-[#2a5299] hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Editar Abrigo"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                                    <button
                                        onClick={handleOpenReportModal}
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Gerar Relatório"
                                    >
                                        <FileText size={16} />
                                    </button>
                                </div>
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
                            {activeOccupants.length}
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
                                onClick={() => navigate(`/assisthumanitaria/${id}/abrigados/novo`)}
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
                                onClick={() => navigate(`/assisthumanitaria/${id}/doacoes/novo`)}
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
                                onClick={() => navigate(`/assisthumanitaria/${id}/distribuicoes/novo`)}
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
                                        <Badge status="active">{activeOccupants.length}</Badge>
                                        <button 
                                            onClick={() => setIsOccupantsModalOpen(true)}
                                            className="ml-2 text-xs font-bold text-[#2a5299] hover:underline"
                                        >
                                            Ver histórico completo
                                        </button>
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

                                {activeOccupants.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-8 italic">Nenhum abrigado cadastrado.</p>
                                ) : viewMode === 'individual' ? (
                                    <div className="space-y-3">
                                        {activeOccupants.map((occupant) => (
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
                                                        onClick={(e) => { e.stopPropagation(); handleExitClick(occupant.id); }}
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
                                                                    onClick={() => handleExitClick(member.id)}
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
                                {inventory.filter(i => parseFloat(i.quantity || 0) > 0).length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4 italic">Nenhum item em estoque.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {inventory.filter(i => parseFloat(i.quantity || 0) > 0).map((item) => {
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
                                        <button 
                                            onClick={() => setIsDonationsModalOpen(true)}
                                            className="w-full text-center text-xs font-bold text-[#2a5299] py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            Ver todas as entradas ({donations.length})
                                        </button>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Distributions Summary Card */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Saídas / Distribuições</h2>
                                <TrendingUp className="w-5 h-5 text-slate-400" />
                            </div>
                            {distributions.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4 italic">Nenhuma distribuição realizada.</p>
                            ) : (
                                <div className="space-y-3">
                                    {distributions.slice(0, 3).map((dist) => (
                                        <div key={dist.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-800 truncate">
                                                    {dist.item_name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {dist.quantity} {dist.unit} • Para: {dist.recipient_name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {distributions.length > 3 && (
                                        <button 
                                            onClick={() => setIsDistributionsModalOpen(true)}
                                            className="w-full text-center text-xs font-bold text-[#2a5299] py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            Ver todas as saídas ({distributions.length})
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

            {/* Modal de Doações/Entradas */}
            {isDonationsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-[#2a5299]" /> Histórico de Entradas
                            </h3>
                            <button onClick={() => setIsDonationsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
                            {donations.map((donation) => (
                                <div key={donation.id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-800 truncate">{donation.item_description}</div>
                                        <div className="text-xs text-slate-500">{donation.quantity} {donation.unit} • Origem: {donation.donor_name || 'Anônimo'}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{new Date(donation.donation_date).toLocaleDateString('pt-BR')} {new Date(donation.donation_date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100">
                            <Button className="w-full" onClick={() => setIsDonationsModalOpen(false)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Saídas/Distribuições */}
            {isDistributionsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#2a5299]" /> Histórico de Saídas
                            </h3>
                            <button onClick={() => setIsDistributionsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
                            {distributions.map((dist) => (
                                <div key={dist.id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-slate-800 truncate">{dist.item_name}</div>
                                        <div className="text-xs text-slate-500">{dist.quantity} {dist.unit} • Para: {dist.recipient_name}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{new Date(dist.distribution_date || dist.created_at).toLocaleDateString('pt-BR')} {new Date(dist.distribution_date || dist.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100">
                            <Button className="w-full" onClick={() => setIsDistributionsModalOpen(false)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Histórico de Abrigados */}
            {isOccupantsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#2a5299]" /> Histórico Completo de Abrigados
                            </h3>
                            <button onClick={() => setIsOccupantsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="text-sm text-slate-600 font-bold">
                                Total: {occupants.length} registros ({activeOccupants.length} ativos)
                            </div>
                            <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setModalViewMode('individual')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalViewMode === 'individual' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500'}`}
                                >
                                    INDIVIDUAL
                                </button>
                                <button
                                    onClick={() => setModalViewMode('family')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${modalViewMode === 'family' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500'}`}
                                >
                                    POR FAMÍLIA
                                </button>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50 custom-scrollbar">
                            {occupants.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8 italic">Nenhum histórico encontrado.</p>
                            ) : modalViewMode === 'individual' ? (
                                <div className="space-y-3">
                                    {occupants.map((occupant) => (
                                        <div key={occupant.id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${occupant.status === 'exited' ? 'bg-slate-100' : 'bg-emerald-100'}`}>
                                                <User size={20} className={occupant.status === 'exited' ? 'text-slate-400' : 'text-emerald-600'} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-sm font-semibold truncate ${occupant.status === 'exited' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                        {occupant.full_name}
                                                    </div>
                                                    {occupant.status === 'exited' && (
                                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-bold uppercase">Saiu</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {occupant.age} anos • {occupant.gender === 'masculino' ? 'M' : occupant.gender === 'feminino' ? 'F' : 'Outro'}
                                                    {occupant.family_group && ` • Grp: ${occupant.family_group}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {Object.entries(allFamilies).map(([groupName, members]) => (
                                        <div key={groupName} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                            <button
                                                onClick={() => toggleModalFamily(groupName)}
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
                                                {expandedModalFamilies[groupName] ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
                                            </button>

                                            {expandedModalFamilies[groupName] && (
                                                <div className="bg-slate-50/50 p-3 space-y-2 border-t border-slate-50">
                                                    {members.map(member => (
                                                        <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100/50">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.status === 'exited' ? 'bg-slate-100' : member.is_family_head ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                                    {member.status === 'exited' ? <User size={14} className="text-slate-400" /> : member.is_family_head ? <Crown size={14} className="text-amber-600" /> : <User size={14} className="text-slate-400" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className={`text-xs font-bold truncate ${member.status === 'exited' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                                        {member.full_name}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500">
                                                                        {member.age} anos • {member.status === 'exited' ? 'Saiu do abrigo' : 'Ativo'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100">
                            <Button className="w-full" onClick={() => setIsOccupantsModalOpen(false)}>Fechar Histórico</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShelterDetail;
