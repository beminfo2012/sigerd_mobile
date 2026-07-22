import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Calendar, Filter, RefreshCw, FileText, FileSpreadsheet,
  MapPin, ShieldAlert, AlertTriangle, Activity, Layers, TrendingUp,
  PieChart as PieIcon, CheckCircle2, ArrowUpRight, ArrowDownRight, Compass,
  Shield, AlertOctagon, HelpCircle, FileCheck, Landmark, Droplets, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart as RePie, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LimiteSMJLayer from '../../components/LimiteSMJLayer';
import AreasRiscoLayer from '../../components/AreasRiscoLayer';
import { biService } from '../../services/biService';



// Categoria Colors oficiais do SIGERD
const CATEGORY_COLORS = {
  'Estrutural': '#64748b',            // Cinza slate
  'Ambiental': '#10b981',             // Verde emerald
  'Infraestrutura Urbana': '#6366f1', // Indigo/Roxo
  'Geológico / Geotécnico': '#f97316',// Laranja
  'Hidrológico': '#3b82f6',           // Azul
  'Outros': '#94a3b8',                // Cinza claro
  'Tecnológico': '#eab308'            // Dourado/Amber
};

const RISK_COLORS = {
  R1: '#10b981', // Verde (Baixo)
  R2: '#f59e0b', // Amarelo (Médio)
  R3: '#ea580c', // Laranja (Alto)
  R4: '#dc2626'  // Vermelho (Muito Alto / Iminente)
};

export default function BusinessIntelligence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduloInicial = searchParams.get('modulo') || 'visao_geral';
  const visaoInicial = searchParams.get('visao') || 'tipologia';

  const [activeTab, setActiveTab] = useState(
    ['visao_geral', 'vistorias', 'ocorrencias', 'noprer', 'alertas', 'redap', 'placon', 'geoespacial', 'correlacoes'].includes(moduloInicial)
      ? moduloInicial
      : 'visao_geral'
  );

  // Filtros Globais
  const [periodo, setPeriodo] = useState('12m');
  const [localidade, setLocalidade] = useState('todas');
  const [tipologia, setTipologia] = useState('todas');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [areasRiscoData, setAreasRiscoData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await biService.getOverview({ periodo, localidade, tipologia });
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
      fetch('/Areas_de_risco.json')
        .then(r => r.json())
        .then(geo => setAreasRiscoData(geo))
        .catch(() => null);
    } catch (err) {
      console.error('[BI Page] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodo, localidade, tipologia]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `sigerd_bi_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans flex flex-col">
      {/* 1. CABEÇALHO FIXO DO BI */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
              <BarChart3 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight leading-none text-slate-900 dark:text-white uppercase">
                  Business Intelligence — SIGERD
                </h1>
                <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Módulo Analítico Real
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Central Estratégica de Dados, Tendências e Decisão Multimodular
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            Atualizado: <strong className="text-blue-600 dark:text-blue-400">{lastUpdated || '--:--'}</strong>
          </span>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            title="Atualizar dados reais"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <FileText size={14} /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} /> Exportar JSON/Excel
            </button>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE FILTROS GLOBAIS (STICKY) */}
      <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 sticky top-[73px] z-40">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros Globais:</span>
          </div>

          {/* Período */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar size={13} className="text-slate-400" />
            <select
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              <option value="30d">Últimos 30 Dias</option>
              <option value="6m">Últimos 6 Meses</option>
              <option value="12m">Últimos 12 Meses</option>
            </select>
          </div>

          {/* Localidade / Bairro */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <MapPin size={13} className="text-slate-400" />
            <select
              value={localidade}
              onChange={e => setLocalidade(e.target.value)}
              className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer max-w-[200px]"
            >
              <option value="todas">Todas as Localidades</option>
              {data?.topLocalidades?.map(l => (
                <option key={l.localidade} value={l.localidade}>{l.localidade}</option>
              ))}
            </select>
          </div>

          {/* Tipologia */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Layers size={13} className="text-slate-400" />
            <select
              value={tipologia}
              onChange={e => setTipologia(e.target.value)}
              className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              <option value="todas">Todas as Tipologias</option>
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {(localidade !== 'todas' || tipologia !== 'todas') && (
            <button
              onClick={() => { setLocalidade('todas'); setTipologia('todas'); }}
              className="text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-wider"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </section>

      {/* 3. BARRA DE NAVEGAÇÃO DE ABAS */}
      <nav className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 pt-3">
        <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-2">
          {[
            { id: 'visao_geral', label: 'Visão Geral', icon: BarChart3 },
            { id: 'vistorias', label: `Vistorias (${data?.rawCounts?.vistorias || 0})`, icon: Layers },
            { id: 'ocorrencias', label: `Ocorrências (${data?.rawCounts?.ocorrencias || 0})`, icon: AlertTriangle },
            { id: 'noprer', label: `NOPRER (${data?.rawCounts?.noprer || 0})`, icon: Shield },
            { id: 'alertas', label: `Alertas (${data?.rawCounts?.alertas || 0})`, icon: ShieldAlert },
            { id: 'redap', label: `REDAP (${data?.rawCounts?.redap || 0})`, icon: FileCheck },
            { id: 'placon', label: `PLACON (${data?.rawCounts?.placon || 0})`, icon: Landmark },
            { id: 'geoespacial', label: 'Geoespacial Verificado', icon: Compass },
            { id: 'correlacoes', label: 'Matriz de Correlação', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. CONTEÚDO PRINCIPAL DO PAINEL */}
      <main className="p-6 flex-1 space-y-6 max-w-[1700px] w-full mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw size={40} className="animate-spin text-blue-600 mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Consolidando Inteligência Analítica em Tempo Real...
            </p>
          </div>
        ) : (
          <>
            {/* ABA: VISÃO GERAL */}
            {activeTab === 'visao_geral' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Cards de KPIs Principais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Vistorias Empreendidas</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {data?.kpis?.totalVistorias || 0}
                      </span>
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                        <ArrowUpRight size={14} /> {data?.kpis?.variacaoVistorias}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full w-[85%]" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Ocorrências Operacionais</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {data?.kpis?.totalOcorrencias || 0}
                      </span>
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                        <ArrowDownRight size={14} /> {data?.kpis?.variacaoOcorrencias}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2">
                      Abertas/Atendimento: <strong className="text-orange-500">{data?.kpis?.ocorrenciasAbertas || 0}</strong>
                    </p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">NOPRERs Notificadas</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {data?.kpis?.noprersEmitidas || 0}
                      </span>
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                        <ArrowUpRight size={14} /> {data?.kpis?.variacaoNoprers}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full w-[65%]" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Interdições Totais / Parciais</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                        {data?.kpis?.interdicoesTotais || 0}
                      </span>
                      <span className="text-xs font-bold text-red-500 font-mono">
                        {data?.kpis?.interdicoesAtivas || 0} Ativas
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-red-600 h-full rounded-full w-[90%]" />
                    </div>
                  </div>
                </div>

                {/* Gráfico de Tendência Temporal Combinada (Multi-Series Recharts) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" /> Evolução Histórica Multimodular (Últimos 12 Meses)
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                      Vistorias × Ocorrências × Alertas × NOPRER
                    </span>
                  </div>
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data?.monthlySeries || []}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="label" stroke="#8884d8" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <YAxis style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="vistorias" name="Vistorias" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
                        <Area type="monotone" dataKey="ocorrencias" name="Ocorrências" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                        <Area type="monotone" dataKey="alertas" name="Alertas CEMADEN" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                        <Area type="monotone" dataKey="noprers" name="NOPRER" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sub-grid: Tipologia & Top Localidades Críticas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tipologia */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-4">
                      Categorização por Tipologia de Risco (Vistorias)
                    </h3>
                    <div className="space-y-3">
                      {data?.tipologiaDistribution?.map((item, idx) => (
                        <div key={idx} className="group">
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                            <span className="tabular-nums font-mono">{item.count} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: CATEGORY_COLORS[item.label] || '#94a3b8'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 10 Localidades Críticas */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-4">
                      Top Localidades com Maior Volume Registrado
                    </h3>
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {data?.topLocalidades?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            <strong className="text-blue-600 dark:text-blue-400 mr-2">{idx + 1}.</strong> {item.localidade}
                          </span>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                            {item.count} registros
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: VISTORIAS */}
            {activeTab === 'vistorias' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-4">
                    Matriz por Grau de Nível de Risco (R1 – R4)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(data?.riscoDistribution || {}).filter(([k]) => k !== 'Outros').map(([nivel, count]) => (
                      <div key={nivel} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center shadow-sm">
                        <span className="text-xs font-black uppercase tracking-widest block" style={{ color: RISK_COLORS[nivel] }}>
                          Nível {nivel}
                        </span>
                        <span className="text-3xl font-black mt-2 block text-slate-900 dark:text-white tabular-nums">{count}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                          {nivel === 'R4' ? 'Muito Alto / Iminente' : nivel === 'R3' ? 'Risco Alto' : nivel === 'R2' ? 'Risco Médio' : 'Risco Baixo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA: OCORRÊNCIAS */}
            {activeTab === 'ocorrencias' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-4">
                    Distribuição das Ocorrências por Status de Atendimento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data?.statusOcorrenciasDistribution?.map((st, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-wider block">{st.label}</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tabular-nums mt-1 block">{st.count}</span>
                        <span className="text-[10px] font-bold text-blue-500 mt-1 block">{st.percentage}% do total</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA: GEOESPACIAL VERIFICADO */}
            {activeTab === 'geoespacial' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Compass size={18} className="text-blue-500" /> Mapa Geoespacial Interativo com Áreas de Risco GeoJSON
                  </h3>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-xl">
                    {data?.geoData?.verifiedLocs?.length || 0} Coordenadas GPS/EXIF Validadas
                  </span>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-start gap-3">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p>
                    <strong>Regra de Integridade Auditável & Mapeamento Geoespacial:</strong> Exibindo a camada oficial de Áreas de Risco Poligonais GeoJSON (classificadas de R1 a R4) em conjunto com pontos de ocorrências, vistorias e interdições com geolocalização real comprovada por GPS/EXIF.
                  </p>
                </div>

                {/* MAPA INTERATIVO LEAFLET COM GEOJSON DE ÁREAS DE RISCO */}
                <div className="h-[480px] w-full rounded-2xl overflow-hidden relative z-0 border border-slate-200 dark:border-slate-800 shadow-inner">
                  <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <LimiteSMJLayer keyId="limite-smj-bi" />

                    {/* Camada GeoJSON de Áreas de Risco */}
                    {areasRiscoData && (
                      <AreasRiscoLayer data={areasRiscoData} tiposAtivos={new Set(['geologico', 'hidrologico', 'estrutural'])} />
                    )}

                    {/* Marcadores das ocorrências/vistorias validadas */}
                    {(data?.geoData?.verifiedLocs || []).map((loc, idx) => (
                      <CircleMarker
                        key={idx}
                        center={[loc.lat, loc.lng]}
                        radius={7}
                        pathOptions={{
                          color: '#ffffff',
                          fillColor: loc.type === 'vistoria' ? '#3b82f6' : loc.type === 'ocorrencia' ? '#f97316' : '#dc2626',
                          fillOpacity: 0.9,
                          weight: 2
                        }}
                      >
                        <Popup minWidth={180}>
                          <div className="p-1 font-sans">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{loc.type.toUpperCase()} • {loc.formattedId}</div>
                            <div className="text-xs font-bold text-slate-800 mt-1">{loc.categoria}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Bairro: {loc.bairro}</div>
                            <div className="text-[9px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded">Fonte: {loc.fonte_geolocalizacao}</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-3">Últimas Coordenadas GPS Registradas</h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {data?.geoData?.verifiedLocs?.slice(0, 15).map((g, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{g.formattedId} ({g.bairro})</span>
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                            {g.lat.toFixed(4)}, {g.lng.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase text-slate-500 mb-3">Registros sem Fonte de Geolocalização</h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {data?.geoData?.unverifiedLocs?.slice(0, 15).map((u, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{u.formattedId} - {u.bairro}</span>
                          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded font-semibold">
                            {u.motivoSemGeolocalizacao}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: CORRELAÇÕES */}
            {activeTab === 'correlacoes' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" /> Matriz de Correlação Estratégica & Priorização de Obras
                </h3>
                <p className="text-xs text-slate-500">
                  Cruzamento automatizado entre ocorrências geológicas/estruturais e vistorias críticas com risco R3/R4 por localidade para direcionamento de recursos de contenção de encostas e infraestrutura urbana.
                </p>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 uppercase text-[10px] font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-4">Localidade / Bairro</th>
                        <th className="p-4 text-center">Vistorias Totais</th>
                        <th className="p-4 text-center">Críticas R3/R4</th>
                        <th className="p-4 text-center">Ocorrências Geológicas</th>
                        <th className="p-4 text-center">Índice de Prioridade de Obra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data?.correlationMatrix?.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{row.bairro}</td>
                          <td className="p-4 text-center font-mono">{row.totalVistorias}</td>
                          <td className="p-4 text-center font-mono font-bold text-orange-600">{row.vistoriasCriticasR3R4}</td>
                          <td className="p-4 text-center font-mono text-blue-600">{row.ocorrenciasGeologicas}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${row.indicePrioridadeObra > 50 ? 'bg-red-600' : row.indicePrioridadeObra > 25 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                  style={{ width: `${row.indicePrioridadeObra}%` }}
                                />
                              </div>
                              <span className="font-black text-xs tabular-nums">{row.indicePrioridadeObra}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
