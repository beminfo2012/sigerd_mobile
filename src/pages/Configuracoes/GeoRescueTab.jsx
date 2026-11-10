import React, { useState, useEffect, useRef } from 'react';
import { 
    Upload, 
    FileSpreadsheet, 
    CheckCircle, 
    AlertTriangle, 
    Loader2, 
    RefreshCw, 
    Download, 
    Zap, 
    Database, 
    ArrowRight, 
    Layers, 
    MapPin, 
    Check, 
    X,
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { toast } from '../../components/ToastNotification';
import { getInstallationsCount } from '../../services/db';
import { 
    parseGeoRescueFile, 
    compareWithLocalInstallations, 
    applyUpsertToIndexedDB, 
    generateAndDownloadV2Json 
} from '../../services/georescueAdminService';

const GeoRescueTab = () => {
    const fileInputRef = useRef(null);

    // Estado do banco local atual
    const [localCount, setLocalCount] = useState(0);
    const [dbVersion, setDbVersion] = useState('v1');
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loadingLocal, setLoadingLocal] = useState(true);

    // Estado do arquivo e processamento
    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [diffReport, setDiffReport] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [applyProgress, setApplyProgress] = useState(0);
    const [showDiffSamples, setShowDiffSamples] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        loadLocalStats();
    }, []);

    const loadLocalStats = async () => {
        setLoadingLocal(true);
        try {
            const count = await getInstallationsCount();
            setLocalCount(count);

            // Migra v5 residual para v2 caso já esteja sincronizado com a base nova
            let version = localStorage.getItem('geo_db_version');
            if (version === 'v5' || (count >= 28000 && (!version || version === 'v5' || version === 'v4'))) {
                version = 'v2';
                localStorage.setItem('geo_db_version', 'v2');
            }
            setDbVersion(version || 'v2');

            const storedDate = localStorage.getItem('geo_db_last_update');
            setLastUpdate(storedDate ? new Date(storedDate).toLocaleString('pt-BR') : null);
        } catch (e) {
            console.error('Erro ao ler estatísticas do GeoRescue:', e);
        } finally {
            setLoadingLocal(false);
        }
    };

    const handleFileSelect = async (file) => {
        if (!file) return;

        setSelectedFile(file);
        setParsedItems([]);
        setDiffReport(null);
        setIsAnalyzing(true);
        setStatusMessage('Iniciando leitura do arquivo...');

        try {
            const items = await parseGeoRescueFile(file, (msg) => setStatusMessage(msg));
            setParsedItems(items);

            setStatusMessage(`Cruzando ${items.length} registros com o banco atual...`);
            const report = await compareWithLocalInstallations(items, (msg) => setStatusMessage(msg));
            setDiffReport(report);

            toast.success(`Análise concluída: ${items.length} UCs lidas com sucesso!`);
        } catch (err) {
            console.error('Falha na análise do arquivo:', err);
            toast.error(err.message || 'Erro ao processar o arquivo.');
            setSelectedFile(null);
        } finally {
            setIsAnalyzing(false);
            setStatusMessage('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleApplyUpsert = () => {
        if (!parsedItems || parsedItems.length === 0) return;
        setShowConfirmModal(true);
    };

    const executeUpsert = async () => {
        setShowConfirmModal(false);
        if (!parsedItems || parsedItems.length === 0) return;

        setIsApplying(true);
        setApplyProgress(0);

        try {
            await applyUpsertToIndexedDB(parsedItems, (current, total) => {
                const pct = Math.round((current / total) * 100);
                setApplyProgress(pct);
            });

            await loadLocalStats();
            toast.success('Banco GeoRescue atualizado com sucesso no dispositivo!');
        } catch (err) {
            console.error('Erro ao aplicar upsert no IndexedDB:', err);
            toast.error('Erro ao atualizar o banco local: ' + err.message);
        } finally {
            setIsApplying(false);
        }
    };

    const handleDownloadV2Json = () => {
        if (!parsedItems || parsedItems.length === 0) return;
        try {
            generateAndDownloadV2Json(parsedItems, 'uc_db_v2.json');
            toast.success('Arquivo uc_db_v2.json gerado e baixado!');
        } catch (err) {
            console.error('Erro ao gerar JSON:', err);
            toast.error('Erro ao gerar arquivo JSON.');
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setParsedItems([]);
        setDiffReport(null);
        setStatusMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Header explicativo */}
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Zap size={20} />
                </div>
                <div>
                    <h2 className="text-sm font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
                        Gestão da Base de Dados GeoRescue (UCs de Energia Elétrica)
                    </h2>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                        Este módulo permite importar, analisar divergências e realizar a sincronização completa de Unidades Consumidoras diretamente para o motor offline do GeoRescue. Você pode testar e atualizar o banco IndexedDB local ou gerar o arquivo <code className="bg-indigo-100 dark:bg-indigo-900/50 px-1 py-0.5 rounded font-mono font-bold">uc_db_v2.json</code> para distribuição geral.
                    </p>
                </div>
            </div>

            {/* Status Atual do Banco */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Database size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                                Status da Base Local (IndexedDB)
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">Dados armazenados no dispositivo para operação offline</p>
                        </div>
                    </div>
                    <button
                        onClick={loadLocalStats}
                        disabled={loadingLocal}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 flex items-center gap-1.5 text-xs font-bold"
                    >
                        <RefreshCw size={14} className={loadingLocal ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Recarregar</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Total de UCs Instaladas
                        </span>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-baseline gap-2">
                            {loadingLocal ? (
                                <Loader2 size={20} className="animate-spin text-slate-400" />
                            ) : (
                                <>
                                    {localCount.toLocaleString('pt-BR')}
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                        Ativas
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Versão do Banco Local
                        </span>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-baseline gap-2">
                            {dbVersion.toUpperCase()}
                            <span className="text-xs font-bold text-slate-500 font-mono">
                                (geo_db_version)
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Última Atualização
                        </span>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-200 pt-1">
                            {lastUpdate || 'Instalação padrão inicial'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Área de Seleção / Dropzone do Arquivo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                    Carregar Nova Planilha de UCs (EDP / OTRF)
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-4">
                    Arraste ou selecione o arquivo <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">.xlsx</code>, <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">.xls</code> ou <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">.json</code> para analisar o comparativo.
                </p>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.json,.csv"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                />

                {!selectedFile ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isDragOver
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                                : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-950/50'
                        }`}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                            <FileSpreadsheet size={28} />
                        </div>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">
                            Clique ou arraste a planilha para cá
                        </p>
                        <p className="text-xs text-slate-400 font-medium text-center max-w-sm">
                            Suporta planilhas padrão da concessionária (ex: <code>000652084242_NS_OTRF.xlsx</code>) com colunas UC, NUMERO, Coordenadas e Bairro.
                        </p>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-slate-400 font-medium">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {parsedItems.length > 0 ? `${parsedItems.length.toLocaleString('pt-BR')} registros lidos` : 'Processando...'}
                                </p>
                            </div>
                        </div>

                        {!isAnalyzing && !isApplying && (
                            <button
                                onClick={handleReset}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title="Remover arquivo"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}

                {/* Status de Análise */}
                {isAnalyzing && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex items-center gap-3">
                        <Loader2 size={18} className="animate-spin text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {statusMessage || 'Analisando arquivo...'}
                        </span>
                    </div>
                )}
            </div>

            {/* Resultados do Comparativo (Diff) */}
            {diffReport && !isAnalyzing && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                Diagnóstico das Alterações (Diff Cruzado)
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Cruzamento linha a linha entre a planilha enviada e o banco local
                            </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                            {diffReport.totalNovo.toLocaleString('pt-BR')} Linhas Processadas
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Novas UCs */}
                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-4">
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                                + Novas UCs
                            </span>
                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                +{diffReport.novas.toLocaleString('pt-BR')}
                            </div>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 block">
                                Inserções inéditas no GeoRescue
                            </span>
                        </div>

                        {/* Alteradas */}
                        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4">
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                                ↺ UCs Alteradas
                            </span>
                            <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                                {diffReport.alteradas.toLocaleString('pt-BR')}
                            </div>
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 block">
                                Coords: {diffReport.statsAlteracoes.coordenadas} | Bairros: {diffReport.statsAlteracoes.bairro}
                            </span>
                        </div>

                        {/* Removidas / Descontinuadas */}
                        {diffReport.removidas > 0 ? (
                            <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-4">
                                <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
                                    - UCs Removidas
                                </span>
                                <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
                                    -{diffReport.removidas.toLocaleString('pt-BR')}
                                </div>
                                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1 block">
                                    Fora da nova planilha (expurgadas)
                                </span>
                            </div>
                        ) : (
                            /* Idênticas */
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                                    = UCs Idênticas
                                </span>
                                <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
                                    {diffReport.identicas.toLocaleString('pt-BR')}
                                </div>
                                <span className="text-[11px] font-medium text-slate-400 mt-1 block">
                                    Sem divergências cadastrais
                                </span>
                            </div>
                        )}

                        {/* Total Final */}
                        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4">
                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">
                                Total Consolidado
                            </span>
                            <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                {diffReport.totalNovo.toLocaleString('pt-BR')}
                            </div>
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1 block">
                                Nova base total do mapa
                            </span>
                        </div>
                    </div>

                    {/* Detalhamento de Coordenadas */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                            <MapPin size={16} className="text-blue-600 shrink-0" />
                            <span>
                                <strong>{diffReport.comCoordenadas?.toLocaleString('pt-BR')}</strong> UCs georreferenciadas (pontos visíveis no mapa)
                            </span>
                        </div>
                        {diffReport.semCoordenadas > 0 && (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                • <strong>{diffReport.semCoordenadas?.toLocaleString('pt-BR')}</strong> UCs sem coordenadas GPS (pesquisáveis por texto/número)
                            </span>
                        )}
                    </div>

                    {/* Acordeão de Amostras de Alterações */}
                    {diffReport.alteradas > 0 && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setShowDiffSamples(!showDiffSamples)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300"
                            >
                                <span>Ver Amostra de UCs que Sofreram Alteração ({diffReport.amostraAlterados.length} exemplos)</span>
                                {showDiffSamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {showDiffSamples && (
                                <div className="p-4 overflow-x-auto space-y-3">
                                    {diffReport.amostraAlterados.map((sample, idx) => (
                                        <div key={idx} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-1.5">
                                            <div className="flex items-center justify-between font-mono font-bold text-slate-800 dark:text-slate-200">
                                                <span>UC: {sample.uc}</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {sample.motivos.coordenadas && (
                                                        <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                                                            Coordenadas GPS
                                                        </span>
                                                    )}
                                                    {sample.motivos.bairro && (
                                                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                                                            Bairro
                                                        </span>
                                                    )}
                                                    {sample.motivos.logradouro && (
                                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-sans font-bold">
                                                            Logradouro / Número
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 text-slate-500 space-y-1">
                                                    <strong className="text-slate-700 dark:text-slate-300 block mb-1">Antes (Banco Atual):</strong>
                                                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Endereço:</span> {sample.antigo.address || 'N/A'}</div>
                                                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Bairro:</span> {sample.antigo.bairro || 'N/A'}</div>
                                                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">GPS:</span> {sample.antigo.lat && sample.antigo.lng ? `${sample.antigo.lat.toFixed(6)}, ${sample.antigo.lng.toFixed(6)}` : 'Não informado'}</div>
                                                </div>
                                                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded border border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300 space-y-1">
                                                    <strong className="text-emerald-900 dark:text-emerald-200 block mb-1">Depois (Nova Planilha):</strong>
                                                    <div className={sample.motivos.logradouro ? 'font-bold text-blue-700 dark:text-blue-300' : ''}>
                                                        <span className="font-semibold">Endereço:</span> {sample.novo.address || 'N/A'}
                                                    </div>
                                                    <div className={sample.motivos.bairro ? 'font-bold text-amber-700 dark:text-amber-300' : ''}>
                                                        <span className="font-semibold">Bairro:</span> {sample.novo.bairro || 'N/A'}
                                                    </div>
                                                    <div className={sample.motivos.coordenadas ? 'font-bold text-rose-700 dark:text-rose-300' : ''}>
                                                        <span className="font-semibold">GPS:</span> {sample.novo.lat && sample.novo.lng ? `${sample.novo.lat.toFixed(6)}, ${sample.novo.lng.toFixed(6)}` : 'Não informado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Barra de Progresso de Aplicação */}
                    {isApplying && (
                        <div className="space-y-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl">
                            <div className="flex justify-between items-center text-xs font-black text-emerald-800 dark:text-emerald-200">
                                <span>Gravando no IndexedDB em lotes...</span>
                                <span>{applyProgress}%</span>
                            </div>
                            <div className="w-full bg-emerald-200/50 dark:bg-emerald-900/50 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-emerald-600 h-full transition-all duration-200 rounded-full" 
                                    style={{ width: `${applyProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                            onClick={handleApplyUpsert}
                            disabled={isApplying}
                            className="w-full sm:flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                        >
                            {isApplying ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Gravando Banco Local... ({applyProgress}%)
                                </>
                            ) : (
                                <>
                                    <Zap size={16} />
                                    Sincronizar Base no GeoRescue Local ({diffReport.totalNovo.toLocaleString('pt-BR')} UCs)
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDownloadV2Json}
                            disabled={isApplying}
                            className="w-full sm:w-auto px-6 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                            title="Gera e baixa o arquivo JSON consolidado uc_db_v2.json"
                        >
                            <Download size={16} />
                            Baixar uc_db_v2.json
                        </button>
                    </div>
                </div>
            )}

            {/* Popup Modal de Confirmação do Upsert */}
            {showConfirmModal && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header do Modal */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                                        Atualizar GeoRescue Local
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Confirmação de gravação no IndexedDB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Conteúdo Explicativo */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Você está prestes a sincronizar integralmente a base offline. <strong>Todas as UCs descontinuadas ou não constantes nesta planilha serão removidas</strong> para manter a contagem exata da concessionária:
                        </p>

                        {/* Cards de Métricas */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 block tracking-wider">
                                    Novas UCs
                                </span>
                                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                                    +{diffReport?.novas?.toLocaleString('pt-BR') || 0}
                                </span>
                            </div>

                            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                <span className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 block tracking-wider">
                                    UCs Atualizadas
                                </span>
                                <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                                    {diffReport?.alteradas?.toLocaleString('pt-BR') || 0}
                                </span>
                            </div>

                            {diffReport?.removidas > 0 && (
                                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl col-span-2">
                                    <span className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 block tracking-wider">
                                        - UCs Removidas (Não constam na planilha)
                                    </span>
                                    <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                                        {diffReport.removidas.toLocaleString('pt-BR')} registros expurgados da base local
                                    </span>
                                </div>
                            )}

                            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl col-span-2">
                                <span className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400 block tracking-wider">
                                    Base Final no GeoRescue
                                </span>
                                <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                                    {parsedItems?.length?.toLocaleString('pt-BR')} UCs Ativas
                                </span>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-start gap-2.5">
                            <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                A base local será limpa e reconstruída em lotes para evitar duplicidade e garantir 100% de paridade com a planilha fornecida.
                            </p>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={executeUpsert}
                                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
                            >
                                <Check size={16} />
                                Confirmar e Gravar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GeoRescueTab;

