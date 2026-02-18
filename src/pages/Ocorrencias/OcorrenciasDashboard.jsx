import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ArrowLeft, Search, Clock, CheckCircle,
    AlertTriangle, ShieldAlert, ChevronRight, MapPin, Trash2
} from 'lucide-react';
import { getS2idRecords, deleteS2idLocal } from '../../services/s2idDb';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';

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
        // Subscribe to sync completion to refresh status
        window.addEventListener('sync-complete', loadRecords);
        return () => window.removeEventListener('sync-complete', loadRecords);
    }, []);

    const loadRecords = async () => {
        try {
            const data = await getS2idRecords();
            // We reuse s2id_records table but filter or show only those with location/basic data
            // For now, show all but prioritize newer ones
            setRecords(data.filter(r => r.status !== 'deleted'));
        } catch (error) {
            console.error('Error loading records:', error);
            toast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteS2idLocal(recordToDelete.id);
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
        (r.data?.tipificacao?.denominacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.data?.tipificacao?.cobrade || '').includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-[#2a5299] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/menu')} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight">Ocorrências</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registros Operacionais</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/ocorrencias/novo')}
                    className="bg-[#2a5299] text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all hover:bg-[#1e3c72] flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo</span>
                </button>
            </header>

            <main className="p-5 space-y-5">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-black text-slate-800">{records.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Pendentes</p>
                        <p className="text-xl font-black text-orange-500">{records.filter(r => !r.synced).length}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#2a5299] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar ocorrência..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-[#2a5299] outline-none transition-all font-medium text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="bg-white w-16 h-16 rounded-[24px] shadow-sm flex items-center justify-center mx-auto text-slate-200">
                                <ShieldAlert size={32} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma ocorrência encontrada</p>
                        </div>
                    ) : (
                        filtered.map((record) => (
                            <div
                                key={record.id}
                                className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
                                onClick={() => navigate(`/ocorrencias/editar/${record.id}`)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-blue-50 text-[#2a5299] px-2 py-0.5 rounded-lg uppercase border border-blue-100">
                                                {record.data?.tipificacao?.cobrade || 'GERAL'}
                                            </span>
                                            {record.synced ? (
                                                <span className="text-[8px] font-black flex items-center gap-1 text-emerald-500 uppercase">
                                                    <CheckCircle size={10} /> Sincronizado
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black flex items-center gap-1 text-orange-400 uppercase">
                                                    <Clock size={10} /> Local
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-slate-800 text-base leading-tight group-hover:text-[#2a5299] transition-colors">
                                            {record.data?.tipificacao?.denominacao || 'Ocorrência Pendente'}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(record.created_at).toLocaleDateString()}
                                            </div>
                                            {record.data?.localizacao?.lat && (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <MapPin size={12} />
                                                    GPS Ativo
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-200 group-hover:text-[#2a5299] transition-colors" size={24} />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRecordToDelete(record);
                                        setShowDeleteModal(true);
                                    }}
                                    className="absolute bottom-4 right-4 p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Excluir Registro"
                message="Deseja remover esta ocorrência do dispositivo?"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                type="danger"
            />
        </div>
    );
};

export default OcorrenciasDashboard;
