import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    MapPin, Camera, Save, ArrowLeft, 
    Shield, Info, Trash2, Image as ImageIcon,
    Clock, DollarSign, List, X, CheckCircle, Send, AlertTriangle
} from 'lucide-react';
import { UserContext } from '../../App';
import * as redapService from '../../services/redapService';
import { useToast } from '../../components/ToastNotification';
import { CurrencyInput, DecimalInput } from '../../components/RedapInputs';
import FileInput from '../../components/FileInput';
import { MrcrSelector } from './components/MrcrSelector';

// Mapeamento amigável das seções
const SECAO_MAP = {
    '2': { enum: 'DANOS_HUMANOS', title: 'Seção 2: Danos Humanos' },
    '3': { enum: 'DANOS_EDIFICACOES', title: 'Seção 3: Danos a Edificações Públicas / Sociais' },
    '4': { enum: 'DANOS_INFRAESTRUTURA', title: 'Seção 4: Danos de Infraestrutura' },
    '5': { enum: 'DANOS_AGRICOLAS', title: 'Seção 5: Danos a Atividades Agrícolas / Privadas' },
    '6': { enum: 'DANOS_AMBIENTAIS', title: 'Seção 6: Danos Ambientais' },
    '8': { enum: 'OBSERVACOES', title: 'Seção 8: Parecer Técnico e Observações' }
};

const RedapSectorForm = () => {
    const { eventoId, secaoId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState(null);
    const [secaoRecord, setSecaoRecord] = useState(null);

    // Identifica secretaria do usuário a partir da URL ou pelo papel
    const queryParams = new URLSearchParams(window.location.search);
    const urlSecretaria = queryParams.get('secretaria');
    const isVisualizar = queryParams.get('visualizar') === 'true';
    const userRealSecretaria = redapService.REDAP_SECTORS[user?.role] || 'Defesa Civil';
    const userSecretaria = urlSecretaria || userRealSecretaria;
    const isDefesaCivil = ['Admin', 'Administrador', 'administrador', 'admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil', 'Redap_Geral'].includes(user?.role);
    const config = SECAO_MAP[secaoId];

    // Estados dos formulários de acordo com a seção
    const [identificacao, setIdentificacao] = useState({
        responsavel_preenchimento: user?.full_name || '',
        cargo_funcao: user?.cargo || '',
        telefone: user?.telefone || '',
        email: user?.email || ''
    });

    const [dadosJson, setDadosJson] = useState({});
    const [fotos, setFotos] = useState([]);

    useEffect(() => {
        if (!config) {
            toast.error('Seção inválida.');
            navigate(`/redap/evento/${eventoId}`);
            return;
        }
        loadData();
    }, [eventoId, secaoId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Carrega desastre
            const events = await redapService.getActiveEvents();
            const currentEvent = events.find(e => e.id === eventoId);
            setEvent(currentEvent);

            // Carrega seções deste evento
            const secoes = await redapService.getSecoesByEvento(eventoId);
            const currentSecao = config.enum === 'DANOS_EDIFICACOES'
                ? secoes.find(s => s.secao === config.enum && s.secretaria_id === userSecretaria)
                : secoes.find(s => s.secao === config.enum);
            
            if (currentSecao) {
                setSecaoRecord(currentSecao);
                setIdentificacao({
                    responsavel_preenchimento: currentSecao.responsavel_preenchimento || user?.full_name || '',
                    cargo_funcao: currentSecao.cargo_funcao || user?.cargo || '',
                    telefone: currentSecao.telefone || user?.telefone || '',
                    email: currentSecao.email || user?.email || ''
                });
                setDadosJson(currentSecao.dados_json || {});
                setFotos(currentSecao.dados_json?.fotos || []);
            } else {
                // Inicializa dadosJson padrão
                initDefaultDados(config.enum);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados da seção.');
        } finally {
            setLoading(false);
        }
    };

    const initDefaultDados = (secaoEnum) => {
        if (secaoEnum === 'DANOS_HUMANOS') {
            setDadosJson({
                mortos: 0,
                feridos: 0,
                enfermos: 0,
                desalojados: 0,
                desabrigados: 0,
                desaparecidos: 0,
                familias_afetadas: 0,
                detalhes: ''
            });
        } else if (secaoEnum === 'DANOS_EDIFICACOES') {
            // Mapeia por secretaria
            let items = [];
            if (userSecretaria === 'Saúde') {
                items = ['Hospitais', 'Unidades Básicas de Saúde (UBS)', 'Pronto Atendimento (PA)', 'Farmácias Públicas', 'Laboratórios de Análises'];
            } else if (userSecretaria === 'Educação') {
                items = ['Escolas Municipais de Ensino Fundamental', 'Centros Municipais de Ed. Infantil (CMEI)', 'Bibliotecas Públicas'];
            } else if (userSecretaria === 'Assistência Social') {
                items = ['Centros de Referência de Assistência Social (CRAS)', 'Centros de Referência Especializado (CREAS)', 'Abrigos e Casas de Passagem'];
            } else if (userSecretaria === 'Serviços Urbanos') {
                items = ['Prédios Administrativos', 'Garagens e Pátios de Máquinas', 'Cemitérios Municipais'];
            } else {
                items = ['Prefeitura Municipal (Sede)', 'Almoxarifado Central', 'Prédios Administrativos', 'Quadras Poliesportivas'];
            }
            const itemsData = {};
            items.forEach(it => {
                itemsData[it] = { danificado: 0, destruido: 0, valor_estimado: 0 };
            });

            // Serviços Essenciais
            let servicos = [];
            if (userSecretaria === 'Saúde') {
                servicos = ['Assistência médica, saúde pública e atendimento de emergências médicas'];
            } else if (userSecretaria === 'Educação') {
                servicos = ['Rede de ensino público e transporte escolar'];
            } else if (userSecretaria === 'Serviços Urbanos') {
                servicos = ['Limpeza urbana e recolhimento de lixo', 'Iluminação pública'];
            } else if (userSecretaria === 'CESAN' || userSecretaria === 'Cesan') {
                servicos = ['Abastecimento de água potável', 'Esgotamento sanitário'];
            } else if (userSecretaria === 'Defesa Social') {
                servicos = ['Segurança Pública (Guarda Municipal, Defesa Civil)'];
            }
            const servicosData = {};
            servicos.forEach(it => {
                servicosData[it] = { prejudicado: 'Não', valor_estimado: 0 };
            });

            setDadosJson({ items: itemsData, servicos: servicosData, detalhes: '' });
        } else if (secaoEnum === 'DANOS_INFRAESTRUTURA') {
            const items = ['Pontes de Madeira', 'Pontes de Concreto', 'Bueiros e Galerias', 'Estradas Vicinais (KM)', 'Muros de Contenção'];
            if (userSecretaria === 'Obras') {
                items.push('Vias Pavimentadas');
            }
            const itemsData = {};
            items.forEach(it => {
                itemsData[it] = { danificado: 0, destruido: 0, valor_estimado: 0, extensao: '' };
            });
            setDadosJson({ items: itemsData, detalhes: '' });
        } else if (secaoEnum === 'DANOS_AGRICOLAS') {
            if (userSecretaria === 'Agropecuária' || userSecretaria === 'Agricultura') {
                const gruposAgro = {
                    'Hortaliças em campo': 'ha',
                    'Hortaliças em cultivo protegido (estufas)': 'ha',
                    'Fruticultura': 'ha',
                    'Cafeicultura': 'ha',
                    'Avicultura (produção de ovos e aves)': 'un./produtores',
                    'Pecuária leiteira': 'produtores/rebanho',
                    'Outras culturas agrícolas': 'ha',
                    'Estufas agrícolas': 'un.',
                    'Sistemas de irrigação': 'un.',
                    'Galpões e instalações rurais': 'un.',
                    'Máquinas e implementos agrícolas': 'un.',
                    'Insumos agrícolas armazenados': 'R$'
                };
                const itemsAgro = {};
                for(let k in gruposAgro) {
                    itemsAgro[k] = { unidade: gruposAgro[k], quantidade: 0, percentual: 0, valor_estimado: 0, observacoes: '' };
                }

                const gruposInfra = {
                    'Estufas': 'un.',
                    'Galpões': 'un.',
                    'Sistemas de irrigação': 'un.',
                    'Reservatórios de água': 'un.',
                    'Cercas': 'm',
                    'Máquinas e implementos': 'un.',
                    'Pontes particulares de acesso às propriedades': 'un.',
                    'Estradas internas das propriedades': 'm'
                };
                const infraData = {};
                for(let k in gruposInfra) {
                    infraData[k] = { unidade: gruposInfra[k], quantidade: 0, valor_estimado: 0 };
                }

                setDadosJson({ agro: itemsAgro, infra: infraData, detalhes: '' });
            } else if (userSecretaria === 'CDL' || userSecretaria === 'Desenvolvimento Econômico') {
                const setores = ['Indústria', 'Comércio', 'Serviços'];
                const setoresData = {};
                setores.forEach(s => {
                    setoresData[s] = { valor_estimado: 0 };
                });
                setDadosJson({ setores: setoresData, detalhes: '' });
            } else {
                const items = ['Lavouras Temporárias', 'Lavouras Permanentes', 'Pecuária de Corte/Leite', 'Piscicultura / Tanques', 'Mel e Silvicultura'];
                const itemsData = {};
                items.forEach(it => {
                    itemsData[it] = { area_afetada_ha: 0, produtores_atingidos: 0, perda_estimada_ton: 0, valor_estimado: 0 };
                });
                setDadosJson({ items: itemsData, detalhes: '' });
            }
        } else if (secaoEnum === 'DANOS_AMBIENTAIS') {
            const ambientais = [
                'Poluição ou contaminação da água',
                'Poluição ou contaminação do ar',
                'Poluição ou contaminação do solo',
                'Diminuição ou exaurimento hídrico',
                "Incêndios em parques, APA's ou APP's"
            ];
            const impactos = {};
            ambientais.forEach(it => {
                impactos[it] = { ocorreu: 'Não', populacao_atingida: '', area_atingida: '' };
            });
            setDadosJson({ impactos: impactos, detalhes: '' });
        } else if (secaoEnum === 'OBSERVACOES') {
            setDadosJson({
                parecer_tecnico: '',
                observacoes_complementares: ''
            });
        }
    };

    const handleFileSelect = (filesList) => {
        filesList.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotos(prev => [...prev, { 
                    id: crypto.randomUUID(), 
                    data: reader.result, 
                    timestamp: new Date().toISOString() 
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async (status = 'PREENCHIDO') => {
        if (saving) return;

        setSaving(true);
        try {
            const payload = {
                id: secaoRecord?.id || undefined,
                evento_id: eventoId,
                secretaria_id: userSecretaria,
                secao: config.enum,
                responsavel_preenchimento: identificacao.responsavel_preenchimento,
                cargo_funcao: identificacao.cargo_funcao,
                telefone: identificacao.telefone,
                email: identificacao.email,
                status_secao: status,
                dados_json: {
                    ...dadosJson,
                    fotos: fotos
                },
                data_envio: status === 'ENVIADO' ? new Date().toISOString() : secaoRecord?.data_envio || null
            };

            await redapService.saveSecao(payload);
            toast.success(status === 'ENVIADO' ? 'Seção enviada para validação!' : 'Rascunho salvo localmente!');
            navigate(`/redap/evento/${eventoId}`);
        } catch (error) {
            toast.error('Erro ao salvar os dados da seção.');
        } finally {
            setSaving(false);
        }
    };

    const isEventClosedForSecretaries = !isDefesaCivil && (
        event?.status_evento === 'FECHADO' || 
        event?.status_geral === 'FECHADO' ||
        (event?.data_limite && new Date() > new Date(event.data_limite))
    );

    const isReadOnly = isVisualizar || 
                       event?.status_evento === 'Finalizado' || 
                       isEventClosedForSecretaries ||
                       (!isDefesaCivil && (
                           secaoRecord?.status_secao === 'ENVIADO' || 
                           secaoRecord?.status_secao === 'VALIDADO' ||
                           userRealSecretaria !== userSecretaria
                       ));

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20 transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/redap/evento/${eventoId}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Preenchimento de Seção</h1>
                            {secaoRecord?.status_secao === 'PENDENTE' && secaoRecord?.justificativa_devolucao && (
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/20 px-2 py-0.5 rounded-full uppercase">Retornado</span>
                            )}
                            {secaoRecord?.status_secao === 'VALIDADO' && (
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/20 px-2 py-0.5 rounded-full uppercase">Validada</span>
                            )}
                            {secaoRecord?.status_secao === 'ENVIADO' && (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 px-2 py-0.5 rounded-full uppercase">Aguardando Validação</span>
                            )}
                            {secaoRecord?.status_secao === 'PREENCHIDO' && (
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 px-2 py-0.5 rounded-full uppercase">Rascunho</span>
                            )}
                            {!secaoRecord && (
                                <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 px-2 py-0.5 rounded-full uppercase">Pendente</span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-emerald-400/80 font-bold uppercase tracking-widest truncate max-w-[200px]">
                            {event?.nome_evento}
                        </p>
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSave('PREENCHIDO')}
                            disabled={saving}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                        >
                            <Save size={14} /> Salvar Rascunho
                        </button>
                        <button
                            onClick={() => handleSave('ENVIADO')}
                            disabled={saving}
                            className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 dark:shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Send size={14} /> Finalizar & Enviar
                        </button>
                    </div>
                )}
            </header>

            <main className="p-4 max-w-5xl mx-auto space-y-6">
                {/* Cabeçalho do Bloco */}
                <div className="bg-blue-600 dark:bg-blue-700 border border-slate-200 p-6 text-white shadow-xl flex items-center justify-between transition-all">
                    <div>
                        <p className="text-xs uppercase font-black tracking-widest opacity-80 mb-1">Seção Governamental ({userSecretaria})</p>
                        <h2 className="text-xl font-black uppercase tracking-tight">{config?.title}</h2>
                    </div>
                    <Shield size={32} className="opacity-40" />
                </div>

                {secaoRecord?.status_secao === 'VALIDADO' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 flex items-start gap-4">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Seção Validada pela Defesa Civil</h4>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mt-1">Este conteúdo já foi auditado e consolidado no relatório unificado.</p>
                        </div>
                    </div>
                )}

                {secaoRecord?.justificativa_devolucao && secaoRecord.status_secao !== 'VALIDADO' && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 flex items-start gap-4">
                        <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-bold text-rose-800 dark:text-rose-400 text-sm uppercase tracking-wider">Retorno / Necessidade de Ajuste</h4>
                            <p className="text-sm text-rose-600 dark:text-rose-500/80 mt-1 font-semibold">" {secaoRecord.justificativa_devolucao} "</p>
                        </div>
                    </div>
                )}

                {/* Form: Identificação */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Info size={16} className="text-blue-500" /> Responsável Pelo Preenchimento
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 bg-white dark:bg-slate-900">
                            <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Nome</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                value={identificacao.responsavel_preenchimento}
                                onChange={(e) => setIdentificacao({ ...identificacao, responsavel_preenchimento: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Cargo / Função</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                value={identificacao.cargo_funcao}
                                onChange={(e) => setIdentificacao({ ...identificacao, cargo_funcao: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Telefone de Contato</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                value={identificacao.telefone}
                                onChange={(e) => setIdentificacao({ ...identificacao, telefone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">E-mail</label>
                            <input
                                type="text"
                                disabled={isReadOnly}
                                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                value={identificacao.email}
                                onChange={(e) => setIdentificacao({ ...identificacao, email: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Dinâmico por Seção */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
                    {config?.enum === 'DANOS_HUMANOS' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Registro de Danos Humanos
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {['mortos', 'feridos', 'enfermos', 'desalojados', 'desabrigados', 'desaparecidos', 'familias_afetadas'].map(field => (
                                    <div key={field} className="space-y-1">
                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase capitalize">{field.replace(/_/g, ' ')}</label>
                                        <input
                                            type="number"
                                            disabled={isReadOnly}
                                            className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                            value={dadosJson[field] || 0}
                                            onChange={(e) => setDadosJson({ ...dadosJson, [field]: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {config?.enum === 'DANOS_EDIFICACOES' && dadosJson.items && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Instalações Setoriais Afetadas
                            </h3>
                            <div className="space-y-6">
                                {Object.keys(dadosJson.items).map((itemName, index) => {
                                    const item = dadosJson.items[itemName];
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Qtd. Danificado</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.danificado || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].danificado = parseInt(e.target.value) || 0;
                                                            if (newItems[itemName].valor_referencia) {
                                                                newItems[itemName].valor_estimado = ((newItems[itemName].destruido || 0) + (newItems[itemName].extensao || 0)) * newItems[itemName].valor_referencia + (newItems[itemName].danificado || 0) * newItems[itemName].valor_referencia * 0.5;
                                                            }
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Qtd. Destruído</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.destruido || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].destruido = parseInt(e.target.value) || 0;
                                                            if (newItems[itemName].valor_referencia) {
                                                                newItems[itemName].valor_estimado = ((newItems[itemName].destruido || 0) + (newItems[itemName].extensao || 0)) * newItems[itemName].valor_referencia + (newItems[itemName].danificado || 0) * newItems[itemName].valor_referencia * 0.5;
                                                            }
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Ref. (R$)</label>
                                                    <CurrencyInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.valor_referencia || 0}
                                                        onChange={(val) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].valor_referencia = val;
                                                            newItems[itemName].valor_estimado = ((item.destruido || 0) + (item.extensao || 0)) * val + (item.danificado || 0) * val * 0.5;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                    <MrcrSelector
                                                        disabled={isReadOnly}
                                                        onSelect={(mrcrData) => {
                                                            const newItems = { ...dadosJson.items };
                                                            const val = mrcrData.valor_unitario;
                                                            newItems[itemName].valor_referencia = val;
                                                            newItems[itemName].valor_estimado = ((item.destruido || 0) + (item.extensao || 0)) * val + (item.danificado || 0) * val * 0.5;
                                                            newItems[itemName].mrcr_meta = mrcrData;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Dano Final</label>
                                                    <CurrencyInput
                                                        disabled={true}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-500 dark:text-slate-400 text-sm outline-none cursor-not-allowed"
                                                        value={item.valor_estimado || 0}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    
                    {config?.enum === 'DANOS_EDIFICACOES' && dadosJson.servicos && Object.keys(dadosJson.servicos).length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Serviços Essenciais Afetados / Prejudicados
                            </h3>
                            <div className="space-y-4">
                                {Object.keys(dadosJson.servicos).map((itemName) => {
                                    const item = dadosJson.servicos[itemName];
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Prejudicado?</label>
                                                    <select
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.prejudicado || 'Não'}
                                                        onChange={(e) => {
                                                            const newServicos = { ...dadosJson.servicos };
                                                            newServicos[itemName].prejudicado = e.target.value;
                                                            setDadosJson({ ...dadosJson, servicos: newServicos });
                                                        }}
                                                    >
                                                        <option value="Não">Não</option>
                                                        <option value="Parcialmente">Parcialmente</option>
                                                        <option value="Totalmente">Totalmente</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Estimado (R$)</label>
                                                    <CurrencyInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.valor_estimado || 0}
                                                        onChange={(val) => {
                                                            const newServicos = { ...dadosJson.servicos };
                                                            newServicos[itemName].valor_estimado = val;
                                                            setDadosJson({ ...dadosJson, servicos: newServicos });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {config?.enum === 'DANOS_INFRAESTRUTURA' && dadosJson.items && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Infraestrutura Urbana / Rural
                            </h3>
                            <div className="space-y-6">
                                {Object.keys(dadosJson.items).map((itemName, index) => {
                                    const item = dadosJson.items[itemName];
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Qtd. Danif.</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.danificado || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].danificado = parseInt(e.target.value) || 0;
                                                            if (newItems[itemName].valor_referencia) {
                                                                newItems[itemName].valor_estimado = ((newItems[itemName].destruido || 0) + (newItems[itemName].extensao || 0)) * newItems[itemName].valor_referencia + (newItems[itemName].danificado || 0) * newItems[itemName].valor_referencia * 0.5;
                                                            }
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Qtd. Destr.</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.destruido || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].destruido = parseInt(e.target.value) || 0;
                                                            if (newItems[itemName].valor_referencia) {
                                                                newItems[itemName].valor_estimado = ((newItems[itemName].destruido || 0) + (newItems[itemName].extensao || 0)) * newItems[itemName].valor_referencia + (newItems[itemName].danificado || 0) * newItems[itemName].valor_referencia * 0.5;
                                                            }
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Extensão</label>
                                                    <DecimalInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.extensao}
                                                        onChange={(val) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].extensao = val;
                                                            if (newItems[itemName].valor_referencia) {
                                                                newItems[itemName].valor_estimado = ((newItems[itemName].destruido || 0) + (newItems[itemName].extensao || 0)) * newItems[itemName].valor_referencia + (newItems[itemName].danificado || 0) * newItems[itemName].valor_referencia * 0.5;
                                                            }
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Ref. (R$)</label>
                                                    <CurrencyInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.valor_referencia || 0}
                                                        onChange={(val) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].valor_referencia = val;
                                                            newItems[itemName].valor_estimado = ((item.destruido || 0) + (item.extensao || 0)) * val + (item.danificado || 0) * val * 0.5;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                    <MrcrSelector
                                                        disabled={isReadOnly}
                                                        onSelect={(mrcrData) => {
                                                            const newItems = { ...dadosJson.items };
                                                            const val = mrcrData.valor_unitario;
                                                            newItems[itemName].valor_referencia = val;
                                                            newItems[itemName].valor_estimado = ((item.destruido || 0) + (item.extensao || 0)) * val + (item.danificado || 0) * val * 0.5;
                                                            newItems[itemName].mrcr_meta = mrcrData;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Dano Final</label>
                                                    <CurrencyInput
                                                        disabled={true}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-xl font-bold text-slate-500 dark:text-slate-400 text-sm outline-none cursor-not-allowed"
                                                        value={item.valor_estimado || 0}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    
                    {config?.enum === 'DANOS_AGRICOLAS' && Object.keys(dadosJson).includes('agro') && dadosJson.agro && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <List size={16} className="text-blue-500" /> Produção Agropecuária
                                </h3>
                                <div className="space-y-6">
                                    {Object.keys(dadosJson.agro).map((itemName) => {
                                        const item = dadosJson.agro[itemName];
                                        return (
                                            <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName} <span className="text-[10px] text-slate-400 font-normal">({item.unidade})</span></h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Quantidade</label>
                                                        <DecimalInput
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.quantidade}
                                                            onChange={(val) => {
                                                                const newAgro = { ...dadosJson.agro };
                                                                newAgro[itemName].quantidade = val;
                                                                setDadosJson({ ...dadosJson, agro: newAgro });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Perda (%)</label>
                                                        <input
                                                            type="number"
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.percentual || 0}
                                                            onChange={(e) => {
                                                                const newAgro = { ...dadosJson.agro };
                                                                newAgro[itemName].percentual = parseFloat(e.target.value) || 0;
                                                                setDadosJson({ ...dadosJson, agro: newAgro });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Prejuízo (R$)</label>
                                                        <CurrencyInput
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.valor_estimado || 0}
                                                            onChange={(val) => {
                                                                const newAgro = { ...dadosJson.agro };
                                                                newAgro[itemName].valor_estimado = val;
                                                                setDadosJson({ ...dadosJson, agro: newAgro });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Observações</label>
                                                        <input
                                                            type="text"
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.observacoes || ''}
                                                            onChange={(e) => {
                                                                const newAgro = { ...dadosJson.agro };
                                                                newAgro[itemName].observacoes = e.target.value;
                                                                setDadosJson({ ...dadosJson, agro: newAgro });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <List size={16} className="text-blue-500" /> Infraestrutura Rural
                                </h3>
                                <div className="space-y-6">
                                    {dadosJson.infra && Object.keys(dadosJson.infra).map((itemName) => {
                                        const item = dadosJson.infra[itemName];
                                        return (
                                            <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName} <span className="text-[10px] text-slate-400 font-normal">({item.unidade})</span></h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Qtd. Danificada</label>
                                                        <DecimalInput
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.quantidade}
                                                            onChange={(val) => {
                                                                const newInfra = { ...dadosJson.infra };
                                                                newInfra[itemName].quantidade = val;
                                                                setDadosJson({ ...dadosJson, infra: newInfra });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Estimado (R$)</label>
                                                        <CurrencyInput
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.valor_estimado || 0}
                                                            onChange={(val) => {
                                                                const newInfra = { ...dadosJson.infra };
                                                                newInfra[itemName].valor_estimado = val;
                                                                setDadosJson({ ...dadosJson, infra: newInfra });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {config?.enum === 'DANOS_AGRICOLAS' && Object.keys(dadosJson).includes('setores') && dadosJson.setores && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Prejuízos Econômicos Privados
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                {Object.keys(dadosJson.setores).map((itemName) => {
                                    const item = dadosJson.setores[itemName];
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Prejuízo (R$)</label>
                                                <CurrencyInput
                                                    disabled={isReadOnly}
                                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                    value={item.valor_estimado || 0}
                                                    onChange={(val) => {
                                                        const newSetores = { ...dadosJson.setores };
                                                        newSetores[itemName].valor_estimado = val;
                                                        setDadosJson({ ...dadosJson, setores: newSetores });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {config?.enum === 'DANOS_AGRICOLAS' && Object.keys(dadosJson).includes('items') && dadosJson.items && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Atividades Agrícolas / Agropecuárias
                            </h3>
                            <div className="space-y-6">
                                {Object.keys(dadosJson.items).map((itemName, index) => {
                                    const item = dadosJson.items[itemName];
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Área (HA)</label>
                                                    <DecimalInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.area_afetada_ha}
                                                        onChange={(val) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].area_afetada_ha = val;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Produtores</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.produtores_atingidos || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].produtores_atingidos = parseInt(e.target.value) || 0;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Perda (T)</label>
                                                    <input
                                                        type="number"
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.perda_estimada_ton || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].perda_estimada_ton = parseFloat(e.target.value) || 0;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Prejuízo (R$)</label>
                                                    <CurrencyInput
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.valor_estimado || 0}
                                                        onChange={(val) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].valor_estimado = val;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {config?.enum === 'DANOS_AMBIENTAIS' && dadosJson.impactos && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Impactos Ambientais
                            </h3>
                            <div className="space-y-4">
                                {Object.keys(dadosJson.impactos).map((itemName) => {
                                    const item = dadosJson.impactos[itemName];
                                    const isIncendio = itemName.includes('Incêndio');
                                    
                                    return (
                                        <div key={itemName} className="bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/65 space-y-3">
                                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">{itemName}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Ocorreu?</label>
                                                    <select
                                                        disabled={isReadOnly}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.ocorreu || 'Não'}
                                                        onChange={(e) => {
                                                            const newImpactos = { ...dadosJson.impactos };
                                                            newImpactos[itemName].ocorreu = e.target.value;
                                                            if (e.target.value === 'Não') {
                                                                newImpactos[itemName].populacao_atingida = '';
                                                                newImpactos[itemName].area_atingida = '';
                                                            }
                                                            setDadosJson({ ...dadosJson, impactos: newImpactos });
                                                        }}
                                                    >
                                                        <option value="Não">Não</option>
                                                        <option value="Sim">Sim</option>
                                                    </select>
                                                </div>
                                                
                                                {item.ocorreu === 'Sim' && !isIncendio && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">População do município atingida</label>
                                                        <select
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.populacao_atingida || ''}
                                                            onChange={(e) => {
                                                                const newImpactos = { ...dadosJson.impactos };
                                                                newImpactos[itemName].populacao_atingida = e.target.value;
                                                                setDadosJson({ ...dadosJson, impactos: newImpactos });
                                                            }}
                                                        >
                                                            <option value="">Selecione...</option>
                                                            <option value="0 a 5%">0 a 5%</option>
                                                            <option value="5 a 10%">5 a 10%</option>
                                                            <option value="10 a 20%">10 a 20%</option>
                                                            <option value="mais de 20%">mais de 20%</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {item.ocorreu === 'Sim' && isIncendio && (
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Área atingida</label>
                                                        <select
                                                            disabled={isReadOnly}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                            value={item.area_atingida || ''}
                                                            onChange={(e) => {
                                                                const newImpactos = { ...dadosJson.impactos };
                                                                newImpactos[itemName].area_atingida = e.target.value;
                                                                setDadosJson({ ...dadosJson, impactos: newImpactos });
                                                            }}
                                                        >
                                                            <option value="">Selecione...</option>
                                                            <option value="40%">40%</option>
                                                            <option value="Mais de 40%">Mais de 40%</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {config?.enum === 'OBSERVACOES' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Parecer Geral da Defesa Civil
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Parecer Técnico Discursivo</label>
                                    <textarea
                                        disabled={isReadOnly}
                                        rows={6}
                                        placeholder="Digite aqui o parecer oficial sobre o desastre, detalhando as vistorias, ações e o histórico operacional..."
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none text-base resize-y transition-all"
                                        value={dadosJson.parecer_tecnico || ''}
                                        onChange={(e) => setDadosJson({ ...dadosJson, parecer_tecnico: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Observações Complementares</label>
                                    <textarea
                                        disabled={isReadOnly}
                                        rows={4}
                                        placeholder="Outras informações pertinentes..."
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-medium text-slate-800 dark:text-slate-200 outline-none text-base resize-y transition-all"
                                        value={dadosJson.observacoes_complementares || ''}
                                        onChange={(e) => setDadosJson({ ...dadosJson, observacoes_complementares: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {config?.enum !== 'OBSERVACOES' && (
                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Info size={16} className="text-blue-500" /> Observações e Relato Setorial Adicional
                            </label>
                            <textarea
                                disabled={isReadOnly}
                                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all font-medium text-slate-800 dark:text-slate-200 min-h-[100px] text-base"
                                placeholder="Detalhes específicos, logradouros, ruas e pontos de referência..."
                                value={dadosJson.detalhes || ''}
                                onChange={(e) => setDadosJson({ ...dadosJson, detalhes: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                {/* Evidências Fotográficas */}
                {config?.enum !== 'OBSERVACOES' && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                        <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1 mb-2 block">
                            Fotos de Evidência ({fotos.length})
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {!isReadOnly && (
                                <div className="aspect-square">
                                    <FileInput 
                                        label="Adicionar"
                                        onFileSelect={handleFileSelect}
                                        type="photo"
                                    />
                                </div>
                            )}
                            {fotos.map((foto, idx) => (
                                <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 group shadow-sm bg-slate-50 dark:bg-slate-800 transition-all">
                                    <img src={foto.url || foto.data} className="w-full h-full object-cover" />
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => setFotos(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RedapSectorForm;
