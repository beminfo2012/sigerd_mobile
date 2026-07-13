import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { MapPin, Plus, Search, ArrowLeft, Building, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

export default function PontosApoio() {
  const navigate = useNavigate();
  const [pontos, setPontos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [pontoGerenciamento, setPontoGerenciamento] = useState(null);
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    setCarregando(true);
    try {
      const { data: pontosApoio, error: errPontos } = await supabase
        .from("ponto_apoio_animal")
        .select("*")
        .order("nome", { ascending: true });

      if (errPontos) throw errPontos;

      // Calcular lotacao atual para cada ponto
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

      const pontosComLotacao = pontosApoio.map(p => ({
        ...p,
        ocupacao_atual: ocupacaoMap[p.id] || 0
      }));

      setPontos(pontosComLotacao);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar pontos de apoio");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const toggleAtivo = async (ponto) => {
    try {
      const { error } = await supabase
        .from("ponto_apoio_animal")
        .update({ ativo: !ponto.ativo })
        .eq("id", ponto.id);
      
      if (error) throw error;
      toast.success(ponto.ativo ? "Ponto inativado!" : "Ponto ativado!");
      carregar();
    } catch (e) {
      toast.error("Erro ao alterar status");
    }
  };

  const pontosFiltrados = pontos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (p.endereco && p.endereco.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-24 font-sans transition-colors duration-300 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/menu')}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm transition-all hover:text-indigo-600 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Pontos de Apoio Animal</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de locais</p>
          </div>
        </div>
        <button
          onClick={() => setCadastroAberto(true)}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 dark:shadow-none"
        >
          <Plus size={18} /> Novo Ponto
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-2xl border-none bg-white py-4 pl-12 pr-4 text-slate-800 shadow-sm outline-none ring-1 ring-slate-200 transition-all focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
          />
        </div>
      </div>

      {carregando ? (
        <p className="text-center text-slate-500 py-10 font-medium">Carregando locais...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pontosFiltrados.map(p => {
            const lotado = p.ocupacao_atual >= p.capacidade_maxima;
            const disponivel = p.capacidade_maxima - p.ocupacao_atual;

            return (
              <div key={p.id} className={`rounded-3xl border p-5 shadow-sm transition-all ${p.ativo ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800' : 'border-slate-200 bg-slate-100 opacity-60 dark:border-slate-700 dark:bg-slate-800'}`}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-xl p-2.5 ${p.ativo ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                      <Building size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{p.nome}</h3>
                  </div>
                  <button
                    onClick={() => toggleAtivo(p)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${p.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
                
                <p className="mb-4 flex items-start gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" /> 
                  {p.endereco || 'Endereço não informado'}
                </p>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/50 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocupação</p>
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                      {p.ocupacao_atual} <span className="text-sm font-medium text-slate-400">/ {p.capacidade_maxima}</span>
                    </p>
                  </div>
                  <div className={`rounded-xl px-3 py-1.5 text-xs font-bold ${lotado ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {lotado ? 'LOTADO' : `${disponivel} Vagas`}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    onClick={() => setPontoGerenciamento(p)}
                    className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
                  >
                    Gerenciar Animais ({p.ocupacao_atual})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cadastroAberto && (
        <ModalNovoPonto
          onClose={() => setCadastroAberto(false)}
          onSalvo={async () => {
            setCadastroAberto(false);
            carregar();
          }}
        />
      )}

      {pontoGerenciamento && (
        <ModalGerenciarAnimais
          ponto={pontoGerenciamento}
          onClose={() => setPontoGerenciamento(null)}
          onUpdated={() => carregar()}
        />
      )}
    </div>
  );
}

function ModalNovoPonto({ onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: "",
    tipo: "canil_municipal",
    endereco: "",
    capacidade_maxima: 10,
    telefone_contato: "",
    latitude: "",
    longitude: ""
  });
  const [salvando, setSalvando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const salvar = async () => {
    if (!form.nome || !form.capacidade_maxima) {
      toast.error("Nome e capacidade são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        capacidade_maxima: parseInt(form.capacidade_maxima, 10)
      };

      const { error } = await supabase.from("ponto_apoio_animal").insert(payload);
      if (error) throw error;
      toast.success("Ponto de apoio cadastrado!");
      onSalvo();
    } catch (e) {
      toast.error("Erro ao cadastrar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <h2 className="mb-6 text-xl font-black text-slate-800 dark:text-slate-100">Novo Ponto de Apoio</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Nome do Local
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.nome}
              onChange={set("nome")}
            />
          </label>
          
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Tipo
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.tipo}
              onChange={set("tipo")}
            >
              <option value="canil_municipal">Canil Municipal</option>
              <option value="clinica_veterinaria">Clínica Veterinária</option>
              <option value="ong">ONG / Associação</option>
              <option value="area_interna">Área Interna (Abrigo)</option>
              <option value="lar_temporario">Lar Temporário</option>
              <option value="outro">Outro</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Capacidade Máxima
            <input
              type="number"
              min="1"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.capacidade_maxima}
              onChange={set("capacidade_maxima")}
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Endereço Completo
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.endereco}
              onChange={set("endereco")}
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Telefone / Contato
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.telefone_contato}
              onChange={set("telefone_contato")}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Latitude (opcional)
            <input
              type="number" step="any"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.latitude}
              onChange={set("latitude")}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Longitude (opcional)
            <input
              type="number" step="any"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-normal dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              value={form.longitude}
              onChange={set("longitude")}
            />
          </label>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
          >
            {salvando ? "Salvando..." : "Salvar Ponto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalGerenciarAnimais({ ponto, onClose, onUpdated }) {
  const [animais, setAnimais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [animalParaDevolver, setAnimalParaDevolver] = useState(null);

  const carregarAnimais = async () => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('animal_encaminhamento')
        .select(`
          id,
          status,
          data_encaminhamento,
          animal:animal_id (
            id,
            nome,
            especie,
            raca,
            porte,
            tutor:tutor_pessoa_id ( full_name )
          )
        `)
        .eq('ponto_apoio_id', ponto.id)
        .eq('ativo', true)
        .in('status', ['encaminhado', 'no_local'])
        .order('data_encaminhamento', { ascending: false });

      if (error) throw error;
      setAnimais(data || []);
    } catch (err) {
      toast.error("Erro ao buscar animais.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAnimais();
  }, [ponto]);

  const devolverAoTutor = async () => {
    if (!animalParaDevolver) return;

    try {
      const { error } = await supabase
        .from('animal_encaminhamento')
        .update({
          status: 'devolvido_ao_tutor',
          data_devolucao_tutor: new Date().toISOString()
        })
        .eq('id', animalParaDevolver);

      if (error) throw error;
      toast.success("Animal devolvido com sucesso!");
      
      // Remove from list
      setAnimais(prev => prev.filter(a => a.id !== animalParaDevolver));
      onUpdated();
    } catch (err) {
      toast.error("Erro ao registrar devolução.");
      console.error(err);
    } finally {
      setAnimalParaDevolver(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
        
        <div className="flex items-start justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Gerenciar Animais</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{ponto.nome}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400">
            <Trash2 size={20} className="hidden" /> 
            <span className="font-bold">X</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {carregando ? (
            <p className="text-center text-slate-500 py-10">Carregando animais...</p>
          ) : animais.length === 0 ? (
            <div className="text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800">
              <p className="text-slate-500 font-medium">Nenhum animal encaminhado para este local no momento.</p>
            </div>
          ) : (
            animais.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                    {item.animal.nome}
                    <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase">
                      {item.animal.especie} {item.animal.porte ? `• ${item.animal.porte}` : ''}
                    </span>
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Tutor: <span className="text-slate-700 dark:text-slate-300 font-bold">{item.animal.tutor?.full_name || 'Desconhecido'}</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                    Encaminhado em {new Date(item.data_encaminhamento).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setAnimalParaDevolver(item.id)}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-xl transition-colors text-sm"
                >
                  Devolver ao Tutor
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={!!animalParaDevolver}
        onClose={() => setAnimalParaDevolver(null)}
        onConfirm={devolverAoTutor}
        title="Devolver ao Tutor?"
        message="Confirma que o animal foi devolvido ao tutor e está saindo deste ponto de apoio?"
        confirmText="Confirmar Devolução"
        cancelText="Cancelar"
        type="info"
      />
    </div>
  );
}
