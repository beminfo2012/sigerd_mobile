import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Shield, ArrowLeft, RefreshCw, 
    CheckCircle, XCircle, Clock, 
    FileText, Download, TrendingUp,
    MapPin, Plus, DollarSign,
    MoreHorizontal, ChevronRight,
    Map as MapIcon, ClipboardList, Send, AlertTriangle, UserCheck, Calendar, Info, History, Signature
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { generateRedapReport } from '../../utils/redapReportGenerator';
import RedapMapModal from './components/RedapMapModal';
import ConfirmModal from '../../components/ConfirmModal';

const SECOES_REDAP = [
    { id: '1', titulo: 'Seção 1: Identificação Institucional e do Evento', secretaria: 'Defesa Civil', editavel: false },
    { id: '2', titulo: 'Seção 2: Danos Humanos (Afetados e Vítimas)', secretaria: 'Saúde / Assistência Social', secoesId: ['2'] },
    { id: '3.1', titulo: 'Seção 3 (Saúde): Danos a Edificações de Saúde', secretaria: 'Saúde', secaoId: '3' },
    { id: '3.2', titulo: 'Seção 3 (Educação): Danos a Edificações de Educação', secretaria: 'Educação', secaoId: '3' },
    { id: '3.3', titulo: 'Seção 3 (Obras): Danos a Edificações Públicas Gerais', secretaria: 'Obras', secaoId: '3' },
    { id: '4', titulo: 'Seção 4: Danos de Infraestrutura (Pontes/Vias)', secretaria: 'Obras', secaoId: '4' },
    { id: '5', titulo: 'Seção 5: Danos a Atividades Agrícolas / Privadas', secretaria: 'Agropecuária', secaoId: '5' },
    { id: '6', titulo: 'Seção 6: Danos Ambientais', secretaria: 'Meio Ambiente', secaoId: '6' },
    { id: '7', titulo: 'Seção 7: Quadro Resumo (Consolidação Econômica)', secretaria: 'Defesa Civil (Soma Automática)', editavel: false },
    { id: '8', titulo: 'Seção 8: Parecer Técnico e Conclusões', secretaria: 'Defesa Civil', secaoId: '8' },
    { id: '9', titulo: 'Seção 9: Assinaturas e Homologação Final', secretaria: 'Defesa Civil / Prefeito', editavel: false }
];

const RedapEventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    
    // Novas Entidades
    const [secoes, setSecoes] = useState([]);
    const [fluxo, setFluxo] = useState([]);
    const [historico, setHistorico] = useState([]);
    const [assinaturas, setAssinaturas] = useState([]);

    // Modais e Estados Auxiliares
    const [showMapModal, setShowMapModal] = useState(false);
    const [devolverSecao, setDevolverSecao] = useState(null);
    const [justificativa, setJustificativa] = useState('');
    const [showAssinarModal, setShowAssinarModal] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    const isDefesaCivil = ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role);
    const userSecretaria = redapService.REDAP_SECTORS[user?.role] || 'Defesa Civil';

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Carrega desastre
            const events = await redapService.getActiveEvents();
            const currentEvent = events.find(e => e.id === id);
            setEvent(currentEvent);

            if (currentEvent) {
                // 2. Carrega seções
                const listSecoes = await redapService.getSecoesByEvento(id);
                setSecoes(listSecoes || []);

                // 3. Carrega fluxo
                const listFluxo = await redapService.getFluxoAprovacaoByEvento(id);
                setFluxo(listFluxo || []);

                // 4. Carrega histórico
                const listHist = await redapService.getHistoricoAcoesByEvento(id);
                setHistorico(listHist || []);

                // 5. Carrega assinaturas
                const listAss = await redapService.getAssinaturasByEvento(id);
                setAssinaturas(listAss || []);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados do desastre.');
        } finally {
            setLoading(false);
        }
    };

    // Função de validação de seção (Defesa Civil)
    const handleValidarSecao = async (secaoRecord) => {
        try {
            await redapService.saveSecao({
                ...secaoRecord,
                status_secao: 'VALIDADO',
                justificativa_devolucao: null
            });
            toast.success('Seção validada com sucesso!');
            loadData();
        } catch (e) {
            toast.error('Erro ao validar seção.');
        }
    };

    // Função de devolução de seção (Defesa Civil)
    const handleDevolverSecao = async () => {
        if (!justificativa.trim()) {
            return toast.error('Informe a justificativa de devolução.');
        }
        try {
            await redapService.saveSecao({
                ...devolverSecao,
                status_secao: 'PENDENTE',
                justificativa_devolucao: justificativa
            });
            toast.success('Seção devolvida para correção.');
            setDevolverSecao(null);
            setJustificativa('');
            loadData();
        } catch (e) {
            toast.error('Erro ao devolver seção.');
        }
    };

    // Avança etapas no fluxo do REDAP
    const handleAvancarEtapa = async (etapaNumero) => {
        try {
            await redapService.updateFluxoEtapa(id, etapaNumero, 'CONCLUIDA', user?.full_name);
            toast.success(`Etapa ${etapaNumero} concluída!`);
            loadData();
        } catch (e) {
            toast.error('Erro ao atualizar fluxo.');
        }
    };

    // Registra assinatura eletrônica (Gestor / Prefeito / Secretários)
    const handleAssinarDocumento = async () => {
        try {
            let cargoAssinatura = user?.cargo || 'Representante Setorial';
            if (isDefesaCivil) cargoAssinatura = 'Coordenador Municipal de Proteção e Defesa Civil';
            if (user?.role === 'Prefeito') cargoAssinatura = 'Prefeito Municipal';

            await redapService.addAssinatura({
                evento_id: id,
                usuario_id: user?.id,
                nome: user?.full_name || 'Agente Governamental',
                cargo_secretaria: cargoAssinatura
            });
            
            toast.success('Assinatura eletrônica registrada com sucesso!');
            setShowAssinarModal(false);
            loadData();
        } catch (e) {
            toast.error('Erro ao registrar assinatura.');
        }
    };

    // Lógica econômica consolidada (Seção 7) - Soma automática de seções validadas
    const getPrejuizoConsolidado = () => {
        let total = 0;
        secoes.forEach(sec => {
            if (sec.status_secao === 'VALIDADO' && sec.dados_json) {
                // Seção 3 e 4 possuem a propriedade items
                if (sec.dados_json.items) {
                    Object.values(sec.dados_json.items).forEach(item => {
                        total += Number(item.valor_estimado) || 0;
                    });
                }
                // Seção 6
                if (sec.dados_json.custo_recuperacao) {
                    total += Number(sec.dados_json.custo_recuperacao) || 0;
                }
            }
        });
        return total;
    };

    // Verifica permissão para preencher a seção
    const canFillSecao = (item) => {
        if (event?.status_evento === 'Finalizado') return false;
        
        // Defesa Civil pode preencher tudo se necessário, mas foca em 1, 7, 8, 9
        if (isDefesaCivil) return true;

        // Verifica competências setoriais
        if (item.secretaria.includes(userSecretaria)) {
            return true;
        }
        return false;
    };

    const getSecaoStatusBadge = (item) => {
        // Encontra o registro correspondente para a secretaria do usuário ou o primeiro que achar
        const record = secoes.find(s => {
            if (isDefesaCivil) {
                // Mostra status se houver correspondência
                return s.secao === SECOES_REDAP.find(x => x.id === item.id)?.secaoId;
            }
            return s.secao === SECOES_REDAP.find(x => x.id === item.id)?.secaoId && s.secretaria_id === userSecretaria;
        }) || secoes.find(s => s.secao === SECOES_REDAP.find(x => x.id === item.id)?.secaoId);

        if (!record) {
            return <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">Pendente</span>;
        }

        switch (record.status_secao) {
            case 'PREENCHIDO':
                return <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase">Rascunho</span>;
            case 'ENVIADO':
                return <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full uppercase">Aguardando Validação</span>;
            case 'VALIDADO':
                return <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase">Validada</span>;
            default:
                return <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">Pendente</span>;
        }
    };

    const getSecaoAction = (item) => {
        const record = secoes.find(s => {
            if (isDefesaCivil) {
                return s.secao === SECOES_REDAP.find(x => x.id === item.id)?.secaoId;
            }
            return s.secao === SECOES_REDAP.find(x => x.id === item.id)?.secaoId && s.secretaria_id === userSecretaria;
        });

        const readOnly = record?.status_secao === 'VALIDADO' || record?.status_secao === 'ENVIADO';

        if (item.editavel === false) {
            return null;
        }

        return (
            <div className="flex items-center gap-2">
                {canFillSecao(item) && !readOnly && (
                    <button
                        onClick={() => navigate(`/redap/evento/${id}/secao/${item.secaoId}`)}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-700 transition-all flex items-center gap-1"
                    >
                        Preencher
                    </button>
                )}
                {isDefesaCivil && record?.status_secao === 'ENVIADO' && (
                    <>
                        <button
                            onClick={() => handleValidarSecao(record)}
                            className="bg-emerald-600 dark:bg-emerald-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-700 transition-all flex items-center gap-1"
                        >
                            Validar
                        </button>
                        <button
                            onClick={() => setDevolverSecao(record)}
                            className="bg-rose-600 dark:bg-rose-500 text-white px-3 py-2 rounded-xl text-[10px] font-bold uppercase hover:bg-rose-700 transition-all flex items-center gap-1"
                        >
                            Devolver
                        </button>
                    </>
                )}
            </div>
        );
    };

    const handlePrintPdf = async () => {
        setGeneratingPdf(true);
        try {
            await generateRedapReport({
                event,
                secoes,
                fluxo,
                historico,
                assinaturas,
                totalPrejuizo: getPrejuizoConsolidado()
            });
            toast.success('PDF do REDAP gerado com sucesso!');
        } catch (e) {
            console.error(e);
            toast.error('Falha ao gerar relatório PDF.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/redap')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Módulo REDAP-001/2026</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-tight flex items-center gap-1">
                            <Shield size={10} className="text-blue-500 dark:text-blue-400" /> {event?.id_sigerd || 'REDAP-PENDENTE'}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={handlePrintPdf}
                        disabled={generatingPdf}
                        className="bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        {generatingPdf ? 'Gerando...' : 'Imprimir Relatório'} <FileText size={16} />
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-4xl mx-auto">
                {/* Event Summary Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-600 dark:bg-blue-500 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100 dark:shadow-blue-900/30">
                            <TrendingUp size={32} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Prejuízo Consolidado do Evento</p>
                            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getPrejuizoConsolidado())}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Soma reativa das seções setoriais validadas pela Defesa Civil.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Classificação COBRADE</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{event?.cobrade}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Data do Desastre</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-500" /> {event?.data_inicio ? new Date(event.data_inicio).toLocaleString('pt-BR') : 'Não informada'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Localidade e Município</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <MapPin size={14} className="text-rose-500" /> {event?.municipio_uf || 'Santa Maria de Jetibá / ES'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Workflow Progression (Timeline) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-all">
                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" /> Fluxo de Aprovação e Validação
                    </h3>
                    <div className="relative pt-4 pb-2">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                            {fluxo.map(et => {
                                const isDone = et.status === 'CONCLUIDA';
                                return (
                                    <div key={et.id} className="bg-slate-50 dark:bg-slate-800/40 md:bg-transparent p-4 md:p-0 rounded-2xl flex flex-col items-center text-center space-y-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            {et.etapa}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200 leading-tight">
                                                {et.descricao_etapa.split(' (')[0]}
                                            </p>
                                            <p className="text-[8px] text-slate-400 font-bold mt-0.5">{et.responsavel}</p>
                                        </div>
                                        {isDefesaCivil && !isDone && (
                                            <button
                                                onClick={() => handleAvancarEtapa(et.etapa)}
                                                className="bg-blue-600 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase hover:bg-blue-700"
                                            >
                                                Concluir
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Seções Estruturadas REDAP-001/2026 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-all">
                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={16} className="text-blue-500" /> Estrutura de Seções REDAP
                    </h3>
                    <div className="space-y-3">
                        {SECOES_REDAP.map(item => {
                            return (
                                <div 
                                    key={item.id}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between gap-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">
                                            {item.id}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.titulo}</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.secretaria}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getSecaoStatusBadge(item)}
                                        {getSecaoAction(item)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Assinaturas Eletrônicas e Histórico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assinaturas */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Signature size={16} className="text-blue-500" /> Assinaturas Eletrônicas
                            </h3>
                            {event?.status_evento !== 'Finalizado' && (
                                <button
                                    onClick={() => setShowAssinarModal(true)}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-1"
                                >
                                    <Plus size={12} /> Assinar
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 min-h-[150px]">
                            {assinaturas.map(ass => (
                                <div key={ass.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-100">{ass.nome}</p>
                                    <p className="text-[9px] text-slate-400 font-semibold">{ass.cargo_secretaria}</p>
                                    <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <span>{new Date(ass.data_hora_assinatura).toLocaleString('pt-BR')}</span>
                                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">HASH: {ass.hash_assinatura}</span>
                                    </div>
                                </div>
                            ))}
                            {assinaturas.length === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-8">Nenhuma assinatura registrada ainda.</p>
                            )}
                        </div>
                    </div>

                    {/* Histórico e Auditoria */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={16} className="text-blue-500" /> Histórico de Ações
                        </h3>
                        <div className="space-y-3 min-h-[150px] max-h-[250px] overflow-y-auto pr-1">
                            {historico.map(hist => (
                                <div key={hist.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-100">{hist.ator}</p>
                                        <span className="text-[8px] text-slate-400">{new Date(hist.data_hora).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{hist.acao}</p>
                                </div>
                            ))}
                            {historico.length === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-8">Nenhuma ação registrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Devolução */}
            {devolverSecao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase">Devolver Seção</h3>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Ajuste técnico solicitado pelo gestor</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Justificativa para a Secretaria</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold text-slate-700 dark:text-slate-100 text-xs"
                                placeholder="Descreva os pontos a serem corrigidos ou completados..."
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDevolverSecao(null)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDevolverSecao}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all shadow-lg hover:bg-rose-700"
                            >
                                Devolver
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Assinatura */}
            <ConfirmModal
                isOpen={showAssinarModal}
                onClose={() => setShowAssinarModal(false)}
                onConfirm={handleAssinarDocumento}
                title="Confirmar Assinatura Eletrônica?"
                message={`Ao confirmar, sua assinatura eletrônica com identificação única do usuário (${user?.full_name}) será vinculada legalmente a esta seção do REDAP.`}
                confirmText="Assinar Eletronicamente"
                cancelText="Cancelar"
                type="info"
            />
        </div>
    );
};

export default RedapEventDetails;
