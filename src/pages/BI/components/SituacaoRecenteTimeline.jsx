import React from 'react';
import { Clock, Activity, AlertCircle, FileText, Ban, ShieldAlert } from 'lucide-react';

export default function SituacaoRecenteTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              SITUAÇÃO RECENTE (O QUE ESTÁ ACONTECENDO?)
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Linha do Tempo em Tempo Real dos Eventos no Município
            </p>
          </div>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {timeline.slice(0, 6).map((item) => (
            <div key={item.id} className="relative group">
              {/* Ponto na linha de tempo */}
              <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-sm" />

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.badgeBg}`}>
                      {item.tipo}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.titulo}
                    </h4>
                  </div>
                  <span className="text-[9px] font-medium text-slate-400 shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                  <strong className="text-slate-800 dark:text-slate-200">{item.localidade}:</strong> {item.descricao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
