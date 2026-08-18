import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import {
  Layers, Maximize2, Minimize2, MapPin, Eye, Compass, Shield, Filter,
  CheckSquare, Camera, User, Calendar, X, AlertTriangle, CloudRain, Droplets
} from 'lucide-react';
import LimiteSMJLayer from '../../../components/LimiteSMJLayer';
import AreasRiscoLayer from '../../../components/AreasRiscoLayer';
import 'leaflet/dist/leaflet.css';

const BASE_MAPS = {
  cartoDark: {
    name: 'Escuro (Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO'
  },
  osm: {
    name: 'Mapa Padrão',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    name: 'Satélite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  }
};

export default function MapaInteligenciaTerritorial({ geoPoints = [], areasRiscoData }) {
  const [selectedBaseMap, setSelectedBaseMap] = useState('cartoDark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Filtro de Camadas Ativas
  const [activeLayers, setActiveLayers] = useState({
    Vistorias: true,
    Ocorrências: true,
    Interdições: true,
    EstaçõesMeteorológicas: true,
    RiosMonitorados: true,
    AreasRiscoGeoJSON: true,
    LimiteSMJ: true
  });

  const toggleLayer = (layerName) => {
    setActiveLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  const centerSMJ = [-20.0381, -40.7513];

  const filteredPoints = geoPoints.filter(p => {
    if (p.type === 'vistoria' && !activeLayers.Vistorias) return false;
    if (p.type === 'ocorrencia' && !activeLayers.Ocorrências) return false;
    if (p.type === 'interdicao' && !activeLayers.Interdições) return false;
    if (p.type === 'estacao_meteo' && !activeLayers.EstaçõesMeteorológicas) return false;
    if (p.type === 'estacao_hidro' && !activeLayers.RiosMonitorados) return false;
    return true;
  });

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-[100] rounded-none p-4' : 'h-[620px]'
    }`}>
      {/* Cabeçalho do Mapa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Compass size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              MAPA DE INTELIGÊNCIA TERRITORIAL
            </h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Geolocalização de Vistorias, Áreas de Risco, Ocorrências, Alertas e Estações
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Mapa Base */}
          <select
            value={selectedBaseMap}
            onChange={(e) => setSelectedBaseMap(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            {Object.keys(BASE_MAPS).map(k => (
              <option key={k} value={k}>{BASE_MAPS[k].name}</option>
            ))}
          </select>

          {/* Botão de Tela Cheia */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Contêiner Principal do Mapa e Painéis */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <MapContainer
          center={centerSMJ}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url={BASE_MAPS[selectedBaseMap].url}
            attribution={BASE_MAPS[selectedBaseMap].attribution}
          />

          {/* Camada do Limite Municipal de Santa Maria de Jetibá */}
          {activeLayers.LimiteSMJ && <LimiteSMJLayer />}

          {/* Camada de Áreas de Risco Mapeadas (GeoJSON) */}
          {activeLayers.AreasRiscoGeoJSON && areasRiscoData && (
            <AreasRiscoLayer geojsonData={areasRiscoData} />
          )}

          {/* Marcadores de Pontos de Vistoria, Ocorrências, Alertas */}
          <LayerGroup>
            {filteredPoints.map((pt) => (
              <CircleMarker
                key={pt.id}
                center={[pt.lat, pt.lng]}
                radius={pt.type === 'estacao_meteo' || pt.type === 'estacao_hidro' ? 10 : 8}
                pathOptions={{
                  fillColor: pt.color,
                  color: '#ffffff',
                  weight: 2,
                  fillOpacity: 0.85
                }}
                eventHandlers={{
                  click: () => setSelectedPoint(pt)
                }}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-white">
                      {pt.layer} — {pt.nivelRisco || 'OK'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{pt.formattedId}</h4>
                    <p className="text-[11px] text-slate-600">{pt.bairro}</p>
                    <button
                      onClick={() => setSelectedPoint(pt)}
                      className="mt-2 text-[10px] font-bold text-blue-600 underline block"
                    >
                      Ver Painel Detalhado →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </LayerGroup>
        </MapContainer>

        {/* Legenda Flutuante */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl shadow-lg max-w-xs text-xs">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
            Legenda de Níveis de Risco
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-bold text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> R1 - Baixo
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> R2 - Médio
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> R3 - Alto
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> R4 - Muito Alto
            </div>
          </div>
        </div>

        {/* Control de Camadas Flutuante (Filtro de Camadas) */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl shadow-lg text-xs w-48">
          <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px] text-slate-400 mb-2">
            <Layers size={14} /> Camadas Ativas
          </div>
          <div className="space-y-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            {Object.keys(activeLayers).map(layerKey => (
              <label key={layerKey} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={activeLayers[layerKey]}
                  onChange={() => toggleLayer(layerKey)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate">{layerKey.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Drawer / Painel Lateral de Detalhes do Ponto Clicado */}
        {selectedPoint && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 z-[500] bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-l border-slate-200 dark:border-slate-800 p-5 overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white" style={{ backgroundColor: selectedPoint.color }}>
                    {selectedPoint.nivelRisco || 'INFO'}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                    {selectedPoint.formattedId}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedPoint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Localidade / Bairro</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedPoint.bairro}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Endereço</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{selectedPoint.endereco}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Latitude</span>
                    <p className="font-mono font-bold text-[11px]">{selectedPoint.lat.toFixed(5)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Longitude</span>
                    <p className="font-mono font-bold text-[11px]">{selectedPoint.lng.toFixed(5)}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tipologia / Categoria</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{selectedPoint.categoria}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Responsável / Data</span>
                  <p className="font-medium flex items-center gap-2 mt-0.5">
                    <User size={14} className="text-slate-400" /> {selectedPoint.responsavel}
                  </p>
                  <p className="font-medium flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                    <Calendar size={14} /> {new Date(selectedPoint.data || Date.now()).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Providências & Descrição</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-medium leading-relaxed mt-1">
                    {selectedPoint.providencias}
                  </p>
                </div>

                {selectedPoint.fotos && selectedPoint.fotos.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Camera size={12} /> Galeria de Fotos ({selectedPoint.fotos.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {selectedPoint.fotos.slice(0, 4).map((f, idx) => (
                        <img
                          key={idx}
                          src={f.url || f}
                          alt="Registro"
                          className="w-full h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm"
            >
              Fechar Painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
