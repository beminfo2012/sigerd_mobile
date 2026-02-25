import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, Search, ArrowLeft, Trash2, AlertTriangle, Filter,
    Edit3, X, Check, History, TrendingUp, TrendingDown, Gift, Truck,
    BarChart3, CheckCircle, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import {
    getInventory, clearInventory, getDataConsistencyReport,
    updateInventoryItem, deleteInventoryItem, getItemMovementHistory
} from '../../services/shelterDb.js';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from '../../components/ToastNotification';

export default function StockHub() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [historyItem, setHistoryItem] = useState(null);
    const [movements, setMovements] = useState([]);
    const [consistency, setConsistency] = useState(null);
    const [showConsistency, setShowConsistency] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const inv = await getInventory('CENTRAL');
            setItems(inv || []);
            const report = await getDataConsistencyReport('CENTRAL');
            setConsistency(report);
        } catch (e) {
            console.error('Failed to load stock:', e);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleClearAll = async () => {
        try {
            await clearInventory('CENTRAL');
            toast.success('Estoque limpo', 'Todos os itens foram arquivados com sucesso.');
            loadData();
        } catch (e) {
            toast.error('Erro', e.message);
        }
    };

    const handleDeleteItem = async (id) => {
        try {
            await deleteInventoryItem(id);
            toast.success('Item removido', 'O item foi arquivado do estoque.');
            setShowDeleteModal(null);
            loadData();
        } catch (e) {
            toast.error('Erro', e.message);
        }
    };

    const startEdit = (item) => {
        setEditingItem(item.id);
        setEditForm({
            item_name: item.item_name,
            quantity: item.quantity,
            category: item.category,
            unit: item.unit || 'unidades'
        });
    };

    const saveEdit = async () => {
        try {
            const qty = parseFloat(editForm.quantity);
            if (isNaN(qty) || qty < 0) {
                toast.error('Erro', 'Quantidade inválida');
                return;
            }
            await updateInventoryItem(editingItem, {
                ...editForm,
                quantity: qty
            });
            toast.success('Item atualizado', `${editForm.item_name} atualizado com sucesso.`);
            setEditingItem(null);
            loadData();
        } catch (e) {
            toast.error('Erro', e.message);
        }
    };

    const showHistory = async (item) => {
        setHistoryItem(item);
        try {
            const hist = await getItemMovementHistory(item.item_name, 'CENTRAL');
            setMovements(hist);
        } catch (e) {
            setMovements([]);
        }
    };

    const filteredItems = items.filter(item => {
        const matchSearch = !search || (item.item_name && item.item_name.toLowerCase().includes(search.toLowerCase()));
        const matchCategory = !filterCategory || item.category === filterCategory;
        return matchSearch && matchCategory;
    });

    const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
    const totalItems = items.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0);
    const lowStockCount = items.filter(i => parseFloat(i.quantity) <= (i.min_quantity || 5)).length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Estoque Municipal</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {items.length} tipos de itens • {totalItems.toLocaleString('pt-BR')} unidades no total
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <Card className="p-3 text-center">
                        <Package size={18} className="mx-auto text-blue-500 mb-1" />
                        <p className="text-lg font-black text-slate-800 dark:text-white">{items.length}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Tipos</p>
                    </Card>
                    <Card className="p-3 text-center">
                        <TrendingUp size={18} className="mx-auto text-emerald-500 mb-1" />
                        <p className="text-lg font-black text-slate-800 dark:text-white">{totalItems.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Qtd</p>
                    </Card>
                    <Card className={`p-3 text-center ${lowStockCount > 0 ? 'border-amber-200 dark:border-amber-500/30' : ''}`}>
                        <AlertTriangle size={18} className={`mx-auto mb-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
                        <p className={`text-lg font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>{lowStockCount}</p>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Estoque Baixo</p>
                    </Card>
                </div>

                {/* Consistency Panel */}
                {consistency && (
                    <Card className={`mb-4 overflow-hidden border-l-4 ${consistency.isConsistent ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                        <button
                            onClick={() => setShowConsistency(!showConsistency)}
                            className="w-full p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                {consistency.isConsistent ? (
                                    <CheckCircle size={20} className="text-emerald-600" />
                                ) : (
                                    <AlertCircle size={20} className="text-amber-600" />
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                        {consistency.isConsistent ? 'Dados Consistentes' : `Divergência Detectada (${consistency.divergence.toFixed(0)} itens)`}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {consistency.donationCount} doações • {consistency.distributionCount} distribuições
                                    </p>
                                </div>
                            </div>
                            {showConsistency ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>

                        {showConsistency && (
                            <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Gift size={14} className="text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Recebido</span>
                                        </div>
                                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{consistency.totalDonated.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Truck size={14} className="text-blue-600" />
                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Distribuído</span>
                                        </div>
                                        <p className="text-xl font-black text-blue-700 dark:text-blue-300">{consistency.totalDistributed.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BarChart3 size={14} className="text-slate-600" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Saldo Esperado</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-700 dark:text-slate-300">{consistency.expectedStock.toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className={`rounded-xl p-3 ${consistency.isConsistent ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package size={14} className={consistency.isConsistent ? 'text-emerald-600' : 'text-amber-600'} />
                                            <span className={`text-xs font-bold ${consistency.isConsistent ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>Estoque Real</span>
                                        </div>
                                        <p className={`text-xl font-black ${consistency.isConsistent ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{consistency.currentStock.toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                                {consistency.incompleteDonations > 0 && (
                                    <div className="mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                                        <AlertTriangle size={14} className="text-red-500" />
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                            {consistency.incompleteDonations} registros com dados incompletos detectados
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}

                {/* Search and Filter */}
                <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar item..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all text-sm font-semibold"
                        />
                    </div>
                    {categories.length > 0 && (
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
                        >
                            <option value="">Todos</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>

                {/* Item List */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Carregando estoque...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <Card className="p-10 text-center">
                        <Package size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 mb-1">
                            {search ? 'Nenhum item encontrado' : 'Estoque Vazio'}
                        </h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                            {search ? 'Tente outro termo de busca.' : 'Registre doações para popular o estoque.'}
                        </p>
                        {!search && (
                            <Button onClick={() => navigate('/abrigos/doacoes-central')} className="mx-auto">
                                <Gift size={16} className="mr-2" /> Receber Doações
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredItems.map(item => {
                            const isLow = parseFloat(item.quantity) <= (item.min_quantity || 5);
                            const isEditing = editingItem === item.id;

                            return (
                                <Card key={item.id} className={`overflow-hidden transition-all ${isLow ? 'border-amber-200 dark:border-amber-500/30' : ''}`}>
                                    {isEditing ? (
                                        /* Edit Mode */
                                        <div className="p-4 space-y-3 bg-blue-50/50 dark:bg-blue-500/5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Editando Item</p>
                                                <button onClick={() => setEditingItem(null)} className="p-1.5 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800 text-slate-400">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <input
                                                value={editForm.item_name}
                                                onChange={e => setEditForm({ ...editForm, item_name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                                                placeholder="Nome do item"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={editForm.quantity}
                                                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                                                    placeholder="Quantidade"
                                                />
                                                <select
                                                    value={editForm.category}
                                                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                                                >
                                                    <option value="alimento">Alimento</option>
                                                    <option value="roupa">Vestuário</option>
                                                    <option value="higiene">Higiene</option>
                                                    <option value="medicamento">Medicamento</option>
                                                    <option value="outro">Outro</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={saveEdit}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                                            >
                                                <Check size={16} /> Salvar Alterações
                                            </button>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${isLow ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                                                    <Package size={18} className={isLow ? 'text-amber-600' : 'text-blue-600'} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                        {item.item_name || 'Item sem nome'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-lg font-black ${isLow ? 'text-amber-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {parseFloat(item.quantity).toLocaleString('pt-BR')}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-semibold">{item.unit || 'un.'}</span>
                                                        {isLow && (
                                                            <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                                                Baixo
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.category && (
                                                        <span className="inline-block mt-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold capitalize">
                                                            {item.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Edit3 size={13} /> Editar
                                                </button>
                                                <button
                                                    onClick={() => showHistory(item)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <History size={13} /> Histórico
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(item)}
                                                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Admin Actions */}
                {items.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 size={16} /> Limpar Todo o Estoque
                        </button>
                    </div>
                )}
            </div>

            {/* Clear All Confirmation Modal */}
            <ConfirmModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={handleClearAll}
                title="Limpar Todo o Estoque?"
                message={`Essa ação irá arquivar ${items.length} itens do estoque municipal. Os dados podem ser recuperados pelo administrador.`}
                confirmText="Limpar Estoque"
                type="danger"
                requireTypedConfirmation={true}
            />

            {/* Delete Single Item Modal */}
            <ConfirmModal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                onConfirm={() => showDeleteModal && handleDeleteItem(showDeleteModal.id)}
                title="Excluir Item?"
                message={`Deseja remover "${showDeleteModal?.item_name}" (${showDeleteModal?.quantity} ${showDeleteModal?.unit || 'un.'}) do estoque?`}
                confirmText="Excluir Item"
                type="danger"
            />

            {/* Movement History Modal */}
            {historyItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100]" onClick={() => setHistoryItem(null)}>
                    <div
                        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-slate-800"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">Histórico de Movimentações</h3>
                                <p className="text-xs text-slate-500 font-semibold">{historyItem.item_name}</p>
                            </div>
                            <button onClick={() => setHistoryItem(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {movements.length === 0 ? (
                            <div className="text-center py-8">
                                <History size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                                <p className="text-sm text-slate-400">Nenhuma movimentação registrada</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {movements.map((m, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${m.type === 'entrada' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                                        <div className={`p-1.5 rounded-lg ${m.type === 'entrada' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-blue-100 dark:bg-blue-500/20'}`}>
                                            {m.type === 'entrada' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-blue-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{m.description}</p>
                                            <p className={`text-sm font-black ${m.type === 'entrada' ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                                {m.type === 'entrada' ? '+' : '-'}{m.quantity} {m.unit}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {m.date ? new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
