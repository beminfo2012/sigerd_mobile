import React, { useEffect, useState, useMemo, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../App'
import { api } from '../../services/api'
import {
    ClipboardList, ClipboardCheck, AlertTriangle, Timer, CloudRain, BarChart3,
    CloudUpload, Trash2, FileText, Flame, Zap, RefreshCw, Home, X, Users,
    ShieldAlert, Activity, Droplets, MapPin, Gauge, CheckCircle, Layers,
    Download, ChevronDown, ChevronRight, ExternalLink, Bell, MonitorPlay, Clock, Shield, Waves, Droplet, Wind
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap, Marker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import LimiteSMJLayer from '../../components/LimiteSMJLayer'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import OrthofotsLayer from '../../components/OrthofotsLayer'
import { BILinkFooter } from '../../components/dashboard/BILinkFooter'
import { APP_VERSION } from '../../version'


const createCustomPin = (color) => {
    return L.divIcon({
        className: 'custom-pin-marker',
        html: `
            <div class="marker-hover-effect" style="position: relative; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; transition: all 0.2s ease;">
                <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.15));">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
                    <circle cx="12" cy="9" r="3.5" fill="#ffffff"/>
                </svg>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

const createCustomDot = (color) => {
    return L.divIcon({
        className: 'custom-dot-marker',
        html: `
            <div class="marker-hover-effect" style="
                width: 16px;
                height: 16px;
                background-color: ${color};
                background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent);
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
            "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -7]
    });
};

const createSmallPluvioIcon = (station) => {
    const level = station.level || 'Normal';
    let color = '#22c55e';
    if (level === 'Extremo') color = '#ef4444';
    else if (level === 'Alerta') color = '#f97316';
    else if (level === 'Atenção') color = '#f59e0b';
    const isCritical = level === 'Extremo' || level === 'Alerta';

    return L.divIcon({
        className: 'custom-pluvio-active-small',
        html: `
            <div style="position: relative; width: 14px; height: 14px; display: flex; justify-content: center; align-items: center; opacity: 0.8; z-index: -1;">
                ${isCritical ? `<div style="position: absolute; top: 7px; left: 7px; width: 24px; height: 24px; background-color: transparent; border: 1.5px solid ${color}; border-radius: 50%; transform: translate(-50%, -50%); animation: pulse-ring-marker 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>` : ''}
                <div style="width: 14px; height: 14px; background-color: ${color}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 1.5px solid #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
            </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 14],
        popupAnchor: [0, -14]
    });
};


const createClusterIcon = (cluster) => {
    const childMarkers = cluster.getAllChildMarkers();
    let maxRank = 1;
    let maxColor = '#10b981'; // default green

    childMarkers.forEach(marker => {
        const color = marker.options.markerColor || '#10b981';
        let rank = 1;
        if (color === '#dc2626' || color === '#ef4444') {
            rank = 4;
        } else if (color === '#ea580c' || color === '#f97316') {
            rank = 3;
        } else if (color === '#f59e0b') {
            rank = 2;
        }
        if (rank > maxRank) {
            maxRank = rank;
            maxColor = color;
        }
    });

    const count = childMarkers.length;

    return L.divIcon({
        html: `
            <div class="marker-hover-effect" style="
                background-color: ${maxColor};
                background-image: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent);
                color: #ffffff;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 13px;
                border: 2px solid #ffffff;
                box-shadow: 0 3px 8px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
            ">
                ${count}
            </div>
        `,
        className: 'custom-marker-cluster-icon',
        iconSize: L.point(32, 32, true),
        iconAnchor: [16, 16]
    });
};

const LegendPin = ({ color }) => (
    <svg viewBox="0 0 24 24" width="12" height="12" className="inline-block flex-shrink-0" style={{ filter: 'drop-shadow(0px 1px 1.5px rgba(0,0,0,0.15))' }}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={color} stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="3.5" fill="#ffffff" />
    </svg>
);

const getMarkerColor = (loc) => {
    if (!loc) return '#3b82f6';
    if (loc.type === 'o') { // Ocorrência
        switch (loc.status) {
            case 'Cancelada': return '#64748b';
            case 'Em Análise': return '#f97316';
            case 'Em Atendimento': return '#f59e0b';
            case 'Atendido': return '#3b82f6';
            case 'Finalizada': return '#10b981';
            default: return '#ef4444'; // Pendente
        }
    } else if (loc.type === 'i') { // Interdição
        return loc.risk === 'Total' ? '#dc2626' : loc.risk === 'Parcial' ? '#ea580c' : '#f59e0b';
    } else { // Vistoria ('v')
        const riskStr = String(loc.nivelRisco || '').toLowerCase();
        if (riskStr.includes('iminente') || riskStr.includes('muito alto') || riskStr === 'r4') {
            return '#dc2626'; // Vermelho
        } else if (riskStr.includes('alto') || riskStr === 'r3') {
            return '#ea580c'; // Laranja
        } else if (riskStr.includes('médio') || riskStr.includes('medio') || riskStr === 'r2') {
            return '#f59e0b'; // Amarelo/Amber
        } else if (riskStr.includes('baixo') || riskStr === 'r1') {
            return '#10b981'; // Verde
        }
        return '#10b981'; // Fallback para baixo/outros
    }
};
import {
    getPendingSyncCount, syncPendingData, getAllVistoriasLocal,
    getRemoteVistoriasCache, pullAllData, resetDatabase, getManualReadings,
    getAllInterdicoesLocal, getAllAgendaLocal
} from '../../services/db'
import { getOcorrenciasLocal } from '../../services/ocorrenciasDb'
import { getShelters, getOccupants, getInventory } from '../../services/shelterDb'
import { generateSituationalReport } from '../../utils/situationalReportGenerator'
import { cemadenService, STATION_METADATA } from '../../services/cemaden'
import { getAlertasCemaden } from '../../services/alertasCemadenService'
import CemadenAlertBanner from '../../components/CemadenAlertBanner'
import { useToast } from '../../components/ToastNotification'
import { contingencyDb } from '../../services/contingencyDb'
import { supabase } from '../../services/supabase'
import { useNoprer } from '../Noprer/hooks/useNoprer'

// --- HELPER FUNCTIONS ---
const processBreakdown = (records) => {
    const counts = {};
    records.forEach(v => {
        const cat = v.categoria_risco || v.categoriaRisco || v.tipo_ocorrencia || v.tipoOcorrencia || v.risco_grau || v.riscoGrau || v.risco_tipo || v.tipo_interdicao || v.medida_tipo || v.cobrade_subtipo || 'Outros';
        const label = String(cat).trim() || 'Outros';
        counts[label] = (counts[label] || 0) + 1;
    });

    const colorPalette = {
        // Interdições Níveis / Grau de Risco
        'Muito Alto': 'bg-red-600',
        'MUITO ALTO': 'bg-red-600',
        'Alto': 'bg-red-500',
        'ALTO': 'bg-red-500',
        'Médio': 'bg-amber-500',
        'MÉDIO': 'bg-amber-500',
        'Moderado': 'bg-amber-500',
        'MODERADO': 'bg-amber-500',
        'Baixo': 'bg-emerald-500',
        'BAIXO': 'bg-emerald-500',
        'Total': 'bg-red-600',
        'Parcial': 'bg-orange-500',

        // Ocorrências Tipologias
        'Eventos Naturais / Climáticos': 'bg-sky-500',
        'EVENTOS NATURAIS / CLIMÁTICOS': 'bg-sky-500',
        'Climático / Meteorológico': 'bg-sky-500',
        'Quedas e Desabamentos': 'bg-orange-500',
        'QUEDAS E DESABAMENTOS': 'bg-orange-500',
        'Desabamento': 'bg-orange-500',
        'Reclamação de Rachadura/Trinca': 'bg-purple-500',
        'RECLAMAÇÃO DE RACHADURA/TRINCA': 'bg-purple-500',
        'Rachadura': 'bg-purple-500',
        'Salvamentos': 'bg-emerald-500',
        'SALVAMENTOS': 'bg-emerald-500',

        // Vistorias & Riscos Tipologias
        'Geológico / Geotécnico': 'bg-orange-500',
        'Risco Geológico': 'bg-orange-500',
        'Deslizamento': 'bg-orange-500',
        'Hidrológico': 'bg-blue-500',
        'Inundação': 'bg-blue-500',
        'Alagamento': 'bg-sky-400',
        'Inundação/Alagamento': 'bg-blue-500',
        'Enxurrada': 'bg-blue-600',
        'Estrutural': 'bg-purple-500',
        'Estrutural/Predial': 'bg-purple-500',
        'Ambiental': 'bg-emerald-500',
        'Tecnológico': 'bg-amber-500',
        'Infraestrutura Urbana': 'bg-indigo-500',
        'Sanitário': 'bg-rose-500',
        'Vendaval': 'bg-sky-600',
        'Granizo': 'bg-indigo-400',
        'Incêndio': 'bg-red-500',
        'Outros': 'bg-indigo-400'
    };

    const defaultColors = ['bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
    const total = records.length;

    const breakdownItems = Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        color: colorPalette[label] || defaultColors[idx % defaultColors.length]
    })).sort((a, b) => b.count - a.count);

    return breakdownItems;
};

const processLocations = (records, forcedType = null) => {
    return (records || [])
        .map(v => {
            const parseCoords = (input) => {
                const s = String(input || '');
                if (!s) return [null, null];
                const matches = s.match(/-?\d+[,.]\d+/g) || s.match(/-?\d+/g) || [];
                if (matches.length >= 2) {
                    return [
                        parseFloat(matches[0].replace(',', '.')),
                        parseFloat(matches[1].replace(',', '.'))
                    ];
                }
                return [null, null];
            };

            const [pLat, pLng] = v.coordenadas ? parseCoords(v.coordenadas) : [null, null];
            const [fLat, fLng] = (v.latitude || v.lat) ? parseCoords(`${v.latitude || v.lat}, ${v.longitude || v.lng}`) : [null, null];

            let lat = pLat || fLat;
            let lng = pLng || fLng;

            // Advanced type detection
            let type = forcedType;
            if (!type) {
                if (v.ocorrencia_id_format || v.ocorrencia_id || v.id_ocorrencia) type = 'o';
                else if (v.interdicao_id || v.interdicaoId || v.tipo_interdicao || v.id_interdicao || v.risco_tipo || v.medida_tipo || v.motivo_interdicao || v.status_interdicao) type = 'i';
                else if (v.vistoria_id || v.vistoriaId) type = 'v';
                else type = 'v';
            }

            const formattedId = type === 'o' ? (v.ocorrencia_id_format || v.ocorrencia_id || (v.id ? `OC-${String(v.id).split('-')[0].toUpperCase()}` : '---'))
                : type === 'i' ? (v.interdicao_id || v.interdicaoId || (v.id ? `INT-${String(v.id).split('-')[0].toUpperCase()}` : '---'))
                    : (v.vistoria_id || v.vistoriaId || (v.id ? `VST-${String(v.id).split('-')[0].toUpperCase()}` : '---'));

            const details = Array.isArray(v.subtipos_risco) ? v.subtipos_risco.join(', ') : (v.subtipos_risco || v.detalhes || v.details || v.subtipo || v.risco_descricao || v.motivo_interdicao || '');
            const dateMatch = v.data_ocorrencia || v.data_hora || v.data_vistoria || v.dataHora || v.created_at;

            // STRIP DATA: Only keep what is essential for the report UI to avoid QuotaExceededError in sessionStorage
            return {
                id: v.id,
                formattedId,
                lat,
                lng,
                risk: v.categoria_risco || v.categoriaRisco || v.risco_grau || v.riscoGrau || (type === 'o' ? 'Ocorrência' : type === 'i' ? (v.risco_tipo || 'Interdição') : 'Vistoria'),
                nivelRisco: v.nivel_risco || v.nivelRisco || v.risco_grau || v.riscoGrau || 'Outros',
                status: v.status || (v.synced ? 'Sincronizado' : 'Não Sincronizado'),
                details,
                date: dateMatch || new Date().toISOString(),
                type,
                // Interdiction specific fields
                risco_tipo: v.risco_tipo || v.riscoTipo,
                medida_tipo: v.medida_tipo || v.medidaTipo,
                coordenadas: v.coordenadas,
                interdicao_id: v.interdicao_id || v.interdicaoId,
                // Ocorrencia specific
                solicitante: v.solicitante,
                natureza: v.natureza,
                // Address/Location info
                bairro: v.bairro,
                logradouro: v.logradouro,
                comunidade: v.comunidade
            }
        })
        .filter(loc => loc !== null) || [];
};

const processLocalidadeBreakdown = (records) => {
    const counts = {};
    records.forEach(v => {
        const loc = v.bairro || v.comunidade || v.localidade || 'Não Informado';
        const label = loc.trim() || 'Não Informado';
        counts[label] = (counts[label] || 0) + 1;
    });

    const colors = [
        'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
        'bg-emerald-500', 'bg-teal-500', 'bg-orange-500',
        'bg-rose-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'
    ];
    const total = records.length;

    return Object.keys(counts).map((label, idx) => ({
        label,
        count: counts[label],
        percentage: total > 0 ? Math.round((counts[label] / total) * 100) : 0,
        color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
};

// --- SUB-COMPONENT: MAP AUTO BOUNDS ---
const MapAutoBounds = ({ locations }) => {
    const map = useMap();
    useEffect(() => {
        const validLocs = (locations || []).filter(l => l.lat && (l.lng || l.lon) && !isNaN(l.lat));
        if (validLocs.length > 0) {
            const bounds = validLocs.map(l => [l.lat, l.lng || l.lon]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }, [locations, map]);
    return null;
};

// --- SUB-COMPONENT: EVENT LOG CARD ---
const EventLogCard = ({ data, rainfall, cemadenAlerts }) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!data) return;
        const generatedEvents = [];

        (data.vistorias?.locations || []).forEach(v => {
            generatedEvents.push({ id: `vist-${v.id}`, time: new Date(v.date), title: `Emissão de Vistoria ${v.formattedId}`, desc: `${v.risk} - ${v.status} (${v.details})`, icon: '📋', color: 'text-blue-500' });
        });
        (data.ocorrencias?.locations || []).forEach(o => {
            generatedEvents.push({ id: `oco-${o.id}`, time: new Date(o.date), title: `Nova Ocorrência ${o.formattedId}`, desc: `${o.risk} - ${o.status}`, icon: '🏠', color: 'text-orange-500' });
        });
        (data.alerts || []).forEach((a, idx) => {
            generatedEvents.push({ id: `inmet-${idx}`, time: new Date(), title: `Aviso INMET Emitido`, desc: `${a.descricao || a.resumo || 'Alerta Meteorológico'}`, icon: '⚠️', color: 'text-red-500' });
        });
        (cemadenAlerts || []).forEach((c, idx) => {
            generatedEvents.push({ id: `cemaden-${idx}`, time: new Date(), title: `Aviso CEMADEN Emitido`, desc: `${c.tipo || 'Alerta Geo/Hidro'}: ${c.municipio || 'Santa Maria de Jetibá'}`, icon: '⚠️', color: 'text-red-500' });
        });
        (rainfall || []).filter(r => r.rainRaw > 0).forEach((r, idx) => {
            generatedEvents.push({ id: `pluvio-${idx}`, time: new Date(), title: `Pluviômetro CEMADEN`, desc: `${r.name} registrou ${r.rainRaw.toFixed(1)}mm (${r.level})`, icon: '🌧️', color: 'text-blue-400' });
        });

        generatedEvents.push({ id: `sys-1`, time: new Date(), title: `Sincronização do Sistema`, desc: `Dados atualizados com sucesso via SIGERD e plataformas parceiras`, icon: '🟢', color: 'text-emerald-500' });

        fetch('https://sigerd-mobile.vercel.app/api/boletim-meteorologico?limite=3')
            .then(res => res.json())
            .then(bolData => {
                if (bolData && bolData.boletins) {
                    bolData.boletins.forEach((b, idx) => {
                        generatedEvents.push({ id: `bol-${idx}`, time: new Date(), title: `Boletim Emitido`, desc: b.titulo, icon: '📊', color: 'text-indigo-500' });
                    });
                }
                generatedEvents.sort((a, b) => b.time - a.time);
                setEvents(generatedEvents.slice(0, 100));
            })
            .catch(() => {
                generatedEvents.sort((a, b) => b.time - a.time);
                setEvents(generatedEvents.slice(0, 100));
            });

    }, [data, rainfall, cemadenAlerts]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full w-full overflow-hidden transition-all">
            <div className="flex bg-slate-50 dark:bg-slate-800/80 p-2.5 border-b border-slate-100 dark:border-slate-800 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                        Registro de Eventos do Sistema
                    </h3>
                </div>
                <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full uppercase tabular-nums tracking-widest">100 Últimos</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar max-h-[250px]">
                {events.length === 0 && <div className="text-center text-slate-400 text-[10px] my-6 uppercase font-bold tracking-widest">Nenhum evento registrado</div>}
                {events.map(ev => (
                    <div key={ev.id} className="flex gap-2.5 relative group items-start">
                        <div className="w-px h-[calc(100%+8px)] bg-slate-200 dark:bg-slate-700/50 absolute left-[11px] top-4 z-0"></div>
                        <div className="w-6 h-6 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center text-[10px] z-10">
                            {ev.icon}
                        </div>
                        <div className="flex-1 pb-1 pt-0.5">
                            <div className="flex justify-between items-center mb-0.5 pr-1">
                                <span className={`text-[9px] font-black ${ev.color} leading-none uppercase tracking-widest truncate max-w-[65%]`}>{ev.title}</span>
                                <span className="text-[8px] font-bold text-slate-400 tabular-nums shrink-0 uppercase tracking-wider">
                                    {ev.time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {ev.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 pr-2">
                                {ev.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TV MODE VIEW ---
const TvModeDashboardView = ({
    data, weather, cemadenAlerts, rainfall, statusInfo,
    viewMode, setViewMode, mapFilter, mapStyle,
    navigate, activeContingencyPlan, load, refreshRainfall, getWeatherIcon,
    limiteSMJ
}) => {
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [layersOpen, setLayersOpen] = useState(true);
    const [shieldFilter, setShieldFilter] = useState(false);
    const [sheltersData, setSheltersData] = useState([]);
    const [crisisActive, setCrisisActive] = useState(false);
    const [customLayers, setCustomLayers] = useState([]);

    useEffect(() => {
        getShelters().then(s => setSheltersData(s || [])).catch(() => {});
    }, []);

    const countOcorrencias = data.ocorrencias?.locations?.length || 0;
    const avgRain = rainfall?.length ? (rainfall.reduce((a, b) => a + (b.rainRaw || 0), 0) / rainfall.length).toFixed(1) : '0.0';

    return (
        <div className={`h-screen w-screen bg-[#EEF1F7] flex flex-col overflow-hidden font-sans relative ${crisisActive ? 'ring-8 ring-red-500/50' : ''}`}>
            {/* Header Conforme Modelo HTML */}
            <header className="relative z-40 flex items-center gap-5 px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <img src="/logo_header.png" alt="SIGERD" className="w-[34px] h-[34px] shrink-0 object-contain" />
                    <div className="flex flex-col leading-tight">
                        <span className="font-black text-sm tracking-wider uppercase text-slate-800 font-sans">SIGERD</span>
                        <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Defesa Civil • SMJ</span>
                    </div>
                </div>

                <div className="flex flex-col gap-0.5 mr-auto">
                    <h1 className="font-sans text-base font-black tracking-wider uppercase text-slate-900 flex items-center gap-2">
                        MONITOR ESTRATÉGICO
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" /> AO VIVO
                        </span>
                    </h1>
                    <div className="text-[10.5px] text-slate-400 font-bold uppercase tracking-widest">SANTA MARIA DE JETIBÁ • ES</div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl font-bold">
                    <b className="text-slate-800 font-black">{3 + customLayers.length}</b> camadas ativas • <b className="text-slate-800 font-black">{countOcorrencias}</b> pontos
                </div>

                {weather?.current && (
                    <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 rounded-xl px-3.5 py-1.5 min-w-[130px]">
                        <span className="text-xl leading-none">{getWeatherIcon(weather.current.code)}</span>
                        <div>
                            <div className="font-bold text-base text-slate-800">{Math.round(weather.current.temp)}°C</div>
                            <div className="text-[10px] text-slate-400 font-semibold">Tempo Real</div>
                        </div>
                    </div>
                )}

                <div className="text-right pl-3.5 border-l border-slate-200 flex items-center gap-4">
                    <div>
                        <div className="font-black text-2xl text-slate-900 tabular-nums leading-none">
                            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            <span className="text-xs text-slate-400 font-bold ml-0.5">{new Date().toLocaleTimeString('pt-BR', { second: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </div>
                    </div>
                    <button onClick={() => window.close()} className="p-2 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 rounded-xl transition-all shadow-sm">
                        <X size={18} />
                    </button>
                </div>
            </header>

            {/* Stage: Mapa Principal & Painéis Flutuantes */}
            <div className="flex-1 relative min-h-0 p-3.5 flex">
                <div className="relative flex-1 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xl bg-white">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <MapAutoBounds locations={data.ocorrencias?.locations || []} />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <HeatmapLayer points={(data.ocorrencias?.locations || []).filter(l => l.lat && l.lng && !isNaN(Number(l.lat)))} show={true} options={{ radius: 40, blur: 25, opacity: 0.8 }} />
                        <LimiteSMJLayer keyId="limite-smj-full" />
                        
                        {/* Camada de Abrigos */}
                        {sheltersData?.map((s, idx) => {
                            const lat = parseFloat(s.latitude || s.lat || -20.025);
                            const lng = parseFloat(s.longitude || s.lng || -40.745);
                            if (isNaN(lat) || isNaN(lng)) return null;
                            const ocupacao = s.ocupacao_atual || s.ocupantes || 0;
                            const cap = s.capacidade || 100;
                            const isFull = ocupacao >= cap;
                            const pinColor = isFull ? '#ef4444' : '#DB2777';

                            const shelterIcon = L.divIcon({
                                className: 'custom-shelter-marker',
                                html: `<div style="background-color: ${pinColor}; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏠</div>`,
                                iconSize: [28, 28],
                                iconAnchor: [14, 14],
                                popupAnchor: [0, -14]
                            });

                            return (
                                <Marker key={`shelter-full-${idx}`} position={[lat, lng]} icon={shelterIcon}>
                                    <Popup>
                                        <div className="p-2 font-sans min-w-[180px]">
                                            <div className="font-black text-xs text-pink-700 uppercase mb-1">{s.name || s.nome || 'Abrigo Municipal'}</div>
                                            <div className="text-[11px] font-bold text-slate-700 mb-1">Capacidade: {cap} pessoas</div>
                                            <div className="text-[11px] font-bold text-slate-700 mb-2">Ocupação Atual: <span className={isFull ? 'text-red-600 font-black' : 'text-emerald-600'}>{ocupacao}</span></div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                                <div className={`h-full ${isFull ? 'bg-red-500' : 'bg-pink-600'}`} style={{ width: `${Math.min(100, Math.round((ocupacao / cap) * 100))}%` }}></div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    {/* FAB Stack Canto Superior Esquerdo */}
                    <div className="absolute top-3.5 left-3.5 z-[500] flex flex-col gap-2">
                        <button
                            onClick={() => setLayersOpen(!layersOpen)}
                            className={`w-10 h-10 rounded-xl border border-slate-200 shadow-md flex items-center justify-center transition-all ${layersOpen ? 'bg-[#FF7A33] text-white border-[#FF7A33]' : 'bg-white/90 text-slate-700 hover:bg-slate-50'}`}
                            title="Camadas"
                        >
                            <Layers size={18} />
                        </button>
                        <button
                            onClick={() => setShieldFilter(!shieldFilter)}
                            className={`w-10 h-10 rounded-xl border border-slate-200 shadow-md flex items-center justify-center transition-all ${shieldFilter ? 'bg-[#FF7A33] text-white border-[#FF7A33]' : 'bg-white/90 text-slate-700 hover:bg-slate-50'}`}
                            title="Modo Defesa Civil (Somente Risco)"
                        >
                            <ShieldAlert size={18} />
                        </button>
                    </div>

                    {/* Painel Retrátil de Camadas do Modelo */}
                    {layersOpen && (
                        <div className="absolute top-3.5 left-16 z-[500] w-64 max-h-[calc(100%-80px)] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl flex flex-col p-3.5 gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="font-sans text-xs font-black uppercase tracking-widest text-slate-800">▾ Camadas</h3>
                            </div>
                            <div className="overflow-y-auto space-y-2 text-xs font-semibold text-slate-600 pr-1">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-1">Camadas SIGERD</div>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                                    <input type="checkbox" defaultChecked className="accent-[#FF7A33] rounded" />
                                    <span className="w-2.5 h-2.5 rounded bg-orange-500" /> Perímetro do Município
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                                    <input type="checkbox" defaultChecked className="accent-[#FF7A33] rounded" />
                                    <span className="w-2.5 h-2.5 rounded bg-red-500" /> Áreas de Risco GeoJSON
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                                    <input type="checkbox" defaultChecked className="accent-[#FF7A33] rounded" />
                                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Ocorrências & Vistorias
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                                    <input type="checkbox" defaultChecked className="accent-[#FF7A33] rounded" />
                                    <span className="w-2.5 h-2.5 rounded bg-pink-600" /> Abrigos de Emergência
                                </label>
                            </div>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.geojson,.json,.kml,.kmz';
                                    input.onchange = (e) => {
                                        if (e.target.files?.[0]) {
                                            setCustomLayers([...customLayers, e.target.files[0].name]);
                                        }
                                    };
                                    input.click();
                                }}
                                className="mt-2 border-1.5 border-dashed border-slate-300 hover:border-[#FF7A33] hover:bg-orange-500/5 text-slate-600 hover:text-[#FF7A33] py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5"
                            >
                                ＋ Adicionar camada
                            </button>
                            <span className="text-[9px] text-slate-400 font-medium text-center">KMZ, KML ou GeoJSON — lido no navegador</span>
                        </div>
                    )}

                    {/* Legenda de Severidade Canto Inferior Esquerdo */}
                    <div className="absolute bottom-3.5 left-3.5 z-[490] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex gap-3 text-[10px] font-bold text-slate-600">
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />Baixo</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />Médio</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F5C518]" />Alto</div>
                        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />Crítico</div>
                    </div>

                    {/* Botão FAB Canto Inferior Direito para Abrir Drawer */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="absolute bottom-3.5 right-3.5 z-[500] w-11 h-11 rounded-xl bg-white/95 border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                        title="Painel de Indicadores"
                    >
                        <Activity size={20} />
                    </button>
                </div>

                {/* Drawer Lateral de Indicadores & Alertas (Fiel ao Modelo HTML) */}
                {drawerOpen && (
                    <div className="absolute top-0 right-0 h-full w-[360px] max-w-[88vw] z-[600] bg-white/95 backdrop-blur-lg border-l border-slate-200 shadow-2xl p-4 flex flex-col gap-3.5 overflow-y-auto animate-in slide-in-from-right duration-300 font-sans">
                        <div className="flex items-center justify-between">
                            <h2 className="font-sans text-xs font-black uppercase tracking-widest text-slate-800">Indicadores & Alertas</h2>
                            <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-100 font-bold">✕</button>
                        </div>

                        {/* Gauge de Contingência do Modelo */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">◆ NÍVEL DE CONTINGÊNCIA</div>
                            <svg className="w-full max-w-[180px] h-auto" viewBox="0 0 240 150">
                                <defs>
                                    <linearGradient id="htmlGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="33%" stopColor="#22C55E" />
                                        <stop offset="66%" stopColor="#F5C518" />
                                        <stop offset="100%" stopColor="#EF4444" />
                                    </linearGradient>
                                </defs>
                                <path d="M 20 130 A 100 100 0 0 1 220 130" fill="none" stroke="url(#htmlGaugeGrad)" strokeWidth="16" strokeLinecap="round" opacity="0.9" />
                                <g transform={`rotate(${statusInfo.label === 'NORMAL' ? -25 : statusInfo.label === 'ATENÇÃO' ? 35 : 80} 120 130)`} style={{ transformOrigin: '120px 130px', transition: 'transform 1.1s cubic-bezier(.3,1.3,.4,1)' }}>
                                    <line x1="120" y1="130" x2="120" y2="42" stroke="#16213E" strokeWidth="4" strokeLinecap="round" />
                                </g>
                                <circle cx="120" cy="130" r="9" fill="#16213E" />
                                <circle cx="120" cy="130" r="4" fill="#FFFFFF" />
                            </svg>
                            <div className="font-extrabold text-base text-slate-800 mt-1">
                                Nível <span className="text-amber-700">{statusInfo.label === 'NORMAL' ? '1' : statusInfo.label === 'ATENÇÃO' ? '2' : '3'}</span> — <span>{statusInfo.label}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Chuva moderada na região. Equipes em prontidão.</div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" style={{ width: statusInfo.label === 'NORMAL' ? '25%' : '75%' }} />
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-2">Protocolo de monitoramento ativo</div>
                        </div>

                        {/* KPI Cards (Ocorrências e Chuva) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-50/20 border border-blue-200/60 p-3.5 rounded-2xl">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span>Ocorrências</span><span>⚠️</span></div>
                                <div className="text-3xl font-black text-slate-800 leading-none mt-2">{countOcorrencias}</div>
                                <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">Hoje</div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-50/20 border border-indigo-200/60 p-3.5 rounded-2xl">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider"><span>Chuva</span><span>💧</span></div>
                                <div className="text-3xl font-black text-slate-800 leading-none mt-2">{avgRain}<span className="text-xs font-bold text-slate-500 ml-1">mm</span></div>
                                <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">Média 24h</div>
                            </div>
                        </div>

                        {/* Estações Pluviométricas */}
                        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">◆ Estações Pluviométricas</div>
                            <div className="space-y-1 text-xs text-slate-600 font-semibold">
                                <div className="flex justify-between p-1.5 bg-slate-50 rounded-lg"><span>E1 • Alto Jequitibá</span><span className="text-indigo-600 font-bold">12mm</span></div>
                                <div className="flex justify-between p-1.5 bg-slate-50 rounded-lg"><span>E2 • Garrafão</span><span className="text-indigo-600 font-bold">8mm</span></div>
                                <div className="flex justify-between p-1.5 bg-slate-50 rounded-lg"><span>E3 • Vale do Canaã</span><span className="text-amber-700 font-bold">31mm</span></div>
                                <div className="flex justify-between p-1.5 bg-slate-50 rounded-lg"><span>E4 • Sede</span><span className="text-indigo-600 font-bold">5mm</span></div>
                            </div>
                        </div>

                        {/* Feed de Alertas em Tempo Real */}
                        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2 flex-1 flex flex-col">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">◆ Alertas em Tempo Real</div>
                            <div className="space-y-2 overflow-y-auto flex-1 text-xs">
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                                    <span className="text-blue-500">💧</span>
                                    <div><div className="font-medium text-slate-800">Pluviômetro E3 registrou 31mm nas últimas 3h.</div><div className="text-[9px] text-slate-400 font-bold">agora</div></div>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                                    <span className="text-amber-500">📋</span>
                                    <div><div className="font-medium text-slate-800">Vistoria de encosta criada em área de risco.</div><div className="text-[9px] text-slate-400 font-bold">há 5 min</div></div>
                                </div>
                            </div>
                        </div>

                        {/* Botão de Controle de Crise do Modelo */}
                        <button
                            onClick={() => setCrisisActive(!crisisActive)}
                            className="w-full py-3 px-4 rounded-xl font-sans font-black uppercase text-xs tracking-wider text-amber-950 bg-gradient-to-r from-[#FF9457] to-[#FF7A33] shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            ⛔ Controle de Crise
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};// --- 1. TV STRATEGIC OVERVIEW (Dashboard Consolidado) ---
const TV_StrategicOverview = ({ data, statusInfo, isDark, rainfall, weather, sheltersData, navigate, activeContingencyPlan, getWeatherIcon, limiteSMJ }) => (
    <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-5 xl:gap-6 3xl:gap-8 4xl:gap-12 tv:gap-16 h-full">
        {/* Left Column: Contingencia, Previsão, Ações do Plano & Stats */}
        <div className="col-span-4 flex flex-col gap-3 md:gap-4 lg:gap-5 xl:gap-6 3xl:gap-8 4xl:gap-12 tv:gap-16 overflow-y-auto custom-scrollbar">
            {/* Indicador de Ponteiro (Gauge) do Nível de Contingência — Modelo HTML */}
            <div className="bg-white border border-slate-200 p-4 lg:p-5 xl:p-6 3xl:p-10 flex flex-col justify-center items-center text-center shadow-md rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] shrink-0">
                <div className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                    ◆ NÍVEL DE CONTINGÊNCIA
                </div>
                <div className="relative w-full max-w-[220px] flex flex-col items-center">
                    <svg className="w-full h-auto max-w-[200px]" viewBox="0 0 240 150">
                        <defs>
                            <linearGradient id="tvGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="33%" stopColor="#22C55E" />
                                <stop offset="66%" stopColor="#F5C518" />
                                <stop offset="100%" stopColor="#EF4444" />
                            </linearGradient>
                        </defs>
                        <path d="M 20 130 A 100 100 0 0 1 220 130" fill="none" stroke="url(#tvGaugeGrad)" strokeWidth="16" strokeLinecap="round" opacity="0.9" />
                        <g transform={`rotate(${statusInfo.label === 'NORMAL' ? -25 : statusInfo.label === 'ATENÇÃO' ? 35 : 80} 120 130)`} style={{ transformOrigin: '120px 130px', transition: 'transform 1.1s cubic-bezier(.3,1.3,.4,1)' }}>
                            <line x1="120" y1="130" x2="120" y2="42" stroke="#16213E" strokeWidth="4" strokeLinecap="round" />
                        </g>
                        <circle cx="120" cy="130" r="9" fill="#16213E" />
                        <circle cx="120" cy="130" r="4" fill="#FFFFFF" />
                    </svg>
                    <div className="font-extrabold text-lg text-slate-800 mt-1">
                        Nível <span className="text-amber-700">{statusInfo.label === 'NORMAL' ? '1' : statusInfo.label === 'ATENÇÃO' ? '2' : '3'}</span> — <span>{statusInfo.label}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-semibold mt-0.5">
                        {statusInfo.label === 'NORMAL' ? 'Monitoramento de rotina em curso.' : 'Chuva moderada/intensa na região. Equipes em prontidão.'}
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden border border-slate-200">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" style={{ width: statusInfo.label === 'NORMAL' ? '25%' : '75%' }} />
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1.5">Protocolo de monitoramento ativo</div>
                </div>

                {/* Resumo do Plano de Contingência / Ações Vigentes */}
                <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left space-y-2 mt-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                        <span className="text-[9px] lg:text-[10px] 3xl:text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={13} className="text-blue-600" /> Ações do Plano de Contingência
                        </span>
                        {activeContingencyPlan && (
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500 text-white">SCO Ativo</span>
                        )}
                    </div>
                    <ul className="space-y-1 text-[8px] lg:text-[9px] 3xl:text-xs text-slate-600 font-bold">
                        <li className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Monitoramento pluviométrico e limnímetrico contínuo (24h)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Equipes de campo e vistoria em sobreaviso operacional</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                            <span>Rede municipal de abrigos de emergência cadastrada</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => navigate?.('/contingencia')}
                        className="w-full mt-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[8px] lg:text-[9px] 3xl:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                        Abrir Plano de Contingência Completo <ExternalLink size={12} />
                    </button>
                </div>
            </div>

            {/* Previsão do Tempo 24h–48h */}
            <div className="bg-white border border-slate-200 p-4 lg:p-5 xl:p-6 3xl:p-10 rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] shadow-md shrink-0 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] lg:text-xs 3xl:text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <CloudRain size={16} className="text-blue-500" /> Previsão 24h – 48h (INMET / Meteo)
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">S. M. Jetibá</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Hoje (Próximas Horas)</span>
                        <div className="flex items-center justify-between my-1">
                            <span className="text-lg font-black text-slate-800 tabular-nums">{Math.round(weather?.current?.temp || 0)}°C</span>
                            <span className="text-xs font-bold text-blue-600">{weather?.daily?.[0]?.rainProb || 0}% chuva</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Umidade: {weather?.current?.humidity || 0}% • Vento: {Math.round(weather?.current?.wind || 0)}km/h</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Amanhã</span>
                        <div className="flex items-center justify-between my-1">
                            <span className="text-lg font-black text-slate-800 tabular-nums">
                                {weather?.daily?.[1]?.tempMax ? `${Math.round(weather.daily[1].tempMin)}°/${Math.round(weather.daily[1].tempMax)}°` : `${Math.round(weather?.current?.temp || 20)}°C`}
                            </span>
                            <span className="text-xs font-bold text-blue-600">{weather?.daily?.[1]?.rainProb || 20}% chuva</span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Prognóstico Estável</span>
                    </div>
                </div>
            </div>

            {/* Minicards de Métricas Rápidas */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <div className="bg-white border border-slate-200 p-3 lg:p-4 rounded-[18px] flex flex-col justify-center shadow-md">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                        <AlertTriangle size={14} className="text-blue-600" />
                        <span className="text-[7px] lg:text-[8px] 3xl:text-xs font-black uppercase tracking-widest">Ocorrências</span>
                    </div>
                    <span className="text-xl lg:text-2xl 3xl:text-4xl font-black text-slate-800 tabular-nums">{data.stats.activeOccurrences}</span>
                </div>
                <div className="bg-white border border-slate-200 p-3 lg:p-4 rounded-[18px] flex flex-col justify-center shadow-md">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                        <Droplets size={14} className="text-emerald-600" />
                        <span className="text-[7px] lg:text-[8px] 3xl:text-xs font-black uppercase tracking-widest">Média Chuva</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-xl lg:text-2xl 3xl:text-4xl font-black text-slate-800 tabular-nums">
                            {rainfall?.length ? (rainfall.reduce((a, b) => a + (b.rainRaw || 0), 0) / rainfall.length).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400">mm</span>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 p-3 lg:p-4 rounded-[18px] flex flex-col justify-center shadow-md">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                        <Home size={14} className="text-pink-600" />
                        <span className="text-[7px] lg:text-[8px] 3xl:text-xs font-black uppercase tracking-widest">Abrigos</span>
                    </div>
                    <span className="text-xl lg:text-2xl 3xl:text-4xl font-black text-slate-800 tabular-nums">{sheltersData?.length || 0}</span>
                </div>
            </div>
        </div>

        {/* Right Column: Mapa Único Consolidado com Controles do Modelo */}
        <div className="col-span-8 bg-white border border-slate-200 shadow-xl overflow-hidden relative rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px]">
            <div className="absolute top-4 left-4 lg:top-6 lg:left-6 xl:top-8 xl:left-8 3xl:top-12 3xl:left-12 z-[1000] bg-white/90 backdrop-blur-md px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3">
                <span className="text-[9px] lg:text-[10px] xl:text-xs 3xl:text-lg font-black text-slate-800 uppercase tracking-[2px]">Monitor Estratégico Único • Mapa Geral</span>
            </div>

            {/* FAB Stack: Botões Flutuantes e Controle de Upload do Modelo */}
            <div className="absolute top-16 left-4 lg:top-20 lg:left-6 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => alert("As camadas dinâmicas estão ativas no mapa. Use o controle flutuante para alterná-las.")}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-all"
                    title="Camadas de Risco"
                >
                    <Layers size={18} />
                </button>
                <button
                    onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = '.geojson,.json,.kml,.kmz';
                        fileInput.onchange = (e) => {
                            if (e.target.files?.[0]) {
                                alert(`Arquivo "${e.target.files[0].name}" recebido. Carregando dados no mapa client-side.`);
                            }
                        };
                        fileInput.click();
                    }}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white transition-all font-black text-base"
                    title="＋ Adicionar camada (KML, KMZ, GeoJSON)"
                >
                    ＋
                </button>
            </div>

            <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <MapAutoBounds locations={data.ocorrencias?.locations || []} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <HeatmapLayer points={(data.ocorrencias?.locations || []).filter(l => l.lat && l.lng && !isNaN(Number(l.lat)))} show={true} options={{ radius: 40, blur: 25, opacity: 0.8 }} />
                <LimiteSMJLayer keyId="limite-smj-strategic" />
                
                {/* Renderização da Camada de Abrigos (Ícone Rosa 🏠) */}
                {sheltersData?.map((s, idx) => {
                    const lat = parseFloat(s.latitude || s.lat || -20.025);
                    const lng = parseFloat(s.longitude || s.lng || -40.745);
                    if (isNaN(lat) || isNaN(lng)) return null;
                    const ocupacao = s.ocupacao_atual || s.ocupantes || 0;
                    const cap = s.capacidade || 100;
                    const isFull = ocupacao >= cap;
                    const pinColor = isFull ? '#ef4444' : '#DB2777';

                    const shelterIcon = L.divIcon({
                        className: 'custom-shelter-marker',
                        html: `
                            <div style="background-color: ${pinColor}; color: white; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; items-center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                                🏠
                            </div>
                        `,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14],
                        popupAnchor: [0, -14]
                    });

                    return (
                        <Marker key={`shelter-tv-${idx}`} position={[lat, lng]} icon={shelterIcon}>
                            <Popup>
                                <div className="p-2 font-sans min-w-[180px]">
                                    <div className="font-black text-xs text-pink-700 uppercase mb-1">{s.name || s.nome || 'Abrigo Municipal'}</div>
                                    <div className="text-[11px] font-bold text-slate-700 mb-1">Capacidade: {cap} pessoas</div>
                                    <div className="text-[11px] font-bold text-slate-700 mb-2">Ocupação Atual: <span className={isFull ? 'text-red-600 font-black' : 'text-emerald-600'}>{ocupacao}</span></div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                        <div className={`h-full ${isFull ? 'bg-red-500' : 'bg-pink-600'}`} style={{ width: `${Math.min(100, Math.round((ocupacao / cap) * 100))}%` }}></div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-lg flex gap-3 text-[10px] font-bold text-slate-600">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />Baixo</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />Médio</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F5C518]" />Alto</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />Crítico</div>
            </div>
            <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 text-[8px] lg:text-[9px] 3xl:text-sm font-black text-slate-700 uppercase tracking-widest shadow-lg flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" /> Mancha de Calor Ocorrências</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-600" /> 🏠 Abrigos de Emergência</div>
            </div>
        </div>
    </div>
);

// --- 2. TV CLIMATE CENTER (Monitoramento Climático Full-Screen) ---
const TV_ClimateCenter = ({ rainfall, weather, getWeatherIcon, limiteSMJ, baciasData }) => {
    const [selectedStation, setSelectedStation] = useState(null);
    const [showBacias, setShowBacias] = useState(false);
    const [mapStyle, setMapStyle] = useState('google');

    const sortedRain = [...(rainfall || [])].sort((a, b) => (b.rainRaw || 0) - (a.rainRaw || 0));
    const validStations = (rainfall || []).filter(s => s.lat && (s.lon || s.lng));

    return (
        <div className="relative h-full w-full rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] overflow-hidden border border-slate-200 shadow-2xl bg-slate-100 flex flex-col">
            {/* Full-Screen Map Container */}
            <div className="absolute inset-0 z-0">
                <MapContainer center={[-20.0246, -40.7464]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <MapAutoBounds locations={validStations} />
                    {mapStyle === 'google' && (
                        <TileLayer url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                    )}
                    {mapStyle === 'google_sat' && (
                        <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                    )}
                    {mapStyle === 'carto' && (
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={22} />
                    )}
                    {mapStyle === 'satellite' && (
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
                    )}
                    {mapStyle === 'osm' && (
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={22} />
                    )}
                    <LimiteSMJLayer keyId="limite-smj-climate-tv" />
                    {showBacias && baciasData && <BaciasLayer data={baciasData} />}
                    {validStations.map((station, idx) => (
                        <Marker
                            key={idx}
                            position={[station.lat, station.lon || station.lng]}
                            icon={createPluvioIcon(station)}
                            eventHandlers={{
                                click: () => setSelectedStation(station),
                                mouseover: () => setSelectedStation(station)
                            }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Top-Right Map Controls Toolbar (Videowall Context) */}
            <div className="absolute top-3 right-3 lg:top-4 lg:right-4 xl:top-6 xl:right-6 3xl:top-10 3xl:right-10 4xl:top-16 4xl:right-16 z-[1000] flex items-center gap-2 lg:gap-3 3xl:gap-5">
                <button
                    onClick={() => setShowBacias(prev => !prev)}
                    className={`flex items-center gap-1.5 lg:gap-2 3xl:gap-4 px-3 py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 3xl:px-8 3xl:py-5 4xl:px-12 4xl:py-7 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] xl:text-xs 3xl:text-lg 4xl:text-xl tv:text-2xl font-black uppercase tracking-widest transition-all shadow-xl backdrop-blur-md border ${showBacias ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30' : 'bg-white/90 text-slate-700 hover:bg-white border-slate-200'}`}
                >
                    <Waves className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 3xl:w-6 3xl:h-6 4xl:w-8 4xl:h-8" /> Bacias
                </button>

                <select
                    value={mapStyle}
                    onChange={(e) => setMapStyle(e.target.value)}
                    className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] lg:text-[10px] xl:text-xs 3xl:text-lg 4xl:text-xl tv:text-2xl px-3 py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 3xl:px-8 3xl:py-5 4xl:px-12 4xl:py-7 rounded-xl lg:rounded-2xl border border-slate-200 font-black uppercase tracking-wider focus:outline-none cursor-pointer shadow-xl"
                >
                    <option value="google">Google Maps</option>
                    <option value="google_sat">Google Satélite</option>
                    <option value="carto">CartoDB Light</option>
                    <option value="satellite">Satélite</option>
                    <option value="osm">OpenStreetMap</option>
                </select>
            </div>

            {/* Top-Left Floating Overlay: Top Estações (24h) */}
            <div className="absolute top-3 left-3 lg:top-4 lg:left-4 xl:top-6 xl:left-6 3xl:top-10 3xl:left-10 4xl:top-16 4xl:left-16 z-[1000] w-64 lg:w-72 xl:w-80 3xl:w-[28rem] 4xl:w-[36rem] tv:w-[44rem] max-h-[48vh] lg:max-h-[50vh] xl:max-h-[52vh] 3xl:max-h-[60vh] bg-white/95 backdrop-blur-md rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] p-3 lg:p-4 xl:p-5 3xl:p-8 4xl:p-12 tv:p-14 border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between pb-2 lg:pb-3 xl:pb-4 3xl:pb-6 mb-2 lg:mb-3 xl:mb-4 3xl:mb-6 border-b border-slate-100">
                    <h3 className="text-[10px] lg:text-xs xl:text-sm 3xl:text-xl 4xl:text-2xl tv:text-3xl font-black text-slate-800 uppercase tracking-[2px] lg:tracking-[3px] flex items-center gap-2 lg:gap-3">
                        <BarChart3 className="text-blue-600 w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10" /> TOP ESTAÇÕES
                    </h3>
                    <span className="text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 lg:px-2 lg:py-1 3xl:px-4 3xl:py-2 rounded-full">{sortedRain.length} ESTAÇÕES</span>
                </div>
                <div className="space-y-1.5 lg:space-y-2 xl:space-y-3 3xl:space-y-5 overflow-y-auto pr-1 custom-scrollbar flex-1">
                    {sortedRain.length === 0 ? (
                        <div className="text-center py-4 lg:py-6 text-slate-400 text-[9px] lg:text-[10px] xl:text-xs 3xl:text-base font-bold uppercase tracking-widest">Sem dados pluviométricos</div>
                    ) : (
                        sortedRain.map((s, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedStation(s)}
                                className={`p-2 lg:p-3 xl:p-4 3xl:p-6 4xl:p-8 rounded-xl lg:rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedStation?.name === s.name ? 'bg-blue-50/90 border-blue-300 shadow-sm' : 'bg-slate-50/80 border-slate-100 hover:bg-white hover:border-blue-200'}`}
                            >
                                <div className="flex gap-2 lg:gap-3 3xl:gap-5 items-center min-w-0 pr-2">
                                    <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6 rounded-full shrink-0 shadow-sm ${getPluvioColor(s.level)}`} />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] lg:text-[10px] xl:text-xs 3xl:text-lg 4xl:text-xl tv:text-2xl font-black text-slate-800 uppercase tracking-tight truncate">{s.name}</span>
                                        <span className="text-[7px] lg:text-[8px] 3xl:text-sm 4xl:text-base font-bold text-slate-400 uppercase tracking-widest">{s.level || 'Normal'}</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-0.5 lg:gap-1 3xl:gap-2 shrink-0">
                                    <span className="text-base lg:text-lg xl:text-xl 3xl:text-3xl 4xl:text-4xl tv:text-5xl font-black text-slate-800 tabular-nums">{(s.rainRaw || 0).toFixed(1)}</span>
                                    <span className="text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base text-slate-400 font-bold uppercase">mm</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom-Left Floating Overlay: Previsão Local */}
            <div className="absolute bottom-3 left-3 lg:bottom-4 lg:left-4 xl:bottom-6 xl:left-6 3xl:bottom-10 3xl:left-10 4xl:bottom-16 4xl:left-16 z-[1000] w-64 lg:w-72 xl:w-80 3xl:w-[28rem] 4xl:w-[36rem] tv:w-[44rem] bg-white/95 backdrop-blur-md rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] p-3 lg:p-4 xl:p-5 3xl:p-8 4xl:p-12 tv:p-14 border border-slate-200 shadow-2xl flex flex-col gap-2 lg:gap-3 xl:gap-4 3xl:gap-8">
                <div className="flex justify-between items-center pb-1.5 lg:pb-2 xl:pb-2 3xl:pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 lg:gap-3 3xl:gap-5">
                        <span className="text-xl lg:text-2xl xl:text-3xl 3xl:text-5xl 4xl:text-6xl tv:text-7xl">{getWeatherIcon(weather?.current?.code)}</span>
                        <div>
                            <span className="text-base lg:text-lg xl:text-xl 3xl:text-3xl 4xl:text-4xl tv:text-5xl font-black text-slate-800 tabular-nums leading-none block">{Math.round(weather?.current?.temp || 0)}°C</span>
                            <span className="text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base font-bold text-slate-400 uppercase tracking-widest">Santa Maria de Jetibá</span>
                        </div>
                    </div>
                    <span className="text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base font-black uppercase tracking-widest border border-slate-200 px-2 py-0.5 lg:px-3 lg:py-1 3xl:px-5 3xl:py-2 rounded-full bg-slate-50 text-slate-500">Previsão Local</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 lg:gap-2 3xl:gap-4">
                    <div className="bg-slate-50 p-2 lg:p-2.5 xl:p-3 3xl:p-5 rounded-xl lg:rounded-2xl text-center border border-slate-100">
                        <span className="block text-[7px] lg:text-[8px] 3xl:text-xs 4xl:text-sm font-bold uppercase tracking-widest text-slate-400 mb-0.5 3xl:mb-2">Umidade</span>
                        <span className="text-xs lg:text-sm 3xl:text-xl 4xl:text-2xl font-black text-blue-600">{weather?.current?.humidity || 0}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 lg:p-2.5 xl:p-3 3xl:p-5 rounded-xl lg:rounded-2xl text-center border border-slate-100">
                        <span className="block text-[7px] lg:text-[8px] 3xl:text-xs 4xl:text-sm font-bold uppercase tracking-widest text-slate-400 mb-0.5 3xl:mb-2">Vento</span>
                        <span className="text-xs lg:text-sm 3xl:text-xl 4xl:text-2xl font-black text-blue-600">{Math.round(weather?.current?.wind || 0)} km/h</span>
                    </div>
                    <div className="bg-slate-50 p-2 lg:p-2.5 xl:p-3 3xl:p-5 rounded-xl lg:rounded-2xl text-center border border-slate-100">
                        <span className="block text-[7px] lg:text-[8px] 3xl:text-xs 4xl:text-sm font-bold uppercase tracking-widest text-slate-400 mb-0.5 3xl:mb-2">Prob. Chuva</span>
                        <span className="text-xs lg:text-sm 3xl:text-xl 4xl:text-2xl font-black text-blue-600">{weather?.daily?.[0]?.rainProb || 0}%</span>
                    </div>
                </div>
            </div>

            {/* Bottom-Right Floating Card: Informações do Pluviômetro */}
            {selectedStation && (
                <div className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 xl:bottom-6 xl:right-6 3xl:bottom-10 3xl:right-10 4xl:bottom-16 4xl:right-16 z-[1000] w-56 lg:w-64 xl:w-72 3xl:w-[24rem] 4xl:w-[30rem] tv:w-[36rem] bg-white/95 backdrop-blur-md rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-3 duration-250">
                    <div className="bg-blue-600 text-white px-3 py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 3xl:px-8 3xl:py-5 flex justify-between items-center font-black text-[8px] lg:text-[9px] xl:text-[10px] 3xl:text-sm 4xl:text-base tv:text-lg uppercase tracking-widest">
                        <span>Informações do Pluviômetro</span>
                        <button onClick={() => setSelectedStation(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 3xl:w-6 3xl:h-6 4xl:w-8 4xl:h-8" />
                        </button>
                    </div>
                    <div className="p-3 lg:p-4 xl:p-5 3xl:p-8 space-y-1.5 lg:space-y-2 3xl:space-y-4 text-[9px] lg:text-[10px] xl:text-xs 3xl:text-lg 4xl:text-xl text-slate-700 font-bold tracking-tight">
                        <div className="text-slate-800 font-black text-[10px] lg:text-xs xl:text-sm 3xl:text-2xl 4xl:text-3xl border-b border-slate-100 pb-1.5 lg:pb-2 3xl:pb-4">{selectedStation.name}</div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Acumulado 24h:</span>
                            <span className="font-black text-blue-600 text-[10px] lg:text-xs xl:text-sm 3xl:text-2xl 4xl:text-3xl">{(selectedStation.rainRaw || selectedStation.acc24hr || 0).toFixed(1)} mm</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Nível:</span>
                            <span className="font-black" style={{ color: getPluvioColor(selectedStation.level) }}>{selectedStation.level || 'Normal'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Fonte:</span>
                            <span className="font-bold text-slate-600">{selectedStation.isManual ? 'Manual / DC' : 'CEMADEN'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Município:</span>
                            <span className="font-bold text-slate-600">S. M. DE JETIBÁ-ES</span>
                        </div>
                        {selectedStation.lat && (
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Coords:</span>
                                <span className="font-mono text-[8px] lg:text-[9px] xl:text-[10px] 3xl:text-base 4xl:text-lg text-slate-500">[{selectedStation.lat.toFixed(4)}, {(selectedStation.lon || selectedStation.lng || 0).toFixed(4)}]</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. TV OPERATIONS CENTER (Centro de Ocorrências) ---
const TV_OperationsCenter = ({ data, viewMode, setViewMode, mapStyle, areasRisco, limiteSMJ }) => {
    const list = [...(data.ocorrencias?.locations || []), ...(data.vistorias?.locations || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);

    return (
        <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-5 xl:gap-6 3xl:gap-8 4xl:gap-12 tv:gap-16 h-full">
            <div className="col-span-4 bg-white border border-slate-200 rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] p-4 lg:p-5 xl:p-6 3xl:p-12 4xl:p-16 tv:p-20 flex flex-col overflow-hidden shadow-md">
                <div className="flex justify-between items-center mb-4 lg:mb-5 xl:mb-6 3xl:mb-10 4xl:mb-14 tv:mb-16 shrink-0">
                    <h3 className="text-xs lg:text-sm xl:text-base 3xl:text-2xl 4xl:text-3xl tv:text-4xl font-black text-slate-800 uppercase tracking-[2px] lg:tracking-[3px] xl:tracking-[4px]">Chamados Ativos</h3>
                    <div className="bg-blue-600/10 text-blue-600 px-2 py-0.5 lg:px-3 lg:py-1 3xl:px-5 3xl:py-2 rounded-full text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base tv:text-lg font-black uppercase tracking-wider border border-blue-600/20">Monitoramento 24h</div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 lg:pr-2 xl:pr-3 space-y-2 lg:space-y-3 xl:space-y-4 3xl:space-y-6 custom-scrollbar">
                    {list.map((e, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 lg:p-4 xl:p-5 3xl:p-8 4xl:p-12 tv:p-16 rounded-xl lg:rounded-2xl xl:rounded-[24px] 3xl:rounded-[32px] border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:border-blue-100">
                            <div className="flex justify-between items-start mb-3 lg:mb-4 xl:mb-5 3xl:mb-8">
                                <div className="space-y-0.5 lg:space-y-1">
                                    <span className="text-[8px] lg:text-[9px] xl:text-[10px] 3xl:text-sm 4xl:text-base tv:text-lg font-black text-blue-600 uppercase tracking-widest">{e.localidade || 'Sede'}</span>
                                    <h4 className="text-xs lg:text-sm xl:text-base 3xl:text-2xl 4xl:text-3xl tv:text-4xl font-black text-slate-800 uppercase tracking-tight leading-snug">{e.details || e.risk}</h4>
                                </div>
                                <div className="px-2 py-0.5 lg:px-3 lg:py-1 xl:px-4 xl:py-1.5 bg-white rounded-lg text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-xs 4xl:text-sm tv:text-base font-black text-slate-400 uppercase tracking-wider border border-slate-100 shadow-sm shrink-0">
                                    {new Date(e.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div className={`px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg text-[8px] lg:text-[9px] xl:text-xs 3xl:text-base 4xl:text-lg font-black uppercase tracking-wider inline-block shadow-sm ${String(e.risk).includes('Iminente') || String(e.risk).includes('Alto') ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
                                }`}>
                                {e.nivelRisco || e.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-8 bg-white border border-slate-200 rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] overflow-hidden relative shadow-xl flex flex-col">
                <div className="absolute top-3 left-3 lg:top-4 lg:left-4 xl:top-6 xl:left-6 3xl:top-12 3xl:left-12 4xl:top-16 4xl:left-16 z-[1000] flex gap-2 lg:gap-3">
                    <div className="flex bg-white/90 backdrop-blur-xl p-1 lg:p-1.5 xl:p-2 rounded-xl lg:rounded-2xl border border-slate-200 shadow-2xl">
                        <button onClick={() => setViewMode('vistorias')} className={`px-4 py-2 lg:px-6 lg:py-2.5 xl:px-8 xl:py-3 3xl:px-12 3xl:py-5 4xl:px-16 4xl:py-6 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] xl:text-xs 3xl:text-base 4xl:text-lg font-black uppercase tracking-wider transition-all ${viewMode === 'vistorias' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Vistorias</button>
                        <button onClick={() => setViewMode('ocorrencias')} className={`px-4 py-2 lg:px-6 lg:py-2.5 xl:px-8 xl:py-3 3xl:px-12 3xl:py-5 4xl:px-16 4xl:py-6 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] xl:text-xs 3xl:text-base 4xl:text-lg font-black uppercase tracking-wider transition-all ${viewMode === 'ocorrencias' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Ocorrências</button>
                    </div>
                </div>
                <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <MapAutoBounds locations={list} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <HeatmapLayer points={list.filter(l => l.lat && l.lng && !isNaN(Number(l.lat)))} show={true} options={{ radius: 35, blur: 20, opacity: 0.7 }} />
                    <AreasRiscoLayer data={areasRisco} tiposAtivos={null} />
                    <LimiteSMJLayer keyId="limite-smj-ops" />
                    {list.filter(l => l.lat && l.lng && !isNaN(Number(l.lat))).map((loc, idx) => (
                        <Marker
                            key={idx}
                            position={[loc.lat, loc.lng]}
                            icon={createCustomPin(getMarkerColor(loc))}
                        />
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

// --- 4. TV HUMANITARIAN STRATEGIC ---
const TV_HumanitarianStrategic = () => {
    const [stats, setStats] = useState({ shelters: 0, occupants: 0, capacity: 1000, inventory: [] });
    useEffect(() => {
        Promise.all([getShelters(), getOccupants()]).then(([s, o]) => {
            setStats(prev => ({
                ...prev,
                shelters: s.length,
                occupants: o.length,
                capacity: s.reduce((acc, curr) => acc + (parseInt(curr.capacidade) || 0), 0)
            }));
        });
    }, []);

    const rate = stats.capacity > 0 ? (stats.occupants / stats.capacity) * 100 : 0;

    return (
        <div className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-5 xl:gap-6 3xl:gap-8 4xl:gap-12 tv:gap-16 h-full font-black">
            <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] p-5 lg:p-6 xl:p-8 3xl:p-14 4xl:p-20 tv:p-24 flex flex-col justify-between shadow-xl">
                <div>
                    <Home className="text-emerald-600 mb-4 lg:mb-5 xl:mb-6 3xl:mb-10 w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 3xl:w-20 3xl:h-20 4xl:w-28 4xl:h-28 tv:w-32 tv:h-32" />
                    <h3 className="text-xs lg:text-sm xl:text-base 3xl:text-2xl 4xl:text-3xl tv:text-4xl text-slate-400 uppercase tracking-[3px] lg:tracking-[4px] mb-1 font-black">Capacidade</h3>
                    <h2 className="text-3xl lg:text-4xl xl:text-5xl 3xl:text-8xl 4xl:text-9xl tv:text-[10rem] text-slate-800 tracking-tighter mb-2 lg:mb-3 3xl:mb-6 font-black">OCUPADO</h2>
                </div>

                <div className="space-y-4 lg:space-y-6 3xl:space-y-10">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] lg:text-xs xl:text-sm 3xl:text-xl 4xl:text-2xl font-black text-emerald-600 uppercase tracking-wider">Taxa de Ocupação</span>
                        <span className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-6xl 4xl:text-8xl tv:text-9xl text-slate-800 font-black">{Math.round(rate)}%</span>
                    </div>
                    <div className="w-full h-4 lg:h-5 xl:h-6 3xl:h-10 4xl:h-14 tv:h-18 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                        <div className={`h-full transition-all duration-1000 ${rate > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${rate}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-5 3xl:gap-8 mt-6 lg:mt-8 xl:mt-10 3xl:mt-14">
                    <div className="bg-slate-50 p-4 lg:p-5 xl:p-6 3xl:p-10 4xl:p-14 tv:p-16 rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="block text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base tv:text-lg text-slate-400 uppercase tracking-widest mb-1 lg:mb-1.5 font-black">Total Abrigos</span>
                        <span className="text-3xl lg:text-4xl xl:text-5xl 3xl:text-7xl 4xl:text-8xl tv:text-9xl text-slate-800 font-black leading-none">{stats.shelters}</span>
                    </div>
                    <div className="bg-slate-50 p-4 lg:p-5 xl:p-6 3xl:p-10 4xl:p-14 tv:p-16 rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-center">
                        <span className="block text-[7px] lg:text-[8px] xl:text-[9px] 3xl:text-sm 4xl:text-base tv:text-lg text-slate-400 uppercase tracking-widest mb-1 lg:mb-1.5 font-black">Pessoas</span>
                        <span className="text-3xl lg:text-4xl xl:text-5xl 3xl:text-7xl 4xl:text-8xl tv:text-9xl text-blue-600 font-black leading-none">{stats.occupants}</span>
                    </div>
                </div>
            </div>

            <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[40px] p-5 lg:p-6 xl:p-8 3xl:p-14 4xl:p-20 tv:p-24 shadow-xl flex flex-col gap-3 lg:gap-4 xl:gap-5 3xl:gap-8">
                <div className="flex items-center gap-3 lg:gap-4 xl:gap-5 pb-3 lg:pb-4 xl:pb-5 border-b border-slate-200">
                    <Users className="text-blue-600 w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 3xl:w-20 3xl:h-20 4xl:w-28 4xl:h-28" />
                    <h3 className="text-xl lg:text-2xl xl:text-3xl 3xl:text-5xl 4xl:text-6xl tv:text-7xl text-slate-800 uppercase tracking-tight font-black">Logística e Manutenção</h3>
                </div>
                <div className="flex-1 flex items-center justify-center border-2 lg:border-4 border-dashed border-slate-100 rounded-[16px] lg:rounded-[20px] xl:rounded-[24px] 3xl:rounded-[32px] opacity-40">
                    <div className="text-center">
                        <Activity className="mx-auto mb-4 lg:mb-5 xl:mb-6 text-slate-200 w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 3xl:w-32 3xl:h-32" />
                        <h4 className="text-sm lg:text-base xl:text-lg 3xl:text-2xl 4xl:text-3xl tv:text-4xl text-slate-300 uppercase tracking-[4px] lg:tracking-[6px] font-black">Módulo Extendido: Censo 2.0</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 5. TV SCO STRATEGIC (Gestão de Crise) ---
const TV_SCOStrategic = ({ plan }) => (
    <div className={`h-full w-full rounded-[20px] lg:rounded-[28px] xl:rounded-[32px] 3xl:rounded-[48px] border-4 lg:border-8 transition-all duration-1000 flex flex-col items-center justify-center text-center p-8 lg:p-12 xl:p-16 3xl:p-32 4xl:p-48 shadow-xl ${plan ? (plan.nivel === 'Calamidade' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200') : 'bg-white border-slate-200'
        }`}>
        {plan ? (
            <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl 3xl:max-w-7xl 4xl:max-w-screen-2xl space-y-4 lg:space-y-6 xl:space-y-8 3xl:space-y-16">
                <div className="flex justify-center mb-4 lg:mb-6">
                    <div className="p-4 lg:p-6 xl:p-8 3xl:p-16 4xl:p-24 rounded-full bg-white shadow-xl animate-bounce border border-slate-100 flex items-center justify-center">
                        <ShieldAlert className={`w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 3xl:w-48 3xl:h-48 4xl:w-64 4xl:h-64 ${plan.nivel === 'Calamidade' ? 'text-red-600' : 'text-orange-600'}`} />
                    </div>
                </div>
                <h2 className="text-xs lg:text-sm xl:text-base 3xl:text-5xl 4xl:text-7xl font-black text-slate-400 uppercase tracking-[4px] lg:tracking-[6px] xl:tracking-[8px] 3xl:tracking-[20px] tv:tracking-[30px] mb-1">SISTEMA DE COMANDO ATIVO</h2>
                <div className={`inline-block px-6 py-2 lg:px-8 lg:py-3 xl:px-12 xl:py-4 3xl:px-24 3xl:py-10 border border-slate-200 text-white text-xl lg:text-2xl xl:text-3xl 3xl:text-[10rem] 4xl:text-[14rem] font-black uppercase tracking-tighter shadow-2xl mb-4 lg:mb-6 rounded-xl lg:rounded-2xl xl:rounded-3xl ${plan.nivel === 'Calamidade' ? 'bg-red-600' : 'bg-orange-600'
                    }`}>
                    {plan.nivel}
                </div>
                <h3 className="text-base lg:text-lg xl:text-xl 3xl:text-8xl 4xl:text-9xl font-black text-slate-800 uppercase tracking-tight leading-none mb-4">{plan.motivo || 'Mobilização Geral'}</h3>
                <p className="text-xs lg:text-sm xl:text-base 3xl:text-4xl 4xl:text-5xl font-bold text-slate-500 max-w-md lg:max-w-xl xl:max-w-2xl mx-auto leading-relaxed">{plan.descricao || 'Células de comando centralizadas para resposta tática imediata.'}</p>

                <div className="pt-6 lg:pt-8 xl:pt-10 3xl:pt-28 flex justify-center gap-4 lg:gap-6 text-slate-400">
                    <div className="flex items-center gap-2 lg:gap-4 uppercase tracking-widest font-black text-[9px] lg:text-xs xl:text-sm 3xl:text-2xl">
                        <Timer className="animate-spin opacity-50 w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 3xl:w-10 3xl:h-10" /> TEMPO DE RESPOSTA ATIVO
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-4 lg:space-y-6 3xl:space-y-12 opacity-20 grayscale group hover:grayscale-0 transition-all cursor-default scale-95 lg:scale-100 xl:scale-110 3xl:scale-150">
                <Shield className="mx-auto text-slate-400 shadow-sm w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 3xl:w-64 3xl:h-64 4xl:w-80 4xl:h-80" />
                <h2 className="text-xs lg:text-sm xl:text-base 3xl:text-6xl 4xl:text-7xl font-black text-slate-400 uppercase tracking-[4px] lg:tracking-[6px] xl:tracking-[10px] 3xl:tracking-[20px] tv:tracking-[30px]">SCO EM ESPERA</h2>
                <p className="text-[8px] lg:text-[9px] xl:text-xs 3xl:text-2xl 4xl:text-3xl font-black text-slate-500 uppercase tracking-[2px] lg:tracking-[4px] 3xl:tracking-[6px]">NENHUM ALERTA CRÍTICO ATIVO NO MOMENTO</p>
            </div>
        )}
    </div>
);


// --- Função auxiliar de cor para áreas de risco ---
const getRiscoColor = (nivelRisco = '') => {
    const n = nivelRisco.toLowerCase();
    if (n.includes('r4') || n.includes('muito alto')) return '#dc2626';
    if (n.includes('r3') || n.includes('alto')) return '#f97316';
    if (n.includes('r2') || n.includes('médio') || n.includes('medio')) return '#f59e0b';
    return '#22c55e';
};

// --- Função auxiliar de cor para pluviômetros ---
const getPluvioColor = (level) => {
    if (level === 'Extremo') return '#ef4444';
    if (level === 'Alerta') return '#f97316';
    if (level === 'Atenção') return '#f59e0b';
    return '#22c55e';
};

const createPluvioIcon = (station) => {
    const rainVal = (station.rainRaw || station.acc24hr || 0).toFixed(1);
    const level = station.level || 'Normal';
    const color = getPluvioColor(level);

    return L.divIcon({
        className: 'custom-pluvio-active',
        html: `
            <div style="
                background-color: ${color};
                color: white;
                font-family: 'Outfit', 'Inter', system-ui, sans-serif;
                font-size: 11px;
                font-weight: 900;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ">
                ${rainVal}
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });
};

const BACIAS_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];
const getBaciaColor = (name) => {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    return BACIAS_COLORS[Math.abs(hash) % BACIAS_COLORS.length];
};

const BaciasLayer = ({ data }) => {
    if (!data || !data.features || data.features.length === 0) return null;
    return (
        <GeoJSON
            data={data}
            style={(feature) => {
                const color = getBaciaColor(feature.properties?.Name || 'Unknown');
                return {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2,
                    opacity: 0.8
                };
            }}
            onEachFeature={(feature, layer) => {
                const p = feature.properties || {};
                const color = getBaciaColor(p.Name || 'Unknown');
                layer.bindPopup(`
                    <div style="font-family:sans-serif;min-width:190px">
                        <div style="font-size:10px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Bacia Hidrográfica</div>
                        <div style="font-size:12px;font-weight:700;color:#1e293b;margin-bottom:4px">${p.Name || 'Bacia'}</div>
                        <div style="font-size:10px;color:#475569;max-height:150px;overflow-y:auto;line-height:1.4;">${p.description || ''}</div>
                    </div>
                `);
            }}
        />
    );
};

// --- Tipos de risco disponíveis agrupados por categoria ---
const CATEGORIAS_RISCO = [
    {
        id: 'abrigos',
        label: 'Abrigos e Logística Humanitária',
        color: '#DB2777',
        emoji: '🏠',
        subtipos: [
            { id: 'Abrigos Ativos', label: 'Abrigos e Apoio', emoji: '🏠', color: '#DB2777' },
        ]
    },
    {
        id: 'geologico',
        label: 'Riscos Geológicos',
        color: '#f97316',
        emoji: '⛰️',
        subtipos: [
            { id: 'Deslizamento de Solo', label: 'Deslizamento', emoji: '⛰️', color: '#f97316' },
            { id: 'Corrida de Massa', label: 'Corrida de Massa', emoji: '🪨', color: '#dc2626' },
            { id: 'Solapamento', label: 'Solapamento', emoji: '🏗️', color: '#8b5cf6' },
            { id: 'Erosão', label: 'Erosão', emoji: '🌿', color: '#f59e0b' },
        ]
    },
    {
        id: 'hidrologico',
        label: 'Riscos Hidrológicos',
        color: '#3b82f6',
        emoji: '🌊',
        subtipos: [
            { id: 'Inundação', label: 'Inundação', emoji: '🌊', color: '#3b82f6' },
            { id: 'Enxurrada', label: 'Enxurrada', emoji: '💧', color: '#2563eb' },
        ]
    }
];

// Flat list for easy lookup
const TIPOS_RISCO_FLAT = CATEGORIAS_RISCO.flatMap(c => c.subtipos);

// --- Componente inline para camada GeoJSON de áreas de risco ---
// Aceita tiposAtivos: Set ou null (null = todos)
const AreasRiscoLayer = ({ data, tiposAtivos }) => {
    if (!data) return null;
    // Filtra features pelos tipos selecionados
    const filtered = {
        ...data,
        features: data.features.filter(f => {
            if (!tiposAtivos || tiposAtivos.size === 0) return false;
            const tiposFeature = (f.properties?.tipo_risco || '')
                .split(',')
                .map(t => t.trim());
            return tiposFeature.some(t => tiposAtivos.has(t));
        })
    };
    if (!filtered.features.length) return null;
    return (
        <GeoJSON
            key={JSON.stringify([...tiposAtivos].sort())}
            data={filtered}
            style={(feature) => ({
                color: getRiscoColor(feature?.properties?.nivel_risco || ''),
                fillColor: getRiscoColor(feature?.properties?.nivel_risco || ''),
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5',
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

// --- Painel de controle de camadas dentro do mapa (estilo Leaflet) ---
const CamadasControl = ({ tiposAtivos, setTiposAtivos, position = 'topleft' }) => {
    const [open, setOpen] = useState(false);
    const totalAtivo = tiposAtivos.size;

    const toggleTipo = (id) => {
        setTiposAtivos(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (totalAtivo === TIPOS_RISCO_FLAT.length) {
            setTiposAtivos(new Set());
        } else {
            setTiposAtivos(new Set(TIPOS_RISCO_FLAT.map(t => t.id)));
        }
    };

    const toggleCategoria = (catId) => {
        const cat = CATEGORIAS_RISCO.find(c => c.id === catId);
        if (!cat) return;
        const subIds = cat.subtipos.map(s => s.id);
        const allSet = subIds.every(id => tiposAtivos.has(id));

        setTiposAtivos(prev => {
            const next = new Set(prev);
            if (allSet) subIds.forEach(id => next.delete(id));
            else subIds.forEach(id => next.add(id));
            return next;
        });
    };

    return (
        <div className="relative">
            {/* Botão principal — mesmo estilo do botão Leaflet */}
            <button
                onClick={() => setOpen(v => !v)}
                title="Camadas de risco"
                style={{
                    width: '34px',
                    height: '34px',
                    background: totalAtivo > 0 ? '#f97316' : 'white',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 5px rgba(0,0,0,.15)',
                    color: totalAtivo > 0 ? 'white' : '#374151',
                    transition: 'all 0.15s',
                    position: 'relative',
                }}
            >
                <ShieldAlert size={16} />
                {totalAtivo > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '8px',
                        fontWeight: 900,
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid white',
                    }}>{totalAtivo}</span>
                )}
            </button>

            {/* Painel expandido */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '42px',
                    background: 'white',
                    border: '2px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    padding: '10px',
                    minWidth: '200px',
                    fontFamily: 'sans-serif',
                }}>
                    {/* Header do painel */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#f97316', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Áreas de Risco</span>
                        <button
                            onClick={toggleAll}
                            style={{
                                fontSize: '8px',
                                fontWeight: 700,
                                color: totalAtivo === TIPOS_RISCO_FLAT.length ? '#ef4444' : '#3b82f6',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '2px 4px',
                            }}
                        >
                            {totalAtivo === TIPOS_RISCO_FLAT.length ? 'Desativar Todos' : 'Ativar Todos'}
                        </button>
                    </div>

                    {/* Lista de Categorias e Subtipos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                        {CATEGORIAS_RISCO.map(cat => {
                            const subIds = cat.subtipos.map(s => s.id);
                            const totalCat = subIds.filter(id => tiposAtivos.has(id)).length;
                            const isAllCat = totalCat === subIds.length;

                            return (
                                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {/* Categoria Header */}
                                    <div
                                        onClick={() => toggleCategoria(cat.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            background: '#f8fafc',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: `1px solid ${totalCat > 0 ? cat.color + '40' : '#e2e8f0'}`,
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        <div style={{
                                            width: '12px', height: '12px', border: `1.5px solid ${cat.color}`,
                                            borderRadius: '3px', background: isAllCat ? cat.color : (totalCat > 0 ? cat.color + '40' : 'transparent'),
                                            position: 'relative'
                                        }}>
                                            {isAllCat && <div style={{ position: 'absolute', top: '1px', left: '3px', width: '3px', height: '6px', borderRight: '1.5px solid white', borderBottom: '1.5px solid white', transform: 'rotate(45deg)' }} />}
                                        </div>
                                        <span style={{ fontSize: '10px', color: '#475569', fontWeight: 900, textTransform: 'uppercase', flex: 1 }}>{cat.label}</span>
                                        <span style={{ fontSize: '9px', fontWeight: 800, color: cat.color }}>{totalCat}/{subIds.length}</span>
                                    </div>

                                    {/* Subtipos */}
                                    <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {cat.subtipos.map(tipo => {
                                            const ativo = tiposAtivos.has(tipo.id);
                                            return (
                                                <label key={tipo.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={ativo}
                                                        onChange={() => toggleTipo(tipo.id)}
                                                        style={{ accentColor: tipo.color, width: '12px', height: '12px', cursor: 'pointer' }}
                                                    />
                                                    <span style={{ fontSize: '10px' }}>{tipo.emoji}</span>
                                                    <span style={{ fontSize: '10px', fontWeight: ativo ? 700 : 400, color: ativo ? '#1e293b' : '#64748b' }}>{tipo.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Rodapé informativo */}
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '8px', color: '#94a3b8', textAlign: 'center' }}>
                        {totalAtivo} de {TIPOS_RISCO_FLAT.length} subtipos ativos
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Painel de controle de estilos do mapa (estilo Leaflet) ---
const MapStyleControl = ({ mapStyle, setMapStyle, size = 18, isMobile = false }) => {
    const [open, setOpen] = useState(false);

    const styles = [
        { id: 'google', label: 'Google Maps', emoji: '🗺️' },
        { id: 'google_sat', label: 'Google Satélite', emoji: '🌅' },
        { id: 'positron', label: 'CartoDB Positron', emoji: '⚪' },
        { id: 'street', label: 'OpenStreetMap', emoji: '🏙️' },
        { id: 'satellite', label: 'Satélite', emoji: '🌅' },
        { id: 'dark', label: 'CartoDB Dark', emoji: '⚫' }
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                title="Estilo do mapa"
                className={isMobile 
                    ? "w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 active:scale-90 transition-transform"
                    : "w-[34px] h-[34px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center rounded-[4px] shadow-sm border-2 border-[rgba(0,0,0,0.2)] dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                }
            >
                <Layers size={size} />
            </button>

            {open && (
                <div 
                    className="absolute left-[44px] top-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-2 min-w-[170px] flex flex-col gap-1 z-[99999]"
                >
                    <div className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 px-2.5 pt-1">
                        Estilo do Mapa
                    </div>
                    {styles.map(style => (
                        <button
                            key={style.id}
                            onClick={() => {
                                setMapStyle(style.id);
                                setOpen(false);
                            }}
                            className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-bold transition-all ${
                                mapStyle === style.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            <span className="text-sm leading-none">{style.emoji}</span>
                            <span>{style.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: MOBILE VIEW ---
const MobileDashboardView = ({
    data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
    showReportMenu, setShowReportMenu, getWeatherIcon, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, timeFilter, setTimeFilter, mapStyle, setMapStyle,
    chartMode, setChartMode, activeContingencyPlan, load, loadRainfallOnly, limiteSMJ
}) => {
    const userProfile = useContext(UserContext);
    const isOperador = userProfile?.role === 'Operador';
    const [tiposRiscoAtivos, setTiposRiscoAtivos] = useState(new Set()); // inicia VAZIO (desativado)
    const [areasRiscoData, setAreasRiscoData] = useState(null);

    useEffect(() => {
        fetch('/Areas_de_risco.json')
            .then(r => r.json())
            .then(d => setAreasRiscoData(d))
            .catch(e => console.warn('[AreasRisco] Falha ao carregar JSON:', e));
    }, []);
    const currentData = viewMode === 'vistorias' ? data.vistorias : viewMode === 'ocorrencias' ? data.ocorrencias : (data.interdicoes || { stats: { total: 0 }, breakdown: [], localidadeBreakdown: [], locations: [] });
    const locations = currentData?.locations || [];
    const now = new Date();
    const isWithinTime = (dateStr) => {
        if (!dateStr || timeFilter === 'Todas') return true;
        const d = new Date(dateStr);
        if (timeFilter === 'Hoje') return d.toDateString() === now.toDateString();
        if (timeFilter === '24h') return now - d <= 24 * 60 * 60 * 1000;
        if (timeFilter === '7d') return now - d <= 7 * 24 * 60 * 60 * 1000;
        if (timeFilter === '30d') return now - d <= 30 * 24 * 60 * 60 * 1000;
        if (timeFilter === 'Mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
    };
    const filteredLocations = (mapFilter === 'Todas' ? locations : locations.filter(l => l.risk === mapFilter))
        .filter(l => isWithinTime(l.date || l.data_ocorrencia));
    const typologies = ['Todas', ...(currentData?.breakdown || []).map(b => b.label)];
    const displayedBreakdown = currentData?.chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown;

    // Calculate "Outros" for the breakdown if more than 5 items
    const breakdownToDisplay = (chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown) || [];
    const topItems = breakdownToDisplay.slice(0, 5);
    const otherItems = breakdownToDisplay.slice(5);
    const othersCount = otherItems.reduce((acc, curr) => acc + curr.count, 0);

    if (othersCount > 0) {
        const total = currentData?.stats?.total || 1;
        topItems.push({
            label: 'Outros',
            count: othersCount,
            percentage: Math.round((othersCount / total) * 100),
            color: 'bg-indigo-400'
        });
    }

    const isTvMode = new URLSearchParams(window.location.search).get('tvMode') === 'true';
    if (isTvMode) {
        return <TvModeDashboardView
            data={data}
            weather={weather}
            cemadenAlerts={cemadenAlerts}
            rainfall={rainfall}
            statusInfo={statusInfo}
            viewMode={viewMode}
            setViewMode={setViewMode}
            mapFilter={mapFilter}
            mapStyle={mapStyle}
            navigate={navigate}
            activeContingencyPlan={activeContingencyPlan}
            load={load}
            refreshRainfall={loadRainfallOnly}
            getWeatherIcon={getWeatherIcon}
            limiteSMJ={limiteSMJ}
        />
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24 font-sans">
            <div className="p-5 space-y-8">
                {/* SCO BANNER (MOBILE) */}
                {activeContingencyPlan && (
                    <div
                        className={`p-6 border border-slate-200 border shadow-2xl flex items-center gap-5 cursor-pointer active:scale-95 transition-all overflow-hidden relative group mb-6 ${activeContingencyPlan.nivel === 'Calamidade' ? 'bg-red-600 border-red-500 shadow-red-900/20' :
                            activeContingencyPlan.nivel === 'Emergência' ? 'bg-orange-600 border-orange-500 shadow-orange-900/20' : 'bg-amber-500 border-amber-400 font-black'
                            }`}
                        onClick={() => navigate('/contingencia')}
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-white backdrop-blur-md shadow-inner shrink-0 scale-110">
                            <ShieldAlert size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/20">SCO Ativo</span>
                                <span className="bg-white text-slate-800 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-sm">{activeContingencyPlan.nivel}</span>
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Operação SCO</h3>
                            <p className="text-white/80 text-xs font-bold truncate max-w-full">{activeContingencyPlan.motivo}</p>
                        </div>
                        <ChevronRight className="text-white opacity-40 group-active:translate-x-1 transition-transform" size={24} />
                    </div>
                )}

                {/* 1. Weather Widget (Image 1 Style - Mobile Exclusive) */}
                {weather?.current ? (
                    <div
                        onClick={() => setShowForecast(true)}
                        className="bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-md shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-slate-700/60 flex items-center justify-between cursor-pointer active:scale-98 transition-all mb-4"
                    >
                        <div className="flex items-center gap-5">
                            <div className="text-5xl sm:text-6xl drop-shadow-sm shrink-0">{getWeatherIcon(weather.current.code)}</div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{Math.round(weather.current.temp || 0)}</span>
                                    <span className="text-2xl font-bold text-slate-400 dark:text-slate-500">°C</span>
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Santa Maria de Jetibá</div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2.5 text-xs">
                                <Droplet size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-slate-400 dark:text-slate-400 font-medium">Chuva</span>
                                <span className="font-extrabold text-slate-900 dark:text-white ml-2">{weather.daily?.[0]?.rainProb || 0}%</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs">
                                <Clock size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-slate-400 dark:text-slate-400 font-medium">Umidade</span>
                                <span className="font-extrabold text-slate-900 dark:text-white ml-2">{weather.current.humidity || 0}%</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs">
                                <Wind size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="text-slate-400 dark:text-slate-400 font-medium">Vento</span>
                                <span className="font-extrabold text-slate-900 dark:text-white ml-2">{Math.round(weather.current.wind || 6)} km/h</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse mb-4 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            <div className="space-y-2">
                                <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                                <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        </div>
                        <div className="space-y-2.5 w-32">
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                    </div>
                )}

                <CemadenAlertBanner alerts={cemadenAlerts} />

                {/* 2. Indicadores Operacionais */}
                {!isOperador && (
                    <div>
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold text-[#0a1e3f] dark:text-gray-100 tracking-tight">Indicadores Operacionais</h2>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[1px] mt-0.5">Santa Maria de Jetibá</span>
                            </div>
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${syncing ? 'bg-blue-100 text-blue-600 animate-spin' : 'bg-blue-50/80 text-blue-500 border border-blue-100'}`}
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Sync Card */}
                            <div onClick={handleSync} className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 relative active:scale-95 transition-all group">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-active:scale-95 ${(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {syncing ? <CloudUpload size={20} className="animate-bounce" /> : <CloudUpload size={20} />}
                                </div>
                                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1 tabular-nums">
                                    {(syncDetail.vistorias + syncDetail.interdicoes) > 0 ? (syncDetail.vistorias + syncDetail.interdicoes) : '100%'}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sincronização</div>
                            </div>

                            {/* INMET Alerts */}
                            <div onClick={() => navigate('/alerts')} className="bg-white dark:bg-slate-800 p-5 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
                                <div className="bg-orange-500/10 text-orange-600 w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-active:scale-95">
                                    <Zap size={20} />
                                </div>
                                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1 tabular-nums">{data.stats.inmetAlertsCount || 0}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Avisos INMET</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Acesso Rápido - Circular Icons */}
                <div>
                    <h2 className="text-base font-bold text-[#0a1e3f] dark:text-slate-400 mb-5 px-1 tracking-tight">Acesso Rápido</h2>
                    <div className="grid grid-cols-4 gap-2 px-1 justify-items-center">
                        <div onClick={() => navigate('/monitoramento')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                <BarChart3 size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Pluviômetros</span>
                        </div>
                        {!isOperador && (
                            <div onClick={() => navigate('/assisthumanitaria')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                    <Home size={28} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Assisit. Humanitária</span>
                            </div>
                        )}
                        <div onClick={() => navigate('/ocorrencias')} className="flex flex-col items-center gap-2.5 cursor-pointer">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                                <ClipboardList size={28} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Ocorrências</span>
                        </div>
                        {!isOperador && (
                            <div className="flex flex-col items-center gap-2.5 relative">
                                <div onClick={() => setShowReportMenu(!showReportMenu)} className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 active:scale-90 transition-all cursor-pointer">
                                    <FileText size={28} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Relatórios</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Tipologia Breakdown */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-[#0a1e3f] dark:text-slate-100 tracking-tight">{viewMode === 'vistorias' ? 'Vistorias' : 'Ocorrências'}</h3>
                        <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100">
                            <button
                                onClick={() => setChartMode('tipologia')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartMode === 'tipologia' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Tipologia
                            </button>
                            <button
                                onClick={() => setChartMode('localidade')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${chartMode === 'localidade' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Localidade
                            </button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {topItems.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.color || 'bg-blue-500'}`} />
                                        <span className="text-[13px] font-bold text-[#0a1e3f] capitalize">{item.label}</span>
                                    </div>
                                    <span className="text-[13px] font-black text-[#0a1e3f]">{item.count}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-blue-500'}`} style={{ width: `${item.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                        {breakdownToDisplay.length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-xs font-bold">Sem dados registrados</div>
                        )}
                    </div>
                </div>

                {/* 5. Map Section */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 px-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-[2px]">Mapa Interativo</h3>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <MapPin size={12} className="text-blue-500" />
                                <select
                                    value={mapFilter}
                                    onChange={(e) => setMapFilter(e.target.value)}
                                    className="text-[10px] font-bold bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none"
                                >
                                    {typologies.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-[18px] border border-slate-100/50 dark:border-slate-700/50">
                            <button
                                onClick={() => { setViewMode('vistorias'); setMapFilter('Todas'); }}
                                className={`flex-1 py-3 text-[10px] font-black rounded-[14px] transition-all flex items-center justify-center ${viewMode === 'vistorias' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
                            >
                                Vistorias
                            </button>
                            <button
                                onClick={() => { setViewMode('ocorrencias'); setMapFilter('Todas'); }}
                                className={`flex-1 py-3 text-[10px] font-black rounded-[14px] transition-all flex items-center justify-center ${viewMode === 'ocorrencias' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
                            >
                                Ocorrências
                            </button>
                            <button
                                onClick={() => { setViewMode('interdicoes'); setMapFilter('Todas'); }}
                                className={`flex-1 py-3 text-[10px] font-black rounded-[14px] transition-all flex items-center justify-center ${viewMode === 'interdicoes' ? 'bg-white dark:bg-slate-700 shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500'}`}
                            >
                                Interdições
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className={`h-80 w-full rounded-[26px] overflow-hidden bg-slate-100 relative z-0 ${mapStyle === 'satellite' ? 'leaflet-satellite-wrapper' : ''}`}>
                            <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} maxZoom={22} className={mapStyle === 'satellite' ? 'leaflet-satellite-view' : ''}>
                                <CustomMapControls />
                                <MapAutoBounds locations={filteredLocations} />
                                {/* Map Style Toggle (Mobile - Absolute inside map) */}
                                <div className="absolute top-4 left-4 z-[9999] flex flex-col gap-1.5">
                                    <MapStyleControl mapStyle={mapStyle} setMapStyle={setMapStyle} size={20} isMobile={true} />
                                    {/* Controle de camadas de risco — painel inline */}
                                    <CamadasControl tiposAtivos={tiposRiscoAtivos} setTiposAtivos={setTiposRiscoAtivos} />
                                </div>


                                {mapStyle === 'google' && (
                                    <TileLayer url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                                )}
                                {mapStyle === 'google_sat' && (
                                    <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                                )}
                                {mapStyle === 'street' && (
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={22} />
                                )}
                                {mapStyle === 'positron' && (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={22} />
                                )}
                                {mapStyle === 'satellite' && (
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
                                )}
                                {mapStyle === 'dark' && (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={22} />
                                )}
                                <HeatmapLayer points={(filteredLocations || []).filter(l => l.lat && l.lng && !isNaN(Number(l.lat)))} show={mapStyle !== 'satellite'} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                                <OrthofotsLayer />
                                {/* Camada de Áreas de Risco (toggle por tipo) */}
                                {tiposRiscoAtivos.size > 0 && areasRiscoData && (
                                    <AreasRiscoLayer data={areasRiscoData} tiposAtivos={tiposRiscoAtivos} />
                                )}
                                <LimiteSMJLayer keyId="limite-smj-mobile1" />
                                {/* Pluviômetros CEMADEN - todos os com coordenadas válidas */}
                                {/* Pluviômetros CEMADEN - todos os com coordenadas válidas */}
                                {(rainfall || []).filter(s => s.lat && (s.lon || s.lng)).map((station, idx) => (
                                    <Marker
                                        key={`pluvio-web-${idx}`}
                                        position={[station.lat, station.lon || station.lng]}
                                        icon={createSmallPluvioIcon(station)}
                                        zIndexOffset={-1000}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <div className="font-bold text-sm mb-1">{station.name || 'Estação CEMADEN'}</div>
                                                <div className="text-xs text-slate-600">Acumulado 24h: <span className="font-bold text-blue-600">{(station.acc24hr || 0).toFixed(1)} mm</span></div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={60}>
                                    {filteredLocations?.filter(l => l.lat && l.lng && !isNaN(Number(l.lat))).map((loc, idx) => (
                                        <Marker
                                            key={idx}
                                            position={[loc.lat, loc.lng]}
                                            icon={createCustomDot(getMarkerColor(loc))}
                                            markerColor={getMarkerColor(loc)}
                                            loc={loc}
                                        >
                                            <Popup minWidth={180}>
                                                <div className="p-1 font-sans">
                                                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">
                                                        ID {viewMode === 'vistorias' ? 'VISTORIA' : viewMode === 'ocorrencias' ? 'OCORRÊNCIA' : 'INTERDIÇÃO'}: {loc.formattedId || 'N/A'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-700 mb-0.5">
                                                        <strong>Tipo:</strong> {loc.details || loc.risk || 'N/A'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-700 mb-0.5">
                                                        <strong>Data:</strong> {new Date(loc.date).toLocaleDateString('pt-BR')}
                                                    </div>
                                                    <div className="text-[11px] text-slate-700">
                                                        <strong>Risco:</strong> {loc.risk || 'N/A'}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MarkerClusterGroup>
                                <MapLegend viewMode={viewMode} rainfall={rainfall} tiposRiscoAtivos={tiposRiscoAtivos} isMobile={true} />
                            </MapContainer>
                        </div>
                    </div>
                </div>
                <div className="text-center py-8 opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-[4px] dark:text-white">SIGERD MOBILE V{APP_VERSION}</span>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: BOLETINS CARD ---
// --- PRAZOS E ALERTAS CARD ---
const PrazosAlertasCard = () => {
    const navigate = useNavigate();
    const [prazos, setPrazos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('todos'); // 'todos' | 'noprer' | 'agenda'
    const { fetchNoprers } = useNoprer();

    useEffect(() => {
        const loadPrazos = async () => {
            setLoading(true);
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Fetch Agendas
                const agendas = await getAllAgendaLocal().catch(() => []);
                
                // Fetch NOPRERs via hook to get correctly calculated statuses
                const noprers = await fetchNoprers().catch(() => []);

                const processadosAgenda = agendas
                    .filter(item => !item.concluido)
                    .map(item => {
                        const protocoloDate = item.data_abertura ? new Date(item.data_abertura) : new Date();
                        let prazoDias = 10;
                        const cat = (item.categoria_risco || '').toLowerCase();

                        if (cat.includes('estrutural') || cat.includes('predial')) prazoDias = 3;
                        else if (cat.includes('geolgico') || cat.includes('geotǸcnico')) prazoDias = 3;
                        else if (cat.includes('arvore') || cat.includes('ǭrvore')) prazoDias = 10;
                        else if (cat.includes('hidrolgico') || cat.includes('alagamento')) prazoDias = 2;

                        if (item.categoria_risco === 'Outros' && item.data_prevista) {
                            const dataLimite = new Date(item.data_prevista);
                            prazoDias = Math.floor((dataLimite - protocoloDate) / (1000 * 60 * 60 * 24));
                        }

                        const dLimite = new Date(protocoloDate);
                        dLimite.setDate(dLimite.getDate() + prazoDias);
                        dLimite.setHours(0, 0, 0, 0);

                        const diasRestantes = Math.floor((dLimite - today) / (1000 * 60 * 60 * 24));

                        return { 
                            diasRestantes,
                            titulo: (item.categoria_risco && item.categoria_risco !== 'Outros' ? item.categoria_risco : (item.observacao_outro || 'Agenda Geral')),
                            local: item.solicitante || item.endereco || 'Sem local',
                            tipo: 'agenda',
                            id: item.id
                        };
                    });

                const processadosNoprer = (noprers || [])
                    .filter(item => !item.isDraft && item.statusCalculado !== 'REGULARIZADA' && item.statusCalculado !== 'ESCALADA')
                    .map(item => {
                        return {
                            diasRestantes: item.diasRestantes,
                            titulo: item.numero ? item.numero.replace(/NOPRER-(\d{4})\.(\d+)/, 'NOPRER - $2/$1') : 'NOPRER - S/N',
                            local: item.nome_notificado || item.endereco || 'Sem local',
                            tipo: 'noprer',
                            id: item.id
                        };
                    });

                const todos = [...processadosAgenda, ...processadosNoprer]
                    .sort((a, b) => a.diasRestantes - b.diasRestantes);

                setPrazos(todos);
            } catch (err) {
                console.error('Erro ao carregar prazos:', err);
            } finally {
                setLoading(false);
            }
        };
        loadPrazos();
    }, [fetchNoprers]);

    const getColor = (dias) => {
        if (dias < 0) return 'bg-red-500';
        if (dias <= 1) return 'bg-orange-500';
        if (dias <= 5) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getDiasText = (dias) => {
        if (dias < 0) return `atrasado há ${Math.abs(dias)} dia(s)`;
        if (dias === 0) return 'vence hoje';
        if (dias === 1) return 'vence amanhã';
        return `vence em ${dias} dias`;
    };

    const displayPrazos = prazos.filter(p => filterType === 'todos' || p.tipo === filterType);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] shadow-sm flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 shrink-0">
                    <Clock size={16} className="text-blue-500" />
                    Prazos e Alertas
                </h3>
                
                {/* Filtros em forma de pílula */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl shrink-0 w-full sm:w-auto">
                    <button 
                        onClick={() => setFilterType('todos')}
                        className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${filterType === 'todos' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setFilterType('noprer')}
                        className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${filterType === 'noprer' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        NOPRER
                    </button>
                    <button 
                        onClick={() => setFilterType('agenda')}
                        className={`flex-1 sm:flex-none text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${filterType === 'agenda' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Agenda
                    </button>
                </div>
            </div>
            <div className="p-2 flex-1 flex flex-col justify-start overflow-y-auto max-h-[350px] custom-scrollbar">
                {loading ? (
                    <div className="text-center py-6">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                    </div>
                ) : displayPrazos.length > 0 ? (
                    <div className="flex flex-col">
                        {displayPrazos.map((prazo, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => navigate(prazo.tipo === 'noprer' ? `/noprer/detalhes/${prazo.id}` : '/agenda')}>
                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm shrink-0 ${getColor(prazo.diasRestantes)}`} />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                        {prazo.titulo} — {prazo.local}
                                    </span>
                                    <div className="mt-1.5 flex">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                            prazo.diasRestantes < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' :
                                            prazo.diasRestantes <= 1 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800' :
                                            prazo.diasRestantes <= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                        }`}>
                                            {getDiasText(prazo.diasRestantes)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        Nenhum prazo correspondente
                    </div>
                )}
            </div>
        </div>
    );
};


const BoletinsCard = () => {
    const [activeTab, setActiveTab] = useState('ext');
    const [boletinsMet, setBoletinsMet] = useState([]);
    const [boletinsExt, setBoletinsExt] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBoletins = async () => {
            setLoading(true);
            try {
                const baseURL = 'https://sigerd-mobile.vercel.app';
                const [resMet, resExt] = await Promise.all([
                    fetch(`${baseURL}/api/boletim-meteorologico?limite=10`).catch(() => null),
                    fetch(`${baseURL}/api/boletim-extraordinario?limite=10`).catch(() => null)
                ]);
                if (resMet && resMet.ok) {
                    const data = await resMet.json();
                    setBoletinsMet(data.boletins || []);
                }
                if (resExt && resExt.ok) {
                    const data = await resExt.json();
                    setBoletinsExt(data.boletins || []);
                }
            } catch (err) {
                console.warn('[BoletinsCard] Fetch failed:', err);
            }
            setLoading(false);
        };
        fetchBoletins();
    }, []);

    const isMet = activeTab === 'met';
    const currentList = isMet ? boletinsMet : boletinsExt;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden w-full transition-all">
            {/* TABS CONTROLS SMALL */}
            <div className="flex bg-slate-50 dark:bg-slate-800/80 p-1 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab('ext')}
                    className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1 ${!isMet
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500 border border-slate-100 dark:border-slate-600'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                >
                    <ClipboardList size={12} /> Extra
                </button>
                <button
                    onClick={() => setActiveTab('met')}
                    className={`flex-1 py-1 px-1 rounded-xl text-[9px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1 ${isMet
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500 border border-slate-100 dark:border-slate-600'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                >
                    <CloudRain size={12} /> Meteo
                </button>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="p-2 flex-1 flex flex-col overflow-hidden relative min-h-[140px] max-h-[250px]">
                {loading ? (
                    <div className="absolute inset-0 flex justify-center items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300 border-t-slate-800"></div>
                    </div>
                ) : currentList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
                        <FileText size={18} className="opacity-40" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Vazio</span>
                    </div>
                ) : (
                    <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 flex flex-col gap-2">
                        {currentList.map((b, idx) => {
                            const isFirst = idx === 0;
                            return (
                                <a
                                    key={idx}
                                    href={b.url_pdf}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`group flex items-center p-2 rounded-xl transition-all border ${isFirst
                                        ? `bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow`
                                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-100 dark:hover:border-slate-800'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mr-2 shadow-sm ${isMet
                                        ? (isFirst ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20')
                                        : (isFirst ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20')
                                        }`}>
                                        <FileText size={14} />
                                    </div>
                                    <div className="flex-1 overflow-hidden pr-2">
                                        {isFirst && (
                                            <div className="flex items-center mb-0.5">
                                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest leading-none">Mais Recente</span>
                                            </div>
                                        )}
                                        <h4 className={`font-bold text-[10px] sm:text-[11px] leading-tight truncate transition-colors ${isFirst ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
                                            } ${isMet ? 'group-hover:text-blue-500' : 'group-hover:text-orange-500'}`}>
                                            {b.titulo}
                                        </h4>
                                    </div>
                                    <ExternalLink size={10} className={`shrink-0 transition-all ${isFirst ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`} />
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
// --- SUB-COMPONENT: ALERTAS CEMADEN CARD ---
const NIVEL_CARD_STYLES = {
    'MUITO_ALTO': { bg: 'bg-red-500/10', text: 'text-red-600', icon: 'bg-red-500/10', label: 'Muito Alto' },
    'ALTO': { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: 'bg-orange-500/10', label: 'Alto' },
    'MODERADO': { bg: 'bg-amber-400/10', text: 'text-amber-600', icon: 'bg-amber-400/10', label: 'Moderado' },
    'OBSERVACAO': { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: 'bg-blue-500/10', label: 'Observação' },
};
const NIVEL_PRIORITY = ['MUITO_ALTO', 'ALTO', 'MODERADO', 'OBSERVACAO'];

const AlertasCemadenCard = ({ navigate }) => {
    const [count, setCount] = useState(null);
    const [nivelMaisCritico, setNivelMaisCritico] = useState(null);

    useEffect(() => {
        import('../../services/supabase').then(({ supabase: sb }) => {
            sb.from('alertas_cemaden')
                .select('nivel_atual', { count: 'exact' })
                .eq('status', 'ATIVO')
                .then(({ data, count: total }) => {
                    setCount(total ?? 0);
                    if (data && data.length > 0) {
                        const niveis = data.map(a => a.nivel_atual);
                        const mais = NIVEL_PRIORITY.find(n => niveis.includes(n)) || niveis[0];
                        setNivelMaisCritico(mais);
                    }
                });
        }).catch(() => setCount(0));
    }, []);

    const style = nivelMaisCritico ? (NIVEL_CARD_STYLES[nivelMaisCritico] || NIVEL_CARD_STYLES['OBSERVACAO']) : { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: 'bg-orange-500/10', label: '—' };

    const isAlerting = count > 0;

    return (
        <div
            onClick={() => navigate('/alertas-cemaden')}
            className={`p-4 rounded-[14px] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all shadow-md h-full min-h-[140px] text-white ${
                isAlerting
                    ? 'bg-gradient-to-br from-[#cf4436] to-[#9c2620]'
                    : 'bg-gradient-to-br from-[#254776] to-[#15294d]'
            }`}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider opacity-90">
                    <ShieldAlert size={16} className="text-white shrink-0" />
                    <span className="uppercase">ALERTAS CEMADEN</span>
                </div>
                {count === null ? (
                    <span className="text-3xl font-extrabold leading-none animate-pulse opacity-40">—</span>
                ) : (
                    <span className="text-3xl font-extrabold leading-none">{count}</span>
                )}
                <p className="text-[11px] font-semibold opacity-85 tracking-wide uppercase">
                    {count === null ? 'Carregando...' : count === 0 ? 'SEM ALERTAS VIGENTES' : `NÍVEL: ${style.label}`}
                </p>
            </div>
            {count > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 opacity-80" />
            )}
        </div>
    );
};

// --- SUB-COMPONENT: WEB VIEW ---
const WebViewDashboardView = ({
    data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
    handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
    showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
    viewMode, setViewMode, mapFilter, setMapFilter, timeFilter, setTimeFilter, mapStyle, setMapStyle,
    chartMode, setChartMode, activeContingencyPlan, load, loadRainfallOnly, limiteSMJ
}) => {
    const [tiposRiscoAtivos, setTiposRiscoAtivos] = useState(new Set()); // inicia VAZIO (desativado)
    const [areasRiscoData, setAreasRiscoData] = useState(null);

    useEffect(() => {
        fetch('/Areas_de_risco.json')
            .then(r => r.json())
            .then(d => setAreasRiscoData(d))
            .catch(e => console.warn('[AreasRisco] Falha ao carregar JSON:', e));
    }, []);

    const userProfile = useContext(UserContext);
    const isOperador = userProfile?.role === 'Operador';
    const currentData = viewMode === 'vistorias' ? (data.vistorias || data) : viewMode === 'ocorrencias' ? (data.ocorrencias || data) : (data.interdicoes || data);
    const locations = currentData?.locations || [];
    const now = new Date();
    const isWithinTime = (dateStr) => {
        if (!dateStr || timeFilter === 'Todas') return true;
        const d = new Date(dateStr);
        if (timeFilter === 'Hoje') return d.toDateString() === now.toDateString();
        if (timeFilter === '24h') return now - d <= 24 * 60 * 60 * 1000;
        if (timeFilter === '7d') return now - d <= 7 * 24 * 60 * 60 * 1000;
        if (timeFilter === '30d') return now - d <= 30 * 24 * 60 * 60 * 1000;
        if (timeFilter === 'Mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
    };
    const filteredLocations = (mapFilter === 'Todas' ? locations : locations.filter(l => l.risk === mapFilter))
        .filter(l => isWithinTime(l.date || l.data_ocorrencia));
    const typologies = ['Todas', ...(currentData?.breakdown || []).map(b => b.label)];

    const isTvMode = new URLSearchParams(window.location.search).get('tvMode') === 'true';
    if (isTvMode) {
        return <TvModeDashboardView
            data={data}
            weather={weather}
            cemadenAlerts={cemadenAlerts}
            rainfall={rainfall}
            statusInfo={statusInfo}
            viewMode={viewMode}
            setViewMode={setViewMode}
            mapFilter={mapFilter}
            timeFilter={timeFilter}
            mapStyle={mapStyle}
            navigate={navigate}
            activeContingencyPlan={activeContingencyPlan}
            load={load}
            refreshRainfall={loadRainfallOnly}
            getWeatherIcon={getWeatherIcon}
            limiteSMJ={limiteSMJ}
        />
    }

    return (
        <div className="bg-[#f0f2f5] dark:bg-slate-950 min-h-screen font-sans flex flex-col md:-mb-8">
            <div className="max-w-[1700px] mx-auto w-full p-6 space-y-6 flex-1">

                {/* --- 🏁 1. HEADER & TOP CARDS CONTAINER --- */}
                <div className="bg-white dark:bg-slate-900 rounded-[18px] shadow-lg shadow-orange-500/10 border-2 border-[#e79a52] overflow-hidden flex flex-col">
                    {/* Inner Padded Section */}
                    <div className="p-6 flex flex-col gap-5">
                        {/* Header: Title */}
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                Monitoramento em Tempo Real
                            </h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open('/?tvMode=true', '_blank', 'toolbar=no,scrollbars=yes,resizable=yes,top=50,left=50,width=1280,height=800')}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#2a4f8c] hover:bg-[#15294d] text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-sm"
                                >
                                    <MonitorPlay size={16} /> Modo TV
                                </button>
                            </div>
                        </div>

                        {/* CONTINGENCY BANNER (WEB) */}
                        {activeContingencyPlan && (
                            <div className="animate-in slide-in-from-top-4 duration-500 px-1">
                                <div
                                    className={`overflow-hidden rounded-[26px] border shadow-2xl flex items-center cursor-pointer hover:scale-[1.01] transition-all group ${activeContingencyPlan.nivel === 'Calamidade' ? 'bg-red-600 border-red-500 shadow-red-900/10' :
                                        activeContingencyPlan.nivel === 'Emergência' ? 'bg-orange-600 border-orange-500' : 'bg-amber-500 border-amber-400 shadow-orange-500/10'
                                        }`}
                                    onClick={() => navigate('/contingencia')}
                                >
                                    <div className="flex-1 p-6 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-white backdrop-blur-md shadow-inner">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">SCO Ativo</span>
                                                <span className="bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Nível {activeContingencyPlan.nivel}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">Operação em Andamento (SCO)</h3>
                                            <p className="text-white/80 text-xs font-bold truncate max-w-lg">{activeContingencyPlan.motivo}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/10 backdrop-blur-sm p-6 flex items-center justify-center gap-4 text-white border-l border-white/10 group-hover:bg-black/20 transition-colors px-10">
                                        <button className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center gap-2 whitespace-nowrap active:scale-95 transition-all">
                                            Acessar Central SCO <Activity size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Top 5 Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                            {/* Card 1: Risk Level */}
                            <div className={`p-4 rounded-[14px] flex flex-col justify-between relative overflow-hidden group transition-all shadow-md h-full min-h-[140px] text-white ${
                                statusInfo.loading || statusInfo.label === 'CONSULTANDO...'
                                    ? 'bg-gradient-to-br from-[#64748b] to-[#334155]'
                                    : statusInfo.label === 'NORMAL'
                                        ? 'bg-gradient-to-br from-[#22b57e] to-[#0e9668]'
                                        : 'bg-gradient-to-br from-[#cf4436] to-[#9c2620]'
                            }`}>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider opacity-90">
                                        <Shield size={16} className="text-white shrink-0" />
                                        <span className="uppercase">STATUS</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse ml-0.5" />
                                    </div>
                                    <span className="text-3xl font-extrabold leading-none uppercase tracking-tight">{statusInfo.label}</span>
                                    <div className="text-[11px] font-semibold opacity-85 tracking-wide uppercase">CONDIÇÃO GERAL</div>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/30 overflow-hidden mt-auto">
                                    <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: '100%' }} />
                                </div>
                            </div>

                            {/* Card 2: INMET Alerts */}
                            {!isOperador && (() => {
                                const inmetAlerts = data.alerts || [];
                                const totalCount = inmetAlerts.length;
                                const hasGrandePerigo = inmetAlerts.some(a => (a.severidade || a.aviso_severidade || '').toLowerCase().includes('grande perigo'));
                                const hasPerigo = inmetAlerts.some(a => (a.severidade || a.aviso_severidade || '').toLowerCase().includes('perigo') && !(a.severidade || a.aviso_severidade || '').toLowerCase().includes('grande'));
                                const hasPerigoPotencial = inmetAlerts.some(a => (a.severidade || a.aviso_severidade || '').toLowerCase().includes('potencial'));
                                const inmetIconStyle = hasGrandePerigo
                                    ? { bg: 'bg-red-500/10', text: 'text-red-600', bar: 'bg-red-500', label: 'Grande Perigo' }
                                    : hasPerigo
                                        ? { bg: 'bg-orange-500/10', text: 'text-orange-600', bar: 'bg-orange-500', label: 'Perigo' }
                                        : hasPerigoPotencial
                                            ? { bg: 'bg-amber-400/10', text: 'text-amber-600', bar: 'bg-amber-400', label: 'Perigo Potencial' }
                                            : { bg: 'bg-slate-100', text: 'text-slate-400', bar: null, label: 'SEM AVISOS VIGENTES' };
                                return (
                                    <div onClick={() => navigate('/alerts')} className={`p-4 rounded-[14px] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all shadow-md h-full min-h-[140px] text-white ${
                                        totalCount === 0
                                            ? 'bg-gradient-to-br from-[#3a66ac] to-[#2a4f8c]'
                                            : 'bg-gradient-to-br from-[#e79a52] to-[#c9762f]'
                                    }`}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider opacity-90">
                                                <Zap size={16} className="text-white shrink-0" />
                                                <span className="uppercase">AVISOS INMET</span>
                                            </div>
                                            <span className="text-3xl font-extrabold leading-none">{totalCount}</span>
                                            <p className="text-[11px] font-semibold opacity-85 tracking-wide uppercase">
                                                {totalCount === 0 ? 'SEM AVISOS VIGENTES' : inmetIconStyle.label}
                                            </p>
                                        </div>
                                        {totalCount > 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40 opacity-80" />
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Card 3: Alertas CEMADEN Ativos */}
                            <AlertasCemadenCard navigate={navigate} />

                            {/* Card 4: Vistorias */}
                            <div onClick={() => navigate('/vistorias')} className="p-4 rounded-[14px] bg-gradient-to-br from-[#254776] to-[#15294d] text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all shadow-md h-full min-h-[140px]">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider opacity-90">
                                        <ClipboardList size={16} className="text-white shrink-0" />
                                        <span className="uppercase">VISTORIAS</span>
                                    </div>
                                    <span className="text-3xl font-extrabold leading-none">{data.stats.totalVistorias}</span>
                                    <p className="text-[11px] font-semibold opacity-85 tracking-wide uppercase">TOTAL REGISTRADO</p>
                                </div>
                            </div>

                            {/* Card 5: Pluviometria */}
                            <div onClick={() => navigate('/pluviometros')} className="p-4 rounded-[14px] bg-gradient-to-br from-[#7d6dcf] to-[#54459c] text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all shadow-md h-full min-h-[140px]">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider opacity-90">
                                        <Droplets size={16} className="text-white shrink-0" />
                                        <span className="uppercase">PLUVIOMETRIA</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold leading-none">
                                            {rainfall?.length ? (rainfall.reduce((a, b) => a + (b.rainRaw || 0), 0) / rainfall.length).toFixed(1) : '0.0'}
                                        </span>
                                        <span className="text-xs font-bold uppercase opacity-85">mm</span>
                                    </div>
                                    <p className="text-[11px] font-semibold opacity-85 tracking-wide uppercase">MÉDIA 24H</p>
                                </div>
                            </div>
                        </div>

                        {/* Clima Horizontal - Abaixo dos Minicards */}
                        {weather?.current && (
                            <div onClick={() => setShowForecast(true)} className="flex w-full flex-col md:flex-row items-center justify-between py-3 px-6 rounded-[14px] bg-[#f8fafc] dark:bg-slate-800/40 border border-[#eef1f5] dark:border-slate-700/60 shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all group overflow-hidden">
                                <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-3 md:mb-0">
                                    <div className="text-3xl drop-shadow-sm text-blue-500 group-hover:scale-110 transition-transform">{getWeatherIcon(weather.current.code)}</div>
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-none tracking-tight">{Math.round(weather.current.temp || 0)}°C</span>
                                        </div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">PREVISÃO • SANTA MARIA DE JETIBÁ</div>
                                    </div>
                                </div>
                                <div className="flex gap-6 relative z-10 w-full md:w-auto">
                                    <div className="flex items-center gap-1.5">
                                        <CloudRain size={16} className="text-blue-500" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-none uppercase">{weather.daily?.[0]?.rainProb || 0}%</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Chuva</span>
                                        </div>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-1.5">
                                        <Timer size={16} className="text-blue-400" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-none uppercase">{weather.current.humidity || 0}%</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Umidade</span>
                                        </div>
                                    </div>
                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="flex items-center gap-1.5">
                                        <Activity size={16} className="text-slate-400" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 leading-none uppercase">{Math.round(weather.current.wind || 6)} km/h</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Vento</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Blue Horizontal Nav Bar - Positioned at absolute bottom of container */}
                    <div className="bg-[#254776] text-white flex w-full divide-x divide-white/10 border-t border-white/10 mt-auto">
                        {[
                            { label: 'OCORRÊNCIAS', path: '/ocorrencias' },
                            { label: 'VISTORIAS', path: '/vistorias' },
                            { label: 'INTERDIÇÕES', path: '/interdicao' },
                            { label: 'REDAP', path: '/redap' },
                            { label: 'REL. SITUACIONAL', action: () => setShowReportMenu(!showReportMenu) }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.action || (() => navigate(item.path))}
                                className="flex-1 py-2 px-2 text-center text-[10px] md:text-[11px] font-extrabold tracking-wider hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- 🗺️ 2. MAP & RESUMO SITUACIONAL --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Map Column */}
                    <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">Mapa Interativo</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-1 underline decoration-blue-500 decoration-2 underline-offset-4">Distribuição Geográfica</p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Toggle Mode */}
                                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => { setViewMode('vistorias'); setMapFilter('Todas'); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'vistorias' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Vistorias
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('ocorrencias'); setMapFilter('Todas'); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'ocorrencias' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Ocorrências
                                    </button>
                                    <button
                                        onClick={() => { setViewMode('interdicoes'); setMapFilter('Todas'); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'interdicoes' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Interdições
                                    </button>
                                </div>

                                {/* Filter Dropdown */}
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <MapPin size={14} className="text-slate-400" />
                                    <select
                                        value={mapFilter}
                                        onChange={(e) => setMapFilter(e.target.value)}
                                        className="text-[11px] font-bold bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none cursor-pointer min-w-[120px]"
                                    >
                                        {typologies.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <select
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-700/50 text-[10px] md:text-[11px] font-bold text-slate-700 dark:text-slate-200 border-0 rounded-lg px-2 md:px-3 py-1.5 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm outline-none uppercase"
                                    >
                                        <option value="Todas">Tudo</option>
                                        <option value="Hoje">Hoje</option>
                                        <option value="24h">24h</option>
                                        <option value="7d">7 dias</option>
                                        <option value="30d">30 dias</option>
                                        <option value="Mes">Este Mês</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className={`flex-1 min-h-[520px] w-full rounded-[24px] overflow-hidden relative z-0 border border-slate-100 dark:border-slate-800 shadow-inner ${mapStyle === 'satellite' ? 'leaflet-satellite-wrapper' : ''}`}>
                            <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} maxZoom={22} className={mapStyle === 'satellite' ? 'leaflet-satellite-view' : ''}>
                                <CustomMapControls />
                                <MapAutoBounds locations={filteredLocations} />
                                {/* Map Style Toggle (Web - Below Zoom) */}
                                <div className="absolute top-4 left-4 z-[9999] flex flex-col gap-2">
                                    <MapStyleControl mapStyle={mapStyle} setMapStyle={setMapStyle} size={18} isMobile={false} />
                                    <CamadasControl tiposAtivos={tiposRiscoAtivos} setTiposAtivos={setTiposRiscoAtivos} />
                                </div>

                                {mapStyle === 'google' && (
                                    <TileLayer url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                                )}
                                {mapStyle === 'google_sat' && (
                                    <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" maxZoom={22} />
                                )}
                                {mapStyle === 'street' && (
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={22} />
                                )}
                                {mapStyle === 'positron' && (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" maxZoom={22} />
                                )}
                                {mapStyle === 'satellite' && (
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
                                )}
                                {mapStyle === 'dark' && (
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={22} />
                                )}
                                <HeatmapLayer points={(filteredLocations || []).filter(l => l.lat && l.lng && Math.abs(l.lat) > 0.01 && !isNaN(l.lat))} show={mapStyle !== 'satellite'} options={{ radius: 25, blur: 15, opacity: 0.6 }} />
                                <OrthofotsLayer />
                                {/* Camada de Áreas de Risco (GeoJSON toggle por tipo) */}
                                {tiposRiscoAtivos.size > 0 && areasRiscoData && (
                                    <AreasRiscoLayer data={areasRiscoData} tiposAtivos={tiposRiscoAtivos} />
                                )}
                                <LimiteSMJLayer keyId="limite-smj-mobile2" />
                                {/* Pluviômetros CEMADEN - todos os com coordenadas válidas */}
                                {/* Pluviômetros CEMADEN - todos os com coordenadas válidas */}
                                {(rainfall || []).filter(s => s.lat && (s.lon || s.lng)).map((station, idx) => (
                                    <Marker
                                        key={`pluvio-web-${idx}`}
                                        position={[station.lat, station.lon || station.lng]}
                                        icon={createSmallPluvioIcon(station)}
                                        zIndexOffset={-1000}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <div className="font-bold text-sm mb-1">{station.name || 'Estação CEMADEN'}</div>
                                                <div className="text-xs text-slate-600">Acumulado 24h: <span className="font-bold text-blue-600">{(station.acc24hr || 0).toFixed(1)} mm</span></div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={60}>
                                    {filteredLocations?.filter(loc => loc.lat && loc.lng && Math.abs(loc.lat) > 0.01 && !isNaN(loc.lat)).map((loc, idx) => (
                                        <Marker
                                            key={idx}
                                            position={[loc.lat, loc.lng]}
                                            icon={createCustomDot(getMarkerColor(loc))}
                                            markerColor={getMarkerColor(loc)}
                                            loc={loc}
                                        >
                                            <Popup minWidth={220}>
                                                <div className="p-1.5 font-sans">
                                                    <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1.5">
                                                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                                                            ID {viewMode === 'vistorias' ? 'VISTORIA' : viewMode === 'ocorrencias' ? 'OCORRÊNCIA' : 'INTERDIÇÃO'}: {loc.formattedId || 'N/A'}
                                                        </span>
                                                        {viewMode === 'ocorrencias' && (
                                                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 shrink-0">{loc.status}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[12px] text-slate-700 mb-1">
                                                        <strong>Tipo:</strong> {loc.details || loc.risk || 'N/A'}
                                                    </div>
                                                    <div className="text-[12px] text-slate-700 mb-1">
                                                        <strong>Data:</strong> {new Date(loc.date).toLocaleDateString('pt-BR')}
                                                    </div>
                                                    <div className="text-[12px] text-slate-700">
                                                        <strong>Risco:</strong> {loc.risk || 'N/A'}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MarkerClusterGroup>
                            </MapContainer>
                            <MapLegend viewMode={viewMode} rainfall={rainfall} tiposRiscoAtivos={tiposRiscoAtivos} isMobile={false} />
                        </div>
                    </div>

                    {/* Resumo Situacional Column */}
                    <div className="lg:col-span-4 relative h-[600px] lg:h-auto">
                        <div className="lg:absolute lg:inset-0 bg-white dark:bg-slate-900 border border-slate-200 p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[3px] border-l-4 border-blue-600 pl-4">{viewMode === 'vistorias' ? 'Vistorias' : viewMode === 'ocorrencias' ? 'Ocorrências' : 'Interdições'}</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setChartMode('tipologia')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'tipologia' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Tipologia
                                </button>
                                <button
                                    onClick={() => setChartMode('localidade')}
                                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${chartMode === 'localidade' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Localidade
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                const list = (chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown) || [];
                                const top = list.slice(0, 10);
                                const rest = list.slice(10);
                                const restCount = rest.reduce((acc, c) => acc + c.count, 0);
                                if (restCount > 0) {
                                    top.push({ label: 'Outros', count: restCount, percentage: Math.round((restCount / (currentData?.stats?.total || 1)) * 100), color: 'bg-indigo-400' });
                                }
                                return top.map((item, idx) => (
                                    <div key={idx} className="group cursor-default">
                                        <div className="flex justify-between items-center mb-2 px-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors tracking-tight truncate max-w-[70%]">{item.label}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{item.count}</span>
                                                <span className="text-[9px] font-bold text-slate-300">({item.percentage}%)</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-full h-2 overflow-hidden shadow-inner border border-slate-100 dark:border-slate-800">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${item.color || 'bg-blue-600'} shadow-[0_0_5px_rgba(0,0,0,0.05)]`} style={{ width: `${item.percentage}%` }} />
                                        </div>
                                    </div>
                                ));
                            })()}
                            {((chartMode === 'tipologia' ? currentData?.breakdown : currentData?.localidadeBreakdown) || []).length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    Sem dados registrados
                                </div>
                            )}
                        </div>


                        {/* Pluviômetros (Relocado para o final da lista situacional) */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            {/* Índices Pluviométricos Row */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px] flex items-center gap-2">
                                        Estações Pluviométricas (24h)
                                        {pluvioLoading && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                                    </h4>
                                    <button onClick={() => navigate('/pluviometros')} className="text-[9px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 py-1 px-2.5 rounded-lg active:scale-95">Ver painel</button>
                                </div>

                                {pluvioLoading ? (
                                    <div className="text-center py-6">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buscando Estações...</div>
                                    </div>
                                ) : rainfall?.length > 0 ? (
                                    <div className="space-y-2.5 pr-2 custom-scrollbar max-h-[140px] overflow-y-auto">
                                        {rainfall.slice(0, 5).map((station, idx) => (
                                            <div key={idx} onClick={() => navigate('/pluviometros')} className="group flex items-center justify-between p-3 rounded-[16px] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-500/50 hover:bg-blue-50/30 hover:shadow-sm cursor-pointer transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-[4px] shadow-sm transform group-hover:rotate-45 transition-transform ${station.level === 'Extremo' ? 'bg-red-500 shadow-red-500/40' : station.level === 'Alerta' ? 'bg-orange-500 shadow-orange-500/40' : station.level === 'Atenção' ? 'bg-amber-400 shadow-amber-400/40' : 'bg-emerald-400 shadow-emerald-400/40'}`} />
                                                    <div className="flex flex-col justify-center">
                                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight leading-tight line-clamp-1 max-w-[140px] truncate">{station.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{station.level}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/80 px-3 py-1.5 rounded-[12px] border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                                                    <Droplets size={12} className={station.level === 'Normal' ? 'text-blue-400' : station.level === 'Extremo' ? 'text-red-500' : 'text-slate-500'} />
                                                    <div className="flex items-baseline gap-0.5">
                                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none tabular-nums tracking-tighter">{(station.rainRaw || 0).toFixed(1)}</span>
                                                        <span className="text-[9px] font-bold text-slate-500 leading-none">mm</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma estação com chuva reportada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>

                {/* --- 📉 3. BOTTOM SUMMARY ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Sync & Event Log) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className={`grid grid-cols-1 ${!isOperador ? 'md:grid-cols-2' : ''} gap-6 h-full`}>
                            {/* Sync Summary Replaced by Prazos e Alertas */}
                            <PrazosAlertasCard />

                            {/* Event Log Card (Replaces Vistoria Card block) */}
                            <div className="flex flex-col border border-transparent">
                                <EventLogCard data={data} rainfall={rainfall} cemadenAlerts={cemadenAlerts} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Boletins Card) */}
                    <div className="lg:col-span-4 h-full flex flex-col">
                        <BoletinsCard />
                    </div>
                </div>
            </div>

            <footer className="pt-3 pb-2 px-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 mt-auto shrink-0">
                <div className="flex flex-col justify-center gap-0.5">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">SIGERD WEB INTERFACE</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Prefeitura Municipal de Santa Maria de Jetibá</span>
                </div>
                <div className="flex items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Version {APP_VERSION}</span>
                </div>
            </footer>
        </div >
    );
};
// --- MAP LEGEND ---
const MapLegend = ({ viewMode, rainfall, tiposRiscoAtivos, isMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    if (!isOpen) {
        return (
            <div className={`absolute z-[9999] ${isMobile ? 'bottom-2 right-2' : 'bottom-[76px] right-4 md:bottom-4 md:right-4'}`}>
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-blue-600 transition-all hover:scale-105"
                    title="Abrir Legenda"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                </button>
            </div>
        );
    }

    return (
        <div className={`absolute z-[9999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-slate-250/80 dark:border-slate-800 text-[9px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar animate-in ${isMobile ? 'bottom-2 right-2' : 'bottom-[76px] right-4 md:bottom-4 md:right-4'}`}>
            <div className="flex justify-between items-center mb-1">
                <div className="text-[8px] text-slate-400">LEGENDA DO MAPA</div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            {viewMode === 'ocorrencias' ? (
                <>
                    <div className="flex items-center gap-2.5"><LegendPin color="#3b82f6" />Atendido</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#f59e0b" />Em Atendimento</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#f97316" />Em Análise</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#ef4444" />Pendente</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#64748b" />Cancelada</div>
                </>
            ) : viewMode === 'vistorias' ? (
                <>
                    <div className="flex items-center gap-2.5"><LegendPin color="#dc2626" />R4</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#ea580c" />R3</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#f59e0b" />R2</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#10b981" />R1</div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2.5"><LegendPin color="#dc2626" />Total</div>
                    <div className="flex items-center gap-2.5"><LegendPin color="#ea580c" />Parcial</div>
                </>
            )}
            {(rainfall || []).some(s => s.lat && (s.lon || s.lng)) && (
                <>
                    <div className="mt-1.5 pt-1.5 border-t border-white/20 dark:border-slate-700/50 text-[8px] text-slate-400">PLUVIÔMETROS</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-red-400 shadow-sm border border-white"></div>(&gt;80mm)</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm border border-white"></div>(&gt;50mm)</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm border border-white"></div>(&gt;30mm)</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-blue-400 shadow-sm border border-white"></div>(&lt;30mm)</div>
                </>
            )}
            {tiposRiscoAtivos.size > 0 && (
                <>
                    <div className="mt-1.5 pt-1.5 border-t border-white/20 dark:border-slate-700/50 text-[8px] text-slate-400">ÁREAS DE RISCO</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded bg-red-700 opacity-70 border border-white"></div>R4 - Muito Alto</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded bg-orange-500 opacity-70 border border-white"></div>R3 - Alto</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded bg-amber-500 opacity-70 border border-white"></div>R2 - Médio</div>
                    <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded bg-green-500 opacity-70 border border-white"></div>R1 - Baixo</div>
                </>
            )}
        </div>
    );
};

// --- CUSTOM MAP CONTROLS ---
const CustomMapControls = ({ defaultCenter = [-20.0246, -40.7464], defaultZoom = 13 }) => {
    const map = useMap();

    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    
    const handleHome = () => {
        map.setView(defaultCenter, defaultZoom);
    };

    const handleGPS = () => {
        if (!navigator.geolocation) {
            alert("Geolocalização não é suportada no seu navegador.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 15, { duration: 1 });
            },
            () => alert("Não foi possível obter a sua localização.")
        );
    };

    return (
        <div className="absolute top-4 right-4 z-[9999] flex flex-col gap-2">
            <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700" title="Aumentar Zoom">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Diminuir Zoom">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
                </button>
            </div>
            <button onClick={handleHome} className="w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl shadow-lg border border-slate-200 dark:border-slate-800" title="Enquadrar Estado">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
            <button onClick={handleGPS} className="w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors rounded-xl shadow-lg border border-slate-200 dark:border-slate-800" title="Minha Localização">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            </button>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
    const navigate = useNavigate()
    const { toast } = useToast()

    // UI State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [rainfall, setRainfall] = useState(null)
    const [syncDetail, setSyncDetail] = useState({ total: 0, vistorias: 0, interdicoes: 0 })
    const [syncing, setSyncing] = useState(false)
    const [showForecast, setShowForecast] = useState(false)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [cemadenAlerts, setCemadenAlerts] = useState([])
    const [viewMode, setViewMode] = useState('vistorias'); // 'vistorias' | 'ocorrencias' | 'interdicoes'
    const [chartMode, setChartMode] = useState('tipologia')
    const [mapFilter, setMapFilter] = useState('Todas')
    const [mapStyle, setMapStyle] = useState('google')
    const [timeFilter, setTimeFilter] = useState('Todas'); // 'Todas' | 'Hoje' | '24h' | '7d' | '30d' | 'Mes'
    const [climateLoading, setClimateLoading] = useState(true)
    const [pluvioLoading, setPluvioLoading] = useState(true)
    const [activeContingencyPlan, setActiveContingencyPlan] = useState(null)


    const statusInfo = useMemo(() => {
        if (climateLoading) {
            return {
                label: 'CONSULTANDO...',
                color: 'bg-slate-400',
                text: 'text-slate-500',
                bg: 'bg-slate-50',
                dot: 'bg-slate-400 animate-pulse',
                loading: true
            }
        }

        const inmet = data?.alerts || []
        const cemaden = cemadenAlerts || []
        const allAlerts = [...inmet, ...cemaden]

        // Default: Normal State
        let highest = 'NORMAL'
        let color = 'bg-emerald-500'
        let text = 'text-emerald-500'
        let bg = 'bg-emerald-50'
        let dot = 'bg-emerald-500'

        if (allAlerts.length > 0) {
            // Base Alert State
            highest = 'ATENÇÃO'
            color = 'bg-amber-500'
            text = 'text-amber-600'
            bg = 'bg-amber-50'
            dot = 'bg-amber-500'

            const severities = allAlerts.map(a => String(a.severidade || a.nivel || '').toLowerCase())

            if (severities.some(s => s.includes('grande') || s.includes('extremo') || s.includes('vermelho'))) {
                highest = 'G. PERIGO'
                color = 'bg-red-600'
                text = 'text-red-700'
                bg = 'bg-red-50'
                dot = 'bg-red-600'
            } else if (severities.some(s => s.includes('perigo') || s.includes('laranja') || s.includes('alerta'))) {
                highest = 'PERIGO'
                color = 'bg-orange-500'
                text = 'text-orange-600'
                bg = 'bg-orange-50'
                dot = 'bg-orange-500'
            }
        }

        return { label: highest, color, text, bg, dot }
    }, [data?.alerts, cemadenAlerts])

    // Responsive Switch Logic
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const loadRainfallOnly = async () => {
        try {
            setPluvioLoading(true);

            // Fetch Manual Readings (SEDE) from DB
            const manualReadings = await getManualReadings().catch(() => [])
            const now = new Date()
            const getLatestForPeriod = (period, hours) => {
                const windowStart = new Date(now.getTime() - hours * 60 * 60 * 1000)
                const relevant = (manualReadings || []).filter(r =>
                    r && (r.period === period || (!r.period && period === '1h')) &&
                    new Date(r.date) > windowStart &&
                    new Date(r.date) <= now
                )
                return relevant.length > 0 ? parseFloat(relevant[0].volume) : 0
            }

            const manualAcc24h = getLatestForPeriod('24h', 24)
            const manualStation = {
                id: 'SEDE_DEFESA_CIVIL',
                name: 'SEDE DEFESA CIVIL (Manual)',
                rainRaw: manualAcc24h,
            }

            const res = await fetch('/api/pluviometros').catch(() => null)
            let apiData = []
            if (res && res.ok) {
                apiData = await res.json()
            }

            let formattedApi = (apiData || []).map(st => {
                const meta = STATION_METADATA[st.id] || STATION_METADATA[st.id + 'A'] || {};
                return {
                    id: st.id,
                    name: meta.name || st.name,
                    lat: meta.lat || st.lat || null,
                    lon: meta.lon || st.lon || st.lng || null,
                    lng: meta.lon || st.lon || st.lng || null,
                    rainRaw: st.acc24hr ?? st.rainRaw ?? 0,
                    lastUpdate: st.lastUpdate || null
                };
            });

            // If API returned no stations, populate default CEMADEN stations
            if (formattedApi.length === 0) {
                const cemadenStations = await cemadenService.getRainfallData().catch(() => []);
                if (cemadenStations && cemadenStations.length > 0) {
                    formattedApi = cemadenStations;
                } else {
                    formattedApi = Object.keys(STATION_METADATA)
                        .filter(id => id !== 'SEDE_DEFESA_CIVIL')
                        .map(id => ({
                            id,
                            name: STATION_METADATA[id].name,
                            lat: STATION_METADATA[id].lat,
                            lon: STATION_METADATA[id].lon,
                            lng: STATION_METADATA[id].lon,
                            rainRaw: 0,
                            lastUpdate: new Date().toISOString()
                        }));
                }
            }

            const combined = [
                {
                    ...manualStation,
                    lat: (STATION_METADATA['SEDE_DEFESA_CIVIL'] || {}).lat || -20.0406,
                    lon: (STATION_METADATA['SEDE_DEFESA_CIVIL'] || {}).lon || -40.7456,
                    lng: (STATION_METADATA['SEDE_DEFESA_CIVIL'] || {}).lon || -40.7456
                },
                ...formattedApi
            ].map(station => {
                let level = 'Normal';
                const acc24 = station.rainRaw || 0;
                if (acc24 >= 80) level = 'Extremo';
                else if (acc24 >= 50) level = 'Alerta';
                else if (acc24 >= 30) level = 'Atenção';

                return { ...station, level }
            }).filter(station => station && station.lat && (station.lon || station.lng));

            setRainfall(combined);
        } catch (e) {
            console.warn('[Pluviometros] Fetch failed, using fallback:', e);
            const rain = await cemadenService.getRainfallData().catch(() => []);
            setRainfall(rain || []);
        } finally {
            setPluvioLoading(false);
        }
    };

    const load = async () => {
        try {
            const plan = await contingencyDb.getActivePlan().catch(e => {
                console.error('[Dash] Plano cont error:', e);
                return null;
            });
            setActiveContingencyPlan(plan);

            const [pendingDetail, localVistorias, cachedVistorias, localOcorrencias, localInterdicoes] = await Promise.all([
                getPendingSyncCount().catch(() => ({ total: 0, vistorias: 0, interdicoes: 0 })),
                getAllVistoriasLocal().catch(() => []),
                getRemoteVistoriasCache().catch(() => []),
                getOcorrenciasLocal().catch(() => []),
                getAllInterdicoesLocal().catch(() => [])
            ]);

            const todayStr = new Date().toLocaleDateString('pt-BR');
            const todayOccurrences = (localOcorrencias || []).filter(o => o.data_ocorrencia === todayStr).length;

            setSyncDetail(pendingDetail);
            const deduplicate = (list) => {
                const uniqueMap = new window.Map();
                (list || []).forEach(item => {
                    if (!item) return;
                    // PRIORITIZE Business ID (formatted number like 001/2026) for true deduplication
                    const businessId = item.vistoria_id || item.vistoriaId || item.id_vistoria || item.ocorrencia_id_format || item.ocorrencia_id || item.id_ocorrencia || item.interdicao_id || item.interdicaoId || item.id_interdicao;

                    const key = businessId ? String(businessId) : (item.id ? `tech-${item.id}` : `rnd-${Math.random()}`);

                    if (key && key !== 'undefined' && key !== 'null') uniqueMap.set(key, item);
                });
                return Array.from(uniqueMap.values());
            };

            const initialAllV = deduplicate([...(cachedVistorias || []), ...(localVistorias || [])]);
            const initialAllO = deduplicate(localOcorrencias || []);

            // Extract interdicoes from vistorias AND combine with local interdicoes table (Filtering out desinterditadas)
            const vistoriasWithI = (initialAllV || []).filter(v =>
                v && (v.interdicao_id || v.interdicaoId || v.tipo_interdicao || v.id_interdicao || v.risco_tipo || v.medida_tipo || v.motivo_interdicao)
            );
            const initialAllI = deduplicate([...(localInterdicoes || []), ...vistoriasWithI]).filter(i => {
                if (!i) return false;
                const statusStr = String(i.status || i.status_interdicao || i.situacao || i.tipo_documento || '').toLowerCase();
                return !(statusStr.includes('desinterdit') || statusStr.includes('liberad') || statusStr.includes('revogad') || statusStr === 'cancelada' || statusStr === 'excluido');
            });

            const vProcessed = processLocations(initialAllV, 'v');
            const oProcessed = processLocations(initialAllO, 'o');
            const iProcessed = processLocations(initialAllI, 'i');

            setData({
                vistorias: { stats: { total: initialAllV.length }, breakdown: processBreakdown(initialAllV), localidadeBreakdown: processLocalidadeBreakdown(initialAllV), locations: vProcessed },
                ocorrencias: { stats: { total: initialAllO.length, today: todayOccurrences }, breakdown: processBreakdown(initialAllO), localidadeBreakdown: processLocalidadeBreakdown(initialAllO), locations: oProcessed },
                interdicoes: { stats: { total: initialAllI.length }, breakdown: processBreakdown(initialAllI), localidadeBreakdown: processLocalidadeBreakdown(initialAllI), locations: iProcessed },
                stats: { totalVistorias: initialAllV.length, activeOccurrences: todayOccurrences, totalOccurrences: initialAllO.length, totalInterdicoes: initialAllI.length, inmetAlertsCount: 0 },
                alerts: [],
                locations: [...vProcessed, ...oProcessed, ...iProcessed]
            });
            setLoading(false);

            // Refetch in background - IMPORTANT: Merge with existing structure
            api.getDashboardData().then(dashResult => {
                if (dashResult) {
                    // dashResult is already structured: { vistorias: { stats, breakdown, locations... }, stats: { ... }, locations: [...] }
                    setData(prev => ({
                        ...dashResult,
                        syncDetail: prev?.syncDetail || pendingDetail,
                        stats: {
                            ...dashResult.stats,
                            totalInterdicoes: dashResult.interdicoes.stats.total,
                            inmetAlertsCount: (dashResult.alerts || []).length
                        }
                    }));
                }
            }).catch(e => console.error('[Dash] Background refetch error:', e));

            const fetchClimate = async () => {
                try {
                    const lat = -20.0246, lon = -40.7464;
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
                    const r = await fetch(url);
                    if (r.ok) {
                        const d = await r.json();
                        setWeather({
                            current: {
                                temp: d.current.temperature_2m,
                                humidity: d.current.relative_humidity_2m,
                                rain: d.current.precipitation || 0,
                                code: d.current.weather_code,
                                wind: d.current.wind_speed_10m || 6
                            },
                            daily: d.daily.time.map((t, i) => ({
                                date: t,
                                tempMax: d.daily.temperature_2m_max[i],
                                tempMin: d.daily.temperature_2m_min[i],
                                rainProb: d.daily.precipitation_probability_max[i],
                                code: d.daily.weather_code[i]
                            }))
                        });
                    }
                } catch (e) { console.warn('[Weather] Fetch failed:', e); }

                try {
                    const alerts = await getAlertasCemaden({ status: 'ATIVO' });
                    setCemadenAlerts(alerts || []);
                } catch (e) { console.warn('[Cemaden] Alerts failed:', e); }

                await loadRainfallOnly();

                // Fallback direct INMET fetch if data.alerts is empty
                try {
                    const inmetResp = await fetch('https://sigerd-mobile.vercel.app/api/inmet').catch(() => null);
                    if (inmetResp && inmetResp.ok) {
                        const inmetData = await inmetResp.json();
                        if (Array.isArray(inmetData) && inmetData.length > 0) {
                            setData(prev => {
                                if (!prev) return prev;
                                return {
                                    ...prev,
                                    alerts: inmetData,
                                    stats: {
                                        ...prev.stats,
                                        inmetAlertsCount: inmetData.length
                                    }
                                };
                            });
                        }
                    }
                } catch (e) { console.warn('[INMET] Direct catch failed:', e); }

                setClimateLoading(false);
            };

            fetchClimate();

        } catch (error) {
            console.error('[Dashboard] Fatal load error:', error);
            // Fallback: Provide at least an empty data structure to stop the "Error loading" screen
            setData({
                vistorias: { stats: { total: 0 }, breakdown: [], localidadeBreakdown: [], locations: [] },
                ocorrencias: { stats: { total: 0, today: 0 }, breakdown: [], localidadeBreakdown: [], locations: [] },
                interdicoes: { stats: { total: 0 }, breakdown: [], localidadeBreakdown: [], locations: [] },
                stats: { totalVistorias: 0, activeOccurrences: 0, totalOccurrences: 0, totalInterdicoes: 0, inmetAlertsCount: 0 },
                alerts: [],
                locations: []
            });
            setLoading(false);
        }
    }

    useEffect(() => { load() }, [])

    const handleSync = async () => {
        if (syncing) return
        setSyncing(true)
        toast.info('Sincronizando...', 'Comunicando com o servidor central.')
        try {
            await pullAllData();
            await syncPendingData()
            const [newData, newDetail] = await Promise.all([api.getDashboardData(), getPendingSyncCount()]);
            if (newData) {
                setData({
                    ...newData,
                    stats: {
                        ...newData.stats,
                        totalInterdicoes: newData.interdicoes.stats.total,
                        inmetAlertsCount: (newData.alerts || []).length
                    }
                });
            }
            setSyncDetail(newDetail)
            toast.success('Sincronizado', 'Dados atualizados com sucesso.')
        } catch (error) {
            toast.error('Erro', 'Falha na comunicação.')
        } finally {
            setSyncing(false)
        }
    }

    const handleClearCache = async () => {
        if (!window.confirm('Apagar vistorias locais?')) return
        await resetDatabase();
        window.location.reload();
    }

    const handleExportKML = () => {
        if (!data?.locations?.length) return alert('Sem dados.');
        let kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${data.locations.map(loc => `<Placemark><name>${loc.risk}</name><Point><coordinates>${loc.lng},${loc.lat},0</coordinates></Point></Placemark>`).join('')}</Document></kml>`
        const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
        const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'vistorias.kml'; link.click();
    }

    const getWeatherIcon = (code) => {
        if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️'; if (code <= 67) return '🌦️'; return '⛈️';
    }

    const handleGenerateReport = async (hours = 0) => {
        try {
            setGeneratingReport(true);
            const labels = {
                24: 'Últimas 24 Horas',
                48: 'Últimas 48 Horas',
                72: 'Últimas 72 Horas',
                96: 'Últimas 96 Horas',
                0: 'Todo o Período'
            }
            const label = labels[hours] || 'Todo o Período';

            const limitDate = hours > 0 ? new Date(Date.now() - hours * 60 * 60 * 1000) : null;

            const filterByTime = (locations) => {
                if (!limitDate || !locations) return locations || [];
                return locations.filter(loc => loc.date && new Date(loc.date) >= limitDate);
            };

            // Filter ALL categories for the report
            const filteredVistorias = filterByTime(data.vistorias?.locations);
            const filteredOcorrencias = filterByTime(data.ocorrencias?.locations);
            const filteredInterdicoes = filterByTime(data.interdicoes?.locations);

            const reportLocations = [...filteredVistorias, ...filteredOcorrencias, ...filteredInterdicoes];

            // Recalculate Breakdown for the specific timeframe
            const colorPalette = {
                'Geológico / Geotécnico': '#f97316',
                'Risco Geológico': '#f97316',
                'Hidrológico': '#3b82f6',
                'Inundação': '#3b82f6',
                'Alagamento': '#60a5fa',
                'Inundação/Alagamento': '#3b82f6',
                'Enxurrada': '#2563eb',
                'Estrutural': '#94a3b8',
                'Estrutural/Predial': '#94a3b8',
                'Ambiental': '#10b981',
                'Tecnológico': '#f59e0b',
                'Climático / Meteorológico': '#0ea5e9',
                'Infraestrutura Urbana': '#6366f1',
                'Sanitário': '#f43f5e',
                'Deslizamento': '#f97316',
                'Vendaval': '#0284c7',
                'Granizo': '#818cf8',
                'Incêndio': '#ef4444',
                'Outros': '#94a3b8'
            };

            const counts = {};
            reportLocations.forEach(loc => {
                const cat = loc.risk || 'Outros';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const finalBreakdown = Object.keys(counts).map(catLabel => ({
                label: catLabel,
                count: counts[catLabel],
                percentage: reportLocations.length > 0 ? Math.round((counts[catLabel] / reportLocations.length) * 100) : 0,
                color: colorPalette[catLabel] || '#94a3b8'
            })).sort((a, b) => b.count - a.count);

            // Group back into categorized objects for the report
            const finalVistorias = reportLocations.filter(l => l.type === 'v');
            const finalOcorrencias = reportLocations.filter(l => l.type === 'o');
            const finalInterdicoes = reportLocations.filter(l => l.type === 'i');

            const reportData = {
                stats: {
                    totalVistorias: finalVistorias.length,
                    totalOcorrencias: finalOcorrencias.length,
                    totalInterdicoes: finalInterdicoes.length,
                    activeOccurrences: finalOcorrencias.length
                },
                breakdown: finalBreakdown,
                locations: reportLocations,
                vistorias: { locations: finalVistorias, stats: { total: finalVistorias.length } },
                ocorrencias: { locations: finalOcorrencias, stats: { total: finalOcorrencias.length } },
                interdicoes: { locations: finalInterdicoes, stats: { total: finalInterdicoes.length } },
                alerts: cemadenAlerts || [],
                weather: weather // Pass full weather object
            };

            const [shelters, occupants, inventory] = await Promise.all([
                getShelters().catch(() => []),
                getOccupants().catch(() => []),
                getInventory().catch(() => [])
            ]);
            const humanitarianData = { shelters, occupants, inventory };

            // Logic shared with the new preview page
            const now = new Date();
            const emissionDate = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).replace(',', ' -');

            const hasHighAlerts = (reportData.locations || []).some(l =>
                String(l.risk).includes('Alto') || String(l.risk).includes('Crítico') || String(l.risk).includes('Perigo')
            );
            const hasMediumAlerts = (reportData.locations || []).some(l =>
                String(l.risk).includes('Médio') || String(l.risk).includes('Média') || String(l.risk).includes('Atenção')
            );

            const currentStatus = statusInfo || { label: 'NORMAL', bg: '#10b981', text: 'white' };

            const validStations = (rainfall || []).filter(p => (p.acc24hr || p.rainRaw || 0) > 0);
            const avgAcc = validStations.length > 0
                ? (validStations.reduce((acc, p) => acc + (p.acc24hr || p.rainRaw || 0), 0) / validStations.length).toFixed(1)
                : '0.0';

            // Fetch INMET and CEMADEN alerts active during the timeframe from Supabase
            let reportInmetAlerts = [];
            let reportCemadenAlerts = [];

            try {
                const nowIso = new Date().toISOString();
                // Default to last 7 days if hours === 0
                const limitIso = limitDate ? limitDate.toISOString() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                // Fetch INMET alerts active during the period (overlapping)
                const { data: dbInmet } = await supabase
                    .from('alertas_inmet')
                    .select('*')
                    .lte('inicio', nowIso)
                    .gte('fim', limitIso)
                    .order('inicio', { ascending: false });

                if (dbInmet) {
                    reportInmetAlerts = dbInmet.map(a => ({
                        id: a.id,
                        tipo: a.tipo,
                        severidade: a.severidade,
                        inicio: a.inicio,
                        fim: a.fim,
                        riscos: a.riscos ? a.riscos.split('\n') : [],
                        instrucoes: a.instrucoes ? a.instrucoes.split('\n') : [],
                        msg: a.msg,
                        descricao: a.descricao
                    }));
                }

                // Fetch CEMADEN alerts active during the period (overlapping)
                const { data: dbCemaden } = await supabase
                    .from('alertas_cemaden')
                    .select('*')
                    .ne('status', 'EXCLUIDO')
                    .lte('data_abertura', nowIso)
                    .or(`data_cessar.is.null,data_cessar.gte.${limitIso}`);

                if (dbCemaden) {
                    reportCemadenAlerts = dbCemaden;
                }
            } catch (alertErr) {
                console.error('[Report] Error fetching historical alerts:', alertErr);
                // Fallback to currently loaded active warnings
                reportInmetAlerts = data?.alerts || [];
                reportCemadenAlerts = cemadenAlerts || [];
            }

            const finalPreviewData = {
                dashboardData: reportData,
                weatherData: weather,
                pluviometerData: rainfall || [],
                humanitarianData,
                timeframeLabel: label,
                emissionDate,
                currentStatus,
                avgAcc,
                activeWarnings: reportInmetAlerts,
                cemadenAlerts: reportCemadenAlerts
            };

            // Save to session for the print component and open route
            sessionStorage.setItem('lastSituationalReport', JSON.stringify(finalPreviewData));
            window.open('/relatorio-situacional/imprimir', '_blank');

            setShowReportMenu(false);
            toast.success('Pronto!', 'Relatório carregado na nova aba.');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Erro', 'Erro ao gerar relatório.');
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50 dark:bg-slate-900">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-slate-600 dark:text-slate-300">Carregando Inteligência...</span>
        </div>
    )

    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Erro ao carregar dados.</div>

    // Sub-component Props
    const commonProps = {
        data, weather, rainfall, cemadenAlerts, syncDetail, syncing, handleSync,
        handleClearCache, handleExportKML, navigate, setShowForecast, pluvioLoading,
        showReportMenu, setShowReportMenu, getWeatherIcon, handleGenerateReport, statusInfo,
        viewMode, setViewMode, mapFilter, setMapFilter, timeFilter, setTimeFilter, mapStyle, setMapStyle,
        chartMode, setChartMode,
        activeContingencyPlan,
        load,
        loadRainfallOnly
    };

    return (
        <>
            {isMobile ? <MobileDashboardView {...commonProps} /> : <WebViewDashboardView {...commonProps} />}

            {/* Global Modals */}
            {showForecast && weather && (
                <div onClick={() => setShowForecast(false)} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-sm border border-slate-200 p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Previsão Local</h3>
                            <button onClick={() => setShowForecast(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {weather.daily?.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{getWeatherIcon(day.code)}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-300">{Math.round(day.tempMax)}° <span className="text-slate-400 font-normal">/ {Math.round(day.tempMin)}°</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {generatingReport && (
                <div className="fixed inset-0 z-[200] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Gerando Relatório...</span>
                </div>
            )}

            {/* Menu de Relatórios para WebView */}
            {showReportMenu && (
                <div onClick={() => setShowReportMenu(false)} className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 w-full max-w-sm border border-slate-200 p-6 shadow-2xl animate-in slide-in-from-bottom-5">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Emitir Relatório</h3>
                            <button onClick={() => setShowReportMenu(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: 'Últimas 24 Horas', value: 24 },
                                { label: 'Últimas 48 Horas', value: 48 },
                                { label: 'Últimas 72 Horas', value: 72 },
                                { label: 'Últimas 96 Horas', value: 96 },
                                { label: 'Todo o Período', value: 0 },
                            ].map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleGenerateReport(opt.value)}
                                    className="w-full text-left px-5 py-4 bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-700/50 hover:bg-blue-50 hover:text-blue-700 rounded-2xl font-bold text-slate-700 dark:text-slate-300 transition-colors flex justify-between items-center group"
                                >
                                    <span>{opt.label}</span>
                                    <FileText size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
};

export default Dashboard;