import React, { useState } from 'react';
import { BellRing, Ban, CheckCircle2, Clock, MapPin, ExternalLink, ShieldAlert, Filter } from 'lucide-react';

export default function AlertasInterdicoesPanel({ alertas = [], interdicoes = [], onItemClick }) {
  const [alertaFiltro, setAlertaFiltro] = useState('TODOS');

  const filteredAlertas = alertas.filter(a => {
    if (alertaFiltro === 'CRITICOS') return a.nivel.includes('ALERTA') || a.nivel.includes('PERIGO') || a.nivel.includes('EMERGÊNCIA');
    if (alertaFiltro === 'ATIVOS') return a.status === 'ATIVO';
    if (alertaFiltro === 'ENCERRADOS') return a.status === 'ENCERRADO';
    return true;
  });

  const interdicoesVigentes = interdicoes.filter(i => {
    const st = String(i.status_interdicao || i.status || '').toLowerCase();
    return !st.includes('desinterdit');
  });

  const interdicoesEncerradas = interdicoes.length - interdicoesVigentes.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Painel de Alertas Ativos */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <BellRing size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  PAINEL DE ALERTAS VIGENTES
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Alertas Meteorológicos e Hidrológicos Emitidos
                </p>
              </div>
            </div>

            {/* Filtros do Alerta */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-[10px] font-bold">
              {['TODOS', 'CRITICOS', 'ATIVOS'].map(f => (
                <button
                  key={f}
                  onClick={() => setAlertaFiltro(f)}
                  className={`px-2 py-1 rounded-lg uppercase transition-all ${
                    alertaFiltro === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {filteredAlertas.map(a => (
              <div
                key={a.id}
                onClick={() => onItemClick && onItemClick(a)}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      a.nivel.includes('PERIGO') || a.nivel.includes('ALERTA') ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-900'
                    }`}>
                      {a.origem} — {a.nivel}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{a.titulo}</h4>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    {new Date(a.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1.5">
                  <strong className="text-slate-800 dark:text-slate-200">{a.localidade}:</strong> {a.detalhes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Painel de Interdições */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  PAINEL DE INTERDIÇÕES
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Gestão de Processos de Embargo e Desinterdição
                </p>
              </div>
            </div>
          </div>

          {/* KPI Minis de Interdição */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-xl font-black text-purple-700 dark:text-purple-300">{interdicoesVigentes.length}</span>
              <p className="text-[9px] font-bold uppercase text-purple-600 dark:text-purple-400 mt-0.5">Vigentes</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{interdicoesEncerradas}</span>
              <p className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mt-0.5">Desinterditados</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center">
              <span className="text-xl font-black text-slate-900 dark:text-white">18 dias</span>
              <p className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">Tempo Médio</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {interdicoes.slice(0, 5).map(i => (
              <div
                key={i.id}
                onClick={() => onItemClick && onItemClick(i)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-purple-600 text-white">
                      {i.risco_tipo || 'Total'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {i.interdicao_id || `INT-${i.id}`} — {i.bairro || i.localidade}
                    </h4>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                    {i.endereco || i.motivo || 'Processo de Interdição formal em vigor.'}
                  </p>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1">
                  Ver Processo <ExternalLink size={12} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
