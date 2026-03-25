import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Shield, ArrowLeft, RefreshCw, 
    CheckCircle, XCircle, Clock, 
    FileText, Download, TrendingUp,
    MapPin, Plus, DollarSign,
    MoreHorizontal, ChevronRight,
    Map as MapIcon, ClipboardList
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { generateRedapReport } from '../../utils/redapReportGenerator';
import SectorProgressModal from './components/SectorProgressModal';
import RedapMapModal from './components/RedapMapModal';

const RedapEventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [stats, setStats] = useState({ total: 0, count: 0, approved: 0 });
    const [showMapModal, setShowMapModal] = useState(false);
    const [showSectorModal, setShowSectorModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const events = await redapService.getActiveEvents();
            const currentEvent = events.find(e => e.id === id);
            setEvent(currentEvent);

            const regs = await redapService.getRegistrationsByEvent(id);
            setRegistrations(regs || []);
            
            // Calc stats
            const total = regs.reduce((acc, r) => acc + (Number(r.valor_estimado) || 0), 0);
            const approvedCount = regs.filter(r => r.status_validacao === 'Aprovado').length;
            setStats({ total, count: regs.length, approved: approvedCount });
            
        } catch (error) {
            toast.error('Erro ao carregar evento.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (regId, newStatus) => {
        try {
            await redapService.updateRegistrationStatus(regId, newStatus);
            toast.success(`Registro ${newStatus.toLowerCase()}!`);
            loadData();
        } catch (error) {
            toast.error('Erro ao atualizar status.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const columns = [
        { id: 'Enviado', title: 'Aguardando', icon: <Clock size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
        { id: 'Aprovado', title: 'Compõe FIDE', icon: <CheckCircle size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
        { id: 'Rejeitado', title: 'Descartados', icon: <XCircle size={16} className="text-rose-500" />, bg: 'bg-rose-50' }
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/redap')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Painel do Desastre</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-tight flex items-center gap-1">
                            <Shield size={10} className="text-blue-500 dark:text-blue-400" /> {event?.cobrade}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/redap/registro/novo/${id}`)}
                    className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> Lançar Dano
                </button>
            </header>

            <main className="p-4 space-y-6 max-w-[1600px] mx-auto">
                {/* Event Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-6 transition-all">
                        <div className="bg-blue-600 dark:bg-blue-500 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100 dark:shadow-blue-900/30">
                            <TrendingUp size={32} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Impacto Financeiro Estimado</p>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase">
                                    {stats.approved} Aprovados
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">/ {stats.count} Total</span>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all active:scale-[0.98]"
                        onClick={() => setShowSectorModal(true)}
                    >
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-50 dark:bg-blue-900/40 p-5 rounded-[2rem] text-blue-600 dark:text-blue-400">
                                <ClipboardList size={32} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Status de Preenchimento</p>
                                <h3 className="text-sm font-black uppercase leading-tight text-slate-800 dark:text-white">Histórico dos<br/>Setores</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 dark:bg-blue-600 rounded-[2.5rem] p-7 text-white shadow-xl flex items-center justify-between transition-all">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 dark:text-white/60 uppercase tracking-widest mb-1">Ações do Gestor</p>
                            <h3 className="text-lg font-black uppercase leading-tight">Fechar Pasta<br/>Gerar FIDE</h3>
                        </div>
                        <button 
                            className="bg-blue-600 dark:bg-white/20 p-4 rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-blue-500 dark:hover:bg-white/30"
                            onClick={() => toast.info('Funcionalidade de encerramento em triagem final.')}
                        >
                            <Download size={24} />
                        </button>
                    </div>

                    <div className="bg-emerald-600 dark:bg-emerald-500 rounded-[2.5rem] p-7 text-white shadow-xl flex items-center justify-between transition-all">
                        <div>
                            <p className="text-[10px] font-black text-emerald-200 dark:text-white/60 uppercase tracking-widest mb-1">Visualização Geográfica</p>
                            <h3 className="text-lg font-black uppercase leading-tight">Mapa de<br/>Danos</h3>
                        </div>
                        <button 
                            className="bg-emerald-700 dark:bg-white/20 p-4 rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-emerald-800 dark:hover:bg-white/30"
                            onClick={() => setShowMapModal(true)}
                        >
                            <MapIcon size={24} />
                        </button>
                    </div>
                </div>

                <RedapMapModal 
                    isOpen={showMapModal}
                    onClose={() => setShowMapModal(false)}
                    registrations={registrations}
                    eventName={event?.nome_evento}
                />

                <SectorProgressModal 
                    isOpen={showSectorModal}
                    onClose={() => setShowSectorModal(false)}
                    registrations={registrations}
                />

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {columns.map(col => (
                        <div key={col.id} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-xl ${col.bg} dark:bg-slate-800/50`}>
                                        {col.icon}
                                    </div>
                                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{col.title}</h3>
                                </div>
                                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-lg">
                                    {registrations.filter(r => r.status_validacao === col.id).length}
                                </span>
                            </div>

                            <div className="space-y-4 min-h-[500px]">
                                {registrations.filter(r => r.status_validacao === col.id).map(reg => (
                                    <div 
                                        key={reg.id} 
                                        className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                                    {reg.secretaria_responsavel?.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {col.id === 'Enviado' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(reg.id, 'Aprovado')}
                                                            className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(reg.id, 'Rejeitado')}
                                                            className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            <XCircle size={14} />
                                                        </button>
                                                    </>
                                                )}
                                                {col.id !== 'Enviado' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(reg.id, 'Enviado')}
                                                        className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 hover:text-white transition-all"
                                                    >
                                                        <Clock size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-2">
                                            {reg.instalacao_afetada}
                                        </h4>
                                        
                                        <div className="space-y-2 mb-4">
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {reg.descricao_detalhada}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400">
                                                <DollarSign size={12} />
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reg.valor_estimado)}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {reg.fotos?.slice(0, 3).map((foto, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-sm">
                                                        <img src={foto.url || foto.data || '/placeholder_img.png'} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {reg.fotos?.length > 3 && (
                                                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-800 dark:bg-slate-700 text-[8px] flex items-center justify-center text-white font-bold">
                                                        +{reg.fotos.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/redap/registro/editar/${reg.id}`)}
                                                className="text-[9px] font-black text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest flex items-center gap-1"
                                            >
                                                Detalhes <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {registrations.filter(r => r.status_validacao === col.id).length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                        <ClipboardList size={32} className="text-slate-200 dark:text-slate-800 mb-2" />
                                        <p className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Coluna Vazia</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default RedapEventDetails;
