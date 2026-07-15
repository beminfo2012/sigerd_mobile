import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CreditCard, Calendar, Users as UsersIcon, Heart, FileText, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { Button } from '../../components/Shelter/ui/Button.jsx';
import { addOccupant, getShelterById, getOccupants, updateShelter } from '../../services/shelterDb.js';
import { scanDocument } from '../../services/ocrService';
import VoiceInput from '../../components/VoiceInput';
import { toast } from '../../components/ToastNotification';

const applyCpfMask = (value) => {
    if (!value) return '';
    return String(value)
        .replace(/\D/g, '') // remove non-digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // max 14 chars
};

const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

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
        birth_date: '',
        age: '',
        gender: 'nao_informado',
        family_group: '',
        is_family_head: false,
        special_needs: '',
        observations: '',
    });

    const [showFamilySuggestions, setShowFamilySuggestions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState('save');

    const [isScanning, setIsScanning] = useState(false);
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
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? checked : value;
        
        if (name === 'cpf') {
            newValue = applyCpfMask(newValue);
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            if (name === 'birth_date') {
                updated.age = calculateAge(newValue);
            }
            return updated;
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
                cpf: applyCpfMask(result.cpf || prev.cpf),
                birth_date: result.birth_date || prev.birth_date,
                age: result.age || prev.age,
                gender: result.gender || prev.gender
            }));

            toast.success('Documento lido!', 'Dados preenchidos automaticamente. Verifique se estão corretos.');
        } catch (error) {
            console.error('Scan Error:', error);
            toast.error('Erro na leitura', error.message || 'Não foi possível ler os dados do documento. Tente uma foto mais clara ou preencha manualmente.');
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

            toast.success('Cadastrado!', 'Abrigado cadastrado com sucesso!');
            
            if (actionType === 'save_and_add') {
                setFormData(prev => ({
                    full_name: '',
                    cpf: '',
                    birth_date: '',
                    age: '',
                    gender: 'nao_informado',
                    family_group: prev.family_group,
                    is_family_head: false,
                    special_needs: '',
                    observations: '',
                }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate(`/assisthumanitaria/${shelterId}`);
            }
        } catch (error) {
            console.error('Error saving occupant:', error);
            toast.error('Erro ao cadastrar', 'Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (shelter === undefined) return null; // Loading

    if (!shelter) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Abrigo não encontrado</h2>
                    <Button onClick={() => navigate('/assisthumanitaria')}>Voltar ao Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 pb-6">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/assisthumanitaria/${shelterId}`)}
                        className="flex items-center gap-2 text-[#2a5299] font-semibold mb-4 hover:text-blue-800 dark:text-blue-200 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Cadastrar Abrigado</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Abrigo: {shelter.name}
                            </p>
                        </div>
                        <VoiceInput onResult={handleVoiceResult} />
                    </div>
                </div>

                {/* Scan Button - Prominent */}
                <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
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
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="CPF"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    icon={CreditCard}
                                    placeholder="000.000.000-00"
                                    maxLength="14"
                                />

                                <Input
                                    label="Data de Nascimento"
                                    name="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    icon={Calendar}
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
                                    readOnly={!!formData.birth_date}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Gênero
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all font-semibold"
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
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
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
                                    onBlur={() => setTimeout(() => setShowFamilySuggestions(false), 200)}
                                    icon={UsersIcon}
                                    placeholder="Ex: Família Silva"
                                    autoComplete="off"
                                />

                                {showFamilySuggestions && familyGroups.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                        <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                            Grupos Existentes
                                        </div>
                                        {familyGroups
                                            .filter(g => g.toLowerCase().includes(formData.family_group.toLowerCase()))
                                            .map((group) => (
                                                <button
                                                    key={group}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        // Use onMouseDown to trigger before onBlur
                                                        e.preventDefault();
                                                        setFormData({ ...formData, family_group: group });
                                                        setShowFamilySuggestions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 border-b border-slate-50 last:border-0 transition-colors"
                                                >
                                                    {group}
                                                </button>
                                            ))}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                const newId = `FAM-${Math.floor(Math.random() * 900) + 100}`;
                                                setFormData({ ...formData, family_group: newId, is_family_head: true });
                                                setShowFamilySuggestions(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-[#2a5299] hover:bg-blue-50 dark:bg-blue-900/20 transition-colors sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
                                        >
                                            + Gerar novo código de família
                                        </button>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_family_head}
                                        onChange={(e) => setFormData({ ...formData, is_family_head: e.target.checked })}
                                        className="w-5 h-5 rounded border-blue-300 text-[#2a5299] focus:ring-[#2a5299]"
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-blue-800 dark:text-blue-200">
                                        Responsável Familiar
                                    </div>
                                    <div className="text-[10px] text-[#2a5299] uppercase font-black">
                                        REPRESENTANTE DO GRUPO
                                    </div>
                                </div>
                            </label>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <Heart size={16} className="text-slate-400" />
                                    Necessidades Especiais
                                </label>
                                <textarea
                                    name="special_needs"
                                    value={formData.special_needs}
                                    onChange={handleChange}
                                    onFocusCapture={(e) => setLastFocusedField(e.target.name)}
                                    rows={3}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2a5299]/20 transition-all resize-none"
                                    placeholder="Ex: Hipertensão, mobilidade reduzida, medicação contínua..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate(`/assisthumanitaria/${shelterId}`)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            onClick={() => setActionType('save_and_add')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSubmitting}
                        >
                            Salvar e Adicionar Familiar
                        </Button>
                        <Button
                            type="submit"
                            onClick={() => setActionType('save')}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar e Concluir'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OccupantForm;
