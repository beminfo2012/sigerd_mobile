import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, X, Download, FileText, Calendar, MapPin, Wind, CloudRain, AlertTriangle, ChevronRight, Activity, ShieldCheck, Map as MapIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { UserContext } from '../../App';
const LOGO_DEFESA_CIVIL_SITUACIONAL = '/logo-defesa-civil-branco.png';
const LOGO_SIGERD_SITUACIONAL = '/logo_sigerd_new.png';

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
    const userProfile = useContext(UserContext);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(1.5, prev + 0.1));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(0.5, prev - 0.1));
    };

    const handleResetZoom = () => {
        setZoom(1.0);
    };
    
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
            } catch (e) {
                console.error("Erro ao carregar dados do relatório:", e);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (reportData) {
            const { timeframeLabel, emissionDate } = reportData;
            
            let safeDateStr = "";
            if (emissionDate) {
                safeDateStr = emissionDate
                    .replace(/\//g, '_')
                    .replace(/:/g, '_')
                    .replace(/\s*-\s*/g, ' ');
            } else {
                safeDateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
            }
            
            const safeTimeframe = timeframeLabel 
                ? timeframeLabel.replace(/\s+/g, '_') 
                : '24h';
                
            document.title = `Relatório Situacional - ${safeDateStr} (${safeTimeframe})`;
        }
    }, [reportData]);

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

    const emittedBy = userProfile?.full_name || 'SIGERD Mobile — Defesa Civil SMJ';

    // Status mapping variables
    const isNormal = currentStatus?.label === 'NORMAL';
    const isAtencao = currentStatus?.label === 'ATENÇÃO';
    const isPerigo = currentStatus?.label === 'PERIGO';
    const isGPerigo = currentStatus?.label === 'G. PERIGO';

    // Status Banner class modifier
    const statusBannerClass = isNormal ? 'banner-green' : isAtencao ? 'banner-amber' : isPerigo ? 'banner-orange' : 'banner-red';
    
    // Status State active modifiers
    const normalStateActive = isNormal ? 'active active-green' : '';
    const atencaoStateActive = isAtencao ? 'active active-amber' : '';
    const perigoStateActive = isPerigo ? 'active active-orange' : '';
    const gperigoStateActive = isGPerigo ? 'active active-red' : '';

    // Active Status pulse color modifier
    const activePulseColor = isNormal ? 'pulse-green' : isAtencao ? 'pulse-amber' : isPerigo ? 'pulse-orange' : 'pulse-red';

    // Dynamic protocol text based on status
    let protocolText = "Monitoramento contínuo ativo. Em cenários de incidentes geológicos ou hidrológicos, equipes permanecem em prontidão para acionamento imediato.";
    if (isNormal) {
        protocolText = "Monitoramento contínuo ativo. Condições de normalidade. Equipes em rotina de vigilância preventiva e atividades ordinárias.";
    } else if (isAtencao) {
        protocolText = "Vigilância de riscos. Possibilidade de ocorrências devido a condições meteorológicas adversas. Equipes em prontidão para pronta resposta.";
    } else if (isPerigo) {
        protocolText = "Alerta de risco elevado. Risco de incidentes devido a chuvas intensas ou acumuladas. Equipes de prontidão e monitoramento intensificado.";
    } else if (isGPerigo) {
        protocolText = "Mobilização geral ativa. Alto risco de incidentes geológicos ou hidrológicos. Equipes em campo para atendimento emergencial imediato.";
    }

    return (
        <div className="bg-[#f1f5f9] min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex flex-col items-center selection:bg-blue-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
                
                :root {
                    --navy:   #0B1F3A;
                    --navy2:  #122848;
                    --navy3:  #1B3A5E;
                    --blue:   #1A6FBF;
                    --blue2:  #2484D9;
                    --ice:    #E8F1FA;
                    --ice2:   #D4E5F5;
                    --amber:  #D48A0C;
                    --amber2: #F5A623;
                    --amber-bg: #FFF8E8;
                    --red:    #B83232;
                    --red-bg: #FDEAEA;
                    --green:  #1A7A48;
                    --green2: #22A060;
                    --green-bg: #EAF7EF;
                    --gray1:  #F4F6F9;
                    --gray2:  #E8ECF2;
                    --gray3:  #C8D0DC;
                    --gray4:  #8A95A5;
                    --text:   #1A2332;
                    --text2:  #4A5568;
                    --text3:  #718096;
                    --white:  #FFFFFF;
                    --border: #DDE3ED;
                }

                .print-container * {
                    font-family: 'IBM Plex Sans', sans-serif;
                    box-sizing: border-box;
                }

                /* ── CABEÇALHO ── */
                .header {
                    background: var(--navy);
                    color: var(--white);
                    padding: 0;
                }

                .header-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 32px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }

                .header-brand {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .logo-dc {
                    width: 56px;
                    height: 56px;
                    flex-shrink: 0;
                }

                .brand-text {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    flex: 1;
                    gap: 2px;
                }

                .brand-title {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.65);
                    line-height: 1.3;
                }

                .brand-subtitle {
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--white);
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                }

                .header-sigerd {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }

                .sigerd-logo {
                    width: 48px;
                    height: 48px;
                    opacity: 0.9;
                }

                .header-bottom {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: rgba(0,0,0,0.18);
                }

                .doc-title {
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.95);
                }

                .doc-meta {
                    display: flex;
                    gap: 24px;
                    align-items: center;
                    justify-content: center;
                }

                .meta-item {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                    font-size: 11px;
                }
                .meta-item span.label {
                    color: rgba(255,255,255,0.4);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .meta-item span.value {
                    color: rgba(255,255,255,0.85);
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 11px;
                    font-weight: 500;
                }

                .sep { color: rgba(255,255,255,0.15); }

                /* ── FAIXA DE STATUS ── */
                .status-banner {
                    background: var(--navy2);
                    border-bottom: 3px solid var(--amber2);
                    padding: 14px 32px 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .status-banner.banner-green  { border-bottom-color: var(--green2); }
                .status-banner.banner-amber  { border-bottom-color: var(--amber2); }
                .status-banner.banner-orange { border-bottom-color: #f97316; }
                .status-banner.banner-red    { border-bottom-color: var(--red); }

                .status-states {
                    display: flex;
                    gap: 0;
                    align-items: stretch;
                    justify-content: center;
                    width: 100%;
                }

                .status-state {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 20px;
                    border: 1px solid rgba(255,255,255,0.08);
                    cursor: default;
                    opacity: 0.35;
                    transition: opacity 0.2s;
                }

                .status-state:first-child { border-radius: 4px 0 0 4px; }
                .status-state:last-child  { border-radius: 0 4px 4px 0; }

                .status-state.active {
                    opacity: 1;
                }
                
                .status-state.active.active-green {
                    background: rgba(26,122,72,0.14);
                    border-color: var(--green2);
                }
                .status-state.active.active-amber {
                    background: rgba(244,162,35,0.14);
                    border-color: var(--amber2);
                }
                .status-state.active.active-orange {
                    background: rgba(249,115,22,0.14);
                    border-color: #f97316;
                }
                .status-state.active.active-red {
                    background: rgba(184,50,50,0.14);
                    border-color: var(--red);
                }

                .status-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .dot-green  { background: var(--green2); }
                .dot-amber  { background: var(--amber2); }
                .dot-orange { background: #f97316; }
                .dot-red    { background: #E05252; }

                .status-label {
                    display: flex;
                    flex-direction: column;
                }
                .status-tag {
                    font-size: 9px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                    font-weight: 400;
                }
                .status-name {
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    color: var(--white);
                }

                .status-active-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 9px;
                    color: rgba(255,255,255,0.4);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .pulse {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    flex-shrink: 0;
                }
                .pulse-green  { background: var(--green2); }
                .pulse-amber  { background: var(--amber2); }
                .pulse-orange { background: #f97316; }
                .pulse-red    { background: var(--red); }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }

                /* ── LAYOUT PRINCIPAL ── */
                .main {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 28px 32px 48px;
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                }

                /* ── SEÇÃO GENÉRICA ── */
                .section {
                    background: var(--white);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    overflow: hidden;
                }

                .section-header {
                    padding: 10px 16px;
                    background: var(--gray1);
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .section-icon {
                    width: 16px; height: 16px;
                    color: var(--blue);
                    flex-shrink: 0;
                }

                .section-title {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--text2);
                }

                .section-body {
                    padding: 16px;
                }

                /* ── INDICADORES PRIMÁRIOS ── */
                .col-span-3 { grid-column: span 3; }
                .col-span-2 { grid-column: span 2; }
                .col-span-1 { grid-column: span 1; }

                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 1px;
                    background: var(--border);
                }

                .kpi-card {
                    background: var(--white);
                    padding: 18px 16px 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 6px;
                }

                .kpi-label {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--text3);
                }

                .kpi-value {
                    font-size: 28px;
                    font-weight: 300;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--text);
                    line-height: 1;
                }

                .kpi-unit {
                    font-size: 12px;
                    font-weight: 400;
                    color: var(--text3);
                    margin-left: 3px;
                }

                .kpi-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 2px 7px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: 0.04em;
                    width: fit-content;
                    margin-top: 2px;
                }

                .badge-ok     { background: var(--green-bg); color: var(--green); }
                .badge-warn   { background: var(--amber-bg); color: #8A5800; }
                .badge-alert  { background: var(--red-bg);   color: var(--red); }
                .badge-info   { background: var(--ice); color: var(--blue); }
                .badge-neutral{ background: var(--gray2); color: var(--text3); }

                .kpi-accent-top {
                    height: 3px;
                    border-radius: 3px 3px 0 0;
                    margin: -18px -16px 12px;
                    align-self: stretch;
                }
                .accent-ok    { background: var(--green2); }
                .accent-warn  { background: var(--amber2); }
                .accent-red   { background: var(--red); }
                .accent-blue  { background: var(--blue2); }
                .accent-neutral { background: var(--gray3); }

                /* ── PLUVIÔMETROS ── */
                .gauge-row {
                    margin-bottom: 14px;
                }
                .gauge-row:last-child { margin-bottom: 0; }

                .gauge-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 5px;
                }
                .gauge-name {
                    font-size: 11px;
                    color: var(--text2);
                    font-weight: 500;
                    font-family: 'IBM Plex Mono', monospace;
                    letter-spacing: 0.03em;
                }
                .gauge-val {
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--blue);
                }

                .gauge-track {
                    height: 6px;
                    background: var(--gray2);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .gauge-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
                }

                .gauge-meta {
                    font-size: 10px;
                    color: var(--text3);
                    margin-top: 4px;
                    letter-spacing: 0.02em;
                }

                /* ── ALERTAS INMET ── */
                .alert-box {
                    padding: 12px 14px;
                    border-radius: 4px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                .alert-box.no-alert {
                    background: var(--green-bg);
                    border: 1px solid #B2DFC5;
                }
                .alert-dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    background: var(--green2);
                    flex-shrink: 0;
                    margin-top: 4px;
                }
                .alert-text {
                    font-size: 12px;
                    color: var(--green);
                    font-weight: 500;
                    line-height: 1.4;
                }
                .alert-sub {
                    font-size: 10px;
                    color: var(--green);
                    opacity: 0.7;
                    margin-top: 2px;
                }

                /* ── PREVISÃO DO TEMPO ── */
                .weather-now {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border);
                    margin-bottom: 14px;
                }

                .temp-big {
                    font-size: 38px;
                    font-weight: 300;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--text);
                    line-height: 1;
                }
                .temp-big sup {
                    font-size: 16px;
                    font-weight: 400;
                    vertical-align: super;
                    color: var(--text3);
                }

                .weather-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 8px;
                    flex: 1;
                }

                .ws-item {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .ws-label {
                    font-size: 9px;
                    letter-spacing: 0.10em;
                    text-transform: uppercase;
                    color: var(--text3);
                }
                .ws-value {
                    font-size: 15px;
                    font-weight: 500;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--text);
                }

                .forecast-row {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 6px;
                    margin-top: 4px;
                }

                .fc-day {
                    background: var(--gray1);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 8px 6px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .fc-weekday {
                    font-size: 9px;
                    font-weight: 600;
                    letter-spacing: 0.10em;
                    text-transform: uppercase;
                    color: var(--text3);
                }

                .fc-symbol {
                    font-size: 16px;
                    line-height: 1;
                }

                .fc-temps {
                    font-size: 10px;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--text2);
                    font-weight: 500;
                }

                .fc-prob {
                    font-size: 9px;
                    color: var(--blue);
                    font-weight: 500;
                }

                /* ── ASSISTÊNCIA HUMANITÁRIA ── */
                .assist-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                }

                .assist-card {
                    background: var(--gray1);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    padding: 12px;
                    text-align: center;
                }

                .assist-num {
                    font-size: 26px;
                    font-weight: 300;
                    font-family: 'IBM Plex Mono', monospace;
                    color: var(--text);
                    line-height: 1;
                }
                .assist-label {
                    font-size: 9px;
                    letter-spacing: 0.10em;
                    text-transform: uppercase;
                    color: var(--text3);
                    margin-top: 4px;
                    font-weight: 600;
                }

                .assist-body-split {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 20px;
                }
                .assist-column-numbers {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .assist-column-records {
                    display: flex;
                    flex-direction: column;
                    justify-content: stretch;
                }
                .no-records.fill-height {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    padding: 20px;
                }

                /* ── PROTOCOLO ── */
                .protocol-box {
                    background: var(--navy);
                    border-radius: 4px;
                    padding: 16px;
                    color: var(--white);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .protocol-title {
                    font-size: 10px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.45);
                    font-weight: 600;
                }

                .protocol-text {
                    font-size: 12px;
                    color: rgba(255,255,255,0.75);
                    line-height: 1.6;
                }

                .protocol-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--amber2);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .cta-num {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 14px;
                    background: rgba(244,162,35,0.15);
                    padding: 2px 8px;
                    border-radius: 3px;
                    border: 1px solid rgba(244,162,35,0.3);
                }

                /* ── RODAPÉ ── */
                .footer {
                    background: var(--navy);
                    border-top: 1px solid rgba(255,255,255,0.06);
                    padding: 14px 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    text-align: center;
                }

                .footer-left {
                    font-size: 10px;
                    color: rgba(255,255,255,0.3);
                    letter-spacing: 0.06em;
                }

                .footer-right {
                    font-size: 10px;
                    font-family: 'IBM Plex Mono', monospace;
                    color: rgba(255,255,255,0.25);
                    letter-spacing: 0.08em;
                }

                /* ── SEÇÃO SEM REGISTROS ── */
                .no-records {
                    padding: 18px;
                    text-align: center;
                    color: var(--text3);
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    background: var(--gray1);
                    border-radius: 4px;
                    border: 1px dashed var(--gray3);
                    font-weight: 500;
                }

                /* ── DIVISOR VERTICAL ── */
                .vdivider {
                    width: 1px;
                    background: var(--border);
                    margin: 0 2px;
                }

                /* ── PRINT & SCREEN PREVIEW OVERRIDES ── */
                .print-container {
                    zoom: var(--report-zoom, 1.0);
                }
                
                @media screen and (max-width: 1024px) {
                    .print-preview-wrapper { overflow-x: auto; padding: 20px; display: flex; justify-content: flex-start; align-items: flex-start; width: 100%; }
                    .print-container { min-width: 210mm; }
                }
                
                @media print {
                    @page { margin: 20mm 0 0 0; size: A4; }
                    @page :first { margin: 0; }
                    html, body {
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-main-area {
                        height: 100% !important;
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container { 
                        width: 210mm !important; 
                        min-height: 100% !important;
                        height: auto !important;
                        display: flex !important;
                        flex-direction: column !important;
                        padding: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        transform: none !important; 
                        border-radius: 0 !important;
                        border: none !important;
                        zoom: 1 !important;
                    }
                    .footer {
                        margin-top: auto !important;
                    }
                }
            `}</style>

            {/* Options Bar - Fixed at top, 100% width */}
            <div className="no-print fixed top-0 left-0 right-0 w-full bg-slate-900 border-b border-white/10 z-[9999] px-6 py-3 flex justify-between items-center shadow-lg">
                {/* Left Section */}
                <div className="flex items-center gap-3">
                    <Activity className="text-blue-400" size={18} />
                    <div>
                        <h1 className="font-black text-[11px] uppercase tracking-wider leading-none mb-1 text-white">Visualização de Impressão</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{timeframeLabel}</p>
                    </div>
                </div>

                {/* Middle Section - Zoom Controls */}
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleZoomOut} 
                        className="h-8 w-8 hover:bg-white/10 rounded-lg transition-all text-white flex items-center justify-center disabled:opacity-40"
                        disabled={zoom <= 0.5}
                        title="Diminuir Zoom"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span 
                        onClick={handleResetZoom}
                        className="text-[10px] font-black text-slate-300 uppercase tracking-wider px-2 cursor-pointer hover:text-white transition-colors min-w-[50px] text-center"
                        title="Restaurar Zoom (100%)"
                    >
                        {Math.round(zoom * 100)}%
                    </span>
                    <button 
                        onClick={handleZoomIn} 
                        className="h-8 w-8 hover:bg-white/10 rounded-lg transition-all text-white flex items-center justify-center disabled:opacity-40"
                        disabled={zoom >= 1.5}
                        title="Aumentar Zoom"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
                
                {/* Right Section */}
                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <X size={16} /> Fechar
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                        <Printer size={16} /> Imprimir Relatório
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper transition-all">
                <div className="w-[210mm] bg-white shadow-2xl min-h-[297mm] p-0 mb-20 print:mb-0 relative print-container rounded-[8px] border border-slate-200 overflow-hidden flex flex-col justify-between" style={{ '--report-zoom': zoom }}>
                    
                    <div>
                        {/* CABEÇALHO */}
                        <header className="header">
                            <div className="header-top">
                                <div className="header-brand">
                                    {/* Logo Defesa Civil Real */}
                                    <img src={LOGO_DEFESA_CIVIL_SITUACIONAL} alt="Defesa Civil" className="logo-dc" style={{ objectFit: 'contain' }} />
                                </div>

                                <div className="brand-text">
                                    <span className="brand-title">Prefeitura Municipal de Santa Maria de Jetibá — ES</span>
                                    <span className="brand-subtitle">Coordenadoria Municipal de Proteção e Defesa Civil</span>
                                </div>

                                <div className="header-sigerd">
                                    {/* Logo SIGERD Real */}
                                    <img src={LOGO_SIGERD_SITUACIONAL} alt="SIGERD" className="sigerd-logo" style={{ objectFit: 'contain' }} />
                                </div>
                            </div>

                            <div className="header-bottom">
                                <span className="doc-title">Relatório Situacional</span>
                                <div className="doc-meta">
                                    <div className="meta-item">
                                        <span className="label">Emissão</span>
                                        <span className="value">{emissionDate}</span>
                                    </div>
                                    <span className="sep">|</span>
                                    <div className="meta-item">
                                        <span className="label">Período</span>
                                        <span className="value">{timeframeLabel}</span>
                                    </div>
                                    <span className="sep">|</span>
                                    <div className="meta-item">
                                        <span className="label">Emitido por</span>
                                        <span className="value">{emittedBy}</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* FAIXA DE STATUS OPERACIONAL */}
                        <div className={`status-banner ${statusBannerClass}`}>
                            <div className="status-states">
                                <div className={`status-state ${normalStateActive}`}>
                                    <div className="status-dot dot-green"></div>
                                    <div className="status-label">
                                        <span className="status-tag">NORMAL</span>
                                        <span className="status-name">Estável</span>
                                    </div>
                                </div>
                                <div className={`status-state ${atencaoStateActive}`}>
                                    <div className="status-dot dot-amber"></div>
                                    <div className="status-label">
                                        <span className="status-tag">ATENÇÃO</span>
                                        <span className="status-name">Vigilância</span>
                                    </div>
                                </div>
                                <div className={`status-state ${perigoStateActive}`}>
                                    <div className="status-dot dot-orange"></div>
                                    <div className="status-label">
                                        <span className="status-tag">PERIGO</span>
                                        <span className="status-name">Alerta</span>
                                    </div>
                                </div>
                                <div className={`status-state ${gperigoStateActive}`}>
                                    <div className="status-dot dot-red"></div>
                                    <div className="status-label">
                                        <span className="status-tag">G. PERIGO</span>
                                        <span className="status-name">Mobilização</span>
                                    </div>
                                </div>
                            </div>

                            <div className="status-active-label">
                                <div className={`pulse ${activePulseColor}`}></div>
                                STATUS OPERACIONAL ATIVO — ATUALIZAÇÃO AUTOMÁTICA VIA SIGERD
                            </div>
                        </div>

                        {/* INDICADORES PRIMÁRIOS */}
                        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                                <div style={{ padding: '10px 32px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--blue)' }}>
                                        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                                        <path d="M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                        <path d="M4 5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                    </svg>
                                    <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>Indicadores do Período</span>
                                </div>
                                <div className="kpi-grid">
                                    <div className="kpi-card">
                                        <div className={`kpi-accent-top ${dashboardData.vistorias?.stats?.total > 0 ? 'accent-blue' : 'accent-neutral'}`}></div>
                                        <div className="kpi-label">Vistorias</div>
                                        <div className="kpi-value">{dashboardData.vistorias?.stats?.total || 0}</div>
                                        <div className={`kpi-badge ${dashboardData.vistorias?.stats?.total > 0 ? 'badge-info' : 'badge-neutral'}`}>
                                            {dashboardData.vistorias?.stats?.total > 0 ? `${dashboardData.vistorias.stats.total} registradas` : 'Nenhum registro'}
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className={`kpi-accent-top ${dashboardData.ocorrencias?.stats?.total > 0 ? 'accent-red' : 'accent-neutral'}`}></div>
                                        <div className="kpi-label">Ocorrências</div>
                                        <div className="kpi-value">{dashboardData.ocorrencias?.stats?.total || 0}</div>
                                        <div className={`kpi-badge ${dashboardData.ocorrencias?.stats?.total > 0 ? 'badge-alert' : 'badge-ok'}`}>
                                            {dashboardData.ocorrencias?.stats?.total > 0 ? `${dashboardData.ocorrencias.stats.total} ativas` : 'Sem ocorrências'}
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className={`kpi-accent-top ${dashboardData.interdicoes?.stats?.total > 0 ? 'accent-red' : 'accent-neutral'}`}></div>
                                        <div className="kpi-label">Interdições</div>
                                        <div className="kpi-value">{dashboardData.interdicoes?.stats?.total || 0}</div>
                                        <div className={`kpi-badge ${dashboardData.interdicoes?.stats?.total > 0 ? 'badge-alert' : 'badge-ok'}`}>
                                            {dashboardData.interdicoes?.stats?.total > 0 ? `${dashboardData.interdicoes.stats.total} ativas` : 'Nenhuma ativa'}
                                        </div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className="kpi-accent-top accent-blue"></div>
                                        <div className="kpi-label">Chuva Média</div>
                                        <div className="kpi-value">{avgAcc}<span className="kpi-unit">mm</span></div>
                                        <div className="kpi-badge badge-info">Acumulado 24h</div>
                                    </div>
                                    <div className="kpi-card">
                                        <div className={`kpi-accent-top ${activeWarnings.length > 0 ? 'accent-warn' : 'accent-neutral'}`}></div>
                                        <div className="kpi-label">Avisos INMET</div>
                                        <div className="kpi-value">{activeWarnings.length}</div>
                                        <div className={`kpi-badge ${activeWarnings.length > 0 ? 'badge-warn' : 'badge-ok'}`}>
                                            {activeWarnings.length > 0 ? `${activeWarnings.length} vigente(s)` : 'Nenhum vigente'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTEÚDO PRINCIPAL */}
                        <div className="main">

                            {/* PLUVIÔMETROS */}
                            <div className="section col-span-1 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2 C8 2 3 8 3 11 a5 5 0 0 0 10 0 C13 8 8 2 8 2Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                    </svg>
                                    <span className="section-title">Pluviômetros CEMADEN</span>
                                </div>
                                <div className="section-body">
                                    {pluviometerData && pluviometerData.length > 0 ? (
                                        pluviometerData.slice(0, 5).map((p, i) => {
                                            const val = (p.acc24hr || p.rainRaw || 0);
                                            const pct = Math.min(100, val);
                                            let gradient = 'linear-gradient(90deg, var(--blue), var(--blue2))';
                                            if (val >= 80) {
                                                gradient = 'linear-gradient(90deg, var(--red), #E05252)';
                                            } else if (val >= 40) {
                                                gradient = 'linear-gradient(90deg, var(--amber), var(--amber2))';
                                            }
                                            return (
                                                <div className="gauge-row" key={i}>
                                                    <div className="gauge-top">
                                                        <span className="gauge-name">{p.name}</span>
                                                        <span className="gauge-val">{val.toFixed(1)} mm</span>
                                                    </div>
                                                    <div className="gauge-track">
                                                        <div className="gauge-fill" style={{ width: `${pct}%`, background: gradient }}></div>
                                                    </div>
                                                    <div className="gauge-meta">Acumulado — última leitura CEMADEN</div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-records">Sem registros mapeados no período</div>
                                    )}
                                </div>
                            </div>

                            {/* ALERTAS INMET */}
                            <div className="section col-span-2 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                        <path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                    </svg>
                                    <span className="section-title">Alertas Vigentes — INMET</span>
                                </div>
                                <div className="section-body">
                                    {activeWarnings && activeWarnings.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {activeWarnings.map((a, i) => {
                                                const desc = String(a.descricao || '').toLowerCase();
                                                const cat = String(a.categoria || '').toLowerCase();
                                                const critical = desc.includes('grande perigo') || cat.includes('vermelho') || cat.includes('crítico');
                                                const bg = critical ? 'var(--red-bg)' : 'var(--amber-bg)';
                                                const border = critical ? '1px solid var(--red)' : '1px solid var(--amber2)';
                                                const dotColor = critical ? 'var(--red)' : 'var(--amber2)';
                                                const textColor = critical ? 'var(--red)' : 'var(--amber)';
                                                return (
                                                    <div className="alert-box" key={i} style={{ background: bg, border: border }}>
                                                        <div className="alert-dot" style={{ backgroundColor: dotColor }}></div>
                                                        <div>
                                                            <div className="alert-text" style={{ color: textColor }}>{a.categoria || 'ALERTA'}</div>
                                                            <div className="alert-sub" style={{ color: 'var(--text)' }}>{a.descricao}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="alert-box no-alert">
                                            <div className="alert-dot"></div>
                                            <div>
                                                <div className="alert-text">Céu limpo e condições estáveis</div>
                                                <div className="alert-sub">0 aviso(s) ativo(s) — sem restrições meteorológicas</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ASSISTÊNCIA HUMANITÁRIA */}
                            <div className="section col-span-3 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="1.3"/>
                                        <path d="M4 14v-2a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                    </svg>
                                    <span className="section-title">Assistência Humanitária</span>
                                </div>
                                <div className="section-body">
                                    <div className="assist-body-split">
                                        <div className="assist-column-numbers">
                                            <div className="assist-card">
                                                <div className="assist-num">{humanitarianData?.shelters?.length || 0}</div>
                                                <div className="assist-label">Abrigos</div>
                                            </div>
                                            <div className="assist-card">
                                                <div className="assist-num">{humanitarianData?.occupants?.length || 0}</div>
                                                <div className="assist-label">Pessoas / Famílias</div>
                                            </div>
                                            <div className="assist-card">
                                                <div className="assist-num">
                                                    {(humanitarianData?.inventory || []).filter(item => String(item.item_name).toLowerCase().includes('kit')).length}
                                                </div>
                                                <div className="assist-label">Kits Emergência</div>
                                            </div>
                                        </div>
                                        <div className="assist-column-records">
                                            {(!humanitarianData || (!humanitarianData.shelters?.length && !humanitarianData.occupants?.length && !humanitarianData.inventory?.length)) ? (
                                                <div className="no-records fill-height">
                                                    Sem registros mapeados no período selecionado
                                                </div>
                                            ) : (
                                                <div className="active-logistics-box" style={{ 
                                                    height: '100%', 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    justifyContent: 'center', 
                                                    alignItems: 'center',
                                                    padding: '20px',
                                                    background: 'var(--gray1)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '4px',
                                                    textAlign: 'center'
                                                }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        Logística Social Ativa
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        Dados de abrigos e famílias integrados no período
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PREVISÃO METEOROLÓGICA */}
                            <div className="section col-span-2 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <circle cx="5.5" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                                        <path d="M8.5 8H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                        <path d="M5.5 2V4M5.5 12V14M1.5 8H3.5M9.04 3.96 7.62 5.38M3.38 10.62 1.96 12.04M9.04 12.04 7.62 10.62M3.38 5.38 1.96 3.96" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                        <path d="M12 7a2 2 0 1 0 0 2h-4" stroke="currentColor" stroke-width="1.2" fill="none"/>
                                    </svg>
                                    <span className="section-title">Condições e Previsão Meteorológica</span>
                                </div>
                                <div className="section-body">
                                    {weatherData?.current ? (
                                        <>
                                            <div className="weather-now">
                                                <div>
                                                    <div className="temp-big">{Math.round(weatherData.current.temp || 0)}<sup>°C</sup></div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Temperatura atual</div>
                                                </div>
                                                <div className="vdivider" style={{ height: '54px', margin: '0 16px' }}></div>
                                                <div className="weather-stats">
                                                    <div className="ws-item">
                                                        <span className="ws-label">Umidade</span>
                                                        <span className="ws-value">{weatherData.current.humidity}<span style={{ fontSize: '11px', color: 'var(--text3)' }}>%</span></span>
                                                    </div>
                                                    <div className="ws-item">
                                                        <span className="ws-label">Prob. Chuva</span>
                                                        <span className="ws-value" style={{ color: 'var(--blue)' }}>{weatherData.daily?.[0]?.rainProb || 0}<span style={{ fontSize: '11px', color: 'var(--text3)' }}>%</span></span>
                                                    </div>
                                                    <div className="ws-item">
                                                        <span className="ws-label">Vento</span>
                                                        <span className="ws-value">{Math.round(weatherData.current.wind || 6)}<span style={{ fontSize: '11px', color: 'var(--text3)' }}> km/h</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="forecast-row">
                                                {(weatherData.daily || []).slice(1, 6).map((day, i) => {
                                                    const dailyDate = new Date(day.date);
                                                    const weekday = dailyDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                                                    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                                                    return (
                                                        <div className="fc-day" key={i}>
                                                            <div className="fc-weekday">{capitalizedWeekday}</div>
                                                            <div className="fc-symbol">{getWeatherIcon(day.code)}</div>
                                                            <div className="fc-temps">{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</div>
                                                            <div className="fc-prob" style={{ color: day.rainProb > 30 ? 'var(--blue)' : 'var(--text3)' }}>{day.rainProb}%</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="no-records">Sem dados de previsão no período</div>
                                    )}
                                </div>
                            </div>

                            {/* PROTOCOLO OPERACIONAL */}
                            <div className="section col-span-1 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                                        <path d="M5 5h6M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                    <span className="section-title">Protocolo Operacional</span>
                                </div>
                                <div className="section-body">
                                    <div className="protocol-box">
                                        <div className="protocol-title">Estado Atual</div>
                                        <div className="protocol-text">
                                            {protocolText}
                                        </div>
                                        <div className="protocol-cta">
                                            <span>Acionamento via</span>
                                            <span className="cta-num">199</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MAPA / DISTRIBUIÇÃO GEOGRÁFICA */}
                            <div className="section col-span-3 avoid-break">
                                <div className="section-header">
                                    <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                        <path d="M10 2l4 2v10l-4-2-4 2-4-2V2l4 2 4-2Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                                        <path d="M6 4v10M10 2v10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.5"/>
                                    </svg>
                                    <span className="section-title">Distribuição Geográfica — Santa Maria de Jetibá</span>
                                </div>
                                <div className="section-body" style={{ padding: '16px' }}>
                                    <div style={{ height: '320px', width: '100%', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                        <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%', background: '#1C2D42' }} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                                            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                            {(dashboardData.locations || []).filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng)).map((l, i) => (
                                                <Marker key={i} position={[l.lat, l.lng]} icon={L.divIcon({ className: 'custom-m', html: `<div style="background:#ef4444; width:8px; height:8px; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`, iconSize:[8,8], iconAnchor:[4,4] })} />
                                            ))}
                                            <MapController center={[-20.0246, -40.7464]} markers={(dashboardData.locations || []).filter(l => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng))} />
                                        </MapContainer>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* DETALHAMENTO DE ATIVIDADES (TABELAS DETALHADAS) */}
                        {(dashboardData.ocorrencias?.locations?.length > 0 || 
                          dashboardData.vistorias?.locations?.length > 0 || 
                          dashboardData.interdicoes?.locations?.length > 0) ? (
                            <div style={{ padding: '0 32px 32px' }}>
                                {/* 1. OCORRÊNCIAS */}
                                {dashboardData.ocorrencias?.locations?.length > 0 && (
                                    <div className="section avoid-break" style={{ marginBottom: '20px' }}>
                                        <div className="section-header">
                                            <svg className="section-icon" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--red)' }}>
                                                <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                                                <path d="M4 8h8M4 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                                <path d="M4 5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                            </svg>
                                            <span className="section-title">Detalhamento de Ocorrências ({dashboardData.ocorrencias.locations.length})</span>
                                        </div>
                                        <div className="section-body" style={{ padding: '0', overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--gray1)', borderBottom: '1px solid var(--border)' }}>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '90px', color: 'var(--text2)' }}>Nº</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Cronologia</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '150px', color: 'var(--text2)' }}>Tipologia</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)' }}>Subtipo / Detalhes</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Coordenadas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.ocorrencias.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--gray1)' }}>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--blue)', fontFamily: 'IBM Plex Mono, monospace' }}>{l.formattedId || l.id || '---'}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                                                                {l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text)', textTransform: 'uppercase' }}>{l.risk}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontStyle: 'italic' }}>{l.details || l.subtype || '---'}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text3)' }}>{l.lat?.toFixed(5)}, {l.lng?.toFixed(5)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 2. VISTORIAS */}
                                {dashboardData.vistorias?.locations?.length > 0 && (
                                    <div className="section avoid-break" style={{ marginBottom: '20px' }}>
                                        <div className="section-header">
                                            <svg className="section-icon" viewBox="0 0 16 16" fill="none">
                                                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                                                <path d="M5 5h6M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                            <span className="section-title">Detalhamento de Vistorias ({dashboardData.vistorias.locations.length})</span>
                                        </div>
                                        <div className="section-body" style={{ padding: '0', overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--gray1)', borderBottom: '1px solid var(--border)' }}>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '90px', color: 'var(--text2)' }}>Nº</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Cronologia</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '150px', color: 'var(--text2)' }}>Risco / Tipologia</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)' }}>Observações</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Coordenadas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.vistorias.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--gray1)' }}>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--blue)', fontFamily: 'IBM Plex Mono, monospace' }}>{l.formattedId || l.id || '---'}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                                                                {l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text)', textTransform: 'uppercase' }}>{l.risk}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontStyle: 'italic' }}>{l.details || l.subtype || '---'}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text3)' }}>{l.lat?.toFixed(5)}, {l.lng?.toFixed(5)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* 3. INTERDIÇÕES */}
                                {dashboardData.interdicoes?.locations?.length > 0 && (
                                    <div className="section avoid-break" style={{ marginBottom: '20px' }}>
                                        <div className="section-header">
                                            <svg className="section-icon" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--red)' }}>
                                                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                                                <path d="M5 5h6M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                            <span className="section-title">Detalhamento de Interdições ({dashboardData.interdicoes.locations.length})</span>
                                        </div>
                                        <div className="section-body" style={{ padding: '0', overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--gray1)', borderBottom: '1px solid var(--border)' }}>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '90px', color: 'var(--text2)' }}>Nº</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Cronologia</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', width: '150px', color: 'var(--text2)' }}>Tipo de Risco</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)' }}>Medida Adotada</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '130px', color: 'var(--text2)' }}>Coordenadas</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.interdicoes.locations.sort((a,b) => new Date(b.date) - new Date(a.date)).map((l, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--gray1)' }}>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--blue)', fontFamily: 'IBM Plex Mono, monospace' }}>{l.formattedId || l.id || '---'}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontFamily: 'IBM Plex Mono, monospace' }}>
                                                                {l.date ? new Date(l.date).toLocaleDateString('pt-BR') + ' ' + new Date(l.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}
                                                            </td>
                                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text)', textTransform: 'uppercase' }}>{l.risco_tipo || l.risk || '---'}</td>
                                                            <td style={{ padding: '10px 12px', color: 'var(--text2)', fontStyle: 'italic' }}>{l.medida_tipo || l.details || l.subtype || '---'}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text3)' }}>
                                                                {l.coordenadas || (l.lat ? `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}` : '---')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* RODAPÉ OFICIAL */}
                    <footer className="footer avoid-break">
                        <span className="footer-left">
                            COMPDEC / SIGERD — Coordenadoria Municipal de Proteção e Defesa Civil de Santa Maria de Jetibá — ES
                        </span>
                        <span className="footer-right">
                            Gerado automaticamente em {emissionDate} &nbsp;|&nbsp; SIGERD Mobile v1.46.24
                        </span>
                    </footer>

                </div>
            </main>
        </div>
    );
};

export default RelatorioSituacionalPrint;
