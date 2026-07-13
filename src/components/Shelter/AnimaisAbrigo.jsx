import { useState, useEffect, useCallback } from "react";
import { PawPrint, Plus, X, MapPin, Syringe, ArrowRightCircle, Search } from "lucide-react";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";

const STATUS_LABEL = {
  aguardando_encaminhamento: { texto: "Aguardando encaminhamento", cor: "bg-amber-100 text-amber-700" },
  encaminhado: { texto: "Encaminhado", cor: "bg-blue-100 text-blue-700" },
  no_local: { texto: "No ponto de apoio", cor: "bg-emerald-100 text-emerald-700" },
  devolvido_ao_tutor: { texto: "De volta com o tutor", cor: "bg-slate-100 text-slate-600" },
  obito: { texto: "Óbito", cor: "bg-red-100 text-red-700" },
};

const ESPECIE_LABEL = { cao: "Cão", gato: "Gato", ave: "Ave", outro: "Outro" };

// Haversine formula for distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export default function AnimaisAbrigo({ abrigoId, abrigoInfo }) {
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [encaminharAnimal, setEncaminharAnimal] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      // Get all active animals
      const { data: animaisData, error: errAnimais } = await supabase
        .from("animal_estimacao")
        .select(`
          *,
          tutor:tutor_pessoa_id(id, full_name),
          encaminhamentos:animal_encaminhamento(
            *,
            ponto_apoio:ponto_apoio_id(*)
          )
        `)
        .eq("abrigo_humano_id", abrigoId)
        .eq("ativo", true)
        .order("created_at", { ascending: true });

      if (errAnimais) throw errAnimais;

      // Map and find active encaminhamento
      const formattedAnimais = (animaisData || []).map((a) => {
        const encaminhamento_ativo = a.encaminhamentos?.find((e) => e.ativo);
        let encaminhamentoFormatado = null;
        if (encaminhamento_ativo) {
          encaminhamentoFormatado = {
            id: encaminhamento_ativo.id,
            status: encaminhamento_ativo.status,
            ponto_apoio_nome: encaminhamento_ativo.ponto_apoio?.nome || "Desconhecido",
            distancia_km_no_momento: encaminhamento_ativo.distancia_km_no_momento,
          };
        }
        return {
          ...a,
          encaminhamento_ativo: encaminhamentoFormatado,
        };
      });

      setAnimais(formattedAnimais);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar animais.");
    } finally {
      setCarregando(false);
    }
  }, [abrigoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Animais de Estimação</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHistoricoAberto(true)}
            className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Histórico Completo
          </button>
          <button
            onClick={() => setCadastroAberto(true)}
            className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Cadastrar Animal
          </button>
        </div>
      </header>

      {carregando ? (
        <p className="text-sm text-slate-400 py-4">Carregando...</p>
      ) : animais.filter(a => !a.encaminhamento_ativo || !['devolvido_ao_tutor', 'obito'].includes(a.encaminhamento_ativo.status)).length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6">
          <p className="text-sm italic text-slate-400">Nenhum animal ativo cadastrado neste abrigo.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {animais.filter(a => !a.encaminhamento_ativo || !['devolvido_ao_tutor', 'obito'].includes(a.encaminhamento_ativo.status)).map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {a.nome}{" "}
                  <span className="font-normal text-slate-500">
                    — {ESPECIE_LABEL[a.especie] || a.especie}
                    {a.raca ? `, ${a.raca}` : ""}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Tutor: {a.tutor?.full_name || "Desconhecido"}</span>
                  <span className="text-slate-300">•</span>
                  {a.vacinado_antirrabica ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <Syringe className="h-3.5 w-3.5" /> Vacinado (antirrábica)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <Syringe className="h-3.5 w-3.5" /> Sem confirmação de vacina
                    </span>
                  )}
                  {a.encaminhamento_ativo && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          STATUS_LABEL[a.encaminhamento_ativo.status]?.cor
                        }`}
                      >
                        {STATUS_LABEL[a.encaminhamento_ativo.status]?.texto} —{" "}
                        {a.encaminhamento_ativo.ponto_apoio_nome}
                        {a.encaminhamento_ativo.distancia_km_no_momento != null &&
                          ` (${a.encaminhamento_ativo.distancia_km_no_momento} km do tutor)`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {!a.encaminhamento_ativo && (
                <button
                  onClick={() => setEncaminharAnimal(a)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
                >
                  <ArrowRightCircle className="h-4 w-4" /> Encaminhar
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
          onCadastrado={async () => {
            setCadastroAberto(false);
            await carregar();
          }}
        />
      )}
      {encaminharAnimal && (
        <ModalEncaminharAnimal
          animal={encaminharAnimal}
          abrigoInfo={abrigoInfo}
          onClose={() => setEncaminharAnimal(null)}
          onEncaminhado={async () => {
            setEncaminharAnimal(null);
            await carregar();
          }}
        />
      )}
      {historicoAberto && (
        <ModalHistoricoAnimais
          animais={animais}
          onClose={() => setHistoricoAberto(false)}
        />
      )}
    </section>
  );
}

function ModalHistoricoAnimais({ animais, onClose }) {
  const [busca, setBusca] = useState("");

  const animaisFiltrados = animais.filter(a => 
    a.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (a.tutor?.full_name || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800">Histórico de Animais</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Todos os animais registrados no abrigo</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 bg-slate-100 text-slate-500 hover:bg-slate-200">
            <span className="font-bold">X</span>
          </button>
        </div>

        <div className="mb-4 shrink-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome do animal ou tutor..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {animaisFiltrados.length === 0 ? (
            <p className="text-center text-slate-500 py-10">Nenhum animal encontrado.</p>
          ) : (
            <ul className="space-y-3">
              {animaisFiltrados.map(a => {
                const isActive = !a.encaminhamento_ativo || !['devolvido_ao_tutor', 'obito'].includes(a.encaminhamento_ativo.status);
                
                return (
                  <li key={a.id} className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-xl p-4 border ${isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-75'}`}>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {a.nome} <span className="font-normal text-slate-500">— {ESPECIE_LABEL[a.especie] || a.especie}</span>
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        Tutor: {a.tutor?.full_name || "Desconhecido"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        Registrado em {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      {a.encaminhamento_ativo ? (
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider block ${STATUS_LABEL[a.encaminhamento_ativo.status]?.cor}`}>
                          {STATUS_LABEL[a.encaminhamento_ativo.status]?.texto}
                        </span>
                      ) : (
                        <span className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider block bg-slate-100 text-slate-600">
                          No Abrigo (Sem encaminhamento)
                        </span>
                      )}
                      
                      {a.encaminhamento_ativo?.ponto_apoio_nome && (
                        <span className="text-[10px] font-medium text-slate-500 mt-1 block max-w-[200px] truncate" title={a.encaminhamento_ativo.ponto_apoio_nome}>
                          📍 {a.encaminhamento_ativo.ponto_apoio_nome}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalCadastrarAnimal({ abrigoId, onClose, onCadastrado }) {
  const [form, setForm] = useState({
    tutor_pessoa_id: "",
    nome: "",
    especie: "cao",
    raca: "",
    porte: "medio",
    vacinado_antirrabica: false,
    temperamento_observacoes: "",
    condicao_saude_observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [tutores, setTutores] = useState([]);
  
  useEffect(() => {
    async function loadTutores() {
      const { data } = await supabase
        .from('shelter_occupants')
        .select('id, full_name')
        .eq('shelter_id', abrigoId)
        .order('full_name');
      if (data) setTutores(data);
    }
    loadTutores();
  }, [abrigoId]);

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
      const { error } = await supabase.from("animal_estimacao").insert({
        abrigo_humano_id: abrigoId,
        ...form
      });
      if (error) throw error;
      toast.success("Animal cadastrado!");
      onCadastrado();
    } catch (e) {
      setErro("Não foi possível cadastrar o animal.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalShell titulo="Cadastrar Animal de Estimação" onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Tutor (pessoa abrigada)
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
            value={form.tutor_pessoa_id}
            onChange={set("tutor_pessoa_id")}
          >
            <option value="">Selecione o tutor...</option>
            {tutores.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Nome do animal
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
            value={form.nome}
            onChange={set("nome")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Espécie
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
            value={form.especie}
            onChange={set("especie")}
          >
            <option value="cao">Cão</option>
            <option value="gato">Gato</option>
            <option value="ave">Ave</option>
            <option value="outro">Outro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Raça <span className="text-slate-400 lowercase font-normal">(Opcional)</span>
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
            value={form.raca}
            onChange={set("raca")}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Porte
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
            value={form.porte}
            onChange={set("porte")}
          >
            <option value="pequeno">Pequeno</option>
            <option value="medio">Médio</option>
            <option value="grande">Grande</option>
          </select>
        </label>
        <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            checked={form.vacinado_antirrabica}
            onChange={set("vacinado_antirrabica")}
          />
          Vacina antirrábica confirmada
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Temperamento / observações
          <textarea
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal resize-none"
            rows={2}
            value={form.temperamento_observacoes}
            onChange={set("temperamento_observacoes")}
            placeholder="Ex.: dócil, medroso, reativo a outros animais..."
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          Condição de saúde
          <textarea
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal resize-none"
            rows={2}
            value={form.condicao_saude_observacoes}
            onChange={set("condicao_saude_observacoes")}
            placeholder="Ex.: Necessita medicação contínua..."
          />
        </label>
      </div>
      {erro && <p className="mt-4 text-sm font-bold text-red-600 text-center">{erro}</p>}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
        >
          {salvando ? "Salvando..." : "Cadastrar Animal"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalEncaminharAnimal({ animal, abrigoInfo, onClose, onEncaminhado }) {
  const [pontos, setPontos] = useState([]);
  const [referenciaOrigem, setReferenciaOrigem] = useState(null);
  const [ignorarProximidade, setIgnorarProximidade] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregarSugestoes = useCallback(async () => {
    setCarregando(true);
    try {
      // Obter todos os pontos ativos
      const { data: pontosApoio, error: errPontos } = await supabase
        .from("ponto_apoio_animal")
        .select("*")
        .eq("ativo", true);

      if (errPontos) throw errPontos;

      // Obter ocupação de todos os pontos (animais encaminhados ou no local)
      const { data: encaminhamentosAbertos, error: errEnc } = await supabase
        .from("animal_encaminhamento")
        .select("ponto_apoio_id")
        .eq("ativo", true)
        .in("status", ["encaminhado", "no_local"]);
        
      if (errEnc) throw errEnc;

      const ocupacaoMap = {};
      (encaminhamentosAbertos || []).forEach(e => {
        ocupacaoMap[e.ponto_apoio_id] = (ocupacaoMap[e.ponto_apoio_id] || 0) + 1;
      });

      // Calcular a localização base
      let latRef = null;
      let lonRef = null;
      let origem = "indisponivel";

      if (!ignorarProximidade) {
        if (abrigoInfo?.latitude && abrigoInfo?.longitude) {
          latRef = parseFloat(abrigoInfo.latitude);
          lonRef = parseFloat(abrigoInfo.longitude);
          origem = "abrigo";
        }
      } else {
        origem = "ignorado_pelo_operador";
      }

      setReferenciaOrigem(origem);

      // Calcular vagas e distâncias
      let result = pontosApoio.map(p => {
        const ocupacao_atual = ocupacaoMap[p.id] || 0;
        const vagas_disponiveis = p.capacidade_maxima - ocupacao_atual;
        let distancia_km = null;

        if (origem !== "indisponivel" && origem !== "ignorado_pelo_operador") {
          distancia_km = calculateDistance(latRef, lonRef, parseFloat(p.latitude), parseFloat(p.longitude));
        }

        return {
          ...p,
          ocupacao_atual,
          vagas_disponiveis,
          distancia_km
        };
      });

      // Filtrar apenas com vagas
      result = result.filter(p => p.vagas_disponiveis > 0);

      // Ordenar por distância ou por nome
      if (origem !== "indisponivel" && origem !== "ignorado_pelo_operador") {
        result.sort((a, b) => (a.distancia_km || 999999) - (b.distancia_km || 999999));
      } else {
        result.sort((a, b) => a.nome.localeCompare(b.nome));
      }

      setPontos(result);
    } catch(e) {
        console.error(e);
        toast.error("Erro ao carregar pontos de apoio.");
    } finally {
      setCarregando(false);
    }
  }, [animal, abrigoInfo, ignorarProximidade]);

  useEffect(() => {
    carregarSugestoes();
  }, [carregarSugestoes]);

  const escolher = async (p) => {
    setEnviando(true);
    try {
      // Criar encaminhamento
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const { error } = await supabase.from("animal_encaminhamento").insert({
        animal_id: animal.id,
        ponto_apoio_id: p.id,
        distancia_km_no_momento: p.distancia_km,
        status: "encaminhado",
        usuario_responsavel_id: userId
      });
      if (error) throw error;
      toast.success(`Animal encaminhado para ${p.nome}!`);
      onEncaminhado();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao encaminhar animal.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell titulo={`Encaminhar ${animal.nome}`} onClose={onClose} largo>
      <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          checked={ignorarProximidade}
          onChange={(e) => setIgnorarProximidade(e.target.checked)}
        />
        Ignorar proximidade com o tutor (lista em ordem alfabética)
      </label>

      {!ignorarProximidade && referenciaOrigem === "indisponivel" && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200 flex items-start gap-2">
           <Search className="h-5 w-5 shrink-0" />
           Não há endereço geocodificado do tutor nem do abrigo — a lista abaixo não está ordenada por distância.
        </p>
      )}
      {!ignorarProximidade && referenciaOrigem === "abrigo" && (
        <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200 flex items-start gap-2">
          <MapPin className="h-5 w-5 shrink-0" />
          Endereço do tutor indisponível. Usando a localização deste abrigo como aproximação para a distância.
        </p>
      )}

      {carregando ? (
        <p className="text-sm text-slate-400 py-4 text-center">Buscando vagas nos pontos de apoio...</p>
      ) : pontos.length === 0 ? (
        <p className="text-sm font-semibold text-slate-400 py-6 text-center">Nenhum ponto de apoio com vaga disponível no momento.</p>
      ) : (
        <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {pontos.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <div>
                <p className="text-base font-bold text-slate-800">{p.nome}</p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p.endereco}
                  {p.distancia_km != null && <span className="text-indigo-600 font-bold ml-1">— {p.distancia_km} km de distância</span>}
                </p>
                <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                  {p.vagas_disponiveis} vaga(s) disponível(is)
                </p>
              </div>
              <button
                onClick={() => escolher(p)}
                disabled={enviando}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm ml-4"
              >
                <ArrowRightCircle className="h-4 w-4" /> 
                {enviando ? "Aguarde..." : "Encaminhar"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
          Fechar
        </button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ titulo, onClose, children, largo = false }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`w-full ${largo ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-2xl border border-slate-100`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">{titulo}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
