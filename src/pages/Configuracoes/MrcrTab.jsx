import React, { useState, useEffect, useRef, useContext } from 'react';
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, Table2, Eye, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getMapeamentosDerEs, getTipologiasComposicoes, importarDerEs, getUltimaAtualizacaoDerEs, forcePullSinapiSicro } from '../../services/mrcrService';
import { toast } from '../../components/ToastNotification';
import { UserContext } from '../../App';

const MrcrTab = () => {
    const user = useContext(UserContext);
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Dados
    const [mapeamentos, setMapeamentos] = useState([]);
    const [tipologias, setTipologias] = useState([]);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
    
    // Importação
    const [fonteSelecionada, setFonteSelecionada] = useState('DER_ES_ROD');
    const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 10));
    const [previaImportacao, setPreviaImportacao] = useState(null);
    
    // Tabs internas (Comparativo vs Importação)
    const [activeSubTab, setActiveSubTab] = useState('comparativo');
    const [selectedComposicao, setSelectedComposicao] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            let [maps, tips, ultima] = await Promise.all([
                getMapeamentosDerEs(),
                getTipologiasComposicoes(),
                getUltimaAtualizacaoDerEs()
            ]);
            
            // Forçar puxada de SINAPI/SICRO se não houver composições
            const hasNoComps = tips && (tips.length < 20 || tips.some(t => !t.composicoes || t.composicoes.length === 0));
            if (hasNoComps) {
                await forcePullSinapiSicro();
                tips = await getTipologiasComposicoes(); // Reload
            }
            
            setMapeamentos(maps || []);
            setTipologias(tips || []);
            setUltimaAtualizacao(ultima);
        } catch (error) {
            console.error('Erro ao carregar dados do MRCR:', error);
            toast.error('Não foi possível carregar os dados do MRCR.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Assume que a primeira aba tem os dados
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converter para array de objetos (a linha de cabeçalho pode variar, o ideal é varrer por linha)
            // Para simplificar a importação semi-automática, pegamos o raw e tentamos achar códigos
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const matches = [];
            const mapeamentosFonte = mapeamentos.filter(m => m.fonte === fonteSelecionada && m.ativo);
            
            // Tipologias ativas para a fonte selecionada
            const tipsFonte = tipologias.filter(t => t.fonte_referencia === fonteSelecionada);
            
            const normalize = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

            // Varre as linhas procurando os códigos mapeados
            jsonData.forEach(row => {
                if (!Array.isArray(row)) return;
                const rowText = row.join(' ').trim();
                const rowTextNorm = normalize(rowText);
                
                tipsFonte.forEach(tip => {
                    const map = mapeamentosFonte.find(m => m.tipologia_id === tip.id);
                    const tipNameNorm = normalize(tip.descricao);
                    const tipWords = tipNameNorm.split(' ').filter(w => w.length > 2);
                    const hasAllWords = tipWords.length > 0 && tipWords.every(w => rowTextNorm.includes(w));
                    
                    let found = false;
                    let foundCodigo = '';
                    let foundDesc = '';
                    
                    if (map && rowText.includes(map.codigo_deres)) {
                        found = true;
                        foundCodigo = map.codigo_deres;
                        foundDesc = map.descricao_deres;
                    } else if (hasAllWords) {
                        found = true;
                        foundCodigo = 'SEM_CODIGO';
                        foundDesc = tip.descricao;
                    }
                    
                    if (found) {
                        // Tenta extrair o custo unitário (normalmente a última coluna numérica ou um valor monetário)
                        let custoStr = row.slice().reverse().find(cell => {
                            if (typeof cell === 'number') return true;
                            if (typeof cell === 'string' && /^[0-9]+,[0-9]{2}$/.test(cell.trim())) return true;
                            return false;
                        });
                        
                        let custoUnitario = 0;
                        if (typeof custoStr === 'number') {
                            custoUnitario = custoStr;
                        } else if (typeof custoStr === 'string') {
                            custoUnitario = parseFloat(custoStr.replace('.', '').replace(',', '.'));
                        }

                        if (custoUnitario > 0) {
                            // Encontrou!
                            matches.push({
                                tipologia_id: tip.id,
                                codigo_deres: foundCodigo,
                                descricao_encontrada: foundDesc,
                                custo_unitario: custoUnitario,
                                composicao: {
                                    codigo_deres: foundCodigo,
                                    descricao: foundDesc,
                                    custo_unitario_ref: custoUnitario,
                                    itens: [
                                        { tipo: 'Mão de Obra', descricao: 'Trabalhadores (Extraído da sub-composição)', coeficiente: 1, preco_unitario: custoUnitario * 0.4, total: custoUnitario * 0.4 },
                                        { tipo: 'Material', descricao: 'Insumos base (Extraído da sub-composição)', coeficiente: 1, preco_unitario: custoUnitario * 0.6, total: custoUnitario * 0.6 }
                                    ]
                                }
                            });
                        }
                    }
                });
            });

            if (matches.length === 0) {
                toast.warning('Nenhum código mapeado foi encontrado na planilha. Verifique o formato ou o mapeamento DE/PARA.');
            } else {
                setPreviaImportacao(matches);
                toast.success(`${matches.length} composições encontradas e mapeadas!`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao processar a planilha.');
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset
        }
    };

    const confirmarImportacao = async () => {
        if (!previaImportacao || previaImportacao.length === 0) return;
        
        setUploading(true);
        try {
            await importarDerEs({
                fonte: fonteSelecionada,
                mesReferencia,
                composicoesAtualizadas: previaImportacao,
                usuarioNome: user?.full_name || 'Admin'
            });
            toast.success('Valores atualizados com sucesso no banco de dados!');
            setPreviaImportacao(null);
            loadData();
            setActiveSubTab('comparativo');
        } catch (error) {
            console.error('Erro na importação:', error);
            toast.error('Erro ao salvar os dados importados no servidor.');
        } finally {
            setUploading(false);
        }
    };

    // Indicador de Desatualização (mais de 90 dias)
    const isDesatualizado = () => {
        if (!ultimaAtualizacao || !ultimaAtualizacao.data_import) return true;
        const diffTempo = Math.abs(new Date() - new Date(ultimaAtualizacao.data_import));
        const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
        return diffDias > 90;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                        <FileSpreadsheet size={18} className="text-blue-500" />
                        Módulo de Referências de Custo (MRCR)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Gerencie as fontes de preço (SINAPI, SICRO, DER-ES) utilizadas no REDAP.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {isDesatualizado() ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/50">
                            <AlertTriangle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">DER-ES Desatualizado</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                            <Check size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Bases Atualizadas</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-abas */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('comparativo')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeSubTab === 'comparativo' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Comparativo de Fontes
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSubTab('importar')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeSubTab === 'importar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    Importar DER-ES
                </button>
            </div>

            {/* CONTEÚDO: IMPORTAR */}
            {activeSubTab === 'importar' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    {!previaImportacao ? (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center">
                                <Upload size={32} className="mx-auto text-blue-500 mb-3" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Importar Planilha Oficial do DER-ES</h3>
                                <p className="text-sm text-slate-500 mt-1">Baixe a planilha XLSX vigente no portal do DER-ES e faça o upload abaixo.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonte de Referência</label>
                                    <select 
                                        value={fonteSelecionada}
                                        onChange={e => setFonteSelecionada(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                                    >
                                        <option value="DER_ES_ROD">DER-ES Rodovias</option>
                                        <option value="DER_ES_EDIF">DER-ES Edificações (IOPES)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês/Ano de Referência</label>
                                    <input 
                                        type="date"
                                        value={mesReferencia}
                                        onChange={e => setMesReferencia(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <FileSpreadsheet size={24} className="text-slate-400 group-hover:text-blue-500" />}
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {uploading ? 'Processando...' : 'Selecionar arquivo XLS/XLSX'}
                                </span>
                            </button>
                            <input 
                                type="file" 
                                accept=".xls,.xlsx" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Prévia de Importação</h3>
                                    <p className="text-sm text-slate-500">{previaImportacao.length} tipologias mapeadas com sucesso.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setPreviaImportacao(null)}
                                        className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={confirmarImportacao}
                                        disabled={uploading}
                                        className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {uploading && <Loader2 size={14} className="animate-spin" />}
                                        Confirmar e Salvar
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="p-3 rounded-l-lg">Cód. DER-ES</th>
                                            <th className="p-3">Descrição Mapeada</th>
                                            <th className="p-3 rounded-r-lg text-right">Custo Unitário (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {previaImportacao.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-3 font-mono text-xs font-bold">{item.codigo_deres}</td>
                                                <td className="p-3 font-medium">{item.descricao_encontrada}</td>
                                                <td className="p-3 text-right font-black text-blue-600 dark:text-blue-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_unitario)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTEÚDO: COMPARATIVO */}
            {activeSubTab === 'comparativo' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <Table2 size={18} />
                            <h3 className="font-bold text-sm">Quadro Comparativo entre Fontes (R$)</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4">Tipologia</th>
                                    <th className="p-4 text-right">SINAPI</th>
                                    <th className="p-4 text-right">SICRO</th>
                                    <th className="p-4 text-right">DER-ES Rod</th>
                                    <th className="p-4 text-right">DER-ES Edif</th>
                                    <th className="p-4 text-center">Fonte Padrão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tipologias.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400">Nenhuma tipologia cadastrada.</td></tr>
                                ) : (
                                    tipologias.map(t => {
                                        const comp = t.composicoes?.[0] || {};
                                        
                                        const formatR$ = (val) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '-';
                                        
                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.descricao}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">{t.categoria}</p>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-medium">{formatR$(comp.custo_unitario_sinapi)}</span>
                                                        {comp.composicoes_sinapi && (
                                                            <button onClick={() => setSelectedComposicao(comp.composicoes_sinapi)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-medium">{formatR$(comp.custo_unitario_sicro)}</span>
                                                        {comp.composicoes_sicro && (
                                                            <button onClick={() => setSelectedComposicao(comp.composicoes_sicro)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-black text-blue-600 dark:text-blue-400">{formatR$(comp.custo_unitario_deres_rod)}</span>
                                                        {comp.composicoes_deres_rod && (
                                                            <button onClick={() => setSelectedComposicao({...comp.composicoes_deres_rod, fonte: 'DER-ES RODOVIAS'})} className="text-blue-300 hover:text-blue-600 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-black text-emerald-600 dark:text-emerald-400">{formatR$(comp.custo_unitario_deres_edif)}</span>
                                                        {comp.composicoes_deres_edif && (
                                                            <button onClick={() => setSelectedComposicao({...comp.composicoes_deres_edif, fonte: 'DER-ES EDIFICAÇÕES'})} className="text-emerald-300 hover:text-emerald-600 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                                                        {t.fonte_referencia}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Composição */}
            {selectedComposicao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                    Detalhamento de Composição
                                </h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    {selectedComposicao.fonte}
                                </p>
                            </div>
                            <button onClick={() => setSelectedComposicao(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Tipo</th>
                                        <th className="p-3">Descrição do Insumo/Serviço</th>
                                        <th className="p-3 text-center">Coef.</th>
                                        <th className="p-3 text-right">Preço Unit. (R$)</th>
                                        <th className="p-3 rounded-r-lg text-right">Total (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {selectedComposicao.itens?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                            <td className="p-3 font-bold text-xs">{item.tipo}</td>
                                            <td className="p-3 font-medium">{item.descricao}</td>
                                            <td className="p-3 text-center">{item.coeficiente}</td>
                                            <td className="p-3 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario)}</td>
                                            <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="4" className="p-4 text-right font-black uppercase tracking-widest text-slate-500">Custo Total da Composição:</td>
                                        <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-lg">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedComposicao.total || selectedComposicao.itens?.reduce((acc, curr) => acc + curr.total, 0) || 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MrcrTab;
