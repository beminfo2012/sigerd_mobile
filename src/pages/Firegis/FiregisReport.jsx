import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Printer, ArrowLeft } from 'lucide-react';
import { toast } from '../../components/ToastNotification';

const FiregisReport = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncidents();
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
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                @page { size: A4 landscape; margin: 10mm; }
                body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                * { color: black !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    if (loading) {
        return <div className="p-10 text-center">Carregando relatório consolidado...</div>;
    }

    const totalArea = incidents.reduce((sum, inc) => sum + (parseFloat(inc.area_queimada_ha) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20">
            {/* Toolbar No Print */}
            <div className="no-print bg-white dark:bg-slate-800 p-4 sticky top-0 z-50 shadow-sm flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/firegis')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <h1 className="text-lg font-black text-slate-800 dark:text-white">Relatório Consolidado FIREGIS</h1>
                </div>
                <button onClick={handlePrint} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all">
                    <Printer size={18} /> Imprimir / PDF
                </button>
            </div>

            {/* A4 Landscape Page */}
            <div className="max-w-[297mm] mx-auto bg-white min-h-[210mm] shadow-2xl my-8 p-10 font-sans text-black relative">
                
                {/* Header Institucional */}
                <div className="flex justify-between items-center border-b-2 border-orange-600 pb-4 mb-6">
                    <img src="/logo_defesa_civil.png" alt="Defesa Civil" className="h-12 object-contain grayscale" onError={(e) => e.target.style.display = 'none'} />
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-black uppercase text-orange-800">FIREGIS - RELATÓRIO ESTATÍSTICO CONSOLIDADO</h1>
                        <p className="text-xs font-bold text-slate-600 uppercase mt-1">Total de Ocorrências: {incidents.length} | Área Total Afetada: {totalArea.toFixed(2)} ha</p>
                    </div>
                    <img src="/logo_header.png" alt="SIGERD" className="h-12 object-contain grayscale" onError={(e) => e.target.style.display = 'none'} />
                </div>

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

                <div className="text-center mt-12 text-[9px] text-slate-500 uppercase">
                    <p>Documento gerado eletronicamente via Sistema SIGERD - FIREGIS</p>
                    <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>

            </div>
        </div>
    );
};

export default FiregisReport;
