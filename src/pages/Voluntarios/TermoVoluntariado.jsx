import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Download, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { getVoluntarioById } from '../../services/voluntariosService';
import { useToast } from '../../components/ToastNotification';
import SignaturePadComp from '../../components/SignaturePad';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';

const TermoVoluntariado = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [voluntario, setVoluntario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assinatura, setAssinatura] = useState(null);
    const [showPad, setShowPad] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const data = await getVoluntarioById(id);
            setVoluntario(data);
            if (data.assinatura_termo) {
                setAssinatura(data.assinatura_termo);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados do voluntário.');
            navigate('/voluntarios/lista');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAssinatura = async (dataUrl) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('voluntarios')
                .update({ 
                    assinatura_termo: dataUrl,
                    data_assinatura_termo: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setAssinatura(dataUrl);
            setShowPad(false);
            toast.success('Termo assinado com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar assinatura.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!voluntario) return null;

    return (
        <div className="bg-slate-100 min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex justify-center report-root-wrapper">
            <style>{`
                :root {
                    --navy:   #0B1F3A;
                    --navy2:  #122848;
                    --blue:   #1A6FBF;
                    --text-color: #1e293b;
                }
                
                @media screen {
                    .print-container {
                        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                        transform-origin: top center;
                    }
                }

                @media print {
                    @page {
                        margin-top: 15mm;
                        margin-bottom: 15mm;
                        margin-left: 15mm;
                        margin-right: 15mm;
                        size: A4;
                    }
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
                    }
                    .no-print { display: none !important; }
                    .print-container {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        transform: none !important;
                    }
                }
            `}</style>

            {/* BARRA DE OPÇÕES SUPERIOR (FIXA) */}
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-[#0B1F3A]/95 backdrop-blur-md border-b border-white/10 z-[9999] flex items-center justify-between px-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <FileText size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Termo de Voluntariado</h1>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{voluntario.nome_completo}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => window.close()} className="h-10 px-5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <X size={16} /> Fechar
                    </button>
                    <button onClick={handlePrint} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
                        <Download size={16} /> Imprimir / PDF
                    </button>
                </div>
            </div>

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper">
                <div className="w-[210mm] bg-white print:shadow-none shadow-2xl min-h-[297mm] p-12 md:p-16 print:p-0 mb-10 print:mb-0 relative print-container flex flex-col">
                    
                    <div className="relative flex-grow">
                        {/* Header Oficial */}
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
                                    <img src={LOGO_SIGERD} alt="Defesa Civil Nacional" className="h-[85px] w-auto object-contain" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-[#2a5299] uppercase tracking-wide text-center mt-2">Termo de Adesão ao Serviço Voluntário</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Lei Federal nº 9.608/1998</p>
                        </header>

                        {/* Corpo do Termo */}
                        <div className="space-y-6 text-[13px] text-slate-800 leading-relaxed text-justify px-4">
                            <p>
                                Pelo presente instrumento, a <strong>Prefeitura Municipal de Santa Maria de Jetibá</strong>, através da <strong>Coordenadoria Municipal de Proteção e Defesa Civil (COMPDEC)</strong>, doravante denominada <strong>ENTIDADE</strong>, e o(a) Sr(a). <strong>{voluntario.nome_completo}</strong>, brasileiro(a), portador(a) do CPF nº <strong>{voluntario.cpf || 'Não informado'}</strong>{voluntario.data_nascimento && <>, nascido(a) em <strong>{new Date(voluntario.data_nascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</strong></>}, residente e domiciliado(a) no endereço <strong>{voluntario.endereco || 'Não informado'}</strong>, bairro <strong>{voluntario.bairro || 'Não informado'}</strong>, telefone de contato <strong>{voluntario.telefone || 'Não informado'}</strong>{voluntario.contato_emergencia && <>, contato de emergência: <strong>{voluntario.contato_emergencia}</strong></>}, doravante denominado(a) <strong>VOLUNTÁRIO(A)</strong>, celebram o presente TERMO DE ADESÃO AO SERVIÇO VOLUNTÁRIO, conforme as cláusulas e condições seguintes:
                            </p>

                            <div className="space-y-4 pl-4 text-[13px]">
                                <p>
                                    <strong>CLÁUSULA PRIMEIRA:</strong> O(a) VOLUNTÁRIO(A) prestará serviços voluntários não remunerados à ENTIDADE, em atividades de Proteção e Defesa Civil, ações humanitárias e resposta a desastres, de acordo com a Lei Federal nº 9.608/1998.
                                </p>
                                
                                <p>
                                    <strong>CLÁUSULA SEGUNDA:</strong> O serviço voluntário não gera vínculo empregatício, nem obrigação de natureza trabalhista, previdenciária ou afim, sendo prestado de forma espontânea, por tempo indeterminado e sem qualquer remuneração.
                                </p>

                                <p>
                                    <strong>CLÁUSULA TERCEIRA:</strong> O(a) VOLUNTÁRIO(A) compromete-se a cumprir as normas internas da ENTIDADE, zelando pelos equipamentos, materiais e infraestrutura disponibilizados para a execução das atividades, bem como a manter sigilo sobre informações sensíveis a que tiver acesso.
                                </p>

                                <p>
                                    <strong>CLÁUSULA QUARTA:</strong> Este termo poderá ser rescindido a qualquer tempo, por qualquer uma das partes, mediante comunicação prévia, sem que isso implique qualquer tipo de ônus ou penalidade.
                                </p>
                            </div>

                            <p className="mt-12 text-center pt-8 text-[14px]">
                                Santa Maria de Jetibá - ES, {new Date(voluntario.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                            </p>
                        </div>

                        {/* Assinaturas */}
                        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-16 sm:gap-12 px-8">
                            
                            {/* Assinatura Voluntário */}
                            <div className="flex flex-col items-center">
                                <div className="h-24 w-full flex items-end justify-center mb-2 relative group">
                                    {assinatura ? (
                                        <>
                                            <img src={assinatura} alt="Assinatura do Voluntário" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                            <button 
                                                onClick={() => setShowPad(true)}
                                                className="no-print absolute -right-4 top-0 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Refazer assinatura"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setShowPad(true)}
                                            className="no-print w-full h-full border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit2 size={20} className="mb-2" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Tocar para Assinar</span>
                                        </button>
                                    )}
                                    {!assinatura && <div className="print:block hidden border-b border-black w-full h-full"></div>}
                                </div>
                                <div className="w-full border-t border-slate-400"></div>
                                <p className="mt-2 text-xs font-bold text-slate-900 uppercase">{voluntario.nome_completo}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Voluntário(a)</p>
                            </div>

                            {/* Assinatura COMPDEC */}
                            <div className="flex flex-col items-center">
                                <div className="h-24 w-full flex items-end justify-center mb-2">
                                    {/* Espaço vazio para assinatura física da COMPDEC */}
                                </div>
                                <div className="w-full border-t border-slate-400"></div>
                                <p className="mt-2 text-xs font-bold text-slate-900 uppercase">COMPDEC</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Defesa Civil Municipal</p>
                            </div>

                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Assinatura */}
            {showPad && (
                <div className="no-print">
                    <SignaturePadComp 
                        title="Assinatura do Voluntário"
                        onSave={handleSaveAssinatura}
                        onCancel={() => setShowPad(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default TermoVoluntariado;
