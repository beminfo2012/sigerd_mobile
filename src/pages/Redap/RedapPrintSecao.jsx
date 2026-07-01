import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import * as redapService from '../../services/redapService';
import { FileText, Printer, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const SECAO_MAP = {
    '2': { enum: 'DANOS_HUMANOS', title: 'Seção 2: Danos Humanos (Afetados e Vítimas)' },
    '3': { enum: 'DANOS_EDIFICACOES', title: 'Seção 3: Danos a Edificações Públicas / Sociais' },
    '4': { enum: 'DANOS_INFRAESTRUTURA', title: 'Seção 4: Danos de Infraestrutura (Vias / Pontes)' },
    '5': { enum: 'DANOS_AGRICOLAS', title: 'Seção 5: Danos a Atividades Agrícolas / Privadas' },
    '6': { enum: 'DANOS_AMBIENTAIS', title: 'Seção 6: Danos Ambientais' },
    '8': { enum: 'OBSERVACOES', title: 'Seção 8: Parecer Técnico e Observações' }
};

const RedapPrintSecao = () => {
    const { id, secaoId } = useParams();
    const [searchParams] = useSearchParams();
    const targetSecretaria = searchParams.get('secretaria');

    const [event, setEvent] = useState(null);
    const [secao, setSecao] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(1.5, prev + 0.1));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(0.5, prev - 0.1));
    };

    const handleResetZoom = () => {
        setZoom(1.0);
    };

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !secaoId) return;
            try {
                // 1. Carrega evento desastre
                const events = await redapService.getActiveEvents();
                const currentEvent = events.find(e => e.id === id);
                if (currentEvent) {
                    setEvent(currentEvent);
                }

                // 2. Carrega seções preenchidas do desastre
                const loadedSecoes = await redapService.getSecoesByEvento(id);
                const config = SECAO_MAP[secaoId];
                if (config) {
                    const currentSecao = config.enum === 'DANOS_EDIFICACOES'
                        ? loadedSecoes.find(s => s.secao === config.enum && s.secretaria_id === targetSecretaria)
                        : loadedSecoes.find(s => s.secao === config.enum);
                    
                    setSecao(currentSecao || null);
                    document.title = `REDAP - Seção ${secaoId} - ${targetSecretaria || 'Individual'}`;
                }
            } catch (error) {
                console.error('Error fetching individual REDAP section data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, secaoId, targetSecretaria]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen font-bold text-slate-600">Carregando visualização da seção...</div>;
    }

    if (!event) {
        return <div className="flex items-center justify-center min-h-screen font-bold text-red-600">Evento de desastre não encontrado.</div>;
    }

    const config = SECAO_MAP[secaoId];
    const dJson = secao?.dados_json || {};
    const fotos = dJson.fotos || [];

    return (
        <div className="report-root-wrapper min-h-screen bg-slate-100 flex flex-col justify-start">
            {/* CSS Customizado para impressão */}
            <style>{`
                :root {
                    --navy1: #0A192F;
                    --navy2: #0F2C59;
                    --navy3: #1E3A8A;
                    --orange-defesa: #F59E0B;
                    --text-color: #334155;
                    --gray-bg: #F8FAFC;
                    --gray-border: #E2E8F0;
                }

                body {
                    background-color: #f1f5f9;
                    color: var(--text-color);
                    font-family: 'Inter', system-ui, sans-serif;
                }

                .print-preview-wrapper {
                    transform: scale(var(--report-zoom));
                    transform-origin: top center;
                    transition: transform 0.2s ease-in-out;
                }

                @media print {
                    @page {
                        margin-top: 15mm;
                        margin-bottom: 12mm;
                        margin-left: 12mm;
                        margin-right: 12mm;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: white !important;
                    }
                    .report-root-wrapper {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background-color: white !important;
                    }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                        display: block !important;
                    }
                    main {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .report-table tr {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }

                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }

                .report-table th, .report-table td {
                    border: 1px solid var(--gray-border);
                    padding: 6px 8px;
                    text-align: left;
                    vertical-align: middle;
                    word-wrap: break-word;
                }

                .report-table th {
                    background-color: var(--gray-bg);
                    color: var(--navy3);
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 8px;
                    letter-spacing: 0.03em;
                }

                .report-table td {
                    background-color: #ffffff;
                    color: var(--text-color);
                    font-weight: 600;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    margin-top: 15px;
                    border-left: 4px solid var(--navy3);
                    background-color: var(--gray-bg);
                    padding: 6px 10px;
                    border-radius: 4px;
                }

                .section-header-title {
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--navy3);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
            `}</style>

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
                        <FileText size={16} className="text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Relatório REDAP Individual</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{config?.title || 'Seção Individual'}</span>
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
                    <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-slate-300 hover:text-white" title="Diminuir Zoom">
                        <ZoomOut size={16} />
                    </button>
                    <button onClick={handleResetZoom} className="h-8 px-3 rounded-lg hover:bg-white/10 flex items-center justify-center gap-1 transition-all text-xs font-bold text-slate-300 hover:text-white" title="Restaurar Zoom">
                        <RotateCcw size={12} /> {Math.round(zoom * 100)}%
                    </button>
                    <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-slate-300 hover:text-white" title="Aumentar Zoom">
                        <ZoomIn size={16} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <X size={16} /> Fechar
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                        <Printer size={16} /> Imprimir Seção
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper" style={{ '--report-zoom': zoom }}>
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-14 print:p-0 mb-10 print:mb-0 relative print-container flex flex-col justify-between">
                    <div className="relative">
                        {/* Header Oficial */}
                        <header className="flex flex-col items-center mb-8 border-b-4 border-orange-500 pb-6">
                            <div className="w-full flex justify-between items-center mb-6 px-4">
                                <div className="w-[100px] flex items-center justify-center">
                                    <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-[80px] w-auto object-contain" />
                                </div>
                                <div className="text-center flex-1 px-4">
                                    <h1 className="text-slate-900 font-extrabold text-sm uppercase leading-tight">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h1>
                                    <p className="text-slate-600 text-[9px] uppercase font-bold tracking-widest mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                                </div>
                                <div className="w-[100px] flex items-center justify-center text-right">
                                    <img src={LOGO_SIGERD} alt="SIGERD" className="h-[80px] w-auto object-contain" />
                                </div>
                            </div>
                            <h2 className="text-lg font-black text-blue-900 uppercase tracking-wide text-center">Registro de Desastres e Prejuízos (REDAP)</h2>
                            <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                                <span>CÓDIGO SIGERD: {event.id_sigerd || 'PENDENTE'}</span>
                                <span>•</span>
                                <span>SECRETARIA: {targetSecretaria || 'DEFESA CIVIL'}</span>
                                <span>•</span>
                                <span>EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</span>
                            </div>
                        </header>

                        {/* Status de preenchimento */}
                        <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex justify-between items-center text-xs">
                            <div>
                                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">Status da Seção</span>
                                <span className="font-black text-slate-800 uppercase text-sm">{secao?.status_secao || 'PENDENTE'}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">Responsável</span>
                                <span className="font-bold text-slate-700">{secao?.responsavel_preenchimento || 'Não preenchido'}</span>
                            </div>
                        </div>

                        {/* RENDERIZAÇÃO ESPECÍFICA POR SEÇÃO */}
                        {secaoId === '2' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 2: Danos Humanos (Afetados e Vítimas)</span>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '70%' }}>Classificação do Impacto</th>
                                            <th style={{ width: '30%', textAlign: 'center' }}>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Mortos Confirmados</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.mortos || 0}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <td>Feridos</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.feridos || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Enfermos</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.enfermos || 0}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <td>Desalojados</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.desalojados || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Desabrigados</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.desabrigados || 0}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <td>Desaparecidos</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.desaparecidos || 0}</td>
                                        </tr>
                                        <tr>
                                            <td>Famílias Afetadas</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dJson.familias_afetadas || 0}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {secaoId === '3' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 3: Danos a Edificações Públicas / Sociais</span>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50%' }}>Instalação / Equipamento Público</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Danificado</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Destruído</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Prejuízo Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dJson.items && Object.keys(dJson.items).length > 0 ? (
                                            Object.keys(dJson.items).map(itName => {
                                                const item = dJson.items[itName];
                                                return (
                                                    <tr key={itName}>
                                                        <td>{itName}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.danificado || 0}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.destruido || 0}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                            R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="4" className="text-center text-slate-400 italic py-4">Nenhum registro nesta seção.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {secaoId === '4' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 4: Danos de Infraestrutura (Vias / Pontes)</span>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>Tipo de Infraestrutura</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Danificado</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Destruído</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Extensão</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Prejuízo Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dJson.items && Object.keys(dJson.items).length > 0 ? (
                                            Object.keys(dJson.items).map(itName => {
                                                const item = dJson.items[itName];
                                                return (
                                                    <tr key={itName}>
                                                        <td>{itName}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.danificado || 0}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.destruido || 0}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.extensao || '-'}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                            R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="5" className="text-center text-slate-400 italic py-4">Nenhum registro nesta seção.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {secaoId === '5' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 5: Danos a Atividades Agrícolas / Privadas</span>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '35%' }}>Cultura / Atividade</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Área (HA)</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Produtores</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Perda (T)</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Prejuízo Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dJson.items && Object.keys(dJson.items).length > 0 ? (
                                            Object.keys(dJson.items).map(itName => {
                                                const item = dJson.items[itName];
                                                return (
                                                    <tr key={itName}>
                                                        <td>{itName}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.area_afetada_ha || 0}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.produtores_atingidos || 0}</td>
                                                        <td style={{ textAlign: 'center' }}>{item.perda_estimada_ton || 0}</td>
                                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                            R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr><td colSpan="5" className="text-center text-slate-400 italic py-4">Nenhum registro nesta seção.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {secaoId === '6' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 6: Danos Ambientais</span>
                                </div>
                                <table className="report-table">
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '45%', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Área Degradada (HA)</td>
                                            <td style={{ width: '55%' }}>{dJson.area_atingida_ha || 0} HA</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Recursos Hídricos Comprometidos?</td>
                                            <td>{dJson.recursos_hidricos_comprometidos || 'Não'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Ocorrência de Incêndios Florestais?</td>
                                            <td>{dJson.incendios_florestais || 'Não'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Prejuízo Estimado (Custo de Recuperação)</td>
                                            <td style={{ fontWeight: 'bold', color: '#b91c1c' }}>
                                                R$ {(dJson.custo_recuperacao || 0).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {secaoId === '8' && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Seção 8: Parecer Técnico e Observações</span>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-4 space-y-4 text-slate-800 text-xs bg-slate-50/20">
                                    <div>
                                        <p className="font-extrabold text-blue-900 uppercase mb-1">Parecer Técnico Oficial</p>
                                        <p className="whitespace-pre-wrap">{dJson.parecer_tecnico || 'Nenhum parecer técnico inserido.'}</p>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3">
                                        <p className="font-extrabold text-blue-900 uppercase mb-1">Observações Complementares</p>
                                        <p className="whitespace-pre-wrap">{dJson.observacoes_complementares || 'Sem observações complementares.'}</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Observações adicionais para seções setoriais */}
                        {secaoId !== '8' && dJson.detalhes && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Relato Setorial Adicional</span>
                                </div>
                                <div className="border border-slate-200 rounded-xl p-4 text-xs bg-slate-50/50">
                                    <p className="whitespace-pre-wrap leading-relaxed">{dJson.detalhes}</p>
                                </div>
                            </section>
                        )}

                        {/* Assinatura de Responsabilidade Jurídica */}
                        {secao && (
                            <section className="mb-6 avoid-break pt-4 border-t border-slate-200">
                                <div className="section-header">
                                    <span className="section-header-title">Responsabilidade pelo Preenchimento e Autenticação</span>
                                </div>
                                <table className="report-table">
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '30%', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Servidor Responsável</td>
                                            <td style={{ width: '70%', fontWeight: 'bold' }}>{secao.responsavel_preenchimento}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Cargo / Função</td>
                                            <td>{secao.cargo_funcao || 'Agente Setorial'}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Contato / E-mail</td>
                                            <td>{secao.email || 'Não informado'} {secao.telefone ? `• ${secao.telefone}` : ''}</td>
                                        </tr>
                                        {secao.data_envio && (
                                            <tr>
                                                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Data do Envio Eletrônico</td>
                                                <td className="font-mono text-[9px]">{new Date(secao.data_envio).toLocaleString('pt-BR')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* Evidências Fotográficas da Seção */}
                        {fotos.length > 0 && (
                            <section className="mb-6 avoid-break pt-4 border-t border-slate-200">
                                <div className="section-header">
                                    <span className="section-header-title">Anexo Fotográfico da Seção</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {fotos.map((foto, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between avoid-break">
                                            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                                                <img 
                                                    src={foto.url || foto.data} 
                                                    className="w-full h-full object-cover" 
                                                    alt={`Evidência ${idx + 1}`}
                                                />
                                            </div>
                                            <div className="mt-2 text-left">
                                                <p className="text-[10px] font-black text-slate-800">Figura {idx + 1}: Evidência do Desastre</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                                                    Seção {secaoId} • {targetSecretaria || 'Setorial'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Footer com selo oficial */}
                    <footer className="text-center font-bold text-[8px] text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-100 mt-8">
                        SIGERD • SISTEMA INTEGRADO DE GESTÃO E RELATÓRIOS DE DESASTRES
                        <br/><span className="text-[6.5px] font-medium text-slate-400/80 mt-1 block tracking-wider normal-case">* Os custos estimados de recuperação estrutural baseiam-se nos referenciais de preços oficiais (SINAPI, SICRO e DER-ES) cadastrados via Módulo MRCR, aplicados conforme tipologia informada.</span>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default RedapPrintSecao;
