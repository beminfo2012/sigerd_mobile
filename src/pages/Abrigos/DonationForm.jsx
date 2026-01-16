import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gift, User, Phone, Package, Hash, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Input } from '../../components/Shelter/ui/Input';
import { Button } from '../../components/Shelter/ui/Button';
import { db, addDonation } from '../../services/shelterDb';

export function DonationForm() {
    const { shelterId } = useParams();
    const navigate = useNavigate();

    const idStr = shelterId;
    const shelter = useLiveQuery(() => db.shelters.get(parseInt(idStr)), [idStr]);

    const [formData, setFormData] = useState({
        donor_name: '',
        donor_phone: '',
        donation_type: 'alimento',
        item_description: '',
        quantity: '',
        unit: 'unidades',
        observations: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addDonation({
                ...formData,
                shelter_id: idStr
            });

            alert('Doação registrada com sucesso!');
            navigate(`/abrigos/${shelterId}`);
        } catch (error) {
            console.error('Error saving donation:', error);
            alert('Erro ao registrar doação. Tente novamente.');
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
                    <h1 className="text-2xl font-black text-slate-800">Registrar Doação</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Abrigo: {shelter.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Donor Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-[#2a5299]" />
                            Informações do Doador
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome do Doador"
                                name="donor_name"
                                value={formData.donor_name}
                                onChange={handleChange}
                                icon={User}
                                placeholder="Ex: Supermercado Bom Preço"
                            />

                            <Input
                                label="Telefone do Doador"
                                name="donor_phone"
                                type="tel"
                                value={formData.donor_phone}
                                onChange={handleChange}
                                icon={Phone}
                                placeholder="(27) 99999-1234"
                            />
                        </div>
                    </Card>

                    {/* Donation Details */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-[#2a5299]" />
                            Detalhes da Doação
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Tipo de Doação <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="donation_type"
                                    value={formData.donation_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                >
                                    <option value="alimento">Alimento</option>
                                    <option value="roupa">Roupa</option>
                                    <option value="higiene">Higiene</option>
                                    <option value="medicamento">Medicamento</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>

                            <Input
                                label="Descrição do Item"
                                name="item_description"
                                value={formData.item_description}
                                onChange={handleChange}
                                required
                                icon={Package}
                                placeholder="Ex: Cestas básicas, roupas infantis, kits de higiene..."
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Quantidade"
                                    name="quantity"
                                    type="number"
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    icon={Hash}
                                    placeholder="Ex: 50"
                                />

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Unidade <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        <option value="unidades">Unidades</option>
                                        <option value="kg">Kg</option>
                                        <option value="litros">Litros</option>
                                        <option value="caixas">Caixas</option>
                                        <option value="pacotes">Pacotes</option>
                                        <option value="peças">Peças</option>
                                    </select>
                                </div>
                            </div>

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
                                    placeholder="Informações adicionais sobre a doação..."
                                />
                            </div>
                        </div>
                    </Card>

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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Registrando...' : 'Registrar Doação'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DonationForm;
