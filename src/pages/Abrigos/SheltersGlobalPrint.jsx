import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getShelters, getOccupants, getDonations, getInventory, getShelterTransfers } from '../../services/shelterDb';
import { operacoesService } from '../../services/operacoesService';
import PrintLayout from '../../components/PrintLayout';

const SheltersGlobalPrint = () => {
    const [searchParams] = useSearchParams();
    const operacaoId = searchParams.get('operacao_id');

    const [data, setData] = useState({
        sheltersData: [],
        operation: null,
        allOperacoesMap: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let operation = null;
                const operacoes = await operacoesService.getAllOperacoes();
                const allOperacoesMap = operacoes.reduce((acc, op) => {
                    acc[op.id] = op.nome;
                    return acc;
                }, {});

                if (operacaoId && operacaoId !== 'all') {
                    operation = operacoes.find(op => String(op.id) === String(operacaoId));
                }

                const filterByOperation = (items) => {
                    if (!operacaoId || operacaoId === 'all') return items;
                    return items.filter(item => String(item.operacao_id) === String(operacaoId));
                };

                const allShelters = await getShelters();
                // Filter shelters by operation if specified, AND only active ones
                const activeShelters = allShelters.filter(s => {
                    const isForOp = (!operacaoId || operacaoId === 'all') ? true : String(s.operacao_id) === String(operacaoId);
                    return isForOp && s.status !== 'deleted'; // Show active and full shelters
                });

                if (activeShelters.length === 0) {
                    setData({ sheltersData: [], operation });
                    setLoading(false);
                    return;
                }

                const allOccupants = await getOccupants();
                const allDonations = await getDonations();
                const allInventory = await getInventory();

                const sheltersData = await Promise.all(activeShelters.map(async (shelter) => {
                    const id = shelter.id;
                    const rawTransfers = await getShelterTransfers(id);

                    const shelterOccupants = allOccupants.filter(o => String(o.shelter_id) === String(shelter.shelter_id) || String(o.shelter_id) === String(id));
                    const activeOcc = filterByOperation(shelterOccupants).filter(o => o.status !== 'exited');
                    const exitedOcc = filterByOperation(shelterOccupants).filter(o => o.status === 'exited');

                    const shelterDonations = allDonations.filter(d => String(d.shelter_id) === String(shelter.shelter_id) || String(d.shelter_id) === String(id));
                    
                    const receivedTransfers = (rawTransfers.incoming || []).map(tr => ({
                        id: tr.id || tr.distribution_id,
                        item_description: tr.item_name,
                        quantity: tr.quantity,
                        unit: tr.unit,
                        donor_name: 'Transferência (MCI)',
                        donation_date: tr.distribution_date || tr.created_at,
                        operacao_id: tr.operacao_id
                    }));
                    const combinedDonations = [...shelterDonations, ...receivedTransfers].sort((a,b) => new Date(b.donation_date) - new Date(a.donation_date));
                    const filteredDonations = filterByOperation(combinedDonations);

                    const filteredDistributions = filterByOperation(rawTransfers.outgoing || []);

                    const shelterInventory = allInventory.filter(i => String(i.shelter_id) === String(shelter.shelter_id) || String(i.shelter_id) === String(id));
                    const filteredInventory = filterByOperation(shelterInventory);

                    return {
                        shelter,
                        activeOccupants: activeOcc,
                        exitedOccupants: exitedOcc,
                        donations: filteredDonations,
                        distributions: filteredDistributions,
                        inventory: filteredInventory
                    };
                }));

                setData({
                    sheltersData,
                    operation,
                    allOperacoesMap
                });

                document.title = `Relatório Geral de Abrigos${operation ? ` - ${operation.nome}` : ''}`;
            } catch (error) {
                console.error('Error generating global shelters report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [operacaoId]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando relatório geral...</div>;

    const { sheltersData, operation, allOperacoesMap } = data;

    const getOpName = (opId) => allOperacoesMap[opId] || 'Operação Desconhecida';

    const formatDateOnly = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if (sheltersData.length === 0) {
        return (
            <PrintLayout documentTitle="Relatório Geral de Abrigos" reportTitle="Relatório Geral de Abrigos" isLoading={false}>
                <div className="text-center p-12 text-slate-500">Nenhum abrigo encontrado para esta operação.</div>
            </PrintLayout>
        );
    }

    return (
        <PrintLayout
            documentTitle={`Relatório Geral de Abrigos${operation ? ` - ${operation.nome}` : ''}`}
            reportTitle="Relatório Geral e Detalhado de Abrigos"
            subtitle={
                <>
                    {operation ? <span>Operação: {operation.nome}</span> : <span>Todas as Operações</span>}
                    <span>•</span>
                    <span>Emissão: {new Date().toLocaleString('pt-BR')}</span>
                </>
            }
            isLoading={loading}
        >
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded text-center avoid-break">
                <h2 className="text-lg font-black text-slate-800 uppercase">Resumo da Operação</h2>
                <div className="flex justify-center gap-8 mt-2">
                    <div><span className="text-sm font-bold text-slate-500">Total de Abrigos:</span> <span className="text-lg font-black text-slate-800">{sheltersData.length}</span></div>
                    <div><span className="text-sm font-bold text-slate-500">Total de Abrigados Ativos:</span> <span className="text-lg font-black text-slate-800">{sheltersData.reduce((acc, curr) => acc + curr.activeOccupants.length, 0)}</span></div>
                </div>
            </div>

            {sheltersData.map((dataObj, index) => {
                const { shelter, activeOccupants, exitedOccupants, donations, distributions, inventory } = dataObj;
                
                const families = activeOccupants.reduce((acc, occ) => {
                    const group = occ.family_group || 'Sem Grupo';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(occ);
                    return acc;
                }, {});

                return (
                    <div key={shelter.id} className="mb-12" style={{ pageBreakBefore: index > 0 ? 'always' : 'auto' }}>
                        <div className="bg-blue-900 text-white p-3 rounded mb-4 font-black uppercase flex justify-between items-center">
                            <span>ABRIGO: {shelter.name}</span>
                            <span className="text-xs bg-white text-blue-900 px-2 py-1 rounded">
                                {shelter.status === 'active' ? 'ATIVO' : shelter.status === 'full' ? 'LOTADO' : 'INATIVO'}
                            </span>
                        </div>

                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">1. Informações do Abrigo</span>
                                <div className="section-header-line"></div>
                            </div>
                            <table className="report-table">
                                <tbody>
                                    <tr>
                                        <th style={{ width: '40%' }}>Endereço / Bairro</th>
                                        <th style={{ width: '30%' }}>Responsável</th>
                                        <th style={{ width: '30%' }}>Telefone</th>
                                    </tr>
                                    <tr>
                                        <td>{shelter.address || '---'} {shelter.bairro ? `- ${shelter.bairro}` : ''}</td>
                                        <td>{shelter.responsible_name || shelter.contact_name || '---'}</td>
                                        <td>{shelter.responsible_phone || shelter.contact_phone || '---'}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                                    <div className="text-2xl font-black text-slate-800">{activeOccupants.length} / {shelter.capacity}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Ocupação / Vagas</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                                    <div className="text-2xl font-black text-slate-800">{Object.keys(families).length}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Grupos Familiares</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                                    <div className="text-2xl font-black text-slate-800">{exitedOccupants.length}</div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Saídas Registradas</div>
                                </div>
                            </div>
                        </section>

                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">2. Histórico de Pessoas Abrigadas (Ativos)</span>
                                <div className="section-header-line"></div>
                            </div>
                            {activeOccupants.length > 0 ? (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Nome Completo</th>
                                            <th style={{ width: '10%', textAlign: 'center' }}>Idade</th>
                                            <th style={{ width: '10%', textAlign: 'center' }}>Sexo</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Grupo Familiar</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Operação</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Data Entrada</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeOccupants.map(o => (
                                            <tr key={o.id}>
                                                <td>
                                                    {o.full_name}
                                                    {o.is_family_head && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold">Resp.</span>}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>{o.age || '---'}</td>
                                                <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>{o.gender || '---'}</td>
                                                <td style={{ textAlign: 'center' }}>{o.family_group || 'Sem Grupo'}</td>
                                                <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(o.operacao_id)}</span></td>
                                                <td style={{ textAlign: 'center' }}>{formatDateOnly(o.entry_date || o.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-slate-500 italic p-2 border border-slate-200 text-center">Nenhum ativo.</p>
                            )}
                        </section>

                        {exitedOccupants.length > 0 && (
                            <section className="mb-6 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">2.1. Pessoas que Saíram</span>
                                    <div className="section-header-line"></div>
                                </div>
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '30%' }}>Nome Completo</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Grupo Familiar</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Data Entrada</th>
                                            <th style={{ width: '15%', textAlign: 'center' }}>Data Saída</th>
                                            <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {exitedOccupants.map(o => (
                                            <tr key={o.id} style={{ opacity: 0.8 }}>
                                                <td>{o.full_name}</td>
                                                <td style={{ textAlign: 'center' }}>{o.family_group || 'Sem Grupo'}</td>
                                                <td style={{ textAlign: 'center' }}>{formatDateOnly(o.entry_date || o.created_at)}</td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{formatDateOnly(o.exit_date)}</td>
                                                <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(o.operacao_id)}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        )}

                        <section className="mb-6 avoid-break">
                            <div className="section-header">
                                <span className="section-header-title">3. Estoque Atual</span>
                                <div className="section-header-line"></div>
                            </div>
                            {inventory.length > 0 ? (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '50%' }}>Item</th>
                                            <th style={{ width: '30%', textAlign: 'center' }}>Categoria</th>
                                            <th style={{ width: '20%', textAlign: 'right' }}>Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.map(i => (
                                            <tr key={i.id}>
                                                <td>{i.item_name}</td>
                                                <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>{i.category || '---'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{i.quantity} {i.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-slate-500 italic p-2 border border-slate-200 text-center">Estoque vazio.</p>
                            )}
                        </section>

                        <div className="flex gap-4">
                            <div className="flex-1 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">4. Doações/Entradas (Todas)</span>
                                    <div className="section-header-line"></div>
                                </div>
                                {donations.length > 0 ? (
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '20%' }}>Data</th>
                                                <th style={{ width: '40%' }}>Item</th>
                                                <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
                                                <th style={{ width: '20%', textAlign: 'right' }}>Qtd</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {donations.map(d => (
                                                <tr key={d.id}>
                                                    <td>{formatDateOnly(d.donation_date)}</td>
                                                    <td>{d.item_description} <br/><span className="text-[9px] text-slate-400">Origem: {d.donor_name || 'Anônimo'}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(d.operacao_id)}</span></td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-2 border border-slate-200 text-center">Nenhuma entrada.</p>
                                )}
                            </div>
                            
                            <div className="flex-1 avoid-break">
                                <div className="section-header">
                                    <span className="section-header-title">5. Distribuições/Saídas (Todas)</span>
                                    <div className="section-header-line"></div>
                                </div>
                                {distributions.length > 0 ? (
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '20%' }}>Data</th>
                                                <th style={{ width: '40%' }}>Item</th>
                                                <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
                                                <th style={{ width: '20%', textAlign: 'right' }}>Qtd</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {distributions.map(d => (
                                                <tr key={d.id}>
                                                    <td>{formatDateOnly(d.distribution_date || d.created_at)}</td>
                                                    <td>{d.item_name} <br/><span className="text-[9px] text-slate-400">Destino: {d.recipient_name}</span></td>
                                                    <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(d.operacao_id)}</span></td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-slate-500 italic p-2 border border-slate-200 text-center">Nenhuma saída.</p>
                                )}
                            </div>
                        </div>

                    </div>
                );
            })}

        </PrintLayout>
    );
};

export default SheltersGlobalPrint;
