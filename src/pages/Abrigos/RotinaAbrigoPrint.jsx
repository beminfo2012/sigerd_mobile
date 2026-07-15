import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { getShelterById } from '../../services/shelterDb';
import PrintLayout from '../../components/PrintLayout';

const CATEGORIA_LABEL = {
    alimentacao: "Alimentação", higiene: "Higiene", descanso: "Descanso",
    administrativo: "Administrativo", saude: "Saúde", recreacao: "Recreação",
    religioso: "Religioso", seguranca: "Segurança",
};

function formatHorario(item) {
    let h = item.horario_inicio.slice(0, 5);
    if (item.horario_fim) h += ` – ${item.horario_fim.slice(0, 5)}`;
    if (item.padrao_recorrencia === "intervalo_horas" && item.intervalo_horas) {
        h += ` (a cada ${item.intervalo_horas}h)`;
    }
    return h;
}

const RotinaAbrigoPrint = () => {
    const { id } = useParams();
    const [data, setData] = useState({
        shelter: null,
        rotinas: [],
        regras: []
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

                const [itensRes, regrasRes] = await Promise.all([
                    supabase.from("abrigo_rotina_item").select("*").eq("abrigo_id", id).order("horario_inicio"),
                    supabase.from("abrigo_regra_convivencia").select("*").eq("abrigo_id", id).order("ordem")
                ]);

                setData({
                    shelter: s,
                    rotinas: itensRes.data || [],
                    regras: regrasRes.data || []
                });

                document.title = `Mural de Rotina - ${s.name}`;
            } catch (error) {
                console.error('Error generating rotina print:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Carregando visualização...</div>;
    if (!data.shelter) return <div className="flex items-center justify-center min-h-screen">Abrigo não encontrado.</div>;

    const { shelter, rotinas, regras } = data;

    return (
        <PrintLayout
            documentTitle={`Mural do Abrigo - ${shelter.name}`}
            reportTitle="Quadro de Avisos e Rotinas"
            subtitle={
                <>
                    <span className="text-blue-200">Abrigo: {shelter.name}</span>
                    <span>•</span>
                    <span>Endereço: {shelter.address || 'Não informado'}</span>
                    <span>•</span>
                    <span>Atualizado em: {new Date().toLocaleString('pt-BR')}</span>
                </>
            }
            isLoading={loading}
        >
            <section className="mb-6 avoid-break">
                <div className="section-header">
                    <span className="section-header-title">1. Regras de Convivência</span>
                    <div className="section-header-line"></div>
                </div>
                {regras.length > 0 ? (
                    <ul className="list-decimal pl-8 space-y-3 mt-4 text-base text-slate-800 dark:text-slate-100">
                        {regras.map(r => (
                            <li key={r.id} className="pl-2 leading-relaxed">
                                {r.texto_regra}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic p-4 text-center">Nenhuma regra de convivência cadastrada.</p>
                )}
            </section>

            <section className="mb-6 avoid-break mt-12">
                <div className="section-header">
                    <span className="section-header-title">2. Grade Horária e Atividades</span>
                    <div className="section-header-line"></div>
                </div>
                {rotinas.length > 0 ? (
                    <table className="report-table mt-4">
                        <thead>
                            <tr>
                                <th style={{ width: '20%', textAlign: 'center', fontSize: '14px', padding: '12px' }}>Horário</th>
                                <th style={{ width: '40%', fontSize: '14px', padding: '12px' }}>Atividade</th>
                                <th style={{ width: '20%', textAlign: 'center', fontSize: '14px', padding: '12px' }}>Categoria</th>
                                <th style={{ width: '20%', fontSize: '14px', padding: '12px' }}>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rotinas.map(item => (
                                <tr key={item.id}>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>
                                        {formatHorario(item)}
                                    </td>
                                    <td style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                                        {item.atividade}
                                    </td>
                                    <td style={{ textAlign: 'center', textTransform: 'uppercase', fontSize: '12px', color: '#475569' }}>
                                        {CATEGORIA_LABEL[item.categoria] || item.categoria}
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                                        {item.observacao || '---'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic p-4 text-center">Nenhuma rotina cadastrada para este abrigo.</p>
                )}
            </section>
        </PrintLayout>
    );
};

export default RotinaAbrigoPrint;
