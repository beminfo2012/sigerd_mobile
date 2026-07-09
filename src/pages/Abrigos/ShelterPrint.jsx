import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getShelterById, getOccupants, getDonations, getInventory, getShelterTransfers } from '../../services/shelterDb';
import { operacoesService } from '../../services/operacoesService';
import PrintLayout from '../../components/PrintLayout';

const ShelterPrint = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const operacaoId = searchParams.get('operacao_id');

    const [data, setData] = useState({
        shelter: null,
        occupants: [],
        donations: [],
        distributions: [],
        inventory: [],
        operation: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const s = await getShelterById(id);
                if (!s) {
                    setLoading(false);
                    return;
                }

                // Carrega operação se houver operacao_id
                let operation = null;
                if (operacaoId && operacaoId !== 'all') {
                    const operacoes = await operacoesService.getAllOperacoes();
                    operation = operacoes.find(op => String(op.id) === String(operacaoId));
                } else if (s.operacao_id) {
                    const operacoes = await operacoesService.getAllOperacoes();
                    operation = operacoes.find(op => String(op.id) === String(s.operacao_id));
                }

                const filterByOperation = (items) => {
                    if (!operacaoId || operacaoId === 'all') return items;
                    return items.filter(item => String(item.operacao_id) === String(operacaoId));
                };

                const rawOccupants = await getOccupants(id);
                const rawDonations = await getDonations(id);
                const rawTransfers = await getShelterTransfers(id);
                const rawInventory = await getInventory(id);

                const activeOccupants = filterByOperation(rawOccupants).filter(o => o.status !== 'exited');
                
                const receivedTransfers = (rawTransfers.incoming || []).map(tr => ({
                    id: tr.id || tr.distribution_id,
                    item_description: tr.item_name,
                    quantity: tr.quantity,
                    unit: tr.unit,
                    donor_name: 'Transferência (MCI)',
                    donation_date: tr.distribution_date || tr.created_at,
                    operacao_id: tr.operacao_id
                }));
                const allDonations = [...(rawDonations || []), ...receivedTransfers].sort((a,b) => new Date(b.donation_date) - new Date(a.donation_date));
                const filteredDonations = filterByOperation(allDonations);
                
                const filteredDistributions = filterByOperation(rawTransfers.outgoing || []);
                const filteredInventory = filterByOperation(rawInventory);

                setData({
                    shelter: s,
                    occupants: activeOccupants,
                    donations: filteredDonations,
                    distributions: filteredDistributions,
                    inventory: filteredInventory,
                    operation: operation
                });

                document.title = `Relatório do Abrigo - ${s.name}`;

            } catch (error) {
                console.error('Error generating shelter report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, operacaoId]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando visualização...</div>;
    if (!data.shelter) return <div className="flex items-center justify-center min-h-screen">Abrigo não encontrado.</div>;

    const { shelter, occupants, donations, distributions, inventory, operation } = data;

    const formatDateOnly = (dateString) => {
        if (!dateString) return '---';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const families = occupants.reduce((acc, occ) => {
        const group = occ.family_group || 'Sem Grupo';
        if (!acc[group]) acc[group] = [];
        acc[group].push(occ);
        return acc;
    }, {});

    return (
        <PrintLayout
            documentTitle={`Relatório de Abrigo - ${shelter.name}`}
            reportTitle="Relatório de Atividades do Abrigo"
            subtitle={
                <>
                    <span>Status: {shelter.status === 'active' ? 'ATIVO' : shelter.status === 'full' ? 'LOTADO' : 'INATIVO'}</span>
                    <span>•</span>
                    <span>Emissão: {new Date().toLocaleString('pt-BR')}</span>
                </>
            }
            isLoading={loading}
        >
            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">1. Informações do Abrigo</span>
                    <div className="section-header-line"></div>
                </div>
                <table className="report-table">
                    <tbody>
                        <tr>
                            <th style={{ width: '40%' }}>Nome do Abrigo</th>
                            <th style={{ width: '30%' }}>Endereço</th>
                            <th style={{ width: '30%' }}>Bairro</th>
                        </tr>
                        <tr>
                            <td>{shelter.name}</td>
                            <td>{shelter.address || '---'}</td>
                            <td>{shelter.bairro || '---'}</td>
                        </tr>
                        <tr>
                            <th style={{ width: '40%' }}>Responsável</th>
                            <th style={{ width: '30%' }}>Telefone</th>
                            <th style={{ width: '30%' }}>Capacidade Máxima</th>
                        </tr>
                        <tr>
                            <td>{shelter.responsible_name || shelter.contact_name || '---'}</td>
                            <td>{shelter.responsible_phone || shelter.contact_phone || '---'}</td>
                            <td>{shelter.capacity || '---'} pessoas</td>
                        </tr>
                        {operation && (
                        <>
                            <tr>
                                <th colSpan="3" style={{ background: '#e2e8f0', color: '#1e293b' }}>Operação Vinculada</th>
                            </tr>
                            <tr>
                                <td><strong>{operation.nome}</strong></td>
                                <td>Data Início: {formatDateOnly(operation.data_hora_inicio || operation.created_at)}</td>
                                <td>Nível (Cobrade): {operation.cobrade || 'Não Informado'}</td>
                            </tr>
                        </>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">2. Resumo de Ocupação</span>
                    <div className="section-header-line"></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                        <div className="text-3xl font-black text-slate-800">{occupants.length}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Abrigados (Pessoas)</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                        <div className="text-3xl font-black text-slate-800">{Object.keys(families).length}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Grupos Familiares</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                        <div className="text-3xl font-black text-slate-800">{shelter.capacity > 0 ? Math.round((occupants.length / shelter.capacity) * 100) : 0}%</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Taxa de Ocupação</div>
                    </div>
                </div>
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">3. Pessoas Abrigadas</span>
                    <div className="section-header-line"></div>
                </div>
                {occupants.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Nome Completo</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Idade</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Sexo</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Grupo Familiar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {occupants.map(o => (
                                <tr key={o.id}>
                                    <td>
                                        {o.full_name}
                                        {o.is_family_head && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1 rounded uppercase font-bold">Resp.</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{o.age || '---'}</td>
                                    <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>{o.gender || '---'}</td>
                                    <td style={{ textAlign: 'center' }}>{o.family_group || 'Sem Grupo'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma pessoa abrigada ativamente.</p>
                )}
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">4. Resumo Logístico (Estoque Atual)</span>
                    <div className="section-header-line"></div>
                </div>
                {inventory.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50%' }}>Descrição do Item</th>
                                <th style={{ width: '30%', textAlign: 'center' }}>Categoria</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Quantidade</th>
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
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Estoque vazio.</p>
                )}
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">5. Doações Recebidas (Recentes)</span>
                    <div className="section-header-line"></div>
                </div>
                {donations.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Data</th>
                                <th style={{ width: '40%' }}>Item</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Doador/Origem</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.slice(0, 10).map(d => (
                                <tr key={d.id}>
                                    <td>{formatDateOnly(d.donation_date)}</td>
                                    <td>{d.item_description}</td>
                                    <td style={{ textAlign: 'center' }}>{d.donor_name || 'Anônimo'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma doação registrada nesta operação.</p>
                )}
                {donations.length > 10 && <p className="text-xs text-slate-500 text-center mt-2">+ {donations.length - 10} doações (ocultas para brevidade)</p>}
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">6. Distribuições / Saídas (Recentes)</span>
                    <div className="section-header-line"></div>
                </div>
                {distributions.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Data</th>
                                <th style={{ width: '40%' }}>Item</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Destinatário</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {distributions.slice(0, 10).map(d => (
                                <tr key={d.id}>
                                    <td>{formatDateOnly(d.distribution_date || d.created_at)}</td>
                                    <td>{d.item_name}</td>
                                    <td style={{ textAlign: 'center' }}>{d.recipient_name}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma saída registrada nesta operação.</p>
                )}
                {distributions.length > 10 && <p className="text-xs text-slate-500 text-center mt-2">+ {distributions.length - 10} distribuições (ocultas para brevidade)</p>}
            </section>
        </PrintLayout>
    );
};

export default ShelterPrint;
