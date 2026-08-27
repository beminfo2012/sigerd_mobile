import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Play, 
  Settings, 
  ShieldAlert, 
  BarChart3,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { nortisCrawlerService } from '../../services/nortisCrawlerService';

export default function NortisCrawlerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [fontes, setFontes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executandoFonte, setExecutandoFonte] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        nortisCrawlerService.getDashboardStats(),
        nortisCrawlerService.getFontes()
      ]);
      setStats(s);
      setFontes(f);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutarFonte = async (fonteId) => {
    setExecutandoFonte(fonteId);
    try {
      await nortisCrawlerService.executarCapturaFonte(fonteId);
      await carregarDados();
    } catch (err) {
      alert('Falha na execução: ' + err.message);
    } finally {
      setExecutandoFonte(null);
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
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                Dashboard de Captura Inteligente <Activity size={20} className="text-indigo-500" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoramento de crawler, fontes oficiais e taxas de classificação legislativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/nortis/configuracoes')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Settings size={16} /> Configurações
            </button>
            <button
              onClick={carregarDados}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-lg transition-colors"
              title="Atualizar Dados"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 flex-1 space-y-6">
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fontes Ativas</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Database size={20} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {stats ? stats.fontesAtivas : 0} <span className="text-sm font-normal text-slate-400">/ {stats ? stats.totalFontes : 0}</span>
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">100% integradas</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Documentos Capturados</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileText size={20} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {stats ? stats.totalCapturados : 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Varredura automática 24h</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Alta Relevância</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                <ShieldAlert size={20} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-3">
              {stats ? stats.altaRelevancia : 0}
            </p>
            <p className="text-xs text-rose-500 font-medium mt-1">Notificação imediata acionada</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Aguardando Revisão</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-3">
              {stats ? stats.pendentes : 0}
            </p>
            <button 
              onClick={() => navigate('/nortis/revisao')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 inline-block"
            >
              Ir para Fila de Revisão Rápida →
            </button>
          </div>
        </div>

        {/* Distribuição por Nível e Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classificação de Relevância */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" /> Distribuição de Relevância
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600">Alta Relevância (≥ 80 pts)</span>
                  <span className="text-slate-700 dark:text-slate-300">{stats ? stats.altaRelevancia : 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: stats && stats.totalCapturados > 0 ? `${(stats.altaRelevancia / stats.totalCapturados) * 100}%` : '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-600">Média Relevância (40 a 79 pts)</span>
                  <span className="text-slate-700 dark:text-slate-300">{stats ? stats.mediaRelevancia : 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: stats && stats.totalCapturados > 0 ? `${(stats.mediaRelevancia / stats.totalCapturados) * 100}%` : '0%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500">Baixa Relevância (15 a 39 pts)</span>
                  <span className="text-slate-700 dark:text-slate-300">{stats ? stats.baixaRelevancia : 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: stats && stats.totalCapturados > 0 ? `${(stats.baixaRelevancia / stats.totalCapturados) * 100}%` : '0%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Status de Curadoria Humana */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" /> Curadoria Humana de Atos
            </h3>

            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats ? stats.aprovados : 0}</p>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-1">Aprovados</p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-100 dark:border-amber-900">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats ? stats.pendentes : 0}</p>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-1">Pendentes</p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-100 dark:border-rose-900">
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{stats ? stats.descartados : 0}</p>
                <p className="text-xs font-medium text-rose-800 dark:text-rose-300 mt-1">Descartados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Fontes Configuradas e Status de Coleta */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Database size={18} className="text-indigo-500" /> Fontes Oficiais de Legislação Configuradas
            </h3>
            <button
              onClick={() => navigate('/nortis/configuracoes')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Gerenciar Fontes
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3.5 font-semibold">Fonte / Portal</th>
                  <th className="p-3.5 font-semibold">Esfera</th>
                  <th className="p-3.5 font-semibold">Integração</th>
                  <th className="p-3.5 font-semibold">Periodicidade</th>
                  <th className="p-3.5 font-semibold">Última Execução</th>
                  <th className="p-3.5 font-semibold">Classificados</th>
                  <th className="p-3.5 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-200">
                {fontes.map(fonte => (
                  <tr key={fonte.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{fonte.nome}</div>
                      <div className="text-xs text-slate-400">{fonte.orgao}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {fonte.esfera}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      {fonte.tipo_integracao}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500">
                      Cada {fonte.periodicidade_horas}h
                    </td>
                    <td className="p-3.5 text-xs text-slate-500">
                      {fonte.ultima_execucao ? new Date(fonte.ultima_execucao).toLocaleString('pt-BR') : 'Pendente'}
                    </td>
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {fonte.qtd_documentos_classificados || 0}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleExecutarFonte(fonte.id)}
                        disabled={executandoFonte === fonte.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <Play size={12} className={executandoFonte === fonte.id ? 'animate-spin' : ''} />
                        {executandoFonte === fonte.id ? 'Varrendo...' : 'Coletar Agora'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
