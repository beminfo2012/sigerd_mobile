import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Printer, Download, X, FileText, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { getOcorrenciaById } from '../../services/ocorrenciasDb';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PdfToImages from '../../components/PdfToImages';
import PrintLayout from '../../components/PrintLayout';

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

const createCustomPin = (color) => {
    return L.divIcon({
        className: 'custom-pin-marker',
        html: `
            <div style="position: relative; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center;">
                <svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
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

const OcorrenciasPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const reportData = await getOcorrenciaById(id);
                
                if (reportData) {
                    setData(reportData);
                    const docId = (reportData.ocorrencia_id_format || id).replace('/', '-');
                    const docTitle = `Ocorrência nº ${docId} - ${reportData.solicitante || 'Sem Nome'}`;
                    document.title = docTitle;
                } else {
                    console.warn(`[OcorrenciasPrint] Não foi possível localizar a ocorrência com o identificador: ${id}`);
                }
            } catch (error) {
                console.error('[OcorrenciasPrint] Erro na busca do relatório:', error);
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

    const formatDateForHeader = (dateString, hourString) => {
        if (!dateString) return '---';
        if (hourString) {
            return `${dateString} às ${hourString}`;
        }
        return dateString;
    };

    const formatOcorrenciaDate = (dateStr) => {
        if (!dateStr) return '---';
        if (dateStr.includes('/')) return dateStr;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
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
    const checklistItems = Object.entries(data.checklistRespostas || data.checklist_respostas || {})
        .filter(([_, val]) => val === true)
        .map(([key]) => key);

    const getMedidaDetail = (medida) => {
        const details = {
            'Monitoramento do Local': 'Acompanhamento periódico da área de risco pela Defesa Civil.',
            'Isolamento da Área': 'Instalação de barreiras físicas e sinalização para impedir a circulação de pessoas.',
            'Interdição Parcial': 'Suspensão parcial das atividades ou uso da edificação/área afetada.',
            'Interdição Total': 'Suspensão total do uso do imóvel/área com recomendação de desocupação imediata.',
            'Evacuação Preventiva': 'Retirada controlada e preventiva de moradores/usuários da zona de perigo.',
            'Corte de Árvores': 'Supressão ou poda emergencial de exemplares arbóreos com risco de queda.',
            'Limpeza de Via': 'Remoção de entulhos, terra ou obstáculos para liberação do fluxo de trânsito.',
            'Desobstrução de Drenagem': 'Limpeza de canaletas, bueiros ou redes de escoamento de águas pluviais.',
            'Lona Plástica Instalada': 'Aplicação de lona impermeável para proteção do solo contra infiltração e erosão.',
            'Outros': 'Ações específicas registradas no relatório técnico complementar.'
        };
        return details[medida] || 'Ações executadas conforme protocolo de atendimento da Defesa Civil.';
    };

    const getEncaminhamentoDetails = (e) => {
        const mapping = {
            'Secretaria de Interior': {
                action: 'Manutenção de vias, limpeza de bueiros e desobstrução de estradas.',
                responsible: 'Secretaria de Interior'
            },
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

    // Dynamic section numbers
    const hasChecklist = checklistItems.length > 0;
    const hasObs = !!(data.observacoes && data.observacoes !== '---');
    const hasPhotos = photos.length > 0;

    let secNum = 1;
    const numAgente = secNum++;
    const numSolicitacao = secNum++;
    const numDiagnostico = secNum++;
    const numChecklist = hasChecklist ? secNum++ : null;
    const numDanosHumanos = secNum++;
    const numDanosMateriais = (data.descricao_danos && data.descricao_danos.trim() !== '' && data.descricao_danos !== '---') ? secNum++ : null;
    const numMedidas = secNum++;
    const numEncaj = secNum++;
    const numObs = hasObs ? secNum++ : null;
    const numFotos = hasPhotos ? secNum++ : null;

    const showApoio = data.tem_apoio_tecnico || data.temApoioTecnico || (apoioTecnico && (apoioTecnico.nome || apoioTecnico.assinatura));
    const showAssistido = data.assinaturaAssistido || data.assinatura_assistido;

    return (
        <PrintLayout
            documentTitle={data.ocorrencia_id_format ? `Ocorrência nº ${data.ocorrencia_id_format.replace('/', '-')} - ${data.solicitante || 'Sem Nome'}` : 'Relatório de Ocorrência'}
            reportTitle="Relatório de Ocorrência"
            subtitle={
                <>
                    <span>Emissão: {new Date().toLocaleString('pt-BR')}</span>
                    <span>•</span>
                    <span>ID: {data.ocorrencia_id_format || id || '---'}</span>
                </>
            }
            isLoading={loading}
            onPrint={handlePrint}
        >
                        {/* 1. Identificação do Responsável */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numAgente}. Identificação do Agente Responsável</span>
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
                                    {showApoio && apoioTecnico && apoioTecnico.nome && (
                                        <>
                                            <tr>
                                                <th style={{ width: '35%' }}>Engenheiro Responsável (SECOBR)</th>
                                                <th style={{ width: '20%' }}>Cargo / Função</th>
                                                <th style={{ width: '45%' }}>Setor / Registro</th>
                                            </tr>
                                            <tr>
                                                <td>{apoioTecnico.nome || '---'}</td>
                                                <td>{apoioTecnico.cargo || 'Apoio Técnico Esp.'}</td>
                                                <td>{apoioTecnico.crea || '---'}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </section>

                        {/* 2. Dados da Solicitação e Local */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numSolicitacao}. Dados da Solicitação e Local</span>
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
                                                <td>
                                                    {(!data.solicitante || data.solicitante === 'Solicitante não informado' || data.solicitante === 'Não Identificado') 
                                                        ? 'Coordenadoria Municipal de Proteção e Defesa Civil' 
                                                        : data.solicitante}
                                                </td>
                                                <td>{data.telefone || '---'}</td>
                                                <td>{data.cpf || 'Não informado'}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ width: '40%' }}>Endereço da Ocorrência</th>
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
                                                <th style={{ width: '30%' }}>Unidade Consumidora (UC)</th>
                                            </tr>
                                            <tr>
                                                <td>{data.informacoes_complementares || data.informacoesComplementares || '---'}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.2' }}>
                                                    {hasMap ? (
                                                        <div className="flex flex-col">
                                                            <span>LAT: {lat.toFixed(6)}</span>
                                                            <span>LNG: {lng.toFixed(6)}</span>
                                                        </div>
                                                    ) : '---'}
                                                </td>
                                                <td>{data.unidade_consumidora || '---'}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ width: '40%' }}>Data da Ocorrência</th>
                                                <th style={{ width: '30%' }}>Horário</th>
                                                <th style={{ width: '30%' }}>Residências em Risco</th>
                                            </tr>
                                            <tr>
                                                <td>{formatOcorrenciaDate(data.data_ocorrencia)}</td>
                                                <td>{data.horario_ocorrencia || '---'}</td>
                                                <td>{data.residencias_em_risco || data.residenciasEmRisco || '---'}</td>
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
                                                <Marker 
                                                    position={[lat, lng]} 
                                                    icon={createCustomPin(
                                                        (data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente' || data.nivel_risco === 'Alto' || data.nivel_risco === 'Iminente') ? '#dc2626' : 
                                                        (data.nivelRisco === 'Médio' || data.nivel_risco === 'Médio') ? '#ea580c' : '#3b82f6'
                                                    )}
                                                />
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
                                <span className="section-header-title">{numDiagnostico}. Diagnóstico de Risco</span>
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
                                                (data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente' || data.nivel_risco === 'Alto' || data.nivel_risco === 'Iminente') ? 'badge-risk-alto' :
                                                (data.nivelRisco === 'Médio' || data.nivel_risco === 'Médio') ? 'badge-risk-medio' : 'badge-risk-baixo'
                                            }`} style={{ padding: '8px', fontSize: '10px' }}>
                                                {(data.nivelRisco === 'Médio' || data.nivel_risco === 'Médio') ? '⚠️ MÉDIO' : 
                                                 (data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente' || data.nivel_risco === 'Alto' || data.nivel_risco === 'Iminente') ? `⚠️ ${(data.nivelRisco || data.nivel_risco).toUpperCase()}` : 
                                                 (data.nivelRisco || data.nivel_risco || 'BAIXO').toUpperCase()}
                                        </td>
                                        <td className={`font-black text-center ${
                                                (data.situacaoObservada === 'Ativo' || data.situacaoObservada === 'Em evolução' || data.situacaoObservada === 'Em Evolução' || data.situacao_observada === 'Ativo' || data.situacao_observada === 'Em evolução' || data.situacao_observada === 'Em Evolução') 
                                                ? 'badge-situacao-evolucao' : 'badge-situacao-estavel'
                                            }`} style={{ padding: '8px', fontSize: '10px' }}>
                                                {(data.situacaoObservada || data.situacao_observada || 'Estabilizado').toUpperCase()}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '40%' }}>Alertas e Danos Secundários</th>
                                        <th style={{ width: '30%' }}>Área Estimada Afetada (m²)</th>
                                        <th style={{ width: '30%' }}>Vítimas Humana</th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {(() => {
                                                    let subtipos = data.subtiposRisco || data.subtipos_risco || [];
                                                    if (typeof subtipos === 'string') {
                                                        try { subtipos = JSON.parse(subtipos); } catch (e) { subtipos = [subtipos]; }
                                                    }
                                                    const outroTexto = data.subtipoRiscoOutros || data.subtipo_risco_outros;
                                                    if (Array.isArray(subtipos) && subtipos.length > 0) {
                                                        return subtipos.map((tag, i) => (
                                                            <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                                                {tag === 'Outros' && outroTexto ? `Outros (${outroTexto})` : tag}
                                                            </span>
                                                        ));
                                                    }
                                                    return <span className="text-slate-400 italic">Nenhum subtipo listado.</span>;
                                                })()}
                                            </div>
                                        </td>
                                        <td>{data.area_estimada || data.areaEstimada || '---'} m²</td>
                                        <td>{data.tem_danos_humanos ? 'Sim (Ver Seção)' : 'Não'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 4. Checklist Técnico */}
                        {hasChecklist && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numChecklist}. Detalhamento Técnico (Checklist)</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60%', backgroundColor: '#0B1F3A', color: 'white' }}>Item Avaliado</th>
                                            <th style={{ width: '40%', backgroundColor: '#0B1F3A', color: 'white' }}>Diagnóstico / Situação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {checklistItems.sort().map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '800', color: '#1e293b', fontSize: '11px', verticalAlign: 'middle' }}>{item}</td>
                                                <td style={{ verticalAlign: 'middle' }}>
                                                    <span className="badge-status badge-risk-alto" style={{ display: 'inline-block', fontSize: '9px', fontWeight: '900', padding: '3px 6px', borderRadius: '3px' }}>
                                                        ⚠️ CONSTATADO
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* 5. Danos Humanos */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numDanosHumanos}. Danos Humanos Registrados</span>
                                <div className="section-header-line"></div>
                            </div>
                            {data.tem_danos_humanos ? (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Óbitos</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Feridos</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Enfermos</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Desalojados</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Desabrigados</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Desaparecidos</th>
                                            <th style={{ backgroundColor: '#0B1F3A', color: 'white', textAlign: 'center', fontSize: '8px' }}>Outros Afetados</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.mortos > 0 ? 'badge-risk-alto' : ''}>{data.mortos || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.feridos > 0 ? 'badge-risk-alto' : ''}>{data.feridos || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.enfermos > 0 ? 'badge-risk-alto' : ''}>{data.enfermos || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.desalojados > 0 ? 'badge-risk-medio' : ''}>{data.desalojados || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.desabrigados > 0 ? 'badge-risk-alto' : ''}>{data.desabrigados || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.desaparecidos > 0 ? 'badge-risk-alto' : ''}>{data.desaparecidos || 0}</td>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }} className={data.outros_afetados > 0 ? 'badge-risk-baixo' : ''}>{data.outros_afetados || 0}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-xs italic">
                                    Nenhum dano humano registrado inicialmente neste atendimento.
                                </div>
                            )}
                        </section>

                        {/* 6. Danos Materiais */}
                        {numDanosMateriais && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numDanosMateriais}. Danos Materiais Identificados</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap text-justify">
                                    {data.descricao_danos}
                                </div>
                            </section>
                        )}

                        {/* 7. Medidas Adotadas no Atendimento */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numMedidas}. Medidas Adotadas no Atendimento</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    {(data.medidasTomadas || data.medidas_tomadas || ['Monitoramento do Local']).map((m, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 'bold', width: '40%' }}>{m}</td>
                                            <td style={{ width: '60%' }}>{getMedidaDetail(m)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* Encaminhamentos e Responsabilidades */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">{numEncaj}. Encaminhamentos e Responsabilidades</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%', backgroundColor: '#0B1F3A', color: 'white' }}>Destinatário</th>
                                        <th style={{ width: '60%', backgroundColor: '#0B1F3A', color: 'white' }}>Ações / Responsabilidades</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data.encaminhamentos || []).length > 0 ? (
                                        (data.encaminhamentos || []).map((e, i) => {
                                            const parts = typeof e === 'string' ? e.split(':') : [];
                                            const organ = parts[0]?.trim() || '';
                                            const specDetail = parts.slice(1).join(':')?.trim();

                                            const standard = getEncaminhamentoDetails(organ);
                                            const finalAction = specDetail || standard.action;
                                            const finalResponsible = standard.responsible;

                                            return (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 'bold' }}>{finalResponsible}</td>
                                                    <td>{finalAction}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-slate-400 italic text-center py-4">Nenhum encaminhamento registrado para esta ocorrência.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </section>

                        {/* 8. Observações Técnicas */}
                        {hasObs && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numObs}. Observações Técnicas</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    <style dangerouslySetInnerHTML={{__html: `
                                        .print-rich-text ul, .print-rich-text ol { 
                                            padding-left: 1.5rem !important; 
                                            margin: 0.5rem 0 !important; 
                                        }
                                        .print-rich-text ul li { 
                                            list-style-type: disc !important; 
                                            display: list-item !important; 
                                            margin-bottom: 0.25rem !important;
                                        }
                                        .print-rich-text ol li { 
                                            list-style-type: decimal !important; 
                                            display: list-item !important; 
                                            margin-bottom: 0.25rem !important;
                                        }
                                        .print-rich-text blockquote { 
                                            border-left: 4px solid #94a3b8 !important; 
                                            padding-left: 1rem !important; 
                                            font-style: italic !important; 
                                            color: #475569 !important; 
                                            margin: 1rem 0 !important; 
                                            background-color: #f1f5f9 !important; 
                                            padding: 0.5rem 1rem !important; 
                                            display: block !important;
                                            -webkit-print-color-adjust: exact !important;
                                            print-color-adjust: exact !important;
                                        }
                                        /* Overrides for quill specific pseudo elements if present */
                                        .print-rich-text li::before { display: none !important; }
                                    `}} />
                                    <div 
                                        className="print-rich-text text-slate-700 text-xs leading-relaxed text-justify"
                                        dangerouslySetInnerHTML={{ __html: data.observacoes.replace(/<li data-list="[^"]*">/g, '<li>') }}
                                    />
                                </div>
                            </section>
                        )}

                        {/* 9. Relatório Fotográfico */}
                        {hasPhotos && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">{numFotos}. Relatório Fotográfico</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wide">
                                    Total de registros: {photos.length} fotos | Data das fotos: {formatOcorrenciaDate(data.data_ocorrencia)}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {photos.filter(p => !(p.isPdf || (typeof (p.data || p.url) === 'string' && (p.data || p.url).startsWith('data:application/pdf')))).map((photo, i) => {
                                        
                                        // Metadata logic
                                        let coordString = 'NÃO VERIFICADO';
                                        if (photo.metadados_verificados && (photo.latitude && photo.longitude)) {
                                            const extraLabel = photo.fonte_metadados === 'exif_original' ? ' (ARQUIVO)' : '';
                                            coordString = `LAT: ${photo.latitude} | LNG: ${photo.longitude}${extraLabel}`;
                                        } else if (photo.fonte_metadados === 'manual' || photo.tipo_captura === 'referencia_historica') {
                                            coordString = 'NÃO VERIFICADO (REFERÊNCIA)';
                                        }

                                        return (
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
                                                        {coordString}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                    {/* Signatures & Footer info */}
                    <div className="mt-8 border-t border-slate-200 pt-6 avoid-break">
                        <div className="flex justify-around items-end flex-wrap gap-8 mb-6">
                            {/* Agente Signature */}
                            <div className="flex flex-col items-center text-center min-w-[200px]">
                                <div className="h-16 flex items-end justify-center mb-2">
                                    {(data.assinaturaAgente || data.assinatura_agente) ? (
                                        <img src={data.assinaturaAgente || data.assinatura_agente} alt="Assinatura Agente" className="max-h-full max-w-[180px]" />
                                    ) : <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>}
                                </div>
                                <div className="w-48 border-b border-slate-400 mb-1"></div>
                                <p className="text-[10px] font-black text-slate-800 uppercase">{data.agente}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{data.cargo || 'Agente de Proteção e Defesa Civil'}</p>
                                <p className="text-[8px] text-slate-400 uppercase">Responsável Técnico</p>
                            </div>

                            {/* Apoio Signature */}
                            {showApoio && apoioTecnico && apoioTecnico.nome && (
                                <div className="flex flex-col items-center text-center min-w-[200px]">
                                    <div className="h-16 flex items-end justify-center mb-2">
                                        {apoioTecnico.assinatura ? (
                                            <img src={apoioTecnico.assinatura} alt="Assinatura Apoio Técnico" className="max-h-full max-w-[180px]" />
                                        ) : <div className="h-16 w-32 border-b border-dashed border-slate-300"></div>}
                                    </div>
                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase">{apoioTecnico.nome}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">{apoioTecnico.cargo || 'Apoio Técnico Esp.'}</p>
                                    <p className="text-[8px] text-slate-400 uppercase">Registro: {apoioTecnico.crea}</p>
                                </div>
                            )}

                            {/* Assistido Signature */}
                            {showAssistido && (
                                <div className="flex flex-col items-center text-center min-w-[200px]">
                                    <div className="h-16 flex items-end justify-center mb-2">
                                        <img src={data.assinaturaAssistido || data.assinatura_dash || data.assinatura_assistido} alt="Assinatura do Assistido" className="max-h-full max-w-[180px]" />
                                    </div>
                                    <div className="w-48 border-b border-slate-400 mb-1"></div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase">{data.solicitante || 'Assistido / Morador'}</p>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase">Morador / Solicitante</p>
                                    <p className="text-[8px] text-slate-400 uppercase">Declarou ciente</p>
                                </div>
                            )}
                        </div>

                        {/* Informações do Documento */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[8px] text-slate-500 leading-normal">
                            <span className="font-black text-slate-700 block mb-1 uppercase">Informações do Documento</span>
                            <p className="mb-1">
                                Documento original assinado eletronicamente, conforme MP 2200-2/2001, art. 10, § 2º | Valor Legal: ORIGINAL | Natureza: DOCUMENTO NATO-DIGITAL
                            </p>
                            <p className="font-mono">
                                ID gerado: {data.ocorrencia_id || data.id || '---'}
                            </p>
                        </div>

                        {/* running footer screen */}
                        <div className="running-footer-screen">
                            <span>Relatório de Ocorrência Nº {data.ocorrencia_id_format || id || '---'}</span>
                            <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
                            <span>Defesa Civil - SMJ</span>
                        </div>

                    {/* PDF Attachments Rendered Here */}
                    {photos.filter(p => (p.isPdf || (typeof (p.data || p.url) === 'string' && (p.data || p.url).startsWith('data:application/pdf')))).map((pdfPhoto, idx) => (
                        <PdfToImages key={`pdf-${idx}`} base64Data={pdfPhoto.data || pdfPhoto.url} filename={pdfPhoto.name || `Anexo PDF ${idx + 1}`} />
                    ))}
                    </div>
        </PrintLayout>
    );
};

export default OcorrenciasPrint;
