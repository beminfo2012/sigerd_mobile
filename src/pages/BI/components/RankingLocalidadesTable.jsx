import React, { useState } from 'react';
import { Award, ArrowUpDown, ExternalLink, ShieldAlert, ChevronRight } from 'lucide-react';

export default function RankingLocalidadesTable({ localities = [], onRowClick }) {
  const [sortField, setSortField] = useState('indiceCriticidade');
  const [sortAsc, setSortAsc] = useState(false);

  if (!localities || localities.length === 0) return null;

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedLocalities = [...localities].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Award size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              RANKING — LOCALIDADES MAIS CRÍTICAS
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Ordenado pelo Índice de Criticidade SIGERD (Escala 0 a 100)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-3 px-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('localidade')}>
                <div className="flex items-center gap-1">Localidade <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('indiceCriticidade')}>
                <div className="flex items-center justify-center gap-1">Índice Criticidade (0-100) <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('r4')}>
                <div className="flex items-center justify-center gap-1">R4 (Muito Alto) <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('r3')}>
                <div className="flex items-center justify-center gap-1">R3 (Alto) <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('interdicoes')}>
                <div className="flex items-center justify-center gap-1">Interdições Vigentes <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('alertas')}>
                <div className="flex items-center justify-center gap-1">Alertas <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-center cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('total')}>
                <div className="flex items-center justify-center gap-1">Total Registros <ArrowUpDown size={10} /></div>
              </th>
              <th className="py-3 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
            {sortedLocalities.map((loc) => (
              <tr
                key={loc.localidade}
                onClick={() => onRowClick && onRowClick(loc)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: loc.cor }} />
                  {loc.localidade}
                </td>
                <td className="py-3.5 px-3 text-center font-black">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full transition-all" style={{ width: `${loc.indiceCriticidade}%`, backgroundColor: loc.cor }} />
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black text-white" style={{ backgroundColor: loc.cor }}>
                      {loc.indiceCriticidade} — {loc.nivelDesc}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-red-600 dark:text-red-400">
                  {loc.r4 > 0 ? loc.r4 : '-'}
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-orange-600 dark:text-orange-400">
                  {loc.r3 > 0 ? loc.r3 : '-'}
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                  {loc.interdicoes > 0 ? loc.interdicoes : '-'}
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-amber-500">
                  {loc.alertas > 0 ? loc.alertas : '-'}
                </td>
                <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                  {loc.total}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <span className="p-1 rounded-lg text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 inline-block transition-transform group-hover:translate-x-1">
                    <ChevronRight size={16} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
