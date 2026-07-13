import { useState, useEffect, useCallback } from "react";
import { PawPrint, Plus, X, MapPin, Syringe, ArrowRightCircle } from "lucide-react";

/**
 * Seção "Animais de Estimação" para a tela de detalhe do Abrigo — mesmo
 * estilo dos cards já existentes (branco, rounded-2xl). Encaixa bem ao
 * lado/abaixo do card "Pessoas Abrigadas" já visto na tela do abrigo.
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
async function apiPut(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const STATUS_LABEL = {
  aguardando_encaminhamento: { texto: "Aguardando encaminhamento", cor: "bg-amber-100 text-amber-700" },
  encaminhado: { texto: "Encaminhado", cor: "bg-blue-100 text-blue-700" },
  no_local: { texto: "No ponto de apoio", cor: "bg-emerald-100 text-emerald-700" },
  devolvido_ao_tutor: { texto: "De volta com o tutor", cor: "bg-slate-100 text-slate-600" },
  obito: { texto: "Óbito", cor: "bg-red-100 text-red-700" },
};

const ESPECIE_LABEL = { cao: "Cão", gato: "Gato", ave: "Ave", outro: "Outro" };

export default function AnimaisAbrigo({ abrigoId }) {
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [encaminharAnimal, setEncaminharAnimal] = useState(null); // animal selecionado p/ encaminhar

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setAnimais(await apiGet(`/abrigos/${abrigoId}/animais`));
    } finally {
      setCarregando(false);
    }
  }, [abrigoId]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint className="h-4 w-4 text-slate-500" />
          <h2 className="text-base font-bold text-slate-800">Animais de Estimação</h2>
        </div>
        <button onClick={() => setCadastroAberto(true)}
                className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5" /> Cadastrar Animal
        </button>
      </header>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : animais.length === 0 ? (
        <p className="text-sm italic text-slate-400">Nenhum animal cadastrado neste abrigo.</p>
      ) : (
        <ul className="space-y-2">
          {animais.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {a.nome} <span className="font-normal text-slate-400">— {ESPECIE_LABEL[a.especie]}{a.raca ? `, ${a.raca}` : ""}</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {a.vacinado_antirrabica ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <Syringe className="h-3 w-3" /> Vacinado (antirrábica)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Syringe className="h-3 w-3" /> Sem confirmação de vacina
                    </span>
                  )}
                  {a.encaminhamento_ativo && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_LABEL[a.encaminhamento_ativo.status]?.cor}`}>
                      {STATUS_LABEL[a.encaminhamento_ativo.status]?.texto} — {a.encaminhamento_ativo.ponto_apoio_nome}
                      {a.encaminhamento_ativo.distancia_km_no_momento != null &&
                        ` (${a.encaminhamento_ativo.distancia_km_no_momento} km do tutor)`}
                    </span>
                  )}
                </div>
              </div>
              {!a.encaminhamento_ativo && (
                <button onClick={() => setEncaminharAnimal(a)}
                        className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <ArrowRightCircle className="h-3.5 w-3.5" /> Encaminhar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cadastroAberto && (
        <ModalCadastrarAnimal
          abrigoId={abrigoId}
          onClose={() => setCadastroAberto(false)}
          onCadastrado={async () => { setCadastroAberto(false); await carregar(); }}
        />
      )}
      {encaminharAnimal && (
        <ModalEncaminharAnimal
          animal={encaminharAnimal}
          onClose={() => setEncaminharAnimal(null)}
          onEncaminhado={async () => { setEncaminharAnimal(null); await carregar(); }}
        />
      )}
    </section>
  );
}

function ModalCadastrarAnimal({ abrigoId, onClose, onCadastrado }) {
  const [form, setForm] = useState({
    tutor_pessoa_id: "", nome: "", especie: "cao", raca: "", porte: "medio",
    vacinado_antirrabica: false, temperamento_observacoes: "", condicao_saude_observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const set = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const salvar = async () => {
    if (!form.tutor_pessoa_id || !form.nome) {
      setErro("Informe ao menos o tutor e o nome do animal.");
      return;
    }
    setSalvando(true);
    try {
      await apiPost(`/abrigos/${abrigoId}/animais`, form);
      onCadastrado();
    } catch {
      setErro("Não foi possível cadastrar o animal.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalShell titulo="Cadastrar Animal de Estimação" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Tutor (pessoa abrigada) — ID/matrícula
          <input className="input" value={form.tutor_pessoa_id} onChange={set("tutor_pessoa_id")}
                 placeholder="Selecionar da lista de abrigados" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Nome do animal
          <input className="input" value={form.nome} onChange={set("nome")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Espécie
          <select className="input" value={form.especie} onChange={set("especie")}>
            <option value="cao">Cão</option>
            <option value="gato">Gato</option>
            <option value="ave">Ave</option>
            <option value="outro">Outro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Raça
          <input className="input" value={form.raca} onChange={set("raca")} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Porte
          <select className="input" value={form.porte} onChange={set("porte")}>
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <input type="checkbox" checked={form.vacinado_antirrabica} onChange={set("vacinado_antirrabica")} />
          Vacina antirrábica confirmada
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Temperamento / observações
          <textarea className="input" rows={2} value={form.temperamento_observacoes}
                     onChange={set("temperamento_observacoes")}
                     placeholder="Ex.: dócil, medroso, reativo a outros animais..." />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs font-semibold text-slate-500">
          Condição de saúde
          <textarea className="input" rows={2} value={form.condicao_saude_observacoes}
                     onChange={set("condicao_saude_observacoes")} />
        </label>
      </div>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn-secundario">Cancelar</button>
        <button onClick={salvar} disabled={salvando} className="btn-primario">
          {salvando ? "Salvando..." : "Cadastrar"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalEncaminharAnimal({ animal, onClose, onEncaminhado }) {
  const [pontos, setPontos] = useState([]);
  const [referenciaOrigem, setReferenciaOrigem] = useState(null);
  const [ignorarProximidade, setIgnorarProximidade] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregarSugestoes = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await apiGet(
        `/abrigos/animais/${animal.id}/pontos-sugeridos?ignorar_proximidade=${ignorarProximidade}`
      );
      setPontos(resultado.itens);
      setReferenciaOrigem(resultado.referencia_origem);
    } finally {
      setCarregando(false);
    }
  }, [animal.id, ignorarProximidade]);

  useEffect(() => { carregarSugestoes(); }, [carregarSugestoes]);

  const escolher = async (pontoId) => {
    setEnviando(true);
    try {
      await apiPost(`/abrigos/animais/${animal.id}/encaminhar`, {
        ponto_apoio_id: pontoId, ignorar_proximidade: ignorarProximidade,
      });
      onEncaminhado();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell titulo={`Encaminhar ${animal.nome}`} onClose={onClose} largo>
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={ignorarProximidade}
          onChange={(e) => setIgnorarProximidade(e.target.checked)}
        />
        Ignorar proximidade com o tutor — listar todos os pontos, sem calcular distância
      </label>

      {!ignorarProximidade && referenciaOrigem === "indisponivel" && (
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          Não há endereço geocodificado do tutor nem do abrigo — a lista abaixo está
          sem ordenação por distância.
        </p>
      )}
      {!ignorarProximidade && referenciaOrigem === "abrigo" && (
        <p className="mb-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
          Endereço do tutor não disponível — a distância foi calculada a partir do
          próprio abrigo, como aproximação.
        </p>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando pontos de apoio...</p>
      ) : pontos.length === 0 ? (
        <p className="text-sm italic text-slate-400">Nenhum ponto de apoio com vaga disponível no momento.</p>
      ) : (
        <ul className="space-y-2">
          {pontos.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.nome}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {p.endereco}
                  {p.distancia_km != null && ` — ${p.distancia_km} km do tutor`}
                </p>
                <p className="text-xs text-slate-400">
                  {p.vagas_disponiveis} vaga(s) de {p.capacidade_maxima}
                </p>
              </div>
              <button onClick={() => escolher(p.id)} disabled={enviando} className="btn-primario">
                Encaminhar aqui
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-end">
        <button onClick={onClose} className="btn-secundario">Fechar</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ titulo, onClose, children, largo = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={`w-full ${largo ? "max-w-xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">{titulo}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
