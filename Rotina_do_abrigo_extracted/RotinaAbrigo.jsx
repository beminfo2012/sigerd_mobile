import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, XCircle, Circle, Printer, Sparkles, Plus, X, Trash2, ScrollText,
} from "lucide-react";

/**
 * Seção "Rotina do Abrigo" para a tela de detalhe do Abrigo.
 * Card full-width, mesmo estilo dos demais (branco, rounded-2xl, título
 * em negrito com ícone). Duas abas internas: Grade Horária (checklist
 * do dia) e Regras de Convivência.
 */

const API_BASE = "/api";

async function apiGet(path) {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiDelete(path) {
  const r = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}

const CATEGORIA_LABEL = {
  alimentacao: "Alimentação", higiene: "Higiene", descanso: "Descanso",
  administrativo: "Administrativo", saude: "Saúde", recreacao: "Recreação",
  religioso: "Religioso", seguranca: "Segurança",
};

function formatHorario(item) {
  let h = item.horario_inicio.slice(0, 5);
  if (item.horario_fim) h += ` – ${item.horario_fim.slice(0, 5)}`;
  if (item.padrao_recorrencia === "intervalo_horas" && item.intervalo_horas) {
    h += ` (a cada ${item.intervalo_horas}h)`;
  }
  return h;
}

export default function RotinaAbrigo({ abrigoId }) {
  const [aba, setAba] = useState("rotina"); // 'rotina' | 'regras'
  const [itens, setItens] = useState([]);
  const [regras, setRegras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoItemAberto, setNovoItemAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [i, r] = await Promise.all([
        apiGet(`/abrigos/${abrigoId}/rotina`),
        apiGet(`/abrigos/${abrigoId}/regras-convivencia`),
      ]);
      setItens(i);
      setRegras(r);
    } finally {
      setCarregando(false);
    }
  }, [abrigoId]);

  useEffect(() => { carregar(); }, [carregar]);

  const aplicarModeloPadrao = async () => {
    await apiPost(`/abrigos/${abrigoId}/rotina/aplicar-modelo-padrao`, { codigos: null });
    await carregar();
  };

  const aplicarRegrasPadrao = async () => {
    await apiPost(`/abrigos/${abrigoId}/regras-convivencia/aplicar-padrao`);
    await carregar();
  };

  const confirmar = async (itemId, statusNovo) => {
    await apiPost(`/abrigos/rotina/${itemId}/confirmar`, { status: statusNovo });
    await carregar();
  };

  const imprimirMural = () => {
    window.open(`${API_BASE}/abrigos/${abrigoId}/rotina/mural-impressao`, "_blank");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h2 className="text-base font-bold text-slate-800">Rotina do Abrigo</h2>
        </div>
        <div className="flex gap-2">
          <TabButton ativo={aba === "rotina"} onClick={() => setAba("rotina")}>Grade Horária</TabButton>
          <TabButton ativo={aba === "regras"} onClick={() => setAba("regras")}>Regras de Convivência</TabButton>
          <button onClick={imprimirMural}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            <Printer className="h-3.5 w-3.5" /> Imprimir Mural
          </button>
        </div>
      </header>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : aba === "rotina" ? (
        <>
          {itens.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm italic text-slate-400">
                Este abrigo ainda não tem rotina de funcionamento definida.
              </p>
              <button onClick={aplicarModeloPadrao}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                <Sparkles className="h-4 w-4" /> Aplicar Modelo Padrão (Doutrina)
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="mr-2 font-mono text-blue-700">{formatHorario(item)}</span>
                      {item.atividade}
                    </p>
                    <p className="text-xs text-slate-400">
                      {CATEGORIA_LABEL[item.categoria] || item.categoria}
                      {item.observacao ? ` — ${item.observacao}` : ""}
                    </p>
                  </div>
                  <StatusExecucao
                    execucao={item.execucao_hoje}
                    onConfirmar={(s) => confirmar(item.id, s)}
                  />
                </div>
              ))}
              <button onClick={() => setNovoItemAberto(true)}
                      className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600">
                <Plus className="h-4 w-4" /> Adicionar item de rotina
              </button>
            </div>
          )}
        </>
      ) : (
        <RegrasConvivencia
          abrigoId={abrigoId}
          regras={regras}
          onAplicarPadrao={aplicarRegrasPadrao}
          onRecarregar={carregar}
        />
      )}

      {novoItemAberto && (
        <ModalNovoItemRotina
          abrigoId={abrigoId}
          onClose={() => setNovoItemAberto(false)}
          onCriado={async () => { setNovoItemAberto(false); await carregar(); }}
        />
      )}
    </section>
  );
}

function TabButton({ ativo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
        ativo ? "bg-slate-800 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function StatusExecucao({ execucao, onConfirmar }) {
  const status = execucao?.status || "pendente";
  if (status === "realizada") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-4 w-4" /> Cumprida hoje
      </span>
    );
  }
  if (status === "nao_realizada") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
        <XCircle className="h-4 w-4" /> Não cumprida
      </span>
    );
  }
  return (
    <div className="flex gap-1">
      <button onClick={() => onConfirmar("realizada")}
              title="Marcar como cumprida"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button onClick={() => onConfirmar("nao_realizada")}
              title="Marcar como não cumprida"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
        <XCircle className="h-4 w-4" />
      </button>
      <Circle className="h-4 w-4 self-center text-slate-300" />
    </div>
  );
}

function RegrasConvivencia({ abrigoId, regras, onAplicarPadrao, onRecarregar }) {
  const [novaRegra, setNovaRegra] = useState("");

  const adicionar = async () => {
    if (!novaRegra.trim()) return;
    await apiPost(`/abrigos/${abrigoId}/regras-convivencia`, { texto_regra: novaRegra, ordem: regras.length });
    setNovaRegra("");
    onRecarregar();
  };

  const remover = async (id) => {
    await apiDelete(`/abrigos/regras-convivencia/${id}`);
    onRecarregar();
  };

  return (
    <div>
      {regras.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm italic text-slate-400">Nenhuma regra de convivência cadastrada.</p>
          <button onClick={onAplicarPadrao}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <ScrollText className="h-4 w-4" /> Aplicar Regras Padrão (Doutrina)
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {regras.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-700">{r.texto_regra}</p>
              <button onClick={() => remover(r.id)} className="shrink-0 text-slate-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Nova regra de convivência..."
          value={novaRegra}
          onChange={(e) => setNovaRegra(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <button onClick={adicionar} className="btn-primario">Adicionar</button>
      </div>
    </div>
  );
}

function ModalNovoItemRotina({ abrigoId, onClose, onCriado }) {
  const [form, setForm] = useState({
    atividade: "", categoria: "administrativo", horario_inicio: "08:00", horario_fim: "",
    observacao: "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await apiPost(`/abrigos/${abrigoId}/rotina`, {
        ...form,
        horario_fim: form.horario_fim || null,
        padrao_recorrencia: "horario_fixo",
      });
      onCriado();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Novo Item de Rotina</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Atividade
            <input className="input" value={form.atividade} onChange={set("atividade")} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Categoria
            <select className="input" value={form.categoria} onChange={set("categoria")}>
              {Object.entries(CATEGORIA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Horário início
            <input className="input" type="time" value={form.horario_inicio} onChange={set("horario_inicio")} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Horário fim
            <input className="input" type="time" value={form.horario_fim} onChange={set("horario_fim")} />
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Observação
            <textarea className="input" rows={2} value={form.observacao} onChange={set("observacao")} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secundario">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primario">
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
