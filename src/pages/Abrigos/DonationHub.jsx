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
        donation_subtype: 'Água',
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

    const subTypesMap = {
        alimento: ['Água', 'Cesta Básica', 'Perecíveis', 'Não Perecíveis', 'Outros'],
        higiene: ['Kit de Limpeza', 'Kit de Higiene Pessoal', 'Água Sanitária/Desinfetante', 'Outros'],
        roupa: ['Fardo de Roupas', 'Cobertores/Mantas', 'Colchões', 'Travesseiros/Lençóis', 'Outros'],
        medicamento: ['Uso Contínuo', 'Primeiros Socorros', 'Analgésicos/Térmicos', 'Outros'],
        outro: ['Diversos', 'Móveis', 'Eletrodomésticos', 'Outros']
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'donation_type') {
            setFormData({
                ...formData,
                donation_type: value,
                donation_subtype: subTypesMap[value] ? subTypesMap[value][0] : 'Outros',
                item_description: ''
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleVoiceResult = (transcript) => {
        if (lastFocusedField) {
            setFormData(prev => ({ ...prev, [lastFocusedField]: transcript }));
        }
    };

    const validateForm = () => {
        const e = {};
        if (formData.donation_subtype === 'Outros' && (!formData.item_description || !formData.item_description.trim())) {
            e.item_description = 'Descrição do item é obrigatória quando subtipo for "Outros"';
        }
        const qty = parseFloat(formData.quantity);
        if (!qty || qty <= 0 || isNaN(qty)) {
            e.quantity = 'Quantidade deve ser maior que zero';
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
            const finalDesc = formData.donation_subtype === 'Outros' 
                ? formData.item_description 
                : (formData.item_description ? `${formData.donation_subtype} - ${formData.item_description}` : formData.donation_subtype);

            const { donation_subtype, destination_type, ...dataToSave } = formData;

            await addDonation({
                ...dataToSave,
                item_description: finalDesc,
                shelter_id: formData.destination_type === 'CENTRAL' ? 'CENTRAL' : formData.shelter_id
            });

            toast.success('Doação registrada!', `${finalDesc} (${formData.quantity} ${formData.unit}) adicionado ao estoque.`);
            navigate('/assisthumanitaria');
        } catch (error) {
            console.error('Error saving donation:', error);
            toast.error('Erro ao registrar', error.message || 'Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 dark:bg-slate-950 pb-12">
            <div className="max-w-3xl mx-auto px-4 py-6">

                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={() => navigate('/assisthumanitaria')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 dark:text-blue-200 transition-colors w-fit"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao Menu
                    </button>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Recebimento de Doações</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Centralize o recebimento de doações para o estoque municipal ou abrigos específicos.
                            </p>
                        </div>
                        <VoiceInput onResult={handleVoiceResult} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Destination Selection */}
                    <Card className="p-6 border-l-4 border-l-[#2a5299]">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-[#2a5299]" />
                            Destino da Doação
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Enviar para
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination_type: 'CENTRAL', shelter_id: '' })}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.destination_type === 'CENTRAL'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                            <Package size={20} className={formData.destination_type === 'CENTRAL' ? 'text-blue-600' : 'text-slate-400'} />
                                        </div>
                                        <span className="text-sm font-bold">Estoque Municipal</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, destination_type: 'SHELTER' })}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.destination_type === 'SHELTER'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                            <Building2 size={20} className={formData.destination_type === 'SHELTER' ? 'text-blue-600' : 'text-slate-400'} />
                                        </div>
                                        <span className="text-sm font-bold">Abrigo Específico</span>
                                    </button>
                                </div>
                            </div>

                            {formData.destination_type === 'SHELTER' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Selecione o Abrigo <span className="text-slate-400 font-normal ml-1">(Opcional)</span>
                                    </label>
                                    <select
                                        name="shelter_id"
                                        value={formData.shelter_id}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        <option value="">Não especificar abrigo...</option>
                                        {shelters.filter(s => s.status === 'active').map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Donor Info */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
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
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Gift size={20} className="text-[#2a5299]" />
                            Detalhes da Doação
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Tipo de Doação <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="donation_type"
                                        value={formData.donation_type}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        <option value="alimento">Alimento</option>
                                        <option value="roupa">Vestuário/Cama/Banho</option>
                                        <option value="higiene">Higiene Limpeza</option>
                                        <option value="medicamento">Medicamentos</option>
                                        <option value="outro">Outros</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Subtipo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="donation_subtype"
                                        value={formData.donation_subtype}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                    >
                                        {subTypesMap[formData.donation_type]?.map(st => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <Input
                                label={formData.donation_subtype === 'Outros' ? "Descrição do Item *" : "Descrição do Item (Opcional)"}
                                name="item_description"
                                value={formData.item_description}
                                onChange={(e) => { handleChange(e); if (errors.item_description) setErrors(prev => ({ ...prev, item_description: '' })); }}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required={formData.donation_subtype === 'Outros'}
                                icon={Package}
                                placeholder={formData.donation_subtype === 'Outros' ? "Especifique o item..." : "Detalhes adicionais..."}
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
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Unidade
                                    </label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
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
                        <Button type="button" variant="secondary" onClick={() => navigate('/assisthumanitaria')} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isSubmitting || (formData.donation_subtype === 'Outros' && !formData.item_description.trim()) || !formData.quantity}>
                            {isSubmitting ? 'Salvando...' : 'Confirmar Doação'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
