import React, { useState, useEffect } from 'react';
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../utils/reportLogos';

/**
 * PrintLayout Component
 * Um layout base padronizado para relatórios PDF no SIGERD.
 * Centraliza os controles de zoom, botões de impressão e cabeçalhos oficiais.
 * 
 * @param {string} documentTitle - O título da aba do navegador e nome do PDF
 * @param {string} reportTitle - O título principal no cabeçalho do documento
 * @param {React.ReactNode} subtitle - Elemento opcional (badge de status, datas, etc) abaixo do título
 * @param {boolean} isLoading - Se está carregando os dados
 * @param {Function} onPrint - Função chamada ao clicar em imprimir (padrão window.print)
 * @param {React.ReactNode} children - O conteúdo do relatório em si (tabelas, textos, etc)
 */
export default function PrintLayout({
    documentTitle = 'Relatório Oficial',
    reportTitle = 'Relatório Oficial',
    subtitle,
    isLoading = false,
    onPrint,
    children
}) {
    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.1));
    const handleResetZoom = () => setZoom(1.0);

    useEffect(() => {
        document.title = documentTitle;
    }, [documentTitle]);

    const handlePrintClick = () => {
        if (onPrint) {
            onPrint();
        } else {
            setTimeout(() => window.print(), 500);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Carregando Relatório...</div>;
    }

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

                @media screen {
                    .print-container {
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        transform: scale(var(--report-zoom));
                        transform-origin: top center;
                        margin-bottom: calc(-297mm * (1 - var(--report-zoom)) + 20px);
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
                    @page :first { margin-top: 6mm; }
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
                    .report-table tr {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }

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
            `}</style>

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <FileText size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Imprimir Relatório</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel de Impressão Oficial SIGERD</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 hidden md:flex">
                    <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300"><ZoomOut size={16} /></button>
                    <button onClick={handleResetZoom} className="h-8 px-3 rounded-lg hover:bg-white/10 flex items-center gap-1 text-xs font-bold text-slate-300"><RotateCcw size={12} /> {Math.round(zoom * 100)}%</button>
                    <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300"><ZoomIn size={16} /></button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-white flex items-center gap-2"><X size={16} /> Fechar</button>
                    <button onClick={handlePrintClick} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2"><Printer size={16} /> Imprimir</button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper" style={{ '--report-zoom': zoom }}>
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-14 print:p-0 mb-10 print:mb-0 relative print-container flex flex-col justify-between">
                    <div className="relative">
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
                            <h1 className="text-2xl font-black text-[#2a5299] uppercase tracking-wide text-center">{reportTitle}</h1>
                            {subtitle && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                                    {subtitle}
                                </div>
                            )}
                        </header>
                        
                        {/* Conteúdo específico de cada relatório */}
                        <div className="w-full">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
