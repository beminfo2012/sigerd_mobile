import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { getAllInterdicoesLocal } from '../../services/db';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

const InterdicaoPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Try to fetch from Local DB first
                const localInterdicoes = await getAllInterdicoesLocal().catch(() => []);
                const localMatch = localInterdicoes.find(v => v.id === id || v.interdicaoId === id || v.interdicao_id === id);

                if (localMatch) {
                    setData(localMatch);
                    const docId = (localMatch.interdicaoId || localMatch.interdicao_id || id).replace('/', '-');
                    const docTitle = `Interdição nº ${docId} - ${localMatch.responsavel_nome || localMatch.responsavelNome || 'Proprietário'}`;
                    document.title = docTitle;
                    setLoading(false);
                    return;
                }

                // 2. Fetch from Supabase
                const { data: reportData, error } = await supabase
                    .from('interdicoes')
                    .select('*')
                    .or(`id.eq.${id},interdicao_id.eq.${id}`)
                    .single();

                if (reportData) {
                    setData(reportData);
                    const docId = (reportData.interdicaoId || reportData.interdicao_id || id).replace('/', '-');
                    const docTitle = `Interdição nº ${docId} - ${reportData.responsavel_nome || reportData.responsavelNome || 'Proprietário'}`;
                    document.title = docTitle;
                } else {
                    console.warn("Interdição não encontrada:", error);
                }
            } catch (error) {
                console.error('Erro ao buscar relatório:', error);
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



    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400">Carregando Relatório...</div>;
    if (!data) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400">Relatório não encontrado.</div>;

    const lat = parseFloat(data.latitude || data.lat);
    const lng = parseFloat(data.longitude || data.lng || data.long);
    const hasMap = !isNaN(lat) && !isNaN(lng);

    const photos = (() => {
        let p = data.fotos || [];
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (e) { p = []; }
        }
        return Array.isArray(p) ? p : [];
    })();

    const apoioTecnico = (() => {
        let a = data.apoioTecnico || data.apoio_tecnico || null;
        if (typeof a === 'string') {
            try { a = JSON.parse(a); } catch (e) { a = null; }
        }
        return a;
    })();

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 print:bg-white print:p-0 p-8 flex justify-center">
            <style>{`
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
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
                    .print-container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; transform: none !important; }
                    .leaflet-container { width: 100% !important; height: 100% !important; z-index: 1 !important; }
                    .print-map-wrapper { display: block !important; height: 350px !important; min-height: 350px !important; position: relative !important; background-color: #f1f5f9; border: 1px solid #e2e8f0; break-inside: avoid; }
                }
            `}</style>

            <div className="no-print fixed top-0 left-0 right-0 bg-[#0f172a] text-white p-4 flex justify-between items-center z-[9999] shadow-md">
                <h1 className="font-bold text-lg">Visualização de Impressão (Interdição)</h1>
                <div className="flex gap-4">
                    <button onClick={() => window.close()} className="px-4 py-2 hover:bg-slate-700 rounded transition-colors text-sm font-bold uppercase">Fechar</button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold uppercase text-sm flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">print</span> Imprimir / Salvar PDF
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper">
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-14 print:p-0 mb-10 print:mb-0 relative print-container">

                    {/* Header */}
                    <header className="flex flex-col items-center mb-10 border-b-4 border-red-600 pb-6">
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
                        <h1 className="text-2xl font-black text-red-600 uppercase tracking-wide text-center">Auto de Interdição</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                            <span>Emissão: {new Date().toLocaleString('pt-BR')}</span>
                            <span>•</span>
                            <span>ID: {data.interdicaoId || data.interdicao_id || '---'}</span>
                        </div>
                    </header>

                    {/* 1. Identificação da Interdição */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-red-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Identificação da Interdição</h2>
                        </div>
                        <div className="grid grid-cols-2 border border-slate-200 rounded-lg overflow-hidden text-xs">
                            <div className="p-3 border-b border-r border-slate-200 bg-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nº Interdição</p>
                                <p className="font-bold text-slate-800">{data.interdicaoId || data.interdicao_id || '---'}</p>
                            </div>
                            <div className="p-3 border-b border-slate-200 bg-white">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data/Hora Registro</p>
                                <p className="font-bold text-slate-800">{new Date(data.createdAt || data.created_at).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="p-3 border-r border-slate-200 bg-white">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Agente Responsável</p>
                                <p className="font-bold text-slate-800">{data.agente || '---'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 border-r border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Matrícula</p>
                                <p className="font-bold text-slate-800">{data.matricula || '---'}</p>
                            </div>
                            <div className="p-3 bg-white">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cargo / Função</p>
                                <p className="font-bold text-slate-800 uppercase">{data.cargo || 'Agente de Defesa Civil'}</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Localização e Responsável */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Localização e Responsável</h2>
                        </div>

                        <div className="flex flex-col md:flex-row print:flex-row gap-4">
                            <div className="w-full md:w-7/12 print:w-7/12">
                                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs h-full">
                                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Endereço</p>
                                        <p className="font-bold text-slate-800 line-clamp-2">{data.endereco || data.logradouro || '---'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 border-b border-slate-200">
                                        <div className="p-3 border-r border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bairro</p>
                                            <p className="font-bold text-slate-800">{data.bairro || data.localidade || '---'}</p>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Município</p>
                                            <p className="font-bold text-slate-800">{data.municipio || 'Santa Maria de Jetibá'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Informações Complementares</p>
                                        <p className="font-bold text-slate-800">{data.informacoes_complementares || data.informacoes_complementares || '---'}</p>
                                    </div>
                                    <div className="p-3 border-b border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nome do Responsável / Proprietário</p>
                                        <p className="font-bold text-slate-800 uppercase">{data.responsavel_nome || data.responsavelNome || '---'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 border-b border-slate-200">
                                        <div className="p-3 border-r border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</p>
                                            <p className="font-bold text-slate-800">{data.responsavel_telefone || data.responsavelTelefone || '---'}</p>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail</p>
                                            <p className="font-bold text-slate-800 line-clamp-1">{data.responsavel_email || data.responsavelEmail || '---'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">CPF / CNPJ</p>
                                        <p className="font-bold text-slate-800">{data.responsavel_cpf || data.responsavelCpf || '---'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-5/12 print:w-5/12">
                                <div className="border border-slate-200 rounded-xl bg-slate-100 relative overflow-hidden print-map-wrapper h-[185px] shadow-sm w-full">
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
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Mapa não disponível</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 text-center flex flex-col gap-1 items-center">
                                    <p className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 rounded border border-slate-200 inline-block px-2 py-1 uppercase">
                                        TIPO ALVO: {data.tipo_alvo || data.tipoAlvo || '---'} {data.tipo_alvo_especificar || data.tipoAlvoEspecificar ? `(${data.tipo_alvo_especificar || data.tipoAlvoEspecificar})` : ''}
                                    </p>
                                    {hasMap && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 rounded border border-blue-200 inline-block px-2 py-1 transition-colors no-underline"
                                            title="Ver no Google Maps"
                                        >
                                            LAT: {lat.toFixed(6)} / LNG: {lng.toFixed(6)}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Diagnóstico e Medida Administrativa */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Diagnóstico e Medida Administrativa</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Riscos Identificados</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            let types = data.risco_tipo || data.riscoTipo || [];
                                            if (typeof types === 'string') {
                                                try { types = JSON.parse(types); } catch (e) { types = [types]; }
                                            }
                                            return Array.isArray(types) ? types : [];
                                        })().map((r, i) => (
                                            <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold uppercase">{r}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="p-3 border border-slate-200 rounded-lg bg-red-50">
                                    <p className="text-[9px] font-bold text-red-800 uppercase mb-1">Tipo de Interdição</p>
                                    <p className="font-black text-slate-800 text-sm uppercase">{data.medida_tipo || data.medidaTipo || 'Não Especificado'}</p>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-lg">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prazo / Condição</p>
                                    <p className="font-bold text-slate-800 text-xs">{data.medida_prazo || data.medidaPrazo || 'Indeterminado'}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="p-3 border border-slate-200 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Grau de Risco</p>
                                            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${(data.risco_grau === 'Alto' || data.risco_grau === 'Iminente' || data.riscoGrau === 'Alto' || data.riscoGrau === 'Iminente') ? 'bg-red-100 text-red-700 border-red-200' :
                                                (data.risco_grau === 'Médio' || data.riscoGrau === 'Médio') ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                    'bg-green-100 text-green-700 border-green-200'
                                                }`}>
                                                {data.risco_grau || data.riscoGrau || 'BAIXO'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Evacuação</p>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${data.evacuacao_necessaria || data.evacuacaoNecessaria ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {data.evacuacao_necessaria || data.evacuacaoNecessaria ? 'SIM' : 'NÃO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Situação Observada</p>
                                    <p className="font-bold text-slate-800 text-xs">{data.situacao_observada || data.situacaoObservada || '---'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Relatório Técnico */}
                    {(data.relatorio_tecnico || data.relatorioTecnico) && (
                        <section className="mb-8 avoid-break">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">4. Relatório Técnico</h2>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                                <p className="font-black text-[10px] text-slate-400 uppercase mb-2">Parecer Técnico Elaborado:</p>
                                <div className="italic text-slate-800">"{data.relatorio_tecnico || data.relatorioTecnico}"</div>
                            </div>
                        </section>
                    )}

                    {/* 5. Recomendações Técnicas */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-slate-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">5. Recomendações Técnicas</h2>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                            <p className="font-black text-[10px] text-slate-400 uppercase mb-2">Orientações e Providências:</p>
                            <div>{data.recomendacoes || 'Nenhuma recomendação registrada.'}</div>
                        </div>
                    </section>

                    <div className="page-break"></div>

                    {/* 5. Relatório Fotográfico */}
                    {photos.length > 0 && (
                        <section className="mb-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-5 bg-pink-500 rounded-full"></div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">6. Relatório Fotográfico</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {photos.map((photo, i) => (
                                    <div key={i} className="space-y-2 break-inside-avoid avoid-break">
                                        <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shadow-sm flex items-center justify-center min-h-[200px]">
                                            <img
                                                src={photo.data || photo.url}
                                                alt={`Foto ${i + 1}`}
                                                className="max-w-full max-h-[400px] w-auto h-auto object-contain"
                                                onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Erro+na+Imagem'; }}
                                            />
                                        </div>
                                        <div className="border-t-2 border-slate-100 pt-2">
                                            <p className="text-[9px] text-pink-600 font-bold uppercase mb-0.5">Foto {i + 1}</p>
                                            <p className="text-[10px] text-slate-600 font-medium leading-tight">
                                                {photo.legenda || photo.caption || 'Sem descrição.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Footer / Signatures */}
                    <footer className="mt-auto pt-10 border-t-2 border-dashed border-slate-200 break-inside-avoid w-full flex flex-col items-center avoid-break bg-slate-50/30 rounded-xl p-8">
                        <div className="flex justify-center gap-20 w-full mb-8">
                            <div className="flex flex-col items-center text-center px-4">
                                <div className="h-20 flex items-end justify-center mb-2">
                                    {(data.assinatura_agente || data.assinaturaAgente) ? (
                                        <img src={data.assinatura_agente || data.assinaturaAgente} alt="Assinatura" className="max-h-full max-w-[200px]" />
                                    ) : <div className="h-full w-40"></div>}
                                </div>
                                <div className="w-64 border-b border-slate-800 mb-2"></div>
                                <p className="text-[11px] uppercase font-black text-slate-900">{data.agente}</p>
                                <p className="text-[9px] uppercase font-bold text-slate-500">{data.cargo || 'Agente de Defesa Civil'}</p>
                                <p className="text-[9px] uppercase text-slate-400">Matrícula: {data.matricula}</p>
                            </div>

                            {apoioTecnico && apoioTecnico.assinatura && (
                                <div className="flex flex-col items-center text-center px-4">
                                    <div className="h-20 flex items-end justify-center mb-2">
                                        <img src={apoioTecnico.assinatura} alt="Assinatura" className="max-h-full max-w-[200px]" />
                                    </div>
                                    <div className="w-64 border-b border-slate-800 mb-2"></div>
                                    <p className="text-[11px] uppercase font-black text-slate-900">{apoioTecnico.nome}</p>
                                    <p className="text-[9px] uppercase font-bold text-slate-500">{apoioTecnico.cargo || 'Apoio Técnico Esp.'}</p>
                                    <p className="text-[9px] uppercase text-slate-400">CREA/Registro: {apoioTecnico.crea}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full flex flex-col items-center justify-center pt-4">
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center">
                                Sistema Integrado de Gerenciamento de Riscos e Desastres - SIGERD Mobile
                            </p>
                            <p className="text-[8px] text-slate-300 mt-1 uppercase font-mono tracking-tighter">CERTIFICAÇÃO OFICIAL - INTERDIÇÃO Nº {data.interdicaoId || data.interdicao_id}</p>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default InterdicaoPrint;
