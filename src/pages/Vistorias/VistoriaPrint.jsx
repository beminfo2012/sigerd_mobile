import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { getAllVistoriasLocal } from '../../services/db';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FileText, Printer, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Utility component to recalibrate map size and center
const MapController = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        const handleResize = () => {
            map.invalidateSize();
            if (lat && lng) map.setView([lat, lng], 17);
        };
        handleResize();
        const timers = [100, 300, 500, 1000, 2000].map(t => setTimeout(handleResize, t));

        const onPrintTrigger = () => {
            handleResize();
            [50, 150, 300, 500].forEach(t => setTimeout(handleResize, t));
        };

        window.addEventListener('trigger-map-print-resize', onPrintTrigger);
        window.addEventListener('beforeprint', handleResize);

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('trigger-map-print-resize', onPrintTrigger);
            window.removeEventListener('beforeprint', handleResize);
        };
    }, [map, lat, lng]);
    return null;
};

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const MOCK_VISTORIA = {
    vistoriaId: '034/2026',
    dataHora: '2026-03-21T12:38:00',
    id: '38b35e3e-3e3c-4e96-8bea-ac17444130d1',
    agente: 'Marcelo Dias Pereira',
    matricula: '53541',
    cargo: 'Agente de Proteção e Defesa Civil',
    solicitante: 'Abenair Benfica de Oliveira',
    telefone: '(27) 99637-8693',
    cpf: 'Não informado',
    endereco: 'Rua Florencio Augusto Berger, nº 800',
    bairro: 'Centro',
    pontoReferencia: 'Ao lado da MP Vistoria Veicular',
    boletim_ciodes: 'Boletim CIODES nº 60842811',
    populacaoEstimada: 'A definir pela SECOBR (residências a montante do talude)',
    latitude: -20.022326,
    longitude: -40.744098,
    categoriaRisco: 'Estrutural / Geotécnico',
    nivelRisco: 'Médio',
    situacaoObservada: 'Em evolução',
    subtiposRisco: ['Muro de arrimo com risco', 'Potencial dano às fundações das residências a montante'],
    area_afetada: 'A dimensionar pela Secretaria de Obras',
    vitimas: 'Nenhuma',
    checklist_respostas: {
        "structural:1:Drenagem do terreno:Adequada": true,
        "structural:2:Movimentação do terreno - Erosão:IDENTIFICADA": true,
        "structural:3:Movimentação do terreno - Talude instável:IDENTIFICADA": true,
        "structural:4:Fundações:Sem patologia identificada": true,
        "structural:5:Pilares:Sem patologia identificada": true,
        "structural:6:Vigas:Sem patologia identificada": true,
        "structural:7:Lajes:Sem patologia identificada": true,
        "structural:8:Paredes e alvenaria:Sem patologia identificada": true,
        "structural:9:Estrutura do telhado:Sem patologia identificada": true,
        "structural:10:Telhas:Sem problema": true,
        "structural:11:Indícios de movimentação estrutural:Não observado": true,
        "structural:12:Infiltrações e umidade:Sem patologia identificada": true,
        "structural:13:Intervenções estruturais irregulares:Não identificado": true,
        "structural:14:Elementos externos com risco (muro de arrimo):RISCO PRESENTE": true
    },
    medidasTomadas: [
        'Orientação ao responsável',
        'Monitoramento',
        'Isolamento da área',
        'Aplicação de lona de proteção'
    ],
    encaminhamentos: [
        'Secretaria de Obras',
        'Secretaria de Obras',
        'Defesa Civil Municipal',
        'Defesa Civil Municipal',
        'Secretaria de Obras'
    ],
    observacoes: `Em atendimento ao Boletim de Atendimento nº 60842811 do CIODES, que reportava um desmoronamento parcial de talude nos fundos de residência. No local, constatou-se deslizamento de solo com comprometimento da base do muro de contenção. Medidas preventivas de aplicação de lona plástica e isolamento físico da área de projeção de queda foram tomadas.`,
    fotos: [
        {
            data: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80',
            legenda: 'Foto 1 - Talude exposto com lona de proteção aplicada preventivamente pela equipe de resposta da Defesa Civil Municipal.'
        },
        {
            data: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80',
            legenda: 'Foto 2 - Visão frontal da encosta sob risco de deslizamento e proximidade com as fundações das residências vizinhas.'
        }
    ],
    apoioTecnico: {
        nome: 'Djalson Cezar Costa',
        cargo: 'Engenheiro Civil',
        setor: 'GEPRO - SECOBR - PMSMJ',
        crea: 'CREA-ES 12345/D',
        assinatura: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50"><text x="10" y="30" font-family="cursive" font-size="20" fill="blue">Djalson Costa</text></svg>'
    },
    assinaturaAgente: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="50"><text x="10" y="30" font-family="cursive" font-size="20" fill="blue">Marcelo Dias P.</text></svg>'
};

const VistoriaPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
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

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            if (id === 'mock') {
                setData(MOCK_VISTORIA);
                document.title = "Vistoria nº 034-2026 - Abenair Benfica de Oliveira";
                setLoading(false);
                return;
            }
            try {
                // 1. Try to fetch from Local DB first (support offline usage)
                const localVistorias = await getAllVistoriasLocal().catch(() => []);
                const localMatch = localVistorias.find(v => v.id === id || v.vistoria_id === id);

                if (localMatch) {
                    setData(localMatch);
                    const docId = (localMatch.vistoriaId || localMatch.vistoria_id || id).replace('/', '-');
                    const docTitle = `Vistoria nº ${docId} - ${localMatch.solicitante || 'Sem Nome'}`;
                    document.title = docTitle;
                    setLoading(false);
                    return;
                }

                // 2. Fetch from Supabase if not local
                const { data: reportData, error } = await supabase
                    .from('vistorias')
                    .select('*')
                    .or(`id.eq.${id},vistoria_id.eq.${id}`)
                    .single();

                if (reportData) {
                    setData(reportData);
                    const docId = (reportData.vistoriaId || reportData.vistoria_id || id).replace('/', '-');
                    const docTitle = `Vistoria nº ${docId} - ${reportData.solicitante || 'Sem Nome'}`;
                    document.title = docTitle;
                } else {
                    console.warn("Vistoria not found:", error);
                }
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.dispatchEvent(new Event('trigger-map-print-resize'));
        setTimeout(() => window.print(), 800);
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando Relatório...</div>;
    if (!data) return <div className="flex items-center justify-center min-h-screen">Relatório não encontrado.</div>;

    const formatDateForHeader = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Calculate Lat/Lng
    const lat = parseFloat(data.latitude || data.lat);
    const lng = parseFloat(data.longitude || data.lng || data.long);
    const hasMap = !isNaN(lat) && !isNaN(lng);

    // Normalize Photos
    const photos = (() => {
        let p = data.fotos || [];
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (e) { p = []; }
        }
        return Array.isArray(p) ? p : [];
    })();

    // Normalize Apoio Tecnico
    const apoioTecnico = (() => {
        let a = data.apoioTecnico || data.apoio_tecnico || null;
        if (typeof a === 'string') {
            try { a = JSON.parse(a); } catch (e) { a = null; }
        }
        return a;
    })();

    // Helper for Checklist Items
    const checklistItems = Object.entries(data.checklist_respostas || data.checklistRespostas || {})
        .filter(([_, val]) => val === true)
        .map(([key]) => key);

    // Dynamic section numbers
    const hasChecklist = checklistItems.length > 0;
    const hasObs = !!(data.observacoes && data.observacoes !== '---');
    const hasPhotos = photos.length > 0;

    let secNum = 4;
    const numChecklist = hasChecklist ? secNum++ : null;
    const numMedidas = secNum++;
    const numEncaj = secNum++;
    const numObs = hasObs ? secNum++ : null;
    const numFotos = hasPhotos ? secNum++ : null;

    const getMedidaDetail = (medida) => {
        const details = {
            'Monitoramento': 'Área em acompanhamento contínuo pela Defesa Civil e órgãos municipais.',
            'Isolamento da área': 'Área de risco isolada preventivamente para evitar circulação de pessoas.',
            'Orientação ao responsável': 'Comunicação verbal das providências necessárias ao solicitante/proprietário.',
            'Aplicação de lona de proteção': 'Lona aplicada sobre o talude exposto para mitigar erosão pluvial.',
            'Interdição parcial': 'Interdição parcial da edificação por risco estrutural localizado.',
            'Interdição total': 'Interdição total do imóvel e remoção preventiva das famílias.',
            'Nenhuma': 'Nenhuma medida emergencial necessária no momento.'
        };
        return details[medida] || 'Ações executadas conforme protocolo de atendimento da Defesa Civil.';
    };

    const getEncaminhamentoDetails = (e) => {
        const mapping = {
            'Secretaria de Obras': {
                action: 'Execução de intervenções estruturais, drenagem ou contenção de talude.',
                responsible: 'Secretaria de Obras (SECOBR)'
            },
            'Secretaria de Ação Social': {
                action: 'Atendimento social, concessão de benefícios eventuais ou aluguel social.',
                responsible: 'Secretaria de Assistência Social'
            },
            'Secretaria de Meio Ambiente': {
                action: 'Avaliação de risco fitossanitário e supressão de árvores condenadas.',
                responsible: 'Secretaria de Meio Ambiente'
            },
            'Defesa Civil Municipal': {
                action: 'Notificação formal ao proprietário e monitoramento preventivo da evolução do risco.',
                responsible: 'Defesa Civil Municipal'
            },
            'Outros': {
                action: 'Ações conjuntas de fiscalização e mitigação de riscos estruturais.',
                responsible: 'Órgão Competente'
            }
        };
        return mapping[e] || {
            action: `Avaliação e providências cabíveis dentro das atribuições da pasta.`,
            responsible: e
        };
    };

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex justify-center report-root-wrapper">
            <style>{`
                :root {
                    --navy:   #0B1F3A;
                    --navy2:  #122848;
                    --navy3:  #1B3A5E;
                    --blue:   #1A6FBF;
                    --blue-bg: #E8F1FA;
                    --gray-border: #cbd5e1;
                    --gray-bg: #f8fafc;
                    --text-color: #1e293b;
                }

                /* Hide running header/footer on screen */
                .running-header, .running-footer {
                    display: none !important;
                }
                .print-cover-header {
                    display: none !important;
                }

                @media screen {
                    .print-container {
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        transform: scale(var(--report-zoom));
                        transform-origin: top center;
                        margin-bottom: calc(-297mm * (1 - var(--report-zoom)) + 20px);
                    }
                    /* On screen, we show mock header/footer */
                    .running-header-screen {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 8px;
                        font-weight: 700;
                        color: #2a5299;
                        border-bottom: 1.5px solid #2a5299;
                        padding-bottom: 6px;
                        margin-bottom: 20px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .running-footer-screen {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 8px;
                        font-weight: 500;
                        color: #64748b;
                        border-top: 1px solid #cbd5e1;
                        padding-top: 6px;
                        margin-top: 30px;
                    }
                }

                @media screen and (max-width: 768px) {
                    .print-preview-wrapper { 
                        overflow-x: auto; 
                        overflow-y: visible;
                        padding: 10px; 
                        display: block; 
                        width: 100%;
                        -webkit-overflow-scrolling: touch;
                    }
                    .print-container { 
                        min-width: 210mm; 
                        transform: scale(0.45); 
                        transform-origin: top center; 
                        margin-bottom: -150mm;
                    }
                }

                @media print {
                    @page {
                        margin-top: 15mm;
                        margin-bottom: 12mm;
                        margin-left: 12mm;
                        margin-right: 12mm;
                        size: A4;
                    }
                    @page :first {
                        margin-top: 6mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: white !important;
                    }
                    .report-root-wrapper {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background-color: white !important;
                        min-height: auto !important;
                        height: auto !important;
                    }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                        display: block !important;
                        min-height: auto !important;
                        height: auto !important;
                    }

                    main {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    .running-header {
                        display: none !important;
                    }

                    /* Hide screen mocks during printing */
                    .running-header-screen, .running-footer-screen {
                        display: none !important;
                    }

                    .leaflet-container {
                        width: 100% !important;
                        height: 100% !important;
                        z-index: 1 !important;
                    }
                    .print-map-wrapper {
                        display: block !important;
                        height: 240px !important;
                        min-height: 240px !important;
                        position: relative !important;
                        background-color: #f8fafc;
                        border: 1px solid #cbd5e1;
                        break-inside: avoid;
                    }

                    .report-table tr {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }

                /* Structured Data Table Styling */
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 11px;
                }

                .report-table th, .report-table td {
                    border: 1.5px solid var(--gray-border);
                    padding: 8px 10px;
                    text-align: left;
                    vertical-align: middle;
                }

                .report-table th {
                    background-color: var(--blue-bg);
                    color: var(--navy2);
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 9px;
                    letter-spacing: 0.03em;
                    width: 25%;
                }

                .report-table td {
                    background-color: #ffffff;
                    color: var(--text-color);
                    font-weight: 700;
                }

                .report-table .row-header {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-weight: 700;
                    font-size: 9px;
                    text-transform: uppercase;
                    width: 25%;
                }

                /* Section header matching image */
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    margin-top: 15px;
                }

                .section-header-title {
                    font-size: 12px;
                    font-weight: 900;
                    color: var(--navy2);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .section-header-line {
                    flex-grow: 1;
                    height: 1px;
                    background-color: var(--gray-border);
                }

                /* Status badges */
                .badge-status {
                    display: inline-block;
                    padding: 3px 8px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    border-radius: 4px;
                    border: 1px solid transparent;
                }

                /* Status badges and full-cell coloring */
                .badge-risk-baixo, td.badge-risk-baixo {
                    background-color: #eaf7ef !important;
                    color: #1a7a48 !important;
                    border-color: #a7f3d0 !important;
                }
                .badge-risk-medio, td.badge-risk-medio {
                    background-color: #fff8e8 !important;
                    color: #d48a0c !important;
                    border-color: #fde68a !important;
                }
                .badge-risk-alto, .badge-risk-iminente, td.badge-risk-alto, td.badge-risk-iminente {
                    background-color: #fdeaea !important;
                    color: #b83232 !important;
                    border-color: #fca5a5 !important;
                }
                .badge-situacao-estavel, td.badge-situacao-estavel {
                    background-color: #f1f5f9 !important;
                    color: #475569 !important;
                    border-color: #cbd5e1 !important;
                }
                .badge-situacao-evolucao, td.badge-situacao-evolucao {
                    background-color: #fdeaea !important;
                    color: #b83232 !important;
                    border-color: #fca5a5 !important;
                }
            `}</style>

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <FileText size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Relatório de Vistoria</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel de Impressão Oficial</span>
                    </div>
                </div>

                {/* Center Section - Zoom Controls */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
                    <button 
                        onClick={handleZoomOut}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-slate-300 hover:text-white"
                        title="Diminuir Zoom"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button 
                        onClick={handleResetZoom}
                        className="h-8 px-3 rounded-lg hover:bg-white/10 flex items-center justify-center gap-1 transition-all text-xs font-bold text-slate-300 hover:text-white"
                        title="Restaurar Zoom"
                    >
                        <RotateCcw size={12} /> {Math.round(zoom * 100)}%
                    </button>
                    <button 
                        onClick={handleZoomIn}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-all text-slate-300 hover:text-white"
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

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper" style={{ '--report-zoom': zoom }}>
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-14 print:p-0 mb-10 print:mb-0 relative print-container flex flex-col justify-between">
                    <div className="relative">
                        {/* Header - Official Defesa Civil Style */}
                        <header className="flex flex-col items-center mb-8 border-b-4 border-[#2a5299] pb-6">
                            <div className="w-full flex justify-between items-center mb-6 px-4">
                                <div className="w-[100px] flex items-center justify-center">
                                    <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-[85px] w-auto object-contain" />
                                </div>
                                <div className="text-center flex-1 px-4">
                                    <h3 className="text-slate-900 font-extrabold text-sm uppercase leading-tight">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h3>
                                    <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                                </div>
                                <div className="w-[100px] flex items-center justify-center text-right">
                                    <img src={LOGO_SIGERD} alt="SIGERD" className="h-[85px] w-auto object-contain" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-[#2a5299] uppercase tracking-wide text-center">Relatório de Vistoria Técnica</h1>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                                <span>Emissão: {formatDateForHeader(data.dataHora || data.data_hora)}</span>
                                <span>•</span>
                                <span>ID: {data.vistoriaId || data.vistoria_id || '---'}</span>
                                {(data.processo || data.processo_sei) && (
                                    <>
                                        <span>•</span>
                                        <span>PROCESSO: {data.processo || data.processo_sei}</span>
                                    </>
                                )}
                            </div>
                        </header>

                        {/* 1. Identificação do Responsável */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">1. Identificação do Agente Responsável</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <th style={{ width: '35%' }}>Agente Responsável</th>
                                        <th style={{ width: '20%' }}>Matrícula</th>
                                        <th style={{ width: '45%' }}>Cargo / Função</th>
                                    </tr>
                                    <tr>
                                        <td>{data.agente || '---'}</td>
                                        <td>{data.matricula || '---'}</td>
                                        <td>{data.cargo || 'Agente de Proteção e Defesa Civil'}</td>
                                    </tr>
                                    {apoioTecnico && apoioTecnico.nome && apoioTecnico.nome.trim() !== '' && (
                                        <>
                                            <tr>
                                                <th style={{ width: '35%' }}>Engenheiro Responsável (SECOBR)</th>
                                                <th style={{ width: '20%' }}>Cargo / Função</th>
                                                <th style={{ width: '45%' }}>Setor</th>
                                            </tr>
                                            <tr>
                                                <td>{apoioTecnico.nome || '---'}</td>
                                                <td>{apoioTecnico.cargo || 'Engenheiro Civil'}</td>
                                                <td>{apoioTecnico.setor || 'GEPRO – SECOBR – PMSMJ'}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </section>

                        {/* 2. Dados da Solicitação e Local */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">2. Dados da Solicitação e Local</span>
                                <div className="section-header-line"></div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row print:flex-row gap-4">
                                <div className="w-full md:w-7/12 print:w-7/12">
                                    <table className="report-table" style={{ marginBottom: 0 }}>
                                        <tbody>
                                            <tr>
                                                <th style={{ width: '40%' }}>Solicitante</th>
                                                <th style={{ width: '30%' }}>Telefone de Contato</th>
                                                <th style={{ width: '30%' }}>CPF / Documento</th>
                                            </tr>
                                            <tr>
                                                <td>{data.solicitante || 'Não identificado'}</td>
                                                <td>{data.telefone || '---'}</td>
                                                <td>{data.cpf || 'Não informado'}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ width: '40%' }}>Endereço da Vistoria</th>
                                                <th style={{ width: '30%' }}>Bairro</th>
                                                <th style={{ width: '30%' }}>Município / UF</th>
                                            </tr>
                                            <tr>
                                                <td>{data.endereco || '---'}</td>
                                                <td>{data.bairro || '---'}</td>
                                                <td>Santa Maria de Jetibá / ES</td>
                                            </tr>
                                            <tr>
                                                <th style={{ width: '40%' }}>Referência</th>
                                                <th style={{ width: '30%' }}>Coordenadas GPS</th>
                                                <th style={{ width: '30%' }}>Nº de Processo / CIODES</th>
                                            </tr>
                                            <tr>
                                                <td>{data.pontoReferencia || data.informacoes_complementares || '---'}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.2' }}>
                                                    {hasMap ? (
                                                        <div className="flex flex-col">
                                                            <span>LAT: {lat.toFixed(6)}</span>
                                                            <span>LNG: {lng.toFixed(6)}</span>
                                                        </div>
                                                    ) : '---'}
                                                </td>
                                                <td>{data.boletim_ciodes || data.processo || '---'}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ width: '40%' }}>Data da Vistoria de Campo</th>
                                                <th style={{ width: '30%' }}>Data de Emissão</th>
                                                <th style={{ width: '30%' }}>Residências em Risco</th>
                                            </tr>
                                            <tr>
                                                <td>{formatDateOnly(data.dataHora || data.data_hora)}</td>
                                                <td>{formatDateOnly(data.dataHora || data.data_hora)}</td>
                                                <td>{data.residencias_em_risco || data.residenciasEmRisco || 'A definir'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Map Box */}
                                <div className="w-full md:w-5/12 print:w-5/12 flex flex-col gap-2">
                                    <div className="border border-slate-200 rounded-lg bg-slate-50 relative overflow-hidden print-map-wrapper h-[240px] shadow-sm w-full">
                                        {hasMap ? (
                                            <MapContainer
                                                center={[lat, lng]}
                                                zoom={17}
                                                style={{ height: '100%', width: '100%' }}
                                                zoomControl={false}
                                                attributionControl={false}
                                                dragging={false}
                                                scrollWheelZoom={false}
                                                doubleClickZoom={false}
                                            >
                                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                                <Marker position={[lat, lng]} />
                                                <MapController lat={lat} lng={lng} />
                                            </MapContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">location_off</span>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Mapa não disponível<br />Sem coordenadas</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50/50 rounded border border-blue-200 inline-block px-2.5 py-1 transition-colors no-underline"
                                        >
                                            LAT: {lat ? lat.toFixed(6) : '0'} / LNG: {lng ? lng.toFixed(6) : '0'}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Diagnóstico de Risco */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">3. Diagnóstico de Risco</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <th style={{ width: '40%' }}>Categoria do Risco</th>
                                        <th style={{ width: '30%' }}>Nível de Risco</th>
                                        <th style={{ width: '30%' }}>Situação</th>
                                    </tr>
                                    <tr>
                                        <td>{data.categoriaRisco || data.categoria_risco || 'Não Classificado'}</td>
                                        <td className={`font-black text-center ${
                                                (data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente') ? 'badge-risk-alto' :
                                                data.nivelRisco === 'Médio' ? 'badge-risk-medio' : 'badge-risk-baixo'
                                            }`} style={{ padding: '8px', fontSize: '10px' }}>
                                                {data.nivelRisco === 'Médio' ? '⚠️ MÉDIO' : 
                                                 (data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente') ? `⚠️ ${data.nivelRisco.toUpperCase()}` : 
                                                 (data.nivelRisco || 'BAIXO').toUpperCase()}
                                        </td>
                                        <td className={`font-black text-center ${
                                                (data.situacaoObservada === 'Ativo' || data.situacaoObservada === 'Em evolução' || data.situacaoObservada === 'Em Evolução') 
                                                ? 'badge-situacao-evolucao' : 'badge-situacao-estavel'
                                            }`} style={{ padding: '8px', fontSize: '10px' }}>
                                                {(data.situacaoObservada || 'Estabilizado').toUpperCase()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '40%' }}>Alertas e Danos Secundários</th>
                                        <th style={{ width: '30%' }}>Área Afetada Estimada (m²)</th>
                                        <th style={{ width: '30%' }}>Vítimas</th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {(data.subtiposRisco || data.subtipos_risco || []).length > 0 ? (
                                                    (data.subtiposRisco || data.subtipos_risco).map((tag, i) => (
                                                        <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                                            {tag}
                                                        </span>
                                                    ))
                                                ) : <span className="text-slate-400 italic">Nenhum subtipo listado.</span>}
                                            </div>
                                        </td>
                                        <td>{data.area_afetada || data.areaAfetada || 'A dimensionar'}</td>
                                        <td>{data.vitimas || 'Nenhuma'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 4. Checklist Técnico de Vistoria */}
                        {checklistItems.length > 0 && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numChecklist}. Checklist Técnico de Vistoria</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60%', backgroundColor: '#0B1F3A', color: 'white' }}>Item Vistoriado</th>
                                            <th style={{ width: '40%', backgroundColor: '#0B1F3A', color: 'white' }}>Situação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const structural = checklistItems.filter(k => k.startsWith('structural:'));
                                            const standard = checklistItems.filter(k => !k.startsWith('structural:'));
                                            
                                            const okOptions = [
                                                "não apresenta patologia",
                                                "não observado",
                                                "sem problemas",
                                                "não identificado",
                                                "adequada",
                                                "adequado",
                                                "adequadas",
                                                "desobstruídas",
                                                "desobstruída",
                                                "ok",
                                                "funcionando",
                                                "sem alterações"
                                            ];

                                            const isOptionOk = (val) => {
                                                if (!val) return true;
                                                const lowerVal = val.toLowerCase().trim();
                                                return okOptions.some(ok => lowerVal.includes(ok) || ok.includes(lowerVal));
                                            };

                                            const allRows = [];

                                            if (structural.length > 0) {
                                                const sections = {};
                                                structural.forEach(k => {
                                                    const parts = k.split(':');
                                                    const sec = parts[1]; // Ex: "1. TERRENO E ENTORNO"
                                                    if (!sections[sec]) sections[sec] = [];
                                                    
                                                    if (parts.length === 4) {
                                                        sections[sec].push({ group: parts[2], value: parts[3] });
                                                    } else if (parts.length === 3) {
                                                        sections[sec].push({ group: null, value: parts[2] });
                                                    }
                                                });

                                                Object.keys(sections).sort((a, b) => {
                                                    const numA = parseInt(a) || 0;
                                                    const numB = parseInt(b) || 0;
                                                    return numA - numB;
                                                }).forEach(sec => {
                                                    const items = sections[sec];
                                                    allRows.push(
                                                        <tr key={`struc-${sec}`}>
                                                            <td style={{ fontWeight: '800', color: '#1e293b', fontSize: '11px', verticalAlign: 'top', width: '55%' }}>
                                                                {sec}
                                                            </td>
                                                            <td style={{ verticalAlign: 'top', width: '45%' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                    {items.map((item, idx) => {
                                                                        const isAlert = !isOptionOk(item.value);
                                                                        const badgeClass = isAlert ? 'badge-risk-alto' : 'badge-risk-baixo';
                                                                        const textToShow = item.group ? `${item.group}: ${item.value}` : item.value;
                                                                        return (
                                                                            <div key={idx} style={{ display: 'block', margin: '2px 0' }}>
                                                                                <span className={`badge-status ${badgeClass}`} style={{ display: 'inline-block', fontSize: '9px', fontWeight: '900', padding: '3px 6px', borderRadius: '3px' }}>
                                                                                    {textToShow.toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            }

                                            if (standard.length > 0) {
                                                standard.forEach((item, idx) => {
                                                    const isAlert = !isOptionOk(item);
                                                    allRows.push(
                                                        <tr key={`std-${idx}`}>
                                                            <td style={{ fontWeight: '800', color: '#1e293b', fontSize: '11px', verticalAlign: 'top', width: '55%' }}>{item}</td>
                                                            <td style={{ verticalAlign: 'top', width: '45%' }}>
                                                                <span className={`badge-status ${isAlert ? 'badge-risk-alto' : 'badge-risk-baixo'}`} style={{ display: 'inline-block', fontSize: '9px', fontWeight: '900', padding: '3px 6px', borderRadius: '3px' }}>
                                                                    {isAlert ? 'RISCO PRESENTE' : 'ADEQUADA'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            }

                                            return allRows;
                                        })()}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* 5. Medidas Adotadas no Atendimento */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numMedidas}. Medidas Adotadas no Atendimento</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%', backgroundColor: '#0B1F3A', color: 'white' }}>Medida</th>
                                        <th style={{ width: '60%', backgroundColor: '#0B1F3A', color: 'white' }}>Detalhamento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.medidasTomadas || data.medidas_tomadas || ['Monitoramento']).map((m, i) => (
                                        <tr key={i}>
                                            <td>{m}</td>
                                            <td>{getMedidaDetail(m)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* 6. Encaminhamentos e Responsabilidades */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numEncaj}. Encaminhamentos e Responsabilidades</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '10%', backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center' }}>#</th>
                                        <th style={{ width: '50%', backgroundColor: '#0B1F3A', color: 'white' }}>Encaminhamento</th>
                                        <th style={{ width: '40%', backgroundColor: '#0B1F3A', color: 'white' }}>Responsável</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.encaminhamentos || []).length > 0 ? (
                                        (data.encaminhamentos || []).map((e, i) => {
                                            let responsible = e;
                                            let action = '';
                                            if (e && typeof e === 'string' && e.includes(':')) {
                                                const parts = e.split(':');
                                                responsible = parts[0].trim();
                                                action = parts.slice(1).join(':').trim();
                                            }
                                            if (!action) {
                                                const details = getEncaminhamentoDetails(typeof e === 'string' ? e : '');
                                                action = details.action;
                                                responsible = details.responsible;
                                            }
                                            return (
                                                <tr key={i}>
                                                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                                    <td>{action}</td>
                                                    <td>{responsible}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td style={{ textAlign: 'center' }}>1</td>
                                            <td>Nenhum encaminhamento crítico registrado no momento.</td>
                                            <td>Defesa Civil Municipal</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </section>

                        {/* 7. Observações Técnicas */}
                        {(data.observacoes && data.observacoes !== '---') && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numObs}. Observações Técnicas</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap text-justify">
                                    {data.observacoes}
                                </div>
                            </section>
                        )}

                        {/* 8. Relatório Fotográfico */}
                        {photos.length > 0 && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numFotos}. Relatório Fotográfico</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wide">
                                    Total de registros: {photos.length} fotos | Data das fotos: {formatDateOnly(data.dataHora || data.data_hora)}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {photos.map((photo, i) => (
                                        <div key={i} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between avoid-break">
                                            <div className="bg-white rounded border border-slate-100 overflow-hidden flex items-center justify-center min-h-[180px] max-h-[220px]">
                                                <img
                                                    src={photo.data || photo.url}
                                                    alt={`Foto ${i + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                    onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Erro+na+Imagem'; }}
                                                />
                                            </div>
                                            <div className="mt-2 text-[10px]">
                                                <span className="font-extrabold text-blue-600 block mb-1 uppercase">[ Foto {i + 1} ]</span>
                                                <p className="text-slate-700 font-bold leading-tight mb-2">
                                                    {photo.legenda || photo.caption || 'Sem descrição cadastrada.'}
                                                </p>
                                                <span className="font-mono text-[8px] text-slate-400 block border-t border-slate-200 pt-1">
                                                    LAT: {lat ? lat.toFixed(6) : '---'} | LNG: {lng ? lng.toFixed(6) : '---'} | {formatDateOnly(data.dataHora || data.data_hora)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Signatures & Footer info */}
                    <div className="mt-8 border-t border-slate-200 pt-6 avoid-break">
                        {apoioTecnico && apoioTecnico.nome && apoioTecnico.nome.trim() !== '' ? (
                            <div className="grid grid-cols-2 gap-8 mb-6">
                                {/* Agente Signature */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 flex items-end justify-center mb-2">
                                        {(data.assinaturaAgente || data.assinatura_agente) ? (
                                            <img src={data.assinaturaAgente || data.assinatura_agente} alt="Assinatura Agente" className="max-h-full max-w-[180px]" />
                                        ) : <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>}
                                    </div>
                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase">{data.agente}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">{data.cargo || 'Agente de Proteção e Defesa Civil'}</p>
                                    <p className="text-[8px] text-slate-400 uppercase">Assinado eletronicamente</p>
                                </div>

                                {/* Apoio Signature */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 flex items-end justify-center mb-2">
                                        {apoioTecnico.assinatura ? (
                                            <img src={apoioTecnico.assinatura} alt="Assinatura Engenheiro" className="max-h-full max-w-[180px]" />
                                        ) : <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>}
                                    </div>
                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase">{apoioTecnico.nome}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">{apoioTecnico.cargo || 'Engenheiro Civil'}</p>
                                    <p className="text-[8px] text-slate-400 uppercase">Assinado eletronicamente</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center mb-6">
                                {/* Agente Signature Centered */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="h-16 flex items-end justify-center mb-2">
                                        {(data.assinaturaAgente || data.assinatura_agente) ? (
                                            <img src={data.assinaturaAgente || data.assinatura_agente} alt="Assinatura Agente" className="max-h-full max-w-[180px]" />
                                        ) : <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>}
                                    </div>
                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase">{data.agente}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">{data.cargo || 'Agente de Proteção e Defesa Civil'}</p>
                                    <p className="text-[8px] text-slate-400 uppercase">Assinado eletronicamente</p>
                                </div>
                            </div>
                        )}

                        {/* Informações do Documento */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[8px] text-slate-500 leading-normal">
                            <span className="font-black text-slate-700 block mb-1 uppercase">Informações do Documento</span>
                            <p className="mb-1">
                                Documento original assinado eletronicamente, conforme MP 2200-2/2001, art. 10, § 2º | Valor Legal: ORIGINAL | Natureza: DOCUMENTO NATO-DIGITAL
                            </p>
                            <p className="font-mono">
                                ID gerado: {data.id || '---'}
                            </p>
                        </div>

                        {/* running footer screen */}
                        <div className="running-footer-screen">
                            <span>Relatório de Vistoria Técnica Nº {data.vistoriaId || data.vistoria_id || '---'}</span>
                            <span>Emissão: {formatDateOnly(data.dataHora || data.data_hora)}</span>
                            <span>Defesa Civil - SMJ</span>
                        </div>
                        </div>
                </div>
            </main>
        </div>
    );
};

export default VistoriaPrint;
