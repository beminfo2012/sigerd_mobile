import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Calendar, Clock, ChevronRight, Trash2,
    Shield, FileText, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import { REDAP_REPORT_STATUS } from '../../utils/redapModelsConfig';
import EventModal from './components/EventModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastNotification';

const RedapPortalDashboard = () => {
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const { toast } = useToast();
    const isDC = redapV3.isDefesaCivilRole(user?.role);

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [eventToDelete, setEventToDelete] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [evList, repList] = await Promise.all([
                redapService.getActiveEvents(),
                redapV3.getAllRelatorios(),
            ]);
            setEvents(evList || []);
            setAllReports(repList || []);
        } catch (err) {
            console.error('[RedapPortalDashboard] load error:', err);
            toast.error('Erro', 'Não foi possível carregar os eventos REDAP.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleCreateEvent = async (eventData) => {
        try {
            const created = await redapService.createEvent(eventData);
            setShowEventModal(false);
            toast.success('Evento criado!', 'Agora você pode distribuir os relatórios para as secretarias.');
            if (created?.id) {
                navigate(`/redap/eventos/${created.id}`);
            } else {
                loadAll();
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível criar o evento.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        try {
            await redapService.deleteEvent(eventToDelete.id);
            setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
            setEventToDelete(null);
            toast.success('Excluído', 'Evento removido com sucesso.');
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível excluir o evento.');
        }
    };

    // Para Secretarias: exibe somente relatórios atribuídos à sua secretaria
    const myReports = !isDC
        ? allReports
            .filter(r => r.secretaria_key === user?.role && r.status !== 'CANCELADO')
            .map(r => ({
                ...r,
                evento: events.find(e => e.id === r.evento_id),
            }))
            .filter(r => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                    r.evento?.nome_evento?.toLowerCase().includes(q) ||
                    r.evento?.cobrade?.toLowerCase().includes(q) ||
                    r.secretaria_nome?.toLowerCase().includes(q)
                );
            })
        : [];

    const filteredEvents = events.filter(e => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            e.nome_evento?.toLowerCase().includes(q) ||
            e.cobrade?.toLowerCase().includes(q) ||
            e.id_sigerd?.toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando Portal REDAP...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isDC ? 'Eventos de Desastre (REDAP)' : 'Meus Relatórios Setoriais'}
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {isDC
                            ? 'Cadastre eventos, convoque secretarias, acompanhe envios e consolide os relatórios municipais.'
                            : 'Acesse os relatórios atribuídos à sua secretaria, preencha por etapas e envie para análise da Defesa Civil.'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAll}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        title="Atualizar"
                    >
                        <RefreshCw size={18} />
                    </button>
                    {isDC && (
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20"
                        >
                            <Plus size={16} /> Novo Evento REDAP
                        </button>
                    )}
                </div>
            </div>

            {/* Busca */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isDC ? 'Buscar por nome do desastre, COBRADE ou código REDAP...' : 'Buscar relatório ou evento...'}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            {/* VISÃO SECRETARIA */}
            {!isDC ? (
                myReports.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-14 text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-200">
                            Nenhum relatório atribuído à sua secretaria
                        </h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Quando a Defesa Civil cadastrar um desastre e convocar sua secretaria, o formulário aparecerá automaticamente aqui.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myReports.map(rep => {
                            const st = REDAP_REPORT_STATUS[rep.status] || REDAP_REPORT_STATUS.NAO_INICIADO;
                            return (
                                <div
                                    key={rep.id}
                                    onClick={() => navigate(`/redap/relatorios/${rep.id}/preencher`)}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between gap-4"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${st.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                            {rep.prazo_envio && (
                                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} /> Prazo: {new Date(rep.prazo_envio).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                            {rep.evento?.nome_evento || 'Evento de Desastre'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-semibold">
                                            {rep.evento?.cobrade || 'COBRADE não informado'} • Modelo v{rep.modelo_versao || 1}
                                        </p>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="text-slate-500">Completude do preenchimento</span>
                                            <span className="text-blue-600">{rep.progresso || 0}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${rep.progresso || 0}%` }} />
                                        </div>
                                        <div className="flex justify-end pt-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-black text-blue-600">
                                                {st.editableBySector ? 'Abrir Formulário' : 'Visualizar Relatório'} <ChevronRight size={15} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* VISÃO DEFESA CIVIL */
                filteredEvents.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-14 text-center space-y-3">
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto text-blue-500">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-base font-black text-slate-700 dark:text-slate-200">Nenhum evento REDAP cadastrado</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Clique em “Novo Evento REDAP” para registrar o desastre e distribuir os formulários às secretarias municipais.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredEvents.map(ev => {
                            const evReports = allReports.filter(r => r.evento_id === ev.id && r.status !== 'CANCELADO');
                            const sentCount = evReports.filter(r => ['ENVIADO', 'EM_ANALISE', 'APROVADO'].includes(r.status)).length;
                            const approvedCount = evReports.filter(r => r.status === 'APROVADO').length;
                            const returnedCount = evReports.filter(r => r.status === 'DEVOLVIDO').length;
                            const pct = evReports.length > 0 ? Math.round((sentCount / evReports.length) * 100) : 0;

                            return (
                                <div
                                    key={ev.id}
                                    onClick={() => navigate(`/redap/eventos/${ev.id}`)}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ev.id_sigerd && (
                                                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {ev.id_sigerd}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                    {ev.cobrade || 'COBRADE pendente'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                    {ev.status_evento || ev.status_geral || 'ABERTO'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                                                {ev.nome_evento || 'Desastre sem nome'}
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold flex-wrap">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar size={13} /> {ev.data_inicio ? new Date(ev.data_inicio).toLocaleDateString('pt-BR') : '—'}
                                                </span>
                                                <span>
                                                    {evReports.length === 0
                                                        ? 'Nenhuma secretaria convocada ainda'
                                                        : `${sentCount} de ${evReports.length} relatórios enviados`}
                                                </span>
                                                {approvedCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                                        <CheckCircle2 size={13} /> {approvedCount} aprovado(s)
                                                    </span>
                                                )}
                                                {returnedCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                                                        <AlertTriangle size={13} /> {returnedCount} devolvido(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {evReports.length > 0 && (
                                                <div className="w-32 hidden sm:block">
                                                    <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1">
                                                        <span>RECEBIMENTO</span>
                                                        <span className="text-blue-600">{pct}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEventToDelete(ev);
                                                }}
                                                className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-colors"
                                                title="Excluir evento"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            <EventModal
                isOpen={showEventModal}
                onClose={() => setShowEventModal(false)}
                onSave={handleCreateEvent}
            />

            <ConfirmModal
                isOpen={!!eventToDelete}
                title="Excluir Evento REDAP"
                message={`Deseja excluir o evento "${eventToDelete?.nome_evento}" e todos os relatórios vinculados?`}
                onConfirm={handleDeleteEvent}
                onClose={() => setEventToDelete(null)}
            />
        </div>
    );
};

export default RedapPortalDashboard;
