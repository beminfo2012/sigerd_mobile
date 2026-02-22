import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, User, Phone, Package, Hash, ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { addDonation, getShelters } from '../../services/shelterDb.js';
import VoiceInput from '../../components/VoiceInput';
import { toast } from '../../components/ToastNotification';

export default function DonationHub() {
    const navigate = useNavigate();
    const [shelters, setShelters] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        destination_type: 'CENTRAL', // CENTRAL or SHELTER
        shelter_id: '', // Empty if CENTRAL, or UUID if SHELTER
        donor_name: '',
        donor_phone: '',
        donation_type: 'alimento',
        item_description: '',
        quantity: '',
        unit: 'unidades',
        observations: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastFocusedField, setLastFocusedField] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadShelters = async () => {
            const s = await getShelters();
            setShelters(s || []);
        };
        loadShelters();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleVoiceResult = (transcript) => {
        if (lastFocusedField) {
            setFormData(prev => ({ ...prev, [lastFocusedField]: transcript }));
        }
    };

    const validateForm = () => {
        const e = {};
        if (!formData.item_description || !formData.item_description.trim()) {
            e.item_description = 'Descrição do item é obrigatória';
        }
        const qty = parseFloat(formData.quantity);
        if (!qty || qty <= 0 || isNaN(qty)) {
            e.quantity = 'Quantidade deve ser maior que zero';
        }
        if (formData.destination_type === 'SHELTER' && !formData.shelter_id) {
            e.shelter_id = 'Selecione um abrigo';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error('Campos obrigatórios', 'Preencha todos os campos destacados em vermelho.');
            return;
        }
        setIsSubmitting(true);

        try {
            await addDonation({
                ...formData,
                shelter_id: formData.destination_type === 'CENTRAL' ? 'CENTRAL' : formData.shelter_id
            });

            toast.success('Doação registrada!', `${formData.item_description} (${formData.quantity} ${formData.unit}) adicionado ao estoque.`);
            navigate('/abrigos');
        } catch (error) {
            console.error('Error saving donation:', error);
            toast.error('Erro ao registrar', error.message || 'Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <h1 className="text-2xl font-black text-slate-800">Recebimento de Doações</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Centralize o recebimento de doações para o estoque municipal ou abrigos específicos.
                            </p>
                        </div>
                        <VoiceInput onResult={handleVoiceResult} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Destination Selection */}
                    <Card className="p-6 border-l-4 border-l-[#2a5299]">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-[#2a5299]" />
                            Destino da Doação
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Enviar para
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination_type: 'CENTRAL', shelter_id: '' })}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.destination_type === 'CENTRAL'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Package size={20} className={formData.destination_type === 'CENTRAL' ? 'text-blue-600' : 'text-slate-400'} />
                                        </div>
                                        <span className="text-sm font-bold">Estoque Municipal</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination_type: 'SHELTER' })}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.destination_type === 'SHELTER'
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <Building2 size={20} className={formData.destination_type === 'SHELTER' ? 'text-blue-600' : 'text-slate-400'} />
                                        </div>
                                        <span className="text-sm font-bold">Abrigo Específico</span>
                                    </button>
                                </div>
                            </div>

                            {formData.destination_type === 'SHELTER' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Selecione o Abrigo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="shelter_id"
                                        value={formData.shelter_id}
                                        onChange={handleChange}
                                        required={formData.destination_type === 'SHELTER'}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        <option value="">Selecione...</option>
                                        {shelters.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Donor Info */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-[#2a5299]" />
                            Informações do Doador
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="Nome (Opcional)"
                                name="donor_name"
                                value={formData.donor_name}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                icon={User}
                                placeholder="Anônimo"
                            />
                            <Input
                                label="Telefone (Opcional)"
                                name="donor_phone"
                                type="tel"
                                value={formData.donor_phone}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                icon={Phone}
                                placeholder="(27) 99999-9999"
                            />
                        </div>
                    </Card>

                    {/* Details */}
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
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                >
                                    <option value="alimento">Alimento</option>
                                    <option value="roupa">Vestuário/Cama/Banho</option>
                                    <option value="higiene">Higiene Limpeza</option>
                                    <option value="medicamento">Medicamentos</option>
                                    <option value="outro">Outros</option>
                                </select>
                            </div>

                            <Input
                                label="Descrição do Item"
                                name="item_description"
                                value={formData.item_description}
                                onChange={(e) => { handleChange(e); if (errors.item_description) setErrors(prev => ({ ...prev, item_description: '' })); }}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required
                                icon={Package}
                                placeholder="Ex: Cesta Básica, Colchão..."
                            />
                            {errors.item_description && (
                                <p className="text-xs text-red-500 font-semibold flex items-center gap-1 -mt-2">
                                    <AlertCircle size={12} /> {errors.item_description}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Quantidade"
                                    name="quantity"
                                    type="number"
                                    step="0.01"
                                    value={formData.quantity}
                                    onChange={(e) => { handleChange(e); if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' })); }}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    required
                                    icon={Hash}
                                    placeholder="0"
                                />
                                {errors.quantity && (
                                    <p className="text-xs text-red-500 font-semibold flex items-center gap-1 -mt-2">
                                        <AlertCircle size={12} /> {errors.quantity}
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Unidade
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        <option value="unidades">Unidades</option>
                                        <option value="kg">Kg</option>
                                        <option value="litros">Litros</option>
                                        <option value="caixas">Caixas</option>
                                        <option value="pacotes">Pacotes</option>
                                        <option value="fardos">Fardos</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={() => navigate('/abrigos')} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting || (!formData.item_description.trim() || !formData.quantity)}>
                            {isSubmitting ? 'Salvando...' : 'Confirmar Doação'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
