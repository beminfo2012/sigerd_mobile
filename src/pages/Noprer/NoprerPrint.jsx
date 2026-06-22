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
            <style>
                {`
                    @media print {
                        @page { size: A4; margin: 0; }
                        body, html { margin: 0; padding: 0; background: #fff !important; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .break-before-page { page-break-before: always; }
                        .print-container { 
                            width: 210mm !important; 
                            min-height: 297mm !important; 
                            margin: 0 !important; 
                            padding: 15mm !important; 
                            box-shadow: none !important; 
                            transform: none !important;
                        }
                    }
                `}
            </style>
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
                    className="bg-white print-container"
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
                    <div style={{ minHeight: '260mm', display: 'flex', flexDirection: 'column' }}>
                        {/* Cabecalho - Formato Estrito */}
                        <div className="flex border-b-2 border-black pb-4 mb-4">
                            <div className="w-24 flex items-center justify-center">
                                {/* Placeholder for Logo */}
                                <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center font-bold text-[8px] text-center">BRASÃO<br/>MUNICIPAL</div>
                            </div>
                            <div className="flex-1 text-center flex flex-col justify-center">
                                <h2 className="font-bold text-[14px] leading-tight uppercase">PREFEITURA MUNICIPAL DE SANTA MARIA DE JETIBÁ</h2>
                                <h3 className="font-bold text-[12px] leading-tight uppercase mt-1">SECRETARIA MUNICIPAL DE OBRAS E INFRAESTRUTURA — SECOBR</h3>
                                <h3 className="font-bold text-[12px] leading-tight uppercase mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</h3>
                                <p className="text-[10px] mt-1">Sistema Integrado de Gestão de Riscos e Desastres — SIGERD</p>
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h1 className="text-[16px] font-black uppercase tracking-widest border border-black p-2 bg-gray-200">
                                NOTIFICAÇÃO PRELIMINAR DE RISCO — NOPRER
                            </h1>
                        </div>

                        {/* 1. IDENTIFICAÇÃO DO PROCESSO */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">1. IDENTIFICAÇÃO DO PROCESSO</h3>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">Nº DA NOPRER:</td>
                                        <td className="border border-black p-1.5 font-bold text-[12px]">{noprer.numero_noprer}</td>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">DATA DE EMISSÃO:</td>
                                        <td className="border border-black p-1.5">{formatDate(noprer.data_emissao)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold uppercase">ORIGEM (VIST/OCOR):</td>
                                        <td className="border border-black p-1.5">{noprer.origem_id}</td>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold uppercase">TIPO DE RISCO:</td>
                                        <td className="border border-black p-1.5 uppercase">{noprer.tipo_risco || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold uppercase">CLASSIFICAÇÃO DO RISCO:</td>
                                        <td colSpan="3" className="border border-black p-1.5 font-bold uppercase">{noprer.risco}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2. DADOS DO IMÓVEL */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">2. DADOS DO IMÓVEL</h3>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">ENDEREÇO/LOCAL:</td>
                                        <td className="border border-black p-1.5 uppercase">{noprer.endereco}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold uppercase">COORDENADAS (GPS):</td>
                                        <td className="border border-black p-1.5">{noprer.coordenadas?.lat ? `${noprer.coordenadas.lat}, ${noprer.coordenadas.lng}` : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. DADOS DO RESPONSÁVEL */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">3. RESPONSÁVEL NOTIFICADO</h3>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">NOME COMPLETO:</td>
                                        <td className="border border-black p-1.5 uppercase font-bold">{noprer.solicitante}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 4. DESCRIÇÃO TÉCNICA */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">4. DESCRIÇÃO TÉCNICA DO RISCO IDENTIFICADO</h3>
                            <div className="border border-black p-2 min-h-[80px]">
                                <p className="text-[10px] text-justify leading-relaxed">
                                    Durante vistoria técnica ou atendimento, foi constatada a existência de risco {noprer.tipo_risco?.toLowerCase()} classificado como <strong>{noprer.risco?.toUpperCase()}</strong>, requerendo monitoramento.
                                </p>
                                <p className="text-[10px] text-justify leading-relaxed mt-2 font-bold uppercase">
                                    {noprer.descricao}
                                </p>
                            </div>
                        </div>

                        {/* 5. MEDIDAS MITIGATÓRIAS */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">5. MEDIDAS MITIGATÓRIAS RECOMENDADAS</h3>
                            <div className="border border-black p-2 min-h-[100px]">
                                <ul className="list-disc list-inside text-[10px] space-y-1 text-justify uppercase">
                                    {(noprer.medidas_mitigatorias || []).map((medida, idx) => (
                                        <li key={idx}>{medida}</li>
                                    ))}
                                    <li className="font-bold">COMUNICAR IMEDIATAMENTE À COMPDEC QUALQUER AGRAVAMENTO DOS SINAIS OBSERVADOS.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 6. PRAZO E REVISTORIA */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-1">6. PRAZO PARA ADEQUAÇÃO</h3>
                            <table className="w-full text-[10px] border-collapse border border-black">
                                <tbody>
                                    <tr>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">PRAZO:</td>
                                        <td className="border border-black p-1.5 font-bold uppercase">{noprer.prazo_dias} DIAS CORRIDOS</td>
                                        <td className="border border-black bg-gray-200 p-1.5 font-bold w-[25%] uppercase">DATA-LIMITE:</td>
                                        <td className="border border-black p-1.5 font-bold">{formatDate(noprer.data_limite)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 7. ADVERTÊNCIA */}
                        <div className="mb-6">
                            <div className="border-2 border-black p-2 text-justify">
                                <p className="text-[9px] uppercase font-bold text-center border-b border-black pb-1 mb-1">=== AVISO IMPORTANTE ===</p>
                                <p className="text-[9px] leading-tight">
                                    ESTA NOTIFICAÇÃO NÃO CONSTITUI AUTO DE INTERDIÇÃO. TRATA-SE DE DOCUMENTO FORMAL QUE CIENTIFICA O RESPONSÁVEL QUANTO AO RISCO, TRANSFERINDO-LHE O DEVER DE ADOTAR AS MEDIDAS MITIGATÓRIAS. A INÉRCIA OU AGRAVAMENTO DO RISCO PODERÁ ENSEJAR A EMISSÃO DE AUTO DE INTERDIÇÃO E MEDIDAS ADMINISTRATIVAS CABÍVEIS, ALÉM DA RESPONSABILIDADE CIVIL POR EVENTUAIS DANOS.
                                </p>
                            </div>
                        </div>

                        {/* 8. ASSINATURAS */}
                        <div className="mt-auto pb-4">
                            <h3 className="text-[11px] font-bold uppercase mb-6 text-center">8. ASSINATURAS E TERMO DE CIÊNCIA</h3>
                            <p className="text-[10px] text-center mb-8 uppercase">DECLARO ESTAR CIENTE DO CONTEÚDO DESTA NOTIFICAÇÃO E DAS MEDIDAS RECOMENDADAS.</p>
                            
                            {noprer.recusou_assinatura ? (
                                <div className="space-y-4">
                                    <div className="text-center text-[10px] font-bold border border-black p-1 mb-6">
                                        O(A) NOTIFICADO(A) RECUSOU-SE A ASSINAR ESTE DOCUMENTO.
                                    </div>
                                    <div className="flex justify-between px-10 gap-8">
                                        <div className="flex-1 text-center border-t border-black pt-1">
                                            <p className="text-[10px] font-bold uppercase">{noprer.testemunhas?.t1 || 'TESTEMUNHA 1'}</p>
                                            <p className="text-[9px] uppercase">{noprer.testemunhas?.doc1 || 'CPF/RG'}</p>
                                        </div>
                                        <div className="flex-1 text-center border-t border-black pt-1">
                                            <p className="text-[10px] font-bold uppercase">{noprer.testemunhas?.t2 || 'TESTEMUNHA 2'}</p>
                                            <p className="text-[9px] uppercase">{noprer.testemunhas?.doc2 || 'CPF/RG'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between px-10 gap-8">
                                    <div className="flex-1 flex flex-col items-center">
                                        <div className="h-10 mb-1"></div>
                                        <div className="w-full border-t border-black text-center pt-1">
                                            <p className="text-[10px] font-bold uppercase">{noprer.criado_por}</p>
                                            <p className="text-[9px] uppercase">AGENTE DE DEFESA CIVIL</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center">
                                        <div className="h-10 mb-1 flex justify-center items-end">
                                            {noprer.assinatura && <img src={noprer.assinatura} alt="Assinatura" style={{ maxHeight: '40px' }} />}
                                        </div>
                                        <div className="w-full border-t border-black text-center pt-1">
                                            <p className="text-[10px] font-bold uppercase">{noprer.solicitante}</p>
                                            <p className="text-[9px] uppercase">RESPONSÁVEL NOTIFICADO</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer da pagina */}
                        <div className="text-center text-[8px] border-t border-gray-400 pt-1 mt-4">
                            <p>Defesa Civil de Santa Maria de Jetibá - ES | Telefone: (27) 3263-4896 | E-mail: defesacivil@pmsmj.es.gov.br</p>
                            <p>Gerado via Sistema SIGERD - Autenticação Eletrônica</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoprerPrint;
