import React from 'react';
import { FileCheck, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function NoprerInteligenciaPanel({ noprerCount = {}, reincidentes = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileCheck size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              INTELÍGÊNCIA SOBRE NOPRER (NOTIFICAÇÕES PRELIMINARES)
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Monitoramento de Notificações Técnicas e Risco Reincidente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distribuição por Risco NOPRER */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
            Distribuição de Grau de Risco
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <span className="text-[10px] block font-black">R1 - BAIXO</span>
              <span className="text-lg font-black">{noprerCount.R1 || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
              <span className="text-[10px] block font-black">R2 - MÉDIO</span>
              <span className="text-lg font-black">{noprerCount.R2 || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300">
              <span className="text-[10px] block font-black">R3 - ALTO</span>
              <span className="text-lg font-black">{noprerCount.R3 || 0}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300">
              <span className="text-[10px] block font-black">R4 - MUITO ALTO</span>
              <span className="text-lg font-black">{noprerCount.R4 || 0}</span>
            </div>
          </div>
        </div>

        {/* Locais com Risco Reincidente */}
        <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className="text-red-500 animate-spin-slow" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Localidades com Indicador de RISCO REINCIDENTE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reincidentes.length > 0 ? (
              reincidentes.map(r => (
                <div key={r.localidade} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{r.localidade}</h4>
                    <span className="text-[9px] font-black uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded mt-0.5 inline-block">
                      Reincidência Confirmada
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {r.totalNoprer} NOPRERs
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs font-medium text-slate-400 col-span-2 py-4 text-center">
                Sem localidades reincidentes registradas no período.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
