import React from 'react';
import { Grid, ChevronRight } from 'lucide-react';

export default function MatrizTipologiaLocalidade({ matriz = [], onCellClick }) {
  if (!matriz || matriz.length === 0) return null;

  const tipologiaKeys = ['Estrutural', 'Geológico / Geotécnico', 'Hidrológico', 'Ambiental', 'Infraestrutura Urbana', 'Outros'];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Grid size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              MATRIZ DE INTELIGÊNCIA — TIPOLOGIA × LOCALIDADE
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Cruzamento Espacial entre Categoria de Risco e Território
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-3 px-3">Localidade</th>
              {tipologiaKeys.map(t => (
                <th key={t} className="py-3 px-3 text-center truncate max-w-[120px]">{t}</th>
              ))}
              <th className="py-3 px-3 text-center">Nível Predominante</th>
              <th className="py-3 px-3 text-center">Tendência</th>
              <th className="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
            {matriz.map((row) => (
              <tr key={row.localidade} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                  {row.localidade}
                </td>
                {tipologiaKeys.map(t => {
                  const val = row[t] || 0;
                  return (
                    <td
                      key={t}
                      onClick={() => val > 0 && onCellClick && onCellClick(row.localidade, t)}
                      className={`py-3 px-3 text-center font-bold ${
                        val > 0
                          ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-500/5 rounded-lg'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      {val > 0 ? val : '-'}
                    </td>
                  );
                })}
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    row.nivelPredominante.includes('R3') ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {row.nivelPredominante}
                  </span>
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                  {row.tendencia}
                </td>
                <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
