import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Home, Plus, Search, Edit2, Trash2, CheckCircle2,
    MapPin, Phone, Calendar, X, Save, UserCheck, AlertTriangle, RotateCcw
} from 'lucide-react';
import {
    getDesalojados,
    addDesalojado,
    updateDesalojado,
    deleteDesalojado
} from '../../services/shelterDb';
import { useOperacao } from '../../contexts/OperacaoContext';
import { toast } from '../../components/ToastNotification';
import bairrosData from '../../data/Bairros.json';

const TIPO_ACOLHIMENTO_OPTIONS = [
    'Casa de Parentes',
    'Casa de Amigos',
    'Aluguel Social',
    'Outro Local Temporário'
];

const MOTIVO_OPTIONS = [
    'Alagamento',
    'Inundação / Enxurrada',
    'Deslizamento de Terra',
    'Interdição Preventiva',
    'Risco Estrutural',
    'Vendaval / Destelhamento',
    'Outro'
];

const STATUS_META = {
    ativo: { label: 'Desalojado Ativo', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    retornou: { label: 'Retornou à Residência', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    encaminhado_abrigo: { label: 'Encaminhado a Abrigo', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' }
};

const applyCpfMask = (value) => {
    if (!value) return '';
    return String(value)
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const applyPhoneMask = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

const INITIAL_FORM = {
    responsavel_nome: '',
    cpf: '',
    telefone: '',
    qtd_pessoas: 1,
    qtd_adultos: 0,
    qtd_criancas: 0,
    qtd_idosos: 0,
    qtd_pcd: 0,
    bairro_origem: '',
    endereco_origem: '',
    tipo_acolhimento: 'Casa de Parentes',
    local_acolhimento: '',
    motivo: 'Alagamento',
    status: 'ativo',
    data_registro: new Date().toISOString().slice(0, 10),
    observacoes: ''
};

export default function Desalojados() {
    const navigate = useNavigate();
    const { operacaoAtiva } = useOperacao();

    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ativo');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        try {
            let list = await getDesalojados();
            if (operacaoAtiva) {
                list = list.filter(item => !item.operacao_id || item.operacao_id === operacaoAtiva.id);
            }
            setRecords(list || []);
        } catch (err) {
            console.error('Erro ao carregar desalojados:', err);
            toast.error('Erro', 'Não foi possível carregar os registros de desalojados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const handleSync = () => loadData();
        window.addEventListener('sync-complete', handleSync);
        return () => window.removeEventListener('sync-complete', handleSync);
    }, [operacaoAtiva]);

    const stats = useMemo(() => {
        const ativos = records.filter(r => r.status === 'ativo');
        const encerrados = records.filter(r => r.status !== 'ativo');
        const totalPessoasAtivas = ativos.reduce((acc, r) => acc + (parseInt(r.qtd_pessoas, 10) || 1), 0);
        const bairrosAfetados = new Set(ativos.map(r => (r.bairro_origem || '').trim()).filter(Boolean)).size;
        return {
            totalPessoasAtivas,
            totalFamiliasAtivas: ativos.length,
            totalEncerrados: encerrados.length,
            bairrosAfetados
        };
    }, [records]);

    const filteredRecords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return records.filter(r => {
            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
            if (!matchesStatus) return false;
            if (!q) return true;
            return (
                (r.responsavel_nome || '').toLowerCase().includes(q) ||
                (r.bairro_origem || '').toLowerCase().includes(q) ||
                (r.endereco_origem || '').toLowerCase().includes(q) ||
                (r.local_acolhimento || '').toLowerCase().includes(q) ||
                (r.telefone || '').toLowerCase().includes(q) ||
                (r.motivo || '').toLowerCase().includes(q)
            );
        });
    }, [records, searchQuery, statusFilter]);

    const openNewModal = () => {
        setEditingRecord(null);
        setFormData({
            ...INITIAL_FORM,
            data_registro: new Date().toISOString().slice(0, 10)
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rec) => {
        setEditingRecord(rec);
        setFormData({
            responsavel_nome: rec.responsavel_nome || '',
            cpf: rec.cpf || '',
            telefone: rec.telefone || '',
            qtd_pessoas: parseInt(rec.qtd_pessoas, 10) || 1,
            qtd_adultos: parseInt(rec.qtd_adultos, 10) || 0,
            qtd_criancas: parseInt(rec.qtd_criancas, 10) || 0,
            qtd_idosos: parseInt(rec.qtd_idosos, 10) || 0,
            qtd_pcd: parseInt(rec.qtd_pcd, 10) || 0,
            bairro_origem: rec.bairro_origem || '',
            endereco_origem: rec.endereco_origem || '',
            tipo_acolhimento: rec.tipo_acolhimento || 'Casa de Parentes',
            local_acolhimento: rec.local_acolhimento || '',
            motivo: rec.motivo || 'Alagamento',
            status: rec.status || 'ativo',
            data_registro: rec.data_registro ? String(rec.data_registro).slice(0, 10) : new Date().toISOString().slice(0, 10),
            observacoes: rec.observacoes || ''
        });
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let parsed = value;
        if (name === 'cpf') parsed = applyCpfMask(value);
        if (name === 'telefone') parsed = applyPhoneMask(value);
        if (['qtd_pessoas', 'qtd_adultos', 'qtd_criancas', 'qtd_idosos', 'qtd_pcd'].includes(name)) {
            parsed = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
        }
        setFormData(prev => ({ ...prev, [name]: parsed }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.responsavel_nome.trim()) {
            toast.warning('Campo obrigatório', 'Informe o nome do responsável ou da família.');
            return;
        }
        const qtd = Math.max(1, parseInt(formData.qtd_pessoas, 10) || 1);

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                responsavel_nome: formData.responsavel_nome.trim(),
                qtd_pessoas: qtd,
                qtd_adultos: parseInt(formData.qtd_adultos, 10) || 0,
                qtd_criancas: parseInt(formData.qtd_criancas, 10) || 0,
                qtd_idosos: parseInt(formData.qtd_idosos, 10) || 0,
                qtd_pcd: parseInt(formData.qtd_pcd, 10) || 0,
                data_registro: formData.data_registro ? new Date(`${formData.data_registro}T12:00:00`).toISOString() : new Date().toISOString(),
                data_retorno: formData.status === 'retornou' ? new Date().toISOString() : null
            };

            if (editingRecord) {
                await updateDesalojado(editingRecord.id || editingRecord.desalojado_id, payload);
                toast.success('Atualizado!', 'Registro de desalojados atualizado com sucesso.');
            } else {
                await addDesalojado(payload);
                toast.success('Registrado!', 'Desalojados cadastrados com sucesso.');
            }

            setIsModalOpen(false);
            await loadData();
        } catch (err) {
            console.error('Erro ao salvar desalojado:', err);
            toast.error('Erro ao salvar', 'Não foi possível salvar o registro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleRetorno = async (rec) => {
        const nextStatus = rec.status === 'ativo' ? 'retornou' : 'ativo';
        try {
            await updateDesalojado(rec.id || rec.desalojado_id, {
                status: nextStatus,
                data_retorno: nextStatus === 'retornou' ? new Date().toISOString() : null
            });
            toast.success(
                nextStatus === 'retornou' ? 'Retorno registrado' : 'Reativado',
                nextStatus === 'retornou' ? 'Família marcada como retornada à residência.' : 'Registro marcado novamente como desalojado ativo.'
            );
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível atualizar o status.');
        }
    };

    const handleDelete = async (rec) => {
        if (!window.confirm(`Deseja excluir o registro de "${rec.responsavel_nome}"?`)) return;
        try {
            await deleteDesalojado(rec.id || rec.desalojado_id);
            toast.success('Excluído', 'Registro removido com sucesso.');
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível excluir o registro.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Carregando Desalojados...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/assisthumanitaria')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black leading-tight uppercase tracking-tight">Gestão de Desalojados</h1>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Pessoas e famílias fora de abrigos públicos
                        </p>
                    </div>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-amber-600/20 active:scale-95 transition-all"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Inserir Desalojados</span>
                    <span className="sm:hidden">Inserir</span>
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-3xl text-white shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                            <Users size={20} className="text-white/80" />
                            <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">Ativos</span>
                        </div>
                        <div className="text-3xl font-black">{stats.totalPessoasAtivas}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-amber-100 mt-1">Pessoas Desalojadas</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <Home size={20} className="text-amber-600" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.totalFamiliasAtivas}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Famílias Ativas</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <MapPin size={20} className="text-blue-600" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.bairrosAfetados}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Localidades Afetadas</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <UserCheck size={20} className="text-emerald-600" />
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.totalEncerrados}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Retornaram / Encerrados</div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por responsável, bairro, endereço, telefone ou motivo..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                        {[
                            { key: 'ativo', label: 'Ativos' },
                            { key: 'retornou', label: 'Retornaram' },
                            { key: 'encaminhado_abrigo', label: 'Abrigo' },
                            { key: 'all', label: 'Todos' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setStatusFilter(tab.key)}
                                className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    statusFilter === tab.key
                                        ? 'bg-amber-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Records List */}
                {filteredRecords.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
                            <Users size={30} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-200 mb-1">
                            Nenhum registro de desalojados encontrado
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
                            Cadastre famílias e pessoas que precisaram deixar suas residências e estão acolhidas em casas de parentes, amigos ou aluguel social. Esses dados alimentam automaticamente o Relatório Situacional.
                        </p>
                        <button
                            onClick={openNewModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                        >
                            <Plus size={16} />
                            Inserir Primeiro Registro
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRecords.map(rec => {
                            const statusMeta = STATUS_META[rec.status] || STATUS_META.ativo;
                            return (
                                <div
                                    key={rec.id || rec.desalojado_id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                                                        {rec.responsavel_nome}
                                                    </h3>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusMeta.badge}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex-wrap">
                                                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-black">
                                                        <Users size={13} />
                                                        {rec.qtd_pessoas} {parseInt(rec.qtd_pessoas, 10) === 1 ? 'pessoa' : 'pessoas'}
                                                    </span>
                                                    {rec.motivo && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <AlertTriangle size={12} className="text-orange-500" />
                                                            {rec.motivo}
                                                        </span>
                                                    )}
                                                    {rec.data_registro && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {new Date(rec.data_registro).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Origem</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    {rec.bairro_origem || 'Bairro não informado'}
                                                </span>
                                                {rec.endereco_origem && (
                                                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                        {rec.endereco_origem}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Acolhimento Atual</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    {rec.tipo_acolhimento || 'Casa de Parentes'}
                                                </span>
                                                {rec.local_acolhimento && (
                                                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                        {rec.local_acolhimento}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {(rec.telefone || rec.qtd_criancas > 0 || rec.qtd_idosos > 0 || rec.qtd_pcd > 0) && (
                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                                                {rec.telefone && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        <Phone size={11} /> {rec.telefone}
                                                    </span>
                                                )}
                                                {rec.qtd_criancas > 0 && (
                                                    <span className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                                                        Crianças: {rec.qtd_criancas}
                                                    </span>
                                                )}
                                                {rec.qtd_idosos > 0 && (
                                                    <span className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                        Idosos: {rec.qtd_idosos}
                                                    </span>
                                                )}
                                                {rec.qtd_pcd > 0 && (
                                                    <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                                                        PCD: {rec.qtd_pcd}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {rec.observacoes && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                                                {rec.observacoes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => handleToggleRetorno(rec)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                                                rec.status === 'ativo'
                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                            }`}
                                        >
                                            {rec.status === 'ativo' ? (
                                                <>
                                                    <CheckCircle2 size={14} /> Marcar Retorno
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw size={14} /> Reativar
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(rec)}
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rec)}
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                                            title="Excluir"
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

            {/* Modal Cadastro / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">
                                    {editingRecord ? 'Editar Registro de Desalojados' : 'Inserir Desalojados'}
                                </h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Preencha os dados da família ou pessoa desalojada
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Nome do Responsável / Família *
                                    </label>
                                    <input
                                        type="text"
                                        name="responsavel_nome"
                                        required
                                        value={formData.responsavel_nome}
                                        onChange={handleChange}
                                        placeholder="Ex: Maria da Silva (Família Silva)"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Telefone / Contato
                                    </label>
                                    <input
                                        type="text"
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handleChange}
                                        placeholder="(27) 99999-9999"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        CPF (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>
                            </div>

                            {/* Quantitativo */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/40 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
                                            Total Pessoas *
                                        </label>
                                        <input
                                            type="number"
                                            name="qtd_pessoas"
                                            min="1"
                                            required
                                            value={formData.qtd_pessoas}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-base font-black text-center outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Adultos</label>
                                        <input
                                            type="number"
                                            name="qtd_adultos"
                                            min="0"
                                            value={formData.qtd_adultos}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Crianças</label>
                                        <input
                                            type="number"
                                            name="qtd_criancas"
                                            min="0"
                                            value={formData.qtd_criancas}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Idosos</label>
                                        <input
                                            type="number"
                                            name="qtd_idosos"
                                            min="0"
                                            value={formData.qtd_idosos}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">PCD</label>
                                        <input
                                            type="number"
                                            name="qtd_pcd"
                                            min="0"
                                            value={formData.qtd_pcd}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-center outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Localidade & Acolhimento */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Bairro / Comunidade de Origem
                                    </label>
                                    <input
                                        type="text"
                                        name="bairro_origem"
                                        list="bairros-desalojados-list"
                                        value={formData.bairro_origem}
                                        onChange={handleChange}
                                        placeholder="Selecione ou digite o bairro"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                    <datalist id="bairros-desalojados-list">
                                        {(bairrosData || []).map((b, idx) => (
                                            <option key={idx} value={typeof b === 'string' ? b : (b.nome || b.Bairro || '')} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Endereço de Origem
                                    </label>
                                    <input
                                        type="text"
                                        name="endereco_origem"
                                        value={formData.endereco_origem}
                                        onChange={handleChange}
                                        placeholder="Rua, número, ponto de referência"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Tipo de Acolhimento
                                    </label>
                                    <select
                                        name="tipo_acolhimento"
                                        value={formData.tipo_acolhimento}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    >
                                        {TIPO_ACOLHIMENTO_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Local / Endereço de Acolhimento
                                    </label>
                                    <input
                                        type="text"
                                        name="local_acolhimento"
                                        value={formData.local_acolhimento}
                                        onChange={handleChange}
                                        placeholder="Onde a família está hospedada"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                        Motivo / Evento
                                    </label>
                                    <select
                                        name="motivo"
                                        value={formData.motivo}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500/40"
                                    >
                                        {MOTIVO_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Data Registro
                                        </label>
                                        <input
                                            type="date"
                                            name="data_registro"
                                            value={formData.data_registro}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Situação
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                                        >
                                            <option value="ativo">Desalojado Ativo</option>
                                            <option value="retornou">Retornou</option>
                                            <option value="encaminhado_abrigo">Encam. Abrigo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                    Observações / Necessidades
                                </label>
                                <textarea
                                    name="observacoes"
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    placeholder="Necessidades de cestas, medicamentos, colchões ou observações gerais..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/40"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                                >
                                    <Save size={15} />
                                    {isSubmitting ? 'Salvando...' : editingRecord ? 'Salvar Alterações' : 'Cadastrar Desalojados'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
