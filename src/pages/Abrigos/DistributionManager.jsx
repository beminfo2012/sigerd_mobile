import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, Trash2, Search, Calendar, MapPin, Package, AlertCircle } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { getDistributions, getShelters, deleteDistribution } from '../../services/shelterDb.js';
import { toast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';

export default function DistributionManager() {
    const navigate = useNavigate();
    const [distributions, setDistributions] = useState([]);
    const [shelters, setShelters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [itemToDelete, setItemToDelete] = useState(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const dists = await getDistributions();
            const sh = await getShelters();
            setDistributions(dists ? dists.reverse() : []);
            setShelters(sh || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Não foi possível carregar o histórico de distribuições.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getShelterName = (id) => {
        if (!id) return 'Desconhecido';
        if (id === 'CENTRAL') return 'Base Central (MCI)';
        if (id === 'SOLIDARY') return 'Hub Solidário';
        const s = shelters.find(s => String(s.id) === String(id) || String(s.shelter_id) === String(id) || String(s.supabase_id) === String(id));
        return s ? s.name : 'Abrigo Desconhecido';
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            // Se for um grupo (romaneio com múltiplos itens), apaga todos
            if (itemToDelete.rawDistributions) {
                for (const dist of itemToDelete.rawDistributions) {
                    await deleteDistribution(dist.distribution_id || dist.id);
                }
            } else {
                await deleteDistribution(itemToDelete.distribution_id || itemToDelete.id);
            }
            toast.success('Sucesso', 'Remessa excluída e invalidada no sistema.');
            setItemToDelete(null);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Ocorreu um erro ao excluir a remessa.');
        }
    };

    const filteredList = distributions.filter(dist => 
        (dist.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dist.recipient_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping logic for "Romaneio" style
    const groupedDistributions = filteredList.reduce((acc, dist) => {
        // Group by minute + destination + origin
        const dateKey = new Date(dist.distribution_date || dist.created_at).toISOString().substring(0, 16);
        
        const isTransfer = dist.type === 'transfer' || (dist.recipient_name && dist.recipient_name.includes('TRANSFERÊNCIA ->'));
        let destKey = dist.recipient_name;
        if (isTransfer) {
            destKey = dist.destination_shelter_id || (dist.recipient_name ? dist.recipient_name.replace('TRANSFERÊNCIA ->', '').trim() : '');
        }

        const key = `${dateKey}_${destKey}_${dist.shelter_id}`;
        
        if (!acc[key]) {
            acc[key] = {
                id: dist.id || dist.distribution_id,
                date: dist.distribution_date || dist.created_at,
                origin: dist.shelter_id,
                destination: destKey,
                isTransfer: isTransfer,
                type: dist.type,
                items: [],
                rawDistributions: []
            };
        }
        acc[key].items.push({
            id: dist.id || dist.distribution_id,
            name: dist.item_name,
            qty: dist.quantity,
            unit: dist.unit
        });
        acc[key].rawDistributions.push(dist);
        return acc;
    }, {});

    const displayGroups = Object.values(groupedDistributions).sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleEdit = (group) => {
        toast.info('Edição de Remessa', 'O módulo de edição de itens do romaneio está sendo habilitado. Por enquanto, exclua o romaneio e recrie caso tenha errado as quantidades.');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            <div className="max-w-4xl mx-auto px-4 py-6">
                
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={() => navigate('/assisthumanitaria')}
                        className="flex items-center gap-2 text-[#2a5299] dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Truck className="text-[#2a5299]" /> Gestão de Saídas e Transferências
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Histórico de remessas consolidadas (Romaneios).
                            </p>
                        </div>
                        <Button onClick={() => navigate('/assisthumanitaria/logistica/novo')} className="whitespace-nowrap shadow-md">
                            Nova Solicitação / Remessa
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <Input
                        icon={Search}
                        placeholder="Buscar por item ou destinatário..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">Carregando histórico...</div>
                    ) : displayGroups.length === 0 ? (
                        <Card className="p-10 text-center flex flex-col items-center justify-center border-dashed border-2 bg-transparent shadow-none">
                            <AlertCircle className="text-slate-300 mb-2 w-10 h-10" />
                            <h3 className="text-slate-600 font-bold">Nenhuma remessa encontrada</h3>
                            <p className="text-slate-400 text-sm">Realize uma nova solicitação para iniciar o histórico.</p>
                        </Card>
                    ) : (
                        displayGroups.map((group) => (
                            <Card key={group.id} className="p-0 overflow-hidden flex flex-col md:flex-row border-l-4 border-l-[#2a5299] transition-all hover:shadow-md">
                                <div className="flex-1 p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-1">
                                                <Calendar size={12} />
                                                {new Date(group.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                            </div>
                                            <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                                                Remessa #{String(group.id).substring(0,8).toUpperCase()}
                                                {group.isTransfer && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full uppercase tracking-widest font-bold">Transferência Interna</span>
                                                )}
                                            </h3>
                                        </div>
                                    </div>
                                    
                                    {/* Items in this group */}
                                    <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Produtos da Remessa ({group.items.length})</div>
                                        <ul className="space-y-1">
                                            {group.items.map((item, idx) => (
                                                <li key={idx} className="flex justify-between text-sm">
                                                    <span className="font-medium text-slate-700">{item.name}</span>
                                                    <span className="font-black text-[#2a5299]">{item.qty} {item.unit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                        <div className="flex items-start gap-2 text-sm">
                                            <Package size={16} className="text-slate-400 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Origem</div>
                                                <div className="font-semibold text-slate-700">{getShelterName(group.origin)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin size={16} className="text-[#2a5299] mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-[#2a5299] uppercase">Destino</div>
                                                <div className="font-black text-slate-800">{group.isTransfer ? getShelterName(group.destination) : (group.destination || 'Destinatário não informado')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 border-t md:border-t-0 md:border-l border-slate-100 flex flex-row md:flex-col items-center justify-center gap-2 md:w-32">
                                    <Button 
                                        variant="secondary"
                                        className="w-full flex justify-center text-sm py-2"
                                        onClick={() => handleEdit(group)}
                                    >
                                        Editar
                                    </Button>
                                    <button 
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors w-full flex justify-center mt-2"
                                        title="Excluir/Estornar Romaneio"
                                        onClick={() => setItemToDelete(group)}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                title="Excluir Remessa?"
                message={`Deseja excluir esta remessa completa contendo ${itemToDelete?.items.length} produto(s)? Essa ação removerá os registros selecionados.`}
                confirmText="Excluir Registro"
                type="danger"
            />
        </div>
    );
}
