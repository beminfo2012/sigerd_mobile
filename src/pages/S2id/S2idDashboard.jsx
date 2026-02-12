import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, FileText, Trash2, Edit3,
    ArrowLeft, Search, AlertCircle,
    Download, Clock, CheckCircle,
    ChevronRight, Globe
} from 'lucide-react';
import { getS2idRecords, deleteS2idLocal } from '../../services/s2idDb';
import { useToast } from '../../components/ToastNotification';
import ConfirmModal from '../../components/ConfirmModal';
import { UserContext } from '../../App';
import { generateS2idReport } from '../../utils/s2idReportGenerator';

const S2idDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const data = await getS2idRecords();
            setRecords(data.filter(r => r.status !== 'deleted'));
        } catch (error) {
            console.error('Error loading records:', error);
            toast.error('Erro', 'Falha ao carregar registros S2id.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteS2idLocal(recordToDelete.id);
            toast.success('Excluído', 'Registro removido com sucesso.');
            loadRecords();
        } catch (error) {
            toast.error('Erro', 'Falha ao excluir registro.');
        } finally {
            setShowDeleteModal(false);
            setRecordToDelete(null);
        }
    };

    const filteredRecords = records.filter(r =>
        r.data.tipificacao.denominacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.data.tipificacao.cobrade.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/menu')} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95 text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 leading-tight flex items-center gap-2">
                            Módulo S2id <Globe size={16} className="text-blue-600" />
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistema Nacional de Desastres</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/s2id/novo')}
                    className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo Registro</span>
                </button>
            </header>

            <main className="p-4 max-w-4xl mx-auto space-y-4">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por tipificação ou COBRADE..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <Clock className="text-amber-500 mb-2" size={20} />
                        <div>
                            <div className="text-2xl font-black text-slate-800">{records.filter(r => r.status === 'draft').length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rascunhos</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <CheckCircle className="text-emerald-500 mb-2" size={20} />
                        <div>
                            <div className="text-2xl font-black text-slate-800">{records.filter(r => r.status === 'submitted').length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enviados</div>
                        </div>
                    </div>
                </div>

                {/* Records List */}
                <div className="space-y-3">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Registros Recentes</h2>

                    {filteredRecords.length === 0 ? (
                        <div className="bg-white border border-dashed border-slate-300 rounded-[32px] p-12 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full">
                                <FileText size={32} className="text-slate-300" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800">Nenhum registro encontrado</h3>
                                <p className="text-slate-400 text-xs mt-1">Toque em "Novo Registro" para começar.</p>
                            </div>
                            <button
                                onClick={() => navigate('/s2id/novo')}
                                className="mt-2 text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
                            >
                                Criar Primeiro Registro
                            </button>
                        </div>
                    ) : (
                        filteredRecords.map((record, index) => (
                            <div
                                key={record.id}
                                className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all active:scale-[0.98] group relative"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${record.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm">
                                                {record.data.tipificacao.denominacao || "Sem Tipificação"}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                COBRADE: {record.data.tipificacao.cobrade || '---'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${record.synced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {record.synced ? 'Sincronizado' : 'Local'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 py-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(record.updated_at).toLocaleDateString()}</span>
                                    <span className={`flex items-center gap-1 ${record.status === 'submitted' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'submitted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        {record.status === 'submitted' ? 'Finalizado' : 'Em Aberto'}
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-slate-50">
                                    <button
                                        onClick={() => navigate(`/s2id/editar/${record.id}`)}
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button
                                        onClick={() => generateS2idReport(record, user)}
                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={14} /> Relatório
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRecordToDelete(record);
                                            setShowDeleteModal(true);
                                        }}
                                        className="w-11 h-11 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors flex items-center justify-center shrink-0"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Excluir Registro"
                message="Tem certeza que deseja excluir este formulário S2id? Esta ação pode ser desfeita apenas pela Defesa Civil."
                confirmText="Excluir"
                type="danger"
            />
        </div>
    );
};

export default S2idDashboard;
