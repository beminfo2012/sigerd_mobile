import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, UploadCloud, Search, Filter, 
    ChevronDown, X, Eye, FileText, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';
import { getAlertasCemaden, parseAlertaCemaden, processarUploadCemaden } from '../../services/alertasCemadenService';
import { useToast } from '../../components/ToastNotification';
import { UserContext } from '../../App';

const NIVEL_COLORS = {
    'OBSERVACAO': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'MODERADO': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'ALTO': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'MUITO_ALTO': 'bg-red-600 text-white dark:bg-red-900 dark:text-red-200',
    'CESSAR': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_COLORS = {
    'ATIVO': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200',
    'CESSADO': 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200',
    'EXCLUIDO': 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-200',
};

const AlertasCemadenList = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const user = React.useContext(UserContext);
    
    const [alertas, setAlertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ATIVO');
    const [filterCategoria, setFilterCategoria] = useState('TODAS');
    
    // Upload state
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        loadAlertas();
    }, [filterStatus, filterCategoria]);

    const loadAlertas = async () => {
        setLoading(true);
        try {
            const data = await getAlertasCemaden({ status: filterStatus, categoria: filterCategoria });
            setAlertas(data);
        } catch (error) {
            toast.error('Erro ao carregar alertas CEMADEN.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Apenas arquivos PDF são aceitos.');
            return;
        }

        setSelectedFile(file);
        setUploading(true);
        try {
            const parsed = await parseAlertaCemaden(file);
            setPreviewData(parsed);
        } catch (error) {
            toast.error('Falha ao processar PDF. Tem certeza que é um Alerta do CEMADEN?');
            console.error(error);
            setSelectedFile(null);
        } finally {
            setUploading(false);
        }
    };

    const confirmUpload = async () => {
        if (!selectedFile || !previewData) return;
        setUploading(true);
        try {
            const id = await processarUploadCemaden(selectedFile, previewData, user);
            toast.success('Alerta importado com sucesso!');
            setPreviewData(null);
            setSelectedFile(null);
            loadAlertas(); // reload list
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            toast.error(`Falha ao salvar: ${error.message}`);
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setPreviewData(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 transition-colors">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
                        title="Voltar para o Dashboard"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-white leading-tight">Alertas CEMADEN</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monitoramento Operacional</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 border border-blue-400 dark:border-blue-300/30 disabled:opacity-50"
                    >
                        <UploadCloud size={18} /> {uploading ? 'Processando...' : 'Importar PDF'}
                    </button>
                </div>
            </header>

            <main className="p-4 max-w-6xl mx-auto space-y-4">
                {/* Modal de Preview (Overlaied when previewData exists) */}
                {previewData && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-blue-200 dark:border-blue-800/50 mb-6 shadow-xl relative animate-in fade-in slide-in-from-top-4">
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button onClick={cancelUpload} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 dark:text-white">Confirmação de Importação</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedFile?.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nº do Alerta</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{previewData.numero_alerta || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ação Detectada</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{previewData.tipo_documento}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nível</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${NIVEL_COLORS[previewData.nivel] || NIVEL_COLORS['OBSERVACAO']}`}>
                                    {previewData.nivel || 'N/A'}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Município</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{previewData.municipio} - {previewData.uf}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-4">
                            <button onClick={cancelUpload} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={confirmUpload} disabled={uploading} className="px-5 py-2.5 rounded-xl font-black bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors flex items-center gap-2">
                                <CheckCircle size={18} /> Confirmar e Salvar
                            </button>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 rounded-xl outline-none font-bold text-xs uppercase tracking-wider appearance-none border-2 bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <option value="TODOS">Todos os Status</option>
                            <option value="ATIVO">Ativos</option>
                            <option value="CESSADO">Cessados</option>
                            <option value="EXCLUIDO">Excluídos</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                        <select 
                            value={filterCategoria}
                            onChange={(e) => setFilterCategoria(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 rounded-xl outline-none font-bold text-xs uppercase tracking-wider appearance-none border-2 bg-slate-50 border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <option value="TODAS">Todas as Categorias</option>
                            <option value="GEOLOGICO">Geológico</option>
                            <option value="HIDROLOGICO">Hidrológico</option>
                            <option value="OUTRO">Outros</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Lista */}
                {loading && !uploading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : alertas.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum alerta encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alertas.map(alerta => (
                            <div key={alerta.id} onClick={() => navigate(`/alertas-cemaden/${alerta.id}`)} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 transition-all cursor-pointer group hover:shadow-lg flex flex-col">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${alerta.status === 'ATIVO' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${STATUS_COLORS[alerta.status]}`}>
                                            {alerta.status}
                                        </span>
                                        {alerta.pendencia_vinculo && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border text-rose-500 bg-rose-50 border-rose-200" title="Pendência de vínculo de abertura">
                                                ÓRFÃO
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{alerta.numero_alerta}</span>
                                </div>
                                
                                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg mb-1 leading-tight">{alerta.municipio}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{alerta.categoria_risco} - {alerta.tipo_evento}</p>
                                
                                <div className="mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${NIVEL_COLORS[alerta.nivel_atual] || NIVEL_COLORS['OBSERVACAO']}`}>
                                        {alerta.nivel_atual}
                                    </span>
                                    <button className="text-blue-600 font-bold text-xs flex items-center gap-1 group-hover:underline">
                                        Detalhes <Eye size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AlertasCemadenList;
