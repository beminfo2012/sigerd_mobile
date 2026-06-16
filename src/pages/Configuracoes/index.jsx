import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Image as ImageIcon, Upload, Trash2, Eye, EyeOff, Loader2, Plus, X, Check, AlertTriangle, Map, Layers, Info } from 'lucide-react';
import { listOrthofotos, uploadOrthofoto, updateOrthofoto, deleteOrthofoto } from '../../services/orthofotoService';
import { toast } from '../../components/ToastNotification';

const DEFAULT_BOUNDS = [[-20.06, -40.80], [-19.98, -40.70]];

const ConfiguracoesPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [orthofotos, setOrthofotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [formNome, setFormNome] = useState('');
    const [formDescricao, setFormDescricao] = useState('');
    const [formOpacidade, setFormOpacidade] = useState(0.7);
    const [formBounds, setFormBounds] = useState({ s: '', w: '', n: '', e: '' });
    const [selectedFile, setSelectedFile] = useState(null);

    const loadOrthofotos = async () => {
        setLoading(true);
        try {
            const data = await listOrthofotos();
            setOrthofotos(data.map(o => ({
                ...o,
                bounds: o.bounds ? (typeof o.bounds === 'string' ? JSON.parse(o.bounds) : o.bounds) : null
            })));
        } catch (e) {
            toast.error('Erro ao carregar orthofotos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrthofotos(); }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setFormNome(file.name.replace(/\.[^.]+$/, ''));
        setShowForm(true);
    };

    const handleUpload = async () => {
        if (!selectedFile) return toast.error('Selecione um arquivo.');
        if (!formNome.trim()) return toast.error('Informe um nome.');

        const bounds = (formBounds.s && formBounds.w && formBounds.n && formBounds.e)
            ? [[parseFloat(formBounds.s), parseFloat(formBounds.w)], [parseFloat(formBounds.n), parseFloat(formBounds.e)]]
            : DEFAULT_BOUNDS;

        setUploading(true);
        try {
            await uploadOrthofoto(selectedFile, {
                nome: formNome,
                descricao: formDescricao,
                bounds,
                opacidade: formOpacidade,
            });
            toast.success('Orthofoto adicionada com sucesso!');
            window.dispatchEvent(new CustomEvent('orthofotos-updated'));
            setShowForm(false);
            setSelectedFile(null);
            setFormNome(''); setFormDescricao(''); setFormOpacidade(0.7);
            setFormBounds({ s: '', w: '', n: '', e: '' });
            await loadOrthofotos();
        } catch (e) {
            console.error(e);
            toast.error('Erro ao fazer upload da orthofoto.');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleAtivo = async (orto) => {
        try {
            await updateOrthofoto(orto.id, { ativo: !orto.ativo });
            window.dispatchEvent(new CustomEvent('orthofotos-updated'));
            setOrthofotos(prev => prev.map(o => o.id === orto.id ? { ...o, ativo: !o.ativo } : o));
        } catch (e) {
            toast.error('Erro ao atualizar orthofoto.');
        }
    };

    const handleDelete = async (orto) => {
        if (!window.confirm(`Deseja remover permanentemente a orthofoto "${orto.nome}"? Esta ação não pode ser desfeita.`)) return;
        setDeletingId(orto.id);
        try {
            await deleteOrthofoto(orto);
            window.dispatchEvent(new CustomEvent('orthofotos-updated'));
            setOrthofotos(prev => prev.filter(o => o.id !== orto.id));
            toast.success('Orthofoto removida.');
        } catch (e) {
            toast.error('Erro ao remover orthofoto.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-20 shadow-sm shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                        <Layers size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-slate-800 dark:text-slate-100 leading-tight">Gerenciar Orthofotos</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão de Camadas GIS</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-4xl mx-auto w-full">

                {/* Info Card */}
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex gap-3">
                    <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Orthofotos Globais do Sistema</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5 leading-relaxed">
                            As orthofotos cadastradas aqui aparecem como camadas de sobreposição em <strong>todos os mapas</strong> do SIGERD (Dashboard, GeoRescue, Vistorias, REDAP etc.). Ative ou desative individualmente sem precisar reenviar o arquivo.
                        </p>
                    </div>
                </div>

                {/* Seção de Orthofotos */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center">
                                <Layers size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">Orthofotos e Camadas GIS</h2>
                                <p className="text-xs text-slate-400 font-bold">{orthofotos.length} arquivo(s) cadastrado(s)</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-emerald-200 dark:shadow-none"
                        >
                            <Plus size={14} /> Nova Orthofoto
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg,.tif,.tiff"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Form de Upload */}
                    {showForm && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Upload size={14} className="text-emerald-600" /> Configurar Nova Orthofoto
                                </p>
                                <button onClick={() => { setShowForm(false); setSelectedFile(null); }} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                                    <X size={14} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arquivo selecionado</label>
                                    <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 truncate flex items-center gap-2">
                                        <ImageIcon size={12} className="text-emerald-500 shrink-0" />
                                        {selectedFile?.name || '—'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Exibido *</label>
                                    <input
                                        value={formNome}
                                        onChange={e => setFormNome(e.target.value)}
                                        placeholder="Ex: Orthofoto 2024 – Zona Urbana"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                                    <input
                                        value={formDescricao}
                                        onChange={e => setFormDescricao(e.target.value)}
                                        placeholder="Descrição opcional da cobertura"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                            </div>

                            {/* Bounds */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Map size={10} /> Limites Geográficos (Bounds)
                                    <span className="text-slate-300 font-normal normal-case ml-1">— deixe em branco para usar padrão municipal</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[['s', 'Sul (Lat Min)'], ['w', 'Oeste (Lng Min)'], ['n', 'Norte (Lat Max)'], ['e', 'Leste (Lng Max)']].map(([key, label]) => (
                                        <div key={key} className="space-y-1">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                                            <input
                                                value={formBounds[key]}
                                                onChange={e => setFormBounds(prev => ({ ...prev, [key]: e.target.value }))}
                                                placeholder="-20.04"
                                                type="number"
                                                step="0.0001"
                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/30"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Opacidade */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opacidade Padrão</label>
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{Math.round(formOpacidade * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="1" step="0.05" value={formOpacidade}
                                    onChange={e => setFormOpacidade(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
                                />
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                {uploading ? 'Enviando para a nuvem...' : 'Salvar Orthofoto'}
                            </button>
                        </div>
                    )}

                    {/* Lista */}
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center gap-3">
                                <Loader2 size={28} className="animate-spin text-slate-300" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
                            </div>
                        ) : orthofotos.length === 0 ? (
                            <div className="p-12 flex flex-col items-center gap-3 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                                    <Layers size={28} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Nenhuma orthofoto cadastrada</p>
                                <p className="text-xs text-slate-400">Clique em "Nova Orthofoto" para adicionar a primeira camada GIS.</p>
                            </div>
                        ) : (
                            orthofotos.map(orto => (
                                <div key={orto.id} className={`p-4 flex items-center gap-4 transition-colors ${!orto.ativo ? 'opacity-50' : ''}`}>
                                    {/* Preview thumb */}
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        {orto.tipo === 'TIFF' ? (
                                            <div className="text-center p-1">
                                                <Map size={20} className="text-blue-400 mx-auto" />
                                                <p className="text-[8px] font-black text-blue-400 mt-0.5">TIFF</p>
                                            </div>
                                        ) : (
                                            <img
                                                src={orto.url}
                                                alt={orto.nome}
                                                className="w-full h-full object-cover"
                                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                            />
                                        )}
                                        <div className="w-full h-full hidden items-center justify-center">
                                            <ImageIcon size={20} className="text-slate-400" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{orto.nome}</p>
                                        {orto.descricao && <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{orto.descricao}</p>}
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${orto.ativo ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                                {orto.ativo ? '● Ativa' : '○ Inativa'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                {orto.tipo} · {Math.round((orto.opacidade ?? 0.7) * 100)}% opacidade
                                            </span>
                                            {orto.bounds && (
                                                <span className="text-[9px] font-bold text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-full">
                                                    Bounds definidos
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggleAtivo(orto)}
                                            title={orto.ativo ? 'Desativar' : 'Ativar'}
                                            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
                                        >
                                            {orto.ativo ? <Eye size={16} className="text-emerald-500" /> : <EyeOff size={16} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(orto)}
                                            disabled={deletingId === orto.id}
                                            title="Excluir"
                                            className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-rose-400"
                                        >
                                            {deletingId === orto.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Aviso SQL */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Pré-requisito de Banco de Dados</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed font-medium">
                            Execute a migration SQL <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-[10px]">create_orthofotos_table.sql</code> no Supabase antes de usar este módulo.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ConfiguracoesPage;
