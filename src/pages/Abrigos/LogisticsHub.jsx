import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, ArrowRight, ArrowLeft, Building2, CheckCircle2, User, FileText, Trash2, Search, Loader2 } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { getInventory, getShelters, transferStock, addDistribution } from '../../services/shelterDb.js';
import { toast } from '../../components/ToastNotification';

export default function LogisticsHub() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Select Items, 2: Quantities & Dest, 3: Confirm
    const [centralStock, setCentralStock] = useState([]);
    const [shelters, setShelters] = useState([]);

    // Multi-item selection state: Array of { item: Object, quantity: String }
    const [selectedItems, setSelectedItems] = useState([]);

    const [destinationType, setDestinationType] = useState('SHELTER');

    const [transferData, setTransferData] = useState({
        shelter_id: '',
        recipient_name: '',
        recipient_doc: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoadingInitial(true);
            try {
                const stock = await getInventory('CENTRAL');
                const s = await getShelters();
                setCentralStock(stock || []);
                setShelters(s || []);
            } catch (e) {
                toast.error('Erro de carregamento', 'Não foi possível carregar os dados de estoque.');
            } finally {
                setIsLoadingInitial(false);
            }
        };
        loadData();
    }, []);

    // Toggle item selection
    const toggleItemSelection = (item) => {
        if (selectedItems.find(i => (i.id || i.item_id) === (item.id || item.item_id))) {
            setSelectedItems(selectedItems.filter(i => (i.id || i.item_id) !== (item.id || item.item_id)));
        } else {
            setSelectedItems([...selectedItems, { ...item, transferQuantity: '' }]);
        }
    };

    const updateItemQuantity = (id, validQty) => {
        setSelectedItems(selectedItems.map(item => {
            if ((item.id || item.item_id) === id) {
                return { ...item, transferQuantity: validQty };
            }
            return item;
        }));
    };

    const handleNextStep = () => {
        if (step === 1 && selectedItems.length > 0) setStep(2);
        else if (step === 2) {
            const validShelter = destinationType === 'SHELTER' && transferData.shelter_id;
            const validPerson = destinationType === 'PERSON' && transferData.recipient_name;
            const allQuantitiesValid = selectedItems.every(i => i.transferQuantity && parseFloat(i.transferQuantity) > 0 && parseFloat(i.transferQuantity) <= parseFloat(i.quantity));

            if ((validShelter || validPerson) && allQuantitiesValid) {
                setStep(3);
            } else {
                toast.error('Atenção', 'Verifique se todos os itens possuem quantidades válidas e se o destino foi preenchido.');
            }
        }
    };

    const handleTransfer = async () => {
        setIsSubmitting(true);
        try {
            for (const item of selectedItems) {
                if (destinationType === 'SHELTER') {
                    await transferStock(
                        item.id || item.item_id,
                        'CENTRAL',
                        transferData.shelter_id,
                        item.transferQuantity
                    );
                } else {
                    await addDistribution({
                        shelter_id: 'CENTRAL',
                        inventory_id: item.id || item.item_id,
                        item_name: item.item_name,
                        quantity: item.transferQuantity,
                        unit: item.unit,
                        recipient_name: transferData.recipient_name,
                        document: transferData.recipient_doc,
                        type: 'direct_aid'
                    });
                }
            }

            toast.success('Sucesso!', 'Distribuição realizada com sucesso.');
            navigate('/abrigos');
        } catch (error) {
            console.error(error);
            toast.error('Erro na operação', error.message);
            setIsSubmitting(false);
        }
    };

    const filteredStock = centralStock.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Logística e Distribuição</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Envio de materiais do Estoque Municipal para Abrigos ou Famílias.
                        </p>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-[#2a5299] text-white shadow-lg scale-110' : 'bg-white text-slate-300 border border-slate-200'
                                }`}>
                                {s}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-[#2a5299]' : 'text-slate-300'
                                }`}>
                                {s === 1 ? 'Seleção' : s === 2 ? 'Qtd & Destino' : 'Confirmar'}
                            </span>
                        </div>
                    ))}
                    <div className="absolute left-0 right-0 top-6 h-0.5 bg-slate-200 -z-0 max-w-3xl mx-auto px-8 hidden md:block" />
                </div>

                {/* Step 1: Select Items */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <Input
                                placeholder="Buscar itens no estoque..."
                                className="bg-white shadow-sm pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Selected Count Badge */}
                        {selectedItems.length > 0 && (
                            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="text-sm font-bold text-[#2a5299]">{selectedItems.length} itens selecionados</span>
                                <button className="text-xs font-bold text-red-500" onClick={() => setSelectedItems([])}>Limpar Seleção</button>
                            </div>
                        )}

                        {isLoadingInitial ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                <p className="text-slate-500 font-medium text-sm">Carregando estoque...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {centralStock.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                                        <Package className="w-12 h-12 text-slate-200 mb-3" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Estoque Vazio</p>
                                    </div>
                                ) : (
                                    filteredStock.map(item => {
                                        const isSelected = selectedItems.find(i => (i.id || i.item_id) === (item.id || item.item_id));
                                        return (
                                            <div
                                                key={item.id || item.item_id}
                                                onClick={() => toggleItemSelection(item)}
                                                className={`p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${isSelected
                                                    ? 'border-[#2a5299] shadow-md bg-blue-50/20'
                                                    : 'border-slate-100 hover:border-slate-300 shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-[#2a5299] text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
                                                        {isSelected ? <CheckCircle2 size={24} /> : <Package size={24} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 leading-tight">{item.item_name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-slate-500">{item.category}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                            <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">
                                                                {item.quantity} {item.unit} disponíveis
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                        <Button
                            className="w-full mt-4 h-14 text-base font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
                            disabled={selectedItems.length === 0 || isLoadingInitial}
                            onClick={handleNextStep}
                        >
                            Próximo: Definir Detalhes
                        </Button>
                    </div>
                )}

                {/* Step 2: Quantities & Destination */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                        {/* Destination Selection */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800">1. Definir Destino</h3>
                            <div className="bg-slate-100 p-1 rounded-xl flex">
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${destinationType === 'SHELTER' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setDestinationType('SHELTER')}
                                >
                                    <Building2 size={16} />
                                    Enviar para Abrigo
                                </button>
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${destinationType === 'PERSON' ? 'bg-white shadow-sm text-[#2a5299]' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setDestinationType('PERSON')}
                                >
                                    <User size={16} />
                                    Pessoa/Família
                                </button>
                            </div>

                            {destinationType === 'SHELTER' ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-semibold text-slate-700">Abrigo de Destino</label>
                                    <select
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:ring-2 focus:ring-[#2a5299]/20 outline-none"
                                        value={transferData.shelter_id}
                                        onChange={(e) => setTransferData({ ...transferData, shelter_id: e.target.value })}
                                    >
                                        <option value="">Selecione um abrigo...</option>
                                        {shelters.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.status === 'active' ? 'Ativo' : 'Inativo'})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Input
                                        label="Nome do Beneficiário"
                                        placeholder="Ex: João Silva"
                                        icon={User}
                                        value={transferData.recipient_name}
                                        onChange={(e) => setTransferData({ ...transferData, recipient_name: e.target.value })}
                                    />
                                    <Input
                                        label="CPF ou Documento (Opcional)"
                                        placeholder="000.000.000-00"
                                        icon={FileText}
                                        value={transferData.recipient_doc}
                                        onChange={(e) => setTransferData({ ...transferData, recipient_doc: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 pt-6 space-y-4">
                            <h3 className="font-bold text-slate-800 flex justify-between items-center">
                                2. Definir Quantidades
                                <span className="text-xs font-normal text-slate-500">{selectedItems.length} itens</span>
                            </h3>

                            {selectedItems.map((item, idx) => (
                                <div key={idx} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2a5299] shrink-0">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.item_name}</h4>
                                            <p className="text-xs text-slate-500">Estoque: {item.quantity} {item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="w-full md:w-32 text-center font-bold"
                                            value={item.transferQuantity}
                                            onChange={(e) => updateItemQuantity(item.id || item.item_id, e.target.value)}
                                            max={parseFloat(item.quantity)}
                                        />
                                        <span className="text-xs font-bold text-slate-400 w-12">{item.unit}</span>
                                        <button
                                            onClick={() => toggleItemSelection(item)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                            <Button
                                className="flex-1"
                                disabled={
                                    !selectedItems.every(i => i.transferQuantity && parseFloat(i.transferQuantity) > 0) ||
                                    (destinationType === 'SHELTER' && !transferData.shelter_id) ||
                                    (destinationType === 'PERSON' && !transferData.recipient_name)
                                }
                                onClick={handleNextStep}
                            >
                                Revisar Envio
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-[#2a5299]">
                                <Truck size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Confirmar Distribuição?</h2>
                                <p className="text-slate-500 text-sm mt-1">Você está prestes a enviar {selectedItems.length} itens.</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-200 pb-2">
                                    <span className="text-slate-500">Destino:</span>
                                    <span className="font-bold text-slate-800">
                                        {destinationType === 'SHELTER'
                                            ? shelters.find(s => String(s.id) === String(transferData.shelter_id))?.name
                                            : `${transferData.recipient_name} (Pessoa/Família)`
                                        }
                                    </span>
                                </div>

                                <div className="space-y-2 pt-2">
                                    {selectedItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="text-slate-600">{item.item_name}</span>
                                            <span className="font-bold text-[#2a5299]">
                                                {item.transferQuantity} {item.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Corrigir</Button>
                            <Button
                                className="flex-1"
                                onClick={handleTransfer}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processando...' : 'Confirmar Envio'}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
