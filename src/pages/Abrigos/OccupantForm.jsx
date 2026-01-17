import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CreditCard, Calendar, Users as UsersIcon, Heart, FileText, ArrowLeft, Camera, Loader2, Mic, MicOff } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card';
import { Input } from '../../components/Shelter/ui/Input';
import { Button } from '../../components/Shelter/ui/Button';
import { addOccupant, getShelterById, getOccupants, updateShelter } from '../../services/shelterDb';
import { scanDocument } from '../../services/ocrService';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export function OccupantForm() {
    const { shelterId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Use numeric ID for IndexedDB query if necessary
    const idStr = shelterId;
    const [shelter, setShelter] = useState(undefined);
    const [existingOccupants, setExistingOccupants] = useState([]);

    useEffect(() => {
        const load = async () => {
            const s = await getShelterById(idStr);
            const occ = await getOccupants(idStr);
            setShelter(s);
            setExistingOccupants(occ || []);
        };
        load();
    }, [idStr]);

    const [formData, setFormData] = useState({
        full_name: '',
        cpf: '',
        age: '',
        gender: 'nao_informado',
        family_group: '',
        is_family_head: false,
        special_needs: '',
        observations: '',
    });

    const [showFamilySuggestions, setShowFamilySuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [lastFocusedField, setLastFocusedField] = useState(null);

    const { isListening, transcript, startListening, hasSupport } = useSpeechRecognition();

    useEffect(() => {
        if (transcript && lastFocusedField) {
            setFormData(prev => ({
                ...prev,
                [lastFocusedField]: transcript
            }));
        }
    }, [transcript, lastFocusedField]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    // Derived state from existing occupants
    const familyGroups = [...new Set(existingOccupants.map(o => o.family_group).filter(Boolean))];

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const result = await scanDocument(file);

            setFormData(prev => ({
                ...prev,
                full_name: result.full_name || prev.full_name,
                cpf: result.cpf || prev.cpf,
                age: result.age || prev.age,
                gender: result.gender || prev.gender
            }));

            alert('Documento lido com sucesso! Verifique os dados preenchidos.');
        } catch (error) {
            console.error('Scan Error:', error);
            alert('Não foi possível ler os dados do documento. Tente uma foto mais clara ou preencha manualmente.');
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await addOccupant({
                ...formData,
                shelter_id: idStr
            });

            // Update shelter current_occupancy
            if (shelter) {
                await updateShelter(shelter.id, {
                    current_occupancy: (shelter.current_occupancy || 0) + 1
                });
            }

            alert('Abrigado cadastrado com sucesso!');
            navigate(`/abrigos/${shelterId}`);
        } catch (error) {
            console.error('Error saving occupant:', error);
            alert('Erro ao cadastrar abrigado. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (shelter === undefined) return null; // Loading

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
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Cadastrar Abrigado</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Abrigo: {shelter.name}
                            </p>
                        </div>
                        {hasSupport && (
                            <button
                                type="button"
                                onClick={startListening}
                                className={`p-4 rounded-2xl flex items-center gap-2 transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-[#2a5299] hover:bg-blue-100'}`}
                                title="Preencher campo selecionado por voz"
                            >
                                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {isListening ? 'Ouvindo...' : 'Voz'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Scan Button - Prominent */}
                <Card className="p-4 mb-6 bg-blue-50 border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-[#2a5299] mb-1">Agilizar Cadastro</h3>
                            <p className="text-xs text-blue-600">
                                Tire uma foto do documento (RG ou CNH) para preencher automaticamente.
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button
                            type="button"
                            onClick={handleScanClick}
                            disabled={isScanning}
                            className="bg-[#2a5299] text-white hover:bg-blue-800"
                        >
                            {isScanning ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Camera className="w-5 h-5 mr-2" />
                            )}
                            {isScanning ? 'Lendo...' : 'Escanear Documento'}
                        </Button>
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-[#2a5299]" />
                            Informações Pessoais
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Nome Completo"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                required
                                icon={User}
                                placeholder="Ex: João da Silva"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="CPF"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    icon={CreditCard}
                                    placeholder="000.000.000-00"
                                />

                                <Input
                                    label="Idade"
                                    name="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    icon={Calendar}
                                    placeholder="Ex: 35"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Gênero
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
                                >
                                    <option value="nao_informado">Não informado</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="feminino">Feminino</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Family and Special Needs */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UsersIcon size={20} className="text-[#2a5299]" />
                            Grupo Familiar e Necessidades
                        </h2>

                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    label="Grupo Familiar"
                                    name="family_group"
                                    value={formData.family_group}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    onFocus={() => setShowFamilySuggestions(true)}
                                    icon={UsersIcon}
                                    placeholder="Ex: Família Silva"
                                    autoComplete="off"
                                />

                                {showFamilySuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                        <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Grupos Existentes
                                        </div>
                                        {familyGroups.map((group) => (
                                            <button
                                                key={group}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, family_group: group });
                                                    setShowFamilySuggestions(false);
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                            >
                                                {group}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newId = `FAM-${Math.floor(Math.random() * 900) + 100}`;
                                                setFormData({ ...formData, family_group: newId, is_family_head: true });
                                                setShowFamilySuggestions(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-[#2a5299] hover:bg-blue-50 transition-colors sticky bottom-0 bg-white border-t border-slate-100"
                                        >
                                            + Gerar novo código de família
                                        </button>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_family_head}
                                        onChange={(e) => setFormData({ ...formData, is_family_head: e.target.checked })}
                                        className="w-5 h-5 rounded border-blue-300 text-[#2a5299] focus:ring-[#2a5299]"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-blue-800">
                                        Responsável Familiar
                                    </div>
                                    <div className="text-[10px] text-[#2a5299] uppercase font-black">
                                        REPRESENTANTE DO GRUPO
                                    </div>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Heart size={16} className="text-slate-400" />
                                    Necessidades Especiais
                                </label>
                                <textarea
                                    name="special_needs"
                                    value={formData.special_needs}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all resize-none"
                                    placeholder="Ex: Hipertensão, mobilidade reduzida, medicação contínua..."
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
                            {isSubmitting ? 'Salvando...' : 'Cadastrar Abrigado'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OccupantForm;
