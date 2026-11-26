import React from 'react';
import { Users, Wrench, DollarSign, Plus, Trash2, Info } from 'lucide-react';
import { SITUACAO_INFORMACAO, formatBRL } from '../../../utils/redapModelsConfig';

/**
 * Componente compartilhado: Atuação do Órgão (Seção 5.3 do Manual REDAP).
 * Reutilizado por todos os modelos setoriais (Saúde, Serviços Urbanos e demais secretarias).
 */
const AtuacaoOrgaoSection = ({
    equipes = [],
    setEquipes,
    recursos = [],
    setRecursos,
    despesas = [],
    setDespesas,
    situacao,
    onChangeSituacao,
    readOnly = false,
}) => {
    const isAbsent =
        situacao === SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA ||
        situacao === SITUACAO_INFORMACAO.NAO_SE_APLICA;

    const addEquipe = () => {
        if (readOnly) return;
        if (isAbsent && onChangeSituacao) onChangeSituacao(SITUACAO_INFORMACAO.INFORMADO);
        setEquipes(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                tipo_acao: '',
                quantidade_servidores: 0,
                descricao_atividade: '',
                local: '',
                data_inicio: '',
                data_fim: '',
                status_acao: 'REALIZADA',
            },
        ]);
    };

    const updateEquipe = (idx, field, value) => {
        setEquipes(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeEquipe = (idx) => {
        setEquipes(prev => prev.filter((_, i) => i !== idx));
    };

    const addRecurso = () => {
        if (readOnly) return;
        if (isAbsent && onChangeSituacao) onChangeSituacao(SITUACAO_INFORMACAO.INFORMADO);
        setRecursos(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                tipo: 'Equipamento',
                nome: '',
                quantidade: 1,
                unidade: 'un.',
                local: '',
                finalidade: '',
                periodo: '',
            },
        ]);
    };

    const updateRecurso = (idx, field, value) => {
        setRecursos(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeRecurso = (idx) => {
        setRecursos(prev => prev.filter((_, i) => i !== idx));
    };

    const addDespesa = () => {
        if (readOnly) return;
        if (isAbsent && onChangeSituacao) onChangeSituacao(SITUACAO_INFORMACAO.INFORMADO);
        setDespesas(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                fonte: 'Recursos Próprios Municipais',
                tipo_despesa: '',
                valor: 0,
                descricao: '',
                documento_ref: '',
            },
        ]);
    };

    const updateDespesa = (idx, field, value) => {
        setDespesas(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeDespesa = (idx) => {
        setDespesas(prev => prev.filter((_, i) => i !== idx));
    };

    const totalServidores = equipes.reduce((acc, e) => acc + (parseInt(e.quantidade_servidores, 10) || 0), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

    return (
        <div className="space-y-6">
            {/* Orientação do Manual */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
                <Info size={16} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                    <strong className="font-black uppercase text-[10px] tracking-wider block mb-0.5">
                        Orientação Técnica (Manual REDAP — Seção 5.3)
                    </strong>
                    Registre apenas <strong>ações realizadas ou em andamento</strong>, informando números objetivos (evite expressões vagas como “várias equipes”). Não inclua previsões nem pedidos futuros. Quando não houver gasto financeiro, registre <strong>R$ 0,00</strong>.
                </div>
            </div>

            {/* Seletor explícito de situação */}
            {!readOnly && onChangeSituacao && (
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: SITUACAO_INFORMACAO.INFORMADO, label: 'Registrar atuação do órgão' },
                        { key: SITUACAO_INFORMACAO.NAO_HOUVE_OCORRENCIA, label: 'Não houve atuação no evento' },
                        { key: SITUACAO_INFORMACAO.NAO_SE_APLICA, label: 'Não se aplica' },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => onChangeSituacao(opt.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                (situacao || SITUACAO_INFORMACAO.INFORMADO) === opt.key
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {isAbsent ? (
                <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-500">
                    {situacao === SITUACAO_INFORMACAO.NAO_SE_APLICA
                        ? 'Marcado explicitamente como "Não se aplica".'
                        : 'Marcado explicitamente como "Não houve atuação do órgão" neste evento.'}
                </div>
            ) : (
                <>
                    {/* 1. PESSOAS E EQUIPES */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black">Pessoas e Equipes</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">
                                        {equipes.length} registro(s) • {totalServidores} servidor(es) mobilizado(s)
                                    </p>
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={addEquipe}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Adicionar equipe
                                </button>
                            )}
                        </div>

                        {equipes.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Nenhuma equipe registrada ainda.</p>
                        ) : (
                            <div className="space-y-3">
                                {equipes.map((eq, idx) => (
                                    <div key={eq.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Ação *</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={eq.tipo_acao || ''}
                                                    onChange={(e) => updateEquipe(idx, 'tipo_acao', e.target.value)}
                                                    placeholder="Ex: Atendimento médico emergencial / Limpeza de via"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Qtd. Servidores *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={readOnly}
                                                    value={eq.quantidade_servidores ?? 0}
                                                    onChange={(e) => updateEquipe(idx, 'quantidade_servidores', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Situação da Ação</label>
                                                <select
                                                    disabled={readOnly}
                                                    value={eq.status_acao || 'REALIZADA'}
                                                    onChange={(e) => updateEquipe(idx, 'status_acao', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                                                >
                                                    <option value="REALIZADA">Realizada</option>
                                                    <option value="EM_ANDAMENTO">Em andamento</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Local / Comunidade</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={eq.local || ''}
                                                    onChange={(e) => updateEquipe(idx, 'local', e.target.value)}
                                                    placeholder="Bairro / Unidade / Via"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data Início</label>
                                                <input
                                                    type="date"
                                                    disabled={readOnly}
                                                    value={eq.data_inicio || ''}
                                                    onChange={(e) => updateEquipe(idx, 'data_inicio', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data Fim (Opcional)</label>
                                                <input
                                                    type="date"
                                                    disabled={readOnly}
                                                    value={eq.data_fim || ''}
                                                    onChange={(e) => updateEquipe(idx, 'data_fim', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrição objetiva do que foi feito</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={eq.descricao_atividade || ''}
                                                    onChange={(e) => updateEquipe(idx, 'descricao_atividade', e.target.value)}
                                                    placeholder="Descreva objetivamente a atividade executada..."
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                />
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeEquipe(idx)}
                                                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. MATERIAIS E EQUIPAMENTOS */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                                    <Wrench size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black">Materiais e Equipamentos</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">{recursos.length} item(ns) registrado(s)</p>
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={addRecurso}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Adicionar equipamento
                                </button>
                            )}
                        </div>

                        {recursos.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Nenhum material ou equipamento registrado ainda.</p>
                        ) : (
                            <div className="space-y-3">
                                {recursos.map((rec, idx) => (
                                    <div key={rec.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo</label>
                                                <select
                                                    disabled={readOnly}
                                                    value={rec.tipo || 'Equipamento'}
                                                    onChange={(e) => updateRecurso(idx, 'tipo', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                                                >
                                                    <option value="Equipamento">Equipamento</option>
                                                    <option value="Veículo / Máquina">Veículo / Máquina</option>
                                                    <option value="Material / Insumo">Material / Insumo</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrição do Material/Equipamento *</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={rec.nome || ''}
                                                    onChange={(e) => updateRecurso(idx, 'nome', e.target.value)}
                                                    placeholder="Ex: Retroescavadeira / Ambulância / Hipoclorito"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Quantidade</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    disabled={readOnly}
                                                    value={rec.quantidade ?? 0}
                                                    onChange={(e) => updateRecurso(idx, 'quantidade', Math.max(0, Number(e.target.value) || 0))}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-center outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unidade</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={rec.unidade || 'un.'}
                                                    onChange={(e) => updateRecurso(idx, 'unidade', e.target.value)}
                                                    placeholder="un., h, L, kg"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Local de Utilização</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={rec.local || ''}
                                                    onChange={(e) => updateRecurso(idx, 'local', e.target.value)}
                                                    placeholder="Local / Bairro"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Finalidade / Período</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={rec.finalidade || ''}
                                                    onChange={(e) => updateRecurso(idx, 'finalidade', e.target.value)}
                                                    placeholder="Finalidade e período de uso"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                />
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecurso(idx)}
                                                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 self-end"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. RECURSOS FINANCEIROS / DESPESAS */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black">Recursos Financeiros Realizados</h3>
                                    <p className="text-[11px] text-slate-400 font-semibold">
                                        {despesas.length} lançamento(s) • Total: <strong className="text-emerald-600">{formatBRL(totalDespesas)}</strong>
                                    </p>
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={addDespesa}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Adicionar despesa
                                </button>
                            )}
                        </div>

                        {despesas.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">Nenhuma despesa registrada (se não houve gasto, você pode adicionar um registro com R$ 0,00 ou deixar sem lançamentos).</p>
                        ) : (
                            <div className="space-y-3">
                                {despesas.map((desp, idx) => (
                                    <div key={desp.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Fonte do Recurso</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={desp.fonte || ''}
                                                    onChange={(e) => updateDespesa(idx, 'fonte', e.target.value)}
                                                    placeholder="Ex: Próprio / Estadual / SUS"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Despesa *</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={desp.tipo_despesa || ''}
                                                    onChange={(e) => updateDespesa(idx, 'tipo_despesa', e.target.value)}
                                                    placeholder="Ex: Combustível / Horas-máquina / Medicamentos"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Valor Realizado (R$)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={readOnly}
                                                    value={desp.valor ?? 0}
                                                    onChange={(e) => updateDespesa(idx, 'valor', Math.max(0, Number(e.target.value) || 0))}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrição</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={desp.descricao || ''}
                                                    onChange={(e) => updateDespesa(idx, 'descricao', e.target.value)}
                                                    placeholder="Detalhamento da despesa realizada"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                />
                                            </div>
                                            <div className="sm:w-52">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Doc. Comprobatório (Opcional)</label>
                                                <input
                                                    type="text"
                                                    disabled={readOnly}
                                                    value={desp.documento_ref || ''}
                                                    onChange={(e) => updateDespesa(idx, 'documento_ref', e.target.value)}
                                                    placeholder="Empenho / NF / Processo"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none"
                                                />
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeDespesa(idx)}
                                                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 self-end"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AtuacaoOrgaoSection;
