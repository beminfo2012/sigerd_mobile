import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, ArrowLeft, Settings, Radio, HeartHandshake, Shield, Award
} from 'lucide-react';
import { getProgramasVoluntariado } from '../../services/voluntariosService';
import ProgramasModal from './ProgramasModal';

// Mapeamento de ícones dinâmicos do Lucide
const IconMap = { Shield, Users, Radio, HeartHandshake, Award };

const BancoVoluntarios = () => {
    const navigate = useNavigate();
    const [programas, setProgramas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProgramasModalOpen, setIsProgramasModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getProgramasVoluntariado();
            setProgramas(data);
        } catch (err) {
            console.error('Erro ao buscar programas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getIconComponent = (iconName) => {
        const Icon = IconMap[iconName] || Users;
        return <Icon size={24} strokeWidth={2.5} />;
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/voluntarios')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-slate-600 dark:text-slate-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Banco de Voluntários</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selecione um programa</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsProgramasModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                    <Settings size={15} /> Gerenciar Programas
                </button>
            </header>

            <div className="p-4 w-full mx-auto space-y-6 mt-4">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Todos os Voluntários */}
                        <button
                            onClick={() => navigate('/voluntarios/lista')}
                            className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all text-left group"
                        >
                            <div className="p-4 rounded-2xl mb-4 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white mb-2">Todos os Voluntários</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">Visão geral consolidada de todos os programas</p>
                        </button>

                        {/* Geral (sem programa) */}
                        <button
                            onClick={() => navigate('/voluntarios/lista?programa=geral')}
                            className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all text-left group"
                        >
                            <div className="p-4 rounded-2xl mb-4 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:scale-110 transition-transform">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white mb-2">Geral</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">Voluntários sem programa específico</p>
                        </button>

                        {/* Programas dinâmicos */}
                        {programas.map((prog) => {
                            const baseColor = prog.cor || 'blue';
                            return (
                                <button
                                    key={prog.id}
                                    onClick={() => navigate(`/voluntarios/lista?programa=${prog.id}`)}
                                    className="flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all text-left group"
                                >
                                    <div className={`p-4 rounded-2xl mb-4 bg-${baseColor}-50 text-${baseColor}-600 dark:bg-${baseColor}-900/20 dark:text-${baseColor}-400 group-hover:scale-110 transition-transform`}>
                                        {getIconComponent(prog.icone)}
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white mb-2">{prog.nome}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">{prog.descricao || 'Sem descrição'}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {isProgramasModalOpen && (
                <ProgramasModal
                    onClose={() => setIsProgramasModalOpen(false)}
                    onUpdate={() => loadData()}
                />
            )}
        </div>
    );
};

export default BancoVoluntarios;
