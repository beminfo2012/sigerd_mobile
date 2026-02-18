import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { getAllVistoriasLocal } from '../../services/db';
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

const VistoriaPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Try to fetch from Local DB first (support offline usage)
                const localVistorias = await getAllVistoriasLocal().catch(() => []);
                const localMatch = localVistorias.find(v => v.id === id || v.vistoria_id === id);

                if (localMatch) {
                    setData(localMatch);
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

    const handleDownloadPDF = async () => {
        const container = document.querySelector('.print-container');
        if (!container) return;

        // Force scale(1) and fixed width for stable measurement
        const originalWidth = container.style.width;
        const originalTransform = container.style.transform;
        const originalTransformOrigin = container.style.transformOrigin;

        container.style.width = '210mm';
        container.style.transform = 'none';
        container.style.transformOrigin = 'unset';

        window.dispatchEvent(new Event('trigger-map-print-resize'));

        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 99999; font-weight: bold; font-family: sans-serif; display: flex; align-items: center; gap: 12px;">
                <div style="width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                Gerando PDF Compacto...
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(toast);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculate height in mm to fit width exactly
            const ratio = pageWidth / imgWidth;
            const finalHeight = imgHeight * ratio;

            let heightLeft = finalHeight;
            let position = 0;

            // Page 1
            pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, finalHeight);
            heightLeft -= pageHeight;

            // Additional pages
            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, finalHeight);
                heightLeft -= pageHeight;
            }

            // Generated filename: ID + Solicitante
            const vistoriaId = (data.vistoriaId || data.vistoria_id || id).toString().replace(/\//g, '-');
            const solicitante = (data.solicitante || 'Sem_Nome').toString().replace(/\s+/g, '_').substring(0, 30);
            pdf.save(`Relatório_Vistoria_${vistoriaId}_${solicitante}.pdf`);
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Falha ao gerar o PDF. Por favor, use a opção "Imprimir" do navegador.');
        } finally {
            // Restore original styles
            container.style.width = originalWidth;
            container.style.transform = originalTransform;
            container.style.transformOrigin = originalTransformOrigin;
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando Relatório...</div>;
    if (!data) return <div className="flex items-center justify-center min-h-screen">Relatório não encontrado.</div>;

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        return new Date(dateString).toLocaleString('pt-BR');
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

    // Helper for Checklist Items
    const checklistItems = Object.entries(data.checklist_respostas || data.checklistRespostas || {})
        .filter(([_, val]) => val === true)
        .map(([key]) => key);

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 print:bg-white print:p-0 p-8 flex justify-center">
            <style>{`
                @media screen and (max-width: 768px) {
                    .print-preview-wrapper { overflow-x: auto; padding: 10px; display: block; }
                    .print-container { min-width: 210mm; transform: scale(0.9); transform-origin: top left; }
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

            {/* Top Bar for Screen Only */}
            <div className="no-print fixed top-0 left-0 right-0 bg-[#0f172a] text-white p-4 flex justify-between items-center z-[9999] shadow-md">
                <h1 className="font-bold text-lg">Visualização de Impressão</h1>
                <div className="flex gap-4">
                    <button onClick={() => window.close()} className="px-4 py-2 hover:bg-slate-700 rounded transition-colors text-sm font-bold uppercase">Fechar</button>
                    <button onClick={handleDownloadPDF} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold uppercase text-sm flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span> Baixar PDF
                    </button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold uppercase text-sm flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">print</span> Imprimir / Salvar PDF
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper">
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-14 print:p-0 mb-10 print:mb-0 relative print-container">

                    {/* Header - Official Defesa Civil Style */}
                    <header className="flex flex-col items-center mb-10 border-b-4 border-[#2a5299] pb-6">
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
                            <span>Emissão: {new Date().toLocaleString('pt-BR')}</span>
                            <span>•</span>
                            <span>ID: {data.vistoriaId || data.vistoria_id || '---'}</span>
                        </div>
                    </header>

                    {/* 1. Identificação do Responsável */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Identificação do Responsável</h2>
                        </div>
                        <div className="grid grid-cols-2 border border-slate-200 rounded-lg overflow-hidden text-xs">
                            <div className="p-3 border-b border-r border-slate-200 bg-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Agente Responsável</p>
                                <p className="font-bold text-slate-800">{data.agente || '---'}</p>
                            </div>
                            <div className="p-3 border-b border-slate-200 bg-white">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Matrícula</p>
                                <p className="font-bold text-slate-800">{data.matricula || '---'}</p>
                            </div>
                            <div className="p-3 border-r border-slate-200 bg-white col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cargo / Função</p>
                                <p className="font-bold text-slate-800">AGENTE DE PROTEÇÃO E DEFESA CIVIL</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Dados da Solicitação e Local */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Dados da Solicitação e Local</h2>
                        </div>
                        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                            <div className="grid grid-cols-3 border-b border-slate-200">
                                <div className="p-3 border-r border-slate-200 col-span-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Solicitante</p>
                                    <p className="font-bold text-slate-800 capitalize">{data.solicitante || 'Não Identificado'}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</p>
                                    <p className="font-bold text-slate-800">{data.telefone || '---'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
                                <div className="p-3 border-r border-slate-200 col-span-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Endereço da Ocorrência</p>
                                    <p className="font-bold text-slate-800">{data.endereco || '---'}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bairro</p>
                                    <p className="font-bold text-slate-800">{data.bairro || '---'}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-white">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">CPF / Documento</p>
                                <p className="font-bold text-slate-800">{data.cpf || '---'}</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Diagnóstico e Mapeamento */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Diagnóstico de Risco</h2>
                        </div>

                        <div className="flex flex-col md:flex-row print:flex-row gap-4">
                            {/* Map Column */}
                            <div className="w-full md:w-5/12 print:w-5/12">
                                <div className="border border-slate-200 rounded-xl bg-slate-100 relative overflow-hidden print-map-wrapper h-[200px] shadow-sm w-full">
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
                                <div className="mt-2 text-center">
                                    <p className="text-[9px] font-mono font-bold text-slate-500 bg-slate-50 rounded border border-slate-200 inline-block px-2 py-1">
                                        LAT: {lat.toFixed(6)} / LNG: {lng.toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            {/* Details Column */}
                            <div className="w-full md:w-7/12 print:w-7/12 flex flex-col gap-2">
                                <div className="p-3 border border-slate-200 rounded-lg bg-orange-50">
                                    <p className="text-[9px] font-bold text-orange-800 uppercase mb-1">Categoria do Risco</p>
                                    <p className="font-black text-slate-800 text-sm">{data.categoriaRisco || data.categoria_risco || 'Não Classificado'}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 border border-slate-200 rounded-lg">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Nível de Risco</p>
                                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${(data.nivelRisco === 'Alto' || data.nivelRisco === 'Iminente') ? 'bg-red-100 text-red-700 border-red-200' :
                                            data.nivelRisco === 'Médio' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-green-100 text-green-700 border-green-200'
                                            }`}>
                                            {data.nivelRisco || data.nivel_risco || 'BAIXO'}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-slate-200 rounded-lg">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Situação</p>
                                        <p className="font-bold text-slate-800 text-xs">{data.situacaoObservada || data.situacao_observada || '---'}</p>
                                    </div>
                                </div>

                                <div className="p-3 border border-slate-200 rounded-lg flex-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Alertas e Danos Secundários</p>
                                    <div className="flex flex-wrap gap-1">
                                        {(data.subtiposRisco || data.subtipos_risco || []).length > 0 ? (
                                            (data.subtiposRisco || data.subtipos_risco).map((tag, i) => (
                                                <span key={i} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : <span className="text-[10px] text-slate-400 italic">Nenhum subtipo listado.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Relatório Técnico */}
                    <section className="mb-8 avoid-break">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 bg-slate-600 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">4. Relatório Técnico Circunstanciado</h2>
                        </div>
                        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm text-xs leading-relaxed text-justify text-slate-700 whitespace-pre-wrap font-medium">
                            {data.observacoes || 'Nenhuma observação técnica registrada.'}
                        </div>
                    </section>

                    {/* 5. Medidas e Encaminhamentos */}
                    <section className="mb-8 avoid-break">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">5. Medidas Adotadas</h2>
                                </div>
                                <div className="border border-emerald-100 bg-emerald-50/50 rounded-lg p-4 h-full">
                                    <ul className="space-y-2">
                                        {(data.medidasTomadas || data.medidas_tomadas || ['Monitoramento']).map((m, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-700">
                                                <span className="text-emerald-500 mt-0.5">✔</span> {m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                                    <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">6. Encaminhamentos</h2>
                                </div>
                                <div className="border border-purple-100 bg-purple-50/50 rounded-lg p-4 h-full">
                                    <ul className="space-y-2">
                                        {(data.encaminhamentos || ['Sem encaminhamentos']).map((e, i) => (
                                            <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-700">
                                                <span className="text-purple-500 mt-0.5">➜</span> {e}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 7. Checklist (Optional) */}
                    {checklistItems.length > 0 && (
                        <section className="mb-8 avoid-break">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-teal-600 rounded-full"></div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">7. Checklist Técnico</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {checklistItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border border-slate-100 bg-slate-50 rounded">
                                        <div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600 uppercase leading-tight">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="page-break"></div>

                    {/* 8. Relatório Fotográfico */}
                    {photos.length > 0 && (
                        <section className="mb-10">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1 h-5 bg-pink-500 rounded-full"></div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">8. Relatório Fotográfico</h2>
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
                            {/* Agente Signature */}
                            <div className="flex flex-col items-center text-center px-4">
                                <div className="h-20 flex items-end justify-center mb-2">
                                    {(data.assinaturaAgente || data.assinatura_agente) ? (
                                        <img src={data.assinaturaAgente || data.assinatura_agente} alt="Assinatura" className="max-h-full max-w-[200px]" />
                                    ) : <div className="h-full w-40"></div>}
                                </div>
                                <div className="w-64 border-b border-slate-800 mb-2"></div>
                                <p className="text-[11px] uppercase font-black text-slate-900">{data.agente}</p>
                                <p className="text-[9px] uppercase font-bold text-slate-500">Agente de Defesa Civil</p>
                                <p className="text-[9px] uppercase text-slate-400">Matrícula: {data.matricula}</p>
                            </div>

                            {/* Apoio Signature (if exists) */}
                            {(data.apoioTecnico || data.apoio_tecnico) && (data.apoioTecnico?.assinatura || data.apoio_tecnico?.assinatura) && (
                                <div className="flex flex-col items-center text-center px-4">
                                    <div className="h-20 flex items-end justify-center mb-2">
                                        <img src={data.apoioTecnico?.assinatura || data.apoio_tecnico?.assinatura} alt="Assinatura" className="max-h-full max-w-[200px]" />
                                    </div>
                                    <div className="w-64 border-b border-slate-800 mb-2"></div>
                                    <p className="text-[11px] uppercase font-black text-slate-900">{data.apoioTecnico?.nome || data.apoio_tecnico?.nome}</p>
                                    <p className="text-[9px] uppercase font-bold text-slate-500">Apoio Técnico Esp.</p>
                                    <p className="text-[9px] uppercase text-slate-400">Registro: {data.apoioTecnico?.crea || data.apoio_tecnico?.crea}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full flex flex-col items-center justify-center pt-4">
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center">
                                Sistema Integrado de Gerenciamento de Riscos e Desastres - SIGERD Mobile
                            </p>
                            <p className="text-[8px] text-slate-300 mt-1">Generated ID: {id}</p>
                        </div>
                    </footer>

                </div>
            </main>
        </div>
    );
};

export default VistoriaPrint;
