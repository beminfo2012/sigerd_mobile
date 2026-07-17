import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as redapService from '../../services/redapService';
import PrintLayout from '../../components/PrintLayout';

const RedapPrint = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [secoes, setSecoes] = useState([]);
    const [assinaturas, setAssinaturas] = useState([]);
    const [loading, setLoading] = useState(true);


    const ENUM_TITLES = {
        'DANOS_HUMANOS': 'Seção 2: Danos Humanos',
        'DANOS_EDIFICACOES': 'Seção 3: Danos a Edificações',
        'DANOS_INFRAESTRUTURA': 'Seção 4: Danos de Infraestrutura',
        'DANOS_AGRICOLAS': 'Seção 5: Danos Agrícolas',
        'DANOS_AMBIENTAIS': 'Seção 6: Danos Ambientais'
    };

    const getFotosEvidencia = () => {
        const list = [];
        secoes.forEach(sec => {
            if (sec.dados_json && Array.isArray(sec.dados_json.fotos)) {
                sec.dados_json.fotos.forEach((foto, index) => {
                    list.push({
                        ...foto,
                        secaoTitulo: sec.secao,
                        index: index + 1
                    });
                });
            }
        });
        return list;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Carrega evento desastre
                const events = await redapService.getActiveEvents();
                const currentEvent = events.find(e => e.id === id);
                if (currentEvent) {
                    setEvent(currentEvent);
                    document.title = `REDAP - ${currentEvent.id_sigerd || 'PENDENTE'} - ${currentEvent.cobrade || 'Desastre'}`;
                }

                // 2. Carrega seções preenchidas
                const loadedSecoes = await redapService.getSecoesByEvento(id);
                setSecoes(loadedSecoes || []);

                // 3. Carrega assinaturas
                const loadedAssinaturas = await redapService.getAssinaturasByEvento(id);
                setAssinaturas(loadedAssinaturas || []);

            } catch (error) {
                console.error('Error fetching REDAP data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-600">Carregando visualização do REDAP...</div>;
    if (!event) return <div className="flex items-center justify-center min-h-screen font-bold text-rose-600">Evento de desastre não encontrado.</div>;

    // Métricas econômicas reativas
    const secoesEdif = secoes.filter(s => s.secao === 'DANOS_EDIFICACOES');
    const secoesInfra = secoes.filter(s => s.secao === 'DANOS_INFRAESTRUTURA');
    const secoesAgro = secoes.filter(s => s.secao === 'DANOS_AGRICOLAS');
    const secAmbiental = secoes.find(s => s.secao === 'DANOS_AMBIENTAIS');
    const dAmb = secAmbiental?.dados_json || { area_atingida_ha: 0, recursos_hidricos_comprometidos: 'Não', incendios_florestais: 'Não', custo_recuperacao: 0 };

    const totalEdif = secoesEdif.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0);
    const totalInfra = secoesInfra.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0);
    const totalAgro = secoesAgro.reduce((acc, s) => acc + Object.values(s.dados_json?.items || {}).reduce((a, b) => a + (Number(b.valor_estimado) || 0), 0), 0);
    const totalAmb = Number(dAmb.custo_recuperacao) || 0;
    const totalPrejuizo = totalEdif + totalInfra + totalAgro + totalAmb;

    // Seção 2: Danos Humanos
    const secHumana = secoes.find(s => s.secao === 'DANOS_HUMANOS');
    const dHum = secHumana?.dados_json || { mortos: 0, feridos: 0, enfermos: 0, desalojados: 0, desabrigados: 0, desaparecidos: 0, familias_afetadas: 0 };

    // Seção 8: Parecer Técnico e Observações
    const secObs = secoes.find(s => s.secao === 'OBSERVACOES');
    const dObs = secObs?.dados_json || { parecer_tecnico: '', observacoes_complementares: '' };

    return (
        <PrintLayout
            documentTitle={`REDAP - ${event.id_sigerd || 'PENDENTE'} - ${event.cobrade || 'Desastre'}`}
            reportTitle="Relatório de Danos e Prejuízos (REDAP)"
            subtitle={
                <>
                    <span>CÓDIGO SIGERD: {event.id_sigerd || 'PENDENTE'}</span>
                    <span>•</span>
                    <span>STATUS: {event.status_evento || 'EM PROCESSAMENTO'}</span>
                    <span>•</span>
                    <span>EMISSÃO: {new Date().toLocaleDateString('pt-BR')}</span>
                </>
            }
            isLoading={loading}
            onPrint={handlePrint}
        >
            <style>{`
                /* Structured Data Table Styling */
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }

                .report-table th, .report-table td {
                    border: 1px solid var(--gray-border);
                    padding: 6px 8px;
                    text-align: left;
                    vertical-align: middle;
                    word-wrap: break-word;
                }

                .report-table th {
                    background-color: var(--gray-bg);
                    color: var(--navy3);
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 8px;
                    letter-spacing: 0.03em;
                }

                .report-table td {
                    background-color: #ffffff;
                    color: var(--text-color);
                    font-weight: 600;
                }

                /* Section header */
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    margin-top: 15px;
                    border-left: 4px solid var(--navy3);
                    background-color: var(--gray-bg);
                    padding: 6px 10px;
                    border-radius: 4px;
                }

                .section-header-title {
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--navy3);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
            `}</style>

                        {/* Seção 1: Identificação Institucional */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 1: Identificação Institucional e do Evento</span>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '30%', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Município / UF</td>
                                        <td style={{ width: '70%' }}>{event.municipio_uf || 'Santa Maria de Jetibá / ES'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Classificação COBRADE</td>
                                        <td>{event.cobrade || 'Não Informado'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Data e Hora do Evento</td>
                                        <td>{event.data_inicio ? new Date(event.data_inicio).toLocaleString('pt-BR') : 'Não Informada'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Área Afetada</td>
                                        <td>{event.area_afetada_localidade || 'Área Urbana e Rural'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Decreto de Emergência</td>
                                        <td>{event.decreto_municipal_emergencia || 'Não decretado'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Delimitação Espacial e Georreferenciada do Desastre */}
                        {(() => {
                            let polygonsList = [];
                            let orthofotoData = null;

                            if (event.polygon_coords) {
                                try {
                                    const parsed = typeof event.polygon_coords === 'string'
                                        ? JSON.parse(event.polygon_coords)
                                        : event.polygon_coords;
                                    
                                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                                        if (Array.isArray(parsed.polygons)) {
                                            polygonsList = parsed.polygons;
                                        }
                                        if (parsed.orthofoto && parsed.orthofoto.url) {
                                            orthofotoData = parsed.orthofoto;
                                        }
                                    } else if (Array.isArray(parsed) && parsed.length > 0) {
                                        if (Array.isArray(parsed[0]) && parsed[0].length > 0 && Array.isArray(parsed[0][0])) {
                                            polygonsList = parsed;
                                        } else {
                                            polygonsList = [parsed];
                                        }
                                    }
                                } catch (e) {
                                    console.error('Error parsing polygon_coords in print:', e);
                                }
                            }

                            const hasMap = (event.latitude && event.longitude) || polygonsList.length > 0;
                            if (!hasMap) return null;

                            // Centraliza o mapa
                            let center = [event.latitude || -20.0401, event.longitude || -40.7489];
                            if (polygonsList.length > 0 && polygonsList[0] && polygonsList[0][0]) {
                                if (!event.latitude) {
                                    center = polygonsList[0][0];
                                }
                            }

                            return (
                                <section className="mb-6 avoid-break">
                                    <div className="section-header">
                                        <span className="section-header-title">Delimitação Espacial e Georreferenciada</span>
                                    </div>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative p-1">
                                        <div className="h-[280px] w-full rounded-lg overflow-hidden relative z-0">
                                            <MapContainer 
                                                center={center} 
                                                zoom={15} 
                                                style={{ height: '100%', width: '100%', zIndex: 1 }} 
                                                zoomControl={false}
                                                dragging={false}
                                                doubleClickZoom={false}
                                                scrollWheelZoom={false}
                                                boxZoom={false}
                                                keyboard={false}
                                            >
                                                <TileLayer 
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                
                                                <MapBoundsAligner polygons={polygonsList} />
                                                
                                                {/* Polígonos de Área Afetada */}
                                                {polygonsList.map((poly, idx) => (
                                                    <Polygon 
                                                        key={idx}
                                                        positions={poly} 
                                                        pathOptions={{ 
                                                            color: '#dc2626', 
                                                            fillColor: '#dc2626', 
                                                            fillOpacity: 0.25, 
                                                            weight: 3 
                                                        }} 
                                                    />
                                                ))}

                                                {/* Ponto Central do Desastre se não houver polígono ou como marcador */}
                                                {polygonsList.length === 0 && event.latitude && event.longitude && (
                                                    <CircleMarker 
                                                        center={[event.latitude, event.longitude]} 
                                                        radius={10} 
                                                        pathOptions={{ 
                                                            color: '#dc2626', 
                                                            fillColor: '#dc2626', 
                                                            fillOpacity: 0.6, 
                                                            weight: 2 
                                                        }} 
                                                    />
                                                )}

                                                {/* Orthofoto Overlay se disponível (imagens web comuns PNG/JPG) */}
                                                {orthofotoData && orthofotoData.url && orthofotoData.bounds && 
                                                 orthofotoData.url !== 'TIFF_ATTACHED' && 
                                                 !(typeof orthofotoData.url === 'string' && (orthofotoData.url.toLowerCase().endsWith('.tif') || orthofotoData.url.toLowerCase().endsWith('.tiff'))) && (
                                                    <ImageOverlay
                                                        url={orthofotoData.url}
                                                        bounds={orthofotoData.bounds}
                                                        opacity={0.8}
                                                    />
                                                )}

                                                {/* Limites da Orthofoto TIFF se disponível (desenha Rectangle de limite) */}
                                                {orthofotoData && orthofotoData.bounds && 
                                                 (orthofotoData.url === 'TIFF_ATTACHED' || 
                                                  (typeof orthofotoData.url === 'string' && (orthofotoData.url.toLowerCase().endsWith('.tif') || orthofotoData.url.toLowerCase().endsWith('.tiff')))) && (
                                                    <Rectangle
                                                        bounds={orthofotoData.bounds}
                                                        pathOptions={{
                                                            color: '#2563eb',
                                                            fillColor: '#2563eb',
                                                            fillOpacity: 0.05,
                                                            weight: 2,
                                                            dashArray: '5, 5'
                                                        }}
                                                    />
                                                )}
                                            </MapContainer>
                                        </div>
                                        <div className="p-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider flex justify-between items-center bg-white border-t border-slate-100">
                                            <span>Coordenadas Centrais: {center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
                                            <span>Sinalização Georreferenciada de Áreas Críticas</span>
                                        </div>
                                    </div>
                                </section>
                            );
                        })()}

                        {/* Seção 2: Danos Humanos */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 2: Danos Humanos (Afetados e Vítimas)</span>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '70%' }}>Classificação do Impacto</th>
                                        <th style={{ width: '30%', textAlign: 'center' }}>Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Mortos Confirmados</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.mortos || 0}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td>Feridos</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.feridos || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Enfermos</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.enfermos || 0}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td>Desalojados</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.desalojados || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Desabrigados</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.desabrigados || 0}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td>Desaparecidos</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.desaparecidos || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Famílias Afetadas</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{dHum.familias_afetadas || 0}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 3: Edificações Públicas */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 3: Danos a Edificações Públicas / Sociais</span>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '35%' }}>Instalação / Equipamento Público</th>
                                        <th style={{ width: '20%', textAlign: 'center' }}>Secretaria</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Danificado</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Destruído</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Prejuízo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let temEdif = false;
                                        const rows = [];
                                        secoesEdif.forEach(sec => {
                                            if (sec.dados_json?.items) {
                                                Object.keys(sec.dados_json.items).forEach(itName => {
                                                    const item = sec.dados_json.items[itName];
                                                    if (item.danificado > 0 || item.destruido > 0 || item.valor_estimado > 0) {
                                                        temEdif = true;
                                                        rows.push(
                                                            <tr key={itName}>
                                                                <td>{itName}</td>
                                                                <td style={{ textAlign: 'center' }}>{sec.secretaria_id}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.danificado || 0}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.destruido || 0}</td>
                                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                                    R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                });
                                            }
                                        });
                                        if (!temEdif) {
                                            return <tr><td colSpan="5" className="text-center text-slate-400 italic py-4">Nenhum dano registrado nesta seção.</td></tr>;
                                        }
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 4: Infraestrutura */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 4: Danos de Infraestrutura (Vias / Pontes)</span>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Tipo de Infraestrutura</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Danificado</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Destruído</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Extensão</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Prejuízo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let temInfra = false;
                                        const rows = [];
                                        secoesInfra.forEach(sec => {
                                            if (sec.dados_json?.items) {
                                                Object.keys(sec.dados_json.items).forEach(itName => {
                                                    const item = sec.dados_json.items[itName];
                                                    if (item.danificado > 0 || item.destruido > 0 || item.valor_estimado > 0) {
                                                        temInfra = true;
                                                        rows.push(
                                                            <tr key={itName}>
                                                                <td>{itName}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.danificado || 0}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.destruido || 0}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.extensao || '-'}</td>
                                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                                    R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                });
                                            }
                                        });
                                        if (!temInfra) {
                                            return <tr><td colSpan="5" className="text-center text-slate-400 italic py-4">Nenhum dano registrado nesta seção.</td></tr>;
                                        }
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 5: Danos Agrícolas */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 5: Danos a Atividades Agrícolas / Privadas</span>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '35%' }}>Cultura / Atividade</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Área (HA)</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Produtores</th>
                                        <th style={{ width: '15%', textAlign: 'center' }}>Perda (T)</th>
                                        <th style={{ width: '20%', textAlign: 'center' }}>Prejuízo Estimado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let temAgro = false;
                                        const rows = [];
                                        secoesAgro.forEach(sec => {
                                            if (sec.dados_json?.items) {
                                                Object.keys(sec.dados_json.items).forEach(itName => {
                                                    const item = sec.dados_json.items[itName];
                                                    if (item.area_afetada_ha > 0 || item.produtores_atingidos > 0 || item.valor_estimado > 0) {
                                                        temAgro = true;
                                                        rows.push(
                                                            <tr key={itName}>
                                                                <td>{itName}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.area_afetada_ha || 0}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.produtores_atingidos || 0}</td>
                                                                <td style={{ textAlign: 'center' }}>{item.perda_estimada_ton || 0}</td>
                                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                                    R$ {(item.valor_estimado || 0).toLocaleString('pt-BR')}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                });
                                            }
                                        });
                                        if (!temAgro) {
                                            return <tr><td colSpan="5" className="text-center text-slate-400 italic py-4">Nenhum dano registrado nesta seção.</td></tr>;
                                        }
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 6: Danos Ambientais */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 6: Danos Ambientais</span>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <td style={{ width: '45%', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Área Degradada (HA)</td>
                                        <td style={{ width: '55%' }}>{dAmb.area_atingida_ha || 0} HA</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Recursos Hídricos Comprometidos?</td>
                                        <td>{dAmb.recursos_hidricos_comprometidos || 'Não'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Ocorrência de Incêndios Florestais?</td>
                                        <td>{dAmb.incendios_florestais || 'Não'}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Prejuízo Estimado (Custo de Recuperação)</td>
                                        <td style={{ fontWeight: 'bold', color: '#b91c1c' }}>
                                            R$ {(dAmb.custo_recuperacao || 0).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 7: Quadro Resumo */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 7: Quadro Resumo (Consolidação Econômica)</span>
                            </div>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '65%' }}>Descrição da Categoria de Dano</th>
                                        <th style={{ width: '35%', textAlign: 'center' }}>Total Estimado (R$)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Prejuízos com Edificações Públicas (Seção 3)</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>R$ {totalEdif.toLocaleString('pt-BR')}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td>Prejuízos com Infraestrutura Pública (Seção 4)</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>R$ {totalInfra.toLocaleString('pt-BR')}</td>
                                    </tr>
                                    <tr>
                                        <td>Prejuízos com Atividades Agrícolas / Privadas (Seção 5)</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>R$ {totalAgro.toLocaleString('pt-BR')}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td>Custo de Recuperação e Danos Ambientais (Seção 6)</td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>R$ {totalAmb.toLocaleString('pt-BR')}</td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#f1f5f9', fontSize: '11px' }}>
                                        <td style={{ fontWeight: 'bold', color: '#1e3a8a' }}>VALOR TOTAL CONSOLIDADO DO EVENTO</td>
                                        <td style={{ textAlign: 'center', fontWeight: '950', color: '#1e3a8a' }}>R$ {totalPrejuizo.toLocaleString('pt-BR')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* Seção 8: Parecer Técnico */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 8: Parecer Técnico e Observações</span>
                            </div>
                            <div className="border border-slate-200 p-4 rounded-lg text-xs leading-relaxed text-slate-700 space-y-3">
                                <div>
                                    <p className="font-extrabold text-blue-900 uppercase mb-1">Parecer Técnico Discursivo</p>
                                    <p className="whitespace-pre-wrap">{dObs.parecer_tecnico || 'Nenhum parecer técnico inserido.'}</p>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <p className="font-extrabold text-blue-900 uppercase mb-1">Observações Complementares</p>
                                    <p className="whitespace-pre-wrap">{dObs.observacoes_complementares || 'Sem observações complementares.'}</p>
                                </div>
                            </div>
                        </section>

                        
                        {/* Referências Técnicas */}
                        {(data.referencias_normativas && data.referencias_normativas.length > 0) && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Referências Técnicas e Jurídicas</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    {Object.entries(
                                        data.referencias_normativas.reduce((acc, ref) => {
                                            const cat = ref.categoria || 'Normas e Manuais';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(ref);
                                            return acc;
                                        }, {})
                                    ).map(([cat, refs]) => (
                                        <div key={cat} className="mb-4 last:mb-0 avoid-break">
                                            <div className="text-[10px] font-extrabold text-indigo-900 uppercase mb-2 pb-1 border-b border-slate-300">{cat}</div>
                                            <div className="flex flex-col gap-2">
                                                {refs.map((ref, idx) => (
                                                    <div key={idx} className="flex flex-col text-[11px] text-slate-700">
                                                        <div className="font-bold flex items-center gap-1.5 text-slate-800">
                                                            <span className="text-slate-400">❖</span>
                                                            {ref.numero}
                                                            {ref.ano && `/${ref.ano}`}
                                                            {ref.ambito && <span className="text-[8px] font-bold bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{ref.ambito}</span>}
                                                        </div>
                                                        {(ref.ementa || ref.descricao_uso) && (
                                                            <div className="ml-4 mt-0.5 text-slate-600 italic">
                                                                {ref.ementa || ref.descricao_uso}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

{/* Seção 9: Assinaturas */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">Seção 9: Assinaturas e Homologação Final</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {assinaturas.map(ass => (
                                    <div key={ass.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                                        <div>
                                            <p className="text-xs font-black text-slate-900 leading-tight">{ass.nome}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{ass.cargo_secretaria}</p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-slate-200/60 border-dashed flex justify-between items-center text-[8px] text-slate-400 font-mono">
                                            <span>{new Date(ass.data_hora_assinatura).toLocaleString('pt-BR')}</span>
                                            <span>HASH: {ass.hash_assinatura}</span>
                                        </div>
                                    </div>
                                ))}
                                {assinaturas.length === 0 && (
                                    <div className="col-span-2 text-center text-slate-400 italic py-6 text-xs">
                                        Documento aguardando assinaturas eletrônicas para homologação.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Anexo Fotográfico de Evidências */}
                        {getFotosEvidencia().length > 0 && (
                            <section className="mb-6 avoid-break pt-6 border-t border-slate-200">
                                <div className="section-header">
                                    <span className="section-header-title">Anexo Fotográfico de Evidências</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {getFotosEvidencia().map((foto, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between avoid-break">
                                            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                                                <img 
                                                    src={foto.url || foto.data} 
                                                    className="w-full h-full object-cover" 
                                                    alt={`Evidência ${idx + 1}`}
                                                />
                                            </div>
                                            <div className="mt-2 text-left">
                                                <p className="text-[10px] font-black text-slate-800">Figura {idx + 1}: Evidência do Desastre</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 font-mono">
                                                    Origem: {ENUM_TITLES[foto.secaoTitulo] || foto.secaoTitulo}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    {/* Footer com selo oficial */}
                    <footer className="text-center font-bold text-[8px] text-slate-400 uppercase tracking-widest pt-6 border-t border-slate-100 mt-8">
                        SIGERD • SISTEMA INTEGRADO DE GESTÃO E RELATÓRIOS DE DESASTRES
                        <br/><span className="text-[6.5px] font-medium text-slate-400/80 mt-1 block tracking-wider normal-case">* Os custos estimados de recuperação estrutural baseiam-se nos referenciais de preços oficiais (SINAPI, SICRO e DER-ES) cadastrados via Módulo MRCR, aplicados conforme tipologia informada.</span>
                    </footer>
        </PrintLayout>
    );
};

export default RedapPrint;
