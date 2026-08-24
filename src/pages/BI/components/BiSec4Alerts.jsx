import React from 'react';
import { Line } from 'react-chartjs-2';

export default function BiSec4Alerts({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { stacked: true, border: { display: false } }
    },
    elements: {
      point: { radius: 0, hitRadius: 10, hoverRadius: 4 }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const defaultLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const labels = data?.monthlySeries?.map(m => m.label) || defaultLabels;

  // Inicializa arrays com 0 para os 12 meses
  let dPerigoPot = new Array(12).fill(0);
  let dPerigo = new Array(12).fill(0);
  let dGrandePerigo = new Array(12).fill(0);
  let dRiscoVida = new Array(12).fill(0);

  if (data?.alertasLista && data?.monthlySeries) {
    const keys = data.monthlySeries.map(m => m.key); // ["YYYY-MM", ...]

    data.alertasLista.forEach(a => {
      const dt = new Date(a.data || a.created_at);
      if (!isNaN(dt.getTime())) {
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        const idx = keys.indexOf(key);
        if (idx !== -1) {
          const nivel = String(a.nivel || '').toUpperCase();
          if (nivel.includes('RISCO À VIDA') || nivel.includes('RISCO A VIDA')) dRiscoVida[idx]++;
          else if (nivel.includes('GRANDE PERIGO') || nivel.includes('MUITO ALTO') || nivel === 'ALERTA') dGrandePerigo[idx]++;
          else if (nivel.includes('PERIGO POTENCIAL') || nivel.includes('BAIXO')) dPerigoPot[idx]++;
          else dPerigo[idx]++; // Default PERIGO ou ALTO
        }
      }
    });
  } else {
    dPerigoPot = [5, 8, 4, 10, 15, 12, 6, 8, 14, 20, 25, 18];
    dPerigo = [2, 4, 3, 5, 8, 6, 3, 4, 7, 10, 12, 9];
    dGrandePerigo = [0, 1, 0, 2, 3, 1, 0, 1, 2, 4, 5, 3];
    dRiscoVida = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 2, 1];
  }

  const areaData = {
    labels,
    datasets: [
      {
        label: 'Perigo Potencial',
        data: dPerigoPot,
        borderColor: '#12B981',
        backgroundColor: '#12B98180',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Perigo',
        data: dPerigo,
        borderColor: '#F5A623',
        backgroundColor: '#F5A62380',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Grande Perigo',
        data: dGrandePerigo,
        borderColor: '#FF5722',
        backgroundColor: '#FF572280',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Risco à Vida',
        data: dRiscoVida,
        borderColor: '#E0362B',
        backgroundColor: '#E0362B80',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const legends = [
    { label: 'Perigo Potencial', color: '#12B981' },
    { label: 'Perigo', color: '#F5A623' },
    { label: 'Grande Perigo', color: '#FF5722' },
    { label: 'Risco à Vida', color: '#E0362B' },
  ];

  return (
    <div className="bg-[#FFFFFF] p-6 rounded-[16px] shadow-[0_3px_14px_-4px_rgba(15,30,70,0.10),0_1px_3px_rgba(15,30,70,0.05)] w-full h-[400px] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-base font-extrabold text-[#0E1A3D]">Tendência de Alertas INMET</h2>
        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
          {legends.map(leg => (
            <div key={leg.label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: leg.color }}></span>
              {leg.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative w-full">
        <Line options={options} data={areaData} />
      </div>
    </div>
  );
}
