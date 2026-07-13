import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getShelterById, getOccupants, getDonations, getInventory, getShelterTransfers } from '../../services/shelterDb';
import { operacoesService } from '../../services/operacoesService';
import PrintLayout from '../../components/PrintLayout';
import { supabase } from '../../services/supabase';

const ShelterPrint = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const operacaoId = searchParams.get('operacao_id');

    const [data, setData] = useState({
        shelter: null,
        activeOccupants: [],
        exitedOccupants: [],
        donations: [],
        distributions: [],
        inventory: [],
        operation: null,
        allOperacoesMap: {},
        animals: []
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
                const operacoes = await operacoesService.getAllOperacoes();
                const allOperacoesMap = operacoes.reduce((acc, op) => {
                    acc[op.id] = op.nome;
                    return acc;
                }, {});

                if (operacaoId && operacaoId !== 'all') {
                    operation = operacoes.find(op => String(op.id) === String(operacaoId));
                } else if (s.operacao_id) {
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
                const exitedOccupants = filterByOperation(rawOccupants).filter(o => o.status === 'exited');
                
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

                const { data: rawAnimals } = await supabase
                    .from('animal_estimacao')
                    .select('*, tutor:tutor_pessoa_id(full_name), encaminhamentos:animal_encaminhamento(status, ponto_apoio_id, ponto_apoio_animal(nome))')
                    .eq('abrigo_humano_id', id)
                    .eq('ativo', true);

                setData({
                    shelter: s,
                    activeOccupants: activeOccupants,
                    exitedOccupants: exitedOccupants,
                    donations: filteredDonations,
                    distributions: filteredDistributions,
                    inventory: filteredInventory,
                    operation: operation,
                    allOperacoesMap: allOperacoesMap,
                    animals: rawAnimals || []
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

    const { shelter, activeOccupants, exitedOccupants, donations, distributions, inventory, operation, allOperacoesMap, animals } = data;

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

    const families = activeOccupants.reduce((acc, occ) => {
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
                    {(!operacaoId || operacaoId === 'all') ? <span className="text-blue-200">Visão Geral: Todas as Operações</span> : <span className="text-emerald-200">Operação: {operation?.nome}</span>}
                    <span>•</span>
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
                        {operation && operacaoId !== 'all' ? (
                        <>
                            <tr>
                                <th colSpan="3" style={{ background: '#e2e8f0', color: '#1e293b' }}>Foco do Relatório: Operação Específica</th>
                            </tr>
                            <tr>
                                <td><strong>{operation.nome}</strong></td>
                                <td>Data Início: {formatDateOnly(operation.data_hora_inicio || operation.created_at)}</td>
                                <td>Nível (Cobrade): {operation.cobrade || 'Não Informado'}</td>
                            </tr>
                        </>
                        ) : (
                        <>
                            <tr>
                                <th colSpan="3" style={{ background: '#e2e8f0', color: '#1e293b' }}>Foco do Relatório: Histórico Completo de Todas as Operações</th>
                            </tr>
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>Este relatório exibe o histórico de movimentações, abrigados e estoques vinculados a todas as operações que este abrigo participou.</td>
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
                        <div className="text-3xl font-black text-slate-800">{activeOccupants.length}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Abrigados (Ativos)</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                        <div className="text-3xl font-black text-slate-800">{Object.keys(families).length}</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Grupos Familiares (Ativos)</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                        <div className="text-3xl font-black text-slate-800">{shelter.capacity > 0 ? Math.round((activeOccupants.length / shelter.capacity) * 100) : 0}%</div>
                        <div className="text-xs font-bold text-slate-500 uppercase">Taxa de Ocupação Atual</div>
                    </div>
                </div>
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">3. Histórico de Pessoas Abrigadas (Ativos)</span>
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
                                <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
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
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma pessoa abrigada ativamente.</p>
                )}
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">4. Histórico de Animais Cadastrados</span>
                    <div className="section-header-line"></div>
                </div>
                {animals.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Nome do Animal</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Espécie/Porte</th>
                                <th style={{ width: '25%', textAlign: 'center' }}>Tutor</th>
                                <th style={{ width: '35%', textAlign: 'center' }}>Status / Local</th>
                            </tr>
                        </thead>
                        <tbody>
                            {animals.map(a => {
                                const lastEncaminhamento = a.encaminhamentos && a.encaminhamentos.length > 0 
                                    ? a.encaminhamentos[a.encaminhamentos.length - 1] 
                                    : null;
                                    
                                let statusText = 'No Abrigo (Sem encaminhamento)';
                                if (lastEncaminhamento) {
                                    if (lastEncaminhamento.status === 'devolvido_ao_tutor') statusText = 'Devolvido ao Tutor';
                                    else if (lastEncaminhamento.status === 'obito') statusText = 'Óbito';
                                    else statusText = `Encaminhado: ${lastEncaminhamento.ponto_apoio_animal?.nome || 'Ponto de Apoio'}`;
                                }

                                return (
                                    <tr key={a.id}>
                                        <td>
                                            <strong>{a.nome}</strong>
                                        </td>
                                        <td style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                                            {a.especie} {a.porte ? `(${a.porte})` : ''}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{a.tutor?.full_name || 'Desconhecido'}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold">
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhum animal cadastrado neste abrigo.</p>
                )}
            </section>

            {exitedOccupants.length > 0 && (
            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">3.1. Histórico de Pessoas que Saíram</span>
                    <div className="section-header-line"></div>
                </div>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Nome Completo</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Grupo Familiar</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Data Entrada</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Data Saída</th>
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
                    <span className="section-header-title">5. Doações Recebidas (Histórico Completo)</span>
                    <div className="section-header-line"></div>
                </div>
                {donations.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Data</th>
                                <th style={{ width: '35%' }}>Item</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Origem</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Qtd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDateOnly(d.donation_date)}</td>
                                    <td>{d.item_description}</td>
                                    <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(d.operacao_id)}</span></td>
                                    <td style={{ textAlign: 'center' }}>{d.donor_name || 'Anônimo'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma doação registrada nesta operação.</p>
                )}
            </section>

            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">6. Distribuições / Saídas (Histórico Completo)</span>
                    <div className="section-header-line"></div>
                </div>
                {distributions.length > 0 ? (
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th style={{ width: '15%' }}>Data</th>
                                <th style={{ width: '35%' }}>Item</th>
                                <th style={{ width: '20%', textAlign: 'center' }}>Operação</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Destinatário</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Qtd</th>
                            </tr>
                        </thead>
                        <tbody>
                            {distributions.map(d => (
                                <tr key={d.id}>
                                    <td>{formatDateOnly(d.distribution_date || d.created_at)}</td>
                                    <td>{d.item_name}</td>
                                    <td style={{ textAlign: 'center' }}><span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded uppercase font-bold">{getOpName(d.operacao_id)}</span></td>
                                    <td style={{ textAlign: 'center' }}>{d.recipient_name}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.quantity} {d.unit}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded border border-slate-200 text-center">Nenhuma saída registrada nesta operação.</p>
                )}
            </section>
        </PrintLayout>
    );
};

export default ShelterPrint;
