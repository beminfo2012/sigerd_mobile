import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, FileText, Trash2, Edit3,
    ArrowLeft, Search, AlertCircle,
    Download, Clock, CheckCircle,
    ChevronRight, Globe, Shield
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
    const [activeTab, setActiveTabInternal] = useState('relatorios'); // 'relatorios' or 'monitoramento'
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    const ROLE_MAP = {
        'S2id_Saude': 'saude',
        'S2id_Obras': 'obras',
        'S2id_Social': 'social',
        'S2id_Educacao': 'educacao',
        'S2id_Agricultura': 'agricultura',
        'S2id_Interior': 'interior',
        'S2id_Administracao': 'administracao',
        'S2id_CDL': 'cdl',
        'S2id_Cesan': 'cesan',
        'S2id_DefesaSocial': 'defesa_social',
        'S2id_EsporteTurismo': 'esporte_turismo',
        'S2id_ServicosUrbanos': 'servicos_urbanos',
        'S2id_Transportes': 'transportes'
    };

    const activeSector = ROLE_MAP[user?.role] || (user?.role?.startsWith('S2id_') ? user.role.replace('S2id_', '').toLowerCase() : null);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const data = await getS2idRecords();
            setRecords(data.filter(r => r.status !== 'deleted'));
        } catch (error) {
            console.error('Error loading records:', error);
            toast('Falha ao carregar registros S2id.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteS2idLocal(recordToDelete.id);
            toast('Registro removido com sucesso.', 'success');
            loadRecords();
        } catch (error) {
            toast('Falha ao excluir registro.', 'error');
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

    const secretariasOrder = [
        'saude', 'obras', 'social', 'educacao', 'agricultura', 'interior',
        'administracao', 'cdl', 'cesan', 'defesa_social', 'esporte_turismo',
        'servicos_urbanos', 'transportes'
    ];

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
                {['Admin', 'Coordenador', 'Agente de Defesa Civil'].includes(user?.role) && (
                    <button
                        onClick={() => navigate('/s2id/novo')}
                        className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo Registro</span>
                    </button>
                )}
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Tabs */}
                {['Admin', 'Coordenador', 'Agente de Defesa Civil'].includes(user?.role) && (
                    <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit mx-auto sm:mx-0">
                        <button
                            onClick={() => setActiveTabInternal('relatorios')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'relatorios' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Relatórios
                        </button>
                        <button
                            onClick={() => setActiveTabInternal('monitoramento')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'monitoramento' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monitoramento
                        </button>
                    </div>
                )}

                {activeTab === 'relatorios' ? (
                    <>
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

                        {/* List */}
                        <div className="grid gap-4">
                            {filteredRecords.map((record) => (
                                <div key={record.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.99] group relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{record.data.tipificacao.cobrade || 'Pendente'}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${record.status === 'finalized' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {record.status}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                {record.data.tipificacao.denominacao || 'Relatório Sem Título'}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 flex items-center gap-2">
                                                <Clock size={14} className="text-slate-400" />
                                                Criado em {new Date(record.created_at).toLocaleDateString()}
                                            </p>

                                            {/* Levantamento Setorial Badges */}
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {Object.entries(record.data.submissoes_setoriais || {})
                                                    .filter(([_, sub]) => sub.preenchido)
                                                    .map(([sec, _]) => (
                                                        <span key={sec} className="text-[7px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">
                                                            {sec.replace(/_/g, ' ')}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => navigate(`/s2id/editar/${record.id}`)}
                                                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRecordToDelete(record);
                                                    setShowDeleteModal(true);
                                                }}
                                                className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Actions Footer */}
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {record.synced ? (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase tracking-tighter bg-green-50 px-2 py-1 rounded-lg">
                                                    <CheckCircle size={10} /> Sincronizado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-2 py-1 rounded-lg">
                                                    <Clock size={10} /> Pendente
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => generateS2idReport(record, user, activeSector)}
                                            className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
                                        >
                                            <Download size={14} /> {activeSector ? 'Relatório Setorial' : 'Gerar PDF'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredRecords.length === 0 && (
                                <div className="p-12 text-center space-y-4">
                                    <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                                        <FileText size={32} />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">Nenhum registro encontrado.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Monitoramento Grid */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-x-auto">
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Shield className="text-blue-600" size={18} /> Painel de Progresso Setorial
                            </h2>

                            <table className="w-full text-[10px] border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left pb-4 font-black text-slate-400 uppercase tracking-widest">Relatório</th>
                                        {secretariasOrder.map(sec => (
                                            <th key={sec} className="px-2 pb-4 font-black text-slate-400 uppercase tracking-tighter text-center">
                                                <div className="w-8 mx-auto truncate" title={sec}>{sec.substring(0, 3)}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {records.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 pr-4">
                                                <p className="font-bold text-slate-700 capitalize text-xs">{r.data.tipificacao.denominacao}</p>
                                                <p className="text-[8px] text-slate-400 font-black">{r.data.tipificacao.cobrade}</p>
                                            </td>
                                            {secretariasOrder.map(sec => {
                                                const sub = r.data.submissoes_setoriais?.[sec];
                                                return (
                                                    <td key={sec} className="px-2 py-4 text-center">
                                                        {sub?.preenchido ? (
                                                            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm" title={`Finalizado por ${sub.usuario}`}>
                                                                <CheckCircle size={14} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-6 h-6 border-2 border-dashed border-slate-200 rounded-full mx-auto"></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Excluir Registro"
                message={`Tem certeza que deseja excluir este relatório?`}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                type="danger"
            />
        </div>
    );
};

export default S2idDashboard;
