import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, FileText, Trash2, Edit3,
    ArrowLeft, Search, AlertCircle,
    Download, Clock, CheckCircle,
    ChevronRight, Globe, Shield, FileStack, RefreshCw
} from 'lucide-react';
import S2idDocsModal from './components/S2idDocsModal';
import { getS2idRecords, deleteS2idLocal } from '../../services/s2idDb';
import { syncPendingData } from '../../services/db';
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
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [selectedRecordForDocs, setSelectedRecordForDocs] = useState(null);
    const [syncing, setSyncing] = useState(false);

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

    const loadRecords = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getS2idRecords();
            setRecords(data.filter(r => r.status !== 'deleted'));
        } catch (error) {
            console.error('Error loading records:', error);
            if (!silent) toast('Falha ao carregar registros S2id.', 'error');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleManualSync = async () => {
        if (syncing) return;
        setSyncing(true);
        toast('Sincronizando registros...', 'info');
        try {
            const result = await syncPendingData();
            if (result.success) {
                if (result.count > 0) {
                    toast.success(`${result.count} registros sincronizados!`);
                } else {
                    toast.success('Tudo atualizado.');
                }
                await loadRecords(true);
            }
        } catch (error) {
            console.error('Manual sync failed:', error);
            toast.error('Falha na sincronização.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteS2idLocal(recordToDelete.id);
            toast.success('Registro removido com sucesso.');
            loadRecords();
        } catch (error) {
            toast.error('Falha ao excluir registro.');
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
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sistema Nacional de Desastres</p>
                            {activeSector && (
                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase border border-blue-100">
                                    Setor: {activeSector === 'obras' ? 'SECURB' : activeSector.replace(/_/g, ' ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className={`p-2.5 rounded-xl transition-all ${syncing ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-95'}`}
                        title="Sincronizar Agora"
                    >
                        <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
                    </button>
                    {['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role) && (
                        <button
                            onClick={() => navigate('/s2id/novo')}
                            className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md active:scale-95 transition-all hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Novo Registro</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-4">
                {/* Tabs */}
                {['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role) && (
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
                                                            {sec === 'obras' ? 'SECURB' : sec.replace(/_/g, ' ')}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => navigate(`/s2id/editar/${record.s2id_id || record.id}`)}
                                                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            {['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'admin'].includes(user?.role) && (
                                                <button
                                                    onClick={() => {
                                                        setRecordToDelete(record);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
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

                                        {['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role) && (
                                            <button
                                                onClick={() => {
                                                    setSelectedRecordForDocs(record);
                                                    setShowDocsModal(true);
                                                }}
                                                className="text-[9px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1 hover:bg-blue-100 bg-blue-50/50 px-3 py-1.5 rounded-xl transition-all border border-blue-100"
                                            >
                                                <FileStack size={14} /> Documentos
                                            </button>
                                        )}
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
                    /* ═══ PAINEL DE PROGRESSO SETORIAL ═══ */
                    <div className="space-y-6 animate-in fade-in duration-500">

                        {/* Global Stats Bar */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-black text-blue-600">{records.length}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">FIDEs Ativos</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-black text-emerald-600">
                                    {records.length > 0
                                        ? Math.round(records.reduce((acc, r) => {
                                            const subs = r.data.submissoes_setoriais || {};
                                            const filled = Object.values(subs).filter(s => s.preenchido).length;
                                            return acc + (filled / secretariasOrder.length) * 100;
                                        }, 0) / records.length)
                                        : 0}%
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completude Média</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-black text-amber-600">
                                    {records.filter(r => {
                                        const subs = r.data.submissoes_setoriais || {};
                                        return Object.values(subs).filter(s => s.preenchido).length === secretariasOrder.length;
                                    }).length}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">100% Completos</p>
                            </div>
                        </div>

                        {/* Per-FIDE Progress Cards */}
                        {records.map(r => {
                            const subs = r.data.submissoes_setoriais || {};
                            const filledCount = Object.values(subs).filter(s => s.preenchido).length;
                            const totalSectors = secretariasOrder.length;
                            const pct = Math.round((filledCount / totalSectors) * 100);
                            const circumference = 2 * Math.PI * 40;
                            const strokeDashoffset = circumference - (pct / 100) * circumference;

                            const SECTOR_LABELS = {
                                saude: { name: 'Saúde', icon: '🏥', color: 'rose' },
                                obras: { name: 'SECURB', icon: '🏗️', color: 'orange' },
                                social: { name: 'Social', icon: '🤝', color: 'pink' },
                                educacao: { name: 'Educação', icon: '📚', color: 'indigo' },
                                agricultura: { name: 'Agricultura', icon: '🌾', color: 'lime' },
                                interior: { name: 'Interior', icon: '🏔️', color: 'teal' },
                                administracao: { name: 'Administração', icon: '🏛️', color: 'slate' },
                                cdl: { name: 'CDL', icon: '🏪', color: 'violet' },
                                cesan: { name: 'CESAN', icon: '💧', color: 'cyan' },
                                defesa_social: { name: 'Defesa Social', icon: '🛡️', color: 'red' },
                                esporte_turismo: { name: 'Esporte/Turismo', icon: '⚽', color: 'emerald' },
                                servicos_urbanos: { name: 'Serv. Urbanos', icon: '🏙️', color: 'amber' },
                                transportes: { name: 'Transportes', icon: '🚛', color: 'blue' }
                            };

                            return (
                                <div key={r.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    {/* FIDE Header with Progress Ring */}
                                    <div className="p-5 flex items-center gap-4 border-b border-slate-50">
                                        {/* SVG Progress Ring */}
                                        <div className="relative flex-shrink-0">
                                            <svg width="90" height="90" viewBox="0 0 90 90" className="-rotate-90">
                                                <circle cx="45" cy="45" r="40" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                                <circle
                                                    cx="45" cy="45" r="40" fill="none"
                                                    stroke={pct === 100 ? '#10b981' : pct > 50 ? '#3b82f6' : '#f59e0b'}
                                                    strokeWidth="6"
                                                    strokeLinecap="round"
                                                    strokeDasharray={circumference}
                                                    strokeDashoffset={strokeDashoffset}
                                                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-lg font-black text-slate-800">{pct}%</span>
                                                <span className="text-[8px] font-bold text-slate-400">{filledCount}/{totalSectors}</span>
                                            </div>
                                        </div>

                                        {/* FIDE Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                    {r.data.tipificacao.cobrade || 'N/A'}
                                                </span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${pct === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {pct === 100 ? 'Completo' : 'Em Andamento'}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-800 text-sm leading-tight truncate">
                                                {r.data.tipificacao.denominacao || 'FIDE Sem Título'}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Clock size={11} />
                                                {r.data.data_ocorrencia?.dia ? `${r.data.data_ocorrencia.dia}/${r.data.data_ocorrencia.mes}/${r.data.data_ocorrencia.ano}` : new Date(r.created_at).toLocaleDateString('pt-BR')}
                                            </p>

                                            {/* Mini progress bar */}
                                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => navigate(`/s2id/editar/${r.s2id_id || r.id}`)}
                                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex-shrink-0"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    </div>

                                    {/* Sector Grid */}
                                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {secretariasOrder.map(sec => {
                                            const sub = subs[sec];
                                            const info = SECTOR_LABELS[sec] || { name: sec, icon: '📋', color: 'slate' };
                                            const done = sub?.preenchido;

                                            return (
                                                <div
                                                    key={sec}
                                                    className={`relative rounded-2xl p-3 border transition-all ${done
                                                        ? 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                                                        : 'bg-slate-50/50 border-slate-100 border-dashed'
                                                        }`}
                                                >
                                                    {/* Sector header */}
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-sm">{info.icon}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${done ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                            {info.name}
                                                        </span>
                                                    </div>

                                                    {done ? (
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1">
                                                                <CheckCircle size={11} className="text-emerald-500" />
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase">Preenchido</span>
                                                            </div>
                                                            {sub.responsavel && (
                                                                <p className="text-[8px] text-slate-500 truncate" title={sub.responsavel}>
                                                                    👤 {sub.responsavel}
                                                                </p>
                                                            )}
                                                            {sub.cargo && (
                                                                <p className="text-[7px] text-slate-400 truncate" title={sub.cargo}>
                                                                    {sub.cargo}
                                                                </p>
                                                            )}
                                                            {sub.data && (
                                                                <p className="text-[7px] text-slate-400">
                                                                    📅 {new Date(sub.data).toLocaleDateString('pt-BR')} {new Date(sub.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={() => generateS2idReport(r, user, sec)}
                                                                className="mt-1 w-full text-[7px] font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg py-1 flex items-center justify-center gap-1 transition-all"
                                                            >
                                                                <Download size={9} /> PDF
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock size={11} className="text-slate-300" />
                                                            <span className="text-[8px] font-bold text-slate-300 uppercase">Aguardando</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {records.length === 0 && (
                            <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-100">
                                <div className="bg-slate-100 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                                    <Shield size={32} />
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Nenhum FIDE registrado para monitorar.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* DEBUG FOOTER - TEMPORARY */}
                <div className="mt-8 p-4 bg-slate-900 text-slate-400 text-[10px] font-mono rounded-xl overflow-x-auto">
                    <p className="font-bold text-slate-200 mb-2">DIAGNÓSTICO DE SINCRONIZAÇÃO</p>
                    <p>Total Registros (Memória): {records.length}</p>
                    <p>Status Online: {navigator.onLine ? 'Sim' : 'Não'}</p>
                    <p>Projeto ID: {import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] : 'N/A'}</p>
                    <p>Projeto: {import.meta.env.VITE_SUPABASE_URL ? import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] : 'Indefinido'}</p>
                    <p>Última Atualização: {new Date().toLocaleTimeString()}</p>
                    <button
                        onClick={() => {
                            toast('Forçando recarga completa...', 'info');
                            window.location.reload();
                        }}
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
                    >
                        Forçar Recarga (Hard Reload)
                    </button>
                    <button
                        onClick={async () => {
                            if (!window.confirm("ATENÇÃO: Isso vai apagar o banco local do S2ID e baixar TUDO novamente da nuvem. Seus dados pendentes (não salvos) serão preservados. Deseja continuar?")) return;

                            try {
                                const { rebuildS2idStorage } = await import('../../services/s2idDb');
                                toast('Iniciando reconstrução do módulo...', 'info');

                                const count = await rebuildS2idStorage();

                                alert(`SUCESSO: Módulo reconstruído! ${count} registros baixados e sincronizados.`);
                                window.location.reload();
                            } catch (e) {
                                alert('ERRO CRÍTICO NA RECONSTRUÇÃO: ' + e.message);
                            }
                        }}
                        className="mt-2 ml-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 font-bold"
                    >
                        RECONSTRUIR MÓDULO (Sincronizar Tudo)
                    </button>
                    <button
                        onClick={async () => {
                            const { getS2idRecords } = await import('../../services/s2idDb');
                            const all = await getS2idRecords();
                            const summary = all.map(r => ({
                                id: r.s2id_id ? r.s2id_id.slice(0, 8) : '?',
                                status: r.status,
                                tipificacao: r.data.tipificacao.denominacao || '(Sem Título)',
                                submissoes: Object.entries(r.data.submissoes_setoriais || {})
                                    .map(([s, v]) => `${s}: ${v.preenchido ? '✅' : '❌'}`).join(', ')
                            }));
                            console.table(summary);
                            alert("DADOS BRUTOS (Sincronização):\n\n" +
                                summary.map(s => `[${s.status}] ID:${s.id} - ${s.tipificacao.slice(0, 10)}...: ${s.submissoes}`).join('\n') +
                                "\n\n(Dica: Compare o ID do registro que você preencheu com o que aparece na tela)");
                        }}
                        className="mt-2 ml-2 bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-600"
                    >
                        Ver Dados Brutos (Diagnóstico)
                    </button>
                </div>

            </main >

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Excluir Registro"
                message={`Tem certeza que deseja excluir este relatório?`}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                type="danger"
            />

            <S2idDocsModal
                isOpen={showDocsModal}
                onClose={() => {
                    setShowDocsModal(false);
                    setSelectedRecordForDocs(null);
                }}
                record={selectedRecordForDocs}
                onUpdate={loadRecords}
            />
        </div >
    );
};

export default S2idDashboard;
