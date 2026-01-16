import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Package, TrendingUp, User, Users as UsersIcon, Hash, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Input } from '../../components/Shelter/ui/Input';
import { Button } from '../../components/Shelter/ui/Button';
import { db, addDistribution } from '../../services/shelterDb';

export function DistributionForm() {
    const { shelterId } = useParams();
    const navigate = useNavigate();

    const idStr = shelterId;
    const shelter = useLiveQuery(() => db.shelters.get(parseInt(idStr)), [idStr]);
    const inventoryItems = useLiveQuery(() => db.inventory.where('shelter_id').equals(idStr).toArray(), [idStr]) || [];

    const [formData, setFormData] = useState({
        inventory_id: '',
        item_name: '',
        quantity: '',
        unit: '',
        recipient_name: '',
        family_group: '',
        observations: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'inventory_id') {
            const selectedItem = inventoryItems.find(i => i.id === parseInt(value));
            if (selectedItem) {
                setFormData({
                    ...formData,
                    inventory_id: value,
                    item_name: selectedItem.item_name,
                    unit: selectedItem.unit,
                });
            } else {
                setFormData({
                    ...formData,
                    inventory_id: '',
                    item_name: '',
                    unit: '',
                });
            }
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addDistribution({
                ...formData,
                inventory_id: parseInt(formData.inventory_id),
                shelter_id: idStr
            });
            alert('Distribuição registrada com sucesso!');
            navigate(`/abrigos/${shelterId}`);
        } catch (error) {
            console.error('Error saving distribution:', error);
            alert(error.message || 'Erro ao registrar distribuição. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (shelter === undefined) return null;

    if (!shelter) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Abrigo não encontrado</h2>
                    <Button onClick={() => navigate('/abrigos')}>Voltar ao Dashboard</Button>
                </div>
            </div>
        );
    }

    const selectedItem = inventoryItems.find(i => i.id === parseInt(formData.inventory_id));

    return (
        <div className="min-h-screen bg-slate-50 pb-6">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/abrigos/${shelterId}`)}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold mb-4 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <h1 className="text-2xl font-black text-slate-800">Distribuir Itens</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Abrigo: {shelter.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Item Selection */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Package size={20} className="text-[#2a5299]" />
                            Selecionar Item do Estoque
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Item <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="inventory_id"
                                    value={formData.inventory_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                >
                                    <option value="">Selecione um item</option>
                                    {inventoryItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.item_name} - {item.quantity} {item.unit} disponíveis
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedItem && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">
                                        ESTOQUE DISPONÍVEL
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600">Categoria:</span>
                                            <span className="ml-2 font-bold text-slate-800 capitalize">
                                                {selectedItem.category}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Quantidade:</span>
                                            <span className="ml-2 font-bold text-slate-800">
                                                {selectedItem.quantity} {selectedItem.unit}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Input
                                label="Quantidade a Distribuir"
                                name="quantity"
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                                icon={Hash}
                                placeholder={`Ex: 5 ${formData.unit || ''}`}
                                disabled={!formData.inventory_id}
                            />
                        </div>
                    </Card>

                    {/* Recipient Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-[#2a5299]" />
                            Informações do Destinatário
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome do Destinatário"
                                name="recipient_name"
                                value={formData.recipient_name}
                                onChange={handleChange}
                                icon={User}
                                placeholder="Ex: João da Silva"
                            />

                            <Input
                                label="Grupo Familiar"
                                name="family_group"
                                value={formData.family_group}
                                onChange={handleChange}
                                icon={UsersIcon}
                                placeholder="Ex: FAM-001"
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Observações
                                </label>
                                <textarea
                                    name="observations"
                                    value={formData.observations}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all resize-none"
                                    placeholder="Informações adicionais sobre a distribuição..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Warning */}
                    {selectedItem && formData.quantity && parseFloat(formData.quantity) > selectedItem.quantity && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-red-600 text-sm font-bold">!</span>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-red-800 mb-1">
                                        Quantidade insuficiente em estoque
                                    </div>
                                    <div className="text-xs text-red-600">
                                        Disponível: {selectedItem.quantity} {selectedItem.unit} |
                                        Solicitado: {formData.quantity} {formData.unit}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(`/abrigos/${shelterId}`)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting || (selectedItem && formData.quantity && parseFloat(formData.quantity) > selectedItem.quantity)}
                        >
                            {isSubmitting ? 'Registrando...' : 'Registrar Distribuição'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DistributionForm;
