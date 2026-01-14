import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { AlertTriangle, ChevronRight, CloudRain, CloudUpload, CheckCircle, Download, Printer, Truck, ClipboardList, Activity, Map as MapIcon, Users, Building, Package } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import HeatmapLayer from '../../components/HeatmapLayer'
import { getPendingSyncCount, syncPendingData, getAllVistoriasLocal, getAllInterdicoesLocal } from '../../services/db'
import { generateSituationalReport } from '../../utils/situationalReportGenerator'


// Comprehensive Category Mapping
const CATEGORY_MAP = {
    // Geo/Geotech
    'GEOLÓGICO / GEOTÉCNICO': 'Geológico / Geotécnico',
    'GEOLÓGICO': 'Geológico / Geotécnico',
    'RISCO GEOLÓGICO': 'Geológico / Geotécnico',
    'DESLIZAMENTO': 'Geológico / Geotécnico',
    'DESLIZAMENTO DE TERRA': 'Geológico / Geotécnico',
    'MOVIMENTO DE MASSA': 'Geológico / Geotécnico',
    'EROSÃO DO SOLO': 'Geológico / Geotécnico',
    'TRINCA NO TERRENO': 'Geológico / Geotécnico',

    // Hydrological
    'HIDROLÓGICO': 'Hidrológico',
    'ALAGAMENTO': 'Hidrológico',
    'INUNDAÇÃO': 'Hidrológico',
    'ENXURRADA': 'Hidrológico',
    'TRANSBORDAMENTO': 'Hidrológico',
    'INUNDAÇÃO/ALAGAMENTO': 'Hidrológico',

    // Structural
    'ESTRUTURAL': 'Estrutural',
    'ESTRUTURAL/PREDIAL': 'Estrutural',
    'RISCO DE DESABAMENTO': 'Estrutural',
    'RACHADURAS': 'Estrutural',
    'FISSURAS ESTRUTURAIS': 'Estrutural',
    'TRINCAS': 'Estrutural',

    // Environmental
    'AMBIENTAL': 'Ambiental',
    'QUEDA DE ÁRVORE': 'Ambiental',
    'INCÊNDIO FLORESTAL': 'Ambiental',

    // Technological
    'TECNOLÓGICO': 'Tecnológico',
    'RISCO ELÉTRICO': 'Tecnológico',
    'VAZAMENTO DE GÁS': 'Tecnológico',
    'INCÊNDIO': 'Tecnológico',

    // Others
    'CLIMÁTICO / METEOROLÓGICO': 'Climático / Meteorológico',
    'CLIMATICO': 'Climático / Meteorológico',
    'INFRAESTRUTURA URBANA': 'Infraestrutura Urbana',
    'SANITÁRIO': 'Sanitário',
    'OUTROS': 'Outros'
};

const CATEGORY_COLORS = {
    'Geológico / Geotécnico': 'bg-orange-500',
    'Hidrológico': 'bg-blue-500',
    'Estrutural': 'bg-slate-400',
    'Ambiental': 'bg-emerald-500',
    'Tecnológico': 'bg-amber-500',
    'Climático / Meteorológico': 'bg-sky-500',
    'Infraestrutura Urbana': 'bg-indigo-500',
    'Sanitário': 'bg-rose-500',
    'Outros': 'bg-slate-400',
    'Interdição': 'bg-red-600'
};

const standardizeCategory = (cat) => {
    if (!cat) return 'Outros';
    const upper = cat.trim().toUpperCase();
    return CATEGORY_MAP[upper] || cat;
};

const Dashboard = () => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [weather, setWeather] = useState(null)
    const [syncCount, setSyncCount] = useState(0)
    const [syncing, setSyncing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showReportMenu, setShowReportMenu] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [timeframe, setTimeframe] = useState(0)


    const normalizeVistoria = (v) => {
        if (!v) return null;
        const dateRaw = v.data_hora || v.dataHora || v.created_at || v.createdAt;
        let dateObj;
        if (typeof dateRaw === 'string') {
            const cleanDate = dateRaw.replace(' ', 'T');
            dateObj = new Date(cleanDate);
        } else {
            dateObj = new Date(dateRaw || Date.now());
        }

        const rawCat = v.categoria_risco || v.categoriaRisco || 'Outros';
        const normalizedCategory = standardizeCategory(rawCat);
        const bizId = v.vistoria_id || v.vistoriaId;
        const id = bizId || (v.id ? `db-${v.id}` : `rnd-${Math.random()}`);

        return { ...v, id, bizId, normalizedDate: dateObj, normalizedCategory };
    };

    const normalizeInterdicao = (i) => {
        if (!i) return null;
        const dateRaw = i.data_hora || i.dataHora || i.created_at || i.createdAt;
        let dateObj;
        if (typeof dateRaw === 'string') {
            const cleanDate = dateRaw.replace(' ', 'T');
            dateObj = new Date(cleanDate);
        } else {
            dateObj = new Date(dateRaw || Date.now());
        }
        const bizId = i.interdicao_id || i.interdicaoId;
        const id = bizId || (i.id ? `int-${i.id}` : `intrnd-${Math.random()}`);
        return { ...i, id, bizId, normalizedDate: dateObj, type: 'Interdição' };
    };

    const getFilteredData = (rawConfig, hours) => {
        if (!rawConfig) return null;

        const now = new Date();
        const threshold = hours > 0 ? new Date(now.getTime() - (hours * 60 * 60 * 1000)) : null;

        const filteredVistorias = (rawConfig.vistorias || []).filter(v => {
            if (!threshold) return true;
            return v.normalizedDate.getTime() >= threshold.getTime();
        });

        const filteredInterdicoes = (rawConfig.interdicoes || []).filter(i => {
            if (!threshold) return true;
            return i.normalizedDate.getTime() >= threshold.getTime();
        });

        const counts = {};
        let totalPop = 0;
        const riskLevels = { 'Baixo': 0, 'Médio': 0, 'Alto': 0, 'Iminente': 0 };

        filteredVistorias.forEach(v => {
            const cat = v.normalizedCategory;
            counts[cat] = (counts[cat] || 0) + 1;

            // Social Impact Aggregation
            const pop = parseInt(v.populacaoEstimada || v.populacao_estimada || 0);
            if (!isNaN(pop)) totalPop += pop;

            // Risk Level Distribution
            const level = v.nivelRisco || v.nivel_risco || 'Baixo';
            if (riskLevels.hasOwnProperty(level)) riskLevels[level]++;
        });

        const totalV = filteredVistorias.length;

        const newBreakdown = Object.keys(counts).map(label => ({
            label,
            count: counts[label],
            percentage: totalV > 0 ? (counts[label] / totalV * 100) : 0,
            color: CATEGORY_COLORS[label] || 'bg-slate-400'
        })).sort((a, b) => b.count - a.count);

        const adjustedBreakdown = newBreakdown.map(item => ({
            ...item,
            percentage: Math.round(item.percentage)
        }));

        const vistoriaLocations = filteredVistorias.map(v => {
            if (!v.coordenadas || !v.coordenadas.includes(',')) return null;
            const [lat, lng] = v.coordenadas.split(',').map(parseFloat);
            if (isNaN(lat) || isNaN(lng)) return null;
            return {
                lat, lng,
                risk: v.normalizedCategory,
                details: v.subtiposRisco?.join(', ') || v.normalizedCategory,
                date: v.normalizedDate.toISOString(),
                type: 'vistoria',
                level: v.nivelRisco || 'Baixo'
            };
        }).filter(Boolean);

        const interdicaoLocations = filteredInterdicoes.map(i => {
            if (!i.coordenadas || !i.coordenadas.includes(',')) return null;
            const [lat, lng] = i.coordenadas.split(',').map(parseFloat);
            if (isNaN(lat) || isNaN(lng)) return null;
            return {
                lat, lng,
                risk: 'Interdição',
                details: i.recomendacoes || i.riscoTipo || 'Interdição de Imóvel',
                date: i.normalizedDate.toISOString(),
                type: 'interdicao',
                level: 'Iminente'
            };
        }).filter(Boolean);

        return {
            ...rawConfig,
            stats: {
                ...rawConfig.stats,
                totalVistorias: totalV,
                totalInterdicoes: filteredInterdicoes.length,
                totalPopulacao: totalPop,
                riskLevels,
                activeOccurrences: rawConfig.stats.activeOccurrences || 0
            },
            breakdown: adjustedBreakdown,
            locations: [...vistoriaLocations, ...interdicaoLocations],
            vistorias: filteredVistorias,
            interdicoes: filteredInterdicoes
        };
    };

    const displayData = useMemo(() => getFilteredData(data, timeframe), [data, timeframe]);

    useEffect(() => {
        const load = async () => {
            try {
                const pendingCount = await getPendingSyncCount().catch(() => 0)
                setSyncCount(pendingCount)

                const [dashResult, weatherResult, localV, localI] = await Promise.all([
                    api.getDashboardData().catch(() => null),
                    fetch('/api/weather').then(r => r.ok ? r.json() : null).catch(() => null),
                    getAllVistoriasLocal().catch(() => []),
                    getAllInterdicoesLocal().catch(() => [])
                ])

                const vistoriasMap = new Map();
                const interdicoesMap = new Map();

                if (dashResult?.vistorias) {
                    dashResult.vistorias.forEach(v => {
                        const vn = normalizeVistoria(v);
                        if (vn) vistoriasMap.set(vn.id, vn);
                    });
                }
                localV.forEach(v => {
                    const vn = normalizeVistoria(v);
                    if (vn) vistoriasMap.set(vn.id, vn);
                });

                if (dashResult?.interdicoes) {
                    dashResult.interdicoes.forEach(i => {
                        const inorm = normalizeInterdicao(i);
                        if (inorm) interdicoesMap.set(inorm.id, inorm);
                    });
                }
                localI.forEach(i => {
                    const inorm = normalizeInterdicao(i);
                    if (inorm) interdicoesMap.set(inorm.id, inorm);
                });

                const allV = Array.from(vistoriasMap.values());
                const allI = Array.from(interdicoesMap.values());

                const finalData = {
                    stats: {
                        totalVistorias: allV.length,
                        totalInterdicoes: allI.length,
                        activeOccurrences: dashResult?.stats?.activeOccurrences || 0,
                        inmetAlertsCount: dashResult?.stats?.inmetAlertsCount || 0
                    },
                    vistorias: allV,
                    interdicoes: allI,
                    locations: [],
                    breakdown: []
                };



                setWeather(weatherResult);
                setData(finalData);
                setData(finalData);
            } catch (err) { console.error('Dashboard Error:', err) } finally { setLoading(false) }
        }
        load()
    }, [])

    const handleSync = async () => {
        if (syncing || syncCount === 0) return
        setSyncing(true)
        try { await syncPendingData(); window.location.reload() } catch (e) { alert('Erro na sincronização') } finally { setSyncing(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold">Carregando...</div>
    if (!displayData) return null

    return (
        <div className="bg-slate-50 min-h-screen p-5 pb-24 font-sans">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-800 tracking-tight">SIGERD Mobile</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Painel de Gestão v3.2</p>
                </div>
                <select value={timeframe} onChange={e => setTimeframe(Number(e.target.value))} className="bg-white px-3 py-2 rounded-xl text-[10px] font-black text-blue-600 border border-slate-200 outline-none shadow-sm uppercase tracking-tighter">
                    <option value={0}>Todo o Período</option>
                    <option value={24}>Últimas 24h</option>
                    <option value={48}>Últimas 48h</option>
                    <option value={96}>Últimas 96h</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div onClick={() => navigate('/vistorias')} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative cursor-pointer active:scale-95 transition-all">
                    <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3"><ClipboardList size={20} /></div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{displayData.stats.totalVistorias}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vistorias</div>
                </div>
                <div onClick={() => navigate('/interdicao')} className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 relative cursor-pointer active:scale-95 transition-all">
                    <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center text-red-600 mb-3"><AlertTriangle size={20} /></div>
                    <div className="text-3xl font-black text-slate-800 tabular-nums">{displayData.stats.totalInterdicoes}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interdições</div>
                </div>
            </div>

            <div className="bg-slate-900 p-5 rounded-[32px] text-white mb-6 relative overflow-hidden shadow-lg" onClick={() => navigate('/vistorias/nova')}>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Prontidão Operacional</span>
                        </div>
                        <h2 className="text-lg font-black leading-tight">Iniciar Nova<br />Vistoria Técnica</h2>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Registro de Campo</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <Truck size={24} className="text-white" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                    <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600"><Users size={20} /></div>
                    <div>
                        <div className="text-xl font-black text-slate-800">{displayData.stats.totalPopulacao}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">Impactados</div>
                    </div>
                </div>
                <div className={`bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-3 transition-all ${syncCount > 0 ? 'bg-orange-50 border-orange-200' : ''}`} onClick={handleSync}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>{syncCount > 0 ? <CloudUpload size={20} /> : <CheckCircle size={20} />}</div>
                    <div>
                        <div className="text-xl font-black text-slate-800">{syncCount}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">Pendentes</div>
                    </div>
                </div>
            </div>



            <div className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-200/60 mb-8 font-sans">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Distribuição por Tipologia</h3>
                    <div className="bg-slate-100 px-2 py-1 rounded-lg text-[9px] font-black text-slate-400">{displayData.stats.totalVistorias} REGISTROS</div>
                </div>
                <div className="space-y-7">
                    {displayData.breakdown.length > 0 ? displayData.breakdown.map((item, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between items-baseline mb-2.5 px-0.5">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{item.label}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-800">{item.count}</span>
                                    <span className="text-[10px] font-bold text-slate-300">{item.percentage}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-100 shadow-inner">
                                <div className={`h-full ${item.color || 'bg-blue-500'} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${item.percentage}%` }} />
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10">
                            <CloudRain size={32} className="mx-auto text-slate-200 mb-3" />
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sem vistorias no período</div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-5 rounded-[40px] shadow-sm border border-slate-100 mb-6">
                <div className="flex justify-between items-center mb-5 px-2">
                    <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Monitoramento Estratégico</h3>
                    <button onClick={() => setShowReportMenu(!showReportMenu)} className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-blue-200 active:scale-95 transition-all">RELATÓRIO PDF</button>
                </div>
                {showReportMenu && (
                    <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        {[0, 24, 48, 96].map(h => (
                            <button key={h} onClick={async () => {
                                setShowReportMenu(false);
                                setGeneratingReport(true);

                                // Sync dashboard timeframe before capture
                                if (timeframe !== h) {
                                    setTimeframe(h);
                                    // Give time for React state update and Map re-render
                                    await new Promise(r => setTimeout(r, 600));
                                }

                                const hLabel = h === 0 ? "Todo o Período" : `Últimas ${h}h`;
                                const rData = getFilteredData(data, h);
                                let pData = []; try { const r = await fetch('/api/pluviometros'); if (r.ok) pData = await r.json() } catch (e) { }

                                // Target the specific map area by ID
                                const mapArea = document.getElementById('map-capture-area');
                                await generateSituationalReport(rData, weather, pData, mapArea, hLabel);

                                setGeneratingReport(false);
                            }} className="bg-slate-50 p-3 rounded-2xl text-[10px] font-black text-slate-600 border border-slate-100 hover:bg-white hover:border-blue-200 transition-all uppercase tracking-tighter">
                                {h === 0 ? "Todo" : `${h} HORAS`}
                            </button>
                        ))}
                    </div>
                )}
                <div id="map-capture-area" className="h-80 w-full rounded-[32px] overflow-hidden bg-slate-100 border border-slate-200 relative z-0 shadow-inner">
                    <MapContainer center={[-20.0246, -40.7464]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} preferCanvas={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <HeatmapLayer points={displayData.locations} options={{ radius: 20, blur: 15 }} />
                        {displayData.locations.map((loc, idx) => (
                            <CircleMarker
                                key={idx}
                                center={[loc.lat, loc.lng]}
                                radius={7}
                                pathOptions={{
                                    color: loc.type === 'interdicao' ? '#dc2626' : (loc.level === 'Alto' || loc.level === 'Iminente' ? '#f97316' : '#3b82f6'),
                                    weight: 2,
                                    fillOpacity: 0.9,
                                    fillColor: '#ffffff'
                                }}
                            />
                        ))}
                    </MapContainer>
                </div>
            </div>

            {generatingReport && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[500] flex items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-[48px] shadow-2xl text-center max-w-xs w-full border border-white/20">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Processando Relatório</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Consolidando indicadores técnicos...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
