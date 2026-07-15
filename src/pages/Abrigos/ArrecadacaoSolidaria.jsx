import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HeartHandshake, PackageOpen, Truck, Gift, RefreshCw, AlertCircle, History, ArrowDownToLine, ArrowUpFromLine, Trash2, Search, Calendar, MapPin, X, Filter, Download } from 'lucide-react';
import { getShelters, addShelter, getInventory, addDonation, addDistribution, getDonations, getDistributions, deleteDonation, deleteDistribution } from '../../services/shelterDb';
import { Card } from '../../components/Shelter/ui/Card';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ArrecadacaoSolidaria() {
    const navigate = useNavigate();
    const [hub, setHub] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [donations, setDonations] = useState([]);
    const [distributions, setDistributions] = useState([]);
    const [loading, setLoading] = useState(true);

    const COMMON_ITEMS = [
        'Água Potável (Fardo)', 'Cesta Básica', 'Kit Higiene Pessoal', 'Kit Limpeza',
        'Colchão', 'Cobertor', 'Roupas (Fardo)', 'Telha Fibrocimento', 'Lona Plástica'
    ];

    const [isDonating, setIsDonating] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    
    // Quick Forms State
    const [itemDesc, setItemDesc] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemUnit, setItemUnit] = useState('unidades');
    const [recipient, setRecipient] = useState('');
    const [dispatchList, setDispatchList] = useState([]);
    const [uniqueRecipients, setUniqueRecipients] = useState([]);

    const HUB_NAME = 'POLO DE ARRECADAÇÃO SOLIDÁRIA - TERCEIROS';

    const [userProfile, setUserProfile] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyDateStartFilter, setHistoryDateStartFilter] = useState('');
    const [historyDateEndFilter, setHistoryDateEndFilter] = useState('');
    const [historyLocationFilter, setHistoryLocationFilter] = useState('');
    const [historyItemFilter, setHistoryItemFilter] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState(''); // 'IN' ou 'OUT'

    useEffect(() => {
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            setUserProfile(JSON.parse(stored));
        }
        loadOrInitializeHub();
    }, []);

    const isAdminOrCoord = userProfile?.role === 'Admin' || userProfile?.role === 'Administrador' || userProfile?.role === 'administrador' || userProfile?.role === 'Coordenador' || userProfile?.role === 'Coordenador de Proteção e Defesa Civil' || userProfile?.role === 'admin';

    const loadOrInitializeHub = async () => {
        try {
            setLoading(true);
            setHub({ id: 'SOLIDARY', name: HUB_NAME });
            
            // Clean up any mistakenly created virtual shelters
            const shelters = await getShelters();
            const virtualShelters = shelters.filter(s => s.name === HUB_NAME && s.status !== 'deleted');

            const { initDB } = await import('../../services/db');
            const db = await initDB();

            if (virtualShelters.length > 0) {
                const tx = db.transaction(['shelters', 'donations', 'inventory', 'distributions'], 'readwrite');
                const store = tx.objectStore('shelters');
                const donStore = tx.objectStore('donations');
                const invStore = tx.objectStore('inventory');
                const distStore = tx.objectStore('distributions');
                
                for (const s of virtualShelters) {
                    await store.put({ ...s, status: 'deleted', synced: false });
                    
                    const allDon = await donStore.getAll();
                    for(const d of allDon.filter(d => String(d.shelter_id) === String(s.id) || String(d.shelter_id) === String(s.shelter_id))) {
                        await donStore.put({ ...d, status: 'deleted', synced: false });
                    }
                    
                    const allInv = await invStore.getAll();
                    for(const i of allInv.filter(i => String(i.shelter_id) === String(s.id) || String(i.shelter_id) === String(s.shelter_id))) {
                        await invStore.put({ ...i, status: 'deleted', synced: false });
                    }

                    const allDist = await distStore.getAll();
                    for(const d of allDist.filter(d => String(d.shelter_id) === String(s.id) || String(d.shelter_id) === String(s.shelter_id))) {
                        await distStore.put({ ...d, status: 'deleted', synced: false });
                    }
                }
                await tx.done;
                
                const { shelterSyncService } = await import('../../services/shelterSyncService');
                shelterSyncService.syncPending();
            }

            // === RECOVERY: Fix corrupted records where shelter_id was lost after sync ===
            try {
                const tx2 = db.transaction(['donations', 'inventory', 'distributions'], 'readwrite');
                const stores = {
                    donations: tx2.objectStore('donations'),
                    inventory: tx2.objectStore('inventory'),
                    distributions: tx2.objectStore('distributions'),
                };
                let repaired = 0;
                for (const [name, st] of Object.entries(stores)) {
                    const all = await st.getAll();
                    for (const rec of all) {
                        if (rec.observations && rec.observations.includes('[HUB:SOLIDARY]') && rec.shelter_id !== 'SOLIDARY') {
                            await st.put({
                                ...rec,
                                shelter_id: 'SOLIDARY',
                                observations: rec.observations.replace('[HUB:SOLIDARY]', '').trim(),
                                synced: true
                            });
                            repaired++;
                        } else if (rec.observations && rec.observations.includes('[HUB:CENTRAL]') && rec.shelter_id !== 'CENTRAL') {
                            await st.put({
                                ...rec,
                                shelter_id: 'CENTRAL',
                                observations: rec.observations.replace('[HUB:CENTRAL]', '').trim(),
                                synced: true
                            });
                            repaired++;
                        }
                    }
                }
                await tx2.done;
                if (repaired > 0) console.log(`[Solidário] Recuperados ${repaired} registros com shelter_id corrompido.`);
            } catch(e) {
                console.warn('[Solidário] Falha na recuperação de registros:', e);
            }

            // === DEDUP INVENTORY: Merge duplicate SOLIDARY inventory items (same item_name) ===
            try {
                const tx3 = db.transaction('inventory', 'readwrite');
                const invSt = tx3.objectStore('inventory');
                const allInv = await invSt.getAll();
                const solidaryItems = allInv.filter(i => i.shelter_id === 'SOLIDARY' && i.status !== 'deleted');
                
                // Group by item_name
                const grouped = {};
                for (const item of solidaryItems) {
                    const key = (item.item_name || '').toLowerCase().trim();
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(item);
                }

                for (const [, group] of Object.entries(grouped)) {
                    if (group.length <= 1) continue;
                    // Sort: unsynced first (most recent local changes), then by updated_at desc
                    group.sort((a, b) => {
                        if (a.synced === false && b.synced !== false) return -1;
                        if (b.synced === false && a.synced !== false) return 1;
                        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
                    });
                    // Keep the FIRST (most authoritative), delete the rest
                    const [keep, ...duplicates] = group;
                    console.log(`[Solidário] Dedup: mantendo ${keep.item_name} qty=${keep.quantity}, removendo ${duplicates.length} duplicatas`);
                    for (const dup of duplicates) {
                        await invSt.delete(dup.id);
                    }
                }
                await tx3.done;
            } catch(e) {
                console.warn('[Solidário] Falha na deduplicação de inventário:', e);
            }
            // === END DEDUP ===
            
            loadInventory('SOLIDARY');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao inicializar o Polo Solidário');
            setLoading(false);
        }
    };

    const loadInventory = async (id, forceLocal = false) => {
        try {
            setLoading(true);
            const inv = await getInventory(id, forceLocal);
            setInventory(inv.filter(i => i.quantity > 0));
            
            const [dons, dists] = await Promise.all([
                getDonations(id),
                getDistributions(id)
            ]);
            setDonations(dons || []);
            setDistributions(dists || []);

            // Extrair municípios únicos para autocompletar
            if (dists && dists.length > 0) {
                const unq = [...new Set(dists.map(d => d.recipient_name).filter(Boolean))];
                setUniqueRecipients(unq);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async (e) => {
        e.preventDefault();
        if (!itemDesc || !itemQty || parseFloat(itemQty) <= 0) {
            toast.error('Preencha os campos corretamente');
            return;
        }

        try {
            await addDonation({
                destination_type: 'SHELTER',
                shelter_id: hub.id,
                item_description: itemDesc,
                quantity: parseFloat(itemQty),
                unit: itemUnit,
                donation_type: 'outro'
            });
            toast.success('Entrada solidária registrada!');
            setIsDonating(false);
            setItemDesc('');
            setItemQty('');
            loadInventory(hub.id, true);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao registrar entrada');
        }
    };

    const addToDispatchList = (e) => {
        e.preventDefault();
        if (!itemDesc || !itemQty || parseFloat(itemQty) <= 0) {
            toast.error('Preencha os campos do item corretamente');
            return;
        }

        const item = inventory.find(i => i.item_name.toLowerCase() === itemDesc.toLowerCase());
        if (!item) {
            toast.error('Item não encontrado no estoque solidário');
            return;
        }
        
        // Verificar quantidade total (incluindo o que já está na lista)
        const alreadyInList = dispatchList.filter(d => d.item_name === item.item_name).reduce((acc, curr) => acc + curr.quantity, 0);
        const totalRequested = alreadyInList + parseFloat(itemQty);
        
        if (parseFloat(item.quantity) < totalRequested) {
            toast.error('Quantidade insuficiente em estoque (considerando itens já na lista)');
            return;
        }

        setDispatchList([...dispatchList, {
            ...item,
            quantity: parseFloat(itemQty),
            unit: itemUnit
        }]);
        
        // Reset item fields
        setItemDesc('');
        setItemQty('');
    };

    const submitDispatch = async () => {
        if (!recipient) {
            toast.error('Preencha o Destino (Município)');
            return;
        }
        if (dispatchList.length === 0) {
            toast.error('Adicione pelo menos um item para despachar');
            return;
        }

        try {
            // addDistribution expects a single object - merge item info with dispatch params
            for (const item of dispatchList) {
                await addDistribution({
                    inventory_id: item.id,          // local IDB id of inventory record
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit: item.unit || item.unit,
                    recipient_name: recipient,
                    shelter_id: hub.id,             // 'SOLIDARY'
                    distribution_date: new Date().toISOString(),
                });
            }
            
            toast.success('Envio solidário em lote registrado!');
            setIsDispatching(false);
            setDispatchList([]);
            setRecipient('');
            loadInventory(hub.id, true);
        } catch (error) {
            console.error(error);
            toast.error(`Erro ao registrar saída: ${error.message}`);
        }
    };

    const handleDeleteHistory = async (mov) => {
        if (!isAdminOrCoord) return;
        if (!window.confirm('Tem certeza que deseja excluir este registro? O estoque será recalculado na próxima sincronização.')) return;
        
        try {
            if (mov.type === 'IN') {
                await deleteDonation(mov.id);
            } else {
                await deleteDistribution(mov.id);
            }
            toast.success('Registro excluído e estoque atualizado com sucesso');
            loadInventory(hub.id, true);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao excluir registro');
        }
    };

    const handleExportPDF = (filteredMovs) => {
        const doc = new jsPDF('landscape');
        
        doc.setFontSize(16);
        doc.text('Relatório de Auditoria - Polo Solidário', 14, 15);
        
        doc.setFontSize(10);
        let subtitle = `Período: ${historyDateStartFilter ? new Date(historyDateStartFilter).toLocaleDateString('pt-BR') : 'Início'} até ${historyDateEndFilter ? new Date(historyDateEndFilter).toLocaleDateString('pt-BR') : 'Hoje'}`;
        if (historyTypeFilter) subtitle += ` | Tipo: ${historyTypeFilter === 'IN' ? 'Entrada' : 'Saída'}`;
        if (historyLocationFilter) subtitle += ` | Local: ${historyLocationFilter}`;
        if (historyItemFilter) subtitle += ` | Item: ${historyItemFilter}`;
        doc.text(subtitle, 14, 22);
        
        const tableColumn = ["Data", "Movimento", "Item", "Quantidade", "Local (Origem/Destino)"];
        const tableRows = [];

        filteredMovs.forEach(mov => {
            const movData = [
                new Date(mov.created_at).toLocaleString('pt-BR'),
                mov.type === 'IN' ? 'Entrada' : 'Saída',
                mov.item_description || mov.item_name,
                `${mov.type === 'IN' ? '+' : '-'}${mov.quantity} ${mov.unit}`,
                mov.type === 'IN' ? 'Doação Externa' : mov.recipient_name
            ];
            tableRows.push(movData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [225, 29, 72] }
        });

        doc.save('Auditoria_Polo_Solidario.pdf');
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 flex items-center justify-center">
            <RefreshCw className="animate-spin text-rose-500" size={32} />
        </div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100 font-sans">
            <header className="bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800 px-4 h-16 flex items-center justify-between shadow-sm transition-all">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/assisthumanitaria')} className="p-2 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black leading-tight text-rose-600 dark:text-rose-400">ARRECADAÇÃO SOLIDÁRIA</h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Apoio a Terceiros Municípios</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 mb-8 flex items-start gap-4 shadow-sm">
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-rose-500">
                        <HeartHandshake size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-rose-700 dark:text-rose-400 mb-1">Polo de Arrecadação Regional</h2>
                        <p className="text-sm text-rose-600/80 dark:text-rose-400/80 font-medium">
                            Este módulo mantém separação contábil rígida. Tudo que entra aqui <strong>não se mistura com o estoque municipal local</strong> e é destinado exclusivamente ao envio para outros municípios afetados.
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => { setIsDonating(true); setIsDispatching(false); setItemDesc(''); setItemQty(''); }}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-500 transition-colors group shadow-sm"
                    >
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                            <Gift size={28} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Receber Arrecadação</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registrar entrada no polo</p>
                    </button>

                    <button 
                        onClick={() => { setIsDispatching(true); setIsDonating(false); setItemDesc(''); setItemQty(''); setRecipient(''); setDispatchList([]); }}
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-purple-800/50 hover:border-purple-500 transition-colors group shadow-sm"
                    >
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                            <Truck size={28} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Despachar para Município</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registrar saída do polo</p>
                    </button>
                </div>

                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <PackageOpen size={20} className="text-slate-400" />
                    Estoque em Trânsito (Disponível)
                </h3>

                {inventory.filter(i => i.quantity > 0).length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 p-10 text-center shadow-sm">
                        <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                        <h4 className="font-bold text-lg text-slate-600 dark:text-slate-300">Nenhum item no polo solidário</h4>
                        <p className="text-sm text-slate-400">O estoque de passagem está vazio no momento.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {inventory.filter(i => i.quantity > 0).map(item => (
                            <Card key={item.id} className="p-4 border-l-4 border-l-rose-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.item_name}</h4>
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{item.category || 'Outros'}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-rose-600">{item.quantity}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{item.unit || 'unidades'}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-12">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-black flex items-center gap-2">
                            <History size={20} className="text-slate-400" />
                            Histórico de Movimentações
                        </h3>
                        <button 
                            onClick={() => setShowHistoryModal(true)}
                            className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 py-2 px-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Filter size={14} />
                            Ver Completo
                        </button>
                    </div>
                    
                    {[...donations, ...distributions].length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 p-8 text-center shadow-sm">
                            <p className="text-sm text-slate-400">Nenhum histórico registrado.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Data</th>
                                            <th className="px-6 py-4">Movimento</th>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Quantidade</th>
                                            <th className="px-6 py-4">Destino / Origem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {[...donations.map(d => ({...d, type: 'IN'})), ...distributions.map(d => ({...d, type: 'OUT'}))]
                                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                            .slice(0, 5)
                                            .map(mov => (
                                            <tr key={mov.id || mov.created_at} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(mov.created_at).toLocaleString('pt-BR')}</td>
                                                <td className="px-6 py-4">
                                                    {mov.type === 'IN' ? (
                                                        <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 dark:bg-emerald-900/20 px-2 py-1 rounded-md w-max">
                                                            <ArrowDownToLine size={14} /> Entrada
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-purple-600 font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md w-max">
                                                            <ArrowUpFromLine size={14} /> Saída
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 dark:text-slate-300">
                                                    {mov.item_description || mov.item_name}
                                                </td>
                                                <td className="px-6 py-4 font-black">
                                                    {mov.type === 'IN' ? '+' : '-'}{mov.quantity} {mov.unit}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {mov.type === 'IN' ? 'Doação Externa' : mov.recipient_name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Entrada */}
            {isDonating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <form onSubmit={handleReceive} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Receber Arrecadação</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Item Arrecadado <span className="text-red-500">*</span></label>
                                <input required type="text" list="common_items_list" value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Ex: Fardo de Água" />
                                <datalist id="common_items_list">
                                    {COMMON_ITEMS.map(i => <option key={i} value={i} />)}
                                    {inventory.filter(inv => !COMMON_ITEMS.includes(inv.item_name)).map(i => <option key={i.id} value={i.item_name} />)}
                                </datalist>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Qtd. <span className="text-red-500">*</span></label>
                                    <input required type="number" step="0.01" value={itemQty} onChange={e => setItemQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Unidade</label>
                                    <select value={itemUnit} onChange={e => setItemUnit(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none">
                                        <option value="unidades">Unidades</option>
                                        <option value="kg">Kg</option>
                                        <option value="litros">Litros</option>
                                        <option value="fardos">Fardos</option>
                                        <option value="caixas">Caixas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsDonating(false)} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors">Confirmar Entrada</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Saída Lote */}
            {isDispatching && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Despachar Itens em Lote</h3>
                        
                        <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 dark:text-slate-300 mb-2">Destino (Município) <span className="text-red-500">*</span></label>
                            <input required type="text" list="recipients_list" value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Ex: Muçum / RS" />
                            <datalist id="recipients_list">
                                {uniqueRecipients.map(r => <option key={r} value={r} />)}
                            </datalist>
                        </div>

                        <form onSubmit={addToDispatchList} className="space-y-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Item a despachar (Selecione) <span className="text-red-500">*</span></label>
                                <select required value={itemDesc} onChange={e => {
                                    setItemDesc(e.target.value);
                                    const it = inventory.find(i => i.item_name === e.target.value);
                                    if(it) setItemUnit(it.unit);
                                }} className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none">
                                    <option value="" disabled>Selecione um item em estoque...</option>
                                    {inventory.filter(i => i.quantity > 0).map(i => <option key={i.id} value={i.item_name}>{i.item_name} (Disp: {i.quantity} {i.unit})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-1">Qtd. Envio <span className="text-red-500">*</span></label>
                                    <input required type="number" step="0.01" max={inventory.find(i => i.item_name === itemDesc)?.quantity || ''} value={itemQty} onChange={e => setItemQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="0" />
                                </div>
                                <button type="submit" className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition-colors w-full">Adicionar</button>
                            </div>
                        </form>

                        {dispatchList.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-2">Itens na Carga ({dispatchList.length})</h4>
                                <ul className="space-y-2">
                                    {dispatchList.map((item, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div>
                                                <span className="font-bold text-slate-700 dark:text-slate-200 dark:text-slate-300">{item.item_name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-purple-600">{item.quantity} {item.unit}</span>
                                                <button onClick={() => setDispatchList(dispatchList.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1 bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 rounded-md">
                                                    &times;
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsDispatching(false)} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors">Cancelar</button>
                            <button onClick={submitDispatch} disabled={dispatchList.length === 0} className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">Confirmar Envio Lote</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Histórico Completo */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <History size={24} className="text-rose-500" />
                                    Verificação e Histórico
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Painel de Auditoria do Polo Solidário</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 dark:border-slate-800 dark:border-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-end gap-3 md:gap-4">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><MapPin size={12}/> Local (Orig/Dest)</label>
                                <input 
                                    type="text" 
                                    value={historyLocationFilter} 
                                    onChange={e => setHistoryLocationFilter(e.target.value)} 
                                    placeholder="Buscar..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/50 text-sm"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><PackageOpen size={12}/> Item</label>
                                <input 
                                    type="text" 
                                    value={historyItemFilter} 
                                    onChange={e => setHistoryItemFilter(e.target.value)} 
                                    placeholder="Ex: Água..." 
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/50 text-sm"
                                />
                            </div>
                            <div className="w-[110px]">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><Filter size={12}/> Tipo</label>
                                <select 
                                    value={historyTypeFilter} 
                                    onChange={e => setHistoryTypeFilter(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/50 text-sm dark:text-white"
                                >
                                    <option value="">Todos</option>
                                    <option value="IN">Entrada</option>
                                    <option value="OUT">Saída</option>
                                </select>
                            </div>
                            <div className="flex gap-2 min-w-[240px]">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><Calendar size={12}/> Início</label>
                                    <input 
                                        type="date" 
                                        value={historyDateStartFilter} 
                                        onChange={e => setHistoryDateStartFilter(e.target.value)} 
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 outline-none focus:ring-2 focus:ring-rose-500/50 text-sm dark:text-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-1"><Calendar size={12}/> Fim</label>
                                    <input 
                                        type="date" 
                                        value={historyDateEndFilter} 
                                        onChange={e => setHistoryDateEndFilter(e.target.value)} 
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 outline-none focus:ring-2 focus:ring-rose-500/50 text-sm dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { 
                                        setHistoryLocationFilter(''); 
                                        setHistoryDateStartFilter(''); 
                                        setHistoryDateEndFilter('');
                                        setHistoryItemFilter('');
                                        setHistoryTypeFilter(''); 
                                    }}
                                    className="flex-1 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl transition-colors flex items-center justify-center h-10"
                                >
                                    Limpar
                                </button>
                                {(() => {
                                    const filtered = [...donations.map(d => ({...d, type: 'IN'})), ...distributions.map(d => ({...d, type: 'OUT'}))]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .filter(mov => {
                                            if (historyTypeFilter && mov.type !== historyTypeFilter) return false;
                                            if (historyDateStartFilter) {
                                                if (new Date(mov.created_at).toLocaleDateString('en-CA') < historyDateStartFilter) return false;
                                            }
                                            if (historyDateEndFilter) {
                                                if (new Date(mov.created_at).toLocaleDateString('en-CA') > historyDateEndFilter) return false;
                                            }
                                            if (historyLocationFilter) {
                                                const loc = (mov.type === 'IN' ? 'Doação Externa' : (mov.recipient_name || '')).toLowerCase();
                                                if (!loc.includes(historyLocationFilter.toLowerCase())) return false;
                                            }
                                            if (historyItemFilter) {
                                                const itemName = (mov.item_description || mov.item_name || '').toLowerCase();
                                                if (!itemName.includes(historyItemFilter.toLowerCase())) return false;
                                            }
                                            return true;
                                        });

                                    return (
                                        <button 
                                            onClick={() => handleExportPDF(filtered)}
                                            className="flex-1 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1 h-10"
                                            title="Exportar PDF"
                                        >
                                            <Download size={14} /> PDF
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Movimento</th>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Qtd.</th>
                                        <th className="px-6 py-4">Local (Origem/Destino)</th>
                                        {isAdminOrCoord && <th className="px-6 py-4 text-right">Ação</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {[...donations.map(d => ({...d, type: 'IN'})), ...distributions.map(d => ({...d, type: 'OUT'}))]
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .filter(mov => {
                                            if (historyTypeFilter && mov.type !== historyTypeFilter) return false;
                                            if (historyDateStartFilter) {
                                                if (new Date(mov.created_at).toLocaleDateString('en-CA') < historyDateStartFilter) return false;
                                            }
                                            if (historyDateEndFilter) {
                                                if (new Date(mov.created_at).toLocaleDateString('en-CA') > historyDateEndFilter) return false;
                                            }
                                            if (historyLocationFilter) {
                                                const loc = (mov.type === 'IN' ? 'Doação Externa' : (mov.recipient_name || '')).toLowerCase();
                                                if (!loc.includes(historyLocationFilter.toLowerCase())) return false;
                                            }
                                            if (historyItemFilter) {
                                                const itemName = (mov.item_description || mov.item_name || '').toLowerCase();
                                                if (!itemName.includes(historyItemFilter.toLowerCase())) return false;
                                            }
                                            return true;
                                        })
                                        .map(mov => (
                                        <tr key={mov.id || mov.created_at} className="hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{new Date(mov.created_at).toLocaleString('pt-BR')}</td>
                                            <td className="px-6 py-4">
                                                {mov.type === 'IN' ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 dark:bg-emerald-900/20 px-2 py-1 rounded-md w-max">
                                                        <ArrowDownToLine size={14} /> Entrada
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-purple-600 font-bold bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md w-max">
                                                        <ArrowUpFromLine size={14} /> Saída
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 dark:text-slate-300">
                                                {mov.item_description || mov.item_name}
                                            </td>
                                            <td className="px-6 py-4 font-black">
                                                {mov.type === 'IN' ? '+' : '-'}{mov.quantity} {mov.unit}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                                                {mov.type === 'IN' ? 'Doação Externa' : mov.recipient_name}
                                            </td>
                                            {isAdminOrCoord && (
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleDeleteHistory(mov)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center ml-auto"
                                                        title="Excluir Registro"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
