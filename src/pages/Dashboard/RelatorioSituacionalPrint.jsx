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

    // Editable states
    const [reportId, setReportId] = useState('');
    const [emitidoPor, setEmitidoPor] = useState('');
    const [matricula, setMatricula] = useState('');
    const [nivelPerigo, setNivelPerigo] = useState('');
    const [statusOperacional, setStatusOperacional] = useState('');
    
    // Section 2 - KPI
    const [kpiVistoriasVal, setKpiVistoriasVal] = useState('');
    const [kpiVistoriasDesc, setKpiVistoriasDesc] = useState('');
    const [kpiOcorrenciasVal, setKpiOcorrenciasVal] = useState('');
    const [kpiOcorrenciasDesc, setKpiOcorrenciasDesc] = useState('');
    const [kpiInterdicoesVal, setKpiInterdicoesVal] = useState('');
    const [kpiInterdicoesDesc, setKpiInterdicoesDesc] = useState('');
    const [kpiChuvaVal, setKpiChuvaVal] = useState('');
    const [kpiChuvaDesc, setKpiChuvaDesc] = useState('');
    const [kpiInmetVal, setKpiInmetVal] = useState('');
    const [kpiInmetDesc, setKpiInmetDesc] = useState('');

    // Section 3
    const [pluviometerText, setPluviometerText] = useState('');
    const [inmetAlertsText, setInmetAlertsText] = useState('');

    // Section 4
    const [kpiAbrigos, setKpiAbrigos] = useState('');
    const [kpiPessoas, setKpiPessoas] = useState('');
    const [kpiKits, setKpiKits] = useState('');
    const [kpiLogisticaSocial, setKpiLogisticaSocial] = useState('');

    // Section 5
    const [tempAtual, setTempAtual] = useState('');
    const [umidade, setUmidade] = useState('');
    const [probChuva, setProbChuva] = useState('');
    const [vento, setVento] = useState('');
    const [forecastDays, setForecastDays] = useState([]);
    const [forecastTemps, setForecastTemps] = useState([]);
    const [forecastProbs, setForecastProbs] = useState([]);

    // Section 6
    const [protocolEstadoAtual, setProtocolEstadoAtual] = useState('');
    const [protocolAcionamento, setProtocolAcionamento] = useState('');

    // Section 8
    const [activities, setActivities] = useState([]);

    // Section 9
    const [consideracoesFinais, setConsideracoesFinais] = useState('');

    const handleZoomIn = () => {
        setZoom(prev => Math.min(1.5, prev + 0.1));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(0.5, prev - 0.1));
    };

    const handleResetZoom = () => {
        setZoom(1.0);
    };

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
            const safeTimeframe = timeframeLabel ? timeframeLabel.replace(/\s+/g, '_') : '24h';
            document.title = `Relatório Situacional - ${safeDateStr} (${safeTimeframe})`;
        }
    }, [reportData]);

    useEffect(() => {
        if (reportData) {
            const { dashboardData, weatherData, pluviometerData, humanitarianData, timeframeLabel, emissionDate, currentStatus, avgAcc, activeWarnings } = reportData;

            // Initialize values
            setReportId(`001/${new Date().getFullYear()}`);
            setEmitidoPor(userProfile?.full_name || 'Defesa Civil SMJ');
            setMatricula(userProfile?.matricula || '---');
            setNivelPerigo(currentStatus?.label || 'NORMAL');
            setStatusOperacional('Ativo — Atualização Automática via SIGERD');

            setKpiVistoriasVal(String(dashboardData.vistorias?.stats?.total || 0));
            setKpiVistoriasDesc(`${dashboardData.vistorias?.stats?.total || 0} registradas`);

            setKpiOcorrenciasVal(String(dashboardData.ocorrencias?.stats?.total || 0));
            setKpiOcorrenciasDesc(dashboardData.ocorrencias?.stats?.total > 0 ? `${dashboardData.ocorrencias.stats.total} ativas` : 'Sem ocorrências');

            setKpiInterdicoesVal(String(dashboardData.interdicoes?.stats?.total || 0));
            setKpiInterdicoesDesc(dashboardData.interdicoes?.stats?.total > 0 ? `${dashboardData.interdicoes.stats.total} ativas` : 'Nenhuma ativa');

            setKpiChuvaVal(`${avgAcc} mm`);
            setKpiChuvaDesc('Acumulado no período');

            setKpiInmetVal(String(activeWarnings?.length || 0));
            setKpiInmetDesc(activeWarnings?.length > 0 ? `${activeWarnings.length} vigente(s)` : 'Nenhum vigente');

            // Pluviometer bullet list
            const pluvioList = pluviometerData && pluviometerData.length > 0 
                ? pluviometerData.map(p => `• <strong>${p.name}:</strong> ${(p.acc24hr || p.rainRaw || 0).toFixed(1)} mm (Acumulado 24h)`).join('<br/>')
                : 'Sem registros mapeados no período';
            setPluviometerText(pluvioList);

            // INMET warning list
            const inmetList = activeWarnings && activeWarnings.length > 0
                ? activeWarnings.map(a => `• <strong>${a.categoria || 'ALERTA'}:</strong> ${a.descricao}`).join('<br/>')
                : 'Céu limpo e condições estáveis — 0 aviso(s) ativo(s)';
            setInmetAlertsText(inmetList);

            // Humanitarian Data
            setKpiAbrigos(String(humanitarianData?.shelters?.length || 0));
            setKpiPessoas(String(humanitarianData?.occupants?.length || 0));
            
            const kitsDist = (humanitarianData?.inventory || []).filter(item => String(item.item_name).toLowerCase().includes('kit')).length;
            setKpiKits(String(kitsDist));
            setKpiLogisticaSocial('Ativa — abrigos e famílias integrados no período');

            // Weather
            setTempAtual(`${Math.round(weatherData?.current?.temp || 22)} °C`);
            setUmidade(`${weatherData?.current?.humidity || 75} %`);
            setProbChuva(`${weatherData?.daily?.[0]?.rainProb || 0} %`);
            setVento(`${Math.round(weatherData?.current?.wind || 8)} km/h`);

            // Forecast days (5 days)
            const days = [];
            const temps = [];
            const probs = [];
            (weatherData?.daily || []).slice(1, 6).forEach(day => {
                const dateString = day.date.includes('T') ? day.date : `${day.date}T12:00:00`;
                const dailyDate = new Date(dateString);
                const weekday = dailyDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                
                days.push(capitalizedWeekday);
                temps.push(`${Math.round(day.tempMax)}° / ${Math.round(day.tempMin)}°`);
                probs.push(`${day.rainProb}%`);
            });
            if (days.length === 0) {
                for(let i=1; i<=5; i++) {
                    days.push(`Dia ${i}`);
                    temps.push(`--° / --°`);
                    probs.push(`--%`);
                }
            }
            setForecastDays(days);
            setForecastTemps(temps);
            setForecastProbs(probs);

            // Operational Protocol
            let defaultProtocolText = "Monitoramento contínuo ativo. Em cenários de incidentes geológicos ou hidrológicos, equipes permanecem em prontidão para acionamento imediato.";
            if (currentStatus?.label === 'NORMAL') {
                defaultProtocolText = "Monitoramento contínuo ativo. Condições de normalidade. Equipes em rotina de vigilância preventiva e atividades ordinárias.";
            } else if (currentStatus?.label === 'ATENÇÃO') {
                defaultProtocolText = "Vigilância de riscos. Possibilidade de ocorrências devido a condições meteorológicas adversas. Equipes em prontidão para pronta resposta.";
            } else if (currentStatus?.label === 'PERIGO') {
                defaultProtocolText = "Alerta de risco elevado. Risco de incidentes devido a chuvas intensas ou acumuladas. Equipes de prontidão e monitoramento intensificado.";
            } else if (currentStatus?.label === 'G. PERIGO') {
                defaultProtocolText = "Mobilização geral ativa. Alto risco de incidentes geológicos ou hidrológicos. Equipes em campo para atendimento emergencial imediato.";
            }
            setProtocolEstadoAtual(defaultProtocolText);
            setProtocolAcionamento("Canal de emergência: 199 (Defesa Civil) / Outros canais aplicáveis");

            // Section 8 - Combined activities
            const combined = [];
            if (dashboardData.vistorias?.locations) {
                dashboardData.vistorias.locations.forEach(l => {
                    combined.push({
                        type: 'Vistoria',
                        id: l.formattedId || l.id || '---',
                        date: l.date,
                        risk: l.risk || '---',
                        details: l.details || l.subtype || '---',
                        lat: l.lat,
                        lng: l.lng
                    });
                });
            }
            if (dashboardData.ocorrencias?.locations) {
                dashboardData.ocorrencias.locations.forEach(l => {
                    combined.push({
                        type: 'Ocorrência',
                        id: l.formattedId || l.id || '---',
                        date: l.date,
                        risk: l.risk || '---',
                        details: l.details || l.subtype || '---',
                        lat: l.lat,
                        lng: l.lng
                    });
                });
            }
            if (dashboardData.interdicoes?.locations) {
                dashboardData.interdicoes.locations.forEach(l => {
                    combined.push({
                        type: 'Interdição',
                        id: l.formattedId || l.id || '---',
                        date: l.date,
                        risk: l.risco_tipo || l.risk || '---',
                        details: l.medida_tipo || l.details || l.subtype || '---',
                        lat: l.lat,
                        lng: l.lng
                    });
                });
            }
            combined.sort((a, b) => new Date(b.date) - new Date(a.date));
            setActivities(combined);

            // Considerações Finais
            setConsideracoesFinais("Síntese da situação geral do município no período: o monitoramento meteorológico e geológico indica estabilidade relativa nas últimas horas. Recomenda-se a manutenção da atenção por parte das equipes de plantão para o período subsequente, especialmente nas áreas de risco previamente mapeadas. Não há indicação de necessidade emergencial de reforço de pessoal ou suprimentos no momento, permanecendo o efetivo em escala de prontidão padrão.");
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

    const { timeframeLabel, emissionDate } = reportData;

    return (
        <div className="bg-[#f1f5f9] min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex flex-col items-center selection:bg-blue-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
                
                :root {
                    --navy:   #0B1F3A;
                    --blue:   #1A6FBF;
                    --blue2:  #2484D9;
                    --ice:    #E8F1FA;
                    --ice2:   #D4E5F5;
                    --amber:  #D48A0C;
                    --amber2: #F5A623;
                    --red:    #B83232;
                    --red-bg: #FDEAEA;
                    --green:  #1A7A48;
                    --green2: #22A060;
                    --green-bg: #EAF7EF;
                    --gray1:  #F4F6F9;
                    --gray2:  #E8ECF2;
                    --gray3:  #C8D0DC;
                    --text:   #1A2332;
                    --text2:  #4A5568;
                    --text3:  #718096;
                    --white:  #FFFFFF;
                    --border: #C8D0DC;
                }

                .print-container * {
                    font-family: 'IBM Plex Sans', sans-serif;
                    box-sizing: border-box;
                }

                /* ── TITULO DE SEÇÃO ── */
                .section-title-new {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--navy);
                    border-bottom: 2px solid var(--navy);
                    padding-bottom: 4px;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }

                /* ── CAMPOS EDITÁVEIS ── */
                .editable-field {
                    outline: none;
                    transition: background-color 0.2s;
                    border-radius: 2px;
                    padding: 2px 4px;
                    min-height: 18px;
                }
                .editable-field:hover {
                    background-color: rgba(26, 111, 191, 0.08);
                    cursor: text;
                }
                .editable-field:focus {
                    background-color: rgba(26, 111, 191, 0.15);
                    box-shadow: 0 0 0 1px rgba(26, 111, 191, 0.3);
                }

                /* ── PRINT & SCREEN PREVIEW OVERRIDES ── */
                .print-container {
                    zoom: var(--report-zoom, 1.0);
                    padding: 40px 48px;
                }
                
                @media screen and (max-width: 1024px) {
                    .print-preview-wrapper { overflow-x: auto; padding: 20px; display: flex; justify-content: flex-start; align-items: flex-start; width: 100%; }
                    .print-container { min-width: 210mm; }
                }
                
                @media print {
                    @page { margin: 15mm 15mm; size: A4; }
                    html, body {
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container { 
                        width: 100% !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        transform: none !important; 
                        border-radius: 0 !important;
                        border: none !important;
                        zoom: 1 !important;
                    }
                    .editable-field:hover, .editable-field:focus {
                        background-color: transparent !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Options Bar */}
            <div className="no-print fixed top-0 left-0 right-0 w-full bg-slate-900 border-b border-white/10 z-[9999] px-6 py-3 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <Activity className="text-blue-400" size={18} />
                    <div>
                        <h1 className="font-black text-[11px] uppercase tracking-wider leading-none mb-1 text-white">Visualização do Relatório</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{timeframeLabel}</p>
                    </div>
                </div>

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
                <div className="w-[210mm] bg-white shadow-2xl min-h-[297mm] mb-20 print:mb-0 relative print-container rounded-[8px] border border-slate-200 overflow-hidden flex flex-col justify-between" style={{ '--report-zoom': zoom }}>
                    
                    <div>
                        {/* CABEÇALHO */}
                        <header style={{ padding: '0 0 16px', borderBottom: '2px solid var(--navy)', background: 'var(--white)', color: 'var(--text)', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <img src={LOGO_DEFESA_CIVIL_SITUACIONAL} alt="Defesa Civil" className="logo-dc" style={{ objectFit: 'contain', height: '56px', width: '56px', filter: 'brightness(0) saturate(100%) invert(8%) sepia(35%) saturate(2321%) hue-rotate(196deg) brightness(93%) contrast(97%)' }} onError={(e) => {
                                    e.target.style.filter = 'none';
                                }} />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, padding: '0 16px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text2)' }}>Prefeitura Municipal de Santa Maria de Jetibá</span>
                                    <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--navy)' }}>Coordenadoria Municipal de Proteção e Defesa Civil</span>
                                </div>

                                <img src={LOGO_SIGERD_SITUACIONAL} alt="SIGERD" className="sigerd-logo" style={{ objectFit: 'contain', height: '48px', width: '48px' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--blue)' }}>Relatório Situacional</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text2)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <span>EMISSÃO:</span>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text)' }}>
                                        {emissionDate ? emissionDate.replace(' -', ' ÀS') : '---'}
                                    </span>
                                    <span style={{ color: 'var(--gray3)' }}>•</span>
                                    <span>ID:</span>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text)' }}>
                                        <span>{reportId}</span>
                                    </span>
                                    <span style={{ color: 'var(--gray3)' }}>•</span>
                                    <span>PERÍODO:</span>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text)' }}>{timeframeLabel}</span>
                                </div>
                            </div>
                        </header>

                        {/* 1. IDENTIFICAÇÃO E STATUS OPERACIONAL */}
                        <div className="avoid-break">
                            <div className="section-title-new">1. Identificação e Status Operacional</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid var(--border)' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '20%', background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>EMITIDO POR</td>
                                        <td style={{ width: '30%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                            <div>{emitidoPor}</div>
                                        </td>
                                        <td style={{ width: '20%', background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>MATRÍCULA</td>
                                        <td style={{ width: '30%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                            <div>{matricula}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>NÍVEL DE PERIGO</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold' }}>
                                            <div>{nivelPerigo}</div>
                                        </td>
                                        <td style={{ background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>STATUS OPERACIONAL</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                            <div>{statusOperacional}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ fontSize: '9px', color: 'var(--text3)', fontStyle: 'italic', marginBottom: '16px' }}>
                                Legenda de classificação de risco: NORMAL (Estável) | ATENÇÃO (Vigilância) | PERIGO (Alerta) | GRANDE PERIGO (Mobilização)
                            </div>
                        </div>

                        {/* 2. INDICADORES DO PERÍODO */}
                        <div className="avoid-break">
                            <div className="section-title-new">2. Indicadores do Período</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>VISTORIAS</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>OCORRÊNCIAS</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>INTERDIÇÕES</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>CHUVA MÉDIA (24H)</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>AVISOS INMET</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiVistoriasVal}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiOcorrenciasVal}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiInterdicoesVal}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiChuvaVal}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiInmetVal}</div>
                                        </td>
                                    </tr>
                                    <tr style={{ background: 'var(--gray1)' }}>
                                        <td style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--text2)' }}>
                                            <div>{kpiVistoriasDesc}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--text2)' }}>
                                            <div>{kpiOcorrenciasDesc}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--text2)' }}>
                                            <div>{kpiInterdicoesDesc}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--text2)' }}>
                                            <div>{kpiChuvaDesc}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--text2)' }}>
                                            <div>{kpiInmetDesc}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. PLUVIOMETRIA E ALERTAS METEOROLÓGICOS */}
                        <div className="avoid-break">
                            <div className="section-title-new">3. Pluviometria e Alertas Meteorológicos</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        <th style={{ width: '50%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'left' }}>PLUVIÔMETROS CEMADEN</th>
                                        <th style={{ width: '50%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'left' }}>ALERTAS VIGENTES — INMET</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid var(--border)', padding: '8px 10px', verticalAlign: 'top', fontSize: '10px', lineHeight: '1.5' }}>
                                            <div dangerouslySetInnerHTML={{ __html: pluviometerText }} />
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '8px 10px', verticalAlign: 'top', fontSize: '10px', lineHeight: '1.5' }}>
                                            <div dangerouslySetInnerHTML={{ __html: inmetAlertsText }} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 4. ASSISTÊNCIA HUMANITÁRIA */}
                        <div className="avoid-break">
                            <div className="section-title-new">4. Assistência Humanitária</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        <th style={{ width: '22%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>ABRIGOS ATIVOS</th>
                                        <th style={{ width: '22%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>PESSOAS / FAMÍLIAS ASSISTIDAS</th>
                                        <th style={{ width: '22%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>KITS DE EMERGÊNCIA DISTRIBUÍDOS</th>
                                        <th style={{ width: '34%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>LOGÍSTICA SOCIAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiAbrigos}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiPessoas}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{kpiKits}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', color: 'var(--text)' }}>
                                            <div className="text-left">{kpiLogisticaSocial}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 5. CONDIÇÕES E PREVISÃO METEOROLÓGICA */}
                        <div className="avoid-break">
                            <div className="section-title-new">5. Condições e Previsão Meteorológica</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        <th style={{ width: '25%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>TEMPERATURA ATUAL</th>
                                        <th style={{ width: '25%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>UMIDADE</th>
                                        <th style={{ width: '25%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>PROBABILIDADE DE CHUVA</th>
                                        <th style={{ width: '25%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>VENTO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '14px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{tempAtual}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '14px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{umidade}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '14px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{probChuva}</div>
                                        </td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '14px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>
                                            <div>{vento}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--navy)', marginBottom: '6px' }}>Previsão estendida (5 dias)</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        {forecastDays.map((fd, i) => (
                                            <th key={i} style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                                <div>{fd}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {forecastTemps.map((ft, i) => (
                                            <td key={i} style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: '500' }}>
                                                <div>{ft}</div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--gray1)' }}>
                                        {forecastProbs.map((fp, i) => (
                                            <td key={i} style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: '9px', color: 'var(--blue)', fontFamily: 'IBM Plex Mono, monospace', fontWeight: '500' }}>
                                                <div>{fp}</div>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* PAGE BREAK BEFORE OPERATIONAL PROTOCOL TO FIT ON PAGE 2 */}
                        <div className="page-break"></div>

                        {/* 6. PROTOCOLO OPERACIONAL */}
                        <div className="avoid-break">
                            <div className="section-title-new">6. Protocolo Operacional</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '20%', background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>ESTADO ATUAL</td>
                                        <td style={{ width: '80%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', lineHeight: '1.5' }}>
                                            <div>{protocolEstadoAtual}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>ACIONAMENTO</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', lineHeight: '1.5' }}>
                                            <div>{protocolAcionamento}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 7. DISTRIBUIÇÃO GEOGRÁFICA — SANTA MARIA DE JETIBÁ */}
                        <div className="avoid-break">
                            <div className="section-title-new">7. Distribuição Geográfica — Santa Maria de Jetibá</div>
                            <div style={{ fontSize: '10px', color: 'var(--text3)', fontStyle: 'italic', marginBottom: '8px' }}>
                                Inserir imagem de mapa/satélite com a distribuição geográfica das ocorrências, vistorias e interdições registradas no período, com marcadores georreferenciados.
                            </div>
                            <div style={{ height: '320px', width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '24px', position: 'relative' }}>
                                <MapContainer center={[-20.0246, -40.7464]} zoom={13} style={{ height: '100%', width: '100%', background: '#1C2D42' }} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
                                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                    {activities.filter(a => a.lat && a.lng && !isNaN(a.lat) && !isNaN(a.lng)).map((l, i) => (
                                        <Marker key={i} position={[l.lat, l.lng]} icon={L.divIcon({ className: 'custom-m', html: `<div style="background:#ef4444; width:8px; height:8px; border:2px solid white; border-radius:50%; box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`, iconSize:[8,8], iconAnchor:[4,4] })} />
                                    ))}
                                    <MapController center={[-20.0246, -40.7464]} markers={activities.filter(a => a.lat && a.lng && !isNaN(a.lat) && !isNaN(a.lng))} />
                                </MapContainer>
                            </div>
                        </div>

                        {/* 8. DETALHAMENTO DE VISTORIAS, OCORRÊNCIAS E INTERDIÇÕES */}
                        <div className="avoid-break">
                            <div className="section-title-new">8. Detalhamento de Vistorias, Ocorrências e Interdições</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', border: '1px solid var(--border)' }}>
                                <thead>
                                    <tr style={{ background: 'var(--ice2)' }}>
                                        <th style={{ width: '15%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>Nº</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>CRONOLOGIA</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>RISCO / TIPOLOGIA</th>
                                        <th style={{ width: '30%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'left' }}>OBSERVAÇÕES</th>
                                        <th style={{ width: '15%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', textAlign: 'center' }}>COORDENADAS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activities.length > 0 ? (
                                        activities.map((act, i) => (
                                            <tr key={i} style={{ background: i % 2 === 0 ? 'var(--white)' : 'var(--gray1)' }}>
                                                <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold', color: 'var(--blue)', textAlign: 'center' }}>
                                                    <div className="text-center">{act.id}</div>
                                                </td>
                                                <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }}>
                                                    <div className="text-center">
                                                        {act.date ? new Date(act.date).toLocaleDateString('pt-BR') + ' ' + new Date(act.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '---'}
                                                    </div>
                                                </td>
                                                <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center' }}>
                                                    <div className="text-center">{`${act.type} - ${act.risk}`}</div>
                                                </td>
                                                <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '9px', fontStyle: 'italic' }}>
                                                    <div>{act.details}</div>
                                                </td>
                                                <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '9px', fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center', color: 'var(--text3)' }}>
                                                    <div>
                                                        {act.lat != null && act.lng != null ? `${act.lat.toFixed(5)}, ${act.lng.toFixed(5)}` : '---'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ border: '1px solid var(--border)', padding: '12px', textAlign: 'center', color: 'var(--text3)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '500', fontStyle: 'italic' }}>
                                                Sem registros no período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <div style={{ fontSize: '9px', color: 'var(--text3)', fontStyle: 'italic', marginBottom: '24px' }}>
                                Observação: replicar a linha acima para cada registro do período. Caso não haja registros em uma categoria, indicar "Sem registros no período".
                            </div>
                        </div>

                        {/* 9. CONSIDERAÇÕES FINAIS */}
                        <div className="avoid-break">
                            <div className="section-title-new">9. Considerações Finais</div>
                            <div style={{ fontSize: '10px', lineHeight: '1.5', background: 'var(--white)', minHeight: '60px', marginBottom: '24px' }}>
                                <div style={{ outline: 'none', padding: '4px 0' }}>
                                    {consideracoesFinais}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RODAPÉ OFICIAL */}
                    <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textAlign: 'center', color: 'var(--text3)', fontSize: '9px', marginTop: 'auto' }}>
                        <span>
                            COMPDEC / SIGERD — Coordenadoria Municipal de Proteção e Defesa Civil de Santa Maria de Jetibá — ES
                        </span>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text3)' }}>
                            Gerado automaticamente em {emissionDate || '---'} &nbsp;|&nbsp; SIGERD Mobile v1.46.24
                        </span>
                    </footer>

                </div>
            </main>
        </div>
    );
};

export default RelatorioSituacionalPrint;
