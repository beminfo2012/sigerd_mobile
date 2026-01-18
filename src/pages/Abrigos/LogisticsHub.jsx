import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, ArrowRight, ArrowLeft, Building2, CheckCircle2, User, FileText } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Input } from '../../components/Shelter/ui/Input';
import { Button } from '../../components/Shelter/ui/Button';
import { getInventory, getShelters, transferStock, addDistribution } from '../../services/shelterDb';

export default function LogisticsHub() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Select Item, 2: Select Dest & Qty, 3: Confirm
    const [centralStock, setCentralStock] = useState([]);
    const [shelters, setShelters] = useState([]);

    const [selectedItem, setSelectedItem] = useState(null);
    const [destinationType, setDestinationType] = useState('SHELTER'); // 'SHELTER' or 'PERSON'

    const [transferData, setTransferData] = useState({
        shelter_id: '',
        quantity: '',
        recipient_name: '',
        recipient_doc: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const stock = await getInventory('CENTRAL');
            const s = await getShelters();
            setCentralStock(stock || []);
            setShelters(s || []);
        };
        loadData();
    }, []);

    const handleNextStep = () => {
        if (step === 1 && selectedItem) setStep(2);
        else if (step === 2) {
            const validShelter = destinationType === 'SHELTER' && transferData.shelter_id;
            const validPerson = destinationType === 'PERSON' && transferData.recipient_name;

            if ((validShelter || validPerson) && transferData.quantity) {
                setStep(3);
            }
        }
    };

    const handleTransfer = async () => {
        setIsSubmitting(true);
        try {
            if (destinationType === 'SHELTER') {
                await transferStock(
                    selectedItem.id || selectedItem.item_id,
                    'CENTRAL',
                    transferData.shelter_id,
                    transferData.quantity
                );
            } else {
                // Direct distribution to person from CENTRAL stock
                await addDistribution({
                    shelter_id: 'CENTRAL', // Deduct from central
                    inventory_id: selectedItem.id || selectedItem.item_id,
                    item_name: selectedItem.item_name,
                    quantity: transferData.quantity,
                    unit: selectedItem.unit,
                    recipient_name: transferData.recipient_name,
                    document: transferData.recipient_doc,
                    type: 'direct_aid'
                });
            }

            alert('Operação realizada com sucesso!');
            navigate('/abrigos');
        } catch (error) {
            console.error(error);
            alert('Erro na operação: ' + error.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold mb-4 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Logística e Distribuição</h1>
                        <p className="text-sm text-slate-500 mt-1">
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
                                {s === 1 ? 'Item' : s === 2 ? 'Destino' : 'Confirmar'}
                            </span>
                        </div>
                    ))}
                    {/* Line */}
                    <div className="absolute left-0 right-0 top-6 h-0.5 bg-slate-200 -z-0 max-w-3xl mx-auto px-8 hidden md:block" />
                </div>

                {/* Step 1: Select Item */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Input
                            placeholder="Buscar item no estoque..."
                            className="bg-white shadow-sm"
                        />
                        <div className="grid grid-cols-1 gap-3">
                            {centralStock.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Nenhum item no estoque municipal.</p>
                            ) : (
                                centralStock.map(item => (
                                    <div
                                        key={item.id || item.item_id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`p-4 bg-white rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedItem?.id === item.id
                                                ? 'border-[#2a5299] shadow-md bg-blue-50'
                                                : 'border-transparent hover:border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{item.item_name}</h3>
                                                <p className="text-xs text-slate-500">Disponível: {item.quantity} {item.unit}</p>
                                            </div>
                                        </div>
                                        {selectedItem?.id === item.id && <CheckCircle2 className="text-[#2a5299]" />}
                                    </div>
                                ))
                            )}
                        </div>
                        <Button
                            className="w-full mt-4"
                            disabled={!selectedItem}
                            onClick={handleNextStep}
                        >
                            Próximo: Definir Destino
                        </Button>
                    </div>
                )}

                {/* Step 2: Destination & Quantity */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Card className="p-4 bg-blue-50 border-blue-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#2a5299] shadow-sm">
                                <Package size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedItem.item_name}</h3>
                                <p className="text-xs text-slate-600">
                                    Estoque atual: <span className="font-bold text-[#2a5299]">{selectedItem.quantity} {selectedItem.unit}</span>
                                </p>
                            </div>
                            <button onClick={() => setStep(1)} className="ml-auto text-xs font-bold text-[#2a5299] underline">Trocar</button>
                        </Card>

                        <div className="space-y-4">
                            {/* Destination Type Toggle */}
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

                            <Input
                                label={`Quantidade a Enviar (máx: ${selectedItem.quantity})`}
                                type="number"
                                value={transferData.quantity}
                                onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                                placeholder="0.00"
                                max={parseFloat(selectedItem.quantity)}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                            <Button
                                className="flex-1"
                                disabled={
                                    !transferData.quantity ||
                                    parseFloat(transferData.quantity) > parseFloat(selectedItem.quantity) ||
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
                                <h2 className="text-xl font-black text-slate-800">Confirmar Envio?</h2>
                                <p className="text-slate-500 text-sm mt-1">Confira os dados da distribuição abaixo.</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Item:</span>
                                    <span className="font-bold text-slate-800">{selectedItem.item_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Origem:</span>
                                    <span className="font-bold text-slate-800">Estoque Municipal (Central)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Destino:</span>
                                    <span className="font-bold text-slate-800">
                                        {destinationType === 'SHELTER'
                                            ? shelters.find(s => String(s.id) === String(transferData.shelter_id))?.name
                                            : `${transferData.recipient_name} (Família)`
                                        }
                                    </span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                    <span className="text-slate-500">Quantidade:</span>
                                    <span className="text-lg font-black text-[#2a5299]">
                                        {transferData.quantity} {selectedItem.unit}
                                    </span>
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
