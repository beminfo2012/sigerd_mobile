import React, { useState } from "react";
import FissurometroAnalyzer from "./FissurometroAnalyzer";
import MarcadorQRModal from "./MarcadorQRModal";
import { Camera, QrCode, Check, ShieldCheck, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { classificarAbertura, obterRotuloClassificacao, analisarEvolucaoAbertura } from "../services/classificacaoPatologia";

export default function AberturaRegistro({ registro, onValidar }) {
  const [aba, setAba] = useState("original");
  const [largura, setLargura] = useState(registro.largura_mm_medida ?? "");
  const [larguraAnterior, setLarguraAnterior] = useState(registro.largura_anterior_mm ?? "");
  const [fotoAnotadaUrl, setFotoAnotadaUrl] = useState(registro.foto_anotada_url || null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const classificacaoAtual = largura ? classificarAbertura(largura) : registro.classificacao_patologia;
  const evolucao = (largura && larguraAnterior) ? analisarEvolucaoAbertura(largura, larguraAnterior) : null;

  const handleConfirmarMedicao = () => {
    onValidar(registro.id, largura, fotoAnotadaUrl, larguraAnterior);
  };

  return (
    <div className="max-w-sm mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Ponto {registro.codigo_ponto}</p>
          <h1 className="text-sm font-bold dark:text-slate-200 line-clamp-1">{registro.localizacao_descricao || "Ponto de Monitoramento"}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Ver/Imprimir Cartão QR de Referência"
        >
          <QrCode size={18} />
        </button>
      </div>

      <div className="flex gap-1 p-2 bg-slate-100 dark:bg-slate-900">
        <button
          type="button"
          className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-colors ${aba === "original" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400"}`}
          onClick={() => setAba("original")}
        >
          Foto original (SHA-256)
        </button>
        <button
          type="button"
          className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-colors ${aba === "anotada" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400"}`}
          onClick={() => setAba("anotada")}
        >
          Versão anotada {fotoAnotadaUrl ? "✓" : ""}
        </button>
      </div>

      <div className="relative bg-slate-900 aspect-video flex items-center justify-center overflow-hidden">
        <img
          src={aba === "original" ? (registro.foto_url || "https://via.placeholder.com/400x300?text=Sem+Foto") : (fotoAnotadaUrl || registro.foto_anotada_url || registro.foto_url || "https://via.placeholder.com/400x300?text=Sem+Anota%C3%A7%C3%A3o")}
          alt="Registro da abertura"
          className="w-full h-full object-contain"
        />
        {aba === "anotada" && !fotoAnotadaUrl && !registro.foto_anotada_url && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white text-xs">
            <p className="mb-2">Nenhuma versão anotada gerada ainda.</p>
            <button
              type="button"
              onClick={() => setShowAnalyzer(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5"
            >
              <Camera size={14} /> Abrir Fissurômetro 2
            </button>
          </div>
        )}
      </div>

      <div className="p-3 text-[11px] font-mono text-neutral-500 dark:text-slate-400 space-y-0.5 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
        <p>SHA-256: {registro.hash_sha256?.slice(0, 16) || "Pendente..."}</p>
        <p>Data: {registro.data_hora || new Date().toLocaleString('pt-BR')}</p>
        {registro.latitude && <p>Geo: {registro.latitude}, {registro.longitude}</p>}
      </div>

      <div className="p-4 space-y-3">
        {/* Medição Atual e Medição Anterior (Histórico de Abertura) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-neutral-500 dark:text-slate-400 font-bold mb-1 block">Leitura Anterior (mm)</label>
            <input
              type="number"
              step="0.01"
              value={larguraAnterior}
              onChange={(e) => setLarguraAnterior(e.target.value)}
              className="border rounded-lg px-2.5 py-1.5 w-full text-xs font-mono font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              placeholder="Ex: 1.50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-bold block">Leitura Atual (mm)</label>
            </div>
            <input
              type="number"
              step="0.01"
              value={largura}
              onChange={(e) => setLargura(e.target.value)}
              className="border-2 border-indigo-500 rounded-lg px-2.5 py-1.5 w-full text-xs font-mono font-bold dark:bg-slate-900 dark:border-indigo-500 dark:text-slate-100"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Badge da Classificação IBAPE-MG */}
        {classificacaoAtual && (
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-2 rounded-lg text-xs font-medium border dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Classificação IBAPE-MG:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {obterRotuloClassificacao(classificacaoAtual)}
            </span>
          </div>
        )}

        {/* Painel de Monitoramento de Evolução Estrutural (Abertura da Trinca/Fissura) */}
        {evolucao && (
          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
            evolucao.status === 'expansao' 
              ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300' 
              : evolucao.status === 'estavel' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300' 
                : 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Activity size={14} /> Monitoramento de Evolução
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 border border-current">
                {evolucao.rotulo}
              </span>
            </div>
            <p className="text-[11px] leading-tight font-medium">
              {evolucao.alerta}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmarMedicao}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm py-2.5 rounded-lg transition-colors font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check size={16} /> Confirmar Medição
            </button>
            <button
              type="button"
              onClick={() => setShowAnalyzer(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm py-2.5 px-3 rounded-lg transition-colors font-bold flex items-center justify-center gap-1.5 shadow-sm"
              title="Abrir Laboratório de Visão Computacional"
            >
              <Camera size={16} /> Lab V2
            </button>
        </div>

        {registro.validado_por && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
            <ShieldCheck size={16} className="shrink-0" />
            <span>Validado por <b>{registro.validado_por_nome || registro.validado_por}</b> em {registro.validado_em}</span>
          </div>
        )}
      </div>

      {showAnalyzer && (
          <FissurometroAnalyzer 
              fotoUrl={registro.foto_url}
              onCancel={() => setShowAnalyzer(false)}
              onComplete={(mm, anotadaBase64) => {
                  setLargura(mm);
                  setFotoAnotadaUrl(anotadaBase64);
                  setAba("anotada");
                  setShowAnalyzer(false);
                  onValidar(registro.id, mm, anotadaBase64, larguraAnterior);
              }}
          />
      )}

      <MarcadorQRModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
}
