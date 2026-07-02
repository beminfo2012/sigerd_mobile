import React, { useState, useEffect, useRef, useContext } from 'react';
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2, Table2, Eye, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
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
    const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));
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

    const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let allLines = [];
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Agrupar itens por Y (linha) para simular colunas/linhas
            const rowMap = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5]);
                if (!rowMap[y]) rowMap[y] = [];
                rowMap[y].push(item.str);
            });
            
            // Ordenar por Y e juntar as colunas
            Object.keys(rowMap).sort((a, b) => b - a).forEach(y => {
                allLines.push(rowMap[y].join(' '));
            });
        }
        return allLines;
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        try {
            const normalize = (text) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            
            // Processar arquivos e gerar as "linhas de dados"
            let todasAsLinhasDeTexto = [];
            
            if (fonteSelecionada === 'DER_ES_ROD') {
                // Modo PDF: juntar todas as linhas de todos os PDFs
                for (const file of files) {
                    if (file.name.toLowerCase().endsWith('.pdf')) {
                        const lines = await extractTextFromPDF(file);
                        todasAsLinhasDeTexto = [...todasAsLinhasDeTexto, ...lines];
                    }
                }
            } else {
                // Modo XLSX: ler apenas 1 arquivo
                const file = files[0];
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                todasAsLinhasDeTexto = jsonData.filter(r => Array.isArray(r)).map(row => row.join('  '));
            }

            const matches = [];
            const mapeamentosFonte = mapeamentos.filter(m => m.fonte === fonteSelecionada && m.ativo);
            const tipsFonte = tipologias.filter(t => t.fonte_referencia === fonteSelecionada).filter((v, i, a) => a.findIndex(t => t.descricao === v.descricao) === i);
            
            // Para cada tipologia, pegamos a composição base e procuramos os insumos
            tipsFonte.forEach(tip => {
                const compBase = tip.composicoes?.[0]?.composicoes_sinapi;
                if (!compBase || !compBase.itens) return;

                const novosItens = [];
                let encontrouAoMenosUmInsumo = false;

                compBase.itens.forEach(item => {
                    const itemDescNorm = normalize(item.descricao);
                    const itemWords = itemDescNorm.replace(/[^a-z0-9]/g, ' ').split(' ').filter(w => w.length > 2);
                    
                    let foundPreco = item.preco_unitario; // Mantém o base se não achar
                    
                    // Procura nas linhas processadas
                    for (let rowText of todasAsLinhasDeTexto) {
                        const rowTextNorm = normalize(rowText);
                        
                        const matchCount = itemWords.filter(w => rowTextNorm.includes(w)).length;
                        if (itemWords.length > 0 && matchCount >= Math.ceil(itemWords.length * 0.5)) {
                            
                            // Extrair o primeiro valor monetário grande da linha (o valor unitário do material)
                            // Match currency format like 1.234,56 or 12,34
                            const moneyRegex = /\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g;
                            const foundMoneys = rowText.match(moneyRegex);
                            
                            if (foundMoneys && foundMoneys.length > 0) {
                                // Pega o último valor, geralmente é o preço final da linha
                                const valStr = foundMoneys[foundMoneys.length - 1];
                                foundPreco = parseFloat(valStr.replace('.', '').replace(',', '.'));
                                encontrouAoMenosUmInsumo = true;
                                break;
                            }
                        }
                    }

                    novosItens.push({
                        ...item,
                        preco_unitario: foundPreco,
                        total: foundPreco * item.coeficiente
                    });
                });

                if (encontrouAoMenosUmInsumo) {
                    const novoCustoTotal = novosItens.reduce((acc, curr) => acc + curr.total, 0);
                    
                    matches.push({
                        tipologia_id: tip.id,
                        codigo_deres: tip.codigo || 'SEM_CODIGO',
                        descricao_encontrada: tip.descricao,
                        custo_unitario: novoCustoTotal,
                        composicao: {
                            codigo_deres: tip.codigo || 'SEM_CODIGO',
                            descricao: tip.descricao,
                            custo_unitario_ref: novoCustoTotal,
                            itens: novosItens,
                            fonte: fonteSelecionada
                        }
                    });
                }
            });

            if (matches.length === 0) {
                toast.warning('Nenhum código mapeado foi encontrado na planilha. Verifique o formato ou o mapeamento DE/PARA.');
            } else {
                setPreviaImportacao(matches);
                toast.success(`${matches.length} composições encontradas e mapeadas!`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao processar o arquivo.');
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
                                        type="month"
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
                                    {uploading ? 'Processando...' : (fonteSelecionada === 'DER_ES_ROD' ? 'Selecionar PDFs (Múltiplos)' : 'Selecionar XLS/XLSX')}
                                </span>
                            </button>
                            <input 
                                type="file" 
                                accept={fonteSelecionada === 'DER_ES_ROD' ? '.pdf' : '.xls,.xlsx'}
                                multiple={fonteSelecionada === 'DER_ES_ROD'}
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
                                                  <td className="p-3 font-medium">
                                                      {item.descricao_encontrada}
                                                      <div className="text-[10px] text-slate-400 mt-1">
                                                          {item.composicao?.itens?.length || 0} insumos que compõem este item foram processados
                                                      </div>
                                                  </td>
                                                  <td className="p-3 text-right">
                                                      <div className="flex items-center justify-end gap-2">
                                                          <span className="font-black text-blue-600 dark:text-blue-400">
                                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.custo_unitario)}
                                                          </span>
                                                          <button onClick={() => setSelectedComposicao(item.composicao)} className="text-blue-400 hover:text-blue-600 transition-colors" title="Ver Insumos da Composição">
                                                              <Eye size={16} />
                                                          </button>
                                                      </div>
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
                                    <th className="p-4 text-right">
                                        SINAPI
                                        <div className="text-[9px] font-normal text-slate-400 normal-case">Ref: Julho 2026</div>
                                    </th>
                                    <th className="p-4 text-right">
                                        SICRO
                                        <div className="text-[9px] font-normal text-slate-400 normal-case">Ref: Julho 2026</div>
                                    </th>
                                    <th className="p-4 text-right">
                                        DER-ES
                                        <div className="text-[9px] font-normal text-slate-400 normal-case">
                                            Ref: {ultimaAtualizacao?.mes_referencia ? (() => { try { const d = ultimaAtualizacao.mes_referencia.includes('-') && ultimaAtualizacao.mes_referencia.length === 7 ? new Date(ultimaAtualizacao.mes_referencia + '-02') : new Date(ultimaAtualizacao.mes_referencia); return isNaN(d.getTime()) ? ultimaAtualizacao.mes_referencia : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); } catch(e) { return ultimaAtualizacao.mes_referencia; } })() : 'Não importado'}
                                        </div>
                                    </th>
                                    <th className="p-4 text-center">Fonte Padrão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tipologias.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">Nenhuma tipologia cadastrada.</td></tr>
                                ) : (
                                    tipologias.filter((v, i, a) => a.findIndex(t => (t.descricao === v.descricao)) === i).map(t => {
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
                                                            <button onClick={() => setSelectedComposicao({...comp.composicoes_sinapi, fonte: 'SINAPI'})} className="text-slate-400 hover:text-blue-500 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="font-medium">{formatR$(comp.custo_unitario_sicro)}</span>
                                                        {comp.composicoes_sicro && (
                                                            <button onClick={() => setSelectedComposicao({...comp.composicoes_sicro, fonte: 'SICRO'})} className="text-slate-400 hover:text-blue-500 transition-colors" title="Ver Composição">
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={`font-black ${comp.custo_unitario_deres_rod ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            {formatR$(comp.custo_unitario_deres_rod || comp.custo_unitario_deres_edif)}
                                                        </span>
                                                        {(comp.composicoes_deres_rod || comp.composicoes_deres_edif) && (
                                                            <button 
                                                                onClick={() => {
                                                                    if (comp.composicoes_deres_rod) setSelectedComposicao({...comp.composicoes_deres_rod, fonte: 'DER-ES RODOVIAS'});
                                                                    else setSelectedComposicao({...comp.composicoes_deres_edif, fonte: 'DER-ES EDIFICAÇÕES'});
                                                                }} 
                                                                className="text-slate-400 hover:text-blue-600 transition-colors" title="Ver Composição"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                                                        {t.fonte_referencia}
                                                    </span>
                                                </td></tr>
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
