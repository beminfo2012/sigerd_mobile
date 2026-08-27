import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck, 
  Info, 
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { nortisCrawlerService } from '../../services/nortisCrawlerService';

export default function NortisRevisaoRapida() {
  const navigate = useNavigate();
  const [fila, setFila] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRelevancia, setFiltroRelevancia] = useState('TODOS');
  const [termoBusca, setTermoBusca] = useState('');
  const [executandoVarredura, setExecutandoVarredura] = useState(false);

  // Estados dos Modais
  const [docParaDescarte, setDocParaDescarte] = useState(null);
  const [motivoDescarte, setMotivoDescarte] = useState('Não relevante');
  const [obsDescarte, setObsDescarte] = useState('');

  const [docParaEdicao, setDocParaEdicao] = useState(null);
  const [formDataEdit, setFormDataEdit] = useState({});

  const [docParaConfirmacao, setDocParaConfirmacao] = useState(null);

  useEffect(() => {
    carregarFila();
  }, []);

  const carregarFila = async () => {
    setLoading(true);
    try {
      const data = await nortisCrawlerService.getFilaRevisao();
      setFila(data);
    } catch (err) {
      console.error('Erro ao carregar fila de revisão:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVarreduraManual = async () => {
    setExecutandoVarredura(true);
    try {
      const fontes = await nortisCrawlerService.getFontes();
      if (fontes.length > 0) {
        await nortisCrawlerService.executarCapturaFonte(fontes[0].id);
      }
      await carregarFila();
    } catch (err) {
      alert('Erro ao executar varredura: ' + err.message);
    } finally {
      setExecutandoVarredura(false);
    }
  };

  // Regra dos 2 Cliques (Clique 1: Selecionar Aprovar, Clique 2: Confirmar)
  const handleAprovarClique1 = (doc) => {
    setDocParaConfirmacao(doc);
  };

  const handleAprovarConfirmar = async () => {
    if (!docParaConfirmacao) return;
    try {
      await nortisCrawlerService.aprovarEPublicar(docParaConfirmacao.id);
      setDocParaConfirmacao(null);
      carregarFila();
    } catch (err) {
      alert('Erro ao aprovar e publicar: ' + err.message);
    }
  };

  // Descarte
  const handleConfirmarDescarte = async () => {
    if (!docParaDescarte) return;
    try {
      await nortisCrawlerService.descartarDocumento(docParaDescarte.id, motivoDescarte, obsDescarte);
      setDocParaDescarte(null);
      setMotivoDescarte('Não relevante');
      setObsDescarte('');
      carregarFila();
    } catch (err) {
      alert('Erro ao descartar documento: ' + err.message);
    }
  };

  // Edição
  const handleAbrirEdicao = (doc) => {
    setDocParaEdicao(doc);
    setFormDataEdit({
      tipo: doc.tipo,
      numero: doc.numero,
      ano: doc.ano || new Date().getFullYear(),
      data_publicacao: doc.data_publicacao,
      orgao: doc.orgao,
      esfera: doc.esfera,
      ementa: doc.ementa,
      url_fonte: doc.url_fonte
    });
  };

  const handleSalvarEdicao = async () => {
    if (!docParaEdicao) return;
    try {
      await nortisCrawlerService.aprovarEPublicar(docParaEdicao.id, formDataEdit);
      setDocParaEdicao(null);
      carregarFila();
    } catch (err) {
      alert('Erro ao salvar edição: ' + err.message);
    }
  };

  // Filtragem da Fila
  const filaFiltrada = fila.filter(item => {
    const classif = item.classificacao && item.classificacao[0] ? item.classificacao[0] : {};
    const nivel = classif.nivel_relevancia || 'MEDIA';

    if (filtroRelevancia !== 'TODOS' && nivel !== filtroRelevancia) return false;
    
    if (termoBusca) {
      const t = termoBusca.toLowerCase();
      const matchEmenta = (item.ementa || '').toLowerCase().includes(t);
      const matchTipo = (item.tipo || '').toLowerCase().includes(t);
      const matchNumero = (item.numero || '').toLowerCase().includes(t);
      const matchOrgao = (item.orgao || '').toLowerCase().includes(t);
      return matchEmenta || matchTipo || matchNumero || matchOrgao;
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Sticky */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/nortis')}
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  Fila de Revisão Rápida
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {fila.length} pendente(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprovação ágil de atos pré-cadastrados via Captura Inteligente (Regra dos 2 Cliques)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVarreduraManual}
              disabled={executandoVarredura}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={executandoVarredura ? 'animate-spin' : ''} />
              {executandoVarredura ? 'Varrendo...' : 'Varredura Manual'}
            </button>

            <button
              onClick={() => navigate('/nortis/dashboard')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 flex-1 space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ementa, tipo, número..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter size={14} /> Relevância:
            </span>
            {['TODOS', 'ALTA', 'MEDIA', 'BAIXA'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFiltroRelevancia(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroRelevancia === lvl
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Atos Pendentes */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-indigo-500" />
            Carregando fila de revisão inteligente...
          </div>
        ) : filaFiltrada.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
            <ShieldCheck size={48} className="mx-auto mb-3 text-emerald-500 opacity-80" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fila Vazia!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Nenhum ato normativo aguardando revisão rápida para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filaFiltrada.map(doc => {
              const classif = doc.classificacao && doc.classificacao[0] ? doc.classificacao[0] : {};
              const nivel = classif.nivel_relevancia || 'MEDIA';
              const pontuacao = classif.pontuacao || 0;
              const palavras = classif.palavras_encontradas || [];

              return (
                <div 
                  key={doc.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    {/* Badge de Relevância e Metadados Principais */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        nivel === 'ALTA' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                          : nivel === 'MEDIA'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        [{nivel} RELEVÂNCIA — Score: {pontuacao}]
                      </span>

                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {doc.esfera} • {doc.orgao}
                      </span>
                    </div>

                    {/* Título do Ato */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {doc.tipo} nº {doc.numero}/{doc.ano}
                    </h3>

                    {/* Ementa */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      {doc.ementa}
                    </p>

                    {/* Palavras-chave Encontradas */}
                    {palavras.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-semibold text-slate-400 mr-1">Encontrados:</span>
                        {palavras.slice(0, 5).map((p, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium border border-indigo-100 dark:border-indigo-900"
                          >
                            • {p.termo} (+{p.pontos}pts em {p.local})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Link Fonte e Data */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Capturado em: {new Date(doc.data_captura).toLocaleDateString('pt-BR')}</span>
                      {doc.url_fonte && (
                        <a 
                          href={doc.url_fonte} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          Fonte Oficial <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Painel de Ações do Usuário (Aprovar / Editar / Descartar) */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700 pt-4 lg:pt-0 lg:pl-6">
                    <button
                      onClick={() => handleAprovarClique1(doc)}
                      className="flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm active:scale-95"
                    >
                      <CheckCircle size={18} />
                      Aprovar e Publicar
                    </button>

                    <button
                      onClick={() => handleAbrirEdicao(doc)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => setDocParaDescarte(doc)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg font-medium text-sm transition-colors"
                    >
                      <Trash2 size={16} />
                      Descartar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal 1: Confirmação de Aprovação (Regra 2º Clique) */}
      {docParaConfirmacao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={28} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar Publicação</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Você está prestes a aprovar e publicar o documento <strong>{docParaConfirmacao.tipo} nº {docParaConfirmacao.numero}/{docParaConfirmacao.ano}</strong> no acervo legislativo oficial do NORTIS 2.0.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDocParaConfirmacao(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAprovarConfirmar}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm"
              >
                Confirmar (Clique 2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Descarte de Documento */}
      {docParaDescarte && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Descartar Documento</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Informe o motivo do descarte de <strong>{docParaDescarte.tipo} nº {docParaDescarte.numero}</strong> para fins de auditoria e melhoria do algoritmo de inteligência:
            </p>

            <div className="space-y-2">
              {[
                'Não relevante',
                'Falso positivo',
                'Documento duplicado',
                'Fonte incorreta',
                'Já cadastrado',
                'Outro'
              ].map(m => (
                <label key={m} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    checked={motivoDescarte === m}
                    onChange={() => setMotivoDescarte(m)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  {m}
                </label>
              ))}
            </div>

            <textarea
              placeholder="Observações adicionais (opcional)"
              value={obsDescarte}
              onChange={(e) => setObsDescarte(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
              rows={2}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDocParaDescarte(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarDescarte}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm"
              >
                Confirmar Descarte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Edição de Pré-Cadastro */}
      {docParaEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-500" /> Editar Pré-Cadastro antes da Publicação
              </h3>
              <button onClick={() => setDocParaEdicao(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                <input
                  type="text"
                  value={formDataEdit.tipo || ''}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, tipo: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Número</label>
                <input
                  type="text"
                  value={formDataEdit.numero || ''}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, numero: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Ano</label>
                <input
                  type="number"
                  value={formDataEdit.ano || ''}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, ano: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Esfera</label>
                <select
                  value={formDataEdit.esfera || 'Estadual'}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, esfera: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value="Federal">Federal</option>
                  <option value="Estadual">Estadual</option>
                  <option value="Municipal">Municipal</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Órgão Emissor</label>
                <input
                  type="text"
                  value={formDataEdit.orgao || ''}
                  onChange={(e) => setFormDataEdit({ ...formDataEdit, orgao: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ementa</label>
              <textarea
                rows={4}
                value={formDataEdit.ementa || ''}
                onChange={(e) => setFormDataEdit({ ...formDataEdit, ementa: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">URL Fonte Oficial</label>
              <input
                type="text"
                value={formDataEdit.url_fonte || ''}
                onChange={(e) => setFormDataEdit({ ...formDataEdit, url_fonte: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              <Info size={14} className="inline mr-1" />
              O <strong>texto original capturado</strong> permanece preservado no histórico de auditoria para fins de integridade jurídica.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDocParaEdicao(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicao}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm"
              >
                Salvar e Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
