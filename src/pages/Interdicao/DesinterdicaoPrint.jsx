import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { initDB } from '../../services/db';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DesinterdicaoPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // 1. Try Local DB
                const db = await initDB();
                const localMatch = await db.get('desinterdicoes', id);

                if (localMatch) {
                    setData(localMatch);
                    setLoading(false);
                    return;
                }

                // 2. Fetch from Supabase
                const { data: reportData, error } = await supabase
                    .from('desinterdicoes')
                    .select('*')
                    .or(`id.eq.${id}`)
                    .single();

                if (reportData) {
                    setData(reportData);
                } else {
                    console.warn("Desinterdição não encontrada:", error);
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
        window.print();
    };

    const handleDownloadPDF = async () => {
        const container = document.querySelector('.print-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 99999; font-weight: bold; font-family: sans-serif; display: flex; align-items: center; gap: 12px;">
                <div style="width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                Gerando PDF...
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(toast);

        try {
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
            const ratio = pageWidth / canvas.width;
            const finalHeight = canvas.height * ratio;

            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, finalHeight);
            pdf.save(`Auto_Desinterdicao_${data.interdicaoId || id}.pdf`);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Falha ao gerar o PDF.');
        } finally {
            if (document.body.contains(toast)) document.body.removeChild(toast);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400">Carregando Relatório...</div>;
    if (!data) return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400">Relatório não encontrado.</div>;

    const photos = (() => {
        let p = data.fotos || [];
        if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (e) { p = []; }
        }
        return Array.isArray(p) ? p : [];
    })();

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 print:bg-white print:p-0 p-8 flex justify-center">
            <style>{`
                @media print {
                    @page { margin: 10mm; size: A4; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid; page-break-inside: avoid; }
                }
            `}</style>

            <div className="no-print fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 flex justify-between items-center z-[9999]">
                <h1 className="font-bold text-lg">Auto de Desinterdição</h1>
                <div className="flex gap-4">
                    <button onClick={() => window.close()} className="px-4 py-2 hover:bg-slate-700 rounded text-sm font-bold uppercase">Fechar</button>
                    <button onClick={handleDownloadPDF} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-bold uppercase text-sm">Baixar PDF</button>
                    <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold uppercase text-sm">Imprimir</button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full">
                <div className="w-[210mm] bg-white shadow-2xl min-h-[297mm] p-12 print:shadow-none print:p-0 print-container">
                    {/* Header */}
                    <header className={`flex flex-col items-center mb-10 border-b-4 pb-6 ${data.tipo_desinterdicao === 'Parcial' ? 'border-orange-500' : 'border-green-600'}`}>
                        <div className="w-full flex justify-between items-center mb-6">
                            <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-20 w-auto" />
                            <div className="text-center flex-1">
                                <h3 className="font-black text-sm uppercase">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h3>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                            </div>
                            <img src={LOGO_SIGERD} alt="SIGERD" className="h-20 w-auto" />
                        </div>
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${data.tipo_desinterdicao === 'Parcial' ? 'text-orange-700' : 'text-green-700'}`}>Auto de Desinterdição {data.tipo_desinterdicao || ''}</h1>
                        <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-4 uppercase tracking-[2px]">
                            Referente à Interdição #{data.interdicaoId || data.interdicao_id}
                        </div>
                    </header>

                    {/* Content */}
                    <div className="space-y-8">
                        <section className="avoid-break">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[2px] mb-4">1. Identificação</h2>
                            <div className="grid grid-cols-2 border border-slate-200 rounded-xl overflow-hidden text-xs">
                                <div className="p-4 border-b border-r border-slate-200">
                                    <p className="font-bold text-slate-400 uppercase text-[9px] mb-1">Data da Desinterdição</p>
                                    <p className="font-black text-slate-800">{new Date(data.created_at || data.createdAt).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="p-4 border-b border-slate-200">
                                    <p className="font-bold text-slate-400 uppercase text-[9px] mb-1">Agente Responsável</p>
                                    <p className="font-black text-slate-800 uppercase">{data.agente}</p>
                                </div>
                                <div className="p-4 border-r border-slate-200">
                                    <p className="font-bold text-slate-400 uppercase text-[9px] mb-1">Proprietário / Responsável</p>
                                    <p className="font-black text-slate-800 uppercase">{data.responsavelNome}</p>
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-slate-400 uppercase text-[9px] mb-1">Localidade / Endereço</p>
                                    <p className="font-black text-slate-800">{data.endereco} - {data.bairro}</p>
                                </div>
                            </div>
                        </section>

                        <section className="avoid-break">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[2px] mb-4">2. Parecer Técnico</h2>
                            <div className="space-y-4">
                                <div className="p-6 bg-green-50 rounded-2xl border-2 border-green-100 italic text-sm text-green-900">
                                    <p className="font-black text-[9px] text-green-600 uppercase mb-2 not-italic">Medidas Corretivas Executadas:</p>
                                    "{data.medidasCorretivas}"
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 italic text-sm text-slate-800">
                                    <p className="font-black text-[9px] text-slate-500 uppercase mb-2 not-italic">Situação Verificada In Loco:</p>
                                    "{data.situacaoVerificada}"
                                </div>
                            </div>
                        </section>

                        <div className={`p-8 border-2 rounded-3xl text-center avoid-break ${data.tipo_desinterdicao === 'Parcial' ? 'bg-orange-100 border-orange-200' : 'bg-green-100 border-green-200'}`}>
                            <h3 className={`text-xl font-black uppercase tracking-widest ${data.tipo_desinterdicao === 'Parcial' ? 'text-orange-800' : 'text-green-800'}`}>
                                Parecer: Desinterdição {data.tipo_desinterdicao || 'Total'}
                            </h3>
                            <p className={`${data.tipo_desinterdicao === 'Parcial' ? 'text-orange-700' : 'text-green-700'} text-sm mt-2 font-bold`}>
                                {data.tipo_desinterdicao === 'Parcial' 
                                    ? 'O referido imóvel / área encontra-se PARCIALMENTE LIBERADO. As restrições permanecem vigentes para as demais áreas não especificadas.' 
                                    : 'O referido imóvel / área encontra-se LIBERADO para uso regular por não apresentar riscos iminentes no momento da inspeção.'}
                            </p>
                        </div>

                        {photos.length > 0 && (
                            <section className="page-break pt-10">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[2px] mb-6">3. Anexo Fotográfico</h2>
                                <div className="grid grid-cols-2 gap-8">
                                    {photos.map((p, i) => (
                                        <div key={i} className="avoid-break space-y-2">
                                            <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center">
                                                <img src={p.data || p.url} className="max-w-full max-h-full object-contain" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 text-center">{p.legenda || `Registro ${i+1}`}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Footer / Signatures */}
                    <footer className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 avoid-break flex flex-col items-center">
                        <div className="flex justify-around w-full mb-10">
                            <div className="text-center flex flex-col items-center">
                                <div className="h-16 flex items-end mb-2">
                                    {data.assinaturaAgente && <img src={data.assinaturaAgente} className="max-h-full" />}
                                </div>
                                <div className="w-64 border-b border-slate-900 mb-2"></div>
                                <p className="text-[10px] font-black uppercase text-slate-900">{data.agente}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">Agente de Defesa Civil - Matrícula {data.matricula}</p>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-10">SIGERD Mobile - Santa Maria de Jetibá / ES</p>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default DesinterdicaoPrint;
