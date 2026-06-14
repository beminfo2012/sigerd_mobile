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
import { CurrencyInput } from '../../components/RedapInputs';
import FileInput from '../../components/FileInput';

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
    const userRealSecretaria = redapService.REDAP_SECTORS[user?.role] || 'Defesa Civil';
    const userSecretaria = urlSecretaria || userRealSecretaria;
    const isDefesaCivil = ['Admin', 'Coordenador', 'Coordenador de Proteção e Defesa Civil', 'Agente de Defesa Civil'].includes(user?.role);
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
            } else {
                items = ['Prefeitura Municipal (Sede)', 'Almoxarifado Central', 'Prédios Administrativos', 'Quadras Poliesportivas'];
            }
            const itemsData = {};
            items.forEach(it => {
                itemsData[it] = { danificado: 0, destruido: 0, valor_estimado: 0 };
            });
            setDadosJson({ items: itemsData, detalhes: '' });
        } else if (secaoEnum === 'DANOS_INFRAESTRUTURA') {
            const items = ['Pontes de Madeira', 'Pontes de Concreto', 'Bueiros e Galerias', 'Estradas Vicinais (KM)', 'Muros de Contenção'];
            const itemsData = {};
            items.forEach(it => {
                itemsData[it] = { danificado: 0, destruido: 0, valor_estimado: 0, extensao: '' };
            });
            setDadosJson({ items: itemsData, detalhes: '' });
        } else if (secaoEnum === 'DANOS_AGRICOLAS') {
            const items = ['Lavouras Temporárias', 'Lavouras Permanentes', 'Pecuária de Corte/Leite', 'Piscicultura / Tanques', 'Mel e Silvicultura'];
            const itemsData = {};
            items.forEach(it => {
                itemsData[it] = { area_afetada_ha: 0, produtores_atingidos: 0, perda_estimada_ton: 0, valor_estimado: 0 };
            });
            setDadosJson({ items: itemsData, detalhes: '' });
        } else if (secaoEnum === 'DANOS_AMBIENTAIS') {
            setDadosJson({
                area_atingida_ha: 0,
                recursos_hidricos_comprometidos: 'Não',
                incendios_florestais: 'Não',
                custo_recuperacao: 0,
                detalhes: ''
            });
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

    const isVisualizar = queryParams.get('visualizar') === 'true';

    const isReadOnly = isVisualizar || 
                       event?.status_evento === 'Finalizado' || 
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
                <div className="bg-blue-600 dark:bg-blue-700 rounded-[2rem] p-6 text-white shadow-xl flex items-center justify-between transition-all">
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
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
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
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
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
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Dano (R$)</label>
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
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Extensão</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        disabled={isReadOnly}
                                                        placeholder="0,00"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.extensao || ''}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].extensao = e.target.value !== '' ? parseFloat(e.target.value) : '';
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== '') {
                                                                const val = parseFloat(e.target.value);
                                                                const newItems = { ...dadosJson.items };
                                                                newItems[itemName].extensao = parseFloat(val.toFixed(2));
                                                                setDadosJson({ ...dadosJson, items: newItems });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-450 uppercase">Valor Dano</label>
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

                    {config?.enum === 'DANOS_AGRICOLAS' && dadosJson.items && (
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
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        disabled={isReadOnly}
                                                        placeholder="0,00"
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                                                        value={item.area_afetada_ha || 0}
                                                        onChange={(e) => {
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].area_afetada_ha = parseFloat(e.target.value) || 0;
                                                            setDadosJson({ ...dadosJson, items: newItems });
                                                        }}
                                                        onBlur={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newItems = { ...dadosJson.items };
                                                            newItems[itemName].area_afetada_ha = parseFloat(val.toFixed(2));
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

                    {config?.enum === 'DANOS_AMBIENTAIS' && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <List size={16} className="text-blue-500" /> Impactos Ambientais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Área Degradada (HA)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        disabled={isReadOnly}
                                        placeholder="0,00"
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                        value={dadosJson.area_atingida_ha || 0}
                                        onChange={(e) => setDadosJson({ ...dadosJson, area_atingida_ha: parseFloat(e.target.value) || 0 })}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            setDadosJson({ ...dadosJson, area_atingida_ha: parseFloat(val.toFixed(2)) });
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Recursos Hídricos Comprometidos?</label>
                                    <select
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                        value={dadosJson.recursos_hidricos_comprometidos || 'Não'}
                                        onChange={(e) => setDadosJson({ ...dadosJson, recursos_hidricos_comprometidos: e.target.value })}
                                    >
                                        <option value="Não">Não</option>
                                        <option value="Sim">Sim</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Ocorrência de Incêndios?</label>
                                    <select
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                        value={dadosJson.incendios_florestais || 'Não'}
                                        onChange={(e) => setDadosJson({ ...dadosJson, incendios_florestais: e.target.value })}
                                    >
                                        <option value="Não">Não</option>
                                        <option value="Sim">Sim</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">Custo de Recuperação (R$)</label>
                                    <CurrencyInput
                                        disabled={isReadOnly}
                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none text-base transition-all"
                                        value={dadosJson.custo_recuperacao || 0}
                                        onChange={(val) => setDadosJson({ ...dadosJson, custo_recuperacao: val })}
                                    />
                                </div>
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
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
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
