import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Printer, ArrowLeft } from 'lucide-react';
import { toast } from '../../components/ToastNotification';

const FiregisPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncident();
    }, [id]);

    const fetchIncident = async () => {
        try {
            const { data, error } = await supabase.from('firegis').select('*').eq('id', id).single();
            if (error) throw error;
            setIncident(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro', 'Ocorrência não encontrada.');
            navigate('/firegis');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                .print-only { display: block !important; }
                .page-break { page-break-before: always; }
                * { color: black !important; }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    };

    if (loading) {
        return <div className="p-10 text-center">Carregando relatório...</div>;
    }

    if (!incident) return null;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20">
            {/* Toolbar No Print */}
            <div className="no-print bg-white dark:bg-slate-800 p-4 sticky top-0 z-50 shadow-sm flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <h1 className="text-lg font-black text-slate-800 dark:text-white">Relatório FIREGIS</h1>
                </div>
                <button onClick={handlePrint} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-lg hover:bg-orange-700 transition-all">
                    <Printer size={18} /> Imprimir / PDF
                </button>
            </div>

            {/* A4 Page */}
            <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-2xl my-8 p-10 font-sans text-black relative">
                
                {/* Header Institucional */}
                <div className="flex justify-between items-center border-b-2 border-orange-600 pb-4 mb-8">
                    <img src="/logo_defesa_civil.png" alt="Defesa Civil" className="h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-black uppercase text-orange-800">FIREGIS - Relatório de Incêndio</h1>
                        <p className="text-sm font-bold text-slate-600 uppercase mt-1">Sistema Integrado de Gestão de Riscos e Desastres</p>
                    </div>
                    <img src="/logo_header.png" alt="SIGERD" className="h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
                </div>

                <div className="space-y-6">
                    {/* Bloco 1: Identificação */}
                    <div>
                        <div className="bg-orange-50 border border-orange-200 p-2 mb-3">
                            <h2 className="text-sm font-black text-orange-800 uppercase text-center tracking-widest">1. Identificação da Ocorrência</h2>
                        </div>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">CÓDIGO:</td>
                                    <td className="border border-slate-300 p-2 w-1/4">{incident.codigo_ocorrencia || 'N/A'}</td>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">STATUS:</td>
                                    <td className="border border-slate-300 p-2 font-bold">{incident.status}</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold">DATA:</td>
                                    <td className="border border-slate-300 p-2">{incident.data_ocorrencia ? new Date(incident.data_ocorrencia).toLocaleDateString('pt-BR') : 'N/A'}</td>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold">HORA:</td>
                                    <td className="border border-slate-300 p-2">{incident.hora_ocorrencia || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold">TIPO DE INCÊNDIO:</td>
                                    <td className="border border-slate-300 p-2" colSpan={3}>{incident.tipo_incendio}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Bloco 2: Localização */}
                    <div>
                        <div className="bg-orange-50 border border-orange-200 p-2 mb-3">
                            <h2 className="text-sm font-black text-orange-800 uppercase text-center tracking-widest">2. Localização e Impacto</h2>
                        </div>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">BAIRRO/LOCALIDADE:</td>
                                    <td className="border border-slate-300 p-2 w-3/4" colSpan={3}>{incident.bairro || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold">ENDEREÇO/REFERÊNCIA:</td>
                                    <td className="border border-slate-300 p-2" colSpan={3}>{incident.endereco || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">ÁREA QUEIMADA (HA):</td>
                                    <td className="border border-slate-300 p-2 w-1/4">{incident.area_queimada_ha ? `${incident.area_queimada_ha} ha` : 'N/A'}</td>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">COORDENADAS:</td>
                                    <td className="border border-slate-300 p-2 text-xs">
                                        Lat: {incident.coordenadas?.lat || 'N/A'}<br/>
                                        Lng: {incident.coordenadas?.lng || 'N/A'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Bloco 3: Operacional */}
                    <div>
                        <div className="bg-orange-50 border border-orange-200 p-2 mb-3">
                            <h2 className="text-sm font-black text-orange-800 uppercase text-center tracking-widest">3. Detalhes Operacionais</h2>
                        </div>
                        <div className="border border-slate-300 p-4 text-sm min-h-[100px] mb-4 text-justify whitespace-pre-wrap">
                            <span className="font-bold block mb-2">DESCRIÇÃO DA OCORRÊNCIA:</span>
                            {incident.descricao || 'Nenhuma descrição fornecida.'}
                        </div>

                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <tbody>
                                <tr>
                                    <td className="border border-slate-300 p-2 bg-slate-50 font-bold w-1/4">CAUSA PROVÁVEL:</td>
                                    <td className="border border-slate-300 p-2 w-3/4">{incident.causa_provavel || 'Indeterminada / Não informada'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer and Signatures */}
                <div className="mt-20 pt-8 border-t border-slate-300">
                    <div className="flex justify-center">
                        <div className="text-center w-64 border-t border-black pt-2">
                            <p className="font-bold text-xs uppercase">{incident.criado_por || 'AGENTE RESPONSÁVEL'}</p>
                            <p className="text-[10px] uppercase text-slate-600">DEFESA CIVIL / CORPO DE BOMBEIROS</p>
                        </div>
                    </div>
                    
                    <div className="text-center mt-12 text-[9px] text-slate-500 uppercase">
                        <p>Documento gerado eletronicamente via Sistema SIGERD - FIREGIS</p>
                        <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FiregisPrint;
