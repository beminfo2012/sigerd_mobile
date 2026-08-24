import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

export default function BiGridSec2({ data }) {
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, border: { display: false } },
    },
  };

  const defaultLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const labels = data?.monthlySeries?.map(m => m.label) || defaultLabels;
  
  const barData = {
    labels,
    datasets: [
      {
        label: 'Vistorias',
        data: data?.monthlySeries ? data.monthlySeries.map(m => m.vistorias) : [120, 150, 180, 90, 110, 160, 200, 220, 190, 140, 130, 170],
        backgroundColor: '#2F5FDB',
        borderRadius: 4,
        maxBarThickness: 20,
      },
      {
        label: 'Ocorrências',
        data: data?.monthlySeries ? data.monthlySeries.map(m => m.ocorrencias) : [30, 45, 60, 20, 25, 40, 70, 80, 50, 35, 25, 40],
        backgroundColor: '#FF5722',
        borderRadius: 4,
        maxBarThickness: 20,
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  const tipologiaMap = {
    'Estrutural': '#9AA2B6',
    'Ambiental': '#12B981',
    'Hidrológico': '#2F5FDB',
    'Geológico': '#FF5722',
    'Geológico / Geotécnico': '#FF5722',
    'Outros': '#CBD5E1'
  };

  let tipLabels = ['Estrutural', 'Ambiental', 'Hidrológico', 'Geológico'];
  let tipValues = [450, 120, 310, 280];
  let tipColors = ['#9AA2B6', '#12B981', '#2F5FDB', '#FF5722'];

  if (data?.tipologiaDistribution && data.tipologiaDistribution.length > 0) {
    tipLabels = [];
    tipValues = [];
    tipColors = [];
    data.tipologiaDistribution.forEach(t => {
      tipLabels.push(t.label);
      tipValues.push(t.count);
      tipColors.push(tipologiaMap[t.label] || tipologiaMap['Outros']);
    });
  }

  const tipologiaData = {
    labels: tipLabels,
    datasets: [{
      data: tipValues,
      backgroundColor: tipColors,
      borderWidth: 0,
    }]
  };

  const totalTipologia = tipologiaData.datasets[0].data.reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#FFFFFF] p-6 rounded-[16px] shadow-[0_3px_14px_-4px_rgba(15,30,70,0.10),0_1px_3px_rgba(15,30,70,0.05)] flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-extrabold text-[#0E1A3D]">Evolução Mensal</h2>
          <div className="flex gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F5FDB]"></span>
              Vistorias
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]"></span>
              Ocorrências
            </div>
          </div>
        </div>
        <div className="flex-1 relative w-full">
          <Bar options={barOptions} data={barData} />
        </div>
      </div>

      <div className="bg-[#FFFFFF] p-6 rounded-[16px] shadow-[0_3px_14px_-4px_rgba(15,30,70,0.10),0_1px_3px_rgba(15,30,70,0.05)] flex flex-col h-[400px]">
        <h2 className="text-base font-extrabold text-[#0E1A3D] mb-6">Tipologia de Risco</h2>
        
        <div className="flex flex-1 items-center justify-between gap-6">
          <div className="relative w-[50%] h-[250px] flex items-center justify-center">
            <Doughnut options={doughnutOptions} data={tipologiaData} />
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-manrope font-extrabold text-[#0E1A3D]">{totalTipologia}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4 max-h-[300px] overflow-y-auto pr-2">
            {tipologiaData.labels.map((label, idx) => {
              const value = tipologiaData.datasets[0].data[idx];
              const pct = totalTipologia > 0 ? ((value / totalTipologia) * 100).toFixed(1) : 0;
              const color = tipologiaData.datasets[0].backgroundColor[idx];
              return (
                <div key={label} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                    <span className="text-sm font-bold text-slate-700 truncate" title={label}>{label}</span>
                  </div>
                  <div className="flex items-end justify-between pl-5">
                    <span className="text-lg font-manrope font-extrabold text-slate-900">{value}</span>
                    <span className="text-xs font-bold text-slate-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
