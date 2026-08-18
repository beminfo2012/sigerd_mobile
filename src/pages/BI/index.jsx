import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RefreshCw, FileText, Download, ArrowLeft, Filter, Calendar, MapPin,
  Layers, Shield, Activity, Compass, Users, CheckCircle2
} from 'lucide-react';
import { biService } from '../../services/biService';
import { exportToXLSX, exportToCSV, exportToJSON } from './utils/ExportUtils';

// Componentes Sub-módulos do BI
import SituacaoMunicipioCard from './components/SituacaoMunicipioCard';
import BiKpiCards from './components/BiKpiCards';
import PontosAtencaoWidget from './components/PontosAtencaoWidget';
import MapaInteligenciaTerritorial from './components/MapaInteligenciaTerritorial';
import SituacaoRecenteTimeline from './components/SituacaoRecenteTimeline';
import EvolucaoTemporalCharts from './components/EvolucaoTemporalCharts';
import RankingLocalidadesTable from './components/RankingLocalidadesTable';
import MatrizTipologiaLocalidade from './components/MatrizTipologiaLocalidade';
import AlertasInterdicoesPanel from './components/AlertasInterdicoesPanel';
import NoprerInteligenciaPanel from './components/NoprerInteligenciaPanel';
import MatrizCorrelacaoPanel from './components/MatrizCorrelacaoPanel';
import MonitoramentoMeteoHidro from './components/MonitoramentoMeteoHidro';
import UniversalDrillDownModal from './components/UniversalDrillDownModal';

export default function BusinessIntelligence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Níveis de Visão / Arquitetura do SIGERD BI
  const nivelInicial = searchParams.get('nivel') || 'visao_geral';
  const [activeNivel, setActiveNivel] = useState(
    ['visao_geral', 'estrategica', 'operacional', 'analitica'].includes(nivelInicial)
      ? nivelInicial
      : 'visao_geral'
  );

  // Filtros Globais
  const [periodo, setPeriodo] = useState('12m');
  const [localidade, setLocalidade] = useState('todas');
  const [tipologia, setTipologia] = useState('todas');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [areasRiscoData, setAreasRiscoData] = useState(null);
  const [customRules, setCustomRules] = useState(null);

  // Estado do Drill-down Universal Modal
  const [drillDownFilter, setDrillDownFilter] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await biService.getOverview({ periodo, localidade, tipologia, customRules });
      setData(res);
      fetch('/Areas_de_risco.json')
        .then(r => r.json())
        .then(geo => setAreasRiscoData(geo))
        .catch(() => null);
    } catch (err) {
      console.error('[SIGERD BI] Erro ao carregar inteligência:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodo, localidade, tipologia, customRules]);

  const handleSaveRules = (newRules) => {
    setCustomRules(newRules);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportDataset = (format) => {
    if (!data) return;
    if (format === 'xlsx') exportToXLSX(data, `sigerd_bi_dataset_${new Date().toISOString().split('T')[0]}.xlsx`);
    else if (format === 'csv') exportToCSV(data, `sigerd_bi_dataset_${new Date().toISOString().split('T')[0]}.csv`);
    else if (format === 'json') exportToJSON(data, `sigerd_bi_dataset_${new Date().toISOString().split('T')[0]}.json`);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans flex flex-col">
      {/* 1. CABEÇALHO INSTITUCIONAL DA CENTRAL DE INTELIGÊNCIA */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-4 md:px-8 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all border border-slate-200/60 dark:border-slate-700"
              title="Voltar ao Sistema"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white uppercase">
                  SIGERD BI — Central de Inteligência
                </h1>
                <span className="text-[9px] font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Gestão de Riscos & Desastres
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Apoio à Decisão do Prefeito, Defesa Civil, Secretaria de Obras e Equipe Técnica
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              Atualizado: <strong className="text-blue-600 dark:text-blue-400">{data?.lastUpdated || '--:--'}</strong>
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar Dados</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <FileText size={14} /> <span className="hidden sm:inline">Gerar PDF</span>
            </button>

            {/* Menu de Exportação de Datasets */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                <Download size={14} /> Exportar Dataset
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 hidden group-hover:block z-50">
                <button
                  onClick={() => handleExportDataset('xlsx')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Planilha XLSX (Excel)
                </button>
                <button
                  onClick={() => handleExportDataset('csv')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Arquivo CSV
                </button>
                <button
                  onClick={() => handleExportDataset('json')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Dados em JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO POR NÍVEIS (VISÃO ESTRATÉGICA, OPERACIONAL, ANALÍTICA, GERAL) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveNivel('visao_geral')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeNivel === 'visao_geral'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              VISÃO GERAL
            </button>
            <button
              onClick={() => setActiveNivel('estrategica')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeNivel === 'estrategica'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nível 1 — Estratégica (Prefeito)
            </button>
            <button
              onClick={() => setActiveNivel('operacional')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeNivel === 'operacional'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nível 2 — Operacional (Defesa Civil)
            </button>
            <button
              onClick={() => setActiveNivel('analitica')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeNivel === 'analitica'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Nível 3 — Inteligência Analítica
            </button>
          </div>

          {/* Filtros Globais de Período, Localidade e Tipologia */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <Calendar size={14} className="text-slate-400" />
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="12m">Últimos 12 meses</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <MapPin size={14} className="text-slate-400" />
              <select
                value={localidade}
                onChange={(e) => setLocalidade(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="todas">Todas as Localidades</option>
                <option value="Centro">Centro</option>
                <option value="Vila Jetibá">Vila Jetibá</option>
                <option value="Caramuru">Caramuru</option>
                <option value="Rio Sabino">Rio Sabino</option>
                <option value="São Luiz">São Luiz</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <Filter size={14} className="text-slate-400" />
              <select
                value={tipologia}
                onChange={(e) => setTipologia(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="todas">Todas as Tipologias</option>
                <option value="Estrutural">Estrutural</option>
                <option value="Geológico / Geotécnico">Geológico / Geotécnico</option>
                <option value="Hidrológico">Hidrológico</option>
                <option value="Ambiental">Ambiental</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CONTEÚDO PRINCIPAL BASEADO NO NÍVEL SELECIONADO */}
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw size={36} className="animate-spin text-blue-600" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Processando inteligência analítica territorial do SIGERD...
            </p>
          </div>
        ) : (
          <>
            {/* 1. INDICADOR PRINCIPAL — SITUAÇÃO DO MUNICÍPIO */}
            <SituacaoMunicipioCard
              situacao={data?.situacaoMunicipio}
              rules={data?.rules}
              onSaveRules={handleSaveRules}
            />

            {/* 2. KPIS PRINCIPAIS (R1 - R4 + TOTAIS) */}
            <BiKpiCards
              kpis={data?.kpis}
              onCardClick={(key) => setDrillDownFilter(key)}
            />

            {/* 3. VISÃO POR NÍVEIS DE ARQUITETURA */}

            {/* NÍVEL 1 — VISÃO ESTRATÉGICA (Prefeito e Gestores) */}
            {(activeNivel === 'visao_geral' || activeNivel === 'estrategica') && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MapaInteligenciaTerritorial
                      geoPoints={data?.geoData}
                      areasRiscoData={areasRiscoData}
                    />
                  </div>
                  <div className="space-y-6">
                    <PontosAtencaoWidget
                      pontos={data?.pontosAtencao}
                      onItemClick={(p) => setDrillDownFilter(p)}
                    />
                    <SituacaoRecenteTimeline timeline={data?.situacaoRecenteTimeline} />
                  </div>
                </div>

                <RankingLocalidadesTable
                  localities={data?.rankingLocalidades}
                  onRowClick={(loc) => setDrillDownFilter(loc.localidade)}
                />
              </div>
            )}

            {/* NÍVEL 2 — GESTÃO OPERACIONAL (Defesa Civil e Gestores Técnicos) */}
            {(activeNivel === 'visao_geral' || activeNivel === 'operacional') && (
              <div className="space-y-6">
                <AlertasInterdicoesPanel
                  alertas={data?.alertasLista}
                  interdicoes={data?.interdicoesList}
                  onItemClick={(item) => setDrillDownFilter(item)}
                />

                <NoprerInteligenciaPanel
                  noprerCount={data?.noprerRiscoCount}
                  reincidentes={data?.localidadesReincidentesNoprer}
                />
              </div>
            )}

            {/* NÍVEL 3 — INTELIGÊNCIA ANALÍTICA (Analistas de Risco) */}
            {(activeNivel === 'visao_geral' || activeNivel === 'analitica') && (
              <div className="space-y-6">
                <MonitoramentoMeteoHidro
                  estacoesMeteo={data?.estacoesMeteo}
                  estacoesHidro={data?.estacoesHidro}
                />

                <EvolucaoTemporalCharts
                  monthlySeries={data?.monthlySeries}
                  evolucaoRisco={data?.evolucaoNivelRisco}
                />

                <MatrizTipologiaLocalidade
                  matriz={data?.matrizTipologiaLocalidade}
                  onCellClick={(loc, tip) => setDrillDownFilter({ key: 'vistorias', loc, tip })}
                />

                <MatrizCorrelacaoPanel matrix={data?.correlationMatrix} />
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. MODAL UNIVERSAL DE DRILL-DOWN */}
      {drillDownFilter && (
        <UniversalDrillDownModal
          itemFilter={drillDownFilter}
          data={data}
          onClose={() => setDrillDownFilter(null)}
        />
      )}
    </div>
  );
}
