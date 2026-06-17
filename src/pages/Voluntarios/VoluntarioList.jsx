import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, ArrowLeft, Filter, 
    UserCheck, MapPin, Briefcase, Phone
} from 'lucide-react';
import { getVoluntarios } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';

const VoluntarioList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [voluntarios, setVoluntarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getVoluntarios();
            setVoluntarios(data);
        } catch (error) {
            toast.error('Erro ao carregar lista de voluntários.');
        } finally {
            setLoading(false);
        }
    };

    const filteredVoluntarios = voluntarios.filter(v => {
        const matchesSearch = v.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (v.cpf && v.cpf.includes(searchTerm)) ||
                              (v.bairro && v.bairro.toLowerCase().includes(searchTerm.toLowerCase()));
                              
        const matchesStatus = filterStatus === 'todos' ? true : v.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 transition-colors">
            {/* Cabeçalho */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/voluntarios')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Banco de Voluntários</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {filteredVoluntarios.length} registros encontrados
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => navigate('/voluntarios/novo')}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Novo Cadastro
                </button>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-6">
                {/* Barra de Busca e Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CPF ou bairro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium text-sm text-slate-800 dark:text-slate-200"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none md:w-48">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 appearance-none"
                            >
                                <option value="todos">Todos os Status</option>
                                <option value="ativo">Ativos</option>
                                <option value="inativo">Inativos</option>
                                <option value="suspenso">Suspensos</option>
                                <option value="em análise">Em Análise</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Lista de Voluntários */}
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredVoluntarios.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <UserCheck size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum voluntário encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredVoluntarios.map(voluntario => (
                            <div 
                                key={voluntario.id}
                                onClick={() => navigate(`/voluntarios/editar/${voluntario.id}`)}
                                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all group hover:shadow-md"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
                                            {voluntario.nome_completo.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{voluntario.nome_completo}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Phone size={12} /> {voluntario.telefone}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                        voluntario.status === 'ativo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        voluntario.status === 'inativo' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                                        voluntario.status === 'suspenso' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {voluntario.status}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                        <MapPin size={14} className="text-rose-500" />
                                        {voluntario.bairro || 'Bairro não informado'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                                        <Briefcase size={14} className="text-blue-500" />
                                        {voluntario.voluntario_area?.length || 0} especialidade(s)
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VoluntarioList;
