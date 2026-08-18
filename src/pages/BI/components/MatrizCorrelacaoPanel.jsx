import React from 'react';
import { Network, ArrowRight, CloudRain, ShieldAlert } from 'lucide-react';

export default function MatrizCorrelacaoPanel({ matrix = [] }) {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Network size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              MATRIZ DE CORRELAÇÃO DE FATORES DE RISCO
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Relação Cruzada entre Precipitação Pluviométrica, Ocorrências e Escorregamentos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matrix.map((item) => (
          <div
            key={item.localidade}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  {item.localidade}
                </h4>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm"
                  style={{ backgroundColor: item.corCorrelacao }}
                >
                  Correlação {item.nivelCorrelacao}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center my-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Chuva 24h</span>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">{item.chuva24h} mm</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Vistorias R3/R4</span>
                  <p className="text-xs font-black text-orange-600 dark:text-orange-400 mt-0.5">{item.vistoriasCriticas}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Ocorr. Geológicas</span>
                  <p className="text-xs font-black text-red-600 dark:text-red-400 mt-0.5">{item.ocorrenciasGeologicas}</p>
                </div>
              </div>

              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-800 dark:text-slate-200">Análise Automática:</strong> {item.explicacao}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
