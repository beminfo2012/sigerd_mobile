import React, { useState } from "react";

const ROTULO_CLASSIFICACAO = {
  fissura: "Fissura",
  trinca: "Trinca",
  rachadura: "Rachadura",
  fenda: "Fenda",
  brecha: "Brecha",
};

export default function AberturaRegistro({ registro, onValidar }) {
  const [aba, setAba] = useState("original");
  const [largura, setLargura] = useState(registro.largura_mm_medida ?? "");

  return (
    <div className="max-w-sm mx-auto border rounded-xl overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700">
      <div className="p-4 border-b dark:border-slate-700">
        <p className="text-xs text-neutral-500 dark:text-slate-400">Abertura {registro.codigo_ponto}</p>
        <h1 className="text-lg font-semibold dark:text-slate-200">{registro.localizacao_descricao}</h1>
      </div>

      <div className="flex gap-2 p-3">
        <button
          type="button"
          className={`flex-1 text-xs py-2 rounded-lg transition-colors ${aba === "original" ? "bg-neutral-900 text-white dark:bg-slate-700 dark:text-white" : "bg-neutral-100 text-neutral-700 dark:bg-slate-900 dark:text-slate-300"}`}
          onClick={() => setAba("original")}
        >
          Foto original
        </button>
        <button
          type="button"
          className={`flex-1 text-xs py-2 rounded-lg transition-colors ${aba === "anotada" ? "bg-neutral-900 text-white dark:bg-slate-700 dark:text-white" : "bg-neutral-100 text-neutral-700 dark:bg-slate-900 dark:text-slate-300"}`}
          onClick={() => setAba("anotada")}
        >
          Versão anotada
        </button>
      </div>

      <img
        src={aba === "original" ? (registro.foto_url || "https://via.placeholder.com/400x300?text=Sem+Foto") : (registro.foto_anotada_url || "https://via.placeholder.com/400x300?text=Sem+Anota%C3%A7%C3%A3o")}
        alt="Registro da abertura"
        className="w-full h-auto object-cover"
      />

      <div className="p-4 text-xs text-neutral-500 dark:text-slate-400 space-y-1 border-b dark:border-slate-700">
        <p>SHA-256: {registro.hash_sha256?.slice(0, 8) || "N/A"}...</p>
        <p>Data/hora: {registro.data_hora} &middot; fonte: {registro.fonte_data_hora}</p>
        {registro.latitude && <p>Geo: {registro.latitude}, {registro.longitude}</p>}
      </div>

      <div className="p-4 space-y-3">
        <div>
            <label className="text-xs uppercase text-neutral-500 dark:text-slate-400 font-semibold mb-1 block">Medição (mm)</label>
            <input
            type="number"
            step="0.1"
            value={largura}
            onChange={(e) => setLargura(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
            placeholder="0.0"
            />
        </div>
        <button
          type="button"
          onClick={() => onValidar(registro.id, largura)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors font-medium"
        >
          Confirmar medição
        </button>

        {registro.classificacao_patologia && (
          <div className="text-xs bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-300 rounded-lg px-3 py-3">
            <b>{ROTULO_CLASSIFICACAO[registro.classificacao_patologia] || registro.classificacao_patologia}</b>
            {" "}· ref. {registro.fonte_classificacao}
            <p className="text-[10px] text-orange-700 dark:text-orange-400/80 mt-1.5 leading-tight">
              Classificação descreve a largura medida — não define, por si só, o grau de risco.
            </p>
          </div>
        )}

        {registro.validado_por && (
          <p className="text-xs text-neutral-500 dark:text-slate-400">
            Validado por {registro.validado_por_nome} em {registro.validado_em}
          </p>
        )}
      </div>
    </div>
  );
}
