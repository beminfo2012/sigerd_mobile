import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Plus, CheckCircle2, Clock, Send, AlertTriangle,
    FileText, Printer, Download, Eye, Edit3, X, Shield, Sparkles
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import {
    REDAP_REPORT_STATUS,
    SECRETARIA_CATALOG,
    formatBRL,
} from '../../utils/redapModelsConfig';
import { useToast } from '../../components/ToastNotification';

const RedapEventPanel = () => {
    const { eventoId, id } = useParams();
    const targetEventoId = eventoId || id;
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const { toast } = useToast();
    const isDC = redapV3.isDefesaCivilRole(user?.role);

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [relatorios, setRelatorios] = useState([]);
    const [showDistModal, setShowDistModal] = useState(false);
    const [selectedSecretarias, setSelectedSecretarias] = useState(['Redap_Saude', 'Redap_ServicosUrbanos']);
    const [prazoEnvio, setPrazoEnvio] = useState('');
    const [distributing, setDistributing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [events, reps] = await Promise.all([
                redapService.getActiveEvents(),
                redapV3.getRelatoriosByEvento(targetEventoId),
            ]);
            const found = (events || []).find(e => e.id === targetEventoId);
            setEvent(found || null);
            setRelatorios(reps || []);
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível carregar o painel do evento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [targetEventoId]);

    const activeReports = relatorios.filter(r => r.status !== 'CANCELADO');
    const visibleReports = isDC
        ? activeReports
        : activeReports.filter(r => r.secretaria_key === user?.role);

    // Indicadores da Seção 10.1 do Manual
    const kpis = {
        convocadas: activeReports.length,
        naoIniciados: activeReports.filter(r => r.status === 'NAO_INICIADO').length,
        emPreenchimento: activeReports.filter(r => r.status === 'EM_PREENCHIMENTO').length,
        enviadosAnalise: activeReports.filter(r => ['ENVIADO', 'EM_ANALISE'].includes(r.status)).length,
        devolvidos: activeReports.filter(r => r.status === 'DEVOLVIDO').length,
        aprovados: activeReports.filter(r => r.status === 'APROVADO').length,
        recebidos: activeReports.filter(r => ['ENVIADO', 'EM_ANALISE', 'APROVADO'].includes(r.status)).length,
    };

    const existingKeys = new Set(activeReports.map(r => r.secretaria_key));

    const toggleSecretaria = (key) => {
        if (existingKeys.has(key)) return;
        setSelectedSecretarias(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleDistribute = async () => {
        const toAdd = selectedSecretarias.filter(k => !existingKeys.has(k));
        if (toAdd.length === 0) {
            toast.warning('Seleção vazia', 'Selecione ao menos uma secretaria que ainda não foi convocada.');
            return;
        }
        setDistributing(true);
        try {
            const created = await redapV3.distributeEventToSecretarias(
                targetEventoId,
                toAdd,
                prazoEnvio ? new Date(`${prazoEnvio}T23:59:00`).toISOString() : null,
                user
            );
            toast.success('Distribuído!', `${created.length} relatório(s) setorial(is) disponibilizado(s).`);
            setShowDistModal(false);
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Falha ao distribuir formulários às secretarias.');
        } finally {
            setDistributing(false);
        }
    };

    const handleExportCSV = async (includePreview = false) => {
        setExporting(true);
        try {
            const cons = await redapV3.getEventoConsolidado(targetEventoId, includePreview);
            const rows = [
                ['Tipo', 'Secretaria Origem', 'Status Relatorio', 'Categoria / Servico', 'Item / Acao', 'Qtd', 'Danificada', 'Destruida', 'Valor (R$)', 'Localidade', 'Descricao'],
                ...cons.danos.map(d => [
                    'Dano', d._origem.secretaria_nome, d._origem.status, d.categoria || d.secao, d.item,
                    d.quantidade ?? '', d.quantidade_danificada ?? '', d.quantidade_destruida ?? '',
                    d.valor_estimado ?? '', d.localidade || '', (d.descricao || '').replace(/[\r\n;]+/g, ' '),
                ]),
                ...cons.prejuizos.map(p => [
                    'Prejuizo Economico', p._origem.secretaria_nome, p._origem.status, 'Prejuizo Publico', p.servico,
                    '', '', '', p.valor_estimado ?? '', p.localidade || '', (p.descricao || '').replace(/[\r\n;]+/g, ' '),
                ]),
                ...cons.despesas.map(d => [
                    'Despesa Atuacao', d._origem.secretaria_nome, d._origem.status, d.fonte, d.tipo_despesa,
                    '', '', '', d.valor ?? 0, '', (d.descricao || '').replace(/[\r\n;]+/g, ' '),
                ]),
            ];
            const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `REDAP_Consolidado_${(event?.id_sigerd || targetEventoId).replace(/[^\w-]/g, '_')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exportado!', 'Planilha CSV gerada com sucesso.');
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Não foi possível exportar a planilha.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-500 mb-4">Evento não encontrado.</p>
                <button onClick={() => navigate('/redap')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
                    Voltar aos Eventos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => navigate('/redap')}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 mt-0.5"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            {event.id_sigerd && (
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {event.id_sigerd}
                                </span>
                            )}
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {event.cobrade}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {event.nome_evento}
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Início: {event.data_inicio ? new Date(event.data_inicio).toLocaleDateString('pt-BR') : '—'} • {event.municipio_uf || 'Santa Maria de Jetibá / ES'}
                        </p>
                    </div>
                </div>

                {isDC && (
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowDistModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md"
                        >
                            <Plus size={15} /> Convocar Secretarias
                        </button>
                        <button
                            onClick={() => window.open(`/redap/eventos/${targetEventoId}/consolidado`, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider"
                        >
                            <Printer size={15} /> Consolidado PDF
                        </button>
                        <button
                            onClick={() => handleExportCSV(false)}
                            disabled={exporting}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold"
                        >
                            <Download size={15} /> CSV (Aprovados)
                        </button>
                        <button
                            onClick={() => navigate(`/redap/evento-legado/${targetEventoId}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold"
                            title="Abrir visão clássica (Documentos Oficiais / S2ID / Parecer)"
                        >
                            <Shield size={14} /> Docs & Parecer
                        </button>
                    </div>
                )}
            </div>

            {/* PAINEL DE ACOMPANHAMENTO (SEÇÃO 10.1 DO MANUAL) */}
            {isDC && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-slate-400">Convocadas</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{kpis.convocadas}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-slate-400">Não iniciados</span>
                            <div className="text-2xl font-black text-slate-500 mt-1">{kpis.naoIniciados}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-sky-600">Em preenchimento</span>
                            <div className="text-2xl font-black text-sky-600 mt-1">{kpis.emPreenchimento}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-indigo-600">Enviados / Análise</span>
                            <div className="text-2xl font-black text-indigo-600 mt-1">{kpis.enviadosAnalise}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-black uppercase text-amber-600">Devolvidos</span>
                            <div className="text-2xl font-black text-amber-600 mt-1">{kpis.devolvidos}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-900/10">
                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Aprovados</span>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{kpis.aprovados}</div>
                        </div>
                    </div>

                    {kpis.convocadas > 0 && (
                        <div className="bg-white dark:bg-slate-900 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                Progresso de recebimento: <strong className="text-blue-600">{kpis.recebidos} de {kpis.convocadas}</strong> relatórios enviados
                            </div>
                            <div className="w-full sm:w-64 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all"
                                    style={{ width: `${Math.round((kpis.recebidos / kpis.convocadas) * 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* LISTA DE RELATÓRIOS SETORIAIS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        <h2 className="text-sm font-black uppercase tracking-wider">Relatórios Setoriais do Evento</h2>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{visibleReports.length} relatório(s)</span>
                </div>

                {visibleReports.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <FileText size={36} className="mx-auto text-slate-300" />
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
                            {isDC ? 'Nenhuma secretaria convocada ainda' : 'Sua secretaria ainda não foi convocada para este evento'}
                        </h3>
                        {isDC && (
                            <button
                                onClick={() => setShowDistModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider"
                            >
                                <Plus size={15} /> Convocar Secretarias (Saúde, Serviços Urbanos, etc.)
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleReports.map(rep => {
                            const st = REDAP_REPORT_STATUS[rep.status] || REDAP_REPORT_STATUS.NAO_INICIADO;
                            return (
                                <div key={rep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                {rep.secretaria_nome}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${st.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                {st.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Modelo v{rep.modelo_versao || 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                                            <span>Responsável: <strong>{rep.responsavel_nome || 'A definir'}</strong></span>
                                            {rep.prazo_envio && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={12} /> Prazo: {new Date(rep.prazo_envio).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                            {rep.enviado_em && (
                                                <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                                                    <Send size={12} /> Enviado em {new Date(rep.enviado_em).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="w-28">
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                                <span>Completude</span>
                                                <span className="text-slate-700 dark:text-slate-200">{rep.progresso || 0}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${rep.progresso || 0}%` }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isDC && (
                                                <button
                                                    onClick={() => navigate(`/redap/relatorios/${rep.id}/analise`)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider"
                                                >
                                                    <Eye size={14} /> Analisar
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/redap/relatorios/${rep.id}/preencher`)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-black uppercase tracking-wider"
                                            >
                                                <Edit3 size={14} /> {st.editableBySector ? 'Preencher' : 'Abrir'}
                                            </button>
                                            <button
                                                onClick={() => window.open(`/redap/relatorios/${rep.id}/imprimir`, '_blank')}
                                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                title="Imprimir PDF Setorial"
                                            >
                                                <Printer size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL: CONVOCAR / DISTRIBUIR SECRETARIAS */}
            {showDistModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black uppercase">Convocar Secretarias para o Evento</h3>
                                <p className="text-xs text-slate-500">Selecione os órgãos que deverão preencher relatório setorial REDAP</p>
                            </div>
                            <button onClick={() => setShowDistModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                    Prazo sugerido para envio (opcional)
                                </label>
                                <input
                                    type="date"
                                    value={prazoEnvio}
                                    onChange={(e) => setPrazoEnvio(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {SECRETARIA_CATALOG.map(sec => {
                                    const already = existingKeys.has(sec.key);
                                    const checked = already || selectedSecretarias.includes(sec.key);
                                    return (
                                        <button
                                            key={sec.key}
                                            type="button"
                                            disabled={already}
                                            onClick={() => toggleSecretaria(sec.key)}
                                            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                                                already
                                                    ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                                                    : checked
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{sec.nome}</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {sec.piloto && (
                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                                            <Sparkles size={9} /> Piloto Manual
                                                        </span>
                                                    )}
                                                    {already && (
                                                        <span className="text-[9px] font-black uppercase text-emerald-600">Já convocada</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                {checked && <CheckCircle2 size={13} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowDistModal(false)}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDistribute}
                                disabled={distributing}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                            >
                                {distributing ? 'Distribuindo...' : 'Disponibilizar Formulários'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RedapEventPanel;
