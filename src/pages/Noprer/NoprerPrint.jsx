import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';

const NoprerPrint = () => {
    const { id } = useParams();
    const [noprer, setNoprer] = useState(null);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const fetchNoprer = async () => {
            try {
                const { data, error } = await supabase.from('noprer').select('*').eq('id', id).single();
                if (data) setNoprer(data);
                else console.error(error);
            } catch (err) {
                console.error(err);
            }
        };
        fetchNoprer();
    }, [id]);

    if (!noprer) return <div className="p-8">Carregando documento...</div>;

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const revistoriaDate = new Date(noprer.data_limite);
    revistoriaDate.setDate(revistoriaDate.getDate() + 3);

    return (
        <div className="min-h-screen bg-slate-800 flex flex-col font-sans">
            {/* Toolbar - No Print */}
            <div className="no-print bg-slate-900 border-b border-slate-700 p-4 sticky top-0 z-50 flex justify-between items-center shadow-xl">
                <div className="flex items-center gap-4">
                    <h1 className="text-white font-bold flex items-center gap-2">
                        <Printer size={20} className="text-blue-500" />
                        Visualização de Impressão (A4)
                    </h1>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button 
                        onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                        disabled={zoom <= 0.5}
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-slate-300 font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button 
                        onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                        disabled={zoom >= 1.5}
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <X size={16} /> Fechar
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </div>

            {/* A4 Paper Container */}
            <div className="flex-1 overflow-auto p-8 print:p-0 flex justify-center pb-24">
                <div 
                    className="bg-white print:m-0 print:shadow-none"
                    style={{ 
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '15mm 15mm',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        color: '#000',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    {/* ===== PAGE 1 ===== */}
                    <div style={{ minHeight: '260mm', display: 'flex', flexDirection: 'col' }}>
                        {/* Cabecalho */}
                        <div className="text-center mb-6">
                            <h2 className="font-bold text-[13px] leading-tight">PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ</h2>
                            <h3 className="font-bold text-[11px] leading-tight text-gray-800">SECRETARIA MUNICIPAL DE OBRAS E INFRAESTRUTURA — SECOBR</h3>
                            <h3 className="font-bold text-[11px] leading-tight text-gray-800">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL — COMPDEC</h3>
                            <p className="text-[9px] italic text-gray-500 mt-1">Sistema Integrado de Gestão de Riscos e Desastres — SIGERD</p>
                            <div className="border-t border-gray-400 mt-2 pt-4">
                                <h1 className="text-lg font-black tracking-wide">NOTIFICAÇÃO PRELIMINAR DE RISCO — NOPRER</h1>
                                <p className="text-[11px] text-gray-600">Nº {noprer.numero_noprer} / Origem: {noprer.origem_id}</p>
                            </div>
                        </div>

                        {/* 1. IDENTIFICAÇÃO DO PROCESSO */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">1. IDENTIFICAÇÃO DO PROCESSO</h3>
                            <table className="w-full text-[10px] border-collapse border border-gray-300">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold w-[30%]">Data de emissão:</td>
                                        <td className="border border-gray-300 p-1.5">{formatDate(noprer.data_emissao)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Documento de origem:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.origem_id}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Classificação de risco:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.risco} — Risco avaliado</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Tipo de risco:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.tipo_risco}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2. DADOS DO IMÓVEL */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">2. DADOS DO IMÓVEL</h3>
                            <table className="w-full text-[10px] border-collapse border border-gray-300">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold w-[30%]">Endereço:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.endereco}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Coordenadas:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.coordenadas?.lat}, {noprer.coordenadas?.lng}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. DADOS DO RESPONSÁVEL */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">3. DADOS DO RESPONSÁVEL NOTIFICADO</h3>
                            <table className="w-full text-[10px] border-collapse border border-gray-300">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold w-[30%]">Nome completo:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.solicitante}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 4. AGENTE EMISSOR */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">4. AGENTE EMISSOR</h3>
                            <table className="w-full text-[10px] border-collapse border border-gray-300">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold w-[30%]">Agente de Defesa Civil:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.criado_por}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Coordenador responsável:</td>
                                        <td className="border border-gray-300 p-1.5">Bruno Pagel — Coordenador Municipal de Defesa Civil</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 5. DESCRIÇÃO TÉCNICA */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">5. DESCRIÇÃO TÉCNICA DO RISCO IDENTIFICADO</h3>
                            <p className="text-[10px] leading-relaxed text-justify mb-2">
                                Durante vistoria técnica e/ou atendimento de ocorrência, foi constatada a existência de risco {noprer.tipo_risco?.toLowerCase()} classificado como {noprer.risco}, sem, contudo, configurar quadro de risco iminente absoluto que justifique a interdição imediata completa do imóvel neste exato momento.
                            </p>
                            <p className="text-[10px] leading-relaxed text-justify font-semibold">
                                {noprer.descricao}
                            </p>
                        </div>

                        {/* 6. FUNDAMENTAÇÃO LEGAL */}
                        <div className="mb-4">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">6. FUNDAMENTAÇÃO LEGAL</h3>
                            <p className="text-[9px] leading-relaxed text-justify text-gray-700">
                                A presente notificação é expedida com fundamento na Lei Federal nº 12.608/2012 (Política Nacional de Proteção e Defesa Civil), na Lei Federal nº 12.340/2010 e legislação municipal vigente aplicável à Coordenadoria Municipal de Proteção e Defesa Civil, no exercício do poder de polícia administrativa, com a finalidade de cientificar o responsável quanto ao risco identificado e às medidas cabíveis, possuindo caráter acautelatório e de monitoramento.
                            </p>
                        </div>
                    </div>
                    
                    {/* Quebra de pagina para impressao */}
                    <div className="break-before-page"></div>

                    {/* ===== PAGE 2 ===== */}
                    <div className="pt-8">
                        {/* Header repetido minificado para Pág 2 */}
                        <div className="text-center mb-6 pb-2 border-b border-gray-300">
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                                CONTINUAÇÃO — {noprer.numero_noprer} — PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ
                            </p>
                        </div>

                        {/* 7. MEDIDAS MITIGATÓRIAS */}
                        <div className="mb-6">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">7. MEDIDAS MITIGATÓRIAS RECOMENDADAS</h3>
                            <ol className="list-decimal list-outside ml-4 text-[10px] space-y-1.5 text-justify">
                                {(noprer.medidas_mitigatorias || []).map((medida, idx) => (
                                    <li key={idx} className="pl-1">{medida}</li>
                                ))}
                                <li className="pl-1">Comunicar imediatamente à COMPDEC qualquer agravamento dos sinais observados.</li>
                            </ol>
                        </div>

                        {/* 8. PRAZO E REVISTORIA */}
                        <div className="mb-6">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">8. PRAZO E REVISTORIA</h3>
                            <table className="w-full text-[10px] border-collapse border border-gray-300">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold w-[30%]">Prazo para adoção:</td>
                                        <td className="border border-gray-300 p-1.5">{noprer.prazo_dias} dias corridos, a contar desta notificação.</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Data-limite:</td>
                                        <td className="border border-gray-300 p-1.5">{formatDate(noprer.data_limite)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-300 bg-gray-100 p-1.5 font-bold">Revistoria agendada:</td>
                                        <td className="border border-gray-300 p-1.5 text-red-600 font-bold">{formatDate(revistoriaDate)} (Estimativa)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 9. ADVERTÊNCIA */}
                        <div className="mb-6">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">9. ADVERTÊNCIA</h3>
                            <div className="bg-red-50 text-red-900 p-3 border border-red-200 text-[10px] text-justify font-semibold leading-relaxed">
                                Esta NOPRER NÃO constitui auto de interdição e não impede, por si só, a utilização do imóvel. Trata-se de notificação formal que cientifica o(a) responsável quanto ao risco identificado, transferindo-lhe o dever de adotar as medidas mitigatórias recomendadas. A inércia, omissão ou agravamento do risco constatado em revistoria poderá ensejar a emissão de auto de interdição e demais medidas administrativas cabíveis, sem prejuízo da responsabilidade civil do(a) notificado(a) por eventuais danos decorrentes da não adoção das providências indicadas.
                            </div>
                        </div>

                        {/* 11. CIÊNCIA DO NOTIFICADO */}
                        <div className="mb-10 mt-10">
                            <h3 className="text-[12px] font-bold text-blue-900 border-b border-gray-300 pb-1 mb-4">10. CIÊNCIA DO NOTIFICADO</h3>
                            <p className="text-[10px] mb-8 text-center">
                                Declaro estar ciente do conteúdo da presente Notificação Preliminar de Risco e das medidas nela recomendadas.
                            </p>
                            
                            {noprer.recusou_assinatura ? (
                                <div className="space-y-6">
                                    <div className="text-center text-[10px] font-bold text-red-600 border border-red-200 p-2 bg-red-50 mx-10">
                                        RECUSA DE ASSINATURA REGISTRADA
                                    </div>
                                    <p className="text-[9px] text-center italic text-gray-500 mb-8">
                                        Em caso de recusa do(a) notificado(a) em assinar, fica registrada a ciência mediante a assinatura de duas testemunhas abaixo.
                                    </p>
                                    <div className="flex justify-between px-10 gap-8 pt-8">
                                        <div className="flex-1 text-center border-t border-gray-400 pt-1">
                                            <p className="text-[10px] font-bold">{noprer.testemunhas?.t1 || 'Testemunha 1'}</p>
                                            <p className="text-[9px]">{noprer.testemunhas?.doc1 || 'CPF/RG'}</p>
                                        </div>
                                        <div className="flex-1 text-center border-t border-gray-400 pt-1">
                                            <p className="text-[10px] font-bold">{noprer.testemunhas?.t2 || 'Testemunha 2'}</p>
                                            <p className="text-[9px]">{noprer.testemunhas?.doc2 || 'CPF/RG'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between px-10 gap-8 mt-12">
                                    <div className="flex-1 flex flex-col items-center">
                                        <div className="h-10 mb-2"></div>
                                        <div className="w-full border-t border-gray-400 text-center pt-1">
                                            <p className="text-[10px] font-bold">{noprer.criado_por}</p>
                                            <p className="text-[9px]">Agente de Defesa Civil</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center">
                                        <div className="h-10 mb-2 flex justify-center items-end">
                                            {noprer.assinatura && <img src={noprer.assinatura} alt="Assinatura" style={{ maxHeight: '40px' }} />}
                                        </div>
                                        <div className="w-full border-t border-gray-400 text-center pt-1">
                                            <p className="text-[10px] font-bold">{noprer.solicitante}</p>
                                            <p className="text-[9px]">Responsável Notificado</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoprerPrint;
