import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { FileText, Printer, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const TelaImpressao = () => {
    const { id } = useParams();
    const [noprer, setNoprer] = useState(null);

    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.1));
    const handleResetZoom = () => setZoom(1.0);

    useEffect(() => {
        const fetchDados = async () => {
            try {
                const { data, error } = await supabase
                    .from('noprer')
                    .select('*, vistoria:vistoria_id(vistoria_id)')
                    .eq('id', id)
                    .single();

                if (error) {
                    console.error('Erro supabase:', error);
                    return;
                }

                setNoprer(data);
            } catch (err) {
                console.error('Erro na impressão:', err);
            }
        };
        fetchDados();
    }, [id]);

    if (!noprer) return <div className="flex items-center justify-center min-h-screen">Carregando dados para impressão...</div>;

    const formatDate = (d) => {
        if (!d) return '---';
        const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
        return isNaN(date.getTime()) ? d : date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex justify-center report-root-wrapper font-[Inter,sans-serif]">
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --navy:   #0B1F3A;
                    --navy2:  #122848;
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
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4 portrait; margin: 15mm; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .report-root-wrapper {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background-color: white !important;
                    }
                    .print-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                        display: block !important;
                    }
                }
            `}} />

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <FileText size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">NOPRER</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Painel de Impressão Oficial</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-white/10 rounded-xl p-1.5 hidden md:flex">
                    <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-all text-slate-300 hover:text-white" title="Diminuir Zoom"><ZoomOut size={16} /></button>
                    <button onClick={handleResetZoom} className="h-8 px-3 rounded-lg hover:bg-white flex items-center justify-center gap-1 transition-all text-xs font-bold text-slate-300 hover:text-white" title="Restaurar Zoom"><RotateCcw size={12} /> {Math.round(zoom * 100)}%</button>
                    <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center transition-all text-slate-300 hover:text-white" title="Aumentar Zoom"><ZoomIn size={16} /></button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white rounded-xl transition-all text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <X size={16} /> Fechar
                    </button>
                    <button onClick={() => window.print()} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                        <Printer size={16} /> Imprimir NOPRER
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-24 print:pt-0 w-full print-preview-wrapper" style={{ '--report-zoom': zoom }}>
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-10 md:p-12 print:p-0 mb-10 print:mb-0 relative print-container flex flex-col">

                    {/* Cabeçalho */}
                    <div className="flex justify-between items-center border-b-4 border-red-700 pb-4 mb-6">
                        <div className="w-[100px] flex items-center justify-center">
                            <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="h-[85px] w-auto object-contain" />
                        </div>
                        <div className="text-center flex-1 px-4">
                            <h1 className="text-xl font-black uppercase m-0 leading-tight">Prefeitura Municipal de<br />Santa Maria de Jetibá</h1>
                            <h2 className="text-sm font-bold uppercase mt-1">Coordenadoria Municipal de Proteção e Defesa Civil</h2>
                        </div>
                        <img src={LOGO_SIGERD} alt="SIGERD" className="h-20 object-contain" />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-xl font-black text-red-700 uppercase tracking-widest">Notificação Preliminar de Risco - NOPRER</h1>
                    </div>

                    {/* 1. Identificação */}
                    <div className="mb-6">
                        <div className="border-l-4 border-red-700 pl-3 mb-3">
                            <h3 className="font-black text-red-900 uppercase text-sm tracking-wide">1. Identificação do Documento</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Número NOPRER</span>
                                <span className="block text-sm font-bold">{noprer.numero ? noprer.numero.replace(/NOPRER-(\d{4})\.(\d+)/, 'NOPRER - $2/$1') : '---'}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Data de Emissão</span>
                                <span className="block text-sm font-bold">{formatDate(noprer.data_emissao)}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Vistoria Vinculada</span>
                                <span className="block text-sm font-bold">{noprer.vistoria_id ? 'Sim' : 'Sem vínculo'}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Agente Emissor</span>
                                <span className="block text-sm font-bold">{noprer.nome_agente}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Notificado */}
                    <div className="mb-6">
                        <div className="border-l-4 border-red-700 pl-3 mb-3">
                            <h3 className="font-black text-red-900 uppercase text-sm tracking-wide">2. Identificação do Notificado</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            <div className="col-span-2 border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Nome do Notificado</span>
                                <span className="block text-sm font-bold">{noprer.nome_notificado}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">CPF / CNPJ</span>
                                <span className="block text-sm font-bold">{noprer.cpf_notificado}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Contato</span>
                                <span className="block text-sm font-bold">{noprer.contato || '---'}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Condição</span>
                                <span className="block text-sm font-bold">{noprer.condicao}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Tipo de Ocupação</span>
                                <span className="block text-sm font-bold">{noprer.tipo_ocupacao || '---'}</span>
                            </div>
                            <div className="col-span-2 border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Endereço</span>
                                <span className="block text-sm font-bold">{noprer.endereco}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Diagnóstico */}
                    <div className="mb-6 avoid-break">
                        <div className="border-l-4 border-red-700 pl-3 mb-3">
                            <h3 className="font-black text-red-900 uppercase text-sm tracking-wide">3. Diagnóstico do Risco</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Tipo de Risco</span>
                                <span className="block text-sm font-bold">{noprer.tipo_risco}</span>
                            </div>
                            <div className="border-b border-gray-100 pb-1">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase">Grau de Risco</span>
                                <span className="block text-sm font-bold">{noprer.grau_risco}</span>
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <span className="block text-[10px] font-black text-red-800 uppercase mb-2">Descrição do Risco</span>
                            <p className="text-sm font-semibold text-red-900 leading-relaxed m-0">{noprer.descricao_risco}</p>
                        </div>
                    </div>

                    {/* 4. Medidas */}
                    <div className="mb-6 avoid-break">
                        <div className="border-l-4 border-red-700 pl-3 mb-3">
                            <h3 className="font-black text-red-900 uppercase text-sm tracking-wide">4. Medidas Preventivas / Mitigadoras Estipuladas</h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
                            <span className="block text-[10px] font-black text-slate-500 uppercase mb-3">Providências a serem adotadas pelo notificado</span>
                            <ul className="space-y-2 m-0 pl-0 list-none">
                                {(noprer.medidas || []).map((m, i) => (
                                    <li key={i} className="flex gap-2 items-start bg-white p-2 rounded border border-slate-100 shadow-sm">
                                        <span className="font-black text-red-700">➜</span>
                                        <span className="text-sm font-bold text-slate-700">{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                                <span className="block text-[10px] font-black text-amber-800 uppercase mb-1">Prazo para Regularização</span>
                                <span className="block text-lg font-black text-amber-900">Até {formatDate(noprer.data_limite)}</span>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                                <span className="block text-[10px] font-black text-blue-800 uppercase mb-1">Data Prevista para Revistoria</span>
                                <span className="block text-lg font-black text-blue-900">{formatDate(noprer.data_revistoria)}</span>
                            </div>
                        </div>
                    </div>

                    
                        {/* Referências Técnicas */}
                        {(data.referencias_normativas && data.referencias_normativas.length > 0) && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">Referências Técnicas e Jurídicas</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    {Object.entries(
                                        data.referencias_normativas.reduce((acc, ref) => {
                                            const cat = ref.categoria || 'Normas e Manuais';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(ref);
                                            return acc;
                                        }, {})
                                    ).map(([cat, refs]) => (
                                        <div key={cat} className="mb-4 last:mb-0 avoid-break">
                                            <div className="text-[10px] font-extrabold text-indigo-900 uppercase mb-2 pb-1 border-b border-slate-300">{cat}</div>
                                            <div className="flex flex-col gap-2">
                                                {refs.map((ref, idx) => (
                                                    <div key={idx} className="flex flex-col text-[11px] text-slate-700">
                                                        <div className="font-bold flex items-center gap-1.5 text-slate-800">
                                                            <span className="text-slate-400">❖</span>
                                                            {ref.numero}
                                                            {ref.ano && `/${ref.ano}`}
                                                            {ref.ambito && <span className="text-[8px] font-bold bg-slate-200 text-slate-600 px-1 py-0.5 rounded">{ref.ambito}</span>}
                                                        </div>
                                                        {(ref.ementa || ref.descricao_uso) && (
                                                            <div className="ml-4 mt-0.5 text-slate-600 italic">
                                                                {ref.ementa || ref.descricao_uso}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

{/* Termo e Assinaturas */}
                    <div className="mt-8 p-6 border-2 border-slate-400 rounded-xl avoid-break">
                        <h3 className="text-center font-black uppercase text-sm mb-4">Termo de Responsabilidade e Ciência</h3>
                        <p className="text-xs text-justify leading-relaxed text-slate-700 mb-0">
                            O NOTIFICADO acima qualificado, declara ter recebido
                            formalmente as orientações técnicas exaradas pela Defesa Civil Municipal através deste documento (NOPRER).
                            Reconhece a condição de risco informada e concorda expressamente em cumprir as medidas preventivas e
                            mitigadoras indicadas no prazo assinalado, estando ciente de que o não cumprimento poderá resultar em
                            sanções administrativas e medidas coercitivas, bem como sua responsabilização em caso de agravamento da
                            situação que possa colocar em risco a vida ou o patrimônio de terceiros.
                        </p>
                    </div>

                    <div className="mt-12 bg-slate-50 p-8 border border-slate-200 rounded-xl avoid-break">
                        {noprer.modo_assinatura === 'recusa' ? (
                            <>
                                <div className="text-center text-red-700 font-black mb-8 text-sm">O NOTIFICADO SE RECUSOU A ASSINAR ESTE DOCUMENTO.</div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-center">
                                        <div className="h-16 flex items-end justify-center border-b border-slate-400 mb-2">
                                            {noprer.sign_test1 && <img src={noprer.sign_test1} alt="Testemunha 1" className="max-h-12" />}
                                        </div>
                                        <p className="font-bold text-sm m-0">Testemunha 1: {noprer.test1_nome}</p>
                                        <p className="text-xs text-slate-500 m-0">CPF: {noprer.test1_cpf}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-16 flex items-end justify-center border-b border-slate-400 mb-2">
                                            {noprer.sign_test2 && <img src={noprer.sign_test2} alt="Testemunha 2" className="max-h-12" />}
                                        </div>
                                        <p className="font-bold text-sm m-0">Testemunha 2: {noprer.test2_nome}</p>
                                        <p className="text-xs text-slate-500 m-0">CPF: {noprer.test2_cpf}</p>
                                    </div>
                                </div>
                            </>
                        ) : noprer.modo_assinatura === 'digital' ? (
                            <div className="text-center mb-8">
                                <div className="h-20 w-3/4 mx-auto flex items-end justify-center border-b border-slate-400 mb-2">
                                    {noprer.sign_notificado && <img src={noprer.sign_notificado} alt="Notificado" className="max-h-16" />}
                                </div>
                                <p className="font-bold text-sm m-0">{noprer.nome_notificado}</p>
                                <p className="text-xs text-slate-500 m-0">NOTIFICADO (Assinatura Digital)</p>
                            </div>
                        ) : (
                            <div className="text-center mb-8">
                                <div className="h-16 w-3/4 mx-auto border-b border-slate-400 mb-2"></div>
                                <p className="font-bold text-sm m-0">{noprer.nome_notificado}</p>
                                <p className="text-xs text-slate-500 m-0">NOTIFICADO (Assinatura Física Requerida)</p>
                            </div>
                        )}

                        <div className="text-center mt-12">
                            <div className="h-20 w-3/4 mx-auto flex items-end justify-center border-b-2 border-red-700 mb-2">
                                {noprer.sign_agente && <img src={noprer.sign_agente} alt="Agente" className="max-h-16" />}
                            </div>
                            <p className="font-black text-red-900 text-sm m-0 uppercase">{noprer.nome_agente}</p>
                            <p className="text-xs font-bold text-slate-600 m-0 uppercase">Agente de Defesa Civil</p>
                            {noprer.matricula_agente && <p className="text-[10px] text-slate-400 m-0">Matrícula: {noprer.matricula_agente}</p>}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TelaImpressao;
