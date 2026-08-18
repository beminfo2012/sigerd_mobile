import React from 'react';
import {
  ShieldCheck, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDownRight,
  ClipboardList, BellRing, Ban, FileCheck, MapPin, Activity
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function BiKpiCards({ kpis, onCardClick }) {
  if (!kpis) return null;

  // Mini dados para os micrográficos (sparklines)
  const sparklineData = [
    { v: 4 }, { v: 7 }, { v: 5 }, { v: 9 }, { v: 12 }, { v: 8 }, { v: 15 }
  ];

  const riskCards = [
    {
      key: 'R1',
      title: 'R1 — Risco Baixo',
      count: kpis.riscoR1 || 0,
      pct: kpis.pctR1 || 0,
      trend: kpis.trendR1 || '-2.1%',
      trendUp: false,
      color: '#10b981',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
      icon: <ShieldCheck size={22} className="text-emerald-500" />
    },
    {
      key: 'R2',
      title: 'R2 — Risco Médio',
      count: kpis.riscoR2 || 0,
      pct: kpis.pctR2 || 0,
      trend: kpis.trendR2 || '+1.5%',
      trendUp: true,
      color: '#f59e0b',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300',
      icon: <AlertTriangle size={22} className="text-amber-500" />
    },
    {
      key: 'R3',
      title: 'R3 — Risco Alto',
      count: kpis.riscoR3 || 0,
      pct: kpis.pctR3 || 0,
      trend: kpis.trendR3 || '+4.8%',
      trendUp: true,
      color: '#ea580c',
      bgColor: 'bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-300',
      icon: <ShieldAlert size={22} className="text-orange-500" />
    },
    {
      key: 'R4',
      title: 'R4 — Muito Alto / Iminente',
      count: kpis.riscoR4 || 0,
      pct: kpis.pctR4 || 0,
      trend: kpis.trendR4 || '0.0%',
      trendUp: kpis.riscoR4 > 0,
      color: '#dc2626',
      bgColor: 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300',
      icon: <ShieldAlert size={22} className="text-red-600 dark:text-red-400 animate-pulse" />
    }
  ];

  const generalCards = [
    {
      key: 'totalVistorias',
      title: 'Total de Vistorias',
      count: kpis.totalVistorias,
      subText: 'No período selecionado',
      icon: <ClipboardList size={18} className="text-blue-600 dark:text-blue-400" />
    },
    {
      key: 'ocorrencias',
      title: 'Ocorrências Abertas',
      count: kpis.ocorrenciasAbertas,
      subText: `${kpis.totalOcorrencias} totais registradas`,
      icon: <Activity size={18} className="text-pink-600 dark:text-pink-400" />
    },
    {
      key: 'interdicoes',
      title: 'Interdições Vigentes',
      count: kpis.interdicoesVigentes,
      subText: `${kpis.interdicoesTotais} totais aplicadas`,
      icon: <Ban size={18} className="text-purple-600 dark:text-purple-400" />
    },
    {
      key: 'noprer',
      title: 'NOPRER Emitidas',
      count: kpis.noprersEmitidas,
      subText: `${kpis.noprersPendentes || 0} pendentes de regularização`,
      icon: <FileCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
    },
    {
      key: 'alertas',
      title: 'Alertas Ativos',
      count: kpis.alertasAtivos,
      subText: 'Monitoramento contínuo',
      icon: <BellRing size={18} className="text-red-500" />
    },
    {
      key: 'localidades',
      title: 'Localidades Monitoradas',
      count: kpis.localidadesMonitoradas,
      subText: 'Mapeamento territorial',
      icon: <MapPin size={18} className="text-emerald-600 dark:text-emerald-400" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Risco R1 - R4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskCards.map(c => (
          <div
            key={c.key}
            onClick={() => onCardClick && onCardClick(c.key)}
            className={`p-5 rounded-3xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between`}
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {c.icon}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {c.title}
                  </span>
                </div>
                <span className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${c.trendUp ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                  {c.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {c.trend}
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-1">
                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {c.count}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {c.pct}% do total
                </span>
              </div>
            </div>

            {/* Sparkline Micrográfico */}
            <div className="h-8 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={c.color}
                    fill={c.color}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {generalCards.map(g => (
          <div
            key={g.key}
            onClick={() => onCardClick && onCardClick(g.key)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {g.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                {g.icon}
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {g.count}
              </div>
              <p className="text-[9px] font-medium text-slate-400 truncate mt-0.5">
                {g.subText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
