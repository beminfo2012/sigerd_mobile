import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Filter } from 'lucide-react';

export default function EvolucaoTemporalCharts({ monthlySeries = [], evolucaoRisco = [] }) {
  const [metricFilter, setMetricFilter] = useState('vistorias');
  const [periodo, setPeriodo] = useState('12m');

  if (!monthlySeries || monthlySeries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Evolução Temporal Interativa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <TrendingUp size={18} />
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                EVOLUÇÃO TEMPORAL ANALÍTICA
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Análise Histórica e Padrões de Recorrência
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Período */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[11px] font-bold">
              {['7d', '30d', '6m', '12m'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                    periodo === p
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Seletor de Métrica */}
            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="vistorias">Vistorias Técnicas</option>
              <option value="ocorrencias">Ocorrências</option>
              <option value="alertas">Alertas Emitidos</option>
              <option value="noprers">NOPRERs</option>
              <option value="R3">Apenas R3 (Alto)</option>
              <option value="R4">Apenas R4 (Muito Alto)</option>
            </select>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey={metricFilter} fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. EVOLUÇÃO DO NÍVEL DE RISCO (R1 - R4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <TrendingUp size={18} />
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                EVOLUÇÃO DO NÍVEL DE RISCO (R1 – R4)
              </h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Tendência de Aumento ou Redução de Risco no Município
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucaoRisco}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415520" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="R1 - Baixo" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="R2 - Médio" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
              <Area type="monotone" dataKey="R3 - Alto" stackId="1" stroke="#ea580c" fill="#ea580c" fillOpacity={0.6} />
              <Area type="monotone" dataKey="R4 - Muito Alto" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
