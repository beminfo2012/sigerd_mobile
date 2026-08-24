import React from 'react';
import { Line } from 'react-chartjs-2';
import { ArrowUpRight, ArrowDownRight, Minus, FileText, AlertTriangle, Bell, Ban } from 'lucide-react';

export default function BiKpiCards({ kpis, data, onCardClick }) {
  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false, min: 0 } },
    elements: {
      point: { radius: 0, hitRadius: 0, hoverRadius: 0 },
      line: { tension: 0.4 }
    },
    interaction: { mode: null },
  };

  const mockSparkData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  // Extrai as sparklines dos dados reais (últimos 12 meses)
  const sparkVistorias = data?.monthlySeries?.map(m => m.vistorias) || mockSparkData;
  const sparkCriticos = data?.monthlySeries?.map(m => m.R4) || mockSparkData;
  const sparkAlertas = data?.monthlySeries?.map(m => m.alertas) || mockSparkData;

  // Interdições não estão na monthlySeries padrão, vamos agrupar pelo created_at
  const sparkInterdicoes = [...mockSparkData];
  if (data?.interdicoesList) {
    const now = new Date();
    data.interdicoesList.forEach(i => {
      const dt = new Date(i.data_interdicao || i.created_at);
      if (!isNaN(dt.getTime())) {
        const diffMonths = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
        if (diffMonths >= 0 && diffMonths < 12) {
          const idx = 11 - diffMonths;
          sparkInterdicoes[idx]++;
        }
      }
    });
  }

  const cards = [
    {
      key: 'vistorias',
      title: 'Vistorias Realizadas',
      value: kpis?.totalVistorias || 0,
      trend: kpis?.variacaoVistorias || '0%',
      trendStatus: (kpis?.variacaoVistorias || '').includes('-') ? 'negative' : 'positive',
      icon: <FileText size={20} className="text-[#2F5FDB]" />,
      iconBg: 'bg-[#2F5FDB]/10',
      sparkColor: '#2F5FDB',
      data: sparkVistorias
    },
    {
      key: 'criticos',
      title: 'Pontos Críticos (R4)',
      value: kpis?.riscoR4 || 0,
      trend: kpis?.trendR4 || '0%',
      trendStatus: (kpis?.trendR4 || '').includes('-') ? 'positive' : ((kpis?.trendR4 || '0%') === '0.0%' ? 'neutral' : 'negative'),
      icon: <AlertTriangle size={20} className="text-[#E0362B]" />,
      iconBg: 'bg-[#E0362B]/10',
      sparkColor: '#E0362B',
      data: sparkCriticos
    },
    {
      key: 'alertas',
      title: 'Alertas Vigentes',
      value: kpis?.alertasAtivos || 0,
      trend: kpis?.variacaoAlertas || '0%',
      trendStatus: (kpis?.variacaoAlertas || '').includes('-') ? 'positive' : ((kpis?.variacaoAlertas || '0%') === '0.0%' ? 'neutral' : 'negative'),
      icon: <Bell size={20} className="text-[#F5A623]" />,
      iconBg: 'bg-[#F5A623]/10',
      sparkColor: '#F5A623',
      data: sparkAlertas
    },
    {
      key: 'interdicoes',
      title: 'Interdições Ativas',
      value: kpis?.interdicoesVigentes || 0,
      trend: 'Ao longo do ano',
      trendStatus: 'neutral',
      icon: <Ban size={20} className="text-[#2F5FDB]" />,
      iconBg: 'bg-[#2F5FDB]/10',
      sparkColor: '#2F5FDB',
      data: sparkInterdicoes
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        let trendIcon = <Minus size={14} />;
        let trendColor = 'text-[#9AA2B6]';
        
        if (c.trendStatus === 'positive') {
          trendIcon = <ArrowDownRight size={14} />;
          if (c.key === 'vistorias') {
             trendIcon = <ArrowUpRight size={14} />;
          }
          trendColor = 'text-[#12B981]';
        } else if (c.trendStatus === 'negative') {
          trendIcon = <ArrowUpRight size={14} />;
          if (c.key === 'vistorias') {
             trendIcon = <ArrowDownRight size={14} />;
          }
          trendColor = 'text-[#E0362B]';
        }

        const chartData = {
          labels: c.data.map((_, i) => i),
          datasets: [{
            data: c.data,
            borderColor: c.sparkColor,
            backgroundColor: `${c.sparkColor}20`,
            borderWidth: 2,
            fill: true,
          }]
        };

        return (
          <div
            key={c.key}
            onClick={() => onCardClick && onCardClick(c.key)}
            className="bg-[#FFFFFF] p-5 rounded-[16px] shadow-[0_3px_14px_-4px_rgba(15,30,70,0.10),0_1px_3px_rgba(15,30,70,0.05)] cursor-pointer hover:shadow-lg transition-shadow flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-full ${c.iconBg}`}>
                {c.icon}
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-50 ${trendColor}`}>
                {trendIcon}
                <span>{c.trend}</span>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-3xl font-extrabold font-manrope text-slate-900 leading-none">
                {c.value}
              </div>
              <div className="text-xs font-semibold text-[#9AA2B6] mt-1 font-inter">
                {c.title}
              </div>
            </div>

            <div className="h-12 w-full mt-2">
              <Line options={sparklineOptions} data={chartData} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
