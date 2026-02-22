import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ArrowLeft, Search, Clock, CheckCircle,
    AlertTriangle, ShieldAlert, ChevronRight, MapPin, Trash2,
    Eye, ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';
import { getOcorrenciasLocal, deleteOcorrenciaLocal } from '../../services/ocorrenciasDb';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const OcorrenciasDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

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

    const filtered = records.filter(r =>
        (r.denominacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.cobrade || '').includes(searchTerm)
    );

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
                            onClick={() => navigate('/menu')}
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
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{records.length}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pendentes</p>
                                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none mt-1">{records.filter(r => !r.synced).length}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative group max-w-2xl mx-auto">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por denominação ou COBRADE..."
                        className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm focus:ring-8 focus:ring-red-500/5 focus:border-red-500/50 outline-none transition-all font-bold text-sm dark:text-white placeholder:text-slate-300"
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
                                                <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-xl uppercase border border-blue-100 dark:border-blue-800/50">
                                                    {record.cobrade || 'GERAL'}
                                                </span>
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

                                            <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight group-hover:text-red-500 transition-colors">
                                                {record.denominacao || 'Ocorrência sem título'}
                                            </h3>

                                            <div className="flex flex-col gap-2 pt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <Clock size={12} />
                                                    {new Date(record.created_at).toLocaleDateString('pt-BR')} - {new Date(record.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                title="Excluir Ocorrência"
                message="Deseja remover permanentemente este registro do dispositivo?"
                onConfirm={handleDelete}
                onClose={() => setShowDeleteModal(false)}
                type="danger"
            />
        </div>
    );
};

export default OcorrenciasDashboard;
