import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle2, Undo2, AlertTriangle, Printer, History,
    Plus, Shield, XCircle, RotateCcw, Eye
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import { REDAP_REPORT_STATUS, formatBRL } from '../../utils/redapModelsConfig';
import { useToast } from '../../components/ToastNotification';

const RedapReviewPanel = () => {
    const { relatorioId } = useParams();
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const { toast } = useToast();
    const isDC = redapV3.isDefesaCivilRole(user?.role);

    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [bundle, setBundle] = useState(null);
    const [pendSecao, setPendSecao] = useState('Danos');
    const [pendDesc, setPendDesc] = useState('');
    const [actionObs, setActionObs] = useState('');
    const [processing, setProcessing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await redapV3.getRelatorioCompleto(relatorioId);
            if (!data || !data.report) {
                toast.error('Não encontrado', 'Relatório não localizado.');
                navigate('/redap');
                return;
            }
            const events = await redapService.getActiveEvents();
            setEvent((events || []).find(e => e.id === data.report.evento_id) || null);
            setBundle(data);
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Falha ao carregar relatório para análise.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isDC) {
            toast.error('Acesso Negado', 'Somente a Defesa Civil pode acessar a tela de análise.');
            navigate('/redap');
            return;
        }
        loadData();
    }, [relatorioId]);

    const handleAddPendencia = async (e) => {
        e.preventDefault();
        if (!pendDesc.trim()) return;
        try {
            await redapV3.addPendencia({
                relatorioId,
                secao: pendSecao,
                descricao: pendDesc.trim(),
                user,
            });
            setPendDesc('');
            toast.success('Pendência registrada!');
            await loadData();
        } catch {
            toast.error('Erro', 'Não foi possível registrar a pendência.');
        }
    };

    const handleTransition = async (statusNovo, acao, defaultObs) => {
        if (statusNovo === 'DEVOLVIDO' && !actionObs.trim() && (bundle?.pendencias || []).filter(p => p.situacao === 'ABERTA').length === 0) {
            toast.warning('Justificativa obrigatória', 'Registre uma pendência ou informe a justificativa antes de devolver.');
            return;
        }
        if (statusNovo === 'CANCELADO' && !actionObs.trim()) {
            toast.warning('Justificativa obrigatória', 'Informe o motivo do cancelamento no campo de observação.');
            return;
        }
        setProcessing(true);
        try {
            await redapV3.transitionRelatorioStatus({
                relatorioId,
                eventoId: bundle.report.evento_id,
                statusAnterior: bundle.report.status,
                statusNovo,
                acao,
                observacao: actionObs.trim() || defaultObs,
                user,
                extraFields: statusNovo === 'CANCELADO' ? { motivo_cancelamento: actionObs.trim() } : {},
            });
            setActionObs('');
            toast.success('Status atualizado!', `Relatório alterado para ${REDAP_REPORT_STATUS[statusNovo]?.label || statusNovo}.`);
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error('Erro', 'Falha ao atualizar status do relatório.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !bundle) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { report, danos, prejuizos, equipes, recursos, despesas, anexos, pendencias, historico } = bundle;
    const st = REDAP_REPORT_STATUS[report.status] || REDAP_REPORT_STATUS.NAO_INICIADO;

    const totalDanos = danos.reduce((a, d) => a + (Number(d.valor_estimado) || 0), 0);
    const totalPrejuizos = prejuizos.reduce((a, p) => a + (Number(p.valor_estimado) || 0), 0);
    const totalDespesas = despesas.reduce((a, d) => a + (Number(d.valor) || 0), 0);

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => navigate(`/redap/eventos/${report.evento_id}`)}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${st.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Completude: {report.progresso || 0}%</span>
                        </div>
                        <h1 className="text-xl font-black mt-1">Análise Técnica — {report.secretaria_nome}</h1>
                        <p className="text-xs text-slate-500 font-semibold">
                            Evento: {event?.nome_evento || 'Desastre'} • Responsável: {report.responsavel_nome || 'Não informado'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => window.open(`/redap/relatorios/${relatorioId}/imprimir`, '_blank')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-black uppercase"
                    >
                        <Printer size={14} /> PDF Setorial
                    </button>
                    {report.status === 'ENVIADO' && (
                        <button
                            disabled={processing}
                            onClick={() => handleTransition('EM_ANALISE', 'INICIO_ANALISE', 'Defesa Civil iniciou análise técnica.')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black uppercase"
                        >
                            <Eye size={14} /> Iniciar Análise
                        </button>
                    )}
                    {['ENVIADO', 'EM_ANALISE'].includes(report.status) && (
                        <>
                            <button
                                disabled={processing}
                                onClick={() => handleTransition('DEVOLVIDO', 'DEVOLUCAO', 'Devolvido para correção das pendências apontadas.')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase"
                            >
                                <Undo2 size={14} /> Devolver
                            </button>
                            <button
                                disabled={processing}
                                onClick={() => handleTransition('APROVADO', 'APROVACAO', 'Relatório validado pela Defesa Civil para consolidação municipal.')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase shadow"
                            >
                                <CheckCircle2 size={14} /> Aprovar Relatório
                            </button>
                        </>
                    )}
                    {report.status === 'APROVADO' && (
                        <button
                            disabled={processing}
                            onClick={() => handleTransition('DEVOLVIDO', 'REABERTURA_AUDITADA', 'Reabertura formal auditada pela Defesa Civil.')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-black uppercase"
                        >
                            <RotateCcw size={14} /> Reabrir (Auditado)
                        </button>
                    )}
                    {report.status !== 'CANCELADO' && (
                        <button
                            disabled={processing}
                            onClick={() => handleTransition('CANCELADO', 'CANCELAMENTO', 'Relatório cancelado.')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-black uppercase"
                        >
                            <XCircle size={14} /> Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Campo de justificativa/parecer de transição */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                    Observação / Justificativa para Aprovação, Devolução ou Cancelamento
                </label>
                <input
                    type="text"
                    value={actionObs}
                    onChange={(e) => setActionObs(e.target.value)}
                    placeholder="Ex: Valores conferidos com evidências fotográficas / Favor detalhar endereço do dano em Infraestrutura..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                />
            </div>

            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Danos ({danos.length})</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(totalDanos)}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400">Total Prejuízos ({prejuizos.length})</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatBRL(totalPrejuizos)}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400">Despesas de Atuação ({despesas.length})</span>
                    <div className="text-xl font-black text-emerald-600 mt-1">{formatBRL(totalDespesas)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda (2/3): Conteúdo Estruturado */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Textos */}
                    {(report.introducao_texto || report.consideracoes_texto) && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Introdução e Considerações</h3>
                            {report.introducao_texto && (
                                <div>
                                    <div className="text-xs font-black mb-1">Introdução</div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{report.introducao_texto}</p>
                                </div>
                            )}
                            {report.consideracoes_texto && (
                                <div>
                                    <div className="text-xs font-black mb-1">Considerações Finais</div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{report.consideracoes_texto}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Danos */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Danos Registrados ({danos.length})</h3>
                        {danos.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Sem registros de danos.</p>
                        ) : (
                            <div className="space-y-2">
                                {danos.map((d, i) => (
                                    <div key={d.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex justify-between gap-3">
                                        <div>
                                            <div className="font-black text-slate-800 dark:text-slate-100">{d.item}</div>
                                            <div className="text-slate-500">
                                                {d.categoria || d.secao} {d.localidade ? `• ${d.localidade}` : ''}
                                                {d.quantidade !== null && d.quantidade !== undefined ? ` • Qtd: ${d.quantidade}` : ''}
                                                {d.quantidade_danificada !== null && d.quantidade_danificada !== undefined ? ` • Danif.: ${d.quantidade_danificada}` : ''}
                                                {d.quantidade_destruida !== null && d.quantidade_destruida !== undefined ? ` • Destr.: ${d.quantidade_destruida}` : ''}
                                            </div>
                                            {d.descricao && <div className="text-slate-500 italic mt-0.5">{d.descricao}</div>}
                                        </div>
                                        <div className="font-black text-right shrink-0">{formatBRL(d.valor_estimado)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prejuízos */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Prejuízos Econômicos Públicos ({prejuizos.length})</h3>
                        {prejuizos.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Sem registros de prejuízos.</p>
                        ) : (
                            <div className="space-y-2">
                                {prejuizos.map((p, i) => (
                                    <div key={p.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex justify-between gap-3">
                                        <div>
                                            <div className="font-black text-slate-800 dark:text-slate-100">{p.servico}</div>
                                            {p.descricao && <div className="text-slate-500 italic mt-0.5">{p.descricao}</div>}
                                        </div>
                                        <div className="font-black shrink-0">{formatBRL(p.valor_estimado)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Atuação do Órgão */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                            Atuação do Órgão ({equipes.length} equipes • {recursos.length} equipamentos • {despesas.length} despesas)
                        </h3>
                        {equipes.map((e, i) => (
                            <div key={e.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                                <strong>{e.tipo_acao}</strong> — {e.quantidade_servidores} servidor(es) ({e.status_acao === 'EM_ANDAMENTO' ? 'Em andamento' : 'Realizada'}) {e.local ? `• ${e.local}` : ''}
                            </div>
                        ))}
                        {recursos.map((r, i) => (
                            <div key={r.id || i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                                <strong>{r.nome}</strong> ({r.tipo}) — {r.quantidade} {r.unidade} {r.local ? `• ${r.local}` : ''}
                            </div>
                        ))}
                    </div>

                    {/* Fotos */}
                    {anexos.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Relatório Fotográfico ({anexos.length})</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {anexos.map(a => (
                                    <div key={a.id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {a.url_preview && <img src={a.url_preview} alt={a.descricao || 'Evidência'} className="w-full h-32 object-cover" />}
                                        <div className="p-2 text-[10px] text-slate-600 dark:text-slate-300">{a.descricao || a.nome_arquivo}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna Direita (1/3): Pendências & Histórico Imutável */}
                <div className="space-y-5">
                    {/* Abrir Pendência */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-wider">
                            <AlertTriangle size={16} /> Pendências por Seção ({pendencias.length})
                        </div>
                        <form onSubmit={handleAddPendencia} className="space-y-2.5">
                            <select
                                value={pendSecao}
                                onChange={(e) => setPendSecao(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                            >
                                <option value="Identificação">Identificação</option>
                                <option value="Danos">Danos</option>
                                <option value="Prejuízos">Prejuízos Econômicos</option>
                                <option value="Atuação">Atuação do Órgão</option>
                                <option value="Fotos">Relatório Fotográfico</option>
                                <option value="Textos">Introdução / Considerações</option>
                            </select>
                            <textarea
                                rows={2}
                                value={pendDesc}
                                onChange={(e) => setPendDesc(e.target.value)}
                                placeholder="Descreva a pendência objetiva..."
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                            />
                            <button
                                type="submit"
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase"
                            >
                                <Plus size={14} /> Registrar Pendência
                            </button>
                        </form>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {pendencias.map(p => (
                                <div key={p.id} className={`p-3 rounded-xl border text-xs ${p.situacao === 'ABERTA' ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/50 border-emerald-200 opacity-75'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-black uppercase text-[10px]">{p.secao}</span>
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${p.situacao === 'ABERTA' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}`}>
                                            {p.situacao}
                                        </span>
                                    </div>
                                    <p className="text-slate-700">{p.descricao}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Histórico de Auditoria */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-wider">
                            <History size={16} /> Histórico de Auditoria
                        </div>
                        {historico.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nenhum evento registrado.</p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {historico.map(h => (
                                    <div key={h.id} className="border-l-2 border-blue-500 pl-3 py-0.5 text-xs">
                                        <div className="font-black text-slate-800 dark:text-slate-100">{h.acao}</div>
                                        <div className="text-[10px] text-slate-400 font-semibold">
                                            {h.usuario_nome} • {h.criado_em ? new Date(h.criado_em).toLocaleString('pt-BR') : ''}
                                        </div>
                                        {h.observacao && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{h.observacao}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RedapReviewPanel;
