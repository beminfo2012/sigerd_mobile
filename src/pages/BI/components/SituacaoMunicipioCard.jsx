import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Shield, Settings, Info, SlidersHorizontal, X } from 'lucide-react';

export default function SituacaoMunicipioCard({ situacao, rules, onSaveRules }) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempRules, setTempRules] = useState(rules || {});

  if (!situacao) return null;

  const getIcon = () => {
    switch (situacao.estado) {
      case 'EMERGÊNCIA':
        return <ShieldAlert size={36} className="text-red-600 dark:text-red-400 animate-pulse" />;
      case 'ALERTA':
        return <AlertTriangle size={36} className="text-orange-600 dark:text-orange-400" />;
      case 'ATENÇÃO':
        return <Info size={36} className="text-amber-500 dark:text-amber-400" />;
      default:
        return <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (onSaveRules) onSaveRules(tempRules);
    setShowConfigModal(false);
  };

  return (
    <>
      <div className={`rounded-3xl p-6 border shadow-sm transition-all duration-300 relative overflow-hidden ${situacao.bg}`}>
        {/* Glow de fundo discreto */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-current opacity-[0.04] pointer-events-none blur-2xl" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-800">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Indicador de Inteligência Municipal
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${situacao.badgeBg}`}>
                  {situacao.estado}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
                SITUAÇÃO ATUAL DO MUNICÍPIO
              </h2>
              <p className="text-xs md:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200 mt-2 max-w-3xl">
                {situacao.justificativa}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setTempRules(rules || {});
              setShowConfigModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 shadow-sm active:scale-95 transition-all self-end md:self-auto"
            title="Configurar Regras de Gatilho da Situação"
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Configurar Regras</span>
          </button>
        </div>
      </div>

      {/* Modal de Configuração de Regras pelo Administrador */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Regras do Motor de Criticidade Municipal
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Mínimo de Vistorias R4 para EMERGÊNCIA:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempRules.emergenciaR4Min || 3}
                  onChange={e => setTempRules({ ...tempRules, emergenciaR4Min: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Mínimo de Vistorias R3/R4 para ALERTA:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tempRules.alertaR3R4Min || 2}
                  onChange={e => setTempRules({ ...tempRules, alertaR3R4Min: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Acumulado de Chuva 24h para ALERTA (mm):
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={tempRules.alertaChuva24hMin || 50}
                  onChange={e => setTempRules({ ...tempRules, alertaChuva24hMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  Salvar Regras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
