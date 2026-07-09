import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Upload, Printer, Tag, X, Plus, Trash2 } from "lucide-react";
import { plantaBaixaService } from "../../services/plantaBaixaService";
import { supabase } from "../../services/supabase";
import toast from "react-hot-toast";
import { PdfAnnotator } from "./PdfAnnotator";

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const getColorForId = (id, catalogo) => {
  if (!catalogo || !id) return '#64748b';
  const index = catalogo.findIndex(c => c.id === id);
  return PALETTE[Math.max(0, index) % PALETTE.length];
};

export default function PlantaBaixaAbrigo({ abrigoId }) {
  const [planta, setPlanta] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [uploadAberto, setUploadAberto] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(false);
  const [userId, setUserId] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [p, c] = await Promise.all([
        plantaBaixaService.getPlantaAtiva(abrigoId),
        plantaBaixaService.getCatalogo(),
      ]);
      setPlanta(p);
      setCatalogo(c);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    } catch (err) {
      console.error("Erro ao carregar planta baixa", err);
      toast.error("Não foi possível carregar as informações da planta baixa.");
    } finally {
      setCarregando(false);
    }
  }, [abrigoId]);

  useEffect(() => { carregar(); }, [carregar]);

  const imprimir = () => {
    // Para simplificar, na versão frontend a "impressão" pode apenas abrir o PDF em nova guia,
    // ou no futuro ter uma rota React /abrigos/:id/planta-baixa/imprimir que constrói a tela.
    if (planta && planta.url_visualizacao) {
      window.open(planta.url_visualizacao, "_blank");
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#2a5299]" />
          <h2 className="text-lg font-bold text-slate-800">Planta Baixa</h2>
        </div>
        <div className="flex gap-2">
          {planta && (
            <>
              <button onClick={() => setLegendaAberta(true)}
                      className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                <Tag className="h-3.5 w-3.5" /> Divisões
              </button>
              <button onClick={imprimir}
                      className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                <Printer className="h-3.5 w-3.5" /> Abrir PDF
              </button>
            </>
          )}
          <button onClick={() => setUploadAberto(true)}
                  className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Upload className="h-3.5 w-3.5" /> {planta ? "Nova versão" : "Enviar planta"}
          </button>
        </div>
      </header>

      {carregando ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : !planta ? (
        <p className="text-sm italic text-slate-400 text-center py-4">
          Nenhuma planta baixa cadastrada para este abrigo.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 relative">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 relative">
              <PdfAnnotator 
                pdfUrl={planta.url_visualizacao}
                shapes={planta.areas_vinculadas.filter(v => v.coordenadas_json).map(v => ({
                  id: v.id,
                  type: v.coordenadas_json.points ? 'polygon' : 'rect',
                  points: v.coordenadas_json.points,
                  x: v.coordenadas_json.x,
                  y: v.coordenadas_json.y,
                  width: v.coordenadas_json.width,
                  height: v.coordenadas_json.height,
                  color: getColorForId(v.area_doutrina.id, catalogo),
                  label: v.identificador_planta || v.area_doutrina.nome
                }))}
                onShapesChange={() => {}}
                activeCategoryId={null}
                readOnly={true}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Versão {planta.versao} — enviada em{" "}
              {new Date(planta.data_upload).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Divisões nesta planta
            </h3>
            {planta.areas_vinculadas.length === 0 ? (
              <p className="text-sm italic text-slate-400">
                Nenhuma área vinculada ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {planta.areas_vinculadas.map((v) => (
                  <li key={v.id || v.area_doutrina.id} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">
                      {v.identificador_planta && (
                        <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
                          {v.identificador_planta}
                        </span>
                      )}
                      {v.area_doutrina.nome}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{v.area_doutrina.descricao_funcao}</p>
                    {v.observacao && <p className="mt-1 text-xs text-slate-400 italic">Obs: {v.observacao}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {uploadAberto && (
        <ModalUploadPlanta
          abrigoId={abrigoId}
          usuarioId={userId}
          onClose={() => setUploadAberto(false)}
          onEnviada={async () => { setUploadAberto(false); await carregar(); }}
        />
      )}
      {legendaAberta && planta && (
        <ModalEditarLegenda
          planta={planta}
          catalogo={catalogo}
          onClose={() => setLegendaAberta(false)}
          onSalvo={async () => { setLegendaAberta(false); await carregar(); }}
        />
      )}
    </section>
  );
}

function ModalUploadPlanta({ abrigoId, usuarioId, onClose, onEnviada }) {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  const enviar = async () => {
    const arquivo = inputRef.current?.files?.[0];
    if (!arquivo) { setErro("Selecione um arquivo PDF."); return; }
    if (arquivo.type !== "application/pdf") { setErro("O arquivo deve ser um PDF."); return; }

    setEnviando(true);
    setErro(null);
    try {
      await plantaBaixaService.uploadPlanta(abrigoId, arquivo, usuarioId);
      toast.success("Planta enviada com sucesso!");
      onEnviada();
    } catch (e) {
      console.error(e);
      setErro("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalShell titulo="Enviar Planta Baixa (PDF)" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500 leading-relaxed">
        Envie a prancha da planta baixa do abrigo em PDF. Se já existir uma
        planta cadastrada, a atual será arquivada automaticamente como versão
        anterior.
      </p>
      <input ref={inputRef} type="file" accept="application/pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
        <button onClick={enviar} disabled={enviando} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50">
          {enviando ? "Enviando..." : "Enviar Planta"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalEditarLegenda({ planta, catalogo, onClose, onSalvo }) {
  const [shapes, setShapes] = useState(
    planta.areas_vinculadas.filter(v => v.coordenadas_json).map(v => ({
      id: v.id,
      type: v.coordenadas_json.points ? 'polygon' : 'rect',
      points: v.coordenadas_json.points,
      x: v.coordenadas_json.x,
      y: v.coordenadas_json.y,
      width: v.coordenadas_json.width,
      height: v.coordenadas_json.height,
      color: getColorForId(v.area_doutrina.id, catalogo),
      categoryId: v.area_doutrina.id,
      label: v.identificador_planta || v.area_doutrina.nome
    }))
  );
  const [hoveredShapeId, setHoveredShapeId] = useState(null);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(catalogo[0]?.id || "");
  const [identificador, setIdentificador] = useState("");
  const [salvando, setSalvando] = useState(false);

  const activeCategory = catalogo.find(c => c.id === activeCategoryId);
  const activeColor = getColorForId(activeCategoryId, catalogo);

  const handleShapesChange = (newShapes) => {
    // When a new shape is drawn, set its label
    const updated = newShapes.map(s => {
      if(!s.label && s.categoryId === activeCategoryId) {
        return { ...s, label: identificador || activeCategory.nome };
      }
      return s;
    });
    setShapes(updated);
  };

  const atualizarNomeArea = (id, newName) => {
    setShapes(shapes.map(s => s.id === id ? { ...s, label: newName } : s));
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = shapes.map((s, idx) => ({
        area_doutrina_id: s.categoryId,
        identificador_planta: s.label,
        coordenadas_json: s.type === 'polygon' ? { type: 'polygon', points: s.points } : { x: s.x, y: s.y, width: s.width, height: s.height },
        ordem: idx
      }));
      await plantaBaixaService.atualizarAreasVinculadas(planta.id, payload);
      toast.success("Planta anotada com sucesso!");
      onSalvo();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar anotações.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-[95vw] max-w-none rounded-2xl bg-white flex flex-col shadow-2xl border border-slate-100 h-[95vh]">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Desenhar Legenda na Planta</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="w-full lg:w-80 p-4 border-r overflow-y-auto bg-slate-50 space-y-4">
            <p className="text-xs text-slate-500 mb-4">
              Selecione o tipo de área abaixo. Na planta, <strong>clique nos vértices</strong> da área para formar um polígono e dê <strong>DUPLO CLIQUE</strong> para fechar e salvar a marcação.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tipo de Área (Doutrina)</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1"
                  value={activeCategoryId}
                  onChange={(e) => setActiveCategoryId(e.target.value)}
                >
                  {catalogo.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Identificador (ex: Sala 4)</label>
                <input
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1"
                  placeholder="Deixe em branco para usar o nome"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg border flex items-center gap-3 bg-white">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeColor }}></div>
                <span className="text-sm font-semibold text-slate-700">Cor Ativa para Desenho</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                Áreas Desenhadas ({shapes.length})
              </h4>
              <ul className="space-y-2">
                {shapes.map(s => (
                  <li 
                    key={s.id} 
                    className={`flex flex-col gap-2 p-2 border rounded-lg shadow-sm text-xs cursor-pointer transition-colors ${selectedShapeId === s.id ? 'bg-blue-50 border-blue-300' : (hoveredShapeId === s.id ? 'bg-slate-100' : 'bg-white')}`}
                    onMouseEnter={() => setHoveredShapeId(s.id)}
                    onMouseLeave={() => setHoveredShapeId(null)}
                    onClick={() => setSelectedShapeId(s.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}></div>
                        <span className="font-semibold text-slate-700 truncate" title={s.label}>{s.label}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleShapesChange(shapes.filter(x => x.id !== s.id)); if(selectedShapeId === s.id) setSelectedShapeId(null); }} className="text-red-500 hover:text-red-700 p-1 bg-white rounded-md border border-transparent hover:border-red-200">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {selectedShapeId === s.id && (
                      <div className="pt-2 border-t border-slate-200/50 mt-1">
                        <input 
                          type="text" 
                          value={s.label} 
                          onChange={(e) => atualizarNomeArea(s.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded outline-none focus:border-blue-500"
                          placeholder="Nome da área..."
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-200 p-4 overflow-hidden flex items-center justify-center">
            <PdfAnnotator 
              pdfUrl={planta.url_visualizacao}
              shapes={shapes}
              onShapesChange={handleShapesChange}
              activeCategoryColor={activeColor}
              activeCategoryId={activeCategoryId}
              hoveredShapeId={hoveredShapeId}
              setHoveredShapeId={setHoveredShapeId}
              selectedShapeId={selectedShapeId}
              setSelectedShapeId={setSelectedShapeId}
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
            {salvando ? "Salvando..." : "Salvar Planta"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ titulo, onClose, children, largo = false }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`w-full ${largo ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">{titulo}</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
