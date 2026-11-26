import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, Send, ChevronRight, ChevronLeft, Plus, Trash2,
    Camera, MapPin, Sparkles, CheckCircle2, AlertTriangle, Lock, Info, Printer
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import {
    REDAP_REPORT_STATUS,
    SITUACAO_INFORMACAO,
    getModelForSecretaria,
    calculateReportProgress,
    validateReportForSubmission,
    formatBRL,
} from '../../utils/redapModelsConfig';
import AtuacaoOrgaoSection from './components/AtuacaoOrgaoSection';
import { compressImage } from '../../utils/imageOptimizer';
import { useToast } from '../../components/ToastNotification';
import bairrosData from '../../data/Bairros.json';

const STEPS = [
    { id: 'identificacao', label: '1. Identificação' },
    { id: 'danos', label: '2. Danos' },
    { id: 'prejuizos', label: '3. Prejuízos' },
    { id: 'atuacao', label: '4. Atuação' },
    { id: 'fotos', label: '5. Fotos' },
    { id: 'textos', label: '6. Textos (IA)' },
    { id: 'revisao', label: '7. Prévia e Envio' },
];

const RedapReportWizard = () => {
    const { relatorioId } = useParams();
    const navigate = useNavigate();
    const user = useContext(UserContext);
    const { toast } = useToast();
    const isDC = redapV3.isDefesaCivilRole(user?.role);

    const [loading, setLoading] = useState(true);
    const [stepIdx, setStepIdx] = useState(0);
    const [savingState, setSavingState] = useState('idle'); // idle | saving | saved | error
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [aiLoading, setAiLoading] = useState(null); // 'introducao' | 'consideracoes' | null

    const [event, setEvent] = useState(null);
    const [model, setModel] = useState(null);
    const [report, setReport] = useState(null);
    const [danos, setDanos] = useState([]);
    const [prejuizos, setPrejuizos] = useState([]);
    const [equipes, setEquipes] = useState([]);
    const [recursos, setRecursos] = useState([]);
    const [despesas, setDespesas] = useState([]);
    const [anexos, setAnexos] = useState([]);
    const [pendencias, setPendencias] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);

    const fileInputRef = useRef(null);
    const dirtyRef = useRef(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const bundle = await redapV3.getRelatorioCompleto(relatorioId);
                if (!bundle || !bundle.report) {
                    toast.error('Não encontrado', 'Relatório setorial não encontrado.');
                    navigate('/redap');
                    return;
                }

                // Controle de acesso (Seção 3.2): secretaria só acessa seus próprios relatórios
                if (!isDC && bundle.report.secretaria_key !== user?.role) {
                    toast.error('Acesso Negado', 'Você não tem permissão para acessar o relatório de outra secretaria.');
                    navigate('/redap');
                    return;
                }

                const [events, models] = await Promise.all([
                    redapService.getActiveEvents(),
                    redapV3.listRedapModels(),
                ]);
                const ev = (events || []).find(e => e.id === bundle.report.evento_id) || null;
                const mod = getModelForSecretaria(bundle.report.secretaria_key, models);

                setEvent(ev);
                setModel(mod);
                setReport({
                    ...bundle.report,
                    responsavel_nome: bundle.report.responsavel_nome || user?.full_name || '',
                    responsavel_cargo: bundle.report.responsavel_cargo || user?.cargo || '',
                    responsavel_email: bundle.report.responsavel_email || user?.email || '',
                    dados_complementares: bundle.report.dados_complementares || {},
                });
                setDanos(bundle.danos || []);
                setPrejuizos(bundle.prejuizos || []);
                setEquipes(bundle.equipes || []);
                setRecursos(bundle.recursos || []);
                setDespesas(bundle.despesas || []);
                setAnexos(bundle.anexos || []);
                setPendencias(bundle.pendencias || []);
            } catch (err) {
                console.error(err);
                toast.error('Erro', 'Falha ao carregar o relatório.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [relatorioId]);

    const statusInfo = REDAP_REPORT_STATUS[report?.status] || REDAP_REPORT_STATUS.NAO_INICIADO;
    const isReadOnly = !statusInfo.editableBySector;
    const modelCfg = model?.configuracao_json || {};

    const currentProgress = report
        ? calculateReportProgress({ report, danos, prejuizos, equipes, recursos, despesas, anexos, modelConfig: modelCfg })
        : 0;

    const markDirty = () => { dirtyRef.current = true; };

    const performSave = async (silent = false) => {
        if (!report || isReadOnly) return;
        setSavingState('saving');
        try {
            const updated = await redapV3.saveRelatorioDraft(
                relatorioId,
                { report, danos, prejuizos, equipes, recursos, despesas, anexos },
                modelCfg
            );
            if (updated) {
                setReport(prev => ({ ...prev, status: updated.status, progresso: updated.progresso }));
            }
            dirtyRef.current = false;
            setSavingState('saved');
            setLastSavedAt(new Date());
            if (!silent) toast.success('Rascunho salvo!', 'Alterações salvas com segurança.');
        } catch (err) {
            console.error(err);
            setSavingState('error');
            if (!silent) toast.error('Erro ao salvar', 'Verifique sua conexão e tente novamente.');
        }
    };

    // Salvamento automático (a cada 8 segundos quando houver alterações)
    useEffect(() => {
        if (isReadOnly || !report) return;
        const timer = setInterval(() => {
            if (dirtyRef.current) {
                performSave(true);
            }
        }, 8000);
        return () => clearInterval(timer);
    }, [report, danos, prejuizos, equipes, recursos, despesas, anexos, isReadOnly]);

    const updateComp = (key, val) => {
        markDirty();
        setReport(prev => ({
            ...prev,
            dados_complementares: { ...(prev.dados_complementares || {}), [key]: val },
        }));
    };

    // Helpers de Danos Humanos (distingue null/vazio de 0!)
    const getHumanoValue = (itemKey) => {
        const found = danos.find(d => d.secao === 'DANOS_HUMANOS' && d.categoria === itemKey);
        if (!found || found.quantidade === null || found.quantidade === undefined) return '';
        return String(found.quantidade);
    };

    const setHumanoValue = (itemKey, label, rawVal) => {
        markDirty();
        const parsed = rawVal === '' ? null : Math.max(0, parseInt(rawVal, 10) || 0);
        setDanos(prev => {
            const idx = prev.findIndex(d => d.secao === 'DANOS_HUMANOS' && d.categoria === itemKey);
            if (idx >= 0) {
                return prev.map((d, i) => (i === idx ? { ...d, quantidade: parsed } : d));
            }
            return [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    secao: 'DANOS_HUMANOS',
                    categoria: itemKey,
                    item: label,
                    quantidade: parsed,
                    situacao_informacao: SITUACAO_INFORMACAO.INFORMADO,
                },
            ];
        });
    };

    const addDanoInfra = (categoriaDefault = '') => {
        if (isReadOnly) return;
        markDirty();
        updateComp('situacao_danos_infraestrutura', SITUACAO_INFORMACAO.INFORMADO);
        setDanos(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                secao: 'DANOS_INFRAESTRUTURA',
                categoria: categoriaDefault || modelCfg.danos_infraestrutura_categorias?.[0]?.categoria || 'Infraestrutura Pública',
                item: '',
                quantidade_danificada: '',
                quantidade_destruida: '',
                valor_estimado: '',
                localidade: '',
                endereco: '',
                descricao: '',
                situacao_informacao: SITUACAO_INFORMACAO.INFORMADO,
            },
        ]);
    };

    const updateDano = (id, field, value) => {
        markDirty();
        setDanos(prev => prev.map(d => (d.id === id ? { ...d, [field]: value } : d)));
    };

    const removeDano = (id) => {
        markDirty();
        setDanos(prev => prev.filter(d => d.id !== id));
    };

    const addPrejuizo = (servicoDefault = '') => {
        if (isReadOnly) return;
        markDirty();
        updateComp('situacao_prejuizos', SITUACAO_INFORMACAO.INFORMADO);
        setPrejuizos(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                servico: servicoDefault || modelCfg.prejuizos_servicos?.[0] || '',
                valor_estimado: '',
                localidade: '',
                descricao: '',
                situacao_informacao: SITUACAO_INFORMACAO.INFORMADO,
            },
        ]);
    };

    const updatePrejuizo = (id, field, value) => {
        markDirty();
        setPrejuizos(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const removePrejuizo = (id) => {
        markDirty();
        setPrejuizos(prev => prev.filter(p => p.id !== id));
    };

    // Upload de Fotos com compressão + GPS opcional
    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        let coords = { lat: null, lng: null };
        if (navigator.geolocation) {
            try {
                const pos = await new Promise((res, rej) =>
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, enableHighAccuracy: true })
                );
                coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            } catch {
                // Permissão negada ou indisponível: segue sem travar (Seção 6.3)
            }
        }

        for (const file of files) {
            try {
                const reader = new FileReader();
                const dataUrl = await new Promise((res, rej) => {
                    reader.onload = () => res(reader.result);
                    reader.onerror = rej;
                    reader.readAsDataURL(file);
                });
                const compressed = await compressImage(dataUrl, {
                    coordinates: coords.lat ? { lat: String(coords.lat), lng: String(coords.lng) } : null,
                    timestamp: new Date(),
                }).catch(() => dataUrl);

                markDirty();
                setAnexos(prev => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        secao: 'GERAL',
                        nome_arquivo: file.name,
                        tipo_mime: file.type || 'image/jpeg',
                        tamanho_bytes: file.size,
                        url_preview: compressed,
                        data_foto: new Date().toISOString(),
                        latitude: coords.lat,
                        longitude: coords.lng,
                        descricao: '',
                    },
                ]);
            } catch (err) {
                console.error('Erro ao processar imagem:', err);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerateIA = async (sectionType) => {
        setAiLoading(sectionType);
        try {
            const res = await redapV3.generateRedapSectionWithIA(sectionType, {
                event, report, danos, prejuizos, equipes, recursos, despesas,
            });
            if (res.error) {
                toast.warning('Geração Assistida', res.error);
            } else if (res.text) {
                markDirty();
                if (sectionType === 'introducao') {
                    setReport(prev => ({
                        ...prev,
                        introducao_texto: res.text,
                        introducao_ia_gerada: true,
                        introducao_confirmada_em: null,
                        introducao_confirmada_por: null,
                    }));
                } else {
                    setReport(prev => ({
                        ...prev,
                        consideracoes_texto: res.text,
                        consideracoes_ia_gerada: true,
                        consideracoes_confirmada_em: null,
                        consideracoes_confirmada_por: null,
                    }));
                }
                toast.success('Rascunho gerado por IA', 'Revise o texto e clique em Confirmar Revisão.');
            }
        } finally {
            setAiLoading(null);
        }
    };

    const handleConfirmText = (sectionType) => {
        markDirty();
        const nowIso = new Date().toISOString();
        const who = user?.full_name || report?.responsavel_nome || 'Responsável';
        if (sectionType === 'introducao') {
            setReport(prev => ({ ...prev, introducao_confirmada_por: who, introducao_confirmada_em: nowIso }));
        } else {
            setReport(prev => ({ ...prev, consideracoes_confirmada_por: who, consideracoes_confirmada_em: nowIso }));
        }
        toast.success('Confirmado!', 'Revisão humana registrada.');
    };

    const handleResolvePendencia = async (pendId) => {
        try {
            await redapV3.resolvePendencia(pendId, user);
            setPendencias(prev => prev.map(p => (p.id === pendId ? { ...p, situacao: 'RESOLVIDA' } : p)));
            toast.success('Pendência marcada como resolvida.');
        } catch {
            toast.error('Erro', 'Não foi possível atualizar a pendência.');
        }
    };

    const handleSubmitReport = async () => {
        const errs = validateReportForSubmission({
            report, danos, prejuizos, equipes, recursos, despesas, pendencias, modelConfig: modelCfg,
        });
        setValidationErrors(errs);
        if (errs.length > 0) {
            toast.warning('Pendências no preenchimento', 'Verifique os itens destacados antes de enviar.');
            return;
        }
        if (!window.confirm('Confirma o envio oficial deste relatório setorial para análise da Defesa Civil? Após o envio, a edição ficará bloqueada até análise.')) {
            return;
        }
        setSubmitting(true);
        try {
            await performSave(true);
            await redapV3.transitionRelatorioStatus({
                relatorioId,
                eventoId: report.evento_id,
                statusAnterior: report.status,
                statusNovo: 'ENVIADO',
                acao: report.status === 'DEVOLVIDO' ? 'REENVIO_CORRIGIDO' : 'ENVIO',
                observacao: 'Relatório enviado pela secretaria com declaração de responsabilidade.',
                user,
            });
            toast.success('Relatório Enviado!', 'A Defesa Civil foi notificada para análise.');
            navigate(`/redap/eventos/${report.evento_id}`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao enviar', 'Não foi possível enviar o relatório.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !report) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const infraDanos = danos.filter(d => d.secao !== 'DANOS_HUMANOS');
    const openPendencias = pendencias.filter(p => p.situacao === 'ABERTA');
    const comp = report.dados_complementares || {};

    return (
        <div className="space-y-6 pb-16">
            {/* Cabeçalho do Relatório (Seção 6.1) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => navigate(isDC ? `/redap/eventos/${report.evento_id}` : '/redap')}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusInfo.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                    {statusInfo.label}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">Modelo v{report.modelo_versao || 1}</span>
                                <span className="text-[10px] font-bold text-blue-600">Completude: {currentProgress}%</span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                                {report.secretaria_nome}
                            </h1>
                            <p className="text-xs text-slate-500 font-semibold">
                                Evento: {event?.nome_evento || 'Desastre'} ({event?.cobrade || 'COBRADE'})
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {!isReadOnly && (
                            <span className="text-[11px] font-bold text-slate-400 mr-1">
                                {savingState === 'saving'
                                    ? 'Salvando...'
                                    : lastSavedAt
                                        ? `Salvo às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                        : 'Rascunho automático ativo'}
                            </span>
                        )}
                        {!isReadOnly && (
                            <button
                                onClick={() => performSave(false)}
                                disabled={savingState === 'saving'}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase"
                            >
                                <Save size={14} /> Salvar
                            </button>
                        )}
                        <button
                            onClick={() => window.open(`/redap/relatorios/${relatorioId}/imprimir`, '_blank')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-black uppercase"
                        >
                            <Printer size={14} /> Prévia PDF
                        </button>
                    </div>
                </div>

                {/* Barra de etapas */}
                <div className="flex gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                    {STEPS.map((s, idx) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setStepIdx(idx)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                                stepIdx === idx
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Aviso de Bloqueio (Enviado / Aprovado) */}
            {isReadOnly && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3 text-xs font-bold text-indigo-800 dark:text-indigo-200">
                    <Lock size={16} className="shrink-0" />
                    <span>
                        Este relatório está com status <strong>{statusInfo.label}</strong> e encontra-se bloqueado para edição ordinária. Somente a Defesa Civil pode devolvê-lo para correção ou realizar reabertura auditada.
                    </span>
                </div>
            )}

            {/* Banner de Pendências (quando Devolvido) */}
            {openPendencias.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-xs uppercase tracking-wider">
                        <AlertTriangle size={16} /> Pendências apontadas pela Defesa Civil ({openPendencias.length})
                    </div>
                    <div className="space-y-2">
                        {openPendencias.map(p => (
                            <div key={p.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3">
                                <div className="text-xs">
                                    <span className="font-black uppercase text-amber-700 mr-2">[{p.secao}]</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{p.descricao}</span>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleResolvePendencia(p.id)}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shrink-0"
                                    >
                                        Marcar resolvida
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTEÚDO DA ETAPA ATIVA */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
                {/* ETAPA 1: IDENTIFICAÇÃO */}
                {stepIdx === 0 && (
                    <div className="space-y-4">
                        <h2 className="text-base font-black uppercase tracking-tight">1. Identificação do Responsável Setorial</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Responsável pelo Relatório *</label>
                                <input
                                    type="text"
                                    disabled={isReadOnly}
                                    value={report.responsavel_nome || ''}
                                    onChange={(e) => { markDirty(); setReport(p => ({ ...p, responsavel_nome: e.target.value })); }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cargo / Função</label>
                                <input
                                    type="text"
                                    disabled={isReadOnly}
                                    value={report.responsavel_cargo || ''}
                                    onChange={(e) => { markDirty(); setReport(p => ({ ...p, responsavel_cargo: e.target.value })); }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Telefone / WhatsApp</label>
                                <input
                                    type="text"
                                    disabled={isReadOnly}
                                    value={report.responsavel_telefone || ''}
                                    onChange={(e) => { markDirty(); setReport(p => ({ ...p, responsavel_telefone: e.target.value })); }}
                                    placeholder="(27) 99999-9999"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">E-mail Institucional</label>
                                <input
                                    type="email"
                                    disabled={isReadOnly}
                                    value={report.responsavel_email || ''}
                                    onChange={(e) => { markDirty(); setReport(p => ({ ...p, responsavel_email: e.target.value })); }}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ETAPA 2: DANOS (HUMANOS + INFRAESTRUTURA) */}
                {stepIdx === 1 && (
                    <div className="space-y-6">
                        {modelCfg.has_danos_humanos && (
                            <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h2 className="text-base font-black uppercase tracking-tight">2.1 Danos Humanos</h2>
                                    {!isReadOnly && (
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { k: SITUACAO_INFORMACAO.INFORMADO, l: 'Informar valores' },
                                                { k: SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA, l: 'Não houve ocorrência' },
                                                { k: SITUACAO_INFORMACAO.NAO_SE_APLICA, l: 'Não se aplica' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.k}
                                                    type="button"
                                                    onClick={() => updateComp('situacao_danos_humanos', opt.k)}
                                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                                                        (comp.situacao_danos_humanos || SITUACAO_INFORMACAO.INFORMADO) === opt.k
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                                                    }`}
                                                >
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {modelCfg.aviso_tecnico && (
                                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                                        <Info size={15} className="shrink-0 mt-0.5" />
                                        <span>{modelCfg.aviso_tecnico}</span>
                                    </div>
                                )}

                                {comp.situacao_danos_humanos === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
                                comp.situacao_danos_humanos === SITUACAO_INFORMACAO.NAO_SE_APLICA ? (
                                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 text-center">
                                        {comp.situacao_danos_humanos === SITUACAO_INFORMACAO.NAO_SE_APLICA
                                            ? 'Marcado explicitamente como "Não se aplica".'
                                            : 'Marcado explicitamente como "Não houve ocorrência de danos humanos".'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(modelCfg.danos_humanos_items || []).map(item => (
                                            <div key={item.key} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                                <label className="block text-xs font-black text-slate-700 dark:text-slate-200">{item.label}</label>
                                                <p className="text-[10px] text-slate-400 mb-2">{item.help}</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={isReadOnly}
                                                    placeholder="Não informado"
                                                    value={getHumanoValue(item.key)}
                                                    onChange={(e) => setHumanoValue(item.key, item.label, e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-black text-center outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Danos à Infraestrutura / Instalações */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <h2 className="text-base font-black uppercase tracking-tight">
                                    {modelCfg.has_danos_humanos ? '2.2 Danos à Infraestrutura / Instalações' : '2. Danos à Infraestrutura Pública'}
                                </h2>
                                {!isReadOnly && (
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { k: SITUACAO_INFORMACAO.INFORMADO, l: 'Registrar ocorrências' },
                                            { k: SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA, l: 'Não houve ocorrência' },
                                            { k: SITUACAO_INFORMACAO.NAO_SE_APLICA, l: 'Não se aplica' },
                                        ].map(opt => (
                                            <button
                                                key={opt.k}
                                                type="button"
                                                onClick={() => updateComp('situacao_danos_infraestrutura', opt.k)}
                                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                                                    (comp.situacao_danos_infraestrutura || SITUACAO_INFORMACAO.INFORMADO) === opt.k
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {comp.situacao_danos_infraestrutura === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
                            comp.situacao_danos_infraestrutura === SITUACAO_INFORMACAO.NAO_SE_APLICA ? (
                                <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 text-center">
                                    {comp.situacao_danos_infraestrutura === SITUACAO_INFORMACAO.NAO_SE_APLICA
                                        ? 'Marcado explicitamente como "Não se aplica".'
                                        : 'Marcado explicitamente como "Não houve ocorrência de danos à infraestrutura".'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => addDanoInfra()}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider"
                                        >
                                            <Plus size={14} /> Adicionar ocorrência de dano
                                        </button>
                                    )}

                                    {infraDanos.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic py-4">Nenhum dano à infraestrutura registrado ainda.</p>
                                    ) : (
                                        infraDanos.map(d => (
                                            <div key={d.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Categoria</label>
                                                        <select
                                                            disabled={isReadOnly}
                                                            value={d.categoria || ''}
                                                            onChange={(e) => updateDano(d.id, 'categoria', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                                                        >
                                                            {(modelCfg.danos_infraestrutura_categorias || []).map(c => (
                                                                <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
                                                            ))}
                                                            <option value="Outros">Outros</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Item / Instalação Afetada *</label>
                                                        <input
                                                            type="text"
                                                            list={`items-${d.id}`}
                                                            disabled={isReadOnly}
                                                            value={d.item || ''}
                                                            onChange={(e) => updateDano(d.id, 'item', e.target.value)}
                                                            placeholder="Selecione ou informe o bem afetado"
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                        />
                                                        <datalist id={`items-${d.id}`}>
                                                            {(modelCfg.danos_infraestrutura_categorias || [])
                                                                .flatMap(c => c.items || [])
                                                                .map((it, idx) => <option key={idx} value={it} />)}
                                                        </datalist>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Qtd. Danificada</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={isReadOnly}
                                                            placeholder="Vazio"
                                                            value={d.quantidade_danificada ?? ''}
                                                            onChange={(e) => updateDano(d.id, 'quantidade_danificada', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Qtd. Destruída</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={isReadOnly}
                                                            placeholder="Vazio"
                                                            value={d.quantidade_destruida ?? ''}
                                                            onChange={(e) => updateDano(d.id, 'quantidade_destruida', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Valor Estimado (R$)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            disabled={isReadOnly}
                                                            placeholder="0,00"
                                                            value={d.valor_estimado ?? ''}
                                                            onChange={(e) => updateDano(d.id, 'valor_estimado', e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0))}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Localidade / Bairro</label>
                                                        <input
                                                            type="text"
                                                            list="redap-bairros-list"
                                                            disabled={isReadOnly}
                                                            value={d.localidade || ''}
                                                            onChange={(e) => updateDano(d.id, 'localidade', e.target.value)}
                                                            placeholder="Bairro / Comunidade"
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrição objetiva do dano</label>
                                                        <input
                                                            type="text"
                                                            disabled={isReadOnly}
                                                            value={d.descricao || ''}
                                                            onChange={(e) => updateDano(d.id, 'descricao', e.target.value)}
                                                            placeholder="Descreva extensão, impacto e endereço complementar..."
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                        />
                                                    </div>
                                                    {!isReadOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDano(d.id)}
                                                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <datalist id="redap-bairros-list">
                            {(bairrosData || []).map((b, i) => (
                                <option key={i} value={typeof b === 'string' ? b : (b.nome || b.Bairro || '')} />
                            ))}
                        </datalist>
                    </div>
                )}

                {/* ETAPA 3: PREJUÍZOS ECONÔMICOS PÚBLICOS */}
                {stepIdx === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-base font-black uppercase tracking-tight">3. Prejuízos Econômicos Públicos</h2>
                            {!isReadOnly && (
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { k: SITUACAO_INFORMACAO.INFORMADO, l: 'Registrar prejuízos' },
                                        { k: SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA, l: 'Não houve ocorrência' },
                                        { k: SITUACAO_INFORMACAO.NAO_SE_APLICA, l: 'Não se aplica' },
                                    ].map(opt => (
                                        <button
                                            key={opt.k}
                                            type="button"
                                            onClick={() => updateComp('situacao_prejuizos', opt.k)}
                                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                                                (comp.situacao_prejuizos || SITUACAO_INFORMACAO.INFORMADO) === opt.k
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {opt.l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {comp.situacao_prejuizos === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
                        comp.situacao_prejuizos === SITUACAO_INFORMACAO.NAO_SE_APLICA ? (
                            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 text-center">
                                {comp.situacao_prejuizos === SITUACAO_INFORMACAO.NAO_SE_APLICA
                                    ? 'Marcado explicitamente como "Não se aplica".'
                                    : 'Marcado explicitamente como "Não houve prejuízos econômicos públicos".'}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => addPrejuizo()}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider"
                                    >
                                        <Plus size={14} /> Adicionar prejuízo econômico
                                    </button>
                                )}

                                {prejuizos.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-4">Nenhum prejuízo econômico registrado ainda.</p>
                                ) : (
                                    prejuizos.map(p => (
                                        <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Serviço Público Essencial Afetado *</label>
                                                    <input
                                                        type="text"
                                                        list={`serv-${p.id}`}
                                                        disabled={isReadOnly}
                                                        value={p.servico || ''}
                                                        onChange={(e) => updatePrejuizo(p.id, 'servico', e.target.value)}
                                                        placeholder="Selecione ou informe o serviço afetado"
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                    />
                                                    <datalist id={`serv-${p.id}`}>
                                                        {(modelCfg.prejuizos_servicos || []).map((s, idx) => <option key={idx} value={s} />)}
                                                    </datalist>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Valor Estimado (R$)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        disabled={isReadOnly}
                                                        placeholder="0,00"
                                                        value={p.valor_estimado ?? ''}
                                                        onChange={(e) => updatePrejuizo(p.id, 'valor_estimado', e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0))}
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrição objetiva</label>
                                                    <input
                                                        type="text"
                                                        disabled={isReadOnly}
                                                        value={p.descricao || ''}
                                                        onChange={(e) => updatePrejuizo(p.id, 'descricao', e.target.value)}
                                                        placeholder="Justificativa do valor, período de interrupção ou impacto..."
                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                    />
                                                </div>
                                                {!isReadOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePrejuizo(p.id)}
                                                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ETAPA 4: ATUAÇÃO DO ÓRGÃO */}
                {stepIdx === 3 && (
                    <AtuacaoOrgaoSection
                        equipes={equipes}
                        setEquipes={(fn) => { markDirty(); setEquipes(fn); }}
                        recursos={recursos}
                        setRecursos={(fn) => { markDirty(); setRecursos(fn); }}
                        despesas={despesas}
                        setDespesas={(fn) => { markDirty(); setDespesas(fn); }}
                        situacao={comp.situacao_atuacao}
                        onChangeSituacao={(val) => updateComp('situacao_atuacao', val)}
                        readOnly={isReadOnly}
                    />
                )}

                {/* ETAPA 5: RELATÓRIO FOTOGRÁFICO */}
                {stepIdx === 4 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-base font-black uppercase tracking-tight">5. Relatório Fotográfico e Evidências</h2>
                                <p className="text-xs text-slate-500">Fotos comprimidas automaticamente com data e coordenadas GPS (quando autorizadas).</p>
                            </div>
                            {!isReadOnly && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        capture="environment"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider"
                                    >
                                        <Camera size={15} /> Adicionar Foto
                                    </button>
                                </div>
                            )}
                        </div>

                        {anexos.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                                <Camera size={28} className="mx-auto text-slate-300" />
                                <p className="text-xs text-slate-400 font-semibold">Nenhuma fotografia anexada ainda.</p>
                                {!isReadOnly && (
                                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(comp.sem_fotos_justificativa)}
                                            onChange={(e) => updateComp('sem_fotos_justificativa', e.target.checked)}
                                            className="rounded accent-blue-600"
                                        />
                                        Declaro que não há registros fotográficos disponíveis para este relatório
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {anexos.map(foto => (
                                    <div key={foto.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50 flex flex-col">
                                        <div className="h-44 bg-slate-200 dark:bg-slate-900 relative">
                                            {foto.url_preview && (
                                                <img src={foto.url_preview} alt={foto.descricao || 'Foto'} className="w-full h-full object-cover" />
                                            )}
                                            {!isReadOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => { markDirty(); setAnexos(prev => prev.filter(a => a.id !== foto.id)); }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white shadow"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                                                <span>{foto.data_foto ? new Date(foto.data_foto).toLocaleDateString('pt-BR') : '—'}</span>
                                                {foto.latitude && (
                                                    <span className="inline-flex items-center gap-0.5 text-emerald-600">
                                                        <MapPin size={10} /> {Number(foto.latitude).toFixed(4)}, {Number(foto.longitude).toFixed(4)}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                disabled={isReadOnly}
                                                value={foto.descricao || ''}
                                                onChange={(e) => {
                                                    markDirty();
                                                    setAnexos(prev => prev.map(a => (a.id === foto.id ? { ...a, descricao: e.target.value } : a)));
                                                }}
                                                placeholder="Legenda / vínculo com ocorrência..."
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ETAPA 6: INTRODUÇÃO E CONSIDERAÇÕES FINAIS (IA REVISÁVEL - SEÇÃO 9) */}
                {stepIdx === 5 && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200 flex items-start gap-2.5">
                            <Sparkles size={16} className="shrink-0 mt-0.5 text-violet-600" />
                            <div>
                                <strong className="font-black uppercase text-[10px] tracking-wider block">Assistente de Redação com Revisão Humana (Seção 9)</strong>
                                A IA elabora um rascunho utilizando <strong>apenas os dados estruturados</strong> preenchidos nas etapas anteriores. Revise sempre o conteúdo e confirme a versão final.
                            </div>
                        </div>

                        {[
                            { key: 'introducao', title: 'Introdução do Relatório Setorial', textField: 'introducao_texto', iaField: 'introducao_ia_gerada', confBy: 'introducao_confirmada_por', confAt: 'introducao_confirmada_em' },
                            { key: 'consideracoes', title: 'Considerações Finais', textField: 'consideracoes_texto', iaField: 'consideracoes_ia_gerada', confBy: 'consideracoes_confirmada_por', confAt: 'consideracoes_confirmada_em' },
                        ].map(sec => (
                            <div key={sec.key} className="space-y-2.5 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-black">{sec.title}</h3>
                                        {report[sec.iaField] && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                                Rascunho IA
                                            </span>
                                        )}
                                        {report[sec.confAt] && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                <CheckCircle2 size={10} /> Revisado por {report[sec.confBy]}
                                            </span>
                                        )}
                                    </div>
                                    {!isReadOnly && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={aiLoading === sec.key}
                                                onClick={() => handleGenerateIA(sec.key)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-black uppercase disabled:opacity-50"
                                            >
                                                <Sparkles size={13} /> {aiLoading === sec.key ? 'Gerando...' : 'Gerar com IA'}
                                            </button>
                                            {report[sec.textField] && !report[sec.confAt] && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleConfirmText(sec.key)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase"
                                                >
                                                    <CheckCircle2 size={13} /> Confirmar Revisão
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    rows={5}
                                    disabled={isReadOnly}
                                    value={report[sec.textField] || ''}
                                    onChange={(e) => {
                                        markDirty();
                                        setReport(p => ({ ...p, [sec.textField]: e.target.value }));
                                    }}
                                    placeholder={`Redija ou gere com IA a seção "${sec.title}"...`}
                                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* ETAPA 7: PRÉVIA E ENVIO */}
                {stepIdx === 6 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-black uppercase tracking-tight">7. Conferência Final e Envio à Defesa Civil</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black uppercase text-slate-400">Danos Registrados</span>
                                <div className="text-xl font-black mt-1">{danos.length}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black uppercase text-slate-400">Prejuízos Públicos</span>
                                <div className="text-xl font-black mt-1">
                                    {formatBRL(prejuizos.reduce((a, p) => a + (Number(p.valor_estimado) || 0), 0))}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black uppercase text-slate-400">Equipes / Recursos</span>
                                <div className="text-xl font-black mt-1">{equipes.length + recursos.length}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black uppercase text-slate-400">Fotos Anexadas</span>
                                <div className="text-xl font-black mt-1">{anexos.length}</div>
                            </div>
                        </div>

                        {validationErrors.length > 0 && (
                            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 space-y-1.5">
                                <div className="text-xs font-black uppercase text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                                    <AlertTriangle size={14} /> Corrija os itens abaixo antes de enviar:
                                </div>
                                <ul className="list-disc pl-5 text-xs text-rose-700 dark:text-rose-200 space-y-1">
                                    {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}

                        {!isReadOnly && (
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(report.declaracao_responsabilidade)}
                                        onChange={(e) => {
                                            markDirty();
                                            setReport(p => ({ ...p, declaracao_responsabilidade: e.target.checked }));
                                        }}
                                        className="mt-0.5 rounded accent-blue-600"
                                    />
                                    <span>
                                        Declaro que as informações, quantitativos, estimativas financeiras e evidências registradas neste relatório setorial refletem fielmente os levantamentos realizados pelo órgão sob minha responsabilidade.
                                    </span>
                                </label>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={handleSubmitReport}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg disabled:opacity-50"
                                    >
                                        <Send size={15} />
                                        {submitting ? 'Enviando...' : 'Enviar para Análise da Defesa Civil'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navegação Inferior entre Etapas */}
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    disabled={stepIdx === 0}
                    onClick={() => setStepIdx(i => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black uppercase disabled:opacity-40"
                >
                    <ChevronLeft size={15} /> Voltar
                </button>
                {stepIdx < STEPS.length - 1 && (
                    <button
                        type="button"
                        onClick={async () => {
                            if (!isReadOnly && dirtyRef.current) await performSave(true);
                            setStepIdx(i => Math.min(STEPS.length - 1, i + 1));
                        }}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md"
                    >
                        Salvar e Continuar <ChevronRight size={15} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default RedapReportWizard;
