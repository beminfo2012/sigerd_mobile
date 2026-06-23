import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';

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
                        <header className="flex flex-col items-center mb-6 border-b-4 border-[#2a5299] pb-4">
                            <div className="w-full flex justify-between items-center mb-4 px-4">
                                <div className="w-[100px] flex items-center justify-center">
                                    <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-[70px] w-auto object-contain" />
                                </div>
                                <div className="text-center flex-1 px-4">
                                    <h3 className="text-slate-900 font-extrabold text-[12px] uppercase leading-tight">PREFEITURA MUNICIPAL DE<br />SANTA MARIA DE JETIBÁ</h3>
                                    <p className="text-slate-600 text-[9px] uppercase font-bold tracking-widest mt-1">COORDENADORIA MUNICIPAL DE PROTEÇÃO E DEFESA CIVIL</p>
                                </div>
                                <div className="w-[100px] flex items-center justify-center text-right">
                                    <img src={LOGO_SIGERD} alt="SIGERD" className="h-[70px] w-auto object-contain" />
                                </div>
                            </div>
                            <h1 className="text-xl font-black text-[#2a5299] uppercase tracking-wide text-center">NOTIFICAÇÃO PRELIMINAR DE RISCO — NOPRER</h1>
                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-1 rounded-full border border-slate-100 mt-2">
                                <span>Emissão: {formatDate(noprer.data_emissao)}</span>
                                <span>•</span>
                                <span>Nº NOPRER: {noprer.numero_noprer || '---'}</span>
                            </div>
                        </header>

                        {/* 1. IDENTIFICAÇÃO DO PROCESSO */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">1. IDENTIFICAÇÃO DO PROCESSO</h3>
                            <table className="w-full text-[10px] border-collapse border border-[#cbd5e1]">
                                <tbody>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">Nº DA NOPRER:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold text-[12px]">{noprer.numero_noprer}</td>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">DATA DE EMISSÃO:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold">{formatDate(noprer.data_emissao)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold uppercase">ORIGEM (VIST/OCOR):</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold">{noprer.origem_id}</td>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold uppercase">TIPO DE RISCO:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 uppercase font-bold">{noprer.tipo_risco || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold uppercase">CLASSIFICAÇÃO DO RISCO:</td>
                                        <td colSpan="3" className="border border-[#cbd5e1] text-red-700 bg-red-50 p-1.5 font-black uppercase">{noprer.risco}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2. DADOS DO IMÓVEL */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">2. DADOS DO IMÓVEL</h3>
                            <table className="w-full text-[10px] border-collapse border border-[#cbd5e1]">
                                <tbody>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">ENDEREÇO/LOCAL:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 uppercase font-bold">{noprer.endereco}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold uppercase">COORDENADAS (GPS):</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold">{noprer.coordenadas?.lat ? `${noprer.coordenadas.lat}, ${noprer.coordenadas.lng}` : 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. DADOS DO RESPONSÁVEL */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">3. RESPONSÁVEL NOTIFICADO</h3>
                            <table className="w-full text-[10px] border-collapse border border-[#cbd5e1]">
                                <tbody>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">NOME COMPLETO:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 uppercase font-bold">{noprer.solicitante}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 4. DESCRIÇÃO TÉCNICA */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">4. DESCRIÇÃO TÉCNICA DO RISCO IDENTIFICADO</h3>
                            <div className="border border-[#cbd5e1] p-3 min-h-[80px] bg-slate-50">
                                <p className="text-[10px] text-justify leading-relaxed text-slate-800">
                                    Durante vistoria técnica ou atendimento, foi constatada a existência de risco {noprer.tipo_risco?.toLowerCase()} classificado como <strong>{noprer.risco?.toUpperCase()}</strong>, requerendo monitoramento.
                                </p>
                                <p className="text-[10px] text-justify leading-relaxed mt-2 font-bold uppercase text-slate-900">
                                    {noprer.descricao}
                                </p>
                            </div>
                        </div>

                        {/* 5. MEDIDAS MITIGATÓRIAS */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">5. MEDIDAS MITIGATÓRIAS RECOMENDADAS</h3>
                            <div className="border border-[#cbd5e1] p-3 min-h-[100px] bg-slate-50">
                                <ul className="list-disc list-inside text-[10px] space-y-1.5 text-justify uppercase font-bold text-slate-800">
                                    {(noprer.medidas_mitigatorias || []).map((medida, idx) => (
                                        <li key={idx}>{medida}</li>
                                    ))}
                                    <li className="font-black text-red-700 mt-2">COMUNICAR IMEDIATAMENTE À COMPDEC QUALQUER AGRAVAMENTO DOS SINAIS OBSERVADOS.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 6. PRAZO E REVISTORIA */}
                        <div className="mb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-1">6. PRAZO PARA ADEQUAÇÃO</h3>
                            <table className="w-full text-[10px] border-collapse border border-[#cbd5e1]">
                                <tbody>
                                    <tr>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">PRAZO:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold uppercase">{noprer.prazo_dias} DIAS CORRIDOS</td>
                                        <td className="border border-[#cbd5e1] bg-[#E8F1FA] text-[#122848] p-1.5 font-bold w-[25%] uppercase">DATA-LIMITE:</td>
                                        <td className="border border-[#cbd5e1] text-slate-800 p-1.5 font-bold">{formatDate(noprer.data_limite)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 7. ADVERTÊNCIA */}
                        <div className="mb-6">
                            <div className="border-2 border-red-600 bg-red-50 text-red-800 p-3 text-justify rounded-sm">
                                <p className="text-[10px] uppercase font-black text-center border-b border-red-200 pb-1.5 mb-1.5">=== AVISO IMPORTANTE ===</p>
                                <p className="text-[9px] leading-relaxed font-bold">
                                    ESTA NOTIFICAÇÃO NÃO CONSTITUI AUTO DE INTERDIÇÃO. TRATA-SE DE DOCUMENTO FORMAL QUE CIENTIFICA O RESPONSÁVEL QUANTO AO RISCO, TRANSFERINDO-LHE O DEVER DE ADOTAR AS MEDIDAS MITIGATÓRIAS. A INÉRCIA OU AGRAVAMENTO DO RISCO PODERÁ ENSEJAR A EMISSÃO DE AUTO DE INTERDIÇÃO E MEDIDAS ADMINISTRATIVAS CABÍVEIS, ALÉM DA RESPONSABILIDADE CIVIL POR EVENTUAIS DANOS.
                                </p>
                            </div>
                        </div>

                        {/* 8. ASSINATURAS */}
                        <div className="mt-auto pb-4">
                            <h3 className="text-[11px] font-bold text-[#122848] uppercase mb-6 text-center">8. ASSINATURAS E TERMO DE CIÊNCIA</h3>
                            <p className="text-[10px] text-center mb-8 uppercase font-bold text-slate-700">DECLARO ESTAR CIENTE DO CONTEÚDO DESTA NOTIFICAÇÃO E DAS MEDIDAS RECOMENDADAS.</p>
                            
                            {noprer.recusou_assinatura ? (
                                <div className="space-y-4">
                                    <div className="text-center text-[10px] font-black border border-red-500 bg-red-50 text-red-700 p-2 mb-6 rounded-sm">
                                        O(A) NOTIFICADO(A) RECUSOU-SE A ASSINAR ESTE DOCUMENTO.
                                    </div>
                                    <div className="flex justify-between px-10 gap-8">
                                        <div className="flex-1 text-center border-t border-slate-400 pt-1.5">
                                            <p className="font-bold text-[10px] uppercase text-slate-800">T1: {noprer.testemunhas?.t1 || 'NOME DA TESTEMUNHA 1'}</p>
                                            <p className="text-[9px] text-slate-600">{noprer.testemunhas?.doc1 || 'DOCUMENTO'}</p>
                                        </div>
                                        <div className="flex-1 text-center border-t border-slate-400 pt-1.5">
                                            <p className="font-bold text-[10px] uppercase text-slate-800">T2: {noprer.testemunhas?.t2 || 'NOME DA TESTEMUNHA 2'}</p>
                                            <p className="text-[9px] text-slate-600">{noprer.testemunhas?.doc2 || 'DOCUMENTO'}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between px-10 gap-8">
                                    <div className="flex-1 text-center relative border-t border-slate-400 pt-1.5">
                                        {noprer.assinatura && (
                                            <img src={noprer.assinatura} alt="Assinatura Solicitante" className="absolute bottom-full left-1/2 -translate-x-1/2 h-16 object-contain" />
                                        )}
                                        <p className="font-bold text-[10px] uppercase text-slate-800">{noprer.solicitante}</p>
                                        <p className="text-[9px] text-slate-600">RESPONSÁVEL / SOLICITANTE</p>
                                    </div>
                                    <div className="flex-1 text-center border-t border-slate-400 pt-1.5">
                                        <p className="font-bold text-[10px] uppercase text-slate-800">{noprer.criado_por}</p>
                                        <p className="text-[9px] text-slate-600">AGENTE DE DEFESA CIVIL</p>
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
