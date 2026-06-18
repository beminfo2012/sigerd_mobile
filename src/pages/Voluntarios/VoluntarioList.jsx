import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, ArrowLeft, Filter, 
    UserCheck, MapPin, Briefcase, Phone,
    Eye, Edit2, Trash2, ChevronDown, Award, X, FileText
} from 'lucide-react';
import { getVoluntarios, deleteVoluntario, getAreasAtuacao } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';
import VoluntarioViewModal from './VoluntarioViewModal';

const STATUS_CONFIG = {
    'ativo':      { label: 'Ativo',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'inativo':    { label: 'Inativo',     color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    'suspenso':   { label: 'Suspenso',    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    'em análise': { label: 'Em Análise',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

const NIVEL_COLOR = {
    'básico':                 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'intermediário':          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'avançado':               'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'profissional habilitado':'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const VoluntarioList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [voluntarios, setVoluntarios] = useState([]);
    const [areasDisponiveis, setAreasDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [filterArea, setFilterArea] = useState('todas');

    // Confirm delete state
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // View Modal state
    const [viewModalVoluntario, setViewModalVoluntario] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [volData, areasData] = await Promise.all([
                getVoluntarios(),
                getAreasAtuacao()
            ]);
            setVoluntarios(volData);
            setAreasDisponiveis(areasData);
        } catch (error) {
            toast.error('Erro ao carregar lista de voluntários.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await deleteVoluntario(confirmDelete.id);
            setVoluntarios(prev => prev.filter(v => v.id !== confirmDelete.id));
            toast.success('Voluntário excluído com sucesso.');
            setConfirmDelete(null);
        } catch (error) {
            toast.error('Erro ao excluir. Tente novamente.');
        } finally {
            setDeleting(false);
        }
    };

    const filteredVoluntarios = useMemo(() => {
        return voluntarios.filter(v => {
            const matchesSearch = 
                v.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (v.cpf && v.cpf.includes(searchTerm)) ||
                (v.bairro && v.bairro.toLowerCase().includes(searchTerm.toLowerCase()));
                          
            const matchesStatus = filterStatus === 'todos' || v.status === filterStatus;

            const matchesArea = filterArea === 'todas' || 
                (v.voluntario_area && v.voluntario_area.some(va => va.areas_atuacao?.id === filterArea));

            return matchesSearch && matchesStatus && matchesArea;
        });
    }, [voluntarios, searchTerm, filterStatus, filterArea]);

    const activeFiltersCount = [filterStatus !== 'todos', filterArea !== 'todas'].filter(Boolean).length;

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
                            {loading ? 'Carregando...' : `${filteredVoluntarios.length} registros`}
                            {activeFiltersCount > 0 && <span className="ml-2 text-blue-500">• {activeFiltersCount} filtro(s) ativo(s)</span>}
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => navigate('/voluntarios/novo')}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 border border-blue-400 dark:border-blue-300/30"
                >
                    <Plus size={18} /> Novo Voluntário
                </button>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Barra de Busca */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, CPF ou bairro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:border-blue-500 transition-colors font-medium text-sm text-slate-800 dark:text-slate-200"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Filtro de Status */}
                        <div className="relative flex-1">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={`w-full pl-10 pr-8 py-3 rounded-xl outline-none font-bold text-xs uppercase tracking-wider appearance-none border-2 transition-colors ${filterStatus !== 'todos' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                            >
                                <option value="todos">Todos os Status</option>
                                <option value="ativo">Ativos</option>
                                <option value="em análise">Em Análise</option>
                                <option value="inativo">Inativos</option>
                                <option value="suspenso">Suspensos</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Filtro de Especialidade */}
                        <div className="relative flex-1">
                            <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                            <select 
                                value={filterArea}
                                onChange={(e) => setFilterArea(e.target.value)}
                                className={`w-full pl-10 pr-8 py-3 rounded-xl outline-none font-bold text-xs uppercase tracking-wider appearance-none border-2 transition-colors ${filterArea !== 'todas' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' : 'bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                            >
                                <option value="todas">Todas as Especialidades</option>
                                {areasDisponiveis.map(a => (
                                    <option key={a.id} value={a.id}>{a.nome}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Limpar filtros */}
                        {activeFiltersCount > 0 && (
                            <button 
                                onClick={() => { setFilterStatus('todos'); setFilterArea('todas'); }}
                                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                            >
                                <X size={13} /> Limpar
                            </button>
                        )}
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
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum voluntário encontrado com esses filtros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredVoluntarios.map(voluntario => {
                            const statusCfg = STATUS_CONFIG[voluntario.status] || STATUS_CONFIG['em análise'];
                            const especialidades = voluntario.voluntario_area || [];

                            return (
                                <div 
                                    key={voluntario.id}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group hover:shadow-md flex flex-col"
                                >
                                    {/* Linha 1: Avatar + Nome + Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                                                {voluntario.nome_completo.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{voluntario.nome_completo}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Phone size={11} /> {voluntario.telefone || '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Linha 2: Localização */}
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                                        <MapPin size={13} className="text-rose-400 shrink-0" />
                                        <span>{voluntario.bairro || 'Bairro não informado'}</span>
                                        {voluntario.vinculo && <span className="text-slate-300 mx-1">•</span>}
                                        {voluntario.vinculo && <span className="truncate">{voluntario.vinculo}</span>}
                                    </div>

                                    {/* Linha 3: Especialidades */}
                                    {especialidades.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {especialidades.map((ea, idx) => {
                                                const nivelClass = NIVEL_COLOR[ea.nivel_experiencia] || NIVEL_COLOR['básico'];
                                                return (
                                                    <span key={idx} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${nivelClass}`}>
                                                        <Briefcase size={10} />
                                                        {ea.areas_atuacao?.nome || 'N/A'}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic mb-4">Sem especialidade cadastrada</p>
                                    )}

                                    {/* Linha 4: Botões de Ação */}
                                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => window.open(`/voluntarios/termo/${voluntario.id}`, '_blank')}
                                            title="Termo de Voluntariado"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors mr-auto"
                                        >
                                            <FileText size={14} /> Termo
                                        </button>
                                        <button
                                            onClick={() => setViewModalVoluntario(voluntario)}
                                            title="Visualizar Detalhes"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <Eye size={14} /> Ver
                                        </button>
                                        <button
                                            onClick={() => navigate(`/voluntarios/editar/${voluntario.id}`)}
                                            title="Editar"
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Edit2 size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={() => setConfirmDelete(voluntario)}
                                            title="Excluir"
                                            className="p-2 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modal de Confirmação de Exclusão */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={26} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-white text-lg mb-2">Confirmar Exclusão</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Tem certeza que deseja excluir <strong className="text-slate-700 dark:text-slate-200">{confirmDelete.nome_completo}</strong>? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                            <button 
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-2xl font-black text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md disabled:opacity-60"
                            >
                                {deleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <VoluntarioViewModal
                voluntario={viewModalVoluntario}
                onClose={() => setViewModalVoluntario(null)}
                onEdit={() => {
                    navigate(`/voluntarios/editar/${viewModalVoluntario.id}`);
                    setViewModalVoluntario(null);
                }}
                onDelete={() => {
                    setConfirmDelete(viewModalVoluntario);
                    setViewModalVoluntario(null);
                }}
                onUpdate={(updatedVoluntario) => {
                    setVoluntarios(prev => prev.map(v => v.id === updatedVoluntario.id ? updatedVoluntario : v));
                    setViewModalVoluntario(updatedVoluntario);
                }}
            />
        </div>
    );
};

export default VoluntarioList;
