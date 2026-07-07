import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';
import { useNoprer } from './hooks/useNoprer';
import StatusBadge from './components/StatusBadge';
import GrauBadge from './components/GrauBadge';
import DiasBadge from './components/DiasBadge';
import PrazoBar from './components/PrazoBar';
import { 
    ArrowLeft, Download, MapPin, User, FileText, 
    Clock, Plus, CheckCircle, ShieldAlert, AlertTriangle, X
} from 'lucide-react';

const TelaDetalhe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useContext(UserContext);
    const { fetchNoprerById, registrarRevistoria, loading } = useNoprer();
    
    const [noprer, setNoprer] = useState(null);
    const [modal, setModal] = useState(null); // 'revistoria', 'encerrar', 'escalar'
    const [modalObs, setModalObs] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        carregarNoprer();
    }, [id]);

    const carregarNoprer = async () => {
        const data = await fetchNoprerById(id);
        if (data) setNoprer(data);
    };

    const handleAcao = async (tipo, resultado) => {
        if (!modalObs) {
            alert('Por favor, informe a justificativa ou observação técnica.');
            return;
        }
        setSubmitting(true);
        try {
            await registrarRevistoria(id, {
                tipo,
                resultado,
                observacoes: modalObs,
                agente: userProfile?.full_name || 'Agente'
            });
            setModal(null);
            setModalObs('');
            await carregarNoprer(); // Recarrega os dados para atualizar UI
        } catch (err) {
            alert('Erro ao registrar ação.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !noprer) {
        return <div className="p-8 text-center text-slate-500">Carregando detalhes...</div>;
    }

    if (!noprer) {
        return <div className="p-8 text-center text-red-500">NOPRER não encontrada.</div>;
    }

    const isActive = ['EMITIDA', 'EM_PRAZO', 'VENCIDA'].includes(noprer.statusCalculado);

    return (
        <div className="bg-[#F1F5F9] min-h-screen font-[Inter,sans-serif] pb-24 relative">
            {/* Header */}
            <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 md:px-6 sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <button onClick={() => navigate('/noprer')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors mt-1">
                            <ArrowLeft size={24} className="text-[#64748B]" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl md:text-2xl font-black text-[#1F3B5C] font-mono tracking-tight">{noprer.numero}</h1>
                                <StatusBadge status={noprer.statusCalculado} />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                                {noprer.vistoria && (
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border">
                                        Origem: <span className="font-bold cursor-pointer hover:underline">{noprer.vistoria.numero}</span>
                                    </span>
                                )}
                                <span className="flex items-center gap-1"><MapPin size={12}/> {noprer.endereco}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Botões de Ação Topo */}
                    <div className="flex items-center gap-2">
                        <button className="bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] px-3 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors shadow-sm">
                            <Download size={16} /> Exportar .docx
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerta Contextual de Prazo */}
            {noprer.statusCalculado === 'VENCIDA' && (
                <div className="bg-[#FEF2F2] border-b border-[#FCA5A5] p-3 text-center">
                    <p className="text-xs font-bold text-[#991B1B] flex justify-center items-center gap-2">
                        <AlertTriangle size={16} /> PRAZO EXPIRADO. Verifique a necessidade de escalada ou nova vistoria.
                    </p>
                </div>
            )}
            {noprer.statusCalculado === 'EM_PRAZO' && (
                <div className="bg-[#FFFBEB] border-b border-[#FCD34D] p-3 text-center">
                    <p className="text-xs font-bold text-[#92400E] flex justify-center items-center gap-2">
                        <Clock size={16} /> ATENÇÃO: Restam poucos dias para o término do prazo.
                    </p>
                </div>
            )}

            <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* COLUNA ESQUERDA - DADOS DA NOPRER */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Meta Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Emissão</p>
                            <p className="font-black text-slate-800">{new Date(noprer.data_emissao).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prazo Limite</p>
                            <p className="font-black text-slate-800">{new Date(noprer.data_limite).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Revistoria Prog.</p>
                            <p className="font-black text-slate-800">{new Date(noprer.data_revistoria).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#E2E8F0]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Progresso do Prazo</p>
                            <div className="mt-1 flex items-center justify-between mb-1">
                                <DiasBadge diasRestantes={noprer.diasRestantes} isVencida={noprer.isVencida} status={noprer.statusCalculado} />
                            </div>
                            <PrazoBar progresso={noprer.progresso} statusCalculado={noprer.statusCalculado} />
                        </div>
                    </div>

                    {/* Notificado & Risco */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#E2E8F0]">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-4 flex items-center gap-2"><User size={18}/> Responsável Notificado</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Nome / Razão Social</p>
                                    <p className="font-bold text-slate-800">{noprer.nome_notificado}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">CPF / CNPJ</p>
                                    <p className="font-bold text-slate-800">{noprer.cpf_notificado}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Condição</p>
                                    <p className="font-bold text-slate-800">{noprer.condicao}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Contato</p>
                                    <p className="font-bold text-slate-800">{noprer.contato || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 bg-[#FAFBFD]">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-black text-[#1F3B5C] flex items-center gap-2"><AlertTriangle size={18}/> Risco Identificado</h3>
                                <GrauBadge grau={noprer.grau_risco} />
                            </div>
                            <div className="flex gap-2 mb-4">
                                <span className="bg-white border px-2 py-1 rounded text-xs font-bold text-slate-700">{noprer.tipo_risco}</span>
                                {noprer.sub_tipo && <span className="bg-white border px-2 py-1 rounded text-xs font-bold text-slate-700">{noprer.sub_tipo}</span>}
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed p-3 bg-white border rounded-lg">{noprer.descricao_risco}</p>
                        </div>
                        <div className="p-5 border-t border-[#E2E8F0]">
                            <h3 className="text-sm font-black text-[#1F3B5C] mb-3">Medidas Mitigatórias Exigidas</h3>
                            <ul className="space-y-2">
                                {(noprer.medidas || []).map((m, i) => (
                                    <li key={i} className="text-sm text-slate-700 flex gap-2 items-start">
                                        <span className="text-[#2E5C8A] font-bold">{i+1}.</span>
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>

                {/* COLUNA DIREITA - TIMELINE E AÇÕES */}
                <div className="space-y-6">
                    
                    {/* Botões de Ação (Apenas se não estiver regularizada ou escalada) */}
                    {isActive && (
                        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col gap-3">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-2">Ações Operacionais</h3>
                            <button 
                                onClick={() => setModal('revistoria')}
                                className="w-full bg-[#EBF1F8] hover:bg-blue-100 text-[#1F3B5C] py-2.5 rounded-lg font-bold text-sm transition-colors border border-[#2E5C8A]/30 flex items-center justify-center gap-2"
                            >
                                <FileText size={16}/> Registrar Revistoria
                            </button>
                            <button 
                                onClick={() => setModal('encerrar')}
                                className="w-full bg-[#F0FDF4] hover:bg-green-100 text-[#166534] py-2.5 rounded-lg font-bold text-sm transition-colors border border-[#86EFAC] flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16}/> Encerrar (Regularizada)
                            </button>
                            <button 
                                onClick={() => setModal('escalar')}
                                className="w-full bg-[#FEF2F2] hover:bg-red-100 text-[#991B1B] py-2.5 rounded-lg font-bold text-sm transition-colors border border-[#FCA5A5] flex items-center justify-center gap-2"
                            >
                                <ShieldAlert size={16}/> Escalar para Interdição
                            </button>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
                        <h3 className="text-sm font-black text-[#1F3B5C] mb-6">Linha do Tempo</h3>
                        
                        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2 before:translate-x-0.5 before:w-0.5 before:bg-slate-200 before:h-full">
                            {(noprer.historico || []).map((evento, idx) => {
                                // Define cores por tipo de evento
                                let colorClass = 'bg-[#1F3B5C]'; // emissão
                                if (evento.tipo === 'revistoria') colorClass = 'bg-[#92400E]';
                                if (evento.tipo === 'encerramento' || evento.resultado === 'REGULARIZADA') colorClass = 'bg-[#166534]';
                                if (evento.tipo === 'escalada' || evento.resultado === 'ESCALADA') colorClass = 'bg-[#991B1B]';

                                return (
                                    <div key={evento.id} className="relative">
                                        <div className={`absolute -left-[30px] w-3.5 h-3.5 rounded-full ring-4 ring-white ${colorClass} top-1`} />
                                        <p className="text-xs font-bold text-slate-500 mb-1">{new Date(evento.created_at).toLocaleDateString('pt-BR')} • {evento.agente}</p>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <p className="text-sm font-bold text-slate-800 uppercase mb-1">{evento.tipo}</p>
                                            <p className="text-sm text-slate-600 leading-relaxed">{evento.observacoes}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALS INLINE */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
                        <div className={`p-4 text-white flex justify-between items-center ${
                            modal === 'encerrar' ? 'bg-[#166534]' : 
                            modal === 'escalar' ? 'bg-[#991B1B]' : 'bg-[#1F3B5C]'
                        }`}>
                            <h3 className="font-bold">
                                {modal === 'encerrar' ? 'Encerrar NOPRER' : 
                                 modal === 'escalar' ? 'Escalar para Interdição' : 'Registrar Revistoria'}
                            </h3>
                            <button onClick={() => {setModal(null); setModalObs('');}} className="text-white/70 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            {modal === 'encerrar' && <p className="text-sm text-slate-600 mb-4">Ao encerrar, você confirma que o responsável cumpriu as exigências e o risco foi mitigado.</p>}
                            {modal === 'escalar' && <p className="text-sm text-red-600 font-bold mb-4">Atenção: O responsável será considerado negligente e a ocorrência será encaminhada para Interdição legal.</p>}
                            
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Relato / Observações Técnicas *</label>
                            <textarea 
                                value={modalObs}
                                onChange={e => setModalObs(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 min-h-[120px]"
                                placeholder="Descreva o que foi constatado na visita..."
                            />
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button disabled={submitting} onClick={() => setModal(null)} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                            <button 
                                disabled={submitting || !modalObs}
                                onClick={() => {
                                    if (modal === 'encerrar') handleAcao('encerramento', 'REGULARIZADA');
                                    else if (modal === 'escalar') handleAcao('escalada', 'ESCALADA');
                                    else handleAcao('revistoria', 'PARCIAL');
                                }}
                                className={`px-6 py-2 rounded-lg font-bold text-white transition-colors flex items-center gap-2 ${
                                    modal === 'encerrar' ? 'bg-green-600 hover:bg-green-700' : 
                                    modal === 'escalar' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {submitting ? 'Salvando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelaDetalhe;
