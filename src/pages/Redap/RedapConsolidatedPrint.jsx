import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, X } from 'lucide-react';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import { formatBRL } from '../../utils/redapModelsConfig';

/**
 * Relatório Consolidado Municipal REDAP (Seção 11 & RF12 do Manual).
 * Por padrão consolida SOMENTE relatórios APROVADOS, com opção explícita de prévia.
 */
const RedapConsolidatedPrint = () => {
    const { eventoId } = useParams();
    const [loading, setLoading] = useState(true);
    const [includePreview, setIncludePreview] = useState(false);
    const [event, setEvent] = useState(null);
    const [cons, setCons] = useState(null);

    const load = async (previewFlag) => {
        setLoading(true);
        const [events, data] = await Promise.all([
            redapService.getActiveEvents(),
            redapV3.getEventoConsolidado(eventoId, previewFlag),
        ]);
        const ev = (events || []).find(e => e.id === eventoId) || null;
        setEvent(ev);
        setCons(data);
        if (ev) document.title = `REDAP Consolidado - ${ev.nome_evento}`;
        setLoading(false);
    };

    useEffect(() => {
        load(includePreview);
    }, [eventoId, includePreview]);

    if (loading || !cons) return <div className="p-16 text-center text-xs font-bold">Consolidando relatórios...</div>;

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white p-6 print:p-0 text-slate-900 font-sans">
            <style>{`@media print { .no-print { display: none !important; } @page { margin: 14mm; size: A4; } }`}</style>

            <div className="no-print max-w-[210mm] mx-auto mb-4 flex flex-wrap justify-between items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-xl">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase">Consolidado Municipal REDAP</span>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includePreview}
                            onChange={(e) => setIncludePreview(e.target.checked)}
                            className="rounded accent-blue-500"
                        />
                        Incluir relatórios não aprovados (Prévia)
                    </label>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.close()} className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-bold flex items-center gap-1"><X size={14} /> Fechar</button>
                    <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-black flex items-center gap-1"><Printer size={14} /> Imprimir / PDF</button>
                </div>
            </div>

            <div className="max-w-[210mm] mx-auto bg-white p-10 print:p-0 shadow-xl print:shadow-none space-y-6 text-xs">
                <header className="border-b-2 border-[#0B1F3A] pb-4 flex items-center justify-between gap-4">
                    <img src="/logo_defesa_civil.png" alt="Defesa Civil" className="h-14 object-contain" />
                    <div className="text-center flex-1">
                        <div className="text-[11px] font-bold uppercase text-slate-600">Prefeitura Municipal de Santa Maria de Jetibá — ES</div>
                        <div className="text-sm font-black uppercase text-[#0B1F3A]">Relatório Consolidado Municipal — REDAP</div>
                        <div className="text-[10px] font-bold text-blue-700 uppercase mt-0.5">
                            {includePreview ? 'PRÉVIA (INCLUI RELATÓRIOS NÃO APROVADOS)' : 'CONSOLIDAÇÃO OFICIAL (SOMENTE RELATÓRIOS APROVADOS)'}
                        </div>
                    </div>
                    <img src="/logo_prefeitura.png" alt="Prefeitura" className="h-14 object-contain" />
                </header>

                {/* Resumo do Evento */}
                <section>
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                        <tbody>
                            <tr>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5 w-1/5">DESASTRE</td>
                                <td className="border border-slate-300 p-1.5 font-bold">{event?.nome_evento || '—'}</td>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5 w-1/5">COBRADE</td>
                                <td className="border border-slate-300 p-1.5">{event?.cobrade || '—'}</td>
                            </tr>
                            <tr>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">RELATÓRIOS</td>
                                <td className="border border-slate-300 p-1.5">{cons.relatoriosIncluidos.length} de {cons.relatoriosTotal} secretaria(s)</td>
                                <td className="border border-slate-300 bg-slate-50 font-bold p-1.5">GERADO EM</td>
                                <td className="border border-slate-300 p-1.5">{new Date().toLocaleString('pt-BR')}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Totais Consolidados */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">1. Quadro Resumo Financeiro Consolidado</h2>
                    <table className="w-full border-collapse border border-slate-300 text-center text-[11px]">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2">Danos Estimados</th>
                                <th className="border border-slate-300 p-2">Prejuízos Públicos</th>
                                <th className="border border-slate-300 p-2">Total Geral (Danos + Prejuízos)</th>
                                <th className="border border-slate-300 p-2">Despesas de Atuação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="font-black text-sm">
                                <td className="border border-slate-300 p-2">{formatBRL(cons.totais.totalValorDanos)}</td>
                                <td className="border border-slate-300 p-2">{formatBRL(cons.totais.totalValorPrejuizos)}</td>
                                <td className="border border-slate-300 p-2 text-blue-800">{formatBRL(cons.totais.totalGeral)}</td>
                                <td className="border border-slate-300 p-2 text-emerald-700">{formatBRL(cons.totais.totalValorDespesas)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                {/* Danos com Origem Setorial */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">2. Danos Consolidados por Origem Setorial ({cons.danos.length})</h2>
                    {cons.danos.length === 0 ? (
                        <p className="text-[11px] italic text-slate-500">Nenhum dado consolidado disponível (verifique se há relatórios aprovados).</p>
                    ) : (
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-1.5 text-left">Secretaria Origem</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Item</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Localidade</th>
                                    <th className="border border-slate-300 p-1.5 text-right">Valor Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cons.danos.map((d, i) => (
                                    <tr key={i}>
                                        <td className="border border-slate-300 p-1.5 font-bold">{d._origem.secretaria_nome}</td>
                                        <td className="border border-slate-300 p-1.5">{d.item}</td>
                                        <td className="border border-slate-300 p-1.5">{d.localidade || '—'}</td>
                                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatBRL(d.valor_estimado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* Prejuízos com Origem Setorial */}
                <section>
                    <h2 className="text-xs font-black uppercase text-[#0B1F3A] border-b border-slate-300 pb-1 mb-2">3. Prejuízos Econômicos Públicos ({cons.prejuizos.length})</h2>
                    {cons.prejuizos.length === 0 ? (
                        <p className="text-[11px] italic text-slate-500">Nenhum prejuízo consolidado.</p>
                    ) : (
                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-1.5 text-left">Secretaria Origem</th>
                                    <th className="border border-slate-300 p-1.5 text-left">Serviço Público</th>
                                    <th className="border border-slate-300 p-1.5 text-right">Valor Estimado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cons.prejuizos.map((p, i) => (
                                    <tr key={i}>
                                        <td className="border border-slate-300 p-1.5 font-bold">{p._origem.secretaria_nome}</td>
                                        <td className="border border-slate-300 p-1.5">{p.servico}</td>
                                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatBRL(p.valor_estimado)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <footer className="border-t border-slate-300 pt-3 text-center text-[9px] text-slate-500">
                    COMPDEC / SIGERD — Santa Maria de Jetibá/ES • Consolidação Municipal REDAP • Gerado em {new Date().toLocaleString('pt-BR')}
                </footer>
            </div>
        </div>
    );
};

export default RedapConsolidatedPrint;
