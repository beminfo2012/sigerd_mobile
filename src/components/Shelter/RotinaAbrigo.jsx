import { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, XCircle, Circle, Printer, Sparkles, Plus, X, Trash2, ScrollText, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { supabase } from "../../services/supabase";

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

export default function RotinaAbrigo({ abrigoId, operacaoId, dataAbertura, dataAberturaOperacao }) {
  const [aba, setAba] = useState("rotina"); // 'rotina' | 'regras'
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);
  const [itens, setItens] = useState([]);
  const [regras, setRegras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoItemAberto, setNovoItemAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      
      const [itensRes, regrasRes] = await Promise.all([
        supabase.from("abrigo_rotina_item").select("*").eq("abrigo_id", abrigoId).order("horario_inicio"),
        supabase.from("abrigo_regra_convivencia").select("*").eq("abrigo_id", abrigoId).order("ordem")
      ]);
      
      const rotinas = itensRes.data || [];
      const rotinaIds = rotinas.map(r => r.id);
      
      let execucoesMap = {};
      if (rotinaIds.length > 0) {
        const { data: execucoes } = await supabase
          .from("abrigo_rotina_execucao")
          .select("*")
          .eq("data_referencia", dataReferencia)
          .in("rotina_item_id", rotinaIds);
          
        (execucoes || []).forEach(e => {
            execucoesMap[e.rotina_item_id] = e;
        });
      }

      setItens(rotinas.map(r => ({ ...r, execucao_hoje: execucoesMap[r.id] })));
      setRegras(regrasRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  }, [abrigoId, dataReferencia]);

  useEffect(() => { carregar(); }, [carregar]);

  const aplicarModeloPadrao = async () => {
    try {
      const { data: catalogo } = await supabase.from('catalogo_rotina_padrao_abrigo').select('*').order('ordem_padrao');
      if (!catalogo) return;
      const novasRotinas = catalogo.map(c => ({
          abrigo_id: abrigoId,
          atividade: c.atividade,
          categoria: c.categoria,
          horario_inicio: c.horario_sugerido_inicio,
          horario_fim: c.horario_sugerido_fim,
          padrao_recorrencia: c.padrao_recorrencia,
          intervalo_horas: c.intervalo_horas,
          observacao: c.descricao,
          ordem: c.ordem_padrao
      }));
      await supabase.from('abrigo_rotina_item').insert(novasRotinas);
      await carregar();
    } catch (e) {
      console.error(e);
    }
  };

  const aplicarRegrasPadrao = async () => {
    try {
      const { data: catalogo } = await supabase.from('catalogo_regra_convivencia_padrao').select('*').order('ordem_padrao');
      if (!catalogo) return;
      const novasRegras = catalogo.map(c => ({
          abrigo_id: abrigoId,
          texto_regra: c.texto_regra,
          ordem: c.ordem_padrao
      }));
      await supabase.from('abrigo_regra_convivencia').insert(novasRegras);
      await carregar();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmar = async (itemId, statusNovo) => {
    try {
      const { data: existing } = await supabase.from('abrigo_rotina_execucao')
        .select('id').eq('rotina_item_id', itemId).eq('data_referencia', dataReferencia).maybeSingle();
      
      if (existing) {
          await supabase.from('abrigo_rotina_execucao').update({ 
            status: statusNovo, 
            data_hora_confirmacao: new Date().toISOString(),
            operacao_id: operacaoId || null
          }).eq('id', existing.id);
      } else {
          await supabase.from('abrigo_rotina_execucao').insert({ 
            rotina_item_id: itemId, 
            data_referencia: dataReferencia, 
            status: statusNovo, 
            data_hora_confirmacao: new Date().toISOString(),
            operacao_id: operacaoId || null
          });
      }
      await carregar();
    } catch (e) {
      console.error(e);
    }
  };

  const imprimirMural = () => {
    window.open(`/assisthumanitaria/${abrigoId}/rotina/imprimir`, '_blank');
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const changeDate = (days) => {
    const d = new Date(dataReferencia);
    // Add timezone offset to prevent date shifting
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    d.setDate(d.getDate() + days);
    
    let limitDateStr = null;
    if (dataAberturaOperacao && dataAbertura) {
      limitDateStr = new Date(dataAberturaOperacao) > new Date(dataAbertura) ? dataAberturaOperacao : dataAbertura;
    } else {
      limitDateStr = dataAberturaOperacao || dataAbertura;
    }
    
    if (limitDateStr) {
      const minDateStr = limitDateStr.split('T')[0];
      const minDate = new Date(minDateStr);
      minDate.setMinutes(minDate.getMinutes() + minDate.getTimezoneOffset());
      if (d < minDate) {
        return; // Prevent going before limit opening
      }
    }
    
    setDataReferencia(d.toISOString().split('T')[0]);
  };

  const getLimitDateStr = () => {
    let limitDateStr = null;
    if (dataAberturaOperacao && dataAbertura) {
      limitDateStr = new Date(dataAberturaOperacao) > new Date(dataAbertura) ? dataAberturaOperacao : dataAbertura;
    } else {
      limitDateStr = dataAberturaOperacao || dataAbertura;
    }
    return limitDateStr ? limitDateStr.split('T')[0] : null;
  };

  const isBeforeOpening = () => {
    const limitDateStr = getLimitDateStr();
    if (!limitDateStr) return false;
    
    const current = new Date(dataReferencia);
    current.setMinutes(current.getMinutes() + current.getTimezoneOffset());
    
    const minDateStr = limitDateStr.split('T')[0];
    const minDate = new Date(minDateStr);
    minDate.setMinutes(minDate.getMinutes() + minDate.getTimezoneOffset());
    
    return current <= minDate;
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2a5299]" />
            <h2 className="text-lg font-bold text-slate-800">Rotina do Abrigo</h2>
          </div>
          {aba === "rotina" && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 w-fit mt-1">
              <button 
                onClick={() => changeDate(-1)}
                disabled={isBeforeOpening()}
                className={`p-1 rounded-md transition-colors ${isBeforeOpening() ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                title="Dia anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 relative">
                <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-2 pointer-events-none" />
                <input 
                  type="date"
                  min={getLimitDateStr() || undefined}
                  value={dataReferencia}
                  onChange={(e) => setDataReferencia(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 pl-6 cursor-pointer focus:outline-none focus:ring-0 w-[110px]"
                />
              </div>
              <button 
                onClick={() => changeDate(1)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                title="Próximo dia"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <TabButton ativo={aba === "rotina"} onClick={() => setAba("rotina")}>Grade Horária</TabButton>
          <TabButton ativo={aba === "regras"} onClick={() => setAba("regras")}>Regras de Convivência</TabButton>
          <button onClick={imprimirMural}
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
            <Printer className="h-3.5 w-3.5" /> Imprimir Mural
          </button>
        </div>
      </header>

      {carregando ? (
        <p className="text-sm text-slate-400 py-4 text-center">Carregando...</p>
      ) : aba === "rotina" ? (
        <>
          {itens.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm italic text-slate-400">
                Este abrigo ainda não tem rotina de funcionamento definida.
              </p>
              <button onClick={aplicarModeloPadrao}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                <Sparkles className="h-4 w-4" /> Aplicar Modelo Padrão (Doutrina)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      <span className="mr-2 font-mono text-blue-700">{formatHorario(item)}</span>
                      {item.atividade}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
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
                      className="mt-3 flex items-center justify-center w-full gap-1 text-sm font-bold text-[#2a5299] p-3 rounded-xl border border-dashed border-blue-200 hover:bg-blue-50 transition-colors">
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
      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
        ativo ? "bg-slate-800 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
        <CheckCircle2 className="h-4 w-4" /> Cumprida hoje
      </span>
    );
  }
  if (status === "nao_realizada") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
        <XCircle className="h-4 w-4" /> Não cumprida
      </span>
    );
  }
  return (
    <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
      <button onClick={() => onConfirmar("realizada")}
              title="Marcar como cumprida"
              className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
        <CheckCircle2 className="h-4 w-4" />
      </button>
      <button onClick={() => onConfirmar("nao_realizada")}
              title="Marcar como não cumprida"
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}

function RegrasConvivencia({ abrigoId, regras, onAplicarPadrao, onRecarregar }) {
  const [novaRegra, setNovaRegra] = useState("");

  const adicionar = async () => {
    if (!novaRegra.trim()) return;
    try {
      await supabase.from("abrigo_regra_convivencia").insert({ 
        abrigo_id: abrigoId, 
        texto_regra: novaRegra, 
        ordem: regras.length 
      });
      setNovaRegra("");
      onRecarregar();
    } catch (e) { console.error(e); }
  };

  const remover = async (id) => {
    try {
      await supabase.from("abrigo_regra_convivencia").delete().eq("id", id);
      onRecarregar();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      {regras.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm italic text-slate-400">Nenhuma regra de convivência cadastrada.</p>
          <button onClick={onAplicarPadrao}
                  className="flex items-center gap-2 rounded-xl bg-[#2a5299] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            <ScrollText className="h-4 w-4" /> Aplicar Regras Padrão (Doutrina)
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {regras.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2 rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <p className="text-sm text-slate-700 leading-relaxed">{r.texto_regra}</p>
              <button onClick={() => remover(r.id)} className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299]"
          placeholder="Nova regra de convivência..."
          value={novaRegra}
          onChange={(e) => setNovaRegra(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
        />
        <button onClick={adicionar} className="rounded-xl bg-[#2a5299] px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 transition-colors">Adicionar</button>
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
      await supabase.from("abrigo_rotina_item").insert({
        abrigo_id: abrigoId,
        ...form,
        horario_fim: form.horario_fim || null,
        padrao_recorrencia: "horario_fixo",
      });
      onCriado();
    } catch(e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Novo Item de Rotina</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Atividade
            <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299] font-normal" value={form.atividade} onChange={set("atividade")} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Categoria
            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299] font-normal" value={form.categoria} onChange={set("categoria")}>
              {Object.entries(CATEGORIA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <div className="col-span-1 hidden"></div>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Horário Início
            <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299] font-normal" type="time" value={form.horario_inicio} onChange={set("horario_inicio")} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Horário Fim <span className="text-slate-400 lowercase font-normal">(Opcional)</span>
            <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299] font-normal" type="time" value={form.horario_fim} onChange={set("horario_fim")} />
          </label>
          <label className="col-span-2 flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Observação
            <textarea className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2a5299] focus:outline-none focus:ring-1 focus:ring-[#2a5299] font-normal resize-none" rows={2} value={form.observacao} onChange={set("observacao")} />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="flex-1 rounded-xl bg-[#2a5299] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 transition-colors">
            {salvando ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
