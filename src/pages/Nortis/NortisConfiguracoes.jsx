import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Database, 
  Key, 
  ShieldOff, 
  Layers, 
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { nortisCrawlerService } from '../../services/nortisCrawlerService';

export default function NortisConfiguracoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('FONTES'); // FONTES | PALAVRAS | EXCLUSAO

  // Dados
  const [fontes, setFontes] = useState([]);
  const [palavras, setPalavras] = useState([]);
  const [exclusoes, setExclusoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [novaFonte, setNovaFonte] = useState({ nome: '', esfera: 'Estadual', orgao: '', url: '', tipo_integracao: 'RSS', periodicidade_horas: 24 });
  const [novaPalavra, setNovaPalavra] = useState({ termo: '', categoria: 'Núcleo Defesa Civil', peso: 50, tipo_correspondencia: 'EXPRESSAO' });
  const [novaExclusao, setNovaExclusao] = useState({ termo: '', contexto_exclusao: '', penalidade_peso: 50 });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [f, p, e] = await Promise.all([
        nortisCrawlerService.getFontes(),
        nortisCrawlerService.getPalavrasChave(),
        nortisCrawlerService.getListaExclusao()
      ]);
      setFontes(f);
      setPalavras(p);
      setExclusoes(e);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Ações de Fontes
  const handleAddFonte = async (e) => {
    e.preventDefault();
    if (!novaFonte.nome || !novaFonte.url) return alert('Preencha nome e URL!');
    try {
      await nortisCrawlerService.saveFonte(novaFonte);
      setNovaFonte({ nome: '', esfera: 'Estadual', orgao: '', url: '', tipo_integracao: 'RSS', periodicidade_horas: 24 });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar fonte: ' + err.message);
    }
  };

  const handleToggleFonte = async (id, statusAtual) => {
    try {
      await nortisCrawlerService.toggleFonteAtiva(id, statusAtual);
      carregarDados();
    } catch (err) {
      alert('Erro ao alterar status da fonte: ' + err.message);
    }
  };

  // 2. Ações de Palavras-Chave
  const handleAddPalavra = async (e) => {
    e.preventDefault();
    if (!novaPalavra.termo) return alert('Informe o termo!');
    try {
      await nortisCrawlerService.savePalavraChave(novaPalavra);
      setNovaPalavra({ termo: '', categoria: 'Núcleo Defesa Civil', peso: 50, tipo_correspondencia: 'EXPRESSAO' });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar palavra-chave: ' + err.message);
    }
  };

  const handleDeletePalavra = async (id) => {
    if (!confirm('Deseja excluir esta palavra-chave?')) return;
    try {
      await nortisCrawlerService.deletePalavraChave(id);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // 3. Ações de Lista de Exclusão
  const handleAddExclusao = async (e) => {
    e.preventDefault();
    if (!novaExclusao.termo) return alert('Informe o termo!');
    try {
      await nortisCrawlerService.saveItemExclusao(novaExclusao);
      setNovaExclusao({ termo: '', contexto_exclusao: '', penalidade_peso: 50 });
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar item de exclusão: ' + err.message);
    }
  };

  const handleDeleteExclusao = async (id) => {
    if (!confirm('Deseja remover este termo da lista de exclusão?')) return;
    try {
      await nortisCrawlerService.deleteItemExclusao(id);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/nortis')}
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                Configurações da Captura Inteligente
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerenciamento administrativo de fontes, palavras-chave, pesos e lista de exclusão
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 flex-1 space-y-6">
        {/* Navegação por Abas */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
          <button
            onClick={() => setAbaAtiva('FONTES')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-colors ${
              abaAtiva === 'FONTES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database size={16} /> Fontes Oficiais ({fontes.length})
          </button>

          <button
            onClick={() => setAbaAtiva('PALAVRAS')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-colors ${
              abaAtiva === 'PALAVRAS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Key size={16} /> Palavras-Chave & Pesos ({palavras.length})
          </button>

          <button
            onClick={() => setAbaAtiva('EXCLUSAO')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-colors ${
              abaAtiva === 'EXCLUSAO'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldOff size={16} /> Lista de Exclusão ({exclusoes.length})
          </button>
        </div>

        {/* CONTEÚDO ABA 1: FONTES OFICIAIS */}
        {abaAtiva === 'FONTES' && (
          <div className="space-y-6">
            {/* Form Nova Fonte */}
            <form onSubmit={handleAddFonte} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-indigo-500" /> Cadastrar Nova Fonte Oficial
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome da Fonte</label>
                  <input
                    type="text"
                    placeholder="ex: Diário Oficial de Vitória"
                    value={novaFonte.nome}
                    onChange={(e) => setNovaFonte({ ...novaFonte, nome: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Esfera</label>
                  <select
                    value={novaFonte.esfera}
                    onChange={(e) => setNovaFonte({ ...novaFonte, esfera: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="Federal">Federal</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Municipal">Municipal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Órgão Emissor</label>
                  <input
                    type="text"
                    placeholder="ex: Prefeitura Municipal / Imprensa Oficial"
                    value={novaFonte.orgao}
                    onChange={(e) => setNovaFonte({ ...novaFonte, orgao: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">URL Oficial / Feed / API Endpoint</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={novaFonte.url}
                    onChange={(e) => setNovaFonte({ ...novaFonte, url: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Integração</label>
                  <select
                    value={novaFonte.tipo_integracao}
                    onChange={(e) => setNovaFonte({ ...novaFonte, tipo_integracao: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="RSS">RSS / Atom Feed</option>
                    <option value="API">API Rest (JSON/XML)</option>
                    <option value="HTML">Crawler HTML Estruturado</option>
                    <option value="LexML">LexML Brasil</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm"
                >
                  Salvar Fonte
                </button>
              </div>
            </form>

            {/* Listagem de Fontes */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 font-semibold">Fonte</th>
                    <th className="p-3.5 font-semibold">URL</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {fontes.map(f => (
                    <tr key={f.id}>
                      <td className="p-3.5 font-semibold">
                        {f.nome} <span className="text-xs font-normal text-slate-400">({f.esfera})</span>
                      </td>
                      <td className="p-3.5 text-xs font-mono text-slate-500 truncate max-w-xs">{f.url}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          f.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {f.ativo ? 'ATIVA' : 'INATIVA'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleFonte(f.id, f.ativo)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {f.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO ABA 2: PALAVRAS-CHAVE */}
        {abaAtiva === 'PALAVRAS' && (
          <div className="space-y-6">
            {/* Form Nova Palavra-Chave */}
            <form onSubmit={handleAddPalavra} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-indigo-500" /> Adicionar Novo Termo / Palavra-Chave
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Termo / Expressão</label>
                  <input
                    type="text"
                    placeholder="ex: Sistema de Alerta"
                    value={novaPalavra.termo}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, termo: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                  <select
                    value={novaPalavra.categoria}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, categoria: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="Núcleo Defesa Civil">Núcleo Defesa Civil</option>
                    <option value="Desastres e Eventos Adversos">Desastres e Eventos Adversos</option>
                    <option value="Gestão de Riscos">Gestão de Riscos</option>
                    <option value="Áreas Transversais">Áreas Transversais</option>
                    <option value="Instrumentos Financeiros">Instrumentos Financeiros/Jurídicos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Peso (Pontuação)</label>
                  <input
                    type="number"
                    value={novaPalavra.peso}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, peso: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Correspondência</label>
                  <select
                    value={novaPalavra.tipo_correspondencia}
                    onChange={(e) => setNovaPalavra({ ...novaPalavra, tipo_correspondencia: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="EXPRESSAO">EXPRESSÃO</option>
                    <option value="EXATA">EXATA</option>
                    <option value="RADICAL">RADICAL</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm"
                >
                  Adicionar Termo
                </button>
              </div>
            </form>

            {/* Tabela de Palavras-Chave */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 font-semibold">Termo</th>
                    <th className="p-3.5 font-semibold">Categoria</th>
                    <th className="p-3.5 font-semibold">Peso</th>
                    <th className="p-3.5 font-semibold">Correspondência</th>
                    <th className="p-3.5 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {palavras.map(p => (
                    <tr key={p.id}>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{p.termo}</td>
                      <td className="p-3.5 text-xs">{p.categoria}</td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">+{p.peso}</td>
                      <td className="p-3.5 font-mono text-xs text-slate-500">{p.tipo_correspondencia}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeletePalavra(p.id)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTEÚDO ABA 3: LISTA DE EXCLUSÃO */}
        {abaAtiva === 'EXCLUSAO' && (
          <div className="space-y-6">
            <form onSubmit={handleAddExclusao} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-rose-500" /> Adicionar Regra de Falso Positivo (Exclusão)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Termo / Contexto</label>
                  <input
                    type="text"
                    placeholder="ex: defesa em processo"
                    value={novaExclusao.termo}
                    onChange={(e) => setNovaExclusao({ ...novaExclusao, termo: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contexto de Exclusão</label>
                  <input
                    type="text"
                    placeholder="ex: Jurídico / Processual"
                    value={novaExclusao.contexto_exclusao}
                    onChange={(e) => setNovaExclusao({ ...novaExclusao, contexto_exclusao: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Penalidade (Subtrair Pts)</label>
                  <input
                    type="number"
                    value={novaExclusao.penalidade_peso}
                    onChange={(e) => setNovaExclusao({ ...novaExclusao, penalidade_peso: parseInt(e.target.value, 10) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-sm"
                >
                  Adicionar Exclusão
                </button>
              </div>
            </form>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 font-semibold">Termo Penalizado</th>
                    <th className="p-3.5 font-semibold">Contexto</th>
                    <th className="p-3.5 font-semibold">Penalidade</th>
                    <th className="p-3.5 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                  {exclusoes.map(e => (
                    <tr key={e.id}>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{e.termo}</td>
                      <td className="p-3.5 text-xs text-slate-500">{e.contexto_exclusao}</td>
                      <td className="p-3.5 font-bold text-rose-600">-{e.penalidade_peso} pts</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteExclusao(e.id)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
