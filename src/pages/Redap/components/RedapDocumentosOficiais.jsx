import React, { useState, useRef } from 'react';
import {
    FileText, Upload, Trash2, CheckCircle, XCircle,
    AlertTriangle, Clock, Download, Eye, Plus, X,
    Paperclip, FileCheck, FileMinus, FilePlus, Edit3
} from 'lucide-react';
import {
    TIPOS_DOCUMENTO_REDAP,
    DOCS_OBRIGATORIOS_HOMOLOGACAO,
    saveDocumentoRedap,
    uploadArquivoDocumento,
    deleteDocumentoRedap,
    addHistoricoAcao,
    verificarDocumentosHomologacao
} from '../../../services/redapService';
import { useToast } from '../../../components/ToastNotification';

// ── Badge de obrigatoriedade ──────────────────────────────────
const ObrigBadge = ({ tipo }) => {
    const meta = TIPOS_DOCUMENTO_REDAP.find(t => t.value === tipo);
    if (!meta) return null;
    const map = {
        OBRIGATORIO: { label: 'Obrigatório', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
        CONDICIONAL:  { label: 'Condicional', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' },
        RECOMENDADO:  { label: 'Recomendado', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
        OPCIONAL:     { label: 'Opcional',    cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    };
    const { label, cls } = map[meta.obrigatoriedade] || map.OPCIONAL;
    return <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
};

// ── Badge de status do documento ──────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        ANEXADO:   { icon: <CheckCircle size={12} />, label: 'Anexado',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        DISPENSADO: { icon: <FileMinus size={12} />,   label: 'Dispensado', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
        PENDENTE:  { icon: <Clock size={12} />,        label: 'Pendente',  cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    const { icon, label, cls } = map[status] || map.PENDENTE;
    return (
        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
            {icon}{label}
        </span>
    );
};

// ── Modal de adição/edição de documento ───────────────────────
const DocumentoModal = ({ isOpen, onClose, onSave, eventoId, user, initialDoc = null, initialMode = 'create' }) => {
    const [mode, setMode] = useState(initialMode);
    const [tipo, setTipo] = useState(initialDoc?.tipo || TIPOS_DOCUMENTO_REDAP[0].value);
    const [nomePersonalizado, setNomePersonalizado] = useState(initialDoc?.nome_personalizado || TIPOS_DOCUMENTO_REDAP[0].value);
    const [numeroDoc, setNumeroDoc] = useState(initialDoc?.numero_documento || '');
    const [dataDoc, setDataDoc] = useState(initialDoc?.data_documento || '');
    const [observacao, setObservacao] = useState(initialDoc?.observacao || '');
    const [status, setStatus] = useState(initialDoc?.status_documento || 'PENDENTE');
    const [dispensadoMotivo, setDispensadoMotivo] = useState(initialDoc?.dispensado_motivo || '');
    const [arquivo, setArquivo] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();
    const { toast } = useToast();

    // Sincroniza o modo e os dados caso o modal seja reaberto
    React.useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setTipo(initialDoc?.tipo || TIPOS_DOCUMENTO_REDAP[0].value);
            setNomePersonalizado(initialDoc?.nome_personalizado || (initialDoc?.tipo ? initialDoc.tipo : TIPOS_DOCUMENTO_REDAP[0].value));
            setNumeroDoc(initialDoc?.numero_documento || '');
            setDataDoc(initialDoc?.data_documento || '');
            setObservacao(initialDoc?.observacao || '');
            setStatus(initialDoc?.status_documento || 'PENDENTE');
            setDispensadoMotivo(initialDoc?.dispensado_motivo || '');
            setArquivo(null);
        }
    }, [isOpen, initialDoc, initialMode]);

    const handleTipoChange = (val) => {
        setTipo(val);
        if (val !== 'Outros') setNomePersonalizado(val);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (arquivo && arquivo.size > 20 * 1024 * 1024) {
            toast('Arquivo excede o limite de 20 MB.', 'error');
            return;
        }
        setSaving(true);
        try {
            const docPayload = {
                id: initialDoc?.id,
                evento_id: eventoId,
                tipo,
                nome_personalizado: nomePersonalizado || tipo,
                numero_documento: numeroDoc,
                data_documento: dataDoc || null,
                observacao,
                status_documento: arquivo ? 'ANEXADO' : status,
                dispensado_motivo: status === 'DISPENSADO' ? dispensadoMotivo : null,
            };

            const savedDoc = await saveDocumentoRedap(docPayload, user?.id);

            if (arquivo && savedDoc?.id) {
                await uploadArquivoDocumento(savedDoc.id, eventoId, arquivo);
            }

            // Registra no histórico
            await addHistoricoAcao({
                evento_id: eventoId,
                usuario_id: user?.id,
                usuario_nome: user?.full_name || 'Defesa Civil',
                acao: initialDoc?.id ? 'DOCUMENTO_ATUALIZADO' : 'DOCUMENTO_ADICIONADO',
                descricao: `Documento "${nomePersonalizado || tipo}" ${initialDoc?.id ? 'atualizado' : 'adicionado'}.`
            });

            onSave();
            onClose();
        } catch (err) {
            console.error('[Documentos] Erro completo:', err);
            toast(`Erro: ${err.message || 'Verifique as permissões ou a conexão.'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg border border-slate-200 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-black text-base uppercase tracking-wider">
                            {mode === 'view' ? 'Visualizar Documento' : mode === 'edit' ? 'Editar Documento' : 'Novo Documento'}
                        </h3>
                        <p className="text-blue-200 text-xs font-bold mt-0.5">Gestão Documental — REDAP</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Tipo */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tipo de Documento *</label>
                        <select
                            disabled={mode === 'view'}
                            value={tipo}
                            onChange={e => handleTipoChange(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {TIPOS_DOCUMENTO_REDAP.map(t => (
                                <option key={t.value} value={t.value}>{t.value}</option>
                            ))}
                        </select>
                        <div className="mt-1.5"><ObrigBadge tipo={tipo} /></div>
                    </div>

                    {/* Nome personalizado (para tipo "Outros") */}
                    {tipo === 'Outros' && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nome do Documento *</label>
                            <input
                                type="text"
                                required
                                disabled={mode === 'view'}
                                value={nomePersonalizado}
                                onChange={e => setNomePersonalizado(e.target.value)}
                                placeholder="Descreva o tipo de documento"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {/* Número */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Número (ex: Decreto nº 012)</label>
                            <input
                                type="text"
                                disabled={mode === 'view'}
                                value={numeroDoc}
                                onChange={e => setNumeroDoc(e.target.value)}
                                placeholder="Nº do documento"
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                        {/* Data */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Data do Documento</label>
                            <input
                                type="date"
                                disabled={mode === 'view'}
                                value={dataDoc}
                                onChange={e => setDataDoc(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Observação */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Observação</label>
                        <textarea
                            value={observacao}
                            disabled={mode === 'view'}
                            onChange={e => setObservacao(e.target.value)}
                            placeholder="Informações adicionais sobre o documento..."
                            rows={2}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                            value={status}
                            disabled={mode === 'view'}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <option value="PENDENTE">Pendente</option>
                            <option value="DISPENSADO">Dispensado (com justificativa)</option>
                        </select>
                    </div>

                    {/* Motivo da dispensa */}
                    {status === 'DISPENSADO' && (
                        <div>
                            <label className="block text-[10px] font-black text-rose-500 uppercase tracking-wider mb-1.5">Motivo da Dispensa * (obrigatório)</label>
                            <textarea
                                required
                                disabled={mode === 'view'}
                                value={dispensadoMotivo}
                                onChange={e => setDispensadoMotivo(e.target.value)}
                                placeholder="Justifique formalmente a ausência ou inaplicabilidade deste documento..."
                                rows={3}
                                className="w-full p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                        </div>
                    )}

                    {/* Upload de arquivo */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Arquivo (PDF, DOCX, JPG — máx. 20 MB)
                        </label>
                        <div
                            onClick={() => mode !== 'view' && fileRef.current?.click()}
                            className={`border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${mode === 'view' ? 'opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500'}`}
                        >
                            {arquivo ? (
                                <>
                                    <FileCheck size={24} className="text-emerald-500" />
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center">{arquivo.name}</p>
                                    <p className="text-[10px] text-slate-400">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                                </>
                            ) : initialDoc?.arquivo_url ? (
                                <>
                                    <FileText size={24} className="text-blue-500" />
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Arquivo atual anexado</p>
                                    {mode !== 'view' && <p className="text-[10px] text-blue-500 mt-1">Clique para substituir</p>}
                                </>
                            ) : (
                                <>
                                    <Upload size={24} className="text-slate-400" />
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {mode === 'view' ? 'Nenhum arquivo anexado' : 'Clique para selecionar o arquivo'}
                                    </p>
                                </>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                disabled={mode === 'view'}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={e => setArquivo(e.target.files[0] || null)}
                            />
                        </div>
                        {initialDoc?.arquivo_url && !arquivo && (
                            <a
                                href={initialDoc.arquivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 hover:underline"
                            >
                                <Download size={12} /> Ver arquivo atual
                            </a>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all"
                        >
                            {mode === 'view' ? 'Fechar' : 'Cancelar'}
                        </button>
                        {mode === 'view' ? (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMode('edit'); }}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Edit3 size={14} /> Editar Documento
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[11px] active:scale-95 transition-all shadow-lg hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileCheck size={14} />}
                                {saving ? 'Salvando...' : 'Salvar Documento'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────
const RedapDocumentosOficiais = ({ eventoId, user, documentos, onUpdate }) => {
    const { toast } = useToast();
    const [showModal, setShowModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [deletingId, setDeletingId] = useState(null);

    const { liberado, pendentes } = verificarDocumentosHomologacao(documentos);

    const handleDelete = async (doc) => {
        if (!window.confirm(`Excluir o documento "${doc.nome_personalizado}"?`)) return;
        setDeletingId(doc.id);
        try {
            await deleteDocumentoRedap(doc);
            await addHistoricoAcao({
                evento_id: eventoId,
                usuario_id: user?.id,
                usuario_nome: user?.full_name || 'Defesa Civil',
                acao: 'DOCUMENTO_EXCLUIDO',
                descricao: `Documento "${doc.nome_personalizado}" excluído.`
            });
            toast('Documento removido.', 'success');
            onUpdate();
        } catch {
            toast('Erro ao excluir documento.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 p-7 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Paperclip size={16} className="text-blue-500" /> Documentos Oficiais
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                        Exclusivo Defesa Civil / COMPDEC
                    </p>
                </div>
                <button
                    onClick={() => { setEditingDoc(null); setModalMode('create'); setShowModal(true); }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-1 shadow-md active:scale-95"
                >
                    <FilePlus size={14} /> Adicionar
                </button>
            </div>

            {/* Alerta de documentos obrigatórios pendentes */}
            {!liberado && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            ⚠ Para avançar para Homologação, os seguintes documentos precisam ser anexados ou dispensados:
                        </p>
                        <ul className="mt-1.5 space-y-0.5">
                            {pendentes.map(p => (
                                <li key={p} className="text-[11px] text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5">
                                    <XCircle size={10} /> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {liberado && documentos.length > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-2.5">
                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        Todos os documentos obrigatórios resolvidos — Homologação habilitada
                    </p>
                </div>
            )}

            {/* Lista de documentos */}
            <div className="space-y-3">
                {documentos.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                        <FileText size={36} className="text-slate-200 dark:text-slate-700 mx-auto" />
                        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Nenhum documento cadastrado
                        </p>
                        <p className="text-[11px] text-slate-400">Adicione os documentos oficiais do processo</p>
                    </div>
                ) : (
                    documentos.map(doc => (
                        <div
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-xl shrink-0 mt-0.5">
                                    <FileText size={16} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{doc.nome_personalizado}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <StatusBadge status={doc.status_documento} />
                                        <ObrigBadge tipo={doc.tipo} />
                                        {doc.numero_documento && (
                                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {doc.numero_documento}
                                            </span>
                                        )}
                                        {doc.data_documento && (
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {new Date(doc.data_documento + 'T00:00').toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                    {doc.status_documento === 'DISPENSADO' && doc.dispensado_motivo && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic truncate max-w-xs">
                                            Motivo: {doc.dispensado_motivo}
                                        </p>
                                    )}
                                    {doc.observacao && (
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">{doc.observacao}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {doc.arquivo_url && (
                                    <a
                                        href={doc.arquivo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                                        title="Baixar arquivo"
                                    >
                                        <Download size={14} />
                                    </a>
                                )}
                                <button
                                    onClick={() => { setEditingDoc(doc); setModalMode('view'); setShowModal(true); }}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                    title="Visualizar"
                                >
                                    <Eye size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
                                    title="Excluir"
                                >
                                    {deletingId === doc.id
                                        ? <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                                        : <Trash2 size={14} />
                                    }
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de adição/edição */}
            <DocumentoModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingDoc(null); }}
                onSave={onUpdate}
                eventoId={eventoId}
                user={user}
                initialDoc={editingDoc}
                initialMode={modalMode}
            />
        </div>
    );
};

export default RedapDocumentosOficiais;
