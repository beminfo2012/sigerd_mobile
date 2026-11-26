import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Clock, AlertTriangle, Users, DollarSign } from 'lucide-react';
import * as redapService from '../../services/redapService';
import * as redapV3 from '../../services/redapV3Service';
import { formatBRL } from '../../utils/redapModelsConfig';

const RedapIndicatorsPage = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalEventos: 0,
        totalRelatorios: 0,
        enviadosPct: 0,
        aprovados: 0,
        devolvidos: 0,
        totalValorDanos: 0,
        totalValorPrejuizos: 0,
        totalValorDespesas: 0,
        totalServidores: 0,
        porSecretaria: [],
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [events, allReports] = await Promise.all([
                    redapService.getActiveEvents(),
                    redapV3.getAllRelatorios(),
                ]);
                const active = (allReports || []).filter(r => r.status !== 'CANCELADO');
                const sent = active.filter(r => ['ENVIADO', 'EM_ANALISE', 'APROVADO'].includes(r.status)).length;
                const aprovados = active.filter(r => r.status === 'APROVADO').length;
                const devolvidos = active.filter(r => r.status === 'DEVOLVIDO').length;

                let totalValorDanos = 0;
                let totalValorPrejuizos = 0;
                let totalValorDespesas = 0;
                let totalServidores = 0;
                const secMap = new Map();

                const bundles = await Promise.all(active.map(r => redapV3.getRelatorioCompleto(r.id)));
                bundles.filter(Boolean).forEach(b => {
                    const vDanos = b.danos.reduce((a, d) => a + (Number(d.valor_estimado) || 0), 0);
                    const vPrej = b.prejuizos.reduce((a, p) => a + (Number(p.valor_estimado) || 0), 0);
                    const vDesp = b.despesas.reduce((a, d) => a + (Number(d.valor) || 0), 0);
                    const serv = b.equipes.reduce((a, e) => a + (parseInt(e.quantidade_servidores, 10) || 0), 0);

                    totalValorDanos += vDanos;
                    totalValorPrejuizos += vPrej;
                    totalValorDespesas += vDesp;
                    totalServidores += serv;

                    const key = b.report.secretaria_nome;
                    const cur = secMap.get(key) || { secretaria: key, relatorios: 0, aprovados: 0, valorTotal: 0, servidores: 0 };
                    cur.relatorios += 1;
                    if (b.report.status === 'APROVADO') cur.aprovados += 1;
                    cur.valorTotal += vDanos + vPrej;
                    cur.servidores += serv;
                    secMap.set(key, cur);
                });

                setMetrics({
                    totalEventos: (events || []).length,
                    totalRelatorios: active.length,
                    enviadosPct: active.length > 0 ? Math.round((sent / active.length) * 100) : 0,
                    aprovados,
                    devolvidos,
                    totalValorDanos,
                    totalValorPrejuizos,
                    totalValorDespesas,
                    totalServidores,
                    porSecretaria: Array.from(secMap.values()).sort((a, b) => b.valorTotal - a.valorTotal),
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Indicadores Gerenciais REDAP</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Consolidado de envio setorial, danos, prejuízos públicos e mobilização municipal (Seção 15 do Manual).
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-blue-600 mb-2"><BarChart3 size={20} /><span className="text-[10px] font-black uppercase">{metrics.totalRelatorios} relatórios</span></div>
                    <div className="text-3xl font-black">{metrics.enviadosPct}%</div>
                    <div className="text-[10px] font-black uppercase text-slate-400 mt-1">Secretarias que enviaram</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-emerald-600 mb-2"><CheckCircle2 size={20} /><span className="text-[10px] font-black uppercase">{metrics.devolvidos} devolvidos</span></div>
                    <div className="text-3xl font-black">{metrics.aprovados}</div>
                    <div className="text-[10px] font-black uppercase text-slate-400 mt-1">Relatórios Aprovados</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-amber-600 mb-2"><DollarSign size={20} /></div>
                    <div className="text-2xl font-black">{formatBRL(metrics.totalValorDanos + metrics.totalValorPrejuizos)}</div>
                    <div className="text-[10px] font-black uppercase text-slate-400 mt-1">Danos + Prejuízos Públicos</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-indigo-600 mb-2"><Users size={20} /></div>
                    <div className="text-3xl font-black">{metrics.totalServidores}</div>
                    <div className="text-[10px] font-black uppercase text-slate-400 mt-1">Servidores Mobilizados</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-sm font-black uppercase tracking-wider">Desempenho e Impacto por Secretaria</h2>
                </div>
                {metrics.porSecretaria.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400 italic">Nenhum relatório setorial registrado ainda.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="px-5 py-3 text-left font-black">Secretaria</th>
                                    <th className="px-5 py-3 text-center font-black">Relatórios</th>
                                    <th className="px-5 py-3 text-center font-black">Aprovados</th>
                                    <th className="px-5 py-3 text-center font-black">Servidores</th>
                                    <th className="px-5 py-3 text-right font-black">Danos + Prejuízos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {metrics.porSecretaria.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="px-5 py-3 font-bold">{row.secretaria}</td>
                                        <td className="px-5 py-3 text-center font-bold">{row.relatorios}</td>
                                        <td className="px-5 py-3 text-center font-bold text-emerald-600">{row.aprovados}</td>
                                        <td className="px-5 py-3 text-center font-bold">{row.servidores}</td>
                                        <td className="px-5 py-3 text-right font-black">{formatBRL(row.valorTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedapIndicatorsPage;
