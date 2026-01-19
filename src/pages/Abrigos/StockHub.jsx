import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ArrowLeft, RefreshCcw, Filter, TrendingUp, AlertTriangle, Trash2 } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { getInventory, clearInventory } from '../../services/shelterDb.js';

export default function StockHub() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        loadStock();
    }, []);

    const loadStock = async () => {
        setLoading(true);
        try {
            const data = await getInventory('CENTRAL');
            setItems(data || []);
        } catch (error) {
            console.error("Error loading central stock:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearStock = async () => {
        if (window.confirm('TEM CERTEZA? Isso apagará TODOS os itens do Estoque Municipal. Essa ação não pode ser desfeita.')) {
            try {
                await clearInventory('CENTRAL');
                await loadStock();
                alert('Estoque limpo com sucesso.');
            } catch (error) {
                console.error(error);
                alert('Erro ao limpar estoque.');
            }
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = ['all', ...new Set(items.map(i => i.category).filter(Boolean))];

    const totalItems = items.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0);
    const lowStockCount = items.filter(i => (parseFloat(i.quantity) || 0) < (i.min_quantity || 5)).length;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estoque Municipal</span>
                        </div>
                        <button
                            onClick={handleClearStock}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Limpar Estoque"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Title Card */}
                    <Card variant="gradient" className="p-6 md:col-span-2 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Package className="text-white w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white leading-none">Estoque Municipal</h1>
                                <p className="text-blue-100 text-sm mt-1">Gestão centralizada de recursos para atendimento imediato.</p>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 flex flex-col justify-center items-center text-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total de Itens</div>
                            <div className="text-3xl font-black text-[#2a5299]">{totalItems}</div>
                        </Card>
                        <Card className="p-4 flex flex-col justify-center items-center text-center">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stock Crítico</div>
                            <div className={`text-3xl font-black ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {lowStockCount}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            icon={Search}
                            placeholder="Buscar item no estoque..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${categoryFilter === cat
                                    ? 'bg-[#2a5299] text-white border-[#2a5299]'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {cat === 'all' ? 'TODAS CATEGORIAS' : cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Inventory List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2a5299]"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-slate-300 w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Estoque vazio ou nenhum item encontrado</h3>
                        <p className="text-slate-500 text-sm">Registre doações para alimentar o estoque municipal.</p>
                        <Button
                            className="mt-4"
                            onClick={() => navigate('/abrigos/doacoes-central')}
                        >
                            Receber Doação
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                            <Card key={item.id || item.item_id} className="p-4 flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${(parseFloat(item.quantity) || 0) < (item.min_quantity || 5)
                                        ? 'bg-red-50 text-red-500'
                                        : 'bg-blue-50 text-[#2a5299]'
                                        }`}>
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{item.item_name}</h3>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{item.category}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-slate-800">
                                        {item.quantity} <span className="text-xs font-bold text-slate-400 ml-1">{item.unit}</span>
                                    </div>
                                    {(parseFloat(item.quantity) || 0) < (item.min_quantity || 5) && (
                                        <div className="flex items-center justify-end gap-1 text-red-500 text-[10px] font-bold">
                                            <AlertTriangle size={10} />
                                            BAIXO ESTOQUE
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
