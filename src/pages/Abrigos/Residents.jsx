import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search, MapPin, Heart, ChevronRight } from 'lucide-react';
import { Card } from '../../components/Shelter/ui/Card.jsx';
import { Input } from '../../components/Shelter/ui/Input.jsx';
import { getOccupants, getShelters } from '../../services/shelterDb.js';

export function Residents() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const [residents, setResidents] = useState([]);
    const [shelters, setShelters] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            const allOccupants = await getOccupants();
            const allShelters = await getShelters();

            // Filter active occupants locally since we fetched all
            const activeResidents = allOccupants ? allOccupants.filter(r => r.status === 'active') : [];

            setResidents(activeResidents);
            setShelters(allShelters || []);
        };
        loadData();
    }, []);

    const getShelterInfo = (shelterId) => {
        return shelters.find(s => s.id === parseInt(shelterId));
    };

    const filteredResidents = residents.filter(r => {
        const shelter = getShelterInfo(r.shelter_id);
        const searchLower = searchQuery.toLowerCase();
        return r.full_name.toLowerCase().includes(searchLower) ||
            (r.cpf && r.cpf.includes(searchLower)) ||
            (shelter && shelter.name.toLowerCase().includes(searchLower));
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                <button
                    onClick={() => navigate('/abrigos')}
                    className="flex items-center gap-2 text-[#2a5299] font-semibold hover:text-blue-800 transition-colors w-fit"
                >
                    <ArrowLeft size={20} />
                    Voltar ao Menu
                </button>

                <div>
                    <h1 className="text-2xl font-black text-slate-800 mb-1">Residentes</h1>
                    <p className="text-sm text-slate-500">Lista geral de pessoas abrigadas em todas as unidades</p>
                </div>

                <div className="relative">
                    <Input
                        icon={Search}
                        placeholder="Buscar por nome, CPF ou abrigo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>

                {filteredResidents.length === 0 ? (
                    <Card className="p-12 text-center text-slate-400 italic">
                        Nenhum residente encontrado com os critérios de busca.
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredResidents.map((resident) => {
                            const shelter = getShelterInfo(resident.shelter_id);
                            return (
                                <Card
                                    key={resident.id}
                                    onClick={() => navigate(`/abrigos/${resident.shelter_id}`)}
                                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-emerald-600" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-slate-800 truncate">
                                                    {resident.full_name}
                                                </h3>
                                                {resident.special_needs && (
                                                    <Heart size={14} className="text-red-500 fill-red-500" />
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                                    <span className="font-bold">{resident.age} anos</span>
                                                    <span>•</span>
                                                    <span className="uppercase">{resident.gender === 'masculino' ? 'Masc' : resident.gender === 'feminino' ? 'Fem' : 'Outro'}</span>
                                                    {resident.cpf && (
                                                        <>
                                                            <span>•</span>
                                                            <span>CPF: {resident.cpf}</span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="text-[10px] text-[#2a5299] font-bold flex items-center gap-1 uppercase tracking-wider">
                                                    <MapPin size={10} />
                                                    {shelter ? shelter.name : 'Abrigo não identificado'}
                                                </div>
                                            </div>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Residents;
