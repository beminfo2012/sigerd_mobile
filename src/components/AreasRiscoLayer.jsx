import React from 'react';
import { GeoJSON } from 'react-leaflet';

const getRiscoColor = (nivel) => {
  const n = String(nivel || '').toUpperCase();
  if (n.includes('R4') || n.includes('MUITO ALTO') || n.includes('IMINENTE')) return '#dc2626';
  if (n.includes('R3') || n.includes('ALTO')) return '#f97316';
  if (n.includes('R2') || n.includes('MÉDIO') || n.includes('MEDIO')) return '#f59e0b';
  if (n.includes('R1') || n.includes('BAIXO')) return '#22c55e';
  return '#f97316';
};

export const AreasRiscoLayer = ({ data, tiposAtivos }) => {
  if (!data) return null;
  const filtered = {
    ...data,
    features: data.features.filter(f => {
      if (!tiposAtivos || tiposAtivos.size === 0) return true;
      const tiposFeature = (f.properties?.tipo_risco || '')
        .split(',')
        .map(t => t.trim());
      return tiposFeature.some(t => tiposAtivos.has(t));
    })
  };

  if (!filtered.features.length) return null;

  return (
    <GeoJSON
      key={JSON.stringify([...(tiposAtivos || [])].sort())}
      data={filtered}
      style={(feature) => ({
        color: getRiscoColor(feature?.properties?.nivel_risco || ''),
        fillColor: getRiscoColor(feature?.properties?.nivel_risco || ''),
        fillOpacity: 0.35,
        weight: 2,
        opacity: 0.9
      })}
      onEachFeature={(feature, layer) => {
        const p = feature.properties || {};
        layer.bindPopup(`
          <div style="font-family:sans-serif;min-width:190px">
            <div style="font-size:10px;font-weight:900;color:#f97316;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">${p.setor || 'Área de Risco'}</div>
            <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:2px">${p.nivel_risco || ''}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:4px">${p.tipo_risco || ''}</div>
            <div style="font-size:10px;color:#94a3b8">${p.localizacao || ''}</div>
            ${p.imoveis_risco ? `<div style="font-size:10px;color:#ef4444;font-weight:700;margin-top:4px">🏠 ${p.imoveis_risco} imóvel(is) em risco</div>` : ''}
          </div>
        `);
      }}
    />
  );
};

export default AreasRiscoLayer;
