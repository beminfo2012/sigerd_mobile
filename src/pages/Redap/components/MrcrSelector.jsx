import React, { useState, useEffect } from 'react';
import { getTipologiasComposicoes } from '../../../services/mrcrService';
import { Calculator, Check, Info, Loader2, Search } from 'lucide-react';
import { CurrencyInput } from '../../../components/RedapInputs';

export const MrcrSelector = ({ value, onChange, disabled, itemName }) => {
    const [tipologias, setTipologias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    
    // Estados do cálculo
    const [selectedTipologia, setSelectedTipologia] = useState(null);
    const [selectedFonte, setSelectedFonte] = useState('DER_ES_ROD');
    const [quantidade, setQuantidade] = useState(1);
    
    useEffect(() => {
        if (open && tipologias.length === 0) {
            loadTipologias();
        }
    }, [open]);
    
    const loadTipologias = async () => {
        setLoading(true);
        try {
            const data = await getTipologiasComposicoes();
            setTipologias(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    const getValorPorFonte = (tipologia, fonte) => {
        if (!tipologia?.composicoes?.[0]) return 0;
        const comp = tipologia.composicoes[0];
        
        switch (fonte) {
            case 'SINAPI': return comp.custo_unitario_sinapi || 0;
            case 'SICRO': return comp.custo_unitario_sicro || 0;
            case 'DER_ES_ROD': return comp.custo_unitario_deres_rod || 0;
            case 'DER_ES_EDIF': return comp.custo_unitario_deres_edif || 0;
            default: return 0;
        }
    };
    
    const aplicarCalculo = () => {
        if (!selectedTipologia) return;
        const valorUnitario = getValorPorFonte(selectedTipologia, selectedFonte);
        const valorTotal = valorUnitario * quantidade;
        onChange(valorTotal, {
            fonte: selectedFonte,
            tipologia_id: selectedTipologia.id,
            quantidade,
            valor_unitario: valorUnitario
        });
        setOpen(false);
    };

    return (
        <div className="relative">
            <div className="flex flex-col gap-2">
                <CurrencyInput
                    disabled={disabled}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-350 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-sm outline-none transition-all"
                    value={value || 0}
                    onChange={(val) => onChange(val)}
                />
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-200 dark:border-blue-800/50"
                    >
                        <Calculator size={14} /> Usar Tabela MRCR
                    </button>
                )}
            </div>

            {open && !disabled && (
                <div className="absolute top-full mt-2 right-0 z-50 w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Calculator size={14} className="text-blue-500" /> Comparativo Multi-Fonte
                        </h4>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscar Tipologia Base</label>
                                <select 
                                    className="w-full text-xs font-bold p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
                                    onChange={(e) => setSelectedTipologia(tipologias.find(t => t.id === e.target.value))}
                                    value={selectedTipologia?.id || ''}
                                >
                                    <option value="">-- Selecione --</option>
                                    {tipologias.map(t => (
                                        <option key={t.id} value={t.id}>{t.codigo} - {t.descricao}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedTipologia && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Quantidade</label>
                                            <input 
                                                type="number"
                                                value={quantidade}
                                                onChange={e => setQuantidade(parseFloat(e.target.value) || 0)}
                                                className="w-full text-xs font-bold p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Unid.</label>
                                            <div className="w-full text-xs font-bold p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center text-slate-500">
                                                {selectedTipologia.unidade}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escolha a Fonte</label>
                                        <div className="flex flex-col gap-1.5">
                                            {[
                                                { id: 'DER_ES_ROD', label: 'DER-ES Rodovias', val: getValorPorFonte(selectedTipologia, 'DER_ES_ROD'), color: 'text-blue-600 dark:text-blue-400' },
                                                { id: 'DER_ES_EDIF', label: 'DER-ES Edif.', val: getValorPorFonte(selectedTipologia, 'DER_ES_EDIF'), color: 'text-emerald-600 dark:text-emerald-400' },
                                                { id: 'SINAPI', label: 'SINAPI', val: getValorPorFonte(selectedTipologia, 'SINAPI'), color: 'text-amber-600 dark:text-amber-400' },
                                                { id: 'SICRO', label: 'SICRO', val: getValorPorFonte(selectedTipologia, 'SICRO'), color: 'text-purple-600 dark:text-purple-400' }
                                            ].map(f => f.val > 0 && (
                                                <div 
                                                    key={f.id}
                                                    onClick={() => setSelectedFonte(f.id)}
                                                    className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${selectedFonte === f.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full border ${selectedFonte === f.id ? 'border-[3px] border-blue-500' : 'border-slate-300 dark:border-slate-600'}`} />
                                                        <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">{f.label}</span>
                                                    </div>
                                                    <span className={`text-xs font-black ${f.color}`}>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.val)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Total Calculado</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getValorPorFonte(selectedTipologia, selectedFonte) * quantidade)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={aplicarCalculo}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
                                        >
                                            <Check size={14} /> Aplicar Valor
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
