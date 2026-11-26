import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, X } from 'lucide-react';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import { REDAP_REPORT_STATUS, formatBRL } from '../../utils/redapModelsConfig';

/**
 * Relatório Setorial REDAP para impressão / PDF (Seção 11 do Manual).
 */
const RedapSectorPrint = () => {
    const { relatorioId } = useParams();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [bundle, setBundle] = useState(null);

    useEffect(() => {
        const load = async () => {
            const data = await redapV3.getRelatorioCompleto(relatorioId);
            if (data?.report) {
                const events = await redapService.getActiveEvents();
                setEvent((events || []).find(e => e.id === data.report.evento_id) || null);
                setBundle(data);
                document.title = `REDAP Setorial - ${data.report.secretaria_nome}`;
            }
            setLoading(false);
        };
        load();
    }, [relatorioId]);

    if (loading) return <div className="p-16 text-center text-xs font-bold">Carregando documento...</div>;
    if (!bundle) return <div className="p-16 text-center text-xs font-bold text-rose-600">Relatório não encontrado.</div>;

    const { report, danos, prejuizos, equipes, recursos, despesas, anexos } = bundle;
    const st = REDAP_REPORT_STATUS[report.status] || REDAP_REPORT_STATUS.NAO_INICIADO;
    const totalDanos = danos.reduce((a, d) => a + (Number(d.valor_estimado) || 0), 0);
    const totalPrej = prejuizos.reduce((a, p) => a + (Number(p.valor_estimado) || 0), 0);
    const totalDesp = despesas.reduce((a, d) => a + (Number(d.valor) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white p-6 print:p-0 text-slate-900 font-sans">
            <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; size: A4; } }`}</style>

            <div className="no-print max-w-[210mm] mx-auto mb-4 flex justify-between items-center bg-slate-900 text-white px-5 py-3 rounded-xl">
                <span className="text-xs font-black uppercase">Relatório Setorial REDAP — Prévia de Impressão</span>
                <div className="flex gap-2">
                    <button onClick={() => window.close()} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold flex items-center gap-1"><X size={14} /> Fechar</button>
                    <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-blue-600 text-xs font-black flex items-center gap-1"><Printer size={14} /> Imprimir / Salvar PDF</button>
                </div>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white p-10 print:p-0 shadow-xl print:shadow-none space-y-6 text-xs">
                {/* Cabeçalho Oficial */}
                <header className="border-b-2 border-[#0B1F3A] pb-4 flex items-center justify-between gap-4">
                    <img src="/logo_defesa_civil.png" alt="Defesa Civil" className="h-14 object-contain" />
                    <div className="text-center flex-1">
                        <div className="text-[11px] font-bold uppercase text-slate-600">Prefeitura Municipal de Santa Maria de Jetibá — ES</div>
                        <div className="text-sm font-black uppercase text-[#0B1F3A]">Relatório Setorial de Danos e Prejuízos (REDAP)</div>
                        <div className="text-[10px] font-bold text-blue-700 uppercase mt-0.5">{report.secretaria_nome}</div>
                    </div>
                    <img src="/logo_prefeitura.png" alt="Prefeitura" className="h-14 object-contain" />
                </header>

                {/* Identificação */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">1. Identificação do Evento e do Relatório</h2>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                        <tbody>
                            <tr>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5 w-1/5">EVENTO</td>
                                <td className="border border-slate-300 p-1.5">{event?.nome_evento || '—'} ({event?.cobrade || '—'})</td>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5 w-1/5">STATUS</td>
                                <td className="border border-slate-300 p-1.5 font-bold">{st.label}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">SECRETARIA</td>
                                <td className="border border-slate-300 p-1.5">{report.secretaria_nome}</td>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">RESPONSÁVEL</td>
                                <td className="border border-slate-300 p-1.5">{report.responsavel_nome || '—'} {report.responsavel_cargo ? `(${report.responsavel_cargo})` : ''}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">MODELO / VERSÃO</td>
                                <td className="border border-slate-300 p-1.5">v{report.modelo_versao || 1}</td>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">EMISSÃO PDF</td>
                                <td className="border border-slate-300 p-1.5">{new Date().toLocaleString('pt-BR')}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Introdução */}
                {report.introducao_texto && (
                    <section>
                        <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">2. Introdução</h2>
                        <p className="whitespace-pre-line leading-relaxed text-[11px]">{report.introducao_texto}</p>
                    </section>
                )}

                {/* Danos */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">3. Danos Registrados (Total: {formatBRL(totalDanos)})</h2>
                    {danos.length === 0 ? (
                        <p className="text-[11px] italic text-slate-500">Sem danos registrados ou declarado como não aplicável.</p>
                    ) : (
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-1.5 text-left">Categoria</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Item</th>
                                    <th className="border border-slate-300 p-1.5 text-center">Qtd / Danif. / Destr.</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Localidade</th>
                                    <th className="border border-slate-300 p-1.5 text-right">Valor Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danos.map((d, i) => (
                                    <tr key={i}>
                                        <td className="border border-slate-300 p-1.5">{d.categoria || d.secao}</td>
                                        <td className="border border-slate-300 p-1.5 font-bold">{d.item}</td>
                                        <td className="border border-slate-300 p-1.5 text-center">
                                            {d.secao === 'DANOS_HUMANOS'
                                                ? (d.quantidade ?? '—')
                                                : `${d.quantidade_danificada ?? '—'} / ${d.quantidade_destruida ?? '—'}`}
                                        </td>
                                        <td className="border border-slate-300 p-1.5">{d.localidade || '—'}</td>
                                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatBRL(d.valor_estimado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* Prejuízos */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">4. Prejuízos Econômicos Públicos (Total: {formatBRL(totalPrej)})</h2>
                    {prejuizos.length === 0 ? (
                        <p className="text-[11px] italic text-slate-500">Sem prejuízos registrados ou declarado como não aplicável.</p>
                    ) : (
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-1.5 text-left">Serviço Público</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Descrição</th>
                                    <th className="border border-slate-300 p-1.5 text-right">Valor Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prejuizos.map((p, i) => (
                                    <tr key={i}>
                                        <td className="border border-slate-300 p-1.5 font-bold">{p.servico}</td>
                                        <td className="border border-slate-300 p-1.5">{p.descricao || '—'}</td>
                                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatBRL(p.valor_estimado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* Atuação do Órgão */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">
                        5. Atuação do Órgão (Despesas Realizadas: {formatBRL(totalDesp)})
                    </h2>
                    <div className="space-y-2 text-[10px]">
                        <div><strong>Equipes ({equipes.length}):</strong> {equipes.length === 0 ? 'Nenhum registro.' : equipes.map(e => `${e.tipo_acao} (${e.quantidade_servidores} serv.)`).join('; ')}</div>
                        <div><strong>Materiais / Equipamentos ({recursos.length}):</strong> {recursos.length === 0 ? 'Nenhum registro.' : recursos.map(r => `${r.nome} (${r.quantidade} ${r.unidade})`).join('; ')}</div>
                        <div><strong>Recursos Financeiros ({despesas.length}):</strong> {despesas.length === 0 ? 'Nenhum registro.' : despesas.map(d => `${d.tipo_despesa}: ${formatBRL(d.valor)} (${d.fonte})`).join('; ')}</div>
                    </div>
                </section>

                {/* Considerações Finais */}
                {report.consideracoes_texto && (
                    <section>
                        <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">6. Considerações Finais</h2>
                        <p className="whitespace-pre-line leading-relaxed text-[11px]">{report.consideracoes_texto}</p>
                    </section>
                )}

                {/* Fotos */}
                {anexos.length > 0 && (
                    <section>
                        <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">7. Relatório Fotográfico ({anexos.length})</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {anexos.map((a, i) => (
                                <div key={i} className="border border-slate-300 p-2 break-inside-avoid">
                                    {a.url_preview && <img src={a.url_preview} alt={a.descricao || 'Foto'} className="w-full h-40 object-cover mb-1.5" />}
                                    <div className="text-[10px] font-bold">{a.descricao || a.nome_arquivo}</div>
                                    <div className="text-[9px] text-slate-500">
                                        {a.data_foto ? new Date(a.data_foto).toLocaleDateString('pt-BR') : ''}
                                        {a.latitude ? ` • GPS: ${Number(a.latitude).toFixed(5)}, ${Number(a.longitude).toFixed(5)}` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <footer className="border-t border-slate-300 pt-3 text-center text-[9px] text-slate-500">
                    COMPDEC / SIGERD — Santa Maria de Jetibá/ES • Relatório Setorial ({report.secretaria_nome}) • Gerado em {new Date().toLocaleString('pt-BR')}
                </footer>
            </div>
        </div>
    );
};

export default RedapSectorPrint;
