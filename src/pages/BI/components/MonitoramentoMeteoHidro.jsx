import React, { useState } from 'react';
import { CloudRain, Droplets, Wind, Thermometer, Waves, TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

export default function MonitoramentoMeteoHidro({ estacoesMeteo = [], estacoesHidro = [] }) {
  const [selectedEstacaoId, setSelectedEstacaoId] = useState(estacoesMeteo[0]?.id || 'est-1');

  const selectedMeteo = estacoesMeteo.find(e => e.id === selectedEstacaoId) || estacoesMeteo[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. MONITORAMENTO METEOROLÓGICO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CloudRain size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  MONITORAMENTO METEOROLÓGICO
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Estações Pluviométricas em Tempo Real
                </p>
              </div>
            </div>

            {/* Seletor de Estação */}
            {estacoesMeteo.length > 0 && (
              <select
                value={selectedEstacaoId}
                onChange={(e) => setSelectedEstacaoId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none max-w-[200px]"
              >
                {estacoesMeteo.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            )}
          </div>

          {selectedMeteo && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">
                    {selectedMeteo.nome}
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedMeteo.chuva24h} mm <span className="text-xs font-bold text-slate-500">acumulado 24h</span>
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase">
                  {selectedMeteo.status}
                </span>
              </div>

              {/* Grid de Horas Pluviométricas */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Chuva 1h</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedMeteo.chuva1h} mm</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Chuva 3h</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedMeteo.chuva3h} mm</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Chuva 6h</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedMeteo.chuva6h} mm</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  <span className="text-[9px] font-bold uppercase">Chuva 24h</span>
                  <p className="text-sm font-black mt-0.5">{selectedMeteo.chuva24h} mm</p>
                </div>
              </div>

              {/* Clima Geral */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                  <Thermometer size={16} className="text-orange-500" /> {selectedMeteo.temperatura}°C
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                  <Droplets size={16} className="text-blue-500" /> {selectedMeteo.umidade}% UR
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                  <Wind size={16} className="text-slate-400" /> {selectedMeteo.vento} km/h
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MONITORAMENTO HIDROLÓGICO DOS RIOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Waves size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                MONITORAMENTO DOS RIOS (HIDROLÓGICO)
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cotas Fluviométricas e Alerta de Inundação
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {estacoesHidro.map(h => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{h.rio}</h4>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{h.ponto}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                    h.tendencia === 'Subindo' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {h.tendencia === 'Subindo' ? <TrendingUp size={12} /> : <Minus size={12} />}
                    Tendência {h.tendencia}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{h.nivelAtual}m</span>
                  <span className="text-xs font-bold text-slate-400">Nível Atual</span>
                </div>

                {/* Régua Visual de Cotas */}
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>Normal ({h.nivelNormal}m)</span>
                    <span>Atenção ({h.nivelAtencao}m)</span>
                    <span>Alerta ({h.nivelAlerta}m)</span>
                    <span className="text-red-500">Crítico ({h.nivelCritico}m)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
                    <div className="h-full bg-amber-500" style={{ width: '30%' }} />
                    <div className="h-full bg-orange-500" style={{ width: '25%' }} />
                    <div className="h-full bg-red-600" style={{ width: '15%' }} />
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {h.statusDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
