import React, { useEffect, useState, useContext } from 'react';
import { Printer, X, Activity, ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, Clock, Wrench } from 'lucide-react';
import { UserContext } from '../../App';

const LOGO_DEFESA_CIVIL = '/logo_defesa_civil.png';
const LOGO_SIGERD = '/logo_sigerd.png';

const MciPrint = () => {
    const userProfile = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [zoom, setZoom] = useState(1.0);

    const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.1));
    const handleResetZoom = () => setZoom(1.0);

    useEffect(() => {
        const cachedData = sessionStorage.getItem('mciReportData');
        if (cachedData) {
            try {
                setReportData(JSON.parse(cachedData));
            } catch (e) {
                console.error("Erro ao carregar dados do relatório:", e);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (reportData) {
            const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_');
            document.title = `Relatório_MCI_${dateStr}`;
        }
    }, [reportData]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black text-slate-400 uppercase tracking-[2px] text-[10px]">Gerando Relatório...</p>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 p-10">
                <div className="text-center p-12 bg-white border border-slate-200 shadow-2xl border border-slate-100 max-w-lg">
                    <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Sessão Expirada</h2>
                    <p className="text-slate-500 mb-8 font-medium">Por favor, gere o relatório novamente no Dashboard do MCI.</p>
                    <button 
                        onClick={() => window.close()}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    const { recursos, stats, filters, isCOMPDEC, userSecretaria } = reportData;
    const emitidoPor = userProfile?.full_name || 'Defesa Civil SMJ';
    const matricula = userProfile?.matricula || '---';
    const dataEmissao = new Date().toLocaleString('pt-BR');

    // Stats formatting
    const totalRecursos = recursos.length;
    const available = recursos.filter(r => r.status === 'DISPONIVEL').length;
    const inUse = recursos.filter(r => r.status === 'EM_USO' || r.status === 'OCUPADO').length;
    const maintenance = recursos.filter(r => r.status === 'EM_MANUTENCAO' || r.status === 'EM_REFORMA').length;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'DISPONIVEL': return { color: '#1A7A48', bg: '#EAF7EF', label: 'Disponível' }; // var(--green)
            case 'EM_USO':
            case 'OCUPADO': return { color: '#1A6FBF', bg: '#E8F1FA', label: status === 'EM_USO' ? 'Em Uso' : 'Ocupado' }; // var(--blue)
            case 'EM_MANUTENCAO':
            case 'EM_REFORMA': return { color: '#D48A0C', bg: '#FFF5E5', label: status === 'EM_MANUTENCAO' ? 'Manutenção' : 'Reforma' }; // var(--amber)
            default: return { color: '#4A5568', bg: '#F4F6F9', label: status };
        }
    };

    return (
        <div className="bg-[#f1f5f9] min-h-screen text-slate-800 print:bg-white print:p-0 p-8 flex flex-col items-center">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
                
                :root {
                    --navy:   #0B1F3A;
                    --blue:   #1A6FBF;
                    --blue2:  #2484D9;
                    --ice:    #E8F1FA;
                    --ice2:   #D4E5F5;
                    --amber:  #D48A0C;
                    --red:    #B83232;
                    --green:  #1A7A48;
                    --gray1:  #F4F6F9;
                    --gray2:  #E8ECF2;
                    --gray3:  #C8D0DC;
                    --text:   #1A2332;
                    --text2:  #4A5568;
                    --text3:  #718096;
                    --white:  #FFFFFF;
                    --border: #C8D0DC;
                }

                .print-container * {
                    font-family: 'IBM Plex Sans', sans-serif;
                    box-sizing: border-box;
                }

                .section-title-new {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--navy);
                    border-bottom: 2px solid var(--navy);
                    padding-bottom: 4px;
                    margin-top: 24px;
                    margin-bottom: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }

                .print-container {
                    zoom: var(--report-zoom, 1.0);
                    padding: 40px 48px;
                }
                
                @media screen and (max-width: 1024px) {
                    .print-preview-wrapper { overflow-x: auto; padding: 20px; display: flex; justify-content: flex-start; align-items: flex-start; width: 100%; }
                    .print-container { min-width: 210mm; }
                }
                
                @media print {
                    @page { margin: 15mm 15mm; size: A4; }
                    html, body {
                        height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                    .avoid-break { break-inside: avoid !important; page-break-inside: avoid !important; }
                    .print-container { 
                        width: 100% !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        transform: none !important; 
                        border-radius: 0 !important;
                        border: none !important;
                        zoom: 1 !important;
                    }
                }
            `}</style>

            {/* Options Bar */}
            <div className="no-print fixed top-0 left-0 right-0 w-full bg-slate-900 border-b border-white/10 z-[9999] px-6 py-3 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <Activity className="text-blue-400" size={18} />
                    <div>
                        <h1 className="font-black text-[11px] uppercase tracking-wider leading-none mb-1 text-white">Visualização do Relatório - MCI</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dataEmissao}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleZoomOut} 
                        className="h-8 w-8 hover:bg-white/10 rounded-lg transition-all text-white flex items-center justify-center disabled:opacity-40"
                        disabled={zoom <= 0.5}
                        title="Diminuir Zoom"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span 
                        className="text-[10px] font-black text-slate-300 uppercase tracking-wider px-2 cursor-pointer hover:text-white transition-colors min-w-[50px] text-center"
                        title="Restaurar Zoom (100%)"
                        onClick={handleResetZoom}
                    >
                        {Math.round(zoom * 100)}%
                    </span>
                    <button 
                        onClick={handleZoomIn} 
                        className="h-8 w-8 hover:bg-white/10 rounded-lg transition-all text-white flex items-center justify-center disabled:opacity-40"
                        disabled={zoom >= 1.5}
                        title="Aumentar Zoom"
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

            <main className="flex flex-col items-center pt-20 print:pt-0 w-full print-preview-wrapper transition-all">
                <div className="w-[210mm] bg-white shadow-2xl min-h-[297mm] mb-20 print:mb-0 relative print-container rounded-[8px] border border-slate-200 overflow-hidden flex flex-col justify-between" style={{ '--report-zoom': zoom }}>
                    
                    <div>
                        {/* CABEÇALHO */}
                        <header style={{ padding: '0 0 16px', borderBottom: '2px solid var(--navy)', background: 'var(--white)', color: 'var(--text)', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <img src={LOGO_DEFESA_CIVIL} alt="Defesa Civil" className="logo-dc" style={{ objectFit: 'contain', height: '68px', width: '68px' }} />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, padding: '0 16px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text2)' }}>Prefeitura Municipal de Santa Maria de Jetibá</span>
                                    <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--navy)' }}>Coordenadoria Municipal de Proteção e Defesa Civil</span>
                                </div>

                                <img src={LOGO_SIGERD} alt="SIGERD" className="sigerd-logo" style={{ objectFit: 'contain', height: '60px', maxWidth: '100px' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--blue)' }}>MCI - CAPACIDADE INSTALADA</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text2)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    <span>EMISSÃO:</span>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text)' }}>
                                        {dataEmissao}
                                    </span>
                                </div>
                            </div>
                        </header>

                        {/* 1. IDENTIFICAÇÃO E STATUS */}
                        <div className="avoid-break">
                            <div className="section-title-new">1. Informações da Emissão</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid var(--border)' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '20%', background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>EMITIDO POR</td>
                                        <td style={{ width: '30%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                            <div>{emitidoPor}</div>
                                        </td>
                                        <td style={{ width: '20%', background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>MATRÍCULA</td>
                                        <td style={{ width: '30%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>
                                            <div>{matricula}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ background: 'var(--gray1)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>ESCOPO DE VISÃO</td>
                                        <td colSpan="3" style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px', fontWeight: 'bold' }}>
                                            <div>{isCOMPDEC ? 'MUNICIPAL (Geral / Consolidado)' : `SETORIAL (${userSecretaria})`}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 2. FILTROS APLICADOS */}
                        <div className="avoid-break">
                            <div className="section-title-new">2. Filtros de Pesquisa Aplicados</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid var(--border)' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '25%', background: 'var(--ice2)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>CATEGORIA</td>
                                        <td style={{ width: '25%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>{filters.categoria}</td>
                                        <td style={{ width: '25%', background: 'var(--ice2)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>STATUS</td>
                                        <td style={{ width: '25%', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>{filters.status}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ background: 'var(--ice2)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>SECRETARIA RESPONSÁVEL</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>{filters.secretaria}</td>
                                        <td style={{ background: 'var(--ice2)', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>EXIBIR</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>{filters.onlyAvailable ? 'Apenas Disponíveis' : 'Todos'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 3. RESUMO CONSOLIDADO */}
                        <div className="avoid-break">
                            <div className="section-title-new">3. Resumo Consolidado</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ background: 'var(--gray2)' }}>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>TOTAL LISTADO</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>DISPONÍVEL</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>EM USO / OCUPADO</th>
                                        <th style={{ width: '20%', fontWeight: 'bold', color: 'var(--navy)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: '10px' }}>MANUTENÇÃO / REFORMA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold' }}>{totalRecursos}</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold', color: 'var(--green)' }}>{available}</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold', color: 'var(--blue)' }}>{inUse}</td>
                                        <td style={{ border: '1px solid var(--border)', padding: '6px 10px', fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 'bold', color: 'var(--amber)' }}>{maintenance}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 4. LISTAGEM DE RECURSOS */}
                        <div className="section-title-new">4. Inventário Detalhado ({totalRecursos})</div>
                        {recursos.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)' }}>
                                <thead>
                                    <tr style={{ background: 'var(--navy)', color: 'white' }}>
                                        <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 'bold', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>RECURSO</th>
                                        <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 'bold', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>CATEGORIA / DETALHES</th>
                                        <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 'bold', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.2)' }}>SECRETARIA RESPONSÁVEL</th>
                                        <th style={{ padding: '8px 10px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recursos.map((r, i) => {
                                        const statusObj = getStatusStyle(r.status);
                                        return (
                                            <tr key={i} className="avoid-break" style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : 'var(--gray1)' }}>
                                                <td style={{ padding: '8px 10px', fontSize: '10px', verticalAlign: 'top', borderRight: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{r.nome}</div>
                                                    {r.detalhes?.placa && <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>Placa: {r.detalhes.placa}</div>}
                                                    {r.detalhes?.patrimonio && <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>Patrimônio: {r.detalhes.patrimonio}</div>}
                                                </td>
                                                <td style={{ padding: '8px 10px', fontSize: '9px', verticalAlign: 'top', borderRight: '1px solid var(--border)' }}>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--blue)' }}>{r.categoria}</div>
                                                    {r.detalhes?.tipo && <div>Tipo: {r.detalhes.tipo}</div>}
                                                    {r.detalhes?.capacidade && <div>Capac.: {r.detalhes.capacidade}</div>}
                                                    {r.detalhes?.descricao && <div>{r.detalhes.descricao}</div>}
                                                </td>
                                                <td style={{ padding: '8px 10px', fontSize: '9px', verticalAlign: 'top', borderRight: '1px solid var(--border)', color: 'var(--text2)' }}>
                                                    {r.secretaria_id}
                                                </td>
                                                <td style={{ padding: '8px 10px', fontSize: '9px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        backgroundColor: statusObj.bg, 
                                                        color: statusObj.color, 
                                                        padding: '3px 6px', 
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold',
                                                        display: 'inline-block'
                                                    }}>
                                                        {statusObj.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic', border: '1px dashed var(--border)' }}>
                                Nenhum recurso encontrado com os filtros aplicados.
                            </div>
                        )}
                    </div>

                    <footer className="mt-8" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', fontSize: '9px', color: 'var(--text3)', textAlign: 'center' }}>
                        Documento gerado automaticamente pelo Sistema de Gerenciamento de Desastres (SIGERD) - Defesa Civil de Santa Maria de Jetibá - ES.<br/>
                        Emissão: {dataEmissao} - {userProfile?.full_name}
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default MciPrint;
