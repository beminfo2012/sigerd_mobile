import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, AlertTriangle, Calendar, MapPin, Download, 
    FileText, CheckCircle, Clock, Info, ShieldAlert, MessageCircle
} from 'lucide-react';
import { getAlertaCemadenById } from '../../services/alertasCemadenService';
import { useToast } from '../../components/ToastNotification';

const NIVEL_COLORS = {
    'OBSERVACAO': 'bg-slate-100 text-slate-700 border-slate-200',
    'MODERADO': 'bg-amber-100 text-amber-700 border-amber-200',
    'ALTO': 'bg-rose-100 text-rose-700 border-rose-200',
    'MUITO_ALTO': 'bg-red-600 text-white border-red-700',
    'CESSAR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const AlertaCemadenDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [alerta, setAlerta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAlertaCemadenById(id);
            // Sort versoes by uploaded_at asc
            data.versoes = data.versoes.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
            setAlerta(data);
        } catch (error) {
            toast.error('Erro ao carregar detalhes do alerta.');
            navigate('/alertas-cemaden');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12 min-h-screen items-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!alerta) return null;

    const latestVersao = alerta.versoes[alerta.versoes.length - 1];

    const renderTextSection = (title, text) => {
        if (!text) return null;
        return (
            <div className="mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{title}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {text}
                </p>
            </div>
        );
    };

    const shareToWhatsApp = async () => {
        const isAltaSeveridade = alerta.nivel_atual === 'ALTO' || alerta.nivel_atual === 'MUITO_ALTO';
        const severityEmoji = isAltaSeveridade ? '🔴' : (alerta.nivel_atual === 'MODERADO' ? '🟠' : '🟢');
        
        const waText =
            `🚨 *ALERTA CEMADEN - DEFESA CIVIL* 🚨\n\n` +
            `📍 *MUNICÍPIO:* ${alerta.municipio} - ${alerta.uf}\n` +
            `⚠️ *TIPO DE EVENTO:* ${alerta.tipo_evento}\n` +
            `${severityEmoji} *NÍVEL ATUAL:* ${alerta.nivel_atual}\n\n` +
            `📅 *Abertura:* ${new Date(alerta.data_abertura).toLocaleDateString('pt-BR')}\n` +
            `🚦 *Status:* ${alerta.status}\n\n` +
            (latestVersao && latestVersao.cenario_risco ? `⚡ *Cenário de Risco:*\n${latestVersao.cenario_risco}\n\n` : '') +
            `📞 *Emergência:* 199 / 27 99771-2022\n` +
            `🏘️ Defesa Civil - Santa Maria de Jetibá`;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(waText);
                toast.success('Texto copiado! Abrindo WhatsApp...');
            }
        } catch (err) {
            console.warn('Clipboard copy failed:', err);
        }

        const waChannelLink = `https://whatsapp.com/channel/0029Vb7CuCcW4lh0Lhj115`;
        window.open(waChannelLink, '_blank');
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 transition-colors">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/alertas-cemaden')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight">Detalhes do Alerta</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{alerta.numero_alerta}</p>
                    </div>
                </div>
                <button
                    onClick={shareToWhatsApp}
                    className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#20ba59] transition-all shadow-md"
                >
                    <MessageCircle size={16} /> Compartilhar
                </button>
            </header>

            <main className="p-4 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Esquerda: Informações Principais */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Resumo Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">{alerta.municipio} - {alerta.uf}</h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{alerta.categoria_risco} • {alerta.tipo_evento}</p>
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${NIVEL_COLORS[alerta.nivel_atual] || NIVEL_COLORS['OBSERVACAO']}`}>
                                {alerta.nivel_atual}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Status</p>
                                <p className={`text-sm font-bold mt-1 ${alerta.status === 'ATIVO' ? 'text-emerald-500' : 'text-slate-500'}`}>{alerta.status}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Abertura</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    {new Date(alerta.data_abertura).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={12}/> Expostos</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    {alerta.pessoas_expostas ? `${alerta.pessoas_expostas} pessoas` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Info size={12}/> Moradias</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                                    {alerta.moradias_expostas ? `${alerta.moradias_expostas} und` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Textos Completos (da versão mais recente) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <FileText size={18} className="text-blue-500" /> Relatório Mais Recente
                        </h3>
                        {latestVersao ? (
                            <>
                                {renderTextSection('Cenário de Risco', latestVersao.cenario_risco)}
                                {renderTextSection('Situação Atual', latestVersao.situacao_atual)}
                                {renderTextSection('Tendência', latestVersao.tendencia)}
                                {renderTextSection('Recomendações', latestVersao.recomendacoes)}
                                {renderTextSection('Ações de Proteção (CENAD)', latestVersao.acoes_defesa_civil)}
                            </>
                        ) : (
                            <p className="text-sm text-slate-500 italic">Nenhum dado extraído disponível.</p>
                        )}
                    </div>
                </div>

                {/* Direita: Linha do Tempo */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                            <Clock size={18} className="text-amber-500" /> Linha do Tempo
                        </h3>
                        
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                            {alerta.versoes.map((versao, idx) => (
                                <div key={versao.id} className="relative pl-6">
                                    {/* Dot */}
                                    <div className="absolute w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900 -left-[9px] top-1"></div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                                                    {versao.tipo_documento}
                                                </span>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                    {new Date(versao.uploaded_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${NIVEL_COLORS[versao.nivel] || NIVEL_COLORS['OBSERVACAO']}`}>
                                                {versao.nivel}
                                            </span>
                                        </div>
                                        
                                        <a 
                                            href={versao.arquivo_path} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <Download size={14} /> Baixar PDF Original
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AlertaCemadenDetail;
