import React, { useState, useEffect } from 'react';
import { getTipologiasComposicoes } from '../../../services/mrcrService';
import { Calculator, Check, Loader2, Eye, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const MrcrSelector = ({ onSelect, disabled }) => {
    const [tipologias, setTipologias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    
    // Estados
    const [selectedTipologia, setSelectedTipologia] = useState(null);
    const [selectedFonte, setSelectedFonte] = useState('DER_ES_ROD');
    const [mostrarComposicao, setMostrarComposicao] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState('EDIFICAÇÕES'); // Novo filtro
    const [searchTerm, setSearchTerm] = useState('');
    
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
        if (!tipologia?.composicoes) return 0;
        const comp = tipologia.composicoes.reduce((acc, curr) => ({
            ...acc,
            ...Object.fromEntries(Object.entries(curr).filter(([_, v]) => v !== null && v !== undefined))
        }), {}) || {};
        
        switch (fonte) {
            case 'SINAPI': return comp.custo_unitario_sinapi || 0;
            case 'SICRO': return comp.custo_unitario_sicro || 0;
            case 'DER_ES_ROD': return comp.custo_unitario_deres_rod || 0;
            case 'DER_ES_EDIF': return comp.custo_unitario_deres_edif || 0;
            default: return 0;
        }
    };
    
    const aplicarValor = () => {
        if (!selectedTipologia) return;
        const valorUnitario = getValorPorFonte(selectedTipologia, selectedFonte);
        
        onSelect({
            fonte: selectedFonte,
            tipologia_id: selectedTipologia.id,
            tipologia_desc: selectedTipologia.descricao,
            valor_unitario: valorUnitario
        });
        setOpen(false);
    };

    const filteredTipologias = tipologias.filter((v, i, a) => a.findIndex(t => t.descricao === v.descricao) === i).filter(t => 
        t.categoria === filtroCategoria && 
        (searchTerm === '' || t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || (t.codigo && t.codigo.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <div className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border border-blue-200 dark:border-blue-800/50"
            >
                <Calculator size={14} /> Buscar no MRCR
            </button>

            {open && !disabled && (
                <div className="absolute top-full mt-2 right-0 z-50 w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Calculator size={14} className="text-blue-500" /> Referencial de Custos (MRCR)
                        </h4>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
                    ) : (
                        <>
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button 
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${filtroCategoria === 'EDIFICAÇÕES' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                    onClick={() => { setFiltroCategoria('EDIFICAÇÕES'); setSelectedTipologia(null); }}
                                >
                                    Edificações
                                </button>
                                <button 
                                    className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-colors ${filtroCategoria !== 'EDIFICAÇÕES' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                    onClick={() => { setFiltroCategoria('INFRAESTRUTURA VIÁRIA'); setSelectedTipologia(null); }}
                                >
                                    Infra. Viária
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="relative">
                                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Pesquisar tipologia..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full text-xs font-bold pl-8 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
                                    />
                                </div>
                                
                                {!selectedTipologia ? (
                                    <div className="mt-2 max-h-48 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                                        {filteredTipologias.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-slate-500 font-medium">Nenhuma tipologia encontrada</div>
                                        ) : (
                                            filteredTipologias.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setSelectedTipologia(t)}
                                                    className="w-full text-left p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col gap-0.5 group"
                                                >
                                                    <span className="text-[10px] font-black text-blue-500 group-hover:text-blue-600">{t.codigo}</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{t.descricao}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 flex items-center justify-between p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-500">{selectedTipologia.codigo}</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedTipologia.descricao}</span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedTipologia(null)}
                                            className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-800 rounded shadow-sm"
                                        >
                                            Trocar
                                        </button>
                                    </div>
                                )}

                            </div>

                            {selectedTipologia && (
                                <div className="space-y-3">
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
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.val)}<span className="text-[9px] text-slate-400">/{selectedTipologia.unidade}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                        <button 
                                            type="button"
                                            onClick={() => setMostrarComposicao(!mostrarComposicao)}
                                            className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <span className="flex items-center gap-1.5"><Eye size={12} /> Ver Insumos ({selectedTipologia.composicoes?.[0]?.composicoes_sinapi?.itens?.length || 0})</span>
                                            {mostrarComposicao ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        
                                        {mostrarComposicao && (
                                            <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                                                <table className="w-full text-left text-[9px] text-slate-500">
                                                    <thead>
                                                        <tr>
                                                            <th className="pb-1 uppercase tracking-wider">Insumo</th>
                                                            <th className="pb-1 uppercase tracking-wider text-right">R$ (Ref)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                        {(
    (() => {
        const comp = selectedTipologia.composicoes?.reduce((acc, curr) => ({
            ...acc,
            ...Object.fromEntries(Object.entries(curr).filter(([_, v]) => v !== null && v !== undefined))
        }), {}) || {};
        
        const fonteKey = selectedFonte === 'DER_ES_ROD' ? 'composicoes_deres_rod' : selectedFonte === 'DER_ES_EDIF' ? 'composicoes_deres_edif' : selectedFonte === 'SICRO' ? 'composicoes_sicro' : 'composicoes_sinapi';
        
        return comp[fonteKey]?.itens || comp.composicoes_sinapi?.itens || [];
    })()
).map((insumo, idx) => (
                                                            <tr key={idx}>
                                                                <td className="py-1 pr-2 truncate max-w-[200px]" title={insumo.descricao}>{insumo.descricao}</td>
                                                                <td className="py-1 text-right font-bold text-slate-700 dark:text-slate-300">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insumo.preco_unitario || 0)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <button
                                            onClick={aplicarValor}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
                                        >
                                            <Check size={14} /> Aplicar Valor Unitário
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
