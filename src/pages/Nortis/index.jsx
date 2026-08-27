import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Book, Search, Plus, Filter, FileText, ArrowLeft, ShieldCheck, Activity, Settings, Sparkles } from 'lucide-react';
import NortisSearch from './NortisSearch';
import NortisForm from './NortisForm';
import NortisView from './NortisView';
import NortisRevisaoRapida from './NortisRevisaoRapida';
import NortisCrawlerDashboard from './NortisCrawlerDashboard';
import NortisConfiguracoes from './NortisConfiguracoes';

const NortisMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-400 shrink-0"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  NORTIS 2.0
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  Captura Inteligente
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Motor de Inteligência Legislativa para Proteção e Defesa Civil
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex-1 p-4 space-y-6">
        {/* Banner Destaque: Fluxo Principal de Curadoria Humana */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide">
              <Sparkles size={14} /> CAPTURA AUTOMÁTICA &amp; VALIDAÇÃO RÁPIDA
            </div>
            <h2 className="text-2xl font-black leading-tight">
              Fila de Revisão Rápida de Atos Normativos
            </h2>
            <p className="text-sm text-indigo-100 leading-relaxed">
              O NORTIS pesquisa fontes oficiais, normaliza o texto e calcula a relevância. Valide os atos pré-cadastrados com a <strong>Regra dos 2 Cliques</strong>.
            </p>
          </div>

          <button
            onClick={() => navigate('/nortis/revisao')}
            className="px-6 py-3.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-extrabold text-sm shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2"
          >
            <ShieldCheck size={20} className="text-indigo-600" />
            Acessar Fila de Revisão →
          </button>
        </div>

        {/* Grid de Opções de Mapeamento NORTIS 2.0 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Fila de Revisão */}
          <button
            onClick={() => navigate('/nortis/revisao')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Revisão Rápida</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aprovação, edição e descarte de normas capturadas</p>
          </button>

          {/* Card 2: Consulta Normativa */}
          <button
            onClick={() => navigate('/nortis/busca')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Search size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Consulta Normativa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acervo oficial de leis, decretos e pareceres vigentes</p>
          </button>

          {/* Card 3: Dashboard do Crawler */}
          <button
            onClick={() => navigate('/nortis/dashboard')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Dashboard do Crawler</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitoramento de captura, fontes e execuções</p>
          </button>

          {/* Card 4: Configurações do Módulo */}
          <button
            onClick={() => navigate('/nortis/configuracoes')}
            className="flex flex-col text-left p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
          >
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Settings size={28} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Configurações</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gestão de fontes, palavras-chave e exclusões</p>
          </button>
        </div>

        {/* Rodapé: Cadastro Excepcional Manual (Subordinado) */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Cadastro Excepcional Manual</h4>
            <p className="text-xs text-slate-500">Utilize esta opção somente para cadastrar normas que não tenham sido capturadas automaticamente.</p>
          </div>
          <button
            onClick={() => navigate('/nortis/novo')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shrink-0"
          >
            <Plus size={14} /> Cadastrar Manualmente
          </button>
        </div>
      </main>
    </div>
  );
};

export default function NortisModule() {
  return (
    <Routes>
      <Route path="/" element={<NortisMenu />} />
      <Route path="/busca" element={<NortisSearch />} />
      <Route path="/novo" element={<NortisForm />} />
      <Route path="/editar/:id" element={<NortisForm />} />
      <Route path="/visualizar/:id" element={<NortisView />} />
      <Route path="/revisao" element={<NortisRevisaoRapida />} />
      <Route path="/dashboard" element={<NortisCrawlerDashboard />} />
      <Route path="/configuracoes" element={<NortisConfiguracoes />} />
    </Routes>
  );
}
