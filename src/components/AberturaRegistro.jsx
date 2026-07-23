import React, { useState } from "react";
import FissurometroAnalyzer from "./FissurometroAnalyzer";
import MarcadorQRModal from "./MarcadorQRModal";
import { Camera, QrCode, Check, ShieldCheck } from "lucide-react";
import { classificarAbertura, obterRotuloClassificacao } from "../services/classificacaoPatologia";

export default function AberturaRegistro({ registro, onValidar }) {
  const [aba, setAba] = useState("original");
  const [largura, setLargura] = useState(registro.largura_mm_medida ?? "");
  const [fotoAnotadaUrl, setFotoAnotadaUrl] = useState(registro.foto_anotada_url || null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const classificacaoAtual = largura ? classificarAbertura(largura) : registro.classificacao_patologia;

  const handleConfirmarMedicao = () => {
    onValidar(registro.id, largura, fotoAnotadaUrl);
  };

  return (
    <div className="max-w-sm mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <p className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Abertura {registro.codigo_ponto}</p>
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
        <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs uppercase text-neutral-500 dark:text-slate-400 font-bold">Medição (mm)</label>
              {classificacaoAtual && (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  {obterRotuloClassificacao(classificacaoAtual)}
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              value={largura}
              onChange={(e) => setLargura(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full text-sm font-mono font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              placeholder="0.00"
            />
        </div>

        <div className="flex gap-2">
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

        {classificacaoAtual && (
          <div className="text-xs bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-300 rounded-lg p-2.5">
            <b>{obterRotuloClassificacao(classificacaoAtual)}</b> (ref. IBAPE-MG)
            <p className="text-[10px] text-orange-700 dark:text-orange-400/80 mt-1 leading-tight">
              Classificação descritiva com base na abertura. Monitorar evolução periódica.
            </p>
          </div>
        )}

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
                  onValidar(registro.id, mm, anotadaBase64);
              }}
          />
      )}

      <MarcadorQRModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
}
