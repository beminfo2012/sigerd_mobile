import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Shield, ArrowLeft, RefreshCw, 
    CheckCircle, XCircle, Clock, 
    FileText, Download, TrendingUp,
    MapPin, Plus, DollarSign,
    MoreHorizontal, ChevronRight,
    Map as MapIcon, ClipboardList, Send, AlertTriangle, UserCheck, Calendar, Info, History, Signature, Printer,
    Eye, EyeOff, Edit, Check, Undo
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { generateRedapReport } from '../../utils/redapReportGenerator';
import FluxoAprovacaoTimeline from './components/FluxoAprovacaoTimeline';
import RedapMapModal from './components/RedapMapModal';
import RedapLocationPickerModal from './components/RedapLocationPickerModal';
import RedapParecerDecisorioModal from './components/RedapParecerDecisorioModal';
import ConfirmModal from '../../components/ConfirmModal';
import EventModal from './components/EventModal';
import RedapDocumentosOficiais from './components/RedapDocumentosOficiais';
import RedapQuadroResumoModal from './components/RedapQuadroResumoModal';

const SECOES_REDAP = [
    { id: '1', titulo: 'Seção 1: Identificação Institucional e do Evento', secretaria: 'Defesa Civil', editavel: false },
    { id: '2', titulo: 'Seção 2: Danos Humanos (Afetados e Vítimas)', secretaria: 'Saúde / Assistência Social', secaoId: '2' },
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

const SECAO_ENUM_MAP = {
    '2': 'DANOS_HUMANOS',
    '3': 'DANOS_EDIFICACOES',
    '4': 'DANOS_INFRAESTRUTURA',
    '5': 'DANOS_AGRICOLAS',
    '6': 'DANOS_AMBIENTAIS',
    '8': 'OBSERVACOES'
};

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
    const [documentos, setDocumentos] = useState([]);

    // Modais e Estados Auxiliares
    const [showMapModal, setShowMapModal] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [showQuadroResumoModal, setShowQuadroResumoModal] = useState(false);
    const [devolverSecao, setDevolverSecao] = useState(null);
    const [justificativa, setJustificativa] = useState('');
    const [showAssinarModal, setShowAssinarModal] = useState(false);
    const [showParecerModal, setShowParecerModal] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // Validação de Documentos
    const { liberado: docsLiberados, pendentes: docsPendentes } = redapService.verificarDocumentosHomologacao ? redapService.verificarDocumentosHomologacao(documentos) : { liberado: true, pendentes: [] };

    const isDefesaCivil = ['Admin', 'Administrador', 'administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'Redap_Geral'].includes(user?.role);
    const userSecretaria = redapService.REDAP_SECTORS[user?.role] || 'Defesa Civil';

    const visibleSections = SECOES_REDAP.filter(item => {
        if (isDefesaCivil) return true;
        // Seções de controle/consolidadas automáticas (1, 7, 8, 9) não são visíveis para secretarias setoriais
        if (['1', '7', '8', '9'].includes(item.id)) return false;
        
        // A Assistência Social tem permissão para a Seção 2
        if (item.secaoId === '2' && userSecretaria === 'Assistência Social') return true;
        // A Saúde também tem permissão para a Seção 2 e Seção 3 (Saúde)
        if (item.secaoId === '2' && userSecretaria === 'Saúde') return true;
        
        // Verifica se a secretaria do item corresponde à secretaria do usuário
        return item.secretaria.toLowerCase().includes(userSecretaria.toLowerCase());
    });

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

                // 6. Carrega documentos oficiais (apenas para COMPDEC)
                try {
                    const listDocs = await redapService.getDocumentosByEvento(id);
                    setDocumentos(listDocs || []);
                } catch (e) {
                    console.warn('[REDAP] Documentos não disponíveis (tabela pode não existir ainda):', e.message);
                }
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
            
            // Ao concluir a consolidação e parecer (Etapa 2), fecha para as secretarias não inserirem mais dados
            if (etapaNumero === 2) {
                await redapService.updateEvent(id, {
                    nome_evento: event.nome_evento,
                    cobrade: event.cobrade,
                    data_inicio: event.data_inicio,
                    data_limite: event.data_limite,
                    status_geral: 'FECHADO'
                });
                toast.info('Desastre fechado para preenchimento de secretarias.');
            }
            
            loadData();
        } catch (e) {
            toast.error('Erro ao atualizar fluxo.');
        }
    };

    const handleSalvarParecerDecisorio = async (dadosParecer) => {
        try {
            // Lógica de salvar o parecer (implementaremos no redapService se necessário)
            // Se Opção B, evento encerra.
            // Se Opção A, avança fluxo.
            
            // Simulação de salvar parecer
            if (dadosParecer.opcao === 'B') {
                const updated = await redapService.updateEvent(id, {
                    ...event,
                    status_geral: 'ENCERRADO_SEM_DECRETACAO',
                    nivel_intensidade_final: null
                });
                await redapService.updateFluxoEtapa(id, 3, 'NAO_APLICAVEL', user?.full_name); // Conclui etapa como não aplicável ou alternativa
                setEvent(updated);
                toast.success('Parecer emitido. Evento encerrado sem decretação.');
            } else {
                // Opção A
                const updated = await redapService.updateEvent(id, {
                    ...event,
                    status_geral: 'PARECER_FAVORAVEL_DECRETACAO',
                    nivel_intensidade_final: dadosParecer.nivel_intensidade
                });
                await redapService.updateFluxoEtapa(id, 3, 'CONCLUIDA', user?.full_name);
                setEvent(updated);
                toast.success('Parecer favorável emitido com sucesso! Avançando para decretos.');
            }
            
            setShowParecerModal(false);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar o parecer decisório.');
        }
    };

    // Função de reabertura de evento consolidado/fechado (Defesa Civil / Admin)
    const handleReabrirEvento = async () => {
        if (!window.confirm('Tem certeza de que deseja reabrir este desastre para edição? Isso redefinirá o status geral para ABERTO e as etapas de consolidação pendentes.')) return;
        try {
            await redapService.updateEvent(id, {
                nome_evento: event.nome_evento,
                cobrade: event.cobrade,
                data_inicio: event.data_inicio,
                data_limite: event.data_limite,
                status_geral: 'ABERTO'
            });

            // Reseta a etapa 2 para PENDENTE
            await redapService.updateFluxoEtapa(id, 2, 'PENDENTE', user?.full_name || 'Defesa Civil');
            
            toast.success('Evento reaberto com sucesso!');
            loadData();
        } catch (e) {
            toast.error('Erro ao reabrir desastre.');
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

    // Lógica econômica consolidada (Seção 7) - Soma automática de seções validadas / preenchidas
    const getPrejuizoConsolidado = (apenasValidados = false) => {
        let total = 0;
        secoes.forEach(sec => {
            const statusMatch = apenasValidados 
                ? sec.status_secao === 'VALIDADO' 
                : ['VALIDADO', 'ENVIADO', 'PREENCHIDO'].includes(sec.status_secao);
                
            if (statusMatch && sec.dados_json) {
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

    // Função para dispensar preenchimento por parte da Defesa Civil
    const handleDispensarSecao = async (item) => {
        const targetEnum = SECAO_ENUM_MAP[item.secaoId];
        if (!targetEnum) return;
        
        const record = secoes.find(s => {
            if (item.secaoId === '3') {
                return s.secao === targetEnum && s.secretaria_id === item.secretaria;
            }
            return s.secao === targetEnum;
        });

        try {
            await redapService.saveSecao({
                id: record?.id || undefined,
                evento_id: id,
                secretaria_id: item.secretaria || userSecretaria,
                secao: targetEnum,
                status_secao: 'DISPENSADO',
                responsavel_preenchimento: user?.full_name || 'Defesa Civil',
                dados_json: record?.dados_json || { dispensado: true }
            });
            toast.success('Seção dispensada com sucesso!');
            loadData();
        } catch (e) {
            toast.error('Erro ao dispensar seção.');
        }
    };

    // Função para reativar seção dispensada
    const handleReativarSecao = async (item) => {
        const targetEnum = SECAO_ENUM_MAP[item.secaoId];
        if (!targetEnum) return;

        const record = secoes.find(s => {
            if (item.secaoId === '3') {
                return s.secao === targetEnum && s.secretaria_id === item.secretaria;
            }
            return s.secao === targetEnum;
        });

        if (!record) return;

        try {
            await redapService.saveSecao({
                ...record,
                status_secao: 'PENDENTE',
                justificativa_devolucao: null
            });
            toast.success('Seção reativada com sucesso!');
            loadData();
        } catch (e) {
            toast.error('Erro ao reativar seção.');
        }
    };

    // Verifica permissão para preencher a seção
    const canFillSecao = (item) => {
        // Defesa Civil pode preencher tudo se necessário, mas foca em 1, 7, 8, 9
        if (isDefesaCivil) return true;

        // Se o evento está finalizado ou fechado geral
        if (event?.status_evento === 'FECHADO' || event?.status_geral === 'FECHADO' || event?.status_evento === 'Finalizado') {
            return false;
        }

        // Verificação de data limite para secretarias
        if (event?.data_limite) {
            const limit = new Date(event.data_limite);
            const now = new Date();
            if (now > limit) {
                return false;
            }
        }

        // Verifica competências setoriais
        if (item.secaoId === '2') {
            return userSecretaria === 'Assistência Social' || userSecretaria === 'Saúde';
        }
        return item.secretaria.toLowerCase().includes(userSecretaria.toLowerCase());
    };

    const getSecaoStatusBadge = (item) => {
        const targetEnum = SECAO_ENUM_MAP[item.secaoId];
        if (!targetEnum) return null;

        // Encontra o registro correspondente para a secretaria do usuário ou o primeiro que achar
        const record = secoes.find(s => {
            if (isDefesaCivil) {
                if (item.secaoId === '3') {
                    return s.secao === targetEnum && s.secretaria_id === item.secretaria;
                }
                return s.secao === targetEnum;
            }
            return s.secao === targetEnum && s.secretaria_id === userSecretaria;
        }) || (isDefesaCivil && item.secaoId === '3' ? null : secoes.find(s => s.secao === targetEnum));

        if (!record) {
            return <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 px-3 py-1 rounded-full uppercase">Pendente</span>;
        }

        switch (record.status_secao) {
            case 'DISPENSADO':
                return <span className="text-xs font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">Dispensada</span>;
            case 'PREENCHIDO':
                return <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase">Rascunho</span>;
            case 'ENVIADO':
                return <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full uppercase">Aguardando Validação</span>;
            case 'VALIDADO':
                return <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full uppercase">Validada</span>;
            case 'PENDENTE':
                if (record.justificativa_devolucao) {
                    return (
                        <div className="flex items-center gap-1.5" title={`Motivo do retorno: ${record.justificativa_devolucao}`}>
                            <span className="text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 px-3 py-1 rounded-full uppercase">Retornado</span>
                            <span className="text-rose-500 shrink-0">
                                <AlertTriangle size={14} />
                            </span>
                        </div>
                    );
                }
                return <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 px-3 py-1 rounded-full uppercase">Pendente</span>;
            default:
                return <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 px-3 py-1 rounded-full uppercase">Pendente</span>;
        }
    };

    const getSecaoAction = (item) => {
        const targetEnum = SECAO_ENUM_MAP[item.secaoId];
        if (!targetEnum) return null;

        const record = secoes.find(s => {
            if (item.secaoId === '3') {
                return s.secao === targetEnum && s.secretaria_id === item.secretaria;
            }
            return s.secao === targetEnum;
        });

        // O readOnly só se aplica a usuários normais quando a seção foi enviada/validada. DC tem edição irrestrita (a menos que o status geral esteja FECHADO)
        const readOnly = (event?.status_geral === 'FECHADO') || (!isDefesaCivil && (record?.status_secao === 'VALIDADO' || record?.status_secao === 'ENVIADO'));

        if (item.editavel === false) {
            if (item.id === '7') {
                return (
                    <button
                        onClick={() => setShowQuadroResumoModal(true)}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-1 active:scale-95 shrink-0"
                    >
                        <Eye size={14} /> Ver Resumo
                    </button>
                );
            }
            return null;
        }

        const targetSecretaria = isDefesaCivil ? item.secretaria : userSecretaria;

        return (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Preencher / Editar */}
                {canFillSecao(item) && !readOnly && record?.status_secao !== 'DISPENSADO' && (
                    <button
                        onClick={() => navigate(`/redap/evento/${id}/secao/${item.secaoId}?secretaria=${encodeURIComponent(targetSecretaria)}`)}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-blue-700 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 shrink-0"
                        title={record ? 'Editar Seção' : 'Preencher Seção'}
                    >
                        {isDefesaCivil ? (
                            record ? <Edit size={14} /> : <Plus size={14} />
                        ) : (
                            <>
                                <span className="hidden sm:inline">{record ? 'Editar' : 'Preencher'}</span>
                                {record ? <Edit size={14} className="sm:hidden" /> : <Plus size={14} className="sm:hidden" />}
                            </>
                        )}
                    </button>
                )}

                {/* Visualizar */}
                {record && (
                    <button
                        onClick={() => navigate(`/redap/evento/${id}/secao/${item.secaoId}?secretaria=${encodeURIComponent(record.secretaria_id)}&visualizar=true`)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                        title="Visualizar Detalhes"
                    >
                        {isDefesaCivil ? (
                            <Eye size={14} />
                        ) : (
                            <>
                                <span className="hidden sm:inline">Visualizar</span>
                                <Eye size={14} className="sm:hidden" />
                            </>
                        )}
                    </button>
                )}

                {/* Imprimir Individual */}
                {record && record.status_secao !== 'DISPENSADO' && (
                    <button
                        onClick={() => window.open(`/redap/evento/imprimir-secao/${id}/${item.secaoId}?secretaria=${encodeURIComponent(record.secretaria_id)}`, '_blank')}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                        title="Imprimir Individual"
                    >
                        <Printer size={14} />
                    </button>
                )}

                {/* Validar e Devolver (Defesa Civil) */}
                {isDefesaCivil && record?.status_secao === 'ENVIADO' && (
                    <>
                        <button
                            onClick={() => handleValidarSecao(record)}
                            className="bg-emerald-600 dark:bg-emerald-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                            title="Validar"
                        >
                            <Check size={14} />
                        </button>
                        <button
                            onClick={() => setDevolverSecao(record)}
                            className="bg-rose-600 dark:bg-rose-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-rose-700 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                            title="Devolver"
                        >
                            <Undo size={14} />
                        </button>
                    </>
                )}

                {/* Dispensar e Reativar (Defesa Civil) */}
                {isDefesaCivil && record?.status_secao !== 'DISPENSADO' && record?.status_secao !== 'VALIDADO' && (
                    <button
                        onClick={() => handleDispensarSecao(item)}
                        className="bg-slate-400 dark:bg-slate-600 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-slate-500 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                        title="Dispensar"
                    >
                        <EyeOff size={14} />
                    </button>
                )}
                {isDefesaCivil && record?.status_secao === 'DISPENSADO' && (
                    <button
                        onClick={() => handleReativarSecao(item)}
                        className="bg-emerald-600 dark:bg-emerald-500 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 active:scale-95 shrink-0"
                        title="Reativar"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>
        );
    };

    const handlePrintPreview = () => {
        window.open(`/redap/evento/imprimir/${id}`, '_blank');
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
                        <h1 className="text-sm sm:text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[140px] sm:max-w-none">Módulo REDAP-001/2026</h1>
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-tight flex items-center gap-1">
                            <Shield size={10} className="text-blue-500 dark:text-blue-400" /> {event?.id_sigerd || 'REDAP-PENDENTE'}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {isDefesaCivil && (
                        <button
                            onClick={handlePrintPreview}
                            className="bg-emerald-600 dark:bg-emerald-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0"
                        >
                            <span className="hidden sm:inline">Visualizar e </span>Imprimir <Printer size={14} className="shrink-0" />
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-7xl mx-auto">
                {/* Banner de Encerramento sem Decretação */}
                {event?.status_geral === 'ENCERRADO_SEM_DECRETACAO' && (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 rounded-r-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={24} className="text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300 uppercase tracking-widest">
                                    Evento Encerrado Internamente
                                </h3>
                                <p className="text-xs text-rose-700/80 dark:text-rose-200/80 mt-1 leading-relaxed">
                                    Este evento foi ENCERRADO INTERNAMENTE sem decretação de situação de emergência ou calamidade pública, 
                                    conforme Parecer Decisório do Coordenador.
                                </p>
                            </div>
                        </div>
                        {isDefesaCivil && (
                            <button
                                onClick={handleReabrirEvento}
                                className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shrink-0"
                            >
                                Reabrir Evento
                            </button>
                        )}
                    </div>
                )}

                {/* Event Summary Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-all">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="bg-blue-600 dark:bg-blue-500 p-4 sm:p-5 rounded-[1.5rem] sm:border border-slate-200 text-white shadow-xl shadow-blue-100 dark:shadow-blue-900/30 shrink-0">
                            <TrendingUp size={24} className="sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                        {event?.nome_evento || 'Carregando desastre...'}
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Prejuízos Econômicos Coletados</p>
                                </div>
                                {isDefesaCivil && (
                                    <button
                                        onClick={() => setShowEditEventModal(true)}
                                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                                    >
                                        <Edit size={12} /> Editar Desastre
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-tight">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getPrejuizoConsolidado(true))}
                                    </span>
                                    <span className="text-[9px] sm:text-xs font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full w-fit shrink-0">Consolidado (Validado)</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-slate-500 dark:text-slate-400">
                                    <span className="text-lg sm:text-xl font-bold leading-tight">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getPrejuizoConsolidado(false))}
                                    </span>
                                    <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full w-fit shrink-0">Total Estimado</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800 text-sm">
                        <div className="space-y-1 col-span-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Classificação COBRADE</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200">{event?.cobrade}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Data do Desastre / Limite</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-500" /> {event?.data_inicio ? new Date(event.data_inicio).toLocaleDateString('pt-BR') : 'Não informada'}
                            </p>
                            {event?.data_limite && (
                                <p className="text-[10px] font-black text-rose-500 dark:text-rose-450 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    ⚠️ Limite: {new Date(event.data_limite).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Status do Desastre</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {event?.status_evento === 'FECHADO' || event?.status_geral === 'FECHADO' || event?.status_geral === 'ENCERRADO_SEM_DECRETACAO' ? (
                                    <span className="inline-flex text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Fechado (Bloqueado)
                                    </span>
                                ) : (
                                    <span className="inline-flex text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Aberto (Secretarias)
                                    </span>
                                )}
                                {event?.nivel_intensidade_final && (
                                    <span className={`inline-flex text-[10px] font-black border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                        event.nivel_intensidade_final === 'NIVEL_I' ? 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                                        event.nivel_intensidade_final === 'NIVEL_II' ? 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                        'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
                                    }`}>
                                        {event.nivel_intensidade_final.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1 col-span-1">
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Localidade e Município</p>
                            <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                <MapPin size={14} className="text-rose-500" /> {event?.municipio_uf || 'Santa Maria de Jetibá / ES'}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
                                {event?.latitude && event?.longitude ? (
                                    <>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono font-bold">
                                            {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                                        </span>
                                        {isDefesaCivil && (
                                            <button
                                                onClick={() => setShowLocationPicker(true)}
                                                className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline"
                                            >
                                                Alterar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowMapModal(true)}
                                            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all ml-auto"
                                        >
                                            <MapIcon size={12} /> Ver no Mapa
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100/40 dark:border-amber-900/20 uppercase tracking-widest flex items-center gap-1">
                                            <AlertTriangle size={10} /> Localização pendente
                                        </span>
                                        {isDefesaCivil && (
                                            <button
                                                onClick={() => setShowLocationPicker(true)}
                                                className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-1 ml-auto"
                                            >
                                                <MapPin size={10} /> Marcar no Mapa
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Progression (Timeline) */}
                <FluxoAprovacaoTimeline 
                    evento={event}
                    fases={fluxo}
                    isDefesaCivil={isDefesaCivil}
                    isPrefeito={user?.role === 'Prefeito'}
                    userPapel={user?.role}
                    onEmitirParecerConsolidacao={() => handleAvancarEtapa(2)}
                    onEmitirParecerDecisorio={() => setShowParecerModal(true)}
                    onGerarDocumentos={() => handleAvancarEtapa(4)}
                    onEnviarCepdec={() => handleAvancarEtapa(5)}
                    onExportarPacote={() => toast.info('Em breve: Exportação de pacote documental completo (.zip)')}
                />

                {/* Seções Estruturadas REDAP-001/2026 */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 transition-all">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList size={16} className="text-blue-500" /> Estrutura de Seções REDAP
                    </h3>
                    <div className="space-y-3">
                        {visibleSections.map(item => {
                            return (
                                <div 
                                    key={item.id}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-slate-850 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm shrink-0">
                                            {item.id}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.titulo}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{item.secretaria}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800/60 sm:border-t-0">
                                        {getSecaoStatusBadge(item)}
                                        {getSecaoAction(item)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Documentos Oficiais — exclusivo COMPDEC */}
                {isDefesaCivil && (
                    <RedapDocumentosOficiais
                        eventoId={id}
                        user={user}
                        documentos={documentos}
                        eventData={event}
                        onUpdate={loadData}
                    />
                )}

                {/* Assinaturas Eletrônicas */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Signature size={16} className="text-blue-500" /> Assinaturas Eletrônicas
                        </h3>
                        {event?.status_evento !== 'Finalizado' && (
                            <button
                                onClick={() => setShowAssinarModal(true)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-1"
                            >
                                <Plus size={12} /> Assinar
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 min-h-[150px]">
                        {assinaturas.map(ass => (
                            <div key={ass.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-100">{ass.nome}</p>
                                <p className="text-xs text-slate-400 font-semibold">{ass.cargo_secretaria}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span>{new Date(ass.data_hora_assinatura).toLocaleString('pt-BR')}</span>
                                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">HASH: {ass.hash_assinatura}</span>
                                </div>
                            </div>
                        ))}
                        {assinaturas.length === 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">Nenhuma assinatura registrada ainda.</p>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal de Devolução */}
            {devolverSecao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md border border-slate-200 shadow-2xl p-6 space-y-6">
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

            {/* Modal de Mapa Geral dos Danos */}
            {showMapModal && (
                <RedapMapModal
                    isOpen={showMapModal}
                    onClose={() => setShowMapModal(false)}
                    eventName={event?.nome_evento}
                    registrations={(() => {
                        const points = [];
                        
                        // Adiciona o ponto central do desastre
                        if (event?.latitude && event?.longitude) {
                            points.push({
                                id: 'central',
                                latitude: event.latitude,
                                longitude: event.longitude,
                                polygon_coords: event.polygon_coords,
                                secretaria_responsavel: 'Defesa Civil',
                                instalacao_afetada: 'Ponto Zero do Desastre',
                                descricao_detalhada: event.nome_evento || 'Ocorrência Geral',
                                valor_estimado: getPrejuizoConsolidado(true),
                                fotos: []
                            });
                        }
                        
                        // Verifica se as seções possuem dados com fotos ou instalações afetadas contendo coordenadas
                        secoes.forEach(sec => {
                            if (sec.dados_json) {
                                // Se a seção tem itens específicos (Seções 3, 4, 5 etc.)
                                if (sec.dados_json.items) {
                                    Object.entries(sec.dados_json.items).forEach(([key, value]) => {
                                        if (value.latitude && value.longitude) {
                                            points.push({
                                                id: `${sec.id}-${key}`,
                                                latitude: Number(value.latitude),
                                                longitude: Number(value.longitude),
                                                secretaria_responsavel: sec.secretaria_id || 'Setorial',
                                                instalacao_afetada: key,
                                                descricao_detalhada: value.descricao || 'Dano registrado.',
                                                valor_estimado: Number(value.valor_estimado) || 0,
                                                fotos: value.fotos || []
                                            });
                                        }
                                    });
                                }
                                
                                // Se o próprio JSON da seção tiver localização geral
                                if (sec.dados_json.localizacao?.lat && sec.dados_json.localizacao?.lng) {
                                    points.push({
                                        id: sec.id,
                                        latitude: Number(sec.dados_json.localizacao.lat),
                                        longitude: Number(sec.dados_json.localizacao.lng),
                                        secretaria_responsavel: sec.secretaria_id || 'Setorial',
                                        instalacao_afetada: `Danos gerais - ${sec.secao?.replace(/_/g, ' ')}`,
                                        descricao_detalhada: sec.dados_json.observacoes || 'Dados consolidados da seção.',
                                        valor_estimado: 0,
                                        fotos: sec.dados_json.fotos || []
                                    });
                                }
                            }
                        });
                        
                        return points;
                    })()}
                />
            )}

            {/* Modal de Seleção de Localização (Marcação) */}
            {showLocationPicker && (
                <RedapLocationPickerModal
                    isOpen={showLocationPicker}
                    onClose={() => setShowLocationPicker(false)}
                    initialLat={event?.latitude}
                    initialLng={event?.longitude}
                    initialPolygonCoords={event?.polygon_coords}
                    onSave={async (lat, lng, polygonCoords) => {
                        try {
                            const updated = await redapService.updateEventLocation(id, lat, lng, polygonCoords);
                            if (updated) {
                                setEvent(updated);
                                toast.success('Sucesso', 'Localização do desastre atualizada no mapa!');
                            } else {
                                toast.error('Erro ao salvar localização.');
                            }
                        } catch (err) {
                            console.error(err);
                            toast.error('Erro ao atualizar georreferenciamento.');
                        } finally {
                            setShowLocationPicker(false);
                        }
                    }}
                />
            )}

            {/* Modal de Edição Geral do Evento */}
            {showEditEventModal && (
                <EventModal
                    isOpen={showEditEventModal}
                    onClose={() => setShowEditEventModal(false)}
                    eventToEdit={event}
                    onSave={async (updatedFields) => {
                        try {
                            const updated = await redapService.updateEvent(id, updatedFields);
                            if (updated) {
                                setEvent(updated);
                                toast.success('Desastre atualizado com sucesso!');
                            } else {
                                toast.error('Erro ao atualizar informações.');
                            }
                        } catch (err) {
                            console.error(err);
                            toast.error('Erro ao salvar edições.');
                        } finally {
                            setShowEditEventModal(false);
                        }
                    }}
                />
            )}

            <RedapQuadroResumoModal
                isOpen={showQuadroResumoModal}
                onClose={() => setShowQuadroResumoModal(false)}
                secoes={secoes}
            />

            <RedapParecerDecisorioModal
                isOpen={showParecerModal}
                onClose={() => setShowParecerModal(false)}
                onConfirm={handleSalvarParecerDecisorio}
                user={user}
            />
        </div>
    );
};

export default RedapEventDetails;
