import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ArrowLeft, Search, Clock, CheckCircle,
    AlertTriangle, ShieldAlert, ChevronRight, MapPin, Trash2,
    Eye, ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';
import { getOcorrenciasLocal, deleteOcorrenciaLocal, saveOcorrenciaLocal } from '../../services/ocorrenciasDb';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const OCORRENCIA_STATUSES = {
    'Pendente': { label: 'Pendente', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Em Análise': { label: 'Em Análise', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    'Em Atendimento': { label: 'Em Atendimento', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    'Atendido': { label: 'Atendido', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'Finalizada': { label: 'Finalizada', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Cancelada': { label: 'Cancelada', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
};

const OcorrenciasDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [statusModalRecord, setStatusModalRecord] = useState(null);

    useEffect(() => {
        loadRecords();
        window.addEventListener('sync-complete', loadRecords);
        return () => window.removeEventListener('sync-complete', loadRecords);
    }, []);

    const loadRecords = async () => {
        try {
            const data = await getOcorrenciasLocal();
            setRecords(data);
        } catch (error) {
            console.error('Error loading records:', error);
            toast.error('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteOcorrenciaLocal(recordToDelete.id);
            toast.success('Registro removido.');
            loadRecords();
        } catch (error) {
            toast.error('Falha ao excluir.');
        } finally {
            setShowDeleteModal(false);
            setRecordToDelete(null);
        }
    };

    const handleStatusChange = async (record, newStatus) => {
        try {
            await saveOcorrenciaLocal({ ...record, status: newStatus });
            toast.success('Status atualizado com sucesso!');
            loadRecords();
        } catch (e) {
            toast.error('Erro ao atualizar status.');
        } finally {
            setStatusModalRecord(null);
        }
    };

    const filtered = records.filter(r => {
        const search = searchTerm.toLowerCase();
        return (
            (r.categoriaRisco || r.categoria_risco || '').toLowerCase().includes(search) ||
            (r.bairro || '').toLowerCase().includes(search) ||
            (r.endereco || '').toLowerCase().includes(search) ||
            (r.solicitante || '').toLowerCase().includes(search) ||
            (r.ocorrencia_id_format || '').toLowerCase().includes(search)
        );
    });


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Preparando registros...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-32 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-all active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Ocorrências</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Log de Atendimento Operacional</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/ocorrencias/novo')}
                        className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-6 h-12"
                    >
                        <Plus size={18} className="mr-2" /> <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo</span>
                    </Button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-5 sm:p-8 space-y-8">
                {/* Search */}
                <div className="relative group max-w-2xl mx-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, logradouro, bairro ou ID..."
                        className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all font-bold text-sm dark:text-white placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                                <ShieldAlert size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Nenhum registro</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 px-10">Tudo limpo por aqui. Nenhuma ocorrência nestes critérios.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filtered.map((record) => (
                                <Card
                                    key={record.id}
                                    className="group relative bg-white dark:bg-slate-800 p-6 border-slate-100 dark:border-slate-700 hover:shadow-xl hover:translate-y-[-4px] active:scale-[0.98] transition-all cursor-pointer overflow-hidden"
                                    onClick={() => navigate(`/ocorrencias/editar/${record.id}`)}
                                >
                                    <div className="flex flex-col h-full justify-between gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    {record.ocorrencia_id_format && (
                                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-xl uppercase">
                                                            ID: {record.ocorrencia_id_format}
                                                        </span>
                                                    )}
                                                </div>

                                                {record.synced ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                                        <CheckCircle size={14} />
                                                        <span className="text-[9px] font-black uppercase">Sincronizado</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-orange-400 animate-pulse">
                                                        <Clock size={14} />
                                                        <span className="text-[9px] font-black uppercase tracking-wider">Local</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1 items-start">
                                                <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight group-hover:text-red-500 transition-colors">
                                                    {record.categoriaRisco || record.categoria_risco || 'Ocorrência sem título'}
                                                </h3>
                                                {(record.subtiposRisco || record.subtipos_risco) && (record.subtiposRisco?.length > 0 || record.subtipos_risco?.length > 0) && (
                                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 line-clamp-2 leading-snug">
                                                        {Array.isArray(record.subtiposRisco || record.subtipos_risco)
                                                            ? (record.subtiposRisco || record.subtipos_risco).join(', ')
                                                            : (record.subtiposRisco || record.subtipos_risco)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 pt-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <Clock size={12} />
                                                        {new Date(record.created_at).toLocaleDateString('pt-BR')}
                                                    </div>

                                                    {/* Status Toggler Button */}
                                                    <div className="relative">
                                                        {(() => {
                                                            const st = OCORRENCIA_STATUSES[record.status || 'Pendente'] || OCORRENCIA_STATUSES['Pendente'];
                                                            return (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setStatusModalRecord(record);
                                                                    }}
                                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border} hover:scale-105 active:scale-95 transition-all`}
                                                                >
                                                                    {st.label}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                                {record.bairro && (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        <MapPin size={14} className="text-red-500" />
                                                        {record.bairro}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRecordToDelete(record);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="w-10 h-10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decorator */}
                                    {!record.synced && (
                                        <div className="absolute top-0 right-0 w-2 h-full bg-orange-400 opacity-20"></div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Excluir Ocorrência?"
                message={`Tem certeza que deseja apagar a ocorrência ${recordToDelete?.ocorrencia_id_format || ''}?`}
                isDestructive={true}
            />

            {/* Status Modal */}
            {statusModalRecord && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">Alterar Status</h3>
                                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                                    ID: {statusModalRecord?.ocorrencia_id_format}
                                </div>
                            </div>
                            <button
                                onClick={() => setStatusModalRecord(null)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {Object.keys(OCORRENCIA_STATUSES).map(key => {
                                const opt = OCORRENCIA_STATUSES[key];
                                const isActive = statusModalRecord.status === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusChange(statusModalRecord, key)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${isActive ? `border-transparent ${opt.bg} ${opt.text} shadow-inner` : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <div className={`text-xs font-black uppercase tracking-widest ${isActive ? '' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {opt.label}
                                        </div>
                                        {isActive && <CheckCircle size={18} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OcorrenciasDashboard;
