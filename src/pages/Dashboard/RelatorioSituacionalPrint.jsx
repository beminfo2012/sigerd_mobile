import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, X, Download, FileText, Calendar, MapPin, Wind, CloudRain, AlertTriangle, ChevronRight, Activity, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';

// Utility component to recalibrate map size and center
const MapController = ({ center, markers }) => {
    const map = useMap();
    useEffect(() => {
        const handleResize = () => {
            map.invalidateSize();
            if (markers && markers.length > 0) {
                const group = new L.featureGroup(markers.map(m => L.marker([m.lat, m.lng])));
                map.fitBounds(group.getBounds().pad(0.2));
            } else if (center) {
                map.setView(center, 13);
            }
        };
        handleResize();
        const timers = [100, 300, 500, 1000, 2000].map(t => setTimeout(handleResize, t));

        window.addEventListener('beforeprint', handleResize);
        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('beforeprint', handleResize);
        };
    }, [map, center, markers]);
    return null;
};

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const RelatorioSituacionalPrint = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Icon helper function for weather
    const getWeatherIcon = (code) => {
        if (code === undefined) return '🌡️';
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 48) return '🌫️';
        if (code <= 67) return '🌦️';
        return '⛈️';
    };

    useEffect(() => {
        const cachedData = sessionStorage.getItem('lastSituationalReport');
        if (cachedData) {
            try {
                setReportData(JSON.parse(cachedData));
                document.title = `Relatório Situacional - ${new Date().toLocaleDateString('pt-BR')}`;
            } catch (e) {
                console.error("Erro ao carregar dados do relatório:", e);
            }
        }
        setLoading(false);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black text-slate-400 uppercase tracking-[2px] text-[10px]">Processando Relatório</p>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-10">
                <div className="text-center p-12 bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-lg">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <FileText size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Sessão Expirada</h2>
                    <p className="text-slate-500 mb-8 font-medium">Por favor, gere o relatório novamente no Dashboard.</p>
                    <button 
                        onClick={() => window.close()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    const { dashboardData, weatherData, pluviometerData, humanitarianData, timeframeLabel, emissionDate, currentStatus, avgAcc, activeWarnings } = reportData;

    return (
        <div className="bg-[#f1f5f9] min-h-screen font-sans text-slate-800 print:bg-white print:p-0 p-8 flex justify-center selection:bg-blue-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
                
                * { font-family: 'Inter', sans-serif; }

                @media screen and (max-width: 1024px) {
                    .print-preview-wrapper { overflow-x: auto; padding: 20px; display: block; width: 100%; }
                    .print-container { min-width: 210mm; transform: scale(0.8); transform-origin: top center; margin-bottom: -50mm; }
                }
                
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container { 
                        width: 190mm !important; 
                        padding: 0 !important; 
                        margin: 0 auto !important; 
                        box-shadow: none !important; 
                        transform: none !important; 
                        border-radius: 0 !important;
                        border: none !important;
                    }
                }
            `}</style>

            {/* Compact Control Bar */}
            <div className="no-print fixed top-4 left-0 right-0 flex justify-center z-[9999]">
                <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-8 shadow-2xl border border-white/10">
                    <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                        <Activity className="text-blue-400" size={18} />
                        <div>
                            <h1 className="font-black text-[11px] uppercase tracking-wider leading-none mb-1">Visualização de Impressão</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{timeframeLabel}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                            <X size={16} /> Fechar
                        </button>
                        <button onClick={handlePrint} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                            <Printer size={16} /> Imprimir Relatório
                        </button>
                    </div>
                </div>
            </div>

            <main className="flex flex-col items-center pt-24 print:pt-0 w-full print-preview-wrapper transition-all">
                <div className="w-[210mm] bg-white shadow-2xl min-h-[297mm] p-12 mb-20 print:mb-0 relative print-container rounded-[32px] border border-slate-200">
                    
                    {/* Header Section */}
                    <header className="flex flex-col items-center mb-8 border-b-2 border-slate-100 pb-6 avoid-break">
                        <div className="w-full flex justify-between items-center mb-6">
                            <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-20 w-auto object-contain" />
                            <div className="text-center px-4">
                                <h3 className="text-slate-900 font-black text-xs uppercase leading-tight mb-0.5">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h3>
                                <div className="h-0.5 w-8 bg-blue-600 mx-auto rounded-full mb-2"></div>
                                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-[2px]">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                            </div>
                            <img src={LOGO_SIGERD} alt="SIGERD" className="h-20 w-auto object-contain" />
                        </div>
                        
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-wider mb-3">Relatório Situacional</h1>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-5 py-2 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-600" /> EMISSÃO: <span className="text-slate-700">{emissionDate}</span></div>
                            <div className="flex items-center gap-1.5"><FileText size={12} className="text-blue-600" /> PERÍODO: <span className="text-slate-700">{timeframeLabel}</span></div>
                        </div>
                    </header>

                    {/* Compact Operational Status - More Narrow */}
                    <div className="flex justify-center gap-3 mb-8 avoid-break">
                        {[
                            { label: 'NORMAL', val: 'ESTÁVEL', icon: ShieldCheck, color: 'emerald', active: currentStatus.label === 'NORMAL' },
                            { label: 'ATENÇÃO', val: 'VIGILÂNCIA', icon: Activity, color: 'amber', active: currentStatus.label === 'ATENÇÃO' },
                            { label: 'ALERTA', val: 'MOBILIZAÇÃO', icon: AlertTriangle, color: 'red', active: currentStatus.label === 'ALERTA' }
                        ].map((s, idx) => (
                            <div key={idx} className={`w-[160px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${s.active ? `bg-${s.color}-50 border-${s.color}-200 ring-4 ring-${s.color}-50` : 'bg-slate-50 border-slate-100 opacity-20 grayscale'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${s.active ? `bg-${s.color}-500 text-white shadow-lg` : 'bg-slate-200 text-slate-400'}`}>
                                    <s.icon size={16} />
                                </div>
                                <div className="font-black text-[7.5px] uppercase tracking-widest mb-0.5 whitespace-nowrap opacity-60">Status {s.label}</div>
                                <div className="font-black text-sm tracking-tight text-slate-900">{s.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Mini Stats Row */}
                    <div className="grid grid-cols-5 gap-3 mb-8 avoid-break">
                        {[
                            { label: 'Vistorias', val: dashboardData.vistorias?.stats?.total || 0, color: 'blue' },
                            { label: 'Ocorrências', val: dashboardData.ocorrencias?.stats?.total || 0, color: 'indigo' },
                            { label: 'Interdições', val: dashboardData.interdicoes?.stats?.total || 0, color: 'red' },
                            { label: 'Média Chuva', val: `${avgAcc} mm`, color: 'sky' },
                            { label: 'Avisos INMET', val: activeWarnings.length, color: 'amber' },
                        ].map((kpi, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-full h-[3px] bg-${kpi.color}-500`}></div>
                                <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</div>
                                <div className="text-lg font-black text-slate-900 tracking-tighter">{kpi.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Middle Section: Map & Indicators */}
                    <div className="grid grid-cols-12 gap-8 mb-8">
                        {/* Map Block */}
                        <div className="col-span-12 avoid-break">
                            <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">
                                🗺️ Distribuição Geográfica
                            </h3>
                            <div className="bg-slate-50 border-2 border-slate-100 rounded-[24px] h-[320px] overflow-hidden relative shadow-inner">
                                <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                    {(dashboardData.locations || []).filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng)).map((l, i) => (
                                        <Marker key={i} position={[l.lat, l.lng]} icon={L.divIcon({ className: 'custom-m', html: `<div style="background:#ef4444; width:8px; height:8px; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`, iconSize:[8,8], iconAnchor:[4,4] })} />
                                    ))}
                                    <MapController center={[-20.0246, -40.7464]} markers={(dashboardData.locations || []).filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng))} />
                                </MapContainer>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 px-4 rounded-xl border border-white max-w-[180px] z-[999] print:hidden">
                                    <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-700 mb-1">
                                        <span>Incidentes</span>
                                        <span className="text-blue-600">{(dashboardData.locations || []).filter(l => l.lat && l.lng).length} pts</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 w-[100%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weather Alerts & Rainfall */}
                        <div className="col-span-12 lg:col-span-7 avoid-break">
                            <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">
                                🔔 Alertas Vigentes (INMET)
                            </h3>
                            <div className="flex flex-col gap-3">
                                {activeWarnings.length > 0 ? activeWarnings.map((a, i) => (
                                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4 border-l-[6px] border-l-amber-500">
                                        <div className="text-[9px] font-black text-amber-900 uppercase tracking-widest mb-1">{a.categoria || 'ALERTA'}</div>
                                        <p className="text-xs font-bold text-amber-800 leading-tight">{a.descricao}</p>
                                    </div>
                                )) : (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                                        <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none">Céu Limpo e Condições Estáveis</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-5 avoid-break">
                            <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3">
                                🌧️ Pluviômetros (CEMADEN)
                            </h3>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                                {(pluviometerData || []).slice(0, 5).map((p, i) => {
                                    const val = (p.acc24hr || p.rainRaw || 0);
                                    let c = val >= 80 ? 'red' : val >= 40 ? 'amber' : 'emerald';
                                    return (
                                        <div key={i} className="bg-white p-2.5 px-3 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                                            <span className="text-[8.5px] font-black text-slate-600 uppercase tracking-tight leading-none">{p.name.slice(0, 24)}</span>
                                            <span className={`text-[11px] font-black text-${c}-600 underline decoration-2 underline-offset-4`}>{val.toFixed(1)} <span className="text-[8px] opacity-40">mm</span></span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* weather section restored with forecast */}
                    {weatherData?.current && (
                        <div className="mb-10 avoid-break border-t pt-8 border-slate-100">
                            <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                🌤️ Condições e Previsão Meteorológica
                            </h3>
                            <div className="bg-slate-50 border border-slate-100 rounded-[28px] overflow-hidden">
                                <div className="grid grid-cols-12 gap-6 p-6 border-b border-slate-200">
                                    <div className="col-span-12 lg:col-span-4 flex items-center justify-center border-r border-slate-200 pr-6 gap-6">
                                        <div className="text-4xl">{getWeatherIcon ? getWeatherIcon(weatherData.current.code) : '🌡️'}</div>
                                        <div>
                                            <div className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(weatherData.current.temp || 0)}°C</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Temperatura Atual</div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-6 pl-6">
                                        {[
                                            { label: 'Umidade', val: `${weatherData.current.humidity}%`, icon: '💧' },
                                            { label: 'Prob. Chuva', val: `${weatherData.daily?.[0]?.rainProb || 0}%`, icon: '🌧️' },
                                            { label: 'Vento', val: `${Math.round(weatherData.current.wind || 6)} km/h`, icon: '💨' }
                                        ].map((w, i) => (
                                            <div key={i} className="text-center">
                                                <div className="text-xl mb-1">{w.icon}</div>
                                                <div className="text-lg font-black text-slate-900 tracking-tight">{w.val}</div>
                                                <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">{w.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* 5-Day Forecast Grid */}
                                <div className="p-6 grid grid-cols-5 gap-4">
                                    {(weatherData.daily || []).slice(1, 6).map((day, i) => {
                                        const dailyDate = new Date(day.date);
                                        const weekday = dailyDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
                                        return (
                                            <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
                                                <span className="text-[8px] font-black text-slate-400 mb-2">{weekday}</span>
                                                <div className="text-2xl mb-2">{getWeatherIcon ? getWeatherIcon(day.code) : '🌥️'}</div>
                                                <div className="text-xs font-black text-slate-800 leading-none">
                                                    {Math.round(day.tempMax)}° <span className="text-slate-400 font-bold ml-0.5">/ {Math.round(day.tempMin)}°</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-2">
                                                    <span className="text-[8px] font-black text-blue-500">{day.rainProb}%</span>
                                                    <CloudRain size={8} className="text-blue-400" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categorized Activity Tables */}
                    <div className="space-y-10 mb-12">
                        {/* 1. OCORRÊNCIAS */}
                        {(dashboardData.ocorrencias?.locations?.length > 0) && (
                            <div className="avoid-break">
                                <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                    🚨 Detalhamento de Ocorrências
                                </h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left text-[9.5px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 w-[50px] font-black uppercase text-slate-400 tracking-widest">Nº</th>
                                                <th className="p-3 w-[150px] font-black uppercase text-slate-400 tracking-widest">Cronologia</th>
                                                <th className="p-3 w-[180px] font-black uppercase text-slate-700 tracking-widest">Tipologia</th>
                                                <th className="p-3 font-black uppercase text-slate-400 tracking-widest">Subtipo / Detalhes</th>
                                                <th className="p-3 w-[100px] text-center font-black uppercase text-slate-400 tracking-widest">Coord</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.ocorrencias.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-black text-blue-600 align-top">{l.formattedId || l.id || '---'}</td>
                                                    <td className="p-3 font-bold text-slate-500 align-top">{l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}</td>
                                                    <td className="p-3 font-black text-slate-900 uppercase underline decoration-red-500/30 decoration-2 align-top break-words leading-tight">{l.risk}</td>
                                                    <td className="p-3 font-medium text-slate-500 italic align-top break-words leading-tight max-w-[300px]">{l.details || l.subtype || '---'}</td>
                                                    <td className="p-3 text-center font-mono text-[8.5px] text-slate-400 opacity-60 align-top">{l.lat?.toFixed(5)},{l.lng?.toFixed(5)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 2. VISTORIAS */}
                        {(dashboardData.vistorias?.locations?.length > 0) && (
                            <div className="avoid-break">
                                <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                    📋 Detalhamento de Vistorias
                                </h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left text-[9.5px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 w-[80px] font-black uppercase text-slate-400 tracking-widest">Vistoria Nº</th>
                                                <th className="p-3 w-[150px] font-black uppercase text-slate-400 tracking-widest">Cronologia</th>
                                                <th className="p-3 w-[180px] font-black uppercase text-slate-700 tracking-widest">Risco / Tipologia</th>
                                                <th className="p-3 font-black uppercase text-slate-400 tracking-widest">Observações</th>
                                                <th className="p-3 w-[100px] text-center font-black uppercase text-slate-400 tracking-widest">Coord</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.vistorias.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-black text-blue-600 align-top">{l.formattedId || l.id || '---'}</td>
                                                    <td className="p-3 font-bold text-slate-500 align-top">{l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}</td>
                                                    <td className="p-3 font-black text-slate-900 uppercase underline decoration-blue-500/30 decoration-2 align-top break-words leading-tight">{l.risk}</td>
                                                    <td className="p-3 font-medium text-slate-500 italic align-top break-words leading-tight max-w-[300px]">{l.details || l.subtype || '---'}</td>
                                                    <td className="p-3 text-center font-mono text-[8.5px] text-slate-400 opacity-60 align-top">{l.lat?.toFixed(5)},{l.lng?.toFixed(5)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 3. INTERDIÇÕES */}
                        {(dashboardData.interdicoes?.locations?.length > 0) && (
                            <div className="avoid-break">
                                <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                    🚫 Detalhamento de Interdições
                                </h3>
                                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <table className="w-full text-left text-[9.5px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-3 w-[100px] font-black uppercase text-slate-400 tracking-widest">Nº Interdição</th>
                                                <th className="p-3 w-[150px] font-black uppercase text-slate-400 tracking-widest">Cronologia</th>
                                                <th className="p-3 w-[180px] font-black uppercase text-slate-700 tracking-widest">Tipo de Risco</th>
                                                <th className="p-3 font-black uppercase text-slate-400 tracking-widest">Medida Adotada</th>
                                                <th className="p-3 w-[150px] text-center font-black uppercase text-slate-400 tracking-widest">Coordenadas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.interdicoes.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-black text-blue-600 align-top">{l.formattedId || l.id || '---'}</td>
                                                    <td className="p-3 font-bold text-slate-500 align-top">{l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}</td>
                                                    <td className="p-3 font-black text-slate-900 uppercase underline decoration-red-600/30 decoration-2 align-top break-words leading-tight">{l.risco_tipo || l.risk || '---'}</td>
                                                    <td className="p-3 font-medium text-slate-500 italic align-top break-words leading-tight max-w-[300px]">{l.medida_tipo || l.details || l.subtype || '---'}</td>
                                                    <td className="p-3 text-center font-mono text-[8.5px] text-slate-400 opacity-60 align-top">{l.coordenadas || (l.lat ? `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}` : '---')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {(!dashboardData.ocorrencias?.locations?.length && !dashboardData.vistorias?.locations?.length && !dashboardData.interdicoes?.locations?.length) && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[4px] italic">Sem registros mapeados no período selecionado</p>
                            </div>
                        )}
                    </div>

                    {/* Humanitarian Assistance */}
                    {humanitarianData && (
                        <div className="mb-10 avoid-break border-t pt-10 border-slate-100">
                            <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">
                                🏠 Assistência Humanitária
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Abrigos Cadastrados', val: humanitarianData.shelters?.length || 0, color: 'blue' },
                                    { label: 'Pessoas/Famílias', val: humanitarianData.occupants?.length || 0, color: 'blue' },
                                    { label: 'Kits Emergência', val: (humanitarianData.inventory || []).filter(i => String(i.item_name).toLowerCase().includes('kit')).length, color: 'pink' },
                                ].map((h, i) => (
                                    <div key={i} className={`bg-white border-2 border-slate-100 rounded-2xl p-5 text-center border-b-4 border-b-${h.color}-600 shadow-sm transition-all hover:translate-y-[-2px]`}>
                                        <div className={`text-[7.5px] font-black text-${h.color}-600 uppercase tracking-widest mb-1`}>{h.label}</div>
                                        <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{h.val}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Official Footer */}
                    <footer className="mt-auto bg-slate-900 rounded-[28px] p-8 text-white flex justify-between items-center avoid-break">
                        <div className="flex-1 border-r border-slate-800 pr-8">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-8 h-8 bg-blue-600/20 rounded-lg border border-blue-500/20 flex items-center justify-center text-lg">⚠️</div>
                                <h4 className="font-black text-xs uppercase tracking-wider">Protocolo Operacional</h4>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed max-w-[400px]">
                                Informações dinâmicas do estado operacional. Em cenários de incidentes geológicos ou hidrológicos, as equipes permanecem em prontidão para acionamento via 199.
                                <br /><strong>SIGERD MOBILE - Defesa Civil SMJ</strong>
                            </p>
                        </div>
                        <div className="pl-8 text-right underline decoration-blue-500/50 decoration-4 underline-offset-8">
                            <div className="text-2xl font-black tracking-tighter">SIGERD <span className="text-blue-500">MOBILE</span></div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-[4px]">SANTA MARIA DE JETIBÁ</div>
                        </div>
                    </footer>

                </div>
            </main>
        </div>
    );
};

export default RelatorioSituacionalPrint;
