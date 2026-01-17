import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, MapPin, Users, Phone, User, FileText, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Input } from '../../components/Shelter/ui/Input';
import { Button } from '../../components/Shelter/ui/Button';
import { addShelter } from '../../services/shelterDb';
import VoiceInput from '../../components/VoiceInput';

export function ShelterForm() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        bairro: '',
        coordenadas: '',
        capacity: '',
        responsible_name: '',
        responsible_phone: '',
        observations: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastFocusedField, setLastFocusedField] = useState(null);

    const handleVoiceResult = (transcript) => {
        if (lastFocusedField) {
            setFormData(prev => ({
                ...prev,
                [lastFocusedField]: transcript
            }));
        }
    };

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
            await addShelter({
                ...formData,
                current_occupancy: 0
            });
            alert('Abrigo cadastrado com sucesso!');
            navigate('/abrigos');
        } catch (error) {
            console.error('Error saving shelter:', error);
            alert('Erro ao salvar abrigo. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-6">
            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/abrigos')}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold mb-4 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Cadastrar Novo Abrigo</h1>
                            <p className="text-sm text-slate-500 mt-1">Preencha os dados do abrigo</p>
                        </div>
                        <VoiceInput onResult={handleVoiceResult} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-[#2a5299]" />
                            Informações Básicas
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome do Abrigo"
                                name="name"
                                value={formData.name}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required
                                icon={Building2}
                                placeholder="Ex: Ginásio Municipal João Silva"
                            />

                            <Input
                                label="Endereço Completo"
                                name="address"
                                value={formData.address}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required
                                icon={MapPin}
                                placeholder="Ex: Rua das Flores, 123"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Bairro"
                                    name="bairro"
                                    value={formData.bairro}
                                    onFocus={(e) => setLastFocusedField(e.target.name)}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    placeholder="Ex: Centro"
                                />

                                <Input
                                    label="Coordenadas (Lat, Long)"
                                    name="coordenadas"
                                    value={formData.coordenadas}
                                    onFocus={(e) => setLastFocusedField(e.target.name)}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    placeholder="Ex: -19.9245, -40.6789"
                                />
                            </div>

                            <Input
                                label="Capacidade Total"
                                name="capacity"
                                type="number"
                                value={formData.capacity}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required
                                icon={Users}
                                placeholder="Ex: 60"
                            />
                        </div>
                    </Card>

                    {/* Responsible Person */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-[#2a5299]" />
                            Responsável
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome do Responsável"
                                name="responsible_name"
                                value={formData.responsible_name}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                icon={User}
                                placeholder="Ex: Maria Santos"
                            />

                            <Input
                                label="Telefone do Responsável"
                                name="responsible_phone"
                                type="tel"
                                value={formData.responsible_phone}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                icon={Phone}
                                placeholder="Ex: (27) 99999-1234"
                            />
                        </div>
                    </Card>

                    {/* Additional Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-[#2a5299]" />
                            Informações Adicionais
                        </h2>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Observações
                            </label>
                            <textarea
                                name="observations"
                                value={formData.observations}
                                onFocus={(e) => setLastFocusedField(e.target.name)}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all resize-none"
                                placeholder="Informações adicionais sobre o abrigo..."
                            />
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/abrigos')}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Salvando...' : 'Cadastrar Abrigo'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ShelterForm;
