import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { LOGO_DEFESA_CIVIL, LOGO_SIGERD } from '../../utils/reportLogos';
import { operacoesService } from '../../services/operacoesService';
import { getGlobalInventory, getDonations, getDistributions, getShelters } from '../../services/shelterDb';
import PrintLayout from '../../components/PrintLayout';
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';

const OperacaoPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [logistics, setLogistics] = useState({ estoque: [], doacoes: [], distribuicoes: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch the main operation details
                const opData = await operacoesService.calcularResumoOperacional(id);
                if (opData) {
                    setData(opData);
                    document.title = `Relatório da Operação - ${opData.operacao?.nome || 'Geral'}`;
                    
                    // Fetch logistics data for the operation period
                    const startDate = new Date(opData.operacao.data_hora_inicio || opData.operacao.created_at).getTime();
                    const endDate = opData.operacao.data_hora_encerramento ? new Date(opData.operacao.data_hora_encerramento).getTime() : Date.now();
                    
                    const isWithinPeriod = (item) => {
                        const itemDate = new Date(item.created_at || item.updated_at).getTime();
                        return itemDate >= startDate && itemDate <= endDate;
                    };

                    const [allInv, allDoa, allDis, allAbr] = await Promise.all([
                        getGlobalInventory().catch(() => []),
                        getDonations().catch(() => []),
                        getDistributions().catch(() => []),
                        getShelters().catch(() => [])
                    ]);
                    
                    const estoque = (allInv || []).filter(i => String(i.operacao_id) === String(id) || isWithinPeriod(i));
                    const doacoes = (allDoa || []).filter(d => String(d.operacao_id) === String(id) || isWithinPeriod(d));
                    const distribuicoes = (allDis || []).filter(d => String(d.operacao_id) === String(id) || isWithinPeriod(d));
                    const abrigosLocal = (allAbr || []).filter(a => String(a.operacao_id) === String(id) || isWithinPeriod(a));
                    
                    // Se a API não retornou abrigos, usamos os locais
                    if (!opData.abrigos || opData.abrigos.length === 0) {
                        opData.abrigos = abrigosLocal;
                    }
                    
                    setLogistics({ estoque, doacoes, distribuicoes });
                }
            } catch (error) {
                console.error('Error fetching operation report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);



    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando Relatório...</div>;
    if (!data || !data.operacao) return <div className="flex items-center justify-center min-h-screen">Relatório não encontrado.</div>;

    const op = data.operacao;
    const abrigos = data.abrigos || [];
    const diario = data.diario || [];
    
    // Aggregating consumed logistics items
    const consumed = logistics.distribuicoes.reduce((acc, curr) => {
        const key = `${curr.item_name}-${curr.category}`;
        if (!acc[key]) {
            acc[key] = {
                item_name: curr.item_name,
                category: curr.category,
                quantity: 0,
                unit: curr.unit || 'un.'
            };
        }
        acc[key].quantity += Number(curr.quantity || 0);
        return acc;
    }, {});
    const consumedList = Object.values(consumed);

    const formatDateForHeader = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <PrintLayout 
            documentTitle={`Relatório da Operação - ${op.nome || 'Geral'}`}
            reportTitle="Relatório Final de Operação"
            subtitle={
                <>
                    <span>Status: {op.status === 'aberta' || op.status === 'em_andamento' ? 'EM ANDAMENTO' : 'ENCERRADA'}</span>
                    <span>•</span>
                    <span>Emissão: {formatDateForHeader(new Date().toISOString())}</span>
                </>
            }
            isLoading={loading}
        >

                        {/* 1. Dados da Operação */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">1. Dados da Operação</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <th style={{ width: '40%' }}>Nome da Operação</th>
                                        <th style={{ width: '30%' }}>Tipo de Evento</th>
                                        <th style={{ width: '30%' }}>Data de Início</th>
                                    </tr>
                                    <tr>
                                        <td>{op.nome || '---'}</td>
                                        <td>{op.tipo_desastre || 'Geral'}</td>
                                        <td>{formatDateOnly(op.data_hora_inicio || op.created_at)}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ width: '40%' }}>Nível (Cobrade)</th>
                                        <th style={{ width: '30%' }}>Status</th>
                                        <th style={{ width: '30%' }}>Data de Encerramento</th>
                                    </tr>
                                    <tr>
                                        <td>{op.cobrade || 'Não Informado'}</td>
                                        <td>{op.status === 'aberta' || op.status === 'em_andamento' ? 'Em Andamento' : 'Encerrada'}</td>
                                        <td>{op.data_hora_encerramento ? formatDateOnly(op.data_hora_encerramento) : '---'}</td>
                                    </tr>
                                    <tr>
                                        <th colSpan="3">Descrição / Contexto da Operação</th>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" style={{ fontWeight: 'normal', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                            {op.descricao || 'Sem descrição detalhada.'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 2. Resumo Logístico */}
                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">2. Resumo Logístico</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <th style={{ width: '33.33%' }}>Estoque (Registros Atrelados)</th>
                                        <th style={{ width: '33.33%' }}>Doações Recebidas (Qtd de Entradas)</th>
                                        <th style={{ width: '33.33%' }}>Saídas e Distribuições</th>
                                    </tr>
                                    <tr>
                                        <td className="text-center font-black text-blue-600" style={{ fontSize: '14px' }}>{logistics.estoque.length}</td>
                                        <td className="text-center font-black text-emerald-600" style={{ fontSize: '14px' }}>{logistics.doacoes.length}</td>
                                        <td className="text-center font-black text-amber-600" style={{ fontSize: '14px' }}>{logistics.distribuicoes.length}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {consumedList.length > 0 && (
                                <table className="report-table mt-2">
                                    <thead>
                                        <tr>
                                            <th colSpan="3">Material Consumido / Distribuído durante a Operação</th>
                                        </tr>
                                        <tr>
                                            <th className="row-header" style={{ width: '40%' }}>Item</th>
                                            <th className="row-header" style={{ width: '30%' }}>Categoria</th>
                                            <th className="row-header" style={{ width: '30%' }}>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consumedList.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.item_name}</td>
                                                <td>{item.category}</td>
                                                <td className="text-rose-600 font-black">{item.quantity} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        {/* 3. Abrigos Vinculados */}
                        {abrigos && abrigos.length > 0 && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">3. Abrigos Vinculados e Ativados</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Nome do Abrigo</th>
                                            <th style={{ width: '30%' }}>Endereço</th>
                                            <th style={{ width: '20%' }}>Capacidade</th>
                                            <th style={{ width: '20%' }}>Ocupação Reportada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {abrigos.map(a => (
                                            <tr key={a.id}>
                                                <td>{a.name}</td>
                                                <td>{a.address || '---'}</td>
                                                <td>{a.capacity} pessoas</td>
                                                <td>{a.current_occupancy || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        {/* 4. Diário Oficial da Operação */}
                        {diario && diario.length > 0 && (
                            <section className="mb-6">
                                <div className="section-header">
                                    <span className="section-header-title">Diário e Histórico de Acontecimentos</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <div className="space-y-3">
                                    {diario.map(d => (
                                        <div key={d.id} className="avoid-break bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 rounded-lg flex flex-col gap-1">
                                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{formatDateForHeader(d.created_at)}</span>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">{d.entry_type}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap">{d.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

        </PrintLayout>
    );
};

export default OperacaoPrint;
