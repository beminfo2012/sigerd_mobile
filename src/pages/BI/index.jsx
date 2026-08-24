import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RefreshCw, FileText, Download, ArrowLeft, Filter, Calendar, MapPin
} from 'lucide-react';
import { biService } from '../../services/biService';
import { exportToXLSX, exportToCSV, exportToJSON } from './utils/ExportUtils';

// Novos componentes modulares
import BiKpiCards from './components/BiKpiCards';
import BiGridSec2 from './components/BiGridSec2';
import BiGridSec3 from './components/BiGridSec3';
import BiSec4Alerts from './components/BiSec4Alerts';
import UniversalDrillDownModal from './components/UniversalDrillDownModal';

// Registrar Chart.js globalmente para o BI
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function BusinessIntelligence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filtros Globais
  const [periodo, setPeriodo] = useState('12m');
  const [localidade, setLocalidade] = useState('todas');
  const [tipologia, setTipologia] = useState('todas');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Estado do Drill-down
  const [drillDownFilter, setDrillDownFilter] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // biService.getOverview deve retornar os dados formatados. 
      // Em um cenário real, as queries do backend seriam mapeadas.
      const res = await biService.getOverview({ periodo, localidade, tipologia });
      setData(res);
    } catch (err) {
      console.error('[SIGERD BI] Erro ao carregar inteligência:', err);
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

  const handleExportDataset = (format) => {
    if (!data) return;
    const dateStr = new Date().toISOString().split('T')[0];
    if (format === 'xlsx') exportToXLSX(data, `sigerd_bi_dataset_${dateStr}.xlsx`);
    else if (format === 'csv') exportToCSV(data, `sigerd_bi_dataset_${dateStr}.csv`);
    else if (format === 'json') exportToJSON(data, `sigerd_bi_dataset_${dateStr}.json`);
  };

  return (
    <div className="bg-[#F2F4F9] min-h-screen text-slate-800 font-sans flex flex-col">
      {/* CABEÇALHO */}
      <header className="bg-gradient-to-r from-[#0E1A3D] to-[#152A56] text-white border-b border-[#0E1A3D] sticky top-0 z-50 px-4 md:px-8 py-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all"
              title="Voltar ao Sistema"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black tracking-tight leading-none uppercase">
                  SIGERD BI — Central de Inteligência
                </h1>
                <span className="text-[9px] font-black bg-[#FF5722] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Gestão de Riscos e Desastres
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                Apoio à Decisão do Prefeito, Defesa Civil, Secretaria de Obras e Equipe Técnica
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider bg-white/10 px-3 py-2 rounded-xl">
              Atualizado: <strong className="text-white">{data?.lastUpdated || '--:--'}</strong>
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2F5FDB] hover:bg-[#254ab0] rounded-xl text-xs font-bold text-white uppercase tracking-wider transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Atualizar Dados</span>
            </button>

            {/* Menu de Exportação de Datasets */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#12B981] hover:bg-[#0f9d6e] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm">
                <Download size={14} /> Exportar Dataset
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1 hidden group-hover:block z-50">
                <button
                  onClick={() => handleExportDataset('xlsx')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Planilha XLSX (Excel)
                </button>
                <button
                  onClick={() => handleExportDataset('csv')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Arquivo CSV
                </button>
                <button
                  onClick={() => handleExportDataset('json')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Dados em JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Globais Translúcidos */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
            <Calendar size={14} className="text-slate-300" />
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent text-white focus:outline-none [&>option]:text-slate-900"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="12m">Últimos 12 meses</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
            <MapPin size={14} className="text-slate-300" />
            <select
              value={localidade}
              onChange={(e) => setLocalidade(e.target.value)}
              className="bg-transparent text-white focus:outline-none [&>option]:text-slate-900"
            >
              <option value="todas">Todas as Localidades</option>
              <option value="Centro">Centro</option>
              <option value="Vila Jetibá">Vila Jetibá</option>
              <option value="Caramuru">Caramuru</option>
              <option value="Rio Sabino">Rio Sabino</option>
              <option value="São Luiz">São Luiz</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
            <Filter size={14} className="text-slate-300" />
            <select
              value={tipologia}
              onChange={(e) => setTipologia(e.target.value)}
              className="bg-transparent text-white focus:outline-none [&>option]:text-slate-900"
            >
              <option value="todas">Todas as Tipologias</option>
              <option value="Estrutural">Estrutural</option>
              <option value="Geológico">Geológico / Geotécnico</option>
              <option value="Hidrológico">Hidrológico</option>
              <option value="Ambiental">Ambiental</option>
            </select>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL - DASHBOARD MODULAR E DENSO */}
      <main className="flex-1 px-4 md:px-8 py-6 space-y-6 max-w-[1600px] mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw size={36} className="animate-spin text-[#2F5FDB]" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Processando inteligência analítica territorial...
            </p>
          </div>
        ) : (
          <>
            {/* Seção 1 - KPIs */}
            <BiKpiCards
              kpis={data?.kpis}
              data={data}
              onCardClick={(key) => setDrillDownFilter(key)}
            />

            {/* Seção 2 - Evolução Mensal e Tipologia */}
            <BiGridSec2 data={data} />

            {/* Seção 3 - Grid Analítico de 4 Cards */}
            <BiGridSec3 data={data} />

            {/* Seção 4 - Alertas INMET (Largura total) */}
            <BiSec4Alerts data={data} />
          </>
        )}
      </main>

      {/* MODAL UNIVERSAL DE DRILL-DOWN */}
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
