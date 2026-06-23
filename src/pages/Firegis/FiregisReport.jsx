import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Printer, ArrowLeft, FileText, ZoomOut, ZoomIn, RotateCcw, X } from 'lucide-react';
import { toast } from '../../components/ToastNotification';

const LOGO_DEFESA_CIVIL = '/logo_defesa_civil.png';
const LOGO_SIGERD = '/logo_header.png';

const FiregisReport = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2.0));
    const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
    const handleResetZoom = () => setZoom(1.0);

    useEffect(() => {
        fetchIncidents();
        document.title = "FIREGIS - Relatório Consolidado";
    }, []);

    const fetchIncidents = async () => {
        try {
            const { data, error } = await supabase.from('firegis').select('*').order('data_ocorrencia', { ascending: false });
            if (error) throw error;
            setIncidents(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-10 text-center flex items-center justify-center min-h-screen">Carregando relatório consolidado...</div>;
    }

    const totalArea = incidents.reduce((sum, inc) => sum + (parseFloat(inc.area_queimada_ha) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20">
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    * { color: black !important; }
                    .print-container {
                        transform: none !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                        <FileText size={16} className="text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Relatório Consolidado</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estatística FIREGIS</span>
                    </div>
                </div>

                {/* Center Section - Zoom Controls */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 hidden sm:flex">
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
                    <button onClick={handlePrint} className="h-10 px-6 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20">
                        <Printer size={16} /> Imprimir PDF
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full overflow-x-auto pb-10">
                <div 
                    className="w-[297mm] min-h-[210mm] bg-white print:shadow-none shadow-2xl p-10 md:p-14 print:p-0 relative print-container flex flex-col font-sans origin-top text-black"
                    style={{ transform: `scale(${zoom})`, marginBottom: zoom > 1 ? `${(zoom - 1) * 210}mm` : 0 }}
                >
                    
                    {/* Header Institucional */}
                    <header className="flex flex-col items-center mb-8 border-b-4 border-[#2a5299] pb-6">
                        <div className="w-full flex justify-between items-center mb-6 px-4">
                            <div className="w-[100px] flex items-center justify-center">
                                <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-[85px] w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                            <div className="text-center flex-1 px-4">
                                <h3 className="text-slate-900 font-extrabold text-sm uppercase leading-tight">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h3>
                                <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                            </div>
                            <div className="w-[100px] flex items-center justify-center text-right">
                                <img src={LOGO_SIGERD} alt="SIGERD" className="h-[85px] w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-[#2a5299] uppercase tracking-wide text-center">FIREGIS - RELATÓRIO ESTATÍSTICO</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mt-2">
                            <span>Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
                            <span>•</span>
                            <span>Total de Ocorrências: {incidents.length}</span>
                            <span>•</span>
                            <span>Área Total Afetada: {totalArea.toFixed(2)} ha</span>
                        </div>
                    </header>

                <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-orange-50 text-orange-800">
                                <th className="border border-slate-300 p-2 text-left w-24">CÓDIGO</th>
                                <th className="border border-slate-300 p-2 text-left w-20">DATA</th>
                                <th className="border border-slate-300 p-2 text-left">TIPO / CLASSIFICAÇÃO</th>
                                <th className="border border-slate-300 p-2 text-left">BAIRRO / LOCALIDADE</th>
                                <th className="border border-slate-300 p-2 text-center w-24">ÁREA (HA)</th>
                                <th className="border border-slate-300 p-2 text-center w-28">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidents.map((inc, index) => (
                                <tr key={inc.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="border border-slate-300 p-2 font-bold">{inc.codigo_ocorrencia || 'N/A'}</td>
                                    <td className="border border-slate-300 p-2">{inc.data_ocorrencia ? new Date(inc.data_ocorrencia).toLocaleDateString('pt-BR') : '-'}</td>
                                    <td className="border border-slate-300 p-2">{inc.tipo_incendio}</td>
                                    <td className="border border-slate-300 p-2 truncate max-w-[200px]">{inc.bairro || inc.endereco || 'Não informado'}</td>
                                    <td className="border border-slate-300 p-2 text-center font-mono">{inc.area_queimada_ha ? `${inc.area_queimada_ha}` : '-'}</td>
                                    <td className="border border-slate-300 p-2 text-center">{inc.status}</td>
                                </tr>
                            ))}
                            {incidents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="border border-slate-300 p-4 text-center italic text-slate-500">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer and Signatures */}
                <div className="text-center mt-12 text-[9px] text-slate-500 uppercase pb-4">
                    <p>Documento gerado eletronicamente via Sistema SIGERD - FIREGIS</p>
                    <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>

                </div>
            </main>
        </div>
    );
};

export default FiregisReport;
