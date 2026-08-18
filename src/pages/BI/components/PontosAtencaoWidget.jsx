import React, { useState } from 'react';
import { AlertCircle, ChevronRight, ShieldAlert, MapPin, Calendar, User, X } from 'lucide-react';

export default function PontosAtencaoWidget({ pontos = [], onItemClick }) {
  const [showModal, setShowModal] = useState(false);

  if (!pontos) return null;

  const topPontos = pontos.slice(0, 5);

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  PONTOS QUE EXIGEM ATENÇÃO
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Prioridades Operacionais Críticas
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400">
              {pontos.length} Pontos
            </span>
          </div>

          <div className="space-y-2.5">
            {topPontos.map((p, idx) => (
              <div
                key={p.id || idx}
                onClick={() => onItemClick ? onItemClick(p) : null}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                    p.nivelCode === 'R4' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {p.nivelCode || 'R3'}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {p.codigo} — {p.localidade}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-xs">
                      {p.detalhe}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all text-center uppercase tracking-wider"
        >
          Ver Todos os {pontos.length} Pontos Críticos →
        </button>
      </div>

      {/* Modal com a listagem completa dos Pontos que Exigem Atenção */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert size={22} className="text-orange-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Lista Detalhada — Pontos que Exigem Atenção ({pontos.length})
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-3 pr-1">
              {pontos.map((p, idx) => (
                <div
                  key={p.id || idx}
                  onClick={() => {
                    if (onItemClick) onItemClick(p);
                    setShowModal(false);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        p.nivelCode === 'R4' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                      }`}>
                        {p.nivel}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {p.codigo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <MapPin size={14} className="text-blue-500" />
                      {p.localidade} — {p.endereco}
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {p.detalhe}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0">
                    <div className="flex items-center gap-1 justify-end font-bold text-slate-600 dark:text-slate-300">
                      <User size={12} /> {p.responsavel}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Calendar size={12} /> {new Date(p.data || Date.now()).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
